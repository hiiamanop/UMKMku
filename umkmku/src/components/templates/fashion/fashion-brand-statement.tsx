import Link from 'next/link'
import type { Tenant } from '@/lib/supabase/types'

interface Props {
  tenant: Tenant
}

export function FashionBrandStatement({ tenant }: Props) {
  const shopUrl = `/store/${tenant.slug}/shop`

  return (
    <section className="w-full py-24 md:py-32 px-6 md:px-16 bg-[var(--color-primary)] flex flex-col items-center justify-center text-center">
      <span className="text-[10px] tracking-widest uppercase text-white/40 mb-8">
        Our Philosophy
      </span>

      <blockquote className="max-w-3xl text-3xl md:text-5xl font-bold italic text-white leading-tight mb-10">
        &ldquo;{tenant.tagline ?? `${tenant.brand_name} — crafted with intention.`}&rdquo;
      </blockquote>

      {tenant.description && (
        <p className="text-white/60 text-base max-w-xl mb-10 leading-relaxed">
          {tenant.description}
        </p>
      )}

      <Link
        href={shopUrl}
        className="inline-block border border-white text-white text-[11px] tracking-widest uppercase px-8 py-3 hover:bg-white hover:text-[var(--color-primary)] transition-colors duration-300"
      >
        EXPLORE LOOKBOOK
      </Link>
    </section>
  )
}
