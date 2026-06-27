import Image from 'next/image'
import Link from 'next/link'
import type { Tenant } from '@/lib/supabase/types'

interface Props {
  tenant: Tenant
}

export function FashionFeatureBanner({ tenant }: Props) {
  const shopUrl = `/store/${tenant.slug}/shop`

  return (
    <section className="relative w-full h-[60vh] md:h-[70vh] overflow-hidden bg-[var(--color-primary)]">
      {tenant.cta_image_url && (
        <Image
          src={tenant.cta_image_url}
          alt={`${tenant.brand_name} collection`}
          fill
          sizes="100vw"
          className="object-cover"
        />
      )}

      {/* Overlay */}
      <div className="absolute inset-0 bg-black/40" />

      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6">
        <span className="text-[10px] tracking-widest uppercase text-white/70 mb-4">
          The Edit
        </span>
        <h2 className="text-3xl md:text-5xl font-bold italic text-white mb-6 max-w-lg">
          {tenant.tagline ?? `Discover ${tenant.brand_name}`}
        </h2>
        <Link
          href={shopUrl}
          className="inline-block border border-white text-white text-[11px] tracking-widest uppercase px-8 py-3 hover:bg-white hover:text-black transition-colors duration-300"
        >
          SHOP NOW
        </Link>
      </div>
    </section>
  )
}
