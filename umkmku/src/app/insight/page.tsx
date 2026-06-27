import Link from 'next/link'
import { ArrowLeft, Clock, ArrowRight, Tag } from 'lucide-react'

const PRIMARY = '#0A2F73'
const GOLD = '#F4B400'
const SURFACE = '#F8FAFC'
const BORDER = '#E5EAF0'
const TEXT_SEC = '#5E6B85'

// ponytail: static data — ganti dengan DB query saat article generator selesai
const HERO_ARTICLE = {
  slug: 'cara-membangun-brand-lokal-yang-kuat',
  category: 'Branding',
  title: 'Cara Membangun Brand Lokal yang Kuat di Era Digital',
  excerpt: 'Banyak UMKM gagal bukan karena produknya jelek, tapi karena tidak punya identitas brand yang jelas. Pelajari 5 langkah membangun brand yang diingat pelanggan — bahkan tanpa budget besar.',
  author: 'Tim UMKMku',
  date: '25 Juni 2026',
  readTime: '7 menit',
  image: null,
}

const ARTICLES = [
  {
    slug: 'kenapa-umkm-harus-punya-toko-sendiri',
    category: 'Strategi',
    title: 'Kenapa UMKM Harus Punya Toko Online Sendiri, Bukan Cuma Jualan di Marketplace',
    excerpt: 'Marketplace memberimu pembeli, tapi tidak memberimu pelanggan. Ini perbedaan paling krusial yang sering diabaikan.',
    author: 'Tim UMKMku',
    date: '24 Juni 2026',
    readTime: '5 menit',
  },
  {
    slug: 'ai-chatbot-untuk-jualan-online',
    category: 'Teknologi',
    title: 'AI Chatbot Bisa Jualan 24 Jam — Ini Cara Kerjanya untuk UMKM',
    excerpt: 'Customer datang jam 2 pagi, tidak ada yang bisa jawab. AI chatbot bisa. Pelajari bagaimana teknologi ini membantu UMKM meningkatkan konversi.',
    author: 'Tim UMKMku',
    date: '23 Juni 2026',
    readTime: '6 menit',
  },
  {
    slug: 'tips-foto-produk-dengan-hp',
    category: 'Marketing',
    title: '7 Tips Foto Produk yang Menarik Hanya dengan HP — Tanpa Studio',
    excerpt: 'Foto produk jelek sama dengan kehilangan 60% calon pembeli. Padahal dengan teknik yang tepat, HP biasa bisa hasilkan foto sekualitas studio.',
    author: 'Tim UMKMku',
    date: '22 Juni 2026',
    readTime: '4 menit',
  },
  {
    slug: 'cara-menghitung-harga-jual-produk',
    category: 'Keuangan',
    title: 'Cara Menghitung Harga Jual yang Menguntungkan — Bukan Sekadar Modal + Untung',
    excerpt: 'Banyak UMKM yang rajin jualan tapi tidak pernah untung. Kesalahannya ada di cara menghitung harga. Ini formula yang benar.',
    author: 'Tim UMKMku',
    date: '21 Juni 2026',
    readTime: '8 menit',
  },
  {
    slug: 'strategi-repeat-buyer-umkm',
    category: 'Strategi',
    title: 'Mengubah Pembeli Pertama Jadi Pelanggan Setia: Strategi Repeat Buyer untuk UMKM',
    excerpt: 'Biaya mendapatkan pelanggan baru 5x lebih mahal dari mempertahankan yang lama. Ini cara praktisnya.',
    author: 'Tim UMKMku',
    date: '20 Juni 2026',
    readTime: '6 menit',
  },
  {
    slug: 'whatsapp-untuk-bisnis-umkm',
    category: 'Marketing',
    title: 'WhatsApp sebagai Senjata Penjualan UMKM: Lebih dari Sekadar Chat',
    excerpt: 'WhatsApp bukan hanya alat komunikasi — ini bisa jadi mesin penjualan otomatis jika kamu tahu caranya.',
    author: 'Tim UMKMku',
    date: '19 Juni 2026',
    readTime: '5 menit',
  },
]

const CATEGORIES = ['Semua', 'Branding', 'Strategi', 'Teknologi', 'Marketing', 'Keuangan']

const CATEGORY_COLORS: Record<string, string> = {
  Branding: '#7C3AED',
  Strategi: '#0A2F73',
  Teknologi: '#0369A1',
  Marketing: '#BE185D',
  Keuangan: '#065F46',
}

function CategoryBadge({ category }: { category: string }) {
  const color = CATEGORY_COLORS[category] ?? PRIMARY
  return (
    <span
      className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full"
      style={{ background: `${color}18`, color }}
    >
      <Tag size={10} />
      {category}
    </span>
  )
}

