'use client'

import { useState } from 'react'
import Image from 'next/image'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import type { Tenant, Testimonial } from '@/lib/supabase/types'

interface Props {
  tenant: Tenant
  testimonials: Testimonial[]
}

export function TestimonialsSection({ tenant, testimonials }: Props) {
  const [index, setIndex] = useState(0)
  const avgRating = testimonials.length
    ? (testimonials.reduce((sum, t) => sum + (t.rating ?? 5), 0) / testimonials.length).toFixed(1)
    : '5.0'

  if (testimonials.length === 0) {
    return (
      <section className="py-20 md:py-28 px-6 md:px-16 bg-[var(--color-primary)]">
        <div className="max-w-[1280px] mx-auto">
          <span className="text-label-caps text-white/60 bg-white/10 px-3 py-1 mb-6 inline-block">TESTIMONIALS</span>
          <p className="text-white/40 text-body-md mt-4">Testimoni akan muncul di sini.</p>
        </div>
      </section>
    )
  }

  const current = testimonials[index]
  const total = testimonials.length

  const prev = () => setIndex((i) => (i - 1 + total) % total)
  const next = () => setIndex((i) => (i + 1) % total)

  return (
    <section className="py-20 md:py-28 px-6 md:px-16 bg-[var(--color-primary)]">
      <div className="max-w-[1280px] mx-auto">
        {/* Header */}
        <div className="mb-14">
          <span className="text-label-caps text-white/60 bg-white/10 px-3 py-1 mb-6 inline-block">
            TESTIMONIALS
          </span>
          <h2 className="text-headline-lg text-white max-w-2xl">
            Hasil <i className="italic">nyata</i>, cerita nyata. Lihat bagaimana kulit pelanggan{' '}
            <i className="italic">kami</i> berubah dengan produk <i className="italic">{tenant.brand_name}</i>.
          </h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Left: staggered photos */}
          <div
            key={current.id}
            className="relative grid grid-cols-12 gap-4 h-[380px] transition-opacity duration-500"
          >
            <div className="col-span-4 self-end h-[70%] overflow-hidden relative">
              {current.image_1_url ? (
                <Image src={current.image_1_url} alt={current.author_name} fill sizes="25vw" className="object-cover" />
              ) : (
                <div className="w-full h-full bg-white/10" />
              )}
            </div>
            <div className="col-span-8 h-full overflow-hidden relative">
              {current.image_2_url ? (
                <Image src={current.image_2_url} alt={current.author_name} fill sizes="40vw" className="object-cover" />
              ) : (
                <div className="w-full h-full bg-white/20" />
              )}
            </div>
          </div>

          {/* Right: quote */}
          <div key={`quote-${current.id}`}>
            <div className="mb-8">
              <div className="text-white/30 text-6xl leading-none mb-4">"</div>
              <p className="text-headline-md italic text-white leading-relaxed mb-6 transition-opacity duration-500">
                {current.quote}
              </p>
              <div className="flex items-center gap-2 mb-3">
                {Array.from({ length: 5 }, (_, i) => (
                  <span key={i} className={`text-lg ${i < (current.rating ?? 5) ? 'text-white' : 'text-white/20'}`}>★</span>
                ))}
              </div>
              <p className="text-label-caps text-white/60">
                {current.author_name}
                {current.author_title && `, ${current.author_title}`}
              </p>
            </div>

            <div className="flex items-center gap-8 pt-8 border-t border-white/20 mb-10">
              <div>
                <p className="text-label-caps text-[10px] text-white/40 mb-2">Kepuasan Pelanggan</p>
                <div className="flex items-baseline gap-3">
                  <span className="text-headline-md text-white text-3xl">{avgRating}</span>
                  <span className="text-white/40 text-lg">/ 5</span>
                </div>
              </div>
              <div className="text-label-caps text-[10px] text-white/30">
                {index + 1} / {total}
              </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={prev}
                aria-label="Previous"
                className="w-12 h-12 border border-white/30 flex items-center justify-center text-white hover:bg-white hover:text-[var(--color-primary)] transition-colors"
              >
                <ArrowLeft size={16} />
              </button>
              <button
                onClick={next}
                aria-label="Next"
                className="w-12 h-12 border border-white/30 flex items-center justify-center text-white hover:bg-white hover:text-[var(--color-primary)] transition-colors"
              >
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
