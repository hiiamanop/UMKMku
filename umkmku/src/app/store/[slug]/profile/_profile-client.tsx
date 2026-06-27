'use client'

import { useState, useTransition, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { User, Heart, ShoppingBag, Settings, Leaf, Package, LogOut, Check } from 'lucide-react'
import type { Tenant, Product, UserProfile } from '@/lib/supabase/types'
import { saveProfile, saveSkinProfile, logout } from './actions'

const TABS = [
  { id: 'profile', label: 'Detail Profil', icon: User },
  { id: 'skin', label: 'Preferensi Kulit', icon: Leaf },
  { id: 'orders', label: 'Riwayat Pesanan', icon: Package },
  { id: 'wishlist', label: 'Wishlist', icon: Heart },
  { id: 'settings', label: 'Pengaturan Akun', icon: Settings },
]

const SKIN_TYPES = ['oily', 'dry', 'combination', 'sensitive', 'normal']
const SKIN_CONCERNS = ['acne', 'brightening', 'anti-aging', 'hydrating', 'pores']
const fmt = (s: string) => s.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())

const STATUS_STYLES: Record<string, string> = {
  pending_payment: 'bg-yellow-50 text-yellow-700',
  payment_submitted: 'bg-blue-50 text-blue-700',
  payment_verified: 'bg-green-50 text-green-700',
  shipped: 'bg-purple-50 text-purple-700',
  delivered: 'bg-[var(--color-primary)]/10 text-[var(--color-primary)]',
  cancelled: 'bg-red-50 text-red-500',
}
const STATUS_LABEL: Record<string, string> = {
  pending_payment: 'Menunggu Bayar',
  payment_submitted: 'Bukti Dikirim',
  payment_verified: 'Pembayaran OK',
  shipped: 'Dalam Pengiriman',
  delivered: 'Terkirim',
  cancelled: 'Dibatalkan',
}

function fmtPrice(n: number | null) {
  if (!n) return '-'
  return 'Rp ' + n.toLocaleString('id-ID')
}
function fmtDate(s: string) {
  return new Date(s).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
}

interface Props {
  tenant: Tenant
  user: { id: string; email: string }
  profile: UserProfile | null
  orders: any[]
  ordersPage: number
  ordersTotal: number
  ordersPageSize: number
  wishlistProducts: Product[]
  wishlistPage: number
  wishlistTotal: number
  wishlistPageSize: number
  featuredProducts: Product[]
  slug: string
}

