'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Loader2, Eye, EyeOff, CheckCircle2, ArrowRight, ArrowLeft, Sparkles, Send, Pencil, Plus, Trash2, MessageSquarePlus } from 'lucide-react'

import { createClient } from '@/lib/supabase/client'
import type { CategoryType } from '@/lib/categories'

const PRIMARY = '#0A2F73'
const GOLD = '#F4B400'
const BORDER = '#E5EAF0'
const TEXT_SEC = '#5E6B85'
const SURFACE = '#F8FAFC'

type Status = 'idle' | 'loading' | 'success' | 'error'
type Step = 'category' | 'template' | 'description' | 'creating' | 'preview' | 'finalizing' | 'signup' | 'done'

interface TemplateOption {
  id: string
  name: string
  description: string | null
  category: string
  template_key: string
  preview_urls: string[]
  demo_url: string | null
}

interface OnboardingResult { slug: string; brand_name: string; store_url: string }

interface PreviewConfig {
  brand_name: string
  tagline: string | null
  description: string
  primary_color: string
  secondary_color: string
  accent_color: string
  whatsapp_number: string | null
  instagram_url: string | null
  chatbot_persona: string
  products: Array<{ name: string; description: string; price: number | null; category_data: Record<string, unknown> }>
  [key: string]: unknown
}

interface AdjustMessage { role: 'user' | 'assistant'; content: string }

const CATEGORIES: { value: CategoryType; label: string; desc: string; icon: string }[] = [
  { value: 'skincare', label: 'Skincare & Beauty', desc: 'Perawatan kulit, makeup', icon: '✨' },
  { value: 'parfum', label: 'Parfum', desc: 'Wewangian lokal', icon: '🌸' },
  { value: 'fashion', label: 'Fashion', desc: 'Pakaian & aksesoris', icon: '👗' },
  { value: 'fdb', label: 'Makanan & Minuman', desc: 'F&B, snack, minuman', icon: '🍃' },
]

const PLAN_LABELS: Record<string, string> = {
  business: 'Business, Rp 399k/bln',
  enterprise: 'Enterprise, Rp 599k/bln',
  free: 'Free Trial 7 Hari',
}

