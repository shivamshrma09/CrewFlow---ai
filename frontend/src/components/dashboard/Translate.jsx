import { useState } from 'react'
import { translateScript } from '../../lib/api'
import { Languages, Loader2, Copy, Check } from 'lucide-react'

const LANGS = ['marathi', 'bhojpuri', 'tamil', 'telugu', 'kannada', 'bengali', 'gujarati', 'punjabi', 'malayalam', 'hindi', 'english', 'hinglish']

export default function Translate({ creatorId }) {
  const [text, setText] = useState('')
  const [target, setTarget] = useState('marathi')
  const [source, setSource] = useState('hindi')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  async function handle() {
    setLoading(true)
    try {
      const res = await translateScript({ text, target_language: target, source_language: source })
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
        <h2 className="text-lg font-semibold mb-1">Regional Translator</h2>
        <p className="text-neutral-400 text-sm">Translate your script into any Indian regional language.</p>
      </div>
      <div className="border border-neutral-500/30 rounded-2xl p-4 space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-neutral-400 mb-1.5 block">From</label>
            <select value={source} onChange={e => setSource(e.target.value)}
              className="w-full bg-neutral-900 border border-neutral-500/30 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-neutral-400 transition-colors">
              {LANGS.map(l => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-neutral-400 mb-1.5 block">To</label>
            <select value={target} onChange={e => setTarget(e.target.value)}
              className="w-full bg-neutral-900 border border-neutral-500/30 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-neutral-400 transition-colors">
              {LANGS.map(l => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>
        </div>
        <textarea value={text} onChange={e => setText(e.target.value)} rows={4}
          placeholder="Enter your script or text to translate..."
          className="w-full bg-neutral-900 border border-neutral-500/30 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-neutral-400 transition-colors resize-none" />
        <button onClick={handle} disabled={loading || !text.trim()}
          className="flex items-center gap-2 bg-white text-black px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-neutral-200 transition-colors disabled:opacity-50">
          {loading ? <Loader2 size={14} className="animate-spin" /> : <Languages size={14} />}
          {loading ? 'Translating...' : 'Translate'}
        </button>
      </div>
      {result && (
        <div className="space-y-3">
          <div className="border border-neutral-500/30 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold">{result.target_language_label}</h3>
              <button onClick={() => { navigator.clipboard.writeText(result.translated_text); setCopied(true); setTimeout(() => setCopied(false), 1500) }}>
                {copied ? <Check size={13} className="text-green-400" /> : <Copy size={13} className="text-neutral-500" />}
              </button>
            </div>
            <p className="text-sm text-neutral-300 leading-relaxed">{result.translated_text}</p>
          </div>
          {result.romanized && (
            <div className="border border-neutral-500/30 rounded-2xl p-4">
              <h3 className="text-xs text-neutral-400 mb-2">Romanized</h3>
              <p className="text-sm text-neutral-300">{result.romanized}</p>
            </div>
          )}
          {result.notes && (
            <div className="border border-neutral-500/30 rounded-2xl p-3">
              <p className="text-xs text-neutral-500">📝 {result.notes}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
