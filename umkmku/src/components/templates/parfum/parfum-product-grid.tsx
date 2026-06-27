import Link from 'next/link'
import { ParfumProductCard } from './parfum-product-card'
import type { Product } from '@/lib/supabase/types'

interface Props {
  products: Product[]
  slug: string
}

export function ParfumProductGrid({ products, slug }: Props) {
  const visible = products.slice(0, 8)

  return (
    <section className="py-16 px-8 md:px-16">
      {/* Section header */}
      <div className="flex items-end justify-between mb-10">
        <div>
          <span className="text-[10px] tracking-[0.3em] uppercase text-[var(--color-accent)]/50 block mb-2">
            NEW &amp; NOTABLE
          </span>
          <h2 className="text-xl md:text-2xl tracking-widest uppercase font-medium text-[var(--color-primary)]">
            FRAGRANCE COLLECTION
          </h2>
        </div>
        <Link
          href={`/store/${slug}/shop`}
          className="text-[11px] tracking-[0.2em] uppercase text-[var(--color-primary)]/60 hover:text-[var(--color-primary)] transition-colors flex items-center gap-1"
        >
          VIEW ALL ↗
        </Link>
      </div>

      {/* Grid */}
      {visible.length === 0 ? (
        <p className="text-sm text-[var(--color-accent)]/40 py-12 text-center">
          Koleksi parfum segera hadir.
        </p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-5 md:gap-6">
          {visible.map((product) => (
            <ParfumProductCard key={product.id} product={product} slug={slug} />
          ))}
        </div>
      )}
    </section>
  )
}
