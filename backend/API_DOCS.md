# CrewFlow API Documentation

**Base URL:** `http://localhost:8000`

---

## Auth Routes

### 1. Connect YouTube
```
GET /auth/youtube/start
```
Browser mein open karo → Google login page pe redirect karega → Allow karo → Dashboard pe wapas aayega with `creator_id`

---

### 2. Get Creator Info
```
GET /auth/me?creator_id=xxx
```
**Query Params:**
| Param | Required | Description |
|-------|----------|-------------|
| creator_id | ✅ | Google user ID (URL se milta hai after login) |

**Response:**
```json
{
  "id": "114905729292672190699",
  "name": "Shivam Kumar",
  "email": "shivam@gmail.com",
  "picture": "https://..."
}
```

---

## Dashboard Routes

### 3. Get Full Dashboard Data
```
GET /dashboard?creator_id=xxx
```
**Query Params:**
| Param | Required | Description |
|-------|----------|-------------|
| creator_id | ✅ | Google user ID |

**Response:**
```json
{
  "channel": {
    "id": "UCxxx",
    "title": "Channel Name",
    "description": "...",
    "custom_url": "@handle",
    "profile_picture": "https://...",
    "banner": "https://...",
    "mobile_banner": "https://...",
    "keywords": "...",
    "country": "IN",
    "default_language": "hi",
    "created_at": "2020-01-01T00:00:00Z",
    "topic_categories": ["https://en.wikipedia.org/wiki/Technology"],
    "privacy_status": "public",
    "is_linked": true,
    "long_uploads_status": "allowed",
    "made_for_kids": false,
    "uploads_playlist_id": "UUxxx",
    "likes_playlist_id": "LLxxx"
  },
  "stats": {
    "subscribers": 10000,
    "total_views": 500000,
    "total_videos": 150,
    "hidden_subscribers": false
  },
  "recent_videos": [...],
  "top_viewed_videos": [...],
  "top_rated_videos": [...],
  "playlists": [...],
  "subscriptions": [...],
  "meta": {
    "fetched_at": "2025-01-01T00:00:00Z",
    "recent_videos_count": 20,
    "playlists_count": 5,
    "subscriptions_count": 20
  }
}
```

---

### 4. Get ALL Videos (with full stats + thumbnails)
```
GET /dashboard/videos/all?creator_id=xxx
```
> ⚠️ Quota heavy - use carefully. 1000 videos = ~21 API calls.

**Query Params:**
| Param | Required | Description |
|-------|----------|-------------|
| creator_id | ✅ | Google user ID |

**Response:**
```json
{
  "total": 150,
  "total_on_channel": 150,
  "fetched_at": "2025-01-01T00:00:00Z",
  "videos": [
    {
      "video_id": "abc123",
      "url": "https://www.youtube.com/watch?v=abc123",
      "title": "Video Title",
      "description": "...",
      "thumbnails": {
        "default": "https://... (120x90)",
        "medium": "https://... (320x180)",
        "high": "https://... (480x360)",
        "standard": "https://... (640x480)",
        "maxres": "https://... (1280x720)"
      },
      "thumbnail": "https://... (best available)",
      "tags": ["tag1", "tag2"],
      "category_id": "28",
      "default_language": "hi",
      "published_at": "2024-01-01T00:00:00Z",
      "duration": "PT10M30S",
      "dimension": "2d",
      "definition": "hd",
      "caption": "false",
      "licensed_content": false,
      "privacy_status": "public",
      "upload_status": "processed",
      "embeddable": true,
      "made_for_kids": false,
      "view_count": 50000,
      "like_count": 2000,
      "comment_count": 300,
      "favorite_count": 0
    }
  ]
}
```

---

## Cognitive Module Routes

### 5. Fetch Comments Only (No AI)
```
GET /cognitive/comments/video?creator_id=xxx&video_id=xxx&max_comments=50
```
**Query Params:**
| Param | Required | Default | Description |
|-------|----------|---------|-------------|
| creator_id | ✅ | - | Google user ID |
| video_id | ✅ | - | YouTube video ID |
| max_comments | ❌ | 50 | Max comments to fetch (max 100) |

