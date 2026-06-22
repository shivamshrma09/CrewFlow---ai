import { useState } from 'react'
import { generateHooks } from '../../lib/api'
import { Zap, Loader2, Copy, Check } from 'lucide-react'

export default function HookGenerator({ creatorId }) {
  const [form, setForm] = useState({ topic: '', niche: '', target_audience: '', platform: 'youtube', language: 'hinglish' })
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(null)

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  async function handle() {
    setLoading(true)
    try {
      const res = await generateHooks({ ...form, target_audience: form.target_audience })
      setResult(res.data)
    } catch (e) {
      alert(e.response?.data?.error || 'Error')
    } finally {
      setLoading(false)
    }
  }

  function copy(text, id) {
    navigator.clipboard.writeText(text)
    setCopied(id)
    setTimeout(() => setCopied(null), 1500)
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold mb-1">Hook + Title Generator</h2>
        <p className="text-neutral-400 text-sm">Generate viral hooks, SEO titles and thumbnail text for your next video.</p>
      </div>
      <div className="border border-neutral-500/30 rounded-2xl p-4 space-y-3">
        {[['topic', 'Topic', 'e.g. How to earn money in India'], ['niche', 'Niche', 'e.g. Finance, Tech, Comedy'], ['target_audience', 'Target Audience', 'e.g. College students']].map(([k, l, p]) => (
          <div key={k}>
            <label className="text-xs text-neutral-400 mb-1.5 block">{l}</label>
            <input value={form[k]} onChange={e => set(k, e.target.value)} placeholder={p}
              className="w-full bg-neutral-900 border border-neutral-500/30 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-neutral-400 transition-colors" />
          </div>
        ))}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-neutral-400 mb-1.5 block">Platform</label>
            <select value={form.platform} onChange={e => set('platform', e.target.value)}
              className="w-full bg-neutral-900 border border-neutral-500/30 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-neutral-400 transition-colors">
              {['youtube', 'instagram', 'linkedin', 'twitter'].map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-neutral-400 mb-1.5 block">Language</label>
            <select value={form.language} onChange={e => set('language', e.target.value)}
              className="w-full bg-neutral-900 border border-neutral-500/30 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-neutral-400 transition-colors">
              {['hinglish', 'hindi', 'english'].map(l => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>
        </div>
        <button onClick={handle} disabled={loading || !form.topic || !form.niche || !form.target_audience}
          className="flex items-center gap-2 bg-white text-black px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-neutral-200 transition-colors disabled:opacity-50">
          {loading ? <Loader2 size={14} className="animate-spin" /> : <Zap size={14} />}
          {loading ? 'Generating...' : 'Generate'}
        </button>
      </div>
      {result && (
        <div className="space-y-4">
          {[['hooks', '🎣 Hooks'], ['titles', '📝 Titles'], ['thumbnail_texts', '🖼️ Thumbnail Texts']].map(([key, label]) => (
            <div key={key} className="border border-neutral-500/30 rounded-2xl p-4">
              <h3 className="text-sm font-semibold mb-3">{label}</h3>
              <div className="space-y-2">
                {result[key]?.map((item, i) => (
                  <div key={i} className="flex items-start gap-2 group">
                    <span className="text-xs text-neutral-600 mt-1 w-4 shrink-0">{i + 1}.</span>
                    <p className="flex-1 text-sm text-neutral-300">{item}</p>
                    <button onClick={() => copy(item, `${key}-${i}`)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                      {copied === `${key}-${i}` ? <Check size={13} className="text-green-400" /> : <Copy size={13} className="text-neutral-500" />}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
