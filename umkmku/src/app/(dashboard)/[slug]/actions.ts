'use server'

import { revalidatePath } from 'next/cache'
import { createServiceClient } from '@/lib/supabase/server'

export async function updateBrand(slug: string, formData: FormData) {
  const brand_name = formData.get('brand_name')?.toString().trim()
  const tagline = formData.get('tagline')?.toString().trim() || null
  const description = formData.get('description')?.toString().trim() || null
  const whatsapp_number = formData.get('whatsapp_number')?.toString().trim() || null
  const instagram_url = formData.get('instagram_url')?.toString().trim() || null
  const tokopedia_url = formData.get('tokopedia_url')?.toString().trim() || null
  const shopee_url = formData.get('shopee_url')?.toString().trim() || null

  if (!brand_name || brand_name.length < 2) {
    return { error: 'Nama brand minimal 2 karakter' }
  }

  const supabase = createServiceClient()

  const { error } = await supabase
    .from('tenants')
    .update({
      brand_name,
      tagline,
      description,
      whatsapp_number,
      instagram_url,
      tokopedia_url,
      shopee_url,
    })
    .eq('slug', slug)

  if (error) return { error: 'Gagal menyimpan perubahan' }

  revalidatePath(`/store/${slug}`)
  revalidatePath(`/${slug}`)
  return { success: true }
}

export async function updateAppearance(slug: string, formData: FormData) {
  const primary_color = formData.get('primary_color')?.toString()
  const secondary_color = formData.get('secondary_color')?.toString()
  const accent_color = formData.get('accent_color')?.toString()

  const hexPattern = /^#[0-9a-fA-F]{6}$/
  if (!hexPattern.test(primary_color ?? '') ||
      !hexPattern.test(secondary_color ?? '') ||
      !hexPattern.test(accent_color ?? '')) {
    return { error: 'Format warna tidak valid' }
  }

  const supabase = createServiceClient()

  // Get tenant id for storage path
  const { data: tenant } = await supabase
    .from('tenants')
    .select('id')
    .eq('slug', slug)
    .single()

  if (!tenant) return { error: 'Toko tidak ditemukan' }

  const updates: Record<string, string> = { primary_color: primary_color!, secondary_color: secondary_color!, accent_color: accent_color! }

  // Handle hero image upload
  const heroFile = formData.get('hero_image') as File | null
  if (heroFile && heroFile.size > 0) {
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(heroFile.type)) {
      return { error: 'Format gambar harus JPG, PNG, atau WebP' }
    }
    if (heroFile.size > 5 * 1024 * 1024) return { error: 'Ukuran gambar maksimal 5MB' }

    const ext = heroFile.name.split('.').pop()
    const fileName = `${tenant.id}/hero.${ext}`

    const { error: uploadError } = await supabase.storage
      .from('product-images')
      .upload(fileName, heroFile, { upsert: true })

    if (uploadError) return { error: 'Gagal upload gambar hero' }

    const { data: urlData } = supabase.storage.from('product-images').getPublicUrl(fileName)
    updates.hero_image_url = urlData.publicUrl
  }

  const { error } = await supabase.from('tenants').update(updates).eq('slug', slug)

  if (error) return { error: 'Gagal menyimpan perubahan' }

  revalidatePath(`/store/${slug}`)
  revalidatePath(`/${slug}`)
  return { success: true }
}

export async function updateChatbot(slug: string, formData: FormData) {
  const chatbot_name = formData.get('chatbot_name')?.toString().trim()
  const chatbot_persona = formData.get('chatbot_persona')?.toString().trim() || null

  if (!chatbot_name || chatbot_name.length < 2) {
    return { error: 'Nama chatbot minimal 2 karakter' }
  }

  const supabase = createServiceClient()

  const { error } = await supabase
    .from('tenants')
    .update({ chatbot_name, chatbot_persona })
    .eq('slug', slug)

  if (error) return { error: 'Gagal menyimpan pengaturan chatbot' }

  revalidatePath(`/store/${slug}`)
  revalidatePath(`/${slug}`)
  return { success: true }
}
