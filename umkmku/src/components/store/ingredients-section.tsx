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

function IngredientItem({ name }: { name: string }) {
  const key = name.toLowerCase().replace(/\s+/g, '-')
  const icon = INGREDIENT_ICONS[key] ?? '◉'
  return (
    <div className="flex flex-col items-center w-24 group cursor-default">
      <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center mb-3 shadow-sm group-hover:shadow-md transition-shadow">
        <span className="text-xl text-[var(--color-primary)]">{icon}</span>
      </div>
      <span className="text-label-caps text-[10px] tracking-widest text-[var(--color-accent)]/70 text-center leading-tight">
        {name.toUpperCase()}
      </span>
    </div>
  )
}

export function IngredientsSection({ products }: Props) {
  const unique = [...new Set(products.flatMap((p) => p.ingredients ?? []))].slice(0, 12)

  if (unique.length === 0) return null

  // Row 1: first 7; Row 2: next items, only shown if at least 5
  const topRow = unique.slice(0, 7)
  const remaining = unique.slice(7)
  const bottomRow = remaining.length >= 5 ? remaining : []

  return (
    <section className="py-20 md:py-28 bg-[var(--color-secondary)] text-center">
      <div className="max-w-2xl mx-auto px-6 mb-16">
        <span className="text-label-caps text-[var(--color-primary)] bg-[var(--color-primary)]/10 px-3 py-1 mb-6 inline-block">
          OUR INGREDIENTS
        </span>
        <h2 className="text-headline-lg mb-4">
          Dirawat oleh <i className="italic">Alam</i>
        </h2>
        <p className="text-body-md text-[var(--color-accent)]/70">
          Produk kami dibuat dari bahan-bahan alami pilihan yang efektif merawat kulit dan ramah bagi bumi.
        </p>
      </div>

      <div className="max-w-5xl mx-auto px-6 flex flex-col items-center gap-8">
        <div className="grid gap-x-8 gap-y-8 justify-items-center"
          style={{ gridTemplateColumns: `repeat(${topRow.length}, minmax(0, 1fr))` }}>
          {topRow.map((ing) => <IngredientItem key={ing} name={ing} />)}
        </div>
        {bottomRow.length > 0 && (
          <div className="grid gap-x-8 gap-y-8 justify-items-center"
            style={{ gridTemplateColumns: `repeat(${bottomRow.length}, minmax(0, 1fr))` }}>
            {bottomRow.map((ing) => <IngredientItem key={ing} name={ing} />)}
          </div>
        )}
      </div>
    </section>
  )
}
