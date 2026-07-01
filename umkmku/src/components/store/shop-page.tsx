'use client'

import { useState, useTransition, useCallback } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { SlidersHorizontal, X, ChevronDown, ChevronLeft, ChevronRight, ShoppingBag, Heart } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useCart } from '@/lib/cart-context'
import type { Tenant, Product } from '@/lib/supabase/types'

const SORT_OPTIONS = [
  { label: 'Terbaru', value: 'newest' },
  { label: 'Harga: Rendah ke Tinggi', value: 'price_asc' },
  { label: 'Harga: Tinggi ke Rendah', value: 'price_desc' },
]

const fmt = (s: string) => s.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())

interface Props {
  tenant: Tenant
  products: Product[]
  slug: string
  totalCount: number
  currentPage: number
  totalPages: number
  skinTypeOptions: string[]
  concernOptions: string[]
  initialSkinTypes: string[]
  initialConcerns: string[]
  initialSort: string
  wishedProductIds: string[]
}

export function ShopPage({
  tenant, products, slug,
  totalCount, currentPage, totalPages,
  skinTypeOptions, concernOptions,
  initialSkinTypes, initialConcerns, initialSort,
  wishedProductIds,
}: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const [isPending, startTransition] = useTransition()
  const [filterOpen, setFilterOpen] = useState(false)
  const [sortOpen, setSortOpen] = useState(false)

  const navigate = useCallback((overrides: Record<string, string | null>) => {
    const params = new URLSearchParams()
    const skinTypes = overrides.skin_types !== undefined ? overrides.skin_types : initialSkinTypes.join(',')
    const concerns = overrides.concerns !== undefined ? overrides.concerns : initialConcerns.join(',')
    const sort = overrides.sort !== undefined ? overrides.sort : initialSort
    const page = overrides.page !== undefined ? overrides.page : '1'

    if (skinTypes) params.set('skin_types', skinTypes)
    if (concerns) params.set('concerns', concerns)
    if (sort && sort !== 'newest') params.set('sort', sort)
    if (page && page !== '1') params.set('page', page)

    startTransition(() => router.push(`${pathname}?${params.toString()}`))
  }, [pathname, router, initialSkinTypes, initialConcerns, initialSort])

  const toggleSkinType = (type: string) => {
    const next = initialSkinTypes.includes(type)
      ? initialSkinTypes.filter(t => t !== type)
      : [...initialSkinTypes, type]
    navigate({ skin_types: next.join(',') })
  }

  const toggleConcern = (c: string) => {
    const next = initialConcerns.includes(c)
      ? initialConcerns.filter(x => x !== c)
      : [...initialConcerns, c]
    navigate({ concerns: next.join(',') })
  }

  const clearFilters = () => navigate({ skin_types: '', concerns: '' })
  const activeCount = initialSkinTypes.length + initialConcerns.length
  const currentSort = SORT_OPTIONS.find(o => o.value === initialSort) ?? SORT_OPTIONS[0]

  const filterPanel = (
    <div className={`bg-white border border-[#e8e8e8] rounded-lg p-4 space-y-6 ${isPending ? 'opacity-60 pointer-events-none' : ''}`}>
      {activeCount > 0 && (
        <button onClick={clearFilters} className="text-[12px] text-[#e91e63] font-bold underline">
          Hapus filter ({activeCount})
        </button>
      )}
      {skinTypeOptions.length > 0 && (
        <div>
          <p className="text-label-bold text-[#5b3f43] mb-3">SKIN TYPE</p>
          <div className="space-y-2">
            {skinTypeOptions.map(type => (
              <label key={type} className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={initialSkinTypes.includes(type)}
                  onChange={() => toggleSkinType(type)} className="accent-[#e91e63] w-4 h-4" />
                <span className="text-[14px] text-[#1a1c1c]">{fmt(type)}</span>
              </label>
            ))}
          </div>
        </div>
      )}
      {concernOptions.length > 0 && (
        <div>
          <p className="text-label-bold text-[#5b3f43] mb-3">SKIN CONCERN</p>
          <div className="flex flex-wrap gap-2">
            {concernOptions.map(c => (
              <button key={c} onClick={() => toggleConcern(c)}
                className={`px-3 py-1 rounded-full text-[12px] font-bold border transition-colors ${
                  initialConcerns.includes(c)
                    ? 'bg-[#e91e63] text-white border-[#e91e63]'
                    : 'bg-white text-[#1a1c1c] border-[#e4bdc2] hover:border-[#e91e63]'
                }`}>
                {fmt(c)}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )

  return (
    <main className="bg-[#f9f9f9] min-h-screen">
      {/* Hero mini */}
      <div className="bg-white border-b border-[#e8e8e8] py-10">
        <div className="max-w-[1200px] mx-auto px-4 md:px-6">
          <p className="text-label-bold text-[#8f6f73] mb-2">KOLEKSI</p>
          <h1 className="text-display text-[#1a1c1c]">{tenant.brand_name}</h1>
        </div>
      </div>

      <div className="max-w-[1200px] mx-auto px-4 md:px-6 py-8">
        {/* Toolbar */}
        <div className="flex items-center justify-between mb-6">
          <button onClick={() => setFilterOpen(v => !v)}
            className="flex items-center gap-2 text-[14px] font-bold text-[#1a1c1c] md:hidden">
            <SlidersHorizontal size={16} />
            Filter {activeCount > 0 && `(${activeCount})`}
          </button>
          <p className="text-[14px] text-[#5b3f43]">{totalCount} produk</p>
          <div className="relative">
            <button onClick={() => setSortOpen(v => !v)}
              className="flex items-center gap-2 text-[14px] text-[#1a1c1c] border border-[#e4bdc2] rounded-lg px-3 py-2">
              {currentSort.label} <ChevronDown size={14} />
            </button>
            {sortOpen && (
              <div className="absolute right-0 top-full mt-1 bg-white border border-[#e8e8e8] rounded-lg shadow-md z-10 min-w-[220px]">
                {SORT_OPTIONS.map(opt => (
                  <button key={opt.value}
                    onClick={() => { navigate({ sort: opt.value }); setSortOpen(false) }}
                    className={`w-full text-left px-4 py-2 text-[14px] hover:bg-[#f3f3f3] ${currentSort.value === opt.value ? 'font-bold text-[#e91e63]' : 'text-[#1a1c1c]'}`}>
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-6">
          {/* Sidebar, desktop */}
          <aside className="hidden md:block w-64 shrink-0">{filterPanel}</aside>

          {/* Mobile filter sheet */}
          {filterOpen && (
            <div className="fixed inset-0 z-50 md:hidden">
              <div className="absolute inset-0 bg-black/40" onClick={() => setFilterOpen(false)} />
              <div className="absolute bottom-0 inset-x-0 bg-white rounded-t-2xl p-6 max-h-[80vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-headline-md text-[#1a1c1c]">Filter</h3>
                  <button onClick={() => setFilterOpen(false)}><X size={20} /></button>
                </div>
                {filterPanel}
              </div>
            </div>
          )}

          <div className="flex-1">
            {products.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-[#5b3f43] mb-4">Tidak ada produk ditemukan.</p>
                {activeCount > 0 && (
                  <button onClick={clearFilters} className="text-[12px] text-[#e91e63] font-bold underline">
                    Hapus semua filter
                  </button>
                )}
              </div>
            ) : (
              <div className={`grid grid-cols-2 lg:grid-cols-3 gap-4 ${isPending ? 'opacity-50' : ''}`}>
                {products.map(product => (
                  <ShopProductCard key={product.id} product={product} slug={slug} initialWished={wishedProductIds.includes(product.id)} />
                ))}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-10">
                <button
                  disabled={currentPage <= 1 || isPending}
                  onClick={() => navigate({ page: String(currentPage - 1) })}
                  className="w-9 h-9 flex items-center justify-center border border-[#e4bdc2] rounded-lg disabled:opacity-30 hover:border-[#e91e63] transition-colors">
                  <ChevronLeft size={16} />
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                  <button key={p}
                    onClick={() => navigate({ page: String(p) })}
                    disabled={isPending}
                    className={`w-9 h-9 text-[14px] font-bold rounded-lg border transition-colors ${
                      p === currentPage
                        ? 'bg-[#1a1c1c] text-white border-[#1a1c1c]'
                        : 'border-[#e4bdc2] text-[#1a1c1c] hover:border-[#e91e63]'
                    }`}>
                    {p}
                  </button>
                ))}

                <button
                  disabled={currentPage >= totalPages || isPending}
                  onClick={() => navigate({ page: String(currentPage + 1) })}
                  className="w-9 h-9 flex items-center justify-center border border-[#e4bdc2] rounded-lg disabled:opacity-30 hover:border-[#e91e63] transition-colors">
                  <ChevronRight size={16} />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}

function ShopProductCard({ product, slug, initialWished }: { product: Product; slug: string; initialWished: boolean }) {
  const router = useRouter()
  const { addItem } = useCart()
  const [wished, setWished] = useState(initialWished)
  const [addState, setAddState] = useState<'idle' | 'flying' | 'done'>('idle')

  const outOfStock = product.stock_quantity !== null && product.stock_quantity <= 0 && !product.is_preorder
  const [flyOrigin, setFlyOrigin] = useState({ x: 0, y: 0 })
  const [flyDest, setFlyDest] = useState({ x: 0, y: 0 })
  const [flyPhase, setFlyPhase] = useState<'start' | 'end'>('start')

  function handleQuickAdd(e: React.MouseEvent<HTMLButtonElement>) {
    e.preventDefault()
    if (addState !== 'idle') return
    addItem({ productId: product.id, name: product.name, price: product.price ?? 0, imageUrl: product.image_url })
    const rect = e.currentTarget.getBoundingClientRect()
    const cartRect = document.getElementById('cart-nav-icon')?.getBoundingClientRect()
    setFlyOrigin({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 })
    setFlyDest(cartRect
      ? { x: cartRect.left + cartRect.width / 2, y: cartRect.top + cartRect.height / 2 }
      : { x: window.innerWidth - 56, y: 34 }
    )
    setFlyPhase('start')
    setAddState('flying')
    requestAnimationFrame(() => requestAnimationFrame(() => setFlyPhase('end')))
    setTimeout(() => setAddState('done'), 750)
    setTimeout(() => setAddState('idle'), 2000)
  }

  return (
    <>
      {/* Flying animation */}
      {addState === 'flying' && (
        <div className="fixed z-[9999] pointer-events-none"
          style={{
            left: flyOrigin.x, top: flyOrigin.y,
            transform: flyPhase === 'end'
              ? `translate(-50%,-50%) translate(${flyDest.x - flyOrigin.x}px,${flyDest.y - flyOrigin.y}px) scale(0.3)`
              : 'translate(-50%,-50%) scale(1)',
            opacity: flyPhase === 'end' ? 0 : 1,
            transition: 'transform 0.7s cubic-bezier(0.4,0,0.2,1), opacity 0.7s ease-in',
          }}>
          <div className="w-8 h-8 rounded-full bg-[#1a1c1c] flex items-center justify-center">
            <ShoppingBag size={14} className="text-white" />
          </div>
        </div>
      )}

      <div className="group bg-white rounded-lg border border-[#e8e8e8] overflow-hidden hover:shadow-[0_4px_15px_rgba(0,0,0,0.05)] transition-shadow">
        <div className="relative aspect-square bg-[#f3f3f3] overflow-hidden">
          <Link href={`/store/${slug}/products/${product.id}`}>
            {product.image_url ? (
              <Image src={product.image_url} alt={product.name} fill className={`object-cover ${outOfStock ? 'opacity-50' : ''}`} />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-[#e4bdc2] text-4xl">🧴</div>
            )}
          </Link>
          {/* Stock badges */}
          {outOfStock && (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="bg-black/70 text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1.5">Stok Habis</span>
            </div>
          )}
          {product.is_preorder && (
            <div className="absolute top-2 left-2">
              <span className="bg-[#e91e63] text-white text-[9px] font-bold uppercase tracking-widest px-2 py-1">Pre-Order</span>
            </div>
          )}
          {!outOfStock && !product.is_preorder && product.stock_quantity !== null && product.stock_quantity <= 5 && (
            <div className="absolute top-2 left-2">
              <span className="bg-amber-500 text-white text-[9px] font-bold uppercase tracking-widest px-2 py-1">Stok {product.stock_quantity}</span>
            </div>
          )}
          <button onClick={async e => {
            e.preventDefault()
            const supabase = createClient()
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) { router.push(`/store/${slug}/login`); return }
            setWished(v => !v)
            if (wished) {
              await supabase.from('wishlists').delete()
                .eq('user_id', user.id).eq('product_id', product.id)
            } else {
              const { data: tenant } = await supabase.from('tenants').select('id').eq('slug', slug).single()
              if (tenant) await supabase.from('wishlists').upsert({ user_id: user.id, product_id: product.id, tenant_id: tenant.id })
            }
          }} className="absolute top-2 right-2 w-7 h-7 flex items-center justify-center bg-white rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-opacity">
            <Heart size={14} className={wished ? 'fill-[#e91e63] text-[#e91e63]' : 'text-[#5b3f43]'} />
          </button>
          {!outOfStock && (
            <button
              onClick={handleQuickAdd}
              className={`absolute bottom-0 inset-x-0 py-2 text-white text-[11px] font-bold uppercase tracking-wide text-center translate-y-full group-hover:translate-y-0 transition-transform flex items-center justify-center gap-2 ${
                addState === 'done' ? 'bg-green-600' : 'bg-[#1a1c1c]'
              }`}>
              <ShoppingBag size={12} />
              {addState === 'done' ? 'Added!' : 'Quick Add'}
            </button>
          )}
        </div>
        <div className="p-3">
          <p className="text-[14px] font-bold text-[#1a1c1c] line-clamp-2 mb-1">{product.name}</p>
          {product.description && (
            <p className="text-[12px] text-[#5b3f43] line-clamp-2 mb-2">{product.description}</p>
          )}
          <div className="flex items-center justify-between gap-2">
            {product.price ? (
              <span className="text-price">Rp {product.price.toLocaleString('id-ID')}</span>
            ) : (
              <span className="text-[12px] text-[#8f6f73]">Hubungi untuk harga</span>
            )}
            <Link href={`/store/${slug}/products/${product.id}`}
              className="text-[11px] font-bold text-[#8f6f73] hover:text-[#e91e63] transition-colors whitespace-nowrap">
              Lihat Detail →
            </Link>
          </div>
          {product.stock_quantity !== null && !product.is_preorder && (
            <p className={`text-[10px] mt-1 ${outOfStock ? 'text-red-500 font-medium' : 'text-[#8f6f73]'}`}>
              {outOfStock ? 'Stok habis' : `Stok: ${product.stock_quantity}`}
            </p>
          )}
        </div>
      </div>
    </>
  )
}
