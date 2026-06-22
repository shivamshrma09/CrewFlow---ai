import { useState, useEffect, useRef } from 'react'
import { chatWithStudio } from '../../lib/api'
import { Send, Sparkles, Trash2, Bot, User, Loader2 } from 'lucide-react'
import { RiGeminiFill } from 'react-icons/ri'

// Simple helper to parse basic markdown to styled HTML elements safely
function parseMarkdown(text) {
  if (!text) return ''

  // Escape HTML to prevent XSS
  let html = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')

  // Bold: **text** -> <strong>text</strong>
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')

  // Italic: *text* -> <em>text</em>
  html = html.replace(/\*(.*?)\*/g, '<em>$1</em>')

  // Code blocks: ```code``` -> pre/code block
  html = html.replace(/```([\s\S]*?)```/g, "<pre class='bg-neutral-900 text-neutral-100 font-mono text-xs rounded-xl p-3.5 my-2.5 overflow-x-auto border border-neutral-800'><code>$1</code></pre>")

  // Inline code: `code` -> code tag
  html = html.replace(/`(.*?)`/g, "<code class='bg-neutral-100 border border-neutral-200 px-1.5 py-0.5 rounded font-mono text-xs text-red-600'>$1</code>")

  // Bullet points: * item -> li
  html = html.replace(/^\s*[-*]\s+(.*)$/gm, "<li class='list-disc ml-5 mb-1 text-neutral-700'>$1</li>")

  // Headers
  html = html.replace(/^### (.*)$/gm, "<h4 class='text-sm font-semibold text-black mt-3 mb-1'>$1</h4>")
  html = html.replace(/^## (.*)$/gm, "<h3 class='text-base font-semibold text-black mt-4 mb-1.5'>$1</h3>")
  html = html.replace(/^# (.*)$/gm, "<h2 class='text-lg font-bold text-black mt-5 mb-2'>$1</h2>")

  // Split lines to form paragraphs/lists correctly
  const lines = html.split('\n')
  let result = []
  let inList = false

  for (let line of lines) {
    if (line.trim().startsWith('<li')) {
      if (!inList) {
        result.push('<ul class="my-2.5 space-y-1">')
        inList = true
      }
      result.push(line)
    } else {
      if (inList) {
        result.push('</ul>')
        inList = false
      }
      if (line.trim()) {
        const isTag = line.trim().startsWith('<h') ||
                      line.trim().startsWith('<pre') ||
                      line.trim().startsWith('</pre') ||
                      line.trim().startsWith('<code') ||
                      line.trim().startsWith('</code') ||
                      line.trim().startsWith('<ul') ||
                      line.trim().startsWith('</ul')

        if (isTag) {
          result.push(line)
        } else {
          result.push(`<p class="mb-2 leading-relaxed text-sm text-neutral-700">${line}</p>`)
        }
      }
    }
  }

  if (inList) {
    result.push('</ul>')
  }

  return result.join('\n')
}

const PRESETS = [
  { label: 'Summarize my channel performance', query: 'Can you summarize my overall channel performance, views, and subscribers over the last 28 days?' },
  { label: 'What content should I create next?', query: 'Based on my top videos and recent uploads, what topics or content format should I double down on?' },
  { label: 'Analyze traffic & audience devices', query: 'Where are my viewers coming from? Show me my top traffic sources and device breakdown.' },
  { label: 'How to improve view duration?', query: 'Look at my channel stats. How can I improve my average view duration and click-through rates?' }
]

export default function StudioAI({ creatorId }) {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef(null)

  // Load chat history from localStorage if exists
  useEffect(() => {
    const saved = localStorage.getItem(`cf_studio_chat_${creatorId}`)
    if (saved) {
      try {
        setMessages(JSON.parse(saved))
      } catch (e) {
        console.error(e)
      }
    } else {
      setMessages([
        {
          id: 'welcome',
          sender: 'ai',
          text: "Hi! I am **Studio AI**, your channel strategist. 🚀\n\nI have fetched your real-time YouTube statistics and analytics. Ask me anything about your traffic sources, views, subscriber growth, or video ideas!",
          time: new Date().toISOString()
        }
      ])
    }
  }, [creatorId])

  // Save chat history
  const saveMessages = (newMsgs) => {
    setMessages(newMsgs)
    localStorage.setItem(`cf_studio_chat_${creatorId}`, JSON.stringify(newMsgs))
  }

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  async function handleSend(textToSend) {
    const query = textToSend || input
    if (!query.trim() || loading) return

    if (!textToSend) setInput('')

    const userMsg = {
      id: Math.random().toString(36).substring(7),
      sender: 'user',
      text: query,
      time: new Date().toISOString()
    }

    const updatedMessages = [...messages, userMsg]
    saveMessages(updatedMessages)
    setLoading(true)

    try {
      // Map message history to format expected by backend
      const historyPayload = updatedMessages
        .filter(m => m.id !== 'welcome')
        .slice(-8) // Send last 8 messages for context window efficiency
        .map(m => ({
          sender: m.sender,
          text: m.text
        }))

      const res = await chatWithStudio({
        creator_id: creatorId,
        message: query,
        chat_history: historyPayload
      })

      const aiMsg = {
        id: Math.random().toString(36).substring(7),
        sender: 'ai',
        text: res.data.reply,
        time: new Date().toISOString()
      }

      saveMessages([...updatedMessages, aiMsg])
    } catch (e) {
      const errorMsg = {
        id: Math.random().toString(36).substring(7),
        sender: 'ai',
        text: `Sorry, I encountered an error while processing your request. Please check if your YouTube channel is connected properly.\n\nError: ${e.response?.data?.error || e.message}`,
        time: new Date().toISOString()
      }
      saveMessages([...updatedMessages, errorMsg])
    } finally {
      setLoading(false)
    }
  }

  const handleClear = () => {
    if (window.confirm("Are you sure you want to clear this chat history?")) {
      const reset = [
        {
          id: 'welcome',
          sender: 'ai',
          text: "Hi! I am **Studio AI**, your channel strategist. 🚀\n\nI have fetched your real-time YouTube statistics and analytics. Ask me anything about your traffic sources, views, subscriber growth, or video ideas!",
          time: new Date().toISOString()
        }
      ]
      saveMessages(reset)
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-60px)] max-h-[850px] bg-white border border-neutral-200 rounded-3xl overflow-hidden shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-neutral-100 px-6 py-4 bg-white shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-black text-white">
            <RiGeminiFill size={20} className="animate-pulse" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-black flex items-center gap-1.5">
              Studio AI
              <span className="text-[10px] bg-black text-white px-2 py-0.5 rounded-full font-medium tracking-wide uppercase">Assistant</span>
            </h2>
            <p className="text-xs text-neutral-500">Intelligent channel analytics strategist</p>
          </div>
        </div>

        <button 
          onClick={handleClear}
          className="p-2 hover:bg-red-50 hover:text-red-500 rounded-xl text-neutral-400 transition-colors tooltip"
          title="Clear chat"
        >
          <Trash2 size={16} />
        </button>
      </div>

      {/* Message Area */}
      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4 bg-neutral-50/50">
        {messages.map((m) => {
          const isUser = m.sender === 'user'
          return (
            <div key={m.id} className={`flex items-start gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}>
              {!isUser && (
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-black text-white shrink-0 shadow-sm mt-0.5">
                  <Bot size={15} />
                </div>
              )}
              
              <div 
                className={`text-sm px-4 py-3 shadow-sm ${
                  isUser 
                    ? 'bg-neutral-900 text-white rounded-2xl rounded-tr-none max-w-[80%]' 
                    : 'bg-white border border-neutral-200/80 text-neutral-800 rounded-2xl rounded-tl-none max-w-[80%]'
                }`}
              >
                <div 
                  className="prose prose-neutral prose-sm max-w-none text-left" 
                  dangerouslySetInnerHTML={{ __html: parseMarkdown(m.text) }} 
                />
              </div>

              {isUser && (
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-neutral-200 text-neutral-700 shrink-0 border border-neutral-300 mt-0.5">
                  <User size={15} />
                </div>
              )}
            </div>
          )
        })}

        {/* Loading Indicator */}
        {loading && (
          <div className="flex items-start gap-3 justify-start">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-black text-white shrink-0 shadow-sm mt-0.5">
              <Bot size={15} />
            </div>
            <div className="bg-white border border-neutral-200/85 rounded-2xl rounded-tl-none px-5 py-4 shadow-sm flex items-center gap-2">
              <Loader2 size={14} className="animate-spin text-neutral-500" />
              <span className="text-xs text-neutral-500 font-medium">Studio AI is analyzing your channel data...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input / Quick Queries */}
      <div className="border-t border-neutral-100 p-5 bg-white shrink-0 space-y-4">
        {messages.length === 1 && !loading && (
          <div className="space-y-2">
            <p className="text-[11px] font-semibold text-neutral-400 tracking-wider uppercase mb-1">Suggested questions</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {PRESETS.map((p, i) => (
                <button
                  key={i}
                  onClick={() => handleSend(p.query)}
                  className="flex items-center gap-2 border border-neutral-200 hover:border-neutral-800/20 hover:bg-neutral-50 bg-white text-neutral-700 rounded-2xl px-4 py-3 text-xs text-left transition-all duration-200 font-medium shadow-sm hover:shadow"
                >
                  <Sparkles size={12} className="text-neutral-400 shrink-0" />
                  <span className="truncate">{p.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="flex items-center gap-2.5">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask about views, best times, ideas..."
            disabled={loading}
            className="flex-1 bg-neutral-50 border border-neutral-200 hover:border-neutral-300 focus:border-black rounded-2xl px-4 py-3.5 text-sm text-black placeholder-neutral-400 focus:outline-none transition-all"
          />
          <button
            onClick={() => handleSend()}
            disabled={loading || !input.trim()}
            className="flex h-11 w-11 items-center justify-center bg-black text-white hover:bg-neutral-800 disabled:opacity-40 disabled:hover:bg-black rounded-2xl shadow-sm hover:shadow transition-all"
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  )
}
