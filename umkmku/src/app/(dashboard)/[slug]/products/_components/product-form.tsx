'use client'

import { useActionState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import type { Product } from '@/lib/supabase/types'
import { upsertProduct } from '../actions'
import { FieldLabel, StatusMessage } from '../../_components/form-section'

const SKIN_TYPES = [
  { value: 'oily', label: 'Berminyak' },
  { value: 'combination', label: 'Kombinasi' },
  { value: 'dry', label: 'Kering' },
  { value: 'sensitive', label: 'Sensitif' },
  { value: 'all', label: 'Semua Jenis' },
]

const CONCERNS = [
  { value: 'acne', label: 'Anti Jerawat' },
  { value: 'brightening', label: 'Mencerahkan' },
  { value: 'anti-aging', label: 'Anti Aging' },
  { value: 'hydrating', label: 'Melembapkan' },
  { value: 'pores', label: 'Mengecilkan Pori' },
  { value: 'soothing', label: 'Menenangkan' },
  { value: 'firming', label: 'Mengencangkan' },
]

const USAGE_STEPS = ['cleanser', 'toner', 'serum', 'moisturizer', 'sunscreen', 'treatment', 'mask']

const inputCls = "bg-white border-black/15 focus-visible:ring-[var(--color-primary)]/20 focus-visible:border-[var(--color-primary)]"
const checkboxCls = "accent-[var(--color-primary)] w-3.5 h-3.5"

interface Props {
  slug: string
  product?: Product
  onSuccess?: () => void
}

export function ProductForm({ slug, product, onSuccess }: Props) {
  const action = upsertProduct.bind(null, slug, product?.id ?? null)
  const [state, formAction, pending] = useActionState(
    async (_: unknown, formData: FormData) => {
      const result = await action(formData)
      if (result.success && onSuccess) onSuccess()
      return result
    },
    null
  )

  return (
    <form action={formAction} className="space-y-5">
      <div className="grid grid-cols-2 gap-5">
        <div className="col-span-2">
          <FieldLabel>Nama Produk *</FieldLabel>
          <Input name="name" defaultValue={product?.name} required className={inputCls} />
        </div>

        <div className="col-span-2">
          <FieldLabel>Deskripsi</FieldLabel>
          <Textarea name="description" defaultValue={product?.description ?? ''}
            className={`min-h-[80px] ${inputCls}`} />
        </div>

        <div className="col-span-2">
          <FieldLabel hint="Tampil di halaman detail produk bagian 'Cara Penggunaan'">Cara Penggunaan</FieldLabel>
          <Textarea name="how_to_use" defaultValue={product?.how_to_use ?? ''}
            className={`min-h-[100px] ${inputCls}`}
            placeholder="Contoh: Oleskan secukupnya pada wajah yang sudah bersih. Gunakan pagi dan malam hari." />
        </div>

        <div>
          <FieldLabel>Harga (IDR)</FieldLabel>
          <Input name="price" type="number" defaultValue={product?.price ?? ''}
            placeholder="150000" className={inputCls} />
        </div>

        <div>
          <FieldLabel hint="Kosongkan jika stok tidak terbatas">Jumlah Stok</FieldLabel>
          <Input name="stock_quantity" type="number" min="0"
            defaultValue={product?.stock_quantity ?? ''}
            placeholder="Kosong = tidak terbatas" className={inputCls} />
        </div>

        <div className="col-span-2 flex items-center gap-3">
          <input type="checkbox" name="is_preorder" value="true" id="is_preorder"
            defaultChecked={product?.is_preorder ?? false} className={checkboxCls} />
          <label htmlFor="is_preorder" className="text-xs cursor-pointer">
            Pre-Order, bisa dipesan meski stok 0
          </label>
        </div>

        <div>
          <FieldLabel hint="Upload baru untuk mengganti foto saat ini">Foto Produk</FieldLabel>
          <input name="image" type="file" accept="image/jpeg,image/png,image/webp"
            className="block w-full text-xs text-gray-600 file:mr-3 file:py-2 file:px-3 file:border file:border-black/15 file:text-xs file:bg-white file:text-gray-700 hover:file:bg-gray-50 file:cursor-pointer file:transition-colors" />
        </div>
      </div>

      <div>
        <FieldLabel>Step Penggunaan</FieldLabel>
        <select name="usage_step" defaultValue={product?.usage_step ?? ''}
          className="w-full border border-black/15 rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:border-[var(--color-primary)]">
          <option value="">-- Pilih step --</option>
          {USAGE_STEPS.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <div>
        <FieldLabel>Cocok untuk Jenis Kulit</FieldLabel>
        <div className="flex flex-wrap gap-x-5 gap-y-2 mt-1">
          {SKIN_TYPES.map(({ value, label }) => (
            <label key={value} className="flex items-center gap-2 text-xs cursor-pointer">
              <input type="checkbox" name="skin_types" value={value}
                defaultChecked={product?.skin_types.includes(value)} className={checkboxCls} />
              {label}
            </label>
          ))}
        </div>
      </div>

      <div>
        <FieldLabel>Manfaat / Concern</FieldLabel>
        <div className="flex flex-wrap gap-x-5 gap-y-2 mt-1">
          {CONCERNS.map(({ value, label }) => (
            <label key={value} className="flex items-center gap-2 text-xs cursor-pointer">
              <input type="checkbox" name="concerns" value={value}
                defaultChecked={product?.concerns.includes(value)} className={checkboxCls} />
              {label}
            </label>
          ))}
        </div>
      </div>

      <div>
        <FieldLabel hint="Pisahkan dengan koma, contoh: niacinamide, vitamin-c, ceramide">Bahan Utama</FieldLabel>
        <Input name="ingredients" defaultValue={product?.ingredients.join(', ') ?? ''}
          placeholder="niacinamide, vitamin-c, ceramide" className={inputCls} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <FieldLabel>Link Tokopedia</FieldLabel>
          <Input name="tokopedia_url" defaultValue={product?.tokopedia_url ?? ''}
            placeholder="https://tokopedia.com/..." className={inputCls} />
        </div>
        <div>
          <FieldLabel>Link Shopee</FieldLabel>
          <Input name="shopee_url" defaultValue={product?.shopee_url ?? ''}
            placeholder="https://shopee.co.id/..." className={inputCls} />
        </div>
      </div>

      <div className="flex items-center gap-4 pt-1">
        <Button type="submit" disabled={pending}
          className="bg-[var(--color-primary)] !text-[var(--color-sidebar-text)] hover:bg-[var(--color-primary)] hover:opacity-90 transition-opacity rounded-none text-label-caps tracking-widest px-6 py-2.5 h-auto text-[10px]">
          {pending ? 'Menyimpan...' : product ? 'Update Produk' : 'Tambah Produk'}
        </Button>
        <StatusMessage state={state} />
      </div>
    </form>
  )
}
