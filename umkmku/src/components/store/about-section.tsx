'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Plus, Minus } from 'lucide-react'
import type { Tenant, PageItem } from '@/lib/supabase/types'

interface Props {
  tenant: Tenant
}

const DEFAULT_HEADING = 'Jelajahi produk perawatan kulit alami kami yang dirancang untuk menutrisi dan meremajakan kulit Anda.'

const DEFAULT_PILLARS: PageItem[] = [
  { title: 'Bahan Eco-Conscious', body: 'Kami memilih bahan-bahan alami yang dipanen secara berkelanjutan untuk melindungi bumi.' },
  { title: 'Cruelty-Free & Vegan', body: 'Semua produk bebas dari uji coba hewan dan tidak mengandung bahan turunan hewani.' },
  { title: 'Aman untuk Semua Kulit', body: 'Diformulasikan lembut, cocok untuk semua jenis kulit termasuk kulit sensitif.' },
  { title: 'Kemasan Berkelanjutan', body: 'Kemasan kami dirancang untuk meminimalkan dampak lingkungan dan dapat didaur ulang.' },
]

export function AboutSection({ tenant }: Props) {
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  const heading = tenant.page_about_story ?? DEFAULT_HEADING
  const pillars = (tenant.page_commitments as PageItem[] | null) ?? DEFAULT_PILLARS
  const total = pillars.length

  return (
    <section className="py-20 md:py-28 px-6 md:px-16 bg-[var(--color-secondary)]">
      <div className="max-w-[1280px] mx-auto">
        {/* Top row */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center mb-16">
          <div className="md:col-span-5">
            <span className="text-label-caps text-[var(--color-primary)] bg-[var(--color-primary)]/10 px-3 py-1 mb-6 inline-block">
              ABOUT US
            </span>
            <h2
              className="text-headline-lg leading-snug"
              data-editable="page_about_story"
              data-edit-type="textarea"
              data-edit-label="About, Teks Heading"
              data-edit-value={heading}
            >
              {heading}
            </h2>
          </div>
        </div>

        {/* Bottom: accordion left + image grid right */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 md:gap-24 items-start">
          {/* Accordion */}
          <div className="border-t border-black/10">
            {pillars.map((pillar, i) => (
              <div
                key={i}
                className={`py-7 border-b border-black/10 ${openIndex !== i ? 'text-black/30' : ''}`}
              >
                <div className="w-full flex justify-between items-center">
                  <div
                    className="flex items-baseline gap-5 text-left flex-1 cursor-pointer"
                    onClick={() => setOpenIndex(openIndex === i ? null : i)}
                  >
                    <span className="text-label-caps text-[10px] opacity-60">
                      {String(i + 1).padStart(2, '0')} / {String(total).padStart(2, '0')}
                    </span>
                    <h3
                      className="text-headline-md"
                      data-editable={`page_commitments[${i}].title`}
                      data-edit-type="text"
                      data-edit-label={`Pillar ${i + 1}, Judul`}
                      data-edit-value={pillar.title}
                    >
                      {pillar.title}
                    </h3>
                  </div>
                  <button
                    onClick={() => setOpenIndex(openIndex === i ? null : i)}
                    className="shrink-0 p-1"
                    aria-label={openIndex === i ? 'Tutup' : 'Buka'}
                  >
                    {openIndex === i
                      ? <Minus size={18} className="text-[var(--color-accent)]" />
                      : <Plus size={18} />
                    }
                  </button>
                </div>
                {openIndex === i && (
                  <p
                    className="text-body-md text-[var(--color-accent)]/70 mt-4 ml-[calc(10px+1.25rem)] max-w-sm leading-relaxed"
                    data-editable={`page_commitments[${i}].body`}
                    data-edit-type="textarea"
                    data-edit-label={`Pillar ${i + 1}, Deskripsi`}
                    data-edit-value={pillar.body}
                  >
                    {pillar.body}
                  </p>
                )}
              </div>
            ))}
          </div>

          {/* Staggered 2-col image grid */}
          <div className="grid grid-cols-2 gap-4">
            <div
              className="aspect-[3/4] overflow-hidden relative"
              data-editable="about_image_1_url"
              data-edit-type="image"
              data-edit-label="About, Foto Kiri"
              data-edit-value={tenant.about_image_1_url ?? ''}
            >
              {tenant.about_image_1_url ? (
                <Image src={tenant.about_image_1_url} alt="About 1" fill sizes="(max-width: 1024px) 50vw, 25vw" className="object-cover" />
              ) : (
                <div className="w-full h-full" style={{ background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-secondary) 100%)' }} />
              )}
            </div>
            <div
              className="aspect-[3/4] overflow-hidden mt-12 relative"
              data-editable="about_image_2_url"
              data-edit-type="image"
              data-edit-label="About, Foto Kanan"
              data-edit-value={tenant.about_image_2_url ?? ''}
            >
              {tenant.about_image_2_url ? (
                <Image src={tenant.about_image_2_url} alt="About 2" fill sizes="(max-width: 1024px) 50vw, 25vw" className="object-cover" />
              ) : (
                <div className="w-full h-full" style={{ background: 'linear-gradient(135deg, var(--color-accent) 0%, var(--color-secondary) 100%)' }} />
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
