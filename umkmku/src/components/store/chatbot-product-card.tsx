import Link from 'next/link'
import Image from 'next/image'
import type { Product } from '@/lib/supabase/types'

interface Props {
  product: Product
  slug: string
}

export function ChatbotProductCard({ product, slug }: Props) {
  return (
    <Link
      href={`/store/${slug}/products/${product.id}`}
      className="flex items-center gap-3 bg-white border border-gray-200 rounded-xl p-3 mt-2 hover:border-[var(--color-primary)]/40 hover:shadow-sm transition-all group"
    >
      <div className="w-14 h-14 rounded-lg bg-gray-50 overflow-hidden shrink-0">
        {product.image_url ? (
          <Image src={product.image_url} alt={product.name} width={56} height={56} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-xl opacity-30">🧴</div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm text-gray-900 truncate">{product.name}</p>
        {product.price && (
          <p className="text-xs text-gray-500 mt-0.5">Rp {product.price.toLocaleString('id-ID')}</p>
        )}
        <p className="text-xs text-[var(--color-primary)] mt-1 group-hover:underline">Lihat produk →</p>
      </div>
    </Link>
  )
}
