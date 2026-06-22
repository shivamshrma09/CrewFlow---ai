import googleTrends from "google-trends-api";
import Groq from "groq-sdk";
import dotenv from "dotenv";
dotenv.config();

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

/**
 * Fetch trending topics for a niche from Google Trends
 */
async function fetchTrends(niche, geo = "IN") {
  const [relatedTopics, relatedQueries, dailyTrends] = await Promise.allSettled([
    googleTrends.relatedTopics({ keyword: niche, geo, hl: "hi" }),
    googleTrends.relatedQueries({ keyword: niche, geo, hl: "hi" }),
    googleTrends.dailyTrends({ trendDate: new Date(), geo }),
  ]);

  // Parse related topics
  let topics = [];
  if (relatedTopics.status === "fulfilled") {
    const parsed = JSON.parse(relatedTopics.value);
    topics = parsed?.default?.rankedList?.[0]?.rankedKeyword?.slice(0, 10).map((t) => ({
      topic: t.topic?.title || t.query,
      type: t.topic?.type || "topic",
      value: t.value,
    })) || [];
  }

  // Parse related queries
  let queries = [];
  if (relatedQueries.status === "fulfilled") {
    const parsed = JSON.parse(relatedQueries.value);
    queries = parsed?.default?.rankedList?.[0]?.rankedKeyword?.slice(0, 10).map((q) => ({
      query: q.query,
      value: q.value,
    })) || [];
  }

  // Parse daily trends
  let daily = [];
  if (dailyTrends.status === "fulfilled") {
    const parsed = JSON.parse(dailyTrends.value);
    daily = parsed?.default?.trendingSearchesDays?.[0]?.trendingSearches?.slice(0, 5).map((t) => ({
      title: t.title?.query,
      traffic: t.formattedTrafficVolume,
      articles: t.articles?.slice(0, 2).map((a) => ({ title: a.title, url: a.url })) || [],
    })) || [];
  }

  return { topics, queries, daily };
}

/** Daily + related trends only (no AI) */
export async function fetchDailyTrends(niche = "", geo = "IN") {
  const trends = niche ? await fetchTrends(niche, geo) : await fetchTrends("India", geo);
  return {
    daily: trends.daily,
    related_topics: trends.topics,
    related_queries: trends.queries,
    fetched_at: new Date().toISOString(),
  };
}

/**
 * Generate viral short-form scripts for trending topics
 */
export async function trendJack(niche, platform = "youtube_shorts", language = "hinglish") {
  const trends = await fetchTrends(niche);

  const trendList = [
    ...trends.topics.map((t) => t.topic),
    ...trends.queries.map((q) => q.query),
    ...trends.daily.map((d) => d.title),
  ]
    .filter(Boolean)
    .slice(0, 15)
    .join(", ") || `${niche} tips, ${niche} India 2025, how to ${niche}, best ${niche} content`; // fallback if trends unavailable

  const prompt = `You are a viral content creator specializing in Indian short-form content.

Niche: ${niche}
Platform: ${platform}
Language: ${language}
Current Trending Topics in India: ${trendList}

Create content that JACKS these trends for the creator's niche. Return JSON:
{
  "top_trends_to_use": [
    {
      "trend": "trend name",
      "relevance_to_niche": "why this trend fits the niche",
      "viral_angle": "unique angle to approach this trend"
    }
  ],
  "scripts": [
    {
      "trend": "trend used",
      "title": "video title",
      "hook": "first 3 seconds - must be shocking/curious",
      "script": "full 60-second script",
      "cta": "call to action at end",
      "hashtags": ["#tag1", "#tag2", "#tag3", "#tag4", "#tag5"]
    }
  ],
  "best_posting_time": "best time to post to catch the trend",
  "trend_urgency": "how many hours/days this trend will last"
}

Generate 3 scripts. Respond ONLY with valid JSON.`;

  const response = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.8,
    response_format: { type: "json_object" },
  });

  const aiContent = JSON.parse(response.choices[0].message.content);

  return {
    niche,
    platform,
    raw_trends: trends,
    ...aiContent,
  };
}
