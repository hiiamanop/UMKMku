import Image from 'next/image'
import Link from 'next/link'
import type { Product } from '@/lib/supabase/types'

interface Props {
  product: Product
  slug: string
}

export function ParfumProductCard({ product, slug }: Props) {
  const detailUrl = `/store/${slug}/products/${product.id}`
  const fragranceFamily = product.parfum_data?.fragrance_family

  return (
    <Link href={detailUrl} className="group block bg-[var(--color-secondary)]">
      {/* Portrait image */}
      <div className="relative aspect-[3/4] overflow-hidden bg-[var(--color-primary)]/5">
        {product.image_url ? (
          <Image
            src={product.image_url}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover transition-transform duration-700 group-hover:scale-105"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-5xl opacity-10">🌸</div>
        )}

        {/* Fragrance family badge */}
        {fragranceFamily && (
          <span className="absolute top-3 left-3 text-[9px] tracking-[0.2em] uppercase bg-white/80 text-[var(--color-primary)] px-2.5 py-1 backdrop-blur-sm">
            {fragranceFamily.toUpperCase()}
          </span>
        )}
      </div>

      {/* Info */}
      <div className="pt-3 pb-4 px-1 flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h4 className="font-light italic text-base text-[var(--color-primary)] leading-snug mb-1 truncate">
            {product.name}
          </h4>
          {product.price ? (
            <p className="text-xs text-[var(--color-accent)] tracking-wide">
              IDR {product.price.toLocaleString('id-ID')}
            </p>
          ) : (
            <p className="text-xs text-[var(--color-accent)]/40">Hubungi untuk harga</p>
          )}
        </div>
        <span
          aria-hidden="true"
          className="text-[var(--color-primary)]/40 group-hover:text-[var(--color-primary)] transition-colors shrink-0 mt-0.5 text-base"
        >
          ↗
        </span>
      </div>
    </Link>
  )
}
