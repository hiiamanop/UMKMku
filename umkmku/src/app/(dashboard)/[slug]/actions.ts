'use server'

import { revalidatePath } from 'next/cache'

function invalidateTenant(slug: string) {
  revalidatePath(`/store/${slug}`, 'page')
  revalidatePath(`/${slug}`, 'page')
}
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

  const updates: Record<string, string | null> = {
    brand_name: brand_name!,
    tagline,
    description,
    whatsapp_number,
    instagram_url,
    tokopedia_url,
    shopee_url,
  }

  // QRIS upload
  const qrisFile = formData.get('qris_image') as File | null
  if (qrisFile && qrisFile.size > 0) {
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(qrisFile.type))
      return { error: 'Format QRIS harus JPG, PNG, atau WebP' }
    if (qrisFile.size > 2 * 1024 * 1024)
      return { error: 'Ukuran QRIS maksimal 2MB' }

    const { data: tenant } = await supabase.from('tenants').select('id').eq('slug', slug).single()
    if (!tenant) return { error: 'Toko tidak ditemukan' }

    const ext = qrisFile.name.split('.').pop()
    const fileName = `${tenant.id}/qris-${Date.now()}.${ext}`
    const { error: uploadErr } = await supabase.storage.from('product-images').upload(fileName, qrisFile, { upsert: true })
    if (uploadErr) return { error: 'Gagal upload gambar QRIS' }
    const { data: urlData } = supabase.storage.from('product-images').getPublicUrl(fileName)
    updates.qris_image_url = urlData.publicUrl
  }

  const { error } = await supabase.from('tenants').update(updates).eq('slug', slug)

  if (error) return { error: 'Gagal menyimpan perubahan' }

  invalidateTenant(slug)
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

  const tenantId = tenant.id
  const updates: Record<string, string> = { primary_color: primary_color!, secondary_color: secondary_color!, accent_color: accent_color! }

  // Upload helper
  async function uploadImage(field: string, key: string): Promise<string | null | { error: string }> {
    const file = formData.get(field) as File | null
    if (!file || file.size === 0) return null
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type))
      return { error: `Format gambar ${field} harus JPG, PNG, atau WebP` }
    if (file.size > 5 * 1024 * 1024)
      return { error: `Ukuran gambar ${field} maksimal 5MB` }
    const ext = file.name.split('.').pop()
    const fileName = `${tenantId}/${key}-${Date.now()}.${ext}`
    const { error: uploadError } = await supabase.storage
      .from('product-images')
      .upload(fileName, file)
    if (uploadError) return { error: `Gagal upload gambar ${field}` }
    const { data: urlData } = supabase.storage.from('product-images').getPublicUrl(fileName)
    return urlData.publicUrl
  }

  const imageFields = [
    { field: 'hero_image',       key: 'hero',          col: 'hero_image_url' },
    { field: 'about_image_1',    key: 'about-1',       col: 'about_image_1_url' },
    { field: 'about_image_2',    key: 'about-2',       col: 'about_image_2_url' },
    { field: 'cta_image',        key: 'cta',           col: 'cta_image_url' },
    { field: 'footer_image',     key: 'footer',        col: 'footer_image_url' },
  ]

  for (const { field, key, col } of imageFields) {
    const result = await uploadImage(field, key)
    if (result && typeof result === 'object' && 'error' in result) return result
    if (typeof result === 'string') updates[col] = result
  }

  const { error } = await supabase.from('tenants').update(updates).eq('slug', slug)

  if (error) return { error: 'Gagal menyimpan perubahan' }

  invalidateTenant(slug)
  return { success: true }
}

// --- Testimonials ---

