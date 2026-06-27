# UMKMku.com — Project Knowledge Base

> Baca ini di awal setiap session. Ini adalah satu-satunya source of truth untuk keputusan arsitektur, produk, dan teknis.

---

## Framework Guardrails (BACA DULU)

**Peran AI di proyek ini:** co-founder & CTO yang **menantang ide, bukan menyetujui**. Definisi lengkap: [`docs/COFOUNDER_ROLE.md`](docs/COFOUNDER_ROLE.md). Baca itu di awal tiap diskusi strategis.

Sebelum membangun atau mengubah fitur APA PUN, lewati gerbang framework: **invoke skill `umkmku-feature`**.

Tiga lapis yang menjaga konsistensi:

1. **CLAUDE.md (file ini)** — WHAT kita bangun + keputusan final.
2. **Memory project** — peran, gotcha teknis & status terkini:
   - `role-cofounder-cto` — peran Claude: co-founder & CTO yang MENANTANG ide
   - `architecture-patterns` — 4 pola wajib
   - `tech-gotchas-ai-ollama` — jebakan mahal (AI SDK+Ollama+Gemma)
   - `prototype-status` — apa yang sudah/belum jalan
   - `feedback-cara-kerja` — gaya kerja Naufa
3. **Skill `umkmku-feature`** — checklist eksekusi.

⚠️ **Jebakan paling mahal:** chat AI **tidak boleh** lewat AI SDK `streamText`/`generateText` dengan Ollama+Gemma (balik kosong karena thinking mode). Pakai Ollama native `/api/chat` + `think: false`. Detail di memory `tech-gotchas-ai-ollama`.

---

## Visi & Misi

**Mission:** Membebaskan brand lokal Indonesia dari ketergantungan platform, dan membangun fondasi digital yang benar-benar mereka miliki.

**Vision:** Dunia di mana setiap brand lokal memiliki identitas digital sendiri — pelanggannya sendiri, datanya sendiri, dan kanal penjualannya sendiri.

**Category:** Web + Marketplace Builder untuk UMKM lokal Indonesia.

**Category Enemy:** Marketplace-as-foundation (bukan marketplace sebagai channel).

---

## Ideal Customer Profile (ICP)

**Target Utama (Fase 1):** Brand lokal Indonesia (skincare, parfum, fashion, food & beverage)

| Dimensi | Detail |
|---|---|
| Revenue | IDR 10–100 juta/bulan |
| Channel saat ini | Instagram/TikTok aktif + Shopee/Tokopedia |
| Tim | Founder + 1–3 orang |
| Tech savviness | Bisa pakai smartphone, familiar Instagram/Canva |
| Pain point | Kehilangan repeat buyer, tidak punya toko sendiri, bergantung marketplace |
| Willingness to pay | IDR 150k–500k/bulan jika ROI jelas |

**Bukan ICP sekarang:** Warung, FMCG, jasa, merchant tanpa social media presence.

---

## Core Product Concept

### Apa yang Kita Build

UMKMku adalah **web + marketplace builder** — merchant UMKM bisa punya toko e-commerce sendiri di subdomain mereka, lengkap dengan checkout, payment, dan order management. Bukan sekadar storefront yang redirect ke Tokopedia/Shopee.

Merchant bisa:

1. **Onboarding via AI** — ceritakan bisnis → AI extract config → toko live < 60 detik
2. **Subdomain sendiri** — `nama-brand.umkmku.com`
3. **CMS sederhana** — edit via form langsung (brand, produk, tampilan, halaman)
4. **Toko lengkap** — customers bisa browse, cart, checkout, bayar via QRIS, tracking pesanan
5. **AI Chatbot** — bantu customer temukan produk yang tepat, bisa juga rekomendasikan ke marketplace sebagai channel tambahan
6. **Order management** — merchant kelola pesanan, verifikasi pembayaran (AI-assisted via Gemini Vision), notif WA otomatis
7. **Kepemilikan data** — semua customer, pesanan, dan interaksi tercatat di database merchant sendiri

### Apa yang BUKAN Kita Build di MVP

- Multiple templates (satu template per kategori)
- Mobile app native
- Drag-and-drop page builder
- Integrasi inventory dengan marketplace
- Fitur iklan / marketing automation

---

## Subscription Plans

| Plan | Harga | AI Token | Limit Pesanan | Keterangan |
|---|---|---|---|---|
| Free | Rp 0 | 10.000 token | — | Trial 7 hari, setelah habis suspend total |
| Business | Rp 399.000/bulan | 1.000.000 token | 1.000/bulan | Overage Rp 1.000/pesanan, ditagih bulan depan |
| Enterprise | Rp 599.000/bulan | Internal cap 50M token | Unlimited | Monitor usage, alert jika mendekati cap |

