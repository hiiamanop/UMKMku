import { NextRequest, NextResponse } from 'next/server'
import { generateText } from 'ai'
import { getAIModel, useGeminiDirect } from '@/lib/ai/provider'
import { getOnboardingSystemPrompt } from '@/lib/ai/onboarding'
import { deepseekChat } from '@/lib/ai/deepseek'
import type { CategoryType } from '@/lib/categories'

const VALID_CATEGORIES: CategoryType[] = ['skincare', 'parfum', 'fashion', 'fdb']

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const category: CategoryType = body.category?.trim().toLowerCase()
    const description: string = body.description?.trim()

    if (!category || !VALID_CATEGORIES.includes(category)) {
      return NextResponse.json({ error: 'Kategori tidak valid' }, { status: 400 })
    }
    if (!description || description.length < 20) {
      return NextResponse.json({ error: 'Deskripsi terlalu singkat' }, { status: 400 })
    }

    const systemPrompt = getOnboardingSystemPrompt(category)
    let text: string

    if (useGeminiDirect()) {
      text = await deepseekChat([{ role: 'user', content: description }], systemPrompt)
    } else {
      try {
        const result = await generateText({ model: getAIModel(), system: systemPrompt, prompt: description })
        text = result.text
      } catch {
        text = await deepseekChat([{ role: 'user', content: description }], systemPrompt)
      }
    }

    const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/) || text.match(/(\{[\s\S]*\})/s)
    if (!jsonMatch) {
      return NextResponse.json({ error: 'AI tidak dapat mengekstrak konfigurasi. Coba lagi.' }, { status: 500 })
    }

    const raw = JSON.parse(jsonMatch[1] ?? jsonMatch[0])

    const config = {
      brand_name: String(raw.brand_name ?? 'My Brand'),
      tagline: raw.tagline ? String(raw.tagline) : null,
      description: raw.description ? String(raw.description) : String(raw.brand_name ?? ''),
      primary_color: /^#[0-9a-fA-F]{6}$/.test(raw.primary_color) ? raw.primary_color : '#1a1a1a',
      secondary_color: /^#[0-9a-fA-F]{6}$/.test(raw.secondary_color) ? raw.secondary_color : '#f5f5f5',
      accent_color: /^#[0-9a-fA-F]{6}$/.test(raw.accent_color) ? raw.accent_color : '#d4a574',
      whatsapp_number: raw.whatsapp_number ? String(raw.whatsapp_number) : null,
      instagram_url: raw.instagram_url ? String(raw.instagram_url) : null,
      chatbot_persona: raw.chatbot_persona ? String(raw.chatbot_persona) : 'Advisor yang ramah dan informatif',
      products: normalizeProducts(raw.products),
    }

    return NextResponse.json({ config })
  } catch (err) {
    console.error('Preview error:', err)
    return NextResponse.json({ error: 'Terjadi kesalahan sistem. Coba lagi.' }, { status: 500 })
  }
}

function normalizeProducts(raw: unknown) {
  if (!Array.isArray(raw)) return []
  return raw
    .map(p => {
      if (typeof p !== 'object' || p === null) return null
      const obj = p as Record<string, unknown>
      const { name, description, price, ...categoryData } = obj
      return {
        name: String(name ?? ''),
        description: String(description ?? ''),
        price: typeof price === 'number' ? price : null,
        category_data: categoryData,
      }
    })
    .filter((p): p is NonNullable<typeof p> => p !== null && p.name.length > 0)
}
