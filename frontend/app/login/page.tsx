import { Suspense } from 'react';
import WalletSignIn from '@/components/WalletSignIn';

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen" />}>
      <WalletSignIn />
    </Suspense>
  );
}