**Response:**
```json
{
  "total": 50,
  "comments": [
    {
      "comment_id": "UgxXXX",
      "text": "Bhai bahut achha video tha!",
      "author": "Rahul Sharma",
      "author_profile_image": "https://...",
      "author_channel_url": "https://youtube.com/...",
      "like_count": 5,
      "reply_count": 2,
      "published_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-01T00:00:00Z",
      "can_reply": true
    }
  ]
}
```

---

### 6. Analyze Comments (AI Sentiment + Draft Replies)
```
POST /cognitive/comments/analyze
```
**Request Body:**
```json
{
  "creator_id": "114905729292672190699",
  "video_id": "abc123",
  "max_comments": 50
}
```
| Field | Required | Default | Description |
|-------|----------|---------|-------------|
| creator_id | ✅ | - | Google user ID |
| video_id | ✅ | - | YouTube video ID |
| max_comments | ❌ | 50 | Max comments to analyze |

**Response:**
```json
{
  "total": 50,
  "comments": [
    {
      "comment_id": "UgxXXX",
      "text": "Bhai bahut achha video tha!",
      "author": "Rahul Sharma",
      "author_profile_image": "https://...",
      "author_channel_url": "https://youtube.com/...",
      "like_count": 5,
      "reply_count": 2,
      "published_at": "2024-01-01T00:00:00Z",
      "can_reply": true,
      "sentiment": "positive",
      "priority": "low",
      "draft_reply": "Thank you Rahul bhai! Glad you liked it 🙏"
    }
  ]
}
```
> `sentiment`: `positive` | `negative` | `question` | `angry` | `neutral`
> `priority`: `high` | `medium` | `low`

---

### 7. Get Comments Filtered by Priority
```
GET /cognitive/comments/priority?creator_id=xxx&video_id=xxx&level=high&max_comments=50
```
**Query Params:**
| Param | Required | Default | Description |
|-------|----------|---------|-------------|
| creator_id | ✅ | - | Google user ID |
| video_id | ✅ | - | YouTube video ID |
| level | ❌ | high | `high` \| `medium` \| `low` \| `all` |
| max_comments | ❌ | 50 | Max comments to fetch |

**Response:**
```json
{
  "total": 10,
  "priority": "high",
  "comments": [...]
}
```

---

### 8. Post Reply to a Comment
```
POST /cognitive/comments/reply
```
**Request Body:**
```json
{
  "creator_id": "114905729292672190699",
  "comment_id": "UgxXXX",
  "reply_text": "Thank you so much! 🙏"
}
```
| Field | Required | Description |
|-------|----------|-------------|
| creator_id | ✅ | Google user ID |
| comment_id | ✅ | Comment ID from analyze response |
| reply_text | ✅ | Reply text to post on YouTube |

**Response:**
```json
{
  "status": "posted",
  "reply_id": "UgxYYY"
}
```

---

### 9. Generate Hooks + Titles + Thumbnail Texts
```
POST /cognitive/hooks/generate
```
**Request Body:**
```json
{
  "topic": "How to earn money online in India",
  "niche": "finance",
  "target_audience": "college students",
  "platform": "youtube",
  "language": "hinglish"
}
```
| Field | Required | Default | Options |
|-------|----------|---------|---------|
| topic | ✅ | - | Any string |
| niche | ✅ | - | Any string |
| target_audience | ✅ | - | Any string |
| platform | ❌ | youtube | `youtube` \| `instagram` \| `linkedin` \| `twitter` |
| language | ❌ | hinglish | `hindi` \| `english` \| `hinglish` |

