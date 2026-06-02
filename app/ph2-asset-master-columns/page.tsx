'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AppHeader } from '@/components/layouts/AppHeader';
import {
  ListChecks,
  Plus,
  Trash2,
  Shield,
  Building2,
  FileText,
  GripVertical,
} from 'lucide-react';

type ColumnDataType = 'text' | 'number' | 'date' | 'boolean' | 'url';

interface AssetMasterColumn {
  id: string;
  /** 表示名 */
  label: string;
  /** 内部キー（DB列名） */
  fieldName: string;
  /** データ型 */
  dataType: ColumnDataType;
  /** DataLink 連携で参照される列か */
  dataLinkProtected: boolean;
  /** SHIP のみ編集可（false なら全員編集可） */
  shipEditOnly: boolean;
  /** Ph1 既存カラムか（true なら削除不可） */
  builtin: boolean;
  /** カラム説明 */
  description?: string;
}

const INITIAL_COLUMNS: AssetMasterColumn[] = [
  // Ph1 既存（builtin）
  { id: 'c1', label: 'カテゴリ', fieldName: 'category', dataType: 'text', dataLinkProtected: true, shipEditOnly: true, builtin: true },
  { id: 'c2', label: '大分類', fieldName: 'large_class', dataType: 'text', dataLinkProtected: true, shipEditOnly: true, builtin: true },
  { id: 'c3', label: '中分類', fieldName: 'medium_class', dataType: 'text', dataLinkProtected: true, shipEditOnly: true, builtin: true },
  { id: 'c4', label: '品目', fieldName: 'item', dataType: 'text', dataLinkProtected: true, shipEditOnly: true, builtin: true },
  { id: 'c5', label: 'メーカー', fieldName: 'maker', dataType: 'text', dataLinkProtected: true, shipEditOnly: true, builtin: true },
  { id: 'c6', label: '型式', fieldName: 'model', dataType: 'text', dataLinkProtected: true, shipEditOnly: true, builtin: true },
  { id: 'c7', label: '製造番号', fieldName: 'serial', dataType: 'text', dataLinkProtected: false, shipEditOnly: false, builtin: true },
  // Ph2 追加例
  {
    id: 'c8',
    label: '添付文書URL',
    fieldName: 'attached_doc_url',
    dataType: 'url',
    dataLinkProtected: false,
    shipEditOnly: false,
    builtin: false,
    description: 'PMDA 添付文書 URL（テンプレート）',
  },
  {
    id: 'c9',
    label: '校正記録対象',
    fieldName: 'calibration_required',
    dataType: 'boolean',
    dataLinkProtected: false,
    shipEditOnly: true,
    builtin: false,
    description: '校正記録の対象機器か',
  },
  {
    id: 'c10',
    label: '生命維持装置フラグ',
    fieldName: 'life_critical',
    dataType: 'boolean',
    dataLinkProtected: false,
    shipEditOnly: true,
    builtin: false,
    description: '生命維持管理装置の特別管理対象',
  },
];

interface ColumnTemplate {
  key: string;
  label: string;
  description: string;
  preset: Partial<AssetMasterColumn>;
}

const TEMPLATES: ColumnTemplate[] = [
  {
    key: 'pmda-url',
    label: '添付文書URL',
    description: 'PMDA 添付文書 URL（医療安全情報の参照用）',
    preset: {
      label: '添付文書URL',
      fieldName: 'attached_doc_url',
      dataType: 'url',
      dataLinkProtected: false,
      shipEditOnly: false,
    },
  },
  {
    key: 'calibration',
    label: '校正記録対象',
    description: '校正対象機器のチェックボックス',
    preset: {
      label: '校正記録対象',
      fieldName: 'calibration_required',
      dataType: 'boolean',
      dataLinkProtected: false,
      shipEditOnly: true,
    },
  },
  {
    key: 'life-critical',
    label: '生命維持装置フラグ',
    description: '生命維持管理装置の特別管理対象',
    preset: {
      label: '生命維持装置フラグ',
      fieldName: 'life_critical',
      dataType: 'boolean',
      dataLinkProtected: false,
      shipEditOnly: true,
    },
  },
  {
    key: 'safety-alert',
    label: '医療安全情報リンク',
    description: '医療安全情報共有用のリンク',
    preset: {
      label: '医療安全情報リンク',
      fieldName: 'safety_alert_url',
      dataType: 'url',
      dataLinkProtected: false,
      shipEditOnly: false,
    },
  },
];

