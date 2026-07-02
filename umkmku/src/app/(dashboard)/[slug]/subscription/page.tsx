import { notFound } from 'next/navigation'
import { createServiceClient } from '@/lib/supabase/server'
import { getTenantBySlug } from '@/lib/tenant'
import { TrendingUp, CheckCircle2, AlertTriangle, Clock } from 'lucide-react'
import { TopUpButton } from './_topup-button'
import { UsageCard } from './_usage-card'
import { UsageChart } from './_usage-chart'
import Link from 'next/link'

const PLAN_LABELS: Record<string, string> = {
  free: 'Free Trial',
  business: 'Business',
  enterprise: 'Enterprise',
}

const STATUS_LABELS: Record<string, { label: string; color: string; bg: string; icon: typeof CheckCircle2 }> = {
  trial:     { label: 'Trial Aktif',  color: '#854d0e', bg: '#fef9c3', icon: Clock },
  active:    { label: 'Aktif',        color: '#166534', bg: '#f0fdf4', icon: CheckCircle2 },
  suspended: { label: 'Disuspend',    color: '#991b1b', bg: '#fef2f2', icon: AlertTriangle },
  expired:   { label: 'Kadaluarsa',   color: '#6b7280', bg: '#f9fafb', icon: AlertTriangle },
}

interface Props { params: Promise<{ slug: string }> }

