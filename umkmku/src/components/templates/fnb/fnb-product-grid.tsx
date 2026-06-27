import Link from 'next/link'
import { FnbProductCard } from './fnb-product-card'
import type { Product, Tenant } from '@/lib/supabase/types'

interface Props {
  tenant: Tenant
  products: Product[]
}

const CATEGORY_TABS = ['Semua', 'Makanan', 'Minuman', 'Snack', 'Siap Saji']

export function FnbProductGrid({ tenant, products }: Props) {
  const featured = products.slice(0, 8)

  return (
    <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
        <div>
          <p className="text-[var(--color-primary)] font-semibold text-sm mb-1">Pilihan Terbaik</p>
          <h2 className="text-3xl font-black text-gray-900">Menu Kami</h2>
        </div>
        <Link
          href={`/store/${tenant.slug}/shop`}
          className="text-sm font-semibold text-[var(--color-primary)] hover:underline whitespace-nowrap"
        >
          Lihat Semua →
        </Link>
      </div>

      {/* Category tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-8 scrollbar-hide">
        {CATEGORY_TABS.map((tab, i) => (
          <span
            key={tab}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap cursor-default transition-colors ${
              i === 0
                ? 'bg-[var(--color-primary)] text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {tab}
          </span>
        ))}
      </div>

      {featured.length === 0 ? (
        <div className="text-center py-16 text-gray-400">Belum ada produk tersedia.</div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {featured.map((p) => (
            <FnbProductCard key={p.id} product={p} slug={tenant.slug} />
          ))}
        </div>
      )}
    </section>
  )
}
