'use client'

import { useActionState } from 'react'
import { Button } from '@/components/ui/button'
import type { Tenant } from '@/lib/supabase/types'
import { updateAuthPageImage } from './actions'
import { ImageUploader } from '../../_components/image-uploader'
import { FormSection, StatusMessage } from '../../_components/form-section'

export function AuthPageForm({ tenant }: { tenant: Tenant }) {
  const [state, action, pending] = useActionState(
    async (_: unknown, formData: FormData) => updateAuthPageImage(tenant.slug, formData),
    null
  )

  return (
    <form action={action} encType="multipart/form-data" className="space-y-0">
      <FormSection
        title="Foto Panel Kiri"
        description="Foto ini tampil di sisi kiri halaman login dan register. Cocok untuk foto produk, model, atau visual brand kamu."
      >
        <div className="max-w-xs">
          <ImageUploader
            name="auth_hero_image"
            label="Auth Hero Image"
            hint="Rekomendasi: portrait (2:3), minimal 800×1200px. Format JPG, PNG, atau WebP. Maks 5MB."
            currentUrl={tenant.auth_hero_image_url}
            aspectClass="w-48 h-64"
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
