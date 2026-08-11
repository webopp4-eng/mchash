'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function SPARedirect() {
  const router = useRouter();

  useEffect(() => {
    const redirectPath = sessionStorage.getItem('cmhash_redirect');
    if (redirectPath) {
      sessionStorage.removeItem('cmhash_redirect');
      router.replace(redirectPath);
    }
  }, [router]);

  return null;
}