import Image from 'next/image'
import Link from 'next/link'
import type { Product } from '@/lib/supabase/types'

interface Props {
  products: Product[]
  slug: string
}

export function ParfumDiscovery({ products, slug }: Props) {
  // Pick up to 3 products for the discovery strip
  const strip = products.slice(0, 3)

  if (strip.length === 0) return null

  return (
    <section className="py-20 px-8 md:px-16 bg-[var(--color-secondary)]">
      {/* Header */}
      <div className="mb-12">
        <span className="text-[10px] tracking-[0.35em] uppercase text-[var(--color-accent)]/50 block mb-2">
          EXPLORE
        </span>
        <h2 className="text-xl md:text-2xl tracking-widest uppercase font-medium text-[var(--color-primary)]">
          BEYOND THE BOTTLE
        </h2>
      </div>

      {/* 3-column strip */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {strip.map((product) => {
          const topNotes = product.parfum_data?.notes_top ?? []
          const notesPreview = topNotes.slice(0, 2).join(' · ')

          return (
            <Link
              key={product.id}
              href={`/store/${slug}/products/${product.id}`}
              className="group block"
            >
              {/* Image */}
              <div className="relative aspect-[3/4] overflow-hidden bg-[var(--color-primary)]/5 mb-4">
                {product.image_url ? (
                  <Image
                    src={product.image_url}
                    alt={product.name}
                    fill
                    sizes="(max-width: 768px) 100vw, 33vw"
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-6xl opacity-10">🌺</div>
                )}
              </div>

              {/* Text */}
              <p className="font-light italic text-lg text-[var(--color-primary)] mb-1 group-hover:text-[var(--color-accent)] transition-colors">
                {product.name}
              </p>
              {notesPreview && (
                <p className="text-xs text-[var(--color-accent)]/60 tracking-wide">
                  {notesPreview}
                </p>
              )}
            </Link>
          )
        })}
      </div>
    </section>
  )
}
