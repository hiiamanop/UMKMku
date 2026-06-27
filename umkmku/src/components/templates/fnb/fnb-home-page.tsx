import { FnbHero } from './fnb-hero'
import { FnbProductGrid } from './fnb-product-grid'
import { FnbFeatures } from './fnb-features'
import { FnbPromoBanner } from './fnb-promo-banner'
import { FnbTestimonials } from './fnb-testimonials'
import { FnbFooter } from './fnb-footer'
import { ChatbotWidgetLoader } from '@/components/store/chatbot-widget-loader'
import type { Tenant, Product, Testimonial } from '@/lib/supabase/types'

interface Props {
  tenant: Tenant
  products: Product[]
  testimonials: Testimonial[]
}

export function FnbHomePage({ tenant, products, testimonials }: Props) {
  return (
    <>
      <FnbHero tenant={tenant} />
      <FnbProductGrid tenant={tenant} products={products} />
      <FnbFeatures />
      <FnbPromoBanner tenant={tenant} />
      <FnbTestimonials tenant={tenant} testimonials={testimonials} />
      <FnbFooter tenant={tenant} />
      <ChatbotWidgetLoader tenant={tenant} products={products} />
    </>
  )
}
