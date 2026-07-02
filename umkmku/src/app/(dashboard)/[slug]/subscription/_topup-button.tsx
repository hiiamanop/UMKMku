'use client'

import { useState, useRef } from 'react'
import { ShoppingBag, Loader2, X, Plus, Minus, Upload, ZoomIn } from 'lucide-react'

const PRIMARY = '#0A2F73'

interface Props {
  packageId: string
  tenantId: string
  packageName: string
  price: number
  transactionQuota: number
}

type Step = 'qty' | 'payment' | 'uploading' | 'done' | 'rejected'

export function TopUpButton({ packageId, tenantId, packageName, price, transactionQuota }: Props) {
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState<Step>('qty')
  const [qty, setQty] = useState(1)
  const [orderId, setOrderId] = useState<string | null>(null)
  const [qrisUrl, setQrisUrl] = useState<string | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [zoomed, setZoomed] = useState(false)
  const [qrisZoomed, setQrisZoomed] = useState(false)
  const [message, setMessage] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const totalAmount = price * qty
  const totalQuota = transactionQuota * qty

  function reset() {
    setStep('qty')
    setQty(1)
    setOrderId(null)
    setQrisUrl(null)
    setFile(null)
    setPreview(null)
    setMessage('')
  }

  function close() { setOpen(false); setTimeout(reset, 300) }

  async function checkout() {
    setStep('uploading')
    const res = await fetch('/api/topup/create-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ packageId, tenantId, quantity: qty }),
    }).then(r => r.json()).catch(() => null)

    if (!res?.orderId) { setStep('qty'); return }
    setOrderId(res.orderId)
    setQrisUrl(res.qrisUrl ?? null)
    setStep('payment')
  }

  async function uploadProof() {
    if (!file || !orderId) return
    setStep('uploading')
    const form = new FormData()
    form.append('file', file)
    form.append('orderId', orderId)
    form.append('amount', String(totalAmount))

    const res = await fetch('/api/topup/verify-payment', { method: 'POST', body: form })
      .then(r => r.json()).catch(() => null)

    if (res?.verified) {
      setStep('done')
    } else {
      setMessage(res?.message ?? 'Bukti tidak dapat diverifikasi.')
      setStep('rejected')
    }
  }

  return (
    <>
      <button
        onClick={() => { setOpen(true); reset() }}
        className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg text-white hover:opacity-90"
        style={{ background: PRIMARY }}
      >
        <ShoppingBag size={12} /> Beli
      </button>

      {open && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={e => e.target === e.currentTarget && close()}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h2 className="font-bold text-gray-900 text-sm">
                {step === 'qty' ? 'Top-up Kuota Pesanan' :
                 step === 'payment' ? 'Pembayaran QRIS' :
                 step === 'done' ? 'Top-up Berhasil' :
                 step === 'rejected' ? 'Verifikasi Gagal' : 'Memproses...'}
              </h2>
              <button onClick={close} className="p-1 rounded-lg hover:bg-gray-100 text-gray-400"><X size={15} /></button>
            </div>

            <div className="px-5 py-5 space-y-4">
              {/* Step: Qty */}
              {step === 'qty' && (
                <>
                  <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 space-y-1">
                    <div className="text-sm font-semibold text-gray-800">{packageName}</div>
                    <div className="text-xs text-gray-400">+{transactionQuota} pesanan per paket · Rp {price.toLocaleString('id-ID')}/paket</div>
                  </div>

                  <div className="space-y-1">
                    <div className="text-xs font-medium text-gray-500">Jumlah Paket</div>
                    <div className="flex items-center gap-3">
                      <button onClick={() => setQty(q => Math.max(1, q - 1))}
                        className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50">
                        <Minus size={13} />
                      </button>
                      <span className="text-lg font-bold w-8 text-center" style={{ color: PRIMARY }}>{qty}</span>
                      <button onClick={() => setQty(q => Math.min(10, q + 1))}
                        className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50">
                        <Plus size={13} />
                      </button>
                    </div>
                  </div>

                  <div className="rounded-xl p-4 space-y-2" style={{ background: '#EEF2FF' }}>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Total pesanan tambahan</span>
                      <span className="font-semibold" style={{ color: PRIMARY }}>+{totalQuota.toLocaleString()} pesanan</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Total bayar</span>
                      <span className="font-bold text-base" style={{ color: PRIMARY }}>Rp {totalAmount.toLocaleString('id-ID')}</span>
                    </div>
                  </div>

                  <button onClick={checkout}
                    className="w-full py-3 rounded-xl text-sm font-bold text-white hover:opacity-90"
                    style={{ background: PRIMARY }}>
                    Checkout
                  </button>
                </>
              )}

              {/* Step: Payment */}
              {step === 'payment' && (
                <>
                  <div className="text-xs text-gray-500 text-center">
                    Scan QRIS di bawah, bayar <strong>Rp {totalAmount.toLocaleString('id-ID')}</strong>, lalu upload bukti.
                  </div>

                  {qrisUrl && (
                    <div className="flex justify-center">
                      <div className="relative cursor-zoom-in" onClick={() => setQrisZoomed(true)}>
                        <img src={qrisUrl} alt="QRIS" className="w-48 h-48 object-contain rounded-xl border border-gray-100" />
                        <div className="absolute bottom-2 right-2 bg-black/50 text-white rounded-md px-1.5 py-0.5 text-xs flex items-center gap-1">
                          <ZoomIn size={10} /> Zoom
                        </div>
                      </div>
                    </div>
                  )}

                  <div>
                    <input ref={inputRef} type="file" accept="image/*" className="hidden"
                      onChange={e => {
                        const f = e.target.files?.[0]
                        if (f) { setFile(f); setPreview(URL.createObjectURL(f)) }
                      }} />
                    {file && preview ? (
                      <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-200 bg-gray-50">
                        <Upload size={13} className="text-gray-400 shrink-0" />
                        <span className="text-xs text-gray-700 flex-1 truncate">{file.name}</span>
                        <button onClick={() => setZoomed(true)} className="text-xs font-semibold shrink-0" style={{ color: PRIMARY }}>Preview</button>
                        <button onClick={() => { setFile(null); setPreview(null) }} className="text-xs text-gray-400 shrink-0 hover:text-red-500">Batal</button>
                      </div>
                    ) : (
                      <button onClick={() => inputRef.current?.click()}
                        className="w-full h-24 rounded-xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center gap-1.5 text-gray-400 hover:border-gray-300 hover:bg-gray-50 transition-colors">
                        <Upload size={18} />
                        <span className="text-xs">Upload bukti bayar</span>
                      </button>
                    )}
                  </div>

                  <button onClick={uploadProof} disabled={!file}
                    className="w-full py-3 rounded-xl text-sm font-bold text-white hover:opacity-90 disabled:opacity-40"
                    style={{ background: PRIMARY }}>
                    Verifikasi Pembayaran
                  </button>
                </>
              )}

              {/* Step: Uploading */}
              {step === 'uploading' && (
                <div className="flex flex-col items-center gap-3 py-8">
                  <Loader2 size={28} className="animate-spin" style={{ color: PRIMARY }} />
                  <p className="text-sm text-gray-500">Memproses...</p>
                </div>
              )}

              {/* Step: Done */}
              {step === 'done' && (
                <div className="text-center space-y-3 py-4">
                  <div className="text-3xl">✅</div>
                  <p className="font-semibold text-gray-800">Top-up Berhasil!</p>
                  <p className="text-xs text-gray-500">+{totalQuota} pesanan telah ditambahkan ke kuota akun kamu.</p>
                  <button onClick={close} className="w-full py-2.5 rounded-xl text-sm font-semibold text-white" style={{ background: PRIMARY }}>
                    Tutup
                  </button>
                </div>
              )}

              {/* Step: Rejected */}
              {step === 'rejected' && (
                <div className="space-y-3">
                  <div className="rounded-xl bg-red-50 border border-red-100 p-4 text-sm text-red-700"
                    dangerouslySetInnerHTML={{ __html: message }} />
                  <div className="flex gap-2">
                    <button onClick={() => { setFile(null); setPreview(null); setStep('payment') }}
                      className="flex-1 py-2.5 rounded-xl text-sm font-semibold border border-gray-200 text-gray-700 hover:bg-gray-50">
                      Coba Lagi
                    </button>
                    <button onClick={close} className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white" style={{ background: PRIMARY }}>
                      Tutup
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Lightbox proof */}
      {zoomed && preview && (
        <div className="fixed inset-0 z-[60] bg-black/90 flex items-center justify-center" onClick={() => setZoomed(false)}>
          <img src={preview} alt="zoom" className="max-w-[90vw] max-h-[90vh] object-contain rounded-xl" />
          <button onClick={() => setZoomed(false)} className="absolute top-4 right-4 bg-white/10 rounded-full p-2 text-white"><X size={18} /></button>
        </div>
      )}

      {/* Lightbox QRIS */}
      {qrisZoomed && qrisUrl && (
        <div className="fixed inset-0 z-[60] bg-black/90 flex items-center justify-center" onClick={() => setQrisZoomed(false)}>
          <img src={qrisUrl} alt="QRIS zoom" className="max-w-[90vw] max-h-[90vh] object-contain rounded-xl" />
          <button onClick={() => setQrisZoomed(false)} className="absolute top-4 right-4 bg-white/10 rounded-full p-2 text-white"><X size={18} /></button>
        </div>
      )}
    </>
  )
}
