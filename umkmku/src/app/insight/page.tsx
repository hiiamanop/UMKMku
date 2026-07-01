import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft, Clock, ArrowRight, Tag } from 'lucide-react'
import { createServiceClient } from '@/lib/supabase/server'

export const metadata: Metadata = {
  title: 'Insight, Tips & Artikel untuk UMKM Indonesia',
  description: 'Artikel terbaru tentang peluang usaha, tren produk lokal, dan strategi bisnis untuk UMKM Indonesia.',
}

export const revalidate = 3600

const PRIMARY  = '#0A2F73'
const GOLD     = '#F4B400'
const SURFACE  = '#F8FAFC'
const BORDER   = '#E5EAF0'
const TEXT_SEC = '#5E6B85'

const CATEGORY_COLORS: Record<string, string> = {
  Branding : '#7C3AED',
  Strategi : '#0A2F73',
  Teknologi: '#0369A1',
  Marketing: '#BE185D',
  Keuangan : '#065F46',
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

function formatDate(iso: string | null) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
}

function timeAgo(iso: string | null) {
  if (!iso) return ''
  const diff   = Date.now() - new Date(iso).getTime()
  const mins   = Math.floor(diff / 60_000)
  const hours  = Math.floor(diff / 3_600_000)
  const days   = Math.floor(diff / 86_400_000)
  const weeks  = Math.floor(days / 7)
  const months = Math.floor(days / 30)
  if (mins  <  1) return 'Baru saja'
  if (mins  < 60) return `${mins} menit lalu`
  if (hours < 24) return `${hours} jam lalu`
  if (days  <  7) return `${days} hari lalu`
  if (weeks <  4) return `${weeks} minggu lalu`
  return `${months} bulan lalu`
}

export default async function InsightPage() {
  const supabase = createServiceClient()
  const { data: articles } = await supabase
    .from('articles')
    .select('id, title, slug, summary, image_url, image_position, published_at')
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .limit(7)

  const [hero, ...rest] = articles ?? []

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

      {/* Page header */}
      <div style={{ background: PRIMARY }} className="py-12">
        <div className="mx-auto max-w-6xl px-6">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold mb-4" style={{ background: `${GOLD}30`, color: GOLD }}>
            UMKMu Insight
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-white">Artikel & Tips untuk UMKM</h1>
          <p className="mt-3 text-base" style={{ color: 'rgba(255,255,255,0.65)' }}>
            Panduan praktis membangun bisnis lokal yang kuat di era digital.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-6 py-12">

        {!articles?.length ? (
          <div className="text-center py-24" style={{ color: TEXT_SEC }}>
            <div className="text-4xl mb-4">✍️</div>
            <p className="font-semibold">Belum ada artikel yang dipublikasikan.</p>
            <p className="text-sm mt-1">Cek lagi nanti, konten baru sedang disiapkan.</p>
          </div>
        ) : (
          <>
            {/* Hero Article */}
            {hero && (
              <div
                className="rounded-2xl overflow-hidden mb-12 flex flex-col md:flex-row"
                style={{ border: `1px solid ${BORDER}` }}
              >
                <div className="md:w-1/2 min-h-[240px] relative">
                  {hero.image_url ? (
                    <Image src={hero.image_url} alt={hero.title} fill className="object-cover" style={{ objectPosition: hero.image_position ?? '50% 50%' }} />
                  ) : (
                    <div
                      className="w-full h-full min-h-[240px] flex items-center justify-center"
                      style={{ background: `linear-gradient(135deg, ${PRIMARY} 0%, #1a4fa0 100%)` }}
                    >
                      <div className="text-center p-10">
                        <div className="text-6xl mb-4">📈</div>
                        <div className="text-white/60 text-sm">Artikel Utama</div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="md:w-1/2 p-8 md:p-10 flex flex-col justify-center gap-4">
                  <span className="text-xs font-semibold px-2 py-1 rounded-full self-start" style={{ background: `${GOLD}22`, color: '#8B6800' }}>
                    Artikel Terbaru
                  </span>
                  <h2 className="text-2xl font-bold leading-snug" style={{ color: PRIMARY }}>
                    {hero.title}
                  </h2>
                  {hero.summary && (
                    <p className="text-sm leading-relaxed" style={{ color: TEXT_SEC }}>
                      {hero.summary}
                    </p>
                  )}
                  <div className="flex items-center gap-4 text-xs" style={{ color: TEXT_SEC }}>
                    <span>Tim UMKMu</span>
                    <span>·</span>
                    <span>{formatDate(hero.published_at)}</span>
                    <span>·</span>
                    <span className="flex items-center gap-1"><Clock size={11} />{timeAgo(hero.published_at)}</span>
                  </div>
                  <Link
                    href={`/insight/${hero.slug}`}
                    className="inline-flex items-center gap-2 text-sm font-semibold mt-2 transition-opacity hover:opacity-75"
                    style={{ color: PRIMARY }}
                  >
                    Baca selengkapnya <ArrowRight size={14} />
                  </Link>
                </div>
              </div>
            )}

            {/* Article grid */}
            {rest.length > 0 && (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {rest.map((article) => (
                  <Link
                    key={article.id}
                    href={`/insight/${article.slug}`}
                    className="group rounded-2xl overflow-hidden flex flex-col transition-shadow hover:shadow-md"
                    style={{ border: `1px solid ${BORDER}` }}
                  >
                    <div className="h-44 relative">
                      {article.image_url ? (
                        <Image src={article.image_url} alt={article.title} fill className="object-cover" style={{ objectPosition: article.image_position ?? '50% 50%' }} />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center" style={{ background: SURFACE }}>
                          <div className="text-4xl opacity-40">📝</div>
                        </div>
                      )}
                    </div>

                    <div className="p-6 flex flex-col gap-3 flex-1">
                      <h3
                        className="font-semibold text-base leading-snug group-hover:underline"
                        style={{ color: PRIMARY }}
                      >
                        {article.title}
                      </h3>
                      {article.summary && (
                        <p className="text-sm leading-relaxed flex-1 line-clamp-2" style={{ color: TEXT_SEC }}>
                          {article.summary}
                        </p>
                      )}
                      <div className="flex items-center gap-3 text-xs pt-2" style={{ color: TEXT_SEC, borderTop: `1px solid ${BORDER}` }}>
                        <span>{formatDate(article.published_at)}</span>
                        <span>·</span>
                        <span className="flex items-center gap-1"><Clock size={10} />{timeAgo(article.published_at)}</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </>
        )}

        {/* CTA */}
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
          <Link href="/">
            <img src="/logo.png" alt="UMKMu" style={{ height: '32px', width: 'auto' }} />
          </Link>
          <p className="text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>
            © 2026 UMKMu.site
          </p>
        </div>
      </footer>

    </div>
  )
}
