import { execFile } from 'child_process'
import { promisify } from 'util'
import ffmpeg from 'fluent-ffmpeg'
import ffmpegStatic from 'ffmpeg-static'
import Groq from 'groq-sdk'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import dotenv from 'dotenv'
dotenv.config()

const execFileAsync = promisify(execFile)
ffmpeg.setFfmpegPath(ffmpegStatic)

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const TMP_DIR = path.join(__dirname, '../../../uploads/shorts_tmp')
const YTDLP = path.join(__dirname, '../../../bin/yt-dlp.exe')

if (!fs.existsSync(TMP_DIR)) fs.mkdirSync(TMP_DIR, { recursive: true })

// Get video info using yt-dlp
async function getVideoInfo(videoUrl) {
  const { stdout } = await execFileAsync(YTDLP, [
    '--dump-json',
    '--no-playlist',
    videoUrl
  ])
  const info = JSON.parse(stdout)
  return {
    title: info.title,
    description: (info.description || '').slice(0, 2000),
    duration: info.duration,
    videoId: info.id,
  }
}

// AI picks best segments
async function getShortSegments(title, description, duration, count) {
  const prompt = `You are a viral YouTube Shorts editor. Given a YouTube video title, description and total duration in seconds, suggest exactly ${count} best segments to cut as YouTube Shorts (each 30-58 seconds).

Title: "${title}"
Description: "${description.slice(0, 800)}"
Total Duration: ${duration} seconds

Rules:
- Each segment MUST be 30-58 seconds (endTime - startTime between 30 and 58)
- All times must be within 0 and ${duration}
- Pick high-retention viral moments
- Spread segments across the video

Respond ONLY with valid JSON:
{
  "segments": [
    { "index": 1, "title": "catchy title", "startTime": 10, "endTime": 60, "why": "reason" }
  ]
}`

  const res = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.7,
    response_format: { type: 'json_object' },
  })
  const parsed = JSON.parse(res.choices[0].message.content)
  return (parsed.segments || []).slice(0, count)
}

// Download video using yt-dlp
async function downloadVideo(videoUrl, outputPath) {
  await execFileAsync(YTDLP, [
    '-f', 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best',
    '--merge-output-format', 'mp4',
    '-o', outputPath,
    '--no-playlist',
    videoUrl
  ])
}

// Cut + resize to 9:16 using ffmpeg
function cutAndResize(inputPath, outputPath, startTime, duration) {
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .setStartTime(startTime)
      .setDuration(duration)
      .videoFilter([
        'crop=ih*9/16:ih',
        'scale=1080:1920'
      ])
      .outputOptions([
        '-c:v libx264',
        '-c:a aac',
        '-preset fast',
        '-crf 23',
        '-movflags +faststart'
      ])
      .output(outputPath)
      .on('end', resolve)
      .on('error', reject)
      .run()
  })
}

// Upload to ImageKit
async function uploadToImageKit(filePath, fileName) {
  const { default: ImageKit } = await import('@imagekit/nodejs')
  const imagekit = new ImageKit({
    publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
    privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
    urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT,
  })
  const fileBuffer = fs.readFileSync(filePath)
  const result = await imagekit.upload({
    file: fileBuffer,
    fileName,
    folder: '/crewflow/shorts',
  })
  return result.url
}

// Main export
export async function generateShorts(videoUrl, count = 3) {
  const sessionId = Date.now()
  const rawVideoPath = path.join(TMP_DIR, `raw_${sessionId}.mp4`)
  const shortPaths = []

  try {
    // 1. Get info
    const { title, description, duration, videoId } = await getVideoInfo(videoUrl)

    if (duration < 60) {
      throw new Error('Video too short — minimum 60 seconds required')
    }

    // 2. AI segments
    const segments = await getShortSegments(title, description, duration, count)

    // 3. Download
    await downloadVideo(videoUrl, rawVideoPath)

    // 4. Cut each segment
    const results = []
    for (const seg of segments) {
      const segDuration = seg.endTime - seg.startTime
      const shortPath = path.join(TMP_DIR, `short_${sessionId}_${seg.index}.mp4`)
      shortPaths.push(shortPath)

      await cutAndResize(rawVideoPath, shortPath, seg.startTime, segDuration)

      const url = await uploadToImageKit(
        shortPath,
        `short_${videoId}_${seg.index}_${sessionId}.mp4`
      )

      results.push({
        index: seg.index,
        title: seg.title,
        why: seg.why,
        startTime: seg.startTime,
        endTime: seg.endTime,
        duration: segDuration,
        url,
      })
    }

    return { source_title: title, source_duration: duration, shorts: results }

  } finally {
    ;[rawVideoPath, ...shortPaths].forEach(f => {
      try { if (fs.existsSync(f)) fs.unlinkSync(f) } catch {}
    })
  }
}
