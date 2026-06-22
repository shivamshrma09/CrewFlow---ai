import { useState } from 'react'
import { getAllVideos, analyzeComments, postReply } from '../../lib/api'
import { MessageSquare, Loader2, ThumbsUp, Send, CheckCheck, Edit3 } from 'lucide-react'

const sentimentLabel = {
  positive: 'Positive',
  negative: 'Negative',
  question: 'Question',
  angry: 'Angry',
  neutral: 'Neutral',
}

const priorityStyle = {
  high:   'bg-black text-white',
  medium: 'bg-neutral-200 text-black',
  low:    'bg-neutral-100 text-neutral-500',
}

const sentimentStyle = {
  positive: 'bg-neutral-100 text-black',
  negative: 'bg-black text-white',
  question: 'bg-neutral-200 text-black',
  angry:    'bg-black text-white',
  neutral:  'bg-neutral-100 text-neutral-500',
}

function Divider() {
  return <div className="border-t border-neutral-500/30" />
}

export default function Comments({ creatorId }) {
  const [videoId, setVideoId]         = useState('')
  const [maxComments, setMaxComments] = useState(30)
  const [comments, setComments]       = useState([])
  const [loading, setLoading]         = useState(false)
  const [replies, setReplies]         = useState({})
  const [posting, setPosting]         = useState({})
  const [posted, setPosted]           = useState({})
  const [postingAll, setPostingAll]   = useState(false)

  async function handleAnalyze() {
    if (!videoId.trim()) return
    setLoading(true)
    setComments([])
    setPosted({})
    try {
      const res = await analyzeComments({ creator_id: creatorId, video_id: videoId.trim(), max_comments: maxComments })
      const fetched = res.data.comments || []
      setComments(fetched)
      const drafts = {}
      fetched.forEach(c => { drafts[c.comment_id] = c.draft_reply })
      setReplies(drafts)
    } catch (e) {
      alert(e.response?.data?.error || 'Error analyzing comments')
    } finally {
      setLoading(false)
    }
  }

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

  async function handlePostAll() {
    const pending = comments.filter(c => !posted[c.comment_id] && replies[c.comment_id]?.trim())
    if (!pending.length) return
    setPostingAll(true)
    for (const c of pending) {
      await handlePost(c.comment_id)
    }
    setPostingAll(false)
  }

  const postedCount  = comments.filter(c => posted[c.comment_id]).length
  const pendingCount = comments.filter(c => !posted[c.comment_id]).length

  return (
    <div className="space-y-5 pb-10">

      {/* Header */}
      <div className="mt-10">
        <h1 className="text-2xl text-black font-bold">Comment Responder</h1>
        <p className="text-sm text-neutral-500 mt-1">AI analyzes comments and generates draft replies for your approval.</p>
      </div>

      {/* Input Card */}
      <div className="border border-neutral-500/30 rounded-2xl overflow-hidden bg-white">
        <div className="px-6 pt-5 pb-4">
          <h3 className="text-black font-semibold">Analyze a video</h3>
        </div>
        <Divider />
        <div className="p-6 space-y-4">
          <div>
            <label className="text-xs text-neutral-500 font-medium mb-1.5 block">YouTube Video ID</label>
            <input
              value={videoId}
              onChange={e => setVideoId(e.target.value)}
              placeholder="e.g. dQw4w9WgXcQ"
              className="w-full border border-neutral-500/30 rounded-xl px-4 py-2.5 text-sm text-black placeholder:text-neutral-400 focus:outline-none focus:border-black transition-colors bg-white"
            />
          </div>
          <div className="flex items-end gap-3">
            <div className="flex-1">
              <label className="text-xs text-neutral-500 font-medium mb-1.5 block">Max Comments</label>
              <select
                value={maxComments}
                onChange={e => setMaxComments(Number(e.target.value))}
                className="w-full border border-neutral-500/30 rounded-xl px-4 py-2.5 text-sm text-black focus:outline-none focus:border-black transition-colors bg-white"
              >
                {[10, 20, 30, 50, 100].map(n => <option key={n} value={n}>{n} comments</option>)}
              </select>
            </div>
            <button
              onClick={handleAnalyze}
              disabled={loading || !videoId.trim()}
              className="flex items-center gap-2 bg-black text-white px-6 py-2.5 rounded-xl text-sm font-medium hover:bg-neutral-800 transition-colors disabled:opacity-50"
            >
              {loading ? <Loader2 size={14} className="animate-spin" /> : <MessageSquare size={14} />}
              {loading ? 'Analyzing...' : 'Analyze Comments'}
            </button>
          </div>
        </div>
      </div>

      {/* Results */}
      {comments.length > 0 && (
        <div className="space-y-4">

          {/* Stats + Post All bar */}
          <div className="border border-neutral-500/30 rounded-2xl p-4 bg-white flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-4">
              <div className="text-center">
                <p className="text-xl font-bold text-black">{comments.length}</p>
                <p className="text-[10px] text-neutral-500 uppercase tracking-wide">Analyzed</p>
              </div>
              <div className="w-px h-8 bg-neutral-200" />
              <div className="text-center">
                <p className="text-xl font-bold text-black">{comments.filter(c => c.priority === 'high').length}</p>
                <p className="text-[10px] text-neutral-500 uppercase tracking-wide">High Priority</p>
              </div>
              <div className="w-px h-8 bg-neutral-200" />
              <div className="text-center">
                <p className="text-xl font-bold text-black">{postedCount}</p>
                <p className="text-[10px] text-neutral-500 uppercase tracking-wide">Posted</p>
              </div>
              <div className="w-px h-8 bg-neutral-200" />
              <div className="text-center">
                <p className="text-xl font-bold text-black">{pendingCount}</p>
                <p className="text-[10px] text-neutral-500 uppercase tracking-wide">Pending</p>
              </div>
            </div>
            <button
              onClick={handlePostAll}
              disabled={postingAll || pendingCount === 0}
              className="flex items-center gap-2 bg-black text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-neutral-800 transition-colors disabled:opacity-40"
            >
              {postingAll ? <Loader2 size={14} className="animate-spin" /> : <CheckCheck size={14} />}
              {postingAll ? 'Posting all...' : `Post All (${pendingCount})`}
            </button>
          </div>

          {/* Comment Cards */}
          {comments.map((c) => (
            <div
              key={c.comment_id}
              className={`border rounded-2xl overflow-hidden bg-white transition-colors ${
                posted[c.comment_id] ? 'border-black/20' : 'border-neutral-500/30'
              }`}
            >
              {/* Comment Header */}
              <div className="p-5">
                <div className="flex items-start gap-3">
                  <img
                    src={c.author_profile_image}
                    alt=""
                    className="w-9 h-9 rounded-full shrink-0 bg-neutral-200"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1.5">
                      <span className="text-sm font-semibold text-black">{c.author}</span>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${sentimentStyle[c.sentiment]}`}>
                        {sentimentLabel[c.sentiment]}
                      </span>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${priorityStyle[c.priority]}`}>
                        {c.priority} priority
                      </span>
                      <span className="text-xs text-neutral-400 flex items-center gap-1 ml-auto">
                        <ThumbsUp size={10} /> {c.like_count}
                      </span>
                    </div>
                    <p className="text-sm text-neutral-700 leading-relaxed">{c.text}</p>
                  </div>
                </div>
              </div>

              <Divider />

              {/* Reply Section */}
              <div className="px-5 py-4">
                {posted[c.comment_id] ? (
                  <div className="flex items-center gap-2 text-sm text-black font-medium">
                    <CheckCheck size={15} className="text-black" />
                    Reply posted successfully
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center gap-1.5 text-xs text-neutral-500 font-medium mb-1">
                      <Edit3 size={11} />
                      AI Draft Reply — edit before posting
                    </div>
                    <div className="flex items-start gap-2">
                      <textarea
                        rows={2}
                        value={replies[c.comment_id] || ''}
                        onChange={e => setReplies(r => ({ ...r, [c.comment_id]: e.target.value }))}
                        className="flex-1 border border-neutral-500/30 rounded-xl px-3 py-2.5 text-sm text-black focus:outline-none focus:border-black transition-colors bg-white resize-none leading-relaxed"
                        placeholder="Edit draft reply..."
                      />
                      <button
                        onClick={() => handlePost(c.comment_id)}
                        disabled={posting[c.comment_id]}
                        className="flex items-center gap-1.5 bg-black text-white px-4 py-2.5 rounded-xl text-xs font-semibold hover:bg-neutral-800 transition-colors disabled:opacity-50 shrink-0"
                      >
                        {posting[c.comment_id] ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
                        Post
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
