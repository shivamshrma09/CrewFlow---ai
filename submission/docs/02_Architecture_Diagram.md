# CrewFlow — Architecture Diagram

## High-Level System Architecture

```
╔══════════════════════════════════════════════════════════════════════════════╗
║                           CREWFLOW PLATFORM                                ║
╠══════════════════════════════════════════════════════════════════════════════╣
║                                                                              ║
║  ┌─────────────────────────────────────────────────────────────────────┐    ║
║  │                     FRONTEND  (React 19 + Vite)                     │    ║
║  │                                                                     │    ║
║  │   ┌──────────┐   ┌──────────┐   ┌─────────────────────────────┐    │    ║
║  │   │ Home.jsx │   │ Auth.jsx │   │       Dashboard.jsx         │    │    ║
║  │   │ Landing  │   │ OAuth    │   │                             │    │    ║
║  │   │ Page     │   │ Login    │   │  ┌───────┐  ┌───────────┐  │    │    ║
║  │   └──────────┘   └──────────┘   │  │Sidebar│  │ Overview  │  │    │    ║
║  │                                 │  └───────┘  └───────────┘  │    │    ║
║  │                                 │  ┌──────────────────────┐  │    │    ║
║  │                                 │  │  Feature Components  │  │    │    ║
║  │                                 │  │  Comments | Analytics│  │    │    ║
║  │                                 │  │  Studio   | Growth   │  │    │    ║
║  │                                 │  │  Voice    | Trends   │  │    │    ║
║  │                                 │  └──────────────────────┘  │    │    ║
║  │                                 └─────────────────────────────┘    │    ║
║  └──────────────────────────────┬──────────────────────────────────────┘    ║
║                                 │                                            ║
║                          Axios HTTP Calls                                    ║
║                          (REST API + JSON)                                   ║
║                                 │                                            ║
║  ┌──────────────────────────────▼──────────────────────────────────────┐    ║
║  │                    BACKEND  (Node.js + Express)                     │    ║
║  │                        PORT: 8000                                   │    ║
║  │                                                                     │    ║
║  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────┐   │    ║
║  │  │  /auth   │ │/dashboard│ │/cognitive│ │  /voice  │ │/growth │   │    ║
║  │  │          │ │          │ │          │ │          │ │        │   │    ║
║  │  │ YouTube  │ │ Channel  │ │ Comments │ │  Speech  │ │ Trends │   │    ║
║  │  │ OAuth    │ │ Videos   │ │ Hooks    │ │  Voice   │ │Hashtags│   │    ║
║  │  │ Tokens   │ │ Stats    │ │ Repurpose│ │  Clone   │ │Collabs │   │    ║
║  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └────────┘   │    ║
║  │                                                                     │    ║
║  │  ┌─────────────────────────────────────────────────────────────┐   │    ║
║  │  │                     /analytics                              │   │    ║
║  │  │        Retention Predictor | Revenue Estimator              │   │    ║
║  │  │              Fake Follower Scanner                          │   │    ║
║  │  └─────────────────────────────────────────────────────────────┘   │    ║
║  └──────┬────────────┬────────────┬────────────┬───────────┬──────────┘    ║
║         │            │            │            │           │                ║
║         ▼            ▼            ▼            ▼           ▼                ║
║  ┌────────────┐ ┌─────────┐ ┌─────────┐ ┌──────────┐ ┌──────────┐         ║
║  │ PostgreSQL │ │ Google  │ │ Groq AI │ │ElevenLabs│ │ ImageKit │         ║
║  │            │ │ YouTube │ │ LLaMA 3 │ │ Voice    │ │   CDN    │         ║
║  │ creators   │ │ Data v3 │ │         │ │ Clone    │ │  Media   │         ║
║  │ tokens     │ │Analytics│ │ Fast AI │ │ TTS      │ │ Storage  │         ║
║  │ sessions   │ │ API v3  │ │Inference│ │          │ │          │         ║
║  └────────────┘ └─────────┘ └─────────┘ └──────────┘ └──────────┘         ║
║                                                                              ║
║         ┌─────────────────┐         ┌──────────────────────┐                ║
║         │  Google Trends  │         │    FFmpeg + yt-dlp   │                ║
║         │  API (India)    │         │    Video Processing   │                ║
║         │  Live Trends    │         │    9:16 Auto-Crop     │                ║
║         └─────────────────┘         └──────────────────────┘                ║
╚══════════════════════════════════════════════════════════════════════════════╝
```

---

## Data Flow Diagrams

