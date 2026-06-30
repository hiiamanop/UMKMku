import { Hero } from '@/components/store/hero'
import { AboutSection } from '@/components/store/about-section'
import { CtaBanner } from '@/components/store/cta-banner'
import { ProductGrid } from '@/components/store/product-grid'
import { TestimonialsSection } from '@/components/store/testimonials-section'
import { StoreFooter } from '@/components/store/store-footer'
import { ChatbotWidgetLoader } from '@/components/store/chatbot-widget-loader'
import type { Tenant, Product, Testimonial } from '@/lib/supabase/types'

interface Props {
  tenant: Tenant
  products: Product[]
  testimonials: Testimonial[]
}

export function SkincareHomePage({ tenant, products, testimonials }: Props) {
  return (
    <>
      <Hero tenant={tenant} products={products} />
      <AboutSection tenant={tenant} />
      <CtaBanner tenant={tenant} />
      <ProductGrid products={products} slug={tenant.slug} />
      <TestimonialsSection tenant={tenant} testimonials={testimonials} />
      <StoreFooter tenant={tenant} />
      <ChatbotWidgetLoader tenant={tenant} products={products} />
    </>
  )
}
