const FEATURES = [
  {
    icon: '🛒',
    title: 'Pilihan Lengkap',
    desc: 'Ratusan produk segar dan siap saji tersedia setiap harinya.',
  },
  {
    icon: '🚚',
    title: 'Pengiriman Cepat',
    desc: 'Pesan sekarang, terima hari ini. Layanan pengiriman ekspres tersedia.',
  },
  {
    icon: '✅',
    title: 'Kualitas Terjamin',
    desc: 'Setiap produk dipilih langsung dari sumber terpercaya dan higienis.',
  },
  {
    icon: '💳',
    title: 'Pembayaran Aman',
    desc: 'QRIS, transfer bank, dan berbagai metode pembayaran tersedia.',
  },
]

export function FnbFeatures() {
  return (
    <section className="bg-[var(--color-secondary)] py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-10">
          <p className="text-[var(--color-primary)] font-semibold text-sm mb-1">Kenapa Kami?</p>
          <h2 className="text-3xl font-black text-gray-900">Keunggulan Kami</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {FEATURES.map(({ icon, title, desc }) => (
            <div key={title} className="bg-white rounded-2xl p-6 flex flex-col gap-3 shadow-sm hover:shadow-md transition-shadow">
              <span className="text-4xl">{icon}</span>
              <h3 className="font-bold text-gray-900">{title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
