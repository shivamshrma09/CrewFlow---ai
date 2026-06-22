import Groq from "groq-sdk";
import googleTrends from "google-trends-api";
import dotenv from "dotenv";
dotenv.config();

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

/**
 * Fetch YouTube video count + top videos for a hashtag
 */
async function analyzeHashtagOnYouTube(youtubeClient, hashtag) {
  const cleanTag = hashtag.replace("#", "").trim();

  const [searchRes, trendRes] = await Promise.allSettled([
    // Search YouTube for this hashtag
    youtubeClient.search.list({
      part: "snippet",
      q: `#${cleanTag}`,
      type: "video",
      order: "viewCount",
      maxResults: 10,
      regionCode: "IN",
      relevanceLanguage: "hi",
    }),
    // Google Trends interest over time
    googleTrends.interestOverTime({
      keyword: cleanTag,
      geo: "IN",
      startTime: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
    }),
  ]);

  let topVideos = [];
  let totalResults = 0;
  if (searchRes.status === "fulfilled") {
    totalResults = searchRes.value.data.pageInfo?.totalResults || 0;
    topVideos = searchRes.value.data.items?.map((v) => ({
      video_id: v.id.videoId,
      title: v.snippet.title,
      channel: v.snippet.channelTitle,
      published_at: v.snippet.publishedAt,
    })) || [];
  }

  // Get stats for top videos
  let avgViews = 0;
  if (topVideos.length > 0) {
    const statsRes = await youtubeClient.videos.list({
      part: "statistics",
      id: topVideos.map((v) => v.video_id).join(","),
    });
    const totalViews = statsRes.data.items?.reduce(
      (s, v) => s + parseInt(v.statistics.viewCount || 0), 0
    ) || 0;
    avgViews = Math.round(totalViews / (statsRes.data.items?.length || 1));

    // Attach stats to top videos
    const statsById = Object.fromEntries(
      statsRes.data.items?.map((v) => [v.id, v.statistics]) || []
    );
    topVideos = topVideos.map((v) => ({
      ...v,
      view_count: parseInt(statsById[v.video_id]?.viewCount || 0),
      like_count: parseInt(statsById[v.video_id]?.likeCount || 0),
    }));
  }

  // Parse trend data
  let trendScore = 0;
  let trendData = [];
  if (trendRes.status === "fulfilled") {
    const parsed = JSON.parse(trendRes.value);
    trendData = parsed?.default?.timelineData || [];
    const values = trendData.map((d) => d.value?.[0] || 0);
    trendScore = values.length > 0 ? Math.round(values.reduce((a, b) => a + b, 0) / values.length) : 0;
  }

  return { cleanTag, totalResults, avgViews, topVideos, trendScore, trendData };
}

/**
 * Calculate ROI score for a list of hashtags
 */
export async function calculateHashtagROI(youtubeClient, hashtags) {
  // Analyze all hashtags in parallel
  const analyses = await Promise.all(
    hashtags.map((tag) => analyzeHashtagOnYouTube(youtubeClient, tag))
  );

  const hashtagData = analyses.map((a) => ({
    hashtag: `#${a.cleanTag}`,
    total_videos: a.totalResults,
    avg_views_top_videos: a.avgViews,
    trend_score_90days: a.trendScore,
    top_videos: a.topVideos.slice(0, 3),
    competition_level:
      a.totalResults > 1000000 ? "very_high" :
      a.totalResults > 100000  ? "high" :
      a.totalResults > 10000   ? "medium" : "low",
  }));

  const prompt = `You are a YouTube hashtag strategy expert for Indian creators.

Hashtag Analysis Data:
${JSON.stringify(hashtagData, null, 2)}

Analyze each hashtag and return JSON:
{
  "hashtags": [
    {
      "hashtag": "#tag",
      "roi_score": 0,
      "recommendation": "use|avoid|use_with_caution",
      "reason": "why",
      "best_content_types": ["shorts", "long-form"],
      "best_posting_time": "time in IST",
      "competition": "low|medium|high|very_high"
    }
  ],
  "recommended_set": ["#tag1", "#tag2", "#tag3", "#tag4", "#tag5"],
  "avoid_set": ["#tag"],
  "strategy": "overall hashtag strategy advice for Indian creators",
  "optimal_hashtag_count": 0
}

ROI score 0-100: higher = better reach vs competition ratio.
Respond ONLY with valid JSON.`;

  const response = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.3,
    response_format: { type: "json_object" },
  });

  const aiAnalysis = JSON.parse(response.choices[0].message.content);

  return {
    total_hashtags_analyzed: hashtags.length,
    raw_data: hashtagData,
    ...aiAnalysis,
  };
}
