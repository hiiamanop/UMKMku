import type { Tenant, Product } from '@/lib/supabase/types'

const USAGE_STEP_LABELS: Record<string, string> = {
  cleanser: 'Pembersih',
  toner: 'Toner',
  serum: 'Serum',
  moisturizer: 'Pelembap',
  sunscreen: 'Sunscreen',
  treatment: 'Treatment',
  mask: 'Masker',
}

interface UserContext {
  name: string | null
  skinType: string | null
  skinConcerns: string[] | null
}

export function buildChatbotSystemPrompt(tenant: Tenant, products: Product[], user?: UserContext | null): string {
  const productList = products.map(p => `
[ID: ${p.id}]
Nama: ${p.name}
Step: ${p.usage_step ? USAGE_STEP_LABELS[p.usage_step] ?? p.usage_step : 'tidak ditentukan'}
Deskripsi: ${p.description ?? 'tidak ada'}
Harga: ${p.price ? `Rp ${p.price.toLocaleString('id-ID')}` : 'hubungi kami'}
Cocok untuk kulit: ${p.skin_types.join(', ')}
Mengatasi: ${p.concerns.join(', ')}
Bahan utama: ${p.ingredients.join(', ')}
`).join('\n---\n')

  const waNumber = tenant.whatsapp_number?.replace(/\D/g, '')
  const whatsappLine = waNumber
    ? `Jika tidak ada produk yang cocok, sarankan customer menghubungi WhatsApp dengan format link: https://wa.me/${waNumber}`
    : 'Jika tidak ada produk yang cocok, sampaikan bahwa kamu akan bantu cari solusi terbaik.'

  let customerContext: string
  if (!user) {
    customerContext = `CUSTOMER: Belum login. Jika customer tanya siapa dirimu atau nama mereka, sampaikan bahwa kamu belum mengenali mereka karena belum login. Ajak mereka login di halaman toko untuk pengalaman yang lebih personal, dan tawarkan untuk mengisi quiz kulit agar bisa memberikan rekomendasi yang tepat.`
  } else {
    const nameStr = user.name ? `Nama: ${user.name}` : 'Nama: belum diisi'
    const skinStr = user.skinType ? `Jenis kulit: ${user.skinType}` : ''
    const concernStr = user.skinConcerns?.length ? `Masalah kulit: ${user.skinConcerns.join(', ')}` : ''
    customerContext = `CUSTOMER YANG SEDANG CHAT:\n${nameStr}${skinStr ? `\n${skinStr}` : ''}${concernStr ? `\n${concernStr}` : ''}\n\nSapa customer dengan namanya jika diketahui. Gunakan data profil kulit mereka untuk rekomendasi yang lebih personal.`
  }

  return `Kamu adalah ${tenant.chatbot_name}, beauty advisor AI untuk ${tenant.brand_name}.

Tentang brand ini:
${tenant.description ?? tenant.brand_name}

Kepribadianmu: ${tenant.chatbot_persona ?? 'Ramah, profesional, dan expert dalam skincare.'}

PRODUK YANG TERSEDIA:
${productList}

CARA MEREKOMENDASIKAN:
1. Tanyakan jenis kulit dan masalah kulit utama customer jika belum disebutkan
2. Rekomendasikan maksimal 2 produk yang paling relevan
3. Jelaskan dengan jelas MENGAPA produk itu cocok untuk kondisi mereka
4. Setelah merekomendasikan produk, tambahkan token berikut di akhir pesan:
   [[RECOMMEND:PRODUCT_ID_DISINI]]
   Ganti PRODUCT_ID_DISINI dengan ID produk yang kamu rekomendasikan (dari kolom ID di atas)
   Jika merekomendasikan 2 produk, gunakan 2 token terpisah

${customerContext}

ATURAN PENTING:
- Jawab HANYA dalam Bahasa Indonesia
- Jangan buat klaim medis (tidak boleh bilang "menyembuhkan" atau "mengobati")
- Jangan sebut nama brand kompetitor
- Jangan sarankan produk yang tidak ada dalam daftar di atas
- Batas maksimal 10 pesan dalam satu sesi
${whatsappLine}
`
}

// Parse [[RECOMMEND:uuid]] tokens dari response AI
export function parseRecommendations(text: string): { cleanText: string; productIds: string[] } {
  const pattern = /\[\[RECOMMEND:([\w-]+)\]\]/g
  const productIds: string[] = []
  const cleanText = text.replace(pattern, (_, id) => {
    productIds.push(id)
    return ''
  }).trim()

  return { cleanText, productIds }
}
