'use client'

import Link from 'next/link'
import Image from 'next/image'
import { ShoppingCart } from 'lucide-react'
import { formatRupiah } from '@/lib/utils/pricing'
import type { Product } from '@/lib/supabase/types'

interface Props {
  product: Product
  slug: string
}

const DIETARY_EMOJI: Record<string, string> = {
  vegan: '🌱',
  'gluten-free': '🌾',
  halal: '☪️',
  organic: '🌿',
}

export function FnbProductCard({ product, slug }: Props) {
  const dietary = product.fdb_data?.dietary ?? []

  return (
    <Link
      href={`/store/${slug}/products/${product.id}`}
      className="group bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow overflow-hidden border border-gray-100 flex flex-col"
    >
      {/* Image */}
      <div className="relative aspect-[4/3] overflow-hidden bg-gray-50">
        {product.image_url ? (
          <Image
            src={product.image_url}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-5xl">🍱</div>
        )}
        {/* Dietary badges */}
        {dietary.length > 0 && (
          <div className="absolute top-2 left-2 flex gap-1">
            {dietary.slice(0, 2).map((d) => (
              <span key={d} className="text-xs bg-white/90 backdrop-blur-sm rounded-full px-2 py-0.5 font-medium text-gray-700">
                {DIETARY_EMOJI[d] ?? '✓'} {d}
              </span>
            ))}
          </div>
        )}
        {product.stock_quantity === 0 && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <span className="bg-white text-gray-800 text-xs font-bold px-3 py-1 rounded-full">Habis</span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-4 flex flex-col gap-2 flex-1">
        <p className="text-xs text-[var(--color-primary)] font-semibold uppercase tracking-wide">
          {product.fdb_data?.dietary?.includes('organic') ? 'Organic' : 'Fresh'}
        </p>
        <h3 className="font-bold text-gray-900 text-sm leading-tight line-clamp-2 group-hover:text-[var(--color-primary)] transition-colors">
          {product.name}
        </h3>
        {product.fdb_data?.servings && (
          <p className="text-xs text-gray-400">{product.fdb_data.servings} porsi</p>
        )}
        <div className="flex items-center justify-between mt-auto pt-2">
          <span className="font-black text-gray-900 text-base">
            {product.price ? formatRupiah(product.price) : '–'}
          </span>
          <button
            className="p-2 rounded-full bg-[var(--color-primary)] text-white hover:opacity-90 transition-opacity"
            onClick={(e) => { e.preventDefault() }}
            aria-label="Add to cart"
          >
            <ShoppingCart size={14} />
          </button>
        </div>
      </div>
    </Link>
  )
}
