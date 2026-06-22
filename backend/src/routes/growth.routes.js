import { Router } from "express";
import { getYouTubeClient } from "../auth/youtube.js";
import { trendJack, fetchDailyTrends } from "../modules/growth/trendJacking.js";
import { calculateHashtagROI } from "../modules/growth/hashtagROI.js";
import { findCollaborators } from "../modules/growth/collaboratorFinder.js";

const router = Router();

// GET /growth/trends/live — India daily trends, no AI
router.get("/trends/live", async (req, res) => {
  try {
    const trends = await fetchDailyTrends();
    res.json(trends);
  } catch (err) {
    console.error("Live trends error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// POST /growth/trends
// Body: { creator_id, niche, platform?, language? }
router.post("/trends", async (req, res) => {
  try {
    const { creator_id, niche, platform = "youtube_shorts", language = "hinglish" } = req.body;
    if (!creator_id || !niche)
      return res.status(400).json({ error: "creator_id and niche required" });

    const result = await trendJack(niche, platform, language);
    res.json(result);
  } catch (err) {
    console.error("Trend jack error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// POST /growth/hashtags
// Body: { creator_id, hashtags: ["#motivation", "#india", "#finance"] }
router.post("/hashtags", async (req, res) => {
  try {
    const { creator_id, hashtags } = req.body;
    if (!creator_id || !hashtags?.length)
      return res.status(400).json({ error: "creator_id and hashtags array required" });

    if (hashtags.length > 15)
      return res.status(400).json({ error: "Max 15 hashtags at a time" });

    const youtube = await getYouTubeClient(creator_id);
    const result = await calculateHashtagROI(youtube, hashtags);
    res.json(result);
  } catch (err) {
    console.error("Hashtag ROI error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// POST /growth/collaborators
// Body: { creator_id, niche, max_results? }
router.post("/collaborators", async (req, res) => {
  try {
    const { creator_id, niche, max_results = 10 } = req.body;
    if (!creator_id || !niche)
      return res.status(400).json({ error: "creator_id and niche required" });

    const youtube = await getYouTubeClient(creator_id);
    const result = await findCollaborators(youtube, creator_id, niche, max_results);
    res.json(result);
  } catch (err) {
    console.error("Collaborator finder error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

export default router;
