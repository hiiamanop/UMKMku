import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { requireSuperAdmin } from '@/lib/supabase/admin-guard'

const PAGE_SIZE = 10

export async function GET(req: NextRequest) {
  const denied = await requireSuperAdmin()
  if (denied) return denied

  const page  = Math.max(1, parseInt(req.nextUrl.searchParams.get('page') ?? '1'))
  const from  = (page - 1) * PAGE_SIZE
  const to    = from + PAGE_SIZE - 1

  const supabase = createServiceClient()
  const { data, error, count } = await supabase
    .from('articles')
    .select('id, title, slug, summary, content, status, image_url, image_position, chatgpt_prompt, created_at, published_at', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ articles: data, total: count ?? 0, page, pageSize: PAGE_SIZE })
}

export async function PATCH(req: NextRequest) {
  const denied = await requireSuperAdmin()
  if (denied) return denied
  const body = await req.json()
  const { id, status, image_url, image_position, title, content } = body
  const supabase = createServiceClient()

  const updates: Record<string, unknown> = {}
  if (status !== undefined) {
    updates.status = status
    if (status === 'published') updates.published_at = new Date().toISOString()
    if (status === 'draft') updates.published_at = null
  }
  if (image_url      !== undefined) updates.image_url = image_url
  if (image_position !== undefined) updates.image_position = image_position
  if (title          !== undefined) updates.title = title
  if (content        !== undefined) updates.content = content

  const { data, error } = await supabase
    .from('articles')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ article: data })
}

export async function DELETE(req: NextRequest) {
  const denied = await requireSuperAdmin()
  if (denied) return denied
  const { id } = await req.json()
  const supabase = createServiceClient()
  const { error } = await supabase.from('articles').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
