import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function GET() {
  const db = createServiceClient()
  const { data, error } = await db.from('categories').select('*').order('sort_order')
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { slug, name, description, icon, sort_order } = body
  if (!slug?.trim() || !name?.trim()) {
    return NextResponse.json({ error: 'Slug dan nama wajib diisi' }, { status: 400 })
  }
  const db = createServiceClient()
  const { data, error } = await db.from('categories').insert({
    slug: slug.trim().toLowerCase(),
    name: name.trim(),
    description: description?.trim() || null,
    icon: icon?.trim() || null,
    sort_order: Number(sort_order) || 0,
  }).select().single()
  if (error) {
    if (error.code === '23505') return NextResponse.json({ error: 'Slug sudah digunakan' }, { status: 409 })
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json(data)
}
