import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const formData = await req.formData()
  const slug = formData.get('slug') as string | null

  const supabase = await createClient()
  await supabase.auth.signOut()

  const redirectTo = slug ? `/${slug}/login` : '/onboarding'
  return NextResponse.redirect(new URL(redirectTo, req.url))
}
