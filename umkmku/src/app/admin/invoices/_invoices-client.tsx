'use client'

import { useState } from 'react'
import Image from 'next/image'
import { CheckCircle2, Clock, XCircle, Loader2, X } from 'lucide-react'

interface Invoice {
  id: string
  full_name: string | null
  email: string
  plan_id: string
  final_amount: number
  status: string
  payment_proof_url: string | null
  tenant_id: string | null
  onboarding_completed_at: string | null
  created_at: string
  paid_at: string | null
}

const STATUS_BADGE: Record<string, { label: string; cls: string }> = {
  pending: { label: 'Menunggu', cls: 'bg-yellow-50 text-yellow-700' },
  paid:    { label: 'Perlu Validasi', cls: 'bg-blue-50 text-blue-700' },
  expired: { label: 'Expired', cls: 'bg-gray-100 text-gray-500' },
  failed:  { label: 'Ditolak', cls: 'bg-red-50 text-red-600' },
}

const fmt = (n: number) => 'Rp ' + n.toLocaleString('id-ID')
const fmtDate = (s: string) => new Date(s).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
const refCode = (id: string) => id.replace(/-/g, '').slice(-6).toUpperCase()

export function InvoicesClient({ invoices: initial }: { invoices: Invoice[] }) {
  const [invoices, setInvoices] = useState(initial)
  const [loading, setLoading] = useState<string | null>(null)
  const [zoomedProof, setZoomedProof] = useState<string | null>(null)
  const [rejectModal, setRejectModal] = useState<{ invoiceId: string; name: string } | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [activateModal, setActivateModal] = useState<{ invoiceId: string; name: string } | null>(null)
  const [activateRefInput, setActivateRefInput] = useState('')

  async function activate(invoiceId: string) {
    setActivateModal(null)
    setActivateRefInput('')
    setLoading(invoiceId + '_activate')
    const res = await fetch('/api/admin/invoices/activate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ invoiceId }),
    })
    if (res.ok) setInvoices(invoices.map(inv =>
      inv.id === invoiceId ? { ...inv, status: 'paid', onboarding_completed_at: new Date().toISOString() } : inv
    ))
    setLoading(null)
  }

  async function confirmReject() {
    if (!rejectModal || !rejectReason.trim()) return
    const { invoiceId } = rejectModal
    setLoading(invoiceId + '_reject')
    setRejectModal(null)
    const res = await fetch('/api/admin/invoices/reject', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ invoiceId, reason: rejectReason.trim() }),
    })
    if (res.ok) setInvoices(invoices.map(inv =>
      inv.id === invoiceId ? { ...inv, status: 'failed' } : inv
    ))
    setLoading(null)
    setRejectReason('')
  }

  const isActivated = (inv: Invoice) => !!inv.onboarding_completed_at

  return (
    <>
      {/* Modal tolak */}
      {rejectModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-6"
          onClick={e => e.target === e.currentTarget && (setRejectModal(null), setRejectReason(''))}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-base font-semibold text-[#0A2F73]">Tolak Invoice</h2>
                <p className="text-xs text-[#5E6B85] mt-0.5">{rejectModal.name}</p>
              </div>
              <button onClick={() => { setRejectModal(null); setRejectReason('') }}
                className="text-[#5E6B85] hover:text-[#0A2F73]">
                <X size={18} />
              </button>
            </div>
            <label className="text-xs font-medium text-[#5E6B85] block mb-2">
              Alasan penolakan <span className="text-red-500">*</span>
            </label>
            <textarea
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
              placeholder="Contoh: Bukti pembayaran tidak jelas, nominal tidak sesuai..."
              rows={4}
              autoFocus
              className="w-full px-3 py-2.5 text-sm border border-[#E5EAF0] rounded-lg focus:outline-none focus:border-[#0A2F73] resize-none"
            />
            <p className="text-[11px] text-[#5E6B85] mt-1.5 mb-4">
              Alasan ini akan dicantumkan di email yang dikirim ke merchant.
            </p>
            <div className="flex gap-2 justify-end">
              <button onClick={() => { setRejectModal(null); setRejectReason('') }}
                className="px-4 py-2 text-sm text-[#5E6B85] border border-[#E5EAF0] rounded-lg hover:bg-gray-50">
                Batal
              </button>
              <button onClick={confirmReject} disabled={!rejectReason.trim()}
                className="px-4 py-2 text-sm font-semibold text-white bg-red-500 rounded-lg hover:bg-red-600 disabled:opacity-50">
                Tolak & Kirim Notifikasi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal aktivasi, konfirmasi ref code */}
      {activateModal && (() => {
        const ref = refCode(activateModal.invoiceId)
        const match = activateRefInput.trim().toUpperCase() === ref
        return (
          <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-6"
            onClick={e => e.target === e.currentTarget && (setActivateModal(null), setActivateRefInput(''))}>
            <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-base font-semibold text-[#0A2F73]">Konfirmasi Aktivasi</h2>
                  <p className="text-xs text-[#5E6B85] mt-0.5">{activateModal.name}</p>
                </div>
                <button onClick={() => { setActivateModal(null); setActivateRefInput('') }}
                  className="text-[#5E6B85] hover:text-[#0A2F73]">
                  <X size={18} />
                </button>
              </div>
              <p className="text-sm text-[#374151] leading-relaxed mb-4">
                Untuk mengaktifkan subscription ini, ketik kode referensi invoice di bawah:
              </p>
              <div className="bg-[#F8FAFC] rounded-xl p-4 text-center mb-4 border border-[#E5EAF0]">
                <p className="text-xs text-[#5E6B85] mb-1">Kode Referensi</p>
                <p className="font-mono text-2xl font-bold tracking-widest text-[#0A2F73]">{ref}</p>
              </div>
              <input
                value={activateRefInput}
                onChange={e => setActivateRefInput(e.target.value.toUpperCase())}
                placeholder={`Ketik ${ref} untuk konfirmasi`}
                autoFocus
                className={`w-full px-3 py-2.5 text-sm font-mono tracking-widest border rounded-lg focus:outline-none mb-4 ${
                  activateRefInput && !match ? 'border-red-300 bg-red-50' : match ? 'border-green-400 bg-green-50' : 'border-[#E5EAF0]'
                }`}
              />
              <div className="flex gap-2 justify-end">
                <button onClick={() => { setActivateModal(null); setActivateRefInput('') }}
                  className="px-4 py-2 text-sm text-[#5E6B85] border border-[#E5EAF0] rounded-lg hover:bg-gray-50">
                  Batal
                </button>
                <button onClick={() => activate(activateModal.invoiceId)} disabled={!match}
                  className="px-4 py-2 text-sm font-semibold text-white bg-[#0A2F73] rounded-lg hover:opacity-90 disabled:opacity-40">
                  Aktifkan Subscription
                </button>
              </div>
            </div>
          </div>
        )
      })()}

      {zoomedProof && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-6"
          onClick={() => setZoomedProof(null)}>
          <div className="relative w-full max-w-md aspect-square">
            <Image src={zoomedProof} alt="Bukti bayar" fill className="object-contain" />
          </div>
          <p className="absolute bottom-8 text-white/60 text-sm">Ketuk untuk tutup</p>
        </div>
      )}

      <div className="bg-white rounded-xl border border-[#E5EAF0] overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-[#F8FAFC] border-b border-[#E5EAF0]">
            <tr>
              <th className="text-left px-5 py-3 font-medium text-[#5E6B85]">Merchant</th>
              <th className="text-left px-5 py-3 font-medium text-[#5E6B85]">Plan</th>
              <th className="text-left px-5 py-3 font-medium text-[#5E6B85]">Total</th>
              <th className="text-left px-5 py-3 font-medium text-[#5E6B85]">Ref</th>
              <th className="text-left px-5 py-3 font-medium text-[#5E6B85]">Status</th>
              <th className="text-left px-5 py-3 font-medium text-[#5E6B85]">Bukti</th>
              <th className="text-left px-5 py-3 font-medium text-[#5E6B85]">Tanggal</th>
              <th className="px-5 py-3 font-medium text-[#5E6B85]">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {!invoices.length && (
              <tr><td colSpan={7} className="px-5 py-10 text-center text-[#5E6B85]">Belum ada invoice</td></tr>
            )}
            {invoices.map(inv => (
              <tr key={inv.id} className="border-b border-[#E5EAF0] last:border-0 hover:bg-[#F8FAFC]">
                <td className="px-5 py-4">
                  <div className="font-medium text-[#0A2F73]">{inv.full_name ?? '—'}</div>
                  <div className="text-xs text-[#5E6B85]">{inv.email}</div>
                  {inv.tenant_id && <div className="text-xs text-green-600 mt-0.5">Toko terhubung</div>}
                </td>
                <td className="px-5 py-4 capitalize font-medium text-[#0A2F73]">{inv.plan_id}</td>
                <td className="px-5 py-4 font-medium text-[#0A2F73]">{fmt(inv.final_amount)}</td>
                <td className="px-5 py-4">
                  <span className="font-mono text-xs font-semibold tracking-widest text-[#0A2F73]">{refCode(inv.id)}</span>
                </td>
                <td className="px-5 py-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_BADGE[inv.status]?.cls ?? 'bg-gray-100 text-gray-500'}`}>
                    {STATUS_BADGE[inv.status]?.label ?? inv.status}
                  </span>
                  {isActivated(inv) && (
                    <div className="flex items-center gap-1 text-xs text-green-600 mt-1">
                      <CheckCircle2 size={11} /> Aktif
                    </div>
                  )}
                </td>
                <td className="px-5 py-4">
                  {inv.payment_proof_url ? (
                    <button onClick={() => setZoomedProof(inv.payment_proof_url!)}
                      className="relative w-10 h-10 rounded overflow-hidden border border-[#E5EAF0] hover:border-[#0A2F73] transition-colors">
                      <Image src={inv.payment_proof_url} alt="Bukti" fill className="object-cover" />
                    </button>
                  ) : (
                    <span className="text-xs text-[#5E6B85]">—</span>
                  )}
                </td>
                <td className="px-5 py-4 text-[#5E6B85] text-xs">
                  {fmtDate(inv.created_at)}
                  {inv.paid_at && <div className="text-blue-600 mt-0.5">Bayar: {fmtDate(inv.paid_at)}</div>}
                </td>
                <td className="px-5 py-4">
                  {inv.status === 'paid' && !isActivated(inv) ? (
                    <div className="flex gap-2">
                      <button onClick={() => setActivateModal({ invoiceId: inv.id, name: inv.full_name ?? inv.email })} disabled={!!loading}
                        className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg text-white bg-[#0A2F73] hover:opacity-90 disabled:opacity-50">
                        {loading === inv.id + '_activate'
                          ? <><Loader2 size={11} className="animate-spin" /> Proses...</>
                          : <><CheckCircle2 size={11} /> Aktifkan</>}
                      </button>
                      <button onClick={() => setRejectModal({ invoiceId: inv.id, name: inv.full_name ?? inv.email })}
                        disabled={!!loading}
                        className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg text-red-600 border border-red-200 hover:bg-red-50 disabled:opacity-50">
                        {loading === inv.id + '_reject'
                          ? <><Loader2 size={11} className="animate-spin" /> Proses...</>
                          : <><XCircle size={11} /> Tolak</>}
                      </button>
                    </div>
                  ) : inv.status === 'paid' && isActivated(inv) ? (
                    <span className="text-xs text-green-600 flex items-center gap-1">
                      <CheckCircle2 size={12} /> Sudah aktif
                    </span>
                  ) : inv.status === 'pending' ? (
                    <span className="text-xs text-[#5E6B85] flex items-center gap-1">
                      <Clock size={12} /> Menunggu bayar
                    </span>
                  ) : inv.status === 'failed' ? (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-red-500 flex items-center gap-1">
                        <XCircle size={12} /> Ditolak
                      </span>
                      <button onClick={() => setActivateModal({ invoiceId: inv.id, name: inv.full_name ?? inv.email })} disabled={!!loading}
                        className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg text-[#0A2F73] border border-[#0A2F73]/30 hover:bg-[#0A2F73]/5 disabled:opacity-50">
                        {loading === inv.id + '_activate'
                          ? <Loader2 size={10} className="animate-spin" />
                          : <CheckCircle2 size={10} />} Aktifkan
                      </button>
                    </div>
                  ) : (
                    <span className="text-xs text-[#5E6B85]">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}
