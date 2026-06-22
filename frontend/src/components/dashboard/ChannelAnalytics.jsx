import { useEffect, useState } from 'react'
import {
  getChannelAnalyticsOverview,
  getAudienceInsights,
  getInspirationIdeas,
} from '../../lib/api'
import {
  Eye, Clock3, Users, TrendingUp, ExternalLink,
  Activity, BarChart2, Smartphone, Monitor, Tv, Tablet,
  Lightbulb, Bookmark, ChevronRight,
} from 'lucide-react'

function fmt(n) {
  if (n === null || n === undefined || Number.isNaN(n)) return '—'
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M'
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K'
  return String(n)
}

function pct(v) {
  if (v === 0) return '0%'
  return `${v > 0 ? '+' : ''}${v}%`
}

function fmtSecs(s) {
  if (!s) return '0:00'
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}

function formatDateRange(start, end) {
  if (!start || !end) return ''
  const opts = { month: 'short', day: 'numeric' }
  const s = new Date(start).toLocaleDateString('en-US', opts)
  const e = new Date(end)
  return `${s} – ${e.toLocaleDateString('en-US', opts)}, ${e.getFullYear()}`
}

function deviceIcon(device) {
  const d = device?.toLowerCase() || ''
  if (d.includes('mobile') || d.includes('phone')) return <Smartphone size={14} />
  if (d.includes('tablet')) return <Tablet size={14} />
  if (d.includes('tv')) return <Tv size={14} />
  return <Monitor size={14} />
}

function MiniBar({ percent, color = 'bg-black' }) {
  return (
    <div className="h-1.5 w-full rounded-full bg-neutral-100">
      <div className={`h-1.5 rounded-full ${color}`} style={{ width: `${Math.max(percent, 3)}%` }} />
    </div>
  )
}

function StatCard({ label, value, delta, deltaPositive, icon: Icon, tooltip }) {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-xs text-neutral-500">{label}</p>
        <Icon size={16} className="text-neutral-400" />
      </div>
      <p className="text-3xl font-semibold text-black">{value}</p>
      <p className={`text-xs font-medium ${deltaPositive ? 'text-emerald-600' : 'text-neutral-400'}`}>{delta}</p>
      {tooltip && <p className="text-[11px] text-neutral-400 leading-relaxed">{tooltip}</p>}
    </div>
  )
}

const TABS = ['Overview', 'Reach', 'Audience', 'Inspiration']

