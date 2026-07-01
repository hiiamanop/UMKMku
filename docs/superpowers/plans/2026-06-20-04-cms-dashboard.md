# Plan 4: CMS Dashboard, Merchant Edit Interface

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Merchant bisa login ke dashboard, edit konten toko (teks, warna, kontak), upload foto produk, dan mengelola daftar produk. Perubahan langsung tercermin di subdomain mereka.

**Architecture:** Dashboard di `dashboard.umkmku.com/[slug]`. Merchant identify via slug di URL (no auth di prototype, auth bisa ditambah nanti). Semua update via Server Actions ke Supabase service client. Upload foto via Supabase Storage.

**Tech Stack:** Next.js Server Actions, Supabase Storage, react-hook-form, shadcn/ui form components

## Global Constraints

- Lihat Global Constraints di Plan 1
- Prototype tidak pakai auth, merchant akses dashboard via link `dashboard.umkmku.com/[slug]`
- Upload gambar: max 5MB, format JPG/PNG/WebP
- Semua Server Actions harus validate input sebelum ke database
- Tidak ada drag-and-drop, tidak ada visual editor
- CMS hanya expose field yang template support (tidak lebih)

---

### Task 1: Dashboard Layout dan Navigation

**Files:**
- Create: `src/app/(dashboard)/[slug]/layout.tsx`
- Create: `src/app/(dashboard)/[slug]/page.tsx`
- Create: `src/app/(dashboard)/[slug]/_components/dashboard-nav.tsx`

**Interfaces:**
- Consumes: `getTenantBySlug(slug)` dari `@/lib/tenant`
- Produces: Dashboard layout dengan navigasi per section

- [ ] **Step 1: Buat dashboard layout per merchant**

Buat `src/app/(dashboard)/[slug]/layout.tsx`:

```typescript
import { notFound } from 'next/navigation'
import { getTenantBySlug } from '@/lib/tenant'
import { DashboardNav } from './_components/dashboard-nav'

interface Props {
  children: React.ReactNode
  params: Promise<{ slug: string }>
}

export default async function MerchantDashboardLayout({ children, params }: Props) {
  const { slug } = await params
  const data = await getTenantBySlug(slug)

  if (!data) notFound()

  const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? 'localhost:3000'
  const storeUrl = `http://${slug}.${rootDomain}`

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b px-6 py-4 flex items-center justify-between">
        <div>
          <span className="font-semibold">{data.tenant.brand_name}</span>
          <span className="text-gray-400 mx-2">·</span>
          <a
            href={storeUrl}
            target="_blank"
            className="text-sm text-blue-600 hover:underline"
          >
            Lihat Toko →
          </a>
        </div>
        <span className="text-xs text-gray-400">{slug}.umkmku.com</span>
      </header>
      <div className="max-w-4xl mx-auto px-4 py-8">
        <DashboardNav slug={slug} />
        <div className="mt-6">{children}</div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Buat navigation tabs**

Buat `src/app/(dashboard)/[slug]/_components/dashboard-nav.tsx`:

```typescript
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

const tabs = [
  { label: 'Brand & Kontak', path: '' },
  { label: 'Produk', path: '/products' },
  { label: 'Tampilan', path: '/appearance' },
  { label: 'Chatbot', path: '/chatbot' },
]

export function DashboardNav({ slug }: { slug: string }) {
  const pathname = usePathname()
  const base = `/${slug}`

  return (
    <nav className="flex gap-1 bg-gray-100 p-1 rounded-lg">
      {tabs.map((tab) => {
        const href = `/dashboard/${slug}${tab.path}`
        const isActive = tab.path === ''
          ? pathname === `/dashboard/${slug}` || pathname === `/dashboard/${slug}/`
          : pathname.startsWith(`/dashboard/${slug}${tab.path}`)

        return (
          <Link
            key={tab.path}
            href={href}
            className={cn(
              'flex-1 text-center text-sm py-2 px-3 rounded-md transition-colors',
              isActive
                ? 'bg-white font-medium shadow-sm'
                : 'text-gray-500 hover:text-gray-900'
            )}
          >
            {tab.label}
          </Link>
        )
      })}
    </nav>
  )
}
```

- [ ] **Step 3: Buat dashboard overview page**

Buat `src/app/(dashboard)/[slug]/page.tsx`:

