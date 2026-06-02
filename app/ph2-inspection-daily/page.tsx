'use client';

import React, { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AppHeader } from '@/components/layouts/AppHeader';
import {
  Stethoscope,
  Search,
  Calendar,
  Settings2,
  X,
  AlertTriangle,
  CheckSquare,
  Square,
} from 'lucide-react';

type InspectionType = '始業前' | '定期' | '日常' | '受入';

interface InspectionItem {
  assetId: string;
  assetName: string;
  maker: string;
  model: string;
  serial: string;
  location: string;
  type: InspectionType;
  nextDate: string;
  lastDate?: string;
  inspector?: string;
  dailyMenu?: string;
  cycle?: string;
}

const MOCK_ITEMS: InspectionItem[] = [
  {
    assetId: 'AST-10024',
    assetName: '生体情報モニタ BSM-3500',
    maker: '日本光電',
    model: 'BSM-3500',
    serial: 'SN202601',
    location: 'ICU',
    type: '日常',
    nextDate: '2026-05-24',
    lastDate: '2026-05-23',
    inspector: '田中 花子',
    dailyMenu: 'A: 始業前点検 + 電源確認',
    cycle: '毎日',
  },
  {
    assetId: 'AST-10025',
    assetName: '人工呼吸器 SV-300',
    maker: 'マッケ',
    model: 'SV-300',
    serial: 'SN202602',
    location: 'ICU',
    type: '始業前',
    nextDate: '2026-05-24',
    lastDate: '2026-05-23',
    inspector: '田中 花子',
    cycle: '毎日',
  },
  {
    assetId: 'AST-10026',
    assetName: '輸液ポンプ TE-SS720',
    maker: 'テルモ',
    model: 'TE-SS720',
    serial: 'SN202603',
    location: '一般病棟',
    type: '日常',
    nextDate: '2026-05-24',
    lastDate: '2026-05-23',
    inspector: '高橋 健二',
    dailyMenu: 'B: 動作確認のみ',
    cycle: '毎日',
  },
  {
    assetId: 'AST-10027',
    assetName: 'シリンジポンプ TE-SS831',
    maker: 'テルモ',
    model: 'TE-SS831',
    serial: 'SN202604',
    location: '一般病棟',
    type: '定期',
    nextDate: '2026-06-01',
    lastDate: '2026-03-01',
    inspector: '田中 花子',
    cycle: '四半期',
  },
  {
    assetId: 'AST-10028',
    assetName: '除細動器 LIFEPAK 20',
    maker: '日本ストライカー',
    model: 'LIFEPAK 20',
    serial: 'SN202605',
    location: '救急処置室',
    type: '日常',
    nextDate: '2026-05-24',
    lastDate: '2026-05-23',
    inspector: '渡辺 京子',
    dailyMenu: 'C: 除細動器専用日常メニュー',
    cycle: '毎日',
  },
  {
    assetId: 'AST-10029',
    assetName: '電気メス ESG-400',
    maker: 'オリンパス',
    model: 'ESG-400',
    serial: 'SN202606',
    location: '手術室1',
    type: '受入',
    nextDate: '2026-05-25',
    inspector: '田中 花子',
  },
  {
    assetId: 'AST-10030',
    assetName: '超音波診断装置 LISENDO 880',
    maker: '日立',
    model: 'LISENDO 880',
    serial: 'SN202607',
    location: '検査部門',
    type: '定期',
    nextDate: '2026-06-15',
    lastDate: '2026-03-15',
    inspector: '高橋 健二',
    cycle: '半年',
  },
  {
    assetId: 'AST-10031',
    assetName: 'パルスオキシメータ NellcorPM10N',
    maker: 'メドトロニック',
    model: 'NellcorPM10N',
    serial: 'SN202608',
    location: '一般病棟',
    type: '日常',
    nextDate: '2026-05-24',
    lastDate: '2026-05-23',
    inspector: '渡辺 京子',
    dailyMenu: 'D: 簡易動作確認',
    cycle: '毎日',
  },
];

