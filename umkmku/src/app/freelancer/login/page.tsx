'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Eye, EyeOff, ArrowRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

const PRIMARY = '#0A2F73'
const GOLD = '#F4B400'
const BORDER = '#E5EAF0'
const TEXT_SEC = '#5E6B85'

const inputCls = 'w-full rounded-xl px-4 py-3 text-sm border outline-none transition-colors bg-white'

export default function FreelancerLoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const supabase = createClient()
      const { error: loginErr } = await supabase.auth.signInWithPassword({ email, password })
      if (loginErr) throw new Error(loginErr.message)
      router.push('/freelancer/dashboard')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login gagal')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="text-xl font-bold" style={{ color: PRIMARY }}>
            UMKM<span style={{ color: GOLD }}>u</span>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 mt-4 mb-1">Masuk sebagai Creator</h1>
          <p className="text-sm text-gray-500">Dashboard Template Creator UMKMu</p>
        </div>

        <div className="rounded-2xl border bg-white p-8 space-y-4" style={{ borderColor: BORDER }}>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: PRIMARY }}>Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="email@kamu.com"
                required
                className={inputCls}
                style={{ borderColor: BORDER }}
                onFocus={e => (e.target.style.borderColor = PRIMARY)}
                onBlur={e => (e.target.style.borderColor = BORDER)}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: PRIMARY }}>Password</label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Password kamu"
                  required
                  className={inputCls}
                  style={{ borderColor: BORDER }}
                  onFocus={e => (e.target.style.borderColor = PRIMARY)}
                  onBlur={e => (e.target.style.borderColor = BORDER)}
                />
                <button type="button" onClick={() => setShowPw(v => !v)} className="absolute right-3 top-3.5" style={{ color: TEXT_SEC }}>
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && <div className="p-3 rounded-xl text-sm text-red-700 bg-red-50 border border-red-200">{error}</div>}

            <button
              type="submit"
              disabled={loading || !email || !password}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl font-semibold text-base transition-opacity hover:opacity-90 disabled:opacity-50 text-white"
              style={{ background: PRIMARY }}
            >
              {loading ? <><Loader2 size={16} className="animate-spin" /> Masuk...</> : <><ArrowRight size={16} /> Masuk</>}
            </button>
          </form>

          <p className="text-center text-xs pt-2" style={{ color: TEXT_SEC }}>
            Belum punya akun?{' '}
            <Link href="/freelancer/register" className="underline font-medium" style={{ color: PRIMARY }}>Daftar di sini</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
