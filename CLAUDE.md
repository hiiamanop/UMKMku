# UMKMku.com, Project Knowledge Base

> Baca ini di awal setiap session. Ini adalah satu-satunya source of truth untuk keputusan arsitektur, produk, dan teknis.
> **Terakhir diperbarui:** 2026-06-30 (sesi 5, logo image + build fix)

---

## Framework Guardrails (BACA DULU)

**Peran AI di proyek ini:** co-founder & CTO yang **menantang ide, bukan menyetujui**. Definisi lengkap: [`docs/COFOUNDER_ROLE.md`](docs/COFOUNDER_ROLE.md). Baca itu di awal tiap diskusi strategis.

Sebelum membangun atau mengubah fitur APA PUN, lewati gerbang framework: **invoke skill `umkmku-feature`**.

Tiga lapis yang menjaga konsistensi:

1. **CLAUDE.md (file ini)**, WHAT kita bangun + keputusan final.
2. **Memory project**, peran, gotcha teknis & status terkini (lihat `memory/`)
3. **Skill `umkmku-feature`**, checklist eksekusi.
4. **[`docs/HANDOVER.md`](docs/HANDOVER.md)**, log perubahan per session.

⚠️ **Jebakan paling mahal:** chat AI **tidak boleh** lewat AI SDK `streamText`/`generateText` dengan Ollama+Gemma (balik kosong karena thinking mode). Pakai Ollama native `/api/chat` + `think: false`.

---

## Visi & Misi

**Mission:** Membebaskan brand lokal Indonesia dari ketergantungan platform, dan membangun fondasi digital yang benar-benar mereka miliki.

**Vision:** Dunia di mana setiap brand lokal memiliki identitas digital sendiri, pelanggannya sendiri, datanya sendiri, dan kanal penjualannya sendiri.

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

UMKMku adalah **web + marketplace builder**, merchant UMKM bisa punya toko e-commerce sendiri di subdomain mereka, lengkap dengan checkout, payment, dan order management. Bukan sekadar storefront yang redirect ke Tokopedia/Shopee.

Merchant bisa:

1. **Onboarding via AI**, ceritakan bisnis → AI extract config → toko live < 60 detik
2. **Subdomain sendiri**, `nama-brand.umkmu.site`
3. **CMS sederhana**, edit via form langsung (brand, produk, tampilan, halaman)
4. **Toko lengkap**, customers bisa browse, cart, checkout, bayar via QRIS, tracking pesanan
5. **AI Chatbot**, bantu customer temukan produk yang tepat, bisa juga rekomendasikan ke marketplace sebagai channel tambahan
6. **Order management**, merchant kelola pesanan, verifikasi pembayaran (AI-assisted via Gemini Vision), notif WA otomatis
7. **Kepemilikan data**, semua customer, pesanan, dan interaksi tercatat di database merchant sendiri

### Apa yang BUKAN Kita Build (di MVP ini)

- Mobile app native
- Drag-and-drop page builder
- Integrasi inventory dengan marketplace
- Fitur iklan / marketing automation

> **Catatan:** Template marketplace (freelancer system) sudah ada di codebase tapi belum diaktifkan ke publik.

---

## Subscription Plans

| Plan | Harga | AI Token | Limit Pesanan | Keterangan |
|---|---|---|---|---|
| Free Trial | Rp 0 | 10.000 token | Unlimited | 7 hari, setelah habis suspend total |
| Business | Rp 399.000/bulan | 1.000.000 token | 1.000/bulan | Overage Rp 10K/50 pesanan tambahan |
| Enterprise | Rp 599.000/bulan | Internal cap 50M token | Unlimited | Monitor usage, alert jika mendekati cap |

**Top-up pesanan:** Rp 10.000 / 50 pesanan tambahan (bisa dibeli kapan saja)

**Pricing formula:** `final = (subtotal × 1.12) × 1.025` (PPN 12% + Xendit fee 2.5%)

**Suspend:** Trial habis atau pembayaran gagal → toko suspend total + notif email + WA ke merchant

**Overage pesanan:** Notif WA saat kuota tinggal 20% (`notified_80pct` flag), pesanan tetap masuk, biaya ditagihkan bulan depan.

**Payment flow subscription:** Manual QRIS (onboarding) → Xendit invoice (recurring upgrade)

