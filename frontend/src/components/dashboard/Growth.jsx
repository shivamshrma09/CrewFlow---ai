import { useState } from 'react'
import { getTrends, getHashtagROI, findCollaborators } from '../../lib/api'
import { TrendingUp, Hash, Users, Loader2, Copy, Check } from 'lucide-react'

export function Trends({ creatorId }) {
  const [niche, setNiche] = useState('')
  const [platform, setPlatform] = useState('youtube_shorts')
  const [language, setLanguage] = useState('hinglish')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(null)

  async function handle() {
    setLoading(true)
    try {
      const res = await getTrends({ creator_id: creatorId, niche, platform, language })
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
        <h2 className="text-lg font-semibold mb-1">Trend Jacking Engine</h2>
        <p className="text-neutral-400 text-sm">Detect real-time trends and get ready-made short-form scripts.</p>
      </div>
      <div className="border border-neutral-500/30 rounded-2xl p-4 space-y-3">
        <div>
          <label className="text-xs text-neutral-400 mb-1.5 block">Your Niche</label>
          <input value={niche} onChange={e => setNiche(e.target.value)} placeholder="e.g. finance, tech, fitness"
            className="w-full bg-neutral-900 border border-neutral-500/30 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-neutral-400 transition-colors" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-neutral-400 mb-1.5 block">Platform</label>
            <select value={platform} onChange={e => setPlatform(e.target.value)}
              className="w-full bg-neutral-900 border border-neutral-500/30 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-neutral-400 transition-colors">
              {['youtube_shorts', 'instagram_reels', 'youtube', 'linkedin'].map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-neutral-400 mb-1.5 block">Language</label>
            <select value={language} onChange={e => setLanguage(e.target.value)}
              className="w-full bg-neutral-900 border border-neutral-500/30 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-neutral-400 transition-colors">
              {['hinglish', 'hindi', 'english'].map(l => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>
        </div>
        <button onClick={handle} disabled={loading || !niche.trim()}
          className="flex items-center gap-2 bg-white text-black px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-neutral-200 transition-colors disabled:opacity-50">
          {loading ? <Loader2 size={14} className="animate-spin" /> : <TrendingUp size={14} />}
          {loading ? 'Finding Trends...' : 'Find Trends'}
        </button>
      </div>
      {result && (
        <div className="space-y-3">
          {result.raw_trends?.daily?.length > 0 && (
            <div className="border border-neutral-500/30 rounded-2xl p-4">
              <h3 className="text-sm font-semibold mb-3">🔥 Trending Now in India</h3>
              <div className="flex flex-wrap gap-2">
                {result.raw_trends.daily.map((t, i) => (
                  <span key={i} className="text-xs border border-neutral-500/30 px-3 py-1 rounded-full text-neutral-300">
                    {t.title} <span className="text-neutral-500">{t.traffic}</span>
                  </span>
                ))}
              </div>
            </div>
          )}
          {result.scripts?.map((s, i) => (
            <div key={i} className="border border-neutral-500/30 rounded-2xl p-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-semibold text-sm">{s.title}</p>
                  <p className="text-xs text-neutral-500 mt-0.5">Trend: {s.trend}</p>
                </div>
                <button onClick={() => { navigator.clipboard.writeText(s.script); setCopied(i); setTimeout(() => setCopied(null), 1500) }}>
                  {copied === i ? <Check size={13} className="text-green-400" /> : <Copy size={13} className="text-neutral-500" />}
                </button>
              </div>
              <div className="bg-neutral-900 rounded-xl p-3 mb-3">
                <p className="text-xs text-neutral-500 mb-1">Hook</p>
                <p className="text-sm font-medium text-white">{s.hook}</p>
              </div>
              <p className="text-sm text-neutral-300 whitespace-pre-wrap mb-3">{s.script}</p>
              <div className="flex flex-wrap gap-1.5">
                {s.hashtags?.map(h => <span key={h} className="text-xs text-neutral-500">{h}</span>)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export function Hashtags({ creatorId }) {
  const [input, setInput] = useState('')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)

  async function handle() {
    const tags = input.split(',').map(t => t.trim()).filter(Boolean)
    if (!tags.length) return
    setLoading(true)
    try {
      const res = await getHashtagROI({ creator_id: creatorId, hashtags: tags })
      setResult(res.data)
    } catch (e) {
      alert(e.response?.data?.error || 'Error')
    } finally {
      setLoading(false)
    }
  }

  const roiColor = (score) => score >= 70 ? 'text-green-400' : score >= 40 ? 'text-yellow-400' : 'text-red-400'

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold mb-1">Hashtag ROI Calculator</h2>
        <p className="text-neutral-400 text-sm">Find which hashtags give you the best reach vs competition ratio.</p>
      </div>
      <div className="border border-neutral-500/30 rounded-2xl p-4 space-y-3">
        <div>
          <label className="text-xs text-neutral-400 mb-1.5 block">Hashtags (comma separated)</label>
          <input value={input} onChange={e => setInput(e.target.value)}
            placeholder="#motivation, #finance, #india, #studymotivation"
            className="w-full bg-neutral-900 border border-neutral-500/30 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-neutral-400 transition-colors" />
        </div>
        <button onClick={handle} disabled={loading || !input.trim()}
          className="flex items-center gap-2 bg-white text-black px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-neutral-200 transition-colors disabled:opacity-50">
          {loading ? <Loader2 size={14} className="animate-spin" /> : <Hash size={14} />}
          {loading ? 'Calculating...' : 'Calculate ROI'}
        </button>
      </div>
      {result && (
        <div className="space-y-3">
          {result.recommended_set?.length > 0 && (
            <div className="border border-green-500/20 bg-green-500/5 rounded-2xl p-4">
              <h3 className="text-sm font-semibold text-green-400 mb-2">✅ Recommended Set</h3>
              <div className="flex flex-wrap gap-2">
                {result.recommended_set.map(t => <span key={t} className="text-xs bg-green-500/10 text-green-400 border border-green-500/20 px-3 py-1 rounded-full">{t}</span>)}
              </div>
            </div>
          )}
          <div className="space-y-2">
            {result.hashtags?.map((h) => (
              <div key={h.hashtag} className="border border-neutral-500/30 rounded-xl p-4 flex items-center gap-4">
                <div className="w-12 text-center">
                  <p className={`text-lg font-bold ${roiColor(h.roi_score)}`}>{h.roi_score}</p>
                  <p className="text-[10px] text-neutral-500">ROI</p>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-sm font-medium">{h.hashtag}</span>
                    <span className={`text-[10px] border px-1.5 py-0.5 rounded-full ${h.recommendation === 'use' ? 'border-green-500/30 text-green-400' : h.recommendation === 'avoid' ? 'border-red-500/30 text-red-400' : 'border-yellow-500/30 text-yellow-400'}`}>
                      {h.recommendation}
                    </span>
                  </div>
                  <p className="text-xs text-neutral-500">{h.reason}</p>
                </div>
                <div className="text-right text-xs text-neutral-500">
                  <p>{h.competition}</p>
                  <p>{h.best_posting_time}</p>
                </div>
              </div>
            ))}
          </div>
          {result.strategy && (
            <div className="border border-neutral-500/30 rounded-2xl p-4">
              <h3 className="text-xs font-medium text-neutral-400 mb-1">Strategy</h3>
              <p className="text-sm text-neutral-300">{result.strategy}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export function Collaborators({ creatorId }) {
  const [niche, setNiche] = useState('')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)

  async function handle() {
    setLoading(true)
    try {
      const res = await findCollaborators({ creator_id: creatorId, niche })
      setResult(res.data)
    } catch (e) {
      alert(e.response?.data?.error || 'Error')
    } finally {
      setLoading(false)
    }
  }

  function fmt(n) {
    if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M'
    if (n >= 1000) return (n / 1000).toFixed(1) + 'K'
    return n?.toString() || '0'
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold mb-1">Collaborator Finder</h2>
        <p className="text-neutral-400 text-sm">Find creators in your niche for collaboration.</p>
      </div>
      <div className="border border-neutral-500/30 rounded-2xl p-4 space-y-3">
        <div>
          <label className="text-xs text-neutral-400 mb-1.5 block">Your Niche</label>
          <input value={niche} onChange={e => setNiche(e.target.value)} placeholder="e.g. finance education india"
            className="w-full bg-neutral-900 border border-neutral-500/30 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-neutral-400 transition-colors" />
        </div>
        <button onClick={handle} disabled={loading || !niche.trim()}
          className="flex items-center gap-2 bg-white text-black px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-neutral-200 transition-colors disabled:opacity-50">
          {loading ? <Loader2 size={14} className="animate-spin" /> : <Users size={14} />}
          {loading ? 'Finding...' : 'Find Collaborators'}
        </button>
      </div>
      {result && (
        <div className="space-y-3">
          {result.strategy && (
            <div className="border border-neutral-500/30 rounded-2xl p-4">
              <p className="text-xs text-neutral-400 mb-1">Strategy</p>
              <p className="text-sm text-neutral-300">{result.strategy}</p>
            </div>
          )}
          {result.collaborators?.map((c) => (
            <div key={c.channel_id} className={`border rounded-2xl p-4 ${c.channel_id === result.top_pick ? 'border-white/20 bg-white/5' : 'border-neutral-500/30'}`}>
              <div className="flex items-center gap-3 mb-3">
                <img src={c.thumbnail} alt="" className="w-10 h-10 rounded-full bg-neutral-800 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-sm truncate">{c.title}</p>
                    {c.channel_id === result.top_pick && <span className="text-[10px] bg-white text-black px-1.5 py-0.5 rounded-full shrink-0">Top Pick</span>}
                  </div>
                  <p className="text-xs text-neutral-500">{fmt(c.subscribers)} subscribers</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-lg font-bold">{c.collab_score}</p>
                  <p className="text-[10px] text-neutral-500">score</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-neutral-900 rounded-lg p-2">
                  <p className="text-neutral-500 mb-0.5">Collab Type</p>
                  <p className="text-neutral-300">{c.collab_type}</p>
                </div>
                <div className="bg-neutral-900 rounded-lg p-2">
                  <p className="text-neutral-500 mb-0.5">Audience Overlap</p>
                  <p className="text-neutral-300">{c.audience_overlap_estimate}</p>
                </div>
              </div>
              {c.why_good_match && <p className="text-xs text-neutral-500 mt-2">{c.why_good_match}</p>}
              <a href={`https://youtube.com/channel/${c.channel_id}`} target="_blank" rel="noreferrer"
                className="mt-2 inline-block text-xs text-neutral-400 hover:text-white transition-colors">
                View Channel ↗
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
