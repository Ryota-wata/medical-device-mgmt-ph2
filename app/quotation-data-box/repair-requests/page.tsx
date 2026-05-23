'use client';

import React, { useState, useMemo, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/layouts/Header';
import { SubTabNavigation } from '../components/SubTabNavigation';
import { RepairRequestsTab, RepairRequest, RepairStatus } from '../components/RepairRequestsTab';

// ========== 申請受付データ型 ==========
interface RepairApplication {
  id: string;
  applicationDate: string;
  applicationNo: string;
  department: string;
  section: string;
  roomName: string;
  qrCode: string;
  itemName: string;
  maker: string;
  model: string;
  applicantDepartment: string;
  applicantName: string;
  applicantContact: string;
  serialNo: string;
  symptoms: string;
  alternativeNeeded: boolean;
  freeComment: string;
}

// ========== モックデータ: 申請受付 ==========
const MOCK_PENDING_APPLICATIONS: RepairApplication[] = [
  {
    id: 'RA-2025-0001',
    applicationDate: '2025-02-18',
    applicationNo: 'RA-2025-0001',
    department: '手術部門',
    section: '手術部門',
    roomName: '手術室',
    qrCode: 'QR-A001',
    itemName: '電気メス',
    maker: 'コヴィディエン',
    model: 'ForceTriad',
    applicantDepartment: '手術部門',
    applicantName: '田中太郎',
    applicantContact: '03-1234-5678',
    serialNo: 'SN-2024-001',
    symptoms: '使用中に出力が不安定になる。異音あり。',
    alternativeNeeded: true,
    freeComment: 'コヴィディエンに依頼済',
  },
  {
    id: 'RA-2025-0002',
    applicationDate: '2025-02-17',
    applicationNo: 'RA-2025-0002',
    department: '検査部門',
    section: '生理検査室',
    roomName: '生理検査室',
    qrCode: 'QR-B002',
    itemName: '超音波診断装置',
    maker: '日立製作所',
    model: 'ARIETTA 850',
    applicantDepartment: '検査部門',
    applicantName: '佐藤花子',
    applicantContact: '03-2222-3333',
    serialNo: 'SN-2024-045',
    symptoms: 'プローブの映像が乱れる。画面にノイズが出る。',
    alternativeNeeded: false,
    freeComment: '',
  },
  {
    id: 'RA-2025-0003',
    applicationDate: '2025-02-16',
    applicationNo: 'RA-2025-0003',
    department: '外来部門',
    section: '内科外来',
    roomName: '内科外来',
    qrCode: 'QR-C003',
    itemName: '心電計',
    maker: '日本光電',
    model: 'ECG-2550',
    applicantDepartment: '外来部門',
    applicantName: '鈴木一郎',
    applicantContact: '03-3333-4444',
    serialNo: 'SN-2023-112',
    symptoms: '印刷が薄くなってきた。紙送りが不安定。',
    alternativeNeeded: false,
    freeComment: '',
  },
];

// ========== モックデータ: 修理タスク ==========
const INITIAL_REPAIR_TASKS: RepairRequest[] = [
  {
    id: 1, requestNo: 'REP-20260205-001', requestDate: '2026-02-05', repairCategory: '外部依頼',
    qrLabel: 'QR-001', itemName: '人工呼吸器', maker: 'フクダ電子',
    applicantDepartment: '集中治療室', applicantName: '田中花子', applicantContact: '03-1234-5678',
    vendorName: 'フクダ電子', vendorPerson: '山田太郎', vendorContact: '03-9876-5432',
    status: '作業日確定',
    quotationDeadline: '2026-02-07', orderDeadline: '2026-02-10', deliveryDeadline: '2026-02-15',
    deliveryDate: '2026-02-20', inspectionDate: null, rejectedDate: null,
    alternativeDevice: '代替人工呼吸器 FV-300', alternativeUnreturned: true,
  },
  {
    id: 2, requestNo: 'REP-20260204-001', requestDate: '2026-02-04', repairCategory: '外部依頼',
    qrLabel: 'QR-002', itemName: '輸液ポンプ', maker: 'テルモ',
    applicantDepartment: '外科病棟', applicantName: '佐藤一郎', applicantContact: '03-1111-2222',
    vendorName: '', vendorPerson: '', vendorContact: '',
    status: '見積依頼',
    quotationDeadline: null, orderDeadline: null, deliveryDeadline: null,
    deliveryDate: null, inspectionDate: null, rejectedDate: null,
    alternativeDevice: null, alternativeUnreturned: false,
  },
  {
    id: 3, requestNo: 'REP-20260203-001', requestDate: '2026-02-03', repairCategory: '外部依頼',
    qrLabel: 'QR-003', itemName: '心電図モニター', maker: '日本光電',
    applicantDepartment: '内科病棟', applicantName: '高橋三郎', applicantContact: '03-5555-6666',
    vendorName: '日本光電', vendorPerson: '中村五郎', vendorContact: '03-9999-0000',
    status: '見積依頼済',
    quotationDeadline: '2026-02-10', orderDeadline: null, deliveryDeadline: null,
    deliveryDate: null, inspectionDate: null, rejectedDate: null,
    alternativeDevice: null, alternativeUnreturned: false,
  },
  {
    id: 4, requestNo: 'REP-20260201-001', requestDate: '2026-02-01', repairCategory: '外部依頼',
    qrLabel: 'QR-004', itemName: '超音波診断装置', maker: '日立製作所',
    applicantDepartment: '検査部', applicantName: '伊藤四郎', applicantContact: '03-7777-8888',
    vendorName: '日立製作所', vendorPerson: '中村五郎', vendorContact: '03-9999-0000',
    status: '見積登録済',
    quotationDeadline: '2026-02-05', orderDeadline: '2026-02-08', deliveryDeadline: null,
    deliveryDate: null, inspectionDate: null, rejectedDate: null,
    alternativeDevice: null, alternativeUnreturned: false,
  },
  {
    id: 5, requestNo: 'REP-20260130-001', requestDate: '2026-01-30', repairCategory: '外部依頼',
    qrLabel: 'QR-005', itemName: '除細動器', maker: '日本光電',
    applicantDepartment: '救急部', applicantName: '渡辺六郎', applicantContact: '03-3333-4444',
    vendorName: '日本光電', vendorPerson: '鈴木七郎', vendorContact: '03-2222-3333',
    status: '発注登録済',
    quotationDeadline: '2026-02-03', orderDeadline: '2026-02-06', deliveryDeadline: '2026-02-20',
    deliveryDate: null, inspectionDate: null, rejectedDate: null,
    alternativeDevice: '代替除細動器 TEC-5500', alternativeUnreturned: false,
  },
  {
    id: 6, requestNo: 'REP-20260128-001', requestDate: '2026-01-28', repairCategory: '院内対応',
    qrLabel: 'QR-006', itemName: '電気メス', maker: 'コヴィディエン',
    applicantDepartment: '手術室', applicantName: '山本八郎', applicantContact: '03-4444-5555',
    vendorName: '', vendorPerson: '', vendorContact: '',
    status: '作業日確定',
    quotationDeadline: null, orderDeadline: null, deliveryDeadline: null,
    deliveryDate: '2026-02-10', inspectionDate: null, rejectedDate: null,
    alternativeDevice: null, alternativeUnreturned: false,
  },
  {
    id: 7, requestNo: 'REP-20260125-001', requestDate: '2026-01-25', repairCategory: '外部依頼',
    qrLabel: 'QR-007', itemName: 'シリンジポンプ', maker: 'テルモ',
    applicantDepartment: '内科病棟', applicantName: '松本十郎', applicantContact: '03-8888-9999',
    vendorName: 'テルモ', vendorPerson: '木村一男', vendorContact: '03-0000-1111',
    status: '完了',
    quotationDeadline: '2026-01-28', orderDeadline: '2026-01-31', deliveryDeadline: '2026-02-05',
    deliveryDate: '2026-02-05', inspectionDate: '2026-02-08', rejectedDate: null,
    alternativeDevice: '代替シリンジポンプ TE-SS700', alternativeUnreturned: true,
  },
  {
    id: 8, requestNo: 'REP-20260120-001', requestDate: '2026-01-20', repairCategory: '院内対応',
    qrLabel: 'QR-008', itemName: '吸引器', maker: '新鋭工業',
    applicantDepartment: '外来部門', applicantName: '加藤九郎', applicantContact: '03-6666-7777',
    vendorName: '', vendorPerson: '', vendorContact: '',
    status: '見積依頼',
    quotationDeadline: null, orderDeadline: null, deliveryDeadline: null,
    deliveryDate: null, inspectionDate: null, rejectedDate: null,
    alternativeDevice: null, alternativeUnreturned: false,
  },
];

// ========== ステップタブ定義 ==========
type StepKey = 'all' | 'rfq' | 'quote-reg' | 'order-reg' | 'work-date' | 'complete';

const STEP_TABS: { key: StepKey; label: string; statuses: RepairStatus[] }[] = [
  { key: 'all', label: 'すべて', statuses: [] },
  { key: 'rfq', label: '①見積依頼', statuses: ['見積依頼'] },
  { key: 'quote-reg', label: '②見積登録', statuses: ['見積依頼済'] },
  { key: 'order-reg', label: '③発注登録', statuses: ['見積登録済'] },
  { key: 'work-date', label: '④作業日登録', statuses: ['発注登録済'] },
  { key: 'complete', label: '⑤完了登録', statuses: ['作業日確定'] },
];

// ========== テーブルヘッダースタイル ==========
const thGroupStyle: React.CSSProperties = {
  padding: '8px 6px',
  border: '1px solid #E1E1E1',
  fontWeight: 600,
  fontSize: '12px',
  whiteSpace: 'nowrap',
  verticalAlign: 'middle',
};

const thSubStyle: React.CSSProperties = {
  padding: '6px 8px',
  border: '1px solid #E1E1E1',
  textAlign: 'left',
  fontWeight: 600,
  fontSize: '12px',
  whiteSpace: 'nowrap',
};

function RepairRequestsContent() {
  const router = useRouter();

  // ========== 申請受付 ==========
  const [pendingApplications, setPendingApplications] = useState<RepairApplication[]>(MOCK_PENDING_APPLICATIONS);
  const [selectedApplicationIds, setSelectedApplicationIds] = useState<Set<string>>(new Set());
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState<RepairApplication | null>(null);

  const handleSelectApplication = (id: string) => {
    const next = new Set(selectedApplicationIds);
    if (next.has(id)) next.delete(id); else next.add(id);
    setSelectedApplicationIds(next);
  };

  const handleSelectAllApplications = (checked: boolean) => {
    setSelectedApplicationIds(checked ? new Set(pendingApplications.map(a => a.id)) : new Set());
  };

  const handleViewDetail = (app: RepairApplication) => {
    setSelectedApplication(app);
    setShowDetailModal(true);
  };

  // 院内対応 / 外部依頼 で申請を処理 → タスクリストにタスク追加
  const handleProcessApplication = (app: RepairApplication, category: '院内対応' | '外部依頼') => {
    const newTask: RepairRequest = {
      id: Date.now(),
      requestNo: `REP-${app.applicationDate.replace(/-/g, '')}-${String(Math.floor(Math.random() * 999) + 1).padStart(3, '0')}`,
      requestDate: app.applicationDate,
      repairCategory: category,
      qrLabel: app.qrCode,
      itemName: app.itemName,
      maker: app.maker,
      applicantDepartment: app.applicantDepartment,
      applicantName: app.applicantName,
      applicantContact: app.applicantContact,
      vendorName: '', vendorPerson: '', vendorContact: '',
      status: '見積依頼',
      quotationDeadline: null, orderDeadline: null, deliveryDeadline: null,
      deliveryDate: null, inspectionDate: null, rejectedDate: null,
      alternativeDevice: null, alternativeUnreturned: false,
    };
    setRepairTasks(prev => [newTask, ...prev]);
    setPendingApplications(prev => prev.filter(a => a.id !== app.id));
    setShowDetailModal(false);
    setSelectedApplication(null);
    alert(`「${app.itemName}」の修理申請を「${category}」として受け付けました。`);
  };

  // ========== 修理タスク管理リスト ==========
  const [repairTasks, setRepairTasks] = useState<RepairRequest[]>(INITIAL_REPAIR_TASKS);
  const [activeStep, setActiveStep] = useState<StepKey>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [alternativeUnreturnedOnly, setAlternativeUnreturnedOnly] = useState(false);

  // 完了・却下を除くアクティブなタスク
  const activeTasks = useMemo(() => {
    const EXCLUDED: RepairStatus[] = ['完了', '却下'];
    return repairTasks.filter(t => !EXCLUDED.includes(t.status));
  }, [repairTasks]);

  // フィルタ適用
  const filteredTasks = useMemo(() => {
    let result = activeTasks;
    // ステップタブ
    const tab = STEP_TABS.find(t => t.key === activeStep);
    if (tab && tab.statuses.length > 0) {
      result = result.filter(t => tab.statuses.includes(t.status));
    }
    // 修理区分
    if (categoryFilter) {
      result = result.filter(t => t.repairCategory === categoryFilter);
    }
    // 代替品未返却
    if (alternativeUnreturnedOnly) {
      result = result.filter(t => t.alternativeUnreturned);
    }
    return result;
  }, [activeTasks, activeStep, categoryFilter, alternativeUnreturnedOnly]);

  // 修理区分一覧
  const repairCategories = useMemo(() => {
    const cats = new Set(repairTasks.map(t => t.repairCategory));
    return Array.from(cats);
  }, [repairTasks]);

  // タスクアクションハンドラー → 修理申請管理画面へ遷移（REQ-076: 申請内容 repairCategory を引き渡し）
  const handleNavigateToRepairTask = (id: number) => {
    const task = repairTasks.find(t => t.id === id);
    const category = task?.repairCategory || '';
    router.push(`/repair-task?id=${id}&repairCategory=${encodeURIComponent(category)}`);
  };
  const handleDelete = (id: number) => {
    if (confirm('この修理タスクを削除しますか？')) {
      setRepairTasks(prev => prev.filter(t => t.id !== id));
    }
  };

  return (
    <div className="min-h-dvh flex flex-col" style={{ background: '#FAFAFA' }}>
      <Header
        title="タスク管理"
        showBackButton={true}
        backHref="/main"
        backLabel="メイン画面に戻る"
        hideMenu={true}
      />

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '16px', overflowY: 'auto', gap: '16px' }}>
          <SubTabNavigation activeTab="repairRequests" />

          {/* ========== セクション①: 申請受付 ========== */}
          <div style={{
            background: 'white',
            borderRadius: '8px',
            border: '1px solid #E1E1E1',
            overflow: 'hidden',
          }}>
            <div style={{
              padding: '12px 16px',
              background: 'white',
              color: '#4A4A4A',
              borderBottom: '1px solid #E1E1E1',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
              <span style={{ fontWeight: 600, fontSize: '14px' }}>申請受付</span>
              <span style={{
                background: '#F1F1F1',
                color: '#4A4A4A',
                padding: '2px 10px',
                borderRadius: '12px',
                fontSize: '12px',
              }}>
                未処理: {pendingApplications.length}件
              </span>
            </div>

            {pendingApplications.length === 0 ? (
              <div style={{ padding: '16px', textAlign: 'center', color: '#8A8A8A', fontSize: '13px' }}>
                新たな申請がありません
              </div>
            ) : (
              <>
                <div style={{ maxHeight: '300px', overflow: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                    <thead style={{ position: 'sticky', top: 0, zIndex: 1 }}>
                      <tr style={{ background: '#F1F1F1', color: '#4A4A4A' }}>
                        <th rowSpan={2} style={{ ...thGroupStyle, width: '36px', verticalAlign: 'middle' }}>
                          <input
                            type="checkbox"
                            checked={pendingApplications.length > 0 && selectedApplicationIds.size === pendingApplications.length}
                            onChange={(e) => handleSelectAllApplications(e.target.checked)}
                          />
                        </th>
                        <th colSpan={2} style={{ ...thGroupStyle, textAlign: 'center' }}>申請項目</th>
                        <th colSpan={3} style={{ ...thGroupStyle, textAlign: 'center' }}>設置情報</th>
                        <th colSpan={4} style={{ ...thGroupStyle, textAlign: 'center' }}>品目情報</th>
                        <th colSpan={3} style={{ ...thGroupStyle, textAlign: 'center' }}>院内担当情報</th>
                        <th rowSpan={2} style={{ ...thGroupStyle, textAlign: 'center', verticalAlign: 'middle' }}></th>
                      </tr>
                      <tr style={{ background: '#FAFAFA', color: '#4A4A4A' }}>
                        <th style={thSubStyle}>申請日</th>
                        <th style={thSubStyle}>申請依頼No.</th>
                        <th style={thSubStyle}>部門名</th>
                        <th style={thSubStyle}>部署名</th>
                        <th style={thSubStyle}>室名</th>
                        <th style={thSubStyle}>QRコード</th>
                        <th style={thSubStyle}>品目名</th>
                        <th style={thSubStyle}>メーカー名</th>
                        <th style={thSubStyle}>型式</th>
                        <th style={thSubStyle}>所属部署</th>
                        <th style={thSubStyle}>氏名</th>
                        <th style={thSubStyle}>連絡先</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pendingApplications.map((app) => (
                        <tr
                          key={app.id}
                          style={{
                            borderBottom: '1px solid #E1E1E1',
                            background: selectedApplicationIds.has(app.id) ? '#EBF5EE' : 'transparent',
                            cursor: 'pointer',
                          }}
                          onClick={() => handleViewDetail(app)}
                        >
                          <td style={{ padding: '8px 6px', border: '1px solid #E1E1E1' }} onClick={(e) => e.stopPropagation()}>
                            <input
                              type="checkbox"
                              checked={selectedApplicationIds.has(app.id)}
                              onChange={() => handleSelectApplication(app.id)}
                            />
                          </td>
                          <td style={{ padding: '8px', border: '1px solid #E1E1E1', color: '#8A8A8A', whiteSpace: 'nowrap' }}>{app.applicationDate}</td>
                          <td style={{ padding: '8px', border: '1px solid #E1E1E1', whiteSpace: 'nowrap' }}>
                            <span style={{ color: '#008C1D', fontWeight: 'bold', cursor: 'pointer' }}>{app.applicationNo}</span>
                          </td>
                          <td style={{ padding: '8px', border: '1px solid #E1E1E1', color: '#4A4A4A' }}>{app.department}</td>
                          <td style={{ padding: '8px', border: '1px solid #E1E1E1', color: '#8A8A8A', fontSize: '12px' }}>{app.section || '-'}</td>
                          <td style={{ padding: '8px', border: '1px solid #E1E1E1', color: '#8A8A8A', fontSize: '12px' }}>{app.roomName || '-'}</td>
                          <td style={{ padding: '8px', border: '1px solid #E1E1E1', fontFamily: 'monospace', color: '#008C1D', fontSize: '12px' }}>{app.qrCode}</td>
                          <td style={{ padding: '8px', border: '1px solid #E1E1E1', color: '#4A4A4A' }}>{app.itemName}</td>
                          <td style={{ padding: '8px', border: '1px solid #E1E1E1', color: '#8A8A8A', fontSize: '12px' }}>{app.maker}</td>
                          <td style={{ padding: '8px', border: '1px solid #E1E1E1', color: '#8A8A8A', fontSize: '12px' }}>{app.model}</td>
                          <td style={{ padding: '8px', border: '1px solid #E1E1E1', color: '#8A8A8A', fontSize: '12px' }}>{app.applicantDepartment}</td>
                          <td style={{ padding: '8px', border: '1px solid #E1E1E1', color: '#4A4A4A' }}>{app.applicantName}</td>
                          <td style={{ padding: '8px', border: '1px solid #E1E1E1', color: '#8A8A8A', fontSize: '12px' }}>
                            {app.applicantContact}
                          </td>
                          <td style={{ padding: '8px', border: '1px solid #E1E1E1', textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={() => handleViewDetail(app)}
                              style={{
                                padding: '6px 12px',
                                background: 'white',
                                border: '1px solid #E1E1E1',
                                borderRadius: '4px',
                                fontSize: '12px',
                                cursor: 'pointer',
                                whiteSpace: 'nowrap',
                                color: '#4A4A4A',
                              }}
                            >
                              申請内容
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* 選択件数 */}
                <div style={{
                  padding: '12px 16px',
                  borderTop: '1px solid #E1E1E1',
                  background: '#FAFAFA',
                  fontSize: '13px',
                  color: '#8A8A8A',
                }}>
                  選択した申請: {selectedApplicationIds.size}件
                </div>
              </>
            )}
          </div>

          {/* ========== セクション②: 修理 タスク管理リスト ========== */}
          <div style={{
            flex: 1,
            background: 'white',
            borderRadius: '8px',
            border: '1px solid #E1E1E1',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
          }}>
            <div style={{
              padding: '10px 16px',
              background: 'white',
              color: '#4A4A4A',
              borderBottom: '1px solid #E1E1E1',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
              <span style={{ fontWeight: 600, fontSize: 14 }}>修理 タスク管理リスト</span>
            </div>

            {/* ステップタブ (Figma 下線スタイル) */}
            <div style={{
              borderBottom: '1px solid #E1E1E1',
              display: 'flex',
              background: 'white',
              overflowX: 'auto',
            }}>
              {STEP_TABS.map((tab) => {
                const isActive = activeStep === tab.key;
                const count = tab.statuses.length === 0
                  ? activeTasks.length
                  : activeTasks.filter(t => tab.statuses.includes(t.status)).length;
                return (
                  <button
                    key={tab.key}
                    onClick={() => setActiveStep(tab.key)}
                    style={{
                      padding: '10px 16px',
                      background: 'transparent',
                      border: 'none',
                      borderBottom: isActive ? '2px solid #008C1D' : '2px solid transparent',
                      cursor: 'pointer',
                      fontSize: '12px',
                      fontWeight: isActive ? 600 : 500,
                      color: isActive ? '#146E2E' : '#8A8A8A',
                      whiteSpace: 'nowrap',
                      marginBottom: '-1px',
                    }}
                  >
                    {tab.label}
                    <span style={{
                      marginLeft: '6px',
                      background: '#F1F1F1',
                      color: '#4A4A4A',
                      padding: '1px 6px',
                      borderRadius: '8px',
                      fontSize: '11px',
                    }} className="tabular-nums">
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* フィルター行 */}
            <div style={{
              padding: '10px 16px',
              borderBottom: '1px solid #E1E1E1',
              background: '#FAFAFA',
              display: 'flex',
              gap: '16px',
              alignItems: 'center',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <label style={{ fontSize: '13px', color: '#8A8A8A', whiteSpace: 'nowrap' }}>修理区分</label>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  style={{ padding: '6px 12px', border: '1px solid #E1E1E1', borderRadius: '4px', fontSize: '13px', minWidth: '120px' }}
                >
                  <option value="">すべて</option>
                  {repairCategories.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div style={{ flex: 1 }} />

              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#8A8A8A', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={alternativeUnreturnedOnly}
                  onChange={(e) => setAlternativeUnreturnedOnly(e.target.checked)}
                  style={{ width: '16px', height: '16px' }}
                />
                代替品未返却で絞り込む
              </label>

              <button
                onClick={() => { setCategoryFilter(''); setAlternativeUnreturnedOnly(false); setActiveStep('all'); }}
                style={{ padding: '6px 16px', background: '#FAFAFA', border: '1px solid #E1E1E1', borderRadius: '4px', fontSize: '12px', cursor: 'pointer', color: '#8A8A8A' }}
              >
                クリア
              </button>
            </div>

            {/* テーブルエリア */}
            <div style={{ flex: 1, overflow: 'auto' }}>
              <RepairRequestsTab
                repairRequests={filteredTasks}
                onSendRfq={handleNavigateToRepairTask}
                onRegisterQuotation={handleNavigateToRepairTask}
                onRegisterOrder={handleNavigateToRepairTask}
                onRegisterWorkDate={handleNavigateToRepairTask}
                onComplete={handleNavigateToRepairTask}
                onDelete={handleDelete}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ========== 修理申請 内容確認モーダル ========== */}
      {showDetailModal && selectedApplication && (() => {
        const modalThStyle: React.CSSProperties = {
          padding: '10px 16px', background: '#FAFAFA', border: '1px solid #E1E1E1',
          fontWeight: 600, fontSize: 13, color: '#4A4A4A', textAlign: 'left', whiteSpace: 'nowrap', width: '120px',
        };
        const modalTdStyle: React.CSSProperties = {
          padding: '10px 16px', border: '1px solid #E1E1E1', fontSize: 13, color: '#4A4A4A',
        };
        const sectionStyle: React.CSSProperties = {
          borderRadius: 8, padding: '20px 24px', marginBottom: 16,
        };
        const sectionTitleStyle: React.CSSProperties = {
          fontSize: 14, fontWeight: 700, color: '#4A4A4A', marginBottom: 12,
          borderBottom: '2px solid #E1E1E1', paddingBottom: 6,
        };
        return (
          <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.5)' }}>
            <div style={{ background: 'white', borderRadius: 8, maxWidth: 700, width: '95%', boxShadow: '0 8px 32px rgba(0,0,0,0.2)', maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              {/* ヘッダー */}
              <div style={{ padding: '14px 24px', background: '#008C1D', color: 'white', display: 'flex', alignItems: 'center', gap: 24 }}>
                <span style={{ fontWeight: 700, fontSize: 15, border: '1px solid rgba(255,255,255,0.4)', padding: '4px 16px', borderRadius: 4 }}>修理申請 内容確認</span>
                <span style={{ fontSize: 14, background: 'rgba(255,255,255,0.15)', padding: '4px 16px', borderRadius: 4 }}>
                  移動申請No. {selectedApplication.applicationNo}
                </span>
                <button
                  onClick={() => { setShowDetailModal(false); setSelectedApplication(null); }}
                  aria-label="閉じる"
                  style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'white', fontSize: 20, cursor: 'pointer', padding: '4px 8px', lineHeight: 1 }}
                >
                  &#x2715;
                </button>
              </div>

              {/* 内容 */}
              <div style={{ padding: '20px 24px', overflow: 'auto', flex: 1 }}>
                {/* 依頼情報 */}
                <div style={sectionStyle}>
                  <div style={sectionTitleStyle}>依頼情報</div>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <tbody>
                      <tr>
                        <th style={modalThStyle}>修理依頼No.</th>
                        <td style={modalTdStyle}>{selectedApplication.applicationNo}</td>
                        <th style={modalThStyle}>依頼日</th>
                        <td style={modalTdStyle}>{selectedApplication.applicationDate}</td>
                      </tr>
                      <tr>
                        <th style={modalThStyle}>申請部署</th>
                        <td style={modalTdStyle}>{selectedApplication.applicantDepartment}</td>
                        <th style={modalThStyle}>申請者</th>
                        <td style={modalTdStyle}>{selectedApplication.applicantName}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* 機器情報 */}
                <div style={sectionStyle}>
                  <div style={{ ...sectionTitleStyle, display: 'flex', alignItems: 'baseline', gap: 8 }}>
                    機器情報
                    <span style={{ fontSize: 12, fontWeight: 400, color: '#008C1D' }}>(登録済み資産)</span>
                  </div>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <tbody>
                      <tr>
                        <th style={modalThStyle}>QRラベル</th>
                        <td colSpan={3} style={{ ...modalTdStyle, fontFamily: 'monospace' }}>{selectedApplication.qrCode}</td>
                      </tr>
                      <tr>
                        <th style={modalThStyle}>品目</th>
                        <td style={modalTdStyle}>{selectedApplication.itemName}</td>
                        <th style={modalThStyle}>メーカー</th>
                        <td style={modalTdStyle}>{selectedApplication.maker}</td>
                      </tr>
                      <tr>
                        <th style={modalThStyle}>型式</th>
                        <td style={modalTdStyle}>{selectedApplication.model}</td>
                        <th style={modalThStyle}>シリアルNo.</th>
                        <td style={modalTdStyle}>{selectedApplication.serialNo}</td>
                      </tr>
                      <tr>
                        <th style={modalThStyle}>設置部署</th>
                        <td style={modalTdStyle}>{selectedApplication.section}</td>
                        <th style={modalThStyle}>室名</th>
                        <td style={modalTdStyle}>{selectedApplication.roomName}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* 症状・代替機 */}
                <div style={sectionStyle}>
                  <div style={sectionTitleStyle}>症状・代替機</div>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <tbody>
                      <tr>
                        <th style={modalThStyle}>症状</th>
                        <td style={modalTdStyle}>{selectedApplication.symptoms}</td>
                      </tr>
                      <tr>
                        <th style={modalThStyle}>代替機</th>
                        <td style={modalTdStyle}>{selectedApplication.alternativeNeeded ? '必要' : '不要'}</td>
                      </tr>
                      <tr>
                        <th style={modalThStyle}>フリーコメント</th>
                        <td style={modalTdStyle}>{selectedApplication.freeComment || '-'}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* フッター */}
              <div style={{ padding: '16px 24px', background: '#FAFAFA', borderTop: '1px solid #E1E1E1' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <button
                    onClick={() => window.print()}
                    style={{ padding: '10px 24px', background: 'white', border: '1px solid #E1E1E1', borderRadius: 4, cursor: 'pointer', fontSize: 13, color: '#4A4A4A', fontWeight: 600 }}
                  >
                    印刷
                  </button>
                  <button
                    onClick={() => { setShowDetailModal(false); setSelectedApplication(null); }}
                    style={{ padding: '10px 24px', background: 'white', border: '1px solid #E1E1E1', borderRadius: 4, cursor: 'pointer', fontSize: 13, color: '#4A4A4A', fontWeight: 600 }}
                  >
                    キャンセル
                  </button>
                  <div style={{ flex: 1 }} />
                  <button
                    onClick={() => handleProcessApplication(selectedApplication, '院内対応')}
                    style={{ padding: '10px 32px', background: '#008C1D', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}
                  >
                    院内対応
                  </button>
                  <button
                    onClick={() => handleProcessApplication(selectedApplication, '外部依頼')}
                    style={{ padding: '10px 32px', background: '#008C1D', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}
                  >
                    外部依頼
                  </button>
                </div>
                <div style={{ textAlign: 'center', marginTop: 8, fontSize: 12, color: '#8A8A8A', background: '#F1F1F1', padding: '4px 12px', borderRadius: 4, border: '1px solid #E1E1E1' }}>
                  上記の修理区分でタスク管理リストに追加されます
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}

export default function RepairRequestsPage() {
  return (
    <Suspense fallback={<div style={{ padding: '20px', textAlign: 'center' }}>読み込み中...</div>}>
      <RepairRequestsContent />
    </Suspense>
  );
}
