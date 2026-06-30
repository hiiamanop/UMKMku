'use client'

import { useState, useEffect } from 'react'
import { Sparkles, Lock, ArrowRight, Check, Loader2 } from 'lucide-react'

interface TemplateOption {
  id: string
  name: string
  description: string | null
  preview_urls: string[]
  demo_url: string | null
  template_key: string
}

interface Props {
  slug: string
  tenantId: string
  currentTemplateId: string | null
  planId: string // 'free' | 'business' | 'enterprise'
  category: string
}

const PAID_PLANS = ['business', 'enterprise']

export function TemplateChanger({ slug, tenantId, currentTemplateId, planId, category }: Props) {
  const isPaid = PAID_PLANS.includes(planId)
  const [templates, setTemplates] = useState<TemplateOption[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [selected, setSelected] = useState<string | null>(currentTemplateId)
  const [saved, setSaved] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!open || !isPaid) return
    setLoading(true)
    fetch(`/api/templates?category=${category}`)
      .then(r => r.json())
      .then(d => setTemplates(d.templates ?? []))
      .catch(() => setTemplates([]))
      .finally(() => setLoading(false))
  }, [open, category, isPaid])

  async function handleSave() {
    if (!selected || selected === currentTemplateId) return
    setSaving(true)
    try {
      await fetch(`/api/tenants/${tenantId}/template`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ template_id: selected }),
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
      setOpen(false)
    } catch { /* ignore */ } finally {
      setSaving(false)
    }
  }

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-6">
      <div className="flex items-center justify-between mb-1">
        <h3 className="font-semibold text-gray-900">Template Toko</h3>
        {!isPaid && (
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1">
            <Lock size={11} /> Business
          </span>
        )}
      </div>
      <p className="text-sm text-gray-500 mb-4">
        {isPaid
          ? 'Pilih tampilan yang paling cocok untuk brandmu.'
          : 'Upgrade ke plan Business untuk mengakses semua template yang tersedia.'}
      </p>

      {isPaid ? (
        <>
          <button
            onClick={() => setOpen(v => !v)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors"
            style={{ background: '#0A2F7312', color: '#0A2F73' }}
          >
            <Sparkles size={15} />
            {open ? 'Tutup' : 'Ganti Template'}
          </button>

          {open && (
            <div className="mt-4">
              {loading ? (
                <div className="flex justify-center py-8">
                  <Loader2 size={24} className="animate-spin text-gray-400" />
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                    {templates.map(t => {
                      const isActive = selected === t.id
                      const preview = t.preview_urls?.[0] ?? null
                      return (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => setSelected(t.id)}
                          className="rounded-xl overflow-hidden text-left transition-all"
                          style={{
                            border: `2px solid ${isActive ? '#0A2F73' : '#E5EAF0'}`,
                            background: 'white',
                          }}
                        >
                          <div className="aspect-video w-full overflow-hidden bg-gray-50">
                            {preview ? (
                              <img src={preview} alt={t.name} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Sparkles size={20} className="text-gray-300" />
                              </div>
                            )}
                          </div>
                          <div className="p-3 flex items-center justify-between">
                            <div>
                              <div className="font-medium text-sm text-gray-900">{t.name}</div>
                              {t.demo_url && (
                                <a
                                  href={t.demo_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={e => e.stopPropagation()}
                                  className="text-xs text-gray-400 hover:underline"
                                >
                                  Lihat demo →
                                </a>
                              )}
                            </div>
                            {isActive && <Check size={16} className="text-green-500 shrink-0" />}
                          </div>
                        </button>
                      )
                    })}
                  </div>
                  <button
                    onClick={handleSave}
                    disabled={saving || selected === currentTemplateId || !selected}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-40"
                    style={{ background: '#0A2F73' }}
                  >
                    {saving ? <Loader2 size={14} className="animate-spin" /> : saved ? <Check size={14} /> : <ArrowRight size={14} />}
                    {saved ? 'Tersimpan!' : 'Terapkan Template'}
                  </button>
                </>
              )}
            </div>
          )}
        </>
      ) : (
        <a
          href={`/${slug}/subscribe`}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90"
          style={{ background: '#0A2F73' }}
        >
          Upgrade ke Business
          <ArrowRight size={14} />
        </a>
      )}
    </div>
  )
}
