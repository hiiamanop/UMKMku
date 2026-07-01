import { NextRequest, NextResponse } from 'next/server'
import { deepseekChat } from '@/lib/ai/deepseek'

export async function POST(request: NextRequest) {
  try {
    const { description, messages, category } = await request.json()

    const systemPrompt = `Kamu adalah asisten onboarding UMKMku untuk brand ${category ?? 'lokal'} Indonesia.

Tugasmu: bantu merchant melengkapi informasi bisnis mereka dengan mengajukan SATU pertanyaan singkat yang paling penting berdasarkan apa yang belum mereka ceritakan.

Informasi ideal yang dibutuhkan:
- Nama brand yang jelas
- Produk apa saja (nama, harga jika ada)
- Warna brand (warna utama, sekunder)
- Nomor WhatsApp (opsional)
- Target customer atau keunikan brand

Deskripsi awal merchant: "${description}"

ATURAN PENTING, selalu balas dengan JSON ini:
{
  "done": false,
  "text": "pertanyaan follow-up SATU kalimat yang spesifik dan belum ditanyakan sebelumnya"
}

KECUALI jika semua info penting sudah terkumpul (nama brand jelas + minimal 1 produk + warna brand), gunakan:
{
  "done": true,
  "text": "Oke, informasi sudah cukup! Saya akan lengkapi deskripsi tokomu sekarang.",
  "summary": "deskripsi lengkap bisnis merchant dalam 2-3 kalimat yang mencakup SEMUA info dari percakapan: nama brand, produk-produk beserta harga jika ada, warna brand, nomor WA jika ada, dan target customer"
}

Jangan tanya hal yang sudah ada di deskripsi awal atau sudah dijawab di percakapan sebelumnya.
Balas HANYA dengan JSON valid.`

    const text = await deepseekChat(messages ?? [], systemPrompt)

    // Parse JSON response from AI
    const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/) || text.match(/(\{[\s\S]*\})/s)
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[1] ?? jsonMatch[0])
        return NextResponse.json({
          text: parsed.text ?? 'Ceritakan lebih lanjut.',
          done: !!parsed.done,
          summary: parsed.summary ?? null,
        })
      } catch { /* fallback below */ }
    }

    // Fallback: treat as plain text, not done
    return NextResponse.json({ text, done: false, summary: null })
  } catch (err) {
    console.error('Assist error:', err)
    return NextResponse.json({ error: 'Terjadi kesalahan.' }, { status: 500 })
  }
}
