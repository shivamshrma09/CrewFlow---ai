import fs from "fs";
import Groq from "groq-sdk";
import dotenv from "dotenv";
dotenv.config();

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

/**
 * Transcribe audio file using Groq Whisper
 * Supports: mp3, mp4, mpeg, mpga, m4a, wav, webm
 * Max file size: 25MB
 */
export async function transcribeAudio(filePath, language = "hi") {
  const fileStream = fs.createReadStream(filePath);

  const transcription = await groq.audio.transcriptions.create({
    file: fileStream,
    model: "whisper-large-v3",
    language,                    // hi=Hindi, en=English, mr=Marathi etc
    response_format: "verbose_json",  // gives word-level timestamps too
  });

  return {
    text: transcription.text,
    language: transcription.language,
    duration: transcription.duration,
    segments: transcription.segments?.map((s) => ({
      start: s.start,
      end: s.end,
      text: s.text,
    })) || [],
  };
}
