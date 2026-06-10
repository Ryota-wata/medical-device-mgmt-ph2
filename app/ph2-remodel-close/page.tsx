'use client';

import React, { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AppHeader } from '@/components/layouts/AppHeader';
import {
  Building2,
  CheckCircle2,
  AlertTriangle,
  Lock,
  ChevronRight,
  CircleDashed,
  PauseCircle,
  XCircle,
  ArrowRight,
  Info,
} from 'lucide-react';

// ──────────────────────────────────────────────
// 型定義
// ──────────────────────────────────────────────
type RemodelDecision = 'new' | 'replace' | 'addition' | 'disposal' | 'transfer' | 'undecided';

type WorkflowType = 'rfq' | 'disposal' | 'transfer';

type RfqGroupStatus =
  // 購入系
  | 'rfq_pending' // 見積依頼〜進行中
  | '見積DB登録済' // 概算止め
  | '発注見積依頼済'
  | '発注済'
  | '納期確定'
  | '検収済'
  | '完了'
  // 廃棄
  | '廃棄承認待ち'
  | '廃棄承認済み'
  | '廃棄完了'
  // 移設
  | '移動承認待ち'
  | '移動承認済み'
  | '移動完了';

interface EditListRow {
  id: string;
  source: 'baseAsset' | 'item';
  assetName: string;
  model: string;
  quantity: number;
  facility: string;
  oldLocation: string;
  newLocation?: string;
  decision: RemodelDecision;
  // 紐付いている最新の RfqGroup
  rfqGroupId?: string;
  rfqGroupStatus?: RfqGroupStatus;
  workflowType?: WorkflowType;
}

interface RemodelProject {
  id: string;
  title: string;
  facility: string;
  startedAt: string;
  oldDeptCount: number;
  newDeptCount: number;
  newDeptMasterReady: boolean;
  status: '計画中' | '実施中' | 'クローズ準備可' | 'クローズ済';
  editListRows: EditListRow[];
}

// ──────────────────────────────────────────────
// 状態判定
// ──────────────────────────────────────────────
type RowState = 'completed' | 'estimate_only' | 'in_progress' | 'not_started' | 'undecided';

const ROW_STATE_LABEL: Record<RowState, string> = {
  completed: '●完了',
  estimate_only: '▲概算止め',
  in_progress: '▲進行中',
  not_started: '×未着手',
  undecided: '×方針未決',
};

const ROW_STATE_STYLE: Record<RowState, { bg: string; border: string; text: string; icon: React.ReactNode }> = {
  completed: {
    bg: 'bg-emerald-50',
    border: 'border-emerald-300',
    text: 'text-emerald-700',
    icon: <CheckCircle2 className="w-4 h-4" aria-hidden />,
  },
  estimate_only: {
    bg: 'bg-orange-50',
    border: 'border-orange-300',
    text: 'text-orange-700',
    icon: <PauseCircle className="w-4 h-4" aria-hidden />,
  },
  in_progress: {
    bg: 'bg-amber-50',
    border: 'border-amber-300',
    text: 'text-amber-700',
    icon: <CircleDashed className="w-4 h-4" aria-hidden />,
  },
  not_started: {
    bg: 'bg-rose-50',
    border: 'border-rose-300',
    text: 'text-rose-700',
    icon: <XCircle className="w-4 h-4" aria-hidden />,
  },
  undecided: {
    bg: 'bg-rose-50',
    border: 'border-rose-400',
    text: 'text-rose-700',
    icon: <AlertTriangle className="w-4 h-4" aria-hidden />,
  },
};

