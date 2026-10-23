'use client';

/**
 * 施設メニュー（代理ログイン中）
 * 顧客ワイヤー 操作UI_施設マスタ v3.3 の #view-ctx。SAMS 管理者が［この施設で開く］から入る。
 * 入るときにモックの「選択中の施設」をこの施設に切り替え、戻るときに元へ戻す。
 */
import React, { Suspense, useMemo } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Flag } from 'lucide-react';
import { Header } from '@/components/layouts/Header';
import { useToast } from '@/components/ui/Toast';
import { useShipFacilities } from '@/lib/hooks/useShipFacilities';
import { useAuthStore } from '@/lib/stores/authStore';
import { useFacilityMasterRole } from '@/components/ship-facility-master/useFacilityMasterRole';
import { contractStatusOf } from '@/lib/utils/shipFacilityMaster';

const MENU = [
  { href: '/hospital-facility-master', title: '個別部署マスタ', desc: '1行＝1部屋。資産の設置場所' },
  { href: '/vendor-master', title: '個別業者マスタ', desc: '見積依頼・発注の宛先' },
  { href: '/user-management', title: '個別ユーザーマスタ', desc: 'この施設のログインアカウント' },
];

/** 施設に入る前に選んでいた施設（戻るときに元へ戻す） */
let previousFacility: string | null | undefined;

function FacilityContext() {
  const router = useRouter();
  const params = useSearchParams();
  const { showToast } = useToast();
  const { facilities, isLoading } = useShipFacilities();
  const selectedFacility = useAuthStore((s) => s.selectedFacility);
  const setSelectedFacility = useAuthStore((s) => s.setSelectedFacility);
  const { isSams } = useFacilityMasterRole();
  const facility = useMemo(() => facilities.find((f) => f.id === params.get('id')), [facilities, params]);

  // 代理ログインは SAMS 管理者だけ。未契約の施設には入れない（一覧の［この施設で開く］と同じ条件）
  if (!isSams || (facility && contractStatusOf(facility) === '未契約')) {
    return (
      <section className="m-6 bg-surface-card border border-stroke-card rounded-lg p-6 flex flex-col items-start gap-3 max-w-[640px]">
        <h1 className="text-lg font-bold text-content-primary">この施設には入れません</h1>
        <p className="text-sm text-content-primary">
          {!isSams ? '［この施設で開く］はSAMS管理者だけの操作です。担当施設のマスタは業務メニューから開いてください。' : '未契約の施設には入れません。'}
        </p>
        <Link href="/ship-facility-master" className="min-h-[44px] px-4 inline-flex items-center rounded-md border border-stroke-input bg-white text-sm font-semibold hover:bg-bg-light">
          一覧に戻る
        </Link>
      </section>
    );
  }

  if (!facility) {
    return <p className="px-6 py-6 text-sm text-content-sub">{isLoading ? '施設を読み込み中です。' : '施設が見つかりません。一覧から開き直してください。'}</p>;
  }

  const enterIfNeeded = () => {
    if (selectedFacility === facility.facilityName) return;
    if (previousFacility === undefined) previousFacility = selectedFacility;
    setSelectedFacility(facility.facilityName);
  };

  const leave = () => {
    if (previousFacility !== undefined) {
      if (previousFacility) setSelectedFacility(previousFacility);
      previousFacility = undefined;
    }
    showToast('管理コンソールへ戻りました', 'info');
    router.push('/ship-facility-master');
  };

  return (
    <>
      <div className="flex flex-wrap items-center gap-3 px-6 py-2 bg-amber-50 border-b-2 border-amber-400 text-sm text-amber-900">
        <Flag className="w-4 h-4" aria-hidden />
        <b>{facility.facilityName} として操作中</b>
        <span>（代理ログイン。操作は監査ログに記録されます）</span>
        <button type="button" onClick={leave} className="ml-auto min-h-[44px] px-4 rounded-md border border-amber-300 bg-white text-sm font-semibold hover:bg-amber-100">
          管理コンソールへ戻る
        </button>
      </div>
      <main className="flex-1 px-6 py-6 flex flex-col gap-4">
        <h1 className="text-xl font-bold text-content-primary text-balance">{facility.facilityName}　施設メニュー</h1>
        <p className="px-4 py-2 rounded-md border border-sky-200 bg-sky-50 text-sm text-sky-900">
          この施設のデータだけを対象に操作します。ここから先の画面はすべて施設コンテキストが適用されます。
        </p>
        <div className="grid gap-4 grid-cols-1 md:grid-cols-3 max-w-[1100px]">
          {MENU.map((m) => (
            <Link
              key={m.href}
              href={m.href}
              onClick={enterIfNeeded}
              className="bg-surface-card border border-stroke-card rounded-lg p-5 flex flex-col gap-1 hover:border-cta-primary hover:shadow-md transition-shadow"
            >
              <span className="text-base font-bold text-content-primary">{m.title}</span>
              <span className="text-sm text-content-sub">{m.desc}</span>
            </Link>
          ))}
        </div>
      </main>
    </>
  );
}

export default function FacilityContextPage() {
  return (
    <div className="flex flex-col min-h-dvh bg-surface-screen">
      <Header title="SHIP資産管理システム" showBackButton={false} hideMenu hideHomeButton showOriginalLabel={false} />
      <Suspense fallback={<p className="px-6 py-6 text-sm text-content-sub">読み込み中です。</p>}>
        <FacilityContext />
      </Suspense>
    </div>
  );
}
