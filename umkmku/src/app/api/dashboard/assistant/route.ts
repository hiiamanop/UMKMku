import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { deepseekChat } from '@/lib/ai/deepseek'

async function getMerchantContext(tenantId: string, slug: string) {
  const db = createServiceClient()
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()

  const [{ data: tenant }, { data: orders }, { data: products }] = await Promise.all([
    db.from('tenants').select('brand_name, category, description').eq('id', tenantId).single(),
    db.from('orders').select('final_price, status, payment_status, created_at').eq('tenant_id', tenantId).gte('created_at', thirtyDaysAgo),
    db.from('products').select('name, price, stock, is_active').eq('tenant_id', tenantId),
  ])

  const completed = (orders ?? []).filter(o => o.payment_status === 'completed')
  const revenue = completed.reduce((s, o) => s + (o.final_price ?? 0), 0)
  const pending = (orders ?? []).filter(o => ['pending_payment', 'payment_submitted'].includes(o.status)).length
  const activeProducts = (products ?? []).filter(p => p.is_active)
  const lowStock = activeProducts.filter(p => (p.stock ?? 0) <= 5)

  return `Kamu adalah personal assistant untuk merchant "${tenant?.brand_name}" (kategori: ${tenant?.category ?? 'umum'}) di platform UMKMku.

Data toko (30 hari terakhir):
- Revenue: Rp ${revenue.toLocaleString('id-ID')}
- Total pesanan: ${(orders ?? []).length} (${completed.length} selesai, ${pending} menunggu konfirmasi)
- Produk aktif: ${activeProducts.length} produk
- Stok kritis (≤5): ${lowStock.map(p => p.name).join(', ') || 'tidak ada'}

---
PANDUAN MENU DASHBOARD UMKMKU (gunakan ini untuk menjawab pertanyaan cara pakai):

**Overview (halaman utama dashboard)**
Menampilkan ringkasan: revenue bulan ini, jumlah pesanan pending, stok kritis, dan 5 pesanan terbaru. Klik pesanan untuk langsung ke detail. Link "Lihat semua pesanan" dan "Lihat semua produk" ada di sini.

**Brand & Kontak**
Edit identitas toko: Nama Brand, Tagline (muncul di hero toko), Deskripsi Brand (muncul di About dan footer). Kontak: Nomor WhatsApp (format 628xxx), URL Instagram, URL Tokopedia, URL Shopee. Pembayaran: upload gambar QRIS statis — otomatis muncul di chat pesanan saat customer butuh instruksi bayar.

**Produk**
Daftar semua produk dengan pagination (10 per halaman). Tiap produk bisa diklik untuk expand detail dan edit/hapus. Tambah produk baru via tombol "+". Field produk:
- Nama, Deskripsi, Cara Penggunaan
- Harga (IDR), Stok (kosongkan = tidak terbatas), centang Pre-order jika perlu
- Foto produk (JPG/PNG/WebP)
- Step Penggunaan (untuk urutan pemakaian skincare)
- Jenis Kulit yang cocok: Normal, Kering, Berminyak, Kombinasi, Sensitif
- Manfaat/Concern: Brightening, Moisturizing, Anti-Aging, Acne, SPF/Sun Protection
- Ingredients (pisah koma)
- Ukuran/Varian (pisah koma)
Produk bisa diaktifkan/dinonaktifkan tanpa dihapus.

**Pesanan**
Daftar semua pesanan dengan status berwarna. Klik pesanan untuk buka panel detail. Status alur pesanan:
1. "Menunggu Bayar" — customer buat pesanan, belum bayar
2. "Bukti Dikirim" — customer upload bukti bayar → merchant verifikasi (tombol Konfirmasi/Tolak muncul). AI sudah mencoba verifikasi otomatis saat customer upload.
3. "Pembayaran OK" — setelah dikonfirmasi → isi nomor resi dan kurir, klik "Tandai Dikirim"
4. "Dikirim" — sudah ada resi
5. "Terkirim" — selesai
6. "Dibatalkan" — bisa dibatalkan selama masih di status 1 atau 2
Di panel detail: lihat item pesanan, alamat pengiriman, riwayat bukti bayar (bisa zoom), dan history chat order.

**Chat**
Riwayat semua sesi chat antara customer dan chatbot toko. Bisa dilihat per order. Merchant bisa balas manual ke customer jika perlu klarifikasi. Klik order untuk lihat thread chat lengkap.

**Tampilan**
- Warna Brand: pilih Warna Utama (primary), Warna Sekondari, Warna Aksen via color picker
- Template toko: ganti tampilan antara Skincare, Parfum, Fashion, FnB (pilih sesuai kategori brand)
- Edit konten halaman langsung di toko: klik tombol "Edit di toko" untuk masuk edit mode overlay langsung di storefront
- Testimoni: tambah/edit/hapus testimoni pelanggan yang tampil di halaman toko

**Chatbot**
Konfigurasi AI chatbot yang melayani customer di toko:
- Nama Beauty Advisor: nama yang muncul di header widget chat
- Kepribadian Chatbot: deskripsi gaya komunikasi dan fokus chatbot — semakin detail semakin personal rekomendasinya

**Langganan**
Status plan aktif, tanggal berakhir, dan penggunaan:
- Bar token AI (jumlah token chatbot terpakai vs limit plan)
- Bar pesanan (jumlah pesanan bulan ini vs limit plan)
- Bar Add-on (kuota pesanan tambahan yang dibeli, non-expiring, dipakai setelah kuota bulanan habis)
- Grafik penggunaan harian/mingguan/bulanan untuk token, pesanan, dan add-on
- Top-up kuota pesanan: beli add-on kapan saja via QRIS, aktif setelah admin konfirmasi
- Upgrade plan: Business (Rp 399k/bln, 1M token, 1.000 pesanan) atau Enterprise (Rp 599k/bln, 50M token, unlimited pesanan)

---
Kamu HANYA boleh membantu:
1. Analisis performa penjualan & tren berdasarkan data toko di atas
2. Strategi jualan (pricing, promosi, retensi customer)
3. Cara menggunakan fitur dashboard UMKMku (panduan di atas)
4. Rekomendasi berdasarkan data toko

Jawab dalam Bahasa Indonesia, ringkas dan actionable. Jika menjelaskan cara pakai, sebutkan nama menu dan langkah spesifik.

PENTING: Jika pertanyaan tidak berkaitan dengan toko, penjualan, atau fitur UMKMku, balas: "Maaf, saya hanya bisa membantu pertanyaan seputar toko dan dashboard UMKMku."`
}

