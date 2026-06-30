import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

// List all template submissions for admin review
export async function GET() {
  const supabase = createServiceClient()

  const { data, error } = await supabase
    .from('template_submissions')
    .select(`
      id, name, description, category, repo_url, demo_url,
      preview_image_urls, security_report, status, admin_note,
      submitted_at, reviewed_at,
      freelancers (id, name, email)
    `)
    .order('submitted_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ submissions: data ?? [] })
}
