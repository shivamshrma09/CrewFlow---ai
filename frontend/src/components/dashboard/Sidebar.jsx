import {
  LayoutDashboard, MessageSquare, Zap, RefreshCw,
  Mic, Languages, MonitorPlay, BarChart2, TrendingUp,
  Users, LogOut, PlaySquare, PlusCircle, Clapperboard
} from 'lucide-react'
import { RiGeminiFill } from 'react-icons/ri'

const nav = [
  { label: 'Overview', icon: LayoutDashboard, to: '?tab=overview' },
  { label: 'Content', icon: PlaySquare, to: '?tab=content' },
  { label: 'divider', label2: 'COGNITIVE' },
  { label: 'Publish Post', icon: PlusCircle, to: '?tab=posts' },
  { label: 'Comments', icon: MessageSquare, to: '?tab=comments' },
  { label: 'Hook Generator', icon: Zap, to: '?tab=hooks' },
  { label: 'Repurpose', icon: RefreshCw, to: '?tab=repurpose' },
  { label: 'divider', label2: 'VIDEO STUDIO' },
  { label: 'Video Studio', icon: Clapperboard, to: '?tab=videostudio' },
  { label: 'divider', label2: 'VOICE' },
  { label: 'Transcribe', icon: Mic, to: '?tab=transcribe' },
  { label: 'Translate', icon: Languages, to: '?tab=translate' },
  { label: 'Video Resize', icon: MonitorPlay, to: '?tab=resize' },
  { label: 'divider', label2: 'ANALYTICS' },
  { label: 'Studio AI', icon: RiGeminiFill, to: '?tab=studio-ai' },
  { label: 'Retention', icon: BarChart2, to: '?tab=retention' },
  { label: 'Revenue', icon: TrendingUp, to: '?tab=revenue' },
  { label: 'Fake Scanner', icon: Users, to: '?tab=fakescan' },
  { label: 'divider', label2: 'GROWTH' },
  { label: 'Trends', icon: TrendingUp, to: '?tab=trendhub' },
  { label: 'Collaborators', icon: Users, to: '?tab=collaborators' },
]

export default function Sidebar({ creator, tab, setTab }) {
  return (
    <aside className="w-70 bg-[#FFFFFF] shrink-0 border-r border-neutral-500/30 flex flex-col h-screen sticky top-0">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 py-5 border-b border-neutral-500/30">
        <img src='https://ik.imagekit.io/qwzhnpeqg/crewflow/Screenshot%202026-06-21%20105738.png' className='w-30'/>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-0.5">
        {nav.map((item, i) => {
          if (item.label === 'divider') return (
            <div key={i} className="px-2 pt-5 pb-1.5">
              <span className="text-[11px] font-semibold text-neutral-500 tracking-widest">{item.label2}</span>
            </div>
          )
          const active = tab === item.to.replace('?tab=', '')
          return (
            <button
              key={item.label}
              onClick={() => setTab(item.to.replace('?tab=', ''))}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors text-left ${
                active
                  ? ' text-white border bg-black font-medium'
                  : 'text-neutral-600  hover:text-black hover:border  hover:border-neutral-500/30'
              }`}
            >
              <item.icon size={16} />
              {item.label}
            </button>
          )
        })}
      </nav>

      {/* Creator Profile */}
      {creator && (
        <div className="border-t border-neutral-500/30 p-4">
          <div className="flex items-center gap-3">
            <img src={creator.picture} alt="" className="w-9 h-9 rounded-full" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-black truncate">{creator.name}</p>
              <p className="text-xs text-neutral-500 truncate">{creator.email}</p>
            </div>
            <button
              onClick={() => { localStorage.clear(); window.location.href = '/' }}
              className="text-neutral-500 hover:text-black transition-colors"
            >
              <LogOut size={15} />
            </button>
          </div>
        </div>
      )}
    </aside>
  )
}
