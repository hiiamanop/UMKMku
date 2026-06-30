import { notFound } from 'next/navigation'
import { getTenantBySlug } from '@/lib/tenant'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { getTemplateHomePage } from '@/lib/templates/registry'
import { EditModeProvider } from '@/lib/edit-mode-context'
import { EditModeOverlay } from '@/components/store/edit-mode-overlay'
import type { Testimonial } from '@/lib/supabase/types'

interface Props {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ edit?: string }>
}

export default async function StorePage({ params, searchParams }: Props) {
  const [{ slug }, sp] = await Promise.all([params, searchParams])
  const data = await getTenantBySlug(slug)
  if (!data) notFound()

  const { tenant, products } = data
  const isEditMode = sp?.edit === '1'

  const supabase = createServiceClient()
  const { data: testimonials } = await supabase
    .from('testimonials')
    .select('*')
    .eq('tenant_id', tenant.id)
    .eq('is_active', true)
    .order('sort_order')

  const HomePage = getTemplateHomePage(tenant.template_id, tenant.category)
  const content = (
    <HomePage
      tenant={tenant}
      products={products}
      testimonials={(testimonials ?? []) as Testimonial[]}
    />
  )

  if (!isEditMode) return content

  // Verify ownership or super_admin
  let isOwner = false
  try {
    const authClient = await createClient()
    const { data: { user } } = await authClient.auth.getUser()
    if (user) {
      if (user.id === tenant.owner_id || !tenant.owner_id) {
        isOwner = true
      } else {
        const { data: profile } = await supabase
          .from('user_profiles').select('role').eq('id', user.id).single()
        isOwner = profile?.role === 'super_admin'
      }
    }
  } catch { /* not authenticated */ }

  if (!isOwner) return content

  return (
    <EditModeProvider slug={slug}>
      <EditModeOverlay slug={slug} />
      {content}
    </EditModeProvider>
  )
}
