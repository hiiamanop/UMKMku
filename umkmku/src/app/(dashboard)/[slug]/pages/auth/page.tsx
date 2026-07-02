import { notFound } from 'next/navigation'
import { createServiceClient } from '@/lib/supabase/server'
import { AuthPageForm } from './_auth-page-form'

interface Props { params: Promise<{ slug: string }> }

export default async function AuthPageSettingsPage({ params }: Props) {
  const { slug } = await params
  const supabase = createServiceClient()
  const { data: tenant } = await supabase.from('tenants').select('*').eq('slug', slug).single()
  if (!tenant) notFound()

  return (
    <div>
      <div className="mb-10">
        <p className="text-label-caps text-[10px] text-gray-400 mb-1">HALAMAN</p>
        <h1 className="text-display italic">Login & Register</h1>
        <p className="text-body-md text-gray-500 mt-2">
          Gambar yang tampil di panel kiri halaman login dan register toko kamu.
        </p>
      </div>
      <AuthPageForm tenant={tenant} />
    </div>
  )
}
