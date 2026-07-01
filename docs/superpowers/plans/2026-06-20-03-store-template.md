# Plan 3: Skincare Store Template

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Template toko skincare yang indah, mobile-first, dan fully dynamic, dibaca dari konfigurasi Supabase per tenant. Termasuk hero, product catalog, about section, dan floating chatbot button.

**Architecture:** Server component baca tenant + produk dari Supabase, injeksi warna brand via CSS variables, render template statis. Chatbot widget adalah Client Component terpisah yang di-lazy load.

**Tech Stack:** Next.js App Router (Server Components), Tailwind CSS, CSS variables untuk theming, Supabase server client

## Global Constraints

- Lihat Global Constraints di Plan 1
- Template HARUS berfungsi tanpa JavaScript (kecuali chatbot widget)
- Mobile-first: desain untuk layar 375px, scale up ke desktop
- Warna brand diinjeksi via CSS variables di layout level
- Jika tenant tidak ditemukan (slug tidak valid), return 404
- Semua gambar pakai `next/image` dengan `alt` text yang meaningful
- Template hanya punya satu layout, tidak ada pilihan template lain di MVP

---

### Task 1: Store Layout dan Tenant Data Fetching

**Files:**
- Modify: `src/app/store/[slug]/layout.tsx`
- Modify: `src/app/store/[slug]/page.tsx`
- Create: `src/lib/tenant.ts`

**Interfaces:**
- Consumes: `createClient()` dari `@/lib/supabase/server`
- Consumes: `Tenant`, `Product` dari `@/lib/supabase/types`
- Produces: `getTenantBySlug(slug)` → `{ tenant: Tenant, products: Product[] } | null`

- [ ] **Step 1: Buat tenant fetching utility**

Buat `src/lib/tenant.ts`:

```typescript
import { createClient } from '@/lib/supabase/server'
import type { Tenant, Product } from '@/lib/supabase/types'

export interface TenantWithProducts {
  tenant: Tenant
  products: Product[]
}

export async function getTenantBySlug(slug: string): Promise<TenantWithProducts | null> {
  const supabase = await createClient()

  const { data: tenant, error: tenantError } = await supabase
    .from('tenants')
    .select('*')
    .eq('slug', slug)
    .eq('is_active', true)
    .single()

  if (tenantError || !tenant) return null

  const { data: products } = await supabase
    .from('products')
    .select('*')
    .eq('tenant_id', tenant.id)
    .eq('is_active', true)
    .order('sort_order', { ascending: true })

  return {
    tenant,
    products: products ?? [],
  }
}
```

- [ ] **Step 2: Update store layout dengan CSS variables**

Modifikasi `src/app/store/[slug]/layout.tsx`:

```typescript
import { notFound } from 'next/navigation'
import { getTenantBySlug } from '@/lib/tenant'

interface Props {
  children: React.ReactNode
  params: Promise<{ slug: string }>
}

export default async function StoreLayout({ children, params }: Props) {
  const { slug } = await params
  const data = await getTenantBySlug(slug)

  if (!data) notFound()

  const { tenant } = data

  return (
    <div
      style={{
        '--color-primary': tenant.primary_color,
        '--color-secondary': tenant.secondary_color,
        '--color-accent': tenant.accent_color,
      } as React.CSSProperties}
    >
      {children}
    </div>
  )
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params
  const data = await getTenantBySlug(slug)
  if (!data) return {}

  return {
    title: `${data.tenant.brand_name}${data.tenant.tagline ? `, ${data.tenant.tagline}` : ''}`,
    description: data.tenant.description ?? undefined,
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add .
git commit -m "feat: add tenant data fetching and CSS variable theming"
```

---

### Task 2: Hero Section Component

**Files:**
- Create: `src/components/store/hero.tsx`

**Interfaces:**
- Consumes: `tenant: Tenant` dari `@/lib/supabase/types`
- Produces: `<Hero tenant={tenant} />` server component

- [ ] **Step 1: Buat Hero component**

Buat `src/components/store/hero.tsx`:

```typescript
import Image from 'next/image'
import type { Tenant } from '@/lib/supabase/types'

interface Props {
  tenant: Tenant
}

export function Hero({ tenant }: Props) {
  return (
    <section className="relative min-h-[70vh] flex items-center bg-[var(--color-secondary)]">
      {tenant.hero_image_url && (
        <Image
          src={tenant.hero_image_url}
          alt={`${tenant.brand_name} hero image`}
          fill
          className="object-cover opacity-20"
          priority
        />
      )}

      <div className="relative z-10 max-w-5xl mx-auto px-6 py-20">
        <div className="max-w-lg">
          {tenant.logo_url ? (
            <Image
              src={tenant.logo_url}
              alt={`${tenant.brand_name} logo`}
              width={120}
              height={40}
              className="mb-6 object-contain"
            />
          ) : (
            <p className="text-sm font-medium tracking-widest uppercase text-[var(--color-accent)] mb-3">
              {tenant.brand_name}
            </p>
          )}

          <h1 className="text-4xl md:text-5xl font-bold text-[var(--color-primary)] leading-tight mb-4">
            {tenant.tagline ?? tenant.brand_name}
          </h1>

          {tenant.description && (
            <p className="text-gray-600 text-lg leading-relaxed mb-8">
              {tenant.description}
            </p>
          )}

          <div className="flex flex-wrap gap-3">
            <a
              href="#products"
              className="px-6 py-3 bg-[var(--color-primary)] text-white rounded-full font-medium hover:opacity-90 transition-opacity"
            >
              Lihat Produk
            </a>
            {tenant.whatsapp_number && (
              <a
                href={`https://wa.me/${tenant.whatsapp_number.replace(/[^0-9]/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-6 py-3 border-2 border-[var(--color-primary)] text-[var(--color-primary)] rounded-full font-medium hover:bg-[var(--color-primary)] hover:text-white transition-colors"
              >
                Hubungi Kami
              </a>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add .
