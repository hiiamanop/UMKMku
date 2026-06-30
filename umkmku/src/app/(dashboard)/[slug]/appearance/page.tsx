import { getTenantBySlug } from '@/lib/tenant'
import { notFound } from 'next/navigation'
import { createServiceClient } from '@/lib/supabase/server'
import { AppearanceForm } from '../_components/appearance-form'
import { TestimonialsForm } from '../_components/testimonials-form'
import { TemplateChanger } from '../_components/template-changer'
import type { Testimonial } from '@/lib/supabase/types'
import Link from 'next/link'
import { Pencil } from 'lucide-react'

interface Props {
  params: Promise<{ slug: string }>
}

export default async function AppearancePage({ params }: Props) {
  const { slug } = await params
  const data = await getTenantBySlug(slug)
  if (!data) notFound()

  const { tenant } = data
  const supabase = createServiceClient()

  const [{ data: testimonials }, { data: sub }] = await Promise.all([
    supabase.from('testimonials').select('*').eq('tenant_id', tenant.id).order('sort_order'),
    tenant.subscription_id
      ? supabase.from('tenant_subscriptions').select('plan_id').eq('id', tenant.subscription_id).single()
      : Promise.resolve({ data: null }),
  ])

  const planId = sub?.plan_id ?? 'free'

  const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? 'localhost:3000'
  const isLocal = rootDomain.startsWith('localhost')
  const storeUrl = isLocal ? `http://${rootDomain}/store/${slug}` : `https://${slug}.${rootDomain}`

  return (
    <div className="space-y-6">
      {/* Edit Mode button */}
      <div className="rounded-2xl border border-gray-100 bg-white p-6 flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-gray-900 mb-0.5">Edit Konten Toko</h3>
          <p className="text-sm text-gray-500">Edit teks dan gambar langsung dari halaman toko kamu.</p>
        </div>
        <Link
          href={`${storeUrl}?edit=1`}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90"
          style={{ background: '#0A2F73' }}
        >
          <Pencil size={14} /> Edit Mode
        </Link>
      </div>

      <TemplateChanger
        slug={slug}
        tenantId={tenant.id}
        currentTemplateId={tenant.template_id}
        planId={planId}
        category={tenant.category}
      />
      <AppearanceForm tenant={tenant} />
      <TestimonialsForm slug={slug} testimonials={(testimonials ?? []) as Testimonial[]} />
    </div>
  )
}
