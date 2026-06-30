import { redirect } from 'next/navigation'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { AdminActions } from './_admin-actions'

export default async function AdminPage() {
  // Auth guard — hanya super_admin
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/admin/login')

  const service = createServiceClient()
  const { data: profile } = await service
    .from('user_profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'super_admin') redirect('/')

  // Ambil semua tenant + subscription + usage
  const { data: rows } = await service
    .from('tenants')
    .select(`
      id, slug, brand_name, owner_email, is_active, created_at,
      tenant_subscriptions (
        id, plan_id, status, trial_ends_at, current_period_end,
        ai_tokens_used, transactions_used, overage_transactions
      )
    `)
    .order('created_at', { ascending: false })

  const { data: plans } = await service
    .from('subscription_plans')
    .select('id, name, price_monthly, ai_token_limit, transaction_limit')

  const planMap = new Map((plans ?? []).map(p => [p.id, p]))

  const merchants = (rows ?? []).map(t => {
    const sub = Array.isArray(t.tenant_subscriptions) ? t.tenant_subscriptions[0] : t.tenant_subscriptions
    const plan = sub ? planMap.get(sub.plan_id) : null
    return { ...t, sub, plan }
  })

  const totalRevenue = merchants.reduce((sum, m) => {
    return sum + (m.plan?.price_monthly ?? 0) * (m.sub?.status === 'active' ? 1 : 0)
  }, 0)

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans">
      {/* Header */}
      <div className="bg-[#0A2F73] text-white px-8 py-6 flex items-center justify-between">
        <div>
          <div className="text-lg font-bold">UMKMu — Admin Panel</div>
          <div className="text-white/50 text-xs mt-0.5">Super Admin · {user.email}</div>
        </div>
        <div className="flex gap-6 text-sm">
          <div className="text-center">
            <div className="text-xl font-bold">{merchants.length}</div>
            <div className="text-white/50 text-xs">Total Merchant</div>
          </div>
          <div className="text-center">
            <div className="text-xl font-bold">{merchants.filter(m => m.sub?.status === 'active').length}</div>
            <div className="text-white/50 text-xs">Aktif</div>
          </div>
          <div className="text-center">
            <div className="text-xl font-bold">{merchants.filter(m => m.sub?.status === 'trial').length}</div>
            <div className="text-white/50 text-xs">Trial</div>
          </div>
          <div className="text-center">
            <div className="text-xl font-bold">{merchants.filter(m => m.sub?.status === 'suspended').length}</div>
            <div className="text-white/50 text-xs">Suspended</div>
          </div>
          <div className="text-center">
            <div className="text-xl font-bold text-[#F4B400]">
              Rp {(totalRevenue / 1000).toFixed(0)}k
            </div>
            <div className="text-white/50 text-xs">MRR</div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="px-8 py-8">
        <div className="rounded-2xl bg-white overflow-hidden border border-[#E5EAF0]">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#E5EAF0] bg-[#F8FAFC]">
                <th className="text-left px-6 py-3 font-medium text-[#5E6B85]">Merchant</th>
                <th className="text-left px-6 py-3 font-medium text-[#5E6B85]">Plan</th>
                <th className="text-left px-6 py-3 font-medium text-[#5E6B85]">Status</th>
                <th className="text-left px-6 py-3 font-medium text-[#5E6B85]">AI Token</th>
                <th className="text-left px-6 py-3 font-medium text-[#5E6B85]">Pesanan</th>
                <th className="text-left px-6 py-3 font-medium text-[#5E6B85]">Overage</th>
                <th className="text-left px-6 py-3 font-medium text-[#5E6B85]">Berakhir</th>
                <th className="px-6 py-3 font-medium text-[#5E6B85]">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5EAF0]">
              {merchants.map((m) => {
                const tokenLimit = m.plan?.ai_token_limit === -1 ? null : m.plan?.ai_token_limit
                const txLimit = m.plan?.transaction_limit ?? null
                const tokenPct = tokenLimit ? Math.round((m.sub?.ai_tokens_used ?? 0) / tokenLimit * 100) : null
                const txPct = txLimit ? Math.round((m.sub?.transactions_used ?? 0) / txLimit * 100) : null
                const expiresAt = m.sub?.status === 'trial' ? m.sub.trial_ends_at : m.sub?.current_period_end

                return (
                  <tr key={m.id} className="hover:bg-[#F8FAFC] transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-[#0A2F73]">{m.brand_name}</div>
                      <div className="text-xs text-[#5E6B85] mt-0.5">{m.slug}.umkmku.com</div>
                      <div className="text-xs text-[#5E6B85]">{m.owner_email}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs font-semibold px-2 py-1 rounded-full bg-[#0A2F73]/10 text-[#0A2F73]">
                        {m.plan?.name ?? '—'}
                      </span>
                      {m.plan?.price_monthly ? (
                        <div className="text-xs text-[#5E6B85] mt-1">
                          Rp {(m.plan.price_monthly / 1000).toFixed(0)}k/bln
                        </div>
                      ) : null}
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={m.sub?.status} isActive={m.is_active} />
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-xs text-[#5E6B85]">
                        {((m.sub?.ai_tokens_used ?? 0) / 1000).toFixed(1)}k
                        {tokenLimit ? ` / ${(tokenLimit / 1000).toFixed(0)}k` : ' / ∞'}
                      </div>
                      {tokenPct !== null && (
                        <div className="mt-1 h-1.5 w-20 bg-[#E5EAF0] rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full"
                            style={{ width: `${Math.min(tokenPct, 100)}%`, background: tokenPct > 80 ? '#ef4444' : '#0A2F73' }}
                          />
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-xs text-[#5E6B85]">
                        {m.sub?.transactions_used ?? 0}
                        {txLimit ? ` / ${txLimit}` : ' / ∞'}
                      </div>
                      {txPct !== null && (
                        <div className="mt-1 h-1.5 w-20 bg-[#E5EAF0] rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full"
                            style={{ width: `${Math.min(txPct, 100)}%`, background: txPct > 80 ? '#ef4444' : '#0A2F73' }}
                          />
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {(m.sub?.overage_transactions ?? 0) > 0 ? (
                        <span className="text-xs font-semibold text-red-600">
                          +{m.sub!.overage_transactions} pesanan
                          <br />
                          <span className="font-normal text-[#5E6B85]">
                            Rp {((m.sub!.overage_transactions) * 1000).toLocaleString('id-ID')}
                          </span>
                        </span>
                      ) : (
                        <span className="text-xs text-[#5E6B85]">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-xs text-[#5E6B85]">
                      {expiresAt ? new Date(expiresAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                    </td>
                    <td className="px-6 py-4">
                      <AdminActions
                        tenantId={m.id}
                        subscriptionId={m.sub?.id}
                        currentStatus={m.sub?.status}
                        isActive={m.is_active}
                      />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>

          {merchants.length === 0 && (
            <div className="py-16 text-center text-sm text-[#5E6B85]">Belum ada merchant terdaftar.</div>
          )}
        </div>
      </div>
    </div>
  )
}

function StatusBadge({ status, isActive }: { status?: string; isActive: boolean }) {
  if (!isActive || status === 'suspended') return <span className="text-xs font-semibold px-2 py-1 rounded-full bg-red-50 text-red-600">Suspended</span>
  if (status === 'trial') return <span className="text-xs font-semibold px-2 py-1 rounded-full bg-yellow-50 text-yellow-700">Trial</span>
  if (status === 'active') return <span className="text-xs font-semibold px-2 py-1 rounded-full bg-green-50 text-green-700">Aktif</span>
  if (status === 'expired') return <span className="text-xs font-semibold px-2 py-1 rounded-full bg-gray-100 text-gray-500">Expired</span>
  return <span className="text-xs text-[#5E6B85]">—</span>
}
