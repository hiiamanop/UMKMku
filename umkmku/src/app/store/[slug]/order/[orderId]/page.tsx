import Link from 'next/link'
import { CheckCircle, Share2 } from 'lucide-react'

interface Props {
  params: Promise<{ slug: string; orderId: string }>
}

export default async function OrderSuccessPage({ params }: Props) {
  const { slug, orderId } = await params
  const orderNumber = `#${orderId.slice(0, 8).toUpperCase()}`

  return (
    <main className="bg-[#f9f9f9] min-h-screen py-16">
      <div className="max-w-[720px] mx-auto px-4 space-y-6">
        {/* Confirmation header */}
        <div className="text-center space-y-3">
          <div className="w-16 h-16 bg-[#006a34] rounded-full flex items-center justify-center mx-auto">
            <CheckCircle className="text-white" size={32} />
          </div>
          <h1 className="text-display text-[#1a1c1c]">
            Pesanan <span className="text-[#e91e63]">{orderNumber}</span> Dikonfirmasi
          </h1>
          <p className="text-body-lg text-[#5b3f43]">
            Terima kasih! Pesananmu sedang diproses.
          </p>
        </div>

        {/* Inner Circle loyalty card */}
        <div className="bg-[#ffd9de] rounded-2xl p-8 space-y-3">
          <p className="text-label-bold text-[#400014]">LOYALTY PROGRAM</p>
          <h2 className="text-headline-lg text-[#400014]">Bergabung dengan Inner Circle</h2>
          <p className="text-body-md text-[#5b3f43]">
            Dapatkan poin reward setiap pembelian dan nikmati benefit eksklusif member.
          </p>
          <button className="px-6 py-3 bg-[#e91e63] text-white rounded-lg font-bold text-[14px] uppercase hover:bg-[#b80049] transition-colors">
            Buat Akun & Kumpulkan Poin
          </button>
        </div>

        {/* Sustainability impact */}
        <div className="bg-white rounded-2xl border border-[#e8e8e8] p-6 flex gap-4 items-start">
          <div className="w-10 h-10 bg-[#e2e2e2] rounded-full flex items-center justify-center shrink-0">
            <span className="text-[#006a34] text-lg">🌿</span>
          </div>
          <div>
            <h3 className="text-headline-md text-[#1a1c1c] mb-1">Dampak Lingkungan</h3>
            <p className="text-body-md text-[#5b3f43]">
              Dengan pembelian ini, kamu turut mendukung praktik kemasan ramah lingkungan kami. Terima kasih!
            </p>
          </div>
        </div>

        {/* Share */}
        <div className="bg-[#1a1c1c] rounded-2xl p-8 text-center space-y-4">
          <h2 className="text-headline-lg text-white">Bagikan ke Teman</h2>
          <p className="text-body-md text-[#e2e2e2]">
            Rekomendasikan produk favoritmu kepada teman-teman.
          </p>
          <button className="inline-flex items-center gap-2 px-6 py-3 bg-[#e91e63] text-white rounded-lg font-bold text-[14px] uppercase hover:bg-[#b80049] transition-colors">
            <Share2 size={16} />
            Share Sekarang
          </button>
        </div>

        {/* CTA back to shop */}
        <div className="text-center">
          <Link
            href={`/store/${slug}/shop`}
            className="inline-block px-8 py-3 border border-[#1a1c1c] text-[#1a1c1c] rounded-lg font-bold text-[14px] uppercase hover:bg-[#1a1c1c] hover:text-white transition-colors"
          >
            Lanjut Belanja
          </Link>
        </div>
      </div>
    </main>
  )
}
