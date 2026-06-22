import { useEffect, useState, useCallback } from 'react'
import { getVideoDetail, analyzeComments, analyzeAudienceMood, postReply } from '../../lib/api'
import {
  ArrowLeft, Eye, ThumbsUp, MessageSquare, Clock,
  ExternalLink, Play, TrendingUp, Monitor, Smartphone,
  Tv, Tablet, BarChart3, Users, Share2, ThumbsDown,
  Loader2, Send, Sparkles, Brain, AlertTriangle, CheckCircle2
} from 'lucide-react'

function fmt(n) {
  if (!n) return '0'
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M'
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K'
  return String(n)
}

function parseDuration(iso) {
  if (!iso) return '0:00'
  const m = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/)
  const h = parseInt(m?.[1] || 0), min = parseInt(m?.[2] || 0), s = parseInt(m?.[3] || 0)
  if (h > 0) return `${h}:${String(min).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  return `${min}:${String(s).padStart(2, '0')}`
}

function timeAgo(dateStr) {
  const diff = (Date.now() - new Date(dateStr)) / 1000
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  if (diff < 2592000) return `${Math.floor(diff / 86400)}d ago`
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

// Pure CSS line chart - no library
function ViewsLineChart({ data }) {
  if (!data?.length) return <div className="h-48 flex items-center justify-center text-sm text-neutral-400">No chart data available</div>

  const views = data.map(d => d.views)
  const maxV = Math.max(...views, 1)
  const W = 100, H = 100
  const pts = data.map((d, i) => {
    const x = (i / (data.length - 1)) * W
    const y = H - (d.views / maxV) * H
    return `${x},${y}`
  }).join(' ')

  // Show ~6 date labels
  const step = Math.max(1, Math.floor(data.length / 6))
  const labels = data.filter((_, i) => i % step === 0 || i === data.length - 1)

  return (
    <div className="w-full">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-48" preserveAspectRatio="none">
        {/* Grid lines */}
        {[0.25, 0.5, 0.75, 1].map(t => (
          <line key={t} x1="0" y1={H * (1 - t)} x2={W} y2={H * (1 - t)} stroke="#f1f5f9" strokeWidth="0.5" />
        ))}
        {/* Area fill */}
        <polygon
          points={`0,${H} ${pts} ${W},${H}`}
          fill="url(#grad)"
          opacity="0.15"
        />
        <defs>
          <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#000" />
            <stop offset="100%" stopColor="#000" stopOpacity="0" />
          </linearGradient>
        </defs>
        {/* Line */}
        <polyline points={pts} fill="none" stroke="#000" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        {/* Dots on hover - show last point */}
        <circle cx={(data.length - 1) / (data.length - 1) * W} cy={H - (views[views.length - 1] / maxV) * H} r="2" fill="#000" />
      </svg>
      {/* X labels */}
      <div className="flex justify-between mt-1">
        {labels.map(d => (
          <span key={d.date} className="text-[10px] text-neutral-400">
            {new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </span>
        ))}
      </div>
    </div>
  )
}

// Horizontal bar chart
function HBarChart({ items, valueKey, labelKey, colorClass = 'bg-black' }) {
  if (!items?.length) return <p className="text-sm text-neutral-400">No data</p>
  const max = Math.max(...items.map(i => i[valueKey]), 1)
  return (
    <div className="space-y-3">
      {items.map((item, i) => (
        <div key={i}>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-neutral-600 truncate max-w-[60%]">{item[labelKey]}</span>
            <span className="text-neutral-500 text-xs">{item.percent !== undefined ? `${item.percent}%` : fmt(item[valueKey])}</span>
          </div>
          <div className="h-2 rounded-full bg-neutral-100">
            <div
              className={`h-2 rounded-full ${colorClass} transition-all`}
              style={{ width: `${Math.max((item[valueKey] / max) * 100, 3)}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}

const deviceIcon = (d) => {
  const name = d?.toLowerCase() || ''
  if (name.includes('mobile') || name.includes('phone')) return <Smartphone size={14} />
  if (name.includes('desktop') || name.includes('computer')) return <Monitor size={14} />
  if (name.includes('tv') || name.includes('television')) return <Tv size={14} />
  if (name.includes('tablet')) return <Tablet size={14} />
  return <Monitor size={14} />
}