**Response:**
```json
{
  "hooks": [
    "Kya tum jaante ho ki ek simple trick se tum ₹50,000/month kama sakte ho?",
    "Maine sirf 3 mahine mein ₹1 lakh kamaye - aur tum bhi kar sakte ho!",
    "...3 more hooks..."
  ],
  "titles": [
    "2025 Mein Online Paise Kaise Kamayein | 5 Proven Methods",
    "College Student Ka Side Income Guide | ₹50k/Month Possible?",
    "...3 more titles..."
  ],
  "thumbnail_texts": [
    "₹50K MONTH SE",
    "SECRET REVEALED",
    "...3 more..."
  ]
}
```

---

### 10. Repurpose Content (1 Script → 10 Assets)
```
POST /cognitive/repurpose
```
**Option A - Script text se:**
```json
{
  "script": "Aaj main tumhe bataunga ki kaise tum ghar baithe paise kama sakte ho...",
  "language": "hinglish"
}
```

**Option B - YouTube Video ID se:**
```json
{
  "creator_id": "114905729292672190699",
  "video_id": "abc123",
  "language": "hinglish"
}
```

| Field | Required | Default | Description |
|-------|----------|---------|-------------|
| script | ✅ (if no video_id) | - | Video script text |
| creator_id | ✅ (if video_id used) | - | Google user ID |
| video_id | ✅ (if no script) | - | YouTube video ID |
| language | ❌ | hinglish | `hindi` \| `english` \| `hinglish` |

**Response:**
```json
{
  "shorts_scripts": [
    { "title": "Short 1 Title", "script": "60 second script..." },
    { "title": "Short 2 Title", "script": "..." },
    { "title": "Short 3 Title", "script": "..." }
  ],
  "tweet_thread": [
    "Tweet 1 - Hook line that grabs attention",
    "Tweet 2 - Main point",
    "Tweet 3 - Supporting point",
    "Tweet 4 - Key insight",
    "Tweet 5 - CTA: Follow for more!"
  ],
  "linkedin_post": "Full LinkedIn post with hook, value points and CTA...",
  "blog_outline": {
    "title": "Blog Post Title",
    "sections": [
      "Section 1: Introduction",
      "Section 2: Main Topic",
      "Section 3: Tips & Tricks",
      "Conclusion: Summary & CTA"
    ]
  },
  "instagram_captions": [
    "Caption 1 with #hashtags #india #creator",
    "Caption 2 with #hashtags",
    "Caption 3 with #hashtags"
  ],
  "seo_package": {
    "description": "Full YouTube description (150 words)...",
    "tags": ["tag1", "tag2", "tag3", "tag4", "tag5", "tag6", "tag7", "tag8", "tag9", "tag10"]
  }
}
```

---

## Voice & Audio Module Routes

### 11. Speech to Text (Groq Whisper)
```
POST /voice/transcribe
```
> Content-Type: `multipart/form-data`

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| audio | file | ✅ | - | Audio file (mp3, wav, m4a, webm, ogg) Max 25MB |
| language | text | ❌ | hi | Language code: `hi`=Hindi, `en`=English, `mr`=Marathi, `ta`=Tamil, `te`=Telugu, `bn`=Bengali |

**Response:**
```json
{
  "text": "Aaj main tumhe bataunga paise kamane ka sabse aasan tarika...",
  "language": "hi",
  "duration": 45.2,
  "segments": [
    { "start": 0.0, "end": 3.5, "text": "Aaj main tumhe bataunga" },
    { "start": 3.5, "end": 7.2, "text": "paise kamane ka sabse aasan tarika" }
  ]
}
```

---

### 12. Clone Voice (ElevenLabs)
```
POST /voice/clone
```
> Content-Type: `multipart/form-data`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| sample | file | ✅ | Voice sample audio (min 30 sec recommended) Max 25MB |
| voice_name | text | ✅ | Name to save cloned voice as (e.g. "Shivam Hindi") |

**Response:**
```json
{
  "voice_id": "abc123xyz",
  "name": "Shivam Hindi",
  "message": "Voice cloned successfully. Use voice_id for TTS."
}
```

---

### 13. Text to Speech (Cloned Voice)
```
POST /voice/tts
```
> Content-Type: `application/json`

