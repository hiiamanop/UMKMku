'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ShoppingBag, Search, User, Menu, X } from 'lucide-react'
import type { Tenant } from '@/lib/supabase/types'

interface Props {
  tenant: Tenant
  cartCount?: number
}

export function StoreNavbar({ tenant, cartCount = 0 }: Props) {
  const [mobileOpen, setMobileOpen] = useState(false)

  const navLinks = [
    { label: 'Shop', href: `/store/${tenant.slug}/shop` },
    { label: 'Ingredients', href: `/store/${tenant.slug}/ingredients` },
    { label: 'Sustainability', href: `/store/${tenant.slug}/sustainability` },
    { label: 'About', href: `/store/${tenant.slug}/about` },
  ]

  return (
    <header className="sticky top-0 z-50 bg-[var(--color-secondary)] border-b border-black/10">
      <div className="px-6 md:px-16 h-[68px] flex items-center justify-between">

        {/* LEFT: hamburger + search */}
        <div className="flex items-center gap-6">
          <button
            aria-label="Toggle menu"
            onClick={() => setMobileOpen((v) => !v)}
            className="text-[var(--color-accent)] hover:text-[var(--color-primary)] transition-colors"
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <button aria-label="Search" className="hidden md:block text-[var(--color-accent)] hover:text-[var(--color-primary)] transition-colors">
            <Search size={20} />
          </button>
        </div>

        {/* CENTER: brand name — italic serif */}
        <Link
          href={`/store/${tenant.slug}`}
          className="absolute left-1/2 -translate-x-1/2 text-headline-md italic text-[var(--color-primary)] tracking-tight"
        >
          {tenant.brand_name}
        </Link>

        {/* RIGHT: nav links (desktop) + icons */}
        <div className="flex items-center gap-6">
          <nav className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-label-caps text-[var(--color-accent)]/70 hover:text-[var(--color-primary)] transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <Link href={`/store/${tenant.slug}/login`} aria-label="Account" className="text-[var(--color-accent)] hover:text-[var(--color-primary)] transition-colors">
            <User size={20} />
          </Link>
          <Link href={`/store/${tenant.slug}/cart`} aria-label="Cart" className="relative text-[var(--color-accent)] hover:text-[var(--color-primary)] transition-colors">
            <ShoppingBag size={20} />
            {cartCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-[var(--color-primary)] text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                {cartCount}
              </span>
            )}
          </Link>
        </div>
      </div>

      {/* Mobile slide-down menu */}
      {mobileOpen && (
        <div className="bg-[var(--color-secondary)] border-t border-black/10 px-6 py-5 flex flex-col gap-4">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className="text-label-caps text-[var(--color-accent)] py-1"
            >
              {link.label}
            </Link>
          ))}
        </div>
      )}
    </header>
  )
}
