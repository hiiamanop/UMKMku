import { createServiceClient } from '@/lib/supabase/server'
import type { Tenant, Product } from '@/lib/supabase/types'

export interface TenantWithProducts {
  tenant: Tenant
  products: Product[]
}

export async function getTenantBySlug(slug: string): Promise<TenantWithProducts | null> {
  const supabase = createServiceClient()

  const { data: tenant } = await supabase
    .from('tenants')
    .select('*')
    .eq('slug', slug)
    .eq('is_active', true)
    .single()

  if (!tenant) return null

  const { data: products } = await supabase
    .from('products')
    .select('*')
    .eq('tenant_id', tenant.id)
    .eq('is_active', true)
    .order('sort_order', { ascending: true })

  return { tenant, products: products ?? [] }
}
