'use client'

import { useState } from 'react'

interface Promo {
  id: string
  code: string
  discount_type: 'percentage' | 'fixed'
  discount_value: number
  min_order_amount: number
  max_discount_amount: number | null
  usage_limit: number | null
  used_count: number
  valid_until: string | null
  is_active: boolean
  created_at: string
}

const fmt = (n: number) => 'Rp ' + n.toLocaleString('id-ID')

export function PromoAdminClient({ initialPromos }: { initialPromos: Promo[] }) {
  const [promos, setPromos] = useState(initialPromos)
  const [showForm, setShowForm] = useState(false)
  const [showBroadcast, setShowBroadcast] = useState<string | null>(null)
  const [broadcastMsg, setBroadcastMsg] = useState('')
  const [broadcastResult, setBroadcastResult] = useState('')
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    code: '', discount_type: 'percentage', discount_value: '',
    min_order_amount: '', max_discount_amount: '', usage_limit: '', valid_until: '',
  })

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const res = await fetch('/api/admin/promos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const data = await res.json()
    if (data.promo) {
      setPromos([data.promo, ...promos])
      setShowForm(false)
      setForm({ code: '', discount_type: 'percentage', discount_value: '', min_order_amount: '', max_discount_amount: '', usage_limit: '', valid_until: '' })
    }
    setLoading(false)
  }

  async function toggleActive(id: string, is_active: boolean) {
    await fetch('/api/admin/promos', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, is_active: !is_active }),
    })
    setPromos(promos.map(p => p.id === id ? { ...p, is_active: !is_active } : p))
  }

  async function handleBroadcast() {
    if (!showBroadcast || !broadcastMsg.trim()) return
    setLoading(true)
    const res = await fetch('/api/admin/promos/broadcast', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ promoCode: showBroadcast, message: broadcastMsg }),
    })
    const data = await res.json()
    setBroadcastResult(`✅ Pesan berhasil dikirim ke ${data.sent} merchant`)
    setLoading(false)
  }

  const inputCls = 'w-full px-3 py-2 text-sm border border-[#E5EAF0] rounded-lg focus:outline-none focus:border-[#0A2F73]'
  const labelCls = 'text-xs font-medium text-[#5E6B85] block mb-1'

  return (
    <div className="space-y-6">
      {/* Create form */}
      {showForm ? (
        <div className="bg-white rounded-xl border border-[#E5EAF0] p-6">
          <h2 className="text-base font-semibold text-[#0A2F73] mb-4">Buat Kode Promo Baru</h2>
          <form onSubmit={handleCreate} className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Kode Promo *</label>
              <input className={inputCls} placeholder="UMKMU20" value={form.code}
                onChange={e => setForm({ ...form, code: e.target.value.toUpperCase() })} required />
            </div>
            <div>
              <label className={labelCls}>Tipe Diskon *</label>
              <select className={inputCls} value={form.discount_type}
                onChange={e => setForm({ ...form, discount_type: e.target.value })}>
                <option value="percentage">Persentase (%)</option>
                <option value="fixed">Nominal (Rp)</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>
                Nilai Diskon * {form.discount_type === 'percentage' ? '(%)' : '(Rp)'}
              </label>
              <input className={inputCls} type="number" placeholder={form.discount_type === 'percentage' ? '20' : '50000'}
                value={form.discount_value}
                onChange={e => setForm({ ...form, discount_value: e.target.value })} required />
            </div>
            <div>
              <label className={labelCls}>Minimum Order (Rp)</label>
              <input className={inputCls} type="number" placeholder="0"
                value={form.min_order_amount}
                onChange={e => setForm({ ...form, min_order_amount: e.target.value })} />
            </div>
            {form.discount_type === 'percentage' && (
              <div>
                <label className={labelCls}>Maksimum Diskon (Rp)</label>
                <input className={inputCls} type="number" placeholder="Kosong = unlimited"
                  value={form.max_discount_amount}
                  onChange={e => setForm({ ...form, max_discount_amount: e.target.value })} />
              </div>
            )}
            <div>
              <label className={labelCls}>Batas Pemakaian</label>
              <input className={inputCls} type="number" placeholder="Kosong = unlimited"
                value={form.usage_limit}
                onChange={e => setForm({ ...form, usage_limit: e.target.value })} />
            </div>
            <div>
              <label className={labelCls}>Berlaku Sampai</label>
              <input className={inputCls} type="datetime-local"
                value={form.valid_until}
                onChange={e => setForm({ ...form, valid_until: e.target.value })} />
            </div>
            <div className="col-span-2 flex gap-3 pt-2">
              <button type="submit" disabled={loading}
                className="px-5 py-2 rounded-lg text-sm font-semibold text-white bg-[#0A2F73] hover:opacity-90 disabled:opacity-50">
                {loading ? 'Menyimpan...' : 'Simpan Promo'}
              </button>
              <button type="button" onClick={() => setShowForm(false)}
                className="px-5 py-2 rounded-lg text-sm font-semibold text-[#5E6B85] border border-[#E5EAF0] hover:bg-gray-50">
                Batal
              </button>
            </div>
          </form>
        </div>
      ) : (
        <button onClick={() => setShowForm(true)}
          className="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-[#0A2F73] hover:opacity-90">
          + Buat Kode Promo
        </button>
      )}

      {/* Broadcast panel */}
      {showBroadcast && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-amber-800 mb-3">
            Broadcast WA, Kode: <span className="font-mono">{showBroadcast}</span>
          </h3>
          <textarea rows={3} className={`${inputCls} mb-3`}
            placeholder={`Dapatkan diskon spesial! Gunakan kode promo *${showBroadcast}* untuk potongan harga di toko kamu.`}
            value={broadcastMsg} onChange={e => setBroadcastMsg(e.target.value)} />
          {broadcastResult && <p className="text-sm text-green-700 mb-2">{broadcastResult}</p>}
          <div className="flex gap-2">
            <button onClick={handleBroadcast} disabled={loading || !broadcastMsg.trim()}
              className="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-amber-600 hover:opacity-90 disabled:opacity-50">
              {loading ? 'Mengirim...' : '📤 Kirim ke Semua Merchant'}
            </button>
            <button onClick={() => { setShowBroadcast(null); setBroadcastResult('') }}
              className="px-4 py-2 rounded-lg text-sm text-[#5E6B85] border border-[#E5EAF0] hover:bg-gray-50">
              Tutup
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl border border-[#E5EAF0] overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-[#F8FAFC] border-b border-[#E5EAF0]">
            <tr>
              <th className="text-left px-5 py-3 font-medium text-[#5E6B85]">Kode</th>
              <th className="text-left px-5 py-3 font-medium text-[#5E6B85]">Diskon</th>
              <th className="text-left px-5 py-3 font-medium text-[#5E6B85]">Pemakaian</th>
              <th className="text-left px-5 py-3 font-medium text-[#5E6B85]">Berlaku s/d</th>
              <th className="text-left px-5 py-3 font-medium text-[#5E6B85]">Status</th>
              <th className="px-5 py-3 font-medium text-[#5E6B85]">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {!promos.length && (
              <tr><td colSpan={6} className="px-5 py-10 text-center text-[#5E6B85]">Belum ada kode promo</td></tr>
            )}
            {promos.map(p => (
              <tr key={p.id} className="border-b border-[#E5EAF0] last:border-0 hover:bg-[#F8FAFC]">
                <td className="px-5 py-4">
                  <span className="font-mono font-bold text-[#0A2F73]">{p.code}</span>
                  {p.min_order_amount > 0 && (
                    <div className="text-xs text-[#5E6B85] mt-0.5">Min: {fmt(p.min_order_amount)}</div>
                  )}
                </td>
                <td className="px-5 py-4">
                  <span className="font-semibold">
                    {p.discount_type === 'percentage' ? `${p.discount_value}%` : fmt(p.discount_value)}
                  </span>
                  {p.max_discount_amount && (
                    <div className="text-xs text-[#5E6B85]">Maks: {fmt(p.max_discount_amount)}</div>
                  )}
                </td>
                <td className="px-5 py-4 text-[#5E6B85]">
                  {p.used_count} / {p.usage_limit ?? '∞'}
                </td>
                <td className="px-5 py-4 text-[#5E6B85]">
                  {p.valid_until ? new Date(p.valid_until).toLocaleDateString('id-ID') : '—'}
                </td>
                <td className="px-5 py-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${p.is_active ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {p.is_active ? 'Aktif' : 'Nonaktif'}
                  </span>
                </td>
                <td className="px-5 py-4">
                  <div className="flex gap-2 justify-end">
                    <button onClick={() => { setShowBroadcast(p.code); setBroadcastMsg('') }}
                      className="text-xs px-3 py-1.5 rounded-lg border border-[#E5EAF0] text-amber-600 hover:bg-amber-50">
                      📤 Broadcast
                    </button>
                    <button onClick={() => toggleActive(p.id, p.is_active)}
                      className="text-xs px-3 py-1.5 rounded-lg border border-[#E5EAF0] text-[#5E6B85] hover:bg-gray-50">
                      {p.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
