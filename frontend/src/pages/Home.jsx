import { useNavigate } from 'react-router-dom'
import { useState } from 'react'
import {
  Zap, BarChart2, Mic, TrendingUp, ArrowRight,
  MessageSquare, RefreshCw, Hash, Users, Shield, Languages,
  MonitorPlay, Brain, DollarSign, ScanLine, Flame,
  Scissors, Type, Film, Palette, ChevronDown, ChevronUp
} from 'lucide-react'

const featureTabs = [
  { id: 'clipping', label: 'AI Video Clipping', icon: Scissors },
  { id: 'captions', label: 'AI Captions', icon: Type },
  { id: 'editor', label: 'AI Video Editor', icon: Film },
  { id: 'brandkit', label: 'Brand Kit', icon: Palette },
]

const tabModules = {
  clipping: {
    heading: 'Cognitive Analysis',
    icon: Brain,
    features: [
      {
        icon: MessageSquare,
        title: 'Comment Responder',
        desc: 'Paste your YouTube video ID and AI fetches all comments, analyzes sentiment (positive/negative/angry/question), assigns priority (high/medium/low), and generates a human-like draft reply for each comment. Review, edit, and post directly to YouTube — all from your dashboard.',
        tags: ['Sentiment Analysis', 'Auto Draft Reply', 'Direct Post to YT'],
      },
      {
        icon: Zap,
        title: 'Hook + Title Generator',
        desc: 'Enter your topic, niche, and target audience. AI reverse-engineers viral patterns to generate 5 scroll-stopping opening lines (first 3 seconds), 5 SEO-optimized titles with power words, and 5 high-contrast thumbnail text concepts. Works for YouTube, Instagram, LinkedIn, and Twitter.',
        tags: ['5 Viral Hooks', '5 SEO Titles', '5 Thumbnail Texts'],
      },
      {
        icon: RefreshCw,
        title: 'Content Repurposer',
        desc: 'Paste a script or give a YouTube Video ID. AI transforms it into 10 ready-to-publish assets: 3 Shorts/Reels scripts, a 5-tweet thread, LinkedIn post, blog outline with sections, 3 Instagram captions with hashtags, plus a full SEO package with 150-word description and 10 tags.',
        tags: ['3 Shorts Scripts', 'Tweet Thread', 'SEO Package'],
      },
    ],
  },
  captions: {
    heading: 'Voice & Audio',
    icon: Mic,
    features: [
      {
        icon: Mic,
        title: 'Speech to Text',
        desc: 'Upload any audio file (Hindi, English, Marathi, Tamil — any language). Groq Whisper Large V3 transcribes it with word-level timestamps. Get clean script text with segment breakdowns showing exact start/end times. Max 25MB file. Ideal for converting voice notes into content scripts.',
        tags: ['Groq Whisper V3', 'Any Indian Language', 'Word Timestamps'],
      },
      {
        icon: Mic,
        title: 'Voice Cloning + TTS',
        desc: 'Upload a 30-second voice sample and ElevenLabs clones your voice permanently. Then convert any text to speech in your cloned voice — supports Hindi, Marathi, Tamil, Bengali and 28+ languages via eleven_multilingual_v2 model. Generated audio is uploaded to ImageKit and you get a playable URL.',
        tags: ['ElevenLabs Clone', '28+ Languages', 'ImageKit Storage'],
      },
      {
        icon: MonitorPlay,
        title: 'Platform Video Resizer',
        desc: 'Upload one video and get it resized for all 6 platforms simultaneously — YouTube (1920×1080), YouTube Shorts (1080×1920), Instagram Reels (1080×1920), Instagram Feed (1080×1080), LinkedIn (1280×720), and Twitter/X (1280×720). Powered by ImageKit transformations. No FFmpeg needed.',
        tags: ['6 Platforms', 'ImageKit Powered', 'Instant URLs'],
      },
      {
        icon: Zap,
        title: 'Voice to Content',
        desc: 'The most powerful feature. Record a voice note, upload it, and get everything in one call: full transcript with timestamps, 5 viral hooks + 5 SEO titles + 5 thumbnail texts, AND all 10 repurposed content assets (Shorts, tweets, LinkedIn, blog, Instagram, SEO). From voice note to full content strategy.',
        tags: ['Transcript + Hooks', '10 Assets', 'One API Call'],
      },
      {
        icon: Languages,
        title: 'Regional Translator',
        desc: 'Break the language barrier. Translate any script into 12 Indian languages: Marathi, Bhojpuri, Tamil, Telugu, Kannada, Bengali, Gujarati, Punjabi, Malayalam, Hindi, English, and Hinglish. AI keeps tone natural and conversational — like a native speaker. Also provides romanized version and translator notes.',
        tags: ['12 Indian Languages', 'Natural Tone', 'Romanized Version'],
      },
    ],
  },
  editor: {
    heading: 'Strategic Analytics',
    icon: BarChart2,
    features: [
      {
        icon: BarChart2,
        title: 'Audience Retention Predictor',
        desc: 'Enter a video ID and AI fetches real YouTube Analytics data — average view duration, view percentage, watch minutes, subscribers gained. Then predicts exact timestamps where audience will drop, assigns severity (high/medium/low), gives a retention score out of 100, and provides specific actionable fixes.',
        tags: ['Real YT Analytics', 'Drop Point Prediction', 'Retention Score'],
      },
      {
        icon: DollarSign,
        title: 'Revenue Estimator ₹',
        desc: 'Get a complete Indian market revenue breakdown. AI estimates monthly AdSense (min/max/realistic), brand deal value per video, sponsored post rates, and affiliate potential — all in ₹. Also shows CPM/RPM estimates, growth tier (nano to mega), monetization eligibility status, and top revenue stream recommendations.',
        tags: ['₹ Indian Rates', 'Brand Deal Value', 'Growth Tier'],
      },
      {
        icon: ScanLine,
        title: 'Fake Follower Scanner',
        desc: 'Scan any public YouTube channel (or your own) for fake engagement. AI analyzes view-to-subscriber ratio, like-to-view ratio, comment quality from 30 sample comments, and calculates an authenticity score out of 100. Get fake follower % estimate, red flags, green flags, and brand deal worthiness rating.',
        tags: ['Authenticity Score', 'Fake % Estimate', 'Brand Worthiness'],
      },
    ],
  },
  brandkit: {
    heading: 'Growth Intelligence',
    icon: TrendingUp,
    features: [
      {
        icon: Flame,
        title: 'Trend Jacking Engine',
        desc: 'Enter your niche and AI fetches real-time Google Trends data for India — related topics, trending queries, and daily viral searches. Then generates 3 ready-to-shoot 60-second scripts that jack the trend for your niche, complete with hook, full script, CTA, and hashtags. Also tells you the trend urgency and best posting time.',
        tags: ['Google Trends India', '3 Ready Scripts', 'Trend Urgency'],
      },
      {
        icon: Hash,
        title: 'Hashtag ROI Calculator',
        desc: 'Enter up to 15 hashtags (comma separated). For each hashtag, AI searches YouTube for competition level, fetches Google Trends interest over 90 days, calculates average views of top videos, and gives an ROI score (0-100). Get a recommended hashtag set to use, ones to avoid, best posting time, and overall strategy.',
        tags: ['ROI Score 0-100', 'Competition Level', 'Best Set Recommended'],
      },
      {
        icon: Users,
        title: 'Collaborator Finder',
        desc: 'Enter your niche and AI searches YouTube for similar Indian creators, fetches their full channel stats (subscribers, views, keywords), and scores each one for collaboration potential (0-100). Get audience overlap estimate, best collab format (podcast, challenge, duet), combined reach potential, and a top pick recommendation.',
        tags: ['Collab Score', 'Audience Overlap', 'Top Pick AI'],
      },
    ],
  },
}

