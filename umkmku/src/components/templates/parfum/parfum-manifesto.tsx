import type { Tenant } from '@/lib/supabase/types'

interface Props {
  tenant: Tenant
}

export function ParfumManifesto({ tenant }: Props) {
  const brandQuote =
    tenant.page_about_story ??
    `"Every fragrance tells a story — wear yours with intention."`

  return (
    <section className="border-b border-black/10" style={{ background: 'var(--color-secondary)' }}>
      <div className="py-24 px-8 md:px-24 max-w-[1400px] mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-16">
          {/* Left — main description (2/3) */}
          <div className="md:col-span-2">
            <span className="text-[10px] tracking-[0.3em] uppercase text-[var(--color-accent)]/50 block mb-6">
              THE HOUSE OF {tenant.brand_name.toUpperCase()}
            </span>
            <p className="text-lg leading-relaxed text-[var(--color-primary)]/80">
              {tenant.description ??
                `${tenant.brand_name} est une maison de parfumerie dédiée à l'art de la senteur. Chaque flacon est une invitation au voyage, une promesse de beauté et d'émotion. Nos créations célèbrent l'authenticité et la singularité — pour ceux qui osent être remarqués.`}
            </p>
          </div>

          {/* Right — decorative quote (1/3) */}
          <div className="flex flex-col justify-end border-l border-black/10 pl-8 md:pl-12">
            <blockquote className="font-serif text-base italic text-[var(--color-primary)]/50 leading-relaxed">
              {brandQuote}
            </blockquote>
            <div className="mt-6 w-8 h-px bg-[var(--color-accent)]/40" />
          </div>
        </div>
      </div>
    </section>
  )
}
