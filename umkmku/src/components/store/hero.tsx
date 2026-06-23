import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import type { Tenant, Product } from '@/lib/supabase/types'

interface Props {
  tenant: Tenant
  featuredProduct?: Product | null
}

export function Hero({ tenant, featuredProduct }: Props) {
  const shopUrl = `/store/${tenant.slug}/shop`

  return (
    <section className="grid grid-cols-1 md:grid-cols-12 w-full min-h-[600px] md:min-h-[720px]">
      {/* LEFT 7/12 — lifestyle / hero image */}
      <div className="md:col-span-7 relative overflow-hidden h-[400px] md:h-auto bg-[var(--color-accent)]">
        {tenant.hero_image_url ? (
          <Image
            src={tenant.hero_image_url}
            alt={tenant.brand_name}
            fill
            className="object-cover"
            priority
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-[var(--color-accent)] to-[var(--color-primary)]/60" />
        )}
        {/* Dark overlay */}
        <div className="absolute inset-0 bg-black/20" />

        {/* Text bottom-left */}
        <div className="absolute bottom-12 left-8 md:left-16 z-10 max-w-lg">
          <h1 className="text-display text-white mb-4">
            {tenant.tagline ? (
              <>
                {tenant.tagline.split(' ').slice(0, Math.ceil(tenant.tagline.split(' ').length / 2)).join(' ')}{' '}
                <br />
                <i className="font-normal italic">
                  {tenant.tagline.split(' ').slice(Math.ceil(tenant.tagline.split(' ').length / 2)).join(' ')}
                </i>
              </>
            ) : (
              <i className="font-normal italic">{tenant.brand_name}</i>
            )}
          </h1>
          {tenant.description && (
            <p className="text-white/90 text-body-md max-w-sm">{tenant.description}</p>
          )}
        </div>
      </div>

      {/* RIGHT 5/12 — featured product */}
      <div className="md:col-span-5 bg-[var(--color-secondary)] flex flex-col justify-center items-center px-8 md:px-12 py-16">
        <div className="max-w-xs w-full">
          {featuredProduct ? (
            <>
              <div className="mb-6">
                <span className="text-label-caps text-[var(--color-primary)]">
                  {featuredProduct.usage_step ?? 'PRODUK UNGGULAN'}
                </span>
                {featuredProduct.description && (
                  <p className="mt-3 text-body-md text-[var(--color-accent)]/70 leading-relaxed">
                    {featuredProduct.description}
                  </p>
                )}
              </div>
              <div className="relative aspect-[4/5] w-full mb-8 bg-white/50">
                {featuredProduct.image_url ? (
                  <Image
                    src={featuredProduct.image_url}
                    alt={featuredProduct.name}
                    fill
                    className="object-contain"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-6xl">🧴</div>
                )}
              </div>
              <div className="mb-6">
                <p className="text-headline-md italic text-[var(--color-accent)] mb-1">
                  {featuredProduct.name}
                </p>
                {featuredProduct.price && (
                  <p className="text-label-caps text-[var(--color-accent)]/60">
                    IDR {featuredProduct.price.toLocaleString('id-ID')}
                  </p>
                )}
              </div>
            </>
          ) : (
            <div className="mb-8">
              <span className="text-label-caps text-[var(--color-primary)] mb-4 block">SKINCARE ALAMI</span>
              <p className="text-body-md text-[var(--color-accent)]/70 leading-relaxed">
                {tenant.description ?? 'Produk perawatan kulit terbaik dengan bahan-bahan alami pilihan.'}
              </p>
            </div>
          )}

          <Link
            href={shopUrl}
            className="w-full py-4 border border-[var(--color-accent)]/30 bg-[var(--color-primary)] text-white text-label-caps tracking-widest flex items-center justify-center gap-4 hover:opacity-90 transition-opacity group"
          >
            BUY NOW
            <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
          </Link>

          {tenant.whatsapp_number && (
            <a
              href={`https://wa.me/${tenant.whatsapp_number.replace(/[^0-9]/g, '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 w-full py-3 border border-[var(--color-accent)]/20 text-label-caps text-[var(--color-accent)]/70 flex items-center justify-center hover:border-[var(--color-accent)] transition-colors"
            >
              Hubungi Kami
            </a>
          )}
        </div>
      </div>
    </section>
  )
}
