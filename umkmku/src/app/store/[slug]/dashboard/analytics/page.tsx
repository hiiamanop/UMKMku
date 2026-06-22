import { AnalyticsPage } from '@/components/dashboard/AnalyticsPage'
import { getAnalyticsMetrics } from '@/lib/analytics/queries'
import { createClient } from '@/lib/supabase/server'

interface Props {
  params: Promise<{ slug: string }>
}

export default async function AnalyticsPageRoute({ params }: Props) {
  const { slug } = await params

  // Get tenant ID from slug
  const supabase = await createClient()
  const { data: tenant } = await supabase
    .from('tenants')
    .select('id')
    .eq('slug', slug)
    .single()

  if (!tenant) {
    return <AnalyticsPage metrics={null} error="Tenant not found" />
  }

  // Get analytics metrics
  const metrics = await getAnalyticsMetrics(tenant.id)

  return <AnalyticsPage metrics={metrics} />
}