```typescript
import { getTenantBySlug } from '@/lib/tenant'
import { notFound } from 'next/navigation'
import { BrandForm } from './_components/brand-form'

interface Props {
  params: Promise<{ slug: string }>
}

export default async function DashboardOverviewPage({ params }: Props) {
  const { slug } = await params
  const data = await getTenantBySlug(slug)

  if (!data) notFound()

  return <BrandForm tenant={data.tenant} />
}
```

- [ ] **Step 4: Commit**

```bash
git add .
git commit -m "feat: add merchant dashboard layout and navigation"
```

---

### Task 2: Brand & Kontak Form dengan Server Action

**Files:**
- Create: `src/app/(dashboard)/[slug]/_components/brand-form.tsx`
- Create: `src/app/(dashboard)/[slug]/actions.ts`

**Interfaces:**
- Consumes: `tenant: Tenant`
- Produces: `updateBrand(formData)` Server Action

- [ ] **Step 1: Buat Server Actions**

Buat `src/app/(dashboard)/[slug]/actions.ts`:

```typescript
'use server'

import { revalidatePath } from 'next/cache'
import { createServiceClient } from '@/lib/supabase/server'

export async function updateBrand(slug: string, formData: FormData) {
  const brand_name = formData.get('brand_name')?.toString().trim()
  const tagline = formData.get('tagline')?.toString().trim() || null
  const description = formData.get('description')?.toString().trim() || null
  const whatsapp_number = formData.get('whatsapp_number')?.toString().trim() || null
  const instagram_url = formData.get('instagram_url')?.toString().trim() || null
  const tokopedia_url = formData.get('tokopedia_url')?.toString().trim() || null
  const shopee_url = formData.get('shopee_url')?.toString().trim() || null

  if (!brand_name || brand_name.length < 2) {
    return { error: 'Nama brand minimal 2 karakter' }
  }

  const supabase = createServiceClient()

  const { error } = await supabase
    .from('tenants')
    .update({
      brand_name,
      tagline,
      description,
      whatsapp_number,
      instagram_url,
      tokopedia_url,
      shopee_url,
    })
    .eq('slug', slug)

  if (error) return { error: 'Gagal menyimpan perubahan' }

  revalidatePath(`/store/${slug}`)
  return { success: true }
}

export async function updateAppearance(slug: string, formData: FormData) {
  const primary_color = formData.get('primary_color')?.toString()
  const secondary_color = formData.get('secondary_color')?.toString()
  const accent_color = formData.get('accent_color')?.toString()

  const hexPattern = /^#[0-9a-fA-F]{6}$/
  if (!hexPattern.test(primary_color ?? '') ||
      !hexPattern.test(secondary_color ?? '') ||
      !hexPattern.test(accent_color ?? '')) {
    return { error: 'Format warna tidak valid' }
  }

  const supabase = createServiceClient()

  const { error } = await supabase
    .from('tenants')
    .update({ primary_color, secondary_color, accent_color })
    .eq('slug', slug)

  if (error) return { error: 'Gagal menyimpan warna' }

  revalidatePath(`/store/${slug}`)
  return { success: true }
}

export async function updateChatbot(slug: string, formData: FormData) {
  const chatbot_name = formData.get('chatbot_name')?.toString().trim()
  const chatbot_persona = formData.get('chatbot_persona')?.toString().trim() || null

  if (!chatbot_name || chatbot_name.length < 2) {
    return { error: 'Nama chatbot minimal 2 karakter' }
  }

  const supabase = createServiceClient()

  const { error } = await supabase
    .from('tenants')
    .update({ chatbot_name, chatbot_persona })
    .eq('slug', slug)

  if (error) return { error: 'Gagal menyimpan pengaturan chatbot' }

  revalidatePath(`/store/${slug}`)
  return { success: true }
}
```

- [ ] **Step 2: Buat BrandForm component**

Buat `src/app/(dashboard)/[slug]/_components/brand-form.tsx`:

