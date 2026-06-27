import { getTenantBySlug } from '@/lib/tenant'
import { notFound } from 'next/navigation'
import { BrandForm } from '../_components/brand-form'

interface Props {
  params: Promise<{ slug: string }>
}

export default async function BrandPage({ params }: Props) {
  const { slug } = await params
  const data = await getTenantBySlug(slug)

  if (!data) notFound()

  return (
    <>
      <h1 className="text-headline-lg italic mb-8">Brand &amp; Kontak</h1>
      <BrandForm tenant={data.tenant} />
    </>
  )
}
