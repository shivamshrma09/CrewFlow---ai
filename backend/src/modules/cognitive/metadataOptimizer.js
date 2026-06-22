import Groq from "groq-sdk";
import dotenv from "dotenv";
dotenv.config();

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function analyzeMetadata({ title, description, tags = [], niche, language = "hinglish" }) {
  const prompt = `You are a YouTube SEO expert for Indian creators.

Analyze this video metadata and return JSON:
{
  "overall_score": 0-100,
  "title": {
    "score": 0-100,
    "strengths": ["..."],
    "weaknesses": ["..."],
    "issues": ["specific problems"]
  },
  "description": {
    "score": 0-100,
    "strengths": ["..."],
    "weaknesses": ["..."],
    "issues": ["specific problems"]
  },
  "tags_score": 0-100,
  "seo_grade": "A|B|C|D|F",
  "improved_title": "one best improved title",
  "title_alternatives": ["alt title 1", "alt title 2", "alt title 3"],
  "improved_description": "full improved description with hooks in first 2 lines, keywords, CTA",
  "recommended_tags": ["tag1", "tag2", ... up to 10],
  "hook_from_title": "suggested 3-second opening hook based on this content",
  "quick_wins": ["actionable fix 1", "actionable fix 2", "actionable fix 3"]
}

Niche: ${niche || "general"}
Language style for suggestions: ${language}

Current Title: ${title}
Current Description: ${description?.slice(0, 2000) || "(empty)"}
Current Tags: ${tags.join(", ") || "(none)"}

Be honest with scores. Respond ONLY with valid JSON.`;

  const response = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.6,
    response_format: { type: "json_object" },
  });

  return JSON.parse(response.choices[0].message.content);
}

export async function improveHook({ title, description, current_hook, niche, language = "hinglish" }) {
  const prompt = `You are a viral hook specialist for Indian YouTube/Shorts creators.

Improve the opening hook for this video. Return JSON:
{
  "current_hook_analysis": {
    "score": 0-100,
    "why_it_works_or_fails": "brief analysis"
  },
  "improved_hooks": [
    {
      "hook": "opening line for first 3 seconds",
      "style": "curiosity|shock|story|question|stat",
      "why_viral": "why this works",
      "score": 0-100
    }
  ],
  "best_pick": "the single best hook to use",
  "delivery_tip": "how to say it on camera",
  "thumbnail_text": "5-word max overlay text matching the hook"
}

Niche: ${niche || "general"}
Language: ${language}
Video Title: ${title}
Description excerpt: ${description?.slice(0, 500) || ""}
${current_hook ? `Current Hook Attempt: ${current_hook}` : "No current hook provided — generate fresh ones."}

Generate 5 improved hooks ranked by viral potential. Respond ONLY with valid JSON.`;

  const response = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.85,
    response_format: { type: "json_object" },
  });

  return JSON.parse(response.choices[0].message.content);
}
