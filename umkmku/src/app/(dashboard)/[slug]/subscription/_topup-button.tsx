'use client'

import { useState } from 'react'
import { ShoppingBag, Loader2 } from 'lucide-react'

interface Props {
  packageId: string
  tenantId: string
  packageName: string
  price: number
}

export function TopUpButton({ packageId, tenantId, packageName, price }: Props) {
  const [state, setState] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')

  const handleTopUp = async () => {
    setState('loading')
    try {
      const res = await fetch('/api/topup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ packageId, tenantId }),
      })
      if (!res.ok) throw new Error()
      setState('done')
    } catch {
      setState('error')
      setTimeout(() => setState('idle'), 3000)
    }
  }

  if (state === 'done') {
    return (
      <div className="text-xs text-green-700 font-semibold bg-green-50 px-3 py-2 rounded-lg border border-green-200">
        ✓ Permintaan dikirim
      </div>
    )
  }

  if (state === 'error') {
    return (
      <div className="text-xs text-red-600 font-semibold bg-red-50 px-3 py-2 rounded-lg border border-red-100">
        Gagal, coba lagi
      </div>
    )
  }

  return (
    <button
      onClick={handleTopUp}
      disabled={state === 'loading'}
      className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg text-white transition-opacity hover:opacity-90 disabled:opacity-60"
      style={{ background: '#0A2F73' }}
      title={`Top-up ${packageName}, Rp ${price.toLocaleString('id-ID')}`}
    >
      {state === 'loading' ? <Loader2 size={12} className="animate-spin" /> : <ShoppingBag size={12} />}
      Beli
    </button>
  )
}
