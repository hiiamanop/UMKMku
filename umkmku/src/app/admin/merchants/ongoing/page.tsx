import { createServiceClient } from '@/lib/supabase/server'
import { OngoingClient } from './_client'

export const dynamic = 'force-dynamic'

export default async function OngoingPage() {
  const db = createServiceClient()
  const { data } = await db
    .from('tenant_subscriptions')
    .select('id, plan_id, current_period_end, tenant_id, tenants!tenant_subscriptions_tenant_id_fkey(slug, brand_name)')
    .eq('status', 'active')
    .order('current_period_end', { ascending: true })

  return <OngoingClient data={data ?? []} />
}
