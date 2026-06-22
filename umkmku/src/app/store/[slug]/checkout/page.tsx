'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { calculatePricingBreakdown, formatRupiah } from '@/lib/utils/pricing'
import { CheckoutLayout } from '@/components/checkout/CheckoutLayout'
import type { PricingBreakdown } from '@/lib/utils/pricing'

interface CartItem {
  product_id: string
  quantity: number
  product_name: string
  price: number
}

type PaymentStatus = 'idle' | 'processing' | 'success' | 'failed'

export default function CheckoutPage({ params: paramsPromise }: { params: Promise<{ slug: string }> }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [params, setParams] = useState<{ slug: string } | null>(null)
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [pricing, setPricing] = useState<PricingBreakdown | null>(null)
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('idle')
  const [orderId, setOrderId] = useState<string | null>(null)
  const [qrisImageUrl, setQrisImageUrl] = useState<string | null>(null)
  const [pollingAttempts, setPollingAttempts] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [customerEmail, setCustomerEmail] = useState('')
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')

  useEffect(() => { paramsPromise.then((p) => setParams(p)) }, [paramsPromise])

  useEffect(() => {
    const cartJson = searchParams.get('cart')
    if (cartJson) {
      try {
        const parsed = JSON.parse(cartJson)
        if (Array.isArray(parsed)) setCartItems(parsed)
      } catch { setError('Data keranjang tidak valid') }
    }
  }, [searchParams])

  useEffect(() => {
    if (cartItems.length > 0) {
      const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0)
      setPricing(calculatePricingBreakdown(subtotal))
    }
  }, [cartItems])

  useEffect(() => {
    if (paymentStatus !== 'processing' || !orderId) return
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/orders/${orderId}`)
        const data = await res.json()
        const status = data.data?.payment_status
        if (status === 'completed') {
          setPaymentStatus('success')
          clearInterval(interval)
          setTimeout(() => router.push(`/store/${params?.slug}/order/${orderId}`), 2000)
        } else if (status === 'failed' || status === 'expired') {
          setPaymentStatus('failed')
          setError(`Pembayaran ${status === 'expired' ? 'kadaluarsa' : 'gagal'}`)
          clearInterval(interval)
        }
        setPollingAttempts((p) => p + 1)
        if (pollingAttempts > 300) {
          setPaymentStatus('failed')
          setError('Waktu pembayaran habis.')
          clearInterval(interval)
        }
      } catch { /* continue polling */ }
    }, 3000)
    return () => clearInterval(interval)
  }, [paymentStatus, orderId, pollingAttempts, router, params])

  const handlePay = async () => {
    if (!params || !pricing || !customerEmail) { setError('Mohon lengkapi data'); return }
    setError(null)
    setPaymentStatus('processing')
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenant_slug: params.slug,
          items: cartItems.map(({ product_id, quantity }) => ({ product_id, quantity })),
          customer_email: customerEmail,
          customer_name: customerName || null,
          customer_phone: customerPhone || null,
        }),
      })
      if (!res.ok) throw new Error((await res.json()).error || 'Gagal membuat pesanan')
      const data = await res.json()
      setOrderId(data.data.order_id)
      setQrisImageUrl(data.data.qris_image_url)
    } catch (err) {
      setPaymentStatus('failed')
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan')
    }
  }

  if (!params) return (
    <div className="min-h-screen flex items-center justify-center bg-[#f9f9f9]">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#e91e63]" />
    </div>
  )

  const subtotal = pricing?.subtotal ?? 0
  const ppn = pricing?.ppn ?? 0
  const xenditFee = pricing?.xenditFee ?? 0
  const total = pricing?.finalPrice ?? 0

  return (
    <CheckoutLayout step={1} items={cartItems} subtotal={subtotal} ppn={ppn} xenditFee={xenditFee} total={total}>
      {/* Customer form */}
      {paymentStatus === 'idle' && (
        <div className="bg-white rounded-lg border border-[#e8e8e8] p-6 space-y-4">
          <h2 className="text-headline-md text-[#1a1c1c]">Informasi Pelanggan</h2>

          {[
            { label: 'Email', type: 'email', value: customerEmail, setter: setCustomerEmail, placeholder: 'email@kamu.com', required: true },
            { label: 'Nama Lengkap', type: 'text', value: customerName, setter: setCustomerName, placeholder: 'Nama Lengkap' },
            { label: 'Nomor WhatsApp', type: 'tel', value: customerPhone, setter: setCustomerPhone, placeholder: '08xxx' },
          ].map(({ label, type, value, setter, placeholder, required }) => (
            <div key={label}>
              <label className="text-label-bold text-[#1a1c1c] block mb-1">
                {label.toUpperCase()}{required && <span className="text-[#e91e63] ml-1">*</span>}
              </label>
              <input
                type={type}
                value={value}
                onChange={(e) => setter(e.target.value)}
                placeholder={placeholder}
                className="w-full h-12 px-4 bg-[#f3f3f3] rounded-lg text-[14px] outline-none focus:ring-2 focus:ring-[#e91e63]"
              />
            </div>
          ))}

          {error && <p className="text-[#ba1a1a] text-[14px]">{error}</p>}

          <button
            onClick={handlePay}
            disabled={!customerEmail}
            className="w-full h-12 bg-[#1a1c1c] text-white font-bold text-[14px] uppercase rounded-lg hover:bg-[#333] transition-colors disabled:opacity-40 disabled:cursor-not-allowed mt-2"
          >
            Lanjut ke Pembayaran
          </button>
        </div>
      )}

      {/* QRIS Processing */}
      {paymentStatus === 'processing' && (
        <div className="bg-white rounded-lg border border-[#e8e8e8] p-6 space-y-6 text-center">
          {!qrisImageUrl && <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#e91e63] mx-auto" />}
          {qrisImageUrl && (
            <>
              <p className="text-headline-md text-[#1a1c1c]">Scan QRIS untuk Membayar</p>
              <div className="flex justify-center bg-[#f3f3f3] p-6 rounded-lg">
                <img src={qrisImageUrl} alt="QRIS" className="w-56 h-56" />
              </div>
              <p className="text-[14px] text-[#5b3f43]">
                Total: <span className="font-bold text-[#e91e63]">{formatRupiah(total)}</span>
              </p>
              <p className="text-[12px] text-[#8f6f73]">Halaman akan otomatis diperbarui setelah pembayaran berhasil.</p>
            </>
          )}
        </div>
      )}

      {/* Success */}
      {paymentStatus === 'success' && (
        <div className="bg-white rounded-lg border border-[#006a34] p-6 text-center space-y-3">
          <div className="w-16 h-16 bg-[#006a34] rounded-full flex items-center justify-center mx-auto text-white text-2xl">✓</div>
          <p className="text-headline-md text-[#1a1c1c]">Pembayaran Berhasil!</p>
          <p className="text-[14px] text-[#5b3f43]">Mengalihkan ke halaman konfirmasi...</p>
        </div>
      )}

      {/* Failed */}
      {paymentStatus === 'failed' && (
        <div className="bg-white rounded-lg border border-[#ba1a1a] p-6 space-y-4">
          <p className="text-headline-md text-[#ba1a1a]">Pembayaran Gagal</p>
          <p className="text-[14px] text-[#5b3f43]">{error}</p>
          <button
            onClick={() => { setPaymentStatus('idle'); setOrderId(null); setQrisImageUrl(null); setError(null) }}
            className="w-full h-12 bg-[#ba1a1a] text-white font-bold rounded-lg hover:opacity-90"
          >
            Coba Lagi
          </button>
        </div>
      )}
    </CheckoutLayout>
  )
}
