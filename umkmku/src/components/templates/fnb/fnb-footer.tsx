import Link from 'next/link'
import type { Tenant } from '@/lib/supabase/types'

interface Props { tenant: Tenant }

export function FnbFooter({ tenant }: Props) {
  const base = `/store/${tenant.slug}`

  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 pb-10 border-b border-white/10">
          {/* Brand */}
          <div className="flex flex-col gap-4">
            <h3 className="text-xl font-black text-white">{tenant.brand_name}</h3>
            <p className="text-sm text-gray-400 leading-relaxed">
              {tenant.description ?? 'Makanan segar & lezat, diantarkan langsung ke pintumu.'}
            </p>
            <div className="flex gap-3">
              {tenant.instagram_url && (
                <a href={tenant.instagram_url} target="_blank" rel="noopener noreferrer"
                  className="text-xs text-gray-400 hover:text-white transition-colors">Instagram</a>
              )}
              {tenant.whatsapp_number && (
                <a href={`https://wa.me/${tenant.whatsapp_number.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer"
                  className="text-xs text-gray-400 hover:text-white transition-colors">WhatsApp</a>
              )}
            </div>
          </div>

          {/* Quick links */}
          <div className="flex flex-col gap-3">
            <h4 className="text-sm font-bold text-white/60 uppercase tracking-wide">Menu</h4>
            {[
              { label: 'Beranda', href: base },
              { label: 'Produk', href: `${base}/shop` },
              { label: 'Pesanan Saya', href: `${base}/orders` },
            ].map(({ label, href }) => (
              <Link key={label} href={href} className="text-sm text-gray-400 hover:text-white transition-colors">{label}</Link>
            ))}
          </div>

          {/* Contact */}
          <div className="flex flex-col gap-3">
            <h4 className="text-sm font-bold text-white/60 uppercase tracking-wide">Kontak</h4>
            {tenant.whatsapp_number && (
              <a
                href={`https://wa.me/${tenant.whatsapp_number.replace(/\D/g, '')}`}
                target="_blank" rel="noopener noreferrer"
                className="text-sm text-gray-400 hover:text-white transition-colors"
              >
                WhatsApp: {tenant.whatsapp_number}
              </a>
            )}
            {tenant.tokopedia_url && (
              <a href={tenant.tokopedia_url} target="_blank" rel="noopener noreferrer"
                className="text-sm text-gray-400 hover:text-white transition-colors">Tokopedia</a>
            )}
            {tenant.shopee_url && (
              <a href={tenant.shopee_url} target="_blank" rel="noopener noreferrer"
                className="text-sm text-gray-400 hover:text-white transition-colors">Shopee</a>
            )}
          </div>
        </div>

        <div className="pt-6 flex flex-col sm:flex-row justify-between items-center gap-3">
          <p className="text-xs text-gray-500">© {new Date().getFullYear()} {tenant.brand_name}. All rights reserved.</p>
          <p className="text-xs text-gray-600">Powered by UMKMku</p>
        </div>
      </div>
    </footer>
  )
}
