# CrewFlow — Technical Documentation

## 1. Project Overview

**CrewFlow** is an AI-powered content management platform built specifically for YouTube and social media creators in India. It automates 90% of the repetitive content work — from comment replies and hook generation to trend detection, revenue estimation, and automated video editing.

**Live Repo:** https://github.com/shivamshrma09/CrewFlow---ai  
**Stack:** React 19 + Vite 8 (Frontend) | Node.js + Express (Backend) | PostgreSQL (Database)

---

## 2. Tech Stack

### Frontend
| Technology | Version | Purpose |
|---|---|---|
| React | 19.2.6 | UI framework |
| Vite | 8.0.12 | Build tool & dev server |
| Tailwind CSS | 4.3.1 | Styling |
| React Router DOM | 7.18.0 | Client-side routing |
| Axios | 1.18.0 | HTTP client |
| Lucide React | 1.21.0 | Icons |

### Backend
| Technology | Version | Purpose |
|---|---|---|
| Node.js | ESM | Runtime |
| Express | 4.19.2 | HTTP server |
| PostgreSQL (pg) | 8.12.0 | Database |
| Groq SDK | 0.5.0 | LLaMA 3 AI completions |
| ElevenLabs JS | 2.53.1 | Voice cloning & TTS |
| Google APIs | 140.0.1 | YouTube Data & Analytics API |
| Fluent-FFmpeg | 2.1.3 | Video processing |
| yt-dlp-wrap | 2.3.12 | YouTube video download |
| Multer | 2.2.0 | File upload handling |
| ImageKit Node | 7.8.0 | Cloud media storage |
| Google Trends API | 4.9.2 | Live trend data |
| dotenv | 16.4.5 | Environment config |

---

## 3. System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     FRONTEND (React/Vite)               │
│  Home.jsx → Auth.jsx → Dashboard.jsx                    │
│  Components: Sidebar, Overview, Analytics, Studio...    │
└────────────────────────┬────────────────────────────────┘
                         │ HTTP (Axios)
                         ▼
┌─────────────────────────────────────────────────────────┐
│                  BACKEND (Express.js)                   │
│                                                         │
│  /auth       → YouTube OAuth 2.0                        │
│  /dashboard  → Channel + Video data                     │
│  /cognitive  → Comments, Hooks, Repurpose               │
│  /voice      → STT, TTS, Voice Clone, Resize            │
│  /analytics  → Retention, Revenue, Fake Scanner         │
│  /growth     → Trends, Hashtags, Collaborators          │
└──────┬───────────┬──────────┬───────────┬───────────────┘
       │           │          │           │
       ▼           ▼          ▼           ▼
  PostgreSQL   Google     Groq AI    ElevenLabs
  (User data)  YouTube    (LLaMA 3)  (Voice)
               API
                           ▼           ▼
                       ImageKit    FFmpeg/yt-dlp
                       (Storage)   (Video Processing)
