# Plan 2: AI Onboarding, Config Extraction dari Merchant Description

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Merchant bisa ceritakan bisnis skincare mereka dalam teks bebas, AI mengekstrak konfigurasi terstruktur, tenant baru dibuat di Supabase, dan subdomain langsung aktif.

**Architecture:** Chat interface di `/onboarding` mengirim pesan ke API route `/api/onboarding`. API route memanggil AI (Ollama/Claude) dengan structured output prompt, menyimpan hasilnya ke Supabase, dan mengembalikan slug subdomain yang sudah aktif.

**Tech Stack:** Vercel AI SDK v4 (generateObject), Zod untuk schema validation, Supabase service client

## Global Constraints

- Lihat Global Constraints di Plan 1
- Onboarding hanya untuk skincare brand di fase ini
- AI harus return JSON valid, bukan markdown atau teks bebas
- Slug di-generate dari brand_name secara otomatis (lowercase, spaces → hyphens)
- Jika slug sudah ada, tambahkan suffix angka (glow-id-2, glow-id-3, dst)
- Semua input merchant di-sanitize sebelum disimpan

---

### Task 1: Onboarding Page UI

**Files:**
- Create: `src/app/(dashboard)/onboarding/page.tsx`
- Create: `src/app/(dashboard)/layout.tsx`
- Create: `src/app/(dashboard)/onboarding/_components/onboarding-chat.tsx`

**Interfaces:**
- Produces: UI onboarding yang menerima teks merchant dan menampilkan progress/hasil

- [ ] **Step 1: Buat dashboard layout**

Buat `src/app/(dashboard)/layout.tsx`:

```typescript
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'UMKMku, Dashboard',
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b px-6 py-4">
        <span className="font-semibold text-lg">UMKMku.com</span>
      </header>
      <main className="max-w-2xl mx-auto px-4 py-8">{children}</main>
    </div>
  )
}
```

- [ ] **Step 2: Buat onboarding page**

Buat `src/app/(dashboard)/onboarding/page.tsx`:

```typescript
import { OnboardingChat } from './_components/onboarding-chat'

export default function OnboardingPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Ceritakan bisnis kamu</h1>
        <p className="text-gray-500 mt-1">
          Ceritakan brand skincare kamu, nama, produk, warna favorit, siapa target customer kamu.
          Semakin detail semakin bagus. Kami akan buatkan toko kamu dalam hitungan detik.
        </p>
      </div>
      <OnboardingChat />
    </div>
  )
}
```

- [ ] **Step 3: Buat OnboardingChat component**

Buat `src/app/(dashboard)/onboarding/_components/onboarding-chat.tsx`:

```typescript
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Loader2 } from 'lucide-react'

type Status = 'idle' | 'loading' | 'success' | 'error'

interface OnboardingResult {
  slug: string
  brand_name: string
  store_url: string
}

export function OnboardingChat() {
  const [description, setDescription] = useState('')
  const [status, setStatus] = useState<Status>('idle')
  const [result, setResult] = useState<OnboardingResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!description.trim() || status === 'loading') return

    setStatus('loading')
    setError(null)

    try {
      const response = await fetch('/api/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error ?? 'Terjadi kesalahan')
      }

      const data: OnboardingResult = await response.json()
      setResult(data)
      setStatus('success')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan')
      setStatus('error')
    }
  }

  if (status === 'success' && result) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-6 space-y-3">
        <h2 className="font-semibold text-green-800">
          Toko {result.brand_name} sudah aktif!
        </h2>
        <p className="text-green-700">
          Toko kamu bisa diakses di:{' '}
          <a
            href={result.store_url}
            target="_blank"
            className="font-mono underline"
          >
            {result.store_url}
          </a>
        </p>
        <Button
          onClick={() => window.open(`/dashboard/${result.slug}`, '_self')}
        >
          Buka Dashboard Toko
        </Button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder={`Contoh: Saya jualan skincare lokal nama Glow.id, brand saya identik dengan warna hijau sage dan krem. Produk saya ada 3: Vitamin C Serum untuk mencerahkan kulit, Barrier Moisturizer untuk semua jenis kulit, dan Daily Sunscreen SPF 50. Target customer saya wanita 20-35 tahun yang peduli kulit. WA saya 08123456789.`}
        className="min-h-[180px] resize-none"
        disabled={status === 'loading'}
      />
      {error && (
        <p className="text-red-600 text-sm">{error}</p>
      )}
      <Button
        type="submit"
        disabled={!description.trim() || status === 'loading'}
        className="w-full"
      >
        {status === 'loading' ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            AI sedang memproses...
          </>
        ) : (
          'Buat Toko Saya'
        )}
      </Button>
    </form>
  )
}
```

- [ ] **Step 4: Verify UI renders**

```bash
pnpm dev
```

Buka `http://localhost:3000/onboarding`, harus tampil form textarea dan tombol.

- [ ] **Step 5: Commit**

