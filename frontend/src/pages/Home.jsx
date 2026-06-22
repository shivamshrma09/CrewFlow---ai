import { useNavigate } from 'react-router-dom'
import { useState } from 'react'
import {
  Zap, BarChart2, Mic, TrendingUp, ArrowRight,
  MessageSquare, RefreshCw, Hash, Users, Shield, Languages,
  MonitorPlay, Brain, DollarSign, ScanLine, Flame,
  Scissors, Clapperboard, Film, Sparkles, ChevronDown, ChevronUp
} from 'lucide-react'

// ── Tab definitions ──────────────────────────────────────────────────────────
const featureTabs = [
  { id: 'cognitive', label: 'Cognitive AI',    icon: Brain },
  { id: 'studio',   label: 'Video Studio',     icon: Clapperboard },
  { id: 'analytics',label: 'Analytics',        icon: BarChart2 },
  { id: 'growth',   label: 'Growth Tools',     icon: TrendingUp },
]

const tabModules = {
  cognitive: {
    heading: 'Cognitive AI — Comments, Hooks & Repurpose',
    icon: Brain,
    features: [
      {
        icon: MessageSquare,
        title: 'AI Comment Responder',
        desc: 'Paste your YouTube Video ID — AI fetches all comments, analyzes sentiment (positive / negative / angry / question), assigns priority (high / medium / low), and generates a human-like draft reply for each one. Edit, approve, and post directly to YouTube from the dashboard. "Post All" button replies to every pending comment in one click.',
        tags: ['Sentiment Analysis', 'Draft Replies', 'Post All at Once'],
      },
      {
        icon: Zap,
        title: 'Hook + Title Generator',
        desc: 'Enter topic, niche, and target audience. AI reverse-engineers viral patterns and generates 5 scroll-stopping hooks (first 3 seconds), 5 SEO-optimized titles with power words, and 5 high-contrast thumbnail text concepts. Works for YouTube, Instagram Reels, LinkedIn, and Twitter/X.',
        tags: ['5 Viral Hooks', '5 SEO Titles', '5 Thumbnail Texts'],
      },
      {
        icon: RefreshCw,
        title: 'Content Repurposer — 10 Assets',
        desc: 'Paste a script or give a YouTube Video ID. AI turns it into 10 ready-to-publish assets: 3 Shorts/Reels scripts, a 5-tweet thread, a LinkedIn post, a blog outline, 3 Instagram captions with hashtags, and a full SEO package with 150-word description + 10 tags.',
        tags: ['3 Shorts Scripts', 'Tweet Thread', 'SEO Package'],
      },
      {
        icon: Brain,
        title: 'Audience Psychological Content Planner',
        desc: 'AI scans your latest video comments and maps audience psychology across 4 dimensions: Curiosity, Appreciation, Frustration, and Confusion. Then generates video content blueprints backed by psychological triggers — each with a title, concept, and the exact emotional trigger to exploit for maximum CTR.',
        tags: ['Sentiment Distribution', 'Psych Triggers', 'Content Blueprints'],
      },
      {
        icon: Sparkles,
        title: 'AI Video Diagnostics & Optimizer',
        desc: 'Click "AI Diagnose" on any video. AI audits the title, description, and tags for SEO health, gives a score out of 100, writes a verdict, suggests 5 optimized title alternatives (copy in one click), recommends relevant tags, and writes a high-retention intro script hook to improve watch-time.',
        tags: ['SEO Score /100', 'Title Alternatives', 'Hook Script'],
      },
    ],
  },
  studio: {
    heading: 'Video Studio — AI Creates Your Entire Video',
    icon: Clapperboard,
    features: [
      {
        icon: Clapperboard,
        title: 'Full Video Package Generator',
        desc: 'Give a topic, niche, style, and duration. AI generates your complete video production package: viral title + 3 alternatives, full YouTube description, 15 SEO tags, 5 hashtags, thumbnail text overlay, AI thumbnail image (Pollinations), section-by-section script with hook/intro/outro, 3 Shorts scripts, production tips, and best upload time.',
        tags: ['Full Script', 'AI Thumbnail', 'SEO + Tags'],
      },
      {
        icon: Scissors,
        title: 'AI Shorts Auto-Cutter',
        desc: 'Paste any public YouTube video URL. AI analyzes the full video, picks the most viral 30–58 second moments, downloads the video, cuts each segment with ffmpeg, auto-crops to 9:16 (1080×1920 Shorts format), and uploads the final clips to cloud. You get direct download links for each Short — ready to post.',
        tags: ['Auto 9:16 Crop', 'AI Moment Picker', 'Ready to Download'],
      },
      {
        icon: Film,
        title: 'Community Post Creator',
        desc: 'Create YouTube Community posts directly from CrewFlow. Choose post type (Text, Image, Poll), enter your topic and tone, and AI writes the post text. Generate an AI image for image posts, add poll options, preview exactly how it will look on YouTube, and publish. Analytics tab shows views, likes, comments, and engagement % for all past posts.',
        tags: ['Text / Image / Poll', 'AI Post Writer', 'Post Analytics'],
      },
    ],
  },
  analytics: {
    heading: 'Analytics — Real Data, Real Insights',
    icon: BarChart2,
    features: [
      {
        icon: BarChart2,
        title: 'Audience Retention Predictor',
        desc: 'Enter a Video ID — AI fetches real YouTube Analytics data (avg view duration, view %, watch minutes) and predicts exact timestamps where your audience will drop off. Each drop point gets a severity rating (high/medium/low), a reason, a retention score out of 100, and a "Script Doctor" button that rewrites that segment for better retention.',
        tags: ['Real YT Analytics', 'Drop Timestamps', 'Script Doctor AI'],
      },
      {
        icon: DollarSign,
        title: 'Revenue Estimator ₹',
        desc: 'Get a full Indian market revenue breakdown — monthly AdSense (min/max/realistic), brand deal value per video, sponsored post rate, and total earning potential — all in ₹. Also shows your CPM/RPM estimates, growth tier (nano to mega), monetization eligibility, and top revenue stream recommendations.',
        tags: ['₹ Indian Rates', 'Brand Deal Value', 'Growth Tier'],
      },
      {
        icon: ScanLine,
        title: 'Fake Follower Scanner',
        desc: 'Scan any public YouTube channel (or your own). AI analyzes view-to-subscriber ratio, like-to-view ratio, comment quality from 30 sample comments, and calculates an authenticity score out of 100. Get fake follower % estimate, red flags, green flags, and a brand deal worthiness verdict — perfect for checking collaboration partners.',
        tags: ['Authenticity Score', 'Fake % Estimate', 'Brand Worthiness'],
      },
      {
        icon: Brain,
        title: 'Studio AI Chat',
        desc: 'Chat with your YouTube channel data in real time. Ask anything — "Why did my last video underperform?", "What content should I make next?", "Show me my traffic sources". Studio AI fetches your real analytics, subscriber growth, device breakdown, and top videos, then answers with data-backed strategy recommendations.',
        tags: ['Real-time Analytics', 'Channel Strategy', 'Chat History'],
      },
    ],
  },
  growth: {
    heading: 'Growth Intelligence — Trends, Hashtags & Collabs',
    icon: TrendingUp,
    features: [
      {
        icon: Flame,
        title: 'Live Trend Jacking Engine',
        desc: 'Fetches real-time Google Trends data for India — daily viral searches, related topics, and trending queries. Enter your niche and AI generates 3 ready-to-shoot scripts that jack current trends: each with hook, full script, CTA, and hashtags. Also tells you trend urgency and the best time to post for maximum reach.',
        tags: ['Live Google Trends', '3 Ready Scripts', 'Best Post Time'],
      },
      {
        icon: Hash,
        title: 'Hashtag ROI Calculator',
        desc: 'Enter up to 15 hashtags. For each one, AI searches YouTube competition level, checks Google Trends interest over 90 days, calculates average views of top videos, and gives an ROI score (0–100). Get a recommended set to use, ones to avoid, best posting time, and overall hashtag strategy — per niche.',
        tags: ['ROI Score 0–100', 'Competition Level', 'Recommended Set'],
      },
      {
        icon: Users,
        title: 'Collaborator Finder',
        desc: 'Enter your niche and AI searches YouTube for similar creators, fetches their full stats (subscribers, views, keywords), and scores each one for collaboration potential (0–100). Get audience overlap estimate, best collab format (podcast, challenge, collab video), combined reach potential, and a top pick recommendation.',
        tags: ['Collab Score', 'Audience Overlap', 'Top Pick AI'],
      },
      {
        icon: Mic,
        title: 'Voice & Audio Suite',
        desc: 'Four tools in one: (1) Speech-to-Text — upload audio in any Indian language, Groq Whisper gives word-level timestamps. (2) Voice Cloning — upload 30s sample, ElevenLabs clones your voice for Hindi/English TTS. (3) Video Resizer — one video → 6 platform formats instantly. (4) Regional Translator — script to 12 Indian languages with natural tone.',
        tags: ['Groq Whisper', 'Voice Clone', '12 Languages'],
      },
    ],
  },
}

