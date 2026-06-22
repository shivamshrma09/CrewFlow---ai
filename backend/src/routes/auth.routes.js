import { Router } from "express";
import { pool } from "../db/index.js";
import { getAuthUrl, handleCallback } from "../auth/youtube.js";
import dotenv from "dotenv";
dotenv.config();

const router = Router();

// GET /auth/youtube/start → redirect to Google login
router.get("/youtube/start", (req, res) => {
  const url = getAuthUrl();
  res.redirect(url);
});

// GET /auth/youtube/callback → Google redirects here after user allows
router.get("/youtube/callback", async (req, res) => {
  try {
    const { code } = req.query;
    if (!code) return res.status(400).json({ error: "No code provided" });

    const creatorId = await handleCallback(code);
    res.redirect(`${process.env.FRONTEND_URL}/dashboard?creator_id=${creatorId}`);
  } catch (err) {
    console.error("OAuth callback error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// GET /auth/me?creator_id=xxx → get logged-in creator info
router.get("/me", async (req, res) => {
  try {
    const { creator_id } = req.query;
    if (!creator_id) return res.status(400).json({ error: "creator_id required" });

    const { rows } = await pool.query(
      "SELECT id, name, email, picture FROM creators WHERE id = $1",
      [creator_id]
    );
    if (!rows.length) return res.status(404).json({ error: "Creator not found" });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
