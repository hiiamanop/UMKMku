'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

const topTabs = [
  { label: 'Overview', path: '' },
  { label: 'Brand & Kontak', path: '/brand' },
  { label: 'Produk', path: '/products' },
  { label: 'Pesanan', path: '/orders', badge: 'pending' },
  { label: 'Chat', path: '/chats' },
  { label: 'Tampilan', path: '/appearance' },
  { label: 'Chatbot', path: '/chatbot' },
  { label: 'Langganan', path: '/subscription' },
]

const pageSubTabs = [
  { label: 'Ingredients', path: '/pages/ingredients' },
  { label: 'Sustainability', path: '/pages/sustainability' },
  { label: 'About', path: '/pages/about' },
  { label: 'Login & Register', path: '/pages/auth' },
]

const linkCls = 'px-4 py-2.5 text-xs tracking-widest uppercase font-sans transition-all rounded-sm'
const activeCls = 'bg-white/15 text-white font-semibold'
const inactiveCls = 'text-white/50 hover:text-white/80 hover:bg-white/5'

export function DashboardNav({ slug, pendingCount = 0 }: { slug: string; pendingCount?: number }) {
  const pathname = usePathname()
  const isPagesActive = pathname.startsWith(`/${slug}/pages`)
  const [pagesOpen, setPagesOpen] = useState(isPagesActive)

  return (
    <nav className="flex flex-col gap-1">
      {topTabs.map((tab) => {
        const href = `/${slug}${tab.path}`
        const isActive = tab.path === ''
          ? pathname === `/${slug}` || pathname === `/${slug}/`
          : pathname.startsWith(`/${slug}${tab.path}`)
        const showBadge = tab.badge === 'pending' && pendingCount > 0

        return (
          <Link key={tab.path} href={href} className={cn(linkCls, 'flex items-center justify-between', isActive ? activeCls : inactiveCls)}>
            <span>{tab.label}</span>
            {showBadge && (
              <span className="bg-white/90 text-[var(--color-primary)] text-[9px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                {pendingCount}
              </span>
            )}
          </Link>
        )
      })}

      {/* Halaman dropdown */}
      <button
        type="button"
        onClick={() => setPagesOpen(v => !v)}
        className={cn(linkCls, 'flex items-center justify-between w-full text-left', isPagesActive ? activeCls : inactiveCls)}
      >
        Halaman
        <ChevronDown size={12} className={cn('transition-transform', pagesOpen ? 'rotate-180' : '')} />
      </button>

      {pagesOpen && (
        <div className="ml-3 flex flex-col gap-0.5 border-l border-white/10 pl-3">
          {pageSubTabs.map((sub) => {
            const href = `/${slug}${sub.path}`
            const isActive = pathname.startsWith(href)
            return (
              <Link key={sub.path} href={href} className={cn(linkCls, 'py-2', isActive ? activeCls : inactiveCls)}>
                {sub.label}
              </Link>
            )
          })}
        </div>
      )}
    </nav>
  )
}