git commit -m "feat: add Hero section component for store template"
```

---

### Task 3: Product Grid Component

**Files:**
- Create: `src/components/store/product-card.tsx`
- Create: `src/components/store/product-grid.tsx`

**Interfaces:**
- Consumes: `products: Product[]` dari `@/lib/supabase/types`
- Produces: `<ProductGrid products={products} />` dan `<ProductCard product={product} />`

- [ ] **Step 1: Buat ProductCard component**

Buat `src/components/store/product-card.tsx`:

```typescript
import Image from 'next/image'
import type { Product } from '@/lib/supabase/types'

interface Props {
  product: Product
}

const CONCERN_LABELS: Record<string, string> = {
  acne: 'Anti Jerawat',
  brightening: 'Mencerahkan',
  'anti-aging': 'Anti Aging',
  hydrating: 'Melembapkan',
  pores: 'Mengecilkan Pori',
  soothing: 'Menenangkan',
  firming: 'Mengencangkan',
}

const SKIN_TYPE_LABELS: Record<string, string> = {
  oily: 'Berminyak',
  combination: 'Kombinasi',
  dry: 'Kering',
  sensitive: 'Sensitif',
  all: 'Semua Jenis Kulit',
}

export function ProductCard({ product }: Props) {
  const hasMarketplaceLink = product.tokopedia_url || product.shopee_url

  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
      <div className="relative aspect-square bg-gray-50">
        {product.image_url ? (
          <Image
            src={product.image_url}
            alt={product.name}
            fill
            className="object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-gray-300 text-4xl">🧴</span>
          </div>
        )}
      </div>

      <div className="p-4 space-y-3">
        <div>
          <h3 className="font-semibold text-gray-900">{product.name}</h3>
          {product.usage_step && (
            <p className="text-xs text-[var(--color-accent)] uppercase tracking-wide mt-0.5">
              {product.usage_step}
            </p>
          )}
        </div>

        {product.description && (
          <p className="text-sm text-gray-500 line-clamp-2">{product.description}</p>
        )}

        {product.concerns.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {product.concerns.slice(0, 2).map((concern) => (
              <span
                key={concern}
                className="text-xs px-2 py-0.5 bg-[var(--color-secondary)] text-[var(--color-primary)] rounded-full"
              >
                {CONCERN_LABELS[concern] ?? concern}
              </span>
            ))}
          </div>
        )}

        {product.skin_types.length > 0 && !product.skin_types.includes('all') && (
          <p className="text-xs text-gray-400">
            Untuk kulit: {product.skin_types.map(t => SKIN_TYPE_LABELS[t] ?? t).join(', ')}
          </p>
        )}

        <div className="flex items-center justify-between pt-2 border-t border-gray-50">
          {product.price ? (
            <span className="font-bold text-[var(--color-primary)]">
              Rp {product.price.toLocaleString('id-ID')}
            </span>
          ) : (
            <span className="text-sm text-gray-400">Hubungi untuk harga</span>
          )}

          {hasMarketplaceLink && (
            <div className="flex gap-2">
              {product.tokopedia_url && (
                <a
                  href={product.tokopedia_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs px-3 py-1.5 bg-green-600 text-white rounded-full hover:bg-green-700 transition-colors"
                >
                  Tokopedia
                </a>
              )}
              {product.shopee_url && (
                <a
                  href={product.shopee_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs px-3 py-1.5 bg-orange-500 text-white rounded-full hover:bg-orange-600 transition-colors"
                >
                  Shopee
                </a>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Buat ProductGrid component**

Buat `src/components/store/product-grid.tsx`:

```typescript
import type { Product } from '@/lib/supabase/types'
import { ProductCard } from './product-card'

interface Props {
  products: Product[]
}

export function ProductGrid({ products }: Props) {
  if (products.length === 0) {
    return (
      <section id="products" className="max-w-5xl mx-auto px-6 py-16">
        <p className="text-center text-gray-400">Produk segera hadir.</p>
      </section>
    )
  }

  return (
    <section id="products" className="max-w-5xl mx-auto px-6 py-16">
      <h2 className="text-2xl font-bold text-[var(--color-primary)] mb-8">
        Produk Kami
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add .
git commit -m "feat: add ProductCard and ProductGrid components"
```

---

### Task 4: About Section dan Footer

**Files:**
- Create: `src/components/store/about-section.tsx`
- Create: `src/components/store/store-footer.tsx`

**Interfaces:**
- Consumes: `tenant: Tenant`
- Produces: `<AboutSection tenant={tenant} />`, `<StoreFooter tenant={tenant} />`

- [ ] **Step 1: Buat AboutSection**

Buat `src/components/store/about-section.tsx`:

```typescript
import type { Tenant } from '@/lib/supabase/types'

interface Props {
  tenant: Tenant
}

export function AboutSection({ tenant }: Props) {
  return (
    <section className="bg-[var(--color-secondary)] py-16">
      <div className="max-w-5xl mx-auto px-6">
        <div className="max-w-2xl">
          <h2 className="text-2xl font-bold text-[var(--color-primary)] mb-4">
            Tentang {tenant.brand_name}
          </h2>
          {tenant.description && (
            <p className="text-gray-600 leading-relaxed">{tenant.description}</p>
          )}
          <div className="mt-6 flex flex-wrap gap-4">
            {tenant.whatsapp_number && (
              <a
                href={`https://wa.me/${tenant.whatsapp_number.replace(/[^0-9]/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-[var(--color-accent)] underline"
              >
                WhatsApp
              </a>
            )}
            {tenant.instagram_url && (
              <a
                href={tenant.instagram_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-[var(--color-accent)] underline"
              >
                Instagram
              </a>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
```

- [ ] **Step 2: Buat StoreFooter**

Buat `src/components/store/store-footer.tsx`:

```typescript
import type { Tenant } from '@/lib/supabase/types'

interface Props {
  tenant: Tenant
}

export function StoreFooter({ tenant }: Props) {
  return (
    <footer className="bg-[var(--color-primary)] text-white py-8">
      <div className="max-w-5xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4">
        <span className="font-semibold">{tenant.brand_name}</span>
        <span className="text-xs text-white/50">
          Powered by{' '}
          <a
            href="https://umkmku.com"
            className="underline hover:text-white transition-colors"
          >
            UMKMku.com
          </a>
        </span>
      </div>
    </footer>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add .
git commit -m "feat: add AboutSection and StoreFooter components"
```

---

### Task 5: Assemble Store Page

**Files:**
- Modify: `src/app/store/[slug]/page.tsx`

**Interfaces:**
- Consumes: `getTenantBySlug(slug)` dari `@/lib/tenant`
- Consumes: semua store components dari sebelumnya
- Produces: halaman toko lengkap yang render dari Supabase data

- [ ] **Step 1: Update store page**

Modifikasi `src/app/store/[slug]/page.tsx`:

```typescript
import { notFound } from 'next/navigation'
import { getTenantBySlug } from '@/lib/tenant'
import { Hero } from '@/components/store/hero'
import { ProductGrid } from '@/components/store/product-grid'
import { AboutSection } from '@/components/store/about-section'
import { StoreFooter } from '@/components/store/store-footer'

interface Props {
  params: Promise<{ slug: string }>
}

export default async function StorePage({ params }: Props) {
  const { slug } = await params
  const data = await getTenantBySlug(slug)

  if (!data) notFound()

  const { tenant, products } = data

  return (
    <>
      <Hero tenant={tenant} />
      <ProductGrid products={products} />
      <AboutSection tenant={tenant} />
      <StoreFooter tenant={tenant} />
    </>
  )
}
```

- [ ] **Step 2: Test dengan data real**

Insert tenant test ke Supabase:

```sql
insert into public.tenants (slug, brand_name, tagline, description, primary_color, secondary_color, accent_color, whatsapp_number)
values (
  'glow-test',
  'Glow.id',
  'Glow from within',
  'Brand skincare lokal yang percaya kecantikan sejati berasal dari dalam.',
  '#2d4a3e',
  '#f0ebe3',
  '#c4956a',
  '08123456789'
);
```

Buka `http://glow-test.localhost:3000` (dengan `/etc/hosts` sudah di-set).

Expected: Halaman toko lengkap dengan warna hijau sage dan krem.

- [ ] **Step 3: Test 404 untuk slug tidak valid**

Buka `http://tidak-ada.localhost:3000`

Expected: Next.js 404 page.

- [ ] **Step 4: Commit**

```bash
git add .
git commit -m "feat: assemble complete skincare store page from Supabase config"
```

---

## Self-Review Checklist

- [x] Spec coverage: hero ✓, product catalog ✓, marketplace links ✓, about section ✓, footer ✓, CSS variables theming ✓
- [x] No placeholders: semua kode aktual
- [x] Mobile-first: semua komponen menggunakan responsive classes
- [x] 404 handling: `notFound()` dipanggil jika tenant tidak ditemukan
- [x] No JS required untuk render (chatbot di Plan 5)
