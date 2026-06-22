import { useState } from 'react'
import { Sparkles, Loader2, Send, Image as ImageIcon, Type, BarChart2, ThumbsUp, MessageSquare, Eye, RefreshCw, Copy, Check, X } from 'lucide-react'
import { generatePostMetadata } from '../../lib/api'

function Divider() {
  return <div className="border-t border-neutral-500/30" />
}

const POST_TYPES = [
  { id: 'text', label: 'Text Post', icon: Type, desc: 'Write a community update or announcement' },
  { id: 'image', label: 'Image Post', icon: ImageIcon, desc: 'Share an image with your community' },
  { id: 'poll', label: 'Poll', icon: BarChart2, desc: 'Ask your audience a question' },
]

const TONES = ['Casual', 'Motivational', 'Informative', 'Funny', 'Promotional']

// Mock community post analytics data
const MOCK_POSTS = [
  {
    id: 1,
    type: 'text',
    content: 'New video dropping tomorrow! 🎬 Working on something really special for you all. Stay tuned and make sure notifications are ON!',
    image: null,
    published_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    likes: 1243,
    comments: 87,
    views: 18400,
    status: 'published',
  },
  {
    id: 2,
    type: 'poll',
    content: 'What should my next video be about?',
    options: ['React Tutorial', 'AI Tools', 'Productivity Tips', 'Career Advice'],
    published_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    likes: 892,
    comments: 134,
    views: 22100,
    status: 'published',
  },
  {
    id: 3,
    type: 'image',
    content: 'Behind the scenes of my recording setup! 📸',
    image: 'https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?w=400',
    published_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    likes: 2100,
    comments: 203,
    views: 31500,
    status: 'published',
  },
]

function timeAgo(dateStr) {
  const d = Math.floor((Date.now() - new Date(dateStr)) / 86400000)
  if (d === 0) return 'Today'
  if (d === 1) return 'Yesterday'
  if (d < 7) return `${d} days ago`
  if (d < 30) return `${Math.floor(d / 7)}w ago`
  return `${Math.floor(d / 30)}mo ago`
}

function fmt(n) {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M'
  if (n >= 1000) return (n / 1000).toFixed(1) + 'K'
  return n?.toString() || '0'
}

