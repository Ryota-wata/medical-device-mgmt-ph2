'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function PurchaseQuotationsRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/quotation-management');
  }, [router]);

  return (
    <div className="p-5 text-center text-content-sub">
      リダイレクト中...
    </div>
  );
}
