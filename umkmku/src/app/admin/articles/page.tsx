'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Copy, ExternalLink, Loader2, Pencil, Trash2, X, Upload } from 'lucide-react'

interface Article {
  id: string
  title: string
  slug: string
  summary: string | null
  status: 'draft' | 'published'
  image_url: string | null
  image_position: string | null
  chatgpt_prompt?: string
  content?: string
  created_at: string
  published_at: string | null
}

export default function ArticlesPage() {
  const [articles, setArticles] = useState<Article[]>([])
  const [loading,  setLoading]  = useState(true)
  const [toggling, setToggling] = useState<string | null>(null)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [copied,   setCopied]   = useState<string | null>(null)
  const [editing,  setEditing]  = useState<Article | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [page,     setPage]     = useState(1)
  const [total,    setTotal]    = useState(0)
  const pageSize = 10

  function loadPage(p: number) {
    setLoading(true)
    fetch(`/api/admin/articles?page=${p}`)
      .then(r => r.json())
      .then(d => { setArticles(d.articles ?? []); setTotal(d.total ?? 0) })
      .finally(() => setLoading(false))
  }

  useEffect(() => { loadPage(1) }, [])

  function goToPage(p: number) {
    setPage(p)
    loadPage(p)
  }

  async function toggleStatus(a: Article) {
    setToggling(a.id)
    const next = a.status === 'published' ? 'draft' : 'published'
    const res  = await fetch('/api/admin/articles', {
      method : 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body   : JSON.stringify({ id: a.id, status: next }),
    })
    if (res.ok) {
      setArticles(prev => prev.map(x =>
        x.id === a.id ? { ...x, status: next, published_at: next === 'published' ? new Date().toISOString() : null } : x
      ))
    }
    setToggling(null)
  }

  function copyPrompt(id: string, prompt: string) {
    navigator.clipboard.writeText(prompt)
    setCopied(id)
    setTimeout(() => setCopied(null), 2000)
  }

  function onSaved(updated: Partial<Article> & { id: string }) {
    setArticles(prev => prev.map(x => x.id === updated.id ? { ...x, ...updated } : x))
    setEditing(null)
  }

  async function deleteArticle(a: Article) {
    if (!confirm(`Hapus artikel "${a.title}"?`)) return
    setDeleting(a.id)
    const res = await fetch('/api/admin/articles', {
      method : 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body   : JSON.stringify({ id: a.id }),
    })
    if (res.ok) {
      setArticles(prev => prev.filter(x => x.id !== a.id))
      setTotal(prev => prev - 1)
    }
    setDeleting(null)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-[#0A2F73]">Artikel</h1>
        <Link
          href="/admin/articles/generate"
          className="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-[#0A2F73] hover:opacity-90 transition-opacity"
        >
          + Generate Artikel
        </Link>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="animate-spin text-[#0A2F73]" /></div>
      ) : (
        <div className="bg-white rounded-xl border border-[#E5EAF0] overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-[#F8FAFC] border-b border-[#E5EAF0]">
              <tr>
                <th className="text-left px-5 py-3 font-medium text-[#5E6B85]">Judul</th>
                <th className="text-left px-5 py-3 font-medium text-[#5E6B85]">Status</th>
                <th className="text-left px-5 py-3 font-medium text-[#5E6B85]">Dibuat</th>
                <th className="text-left px-5 py-3 font-medium text-[#5E6B85]">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {!articles.length && (
                <tr><td colSpan={4} className="px-5 py-10 text-center text-[#5E6B85]">Belum ada artikel. Generate sekarang!</td></tr>
              )}
              {articles.map((a) => (
                <>
                  <tr key={a.id} className="border-b border-[#E5EAF0] last:border-0 hover:bg-[#F8FAFC]">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        {a.image_url && (
                          <div className="relative w-10 h-10 rounded overflow-hidden shrink-0">
                            <Image src={a.image_url} alt="" fill className="object-cover" />
                          </div>
                        )}
                        <div>
                          <div className="font-medium text-[#0A2F73]">{a.title}</div>
                          {a.summary && <div className="text-xs text-[#5E6B85] mt-0.5 line-clamp-1">{a.summary}</div>}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        a.status === 'published' ? 'bg-green-50 text-green-700' : 'bg-yellow-50 text-yellow-700'
                      }`}>
                        {a.status === 'published' ? 'Published' : 'Draft'}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-[#5E6B85]">
                      {new Date(a.created_at).toLocaleDateString('id-ID')}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setEditing(a)}
                          className="p-1.5 rounded-lg text-[#5E6B85] hover:text-[#0A2F73] hover:bg-[#F0F4F8] transition-colors"
                          title="Edit artikel"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => deleteArticle(a)}
                          disabled={deleting === a.id}
                          className="p-1.5 rounded-lg text-[#5E6B85] hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                          title="Hapus artikel"
                        >
                          {deleting === a.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                        </button>
                        <button
                          onClick={() => toggleStatus(a)}
                          disabled={toggling === a.id}
                          className={`px-3 py-1 rounded-lg text-xs font-semibold transition-opacity disabled:opacity-50 ${
                            a.status === 'published'
                              ? 'bg-yellow-50 text-yellow-700 hover:bg-yellow-100'
                              : 'bg-green-50 text-green-700 hover:bg-green-100'
                          }`}
                        >
                          {toggling === a.id
                            ? <Loader2 size={10} className="animate-spin inline" />
                            : a.status === 'published' ? 'Unpublish' : 'Publish'}
                        </button>
                        {a.status === 'published' && (
                          <Link
                            href={`/insight/${a.slug}`}
                            target="_blank"
                            className="p-1 text-[#5E6B85] hover:text-[#0A2F73]"
                            title="Lihat artikel"
                          >
                            <ExternalLink size={14} />
                          </Link>
                        )}
                        <button
                          onClick={() => setExpanded(expanded === a.id ? null : a.id)}
                          className="px-3 py-1 rounded-lg text-xs font-semibold bg-[#F0F4F8] text-[#5E6B85] hover:bg-[#E5EAF0]"
                        >
                          {expanded === a.id ? 'Tutup' : '🎨 Prompt'}
                        </button>
                      </div>
                    </td>
                  </tr>
                  {expanded === a.id && (
                    <tr key={`${a.id}-prompt`} className="border-b border-[#E5EAF0] bg-[#FFFBEB]">
                      <td colSpan={4} className="px-5 py-4">
                        <div className="text-xs font-semibold text-[#5E6B85] mb-2">🎨 Prompt ChatGPT untuk gambar artikel:</div>
                        <div className="flex items-start gap-3">
                          <p className="text-sm text-[#374151] flex-1 leading-relaxed">
                            {a.chatgpt_prompt ?? '(tidak ada prompt)'}
                          </p>
                          {a.chatgpt_prompt && (
                            <button
                              onClick={() => copyPrompt(a.id, a.chatgpt_prompt!)}
                              className="shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#0A2F73] text-white hover:opacity-90 transition-opacity"
                            >
                              <Copy size={11} />
                              {copied === a.id ? 'Tersalin!' : 'Copy'}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {total > pageSize && (
        <div className="flex items-center justify-between mt-4 text-sm text-[#5E6B85]">
          <span>{total} artikel · halaman {page} dari {Math.ceil(total / pageSize)}</span>
          <div className="flex gap-2">
            <button
              onClick={() => goToPage(page - 1)}
              disabled={page === 1}
              className="px-3 py-1.5 rounded-lg border border-[#E5EAF0] hover:bg-[#F8FAFC] disabled:opacity-40 disabled:cursor-not-allowed"
            >
              ← Sebelumnya
            </button>
            <button
              onClick={() => goToPage(page + 1)}
              disabled={page >= Math.ceil(total / pageSize)}
              className="px-3 py-1.5 rounded-lg border border-[#E5EAF0] hover:bg-[#F8FAFC] disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Berikutnya →
            </button>
          </div>
        </div>
      )}

      {/* Edit drawer */}
      {editing && (
        <EditDrawer
          article={editing}
          onClose={() => setEditing(null)}
          onSaved={onSaved}
        />
      )}
    </div>
  )
}

// ── Edit Drawer ───────────────────────────────────────────────────────────────

function EditDrawer({
  article,
  onClose,
  onSaved,
}: {
  article: Article
  onClose: () => void
  onSaved: (a: Partial<Article> & { id: string }) => void
}) {
  const [title,     setTitle]     = useState(article.title)
  const [content,   setContent]   = useState(article.content ?? '')
  const [imageUrl,  setImageUrl]  = useState(article.image_url ?? '')
  const [imgPos,    setImgPos]    = useState(article.image_position ?? '50% 50%')
  const [saving,    setSaving]    = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error,     setError]     = useState('')

  const fileRef      = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const dragRef      = useRef<{ startX: number; startY: number; posX: number; posY: number } | null>(null)

  // Parse "50% 50%" → [50, 50]
  function parsePos(p: string): [number, number] {
    const [x, y] = p.split(' ').map(parseFloat)
    return [isNaN(x) ? 50 : x, isNaN(y) ? 50 : y]
  }

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    const [px, py] = parsePos(imgPos)
    dragRef.current = { startX: e.clientX, startY: e.clientY, posX: px, posY: py }
  }, [imgPos])

  const onMouseMove = useCallback((e: React.MouseEvent) => {
    if (!dragRef.current || !containerRef.current) return
    const { width, height } = containerRef.current.getBoundingClientRect()
    const dx = (e.clientX - dragRef.current.startX) / width  * 100
    const dy = (e.clientY - dragRef.current.startY) / height * 100
    // grab-and-drag: image follows pointer (drag right → show more left → posX decreases)
    const nx = Math.round(Math.max(0, Math.min(100, dragRef.current.posX - dx)))
    const ny = Math.round(Math.max(0, Math.min(100, dragRef.current.posY - dy)))
    setImgPos(`${nx}% ${ny}%`)
  }, [])

  const onMouseUp = useCallback(() => { dragRef.current = null }, [])

  async function compressImage(file: File, maxWidth = 1200, quality = 0.82): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const img = document.createElement('img')
      img.onload = () => {
        const scale  = Math.min(1, maxWidth / img.width)
        const canvas = document.createElement('canvas')
        canvas.width  = Math.round(img.width  * scale)
        canvas.height = Math.round(img.height * scale)
        canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height)
        canvas.toBlob(b => b ? resolve(b) : reject(new Error('Compress gagal')), 'image/webp', quality)
      }
      img.onerror = reject
      img.src = URL.createObjectURL(file)
    })
  }

  async function handleUpload(file: File) {
    setUploading(true)
    setError('')
    try {
      const compressed = await compressImage(file)
      const form = new FormData()
      form.append('file', new File([compressed], file.name.replace(/\.\w+$/, '.webp'), { type: 'image/webp' }))
      const res  = await fetch('/api/admin/articles/upload', { method: 'POST', body: form })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Upload gagal'); return }
      setImageUrl(data.url)
      setImgPos('50% 50%')
    } catch {
      setError('Gagal mengompresi gambar')
    } finally {
      setUploading(false)
    }
  }

  async function handleSave() {
    if (!title.trim()) { setError('Judul tidak boleh kosong'); return }
    setSaving(true)
    setError('')
    const res = await fetch('/api/admin/articles', {
      method : 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body   : JSON.stringify({
        id            : article.id,
        title         : title.trim(),
        content,
        image_url     : imageUrl || null,
        image_position: imgPos,
      }),
    })
    const data = await res.json()
    if (!res.ok) { setError(data.error ?? 'Gagal menyimpan'); setSaving(false); return }
    onSaved({ id: article.id, title: title.trim(), content, image_url: imageUrl || null, image_position: imgPos })
  }

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/40 z-40" onClick={onClose} />

      {/* Panel */}
      <div className="fixed right-0 top-0 h-full w-full max-w-2xl bg-white z-50 shadow-2xl flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E5EAF0]">
          <h2 className="font-semibold text-[#0A2F73]">Edit Artikel</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[#F0F4F8] text-[#5E6B85]">
            <X size={18} />
          </button>
        </div>

        {/* Body, scrollable */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-[#5E6B85] mb-1.5">Judul</label>
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full border border-[#E5EAF0] rounded-lg px-3 py-2.5 text-sm text-[#0A2F73] font-medium focus:outline-none focus:border-[#0A2F73]"
            />
          </div>

          {/* Image */}
          <div>
            <label className="block text-xs font-semibold text-[#5E6B85] mb-1.5">Gambar Artikel</label>

            {/* Preview with drag repositioning */}
            {imageUrl && (
              <div
                ref={containerRef}
                onMouseMove={onMouseMove}
                onMouseUp={onMouseUp}
                onMouseLeave={onMouseUp}
                className="relative w-full h-52 rounded-xl overflow-hidden mb-3 border border-[#E5EAF0] select-none"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={imageUrl}
                  alt="preview"
                  onMouseDown={onMouseDown}
                  draggable={false}
                  style={{ objectPosition: imgPos }}
                  className="w-full h-full object-cover cursor-grab active:cursor-grabbing"
                />
                {/* Overlay hint */}
                <div className="absolute bottom-2 left-2 bg-black/50 text-white text-[10px] px-2 py-1 rounded-full pointer-events-none">
                  Drag untuk atur posisi · {imgPos}
                </div>
                <button
                  onMouseDown={e => e.stopPropagation()}
                  onClick={() => { setImageUrl(''); setImgPos('50% 50%') }}
                  className="absolute top-2 right-2 bg-white/90 rounded-full p-1 text-[#5E6B85] hover:text-red-500"
                >
                  <X size={14} />
                </button>
              </div>
            )}

            {/* Upload / URL */}
            <div className="flex gap-2">
              <input
                type="text"
                value={imageUrl}
                onChange={e => { setImageUrl(e.target.value); setImgPos('50% 50%') }}
                placeholder="Paste URL gambar..."
                className="flex-1 border border-[#E5EAF0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#0A2F73]"
              />
              <button
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border border-[#E5EAF0] text-[#5E6B85] hover:bg-[#F0F4F8] disabled:opacity-50"
              >
                {uploading ? <Loader2 size={13} className="animate-spin" /> : <Upload size={13} />}
                Upload
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={e => { const f = e.target.files?.[0]; if (f) handleUpload(f) }}
              />
            </div>
            <p className="text-xs text-[#9AACBF] mt-1.5">
              Gambar tampil full-width di atas artikel dan sebagai thumbnail di listing.
            </p>
          </div>

          {/* Content */}
          <div>
            <label className="block text-xs font-semibold text-[#5E6B85] mb-1.5">Isi Artikel (HTML)</label>
            <textarea
              value={content}
              onChange={e => setContent(e.target.value)}
              rows={20}
              className="w-full border border-[#E5EAF0] rounded-lg px-3 py-2.5 text-sm font-mono text-[#374151] focus:outline-none focus:border-[#0A2F73] resize-y"
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex justify-end gap-3 pt-2 pb-4">
            <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm text-[#5E6B85] hover:bg-[#F0F4F8]">
              Batal
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold text-white bg-[#0A2F73] hover:opacity-90 disabled:opacity-50"
            >
              {saving && <Loader2 size={13} className="animate-spin" />}
              Simpan
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
