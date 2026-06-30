import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/server'

// Request payout for all pending commissions
export async function POST(request: NextRequest) {
  const authClient = await createClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const service = createServiceClient()

  const { data: freelancer } = await service
    .from('freelancers')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!freelancer) return NextResponse.json({ error: 'Freelancer tidak ditemukan.' }, { status: 404 })

  const { error } = await service
    .from('commission_ledger')
    .update({ status: 'requested', requested_at: new Date().toISOString() })
    .eq('freelancer_id', freelancer.id)
    .eq('status', 'pending')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
