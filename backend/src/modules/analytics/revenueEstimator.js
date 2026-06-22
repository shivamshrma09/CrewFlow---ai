import Groq from "groq-sdk";
import dotenv from "dotenv";
dotenv.config();

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function estimateRevenue(analyticsClient, youtubeClient, creatorId) {
  const today = new Date().toISOString().split("T")[0];
  const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];

  const [channelRes, basicAnalyticsRes, revenueAnalyticsRes] = await Promise.all([
    youtubeClient.channels.list({
      part: "snippet,statistics",
      mine: true,
    }),
    // Basic metrics - always available
    analyticsClient.reports.query({
      ids: "channel==MINE",
      startDate,
      endDate: today,
      metrics: "views,estimatedMinutesWatched,subscribersGained,subscribersLost",
    }).catch(() => ({ data: { rows: null } })),
    // Revenue metrics - only for monetized channels, safe fallback
    analyticsClient.reports.query({
      ids: "channel==MINE",
      startDate,
      endDate: today,
      metrics: "estimatedRevenue,estimatedAdRevenue,cpm,playbackBasedCpm",
    }).catch(() => ({ data: { rows: null } })),
  ]);

  const channel = channelRes.data.items[0];
  const stats = channel.statistics;

  // Basic analytics row: [views, estimatedMinutesWatched, subscribersGained, subscribersLost]
  const basicRow = basicAnalyticsRes.data.rows?.[0] || [];
  const monthlyViews         = parseInt(basicRow[0] || 0);
  const monthlyWatchMinutes  = parseFloat(basicRow[1] || 0);
  const subsGained           = parseInt(basicRow[2] || 0);
  const subsLost             = parseInt(basicRow[3] || 0);

  // Revenue row: [estimatedRevenue, estimatedAdRevenue, cpm, playbackBasedCpm]
  const revenueRow = revenueAnalyticsRes.data.rows?.[0] || [];
  const estimatedRevenue = parseFloat(revenueRow[0] || 0);
  const cpm              = parseFloat(revenueRow[2] || 0);

  const subscribers  = parseInt(stats.subscriberCount || 0);
  const totalViews   = parseInt(stats.viewCount || 0);
  const totalVideos  = parseInt(stats.videoCount || 0);
  const monthlyWatchHours = (monthlyWatchMinutes / 60).toFixed(0);

  const prompt = `You are a YouTube monetization expert specializing in the Indian creator economy.

Channel: "${channel.snippet.title}"
Subscribers: ${subscribers}
Total Views (all time): ${totalViews}
Total Videos: ${totalVideos}
Monthly Views (last 30 days): ${monthlyViews}
Monthly Watch Hours: ${monthlyWatchHours}
Subscribers Gained (last 30 days): ${subsGained}
Subscribers Lost (last 30 days): ${subsLost}
Actual CPM: ${cpm > 0 ? `$${cpm}` : "Not available (channel not monetized)"}
Actual Monthly Revenue: ${estimatedRevenue > 0 ? `$${estimatedRevenue}` : "Not available (channel not monetized)"}
Country: India

Based on Indian YouTube market rates 2024-2025, estimate and return JSON:
{
  "monetization_status": "not_eligible|eligible|monetized",
  "monthly_estimates": {
    "adsense_inr": { "min": 0, "max": 0, "realistic": 0 },
    "brand_deal_per_video_inr": { "min": 0, "max": 0, "realistic": 0 },
    "sponsored_post_inr": { "min": 0, "max": 0, "realistic": 0 },
    "affiliate_potential_inr": { "min": 0, "max": 0, "realistic": 0 },
    "total_potential_inr": { "min": 0, "max": 0, "realistic": 0 }
  },
  "cpm_estimate_inr": 0,
  "rpm_estimate_inr": 0,
  "growth_tier": "nano|micro|mid|macro|mega",
  "monetization_eligibility": {
    "watch_hours_needed": 4000,
    "current_watch_hours": ${monthlyWatchHours},
    "subscribers_needed": 1000,
    "current_subscribers": ${subscribers},
    "eligible": false
  },
  "revenue_tips": ["tip1", "tip2", "tip3"],
  "best_revenue_streams": ["stream1", "stream2", "stream3"]
}

Use realistic Indian market rates. Respond ONLY with valid JSON.`;

  const response = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.3,
    response_format: { type: "json_object" },
  });

  const aiEstimate = JSON.parse(response.choices[0].message.content);

  return {
    channel_id: channel.id,
    channel_title: channel.snippet.title,
    profile_picture: channel.snippet.thumbnails?.high?.url,
    raw_stats: {
      subscribers,
      total_views: totalViews,
      total_videos: totalVideos,
      monthly_views: monthlyViews,
      monthly_watch_hours: parseInt(monthlyWatchHours),
      subscribers_gained_monthly: subsGained,
      subscribers_lost_monthly: subsLost,
      actual_cpm_usd: cpm || null,
      actual_monthly_revenue_usd: estimatedRevenue || null,
    },
    ...aiEstimate,
  };
}
