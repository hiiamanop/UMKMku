import Image from 'next/image'
import Link from 'next/link'
import type { Tenant } from '@/lib/supabase/types'

interface Props {
  tenant: Tenant
}

export function ParfumHero({ tenant }: Props) {
  const { slug } = tenant

  return (
    <section
      className="relative min-h-screen flex items-end overflow-hidden"
      data-editable="hero_image_url"
      data-edit-type="image"
      data-edit-label="Foto Hero"
      data-edit-value={tenant.hero_image_url ?? ''}
    >
      {/* Background */}
      {tenant.hero_image_url ? (
        <Image
          src={tenant.hero_image_url}
          alt={tenant.brand_name}
          fill
          sizes="100vw"
          className="object-cover"
          priority
        />
      ) : (
        <div
          className="absolute inset-0"
          style={{ background: 'var(--color-primary)' }}
        />
      )}

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

      {/* Text content — bottom center */}
      <div className="relative z-10 w-full flex flex-col items-center text-center pb-20 px-6">
        <span className="tracking-[0.3em] uppercase text-xs text-white/60 mb-4">
          {tenant.category === 'parfum' ? 'FINE FRAGRANCE' : (tenant.category ?? 'FINE FRAGRANCE').toUpperCase()}
        </span>

        <h1
          className="text-5xl md:text-7xl italic font-light text-white mb-8 leading-tight max-w-3xl"
          data-editable="tagline"
          data-edit-type="text"
          data-edit-label="Tagline"
          data-edit-value={tenant.tagline ?? tenant.brand_name}
        >
          {tenant.tagline ?? tenant.brand_name}
        </h1>

        <Link
          href={`/store/${slug}/shop`}
          className="inline-flex items-center gap-2 border border-white text-white text-xs tracking-[0.25em] uppercase px-8 py-3.5 hover:bg-white hover:text-black transition-all duration-300"
        >
          DISCOVER ↗
        </Link>
      </div>
    </section>
  )
}
