import Link from 'next/link'
import type { Metadata } from 'next'
import { ArrowRight, Check, TrendingUp, MessageCircle, Bell, ShoppingBag, Star, ChevronRight } from 'lucide-react'
import { LandingChat } from '@/components/landing/LandingChat'

export const metadata: Metadata = {
  title: 'UMKMu — Buat Toko Online UMKM dalam 60 Detik',
  description: 'Platform toko online terbaik untuk UMKM Indonesia. Subdomain sendiri, AI chatbot penjualan, checkout QRIS, dan manajemen pesanan. Coba gratis 7 hari.',
  openGraph: {
    title: 'UMKMu — Buat Toko Online UMKM dalam 60 Detik',
    description: 'Platform toko online terbaik untuk UMKM Indonesia. Subdomain sendiri, AI chatbot penjualan, checkout QRIS, dan manajemen pesanan.',
    url: 'https://umkmu.site',
    type: 'website',
  },
}

const PRIMARY = '#0A2F73'
const GOLD = '#F4B400'
const SURFACE = '#F8FAFC'
const BORDER = '#E5EAF0'
const TEXT_SEC = '#5E6B85'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white font-sans">

      {/* Navbar */}
      <nav style={{ borderBottom: `1px solid ${BORDER}` }} className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm">
        <div className="mx-auto max-w-6xl px-6 flex items-center justify-between h-16">
          <img src="/logo.png" alt="UMKMu" style={{ height: '32px', width: 'auto' }} />
          <div className="hidden md:flex items-center gap-8 text-sm font-medium" style={{ color: TEXT_SEC }}>
            <Link href="#fitur" className="hover:text-[#0A2F73] transition-colors">Fitur</Link>
            <Link href="#testimoni" className="hover:text-[#0A2F73] transition-colors">Kisah Sukses</Link>
            <Link href="/pricing" className="hover:text-[#0A2F73] transition-colors">Harga</Link>
            <Link href="/insight" className="hover:text-[#0A2F73] transition-colors">Insight</Link>
            <Link href="/templates" className="hover:text-[#0A2F73] transition-colors">Templates</Link>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/subscribe" className="hidden sm:inline-flex text-sm font-semibold px-4 py-2 rounded-lg transition-opacity hover:opacity-90" style={{ background: GOLD, color: '#1a1a1a' }}>
              Berlangganan
            </Link>
            <Link href="/onboarding" className="text-sm font-semibold px-4 py-2 rounded-lg text-white transition-opacity hover:opacity-90" style={{ background: PRIMARY }}>
              Mulai Gratis
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-6 pt-20 pb-24">
        <div className="flex flex-col items-center text-center gap-6">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium" style={{ background: `${GOLD}22`, color: '#8B6800' }}>
            <TrendingUp size={14} />
            Platform e-commerce #1 untuk UMKM Indonesia
          </div>
          <h1 className="text-5xl md:text-6xl font-bold leading-tight tracking-tight max-w-3xl" style={{ color: PRIMARY }}>
            Toko Online Sendiri,<br />
            <span style={{ color: GOLD }}>Tanpa Ketergantungan</span><br />
            Marketplace
          </h1>
          <p className="text-lg max-w-xl leading-relaxed" style={{ color: TEXT_SEC }}>
            Bangun toko digital brand kamu dalam 60 detik. AI yang onboarding, chatbot yang jualan, notif WhatsApp otomatis — semua dalam satu platform.
          </p>
          <div className="flex flex-col sm:flex-row items-center gap-4 mt-2">
            <Link
              href="/onboarding"
              className="flex items-center gap-2 px-6 py-3 rounded-xl text-white font-semibold text-base transition-opacity hover:opacity-90"
              style={{ background: PRIMARY }}
            >
              Mulai Gratis 7 Hari <ArrowRight size={16} />
            </Link>
            <span className="text-sm" style={{ color: TEXT_SEC }}>Tanpa kartu kredit. Toko live dalam 60 detik.</span>
          </div>

          {/* Stats */}
          <div className="flex flex-wrap justify-center gap-8 mt-10 pt-10" style={{ borderTop: `1px solid ${BORDER}` }}>
            {[
              { value: '2.000+', label: 'Merchant aktif' },
              { value: 'Rp 4,2M', label: 'Rata-rata revenue/bulan' },
              { value: '60 detik', label: 'Toko live dari onboarding' },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <div className="text-2xl font-bold" style={{ color: PRIMARY }}>{s.value}</div>
                <div className="text-sm mt-1" style={{ color: TEXT_SEC }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="fitur" style={{ background: SURFACE }} className="py-20">
        <div className="mx-auto max-w-6xl px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold" style={{ color: PRIMARY }}>Semua yang Kamu Butuhkan</h2>
            <p className="mt-3 text-base" style={{ color: TEXT_SEC }}>Satu platform, semua fitur untuk jualan online</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: <ShoppingBag size={22} />,
                title: 'Toko di Subdomain Sendiri',
                desc: 'nama-brand.umkmu.site — toko kamu, data kamu, pelanggan kamu. Tidak lagi bergantung algoritma marketplace.',
              },
              {
                icon: <MessageCircle size={22} />,
                title: 'AI Chatbot Penjualan',
                desc: 'Chatbot AI merekomendasikan produk yang tepat ke customer, 24/7, tanpa kamu perlu online.',
              },
              {
                icon: <Bell size={22} />,
                title: 'Notifikasi WhatsApp Otomatis',
                desc: 'Customer dan merchant dapat notif WA real-time — pesanan baru, pembayaran, pengiriman, semua otomatis.',
              },
            ].map((f) => (
              <div key={f.title} className="bg-white rounded-2xl p-7 flex flex-col gap-4" style={{ border: `1px solid ${BORDER}` }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white" style={{ background: PRIMARY }}>
                  {f.icon}
                </div>
                <h3 className="font-semibold text-base" style={{ color: PRIMARY }}>{f.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: TEXT_SEC }}>{f.desc}</p>
              </div>
            ))}
          </div>

          {/* Secondary features */}
          <div className="grid md:grid-cols-2 gap-6 mt-6">
            {[
              { title: 'Checkout & Pembayaran QRIS', desc: 'Customer bisa checkout, bayar QRIS, dan lacak pesanan — semua di toko kamu.' },
              { title: 'Verifikasi Pembayaran via AI', desc: 'Upload bukti bayar, AI langsung verifikasi otomatis. Tidak perlu cek manual.' },
              { title: 'Manajemen Pesanan Lengkap', desc: 'Dashboard kelola pesanan, update status, kirim notif — dari satu tempat.' },
              { title: 'Onboarding via AI', desc: 'Ceritakan bisnismu, AI langsung buat toko dan isi produk. Tidak perlu coding.' },
            ].map((f) => (
              <div key={f.title} className="bg-white rounded-2xl p-6 flex gap-4" style={{ border: `1px solid ${BORDER}` }}>
                <Check size={18} className="mt-0.5 shrink-0" style={{ color: GOLD }} />
                <div>
                  <div className="font-semibold text-sm" style={{ color: PRIMARY }}>{f.title}</div>
                  <div className="text-sm mt-1" style={{ color: TEXT_SEC }}>{f.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 mx-auto max-w-6xl px-6">
        <div className="text-center mb-14">
          <h2 className="text-3xl font-bold" style={{ color: PRIMARY }}>Toko Live dalam 3 Langkah</h2>
          <p className="mt-3 text-base" style={{ color: TEXT_SEC }}>Dari cerita ke toko online — kurang dari 5 menit</p>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          {[
            { step: '01', title: 'Ceritakan bisnismu', desc: 'Ketik atau ceritakan brand, produk, dan visimu ke AI UMKMu.' },
            { step: '02', title: 'AI buat tokomu', desc: 'Dalam hitungan detik, toko dengan subdomain, produk, dan chatbot sudah siap.' },
            { step: '03', title: 'Mulai terima pesanan', desc: 'Share link toko, customer bisa langsung browse, chat, checkout, dan bayar.' },
          ].map((s) => (
            <div key={s.step} className="flex flex-col gap-4">
              <div className="text-4xl font-bold" style={{ color: `${GOLD}` }}>{s.step}</div>
              <h3 className="text-lg font-semibold" style={{ color: PRIMARY }}>{s.title}</h3>
              <p className="text-sm leading-relaxed" style={{ color: TEXT_SEC }}>{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimoni" style={{ background: SURFACE }} className="py-20">
        <div className="mx-auto max-w-6xl px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold" style={{ color: PRIMARY }}>Kisah Sukses Merchant</h2>
            <p className="mt-3 text-base" style={{ color: TEXT_SEC }}>Brand lokal yang sudah buktikan hasilnya</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                name: 'Sari Dewi',
                brand: 'Glow Skincare',
                quote: 'Sebelumnya pelanggan repeat buyer sering hilang karena tidak punya cara kontak mereka langsung. Sekarang semua data ada di tangan saya.',
                metric: '+230% repeat buyer',
              },
              {
                name: 'Budi Santoso',
                brand: 'Aroma Nusantara',
                quote: 'Toko online saya jadi dalam 3 menit. Chatbot-nya bisa jelasin produk parfum saya lebih baik dari saya sendiri.',
                metric: '3 menit toko live',
              },
              {
                name: 'Rina Maharani',
                brand: 'Batik Mahkota',
                quote: 'Notifikasi WhatsApp otomatis bikin saya tidak ketinggalan satu pun pesanan. Customer pun merasa lebih terlayani.',
                metric: '0 pesanan terlewat',
              },
            ].map((t) => (
              <div key={t.name} className="bg-white rounded-2xl p-7 flex flex-col gap-4" style={{ border: `1px solid ${BORDER}` }}>
                <div className="flex gap-1">
                  {[...Array(5)].map((_, i) => <Star key={i} size={14} fill={GOLD} style={{ color: GOLD }} />)}
                </div>
                <p className="text-sm leading-relaxed italic" style={{ color: TEXT_SEC }}>&ldquo;{t.quote}&rdquo;</p>
                <div className="mt-auto">
                  <div className="font-semibold text-sm" style={{ color: PRIMARY }}>{t.name}</div>
                  <div className="text-xs" style={{ color: TEXT_SEC }}>{t.brand}</div>
                  <div className="mt-2 text-xs font-semibold px-3 py-1 rounded-full inline-block" style={{ background: `${GOLD}22`, color: '#8B6800' }}>
                    {t.metric}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="harga" className="py-20 mx-auto max-w-6xl px-6">
        <div className="text-center mb-14">
          <h2 className="text-3xl font-bold" style={{ color: PRIMARY }}>Mulai Gratis, Bayar Sesuai Pertumbuhan</h2>
          <p className="mt-3 text-base" style={{ color: TEXT_SEC }}>7 hari trial penuh, tidak perlu kartu kredit</p>
        </div>
        <div className="grid md:grid-cols-3 gap-6 items-start">
          {[
            {
              name: 'Free Trial',
              price: 'Rp 0',
              period: '7 hari',
              desc: 'Coba semua fitur tanpa risiko',
              cta: 'Mulai Gratis',
              href: '/onboarding',
              popular: false,
              features: ['Toko di subdomain sendiri', 'AI onboarding', 'Chatbot AI (10.000 token)', 'Manajemen pesanan', 'Notifikasi WhatsApp'],
            },
            {
              name: 'Business',
              price: 'Rp 399.000',
              period: '/bulan',
              desc: 'Untuk brand yang sudah aktif berjualan',
              cta: 'Pilih Business',
              href: '/subscribe/checkout?plan=business',
              popular: true,
              features: ['Semua fitur Free', 'AI Chatbot 1.000.000 token', '1.000 pesanan/bulan', 'Verifikasi pembayaran AI', 'Analitik penjualan', 'Top-up pesanan Rp 10k/50 pesanan'],
            },
            {
              name: 'Enterprise',
              price: 'Rp 599.000',
              period: '/bulan',
              desc: 'Untuk brand dengan volume tinggi',
              cta: 'Pilih Enterprise',
              href: '/subscribe/checkout?plan=enterprise',
              popular: false,
              features: ['Semua fitur Business', 'AI Chatbot 50 juta token', 'Pesanan tidak terbatas', 'Priority support', 'Custom chatbot persona'],
            },
          ].map((p) => (
            <div
              key={p.name}
              className="rounded-2xl p-7 flex flex-col gap-5"
              style={{
                border: p.popular ? `2px solid ${PRIMARY}` : `1px solid ${BORDER}`,
                background: p.popular ? PRIMARY : 'white',
              }}
            >
              {p.popular && (
                <div className="text-xs font-bold px-3 py-1 rounded-full self-start" style={{ background: GOLD, color: '#1a1a1a' }}>
                  Terpopuler
                </div>
              )}
              <div>
                <div className="text-sm font-medium" style={{ color: p.popular ? 'rgba(255,255,255,0.7)' : TEXT_SEC }}>{p.name}</div>
                <div className="text-3xl font-bold mt-1" style={{ color: p.popular ? 'white' : PRIMARY }}>{p.price}</div>
                <div className="text-sm" style={{ color: p.popular ? 'rgba(255,255,255,0.6)' : TEXT_SEC }}>{p.period} · {p.desc}</div>
              </div>
              <div className="flex flex-col gap-3">
                {p.features.map((f) => (
                  <div key={f} className="flex items-start gap-2 text-sm">
                    <Check size={14} className="mt-0.5 shrink-0" style={{ color: p.popular ? GOLD : GOLD }} />
                    <span style={{ color: p.popular ? 'rgba(255,255,255,0.85)' : TEXT_SEC }}>{f}</span>
                  </div>
                ))}
              </div>
              <Link
                href={p.href}
                className="mt-auto flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm transition-opacity hover:opacity-90"
                style={{
                  background: p.popular ? GOLD : PRIMARY,
                  color: p.popular ? '#1a1a1a' : 'white',
                }}
              >
                {p.cta} <ChevronRight size={14} />
              </Link>
            </div>
          ))}
        </div>
        <p className="text-center text-sm mt-6" style={{ color: TEXT_SEC }}>
          Butuh lebih banyak pesanan? Top-up kapan saja — <strong>Rp 10.000 untuk 50 pesanan tambahan</strong>.{' '}
          <Link href="/pricing" className="underline font-medium" style={{ color: PRIMARY }}>Lihat perbandingan lengkap →</Link>
        </p>
      </section>

      {/* Final CTA */}
      <section className="py-20" style={{ background: PRIMARY }}>
        <div className="mx-auto max-w-3xl px-6 text-center flex flex-col items-center gap-6">
          <h2 className="text-3xl md:text-4xl font-bold text-white">
            Siap Punya Toko Online<br />
            <span style={{ color: GOLD }}>yang Benar-Benar Milikmu?</span>
          </h2>
          <p className="text-base" style={{ color: 'rgba(255,255,255,0.7)' }}>
            7 hari gratis. Toko live dalam 60 detik. Tidak ada yang perlu diinstal.
          </p>
          <Link
            href="/onboarding"
            className="flex items-center gap-2 px-8 py-4 rounded-xl font-semibold text-base transition-opacity hover:opacity-90"
            style={{ background: GOLD, color: '#1a1a1a' }}
          >
            Mulai Gratis Sekarang <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ background: '#06183D', borderTop: `1px solid rgba(255,255,255,0.08)` }} className="py-12">
        <div className="mx-auto max-w-6xl px-6">
          <div className="flex flex-col md:flex-row justify-between gap-10">
            <div className="flex flex-col gap-3 max-w-xs">
              <img src="/logo.png" alt="UMKMu" style={{ height: '32px', width: 'auto' }} className="self-start" />
              <p className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>
                Platform web & marketplace builder untuk UMKM lokal Indonesia. Tokomu, datamu, pelangganmu.
              </p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
              <div className="flex flex-col gap-3">
                <div className="text-sm font-semibold text-white">Produk</div>
                <Link href="#fitur" className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>Fitur</Link>
                <Link href="/pricing" className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>Harga</Link>
                <Link href="/onboarding" className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>Onboarding AI</Link>
              </div>
              <div className="flex flex-col gap-3">
                <div className="text-sm font-semibold text-white">Ekosistem</div>
                <Link href="/freelancer/register" className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>Jadi Template Partner</Link>
                <Link href="/templates" className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>Gallery Template</Link>
                <Link href="/insight" className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>Insight UMKM</Link>
              </div>
              <div className="flex flex-col gap-3">
                <div className="text-sm font-semibold text-white">Legal</div>
                <Link href="/privacy" className="text-sm hover:text-white transition-colors" style={{ color: 'rgba(255,255,255,0.5)' }}>Privasi</Link>
                <Link href="/terms" className="text-sm hover:text-white transition-colors" style={{ color: 'rgba(255,255,255,0.5)' }}>Syarat &amp; Ketentuan</Link>
              </div>
            </div>
          </div>
          <div className="mt-10 pt-6 text-sm" style={{ borderTop: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.4)' }}>
            © 2026 UMKMu.site · Dibuat dengan ❤️ untuk UMKM Indonesia
          </div>
        </div>
      </footer>

      <LandingChat />
    </div>
  )
}
