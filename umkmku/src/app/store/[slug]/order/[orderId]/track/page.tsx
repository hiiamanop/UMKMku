import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { MessageSquare } from 'lucide-react'
import { StoreFooter } from '@/components/store/store-footer'

interface Props {
  params: Promise<{ slug: string; orderId: string }>
}

const STEPS = [
  { key: 'order',   label: 'Pesanan', icon: '🛍️' },
  { key: 'payment', label: 'Pembayaran', icon: '💳' },
  { key: 'shipped', label: 'Pengiriman', icon: '🚚' },
  { key: 'arrived', label: 'Diterima', icon: '🏠' },
]

function getStepIndex(status: string): number {
  if (['pending_payment', 'payment_submitted'].includes(status)) return 0
  if (status === 'payment_verified') return 1
  if (status === 'shipped') return 2
  if (status === 'delivered') return 3
  return 0
}

const STATUS_LABEL: Record<string, string> = {
  pending_payment:   'Menunggu Pembayaran',
  payment_submitted: 'Bukti Dikirim, Menunggu Verifikasi',
  payment_verified:  'Pembayaran Terverifikasi',
  shipped:           'Pesanan Dikirim',
  delivered:         'Pesanan Diterima',
  cancelled:         'Pesanan Dibatalkan',
}

function fmt(n: number) { return 'Rp ' + n.toLocaleString('id-ID') }
function fmtDate(s: string) {
  return new Date(s).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
}

