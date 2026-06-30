import Link from 'next/link'
import Image from 'next/image'
import type { Tenant } from '@/lib/supabase/types'

interface Props { tenant: Tenant }

export function FnbHero({ tenant }: Props) {
  const base = `/store/${tenant.slug}`

  return (
    <section className="relative bg-[var(--color-secondary)] overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Text */}
          <div className="flex flex-col gap-6">
            <div className="inline-flex items-center gap-2 bg-[var(--color-primary)]/10 text-[var(--color-primary)] text-xs font-semibold px-3 py-1.5 rounded-full w-fit">
              🚚 Fast Delivery Available
            </div>
            <h1
              className="text-4xl md:text-5xl lg:text-6xl font-black leading-tight text-gray-900"
              data-editable="tagline"
              data-edit-type="text"
              data-edit-label="Tagline"
              data-edit-value={tenant.tagline ?? 'Fresh, Delicious & Delivered To Your Door!'}
            >
              {tenant.tagline ?? 'Fresh, Delicious & Delivered To Your Door!'}
            </h1>
            <p
              className="text-gray-600 text-lg max-w-md"
              data-editable="description"
              data-edit-type="textarea"
              data-edit-label="Deskripsi"
              data-edit-value={tenant.description ?? 'Discover the finest selection of fresh produce, artisan foods, and ready-to-eat meals — delivered fast to your doorstep.'}
            >
              {tenant.description ?? 'Discover the finest selection of fresh produce, artisan foods, and ready-to-eat meals — delivered fast to your doorstep.'}
            </p>
            <div className="flex flex-wrap gap-4">
              <Link
                href={`${base}/shop`}
                className="px-6 py-3 rounded-full bg-[var(--color-primary)] text-white font-bold text-sm hover:opacity-90 transition-opacity shadow-lg shadow-[var(--color-primary)]/30"
              >
                SHOP NOW
              </Link>
              <Link
                href={`${base}/shop`}
                className="px-6 py-3 rounded-full border-2 border-[var(--color-primary)] text-[var(--color-primary)] font-bold text-sm hover:bg-[var(--color-primary)]/5 transition-colors"
              >
                EXPLORE MENU
              </Link>
            </div>
            {/* Trust metric */}
            <div className="flex items-center gap-3 mt-2">
              <div className="flex -space-x-2">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="w-8 h-8 rounded-full bg-[var(--color-accent)] border-2 border-white" />
                ))}
              </div>
              <p className="text-sm text-gray-600">
                <span className="font-bold text-gray-900">Trusted by thousands</span> of happy customers ⭐ 4.8
              </p>
            </div>
          </div>

          {/* Image */}
          <div
            className="relative h-72 md:h-96 lg:h-[480px] rounded-3xl overflow-hidden"
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
                priority
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full bg-[var(--color-primary)]/10 flex items-center justify-center">
                <span className="text-8xl">🥗</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom curve */}
      <div className="absolute bottom-0 left-0 right-0 h-8 bg-white" style={{ borderRadius: '50% 50% 0 0 / 100% 100% 0 0' }} />
    </section>
  )
}
