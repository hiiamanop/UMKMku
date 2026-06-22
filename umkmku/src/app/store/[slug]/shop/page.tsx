import { notFound } from 'next/navigation'
import { getTenantBySlug } from '@/lib/tenant'
import { ShopPage } from '@/components/store/shop-page'

interface Props {
  params: Promise<{ slug: string }>
}

export default async function Page({ params }: Props) {
  const { slug } = await params
  const data = await getTenantBySlug(slug)
  if (!data) notFound()
  return <ShopPage tenant={data.tenant} products={data.products} />
}
