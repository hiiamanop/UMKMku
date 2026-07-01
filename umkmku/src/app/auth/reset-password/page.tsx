'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Eye, EyeOff, Loader2 } from 'lucide-react'

function ResetPasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [ready, setReady] = useState(false)

  // Supabase sends tokens as hash params, exchange them for a session
  useEffect(() => {
    const supabase = createClient()
    supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') setReady(true)
    })
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password !== confirm) { setError('Password tidak cocok.'); return }
    if (password.length < 6) { setError('Password minimal 6 karakter.'); return }
    setLoading(true); setError(null)

    const supabase = createClient()
    const { error: updateError } = await supabase.auth.updateUser({ password })
    if (updateError) { setError(updateError.message); setLoading(false); return }

    // Redirect ke dashboard, slug tidak diketahui di sini, arahkan ke root
    router.push('/')
  }

  const inputCls = 'w-full bg-white border border-black/15 px-4 py-3 text-sm focus:outline-none focus:border-black/50 transition-colors'
  const labelCls = 'block text-[10px] font-bold tracking-widest uppercase text-gray-500 mb-1.5'

  if (!ready) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <Loader2 className="animate-spin text-gray-400" size={24} />
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-[400px]">
        <div className="text-center mb-10">
          <p className="text-[10px] tracking-widest uppercase text-gray-400 mb-2">UMKMku Dashboard</p>
          <h1 className="text-2xl font-serif italic text-gray-900">Reset Password</h1>
          <p className="text-sm text-gray-500 mt-1">Masukkan password baru kamu</p>
        </div>

        {error && (
          <div className="mb-6 px-4 py-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5 bg-white border border-black/8 rounded-lg p-8">
          <div>
            <label className={labelCls}>Password Baru</label>
            <div className="relative">
              <input type={showPw ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
                placeholder="Minimal 6 karakter" required autoComplete="new-password" className={inputCls} />
              <button type="button" onClick={() => setShowPw(v => !v)}
                className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600">
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          <div>
            <label className={labelCls}>Konfirmasi Password</label>
            <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)}
              placeholder="Ulangi password" required className={inputCls} />
          </div>
          <button type="submit" disabled={loading || !password || !confirm}
            className="w-full py-3 bg-black text-white text-[11px] font-bold tracking-widest uppercase disabled:opacity-50 hover:bg-black/80 transition-colors">
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="animate-spin" size={14} />Menyimpan...
              </span>
            ) : 'Simpan Password Baru'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center"><Loader2 className="animate-spin text-gray-400" size={24} /></div>}>
      <ResetPasswordForm />
    </Suspense>
  )
}