export function ProfileClient({ tenant, user, profile, orders, ordersPage, ordersTotal, ordersPageSize, wishlistProducts, wishlistPage, wishlistTotal, wishlistPageSize, featuredProducts, slug }: Props) {
  const searchParams = useSearchParams()
  const [activeTab, setActiveTab] = useState(() => {
    if (searchParams.get('page')) return 'orders'
    if (searchParams.get('wpage')) return 'wishlist'
    return 'profile'
  })
  const [isPending, startTransition] = useTransition()
  const [saved, setSaved] = useState<string | null>(null)

  const firstName = profile?.full_name?.split(' ')[0] ?? user.email.split('@')[0]
  const initial = (profile?.full_name ?? user.email).charAt(0).toUpperCase()
  const memberYear = new Date().getFullYear()

  function withSave(key: string, fn: () => Promise<any>) {
    startTransition(async () => {
      await fn()
      setSaved(key)
      setTimeout(() => setSaved(null), 2000)
    })
  }

  const inputCls = 'w-full bg-[var(--color-secondary)] border border-black/15 px-4 py-3 text-body-md focus:outline-none focus:border-[var(--color-primary)] transition-colors'
  const labelCls = 'text-label-caps text-[10px] text-[var(--color-accent)]/40 block mb-2'

  return (
    <div className="min-h-screen bg-[var(--color-secondary)]">

      {/* Header */}
      <div className="bg-[var(--color-primary)] px-6 md:px-16 py-16">
        <div className="max-w-[1280px] mx-auto">
          <p className="text-label-caps text-white/50 mb-3">AKUN SAYA</p>
          <h1 className="text-display text-white mb-2">
            Selamat datang, <i className="italic">{firstName}</i>
          </h1>
          <p className="text-body-md text-white/60">Anggota sejak {memberYear}.</p>
        </div>
      </div>

      {/* Body */}
      <div className="max-w-[1280px] mx-auto px-6 md:px-16 py-16">
        <div className="flex gap-12">

          {/* Sidebar */}
          <aside className="w-56 shrink-0">
            <div className="flex flex-col items-center mb-8 pb-8 border-b border-black/10">
              <div className="w-20 h-20 rounded-full bg-[var(--color-primary)]/10 flex items-center justify-center mb-4">
                <span className="text-2xl font-serif italic text-[var(--color-primary)]">{initial}</span>
              </div>
              <p className="text-headline-md italic text-center leading-tight">{profile?.full_name ?? 'Pengguna'}</p>
              <p className="text-label-caps text-[10px] text-[var(--color-accent)]/40 mt-1">{user.email}</p>
            </div>

            <nav className="flex flex-col gap-0.5">
              {TABS.map(tab => {
                const Icon = tab.icon
                const active = activeTab === tab.id
                return (
                  <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-3 px-3 py-3 text-left transition-all rounded-sm text-xs tracking-widest uppercase font-sans ${
                      active ? 'bg-[var(--color-primary)] text-white' : 'text-[var(--color-accent)]/50 hover:text-[var(--color-accent)] hover:bg-black/5'
                    }`}>
                    <Icon size={13} />{tab.label}
                  </button>
                )
              })}

              {/* Logout */}
              <button
                onClick={() => startTransition(() => logout(slug))}
                className="flex items-center gap-3 px-3 py-3 text-left transition-all rounded-sm text-xs tracking-widest uppercase font-sans text-red-400 hover:bg-red-50 mt-4">
                <LogOut size={13} />Keluar
              </button>
            </nav>
          </aside>

          {/* Main */}
          <main className="flex-1 min-w-0">

            {/* ── PROFIL ── */}
            {activeTab === 'profile' && (
              <div className="space-y-8">
                <div className="bg-white border border-black/8 rounded p-8">
                  <div className="flex items-start justify-between mb-6">
                    <div>
                      <p className={labelCls}>INFORMASI AKUN</p>
                      <h2 className="text-headline-lg italic">{profile?.full_name ?? '-'}</h2>
                      <p className="text-body-md text-[var(--color-accent)]/60 mt-1">{user.email}</p>
                      {profile?.whatsapp_number && (
                        <p className="text-body-md text-[var(--color-accent)]/50 mt-0.5">{profile.whatsapp_number}</p>
                      )}
                      {profile?.address && (
                        <p className="text-body-md text-[var(--color-accent)]/50 mt-0.5">{profile.address}</p>
                      )}
                    </div>
                    <button onClick={() => setActiveTab('settings')}
                      className="text-label-caps text-[10px] border border-black/15 px-4 py-2 hover:bg-[var(--color-secondary)] transition-colors">
                      Edit Profil
                    </button>
                  </div>
                </div>

                {/* Skin profile */}
                <div className="bg-white border border-black/8 rounded p-8">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <p className={labelCls}>PROFIL KULIT</p>
                      <h3 className="text-headline-md italic">Tipe kulitmu</h3>
                    </div>
                    <button onClick={() => setActiveTab('skin')}
                      className="text-label-caps text-[10px] text-[var(--color-primary)] hover:opacity-70">
                      Perbarui Profil →
                    </button>
                  </div>
                  {profile?.skin_type ? (
                    <div className="flex flex-wrap gap-3">
                      <span className="text-label-caps text-[10px] bg-[var(--color-primary)]/10 text-[var(--color-primary)] px-3 py-1.5">
                        {fmt(profile.skin_type)}
                      </span>
                      {(profile.skin_concerns ?? []).map(c => (
                        <span key={c} className="text-label-caps text-[10px] border border-black/15 text-[var(--color-accent)]/60 px-3 py-1.5">
                          {fmt(c)}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <button onClick={() => setActiveTab('skin')}
                      className="text-body-md text-[var(--color-accent)]/50 italic">
                      Belum ada profil kulit. Klik untuk mengisi →
                    </button>
                  )}
                </div>

                {/* Recent orders */}
                <div className="bg-white border border-black/8 rounded p-8">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <p className={labelCls}>PERJALANAN TERAKHIR</p>
                      <h3 className="text-headline-md italic">Pesanan terbaru</h3>
                    </div>
                    <button onClick={() => setActiveTab('orders')} className="text-label-caps text-[10px] text-[var(--color-primary)] hover:opacity-70">
                      Lihat Semua →
                    </button>
                  </div>
                  {orders.length === 0 ? (
                    <p className="text-body-md text-[var(--color-accent)]/40 italic">Belum ada pesanan.</p>
                  ) : (
                    <OrderTable orders={orders.slice(0, 3)} />
                  )}
                </div>

                {/* Featured products */}
                {featuredProducts.length > 0 && (
                  <div>
                    <p className={labelCls}>UNTUK KAMU</p>
                    <h3 className="text-headline-md italic mb-6">Rekomendasi produk</h3>
                    <div className="grid grid-cols-3 gap-6">
                      {featuredProducts.map(p => (
                        <Link key={p.id} href={`/store/${slug}/products/${p.id}`}
                          className="group bg-white border border-black/8 rounded overflow-hidden hover:border-[var(--color-primary)]/30 transition-colors">
                          <div className="relative aspect-square bg-[var(--color-secondary)]">
                            {p.image_url && <Image src={p.image_url} alt={p.name} fill sizes="33vw" className="object-cover" />}
                          </div>
                          <div className="p-4">
                            <p className="text-body-md font-medium leading-tight mb-1 group-hover:text-[var(--color-primary)] transition-colors">{p.name}</p>
                            <p className="text-label-caps text-[10px] text-[var(--color-accent)]/50">{fmtPrice(p.price)}</p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── KULIT ── */}
            {activeTab === 'skin' && (
              <div className="bg-white border border-black/8 rounded p-8">
                <p className={labelCls}>PREFERENSI KULIT</p>
                <h2 className="text-headline-lg italic mb-8">Profil kulitmu</h2>
                <form action={async (fd) => {
                  withSave('skin', () => saveSkinProfile(slug, fd))
                }}>
                  <div className="space-y-8 max-w-lg">
                    <div>
                      <p className={labelCls}>TIPE KULIT</p>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {SKIN_TYPES.map(t => (
                          <label key={t} className="cursor-pointer">
                            <input type="radio" name="skin_type" value={t} defaultChecked={profile?.skin_type === t} className="sr-only peer" />
                            <span className="text-label-caps text-[10px] px-3 py-2 border border-black/15 cursor-pointer peer-checked:bg-[var(--color-primary)] peer-checked:text-white peer-checked:border-[var(--color-primary)] hover:border-[var(--color-primary)]/40 transition-colors block">
                              {fmt(t)}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className={labelCls}>SKIN CONCERNS (pilih semua yang sesuai)</p>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {SKIN_CONCERNS.map(c => (
                          <label key={c} className="cursor-pointer">
                            <input type="checkbox" name="skin_concerns" value={c}
                              defaultChecked={profile?.skin_concerns?.includes(c)} className="sr-only peer" />
                            <span className="text-label-caps text-[10px] px-3 py-2 border border-black/15 cursor-pointer peer-checked:bg-[var(--color-primary)] peer-checked:text-white peer-checked:border-[var(--color-primary)] hover:border-[var(--color-primary)]/40 transition-colors block">
                              {fmt(c)}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>
                    <button type="submit" disabled={isPending}
                      className="bg-[var(--color-primary)] text-white text-label-caps tracking-widest px-8 py-3 hover:opacity-90 transition-opacity disabled:opacity-60 flex items-center gap-2">
                      {saved === 'skin' ? <><Check size={14} />TERSIMPAN</> : isPending ? 'MENYIMPAN...' : 'SIMPAN PROFIL KULIT'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* ── PESANAN ── */}
            {activeTab === 'orders' && (
              <div className="bg-white border border-black/8 rounded p-8">
                <p className={labelCls}>RIWAYAT</p>
                <h2 className="text-headline-lg italic mb-8">Semua pesanan</h2>
                {orders.length === 0 && ordersPage === 1 ? (
                  <div className="text-center py-16">
                    <ShoppingBag size={32} className="mx-auto text-[var(--color-accent)]/20 mb-4" />
                    <p className="text-body-md text-[var(--color-accent)]/40 italic">Belum ada pesanan.</p>
                    <Link href={`/store/${slug}/shop`}
                      className="inline-block mt-4 text-label-caps text-[10px] text-[var(--color-primary)] hover:opacity-70">
                      Mulai Belanja →
                    </Link>
                  </div>
                ) : (
                  <>
                    <OrderTable orders={orders} slug={slug} showDetail />
                    {ordersTotal > ordersPageSize && (
                      <div className="flex items-center justify-between pt-6 mt-6 border-t border-black/8">
                        <p className="text-[11px] text-[var(--color-accent)]/40">
                          {(ordersPage - 1) * ordersPageSize + 1}–{Math.min(ordersPage * ordersPageSize, ordersTotal)} dari {ordersTotal} pesanan
                        </p>
                        <div className="flex items-center gap-2">
                          {ordersPage > 1
                            ? <Link href={`/store/${slug}/profile?page=${ordersPage - 1}`}
                                className="text-label-caps text-[10px] border border-black/15 px-3 py-1.5 hover:bg-[var(--color-secondary)] transition-colors">
                                ← Sebelumnya
                              </Link>
                            : <span className="text-label-caps text-[10px] border border-black/10 px-3 py-1.5 opacity-30">← Sebelumnya</span>
                          }
                          <span className="text-[11px] text-[var(--color-accent)]/40">{ordersPage} / {Math.ceil(ordersTotal / ordersPageSize)}</span>
                          {ordersPage < Math.ceil(ordersTotal / ordersPageSize)
                            ? <Link href={`/store/${slug}/profile?page=${ordersPage + 1}`}
                                className="text-label-caps text-[10px] border border-black/15 px-3 py-1.5 hover:bg-[var(--color-secondary)] transition-colors">
                                Berikutnya →
                              </Link>
                            : <span className="text-label-caps text-[10px] border border-black/10 px-3 py-1.5 opacity-30">Berikutnya →</span>
                          }
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {/* ── WISHLIST ── */}
            {activeTab === 'wishlist' && (
              <div className="bg-white border border-black/8 rounded p-8">
                <p className={labelCls}>TERSIMPAN</p>
                <h2 className="text-headline-lg italic mb-8">Wishlist kamu</h2>
                {wishlistProducts.length === 0 ? (
                  <div className="text-center py-16">
                    <Heart size={32} className="mx-auto text-[var(--color-accent)]/20 mb-4" />
                    <p className="text-body-md text-[var(--color-accent)]/40 italic">Wishlist masih kosong.</p>
                    <Link href={`/store/${slug}/shop`}
                      className="inline-block mt-4 text-label-caps text-[10px] text-[var(--color-primary)] hover:opacity-70">
                      Jelajahi Produk →
                    </Link>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {wishlistProducts.map(p => (
                        <Link key={p.id} href={`/store/${slug}/products/${p.id}`}
                          className="group border border-black/8 rounded overflow-hidden hover:border-[var(--color-primary)]/30 transition-colors">
                          <div className="relative aspect-square bg-[var(--color-secondary)]">
                            {p.image_url && <Image src={p.image_url} alt={p.name} fill sizes="33vw" className="object-cover" />}
                          </div>
                          <div className="p-4 flex items-center justify-between">
                            <div>
                              <p className="text-body-md font-medium group-hover:text-[var(--color-primary)] transition-colors">{p.name}</p>
                              <p className="text-label-caps text-[10px] text-[var(--color-accent)]/50">{fmtPrice(p.price)}</p>
                            </div>
                            <span className="text-label-caps text-[10px] bg-[var(--color-primary)] text-white px-3 py-1.5">
                              ADD
                            </span>
                          </div>
                        </Link>
                      ))}
                    </div>
                    {wishlistTotal > wishlistPageSize && (
                      <div className="flex items-center justify-between pt-6 mt-6 border-t border-black/8">
                        <p className="text-[11px] text-[var(--color-accent)]/40">
                          {(wishlistPage - 1) * wishlistPageSize + 1}–{Math.min(wishlistPage * wishlistPageSize, wishlistTotal)} dari {wishlistTotal} item
                        </p>
                        <div className="flex items-center gap-2">
                          {wishlistPage > 1
                            ? <Link href={`/store/${slug}/profile?wpage=${wishlistPage - 1}`}
                                className="text-label-caps text-[10px] border border-black/15 px-3 py-1.5 hover:bg-[var(--color-secondary)] transition-colors">
                                ← Sebelumnya
                              </Link>
                            : <span className="text-label-caps text-[10px] border border-black/10 px-3 py-1.5 opacity-30">← Sebelumnya</span>
                          }
                          <span className="text-[11px] text-[var(--color-accent)]/40">{wishlistPage} / {Math.ceil(wishlistTotal / wishlistPageSize)}</span>
                          {wishlistPage < Math.ceil(wishlistTotal / wishlistPageSize)
                            ? <Link href={`/store/${slug}/profile?wpage=${wishlistPage + 1}`}
                                className="text-label-caps text-[10px] border border-black/15 px-3 py-1.5 hover:bg-[var(--color-secondary)] transition-colors">
                                Berikutnya →
                              </Link>
                            : <span className="text-label-caps text-[10px] border border-black/10 px-3 py-1.5 opacity-30">Berikutnya →</span>
                          }
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {/* ── SETTINGS ── */}
            {activeTab === 'settings' && (
              <div className="bg-white border border-black/8 rounded p-8">
                <p className={labelCls}>PENGATURAN</p>
                <h2 className="text-headline-lg italic mb-8">Pengaturan akun</h2>
                <form action={async (fd) => {
                  withSave('settings', () => saveProfile(slug, fd))
                }} className="space-y-6 max-w-md">
                  <div>
                    <label className={labelCls}>NAMA LENGKAP</label>
                    <input name="full_name" defaultValue={profile?.full_name ?? ''} className={inputCls} placeholder="Nama Lengkap" />
                  </div>
                  <div>
                    <label className={labelCls}>EMAIL</label>
                    <input defaultValue={user.email} disabled className={`${inputCls} opacity-50 cursor-not-allowed`} />
                    <p className="text-[11px] text-[var(--color-accent)]/40 mt-1 font-sans">Email tidak dapat diubah di sini.</p>
                  </div>
                  <div>
                    <label className={labelCls}>NOMOR WHATSAPP</label>
                    <input name="whatsapp_number" defaultValue={profile?.whatsapp_number ?? ''} className={inputCls} placeholder="+62 812 3456 7890" />
                  </div>
                  <div>
                    <label className={labelCls}>ALAMAT PENGIRIMAN</label>
                    <input name="address" defaultValue={profile?.address ?? ''} className={inputCls} placeholder="Jl. Melati No. 12, Jakarta" />
                  </div>
                  <button type="submit" disabled={isPending}
                    className="bg-[var(--color-primary)] text-white text-label-caps tracking-widest px-8 py-3 hover:opacity-90 transition-opacity disabled:opacity-60 flex items-center gap-2">
                    {saved === 'settings' ? <><Check size={14} />TERSIMPAN</> : isPending ? 'MENYIMPAN...' : 'SIMPAN PERUBAHAN'}
                  </button>
                </form>
              </div>
            )}

          </main>
        </div>
      </div>
    </div>
  )
}

function OrderTable({ orders, slug, showDetail = false }: { orders: any[]; slug?: string; showDetail?: boolean }) {
  return (
    <table className="w-full">
      <thead>
        <tr className="border-b border-black/8">
          {['No. Pesanan', 'Tanggal', 'Item', 'Total', 'Status', ...(showDetail ? [''] : [])].map((h, i) => (
            <th key={i} className="text-left text-label-caps text-[10px] text-[var(--color-accent)]/40 pb-4 pr-4">{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {orders.map((o: any) => {
          const itemNames = (o.order_items ?? []).map((i: any) => i.product_name).join(', ') || '-'
          const statusCls = STATUS_STYLES[o.status] ?? 'bg-black/5 text-black/50'
          return (
            <tr key={o.id} className="border-b border-black/5 last:border-0">
              <td className="py-5 pr-4 font-mono text-xs text-[var(--color-primary)]">#{o.id.slice(-8).toUpperCase()}</td>
              <td className="py-5 pr-4 text-body-md text-[var(--color-accent)]/60 whitespace-nowrap">{new Date(o.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
              <td className="py-5 pr-4 text-body-md max-w-[200px] truncate">{itemNames}</td>
              <td className="py-5 pr-4 text-body-md font-medium whitespace-nowrap">{fmtPrice(o.total_amount)}</td>
              <td className="py-5 pr-4">
                <span className={`text-label-caps text-[10px] px-2 py-1 ${statusCls}`}>
                  {STATUS_LABEL[o.status] ?? o.status}
                </span>
              </td>
              {showDetail && slug && (
                <td className="py-5">
                  <Link href={`/store/${slug}/order/${o.id}/track`}
                    className="text-label-caps text-[10px] text-[var(--color-accent)]/40 hover:text-[var(--color-primary)] transition-colors">
                    Detail →
                  </Link>
                </td>
              )}
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}
