import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { calculatePricingBreakdown } from '@/lib/utils/pricing'

const PLAN_PRICES: Record<string, number> = { business: 10000, enterprise: 599000 }

export async function POST(req: NextRequest) {
  const { planId, fullName, email, phone, paymentMethod = 'manual_qris', slug } = await req.json()
  if (!planId || !email || !fullName) return NextResponse.json({ error: 'Data tidak lengkap' }, { status: 400 })

  const basePrice = PLAN_PRICES[planId]
  if (!basePrice) return NextResponse.json({ error: 'Plan tidak valid' }, { status: 400 })

  const pricing = calculatePricingBreakdown(basePrice, paymentMethod !== 'manual_qris')
  const service = createServiceClient()
  const externalId = `umkmku_sub_${planId}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`

  // Lookup tenant_id dari slug jika ada (merchant yang upgrade dari dashboard)
  let tenantId: string | null = null
  if (slug) {
    const { data: t } = await service.from('tenants').select('id').eq('slug', slug).single()
    tenantId = t?.id ?? null
  }

  const { data: invoice, error: dbErr } = await service
    .from('subscription_invoices')
    .insert({
      external_id: externalId,
      plan_id: planId,
      email,
      full_name: fullName,
      phone: phone || null,
      amount: pricing.subtotal,
      ppn: pricing.ppn,
      xendit_fee: pricing.xenditFee,
      final_amount: pricing.finalPrice,
      payment_method: paymentMethod,
      tenant_id: tenantId,
    })
    .select('id')
    .single()

  if (dbErr || !invoice) return NextResponse.json({ error: 'Gagal menyimpan invoice' }, { status: 500 })

  if (paymentMethod === 'manual_qris') {
    return NextResponse.json({ redirectUrl: `/subscribe/payment/qris?id=${invoice.id}` })
  }

  // Payment gateway (Xendit), belum tersedia
  await service.from('subscription_invoices').delete().eq('id', invoice.id)
  return NextResponse.json({ error: 'Payment gateway belum tersedia' }, { status: 503 })
}
