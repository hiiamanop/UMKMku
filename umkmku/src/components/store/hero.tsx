import Image from 'next/image'
import type { Tenant, Product } from '@/lib/supabase/types'
import { HeroProductCarousel } from './hero-product-carousel'

interface Props {
  tenant: Tenant
  products: Product[]
}

export function Hero({ tenant, products }: Props) {
  return (
    <section className="grid grid-cols-1 md:grid-cols-12 w-full min-h-[600px] md:min-h-[720px]">
      {/* LEFT 7/12 — lifestyle / hero image */}
      <div
        className="md:col-span-7 relative overflow-hidden h-[400px] md:h-auto bg-[var(--color-accent)]"
        data-editable="hero_image_url"
        data-edit-type="image"
        data-edit-label="Foto Hero"
        data-edit-value={tenant.hero_image_url ?? ''}
      >
        {tenant.hero_image_url ? (
          <Image
            src={tenant.hero_image_url}
            alt={tenant.brand_name}
            fill
            sizes="(max-width: 768px) 100vw, 58vw"
            className="object-cover"
            priority
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-[var(--color-accent)] to-[var(--color-primary)]/60" />
        )}
        <div className="absolute inset-0 bg-black/20" />

        {/* Text bottom-left */}
        <div className="absolute bottom-12 left-8 md:left-16 z-10 max-w-lg">
          <h1 className="text-display text-white mb-4">
            <span
              data-editable="tagline"
              data-edit-type="text"
              data-edit-label="Tagline"
              data-edit-value={tenant.tagline ?? ''}
            >
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
            </span>
          </h1>
          {tenant.description && (
            <p
              className="text-white/90 text-body-md max-w-sm"
              data-editable="description"
              data-edit-type="textarea"
              data-edit-label="Deskripsi"
              data-edit-value={tenant.description}
            >
              {tenant.description}
            </p>
          )}
        </div>
      </div>

      {/* RIGHT 5/12 — product carousel */}
      <div className="md:col-span-5 bg-[var(--color-secondary)] flex flex-col justify-center items-center px-8 md:px-12 py-16">
        {products.length > 0 ? (
          <HeroProductCarousel products={products} slug={tenant.slug} />
        ) : (
          <div className="max-w-xs w-full">
            <span className="text-label-caps text-[var(--color-primary)] mb-4 block">SKINCARE ALAMI</span>
            <p className="text-body-md text-[var(--color-accent)]/70 leading-relaxed">
              {tenant.description ?? 'Produk perawatan kulit terbaik dengan bahan-bahan alami pilihan.'}
            </p>
          </div>
        )}
      </div>
    </section>
  )
}
