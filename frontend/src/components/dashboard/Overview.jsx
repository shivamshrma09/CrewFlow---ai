import { useEffect, useRef, useState } from 'react'
import { getDashboard, getCommentIdeas, diagnoseVideo } from '../../lib/api'
import { Eye, ThumbsUp, MessageSquare, Users, ExternalLink, TrendingUp, Video, ChevronRight, Play, Brain, Lightbulb, Loader2, Sparkles, CalendarDays, Trophy } from 'lucide-react'
import { IoMdStats, IoMdNotificationsOutline } from "react-icons/io";
import { RiGeminiFill } from "react-icons/ri";
import { LiaComments } from "react-icons/lia";
import { MdOutlineCreate, MdOutlineFileUpload } from "react-icons/md";

function fmt(n) {
  if (!n) return '0'
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M'
  if (n >= 1000) return (n / 1000).toFixed(1) + 'K'
  return n.toString()
}

function parseDuration(iso) {
  const m = iso?.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/)
  if (!m) return '0:00'
  const h = m[1] ? `${m[1]}:` : ''
  const min = (m[2] || '0').padStart(h ? 2 : 1, '0')
  const sec = (m[3] || '0').padStart(2, '0')
  return `${h}${min}:${sec}`
}

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr)
  const d = Math.floor(diff / 86400000)
  if (d === 0) return 'Today'
  if (d === 1) return 'Yesterday'
  if (d < 7) return `${d} days ago`
  if (d < 30) return `${Math.floor(d / 7)}w ago`
  if (d < 365) return `${Math.floor(d / 30)}mo ago`
  return `${Math.floor(d / 365)}y ago`
}

function Divider() {
  return <div className="border-t border-neutral-800" />
}

