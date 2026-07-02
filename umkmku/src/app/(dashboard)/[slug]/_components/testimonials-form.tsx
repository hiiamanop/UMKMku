'use client'

import { useActionState, useState } from 'react'
import Image from 'next/image'
import { Trash2, Plus, ChevronDown, ChevronUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import type { Testimonial } from '@/lib/supabase/types'
import { saveTestimonial, deleteTestimonial } from '../actions'
import { FieldLabel } from './form-section'

const inputCls = "bg-white border-black/15 focus-visible:ring-[var(--color-primary)]/20 focus-visible:border-[var(--color-primary)]"

function StarRatingInput({ defaultValue = 5 }: { defaultValue?: number }) {
  const [value, setValue] = useState(defaultValue)
  return (
    <div>
      <FieldLabel>Rating</FieldLabel>
      <input type="hidden" name="rating" value={value} />
      <div className="flex gap-1 mt-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button key={star} type="button" onClick={() => setValue(star)}
            className="text-2xl transition-opacity select-none"
            style={{ color: '#F4B400', opacity: star <= value ? 1 : 0.2 }}>
            ★
          </button>
        ))}
      </div>
    </div>
  )
}

function PhotoUpload({ field, label, current }: { field: string; label: string; current: string | null | undefined }) {
  const [preview, setPreview] = useState<string | null>(null)
  return (
    <div className="space-y-2">
      <FieldLabel>{label}</FieldLabel>
      <div className="relative w-24 h-32 bg-gray-50 rounded overflow-hidden border border-black/8">
        {(preview ?? current) && (
          <Image src={preview ?? current!} alt={label} fill className="object-cover" />
        )}
        {!(preview ?? current) && (
          <div className="absolute inset-0 flex items-center justify-center text-gray-300 text-xs text-center px-1">Belum ada foto</div>
        )}
      </div>
      <input type="file" name={field} accept="image/jpeg,image/png,image/webp"
        className="block w-full text-xs text-gray-500 file:mr-2 file:py-1.5 file:px-3 file:border file:border-black/15 file:text-xs file:bg-white file:text-gray-700 hover:file:bg-gray-50 file:cursor-pointer file:transition-colors"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) setPreview(URL.createObjectURL(f)) }} />
    </div>
  )
}

function TestimonialRow({ slug, item }: { slug: string; item: Testimonial }) {
  const [open, setOpen] = useState(false)
  const [state, action, pending] = useActionState(
    async (_: unknown, formData: FormData) => saveTestimonial(slug, formData),
    null
  )

  return (
    <div className="border-b border-black/5 last:border-0">
      <button type="button" onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between py-4 text-left hover:opacity-70 transition-opacity">
        <div>
          <span className="text-body-md font-medium">{item.author_name}</span>
          {item.author_title && <span className="text-label-caps text-[10px] text-gray-400 ml-3">{item.author_title}</span>}
        </div>
        {open ? <ChevronUp size={15} className="text-gray-300" /> : <ChevronDown size={15} className="text-gray-300" />}
      </button>

      {open && (
        <form action={action} encType="multipart/form-data" className="pb-6 space-y-4">
          <input type="hidden" name="id" value={item.id} />

          <div className="grid grid-cols-2 gap-4">
            <div><FieldLabel>Nama</FieldLabel><Input name="author_name" defaultValue={item.author_name} required className={inputCls} /></div>
            <div><FieldLabel>Jabatan / Keterangan</FieldLabel><Input name="author_title" defaultValue={item.author_title ?? ''} placeholder="Pelanggan setia" className={inputCls} /></div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <FieldLabel>Kutipan</FieldLabel>
              <Textarea name="quote" defaultValue={item.quote} rows={3} required className={inputCls} />
            </div>
            <StarRatingInput defaultValue={item.rating ?? 5} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <PhotoUpload field="image_1" label="Foto 1" current={item.image_1_url} />
            <PhotoUpload field="image_2" label="Foto 2" current={item.image_2_url} />
          </div>

          {state?.error && <p className="text-sm text-red-500">{state.error}</p>}
          {state?.success && <p className="text-sm text-green-600">Tersimpan!</p>}

          <div className="flex items-center gap-3 pt-1">
            <Button type="submit" disabled={pending}
              className="bg-[var(--color-primary)] !text-[var(--color-sidebar-text)] hover:bg-[var(--color-primary)] hover:opacity-90 rounded-none text-label-caps tracking-widest px-5 py-2 h-auto text-[10px]">
              {pending ? 'Menyimpan...' : 'Simpan'}
            </Button>
            <DeleteButton slug={slug} id={item.id} />
          </div>
        </form>
      )}
    </div>
  )
}

