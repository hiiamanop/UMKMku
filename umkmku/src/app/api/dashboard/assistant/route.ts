import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { deepseekChat } from '@/lib/ai/deepseek'

async function getMerchantContext(tenantId: string, slug: string) {
  const db = createServiceClient()
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()

  const [{ data: tenant }, { data: orders }, { data: products }] = await Promise.all([
    db.from('tenants').select('brand_name, category, description').eq('id', tenantId).single(),
    db.from('orders').select('final_price, status, payment_status, created_at').eq('tenant_id', tenantId).gte('created_at', thirtyDaysAgo),
    db.from('products').select('name, price, stock, is_active').eq('tenant_id', tenantId),
  ])

  const completed = (orders ?? []).filter(o => o.payment_status === 'completed')
  const revenue = completed.reduce((s, o) => s + (o.final_price ?? 0), 0)
  const pending = (orders ?? []).filter(o => ['pending_payment', 'payment_submitted'].includes(o.status)).length
  const activeProducts = (products ?? []).filter(p => p.is_active)
  const lowStock = activeProducts.filter(p => (p.stock ?? 0) <= 5)

  return `Kamu adalah personal assistant untuk merchant "${tenant?.brand_name}" (kategori: ${tenant?.category ?? 'umum'}) di platform UMKMku.

Data toko (30 hari terakhir):
- Revenue: Rp ${revenue.toLocaleString('id-ID')}
- Total pesanan: ${(orders ?? []).length} (${completed.length} selesai, ${pending} menunggu)
- Produk aktif: ${activeProducts.length} produk
- Stok kritis (≤5): ${lowStock.map(p => p.name).join(', ') || 'tidak ada'}

Kamu bisa membantu:
1. Analisis performa penjualan & tren
2. Strategi jualan (pricing, promosi, retensi customer)
3. Cara menggunakan fitur dashboard UMKMku (produk, pesanan, CMS, chatbot toko, dll)
4. Rekomendasi berdasarkan data toko

Jawab dalam Bahasa Indonesia, ringkas dan actionable. Jika ditanya tentang fitur UMKMku, jelaskan dari perspektif merchant.`
}

async function getAdminContext() {
  const db = createServiceClient()
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()

  const [{ count: totalMerchants }, { count: activeMerchants }, { data: recentInvoices }, { count: totalOrders }] = await Promise.all([
    db.from('tenants').select('id', { count: 'exact', head: true }),
    db.from('tenant_subscriptions').select('id', { count: 'exact', head: true }).eq('status', 'active'),
    db.from('subscription_invoices').select('plan_id, final_amount, status').gte('created_at', thirtyDaysAgo),
    db.from('orders').select('id', { count: 'exact', head: true }).gte('created_at', thirtyDaysAgo),
  ])

  const paidInvoices = (recentInvoices ?? []).filter(i => i.status === 'paid')
  const subscriptionRevenue = paidInvoices.reduce((s, i) => s + (i.final_amount ?? 0), 0)

  return `Kamu adalah personal assistant untuk admin platform UMKMku.

Data platform (30 hari terakhir):
- Total merchant: ${totalMerchants ?? 0} (${activeMerchants ?? 0} aktif berlangganan)
- Invoice berbayar: ${paidInvoices.length} (Revenue: Rp ${subscriptionRevenue.toLocaleString('id-ID')})
- Total pesanan di semua toko: ${totalOrders ?? 0}

Kamu bisa membantu:
1. Analisis performa platform & tren
2. Insight strategi pertumbuhan merchant
3. Cara menggunakan fitur admin (invoice, merchant management, settings, dll)
4. Rekomendasi product/bisnis berdasarkan data platform

Jawab dalam Bahasa Indonesia, ringkas dan actionable.`
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { messages, tenantId, slug, isAdmin } = await req.json()
  if (!messages?.length) return NextResponse.json({ error: 'No messages' }, { status: 400 })

  const db = createServiceClient()

  // Verifikasi akses
  if (isAdmin) {
    const { data: profile } = await db.from('user_profiles').select('role').eq('id', user.id).single()
    if (profile?.role !== 'super_admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  } else {
    const { data: tenant } = await db.from('tenants').select('owner_id').eq('id', tenantId).single()
    if (tenant?.owner_id !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const systemPrompt = isAdmin
    ? await getAdminContext()
    : await getMerchantContext(tenantId, slug)

  const text = await deepseekChat(messages, systemPrompt)
  return NextResponse.json({ text })
}
