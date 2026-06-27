'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Eye, EyeOff } from 'lucide-react'

export function RegisterClient({ authHeroImageUrl }: { authHeroImageUrl: string | null }) {
  const { slug } = useParams<{ slug: string }>()
  const router = useRouter()
  const [form, setForm] = useState({
    full_name: '', email: '', password: '', address: '', whatsapp: '',
  })
  const [showPw, setShowPw] = useState(false)
  const [skinConsult, setSkinConsult] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [checkEmail, setCheckEmail] = useState(false)

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(prev => ({ ...prev, [k]: e.target.value }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const redirectTo = `${window.location.origin}/auth/callback?next=/store/${slug}/${skinConsult ? 'profile?tab=skin-quiz' : 'profile'}`

    const { data, error: signUpError } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: { full_name: form.full_name },
        emailRedirectTo: redirectTo,
      },
    })

    if (signUpError) {
      setError(signUpError.message)
      setLoading(false)
      return
    }

    // Jika session langsung ada (email confirm disabled), simpan profil & redirect
    if (data.session) {
      if (data.user) {
        await supabase.from('user_profiles').upsert({
          id: data.user.id,
          full_name: form.full_name,
          address: form.address || null,
          whatsapp_number: form.whatsapp || null,
        })
      }
      router.push(skinConsult ? `/store/${slug}/profile?tab=skin-quiz` : `/store/${slug}/profile`)
      router.refresh()
      return
    }

    // Email confirmation required — simpan ke localStorage sementara, tampilkan pesan
    if (data.user) {
      localStorage.setItem(`pending_profile_${data.user.id}`, JSON.stringify({
        full_name: form.full_name,
        address: form.address || null,
        whatsapp_number: form.whatsapp || null,
      }))
    }
    setCheckEmail(true)
  }

  const inputCls = 'w-full bg-transparent border-b border-black/20 py-3 text-[14px] text-[#1a1c1c] placeholder:text-black/30 outline-none focus:border-[var(--color-primary)] transition-colors'
  const labelCls = 'text-[10px] font-bold tracking-widest uppercase text-[#8f6f73]'

    if (checkEmail) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fafaf8] px-6">
        <div className="max-w-[400px] w-full text-center">
          <div className="w-16 h-16 rounded-full bg-[var(--color-primary)]/10 flex items-center justify-center mx-auto mb-6">
            <span className="text-2xl">📧</span>
          </div>
          <h1 className="text-display text-[#1a1c1c] mb-3">Cek Email Kamu</h1>
          <p className="text-body-md text-[#8f6f73] mb-2">
            Kami sudah mengirimkan link konfirmasi ke
          </p>
          <p className="font-bold text-[#1a1c1c] mb-6">{form.email}</p>
          <p className="text-[13px] text-[#8f6f73] leading-relaxed mb-8">
            Klik link di email tersebut untuk mengaktifkan akun dan masuk ke toko.
            Cek folder <strong>Spam</strong> jika tidak muncul dalam 1-2 menit.
          </p>
          <Link href={`/store/${slug}/login`}
            className="text-label-caps text-[10px] text-[var(--color-primary)] hover:opacity-70 transition-opacity">
            Kembali ke Login →
          </Link>
        </div>
      </div>
    )
  }

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
          <p className="text-[10px] tracking-widest uppercase text-white/60 mb-3">THE RITUAL STUDIO</p>
          <p className="text-display italic text-white leading-tight">
            A journey back to<br />your truest nature.
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

          <h1 className="text-display text-[#1a1c1c] mb-2">Create Your Account</h1>
          <p className="text-body-md text-[#8f6f73] mb-10">
            Experience personalized skincare rooted in botanical purity.
          </p>

          {error && (
            <div className="mb-6 px-4 py-3 bg-red-50 border border-red-200 text-red-600 text-[13px] rounded">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-7">
            <div>
              <label className={labelCls}>Full Name</label>
              <input type="text" value={form.full_name} onChange={set('full_name')}
                placeholder="Elara Dewi" required className={inputCls} />
            </div>

            <div>
              <label className={labelCls}>Email Address</label>
              <input type="email" value={form.email} onChange={set('email')}
                placeholder="hello@example.com" required className={inputCls} />
            </div>

            <div>
              <label className={labelCls}>WhatsApp Number</label>
              <input type="tel" value={form.whatsapp} onChange={set('whatsapp')}
                placeholder="+62 812 3456 7890" className={inputCls} />
            </div>

            <div>
              <label className={labelCls}>Alamat Pengiriman</label>
              <input type="text" value={form.address} onChange={set('address')}
                placeholder="Jl. Melati No. 12, Jakarta" className={inputCls} />
            </div>

            <div>
              <label className={labelCls}>Password</label>
              <div className="relative">
                <input type={showPw ? 'text' : 'password'} value={form.password}
                  onChange={set('password')} placeholder="Min. 6 karakter"
                  required minLength={6} className={inputCls} />
                <button type="button" onClick={() => setShowPw(v => !v)}
                  className="absolute right-0 top-3 text-[#8f6f73] hover:text-[var(--color-primary)] transition-colors">
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <label className="flex items-start gap-3 cursor-pointer">
              <input type="checkbox" checked={skinConsult} onChange={e => setSkinConsult(e.target.checked)}
                className="w-4 h-4 mt-0.5 shrink-0" />
              <span className="text-[13px] text-[#8f6f73] leading-relaxed">
                Include a complimentary <strong className="text-[var(--color-primary)]">Skin Type Consultation</strong> in
                my welcome journey.<br />
                <span className="text-[11px]">Our botanical experts will reach out to tailor your ritual.</span>
              </span>
            </label>

            <button type="submit" disabled={loading}
              className="w-full py-4 text-white text-label-caps tracking-widest disabled:opacity-60 transition-opacity"
              style={{ background: 'var(--color-primary)' }}>
              {loading ? 'CREATING ACCOUNT...' : 'BEGIN THE JOURNEY'}
            </button>
          </form>

          <p className="text-center text-[13px] text-[#8f6f73] mt-8">
            Already a member?{' '}
            <Link href={`/store/${slug}/login`}
              className="font-bold text-[var(--color-primary)] hover:underline">
              Sign In
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
