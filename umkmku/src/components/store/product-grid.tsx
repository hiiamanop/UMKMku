import type { Product } from '@/lib/supabase/types'
import { ProductCard } from './product-card'

interface Props {
  products: Product[]
}

export function ProductGrid({ products }: Props) {
  return (
    <section id="products" className="bg-[#f9f9f9] py-16 md:py-20">
      <div className="max-w-[1200px] mx-auto px-4 md:px-6">
        {/* Section header */}
        <div className="mb-10">
          <p className="text-label-bold text-[#8f6f73] mb-2">OUR COLLECTION</p>
          <h2 className="text-headline-lg text-[#1a1c1c]">Produk Pilihan</h2>
        </div>

        {products.length === 0 ? (
          <p className="text-[#5b3f43] text-center py-16">Produk segera hadir.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
