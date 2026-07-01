import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { sendTelegramMessage } from '@/lib/notifications/telegram'
import { requireSuperAdmin } from '@/lib/supabase/admin-guard'

export const maxDuration = 300 // 5 menit, untuk Ollama sequential

// ── RSS ──────────────────────────────────────────────────────────────────────

function rssUrl(query: string) {
  return `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=id&gl=ID&ceid=ID:id`
}

function parseRSS(xml: string, limit = 6): { title: string; link: string; description: string }[] {
  const items: { title: string; link: string; description: string }[] = []
  const re = /<item>([\s\S]*?)<\/item>/g
  let m
  while ((m = re.exec(xml)) !== null && items.length < limit) {
    const b = m[1]
    const title = b.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/)?.[1] ?? b.match(/<title>(.*?)<\/title>/)?.[1] ?? ''
    const link  = b.match(/<link>(.*?)<\/link>/)?.[1] ?? b.match(/<guid>(.*?)<\/guid>/)?.[1] ?? ''
    const desc  = (b.match(/<description><!\[CDATA\[(.*?)\]\]><\/description>/)?.[1] ?? b.match(/<description>(.*?)<\/description>/)?.[1] ?? '').replace(/<[^>]+>/g, '').trim()
    if (title) items.push({ title: title.trim(), link: link.trim(), description: desc })
  }
  return items
}

async function fetchNews(queries: string[]): Promise<{ title: string; link: string; description: string }[]> {
  const results = await Promise.allSettled(
    queries.map(q => fetch(rssUrl(q), { next: { revalidate: 0 } }).then(r => r.text()))
  )
  const seen = new Set<string>()
  const items: { title: string; link: string; description: string }[] = []
  for (const r of results) {
    if (r.status !== 'fulfilled') continue
    for (const item of parseRSS(r.value, 3)) {
      if (!seen.has(item.title)) { seen.add(item.title); items.push(item) }
    }
  }
  return items.slice(0, 5)
}

// ── AI ───────────────────────────────────────────────────────────────────────

const ARTICLE_STRUCTURE = `Struktur HTML yang wajib diikuti:
<p>Paragraf pembuka, ceritakan konteks dan mengapa topik ini penting sekarang.</p>
<h2>Mengapa Sedang Tren?</h2>
<p>Penjelasan tren dengan data/fakta dari berita.</p>
<h2>Peluang untuk Brand Lokal</h2>
<p>Apa yang bisa dimanfaatkan brand lokal dari tren ini.</p>
<h2>Tips Praktis</h2>
<ul><li>Tip 1</li><li>Tip 2</li><li>Tip 3</li></ul>
<h2>Langkah Pertama yang Bisa Dilakukan Hari Ini</h2>
<p>Ajakan bertindak yang konkret dan spesifik.</p>`

const TITLE_STYLE = `Judul harus provokatif dan actionable, contoh gaya yang bagus:
- "Kenapa UMKM Harus Punya Toko Sendiri, Bukan Cuma Jualan di Marketplace"
- "5 Cara Brand Skincare Lokal Bersaing Tanpa Budget Iklan Besar"
- "Fee Marketplace Naik Lagi: Ini yang Harus Dilakukan Brand Lokal Sekarang"
Hindari judul yang datar atau generik.`

async function callAI(prompt: string): Promise<string> {
  // Article generation selalu pakai DeepSeek, lebih konsisten dan tidak ada batasan context window
  const { deepseekChat } = await import('@/lib/ai/deepseek')
  return deepseekChat([{ role: 'user', content: prompt }])
}

function parseJSON(raw: string): Record<string, string> {
  let cleaned = raw.replace(/```json\n?/g, '').replace(/\n?```/g, '').trim()
  const match = cleaned.match(/\{[\s\S]*\}/)
  if (match) cleaned = match[0]
  try {
    return JSON.parse(cleaned)
  } catch {
    console.error('[parseJSON] Raw (first 300 chars):', cleaned.slice(0, 300))
    throw new Error(`JSON parse failed. Start: ${JSON.stringify(cleaned.slice(0, 50))}`)
  }
}

