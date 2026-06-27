import Link from 'next/link'
import type { Tenant } from '@/lib/supabase/types'

interface Props {
  tenant: Tenant
  slug: string
}

const CATEGORIES = [
  { label: 'NEW ARRIVALS', query: 'new' },
  { label: 'OUTERWEAR', query: 'outerwear' },
  { label: 'FOOTWEAR', query: 'footwear' },
  { label: 'ACCESSORIES', query: 'accessories' },
]

export function FashionCategories({ slug }: Props) {
  return (
    <section className="px-6 md:px-16 py-12">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        {CATEGORIES.map((cat) => (
          <Link
            key={cat.label}
            href={`/store/${slug}/shop?style=${cat.query}`}
            className="group relative aspect-square overflow-hidden bg-[var(--color-primary)] flex items-center justify-center"
          >
            {/* Dark overlay on hover */}
            <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors duration-300" />

            {/* Label */}
            <span className="relative z-10 text-white text-[11px] tracking-widest uppercase font-medium text-center px-4">
              {cat.label}
            </span>
          </Link>
        ))}
      </div>
    </section>
  )
}