function getAIAnalysis({ stats, latestVideo, topViewVideo, avgViews }) {
  const latestLikeRate = latestVideo?.view_count
    ? (latestVideo.like_count / latestVideo.view_count) * 100
    : 0
  const latestCommentRate = latestVideo?.view_count
    ? (latestVideo.comment_count / latestVideo.view_count) * 100
    : 0

  const topVideoRatio = avgViews > 0 && topViewVideo?.view_count
    ? topViewVideo.view_count / avgViews
    : 0

  const score = Math.min(
    99,
    Math.round(
      Math.min(35, latestLikeRate * 8) +
      Math.min(25, Math.min(avgViews, 300000) / 12000) +
      Math.min(20, Math.min(stats.subscribers || 0, 250000) / 12500) +
      Math.min(20, Math.max(0, topVideoRatio - 0.5) * 40)
    )
  )

  let headline = 'Your channel is growing steadily.'
  if (score >= 80) headline = 'Your channel is performing strongly right now.'
  else if (score >= 60) headline = 'Your channel has solid momentum and room to scale.'
  else headline = 'Your content has potential, but the next few uploads can improve reach.'

  const insights = [
    {
      label: 'Engagement',
      value: `${latestLikeRate.toFixed(1)}% like rate`,
      note: latestCommentRate > 0
        ? `${latestCommentRate.toFixed(2)}% comment rate`
        : 'Comment activity looks steady'
    },
    {
      label: 'Average reach',
      value: fmt(Math.round(avgViews)),
      note: 'Views per video on your current channel mix'
    },
    {
      label: 'Best performer',
      value: topViewVideo ? fmt(topViewVideo.view_count) : '—',
      note: topViewVideo
        ? 'Your strongest video so far'
        : 'No top video data yet'
    }
  ]

  const actions = [
    latestLikeRate >= 3
      ? 'Keep using the same storytelling style because it is already driving strong audience response.'
      : 'Try a stronger hook in the first 10–15 seconds to improve watch-time and likes.',
    avgViews >= 20000
      ? 'Replicate the format of your best-performing videos into your next 2–3 uploads.'
      : 'Post more consistently so your best ideas can turn into repeatable growth.',
    topVideoRatio >= 1.2
      ? 'Double down on the content pattern that produced your highest-performing video.'
      : 'Experiment with a fresh thumbnail/title pair to test a new audience segment.'
  ]

  return { score, headline, insights, actions }
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const DAYS_FULL = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

function getUploadConsistency(videos) {
  if (!videos?.length) return { weeks: [], streakCount: 0 }
  const now = new Date()
  const weeks = []
  for (let w = 11; w >= 0; w--) {
    const weekDays = []
    for (let d = 0; d < 7; d++) {
      const date = new Date(now)
      date.setDate(now.getDate() - (w * 7 + (6 - d)))
      const dateStr = date.toISOString().split('T')[0]
      const uploaded = videos.some(v => v.published_at?.startsWith(dateStr))
      weekDays.push({ date: dateStr, uploaded })
    }
    weeks.push(weekDays)
  }
  // streak: consecutive weeks with at least 1 upload
  let streakCount = 0
  for (let w = weeks.length - 1; w >= 0; w--) {
    if (weeks[w].some(d => d.uploaded)) streakCount++
    else break
  }
  return { weeks, streakCount }
}

function getBestUploadDay(videos) {
  if (!videos?.length) return null
  const dayStats = Array(7).fill(null).map(() => ({ views: 0, count: 0 }))
  videos.forEach(v => {
    const day = new Date(v.published_at).getDay()
    dayStats[day].views += v.view_count || 0
    dayStats[day].count += 1
  })
  const avgByDay = dayStats.map((d, i) => ({
    day: i,
    avg: d.count > 0 ? Math.round(d.views / d.count) : 0,
    count: d.count
  }))
  return avgByDay
}

function SectionHeader({ title, linkText, onLink }) {
  return (
    <div className="flex bg-[#FFFFFF]  items-center justify-between px-6 pt-5 pb-4">
      <h3 className="text-black font-semibold">{title}</h3>
      {linkText && (
        <button onClick={onLink} className="flex items-center gap-1 text-sm text-black hover:text-black transition-colors">
          {linkText} <ChevronRight size={14} />
        </button>
      )}
    </div>
  )
}

export default function Overview({ creatorId, setTab }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [analysis, setAnalysis] = useState(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const timeoutRef = useRef(null)
  const [ideasData, setIdeasData] = useState(null)
  const [ideasLoading, setIdeasLoading] = useState(false)

  const [diagVideoId, setDiagVideoId] = useState(null)
  const [diagData, setDiagData] = useState(null)
  const [diagLoading, setDiagLoading] = useState(false)

  const handleGenerateIdeas = async () => {
    setIdeasLoading(true)
    try {
      const res = await getCommentIdeas({ creator_id: creatorId })
      setIdeasData(res.data)
    } catch (e) {
      alert(e.response?.data?.error || 'Error generating content ideas')
    } finally {
      setIdeasLoading(false)
    }
  }

  const handleDiagnose = async (videoId) => {
    setDiagVideoId(videoId)
    setDiagLoading(true)
    setDiagData(null)
    try {
      const res = await diagnoseVideo({ creator_id: creatorId, video_id: videoId })
      setDiagData(res.data)
    } catch (e) {
      alert(e.response?.data?.error || 'Failed to diagnose video')
      setDiagVideoId(null)
    } finally {
      setDiagLoading(false)
    }
  }

  useEffect(() => {
    getDashboard(creatorId).then(r => setData(r.data)).finally(() => setLoading(false))
  }, [creatorId])

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-72 gap-3">
      <div className="w-6 h-6 border-2 border-neutral-700 border-t-white rounded-full animate-spin" />
      <p className="text-sm text-neutral-500">Loading channel data...</p>
    </div>
  )

  if (!data) return (
    <div className="flex items-center justify-center h-72 text-black">
      Failed to load dashboard.
    </div>
  )

  const { channel, stats, recent_videos, top_viewed_videos, subscriptions } = data
  const latestVideo = recent_videos?.[0]
  const topContent = recent_videos?.slice(0, 5)
  const avgViews = Math.round((stats.total_views || 0) / Math.max(stats.total_videos || 1, 1))
  const topViewVideo = top_viewed_videos?.[0]

  const handleGenerateAnalysis = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    setIsAnalyzing(true)
    setAnalysis(null)

    timeoutRef.current = setTimeout(() => {
      setAnalysis(getAIAnalysis({ stats, latestVideo, topViewVideo, avgViews }))
      setIsAnalyzing(false)
    }, 30000)
  }

  return (
    <div className="space-y-5 bg-[#FFFFFF]  pb-10">

      {/* Page Title + Actions */}
      <div className="mt-10 flex items-center justify-between gap-3">
        <h1 className="text-2xl text-black font-bold">Channel dashboard</h1>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setTab && setTab('collaborators')}
            className="border border-neutral-500/70 text-black px-4 py-2 rounded-xl text-sm font-medium hover:bg-neutral-100 transition-colors"
          >
            Find Collaborater
          </button>
          <button 
            onClick={() => setTab && setTab('fakescan')}
            className="border border-neutral-500/70 text-black px-4 py-2 rounded-xl text-sm font-medium hover:bg-neutral-100 transition-colors"
          >
            Fake Follower
          </button>
          <button 
            onClick={() => setTab && setTab('studio-ai')}
            className="flex items-center gap-2 border border-neutral-500/70 text-black px-4 py-2 rounded-xl text-sm font-medium hover:bg-neutral-100 transition-colors"
          >
            <RiGeminiFill size={16} /> Chat with Studio AI
          </button>

           <button className=" text-black text-2xl p-2 rounded-xl  transition-colors">
            <IoMdNotificationsOutline size={25} className='font-bold' />
          </button>

        </div>
      </div>

      {/* Top Stats Row */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {[
          { icon: Users, label: 'Subscribers', value: fmt(stats.subscribers) },
          { icon: Eye, label: 'Total Views', value: fmt(stats.total_views) },
          { icon: Video, label: 'Videos', value: fmt(stats.total_videos) },
          { icon: TrendingUp, label: 'Avg Views / Video', value: fmt(Math.round(stats.total_views / (stats.total_videos || 1))) },
        ].map(s => (
          <div key={s.label} className="border border-neutral-500/30 rounded-2xl p-5 hover:border-neutral-500/50 transition-colors">
            <div className="flex items-center justify-between mb-4">
              <p className="text-lg text-black">{s.label}</p>
             
            </div>
            <p className="text-3xl text-black font-bold tracking-tight">{s.value}</p>
          </div>
        ))}
      </div>

      {/* AI Analysis Card */}
      <div className="rounded-2xl border border-neutral-500/30 bg-white p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <RiGeminiFill size={18} className="text-black" />
              <h2 className="text-base font-semibold text-black">AI channel analysis</h2>
            </div>
            <p className="text-sm text-neutral-600">
              {isAnalyzing
                ? 'Generating insights. This usually takes about 30 seconds.'
                : analysis?.headline || 'Tap below to generate a fresh AI insight for your channel.'}
            </p>
          </div>
          <button
            onClick={handleGenerateAnalysis}
            disabled={isAnalyzing}
            className="inline-flex items-center justify-center rounded-xl bg-black px-4 py-2.5 text-sm font-medium text-white hover:bg-neutral-800 transition-colors disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isAnalyzing ? 'Generating...' : 'Generate AI analysis'}
          </button>
        </div>

        {analysis && (
          <>
            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div />
              <div className="rounded-2xl bg-black px-4 py-2 text-right">
                <p className="text-xs text-neutral-300">AI score</p>
                <p className="text-2xl font-bold text-white">{analysis.score}/100</p>
              </div>
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-3">
              {analysis.insights.map(item => (
                <div key={item.label} className="rounded-xl border border-neutral-200 bg-white p-3">
                  <p className="text-xs text-neutral-500">{item.label}</p>
                  <p className="mt-1 text-sm font-semibold text-black">{item.value}</p>
                  <p className="mt-1 text-xs text-neutral-500">{item.note}</p>
                </div>
              ))}
            </div>

            <div className="mt-4 rounded-xl bg-neutral-50 p-3">
              <p className="text-xs font-semibold text-black mb-2">Recommended next moves</p>
              <ul className="space-y-1.5">
                {analysis.actions.map((action, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm text-neutral-700">
                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-black shrink-0" />
                    <span>{action}</span>
                  </li>
                ))}
              </ul>
            </div>
          </>
        )}
      </div>

      {/* Comment-Based Content Planner & Psychological Analysis */}
      <div className="rounded-2xl border border-neutral-500/30 bg-white p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-neutral-100 rounded-xl">
              <Brain size={22} className="text-black" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-black flex items-center gap-2">
                Audience Psychological Content Planner
                <span className="text-[10px] bg-neutral-100 text-neutral-600 px-2 py-0.5 rounded-full font-medium uppercase tracking-wide">AI Powered</span>
              </h2>
              <p className="text-xs text-neutral-500">Brainstorm viral content ideas backed by psychological triggers based on your latest user comments</p>
            </div>
          </div>
          <button
            onClick={handleGenerateIdeas}
            disabled={ideasLoading}
            className="inline-flex items-center justify-center rounded-xl bg-black px-4 py-2.5 text-xs font-semibold text-white hover:bg-neutral-800 transition-colors disabled:cursor-not-allowed disabled:opacity-70 gap-2 shrink-0"
          >
            {ideasLoading ? (
              <>
                <Loader2 size={13} className="animate-spin" />
                Analyzing Comments...
              </>
            ) : (
              <>
                <Lightbulb size={13} />
                {ideasData ? 'Regenerate Ideas' : 'Generate Psychological Ideas'}
              </>
            )}
          </button>
        </div>

        {ideasLoading && (
          <div className="flex flex-col items-center justify-center py-12 gap-3 bg-neutral-50 rounded-xl border border-dashed border-neutral-500/30">
            <Loader2 size={24} className="animate-spin text-neutral-400" />
            <p className="text-xs text-neutral-500 font-medium">Scanning comments across your videos, analyzing sentiment, and modeling psychological triggers...</p>
          </div>
        )}

        {!ideasLoading && !ideasData && (
          <div className="text-center py-8 bg-neutral-50 rounded-xl border border-dashed border-neutral-500/30">
            <p className="text-sm text-neutral-500 font-medium">No ideas generated yet.</p>
            <p className="text-xs text-neutral-400 mt-1">Click the button above to study what your audience wants and get custom content blueprints.</p>
          </div>
        )}

        {!ideasLoading && ideasData && (
          <div className="space-y-5">
            {/* Split row: Psychological Dynamics Chart + Mindset Summary */}
            <div className="grid gap-5 md:grid-cols-2">
              {/* Psychological Dynamics Chart */}
              <div className="rounded-xl border border-neutral-500/30 bg-white p-5">
                <p className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-4 flex items-center gap-1.5">
                  Audience Psychological Dynamics
                </p>
                <div className="space-y-4">
                  {[
                    { key: 'curiosity', label: 'Curiosity & Interest', val: ideasData.sentiment_distribution?.curiosity || 30 },
                    { key: 'appreciation', label: 'Appreciation & Support', val: ideasData.sentiment_distribution?.appreciation || 30 },
                    { key: 'frustration', label: 'Frustration & Pain Points', val: ideasData.sentiment_distribution?.frustration || 20 },
                    { key: 'confusion', label: 'Confusion & Questions', val: ideasData.sentiment_distribution?.confusion || 20 },
                  ].map((item) => (
                    <div key={item.key} className="space-y-1">
                      <div className="flex items-center justify-between text-xs font-medium">
                        <span className="text-neutral-600">{item.label}</span>
                        <span className="px-2 py-0.5 rounded-full font-bold text-black bg-neutral-100">
                          {item.val}%
                        </span>
                      </div>
                      <div className="h-2.5 w-full rounded-full bg-neutral-100">
                        <div
                          className="h-2.5 rounded-full transition-all duration-500 bg-black"
                          style={{ width: `${item.val}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Mindset Summary */}
              {ideasData.audience_mindset_summary && (
                <div className="rounded-xl bg-neutral-50 border border-neutral-500/30 p-5 flex flex-col justify-between">
                  <div>
                    <p className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">
                      Audience Mood & Mindset Summary
                    </p>
                    <p className="text-sm text-black font-medium leading-relaxed">{ideasData.audience_mindset_summary}</p>
                  </div>
                  <div className="mt-4 bg-white border border-neutral-500/30 rounded-xl p-3 text-[11px] text-neutral-600 leading-relaxed font-medium">
                    <span className="font-bold text-black block mb-0.5">Strategy Tip:</span>
                    Priority should be given to creating content for categories with high Curiosity and Frustration scores, as these trigger the strongest click intent.
                  </div>
                </div>
              )}
            </div>

            {/* Title for suggestions */}
            <div className="pt-2">
              <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-2">🎯 Recommended Video Blueprints</h3>
            </div>

            {/* Ideas Grid */}
            <div className="grid gap-4 md:grid-cols-3">
              {(ideasData.ideas || []).map((idea, idx) => (
                <div key={idx} className="rounded-xl border border-neutral-500/30 bg-white p-4 flex flex-col justify-between hover:border-neutral-400 transition-all duration-200">
                  <div className="space-y-3">
                    <div className="inline-flex items-center gap-1 bg-neutral-100 text-black font-semibold px-2.5 py-1 rounded-lg text-[10px] uppercase tracking-wide">
                      <span className="w-1.5 h-1.5 rounded-full bg-black" />
                      {idea.psychological_need}
                    </div>

                    <div>
                      <h4 className="text-sm font-bold text-black leading-snug line-clamp-2">{idea.title}</h4>
                      <p className="text-[12px] text-neutral-500 mt-1.5 leading-relaxed line-clamp-3">{idea.concept}</p>
                    </div>
                  </div>

                  <div className="mt-4 pt-3.5 border-t border-neutral-200">
                    <p className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider mb-1">Psychological Trigger</p>
                    <p className="text-xs text-neutral-600 italic leading-relaxed">"{idea.psychological_analysis}"</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Main 2-col grid */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">

        {/* LEFT */}
        <div className="space-y-5">

          {/* Latest Video */}
          <div className="border flex flex-col border-neutral-500/30 rounded-xl overflow-hidden">
            <SectionHeader className="text-black font-bold" title="Latest video performance" />
            <Divider />
            {latestVideo ? (
              <div className="p-2 w-full">
                <div className="mb-4">
                  <a
                    href={`https://youtube.com/watch?v=${latestVideo.video_id}`}
                    target="_blank" rel="noreferrer"
                    className="group block"
                  >
                    <div className="relative mb-3">
                      <img src={latestVideo.thumbnail} alt=""
                        className="w-full h-[315px] rounded-xl object-cover bg-neutral-800" />
                      <span className="absolute bottom-2 right-2 bg-black/80 text-black text-xs px-1.5 py-0.5 rounded font-mono">
                        {parseDuration(latestVideo.duration)}
                      </span>
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/25 transition-colors rounded-xl flex items-center justify-center">
                        <Play size={24} className="text-black opacity-0 group-hover:opacity-100 transition-opacity" fill="white" />
                      </div>
                    </div>
                    <p className="font-semibold leading-snug line-clamp-2 text-black group-hover:text-black transition-colors">
                      {latestVideo.title}
                    </p>
                  </a>
                  <p className="text-sm text-black mt-1.5">{timeAgo(latestVideo.published_at)}</p>
                </div>

                <div className="flex items-center justify-between gap-2 mb-5 rounded-xl bg-neutral-50 px-3 py-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-neutral-500">Performance stats</span>
                    <button 
                      onClick={() => handleDiagnose(latestVideo.video_id)}
                      className="flex items-center gap-1 bg-black hover:bg-neutral-800 text-white rounded-lg px-2.5 py-1 text-[11px] font-bold shadow-sm transition cursor-pointer"
                    >
                      <Sparkles size={10} />
                      AI Optimize
                    </button>
                  </div>
                  <div className="flex items-center gap-3">
                    {[
                      { icon: Eye, value: fmt(latestVideo.view_count) },
                      { icon: ThumbsUp, value: fmt(latestVideo.like_count) },
                      { icon: MessageSquare, value: fmt(latestVideo.comment_count) },
                    ].map((s, index) => (
                      <div key={index} className="flex items-center gap-1.5">
                        <s.icon size={15} className="text-black" />
                        <span className="text-sm font-semibold text-black">{s.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <Divider />
                <div className="flex items-center justify-between gap-3 mt-5 rounded-xl bg-neutral-50 px-3 py-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-black">
                      {latestVideo.view_count > 0
                        ? ((latestVideo.like_count / latestVideo.view_count) * 100).toFixed(1) + '%'
                        : '—'}
                    </span>
                    <span className="text-xs text-neutral-500">Like / View Rate</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-black">{parseDuration(latestVideo.duration)}</span>
                    <span className="text-xs text-neutral-500">Video Duration</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-10 text-center text-neutral-500">No videos found</div>
            )}
          </div>

          {/* Channel Analytics */}
          <div className="border border-neutral-500/30 rounded-2xl overflow-hidden bg-white">
            <SectionHeader title="Channel analytics" />
            <Divider />

            <div className="px-6 py-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-neutral-500 mb-1">Current subscribers</p>
                  <p className="text-4xl font-bold tracking-tight text-black">{fmt(stats.subscribers)}</p>
                </div>
                <div className="rounded-2xl bg-neutral-50 px-4 py-3 text-right">
                  <p className="text-xs text-neutral-500">Avg views / video</p>
                  <p className="text-lg font-semibold text-black">{fmt(Math.round(stats.total_views / (stats.total_videos || 1)))}</p>
                </div>
              </div>
            </div>

            <Divider />

            <div className="px-6 py-5">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-semibold text-black">Summary · All time</p>
                <span className="text-xs text-neutral-500">Updated today</span>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'Views', value: fmt(stats.total_views) },
                  { label: 'Videos', value: fmt(stats.total_videos) },
                  { label: 'Likes', value: fmt(Math.round(stats.total_views / 10)) },
                ].map(row => (
                  <div key={row.label} className="rounded-xl bg-neutral-50 p-3 text-center">
                    <p className="text-lg font-semibold text-black">{row.value}</p>
                    <p className="text-xs text-neutral-500 mt-1">{row.label}</p>
                  </div>
                ))}
              </div>
            </div>

            <Divider />

            <div className="px-6 py-5">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-semibold text-black">Top content · Views</p>
                <span className="text-xs text-neutral-500">Top 3</span>
              </div>
              <div className="space-y-3">
                {topContent?.slice(0, 3).map(v => (
                  <div key={v.video_id} className="flex items-center gap-3 rounded-xl border border-neutral-200 p-2 hover:bg-neutral-50 transition-colors">
                    <img src={v.thumbnail} alt="" className="w-16 h-10 rounded-lg object-cover bg-neutral-800 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-black truncate">{v.title}</p>
                    </div>
                    <span className="text-sm font-semibold text-black shrink-0">{fmt(v.view_count)}</span>
                  </div>
                ))}
              </div>
            </div>

            <Divider />

            <div className="px-6 py-4">
              <a href="https://studio.youtube.com" target="_blank" rel="noreferrer"
                className="flex items-center justify-center gap-2 rounded-xl border border-neutral-200 px-4 py-3 text-sm font-medium text-black hover:bg-neutral-50 transition-colors">
                Go to YouTube Studio <ChevronRight size={14} />
              </a>
            </div>
          </div>
        </div>

        {/* RIGHT */}
        <div className="space-y-5">

          {/* Recent Videos */}
          <div className="border border-neutral-500/30 rounded-2xl overflow-hidden bg-white">
            <SectionHeader title="Recent videos" linkText="View all" />
            <Divider />
            <div className="grid grid-cols-2 gap-3 p-4">
              <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-5 hover:bg-neutral-100 transition-colors">
                <div className="flex flex-col items-center text-center">
                 
                  <span className="text-sm border border-neutral-500/40 py-2 px-5 rounded-xl font-semibold text-black">Upload new video</span>
                   <div className="flex h-14 w-14 items-center justify-center rounded-2xl   text-white mb-3">
                    <MdOutlineFileUpload size={45} className="text-black -3xl" />
                  </div>
                  <p className="text-xs text-neutral-500 leading-relaxed mt-1">Share a fresh upload and keep your latest content visible.</p>
                </div>
              </div>
              <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-5 hover:bg-neutral-100 transition-colors">
                <div className="flex flex-col items-center text-center">
                  <span className="text-sm border border-neutral-500/40 py-2 px-5 rounded-xl font-semibold text-black">Create post</span>
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl text-white mb-3">
                    <MdOutlineCreate size={45} className="text-black" />
                  </div>
                  <p className="text-xs text-neutral-500 leading-relaxed mt-1">Post an update, teaser, or announcement to engage your audience.</p>
                </div>
              </div>
            </div>
            <Divider />
            <div className="py-2">
              {recent_videos?.slice(0, 7).map(v => (
                <a key={v.video_id}
                  href={`https://youtube.com/watch?v=${v.video_id}`}
                  target="_blank" rel="noreferrer"
                  className="flex items-center gap-3 px-4 py-3 hover:bg-neutral-50 transition-colors group"
                >
                  <div className="relative shrink-0">
                    <img src={v.thumbnail} alt="" className="w-24 h-[54px] rounded-lg object-cover bg-neutral-800" />
                    <span className="absolute bottom-1 right-1 bg-black/80 text-[10px] px-1 rounded font-mono text-white">
                      {parseDuration(v.duration)}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate text-black group-hover:text-black transition-colors">{v.title}</p>
                    <div className="flex items-center gap-3 mt-1 text-xs text-neutral-500 justify-between">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1"><Eye size={11} />{fmt(v.view_count)}</span>
                        <span className="flex items-center gap-1"><ThumbsUp size={11} />{fmt(v.like_count)}</span>
                      </div>
                      <button 
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleDiagnose(v.video_id); }}
                        className="bg-neutral-105 hover:bg-black hover:text-white border border-neutral-200 rounded-lg px-2 py-0.5 text-[10px] font-bold tracking-wide uppercase transition duration-150 flex items-center gap-0.5 cursor-pointer z-10"
                      >
                        <Sparkles size={8} /> Optimize
                      </button>
                    </div>
                  </div>
                  <span className="text-xs text-neutral-500 shrink-0">{timeAgo(v.published_at)}</span>
                </a>
              ))}
            </div>
          </div>

          {/* Subscriptions */}
          {subscriptions?.length > 0 && (
            <div className="border border-neutral-500/30 rounded-2xl overflow-hidden bg-white">
              <SectionHeader title="Channels you follow" linkText="See all" />
              <Divider />
              <div className="py-2">
                {subscriptions.slice(0, 6).map(s => (
                  <div key={s.subscription_id}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-neutral-50 transition-colors">
                    <img src={s.channel_thumbnail} alt="" className="w-10 h-10 rounded-full bg-neutral-800 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate text-black">{s.channel_title}</p>
                      {s.new_item_count > 0 && (
                        <p className="text-xs text-neutral-500">{s.new_item_count} new videos</p>
                      )}
                    </div>
                    {s.new_item_count > 0 && <span className="w-2 h-2 bg-black rounded-full shrink-0" />}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Channel Overview */}
          <div className="border border-neutral-500/30 rounded-2xl overflow-hidden bg-white">
            <SectionHeader title="Channel overview" />
            <Divider />
            <div className="p-6">
              <div className="flex items-center gap-4 mb-5">
                <img src={channel.profile_picture} alt="" className="w-14 h-14 rounded-full border border-neutral-200" />
                <div>
                  <p className="text-base font-semibold text-black">{channel.title}</p>
                  <p className="text-sm text-neutral-500">{channel.custom_url}</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'Subscribers', value: fmt(stats.subscribers) },
                  { label: 'Total Views', value: fmt(stats.total_views) },
                  { label: 'Videos', value: fmt(stats.total_videos) },
                ].map(s => (
                  <div key={s.label} className="rounded-xl bg-neutral-50 p-3 text-center">
                    <p className="text-lg font-semibold text-black">{s.value}</p>
                    <p className="text-[11px] text-neutral-500 mt-1">{s.label}</p>
                  </div>
                ))}
              </div>
              {channel.description && (
                <p className="text-sm text-neutral-500 mt-4 line-clamp-2 leading-relaxed">{channel.description}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content Calendar + Best Upload Day */}
      {(() => {
        const allVids = [...(recent_videos || []), ...(top_viewed_videos || [])]
        const unique = allVids.filter((v, i, a) => a.findIndex(x => x.video_id === v.video_id) === i)
        const { weeks, streakCount } = getUploadConsistency(unique)
        const dayAvgs = getBestUploadDay(unique)
        const maxAvg = Math.max(...(dayAvgs?.map(d => d.avg) || [1]), 1)
        const bestDayIdx = dayAvgs?.reduce((best, cur) => cur.avg > best.avg ? cur : best, dayAvgs[0])?.day

        return (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">

            {/* Content Calendar */}
            <div className="border border-neutral-500/30 rounded-2xl overflow-hidden bg-white">
              <div className="flex items-center gap-2.5 px-6 pt-5 pb-4">
                <CalendarDays size={18} className="text-black" />
                <h3 className="text-black font-semibold">Upload Consistency</h3>
                <span className="ml-auto text-xs text-neutral-500">
                  🔥 {streakCount} week{streakCount !== 1 ? 's' : ''} streak
                </span>
              </div>
              <Divider />
              <div className="p-5">
                {/* Day labels */}
                <div className="grid grid-cols-7 mb-2">
                  {DAYS.map(d => (
                    <div key={d} className="text-center text-[10px] text-neutral-400 font-medium">{d}</div>
                  ))}
                </div>
                {/* Heatmap grid */}
                <div className="space-y-1.5">
                  {weeks.map((week, wi) => (
                    <div key={wi} className="grid grid-cols-7 gap-1">
                      {week.map((day, di) => (
                        <div
                          key={di}
                          title={day.date}
                          className={`h-7 rounded-md transition-colors ${
                            day.uploaded
                              ? 'bg-black'
                              : 'bg-neutral-100 hover:bg-neutral-200'
                          }`}
                        />
                      ))}
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-between mt-4">
                  <p className="text-xs text-neutral-400">Last 12 weeks · Each cell = 1 day</p>
                  <div className="flex items-center gap-2 text-[10px] text-neutral-400">
                    <span className="w-3 h-3 rounded-sm bg-neutral-100 inline-block" /> No upload
                    <span className="w-3 h-3 rounded-sm bg-black inline-block" /> Uploaded
                  </div>
                </div>
              </div>
            </div>

            {/* Best Upload Day */}
            <div className="border border-neutral-500/30 rounded-2xl overflow-hidden bg-white">
              <div className="flex items-center gap-2.5 px-6 pt-5 pb-4">
                <Trophy size={18} className="text-black" />
                <h3 className="text-black font-semibold">Best Day to Upload</h3>
                {bestDayIdx !== undefined && (
                  <span className="ml-auto text-xs font-semibold bg-black text-white px-2.5 py-1 rounded-full">
                    🏆 {DAYS_FULL[bestDayIdx]}
                  </span>
                )}
              </div>
              <Divider />
              <div className="p-5">
                <p className="text-xs text-neutral-500 mb-4">Average views per video by day of upload</p>
                <div className="space-y-2.5">
                  {dayAvgs?.map(({ day, avg, count }) => {
                    const pct = maxAvg > 0 ? Math.round((avg / maxAvg) * 100) : 0
                    const isBest = day === bestDayIdx
                    return (
                      <div key={day} className="flex items-center gap-3">
                        <span className={`text-xs font-semibold w-8 shrink-0 ${
                          isBest ? 'text-black' : 'text-neutral-400'
                        }`}>{DAYS[day]}</span>
                        <div className="flex-1 h-6 bg-neutral-100 rounded-lg overflow-hidden">
                          <div
                            className={`h-full rounded-lg transition-all duration-500 ${
                              isBest ? 'bg-black' : 'bg-neutral-300'
                            }`}
                            style={{ width: count === 0 ? '0%' : `${Math.max(pct, 4)}%` }}
                          />
                        </div>
                        <div className="text-right w-20 shrink-0">
                          <span className={`text-xs font-bold ${
                            isBest ? 'text-black' : 'text-neutral-500'
                          }`}>{count === 0 ? '—' : fmt(avg)}</span>
                          <span className="text-[10px] text-neutral-400 ml-1">avg</span>
                        </div>
                        <span className="text-[10px] text-neutral-400 w-8 text-right shrink-0">{count}v</span>
                      </div>
                    )
                  })}
                </div>
                {bestDayIdx !== undefined && (
                  <div className="mt-4 rounded-xl bg-neutral-50 border border-neutral-200 px-4 py-3">
                    <p className="text-xs text-neutral-600">
                      💡 Videos uploaded on <span className="font-bold text-black">{DAYS_FULL[bestDayIdx]}</span> get the highest average views. Try scheduling your next upload on this day.
                    </p>
                  </div>
                )}
              </div>
            </div>

          </div>
        )
      })()}

      {/* Top Performing - Full Width Table */}
      <div className="border border-neutral-500/30 rounded-2xl overflow-hidden bg-white">
        <SectionHeader title="Top performing videos" />
        <Divider />
        <table className="w-full">
          <thead>
            <tr className="border-b border-neutral-200">
              <th className="text-left text-xs text-neutral-500 font-medium px-6 py-3 uppercase tracking-wider">Video</th>
              <th className="text-right text-xs text-neutral-500 font-medium px-5 py-3 uppercase tracking-wider">Views</th>
              <th className="text-right text-xs text-neutral-500 font-medium px-5 py-3 uppercase tracking-wider hidden lg:table-cell">Likes</th>
              <th className="text-right text-xs text-neutral-500 font-medium px-5 py-3 uppercase tracking-wider hidden xl:table-cell">Comments</th>
              <th className="text-right text-xs text-neutral-500 font-medium px-6 py-3 uppercase tracking-wider hidden xl:table-cell">Published</th>
            </tr>
          </thead>
          <tbody>
            {top_viewed_videos?.slice(0, 8).map(v => (
              <tr key={v.video_id} className="border-b border-neutral-200/60 hover:bg-neutral-50 transition-colors group">
                <td className="px-6 py-4">
                  <a href={`https://youtube.com/watch?v=${v.video_id}`} target="_blank" rel="noreferrer"
                    className="flex items-center gap-4">
                    <div className="relative shrink-0">
                      <img src={v.thumbnail} alt="" className="w-24 h-[54px] rounded-xl object-cover bg-neutral-800" />
                      <span className="absolute bottom-1 right-1 bg-black/80 text-[10px] px-1 rounded font-mono text-white">
                        {parseDuration(v.duration)}
                      </span>
                    </div>
                    <div className="flex flex-col items-start gap-1 max-w-sm">
                      <p className="text-sm font-medium line-clamp-2 group-hover:text-black transition-colors text-black">{v.title}</p>
                      <button 
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleDiagnose(v.video_id); }}
                        className="bg-neutral-105 hover:bg-black hover:text-white border border-neutral-200 rounded-lg px-2 py-0.5 text-[10px] font-bold tracking-wide uppercase transition duration-150 flex items-center gap-0.5 cursor-pointer"
                      >
                        <Sparkles size={8} /> AI Diagnose
                      </button>
                    </div>
                  </a>
                </td>
                <td className="px-5 py-4 text-right">
                  <span className="text-base font-semibold text-black">{fmt(v.view_count)}</span>
                </td>
                <td className="px-5 py-4 text-right hidden lg:table-cell">
                  <span className="text-base font-semibold text-black">{fmt(v.like_count)}</span>
                </td>
                <td className="px-5 py-4 text-right hidden xl:table-cell">
                  <span className="text-base font-semibold text-black">{fmt(v.comment_count)}</span>
                </td>
                <td className="px-6 py-4 text-right hidden xl:table-cell">
                  <span className="text-sm text-neutral-500">{timeAgo(v.published_at)}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* AI Video Diagnostics Overlay/Drawer */}
      {diagVideoId && (
        <div className="fixed inset-0 bg-black/50 z-50 flex justify-end">
          {/* Backdrop click to close */}
          <div className="absolute inset-0" onClick={() => setDiagVideoId(null)} />
          
          {/* Drawer content */}
          <div className="relative w-full max-w-lg bg-white h-full shadow-2xl p-6 flex flex-col justify-between z-10 text-black overflow-y-auto">
            
            <div>
              {/* Header */}
              <div className="flex items-center justify-between border-b border-neutral-100 pb-4 mb-4 shrink-0">
                <div className="flex items-center gap-2">
                  <Sparkles size={18} className="text-black" />
                  <h3 className="font-bold text-base text-black">AI Video Diagnostics & Optimizer</h3>
                </div>
                <button 
                  onClick={() => setDiagVideoId(null)}
                  className="text-neutral-450 hover:text-black font-semibold text-lg cursor-pointer"
                >
                  &times;
                </button>
              </div>

              {diagLoading && (
                <div className="flex flex-col items-center justify-center py-20 gap-3">
                  <Loader2 className="animate-spin text-neutral-400" size={28} />
                  <p className="text-xs text-neutral-500 font-medium">Analyzing video SEO parameters, titles, meta tags, and high-retention remedy scripts...</p>
                </div>
              )}

              {!diagLoading && diagData && (
                <div className="space-y-5">
                  {/* Score */}
                  <div className="flex items-center justify-between bg-neutral-50 border border-neutral-200 rounded-xl p-4">
                    <div className="flex-1 pr-3">
                      <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider mb-0.5">SEO Health Rating</p>
                      <p className="text-xs text-neutral-600 leading-relaxed font-semibold">{diagData.verdict}</p>
                    </div>
                    <div className="flex items-center justify-center h-14 w-14 rounded-full border-4 border-neutral-200 bg-white shrink-0">
                      <span className="text-sm font-bold text-black">{diagData.score}<span className="text-[10px] text-neutral-400">/100</span></span>
                    </div>
                  </div>

                  {/* Diagnostics Critiques */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Diagnostic Analysis</h4>
                    
                    <div className="space-y-2.5">
                      {[
                        { title: 'Title Optimization', detail: diagData.diagnostics?.title_critique },
                        { title: 'Description & SEO Keywords', detail: diagData.diagnostics?.description_critique },
                        { title: 'Tags Relevance', detail: diagData.diagnostics?.tags_critique },
                      ].map((item, idx) => (
                        <div key={idx} className="bg-neutral-50 border border-neutral-200 rounded-xl p-3.5 text-xs">
                          <p className="font-bold text-black mb-1">{item.title}</p>
                          <p className="text-neutral-600 leading-relaxed">{item.detail}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* AI Suggestions (Copyable) */}
                  <div className="space-y-3 pt-2">
                    <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Optimized Recommendations</h4>
                    
                    {/* Suggested Titles */}
                    <div className="space-y-1.5">
                      <p className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider">Click to Copy Title Options</p>
                      {(diagData.suggestions?.titles || []).map((t, idx) => (
                        <button
                          key={idx}
                          onClick={() => {
                            navigator.clipboard.writeText(t);
                            alert('Title copied to clipboard!');
                          }}
                          className="w-full text-left bg-neutral-50 hover:bg-neutral-100 border border-neutral-500/30 hover:border-neutral-400 rounded-xl p-3 text-xs font-medium transition text-black flex items-center justify-between cursor-pointer"
                        >
                          <span>{t}</span>
                          <span className="text-[9px] bg-neutral-200 text-black font-semibold px-2 py-0.5 rounded-full shrink-0">Copy</span>
                        </button>
                      ))}
                    </div>

                    {/* Suggested Tags */}
                    {diagData.suggestions?.tags?.length > 0 && (
                      <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-3.5">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider">Recommended Tags</p>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(diagData.suggestions.tags.join(', '));
                              alert('Tags copied to clipboard!');
                            }}
                            className="text-[9px] bg-black text-white hover:bg-neutral-800 font-semibold px-2 py-1 rounded-lg transition cursor-pointer"
                          >
                            Copy All
                          </button>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {diagData.suggestions.tags.map((tag) => (
                            <span key={tag} className="bg-white border border-neutral-200 text-neutral-700 text-[10px] px-2 py-0.5 rounded-full font-medium">
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* High Retention Hook */}
                    {diagData.suggestions?.hook_remedy && (
                      <div className="bg-neutral-900 text-neutral-100 rounded-2xl p-4 border border-neutral-800 space-y-2">
                        <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
                          <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">AI High-Retention Intro Script Hook</p>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(diagData.suggestions.hook_remedy);
                              alert('Hook script copied!');
                            }}
                            className="text-[9px] bg-neutral-800 hover:bg-neutral-700 text-white font-semibold px-2 py-1 rounded-lg border border-neutral-700 transition cursor-pointer"
                          >
                            Copy Hook
                          </button>
                        </div>
                        <p className="text-xs text-neutral-300 whitespace-pre-wrap leading-relaxed italic">
                          "{diagData.suggestions.hook_remedy}"
                        </p>
                      </div>
                    )}
                  </div>

                </div>
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-neutral-100 pt-4 mt-6 shrink-0 flex gap-2">
              <button 
                onClick={() => setDiagVideoId(null)}
                className="flex-1 border border-neutral-200 hover:bg-neutral-50 text-black text-xs font-semibold py-2.5 rounded-xl transition cursor-pointer"
              >
                Close Diagnostic
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  )
}
