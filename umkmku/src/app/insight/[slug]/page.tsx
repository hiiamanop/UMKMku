import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { createServiceClient } from '@/lib/supabase/server'
import { Calendar, ArrowLeft } from 'lucide-react'

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const supabase = createServiceClient()
  const { data } = await supabase
    .from('articles')
    .select('title, summary, image_url')
    .eq('slug', slug)
    .eq('status', 'published')
    .single()

  if (!data) return { title: 'Artikel tidak ditemukan' }

  return {
    title: data.title,
    description: data.summary ?? undefined,
    openGraph: {
      title: data.title,
      description: data.summary ?? undefined,
      type: 'article',
      ...(data.image_url ? { images: [{ url: data.image_url, width: 1200, height: 630 }] } : {}),
    },
  }
}

export const revalidate = 3600

export default async function ArticlePage({ params }: Props) {
  const { slug } = await params
  const supabase = createServiceClient()
  const { data: article } = await supabase
    .from('articles')
    .select('*')
    .eq('slug', slug)
    .eq('status', 'published')
    .single()

  if (!article) notFound()

  return (
    <main className="min-h-screen bg-[#F8FAFC]">
      {/* Top nav */}
      <div className="bg-white border-b border-[#E5EAF0] sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/insight" className="flex items-center gap-2 text-sm text-[#5E6B85] hover:text-[#0A2F73] transition-colors">
            <ArrowLeft size={14} /> Semua artikel
          </Link>
          <Link href="/">
            <img src="/logo.png" alt="UMKMu" className="h-7 w-auto" />
          </Link>
        </div>
      </div>

      {/* Hero image */}
      {article.image_url && (
        <div className="relative w-full h-64 md:h-96 bg-[#E5EAF0]">
          <Image
            src={article.image_url}
            alt={article.title}
            fill
            className="object-cover"
            style={{ objectPosition: article.image_position ?? '50% 50%' }}
            priority
          />
        </div>
      )}

      {/* Article */}
      <article className="max-w-3xl mx-auto px-6 py-10">
        <div className="flex items-center gap-2 text-xs text-[#9AACBF] mb-4">
          <Calendar size={12} />
          {article.published_at
            ? new Date(article.published_at).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
            : ''}
        </div>

        <h1 className="text-2xl md:text-3xl font-bold text-[#0A2F73] leading-tight mb-4">
          {article.title}
        </h1>

        {article.summary && (
          <p className="text-lg text-[#5E6B85] border-l-4 border-[#0A2F73] pl-4 mb-8 leading-relaxed">
            {article.summary}
          </p>
        )}

        <div
          className="prose prose-slate max-w-none text-justify
            prose-headings:text-[#0A2F73] prose-headings:font-semibold prose-headings:text-left
            prose-h2:text-xl prose-h2:mt-8 prose-h2:mb-3
            prose-p:text-[#374151] prose-p:leading-relaxed prose-p:mb-4
            prose-li:text-[#374151] prose-li:mb-1
            prose-ul:my-4 prose-ul:pl-6
            prose-strong:text-[#0A2F73]
            prose-a:text-[#0A2F73] prose-a:underline"
          dangerouslySetInnerHTML={{ __html: article.content }}
        />
      </article>

      {/* CTA */}
      <div className="border-t border-[#E5EAF0] bg-white mt-4">
        <div className="max-w-3xl mx-auto px-6 py-10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <p className="font-semibold text-[#0A2F73]">Siap punya toko online sendiri?</p>
            <p className="text-sm text-[#5E6B85]">Gratis 7 hari, toko live dalam 60 detik.</p>
          </div>
          <Link
            href="/"
            className="px-6 py-3 rounded-xl bg-[#0A2F73] text-white text-sm font-semibold hover:opacity-90 transition-opacity whitespace-nowrap"
          >
            Mulai Gratis →
          </Link>
        </div>
      </div>
    </main>
  )
}
