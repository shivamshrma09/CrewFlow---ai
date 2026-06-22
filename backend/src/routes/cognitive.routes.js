import { Router } from "express";
import { getYouTubeClient } from "../auth/youtube.js";
import { fetchComments, analyzeAndReply, postReply, analyzeAudience, translateComment } from "../modules/cognitive/commentResponder.js";
import { generateHooksAndTitles } from "../modules/cognitive/hookGenerator.js";
import { repurposeContent } from "../modules/cognitive/repurposer.js";
import { analyzeMetadata, improveHook } from "../modules/cognitive/metadataOptimizer.js";
import { suggestContentIdeas } from "../modules/cognitive/commentIdeas.js";
import { diagnoseVideoPerformance, scriptDoctorRewrite } from "../modules/cognitive/videoDiagnostics.js";
import { videoUpload, cleanupFile } from "../modules/voice/multerConfig.js";
import { generatePostMetadata, uploadVideoToYouTube, setVideoThumbnail } from "../modules/cognitive/postGenerator.js";
import { generateShorts } from "../modules/cognitive/shortsGenerator.js";
import { generateVideoPackage } from "../modules/cognitive/videoStudio.js";

const router = Router();

// GET /cognitive/comments/video?creator_id=xxx&video_id=xxx&max_comments=50
// Only fetch comments, no AI analysis
router.get("/comments/video", async (req, res) => {
  try {
    const { creator_id, video_id, max_comments = 50 } = req.query;
    if (!creator_id || !video_id)
      return res.status(400).json({ error: "creator_id and video_id required" });

    const youtube = await getYouTubeClient(creator_id);
    const comments = await fetchComments(youtube, video_id, parseInt(max_comments));
    res.json({ total: comments.length, comments });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /cognitive/comments/analyze
// Body: { creator_id, video_id, max_comments? }
router.post("/comments/analyze", async (req, res) => {
  try {
    const { creator_id, video_id, max_comments = 50 } = req.body;
    if (!creator_id || !video_id)
      return res.status(400).json({ error: "creator_id and video_id required" });

    const youtube = await getYouTubeClient(creator_id);
    const comments = await fetchComments(youtube, video_id, max_comments);
    if (!comments.length) return res.json({ total: 0, comments: [] });

    const enriched = await analyzeAndReply(comments);
    res.json({ total: enriched.length, comments: enriched });
  } catch (err) {
    console.error("Comment analyze error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// GET /cognitive/comments/priority?creator_id=xxx&video_id=xxx&level=high&max_comments=50
// Fetch + analyze + return sorted/filtered by priority
router.get("/comments/priority", async (req, res) => {
  try {
    const { creator_id, video_id, level = "high", max_comments = 50 } = req.query;
    if (!creator_id || !video_id)
      return res.status(400).json({ error: "creator_id and video_id required" });

    const youtube = await getYouTubeClient(creator_id);
    const comments = await fetchComments(youtube, video_id, parseInt(max_comments));
    if (!comments.length) return res.json({ total: 0, comments: [] });

    const enriched = await analyzeAndReply(comments);

    const order = { high: 0, medium: 1, low: 2 };
    const sorted = enriched.sort((a, b) => order[a.priority] - order[b.priority]);
    const filtered = level === "all" ? sorted : sorted.filter((c) => c.priority === level);

    res.json({ total: filtered.length, priority: level, comments: filtered });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /cognitive/comments/audience-analysis
// Body: { creator_id, video_id, max_comments? }
router.post("/comments/audience-analysis", async (req, res) => {
  try {
    const { creator_id, video_id, max_comments = 100 } = req.body
    if (!creator_id || !video_id)
      return res.status(400).json({ error: "creator_id and video_id required" })

    const youtube = await getYouTubeClient(creator_id)
    const comments = await fetchComments(youtube, video_id, parseInt(max_comments))
    if (!comments.length) return res.json({ total: 0, analysis: null })

    const analysis = await analyzeAudience(comments)
    res.json({ total: comments.length, analysis })
  } catch (err) {
    console.error("Audience analysis error:", err.message)
    res.status(500).json({ error: err.message })
  }
})

// POST /cognitive/comments/reply
// Body: { creator_id, comment_id, reply_text }
router.post("/comments/reply", async (req, res) => {
  try {
    const { creator_id, comment_id, reply_text } = req.body;
    if (!creator_id || !comment_id || !reply_text)
      return res.status(400).json({ error: "creator_id, comment_id, reply_text required" });

    const youtube = await getYouTubeClient(creator_id);
    const result = await postReply(youtube, comment_id, reply_text);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /cognitive/hooks/generate
// Body: { topic, niche, target_audience, platform?, language? }
router.post("/hooks/generate", async (req, res) => {
  try {
    const { topic, niche, target_audience, platform, language } = req.body;
    if (!topic || !niche || !target_audience)
      return res.status(400).json({ error: "topic, niche, target_audience required" });

    const result = await generateHooksAndTitles({
      topic,
      niche,
      targetAudience: target_audience,
      platform,
      language,
    });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /cognitive/repurpose
// Body: { script, language? } OR { video_id, creator_id, language? }
router.post("/repurpose", async (req, res) => {
  try {
    const { script, language, video_id, creator_id } = req.body;

    let finalScript = script;

    // If video_id given, fetch title + description + tags from YouTube
    if (!script && video_id && creator_id) {
      const youtube = await getYouTubeClient(creator_id);
      const videoRes = await youtube.videos.list({ part: "snippet", id: video_id });
      const video = videoRes.data.items?.[0];
      if (!video) return res.status(404).json({ error: "Video not found" });

      const { title, description, tags = [] } = video.snippet;
      finalScript = `Title: ${title}\n\nDescription: ${description}\n\nTags: ${tags.join(", ")}`;
    }

    if (!finalScript)
      return res.status(400).json({ error: "script or (video_id + creator_id) required" });

    const result = await repurposeContent({ script: finalScript, language });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /cognitive/metadata/analyze
// Body: { title, description?, tags?, niche?, language? }
router.post("/metadata/analyze", async (req, res) => {
  try {
    const { title, description, tags, niche, language } = req.body;
    if (!title) return res.status(400).json({ error: "title required" });

    const result = await analyzeMetadata({ title, description, tags, niche, language });
    res.json(result);
  } catch (err) {
    console.error("Metadata analyze error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// POST /cognitive/metadata/improve-hook
// Body: { title, description?, current_hook?, niche?, language? }
router.post("/metadata/improve-hook", async (req, res) => {
  try {
    const { title, description, current_hook, niche, language } = req.body;
    if (!title) return res.status(400).json({ error: "title required" });

    const result = await improveHook({ title, description, current_hook, niche, language });
    res.json(result);
  } catch (err) {
    console.error("Hook improve error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// POST /cognitive/comments/translate
// Body: { text, target_lang? }
router.post("/comments/translate", async (req, res) => {
  try {
    const { text, target_lang = "English" } = req.body;
    if (!text) return res.status(400).json({ error: "text required" });
    const translated = await translateComment(text, target_lang);
    res.json({ translated });
  } catch (err) {
    console.error("Translate comment error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// POST /cognitive/comments/ideas
// Body: { creator_id }
router.post("/comments/ideas", async (req, res) => {
  try {
    const { creator_id } = req.body;
    if (!creator_id) return res.status(400).json({ error: "creator_id required" });

    const youtube = await getYouTubeClient(creator_id);
    const result = await suggestContentIdeas(youtube, creator_id);
    res.json(result);
  } catch (err) {
    console.error("Content ideas generation error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// POST /cognitive/video/diagnose
// Body: { creator_id, video_id }
router.post("/video/diagnose", async (req, res) => {
  try {
    const { creator_id, video_id } = req.body;
    if (!creator_id || !video_id)
      return res.status(400).json({ error: "creator_id and video_id are required" });

    const youtube = await getYouTubeClient(creator_id);
    const result = await diagnoseVideoPerformance(youtube, video_id);
    res.json(result);
  } catch (err) {
    console.error("Video diagnostics error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// POST /cognitive/posts/generate
// Body: { prompt }
router.post("/posts/generate", async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt) return res.status(400).json({ error: "Prompt is required" });
    const result = await generatePostMetadata(prompt);
    res.json(result);
  } catch (err) {
    console.error("Post metadata generation error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// POST /cognitive/posts/create
// Form-data: video (file), creator_id, title, description, privacy_status?, thumbnail_url?, platforms?
router.post("/posts/create", videoUpload.single("video"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "Video file is required" });
  }

  const { creator_id, title, description, privacy_status = "public", thumbnail_url, platforms = "youtube" } = req.body;

  if (!creator_id || !title || !description) {
    cleanupFile(req.file.path);
    return res.status(400).json({ error: "creator_id, title, and description are required" });
  }

  const selectedPlatforms = typeof platforms === "string" 
    ? platforms.split(",").map(p => p.trim().toLowerCase())
    : Array.isArray(platforms) ? platforms.map(p => p.toLowerCase()) : ["youtube"];

  try {
    const results = {};

    // 1. YouTube Upload
    if (selectedPlatforms.includes("youtube")) {
      const youtube = await getYouTubeClient(creator_id);
      const ytResponse = await uploadVideoToYouTube(youtube, {
        filePath: req.file.path,
        title,
        description,
        privacyStatus: privacy_status
      });

      const videoId = ytResponse.id;
      results.youtube = {
        status: "success",
        id: videoId,
        link: `https://www.youtube.com/watch?v=${videoId}`
      };

      // 2. Upload Thumbnail if URL is present
      if (thumbnail_url && thumbnail_url.trim()) {
        try {
          await setVideoThumbnail(youtube, videoId, thumbnail_url.trim());
          results.youtube.thumbnail = "updated";
        } catch (thumbErr) {
          console.error("Failed to upload custom thumbnail:", thumbErr.message);
          results.youtube.thumbnail = "failed";
          results.youtube.thumbnail_error = thumbErr.message;
        }
      }
    }

    // 3. X (Twitter) Simulation
    if (selectedPlatforms.includes("twitter") || selectedPlatforms.includes("x")) {
      results.x = {
        status: "simulated",
        message: "Successfully cross-posted to X (Twitter)!"
      };
    }

    // 4. Facebook Simulation
    if (selectedPlatforms.includes("facebook")) {
      results.facebook = {
        status: "simulated",
        message: "Successfully cross-posted to Facebook!"
      };
    }

    res.json({
      status: "success",
      message: "Publishing complete",
      results
    });
  } catch (err) {
    console.error("Error creating post:", err.message);
    res.status(500).json({ error: err.message });
  } finally {
    // Make sure to clean up the uploaded temp video file
    cleanupFile(req.file.path);
  }
});

// POST /cognitive/shorts/generate
// Body: { video_url, count? }
router.post("/shorts/generate", async (req, res) => {
  try {
    const { video_url, count = 3 } = req.body
    if (!video_url) return res.status(400).json({ error: "video_url required" })

    // Validate YouTube URL
    if (!video_url.includes('youtube.com') && !video_url.includes('youtu.be')) {
      return res.status(400).json({ error: "Please provide a valid YouTube URL" })
    }

    const result = await generateShorts(video_url, Math.min(parseInt(count) || 3, 5))
    res.json(result)
  } catch (err) {
    console.error("Shorts generation error:", err.message)
    res.status(500).json({ error: err.message })
  }
})

// POST /cognitive/video-studio/generate
// Body: { topic, niche?, language?, style?, duration? }
router.post("/video-studio/generate", async (req, res) => {
  try {
    const { topic, niche, language, style, duration } = req.body
    if (!topic) return res.status(400).json({ error: "topic required" })
    const result = await generateVideoPackage({ topic, niche, language, style, duration })
    res.json(result)
  } catch (err) {
    console.error("Video studio error:", err.message)
    res.status(500).json({ error: err.message })
  }
})

export default router;
