import { NextRequest, NextResponse } from 'next/server'
import { deepseekChat } from '@/lib/ai/deepseek'

export async function POST(request: NextRequest) {
  try {
    const { config, message, category } = await request.json()
    if (!config || !message) {
      return NextResponse.json({ error: 'Config dan message wajib diisi' }, { status: 400 })
    }

    const systemPrompt = `Kamu adalah AI assistant onboarding UMKMku.com untuk toko kategori ${category ?? 'umum'}.

Konfigurasi toko merchant saat ini:
${JSON.stringify(config, null, 2)}

Merchant ingin mengubah konfigurasi tersebut. Berdasarkan permintaan, update konfigurasi dan kembalikan JSON berikut:
{
  "message": "konfirmasi singkat (1 kalimat) apa yang sudah diubah, dalam Bahasa Indonesia",
  "config": { ...konfigurasi yang sudah diupdate, struktur SAMA PERSIS dengan yang di atas }
}

Aturan:
- Pertahankan semua field yang tidak diminta untuk diubah
- Warna harus dalam format hex #rrggbb
- Jika merchant minta tambah produk, tambahkan ke array products
- Jika minta hapus produk, hapus dari array
- Jawab HANYA dengan JSON valid tersebut, tidak ada teks lain`

    const text = await deepseekChat([{ role: 'user', content: message }], systemPrompt)

    const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/) || text.match(/(\{[\s\S]*\})/s)
    if (!jsonMatch) {
      return NextResponse.json({ error: 'AI tidak dapat memproses perubahan. Coba ulangi.' }, { status: 500 })
    }

    const result = JSON.parse(jsonMatch[1] ?? jsonMatch[0])
    return NextResponse.json({ message: result.message ?? 'Konfigurasi diperbarui.', config: result.config ?? config })
  } catch (err) {
    console.error('Adjust error:', err)
    return NextResponse.json({ error: 'Terjadi kesalahan. Coba lagi.' }, { status: 500 })
  }
}
