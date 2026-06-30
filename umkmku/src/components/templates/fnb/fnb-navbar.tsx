'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ShoppingCart, Menu, X } from 'lucide-react'
import { useCart } from '@/lib/cart-context'
import type { Tenant } from '@/lib/supabase/types'

interface Props { tenant: Tenant }

const NAV_LINKS = [
  { label: 'Home', href: '' },
  { label: 'Menu', href: '/shop' },
]

export function FnbNavbar({ tenant }: Props) {
  const [open, setOpen] = useState(false)
  const { totalCount } = useCart()
  const base = `/store/${tenant.slug}`

  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-gray-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href={base} className="flex items-center gap-2">
            {tenant.logo_url ? (
              <Image src={tenant.logo_url} alt={tenant.brand_name} width={120} height={36} className="object-contain h-9 w-auto" />
            ) : (
              <span className="text-xl font-bold text-[var(--color-primary)]">{tenant.brand_name}</span>
            )}
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-8">
            {NAV_LINKS.map(({ label, href }) => (
              <Link
                key={label}
                href={href.startsWith('#') ? href : `${base}${href}`}
                className="text-sm font-medium text-gray-600 hover:text-[var(--color-primary)] transition-colors"
              >
                {label}
              </Link>
            ))}
          </div>

          {/* Cart + mobile toggle */}
          <div className="flex items-center gap-3">
            <Link
              href={`${base}/cart`}
              className="relative p-2 rounded-full hover:bg-gray-50 transition-colors"
              aria-label="Cart"
            >
              <ShoppingCart size={22} className="text-gray-700" />
              {totalCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-5 h-5 rounded-full bg-[var(--color-primary)] text-white text-[10px] font-bold flex items-center justify-center">
                  {totalCount > 9 ? '9+' : totalCount}
                </span>
              )}
            </Link>
            <button
              className="md:hidden p-2 text-gray-700"
              onClick={() => setOpen(!open)}
              aria-label="Menu"
            >
              {open ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden bg-white border-t border-gray-100 px-4 py-4 flex flex-col gap-4">
          {NAV_LINKS.map(({ label, href }) => (
            <Link
              key={label}
              href={href.startsWith('#') ? href : `${base}${href}`}
              className="text-sm font-medium text-gray-700 py-1"
              onClick={() => setOpen(false)}
            >
              {label}
            </Link>
          ))}
        </div>
      )}
    </nav>
  )
}
