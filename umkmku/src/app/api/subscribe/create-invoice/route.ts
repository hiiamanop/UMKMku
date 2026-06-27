import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { createXenditInvoice } from '@/lib/xendit'
import { calculatePricingBreakdown } from '@/lib/utils/pricing'

const PLAN_PRICES: Record<string, number> = {
  business: 399000,
  enterprise: 599000,
}

const PLAN_NAMES: Record<string, string> = {
  business: 'Business',
  enterprise: 'Enterprise',
}

export async function POST(req: NextRequest) {
  const { planId, fullName, email, phone } = await req.json()

  if (!planId || !email || !fullName) {
    return NextResponse.json({ error: 'Data tidak lengkap' }, { status: 400 })
  }

  const basePrice = PLAN_PRICES[planId]
  if (!basePrice) return NextResponse.json({ error: 'Plan tidak valid' }, { status: 400 })

  const pricing = calculatePricingBreakdown(basePrice)
  const service = createServiceClient()

  const externalId = `umkmku_sub_${planId}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://umkmku.com'

  // Simpan dulu ke DB sebelum hit Xendit
  const { data: invoice, error: dbErr } = await service
    .from('subscription_invoices')
    .insert({
      external_id: externalId,
      plan_id: planId,
      email,
      full_name: fullName,
      amount: pricing.subtotal,
      ppn: pricing.ppn,
      xendit_fee: pricing.xenditFee,
      final_amount: pricing.finalPrice,
    })
    .select('id')
    .single()

  if (dbErr || !invoice) {
    return NextResponse.json({ error: 'Gagal menyimpan invoice' }, { status: 500 })
  }

  try {
    const xenditInvoice = await createXenditInvoice({
      externalId,
      amount: pricing.finalPrice,
      payerEmail: email,
      description: `UMKMku ${PLAN_NAMES[planId]} — Langganan 1 Bulan`,
      successRedirectUrl: `${appUrl}/subscribe/success?invoice=${invoice.id}`,
      failureRedirectUrl: `${appUrl}/subscribe/checkout?plan=${planId}&error=payment_failed`,
      items: [
        {
          name: `UMKMku ${PLAN_NAMES[planId]}`,
          quantity: 1,
          price: pricing.subtotal,
          category: 'Software Subscription',
        },
        { name: 'PPN 12%', quantity: 1, price: pricing.ppn, category: 'Tax' },
        { name: 'Biaya Payment Gateway (2.5%)', quantity: 1, price: pricing.xenditFee, category: 'Fee' },
      ],
    })

    // Update DB dengan data Xendit
    await service
      .from('subscription_invoices')
      .update({ xendit_invoice_id: xenditInvoice.id, xendit_invoice_url: xenditInvoice.invoice_url })
      .eq('id', invoice.id)

    // Simpan phone ke session storage via cookie supaya success page bisa pakai
    const response = NextResponse.json({ invoiceUrl: xenditInvoice.invoice_url })
    if (phone) response.cookies.set('sub_phone', phone, { maxAge: 3600, httpOnly: false, path: '/' })
    return response
  } catch (err) {
    // Hapus invoice orphan jika Xendit gagal
    await service.from('subscription_invoices').delete().eq('id', invoice.id)
    const msg = err instanceof Error ? err.message : 'Gagal membuat invoice Xendit'
    return NextResponse.json({ error: msg }, { status: 502 })
  }
}
