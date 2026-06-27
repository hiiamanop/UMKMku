'use client'

import { useState, useRef, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Send, Paperclip, ShoppingBag, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { Tenant } from '@/lib/supabase/types'

interface Message {
  id: string
  created_at: string
  role: 'user' | 'assistant'
  content: string | null
  attachment_url: string | null
}

interface Order {
  id: string
  created_at: string
  status: string
  total_amount: number
  order_items: { product_name: string; quantity: number; product_price: number | null }[]
}

interface Props {
  slug: string
  tenant: Tenant
  orders: Order[]
}

const STATUS_LABEL: Record<string, string> = {
  pending_payment:   'Menunggu Bayar',
  payment_submitted: 'Bukti Dikirim',
  payment_verified:  'Verified',
  shipped:           'Dikirim',
  delivered:         'Selesai',
  cancelled:         'Dibatalkan',
}

const STATUS_COLOR: Record<string, string> = {
  pending_payment:   'bg-yellow-100 text-yellow-700',
  payment_submitted: 'bg-blue-100 text-blue-700',
  payment_verified:  'bg-indigo-100 text-indigo-700',
  shipped:           'bg-purple-100 text-purple-700',
  delivered:         'bg-green-100 text-green-700',
  cancelled:         'bg-gray-100 text-gray-400',
}

function fmt(n: number) { return 'Rp ' + n.toLocaleString('id-ID') }

function ImageZoom({ src, onClose }: { src: string; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center" onClick={onClose}>
      <button className="absolute top-4 right-4 text-white/70 hover:text-white" onClick={onClose}><X size={24} /></button>
      <div onClick={e => e.stopPropagation()}>
        <Image src={src} alt="Preview" width={400} height={400} className="max-w-[90vw] max-h-[85vh] object-contain rounded-lg" />
      </div>
    </div>
  )
}

const WA_BUTTON_RE = /\[WA_BUTTON:(https?:\/\/[^\]]+)\]/

function MessageContent({ content, isUser }: { content: string; isUser: boolean }) {
  const match = content.match(WA_BUTTON_RE)
  const text = content.replace(WA_BUTTON_RE, '').trim()
  return (
    <div>
      {text && <p className="text-[13px] leading-relaxed whitespace-pre-line">{text}</p>}
      {match && (
        <a href={match[1]} target="_blank" rel="noopener noreferrer"
          className="mt-2 flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white text-[12px] font-medium px-3 py-2 rounded-xl transition-colors w-fit">
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 shrink-0">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
            <path d="M12 0C5.373 0 0 5.373 0 12c0 2.125.554 4.118 1.524 5.847L0 24l6.302-1.503A11.955 11.955 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.898 0-3.67-.502-5.2-1.38l-.373-.22-3.742.893.943-3.648-.242-.377A9.96 9.96 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/>
          </svg>
          Hubungi Merchant via WhatsApp
        </a>
      )}
    </div>
  )
}

