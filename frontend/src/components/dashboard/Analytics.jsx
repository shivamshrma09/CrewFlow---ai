import { useState } from 'react'
import { getRevenue, getRetention, fakeScan, fixScriptAtTimestamp } from '../../lib/api'
import { TrendingUp, BarChart2, Shield, Loader2, Sparkles } from 'lucide-react'

function Badge({ children }) {
  return <span className="text-xs border border-neutral-500/30 px-2 py-0.5 rounded-full text-neutral-500">{children}</span>
}

function fmt(n) {
  if (!n) return '₹0'
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`
  if (n >= 1000) return `₹${(n / 1000).toFixed(1)}K`
  return `₹${n}`
}

export function Revenue({ creatorId }) {
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)

  async function handle() {
    setLoading(true)
    try {
      const res = await getRevenue({ creator_id: creatorId })
      setResult(res.data)
    } catch (e) {
      alert(e.response?.data?.error || 'Error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold mb-1">Revenue Estimator</h2>
        <p className="text-neutral-400 text-sm">Estimate your channel's earning potential based on real metrics.</p>
      </div>
      <button onClick={handle} disabled={loading}
        className="flex items-center gap-2 bg-white text-black px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-neutral-200 transition-colors disabled:opacity-50">
        {loading ? <Loader2 size={14} className="animate-spin" /> : <TrendingUp size={14} />}
        {loading ? 'Calculating...' : 'Calculate Revenue'}
      </button>
      {result && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              ['AdSense', result.monthly_estimates?.adsense_inr?.realistic],
              ['Brand Deal', result.monthly_estimates?.brand_deal_per_video_inr?.realistic],
              ['Sponsored', result.monthly_estimates?.sponsored_post_inr?.realistic],
              ['Total Potential', result.monthly_estimates?.total_potential_inr?.realistic],
            ].map(([l, v]) => (
              <div key={l} className="border border-neutral-500/30 rounded-2xl p-4">
                <p className="text-xs text-neutral-400 mb-1">{l}</p>
                <p className="text-xl font-bold">{fmt(v)}</p>
                <p className="text-[10px] text-neutral-500">per month</p>
              </div>
            ))}
          </div>
          <div className="border border-neutral-500/30 rounded-2xl p-4">
            <div className="flex items-center gap-3 mb-3">
              <Badge color={result.monetization_status === 'monetized' ? 'green' : 'yellow'}>
                {result.monetization_status}
              </Badge>
              <Badge color="neutral">{result.growth_tier} creator</Badge>
            </div>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div>
                <p className="text-xs text-neutral-500 mb-1">CPM Estimate</p>
                <p className="text-sm font-medium">{fmt(result.cpm_estimate_inr)}</p>
              </div>
              <div>
                <p className="text-xs text-neutral-500 mb-1">RPM Estimate</p>
                <p className="text-sm font-medium">{fmt(result.rpm_estimate_inr)}</p>
              </div>
            </div>
            <div>
              <p className="text-xs text-neutral-400 mb-2 font-medium">Revenue Tips</p>
              <ul className="space-y-1">
                {result.revenue_tips?.map((t, i) => (
                  <li key={i} className="text-xs text-neutral-400 flex items-start gap-2">
                    <span className="text-neutral-600 mt-0.5">•</span>{t}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export function Retention({ creatorId }) {
  const [videoId, setVideoId] = useState('')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)

  const [doctorIndex, setDoctorIndex] = useState(null)
  const [doctorResult, setDoctorResult] = useState(null)
  const [doctorLoading, setDoctorLoading] = useState(false)

  async function handle() {
    setLoading(true)
    setDoctorIndex(null)
    setDoctorResult(null)
    try {
      const res = await getRetention({ creator_id: creatorId, video_id: videoId.trim() })
      setResult(res.data)
    } catch (e) {
      alert(e.response?.data?.error || 'Error')
    } finally {
      setLoading(false)
    }
  }

  async function handleDoctorFix(timestamp, reason, index) {
    setDoctorIndex(index)
    setDoctorResult(null)
    setDoctorLoading(true)
    try {
      const res = await fixScriptAtTimestamp({
        timestamp,
        reason,
        title: result.title
      })
      setDoctorResult(res.data)
    } catch (e) {
      alert(e.response?.data?.error || 'Failed to rewrite script segment')
      setDoctorIndex(null)
    } finally {
      setDoctorLoading(false)
    }
  }

  return (
    <div className="space-y-4 text-black">
      <div>
        <h2 className="text-lg font-semibold mb-1">Retention Predictor</h2>
        <p className="text-neutral-400 text-sm">Predict where your audience drops off and how to fix it.</p>
      </div>
      <div className="border border-neutral-500/30 rounded-2xl p-4 space-y-3 bg-white">
        <input value={videoId} onChange={e => setVideoId(e.target.value)} placeholder="YouTube Video ID"
          className="w-full bg-white border border-neutral-500/30 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-black transition-colors text-black" />
        <button onClick={handle} disabled={loading || !videoId.trim()}
          className="flex items-center gap-2 bg-black text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-neutral-800 transition-colors disabled:opacity-50">
          {loading ? <Loader2 size={14} className="animate-spin" /> : <BarChart2 size={14} />}
          {loading ? 'Analyzing...' : 'Analyze Retention'}
        </button>
      </div>
      {result && (
        <div className="space-y-3">
          <div className="border border-neutral-500/30 rounded-2xl p-4 bg-white">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="font-semibold truncate max-w-xs text-black">{result.title}</p>
                <p className="text-xs text-neutral-500 mt-0.5">{result.duration}</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-black">{result.retention_score}</p>
                <p className="text-xs text-neutral-500">retention score</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3 mb-4">
              {[
                ['Views', result.raw_metrics?.views?.toLocaleString()],
                ['Avg View %', `${result.raw_metrics?.avg_view_percentage?.toFixed(1)}%`],
                ['Avg Duration', `${Math.round(result.raw_metrics?.avg_view_duration_seconds)}s`],
              ].map(([l, v]) => (
                <div key={l} className="bg-neutral-50 rounded-xl p-3 text-center">
                  <p className="text-sm font-semibold text-black">{v}</p>
                  <p className="text-[10px] text-neutral-500">{l}</p>
                </div>
              ))}
            </div>
            <Badge>{result.performance}</Badge>
          </div>
          {result.predicted_drop_points?.length > 0 && (
            <div className="border border-neutral-500/30 rounded-2xl p-4 bg-white">
              <h3 className="text-sm font-semibold mb-3 text-black">Predicted Drop Points</h3>
              <div className="space-y-3">
                {result.predicted_drop_points.map((d, i) => (
                  <div key={i} className="border-b border-neutral-200 pb-3 last:border-0 last:pb-0 text-left">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <span className="text-xs font-mono bg-neutral-100 text-black px-2 py-0.5 rounded shrink-0">{d.timestamp}</span>
                        <div>
                          <p className="text-xs text-neutral-700 font-medium">{d.reason}</p>
                          <div className="flex items-center gap-1.5 mt-1">
                            <Badge>{d.severity}</Badge>
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDoctorFix(d.timestamp, d.reason, i)}
                        disabled={doctorLoading}
                        className="bg-black hover:bg-neutral-800 disabled:opacity-50 text-white rounded-lg px-2.5 py-1 text-[10px] font-bold tracking-wide uppercase transition shrink-0 flex items-center gap-1"
                      >
                        Script Doctor
                      </button>
                    </div>
                    {doctorIndex === i && (
                      <div className="mt-3 bg-neutral-50 border border-neutral-500/30 rounded-xl p-3.5 space-y-2 text-left">
                        {doctorLoading && (
                          <div className="flex items-center gap-2 text-xs text-neutral-500">
                            <Loader2 size={12} className="animate-spin" />
                            <span>Script Doctor is rewriting segment copy...</span>
                          </div>
                        )}
                        {!doctorLoading && doctorResult && (
                          <div className="space-y-2.5">
                            <div className="flex items-center justify-between border-b border-neutral-200 pb-1.5">
                              <p className="text-[9px] font-bold text-neutral-500 uppercase tracking-wider">Suggested Script Rewrite ({d.timestamp})</p>
                              <button
                                onClick={() => { navigator.clipboard.writeText(doctorResult.rewritten_script); alert('Copied!'); }}
                                className="text-[9px] bg-black text-white px-2 py-0.5 rounded transition hover:bg-neutral-800"
                              >
                                Copy Script
                              </button>
                            </div>
                            <p className="text-xs text-neutral-700 leading-relaxed italic">"{doctorResult.rewritten_script}"</p>
                            {doctorResult.writer_tip && (
                              <div className="bg-white border border-neutral-500/30 rounded-lg p-2.5 text-[10px] text-neutral-600">
                                <span className="font-bold text-black block mb-0.5">Presentation Tip:</span>
                                {doctorResult.writer_tip}
                              </div>
                            )}
                            <button
                              onClick={() => { setDoctorIndex(null); setDoctorResult(null); }}
                              className="text-[10px] text-neutral-400 hover:text-black underline font-medium block mt-1"
                            >
                              Close Suggestion
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
          {result.improvements?.length > 0 && (
            <div className="border border-neutral-500/30 rounded-2xl p-4 bg-white">
              <h3 className="text-sm font-semibold mb-3 text-black">Improvements</h3>
              <ul className="space-y-1.5">
                {result.improvements.map((imp, i) => (
                  <li key={i} className="text-xs text-neutral-600 flex items-start gap-2">
                    <span className="text-neutral-400 mt-0.5">•</span>{imp}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export function FakeScan({ creatorId }) {
  const [channelId, setChannelId] = useState('')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)

  async function handle() {
    setLoading(true)
    try {
      const res = await fakeScan({ creator_id: creatorId, channel_id: channelId.trim() || undefined })
      setResult(res.data)
    } catch (e) {
      alert(e.response?.data?.error || 'Error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold mb-1">Fake Follower Scanner</h2>
        <p className="text-neutral-400 text-sm">Detect fake engagement on any YouTube channel.</p>
      </div>
      <div className="border border-neutral-500/30 rounded-2xl p-4 space-y-3 bg-white">
        <input value={channelId} onChange={e => setChannelId(e.target.value)} placeholder="Channel ID (leave empty to scan your own)"
          className="w-full bg-white border border-neutral-500/30 rounded-xl px-4 py-2.5 text-sm text-black focus:outline-none focus:border-black transition-colors" />
        <button onClick={handle} disabled={loading}
          className="flex items-center gap-2 bg-black text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-neutral-800 transition-colors disabled:opacity-50">
          {loading ? <Loader2 size={14} className="animate-spin" /> : <Shield size={14} />}
          {loading ? 'Scanning...' : 'Scan Channel'}
        </button>
      </div>
      {result && (
        <div className="space-y-3">
          <div className="border border-neutral-500/30 rounded-2xl p-4">
            <div className="flex items-center gap-3 mb-4">
              <img src={result.profile_picture} alt="" className="w-10 h-10 rounded-full bg-neutral-800" />
              <div>
                <p className="font-semibold">{result.channel_title}</p>
                <Badge>{result.verdict}</Badge>
              </div>
              <div className="ml-auto text-right">
                <p className="text-2xl font-bold">{result.authenticity_score}</p>
                <p className="text-xs text-neutral-500">authenticity score</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3 mb-4">
              {[
                ['Fake Est.', `${result.fake_follower_estimate_percent}%`],
                ['Engagement', `${result.engagement_rate}%`],
                ['Comment Quality', result.comment_quality],
              ].map(([l, v]) => (
                <div key={l} className="bg-neutral-50 rounded-xl p-3 text-center">
                  <p className="text-sm font-semibold text-black">{v}</p>
                  <p className="text-[10px] text-neutral-500">{l}</p>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-3">
              {result.red_flags?.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-black mb-1.5">Red Flags</p>
                  <ul className="space-y-1">
                    {result.red_flags.map((f, i) => <li key={i} className="text-xs text-neutral-500">• {f}</li>)}
                  </ul>
                </div>
              )}
              {result.green_flags?.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-black mb-1.5">Green Flags</p>
                  <ul className="space-y-1">
                    {result.green_flags.map((f, i) => <li key={i} className="text-xs text-neutral-500">• {f}</li>)}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
