import type { Tenant, Testimonial } from '@/lib/supabase/types'

interface Props {
  tenant: Tenant
  testimonials: Testimonial[]
}

export function FashionTestimonials({ tenant, testimonials }: Props) {
  if (testimonials.length === 0) return null

  const displayed = testimonials.slice(0, 3)

  return (
    <section className="px-6 md:px-16 py-16 md:py-24 bg-[var(--color-secondary)]">
      {/* Header */}
      <div className="mb-12 text-center">
        <span className="text-[10px] tracking-widest uppercase text-[var(--color-accent)]/50 mb-2 block">
          What they say
        </span>
        <h2 className="text-xl md:text-2xl tracking-widest uppercase font-medium text-[var(--color-primary)]">
          CLIENT TESTIMONIALS
        </h2>
      </div>

      {/* 3-column grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12 max-w-[1280px] mx-auto">
        {displayed.map((t) => (
          <div
            key={t.id}
            className="flex flex-col border-t border-[var(--color-primary)]/20 pt-8"
          >
            <p className="text-[var(--color-primary)]/80 text-base leading-relaxed mb-6 flex-1">
              &ldquo;{t.quote}&rdquo;
            </p>
            <p className="text-[11px] tracking-widest uppercase text-[var(--color-accent)]/60 font-medium">
              {t.author_name}
              {t.author_title && (
                <span className="block text-[10px] tracking-normal normal-case text-[var(--color-accent)]/40 mt-0.5">
                  {t.author_title}
                </span>
              )}
            </p>
          </div>
        ))}
      </div>
    </section>
  )
}
