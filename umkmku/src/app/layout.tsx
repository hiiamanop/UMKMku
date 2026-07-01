import type { Metadata } from "next";
import { Libre_Caslon_Text, Hanken_Grotesk } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";

const libreCaslon = Libre_Caslon_Text({
  variable: "--font-serif",
  subsets: ["latin"],
  weight: ["400", "700"],
  style: ["normal", "italic"],
});

const hankenGrotesk = Hanken_Grotesk({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "600", "700"],
});

export const metadata: Metadata = {
  metadataBase: new URL('https://www.umkmu.site'),
  title: {
    default: 'UMKMu — Platform Toko Online untuk UMKM Indonesia',
    template: '%s | UMKMu',
  },
  description: 'Buat toko online profesional untuk UMKM-mu dalam 60 detik. Subdomain sendiri, AI chatbot, checkout QRIS, dan manajemen pesanan — semua dalam satu platform.',
  keywords: ['toko online umkm', 'website umkm indonesia', 'marketplace builder', 'toko online skincare', 'toko online parfum', 'jualan online indonesia'],
  authors: [{ name: 'UMKMu' }],
  openGraph: {
    type: 'website',
    locale: 'id_ID',
    url: 'https://www.umkmu.site',
    siteName: 'UMKMu',
    title: 'UMKMu — Platform Toko Online untuk UMKM Indonesia',
    description: 'Buat toko online profesional untuk UMKM-mu dalam 60 detik.',
    images: [{ url: 'https://www.umkmu.site/og-image.png', width: 1200, height: 630, alt: 'UMKMu Platform' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'UMKMu — Platform Toko Online untuk UMKM Indonesia',
    description: 'Buat toko online profesional untuk UMKM-mu dalam 60 detik.',
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: [
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon.ico' },
    ],
    apple: { url: '/apple-touch-icon.png', sizes: '180x180' },
    other: [
      { rel: 'android-chrome', url: '/android-chrome-192x192.png', sizes: '192x192' },
      { rel: 'android-chrome', url: '/android-chrome-512x512.png', sizes: '512x512' },
    ],
  },
};

const orgSchema = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'UMKMu',
  url: 'https://www.umkmu.site',
  logo: 'https://www.umkmu.site/logo.png',
  description: 'Platform web dan marketplace builder untuk UMKM lokal Indonesia.',
  address: { '@type': 'PostalAddress', addressCountry: 'ID' },
  contactPoint: { '@type': 'ContactPoint', email: 'halo@umkmu.site' },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className={`${libreCaslon.variable} ${hankenGrotesk.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(orgSchema) }} />
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
