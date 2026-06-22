import { useEffect, useState, useMemo } from 'react'
import { getAllVideos } from '../../lib/api'
import {
  Search, Eye, MessageSquare,
  ExternalLink, ChevronDown, Calendar
} from 'lucide-react'
import VideoDetailPage from './VideoDetailPage'

function fmt(n) {
  if (!n) return '0'
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M'
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K'
  return String(n)
}

function parseDuration(iso) {
  if (!iso) return '0:00'
  const m = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/)
  const h = parseInt(m?.[1] || 0)
  const min = parseInt(m?.[2] || 0)
  const s = parseInt(m?.[3] || 0)
  if (h > 0) return `${h}:${String(min).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  return `${min}:${String(s).padStart(2, '0')}`
}

function isShort(duration) {
  if (!duration) return false
  const m = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/)
  const h = parseInt(m?.[1] || 0)
  const min = parseInt(m?.[2] || 0)
  if (h > 0) return false
  if (min >= 1) return false
  return true
}

function likeRatio(likes, views) {
  if (!views) return '0%'
  return ((likes / views) * 100).toFixed(1) + '%'
}

export default function ChannelContent({ creatorId }) {
  const [videos, setVideos] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState('all')       // all | long | short
  const [filterVis, setFilterVis] = useState('all')          // all | public | private | unlisted
  const [filterKids, setFilterKids] = useState('all')        // all | yes | no
  const [sortBy, setSortBy] = useState('date')               // date | views | likes | comments
  const [selectedVideo, setSelectedVideo] = useState(null)  // null = list view, video obj = detail view
  const [rowsPerPage, setRowsPerPage] = useState(30)
  const [page, setPage] = useState(1)

  useEffect(() => {
    getAllVideos(creatorId)
      .then(r => setVideos(r.data.videos || []))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [creatorId])

  const filtered = useMemo(() => {
    let list = [...videos]
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(v => v.title.toLowerCase().includes(q))
    }
    if (filterType === 'short') list = list.filter(v => isShort(v.duration))
    if (filterType === 'long') list = list.filter(v => !isShort(v.duration))
    if (filterVis !== 'all') list = list.filter(v => v.privacy_status === filterVis)
    if (filterKids === 'yes') list = list.filter(v => v.made_for_kids)
    if (filterKids === 'no') list = list.filter(v => !v.made_for_kids)

    list.sort((a, b) => {
      if (sortBy === 'views') return b.view_count - a.view_count
      if (sortBy === 'likes') return b.like_count - a.like_count
      if (sortBy === 'comments') return b.comment_count - a.comment_count
      return new Date(b.published_at) - new Date(a.published_at)
    })
    return list
  }, [videos, search, filterType, filterVis, filterKids, sortBy])

  const paginated = filtered.slice((page - 1) * rowsPerPage, page * rowsPerPage)
  const totalPages = Math.ceil(filtered.length / rowsPerPage)

  // Show detail page when a video is selected
  if (selectedVideo) {
    return <VideoDetailPage video={selectedVideo} creatorId={creatorId} onBack={() => setSelectedVideo(null)} />
  }

  if (loading) return (
    <div className="flex h-72 items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-neutral-300 border-t-black" />
        <p className="text-sm text-neutral-500">Loading your content...</p>
      </div>
    </div>
  )

  if (error) return (
    <div className="flex h-72 items-center justify-center text-sm text-neutral-500">
      Failed to load videos: {error}
    </div>
  )

  return (
    <div className="space-y-5 pb-10">
      {/* Header */}
      <div className="mt-10 rounded-2xl border border-neutral-500/30 bg-white p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-neutral-500">Channel</p>
        <h2 className="mt-1 text-2xl font-semibold text-black">Content</h2>
        <p className="mt-1 text-sm text-neutral-500">{filtered.length} videos · Click any video for full analysis, AI comments & replies</p>
      </div>

      {/* Filters */}
      <div className="rounded-2xl border border-neutral-500/30 bg-white p-4">
        <div className="flex flex-wrap gap-3 items-center">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              placeholder="Search videos..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1) }}
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-neutral-200 text-sm bg-neutral-50 focus:outline-none focus:border-neutral-400 focus:bg-white"
            />
          </div>

          {/* Video type */}
          <Select value={filterType} onChange={v => { setFilterType(v); setPage(1) }} label="Video">
            <option value="all">All Videos</option>
            <option value="long">Long Videos</option>
            <option value="short">Shorts</option>
          </Select>

          {/* Visibility */}
          <Select value={filterVis} onChange={v => { setFilterVis(v); setPage(1) }} label="Visibility">
            <option value="all">All Visibility</option>
            <option value="public">Public</option>
            <option value="private">Private</option>
            <option value="unlisted">Unlisted</option>
          </Select>

          {/* Made for kids */}
          <Select value={filterKids} onChange={v => { setFilterKids(v); setPage(1) }} label="Restrictions">
            <option value="all">All Restrictions</option>
            <option value="yes">Made for Kids</option>
            <option value="no">Not for Kids</option>
          </Select>

          {/* Sort */}
          <Select value={sortBy} onChange={v => { setSortBy(v); setPage(1) }} label="Sort">
            <option value="date">Date</option>
            <option value="views">Views</option>
            <option value="likes">Likes</option>
            <option value="comments">Comments</option>
          </Select>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-neutral-500/30 bg-white overflow-hidden">
        {/* Table Header */}
        <div className="grid grid-cols-[2.5fr_1fr_1fr_1fr_1fr_1fr] gap-4 px-5 py-3 border-b border-neutral-100 bg-neutral-50">
          <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wide">Video</span>
          <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wide">Visibility</span>
          <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wide">Restrictions</span>
          <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wide flex items-center gap-1"><Calendar size={11} />Date</span>
          <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wide flex items-center gap-1"><Eye size={11} />Views</span>
          <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wide">Comments · Likes</span>
        </div>

        {/* Rows */}
        {paginated.length === 0 ? (
          <div className="py-16 text-center text-sm text-neutral-400">No videos match your filters</div>
        ) : (
          paginated.map(video => {
            const short = isShort(video.duration)
            return (
              <div
                key={video.video_id}
                onClick={() => setSelectedVideo(video)}
                className="grid grid-cols-[2.5fr_1fr_1fr_1fr_1fr_1fr] gap-4 px-5 py-4 border-b border-neutral-100 hover:bg-neutral-50 cursor-pointer transition-colors last:border-0"
              >
                {/* Thumbnail + Title */}
                <div className="flex items-center gap-3 min-w-0">
                  <div className="relative shrink-0">
                    <img
                      src={video.thumbnails?.medium || video.thumbnail}
                      alt={video.title}
                      className="h-12 w-20 rounded-lg object-cover bg-neutral-100"
                    />
                    <span className="absolute bottom-1 right-1 bg-black/80 text-white text-[10px] px-1 rounded">
                      {parseDuration(video.duration)}
                    </span>
                    {short && (
                      <span className="absolute top-1 left-1 bg-red-500 text-white text-[9px] px-1 rounded font-bold">#S</span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-black truncate">{video.title}</p>
                    <p className="text-xs text-neutral-400 mt-0.5 truncate">{video.description?.slice(0, 60) || 'No description'}</p>
                  </div>
                </div>

                {/* Visibility */}
                <div className="flex items-center">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${
                    video.privacy_status === 'public' ? 'bg-green-100 text-green-700' :
                    video.privacy_status === 'private' ? 'bg-red-100 text-red-700' :
                    'bg-yellow-100 text-yellow-700'
                  }`}>
                    {video.privacy_status}
                  </span>
                </div>

                {/* Restrictions */}
                <div className="flex items-center">
                  <span className="text-xs text-neutral-500">{video.made_for_kids ? 'Made for kids' : 'None'}</span>
                </div>

                {/* Date */}
                <div className="flex items-center">
                  <span className="text-xs text-neutral-500">
                    {new Date(video.published_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                </div>

                {/* Views */}
                <div className="flex items-center">
                  <span className="text-sm font-medium text-black">{fmt(video.view_count)}</span>
                </div>

                {/* Comments · Likes */}
                <div className="flex items-center gap-3">
                  <span className="text-xs text-neutral-500">{fmt(video.comment_count)}</span>
                  <span className="text-xs font-medium text-black">{likeRatio(video.like_count, video.view_count)}</span>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between px-1 text-sm text-neutral-500">
        <div className="flex items-center gap-2">
          <span>Rows per page:</span>
          <select
            value={rowsPerPage}
            onChange={e => { setRowsPerPage(Number(e.target.value)); setPage(1) }}
            className="border border-neutral-200 rounded-lg px-2 py-1 text-sm text-black bg-white"
          >
            {[10, 30, 50, 100].map(n => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-3">
          <span>{((page - 1) * rowsPerPage) + 1}–{Math.min(page * rowsPerPage, filtered.length)} of {filtered.length}</span>
          <button
            disabled={page === 1}
            onClick={() => setPage(p => p - 1)}
            className="px-3 py-1 rounded-lg border border-neutral-200 hover:bg-neutral-50 disabled:opacity-40 disabled:cursor-not-allowed"
          >←</button>
          <button
            disabled={page >= totalPages}
            onClick={() => setPage(p => p + 1)}
            className="px-3 py-1 rounded-lg border border-neutral-200 hover:bg-neutral-50 disabled:opacity-40 disabled:cursor-not-allowed"
          >→</button>
        </div>
      </div>


    </div>
  )
}

function Select({ value, onChange, children, label }) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="appearance-none border border-neutral-200 rounded-xl px-3 py-2 pr-8 text-sm text-black bg-white hover:border-neutral-300 focus:outline-none focus:border-neutral-400 cursor-pointer"
      >
        {children}
      </select>
      <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" />
    </div>
  )
}
