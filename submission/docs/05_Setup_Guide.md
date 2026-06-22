# CrewFlow — Setup & Run Guide

## Quick Start

### Prerequisites
- Node.js v18 or higher
- PostgreSQL 14+
- A Google Cloud project with YouTube Data API v3 enabled
- Groq API key (free at console.groq.com)
- ElevenLabs API key (for voice features)
- ImageKit account (free tier works)

---

## Step 1: Clone the Repository

```bash
git clone https://github.com/shivamshrma09/CrewFlow---ai.git
cd CrewFlow---ai
```

---

## Step 2: Backend Setup

```bash
cd backend
npm install
```

Create `backend/.env`:
```env
PORT=8000
FRONTEND_URL=http://localhost:5173

# PostgreSQL
DATABASE_URL=postgresql://username:password@localhost:5432/crewflow

# Google OAuth (YouTube)
GOOGLE_CLIENT_ID=<your_google_oauth_client_id>
GOOGLE_CLIENT_SECRET=<your_google_oauth_client_secret>
GOOGLE_REDIRECT_URI=http://localhost:8000/auth/youtube/callback

# AI
GROQ_API_KEY=<your_groq_api_key>

# Voice
ELEVENLABS_API_KEY=<your_elevenlabs_api_key>

# Media Storage
IMAGEKIT_PUBLIC_KEY=<your_imagekit_public_key>
IMAGEKIT_PRIVATE_KEY=<your_imagekit_private_key>
IMAGEKIT_URL_ENDPOINT=https://ik.imagekit.io/<your_imagekit_id>
```

Start backend:
```bash
npm run dev
# Server runs on http://localhost:8000
```

---

## Step 3: Frontend Setup

```bash
cd frontend
npm install
npm run dev
# App runs on http://localhost:5173
```

---

## Step 4: Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project
3. Enable **YouTube Data API v3** and **YouTube Analytics API**
4. Go to **Credentials** → Create **OAuth 2.0 Client ID**
5. Add authorized redirect URI: `http://localhost:8000/auth/youtube/callback`
6. Copy Client ID and Client Secret to your `.env`

---

## Step 5: Database Setup

PostgreSQL creates tables automatically on first run via `src/db/index.js`.

Or manually:
```sql
CREATE DATABASE crewflow;

CREATE TABLE creators (
  id            TEXT PRIMARY KEY,
  name          TEXT,
  email         TEXT,
  picture       TEXT,
  access_token  TEXT,
  refresh_token TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);
```

---

## API Keys — Where to Get Them

| Service | URL | Free Tier |
|---------|-----|-----------|
| Groq AI | https://console.groq.com | Yes — 14,400 requests/day |
| ElevenLabs | https://elevenlabs.io | Yes — 10,000 chars/month |
| ImageKit | https://imagekit.io | Yes — 20GB bandwidth/month |
| Google Cloud | https://console.cloud.google.com | Yes — 10,000 YouTube API units/day |

---

## Production Build

```bash
# Frontend production build
cd frontend
npm run build
# Output in frontend/dist/

# Backend production start
cd backend
npm start
```

---

## Common Issues

**"Cannot connect to database"**
→ Check `DATABASE_URL` in `.env`, ensure PostgreSQL is running

**"YouTube OAuth error"**
→ Verify redirect URI matches exactly in Google Cloud Console

**"Groq API rate limit"**
→ Free tier: 14,400 req/day. Add delay between batch requests.

**"yt-dlp not found"**
→ `bin/yt-dlp.exe` is excluded from git (too large). Download from https://github.com/yt-dlp/yt-dlp/releases and place in `backend/bin/`

---

## Project Scripts

| Command | Description |
|---------|-------------|
| `cd backend && npm run dev` | Start backend with hot reload |
| `cd backend && npm start` | Start backend (production) |
| `cd frontend && npm run dev` | Start frontend dev server |
| `cd frontend && npm run build` | Build frontend for production |
| `cd frontend && npm run lint` | Lint frontend code |

---

*CrewFlow Setup Guide v1.0 | June 2026*
