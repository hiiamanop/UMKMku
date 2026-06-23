'use client'

import { useState } from 'react'
import { Plus, Minus } from 'lucide-react'
import type { Tenant } from '@/lib/supabase/types'

interface Props {
  tenant: Tenant
}

const PILLARS = [
  { num: '01', title: 'Bahan Eco-Conscious', body: 'Kami memilih bahan-bahan alami yang dipanen secara berkelanjutan untuk melindungi bumi.' },
  { num: '02', title: 'Cruelty-Free & Vegan', body: 'Semua produk bebas dari uji coba hewan dan tidak mengandung bahan turunan hewani.' },
  { num: '03', title: 'Aman untuk Semua Kulit', body: 'Diformulasikan lembut, cocok untuk semua jenis kulit termasuk kulit sensitif.' },
  { num: '04', title: 'Kemasan Berkelanjutan', body: 'Kemasan kami dirancang untuk meminimalkan dampak lingkungan dan dapat didaur ulang.' },
]

export function AboutSection({ tenant }: Props) {
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  return (
    <section className="py-20 md:py-28 px-6 md:px-16 bg-[var(--color-secondary)]">
      <div className="max-w-[1280px] mx-auto">
        {/* Top row: 5-col label+heading */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center mb-16">
          <div className="md:col-span-5">
            <span className="text-label-caps text-[var(--color-primary)] bg-[var(--color-primary)]/10 px-3 py-1 mb-6 inline-block">
              ABOUT US
            </span>
            <h2 className="text-headline-lg leading-snug">
              Jelajahi produk{' '}
              <i className="italic">perawatan kulit alami</i>{' '}
              kami yang dirancang untuk menutrisi dan meremajakan kulit{' '}
              <i className="italic">Anda</i>.
            </h2>
          </div>
        </div>

        {/* Bottom: accordion left + image grid right */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 md:gap-24 items-start">
          {/* Accordion */}
          <div className="border-t border-black/10">
            {PILLARS.map((pillar, i) => (
              <div
                key={pillar.num}
                className={`py-7 border-b border-black/10 ${openIndex !== i ? 'text-black/30' : ''}`}
              >
                <button
                  onClick={() => setOpenIndex(openIndex === i ? null : i)}
                  className="w-full flex justify-between items-center cursor-pointer"
                >
                  <div className="flex items-baseline gap-5 text-left">
                    <span className="text-label-caps text-[10px] opacity-60">{pillar.num} / 04</span>
                    <h3 className="text-headline-md">{pillar.title}</h3>
                  </div>
                  {openIndex === i
                    ? <Minus size={18} className="shrink-0 text-[var(--color-accent)]" />
                    : <Plus size={18} className="shrink-0" />
                  }
                </button>
                {openIndex === i && (
                  <p className="text-body-md text-[var(--color-accent)]/70 mt-4 ml-[calc(10px+1.25rem)] max-w-sm leading-relaxed">
                    {pillar.body}
                  </p>
                )}
              </div>
            ))}
          </div>

          {/* Staggered 2-col image grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="aspect-[3/4] overflow-hidden">
              <div className="w-full h-full bg-[var(--color-primary)]/20" style={{ backgroundImage: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-secondary) 100%)' }} />
            </div>
            <div className="aspect-[3/4] overflow-hidden mt-12 bg-[var(--color-accent)]/30">
              <div className="w-full h-full" style={{ backgroundImage: 'linear-gradient(135deg, var(--color-accent) 0%, var(--color-secondary) 100%)' }} />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
