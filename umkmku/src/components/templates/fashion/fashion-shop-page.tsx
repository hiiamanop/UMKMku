'use client'

import { useState, useTransition, useCallback } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { SlidersHorizontal, X, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react'
import { FashionProductCard } from './fashion-product-card'
import type { Tenant, Product } from '@/lib/supabase/types'

const SORT_OPTIONS = [
  { label: 'Newest', value: 'newest' },
  { label: 'Price: Low to High', value: 'price_asc' },
  { label: 'Price: High to Low', value: 'price_desc' },
]

const fmt = (s: string) => s.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())

interface Props {
  tenant: Tenant
  products: Product[]
  slug: string
  totalCount: number
  currentPage: number
  totalPages: number
  sizeOptions: string[]
  styleOptions: string[]
  initialSizes: string[]
  initialStyles: string[]
  initialSort: string
}

export function FashionShopPage({
  tenant, products, slug,
  totalCount, currentPage, totalPages,
  sizeOptions, styleOptions,
  initialSizes, initialStyles, initialSort,
}: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const [isPending, startTransition] = useTransition()
  const [filterOpen, setFilterOpen] = useState(false)
  const [sortOpen, setSortOpen] = useState(false)

  const navigate = useCallback((overrides: Record<string, string | null>) => {
    const params = new URLSearchParams()
    const sizes = overrides.sizes !== undefined ? overrides.sizes : initialSizes.join(',')
    const styles = overrides.styles !== undefined ? overrides.styles : initialStyles.join(',')
    const sort = overrides.sort !== undefined ? overrides.sort : initialSort
    const page = overrides.page !== undefined ? overrides.page : '1'

    if (sizes) params.set('sizes', sizes)
    if (styles) params.set('styles', styles)
    if (sort && sort !== 'newest') params.set('sort', sort)
    if (page && page !== '1') params.set('page', page)

    startTransition(() => router.push(`${pathname}?${params.toString()}`))
  }, [pathname, router, initialSizes, initialStyles, initialSort])

  const toggleSize = (size: string) => {
    const next = initialSizes.includes(size)
      ? initialSizes.filter((s) => s !== size)
      : [...initialSizes, size]
    navigate({ sizes: next.join(',') })
  }

  const toggleStyle = (style: string) => {
    const next = initialStyles.includes(style)
      ? initialStyles.filter((s) => s !== style)
      : [...initialStyles, style]
    navigate({ styles: next.join(',') })
  }

  const clearFilters = () => navigate({ sizes: '', styles: '' })
  const activeCount = initialSizes.length + initialStyles.length
  const currentSort = SORT_OPTIONS.find((o) => o.value === initialSort) ?? SORT_OPTIONS[0]

  return (
    <div className={isPending ? 'opacity-60 transition-opacity' : ''}>
      {/* Page header */}
      <div className="px-6 md:px-16 py-10 border-b border-black/10 bg-[var(--color-secondary)]">
        <span className="text-[10px] tracking-widest uppercase text-[var(--color-accent)]/50 block mb-2">
          {tenant.brand_name}
        </span>
        <h1 className="text-2xl md:text-3xl tracking-widest uppercase font-medium text-[var(--color-primary)]">
          THE COLLECTION
        </h1>
        <p className="text-[12px] text-[var(--color-accent)]/50 mt-1">
          {totalCount} {totalCount === 1 ? 'item' : 'items'}
        </p>
      </div>

      <div className="flex flex-col md:flex-row min-h-screen">
        {/* Sidebar, desktop */}
        <aside className="hidden md:block w-64 shrink-0 border-r border-black/10 px-8 py-10">
          <div className="sticky top-24 space-y-8">
            {/* Active filters */}
            {activeCount > 0 && (
              <div>
                <button
                  onClick={clearFilters}
                  className="text-[10px] tracking-widest uppercase text-[var(--color-accent)]/60 hover:text-[var(--color-primary)] flex items-center gap-1.5 transition-colors"
                >
                  <X size={12} />
                  CLEAR FILTERS ({activeCount})
                </button>
              </div>
            )}

            {/* Sizes */}
            {sizeOptions.length > 0 && (
              <div>
                <h3 className="text-[10px] tracking-widest uppercase text-[var(--color-accent)]/50 mb-4">
                  SIZE
                </h3>
                <div className="flex flex-wrap gap-2">
                  {sizeOptions.map((size) => (
                    <button
                      key={size}
                      onClick={() => toggleSize(size)}
                      className={`px-3 py-1.5 text-[11px] border transition-colors uppercase tracking-wide ${
                        initialSizes.includes(size)
                          ? 'bg-[var(--color-primary)] text-white border-[var(--color-primary)]'
                          : 'border-black/20 text-[var(--color-accent)] hover:border-[var(--color-primary)]'
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Style */}
            {styleOptions.length > 0 && (
              <div>
                <h3 className="text-[10px] tracking-widest uppercase text-[var(--color-accent)]/50 mb-4">
                  STYLE
                </h3>
                <div className="flex flex-col gap-2">
                  {styleOptions.map((style) => (
                    <label key={style} className="flex items-center gap-2.5 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={initialStyles.includes(style)}
                        onChange={() => toggleStyle(style)}
                        className="w-3.5 h-3.5 accent-[var(--color-primary)]"
                      />
                      <span className="text-[12px] text-[var(--color-accent)] group-hover:text-[var(--color-primary)] transition-colors capitalize">
                        {fmt(style)}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
        </aside>

        {/* Main content */}
        <div className="flex-1 px-6 md:px-10 py-8">
          {/* Top bar: mobile filter + sort */}
          <div className="flex items-center justify-between mb-8 gap-4">
            {/* Mobile filter toggle */}
            <button
              onClick={() => setFilterOpen((v) => !v)}
              className="md:hidden flex items-center gap-2 text-[11px] tracking-widest uppercase text-[var(--color-accent)] border border-black/20 px-4 py-2"
            >
              <SlidersHorizontal size={14} />
              FILTER {activeCount > 0 && `(${activeCount})`}
            </button>

            {/* Sort dropdown */}
            <div className="relative ml-auto">
              <button
                onClick={() => setSortOpen((v) => !v)}
                className="flex items-center gap-2 text-[11px] tracking-widest uppercase text-[var(--color-accent)] border border-black/20 px-4 py-2"
              >
                {currentSort.label}
                <ChevronDown size={12} />
              </button>
              {sortOpen && (
                <div className="absolute right-0 top-full z-20 bg-white border border-black/10 shadow-sm min-w-[180px]">
                  {SORT_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => { navigate({ sort: opt.value }); setSortOpen(false) }}
                      className={`w-full text-left px-4 py-3 text-[11px] tracking-wider uppercase hover:bg-[var(--color-secondary)] transition-colors ${
                        opt.value === initialSort ? 'text-[var(--color-primary)] font-medium' : 'text-[var(--color-accent)]'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Mobile filter panel */}
          {filterOpen && (
            <div className="md:hidden bg-[var(--color-secondary)] border border-black/10 p-6 mb-6 space-y-6">
              {activeCount > 0 && (
                <button
                  onClick={clearFilters}
                  className="text-[10px] tracking-widest uppercase text-[var(--color-accent)]/60 flex items-center gap-1.5"
                >
                  <X size={12} />
                  CLEAR FILTERS ({activeCount})
                </button>
              )}

              {sizeOptions.length > 0 && (
                <div>
                  <h3 className="text-[10px] tracking-widest uppercase text-[var(--color-accent)]/50 mb-3">SIZE</h3>
                  <div className="flex flex-wrap gap-2">
                    {sizeOptions.map((size) => (
                      <button
                        key={size}
                        onClick={() => toggleSize(size)}
                        className={`px-3 py-1.5 text-[11px] border transition-colors uppercase tracking-wide ${
                          initialSizes.includes(size)
                            ? 'bg-[var(--color-primary)] text-white border-[var(--color-primary)]'
                            : 'border-black/20 text-[var(--color-accent)]'
                        }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {styleOptions.length > 0 && (
                <div>
                  <h3 className="text-[10px] tracking-widest uppercase text-[var(--color-accent)]/50 mb-3">STYLE</h3>
                  <div className="flex flex-col gap-2">
                    {styleOptions.map((style) => (
                      <label key={style} className="flex items-center gap-2.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={initialStyles.includes(style)}
                          onChange={() => toggleStyle(style)}
                          className="w-3.5 h-3.5 accent-[var(--color-primary)]"
                        />
                        <span className="text-[12px] text-[var(--color-accent)] capitalize">{fmt(style)}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Product grid */}
          {products.length === 0 ? (
            <div className="text-center py-24">
              <p className="text-[var(--color-accent)]/40 text-sm tracking-wider">No items found.</p>
              {activeCount > 0 && (
                <button
                  onClick={clearFilters}
                  className="mt-4 text-[11px] tracking-widest uppercase text-[var(--color-primary)] underline"
                >
                  Clear filters
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-5 md:gap-8">
              {products.map((product) => (
                <FashionProductCard
                  key={product.id}
                  product={product}
                  slug={slug}
                />
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-4 mt-14">
              <button
                onClick={() => navigate({ page: String(currentPage - 1) })}
                disabled={currentPage <= 1}
                className="w-10 h-10 border border-black/20 flex items-center justify-center text-[var(--color-accent)] hover:bg-[var(--color-primary)] hover:text-white hover:border-[var(--color-primary)] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronLeft size={16} />
              </button>

              <span className="text-[11px] tracking-widest uppercase text-[var(--color-accent)]/60">
                {currentPage} / {totalPages}
              </span>

              <button
                onClick={() => navigate({ page: String(currentPage + 1) })}
                disabled={currentPage >= totalPages}
                className="w-10 h-10 border border-black/20 flex items-center justify-center text-[var(--color-accent)] hover:bg-[var(--color-primary)] hover:text-white hover:border-[var(--color-primary)] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
