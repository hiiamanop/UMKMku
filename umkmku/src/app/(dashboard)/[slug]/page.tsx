import { createServiceClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ShoppingBag, Clock, TrendingUp, AlertTriangle } from 'lucide-react'

interface Props {
  params: Promise<{ slug: string }>
}

const STATUS_LABELS: Record<string, string> = {
  pending_payment: 'Menunggu Pembayaran',
  payment_submitted: 'Bukti Dikirim',
  payment_verified: 'Pembayaran Terverifikasi',
  processing: 'Diproses',
  shipped: 'Dikirim',
  delivered: 'Selesai',
  cancelled: 'Dibatalkan',
}

const STATUS_COLORS: Record<string, string> = {
  pending_payment: 'bg-amber-100 text-amber-700',
  payment_submitted: 'bg-blue-100 text-blue-700',
  payment_verified: 'bg-green-100 text-green-700',
  processing: 'bg-purple-100 text-purple-700',
  shipped: 'bg-indigo-100 text-indigo-700',
  delivered: 'bg-emerald-100 text-emerald-700',
  cancelled: 'bg-gray-100 text-gray-500',
}

export default async function DashboardOverviewPage({ params }: Props) {
  const { slug } = await params
  const supabase = createServiceClient()

  const { data: tenant } = await supabase
    .from('tenants')
    .select('id, brand_name')
    .eq('slug', slug)
    .single()

  if (!tenant) notFound()

  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

  // All queries in parallel
  const [pendingRes, revenueRes, recentRes, lowStockRes] = await Promise.all([
    supabase
      .from('orders')
      .select('id', { count: 'exact', head: true })
      .eq('tenant_id', tenant.id)
      .in('status', ['pending_payment', 'payment_submitted']),

    supabase
      .from('orders')
      .select('total_amount')
      .eq('tenant_id', tenant.id)
      .in('status', ['payment_verified', 'processing', 'shipped', 'delivered'])
      .gte('created_at', startOfMonth),

    supabase
      .from('orders')
      .select('id, created_at, status, total_amount, customer_name')
      .eq('tenant_id', tenant.id)
      .order('created_at', { ascending: false })
      .limit(5),

    supabase
      .from('products')
      .select('id, name, stock_quantity')
      .eq('tenant_id', tenant.id)
      .eq('is_active', true)
      .eq('is_preorder', false)
      .not('stock_quantity', 'is', null)
      .lte('stock_quantity', 5),
  ])

  const pendingCount = pendingRes.count ?? 0
  const revenue = (revenueRes.data ?? []).reduce((sum, o) => sum + (o.total_amount ?? 0), 0)
  const recentOrders = recentRes.data ?? []
  const lowStockProducts = lowStockRes.data ?? []

  const month = now.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })

  return (
    <div>
      <h1 className="text-headline-lg italic mb-8">Overview</h1>

      {/* Stat cards */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-white border border-black/8 rounded p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-label-caps text-[10px] text-[var(--color-accent)]/50 tracking-widest">PERLU TINDAKAN</p>
              <p className="text-4xl font-serif italic mt-2 text-[var(--color-primary)]">{pendingCount}</p>
              <p className="text-body-md text-[var(--color-accent)]/60 mt-1 text-sm">pesanan menunggu</p>
            </div>
            <Clock size={20} className="text-amber-400 mt-1" />
          </div>
          {pendingCount > 0 && (
            <Link href={`/${slug}/orders`} className="mt-4 block text-label-caps text-[10px] text-[var(--color-primary)] hover:opacity-70 transition-opacity">
              Lihat pesanan →
            </Link>
          )}
        </div>

        <div className="bg-white border border-black/8 rounded p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-label-caps text-[10px] text-[var(--color-accent)]/50 tracking-widest">REVENUE {month.toUpperCase()}</p>
              <p className="text-2xl font-serif italic mt-2">
                {revenue > 0
                  ? `Rp ${revenue.toLocaleString('id-ID')}`
                  : <span className="text-[var(--color-accent)]/30 text-xl">–</span>
                }
              </p>
              <p className="text-body-md text-[var(--color-accent)]/60 mt-1 text-sm">dari pesanan terverifikasi</p>
            </div>
            <TrendingUp size={20} className="text-emerald-400 mt-1" />
          </div>
        </div>

        <div className="bg-white border border-black/8 rounded p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-label-caps text-[10px] text-[var(--color-accent)]/50 tracking-widest">STOK MENIPIS</p>
              <p className="text-4xl font-serif italic mt-2 text-red-500">{lowStockProducts.length}</p>
              <p className="text-body-md text-[var(--color-accent)]/60 mt-1 text-sm">produk ≤ 5 sisa</p>
            </div>
            <AlertTriangle size={20} className="text-red-400 mt-1" />
          </div>
          {lowStockProducts.length > 0 && (
            <Link href={`/${slug}/products`} className="mt-4 block text-label-caps text-[10px] text-[var(--color-primary)] hover:opacity-70 transition-opacity">
              Kelola stok →
            </Link>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Recent orders */}
        <div className="col-span-2 bg-white border border-black/8 rounded">
          <div className="px-6 py-4 border-b border-black/5 flex items-center justify-between">
            <h2 className="text-label-caps text-[10px] tracking-widest text-[var(--color-accent)]/70">PESANAN TERBARU</h2>
            <Link href={`/${slug}/orders`} className="text-label-caps text-[10px] text-[var(--color-primary)] hover:opacity-70 transition-opacity">
              Semua →
            </Link>
          </div>
          {recentOrders.length === 0 ? (
            <div className="px-6 py-12 text-center text-body-md text-[var(--color-accent)]/40 text-sm">
              Belum ada pesanan masuk.
            </div>
          ) : (
            <div className="divide-y divide-black/5">
              {recentOrders.map(order => (
                <div key={order.id} className="px-6 py-4 flex items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="text-body-md font-medium text-sm truncate">
                      {order.customer_name ?? 'Anonim'}
                    </p>
                    <p className="text-label-caps text-[10px] text-[var(--color-accent)]/40 mt-0.5">
                      {new Date(order.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <p className="text-body-md text-sm font-medium shrink-0">
                    Rp {order.total_amount.toLocaleString('id-ID')}
                  </p>
                  <span className={`text-label-caps text-[9px] px-2 py-0.5 rounded-full shrink-0 ${STATUS_COLORS[order.status] ?? 'bg-gray-100 text-gray-500'}`}>
                    {STATUS_LABELS[order.status] ?? order.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Low stock */}
        <div className="bg-white border border-black/8 rounded">
          <div className="px-6 py-4 border-b border-black/5 flex items-center justify-between">
            <h2 className="text-label-caps text-[10px] tracking-widest text-[var(--color-accent)]/70">STOK MENIPIS</h2>
            <ShoppingBag size={14} className="text-[var(--color-accent)]/30" />
          </div>
          {lowStockProducts.length === 0 ? (
            <div className="px-6 py-12 text-center text-body-md text-[var(--color-accent)]/40 text-sm">
              Semua stok aman. 👍
            </div>
          ) : (
            <div className="divide-y divide-black/5">
              {lowStockProducts.map(p => (
                <Link
                  key={p.id}
                  href={`/${slug}/products`}
                  className="px-6 py-3.5 flex items-center justify-between hover:bg-black/[0.02] transition-colors"
                >
                  <p className="text-body-md text-sm truncate pr-2">{p.name}</p>
                  <span className={`text-label-caps text-[9px] px-2 py-0.5 rounded-full shrink-0 ${
                    p.stock_quantity === 0 ? 'bg-red-100 text-red-500' : 'bg-amber-100 text-amber-600'
                  }`}>
                    {p.stock_quantity === 0 ? 'Habis' : `${p.stock_quantity} sisa`}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
