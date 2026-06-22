import { useEffect, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { getMe } from '../lib/api'
import Sidebar from '../components/dashboard/Sidebar'
import Overview from '../components/dashboard/Overview'
import Comments from '../components/dashboard/Comments'
import HookGenerator from '../components/dashboard/HookGenerator'
import Repurpose from '../components/dashboard/Repurpose'
import Translate from '../components/dashboard/Translate'
import { Revenue, Retention, FakeScan } from '../components/dashboard/Analytics'
import TrendHub from '../components/dashboard/TrendHub'
import { Collaborators } from '../components/dashboard/Growth'
import ChannelAnalytics from '../components/dashboard/ChannelAnalytics'
import ChannelContent from '../components/dashboard/ChannelContent'
import StudioAI from '../components/dashboard/StudioAI'
import PostManager from '../components/dashboard/PostManager'
import VideoStudio from '../components/dashboard/VideoStudio'

export default function Dashboard() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const [creator, setCreator] = useState(null)
  const [tab, setTab] = useState(params.get('tab') || 'overview')
  const [loading, setLoading] = useState(true)

  const creatorId = params.get('creator_id') || localStorage.getItem('creator_id')

  useEffect(() => {
    if (!creatorId) { navigate('/auth'); return }
    localStorage.setItem('creator_id', creatorId)
    getMe(creatorId)
      .then(r => setCreator(r.data))
      .catch(() => navigate('/auth'))
      .finally(() => setLoading(false))
  }, [creatorId])

  useEffect(() => {
    const t = params.get('tab')
    if (t) setTab(t)
  }, [params])

  if (loading) return (
    <div className="min-h-screen bg-[#FFFFFF]   flex items-center justify-center">
      <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
    </div>
  )

  const TABS = {
    overview:           <Overview creatorId={creatorId} setTab={setTab} />,
    'channel-analytics': <ChannelAnalytics creatorId={creatorId} />,
    content:           <ChannelContent creatorId={creatorId} />,
    posts:             <PostManager creatorId={creatorId} />,
    comments:           <Comments creatorId={creatorId} />,
    hooks:         <HookGenerator creatorId={creatorId} />,
    repurpose:     <Repurpose creatorId={creatorId} />,
    transcribe:    <Placeholder title="Transcribe Audio" desc="Upload an audio file to transcribe using Groq Whisper. Use Postman: POST /voice/transcribe" />,
    translate:     <Translate creatorId={creatorId} />,
    resize:        <Placeholder title="Video Resizer" desc="Upload a video to resize for all platforms. Use Postman: POST /voice/resize" />,
    retention:     <Retention creatorId={creatorId} />,
    revenue:       <Revenue creatorId={creatorId} />,
    fakescan:      <FakeScan creatorId={creatorId} />,
    trendhub:        <TrendHub creatorId={creatorId} />,
    collaborators: <Collaborators creatorId={creatorId} />,
    'studio-ai':   <StudioAI creatorId={creatorId} />,
    videostudio:   <VideoStudio creatorId={creatorId} />,
  }

  return (
    <div className="min-h-screen bg-[#FFFFFF]  text-white flex">
      <Sidebar creator={creator} tab={tab} setTab={setTab} />
      <main className="flex-1 overflow-y-auto min-w-0">
        <div className="w-full px-8 py-7">
          {TABS[tab] || TABS.overview}
        </div>
      </main>
    </div>
  )
}

function Placeholder({ title, desc }) {
  return (
    <div className="border border-neutral-500/30 rounded-2xl p-8 text-center">
      <h2 className="text-lg font-semibold mb-2">{title}</h2>
      <p className="text-neutral-400 text-sm">{desc}</p>
    </div>
  )
}
