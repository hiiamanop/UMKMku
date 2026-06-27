import { notFound } from 'next/navigation'
import { getTenantBySlug } from '@/lib/tenant'
import { createServiceClient } from '@/lib/supabase/server'
import { Hero } from '@/components/store/hero'
import { AboutSection } from '@/components/store/about-section'
import { CtaBanner } from '@/components/store/cta-banner'
import { ProductGrid } from '@/components/store/product-grid'
import { IngredientsSection } from '@/components/store/ingredients-section'
import { TestimonialsSection } from '@/components/store/testimonials-section'
import { StoreFooter } from '@/components/store/store-footer'
import { ChatbotWidgetLoader } from '@/components/store/chatbot-widget-loader'
import { FashionHomePage } from '@/components/templates/fashion/fashion-home-page'
import { ParfumHomePage } from '@/components/templates/parfum/parfum-home-page'
import { FnbHomePage } from '@/components/templates/fnb/fnb-home-page'
import type { Testimonial } from '@/lib/supabase/types'

interface Props {
  params: Promise<{ slug: string }>
}

export default async function StorePage({ params }: Props) {
  const { slug } = await params
  const data = await getTenantBySlug(slug)
  if (!data) notFound()

  const { tenant, products } = data

  const supabase = createServiceClient()

  // Parfum template
  if (tenant.category === 'parfum') {
    const { data: testimonials } = await supabase
      .from('testimonials')
      .select('*')
      .eq('tenant_id', tenant.id)
      .eq('is_active', true)
      .order('sort_order')

    return (
      <ParfumHomePage
        tenant={tenant}
        products={products}
        testimonials={(testimonials ?? []) as Testimonial[]}
      />
    )
  }

  // FnB template
  if (tenant.category === 'fdb') {
    const { data: testimonials } = await supabase
      .from('testimonials')
      .select('*')
      .eq('tenant_id', tenant.id)
      .eq('is_active', true)
      .order('sort_order')

    return (
      <FnbHomePage
        tenant={tenant}
        products={products}
        testimonials={(testimonials ?? []) as Testimonial[]}
      />
    )
  }

  // Fashion template
  if (tenant.category === 'fashion') {
    const { data: testimonials } = await supabase
      .from('testimonials')
      .select('*')
      .eq('tenant_id', tenant.id)
      .eq('is_active', true)
      .order('sort_order')

    return (
      <FashionHomePage
        tenant={tenant}
        products={products}
        testimonials={(testimonials ?? []) as Testimonial[]}
      />
    )
  }

  const { data: testimonials } = await supabase
    .from('testimonials')
    .select('*')
    .eq('tenant_id', tenant.id)
    .eq('is_active', true)
    .order('sort_order')

  return (
    <>
      <Hero tenant={tenant} products={products} />
      <AboutSection tenant={tenant} />
      <CtaBanner tenant={tenant} />
      <ProductGrid products={products} slug={tenant.slug} />
      <IngredientsSection products={products} />
      <TestimonialsSection tenant={tenant} testimonials={(testimonials ?? []) as Testimonial[]} />
      <StoreFooter tenant={tenant} />
      <ChatbotWidgetLoader tenant={tenant} products={products} />
    </>
  )
}