async function generateArticle(
  categoryName: string,
  newsItems: { title: string; description: string }[]
): Promise<{ title: string; content: string; summary: string; chatgptPrompt: string }> {
  const newsSummary = newsItems.map((n, i) => `${i + 1}. ${n.title}\n${n.description}`).join('\n\n')

  const prompt = `Kamu editor konten senior di UMKMu.site, platform toko online untuk UMKM Indonesia. Kategori: ${categoryName}.

Berita terbaru sebagai bahan referensi:
${newsSummary}

Tulis artikel blog bahasa Indonesia ~600 kata berdasarkan topik paling relevan dari berita di atas.

${TITLE_STYLE}

${ARTICLE_STRUCTURE}

ATURAN GAMBAR (chatgptPrompt):
- Warna: sesuai tema UMKMku, deep navy blue (#0A2F73), clean white, subtle gold accent
- Suasana: profesional, modern, bersih, bukan terlalu ramai warna
- Selalu photorealistic, scene spesifik (orang, produk, situasi bisnis nyata)

ATURAN PENULISAN WAJIB:
- Gunakan <strong>teks</strong> untuk bold, JANGAN pakai **teks**
- Setiap paragraf dalam tag <p>...</p>
- Tone: hangat, seperti senior yang menasihati teman, bukan formal, bukan terlalu santai
- Tidak ada markdown sama sekali dalam konten HTML

Balas HANYA dengan JSON valid (tanpa markdown fence, tanpa komentar):
{"title":"judul provokatif dan actionable","summary":"meta desc 120-160 karakter, kalimat lengkap","content":"HTML artikel lengkap","chatgptPrompt":"DALL-E prompt English, specific visual scene, photorealistic, professional and clean aesthetic, deep navy blue tones, white space, subtle gold accent. Modern Indonesian small business setting."}`

  const raw = await callAI(prompt)
  const parsed = parseJSON(raw) as { title: string; content: string; summary: string; chatgptPrompt: string }

  // Bersihkan markdown yang mungkin lolos dari AI
  parsed.content = parsed.content
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')  // ** → <strong>
    .replace(/\*(.+?)\*/g, '<em>$1</em>')              // * → <em>
    .replace(/\n{2,}/g, '</p><p>')                      // double newline → paragraph break

  return parsed
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function slugify(text: string) {
  return text.toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .slice(0, 80) + '-' + Date.now()
}

// Keyword queries per category slug
const CATEGORY_QUERIES: Record<string, string[]> = {
  skincare: ['skincare lokal Indonesia UMKM', 'brand skincare lokal tren', 'perawatan kulit produk lokal'],
  parfum  : ['parfum lokal Indonesia tren', 'bisnis parfum niche UMKM', 'parfum brand lokal'],
  fashion : ['fashion lokal Indonesia UMKM', 'brand fashion lokal tren', 'bisnis pakaian UMKM Indonesia'],
  fdb     : ['kuliner UMKM Indonesia tren', 'bisnis food beverage lokal', 'makanan minuman UMKM'],
}

function queriesForCategory(slug: string, name: string): string[] {
  return CATEGORY_QUERIES[slug] ?? [`${name} UMKM Indonesia`, `bisnis ${name} lokal Indonesia`]
}

// General UMKM queries, fokus ke isu marketplace yang jadi pain point ICP
const GENERAL_QUERIES = [
  'UMKM Indonesia berkembang mandiri 2025',
  'strategi bisnis UMKM lokal Indonesia sukses',
  'brand lokal Indonesia scale up digital',
  'UMKM Indonesia omzet naik strategi',
  'pelaku usaha kecil Indonesia tumbuh',
]

const GENERAL_CONTEXT = `
Sudut pandang artikel: bagaimana UMKM Indonesia bisa tumbuh mandiri dan berkelanjutan.
Fokus pada strategi praktis, membangun brand, mengelola pelanggan, memanfaatkan digital, meningkatkan repeat buyer.
Tone inspiratif dan actionable, bukan menakut-nakuti soal platform lain.
`

// ── Handler ──────────────────────────────────────────────────────────────────

export async function POST() {
  const denied = await requireSuperAdmin()
  if (denied) return denied

  try {
    const supabase = createServiceClient()

    // Fetch kategori aktif dari DB
    const { data: categories } = await supabase
      .from('categories')
      .select('slug, name')
      .eq('is_active', true)
      .order('sort_order')

    if (!categories?.length) {
      return NextResponse.json({ error: 'Tidak ada kategori aktif' }, { status: 422 })
    }

    // Build jobs: semua kategori + 1 artikel general UMKM
    const jobs: { label: string; queries: string[]; extraContext?: string }[] = [
      ...categories.map(c => ({
        label  : c.name,
        queries: queriesForCategory(c.slug, c.name),
      })),
      {
        label      : 'UMKM Indonesia',
        queries    : GENERAL_QUERIES,
        extraContext: GENERAL_CONTEXT,
      },
    ]

    // Fetch semua berita paralel (hanya fetch, bukan AI)
    const newsResults = await Promise.all(jobs.map(j => fetchNews(j.queries)))

    const runJob = async (job: typeof jobs[0], i: number) => {
      const items = newsResults[i]
      if (!items.length) {
        console.warn(`[generate] No news for: ${job.label}`)
        return null
      }
      const itemsWithContext = job.extraContext
        ? [{ title: '[Konteks Penting]', description: job.extraContext }, ...items]
        : items
      try {
        return await generateArticle(job.label, itemsWithContext)
      } catch (err: unknown) {
        console.error(`[generate] Failed for "${job.label}":`, err instanceof Error ? err.message : err)
        return null
      }
    }

    // DeepSeek bisa parallel, generate semua artikel bersamaan
    const generated = await Promise.all(jobs.map((job, i) => runJob(job, i)))

    // Simpan semua yang berhasil ke DB
    const inserted: { title: string; id: string }[] = []
    for (let i = 0; i < jobs.length; i++) {
      const art = generated[i]
      if (!art) continue
      const { data, error } = await supabase
        .from('articles')
        .insert({
          title        : art.title,
          slug         : slugify(art.title),
          content      : art.content,
          summary      : art.summary,
          chatgpt_prompt: art.chatgptPrompt,
          sources      : newsResults[i].map(n => ({ title: n.title, link: n.link })),
          status       : 'draft',
        })
        .select('id, title')
        .single()
      if (!error && data) inserted.push(data)
    }

    if (!inserted.length) {
      return NextResponse.json({ error: 'Semua artikel gagal digenerate' }, { status: 500 })
    }

    // Notif Telegram
    const list = inserted.map(a => `• ${a.title}`).join('\n')
    await sendTelegramMessage(
      `📝 <b>${inserted.length} artikel baru siap review!</b>\n\n${list}\n\n` +
      `🔗 ${process.env.NEXT_PUBLIC_APP_URL}/admin/articles`
    ).catch(() => {})

    return NextResponse.json({ count: inserted.length, articles: inserted })
  } catch (err) {
    console.error('[admin/articles/generate]', err)
    return NextResponse.json({ error: 'Gagal generate artikel' }, { status: 500 })
  }
}
