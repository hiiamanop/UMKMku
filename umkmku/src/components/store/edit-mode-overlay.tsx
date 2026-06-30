'use client'

import { useState, useEffect, useRef } from 'react'
import { useEditMode } from '@/lib/edit-mode-context'
import { Loader2, Save, X, Upload, Type, Image as ImageIcon } from 'lucide-react'

interface EditableField {
  key: string
  type: 'text' | 'textarea' | 'image'
  label: string
  currentValue: string
}

interface Popover {
  field: EditableField
  rect: DOMRect
}

export function EditModeOverlay({ slug }: { slug: string }) {
  const ctx = useEditMode()
  const [popover, setPopover] = useState<Popover | null>(null)
  const [inputValue, setInputValue] = useState('')
  const [uploadLoading, setUploadLoading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const popoverRef = useRef<HTMLDivElement>(null)

  // Apply pending CSS variable changes live
  useEffect(() => {
    if (!ctx) return
    const root = document.documentElement
    if (ctx.pendingChanges.primary_color) root.style.setProperty('--color-primary', ctx.pendingChanges.primary_color as string)
    if (ctx.pendingChanges.secondary_color) root.style.setProperty('--color-secondary', ctx.pendingChanges.secondary_color as string)
    if (ctx.pendingChanges.accent_color) root.style.setProperty('--color-accent', ctx.pendingChanges.accent_color as string)
  }, [ctx?.pendingChanges])

  const [editableCount, setEditableCount] = useState(0)

  useEffect(() => {
    setEditableCount(document.querySelectorAll('[data-editable]').length)
    document.body.style.paddingTop = '44px'
    return () => { document.body.style.paddingTop = '' }
  }, [])

  useEffect(() => {
    if (!ctx) return

    function handleClick(e: MouseEvent) {
      // Jangan interfere dengan klik di dalam popover sendiri
      if (popoverRef.current?.contains(e.target as Node)) return

      const el = (e.target as HTMLElement).closest('[data-editable]') as HTMLElement | null
      if (!el) { setPopover(null); return }

      e.preventDefault()
      e.stopPropagation()

      const key = el.dataset.editable!
      const type = (el.dataset.editType ?? 'text') as EditableField['type']
      const label = el.dataset.editLabel ?? key
      const currentValue = (ctx?.pendingChanges[key] as string) ?? el.dataset.editValue ?? el.textContent ?? ''

      setInputValue(currentValue)
      setPopover({ field: { key, type, label, currentValue }, rect: el.getBoundingClientRect() })
    }

    document.addEventListener('click', handleClick, true)
    return () => document.removeEventListener('click', handleClick, true)
  }, [ctx])

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !popover || !ctx) return
    setUploadLoading(true)
    try {
      const form = new FormData()
      form.append('file', file)
      form.append('context', 'tenant-content')
      const res = await fetch('/api/upload', { method: 'POST', body: form })
      if (!res.ok) throw new Error('Upload gagal')
      const { url } = await res.json()
      ctx.setField(popover.field.key, url)
      updateDom(popover.field.key, 'image', url)
      setPopover(null)
    } catch { /* ignore */ } finally {
      setUploadLoading(false)
    }
  }

  function updateDom(key: string, type: EditableField['type'], value: string) {
    document.querySelectorAll<HTMLElement>(`[data-editable="${key}"]`).forEach(el => {
      el.dataset.editValue = value
      if (type === 'image') {
        const img = el.querySelector('img')
        if (img) img.src = value
      } else {
        el.textContent = value
      }
    })
  }

  function applyEdit() {
    if (!popover || !ctx) return
    const { key, type } = popover.field
    ctx.setField(key, inputValue)
    updateDom(key, type, inputValue)
    setPopover(null)
  }

  if (!ctx) return null

  return (
    <>
      {/* Edit mode banner */}
      <div
        className="fixed top-0 left-0 right-0 z-[9999] flex items-center justify-between px-5 py-2.5 text-white text-sm shadow-lg"
        style={{ background: '#0A2F73' }}
      >
        <div className="flex items-center gap-2 font-semibold">
          <Type size={15} />
          Edit Mode
          <span className="text-xs opacity-50 font-normal">· {editableCount} elemen tersedia · Hover untuk lihat, klik untuk edit</span>
          {ctx.hasChanges && <span className="text-xs opacity-70">· Ada perubahan belum disimpan</span>}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => window.location.href = `/${slug}`}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-opacity hover:opacity-70 flex items-center gap-1"
            style={{ background: 'rgba(255,255,255,0.15)' }}
          >
            <X size={12} /> Batal
          </button>
          <button
            onClick={ctx.save}
            disabled={ctx.saving || !ctx.hasChanges}
            className="px-4 py-1.5 rounded-lg text-xs font-semibold transition-opacity hover:opacity-90 disabled:opacity-40 flex items-center gap-1.5"
            style={{ background: 'rgba(255,255,255,0.15)' }}
          >
            {ctx.saving ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
            {ctx.saving ? 'Menyimpan...' : 'Simpan'}
          </button>
          <button
            onClick={async () => { await ctx.saveAndRedirect(`/${slug}`) }}
            disabled={ctx.saving}
            className="px-4 py-1.5 rounded-lg text-xs font-semibold transition-opacity hover:opacity-90 disabled:opacity-40 flex items-center gap-1.5 bg-white text-[#0A2F73]"
          >
            {ctx.saving ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
            Selesai
          </button>
        </div>
      </div>


      {/* Edit mode styles */}
      <style>{`
        [data-editable] {
          cursor: pointer !important;
          outline: 2px dashed transparent !important;
          outline-offset: 2px !important;
          transition: outline-color 0.15s !important;
        }
        [data-editable]:hover {
          outline-color: #0A2F73 !important;
          position: relative;
        }
        [data-editable]::after {
          content: attr(data-edit-label);
          display: none;
        }
        [data-editable]:hover::before {
          content: attr(data-edit-label);
          position: absolute;
          top: -20px;
          left: 0;
          background: #0A2F73;
          color: white;
          font-size: 10px;
          padding: 2px 6px;
          border-radius: 4px;
          white-space: nowrap;
          z-index: 9998;
          pointer-events: none;
        }
      `}</style>

      {/* Edit popover */}
      {popover && (
        <div
          ref={popoverRef}
          className="fixed z-[9999] bg-white rounded-2xl shadow-2xl border p-4 w-72"
          style={{
            borderColor: '#E5EAF0',
            top: Math.min(popover.rect.bottom + 8, window.innerHeight - 200),
            left: Math.max(8, Math.min(popover.rect.left, window.innerWidth - 296)),
          }}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-gray-700">{popover.field.label}</span>
            <button onClick={() => setPopover(null)} className="text-gray-400 hover:text-gray-600"><X size={14} /></button>
          </div>

          {popover.field.type === 'image' ? (
            <div>
              {(ctx.pendingChanges[popover.field.key] as string ?? popover.field.currentValue) && (
                <img
                  src={ctx.pendingChanges[popover.field.key] as string ?? popover.field.currentValue}
                  alt="preview"
                  className="w-full h-24 object-cover rounded-lg mb-2"
                />
              )}
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadLoading}
                className="w-full py-2 rounded-xl text-sm font-semibold border-2 border-dashed flex items-center justify-center gap-2 text-gray-500 hover:border-[#0A2F73] hover:text-[#0A2F73] transition-colors"
              >
                {uploadLoading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                {uploadLoading ? 'Mengupload...' : 'Upload Gambar'}
              </button>
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
            </div>
          ) : (
            <div className="space-y-2">
              {popover.field.type === 'textarea' ? (
                <textarea
                  value={inputValue}
                  onChange={e => setInputValue(e.target.value)}
                  className="w-full rounded-xl border px-3 py-2 text-sm outline-none resize-none"
                  style={{ borderColor: '#E5EAF0', minHeight: '80px' }}
                  onFocus={e => (e.target.style.borderColor = '#0A2F73')}
                  onBlur={e => (e.target.style.borderColor = '#E5EAF0')}
                  autoFocus
                />
              ) : (
                <input
                  value={inputValue}
                  onChange={e => setInputValue(e.target.value)}
                  className="w-full rounded-xl border px-3 py-2 text-sm outline-none"
                  style={{ borderColor: '#E5EAF0' }}
                  onFocus={e => (e.target.style.borderColor = '#0A2F73')}
                  onBlur={e => (e.target.style.borderColor = '#E5EAF0')}
                  onKeyDown={e => e.key === 'Enter' && applyEdit()}
                  autoFocus
                />
              )}
              <div className="flex gap-2">
                <button
                  onClick={() => setPopover(null)}
                  className="flex-1 py-2 rounded-xl text-xs font-semibold border"
                  style={{ borderColor: '#E5EAF0', color: '#5E6B85' }}
                >
                  Batal
                </button>
                <button
                  onClick={applyEdit}
                  className="flex-1 py-2 rounded-xl text-xs font-semibold text-white"
                  style={{ background: '#0A2F73' }}
                >
                  Terapkan
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  )
}
