---
name: umkmku-feature
description: Use BEFORE building, changing, or extending ANY feature in the UMKMku.com project, onboarding, store template, CMS dashboard, chatbot, routing, or AI integration. Acts as the framework gate that keeps every change aligned with the project's locked architectural decisions and avoids known technical traps.
---

# UMKMku Feature Gate

Gerbang yang harus dilewati SEBELUM menulis kode fitur apa pun di UMKMku.com. Tujuannya: setiap perubahan tetap menempel pada framework, dan tidak mengulang jebakan teknis yang sudah pernah membakar waktu.

Jawab dalam Bahasa Indonesia. Untuk konteks lengkap, sumber kebenaran adalah `CLAUDE.md` (visi, produk, schema) + memory project (`architecture-patterns`, `tech-gotchas-ai-ollama`, `prototype-status`, `feedback-cara-kerja`).

## Langkah 1, Filter Scope (WAJIB, sebelum apa pun)

Tanyakan untuk fitur yang diminta:

1. **Apakah ini membantu merchant punya fondasi digital sendiri, atau feature creep?** Kalau creep → tahan, sampaikan ke Naufa.
2. **Apakah melanggar salah satu keputusan final?** Kalau ya → STOP, diskusikan dulu. Keputusan final:
   - AI generate KONFIGURASI (JSON), bukan kode
   - Satu template skincare untuk prototype (jangan tambah template)
   - Tidak ada auth di prototype (akses via link)
   - Transaksi redirect ke marketplace di v1 (jangan bangun payment)
   - Max 10 pesan per chat session
   - CMS = form + AI chat, bukan visual drag-and-drop
3. **Apakah butuh kapabilitas template baru?** Kalau ya → tambah field di template DULU, baru expose di CMS (template adalah batas CMS).

## Langkah 2, Cek Pola Arsitektur

Pastikan rancangan cocok dengan 4 pola (`architecture-patterns` memory):

- **Config-not-code:** data per-tenant di Supabase, satu app render semua. Jangan generate kode per merchant.
- **Template-as-boundary:** CMS hanya expose yang template dukung.
- **Provider-agnostic AI:** lewat `getAIModel()` / env `AI_PROVIDER`, KECUALI chat (lihat Langkah 3).
- **Multi-tenant routing:** subdomain → middleware → `/store/[slug]`.

## Langkah 3, Hindari Jebakan Teknis (`tech-gotchas-ai-ollama`)

Sebelum sentuh AI atau routing, ingat:

- **Chat AI:** JANGAN pakai AI SDK `streamText`/`generateText` dengan Ollama+Gemma (balik kosong karena thinking mode). Pakai Ollama native `POST /api/chat` dengan `think: false`, parse NDJSON manual. Pola sudah ada di `src/app/api/chat/[slug]/route.ts`.
- **Structured extraction:** jangan andalkan `generateObject` dengan model lokal, `generateText` + parse manual + default per field.
- **Middleware:** harus `return NextResponse.next()` untuk path `/api/` sebelum rewrite.
- **Route group `(dashboard)`:** URL adalah `/[slug]`, bukan `/dashboard/[slug]`.
- **Install paket:** `npx pnpm add <paket>` (bukan `npm install`).

## Langkah 4, Eksekusi sesuai gaya kerja Naufa

- Untuk perubahan besar/keputusan arsitektur: jelaskan rencana dulu, minta konfirmasi (`feedback-cara-kerja`).
- Ikuti pola TDD/test bila ada test di area itu (Vitest, alias `@/*`).
- Setelah selesai, kalau ada perubahan status besar, update memory `prototype-status`.

## Setelah lewat gate

Lanjut implementasi. Kalau menemukan jebakan teknis BARU yang mahal, catat ke memory `tech-gotchas-ai-ollama` supaya tidak terulang.
