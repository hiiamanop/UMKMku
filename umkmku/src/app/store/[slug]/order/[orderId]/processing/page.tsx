'use client'

import { useEffect, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useCart } from '@/lib/cart-context'

export default function OrderProcessingPage() {
  const router = useRouter()
  const { slug } = useParams<{ slug: string }>()
  const { clearCart } = useCart()
  const clearCartRef = useRef(clearCart)

  useEffect(() => {
    clearCartRef.current()
    const t = setTimeout(() => router.replace(`/store/${slug}/orders`), 2800)
    return () => clearTimeout(t)
  }, [router, slug])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-8 px-6"
      style={{ background: 'var(--color-secondary)' }}>

      {/* Animated circle */}
      <div className="relative w-20 h-20">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 80 80">
          <circle cx="40" cy="40" r="34" fill="none" stroke="currentColor"
            strokeWidth="3" className="text-black/10" />
          <circle cx="40" cy="40" r="34" fill="none"
            stroke="var(--color-primary)" strokeWidth="3"
            strokeLinecap="round" strokeDasharray="213"
            className="animate-[dash_2s_ease-in-out_infinite]" />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-3 h-3 rounded-full animate-pulse" style={{ background: 'var(--color-primary)' }} />
        </div>
      </div>

      <div className="text-center max-w-xs">
        <h1 className="text-display italic text-[var(--color-accent)] mb-3">
          Pesanan Dibuat
        </h1>
        <p className="text-body-md text-[var(--color-accent)]/50 leading-relaxed">
          Pesananmu sedang diproses. Kami akan segera mengirimkan instruksi pembayaran.
        </p>
      </div>

      <style>{`
        @keyframes dash {
          0%   { stroke-dashoffset: 213; opacity: 1; }
          50%  { stroke-dashoffset: 0;   opacity: 1; }
          100% { stroke-dashoffset: -213; opacity: 0; }
        }
      `}</style>
    </div>
  )
}