const stats = [
  { value: '88%', label: 'Creators earn under $100/mo', sub: 'without automation' },
  { value: '8hrs', label: 'Lost daily to manual work', sub: 'per creator average' },
  { value: '90%', label: 'Time saved with CrewFlow', sub: 'proven by A/B tests' },
  { value: '10x', label: 'Faster content publishing', sub: 'from 8hrs to 45 mins' },
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
          <span key={tag} className="text-[11px] border border-neutral-200 text-neutral-500 px-2.5 py-1 rounded-full">
            {tag}
          </span>
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
  const [activeTab, setActiveTab] = useState('clipping')
  const [showDetails, setShowDetails] = useState(false)

  const currentModule = tabModules[activeTab]

  return (
    <div className="min-h-screen bg-[#FFFFFF] text-black overflow-x-hidden">

      {/* Nav */}
      <nav className="sticky top-0 z-50 mx-4 mt-4 rounded-3xl border border-neutral-500/25 bg-white/95 shadow-sm backdrop-blur-md sm:mx-10 md:mx-16 lg:mx-24">
        <div className="flex items-center justify-between px-4 py-2 max-w-7xl mx-auto">
          <div className="flex items-center">
            <img className="w-30" src="https://ik.imagekit.io/qwzhnpeqg/crewflow/Screenshot%202026-06-21%20105738.png" />
          </div>
          <div className="hidden md:flex items-center gap-3 text-black">
            {featureTabs.map(t => (
              <button key={t.id} onClick={() => setActiveTab(t.id)} className="hover:font-bold text-sm">
                {t.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/auth')} className="text-md font-bold bg-black px-4 py-2 rounded-3xl text-white hover:bg-neutral-800 transition-colors">
              Get Started
            </button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative max-w-7xl mx-auto px-6 pt-28 pb-10 text-center">
        <h1 className="text-5xl md:text-7xl font-bold leading-[1.05] mb-6">
          Your Invisible
          <br />
          <span className="text-black">Content Manager</span>
        </h1>
        <p className="text-neutral-600 text-lg max-w-2xl mx-auto mb-10 leading-relaxed">
          Stop losing 8 hours a day to manual tasks. CrewFlow's AI handles comments, hooks, trends, and analytics so you focus on storytelling.
        </p>

        {/* CTA Button */}
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

        {/* Social Proof */}
        <div className="flex items-center justify-center gap-3 mb-10">
          <div className="flex items-center">
            {[
              'https://website-assets.vidyo.ai/Home%20Page%20Images/samuel_zen-testimonial.jpg',
              'https://website-assets.vidyo.ai/Home%20Page%20Images/samuel_zen-testimonial.jpg',
              'https://website-assets.vidyo.ai/Home%20Page%20Images/samuel_zen-testimonial.jpg',
              'https://website-assets.vidyo.ai/Home%20Page%20Images/samuel_zen-testimonial.jpg',
            ].map((src, i) => (
              <img
                key={i}
                src={src}
                alt="creator"
                style={{ marginLeft: i === 0 ? 0 : '-10px', zIndex: i }}
                className="w-9 h-9 rounded-full border-2 border-white object-cover"
              />
            ))}
          </div>
          <p className="text-sm text-neutral-500">
            <span className="font-semibold text-black">2,400+</span> creators already growing
          </p>
        </div>

        {/* Feature Tabs */}
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-wrap items-center justify-center gap-2 mb-8">
            {featureTabs.map((tab) => (
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

          {/* Single Video with View Details button */}
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

          {/* Feature cards — shown on View Details click */}
          {showDetails && (
            <div className="text-left">
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {currentModule.features.map((f) => (
                  <FeatureCard key={f.title} f={f} />
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Stats */}
      <section className="bg-[#FAFAF8] px-6 py-12">
        <div className="grid max-w-5xl mx-auto grid-cols-2 md:grid-cols-4 gap-3">
          {stats.map((s) => (
            <div key={s.label} className="border border-neutral-200 rounded-xl py-6 px-4 text-center bg-white">
              <div className="text-5xl font-bold mb-1 text-black">{s.value}</div>
              <div className="text-sm text-neutral-700 mb-1">{s.label}</div>
              <div className="text-xs text-neutral-500">{s.sub}</div>
            </div>
          ))}
        </div>
      </section>

    <section className='max-w-5xl mx-auto px-4 mt-20 mb-10'>
  



  {/* Header Section */}
  <div className='flex flex-row items-center justify-between gap-10 w-full mb-16'>
    <div className='flex flex-col gap-3'>
      <h1 className='text-5xl font-bold leading-[3.5rem]'>
        One Stop Social Media <br /> Manager for Creators
      </h1>
      <div className='text-xl text-neutral-500'>
        Save hours in scheduling and managing content across 7 <br /> social platforms in just few clicks.
      </div>
    </div>
    <div className='flex-shrink-0'>
      <button className='bg-black text-white font-semibold py-3 px-8 text-lg rounded-md whitespace-nowrap hover:bg-neutral-800 transition-all'>
        Manage Socials Now
      </button>
    </div>
  </div>

  {/* Video Grid Section */}
  <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-20'>
    {[1, 2, 3].map((item) => (
      <div key={item} className='bg-neutral-50 p-3 border border-neutral-200 rounded-lg hover:shadow-md transition-shadow'>
         <h3 className='font-bold text-lg mb-1'>Smart Content Repurposing</h3>
        <p className='text-neutral-500 text-sm mb-4'>AI se apne long videos ko short clips mein badlein.</p>

        <div className='w-full h-52 bg-neutral-200 rounded-xl mb-4 overflow-hidden'>
         <video src='https://ik.imagekit.io/qwzhnpeqg/crewflow/AI%20Clips-RF27.mp4' className='object-cover' />
          <div className='w-full h-full flex items-center justify-center text-neutral-400'>
            Video {item}
          </div>
        </div>
       
      </div>
    ))}
  </div>




 <div className='flex flex-row items-center justify-between gap-10 w-full mb-16'>
    <div className='flex flex-col gap-3'>
      <h1 className='text-5xl font-bold leading-[3.5rem]'>
        One Stop Social Media <br /> Manager for Creators
      </h1>
      <div className='text-xl text-neutral-500'>
        Save hours in scheduling and managing content across 7 <br /> social platforms in just few clicks.
      </div>
    </div>
    <div className='flex-shrink-0'>
      <button className='bg-black text-white font-semibold py-3 px-8 text-lg rounded-md whitespace-nowrap hover:bg-neutral-800 transition-all'>
        Manage Socials Now
      </button>
    </div>
  </div>

  {/* Video Grid Section */}
  <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-20'>
    {[1, 2, 3].map((item) => (
      <div key={item} className='bg-neutral-50 p-3 border border-neutral-200 rounded-lg hover:shadow-md transition-shadow'>
         <h3 className='font-bold text-lg mb-1'>Smart Content Repurposing</h3>
        <p className='text-neutral-500 text-sm mb-4'>AI se apne long videos ko short clips mein badlein.</p>

        <div className='w-full h-52 bg-neutral-200 rounded-xl mb-4 overflow-hidden'>
         <video src='https://ik.imagekit.io/qwzhnpeqg/crewflow/AI%20Clips-RF27.mp4' className='object-cover' />
          <div className='w-full h-full flex items-center justify-center text-neutral-400'>
            Video {item}
          </div>
        </div>
       
      </div>
    ))}
  </div>




  
 <div className='flex flex-row items-center justify-between gap-10 w-full mb-16'>
    <div className='flex flex-col gap-3'>
      <h1 className='text-5xl font-bold leading-[3.5rem]'>
        One Stop Social Media <br /> Manager for Creators
      </h1>
      <div className='text-xl text-neutral-500'>
        Save hours in scheduling and managing content across 7 <br /> social platforms in just few clicks.
      </div>
    </div>
    <div className='flex-shrink-0'>
      <button className='bg-black text-white font-semibold py-3 px-8 text-lg rounded-md whitespace-nowrap hover:bg-neutral-800 transition-all'>
        Manage Socials Now
      </button>
    </div>
  </div>

  {/* Video Grid Section */}
  <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-20'>
    {[1, 2, 3].map((item) => (
      <div key={item} className='bg-neutral-50 p-3 border border-neutral-200 rounded-lg hover:shadow-md transition-shadow'>
         <h3 className='font-bold text-lg mb-1'>Smart Content Repurposing</h3>
        <p className='text-neutral-500 text-sm mb-4'>AI se apne long videos ko short clips mein badlein.</p>

        <div className='w-full h-52 bg-neutral-200 rounded-xl mb-4 overflow-hidden'>
         <video src='https://ik.imagekit.io/qwzhnpeqg/crewflow/AI%20Clips-RF27.mp4' className='object-cover' />
          <div className='w-full h-full flex items-center justify-center text-neutral-400'>
            Video {item}
          </div>
        </div>
       
      </div>
    ))}
  </div>






  
 <div className='flex flex-row items-center justify-between gap-10 w-full mb-16'>
    <div className='flex flex-col gap-3'>
      <h1 className='text-5xl font-bold leading-[3.5rem]'>
        One Stop Social Media <br /> Manager for Creators
      </h1>
      <div className='text-xl text-neutral-500'>
        Save hours in scheduling and managing content across 7 <br /> social platforms in just few clicks.
      </div>
    </div>
    <div className='flex-shrink-0'>
      <button className='bg-black text-white font-semibold py-3 px-8 text-lg rounded-md whitespace-nowrap hover:bg-neutral-800 transition-all'>
        Manage Socials Now
      </button>
    </div>
  </div>

  {/* Video Grid Section */}
  <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-20'>
    {[1, 2, 3].map((item) => (
      <div key={item} className='bg-neutral-50 p-3 border border-neutral-200 rounded-lg hover:shadow-md transition-shadow'>
         <h3 className='font-bold text-lg mb-1'>Smart Content Repurposing</h3>
        <p className='text-neutral-500 text-sm mb-4'>AI se apne long videos ko short clips mein badlein.</p>

        <div className='w-full h-52 bg-neutral-200 rounded-xl mb-4 overflow-hidden'>
         <video src='https://ik.imagekit.io/qwzhnpeqg/crewflow/AI%20Clips-RF27.mp4' className='object-cover' />
          <div className='w-full h-full flex items-center justify-center text-neutral-400'>
            Video {item}
          </div>
        </div>
       
      </div>
    ))}
  </div>






  
 <div className='flex flex-row items-center justify-between gap-10 w-full mb-16'>
    <div className='flex flex-col gap-3'>
      <h1 className='text-5xl font-bold leading-[3.5rem]'>
        One Stop Social Media <br /> Manager for Creators
      </h1>
      <div className='text-xl text-neutral-500'>
        Save hours in scheduling and managing content across 7 <br /> social platforms in just few clicks.
      </div>
    </div>
    <div className='flex-shrink-0'>
      <button className='bg-black text-white font-semibold py-3 px-8 text-lg rounded-md whitespace-nowrap hover:bg-neutral-800 transition-all'>
        Manage Socials Now
      </button>
    </div>
  </div>

  {/* Video Grid Section */}
  <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-20'>
    {[1, 2, 3].map((item) => (
      <div key={item} className='bg-neutral-50 p-3 border border-neutral-200 rounded-lg hover:shadow-md transition-shadow'>
         <h3 className='font-bold text-lg mb-1'>Smart Content Repurposing</h3>
        <p className='text-neutral-500 text-sm mb-4'>AI se apne long videos ko short clips mein badlein.</p>

        <div className='w-full h-52 bg-neutral-200 rounded-xl mb-4 overflow-hidden'>
         <video src='https://ik.imagekit.io/qwzhnpeqg/crewflow/AI%20Clips-RF27.mp4' className='object-cover' />
          <div className='w-full h-full flex items-center justify-center text-neutral-400'>
            Video {item}
          </div>
        </div>
       
      </div>
    ))}
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
