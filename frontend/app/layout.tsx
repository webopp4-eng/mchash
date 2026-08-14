import './globals.css';
import type { Metadata } from 'next';
import SPARedirect from './SPARedirect';
import Providers from '@/components/WagmiProvider';
import '@rainbow-me/rainbowkit/styles.css';
import { Poppins } from 'next/font/google';

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'MC HASH',
  description: 'MC HASH cloud mining platform',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={poppins.className}>
        <Providers>
          {children}
          <SPARedirect />
        </Providers>
      </body>
    </html>
  );
}
