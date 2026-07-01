import { notFound } from 'next/navigation'
import { createServiceClient } from '@/lib/supabase/server'
import { CheckCircle2, ArrowRight, Sparkles } from 'lucide-react'
import Link from 'next/link'

const PRIMARY = '#0A2F73'
const GOLD = '#F4B400'
const BORDER = '#E5EAF0'
const TEXT_SEC = '#5E6B85'
const SURFACE = '#F8FAFC'

const PLAN_NAMES: Record<string, string> = {
  business: 'Business',
  enterprise: 'Enterprise',
}

interface Props {
  searchParams: Promise<{ invoice?: string }>
}

export default async function SubscribeSuccessPage({ searchParams }: Props) {
  const { invoice: invoiceId } = await searchParams
  if (!invoiceId) notFound()

  const service = createServiceClient()
  const { data: inv } = await service
    .from('subscription_invoices')
    .select('id, plan_id, email, full_name, status, final_amount')
    .eq('id', invoiceId)
    .single()

  if (!inv) notFound()

  const isPaid = inv.status === 'paid'

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-12" style={{ background: SURFACE }}>

      {/* Brand */}
      <Link href="/" className="mb-12">
        <img src="/logo.png" alt="UMKMu" style={{ height: '32px', width: 'auto' }} />
      </Link>

      <div className="w-full max-w-md text-center flex flex-col items-center gap-6">
        <div
          className="w-20 h-20 rounded-full flex items-center justify-center"
          style={{ background: isPaid ? '#f0fdf4' : '#fef9c3' }}
        >
          <CheckCircle2 size={38} className={isPaid ? 'text-green-500' : 'text-yellow-500'} />
        </div>

        <div>
          <h1 className="text-2xl font-bold" style={{ color: PRIMARY }}>
            {isPaid ? 'Pembayaran Berhasil!' : 'Pembayaran Sedang Diverifikasi'}
          </h1>
          <p className="text-sm mt-2 leading-relaxed" style={{ color: TEXT_SEC }}>
            {isPaid
              ? `Terima kasih, ${inv.full_name ?? inv.email}! Plan ${PLAN_NAMES[inv.plan_id] ?? inv.plan_id} kamu sudah aktif.`
              : `Pembayaran dari ${inv.email} sedang kami verifikasi. Biasanya selesai dalam 1–5 menit.`}
          </p>
        </div>

        {/* Detail */}
        <div className="w-full rounded-2xl p-5 text-sm text-left flex flex-col gap-3" style={{ background: 'white', border: `1px solid ${BORDER}` }}>
          <div className="flex justify-between">
            <span style={{ color: TEXT_SEC }}>Plan</span>
            <span className="font-semibold" style={{ color: PRIMARY }}>{PLAN_NAMES[inv.plan_id] ?? inv.plan_id}</span>
          </div>
          <div className="flex justify-between">
            <span style={{ color: TEXT_SEC }}>Email</span>
            <span style={{ color: PRIMARY }}>{inv.email}</span>
          </div>
          <div className="flex justify-between">
            <span style={{ color: TEXT_SEC }}>Total dibayar</span>
            <span className="font-semibold" style={{ color: PRIMARY }}>
              Rp {inv.final_amount.toLocaleString('id-ID')}
            </span>
          </div>
          <div className="flex justify-between">
            <span style={{ color: TEXT_SEC }}>Status</span>
            <span
              className="font-semibold text-xs px-2.5 py-1 rounded-full"
              style={isPaid
                ? { background: '#f0fdf4', color: '#166534' }
                : { background: '#fef9c3', color: '#854d0e' }}
            >
              {isPaid ? '✓ Lunas' : '⏳ Menunggu konfirmasi'}
            </span>
          </div>
        </div>

        {/* Langkah selanjutnya */}
        <div className="w-full rounded-2xl p-5 text-left" style={{ background: `${PRIMARY}08`, border: `1px solid ${PRIMARY}20` }}>
          <div className="text-xs font-semibold mb-3" style={{ color: PRIMARY }}>Langkah selanjutnya:</div>
          <div className="flex flex-col gap-2.5">
            {[
              'Buat akun UMKMku dengan email yang sama',
              'Ceritakan bisnis kamu, AI akan buat toko dalam 60 detik',
              'Toko langsung aktif dengan plan ' + (PLAN_NAMES[inv.plan_id] ?? inv.plan_id),
            ].map((s, i) => (
              <div key={i} className="flex items-start gap-2.5 text-sm" style={{ color: TEXT_SEC }}>
                <span className="font-bold shrink-0 mt-0.5" style={{ color: GOLD }}>{i + 1}.</span> {s}
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <Link
          href={`/onboarding?plan=${inv.plan_id}&invoice=${inv.id}`}
          className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-semibold text-base transition-opacity hover:opacity-90"
          style={{ background: PRIMARY, color: 'white' }}
        >
          <Sparkles size={16} />
          Buat Toko Sekarang
          <ArrowRight size={16} />
        </Link>

        <p className="text-xs" style={{ color: TEXT_SEC }}>
          Sudah punya akun?{' '}
          <Link href="/login" className="underline" style={{ color: PRIMARY }}>
            Login di sini
          </Link>
        </p>
      </div>
    </div>
  )
}