function ChatPanel({ slug, order, tenant }: { slug: string; order: Order; tenant: Tenant }) {
  const [messages, setMessages] = useState<Message[]>([])
  const [orderStatus, setOrderStatus] = useState(order.status)
  const [zoomSrc, setZoomSrc] = useState<string | null>(null)
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [msgsReady, setMsgsReady] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const msgsRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = (onDone?: () => void) => {
    const el = msgsRef.current
    if (!el) { onDone?.(); return }
    requestAnimationFrame(() => requestAnimationFrame(() => {
      el.scrollTop = el.scrollHeight
      onDone?.()
    }))
  }

  useEffect(() => {
    setMsgsReady(false)
    setMessages([])
    setZoomSrc(null)
    setOrderStatus(order.status)
    fetch(`/api/order-chat?orderId=${order.id}`)
      .then(r => r.json())
      .then(d => { setMessages(d.messages ?? []); setOrderStatus(d.status ?? order.status) })
  }, [order.id])

  useEffect(() => {
    if (messages.length === 0) return
    scrollToBottom(() => setMsgsReady(true))
  }, [messages])

  // Poll for status change while waiting for merchant to verify/reject payment
  useEffect(() => {
    if (orderStatus !== 'payment_submitted') return
    const interval = setInterval(async () => {
      const res = await fetch(`/api/order-chat?orderId=${order.id}`)
      const data = await res.json()
      if (data.status && data.status !== 'payment_submitted') {
        setOrderStatus(data.status)
        setMessages(data.messages ?? [])
        clearInterval(interval)
      }
    }, 5000)
    return () => clearInterval(interval)
  }, [orderStatus, order.id])

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
    return supabase.storage.from('product-images').getPublicUrl(path).data.publicUrl
  }

  async function sendMessage(content: string | null, attachmentUrl: string | null) {
    setSending(true)
    const tempMsg: Message = { id: `t-${Date.now()}`, created_at: new Date().toISOString(), role: 'user', content, attachment_url: attachmentUrl }
    setMessages(prev => [...prev, tempMsg])
    try {
      const res = await fetch('/api/order-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: order.id, content, attachmentUrl }),
      })
      const data = await res.json()
      if (data.reply) setMessages(prev => [...prev, { id: `ai-${Date.now()}`, created_at: new Date().toISOString(), role: 'assistant', content: data.reply, attachment_url: null }])
      if (data.statusUpdated) setOrderStatus('payment_submitted')
      if (data.orderCancelled) setOrderStatus('cancelled')
    } catch { /* keep optimistic */ }
    finally { setSending(false) }
  }

  async function handleSend() {
    if (!text.trim() || sending) return
    const t = text.trim(); setText('')
    await sendMessage(t, null)
  }

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return
    setSending(true)
    const url = await uploadFile(file)
    e.target.value = ''
    if (url) await sendMessage('Bukti pembayaran:', url)
    else setSending(false)
  }

  return (
    <div className="flex flex-col h-full">
      {zoomSrc && <ImageZoom src={zoomSrc} onClose={() => setZoomSrc(null)} />}
      {/* Chat header */}
      <div className="px-5 py-3 border-b border-black/10 bg-white shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{ background: 'var(--color-primary)' }}>
            <ShoppingBag size={16} className="text-white" />
          </div>
          <div className="min-w-0">
            <p className="text-[13px] font-medium text-[var(--color-accent)] truncate">
              Pesanan #{order.id.slice(-8).toUpperCase()}
            </p>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${STATUS_COLOR[orderStatus] ?? 'bg-gray-100 text-gray-400'}`}>
              {STATUS_LABEL[orderStatus] ?? orderStatus}
            </span>
          </div>
          <div className="ml-auto text-right shrink-0">
            <p className="text-[12px] font-medium text-[var(--color-accent)]">{fmt(order.total_amount)}</p>
            <p className="text-[10px] text-[var(--color-accent)]/40">
              {order.order_items.length} item
            </p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 relative overflow-hidden">
        {!msgsReady && (
          <div className="absolute inset-0 flex items-center justify-center z-10" style={{ background: 'var(--color-secondary)' }}>
            <div className="w-5 h-5 border-2 border-[var(--color-primary)]/30 border-t-[var(--color-primary)] rounded-full animate-spin" />
          </div>
        )}
        <div ref={msgsRef} style={{ opacity: msgsReady ? 1 : 0, background: 'var(--color-secondary)' }}
          className="h-full overflow-y-auto px-4 py-4 space-y-3">
        {messages.map(msg => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${msg.role === 'user' ? 'bg-[var(--color-primary)] text-white rounded-tr-sm' : 'bg-white border border-black/8 text-[var(--color-accent)] rounded-tl-sm'}`}>
              {msg.role === 'assistant' && msg.attachment_url && (
                <button className="mb-2 bg-white p-2 rounded-lg inline-block cursor-zoom-in hover:opacity-90 transition-opacity"
                  onClick={() => setZoomSrc(msg.attachment_url!)}>
                  <Image src={msg.attachment_url} alt="QRIS" width={180} height={180} className="block" />
                </button>
              )}
              {msg.role === 'user' && msg.attachment_url && (
                <button className="mb-1.5 block cursor-zoom-in hover:opacity-90 transition-opacity"
                  onClick={() => setZoomSrc(msg.attachment_url!)}>
                  <Image src={msg.attachment_url} alt="Bukti bayar" width={200} height={150} className="rounded-lg object-cover max-h-[180px] w-auto" />
                </button>
              )}
              {msg.content && <MessageContent content={msg.content} isUser={msg.role === 'user'} />}
              <p className={`text-[10px] mt-1 ${msg.role === 'user' ? 'text-white/50 text-right' : 'text-[var(--color-accent)]/30'}`}>
                {new Date(msg.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
        ))}
        {sending && (
          <div className="flex justify-start">
            <div className="bg-white border border-black/8 rounded-2xl rounded-tl-sm px-4 py-3">
              <div className="flex gap-1">
                {[0,1,2].map(i => <div key={i} className="w-1.5 h-1.5 bg-[var(--color-accent)]/30 rounded-full animate-bounce" style={{ animationDelay: `${i*0.15}s` }} />)}
              </div>
            </div>
          </div>
        )}
        </div>{/* end msgsRef */}
      </div>{/* end wrapper */}

      {/* Input */}
      {orderStatus === 'pending_payment' && (
        <div className="bg-white border-t border-black/10 px-4 py-3 shrink-0">
          <div className="flex items-end gap-2">
            <button onClick={() => fileRef.current?.click()} disabled={sending}
              className="w-9 h-9 flex items-center justify-center text-[var(--color-accent)]/50 hover:text-[var(--color-primary)] transition-colors shrink-0 disabled:opacity-40">
              <Paperclip size={18} />
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
            <textarea value={text} onChange={e => setText(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
              placeholder="Tulis pesan atau kirim bukti bayar..."
              rows={1} disabled={sending}
              className="flex-1 bg-[var(--color-secondary)] border border-black/15 rounded-2xl px-3 py-2 text-[13px] resize-none focus:outline-none focus:border-[var(--color-primary)] transition-colors" />
            <button onClick={handleSend} disabled={!text.trim() || sending}
              className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 disabled:opacity-40 hover:opacity-90 transition-opacity text-white"
              style={{ background: 'var(--color-primary)' }}>
              <Send size={15} />
            </button>
          </div>
        </div>
      )}

      {orderStatus === 'payment_submitted' && (
        <div className="bg-amber-50 border-t border-amber-200 px-4 py-3 text-center shrink-0">
          <p className="text-[12px] text-amber-700 font-medium">⏳ Bukti pembayaran sedang diverifikasi oleh merchant</p>
          <p className="text-[11px] text-amber-600/70 mt-0.5">Chat akan terbuka kembali jika bukti ditolak</p>
        </div>
      )}

      {orderStatus === 'shipped' && (
        <div className="bg-white border-t border-black/10 px-4 py-3 text-center shrink-0">
          <p className="text-[12px] text-[var(--color-accent)]/50 mb-2">Sudah menerima paket?</p>
          <button disabled={sending} onClick={async () => {
            if (!confirm('Konfirmasi paket sudah diterima?')) return
            setSending(true)
            await fetch('/api/order-chat/confirm-received', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ orderId: order.id }) })
            setOrderStatus('delivered')
            setMessages(prev => [...prev, { id: `ai-${Date.now()}`, created_at: new Date().toISOString(), role: 'assistant', content: '🎉 Terima kasih telah mengkonfirmasi! Senang bisa melayanimu 💕', attachment_url: null }])
            setSending(false)
          }}
            className="text-label-caps text-[10px] tracking-widest px-6 py-2.5 text-white hover:opacity-90 transition-opacity disabled:opacity-60"
            style={{ background: 'var(--color-primary)' }}>
            ✓ PAKET SUDAH DITERIMA
          </button>
        </div>
      )}

      {!['pending_payment', 'payment_submitted', 'shipped'].includes(orderStatus) && msgsReady && (
        <div className="bg-white border-t border-black/10 px-4 py-3 text-center shrink-0">
          <p className="text-[12px] text-[var(--color-accent)]/40">{STATUS_LABEL[orderStatus] ?? 'Pesanan diperbarui'}</p>
        </div>
      )}
    </div>
  )
}

