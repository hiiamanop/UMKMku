import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { requireSuperAdmin } from '@/lib/supabase/admin-guard'

const ALLOWED: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png' : 'png',
  'image/webp': 'webp',
}

export async function POST(req: NextRequest) {
  const denied = await requireSuperAdmin()
  if (denied) return denied

  const form = await req.formData()
  const file = form.get('file') as File | null
  if (!file) return NextResponse.json({ error: 'File tidak ada' }, { status: 400 })

  if (file.size > 10 * 1024 * 1024)
    return NextResponse.json({ error: 'File terlalu besar (max 10MB)' }, { status: 413 })

  const ext = ALLOWED[file.type]
  if (!ext) return NextResponse.json({ error: 'Gunakan JPG, PNG, atau WebP' }, { status: 415 })

  const path  = `articles/${Date.now()}.${ext}`
  const bytes = await file.arrayBuffer()
  const db    = createServiceClient()

  const { error } = await db.storage
    .from('product-images')
    .upload(path, Buffer.from(bytes), { contentType: file.type, upsert: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const url = db.storage.from('product-images').getPublicUrl(path).data.publicUrl
  return NextResponse.json({ url })
}
