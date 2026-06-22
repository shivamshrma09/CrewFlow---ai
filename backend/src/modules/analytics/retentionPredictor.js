import Groq from "groq-sdk";
import dotenv from "dotenv";
dotenv.config();

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

async function fetchVideoAnalytics(analyticsClient, youtubeClient, videoId) {
  const today = new Date().toISOString().split("T")[0];
  const startDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];

  const [analyticsRes, videoRes] = await Promise.all([
    analyticsClient.reports.query({
      ids: "channel==MINE",
      startDate,
      endDate: today,
      // dimensions=video → row: [videoId, views, estimatedMinutesWatched, avgViewDuration, avgViewPercentage, likes, comments, shares, subscribersGained]
      metrics: "views,estimatedMinutesWatched,averageViewDuration,averageViewPercentage,likes,comments,shares,subscribersGained",
      dimensions: "video",
      filters: `video==${videoId}`,
    }).catch(() => ({ data: { rows: null } })),
    youtubeClient.videos.list({
      part: "snippet,statistics,contentDetails",
      id: videoId,
    }),
  ]);

  const video = videoRes.data.items?.[0];
  // With dimensions=video, row[0]=videoId, row[1]=views, row[2]=estimatedMinutesWatched...
  const analyticsRow = analyticsRes.data.rows?.[0];

  return { video, analyticsRow };
}

export async function predictRetention(analyticsClient, youtubeClient, videoId) {
  const { video, analyticsRow } = await fetchVideoAnalytics(analyticsClient, youtubeClient, videoId);

  if (!video) throw new Error("Video not found");

  const stats = video.statistics;
  const duration = video.contentDetails.duration;

  // row[0]=videoId, row[1]=views, row[2]=estimatedMinutesWatched,
  // row[3]=avgViewDuration, row[4]=avgViewPercentage, row[5]=likes,
  // row[6]=comments, row[7]=shares, row[8]=subscribersGained
  const views           = parseInt(analyticsRow?.[1] || stats.viewCount || 0);
  const watchMinutes    = parseFloat(analyticsRow?.[2] || 0);
  const avgViewDuration = parseFloat(analyticsRow?.[3] || 0);
  const avgViewPercent  = parseFloat(analyticsRow?.[4] || 0);
  const likes           = parseInt(analyticsRow?.[5] || stats.likeCount || 0);
  const comments        = parseInt(analyticsRow?.[6] || stats.commentCount || 0);
  const shares          = parseInt(analyticsRow?.[7] || 0);
  const subsGained      = parseInt(analyticsRow?.[8] || 0);

  const likeViewRatio = views > 0 ? ((likes / views) * 100).toFixed(2) : 0;

  const prompt = `You are a YouTube analytics expert helping Indian creators improve retention.

Video: "${video.snippet.title}"
Duration: ${duration}
Views: ${views}
Average View Duration: ${avgViewDuration} seconds
Average View Percentage: ${avgViewPercent}%
Estimated Watch Minutes: ${watchMinutes}
Likes: ${likes}
Comments: ${comments}
Shares: ${shares}
Subscribers Gained: ${subsGained}
Like/View Ratio: ${likeViewRatio}%

Based on these metrics, analyze and return JSON:
{
  "retention_score": 0,
  "avg_view_percentage": ${avgViewPercent},
  "performance": "poor|average|good|excellent",
  "predicted_drop_points": [
    { "timestamp": "0:30", "reason": "why audience drops here", "severity": "high|medium|low" }
  ],
  "strengths": ["what is working well"],
  "improvements": ["specific actionable fixes to improve retention"],
  "hook_analysis": "analysis of first 30 seconds effectiveness",
  "recommended_video_length": "optimal length for this niche"
}

Respond ONLY with valid JSON.`;

  const response = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.4,
    response_format: { type: "json_object" },
  });

  const aiAnalysis = JSON.parse(response.choices[0].message.content);

  return {
    video_id: videoId,
    title: video.snippet.title,
    thumbnail: video.snippet.thumbnails?.high?.url,
    duration,
    raw_metrics: {
      views,
      likes,
      comments,
      shares,
      subscribers_gained: subsGained,
      avg_view_duration_seconds: avgViewDuration,
      avg_view_percentage: avgViewPercent,
      estimated_minutes_watched: watchMinutes,
    },
    ...aiAnalysis,
  };
}
