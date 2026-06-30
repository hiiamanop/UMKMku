import { SkincareHomePage } from '@/components/templates/skincare/skincare-home-page'
import { ParfumHomePage } from '@/components/templates/parfum/parfum-home-page'
import { FashionHomePage } from '@/components/templates/fashion/fashion-home-page'
import { FnbHomePage } from '@/components/templates/fnb/fnb-home-page'
import type { Tenant, Product, Testimonial, TenantCategory } from '@/lib/supabase/types'

export interface TemplateHomePageProps {
  tenant: Tenant
  products: Product[]
  testimonials: Testimonial[]
}

type TemplateHomePage = (props: TemplateHomePageProps) => React.ReactElement

// Add new template keys here after a freelancer template is approved and deployed
const REGISTRY: Record<string, TemplateHomePage> = {
  'skincare-default': SkincareHomePage,
  'parfum-default': ParfumHomePage,
  'fashion-default': FashionHomePage,
  'fnb-default': FnbHomePage,
}

const CATEGORY_DEFAULTS: Record<TenantCategory, string> = {
  skincare: 'skincare-default',
  parfum: 'parfum-default',
  fashion: 'fashion-default',
  fdb: 'fnb-default',
}

export function getTemplateHomePage(templateId: string | null, category: TenantCategory): TemplateHomePage {
  const key = templateId ?? CATEGORY_DEFAULTS[category]
  return REGISTRY[key] ?? REGISTRY[CATEGORY_DEFAULTS[category]] ?? SkincareHomePage
}
