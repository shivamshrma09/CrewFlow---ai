import Groq from "groq-sdk";
import dotenv from "dotenv";
dotenv.config();

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function scanFakeFollowers(youtubeClient, channelId) {
  // Step 1: Get channel stats + uploads playlist in one call
  const channelRes = await youtubeClient.channels.list({
    part: "snippet,statistics,contentDetails",
    id: channelId,
  });

  if (!channelRes.data.items?.length) throw new Error("Channel not found");

  const channel = channelRes.data.items[0];
  const stats = channel.statistics;
  const uploadsPlaylistId = channel.contentDetails.relatedPlaylists.uploads;

  const subscribers = parseInt(stats.subscriberCount || 0);
  const totalViews   = parseInt(stats.viewCount || 0);
  const totalVideos  = parseInt(stats.videoCount || 0);

  // Step 2: Get last 10 video IDs from uploads playlist
  const recentVideosRes = await youtubeClient.playlistItems.list({
    part: "contentDetails",
    playlistId: uploadsPlaylistId,
    maxResults: 10,
  });

  const videoIds = recentVideosRes.data.items.map((i) => i.contentDetails.videoId);

  // Step 3: Batch fetch video stats
  const videoStatsRes = await youtubeClient.videos.list({
    part: "statistics",
    id: videoIds.join(","),
  });

  const videos = videoStatsRes.data.items;
  if (!videos.length) throw new Error("No videos found for this channel");

  const avgViews    = videos.reduce((s, v) => s + parseInt(v.statistics.viewCount    || 0), 0) / videos.length;
  const avgLikes    = videos.reduce((s, v) => s + parseInt(v.statistics.likeCount    || 0), 0) / videos.length;
  const avgComments = videos.reduce((s, v) => s + parseInt(v.statistics.commentCount || 0), 0) / videos.length;

  const viewToSubRatio      = subscribers > 0 ? (avgViews / subscribers) * 100 : 0;
  const likeToViewRatio     = avgViews > 0 ? (avgLikes / avgViews) * 100 : 0;
  const commentToViewRatio  = avgViews > 0 ? (avgComments / avgViews) * 100 : 0;

  // Step 4: Sample comments from most recent video (use videoIds[0] - actual YT video ID)
  let commentSamples = [];
  try {
    const commentsRes = await youtubeClient.commentThreads.list({
      part: "snippet",
      videoId: videoIds[0],   // Fixed: use videoIds array directly
      maxResults: 30,
      order: "relevance",
    });
    commentSamples = commentsRes.data.items?.map(
      (c) => c.snippet.topLevelComment.snippet.textDisplay
    ) || [];
  } catch (_) {} // comments may be disabled

  // Step 5: AI analysis
  const prompt = `You are a YouTube authenticity analyst specializing in detecting fake engagement.

Channel: "${channel.snippet.title}"
Subscribers: ${subscribers}
Total Videos: ${totalVideos}
Average Views per Video: ${Math.round(avgViews)}
Average Likes per Video: ${Math.round(avgLikes)}
Average Comments per Video: ${Math.round(avgComments)}

Key Ratios:
- View/Subscriber Ratio: ${viewToSubRatio.toFixed(2)}% (healthy range: 10-30%)
- Like/View Ratio: ${likeToViewRatio.toFixed(2)}% (healthy range: 2-8%)
- Comment/View Ratio: ${commentToViewRatio.toFixed(4)}% (healthy range: 0.1-0.5%)

Sample Comments (${commentSamples.length} analyzed):
${commentSamples.slice(0, 15).join("\n")}

Analyze and return JSON:
{
  "authenticity_score": 0,
  "fake_follower_estimate_percent": 0,
  "engagement_rate": ${likeToViewRatio.toFixed(2)},
  "engagement_health": "poor|average|good|excellent",
  "verdict": "highly_authentic|mostly_authentic|suspicious|highly_suspicious",
  "red_flags": ["flag1"],
  "green_flags": ["flag1"],
  "comment_quality": "spam|low|medium|high",
  "recommendations": ["recommendation for brands/creators"],
  "brand_deal_worthiness": "not_recommended|low|medium|high|highly_recommended"
}

Respond ONLY with valid JSON.`;

  const response = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.3,
    response_format: { type: "json_object" },
  });

  const aiAnalysis = JSON.parse(response.choices[0].message.content);

  return {
    channel_id: channelId,
    channel_title: channel.snippet.title,
    profile_picture: channel.snippet.thumbnails?.high?.url,
    raw_metrics: {
      subscribers,
      total_views: totalViews,
      total_videos: totalVideos,
      avg_views_per_video:    Math.round(avgViews),
      avg_likes_per_video:    Math.round(avgLikes),
      avg_comments_per_video: Math.round(avgComments),
      view_to_sub_ratio_percent:     parseFloat(viewToSubRatio.toFixed(2)),
      like_to_view_ratio_percent:    parseFloat(likeToViewRatio.toFixed(2)),
      comment_to_view_ratio_percent: parseFloat(commentToViewRatio.toFixed(4)),
    },
    comments_analyzed: commentSamples.length,
    videos_analyzed: videos.length,
    ...aiAnalysis,
  };
}
