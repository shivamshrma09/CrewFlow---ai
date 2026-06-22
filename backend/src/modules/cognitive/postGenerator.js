import Groq from "groq-sdk";
import fs from "fs";
import https from "https";
import dotenv from "dotenv";
dotenv.config();

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

/**
 * Generates catchy title, description, tags, and image prompts based on user's concept.
 */
export async function generatePostMetadata(promptText) {
  const prompt = `You are a viral content strategist and YouTube copywriter.
Based on the creator's post idea or video prompt below, generate:
1. A catchy, clickable, high-CTR viral title (optimized for YouTube/X).
2. An engaging description including hooks, brief summary, and standard hashtags.
3. Relevant search tags / keywords (array of strings).
4. A highly descriptive image generation prompt (to generate a YouTube thumbnail representing the video).

Creator's Post/Video Idea:
"${promptText}"

Respond ONLY with a valid JSON object matching this schema:
{
  "title": "catchy viral title",
  "description": "engaging description",
  "tags": ["tag1", "tag2", "tag3"],
  "image_prompt": "highly detailed image generation prompt with cinematic lighting, 8k resolution, vibrant colors"
}
Do not return any other text, markdown blocks, or preambles.`;

  const response = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.8,
    response_format: { type: "json_object" },
  });

  return JSON.parse(response.choices[0].message.content);
}

/**
 * Uploads a video to YouTube using the authenticated client.
 */
export async function uploadVideoToYouTube(youtube, { filePath, title, description, privacyStatus = "public" }) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Video file not found at ${filePath}`);
  }

  const response = await youtube.videos.insert({
    part: "snippet,status",
    requestBody: {
      snippet: {
        title,
        description,
        categoryId: "22", // People & Blogs
      },
      status: {
        privacyStatus, // public, private, unlisted
        selfDeclaredMadeForKids: false,
      },
    },
    media: {
      body: fs.createReadStream(filePath),
    },
  });

  return response.data;
}

/**
 * Helper to download an image from a URL and upload it as a video thumbnail.
 */
export async function setVideoThumbnail(youtube, videoId, thumbnailUrl) {
  return new Promise((resolve, reject) => {
    https.get(thumbnailUrl, (res) => {
      if (res.statusCode !== 200) {
        reject(new Error(`Failed to fetch image from URL: ${res.statusCode}`));
        return;
      }
      const chunks = [];
      res.on("data", (chunk) => chunks.push(chunk));
      res.on("end", async () => {
        try {
          const buffer = Buffer.concat(chunks);
          const response = await youtube.thumbnails.set({
            videoId,
            media: {
              mimeType: "image/jpeg",
              body: buffer,
            },
          });
          resolve(response.data);
        } catch (err) {
          reject(err);
        }
      });
      res.on("error", (err) => reject(err));
    });
  });
}
