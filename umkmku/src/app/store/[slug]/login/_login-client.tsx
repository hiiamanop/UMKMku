'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Eye, EyeOff } from 'lucide-react'

export function LoginClient({ authHeroImageUrl }: { authHeroImageUrl: string | null }) {
  const { slug } = useParams<{ slug: string }>()
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError('Email atau password salah. Coba lagi.')
      setLoading(false)
      return
    }

    // Flush pending profile data from registration (email-confirm flow)
    if (data.user) {
      const key = `pending_profile_${data.user.id}`
      const pending = localStorage.getItem(key)
      if (pending) {
        try {
          const profile = JSON.parse(pending)
          await supabase.from('user_profiles').upsert({ id: data.user.id, ...profile })
          localStorage.removeItem(key)
        } catch { /* ignore */ }
      }
    }

    router.push(`/store/${slug}/profile`)
    router.refresh()
  }

  const inputCls = 'w-full bg-transparent border-b border-black/20 py-3 text-[14px] text-[#1a1c1c] placeholder:text-black/30 outline-none focus:border-[var(--color-primary)] transition-colors'
  const labelCls = 'text-[10px] font-bold tracking-widest uppercase text-[#8f6f73]'

  return (
    <div className="min-h-screen grid md:grid-cols-[42%_1fr]">
      {/* Left — hero panel */}
      <div className="hidden md:flex relative flex-col justify-end p-12 overflow-hidden"
        style={{ background: 'var(--color-secondary)' }}>
        <div className="absolute inset-0">
          <Image
            src={authHeroImageUrl ?? '/images/auth-hero.jpg'}
            alt="hero"
            fill
            className="object-cover opacity-80"
            onError={() => {}}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
        </div>
        <div className="relative z-10">
          <p className="text-[10px] tracking-widest uppercase text-white/60 mb-3">WELCOME BACK</p>
          <p className="text-display italic text-white leading-tight">
            Reconnect with<br />your ritual.
          </p>
        </div>
      </div>

      {/* Right — form */}
      <div className="flex flex-col items-center justify-center px-8 md:px-16 py-16 bg-[#fafaf8]">
        <div className="w-full max-w-[400px]">
          {/* Brand */}
          <Link href={`/store/${slug}`}
            className="block text-center text-headline-md italic text-[var(--color-primary)] mb-14 tracking-tight">
            {slug}
          </Link>

          <h1 className="text-display text-[#1a1c1c] mb-2">Welcome Back</h1>
          <p className="text-body-md text-[#8f6f73] mb-10">Sign in to continue your botanical journey.</p>

          {error && (
            <div className="mb-6 px-4 py-3 bg-red-50 border border-red-200 text-red-600 text-[13px] rounded">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
            <div>
              <label className={labelCls}>Email Address</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="you@email.com" required className={inputCls} />
            </div>

            <div>
              <div className="flex justify-between items-baseline">
                <label className={labelCls}>Password</label>
                <button type="button" className="text-[10px] tracking-widest uppercase text-[#8f6f73] hover:text-[var(--color-primary)] transition-colors">
                  Forgot?
                </button>
              </div>
              <div className="relative">
                <input type={showPw ? 'text' : 'password'} value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••" required className={inputCls} />
                <button type="button" onClick={() => setShowPw(v => !v)}
                  className="absolute right-0 top-3 text-[#8f6f73] hover:text-[var(--color-primary)] transition-colors">
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <label className="flex items-center gap-3 cursor-pointer -mt-2">
              <input type="checkbox" className="w-4 h-4 rounded border-black/20" />
              <span className="text-[13px] text-[#8f6f73]">Remember this session</span>
            </label>

            <button type="submit" disabled={loading}
              className="w-full py-4 text-white text-label-caps tracking-widest disabled:opacity-60 transition-opacity"
              style={{ background: 'var(--color-primary)' }}>
              {loading ? 'SIGNING IN...' : 'SIGN IN'}
            </button>
          </form>

          <div className="flex items-center gap-4 my-8">
            <div className="flex-1 h-px bg-black/10" />
            <span className="text-[11px] tracking-widest text-[#8f6f73]">OR CONTINUE WITH</span>
            <div className="flex-1 h-px bg-black/10" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button className="py-3 border border-black/15 text-[12px] font-bold text-[#1a1c1c] hover:border-[var(--color-primary)] transition-colors flex items-center justify-center gap-2">
              <span>G</span> Google
            </button>
            <button className="py-3 border border-black/15 text-[12px] font-bold text-[#1a1c1c] hover:border-[var(--color-primary)] transition-colors flex items-center justify-center gap-2">
              <span>🍎</span> Apple
            </button>
          </div>

          <p className="text-center text-[13px] text-[#8f6f73] mt-8">
            New here?{' '}
            <Link href={`/store/${slug}/register`}
              className="font-bold text-[var(--color-primary)] hover:underline">
              Create an account
            </Link>
          </p>

          <div className="flex gap-4 justify-center mt-10 text-[11px] text-[#8f6f73]">
            <span className="hover:text-[var(--color-primary)] cursor-pointer transition-colors">Privacy Policy</span>
            <span className="hover:text-[var(--color-primary)] cursor-pointer transition-colors">Terms of Ritual</span>
          </div>
        </div>
      </div>
    </div>
  )
}
