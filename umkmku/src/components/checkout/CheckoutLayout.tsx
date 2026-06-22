'use client'

import { ShieldCheck, Leaf, Package } from 'lucide-react'
import { formatRupiah } from '@/lib/utils/pricing'

interface OrderItem {
  product_id: string
  quantity: number
  product_name: string
  price: number
}

interface Props {
  children: React.ReactNode
  step: 1 | 2 | 3
  items: OrderItem[]
  subtotal: number
  ppn: number
  xenditFee: number
  total: number
}

const STEPS = ['Informasi', 'Pengiriman', 'Pembayaran']

const TRUST_BADGES = [
  { icon: ShieldCheck, label: 'Secure SSL', desc: 'Transaksi terenkripsi' },
  { icon: Leaf, label: 'Ethically Sourced', desc: 'Bahan pilihan' },
  { icon: Package, label: 'Plastic-Free', desc: 'Kemasan ramah lingkungan' },
]

export function CheckoutLayout({ children, step, items, subtotal, ppn, xenditFee, total }: Props) {
  return (
    <main className="bg-[#f9f9f9] min-h-screen">
      {/* Secure checkout header */}
      <div className="bg-white border-b border-[#e8e8e8] py-4">
        <div className="max-w-[1200px] mx-auto px-4 md:px-6 flex items-center gap-2">
          <ShieldCheck size={18} className="text-[#006a34]" />
          <span className="text-[14px] font-bold text-[#1a1c1c]">Secure Checkout</span>
        </div>
      </div>

      <div className="max-w-[1200px] mx-auto px-4 md:px-6 py-8">
        {/* Step indicator */}
        <div className="flex items-center gap-0 mb-10 max-w-xs">
          {STEPS.map((label, i) => {
            const stepNum = i + 1
            const isActive = stepNum === step
            const isDone = stepNum < step
            return (
              <div key={label} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold transition-colors ${
                    isDone ? 'bg-[#006a34] text-white' :
                    isActive ? 'bg-[#e91e63] text-white' :
                    'bg-[#e2e2e2] text-[#5b3f43]'
                  }`}>
                    {isDone ? '✓' : stepNum}
                  </div>
                  <span className={`text-[10px] font-bold uppercase mt-1 ${isActive ? 'text-[#e91e63]' : 'text-[#8f6f73]'}`}>
                    {label}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className={`h-[1px] w-8 mx-1 mb-4 ${isDone ? 'bg-[#006a34]' : 'bg-[#e2e2e2]'}`} />
                )}
              </div>
            )
          })}
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {/* Form area */}
          <div className="md:col-span-2 space-y-6">
            {children}

            {/* Trust badges */}
            <div className="flex flex-wrap gap-6 pt-4">
              {TRUST_BADGES.map(({ icon: Icon, label, desc }) => (
                <div key={label} className="flex items-center gap-2">
                  <Icon size={20} className="text-[#006a34] shrink-0" />
                  <div>
                    <p className="text-[12px] font-bold text-[#1a1c1c]">{label}</p>
                    <p className="text-[11px] text-[#5b3f43]">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Order summary sidebar */}
          <div className="bg-[#f3f3f3] rounded-lg p-6 space-y-4 h-fit">
            <p className="text-headline-md text-[#1a1c1c] mb-2">Pesanan</p>

            {/* Items */}
            <div className="space-y-3">
              {items.map((item) => (
                <div key={item.product_id} className="flex justify-between gap-2">
                  <span className="text-[14px] text-[#1a1c1c] line-clamp-2 flex-1">
                    {item.product_name}
                    <span className="text-[#5b3f43]"> ×{item.quantity}</span>
                  </span>
                  <span className="text-[14px] font-bold text-[#1a1c1c] shrink-0">
                    {formatRupiah(item.price * item.quantity)}
                  </span>
                </div>
              ))}
            </div>

            <div className="border-t border-[#e4bdc2] pt-3 space-y-2">
              <div className="flex justify-between text-[14px]">
                <span className="text-[#5b3f43]">Subtotal</span>
                <span className="font-bold">{formatRupiah(subtotal)}</span>
              </div>
              <div className="flex justify-between text-[14px]">
                <span className="text-[#5b3f43]">PPN (12%)</span>
                <span className="font-bold">{formatRupiah(ppn)}</span>
              </div>
              <div className="flex justify-between text-[14px]">
                <span className="text-[#5b3f43]">Biaya transaksi</span>
                <span className="font-bold">{formatRupiah(xenditFee)}</span>
              </div>
              <div className="flex justify-between border-t border-[#e4bdc2] pt-2">
                <span className="text-[16px] font-bold text-[#1a1c1c]">Total</span>
                <span className="text-[16px] font-bold text-[#e91e63]">{formatRupiah(total)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
