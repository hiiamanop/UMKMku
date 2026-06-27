import type { Tenant, Testimonial } from '@/lib/supabase/types'

interface Props {
  tenant: Tenant
  testimonials: Testimonial[]
}

function Stars({ count }: { count: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <span key={i} className={i < count ? 'text-yellow-400' : 'text-gray-200'}>★</span>
      ))}
    </div>
  )
}

export function FnbTestimonials({ testimonials }: Props) {
  if (testimonials.length === 0) return null

  const visible = testimonials.slice(0, 3)

  return (
    <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div className="text-center mb-10">
        <p className="text-[var(--color-primary)] font-semibold text-sm mb-1">Ulasan Pelanggan</p>
        <h2 className="text-3xl font-black text-gray-900">Yang Mereka Katakan</h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {visible.map((t) => (
          <div key={t.id} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex flex-col gap-4">
            <Stars count={t.rating} />
            <p className="text-gray-600 text-sm leading-relaxed italic">"{t.quote}"</p>
            <div className="flex items-center gap-3 pt-2 border-t border-gray-50 mt-auto">
              <div className="w-10 h-10 rounded-full bg-[var(--color-primary)]/10 flex items-center justify-center text-[var(--color-primary)] font-bold text-sm">
                {t.author_name[0]}
              </div>
              <div>
                <p className="font-semibold text-gray-900 text-sm">{t.author_name}</p>
                {t.author_title && <p className="text-xs text-gray-400">{t.author_title}</p>}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