---

## Keputusan Arsitektur Kritis

### 1. AI Generate KONFIGURASI, bukan KODE

```
❌ Salah: Prompt → Generate React code → Deploy per merchant
✓ Benar: Prompt → Extract JSON config → Template baca config → Render
```

Satu Next.js app melayani semua merchant. Setiap merchant hanya punya data berbeda di Supabase.

### 2. Template adalah batas CMS

CMS hanya expose field yang template support. Merchant tidak bisa minta feature template yang belum ada. 4 template default tersedia (skincare, parfum, fashion, fnb). Freelancer bisa submit template baru via `/freelancer/submit`.

### 3. AI Layer

```
Dev (lokal):  Ollama + Gemma 4 12b, via native /api/chat, BUKAN Vercel AI SDK
Prod (chat):  Gemini 2.0 Flash, lib/ai/gemini.ts → geminiChat()
Prod (vision): Gemini 2.5 Flash, lib/ai/gemini.ts → geminiVision()
Onboarding:   lib/ai/provider.ts, switch Ollama/Gemini via AI_PROVIDER env
Fallback:     DeepSeek API, lib/ai/deepseek.ts
```

> ⚠️ Chat AI TIDAK lewat Vercel AI SDK + Ollama. Pakai `geminiChat()` dari `lib/ai/gemini.ts` langsung.

### 4. Payment di platform sendiri, marketplace sebagai channel tambahan

Transaksi utama ada di platform UMKMku (QRIS + Xendit). Chatbot boleh juga rekomendasikan link Tokopedia/Shopee sebagai opsi, tapi bukan satu-satunya cara beli.

---

## Tech Stack

| Layer | Technology | Catatan |
|---|---|---|
| Framework | Next.js 16.2.9 (App Router) | SSR + API routes, Vercel-native |
| Language | TypeScript 5 | Type safety multi-tenant |
| Styling | Tailwind CSS v4 + shadcn/ui | |
| Database | Supabase (PostgreSQL) | RLS untuk multi-tenant security |
| Storage | Supabase Storage | Foto produk merchant |
| Auth | Supabase Auth | OAuth callback di `/api/auth/callback` |
| AI (dev/chat) | Ollama + Gemma 4 12b | Via native API, bukan AI SDK |
| AI (prod/chat) | Gemini 2.0 Flash | `lib/ai/gemini.ts` |
| AI (vision) | Gemini 2.5 Flash | Validasi bukti bayar QRIS |
| AI SDK | Vercel AI SDK v6 | Onboarding saja (bukan chat) |
| AI fallback | DeepSeek API | `lib/ai/deepseek.ts` |
| Notifikasi WA | Fonnte API | `lib/notifications/whatsapp.ts` |
| Email | Resend | `lib/email/` |
| Payment | Xendit | Subscription invoices + webhook |
| Analytics | Vercel Analytics + Speed Insights | Built-in |
| Deployment | Vercel | Wildcard subdomain |
| Package Manager | pnpm | |

---

## Database Schema (Aktual, 31 migrations)

Tabel lengkap ada di `supabase/migrations/`.

```
CORE MERCHANT
tenants                , config toko: brand, warna, kontak, chatbot, kategori, halaman (JSONB)
products               , produk per tenant + metadata AI (skin_types, concerns, ingredients)
customers              , CRM: total_orders, total_spent, last_order_at per tenant
testimonials           , testimoni per toko

ORDER FLOW
orders                 , pesanan: status, payment, AI verification result
order_items            , item per pesanan (product_id, qty, price_at_purchase)
order_chats            , chat order: customer ↔ merchant ↔ AI
chat_sessions          , session chatbot: messages (JSONB), recommended_products

USER & AUTH
user_profiles          , profil customer & merchant (linked auth.users, auto-created via trigger)

SUBSCRIPTION & BILLING
subscription_plans      ✅, definisi plan (free/business/enterprise), sudah di-seed
tenant_subscriptions    ✅, status subscription per tenant, usage tracking (ai_tokens_used, transactions_used, notified_80pct)
subscription_invoices   ✅, invoice tracking (manual_qris / xendit), linked ke onboarding
top_up_packages         ✅, paket top-up (50 pesanan = Rp 10K)
top_up_orders           ✅, pembelian top-up per tenant

TEMPLATE MARKETPLACE
templates              , registry template (skincare/parfum/fashion/fnb default, +freelancer submissions)
template_submissions   , submission dari freelancer (pending/approved/rejected/live)
template_usage         , template aktif per tenant (auto-sync via trigger)
commission_ledger      , earnings freelancer per period (pending/requested/paid)
freelancers            , profil freelancer (payment_info JSONB, total_earnings)

ADMIN & PLATFORM
categories             , 4 kategori aktif (skincare, parfum, fashion, fdb)
promo_codes            , kode diskon (percentage/fixed, usage_limit, valid_until)
platform_settings      , key-value config platform (admin-only)
articles               , artikel blog (draft/published, AI-generated)
```

