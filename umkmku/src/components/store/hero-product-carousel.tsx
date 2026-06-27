'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import type { Product } from '@/lib/supabase/types'

interface Props {
  products: Product[]
  slug: string
}

export function HeroProductCarousel({ products, slug }: Props) {
  const [index, setIndex] = useState(0)
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    if (products.length <= 1) return
    const interval = setInterval(() => {
      // fade out
      setVisible(false)
      setTimeout(() => {
        setIndex((i) => (i + 1) % products.length)
        setVisible(true)
      }, 600) // fade duration
    }, 4000) // pause per slide

    return () => clearInterval(interval)
  }, [products.length])

  if (products.length === 0) return null

  const product = products[index]

  return (
    <div className="max-w-xs w-full">
      <div
        className="transition-opacity duration-500"
        style={{ opacity: visible ? 1 : 0 }}
      >
        <div className="mb-6">
          <span className="text-label-caps text-[var(--color-primary)]">
            {product.usage_step?.toUpperCase() ?? 'PRODUK UNGGULAN'}
          </span>
          {product.description && (
            <p className="mt-3 text-body-md text-[var(--color-accent)]/70 leading-relaxed line-clamp-3">
              {product.description}
            </p>
          )}
        </div>

        <div className="relative aspect-[4/5] w-full mb-6 bg-white/50">
          {product.image_url ? (
            <Image
              src={product.image_url}
              alt={product.name}
              fill
              sizes="(max-width: 768px) 80vw, 30vw"
              className="object-contain"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-6xl select-none opacity-20">🧴</div>
          )}
        </div>

        <div className="mb-6">
          <p className="text-headline-md italic text-[var(--color-accent)] mb-1">
            {product.name}
          </p>
          {product.price && (
            <p className="text-label-caps text-[var(--color-accent)]/60">
              IDR {product.price.toLocaleString('id-ID')}
            </p>
          )}
        </div>
      </div>

      {/* Dot indicators */}
      {products.length > 1 && (
        <div className="flex gap-1.5 mb-5">
          {products.map((_, i) => (
            <button
              key={i}
              onClick={() => { setVisible(false); setTimeout(() => { setIndex(i); setVisible(true) }, 300) }}
              className="h-0.5 transition-all duration-300"
              style={{
                width: i === index ? '20px' : '8px',
                backgroundColor: i === index ? 'var(--color-primary)' : 'var(--color-accent)',
                opacity: i === index ? 1 : 0.3,
              }}
              aria-label={`Produk ${i + 1}`}
            />
          ))}
        </div>
      )}

      <Link
        href={`/store/${slug}/products/${product.id}`}
        className="w-full py-4 border border-[var(--color-accent)]/30 bg-[var(--color-primary)] text-white text-label-caps tracking-widest flex items-center justify-center gap-4 hover:opacity-90 transition-opacity group"
      >
        CHECK NOW
        <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
      </Link>
    </div>
  )
}
