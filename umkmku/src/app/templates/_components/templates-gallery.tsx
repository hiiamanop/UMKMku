'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Sparkles, Monitor, Smartphone, ArrowRight } from 'lucide-react'

interface Template {
  id: string
  name: string
  description: string | null
  category: string
  template_key: string
  preview_urls: string[]
  demo_url: string | null
}

interface CategoryFilter {
  value: string
  label: string
}

interface Props {
  templates: Template[]
  categories: CategoryFilter[]
}

const CATEGORY_LABELS: Record<string, string> = {
  skincare: 'Skincare',
  parfum: 'Parfum',
  fashion: 'Fashion',
  fdb: 'F&B',
}

const PRIMARY = '#0A2F73'
const BORDER = '#E5EAF0'
const TEXT_SEC = '#5E6B85'

export function TemplatesGallery({ templates, categories }: Props) {
  const [activeCategory, setActiveCategory] = useState('')
  const [previewMode, setPreviewMode] = useState<Record<string, 'desktop' | 'mobile'>>({})

  const filtered = activeCategory
    ? templates.filter(t => t.category === activeCategory)
    : templates

  function getPreviewMode(id: string) {
    return previewMode[id] ?? 'desktop'
  }

  function togglePreview(id: string) {
    setPreviewMode(prev => ({ ...prev, [id]: prev[id] === 'mobile' ? 'desktop' : 'mobile' }))
  }

  return (
    <div className="max-w-6xl mx-auto px-6 pb-20">
      {/* Category tabs */}
      <div className="flex gap-2 flex-wrap mb-10">
        {categories.map(cat => (
          <button
            key={cat.value}
            onClick={() => setActiveCategory(cat.value)}
            className="px-4 py-2 rounded-full text-sm font-medium transition-all"
            style={{
              background: activeCategory === cat.value ? PRIMARY : 'white',
              color: activeCategory === cat.value ? 'white' : TEXT_SEC,
              border: `1.5px solid ${activeCategory === cat.value ? PRIMARY : BORDER}`,
            }}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-20 text-gray-400">Belum ada template untuk kategori ini.</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map(t => {
            const mode = getPreviewMode(t.id)
            const desktopImg = t.preview_urls?.[0] ?? null
            const mobileImg = t.preview_urls?.[1] ?? desktopImg

            return (
              <div
                key={t.id}
                className="rounded-2xl overflow-hidden border bg-white flex flex-col"
                style={{ borderColor: BORDER }}
              >
                {/* Preview image */}
                <div className="relative aspect-video overflow-hidden bg-gray-50">
                  {(mode === 'desktop' ? desktopImg : mobileImg) ? (
                    <img
                      src={mode === 'desktop' ? desktopImg! : mobileImg!}
                      alt={`${t.name} ${mode}`}
                      className="w-full h-full object-cover object-top"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-gray-300">
                      <Sparkles size={28} />
                      <span className="text-xs">Preview segera tersedia</span>
                    </div>
                  )}

                  {/* Desktop/Mobile toggle */}
                  {(desktopImg || mobileImg) && (
                    <div className="absolute bottom-2 right-2 flex gap-1 bg-white/90 backdrop-blur-sm rounded-lg p-1">
                      <button
                        onClick={() => setPreviewMode(p => ({ ...p, [t.id]: 'desktop' }))}
                        className="p-1 rounded transition-colors"
                        style={{ background: mode === 'desktop' ? PRIMARY : 'transparent', color: mode === 'desktop' ? 'white' : TEXT_SEC }}
                        title="Desktop"
                      >
                        <Monitor size={14} />
                      </button>
                      <button
                        onClick={() => setPreviewMode(p => ({ ...p, [t.id]: 'mobile' }))}
                        className="p-1 rounded transition-colors"
                        style={{ background: mode === 'mobile' ? PRIMARY : 'transparent', color: mode === 'mobile' ? 'white' : TEXT_SEC }}
                        title="Mobile"
                      >
                        <Smartphone size={14} />
                      </button>
                    </div>
                  )}

                  {/* Category badge */}
                  <span
                    className="absolute top-2 left-2 text-xs font-semibold px-2.5 py-1 rounded-full"
                    style={{ background: 'white', color: PRIMARY, border: `1px solid ${BORDER}` }}
                  >
                    {CATEGORY_LABELS[t.category] ?? t.category}
                  </span>
                </div>

                {/* Info */}
                <div className="p-5 flex flex-col gap-3 flex-1">
                  <div>
                    <h3 className="font-semibold text-gray-900">{t.name}</h3>
                    {t.description && (
                      <p className="text-sm mt-0.5 line-clamp-2" style={{ color: TEXT_SEC }}>{t.description}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 mt-auto">
                    {t.demo_url && (
                      <a
                        href={t.demo_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 py-2 rounded-xl text-sm font-medium text-center transition-colors border hover:bg-gray-50"
                        style={{ borderColor: BORDER, color: TEXT_SEC }}
                      >
                        Lihat Demo
                      </a>
                    )}
                    <Link
                      href={`/onboarding?template_id=${t.id}&category=${t.category}`}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90"
                      style={{ background: PRIMARY }}
                    >
                      Gunakan
                      <ArrowRight size={13} />
                    </Link>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
