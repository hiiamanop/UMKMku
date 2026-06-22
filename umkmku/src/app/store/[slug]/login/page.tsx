import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getTenantBySlug } from '@/lib/tenant'

interface Props {
  params: Promise<{ slug: string }>
}

export default async function LoginPage({ params }: Props) {
  const { slug } = await params
  const data = await getTenantBySlug(slug)
  if (!data) notFound()

  return (
    <main className="min-h-screen bg-[#f9f9f9] flex flex-col items-center justify-center py-12 px-4">
      {/* Logo */}
      <Link href={`/store/${slug}`} className="text-[#1a1c1c] font-bold text-xl mb-2">
        {data.tenant.brand_name}
      </Link>
      {data.tenant.tagline && (
        <p className="text-[12px] text-[#8f6f73] mb-8">{data.tenant.tagline}</p>
      )}

      {/* Card */}
      <div className="w-full max-w-[480px] bg-white rounded-2xl shadow-[0_4px_15px_rgba(0,0,0,0.05)] p-10">
        <h1 className="text-headline-lg text-[#1a1c1c] mb-6">Masuk</h1>

        <form className="space-y-4">
          <div>
            <label className="text-label-bold text-[#1a1c1c] block mb-1">EMAIL</label>
            <input
              type="email"
              placeholder="email@kamu.com"
              className="w-full h-12 px-4 bg-[#f3f3f3] rounded-lg text-[14px] outline-none focus:ring-2 focus:ring-[#e91e63]"
            />
          </div>
          <div>
            <div className="flex justify-between mb-1">
              <label className="text-label-bold text-[#1a1c1c]">PASSWORD</label>
              <button type="button" className="text-[12px] text-[#e91e63] hover:underline">
                Lupa?
              </button>
            </div>
            <input
              type="password"
              placeholder="••••••••"
              className="w-full h-12 px-4 bg-[#f3f3f3] rounded-lg text-[14px] outline-none focus:ring-2 focus:ring-[#e91e63]"
            />
          </div>

          <button
            type="submit"
            className="w-full h-12 bg-[#1a1c1c] text-white font-bold text-[14px] uppercase rounded-lg hover:bg-[#333] transition-colors mt-2"
          >
            Masuk
          </button>
        </form>

        {/* Divider */}
        <div className="flex items-center gap-3 my-5">
          <div className="flex-1 h-px bg-[#e8e8e8]" />
          <span className="text-[12px] text-[#8f6f73]">atau</span>
          <div className="flex-1 h-px bg-[#e8e8e8]" />
        </div>

        {/* Social */}
        <div className="grid grid-cols-2 gap-3">
          <button className="h-12 bg-white border border-[#e8e8e8] rounded-lg text-[14px] font-bold text-[#1a1c1c] hover:border-[#1a1c1c] transition-colors">
            Google
          </button>
          <button className="h-12 bg-[#1a1c1c] rounded-lg text-[14px] font-bold text-white hover:bg-[#333] transition-colors">
            Apple
          </button>
        </div>

        <p className="text-center text-[12px] text-[#5b3f43] mt-6">
          Belum punya akun?{' '}
          <Link href={`/store/${slug}/register`} className="text-[#e91e63] font-bold hover:underline">
            Daftar
          </Link>
        </p>
      </div>
    </main>
  )
}