```

---

## 4. Project Structure

```
CrewFlow/
├── backend/
│   ├── src/
│   │   ├── auth/
│   │   │   └── youtube.js          # Google OAuth 2.0 flow
│   │   ├── db/
│   │   │   └── index.js            # PostgreSQL connection + schema
│   │   ├── modules/
│   │   │   ├── cognitive/          # AI content intelligence
│   │   │   │   ├── commentResponder.js
│   │   │   │   ├── commentIdeas.js
│   │   │   │   ├── hookGenerator.js
│   │   │   │   ├── repurposer.js
│   │   │   │   ├── postGenerator.js
│   │   │   │   ├── metadataOptimizer.js
│   │   │   │   ├── shortsGenerator.js
│   │   │   │   ├── videoDiagnostics.js
│   │   │   │   └── videoStudio.js
│   │   │   ├── analytics/          # Data analytics
│   │   │   │   ├── retentionPredictor.js
│   │   │   │   ├── revenueEstimator.js
│   │   │   │   └── fakeFollowerScanner.js
│   │   │   ├── growth/             # Growth intelligence
│   │   │   │   ├── trendJacking.js
│   │   │   │   ├── hashtagROI.js
│   │   │   │   └── collaboratorFinder.js
│   │   │   ├── voice/              # Audio/Video processing
│   │   │   │   ├── speechToText.js
│   │   │   │   ├── voiceClone.js
│   │   │   │   ├── videoResizer.js
│   │   │   │   ├── imagekitUploader.js
│   │   │   │   └── multerConfig.js
│   │   │   └── studio/             # Studio AI
│   │   │       ├── studioAIChat.js
│   │   │       └── studioAnalytics.js
│   │   └── routes/
│   │       ├── auth.routes.js
│   │       ├── cognitive.routes.js
│   │       ├── dashboard.routes.js
│   │       ├── voice.routes.js
│   │       ├── analytics.routes.js
│   │       └── growth.routes.js
│   ├── index.js                    # Express app entry
│   └── package.json
│
└── frontend/
    ├── src/
    │   ├── pages/
    │   │   ├── Home.jsx            # Landing page
    │   │   ├── Auth.jsx            # YouTube OAuth login
    │   │   └── Dashboard.jsx       # Main app dashboard
    │   ├── components/dashboard/
    │   │   ├── Sidebar.jsx
    │   │   ├── Overview.jsx
    │   │   ├── Analytics.jsx
    │   │   ├── ChannelAnalytics.jsx
    │   │   ├── ChannelContent.jsx
    │   │   ├── Comments.jsx
    │   │   ├── Growth.jsx
    │   │   ├── HookGenerator.jsx
    │   │   ├── PostManager.jsx
    │   │   ├── Repurpose.jsx
    │   │   ├── StudioAI.jsx
    │   │   ├── StudioAnalytics.jsx
    │   │   ├── Translate.jsx
    │   │   ├── TrendHub.jsx
    │   │   ├── VideoDetailPage.jsx
    │   │   └── VideoStudio.jsx
    │   ├── lib/
    │   │   └── api.js              # Axios API client
    │   └── App.jsx                 # Router setup
    └── package.json