function judgeRowState(row: EditListRow): RowState {
  if (row.decision === 'undecided') return 'undecided';
  if (!row.rfqGroupStatus || !row.workflowType) return 'not_started';

  if (row.workflowType === 'rfq') {
    if (row.rfqGroupStatus === '完了' || row.rfqGroupStatus === '検収済') return 'completed';
    if (row.rfqGroupStatus === '見積DB登録済') return 'estimate_only';
    return 'in_progress';
  }
  if (row.workflowType === 'disposal') {
    if (row.rfqGroupStatus === '廃棄完了') return 'completed';
    return 'in_progress';
  }
  if (row.workflowType === 'transfer') {
    if (row.rfqGroupStatus === '移動完了') return 'completed';
    return 'in_progress';
  }
  return 'not_started';
}

// 区分のラベルとカラー
const DECISION_LABEL: Record<RemodelDecision, string> = {
  new: '新規購入',
  replace: '更新購入',
  addition: '増設購入',
  disposal: '廃棄',
  transfer: '移動',
  undecided: '方針未決',
};

const DECISION_STYLE: Record<RemodelDecision, string> = {
  new: 'bg-sky-50 text-sky-700 border-sky-200',
  replace: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  addition: 'bg-amber-50 text-amber-700 border-amber-200',
  disposal: 'bg-violet-50 text-violet-700 border-violet-200',
  transfer: 'bg-stone-100 text-stone-700 border-stone-200',
  undecided: 'bg-rose-50 text-rose-700 border-rose-200',
};

