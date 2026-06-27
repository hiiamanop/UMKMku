import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

// POST /api/onboarding/link-merchant
// Dipanggil tepat setelah signUp berhasil di onboarding.
// Set role='merchant' di user_profiles + owner_id di tenants.
export async function POST(req: NextRequest) {
  const { slug, userId } = await req.json()
  if (!slug || !userId) return NextResponse.json({ error: 'Missing slug or userId' }, { status: 400 })

  const supabase = createServiceClient()

  // Verifikasi tenant ada dan belum punya owner
  const { data: tenant } = await supabase
    .from('tenants')
    .select('id, owner_id')
    .eq('slug', slug)
    .single()

  if (!tenant) return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })

  // Jangan overwrite owner yang sudah ada
  if (tenant.owner_id && tenant.owner_id !== userId) {
    return NextResponse.json({ error: 'Tenant already has an owner' }, { status: 409 })
  }

  await Promise.all([
    supabase.from('user_profiles').update({ role: 'merchant' }).eq('id', userId),
    supabase.from('tenants').update({ owner_id: userId }).eq('id', tenant.id),
  ])

  return NextResponse.json({ ok: true })
}