```json
{
  "voice_id": "abc123xyz",
  "text": "Namaste doston! Aaj hum seekhenge..."
}
```

| Field | Required | Description |
|-------|----------|-------------|
| voice_id | ✅ | ElevenLabs voice ID (from /voice/clone or /voice/voices) |
| text | ✅ | Text to convert to speech (max 5000 chars on free tier) |

**Response:**
```json
{
  "audio_url": "https://ik.imagekit.io/crewflow/audio/tts-xxx.mp3",
  "fileId": "xxx",
  "text_length": 120
}
```

---

### 14. List All Voices
```
GET /voice/voices
```

**Response:**
```json
{
  "total": 25,
  "voices": [
    {
      "voice_id": "abc123",
      "name": "Shivam Hindi",
      "category": "cloned",
      "labels": { "language": "Hindi", "accent": "Indian" },
      "preview_url": "https://..."
    },
    {
      "voice_id": "xyz789",
      "name": "Aria",
      "category": "premade",
      "labels": { "gender": "female", "accent": "American" },
      "preview_url": "https://..."
    }
  ]
}
```

---

### 15. Delete Cloned Voice
```
DELETE /voice/clone/:voice_id
```

| Param | Required | Description |
|-------|----------|-------------|
| voice_id | ✅ | ElevenLabs voice ID to delete |

**Response:**
```json
{
  "status": "deleted",
  "voice_id": "abc123xyz"
}
```

---

### 16. List Platform Specs
```
GET /voice/platforms
```

**Response:**
```json
{
  "platforms": {
    "youtube":         { "width": 1920, "height": 1080, "label": "YouTube (16:9)" },
    "youtube_shorts":  { "width": 1080, "height": 1920, "label": "YouTube Shorts (9:16)" },
    "instagram_reels": { "width": 1080, "height": 1920, "label": "Instagram Reels (9:16)" },
    "instagram_feed":  { "width": 1080, "height": 1080, "label": "Instagram Feed (1:1)" },
    "linkedin":        { "width": 1280, "height": 720,  "label": "LinkedIn (16:9)" },
    "twitter":         { "width": 1280, "height": 720,  "label": "Twitter/X (16:9)" }
  }
}
```

---

### 17. Resize Video for Platforms
```
POST /voice/resize
```
> Content-Type: `multipart/form-data`

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| video | file | ✅ | - | Video file (mp4, webm, mov, avi) Max 500MB |
| platforms | text | ❌ | all | Comma-separated platforms: `youtube,instagram_reels,youtube_shorts` |

**Response:**
```json
{
  "original": {
    "url": "https://ik.imagekit.io/crewflow/videos/original.mp4",
    "fileId": "xxx",
    "size": 10485760
  },
  "platforms": [
    {
      "platform": "youtube",
      "label": "YouTube (16:9)",
      "width": 1920,
      "height": 1080,
      "url": "https://ik.imagekit.io/crewflow/videos/original.mp4?tr=w-1920,h-1080"
    },
    {
      "platform": "instagram_reels",
      "label": "Instagram Reels (9:16)",
      "width": 1080,
      "height": 1920,
      "url": "https://ik.imagekit.io/crewflow/videos/original.mp4?tr=w-1080,h-1920"
    }
  ]
}
```

---

### 18. Voice to Content (Audio → Transcript + Hooks + 10 Assets)
```
POST /voice/voice-to-content
```
> Content-Type: `multipart/form-data`

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| audio | file | ✅ | - | Audio/voice note file Max 25MB |
| language | text | ❌ | hi | Audio language code (hi, en, mr etc.) |
| niche | text | ❌ | general | Creator niche (finance, tech, comedy etc.) |
| platform | text | ❌ | youtube | Target platform |
| content_language | text | ❌ | hinglish | Output content language |