const TYPE_STYLE: Record<InspectionType, string> = {
  '始業前': 'bg-amber-50 text-amber-700 border-amber-200',
  '定期': 'bg-sky-50 text-sky-700 border-sky-200',
  '日常': 'bg-emerald-50 text-emerald-700 border-emerald-200',
  '受入': 'bg-violet-50 text-violet-700 border-violet-200',
};

export default function InspectionDailyPage() {
  const router = useRouter();
  const [keyword, setKeyword] = useState('');
  const [typeFilters, setTypeFilters] = useState<Set<InspectionType>>(
    new Set<InspectionType>(['始業前', '定期', '日常', '受入']),
  );
  const [menuTarget, setMenuTarget] = useState<InspectionItem | null>(null);
  const [unregTarget, setUnregTarget] = useState<InspectionItem | null>(null);

  const filtered = useMemo(() => {
    const kw = keyword.trim().toLowerCase();
    return MOCK_ITEMS.filter((it) => {
      if (!typeFilters.has(it.type)) return false;
      if (kw) {
        const hay = `${it.assetId} ${it.assetName} ${it.maker} ${it.model} ${it.serial} ${it.location} ${it.inspector ?? ''}`.toLowerCase();
        if (!hay.includes(kw)) return false;
      }
      return true;
    });
  }, [keyword, typeFilters]);

  const toggleType = (t: InspectionType) => {
    const next = new Set(typeFilters);
    if (next.has(t)) next.delete(t);
    else next.add(t);
    setTypeFilters(next);
  };

  return (
    <div className="min-h-dvh bg-surface-screen flex flex-col">
      <AppHeader />
      <main className="flex-1 px-4 lg:px-8 py-6 max-w-[1400px] w-full mx-auto">
        <div className="mb-5">
          <div className="flex items-center gap-2 text-xs text-content-sub mb-1">
            <button
              type="button"
              onClick={() => router.push('/ph2')}
              className="hover:text-content-link bg-transparent border-0 cursor-pointer p-0"
            >
              Ph2 提案機能
            </button>
            <span>/</span>
            <span>点検管理タブ 日常点検併載</span>
          </div>
          <h1 className="text-[24px] font-bold text-content-primary text-balance inline-flex items-center gap-2">
            <Stethoscope className="w-6 h-6 text-emerald-600" aria-hidden />
            タスク管理 ＞ 点検管理（日常点検 併載）(S18)
          </h1>
          <p className="mt-1 text-sm text-content-sub text-pretty max-w-3xl">
            点検種別フィルタに「日常点検」を追加。日常点検メニュー情報を一覧表示し、メニュー変更・登録解除を導線化。
          </p>
        </div>

        {/* フィルタバー */}
        <div className="bg-white border border-stroke-card rounded-lg p-4 mb-4">
          <div className="flex items-center gap-3 flex-wrap mb-3">
            <div className="relative flex-1 min-w-[240px] max-w-[420px]">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-content-sub"
                aria-hidden
              />
              <input
                type="text"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="資産ID / 機器名 / 設置場所 / 担当者 で検索"
                className="w-full h-10 pl-9 pr-3 text-sm border border-stroke-input rounded-lg outline-none focus:border-content-link bg-white"
              />
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-medium text-content-primary mr-1">点検種別:</span>
            {(['始業前', '定期', '日常', '受入'] as InspectionType[]).map((t) => {
              const on = typeFilters.has(t);
              return (
                <label
                  key={t}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border cursor-pointer text-sm transition-colors ${
                    on
                      ? 'bg-cta-primary text-white border-cta-primary'
                      : 'bg-white text-content-primary border-stroke-input hover:bg-surface-screen'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={on}
                    onChange={() => toggleType(t)}
                    className="sr-only"
                  />
                  {on ? <CheckSquare className="w-3.5 h-3.5" aria-hidden /> : <Square className="w-3.5 h-3.5" aria-hidden />}
                  {t}
                  {t === '日常' && (
                    <span className="inline-flex items-center px-1 py-0 text-[9px] font-semibold rounded bg-white/30">
                      Ph2 追加
                    </span>
                  )}
                </label>
              );
            })}
          </div>
        </div>

        <div className="flex items-center justify-between mb-3">
          <p className="text-sm text-content-sub">
            <span className="tabular-nums font-semibold text-content-primary">
              {filtered.length}
            </span>{' '}
            件 / 全 <span className="tabular-nums">{MOCK_ITEMS.length}</span> 件
          </p>
        </div>

        {/* テーブル */}
        <div className="bg-white border border-stroke-card rounded-lg overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-surface-screen text-xs font-semibold text-content-sub border-b border-stroke-card">
                <th className="px-3 py-2 text-left w-[110px]">資産ID</th>
                <th className="px-3 py-2 text-left w-[90px]">点検種別</th>
                <th className="px-3 py-2 text-left">機器名 / 型式</th>
                <th className="px-3 py-2 text-left w-[140px]">設置場所</th>
                <th className="px-3 py-2 text-left w-[110px]">次回</th>
                <th className="px-3 py-2 text-left w-[110px]">前回</th>
                <th className="px-3 py-2 text-left">日常点検情報 <span className="inline-flex items-center px-1 py-0 text-[9px] font-semibold rounded bg-sky-100 text-sky-700 ml-1">Ph2 追加</span></th>
                <th className="px-3 py-2 text-left w-[160px]">操作</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((it) => (
                <tr key={it.assetId} className="border-b border-stroke-card hover:bg-surface-screen">
                  <td className="px-3 py-2.5 font-mono text-xs tabular-nums">{it.assetId}</td>
                  <td className="px-3 py-2.5">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 text-xs font-semibold rounded border ${TYPE_STYLE[it.type]}`}
                    >
                      {it.type}
                    </span>
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="font-medium text-content-primary">{it.assetName}</div>
                    <div className="text-xs text-content-sub mt-0.5">
                      {it.maker} · {it.model}
                    </div>
                  </td>
                  <td className="px-3 py-2.5 text-xs">{it.location}</td>
                  <td className="px-3 py-2.5 tabular-nums text-xs">{it.nextDate}</td>
                  <td className="px-3 py-2.5 tabular-nums text-xs text-content-sub">
                    {it.lastDate ?? '—'}
                  </td>
                  <td className="px-3 py-2.5">
                    {it.type === '日常' ? (
                      <div className="text-xs">
                        <div className="text-content-primary font-medium">
                          {it.dailyMenu ?? 'メニュー未設定'}
                        </div>
                        <div className="text-content-sub mt-0.5">
                          サイクル: {it.cycle} · 担当: {it.inspector ?? '—'}
                        </div>
                      </div>
                    ) : (
                      <span className="text-xs text-content-sub">—</span>
                    )}
                  </td>
                  <td className="px-3 py-2.5">
                    {it.type === '日常' ? (
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <button
                          type="button"
                          onClick={() => setMenuTarget(it)}
                          className="inline-flex items-center gap-1 text-xs px-2 py-1 border border-stroke-input rounded-md hover:bg-surface-screen transition-colors cursor-pointer bg-white"
                        >
                          <Settings2 className="w-3 h-3" aria-hidden />
                          メニュー変更
                        </button>
                        <button
                          type="button"
                          onClick={() => setUnregTarget(it)}
                          className="inline-flex items-center gap-1 text-xs px-2 py-1 border border-rose-200 text-rose-700 rounded-md hover:bg-rose-50 transition-colors cursor-pointer bg-white"
                        >
                          <X className="w-3 h-3" aria-hidden />
                          登録解除
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        className="inline-flex items-center gap-1 text-xs px-2 py-1 border border-stroke-input rounded-md hover:bg-surface-screen transition-colors cursor-pointer bg-white"
                      >
                        <Calendar className="w-3 h-3" aria-hidden />
                        点検実施
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* メニュー変更モーダル */}
        {menuTarget && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
            role="dialog"
            aria-modal="true"
            onClick={() => setMenuTarget(null)}
          >
            <div
              className="bg-white w-full max-w-md rounded-2xl shadow-xl p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-base font-semibold text-content-primary mb-2">
                日常点検メニュー変更
              </h3>
              <p className="text-sm text-content-sub mb-3 text-pretty">
                {menuTarget.assetName}（{menuTarget.assetId}）の日常点検メニューを変更します。
              </p>
              <div className="space-y-2 mb-4">
                {[
                  { id: 'A', label: 'A: 始業前点検 + 電源確認', cycle: '毎日' },
                  { id: 'B', label: 'B: 動作確認のみ', cycle: '毎日' },
                  { id: 'C', label: 'C: 除細動器専用日常メニュー', cycle: '毎日' },
                  { id: 'D', label: 'D: 簡易動作確認', cycle: '毎日' },
                  { id: 'E', label: 'E: カスタムメニュー（要管理者承認）', cycle: '任意' },
                ].map((m) => (
                  <label
                    key={m.id}
                    className="flex items-start gap-2 px-3 py-2 border border-stroke-card rounded-md cursor-pointer hover:bg-surface-screen"
                  >
                    <input
                      type="radio"
                      name="daily-menu"
                      defaultChecked={menuTarget.dailyMenu?.startsWith(`${m.id}:`)}
                      className="mt-1 accent-cta-primary"
                    />
                    <div>
                      <div className="text-sm font-medium text-content-primary">{m.label}</div>
                      <div className="text-xs text-content-sub">サイクル: {m.cycle}</div>
                    </div>
                  </label>
                ))}
              </div>
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setMenuTarget(null)}
                  className="h-10 px-4 text-sm text-content-primary border border-stroke-input rounded-lg bg-white hover:bg-surface-screen transition-colors cursor-pointer"
                >
                  キャンセル
                </button>
                <button
                  type="button"
                  onClick={() => setMenuTarget(null)}
                  className="h-10 px-5 text-sm font-medium text-white bg-cta-primary rounded-lg hover:opacity-90 transition-opacity cursor-pointer"
                >
                  メニューを変更
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 登録解除モーダル */}
        {unregTarget && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
            role="dialog"
            aria-modal="true"
            onClick={() => setUnregTarget(null)}
          >
            <div
              className="bg-white w-full max-w-md rounded-2xl shadow-xl p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-base font-semibold text-content-primary mb-2 inline-flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-600" aria-hidden />
                日常点検 登録解除
              </h3>
              <p className="text-sm text-content-sub mb-2 text-pretty">
                <span className="font-medium text-content-primary">{unregTarget.assetName}</span>
                （{unregTarget.assetId}）の日常点検登録を解除します。
              </p>
              <div className="bg-amber-50 border border-amber-200 rounded-md p-3 mb-4">
                <p className="text-xs text-amber-800 text-pretty">
                  解除後は日常点検サイクルから外れ、定期点検のみとなります。
                  解除理由を記録してください。
                </p>
              </div>
              <label className="block text-xs font-medium text-content-primary mb-1">
                解除理由
              </label>
              <textarea
                rows={3}
                placeholder="例: 機器移設のため日常点検対象外、ME室管理から外す等"
                className="w-full px-3 py-2 text-sm border border-stroke-input rounded-lg outline-none focus:border-content-link bg-white resize-none"
              />
              <div className="flex items-center justify-end gap-2 mt-4">
                <button
                  type="button"
                  onClick={() => setUnregTarget(null)}
                  className="h-10 px-4 text-sm text-content-primary border border-stroke-input rounded-lg bg-white hover:bg-surface-screen transition-colors cursor-pointer"
                >
                  キャンセル
                </button>
                <button
                  type="button"
                  onClick={() => setUnregTarget(null)}
                  className="h-10 px-5 text-sm font-medium text-white bg-rose-600 rounded-lg hover:opacity-90 transition-opacity cursor-pointer"
                >
                  日常点検を解除
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
