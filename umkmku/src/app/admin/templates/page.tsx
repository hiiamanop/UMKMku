import { createServiceClient } from '@/lib/supabase/server'
import { AdminTemplatesClient } from './_client'

export const metadata = { title: 'Template Submissions — Admin' }

export default async function AdminTemplatesPage() {
  const supabase = createServiceClient()

  const { data: submissions } = await supabase
    .from('template_submissions')
    .select(`
      id, name, description, category, repo_url, demo_url,
      preview_image_urls, security_report, status, admin_note,
      submitted_at, reviewed_at,
      freelancers (id, name, email)
    `)
    .order('submitted_at', { ascending: false })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return <AdminTemplatesClient submissions={(submissions ?? []) as any} />
}
