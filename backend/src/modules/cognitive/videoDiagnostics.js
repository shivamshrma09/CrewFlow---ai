import Groq from "groq-sdk";
import dotenv from "dotenv";

dotenv.config();

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

/**
 * Run a full SEO and hook diagnostic on a specific video
 */
export async function diagnoseVideoPerformance(youtube, videoId) {
  // Fetch video details
  const videoRes = await youtube.videos.list({
    part: "snippet,statistics,contentDetails",
    id: videoId
  });
  const video = videoRes.data.items?.[0];
  if (!video) throw new Error("Video not found");

  const { title, description, tags = [] } = video.snippet;
  const { viewCount = 0, likeCount = 0, commentCount = 0 } = video.statistics;
  
  const prompt = `You are an expert YouTube SEO analyst and growth consultant.
Diagnose this video's metadata and performance:

Title: "${title}"
Description: "${description}"
Tags: ${JSON.stringify(tags)}
Views: ${viewCount}
Likes: ${likeCount}
Comments: ${commentCount}

Analyze the Title, Description, and Tags. Rate the overall optimization score out of 100.
Identify weak points and provide exact, ready-to-use copy replacements.

Return JSON only:
{
  "score": 0,
  "verdict": "Overall summary of what is holding this video back",
  "diagnostics": {
    "title_critique": "Title critique here",
    "description_critique": "Description critique here",
    "tags_critique": "Tags critique here"
  },
  "suggestions": {
    "titles": ["Alternative Title 1", "Alternative Title 2", "Alternative Title 3"],
    "tags": ["newtag1", "newtag2", "newtag3"],
    "hook_remedy": "A rewritten 15-second opening hook script designed to immediately lock in viewer attention."
  }
}

Respond ONLY with valid JSON.`;

  const response = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.7,
    response_format: { type: "json_object" },
  });

  return JSON.parse(response.choices[0].message.content);
}

/**
 * Rewrite script sections for drop points in retention graph
 */
export async function scriptDoctorRewrite(timestamp, reason, title) {
  const prompt = `You are a professional YouTube scriptwriter and engagement specialist.
A creator's video titled "${title}" experiences a high audience drop-off at timestamp "${timestamp}" because of this reason: "${reason}".

Write a rewritten, highly engaging script replacement for this segment of the video (approx 30-45 seconds) to retain the viewer's attention. Keep the tone engaging and direct. Add instructions for visuals or B-roll in brackets, e.g. [Show B-roll of graph].

Return JSON only:
{
  "original_segment_issue": "Summarize the issue briefly",
  "rewritten_script": "The rewritten script text with visual cues...",
  "writer_tip": "Specific presentation or editing tip (e.g. sound effect, pattern interrupt)"
}

Respond ONLY with valid JSON.`;

  const response = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.8,
    response_format: { type: "json_object" },
  });

  return JSON.parse(response.choices[0].message.content);
}
