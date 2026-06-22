import { Router } from "express";
import { getYouTubeClient, getAnalyticsClient } from "../auth/youtube.js";
import { predictRetention } from "../modules/analytics/retentionPredictor.js";
import { estimateRevenue } from "../modules/analytics/revenueEstimator.js";
import { scanFakeFollowers } from "../modules/analytics/fakeFollowerScanner.js";
import {
  getStudioOverview,
  getStudioAudience,
  getStudioRealtime,
  getStudioInspiration,
  getChannelAnalyticsOverview,
  getAudienceInsights,
  getInspirationIdeas,
} from "../modules/studio/studioAnalytics.js";
import { chatWithStudio } from "../modules/studio/studioAIChat.js";

const router = Router();

// POST /analytics/retention
// Body: { creator_id, video_id }
router.post("/retention", async (req, res) => {
  try {
    const { creator_id, video_id } = req.body;
    if (!creator_id || !video_id)
      return res.status(400).json({ error: "creator_id and video_id required" });

    const [youtube, analytics] = await Promise.all([
      getYouTubeClient(creator_id),
      getAnalyticsClient(creator_id),
    ]);

    const result = await predictRetention(analytics, youtube, video_id);
    res.json(result);
  } catch (err) {
    console.error("Retention error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// POST /analytics/revenue
// Body: { creator_id }
router.post("/revenue", async (req, res) => {
  try {
    const { creator_id } = req.body;
    if (!creator_id)
      return res.status(400).json({ error: "creator_id required" });

    const [youtube, analytics] = await Promise.all([
      getYouTubeClient(creator_id),
      getAnalyticsClient(creator_id),
    ]);

    const result = await estimateRevenue(analytics, youtube, creator_id);
    res.json(result);
  } catch (err) {
    console.error("Revenue error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// POST /analytics/fake-scan
// Body: { creator_id, channel_id? }
// channel_id optional - if not given, scans own channel
router.post("/fake-scan", async (req, res) => {
  try {
    const { creator_id, channel_id } = req.body;
    if (!creator_id)
      return res.status(400).json({ error: "creator_id required" });

    const youtube = await getYouTubeClient(creator_id);

    // If no channel_id given, scan own channel
    let targetChannelId = channel_id;
    if (!targetChannelId) {
      const channelRes = await youtube.channels.list({
        part: "id",
        mine: true,
      });
      targetChannelId = channelRes.data.items[0]?.id;
    }

    if (!targetChannelId)
      return res.status(404).json({ error: "Channel not found" });

    const result = await scanFakeFollowers(youtube, targetChannelId);
    res.json(result);
  } catch (err) {
    console.error("Fake scan error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// POST /analytics/studio
// Body: { creator_id }
router.post("/studio", async (req, res) => {
  try {
    const { creator_id } = req.body;
    if (!creator_id)
      return res.status(400).json({ error: "creator_id required" });

    const [youtube, analytics] = await Promise.all([
      getYouTubeClient(creator_id),
      getAnalyticsClient(creator_id),
    ]);

    const [overview, audience, realtime, inspiration] = await Promise.all([
      getStudioOverview(analytics, youtube),
      getStudioAudience(analytics, youtube),
      getStudioRealtime(youtube),
      getStudioInspiration(),
    ]);

    res.json({
      overview,
      audience,
      realtime,
      inspiration,
    });
  } catch (err) {
    console.error("Studio analytics error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// POST /analytics/studio/chat
// Body: { creator_id, message, chat_history }
router.post("/studio/chat", async (req, res) => {
  try {
    const { creator_id, message, chat_history = [] } = req.body;
    if (!creator_id || !message) {
      return res.status(400).json({ error: "creator_id and message are required" });
    }

    const [youtube, analytics] = await Promise.all([
      getYouTubeClient(creator_id),
      getAnalyticsClient(creator_id),
    ]);

    const reply = await chatWithStudio(youtube, analytics, creator_id, message, chat_history);
    res.json({ reply });
  } catch (err) {
    console.error("Studio AI Chat error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

router.post("/studio/overview", async (req, res) => {
  try {
    const { creator_id } = req.body;
    if (!creator_id)
      return res.status(400).json({ error: "creator_id required" });

    const [youtube, analytics] = await Promise.all([
      getYouTubeClient(creator_id),
      getAnalyticsClient(creator_id),
    ]);

    const result = await getStudioOverview(analytics, youtube);
    res.json(result);
  } catch (err) {
    console.error("Studio overview error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

router.post("/studio/audience", async (req, res) => {
  try {
    const { creator_id } = req.body;
    if (!creator_id)
      return res.status(400).json({ error: "creator_id required" });

    const [youtube, analytics] = await Promise.all([
      getYouTubeClient(creator_id),
      getAnalyticsClient(creator_id),
    ]);

    const result = await getStudioAudience(analytics, youtube);
    res.json(result);
  } catch (err) {
    console.error("Studio audience error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

router.post("/studio/realtime", async (req, res) => {
  try {
    const { creator_id } = req.body;
    if (!creator_id)
      return res.status(400).json({ error: "creator_id required" });

    const youtube = await getYouTubeClient(creator_id);
    const result = await getStudioRealtime(youtube);
    res.json(result);
  } catch (err) {
    console.error("Studio realtime error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

router.post("/studio/inspiration", async (req, res) => {
  try {
    const result = await getStudioInspiration();
    res.json(result);
  } catch (err) {
    console.error("Studio inspiration error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// POST /analytics/channel-overview
// Body: { creator_id }
router.post("/channel-overview", async (req, res) => {
  try {
    const { creator_id } = req.body;
    if (!creator_id) return res.status(400).json({ error: "creator_id required" });
    const [youtube, analytics] = await Promise.all([
      getYouTubeClient(creator_id),
      getAnalyticsClient(creator_id),
    ]);
    const result = await getChannelAnalyticsOverview(analytics, youtube);
    res.json(result);
  } catch (err) {
    console.error("Channel overview error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// POST /analytics/audience-insights
// Body: { creator_id }
router.post("/audience-insights", async (req, res) => {
  try {
    const { creator_id } = req.body;
    if (!creator_id) return res.status(400).json({ error: "creator_id required" });
    const [youtube, analytics] = await Promise.all([
      getYouTubeClient(creator_id),
      getAnalyticsClient(creator_id),
    ]);
    const result = await getAudienceInsights(analytics, youtube);
    res.json(result);
  } catch (err) {
    console.error("Audience insights error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// POST /analytics/video-detail
// Body: { creator_id, video_id }
// Full per-video analytics: stats + daily chart + traffic + devices + top comments
router.post("/video-detail", async (req, res) => {
  try {
    const { creator_id, video_id } = req.body;
    if (!creator_id || !video_id)
      return res.status(400).json({ error: "creator_id and video_id required" });

    const [youtube, analytics] = await Promise.all([
      getYouTubeClient(creator_id),
      getAnalyticsClient(creator_id),
    ]);

    const today = new Date().toISOString().split("T")[0];
    const startDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

    const [videoRes, dailyRes, trafficRes, deviceRes, commentsRes] = await Promise.all([
      youtube.videos.list({ part: "snippet,statistics,contentDetails,status", id: video_id }),
      analytics.reports.query({
        ids: "channel==MINE",
        startDate, endDate: today,
        metrics: "views,estimatedMinutesWatched,likes,comments",
        dimensions: "day",
        filters: `video==${video_id}`,
        sort: "day",
      }).catch(() => ({ data: { rows: [] } })),
      analytics.reports.query({
        ids: "channel==MINE",
        startDate, endDate: today,
        metrics: "views",
        dimensions: "insightTrafficSourceType",
        filters: `video==${video_id}`,
        sort: "-views",
      }).catch(() => ({ data: { rows: [] } })),
      analytics.reports.query({
        ids: "channel==MINE",
        startDate, endDate: today,
        metrics: "estimatedMinutesWatched",
        dimensions: "deviceType",
        filters: `video==${video_id}`,
        sort: "-estimatedMinutesWatched",
      }).catch(() => ({ data: { rows: [] } })),
      youtube.commentThreads.list({
        part: "snippet",
        videoId: video_id,
        order: "relevance",
        maxResults: 10,
      }).catch(() => ({ data: { items: [] } })),
    ]);

    const v = videoRes.data.items?.[0];
    if (!v) return res.status(404).json({ error: "Video not found" });

    const dailyChart = (dailyRes.data.rows || []).map(r => ({
      date: r[0], views: r[1], watch_minutes: r[2], likes: r[3], comments: r[4],
    }));

    const totalTrafficViews = (trafficRes.data.rows || []).reduce((s, r) => s + r[1], 0);
    const trafficSources = (trafficRes.data.rows || []).map(r => ({
      source: r[0],
      views: r[1],
      percent: totalTrafficViews > 0 ? parseFloat(((r[1] / totalTrafficViews) * 100).toFixed(1)) : 0,
    }));

    const totalDeviceMin = (deviceRes.data.rows || []).reduce((s, r) => s + r[1], 0);
    const devices = (deviceRes.data.rows || []).map(r => ({
      device: r[0],
      watch_minutes: parseFloat(r[1].toFixed(1)),
      percent: totalDeviceMin > 0 ? parseFloat(((r[1] / totalDeviceMin) * 100).toFixed(1)) : 0,
    }));

    const comments = (commentsRes.data.items || []).map(item => ({
      id: item.id,
      author: item.snippet.topLevelComment.snippet.authorDisplayName,
      author_pic: item.snippet.topLevelComment.snippet.authorProfileImageUrl,
      text: item.snippet.topLevelComment.snippet.textDisplay,
      likes: item.snippet.topLevelComment.snippet.likeCount,
      published_at: item.snippet.topLevelComment.snippet.publishedAt,
      reply_count: item.snippet.totalReplyCount,
    }));

    res.json({
      video: {
        video_id: v.id,
        title: v.snippet.title,
        description: v.snippet.description,
        thumbnail: v.snippet.thumbnails?.maxres?.url || v.snippet.thumbnails?.high?.url,
        published_at: v.snippet.publishedAt,
        duration: v.contentDetails.duration,
        definition: v.contentDetails.definition,
        caption: v.contentDetails.caption,
        privacy_status: v.status.privacyStatus,
        made_for_kids: v.status.madeForKids,
        embeddable: v.status.embeddable,
        tags: v.snippet.tags || [],
        view_count: parseInt(v.statistics.viewCount || 0),
        like_count: parseInt(v.statistics.likeCount || 0),
        comment_count: parseInt(v.statistics.commentCount || 0),
        favorite_count: parseInt(v.statistics.favoriteCount || 0),
      },
      chart: dailyChart,
      traffic_sources: trafficSources,
      devices,
      top_comments: comments,
      period: { startDate, endDate: today, label: "Last 90 days" },
    });
  } catch (err) {
    console.error("Video detail error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// GET /analytics/inspiration-ideas
router.get("/inspiration-ideas", async (req, res) => {
  try {
    const result = await getInspirationIdeas();
    res.json(result);
  } catch (err) {
    console.error("Inspiration ideas error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

export default router;
