'use client'

import { useState } from 'react'
import { Loader2, ArrowRight, QrCode, CreditCard } from 'lucide-react'
import type { PricingBreakdown } from '@/lib/utils/pricing'

const PRIMARY = '#0A2F73'
const GOLD = '#F4B400'
const BORDER = '#E5EAF0'
const TEXT_SEC = '#5E6B85'

interface Props {
  plan: { id: string; name: string; price: number }
  pricing: PricingBreakdown
  slug?: string
}

export function CheckoutForm({ plan, pricing, slug }: Props) {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<'manual_qris' | 'xendit'>('manual_qris')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const inputCls = 'w-full rounded-xl px-4 py-3 text-sm border outline-none transition-colors bg-white'
  const inputStyle = { borderColor: BORDER }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/subscribe/create-invoice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId: plan.id, fullName, email, phone, paymentMethod, slug }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Gagal membuat invoice')
      window.location.href = data.redirectUrl ?? data.invoiceUrl
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan')
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-2xl p-7" style={{ border: `1px solid ${BORDER}` }}>
      <div className="mb-6">
        <h2 className="text-lg font-bold" style={{ color: PRIMARY }}>Data Diri</h2>
        <p className="text-xs mt-1" style={{ color: TEXT_SEC }}>
          Akan digunakan untuk akun dan invoice pembayaran.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="block text-xs font-semibold mb-1.5" style={{ color: PRIMARY }}>Nama Lengkap</label>
          <input type="text" value={fullName} onChange={e => setFullName(e.target.value)}
            placeholder="Nama lengkap sesuai KTP" required className={inputCls} style={inputStyle}
            onFocus={e => (e.target.style.borderColor = PRIMARY)} onBlur={e => (e.target.style.borderColor = BORDER)} />
        </div>

        <div>
          <label className="block text-xs font-semibold mb-1.5" style={{ color: PRIMARY }}>Email Aktif</label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)}
            placeholder="email@bisnis.com" required className={inputCls} style={inputStyle}
            onFocus={e => (e.target.style.borderColor = PRIMARY)} onBlur={e => (e.target.style.borderColor = BORDER)} />
          <p className="text-xs mt-1" style={{ color: TEXT_SEC }}>Konfirmasi & invoice dikirim ke email ini</p>
        </div>

        <div>
          <label className="block text-xs font-semibold mb-1.5" style={{ color: PRIMARY }}>Nomor WhatsApp</label>
          <input type="tel" value={phone} onChange={e => setPhone(e.target.value)}
            placeholder="08xxxxxxxxxx" className={inputCls} style={inputStyle}
            onFocus={e => (e.target.style.borderColor = PRIMARY)} onBlur={e => (e.target.style.borderColor = BORDER)} />
          <p className="text-xs mt-1" style={{ color: TEXT_SEC }}>Opsional, untuk notifikasi aktivasi via WA</p>
        </div>

        {/* Metode Pembayaran */}
        <div>
          <label className="block text-xs font-semibold mb-2" style={{ color: PRIMARY }}>Metode Pembayaran</label>
          <div className="flex flex-col gap-2">

            {/* QRIS Manual, aktif */}
            <button
              type="button"
              onClick={() => setPaymentMethod('manual_qris')}
              className="flex items-center gap-3 p-4 rounded-xl border-2 text-left transition-all"
              style={{
                borderColor: paymentMethod === 'manual_qris' ? PRIMARY : BORDER,
                background: paymentMethod === 'manual_qris' ? `${PRIMARY}08` : 'white',
              }}
            >
              <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: paymentMethod === 'manual_qris' ? PRIMARY : BORDER }}>
                <QrCode size={18} color={paymentMethod === 'manual_qris' ? 'white' : TEXT_SEC} />
              </div>
              <div className="flex-1">
                <div className="text-sm font-semibold" style={{ color: PRIMARY }}>QRIS Manual</div>
                <div className="text-xs mt-0.5" style={{ color: TEXT_SEC }}>
                  Scan QRIS → upload bukti → diverifikasi otomatis
                </div>
              </div>
              <div className="w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center"
                style={{ borderColor: paymentMethod === 'manual_qris' ? PRIMARY : BORDER }}>
                {paymentMethod === 'manual_qris' && (
                  <div className="w-2 h-2 rounded-full" style={{ background: PRIMARY }} />
                )}
              </div>
            </button>

            {/* Payment Gateway, disabled */}
            <div className="flex items-center gap-3 p-4 rounded-xl border text-left opacity-50 cursor-not-allowed"
              style={{ borderColor: BORDER }}>
              <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: BORDER }}>
                <CreditCard size={18} color={TEXT_SEC} />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-semibold" style={{ color: PRIMARY }}>Payment Gateway</span>
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded-full"
                    style={{ background: '#FFF3CD', color: '#856404' }}>
                    Belum tersedia
                  </span>
                </div>
                <div className="text-xs mt-0.5" style={{ color: TEXT_SEC }}>
                  VA, Kartu Kredit, e-wallet, segera hadir
                </div>
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="p-3 rounded-xl text-sm text-red-700 bg-red-50 border border-red-100">{error}</div>
        )}

        <div className="rounded-xl p-4 flex justify-between items-center"
          style={{ background: `${PRIMARY}08`, border: `1px solid ${PRIMARY}20` }}>
          <div>
            <div className="text-xs font-semibold" style={{ color: PRIMARY }}>UMKMu {plan.name}</div>
            <div className="text-xs mt-0.5" style={{ color: TEXT_SEC }}>Termasuk PPN 12%</div>
          </div>
          <div className="text-base font-bold" style={{ color: PRIMARY }}>
            Rp {pricing.finalPrice.toLocaleString('id-ID')}
          </div>
        </div>

        <button
          type="submit"
          disabled={loading || !email || !fullName}
          className="mt-1 w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-semibold text-base transition-opacity hover:opacity-90 disabled:opacity-50"
          style={{ background: GOLD, color: '#1a1a1a' }}
        >
          {loading ? (
            <><Loader2 className="animate-spin" size={16} /> Menyiapkan pembayaran...</>
          ) : (
            <><QrCode size={14} /> Lanjut ke Pembayaran <ArrowRight size={16} /></>
          )}
        </button>

        <p className="text-center text-xs" style={{ color: TEXT_SEC }}>
          Dengan melanjutkan kamu menyetujui{' '}
          <a href="/syarat-ketentuan" className="underline">Syarat & Ketentuan</a> UMKMu.
        </p>
      </form>
    </div>
  )
}
