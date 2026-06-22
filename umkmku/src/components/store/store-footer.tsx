import type { Tenant } from '@/lib/supabase/types'

interface Props {
  tenant: Tenant
}

export function StoreFooter({ tenant }: Props) {
  return (
    <footer className="bg-[#1a1c1c] text-white">
      <div className="max-w-[1200px] mx-auto px-4 md:px-6 py-12 md:py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <p className="font-bold text-lg mb-3">{tenant.brand_name}</p>
            {tenant.tagline && (
              <p className="text-[14px] text-[#e2e2e2] leading-relaxed">{tenant.tagline}</p>
            )}
          </div>

          {/* Explore */}
          <div>
            <p className="text-label-bold text-[#8f6f73] mb-4">EXPLORE</p>
            <ul className="space-y-2">
              {['Shop', 'Ingredients', 'Sustainability', 'About'].map((item) => (
                <li key={item}>
                  <a href="#" className="text-[14px] text-[#e2e2e2] hover:text-white transition-colors">
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <p className="text-label-bold text-[#8f6f73] mb-4">SUPPORT</p>
            <ul className="space-y-2">
              {([
                tenant.whatsapp_number ? { label: 'WhatsApp', href: `https://wa.me/${tenant.whatsapp_number.replace(/[^0-9]/g, '')}` } : null,
                tenant.instagram_url ? { label: 'Instagram', href: tenant.instagram_url } : null,
              ].filter((x): x is { label: string; href: string } => x !== null)).map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[14px] text-[#e2e2e2] hover:text-white transition-colors"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
              <li>
                <a href="#" className="text-[14px] text-[#e2e2e2] hover:text-white transition-colors">FAQ</a>
              </li>
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <p className="text-label-bold text-[#8f6f73] mb-4">NEWSLETTER</p>
            <p className="text-[14px] text-[#e2e2e2] mb-3">Dapatkan update produk terbaru.</p>
            <form className="flex" onSubmit={(e) => e.preventDefault()}>
              <input
                type="email"
                placeholder="Email kamu"
                className="flex-1 px-3 py-2 bg-white/10 border border-white/20 rounded-l-lg text-[14px] text-white placeholder:text-[#8f6f73] outline-none focus:border-[#e91e63]"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-[#e91e63] rounded-r-lg text-white text-[12px] font-bold hover:bg-[#b80049] transition-colors"
              >
                OK
              </button>
            </form>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-white/10 pt-6 flex flex-col md:flex-row justify-between items-center gap-2">
          <p className="text-[12px] text-[#8f6f73]">
            © {new Date().getFullYear()} {tenant.brand_name}. All rights reserved.
          </p>
          <p className="text-[12px] text-[#8f6f73]">
            Powered by{' '}
            <a href="https://umkmku.com" className="text-[#e91e63] hover:underline">
              UMKMku.com
            </a>
          </p>
        </div>
      </div>
    </footer>
  )
}
