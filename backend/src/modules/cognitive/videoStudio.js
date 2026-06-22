import Groq from 'groq-sdk'
import dotenv from 'dotenv'
dotenv.config()

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

export async function generateVideoPackage({ topic, niche, language, style, duration }) {
  const langMap = {
    hindi: 'Write everything in Hindi (Devanagari script)',
    english: 'Write everything in English',
    hinglish: 'Write everything in Hinglish (Hindi-English mix, Roman script)',
  }

  const prompt = `You are a viral YouTube content strategist and scriptwriter.
${langMap[language] || langMap.hinglish}

A creator wants to make a YouTube video on this topic:
Topic: "${topic}"
Niche: "${niche || 'general'}"
Video Style: "${style || 'educational'}"
Target Duration: "${duration || '5-10 minutes'}"

Generate a complete video production package as JSON:
{
  "title": "viral clickbait-style YouTube title (max 70 chars)",
  "titles_alternatives": ["alt title 1", "alt title 2", "alt title 3"],
  "description": "full YouTube description (200+ words) with hook, timestamps placeholder, and CTA",
  "tags": ["tag1", "tag2", "tag3", "tag4", "tag5", "tag6", "tag7", "tag8", "tag9", "tag10", "tag11", "tag12", "tag13", "tag14", "tag15"],
  "hashtags": ["#hashtag1", "#hashtag2", "#hashtag3", "#hashtag4", "#hashtag5"],
  "thumbnail_text": "bold text overlay for thumbnail (max 5 words, all caps)",
  "thumbnail_prompt": "detailed AI image generation prompt for thumbnail (cinematic, 8k, YouTube thumbnail style)",
  "script": {
    "hook": "First 15 seconds - attention grabbing opening line",
    "intro": "30 second intro script",
    "sections": [
      { "title": "Section 1 title", "script": "Full script for this section (3-4 sentences)", "duration": "1-2 min" },
      { "title": "Section 2 title", "script": "Full script for this section", "duration": "2-3 min" },
      { "title": "Section 3 title", "script": "Full script for this section", "duration": "2-3 min" }
    ],
    "outro": "30 second CTA outro script"
  },
  "shorts_ideas": [
    { "title": "Short 1 title", "hook": "opening line", "script": "60 second short script" },
    { "title": "Short 2 title", "hook": "opening line", "script": "60 second short script" },
    { "title": "Short 3 title", "hook": "opening line", "script": "60 second short script" }
  ],
  "production_tips": ["tip1", "tip2", "tip3"],
  "best_upload_time": "Best day and time to upload this video for maximum reach"
}

Respond ONLY with valid JSON.`

  const response = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.85,
    response_format: { type: 'json_object' },
    max_tokens: 4000,
  })

  return JSON.parse(response.choices[0].message.content)
}
