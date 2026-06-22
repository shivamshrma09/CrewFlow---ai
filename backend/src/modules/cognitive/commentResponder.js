import Groq from "groq-sdk";
import dotenv from "dotenv";
dotenv.config();

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function fetchComments(youtube, videoId, maxComments = 100) {
  const comments = [];
  let nextPageToken = null;

  do {
    const res = await youtube.commentThreads.list({
      part: "snippet",
      videoId,
      maxResults: Math.min(100, maxComments - comments.length),
      pageToken: nextPageToken || undefined,
      order: "relevance",
    });

    for (const item of res.data.items) {
      const s = item.snippet.topLevelComment.snippet;
      comments.push({
        comment_id: item.snippet.topLevelComment.id,
        text: s.textDisplay,
        author: s.authorDisplayName,
        author_profile_image: s.authorProfileImageUrl,
        author_channel_url: s.authorChannelUrl,
        like_count: s.likeCount,
        reply_count: item.snippet.totalReplyCount,
        published_at: s.publishedAt,
        updated_at: s.updatedAt,
        can_reply: item.snippet.canReply,
      });
    }

    nextPageToken = res.data.nextPageToken;
  } while (nextPageToken && comments.length < maxComments);

  return comments;
}

export async function analyzeAndReply(comments) {
  const commentLines = comments
    .map((c, i) => `${i + 1}. [${c.author}]: ${c.text}`)
    .join("\n");

  const prompt = `You are CrewFlow's AI assistant helping a YouTube creator manage comments.

Analyze each comment and return a JSON object with key "results" containing an array.
For each comment provide:
- "index": (1-based number)
- "sentiment": one of [positive, negative, question, angry, neutral]
- "priority": one of [high, medium, low]
- "draft_reply": short friendly human-like reply in same language as the comment

Comments:
${commentLines}

Respond ONLY with valid JSON like: {"results": [{"index": 1, "sentiment": "positive", "priority": "low", "draft_reply": "Thank you! 🙏"}]}`;

  const response = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.7,
    response_format: { type: "json_object" },
  });

  const parsed = JSON.parse(response.choices[0].message.content);
  const results = parsed.results || Object.values(parsed)[0];

  const byIndex = Object.fromEntries(results.map((r) => [r.index, r]));
  return comments.map((c, i) => ({
    ...c,
    sentiment: byIndex[i + 1]?.sentiment || "neutral",
    priority: byIndex[i + 1]?.priority || "low",
    draft_reply: byIndex[i + 1]?.draft_reply || "",
  }));
}

export async function analyzeAudience(comments) {
  const commentLines = comments
    .slice(0, 80)
    .map((c, i) => `${i + 1}. ${c.text}`)
    .join('\n')

  const prompt = `You are a YouTube audience analyst. Analyze these ${comments.length} comments and return JSON:
{
  "overall_mood": "positive|negative|mixed|neutral",
  "mood_summary": "2-3 sentence summary of what the audience feels and thinks overall",
  "sentiment_breakdown": {
    "positive": 0,
    "neutral": 0,
    "negative": 0,
    "question": 0,
    "excited": 0
  },
  "top_themes": ["theme1", "theme2", "theme3", "theme4", "theme5"],
  "common_requests": ["what viewers are asking for"],
  "pain_points": ["things viewers complained about"],
  "creator_tip": "one actionable tip for the creator based on these comments"
}

Comments:
${commentLines}

Respond ONLY with valid JSON.`

  const response = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.4,
    response_format: { type: 'json_object' },
  })

  return JSON.parse(response.choices[0].message.content)
}

export async function postReply(youtube, commentId, replyText) {
  const res = await youtube.comments.insert({
    part: "snippet",
    requestBody: {
      snippet: {
        parentId: commentId,
        textOriginal: replyText,
      },
    },
  });
  return { status: "posted", reply_id: res.data.id };
}

export async function translateComment(text, targetLang = "English") {
  const prompt = `You are a translation assistant. Translate the following YouTube comment into plain, natural, and polite ${targetLang}. Keep the emotional tone and any emojis intact.
Comment: "${text}"
Respond ONLY with the translated text. Do not add quotes, explanations, or introductory text.`;

  const response = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.3,
  });

  return response.choices[0].message.content.trim();
}

