import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'CM HASH',
  description: 'CM HASH cloud mining platform demo',
};

import Layout from '@/components/Layout';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Layout>{children}</Layout>
      </body>
    </html>
  );
}
