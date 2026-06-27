'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback } from 'react'
import { FnbProductCard } from './fnb-product-card'
import type { Product, Tenant } from '@/lib/supabase/types'

interface Props {
  tenant: Tenant
  products: Product[]
  slug: string
  totalCount: number
  currentPage: number
  totalPages: number
  dietaryOptions: string[]
  initialDietary: string[]
  initialSort: string
}

const SORT_OPTIONS = [
  { value: 'newest', label: 'Terbaru' },
  { value: 'price_asc', label: 'Harga Terendah' },
  { value: 'price_desc', label: 'Harga Tertinggi' },
]

const DIETARY_EMOJI: Record<string, string> = {
  vegan: '🌱',
  'gluten-free': '🌾',
  halal: '☪️',
  organic: '🌿',
}

export function FnbShopPage({
  tenant,
  products,
  slug,
  totalCount,
  currentPage,
  totalPages,
  dietaryOptions,
  initialDietary,
  initialSort,
}: Props) {
  const router = useRouter()
  const sp = useSearchParams()

  const update = useCallback((key: string, value: string) => {
    const params = new URLSearchParams(sp.toString())
    if (value) params.set(key, value)
    else params.delete(key)
    params.delete('page')
    router.push(`/store/${slug}/shop?${params.toString()}`)
  }, [sp, router, slug])

  const toggleDietary = (d: string) => {
    const cur = initialDietary.includes(d)
      ? initialDietary.filter((x) => x !== d)
      : [...initialDietary, d]
    update('dietary', cur.join(','))
  }

  const goPage = (p: number) => {
    const params = new URLSearchParams(sp.toString())
    params.set('page', String(p))
    router.push(`/store/${slug}/shop?${params.toString()}`)
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black text-gray-900">Menu Kami</h1>
          <p className="text-sm text-gray-400 mt-1">{totalCount} produk ditemukan</p>
        </div>

        {/* Sort */}
        <select
          value={initialSort}
          onChange={(e) => update('sort', e.target.value)}
          className="border border-gray-200 rounded-xl px-4 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
        >
          {SORT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      <div className="flex gap-8">
        {/* Sidebar */}
        {dietaryOptions.length > 0 && (
          <aside className="hidden lg:block w-56 flex-shrink-0">
            <div className="bg-white rounded-2xl border border-gray-100 p-5 sticky top-24">
              <h3 className="font-bold text-gray-900 mb-4">Filter</h3>

              <div className="mb-6">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Dietary</p>
                <div className="flex flex-col gap-2">
                  {dietaryOptions.map((d) => (
                    <label key={d} className="flex items-center gap-2 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={initialDietary.includes(d)}
                        onChange={() => toggleDietary(d)}
                        className="rounded border-gray-300 text-[var(--color-primary)] focus:ring-[var(--color-primary)]"
                      />
                      <span className="text-sm text-gray-700 group-hover:text-[var(--color-primary)] transition-colors capitalize">
                        {DIETARY_EMOJI[d] ?? '✓'} {d}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {initialDietary.length > 0 && (
                <button
                  onClick={() => update('dietary', '')}
                  className="text-xs text-gray-400 hover:text-[var(--color-primary)] transition-colors"
                >
                  Hapus filter
                </button>
              )}
            </div>
          </aside>
        )}

        {/* Grid */}
        <div className="flex-1 min-w-0">
          {/* Mobile dietary chips */}
          {dietaryOptions.length > 0 && (
            <div className="lg:hidden flex gap-2 overflow-x-auto pb-2 mb-6">
              {dietaryOptions.map((d) => (
                <button
                  key={d}
                  onClick={() => toggleDietary(d)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                    initialDietary.includes(d)
                      ? 'bg-[var(--color-primary)] text-white'
                      : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {DIETARY_EMOJI[d] ?? ''} {d}
                </button>
              ))}
            </div>
          )}

          {products.length === 0 ? (
            <div className="text-center py-20 text-gray-400">
              <p className="text-4xl mb-4">🍽️</p>
              <p>Tidak ada produk ditemukan.</p>
              {initialDietary.length > 0 && (
                <button onClick={() => update('dietary', '')} className="mt-3 text-sm text-[var(--color-primary)] underline">
                  Hapus filter
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
              {products.map((p) => (
                <FnbProductCard key={p.id} product={p} slug={slug} />
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-10">
              <button
                onClick={() => goPage(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-4 py-2 rounded-xl border border-gray-200 text-sm font-medium disabled:opacity-30 hover:border-[var(--color-primary)] transition-colors"
              >
                ←
              </button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const p = i + 1
                return (
                  <button
                    key={p}
                    onClick={() => goPage(p)}
                    className={`w-10 h-10 rounded-xl text-sm font-medium transition-colors ${
                      p === currentPage
                        ? 'bg-[var(--color-primary)] text-white'
                        : 'border border-gray-200 hover:border-[var(--color-primary)] text-gray-700'
                    }`}
                  >
                    {p}
                  </button>
                )
              })}
              <button
                onClick={() => goPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-4 py-2 rounded-xl border border-gray-200 text-sm font-medium disabled:opacity-30 hover:border-[var(--color-primary)] transition-colors"
              >
                →
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
