import { notFound, redirect } from 'next/navigation'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { CheckoutClient } from './_checkout-client'
import { StoreFooter } from '@/components/store/store-footer'

interface Props { params: Promise<{ slug: string }> }

export default async function CheckoutPage({ params }: Props) {
  const { slug } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/store/${slug}/login`)

  const service = createServiceClient()
  const { data: tenant } = await service.from('tenants').select('*').eq('slug', slug).single()
  if (!tenant) notFound()

  const { data: profile } = await supabase.from('user_profiles').select('*').eq('id', user.id).single()

  return (
    <>
      <CheckoutClient
        slug={slug}
        tenant={tenant}
        initialName={profile?.full_name ?? ''}
        initialWhatsapp={profile?.whatsapp_number ?? ''}
        initialAddress={profile?.address ?? ''}
      />
      <StoreFooter tenant={tenant} />
    </>
  )
}
