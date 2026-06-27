import Link from 'next/link'
import Image from 'next/image'
import type { Tenant } from '@/lib/supabase/types'

interface Props { tenant: Tenant }

export function FnbPromoBanner({ tenant }: Props) {
  return (
    <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div className="relative rounded-3xl overflow-hidden bg-[var(--color-primary)] min-h-[280px] flex items-center">
        {/* BG image */}
        {tenant.cta_image_url && (
          <Image
            src={tenant.cta_image_url}
            alt=""
            fill
            sizes="100vw"
            className="object-cover opacity-20"
          />
        )}
        <div className="relative z-10 px-8 md:px-16 py-10 max-w-lg">
          <p className="text-white/70 text-xs font-bold uppercase tracking-widest mb-2">Penawaran Terbatas</p>
          <h2 className="text-3xl md:text-4xl font-black text-white leading-tight mb-4">
            Dapatkan <span className="text-[var(--color-accent)]">Gratis Ongkir</span> untuk Pesanan Pertamamu!
          </h2>
          <p className="text-white/80 text-sm mb-6">
            Pesan sekarang dan nikmati pengiriman gratis ke seluruh area. Syarat & ketentuan berlaku.
          </p>
          <Link
            href={`/store/${tenant.slug}/shop`}
            className="inline-block px-6 py-3 bg-white text-[var(--color-primary)] font-bold rounded-full text-sm hover:bg-[var(--color-accent)] hover:text-white transition-colors"
          >
            ORDER SEKARANG →
          </Link>
        </div>
      </div>
    </section>
  )
}
