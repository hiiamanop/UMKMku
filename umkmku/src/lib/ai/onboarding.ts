import { z } from 'zod'
import type { CategoryType } from '@/lib/categories'

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

/**
 * Get onboarding system prompt for a specific category
 * @param category The product category
 * @returns System prompt string
 */
export function getOnboardingSystemPrompt(category: CategoryType): string {
  const categoryRules = getCategoryOnboardingRules(category)

  return `Kamu adalah asisten onboarding UMKMku.com untuk brand ${category} lokal Indonesia.
Tugasmu: ekstrak informasi bisnis dari cerita merchant dan kembalikan JSON dengan struktur PERSIS seperti di bawah.

OUTPUT JSON (wajib semua field):
{
  "brand_name": "nama brand persis seperti disebutkan merchant",
  "tagline": "slogan singkat brand, atau null jika tidak ada",
  "description": "deskripsi brand 1-2 kalimat",
  "primary_color": "#rrggbb, warna utama brand",
  "secondary_color": "#rrggbb, warna background/pelengkap",
  "accent_color": "#rrggbb, warna highlight/CTA",
  "whatsapp_number": "nomor WA format 628xxx, atau null",
  "instagram_url": "URL Instagram, atau null",
  "chatbot_persona": "kepribadian AI advisor toko ini, 1-2 kalimat",
  "products": [ ${categoryRules} ]
}

Aturan warna:
- Gunakan warna PERSIS yang disebutkan merchant jika ada (format hex #rrggbb)
- Jika tidak disebutkan, pilih warna yang sesuai karakter brand ${category}

Aturan WhatsApp: format 628xxx (ganti 08 dengan 628), atau null jika tidak disebutkan.

Jawab HANYA dengan JSON valid, tidak ada teks lain sebelum atau sesudah.`
}

function getCategoryOnboardingRules(category: CategoryType): string {
  switch (category) {
    case 'skincare':
      return `{ "name": "...", "description": "...", "price": 0 atau null, "skin_types": ["oily"|"combination"|"dry"|"sensitive"|"all"], "concerns": ["acne"|"brightening"|"anti-aging"|"hydrating"|"pores"|"soothing"|"firming"], "ingredients": ["..."], "usage_step": "cleanser"|"toner"|"serum"|"moisturizer"|"sunscreen"|"treatment"|"mask" }`

    case 'parfum':
      return `{ "name": "...", "description": "...", "price": 0 atau null, "fragrance_family": ["floral"|"woody"|"fresh"|"oriental"|"chypre"], "notes_top": ["..."], "notes_middle": ["..."], "notes_base": ["..."], "size": 30|50|100|200, "longevity": "light"|"moderate"|"long-lasting" }`

    case 'fashion':
      return `{ "name": "...", "description": "...", "price": 0 atau null, "sizes": ["S","M","L","XL"], "colors": ["..."], "materials": ["..."], "fit": "slim"|"regular"|"relaxed"|"oversized", "style": ["casual"|"sporty"|"formal"|"streetwear"] }`

    case 'fdb':
      return `{ "name": "...", "description": "...", "price": 0 atau null, "ingredients": ["..."], "allergens": ["..."], "preparation_time": 30, "servings": 1, "dietary": ["vegan"|"vegetarian"|"gluten-free"|"halal"] }`

    default:
      return `{ "name": "...", "description": "...", "price": 0 atau null }`
  }
}

/**
 * Backward compatibility - export old constant as default skincare
 */
export const ONBOARDING_SYSTEM_PROMPT = getOnboardingSystemPrompt('skincare')