```bash
git add .
git commit -m "feat: add onboarding page and chat UI"
```

---

### Task 2: Onboarding API, AI Config Extraction

**Files:**
- Create: `src/app/api/onboarding/route.ts`
- Create: `src/lib/ai/onboarding.ts`
- Create: `src/__tests__/onboarding.test.ts`

**Interfaces:**
- Consumes: `POST { description: string }`
- Consumes: `getAIModel()` dari `@/lib/ai/provider`
- Consumes: `createServiceClient()` dari `@/lib/supabase/server`
- Produces: `{ slug, brand_name, store_url }` atau `{ error: string }`

- [ ] **Step 1: Buat Zod schema untuk extracted config**

Buat `src/lib/ai/onboarding.ts`:

```typescript
import { z } from 'zod'

export const extractedConfigSchema = z.object({
  brand_name: z.string().min(1),
  tagline: z.string().nullable(),
  description: z.string().min(1),
  primary_color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  secondary_color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  accent_color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  whatsapp_number: z.string().nullable(),
  instagram_url: z.string().nullable(),
  chatbot_persona: z.string(),
  products: z.array(z.object({
    name: z.string().min(1),
    description: z.string(),
    price: z.number().nullable(),
    skin_types: z.array(z.enum(['oily', 'combination', 'dry', 'sensitive', 'all'])),
    concerns: z.array(z.enum(['acne', 'brightening', 'anti-aging', 'hydrating', 'pores', 'soothing', 'firming'])),
    ingredients: z.array(z.string()),
    usage_step: z.enum(['cleanser', 'toner', 'serum', 'moisturizer', 'sunscreen', 'treatment', 'mask']).nullable(),
  })).min(1),
})

export type ExtractedConfig = z.infer<typeof extractedConfigSchema>

export function generateSlug(brandName: string): string {
  return brandName
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 50)
}

export const ONBOARDING_SYSTEM_PROMPT = `Kamu adalah asisten onboarding UMKMku.com untuk brand skincare lokal Indonesia.
Tugasmu: ekstrak informasi bisnis dari cerita merchant dan kembalikan sebagai JSON yang valid.

