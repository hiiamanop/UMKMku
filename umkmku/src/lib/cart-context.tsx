'use client'

import { createContext, useContext, useEffect, useState } from 'react'

export interface CartItem {
  productId: string
  name: string
  price: number
  imageUrl: string | null
  quantity: number
}

interface CartCtx {
  items: CartItem[]
  addItem: (item: Omit<CartItem, 'quantity'>) => void
  removeItem: (productId: string) => void
  updateQty: (productId: string, qty: number) => void
  clearCart: () => void
  totalCount: number
  totalPrice: number
}

const CartContext = createContext<CartCtx | null>(null)

const KEY = 'umkmku_cart'

export function CartProvider({ slug, children }: { slug: string; children: React.ReactNode }) {
  const storageKey = `${KEY}_${slug}`
  const [items, setItems] = useState<CartItem[]>([])

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey)
      if (raw) setItems(JSON.parse(raw))
    } catch {}
  }, [storageKey])

  function persist(next: CartItem[]) {
    setItems(next)
    localStorage.setItem(storageKey, JSON.stringify(next))
  }

  function addItem(item: Omit<CartItem, 'quantity'>) {
    setItems(prev => {
      const existing = prev.find(i => i.productId === item.productId)
      const next = existing
        ? prev.map(i => i.productId === item.productId ? { ...i, quantity: i.quantity + 1 } : i)
        : [...prev, { ...item, quantity: 1 }]
      localStorage.setItem(storageKey, JSON.stringify(next))
      return next
    })
  }

  function removeItem(productId: string) {
    persist(items.filter(i => i.productId !== productId))
  }

  function updateQty(productId: string, qty: number) {
    if (qty <= 0) { removeItem(productId); return }
    persist(items.map(i => i.productId === productId ? { ...i, quantity: qty } : i))
  }

  function clearCart() { persist([]) }

  const totalCount = items.reduce((s, i) => s + i.quantity, 0)
  const totalPrice = items.reduce((s, i) => s + i.price * i.quantity, 0)

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, updateQty, clearCart, totalCount, totalPrice }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be inside CartProvider')
  return ctx
}