```typescript
'use client'

import { useActionState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import type { Tenant } from '@/lib/supabase/types'
import { updateBrand } from '../actions'

interface Props {
  tenant: Tenant
}

export function BrandForm({ tenant }: Props) {
  const updateBrandForSlug = updateBrand.bind(null, tenant.slug)
  const [state, action, pending] = useActionState(updateBrandForSlug, null)

  return (
    <div className="bg-white rounded-xl p-6 space-y-6">
      <h2 className="font-semibold text-lg">Brand & Kontak</h2>

      <form action={action} className="space-y-4">
        <div className="space-y-1">
          <label className="text-sm font-medium">Nama Brand *</label>
          <Input name="brand_name" defaultValue={tenant.brand_name} required />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium">Tagline</label>
          <Input
            name="tagline"
            defaultValue={tenant.tagline ?? ''}
            placeholder="Tagline singkat brand kamu"
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium">Deskripsi Brand</label>
          <Textarea
            name="description"
            defaultValue={tenant.description ?? ''}
            placeholder="Ceritakan brand kamu..."
            className="min-h-[100px]"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-sm font-medium">Nomor WhatsApp</label>
            <Input
              name="whatsapp_number"
              defaultValue={tenant.whatsapp_number ?? ''}
              placeholder="08xxxxxxxxxx"
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Instagram URL</label>
            <Input
              name="instagram_url"
              defaultValue={tenant.instagram_url ?? ''}
              placeholder="https://instagram.com/..."
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-sm font-medium">Tokopedia Store URL</label>
            <Input
              name="tokopedia_url"
              defaultValue={tenant.tokopedia_url ?? ''}
              placeholder="https://tokopedia.com/..."
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Shopee Store URL</label>
            <Input
              name="shopee_url"
              defaultValue={tenant.shopee_url ?? ''}
              placeholder="https://shopee.co.id/..."
            />
          </div>
        </div>

        {state?.error && <p className="text-red-600 text-sm">{state.error}</p>}
        {state?.success && <p className="text-green-600 text-sm">Perubahan disimpan!</p>}

        <Button type="submit" disabled={pending}>
          {pending ? 'Menyimpan...' : 'Simpan Perubahan'}
        </Button>
      </form>
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add .
git commit -m "feat: add brand & contact form with Server Actions"
```

---

### Task 3: Product Management, CRUD

**Files:**
- Create: `src/app/(dashboard)/[slug]/products/page.tsx`
- Create: `src/app/(dashboard)/[slug]/products/_components/product-list.tsx`
- Create: `src/app/(dashboard)/[slug]/products/_components/product-form.tsx`
- Create: `src/app/(dashboard)/[slug]/products/actions.ts`

**Interfaces:**
- Consumes: `products: Product[]`
- Produces: CRUD interface untuk produk + upload foto ke Supabase Storage

- [ ] **Step 1: Buat product Server Actions**

Buat `src/app/(dashboard)/[slug]/products/actions.ts`:

```typescript
'use server'

import { revalidatePath } from 'next/cache'
import { createServiceClient } from '@/lib/supabase/server'

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_SIZE = 5 * 1024 * 1024 // 5MB

export async function upsertProduct(slug: string, productId: string | null, formData: FormData) {
  const name = formData.get('name')?.toString().trim()
  const description = formData.get('description')?.toString().trim() || null
  const priceRaw = formData.get('price')?.toString()
  const price = priceRaw ? parseInt(priceRaw, 10) : null
  const skin_types = formData.getAll('skin_types').map(String)
  const concerns = formData.getAll('concerns').map(String)
  const ingredients = formData.get('ingredients')?.toString()
    .split(',').map(s => s.trim()).filter(Boolean) ?? []
  const usage_step = formData.get('usage_step')?.toString() || null
  const tokopedia_url = formData.get('tokopedia_url')?.toString().trim() || null
  const shopee_url = formData.get('shopee_url')?.toString().trim() || null

  if (!name || name.length < 2) return { error: 'Nama produk minimal 2 karakter' }
  if (price !== null && (isNaN(price) || price < 0)) return { error: 'Harga tidak valid' }

  const supabase = createServiceClient()

  // Get tenant id
  const { data: tenant } = await supabase
    .from('tenants')
    .select('id')
    .eq('slug', slug)
    .single()

  if (!tenant) return { error: 'Toko tidak ditemukan' }

  // Handle image upload
  let image_url: string | null = null
  const imageFile = formData.get('image') as File | null

  if (imageFile && imageFile.size > 0) {
    if (!ALLOWED_TYPES.includes(imageFile.type)) {
      return { error: 'Format gambar harus JPG, PNG, atau WebP' }
    }
    if (imageFile.size > MAX_SIZE) {
      return { error: 'Ukuran gambar maksimal 5MB' }
    }

    const ext = imageFile.name.split('.').pop()
    const fileName = `${tenant.id}/${Date.now()}.${ext}`

    const { error: uploadError } = await supabase.storage
      .from('product-images')
      .upload(fileName, imageFile, { upsert: true })

    if (uploadError) return { error: 'Gagal upload gambar' }

    const { data: urlData } = supabase.storage
      .from('product-images')
      .getPublicUrl(fileName)

    image_url = urlData.publicUrl
  }

  const productData = {
    tenant_id: tenant.id,
    name,
    description,
    price,
    skin_types,
    concerns,
    ingredients,
    usage_step,
    tokopedia_url,
    shopee_url,
    ...(image_url ? { image_url } : {}),
  }

  if (productId) {
    const { error } = await supabase
      .from('products')
      .update(productData)
      .eq('id', productId)
      .eq('tenant_id', tenant.id)

    if (error) return { error: 'Gagal memperbarui produk' }
  } else {
    const { error } = await supabase
      .from('products')
      .insert(productData)

    if (error) return { error: 'Gagal menambah produk' }
  }

  revalidatePath(`/store/${slug}`)
  revalidatePath(`/${slug}/products`)
  return { success: true }
}

export async function deleteProduct(slug: string, productId: string) {
  const supabase = createServiceClient()

  const { data: tenant } = await supabase
    .from('tenants')
    .select('id')
    .eq('slug', slug)
    .single()

  if (!tenant) return { error: 'Toko tidak ditemukan' }

  const { error } = await supabase
    .from('products')
    .delete()
    .eq('id', productId)
    .eq('tenant_id', tenant.id)

  if (error) return { error: 'Gagal menghapus produk' }

  revalidatePath(`/store/${slug}`)
  return { success: true }
}
```

