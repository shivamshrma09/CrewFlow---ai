import { useEffect, useState } from 'react'
import { getStudioAnalytics } from '../../lib/api'
import {
  Eye,
  Clock3,
  Users,
  TrendingUp,
  Sparkles,
  ExternalLink,
  Play,
  Activity,
  BarChart3,
} from 'lucide-react'

function fmt(n) {
  if (n === null || n === undefined || Number.isNaN(n)) return '0'
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M'
  if (n >= 1000) return (n / 1000).toFixed(1) + 'K'
  return n.toString()
}

function pct(value) {
  return `${value > 0 ? '+' : ''}${value}%`
}

function formatDateRange(start, end) {
  const s = new Date(start)
  const e = new Date(end)
  const options = { month: 'short', day: 'numeric' }
  return `${s.toLocaleDateString('en-US', options)} – ${e.toLocaleDateString('en-US', options)}, ${e.getFullYear()}`
}

export default function StudioAnalytics({ creatorId }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    getStudioAnalytics({ creator_id: creatorId })
      .then((r) => {
        if (mounted) setData(r.data)
      })
      .finally(() => {
        if (mounted) setLoading(false)
      })

    return () => {
      mounted = false
    }
  }, [creatorId])

  if (loading) {
    return (
      <div className="flex h-72 items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-neutral-300 border-t-black" />
          <p className="text-sm text-neutral-500">Loading studio analytics...</p>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="flex h-72 items-center justify-center text-sm text-neutral-500">
        Failed to load studio analytics.
      </div>
    )
  }

  const { overview, audience, realtime, inspiration } = data
  const summary = overview?.summary || {}
  const traffic = overview?.traffic_sources || []
  const topContent = overview?.top_content || []
  const latestVideos = realtime?.latest_videos || []
  const deviceBreakdown = audience?.device_breakdown || []

  return (
    <div className="space-y-5 bg-white pb-10">
      <div className="mt-10 rounded-2xl border border-neutral-500/30 bg-white p-6">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-neutral-500">Channel analytics</p>
            <h2 className="mt-1 text-2xl font-semibold text-black">Advanced mode</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {[
              'How did viewers find my content?',
              'How many new viewers did I reach?',
              'Summarize my latest video performance',
            ].map((item) => (
              <button
                key={item}
                className="rounded-full border border-neutral-300 px-3 py-1.5 text-sm text-neutral-700 hover:bg-neutral-50"
              >
                {item}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-2 text-sm text-neutral-500">
          <span>{formatDateRange(overview?.period?.startDate, overview?.period?.endDate)}</span>
          <span className="rounded-full bg-neutral-100 px-2 py-1 text-xs font-medium text-neutral-600">Last 28 days</span>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          {
            label: 'Views',
            value: fmt(summary.views),
            delta: pct(summary.views_change_percent),
            icon: Eye,
          },
          {
            label: 'Watch time (hours)',
            value: `${summary.watch_time_hours || 0}`,
            delta: pct(summary.watch_time_change_percent),
            icon: Clock3,
          },
          {
            label: 'Subscribers',
            value: fmt(summary.net_subscribers),
            delta: 'Net change',
            icon: Users,
          },
          {
            label: 'Impressions',
            value: fmt(summary.impressions),
            delta: `${summary.impressions_ctr || 0}% CTR`,
            icon: TrendingUp,
          },
        ].map((item) => (
          <div key={item.label} className="rounded-2xl border border-neutral-500/30 p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm text-neutral-500">{item.label}</p>
              <item.icon size={18} className="text-neutral-500" />
            </div>
            <p className="mt-3 text-3xl font-semibold text-black">{item.value}</p>
            <p className="mt-1 text-sm text-emerald-600">{item.delta}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.6fr_1fr]">
        <div className="rounded-2xl border border-neutral-500/30 bg-white p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-black">How viewers find your videos</p>
              <p className="text-xs text-neutral-500">Views · Last 28 days</p>
            </div>
            <button className="text-sm text-neutral-500">See more</button>
          </div>
          <div className="mt-4 space-y-3">
            {traffic.slice(0, 5).map((item) => (
              <div key={item.source}>
                <div className="flex items-center justify-between text-sm text-neutral-600">
                  <span>{item.source}</span>
                  <span>{item.percent}%</span>
                </div>
                <div className="mt-1 h-2 rounded-full bg-neutral-100">
                  <div className="h-2 rounded-full bg-black" style={{ width: `${Math.max(item.percent, 8)}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-neutral-500/30 bg-white p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-black">Latest activity</p>
              <p className="text-xs text-neutral-500">Realtime updates</p>
            </div>
            <span className="rounded-full bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700">Live</span>
          </div>
          <div className="mt-4 rounded-xl bg-neutral-50 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-neutral-500">Subscribers</p>
                <p className="text-2xl font-semibold text-black">{fmt(realtime?.subscribers)}</p>
              </div>
              <Activity className="text-neutral-500" size={18} />
            </div>
          </div>
          <div className="mt-3 space-y-2">
            {latestVideos.slice(0, 3).map((video) => (
              <div key={video.video_id} className="flex items-center gap-3 rounded-xl border border-neutral-200 p-2">
                <img src={video.thumbnail} alt="" className="h-12 w-20 rounded-lg object-cover" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-black">{video.title}</p>
                  <p className="text-xs text-neutral-500">{fmt(video.views)} views</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.2fr_1fr]">
        <div className="rounded-2xl border border-neutral-500/30 bg-white p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-black">Top videos</p>
            <button className="text-sm text-neutral-500">See more</button>
          </div>
          <div className="mt-4 space-y-3">
            {topContent.slice(0, 4).map((video, index) => (
              <div key={video.video_id || index} className="flex items-center gap-3 rounded-xl border border-neutral-200 p-3">
                <div className="relative shrink-0">
                  <img src={video.thumbnail} alt="" className="h-14 w-24 rounded-lg object-cover" />
                  <span className="absolute bottom-1 right-1 rounded bg-black/80 px-1 text-[10px] text-white">
                    {video.avg_view_duration_seconds ? `${Math.floor(video.avg_view_duration_seconds / 60)}:${String(video.avg_view_duration_seconds % 60).padStart(2, '0')}` : '0:00'}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-black">{video.title}</p>
                  <p className="text-xs text-neutral-500">{fmt(video.views)} views</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-neutral-500/30 bg-white p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-black">Audience & device mix</p>
            <BarChart3 size={16} className="text-neutral-500" />
          </div>
          <div className="mt-4 space-y-3">
            {deviceBreakdown.slice(0, 4).map((item) => (
              <div key={item.device}>
                <div className="flex items-center justify-between text-sm text-neutral-600">
                  <span>{item.device}</span>
                  <span>{item.percent}%</span>
                </div>
                <div className="mt-1 h-2 rounded-full bg-neutral-100">
                  <div className="h-2 rounded-full bg-black" style={{ width: `${item.percent}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-neutral-500/30 bg-white p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-black">Inspiration</p>
            <p className="text-xs text-neutral-500">AI tools for brainstorming video ideas have moved to Inspiration.</p>
          </div>
          <button className="inline-flex items-center gap-1 rounded-xl border border-neutral-300 px-3 py-2 text-sm text-black hover:bg-neutral-50">
            Go to Inspiration <ExternalLink size={14} />
          </button>
        </div>
        <div className="mt-4 rounded-xl bg-neutral-50 p-4">
          <p className="text-sm font-semibold text-black">Ideas to get started</p>
          <div className="mt-3 space-y-2">
            {inspiration?.items?.map((idea) => (
              <a
                key={idea.url}
                href={idea.url}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-between gap-3 rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm text-black hover:bg-neutral-50"
              >
                <span>{idea.title}</span>
                <ExternalLink size={14} className="text-neutral-500" />
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
