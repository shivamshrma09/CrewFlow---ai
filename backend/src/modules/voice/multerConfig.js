import multer from "multer";
import path from "path";
import fs from "fs";

const uploadDir = "./uploads";
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`);
  },
});

const AUDIO_TYPES = ["audio/mpeg", "audio/mp3", "audio/wav", "audio/mp4", "audio/m4a", "audio/webm", "audio/ogg"];
const VIDEO_TYPES = ["video/mp4", "video/mpeg", "video/webm", "video/quicktime", "video/x-msvideo"];

export const audioUpload = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 },   // 25MB - Groq Whisper limit
  fileFilter: (req, file, cb) => {
    AUDIO_TYPES.includes(file.mimetype)
      ? cb(null, true)
      : cb(new Error("Only audio files allowed (mp3, wav, m4a, webm)"));
  },
});

export const videoUpload = multer({
  storage,
  limits: { fileSize: 500 * 1024 * 1024 },  // 500MB
  fileFilter: (req, file, cb) => {
    VIDEO_TYPES.includes(file.mimetype)
      ? cb(null, true)
      : cb(new Error("Only video files allowed (mp4, webm, mov, avi)"));
  },
});

const IMAGE_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];

export const imageUpload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    IMAGE_TYPES.includes(file.mimetype)
      ? cb(null, true)
      : cb(new Error("Only image files allowed (jpg, png, gif, webp)"));
  },
});

// Cleanup temp file after use
export function cleanupFile(filePath) {
  try { fs.unlinkSync(filePath); } catch (_) {}
}
