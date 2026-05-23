'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { usePermissions } from '@/lib/hooks';

// /quotation-data-box にアクセスした場合は適切なタブにリダイレクト
// consultant は購入管理にアクセスできないため、リモデル管理にリダイレクト
export default function QuotationDataBoxRedirect() {
  const router = useRouter();
  const { role } = usePermissions();

  useEffect(() => {
    if (role === 'consultant') {
      router.replace('/quotation-data-box/remodel-management');
    } else {
      router.replace('/quotation-data-box/purchase-management');
    }
  }, [router, role]);

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100dvh',
      background: '#FAFAFA'
    }}>
      <p>リダイレクト中...</p>
    </div>
  );
}