export default async function SubscriptionPage({ params }: Props) {
  const { slug } = await params
  const data = await getTenantBySlug(slug)
  if (!data) notFound()

  const service = createServiceClient()

  const { data: sub } = await service
    .from('tenant_subscriptions')
    .select('*, subscription_plans(*)')
    .eq('tenant_id', data.tenant.id)
    .maybeSingle()

  const { data: topUpPackages } = await service
    .from('top_up_packages')
    .select('*')
    .eq('is_active', true)
    .limit(1)

  if (!sub) {
    return (
      <div className="max-w-lg">
        <h1 className="text-2xl font-bold mb-2" style={{ color: '#1a1a1a' }}>Langganan</h1>
        <p className="text-sm text-gray-500">Belum ada data langganan. Hubungi tim UMKMku.</p>
      </div>
    )
  }

  const plan = sub.subscription_plans as {
    id: string; name: string; price_monthly: number
    ai_token_limit: number; ai_token_hard_cap: number | null; transaction_limit: number | null
  }

  const tokenLimit = plan.ai_token_limit === -1
    ? (plan.ai_token_hard_cap ?? null)
    : plan.ai_token_limit

  const tokenPct = tokenLimit ? Math.min(Math.round(sub.ai_tokens_used / tokenLimit * 100), 100) : 0
  const txLimit = plan.transaction_limit
  const txPct = txLimit ? Math.min(Math.round(sub.transactions_used / txLimit * 100), 100) : 0

  const statusInfo = STATUS_LABELS[sub.status] ?? STATUS_LABELS.expired
  const StatusIcon = statusInfo.icon

  const expiresAt = sub.status === 'trial' ? sub.trial_ends_at : sub.current_period_end
  const expiresLabel = expiresAt
    ? new Date(expiresAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
    : '—'

  const isLimited = sub.status === 'suspended' || sub.status === 'expired'

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: '#1a1a1a' }}>Langganan</h1>
        <p className="text-sm text-gray-500 mt-1">Status, penggunaan, dan kelola plan tokomu.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
      {/* Kolom kiri: status, usage, top-up, upgrade */}
      <div className="space-y-6">

      {/* Status card */}
      <div className="bg-white rounded-2xl p-6 border border-gray-100 space-y-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1">Plan Aktif</div>
            <div className="text-2xl font-bold" style={{ color: '#1a1a1a' }}>
              {PLAN_LABELS[plan.id] ?? plan.name}
            </div>
            {plan.price_monthly > 0 && (
              <div className="text-sm text-gray-400 mt-0.5">
                Rp {plan.price_monthly.toLocaleString('id-ID')} / bulan
              </div>
            )}
          </div>
          <span
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full shrink-0"
            style={{ background: statusInfo.bg, color: statusInfo.color }}
          >
            <StatusIcon size={12} />
            {statusInfo.label}
          </span>
        </div>

        <div className="flex items-center gap-2 text-sm text-gray-500 pt-1 border-t border-gray-50">
          <Clock size={13} />
          {sub.status === 'trial' ? 'Trial berakhir' : 'Periode berakhir'}: <strong>{expiresLabel}</strong>
        </div>

        {isLimited && (
          <div className="rounded-xl p-4 text-sm" style={{ background: '#fef2f2', color: '#991b1b' }}>
            <strong>Tokomu saat ini disuspend.</strong> Pelanggan tidak bisa mengakses toko.
            Upgrade untuk mengaktifkan kembali.
          </div>
        )}
      </div>

      <UsageCard
        tenantId={data.tenant.id}
        initialTokensUsed={sub.ai_tokens_used}
        initialTxUsed={sub.transactions_used}
        tokenLimit={tokenLimit}
        txLimit={txLimit}
        overage={sub.overage_transactions}
        initialAddon={(sub as any).transactions_addon ?? 0}
      />

      {/* Top-up */}
      {txLimit && (
        <div className="bg-white rounded-2xl p-6 border border-gray-100 space-y-4">
          <div>
            <div className="text-sm font-semibold" style={{ color: '#1a1a1a' }}>Top-up Kuota Pesanan</div>
            <p className="text-xs text-gray-400 mt-0.5">Tambah kuota pesanan kapan saja, langsung aktif setelah dikonfirmasi.</p>
          </div>
          <div className="flex flex-col gap-3">
            {(topUpPackages ?? []).map(pkg => (
              <div
                key={pkg.id}
                className="flex items-center justify-between p-4 rounded-xl border border-gray-100 bg-gray-50"
              >
                <div>
                  <div className="text-sm font-semibold text-gray-800">{pkg.name}</div>
                  <div className="text-xs text-gray-400">+{pkg.transaction_quota} pesanan</div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-sm font-bold" style={{ color: '#1a1a1a' }}>
                    Rp {pkg.price.toLocaleString('id-ID')}
                  </div>
                  <TopUpButton packageId={pkg.id} tenantId={data.tenant.id} packageName={pkg.name} price={pkg.price} transactionQuota={pkg.transaction_quota} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upgrade plan */}
      {plan.id !== 'enterprise' && (
        <div
          className="rounded-2xl p-6 space-y-4"
          style={{ background: 'var(--color-primary)' }}
        >
          <div className="flex items-start gap-3">
            <TrendingUp size={20} className="opacity-70 shrink-0 mt-0.5" style={{ color: 'var(--color-sidebar-text)' }} />
            <div>
              <div className="font-semibold" style={{ color: 'var(--color-sidebar-text)' }}>
                {plan.id === 'free' ? 'Upgrade ke Business atau Enterprise' : 'Upgrade ke Enterprise'}
              </div>
              <p className="text-sm mt-1 opacity-60" style={{ color: 'var(--color-sidebar-text)' }}>
                {plan.id === 'free'
                  ? 'Dapatkan 1 juta token AI, 1.000 pesanan/bulan, dan analitik penjualan.'
                  : 'Token AI 50 juta, pesanan tidak terbatas, dan priority support.'}
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            {plan.id === 'free' && (
              <Link
                href={`/subscribe?from=dashboard&slug=${slug}`}
                className="flex-1 py-3 rounded-xl text-center text-sm font-semibold transition-opacity hover:opacity-90"
                style={{ background: '#F4B400', color: '#1a1a1a' }}
              >
                Business, Rp 399k/bln
              </Link>
            )}
            <Link
              href={`/subscribe?from=dashboard&plan=enterprise&slug=${slug}`}
              className="flex-1 py-3 rounded-xl text-center text-sm font-semibold transition-colors hover:opacity-80 border"
              style={{ borderColor: 'color-mix(in srgb, var(--color-sidebar-text) 30%, transparent)', color: 'var(--color-sidebar-text)' }}
            >
              Enterprise, Rp 599k/bln
            </Link>
          </div>
          <p className="text-xs opacity-40" style={{ color: 'var(--color-sidebar-text)' }}>
            Klik untuk pilih plan → buat akun / login → instruksi pembayaran akan ditampilkan.
          </p>
        </div>
      )}

      {plan.id === 'enterprise' && (
        <div className="rounded-2xl p-5 border border-gray-100 bg-white text-sm text-center text-gray-400">
          Kamu sudah di plan tertinggi. Butuh bantuan?{' '}
          <a href="https://wa.me/6281234567890" target="_blank" rel="noopener noreferrer" className="underline text-gray-600">
            Hubungi tim kami
          </a>
        </div>
      )}

      </div>{/* end kolom kiri */}

      {/* Kolom kanan: chart */}
      <div className="lg:sticky lg:top-6">
        <UsageChart tenantId={data.tenant.id} hasAddon={((sub as any).transactions_addon ?? 0) > 0} />
      </div>

      </div>{/* end grid */}
    </div>
  )
}