Aturan:
- Jika warna tidak disebutkan, pilih warna yang cocok untuk brand skincare (soft, clean, premium)
- primary_color: warna utama brand
- secondary_color: warna background atau pelengkap
- accent_color: warna highlight atau CTA
- Semua warna dalam format hex (#rrggbb)
- Jika harga tidak disebutkan, set null
- chatbot_persona: deskripsi kepribadian beauty advisor untuk brand ini (1-2 kalimat)
- Jika Instagram tidak disebutkan, set null
- Jika WhatsApp tidak disebutkan, set null
- Jawab HANYA dengan JSON, tidak ada teks lain`
```

- [ ] **Step 2: Install Zod jika belum**

```bash
pnpm add zod
```

- [ ] **Step 3: Write test untuk slug generation**

Buat `src/__tests__/onboarding.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'
import { generateSlug, extractedConfigSchema } from '@/lib/ai/onboarding'

describe('generateSlug', () => {
  it('converts brand name to slug', () => {
    expect(generateSlug('Glow.id')).toBe('glowid')
  })

  it('handles spaces', () => {
    expect(generateSlug('Dapur Bunda')).toBe('dapur-bunda')
  })

  it('handles multiple spaces', () => {
    expect(generateSlug('My  Brand  Name')).toBe('my-brand-name')
  })

  it('truncates to 50 chars', () => {
    const long = 'a'.repeat(60)
    expect(generateSlug(long)).toHaveLength(50)
  })
})

describe('extractedConfigSchema', () => {
  it('validates valid config', () => {
    const valid = {
      brand_name: 'Glow.id',
      tagline: 'Glow from within',
      description: 'Brand skincare lokal',
      primary_color: '#1a1a1a',
      secondary_color: '#f5f5f5',
      accent_color: '#d4a574',
      whatsapp_number: '08123456789',
      instagram_url: null,
      chatbot_persona: 'Friendly beauty expert',
      products: [{
        name: 'Vitamin C Serum',
        description: 'Mencerahkan kulit',
        price: 150000,
        skin_types: ['oily', 'combination'],
        concerns: ['brightening'],
        ingredients: ['vitamin-c'],
        usage_step: 'serum',
      }],
    }
    expect(() => extractedConfigSchema.parse(valid)).not.toThrow()
  })

  it('rejects invalid hex color', () => {
    const invalid = {
      brand_name: 'Test',
      tagline: null,
      description: 'Test',
      primary_color: 'red',  // invalid
      secondary_color: '#f5f5f5',
      accent_color: '#d4a574',
      whatsapp_number: null,
      instagram_url: null,
      chatbot_persona: 'test',
      products: [],
    }
    expect(() => extractedConfigSchema.parse(invalid)).toThrow()
  })
})
```

- [ ] **Step 4: Run test, FAIL**

```bash
pnpm test
```

Expected: `generateSlug` dan `extractedConfigSchema` tests fail karena belum ada.

- [ ] **Step 5: Verifikasi implementation di onboarding.ts sudah benar**

```bash
pnpm test
```

Expected: All tests pass setelah Task 2 Step 1 di atas selesai.

- [ ] **Step 6: Buat API route**

Buat `src/app/api/onboarding/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { generateObject } from 'ai'
import { getAIModel } from '@/lib/ai/provider'
import { extractedConfigSchema, generateSlug, ONBOARDING_SYSTEM_PROMPT } from '@/lib/ai/onboarding'
import { createServiceClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const description: string = body.description?.trim()

    if (!description || description.length < 20) {
      return NextResponse.json(
        { error: 'Cerita tentang bisnis kamu terlalu singkat. Tolong tambahkan lebih banyak detail.' },
        { status: 400 }
      )
    }

    if (description.length > 3000) {
      return NextResponse.json(
        { error: 'Deskripsi terlalu panjang. Maksimal 3000 karakter.' },
        { status: 400 }
      )
    }

    // Extract config dari AI
    const { object: config } = await generateObject({
      model: getAIModel(),
      schema: extractedConfigSchema,
      system: ONBOARDING_SYSTEM_PROMPT,
      prompt: description,
    })

    // Generate slug unik
    const supabase = createServiceClient()
    const baseSlug = generateSlug(config.brand_name)
    const slug = await ensureUniqueSlug(supabase, baseSlug)

    // Simpan tenant ke Supabase
    const { data: tenant, error: tenantError } = await supabase
      .from('tenants')
      .insert({
        slug,
        brand_name: config.brand_name,
        tagline: config.tagline,
        description: config.description,
        primary_color: config.primary_color,
        secondary_color: config.secondary_color,
        accent_color: config.accent_color,
        whatsapp_number: config.whatsapp_number,
        instagram_url: config.instagram_url,
        chatbot_name: 'Beauty Advisor',
        chatbot_persona: config.chatbot_persona,
      })
      .select('id')
      .single()

    if (tenantError || !tenant) {
      console.error('Tenant insert error:', tenantError)
      return NextResponse.json({ error: 'Gagal membuat toko' }, { status: 500 })
    }

    // Simpan produk
    if (config.products.length > 0) {
      const products = config.products.map((p, index) => ({
        tenant_id: tenant.id,
        name: p.name,
        description: p.description,
        price: p.price,
        skin_types: p.skin_types,
        concerns: p.concerns,
        ingredients: p.ingredients,
        usage_step: p.usage_step,
        sort_order: index,
      }))

      const { error: productsError } = await supabase
        .from('products')
        .insert(products)

      if (productsError) {
        console.error('Products insert error:', productsError)
        // Non-fatal: toko tetap aktif, produk bisa ditambah manual
      }
    }

    const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? 'localhost:3000'
    const storeUrl = `http://${slug}.${rootDomain}`

    return NextResponse.json({
      slug,
      brand_name: config.brand_name,
      store_url: storeUrl,
    })
  } catch (err) {
    console.error('Onboarding error:', err)
    return NextResponse.json(
      { error: 'Terjadi kesalahan sistem. Coba lagi.' },
      { status: 500 }
    )
  }
}

async function ensureUniqueSlug(
  supabase: ReturnType<typeof import('@/lib/supabase/server').createServiceClient>,
  baseSlug: string
): Promise<string> {
  let slug = baseSlug
  let counter = 2

  while (true) {
    const { data } = await supabase
      .from('tenants')
      .select('id')
      .eq('slug', slug)
      .single()

    if (!data) return slug
    slug = `${baseSlug}-${counter}`
    counter++
  }
}
```

- [ ] **Step 7: Test end-to-end manual**

Dengan Ollama berjalan (`ollama serve`):

```bash
curl -X POST http://localhost:3000/api/onboarding \
  -H "Content-Type: application/json" \
  -d '{
    "description": "Saya jualan skincare lokal nama Glow.id. Brand saya warna hijau sage dan krem. Produk saya ada Vitamin C Serum untuk mencerahkan dan Moisturizer untuk semua jenis kulit. Target wanita 20-35 tahun."
  }'
```

Expected response:
```json
{
  "slug": "glowid",
  "brand_name": "Glow.id",
  "store_url": "http://glowid.localhost:3000"
}
```

Cek Supabase dashboard, harus ada 1 tenant dan 2 produk baru.

- [ ] **Step 8: Commit**

```bash
git add .
git commit -m "feat: add AI onboarding API with config extraction and tenant creation"
```

---

## Self-Review Checklist

- [x] Spec coverage: UI onboarding ✓, AI extraction ✓, Supabase insert ✓, unique slug ✓, store URL return ✓
- [x] No placeholders: semua kode aktual
- [x] Error handling: input validation, AI error, DB error semua di-handle
- [x] Types konsisten: `extractedConfigSchema` digunakan di API route dan test
