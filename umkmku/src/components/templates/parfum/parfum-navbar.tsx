'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ShoppingBag, Heart, Menu, X } from 'lucide-react'
import { useCart } from '@/lib/cart-context'
import type { Tenant } from '@/lib/supabase/types'

interface Props {
  tenant: Tenant
}

export function ParfumNavbar({ tenant }: Props) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const { totalCount } = useCart()
  const { slug } = tenant

  const navLinks = [
    { label: 'Fragrances', href: `/store/${slug}/shop` },
  ]

  return (
    <header className="sticky top-0 z-50 bg-[var(--color-secondary)] border-b border-black/10">
      <div className="px-6 md:px-16 h-[68px] flex items-center justify-between">

        {/* Mobile hamburger */}
        <button
          aria-label="Toggle menu"
          onClick={() => setMobileOpen((v) => !v)}
          className="md:hidden text-[var(--color-primary)]/70 hover:text-[var(--color-primary)] transition-colors"
        >
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>

        {/* LEFT: nav links (desktop) */}
        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="text-[11px] tracking-[0.15em] text-[var(--color-primary)]/60 hover:text-[var(--color-primary)] transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* CENTER: brand name */}
        <Link
          href={`/store/${slug}`}
          className="absolute left-1/2 -translate-x-1/2 font-serif text-xl italic text-[var(--color-primary)] tracking-tight"
        >
          {tenant.brand_name}
        </Link>

        {/* RIGHT: icons */}
        <div className="flex items-center gap-5">
          <Link
            href={`/store/${slug}/profile`}
            aria-label="Wishlist"
            className="hidden md:block text-[var(--color-primary)]/60 hover:text-[var(--color-primary)] transition-colors"
          >
            <Heart size={18} />
          </Link>
          <Link
            href={`/store/${slug}/cart`}
            aria-label={`Cart (${totalCount})`}
            className="relative text-[var(--color-primary)]/60 hover:text-[var(--color-primary)] transition-colors"
          >
            <ShoppingBag size={18} />
            {totalCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-[var(--color-accent)] text-white text-[9px] font-bold flex items-center justify-center rounded-full">
                {totalCount > 9 ? '9+' : totalCount}
              </span>
            )}
          </Link>
        </div>
      </div>

      {/* Mobile full-screen overlay */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 top-[68px] z-40 bg-[var(--color-secondary)] flex flex-col px-8 py-12 gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className="font-serif text-2xl italic text-[var(--color-primary)] border-b border-black/10 pb-4"
            >
              {link.label}
            </Link>
          ))}
          <Link
            href={`/store/${slug}/profile`}
            onClick={() => setMobileOpen(false)}
            className="font-serif text-2xl italic text-[var(--color-primary)]/60 border-b border-black/10 pb-4"
          >
            My Account
          </Link>
        </div>
      )}
    </header>
  )
}
