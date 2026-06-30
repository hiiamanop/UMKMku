import Image from 'next/image'
import Link from 'next/link'
import type { Tenant } from '@/lib/supabase/types'

interface Props {
  tenant: Tenant
}

export function FashionHero({ tenant }: Props) {
  const shopUrl = `/store/${tenant.slug}/shop`

  return (
    <section
      className="relative w-full min-h-[90vh] overflow-hidden bg-[var(--color-primary)]"
      data-editable="hero_image_url"
      data-edit-type="image"
      data-edit-label="Foto Hero"
      data-edit-value={tenant.hero_image_url ?? ''}
    >
      {/* Background image */}
      {tenant.hero_image_url && (
        <Image
          src={tenant.hero_image_url}
          alt={tenant.brand_name}
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
      )}

      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/30" />

      {/* Text — bottom-left */}
      <div className="absolute bottom-12 left-8 md:left-16 max-w-xl">
        <span className="inline-block text-[10px] tracking-widest uppercase text-white/80 border border-white/40 px-3 py-1 mb-5">
          NEW SEASON
        </span>

        <h1
          className="text-6xl md:text-8xl font-bold italic text-white leading-none mb-4"
          data-editable="brand_name"
          data-edit-type="text"
          data-edit-label="Nama Brand"
          data-edit-value={tenant.brand_name}
        >
          {tenant.brand_name}
        </h1>

        {tenant.tagline && (
          <p
            className="text-white/80 text-base md:text-lg mb-8 max-w-sm leading-relaxed"
            data-editable="tagline"
            data-edit-type="text"
            data-edit-label="Tagline"
            data-edit-value={tenant.tagline}
          >
            {tenant.tagline}
          </p>
        )}

        <Link
          href={shopUrl}
          className="inline-block bg-white text-black text-[11px] tracking-widest uppercase px-8 py-3 font-medium hover:bg-[var(--color-primary)] hover:text-white transition-colors duration-300"
        >
          EXPLORE COLLECTION
        </Link>
      </div>
    </section>
  )
}
