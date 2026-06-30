'use client'

import { useEffect, useState } from 'react'
import { X, ExternalLink, Package, ShoppingBag, Phone, User, Calendar, Loader2 } from 'lucide-react'

const PRIMARY = '#0A2F73'
const BORDER = '#E5EAF0'
const TEXT_SEC = '#5E6B85'

const STATUS_LABEL: Record<string, { label: string; cls: string }> = {
  trial:     { label: 'Trial',    cls: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
  active:    { label: 'Aktif',    cls: 'bg-green-50 text-green-700 border-green-200' },
  expired:   { label: 'Expired',  cls: 'bg-gray-100 text-gray-500 border-gray-200' },
  suspended: { label: 'Suspend',  cls: 'bg-red-50 text-red-600 border-red-200' },
}

interface Detail {
  id: string
  slug: string
  brand_name: string
  category: string
  whatsapp_number: string | null
  instagram_url: string | null
  owner_email: string | null
  created_at: string
  subscription: {
    plan_id: string
    status: string
    trial_ends_at: string | null
    current_period_start: string | null
    current_period_end: string | null
    ai_tokens_used: number
    transactions_used: number
  } | null
  product_count: number
  order_count: number
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 py-3 border-b last:border-0" style={{ borderColor: BORDER }}>
      <span className="text-xs font-medium w-36 shrink-0 mt-0.5" style={{ color: TEXT_SEC }}>{label}</span>
      <span className="text-sm text-gray-900 flex-1">{children}</span>
    </div>
  )
}

export function MerchantDetailModal({ tenantId, onClose }: { tenantId: string; onClose: () => void }) {
  const [detail, setDetail] = useState<Detail | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/admin/merchants/${tenantId}`)
      .then(r => r.json())
      .then(d => { setDetail(d); setLoading(false) })
  }, [tenantId])

  const sub = detail?.subscription
  const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? 'localhost:3000'
  const storeUrl = detail ? `http://${detail.slug}.${rootDomain}` : ''

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: BORDER, background: '#F8FAFC' }}>
          <div>
            <h2 className="font-bold text-gray-900">{detail?.brand_name ?? 'Detail Merchant'}</h2>
            {detail && <p className="text-xs mt-0.5" style={{ color: TEXT_SEC }}>/{detail.slug} · {detail.category}</p>}
          </div>
          <div className="flex items-center gap-2">
            {detail && (
              <a href={storeUrl} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg border transition-colors hover:bg-gray-50"
                style={{ borderColor: BORDER, color: TEXT_SEC }}>
                <ExternalLink size={12} /> Lihat Toko
              </a>
            )}
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors" style={{ color: TEXT_SEC }}>
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-2 max-h-[70vh] overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 size={24} className="animate-spin" style={{ color: PRIMARY }} />
            </div>
          ) : !detail ? (
            <p className="text-sm text-center py-10" style={{ color: TEXT_SEC }}>Data tidak ditemukan</p>
          ) : (
            <>
              {/* Subscription */}
              <div className="py-3">
                <p className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: TEXT_SEC }}>Subscription</p>
                <div className="rounded-xl border p-4 space-y-2" style={{ borderColor: BORDER }}>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold capitalize" style={{ color: PRIMARY }}>{sub?.plan_id ?? 'free'}</span>
                    {sub && (
                      <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${STATUS_LABEL[sub.status]?.cls}`}>
                        {STATUS_LABEL[sub.status]?.label ?? sub.status}
                      </span>
                    )}
                  </div>
                  {sub?.trial_ends_at && (
                    <p className="text-xs" style={{ color: TEXT_SEC }}>
                      Trial berakhir: <span className="font-medium text-gray-700">{new Date(sub.trial_ends_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                    </p>
                  )}
                  {sub?.current_period_end && (
                    <p className="text-xs" style={{ color: TEXT_SEC }}>
                      Periode hingga: <span className="font-medium text-gray-700">{new Date(sub.current_period_end).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                    </p>
                  )}
                  <div className="flex gap-4 pt-1">
                    <div className="flex items-center gap-1.5 text-xs" style={{ color: TEXT_SEC }}>
                      <Package size={12} /> <span>{detail.product_count} produk</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs" style={{ color: TEXT_SEC }}>
                      <ShoppingBag size={12} /> <span>{detail.order_count} pesanan</span>
                    </div>
                    {sub && (
                      <div className="flex items-center gap-1.5 text-xs" style={{ color: TEXT_SEC }}>
                        <span>{sub.transactions_used} transaksi dipakai</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Info */}
              <div className="py-1">
                <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: TEXT_SEC }}>Info Merchant</p>
                <div>
                  {detail.owner_email && (
                    <Row label={<span className="flex items-center gap-1.5"><User size={11} /> Email</span> as any}>
                      {detail.owner_email}
                    </Row>
                  )}
                  {detail.whatsapp_number && (
                    <Row label={<span className="flex items-center gap-1.5"><Phone size={11} /> WhatsApp</span> as any}>
                      <a href={`https://wa.me/${detail.whatsapp_number}`} target="_blank" rel="noopener noreferrer"
                        className="underline" style={{ color: PRIMARY }}>
                        {detail.whatsapp_number}
                      </a>
                    </Row>
                  )}
                  {detail.instagram_url && (
                    <Row label={<span className="flex items-center gap-1.5">📸 Instagram</span> as any}>
                      <a href={detail.instagram_url} target="_blank" rel="noopener noreferrer"
                        className="underline" style={{ color: PRIMARY }}>
                        {detail.instagram_url.replace('https://instagram.com/', '@').replace('https://www.instagram.com/', '@')}
                      </a>
                    </Row>
                  )}
                  <Row label={<span className="flex items-center gap-1.5"><Calendar size={11} /> Daftar</span> as any}>
                    {new Date(detail.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </Row>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
