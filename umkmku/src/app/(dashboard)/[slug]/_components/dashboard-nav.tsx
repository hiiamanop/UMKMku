'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
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


const linkCls = 'px-4 py-2.5 text-xs tracking-widest uppercase font-sans transition-all rounded-sm'

export function DashboardNav({ slug, pendingCount = 0 }: { slug: string; pendingCount?: number }) {
  const pathname = usePathname()
  return (
    <nav className="flex flex-col gap-1">
      {topTabs.map((tab) => {
        const href = `/${slug}${tab.path}`
        const isActive = tab.path === ''
          ? pathname === `/${slug}` || pathname === `/${slug}/`
          : pathname.startsWith(`/${slug}${tab.path}`)
        const showBadge = tab.badge === 'pending' && pendingCount > 0

        return (
          <Link
            key={tab.path}
            href={href}
            className={cn(
              linkCls, 'flex items-center justify-between',
              isActive ? 'opacity-100 font-semibold' : 'opacity-50 hover:opacity-75'
            )}
            style={{
              color: 'var(--color-sidebar-text)',
              background: isActive ? 'color-mix(in srgb, var(--color-sidebar-text) 12%, transparent)' : undefined,
            }}
          >
            <span>{tab.label}</span>
            {showBadge && (
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center"
                style={{ background: 'var(--color-sidebar-text)', color: 'var(--color-primary)' }}>
                {pendingCount}
              </span>
            )}
          </Link>
        )
      })}

    </nav>
  )
}
