import { redirect } from 'next/navigation'
import { calculatePricingBreakdown, formatRupiah } from '@/lib/utils/pricing'
import { ArrowLeft, Shield, Zap } from 'lucide-react'
import Link from 'next/link'
import { CheckoutForm } from './_checkout-form'

const PRIMARY = '#0A2F73'
const GOLD = '#F4B400'
const BORDER = '#E5EAF0'
const TEXT_SEC = '#5E6B85'
const SURFACE = '#F8FAFC'

const PLANS: Record<string, { id: string; name: string; price: number; features: string[] }> = {
  business: {
    id: 'business',
    name: 'Business',
    price: 10000,
    features: ['AI Chatbot 1 juta token/bulan', '1.000 pesanan/bulan', 'Analitik penjualan', 'WhatsApp support'],
  },
  enterprise: {
    id: 'enterprise',
    name: 'Enterprise',
    price: 599000,
    features: ['AI Chatbot 50 juta token/bulan', 'Pesanan tidak terbatas', 'Custom chatbot persona', 'Priority support'],
  },
}

interface Props {
  searchParams: Promise<{ plan?: string; slug?: string }>
}

export default async function CheckoutPage({ searchParams }: Props) {
  const { plan: planKey = 'business', slug } = await searchParams
  const plan = PLANS[planKey]
  if (!plan) redirect('/subscribe')

  const pricing = calculatePricingBreakdown(plan.price, false) // QRIS manual, no gateway fee

  return (
    <div className="min-h-screen font-sans" style={{ background: SURFACE }}>

      {/* Navbar */}
      <nav className="bg-white sticky top-0 z-50" style={{ borderBottom: `1px solid ${BORDER}` }}>
        <div className="mx-auto max-w-5xl px-6 flex items-center justify-between h-16">
          <Link href="/subscribe" className="flex items-center gap-2 text-sm font-medium" style={{ color: TEXT_SEC }}>
            <ArrowLeft size={14} /> Pilih Plan Lain
          </Link>
          <Link href="/">
            <img src="/logo.png" alt="UMKMu" style={{ height: '32px', width: 'auto' }} />
          </Link>
          <div className="flex items-center gap-1.5 text-xs" style={{ color: TEXT_SEC }}>
            <Shield size={13} style={{ color: GOLD }} />
            <span className="hidden sm:inline">Pembayaran aman via payment gateway</span>
          </div>
        </div>
      </nav>

      <div className="mx-auto max-w-5xl px-6 py-12 grid md:grid-cols-2 gap-8 items-start">

        {/* Left: Order summary */}
        <div className="flex flex-col gap-5">
          <div>
            <div className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: TEXT_SEC }}>
              Ringkasan Pesanan
            </div>
            <h1 className="text-2xl font-bold" style={{ color: PRIMARY }}>
              UMKMku {plan.name}
            </h1>
            <p className="text-sm mt-1" style={{ color: TEXT_SEC }}>Langganan bulanan · Aktif setelah pembayaran</p>
          </div>

          {/* Plan features */}
          <div className="bg-white rounded-2xl p-5" style={{ border: `1px solid ${BORDER}` }}>
            <div className="text-xs font-semibold mb-3" style={{ color: TEXT_SEC }}>Yang kamu dapatkan:</div>
            <div className="flex flex-col gap-2">
              {['Toko di subdomain sendiri', 'Onboarding via AI (60 detik)', 'Checkout & QRIS', 'Notifikasi WhatsApp otomatis', ...plan.features].map(f => (
                <div key={f} className="flex items-center gap-2 text-sm" style={{ color: TEXT_SEC }}>
                  <span style={{ color: GOLD }}>✓</span> {f}
                </div>
              ))}
            </div>
          </div>

          {/* Price breakdown */}
          <div className="bg-white rounded-2xl p-5" style={{ border: `1px solid ${BORDER}` }}>
            <div className="text-xs font-semibold mb-4" style={{ color: TEXT_SEC }}>Rincian Harga</div>
            <div className="flex flex-col gap-3">
              <div className="flex justify-between text-sm">
                <span style={{ color: TEXT_SEC }}>Harga plan {plan.name}</span>
                <span style={{ color: PRIMARY }}>{formatRupiah(pricing.subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span style={{ color: TEXT_SEC }}>PPN (12%)</span>
                <span style={{ color: TEXT_SEC }}>{formatRupiah(pricing.ppn)}</span>
              </div>
              <div
                className="flex justify-between pt-3 mt-1"
                style={{ borderTop: `1px solid ${BORDER}` }}
              >
                <span className="font-bold" style={{ color: PRIMARY }}>Total yang dibayar</span>
                <span className="text-xl font-bold" style={{ color: PRIMARY }}>
                  {formatRupiah(pricing.finalPrice)}
                </span>
              </div>
            </div>
            <p className="text-xs mt-3" style={{ color: TEXT_SEC }}>
              Harga sudah termasuk PPN 12%. Tidak ada biaya tambahan untuk pembayaran QRIS.
            </p>
          </div>

          {/* Trust */}
          <div className="flex gap-4 text-xs" style={{ color: TEXT_SEC }}>
            <div className="flex items-center gap-1.5">
              <Shield size={12} style={{ color: GOLD }} /> SSL terenkripsi
            </div>
            <div className="flex items-center gap-1.5">
              <Zap size={12} style={{ color: GOLD }} /> Aktif instan setelah bayar
            </div>
          </div>
        </div>

        {/* Right: Form */}
        <CheckoutForm plan={plan} pricing={pricing} slug={slug} />
      </div>
    </div>
  )
}