const stats = [
  { value: '88%', label: 'Creators earn under $100/mo', sub: 'without automation' },
  { value: '8hrs', label: 'Lost daily to manual work',  sub: 'per creator average' },
  { value: '90%', label: 'Time saved with CrewFlow',    sub: 'proven by A/B tests' },
  { value: '10x', label: 'Faster content publishing',   sub: 'from 8hrs to 45 mins' },
]

// ── Feature sections (replaces the duplicate video grid) ────────────────────
const featureSections = [
  {
    badge: 'COGNITIVE AI',
    heading: 'Reply to every comment\nwithout lifting a finger',
    sub: 'AI analyzes sentiment, generates draft replies, and lets you post to all comments in one click — directly from your dashboard.',
    features: [
      { icon: MessageSquare, title: 'Sentiment-aware draft replies', desc: 'Positive, negative, angry, question — AI handles all types.' },
      { icon: Zap,           title: '5 viral hooks per topic',       desc: 'Hook, title, and thumbnail text generated together.' },
      { icon: RefreshCw,     title: '10 assets from 1 video',        desc: 'Shorts, tweets, LinkedIn, Instagram, SEO — all at once.' },
    ],
  },
  {
    badge: 'VIDEO STUDIO',
    heading: 'Give a topic.\nGet a full video package.',
    sub: 'Title, script, thumbnail, SEO tags, Shorts ideas — AI builds your entire video production package in under 20 seconds.',
    features: [
      { icon: Clapperboard, title: 'Full script with hook + outro', desc: 'Section-by-section script tailored to your style and duration.' },
      { icon: Scissors,     title: 'Auto-cut YouTube Shorts',       desc: 'AI picks viral moments, cuts and crops to 9:16 automatically.' },
      { icon: Sparkles,     title: 'AI thumbnail generation',        desc: 'Pollinations AI generates a cinematic thumbnail from your topic.' },
    ],
  },
  {
    badge: 'ANALYTICS',
    heading: 'Know exactly where\nyour audience drops off',
    sub: 'Real YouTube Analytics data — retention prediction, revenue estimates, fake follower detection, and AI chat with your channel stats.',
    features: [
      { icon: BarChart2,  title: 'Retention score + drop timestamps', desc: 'Script Doctor rewrites weak segments automatically.' },
      { icon: DollarSign, title: 'Revenue in ₹ — realistic estimates', desc: 'AdSense, brand deals, and sponsorship rates for Indian creators.' },
      { icon: ScanLine,   title: 'Fake follower scanner',              desc: 'Authenticity score out of 100 for any YouTube channel.' },
    ],
  },
  {
    badge: 'GROWTH',
    heading: 'Find trends before\neveryone else does',
    sub: 'Live Google Trends India, hashtag ROI scores, collaborator finder, and a full voice-to-content pipeline — all in one place.',
    features: [
      { icon: Flame,      title: 'Live India trends + 3 scripts', desc: 'Real-time Google Trends with ready-to-shoot short scripts.' },
      { icon: Hash,       title: 'Hashtag ROI 0–100',             desc: 'Know which hashtags to use and which to skip.' },
      { icon: Users,      title: 'Collab score for any creator',  desc: 'AI finds the best YouTube collaboration partners for your niche.' },
    ],
  },
]

