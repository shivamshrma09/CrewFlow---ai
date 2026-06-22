import Groq from "groq-sdk";
import dotenv from "dotenv";
dotenv.config();

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

/**
 * Find similar creators for collaboration
 */
export async function findCollaborators(youtubeClient, creatorId, niche, maxResults = 10) {
  // Step 1: Get own channel stats
  const ownChannelRes = await youtubeClient.channels.list({
    part: "snippet,statistics",
    mine: true,
  });
  const ownChannel = ownChannelRes.data.items[0];
  const ownSubs = parseInt(ownChannel.statistics.subscriberCount || 0);
  const ownViews = parseInt(ownChannel.statistics.viewCount || 0);

  // Step 2: Search for similar creators in same niche
  const searchRes = await youtubeClient.search.list({
    part: "snippet",
    q: niche,
    type: "channel",
    maxResults: 20,
    regionCode: "IN",
    relevanceLanguage: "hi",
    order: "relevance",
  });

  const channelIds = searchRes.data.items
    .map((i) => i.snippet.channelId || i.id?.channelId)
    .filter((id) => id && id !== ownChannel.id)
    .slice(0, 15)
    .join(",");

  if (!channelIds) return { collaborators: [], message: "No similar channels found" };

  // Step 3: Get full stats for found channels
  const channelsRes = await youtubeClient.channels.list({
    part: "snippet,statistics,brandingSettings",
    id: channelIds,
  });

  const channels = channelsRes.data.items.map((c) => ({
    channel_id: c.id,
    title: c.snippet.title,
    description: c.snippet.description?.slice(0, 200),
    custom_url: c.snippet.customUrl,
    country: c.snippet.country,
    thumbnail: c.snippet.thumbnails?.high?.url,
    subscribers: parseInt(c.statistics.subscriberCount || 0),
    total_views: parseInt(c.statistics.viewCount || 0),
    total_videos: parseInt(c.statistics.videoCount || 0),
    keywords: c.brandingSettings?.channel?.keywords || "",
  }));

  // Step 4: AI matching + collab score
  const prompt = `You are a YouTube collaboration strategist for Indian creators.

My Channel: "${ownChannel.snippet.title}"
My Subscribers: ${ownSubs}
My Total Views: ${ownViews}
My Niche: ${niche}

Potential Collaborators:
${JSON.stringify(channels.map((c) => ({
  channel_id: c.channel_id,
  title: c.title,
  subscribers: c.subscribers,
  total_views: c.total_views,
  description: c.description,
  country: c.country,
  keywords: c.keywords,
})), null, 2)}

Analyze each channel and return JSON:
{
  "collaborators": [
    {
      "channel_id": "UCxxx",
      "title": "channel name",
      "subscribers": 0,
      "collab_score": 0,
      "audience_overlap_estimate": "low|medium|high",
      "collab_type": "best collaboration format e.g. podcast, challenge, duet video",
      "why_good_match": "reason",
      "subscriber_ratio": "their subs vs your subs ratio analysis",
      "reach_potential": "estimated combined reach"
    }
  ],
  "top_pick": "channel_id of best collab",
  "strategy": "overall collab strategy advice"
}

Sort by collab_score descending (0-100).
Only include channels with collab_score > 40.
Respond ONLY with valid JSON.`;

  const response = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.5,
    response_format: { type: "json_object" },
  });

  const aiAnalysis = JSON.parse(response.choices[0].message.content);

  // Merge AI analysis with full channel data
  const channelById = Object.fromEntries(channels.map((c) => [c.channel_id, c]));
  const enrichedCollabs = (aiAnalysis.collaborators || []).map((c) => ({
    ...channelById[c.channel_id],
    ...c,
  }));

  return {
    my_channel: {
      id: ownChannel.id,
      title: ownChannel.snippet.title,
      subscribers: ownSubs,
    },
    niche,
    total_analyzed: channels.length,
    collaborators: enrichedCollabs,
    top_pick: aiAnalysis.top_pick,
    strategy: aiAnalysis.strategy,
  };
}
