'use client'

import Image from 'next/image'
import { Heart, ShoppingCart } from 'lucide-react'
import { useState } from 'react'
import type { Product } from '@/lib/supabase/types'

interface Props {
  product: Product
}

export function ProductCard({ product }: Props) {
  const [wished, setWished] = useState(false)
  const marketplaceUrl = product.tokopedia_url || product.shopee_url

  return (
    <div className="group cursor-pointer">
      {/* Image */}
      <div className="relative aspect-square overflow-hidden bg-[var(--color-secondary)] mb-4">
        {product.image_url ? (
          <Image
            src={product.image_url}
            alt={product.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-700"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-5xl select-none opacity-30">🧴</div>
        )}

        {/* Wishlist icon */}
        <button
          onClick={() => setWished((v) => !v)}
          aria-label="Wishlist"
          className="absolute top-3 right-3 bg-white/80 p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <Heart
            size={16}
            className={wished ? 'fill-[var(--color-primary)] text-[var(--color-primary)]' : 'text-[var(--color-accent)]'}
          />
        </button>
      </div>

      {/* Info row */}
      <div className="flex justify-between items-start">
        <div>
          <h4 className="text-headline-md italic text-[var(--color-accent)] mb-1 leading-snug">
            {product.name}
          </h4>
          {product.price ? (
            <p className="text-label-caps text-[var(--color-accent)]/60">
              IDR {product.price.toLocaleString('id-ID')}
            </p>
          ) : (
            <p className="text-label-caps text-[var(--color-accent)]/40">Hubungi untuk harga</p>
          )}
        </div>

        {/* Square add-to-cart button */}
        {marketplaceUrl ? (
          <a
            href={marketplaceUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Beli"
            className="w-10 h-10 border border-black/20 flex items-center justify-center hover:bg-[var(--color-primary)] hover:text-white hover:border-[var(--color-primary)] transition-colors shrink-0"
          >
            <ShoppingCart size={16} />
          </a>
        ) : (
          <button
            aria-label="Beli"
            className="w-10 h-10 border border-black/20 flex items-center justify-center hover:bg-[var(--color-primary)] hover:text-white hover:border-[var(--color-primary)] transition-colors shrink-0"
          >
            <ShoppingCart size={16} />
          </button>
        )}
      </div>
    </div>
  )
}
