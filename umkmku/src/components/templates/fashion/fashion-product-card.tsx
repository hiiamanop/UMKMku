import Image from 'next/image'
import Link from 'next/link'
import { ShoppingBag } from 'lucide-react'
import type { Product } from '@/lib/supabase/types'

interface Props {
  product: Product
  slug: string
  isNew?: boolean
}

export function FashionProductCard({ product, slug, isNew = false }: Props) {
  const detailUrl = `/store/${slug}/products/${product.id}`
  const colors = product.fashion_data?.colors ?? []

  return (
    <Link href={detailUrl} className="group block">
      {/* Image */}
      <div className="relative aspect-square overflow-hidden bg-[var(--color-secondary)] mb-3">
        {product.image_url ? (
          <Image
            src={product.image_url}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition-transform duration-700 group-hover:scale-105"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-5xl opacity-20">👗</div>
        )}

        {/* NEW ARRIVAL badge */}
        {isNew && (
          <span className="absolute top-3 left-3 bg-[var(--color-primary)] text-white text-[9px] tracking-widest uppercase px-2.5 py-1">
            NEW ARRIVAL
          </span>
        )}
      </div>

      {/* Info row */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h4 className="text-[11px] tracking-wider uppercase font-medium text-[var(--color-primary)] mb-1 truncate">
            {product.name}
          </h4>

          {product.price ? (
            <p className="text-[11px] tracking-wide text-[var(--color-accent)]/60">
              IDR {product.price.toLocaleString('id-ID')}
            </p>
          ) : (
            <p className="text-[11px] text-[var(--color-accent)]/40">Hubungi untuk harga</p>
          )}

          {/* Color dots */}
          {colors.length > 0 && (
            <div className="flex gap-1.5 mt-2">
              {colors.slice(0, 4).map((color, i) => (
                <span
                  key={i}
                  title={color}
                  className="w-2 h-2 rounded-full border border-black/10 inline-block bg-[var(--color-accent)]/40"
                />
              ))}
            </div>
          )}
        </div>

        {/* View product button */}
        <span
          aria-hidden="true"
          className="w-9 h-9 border border-black/20 flex items-center justify-center shrink-0 group-hover:bg-[var(--color-primary)] group-hover:text-white group-hover:border-[var(--color-primary)] transition-colors text-[var(--color-accent)]"
        >
          <ShoppingBag size={14} />
        </span>
      </div>
    </Link>
  )
}
