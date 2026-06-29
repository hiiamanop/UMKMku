'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Loader2, Eye, EyeOff, CheckCircle2, ArrowRight, ArrowLeft, Sparkles } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { CategoryType } from '@/lib/categories'

const PRIMARY = '#0A2F73'
const GOLD = '#F4B400'
const BORDER = '#E5EAF0'
const TEXT_SEC = '#5E6B85'
const SURFACE = '#F8FAFC'

type Status = 'idle' | 'loading' | 'success' | 'error'
type Step = 'category' | 'description' | 'creating' | 'signup' | 'done'

interface OnboardingResult { slug: string; brand_name: string; store_url: string }

const CATEGORIES: { value: CategoryType; label: string; desc: string; icon: string }[] = [
  { value: 'skincare', label: 'Skincare & Beauty', desc: 'Perawatan kulit, makeup', icon: '✨' },
  { value: 'parfum', label: 'Parfum', desc: 'Wewangian lokal', icon: '🌸' },
  { value: 'fashion', label: 'Fashion', desc: 'Pakaian & aksesoris', icon: '👗' },
  { value: 'fdb', label: 'Makanan & Minuman', desc: 'F&B, snack, minuman', icon: '🍃' },
]

const PLAN_LABELS: Record<string, string> = {
  business: 'Business — Rp 399k/bln',
  enterprise: 'Enterprise — Rp 599k/bln',
  free: 'Free Trial 7 Hari',
}

const STEPS = ['Kategori', 'Ceritakan Bisnis', 'Buat Akun']