**Response:**
```json
{
  "transcript": {
    "text": "Aaj main tumhe bataunga...",
    "language": "hi",
    "duration": 45.2,
    "segments": [...]
  },
  "hooks_and_titles": {
    "hooks": ["Hook 1", "Hook 2", "Hook 3", "Hook 4", "Hook 5"],
    "titles": ["Title 1", "Title 2", "Title 3", "Title 4", "Title 5"],
    "thumbnail_texts": ["Text 1", "Text 2", "Text 3", "Text 4", "Text 5"]
  },
  "repurposed_content": {
    "shorts_scripts": [...],
    "tweet_thread": [...],
    "linkedin_post": "...",
    "blog_outline": {...},
    "instagram_captions": [...],
    "seo_package": {...}
  }
}
```

---

### 19. Regional Script Translation
```
POST /voice/translate
```
> Content-Type: `application/json`

```json
{
  "text": "Aaj main tumhe bataunga paise kamane ka sabse aasan tarika",
  "target_language": "marathi",
  "source_language": "hindi"
}
```

| Field | Required | Default | Description |
|-------|----------|---------|-------------|
| text | ✅ | - | Script/text to translate |
| target_language | ✅ | - | Target language (see options below) |
| source_language | ❌ | hindi | Source language |

**Supported target_language values:**
| Value | Language |
|-------|----------|
| `marathi` | Marathi (मराठी) |
| `bhojpuri` | Bhojpuri (भोजपुरी) |
| `tamil` | Tamil (தமிழ்) |
| `telugu` | Telugu (తెలుగు) |
| `kannada` | Kannada (ಕನ್ನಡ) |
| `bengali` | Bengali (বাংলা) |
| `gujarati` | Gujarati (ગુજરાતી) |
| `punjabi` | Punjabi (ਪੰਜਾਬੀ) |
| `malayalam` | Malayalam (മലയാളം) |
| `hindi` | Hindi (हिंदी) |
| `english` | English |
| `hinglish` | Hinglish (Roman script) |

**Response:**
```json
{
  "source_language": "hindi",
  "target_language": "marathi",
  "target_language_label": "Marathi (मराठी)",
  "original_text": "Aaj main tumhe bataunga paise kamane ka sabse aasan tarika",
  "translated_text": "आज मी तुम्हाला पैसे कमावण्याचा सर्वात सोपा मार्ग सांगणार आहे",
  "romanized": "Aaj mi tumhala paise kawaṇyacha sarwat sopa marg sangnar aahe",
  "notes": "Kept conversational tone suitable for YouTube audience"
}
```

---

## Health Check

### 20. Server Health
```
GET /health
```
**Response:**
```json
{
  "status": "ok",
  "module": "cognitive"
}
```

---

## Error Response Format
Sabhi routes same error format return karte hain:
```json
{
  "error": "Error message here"
}
```
| Status Code | Meaning |
|-------------|---------|
| 400 | Bad Request - missing required fields |
| 404 | Not Found - creator/video not found |
| 500 | Server Error - API ya LLM issue |

---

## Quick Test Order
```
# Auth
1.  GET  /auth/youtube/start                    → YouTube connect karo
2.  GET  /auth/me?creator_id=xxx                → apna data dekho

# Dashboard
3.  GET  /dashboard?creator_id=xxx              → channel overview
4.  GET  /dashboard/videos/all?creator_id=xxx   → saare videos

# Cognitive Module
5.  POST /cognitive/hooks/generate              → hooks + titles banao
6.  POST /cognitive/repurpose                   → content repurpose karo
7.  GET  /cognitive/comments/video              → comments fetch karo
8.  POST /cognitive/comments/analyze            → AI analysis + draft replies
9.  GET  /cognitive/comments/priority           → high priority comments
10. POST /cognitive/comments/reply              → reply post karo

# Voice Module
11. POST /voice/transcribe                      → audio → text
12. POST /voice/clone                           → voice clone karo
13. GET  /voice/voices                          → saari voices dekho
14. POST /voice/tts                             → cloned voice se speech banao
15. GET  /voice/platforms                       → platform specs dekho
16. POST /voice/resize                          → video resize karo
17. POST /voice/voice-to-content                → audio → transcript + hooks + 10 assets
18. POST /voice/translate                       → script translate karo
```
