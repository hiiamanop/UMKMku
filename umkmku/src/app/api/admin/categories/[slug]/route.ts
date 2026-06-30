import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const body = await req.json()
  const db = createServiceClient()
  const { error } = await db.from('categories').update({
    name: body.name?.trim(),
    description: body.description?.trim() || null,
    icon: body.icon?.trim() || null,
    sort_order: body.sort_order !== undefined ? Number(body.sort_order) : undefined,
    is_active: body.is_active,
  }).eq('slug', slug)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const db = createServiceClient()
  const { error } = await db.from('categories').delete().eq('slug', slug)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
