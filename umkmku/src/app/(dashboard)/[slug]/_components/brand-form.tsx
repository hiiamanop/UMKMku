'use client'

import { useActionState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import type { Tenant } from '@/lib/supabase/types'
import { updateBrand } from '../actions'
import { FormSection, FieldLabel, StatusMessage } from './form-section'
import { ImageUploader } from './image-uploader'

export function BrandForm({ tenant }: { tenant: Tenant }) {
  const [state, action, pending] = useActionState(
    async (_: unknown, formData: FormData) => updateBrand(tenant.slug, formData),
    null
  )

  return (
    <form action={action} className="space-y-0">
      <FormSection title="Identitas Brand">
        <div className="grid grid-cols-1 gap-5">
          <div>
            <FieldLabel>Nama Brand *</FieldLabel>
            <Input name="brand_name" defaultValue={tenant.brand_name} required
              className="bg-white border-black/15 focus-visible:ring-[var(--color-primary)]/20 focus-visible:border-[var(--color-primary)]" />
          </div>
          <div>
            <FieldLabel hint="Tampil sebagai headline di hero halaman toko">Tagline</FieldLabel>
            <Input name="tagline" defaultValue={tenant.tagline ?? ''}
              placeholder="Natural beauty, timeless glow"
              className="bg-white border-black/15 focus-visible:ring-[var(--color-primary)]/20 focus-visible:border-[var(--color-primary)]" />
          </div>
          <div>
            <FieldLabel hint="Muncul di section About dan footer toko">Deskripsi Brand</FieldLabel>
            <Textarea name="description" defaultValue={tenant.description ?? ''}
              placeholder="Ceritakan kisah dan nilai brand kamu..."
              className="min-h-[120px] bg-white border-black/15 focus-visible:ring-[var(--color-primary)]/20 focus-visible:border-[var(--color-primary)]" />
          </div>
        </div>
      </FormSection>

      <FormSection title="Kontak & Marketplace">
        <div className="grid grid-cols-2 gap-5">
          <div>
            <FieldLabel hint="Digunakan untuk tombol WhatsApp di toko">Nomor WhatsApp</FieldLabel>
            <Input name="whatsapp_number" defaultValue={tenant.whatsapp_number ?? ''}
              placeholder="628xxxxxxxxx"
              className="bg-white border-black/15 focus-visible:ring-[var(--color-primary)]/20 focus-visible:border-[var(--color-primary)]" />
          </div>
          <div>
            <FieldLabel>Instagram URL</FieldLabel>
            <Input name="instagram_url" defaultValue={tenant.instagram_url ?? ''}
              placeholder="https://instagram.com/brandkamu"
              className="bg-white border-black/15 focus-visible:ring-[var(--color-primary)]/20 focus-visible:border-[var(--color-primary)]" />
          </div>
          <div>
            <FieldLabel hint="URL halaman toko kamu di Tokopedia">Tokopedia Store</FieldLabel>
            <Input name="tokopedia_url" defaultValue={tenant.tokopedia_url ?? ''}
              placeholder="https://tokopedia.com/brandkamu"
              className="bg-white border-black/15 focus-visible:ring-[var(--color-primary)]/20 focus-visible:border-[var(--color-primary)]" />
          </div>
          <div>
            <FieldLabel hint="URL halaman toko kamu di Shopee">Shopee Store</FieldLabel>
            <Input name="shopee_url" defaultValue={tenant.shopee_url ?? ''}
              placeholder="https://shopee.co.id/brandkamu"
              className="bg-white border-black/15 focus-visible:ring-[var(--color-primary)]/20 focus-visible:border-[var(--color-primary)]" />
          </div>
        </div>
      </FormSection>

      <FormSection title="Pembayaran">
        <div className="max-w-xs">
          <ImageUploader
            name="qris_image"
            label="QRIS Statis"
            hint="Upload gambar QRIS statis brandmu. Akan ditampilkan otomatis di chat pembayaran setelah customer membuat pesanan."
            currentUrl={tenant.qris_image_url}
            aspectClass="aspect-square"
          />
        </div>
      </FormSection>

      <div className="flex items-center gap-4 pt-2">
        <Button type="submit" disabled={pending}
          className="bg-[var(--color-primary)] !text-white hover:bg-[var(--color-primary)] hover:opacity-90 transition-opacity rounded-none text-label-caps tracking-widest px-8 py-3 h-auto">
          {pending ? 'Menyimpan...' : 'Simpan Perubahan'}
        </Button>
        <StatusMessage state={state} />
      </div>
    </form>
  )
}
