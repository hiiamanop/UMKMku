import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { packageId, tenantId } = await req.json()
  if (!packageId || !tenantId) return NextResponse.json({ error: 'Missing params' }, { status: 400 })

  const service = createServiceClient()

  // Verifikasi user adalah owner tenant
  const { data: tenant } = await service
    .from('tenants')
    .select('id, owner_id, brand_name, whatsapp_number')
    .eq('id', tenantId)
    .single()

  if (!tenant || tenant.owner_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Verifikasi package ada
  const { data: pkg } = await service
    .from('top_up_packages')
    .select('id, name, price, transaction_quota')
    .eq('id', packageId)
    .eq('is_active', true)
    .single()

  if (!pkg) return NextResponse.json({ error: 'Package not found' }, { status: 404 })

  // Buat top-up order (status pending, menunggu konfirmasi admin)
  const { data: topUpOrder } = await service
    .from('top_up_orders')
    .insert({ tenant_id: tenantId, package_id: packageId, status: 'pending' })
    .select('id')
    .single()

  if (!topUpOrder) return NextResponse.json({ error: 'Failed to create order' }, { status: 500 })

  // Notif WA ke merchant dengan instruksi pembayaran
  if (tenant.whatsapp_number) {
    const FONNTE_URL = 'https://api.fonnte.com/send'
    const token = process.env.FONNTE_TOKEN
    const phone = tenant.whatsapp_number.replace(/\D/g, '').replace(/^0/, '62')
    if (token && phone) {
      fetch(FONNTE_URL, {
        method: 'POST',
        headers: { Authorization: token, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          target: phone,
          message: `🛒 *Permintaan Top-up Diterima*, ${tenant.brand_name}

Paket: ${pkg.name} (+${pkg.transaction_quota} pesanan)
Harga: Rp ${pkg.price.toLocaleString('id-ID')}
ID Order: #${topUpOrder.id.slice(-8).toUpperCase()}

Transfer ke rekening UMKMku, lalu kirim bukti ke tim kami untuk aktivasi.
Hubungi: https://wa.me/6281234567890`,
        }),
      }).catch(() => {})
    }
  }

  return NextResponse.json({ ok: true, orderId: topUpOrder.id })
}
