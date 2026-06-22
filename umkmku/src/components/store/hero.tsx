import Image from 'next/image'
import { ArrowRight } from 'lucide-react'
import type { Tenant } from '@/lib/supabase/types'

interface Props {
  tenant: Tenant
}

export function Hero({ tenant }: Props) {
  return (
    <section className="relative min-h-[80vh] flex items-center bg-[#f9f9f9] overflow-hidden">
      {/* Background image */}
      {tenant.hero_image_url && (
        <Image
          src={tenant.hero_image_url}
          alt={`${tenant.brand_name} hero`}
          fill
          className="object-cover opacity-15"
          priority
        />
      )}

      {/* Decorative soft gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#f9f9f9] via-[#f9f9f9]/80 to-transparent" />

      <div className="relative z-10 max-w-[1200px] mx-auto px-4 md:px-6 py-20 w-full">
        <div className="max-w-xl">
          {/* Brand label */}
          <p className="text-label-bold text-[#8f6f73] mb-4 tracking-widest">
            {tenant.brand_name}
          </p>

          {/* Main headline */}
          <h1 className="text-display text-[#1a1c1c] mb-6">
            {tenant.tagline ?? tenant.brand_name}
          </h1>

          {/* Description */}
          {tenant.description && (
            <p className="text-body-lg text-[#5b3f43] mb-10 leading-relaxed max-w-md">
              {tenant.description}
            </p>
          )}

          {/* CTAs */}
          <div className="flex flex-wrap gap-3">
            <a
              href="#products"
              className="inline-flex items-center gap-2 px-8 py-4 bg-[#e91e63] text-white rounded-lg font-bold text-[14px] uppercase tracking-wide hover:bg-[#b80049] transition-colors"
            >
              BUY NOW
              <ArrowRight size={16} />
            </a>
            {tenant.whatsapp_number && (
              <a
                href={`https://wa.me/${tenant.whatsapp_number.replace(/[^0-9]/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-8 py-4 border border-[#e2e2e2] text-[#1a1c1c] rounded-lg font-bold text-[14px] uppercase tracking-wide hover:border-[#1a1c1c] transition-colors"
              >
                Hubungi Kami
              </a>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