export function OnboardingChat() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const plan = searchParams.get('plan') ?? 'free'
  const invoiceId = searchParams.get('invoice')

  const [step, setStep] = useState<Step>('category')
  const [category, setCategory] = useState<CategoryType | null>(null)
  const [description, setDescription] = useState('')
  const [status, setStatus] = useState<Status>('idle')
  const [result, setResult] = useState<OnboardingResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [signupLoading, setSignupLoading] = useState(false)
  const [signupError, setSignupError] = useState<string | null>(null)
  const [emailIsMerchant, setEmailIsMerchant] = useState(false)

  async function checkEmail(val: string) {
    if (!val || !val.includes('@')) return
    const res = await fetch('/api/onboarding/check-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: val }),
    })
    const data = await res.json()
    setEmailIsMerchant(!!data.isMerchant)
  }

  const stepIndex = step === 'category' ? 0 : step === 'description' || step === 'creating' ? 1 : 2

  async function handleDescriptionSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!description.trim() || !category) return
    setStatus('loading')
    setStep('creating')
    setError(null)

    try {
      const res = await fetch('/api/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category, description, invoiceId }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? 'Terjadi kesalahan')
      }
      const data: OnboardingResult = await res.json()
      setResult(data)
      setStatus('success')
      setStep('signup')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan')
      setStatus('error')
      setStep('description')
    }
  }

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    if (!result) return
    if (password !== confirmPassword) { setSignupError('Password tidak cocok.'); return }
    if (password.length < 6) { setSignupError('Password minimal 6 karakter.'); return }

    setSignupLoading(true)
    setSignupError(null)

    const supabase = createClient()
    const { data: authData, error: signupErr } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    })

    // Deteksi email sudah terdaftar:
    // Supabase mengembalikan error eksplisit ATAU user dengan identities kosong
    const isExistingUser =
      signupErr?.message?.toLowerCase().includes('already') ||
      (authData.user?.identities?.length ?? 1) === 0

    if (isExistingUser) {
      setSignupError(
        `Email ini sudah terdaftar. Silakan login dulu di halaman login toko Anda, atau gunakan email lain untuk membuat merchant baru.`
      )
      setSignupLoading(false)
      return
    }

    if (signupErr) {
      setSignupError(signupErr.message)
      setSignupLoading(false)
      return
    }

    const userId = authData.user?.id
    if (userId) {
      await fetch('/api/onboarding/link-merchant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug: result.slug, userId }),
      })
    }

    setStep('done')
    setSignupLoading(false)
  }

  const inputCls = `w-full rounded-xl px-4 py-3 text-sm border outline-none transition-colors focus:border-[${PRIMARY}]`
  const inputStyle = { borderColor: BORDER, background: 'white' }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: SURFACE }}>

      {/* Top bar */}
      <div className="bg-white border-b px-6 py-4 flex items-center justify-between" style={{ borderColor: BORDER }}>
        <a href="/" className="text-lg font-bold" style={{ color: PRIMARY }}>
          UMKM<span style={{ color: GOLD }}>ku</span>
        </a>
        {plan !== 'free' && (
          <span className="text-xs font-semibold px-3 py-1.5 rounded-full" style={{ background: `${GOLD}22`, color: '#8B6800' }}>
            Plan: {PLAN_LABELS[plan]}
          </span>
        )}
      </div>

      {/* Progress */}
      <div className="bg-white border-b px-6 py-4" style={{ borderColor: BORDER }}>
        <div className="max-w-lg mx-auto flex items-center gap-3">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center gap-3 flex-1">
              <div className="flex items-center gap-2 shrink-0">
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                  style={{
                    background: i < stepIndex ? '#16a34a' : i === stepIndex ? PRIMARY : SURFACE,
                    color: i <= stepIndex ? 'white' : TEXT_SEC,
                    border: i > stepIndex ? `1px solid ${BORDER}` : 'none',
                  }}
                >
                  {i < stepIndex ? '✓' : i + 1}
                </div>
                <span className="text-xs font-medium hidden sm:block" style={{ color: i === stepIndex ? PRIMARY : TEXT_SEC }}>
                  {s}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div className="flex-1 h-px" style={{ background: i < stepIndex ? '#16a34a' : BORDER }} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex items-start justify-center px-6 py-12">
        <div className="w-full max-w-lg">

          {/* Step: category */}
          {step === 'category' && (
            <div>
              <h2 className="text-2xl font-bold mb-2" style={{ color: PRIMARY }}>Bisnis kamu di bidang apa?</h2>
              <p className="text-sm mb-8" style={{ color: TEXT_SEC }}>
                Pilih kategori agar AI bisa membuat toko yang tepat untuk bisnismu.
              </p>
              <div className="grid grid-cols-2 gap-3">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.value}
                    onClick={() => { setCategory(cat.value); setStep('description') }}
                    className="p-5 rounded-2xl text-left transition-all hover:shadow-md group"
                    style={{ background: 'white', border: `1.5px solid ${BORDER}` }}
                    onMouseEnter={e => (e.currentTarget.style.borderColor = PRIMARY)}
                    onMouseLeave={e => (e.currentTarget.style.borderColor = BORDER)}
                  >
                    <span className="text-3xl block mb-3">{cat.icon}</span>
                    <div className="font-semibold text-sm" style={{ color: PRIMARY }}>{cat.label}</div>
                    <div className="text-xs mt-0.5" style={{ color: TEXT_SEC }}>{cat.desc}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step: description */}
          {step === 'description' && (
            <form onSubmit={handleDescriptionSubmit}>
              <button
                type="button"
                onClick={() => setStep('category')}
                className="flex items-center gap-1.5 text-sm mb-6 transition-opacity hover:opacity-70"
                style={{ color: TEXT_SEC }}
              >
                <ArrowLeft size={14} /> Kembali
              </button>
              <h2 className="text-2xl font-bold mb-2" style={{ color: PRIMARY }}>
                Ceritakan brand kamu
              </h2>
              <p className="text-sm mb-6" style={{ color: TEXT_SEC }}>
                AI akan buat tokomu dalam hitungan detik. Semakin detail, semakin bagus hasilnya.
              </p>

              <div className="rounded-xl p-4 mb-5 text-sm" style={{ background: `${PRIMARY}08`, border: `1px solid ${PRIMARY}20` }}>
                <strong style={{ color: PRIMARY }}>Contoh:</strong>{' '}
                <span style={{ color: TEXT_SEC }}>
                  "Brand saya namanya Glow.id, skincare lokal dengan warna sage dan krem. Ada 3 produk: Vitamin C Serum, Barrier Moisturizer, dan SPF 50. WA 08123456789."
                </span>
              </div>

              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Ceritakan nama brand, produk, warna favorit, dan siapa target customermu..."
                className="w-full rounded-xl px-4 py-4 text-sm border outline-none resize-none transition-colors"
                style={{ ...inputStyle, minHeight: '160px', borderColor: BORDER }}
                onFocus={e => (e.target.style.borderColor = PRIMARY)}
                onBlur={e => (e.target.style.borderColor = BORDER)}
                disabled={status === 'loading'}
              />

              {error && (
                <div className="mt-3 p-3 rounded-xl text-sm text-red-700 bg-red-50 border border-red-200">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={!description.trim() || status === 'loading'}
                className="mt-5 w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-semibold text-base transition-opacity hover:opacity-90 disabled:opacity-50"
                style={{ background: PRIMARY, color: 'white' }}
              >
                <Sparkles size={16} />
                Buat Toko Saya
                <ArrowRight size={16} />
              </button>
            </form>
          )}

          {/* Step: creating (loading) */}
          {step === 'creating' && (
            <div className="text-center py-16 flex flex-col items-center gap-6">
              <div className="relative">
                <div className="w-20 h-20 rounded-full flex items-center justify-center" style={{ background: `${PRIMARY}12` }}>
                  <Loader2 size={36} className="animate-spin" style={{ color: PRIMARY }} />
                </div>
              </div>
              <div>
                <h2 className="text-xl font-bold" style={{ color: PRIMARY }}>AI sedang membangun tokomu...</h2>
                <p className="text-sm mt-2" style={{ color: TEXT_SEC }}>
                  Menganalisis bisnis, memilih warna, menyiapkan produk. Sebentar lagi! ✨
                </p>
              </div>
              <div className="flex gap-1.5">
                {[0, 1, 2].map(i => (
                  <div
                    key={i}
                    className="w-2 h-2 rounded-full animate-bounce"
                    style={{ background: PRIMARY, animationDelay: `${i * 0.15}s` }}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Step: signup */}
          {step === 'signup' && result && (
            <div>
              <div
                className="flex items-start gap-3 p-4 rounded-2xl mb-7"
                style={{ background: '#f0fdf4', border: '1px solid #bbf7d0' }}
              >
                <CheckCircle2 size={18} className="text-green-500 shrink-0 mt-0.5" />
                <div>
                  <div className="text-sm font-semibold text-green-800">Toko <em>{result.brand_name}</em> berhasil dibuat!</div>
                  <div className="text-xs text-green-700 mt-0.5">
                    Buat akun untuk mengakses dashboard dan mengelola tokomu.
                  </div>
                </div>
              </div>

              <h2 className="text-2xl font-bold mb-6" style={{ color: PRIMARY }}>Buat akun kamu</h2>

              <form onSubmit={handleSignup} className="flex flex-col gap-4">
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: PRIMARY }}>Nama Lengkap</label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    placeholder="Nama kamu"
                    className={inputCls}
                    style={inputStyle}
                    onFocus={e => (e.target.style.borderColor = PRIMARY)}
                    onBlur={e => (e.target.style.borderColor = BORDER)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: PRIMARY }}>Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => { setEmail(e.target.value); setEmailIsMerchant(false) }}
                    placeholder="email@bisnis.com"
                    required
                    className={inputCls}
                    style={inputStyle}
                    onFocus={e => (e.target.style.borderColor = PRIMARY)}
                    onBlur={e => { e.target.style.borderColor = BORDER; checkEmail(e.target.value) }}
                  />
                  {emailIsMerchant && (
                    <p className="mt-1.5 text-xs font-medium px-3 py-2 rounded-lg" style={{ background: '#fff7ed', color: '#9a3412', border: '1px solid #fed7aa' }}>
                      Email ini sudah tersambung dengan merchant.
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: PRIMARY }}>Password</label>
                  <div className="relative">
                    <input
                      type={showPw ? 'text' : 'password'}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="Minimal 6 karakter"
                      required
                      className={inputCls}
                      style={inputStyle}
                      onFocus={e => (e.target.style.borderColor = PRIMARY)}
                      onBlur={e => (e.target.style.borderColor = BORDER)}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPw(v => !v)}
                      className="absolute right-3 top-3.5"
                      style={{ color: TEXT_SEC }}
                    >
                      {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: PRIMARY }}>Konfirmasi Password</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    placeholder="Ulangi password"
                    required
                    className={inputCls}
                    style={inputStyle}
                    onFocus={e => (e.target.style.borderColor = PRIMARY)}
                    onBlur={e => (e.target.style.borderColor = BORDER)}
                  />
                </div>

                {signupError && (
                  <div className="p-3 rounded-xl text-sm text-red-700 bg-red-50 border border-red-200">
                    {signupError}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={signupLoading || !email || !password}
                  className="mt-2 w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-semibold text-base transition-opacity hover:opacity-90 disabled:opacity-50"
                  style={{ background: PRIMARY, color: 'white' }}
                >
                  {signupLoading ? (
                    <><Loader2 className="animate-spin" size={16} /> Membuat akun...</>
                  ) : plan !== 'free' ? (
                    <>Buat Akun & Lanjut ke Pembayaran <ArrowRight size={16} /></>
                  ) : (
                    <>Buat Akun & Masuk Dashboard <ArrowRight size={16} /></>
                  )}
                </button>

                <p className="text-center text-xs" style={{ color: TEXT_SEC }}>
                  Dengan membuat akun kamu menyetujui{' '}
                  <a href="/syarat-ketentuan" className="underline">Syarat & Ketentuan</a> UMKMku.
                </p>
              </form>
            </div>
          )}

          {/* Step: done (email confirm) */}
          {step === 'done' && result && (
            <div className="text-center py-8 flex flex-col items-center gap-6">
              <div className="w-20 h-20 rounded-full flex items-center justify-center" style={{ background: '#f0fdf4' }}>
                <CheckCircle2 size={36} className="text-green-500" />
              </div>
              <div className="flex flex-col gap-2">
                <h2 className="text-2xl font-bold" style={{ color: PRIMARY }}>Akun berhasil dibuat! 🎉</h2>
                <p className="text-sm leading-relaxed max-w-sm" style={{ color: TEXT_SEC }}>
                  Kami mengirim link verifikasi ke{' '}
                  <strong style={{ color: PRIMARY }}>{email}</strong>.
                  <br /><br />
                  Buka email, klik link konfirmasi, lalu login ke dashboard.
                </p>
              </div>

              <div className="w-full rounded-2xl p-5 text-sm text-left flex flex-col gap-3" style={{ background: SURFACE, border: `1px solid ${BORDER}` }}>
                {[
                  '1. Buka inbox (cek juga folder Spam)',
                  '2. Cari email dari noreply@mail.app.supabase.io',
                  plan !== 'free'
                    ? '3. Klik "Confirm your email" → lanjut bayar'
                    : '3. Klik "Confirm your email" → login ke dashboard',
                ].map(s => (
                  <div key={s} className="flex items-center gap-2" style={{ color: TEXT_SEC }}>
                    <span style={{ color: GOLD }}>→</span> {s}
                  </div>
                ))}
              </div>

              {process.env.NODE_ENV === 'development' && (
                <div className="w-full rounded-2xl p-4 text-xs text-left" style={{ background: '#fff7ed', border: '1px solid #fed7aa' }}>
                  <strong style={{ color: '#9a3412' }}>Development mode?</strong>
                  <span style={{ color: '#9a3412' }}>{' '}Email masuk ke Supabase Inbucket:{' '}
                    <a href="http://localhost:54324" target="_blank" rel="noopener noreferrer" className="underline font-mono">
                      localhost:54324
                    </a>
                  </span>
                </div>
              )}

              <div className="flex flex-col gap-3 w-full">
                <a
                  href={plan !== 'free'
                    ? `/subscribe/payment?plan=${plan}&slug=${result.slug}`
                    : `/${result.slug}`}
                  className="flex items-center justify-center gap-2 py-3.5 rounded-2xl text-sm font-semibold text-white transition-opacity hover:opacity-90"
                  style={{ background: PRIMARY }}
                >
                  {plan !== 'free' ? 'Lanjut ke Pembayaran' : 'Ke Dashboard Toko'}
                  <ArrowRight size={14} />
                </a>
                <p className="text-xs" style={{ color: TEXT_SEC }}>
                  Tidak menerima email?{' '}
                  <button
                    onClick={async () => {
                      const supabase = (await import('@/lib/supabase/client')).createClient()
                      await supabase.auth.resend({ type: 'signup', email })
                      alert('Email konfirmasi sudah dikirim ulang.')
                    }}
                    className="underline"
                  >
                    Kirim ulang
                  </button>
                </p>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
