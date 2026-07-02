'use client'

import { useEffect, useState } from 'react'
import { X, Loader2, CheckCircle2, Clock } from 'lucide-react'

function ProofImage({ url }: { url: string }) {
  const [zoomed, setZoomed] = useState(false)
  return (
    <>
      <img src={url} alt="Bukti bayar" onClick={() => setZoomed(true)}
        className="mt-2 w-full h-28 object-cover rounded-lg border border-gray-100 cursor-zoom-in" />
      {zoomed && (
        <div className="fixed inset-0 z-[70] bg-black/90 flex items-center justify-center" onClick={() => setZoomed(false)}>
          <img src={url} alt="zoom" className="max-w-[90vw] max-h-[90vh] object-contain rounded-xl" />
          <button onClick={() => setZoomed(false)} className="absolute top-4 right-4 bg-white/10 rounded-full p-2 text-white"><X size={18} /></button>
        </div>
      )}
    </>
  )
}

const PRIMARY = '#0A2F73'

interface TopUpOrder {
  id: string
  created_at: string
  quantity: number
  amount: number
  status: 'pending' | 'paid' | 'failed'
  paid_at: string | null
  payment_proof_url: string | null
  top_up_packages: { name: string; transaction_quota: number } | null
}

export function TopUpModal({ tenantId, brandName, onClose }: { tenantId: string; brandName: string; onClose: () => void }) {
  const [orders, setOrders] = useState<TopUpOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [confirming, setConfirming] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    const res = await fetch(`/api/admin/topup?tenantId=${tenantId}`).then(r => r.json()).catch(() => ({ orders: [] }))
    setOrders(res.orders ?? [])
    setLoading(false)
  }

  useEffect(() => { load() }, [tenantId])

  async function confirm(orderId: string) {
    setConfirming(orderId)
    await fetch('/api/admin/topup/confirm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId }),
    })
    await load()
    setConfirming(null)
  }

  const pending = orders.filter(o => o.status === 'pending')
  const history = orders.filter(o => o.status !== 'pending')

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50">
          <div>
            <h2 className="font-bold text-gray-900">Top-up Add-on</h2>
            <p className="text-xs text-gray-400 mt-0.5">{brandName}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400"><X size={16} /></button>
        </div>

        <div className="px-6 py-4 max-h-[70vh] overflow-y-auto space-y-5">
          {loading ? (
            <div className="flex justify-center py-10"><Loader2 size={22} className="animate-spin" style={{ color: PRIMARY }} /></div>
          ) : (
            <>
              {/* Pending */}
              {pending.length > 0 && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-3">Menunggu Konfirmasi</p>
                  <div className="space-y-2">
                    {pending.map(o => {
                      const pkg = o.top_up_packages
                      const totalQuota = (pkg?.transaction_quota ?? 0) * o.quantity
                      return (
                        <div key={o.id} className="rounded-xl border border-amber-100 bg-amber-50 p-4 flex items-start justify-between gap-3">
                          <div className="space-y-0.5">
                            <div className="text-sm font-semibold text-gray-800">+{totalQuota} pesanan ({o.quantity}× {pkg?.name})</div>
                            <div className="text-xs text-gray-500">Rp {o.amount.toLocaleString('id-ID')} · {new Date(o.created_at).toLocaleString('id-ID')}</div>
                            {o.payment_proof_url && <ProofImage url={o.payment_proof_url} />}
                          </div>
                          <button
                            onClick={() => confirm(o.id)}
                            disabled={confirming === o.id}
                            className="shrink-0 flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg text-white disabled:opacity-60"
                            style={{ background: '#16a34a' }}
                          >
                            {confirming === o.id ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle2 size={12} />}
                            Konfirmasi
                          </button>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {pending.length === 0 && (
                <div className="text-center py-4 text-sm text-gray-400 flex items-center justify-center gap-2">
                  <Clock size={14} /> Tidak ada top-up menunggu konfirmasi
                </div>
              )}

              {/* History */}
              {history.length > 0 && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-3">Riwayat</p>
                  <div className="space-y-2">
                    {history.map(o => {
                      const pkg = o.top_up_packages
                      const totalQuota = (pkg?.transaction_quota ?? 0) * o.quantity
                      return (
                        <div key={o.id} className="rounded-xl border border-gray-100 bg-gray-50 p-3 flex items-center justify-between">
                          <div>
                            <div className="text-sm font-medium text-gray-800">+{totalQuota} pesanan</div>
                            <div className="text-xs text-gray-400">{new Date(o.created_at).toLocaleDateString('id-ID')} · Rp {o.amount.toLocaleString('id-ID')}</div>
                          </div>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${o.status === 'paid' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
                            {o.status === 'paid' ? 'Lunas' : 'Gagal'}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