const DATA_TYPE_LABEL: Record<ColumnDataType, string> = {
  text: 'テキスト',
  number: '数値',
  date: '日付',
  boolean: 'ON/OFF',
  url: 'URL',
};

export default function AssetMasterColumnsPage() {
  const router = useRouter();
  const [columns, setColumns] = useState<AssetMasterColumn[]>(INITIAL_COLUMNS);
  const [showAddForm, setShowAddForm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<AssetMasterColumn | null>(null);

  // 新規追加フォーム
  const [form, setForm] = useState<AssetMasterColumn>({
    id: '',
    label: '',
    fieldName: '',
    dataType: 'text',
    dataLinkProtected: false,
    shipEditOnly: false,
    builtin: false,
    description: '',
  });

  const handleApplyTemplate = (t: ColumnTemplate) => {
    setForm({
      ...form,
      ...t.preset,
      id: '',
      builtin: false,
    } as AssetMasterColumn);
  };

  const handleAdd = () => {
    if (!form.label.trim() || !form.fieldName.trim()) return;
    setColumns([
      ...columns,
      {
        ...form,
        id: `c${Date.now()}`,
        builtin: false,
      },
    ]);
    setForm({
      id: '',
      label: '',
      fieldName: '',
      dataType: 'text',
      dataLinkProtected: false,
      shipEditOnly: false,
      builtin: false,
      description: '',
    });
    setShowAddForm(false);
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    setColumns(columns.filter((c) => c.id !== deleteTarget.id));
    setDeleteTarget(null);
  };

  return (
    <div className="min-h-dvh bg-surface-screen flex flex-col">
      <AppHeader />
      <main className="flex-1 px-4 lg:px-8 py-6 max-w-[1400px] w-full mx-auto">
        <div className="mb-5 flex items-center justify-between gap-3 flex-wrap">
          <div>
            <div className="flex items-center gap-2 text-xs text-content-sub mb-1">
              <button
                type="button"
                onClick={() => router.push('/ph2')}
                className="hover:text-content-link bg-transparent border-0 cursor-pointer p-0"
              >
                Ph2 提案機能
              </button>
              <span>/</span>
              <span>資産マスタ カラム設定</span>
            </div>
            <h1 className="text-[24px] font-bold text-content-primary text-balance inline-flex items-center gap-2">
              <ListChecks className="w-6 h-6 text-emerald-600" aria-hidden />
              資産マスタ カラム設定 (S13)
            </h1>
            <p className="mt-1 text-sm text-content-sub text-pretty max-w-2xl">
              施設ごとに資産マスタへカラムを追加・削除できます。DataLink 連携項目の保護 / SHIPのみ編集可フラグで運用安全性を確保。
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowAddForm(!showAddForm)}
            className="h-10 px-4 text-sm font-medium text-white bg-cta-primary rounded-lg hover:opacity-90 transition-opacity cursor-pointer inline-flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" aria-hidden />
            カラムを追加
          </button>
        </div>

        {/* 追加フォーム */}
        {showAddForm && (
          <section className="bg-white border-2 border-cta-primary rounded-lg p-5 mb-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-semibold text-content-primary">
                新規カラム追加
              </h2>
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="text-sm text-content-sub hover:text-content-primary bg-transparent border-0 cursor-pointer p-1"
                aria-label="閉じる"
              >
                ✕
              </button>
            </div>

            {/* テンプレート */}
            <div className="mb-4">
              <span className="block text-xs font-medium text-content-primary mb-1.5 inline-flex items-center gap-1">
                <FileText className="w-3.5 h-3.5" aria-hidden />
                テンプレートから選択
              </span>
              <div className="grid gap-2 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
                {TEMPLATES.map((t) => (
                  <button
                    key={t.key}
                    type="button"
                    onClick={() => handleApplyTemplate(t)}
                    className="text-left px-3 py-2 border border-stroke-card rounded-md hover:border-cta-primary hover:bg-surface-screen transition-colors cursor-pointer bg-white"
                  >
                    <div className="text-xs font-semibold text-content-primary">{t.label}</div>
                    <div className="text-[10px] text-content-sub mt-0.5 text-pretty">
                      {t.description}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* フォーム */}
            <div className="grid gap-3 grid-cols-1 md:grid-cols-2 mb-3">
              <div>
                <label className="block text-xs font-medium text-content-primary mb-1">
                  <span className="text-content-alert">*</span>表示名
                </label>
                <input
                  type="text"
                  value={form.label}
                  onChange={(e) => setForm({ ...form, label: e.target.value })}
                  placeholder="例: 添付文書URL"
                  className="w-full max-w-[280px] h-10 px-3 text-sm border border-stroke-input rounded-lg outline-none focus:border-content-link bg-white"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-content-primary mb-1">
                  <span className="text-content-alert">*</span>内部キー (DB列名)
                </label>
                <input
                  type="text"
                  value={form.fieldName}
                  onChange={(e) => setForm({ ...form, fieldName: e.target.value })}
                  placeholder="例: attached_doc_url"
                  className="w-full max-w-[280px] h-10 px-3 text-sm border border-stroke-input rounded-lg outline-none focus:border-content-link bg-white font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-content-primary mb-1">
                  データ型
                </label>
                <select
                  value={form.dataType}
                  onChange={(e) => setForm({ ...form, dataType: e.target.value as ColumnDataType })}
                  className="w-full max-w-[200px] h-10 px-3 text-sm border border-stroke-input rounded-lg bg-white"
                >
                  {Object.entries(DATA_TYPE_LABEL).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-content-primary mb-1">
                  説明
                </label>
                <input
                  type="text"
                  value={form.description ?? ''}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="任意"
                  className="w-full h-10 px-3 text-sm border border-stroke-input rounded-lg outline-none focus:border-content-link bg-white"
                />
              </div>
            </div>

            {/* フラグ */}
            <div className="grid gap-2 grid-cols-1 md:grid-cols-2 mb-4">
              <label className="flex items-start gap-2 cursor-pointer p-2 border border-stroke-card rounded-md hover:bg-surface-screen">
                <input
                  type="checkbox"
                  checked={form.dataLinkProtected}
                  onChange={(e) => setForm({ ...form, dataLinkProtected: e.target.checked })}
                  className="mt-0.5 accent-cta-primary"
                />
                <div className="text-xs">
                  <div className="font-semibold text-content-primary inline-flex items-center gap-1">
                    <Shield className="w-3 h-3" aria-hidden />
                    DataLink 連携項目（書き換え禁止）
                  </div>
                  <p className="text-content-sub mt-0.5 text-pretty">
                    DataLink で参照されるため、変更による連携破壊を防止
                  </p>
                </div>
              </label>
              <label className="flex items-start gap-2 cursor-pointer p-2 border border-stroke-card rounded-md hover:bg-surface-screen">
                <input
                  type="checkbox"
                  checked={form.shipEditOnly}
                  onChange={(e) => setForm({ ...form, shipEditOnly: e.target.checked })}
                  className="mt-0.5 accent-cta-primary"
                />
                <div className="text-xs">
                  <div className="font-semibold text-content-primary inline-flex items-center gap-1">
                    <Building2 className="w-3 h-3" aria-hidden />
                    SHIP のみ編集可
                  </div>
                  <p className="text-content-sub mt-0.5 text-pretty">
                    病院側は閲覧のみ。情報鮮度・正確性を SHIP 側で担保
                  </p>
                </div>
              </label>
            </div>

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="h-10 px-4 text-sm text-content-primary border border-stroke-input rounded-lg bg-white hover:bg-surface-screen transition-colors cursor-pointer"
              >
                キャンセル
              </button>
              <button
                type="button"
                onClick={handleAdd}
                disabled={!form.label.trim() || !form.fieldName.trim()}
                className="h-10 px-5 text-sm font-medium text-white bg-cta-primary rounded-lg hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-50 disabled:cursor-default"
              >
                カラムを追加
              </button>
            </div>
          </section>
        )}

        {/* カラム一覧 */}
        <section className="bg-white border border-stroke-card rounded-lg overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-surface-screen text-xs font-semibold text-content-sub border-b border-stroke-card">
                <th className="px-2 py-2 w-8"></th>
                <th className="px-3 py-2 text-left">表示名</th>
                <th className="px-3 py-2 text-left">内部キー</th>
                <th className="px-3 py-2 text-left w-[100px]">型</th>
                <th className="px-3 py-2 text-left w-[140px]">DataLink</th>
                <th className="px-3 py-2 text-left w-[140px]">編集権限</th>
                <th className="px-3 py-2 text-left w-[90px]">区分</th>
                <th className="px-3 py-2 text-left w-[80px]">操作</th>
              </tr>
            </thead>
            <tbody>
              {columns.map((c) => (
                <tr key={c.id} className="border-b border-stroke-card hover:bg-surface-screen">
                  <td className="px-2 py-2.5 text-content-sub cursor-grab">
                    <GripVertical className="w-4 h-4" aria-hidden />
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="font-medium text-content-primary">{c.label}</div>
                    {c.description && (
                      <div className="text-xs text-content-sub mt-0.5">{c.description}</div>
                    )}
                  </td>
                  <td className="px-3 py-2.5">
                    <code className="text-xs font-mono text-content-primary bg-surface-screen px-1.5 py-0.5 rounded">
                      {c.fieldName}
                    </code>
                  </td>
                  <td className="px-3 py-2.5">
                    <span className="inline-flex items-center px-2 py-0.5 text-xs rounded border border-stroke-card bg-white text-content-sub">
                      {DATA_TYPE_LABEL[c.dataType]}
                    </span>
                  </td>
                  <td className="px-3 py-2.5">
                    {c.dataLinkProtected ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded border bg-rose-50 text-rose-700 border-rose-200">
                        <Shield className="w-3 h-3" aria-hidden />
                        保護
                      </span>
                    ) : (
                      <span className="text-xs text-content-sub">—</span>
                    )}
                  </td>
                  <td className="px-3 py-2.5">
                    {c.shipEditOnly ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded border bg-emerald-50 text-emerald-700 border-emerald-200">
                        <Building2 className="w-3 h-3" aria-hidden />
                        SHIPのみ
                      </span>
                    ) : (
                      <span className="text-xs text-content-sub">全員編集可</span>
                    )}
                  </td>
                  <td className="px-3 py-2.5">
                    {c.builtin ? (
                      <span className="inline-flex items-center px-2 py-0.5 text-xs rounded bg-stone-100 text-stone-700">
                        Ph1既存
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 text-xs rounded bg-sky-50 text-sky-700">
                        Ph2追加
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2.5">
                    {!c.builtin && (
                      <button
                        type="button"
                        onClick={() => setDeleteTarget(c)}
                        className="inline-flex items-center gap-1 text-xs text-rose-600 hover:underline bg-transparent border-0 cursor-pointer p-0"
                        aria-label={`${c.label}を削除`}
                      >
                        <Trash2 className="w-3.5 h-3.5" aria-hidden />
                        削除
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        {/* 確認ダイアログ */}
        {deleteTarget && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
            role="dialog"
            aria-modal="true"
            onClick={() => setDeleteTarget(null)}
          >
            <div
              className="bg-white w-full max-w-md rounded-2xl shadow-xl p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-base font-semibold text-content-primary mb-2">
                カラム「{deleteTarget.label}」を削除
              </h3>
              <p className="text-sm text-content-sub mb-4 text-pretty">
                このカラムを削除すると、保存されている値も失われます。Ph1 既存カラムは削除できません。
              </p>
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setDeleteTarget(null)}
                  className="h-10 px-4 text-sm text-content-primary border border-stroke-input rounded-lg bg-white hover:bg-surface-screen transition-colors cursor-pointer"
                >
                  キャンセル
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  className="h-10 px-5 text-sm font-medium text-white bg-rose-600 rounded-lg hover:opacity-90 transition-opacity cursor-pointer"
                >
                  カラムを削除
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
