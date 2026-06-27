import { createServiceClient } from '@/lib/supabase/server'
import { LoginClient } from './_login-client'

interface Props { params: Promise<{ slug: string }> }

export default async function LoginPage({ params }: Props) {
  const { slug } = await params
  const supabase = createServiceClient()
  const { data: tenant } = await supabase
    .from('tenants')
    .select('auth_hero_image_url')
    .eq('slug', slug)
    .single()

  return <LoginClient authHeroImageUrl={tenant?.auth_hero_image_url ?? null} />
}