export function OrdersClient({ slug, tenant, orders }: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(orders[0]?.id ?? null)
  const selectedOrder = orders.find(o => o.id === selectedId)

  return (
    <div className="h-[calc(100vh-68px)] flex" style={{ background: 'var(--color-secondary)' }}>
      {/* Left: order list */}
      <div className={`${selectedId ? 'hidden md:flex' : 'flex'} md:w-[320px] w-full flex-col border-r border-black/10 bg-white shrink-0`}>
        <div className="px-5 py-4 border-b border-black/10">
          <h1 className="text-[15px] font-semibold text-[var(--color-accent)]">Pesanan Saya</h1>
        </div>
        {orders.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center px-6">
            <p className="text-[13px] text-[var(--color-accent)]/40">Belum ada pesanan.</p>
            <Link href={`/store/${slug}/shop`}
              className="text-label-caps text-[10px] tracking-widest border border-[var(--color-primary)] text-[var(--color-primary)] px-5 py-2 hover:bg-[var(--color-primary)] hover:text-white transition-colors">
              MULAI BELANJA
            </Link>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto">
            {orders.map(order => (
              <button key={order.id} onClick={() => setSelectedId(order.id)}
                className={`w-full text-left px-5 py-4 border-b border-black/5 transition-colors ${selectedId === order.id ? 'bg-[var(--color-secondary)]' : 'hover:bg-gray-50'}`}>
                <div className="flex items-center justify-between mb-1">
                  <p className="text-[13px] font-medium text-[var(--color-accent)]">#{order.id.slice(-8).toUpperCase()}</p>
                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${STATUS_COLOR[order.status] ?? 'bg-gray-100 text-gray-400'}`}>
                    {STATUS_LABEL[order.status] ?? order.status}
                  </span>
                </div>
                <p className="text-[11px] text-[var(--color-accent)]/40 mb-1">
                  {new Date(order.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                </p>
                <p className="text-[12px] text-[var(--color-accent)]/60 truncate">
                  {order.order_items.map(i => i.product_name).join(', ')}
                </p>
                <p className="text-[12px] font-medium text-[var(--color-accent)] mt-0.5">{fmt(order.total_amount)}</p>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Right: chat panel */}
      <div className={`${selectedId ? 'flex' : 'hidden md:flex'} flex-1 flex-col min-w-0`}>
        {selectedOrder ? (
          <>
            {/* Back button on mobile */}
            <button onClick={() => setSelectedId(null)}
              className="md:hidden flex items-center gap-2 px-4 py-2.5 bg-white border-b border-black/10 text-[12px] text-[var(--color-accent)]/60">
              ← Kembali
            </button>
            <div className="flex-1 min-h-0 flex flex-col">
              <ChatPanel slug={slug} order={selectedOrder} tenant={tenant} />
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-[13px] text-[var(--color-accent)]/30">Pilih pesanan untuk melihat chat</p>
          </div>
        )}
      </div>
    </div>
  )
}
