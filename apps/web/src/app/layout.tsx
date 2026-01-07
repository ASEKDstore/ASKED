import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import Script from 'next/script';

import { Footer } from '@/components/Footer';
import { Providers } from '@/lib/providers';

import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'ASKED Miniapp',
  description: 'ASKED Miniapp Application',
  manifest: '/site.webmanifest',
  icons: {
    icon: [
      { url: '/icon.png', sizes: '512x512', type: 'image/png' },
      { url: '/favicon.ico', sizes: 'any' },
    ],
    shortcut: '/favicon.ico',
    apple: '/icon.png',
  },
  openGraph: {
    title: 'ASKED Miniapp',
    description: 'ASKED Miniapp Application',
    images: [
      {
        url: '/og.png',
        width: 1200,
        height: 1200,
        alt: 'ASKED',
      },
    ],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ASKED Miniapp',
    description: 'ASKED Miniapp Application',
    images: ['/og.png'],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}): JSX.Element {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Script
          src="https://telegram.org/js/telegram-web-app.js"
          strategy="beforeInteractive"
        />
        <Providers>
          <div className="flex flex-col min-h-screen">
            <main className="flex-1">{children}</main>
            <Footer />
          </div>
        </Providers>
      </body>
    </html>
  );
}

