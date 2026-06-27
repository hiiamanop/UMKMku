import { createServiceClient } from '@/lib/supabase/server'
import { RegisterClient } from './_register-client'

interface Props { params: Promise<{ slug: string }> }

export default async function RegisterPage({ params }: Props) {
  const { slug } = await params
  const supabase = createServiceClient()
  const { data: tenant } = await supabase
    .from('tenants')
    .select('auth_hero_image_url')
    .eq('slug', slug)
    .single()

  return <RegisterClient authHeroImageUrl={tenant?.auth_hero_image_url ?? null} />
}
