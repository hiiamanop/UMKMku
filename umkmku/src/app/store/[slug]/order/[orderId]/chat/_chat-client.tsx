'use client'

import { useState, useRef, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Send, Paperclip, Package, ChevronLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface Message {
  id: string
  created_at: string
  role: 'user' | 'assistant'
  sender_type?: 'customer' | 'ai' | 'merchant'
  content: string | null
  attachment_url: string | null
}

interface Props {
  slug: string
  order: any
  tenant: { brand_name: string; qris_image_url: string | null; whatsapp_number: string | null; chatbot_name: string }
  initialMessages: Message[]
}

function fmt(n: number) { return 'Rp ' + n.toLocaleString('id-ID') }

const STATUS_LABEL: Record<string, string> = {
  pending_payment: 'Menunggu Pembayaran',
  payment_submitted: 'Bukti Dikirim — Sedang Diverifikasi',
  payment_verified: 'Pembayaran Terverifikasi',
  shipped: 'Dalam Pengiriman',
  delivered: 'Terkirim',
  cancelled: 'Dibatalkan',
}
const STATUS_COLOR: Record<string, string> = {
  pending_payment: 'text-yellow-600 bg-yellow-50',
  payment_submitted: 'text-blue-600 bg-blue-50',
  payment_verified: 'text-green-600 bg-green-50',
  shipped: 'text-purple-600 bg-purple-50',
  delivered: 'text-green-700 bg-green-100',
  cancelled: 'text-red-500 bg-red-50',
}

export function OrderChatClient({ slug, order, tenant, initialMessages }: Props) {
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [orderStatus, setOrderStatus] = useState(order.status)
  const fileRef = useRef<HTMLInputElement>(null)
  const msgsRef = useRef<HTMLDivElement>(null)
  const [msgsReady, setMsgsReady] = useState(false)

  const scrollToBottom = (onDone?: () => void) => {
    const el = msgsRef.current
    if (!el) { onDone?.(); return }
    requestAnimationFrame(() => requestAnimationFrame(() => {
      el.scrollTop = el.scrollHeight
      onDone?.()
    }))
  }

  // Same pattern as dashboard: scroll then reveal whenever messages update
  useEffect(() => {
    if (messages.length === 0) return
    scrollToBottom(() => setMsgsReady(true))
  }, [messages])

  async function compressImage(file: File): Promise<Blob> {
    return new Promise(resolve => {
      const img = document.createElement('img')
      img.onload = () => {
        const canvas = document.createElement('canvas')
        canvas.width = img.naturalWidth
        canvas.height = img.naturalHeight
        canvas.getContext('2d')!.drawImage(img, 0, 0)
        canvas.toBlob(b => resolve(b ?? file), 'image/jpeg', 0.88)
      }
      img.src = URL.createObjectURL(file)
    })
  }

  async function uploadFile(file: File): Promise<string | null> {
    const supabase = createClient()
    const compressed = await compressImage(file)
    const path = `order-proofs/${order.id}/${Date.now()}.jpg`
    const { error } = await supabase.storage.from('product-images').upload(path, compressed, { upsert: true, contentType: 'image/jpeg' })
    if (error) return null
    const { data } = supabase.storage.from('product-images').getPublicUrl(path)
    return data.publicUrl
  }

  async function sendMessage(content: string | null, attachmentUrl: string | null) {
    setSending(true)

    // Optimistic UI
    const tempId = `temp-${Date.now()}`
    const userMsg: Message = {
      id: tempId,
      created_at: new Date().toISOString(),
      role: 'user',
      content,
      attachment_url: attachmentUrl,
    }
    setMessages(prev => [...prev, userMsg])

    try {
      const res = await fetch('/api/order-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: order.id, content, attachmentUrl }),
      })
      const data = await res.json()

      if (data.reply) {
        const aiMsg: Message = {
          id: `ai-${Date.now()}`,
          created_at: new Date().toISOString(),
          role: 'assistant',
          content: data.reply,
          attachment_url: null,
        }
        setMessages(prev => [...prev, aiMsg])
      }

      if (data.statusUpdated) setOrderStatus('payment_submitted')
    } catch {
      // keep optimistic message, no crash
    } finally {
      setSending(false)
    }
  }

  async function handleSend() {
    if (!text.trim() || sending) return
    const content = text.trim()
    setText('')
    await sendMessage(content, null)
  }

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setSending(true)
    const url = await uploadFile(file)
    e.target.value = ''
    if (url) {
      await sendMessage('Bukti pembayaran:', url)
    } else {
      setSending(false)
    }
  }

  const statusCls = STATUS_COLOR[orderStatus] ?? 'text-black/50 bg-black/5'

  return (
    <div className="bg-[var(--color-secondary)] flex flex-col overflow-hidden" style={{ height: 'calc(100vh - 68px)' }}>

      {/* Header */}
      <div className="bg-white border-b border-black/10 px-4 md:px-8 py-4 flex items-center gap-4 sticky top-[68px] z-10">
        <Link href={`/store/${slug}/profile`} className="text-[var(--color-accent)]/50 hover:text-[var(--color-primary)] transition-colors">
          <ChevronLeft size={20} />
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-body-md font-medium truncate">{tenant.brand_name}</p>
            <span className={`text-label-caps text-[9px] px-2 py-0.5 rounded-full ${statusCls}`}>
              {STATUS_LABEL[orderStatus] ?? orderStatus}
            </span>
          </div>
          <p className="text-[11px] text-[var(--color-accent)]/40 font-sans">
            Pesanan #{order.id.slice(-8).toUpperCase()} · {fmt(order.total_amount)}
          </p>
        </div>
        <Link href={`/store/${slug}/order/${order.id}`}
          className="text-[var(--color-accent)]/40 hover:text-[var(--color-primary)] transition-colors shrink-0">
          <Package size={18} />
        </Link>
      </div>

      {/* Messages — wrapper keeps flex-1 always in flow; opacity hides without layout shift */}
      <div className="flex-1 relative overflow-hidden">
        {!msgsReady && (
          <div className="absolute inset-0 flex items-center justify-center z-10">
            <div className="w-6 h-6 border-2 border-[var(--color-primary)]/30 border-t-[var(--color-primary)] rounded-full animate-spin" />
          </div>
        )}
        <div ref={msgsRef} style={{ opacity: msgsReady ? 1 : 0 }}
          className="h-full overflow-y-auto max-w-[720px] w-full mx-auto px-4 py-6 space-y-4">
        {messages.map(msg => {
          const isMerchant = msg.sender_type === 'merchant'
          const isAudit = msg.sender_type === 'ai' && msg.content?.startsWith('📋')

          // AI audit card — tampil terpisah bukan bubble
          if (isAudit) {
            const isRejected = msg.content?.includes('❌')
            const isWarning = msg.content?.includes('⚠️')
            const borderCls = isRejected ? 'border-red-200 bg-red-50' : isWarning ? 'border-yellow-200 bg-yellow-50' : 'border-green-200 bg-green-50'
            const textCls = isRejected ? 'text-red-700' : isWarning ? 'text-yellow-700' : 'text-green-700'
            return (
              <div key={msg.id} className={`border rounded-xl px-4 py-3 ${borderCls}`}>
                <p className={`text-[11px] leading-relaxed whitespace-pre-line ${textCls}`}>{msg.content}</p>
                <p className="text-[10px] mt-1 opacity-50">
                  {new Date(msg.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            )
          }

          return (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${
              msg.role === 'user'
                ? 'bg-[var(--color-primary)] text-white rounded-tr-sm'
                : 'bg-white border border-black/8 text-[var(--color-accent)] rounded-tl-sm'
            }`}>
              {msg.role === 'assistant' && (
                <p className="text-[9px] tracking-widest uppercase font-sans mb-1.5 text-[var(--color-accent)]/40">
                  {isMerchant ? '👤 Tim Toko' : '🤖 AI Assistant'}
                </p>
              )}
              {msg.role === 'assistant' && msg.attachment_url && (
                <div className="mb-3 bg-white p-3 rounded-lg inline-block">
                  <Image src={msg.attachment_url} alt="QRIS" width={200} height={200} className="block"
                    onLoad={() => scrollToBottom()} />
                </div>
              )}
              {msg.role === 'user' && msg.attachment_url && (
                <div className="mb-2">
                  <Image src={msg.attachment_url} alt="Bukti bayar" width={240} height={180}
                    className="rounded-lg object-cover max-h-[200px] w-auto"
                    onLoad={() => scrollToBottom()} />
                </div>
              )}
              {msg.content && (
                <p className="text-[14px] leading-relaxed whitespace-pre-line">{msg.content}</p>
              )}
              <p className={`text-[10px] mt-1.5 ${msg.role === 'user' ? 'text-white/50' : 'text-[var(--color-accent)]/30'}`}>
                {new Date(msg.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
          )
        })}

        {sending && (
          <div className="flex justify-start">
            <div className="bg-white border border-black/8 rounded-2xl rounded-tl-sm px-4 py-3">
              <div className="flex gap-1">
                {[0, 1, 2].map(i => (
                  <div key={i} className="w-2 h-2 bg-[var(--color-accent)]/30 rounded-full animate-bounce"
                    style={{ animationDelay: `${i * 0.15}s` }} />
                ))}
              </div>
            </div>
          </div>
        )}
        </div>{/* end msgsRef */}
      </div>{/* end wrapper */}

      {/* Input bar */}
      {(orderStatus === 'pending_payment' || orderStatus === 'payment_submitted') && (
        <div className="bg-white border-t border-black/10 px-4 py-3 sticky bottom-0">
          <div className="max-w-[720px] mx-auto flex items-end gap-3">
            <button
              onClick={() => fileRef.current?.click()}
              disabled={sending}
              className="w-10 h-10 flex items-center justify-center text-[var(--color-accent)]/50 hover:text-[var(--color-primary)] transition-colors shrink-0 disabled:opacity-40">
              <Paperclip size={20} />
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
            <textarea
              value={text}
              onChange={e => setText(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
              placeholder="Tulis pesan atau kirim bukti bayar..."
              rows={1}
              disabled={sending}
              className="flex-1 bg-[var(--color-secondary)] border border-black/15 rounded-2xl px-4 py-2.5 text-[14px] resize-none focus:outline-none focus:border-[var(--color-primary)] transition-colors disabled:opacity-60"
            />
            <button
              onClick={handleSend}
              disabled={!text.trim() || sending}
              className="w-10 h-10 bg-[var(--color-primary)] text-white rounded-full flex items-center justify-center shrink-0 disabled:opacity-40 hover:opacity-90 transition-opacity">
              <Send size={16} />
            </button>
          </div>
          <p className="max-w-[720px] mx-auto text-[11px] text-[var(--color-accent)]/30 font-sans mt-2 pl-14">
            📎 Kirim bukti pembayaran (screenshot/foto) menggunakan ikon klip di atas
          </p>
        </div>
      )}

      {orderStatus === 'shipped' && (
        <div className="bg-white border-t border-black/10 px-4 py-4 sticky bottom-0">
          <div className="max-w-[720px] mx-auto text-center">
            <p className="text-[13px] text-[var(--color-accent)]/60 font-sans mb-3">Sudah menerima paketmu?</p>
            <button
              onClick={async () => {
                if (!confirm('Konfirmasi bahwa paket sudah diterima?')) return
                setSending(true)
                await fetch('/api/order-chat/confirm-received', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ orderId: order.id }),
                })
                setOrderStatus('delivered')
                setMessages(prev => [...prev, {
                  id: `ai-${Date.now()}`,
                  created_at: new Date().toISOString(),
                  role: 'assistant',
                  content: '🎉 Terima kasih telah mengkonfirmasi penerimaan paket! Kami sangat senang bisa melayanimu. Jangan lupa tinggalkan review ya! 💕',
                  attachment_url: null,
                }])
                setSending(false)
              }}
              disabled={sending}
              className="bg-[var(--color-primary)] text-white text-label-caps tracking-widest px-8 py-3 hover:opacity-90 transition-opacity disabled:opacity-60">
              ✓ PAKET SUDAH DITERIMA
            </button>
          </div>
        </div>
      )}

      {!['pending_payment', 'payment_submitted', 'shipped'].includes(orderStatus) && (
        <div className="bg-white border-t border-black/10 px-4 py-4 text-center">
          <p className="text-[13px] text-[var(--color-accent)]/50 font-sans">
            {STATUS_LABEL[orderStatus] ?? 'Status diperbarui'}
          </p>
        </div>
      )}
    </div>
  )
}
