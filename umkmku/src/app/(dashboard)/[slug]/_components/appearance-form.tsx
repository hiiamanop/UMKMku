'use client'

import { useActionState, useState } from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { Tenant } from '@/lib/supabase/types'
import { updateAppearance } from '../actions'

interface Props {
  tenant: Tenant
}

export function AppearanceForm({ tenant }: Props) {
  const [heroPreview, setHeroPreview] = useState<string | null>(null)
  const [state, action, pending] = useActionState(
    async (_: unknown, formData: FormData) => {
      return updateAppearance(tenant.slug, formData)
    },
    null
  )

  return (
    <div className="bg-white rounded-xl p-6 space-y-6">
      <h2 className="font-semibold text-lg">Tampilan & Warna</h2>

      <form action={action} encType="multipart/form-data" className="space-y-6">
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-1">
            <label className="text-sm font-medium">Warna Utama</label>
            <div className="flex gap-2 items-center">
              <input
                type="color"
                name="primary_color"
                defaultValue={tenant.primary_color ?? '#1a1a1a'}
                className="h-10 w-12 rounded cursor-pointer border"
              />
              <Input
                name="primary_color_text"
                defaultValue={tenant.primary_color ?? '#1a1a1a'}
                placeholder="#1a1a1a"
                className="font-mono text-sm"
                readOnly
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium">Warna Background</label>
            <div className="flex gap-2 items-center">
              <input
                type="color"
                name="secondary_color"
                defaultValue={tenant.secondary_color ?? '#f5f5f5'}
                className="h-10 w-12 rounded cursor-pointer border"
              />
              <Input
                name="secondary_color_text"
                defaultValue={tenant.secondary_color ?? '#f5f5f5'}
                placeholder="#f5f5f5"
                className="font-mono text-sm"
                readOnly
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium">Warna Aksen</label>
            <div className="flex gap-2 items-center">
              <input
                type="color"
                name="accent_color"
                defaultValue={tenant.accent_color ?? '#d4a574'}
                className="h-10 w-12 rounded cursor-pointer border"
              />
              <Input
                name="accent_color_text"
                defaultValue={tenant.accent_color ?? '#d4a574'}
                placeholder="#d4a574"
                className="font-mono text-sm"
                readOnly
              />
            </div>
          </div>
        </div>

        <div
          className="rounded-lg p-4 text-sm"
          style={{
            backgroundColor: tenant.secondary_color ?? '#f5f5f5',
            color: tenant.primary_color ?? '#1a1a1a',
            borderLeft: `4px solid ${tenant.accent_color ?? '#d4a574'}`,
          }}
        >
          Preview: Begini tampilan warna di toko kamu
        </div>

        {/* Hero image upload */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Gambar Hero (background halaman utama)</label>
          <div className="flex gap-4 items-start">
            <div className="w-40 h-24 rounded-lg overflow-hidden bg-gray-100 border shrink-0 relative">
              {(heroPreview ?? tenant.hero_image_url) ? (
                <Image
                  src={heroPreview ?? tenant.hero_image_url!}
                  alt="Hero preview"
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs text-center px-2">
                  Belum ada gambar
                </div>
              )}
            </div>
            <div className="flex-1 space-y-1">
              <input
                type="file"
                name="hero_image"
                accept="image/jpeg,image/png,image/webp"
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) setHeroPreview(URL.createObjectURL(file))
                }}
              />
              <p className="text-xs text-gray-400">JPG, PNG, WebP — maks 5MB. Rekomendasi: 1920×1080px</p>
            </div>
          </div>
        </div>

        {state?.error && <p className="text-red-600 text-sm">{state.error}</p>}
        {state?.success && <p className="text-green-600 text-sm">Perubahan disimpan!</p>}

        <Button type="submit" disabled={pending}>
          {pending ? 'Menyimpan...' : 'Simpan'}
        </Button>
      </form>
    </div>
  )
}
