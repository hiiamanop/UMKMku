import type { Product } from '@/lib/supabase/types'

interface Props {
  products: Product[]
}

const INGREDIENT_ICONS: Record<string, string> = {
  'niacinamide': '✦',
  'vitamin-c': '○',
  'retinol': '◈',
  'ceramide': '◇',
  'hyaluronic-acid': '◉',
  'bakuchiol': '✿',
  'aloe-vera': '❋',
  'jojoba': '◎',
  'green-tea': '❁',
  'chamomile': '✾',
}

export function IngredientsSection({ products }: Props) {
  // Collect unique ingredients from all products
  const allIngredients = products.flatMap((p) => p.ingredients ?? [])
  const unique = [...new Set(allIngredients)].slice(0, 10)

  if (unique.length === 0) return null

  return (
    <section className="py-20 md:py-28 bg-[var(--color-secondary)] text-center">
      {/* Header */}
      <div className="max-w-2xl mx-auto px-6 mb-16">
        <span className="text-label-caps text-[var(--color-primary)] bg-[var(--color-primary)]/10 px-3 py-1 mb-6 inline-block">
          OUR INGREDIENTS
        </span>
        <h2 className="text-headline-lg mb-4">
          Dirawat oleh{' '}
          <i className="italic">Alam</i>
        </h2>
        <p className="text-body-md text-[var(--color-accent)]/70">
          Produk kami dibuat dari bahan-bahan alami pilihan yang efektif merawat kulit dan ramah bagi bumi.
        </p>
      </div>

      {/* Ingredients grid */}
      <div className="max-w-4xl mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
          {unique.map((ing) => {
            const key = ing.toLowerCase().replace(/\s+/g, '-')
            const icon = INGREDIENT_ICONS[key] ?? '◉'
            return (
              <div key={ing} className="flex flex-col items-center group cursor-default">
                <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center mb-4 shadow-sm group-hover:shadow-md transition-shadow">
                  <span className="text-xl text-[var(--color-primary)]">{icon}</span>
                </div>
                <span className="text-label-caps text-[10px] tracking-widest text-[var(--color-accent)]/70 text-center">
                  {ing.toUpperCase()}
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