---

## Multi-tenant Routing

```
*.umkmu.site → Vercel → Next.js middleware
  │
  ├── umkmu.site                     → /app/page.tsx (landing page, ✅ SUDAH ADA)
  ├── umkmu.site/pricing             → /app/pricing/
  ├── umkmu.site/insight             → /app/insight/
  ├── umkmu.site/subscribe           → /app/subscribe/
  ├── umkmu.site/admin               → /app/admin/ (protected, super_admin only)
  ├── umkmu.site/freelancer          → /app/freelancer/
  ├── [slug].umkmu.site              → /app/store/[slug]/ (storefront publik)
  └── [slug].umkmu.site/dashboard   → /app/(dashboard)/[slug]/ (merchant CMS)
```

Middleware guard: `/profile`, `/orders`, `/checkout`, `/order` → redirect ke login jika belum auth.
Admin guard: `/admin/*` (kecuali `/admin/login`) → cek session super_admin.

---

## Struktur Folder Aktual

```
umkmku/src/
├── app/
│   ├── page.tsx                          ← Landing page UMKMku ✅
│   ├── pricing/                          ← Halaman perbandingan pricing ✅
│   ├── insight/                          ← Analytics/insight publik ✅
│   ├── subscribe/                        ← Subscription landing + checkout ✅
│   │   └── checkout/
│   ├── auth/reset-password/              ← Password reset
│   ├── admin/                            ← Admin panel (super_admin only) ✅
│   │   ├── page.tsx                      ← Dashboard admin
│   │   ├── login/
│   │   ├── merchants/leads/, ongoing/    ← Merchant pipeline
│   │   ├── invoices/                     ← Kelola invoice subscription
│   │   ├── articles/, articles/generate/ ← Blog + AI generate artikel
│   │   ├── categories/                   ← Kelola kategori
│   │   ├── promos/                       ← Kode promo + broadcast
│   │   ├── settings/                     ← Platform settings
│   │   └── templates/                    ← Template gallery management
│   ├── freelancer/                       ← Freelancer workspace ✅
│   │   ├── login/, register/
│   │   ├── dashboard/                    ← Earnings + submission status
│   │   └── submit/                       ← Submit template baru
│   ├── (dashboard)/                      ← Merchant area (auth-gated)
│   │   ├── onboarding/                   ← AI onboarding wizard ✅
│   │   └── [slug]/                       ← Per-merchant dashboard
│   │       ├── page.tsx                  ← Overview: revenue, pending, low stock
│   │       ├── brand/                    ← Brand identity editor
│   │       ├── appearance/               ← Warna, font, layout
│   │       ├── chatbot/                  ← Chatbot persona config
│   │       ├── chats/                    ← History percakapan chatbot
│   │       ├── products/                 ← CRUD produk + stock
│   │       ├── orders/                   ← Kelola pesanan
│   │       ├── subscription/             ← Status plan + top-up ✅
│   │       └── pages/                    ← Editor konten halaman
│   │           ├── about/
│   │           ├── auth/
│   │           ├── ingredients/
│   │           └── sustainability/
│   ├── store/[slug]/                     ← Storefront publik per tenant ✅
│   │   ├── page.tsx                      ← Hero, produk, chatbot, testimoni
│   │   ├── shop/                         ← Product listing
│   │   ├── products/[id]/               ← Detail produk
│   │   ├── cart/                         ← Shopping cart
│   │   ├── checkout/                     ← QRIS checkout
│   │   ├── login/, register/             ← Customer auth
│   │   ├── profile/                      ← Edit profil customer
│   │   ├── orders/                       ← Riwayat pesanan
│   │   ├── order/[orderId]/              ← Detail pesanan
│   │   │   ├── chat/                     ← Chat dengan merchant/AI
│   │   │   ├── track/                    ← Tracking status
│   │   │   └── processing/               ← Waiting for payment confirm
│   │   └── track/                        ← Guest order tracking
│   └── api/                              ← 45 API routes total
│       ├── admin/                        ← articles, categories, invoices, merchants, promos, settings, subscription, templates
│       ├── auth/callback/, signout/
│       ├── chat/[slug]/                  ← Chatbot (streaming, quota check)
│       ├── landing/chat/                 ← Landing page chatbot
│       ├── merchant-chat/               ← Reply manual merchant
│       ├── order-chat/                  ← Chat pesanan + AI payment verify
│       ├── onboarding/                  ← AI tenant creation + adjust/assist/preview
│       ├── subscribe/create-invoice/    ← Xendit / manual QRIS invoice ✅
│       ├── subscribe/verify-payment/    ✅
│       ├── topup/                       ✅
│       ├── orders/, products/           ← CRUD
│       ├── promo/validate/
│       ├── tenant/[slug]/content/       ← Get/patch tenant content
│       ├── tenants/, tenants/[id]/template/
│       ├── upload/                      ← File upload handler
│       ├── webhooks/xendit/             ← Payment webhook ✅
│       ├── freelancer/register/, submit/, payout/
│       ├── dashboard/assistant/         ← Merchant AI assistant
│       ├── health/
│       └── cron/
│           ├── cancel-expired/          ← Cancel expired orders (tiap jam)
│           ├── suspend-expired/         ← Suspend expired subscriptions ✅
│           └── calculate-commission/    ← Hitung komisi freelancer
├── components/
│   ├── landing/                         ← LandingChat widget
│   ├── store/                           ← Chatbot widget, hero, product grid, navbar, footer, about, ingredients, edit-mode-overlay
│   ├── templates/                       ← Template-specific components per kategori
│   │   ├── skincare/                    ← home, navbar, footer, hero, product-grid, shop, testimonials, ingredients, sustainability
│   │   ├── parfum/                      ← home, navbar, footer, hero, product-grid, shop, testimonials, discovery, manifesto, ritual
│   │   ├── fashion/                     ← home, navbar, footer, hero, product-grid, shop, testimonials, categories, brand-statement
│   │   └── fnb/                         ← home, navbar, footer, hero, product-grid, shop, testimonials, features, promo-banner
│   ├── checkout/                        ← CheckoutLayout, PriceBreakdown
│   ├── dashboard/                       ← AssistantChat
│   └── ui/                              ← shadcn primitives
└── lib/
    ├── ai/
    │   ├── gemini.ts                    ← geminiChat (Flash 2.0) + geminiVision (Flash 2.5)
    │   ├── provider.ts                  ← Ollama/Gemini switch (onboarding)
    │   ├── deepseek.ts                  ← DeepSeek fallback
    │   ├── chatbot.ts                   ← System prompt + parseRecommendations
    │   └── onboarding.ts               ← System prompt onboarding (4 kategori)
    ├── analytics/queries.ts             ← Metrics 30 hari (revenue, top products, repeat rate)
    ├── categories/                      ← Type definitions + validators: skincare, parfum, fashion, fdb
    ├── notifications/
    │   └── whatsapp.ts                 ← Fonnte: notif WA merchant & customer
    ├── email/                           ← Resend integration
    ├── templates/                       ← Template utilities
    ├── supabase/                        ← client.ts, server.ts, types.ts
    ├── cart-context.tsx
    ├── tenant.ts                        ← getTenantBySlug()
    └── utils/pricing.ts                ← PPN 12% + Xendit fee 2.5%, formatRupiah
```

