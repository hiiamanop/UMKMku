import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getTenantBySlug } from '@/lib/tenant'

interface Props {
  params: Promise<{ slug: string }>
}

export default async function RegisterPage({ params }: Props) {
  const { slug } = await params
  const data = await getTenantBySlug(slug)
  if (!data) notFound()

  return (
    <main className="min-h-screen bg-[#f9f9f9] flex flex-col items-center py-0 px-0">
      {/* Hero banner dark */}
      <div className="w-full bg-[#1a1c1c] py-12 text-center px-4 mb-0">
        <Link href={`/store/${slug}`} className="text-white font-bold text-xl">
          {data.tenant.brand_name}
        </Link>
        <h1 className="text-display text-white mt-4 uppercase tracking-widest" style={{ letterSpacing: '0.1em' }}>
          THE RITUAL BEGINS HERE
        </h1>
      </div>

      <div className="flex-1 flex items-start justify-center w-full py-12 px-4">
        {/* Card */}
        <div className="w-full max-w-[480px] bg-white rounded-2xl shadow-[0_4px_15px_rgba(0,0,0,0.05)] p-10">
          <h2 className="text-headline-lg text-[#1a1c1c] mb-6">Buat Akun</h2>

          <form className="space-y-4">
            <div>
              <label className="text-label-bold text-[#1a1c1c] block mb-1">NAMA LENGKAP</label>
              <input
                type="text"
                placeholder="Nama Lengkap"
                className="w-full h-12 px-4 bg-[#f3f3f3] rounded-lg text-[14px] outline-none focus:ring-2 focus:ring-[#e91e63]"
              />
            </div>
            <div>
              <label className="text-label-bold text-[#1a1c1c] block mb-1">EMAIL</label>
              <input
                type="email"
                placeholder="email@kamu.com"
                className="w-full h-12 px-4 bg-[#f3f3f3] rounded-lg text-[14px] outline-none focus:ring-2 focus:ring-[#e91e63]"
              />
            </div>
            <div>
              <label className="text-label-bold text-[#1a1c1c] block mb-1">PASSWORD</label>
              <input
                type="password"
                placeholder="••••••••"
                className="w-full h-12 px-4 bg-[#f3f3f3] rounded-lg text-[14px] outline-none focus:ring-2 focus:ring-[#e91e63]"
              />
            </div>

            <label className="flex items-start gap-2 cursor-pointer">
              <input type="checkbox" className="accent-[#e91e63] mt-1" />
              <span className="text-[12px] text-[#5b3f43]">
                Saya setuju dengan syarat dan ketentuan yang berlaku.
              </span>
            </label>

            <button
              type="submit"
              className="w-full h-12 bg-[#e91e63] text-white font-bold text-[14px] uppercase rounded-lg hover:bg-[#b80049] transition-colors mt-2"
            >
              Begin the Journey
            </button>
          </form>

          <p className="text-center text-[12px] text-[#5b3f43] mt-6">
            Sudah punya akun?{' '}
            <Link href={`/store/${slug}/login`} className="text-[#e91e63] font-bold hover:underline">
              Masuk
            </Link>
          </p>
        </div>
      </div>
    </main>
  )
}
