import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ tenantId: string }> }
) {
  const { tenantId } = await params
  const { template_id } = await request.json()

  // Auth: must be owner of this tenant
  const authClient = await createClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const service = createServiceClient()

  // Verify ownership
  const { data: tenant } = await service
    .from('tenants')
    .select('id, subscription_id')
    .eq('id', tenantId)
    .eq('owner_id', user.id)
    .single()

  if (!tenant) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  // Verify subscription is Business or Enterprise
  const { data: sub } = await service
    .from('tenant_subscriptions')
    .select('plan_id')
    .eq('id', tenant.subscription_id)
    .single()

  if (!sub || !['business', 'enterprise'].includes(sub.plan_id)) {
    return NextResponse.json({ error: 'Fitur ini hanya tersedia untuk plan Business dan Enterprise.' }, { status: 403 })
  }

  // Verify template exists and is active
  const { data: tmpl } = await service
    .from('templates')
    .select('id')
    .eq('id', template_id)
    .eq('is_active', true)
    .single()

  if (!tmpl) return NextResponse.json({ error: 'Template tidak ditemukan.' }, { status: 404 })

  const { error } = await service
    .from('tenants')
    .update({ template_id })
    .eq('id', tenantId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
