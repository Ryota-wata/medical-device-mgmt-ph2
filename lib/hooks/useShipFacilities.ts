'use client';

import { useEffect, useState } from 'react';
import { useMasterStore } from '@/lib/stores/masterStore';
import type { FacilityMaster } from '@/lib/types/master';

/**
 * SHIP 施設マスタの施設一覧。
 * モックの初期施設（他画面で使う 21 件）に、顧客 SHIP施設マスタ（8,055 件）を後ろに足す。
 * 以前は顧客データで置き換えていたため、この画面を開くと他画面の施設（サンプル病院など）が消えていた。
 */
let loading: Promise<void> | null = null;

function loadCustomerFacilities() {
  if (!loading) {
    loading = import('@/lib/data/customer/facility-master').then(({ customerFacilities }) => {
      const { facilities, setFacilities } = useMasterStore.getState();
      const knownCodes = new Set(facilities.map((f) => f.facilityCode));
      const added = customerFacilities
        .filter((c) => !knownCodes.has(c.facilityCode))
        .map(
          (c, i): FacilityMaster => ({
            ...c,
            id: `FAC-${i}`,
            address: '',
            postalCode: '',
            phoneNumber: '',
            establishedDate: '',
            facilityType: '',
            bedCount: parseInt(c.totalBeds || '0', 10) || 0,
            status: 'active',
            createdAt: '2025-01-01T00:00:00Z',
            updatedAt: '2025-01-01T00:00:00Z',
          }),
        );
      setFacilities([...facilities, ...added]);
    });
  }
  return loading;
}

export function useShipFacilities() {
  const facilities = useMasterStore((s) => s.facilities);
  const [isLoading, setIsLoading] = useState(() => facilities.length < 1000);

  useEffect(() => {
    let cancelled = false;
    loadCustomerFacilities().then(() => {
      if (!cancelled) setIsLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return { facilities, isLoading };
}