export default function ChannelAnalytics({ creatorId }) {
  const [activeTab, setActiveTab] = useState('Overview')
  const [overview, setOverview] = useState(null)
  const [audience, setAudience] = useState(null)
  const [inspiration, setInspiration] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    setLoading(true)
    Promise.all([
      getChannelAnalyticsOverview({ creator_id: creatorId }),
      getAudienceInsights({ creator_id: creatorId }),
      getInspirationIdeas(),
    ])
      .then(([ovRes, audRes, insRes]) => {
        if (!mounted) return
        setOverview(ovRes.data)
        setAudience(audRes.data)
        setInspiration(insRes.data)
      })
      .finally(() => { if (mounted) setLoading(false) })
    return () => { mounted = false }
  }, [creatorId])

  if (loading) return (
    <div className="flex h-72 items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-neutral-300 border-t-black" />
        <p className="text-sm text-neutral-500">Loading channel analytics...</p>
      </div>
    </div>
  )

  if (!overview) return (
    <div className="flex h-72 items-center justify-center text-sm text-neutral-500">
      Failed to load analytics.
    </div>
  )

  const s = overview.summary || {}
  const traffic = overview.traffic_sources || []
  const topContent = overview.top_content || []
  const deviceBreakdown = audience?.device_breakdown || []
  const subscriberBreakdown = audience?.subscriber_breakdown || []

  return (
    <div className="space-y-5 pb-10">
      {/* Header */}
      <div className="rounded-2xl border border-neutral-200 bg-white p-6">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-neutral-500">Channel analytics</p>
            <h2 className="mt-1 text-2xl font-semibold text-black">Advanced mode</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {[
              'How did viewers find my content?',
              'How many new viewers did I reach?',
              'Summarize my latest video performance',
            ].map((q) => (
              <button
                key={q}
                className="rounded-full border border-neutral-200 px-3 py-1.5 text-xs text-neutral-600 hover:bg-neutral-50 transition-colors"
              >
                {q}
              </button>
            ))}
          </div>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-2 text-sm text-neutral-500">
          <span>{formatDateRange(overview.period?.startDate, overview.period?.endDate)}</span>
          <span className="rounded-full bg-neutral-100 px-2.5 py-1 text-xs font-medium text-neutral-600">
            Last 28 days
          </span>
        </div>

        {/* Sub-tabs */}
        <div className="mt-5 flex gap-1 border-b border-neutral-100">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setActiveTab(t)}
              className={`px-4 py-2 text-sm font-medium transition-colors rounded-t-lg ${
                activeTab === t
                  ? 'border-b-2 border-black text-black'
                  : 'text-neutral-500 hover:text-black'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* ── Overview Tab ── */}
      {activeTab === 'Overview' && (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="Views"
              value={fmt(s.views)}
              delta={`${pct(s.views_change_percent)} vs previous 28 days`}
              deltaPositive={s.views_change_percent >= 0}
              icon={Eye}
              tooltip="Channel views compared with the previous period. Includes public, private, unlisted, and deleted videos."
            />
            <StatCard
              label="Watch time (hours)"
              value={String(s.watch_time_hours ?? 0)}
              delta={`${pct(s.watch_time_change_percent)} vs previous 28 days`}
              deltaPositive={s.watch_time_change_percent >= 0}
              icon={Clock3}
              tooltip="Channel watch time compared with the previous period. Includes public, private, unlisted, and deleted videos."
            />
            <StatCard
              label="Subscribers"
              value={s.net_subscribers === 0 ? '—' : fmt(s.net_subscribers)}
              delta="Net change (gained – lost)"
              deltaPositive={s.net_subscribers >= 0}
              icon={Users}
              tooltip="Change in total subscribers for the selected date range."
            />
            <StatCard
              label="Avg View Duration"
              value={fmtSecs(s.avg_view_duration_seconds)}
              delta="Average per view"
              deltaPositive={true}
              icon={TrendingUp}
              tooltip="Estimated average minutes watched per view for the selected period."
            />
          </div>

          {/* Chart */}
          {overview.chart?.length > 0 && (
            <div className="rounded-2xl border border-neutral-200 bg-white p-5">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm font-semibold text-black">Views over time</p>
                <button className="text-xs text-neutral-500 hover:text-black">See more</button>
              </div>
              <div className="flex items-end gap-1 h-24">
                {overview.chart.map((d) => {
                  const max = Math.max(...overview.chart.map((x) => x.views), 1)
                  const h = Math.max((d.views / max) * 100, 2)
                  return (
                    <div key={d.date} className="flex-1 flex flex-col items-center gap-1 group">
                      <div className="w-full rounded-sm bg-black/80 transition-all group-hover:bg-black" style={{ height: `${h}%` }} />
                    </div>
                  )
                })}
              </div>
              <div className="mt-2 flex justify-between text-[10px] text-neutral-400">
                <span>{overview.period?.startDate}</span>
                <span>{overview.period?.endDate}</span>
              </div>
            </div>
          )}

          {/* Traffic + Top Content */}
          <div className="grid gap-5 xl:grid-cols-2">
            <div className="rounded-2xl border border-neutral-200 bg-white p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm font-semibold text-black">How viewers find your videos</p>
                  <p className="text-xs text-neutral-400">Views · Last 28 days</p>
                </div>
                <button className="text-xs text-neutral-500 hover:text-black">See more</button>
              </div>
              <div className="space-y-3">
                {traffic.length === 0 && <p className="text-xs text-neutral-400">Not enough data.</p>}
                {traffic.slice(0, 6).map((item) => (
                  <div key={item.source}>
                    <div className="flex items-center justify-between text-xs text-neutral-600 mb-1">
                      <span>{item.source}</span>
                      <span className="font-medium">{item.percent}%</span>
                    </div>
                    <MiniBar percent={item.percent} />
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-neutral-200 bg-white p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm font-semibold text-black">Top videos</p>
                  <p className="text-xs text-neutral-400">Views · Last 28 days</p>
                </div>
                <button className="text-xs text-neutral-500 hover:text-black">See more</button>
              </div>
              <div className="space-y-3">
                {topContent.length === 0 && <p className="text-xs text-neutral-400">No data yet.</p>}
                {topContent.map((v, i) => (
                  <div key={v.video_id || i} className="flex items-center gap-3 rounded-xl border border-neutral-100 p-2.5">
                    <span className="text-xs font-bold text-neutral-400 w-4">{i + 1}</span>
                    {v.thumbnail && (
                      <div className="relative shrink-0">
                        <img src={v.thumbnail} alt="" className="h-10 w-16 rounded-lg object-cover" />
                        <span className="absolute bottom-0.5 right-0.5 rounded bg-black/80 px-1 text-[9px] text-white">
                          {fmtSecs(v.avg_view_duration_seconds)}
                        </span>
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-medium text-black">{v.title || v.video_id}</p>
                      <p className="text-[11px] text-neutral-400">{fmt(v.views)} views</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      {/* ── Reach Tab ── */}
      {activeTab === 'Reach' && (
        <div className="grid gap-5 xl:grid-cols-2">
          <div className="rounded-2xl border border-neutral-200 bg-white p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm font-semibold text-black">Reach summary</p>
                <p className="text-xs text-neutral-400">Last 28 days</p>
              </div>
              <TrendingUp size={16} className="text-neutral-400" />
            </div>
            <div className="space-y-4">
              <div className="rounded-xl bg-neutral-50 p-4 flex flex-col gap-1">
                <p className="text-xs text-neutral-500">Views</p>
                <p className="text-2xl font-semibold text-black">{fmt(s.views)}</p>
                <p className={`text-xs ${s.views_change_percent >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                  {pct(s.views_change_percent)} vs previous 28 days
                </p>
              </div>
              <div className="rounded-xl bg-neutral-50 p-4 flex flex-col gap-1">
                <p className="text-xs text-neutral-500">Watch time (hours)</p>
                <p className="text-2xl font-semibold text-black">{s.watch_time_hours ?? 0}</p>
                <p className={`text-xs ${s.watch_time_change_percent >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                  {pct(s.watch_time_change_percent)} vs previous 28 days
                </p>
              </div>
              <div className="rounded-xl bg-neutral-50 p-4 flex flex-col gap-1">
                <p className="text-xs text-neutral-500">Average view duration</p>
                <p className="text-2xl font-semibold text-black">{fmtSecs(s.avg_view_duration_seconds)}</p>
                <p className="text-xs text-neutral-400">Avg minutes watched per view</p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-neutral-200 bg-white p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm font-semibold text-black">How viewers find your videos</p>
                <p className="text-xs text-neutral-400">Views · Last 28 days · Overall</p>
              </div>
              <button className="text-xs text-neutral-500 hover:text-black">See more</button>
            </div>
            <div className="space-y-3">
              {traffic.length === 0 && <p className="text-xs text-neutral-400">Not enough traffic data.</p>}
              {traffic.map((item) => (
                <div key={item.source}>
                  <div className="flex items-center justify-between text-xs text-neutral-600 mb-1">
                    <span>{item.source}</span>
                    <span className="font-medium">{item.percent}%</span>
                  </div>
                  <MiniBar percent={item.percent} />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Audience Tab ── */}
      {activeTab === 'Audience' && (
        <div className="space-y-5">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-neutral-200 bg-white p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm font-semibold text-black">Monthly audience</p>
                  <p className="text-xs text-neutral-400">Estimated total viewers · Last 28 days</p>
                </div>
                <Users size={16} className="text-neutral-400" />
              </div>
              <p className="text-4xl font-semibold text-black">{fmt(audience?.monthly_audience)}</p>
              <p className="mt-1 text-xs text-neutral-400">Calculated daily, looking back 28 days</p>

              {audience?.chart?.length > 0 && (
                <div className="mt-5 flex items-end gap-0.5 h-16">
                  {audience.chart.map((d) => {
                    const max = Math.max(...audience.chart.map((x) => x.views), 1)
                    const h = Math.max((d.views / max) * 100, 2)
                    return (
                      <div key={d.date} className="flex-1 rounded-sm bg-black/70" style={{ height: `${h}%` }} />
                    )
                  })}
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-neutral-200 bg-white p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm font-semibold text-black">Watch time from subscribers</p>
                  <p className="text-xs text-neutral-400">Watch time · Last 28 days</p>
                </div>
                <Activity size={16} className="text-neutral-400" />
              </div>
              <div className="space-y-3">
                {subscriberBreakdown.length === 0 && <p className="text-xs text-neutral-400">Not enough data.</p>}
                {subscriberBreakdown.map((item) => (
                  <div key={item.status}>
                    <div className="flex items-center justify-between text-xs text-neutral-600 mb-1">
                      <span>{item.status === 'SUBSCRIBED' ? 'Subscribed' : 'Not subscribed'}</span>
                      <span className="font-medium">{item.percent}%</span>
                    </div>
                    <MiniBar percent={item.percent} />
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-neutral-200 bg-white p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm font-semibold text-black">Device type</p>
                <p className="text-xs text-neutral-400">Watch time (hours) · Last 28 days</p>
              </div>
              <BarChart2 size={16} className="text-neutral-400" />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {deviceBreakdown.length === 0 && <p className="text-xs text-neutral-400">Not enough data.</p>}
              {deviceBreakdown.map((item) => (
                <div key={item.device} className="rounded-xl bg-neutral-50 p-3 flex items-center gap-3">
                  <div className="rounded-lg bg-white border border-neutral-200 p-2 text-neutral-500">
                    {deviceIcon(item.device)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-black">{item.device}</p>
                    <MiniBar percent={item.percent} />
                  </div>
                  <span className="text-sm font-semibold text-black shrink-0">{item.percent}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Inspiration Tab ── */}
      {activeTab === 'Inspiration' && (
        <div className="space-y-5">
          <div className="rounded-2xl border border-neutral-200 bg-white p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-black">Channel analytics</p>
                <p className="mt-1 text-xs text-neutral-500">
                  AI tools for brainstorming video ideas have moved to Inspiration.{' '}
                  <a
                    href={inspiration?.learn_more_url}
                    target="_blank"
                    rel="noreferrer"
                    className="underline hover:text-black"
                  >
                    Learn more
                  </a>
                </p>
              </div>
              <a
                href="https://studio.youtube.com"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-xl border border-neutral-200 px-4 py-2 text-sm text-black hover:bg-neutral-50 transition-colors"
              >
                Go to Inspiration <ExternalLink size={14} />
              </a>
            </div>
          </div>

          <div className="rounded-2xl border border-neutral-200 bg-white p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Lightbulb size={16} className="text-neutral-500" />
                <p className="text-sm font-semibold text-black">Get ideas for your next video</p>
              </div>
              <div className="flex items-center gap-1 text-xs text-neutral-500">
                <Bookmark size={13} />
                <span>Saved ({inspiration?.saved_count ?? 0})</span>
              </div>
            </div>

            <div className="rounded-xl bg-neutral-50 p-4">
              <p className="text-xs font-semibold text-neutral-600 mb-3">Ideas to get started</p>
              <div className="space-y-2">
                {(inspiration?.ideas || []).map((idea) => (
                  <a
                    key={idea.url}
                    href={idea.url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-between gap-3 rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm text-black hover:bg-neutral-50 transition-colors group"
                  >
                    <span>{idea.title}</span>
                    <ChevronRight size={14} className="text-neutral-400 group-hover:text-black transition-colors shrink-0" />
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
