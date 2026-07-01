import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Syarat & Ketentuan | UMKMu',
  description: 'Syarat dan ketentuan penggunaan platform UMKMu untuk Merchant dan Customer.',
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

export default function TermsPage() {
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
          <h1 className="text-3xl font-bold mb-3" style={{ color: PRIMARY }}>Syarat &amp; Ketentuan</h1>
          <p className="text-sm" style={{ color: TEXT_SEC }}>
            Terakhir diperbarui: 30 Juni 2026
          </p>
          <div className="mt-4 p-4 rounded-xl text-sm" style={{ background: `${GOLD}18`, border: `1px solid ${GOLD}44`, color: '#7A5C00' }}>
            <strong>Catatan:</strong> Dokumen ini adalah draf yang masih perlu ditinjau oleh konsultan hukum sebelum berlaku secara resmi.
          </div>
        </div>

        <p className="text-sm leading-relaxed mb-10" style={{ color: TEXT_SEC }}>
          Syarat dan Ketentuan ini mengatur penggunaan platform UMKMu oleh semua pihak. Dengan mendaftar atau menggunakan layanan UMKMu, Anda menyetujui syarat-syarat yang tercantum di bawah ini. Harap baca dokumen ini sebelum menggunakan layanan kami.
        </p>

        <Section title="1. Definisi">
          <ul className="list-disc pl-5 space-y-2">
            <li><strong style={{ color: PRIMARY }}>Platform</strong>, Layanan UMKMu yang dapat diakses melalui umkmu.site dan subdomain terkait.</li>
            <li><strong style={{ color: PRIMARY }}>Merchant</strong>, UMKM atau individu yang mendaftar untuk membuat dan mengelola toko online di UMKMu.</li>
            <li><strong style={{ color: PRIMARY }}>Customer</strong>, Individu yang mengunjungi dan melakukan pembelian di toko Merchant melalui Platform.</li>
            <li><strong style={{ color: PRIMARY }}>Konten</strong>, Semua informasi, teks, gambar, dan data yang diunggah atau dibuat oleh Merchant di Platform.</li>
            <li><strong style={{ color: PRIMARY }}>Layanan</strong>, Seluruh fitur Platform termasuk pembuatan toko, AI Chatbot, checkout, manajemen pesanan, dan notifikasi.</li>
          </ul>
        </Section>

        <Section title="2. Penerimaan Syarat">
          <p>
            Dengan mendaftar sebagai Merchant, mengakses dashboard, atau menggunakan fitur apapun di Platform, Anda dianggap telah membaca, memahami, dan menyetujui Syarat &amp; Ketentuan ini beserta Kebijakan Privasi kami. Jika Anda tidak menyetujui, harap hentikan penggunaan Platform.
          </p>
          <p>
            Anda harus berusia minimal 17 tahun atau memiliki persetujuan orang tua/wali untuk menggunakan Platform.
          </p>
        </Section>

        <Section title="3. Layanan yang Disediakan">
          <p>UMKMu menyediakan kepada Merchant:</p>
          <ul className="list-disc pl-5 space-y-2">
            <li>Toko online dengan subdomain sendiri (nama-brand.umkmu.site)</li>
            <li>AI Chatbot untuk membantu Customer menemukan produk</li>
            <li>Sistem checkout dan verifikasi pembayaran QRIS berbasis AI</li>
            <li>Dashboard manajemen produk, pesanan, dan analitik penjualan</li>
            <li>Notifikasi otomatis via WhatsApp untuk Merchant dan Customer</li>
            <li>Onboarding berbasis AI untuk pembuatan toko</li>
          </ul>
          <p>
            UMKMu berhak mengubah, menambah, atau menghentikan fitur tertentu dengan pemberitahuan minimal 30 hari kepada Merchant aktif, kecuali perubahan yang bersifat darurat (keamanan, hukum).
          </p>
        </Section>

        <Section title="4. Kewajiban Merchant">
          <p>Merchant bertanggung jawab penuh atas:</p>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>Keakuratan konten:</strong> Informasi produk, harga, stok, dan deskripsi yang ditampilkan di toko.</li>
            <li><strong>Fulfillment pesanan:</strong> Pengiriman produk kepada Customer sesuai pesanan yang masuk.</li>
            <li><strong>Legalitas produk:</strong> Merchant dilarang menjual produk ilegal, obat tanpa izin BPOM, barang palsu/tiruan, produk mengandung konten dewasa, atau produk yang melanggar hukum Indonesia.</li>
            <li><strong>Keamanan akun:</strong> Menjaga kerahasiaan kredensial login dan tidak membagikan akses kepada pihak yang tidak berwenang.</li>
            <li><strong>Kepatuhan hukum:</strong> Mematuhi peraturan e-commerce Indonesia termasuk UU ITE, UU Perlindungan Konsumen, dan regulasi perpajakan yang berlaku.</li>
          </ul>
          <p>
            UMKMu berhak menangguhkan atau menghentikan akun Merchant yang melanggar ketentuan di atas tanpa pemberitahuan sebelumnya jika pelanggaran bersifat serius.
          </p>
        </Section>

        <Section title="5. Hubungan Merchant dan Customer">
          <p>
            Transaksi jual beli terjadi secara langsung antara Merchant dan Customer. UMKMu bertindak sebagai <strong>fasilitator platform</strong>, bukan sebagai penjual, dan tidak menjadi pihak dalam kontrak jual beli tersebut.
          </p>
          <ul className="list-disc pl-5 space-y-2">
            <li>Sengketa antara Merchant dan Customer diselesaikan langsung di antara kedua pihak.</li>
            <li>UMKMu tidak bertanggung jawab atas kualitas produk, keterlambatan pengiriman, atau ketidaksesuaian produk.</li>
            <li>UMKMu dapat membantu mediasi atas permintaan kedua pihak, namun keputusan akhir ada di tangan Merchant dan Customer.</li>
          </ul>
        </Section>

        <Section title="6. Subscription dan Pembayaran">
          <div className="space-y-4">
            <div>
              <p className="font-semibold mb-2" style={{ color: PRIMARY }}>Paket Layanan:</p>
              <div className="overflow-x-auto">
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr style={{ background: `${PRIMARY}11` }}>
                      <th className="text-left p-3 font-semibold" style={{ color: PRIMARY, border: `1px solid ${BORDER}` }}>Plan</th>
                      <th className="text-left p-3 font-semibold" style={{ color: PRIMARY, border: `1px solid ${BORDER}` }}>Harga</th>
                      <th className="text-left p-3 font-semibold" style={{ color: PRIMARY, border: `1px solid ${BORDER}` }}>Limit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { plan: 'Free Trial', harga: 'Rp 0 (7 hari)', limit: '10.000 AI token, suspend setelah habis' },
                      { plan: 'Business', harga: 'Rp 399.000/bulan', limit: '1.000.000 token, 1.000 pesanan/bulan' },
                      { plan: 'Enterprise', harga: 'Rp 599.000/bulan', limit: 'Pesanan tidak terbatas, 50 juta token' },
                    ].map((row) => (
                      <tr key={row.plan}>
                        <td className="p-3" style={{ border: `1px solid ${BORDER}` }}>{row.plan}</td>
                        <td className="p-3" style={{ border: `1px solid ${BORDER}` }}>{row.harga}</td>
                        <td className="p-3" style={{ border: `1px solid ${BORDER}` }}>{row.limit}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <p>
              <strong>Top-up pesanan:</strong> Merchant dapat membeli 50 pesanan tambahan seharga Rp 10.000 kapan saja melalui dashboard.
            </p>
            <p>
              <strong>Pembayaran:</strong> Subscription dibayar di muka melalui QRIS atau Xendit. Pembayaran dianggap sah setelah terverifikasi oleh sistem.
            </p>
            <p>
              <strong>Overage pesanan:</strong> Jika kuota pesanan Business hampir habis (sisa 20%), Merchant mendapat notifikasi WhatsApp. Pesanan tetap masuk dengan biaya overage Rp 1.000/pesanan yang ditagihkan bulan berikutnya.
            </p>
            <p>
              <strong>Kebijakan refund:</strong> Tidak ada pengembalian dana untuk periode berlangganan yang sudah berjalan. Pembatalan berlaku di akhir periode yang sudah dibayar.
            </p>
          </div>
        </Section>

        <Section title="7. Suspend dan Terminasi">
          <p><strong>Kondisi suspend otomatis:</strong></p>
          <ul className="list-disc pl-5 space-y-1 mt-2">
            <li>Free trial habis dan Merchant tidak berlangganan</li>
            <li>Pembayaran subscription gagal atau terlambat lebih dari 3 hari</li>
          </ul>
          <p className="mt-3"><strong>Kondisi suspend manual (pelanggaran):</strong></p>
          <ul className="list-disc pl-5 space-y-1 mt-2">
            <li>Menjual produk ilegal atau melanggar ketentuan Pasal 4</li>
            <li>Penyalahgunaan platform yang merugikan pihak lain</li>
            <li>Pelanggaran hukum yang berlaku di Indonesia</li>
          </ul>
          <p className="mt-3">
            Saat toko disuspend, Customer tidak dapat mengakses storefront. Merchant menerima notifikasi email dan WhatsApp. Untuk reaktivasi karena payment: perpanjang subscription melalui dashboard. Untuk suspend karena pelanggaran: hubungi halo@umkmu.site.
          </p>
          <p>
            Merchant dapat mengakhiri layanan kapan saja melalui dashboard. Data toko tersedia untuk dieksport selama 30 hari setelah terminasi.
          </p>
        </Section>

        <Section title="8. Kepemilikan Data">
          <p>
            <strong>Data toko adalah milik Merchant.</strong> Ini mencakup data produk, data Customer toko, riwayat pesanan, dan konten yang dibuat Merchant. UMKMu hanya memproses data ini atas nama Merchant untuk keperluan operasional platform.
          </p>
          <ul className="list-disc pl-5 space-y-2 mt-3">
            <li>Merchant dapat mengeksport data toko kapan saja melalui fitur ekspor di dashboard.</li>
            <li>Setelah terminasi, Merchant memiliki 30 hari untuk mengambil datanya sebelum dihapus permanen.</li>
            <li>UMKMu tidak menggunakan data toko Merchant untuk kepentingan komersial di luar operasional platform.</li>
          </ul>
        </Section>

        <Section title="9. Pembatasan Tanggung Jawab">
          <p>UMKMu tidak bertanggung jawab atas:</p>
          <ul className="list-disc pl-5 space-y-2">
            <li>Kerugian bisnis akibat downtime, gangguan teknis, atau perubahan fitur platform.</li>
            <li>Keputusan bisnis Merchant berdasarkan data atau rekomendasi AI dari Platform.</li>
            <li>Tindakan pihak ketiga termasuk mitra pembayaran, layanan pengiriman, atau infrastruktur cloud.</li>
            <li>Kehilangan pendapatan akibat suspend yang disebabkan oleh pelanggaran Merchant sendiri.</li>
          </ul>
          <p>
            Tanggung jawab maksimal UMKMu kepada Merchant tidak melebihi jumlah subscription yang dibayarkan dalam 3 bulan terakhir.
          </p>
        </Section>

        <Section title="10. Kekayaan Intelektual">
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>Milik UMKMu:</strong> Template toko, kode platform, desain antarmuka, merek UMKMu, dan teknologi AI yang dikembangkan oleh UMKMu.</li>
            <li><strong>Milik Merchant:</strong> Konten yang dibuat Merchant (teks produk, foto, branding brand). Merchant memberikan lisensi kepada UMKMu untuk menampilkan konten tersebut di Platform.</li>
            <li>Merchant tidak diperkenankan menyalin, mendistribusikan, atau menggunakan teknologi/template UMKMu di luar Platform tanpa izin tertulis.</li>
          </ul>
        </Section>

        <Section title="11. Perubahan Layanan">
          <p>
            UMKMu berhak mengubah, menambah, atau menghapus fitur Platform. Untuk perubahan yang berdampak signifikan, kami akan memberikan pemberitahuan minimal 30 hari melalui email dan notifikasi dashboard. Penggunaan Platform setelah perubahan berlaku dianggap sebagai penerimaan.
          </p>
          <p>
            UMKMu juga berhak mengubah harga subscription dengan pemberitahuan minimal 30 hari. Harga baru berlaku di periode perpanjangan berikutnya.
          </p>
        </Section>

        <Section title="12. Hukum yang Berlaku dan Penyelesaian Sengketa">
          <p>
            Syarat &amp; Ketentuan ini diatur oleh dan ditafsirkan sesuai dengan hukum Republik Indonesia.
          </p>
          <p>
            Segala sengketa yang timbul dari atau sehubungan dengan Syarat &amp; Ketentuan ini akan diselesaikan secara musyawarah terlebih dahulu. Jika tidak tercapai kesepakatan dalam 30 hari, sengketa akan diselesaikan melalui Pengadilan Negeri Jakarta Selatan.
          </p>
        </Section>

        <Section title="13. Hubungi Kami">
          <p>Pertanyaan mengenai Syarat &amp; Ketentuan dapat disampaikan ke:</p>
          <div className="mt-3 p-4 rounded-xl bg-white" style={{ border: `1px solid ${BORDER}` }}>
            <div className="font-semibold text-sm mb-1" style={{ color: PRIMARY }}>UMKMu, Tim Legal</div>
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
