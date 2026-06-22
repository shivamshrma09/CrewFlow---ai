import { useEffect, useState } from 'react'
import {
  getTrends, getHashtagROI, analyzeMetadata, improveHook, getLiveTrends
} from '../../lib/api'
import {
  TrendingUp, Hash, FileText, Zap, Loader2, Copy, Check,
  Flame, RefreshCw, ChevronRight, Sparkles, AlertCircle
} from 'lucide-react'

const TOOLS = [
  { id: 'live', label: 'Live Trends', icon: Flame },
  { id: 'hashtags', label: 'Hashtag ROI', icon: Hash },
  { id: 'metadata', label: 'Title & Description', icon: FileText },
  { id: 'hooks', label: 'Hook Improver', icon: Zap },
]

function scoreColor(score) {
  if (score >= 80) return 'text-green-600 bg-green-50 border-green-200'
  if (score >= 60) return 'text-yellow-600 bg-yellow-50 border-yellow-200'
  if (score >= 40) return 'text-orange-600 bg-orange-50 border-orange-200'
  return 'text-red-600 bg-red-50 border-red-200'
}

function CopyBtn({ text, id, copied, setCopied }) {
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text); setCopied(id); setTimeout(() => setCopied(null), 1500) }}
      className="shrink-0 p-1.5 rounded-lg hover:bg-neutral-100 transition-colors"
    >
      {copied === id ? <Check size={13} className="text-green-600" /> : <Copy size={13} className="text-neutral-400" />}
    </button>
  )
}