---

## Environment Variables

```bash
# AI
AI_PROVIDER=ollama                      # Production: gemini
OLLAMA_BASE_URL=http://localhost:11434/v1
OLLAMA_MODEL=gemma4:12b
GEMINI_API_KEY=                         # Wajib, chatbot prod & payment vision

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_ROOT_DOMAIN=localhost:3000

# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Notifications
FONNTE_TOKEN=                           # WhatsApp
# Email (opsional)
RESEND_API_KEY=

# Payment
XENDIT_API_KEY=
XENDIT_WEBHOOK_TOKEN=

# Security
CRON_SECRET=                            # Auth untuk cron endpoints
```

---

## Validasi Metrics

Platform dianggap siap validasi jika:

| Checklist | Status |
|-----------|--------|
| Merchant bisa onboard + toko live < 5 menit | ✅ Implemented |
| Toko bisa diakses via subdomain custom | ✅ Implemented |
| Customer bisa checkout dan bayar via QRIS | ✅ Implemented |
| Merchant bisa verifikasi pembayaran (AI Vision) | ✅ Implemented |
| Chatbot bisa rekomendasikan produk ≥ 3 concern | ✅ Implemented |
| Merchant bisa edit konten dan upload foto via CMS | ✅ Implemented |
| Subscription enforcement: trial 7 hari, suspend | ✅ Implemented (cron: suspend-expired) |
| Landing page publik | ✅ Implemented |
| Admin panel | ✅ Implemented |

