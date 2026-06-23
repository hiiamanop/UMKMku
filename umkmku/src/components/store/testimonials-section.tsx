import { ArrowLeft, ArrowRight } from 'lucide-react'
import type { Tenant } from '@/lib/supabase/types'

interface Props {
  tenant: Tenant
}

export function TestimonialsSection({ tenant }: Props) {
  return (
    <section className="py-20 md:py-28 px-6 md:px-16 bg-[var(--color-primary)]">
      <div className="max-w-[1280px] mx-auto">
        {/* Header */}
        <div className="mb-14">
          <span className="text-label-caps text-[var(--color-primary)]/90 bg-white/10 px-3 py-1 mb-6 inline-block">
            TESTIMONIALS
          </span>
          <h2 className="text-headline-lg text-white max-w-2xl">
            Hasil <i className="italic">nyata</i>, cerita nyata. Lihat bagaimana kulit pelanggan{' '}
            <i className="italic">kami</i> berubah dengan produk <i className="italic">{tenant.brand_name}</i>.
          </h2>
        </div>

        {/* Content: collage left + quote right */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Left: staggered placeholder photos */}
          <div className="relative grid grid-cols-12 gap-4 h-[380px]">
            <div className="col-span-4 self-end h-[70%] overflow-hidden bg-white/10" />
            <div className="col-span-8 h-full overflow-hidden bg-white/20" />
          </div>

          {/* Right: quote */}
          <div>
            <div className="mb-8">
              <div className="text-white/40 text-6xl leading-none mb-4">"</div>
              <p className="text-headline-md italic text-white leading-relaxed mb-8">
                Kulit saya belum pernah sehalus dan selembab ini! Produknya lembut tapi efektif, dan saya suka tahu bahwa semua bahan aman dan alami.
              </p>
              <p className="text-label-caps text-white/70">Pelanggan {tenant.brand_name}</p>
            </div>

            {/* Stats */}
            <div className="flex items-center gap-8 pt-8 border-t border-white/20 mb-10">
              <div>
                <p className="text-label-caps text-[10px] text-white/50 mb-2">Kepuasan Pelanggan</p>
                <div className="flex items-baseline gap-3">
                  <span className="text-headline-md text-white text-3xl">4.8</span>
                  <span className="text-white/50 text-lg">/ 5</span>
                </div>
              </div>
            </div>

            {/* Arrow nav (UI only) */}
            <div className="flex gap-4">
              <button aria-label="Previous" className="w-12 h-12 border border-white/30 flex items-center justify-center text-white hover:bg-white hover:text-[var(--color-primary)] transition-colors">
                <ArrowLeft size={16} />
              </button>
              <button aria-label="Next" className="w-12 h-12 border border-white/30 flex items-center justify-center text-white hover:bg-white hover:text-[var(--color-primary)] transition-colors">
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
