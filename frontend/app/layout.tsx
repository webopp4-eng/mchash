import './globals.css';
import type { Metadata } from 'next';
import { Poppins } from 'next/font/google';
import NotificationContainer from '@/components/NotificationToast';

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'MC HASH Admin',
  description: 'Admin panel for MC HASH cloud mining platform',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={poppins.className}>
        {children}
        <NotificationContainer />
      </body>
    </html>
  );
}
