import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const authClient = await createClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const form = await req.formData()
  const file = form.get('file') as File | null
  if (!file) return NextResponse.json({ error: 'File tidak ada' }, { status: 400 })

  const ext = file.name.split('.').pop() ?? 'jpg'
  const path = `tenant-content/${user.id}/${Date.now()}.${ext}`
  const bytes = await file.arrayBuffer()

  const db = createServiceClient()
  const { error } = await db.storage
    .from('product-images')
    .upload(path, Buffer.from(bytes), { contentType: file.type, upsert: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const url = db.storage.from('product-images').getPublicUrl(path).data.publicUrl
  return NextResponse.json({ url })
}
