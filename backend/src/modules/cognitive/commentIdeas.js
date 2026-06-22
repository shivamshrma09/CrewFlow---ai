import Groq from "groq-sdk";
import dotenv from "dotenv";
import { fetchComments } from "./commentResponder.js";

dotenv.config();

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

/**
 * Fetch recent video comments and generate content ideas with psychological analysis & charts
 */
export async function suggestContentIdeas(youtube, creatorId) {
  let commentsPool = [];
  let channelNiche = "general creative";
  let channelTitle = "My Channel";

  try {
    // Step 1: Get channel details & uploads playlist
    const channelRes = await youtube.channels.list({
      part: "snippet,contentDetails",
      mine: true,
    });
    const channel = channelRes.data.items?.[0];
    if (!channel) throw new Error("Channel not found");

    channelTitle = channel.snippet.title;
    channelNiche = channel.snippet.description?.slice(0, 150) || "general creative";

    const uploadsPlaylistId = channel.contentDetails.relatedPlaylists.uploads;

    // Step 2: Get recent 5 videos
    const playlistItemsRes = await youtube.playlistItems.list({
      part: "contentDetails,snippet",
      playlistId: uploadsPlaylistId,
      maxResults: 5,
    });

    const videos = playlistItemsRes.data.items || [];
    
    // Step 3: Fetch comments from top 3 recent videos in parallel
    if (videos.length > 0) {
      const commentFetches = videos.slice(0, 3).map(async (v) => {
        try {
          const videoId = v.contentDetails.videoId;
          const videoComments = await fetchComments(youtube, videoId, 20);
          return videoComments.map(c => c.text);
        } catch (e) {
          console.warn(`Could not fetch comments for video ${v.contentDetails.videoId}:`, e.message);
          return [];
        }
      });

      const results = await Promise.all(commentFetches);
      commentsPool = results.flat();
    }
  } catch (err) {
    console.error("Error gathering comments for ideas:", err);
  }

  // Define prompt for Groq
  let prompt = "";
  if (commentsPool.length > 0) {
    prompt = `You are a psychological audience researcher and YouTube growth consultant.
We have collected the following real comments from the creator's recent YouTube videos:

Channel Name: "${channelTitle}"
Description/Niche: "${channelNiche}"

Comments List:
${commentsPool.map((c, i) => `${i + 1}. "${c}"`).slice(0, 50).join("\n")}

Task:
1. Perform a psychological audience analysis based on these comments. Identify their underlying emotional state, core pain points, questions, and aspirations.
2. Propose 3 fresh, specific video ideas that directly address these needs.
3. For each video idea, provide a psychological analysis of why this topic/angle triggers their interest (e.g. curiosity gap, need for validation, relief from anxiety, aspiration, or cognitive dissonance).
4. Estimate a numerical psychological sentiment distribution (out of 100 total) expressing the split between the following emotional dynamics: Curiosity, Appreciation, Frustration, and Confusion.

Return the response ONLY as a valid JSON object matching this structure:
{
  "audience_mindset_summary": "Summary of the general emotional status and requests of the audience.",
  "sentiment_distribution": {
    "curiosity": 40,
    "appreciation": 30,
    "frustration": 20,
    "confusion": 10
  },
  "ideas": [
    {
      "title": "Catchy, click-worthy video title",
      "concept": "Brief description of the video content and what it covers.",
      "psychological_need": "E.g. Relieving information overload / Seeking social validation",
      "psychological_analysis": "Explanation of the mental trigger. Why will the viewer feel compelled to click this video based on their comments? (e.g., They expressed frustration about X, this video offers immediate relief because...)"
    }
  ]
}

Ensure that curiosity + appreciation + frustration + confusion sum up to exactly 100.
Respond ONLY with valid JSON.`;
  } else {
    // Fallback if no comments were found
    prompt = `You are a psychological audience researcher and YouTube growth consultant.
The creator's YouTube channel currently has no comments or comments could not be loaded.

Channel Name: "${channelTitle}"
Description/Niche: "${channelNiche}"

Since comments are empty, we need to brainstorm 3 ideas that align with typical audience desires in this niche.
Provide:
1. A summary of typical audience psychology for this niche.
2. 3 video ideas with creative titles, concepts, and a psychological analysis of why people click on this type of content.
3. Estimate a benchmark psychological sentiment distribution (out of 100 total) for typical audiences in this niche.

Return the response ONLY as a valid JSON object matching this structure:
{
  "audience_mindset_summary": "Brainstormed general mindset and interests of target viewers in this niche.",
  "sentiment_distribution": {
    "curiosity": 45,
    "appreciation": 25,
    "frustration": 15,
    "confusion": 15
  },
  "ideas": [
    {
      "title": "Catchy, click-worthy video title",
      "concept": "Brief description of the video content and what it covers.",
      "psychological_need": "Psychological driver for this niche (e.g., escape from routine, self-improvement)",
      "psychological_analysis": "Why this topic appeals to this specific target audience psychologically."
    }
  ]
}

Ensure that curiosity + appreciation + frustration + confusion sum up to exactly 100.
Respond ONLY with valid JSON.`;
  }

  try {
    const response = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.75,
      response_format: { type: "json_object" },
    });

    return JSON.parse(response.choices[0].message.content);
  } catch (err) {
    console.error("Groq error in content ideas generator:", err);
    throw new Error("Failed to generate content ideas: " + err.message);
  }
}