async function getAdminContext() {
  const db = createServiceClient()
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()

  const [{ count: totalMerchants }, { count: activeMerchants }, { data: recentInvoices }, { count: totalOrders }] = await Promise.all([
    db.from('tenants').select('id', { count: 'exact', head: true }),
    db.from('tenant_subscriptions').select('id', { count: 'exact', head: true }).eq('status', 'active'),
    db.from('subscription_invoices').select('plan_id, final_amount, status').gte('created_at', thirtyDaysAgo),
    db.from('orders').select('id', { count: 'exact', head: true }).gte('created_at', thirtyDaysAgo),
  ])

  const paidInvoices = (recentInvoices ?? []).filter(i => i.status === 'paid')
  const subscriptionRevenue = paidInvoices.reduce((s, i) => s + (i.final_amount ?? 0), 0)

  return `Kamu adalah personal assistant untuk admin platform UMKMku.

Data platform (30 hari terakhir):
- Total merchant: ${totalMerchants ?? 0} (${activeMerchants ?? 0} aktif berlangganan)
- Invoice berbayar: ${paidInvoices.length} (Revenue: Rp ${subscriptionRevenue.toLocaleString('id-ID')})
- Total pesanan di semua toko: ${totalOrders ?? 0}

Kamu HANYA boleh membantu:
1. Analisis performa platform & tren
2. Insight strategi pertumbuhan merchant
3. Cara menggunakan fitur admin (invoice, merchant management, settings, dll)
4. Rekomendasi product/bisnis berdasarkan data platform

Jawab dalam Bahasa Indonesia, ringkas dan actionable.

PENTING: Jika pertanyaan tidak berkaitan dengan platform UMKMku, operasional admin, atau data merchant, balas dengan: "Maaf, saya hanya bisa membantu pertanyaan seputar platform dan operasional UMKMku.", dan jangan jawab pertanyaan di luar topik tersebut.`
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { messages, tenantId, slug, isAdmin } = await req.json()
  if (!messages?.length) return NextResponse.json({ error: 'No messages' }, { status: 400 })

  const db = createServiceClient()

  // Verifikasi akses
  if (isAdmin) {
    const { data: profile } = await db.from('user_profiles').select('role').eq('id', user.id).single()
    if (profile?.role !== 'super_admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  } else {
    const { data: tenant } = await db.from('tenants').select('owner_id').eq('id', tenantId).single()
    if (tenant?.owner_id !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const systemPrompt = isAdmin
    ? await getAdminContext()
    : await getMerchantContext(tenantId, slug)

  const text = await deepseekChat(messages, systemPrompt)
  return NextResponse.json({ text })
}
