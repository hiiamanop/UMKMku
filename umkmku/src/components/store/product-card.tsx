'use client'

import Image from 'next/image'
import { Heart } from 'lucide-react'
import { useState } from 'react'
import type { Product } from '@/lib/supabase/types'

interface Props {
  product: Product
}

export function ProductCard({ product }: Props) {
  const [wished, setWished] = useState(false)

  const marketplaceUrl = product.tokopedia_url || product.shopee_url

  return (
    <div className="group bg-white rounded-lg border border-[#e8e8e8] overflow-hidden hover:shadow-[0_4px_15px_rgba(0,0,0,0.05)] transition-shadow">
      {/* Image */}
      <div className="relative aspect-square bg-[#f3f3f3] overflow-hidden">
        {product.image_url ? (
          <Image
            src={product.image_url}
            alt={product.name}
            fill
            className="object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-[#e4bdc2] text-5xl select-none">
            🧴
          </div>
        )}

        {/* Wishlist icon */}
        <button
          onClick={() => setWished((v) => !v)}
          aria-label="Wishlist"
          className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center bg-white rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <Heart
            size={16}
            className={wished ? 'fill-[#e91e63] text-[#e91e63]' : 'text-[#5b3f43]'}
          />
        </button>

        {/* Quick Add — appears on hover */}
        {marketplaceUrl && (
          <a
            href={marketplaceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="absolute bottom-0 inset-x-0 py-2 bg-[#1a1c1c] text-white text-[12px] font-bold uppercase tracking-wide text-center translate-y-full group-hover:translate-y-0 transition-transform"
          >
            Quick Add
          </a>
        )}
      </div>

      {/* Content */}
      <div className="p-3">
        <p className="text-[14px] font-400 text-[#1a1c1c] line-clamp-2 mb-1">
          {product.name}
        </p>
        {product.description && (
          <p className="text-[12px] text-[#5b3f43] line-clamp-2 mb-2">
            {product.description}
          </p>
        )}
        <div className="flex items-center gap-2">
          {product.price ? (
            <span className="text-price">
              Rp {product.price.toLocaleString('id-ID')}
            </span>
          ) : (
            <span className="text-[12px] text-[#8f6f73]">Hubungi untuk harga</span>
          )}
        </div>
      </div>
    </div>
  )
}
