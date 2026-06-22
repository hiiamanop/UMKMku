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
    <header className="sticky top-0 z-50 bg-white border-b border-[#e8e8e8]">
      <div className="max-w-[1200px] mx-auto px-4 md:px-6 h-[72px] flex items-center justify-between">
        {/* Logo */}
        <Link
          href={`/store/${tenant.slug}`}
          className="text-[#1a1c1c] font-bold text-xl tracking-tight shrink-0"
        >
          {tenant.brand_name}
        </Link>

        {/* Nav links — desktop */}
        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-[14px] font-medium text-[#5b3f43] hover:text-[#1a1c1c] transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Icons — desktop */}
        <div className="hidden md:flex items-center gap-4">
          <button
            aria-label="Search"
            className="text-[#1a1c1c] hover:text-[#e91e63] transition-colors"
          >
            <Search size={20} />
          </button>
          <button
            aria-label="Account"
            className="text-[#1a1c1c] hover:text-[#e91e63] transition-colors"
          >
            <User size={20} />
          </button>
          <Link
            href={`/store/${tenant.slug}/cart`}
            aria-label="Cart"
            className="relative text-[#1a1c1c] hover:text-[#e91e63] transition-colors"
          >
            <ShoppingBag size={20} />
            {cartCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-[#e91e63] text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                {cartCount}
              </span>
            )}
          </Link>
        </div>

        {/* Mobile: cart + hamburger */}
        <div className="flex md:hidden items-center gap-3">
          <Link
            href={`/store/${tenant.slug}/cart`}
            aria-label="Cart"
            className="relative text-[#1a1c1c]"
          >
            <ShoppingBag size={20} />
            {cartCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-[#e91e63] text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                {cartCount}
              </span>
            )}
          </Link>
          <button
            aria-label="Toggle menu"
            onClick={() => setMobileOpen((v) => !v)}
            className="text-[#1a1c1c]"
          >
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden bg-white border-t border-[#e8e8e8] px-4 py-4 flex flex-col gap-4">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className="text-[15px] font-medium text-[#1a1c1c] py-1"
            >
              {link.label}
            </Link>
          ))}
          <div className="flex gap-4 pt-2 border-t border-[#e8e8e8]">
            <button aria-label="Search" className="text-[#1a1c1c]">
              <Search size={20} />
            </button>
            <button aria-label="Account" className="text-[#1a1c1c]">
              <User size={20} />
            </button>
          </div>
        </div>
      )}
    </header>
  )
}
