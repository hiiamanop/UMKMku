import Link from 'next/link'
import { FashionProductCard } from './fashion-product-card'
import type { Product } from '@/lib/supabase/types'

interface Props {
  products: Product[]
  slug: string
}

export function FashionProductGrid({ products, slug }: Props) {
  if (products.length === 0) return null

  const displayed = products.slice(0, 6)

  return (
    <section className="px-6 md:px-16 py-16 md:py-24">
      {/* Section header */}
      <div className="flex items-end justify-between mb-10">
        <div>
          <span className="text-[10px] tracking-widest uppercase text-[var(--color-accent)]/50 mb-2 block">
            New Arrivals
          </span>
          <h2 className="text-xl md:text-2xl tracking-widest uppercase font-medium text-[var(--color-primary)]">
            THE CURATED SELECTION
          </h2>
        </div>
        <Link
          href={`/store/${slug}/shop`}
          className="text-[11px] tracking-widest uppercase text-[var(--color-accent)]/60 hover:text-[var(--color-primary)] transition-colors border-b border-current pb-0.5"
        >
          VIEW ALL →
        </Link>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
        {displayed.map((product, index) => (
          <FashionProductCard
            key={product.id}
            product={product}
            slug={slug}
            isNew={index < 3}
          />
        ))}
      </div>
    </section>
  )
}
