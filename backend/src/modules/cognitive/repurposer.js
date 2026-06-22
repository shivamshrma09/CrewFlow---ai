import Groq from "groq-sdk";
import dotenv from "dotenv";
dotenv.config();

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const LANG_INSTRUCTION = {
  hindi: "Write everything in Hindi (Devanagari script)",
  english: "Write everything in English",
  hinglish: "Write everything in Hinglish (Hindi-English mix, Roman script)",
};

export async function repurposeContent({ script, language = "hinglish" }) {
  const prompt = `You are a content repurposing expert for Indian social media creators.
${LANG_INSTRUCTION[language] || LANG_INSTRUCTION.hinglish}

Given this video script/content:
"""
${script.slice(0, 3000)}
"""

Repurpose into 10 assets as JSON:
{
  "shorts_scripts": [
    {"title": "...", "script": "60-second script for Short/Reel"},
    {"title": "...", "script": "..."},
    {"title": "...", "script": "..."}
  ],
  "tweet_thread": ["Tweet 1 (hook)", "Tweet 2", "Tweet 3", "Tweet 4", "Tweet 5 (CTA)"],
  "linkedin_post": "Full LinkedIn post with hook, value, and CTA",
  "blog_outline": {
    "title": "...",
    "sections": ["Section 1: ...", "Section 2: ...", "Section 3: ...", "Conclusion: ..."]
  },
  "instagram_captions": ["Caption 1 with hashtags", "Caption 2 with hashtags", "Caption 3 with hashtags"],
  "seo_package": {
    "description": "YouTube description (150 words)",
    "tags": ["tag1", "tag2", "tag3", "tag4", "tag5", "tag6", "tag7", "tag8", "tag9", "tag10"]
  }
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
