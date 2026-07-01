'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Download, ArrowRight, CheckCircle2, Eye, EyeOff } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

const PRIMARY = '#0A2F73'
const BORDER = '#E5EAF0'
const TEXT_SEC = '#5E6B85'

const inputCls = 'w-full rounded-xl px-4 py-3 text-sm border outline-none transition-colors bg-white'
const inputStyle = { borderColor: BORDER }

export function FreelancerRegisterForm() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [bio, setBio] = useState('')
  const [portfolioUrl, setPortfolioUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || !email.trim() || password.length < 6) return
    setLoading(true)
    setError(null)

    try {
      const supabase = createClient()

      // Try sign up, if email exists, sign in instead (merchant/customer joining as creator)
      let userId: string | undefined
      const { data: authData, error: authErr } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: name } },
      })

      if (authErr || (authData.user?.identities?.length ?? 1) === 0) {
        // Email already registered, verify via login
        const { data: loginData, error: loginErr } = await supabase.auth.signInWithPassword({ email, password })
        if (loginErr) throw new Error('Email sudah terdaftar. Masukkan password akun yang sudah ada.')
        userId = loginData.user.id
      } else {
        userId = authData.user?.id
      }

      const res = await fetch('/api/freelancer/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          bio,
          portfolio_url: portfolioUrl,
          user_id: userId,
        }),
      })
      if (!res.ok) {
        const d = await res.json()
        throw new Error(d.error ?? 'Terjadi kesalahan')
      }

      setDone(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan')
    } finally {
      setLoading(false)
    }
  }

  if (done) {
    return (
      <div className="rounded-2xl border bg-white p-8 text-center flex flex-col items-center gap-4" style={{ borderColor: BORDER }}>
        <CheckCircle2 size={40} className="text-green-500" />
        <h2 className="text-lg font-bold text-gray-900">Pendaftaran berhasil!</h2>
        <p className="text-sm text-gray-500 max-w-xs">
          Cek email kamu untuk verifikasi akun, lalu langsung masuk ke dashboard.
        </p>
        <a
          href="/freelancer/dashboard"
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90"
          style={{ background: PRIMARY }}
        >
          Ke Dashboard <ArrowRight size={14} />
        </a>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border bg-white p-8 space-y-5" style={{ borderColor: BORDER }}>
      {/* Manifest download */}
      <div className="rounded-xl p-4 flex items-start gap-3" style={{ background: `${PRIMARY}08`, border: `1px solid ${PRIMARY}20` }}>
        <div className="shrink-0 mt-0.5">
          <Download size={16} style={{ color: PRIMARY }} />
        </div>
        <div>
          <p className="text-sm font-semibold" style={{ color: PRIMARY }}>Download contoh manifest.json</p>
          <p className="text-xs mt-0.5 mb-2" style={{ color: TEXT_SEC }}>
            Setiap template repo wajib menyertakan <code className="font-mono bg-white/60 px-1 rounded">manifest.json</code> di root folder.
          </p>
          <a
            href="/template-manifest-example.json"
            download="manifest.json"
            className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-opacity hover:opacity-80"
            style={{ background: PRIMARY, color: 'white' }}
          >
            <Download size={12} /> Download manifest.json
          </a>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold mb-1.5" style={{ color: PRIMARY }}>Nama Lengkap *</label>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="Nama kamu" required className={inputCls} style={inputStyle} onFocus={e => (e.target.style.borderColor = PRIMARY)} onBlur={e => (e.target.style.borderColor = BORDER)} />
        </div>
        <div>
          <label className="block text-xs font-semibold mb-1.5" style={{ color: PRIMARY }}>Email *</label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="email@kamu.com" required className={inputCls} style={inputStyle} onFocus={e => (e.target.style.borderColor = PRIMARY)} onBlur={e => (e.target.style.borderColor = BORDER)} />
        </div>
        <div>
          <label className="block text-xs font-semibold mb-1.5" style={{ color: PRIMARY }}>Password * <span className="font-normal text-gray-400">(akun baru: min. 6 karakter · akun lama: masukkan password kamu)</span></label>
          <div className="relative">
            <input
              type={showPw ? 'text' : 'password'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Minimal 6 karakter"
              required
              minLength={6}
              className={inputCls}
              style={inputStyle}
              onFocus={e => (e.target.style.borderColor = PRIMARY)}
              onBlur={e => (e.target.style.borderColor = BORDER)}
            />
            <button type="button" onClick={() => setShowPw(v => !v)} className="absolute right-3 top-3.5" style={{ color: TEXT_SEC }}>
              {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>
        <div>
          <label className="block text-xs font-semibold mb-1.5" style={{ color: PRIMARY }}>Bio Singkat</label>
          <textarea value={bio} onChange={e => setBio(e.target.value)} placeholder="Ceritakan background kamu sebagai designer/developer..." className={inputCls} style={{ ...inputStyle, minHeight: '80px', resize: 'none' }} onFocus={e => (e.target.style.borderColor = PRIMARY)} onBlur={e => (e.target.style.borderColor = BORDER)} />
        </div>
        <div>
          <label className="block text-xs font-semibold mb-1.5" style={{ color: PRIMARY }}>Portfolio URL</label>
          <input type="url" value={portfolioUrl} onChange={e => setPortfolioUrl(e.target.value)} placeholder="https://portofolio-kamu.com" className={inputCls} style={inputStyle} onFocus={e => (e.target.style.borderColor = PRIMARY)} onBlur={e => (e.target.style.borderColor = BORDER)} />
        </div>

        {error && <div className="p-3 rounded-xl text-sm text-red-700 bg-red-50 border border-red-200">{error}</div>}

        <button
          type="submit"
          disabled={loading || !name.trim() || !email.trim() || password.length < 6}
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl font-semibold text-base transition-opacity hover:opacity-90 disabled:opacity-50 text-white"
          style={{ background: PRIMARY }}
        >
          {loading ? <><Loader2 size={16} className="animate-spin" /> Mendaftar...</> : <><ArrowRight size={16} /> Daftar sebagai Creator</>}
        </button>

        <p className="text-center text-xs" style={{ color: TEXT_SEC }}>
          Sudah punya akun?{' '}
          <a href="/freelancer/login" className="underline font-medium" style={{ color: PRIMARY }}>Login di sini</a>
        </p>
      </form>
    </div>
  )
}
