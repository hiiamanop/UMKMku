'use server'

import { revalidatePath } from 'next/cache'
import { createServiceClient } from '@/lib/supabase/server'

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_SIZE = 5 * 1024 * 1024 // 5MB

export async function upsertProduct(slug: string, productId: string | null, formData: FormData) {
  const name = formData.get('name')?.toString().trim()
  const description = formData.get('description')?.toString().trim() || null
  const priceRaw = formData.get('price')?.toString()
  const price = priceRaw ? parseInt(priceRaw, 10) : null
  const skin_types = formData.getAll('skin_types').map(String)
  const concerns = formData.getAll('concerns').map(String)
  const ingredients = formData.get('ingredients')?.toString()
    .split(',').map(s => s.trim()).filter(Boolean) ?? []
  const usage_step = formData.get('usage_step')?.toString() || null
  const how_to_use = formData.get('how_to_use')?.toString().trim() || null
  const tokopedia_url = formData.get('tokopedia_url')?.toString().trim() || null
  const shopee_url = formData.get('shopee_url')?.toString().trim() || null
  const stockRaw = formData.get('stock_quantity')?.toString()
  const stock_quantity = stockRaw && stockRaw.trim() !== '' ? parseInt(stockRaw, 10) : null
  const is_preorder = formData.get('is_preorder') === 'true'

  if (!name || name.length < 2) return { error: 'Nama produk minimal 2 karakter' }
  if (price !== null && (isNaN(price) || price < 0)) return { error: 'Harga tidak valid' }
  if (stock_quantity !== null && (isNaN(stock_quantity) || stock_quantity < 0)) return { error: 'Jumlah stok tidak valid' }

  const supabase = createServiceClient()

  // Get tenant id
  const { data: tenant } = await supabase
    .from('tenants')
    .select('id')
    .eq('slug', slug)
    .single()

  if (!tenant) return { error: 'Toko tidak ditemukan' }

  // Handle image upload
  let image_url: string | null = null
  const imageFile = formData.get('image') as File | null

  if (imageFile && imageFile.size > 0) {
    if (!ALLOWED_TYPES.includes(imageFile.type)) {
      return { error: 'Format gambar harus JPG, PNG, atau WebP' }
    }
    if (imageFile.size > MAX_SIZE) {
      return { error: 'Ukuran gambar maksimal 5MB' }
    }

    const ext = imageFile.name.split('.').pop()
    const fileName = `${tenant.id}/${Date.now()}.${ext}`

    const { error: uploadError } = await supabase.storage
      .from('product-images')
      .upload(fileName, imageFile, { upsert: true })

    if (uploadError) return { error: 'Gagal upload gambar' }

    const { data: urlData } = supabase.storage
      .from('product-images')
      .getPublicUrl(fileName)

    image_url = urlData.publicUrl
  }

  const productData = {
    tenant_id: tenant.id,
    name,
    description,
    price,
    skin_types,
    concerns,
    ingredients,
    usage_step,
    how_to_use,
    tokopedia_url,
    shopee_url,
    stock_quantity,
    is_preorder,
    ...(image_url ? { image_url } : {}),
  }

  if (productId) {
    const { error } = await supabase
      .from('products')
      .update(productData)
      .eq('id', productId)
      .eq('tenant_id', tenant.id)

    if (error) return { error: 'Gagal memperbarui produk' }
  } else {
    const { error } = await supabase
      .from('products')
      .insert(productData)

    if (error) return { error: 'Gagal menambah produk' }
  }

  revalidatePath(`/store/${slug}`, 'page')
  revalidatePath(`/${slug}/products`, 'page')
  return { success: true }
}

export async function deleteProduct(slug: string, productId: string) {
  const supabase = createServiceClient()

  const { data: tenant } = await supabase
    .from('tenants')
    .select('id')
    .eq('slug', slug)
    .single()

  if (!tenant) return { error: 'Toko tidak ditemukan' }

  const { error } = await supabase
    .from('products')
    .delete()
    .eq('id', productId)
    .eq('tenant_id', tenant.id)

  if (error) return { error: 'Gagal menghapus produk' }

  revalidatePath(`/store/${slug}`, 'page')
  revalidatePath(`/${slug}/products`, 'page')
  return { success: true }
}
