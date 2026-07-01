'use client'

import { useActionState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { Tenant } from '@/lib/supabase/types'
import { updateAppearance } from '../actions'
import { ImageUploader } from './image-uploader'
import { FormSection, FieldLabel, StatusMessage } from './form-section'

export function AppearanceForm({ tenant }: { tenant: Tenant }) {
  const [state, action, pending] = useActionState(
    async (_: unknown, formData: FormData) => updateAppearance(tenant.slug, formData),
    null
  )

  return (
    <form action={action} className="space-y-0">

      <FormSection title="Warna Brand" description="Warna-warna ini akan diterapkan ke seluruh toko kamu.">
        <div className="grid grid-cols-3 gap-5 mb-5">
          {[
            { name: 'primary_color', label: 'Warna Utama', hint: 'Tombol, teks judul, aksen utama', val: tenant.primary_color ?? '#1a1a1a' },
            { name: 'secondary_color', label: 'Warna Background', hint: 'Background section, card produk', val: tenant.secondary_color ?? '#f5f5f5' },
            { name: 'accent_color', label: 'Warna Aksen', hint: 'Detail, badge, elemen dekoratif', val: tenant.accent_color ?? '#d4a574' },
          ].map((c) => (
            <div key={c.name}>
              <FieldLabel hint={c.hint}>{c.label}</FieldLabel>
              <div className="flex items-center gap-3 bg-white border border-black/15 rounded-md px-3 py-2">
                <input type="color" name={c.name} defaultValue={c.val}
                  className="h-7 w-8 rounded cursor-pointer border-0 bg-transparent p-0" />
                <Input name={`${c.name}_text`} defaultValue={c.val}
                  className="border-0 p-0 h-auto font-mono text-sm shadow-none focus-visible:ring-0" readOnly />
              </div>
            </div>
          ))}
        </div>

        {/* Preview */}
        <div className="rounded p-4 text-sm border" style={{
          backgroundColor: tenant.secondary_color ?? '#f5f5f5',
          color: tenant.primary_color ?? '#1a1a1a',
          borderLeft: `3px solid ${tenant.accent_color ?? '#d4a574'}`,
        }}>
          Preview: Begini kombinasi warna di toko kamu
        </div>
      </FormSection>

      <FormSection title="Gambar Halaman Utama" description="Gambar-gambar di landing page toko kamu.">
        <div className="grid grid-cols-1 gap-7">
          <ImageUploader
            name="hero_image" label="Hero, Foto utama kiri halaman"
            hint="Rekomendasi: 1920×1080px landscape. Maks 5MB."
            currentUrl={tenant.hero_image_url} aspectClass="w-48 h-28"
          />
          <div className="grid grid-cols-2 gap-6">
            <ImageUploader
              name="about_image_1" label="About, Foto kiri"
              hint="Portrait 3:4. Maks 5MB."
              currentUrl={tenant.about_image_1_url} aspectClass="w-24 h-32"
            />
            <ImageUploader
              name="about_image_2" label="About, Foto kanan"
              hint="Portrait 3:4. Maks 5MB."
              currentUrl={tenant.about_image_2_url} aspectClass="w-24 h-32"
            />
          </div>
          <ImageUploader
            name="cta_image" label="CTA Banner, Background banner 'Temukan Koleksi Kami'"
            hint="Rekomendasi: 1920×500px landscape. Maks 5MB."
            currentUrl={tenant.cta_image_url} aspectClass="w-48 h-20"
          />
          <ImageUploader
            name="footer_image" label="Footer, Foto tengah footer"
            hint="Rekomendasi: portrait atau square. Maks 5MB."
            currentUrl={tenant.footer_image_url} aspectClass="w-48 h-28"
          />
        </div>
      </FormSection>

      <div className="flex items-center gap-4 pt-2">
        <button type="submit" disabled={pending}
          style={{ backgroundColor: 'var(--color-primary)', color: 'white' }}
          className="hover:opacity-90 transition-opacity rounded-none text-label-caps tracking-widest px-8 py-3 disabled:opacity-50 disabled:cursor-not-allowed">
          {pending ? 'Menyimpan...' : 'Simpan Tampilan'}
        </button>
        <StatusMessage state={state} />
      </div>
    </form>
  )
}