const sentimentColor = {
  positive: 'text-green-600 bg-green-50 border-green-200',
  negative: 'text-red-600 bg-red-50 border-red-200',
  question: 'text-blue-600 bg-blue-50 border-blue-200',
  angry: 'text-orange-600 bg-orange-50 border-orange-200',
  neutral: 'text-neutral-600 bg-neutral-50 border-neutral-200',
}

const priorityBadge = {
  high: 'bg-red-100 text-red-700 border-red-200',
  medium: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  low: 'bg-neutral-100 text-neutral-600 border-neutral-200',
}

const moodEmoji = { positive: '😊', negative: '😞', mixed: '😐', neutral: '😶' }

function engagementScore(video) {
  if (!video?.view_count) return { score: 0, label: 'No data', tips: [] }
  const likeRate = (video.like_count / video.view_count) * 100
  const commentRate = (video.comment_count / video.view_count) * 100
  let score = Math.min(100, Math.round(likeRate * 15 + commentRate * 50 + Math.min(video.view_count / 10000, 20)))
  const tips = []
  if (likeRate < 2) tips.push('Like ratio low — stronger CTA ya better thumbnail try karo')
  if (commentRate < 0.1) tips.push('Comments kam hain — video end mein question pucho')
  if (likeRate >= 4) tips.push('Strong like ratio — is format ko repeat karo')
  const label = score >= 75 ? 'Excellent' : score >= 50 ? 'Good' : score >= 30 ? 'Average' : 'Needs Work'
  return { score, label, likeRate: likeRate.toFixed(2), commentRate: commentRate.toFixed(3), tips }
}

