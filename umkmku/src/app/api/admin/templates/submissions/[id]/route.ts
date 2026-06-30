import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { scanGithubRepo } from '@/lib/templates/security-scan'

interface Params { params: Promise<{ id: string }> }

// Trigger security scan for a submission
export async function POST(request: NextRequest, { params }: Params) {
  const { id } = await params
  const { action, note } = await request.json()

  const supabase = createServiceClient()

  if (action === 'scan') {
    const { data: sub } = await supabase
      .from('template_submissions')
      .select('repo_url')
      .eq('id', id)
      .single()

    if (!sub) return NextResponse.json({ error: 'Submission tidak ditemukan.' }, { status: 404 })

    const report = await scanGithubRepo(sub.repo_url)
    await supabase
      .from('template_submissions')
      .update({ security_report: report })
      .eq('id', id)

    return NextResponse.json({ report })
  }

  if (action === 'approve') {
    await supabase
      .from('template_submissions')
      .update({ status: 'approved', admin_note: note ?? null, reviewed_at: new Date().toISOString() })
      .eq('id', id)

    return NextResponse.json({ ok: true })
  }

  if (action === 'reject') {
    await supabase
      .from('template_submissions')
      .update({ status: 'rejected', admin_note: note ?? null, reviewed_at: new Date().toISOString() })
      .eq('id', id)

    return NextResponse.json({ ok: true })
  }

  return NextResponse.json({ error: 'Action tidak valid.' }, { status: 400 })
}
