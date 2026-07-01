import Link from 'next/link'
import { Check, ChevronRight, ArrowLeft, Zap, HelpCircle } from 'lucide-react'

const PRIMARY = '#0A2F73'
const GOLD = '#F4B400'
const SURFACE = '#F8FAFC'
const BORDER = '#E5EAF0'
const TEXT_SEC = '#5E6B85'

const plans = [
  {
    id: 'free',
    name: 'Free Trial',
    price: 0,
    period: '7 hari',
    desc: 'Coba semua fitur tanpa risiko, tanpa kartu kredit.',
    cta: 'Mulai Gratis',
    popular: false,
    features: [
      'Toko di subdomain sendiri',
      'Onboarding via AI',
      'AI Chatbot (10.000 token)',
      'Checkout & pembayaran QRIS',
      'Manajemen pesanan',
      'Notifikasi WhatsApp otomatis',
      'Verifikasi pembayaran via AI',
    ],
    limits: [
      'Toko disuspend setelah 7 hari (upgrade untuk lanjutkan)',
    ],
  },
  {
    id: 'business',
    name: 'Business',
    price: 399000,
    period: '/bulan',
    desc: 'Untuk brand yang sudah aktif berjualan dan butuh semua fitur.',
    cta: 'Pilih Business',
    popular: true,
    features: [
      'Semua fitur Free Trial',
      'AI Chatbot 1.000.000 token/bulan',
      '1.000 pesanan/bulan',
      'Analitik penjualan 30 hari',
      'Top-up pesanan kapan saja',
      'Support via WhatsApp',
    ],
    limits: [
      'Overage pesanan: Rp 1.000/pesanan ditagih bulan depan',
    ],
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 599000,
    period: '/bulan',
    desc: 'Untuk brand dengan volume tinggi dan kebutuhan AI intensif.',
    cta: 'Pilih Enterprise',
    popular: false,
    features: [
      'Semua fitur Business',
      'AI Chatbot 50 juta token/bulan',
      'Pesanan tidak terbatas',
      'Custom chatbot persona & nama',
      'Priority support',
      'SLA uptime 99.9%',
    ],
    limits: [],
  },
]

