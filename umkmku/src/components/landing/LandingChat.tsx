'use client'

import { useState, useRef, useEffect } from 'react'
import { MessageCircle, X, Send, Loader2, Bot, Sparkles } from 'lucide-react'

const COLOR = '#0A2F73'
const AD_KEY = 'umkmu_freelancer_ad_dismissed'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

export function LandingChat() {
  const [open, setOpen] = useState(false)
  const [adVisible, setAdVisible] = useState(false)

  useEffect(() => {
    if (typeof window !== 'undefined' && !localStorage.getItem(AD_KEY)) {
      const t = setTimeout(() => setAdVisible(true), 2000)
      return () => clearTimeout(t)
    }
  }, [])

  function dismissAd() {
    setAdVisible(false)
    localStorage.setItem(AD_KEY, '1')
  }
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (open && messages.length === 0) {
      setMessages([{
        role: 'assistant',
        content: 'Halo! Saya customer care UMKMu. Ada yang ingin kamu tanyakan tentang platform kami?',
      }])
    }
  }, [open, messages.length])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  async function send(text?: string) {
    const msg = (text ?? input).trim()
    if (!msg || loading) return

    const newMessages: Message[] = [...messages, { role: 'user', content: msg }]
    setMessages(newMessages)
    setInput('')
    setLoading(true)

    try {
      const res = await fetch('/api/landing/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages }),
      })
      const data = await res.json()
      setMessages(prev => [...prev, { role: 'assistant', content: data.text ?? 'Maaf, terjadi kesalahan.' }])
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Gagal terhubung. Coba lagi.' }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {/* Freelancer ad — muncul di atas tombol chat */}
      {adVisible && !open && (
        <div
          className="fixed bottom-24 right-6 z-50 w-64 rounded-2xl shadow-xl overflow-hidden"
          style={{ background: COLOR }}
        >
          <button
            onClick={dismissAd}
            className="absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center text-white/60 hover:text-white transition-colors"
            aria-label="Tutup"
          >
            <X size={12} />
          </button>
          <div className="p-4 pr-8">
            <div className="flex items-center gap-2 mb-1.5">
              <Sparkles size={13} className="text-yellow-300 shrink-0" />
              <span className="text-xs font-bold text-yellow-300 uppercase tracking-wide">Untuk Desainer</span>
            </div>
            <p className="text-white text-sm font-semibold leading-snug mb-3">
              Jual template tokomu & dapatkan komisinya!
            </p>
            <a
              href="/freelancer/register"
              onClick={dismissAd}
              className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg transition-opacity hover:opacity-90"
              style={{ background: '#F4B400', color: '#1a1a1a' }}
            >
              Bergabung sekarang →
            </a>
          </div>
        </div>
      )}

      {/* Floating button */}
      <button
        onClick={() => setOpen(o => !o)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-transform hover:scale-105 active:scale-95"
        style={{ background: COLOR }}
        aria-label="Tanya customer care"
      >
        {open ? <X size={22} className="text-white" /> : <MessageCircle size={22} className="text-white" />}
      </button>

      {/* Chat panel */}
      {open && (
        <div className="fixed bottom-24 right-6 z-50 w-[360px] max-h-[520px] rounded-2xl shadow-2xl flex flex-col bg-white border border-gray-100 overflow-hidden">
          {/* Header */}
          <div className="px-4 py-3 flex items-center gap-3 border-b" style={{ background: COLOR }}>
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
              <Bot size={16} className="text-white" />
            </div>
            <div>
              <p className="text-white text-sm font-semibold">Customer Care UMKMu</p>
              <p className="text-white/50 text-xs">Biasanya membalas dalam detik</p>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className="max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap"
                  style={m.role === 'user'
                    ? { background: COLOR, color: '#fff' }
                    : { background: '#F8FAFC', color: '#111827', border: '1px solid #E5EAF0' }}
                >
                  {m.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="rounded-2xl px-4 py-2.5 text-sm" style={{ background: '#F8FAFC', border: '1px solid #E5EAF0' }}>
                  <Loader2 size={14} className="animate-spin text-gray-400" />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="p-3 border-t flex gap-2">
            <input
              className="flex-1 rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none transition-colors"
              placeholder="Ketik pertanyaan..."
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
              onFocus={e => (e.target.style.borderColor = COLOR)}
              onBlur={e => (e.target.style.borderColor = '')}
              disabled={loading}
            />
            <button
              onClick={() => send()}
              disabled={loading || !input.trim()}
              className="w-9 h-9 rounded-xl flex items-center justify-center transition-opacity disabled:opacity-40"
              style={{ background: COLOR }}
            >
              <Send size={14} className="text-white" />
            </button>
          </div>
        </div>
      )}
    </>
  )
}
