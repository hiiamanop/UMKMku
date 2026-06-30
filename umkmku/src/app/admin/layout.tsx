import { redirect } from 'next/navigation'
import Link from 'next/link'
import { cookies, headers } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import { createServiceClient } from '@/lib/supabase/server'
import { AssistantChat } from '@/components/dashboard/AssistantChat'

const NAV = [
  { href: '/admin', label: 'Overview' },
  { href: '/admin/invoices', label: 'Invoice' },
  { href: '/admin/articles', label: 'Artikel' },
  { href: '/admin/merchants/ongoing', label: 'Ongoing' },
  { href: '/admin/merchants/leads', label: 'Leads' },
  { href: '/admin/promos', label: 'Kode Promo' },
  { href: '/admin/categories', label: 'Kategori' },
  { href: '/admin/templates', label: 'Templates' },
  { href: '/admin/settings', label: 'Pengaturan' },
]

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // Login page tidak perlu layout admin
  const headersList = await headers()
  const pathname = headersList.get('x-pathname') ?? ''
  if (pathname === '/admin/login') return <>{children}</>

  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  )

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/admin/login')

  const db = createServiceClient()
  const { data: profile } = await db
    .from('user_profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'super_admin') redirect('/')

  return (
    <div className="min-h-screen flex bg-[#F8FAFC] font-sans">
      <aside className="w-52 bg-[#0A2F73] flex flex-col shrink-0">
        <div className="px-5 py-5 border-b border-white/10">
          <img src="/logo.png" alt="UMKMu" style={{ height: '32px', width: 'auto' }} />
          <span className="ml-2 text-xs text-white/40">Admin</span>
        </div>
        <nav className="flex flex-col gap-1 p-3 flex-1">
          {NAV.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className="px-3 py-2 rounded-lg text-sm text-white/70 hover:bg-white/10 hover:text-white transition-colors"
            >
              {label}
            </Link>
          ))}
        </nav>
        <div className="p-3 border-t border-white/10">
          <div className="text-xs text-white/40 px-3">{user.email}</div>
        </div>
      </aside>
      <main className="flex-1 p-8 overflow-auto">{children}</main>
      <AssistantChat isAdmin />
    </div>
  )
}