---

## Checkpoint & Handover

> Log perubahan per session ada di [`docs/HANDOVER.md`](docs/HANDOVER.md).

### Status per Area (2026-06-30)

| Area | Status | Catatan |
|------|--------|---------|
| Build Vercel | ✅ Fixed | getUserByEmail → listUsers (sesi 5); cast error route.ts:78 (sesi 1) |
| Landing page | ✅ Done | Hero, pricing, testimonials, CTA |
| Subscription system | ✅ Done | Plans, invoices, top-up, cron suspend |
| Merchant dashboard | ✅ Done | Full CRUD produk, orders, appearance, chatbot |
| Storefront per tenant | ✅ Done | 4 template kategori |
| Admin panel | ✅ Done | Merchants, invoices, articles, promos, settings |
| Freelancer system | ✅ Public | Link di footer landing page, full flow: register → submit → dashboard |
| AI onboarding | ✅ Done | 4 kategori, < 60 detik |
| AI chatbot | ✅ Done | Quota check, Gemini prod / Ollama dev |
| Payment Xendit | ✅ Done | Invoice + webhook |
| WhatsApp notif | ✅ Done | Fonnte |
| **Security** | ✅ Hardened | 8 CRITICAL + 8 HIGH + 6 MEDIUM fixed, 18 tiket |
| **SEO** | ✅ Done | Dynamic metadata, sitemap, robots, JSON-LD |
| **Legal pages** | ✅ Draft | `/privacy` + `/terms`, perlu review lawyer |
| **Logo** | ✅ Done | `logo.png` di semua 18 halaman, navbar, footer, admin, login |
| OG image | ⚠️ Missing | `/public/og-image.png` belum ada |
| Public blog | 📋 Next | `/blog/[slug]` belum ada, artikel tidak bisa diindex |

---

## Keputusan yang Sudah Final (Jangan Dibuka Lagi)

1. **Stack:** Next.js + Supabase + Vercel, tidak ganti
2. **AI approach:** Config generation, bukan code generation, tidak ganti
3. **Template:** Satu template default per kategori, tidak tambah sebelum validasi (freelancer system ada tapi belum diaktifkan publik)
4. **Transaksi:** Di platform sendiri via QRIS + Xendit subscription
5. **CMS:** Form langsung, bukan visual drag-and-drop, tidak ganti
6. **AI prod:** Gemini 2.0 Flash, tidak ganti ke Anthropic/Claude untuk saat ini
7. **Subscription:** Free Trial (10k token, 7 hari) / Business (Rp 399k, 1M token, 1K txn) / Enterprise (Rp 599k, 50M token cap)
8. **Suspend:** Trial habis = suspend total, bukan partial lock
9. **Nama:** UMKMku.com, final

---

## Gotcha Teknis (jangan diulang)

- `supabase.auth.admin.getUserByEmail()` **tidak exist** di Supabase JS v2, gunakan `listUsers().find()` atau query DB
- Logo dalam `flex-col` parent perlu `self-start` class agar tidak di-stretch horizontal
- Chat AI **tidak boleh** lewat Vercel AI SDK + Ollama, pakai `geminiChat()` dari `lib/ai/gemini.ts` langsung
