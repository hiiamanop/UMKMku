import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

type Period = 'daily' | 'weekly' | 'monthly'

const toK = (n: number) => Math.round(n / 100) / 10  // 2100 → 2.1

function buildLabels(period: Period, rows: { date: string; tokens_used: number; orders_used: number; addon_used: number }[]) {
  if (period === 'daily') {
    const result: Record<string, { label: string; tokens: number; orders: number; addon: number }> = {}
    for (let i = 29; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i)
      const key = d.toISOString().slice(0, 10)
      result[key] = { label: d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }), tokens: 0, orders: 0, addon: 0 }
    }
    for (const r of rows) {
      if (result[r.date]) {
        result[r.date].tokens = toK(r.tokens_used)
        result[r.date].orders = r.orders_used
        result[r.date].addon = r.addon_used
      }
    }
    return Object.values(result)
  }

  if (period === 'weekly') {
    const weeks: Record<string, { label: string; tokens: number; orders: number; addon: number }> = {}
    for (let i = 11; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i * 7)
      const mon = new Date(d); mon.setDate(d.getDate() - ((d.getDay() + 6) % 7))
      const key = mon.toISOString().slice(0, 10)
      weeks[key] = { label: mon.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }), tokens: 0, orders: 0, addon: 0 }
    }
    for (const r of rows) {
      const d = new Date(r.date)
      const mon = new Date(d); mon.setDate(d.getDate() - ((d.getDay() + 6) % 7))
      const key = mon.toISOString().slice(0, 10)
      if (weeks[key]) {
        weeks[key].tokens = toK(weeks[key].tokens * 1000 + r.tokens_used)
        weeks[key].orders += r.orders_used
        weeks[key].addon += r.addon_used
      }
    }
    return Object.values(weeks)
  }

  const months: Record<string, { label: string; tokens: number; orders: number; addon: number }> = {}
  for (let i = 11; i >= 0; i--) {
    const d = new Date(); d.setMonth(d.getMonth() - i, 1)
    const key = d.toISOString().slice(0, 7)
    months[key] = { label: d.toLocaleDateString('id-ID', { month: 'short', year: '2-digit' }), tokens: 0, orders: 0, addon: 0 }
  }
  for (const r of rows) {
    const key = r.date.slice(0, 7)
    if (months[key]) {
      months[key].tokens = toK(months[key].tokens * 1000 + r.tokens_used)
      months[key].orders += r.orders_used
      months[key].addon += r.addon_used
    }
  }
  return Object.values(months)
}

export async function GET(req: NextRequest) {
  const tenantId = req.nextUrl.searchParams.get('tenantId')
  const period = (req.nextUrl.searchParams.get('period') ?? 'daily') as Period
  if (!tenantId) return NextResponse.json({ error: 'Missing tenantId' }, { status: 400 })

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const db = createServiceClient()
  const { data: tenant } = await db.from('tenants').select('owner_id').eq('id', tenantId).single()
  if (!tenant || tenant.owner_id !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  // Fetch raw daily rows (last 365 days covers all periods)
  const since = new Date(); since.setFullYear(since.getFullYear() - 1)
  const { data: rows } = await db
    .from('tenant_usage_daily')
    .select('date, tokens_used, orders_used, addon_used')
    .eq('tenant_id', tenantId)
    .gte('date', since.toISOString().slice(0, 10))
    .order('date')

  const today = new Date().toISOString().slice(0, 10)
  const allRows = rows ?? []

  // Fallback: jika hari ini belum ada entry harian, inject dari tenant_subscriptions
  if (!allRows.find(r => r.date === today)) {
    const { data: sub } = await db
      .from('tenant_subscriptions')
      .select('ai_tokens_used, transactions_used, transactions_addon_used')
      .eq('tenant_id', tenantId)
      .maybeSingle()
    if (sub && (sub.ai_tokens_used > 0 || sub.transactions_used > 0)) {
      allRows.push({
        date: today,
        tokens_used: sub.ai_tokens_used,
        orders_used: sub.transactions_used,
        addon_used: (sub as any).transactions_addon_used ?? 0,
      })
    }
  }

  return NextResponse.json({ data: buildLabels(period, allRows) })
}
