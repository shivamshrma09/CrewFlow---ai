import Groq from "groq-sdk";
import dotenv from "dotenv";
dotenv.config();

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const PLATFORM_CONTEXT = {
  youtube: "YouTube (long-form, SEO-heavy, searchable titles work best)",
  instagram: "Instagram Reels (emotional, short punchy captions)",
  linkedin: "LinkedIn (professional tone, value-driven, thought leadership)",
  twitter: "Twitter/X (bold takes, under 280 chars)",
};

const LANG_INSTRUCTION = {
  hindi: "Respond in Hindi (Devanagari script)",
  english: "Respond in English",
  hinglish: "Respond in Hinglish (Hindi-English mix, Roman script)",
};

export async function generateHooksAndTitles({ topic, niche, targetAudience, platform = "youtube", language = "hinglish" }) {
  const prompt = `You are a viral content strategist for Indian creators on ${PLATFORM_CONTEXT[platform] || PLATFORM_CONTEXT.youtube}.

Topic: ${topic}
Niche: ${niche}
Target Audience: ${targetAudience}
Language: ${LANG_INSTRUCTION[language] || LANG_INSTRUCTION.hinglish}

Generate the following as JSON:
{
  "hooks": [5 opening lines for first 3 seconds - must create curiosity or shock],
  "titles": [5 SEO-optimized video titles with power words],
  "thumbnail_texts": [5 short thumbnail overlays - max 5 words each]
}

Make them viral and specific to Indian audience. Respond ONLY with valid JSON.`;

  const response = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.9,
    response_format: { type: "json_object" },
  });

  return JSON.parse(response.choices[0].message.content);
}