**Top-up pesanan:** Rp 10.000 / 50 pesanan tambahan (bisa dibeli kapan saja)

**Suspend:** Trial habis atau pembayaran gagal → toko suspend total (customer tidak bisa akses) + notif email + WA ke merchant

**Overage pesanan:** Tidak langsung diblokir — notif WA saat kuota tinggal 20%, pesanan tetap masuk dengan biaya overage yang ditagihkan bulan depan.

**AI provider untuk subscription:** Gemini 2.0 Flash (lebih murah, sudah terintegrasi di `lib/ai/gemini.ts`)

---

## Keputusan Arsitektur Kritis

### 1. AI Generate KONFIGURASI, bukan KODE

```
❌ Salah: Prompt → Generate React code → Deploy per merchant
✓ Benar: Prompt → Extract JSON config → Template baca config → Render
```

Satu Next.js app melayani semua merchant. Setiap merchant hanya punya data berbeda di Supabase.

### 2. Template adalah batas CMS

CMS hanya expose field yang template support. Merchant tidak bisa minta feature template yang belum ada.

### 3. AI Layer

Dev (lokal): Ollama + Gemma 4 12b (via Ollama native API, bukan AI SDK — untuk chat)
Production: Gemini 2.0 Flash (`lib/ai/gemini.ts`) untuk chatbot & payment vision
Onboarding: tetap via `lib/ai/provider.ts` (bisa Ollama atau Gemini)

> ⚠️ Chat AI TIDAK lewat Vercel AI SDK + Ollama. Pakai `geminiChat()` dari `lib/ai/gemini.ts` langsung.

### 4. Payment di platform sendiri, marketplace sebagai channel tambahan

Transaksi utama ada di platform UMKMku (QRIS, verifikasi AI). Chatbot boleh juga rekomendasikan link Tokopedia/Shopee sebagai opsi, tapi bukan satu-satunya cara beli.

---

## Tech Stack

| Layer | Technology | Alasan |
|---|---|---|
| Framework | Next.js 16.2.9 (App Router) | SSR + API routes dalam satu project, Vercel-native |
| Language | TypeScript | Type safety untuk multi-tenant config |
| Styling | Tailwind CSS + shadcn/ui | Cepat, consistent |
| Database | Supabase (PostgreSQL) | Real-time, RLS untuk multi-tenant security, built-in auth |
| Storage | Supabase Storage | Foto produk merchant |
| AI (dev/chat) | Ollama + Gemma 4 12b | Gratis, lokal — via native API, bukan AI SDK |
| AI (prod/chat) | Gemini 2.0 Flash | Murah, cepat, sudah ada di `lib/ai/gemini.ts` |
| AI (vision) | Gemini 2.5 Flash | Validasi bukti bayar QRIS |
| AI SDK | Vercel AI SDK v6 | Dipakai untuk onboarding saja |
| Notifikasi | Fonnte API | WhatsApp notification ke merchant & customer |
| Deployment | Vercel | Wildcard subdomain, zero-config Next.js |
| Package Manager | pnpm | Lebih cepat dari npm/yarn |

---

## Database Schema (Ringkasan Aktual)

Tabel lengkap ada di `supabase/migrations/`. Yang paling penting:

```
tenants           — config toko: brand, warna, kontak, chatbot, kategori, halaman
products          — produk per tenant, dengan metadata AI (skin_types, concerns, dll)
orders            — pesanan customer: status, payment, shipping, tracking
order_items       — item per pesanan
order_chats       — percakapan order antara customer ↔ merchant ↔ AI
chat_sessions     — session chatbot toko
user_profiles     — profil customer & merchant (role: customer|merchant|super_admin)
testimonials      — testimoni per toko
wishlists         — wishlist customer per toko

[BELUM ADA — perlu dibuat:]
subscription_plans      — definisi plan (free/business/enterprise)
tenant_subscriptions    — status subscription per tenant, usage tracking
top_up_packages         — paket top-up pesanan
top_up_orders           — pembelian top-up
```

---

## Multi-tenant Routing

```
*.umkmku.com → Vercel → Next.js middleware
  │
  ├── umkmku.com              → /app/page.tsx (landing — BELUM DIBUAT)
  ├── [slug].umkmku.com       → /app/store/[slug]/ (storefront publik)
  └── [slug].umkmku.com/dashboard → /app/(dashboard)/[slug]/ (merchant CMS)
```

Auth guard di middleware: `/profile`, `/orders`, `/checkout`, `/order` → redirect ke login jika belum auth.

---

## Struktur Folder Aktual

