import Link from 'next/link'
import type { Tenant } from '@/lib/supabase/types'

interface Props {
  tenant: Tenant
}

export function ParfumRitual({ tenant }: Props) {
  const { slug } = tenant

  const ritualText =
    tenant.page_about_story ??
    'A fragrance is not simply worn — it is layered into the skin and left to breathe. Apply to pulse points; let the warmth of your body carry the story forward.'

  return (
    <section
      className="py-24 px-8 md:px-16"
      style={{ background: 'var(--color-primary)', color: 'white' }}
    >
      <div className="max-w-[1400px] mx-auto grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
        {/* Left — text */}
        <div>
          <span className="text-[10px] tracking-[0.35em] uppercase text-white/40 block mb-6">
            THE RITUAL
          </span>
          <p className="font-serif text-2xl md:text-3xl italic font-light text-white leading-relaxed">
            {ritualText}
          </p>
        </div>

        {/* Right — CTAs */}
        <div className="flex flex-col items-start gap-4">
          <Link
            href={`/store/${slug}/about`}
            className="inline-flex items-center gap-2 border border-white text-white text-[11px] tracking-[0.25em] uppercase px-8 py-3.5 hover:bg-white hover:text-black transition-all duration-300 w-full md:w-auto justify-center md:justify-start"
          >
            DISCOVER THE RITUAL
          </Link>
          <Link
            href={`/store/${slug}/shop`}
            className="inline-flex items-center gap-2 bg-white text-black text-[11px] tracking-[0.25em] uppercase px-8 py-3.5 hover:bg-[var(--color-accent)] hover:text-white transition-all duration-300 w-full md:w-auto justify-center md:justify-start"
          >
            SHOP FRAGRANCES
          </Link>
        </div>
      </div>
    </section>
  )
}
