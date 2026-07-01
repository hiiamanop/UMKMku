import { createServiceClient } from '@/lib/supabase/server'
import { CategoriesClient } from './_client'

export const metadata = { title: 'Kategori, Admin UMKMu' }

export default async function CategoriesPage() {
  const db = createServiceClient()
  const { data } = await db.from('categories').select('*').order('sort_order')
  return <CategoriesClient initial={data ?? []} />
}
