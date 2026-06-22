import { useState, useRef } from 'react'
import { generateVideoPackage } from '../../lib/api'
import {
  Sparkles, Loader2, Copy, Check, ChevronDown, ChevronUp,
  Image as ImageIcon, Film, Tag, Clock, Lightbulb, FileText,
  Play, Download, RefreshCw, X, Clapperboard
} from 'lucide-react'

function Divider() {
  return <div className="border-t border-neutral-500/30" />
}

function CopyBtn({ text }) {
  const [copied, setCopied] = useState(false)
  function handle() {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }
  return (
    <button onClick={handle} className="text-neutral-400 hover:text-black transition-colors shrink-0">
      {copied ? <Check size={13} /> : <Copy size={13} />}
    </button>
  )
}

function Collapse({ title, icon: Icon, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="border border-neutral-500/30 rounded-2xl overflow-hidden bg-white">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-2.5 px-5 pt-4 pb-4 hover:bg-neutral-50 transition-colors"
      >
        <Icon size={15} className="text-black shrink-0" />
        <span className="text-sm font-semibold text-black flex-1 text-left">{title}</span>
        {open ? <ChevronUp size={15} className="text-neutral-400" /> : <ChevronDown size={15} className="text-neutral-400" />}
      </button>
      {open && (
        <>
          <Divider />
          <div className="p-5">{children}</div>
        </>
      )}
    </div>
  )
}

const STYLES = ['Educational', 'Entertaining', 'Motivational', 'Tutorial', 'Vlog', 'News/Commentary', 'Storytime']
const DURATIONS = ['1-3 minutes', '5-10 minutes', '10-15 minutes', '15-30 minutes', '30+ minutes']
const LANGUAGES = ['hinglish', 'hindi', 'english']