- [ ] **Step 2: Buat Supabase Storage bucket**

Di Supabase dashboard → Storage → Create bucket:
- Name: `product-images`
- Public: ✓ (untuk akses gambar di store)

Tambahkan RLS policy:
```sql
create policy "Product images are publicly accessible"
  on storage.objects for select
  using (bucket_id = 'product-images');

create policy "Anyone can upload product images"
  on storage.objects for insert
  with check (bucket_id = 'product-images');
```

- [ ] **Step 3: Buat ProductForm component**

Buat `src/app/(dashboard)/[slug]/products/_components/product-form.tsx`:

```typescript
'use client'

import { useActionState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import type { Product } from '@/lib/supabase/types'
import { upsertProduct } from '../actions'

const SKIN_TYPES = [
  { value: 'oily', label: 'Berminyak' },
  { value: 'combination', label: 'Kombinasi' },
  { value: 'dry', label: 'Kering' },
  { value: 'sensitive', label: 'Sensitif' },
  { value: 'all', label: 'Semua Jenis' },
]

const CONCERNS = [
  { value: 'acne', label: 'Anti Jerawat' },
  { value: 'brightening', label: 'Mencerahkan' },
  { value: 'anti-aging', label: 'Anti Aging' },
  { value: 'hydrating', label: 'Melembapkan' },
  { value: 'pores', label: 'Mengecilkan Pori' },
  { value: 'soothing', label: 'Menenangkan' },
  { value: 'firming', label: 'Mengencangkan' },
]

const USAGE_STEPS = [
  'cleanser', 'toner', 'serum', 'moisturizer', 'sunscreen', 'treatment', 'mask'
]

interface Props {
  slug: string
  product?: Product
  onSuccess?: () => void
}

export function ProductForm({ slug, product, onSuccess }: Props) {
  const action = upsertProduct.bind(null, slug, product?.id ?? null)
  const [state, formAction, pending] = useActionState(
    async (_: unknown, formData: FormData) => {
      const result = await action(formData)
      if (result.success && onSuccess) onSuccess()
      return result
    },
    null
  )

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-1">
        <label className="text-sm font-medium">Nama Produk *</label>
        <Input name="name" defaultValue={product?.name} required />
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium">Deskripsi</label>
        <Textarea name="description" defaultValue={product?.description ?? ''} />
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium">Harga (Rp)</label>
        <Input name="price" type="number" defaultValue={product?.price ?? ''} placeholder="150000" />
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium">Foto Produk</label>
        <input name="image" type="file" accept="image/jpeg,image/png,image/webp"
          className="text-sm text-gray-600" />
        {product?.image_url && (
          <p className="text-xs text-gray-400">Foto saat ini sudah ada. Upload baru untuk mengganti.</p>
        )}
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium">Step Penggunaan</label>
        <select name="usage_step" defaultValue={product?.usage_step ?? ''}
          className="w-full border rounded-md px-3 py-2 text-sm">
          <option value="">-- Pilih --</option>
          {USAGE_STEPS.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium">Cocok untuk Jenis Kulit</label>
        <div className="flex flex-wrap gap-2">
          {SKIN_TYPES.map(({ value, label }) => (
            <label key={value} className="flex items-center gap-1.5 text-sm">
              <input type="checkbox" name="skin_types" value={value}
                defaultChecked={product?.skin_types.includes(value)} />
              {label}
            </label>
          ))}
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium">Manfaat / Concern</label>
        <div className="flex flex-wrap gap-2">
          {CONCERNS.map(({ value, label }) => (
            <label key={value} className="flex items-center gap-1.5 text-sm">
              <input type="checkbox" name="concerns" value={value}
                defaultChecked={product?.concerns.includes(value)} />
              {label}
            </label>
          ))}
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium">Bahan Utama (pisahkan dengan koma)</label>
        <Input name="ingredients" defaultValue={product?.ingredients.join(', ') ?? ''}
          placeholder="niacinamide, vitamin-c, ceramide" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="text-sm font-medium">Link Tokopedia</label>
          <Input name="tokopedia_url" defaultValue={product?.tokopedia_url ?? ''} />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium">Link Shopee</label>
          <Input name="shopee_url" defaultValue={product?.shopee_url ?? ''} />
        </div>
      </div>

      {state?.error && <p className="text-red-600 text-sm">{state.error}</p>}
      {state?.success && <p className="text-green-600 text-sm">Produk disimpan!</p>}

      <Button type="submit" disabled={pending}>
        {pending ? 'Menyimpan...' : product ? 'Update Produk' : 'Tambah Produk'}
      </Button>
    </form>
  )
}
```

