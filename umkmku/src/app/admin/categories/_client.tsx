'use client'

import { useState } from 'react'
import { Plus, Pencil, Trash2, Loader2, X, Check, ToggleLeft, ToggleRight } from 'lucide-react'

interface Category {
  slug: string
  name: string
  description: string | null
  icon: string | null
  is_active: boolean
  sort_order: number
}

const BORDER = '#E5EAF0'
const PRIMARY = '#0A2F73'
const TEXT_SEC = '#5E6B85'

const inputCls = 'w-full rounded-xl px-3 py-2.5 text-sm border outline-none transition-colors'
const inputStyle = { borderColor: BORDER }
const focus = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => (e.target.style.borderColor = PRIMARY)
const blur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => (e.target.style.borderColor = BORDER)

function CategoryForm({
  initial,
  onSave,
  onCancel,
  loading,
}: {
  initial?: Partial<Category>
  onSave: (data: Partial<Category>) => void
  onCancel: () => void
  loading: boolean
}) {
  const [slug, setSlug] = useState(initial?.slug ?? '')
  const [name, setName] = useState(initial?.name ?? '')
  const [description, setDescription] = useState(initial?.description ?? '')
  const [icon, setIcon] = useState(initial?.icon ?? '')
  const [sortOrder, setSortOrder] = useState(String(initial?.sort_order ?? 0))
  const isEdit = !!initial?.slug

  return (
    <div className="rounded-2xl border bg-white p-6 space-y-4" style={{ borderColor: BORDER }}>
      <h3 className="font-semibold text-gray-900">{isEdit ? 'Edit Kategori' : 'Tambah Kategori'}</h3>
      <div className="grid grid-cols-2 gap-4">
        {!isEdit && (
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: PRIMARY }}>Slug * <span className="font-normal text-gray-400">(unik, tidak bisa diubah)</span></label>
            <input value={slug} onChange={e => setSlug(e.target.value.toLowerCase().replace(/\s+/g, '-'))}
              placeholder="contoh: fashion" className={inputCls} style={inputStyle} onFocus={focus} onBlur={blur} />
          </div>
        )}
        <div className={isEdit ? 'col-span-2' : ''}>
          <label className="block text-xs font-semibold mb-1.5" style={{ color: PRIMARY }}>Nama *</label>
          <input value={name} onChange={e => setName(e.target.value)}
            placeholder="Nama kategori" className={inputCls} style={inputStyle} onFocus={focus} onBlur={blur} />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="block text-xs font-semibold mb-1.5" style={{ color: PRIMARY }}>Icon <span className="font-normal text-gray-400">(emoji)</span></label>
          <input value={icon} onChange={e => setIcon(e.target.value)}
            placeholder="✨" className={inputCls} style={inputStyle} onFocus={focus} onBlur={blur} />
        </div>
        <div>
          <label className="block text-xs font-semibold mb-1.5" style={{ color: PRIMARY }}>Urutan</label>
          <input type="number" value={sortOrder} onChange={e => setSortOrder(e.target.value)}
            className={inputCls} style={inputStyle} onFocus={focus} onBlur={blur} />
        </div>
      </div>
      <div>
        <label className="block text-xs font-semibold mb-1.5" style={{ color: PRIMARY }}>Deskripsi</label>
        <input value={description} onChange={e => setDescription(e.target.value)}
          placeholder="Deskripsi singkat kategori ini" className={inputCls} style={inputStyle} onFocus={focus} onBlur={blur} />
      </div>
      <div className="flex gap-2 justify-end">
        <button onClick={onCancel} className="px-4 py-2 text-sm rounded-xl border" style={{ borderColor: BORDER, color: TEXT_SEC }}>
          Batal
        </button>
        <button
          onClick={() => onSave({ slug, name, description, icon, sort_order: Number(sortOrder) })}
          disabled={loading || !name.trim() || (!isEdit && !slug.trim())}
          className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-xl text-white disabled:opacity-50"
          style={{ background: PRIMARY }}
        >
          {loading ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
          {isEdit ? 'Simpan' : 'Tambah'}
        </button>
      </div>
    </div>
  )
}

