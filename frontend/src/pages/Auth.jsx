import { Zap, Shield, Zap as ZapIcon, BarChart2 } from 'lucide-react'
import { AiFillYoutube } from "react-icons/ai"; // This is correct
const perks = [
  { icon: AiFillYoutube, text: 'Read & reply to YouTube comments' },
  { icon: ZapIcon, text: 'Generate viral hooks and titles' },
  { icon: BarChart2, text: 'Analyze retention and revenue' },
  { icon: Shield, text: 'Secure OAuth — we never store passwords' },
]

export default function Auth() {
  return (
    <div className="min-h-screen bg-[#FFFFFF]  text-black flex">
      {/* Left Panel */}
      <div className="hidden lg:flex w-1/2 border-r border-neutral-500/30 flex-col justify-between p-12">
        <div className="flex items-center gap-2">
          <img src='https://ik.imagekit.io/qwzhnpeqg/crewflow/Screenshot%202026-06-21%20105738.png' className='w-40'/>
        </div>
        <div>
          <h2 className="text-5xl font-bold leading-tight mb-4">
            Your AI-powered<br />Content Engine
          </h2>
          <p className="text-neutral-400 mb-10 text-lg leading-relaxed">
            Connect your YouTube channel once. Let CrewFlow handle the rest from comment replies to trend jacking.
          </p>
          <div className="space-y-4">
            {perks.map((p) => (
              <div key={p.text} className="flex items-center gap-3">
                <div className="w-8 h-8 border border-black rounded-full flex items-center justify-center shrink-0">
                  <p.icon size={14} className="text-black" />
                </div>
                <span className="text-sm text-neutral-700">{p.text}</span>
              </div>
            ))}
          </div>
        </div>
        <p className="text-xs text-neutral-600">© 2026 CrewFlow. All rights reserved.</p>
      </div>

      {/* Right Panel */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-10 lg:hidden">
            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
              <Zap size={16} className="text-black" />
            </div>
            <span className="font-semibold text-lg">CrewFlow</span>
          </div>

          <h1 className="text-2xl font-bold mb-2">Connect your channel</h1>
          <p className="text-neutral-400 text-sm mb-8">
            Sign in with Google to connect your YouTube channel and unlock all features.
          </p>

          <a
            href="http://localhost:8000/auth/youtube/start"
            className="flex items-center border border-neutral-500/30 justify-center gap-3 w-full bg-white text-black py-3.5 rounded-xl font-semibold hover:bg-neutral-200 transition-colors mb-4"
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Continue with Google
          </a>

         
        </div>
      </div>
    </div>
  )
}
