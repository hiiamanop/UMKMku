'use client'

import { useState } from 'react'
import { Plus, Minus } from 'lucide-react'
import type { Tenant } from '@/lib/supabase/types'

interface Props {
  tenant: Tenant
}

const PILLARS = [
  { title: 'Purity', body: 'Hanya bahan terpilih yang melewati seleksi ketat untuk memastikan keamanan dan efektivitas.' },
  { title: 'Transparency', body: 'Kami terbuka tentang setiap bahan, sumber, dan proses pembuatan produk kami.' },
  { title: 'Efficacy', body: 'Setiap produk dirancang dengan formula terbukti memberikan hasil nyata.' },
  { title: 'Sustainability', body: 'Berkomitmen pada praktik ramah lingkungan dari hulu ke hilir.' },
]

export function AboutSection({ tenant }: Props) {
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  return (
    <>
      {/* About Us — accordion */}
      <section className="bg-white py-16 md:py-20">
        <div className="max-w-[1200px] mx-auto px-4 md:px-6">
          <div className="grid md:grid-cols-2 gap-12 md:gap-20 items-start">
            {/* Left: brand info */}
            <div>
              <p className="text-label-bold text-[#8f6f73] mb-3">ABOUT US</p>
              <h2 className="text-headline-lg text-[#1a1c1c] mb-4">
                Tentang {tenant.brand_name}
              </h2>
              {tenant.description && (
                <p className="text-body-lg text-[#5b3f43] leading-relaxed mb-6">
                  {tenant.description}
                </p>
              )}
              <div className="flex gap-4 flex-wrap">
                {tenant.instagram_url && (
                  <a
                    href={tenant.instagram_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[14px] font-bold text-[#e91e63] hover:underline"
                  >
                    Instagram →
                  </a>
                )}
                {tenant.whatsapp_number && (
                  <a
                    href={`https://wa.me/${tenant.whatsapp_number.replace(/[^0-9]/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[14px] font-bold text-[#e91e63] hover:underline"
                  >
                    WhatsApp →
                  </a>
                )}
              </div>
            </div>

            {/* Right: accordion pillars */}
            <div className="divide-y divide-[#e4bdc2]">
              {PILLARS.map((pillar, i) => (
                <div key={pillar.title}>
                  <button
                    onClick={() => setOpenIndex(openIndex === i ? null : i)}
                    className="w-full flex items-center justify-between py-4 text-left"
                  >
                    <span className="text-headline-md text-[#1a1c1c]">{pillar.title}</span>
                    {openIndex === i
                      ? <Minus size={18} className="text-[#e91e63] shrink-0" />
                      : <Plus size={18} className="text-[#5b3f43] shrink-0" />
                    }
                  </button>
                  {openIndex === i && (
                    <p className="text-body-md text-[#5b3f43] pb-4 leading-relaxed">
                      {pillar.body}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Ingredients strip */}
      <section className="bg-[#1a1c1c] py-12 md:py-16">
        <div className="max-w-[1200px] mx-auto px-4 md:px-6 text-center">
          <p className="text-label-bold text-[#8f6f73] mb-3">KEY INGREDIENTS</p>
          <h2 className="text-headline-lg text-white mb-8">
            Diformulasikan dengan Bahan Terbaik
          </h2>
          <div className="flex flex-wrap justify-center gap-3">
            {['Niacinamide', 'Vitamin C', 'Retinol', 'Ceramide', 'Hyaluronic Acid', 'Bakuchiol'].map((ing) => (
              <span
                key={ing}
                className="px-4 py-2 rounded-full bg-white/10 text-white text-[12px] font-bold uppercase tracking-wide"
              >
                {ing}
              </span>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
