import fs from "fs";
import path from "path";
import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";
import dotenv from "dotenv";
dotenv.config();

const elevenlabs = new ElevenLabsClient({
  apiKey: process.env.ELEVENLABS_API_KEY,
});

/**
 * Clone a voice from audio sample and save to ElevenLabs
 * @param {string} sampleFilePath - path to voice sample audio file
 * @param {string} voiceName - name to save the cloned voice as
 * @returns {string} voiceId - use this for TTS
 */
export async function cloneVoice(sampleFilePath, voiceName) {
  const fileStream = fs.createReadStream(sampleFilePath);

  const response = await elevenlabs.voices.add({
    name: voiceName,
    files: [fileStream],
    description: `CrewFlow cloned voice for ${voiceName}`,
  });

  return {
    voice_id: response.voice_id,
    name: voiceName,
  };
}

/**
 * Generate speech from text using a cloned or preset voice
 * @param {string} text - text to convert to speech
 * @param {string} voiceId - ElevenLabs voice ID
 * @param {string} outputPath - local path to save generated audio
 */
export async function textToSpeech(text, voiceId, outputPath) {
  const audio = await elevenlabs.textToSpeech.convert(voiceId, {
    text,
    model_id: "eleven_multilingual_v2",   // supports Hindi, Marathi, Tamil etc
    voice_settings: {
      stability: 0.5,
      similarity_boost: 0.8,
      style: 0.2,
      use_speaker_boost: true,
    },
  });

  // Write audio stream to file
  const writeStream = fs.createWriteStream(outputPath);
  return new Promise((resolve, reject) => {
    audio.pipe(writeStream);
    writeStream.on("finish", () => resolve(outputPath));
    writeStream.on("error", reject);
  });
}

/**
 * Get all voices available (cloned + premade)
 */
export async function listVoices() {
  const response = await elevenlabs.voices.getAll();
  return response.voices.map((v) => ({
    voice_id: v.voice_id,
    name: v.name,
    category: v.category,        // premade / cloned
    labels: v.labels,            // language, accent, gender etc
    preview_url: v.preview_url,
  }));
}

/**
 * Delete a cloned voice
 */
export async function deleteVoice(voiceId) {
  await elevenlabs.voices.delete(voiceId);
  return { status: "deleted", voice_id: voiceId };
}
