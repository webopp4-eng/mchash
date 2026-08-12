import './globals.css';
import type { Metadata } from 'next';
import SPARedirect from './SPARedirect';
import Providers from '@/components/WagmiProvider';
import '@rainbow-me/rainbowkit/styles.css';

export const metadata: Metadata = {
  title: 'CM HASH',
  description: 'CM HASH cloud mining platform',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>
          {children}
          <SPARedirect />
        </Providers>
      </body>
    </html>
  );
}