export default function VideoDetailPage({ video: initialVideo, creatorId, onBack }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')

  // AI Comments state
  const [aiComments, setAiComments] = useState([])
  const [audienceSummary, setAudienceSummary] = useState(null)
  const [commentsLoading, setCommentsLoading] = useState(false)
  const [commentsAnalyzed, setCommentsAnalyzed] = useState(false)
  const [replies, setReplies] = useState({})
  const [posting, setPosting] = useState({})
  const [posted, setPosted] = useState({})
  const [commentFilter, setCommentFilter] = useState('all')

  useEffect(() => {
    setLoading(true)
    getVideoDetail({ creator_id: creatorId, video_id: initialVideo.video_id })
      .then(r => setData(r.data))
      .catch(() => setData(null))
      .finally(() => setLoading(false))
  }, [initialVideo.video_id, creatorId])

  const loadAIComments = useCallback(async () => {
    setCommentsLoading(true)
    try {
      const [analyzeRes, moodRes] = await Promise.all([
        analyzeComments({ creator_id: creatorId, video_id: initialVideo.video_id, max_comments: 40 }),
        analyzeAudienceMood({ creator_id: creatorId, video_id: initialVideo.video_id, max_comments: 80 }),
      ])
      const enriched = analyzeRes.data.comments || []
      setAiComments(enriched)
      setAudienceSummary(moodRes.data.analysis)
      const drafts = {}
      enriched.forEach(c => { drafts[c.comment_id] = c.draft_reply })
      setReplies(drafts)
      setCommentsAnalyzed(true)
    } catch (e) {
      alert(e.response?.data?.error || 'Failed to analyze comments')
    } finally {
      setCommentsLoading(false)
    }
  }, [creatorId, initialVideo.video_id])

  useEffect(() => {
    if (activeTab === 'comments' && !commentsAnalyzed && !commentsLoading) {
      loadAIComments()
    }
  }, [activeTab, commentsAnalyzed, commentsLoading, loadAIComments])

  async function handlePost(comment_id) {
    if (!replies[comment_id]?.trim()) return
    setPosting(p => ({ ...p, [comment_id]: true }))
    try {
      await postReply({ creator_id: creatorId, comment_id, reply_text: replies[comment_id] })
      setPosted(p => ({ ...p, [comment_id]: true }))
    } catch (e) {
      alert(e.response?.data?.error || 'Error posting reply')
    } finally {
      setPosting(p => ({ ...p, [comment_id]: false }))
    }
  }

  const video = data?.video || initialVideo
  const dur = parseDuration(video.duration)
  const likeRatio = video.view_count > 0 ? ((video.like_count / video.view_count) * 100).toFixed(1) : 0
  const chart = data?.chart || []
  const traffic = data?.traffic_sources || []
  const devices = data?.devices || []
  const comments = data?.top_comments || []

  const totalWatchMin = chart.reduce((s, d) => s + (d.watch_minutes || 0), 0)
  const engagement = engagementScore(video)

  const filteredComments = aiComments.filter(c => {
    if (commentFilter === 'all') return true
    if (commentFilter === 'high') return c.priority === 'high'
    return c.sentiment === commentFilter
  })

  const tabs = ['overview', 'chart', 'comments', 'details']

  return (
    <div className="space-y-5 pb-10">
      {/* Back + Header */}
      <div className="mt-10 rounded-2xl border border-neutral-500/30 bg-white p-6">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-sm text-neutral-500 hover:text-black transition-colors mb-4"
        >
          <ArrowLeft size={16} /> Back to Content
        </button>

        <div className="flex flex-col sm:flex-row gap-5">
          {/* Thumbnail */}
          <div className="relative shrink-0 group">
            <img
              src={video.thumbnail}
              alt={video.title}
              className="w-48 h-28 object-cover rounded-xl bg-neutral-100"
            />
            <a
              href={`https://www.youtube.com/watch?v=${video.video_id}`}
              target="_blank"
              rel="noreferrer"
              className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl"
            >
              <div className="bg-white rounded-full p-2.5 shadow-lg">
                <Play size={18} className="text-black ml-0.5" />
              </div>
            </a>
            <span className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-1.5 py-0.5 rounded font-medium">{dur}</span>
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full capitalize ${
                video.privacy_status === 'public' ? 'bg-green-100 text-green-700' :
                video.privacy_status === 'private' ? 'bg-red-100 text-red-700' :
                'bg-yellow-100 text-yellow-700'
              }`}>{video.privacy_status}</span>
              {video.made_for_kids && <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">Made for kids</span>}
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-600 uppercase">{video.definition || 'HD'}</span>
            </div>
            <h1 className="text-xl font-semibold text-black leading-snug">{video.title}</h1>
            <p className="text-sm text-neutral-500 mt-1">
              Published {new Date(video.published_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
              {data?.period && <span className="ml-2 text-neutral-400">· Analytics: {data.period.label}</span>}
            </p>
            <a
              href={`https://www.youtube.com/watch?v=${video.video_id}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 mt-2 text-xs text-neutral-400 hover:text-black transition-colors"
            >
              <ExternalLink size={12} /> youtube.com/watch?v={video.video_id}
            </a>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {[
          { label: 'Total Views', value: fmt(video.view_count), sub: 'All time', icon: Eye, color: 'text-blue-600 bg-blue-50' },
          { label: 'Likes', value: fmt(video.like_count), sub: `${likeRatio}% like ratio`, icon: ThumbsUp, color: 'text-green-600 bg-green-50' },
          { label: 'Comments', value: fmt(video.comment_count), sub: 'Total comments', icon: MessageSquare, color: 'text-purple-600 bg-purple-50' },
          { label: 'Watch Time', value: `${(totalWatchMin / 60).toFixed(1)}h`, sub: 'Last 90 days', icon: Clock, color: 'text-orange-600 bg-orange-50' },
        ].map(s => (
          <div key={s.label} className="rounded-2xl border border-neutral-500/30 bg-white p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-neutral-500">{s.label}</p>
              <div className={`p-2 rounded-xl ${s.color}`}><s.icon size={15} /></div>
            </div>
            <p className="text-3xl font-semibold text-black">{s.value}</p>
            <p className="text-xs text-neutral-400 mt-1">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-neutral-200">
        {tabs.map(t => (
          <button
            key={t}
            onClick={() => setActiveTab(t)}
            className={`px-4 py-2.5 text-sm font-medium capitalize transition-colors border-b-2 -mb-px ${
              activeTab === t
                ? 'border-black text-black'
                : 'border-transparent text-neutral-500 hover:text-black'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex h-48 items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-neutral-300 border-t-black" />
            <p className="text-sm text-neutral-500">Loading video analytics...</p>
          </div>
        </div>
      ) : (
        <>
          {/* OVERVIEW TAB */}
          {activeTab === 'overview' && (
            <div className="space-y-5">
              {/* AI Engagement Score */}
              <div className="rounded-2xl border border-neutral-500/30 bg-white p-5">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-sm font-semibold text-black flex items-center gap-2">
                      <Sparkles size={16} /> AI Performance Score
                    </p>
                    <p className="text-xs text-neutral-500">Engagement analysis based on your metrics</p>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-bold text-black">{engagement.score}</p>
                    <p className="text-xs text-neutral-500">{engagement.label}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div className="rounded-xl bg-neutral-50 p-3">
                    <p className="text-xs text-neutral-500">Like Rate</p>
                    <p className="text-lg font-semibold text-black">{engagement.likeRate}%</p>
                  </div>
                  <div className="rounded-xl bg-neutral-50 p-3">
                    <p className="text-xs text-neutral-500">Comment Rate</p>
                    <p className="text-lg font-semibold text-black">{engagement.commentRate}%</p>
                  </div>
                </div>
                {engagement.tips.length > 0 && (
                  <div className="space-y-1.5">
                    {engagement.tips.map((tip, i) => (
                      <p key={i} className="text-xs text-neutral-600 flex items-start gap-2">
                        <CheckCircle2 size={12} className="text-green-600 shrink-0 mt-0.5" /> {tip}
                      </p>
                    ))}
                  </div>
                )}
                <button
                  onClick={() => setActiveTab('comments')}
                  className="mt-4 text-xs font-medium text-black border border-neutral-200 px-3 py-1.5 rounded-lg hover:bg-neutral-50"
                >
                  View AI Comment Analysis →
                </button>
              </div>

            <div className="grid gap-5 xl:grid-cols-2">
              {/* Views Chart */}
              <div className="rounded-2xl border border-neutral-500/30 bg-white p-5">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-sm font-semibold text-black">Views over time</p>
                    <p className="text-xs text-neutral-500">Daily views · Last 90 days</p>
                  </div>
                  <TrendingUp size={16} className="text-neutral-400" />
                </div>
                <ViewsLineChart data={chart} />
              </div>

              {/* Traffic Sources */}
              <div className="rounded-2xl border border-neutral-500/30 bg-white p-5">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-sm font-semibold text-black">Traffic sources</p>
                    <p className="text-xs text-neutral-500">How viewers found this video</p>
                  </div>
                  <Share2 size={16} className="text-neutral-400" />
                </div>
                <HBarChart items={traffic} valueKey="views" labelKey="source" colorClass="bg-black" />
                {!traffic.length && <p className="text-sm text-neutral-400">No traffic data available</p>}
              </div>

              {/* Devices */}
              <div className="rounded-2xl border border-neutral-500/30 bg-white p-5">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-sm font-semibold text-black">Device breakdown</p>
                    <p className="text-xs text-neutral-500">Watch time by device</p>
                  </div>
                  <Monitor size={16} className="text-neutral-400" />
                </div>
                {devices.length ? (
                  <div className="space-y-3">
                    {devices.map((d, i) => (
                      <div key={i}>
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span className="flex items-center gap-2 text-neutral-600">
                            {deviceIcon(d.device)} {d.device}
                          </span>
                          <span className="text-neutral-500 text-xs">{d.percent}%</span>
                        </div>
                        <div className="h-2 rounded-full bg-neutral-100">
                          <div className="h-2 rounded-full bg-neutral-800 transition-all" style={{ width: `${Math.max(d.percent, 3)}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : <p className="text-sm text-neutral-400">No device data available</p>}
              </div>

              {/* Top Comments Preview */}
              <div className="rounded-2xl border border-neutral-500/30 bg-white p-5">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-sm font-semibold text-black">Top comments</p>
                    <p className="text-xs text-neutral-500">Most relevant</p>
                  </div>
                  <button onClick={() => setActiveTab('comments')} className="text-xs text-neutral-500 hover:text-black">See all</button>
                </div>
                {comments.length ? (
                  <div className="space-y-3">
                    {comments.slice(0, 3).map(c => (
                      <div key={c.id} className="flex gap-3">
                        <img src={c.author_pic} alt="" className="w-7 h-7 rounded-full shrink-0 bg-neutral-100" />
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-black">{c.author} <span className="font-normal text-neutral-400">· {timeAgo(c.published_at)}</span></p>
                          <p className="text-xs text-neutral-600 mt-0.5 line-clamp-2" dangerouslySetInnerHTML={{ __html: c.text }} />
                          {c.likes > 0 && <p className="text-[10px] text-neutral-400 mt-1">👍 {c.likes}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : <p className="text-sm text-neutral-400">No comments yet</p>}
              </div>
            </div>
            </div>
          )}

          {/* CHART TAB */}
          {activeTab === 'chart' && (
            <div className="space-y-5">
              <div className="rounded-2xl border border-neutral-500/30 bg-white p-5">
                <p className="text-sm font-semibold text-black mb-1">Views · Last 90 days</p>
                <p className="text-xs text-neutral-500 mb-4">Daily view count</p>
                <ViewsLineChart data={chart} />
              </div>

              {/* Daily table */}
              {chart.length > 0 && (
                <div className="rounded-2xl border border-neutral-500/30 bg-white overflow-hidden">
                  <div className="grid grid-cols-5 gap-4 px-5 py-3 bg-neutral-50 border-b border-neutral-100">
                    {['Date', 'Views', 'Watch (min)', 'Likes', 'Comments'].map(h => (
                      <span key={h} className="text-xs font-semibold text-neutral-500 uppercase tracking-wide">{h}</span>
                    ))}
                  </div>
                  <div className="max-h-96 overflow-y-auto">
                    {[...chart].reverse().map((row, i) => (
                      <div key={i} className="grid grid-cols-5 gap-4 px-5 py-2.5 border-b border-neutral-100 last:border-0 hover:bg-neutral-50">
                        <span className="text-xs text-neutral-500">{new Date(row.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                        <span className="text-sm font-medium text-black">{fmt(row.views)}</span>
                        <span className="text-sm text-neutral-600">{row.watch_minutes?.toFixed(0) || 0}</span>
                        <span className="text-sm text-neutral-600">{row.likes || 0}</span>
                        <span className="text-sm text-neutral-600">{row.comments || 0}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* COMMENTS TAB — AI powered */}
          {activeTab === 'comments' && (
            <div className="space-y-5">
              {commentsLoading ? (
                <div className="flex h-48 items-center justify-center rounded-2xl border border-neutral-200 bg-white">
                  <div className="flex flex-col items-center gap-3">
                    <Loader2 size={24} className="animate-spin text-neutral-400" />
                    <p className="text-sm text-neutral-500">AI analyzing comments & generating replies...</p>
                  </div>
                </div>
              ) : (
                <>
                  {/* Audience Summary */}
                  {audienceSummary && (
                    <div className="rounded-2xl border border-neutral-500/30 bg-white p-5">
                      <div className="flex items-center gap-2 mb-3">
                        <Brain size={18} className="text-purple-600" />
                        <p className="text-sm font-semibold text-black">Comment Summary</p>
                        <span className="text-lg ml-1">{moodEmoji[audienceSummary.overall_mood] || '😐'}</span>
                        <span className="text-xs capitalize border border-neutral-200 px-2 py-0.5 rounded-full text-neutral-600">
                          {audienceSummary.overall_mood} mood
                        </span>
                      </div>
                      <p className="text-sm text-neutral-700 leading-relaxed mb-4">{audienceSummary.mood_summary}</p>

                      {audienceSummary.sentiment_breakdown && (
                        <div className="flex flex-wrap gap-2 mb-4">
                          {Object.entries(audienceSummary.sentiment_breakdown).filter(([, v]) => v > 0).map(([k, v]) => (
                            <span key={k} className={`text-xs border px-2.5 py-1 rounded-full capitalize ${sentimentColor[k] || sentimentColor.neutral}`}>
                              {k}: {v}
                            </span>
                          ))}
                        </div>
                      )}

                      <div className="grid sm:grid-cols-2 gap-4">
                        {audienceSummary.top_themes?.length > 0 && (
                          <div>
                            <p className="text-xs font-semibold text-neutral-500 uppercase mb-2">Top Themes</p>
                            <div className="flex flex-wrap gap-1.5">
                              {audienceSummary.top_themes.map(t => (
                                <span key={t} className="text-xs bg-neutral-100 text-neutral-700 px-2 py-1 rounded-full">{t}</span>
                              ))}
                            </div>
                          </div>
                        )}
                        {audienceSummary.common_requests?.length > 0 && (
                          <div>
                            <p className="text-xs font-semibold text-neutral-500 uppercase mb-2">Viewer Requests</p>
                            <ul className="space-y-1">
                              {audienceSummary.common_requests.map((r, i) => (
                                <li key={i} className="text-xs text-neutral-600">• {r}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>

                      {audienceSummary.creator_tip && (
                        <div className="mt-4 rounded-xl bg-purple-50 border border-purple-100 p-3">
                          <p className="text-xs font-semibold text-purple-700 mb-1">💡 Creator Tip</p>
                          <p className="text-sm text-purple-900">{audienceSummary.creator_tip}</p>
                        </div>
                      )}

                      {audienceSummary.pain_points?.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {audienceSummary.pain_points.map(p => (
                            <span key={p} className="text-xs flex items-center gap-1 text-orange-700 bg-orange-50 border border-orange-200 px-2 py-1 rounded-full">
                              <AlertTriangle size={10} /> {p}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Filter + stats bar */}
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap gap-2">
                      {[
                        ['all', `All (${aiComments.length})`],
                        ['high', `High Priority (${aiComments.filter(c => c.priority === 'high').length})`],
                        ['positive', 'Positive'],
                        ['question', 'Questions'],
                        ['negative', 'Negative'],
                      ].map(([f, label]) => (
                        <button
                          key={f}
                          onClick={() => setCommentFilter(f)}
                          className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                            commentFilter === f ? 'bg-black text-white border-black' : 'bg-white text-neutral-600 border-neutral-200 hover:border-neutral-400'
                          }`}
                        >{label}</button>
                      ))}
                    </div>
                    <button
                      onClick={loadAIComments}
                      disabled={commentsLoading}
                      className="flex items-center gap-1.5 text-xs border border-neutral-200 px-3 py-1.5 rounded-lg hover:bg-neutral-50"
                    >
                      <Sparkles size={12} /> Re-analyze
                    </button>
                  </div>

                  {/* Comment cards with AI replies */}
                  {filteredComments.length > 0 ? (
                    <div className="space-y-3">
                      {filteredComments.map(c => (
                        <div
                          key={c.comment_id}
                          className={`rounded-2xl border bg-white p-4 space-y-3 ${
                            posted[c.comment_id] ? 'border-green-300 bg-green-50/30' : 'border-neutral-200'
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <img src={c.author_profile_image} alt="" className="w-9 h-9 rounded-full shrink-0 bg-neutral-100" />
                            <div className="flex-1 min-w-0">
                              <div className="flex flex-wrap items-center gap-2 mb-1">
                                <span className="text-sm font-medium text-black">{c.author}</span>
                                <span className={`text-[10px] border px-1.5 py-0.5 rounded-full capitalize ${sentimentColor[c.sentiment] || sentimentColor.neutral}`}>
                                  {c.sentiment}
                                </span>
                                <span className={`text-[10px] border px-1.5 py-0.5 rounded-full capitalize ${priorityBadge[c.priority]}`}>
                                  {c.priority}
                                </span>
                                {c.like_count > 0 && (
                                  <span className="text-xs text-neutral-400 flex items-center gap-0.5">
                                    <ThumbsUp size={10} /> {c.like_count}
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-neutral-700 leading-relaxed">{c.text}</p>
                            </div>
                          </div>

                          {!posted[c.comment_id] ? (
                            <div className="pl-12 space-y-2">
                              <p className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wide flex items-center gap-1">
                                <Sparkles size={10} /> AI Draft Reply
                              </p>
                              <div className="flex items-center gap-2">
                                <textarea
                                  value={replies[c.comment_id] || ''}
                                  onChange={e => setReplies(r => ({ ...r, [c.comment_id]: e.target.value }))}
                                  rows={2}
                                  className="flex-1 border border-neutral-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-neutral-400 resize-none bg-neutral-50"
                                  placeholder="Edit draft reply..."
                                />
                                <button
                                  onClick={() => handlePost(c.comment_id)}
                                  disabled={posting[c.comment_id] || !replies[c.comment_id]?.trim()}
                                  className="flex items-center gap-1.5 bg-black text-white px-4 py-2.5 rounded-xl text-xs font-medium hover:bg-neutral-800 disabled:opacity-50 shrink-0"
                                >
                                  {posting[c.comment_id] ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
                                  Post
                                </button>
                              </div>
                            </div>
                          ) : (
                            <p className="pl-12 text-xs text-green-600 flex items-center gap-1">
                              <CheckCircle2 size={12} /> Reply posted to YouTube
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : commentsAnalyzed ? (
                    <div className="rounded-2xl border border-neutral-200 bg-white py-12 text-center text-sm text-neutral-400">
                      No comments match this filter
                    </div>
                  ) : null}
                </>
              )}
            </div>
          )}

          {/* DETAILS TAB */}
          {activeTab === 'details' && (
            <div className="space-y-5">
              <div className="rounded-2xl border border-neutral-500/30 bg-white p-5 space-y-4">
                <p className="text-sm font-semibold text-black">Video Information</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {[
                    { label: 'Duration', value: dur },
                    { label: 'Quality', value: (video.definition || 'hd').toUpperCase() },
                    { label: 'Caption', value: video.caption === 'true' ? 'Yes' : 'No' },
                    { label: 'Embeddable', value: video.embeddable ? 'Yes' : 'No' },
                    { label: 'Made for Kids', value: video.made_for_kids ? 'Yes' : 'No' },
                    { label: 'Privacy', value: video.privacy_status || '—', capitalize: true },
                  ].map(item => (
                    <div key={item.label} className="rounded-xl bg-neutral-50 p-3">
                      <p className="text-xs text-neutral-500 mb-1">{item.label}</p>
                      <p className={`text-sm font-medium text-black ${item.capitalize ? 'capitalize' : ''}`}>{item.value}</p>
                    </div>
                  ))}
                </div>
              </div>

              {video.description && (
                <div className="rounded-2xl border border-neutral-500/30 bg-white p-5">
                  <p className="text-sm font-semibold text-black mb-3">Description</p>
                  <p className="text-sm text-neutral-600 leading-relaxed whitespace-pre-line">{video.description}</p>
                </div>
              )}

              {video.tags?.length > 0 && (
                <div className="rounded-2xl border border-neutral-500/30 bg-white p-5">
                  <p className="text-sm font-semibold text-black mb-3">Tags <span className="font-normal text-neutral-400">({video.tags.length})</span></p>
                  <div className="flex flex-wrap gap-2">
                    {video.tags.map(tag => (
                      <span key={tag} className="text-xs bg-neutral-100 text-neutral-700 px-2.5 py-1 rounded-full">{tag}</span>
                    ))}
                  </div>
                </div>
              )}

              <button
                onClick={() => {
                  sessionStorage.setItem('crewflow_meta_prefill', JSON.stringify({
                    title: video.title,
                    description: video.description,
                    tags: (video.tags || []).join(', '),
                  }))
                  alert('Title & description saved! Go to Sidebar → Trend → Title & Description tab to optimize.')
                }}
                className="flex items-center justify-center gap-2 w-full py-3 rounded-2xl bg-black text-white text-sm font-medium hover:bg-neutral-800 transition-colors"
              >
                <Sparkles size={15} /> Optimize Title & Description in Trend Hub
              </button>

              <a
                href={`https://www.youtube.com/watch?v=${video.video_id}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center gap-2 w-full py-3 rounded-2xl border border-neutral-200 text-sm font-medium text-black hover:bg-neutral-50 transition-colors"
              >
                <ExternalLink size={15} /> Open on YouTube
              </a>
            </div>
          )}
        </>
      )}
    </div>
  )
}
