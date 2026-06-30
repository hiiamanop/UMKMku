import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/server'
import type { PageItem } from '@/lib/supabase/types'

const ALLOWED_FIELDS = new Set([
  'brand_name', 'tagline', 'description',
  'hero_image_url', 'logo_url', 'about_image_1_url', 'about_image_2_url',
  'cta_image_url', 'footer_image_url',
  'page_about_story', 'page_commitments',
  'page_sustainability_story_body', 'page_sustainability_story_title',
  'page_ingredients_title',
  'whatsapp_number', 'instagram_url',
  'primary_color', 'secondary_color', 'accent_color',
])

// Keys whose values are JSON arrays that support per-item editing
const ALLOWED_ARRAY_FIELDS = new Set(['page_commitments'])

// Matches keys like "page_commitments[0].title"
const ARRAY_PATH_RE = /^([a-z_]+)\[(\d+)\]\.([a-z_]+)$/

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params

  const authClient = await createClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const service = createServiceClient()

  const [{ data: tenant }, { data: profile }] = await Promise.all([
    service.from('tenants').select('id, owner_id').eq('slug', slug).single(),
    service.from('user_profiles').select('role').eq('id', user.id).single(),
  ])

  if (!tenant) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const isSuperAdmin = profile?.role === 'super_admin'
  if (!isSuperAdmin && tenant.owner_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await request.json() as Record<string, unknown>

  const updates: Record<string, unknown> = {}
  // Track per-item array edits: { page_commitments: { 0: { title: 'x' } } }
  const arrayEdits: Record<string, Record<number, Record<string, unknown>>> = {}

  for (const [key, value] of Object.entries(body)) {
    if (ALLOWED_FIELDS.has(key)) {
      updates[key] = value
      continue
    }
    const m = key.match(ARRAY_PATH_RE)
    if (m) {
      const [, arrayKey, idxStr, field] = m
      if (ALLOWED_ARRAY_FIELDS.has(arrayKey)) {
        arrayEdits[arrayKey] ??= {}
        arrayEdits[arrayKey][Number(idxStr)] ??= {}
        arrayEdits[arrayKey][Number(idxStr)][field] = value
      }
    }
  }

  // Resolve array edits: fetch current array, apply patches, write back
  if (Object.keys(arrayEdits).length > 0) {
    const selectCols = Object.keys(arrayEdits).join(', ')
    const { data: current } = await service
      .from('tenants')
      .select(selectCols)
      .eq('id', tenant.id)
      .single()

    for (const [arrayKey, itemEdits] of Object.entries(arrayEdits)) {
      const currentArr: PageItem[] = (current as Record<string, unknown>)?.[arrayKey] as PageItem[] ?? []
      const newArr = [...currentArr]
      for (const [idxStr, fields] of Object.entries(itemEdits)) {
        const idx = Number(idxStr)
        newArr[idx] = { ...newArr[idx], ...fields } as PageItem
      }
      updates[arrayKey] = newArr
    }
  }

  if (!Object.keys(updates).length) {
    return NextResponse.json({ error: 'Tidak ada field yang valid.' }, { status: 400 })
  }

  const { error } = await service.from('tenants').update(updates).eq('id', tenant.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
