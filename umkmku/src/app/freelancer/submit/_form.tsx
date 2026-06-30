'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Upload, X, CheckCircle2, Plus } from 'lucide-react'

const PRIMARY = '#0A2F73'
const BORDER = '#E5EAF0'
const TEXT_SEC = '#5E6B85'

const CATEGORIES = [
  { value: 'skincare', label: 'Skincare & Beauty' },
  { value: 'parfum', label: 'Parfum' },
  { value: 'fashion', label: 'Fashion' },
  { value: 'fdb', label: 'Makanan & Minuman' },
]

const inputCls = 'w-full rounded-xl px-4 py-3 text-sm border outline-none transition-colors bg-white'
const inputStyle = { borderColor: BORDER }

export function SubmitTemplateForm() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('')
  const [repoUrl, setRepoUrl] = useState('')
  const [demoUrl, setDemoUrl] = useState('')
  const [previewImages, setPreviewImages] = useState<string[]>([])
  const [uploading, setUploading] = useState(false)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    if (!files.length) return
    setUploading(true)
    try {
      for (const file of files) {
        const form = new FormData()
        form.append('file', file)
        form.append('context', 'template-preview')
        const res = await fetch('/api/upload', { method: 'POST', body: form })
        if (!res.ok) throw new Error('Upload gagal')
        const { url } = await res.json()
        setPreviewImages(prev => [...prev, url])
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload gagal')
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || !category || !repoUrl.trim() || !demoUrl.trim()) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/freelancer/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          description,
          category,
          repo_url: repoUrl,
          demo_url: demoUrl,
          preview_image_urls: previewImages,
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
      <div className="rounded-2xl border bg-white p-10 text-center flex flex-col items-center gap-4" style={{ borderColor: BORDER }}>
        <CheckCircle2 size={40} className="text-green-500" />
        <h2 className="text-lg font-bold text-gray-900">Template berhasil disubmit!</h2>
        <p className="text-sm text-gray-500 max-w-sm">
          Tim kami akan mereview dalam 1-3 hari kerja. Kamu akan mendapat notifikasi via email.
        </p>
        <button
          onClick={() => router.push('/freelancer/dashboard')}
          className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white"
          style={{ background: PRIMARY }}
        >
          Ke Dashboard
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl border bg-white p-8 space-y-5" style={{ borderColor: BORDER }}>
      <div>
        <label className="block text-xs font-semibold mb-1.5" style={{ color: PRIMARY }}>Nama Template *</label>
        <input value={name} onChange={e => setName(e.target.value)} placeholder="Contoh: Skincare Minimal Dark" required className={inputCls} style={inputStyle} onFocus={e => (e.target.style.borderColor = PRIMARY)} onBlur={e => (e.target.style.borderColor = BORDER)} />
      </div>

      <div>
        <label className="block text-xs font-semibold mb-1.5" style={{ color: PRIMARY }}>Kategori *</label>
        <select value={category} onChange={e => setCategory(e.target.value)} required className={inputCls} style={inputStyle}>
          <option value="">Pilih kategori</option>
          {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>
      </div>

      <div>
        <label className="block text-xs font-semibold mb-1.5" style={{ color: PRIMARY }}>Deskripsi</label>
        <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Jelaskan gaya/mood template, cocok untuk brand seperti apa..." className={inputCls} style={{ ...inputStyle, minHeight: '80px', resize: 'none' }} onFocus={e => (e.target.style.borderColor = PRIMARY)} onBlur={e => (e.target.style.borderColor = BORDER)} />
      </div>

      <div>
        <label className="block text-xs font-semibold mb-1.5" style={{ color: PRIMARY }}>GitHub / GitLab Repo URL * <span className="font-normal text-gray-400">(harus public)</span></label>
        <input type="url" value={repoUrl} onChange={e => setRepoUrl(e.target.value)} placeholder="https://github.com/username/template-repo" required className={inputCls} style={inputStyle} onFocus={e => (e.target.style.borderColor = PRIMARY)} onBlur={e => (e.target.style.borderColor = BORDER)} />
      </div>

      <div>
        <label className="block text-xs font-semibold mb-1.5" style={{ color: PRIMARY }}>URL Live Demo * <span className="font-normal text-gray-400">(wajib — untuk screenshot otomatis)</span></label>
        <input type="url" value={demoUrl} onChange={e => setDemoUrl(e.target.value)} placeholder="https://demo-template.vercel.app" required className={inputCls} style={inputStyle} onFocus={e => (e.target.style.borderColor = PRIMARY)} onBlur={e => (e.target.style.borderColor = BORDER)} />
      </div>

      {/* Preview images */}
      <div>
        <label className="block text-xs font-semibold mb-1.5" style={{ color: PRIMARY }}>
          Preview Images <span className="font-normal text-gray-400">(minimal 1 desktop + 1 mobile, bisa lebih)</span>
        </label>
        <div className="flex flex-wrap gap-2 mb-2">
          {previewImages.map((url, i) => (
            <div key={i} className="relative w-24 h-16 rounded-lg overflow-hidden border" style={{ borderColor: BORDER }}>
              <img src={url} alt={`preview ${i + 1}`} className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => setPreviewImages(prev => prev.filter((_, idx) => idx !== i))}
                className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full bg-black/60 text-white flex items-center justify-center"
              >
                <X size={10} />
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="w-24 h-16 rounded-lg border-2 border-dashed flex flex-col items-center justify-center gap-1 text-gray-400 hover:border-gray-400 transition-colors disabled:opacity-50"
            style={{ borderColor: BORDER }}
          >
            {uploading ? <Loader2 size={16} className="animate-spin" /> : <><Upload size={14} /><span className="text-xs">Tambah</span></>}
          </button>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleImageUpload}
          className="hidden"
        />
        <p className="text-xs text-gray-400">Upload screenshot desktop (1440px) dan mobile (375px). Format JPG/PNG/WebP.</p>
      </div>

      {error && <div className="p-3 rounded-xl text-sm text-red-700 bg-red-50 border border-red-200">{error}</div>}

      <button
        type="submit"
        disabled={loading || !name.trim() || !category || !repoUrl.trim() || !demoUrl.trim()}
        className="w-full py-3.5 rounded-2xl font-semibold text-base transition-opacity hover:opacity-90 disabled:opacity-50 text-white flex items-center justify-center gap-2"
        style={{ background: PRIMARY }}
      >
        {loading ? <><Loader2 size={16} className="animate-spin" /> Mengirim...</> : 'Submit untuk Review'}
      </button>
    </form>
  )
}