export function CategoriesClient({ initial }: { initial: Category[] }) {
  const [categories, setCategories] = useState(initial)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Category | null>(null)
  const [loading, setLoading] = useState<string | null>(null)

  async function handleCreate(data: Partial<Category>) {
    setLoading('create')
    const res = await fetch('/api/admin/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (res.ok) {
      const created = await res.json()
      setCategories(prev => [...prev, created].sort((a, b) => a.sort_order - b.sort_order))
      setShowForm(false)
    }
    setLoading(null)
  }

  async function handleEdit(data: Partial<Category>) {
    if (!editing) return
    setLoading('edit')
    const res = await fetch(`/api/admin/categories/${editing.slug}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (res.ok) {
      setCategories(prev => prev.map(c => c.slug === editing.slug ? { ...c, ...data } : c))
      setEditing(null)
    }
    setLoading(null)
  }

  async function toggleActive(cat: Category) {
    setLoading(cat.slug + '_toggle')
    const res = await fetch(`/api/admin/categories/${cat.slug}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: !cat.is_active }),
    })
    if (res.ok) setCategories(prev => prev.map(c => c.slug === cat.slug ? { ...c, is_active: !c.is_active } : c))
    setLoading(null)
  }

  async function handleDelete(slug: string) {
    if (!confirm('Hapus kategori ini? Toko yang sudah ada tidak terpengaruh.')) return
    setLoading(slug + '_delete')
    const res = await fetch(`/api/admin/categories/${slug}`, { method: 'DELETE' })
    if (res.ok) setCategories(prev => prev.filter(c => c.slug !== slug))
    setLoading(null)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#0A2F73]">Kategori</h1>
          <p className="text-sm text-[#5E6B85] mt-0.5">{categories.length} kategori terdaftar</p>
        </div>
        {!showForm && !editing && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white"
            style={{ background: PRIMARY }}
          >
            <Plus size={15} /> Tambah Kategori
          </button>
        )}
      </div>

      {showForm && (
        <CategoryForm
          onSave={handleCreate}
          onCancel={() => setShowForm(false)}
          loading={loading === 'create'}
        />
      )}

      {editing && (
        <CategoryForm
          initial={editing}
          onSave={handleEdit}
          onCancel={() => setEditing(null)}
          loading={loading === 'edit'}
        />
      )}

      <div className="bg-white rounded-xl border overflow-hidden" style={{ borderColor: BORDER }}>
        <table className="w-full text-sm">
          <thead className="bg-[#F8FAFC] border-b" style={{ borderColor: BORDER }}>
            <tr>
              <th className="text-left px-5 py-3 font-medium" style={{ color: TEXT_SEC }}>Kategori</th>
              <th className="text-left px-5 py-3 font-medium" style={{ color: TEXT_SEC }}>Slug</th>
              <th className="text-left px-5 py-3 font-medium" style={{ color: TEXT_SEC }}>Deskripsi</th>
              <th className="text-left px-5 py-3 font-medium" style={{ color: TEXT_SEC }}>Urutan</th>
              <th className="text-left px-5 py-3 font-medium" style={{ color: TEXT_SEC }}>Status</th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody>
            {categories.length === 0 && (
              <tr><td colSpan={6} className="px-5 py-10 text-center" style={{ color: TEXT_SEC }}>Belum ada kategori</td></tr>
            )}
            {categories.map(cat => (
              <tr key={cat.slug} className="border-b last:border-0 hover:bg-[#F8FAFC]" style={{ borderColor: BORDER }}>
                <td className="px-5 py-4">
                  <div className="flex items-center gap-2">
                    {cat.icon && <span className="text-xl">{cat.icon}</span>}
                    <span className="font-semibold" style={{ color: PRIMARY }}>{cat.name}</span>
                  </div>
                </td>
                <td className="px-5 py-4">
                  <code className="text-xs bg-gray-100 px-2 py-1 rounded font-mono">{cat.slug}</code>
                </td>
                <td className="px-5 py-4 text-xs max-w-xs truncate" style={{ color: TEXT_SEC }}>{cat.description ?? '—'}</td>
                <td className="px-5 py-4 text-center" style={{ color: TEXT_SEC }}>{cat.sort_order}</td>
                <td className="px-5 py-4">
                  <button
                    onClick={() => toggleActive(cat)}
                    disabled={!!loading}
                    className="flex items-center gap-1.5 text-xs font-medium transition-colors"
                    style={{ color: cat.is_active ? '#16a34a' : TEXT_SEC }}
                  >
                    {loading === cat.slug + '_toggle'
                      ? <Loader2 size={14} className="animate-spin" />
                      : cat.is_active
                        ? <ToggleRight size={18} className="text-green-500" />
                        : <ToggleLeft size={18} />
                    }
                    {cat.is_active ? 'Aktif' : 'Nonaktif'}
                  </button>
                </td>
                <td className="px-5 py-4">
                  <div className="flex items-center gap-2 justify-end">
                    <button
                      onClick={() => { setEditing(cat); setShowForm(false) }}
                      className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600 transition-colors"
                      title="Edit"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => handleDelete(cat.slug)}
                      disabled={loading === cat.slug + '_delete'}
                      className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 transition-colors disabled:opacity-40"
                      title="Hapus"
                    >
                      {loading === cat.slug + '_delete' ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
