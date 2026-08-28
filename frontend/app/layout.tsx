import './globals.css';
import type { Metadata, Viewport } from 'next';
import { Poppins } from 'next/font/google';
import NotificationContainer from '@/components/NotificationToast';
import DeviceNoticeProvider from '@/components/DeviceNoticeProvider';
import AgeGate from '@/components/AgeGate';

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800'],
  display: 'swap',
});

const SITE_URL = 'https://mchash.site';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'MC HASH — Cloud Mining Platform',
    template: '%s | MC HASH',
  },
  description:
    'MC HASH is a cloud mining platform that lets you mine Solana, Ethereum and BNB conveniently from a connected crypto wallet. Earn block rewards through managed hashrate plans and track earnings, deposits and withdrawals in one dashboard.',
  applicationName: 'MC HASH',
  authors: [{ name: 'MC HASH' }],
  generator: 'Next.js',
  keywords: [
    'MC HASH',
    'cloud mining',
    'crypto mining',
    'Solana mining',
    'Ethereum mining',
    'BNB mining',
    'wallet mining',
    'hashrate plans',
  ],
  creator: 'MC HASH',
  publisher: 'MC HASH',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
  alternates: {
    canonical: SITE_URL,
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: SITE_URL,
    siteName: 'MC HASH',
    title: 'MC HASH — Cloud Mining Platform',
    description:
      'Mine Solana, Ethereum and BNB through managed cloud mining plans. Connect your wallet and start earning from your dashboard.',
    images: [
      {
        url: `${SITE_URL}/mchash-og.png`,
        width: 1200,
        height: 630,
        alt: 'MC HASH — Cloud Mining on Solana, Ethereum and BNB',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'MC HASH — Cloud Mining Platform',
    description:
      'Mine Solana, Ethereum and BNB through managed cloud mining plans. Connect your wallet and start earning from your dashboard.',
    images: [`${SITE_URL}/mchash-og.png`],
    creator: '@mchash',
  },
  icons: {
    icon: [
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
    ],
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
  },
  manifest: '/site.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'MC HASH',
  },
  formatDetection: {
    telephone: false,
  },
  category: 'technology',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#0a0e1a',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="mask-icon" href="/safari-pinned-tab.svg" color="#008cff" />
        <meta name="msapplication-TileColor" content="#0a0e1a" />
      </head>
      <body className={poppins.className}>
        {children}
        <NotificationContainer />
        <DeviceNoticeProvider />
        <AgeGate />
      </body>
    </html>
  );
}