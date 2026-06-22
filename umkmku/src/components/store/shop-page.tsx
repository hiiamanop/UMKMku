'use client'

import { useState, useMemo } from 'react'
import { SlidersHorizontal, X, ChevronDown } from 'lucide-react'
import Image from 'next/image'
import { Heart } from 'lucide-react'
import type { Tenant, Product } from '@/lib/supabase/types'

interface Props {
  tenant: Tenant
  products: Product[]
}

const SKIN_TYPES = ['Oily', 'Dry', 'Combination', 'Sensitive', 'All']
const CONCERNS = ['Acne', 'Brightening', 'Anti-Aging', 'Hydrating', 'Pores']
const SORT_OPTIONS = ['Terbaru', 'Harga: Rendah ke Tinggi', 'Harga: Tinggi ke Rendah']

export function ShopPage({ tenant, products }: Props) {
  const [filterOpen, setFilterOpen] = useState(false)
  const [selectedSkinTypes, setSelectedSkinTypes] = useState<string[]>([])
  const [selectedConcerns, setSelectedConcerns] = useState<string[]>([])
  const [sort, setSort] = useState(SORT_OPTIONS[0])
  const [sortOpen, setSortOpen] = useState(false)

  const toggleFilter = <T,>(arr: T[], setArr: (v: T[]) => void, val: T) => {
    setArr(arr.includes(val) ? arr.filter((v) => v !== val) : [...arr, val])
  }

  const filtered = useMemo(() => {
    let list = [...products]
    if (sort === 'Harga: Rendah ke Tinggi') list.sort((a, b) => (a.price ?? 0) - (b.price ?? 0))
    if (sort === 'Harga: Tinggi ke Rendah') list.sort((a, b) => (b.price ?? 0) - (a.price ?? 0))
    return list
  }, [products, sort])

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
          <button
            onClick={() => setFilterOpen((v) => !v)}
            className="flex items-center gap-2 text-[14px] font-bold text-[#1a1c1c] md:hidden"
          >
            <SlidersHorizontal size={16} />
            Filter
          </button>
          <p className="text-[14px] text-[#5b3f43]">{filtered.length} produk</p>
          {/* Sort */}
          <div className="relative">
            <button
              onClick={() => setSortOpen((v) => !v)}
              className="flex items-center gap-2 text-[14px] text-[#1a1c1c] border border-[#e4bdc2] rounded-lg px-3 py-2"
            >
              {sort} <ChevronDown size={14} />
            </button>
            {sortOpen && (
              <div className="absolute right-0 top-full mt-1 bg-white border border-[#e8e8e8] rounded-lg shadow-md z-10 min-w-[200px]">
                {SORT_OPTIONS.map((opt) => (
                  <button
                    key={opt}
                    onClick={() => { setSort(opt); setSortOpen(false) }}
                    className={`w-full text-left px-4 py-2 text-[14px] hover:bg-[#f3f3f3] ${sort === opt ? 'font-bold text-[#e91e63]' : 'text-[#1a1c1c]'}`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-6">
          {/* Sidebar filter — desktop */}
          <aside className="hidden md:block w-64 shrink-0">
            <FilterPanel
              selectedSkinTypes={selectedSkinTypes}
              setSelectedSkinTypes={setSelectedSkinTypes}
              selectedConcerns={selectedConcerns}
              setSelectedConcerns={setSelectedConcerns}
              toggleFilter={toggleFilter}
            />
          </aside>

          {/* Mobile filter sheet */}
          {filterOpen && (
            <div className="fixed inset-0 z-50 md:hidden">
              <div className="absolute inset-0 bg-black/40" onClick={() => setFilterOpen(false)} />
              <div className="absolute bottom-0 inset-x-0 bg-white rounded-t-2xl p-6 max-h-[80vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-headline-md text-[#1a1c1c]">Filter</h3>
                  <button onClick={() => setFilterOpen(false)}><X size={20} /></button>
                </div>
                <FilterPanel
                  selectedSkinTypes={selectedSkinTypes}
                  setSelectedSkinTypes={setSelectedSkinTypes}
                  selectedConcerns={selectedConcerns}
                  setSelectedConcerns={setSelectedConcerns}
                  toggleFilter={toggleFilter}
                />
              </div>
            </div>
          )}

          {/* Product grid */}
          <div className="flex-1">
            {filtered.length === 0 ? (
              <p className="text-[#5b3f43] text-center py-20">Tidak ada produk ditemukan.</p>
            ) : (
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                {filtered.map((product) => (
                  <ShopProductCard key={product.id} product={product} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}

function FilterPanel({
  selectedSkinTypes, setSelectedSkinTypes,
  selectedConcerns, setSelectedConcerns,
  toggleFilter,
}: {
  selectedSkinTypes: string[]
  setSelectedSkinTypes: (v: string[]) => void
  selectedConcerns: string[]
  setSelectedConcerns: (v: string[]) => void
  toggleFilter: <T>(arr: T[], setArr: (v: T[]) => void, val: T) => void
}) {
  return (
    <div className="bg-white border border-[#e8e8e8] rounded-lg p-4 space-y-6">
      {/* Skin Type */}
      <div>
        <p className="text-label-bold text-[#5b3f43] mb-3">SKIN TYPE</p>
        <div className="space-y-2">
          {SKIN_TYPES.map((type) => (
            <label key={type} className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={selectedSkinTypes.includes(type)}
                onChange={() => toggleFilter(selectedSkinTypes, setSelectedSkinTypes, type)}
                className="accent-[#e91e63] w-4 h-4"
              />
              <span className="text-[14px] text-[#1a1c1c]">{type}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Skin Concern */}
      <div>
        <p className="text-label-bold text-[#5b3f43] mb-3">SKIN CONCERN</p>
        <div className="flex flex-wrap gap-2">
          {CONCERNS.map((c) => (
            <button
              key={c}
              onClick={() => toggleFilter(selectedConcerns, setSelectedConcerns, c)}
              className={`px-3 py-1 rounded-full text-[12px] font-bold border transition-colors ${
                selectedConcerns.includes(c)
                  ? 'bg-[#e91e63] text-white border-[#e91e63]'
                  : 'bg-white text-[#1a1c1c] border-[#e4bdc2] hover:border-[#e91e63]'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

function ShopProductCard({ product }: { product: Product }) {
  const [wished, setWished] = useState(false)
  const marketplaceUrl = product.tokopedia_url || product.shopee_url

  return (
    <div className="group bg-white rounded-lg border border-[#e8e8e8] overflow-hidden hover:shadow-[0_4px_15px_rgba(0,0,0,0.05)] transition-shadow">
      <div className="relative aspect-square bg-[#f3f3f3] overflow-hidden">
        {product.image_url ? (
          <Image src={product.image_url} alt={product.name} fill className="object-cover" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-[#e4bdc2] text-4xl">🧴</div>
        )}
        <button
          onClick={() => setWished((v) => !v)}
          className="absolute top-2 right-2 w-7 h-7 flex items-center justify-center bg-white rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <Heart size={14} className={wished ? 'fill-[#e91e63] text-[#e91e63]' : 'text-[#5b3f43]'} />
        </button>
        {marketplaceUrl && (
          <a
            href={marketplaceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="absolute bottom-0 inset-x-0 py-2 bg-[#1a1c1c] text-white text-[11px] font-bold uppercase tracking-wide text-center translate-y-full group-hover:translate-y-0 transition-transform"
          >
            Quick Add
          </a>
        )}
      </div>
      <div className="p-3">
        <p className="text-[14px] font-bold text-[#1a1c1c] line-clamp-2 mb-1">{product.name}</p>
        {product.description && (
          <p className="text-[12px] text-[#5b3f43] line-clamp-2 mb-2">{product.description}</p>
        )}
        {product.price ? (
          <span className="text-price">Rp {product.price.toLocaleString('id-ID')}</span>
        ) : (
          <span className="text-[12px] text-[#8f6f73]">Hubungi untuk harga</span>
        )}
      </div>
    </div>
  )
}