export default function PostManager({ creatorId }) {
  const [tab, setTab] = useState('create')

  // Create post state
  const [postType, setPostType]   = useState('text')
  const [topic, setTopic]         = useState('')
  const [tone, setTone]           = useState('Casual')
  const [content, setContent]     = useState('')
  const [imageUrl, setImageUrl]   = useState('')
  const [imagePrompt, setImagePrompt] = useState('')
  const [pollOptions, setPollOptions] = useState(['', ''])
  const [generating, setGenerating]   = useState(false)
  const [genImage, setGenImage]       = useState(false)
  const [publishing, setPublishing]   = useState(false)
  const [published, setPublished]     = useState(false)
  const [copied, setCopied]           = useState(false)
  const [posts, setPosts]             = useState(MOCK_POSTS)

  // AI generate community post text
  async function handleGenerate() {
    if (!topic.trim()) return
    setGenerating(true)
    try {
      const res = await generatePostMetadata({
        prompt: `YouTube community post about: ${topic}. Tone: ${tone}. Post type: ${postType}. Write only the post text, no title, no hashtags. Keep it short and engaging (max 3 sentences).`
      })
      setContent(res.data.description || res.data.title || '')
    } catch {
      // fallback mock
      setContent(`Hey everyone! ${topic} — drop your thoughts in the comments below. Can't wait to hear what you think! 🔥`)
    } finally {
      setGenerating(false)
    }
  }

  // Generate AI image via Pollinations
  function handleGenImage() {
    if (!imagePrompt.trim()) return
    setGenImage(true)
    setTimeout(() => {
      const seed = Math.floor(Math.random() * 999999)
      setImageUrl(`https://image.pollinations.ai/prompt/${encodeURIComponent(imagePrompt)}?width=1280&height=720&nologo=true&seed=${seed}`)
      setGenImage(false)
    }, 1500)
  }

  function handleAddOption() {
    if (pollOptions.length < 4) setPollOptions([...pollOptions, ''])
  }

  function handleOptionChange(i, val) {
    const updated = [...pollOptions]
    updated[i] = val
    setPollOptions(updated)
  }

  function handleRemoveOption(i) {
    if (pollOptions.length <= 2) return
    setPollOptions(pollOptions.filter((_, idx) => idx !== i))
  }

  async function handlePublish() {
    if (!content.trim()) return
    setPublishing(true)
    await new Promise(r => setTimeout(r, 1800))

    const newPost = {
      id: Date.now(),
      type: postType,
      content,
      image: postType === 'image' ? imageUrl : null,
      options: postType === 'poll' ? pollOptions.filter(Boolean) : undefined,
      published_at: new Date().toISOString(),
      likes: 0,
      comments: 0,
      views: 0,
      status: 'published',
    }
    setPosts(prev => [newPost, ...prev])
    setPublishing(false)
    setPublished(true)
    setTimeout(() => {
      setPublished(false)
      setContent('')
      setTopic('')
      setImageUrl('')
      setImagePrompt('')
      setPollOptions(['', ''])
      setTab('analytics')
    }, 1500)
  }

  function handleCopy() {
    navigator.clipboard.writeText(content)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  const totalViews    = posts.reduce((s, p) => s + p.views, 0)
  const totalLikes    = posts.reduce((s, p) => s + p.likes, 0)
  const totalComments = posts.reduce((s, p) => s + p.comments, 0)
  const avgEngagement = posts.length ? ((totalLikes + totalComments) / totalViews * 100).toFixed(2) : '0'

  return (
    <div className="space-y-5 pb-10">

      {/* Header */}
      <div className="mt-10 flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl text-black font-bold">Community Posts</h1>
          <p className="text-sm text-neutral-500 mt-1">Create & analyze your YouTube community posts with AI.</p>
        </div>
        <div className="flex gap-2">
          {['create', 'analytics'].map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-xl text-sm font-medium border transition-colors capitalize ${
                tab === t
                  ? 'bg-black text-white border-black'
                  : 'bg-white text-neutral-600 border-neutral-500/30 hover:border-neutral-400'
              }`}
            >
              {t === 'create' ? 'Create Post' : 'Post Analytics'}
            </button>
          ))}
        </div>
      </div>

      {tab === 'create' ? (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">

          {/* Left — Composer */}
          <div className="xl:col-span-2 space-y-5">

            {/* Post Type Selector */}
            <div className="border border-neutral-500/30 rounded-2xl overflow-hidden bg-white">
              <div className="px-6 pt-5 pb-4">
                <h3 className="text-black font-semibold">Post Type</h3>
              </div>
              <Divider />
              <div className="p-5 grid grid-cols-3 gap-3">
                {POST_TYPES.map(pt => (
                  <button
                    key={pt.id}
                    onClick={() => setPostType(pt.id)}
                    className={`flex flex-col items-center gap-2 p-4 rounded-xl border text-center transition-all ${
                      postType === pt.id
                        ? 'border-black bg-black text-white'
                        : 'border-neutral-500/30 hover:border-neutral-400 text-black'
                    }`}
                  >
                    <pt.icon size={20} />
                    <span className="text-xs font-semibold">{pt.label}</span>
                    <span className={`text-[10px] leading-tight ${postType === pt.id ? 'text-neutral-300' : 'text-neutral-500'}`}>{pt.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* AI Generator */}
            <div className="border border-neutral-500/30 rounded-2xl overflow-hidden bg-white">
              <div className="px-6 pt-5 pb-4 flex items-center gap-2">
                <Sparkles size={16} className="text-black" />
                <h3 className="text-black font-semibold">AI Post Generator</h3>
              </div>
              <Divider />
              <div className="p-5 space-y-4">
                <div>
                  <label className="text-xs text-neutral-500 font-medium mb-1.5 block">What is this post about?</label>
                  <input
                    value={topic}
                    onChange={e => setTopic(e.target.value)}
                    placeholder="e.g. new video dropping tomorrow, asking for poll, celebrating 100k subs..."
                    className="w-full border border-neutral-500/30 rounded-xl px-4 py-2.5 text-sm text-black placeholder:text-neutral-400 focus:outline-none focus:border-black transition-colors bg-white"
                  />
                </div>
                <div>
                  <label className="text-xs text-neutral-500 font-medium mb-1.5 block">Tone</label>
                  <div className="flex flex-wrap gap-2">
                    {TONES.map(t => (
                      <button
                        key={t}
                        onClick={() => setTone(t)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                          tone === t
                            ? 'bg-black text-white border-black'
                            : 'border-neutral-500/30 text-neutral-600 hover:border-neutral-400'
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
                <button
                  onClick={handleGenerate}
                  disabled={generating || !topic.trim()}
                  className="flex items-center gap-2 bg-black text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-neutral-800 transition-colors disabled:opacity-50"
                >
                  {generating ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                  {generating ? 'Generating...' : 'Generate Post'}
                </button>
              </div>
            </div>

            {/* Post Composer */}
            <div className="border border-neutral-500/30 rounded-2xl overflow-hidden bg-white">
              <div className="px-6 pt-5 pb-4 flex items-center justify-between">
                <h3 className="text-black font-semibold">Compose Post</h3>
                {content && (
                  <button onClick={handleCopy} className="flex items-center gap-1.5 text-xs text-neutral-500 hover:text-black transition-colors">
                    {copied ? <Check size={13} /> : <Copy size={13} />}
                    {copied ? 'Copied' : 'Copy'}
                  </button>
                )}
              </div>
              <Divider />
              <div className="p-5 space-y-4">
                <textarea
                  rows={5}
                  value={content}
                  onChange={e => setContent(e.target.value)}
                  placeholder="Write your community post here, or use AI to generate one above..."
                  className="w-full border border-neutral-500/30 rounded-xl px-4 py-3 text-sm text-black placeholder:text-neutral-400 focus:outline-none focus:border-black transition-colors bg-white resize-none leading-relaxed"
                />
                <div className="flex items-center justify-between text-xs text-neutral-400">
                  <span>{content.length} characters</span>
                  {content.length > 1000 && <span className="text-black font-medium">Keep it concise for best reach</span>}
                </div>

                {/* Poll options */}
                {postType === 'poll' && (
                  <div className="space-y-2">
                    <label className="text-xs text-neutral-500 font-medium block">Poll Options</label>
                    {pollOptions.map((opt, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <input
                          value={opt}
                          onChange={e => handleOptionChange(i, e.target.value)}
                          placeholder={`Option ${i + 1}`}
                          className="flex-1 border border-neutral-500/30 rounded-xl px-3 py-2 text-sm text-black focus:outline-none focus:border-black transition-colors bg-white"
                        />
                        {pollOptions.length > 2 && (
                          <button onClick={() => handleRemoveOption(i)} className="text-neutral-400 hover:text-black transition-colors">
                            <X size={15} />
                          </button>
                        )}
                      </div>
                    ))}
                    {pollOptions.length < 4 && (
                      <button onClick={handleAddOption} className="text-xs text-neutral-500 hover:text-black transition-colors font-medium">
                        + Add option
                      </button>
                    )}
                  </div>
                )}

                {/* Image section */}
                {postType === 'image' && (
                  <div className="space-y-3">
                    <Divider />
                    <label className="text-xs text-neutral-500 font-medium block">AI Image for Post</label>
                    <div className="flex gap-2">
                      <input
                        value={imagePrompt}
                        onChange={e => setImagePrompt(e.target.value)}
                        placeholder="Describe the image e.g. cinematic studio setup with ring light..."
                        className="flex-1 border border-neutral-500/30 rounded-xl px-4 py-2.5 text-sm text-black placeholder:text-neutral-400 focus:outline-none focus:border-black transition-colors bg-white"
                      />
                      <button
                        onClick={handleGenImage}
                        disabled={genImage || !imagePrompt.trim()}
                        className="flex items-center gap-2 bg-black text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-neutral-800 transition-colors disabled:opacity-50 shrink-0"
                      >
                        {genImage ? <Loader2 size={14} className="animate-spin" /> : <ImageIcon size={14} />}
                        Generate
                      </button>
                    </div>
                    {imageUrl && (
                      <div className="relative rounded-xl overflow-hidden border border-neutral-500/30 aspect-video bg-neutral-100">
                        <img src={imageUrl} alt="AI Generated" className="w-full h-full object-cover" />
                        <button
                          onClick={() => setImageUrl('')}
                          className="absolute top-2 right-2 bg-black text-white rounded-lg p-1 hover:bg-neutral-800 transition-colors"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right — Preview + Publish */}
          <div className="space-y-5">

            {/* Live Preview */}
            <div className="border border-neutral-500/30 rounded-2xl overflow-hidden bg-white">
              <div className="px-6 pt-5 pb-4">
                <h3 className="text-black font-semibold">Preview</h3>
                <p className="text-xs text-neutral-500 mt-0.5">How it looks on YouTube Community</p>
              </div>
              <Divider />
              <div className="p-5">
                {/* Channel mock header */}
                <div className="flex items-center gap-2.5 mb-3">
                  <div className="w-9 h-9 rounded-full bg-black flex items-center justify-center text-white text-xs font-bold shrink-0">YT</div>
                  <div>
                    <p className="text-sm font-semibold text-black">Your Channel</p>
                    <p className="text-[10px] text-neutral-400">Just now</p>
                  </div>
                </div>

                {/* Content preview */}
                <div className="text-sm text-neutral-800 leading-relaxed whitespace-pre-wrap min-h-[60px]">
                  {content || <span className="text-neutral-300 italic">Your post will appear here...</span>}
                </div>

                {/* Poll preview */}
                {postType === 'poll' && pollOptions.filter(Boolean).length >= 2 && (
                  <div className="mt-3 space-y-2">
                    {pollOptions.filter(Boolean).map((opt, i) => (
                      <div key={i} className="border border-neutral-500/30 rounded-lg px-3 py-2 text-xs text-neutral-700 hover:bg-neutral-50 transition-colors cursor-pointer">
                        {opt}
                      </div>
                    ))}
                  </div>
                )}

                {/* Image preview */}
                {postType === 'image' && imageUrl && (
                  <div className="mt-3 rounded-xl overflow-hidden border border-neutral-200 aspect-video bg-neutral-100">
                    <img src={imageUrl} alt="" className="w-full h-full object-cover" />
                  </div>
                )}

                {/* Mock engagement */}
                <div className="flex items-center gap-4 mt-4 pt-3 border-t border-neutral-100">
                  <span className="flex items-center gap-1 text-xs text-neutral-400"><ThumbsUp size={12} /> Like</span>
                  <span className="flex items-center gap-1 text-xs text-neutral-400"><MessageSquare size={12} /> Comment</span>
                </div>
              </div>
            </div>

            {/* Publish */}
            <div className="border border-neutral-500/30 rounded-2xl overflow-hidden bg-white">
              <div className="px-6 pt-5 pb-4">
                <h3 className="text-black font-semibold">Publish</h3>
              </div>
              <Divider />
              <div className="p-5 space-y-3">
                <div className="rounded-xl bg-neutral-50 border border-neutral-500/30 px-4 py-3 space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-neutral-500">Post type</span>
                    <span className="font-semibold text-black capitalize">{postType}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-neutral-500">Platform</span>
                    <span className="font-semibold text-black">YouTube Community</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-neutral-500">Characters</span>
                    <span className={`font-semibold ${content.length > 1000 ? 'text-black' : 'text-black'}`}>{content.length}</span>
                  </div>
                </div>

                <button
                  onClick={handlePublish}
                  disabled={publishing || published || !content.trim()}
                  className="w-full flex items-center justify-center gap-2 bg-black text-white py-3 rounded-xl text-sm font-semibold hover:bg-neutral-800 transition-colors disabled:opacity-50"
                >
                  {publishing ? (
                    <><Loader2 size={14} className="animate-spin" /> Publishing...</>
                  ) : published ? (
                    <><Check size={14} /> Posted!</>
                  ) : (
                    <><Send size={14} /> Post to Community</>
                  )}
                </button>

                <button
                  onClick={() => { setContent(''); setTopic(''); setImageUrl(''); setPollOptions(['', '']) }}
                  className="w-full flex items-center justify-center gap-2 border border-neutral-500/30 text-neutral-600 py-2.5 rounded-xl text-sm font-medium hover:bg-neutral-50 transition-colors"
                >
                  <RefreshCw size={13} /> Reset
                </button>
              </div>
            </div>
          </div>
        </div>

      ) : (
        /* Analytics Tab */
        <div className="space-y-5">

          {/* Summary Stats */}
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
            {[
              { label: 'Total Posts', value: posts.length },
              { label: 'Total Views', value: fmt(totalViews) },
              { label: 'Total Likes', value: fmt(totalLikes) },
              { label: 'Avg Engagement', value: `${avgEngagement}%` },
            ].map(s => (
              <div key={s.label} className="border border-neutral-500/30 rounded-2xl p-5 bg-white">
                <p className="text-sm text-neutral-500 mb-2">{s.label}</p>
                <p className="text-3xl font-bold text-black tracking-tight">{s.value}</p>
              </div>
            ))}
          </div>

          {/* Post Cards */}
          <div className="border border-neutral-500/30 rounded-2xl overflow-hidden bg-white">
            <div className="px-6 pt-5 pb-4 flex items-center justify-between">
              <h3 className="text-black font-semibold">Community Posts</h3>
              <span className="text-xs text-neutral-500">{posts.length} posts</span>
            </div>
            <Divider />
            <div className="divide-y divide-neutral-500/20">
              {posts.map(post => (
                <div key={post.id} className="p-5 hover:bg-neutral-50 transition-colors">
                  <div className="flex items-start gap-4">

                    {/* Type badge */}
                    <div className="w-10 h-10 rounded-xl bg-neutral-100 border border-neutral-500/30 flex items-center justify-center shrink-0">
                      {post.type === 'text' && <Type size={16} className="text-black" />}
                      {post.type === 'image' && <ImageIcon size={16} className="text-black" />}
                      {post.type === 'poll' && <BarChart2 size={16} className="text-black" />}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-[10px] font-semibold uppercase tracking-wide bg-neutral-100 text-black px-2 py-0.5 rounded-full capitalize">{post.type}</span>
                        <span className="text-xs text-neutral-400">{timeAgo(post.published_at)}</span>
                      </div>

                      <p className="text-sm text-neutral-800 leading-relaxed line-clamp-2 mb-2">{post.content}</p>

                      {post.type === 'poll' && post.options && (
                        <div className="flex flex-wrap gap-1.5 mb-3">
                          {post.options.map((opt, i) => (
                            <span key={i} className="text-[10px] border border-neutral-500/30 px-2 py-0.5 rounded-full text-neutral-600">{opt}</span>
                          ))}
                        </div>
                      )}

                      {post.type === 'image' && post.image && (
                        <img src={post.image} alt="" className="w-32 h-20 object-cover rounded-lg border border-neutral-200 mb-3" />
                      )}

                      {/* Stats row */}
                      <div className="flex items-center gap-5">
                        <span className="flex items-center gap-1.5 text-xs text-neutral-500">
                          <Eye size={12} /> <span className="font-semibold text-black">{fmt(post.views)}</span> views
                        </span>
                        <span className="flex items-center gap-1.5 text-xs text-neutral-500">
                          <ThumbsUp size={12} /> <span className="font-semibold text-black">{fmt(post.likes)}</span> likes
                        </span>
                        <span className="flex items-center gap-1.5 text-xs text-neutral-500">
                          <MessageSquare size={12} /> <span className="font-semibold text-black">{fmt(post.comments)}</span> comments
                        </span>
                        <span className="ml-auto text-xs text-neutral-500">
                          Engagement: <span className="font-semibold text-black">
                            {post.views > 0 ? (((post.likes + post.comments) / post.views) * 100).toFixed(2) : '0'}%
                          </span>
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Best Post Insight */}
          {posts.length > 0 && (() => {
            const best = [...posts].sort((a, b) => b.views - a.views)[0]
            return (
              <div className="border border-neutral-500/30 rounded-2xl p-5 bg-white">
                <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-3">Top Performing Post</p>
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-black flex items-center justify-center shrink-0">
                    {best.type === 'text' && <Type size={15} className="text-white" />}
                    {best.type === 'image' && <ImageIcon size={15} className="text-white" />}
                    {best.type === 'poll' && <BarChart2 size={15} className="text-white" />}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-black font-medium leading-relaxed line-clamp-2">{best.content}</p>
                    <div className="flex items-center gap-4 mt-2">
                      <span className="text-xs text-neutral-500">Views: <span className="font-bold text-black">{fmt(best.views)}</span></span>
                      <span className="text-xs text-neutral-500">Likes: <span className="font-bold text-black">{fmt(best.likes)}</span></span>
                      <span className="text-xs text-neutral-500">Posted: <span className="font-bold text-black">{timeAgo(best.published_at)}</span></span>
                    </div>
                    <p className="text-xs text-neutral-500 mt-2">
                      Tip: <span className="text-black font-medium">Post more {best.type} posts — they get the most reach on your channel.</span>
                    </p>
                  </div>
                </div>
              </div>
            )
          })()}
        </div>
      )}
    </div>
  )
}
