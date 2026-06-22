import { Router } from "express";
import path from "path";
import fs from "fs";
import { audioUpload, videoUpload, cleanupFile } from "../modules/voice/multerConfig.js";
import { transcribeAudio } from "../modules/voice/speechToText.js";
import { cloneVoice, textToSpeech, listVoices, deleteVoice } from "../modules/voice/voiceClone.js";
import { resizeForPlatforms, PLATFORM_SPECS } from "../modules/voice/videoResizer.js";
import { uploadToImageKit } from "../modules/voice/imagekitUploader.js";

const router = Router();

// ── Feature 1: Speech to Text ────────────────────────────────────────────────

// POST /voice/transcribe
// Form-data: audio (file), language? (default: hi)
router.post("/transcribe", audioUpload.single("audio"), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "Audio file required" });
  try {
    const language = req.body.language || "hi";
    const result = await transcribeAudio(req.file.path, language);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  } finally {
    cleanupFile(req.file.path);
  }
});

// ── Feature 2: Voice Cloning ─────────────────────────────────────────────────

// POST /voice/clone
// Form-data: sample (audio file), voice_name (string)
router.post("/clone", audioUpload.single("sample"), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "Voice sample audio file required" });
  const { voice_name } = req.body;
  if (!voice_name) return res.status(400).json({ error: "voice_name required" });
  try {
    const result = await cloneVoice(req.file.path, voice_name);
    res.json({ ...result, message: "Voice cloned successfully. Use voice_id for TTS." });
  } catch (err) {
    res.status(500).json({ error: err.message });
  } finally {
    cleanupFile(req.file.path);
  }
});

// POST /voice/tts
// Body: { voice_id, text, language? }
// Generates speech → uploads to ImageKit → returns audio URL
router.post("/tts", async (req, res) => {
  const { voice_id, text, language } = req.body;
  if (!voice_id || !text) return res.status(400).json({ error: "voice_id and text required" });

  const outputPath = `./uploads/tts-${Date.now()}.mp3`;
  try {
    await textToSpeech(text, voice_id, outputPath);
    const uploaded = await uploadToImageKit(outputPath, `tts-${Date.now()}.mp3`, "/crewflow/audio");
    res.json({
      audio_url: uploaded.url,
      fileId: uploaded.fileId,
      text_length: text.length,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  } finally {
    cleanupFile(outputPath);
  }
});

// GET /voice/voices
// List all available voices (cloned + premade)
router.get("/voices", async (req, res) => {
  try {
    const voices = await listVoices();
    res.json({ total: voices.length, voices });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /voice/clone/:voice_id
// Delete a cloned voice from ElevenLabs
router.delete("/clone/:voice_id", async (req, res) => {
  try {
    const result = await deleteVoice(req.params.voice_id);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Feature 3: Platform Video Resizer ────────────────────────────────────────

// GET /voice/platforms
// List all supported platforms with specs
router.get("/platforms", (req, res) => {
  res.json({ platforms: PLATFORM_SPECS });
});

// POST /voice/resize
// Form-data: video (file), platforms? (comma-separated e.g. "youtube,instagram_reels")
router.post("/resize", videoUpload.single("video"), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "Video file required" });
  try {
    const platforms = req.body.platforms
      ? req.body.platforms.split(",").map((p) => p.trim())
      : [];

    const result = await resizeForPlatforms(req.file.path, req.file.originalname, platforms);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  } finally {
    cleanupFile(req.file.path);
  }
});

// ── Feature 4: Voice to Content ─────────────────────────────────────────────

// POST /voice/voice-to-content
// Form-data: audio (file), language? (default: hi), niche?, platform?, content_language?
// Transcribes audio → generates hooks + titles + repurposed content automatically
router.post("/voice-to-content", audioUpload.single("audio"), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "Audio file required" });
  try {
    const {
      language = "hi",
      niche = "general",
      platform = "youtube",
      content_language = "hinglish",
    } = req.body;

    // Step 1: Transcribe audio
    const transcription = await transcribeAudio(req.file.path, language);
    const script = transcription.text;

    // Step 2: Run hooks + repurpose in parallel using the transcript
    const { generateHooksAndTitles } = await import("../modules/cognitive/hookGenerator.js");
    const { repurposeContent } = await import("../modules/cognitive/repurposer.js");

    const [hooks, repurposed] = await Promise.all([
      generateHooksAndTitles({
        topic: script.slice(0, 200),
        niche,
        targetAudience: "Indian creators",
        platform,
        language: content_language,
      }),
      repurposeContent({ script, language: content_language }),
    ]);

    res.json({
      transcript: transcription,
      hooks_and_titles: hooks,
      repurposed_content: repurposed,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  } finally {
    cleanupFile(req.file.path);
  }
});

// ── Feature 5: Regional Script Translation ───────────────────────────────────

// POST /voice/translate
// Body: { text, target_language, source_language? }
// Translates script to regional Indian languages using Groq LLM
router.post("/translate", async (req, res) => {
  try {
    const { text, target_language, source_language = "hindi" } = req.body;
    if (!text || !target_language)
      return res.status(400).json({ error: "text and target_language required" });

    const SUPPORTED_LANGUAGES = {
      marathi:    "Marathi (मराठी)",
      bhojpuri:   "Bhojpuri (भोजपुरी)",
      tamil:      "Tamil (தமிழ்)",
      telugu:     "Telugu (తెలుగు)",
      kannada:    "Kannada (ಕನ್ನಡ)",
      bengali:    "Bengali (বাংলা)",
      gujarati:   "Gujarati (ગુજરાતી)",
      punjabi:    "Punjabi (ਪੰਜਾਬੀ)",
      malayalam:  "Malayalam (മലയാളം)",
      hindi:      "Hindi (हिंदी)",
      english:    "English",
      hinglish:   "Hinglish (Hindi-English mix, Roman script)",
    };

    const targetLangLabel = SUPPORTED_LANGUAGES[target_language];
    if (!targetLangLabel)
      return res.status(400).json({
        error: `Unsupported language. Supported: ${Object.keys(SUPPORTED_LANGUAGES).join(", ")}`
      });

    const Groq = (await import("groq-sdk")).default;
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

    const prompt = `You are an expert translator specializing in Indian regional languages for content creators.

Translate the following ${source_language} script/text to ${targetLangLabel}.
Keep the tone natural, conversational and authentic - like a native speaker would say it.
Preserve emojis, hashtags, and formatting.
Do NOT translate proper nouns, brand names, or technical terms.

Original text:
"""${text}"""

Return a JSON object:
{
  "translated_text": "full translation here",
  "romanized": "romanized/transliterated version (if script is non-Roman)",
  "notes": "any translator notes about tone or cultural adaptations made"
}`;

    const response = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.4,
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(response.choices[0].message.content);
    res.json({
      source_language,
      target_language,
      target_language_label: targetLangLabel,
      original_text: text,
      ...result,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