const STEPS = ['Kategori', 'Template', 'Ceritakan Bisnis', 'Buat Akun']

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

  // Template selection state
  const [templates, setTemplates] = useState<TemplateOption[]>([])
  const [templatesLoading, setTemplatesLoading] = useState(false)
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(
    searchParams.get('template_id')
  )

  // Preview & adjust state
  const [previewConfig, setPreviewConfig] = useState<PreviewConfig | null>(null)
  const [isEditingConfig, setIsEditingConfig] = useState(false)
  const [configSnapshot, setConfigSnapshot] = useState<PreviewConfig | null>(null)

  // Description assist state
  const [showAssist, setShowAssist] = useState(false)
  const [assistMessages, setAssistMessages] = useState<AdjustMessage[]>([])
  const [assistInput, setAssistInput] = useState('')
  const [assistLoading, setAssistLoading] = useState(false)
  const [assistDone, setAssistDone] = useState(false)
  const assistBottomRef = useRef<HTMLDivElement>(null)

  // Signup state
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [signupLoading, setSignupLoading] = useState(false)
  const [signupError, setSignupError] = useState<string | null>(null)
  const [emailIsMerchant, setEmailIsMerchant] = useState(false)

  useEffect(() => {
    assistBottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [assistMessages, assistLoading])

  useEffect(() => {
    if (step !== 'template' || !category) return
    setTemplatesLoading(true)
    fetch(`/api/templates?category=${category}`)
      .then(r => r.json())
      .then(d => setTemplates(d.templates ?? []))
      .catch(() => setTemplates([]))
      .finally(() => setTemplatesLoading(false))
  }, [step, category])

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

  const stepIndex = step === 'category' ? 0
    : step === 'template' ? 1
    : step === 'description' || step === 'creating' || step === 'preview' || step === 'finalizing' ? 2
    : 3

  async function handleDescriptionSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!description.trim() || !category) return
    setStatus('loading')
    setStep('creating')
    setError(null)

    try {
      const res = await fetch('/api/onboarding/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category, description }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? 'Terjadi kesalahan')
      }
      const { config } = await res.json()
      setPreviewConfig(config)
      setStatus('success')
      setStep('preview')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan')
      setStatus('error')
      setStep('description')
    }
  }

  async function handleFinalize() {
    if (!previewConfig) return
    setStep('finalizing')
    setError(null)

    try {
      const res = await fetch('/api/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category, description, invoiceId, config: previewConfig, template_id: selectedTemplateId }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? 'Terjadi kesalahan')
      }
      const data: OnboardingResult = await res.json()
      setResult(data)
      setStep('signup')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan')
      setStep('preview')
    }
  }

  async function typeIntoDescription(text: string) {
    setDescription('')
    for (let i = 0; i < text.length; i++) {
      await new Promise<void>(resolve => setTimeout(resolve, 18))
      setDescription(text.slice(0, i + 1))
    }
  }

  async function callAssist(msgs: AdjustMessage[]) {
    setAssistLoading(true)
    try {
      const res = await fetch('/api/onboarding/assist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description, messages: msgs, category }),
      })
      const data = await res.json()
      setAssistMessages(prev => [...prev, { role: 'assistant', content: data.text ?? 'Coba lagi.' }])
      if (data.done && data.summary) {
        setAssistDone(true)
        setShowAssist(false)
        await typeIntoDescription(data.summary)
      }
    } catch {
      setAssistMessages(prev => [...prev, { role: 'assistant', content: 'Gagal terhubung.' }])
    } finally {
      setAssistLoading(false)
    }
  }

  async function handleAssist() {
    const msg = assistInput.trim()
    if (!msg || assistLoading) return
    const newMessages: AdjustMessage[] = [...assistMessages, { role: 'user', content: msg }]
    setAssistMessages(newMessages)
    setAssistInput('')
    await callAssist(newMessages)
  }

  function openAssist() {
    setShowAssist(true)
    if (assistMessages.length === 0) {
      callAssist([])
    }
  }

  function updateProduct(i: number, field: 'name' | 'description' | 'price', value: string) {
    if (!previewConfig) return
    const products = [...previewConfig.products]
    if (field === 'price') {
      products[i] = { ...products[i], price: value === '' ? null : Number(value) }
    } else {
      products[i] = { ...products[i], [field]: value }
    }
    setPreviewConfig({ ...previewConfig, products })
  }

  function addProduct() {
    if (!previewConfig) return
    setPreviewConfig({
      ...previewConfig,
      products: [...previewConfig.products, { name: '', description: '', price: null, category_data: {} }],
    })
  }

  function removeProduct(i: number) {
    if (!previewConfig) return
    setPreviewConfig({ ...previewConfig, products: previewConfig.products.filter((_, idx) => idx !== i) })
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

    const isExistingUser =
      signupErr?.message?.toLowerCase().includes('already') ||
      (authData.user?.identities?.length ?? 1) === 0

    if (isExistingUser) {
      setSignupError('Email ini sudah terdaftar. Silakan login dulu di halaman login toko Anda, atau gunakan email lain.')
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

  const inputCls = `w-full rounded-xl px-4 py-3 text-sm border outline-none transition-colors`
  const inputStyle = { borderColor: BORDER, background: 'white' }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: SURFACE }}>

      {/* Top bar */}
      <div className="bg-white border-b px-6 py-4 flex items-center justify-between" style={{ borderColor: BORDER }}>
        <a href="/">
          <img src="/logo.png" alt="UMKMu" style={{ height: '32px', width: 'auto' }} />
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
                    onClick={() => { setCategory(cat.value); setStep('template') }}
                    className="p-5 rounded-2xl text-left transition-all hover:shadow-md"
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

          {/* Step: template */}
          {step === 'template' && (
            <div>
              <button
                type="button"
                onClick={() => setStep('category')}
                className="flex items-center gap-1.5 text-sm mb-6 transition-opacity hover:opacity-70"
                style={{ color: TEXT_SEC }}
              >
                <ArrowLeft size={14} /> Kembali
              </button>
              <h2 className="text-2xl font-bold mb-2" style={{ color: PRIMARY }}>Pilih template toko</h2>
              <p className="text-sm mb-8" style={{ color: TEXT_SEC }}>
                Template menentukan tampilan tokomu. Bisa diganti kapan saja.
              </p>

              {templatesLoading ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 size={28} className="animate-spin" style={{ color: PRIMARY }} />
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {templates.map(t => {
                    const isSelected = selectedTemplateId === t.id
                    const preview = t.preview_urls?.[0] ?? null
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => { setSelectedTemplateId(t.id); setStep('description') }}
                        className="rounded-2xl overflow-hidden text-left transition-all hover:shadow-md"
                        style={{
                          border: `2px solid ${isSelected ? PRIMARY : BORDER}`,
                          background: 'white',
                        }}
                      >
                        {/* Preview image */}
                        <div className="aspect-video w-full overflow-hidden" style={{ background: `${PRIMARY}10` }}>
                          {preview ? (
                            <img src={preview} alt={t.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center gap-2">
                              <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: `${PRIMARY}20` }}>
                                <Sparkles size={18} style={{ color: PRIMARY }} />
                              </div>
                              <span className="text-xs font-medium" style={{ color: PRIMARY }}>Preview segera tersedia</span>
                            </div>
                          )}
                        </div>
                        <div className="p-4">
                          <div className="font-semibold text-sm" style={{ color: PRIMARY }}>{t.name}</div>
                          {t.description && (
                            <div className="text-xs mt-0.5 line-clamp-2" style={{ color: TEXT_SEC }}>{t.description}</div>
                          )}
                          {t.demo_url && (
                            <a
                              href={t.demo_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={e => e.stopPropagation()}
                              className="mt-2 inline-block text-xs underline"
                              style={{ color: TEXT_SEC }}
                            >
                              Lihat demo →
                            </a>
                          )}
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* Step: description */}
          {step === 'description' && (
            <form onSubmit={handleDescriptionSubmit}>
              <button
                type="button"
                onClick={() => setStep('template')}
                className="flex items-center gap-1.5 text-sm mb-6 transition-opacity hover:opacity-70"
                style={{ color: TEXT_SEC }}
              >
                <ArrowLeft size={14} /> Kembali
              </button>
              <h2 className="text-2xl font-bold mb-2" style={{ color: PRIMARY }}>Ceritakan brand kamu</h2>
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

              {/* Assist chat */}
              {showAssist && (
                <div className="mt-4 rounded-xl border overflow-hidden" style={{ borderColor: BORDER }}>
                  <div className="px-3 py-2.5 border-b flex items-center gap-2" style={{ background: `${PRIMARY}08`, borderColor: BORDER }}>
                    <MessageSquarePlus size={13} style={{ color: PRIMARY }} />
                    <span className="text-xs font-semibold" style={{ color: PRIMARY }}>AI membantu melengkapi deskripsi</span>
                  </div>
                  <div className="p-3 space-y-2.5 max-h-52 overflow-y-auto bg-white">
                    {assistMessages.map((m, i) => (
                      <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div
                          className="max-w-[85%] rounded-2xl px-3 py-2 text-sm leading-relaxed"
                          style={m.role === 'user'
                            ? { background: PRIMARY, color: '#fff' }
                            : { background: SURFACE, color: '#111827', border: `1px solid ${BORDER}` }}
                        >
                          {m.content}
                        </div>
                      </div>
                    ))}
                    {assistLoading && (
                      <div className="flex justify-start">
                        <div className="rounded-2xl px-3 py-2" style={{ background: SURFACE, border: `1px solid ${BORDER}` }}>
                          <Loader2 size={12} className="animate-spin text-gray-400" />
                        </div>
                      </div>
                    )}
                    <div ref={assistBottomRef} />
                  </div>
                  <div className="p-2.5 border-t flex gap-2" style={{ borderColor: BORDER }}>
                    <input
                      className="flex-1 rounded-lg border px-3 py-1.5 text-sm outline-none transition-colors"
                      style={{ borderColor: BORDER }}
                      placeholder="Jawab pertanyaan AI..."
                      value={assistInput}
                      onChange={e => setAssistInput(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleAssist()}
                      onFocus={e => (e.target.style.borderColor = PRIMARY)}
                      onBlur={e => (e.target.style.borderColor = BORDER)}
                      disabled={assistLoading}
                    />
                    <button
                      type="button"
                      onClick={handleAssist}
                      disabled={assistLoading || !assistInput.trim()}
                      className="w-8 h-8 rounded-lg flex items-center justify-center transition-opacity disabled:opacity-40 shrink-0"
                      style={{ background: PRIMARY }}
                    >
                      <Send size={13} className="text-white" />
                    </button>
                  </div>
                </div>
              )}

              {error && (
                <div className="mt-3 p-3 rounded-xl text-sm text-red-700 bg-red-50 border border-red-200">{error}</div>
              )}

              <div className="mt-5 flex gap-3">
                {!showAssist && !assistDone && (
                  <button
                    type="button"
                    onClick={openAssist}
                    className="flex items-center gap-1.5 px-4 py-3.5 rounded-2xl text-sm font-semibold border transition-colors"
                    style={{ borderColor: BORDER, color: TEXT_SEC }}
                  >
                    <MessageSquarePlus size={15} />
                    Bantu Lengkapi
                  </button>
                )}
                <button
                  type="submit"
                  disabled={!description.trim() || status === 'loading'}
                  className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl font-semibold text-base transition-opacity hover:opacity-90 disabled:opacity-50"
                  style={{ background: PRIMARY, color: 'white' }}
                >
                  <Sparkles size={16} />
                  Buat Toko Saya
                  <ArrowRight size={16} />
                </button>
              </div>
            </form>
          )}

          {/* Step: creating (loading preview) */}
          {step === 'creating' && (
            <div className="text-center py-16 flex flex-col items-center gap-6">
              <div className="w-20 h-20 rounded-full flex items-center justify-center" style={{ background: `${PRIMARY}12` }}>
                <Loader2 size={36} className="animate-spin" style={{ color: PRIMARY }} />
              </div>
              <div>
                <h2 className="text-xl font-bold" style={{ color: PRIMARY }}>AI sedang menganalisis bisnismu...</h2>
                <p className="text-sm mt-2" style={{ color: TEXT_SEC }}>Memilih warna, menyiapkan produk, menyusun toko. Sebentar lagi! ✨</p>
              </div>
              <div className="flex gap-1.5">
                {[0, 1, 2].map(i => (
                  <div key={i} className="w-2 h-2 rounded-full animate-bounce" style={{ background: PRIMARY, animationDelay: `${i * 0.15}s` }} />
                ))}
              </div>
            </div>
          )}

          {/* Step: preview + adjust */}
          {step === 'preview' && previewConfig && (
            <div>
              <div className="flex items-center gap-2 mb-6">
                <CheckCircle2 size={18} className="text-green-500 shrink-0" />
                <p className="text-sm font-semibold text-green-800">AI sudah buat konfigurasi toko kamu!</p>
              </div>

              {/* Config card */}
              <div className="rounded-2xl bg-white border overflow-hidden mb-5" style={{ borderColor: BORDER }}>
                {/* Color header */}
                <div className="h-16 relative" style={{ background: previewConfig.primary_color }}>
                  <div className="absolute bottom-2 right-4 flex items-center gap-2">
                    {[
                      { key: 'primary_color', label: 'Utama' },
                      { key: 'secondary_color', label: 'Sekunder' },
                      { key: 'accent_color', label: 'Aksen' },
                    ].map(({ key, label }) => isEditingConfig ? (
                      <label key={key} className="flex flex-col items-center gap-0.5 cursor-pointer">
                        <input
                          type="color"
                          value={(previewConfig as Record<string, unknown>)[key] as string}
                          onChange={e => setPreviewConfig({ ...previewConfig, [key]: e.target.value })}
                          className="w-7 h-7 rounded-full border-2 border-white shadow cursor-pointer"
                          style={{ padding: '1px' }}
                        />
                        <span className="text-white/70 text-[9px]">{label}</span>
                      </label>
                    ) : (
                      <div key={key} className="w-7 h-7 rounded-full border-2 border-white shadow" style={{ background: (previewConfig as Record<string, unknown>)[key] as string }} />
                    ))}
                  </div>
                  <button
                    type="button"
                    className="absolute top-2 left-3 text-xs px-2.5 py-1 rounded-full font-semibold transition-opacity hover:opacity-80"
                    style={{ background: PRIMARY, color: 'white' }}
                    onClick={() => {
                      if (isEditingConfig) {
                        setIsEditingConfig(false)
                        setConfigSnapshot(null)
                      } else {
                        setConfigSnapshot(previewConfig)
                        setIsEditingConfig(true)
                      }
                    }}
                  >
                    {isEditingConfig ? 'Selesai Edit' : <><Pencil size={11} className="inline mr-1" />Edit</>}
                  </button>
                  {isEditingConfig && (
                    <button
                      type="button"
                      onClick={() => { if (configSnapshot) setPreviewConfig(configSnapshot); setIsEditingConfig(false); setConfigSnapshot(null) }}
                      className="absolute top-2 left-28 text-xs px-2.5 py-1 rounded-full font-semibold transition-opacity hover:opacity-80"
                      style={{ background: 'rgba(0,0,0,0.25)', color: 'white' }}
                    >
                      Batal
                    </button>
                  )}
                </div>

                <div className="p-5 space-y-3">
                  {isEditingConfig ? (
                    <>
                      <div>
                        <label className="text-xs font-semibold block mb-1" style={{ color: TEXT_SEC }}>Nama Brand</label>
                        <input
                          className="w-full rounded-lg border px-3 py-2 text-sm font-bold outline-none"
                          style={{ borderColor: BORDER, color: PRIMARY }}
                          value={previewConfig.brand_name}
                          onChange={e => setPreviewConfig({ ...previewConfig, brand_name: e.target.value })}
                          onFocus={e => (e.target.style.borderColor = PRIMARY)}
                          onBlur={e => (e.target.style.borderColor = BORDER)}
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold block mb-1" style={{ color: TEXT_SEC }}>Tagline</label>
                        <input
                          className="w-full rounded-lg border px-3 py-2 text-sm italic outline-none"
                          style={{ borderColor: BORDER, color: TEXT_SEC }}
                          value={previewConfig.tagline ?? ''}
                          placeholder="Slogan singkat brand (opsional)"
                          onChange={e => setPreviewConfig({ ...previewConfig, tagline: e.target.value || null })}
                          onFocus={e => (e.target.style.borderColor = PRIMARY)}
                          onBlur={e => (e.target.style.borderColor = BORDER)}
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold block mb-1" style={{ color: TEXT_SEC }}>Deskripsi</label>
                        <textarea
                          className="w-full rounded-lg border px-3 py-2 text-sm outline-none resize-none"
                          style={{ borderColor: BORDER, color: '#1a1a1a', minHeight: '72px' }}
                          value={previewConfig.description}
                          onChange={e => setPreviewConfig({ ...previewConfig, description: e.target.value })}
                          onFocus={e => (e.target.style.borderColor = PRIMARY)}
                          onBlur={e => (e.target.style.borderColor = BORDER)}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs font-semibold block mb-1" style={{ color: TEXT_SEC }}>WhatsApp</label>
                          <input
                            className="w-full rounded-lg border px-3 py-2 text-sm outline-none"
                            style={{ borderColor: BORDER }}
                            value={previewConfig.whatsapp_number ?? ''}
                            placeholder="628xxx"
                            onChange={e => setPreviewConfig({ ...previewConfig, whatsapp_number: e.target.value || null })}
                            onFocus={e => (e.target.style.borderColor = PRIMARY)}
                            onBlur={e => (e.target.style.borderColor = BORDER)}
                          />
                        </div>
                        <div>
                          <label className="text-xs font-semibold block mb-1" style={{ color: TEXT_SEC }}>Instagram URL</label>
                          <input
                            className="w-full rounded-lg border px-3 py-2 text-sm outline-none"
                            style={{ borderColor: BORDER }}
                            value={previewConfig.instagram_url ?? ''}
                            placeholder="https://instagram.com/..."
                            onChange={e => setPreviewConfig({ ...previewConfig, instagram_url: e.target.value || null })}
                            onFocus={e => (e.target.style.borderColor = PRIMARY)}
                            onBlur={e => (e.target.style.borderColor = BORDER)}
                          />
                        </div>
                      </div>

                      {/* Products edit */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <label className="text-xs font-semibold uppercase tracking-wide" style={{ color: PRIMARY }}>Produk</label>
                          <button type="button" onClick={addProduct} className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-semibold transition-opacity hover:opacity-80" style={{ background: `${PRIMARY}12`, color: PRIMARY }}>
                            <Plus size={11} /> Tambah
                          </button>
                        </div>
                        <div className="space-y-2 max-h-56 overflow-y-auto">
                          {previewConfig.products.map((p, i) => (
                            <div key={i} className="rounded-lg border p-2.5 space-y-1.5" style={{ borderColor: BORDER, background: SURFACE }}>
                              <div className="flex gap-2">
                                <input
                                  className="flex-1 rounded-md border px-2.5 py-1.5 text-sm outline-none font-medium"
                                  style={{ borderColor: BORDER }}
                                  value={p.name}
                                  placeholder="Nama produk"
                                  onChange={e => updateProduct(i, 'name', e.target.value)}
                                  onFocus={e => (e.target.style.borderColor = PRIMARY)}
                                  onBlur={e => (e.target.style.borderColor = BORDER)}
                                />
                                <input
                                  className="w-28 rounded-md border px-2.5 py-1.5 text-sm outline-none"
                                  style={{ borderColor: BORDER }}
                                  value={p.price ?? ''}
                                  placeholder="Harga"
                                  type="number"
                                  onChange={e => updateProduct(i, 'price', e.target.value)}
                                  onFocus={e => (e.target.style.borderColor = PRIMARY)}
                                  onBlur={e => (e.target.style.borderColor = BORDER)}
                                />
                                <button type="button" onClick={() => removeProduct(i)} className="p-1.5 rounded-md hover:bg-red-50 transition-colors" style={{ color: '#ef4444' }}>
                                  <Trash2 size={13} />
                                </button>
                              </div>
                              <input
                                className="w-full rounded-md border px-2.5 py-1.5 text-xs outline-none"
                                style={{ borderColor: BORDER, color: TEXT_SEC }}
                                value={p.description}
                                placeholder="Deskripsi singkat (opsional)"
                                onChange={e => updateProduct(i, 'description', e.target.value)}
                                onFocus={e => (e.target.style.borderColor = PRIMARY)}
                                onBlur={e => (e.target.style.borderColor = BORDER)}
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <h3 className="text-lg font-bold" style={{ color: PRIMARY }}>{previewConfig.brand_name}</h3>
                      {previewConfig.tagline && <p className="text-sm italic" style={{ color: TEXT_SEC }}>{previewConfig.tagline}</p>}
                      <p className="text-sm leading-relaxed" style={{ color: TEXT_SEC }}>{previewConfig.description}</p>

                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: PRIMARY }}>
                          Produk ({previewConfig.products.length})
                        </p>
                        <div className="space-y-2 max-h-40 overflow-y-auto">
                          {previewConfig.products.map((p, i) => (
                            <div key={i} className="flex items-center justify-between text-sm rounded-lg px-3 py-2" style={{ background: SURFACE }}>
                              <span style={{ color: '#1a1a1a' }}>{p.name}</span>
                              <span className="text-xs font-medium" style={{ color: TEXT_SEC }}>
                                {p.price ? `Rp ${p.price.toLocaleString('id-ID')}` : '—'}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {(previewConfig.whatsapp_number || previewConfig.instagram_url) && (
                        <div className="flex gap-3 text-xs" style={{ color: TEXT_SEC }}>
                          {previewConfig.whatsapp_number && <span>WA: {previewConfig.whatsapp_number}</span>}
                          {previewConfig.instagram_url && <span>IG: {previewConfig.instagram_url}</span>}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>

              {error && (
                <div className="mb-4 p-3 rounded-xl text-sm text-red-700 bg-red-50 border border-red-200">{error}</div>
              )}

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={() => setStep('description')}
                  className="flex-1 py-3.5 rounded-2xl text-sm font-semibold border transition-colors"
                  style={{ borderColor: BORDER, color: TEXT_SEC }}
                >
                  Ceritakan Ulang
                </button>
                <button
                  onClick={handleFinalize}
                  className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl text-sm font-semibold text-white transition-opacity hover:opacity-90"
                  style={{ background: PRIMARY }}
                >
                  Saya Puas, Lanjutkan
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>
          )}

          {/* Step: finalizing (saving to DB) */}
          {step === 'finalizing' && (
            <div className="text-center py-16 flex flex-col items-center gap-6">
              <div className="w-20 h-20 rounded-full flex items-center justify-center" style={{ background: `${PRIMARY}12` }}>
                <Loader2 size={36} className="animate-spin" style={{ color: PRIMARY }} />
              </div>
              <div>
                <h2 className="text-xl font-bold" style={{ color: PRIMARY }}>Membuat tokomu...</h2>
                <p className="text-sm mt-2" style={{ color: TEXT_SEC }}>Menyimpan konfigurasi dan produk. Hampir selesai!</p>
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
                  <div className="text-xs text-green-700 mt-0.5">Buat akun untuk mengakses dashboard dan mengelola tokomu.</div>
                </div>
              </div>

              <h2 className="text-2xl font-bold mb-6" style={{ color: PRIMARY }}>Buat akun kamu</h2>

              <form onSubmit={handleSignup} className="flex flex-col gap-4">
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: PRIMARY }}>Nama Lengkap</label>
                  <input type="text" value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Nama kamu" className={inputCls} style={inputStyle} onFocus={e => (e.target.style.borderColor = PRIMARY)} onBlur={e => (e.target.style.borderColor = BORDER)} />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: PRIMARY }}>Email</label>
                  <input type="email" value={email} onChange={e => { setEmail(e.target.value); setEmailIsMerchant(false) }} placeholder="email@bisnis.com" required className={inputCls} style={inputStyle} onFocus={e => (e.target.style.borderColor = PRIMARY)} onBlur={e => { e.target.style.borderColor = BORDER; checkEmail(e.target.value) }} />
                  {emailIsMerchant && (
                    <p className="mt-1.5 text-xs font-medium px-3 py-2 rounded-lg" style={{ background: '#fff7ed', color: '#9a3412', border: '1px solid #fed7aa' }}>
                      Email ini sudah tersambung dengan merchant.
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: PRIMARY }}>Password</label>
                  <div className="relative">
                    <input type={showPw ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="Minimal 6 karakter" required className={inputCls} style={inputStyle} onFocus={e => (e.target.style.borderColor = PRIMARY)} onBlur={e => (e.target.style.borderColor = BORDER)} />
                    <button type="button" onClick={() => setShowPw(v => !v)} className="absolute right-3 top-3.5" style={{ color: TEXT_SEC }}>
                      {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: PRIMARY }}>Konfirmasi Password</label>
                  <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Ulangi password" required className={inputCls} style={inputStyle} onFocus={e => (e.target.style.borderColor = PRIMARY)} onBlur={e => (e.target.style.borderColor = BORDER)} />
                </div>

                {signupError && (
                  <div className="p-3 rounded-xl text-sm text-red-700 bg-red-50 border border-red-200">{signupError}</div>
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

          {/* Step: done */}
          {step === 'done' && result && (
            <div className="text-center py-8 flex flex-col items-center gap-6">
              <div className="w-20 h-20 rounded-full flex items-center justify-center" style={{ background: '#f0fdf4' }}>
                <CheckCircle2 size={36} className="text-green-500" />
              </div>
              <div className="flex flex-col gap-2">
                <h2 className="text-2xl font-bold" style={{ color: PRIMARY }}>Akun berhasil dibuat! 🎉</h2>
                <p className="text-sm leading-relaxed max-w-sm" style={{ color: TEXT_SEC }}>
                  Kami mengirim link verifikasi ke <strong style={{ color: PRIMARY }}>{email}</strong>.
                  <br /><br />
                  Buka email, klik link konfirmasi, lalu login ke dashboard.
                </p>
              </div>

              <div className="w-full rounded-2xl p-5 text-sm text-left flex flex-col gap-3" style={{ background: SURFACE, border: `1px solid ${BORDER}` }}>
                {[
                  '1. Buka inbox (cek juga folder Spam)',
                  '2. Cari email dari noreply@mail.app.supabase.io',
                  plan !== 'free' ? '3. Klik "Confirm your email" → lanjut bayar' : '3. Klik "Confirm your email" → login ke dashboard',
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
                    <a href="http://localhost:54324" target="_blank" rel="noopener noreferrer" className="underline font-mono">localhost:54324</a>
                  </span>
                </div>
              )}

              <div className="flex flex-col gap-3 w-full">
                <a
                  href={plan !== 'free' ? `/subscribe/payment?plan=${plan}&slug=${result.slug}` : `/${result.slug}`}
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