export default async function TrackOrderPage({ params }: Props) {
  const { slug, orderId } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/store/${slug}/login?next=/store/${slug}/order/${orderId}/track`)

  const service = createServiceClient()

  const { data: order } = await service
    .from('orders')
    .select('*, order_items(*)')
    .eq('id', orderId)
    .eq('user_id', user.id)
    .single()

  if (!order) notFound()

  const [{ data: tenant }, { data: chats }] = await Promise.all([
    service.from('tenants').select('*').eq('slug', slug).single(),
    service.from('order_chats').select('content, created_at, role, sender_type')
      .eq('order_id', orderId).order('created_at', { ascending: true }),
  ])

  // Derive timeline events from chat messages
  const events: { label: string; time: string; icon: string }[] = []
  events.push({ label: 'Pesanan dibuat', time: order.created_at, icon: '🛍️' })
  for (const msg of chats ?? []) {
    const c = msg.content ?? ''
    if (c.includes('Pembayaranmu telah diverifikasi'))
      events.push({ label: 'Pembayaran diverifikasi', time: msg.created_at, icon: '✅' })
    else if (c.includes('belum dapat diverifikasi'))
      events.push({ label: 'Bukti pembayaran ditolak', time: msg.created_at, icon: '⚠️' })
    else if (c.includes('sedang dalam perjalanan') || c.includes('Dikirim via'))
      events.push({ label: 'Pesanan dikirim', time: msg.created_at, icon: '🚚' })
    else if (c.includes('Pesanan Diterima') || c.includes('pesanan diterima') || c.includes('sudah diterima'))
      events.push({ label: 'Pesanan diterima', time: msg.created_at, icon: '🏠' })
    else if (c.includes('telah dibatalkan'))
      events.push({ label: 'Pesanan dibatalkan', time: msg.created_at, icon: '❌' })
  }

  const activeStep = getStepIndex(order.status)
  const isCancelled = order.status === 'cancelled'
  const progressPct = isCancelled ? 0 : [0, 33, 66, 100][activeStep]

  return (
    <>
    <main className="min-h-screen pb-24" style={{ background: 'var(--color-secondary)' }}>

      {/* Breadcrumb + Title */}
      <section className="px-6 md:px-16 max-w-[1280px] mx-auto pt-12 md:pt-16">
        <nav className="flex items-center gap-2 text-[11px] font-medium tracking-widest uppercase text-[var(--color-accent)]/40 mb-6">
          <Link href={`/store/${slug}`} className="hover:text-[var(--color-primary)] transition-colors">Beranda</Link>
          <span>›</span>
          <Link href={`/store/${slug}/profile`} className="hover:text-[var(--color-primary)] transition-colors">Pesanan Saya</Link>
          <span>›</span>
          <span className="text-[var(--color-primary)]">#{orderId.slice(-8).toUpperCase()}</span>
        </nav>

        <h1 className="text-display italic text-[var(--color-accent)] mb-3">Lacak Pesanan</h1>
        <p className="text-body-md text-[var(--color-accent)]/60 max-w-xl">
          {isCancelled
            ? 'Pesanan ini telah dibatalkan.'
            : 'Pesananmu sedang dalam perjalanan. Pantau status terkini di sini.'}
        </p>
      </section>

      {/* Status Card, Stepper */}
      <section className="px-6 md:px-16 max-w-[1280px] mx-auto mt-10">
        <div className="bg-white border border-black/8 p-8 md:p-12 relative overflow-hidden">
          {/* Est delivery / status badge top-right */}
          <div className="absolute top-8 right-8 text-right">
            <p className="text-label-caps text-[10px] text-[var(--color-primary)] mb-1">STATUS</p>
            <p className={`text-[12px] font-semibold ${isCancelled ? 'text-red-500' : 'text-[var(--color-accent)]'}`}>
              {STATUS_LABEL[order.status] ?? order.status}
            </p>
          </div>

          {isCancelled ? (
            <div className="mt-4 flex items-center gap-4 py-8">
              <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center text-2xl">❌</div>
              <div>
                <p className="text-headline-md italic text-red-500">Pesanan Dibatalkan</p>
                <p className="text-body-md text-[var(--color-accent)]/50 mt-1">
                  Hubungi merchant jika kamu punya pertanyaan.
                </p>
              </div>
            </div>
          ) : (
            <div className="mt-12">
              {/* Stepper */}
              <div className="flex items-start justify-between mb-10 relative z-10">
                {STEPS.map((step, i) => {
                  const done = i < activeStep
                  const active = i === activeStep
                  return (
                    <div key={step.key} className={`flex flex-col items-center gap-3 transition-opacity ${i > activeStep ? 'opacity-35' : ''}`}>
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl shadow-sm transition-all ${
                        done   ? 'bg-[var(--color-primary)] text-white scale-105' :
                        active ? 'bg-[var(--color-primary)]/15 border-4 border-[var(--color-primary)]' :
                                 'bg-[var(--color-secondary)] border border-black/10'
                      }`}>
                        {done ? '✓' : step.icon}
                      </div>
                      <span className={`text-label-caps text-[10px] tracking-widest uppercase text-center ${
                        done || active ? 'text-[var(--color-accent)]' : 'text-[var(--color-accent)]/40'
                      }`}>{step.label}</span>
                    </div>
                  )
                })}
              </div>

              {/* Progress line */}
              <div className="absolute left-[calc(6rem+32px)] right-[calc(6rem+32px)] md:left-[calc(8rem+48px)] md:right-[calc(8rem+48px)] h-[2px] bg-black/8" style={{ top: 'calc(12rem + 6px)' }}>
                <div
                  className="h-full bg-[var(--color-primary)] transition-all duration-1000 ease-out"
                  style={{ width: `${progressPct}%` }}
                />
              </div>

              {/* Latest update */}
              <div className="mt-8 pt-8 border-t border-black/5 flex flex-col md:flex-row items-start md:items-end justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="bg-[var(--color-primary)]/10 p-3 rounded-full">
                    <span className="text-xl">📍</span>
                  </div>
                  <div>
                    <p className="text-label-caps text-[10px] text-[var(--color-accent)]/40 mb-1">UPDATE TERKINI</p>
                    {order.status === 'shipped' && order.courier_name ? (
                      <>
                        <p className="text-body-md text-[var(--color-accent)]">
                          Dikirim via <strong>{order.courier_name}</strong>
                        </p>
                        {order.tracking_number && (
                          <p className="text-[11px] font-mono text-[var(--color-primary)] mt-0.5">
                            Resi: {order.tracking_number}
                          </p>
                        )}
                      </>
                    ) : (
                      <p className="text-body-md text-[var(--color-accent)]">
                        {STATUS_LABEL[order.status] ?? order.status}
                      </p>
                    )}
                    <p className="text-[10px] text-[var(--color-accent)]/30 mt-1">{fmtDate(order.created_at)}</p>
                  </div>
                </div>

                <Link href={`/store/${slug}/orders`}
                  className="flex items-center gap-2 bg-[var(--color-primary)] text-white px-6 py-3 text-label-caps text-[10px] tracking-widest hover:opacity-90 transition-opacity">
                  <MessageSquare size={14} />
                  CHAT PESANAN
                </Link>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Bento: Order Details + Summary */}
      <section className="px-6 md:px-16 max-w-[1280px] mx-auto mt-6 grid grid-cols-1 md:grid-cols-12 gap-6">

        {/* Order items, 8 cols */}
        <div className="md:col-span-8 bg-white border border-black/8 p-8">
          <h3 className="text-headline-md italic text-[var(--color-accent)] mb-8">Detail Pesanan</h3>

          <div className="space-y-6">
            {(order.order_items ?? []).map((item: any) => (
              <div key={item.id} className="flex items-center gap-5">
                <div className="w-20 h-24 bg-[var(--color-secondary)] shrink-0 overflow-hidden">
                  {item.image_url ? (
                    <Image src={item.image_url} alt={item.product_name} width={80} height={96}
                      className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-2xl opacity-30">🧴</div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-body-md font-medium text-[var(--color-accent)]">{item.product_name}</p>
                      <p className="text-[12px] text-[var(--color-accent)]/50 mt-0.5">Qty {item.quantity}</p>
                    </div>
                    {item.product_price && (
                      <p className="text-body-md font-medium text-[var(--color-accent)] shrink-0">{fmt(item.product_price * item.quantity)}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Shipping + notes */}
          <div className="mt-10 pt-8 border-t border-black/5 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-label-caps text-[10px] text-[var(--color-accent)]/40 mb-2">ALAMAT PENGIRIMAN</p>
              <address className="not-italic text-body-md text-[var(--color-accent)] leading-relaxed">
                {order.customer_name}<br />
                {order.customer_whatsapp && <span className="text-[var(--color-accent)]/60">{order.customer_whatsapp}<br /></span>}
                {order.shipping_address}
              </address>
            </div>
            {order.courier_name && (
              <div>
                <p className="text-label-caps text-[10px] text-[var(--color-accent)]/40 mb-2">KURIR</p>
                <p className="text-body-md text-[var(--color-accent)]">{order.courier_name}</p>
                {order.tracking_number && (
                  <p className="font-mono text-[12px] text-[var(--color-primary)] mt-1">{order.tracking_number}</p>
                )}
              </div>
            )}
            {order.notes && (
              <div className="md:col-span-2">
                <p className="text-label-caps text-[10px] text-[var(--color-accent)]/40 mb-2">CATATAN</p>
                <p className="text-body-md text-[var(--color-accent)]/70">{order.notes}</p>
              </div>
            )}
          </div>
        </div>

        {/* Summary, 4 cols */}
        <div className="md:col-span-4 space-y-6">
          {/* Totals */}
          <div className="bg-white border border-black/8 p-8">
            <p className="text-label-caps text-[10px] text-[var(--color-accent)]/40 mb-6">RINGKASAN</p>
            <div className="space-y-3">
              <div className="flex justify-between text-body-md">
                <span className="text-[var(--color-accent)]/60">Subtotal</span>
                <span className="text-[var(--color-accent)]">{fmt(order.total_amount)}</span>
              </div>
              <div className="flex justify-between text-body-md">
                <span className="text-[var(--color-accent)]/60">Pengiriman</span>
                <span className="text-[var(--color-accent)]">—</span>
              </div>
              <div className="pt-4 border-t border-black/8 flex justify-between">
                <span className="text-headline-md italic text-[var(--color-accent)]">Total</span>
                <span className="text-headline-md italic text-[var(--color-primary)]">{fmt(order.total_amount)}</span>
              </div>
            </div>
          </div>

          {/* Need help */}
          <div className="bg-[var(--color-primary)]/5 border border-[var(--color-primary)]/20 p-8">
            <h3 className="text-headline-md italic text-[var(--color-accent)] mb-2">Butuh bantuan?</h3>
            <p className="text-body-md text-[var(--color-accent)]/60 mb-6 leading-relaxed">
              Tim kami siap membantu untuk pertanyaan seputar pengiriman atau pesananmu.
            </p>
            {tenant?.whatsapp_number ? (
              <a href={`https://wa.me/${tenant.whatsapp_number.replace(/\D/g, '')}?text=${encodeURIComponent(`Halo ${tenant?.brand_name}, saya ingin bertanya tentang pesanan #${orderId.slice(-8).toUpperCase()}`)}`}
                target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 text-[var(--color-primary)] text-label-caps text-[10px] tracking-widest hover:underline">
                HUBUNGI MERCHANT
                <span>→</span>
              </a>
            ) : (
              <Link href={`/store/${slug}/orders`}
                className="flex items-center gap-2 text-[var(--color-primary)] text-label-caps text-[10px] tracking-widest hover:underline">
                LIHAT CHAT
                <span>→</span>
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Timeline */}
      {events.length > 1 && (
        <section className="px-6 md:px-16 max-w-[1280px] mx-auto mt-6">
          <div className="bg-white border border-black/8 p-8">
            <p className="text-label-caps text-[10px] text-[var(--color-accent)]/40 mb-6">RIWAYAT PESANAN</p>
            <ol className="relative border-l border-black/10 space-y-6 ml-3">
              {events.map((ev, i) => (
                <li key={i} className="pl-6 relative">
                  <span className="absolute -left-[11px] top-0.5 flex items-center justify-center w-5 h-5 rounded-full bg-white border border-black/15 text-[11px]">
                    {ev.icon}
                  </span>
                  <p className="text-body-md text-[var(--color-accent)]">{ev.label}</p>
                  <p className="text-[11px] text-[var(--color-accent)]/40 mt-0.5">
                    {new Date(ev.time).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                    {' · '}
                    {new Date(ev.time).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </li>
              ))}
            </ol>
          </div>
        </section>
      )}
    </main>
    <StoreFooter tenant={tenant} />
    </>
  )
}
