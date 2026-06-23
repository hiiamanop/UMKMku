import { notFound } from 'next/navigation'
import { getTenantBySlug } from '@/lib/tenant'
import { Hero } from '@/components/store/hero'
import { AboutSection } from '@/components/store/about-section'
import { CtaBanner } from '@/components/store/cta-banner'
import { ProductGrid } from '@/components/store/product-grid'
import { IngredientsSection } from '@/components/store/ingredients-section'
import { TestimonialsSection } from '@/components/store/testimonials-section'
import { StoreFooter } from '@/components/store/store-footer'
import { ChatbotWidgetLoader } from '@/components/store/chatbot-widget-loader'

interface Props {
  params: Promise<{ slug: string }>
}

export default async function StorePage({ params }: Props) {
  const { slug } = await params
  const data = await getTenantBySlug(slug)

  if (!data) notFound()

  const { tenant, products } = data

  return (
    <>
      <Hero tenant={tenant} featuredProduct={products[0] ?? null} />
      <AboutSection tenant={tenant} />
      <CtaBanner tenant={tenant} />
      <ProductGrid products={products} />
      <IngredientsSection products={products} />
      <TestimonialsSection tenant={tenant} />
      <StoreFooter tenant={tenant} />
      <ChatbotWidgetLoader tenant={tenant} products={products} />
    </>
  )
}
