import Image from 'next/image'
import Link from 'next/link'
import type { Tenant } from '@/lib/supabase/types'

interface Props {
  tenant: Tenant
}

export function CtaBanner({ tenant }: Props) {
  return (
    <section className="w-full h-[500px] relative overflow-hidden">
      {/* Background */}
      {tenant.hero_image_url ? (
        <Image
          src={tenant.hero_image_url}
          alt="Collection banner"
          fill
          className="object-cover"
        />
      ) : (
        <div
          className="absolute inset-0"
          style={{ backgroundImage: 'linear-gradient(135deg, var(--color-accent) 0%, var(--color-primary) 100%)' }}
        />
      )}
      <div className="absolute inset-0 bg-black/30" />

      {/* Content */}
      <div className="relative z-10 h-full flex flex-col justify-center px-8 md:px-16">
        <div className="max-w-2xl">
          <h2 className="text-display text-white mb-4">
            Temukan Koleksi{' '}
            <i className="font-normal italic">Kami</i>
          </h2>
          <p className="text-body-lg text-white/90 max-w-lg mb-8">
            Temukan pilihan produk perawatan kulit alami kami yang dikurasi dengan cermat,
            dirancang untuk merawat, melindungi, dan meningkatkan kecantikan kulit Anda.
          </p>
          <Link
            href={`/store/${tenant.slug}/shop`}
            className="inline-flex items-center gap-3 px-8 py-4 bg-white text-[var(--color-primary)] text-label-caps hover:bg-[var(--color-secondary)] transition-colors"
          >
            SHOP NOW →
          </Link>
        </div>
      </div>
    </section>
  )
}
