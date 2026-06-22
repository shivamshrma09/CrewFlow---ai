import { google } from "googleapis";
import { pool } from "../db/index.js";
import dotenv from "dotenv";
dotenv.config();

const SCOPES = [
  "openid",
  "https://www.googleapis.com/auth/userinfo.email",
  "https://www.googleapis.com/auth/userinfo.profile",
  "https://www.googleapis.com/auth/youtube.readonly",
  "https://www.googleapis.com/auth/youtube.force-ssl",
  "https://www.googleapis.com/auth/yt-analytics.readonly",
  "https://www.googleapis.com/auth/yt-analytics-monetary.readonly",
];

function makeOAuthClient() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );
}

export function getAuthUrl() {
  const oauth2Client = makeOAuthClient();
  return oauth2Client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: SCOPES,
  });
}

export async function handleCallback(code) {
  const oauth2Client = makeOAuthClient();
  const { tokens } = await oauth2Client.getToken(code);
  oauth2Client.setCredentials(tokens);

  // Get user profile
  const oauth2 = google.oauth2({ version: "v2", auth: oauth2Client });
  const { data: userInfo } = await oauth2.userinfo.get();

  // Upsert into DB
  await pool.query(
    `INSERT INTO creators (id, email, name, picture, access_token, refresh_token, token_uri, scopes)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     ON CONFLICT (id) DO UPDATE SET
       access_token  = EXCLUDED.access_token,
       refresh_token = COALESCE(EXCLUDED.refresh_token, creators.refresh_token),
       token_uri     = EXCLUDED.token_uri,
       scopes        = EXCLUDED.scopes,
       updated_at    = NOW()`,
    [
      userInfo.id,
      userInfo.email,
      userInfo.name,
      userInfo.picture,
      tokens.access_token,
      tokens.refresh_token || null,
      "https://oauth2.googleapis.com/token",
      SCOPES.join(","),
    ]
  );

  return userInfo.id;
}

export async function getYouTubeClient(creatorId) {
  const { rows } = await pool.query(
    "SELECT * FROM creators WHERE id = $1",
    [creatorId]
  );
  if (!rows.length) throw new Error(`Creator ${creatorId} not connected`);

  const creator = rows[0];
  const oauth2Client = makeOAuthClient();
  oauth2Client.setCredentials({
    access_token: creator.access_token,
    refresh_token: creator.refresh_token,
    token_uri: creator.token_uri,
  });

  // Auto-refresh if expired
  oauth2Client.on("tokens", async (newTokens) => {
    if (newTokens.access_token) {
      await pool.query(
        "UPDATE creators SET access_token = $1, updated_at = NOW() WHERE id = $2",
        [newTokens.access_token, creatorId]
      );
    }
  });

  return google.youtube({ version: "v3", auth: oauth2Client });
}

export async function getAnalyticsClient(creatorId) {
  const { rows } = await pool.query("SELECT * FROM creators WHERE id = $1", [creatorId]);
  if (!rows.length) throw new Error(`Creator ${creatorId} not found or not connected`);

  const creator = rows[0];
  const oauth2Client = makeOAuthClient();
  oauth2Client.setCredentials({
    access_token: creator.access_token,
    refresh_token: creator.refresh_token,
    token_uri: creator.token_uri,
  });

  oauth2Client.on("tokens", async (newTokens) => {
    if (newTokens.access_token) {
      await pool.query(
        "UPDATE creators SET access_token = $1, updated_at = NOW() WHERE id = $2",
        [newTokens.access_token, creatorId]
      );
    }
  });

  return google.youtubeAnalytics({ version: "v2", auth: oauth2Client });
}