const faqs = [
  {
    q: 'Apa yang terjadi setelah trial 7 hari habis?',
    a: 'Toko kamu akan disuspend, customer tidak bisa mengakses toko sampai kamu upgrade ke plan berbayar. Kami kirim notifikasi email dan WhatsApp sebelum dan saat trial habis.',
  },
  {
    q: 'Bagaimana cara top-up kuota pesanan?',
    a: 'Di dashboard merchant, kamu bisa beli paket top-up Rp 10.000 untuk 50 pesanan tambahan kapan saja. Top-up langsung aktif begitu pembayaran dikonfirmasi.',
  },
  {
    q: 'Apa itu overage pesanan di Business plan?',
    a: 'Jika kamu melewati 1.000 pesanan/bulan, pesanan tetap masuk (tidak diblokir). Biaya Rp 1.000 per pesanan lebih akan ditagihkan di bulan berikutnya. Kami kirim notifikasi WA saat kuota tinggal 20%.',
  },
  {
    q: 'Apakah token AI bisa ditambah?',
    a: 'Saat ini token AI tidak bisa di-top-up secara terpisah. Jika token habis sebelum akhir bulan, upgrade ke plan yang lebih tinggi adalah cara termudah.',
  },
  {
    q: 'Bagaimana cara pembayaran subscription?',
    a: 'Saat ini pembayaran dikonfirmasi secara manual oleh tim UMKMu via transfer bank atau QRIS. Kami sedang mengintegrasikan payment gateway otomatis.',
  },
]

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-white font-sans">

      {/* Navbar */}
      <nav style={{ borderBottom: `1px solid ${BORDER}` }} className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm">
        <div className="mx-auto max-w-6xl px-6 flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2 text-sm font-medium" style={{ color: TEXT_SEC }}>
            <ArrowLeft size={14} />
            Kembali
          </Link>
          <Link href="/">
            <img src="/logo.png" alt="UMKMu" style={{ height: '32px', width: 'auto' }} />
          </Link>
          <Link
            href="/onboarding"
            className="text-sm font-semibold px-4 py-2 rounded-lg text-white"
            style={{ background: PRIMARY }}
          >
            Mulai Gratis
          </Link>
        </div>
      </nav>

      {/* Header */}
      <section className="mx-auto max-w-3xl px-6 pt-16 pb-12 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium mb-6" style={{ background: `${GOLD}22`, color: '#8B6800' }}>
          <Zap size={14} />
          Mulai gratis, upgrade kapan saja
        </div>
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight" style={{ color: PRIMARY }}>
          Harga yang Tumbuh<br />
          <span style={{ color: GOLD }}>Bersama Bisnismu</span>
        </h1>
        <p className="mt-4 text-lg" style={{ color: TEXT_SEC }}>
          7 hari trial penuh. Tidak perlu kartu kredit. Toko live dalam 60 detik.
        </p>
      </section>

      {/* Pricing Cards */}
      <section className="mx-auto max-w-6xl px-6 pb-16">
        <div className="grid md:grid-cols-3 gap-6 items-start">
          {plans.map((p) => (
            <div
              key={p.id}
              className="rounded-2xl p-8 flex flex-col gap-6"
              style={{
                border: p.popular ? `2px solid ${PRIMARY}` : `1px solid ${BORDER}`,
                background: p.popular ? PRIMARY : 'white',
              }}
            >
              {/* Plan header */}
              <div className="flex flex-col gap-1">
                {p.popular && (
                  <div className="text-xs font-bold px-3 py-1 rounded-full self-start mb-2" style={{ background: GOLD, color: '#1a1a1a' }}>
                    Terpopuler
                  </div>
                )}
                <div className="text-sm font-medium" style={{ color: p.popular ? 'rgba(255,255,255,0.65)' : TEXT_SEC }}>
                  {p.name}
                </div>
                <div className="flex items-end gap-1">
                  <span className="text-4xl font-bold" style={{ color: p.popular ? 'white' : PRIMARY }}>
                    {p.price === 0 ? 'Gratis' : `Rp ${(p.price / 1000).toFixed(0)}k`}
                  </span>
                  {p.price > 0 && (
                    <span className="text-sm pb-1" style={{ color: p.popular ? 'rgba(255,255,255,0.55)' : TEXT_SEC }}>{p.period}</span>
                  )}
                </div>
                {p.price === 0 && (
                  <span className="text-sm" style={{ color: p.popular ? 'rgba(255,255,255,0.55)' : TEXT_SEC }}>{p.period}</span>
                )}
                <p className="text-sm mt-1" style={{ color: p.popular ? 'rgba(255,255,255,0.65)' : TEXT_SEC }}>{p.desc}</p>
              </div>

              {/* CTA */}
              <Link
                href="/onboarding"
                className="flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm transition-opacity hover:opacity-90"
                style={{
                  background: p.popular ? GOLD : PRIMARY,
                  color: p.popular ? '#1a1a1a' : 'white',
                }}
              >
                {p.cta} <ChevronRight size={14} />
              </Link>

              {/* Features */}
              <div className="flex flex-col gap-3">
                {p.features.map((f) => (
                  <div key={f} className="flex items-start gap-2 text-sm">
                    <Check size={14} className="mt-0.5 shrink-0" style={{ color: GOLD }} />
                    <span style={{ color: p.popular ? 'rgba(255,255,255,0.85)' : TEXT_SEC }}>{f}</span>
                  </div>
                ))}
              </div>

              {/* Limits */}
              {p.limits.length > 0 && (
                <div className="flex flex-col gap-2 pt-4" style={{ borderTop: `1px solid ${p.popular ? 'rgba(255,255,255,0.15)' : BORDER}` }}>
                  {p.limits.map((l) => (
                    <div key={l} className="flex items-start gap-2 text-xs">
                      <HelpCircle size={12} className="mt-0.5 shrink-0" style={{ color: p.popular ? 'rgba(255,255,255,0.4)' : TEXT_SEC }} />
                      <span style={{ color: p.popular ? 'rgba(255,255,255,0.5)' : TEXT_SEC }}>{l}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Top-up addon */}
        <div className="mt-8 rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4" style={{ background: SURFACE, border: `1px solid ${BORDER}` }}>
          <div>
            <div className="font-semibold text-sm" style={{ color: PRIMARY }}>Butuh lebih banyak pesanan?</div>
            <div className="text-sm mt-1" style={{ color: TEXT_SEC }}>
              Top-up kapan saja di dashboard, tidak perlu upgrade plan dulu.
            </div>
          </div>
          <div className="shrink-0 flex items-center gap-3">
            <div className="text-lg font-bold" style={{ color: PRIMARY }}>Rp 10.000</div>
            <div className="text-sm px-3 py-1 rounded-full font-medium" style={{ background: `${PRIMARY}15`, color: PRIMARY }}>
              50 pesanan tambahan
            </div>
          </div>
        </div>
      </section>

      {/* Comparison table */}
      <section style={{ background: SURFACE }} className="py-16">
        <div className="mx-auto max-w-4xl px-6">
          <h2 className="text-2xl font-bold text-center mb-10" style={{ color: PRIMARY }}>Perbandingan Lengkap</h2>
          <div className="rounded-2xl overflow-hidden" style={{ border: `1px solid ${BORDER}` }}>
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: PRIMARY }}>
                  <th className="text-left px-6 py-4 font-medium text-white/70">Fitur</th>
                  <th className="px-6 py-4 font-semibold text-white text-center">Free</th>
                  <th className="px-6 py-4 font-semibold text-center" style={{ color: GOLD }}>Business</th>
                  <th className="px-6 py-4 font-semibold text-white text-center">Enterprise</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y" style={{ borderColor: BORDER }}>
                {[
                  ['Toko subdomain sendiri', '✓', '✓', '✓'],
                  ['Onboarding via AI', '✓', '✓', '✓'],
                  ['Checkout & QRIS', '✓', '✓', '✓'],
                  ['Notifikasi WhatsApp', '✓', '✓', '✓'],
                  ['Verifikasi bayar via AI', '✓', '✓', '✓'],
                  ['AI Chatbot token/bulan', '10.000', '1.000.000', '50.000.000'],
                  ['Pesanan/bulan', '—', '1.000', 'Tidak terbatas'],
                  ['Analitik penjualan', '—', '✓', '✓'],
                  ['Top-up pesanan', '—', '✓', '✓'],
                  ['Custom chatbot persona', '—', '—', '✓'],
                  ['Priority support', '—', '—', '✓'],
                  ['Durasi', '7 hari', 'Per bulan', 'Per bulan'],
                  ['Harga', 'Gratis', 'Rp 399.000', 'Rp 599.000'],
                ].map(([feature, free, business, enterprise], i) => (
                  <tr key={i} style={{ background: i % 2 === 0 ? 'white' : SURFACE }}>
                    <td className="px-6 py-3 font-medium" style={{ color: PRIMARY }}>{feature}</td>
                    <td className="px-6 py-3 text-center" style={{ color: free === '✓' ? '#16a34a' : free === '—' ? BORDER : TEXT_SEC }}>
                      {free}
                    </td>
                    <td className="px-6 py-3 text-center font-medium" style={{ color: business === '✓' ? '#16a34a' : business === '—' ? BORDER : PRIMARY }}>
                      {business}
                    </td>
                    <td className="px-6 py-3 text-center" style={{ color: enterprise === '✓' ? '#16a34a' : enterprise === '—' ? BORDER : TEXT_SEC }}>
                      {enterprise}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 mx-auto max-w-3xl px-6">
        <h2 className="text-2xl font-bold text-center mb-10" style={{ color: PRIMARY }}>Pertanyaan Umum</h2>
        <div className="flex flex-col gap-4">
          {faqs.map((f) => (
            <div key={f.q} className="rounded-xl p-6" style={{ border: `1px solid ${BORDER}` }}>
              <div className="font-semibold text-sm mb-2" style={{ color: PRIMARY }}>{f.q}</div>
              <div className="text-sm leading-relaxed" style={{ color: TEXT_SEC }}>{f.a}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-16" style={{ background: PRIMARY }}>
        <div className="mx-auto max-w-2xl px-6 text-center flex flex-col items-center gap-5">
          <h2 className="text-3xl font-bold text-white">Mulai 7 Hari Gratis</h2>
          <p style={{ color: 'rgba(255,255,255,0.65)' }}>Tidak perlu kartu kredit. Toko live dalam 60 detik.</p>
          <Link
            href="/onboarding"
            className="flex items-center gap-2 px-8 py-4 rounded-xl font-semibold text-base transition-opacity hover:opacity-90"
            style={{ background: GOLD, color: '#1a1a1a' }}
          >
            Coba Gratis Sekarang <ChevronRight size={16} />
          </Link>
        </div>
      </section>

    </div>
  )
}
