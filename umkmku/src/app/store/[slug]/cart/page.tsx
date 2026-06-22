'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { Minus, Plus, Trash2 } from 'lucide-react'

interface CartItem {
  id: string
  name: string
  price: number
  quantity: number
  image_url?: string | null
}

export default function CartPage() {
  const { slug } = useParams<{ slug: string }>()

  // ponytail: cart state local untuk sekarang, akan connect ke context nanti
  const [items, setItems] = useState<CartItem[]>([])
  const [promoCode, setPromoCode] = useState('')

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const ppn = Math.round(subtotal * 0.12)
  const xenditFee = Math.round((subtotal + ppn) * 0.025)
  const total = subtotal + ppn + xenditFee

  const updateQty = (id: string, delta: number) => {
    setItems((prev) =>
      prev
        .map((item) => item.id === id ? { ...item, quantity: item.quantity + delta } : item)
        .filter((item) => item.quantity > 0)
    )
  }

  return (
    <main className="bg-[#f9f9f9] min-h-screen py-10">
      <div className="max-w-[1200px] mx-auto px-4 md:px-6">
        <h1 className="text-headline-lg text-[#1a1c1c] mb-8">Review Your Selection</h1>

        {items.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-[#5b3f43] text-body-lg mb-6">Keranjang kamu kosong.</p>
            <Link
              href={`/store/${slug}/shop`}
              className="inline-block px-8 py-3 bg-[#e91e63] text-white rounded-lg font-bold text-[14px] uppercase hover:bg-[#b80049] transition-colors"
            >
              Mulai Belanja
            </Link>
          </div>
        ) : (
          <div className="grid md:grid-cols-3 gap-8">
            {/* Cart items */}
            <div className="md:col-span-2 space-y-0 divide-y divide-[#e8e8e8] bg-white rounded-lg border border-[#e8e8e8]">
              {items.map((item) => (
                <div key={item.id} className="flex gap-4 p-4">
                  {/* Image */}
                  <div className="w-24 h-24 bg-[#f3f3f3] rounded-lg shrink-0 overflow-hidden">
                    {item.image_url && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-[16px] font-bold text-[#1a1c1c] mb-1">{item.name}</p>
                    <p className="text-price mb-3">Rp {item.price.toLocaleString('id-ID')}</p>

                    {/* Qty + remove */}
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => updateQty(item.id, -1)}
                          className="w-7 h-7 flex items-center justify-center rounded-full border border-[#e4bdc2] hover:border-[#e91e63] transition-colors"
                        >
                          <Minus size={12} />
                        </button>
                        <span className="text-[14px] font-bold w-4 text-center">{item.quantity}</span>
                        <button
                          onClick={() => updateQty(item.id, 1)}
                          className="w-7 h-7 flex items-center justify-center rounded-full border border-[#e4bdc2] hover:border-[#e91e63] transition-colors"
                        >
                          <Plus size={12} />
                        </button>
                      </div>
                      <button
                        onClick={() => setItems((prev) => prev.filter((i) => i.id !== item.id))}
                        className="text-[#8f6f73] hover:text-[#e91e63] transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  {/* Line total */}
                  <div className="shrink-0 text-right">
                    <p className="text-[16px] font-bold text-[#1a1c1c]">
                      Rp {(item.price * item.quantity).toLocaleString('id-ID')}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Order summary */}
            <div className="space-y-4">
              {/* Promo code */}
              <div className="bg-white rounded-lg border border-[#e8e8e8] p-4">
                <p className="text-[12px] font-bold text-[#5b3f43] mb-2 uppercase">Kode Promo</p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value)}
                    placeholder="Masukkan kode"
                    className="flex-1 px-3 py-2 bg-[#f3f3f3] rounded-lg text-[14px] outline-none focus:ring-1 focus:ring-[#e91e63]"
                  />
                  <button className="text-[12px] font-bold text-[#e91e63] hover:underline">
                    APPLY
                  </button>
                </div>
              </div>

              {/* Summary */}
              <div className="bg-white rounded-lg border border-[#e4bdc2] p-6 space-y-3">
                <p className="text-headline-md text-[#1a1c1c] mb-4">Ringkasan Pesanan</p>

                <div className="flex justify-between text-[14px]">
                  <span className="text-[#5b3f43]">Subtotal</span>
                  <span className="font-bold text-[#1a1c1c]">Rp {subtotal.toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between text-[14px]">
                  <span className="text-[#5b3f43]">PPN (12%)</span>
                  <span className="font-bold text-[#1a1c1c]">Rp {ppn.toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between text-[14px]">
                  <span className="text-[#5b3f43]">Biaya Transaksi (2.5%)</span>
                  <span className="font-bold text-[#1a1c1c]">Rp {xenditFee.toLocaleString('id-ID')}</span>
                </div>

                <div className="border-t border-[#e4bdc2] pt-3 flex justify-between">
                  <span className="text-[16px] font-bold text-[#1a1c1c]">Total</span>
                  <span className="text-[16px] font-bold text-[#e91e63]">
                    Rp {total.toLocaleString('id-ID')}
                  </span>
                </div>

                <Link
                  href={`/store/${slug}/checkout`}
                  className="block w-full py-4 bg-[#1a1c1c] text-white text-center rounded-lg font-bold text-[14px] uppercase hover:bg-[#333] transition-colors mt-4"
                >
                  Lanjut ke Checkout
                </Link>

                <Link
                  href={`/store/${slug}/shop`}
                  className="block w-full text-center text-[14px] text-[#5b3f43] hover:text-[#1a1c1c] transition-colors py-2"
                >
                  Lanjut Belanja
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