export async function saveTestimonial(slug: string, formData: FormData) {
  const id = formData.get('id')?.toString() || null
  const author_name = formData.get('author_name')?.toString().trim()
  const author_title = formData.get('author_title')?.toString().trim() || null
  const quote = formData.get('quote')?.toString().trim()
  const rating = Math.min(5, Math.max(1, parseInt(formData.get('rating')?.toString() ?? '5', 10)))

  if (!author_name || !quote) return { error: 'Nama dan kutipan wajib diisi' }

  const supabase = createServiceClient()
  const { data: tenant } = await supabase.from('tenants').select('id').eq('slug', slug).single()
  if (!tenant) return { error: 'Toko tidak ditemukan' }

  const payload: Record<string, unknown> = { author_name, author_title, quote, rating, tenant_id: tenant.id }

  for (const [field, key] of [['image_1', 'testimonial-img1'], ['image_2', 'testimonial-img2']] as const) {
    const file = formData.get(field) as File | null
    if (file && file.size > 0) {
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type))
        return { error: 'Format gambar harus JPG, PNG, atau WebP' }
      const ext = file.name.split('.').pop()
      const fileName = `${tenant.id}/${key}-${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(fileName, file, { upsert: true })
      if (uploadError) return { error: 'Gagal upload gambar testimonial' }
      const { data: urlData } = supabase.storage.from('product-images').getPublicUrl(fileName)
      payload[`${field}_url`] = urlData.publicUrl
    }
  }

  if (id) {
    const { error } = await supabase.from('testimonials').update(payload).eq('id', id).eq('tenant_id', tenant.id)
    if (error) return { error: 'Gagal menyimpan testimonial' }
  } else {
    const { error } = await supabase.from('testimonials').insert(payload)
    if (error) return { error: 'Gagal menambah testimonial' }
  }

  invalidateTenant(slug)
  return { success: true }
}

export async function deleteTestimonial(slug: string, id: string) {
  const supabase = createServiceClient()
  const { data: tenant } = await supabase.from('tenants').select('id').eq('slug', slug).single()
  if (!tenant) return { error: 'Toko tidak ditemukan' }
  const { error } = await supabase.from('testimonials').delete().eq('id', id).eq('tenant_id', tenant.id)
  if (error) return { error: 'Gagal menghapus testimonial' }
  invalidateTenant(slug)
  return { success: true }
}

async function uploadPageImage(
  supabase: ReturnType<typeof createServiceClient>,
  formData: FormData,
  field: string,
  key: string,
  tenantId: string,
): Promise<string | null | { error: string }> {
  const file = formData.get(field) as File | null
  if (!file || file.size === 0) return null
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type))
    return { error: `Format gambar harus JPG, PNG, atau WebP` }
  if (file.size > 5 * 1024 * 1024) return { error: `Ukuran gambar maksimal 5MB` }
  const ext = file.name.split('.').pop()
  const fileName = `${tenantId}/${key}-${Date.now()}.${ext}`
  const { error: uploadError } = await supabase.storage.from('product-images').upload(fileName, file)
  if (uploadError) return { error: `Gagal upload gambar` }
  const { data: urlData } = supabase.storage.from('product-images').getPublicUrl(fileName)
  return urlData.publicUrl
}

export async function updateAboutPage(slug: string, formData: FormData) {
  const supabase = createServiceClient()
  const { data: tenant } = await supabase.from('tenants').select('id').eq('slug', slug).single()
  if (!tenant) return { error: 'Toko tidak ditemukan' }

  const updates: Record<string, unknown> = {
    page_about_story: formData.get('about_story')?.toString().trim() || null,
    page_commitments: Array.from({ length: 4 }, (_, i) => ({
      title: formData.get(`commitment_title_${i}`)?.toString().trim() ?? '',
      body: formData.get(`commitment_body_${i}`)?.toString().trim() ?? '',
    })),
  }

  for (const [field, key, col] of [
    ['page_about_image', 'page-about', 'page_about_image_url'],
    ['page_about_story_image', 'page-about-story', 'page_about_story_image_url'],
  ]) {
    const result = await uploadPageImage(supabase, formData, field, key, tenant.id)
    if (result && typeof result === 'object' && 'error' in result) return result
    if (typeof result === 'string') updates[col] = result
  }

  const { error } = await supabase.from('tenants').update(updates).eq('slug', slug)
  if (error) return { error: 'Gagal menyimpan' }
  invalidateTenant(slug)
  return { success: true }
}

export async function updateIngredientsPage(slug: string, formData: FormData) {
  const supabase = createServiceClient()
  const { data: tenant } = await supabase.from('tenants').select('id').eq('slug', slug).single()
  if (!tenant) return { error: 'Toko tidak ditemukan' }

  const count = parseInt(formData.get('ingredient_count')?.toString() ?? '0', 10)
  const page_ingredients_items = Array.from({ length: count }, (_, i) => ({
    name: formData.get(`ingredient_name_${i}`)?.toString().trim() ?? '',
    description: formData.get(`ingredient_desc_${i}`)?.toString().trim() ?? '',
  })).filter(item => item.name)

  const updates: Record<string, unknown> = {
    page_ingredients_title: formData.get('ingredients_title')?.toString().trim() || null,
    page_ingredients_items: page_ingredients_items.length ? page_ingredients_items : null,
    page_process_steps: Array.from({ length: 3 }, (_, i) => ({
      title: formData.get(`step_title_${i}`)?.toString().trim() ?? '',
      body: formData.get(`step_body_${i}`)?.toString().trim() ?? '',
    })),
  }

  const result = await uploadPageImage(supabase, formData, 'page_ingredients_image', 'page-ingredients', tenant.id)
  if (result && typeof result === 'object' && 'error' in result) return result
  if (typeof result === 'string') updates['page_ingredients_image_url'] = result

  const { error } = await supabase.from('tenants').update(updates).eq('slug', slug)
  if (error) return { error: 'Gagal menyimpan' }
  invalidateTenant(slug)
  return { success: true }
}

export async function updateSustainabilityPage(slug: string, formData: FormData) {
  const supabase = createServiceClient()
  const { data: tenant } = await supabase.from('tenants').select('id').eq('slug', slug).single()
  if (!tenant) return { error: 'Toko tidak ditemukan' }

  const updates: Record<string, unknown> = {
    page_sustainability: Array.from({ length: 3 }, (_, i) => ({
      title: formData.get(`initiative_title_${i}`)?.toString().trim() ?? '',
      body: formData.get(`initiative_body_${i}`)?.toString().trim() ?? '',
    })),
    page_stats: Array.from({ length: 4 }, (_, i) => ({
      value: formData.get(`stat_value_${i}`)?.toString().trim() ?? '',
      label: formData.get(`stat_label_${i}`)?.toString().trim() ?? '',
    })),
    page_sustainability_story_title: formData.get('story_title')?.toString().trim() || null,
    page_sustainability_story_body: formData.get('story_body')?.toString().trim() || null,
  }

  for (const [field, key, col] of [
    ['page_sustainability_image', 'page-sustainability', 'page_sustainability_image_url'],
    ['page_sustainability_story_image', 'page-sust-story', 'page_sustainability_story_image_url'],
  ]) {
    const result = await uploadPageImage(supabase, formData, field, key, tenant.id)
    if (result && typeof result === 'object' && 'error' in result) return result
    if (typeof result === 'string') updates[col] = result
  }

  const { error } = await supabase.from('tenants').update(updates).eq('slug', slug)
  if (error) return { error: 'Gagal menyimpan' }
  invalidateTenant(slug)
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

  invalidateTenant(slug)
  return { success: true }
}
