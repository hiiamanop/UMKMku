'use client'

import { useState } from 'react'
import { ShoppingBag } from 'lucide-react'
import { MerchantDetailModal } from '../_merchant-detail-modal'
import { TopUpModal } from '../_topup-modal'

interface Row {
  id: string
  tenant_id: string
  plan_id: string
  current_period_end: string | null
  tenants: { slug: string; brand_name: string } | { slug: string; brand_name: string }[] | null
}

export function OngoingClient({ data }: { data: Row[] }) {
  const [selected, setSelected] = useState<string | null>(null)
  const [topupTenant, setTopupTenant] = useState<{ id: string; name: string } | null>(null)

  return (
    <>
      <div>
        <h1 className="text-2xl font-bold text-[#0A2F73] mb-2">Ongoing</h1>
        <p className="text-sm text-[#5E6B85] mb-6">Merchant dengan langganan aktif, {data.length} merchant</p>
        <div className="bg-white rounded-xl border border-[#E5EAF0] overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-[#F8FAFC] border-b border-[#E5EAF0]">
              <tr>
                <th className="text-left px-5 py-3 font-medium text-[#5E6B85]">Brand</th>
                <th className="text-left px-5 py-3 font-medium text-[#5E6B85]">Plan</th>
                <th className="text-left px-5 py-3 font-medium text-[#5E6B85]">Berakhir</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {!data.length && (
                <tr><td colSpan={4} className="px-5 py-10 text-center text-[#5E6B85]">Tidak ada merchant aktif</td></tr>
              )}
              {data.map((s) => {
                const tenant = Array.isArray(s.tenants) ? s.tenants[0] : s.tenants
                return (
                  <tr key={s.id} className="border-b border-[#E5EAF0] last:border-0 hover:bg-[#F0F4FF] transition-colors">
                    <td className="px-5 py-4 font-medium text-[#0A2F73] cursor-pointer" onClick={() => setSelected(s.tenant_id)}>
                      {tenant?.brand_name ?? '-'}
                    </td>
                    <td className="px-5 py-4 cursor-pointer" onClick={() => setSelected(s.tenant_id)}>
                      <span className="px-2 py-1 bg-green-50 text-green-700 rounded-full text-xs font-medium capitalize">{s.plan_id}</span>
                    </td>
                    <td className="px-5 py-4 text-[#5E6B85] cursor-pointer" onClick={() => setSelected(s.tenant_id)}>
                      {s.current_period_end ? new Date(s.current_period_end).toLocaleDateString('id-ID') : '-'}
                    </td>
                    <td className="px-5 py-4">
                      <button
                        onClick={() => setTopupTenant({ id: s.tenant_id, name: tenant?.brand_name ?? '-' })}
                        className="p-1.5 rounded-lg hover:bg-[#EEF2FF] transition-colors text-[#5E6B85] hover:text-[#0A2F73]"
                        title="Top-up Add-on"
                      >
                        <ShoppingBag size={15} />
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {selected && <MerchantDetailModal tenantId={selected} onClose={() => setSelected(null)} />}
      {topupTenant && <TopUpModal tenantId={topupTenant.id} brandName={topupTenant.name} onClose={() => setTopupTenant(null)} />}
    </>
  )
}