// ──────────────────────────────────────────────
// モックデータ
// ──────────────────────────────────────────────
const MOCK_PROJECTS: RemodelProject[] = [
  {
    id: 'RM-2026-0001',
    title: '東棟3F リモデル（ICU・CCU 集約）',
    facility: '東京中央病院',
    startedAt: '2026-02-15',
    oldDeptCount: 4,
    newDeptCount: 2,
    newDeptMasterReady: true,
    status: 'クローズ準備可',
    editListRows: [
      // 新規購入 12 件 (10 完了 / 2 概算止め)
      ...Array.from({ length: 10 }, (_, i) => ({
        id: `R1-new-${i}`,
        source: 'item' as const,
        assetName: ['生体情報モニタ', '輸液ポンプ', 'シリンジポンプ'][i % 3],
        model: ['BSM-3500', 'TE-SS720', 'TE-SS831'][i % 3],
        quantity: 1,
        facility: '東京中央病院',
        oldLocation: '—',
        newLocation: '新 ICU',
        decision: 'new' as RemodelDecision,
        rfqGroupId: `G-new-${i}`,
        rfqGroupStatus: '完了' as RfqGroupStatus,
        workflowType: 'rfq' as WorkflowType,
      })),
      // 概算止め 2 件
      {
        id: 'R1-new-est-1',
        source: 'item',
        assetName: '超音波診断装置',
        model: 'LISENDO 880',
        quantity: 1,
        facility: '東京中央病院',
        oldLocation: '—',
        newLocation: '新 ICU',
        decision: 'new',
        rfqGroupId: 'G-est-1',
        rfqGroupStatus: '見積DB登録済',
        workflowType: 'rfq',
      },
      {
        id: 'R1-new-est-2',
        source: 'item',
        assetName: '人工呼吸器',
        model: 'SV-300',
        quantity: 2,
        facility: '東京中央病院',
        oldLocation: '—',
        newLocation: '新 CCU',
        decision: 'new',
        rfqGroupId: 'G-est-2',
        rfqGroupStatus: '見積DB登録済',
        workflowType: 'rfq',
      },
      // 更新購入 8 件 全完了
      ...Array.from({ length: 8 }, (_, i) => ({
        id: `R1-rep-${i}`,
        source: 'baseAsset' as const,
        assetName: '生体情報モニタ',
        model: 'BSM-2401',
        quantity: 1,
        facility: '東京中央病院',
        oldLocation: 'ICU',
        newLocation: '新 ICU',
        decision: 'replace' as RemodelDecision,
        rfqGroupId: `G-rep-${i}`,
        rfqGroupStatus: '完了' as RfqGroupStatus,
        workflowType: 'rfq' as WorkflowType,
      })),
      // 増設購入 4 件 全完了
      ...Array.from({ length: 4 }, (_, i) => ({
        id: `R1-add-${i}`,
        source: 'item' as const,
        assetName: 'パルスオキシメータ',
        model: 'NellcorPM10N',
        quantity: 1,
        facility: '東京中央病院',
        oldLocation: '—',
        newLocation: '新 CCU',
        decision: 'addition' as RemodelDecision,
        rfqGroupId: `G-add-${i}`,
        rfqGroupStatus: '完了' as RfqGroupStatus,
        workflowType: 'rfq' as WorkflowType,
      })),
      // 廃棄 18 件 (17 完了 / 1 未完了)
      ...Array.from({ length: 17 }, (_, i) => ({
        id: `R1-dsp-${i}`,
        source: 'baseAsset' as const,
        assetName: '生体情報モニタ',
        model: 'BSM-2401（旧）',
        quantity: 1,
        facility: '東京中央病院',
        oldLocation: 'ICU',
        decision: 'disposal' as RemodelDecision,
        rfqGroupId: `G-dsp-${i}`,
        rfqGroupStatus: '廃棄完了' as RfqGroupStatus,
        workflowType: 'disposal' as WorkflowType,
      })),
      {
        id: 'R1-dsp-pending',
        source: 'baseAsset',
        assetName: '電気メス',
        model: 'ESG-400',
        quantity: 1,
        facility: '東京中央病院',
        oldLocation: 'ICU',
        decision: 'disposal',
        rfqGroupId: 'G-dsp-pending',
        rfqGroupStatus: '廃棄承認待ち',
        workflowType: 'disposal',
      },
      // 移動 32 件 全完了
      ...Array.from({ length: 32 }, (_, i) => ({
        id: `R1-tr-${i}`,
        source: 'baseAsset' as const,
        assetName: '輸液ポンプ',
        model: 'TE-SS720',
        quantity: 1,
        facility: '東京中央病院',
        oldLocation: 'ICU',
        newLocation: '新 ICU',
        decision: 'transfer' as RemodelDecision,
        rfqGroupId: `G-tr-${i}`,
        rfqGroupStatus: '移動完了' as RfqGroupStatus,
        workflowType: 'transfer' as WorkflowType,
      })),
      // 方針未決 3 件
      ...Array.from({ length: 3 }, (_, i) => ({
        id: `R1-ud-${i}`,
        source: 'baseAsset' as const,
        assetName: ['古い心電計', '使用頻度低い人工呼吸器', '機種不明モニタ'][i],
        model: ['ECG-100', 'SV-200', '?'][i],
        quantity: 1,
        facility: '東京中央病院',
        oldLocation: 'ICU',
        decision: 'undecided' as RemodelDecision,
      })),
    ],
  },
  {
    id: 'RM-2026-0002',
    title: '西棟 ICU 拡張リモデル',
    facility: '東京中央病院',
    startedAt: '2026-04-01',
    oldDeptCount: 2,
    newDeptCount: 3,
    newDeptMasterReady: true,
    status: '実施中',
    editListRows: [
      ...Array.from({ length: 30 }, (_, i) => ({
        id: `R2-${i}`,
        source: 'baseAsset' as const,
        assetName: '生体情報モニタ',
        model: 'BSM-3500',
        quantity: 1,
        facility: '東京中央病院',
        oldLocation: 'ICU',
        decision: (['new', 'replace', 'transfer', 'disposal'] as RemodelDecision[])[i % 4],
        rfqGroupId: `G2-${i}`,
        rfqGroupStatus: (['完了', '発注済', '見積DB登録済', '廃棄承認待ち', '移動承認待ち'] as RfqGroupStatus[])[i % 5],
        workflowType: (['rfq', 'rfq', 'rfq', 'disposal', 'transfer'] as WorkflowType[])[i % 5],
      })),
    ],
  },
];