function DeleteButton({ slug, id }: { slug: string; id: string }) {
  const [, action, pending] = useActionState(async () => deleteTestimonial(slug, id), null)
  return (
    <form action={action}>
      <button type="submit" disabled={pending}
        className="text-label-caps text-[10px] text-red-400 hover:text-red-600 flex items-center gap-1.5 transition-colors">
        <Trash2 size={12} /> {pending ? 'Menghapus...' : 'Hapus'}
      </button>
    </form>
  )
}

function AddTestimonialForm({ slug }: { slug: string }) {
  const [open, setOpen] = useState(false)
  const [state, action, pending] = useActionState(
    async (_: unknown, formData: FormData) => {
      const result = await saveTestimonial(slug, formData)
      if (result.success) setOpen(false)
      return result
    },
    null
  )

  if (!open) return (
    <button type="button" onClick={() => setOpen(true)}
      className="flex items-center gap-2 text-label-caps text-[10px] text-gray-900 hover:opacity-70 transition-opacity pt-2">
      <Plus size={12} /> Tambah Testimonial
    </button>
  )

  return (
    <form action={action} encType="multipart/form-data" className="border border-black/8 rounded p-5 space-y-4 mt-4">
      <h4 className="text-headline-md italic">Testimonial Baru</h4>
      <div className="grid grid-cols-2 gap-4">
        <div><FieldLabel>Nama</FieldLabel><Input name="author_name" required placeholder="Nama pelanggan" className={inputCls} /></div>
        <div><FieldLabel>Jabatan / Keterangan</FieldLabel><Input name="author_title" placeholder="Pelanggan setia" className={inputCls} /></div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <FieldLabel>Kutipan</FieldLabel>
          <Textarea name="quote" rows={3} required placeholder="Pengalaman mereka menggunakan produk..." className={inputCls} />
        </div>
        <StarRatingInput defaultValue={5} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <PhotoUpload field="image_1" label="Foto 1" current={null} />
        <PhotoUpload field="image_2" label="Foto 2" current={null} />
      </div>
      {state?.error && <p className="text-sm text-red-500">{state.error}</p>}
      <div className="flex items-center gap-3">
        <Button type="submit" disabled={pending}
          className="bg-[var(--color-primary)] !text-[var(--color-sidebar-text)] hover:bg-[var(--color-primary)] hover:opacity-90 rounded-none text-label-caps tracking-widest px-5 py-2 h-auto text-[10px]">
          {pending ? 'Menyimpan...' : 'Tambah'}
        </Button>
        <button type="button" onClick={() => setOpen(false)}
          className="text-label-caps text-[10px] text-gray-500 hover:text-gray-700 transition-colors">
          Batal
        </button>
      </div>
    </form>
  )
}

export function TestimonialsForm({ slug, testimonials }: { slug: string; testimonials: Testimonial[] }) {
  return (
    <div className="mt-10 pt-10 border-t border-black/5">
      <div className="flex items-baseline justify-between mb-6">
        <div>
          <h2 className="text-headline-md italic">Testimonial</h2>
          <p className="text-body-md text-gray-500 mt-1">
            Tampil di halaman utama toko dengan 2 foto per testimonial.
          </p>
        </div>
        <span className="text-label-caps text-[10px] text-gray-400">{testimonials.length} testimoni</span>
      </div>

      <div className="bg-white border border-black/8 rounded px-6">
        {testimonials.length === 0 ? (
          <p className="py-10 text-center text-body-md text-gray-400">Belum ada testimonial.</p>
        ) : testimonials.map((t) => (
          <TestimonialRow key={t.id} slug={slug} item={t} />
        ))}
        <div className="py-4">
          <AddTestimonialForm slug={slug} />
        </div>
      </div>
    </div>
  )
}