export default function InsightPage() {
  return (
    <div className="min-h-screen bg-white font-sans">

      {/* Navbar */}
      <nav style={{ borderBottom: `1px solid ${BORDER}` }} className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm">
        <div className="mx-auto max-w-6xl px-6 flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2 text-sm font-medium" style={{ color: TEXT_SEC }}>
            <ArrowLeft size={14} />
            Kembali
          </Link>
          <Link href="/" className="text-xl font-bold" style={{ color: PRIMARY }}>
            UMKM<span style={{ color: GOLD }}>ku</span>
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

      {/* Page header */}
      <div style={{ background: PRIMARY }} className="py-12">
        <div className="mx-auto max-w-6xl px-6">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold mb-4" style={{ background: `${GOLD}30`, color: GOLD }}>
            UMKMku Insight
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-white">Artikel & Tips untuk UMKM</h1>
          <p className="mt-3 text-base" style={{ color: 'rgba(255,255,255,0.65)' }}>
            Panduan praktis membangun bisnis lokal yang kuat di era digital.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-6 py-12">

        {/* Hero Article */}
        <div
          className="rounded-2xl overflow-hidden mb-12 flex flex-col md:flex-row"
          style={{ border: `1px solid ${BORDER}` }}
        >
          {/* Image placeholder */}
          <div
            className="md:w-1/2 min-h-[240px] flex items-center justify-center"
            style={{ background: `linear-gradient(135deg, ${PRIMARY} 0%, #1a4fa0 100%)` }}
          >
            <div className="text-center p-10">
              <div className="text-6xl mb-4">📈</div>
              <div className="text-white/60 text-sm">Artikel Utama</div>
            </div>
          </div>

          {/* Content */}
          <div className="md:w-1/2 p-8 md:p-10 flex flex-col justify-center gap-4">
            <div className="flex items-center gap-3">
              <CategoryBadge category={HERO_ARTICLE.category} />
              <span className="text-xs font-semibold px-2 py-1 rounded-full" style={{ background: `${GOLD}22`, color: '#8B6800' }}>
                Artikel Utama
              </span>
            </div>
            <h2 className="text-2xl font-bold leading-snug" style={{ color: PRIMARY }}>
              {HERO_ARTICLE.title}
            </h2>
            <p className="text-sm leading-relaxed" style={{ color: TEXT_SEC }}>
              {HERO_ARTICLE.excerpt}
            </p>
            <div className="flex items-center gap-4 text-xs" style={{ color: TEXT_SEC }}>
              <span>{HERO_ARTICLE.author}</span>
              <span>·</span>
              <span>{HERO_ARTICLE.date}</span>
              <span>·</span>
              <span className="flex items-center gap-1"><Clock size={11} />{HERO_ARTICLE.readTime}</span>
            </div>
            <Link
              href={`/insight/${HERO_ARTICLE.slug}`}
              className="inline-flex items-center gap-2 text-sm font-semibold mt-2 transition-opacity hover:opacity-75"
              style={{ color: PRIMARY }}
            >
              Baca selengkapnya <ArrowRight size={14} />
            </Link>
          </div>
        </div>

        {/* Category filter */}
        <div className="flex flex-wrap gap-2 mb-8">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              className="px-4 py-2 rounded-full text-sm font-medium transition-colors border"
              style={cat === 'Semua'
                ? { background: PRIMARY, color: 'white', borderColor: PRIMARY }
                : { background: 'white', color: TEXT_SEC, borderColor: BORDER }}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Article grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {ARTICLES.map((article) => (
            <Link
              key={article.slug}
              href={`/insight/${article.slug}`}
              className="group rounded-2xl overflow-hidden flex flex-col transition-shadow hover:shadow-md"
              style={{ border: `1px solid ${BORDER}` }}
            >
              {/* Image placeholder */}
              <div
                className="h-44 flex items-center justify-center"
                style={{ background: SURFACE }}
              >
                <div className="text-4xl opacity-40">
                  {article.category === 'Teknologi' ? '🤖' :
                   article.category === 'Marketing' ? '📣' :
                   article.category === 'Keuangan' ? '💰' :
                   article.category === 'Branding' ? '✨' : '📊'}
                </div>
              </div>

              {/* Content */}
              <div className="p-6 flex flex-col gap-3 flex-1">
                <CategoryBadge category={article.category} />
                <h3
                  className="font-semibold text-base leading-snug group-hover:underline"
                  style={{ color: PRIMARY }}
                >
                  {article.title}
                </h3>
                <p className="text-sm leading-relaxed flex-1" style={{ color: TEXT_SEC }}>
                  {article.excerpt}
                </p>
                <div className="flex items-center gap-3 text-xs pt-2" style={{ color: TEXT_SEC, borderTop: `1px solid ${BORDER}` }}>
                  <span>{article.date}</span>
                  <span>·</span>
                  <span className="flex items-center gap-1"><Clock size={10} />{article.readTime}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Coming soon CTA */}
        <div
          className="mt-12 rounded-2xl p-8 text-center flex flex-col items-center gap-4"
          style={{ background: SURFACE, border: `1px solid ${BORDER}` }}
        >
          <div className="text-2xl">✍️</div>
          <h3 className="font-bold text-base" style={{ color: PRIMARY }}>Artikel baru setiap minggu</h3>
          <p className="text-sm max-w-sm" style={{ color: TEXT_SEC }}>
            Kami sedang menyiapkan lebih banyak panduan praktis untuk membantu UMKM berkembang.
          </p>
          <Link
            href="/onboarding"
            className="px-6 py-3 rounded-xl text-sm font-semibold text-white"
            style={{ background: PRIMARY }}
          >
            Mulai Toko Gratis Dulu →
          </Link>
        </div>

      </div>

      {/* Footer minimal */}
      <footer style={{ background: '#06183D' }} className="py-8 mt-12">
        <div className="mx-auto max-w-6xl px-6 flex items-center justify-between">
          <Link href="/" className="text-lg font-bold text-white">
            UMKM<span style={{ color: GOLD }}>ku</span>
          </Link>
          <p className="text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>
            © 2025 UMKMku.com
          </p>
        </div>
      </footer>

    </div>
  )
}
