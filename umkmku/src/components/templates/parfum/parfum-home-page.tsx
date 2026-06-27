import { ParfumHero } from './parfum-hero'
import { ParfumManifesto } from './parfum-manifesto'
import { ParfumProductGrid } from './parfum-product-grid'
import { ParfumRitual } from './parfum-ritual'
import { ParfumDiscovery } from './parfum-discovery'
import { TestimonialsSection } from '@/components/store/testimonials-section'
import { StoreFooter } from '@/components/store/store-footer'
import { ChatbotWidgetLoader } from '@/components/store/chatbot-widget-loader'
import type { Tenant, Product, Testimonial } from '@/lib/supabase/types'

interface Props {
  tenant: Tenant
  products: Product[]
  testimonials: Testimonial[]
}

export function ParfumHomePage({ tenant, products, testimonials }: Props) {
  return (
    <>
      <ParfumHero tenant={tenant} />
      <ParfumManifesto tenant={tenant} />
      <ParfumProductGrid products={products} slug={tenant.slug} />
      <ParfumRitual tenant={tenant} />
      <ParfumDiscovery products={products} slug={tenant.slug} />
      <TestimonialsSection tenant={tenant} testimonials={testimonials} />
      <StoreFooter tenant={tenant} />
      <ChatbotWidgetLoader tenant={tenant} products={products} />
    </>
  )
}