// ──────────────────────────────────────────────
// メインコンポーネント
// ──────────────────────────────────────────────
export default function RemodelClosePage() {
  const router = useRouter();
  const [projects, setProjects] = useState(MOCK_PROJECTS);
  const [selectedId, setSelectedId] = useState<string>(MOCK_PROJECTS[0].id);
  const [shipConfirmed, setShipConfirmed] = useState(false);
  const [shipMemo, setShipMemo] = useState('');
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [completedProjectId, setCompletedProjectId] = useState<string | null>(null);

  const project = projects.find((p) => p.id === selectedId) ?? projects[0];

  // 状態集計
  const stats = useMemo(() => {
    const byDecision: Record<RemodelDecision, { total: number; states: Record<RowState, number> }> = {
      new: emptyStat(),
      replace: emptyStat(),
      addition: emptyStat(),
      disposal: emptyStat(),
      transfer: emptyStat(),
      undecided: emptyStat(),
    };
    project.editListRows.forEach((row) => {
      const decision = row.decision;
      const state = judgeRowState(row);
      byDecision[decision].total++;
      byDecision[decision].states[state]++;
    });

    const totalRows = project.editListRows.length;
    const completedCount = project.editListRows.filter((r) => judgeRowState(r) === 'completed').length;
    const estimateOnlyCount = project.editListRows.filter((r) => judgeRowState(r) === 'estimate_only').length;
    const inProgressCount = project.editListRows.filter((r) => judgeRowState(r) === 'in_progress').length;
    const notStartedCount = project.editListRows.filter((r) => judgeRowState(r) === 'not_started').length;
    const undecidedCount = project.editListRows.filter((r) => r.decision === 'undecided').length;

    return {
      byDecision,
      totalRows,
      completedCount,
      estimateOnlyCount,
      inProgressCount,
      notStartedCount,
      undecidedCount,
    };
  }, [project]);

  // クローズ前提
  const prerequisites = useMemo(() => {
    const undecidedOk = stats.undecidedCount === 0;
    const allCompleted =
      stats.estimateOnlyCount === 0 &&
      stats.inProgressCount === 0 &&
      stats.notStartedCount === 0 &&
      stats.undecidedCount === 0;
    const newDeptReady = project.newDeptMasterReady;
    const allOk = undecidedOk && allCompleted && newDeptReady && shipConfirmed;
    return { undecidedOk, allCompleted, newDeptReady, shipConfirmedOk: shipConfirmed, allOk };
  }, [stats, project.newDeptMasterReady, shipConfirmed]);

  const handleConfirmClose = () => {
    setProjects((prev) =>
      prev.map((p) =>
        p.id === project.id
          ? { ...p, status: 'クローズ済' as RemodelProject['status'] }
          : p,
      ),
    );
    setCompletedProjectId(project.id);
    setConfirmModalOpen(false);
    setShipConfirmed(false);
    setShipMemo('');
  };

  return (
    <div className="min-h-dvh bg-surface-screen flex flex-col">
      <AppHeader />
      <main className="flex-1 px-4 lg:px-8 py-6 max-w-[1400px] w-full mx-auto">
        <div className="mb-5">
          <div className="flex items-center gap-2 text-xs text-content-sub mb-1">
            <button onClick={() => router.push('/main')} className="hover:text-content-link bg-transparent border-0 cursor-pointer p-0">メイン</button>
            <span>/</span>
            <span>リモデル管理 + クローズ確認</span>
          </div>
          <h1 className="text-[24px] font-bold text-content-primary text-balance inline-flex items-center gap-2">
            <Building2 className="w-6 h-6 text-emerald-600" aria-hidden />
            リモデル管理 + クローズ確認 (S14)
          </h1>
          <p className="mt-1 text-sm text-content-sub text-pretty max-w-3xl">
            編集リスト × タスク管理 を動的に集計し、リモデルクローズの可否を判定します。
            厳格運用（全機器が発注フェーズで完了 = 原本登録済）が条件です。
          </p>
        </div>

        {/* 完了トースト */}
        {completedProjectId && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-lg mb-4 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5" aria-hidden />
            <span className="text-sm text-pretty">
              リモデル <span className="font-mono font-semibold">{completedProjectId}</span> をクローズしました。
              新部署マスタが既存マスタに昇格し、Ph1 通常運用に切り替わりました。
            </span>
          </div>
        )}

        {/* プロジェクトタブ */}
        <div className="bg-white border border-stroke-card rounded-lg p-1 mb-4 inline-flex gap-1 flex-wrap">
          {projects.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setSelectedId(p.id)}
              className={`px-3 py-2 text-sm rounded-md cursor-pointer border-0 ${
                selectedId === p.id ? 'bg-cta-primary text-white' : 'bg-transparent text-content-primary hover:bg-surface-screen'
              }`}
            >
              <span className="font-mono text-xs tabular-nums mr-1">{p.id}</span>
              {p.title}
              {p.status === 'クローズ済' && <span className="ml-2 inline-flex items-center px-1.5 py-0 text-[10px] rounded bg-sky-100 text-sky-700">クローズ済</span>}
            </button>
          ))}
        </div>

        {/* プロジェクトメタ */}
        <section className="bg-white border border-stroke-card rounded-lg p-4 mb-4">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div>
              <h2 className="text-base font-semibold text-content-primary text-balance">{project.title}</h2>
              <p className="text-xs text-content-sub mt-0.5">
                {project.facility} ／ 開始 {project.startedAt} ／ 旧部署 {project.oldDeptCount}個 → 新部署 {project.newDeptCount}個
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded border ${
                project.status === 'クローズ済' ? 'bg-sky-50 text-sky-700 border-sky-200' :
                project.status === 'クローズ準備可' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                project.status === '実施中' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                'bg-stone-100 text-stone-700 border-stone-200'
              }`}>
                {project.status}
              </span>
            </div>
          </div>
        </section>

        {/* 編集リスト 状態マトリクス */}
        <section className="bg-white border border-stroke-card rounded-lg p-5 mb-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold text-content-primary">
              編集リスト 状態（{stats.totalRows} 行）
            </h2>
            <p className="text-xs text-content-sub inline-flex items-center gap-1">
              <Info className="w-3.5 h-3.5" aria-hidden />
              編集リスト × タスク管理 を動的計算
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-surface-screen text-xs font-semibold text-content-sub border-b border-stroke-card">
                  <th className="px-3 py-2 text-left">方針</th>
                  <th className="px-3 py-2 text-right">計画</th>
                  <th className="px-3 py-2 text-right">●完了</th>
                  <th className="px-3 py-2 text-right text-orange-700">▲概算止め</th>
                  <th className="px-3 py-2 text-right text-amber-700">▲進行中</th>
                  <th className="px-3 py-2 text-right text-rose-700">×未着手</th>
                  <th className="px-3 py-2 text-left">状態</th>
                </tr>
              </thead>
              <tbody>
                {(['new', 'replace', 'addition', 'disposal', 'transfer', 'undecided'] as RemodelDecision[]).map((dec) => {
                  const s = stats.byDecision[dec];
                  if (s.total === 0) return null;
                  const incomplete = s.states.estimate_only + s.states.in_progress + s.states.not_started + s.states.undecided;
                  const stateText =
                    dec === 'undecided'
                      ? `×方針確定が必要`
                      : incomplete === 0
                        ? `●完了`
                        : s.states.estimate_only > 0
                          ? `▲ ${s.states.estimate_only}件 概算止め`
                          : s.states.in_progress > 0
                            ? `▲ ${s.states.in_progress}件 進行中`
                            : `× ${s.states.not_started}件 未着手`;
                  return (
                    <tr key={dec} className="border-b border-stroke-card">
                      <td className="px-3 py-2.5">
                        <span className={`inline-flex items-center px-2 py-0.5 text-xs font-semibold rounded border ${DECISION_STYLE[dec]}`}>
                          {DECISION_LABEL[dec]}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-right tabular-nums font-semibold">{s.total}</td>
                      <td className="px-3 py-2.5 text-right tabular-nums">{dec === 'undecided' ? '—' : s.states.completed}</td>
                      <td className="px-3 py-2.5 text-right tabular-nums text-orange-700">{dec === 'undecided' ? '—' : (s.states.estimate_only || '0')}</td>
                      <td className="px-3 py-2.5 text-right tabular-nums text-amber-700">{dec === 'undecided' ? '—' : (s.states.in_progress || '0')}</td>
                      <td className="px-3 py-2.5 text-right tabular-nums text-rose-700">{dec === 'undecided' ? '—' : (s.states.not_started || '0')}</td>
                      <td className={`px-3 py-2.5 text-xs font-semibold ${incomplete === 0 && dec !== 'undecided' ? 'text-emerald-700' : 'text-rose-700'}`}>
                        {stateText}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        {/* クローズ前提条件 */}
        <section className="bg-white border border-stroke-card rounded-lg p-5 mb-4">
          <h2 className="text-base font-semibold text-content-primary mb-3">クローズ前提</h2>
          <ul className="space-y-2">
            <PrereqItem
              ok={prerequisites.undecidedOk}
              label="① 方針未決 = 0 件"
              detail={prerequisites.undecidedOk ? '達成' : `現在: ${stats.undecidedCount} 件`}
            />
            <PrereqItem
              ok={prerequisites.allCompleted}
              label="② 編集リスト全行が「●完了」状態"
              detail={
                prerequisites.allCompleted
                  ? '達成'
                  : `${stats.completedCount} / ${stats.totalRows} 件 （概算止め ${stats.estimateOnlyCount} ／ 進行中 ${stats.inProgressCount} ／ 未着手 ${stats.notStartedCount} ／ 方針未決 ${stats.undecidedCount}）`
              }
            />
            <PrereqItem
              ok={prerequisites.newDeptReady}
              label="③ 新部署マスタの設置場所が全件登録済"
              detail={prerequisites.newDeptReady ? '達成' : '新部署マスタの整備が未完了'}
            />
            <PrereqItem
              ok={prerequisites.shipConfirmedOk}
              label="④ SHIP の最終確認（現場ヒアリング結果に基づく）"
              detail={prerequisites.shipConfirmedOk ? 'チェック済' : '未チェック'}
            />
          </ul>
        </section>

        {/* 未完了の内訳と対応導線 */}
        {!prerequisites.allCompleted && (
          <section className="bg-white border border-stroke-card rounded-lg p-5 mb-4">
            <h2 className="text-base font-semibold text-content-primary mb-3">未完了の内訳と対応導線</h2>
            <ul className="space-y-2">
              {stats.estimateOnlyCount > 0 && (
                <ActionRow
                  state="estimate_only"
                  label={`概算止め ${stats.estimateOnlyCount} 件 — 発注未着手`}
                  hint="新規グループを作成して発注フェーズへ進めてください（厳格運用: 概算止めはクローズ不可）"
                  ctaLabel="発注グループを作成"
                  onClick={() => router.push('/quotation-data-box/remodel-management')}
                />
              )}
              {stats.inProgressCount > 0 && (
                <ActionRow
                  state="in_progress"
                  label={`進行中 ${stats.inProgressCount} 件 — タスク進行待ち`}
                  hint="該当タスクの完了をお待ちください（必要なら催促・状況確認を）"
                  ctaLabel="タスク管理へ"
                  onClick={() => router.push('/quotation-data-box/remodel-management')}
                />
              )}
              {stats.notStartedCount > 0 && (
                <ActionRow
                  state="not_started"
                  label={`未着手 ${stats.notStartedCount} 件 — 見積依頼グループ未生成`}
                  hint="編集リスト上で見積依頼グループを作成してください"
                  ctaLabel="タスク管理へ"
                  onClick={() => router.push('/quotation-data-box/remodel-management')}
                />
              )}
              {stats.undecidedCount > 0 && (
                <ActionRow
                  state="undecided"
                  label={`方針未決 ${stats.undecidedCount} 件 — 意思決定が必要`}
                  hint="各機器を 新規/更新/増設/廃棄/移動 のいずれかに振り分けてください"
                  ctaLabel="編集リスト編集へ"
                  onClick={() => router.push('/remodel-application')}
                />
              )}
            </ul>
          </section>
        )}

        {/* SHIP 最終確認 */}
        <section className="bg-white border border-stroke-card rounded-lg p-5 mb-4">
          <h2 className="text-base font-semibold text-content-primary mb-3">SHIP の最終確認</h2>
          <label className="flex items-start gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={shipConfirmed}
              onChange={(e) => setShipConfirmed(e.target.checked)}
              className="mt-0.5 accent-cta-primary"
              disabled={project.status === 'クローズ済'}
            />
            <div className="text-sm">
              <div className="font-medium text-content-primary text-pretty">
                現場ヒアリング結果に基づき、すべての資産について処理が完了したことを確認しました
              </div>
              <p className="text-xs text-content-sub mt-1 text-pretty">
                機械的な数のチェックだけでは判定できないケースを補完するため、SHIP の現場確認が最後の条件です。
              </p>
            </div>
          </label>
          <div className="mt-3">
            <label className="block text-xs font-medium text-content-primary mb-1">
              ヒアリング結果メモ（任意・監査用）
            </label>
            <textarea
              rows={3}
              value={shipMemo}
              onChange={(e) => setShipMemo(e.target.value)}
              placeholder="例: 6/8 加児氏立会いで全フロア最終確認実施。残機器3点は新規発注に切替済。新ICU全室の設置場所登録完了を確認。"
              disabled={project.status === 'クローズ済'}
              className="w-full px-3 py-2 text-sm border border-stroke-input rounded-lg outline-none focus:border-content-link bg-white resize-none disabled:bg-surface-screen disabled:text-content-sub"
            />
          </div>
        </section>

        {/* クローズ実行ボタン */}
        <section className="bg-white border-2 border-emerald-300 rounded-lg p-5 mb-4">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div>
              <div className="text-sm font-semibold text-content-primary mb-1">
                クローズ確定
              </div>
              <p className="text-xs text-content-sub text-pretty">
                4 条件すべてが達成されると活性化します。<span className="font-semibold text-rose-700">クローズは取り消しできません</span>。
              </p>
            </div>
            <button
              type="button"
              onClick={() => setConfirmModalOpen(true)}
              disabled={!prerequisites.allOk || project.status === 'クローズ済'}
              className="h-12 px-6 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:opacity-90 transition-opacity cursor-pointer inline-flex items-center gap-2 disabled:opacity-50 disabled:cursor-default"
            >
              {project.status === 'クローズ済' ? (
                <>
                  <Lock className="w-4 h-4" aria-hidden />
                  クローズ済
                </>
              ) : (
                <>
                  リモデルをクローズする
                  <ArrowRight className="w-4 h-4" aria-hidden />
                </>
              )}
            </button>
          </div>
        </section>
      </main>

      {/* クローズ確認モーダル */}
      {confirmModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
          role="dialog"
          aria-modal="true"
          onClick={() => setConfirmModalOpen(false)}
        >
          <div
            className="bg-white w-full max-w-lg rounded-2xl shadow-xl p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-base font-semibold text-content-primary mb-2 inline-flex items-center gap-2">
              <Lock className="w-5 h-5 text-emerald-600" aria-hidden />
              リモデルをクローズ確定
            </h3>
            <p className="text-sm text-content-sub mb-3 text-pretty">
              <span className="font-mono">{project.id}</span> ／ {project.title}
            </p>
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 mb-4">
              <p className="text-xs text-emerald-800 text-pretty font-semibold mb-2">
                クローズすると以下が確定します。<span className="text-rose-700">取り消しはできません。</span>
              </p>
              <ul className="space-y-1 text-xs text-emerald-800 list-disc pl-5">
                <li>新個別部署マスタが既存個別部署マスタに上書きされる</li>
                <li>新個別部署マスタは空に初期化される</li>
                <li>すべての機器の所属が新マスタ参照に自動切替される</li>
                <li>編集リスト（{stats.totalRows} 行）が削除される</li>
                <li>リモデルプロジェクトのステータスが「完了」になる</li>
              </ul>
            </div>
            {shipMemo && (
              <div className="mb-4">
                <div className="text-xs font-medium text-content-primary mb-1">ヒアリング結果メモ:</div>
                <p className="text-xs text-content-sub bg-surface-screen border border-stroke-card rounded p-2 text-pretty whitespace-pre-wrap">
                  {shipMemo}
                </p>
              </div>
            )}
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmModalOpen(false)}
                className="h-10 px-4 text-sm text-content-primary border border-stroke-input rounded-lg bg-white hover:bg-surface-screen transition-colors cursor-pointer"
              >
                キャンセル
              </button>
              <button
                type="button"
                onClick={handleConfirmClose}
                className="h-10 px-5 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:opacity-90 transition-opacity cursor-pointer"
              >
                クローズを確定
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ──────────────────────────────────────────────
// サブコンポーネント
// ──────────────────────────────────────────────

function emptyStat(): { total: number; states: Record<RowState, number> } {
  return {
    total: 0,
    states: { completed: 0, estimate_only: 0, in_progress: 0, not_started: 0, undecided: 0 },
  };
}

const PrereqItem: React.FC<{ ok: boolean; label: string; detail: string }> = ({ ok, label, detail }) => (
  <li className={`flex items-start gap-2 px-3 py-2 rounded border ${ok ? 'bg-emerald-50 border-emerald-200' : 'bg-rose-50 border-rose-200'}`}>
    {ok ? (
      <CheckCircle2 className="w-4 h-4 text-emerald-700 mt-0.5 shrink-0" aria-hidden />
    ) : (
      <XCircle className="w-4 h-4 text-rose-700 mt-0.5 shrink-0" aria-hidden />
    )}
    <div className="flex-1 min-w-0">
      <div className={`text-sm font-medium ${ok ? 'text-emerald-800' : 'text-rose-800'}`}>{label}</div>
      <div className={`text-xs mt-0.5 ${ok ? 'text-emerald-700' : 'text-rose-700'}`}>{detail}</div>
    </div>
  </li>
);

const ActionRow: React.FC<{
  state: RowState;
  label: string;
  hint: string;
  ctaLabel: string;
  onClick: () => void;
}> = ({ state, label, hint, ctaLabel, onClick }) => {
  const sty = ROW_STATE_STYLE[state];
  return (
    <li className={`flex items-start gap-3 px-3 py-3 rounded border ${sty.bg} ${sty.border}`}>
      <span className={sty.text}>{sty.icon}</span>
      <div className="flex-1 min-w-0">
        <div className={`text-sm font-semibold ${sty.text}`}>{label}</div>
        <p className="text-xs text-content-primary mt-0.5 text-pretty">{hint}</p>
      </div>
      <button
        type="button"
        onClick={onClick}
        className="h-8 px-3 text-xs font-medium text-content-primary border border-stroke-input rounded-md bg-white hover:bg-surface-screen transition-colors cursor-pointer inline-flex items-center gap-1"
      >
        {ctaLabel}
        <ChevronRight className="w-3 h-3" aria-hidden />
      </button>
    </li>
  );
};
