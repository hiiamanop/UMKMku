'use client'

import { useState, useTransition } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ShoppingBag, MapPin, User, Phone, AlertCircle } from 'lucide-react'
import { useCart } from '@/lib/cart-context'
import { createOrder } from './actions'
import type { Tenant } from '@/lib/supabase/types'

interface Props {
  slug: string
  tenant: Tenant
  initialName: string
  initialWhatsapp: string
  initialAddress: string
}

function fmt(n: number) { return 'Rp ' + n.toLocaleString('id-ID') }

export function CheckoutClient({ slug, tenant, initialName, initialWhatsapp, initialAddress }: Props) {
  const { items, totalPrice, clearCart } = useCart()
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [name, setName] = useState(initialName)
  const [whatsapp, setWhatsapp] = useState(initialWhatsapp)
  const [address, setAddress] = useState(initialAddress)
  const [notes, setNotes] = useState('')
  const [error, setError] = useState<string | null>(null)

  const inputCls = 'w-full bg-[var(--color-secondary)] border border-black/15 px-4 py-3 text-body-md focus:outline-none focus:border-[var(--color-primary)] transition-colors'
  const labelCls = 'text-label-caps text-[10px] text-[var(--color-accent)]/40 block mb-2'

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (items.length === 0) { setError('Keranjang kosong'); return }
    if (!name.trim() || !whatsapp.trim() || !address.trim()) {
      setError('Lengkapi nama, WhatsApp, dan alamat pengiriman')
      return
    }
    setError(null)
    startTransition(async () => {
      const result = await createOrder(slug, items, name.trim(), whatsapp.trim(), address.trim())
      if (!result) return
      if (result.error) { setError(result.error); return }
      if (result.orderId) {
        router.push(`/store/${slug}/order/${result.orderId}/processing`)
        // clearCart() moved to processing page — calling it here races against router.push
      }
    })
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-[var(--color-secondary)] flex items-center justify-center">
        <div className="text-center">
          <ShoppingBag size={48} className="mx-auto text-[var(--color-accent)]/20 mb-6" />
          <p className="text-headline-md italic text-[var(--color-accent)]/40 mb-6">Keranjang kosong.</p>
          <Link href={`/store/${slug}/shop`}
            className="inline-block bg-[var(--color-primary)] text-white text-label-caps tracking-widest px-8 py-3">
            Mulai Belanja →
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[var(--color-secondary)]">
      <div className="max-w-[1280px] mx-auto px-6 md:px-16 py-12">

        {/* Breadcrumb */}
        <p className="text-label-caps text-[10px] text-[var(--color-accent)]/40 mb-6">
          <Link href={`/store/${slug}/cart`} className="hover:text-[var(--color-primary)] transition-colors">KERANJANG</Link>
          {' / '}
          <span>CHECKOUT</span>
        </p>

        <h1 className="text-display italic mb-12">Konfirmasi Pesanan</h1>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">

            {/* Left: form */}
            <div className="lg:col-span-2 space-y-6">

              {/* Shipping info */}
              <div className="bg-white border border-black/8 rounded p-8">
                <div className="flex items-center gap-3 mb-6">
                  <MapPin size={16} className="text-[var(--color-primary)]" />
                  <h2 className="text-headline-md italic">Informasi Pengiriman</h2>
                </div>
                <div className="space-y-5 max-w-lg">
                  <div>
                    <label className={labelCls}>NAMA PENERIMA *</label>
                    <div className="relative">
                      <input value={name} onChange={e => setName(e.target.value)} required
                        placeholder="Nama Lengkap" className={inputCls} />
                      <User size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--color-accent)]/30" />
                    </div>
                  </div>
                  <div>
                    <label className={labelCls}>NOMOR WHATSAPP *</label>
                    <div className="relative">
                      <input value={whatsapp} onChange={e => setWhatsapp(e.target.value)} required
                        placeholder="+62 812 3456 7890" type="tel" className={inputCls} />
                      <Phone size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--color-accent)]/30" />
                    </div>
                    <p className="text-[11px] text-[var(--color-accent)]/40 font-sans mt-1">
                      Update pesanan akan dikirim ke nomor ini.
                    </p>
                  </div>
                  <div>
                    <label className={labelCls}>ALAMAT PENGIRIMAN *</label>
                    <textarea value={address} onChange={e => setAddress(e.target.value)} required rows={3}
                      placeholder="Jl. Melati No. 12, Kel. Menteng, Kec. Menteng, Jakarta Pusat 10310"
                      className={`${inputCls} resize-none`} />
                  </div>
                  <div>
                    <label className={labelCls}>CATATAN (opsional)</label>
                    <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2}
                      placeholder="Instruksi khusus untuk merchant..."
                      className={`${inputCls} resize-none`} />
                  </div>
                </div>
              </div>

              {/* Items review */}
              <div className="bg-white border border-black/8 rounded p-8">
                <h2 className="text-headline-md italic mb-6">Item Pesanan</h2>
                <div className="divide-y divide-black/5">
                  {items.map(item => (
                    <div key={item.productId} className="flex gap-5 py-5 first:pt-0 last:pb-0">
                      <div className="w-20 h-20 bg-[var(--color-secondary)] shrink-0 relative overflow-hidden">
                        {item.imageUrl
                          ? <Image src={item.imageUrl} alt={item.name} fill sizes="80px" className="object-cover" />
                          : <div className="w-full h-full flex items-center justify-center text-[var(--color-accent)]/20 text-2xl">🧴</div>
                        }
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-body-md font-medium leading-tight">{item.name}</p>
                        <p className="text-label-caps text-[10px] text-[var(--color-accent)]/40 mt-1">QTY: {item.quantity}</p>
                      </div>
                      <p className="text-body-md font-medium shrink-0">{fmt(item.price * item.quantity)}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right: summary */}
            <div className="space-y-4">
              <div className="bg-white border border-black/8 rounded p-6 sticky top-24">
                <p className={labelCls}>RINGKASAN PESANAN</p>

                <div className="space-y-3 mt-4">
                  <div className="flex justify-between text-body-md">
                    <span className="text-[var(--color-accent)]/60">{items.reduce((s, i) => s + i.quantity, 0)} item</span>
                    <span>{fmt(totalPrice)}</span>
                  </div>
                  <div className="flex justify-between text-body-md">
                    <span className="text-[var(--color-accent)]/60">Pengiriman</span>
                    <span className="text-[var(--color-accent)]/40 text-sm">Sesuai kurir</span>
                  </div>
                </div>

                <div className="border-t border-black/8 pt-4 mt-4 flex justify-between items-baseline">
                  <span className="text-headline-md italic">Total</span>
                  <span className="text-headline-lg" style={{ color: 'var(--color-primary)' }}>{fmt(totalPrice)}</span>
                </div>

                {error && (
                  <div className="flex items-start gap-2 mt-4 p-3 bg-red-50 border border-red-200 rounded text-red-600">
                    <AlertCircle size={14} className="shrink-0 mt-0.5" />
                    <p className="text-[12px] font-sans">{error}</p>
                  </div>
                )}

                <button type="submit" disabled={isPending}
                  className="w-full mt-5 py-4 bg-[var(--color-primary)] text-white text-label-caps tracking-widest hover:opacity-90 transition-opacity disabled:opacity-60">
                  {isPending ? 'MEMBUAT PESANAN...' : 'BUAT PESANAN →'}
                </button>

                <p className="text-[11px] text-[var(--color-accent)]/40 font-sans text-center mt-3 leading-relaxed">
                  Setelah pesanan dibuat, kamu akan diarahkan ke halaman chat untuk proses pembayaran via QRIS.
                </p>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
