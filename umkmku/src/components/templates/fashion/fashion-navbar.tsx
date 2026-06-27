'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ShoppingBag, Search, User, Menu, X } from 'lucide-react'
import type { Tenant } from '@/lib/supabase/types'

interface Props {
  tenant: Tenant
}

export function FashionNavbar({ tenant }: Props) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const { slug } = tenant

  const navLinks = [
    { label: 'SHOP', href: `/store/${slug}/shop` },
    { label: 'COLLECTIONS', href: `/store/${slug}/shop` },
    { label: 'ABOUT', href: `/store/${slug}/about` },
  ]

  return (
    <header className="sticky top-0 z-50 bg-[var(--color-secondary)] border-b border-black/10">
      <div className="px-6 md:px-16 h-[68px] flex items-center justify-between">

        {/* LEFT: nav links (desktop) */}
        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.href + link.label}
              href={link.href}
              className="text-[10px] tracking-widest uppercase text-[var(--color-accent)]/70 hover:text-[var(--color-primary)] transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Mobile hamburger */}
        <button
          aria-label="Toggle menu"
          onClick={() => setMobileOpen((v) => !v)}
          className="md:hidden text-[var(--color-accent)] hover:text-[var(--color-primary)] transition-colors"
        >
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>

        {/* CENTER: brand name */}
        <Link
          href={`/store/${slug}`}
          className="absolute left-1/2 -translate-x-1/2 text-xl md:text-2xl font-bold italic tracking-tight text-[var(--color-primary)]"
        >
          {tenant.brand_name}
        </Link>

        {/* RIGHT: icons */}
        <div className="flex items-center gap-5">
          <button
            aria-label="Search"
            className="hidden md:block text-[var(--color-accent)] hover:text-[var(--color-primary)] transition-colors"
          >
            <Search size={18} />
          </button>
          <Link
            href={`/store/${slug}/profile`}
            aria-label="Account"
            className="text-[var(--color-accent)] hover:text-[var(--color-primary)] transition-colors"
          >
            <User size={18} />
          </Link>
          <Link
            href={`/store/${slug}/cart`}
            aria-label="Cart"
            className="relative text-[var(--color-accent)] hover:text-[var(--color-primary)] transition-colors"
          >
            <ShoppingBag size={18} />
          </Link>
        </div>
      </div>

      {/* Mobile slide-down menu */}
      {mobileOpen && (
        <div className="bg-[var(--color-secondary)] border-t border-black/10 px-6 py-5 flex flex-col gap-4 md:hidden">
          {navLinks.map((link) => (
            <Link
              key={link.href + link.label}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className="text-[10px] tracking-widest uppercase text-[var(--color-accent)] py-1"
            >
              {link.label}
            </Link>
          ))}
        </div>
      )}
    </header>
  )
}