### 1. User Authentication Flow
```
User clicks "Connect YouTube"
        │
        ▼
Frontend → GET /auth/youtube/start
        │
        ▼
Backend generates Google OAuth URL
        │
        ▼
User redirected to Google Login
        │
        ▼
Google returns auth code → Backend
        │
        ▼
Backend exchanges code for access_token + refresh_token
        │
        ▼
Tokens saved to PostgreSQL (creators table)
        │
        ▼
User redirected to /dashboard?creator_id=xxx
```

### 2. AI Comment Analysis Flow
```
User enters Video ID
        │
        ▼
POST /cognitive/comments/analyze
        │
        ▼
Backend fetches comments from YouTube Data API
(up to 100 comments per request)
        │
        ▼
Comments batched and sent to Groq LLaMA 3
Prompt: Analyze sentiment + priority + write reply
        │
        ▼
AI returns: sentiment (pos/neg/angry/question/neutral)
            priority (high/medium/low)
            draft_reply (human-like, contextual)
        │
        ▼
Response returned to frontend
User edits replies → clicks "Post" → POST /cognitive/comments/reply
        │
        ▼
Backend calls YouTube Data API (comments.insert)
Reply posted live on YouTube
```

### 3. Shorts Auto-Cutter Flow
```
User pastes YouTube URL
        │
        ▼
POST /cognitive/shorts/generate
        │
        ▼
Backend calls Groq AI: "Find 3 most viral moments"
AI returns: [{ start: 45, end: 103, reason: "..." }, ...]
        │
        ▼
yt-dlp downloads full video to /uploads/shorts_tmp/
        │
        ▼
FFmpeg cuts each segment
FFmpeg crops to 1080x1920 (9:16)
        │
        ▼
Clips uploaded to ImageKit CDN
        │
        ▼
Frontend receives download URLs for each Short
```

### 4. Voice Clone + TTS Flow
```
User uploads 30-second voice sample
        │
        ▼
POST /voice/clone (multipart/form-data)
        │
        ▼
Multer saves file temporarily
ElevenLabs API: create instant voice clone
        │
        ▼
Returns voice_id
        │
        ▼
User writes script → POST /voice/tts { voice_id, text }
        │
        ▼
ElevenLabs generates audio with cloned voice
Audio uploaded to ImageKit
        │
        ▼
Frontend receives playable audio URL
```

---

## Module Dependency Map

```
index.js (Express App)
├── auth.routes.js
│   └── youtube.js (OAuth 2.0 + DB)
├── dashboard.routes.js
│   └── db/index.js (PostgreSQL)
├── cognitive.routes.js
│   ├── commentResponder.js (Groq + YouTube)
│   ├── commentIdeas.js (Groq)
│   ├── hookGenerator.js (Groq)
│   ├── repurposer.js (Groq + YouTube)
│   ├── postGenerator.js (Groq + YouTube)
│   ├── metadataOptimizer.js (Groq)
│   ├── shortsGenerator.js (Groq + yt-dlp + FFmpeg + ImageKit)
│   ├── videoDiagnostics.js (Groq + YouTube)
│   └── videoStudio.js (Groq + Pollinations AI)
├── voice.routes.js
│   ├── speechToText.js (Groq Whisper)
│   ├── voiceClone.js (ElevenLabs)
│   ├── videoResizer.js (FFmpeg + ImageKit)
│   ├── multerConfig.js
│   └── imagekitUploader.js
├── analytics.routes.js
│   ├── retentionPredictor.js (YouTube Analytics + Groq)
│   ├── revenueEstimator.js (Groq)
│   └── fakeFollowerScanner.js (YouTube + Groq)
└── growth.routes.js
    ├── trendJacking.js (Google Trends + Groq)
    ├── hashtagROI.js (YouTube + Google Trends + Groq)
    └── collaboratorFinder.js (YouTube Search + Groq)
```

---

## Deployment Architecture (Production Recommendation)

```
                    ┌──────────────────┐
                    │   Vercel / Netlify│
                    │   (Frontend CDN)  │
                    └────────┬─────────┘
                             │ HTTPS
                    ┌────────▼─────────┐
                    │  Railway / Render │
                    │  (Backend API)    │
                    │  Node.js + Express│
                    └────────┬─────────┘
                             │
              ┌──────────────┼──────────────┐
              │              │              │
    ┌─────────▼───┐  ┌───────▼────┐  ┌─────▼──────┐
    │  Supabase   │  │  ImageKit  │  │ External   │
    │ PostgreSQL  │  │    CDN     │  │ APIs       │
    │  (managed)  │  │  (Media)   │  │ Groq/YT/   │
    └─────────────┘  └────────────┘  │ ElevenLabs │
                                     └────────────┘
```

---

*CrewFlow Architecture v1.0 | June 2026*
