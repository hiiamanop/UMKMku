'use client'

import { useState, useTransition, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useSearchParams } from 'next/navigation'
import { Package, Check, Truck, X, ChevronDown, ChevronUp, MessageSquare, History, ZoomIn } from 'lucide-react'
import { updateOrderStatus, submitShipping } from './actions'

const STATUS_LABEL: Record<string, string> = {
  pending_payment: 'Menunggu Bayar',
  payment_submitted: 'Bukti Dikirim',
  payment_verified: 'Pembayaran OK',
  shipped: 'Dikirim',
  delivered: 'Terkirim',
  cancelled: 'Dibatalkan',
}
const STATUS_COLOR: Record<string, string> = {
  pending_payment: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  payment_submitted: 'bg-blue-50 text-blue-700 border-blue-200',
  payment_verified: 'bg-green-50 text-green-700 border-green-200',
  shipped: 'bg-purple-50 text-purple-700 border-purple-200',
  delivered: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  cancelled: 'bg-red-50 text-red-500 border-red-200',
}

function fmt(n: number) { return 'Rp ' + n.toLocaleString('id-ID') }

function PaymentHistory({ orderId, slug }: { orderId: string; slug: string }) {
  const [open, setOpen] = useState(false)
  const [records, setRecords] = useState<{ proof: any; audit: any }[]>([])
  const [loading, setLoading] = useState(false)
  const [zoomSrc, setZoomSrc] = useState<string | null>(null)

  async function openModal() {
    setOpen(true)
    if (records.length > 0) return
    setLoading(true)
    const res = await fetch(`/api/merchant-chat?orderId=${orderId}&slug=${slug}`)
    const data = await res.json()
    const msgs: any[] = data.messages ?? []
    const pairs: { proof: any; audit: any }[] = []
    for (let i = 0; i < msgs.length; i++) {
      const m = msgs[i]
      if (m.role === 'user' && m.attachment_url) {
        const audit = msgs.slice(i + 1, i + 4).find(
          (n: any) => n.role === 'assistant' && n.sender_type === 'ai' && n.content?.includes('📋')
        ) ?? null
        pairs.push({ proof: m, audit })
      }
    }
    setRecords(pairs)
    setLoading(false)
  }

  return (
    <>
      <button onClick={openModal}
        className="flex items-center gap-1.5 text-label-caps text-[10px] border border-black/15 px-3 py-2 hover:bg-[var(--color-secondary)] transition-colors">
        <History size={11} />RIWAYAT BUKTI
      </button>

      {open && (
        <div className="fixed inset-0 z-[100] bg-black/60 flex items-center justify-center p-4" onClick={() => setOpen(false)}>
          <div className="bg-white rounded-lg w-full max-w-lg max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-black/8 shrink-0">
              <p className="text-label-caps text-[11px] tracking-widest">RIWAYAT BUKTI BAYAR</p>
              <button onClick={() => setOpen(false)} className="text-[var(--color-accent)]/40 hover:text-[var(--color-accent)] transition-colors">
                <X size={18} />
              </button>
            </div>

            {/* Body */}
            <div className="overflow-y-auto px-6 py-5 space-y-5">
              {loading && <p className="text-[12px] text-[var(--color-accent)]/40 text-center py-8">Memuat...</p>}
              {!loading && records.length === 0 && (
                <p className="text-[12px] text-[var(--color-accent)]/40 italic text-center py-8">Belum ada bukti yang dikirim.</p>
              )}
              {records.map((r, i) => (
                <div key={i} className="flex gap-4 items-start pb-5 border-b border-black/5 last:border-0 last:pb-0">
                  <span className="text-[10px] text-[var(--color-accent)]/30 font-mono pt-1 shrink-0 w-4">#{i + 1}</span>
                  <button onClick={() => setZoomSrc(r.proof.attachment_url)} className="relative shrink-0 cursor-zoom-in group">
                    <Image src={r.proof.attachment_url} alt={`Bukti ${i + 1}`} width={88} height={88}
                      className="rounded object-cover w-[88px] h-[88px] border border-black/10" />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/25 transition-colors rounded flex items-center justify-center">
                      <ZoomIn size={18} className="text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] text-[var(--color-accent)]/40 font-sans mb-2">
                      {new Date(r.proof.created_at).toLocaleString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </p>
                    {r.audit ? (
                      <p className="text-[12px] leading-relaxed text-[var(--color-accent)]/70 whitespace-pre-line">{r.audit.content}</p>
                    ) : (
                      <p className="text-[11px] text-[var(--color-accent)]/30 italic">Penilaian AI tidak tersedia</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Zoom overlay */}
          {zoomSrc && (
            <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-10" onClick={() => setZoomSrc(null)}>
              <Image src={zoomSrc} alt="Bukti bayar" width={600} height={600} className="max-w-[90vw] max-h-[85vh] object-contain rounded-lg" />
            </div>
          )}
        </div>
      )}
    </>
  )
}

interface Props { slug: string; orders: any[] }

export function OrdersClient({ slug, orders }: Props) {
    const searchParams = useSearchParams()
  const [expanded, setExpanded] = useState<string | null>(() => searchParams.get('order'))

  useEffect(() => {
    const id = searchParams.get('order')
    if (id) setExpanded(id)
  }, [searchParams])
  const [shippingForm, setShippingForm] = useState<string | null>(null)
  const [localOrders, setLocalOrders] = useState(orders)
  useEffect(() => { setLocalOrders(orders) }, [orders])
  const [isPending, startTransition] = useTransition()

  function toggleExpand(id: string) {
    setExpanded(v => v === id ? null : id)
  }

  function verifyPayment(orderId: string) {
    startTransition(async () => {
      await updateOrderStatus(slug, orderId, 'payment_verified')
      setLocalOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'payment_verified' } : o))
    })
  }

  function rejectPayment(orderId: string) {
    startTransition(async () => {
      await updateOrderStatus(slug, orderId, 'pending_payment')
      setLocalOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'pending_payment' } : o))
    })
  }

  const labelCls = 'text-label-caps text-[10px] text-[var(--color-accent)]/40 block mb-2'
  const inputCls = 'w-full bg-[var(--color-secondary)] border border-black/15 px-4 py-2.5 text-body-md text-sm focus:outline-none focus:border-[var(--color-primary)] transition-colors'

  if (localOrders.length === 0) {
    return (
      <div>
        <h1 className="text-display italic mb-10">Pesanan</h1>
        <div className="bg-white border border-black/8 rounded p-16 text-center">
          <Package size={40} className="mx-auto text-[var(--color-accent)]/20 mb-4" />
          <p className="text-headline-md italic text-[var(--color-accent)]/40">Belum ada pesanan masuk.</p>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-baseline justify-between mb-10">
        <h1 className="text-display italic">Pesanan</h1>
        <p className="text-label-caps text-[10px] text-[var(--color-accent)]/40">{localOrders.length} TOTAL</p>
      </div>

      <div className="space-y-3">
        {localOrders.map(order => {
          const isOpen = expanded === order.id
          const showShipping = shippingForm === order.id
          const statusCls = STATUS_COLOR[order.status] ?? 'bg-black/5 text-black/50 border-black/10'

          return (
            <div key={order.id} className="bg-white border border-black/8 rounded overflow-hidden">
              {/* Row header */}
              <div
                className="flex items-center gap-4 px-6 py-4 cursor-pointer hover:bg-black/[0.01] transition-colors"
                onClick={() => toggleExpand(order.id)}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="font-mono text-xs text-[var(--color-primary)]">#{order.id.slice(-8).toUpperCase()}</span>
                    <span className={`text-label-caps text-[9px] border px-2 py-0.5 ${statusCls}`}>
                      {STATUS_LABEL[order.status] ?? order.status}
                    </span>
                  </div>
                  <p className="text-[12px] text-[var(--color-accent)]/50 mt-0.5 font-sans">
                    {order.customer_name ?? 'Pelanggan'} · {new Date(order.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                </div>
                <p className="text-body-md font-medium shrink-0">{fmt(order.total_amount)}</p>
                {isOpen ? <ChevronUp size={16} className="text-[var(--color-accent)]/30 shrink-0" /> : <ChevronDown size={16} className="text-[var(--color-accent)]/30 shrink-0" />}
              </div>

              {/* Expanded detail */}
              {isOpen && (
                <div className="border-t border-black/5 px-6 pb-6 pt-4 space-y-5">
                  {/* Items */}
                  <div>
                    <p className={labelCls}>ITEM PESANAN</p>
                    <div className="space-y-2">
                      {(order.order_items ?? []).map((item: any) => (
                        <div key={item.id} className="flex items-center gap-3">
                          {item.image_url && (
                            <div className="w-10 h-10 relative shrink-0 bg-[var(--color-secondary)]">
                              <Image src={item.image_url} alt={item.product_name} fill sizes="40px" className="object-cover" />
                            </div>
                          )}
                          <p className="text-body-md flex-1">{item.product_name}</p>
                          <p className="text-body-md text-[var(--color-accent)]/60 shrink-0">
                            {item.quantity}x {item.product_price ? fmt(item.product_price) : ''}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Shipping info */}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className={labelCls}>PENERIMA</p>
                      <p className="text-body-md">{order.customer_name ?? '-'}</p>
                      <p className="text-[var(--color-accent)]/60">{order.customer_whatsapp ?? ''}</p>
                    </div>
                    <div>
                      <p className={labelCls}>ALAMAT</p>
                      <p className="text-body-md leading-relaxed">{order.shipping_address ?? '-'}</p>
                    </div>
                    {order.courier_name && (
                      <div>
                        <p className={labelCls}>KURIR / RESI</p>
                        <p className="text-body-md">{order.courier_name}</p>
                        <p className="font-mono text-xs text-[var(--color-primary)]">{order.tracking_number}</p>
                      </div>
                    )}
                  </div>

                  {/* Shipping proof photo */}
                  {order.shipping_photo_url && (
                    <div>
                      <p className={labelCls}>FOTO PAKET</p>
                      <Image src={order.shipping_photo_url} alt="Paket" width={200} height={150} className="object-cover rounded border border-black/8" />
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex flex-wrap gap-3 pt-2">

                    {/* Chat link */}
                    <Link href={`/${slug}/chats?order=${order.id}`}
                      className="flex items-center gap-2 text-label-caps text-[10px] border border-black/15 px-4 py-2 hover:bg-[var(--color-secondary)] transition-colors">
                      <MessageSquare size={12} />LIHAT CHAT
                    </Link>

                    {/* Payment proof history */}
                    <PaymentHistory orderId={order.id} slug={slug} />

                    {/* Verify payment */}
                    {order.status === 'payment_submitted' && (
                      <>
                        {/* AI Confidence badge */}
                        {order.payment_confidence != null && (
                          <div className={`px-3 py-2 rounded border ${
                            order.payment_confidence >= 75 ? 'bg-green-50 border-green-200 text-green-700'
                            : order.payment_confidence >= 50 ? 'bg-yellow-50 border-yellow-200 text-yellow-700'
                            : 'bg-red-50 border-red-200 text-red-600'
                          }`}>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-[15px]">
                                {order.payment_confidence >= 75 ? '✅' : order.payment_confidence >= 50 ? '⚠️' : '❌'}
                              </span>
                              <div>
                                <p className="text-label-caps text-[9px] opacity-60">AI VALIDATOR</p>
                                <p className="text-[12px] font-bold">
                                  {order.payment_confidence >= 75 ? 'Terlihat Valid' : order.payment_confidence >= 50 ? 'Perlu Dicek' : 'Ditolak AI'}
                                  {' '}· {order.payment_confidence}%
                                </p>
                              </div>
                            </div>
                            {order.payment_ai_note && (
                              <p className="text-[11px] opacity-80 leading-snug">{order.payment_ai_note}</p>
                            )}
                            {order.payment_confidence < 75 && (
                              <p className="text-[10px] opacity-60 mt-1 italic">Verifikasi manual tetap bisa dilakukan</p>
                            )}
                          </div>
                        )}
                        <button onClick={() => verifyPayment(order.id)} disabled={isPending}
                          className="flex items-center gap-2 text-label-caps text-[10px] bg-green-600 text-white px-4 py-2 hover:opacity-90 transition-opacity disabled:opacity-60">
                          <Check size={12} />VERIFIKASI BAYAR
                        </button>
                        <button onClick={() => rejectPayment(order.id)} disabled={isPending}
                          className="flex items-center gap-2 text-label-caps text-[10px] border border-red-300 text-red-500 px-4 py-2 hover:bg-red-50 transition-colors disabled:opacity-60">
                          <X size={12} />TOLAK
                        </button>
                      </>
                    )}

                    {/* Start shipping */}
                    {order.status === 'payment_verified' && !showShipping && (
                      <button onClick={() => setShippingForm(order.id)}
                        className="flex items-center gap-2 text-label-caps text-[10px] bg-[var(--color-primary)] text-white px-4 py-2 hover:opacity-90 transition-opacity">
                        <Truck size={12} />START SHIPPING
                      </button>
                    )}

                    {/* Cancel */}
                    {['pending_payment', 'payment_submitted'].includes(order.status) && (
                      <button onClick={() => {
                        if (!confirm('Batalkan pesanan ini?')) return
                        startTransition(async () => {
                          await updateOrderStatus(slug, order.id, 'cancelled')
                          setLocalOrders(prev => prev.map(o => o.id === order.id ? { ...o, status: 'cancelled' } : o))
                        })
                      }} disabled={isPending}
                        className="text-label-caps text-[10px] text-[var(--color-accent)]/40 hover:text-red-500 transition-colors px-2 py-2 disabled:opacity-60">
                        Batalkan
                      </button>
                    )}
                  </div>

                  {/* Shipping form */}
                  {showShipping && (
                    <form
                      onSubmit={async e => {
                        e.preventDefault()
                        const fd = new FormData(e.currentTarget)
                        startTransition(async () => {
                          await submitShipping(slug, order.id, fd)
                          setLocalOrders(prev => prev.map(o => o.id === order.id ? { ...o, status: 'shipped', courier_name: fd.get('courier_name'), tracking_number: fd.get('tracking_number') } : o))
                          setShippingForm(null)
                          setExpanded(order.id)
                        })
                      }}
                      className="border border-black/8 rounded p-5 space-y-4 bg-[var(--color-secondary)]"
                    >
                      <p className="text-headline-md italic">Form Pengiriman</p>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className={labelCls}>KURIR *</label>
                          <input name="courier_name" required placeholder="JNE / J&T / SiCepat" className={inputCls} />
                        </div>
                        <div>
                          <label className={labelCls}>NO. RESI *</label>
                          <input name="tracking_number" required placeholder="JNE123456789" className={inputCls} />
                        </div>
                      </div>
                      <div>
                        <label className={labelCls}>URL FOTO PAKET (opsional)</label>
                        <input name="shipping_photo_url" type="url" placeholder="https://..." className={inputCls} />
                      </div>
                      <div className="flex gap-3">
                        <button type="submit" disabled={isPending}
                          className="text-label-caps text-[10px] bg-[var(--color-primary)] text-white px-6 py-2.5 hover:opacity-90 transition-opacity disabled:opacity-60">
                          {isPending ? 'MENYIMPAN...' : 'SUBMIT PENGIRIMAN'}
                        </button>
                        <button type="button" onClick={() => setShippingForm(null)}
                          className="text-label-caps text-[10px] border border-black/15 px-4 py-2.5 hover:bg-white transition-colors">
                          BATAL
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