function FeatureCard({ f }) {
  const [expanded, setExpanded] = useState(false)
  return (
    <div className="border border-neutral-200 rounded-2xl p-6 hover:border-neutral-400/40 transition-all flex flex-col bg-white">
      <div className="flex items-start gap-3 mb-3">
        <div className="w-9 h-9 border border-neutral-200 rounded-xl flex items-center justify-center shrink-0 mt-0.5">
          <f.icon size={15} className="text-neutral-500" />
        </div>
        <h3 className="font-semibold text-base text-black leading-tight mt-1.5">{f.title}</h3>
      </div>
      <p className={`text-sm text-neutral-500 leading-relaxed mb-3 flex-1 ${expanded ? '' : 'line-clamp-2'}`}>
        {f.desc}
      </p>
      <div className="flex flex-wrap gap-1.5 mb-4">
        {f.tags.map(tag => (
          <span key={tag} className="text-[11px] border border-neutral-200 text-neutral-500 px-2.5 py-1 rounded-full">{tag}</span>
        ))}
      </div>
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-1.5 text-xs font-medium text-neutral-500 hover:text-black transition-colors self-start border border-neutral-200 px-3 py-1.5 rounded-lg hover:border-neutral-400"
      >
        {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
        {expanded ? 'Hide Details' : 'View Details'}
      </button>
    </div>
  )
}

export default function Home() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('cognitive')
  const [showDetails, setShowDetails] = useState(false)

  const currentModule = tabModules[activeTab]

  return (
    <div className="min-h-screen bg-white text-black overflow-x-hidden">

      {/* Nav */}
      <nav className="sticky top-0 z-50 mx-4 mt-4 rounded-3xl border border-neutral-500/25 bg-white/95 shadow-sm backdrop-blur-md sm:mx-10 md:mx-16 lg:mx-24">
        <div className="flex items-center justify-between px-4 py-2 max-w-7xl mx-auto">
          <img className="w-30" src="https://ik.imagekit.io/qwzhnpeqg/crewflow/Screenshot%202026-06-21%20105738.png" />
          <div className="hidden md:flex items-center gap-3 text-black">
            {featureTabs.map(t => (
              <button key={t.id} onClick={() => setActiveTab(t.id)} className="hover:font-bold text-sm">{t.label}</button>
            ))}
          </div>
          <button onClick={() => navigate('/auth')} className="text-md font-bold bg-black px-4 py-2 rounded-3xl text-white hover:bg-neutral-800 transition-colors">
            Get Started
          </button>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative max-w-7xl mx-auto px-6 pt-28 pb-10 text-center">
        <h1 className="text-5xl md:text-7xl font-bold leading-[1.05] mb-6">
          Your Invisible<br />
          <span className="text-black">Content Manager</span>
        </h1>
        <p className="text-neutral-600 text-lg max-w-2xl mx-auto mb-10 leading-relaxed">
          Stop losing 8 hours a day to manual tasks. CrewFlow's AI handles comments, hooks, trends, and analytics so you focus on storytelling.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-4">
          <button
            onClick={() => navigate('/auth')}
            className="flex items-center gap-2.5 bg-black text-white px-7 py-3.5 rounded-xl font-semibold hover:bg-neutral-800 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <svg viewBox="0 0 24 24" className="w-4 h-4">
              <path fill="currentColor" d="M23.5 6.19a3.02 3.02 0 0 0-2.12-2.14C19.54 3.5 12 3.5 12 3.5s-7.54 0-9.38.55A3.02 3.02 0 0 0 .5 6.19C0 8.04 0 12 0 12s0 3.96.5 5.81a3.02 3.02 0 0 0 2.12 2.14C4.46 20.5 12 20.5 12 20.5s7.54 0 9.38-.55a3.02 3.02 0 0 0 2.12-2.14C24 15.96 24 12 24 12s0-3.96-.5-5.81zM9.75 15.52V8.48L15.5 12l-5.75 3.52z" />
            </svg>
            Connect YouTube Free
            <ArrowRight size={15} />
          </button>
        </div>

        <div className="flex items-center justify-center gap-3 mb-10">
          <div className="flex items-center">
            {[0,1,2,3].map(i => (
              <img key={i} src="https://website-assets.vidyo.ai/Home%20Page%20Images/samuel_zen-testimonial.jpg"
                style={{ marginLeft: i === 0 ? 0 : '-10px', zIndex: i }}
                className="w-9 h-9 rounded-full border-2 border-white object-cover" />
            ))}
          </div>
          <p className="text-sm text-neutral-500"><span className="font-semibold text-black">2,400+</span> creators already growing</p>
        </div>

        {/* Feature Tabs */}
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-wrap items-center justify-center gap-2 mb-8">
            {featureTabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => { setActiveTab(tab.id); setShowDetails(false) }}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium border transition-all ${
                  activeTab === tab.id
                    ? 'bg-black text-white border-black'
                    : 'bg-white text-neutral-600 border-neutral-300 hover:border-neutral-500 hover:text-black'
                }`}
              >
                <tab.icon size={14} />
                {tab.label}
              </button>
            ))}
          </div>

          <div className="relative rounded-2xl overflow-hidden border border-neutral-200 mb-6">
            <video
              key={activeTab}
              src="https://ik.imagekit.io/qwzhnpeqg/crewflow/AI%20Clips-RF27.mp4"
              className="w-full aspect-video object-cover"
              autoPlay muted loop playsInline
            />
            <button
              onClick={() => setShowDetails(v => !v)}
              className="absolute top-3 right-3 flex items-center gap-1.5 bg-black/80 hover:bg-black text-white text-xs font-medium px-3 py-1.5 rounded-lg backdrop-blur-sm transition-all"
            >
              {showDetails ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
              {showDetails ? 'Hide Details' : 'View Details'}
            </button>
            <div className="absolute bottom-3 left-3 flex items-center gap-2 bg-black/60 text-white text-xs px-3 py-1.5 rounded-lg backdrop-blur-sm">
              <currentModule.icon size={12} />
              {currentModule.heading}
            </div>
          </div>

          {showDetails && (
            <div className="text-left">
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {currentModule.features.map(f => <FeatureCard key={f.title} f={f} />)}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Stats */}
      <section className="bg-[#FAFAF8] px-6 py-12">
        <div className="grid max-w-5xl mx-auto grid-cols-2 md:grid-cols-4 gap-3">
          {stats.map(s => (
            <div key={s.label} className="border border-neutral-200 rounded-xl py-6 px-4 text-center bg-white">
              <div className="text-5xl font-bold mb-1 text-black">{s.value}</div>
              <div className="text-sm text-neutral-700 mb-1">{s.label}</div>
              <div className="text-xs text-neutral-500">{s.sub}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Feature Sections */}
      <section className="max-w-5xl mx-auto px-4 mt-20 mb-10 space-y-28">
        {featureSections.map((sec, si) => (
          <div key={si}>
            {/* Header */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8 mb-12">
              <div className="flex flex-col gap-3">
                <span className="text-xs font-bold tracking-widest text-neutral-400 uppercase">{sec.badge}</span>
                <h2 className="text-4xl md:text-5xl font-bold leading-tight whitespace-pre-line">{sec.heading}</h2>
                <p className="text-lg text-neutral-500 max-w-xl">{sec.sub}</p>
              </div>
              <button
                onClick={() => navigate('/auth')}
                className="bg-black text-white font-semibold py-3 px-8 text-sm rounded-xl whitespace-nowrap hover:bg-neutral-800 transition-all shrink-0"
              >
                Try Free →
              </button>
            </div>

            {/* Feature cards grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {sec.features.map((f, fi) => (
                <div key={fi} className="bg-neutral-50 border border-neutral-200 rounded-2xl p-6 hover:border-neutral-400 hover:shadow-sm transition-all">
                  <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center mb-4">
                    <f.icon size={17} className="text-white" />
                  </div>
                  <h3 className="font-semibold text-black mb-1.5">{f.title}</h3>
                  <p className="text-sm text-neutral-500 leading-relaxed">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </section>

      {/* CTA Banner */}
      <section className="max-w-5xl mx-auto px-4 mb-20">
        <div className="bg-black rounded-3xl px-10 py-16 text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">Start growing today.<br />It's free.</h2>
          <p className="text-neutral-400 text-lg mb-8 max-w-xl mx-auto">Connect your YouTube channel in 30 seconds and let CrewFlow handle the rest.</p>
          <button
            onClick={() => navigate('/auth')}
            className="flex items-center gap-2 bg-white text-black font-bold px-8 py-4 rounded-xl mx-auto hover:bg-neutral-100 transition-colors text-base"
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5">
              <path fill="currentColor" d="M23.5 6.19a3.02 3.02 0 0 0-2.12-2.14C19.54 3.5 12 3.5 12 3.5s-7.54 0-9.38.55A3.02 3.02 0 0 0 .5 6.19C0 8.04 0 12 0 12s0 3.96.5 5.81a3.02 3.02 0 0 0 2.12 2.14C4.46 20.5 12 20.5 12 20.5s7.54 0 9.38-.55a3.02 3.02 0 0 0 2.12-2.14C24 15.96 24 12 24 12s0-3.96-.5-5.81zM9.75 15.52V8.48L15.5 12l-5.75 3.52z" />
            </svg>
            Connect YouTube — Free
            <ArrowRight size={16} />
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-neutral-200 py-6 px-6">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <img src="https://ik.imagekit.io/qwzhnpeqg/crewflow/Screenshot%202026-06-21%20105738.png" className="w-28" />
          <p className="text-xs text-neutral-500">© 2026 CrewFlow. All rights reserved.</p>
          <div className="flex items-center gap-4 text-xs text-neutral-500">
            <a href="#" className="hover:text-black transition-colors">About</a>
            <a href="#" className="hover:text-black transition-colors">Privacy</a>
            <a href="#" className="hover:text-black transition-colors">Terms</a>
            <a href="#" className="hover:text-black transition-colors">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
