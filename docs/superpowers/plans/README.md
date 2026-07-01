# UMKMku.com, Implementation Plans

Prototype untuk validasi platform brand infrastructure UMKM skincare lokal Indonesia.

## Urutan Eksekusi

Plans harus dieksekusi berurutan karena ada dependency:

| # | Plan | Output | Dependency |
|---|---|---|---|
| 1 | [Foundation](./2026-06-20-01-foundation.md) | Next.js + Supabase + routing + AI provider | - |
| 2 | [AI Onboarding](./2026-06-20-02-ai-onboarding.md) | Merchant bisa buat toko dari prompt | Plan 1 |
| 3 | [Store Template](./2026-06-20-03-store-template.md) | Toko skincare live di subdomain | Plan 1 |
| 4 | [CMS Dashboard](./2026-06-20-04-cms-dashboard.md) | Merchant bisa edit konten dan produk | Plan 1, 2, 3 |
| 5 | [AI Chatbot](./2026-06-20-05-ai-chatbot.md) | Chatbot rekomendasi produk di toko | Plan 1, 3 |

## Validation Checklist

Platform siap diiklankan jika semua ini ✓:

- [ ] Merchant bisa onboard dan punya toko live dalam < 5 menit
- [ ] Toko bisa diakses via subdomain `nama.umkmku.com`
- [ ] Produk tampil dengan foto, harga, dan link marketplace
- [ ] Merchant bisa edit teks, warna, dan produk via CMS
- [ ] Chatbot bisa merekomendasikan produk untuk minimal 3 skin concern
- [ ] Redirect ke Tokopedia/Shopee dari chatbot berfungsi

## Batas MVP (Jangan Tambah Sebelum Validasi)

- Tidak ada auth/login, merchant akses via link
- Satu template skincare saja
- Tidak ada payment gateway
- Tidak ada analytics dashboard
- Tidak ada SEO tools
- Tidak ada drag-and-drop editor
