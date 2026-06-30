'use client'

import { useState } from 'react'
import { MerchantDetailModal } from '../_merchant-detail-modal'

interface Row {
  id: string
  tenant_id: string
  trial_ends_at: string | null
  tenants: { slug: string; brand_name: string; category: string } | { slug: string; brand_name: string; category: string }[] | null
}

export function LeadsClient({ data }: { data: Row[] }) {
  const [selected, setSelected] = useState<string | null>(null)

  return (
    <>
      <div>
        <h1 className="text-2xl font-bold text-[#0A2F73] mb-2">Leads</h1>
        <p className="text-sm text-[#5E6B85] mb-6">Merchant yang sedang trial gratis — {data.length} merchant</p>
        <div className="bg-white rounded-xl border border-[#E5EAF0] overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-[#F8FAFC] border-b border-[#E5EAF0]">
              <tr>
                <th className="text-left px-5 py-3 font-medium text-[#5E6B85]">Brand</th>
                <th className="text-left px-5 py-3 font-medium text-[#5E6B85]">Kategori</th>
                <th className="text-left px-5 py-3 font-medium text-[#5E6B85]">Trial Berakhir</th>
                <th className="text-left px-5 py-3 font-medium text-[#5E6B85]">Sisa</th>
              </tr>
            </thead>
            <tbody>
              {!data.length && (
                <tr><td colSpan={4} className="px-5 py-10 text-center text-[#5E6B85]">Tidak ada leads saat ini</td></tr>
              )}
              {data.map((s) => {
                const tenant = Array.isArray(s.tenants) ? s.tenants[0] : s.tenants
                const daysLeft = s.trial_ends_at
                  ? Math.ceil((new Date(s.trial_ends_at).getTime() - Date.now()) / 86400000)
                  : null
                return (
                  <tr
                    key={s.id}
                    onClick={() => setSelected(s.tenant_id)}
                    className="border-b border-[#E5EAF0] last:border-0 hover:bg-[#F0F4FF] cursor-pointer transition-colors"
                  >
                    <td className="px-5 py-4 font-medium text-[#0A2F73]">{tenant?.brand_name ?? '-'}</td>
                    <td className="px-5 py-4">
                      <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium capitalize">{tenant?.category ?? '-'}</span>
                    </td>
                    <td className="px-5 py-4 text-[#5E6B85]">
                      {s.trial_ends_at ? new Date(s.trial_ends_at).toLocaleDateString('id-ID') : '-'}
                    </td>
                    <td className="px-5 py-4">
                      {daysLeft !== null && (
                        <span className={`text-xs font-semibold ${daysLeft <= 1 ? 'text-red-600' : daysLeft <= 3 ? 'text-yellow-600' : 'text-[#5E6B85]'}`}>
                          {daysLeft <= 0 ? 'Habis' : `${daysLeft} hari`}
                        </span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {selected && <MerchantDetailModal tenantId={selected} onClose={() => setSelected(null)} />}
    </>
  )
}
