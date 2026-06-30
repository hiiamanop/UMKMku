import { createServiceClient } from '@/lib/supabase/server'
import { LeadsClient } from './_client'

export const dynamic = 'force-dynamic'

export default async function LeadsPage() {
  const db = createServiceClient()
  const { data } = await db
    .from('tenant_subscriptions')
    .select('id, trial_ends_at, tenant_id, tenants!tenant_subscriptions_tenant_id_fkey(slug, brand_name, category)')
    .eq('status', 'trial')
    .order('trial_ends_at', { ascending: true })

  return <LeadsClient data={data ?? []} />
}