export default function VideoStudio({ creatorId }) {
  // Form
  const [topic, setTopic]       = useState('')
  const [niche, setNiche]       = useState('')
  const [style, setStyle]       = useState('Educational')
  const [duration, setDuration] = useState('5-10 minutes')
  const [language, setLanguage] = useState('hinglish')
  const [image, setImage]       = useState(null)
  const [imagePreview, setImagePreview] = useState('')
  const [instructions, setInstructions] = useState('')
  const fileRef = useRef()

  // State
  const [loading, setLoading]   = useState(false)
  const [result, setResult]     = useState(null)
  const [error, setError]       = useState('')
  const [thumbUrl, setThumbUrl] = useState('')
  const [genThumb, setGenThumb] = useState(false)

  function handleImage(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setImage(file)
    setImagePreview(URL.createObjectURL(file))
  }

  async function handleGenerate() {
    if (!topic.trim()) return
    setLoading(true)
    setResult(null)
    setError('')
    setThumbUrl('')
    try {
      const fullTopic = instructions.trim()
        ? `${topic}. Additional instructions: ${instructions}`
        : topic
      const res = await generateVideoPackage({ topic: fullTopic, niche, language, style, duration })
      setResult(res.data)
      // Auto-generate thumbnail image
      if (res.data?.thumbnail_prompt) {
        genThumbnail(res.data.thumbnail_prompt)
      }
    } catch (e) {
      setError(e.response?.data?.error || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  function genThumbnail(prompt) {
    setGenThumb(true)
    const seed = Math.floor(Math.random() * 999999)
    const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt + ', YouTube thumbnail, cinematic, 8k, vibrant')}?width=1280&height=720&nologo=true&seed=${seed}`
    setThumbUrl(url)
    setGenThumb(false)
  }

  function reset() {
    setResult(null)
    setThumbUrl('')
    setError('')
  }

  return (
    <div className="space-y-5 pb-10">

      {/* Header */}
      <div className="mt-10 flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl text-black font-bold flex items-center gap-2">
            <Clapperboard size={22} /> Video Studio
          </h1>
          <p className="text-sm text-neutral-500 mt-1">Topic do — AI poora video package bana deta hai. Title, script, thumbnail, tags sab.</p>
        </div>
        {result && (
          <button onClick={reset} className="flex items-center gap-2 border border-neutral-500/30 text-neutral-600 px-4 py-2 rounded-xl text-sm hover:bg-neutral-50 transition-colors">
            <RefreshCw size={14} /> New Video
          </button>
        )}
      </div>

      {!result ? (
        /* ── INPUT FORM ── */
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">

          {/* Main form */}
          <div className="xl:col-span-2 space-y-5">

            {/* Topic */}
            <div className="border border-neutral-500/30 rounded-2xl overflow-hidden bg-white">
              <div className="px-6 pt-5 pb-4">
                <h3 className="text-black font-semibold">Video Topic</h3>
                <p className="text-xs text-neutral-500 mt-0.5">Apna topic likhो — jitna detail doge utna better script milega</p>
              </div>
              <Divider />
              <div className="p-6 space-y-4">
                <div>
                  <label className="text-xs text-neutral-500 font-medium mb-1.5 block">Main Topic *</label>
                  <textarea
                    rows={3}
                    value={topic}
                    onChange={e => setTopic(e.target.value)}
                    placeholder="e.g. How to earn money online in India as a student in 2025..."
                    className="w-full border border-neutral-500/30 rounded-xl px-4 py-3 text-sm text-black placeholder:text-neutral-400 focus:outline-none focus:border-black transition-colors bg-white resize-none"
                  />
                </div>
                <div>
                  <label className="text-xs text-neutral-500 font-medium mb-1.5 block">Niche / Category</label>
                  <input
                    value={niche}
                    onChange={e => setNiche(e.target.value)}
                    placeholder="e.g. finance, tech, motivation, cooking..."
                    className="w-full border border-neutral-500/30 rounded-xl px-4 py-2.5 text-sm text-black placeholder:text-neutral-400 focus:outline-none focus:border-black transition-colors bg-white"
                  />
                </div>
                <div>
                  <label className="text-xs text-neutral-500 font-medium mb-1.5 block">Additional Instructions (optional)</label>
                  <textarea
                    rows={2}
                    value={instructions}
                    onChange={e => setInstructions(e.target.value)}
                    placeholder="e.g. Target college students, use funny tone, mention specific tools like Canva..."
                    className="w-full border border-neutral-500/30 rounded-xl px-4 py-2.5 text-sm text-black placeholder:text-neutral-400 focus:outline-none focus:border-black transition-colors bg-white resize-none"
                  />
                </div>
              </div>
            </div>

            {/* Reference Image */}
            <div className="border border-neutral-500/30 rounded-2xl overflow-hidden bg-white">
              <div className="px-6 pt-5 pb-4">
                <h3 className="text-black font-semibold">Reference Image (optional)</h3>
                <p className="text-xs text-neutral-500 mt-0.5">Apni photo ya koi reference image do — thumbnail me use hogi</p>
              </div>
              <Divider />
              <div className="p-6">
                {!imagePreview ? (
                  <label className="border-2 border-dashed border-neutral-500/30 hover:border-neutral-400 rounded-xl py-8 flex flex-col items-center justify-center cursor-pointer transition-colors group">
                    <ImageIcon size={28} className="text-neutral-300 group-hover:text-neutral-500 transition-colors mb-2" />
                    <span className="text-sm text-neutral-500 font-medium">Click to upload image</span>
                    <span className="text-xs text-neutral-400 mt-1">JPG, PNG, WEBP</span>
                    <input ref={fileRef} type="file" accept="image/*" onChange={handleImage} className="hidden" />
                  </label>
                ) : (
                  <div className="relative">
                    <img src={imagePreview} alt="" className="w-full h-48 object-cover rounded-xl border border-neutral-200" />
                    <button
                      onClick={() => { setImage(null); setImagePreview('') }}
                      className="absolute top-2 right-2 bg-black text-white rounded-lg p-1.5 hover:bg-neutral-800 transition-colors"
                    >
                      <X size={13} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Settings sidebar */}
          <div className="space-y-5">
            <div className="border border-neutral-500/30 rounded-2xl overflow-hidden bg-white">
              <div className="px-6 pt-5 pb-4">
                <h3 className="text-black font-semibold">Settings</h3>
              </div>
              <Divider />
              <div className="p-6 space-y-5">

                {/* Style */}
                <div>
                  <label className="text-xs text-neutral-500 font-medium mb-2 block">Video Style</label>
                  <div className="flex flex-wrap gap-2">
                    {STYLES.map(s => (
                      <button key={s} onClick={() => setStyle(s)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                          style === s ? 'bg-black text-white border-black' : 'border-neutral-500/30 text-neutral-600 hover:border-neutral-400'
                        }`}>{s}</button>
                    ))}
                  </div>
                </div>

                {/* Duration */}
                <div>
                  <label className="text-xs text-neutral-500 font-medium mb-2 block">Target Duration</label>
                  <div className="flex flex-col gap-1.5">
                    {DURATIONS.map(d => (
                      <button key={d} onClick={() => setDuration(d)}
                        className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium border text-left transition-colors ${
                          duration === d ? 'bg-black text-white border-black' : 'border-neutral-500/30 text-neutral-600 hover:border-neutral-400'
                        }`}>
                        <Clock size={11} /> {d}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Language */}
                <div>
                  <label className="text-xs text-neutral-500 font-medium mb-2 block">Language</label>
                  <div className="flex gap-2">
                    {LANGUAGES.map(l => (
                      <button key={l} onClick={() => setLanguage(l)}
                        className={`flex-1 py-2 rounded-xl text-xs font-semibold border capitalize transition-colors ${
                          language === l ? 'bg-black text-white border-black' : 'border-neutral-500/30 text-neutral-600 hover:border-neutral-400'
                        }`}>{l}</button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Generate button */}
            <button
              onClick={handleGenerate}
              disabled={loading || !topic.trim()}
              className="w-full flex items-center justify-center gap-2 bg-black text-white py-3.5 rounded-2xl text-sm font-bold hover:bg-neutral-800 transition-colors disabled:opacity-50"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
              {loading ? 'Generating Full Package...' : 'Generate Video Package'}
            </button>

            {loading && (
              <div className="border border-neutral-500/30 rounded-2xl p-4 bg-white text-center">
                <Loader2 size={20} className="animate-spin text-black mx-auto mb-2" />
                <p className="text-xs text-neutral-500">AI is writing your full video package — title, script, shorts ideas, SEO tags...</p>
                <p className="text-[10px] text-neutral-400 mt-1">Usually takes 10-20 seconds</p>
              </div>
            )}

            {error && (
              <div className="border border-neutral-500/30 rounded-2xl p-4 bg-white">
                <p className="text-xs font-semibold text-black mb-1">Error</p>
                <p className="text-xs text-neutral-500">{error}</p>
              </div>
            )}
          </div>
        </div>

      ) : (
        /* ── RESULT ── */
        <div className="space-y-4">

          {/* Top bar */}
          <div className="border border-neutral-500/30 rounded-2xl p-5 bg-white flex items-center gap-4 flex-wrap">
            <div className="flex-1 min-w-0">
              <p className="text-xs text-neutral-500 font-medium mb-0.5">Generated for</p>
              <p className="text-sm font-semibold text-black truncate">{topic}</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-xs border border-neutral-500/30 px-2.5 py-1 rounded-full text-neutral-600 capitalize">{style}</span>
              <span className="text-xs border border-neutral-500/30 px-2.5 py-1 rounded-full text-neutral-600">{duration}</span>
              <span className="text-xs border border-neutral-500/30 px-2.5 py-1 rounded-full text-neutral-600 capitalize">{language}</span>
            </div>
          </div>

          {/* Title Section */}
          <div className="border border-neutral-500/30 rounded-2xl overflow-hidden bg-white">
            <div className="px-5 pt-4 pb-3 flex items-center gap-2">
              <Film size={15} className="text-black" />
              <p className="text-sm font-semibold text-black flex-1">Video Title</p>
              <CopyBtn text={result.title} />
            </div>
            <Divider />
            <div className="p-5 space-y-3">
              {/* Main title */}
              <div className="rounded-xl bg-black text-white px-4 py-3">
                <p className="text-sm font-bold leading-snug">{result.title}</p>
              </div>
              {/* Alternatives */}
              {result.titles_alternatives?.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-[10px] text-neutral-400 font-semibold uppercase tracking-wide">Alternative Titles</p>
                  {result.titles_alternatives.map((t, i) => (
                    <div key={i} className="flex items-center justify-between gap-2 border border-neutral-500/30 rounded-xl px-3 py-2">
                      <p className="text-xs text-neutral-700 flex-1">{t}</p>
                      <CopyBtn text={t} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Thumbnail */}
          <div className="border border-neutral-500/30 rounded-2xl overflow-hidden bg-white">
            <div className="px-5 pt-4 pb-3 flex items-center gap-2">
              <ImageIcon size={15} className="text-black" />
              <p className="text-sm font-semibold text-black flex-1">AI Thumbnail</p>
              {thumbUrl && (
                <a href={thumbUrl} download="thumbnail.jpg" target="_blank" rel="noreferrer"
                  className="flex items-center gap-1 text-xs border border-neutral-500/30 px-2.5 py-1 rounded-lg hover:bg-neutral-50 transition-colors text-neutral-600">
                  <Download size={11} /> Download
                </a>
              )}
            </div>
            <Divider />
            <div className="p-5 space-y-3">
              {/* User reference image + AI generated side by side */}
              <div className={`grid gap-3 ${imagePreview ? 'grid-cols-2' : 'grid-cols-1'}`}>
                {imagePreview && (
                  <div>
                    <p className="text-[10px] text-neutral-400 font-semibold uppercase tracking-wide mb-1.5">Your Reference</p>
                    <img src={imagePreview} alt="reference" className="w-full aspect-video object-cover rounded-xl border border-neutral-200" />
                  </div>
                )}
                <div>
                  {imagePreview && <p className="text-[10px] text-neutral-400 font-semibold uppercase tracking-wide mb-1.5">AI Generated</p>}
                  {thumbUrl ? (
                    <img src={thumbUrl} alt="thumbnail" className="w-full aspect-video object-cover rounded-xl border border-neutral-200" />
                  ) : (
                    <div className="w-full aspect-video rounded-xl border border-neutral-500/30 bg-neutral-50 flex items-center justify-center">
                      <Loader2 size={20} className="animate-spin text-neutral-300" />
                    </div>
                  )}
                </div>
              </div>
              {/* Thumbnail text overlay suggestion */}
              {result.thumbnail_text && (
                <div className="flex items-center justify-between rounded-xl bg-neutral-50 border border-neutral-500/30 px-3 py-2">
                  <div>
                    <p className="text-[10px] text-neutral-400 font-semibold uppercase tracking-wide">Text Overlay Suggestion</p>
                    <p className="text-sm font-bold text-black mt-0.5">{result.thumbnail_text}</p>
                  </div>
                  <CopyBtn text={result.thumbnail_text} />
                </div>
              )}
              {/* Regenerate */}
              <button
                onClick={() => result.thumbnail_prompt && genThumbnail(result.thumbnail_prompt)}
                className="flex items-center gap-2 text-xs border border-neutral-500/30 px-3 py-2 rounded-xl hover:bg-neutral-50 transition-colors text-neutral-600"
              >
                <RefreshCw size={12} /> Regenerate Thumbnail
              </button>
            </div>
          </div>

          {/* Script */}
          <Collapse title="Full Video Script" icon={FileText} defaultOpen={true}>
            <div className="space-y-4">
              {/* Hook */}
              <div className="rounded-xl bg-black text-white p-4">
                <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 mb-1.5">🎣 Hook (First 15 sec)</p>
                <p className="text-sm leading-relaxed">{result.script?.hook}</p>
              </div>
              {/* Intro */}
              <div className="rounded-xl border border-neutral-500/30 p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">Intro (30 sec)</p>
                  <CopyBtn text={result.script?.intro} />
                </div>
                <p className="text-sm text-neutral-700 leading-relaxed">{result.script?.intro}</p>
              </div>
              {/* Sections */}
              {result.script?.sections?.map((sec, i) => (
                <div key={i} className="rounded-xl border border-neutral-500/30 p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="text-xs font-bold text-black">{sec.title}</p>
                      <p className="text-[10px] text-neutral-400 flex items-center gap-1 mt-0.5"><Clock size={9} /> {sec.duration}</p>
                    </div>
                    <CopyBtn text={sec.script} />
                  </div>
                  <p className="text-sm text-neutral-700 leading-relaxed">{sec.script}</p>
                </div>
              ))}
              {/* Outro */}
              <div className="rounded-xl border border-neutral-500/30 p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">Outro / CTA</p>
                  <CopyBtn text={result.script?.outro} />
                </div>
                <p className="text-sm text-neutral-700 leading-relaxed">{result.script?.outro}</p>
              </div>
              {/* Copy full script */}
              <button
                onClick={() => {
                  const full = [
                    `HOOK:\n${result.script?.hook}`,
                    `\nINTRO:\n${result.script?.intro}`,
                    ...(result.script?.sections?.map(s => `\n${s.title.toUpperCase()}:\n${s.script}`) || []),
                    `\nOUTRO:\n${result.script?.outro}`
                  ].join('\n')
                  navigator.clipboard.writeText(full)
                }}
                className="w-full flex items-center justify-center gap-2 border border-neutral-500/30 text-neutral-600 py-2.5 rounded-xl text-xs font-semibold hover:bg-neutral-50 transition-colors"
              >
                <Copy size={13} /> Copy Full Script
              </button>
            </div>
          </Collapse>

          {/* SEO Package */}
          <Collapse title="SEO Package — Description, Tags & Hashtags" icon={Tag}>
            <div className="space-y-4">
              {/* Description */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-semibold text-black">YouTube Description</p>
                  <CopyBtn text={result.description} />
                </div>
                <div className="rounded-xl bg-neutral-50 border border-neutral-500/30 p-4">
                  <p className="text-sm text-neutral-700 whitespace-pre-wrap leading-relaxed">{result.description}</p>
                </div>
              </div>
              {/* Tags */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-semibold text-black">SEO Tags</p>
                  <CopyBtn text={result.tags?.join(', ')} />
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {result.tags?.map(t => (
                    <span key={t} className="text-xs border border-neutral-500/30 px-2.5 py-1 rounded-full text-neutral-600 bg-neutral-50">{t}</span>
                  ))}
                </div>
              </div>
              {/* Hashtags */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-semibold text-black">Hashtags</p>
                  <CopyBtn text={result.hashtags?.join(' ')} />
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {result.hashtags?.map(h => (
                    <span key={h} className="text-xs border border-neutral-500/30 px-2.5 py-1 rounded-full text-black font-medium bg-neutral-50">{h}</span>
                  ))}
                </div>
              </div>
            </div>
          </Collapse>

          {/* Shorts Ideas */}
          <Collapse title="YouTube Shorts Ideas (3 ready scripts)" icon={Play}>
            <div className="space-y-3">
              {result.shorts_ideas?.map((short, i) => (
                <div key={i} className="rounded-xl border border-neutral-500/30 p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="text-xs font-bold text-black">#{i + 1} {short.title}</p>
                      <p className="text-[10px] text-neutral-400 mt-0.5">Hook: {short.hook}</p>
                    </div>
                    <CopyBtn text={`${short.title}\n\n${short.hook}\n\n${short.script}`} />
                  </div>
                  <p className="text-xs text-neutral-700 leading-relaxed whitespace-pre-wrap">{short.script}</p>
                </div>
              ))}
            </div>
          </Collapse>

          {/* Production Tips + Upload Time */}
          <Collapse title="Production Tips & Best Upload Time" icon={Lightbulb}>
            <div className="space-y-3">
              {result.best_upload_time && (
                <div className="rounded-xl bg-black text-white px-4 py-3 flex items-center gap-3">
                  <Clock size={15} className="shrink-0" />
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wide text-neutral-400 mb-0.5">Best Upload Time</p>
                    <p className="text-sm font-semibold">{result.best_upload_time}</p>
                  </div>
                </div>
              )}
              <div className="space-y-2">
                {result.production_tips?.map((tip, i) => (
                  <div key={i} className="flex items-start gap-2.5 rounded-xl border border-neutral-500/30 px-4 py-3">
                    <span className="w-5 h-5 rounded-full bg-neutral-100 border border-neutral-300 flex items-center justify-center text-[9px] font-bold text-black shrink-0 mt-0.5">{i + 1}</span>
                    <p className="text-sm text-neutral-700">{tip}</p>
                  </div>
                ))}
              </div>
            </div>
          </Collapse>

        </div>
      )}
    </div>
  )
}