```
umkmku/src/
├── app/
│   ├── page.tsx                        ← ROOT: landing page UMKMku (BELUM DIBUAT)
│   ├── (dashboard)/[slug]/             ← Merchant CMS dashboard
│   │   ├── page.tsx                    ← Overview: revenue, pesanan pending, low stock
│   │   ├── appearance/, brand/         ← Edit tampilan & identitas brand
│   │   ├── chatbot/, chats/            ← Config chatbot + lihat percakapan
│   │   ├── orders/                     ← Kelola pesanan
│   │   ├── pages/                      ← Edit halaman about, ingredients, dll
│   │   └── products/                   ← CRUD produk + stock management
│   ├── store/[slug]/                   ← Storefront publik per tenant
│   │   ├── page.tsx                    ← Hero, produk, chatbot, testimoni
│   │   ├── cart/, checkout/            ← Cart + checkout flow
│   │   ├── order/[orderId]/            ← Detail pesanan + chat + tracking
│   │   ├── orders/                     ← Riwayat pesanan customer
│   │   ├── products/[id]/              ← Detail produk
│   │   └── profile/                    ← Edit profil customer
│   └── api/
│       ├── chat/[slug]/                ← Chatbot publik (Ollama → Gemini)
│       ├── order-chat/                 ← Chat pesanan + AI payment verification
│       ├── merchant-chat/              ← Reply manual merchant
│       ├── onboarding/                 ← AI tenant creation
│       ├── orders/, products/          ← CRUD
│       └── cron/cancel-expired/        ← Expired order cancellation (tiap jam)
├── components/
│   ├── store/                          ← Chatbot widget, hero, product grid, navbar, footer
│   ├── checkout/                       ← CheckoutLayout, PriceBreakdown
│   └── ui/                             ← shadcn components
└── lib/
    ├── ai/
    │   ├── gemini.ts                   ← geminiChat (Flash 2.0) + geminiVision (Flash 2.5)
    │   ├── provider.ts                 ← Ollama/Anthropic switch (untuk onboarding)
    │   ├── chatbot.ts                  ← System prompt + parseRecommendations
    │   └── onboarding.ts               ← System prompt onboarding
    ├── analytics/queries.ts            ← Metrics 30 hari (revenue, top products, repeat rate)
    ├── categories/                     ← Validators: skincare, parfum, fashion, fdb
    ├── notifications/whatsapp.ts       ← Fonnte: notif WA merchant & customer
    ├── supabase/                       ← client.ts, server.ts, types.ts
    ├── cart-context.tsx
    ├── tenant.ts                       ← getTenantBySlug()
    └── utils/pricing.ts               ← PPN 12% + Xendit fee 2.5%, formatRupiah
```

---

## Environment Variables

```bash
# Dev
AI_PROVIDER=ollama
OLLAMA_BASE_URL=http://localhost:11434/v1
OLLAMA_MODEL=gemma4:12b
GEMINI_API_KEY=...                      # Wajib — untuk chatbot prod & payment vision

NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_ROOT_DOMAIN=localhost:3000

NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...

FONNTE_TOKEN=...                        # WhatsApp notification
CRON_SECRET=...                         # Auth untuk cron job

# Production (tambahan)
AI_PROVIDER=gemini                      # Switch ke Gemini untuk onboarding
GEMINI_API_KEY=...
```

---

## Validasi Metrics

Platform dianggap siap validasi jika:
- [ ] Merchant bisa onboard dan punya toko live dalam < 5 menit
- [ ] Toko bisa diakses via subdomain custom
- [ ] Customer bisa checkout dan bayar via QRIS
- [ ] Merchant bisa verifikasi pembayaran dan update status pesanan
- [ ] Chatbot bisa merekomendasikan produk untuk minimal 3 concern berbeda
- [ ] Merchant bisa edit konten dan upload foto via CMS
- [ ] Subscription enforcement berjalan: trial 7 hari, suspend jika habis

---

## Keputusan yang Sudah Final (Jangan Dibuka Lagi)

1. **Stack:** Next.js + Supabase + Vercel — tidak ganti
2. **AI approach:** Config generation, bukan code generation — tidak ganti
3. **Template:** Satu template per kategori — tidak tambah sebelum validasi
4. **Transaksi:** Di platform sendiri via QRIS — payment gateway eksternal (Midtrans/Xendit) setelah validasi
5. **CMS:** Form langsung, bukan visual drag-and-drop — tidak ganti
6. **AI prod:** Gemini 2.0 Flash — tidak ganti ke Anthropic/Claude untuk saat ini
7. **Subscription:** Free (10k token, 7 hari) / Business (Rp 399k, 1M token) / Enterprise (Rp 599k, 50M token cap)
8. **Suspend:** Trial habis = suspend total, bukan partial lock
9. **Nama:** UMKMku.com — final
