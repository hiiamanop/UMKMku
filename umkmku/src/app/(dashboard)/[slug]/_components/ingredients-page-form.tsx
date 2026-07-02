'use client'

import { useActionState, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Plus, Trash2 } from 'lucide-react'
import type { Tenant, IngredientItem, PageItem } from '@/lib/supabase/types'
import { updateIngredientsPage } from '../actions'
import { ImageUploader } from './image-uploader'
import { FormSection, FieldLabel, StatusMessage } from './form-section'

const DEFAULT_STEPS: PageItem[] = [
  { title: 'Wildcrafting Etis', body: 'Kami bermitra langsung dengan petani lokal yang mempraktikkan wildcrafting berkelanjutan, memastikan setiap bahan dipanen tanpa merusak ekosistem.' },
  { title: 'Ekstraksi Cold-Press', body: 'Metode ekstraksi suhu rendah kami mempertahankan senyawa bioaktif dan fitokimia yang hilang pada proses pengolahan panas konvensional.' },
  { title: 'Kemurnian Klinis', body: 'Setiap batch diuji secara independen oleh laboratorium terakreditasi untuk memastikan kemurnian, potensi, dan keamanan.' },
]

const DEFAULT_ITEMS: IngredientItem[] = [
  { name: 'Niacinamide', description: 'Mencerahkan kulit dan menyamarkan pori-pori besar secara efektif.' },
  { name: 'Hyaluronic Acid', description: 'Menghidrasi kulit secara mendalam hingga 72 jam.' },
  { name: 'Centella Asiatica', description: 'Menenangkan kulit sensitif dan mempercepat regenerasi sel.' },
]

const inputCls = "bg-white border-black/15 focus-visible:ring-[var(--color-primary)]/20 focus-visible:border-[var(--color-primary)]"

export function IngredientsPageForm({ tenant }: { tenant: Tenant }) {
  const [state, action, pending] = useActionState(
    async (_: unknown, formData: FormData) => updateIngredientsPage(tenant.slug, formData),
    null
  )

  const [items, setItems] = useState<IngredientItem[]>(
    tenant.page_ingredients_items?.length ? tenant.page_ingredients_items : DEFAULT_ITEMS
  )

  const steps = (tenant.page_process_steps?.length === 3) ? tenant.page_process_steps : DEFAULT_STEPS

  const addItem = () => setItems(prev => [...prev, { name: '', description: '' }])
  const removeItem = (i: number) => setItems(prev => prev.filter((_, idx) => idx !== i))

  return (
    <form action={action} encType="multipart/form-data" className="space-y-0">

      <FormSection title="Gambar & Teks Hero" description="Foto dan judul yang tampil di bagian atas halaman Ingredients.">
        <div className="mb-6">
          <ImageUploader name="page_ingredients_image" label="Gambar Hero"
            hint="1920×819px landscape." currentUrl={tenant.page_ingredients_image_url} aspectClass="w-48 h-28" />
        </div>
        <div>
          <FieldLabel hint="Judul besar di tengah foto hero. Default: 'Dirawat oleh Alam'">Judul Hero</FieldLabel>
          <Input name="ingredients_title" defaultValue={tenant.page_ingredients_title ?? ''}
            placeholder="Dirawat oleh Alam" className={inputCls} />
        </div>
      </FormSection>

      <FormSection title="Bahan Utama" description="Daftar bahan yang ditampilkan di section Bahan Utama. Jika kosong, otomatis diambil dari data produk.">
        <input type="hidden" name="ingredient_count" value={items.length} />
        <div className="space-y-3">
          {items.map((item, i) => (
            <div key={i} className="border border-black/8 rounded p-4 bg-white">
              <div className="grid grid-cols-[1fr_auto] gap-3 mb-3">
                <div>
                  <FieldLabel>Nama Bahan {i + 1}</FieldLabel>
                  <Input name={`ingredient_name_${i}`} defaultValue={item.name}
                    placeholder="Niacinamide" className={inputCls} />
                </div>
                <button type="button" onClick={() => removeItem(i)}
                  className="self-end pb-1 text-red-400 hover:text-red-600 transition-colors">
                  <Trash2 size={14} />
                </button>
              </div>
              <div>
                <FieldLabel>Deskripsi</FieldLabel>
                <Textarea name={`ingredient_desc_${i}`} defaultValue={item.description}
                  placeholder="Manfaat dan keunggulan bahan ini..." rows={2}
                  className={`text-sm ${inputCls}`} />
              </div>
            </div>
          ))}
        </div>
        <button type="button" onClick={addItem}
          className="flex items-center gap-2 mt-3 text-label-caps text-[10px] text-gray-900 hover:opacity-70 transition-opacity">
          <Plus size={12} /> Tambah Bahan
        </button>
      </FormSection>

      <FormSection title="3 Langkah Proses" description="Section 'Dari Benih ke Kulit' di bawah daftar bahan.">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {steps.map((item, i) => (
            <div key={i} className="border border-black/8 rounded p-4 space-y-3 bg-white">
              <div>
                <FieldLabel>Nama Langkah {i + 1}</FieldLabel>
                <Input name={`step_title_${i}`} defaultValue={item.title} className={inputCls} />
              </div>
              <div>
                <FieldLabel>Deskripsi</FieldLabel>
                <Textarea name={`step_body_${i}`} defaultValue={item.body} rows={3} className={`text-sm ${inputCls}`} />
              </div>
            </div>
          ))}
        </div>
      </FormSection>

      <div className="flex items-center gap-4 pt-2">
        <Button type="submit" disabled={pending}
          className="bg-[var(--color-primary)] !text-[var(--color-sidebar-text)] hover:bg-[var(--color-primary)] hover:opacity-90 transition-opacity rounded-none text-label-caps tracking-widest px-8 py-3 h-auto">
          {pending ? 'Menyimpan...' : 'Simpan Ingredients'}
        </Button>
        <StatusMessage state={state} />
      </div>
    </form>
  )
}
