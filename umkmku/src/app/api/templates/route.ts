import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const category = request.nextUrl.searchParams.get('category')
  const supabase = createServiceClient()

  const query = supabase
    .from('templates')
    .select('id, name, description, category, template_key, preview_urls, demo_url')
    .eq('is_active', true)
    .order('created_at')

  if (category) query.eq('category', category)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ templates: data ?? [] })
}
