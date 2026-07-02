'use client'

import { useActionState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import type { Tenant, PageItem } from '@/lib/supabase/types'
import { updateAboutPage } from '../actions'
import { ImageUploader } from './image-uploader'
import { FormSection, FieldLabel, StatusMessage } from './form-section'

const DEFAULT_COMMITMENTS: PageItem[] = [
  { title: 'Kemurnian', body: 'Hanya bahan-bahan terpilih yang melewati seleksi ketat kami untuk memastikan setiap produk aman, efektif, dan bebas dari bahan berbahaya.' },
  { title: 'Transparansi', body: 'Kami terbuka tentang setiap bahan, sumber, dan proses pembuatan. Tidak ada bahan tersembunyi, tidak ada klaim palsu.' },
  { title: 'Keberlanjutan', body: 'Dari bahan baku hingga kemasan, kami berkomitmen pada praktik ramah lingkungan yang melindungi bumi untuk generasi mendatang.' },
  { title: 'Efektivitas', body: 'Setiap formula dirancang berdasarkan penelitian ilmiah untuk memberikan hasil nyata yang bisa Anda rasakan sejak pemakaian pertama.' },
]

const inputCls = "bg-white border-black/15 focus-visible:ring-[var(--color-primary)]/20 focus-visible:border-[var(--color-primary)]"

export function AboutPageForm({ tenant }: { tenant: Tenant }) {
  const [state, action, pending] = useActionState(
    async (_: unknown, formData: FormData) => updateAboutPage(tenant.slug, formData),
    null
  )

  const commitments = (tenant.page_commitments?.length === 4) ? tenant.page_commitments : DEFAULT_COMMITMENTS

  return (
    <form action={action} encType="multipart/form-data" className="space-y-0">

      <FormSection title="Gambar" description="Foto-foto yang tampil di halaman Tentang Kami.">
        <div className="grid grid-cols-2 gap-6">
          <ImageUploader name="page_about_image" label="Gambar Hero"
            hint="1920×870px landscape." currentUrl={tenant.page_about_image_url} aspectClass="w-48 h-28" />
          <ImageUploader name="page_about_story_image" label="Gambar Kisah Kami"
            hint="Portrait 3:4." currentUrl={tenant.page_about_story_image_url} aspectClass="w-48 h-28" />
        </div>
      </FormSection>

      <FormSection title="4 Komitmen Brand" description="Ditampilkan sebagai grid 4 kotak di bawah hero.">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {commitments.map((item, i) => (
            <div key={i} className="border border-black/8 rounded p-4 space-y-3 bg-white">
              <div>
                <FieldLabel>Nama Komitmen {i + 1}</FieldLabel>
                <Input name={`commitment_title_${i}`} defaultValue={item.title} className={inputCls} />
              </div>
              <div>
                <FieldLabel>Deskripsi</FieldLabel>
                <Textarea name={`commitment_body_${i}`} defaultValue={item.body} className={`min-h-[80px] text-sm ${inputCls}`} />
              </div>
            </div>
          ))}
        </div>
      </FormSection>

      <FormSection title="Kisah Brand" description="Teks yang tampil di section Kisah Kami.">
        <FieldLabel hint="Jika kosong, pakai deskripsi brand.">Teks Kisah</FieldLabel>
        <Textarea name="about_story" defaultValue={tenant.page_about_story ?? ''}
          placeholder={tenant.description ?? 'Ceritakan kisah brand kamu...'}
          className={`min-h-[120px] ${inputCls}`} />
      </FormSection>

      <div className="flex items-center gap-4 pt-2">
        <Button type="submit" disabled={pending}
          className="bg-[var(--color-primary)] !text-[var(--color-sidebar-text)] hover:bg-[var(--color-primary)] hover:opacity-90 transition-opacity rounded-none text-label-caps tracking-widest px-8 py-3 h-auto">
          {pending ? 'Menyimpan...' : 'Simpan Tentang Kami'}
        </Button>
        <StatusMessage state={state} />
      </div>
    </form>
  )
}
