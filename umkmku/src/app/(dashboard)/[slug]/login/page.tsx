'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Eye, EyeOff, Loader2 } from 'lucide-react'

function ResetPassword({ email }: { email: string }) {
  const [sent, setSent] = useState(false)
  const [sending, setSending] = useState(false)

  async function handleReset() {
    if (!email) { alert('Isi email kamu dulu di form di atas.'); return }
    setSending(true)
    const supabase = createClient()
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    })
    setSent(true)
    setSending(false)
  }

  if (sent) return (
    <p className="text-center text-xs text-green-600 mt-6">
      Link reset dikirim ke <strong>{email}</strong>. Cek inbox kamu.
    </p>
  )

  return (
    <p className="text-center text-xs text-gray-400 mt-6">
      <button onClick={handleReset} disabled={sending}
        className="text-gray-700 hover:underline font-medium disabled:opacity-50">
        {sending ? 'Mengirim...' : 'Lupa password?'}
      </button>
    </p>
  )
}

type Mode = 'loading' | 'login' | 'claim'

export default function DashboardLoginPage() {
  const { slug } = useParams<{ slug: string }>()
  const router = useRouter()
  const [mode, setMode] = useState<Mode>('loading')

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Cek apakah tenant sudah punya owner
  useEffect(() => {
    const supabase = createClient()
    supabase.from('tenants').select('owner_id').eq('slug', slug).single()
      .then(({ data, error }) => {
        if (error) { setMode('login'); return }
        setMode(data?.owner_id ? 'login' : 'claim')
      })
  }, [slug])

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password })

    if (authError || !data.user) {
      setError('Email atau password salah.')
      setLoading(false)
      return
    }

    // Verifikasi user adalah owner dari toko ini
    const { data: tenant } = await supabase
      .from('tenants').select('owner_id').eq('slug', slug).single()

    if (!tenant || tenant.owner_id !== data.user.id) {
      await supabase.auth.signOut()
      setError('Akun ini bukan pemilik toko ' + slug + '.')
      setLoading(false)
      return
    }

    router.push(`/${slug}`)
    router.refresh()
  }

  async function handleClaim(e: React.FormEvent) {
    e.preventDefault()
    if (password !== confirmPassword) {
      setError('Password tidak cocok.')
      return
    }
    if (password.length < 6) {
      setError('Password minimal 6 karakter.')
      return
    }

    setLoading(true)
    setError(null)

    const supabase = createClient()

    // Cek sekali lagi tenant masih unclaimed (race condition guard)
    const { data: tenant } = await supabase
      .from('tenants').select('owner_id').eq('slug', slug).single()

    if (tenant?.owner_id) {
      setError('Toko ini sudah diklaim oleh akun lain. Gunakan login.')
      setMode('login')
      setLoading(false)
      return
    }

    const { data: authData, error: signupErr } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    })

    if (signupErr) {
      setError(signupErr.message)
      setLoading(false)
      return
    }

    const userId = authData.user?.id
    if (userId) {
      await fetch('/api/onboarding/link-merchant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug, userId }),
      })
    }

    if (authData.session) {
      router.push(`/${slug}`)
      return
    }

    // Email confirmation required
    setError(null)
    setLoading(false)
    setMode('loading') // repurpose as "check email" state, handle below
    alert(`Cek email ${email} untuk konfirmasi, lalu login.`)
    setMode('login')
  }

  const inputCls = 'w-full bg-white border border-black/15 px-4 py-3 text-sm focus:outline-none focus:border-black/50 transition-colors'
  const labelCls = 'block text-[10px] font-bold tracking-widest uppercase text-gray-500 mb-1.5'

  if (mode === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="animate-spin text-gray-400" size={24} />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-[400px]">
        {/* Header */}
        <div className="text-center mb-10">
          <p className="text-[10px] tracking-widest uppercase text-gray-400 mb-2">UMKMku Dashboard</p>
          <h1 className="text-2xl font-serif italic text-gray-900">{slug}</h1>
          <p className="text-sm text-gray-500 mt-1">
            {mode === 'login' ? 'Masuk sebagai merchant' : 'Klaim kepemilikan toko ini'}
          </p>
        </div>

        {mode === 'claim' && (
          <div className="mb-6 px-4 py-3 bg-amber-50 border border-amber-200 text-amber-700 text-sm rounded">
            Toko <strong>{slug}</strong> belum punya pemilik. Daftar sekarang untuk mengklaimnya.
          </div>
        )}

        {error && (
          <div className="mb-6 px-4 py-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded">
            {error}
          </div>
        )}

        <form
          onSubmit={mode === 'login' ? handleLogin : handleClaim}
          className="space-y-5 bg-white border border-black/8 rounded-lg p-8"
        >
          {mode === 'claim' && (
            <div>
              <label className={labelCls}>Nama Lengkap</label>
              <input
                type="text"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                placeholder="Nama kamu"
                className={inputCls}
              />
            </div>
          )}

          <div>
            <label className={labelCls}>Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="email@bisnis.com"
              required
              autoComplete="email"
              className={inputCls}
            />
          </div>

          <div>
            <label className={labelCls}>Password</label>
            <div className="relative">
              <input
                type={showPw ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder={mode === 'claim' ? 'Minimal 6 karakter' : '••••••••'}
                required
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                className={inputCls}
              />
              <button
                type="button"
                onClick={() => setShowPw(v => !v)}
                className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600"
              >
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {mode === 'claim' && (
            <div>
              <label className={labelCls}>Konfirmasi Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="Ulangi password"
                required
                className={inputCls}
              />
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !email || !password}
            className="w-full py-3 bg-black text-white text-[11px] font-bold tracking-widest uppercase disabled:opacity-50 hover:bg-black/80 transition-colors"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="animate-spin" size={14} />
                {mode === 'login' ? 'Masuk...' : 'Mendaftar...'}
              </span>
            ) : mode === 'login' ? 'Masuk ke Dashboard' : 'Daftar & Klaim Toko'}
          </button>
        </form>

        {mode === 'login' && (
          <ResetPassword email={email} />
        )}
      </div>
    </div>
  )
}
