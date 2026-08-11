import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'CM HASH',
  description: 'CM HASH cloud mining platform',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}