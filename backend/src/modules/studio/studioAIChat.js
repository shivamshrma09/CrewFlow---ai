import Groq from "groq-sdk";
import dotenv from "dotenv";
import {
  getStudioOverview,
  getStudioAudience,
  getStudioRealtime,
} from "./studioAnalytics.js";

dotenv.config();

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

/**
 * Handle chat query with Studio AI using creator's channel statistics
 */
export async function chatWithStudio(youtube, analytics, creatorId, message, chatHistory = []) {
  let statsSummary = {};
  let fetchError = null;

  try {
    // Attempt to gather detailed channel analytics
    const [overview, audience, realtime] = await Promise.all([
      getStudioOverview(analytics, youtube).catch(err => {
        console.warn("Studio Overview fetch failed:", err.message);
        return null;
      }),
      getStudioAudience(analytics, youtube).catch(err => {
        console.warn("Studio Audience fetch failed:", err.message);
        return null;
      }),
      getStudioRealtime(youtube).catch(err => {
        console.warn("Studio Realtime fetch failed:", err.message);
        return null;
      }),
    ]);

    // Build the statistics context for LLM
    if (overview && realtime) {
      statsSummary = {
        channel_name: overview.channel?.title || "Unknown Creator",
        subscribers: realtime.subscribers || 0,
        last_28_days: {
          views: overview.summary?.views || 0,
          views_growth_percent: overview.summary?.views_change_percent || 0,
          watch_time_hours: overview.summary?.watch_time_hours || 0,
          watch_time_growth_percent: overview.summary?.watch_time_change_percent || 0,
          net_subscribers_change: overview.summary?.net_subscribers || 0,
          avg_view_duration_seconds: overview.summary?.avg_view_duration_seconds || 0,
        },
        device_mix: (audience?.device_breakdown || []).map(
          (d) => `${d.device}: ${d.percent}%`
        ),
        subscriber_watch_ratio: (audience?.subscriber_breakdown || []).map(
          (s) => `${s.status}: ${s.percent}%`
        ),
        top_videos: (overview.top_content || []).slice(0, 5).map((v) => ({
          title: v.title,
          views: v.views,
          duration: v.duration,
          avg_view_duration_seconds: v.avg_view_duration_seconds,
        })),
        recent_uploads: (realtime.latest_videos || []).slice(0, 5).map((v) => ({
          title: v.title,
          views: v.views,
          likes: v.likes,
          comments: v.comments,
        })),
      };
    } else {
      // Fallback: load basic channel stats if overview was empty or failed
      const channelRes = await youtube.channels.list({
        part: "snippet,statistics",
        mine: true,
      });
      const channel = channelRes.data.items?.[0];
      if (channel) {
        statsSummary = {
          channel_name: channel.snippet?.title,
          subscribers: parseInt(channel.statistics?.subscriberCount || 0),
          total_views: parseInt(channel.statistics?.viewCount || 0),
          total_videos: parseInt(channel.statistics?.videoCount || 0),
          note: "Detailed last 28 days analytics not accessible. Showing overall lifetime metrics."
        };
      }
    }
  } catch (err) {
    fetchError = err.message;
    console.error("Failed to fetch channel statistics for chat:", err);
    // Basic fallback if everything fails
    statsSummary = {
      note: "Could not fetch channel details. Give general growth and strategy advice."
    };
  }

  // Pre-configured system instructions
  const systemPrompt = `You are "Studio AI", a highly skilled YouTube channel strategist and growth consultant built into the CrewFlow platform.
You have access to the creator's real-time YouTube channel statistics and performance metrics.

Here is the current snapshot of their channel data:
${JSON.stringify(statsSummary, null, 2)}
${fetchError ? `(Error logs: ${fetchError})` : ""}

Use this channel data to answer their query.
Guidelines:
1. Provide specific, data-driven, and highly actionable suggestions. Be encouraging but honest about what needs improvement.
2. If they ask about views, subscribers, or watch time, quote the actual numbers from the stats summary above.
3. If they use Hinglish (Hindi written in Latin script), Hindi, or English, reply in the same language and tone they use!
4. Use markdown formatting to make the answer clear, structured, and easy to read. (e.g. lists, bullet points, headers, bold text).
5. If the stats summary shows no or limited data (because the channel is new or Analytics API failed), explain that analytics are still loading or unavailable and provide excellent general growth strategies for their niche/questions.`;

  // Prepare messages array with history
  const messages = [
    { role: "system", content: systemPrompt },
    ...chatHistory.map((h) => ({
      role: h.sender === "user" ? "user" : "assistant",
      content: h.text,
    })),
    { role: "user", content: message },
  ];

  try {
    const response = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: messages,
      temperature: 0.7,
      max_tokens: 1524,
    });

    return response.choices[0].message.content;
  } catch (err) {
    console.error("Groq API error in Studio AI Chat:", err);
    throw new Error("Failed to generate response from AI: " + err.message);
  }
}