export default function TrendHub({ creatorId }) {
  const [tool, setTool] = useState('live')
  const [copied, setCopied] = useState(null)

  // Live trends
  const [liveTrends, setLiveTrends] = useState(null)
  const [liveLoading, setLiveLoading] = useState(true)
  const [niche, setNiche] = useState('')
  const [platform, setPlatform] = useState('youtube_shorts')
  const [language, setLanguage] = useState('hinglish')
  const [trendResult, setTrendResult] = useState(null)
  const [trendLoading, setTrendLoading] = useState(false)

  // Hashtags
  const [hashtagInput, setHashtagInput] = useState('')
  const [hashtagResult, setHashtagResult] = useState(null)
  const [hashtagLoading, setHashtagLoading] = useState(false)

  // Metadata
  const [metaForm, setMetaForm] = useState({ title: '', description: '', tags: '', niche: '' })
  const [metaResult, setMetaResult] = useState(null)
  const [metaLoading, setMetaLoading] = useState(false)

  // Hooks
  const [hookForm, setHookForm] = useState({ title: '', description: '', current_hook: '', niche: '' })
  const [hookResult, setHookResult] = useState(null)
  const [hookLoading, setHookLoading] = useState(false)

  useEffect(() => {
    getLiveTrends()
      .then(r => setLiveTrends(r.data))
      .catch(() => setLiveTrends(null))
      .finally(() => setLiveLoading(false))

    const saved = sessionStorage.getItem('crewflow_meta_prefill')
    if (saved) {
      try {
        const p = JSON.parse(saved)
        setMetaForm(f => ({ ...f, title: p.title || '', description: p.description || '', tags: p.tags || '' }))
        setHookForm(f => ({ ...f, title: p.title || '', description: p.description || '' }))
        if (p.title) setTool('metadata')
        sessionStorage.removeItem('crewflow_meta_prefill')
      } catch { /* ignore */ }
    }
  }, [])

  async function fetchAITrends() {
    if (!niche.trim()) return
    setTrendLoading(true)
    try {
      const res = await getTrends({ creator_id: creatorId, niche, platform, language })
      setTrendResult(res.data)
    } catch (e) {
      alert(e.response?.data?.error || 'Error fetching trends')
    } finally {
      setTrendLoading(false)
    }
  }

  async function calcHashtags() {
    const tags = hashtagInput.split(',').map(t => t.trim()).filter(Boolean)
    if (!tags.length) return
    setHashtagLoading(true)
    try {
      const res = await getHashtagROI({ creator_id: creatorId, hashtags: tags })
      setHashtagResult(res.data)
    } catch (e) {
      alert(e.response?.data?.error || 'Error')
    } finally {
      setHashtagLoading(false)
    }
  }

  async function analyzeMeta() {
    if (!metaForm.title.trim()) return
    setMetaLoading(true)
    try {
      const tags = metaForm.tags.split(',').map(t => t.trim()).filter(Boolean)
      const res = await analyzeMetadata({
        title: metaForm.title,
        description: metaForm.description,
        tags,
        niche: metaForm.niche,
        language,
      })
      setMetaResult(res.data)
    } catch (e) {
      alert(e.response?.data?.error || 'Error')
    } finally {
      setMetaLoading(false)
    }
  }

  async function improveHooks() {
    if (!hookForm.title.trim()) return
    setHookLoading(true)
    try {
      const res = await improveHook({ ...hookForm, language })
      setHookResult(res.data)
    } catch (e) {
      alert(e.response?.data?.error || 'Error')
    } finally {
      setHookLoading(false)
    }
  }

  const roiColor = (score) => score >= 70 ? 'text-green-600' : score >= 40 ? 'text-yellow-600' : 'text-red-600'

  return (
    <div className="space-y-5 pb-10">
      {/* Header */}
      <div className="mt-10 rounded-2xl border border-neutral-500/30 bg-white p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-neutral-500">Growth</p>
        <h2 className="mt-1 text-2xl font-semibold text-black">Trend Intelligence</h2>
        <p className="mt-1 text-sm text-neutral-500">
          Live trends, AI content ideas, hashtag ROI, title optimizer & hook improver — sab ek jagah.
        </p>
      </div>

      {/* Tool tabs */}
      <div className="flex flex-wrap gap-2">
        {TOOLS.map(t => (
          <button
            key={t.id}
            onClick={() => setTool(t.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border transition-all ${
              tool === t.id
                ? 'bg-black text-white border-black'
                : 'bg-white text-neutral-600 border-neutral-200 hover:border-neutral-400'
            }`}
          >
            <t.icon size={15} />
            {t.label}
          </button>
        ))}
      </div>

      {/* LIVE TRENDS */}
      {tool === 'live' && (
        <div className="space-y-5">
          {/* India daily trends */}
          <div className="rounded-2xl border border-neutral-500/30 bg-white p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm font-semibold text-black flex items-center gap-2">
                  <Flame size={16} className="text-orange-500" /> Trending in India Right Now
                </p>
                <p className="text-xs text-neutral-500 mt-0.5">
                  {liveTrends?.fetched_at
                    ? `Updated ${new Date(liveTrends.fetched_at).toLocaleTimeString()}`
                    : 'Real-time Google Trends data'}
                </p>
              </div>
              <button
                onClick={() => { setLiveLoading(true); getLiveTrends().then(r => setLiveTrends(r.data)).finally(() => setLiveLoading(false)) }}
                className="flex items-center gap-1.5 text-xs border border-neutral-200 px-3 py-1.5 rounded-lg hover:bg-neutral-50"
              >
                <RefreshCw size={12} className={liveLoading ? 'animate-spin' : ''} /> Refresh
              </button>
            </div>

            {liveLoading ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 size={20} className="animate-spin text-neutral-400" />
              </div>
            ) : liveTrends?.daily?.length ? (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {liveTrends.daily.map((t, i) => (
                  <div key={i} className="rounded-xl border border-neutral-100 bg-neutral-50 p-4 hover:border-neutral-300 transition-colors">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium text-black leading-snug">{t.title}</p>
                      <span className="text-[10px] font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full shrink-0">#{i + 1}</span>
                    </div>
                    {t.traffic && <p className="text-xs text-neutral-500 mt-1">{t.traffic} searches</p>}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-neutral-400 py-6 text-center">No live trends available right now</p>
            )}

            {(liveTrends?.related_topics?.length > 0 || liveTrends?.related_queries?.length > 0) && (
              <div className="mt-5 pt-5 border-t border-neutral-100">
                <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-3">Related Topics & Queries</p>
                <div className="flex flex-wrap gap-2">
                  {[...(liveTrends.related_topics || []).map(t => t.topic), ...(liveTrends.related_queries || []).map(q => q.query)]
                    .filter(Boolean).slice(0, 12).map((item, i) => (
                      <span key={i} className="text-xs border border-neutral-200 text-neutral-600 px-3 py-1 rounded-full">{item}</span>
                    ))}
                </div>
              </div>
            )}
          </div>

          {/* AI Trend Jacking */}
          <div className="rounded-2xl border border-neutral-500/30 bg-white p-5 space-y-4">
            <div>
              <p className="text-sm font-semibold text-black flex items-center gap-2">
                <Sparkles size={16} /> AI Content Suggestions for Your Niche
              </p>
              <p className="text-xs text-neutral-500 mt-0.5">Enter your niche — AI will jack current trends and write ready-to-shoot scripts</p>
            </div>
            <div className="grid sm:grid-cols-3 gap-3">
              <input
                value={niche}
                onChange={e => setNiche(e.target.value)}
                placeholder="Your niche e.g. finance, fitness, tech"
                className="sm:col-span-1 border border-neutral-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-neutral-400"
              />
              <select value={platform} onChange={e => setPlatform(e.target.value)}
                className="border border-neutral-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none">
                {['youtube_shorts', 'instagram_reels', 'youtube', 'linkedin'].map(p => (
                  <option key={p} value={p}>{p.replace('_', ' ')}</option>
                ))}
              </select>
              <select value={language} onChange={e => setLanguage(e.target.value)}
                className="border border-neutral-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none">
                {['hinglish', 'hindi', 'english'].map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
            <button
              onClick={fetchAITrends}
              disabled={trendLoading || !niche.trim()}
              className="flex items-center gap-2 bg-black text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-neutral-800 disabled:opacity-50"
            >
              {trendLoading ? <Loader2 size={14} className="animate-spin" /> : <TrendingUp size={14} />}
              {trendLoading ? 'Generating...' : 'Get AI Scripts'}
            </button>

            {trendResult && (
              <div className="space-y-4 pt-2">
                {trendResult.trend_urgency && (
                  <div className="flex items-center gap-2 text-xs bg-orange-50 border border-orange-200 text-orange-700 px-3 py-2 rounded-xl">
                    <AlertCircle size={13} />
                    Urgency: {trendResult.trend_urgency} · Best time: {trendResult.best_posting_time}
                  </div>
                )}

                {trendResult.top_trends_to_use?.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-neutral-500 uppercase">Top Trends to Use</p>
                    {trendResult.top_trends_to_use.map((t, i) => (
                      <div key={i} className="rounded-xl border border-neutral-100 p-3">
                        <p className="text-sm font-medium text-black">{t.trend}</p>
                        <p className="text-xs text-neutral-500 mt-1">{t.relevance_to_niche}</p>
                        <p className="text-xs text-neutral-600 mt-1 flex items-center gap-1">
                          <ChevronRight size={11} /> Angle: {t.viral_angle}
                        </p>
                      </div>
                    ))}
                  </div>
                )}

                {trendResult.scripts?.map((s, i) => (
                  <div key={i} className="rounded-xl border border-neutral-200 p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="font-semibold text-sm text-black">{s.title}</p>
                        <p className="text-xs text-neutral-500">Trend: {s.trend}</p>
                      </div>
                      <CopyBtn text={`${s.hook}\n\n${s.script}\n\n${s.cta}`} id={`script-${i}`} copied={copied} setCopied={setCopied} />
                    </div>
                    <div className="bg-neutral-50 rounded-xl p-3 mb-3">
                      <p className="text-[10px] font-semibold text-neutral-400 uppercase mb-1">Hook</p>
                      <p className="text-sm font-medium text-black">{s.hook}</p>
                    </div>
                    <p className="text-sm text-neutral-700 whitespace-pre-wrap mb-3">{s.script}</p>
                    {s.cta && <p className="text-xs text-neutral-500 mb-2">CTA: {s.cta}</p>}
                    <div className="flex flex-wrap gap-1.5">
                      {s.hashtags?.map(h => <span key={h} className="text-xs text-neutral-500">{h}</span>)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* HASHTAG ROI */}
      {tool === 'hashtags' && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-neutral-500/30 bg-white p-5 space-y-4">
            <div>
              <p className="text-sm font-semibold text-black">Hashtag ROI Calculator</p>
              <p className="text-xs text-neutral-500">Competition, trend interest aur reach score — kaunsa hashtag use karein</p>
            </div>
            <input
              value={hashtagInput}
              onChange={e => setHashtagInput(e.target.value)}
              placeholder="#motivation, #finance, #india, #studytips"
              className="w-full border border-neutral-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-neutral-400"
            />
            <button
              onClick={calcHashtags}
              disabled={hashtagLoading || !hashtagInput.trim()}
              className="flex items-center gap-2 bg-black text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-neutral-800 disabled:opacity-50"
            >
              {hashtagLoading ? <Loader2 size={14} className="animate-spin" /> : <Hash size={14} />}
              Calculate ROI
            </button>
          </div>

          {hashtagResult && (
            <div className="space-y-3">
              {hashtagResult.recommended_set?.length > 0 && (
                <div className="rounded-2xl border border-green-200 bg-green-50 p-4">
                  <p className="text-sm font-semibold text-green-700 mb-2">Recommended Set</p>
                  <div className="flex flex-wrap gap-2">
                    {hashtagResult.recommended_set.map(t => (
                      <span key={t} className="text-xs bg-white text-green-700 border border-green-200 px-3 py-1 rounded-full">{t}</span>
                    ))}
                  </div>
                </div>
              )}
              {hashtagResult.hashtags?.map(h => (
                <div key={h.hashtag} className="rounded-2xl border border-neutral-200 bg-white p-4 flex items-center gap-4">
                  <div className="w-14 text-center shrink-0">
                    <p className={`text-xl font-bold ${roiColor(h.roi_score)}`}>{h.roi_score}</p>
                    <p className="text-[10px] text-neutral-500">ROI</p>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-sm font-medium text-black">{h.hashtag}</span>
                      <span className={`text-[10px] border px-1.5 py-0.5 rounded-full capitalize ${
                        h.recommendation === 'use' ? 'border-green-300 text-green-600' :
                        h.recommendation === 'avoid' ? 'border-red-300 text-red-600' :
                        'border-yellow-300 text-yellow-600'
                      }`}>{h.recommendation}</span>
                    </div>
                    <p className="text-xs text-neutral-500">{h.reason}</p>
                  </div>
                  <div className="text-right text-xs text-neutral-500 shrink-0">
                    <p>{h.competition}</p>
                    <p>{h.best_posting_time}</p>
                  </div>
                </div>
              ))}
              {hashtagResult.strategy && (
                <div className="rounded-2xl border border-neutral-200 bg-white p-4">
                  <p className="text-xs font-semibold text-neutral-500 mb-1">Strategy</p>
                  <p className="text-sm text-neutral-700">{hashtagResult.strategy}</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* METADATA OPTIMIZER */}
      {tool === 'metadata' && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-neutral-500/30 bg-white p-5 space-y-4">
            <div>
              <p className="text-sm font-semibold text-black">Title & Description Optimizer</p>
              <p className="text-xs text-neutral-500">AI rate karega aur better title, description, tags suggest karega</p>
            </div>
            {[
              ['title', 'Video Title', 'Enter your video title'],
              ['niche', 'Niche (optional)', 'e.g. finance, comedy'],
            ].map(([k, l, p]) => (
              <div key={k}>
                <label className="text-xs text-neutral-500 mb-1 block">{l}</label>
                <input
                  value={metaForm[k]}
                  onChange={e => setMetaForm(f => ({ ...f, [k]: e.target.value }))}
                  placeholder={p}
                  className="w-full border border-neutral-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-neutral-400"
                />
              </div>
            ))}
            <div>
              <label className="text-xs text-neutral-500 mb-1 block">Description</label>
              <textarea
                value={metaForm.description}
                onChange={e => setMetaForm(f => ({ ...f, description: e.target.value }))}
                rows={4}
                placeholder="Paste your video description..."
                className="w-full border border-neutral-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-neutral-400 resize-none"
              />
            </div>
            <div>
              <label className="text-xs text-neutral-500 mb-1 block">Tags (comma separated)</label>
              <input
                value={metaForm.tags}
                onChange={e => setMetaForm(f => ({ ...f, tags: e.target.value }))}
                placeholder="motivation, india, finance tips"
                className="w-full border border-neutral-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-neutral-400"
              />
            </div>
            <button
              onClick={analyzeMeta}
              disabled={metaLoading || !metaForm.title.trim()}
              className="flex items-center gap-2 bg-black text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-neutral-800 disabled:opacity-50"
            >
              {metaLoading ? <Loader2 size={14} className="animate-spin" /> : <FileText size={14} />}
              Analyze & Improve
            </button>
          </div>

          {metaResult && (
            <div className="space-y-4">
              <div className="grid sm:grid-cols-4 gap-3">
                {[
                  { label: 'Overall', score: metaResult.overall_score },
                  { label: 'Title', score: metaResult.title?.score },
                  { label: 'Description', score: metaResult.description?.score },
                  { label: 'Tags', score: metaResult.tags_score },
                ].map(s => (
                  <div key={s.label} className={`rounded-2xl border p-4 text-center ${scoreColor(s.score || 0)}`}>
                    <p className="text-2xl font-bold">{s.score ?? '—'}</p>
                    <p className="text-xs mt-1 opacity-70">{s.label}</p>
                  </div>
                ))}
              </div>

              {metaResult.seo_grade && (
                <div className="rounded-2xl border border-neutral-200 bg-white p-4 flex items-center gap-3">
                  <span className="text-3xl font-bold text-black">{metaResult.seo_grade}</span>
                  <p className="text-sm text-neutral-600">SEO Grade — {metaResult.quick_wins?.[0] || 'Review suggestions below'}</p>
                </div>
              )}

              {metaResult.quick_wins?.length > 0 && (
                <div className="rounded-2xl border border-neutral-200 bg-white p-4">
                  <p className="text-xs font-semibold text-neutral-500 uppercase mb-2">Quick Wins</p>
                  <ul className="space-y-1.5">
                    {metaResult.quick_wins.map((w, i) => (
                      <li key={i} className="text-sm text-neutral-700 flex items-start gap-2">
                        <span className="text-green-600 shrink-0">✓</span> {w}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="rounded-2xl border border-neutral-200 bg-white p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-semibold text-black">Improved Title</p>
                  <CopyBtn text={metaResult.improved_title} id="imp-title" copied={copied} setCopied={setCopied} />
                </div>
                <p className="text-sm text-neutral-800 bg-neutral-50 rounded-xl p-3">{metaResult.improved_title}</p>
                {metaResult.title_alternatives?.length > 0 && (
                  <div className="mt-3 space-y-1">
                    <p className="text-xs text-neutral-500">Alternatives:</p>
                    {metaResult.title_alternatives.map((t, i) => (
                      <p key={i} className="text-xs text-neutral-600">• {t}</p>
                    ))}
                  </div>
                )}
              </div>

              <div className="rounded-2xl border border-neutral-200 bg-white p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-semibold text-black">Improved Description</p>
                  <CopyBtn text={metaResult.improved_description} id="imp-desc" copied={copied} setCopied={setCopied} />
                </div>
                <p className="text-sm text-neutral-700 whitespace-pre-wrap bg-neutral-50 rounded-xl p-3">{metaResult.improved_description}</p>
              </div>

              {metaResult.recommended_tags?.length > 0 && (
                <div className="rounded-2xl border border-neutral-200 bg-white p-4">
                  <p className="text-sm font-semibold text-black mb-2">Recommended Tags</p>
                  <div className="flex flex-wrap gap-2">
                    {metaResult.recommended_tags.map(t => (
                      <span key={t} className="text-xs bg-neutral-100 text-neutral-700 px-2.5 py-1 rounded-full">{t}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* HOOK IMPROVER */}
      {tool === 'hooks' && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-neutral-500/30 bg-white p-5 space-y-4">
            <div>
              <p className="text-sm font-semibold text-black">Hook Improver</p>
              <p className="text-xs text-neutral-500">Apne video ka opening hook improve karo — AI 5 viral alternatives dega</p>
            </div>
            {[
              ['title', 'Video Title', 'Your video title'],
              ['current_hook', 'Current Hook (optional)', 'What you say in first 3 seconds'],
              ['niche', 'Niche (optional)', 'e.g. tech, lifestyle'],
            ].map(([k, l, p]) => (
              <div key={k}>
                <label className="text-xs text-neutral-500 mb-1 block">{l}</label>
                <input
                  value={hookForm[k]}
                  onChange={e => setHookForm(f => ({ ...f, [k]: e.target.value }))}
                  placeholder={p}
                  className="w-full border border-neutral-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-neutral-400"
                />
              </div>
            ))}
            <div>
              <label className="text-xs text-neutral-500 mb-1 block">Description (optional)</label>
              <textarea
                value={hookForm.description}
                onChange={e => setHookForm(f => ({ ...f, description: e.target.value }))}
                rows={3}
                placeholder="Brief description for context..."
                className="w-full border border-neutral-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-neutral-400 resize-none"
              />
            </div>
            <button
              onClick={improveHooks}
              disabled={hookLoading || !hookForm.title.trim()}
              className="flex items-center gap-2 bg-black text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-neutral-800 disabled:opacity-50"
            >
              {hookLoading ? <Loader2 size={14} className="animate-spin" /> : <Zap size={14} />}
              Improve Hooks
            </button>
          </div>

          {hookResult && (
            <div className="space-y-4">
              {hookResult.current_hook_analysis && hookForm.current_hook && (
                <div className="rounded-2xl border border-neutral-200 bg-white p-4">
                  <p className="text-xs text-neutral-500 mb-1">Current Hook Score</p>
                  <p className={`text-2xl font-bold ${roiColor(hookResult.current_hook_analysis.score)}`}>
                    {hookResult.current_hook_analysis.score}/100
                  </p>
                  <p className="text-sm text-neutral-600 mt-1">{hookResult.current_hook_analysis.why_it_works_or_fails}</p>
                </div>
              )}

              {hookResult.best_pick && (
                <div className="rounded-2xl border-2 border-black bg-white p-4">
                  <p className="text-xs font-semibold text-neutral-500 uppercase mb-1">Best Pick</p>
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-base font-semibold text-black">{hookResult.best_pick}</p>
                    <CopyBtn text={hookResult.best_pick} id="best-hook" copied={copied} setCopied={setCopied} />
                  </div>
                  {hookResult.thumbnail_text && (
                    <p className="text-xs text-neutral-500 mt-2">Thumbnail: "{hookResult.thumbnail_text}"</p>
                  )}
                  {hookResult.delivery_tip && (
                    <p className="text-xs text-neutral-600 mt-2 bg-neutral-50 rounded-lg p-2">{hookResult.delivery_tip}</p>
                  )}
                </div>
              )}

              {hookResult.improved_hooks?.map((h, i) => (
                <div key={i} className="rounded-2xl border border-neutral-200 bg-white p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-bold text-neutral-400">#{i + 1}</span>
                        <span className="text-[10px] border border-neutral-200 px-2 py-0.5 rounded-full capitalize">{h.style}</span>
                        <span className={`text-xs font-bold ${roiColor(h.score)}`}>{h.score}</span>
                      </div>
                      <p className="text-sm font-medium text-black">{h.hook}</p>
                      <p className="text-xs text-neutral-500 mt-1">{h.why_viral}</p>
                    </div>
                    <CopyBtn text={h.hook} id={`hook-${i}`} copied={copied} setCopied={setCopied} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
