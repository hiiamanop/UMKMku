import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

// POST /api/onboarding/check-email
// Cek apakah email sudah terhubung ke merchant
export async function POST(req: NextRequest) {
  const { email } = await req.json()
  if (!email) return NextResponse.json({ isMerchant: false })

  const supabase = createServiceClient()

  // Cari user di auth.users berdasarkan email
  const { data } = await supabase.auth.admin.listUsers()
  const user = data?.users?.find((u) => u.email === email)
  if (!user) return NextResponse.json({ isMerchant: false })

  // Cek apakah user ini punya tenant
  const { data: tenant } = await supabase
    .from('tenants')
    .select('id')
    .eq('owner_id', user.id)
    .maybeSingle()

  return NextResponse.json({ isMerchant: !!tenant })
}
