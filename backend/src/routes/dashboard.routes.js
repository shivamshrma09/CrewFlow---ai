import { Router } from "express";
import { getYouTubeClient } from "../auth/youtube.js";

const router = Router();

// GET /dashboard?creator_id=xxx
router.get("/", async (req, res) => {
  try {
    const { creator_id } = req.query;
    if (!creator_id) return res.status(400).json({ error: "creator_id required" });

    const youtube = await getYouTubeClient(creator_id);

    // ── Step 1: Channel full data (all available parts) ──────────────────
    const channelRes = await youtube.channels.list({
      part: "snippet,statistics,brandingSettings,contentDetails,topicDetails,status,localizations",
      mine: true,
    });

    const channel = channelRes.data.items[0];
    const uploadsPlaylistId = channel.contentDetails.relatedPlaylists.uploads;
    const likesPlaylistId   = channel.contentDetails.relatedPlaylists.likes;

    // ── Step 2: All parallel independent calls (Quota optimized) ──────────
    const [recentRes, playlistsRes, subscriptionsRes] = await Promise.all([
      // Fetch 50 uploads so we have a good sample to compute top viewed/rated in memory
      youtube.playlistItems.list({
        part: "snippet,contentDetails,status",
        playlistId: uploadsPlaylistId,
        maxResults: 50,
      }),
      // Creator's playlists
      youtube.playlists.list({
        part: "snippet,contentDetails,status",
        mine: true,
        maxResults: 20,
      }),
      // Channels this creator is subscribed to
      youtube.subscriptions.list({
        part: "snippet,contentDetails",
        mine: true,
        maxResults: 20,
        order: "alphabetical",
      }),
    ]);

    // ── Step 3: Batch fetch full video details for recent uploads ───────
    const recentVideoIds = recentRes.data.items
      .map((i) => i.contentDetails.videoId)
      .join(",");

    let detailsById = {};
    let allDetailedVideos = [];

    if (recentVideoIds) {
      const videoDetailsRes = await youtube.videos.list({
        part: "snippet,statistics,contentDetails,status,topicDetails,localizations",
        id: recentVideoIds,
      });

      allDetailedVideos = videoDetailsRes.data.items.map((v) => ({
        video_id: v.id,
        title: v.snippet.title,
        description: v.snippet.description,
        thumbnail: v.snippet.thumbnails?.maxres?.url || v.snippet.thumbnails?.high?.url || v.snippet.thumbnails?.medium?.url || v.snippet.thumbnails?.default?.url,
        tags: v.snippet.tags || [],
        category_id: v.snippet.categoryId,
        default_language: v.snippet.defaultLanguage,
        published_at: v.snippet.publishedAt,
        duration: v.contentDetails.duration,
        definition: v.contentDetails.definition,   // hd or sd
        caption: v.contentDetails.caption,
        licensed_content: v.contentDetails.licensedContent,
        privacy_status: v.status.privacyStatus,
        upload_status: v.status.uploadStatus,
        embeddable: v.status.embeddable,
        made_for_kids: v.status.madeForKids,
        view_count: parseInt(v.statistics.viewCount || 0),
        like_count: parseInt(v.statistics.likeCount || 0),
        comment_count: parseInt(v.statistics.commentCount || 0),
        favorite_count: parseInt(v.statistics.favoriteCount || 0),
        topic_categories: v.topicDetails?.topicCategories || [],
      }));

      detailsById = Object.fromEntries(
        allDetailedVideos.map((v) => [v.video_id, v])
      );
    }

    const recentVideos = recentRes.data.items.slice(0, 20).map((item) => ({
      position: item.snippet.position,
      playlist_item_id: item.id,
      privacy_status: item.status?.privacyStatus,
      ...(detailsById[item.contentDetails.videoId] || {
        video_id: item.contentDetails.videoId,
        title: item.snippet.title,
        thumbnail: item.snippet.thumbnails?.high?.url,
        published_at: item.snippet.publishedAt,
      }),
    }));

    // ── Step 4: Format playlists ──────────────────────────────────────────
    const playlists = playlistsRes.data.items.map((p) => ({
      playlist_id: p.id,
      title: p.snippet.title,
      description: p.snippet.description,
      thumbnail: p.snippet.thumbnails?.high?.url,
      published_at: p.snippet.publishedAt,
      video_count: p.contentDetails.itemCount,
      privacy_status: p.status.privacyStatus,
    }));

    // ── Step 5: Format subscriptions ─────────────────────────────────────
    const subscriptions = subscriptionsRes.data.items.map((s) => ({
      subscription_id: s.id,
      channel_id: s.snippet.resourceId.channelId,
      channel_title: s.snippet.title,
      channel_thumbnail: s.snippet.thumbnails?.default?.url,
      subscribed_at: s.snippet.publishedAt,
      new_item_count: s.contentDetails?.newItemCount || 0,
      activity_type: s.contentDetails?.activityType,
    }));

    // ── Step 6: Top videos sorted in-memory from the detailed uploads ─────
    const topViewed = [...allDetailedVideos]
      .sort((a, b) => b.view_count - a.view_count)
      .slice(0, 10);

    const topRated = [...allDetailedVideos]
      .sort((a, b) => b.like_count - a.like_count)
      .slice(0, 10);

    // ── Final Response ────────────────────────────────────────────────────
    res.json({
      channel: {
        id: channel.id,
        title: channel.snippet.title,
        description: channel.snippet.description,
        custom_url: channel.snippet.customUrl,
        profile_picture: channel.snippet.thumbnails?.high?.url,
        banner: channel.brandingSettings?.image?.bannerExternalUrl,
        mobile_banner: channel.brandingSettings?.image?.bannerMobileExtraHdImageUrl,
        keywords: channel.brandingSettings?.channel?.keywords,
        country: channel.snippet.country,
        default_language: channel.snippet.defaultLanguage,
        created_at: channel.snippet.publishedAt,
        topic_categories: channel.topicDetails?.topicCategories || [],
        privacy_status: channel.status?.privacyStatus,
        is_linked: channel.status?.isLinked,
        long_uploads_status: channel.status?.longUploadsStatus,
        made_for_kids: channel.status?.madeForKids,
        uploads_playlist_id: uploadsPlaylistId,
        likes_playlist_id: likesPlaylistId,
      },
      stats: {
        subscribers: parseInt(channel.statistics.subscriberCount || 0),
        total_views: parseInt(channel.statistics.viewCount || 0),
        total_videos: parseInt(channel.statistics.videoCount || 0),
        hidden_subscribers: channel.statistics.hiddenSubscriberCount,
      },
      recent_videos: recentVideos,        // Last 20 videos with FULL details
      top_viewed_videos: topViewed,        // Top 10 by views
      top_rated_videos: topRated,          // Top 10 by rating/likes
      playlists,                           // All playlists
      subscriptions,                       // Channels subscribed to
      meta: {
        fetched_at: new Date().toISOString(),
        recent_videos_count: recentVideos.length,
        playlists_count: playlists.length,
        subscriptions_count: subscriptions.length,
      },
    });
  } catch (err) {
    console.error("Dashboard error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// GET /dashboard/videos/all?creator_id=xxx
// Fetches ALL videos with full stats using pagination
// ⚠️ Quota heavy - 1 call per 50 videos. Use only when needed.
router.get("/videos/all", async (req, res) => {
  try {
    const { creator_id } = req.query;
    if (!creator_id) return res.status(400).json({ error: "creator_id required" });

    const youtube = await getYouTubeClient(creator_id);

    // Step 1: Get uploads playlist ID
    const channelRes = await youtube.channels.list({
      part: "contentDetails,statistics",
      mine: true,
    });
    const channel = channelRes.data.items[0];
    const uploadsPlaylistId = channel.contentDetails.relatedPlaylists.uploads;
    const totalVideos = parseInt(channel.statistics.videoCount || 0);

    // Step 2: Paginate through ALL videos in uploads playlist
    const allVideoIds = [];
    let nextPageToken = null;

    do {
      const res2 = await youtube.playlistItems.list({
        part: "contentDetails",
        playlistId: uploadsPlaylistId,
        maxResults: 50,
        pageToken: nextPageToken || undefined,
      });
      res2.data.items.forEach((i) => allVideoIds.push(i.contentDetails.videoId));
      nextPageToken = res2.data.nextPageToken;
    } while (nextPageToken);

    // Step 3: Batch fetch full details (50 per call)
    const allVideos = [];
    for (let i = 0; i < allVideoIds.length; i += 50) {
      const batch = allVideoIds.slice(i, i + 50).join(",");
      const detailRes = await youtube.videos.list({
        part: "snippet,statistics,contentDetails,status",
        id: batch,
      });
      detailRes.data.items.forEach((v) => {
        const thumbs = v.snippet.thumbnails || {};
        allVideos.push({
          video_id: v.id,
          url: `https://www.youtube.com/watch?v=${v.id}`,
          title: v.snippet.title,
          description: v.snippet.description,
          thumbnails: {
            default: thumbs.default?.url,   // 120x90
            medium:  thumbs.medium?.url,    // 320x180
            high:    thumbs.high?.url,      // 480x360
            standard: thumbs.standard?.url, // 640x480
            maxres:  thumbs.maxres?.url,    // 1280x720
          },
          thumbnail: thumbs.maxres?.url || thumbs.standard?.url || thumbs.high?.url,
          tags: v.snippet.tags || [],
          category_id: v.snippet.categoryId,
          default_language: v.snippet.defaultLanguage || null,
          published_at: v.snippet.publishedAt,
          duration: v.contentDetails.duration,
          dimension: v.contentDetails.dimension,
          definition: v.contentDetails.definition,
          caption: v.contentDetails.caption,
          licensed_content: v.contentDetails.licensedContent,
          privacy_status: v.status.privacyStatus,
          upload_status: v.status.uploadStatus,
          embeddable: v.status.embeddable,
          made_for_kids: v.status.madeForKids,
          view_count:     parseInt(v.statistics.viewCount    || 0),
          like_count:     parseInt(v.statistics.likeCount    || 0),
          comment_count:  parseInt(v.statistics.commentCount || 0),
          favorite_count: parseInt(v.statistics.favoriteCount|| 0),
        });
      });
    }

    // Sort by published date (newest first)
    allVideos.sort((a, b) => new Date(b.published_at) - new Date(a.published_at));

    res.json({
      total: allVideos.length,
      total_on_channel: totalVideos,
      videos: allVideos,
      fetched_at: new Date().toISOString(),
    });
  } catch (err) {
    console.error("All videos error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

export default router;
