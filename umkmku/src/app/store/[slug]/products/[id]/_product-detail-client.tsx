'use client'

import { useState, useRef, useEffect } from 'react'
import { Plus, Minus, ShoppingBag, Check } from 'lucide-react'
import { useCart } from '@/lib/cart-context'

interface AccordionItem {
  key: string
  label: string
  content: string
}

interface Props {
  accordions: AccordionItem[]
  product: { id: string; name: string; price: number | null; image_url: string | null; stock_quantity?: number | null; is_preorder?: boolean }
}

export function ProductDetailClient({ accordions, product }: Props) {
  const { addItem } = useCart()
  const outOfStock = product.stock_quantity !== null && product.stock_quantity !== undefined && product.stock_quantity <= 0 && !product.is_preorder
  const [open, setOpen] = useState<string | null>(null)
  const [addState, setAddState] = useState<'idle' | 'flying' | 'done'>('idle')
  const [flyOrigin, setFlyOrigin] = useState({ x: 0, y: 0 })
  const [flyDest, setFlyDest] = useState({ x: 0, y: 0 })
  const [flyPhase, setFlyPhase] = useState<'start' | 'end'>('start')
  const btnRef = useRef<HTMLButtonElement>(null)

  function handleAddToCart() {
    if (addState !== 'idle') return
    addItem({ productId: product.id, name: product.name, price: product.price ?? 0, imageUrl: product.image_url })
    const btnRect = btnRef.current?.getBoundingClientRect()
    const cartRect = document.getElementById('cart-nav-icon')?.getBoundingClientRect()
    if (!btnRect) return
    setFlyOrigin({ x: btnRect.left + btnRect.width / 2, y: btnRect.top + btnRect.height / 2 })
    setFlyDest(cartRect
      ? { x: cartRect.left + cartRect.width / 2, y: cartRect.top + cartRect.height / 2 }
      : { x: window.innerWidth - 56, y: 34 }
    )
    setFlyPhase('start')
    setAddState('flying')
    setTimeout(() => setAddState('done'), 750)
    setTimeout(() => setAddState('idle'), 2200)
  }

  useEffect(() => {
    if (addState === 'flying') {
      const raf = requestAnimationFrame(() =>
        requestAnimationFrame(() => setFlyPhase('end'))
      )
      return () => cancelAnimationFrame(raf)
    }
  }, [addState])

  return (
    <>
      {/* Flying cart icon */}
      {addState === 'flying' && (
        <div
          className="fixed z-[9999] pointer-events-none"
          style={{
            left: flyOrigin.x,
            top: flyOrigin.y,
            transform: flyPhase === 'end'
              ? `translate(-50%, -50%) translate(${flyDest.x - flyOrigin.x}px, ${flyDest.y - flyOrigin.y}px) scale(0.3)`
              : 'translate(-50%, -50%) scale(1)',
            opacity: flyPhase === 'end' ? 0 : 1,
            transition: 'transform 0.7s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.7s ease-in',
          }}
        >
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center"
            style={{ background: 'var(--color-primary)' }}
          >
            <ShoppingBag size={18} className="text-white" />
          </div>
        </div>
      )}

      {/* Stock info */}
      {product.is_preorder && (
        <p className="text-[11px] font-semibold text-[#e91e63] uppercase tracking-widest mb-3">Pre-Order</p>
      )}
      {!product.is_preorder && product.stock_quantity !== null && product.stock_quantity !== undefined && (
        <p className={`text-[11px] mb-3 ${product.stock_quantity <= 0 ? 'text-red-500 font-medium' : product.stock_quantity <= 5 ? 'text-amber-600' : 'text-[var(--color-accent)]/50'}`}>
          {product.stock_quantity <= 0 ? 'Stok habis' : `Stok tersedia: ${product.stock_quantity}`}
        </p>
      )}

      {/* CTA */}
      <button
        ref={btnRef}
        onClick={handleAddToCart}
        disabled={addState !== 'idle' || outOfStock}
        className={`w-full py-4 text-label-caps tracking-widest flex items-center justify-center gap-3 transition-opacity mb-10 ${
          outOfStock
            ? 'bg-[var(--color-secondary)] text-[var(--color-accent)]/40 cursor-not-allowed border border-black/10'
            : 'bg-[var(--color-primary)] text-white hover:opacity-90 disabled:cursor-default'
        }`}
      >
        {outOfStock ? (
          <>STOK HABIS</>
        ) : addState === 'done' ? (
          <>
            <Check size={14} />
            ADDED TO CART
          </>
        ) : (
          <>
            <ShoppingBag size={14} className={addState === 'flying' ? 'animate-bounce' : ''} />
            ADD TO CART
          </>
        )}
      </button>

      {/* Accordion */}
      <div className="border-t border-black/10">
        {accordions.map(({ key, label, content }) => (
          <div key={key} className="border-b border-black/10">
            <button
              onClick={() => setOpen(open === key ? null : key)}
              className="w-full py-4 flex justify-between items-center text-left"
            >
              <span className="text-label-caps">{label}</span>
              {open === key
                ? <Minus size={16} className="text-[var(--color-accent)]/50 shrink-0" />
                : <Plus size={16} className="text-[var(--color-accent)]/50 shrink-0" />
              }
            </button>
            {open === key && (
              <p className="pb-5 text-body-md text-[var(--color-accent)]/70 leading-relaxed italic">
                {content}
              </p>
            )}
          </div>
        ))}
      </div>
    </>
  )
}