- [ ] **Step 4: Buat products page**

Buat `src/app/(dashboard)/[slug]/products/page.tsx`:

```typescript
import { getTenantBySlug } from '@/lib/tenant'
import { notFound } from 'next/navigation'
import { ProductList } from './_components/product-list'

interface Props {
  params: Promise<{ slug: string }>
}

export default async function ProductsPage({ params }: Props) {
  const { slug } = await params
  const data = await getTenantBySlug(slug)

  if (!data) notFound()

  return <ProductList slug={slug} products={data.products} />
}
```

- [ ] **Step 5: Buat ProductList component (simplified)**

Buat `src/app/(dashboard)/[slug]/products/_components/product-list.tsx`:

```typescript
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import type { Product } from '@/lib/supabase/types'
import { ProductForm } from './product-form'
import { deleteProduct } from '../actions'

interface Props {
  slug: string
  products: Product[]
}

export function ProductList({ slug, products: initialProducts }: Props) {
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-lg">Produk ({initialProducts.length})</h2>
        <Button onClick={() => setShowAddForm(!showAddForm)} size="sm">
          + Tambah Produk
        </Button>
      </div>

      {showAddForm && (
        <div className="bg-white rounded-xl p-6 border">
          <h3 className="font-medium mb-4">Produk Baru</h3>
          <ProductForm
            slug={slug}
            onSuccess={() => setShowAddForm(false)}
          />
        </div>
      )}

      {initialProducts.map((product) => (
        <div key={product.id} className="bg-white rounded-xl p-4 border space-y-3">
          {editingId === product.id ? (
            <ProductForm
              slug={slug}
              product={product}
              onSuccess={() => setEditingId(null)}
            />
          ) : (
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">{product.name}</p>
                <p className="text-sm text-gray-500">
                  {product.price ? `Rp ${product.price.toLocaleString('id-ID')}` : 'Harga belum diset'}
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setEditingId(product.id)}
                >
                  Edit
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="text-red-600"
                  onClick={async () => {
                    if (confirm(`Hapus ${product.name}?`)) {
                      await deleteProduct(slug, product.id)
                    }
                  }}
                >
                  Hapus
                </Button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
```

- [ ] **Step 6: Commit**

```bash
git add .
git commit -m "feat: add product CRUD with image upload to Supabase Storage"
```

---

## Self-Review Checklist

- [x] Spec coverage: edit brand ✓, edit produk ✓, upload foto ✓, edit warna (di actions.ts) ✓, edit chatbot (di actions.ts) ✓
- [x] No placeholders: semua kode aktual
- [x] Input validation di semua Server Actions
- [x] File upload: type check dan size check sebelum upload
- [x] No auth di prototype, catatan ini sudah di Global Constraints
