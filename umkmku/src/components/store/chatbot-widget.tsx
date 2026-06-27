'use client'

import { useState, useRef, useEffect } from 'react'
import { Bot, X, Send } from 'lucide-react'
import type { Tenant, Product } from '@/lib/supabase/types'
import { ChatbotMessages } from './chatbot-messages'

interface Props {
  tenant: Tenant
  products: Product[]
}

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
}

const MAX_MESSAGES = 10

export function ChatbotWidget({ tenant, products }: Props) {
  const [isOpen, setIsOpen] = useState(false)
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: `Halo! Saya ${tenant.chatbot_name ?? 'Beauty Advisor'} dari ${tenant.brand_name}. Ada yang bisa saya bantu? 😊`,
    },
  ])
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const isSessionExhausted = messages.length >= MAX_MESSAGES

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading || isSessionExhausted) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
    }

    const updatedMessages = [...messages, userMessage]
    setMessages(updatedMessages)
    setInput('')
    setIsLoading(true)
    setError(null)

    // Placeholder untuk streaming response
    const assistantId = (Date.now() + 1).toString()
    setMessages(prev => [...prev, { id: assistantId, role: 'assistant', content: '' }])

    try {
      const response = await fetch(`/api/chat/${tenant.slug}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: updatedMessages.map(m => ({
            role: m.role,
            content: m.content,
          })),
        }),
      })

      if (!response.ok) {
        const text = await response.text()
        throw new Error(text || `HTTP ${response.status}`)
      }

      if (!response.body) throw new Error('No response body')

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let fullText = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value, { stream: true })
        console.log('CHUNK:', JSON.stringify(chunk))
        fullText += chunk
        setMessages(prev =>
          prev.map(m => m.id === assistantId ? { ...m, content: fullText } : m)
        )
      }
      console.log('FULL TEXT:', fullText)
    } catch (err) {
      setError('Maaf, terjadi kesalahan. Coba lagi.')
      // Hapus placeholder jika error
      setMessages(prev => prev.filter(m => m.id !== assistantId))
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, isOpen])

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-105"
        style={{ backgroundColor: 'var(--color-primary)' }}
        aria-label={isOpen ? 'Tutup chat' : 'Buka chat dengan beauty advisor'}
      >
        {isOpen ? (
          <X className="w-5 h-5 text-white" />
        ) : (
          <Bot className="w-5 h-5 text-white" />
        )}
      </button>

      {/* Chat panel */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 w-[340px] max-h-[520px] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-gray-100">
          {/* Header */}
          <div
            className="px-4 py-3 flex items-center gap-3"
            style={{ backgroundColor: 'var(--color-primary)' }}
          >
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
              <span className="text-white text-sm">✨</span>
            </div>
            <div>
              <p className="text-white font-medium text-sm">{tenant.chatbot_name ?? 'Beauty Advisor'}</p>
              <p className="text-white/70 text-xs">{tenant.brand_name}</p>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
            <ChatbotMessages messages={messages} products={products} slug={tenant.slug} />
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 rounded-2xl px-4 py-2 text-sm text-gray-500">
                  Mengetik...
                </div>
              </div>
            )}
            {error && (
              <div className="text-red-500 text-xs text-center">{error}</div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          {isSessionExhausted ? (
            <div className="p-3 border-t text-center">
              <p className="text-xs text-gray-500">
                Sesi telah mencapai batas. Muat ulang halaman untuk memulai sesi baru.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="p-3 border-t flex gap-2">
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="Tanya tentang produk..."
                className="flex-1 text-sm px-3 py-2 border rounded-full outline-none focus:border-gray-400"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="w-8 h-8 rounded-full flex items-center justify-center disabled:opacity-40 transition-opacity"
                style={{ backgroundColor: 'var(--color-primary)' }}
              >
                <Send className="w-3.5 h-3.5 text-white" />
              </button>
            </form>
          )}
        </div>
      )}
    </>
  )
}
