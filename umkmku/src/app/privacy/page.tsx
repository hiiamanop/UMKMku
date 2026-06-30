import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Kebijakan Privasi | UMKMu',
  description: 'Kebijakan privasi UMKMu — bagaimana kami melindungi data pribadi Anda sesuai UU PDP.',
}

const PRIMARY = '#0A2F73'
const GOLD = '#F4B400'
const BORDER = '#E5EAF0'
const TEXT_SEC = '#5E6B85'

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-10">
      <h2 className="text-xl font-bold mb-4" style={{ color: PRIMARY }}>{title}</h2>
      <div className="text-sm leading-relaxed space-y-3" style={{ color: TEXT_SEC }}>
        {children}
      </div>
    </section>
  )
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* Navbar */}
      <nav style={{ borderBottom: `1px solid ${BORDER}`, background: 'white' }} className="sticky top-0 z-50">
        <div className="mx-auto max-w-3xl px-6 flex items-center justify-between h-14">
          <Link href="/">
            <img src="/logo.png" alt="UMKMu" style={{ height: '32px', width: 'auto' }} />
          </Link>
          <Link href="/" className="text-sm font-medium hover:underline" style={{ color: TEXT_SEC }}>
            ← Kembali ke Beranda
          </Link>
        </div>
      </nav>

      {/* Content */}
      <main className="mx-auto max-w-3xl px-6 py-14">
        <div className="mb-10">
          <h1 className="text-3xl font-bold mb-3" style={{ color: PRIMARY }}>Kebijakan Privasi</h1>
          <p className="text-sm" style={{ color: TEXT_SEC }}>
            Terakhir diperbarui: 30 Juni 2026
          </p>
          <div className="mt-4 p-4 rounded-xl text-sm" style={{ background: `${GOLD}18`, border: `1px solid ${GOLD}44`, color: '#7A5C00' }}>
            <strong>Catatan:</strong> Dokumen ini adalah draf yang masih perlu ditinjau oleh konsultan hukum sebelum berlaku secara resmi.
          </div>
        </div>

        <p className="text-sm leading-relaxed mb-10" style={{ color: TEXT_SEC }}>
          UMKMu (&ldquo;kami&rdquo;, &ldquo;platform&rdquo;) berkomitmen melindungi privasi seluruh pengguna — baik Merchant (UMKM yang menggunakan platform) maupun Customer (pembeli di toko Merchant). Kebijakan ini menjelaskan data apa yang kami kumpulkan, bagaimana kami menggunakannya, dan hak Anda atas data tersebut, sesuai <strong>Undang-Undang No. 27 Tahun 2022 tentang Pelindungan Data Pribadi (UU PDP)</strong>.
        </p>

        <Section title="1. Data yang Kami Kumpulkan">
          <p><strong style={{ color: PRIMARY }}>Untuk Merchant:</strong></p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Nama lengkap dan nama bisnis</li>
            <li>Alamat email dan nomor WhatsApp</li>
            <li>Informasi toko: nama brand, kategori produk, deskripsi bisnis</li>
            <li>Data produk yang diunggah: nama, harga, stok, foto</li>
            <li>Riwayat transaksi dan pembayaran subscription</li>
          </ul>
          <p className="mt-3"><strong style={{ color: PRIMARY }}>Untuk Customer:</strong></p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Nama lengkap, alamat email, dan nomor WhatsApp</li>
            <li>Alamat pengiriman</li>
            <li>Riwayat pesanan dan transaksi di toko Merchant</li>
            <li>Preferensi produk (misal: jenis kulit, concern skincare) yang diberikan melalui chatbot</li>
            <li>Percakapan dengan AI Chatbot toko</li>
          </ul>
          <p className="mt-3"><strong style={{ color: PRIMARY }}>Data Teknis (otomatis):</strong></p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Alamat IP dan jenis perangkat/browser</li>
            <li>Data sesi dan cookie</li>
            <li>Log aktivitas platform (halaman yang dikunjungi, waktu akses)</li>
          </ul>
        </Section>

        <Section title="2. Tujuan Pengumpulan Data">
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>Operasional toko:</strong> Memungkinkan Merchant mengelola toko, produk, dan pesanan; memungkinkan Customer melakukan pembelian.</li>
            <li><strong>Pemrosesan pembayaran:</strong> Memverifikasi bukti pembayaran QRIS dan memproses subscription Merchant.</li>
            <li><strong>Notifikasi:</strong> Mengirim pemberitahuan pesanan, pengiriman, dan informasi layanan melalui WhatsApp dan email.</li>
            <li><strong>AI Chatbot:</strong> Mempersonalisasi rekomendasi produk berdasarkan preferensi Customer.</li>
            <li><strong>Analitik:</strong> Memberikan laporan penjualan dan insight kepada Merchant tentang performa toko mereka.</li>
            <li><strong>Keamanan:</strong> Mendeteksi dan mencegah penipuan atau penyalahgunaan platform.</li>
          </ul>
        </Section>

        <Section title="3. Dasar Hukum Pemrosesan Data">
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>Pelaksanaan kontrak:</strong> Data diproses untuk memenuhi perjanjian layanan antara UMKMu dan Merchant, serta untuk memfasilitasi transaksi antara Merchant dan Customer.</li>
            <li><strong>Kepentingan sah (legitimate interest):</strong> Analitik platform, keamanan sistem, dan peningkatan layanan.</li>
            <li><strong>Persetujuan:</strong> Untuk komunikasi pemasaran opsional. Anda dapat menarik persetujuan kapan saja.</li>
          </ul>
        </Section>

        <Section title="4. Pihak Ketiga yang Menerima Data">
          <p>Kami hanya berbagi data dengan pihak ketiga yang diperlukan untuk operasional platform:</p>
          <div className="mt-3 space-y-3">
            {[
              { name: 'Supabase', reason: 'Penyimpanan database dan autentikasi pengguna', detail: 'Data disimpan di server Supabase dengan enkripsi standar industri.' },
              { name: 'Google Gemini AI', reason: 'Pemrosesan AI Chatbot dan verifikasi bukti pembayaran', detail: 'Percakapan chatbot dan gambar bukti bayar dikirim ke Google untuk diproses.' },
              { name: 'Fonnte (WhatsApp)', reason: 'Pengiriman notifikasi WhatsApp', detail: 'Nomor HP dan isi pesan notifikasi dikirim melalui Fonnte API.' },
              { name: 'Xendit', reason: 'Pemrosesan pembayaran subscription', detail: 'Data transaksi keuangan diproses melalui gateway Xendit.' },
              { name: 'Vercel', reason: 'Hosting dan infrastruktur platform', detail: 'Semua traffic platform melalui infrastruktur Vercel.' },
            ].map((p) => (
              <div key={p.name} className="p-4 rounded-xl bg-white" style={{ border: `1px solid ${BORDER}` }}>
                <div className="font-semibold text-sm mb-1" style={{ color: PRIMARY }}>{p.name}</div>
                <div className="text-sm">{p.reason} — {p.detail}</div>
              </div>
            ))}
          </div>
          <p className="mt-3">Kami tidak menjual data pribadi Anda kepada pihak ketiga untuk tujuan komersial.</p>
        </Section>

        <Section title="5. Retensi Data">
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>Data Merchant:</strong> Disimpan selama subscription aktif, ditambah 90 hari setelah terminasi untuk keperluan ekspor data.</li>
            <li><strong>Data Customer:</strong> Disimpan selama akun aktif. Data transaksi disimpan minimal 5 tahun sesuai ketentuan perpajakan Indonesia.</li>
            <li><strong>Data Chatbot:</strong> Log percakapan disimpan selama 12 bulan, kemudian dianonimkan.</li>
            <li><strong>Data Teknis:</strong> Log sistem disimpan maksimal 90 hari.</li>
          </ul>
        </Section>

        <Section title="6. Hak Subjek Data">
          <p>Sesuai UU PDP, Anda memiliki hak-hak berikut:</p>
          <div className="mt-3 grid sm:grid-cols-2 gap-3">
            {[
              { hak: 'Akses', desc: 'Meminta salinan data pribadi yang kami simpan tentang Anda.' },
              { hak: 'Koreksi', desc: 'Meminta perbaikan data yang tidak akurat atau tidak lengkap.' },
              { hak: 'Penghapusan', desc: 'Meminta penghapusan data (dengan mempertimbangkan kewajiban hukum yang berlaku).' },
              { hak: 'Portabilitas', desc: 'Meminta data Anda dalam format yang dapat dibaca mesin.' },
              { hak: 'Keberatan', desc: 'Menolak pemrosesan data untuk tujuan tertentu seperti pemasaran.' },
              { hak: 'Penarikan Persetujuan', desc: 'Menarik persetujuan yang pernah diberikan kapan saja.' },
            ].map((r) => (
              <div key={r.hak} className="p-3 rounded-xl bg-white" style={{ border: `1px solid ${BORDER}` }}>
                <div className="font-semibold text-sm mb-1" style={{ color: PRIMARY }}>{r.hak}</div>
                <div className="text-xs">{r.desc}</div>
              </div>
            ))}
          </div>
          <p className="mt-4">
            Untuk menggunakan hak-hak ini, hubungi kami di{' '}
            <a href="mailto:halo@umkmu.site" className="underline font-medium" style={{ color: PRIMARY }}>halo@umkmu.site</a>.
            {' '}Kami akan merespons dalam 14 hari kerja.
          </p>
        </Section>

        <Section title="7. Keamanan Data">
          <ul className="list-disc pl-5 space-y-2">
            <li>Semua data dienkripsi dalam transit (HTTPS/TLS) dan saat tersimpan di database.</li>
            <li>Akses ke data produksi dibatasi hanya pada tim teknis yang memerlukan.</li>
            <li>Kami melakukan audit keamanan secara berkala.</li>
            <li>Jika terjadi kebocoran data yang mempengaruhi Anda, kami akan memberitahu dalam 72 jam sesuai ketentuan UU PDP.</li>
          </ul>
        </Section>

        <Section title="8. Cookie dan Analitik">
          <p>Kami menggunakan cookie untuk:</p>
          <ul className="list-disc pl-5 space-y-1 mt-2">
            <li><strong>Cookie esensial:</strong> Mempertahankan sesi login. Tidak dapat dinonaktifkan karena diperlukan untuk fungsi platform.</li>
            <li><strong>Cookie analitik:</strong> Memahami bagaimana platform digunakan untuk perbaikan layanan. Anda dapat menolak melalui pengaturan browser.</li>
          </ul>
          <p className="mt-3">Kami tidak menggunakan cookie iklan pihak ketiga.</p>
        </Section>

        <Section title="9. Perubahan Kebijakan">
          <p>
            Jika kami melakukan perubahan material pada kebijakan ini, kami akan memberitahu Anda melalui email setidaknya 30 hari sebelum perubahan berlaku. Penggunaan platform setelah tanggal berlaku dianggap sebagai penerimaan kebijakan yang diperbarui.
          </p>
        </Section>

        <Section title="10. Hubungi Kami">
          <p>Pertanyaan, permintaan, atau kekhawatiran terkait privasi dapat disampaikan ke:</p>
          <div className="mt-3 p-4 rounded-xl bg-white" style={{ border: `1px solid ${BORDER}` }}>
            <div className="font-semibold text-sm mb-1" style={{ color: PRIMARY }}>UMKMu — Tim Privasi</div>
            <div className="text-sm">
              Email: <a href="mailto:halo@umkmu.site" className="underline" style={{ color: PRIMARY }}>halo@umkmu.site</a>
            </div>
            <div className="text-sm mt-1">
              Website: <a href="https://umkmu.site" className="underline" style={{ color: PRIMARY }}>umkmu.site</a>
            </div>
          </div>
        </Section>
      </main>

      {/* Footer */}
      <footer className="py-8 text-center text-sm" style={{ borderTop: `1px solid ${BORDER}`, color: TEXT_SEC }}>
        <span>© 2026 UMKMu.site · </span>
        <Link href="/terms" className="underline hover:text-[#0A2F73]">Syarat &amp; Ketentuan</Link>
        <span> · </span>
        <Link href="/privacy" className="underline hover:text-[#0A2F73]">Kebijakan Privasi</Link>
      </footer>
    </div>
  )
}
