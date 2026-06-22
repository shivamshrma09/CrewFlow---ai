# CrewFlow — Submission Package
## Hackathon / Project Submission

---

## Project: CrewFlow — AI-Powered Content Manager for Indian YouTube Creators

**GitHub Repository:** https://github.com/shivamshrma09/CrewFlow---ai  
**Team / Builder:** Shivam Kumar  
**Submission Date:** June 2026

---

## What is CrewFlow?

CrewFlow is an AI-powered content management platform that automates 90% of a YouTube creator's daily workflow. It handles comment replies, content repurposing, Shorts creation, trend detection, revenue estimation, fake follower scanning, and more — all in one dashboard.

**Core Problem Solved:**  
Indian creators waste 7–8 hours daily on repetitive tasks. CrewFlow reduces this to under 20 minutes.

---

## Submission Contents

```
submission/
├── README.md                          ← This file (start here)
│
└── docs/
    ├── 01_Technical_Documentation.md  ← Full tech stack, architecture, modules, API
    ├── 02_Architecture_Diagram.md     ← System + data flow + module dependency diagrams
    ├── 03_Presentation_Deck.md        ← 15-slide deck (problem → solution → features → impact)
    ├── 04_Demo_Video_Script.md        ← Step-by-step demo walkthrough script
    └── 05_Setup_Guide.md              ← Installation + environment setup guide
```

**Source Code:** Full source code is in the GitHub repo above (frontend/ + backend/)

---

## Key Features Built

### 🧠 Cognitive AI
- AI Comment Responder — sentiment analysis + draft replies + post to YouTube
- Hook + Title Generator — 5 hooks, 5 titles, 5 thumbnail texts per topic
- Content Repurposer — 1 video → 10 content assets
- Audience Psychological Planner — comment psych map + content blueprints
- AI Video Diagnostics — SEO score + title alternatives + hook script

### 🎬 Video Studio
- Full Video Package Generator — script + SEO + AI thumbnail
- AI Shorts Auto-Cutter — YouTube URL → auto-cropped 9:16 Shorts
- Community Post Creator — write + publish + analytics

### 📊 Analytics
- Audience Retention Predictor — drop timestamps + Script Doctor
- Revenue Estimator ₹ — AdSense + brand deals in Indian rupees
- Fake Follower Scanner — authenticity score 0–100

### 🚀 Growth Intelligence
- Live Trend Jacking Engine — Google Trends India + ready scripts
- Hashtag ROI Calculator — ROI score per hashtag
- Collaborator Finder — collab score + audience overlap

### 🎙️ Voice & Audio
- Speech to Text — Groq Whisper, 12 Indian languages
- Voice Cloning — ElevenLabs, 30s sample → cloned TTS
- Video Resizer — 1 video → 6 platform formats (FFmpeg)
- Regional Translator — scripts in 12 Indian languages

---

## Tech Stack Summary

| Layer | Technologies |
|-------|-------------|
| Frontend | React 19, Vite 8, Tailwind CSS 4, React Router 7 |
| Backend | Node.js, Express 4, PostgreSQL |
| AI | Groq LLaMA 3, Groq Whisper, ElevenLabs |
| APIs | YouTube Data v3, YouTube Analytics, Google Trends |
| Media | ImageKit CDN, FFmpeg, yt-dlp |
| Auth | Google OAuth 2.0 |

---

## Demo Video

> **Record a screen walkthrough using OBS or Loom.**  
> See `docs/04_Demo_Video_Script.md` for the full step-by-step script.  
> Upload to YouTube (unlisted) or Google Drive and paste the link here:

**Demo Video Link:** `[PASTE YOUR DEMO VIDEO LINK HERE]`

---

## How to Run

1. Clone: `git clone https://github.com/shivamshrma09/CrewFlow---ai.git`
2. Set up `.env` in `/backend` (see `docs/05_Setup_Guide.md`)
3. `cd backend && npm install && npm run dev`
4. `cd frontend && npm install && npm run dev`
5. Open `http://localhost:5173` → Click "Connect YouTube"

Full setup guide: `docs/05_Setup_Guide.md`

---

*CrewFlow v1.0 — Submission Package | June 2026*