```

---

## 5. Module Breakdown

### 5.1 Authentication Module
- Google OAuth 2.0 via YouTube Data API
- Stores access tokens in PostgreSQL per `creator_id`
- Refresh token handling for persistent sessions

### 5.2 Cognitive AI Module
| Feature | AI Model | Input | Output |
|---|---|---|---|
| Comment Responder | Groq LLaMA 3 | Video ID | Sentiment + Priority + Draft Reply per comment |
| Hook Generator | Groq LLaMA 3 | Topic + Niche | 5 Hooks + 5 Titles + 5 Thumbnail Texts |
| Content Repurposer | Groq LLaMA 3 | Script / Video ID | 10 content assets |
| Video Diagnostics | Groq LLaMA 3 | Video ID | SEO Score + Alternatives + Hook Script |
| Psych Planner | Groq LLaMA 3 | Comments | Psych map + Content blueprints |

### 5.3 Video Studio Module
| Feature | Technology | Description |
|---|---|---|
| Video Package Generator | Groq LLaMA 3 | Full script + SEO + AI thumbnail via Pollinations API |
| Shorts Auto-Cutter | yt-dlp + FFmpeg | Downloads YT video, AI picks moments, crops to 9:16 |
| Community Post Creator | Groq + YouTube API | Write + publish community posts with analytics |

### 5.4 Analytics Module
| Feature | Data Source | Output |
|---|---|---|
| Retention Predictor | YouTube Analytics API | Drop timestamps + Script Doctor rewrites |
| Revenue Estimator | Channel stats | ₹ AdSense + Brand deal + Sponsorship rates |
| Fake Follower Scanner | YouTube Data API | Authenticity score 0–100 + red/green flags |

### 5.5 Growth Intelligence Module
| Feature | Data Source | Output |
|---|---|---|
| Trend Jacking Engine | Google Trends API (India) | Live trends + 3 ready scripts |
| Hashtag ROI Calculator | YouTube + Google Trends | ROI score per hashtag + recommended set |
| Collaborator Finder | YouTube Search API | Collab score + audience overlap + top pick |

### 5.6 Voice & Audio Module
| Feature | Technology | Description |
|---|---|---|
| Speech to Text | Groq Whisper | Audio → text with timestamps, 12 Indian languages |
| Voice Cloning | ElevenLabs XTTS | 30s sample → cloned voice for TTS |
| Video Resizer | FFmpeg + ImageKit | 1 video → 6 platform formats |
| Script Translator | Groq LLaMA 3 | Script → 12 regional Indian languages |

---

## 6. Database Schema

```sql
-- Creators table
CREATE TABLE creators (
  id            TEXT PRIMARY KEY,       -- Google user ID
  name          TEXT,
  email         TEXT,
  picture       TEXT,
  access_token  TEXT,
  refresh_token TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 7. API Endpoints Summary

| Method | Route | Description |
|---|---|---|
| GET | /auth/youtube/start | Initiate OAuth |
| GET | /auth/me | Get creator profile |
| GET | /dashboard | Full channel data |
| GET | /dashboard/videos/all | All videos with stats |
| POST | /cognitive/comments/analyze | AI comment analysis |
| POST | /cognitive/comments/reply | Post reply to YouTube |
| POST | /cognitive/hooks/generate | Generate hooks + titles |
| POST | /cognitive/repurpose | 10 content assets |
| POST | /voice/transcribe | Audio → text |
| POST | /voice/clone | Clone voice |
| POST | /voice/tts | Text to speech |
| POST | /voice/resize | Video platform resize |
| POST | /voice/translate | Regional script translation |
| GET | /analytics/retention | Retention predictor |
| GET | /analytics/revenue | Revenue estimator |
| GET | /analytics/fake-scanner | Fake follower scan |
| GET | /growth/trends | Live trend + scripts |
| GET | /growth/hashtag-roi | Hashtag ROI |
| GET | /growth/collaborators | Find collaborators |

Full API docs: See `API_DOCS.md` in `/backend`

---

## 8. Setup & Installation

### Prerequisites
- Node.js v18+
- PostgreSQL 14+
- FFmpeg (auto via ffmpeg-static)

### Backend Setup
```bash
cd backend
npm install
# Create .env file (see .env.example)
npm run dev        # runs on http://localhost:8000
```

### Frontend Setup
```bash
cd frontend
npm install
npm run dev        # runs on http://localhost:5173
npm run build      # production build
```

### Environment Variables (backend/.env)
```env
PORT=8000
FRONTEND_URL=http://localhost:5173
DATABASE_URL=postgresql://user:pass@localhost:5432/crewflow
GOOGLE_CLIENT_ID=<your_google_client_id>
GOOGLE_CLIENT_SECRET=<your_google_client_secret>
GROQ_API_KEY=<your_groq_api_key>
ELEVENLABS_API_KEY=<your_elevenlabs_api_key>
IMAGEKIT_PUBLIC_KEY=<your_imagekit_public_key>
IMAGEKIT_PRIVATE_KEY=<your_imagekit_private_key>
IMAGEKIT_URL_ENDPOINT=<your_imagekit_url_endpoint>
```

---

## 9. Key Design Decisions

1. **Groq LLaMA 3 over OpenAI** — Lower latency, free tier sufficient for MVP, faster inference for batch comment analysis
2. **PostgreSQL over MongoDB** — Structured creator + token data, ACID compliance needed for OAuth tokens
3. **yt-dlp binary** — Most reliable YouTube downloader, handles age-restricted and 4K content
4. **ImageKit for media** — Built-in CDN + on-the-fly image/video transformations (platform resize via URL params)
5. **React 19 + Vite 8** — Fastest dev experience, smallest bundle with tree-shaking
6. **Monorepo structure** — Frontend and backend in same repo for easier deployment and context sharing

---

## 10. Performance Notes

- Frontend bundle: 528 KB JS / 45 KB CSS (gzipped: 143 KB / 8.5 KB)
- Backend avg response time: < 800ms for AI endpoints (Groq is fast)
- Video processing: async job queue recommended for production (currently synchronous)
- YouTube API quota: 10,000 units/day — bulk video fetch is quota-heavy, paginated

---

*CrewFlow v1.0 — Built by Shivam Kumar | June 2026*
