'use client'

import type { Tenant } from '@/lib/supabase/types'

interface Props {
  tenant: Tenant
}

const NAV_BLOCKS = ['Shop', 'About Us', 'Ingredients', 'Sustainability', 'Contact', 'Blog']

export function StoreFooter({ tenant }: Props) {
  return (
    <footer className="w-full px-6 md:px-16 py-14 flex flex-col gap-12 bg-[var(--color-accent)] text-white">
      {/* Nav blocks row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
        {NAV_BLOCKS.map((label) => (
          <a
            key={label}
            href="#"
            className="border border-white/20 px-5 py-5 flex justify-between items-center group hover:bg-[var(--color-primary)] hover:border-[var(--color-primary)] transition-all"
          >
            <span className="text-label-caps text-white text-[11px]">{label.toUpperCase()}</span>
            <span className="text-white text-xs group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform">↗</span>
          </a>
        ))}
      </div>

      {/* Info row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-10 border-t border-white/10 pt-10">
        {/* Info links */}
        <div className="flex flex-col gap-3">
          <span className="text-label-caps text-white/40 mb-1">INFORMATION</span>
          {['Terms & Conditions', 'Kebijakan Pengiriman', 'Return & Exchange', 'Ulasan Kami'].map((item) => (
            <a key={item} href="#" className="text-[13px] text-white/80 hover:text-white transition-colors">
              {item}
            </a>
          ))}
        </div>

        {/* Brand name center image */}
        <div className="md:col-span-2 relative h-48 overflow-hidden flex items-center justify-center bg-white/5">
          <span className="text-headline-lg italic text-white/60">{tenant.brand_name}</span>
        </div>

        {/* Contact + social */}
        <div className="flex flex-col gap-8">
          <div>
            <span className="text-label-caps text-white/40 mb-3 block">HUBUNGI KAMI</span>
            {tenant.whatsapp_number && (
              <a
                href={`https://wa.me/${tenant.whatsapp_number.replace(/[^0-9]/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[13px] text-white/80 hover:text-white block mb-1"
              >
                WhatsApp: {tenant.whatsapp_number}
              </a>
            )}
            {tenant.instagram_url && (
              <a
                href={tenant.instagram_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[13px] text-white/80 hover:text-white block"
              >
                Instagram
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="flex flex-col md:flex-row justify-between items-center border-t border-white/10 pt-7 gap-5">
        <p className="text-label-caps text-[10px] text-white/30">
          © {new Date().getFullYear()} {tenant.brand_name.toUpperCase()}. ALL RIGHTS RESERVED.
        </p>
        <div className="flex gap-6">
          <a href="#" className="text-label-caps text-[10px] text-white/30 hover:text-white transition-colors">PRIVACY POLICY</a>
          <a href="#" className="text-label-caps text-[10px] text-white/30 hover:text-white transition-colors">TERMS OF USE</a>
        </div>
        <div className="flex gap-3">
          {tenant.whatsapp_number && (
            <a
              href={`https://wa.me/${tenant.whatsapp_number.replace(/[^0-9]/g, '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 border border-white/20 text-[10px] text-white hover:bg-white hover:text-[var(--color-accent)] transition-colors"
            >
              WHATSAPP
            </a>
          )}
          {tenant.instagram_url && (
            <a
              href={tenant.instagram_url}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 border border-white/20 text-[10px] text-white hover:bg-white hover:text-[var(--color-accent)] transition-colors"
            >
              INSTAGRAM
            </a>
          )}
          {tenant.tokopedia_url && (
            <a
              href={tenant.tokopedia_url}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 border border-white/20 text-[10px] text-white hover:bg-white hover:text-[var(--color-accent)] transition-colors"
            >
              TOKOPEDIA
            </a>
          )}
        </div>
      </div>
    </footer>
  )
}
