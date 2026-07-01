'use client'

import { useState, useRef, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Clock, Upload, Loader2, Copy, Check, AlertTriangle } from 'lucide-react'

const PRIMARY = '#0A2F73'
const GOLD = '#F4B400'
const BORDER = '#E5EAF0'
const TEXT_SEC = '#5E6B85'
const SURFACE = '#F8FAFC'

interface Props {
  invoiceId: string
  planName: string
  fullName: string
  email: string
  amount: number
  qrisUrl: string | null
  isPaid: boolean
  createdAt: string
}

function refCode(id: string) {
  return id.replace(/-/g, '').slice(-6).toUpperCase()
}

function useCountdown(createdAt: string) {
  const deadline = new Date(new Date(createdAt).getTime() + 30 * 60 * 1000)
  const [remaining, setRemaining] = useState(() => Math.max(0, deadline.getTime() - Date.now()))

  useEffect(() => {
    const id = setInterval(() => {
      const left = Math.max(0, deadline.getTime() - Date.now())
      setRemaining(left)
      if (left === 0) clearInterval(id)
    }, 1000)
    return () => clearInterval(id)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const mins = Math.floor(remaining / 60000)
  const secs = Math.floor((remaining % 60000) / 1000)
  return { remaining, label: `${mins}:${secs.toString().padStart(2, '0')}` }
}

export function QrisPaymentClient({ invoiceId, planName, fullName, email, amount, qrisUrl, isPaid, createdAt }: Props) {
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [status, setStatus] = useState<'idle' | 'uploading' | 'pending_manual' | 'rejected' | 'expired' | 'error'>(
    isPaid ? 'pending_manual' : 'idle'
  )
  const [message, setMessage] = useState('')
  const [zoomed, setZoomed] = useState(false)
  const [copied, setCopied] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const ref = refCode(invoiceId)
  const countdown = useCountdown(createdAt)

  // auto-expire di client saat timer habis
  useEffect(() => {
    if (countdown.remaining === 0 && status === 'idle') setStatus('expired')
  }, [countdown.remaining, status])

  function handleFile(f: File) {
    setFile(f)
    setPreview(URL.createObjectURL(f))
    setStatus('idle')
  }

  async function handleVerify() {
    if (!file) return
    setStatus('uploading')
    const form = new FormData()
    form.append('file', file)
    form.append('invoiceId', invoiceId)
    form.append('amount', String(amount))
    const res = await fetch('/api/subscribe/verify-payment', { method: 'POST', body: form })
    const data = await res.json()
    if (data.verified) {
      setStatus('pending_manual')
    } else if (data.expired) {
      setStatus('expired')
      setMessage(data.message ?? 'Batas waktu habis.')
    } else {
      setStatus('rejected')
      setMessage(data.message ?? 'Bukti tidak valid, coba upload ulang.')
    }
  }

  function copyRef() {
    navigator.clipboard.writeText(ref)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const fmt = (n: number) => 'Rp ' + n.toLocaleString('id-ID')

  return (
    <div className="min-h-screen font-sans" style={{ background: SURFACE }}>
      <nav style={{ borderBottom: `1px solid ${BORDER}`, background: 'white' }} className="sticky top-0 z-50">
        <div className="mx-auto max-w-2xl px-6 flex items-center h-16">
          <Link href="/">
            <img src="/logo.png" alt="UMKMu" style={{ height: '32px', width: 'auto' }} />
          </Link>
        </div>
      </nav>

      <div className="mx-auto max-w-2xl px-6 py-12 flex flex-col gap-6">

        {/* Status: menunggu validasi manual admin */}
        {status === 'pending_manual' ? (
          <div className="bg-white rounded-2xl p-8 text-center" style={{ border: `1px solid ${BORDER}` }}>
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5"
              style={{ background: '#FEF9C3' }}>
              <Clock size={32} style={{ color: '#CA8A04' }} />
            </div>
            <h1 className="text-2xl font-bold mb-3" style={{ color: PRIMARY }}>
              Pembayaran sedang diverifikasi
            </h1>
            <p className="text-sm leading-relaxed mb-2" style={{ color: TEXT_SEC }}>
              Bukti pembayaran kamu telah lolos pemeriksaan awal oleh sistem kami dan
              kini sedang menunggu <strong>validasi manual</strong> dari tim UMKMu.
            </p>
            <p className="text-sm leading-relaxed mb-3" style={{ color: TEXT_SEC }}>
              Setelah divalidasi, kamu akan menerima email di{' '}
              <strong style={{ color: PRIMARY }}>{email}</strong>{' '}
              berisi link untuk melanjutkan setup toko. Proses ini biasanya selesai dalam 1×24 jam.
            </p>
            <div className="rounded-xl px-4 py-3 mb-6 text-left"
              style={{ background: '#FFFBEB', border: '1px solid #FDE68A' }}>
              <p className="text-xs font-semibold text-yellow-800 mb-0.5">💡 Tips</p>
              <p className="text-xs text-yellow-700 leading-relaxed">
                Email dari kami kadang masuk ke folder <strong>Spam</strong> atau <strong>Promosi</strong>.
                Pastikan kamu cek kedua folder tersebut jika tidak menemukan email di kotak masuk.
              </p>
            </div>
            <div className="rounded-xl p-4 text-left mb-6"
              style={{ background: SURFACE, border: `1px solid ${BORDER}` }}>
              <p className="text-xs font-semibold mb-1" style={{ color: TEXT_SEC }}>No. Referensi</p>
              <p className="font-mono text-lg font-bold" style={{ color: PRIMARY }}>{ref}</p>
              <p className="text-xs mt-1" style={{ color: TEXT_SEC }}>Simpan nomor ini jika perlu konfirmasi</p>
            </div>
          </div>
        ) : status === 'expired' ? (
          <div className="bg-white rounded-2xl p-8 text-center" style={{ border: `1px solid ${BORDER}` }}>
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5"
              style={{ background: '#FEE2E2' }}>
              <AlertTriangle size={32} className="text-red-500" />
            </div>
            <h1 className="text-2xl font-bold mb-3" style={{ color: PRIMARY }}>Waktu habis</h1>
            <p className="text-sm leading-relaxed mb-6" style={{ color: TEXT_SEC }}>
              Batas waktu upload bukti bayar (30 menit) telah habis. Silakan mulai ulang proses berlangganan.
            </p>
            <Link href="/subscribe"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm"
              style={{ background: PRIMARY, color: 'white' }}>
              Buat Invoice Baru
            </Link>
          </div>
        ) : (
          <>
            <div>
              <h1 className="text-2xl font-bold" style={{ color: PRIMARY }}>Selesaikan Pembayaran</h1>
              <p className="text-sm mt-1" style={{ color: TEXT_SEC }}>
                Halo <strong>{fullName}</strong>, scan QRIS di bawah lalu upload bukti bayar.
              </p>
            </div>

            {/* Timer 30 menit */}
            <div className="rounded-2xl p-4 flex items-center gap-3"
              style={{
                background: countdown.remaining < 5 * 60 * 1000 ? '#FEF2F2' : '#F0FDF4',
                border: `1px solid ${countdown.remaining < 5 * 60 * 1000 ? '#FECACA' : '#BBF7D0'}`,
              }}>
              <Clock size={18} style={{ color: countdown.remaining < 5 * 60 * 1000 ? '#DC2626' : '#16A34A', flexShrink: 0 }} />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold" style={{ color: countdown.remaining < 5 * 60 * 1000 ? '#DC2626' : '#15803D' }}>
                  {countdown.remaining > 0
                    ? `Upload bukti bayar dalam ${countdown.label}`
                    : 'Waktu habis'}
                </p>
                <p className="text-[11px] mt-0.5" style={{ color: TEXT_SEC }}>
                  Timestamp di struk harus sesuai dengan waktu transaksi dalam 30 menit ini
                </p>
              </div>
            </div>

            {/* Ringkasan */}
            <div className="bg-white rounded-2xl p-5" style={{ border: `1px solid ${BORDER}` }}>
              <div className="flex justify-between text-sm py-2" style={{ borderBottom: `1px solid ${BORDER}` }}>
                <span style={{ color: TEXT_SEC }}>Plan</span>
                <span className="font-semibold" style={{ color: PRIMARY }}>UMKMu {planName}</span>
              </div>
              <div className="flex justify-between text-sm py-2" style={{ borderBottom: `1px solid ${BORDER}` }}>
                <span style={{ color: TEXT_SEC }}>Email</span>
                <span style={{ color: PRIMARY }}>{email}</span>
              </div>
              <div className="flex justify-between py-3">
                <span className="font-bold" style={{ color: PRIMARY }}>Total Bayar</span>
                <span className="text-xl font-bold" style={{ color: PRIMARY }}>{fmt(amount)}</span>
              </div>
            </div>

            {/* Kode referensi */}
            <div className="rounded-2xl p-5" style={{ background: `${PRIMARY}08`, border: `1px solid ${PRIMARY}20` }}>
              <p className="text-xs font-semibold mb-2" style={{ color: PRIMARY }}>
                Kode referensi pembayaran
              </p>
              <div className="flex items-center gap-3 mb-2">
                <span className="font-mono text-2xl font-bold tracking-widest" style={{ color: PRIMARY }}>{ref}</span>
                <button onClick={copyRef}
                  className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg border transition-colors"
                  style={{ borderColor: PRIMARY, color: PRIMARY }}>
                  {copied ? <><Check size={12} /> Tersalin</> : <><Copy size={12} /> Salin</>}
                </button>
              </div>
              <p className="text-xs leading-relaxed" style={{ color: TEXT_SEC }}>
                Jika kamu bayar via <strong>m-banking</strong>, tulis kode ini di kolom catatan/berita transfer, membantu verifikasi lebih cepat.
                Jika via <strong>e-wallet</strong> (GoPay, OVO, dll) yang tidak ada kolom catatan, lewati saja.
              </p>
            </div>

            {/* QRIS */}
            <div className="bg-white rounded-2xl p-6 flex flex-col items-center gap-4"
              style={{ border: `1px solid ${BORDER}` }}>
              <p className="text-sm font-semibold" style={{ color: PRIMARY }}>Scan QRIS Ini</p>
              {qrisUrl ? (
                <>
                  <button onClick={() => setZoomed(true)} className="relative w-56 h-56 group">
                    <Image src={qrisUrl} alt="QRIS UMKMu" fill className="object-contain" />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors rounded-xl flex items-end justify-center pb-2">
                      <span className="text-[10px] text-white bg-black/40 px-2 py-0.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                        klik untuk zoom
                      </span>
                    </div>
                  </button>
                  {zoomed && (
                    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-6"
                      onClick={() => setZoomed(false)}>
                      <div className="relative w-full max-w-sm aspect-square">
                        <Image src={qrisUrl} alt="QRIS UMKMu" fill className="object-contain" />
                      </div>
                      <p className="absolute bottom-8 text-white/60 text-sm">Ketuk untuk tutup</p>
                    </div>
                  )}
                </>
              ) : (
                <div className="w-56 h-56 rounded-xl flex items-center justify-center text-xs text-center px-4"
                  style={{ background: SURFACE, border: `2px dashed ${BORDER}`, color: TEXT_SEC }}>
                  QRIS belum dikonfigurasi.<br />Hubungi kami via WhatsApp.
                </div>
              )}
              <p className="text-xs text-center" style={{ color: TEXT_SEC }}>
                Pastikan nominal transfer tepat <strong>{fmt(amount)}</strong> dan kode referensi <strong>{ref}</strong> tertulis di catatan
              </p>
            </div>

            {/* Upload bukti */}
            <div className="bg-white rounded-2xl p-6" style={{ border: `1px solid ${BORDER}` }}>
              <p className="text-sm font-semibold mb-4" style={{ color: PRIMARY }}>Upload Bukti Pembayaran</p>

              <input ref={inputRef} type="file" accept="image/*" className="hidden"
                onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />

              {preview ? (
                <div className="flex flex-col items-center gap-4">
                  <div className="relative w-full max-w-xs h-48 rounded-xl overflow-hidden"
                    style={{ border: `1px solid ${BORDER}` }}>
                    <Image src={preview} alt="Bukti bayar" fill className="object-contain" />
                  </div>
                  <button onClick={() => inputRef.current?.click()}
                    className="text-xs underline" style={{ color: TEXT_SEC }}>
                    Ganti foto
                  </button>
                </div>
              ) : (
                <button onClick={() => inputRef.current?.click()}
                  className="w-full py-10 rounded-xl flex flex-col items-center gap-3 transition-colors"
                  style={{ border: `2px dashed ${BORDER}`, background: SURFACE }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = PRIMARY)}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = BORDER)}>
                  <Upload size={24} style={{ color: TEXT_SEC }} />
                  <span className="text-sm" style={{ color: TEXT_SEC }}>Klik untuk pilih foto bukti transfer</span>
                </button>
              )}

              {(status === 'rejected' || status === 'error') && (
                <div className="mt-4 p-3 rounded-xl text-sm text-red-700 bg-red-50 border border-red-100">
                  {message}
                </div>
              )}

              <button onClick={handleVerify} disabled={!file || status === 'uploading'}
                className="mt-5 w-full flex items-center justify-center gap-2 py-4 rounded-xl font-semibold text-base transition-opacity hover:opacity-90 disabled:opacity-50"
                style={{ background: GOLD, color: '#1a1a1a' }}>
                {status === 'uploading'
                  ? <><Loader2 className="animate-spin" size={16} /> Memverifikasi...</>
                  : 'Kirim & Verifikasi'}
              </button>

              <p className="text-center text-xs mt-3" style={{ color: TEXT_SEC }}>
                Bukti bayar akan dicek otomatis oleh AI, lalu divalidasi manual oleh tim kami.
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
