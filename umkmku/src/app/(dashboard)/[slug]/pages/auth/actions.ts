'use server'

import { revalidatePath } from 'next/cache'
import { createServiceClient } from '@/lib/supabase/server'

export async function updateAuthPageImage(slug: string, formData: FormData) {
  const file = formData.get('auth_hero_image') as File | null
  if (!file || file.size === 0) return { error: 'Pilih file gambar terlebih dahulu' }

  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type))
    return { error: 'Format harus JPG, PNG, atau WebP' }
  if (file.size > 5 * 1024 * 1024)
    return { error: 'Ukuran maksimal 5MB' }

  const supabase = createServiceClient()
  const { data: tenant } = await supabase.from('tenants').select('id').eq('slug', slug).single()
  if (!tenant) return { error: 'Toko tidak ditemukan' }

  const ext = file.name.split('.').pop()
  const fileName = `${tenant.id}/auth-hero-${Date.now()}.${ext}`

  const { error: uploadErr } = await supabase.storage
    .from('product-images')
    .upload(fileName, file, { upsert: true })
  if (uploadErr) return { error: 'Gagal upload gambar' }

  const { data: urlData } = supabase.storage.from('product-images').getPublicUrl(fileName)

  const { error } = await supabase.from('tenants')
    .update({ auth_hero_image_url: urlData.publicUrl })
    .eq('slug', slug)
  if (error) return { error: 'Gagal menyimpan perubahan' }

  revalidatePath(`/store/${slug}/login`)
  revalidatePath(`/store/${slug}/register`)
  revalidatePath(`/${slug}/pages/auth`)
  return { success: true }
}
