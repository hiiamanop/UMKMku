import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { notifyMerchantQuotaWarning } from '@/lib/notifications/whatsapp'

// Vercel Cron: jalankan sekali sehari jam 01:00 WIB (18:00 UTC)
// Suspend tenant yang trial/subscription-nya sudah expired
export async function GET(req: NextRequest) {
  if (req.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createServiceClient()
  const now = new Date().toISOString()

  // Ambil semua subscription yang expired tapi belum di-suspend
  const { data: expired } = await supabase
    .from('tenant_subscriptions')
    .select('id, tenant_id, plan_id, status, trial_ends_at, current_period_end, suspended_notified')
    .or(`and(status.eq.trial,trial_ends_at.lt.${now}),and(status.eq.active,current_period_end.lt.${now})`)

  if (!expired?.length) return NextResponse.json({ suspended: 0 })

  const tenantIds = expired.map(s => s.tenant_id)

  // Ambil data tenant untuk notifikasi
  const { data: tenants } = await supabase
    .from('tenants')
    .select('id, brand_name, owner_email, whatsapp_number')
    .in('id', tenantIds)

  const tenantMap = new Map((tenants ?? []).map(t => [t.id, t]))

  let suspendedCount = 0

  for (const sub of expired) {
    const tenant = tenantMap.get(sub.tenant_id)
    if (!tenant) continue

    // Suspend subscription
    await supabase
      .from('tenant_subscriptions')
      .update({ status: 'suspended', suspended_notified: true })
      .eq('id', sub.id)

    // Set toko jadi tidak aktif
    await supabase
      .from('tenants')
      .update({ is_active: false })
      .eq('id', sub.tenant_id)

    // Notif WA ke owner (jika belum dikirim)
    if (!sub.suspended_notified && tenant.whatsapp_number) {
      const isTrial = sub.status === 'trial'
      await notifyMerchantSuspended({
        merchantWa: tenant.whatsapp_number,
        brandName: tenant.brand_name,
        isTrial,
      })
    }

    // Notif email via Supabase (fire-and-forget)
    if (tenant.owner_email) {
      sendSuspendEmail(supabase, tenant.owner_email, tenant.brand_name, sub.status === 'trial').catch(() => {})
    }

    suspendedCount++
  }

  return NextResponse.json({ suspended: suspendedCount })
}

async function notifyMerchantSuspended({ merchantWa, brandName, isTrial }: {
  merchantWa: string; brandName: string; isTrial: boolean
}) {
  const FONNTE_URL = 'https://api.fonnte.com/send'
  const token = process.env.FONNTE_TOKEN
  if (!token || !merchantWa) return

  const phone = merchantWa.replace(/\D/g, '').replace(/^0/, '62')
  const message = isTrial
    ? `⚠️ *Trial UMKMku Habis* — ${brandName}

Masa trial 7 hari kamu sudah berakhir. Tokomu saat ini tidak aktif.

Upgrade ke plan Business (Rp 399.000/bln) atau Enterprise (Rp 599.000/bln) untuk mengaktifkan kembali.

👉 Lihat pilihan plan: https://umkmku.com/pricing
📞 Hubungi kami untuk proses upgrade.`
    : `⚠️ *Langganan UMKMku Berakhir* — ${brandName}

Periode langgananmu telah berakhir. Tokomu saat ini tidak aktif dan tidak bisa diakses pelanggan.

Perpanjang langganan untuk mengaktifkan kembali toko kamu.

👉 Hubungi tim UMKMku untuk perpanjangan.`

  try {
    await fetch(FONNTE_URL, {
      method: 'POST',
      headers: { Authorization: token, 'Content-Type': 'application/json' },
      body: JSON.stringify({ target: phone, message }),
    })
  } catch { /* notifikasi gagal tidak boleh gagalkan cron */ }
}

// Kirim email via Supabase Auth Admin (hanya untuk notifikasi, bukan reset password)
// ponytail: pakai Supabase built-in daripada integrasi email eksternal baru
async function sendSuspendEmail(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  email: string,
  brandName: string,
  isTrial: boolean,
) {
  // Supabase tidak punya API kirim email custom — skip untuk sekarang
  // TODO: integrasikan Resend/SendGrid jika butuh email notifikasi
  void supabase; void email; void brandName; void isTrial
}
