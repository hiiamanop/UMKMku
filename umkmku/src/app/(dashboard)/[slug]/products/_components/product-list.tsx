'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Plus, ChevronDown, ChevronUp, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { Product } from '@/lib/supabase/types'
import { ProductForm } from './product-form'
import { deleteProduct } from '../actions'

interface Props {
  slug: string
  products: Product[]
}

function ProductRow({ slug, product }: { slug: string; product: Product }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="border-b border-black/5 last:border-0">
      <div
        className="flex items-center gap-4 py-4 cursor-pointer hover:bg-black/[0.02] px-1 -mx-1 rounded transition-colors"
        onClick={() => setOpen(!open)}
      >
        {/* Thumbnail */}
        <div className="w-12 h-12 rounded bg-[var(--color-secondary)] relative overflow-hidden shrink-0">
          {product.image_url ? (
            <Image src={product.image_url} alt={product.name} fill sizes="48px" className="object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-lg opacity-30">🧴</div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="text-body-md font-medium truncate">{product.name}</p>
          <p className="text-label-caps text-[10px] text-[var(--color-accent)]/50 mt-0.5">
            {product.price ? `IDR ${product.price.toLocaleString('id-ID')}` : 'Harga belum diset'}
            {product.usage_step && ` · ${product.usage_step}`}
          </p>
        </div>

        {/* Stock badge */}
        <div className="shrink-0 text-right">
          {product.is_preorder ? (
            <span className="text-label-caps text-[9px] px-2 py-0.5 rounded-full bg-pink-100 text-pink-600">Pre-Order</span>
          ) : product.stock_quantity === null ? (
            <span className="text-label-caps text-[9px] text-[var(--color-accent)]/30">∞</span>
          ) : product.stock_quantity <= 0 ? (
            <span className="text-label-caps text-[9px] px-2 py-0.5 rounded-full bg-red-100 text-red-500">Habis</span>
          ) : product.stock_quantity <= 5 ? (
            <span className="text-label-caps text-[9px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-600">{product.stock_quantity} sisa</span>
          ) : (
            <span className="text-label-caps text-[9px] text-[var(--color-accent)]/40">{product.stock_quantity} stok</span>
          )}
        </div>

        {/* Expand */}
        {open
          ? <ChevronUp size={16} className="text-[var(--color-accent)]/40 shrink-0" />
          : <ChevronDown size={16} className="text-[var(--color-accent)]/40 shrink-0" />
        }
      </div>

      {open && (
        <div className="pb-6 pt-2">
          <ProductForm slug={slug} product={product} onSuccess={() => setOpen(false)} />
          <div className="mt-4 pt-4 border-t border-black/5">
            <button
              onClick={async () => {
                if (confirm(`Hapus "${product.name}"? Tindakan ini tidak bisa dibatalkan.`)) {
                  await deleteProduct(slug, product.id)
                }
              }}
              className="text-label-caps text-[10px] text-red-400 hover:text-red-600 flex items-center gap-1.5 transition-colors"
            >
              <Trash2 size={12} /> Hapus Produk
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export function ProductList({ slug, products: initialProducts }: Props) {
  const [showAdd, setShowAdd] = useState(false)

  return (
    <div className="space-y-0">
      {/* Header */}
      <div className="flex items-baseline justify-between mb-8">
        <div>
          <h2 className="text-headline-lg italic">Produk</h2>
          <p className="text-body-md text-[var(--color-accent)]/50 mt-1">
            {initialProducts.length} produk · Maksimal 6 tampil di toko
          </p>
        </div>
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="flex items-center gap-2 bg-[var(--color-primary)] text-white text-label-caps tracking-widest px-5 py-2.5 hover:opacity-90 transition-opacity text-[10px]"
        >
          <Plus size={12} />
          Tambah Produk
        </button>
      </div>

      {/* Add form */}
      {showAdd && (
        <div className="bg-white border border-black/8 p-6 mb-6 rounded">
          <h3 className="text-headline-md italic mb-5">Produk Baru</h3>
          <ProductForm slug={slug} onSuccess={() => setShowAdd(false)} />
        </div>
      )}

      {/* Product rows */}
      <div className="bg-white border border-black/8 rounded px-6">
        {initialProducts.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-body-md text-[var(--color-accent)]/40">Belum ada produk. Tambahkan produk pertama kamu.</p>
          </div>
        ) : (
          initialProducts.map((p) => (
            <ProductRow key={p.id} slug={slug} product={p} />
          ))
        )}
      </div>
    </div>
  )
}
