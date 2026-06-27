import { NextRequest, NextResponse } from 'next/server'
import { generateText } from 'ai'
import { getAIModel, useGeminiDirect } from '@/lib/ai/provider'
import { generateSlug, getOnboardingSystemPrompt } from '@/lib/ai/onboarding'
import { geminiChat } from '@/lib/ai/gemini'
import { createServiceClient } from '@/lib/supabase/server'
import { validateCategoryData, type CategoryType } from '@/lib/categories'
import type { SupabaseClient } from '@supabase/supabase-js'

const VALID_CATEGORIES: CategoryType[] = ['skincare', 'parfum', 'fashion', 'fdb']

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const category: CategoryType = body.category?.trim().toLowerCase()
    const description: string = body.description?.trim()
    const invoiceId: string | null = body.invoiceId ?? null

    // Validate category
    if (!category || !VALID_CATEGORIES.includes(category)) {
      return NextResponse.json(
        { error: 'Pilih kategori yang valid: skincare, parfum, fashion, atau fdb' },
        { status: 400 }
      )
    }

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
    // Production (AI_PROVIDER=gemini): langsung Gemini 2.0 Flash
    // Dev (AI_PROVIDER=ollama): coba Ollama dulu, fallback ke Gemini
    const onboardingPrompt = getOnboardingSystemPrompt(category)
    let text: string
    if (useGeminiDirect()) {
      text = await geminiChat([{ role: 'user', content: description }], onboardingPrompt)
    } else {
      try {
        const result = await generateText({ model: getAIModel(), system: onboardingPrompt, prompt: description })
        text = result.text
      } catch {
        text = await geminiChat([{ role: 'user', content: description }], onboardingPrompt)
      }
    }

    // Parse JSON dari response (handle ```json blocks)
    const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/) || text.match(/(\{[\s\S]*\})/s)
    if (!jsonMatch) {
      console.error('No JSON found in AI response:', text)
      return NextResponse.json({ error: 'Terjadi kesalahan sistem. Coba lagi.' }, { status: 500 })
    }
    const jsonStr = jsonMatch[1] ?? jsonMatch[0]
    const raw = JSON.parse(jsonStr)

    // Normalize dan apply defaults
    const config = {
      brand_name: String(raw.brand_name ?? 'My Brand'),
      tagline: raw.tagline ? String(raw.tagline) : null,
      description: raw.description ? String(raw.description) : String(raw.brand_name ?? 'Brand skincare lokal'),
      primary_color: /^#[0-9a-fA-F]{6}$/.test(raw.primary_color) ? raw.primary_color : '#1a1a1a',
      secondary_color: /^#[0-9a-fA-F]{6}$/.test(raw.secondary_color) ? raw.secondary_color : '#f5f5f5',
      accent_color: /^#[0-9a-fA-F]{6}$/.test(raw.accent_color) ? raw.accent_color : '#d4a574',
      whatsapp_number: raw.whatsapp_number ? String(raw.whatsapp_number) : null,
      instagram_url: raw.instagram_url ? String(raw.instagram_url) : null,
      chatbot_persona: raw.chatbot_persona ? String(raw.chatbot_persona) : 'Beauty advisor yang ramah dan informatif',
      products: normalizeProducts(raw.products),
    }

    // Generate slug unik
    const supabase = createServiceClient()
    const baseSlug = generateSlug(config.brand_name)
    const slug = await ensureUniqueSlug(supabase, baseSlug)

    // Simpan tenant ke Supabase dengan category
    const { data: tenant, error: tenantError } = await supabase
      .from('tenants')
      .insert({
        slug,
        category,
        brand_name: config.brand_name,
        tagline: config.tagline,
        description: config.description,
        primary_color: config.primary_color,
        secondary_color: config.secondary_color,
        accent_color: config.accent_color,
        whatsapp_number: config.whatsapp_number,
        instagram_url: config.instagram_url,
        chatbot_name: getCategoryDefaultChatbotName(category),
        chatbot_persona: config.chatbot_persona,
      })
      .select('id')
      .single()

    if (tenantError || !tenant) {
      console.error('Tenant insert error:', tenantError)
      return NextResponse.json({ error: 'Gagal membuat toko' }, { status: 500 })
    }

    // Simpan produk dengan category-specific data
    if (config.products.length > 0) {
      const products = config.products.map((p, index) => {
        // Validate category-specific data
        const validation = validateCategoryData(category, p.category_data)
        if (!validation.success) {
          console.warn(`Product ${p.name} validation failed:`, validation.error)
        }

        const baseProduct = {
          tenant_id: tenant.id,
          category_type: category,
          name: p.name,
          description: p.description,
          price: p.price,
          sort_order: index,
        }

        // Add category-specific data to appropriate column
        switch (category) {
          case 'skincare':
            return { ...baseProduct, skincare_data: p.category_data }
          case 'parfum':
            return { ...baseProduct, parfum_data: p.category_data }
          case 'fashion':
            return { ...baseProduct, fashion_data: p.category_data }
          case 'fdb':
            return { ...baseProduct, fdb_data: p.category_data }
          default:
            return { ...baseProduct, skincare_data: p.category_data }
        }
      })

      const { error: productsError } = await supabase
        .from('products')
        .insert(products)

      if (productsError) {
        console.error('Products insert error:', productsError)
      }
    }

    // Tentukan plan dari invoice (jika paid) atau default free trial
    let subPlanId = 'free'
    let subStatus: 'trial' | 'active' = 'trial'
    let periodEnd: string | undefined

    if (invoiceId) {
      const { data: inv } = await supabase
        .from('subscription_invoices')
        .select('plan_id, status')
        .eq('id', invoiceId)
        .single()

      if (inv?.status === 'paid') {
        subPlanId = inv.plan_id
        subStatus = 'active'
        periodEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        // Link invoice ke tenant
        await supabase
          .from('subscription_invoices')
          .update({ tenant_id: tenant.id, onboarding_completed_at: new Date().toISOString() })
          .eq('id', invoiceId)
      }
    }

    const trialEndsAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    const { data: newSub } = await supabase
      .from('tenant_subscriptions')
      .insert({
        tenant_id: tenant.id,
        plan_id: subPlanId,
        status: subStatus,
        trial_ends_at: subStatus === 'trial' ? trialEndsAt : null,
        current_period_start: subStatus === 'active' ? new Date().toISOString() : null,
        current_period_end: subStatus === 'active' ? periodEnd : null,
      })
      .select('id')
      .single()

    if (newSub) {
      await supabase.from('tenants').update({ subscription_id: newSub.id }).eq('id', tenant.id)
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

type NormalizedProduct = {
  name: string
  description: string
  price: number | null
  category_data: Record<string, unknown>
}

function normalizeProducts(raw: unknown): NormalizedProduct[] {
  if (!Array.isArray(raw)) return []
  return raw
    .map((p) => {
      if (typeof p === 'string') {
        return { name: p, description: '', price: null, category_data: {} }
      }
      if (typeof p !== 'object' || p === null) return null
      const obj = p as Record<string, unknown>
      return {
        name: String(obj.name ?? ''),
        description: String(obj.description ?? ''),
        price: typeof obj.price === 'number' ? obj.price : null,
        category_data: extractCategoryData(obj),
      }
    })
    .filter((p): p is NormalizedProduct => p !== null && p.name.length > 0)
}

function extractCategoryData(obj: Record<string, unknown>): Record<string, unknown> {
  // Extract all fields except standard ones
  const { name, description, price, ...categoryData } = obj
  return categoryData
}

function getCategoryDefaultChatbotName(category: CategoryType): string {
  switch (category) {
    case 'skincare':
      return 'Beauty Advisor'
    case 'parfum':
      return 'Fragrance Expert'
    case 'fashion':
      return 'Style Advisor'
    case 'fdb':
      return 'Food Specialist'
    default:
      return 'Advisor'
  }
}

async function ensureUniqueSlug(
  supabase: SupabaseClient,
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
