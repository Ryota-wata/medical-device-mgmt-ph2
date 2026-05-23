'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, Lock } from 'lucide-react';
import { useAuthStore, useMasterStore } from '@/lib/stores';
import { SearchableSelect } from '@/components/ui/SearchableSelect';
import { EmptyState } from '@/components/ui/EmptyState';

export default function FacilitySelectPage() {
  const router = useRouter();
  const { user, setSelectedFacility } = useAuthStore();
  const { facilities } = useMasterStore();
  const [selected, setSelected] = useState('');

  // 病院側ユーザー（user.hospital のみ）→ 自動設定して即リダイレクト
  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }

    // accessibleFacilities が無い＝病院側ユーザー
    if (!user.accessibleFacilities && user.hospital) {
      setSelectedFacility(user.hospital);
      router.push('/main');
    }
  }, [user, setSelectedFacility, router]);

  // 全施設管理者かどうか
  const isAllFacilityAdmin = user?.accessibleFacilities?.includes('全施設') ?? false;

  // SearchableSelect 用（全施設管理者のみ）
  const allFacilityOptions = useMemo(() => {
    return facilities.map(f => f.facilityName);
  }, [facilities]);

  // カード一覧用（コンサル・営業等）
  const facilityList = useMemo(() => {
    if (!user?.accessibleFacilities) return [];
    return user.accessibleFacilities.filter(f => f !== '全施設');
  }, [user]);

  const handleFacilitySelect = (facilityName: string) => {
    setSelectedFacility(facilityName);
    router.push('/main');
  };

  const handleSubmit = () => {
    if (!selected) return;
    setSelectedFacility(selected);
    router.push('/main');
  };

  // 病院側ユーザーはuseEffectで即リダイレクトされるので、SHIP側のみレンダリング
  if (!user || (!user.accessibleFacilities && user.hospital)) {
    return null;
  }

  return (
    <div className="min-h-dvh flex items-center justify-center bg-surface-screen overflow-y-auto py-8 font-figma">
      <div className="bg-surface-card border border-stroke-card w-full max-w-md mx-5 p-10 my-auto rounded-2xl">
        {/* タイトル */}
        <h1 className="text-[24px] font-bold text-center mb-4 text-balance text-content-primary leading-[1.3]">
          作業対象施設の選択
        </h1>
        <p className="text-base text-content-primary text-center mb-10 text-pretty leading-[1.5]">
          作業を行う施設を選択してください
        </p>

        {/* ユーザー情報 */}
        <div className="mb-6">
          <label className="block text-base font-normal mb-1 text-content-primary leading-[1.5]">
            管理者太郎
          </label>
          <div className="w-full h-[42px] px-3 py-[9px] text-base text-content-sub bg-content-placeholder rounded-lg border border-stroke-input">
            {user.email}
          </div>
        </div>

        {isAllFacilityAdmin ? (
          /* 全施設管理者: SearchableSelect + 決定ボタン */
          <>
            <div className="mb-8">
              <label className="block text-base font-normal mb-1 text-content-primary leading-[1.5]">
                <span className="text-content-alert">※</span>施設を選択
              </label>
              <SearchableSelect
                value={selected}
                onChange={setSelected}
                options={['', ...allFacilityOptions]}
                placeholder="施設名を入力して検索..."
              />
            </div>
            <button
              onClick={handleSubmit}
              disabled={!selected}
              className={`w-full h-12 border-0 rounded-lg text-base font-normal px-6 transition-colors ${
                selected
                  ? 'bg-cta-primary hover:opacity-90 text-white cursor-pointer'
                  : 'bg-surface-disabled text-content-disabled cursor-not-allowed'
              }`}
            >
              決定
            </button>
          </>
        ) : (
          /* コンサル・営業等: カード一覧 */
          <div className="flex flex-col gap-3">
            {facilityList.map((facilityName) => (
              <button
                key={facilityName}
                onClick={() => handleFacilitySelect(facilityName)}
                className="w-full text-left px-5 py-4 bg-surface-card border border-stroke-input rounded-lg text-base font-normal text-content-primary cursor-pointer transition-colors hover:border-cta-primary hover:bg-surface-select"
              >
                <div className="flex items-center justify-between">
                  <span>{facilityName}</span>
                  <ArrowRight className="w-5 h-5 text-cta-primary" aria-hidden />
                </div>
              </button>
            ))}

            {facilityList.length === 0 && (
              <EmptyState
                icon={<Lock size={48} strokeWidth={1.5} />}
                title="アクセス可能な施設がありません"
                description="表示できる施設が割り当てられていません。管理者にお問い合わせください"
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
