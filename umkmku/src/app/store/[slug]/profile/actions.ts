'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function saveProfile(slug: string, formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Tidak terautentikasi' }

  const full_name = formData.get('full_name')?.toString().trim() || null
  const address = formData.get('address')?.toString().trim() || null
  const whatsapp_number = formData.get('whatsapp_number')?.toString().trim() || null

  const { error } = await supabase.from('user_profiles').upsert({
    id: user.id, full_name, address, whatsapp_number,
  })

  if (error) return { error: 'Gagal menyimpan profil' }
  revalidatePath(`/store/${slug}/profile`)
  return { success: true }
}

export async function saveSkinProfile(slug: string, formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Tidak terautentikasi' }

  const skin_type = formData.get('skin_type')?.toString() || null
  const skin_concerns = formData.getAll('skin_concerns').map(String)

  const { error } = await supabase.from('user_profiles').upsert({
    id: user.id, skin_type, skin_concerns: skin_concerns.length ? skin_concerns : null,
  })

  if (error) return { error: 'Gagal menyimpan profil kulit' }
  revalidatePath(`/store/${slug}/profile`)
  return { success: true }
}

export async function logout(slug: string) {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect(`/store/${slug}/login`)
}
