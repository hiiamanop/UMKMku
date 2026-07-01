import Link from 'next/link'
import { createServiceClient } from '@/lib/supabase/server'
import { TemplatesGallery } from './_components/templates-gallery'

const PRIMARY = '#0A2F73'
const GOLD = '#F4B400'
const BORDER = '#E5EAF0'
const TEXT_SEC = '#5E6B85'

const CATEGORIES = [
  { value: '', label: 'Semua' },
  { value: 'skincare', label: 'Skincare' },
  { value: 'parfum', label: 'Parfum' },
  { value: 'fashion', label: 'Fashion' },
  { value: 'fdb', label: 'F&B' },
]

export const metadata = {
  title: 'Templates, UMKMu',
  description: 'Pilih template toko untuk brandmu. Tersedia berbagai desain untuk skincare, parfum, fashion, dan F&B.',
}

export default async function TemplatesPage() {
  const supabase = createServiceClient()
  const { data: templates } = await supabase
    .from('templates')
    .select('id, name, description, category, template_key, preview_urls, demo_url')
    .eq('is_active', true)
    .order('category')
    .order('created_at')

  return (
    <div className="min-h-screen bg-white font-sans">
      {/* Navbar */}
      <nav style={{ borderBottom: `1px solid ${BORDER}` }} className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm">
        <div className="mx-auto max-w-6xl px-6 flex items-center justify-between h-16">
          <Link href="/">
            <img src="/logo.png" alt="UMKMu" style={{ height: '32px', width: 'auto' }} />
          </Link>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium" style={{ color: TEXT_SEC }}>
            <Link href="/#fitur" className="hover:text-[#0A2F73] transition-colors">Fitur</Link>
            <Link href="/templates" className="font-semibold" style={{ color: PRIMARY }}>Templates</Link>
            <Link href="/pricing" className="hover:text-[#0A2F73] transition-colors">Harga</Link>
            <Link href="/insight" className="hover:text-[#0A2F73] transition-colors">Insight</Link>
          </div>
          <Link
            href="/onboarding"
            className="text-sm font-semibold px-4 py-2 rounded-lg transition-opacity hover:opacity-90 text-white"
            style={{ background: PRIMARY }}
          >
            Mulai Gratis
          </Link>
        </div>
      </nav>

      {/* Header */}
      <div className="max-w-6xl mx-auto px-6 pt-16 pb-10 text-center">
        <h1 className="text-4xl font-bold mb-3" style={{ color: PRIMARY }}>Template Toko</h1>
        <p className="text-lg max-w-xl mx-auto" style={{ color: TEXT_SEC }}>
          Pilih tampilan yang paling cocok untuk brandmu. AI akan mengisi konten secara otomatis.
        </p>
      </div>

      {/* Gallery with filter */}
      <TemplatesGallery templates={templates ?? []} categories={CATEGORIES} />
    </div>
  )
}
