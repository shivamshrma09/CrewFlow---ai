import { useState } from 'react'
import { repurposeContent, generateShorts } from '../../lib/api'
import { RefreshCw, Loader2, Copy, Check, Scissors, Link, Play, Download, Clock, Sparkles, AlertCircle } from 'lucide-react'

function Divider() {
  return <div className="border-t border-neutral-500/30" />
}

function fmt(sec) {
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

// ─── Shorts Generator ────────────────────────────────────────────────────────
function ShortsGenerator() {
  const [videoUrl, setVideoUrl]   = useState('')
  const [count, setCount]         = useState(3)
  const [loading, setLoading]     = useState(false)
  const [result, setResult]       = useState(null)
  const [error, setError]         = useState('')
  const [stage, setStage]         = useState('')

  const STAGES = [
    'Fetching video info...',
    'AI analyzing best moments...',
    'Downloading video...',
    'Cutting & resizing to 9:16...',
    'Uploading shorts...',
  ]

  async function handle() {
    if (!videoUrl.trim()) return
    setLoading(true)
    setResult(null)
    setError('')

    // Cycle through stages for UX
    let i = 0
    setStage(STAGES[0])
    const interval = setInterval(() => {
      i = Math.min(i + 1, STAGES.length - 1)
      setStage(STAGES[i])
    }, 18000)

    try {
      const res = await generateShorts({ video_url: videoUrl.trim(), count })
      setResult(res.data)
    } catch (e) {
      setError(e.response?.data?.error || 'Something went wrong. Make sure the video is public.')
    } finally {
      clearInterval(interval)
      setLoading(false)
      setStage('')
    }
  }

  return (
    <div className="space-y-5">
      {/* Input Card */}
      <div className="border border-neutral-500/30 rounded-2xl overflow-hidden bg-white">
        <div className="px-6 pt-5 pb-4 flex items-center gap-2">
          <Scissors size={16} className="text-black" />
          <h3 className="text-black font-semibold">AI Shorts Generator</h3>
          <span className="ml-auto text-[10px] bg-black text-white px-2 py-0.5 rounded-full font-medium uppercase tracking-wide">Auto Cut</span>
        </div>
        <Divider />
        <div className="p-6 space-y-4">
          <div>
            <label className="text-xs text-neutral-500 font-medium mb-1.5 block">YouTube Video URL</label>
            <div className="flex items-center gap-2 border border-neutral-500/30 rounded-xl px-4 py-2.5 focus-within:border-black transition-colors bg-white">
              <Link size={14} className="text-neutral-400 shrink-0" />
              <input
                value={videoUrl}
                onChange={e => setVideoUrl(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=..."
                className="flex-1 text-sm text-black placeholder:text-neutral-400 focus:outline-none bg-transparent"
              />
            </div>
            <p className="text-[10px] text-neutral-400 mt-1.5">Video must be public. Longer videos (5–30 min) work best.</p>
          </div>

          <div>
            <label className="text-xs text-neutral-500 font-medium mb-1.5 block">Number of Shorts to generate</label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map(n => (
                <button
                  key={n}
                  onClick={() => setCount(n)}
                  className={`w-10 h-10 rounded-xl text-sm font-semibold border transition-colors ${
                    count === n ? 'bg-black text-white border-black' : 'border-neutral-500/30 text-neutral-600 hover:border-neutral-400'
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-xl bg-neutral-50 border border-neutral-500/30 p-4 space-y-1.5">
            <p className="text-xs font-semibold text-black">What this does:</p>
            {[
              'AI analyzes your video to find the most viral moments',
              'Downloads your full YouTube video',
              'Auto-cuts & resizes each clip to 9:16 (Shorts format)',
              'Uploads final Shorts — ready to download & post',
            ].map((step, i) => (
              <div key={i} className="flex items-start gap-2 text-xs text-neutral-600">
                <span className="w-4 h-4 rounded-full bg-black text-white flex items-center justify-center text-[9px] font-bold shrink-0 mt-0.5">{i + 1}</span>
                {step}
              </div>
            ))}
          </div>

          <button
            onClick={handle}
            disabled={loading || !videoUrl.trim()}
            className="w-full flex items-center justify-center gap-2 bg-black text-white py-3 rounded-xl text-sm font-semibold hover:bg-neutral-800 transition-colors disabled:opacity-50"
          >
            {loading ? <Loader2 size={15} className="animate-spin" /> : <Scissors size={15} />}
            {loading ? 'Generating Shorts...' : `Generate ${count} Short${count > 1 ? 's' : ''}`}
          </button>
        </div>
      </div>

      {/* Loading stage indicator */}
      {loading && stage && (
        <div className="border border-neutral-500/30 rounded-2xl p-5 bg-white">
          <div className="flex items-center gap-3 mb-4">
            <Loader2 size={16} className="animate-spin text-black" />
            <p className="text-sm font-semibold text-black">{stage}</p>
          </div>
          <div className="space-y-2">
            {STAGES.map((s, i) => {
              const current = STAGES.indexOf(stage)
              const done = i < current
              const active = i === current
              return (
                <div key={i} className="flex items-center gap-2.5">
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 text-[9px] font-bold transition-colors ${
                    done ? 'bg-black border-black text-white' :
                    active ? 'border-black text-black' :
                    'border-neutral-200 text-neutral-300'
                  }`}>
                    {done ? '✓' : i + 1}
                  </div>
                  <span className={`text-xs transition-colors ${active ? 'text-black font-semibold' : done ? 'text-neutral-400' : 'text-neutral-300'}`}>{s}</span>
                  {active && <Loader2 size={11} className="animate-spin text-black ml-auto" />}
                </div>
              )
            })}
          </div>
          <p className="text-[10px] text-neutral-400 mt-4">This may take 2–5 minutes depending on video length. Please wait.</p>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="flex items-start gap-3 border border-neutral-500/30 rounded-2xl p-4 bg-white">
          <AlertCircle size={16} className="text-black shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-black mb-0.5">Generation failed</p>
            <p className="text-xs text-neutral-500">{error}</p>
          </div>
        </div>
      )}

      {/* Results */}
      {result && (
        <div className="space-y-4">
          {/* Source info */}
          <div className="border border-neutral-500/30 rounded-2xl p-5 bg-white">
            <p className="text-xs text-neutral-500 font-medium mb-1">Source Video</p>
            <p className="text-sm font-semibold text-black">{result.source_title}</p>
            <p className="text-xs text-neutral-400 mt-1">Total duration: {fmt(result.source_duration)} · {result.shorts?.length} shorts generated</p>
          </div>

          {/* Shorts grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {result.shorts?.map((short) => (
              <div key={short.index} className="border border-neutral-500/30 rounded-2xl overflow-hidden bg-white">
                {/* Video preview */}
                <div className="relative bg-black aspect-[9/16] max-h-[320px] overflow-hidden">
                  <video
                    src={short.url}
                    controls
                    className="w-full h-full object-cover"
                    poster=""
                  />
                  <div className="absolute top-2 left-2 bg-black/70 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                    Short #{short.index}
                  </div>
                  <div className="absolute bottom-2 right-2 bg-black/70 text-white text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Clock size={9} /> {fmt(short.duration)}
                  </div>
                </div>

                {/* Info */}
                <div className="p-4 space-y-3">
                  <p className="text-sm font-semibold text-black leading-snug">{short.title}</p>
                  <div className="flex items-center gap-3 text-xs text-neutral-500">
                    <span>Start: {fmt(short.startTime)}</span>
                    <span>·</span>
                    <span>End: {fmt(short.endTime)}</span>
                    <span>·</span>
                    <span>{fmt(short.duration)} long</span>
                  </div>
                  <div className="rounded-lg bg-neutral-50 border border-neutral-500/30 px-3 py-2">
                    <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wide mb-0.5">Why this segment?</p>
                    <p className="text-xs text-neutral-600">{short.why}</p>
                  </div>
                  <a
                    href={short.url}
                    download={`short_${short.index}_${short.title.replace(/\s+/g, '_')}.mp4`}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full flex items-center justify-center gap-2 bg-black text-white py-2.5 rounded-xl text-xs font-semibold hover:bg-neutral-800 transition-colors"
                  >
                    <Download size={13} /> Download Short #{short.index}
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Content Repurposer (existing) ───────────────────────────────────────────
function ContentRepurposer({ creatorId }) {
  const [script, setScript]     = useState('')
  const [videoId, setVideoId]   = useState('')
  const [language, setLanguage] = useState('hinglish')
  const [result, setResult]     = useState(null)
  const [loading, setLoading]   = useState(false)
  const [copied, setCopied]     = useState(null)
  const [mode, setMode]         = useState('script')

  async function handle() {
    setLoading(true)
    try {
      const payload = mode === 'script'
        ? { script, language }
        : { creator_id: creatorId, video_id: videoId, language }
      const res = await repurposeContent(payload)
      setResult(res.data)
    } catch (e) {
      alert(e.response?.data?.error || 'Error')
    } finally {
      setLoading(false)
    }
  }

  function copy(text, id) {
    navigator.clipboard.writeText(typeof text === 'object' ? JSON.stringify(text, null, 2) : text)
    setCopied(id)
    setTimeout(() => setCopied(null), 1500)
  }

  return (
    <div className="space-y-5">
      <div className="border border-neutral-500/30 rounded-2xl overflow-hidden bg-white">
        <div className="px-6 pt-5 pb-4 flex items-center gap-2">
          <RefreshCw size={16} className="text-black" />
          <h3 className="text-black font-semibold">Content Repurposer</h3>
          <span className="ml-auto text-[10px] text-neutral-500">Turn 1 video into 10 content assets</span>
        </div>
        <Divider />
        <div className="p-6 space-y-4">
          <div className="flex gap-2">
            {[['script', 'Paste Script'], ['video', 'Video ID']].map(([m, label]) => (
              <button key={m} onClick={() => setMode(m)}
                className={`px-4 py-2 rounded-xl text-sm font-medium border transition-colors ${
                  mode === m ? 'bg-black text-white border-black' : 'border-neutral-500/30 text-neutral-600 hover:border-neutral-400'
                }`}>
                {label}
              </button>
            ))}
          </div>

          {mode === 'script' ? (
            <textarea value={script} onChange={e => setScript(e.target.value)} rows={5}
              placeholder="Paste your video script here..."
              className="w-full border border-neutral-500/30 rounded-xl px-4 py-3 text-sm text-black placeholder:text-neutral-400 focus:outline-none focus:border-black transition-colors resize-none bg-white" />
          ) : (
            <input value={videoId} onChange={e => setVideoId(e.target.value)} placeholder="YouTube Video ID e.g. dQw4w9WgXcQ"
              className="w-full border border-neutral-500/30 rounded-xl px-4 py-2.5 text-sm text-black placeholder:text-neutral-400 focus:outline-none focus:border-black transition-colors bg-white" />
          )}

          <div className="flex items-center gap-3">
            <select value={language} onChange={e => setLanguage(e.target.value)}
              className="border border-neutral-500/30 rounded-xl px-4 py-2.5 text-sm text-black focus:outline-none focus:border-black transition-colors bg-white">
              {['hinglish', 'hindi', 'english'].map(l => <option key={l} value={l}>{l}</option>)}
            </select>
            <button onClick={handle} disabled={loading || (mode === 'script' ? !script.trim() : !videoId.trim())}
              className="flex items-center gap-2 bg-black text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-neutral-800 transition-colors disabled:opacity-50">
              {loading ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
              {loading ? 'Repurposing...' : 'Repurpose'}
            </button>
          </div>
        </div>
      </div>

      {result && (
        <div className="space-y-4">
          {result.shorts_scripts?.map((s, i) => (
            <div key={i} className="border border-neutral-500/30 rounded-2xl overflow-hidden bg-white">
              <div className="px-5 pt-4 pb-3 flex items-center justify-between">
                <p className="text-sm font-semibold text-black">Short #{i + 1}: {s.title}</p>
                <button onClick={() => copy(s.script, `short-${i}`)} className="text-neutral-400 hover:text-black transition-colors">
                  {copied === `short-${i}` ? <Check size={13} /> : <Copy size={13} />}
                </button>
              </div>
              <Divider />
              <p className="text-sm text-neutral-700 whitespace-pre-wrap p-5">{s.script}</p>
            </div>
          ))}

          {[
            ['Tweet Thread', result.tweet_thread?.join('\n\n'), 'tweets'],
            ['LinkedIn Post', result.linkedin_post, 'linkedin'],
            ['Instagram Captions', result.instagram_captions?.join('\n\n---\n\n'), 'captions'],
          ].map(([label, content, id]) => content && (
            <div key={id} className="border border-neutral-500/30 rounded-2xl overflow-hidden bg-white">
              <div className="px-5 pt-4 pb-3 flex items-center justify-between">
                <p className="text-sm font-semibold text-black">{label}</p>
                <button onClick={() => copy(content, id)} className="text-neutral-400 hover:text-black transition-colors">
                  {copied === id ? <Check size={13} /> : <Copy size={13} />}
                </button>
              </div>
              <Divider />
              <p className="text-sm text-neutral-700 whitespace-pre-wrap p-5">{content}</p>
            </div>
          ))}

          {result.seo_package && (
            <div className="border border-neutral-500/30 rounded-2xl overflow-hidden bg-white">
              <div className="px-5 pt-4 pb-3">
                <p className="text-sm font-semibold text-black">SEO Package</p>
              </div>
              <Divider />
              <div className="p-5 space-y-3">
                <p className="text-sm text-neutral-700">{result.seo_package.description}</p>
                <div className="flex flex-wrap gap-1.5">
                  {result.seo_package.tags?.map(t => (
                    <span key={t} className="text-xs border border-neutral-500/30 px-2 py-0.5 rounded-full text-neutral-600">#{t}</span>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Main Export ──────────────────────────────────────────────────────────────
const TABS = [
  { id: 'shorts', label: 'AI Shorts Cutter', icon: Scissors },
  { id: 'repurpose', label: 'Content Repurposer', icon: RefreshCw },
]

export default function Repurpose({ creatorId }) {
  const [tab, setTab] = useState('shorts')

  return (
    <div className="space-y-5 pb-10">
      {/* Header */}
      <div className="mt-10">
        <h1 className="text-2xl text-black font-bold">Repurpose</h1>
        <p className="text-sm text-neutral-500 mt-1">Cut your YouTube video into viral Shorts or repurpose into 10 content assets.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border transition-colors ${
              tab === t.id
                ? 'bg-black text-white border-black'
                : 'bg-white text-neutral-600 border-neutral-500/30 hover:border-neutral-400'
            }`}
          >
            <t.icon size={15} />
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'shorts' ? <ShortsGenerator /> : <ContentRepurposer creatorId={creatorId} />}
    </div>
  )
}
