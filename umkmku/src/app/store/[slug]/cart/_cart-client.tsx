'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Minus, Plus, Trash2, ShieldCheck, TreePine, Package } from 'lucide-react'
import type { Tenant, Product } from '@/lib/supabase/types'
import { useCart } from '@/lib/cart-context'

interface Props {
  tenant: Tenant
  crossSell: Product[]
  slug: string
}

function fmt(n: number) { return 'Rp ' + n.toLocaleString('id-ID') }

export function CartClient({ tenant, crossSell, slug }: Props) {
  const { items, removeItem, updateQty, addItem, totalPrice } = useCart()
  const [promo, setPromo] = useState('')
  const [promoApplied, setPromoApplied] = useState(false)

  const subtotal = totalPrice
  const discount = promoApplied ? Math.round(subtotal * 0.1) : 0
  const ecoTax = Math.round(subtotal * 0.02)
  const total = subtotal - discount + ecoTax

  return (
    <div className="min-h-screen bg-[var(--color-secondary)]">
      <div className="max-w-[1280px] mx-auto px-6 md:px-16 py-12">

        {/* Breadcrumb */}
        <p className="text-label-caps text-[10px] text-[var(--color-accent)]/40 mb-6">
          <Link href={`/store/${slug}/shop`} className="hover:text-[var(--color-primary)] transition-colors">TOKO</Link>
          {' / '}
          <span>KERANJANG</span>
        </p>

        <h1 className="text-display italic mb-12">Review Your Selection</h1>

        {items.length === 0 ? (
          /* Empty state */
          <div className="text-center py-32 border border-black/8 bg-white rounded">
            <p className="text-headline-md italic text-[var(--color-accent)]/40 mb-8">Keranjangmu masih kosong.</p>
            <Link href={`/store/${slug}/shop`}
              className="inline-flex items-center gap-3 px-8 py-4 bg-[var(--color-primary)] text-white text-label-caps hover:opacity-90 transition-opacity">
              MULAI BELANJA →
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">

            {/* ── Cart items ── */}
            <div className="lg:col-span-2">
              <div className="bg-white border border-black/8 divide-y divide-black/5">
                {items.map(item => (
                  <div key={item.productId} className="flex gap-6 p-6">
                    {/* Image */}
                    <div className="w-28 h-28 bg-[var(--color-secondary)] shrink-0 relative overflow-hidden">
                      {item.imageUrl
                        ? <Image src={item.imageUrl} alt={item.name} fill sizes="112px" className="object-cover" />
                        : <div className="w-full h-full flex items-center justify-center text-[var(--color-accent)]/20 text-[10px] text-center font-sans">No image</div>
                      }
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-headline-md italic mb-1">{item.name}</p>

                      {/* Qty controls */}
                      <div className="flex items-center gap-5 mt-4">
                        <div className="flex items-center gap-3 border border-black/15">
                          <button onClick={() => updateQty(item.productId, item.quantity - 1)}
                            className="w-9 h-9 flex items-center justify-center hover:bg-[var(--color-secondary)] transition-colors">
                            <Minus size={12} />
                          </button>
                          <span className="text-body-md font-medium w-5 text-center">{item.quantity}</span>
                          <button onClick={() => updateQty(item.productId, item.quantity + 1)}
                            className="w-9 h-9 flex items-center justify-center hover:bg-[var(--color-secondary)] transition-colors">
                            <Plus size={12} />
                          </button>
                        </div>
                        <button onClick={() => removeItem(item.productId)}
                          className="text-[var(--color-accent)]/30 hover:text-red-400 transition-colors">
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>

                    {/* Line total */}
                    <div className="shrink-0 text-right">
                      <p className="text-headline-md">{fmt(item.price * item.quantity)}</p>
                      {item.quantity > 1 && (
                        <p className="text-body-md text-[var(--color-accent)]/40 text-sm">{fmt(item.price)} / item</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6">
                <Link href={`/store/${slug}/shop`}
                  className="text-label-caps text-[10px] text-[var(--color-accent)]/50 hover:text-[var(--color-primary)] transition-colors">
                  ← LANJUT BELANJA
                </Link>
              </div>

              {/* Trust badges */}
              <div className="grid grid-cols-2 gap-4 mt-10">
                {[
                  { icon: TreePine, title: 'TANAM POHON', body: 'Setiap pembelian berkontribusi pada program reforestasi kami di Indonesia.' },
                  { icon: Package, title: 'KEMASAN ZERO WASTE', body: '100% kemasan dapat didaur ulang atau terurai secara hayati.' },
                ].map(b => (
                  <div key={b.title} className="flex items-start gap-4 p-5 bg-white border border-black/8">
                    <b.icon size={18} className="text-[var(--color-primary)] shrink-0 mt-0.5" />
                    <div>
                      <p className="text-label-caps text-[10px] text-[var(--color-primary)] mb-1">{b.title}</p>
                      <p className="text-body-md text-[var(--color-accent)]/60 text-sm leading-relaxed">{b.body}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Order summary ── */}
            <div className="space-y-4">

              {/* Promo code */}
              <div className="bg-white border border-black/8 p-5">
                <p className="text-label-caps text-[10px] text-[var(--color-accent)]/50 mb-3">KODE PROMO</p>
                <div className="flex gap-0">
                  <input
                    type="text"
                    value={promo}
                    onChange={e => setPromo(e.target.value)}
                    placeholder="Masukkan kode"
                    className="flex-1 bg-[var(--color-secondary)] border border-black/15 border-r-0 px-3 py-2.5 text-body-md text-sm focus:outline-none focus:border-[var(--color-primary)] transition-colors"
                  />
                  <button
                    onClick={() => promo && setPromoApplied(true)}
                    className="bg-[var(--color-primary)] text-white text-label-caps text-[10px] px-4 hover:opacity-90 transition-opacity">
                    APPLY
                  </button>
                </div>
                {promoApplied && (
                  <p className="text-[10px] text-green-600 font-sans mt-2">✓ Diskon 10% berhasil diterapkan</p>
                )}
              </div>

              {/* Summary panel */}
              <div className="bg-white border border-black/8 p-6 space-y-4">
                <p className="text-label-caps text-[10px] text-[var(--color-accent)]/40 mb-2">RINGKASAN PESANAN</p>

                <div className="space-y-3">
                  <div className="flex justify-between text-body-md">
                    <span className="text-[var(--color-accent)]/60">Subtotal</span>
                    <span>{fmt(subtotal)}</span>
                  </div>
                  {promoApplied && (
                    <div className="flex justify-between text-body-md text-green-600">
                      <span>Diskon promo</span>
                      <span>- {fmt(discount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-body-md">
                    <span className="text-[var(--color-accent)]/60">Pengiriman</span>
                    <span className="text-[var(--color-accent)]/40 text-sm">Dihitung saat checkout</span>
                  </div>
                  <div className="flex justify-between text-body-md">
                    <span className="text-[var(--color-accent)]/60">Eco-Tax (2%)</span>
                    <span>{fmt(ecoTax)}</span>
                  </div>
                </div>

                <div className="border-t border-black/8 pt-4 flex justify-between items-baseline">
                  <span className="text-headline-md italic">Total</span>
                  <span className="text-headline-lg" style={{ color: 'var(--color-primary)' }}>{fmt(total)}</span>
                </div>

                <Link
                  href={`/store/${slug}/checkout`}
                  className="block w-full py-4 bg-[var(--color-primary)] text-white text-center text-label-caps tracking-widest hover:opacity-90 transition-opacity mt-2">
                  LANJUT KE CHECKOUT
                </Link>

                <div className="flex items-center justify-center gap-2 pt-1">
                  <ShieldCheck size={13} className="text-[var(--color-accent)]/30" />
                  <p className="text-[10px] text-[var(--color-accent)]/40 font-sans">Pembayaran terenkripsi SSL</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Cross-sell ── */}
        {crossSell.length > 0 && (
          <section className="mt-24">
            <div className="mb-10">
              <p className="text-label-caps text-[10px] text-[var(--color-accent)]/40 mb-2">REKOMENDASI</p>
              <h2 className="text-headline-lg italic">Mungkin kamu juga suka</h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {crossSell.map(p => (
                <div key={p.id} className="group bg-white border border-black/8 overflow-hidden">
                  <Link href={`/store/${slug}/products/${p.id}`}>
                    <div className="relative aspect-square bg-[var(--color-secondary)]">
                      {p.image_url && (
                        <Image src={p.image_url} alt={p.name} fill sizes="25vw" className="object-cover group-hover:scale-105 transition-transform duration-500" />
                      )}
                    </div>
                    <div className="p-4">
                      <p className="text-body-md font-medium leading-tight mb-1 group-hover:text-[var(--color-primary)] transition-colors">{p.name}</p>
                      <p className="text-label-caps text-[10px] text-[var(--color-accent)]/50 mb-3">
                        {p.price ? 'Rp ' + p.price.toLocaleString('id-ID') : '—'}
                      </p>
                    </div>
                  </Link>
                  <div className="px-4 pb-4">
                    <button
                      onClick={() => addItem({ productId: p.id, name: p.name, price: p.price ?? 0, imageUrl: p.image_url })}
                      className="w-full text-label-caps text-[10px] border border-[var(--color-primary)] text-[var(--color-primary)] py-2.5 hover:bg-[var(--color-primary)] hover:text-white transition-colors">
                      TAMBAH KE KERANJANG
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}
