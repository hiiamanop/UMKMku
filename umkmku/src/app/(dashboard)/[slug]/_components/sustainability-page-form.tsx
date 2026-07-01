'use client'

import { useActionState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import type { Tenant, PageItem, PageStat } from '@/lib/supabase/types'
import { updateSustainabilityPage } from '../actions'
import { ImageUploader } from './image-uploader'
import { FormSection, FieldLabel, StatusMessage } from './form-section'

const DEFAULT_INITIATIVES: PageItem[] = [
  { title: 'Bahan Bersumber Etis', body: 'Kami bermitra eksklusif dengan petani kecil bersertifikat yang menjaga keanekaragaman hayati. Setiap pembelian langsung mendukung mata pencaharian mereka.' },
  { title: 'Kemasan Nol Limbah', body: 'Kemasan kami 100% dapat didaur ulang atau terurai secara hayati. Kami menghilangkan plastik sekali pakai dari seluruh rantai pasokan kami.' },
  { title: 'Karbon Netral', body: 'Operasi kami 100% ditenagai energi terbarukan dan kami mengimbangi jejak karbon yang tersisa melalui program reforestasi terverifikasi di Indonesia.' },
]

const DEFAULT_STATS: PageStat[] = [
  { value: '100%', label: 'Bahan alami terverifikasi' },
  { value: '0%', label: 'Plastik sekali pakai' },
  { value: '50+', label: 'Mitra petani lokal' },
  { value: '2x', label: 'Dikembalikan ke alam dari setiap penjualan' },
]

const inputCls = "bg-white border-black/15 focus-visible:ring-[var(--color-primary)]/20 focus-visible:border-[var(--color-primary)]"

export function SustainabilityPageForm({ tenant }: { tenant: Tenant }) {
  const [state, action, pending] = useActionState(
    async (_: unknown, formData: FormData) => updateSustainabilityPage(tenant.slug, formData),
    null
  )

  const initiatives = (tenant.page_sustainability?.length === 3) ? tenant.page_sustainability : DEFAULT_INITIATIVES
  const stats = (tenant.page_stats?.length === 4) ? tenant.page_stats : DEFAULT_STATS

  return (
    <form action={action} encType="multipart/form-data" className="space-y-0">

      <FormSection title="Gambar Hero" description="Foto yang tampil di bagian atas halaman Keberlanjutan.">
        <ImageUploader name="page_sustainability_image" label="Gambar Hero"
          hint="1920×819px landscape." currentUrl={tenant.page_sustainability_image_url} aspectClass="w-48 h-28" />
      </FormSection>

      <FormSection title="3 Inisiatif Keberlanjutan" description="Ditampilkan sebagai 3 kotak di section utama.">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {initiatives.map((item, i) => (
            <div key={i} className="border border-black/8 rounded p-4 space-y-3 bg-white">
              <div>
                <FieldLabel>Nama Inisiatif {i + 1}</FieldLabel>
                <Input name={`initiative_title_${i}`} defaultValue={item.title} className={inputCls} />
              </div>
              <div>
                <FieldLabel>Deskripsi</FieldLabel>
                <Textarea name={`initiative_body_${i}`} defaultValue={item.body} rows={3} className={`text-sm ${inputCls}`} />
              </div>
            </div>
          ))}
        </div>
      </FormSection>

      <FormSection title="Section 'Setiap Pilihan Membuat Perbedaan'" description="Gambar, judul, dan teks di section tengah halaman.">
        <div className="space-y-4">
          <ImageUploader name="page_sustainability_story_image" label="Gambar Section"
            hint="Portrait atau square, tampil di sisi kiri." currentUrl={tenant.page_sustainability_story_image_url} aspectClass="w-48 h-28" />
          <div>
            <FieldLabel hint="Default: 'Setiap pilihan membuat perbedaan'">Judul</FieldLabel>
            <Input name="story_title" defaultValue={tenant.page_sustainability_story_title ?? ''}
              placeholder="Setiap pilihan membuat perbedaan" className={inputCls} />
          </div>
          <div>
            <FieldLabel hint="Paragraf di bawah judul.">Teks Penjelasan</FieldLabel>
            <Textarea name="story_body" defaultValue={tenant.page_sustainability_story_body ?? ''}
              placeholder="Keberlanjutan bukan sekadar kata-kata bagi kami, ini adalah inti dari setiap keputusan yang kami buat..."
              className={`min-h-[120px] ${inputCls}`} />
          </div>
        </div>
      </FormSection>

      <FormSection title="4 Statistik" description="Angka-angka yang tampil di section statistik.">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map((s, i) => (
            <div key={i} className="border border-black/8 rounded p-4 space-y-3 bg-white">
              <div>
                <FieldLabel>Angka {i + 1}</FieldLabel>
                <Input name={`stat_value_${i}`} defaultValue={s.value} placeholder="100%" className={inputCls} />
              </div>
              <div>
                <FieldLabel>Keterangan</FieldLabel>
                <Input name={`stat_label_${i}`} defaultValue={s.label} placeholder="Bahan alami..." className={inputCls} />
              </div>
            </div>
          ))}
        </div>
      </FormSection>

      <div className="flex items-center gap-4 pt-2">
        <Button type="submit" disabled={pending}
          className="bg-[var(--color-primary)] !text-white hover:bg-[var(--color-primary)] hover:opacity-90 transition-opacity rounded-none text-label-caps tracking-widest px-8 py-3 h-auto">
          {pending ? 'Menyimpan...' : 'Simpan Keberlanjutan'}
        </Button>
        <StatusMessage state={state} />
      </div>
    </form>
  )
}
