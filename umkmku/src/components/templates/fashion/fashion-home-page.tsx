import { FashionHero } from './fashion-hero'
import { FashionProductGrid } from './fashion-product-grid'
import { FashionFeatureBanner } from './fashion-feature-banner'
import { FashionCategories } from './fashion-categories'
import { FashionBrandStatement } from './fashion-brand-statement'
import { FashionTestimonials } from './fashion-testimonials'
import { StoreFooter } from '@/components/store/store-footer'
import { ChatbotWidgetLoader } from '@/components/store/chatbot-widget-loader'
import type { Tenant, Product, Testimonial } from '@/lib/supabase/types'

interface Props {
  tenant: Tenant
  products: Product[]
  testimonials: Testimonial[]
}

export function FashionHomePage({ tenant, products, testimonials }: Props) {
  return (
    <>
      <FashionHero tenant={tenant} />
      <FashionProductGrid products={products} slug={tenant.slug} />
      <FashionFeatureBanner tenant={tenant} />
      <FashionCategories tenant={tenant} slug={tenant.slug} />
      <FashionBrandStatement tenant={tenant} />
      <FashionTestimonials tenant={tenant} testimonials={testimonials} />
      <StoreFooter tenant={tenant} />
      <ChatbotWidgetLoader tenant={tenant} products={products} />
    </>
  )
}
