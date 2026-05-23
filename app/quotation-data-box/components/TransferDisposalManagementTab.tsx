'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useRfqGroupStore } from '@/lib/stores/rfqGroupStore';
import { RfqGroupModal } from '@/components/remodel/RfqGroupModal';

// ステータス体系（添付画像準拠）
type DisposalRfqStatus = '見積依頼' | '見積依頼済' | '見積登録済' | '発注済' | '作業日確定' | '完了' | '申請を見送る';

// 要望機器データ型
interface DesiredEquipment {
  rank: string;          // 希望順（第一希望、第二希望...）
  itemName: string;      // 品目
  maker: string;         // メーカー
  model: string;         // 型式
}

// 申請受付用データ型
interface PendingApplication {
  id: string;
  applicationNo: string;
  applicationType: '移動申請' | '廃棄申請';
  applicationDate: string;
  // 設置情報
  department: string;
  section: string;
  roomName: string;
  desiredDelivery: string;  // 希望納期
  // 品目情報
  qrCode: string;
  itemName: string;
  quantity: number;         // 台数
  maker: string;
  model: string;
  // 要望機器
  desiredEquipments: DesiredEquipment[];
  // 使用用途及び件数
  purpose: string;          // 用途
  usageCount: string;       // 件数
  // 院内担当情報
  applicantDepartment: string;
  applicantName: string;
  applicantContact: string;
  // 移動先情報（移動申請用）
  destDepartment: string;
  destSection: string;
  destRoomName: string;
  comment: string;
  // 添付ファイル
  attachments: string[];
  // システム接続要望
  connectionRequired: string;  // 接続不要 / 接続要
  connectionTarget: string;    // 接続先
}

// 見積依頼グループ用データ型
interface DisposalRfqGroup {
  id: number;
  rfqNo: string;
  groupName: string;
  vendorName: string;
  personInCharge: string;
  tel: string;
  status: DisposalRfqStatus;
  // 期限フィールド
  rfqDeadline: string | null;        // 見積提出期限
  orderDeadline: string | null;      // 発注期限
  disposalDate: string | null;       // 廃棄（移動）期日
  workDate: string | null;           // 廃棄・移動日
  rejectionDate: string | null;      // 却下日
}

// ステータスバッジ色
const STATUS_BADGE_COLORS: Record<DisposalRfqStatus, string> = {
  '見積依頼': '#8A8A8A',
  '見積依頼済': '#087CB6',
  '見積登録済': '#008C1D',
  '発注済': '#4A4A4A',
  '作業日確定': '#4A4A4A',
  '完了': '#4A4A4A',
  '申請を見送る': '#DA0000',
};

// ステータス別の期限マッピング
interface DeadlineMapping {
  label: string;
  field: keyof Pick<DisposalRfqGroup, 'rfqDeadline' | 'orderDeadline' | 'disposalDate' | 'workDate' | 'rejectionDate'>;
}

const STATUS_DEADLINE_MAP: Partial<Record<DisposalRfqStatus, DeadlineMapping>> = {
  '見積依頼済': { label: '見積提出期限', field: 'rfqDeadline' },
  '見積登録済': { label: '廃棄依頼期限', field: 'orderDeadline' },
  '発注済': { label: '廃棄期日', field: 'disposalDate' },
  '作業日確定': { label: '廃棄日', field: 'workDate' },
  '申請を見送る': { label: '却下日', field: 'rejectionDate' },
};

// ステップタブ定義
type StepKey = 'all' | 'rfq' | 'quote' | 'order' | 'workdate' | 'complete';
// タブはActionで絞り込む（そのActionを実行できるステータスでフィルタ）
const STEP_TABS: { key: StepKey; label: string; statuses: DisposalRfqStatus[] }[] = [
  { key: 'all', label: 'すべて', statuses: [] },
  { key: 'rfq', label: '①業者選定', statuses: ['見積依頼'] },             // Action: 廃棄業者選定
  { key: 'quote', label: '②見積回収', statuses: ['見積依頼済'] },          // Action: 見積回収
  { key: 'order', label: '③廃棄依頼', statuses: ['見積登録済'] },          // Action: 廃棄依頼
  { key: 'workdate', label: '④作業日確定', statuses: ['発注済'] },         // Action: 廃棄作業日確定
  { key: 'complete', label: '⑤完了登録', statuses: ['作業日確定'] },       // Action: 完了登録
];

// 申請種別バッジスタイル
const getApplicationTypeStyle = (type: '移動申請' | '廃棄申請'): React.CSSProperties => ({
  background: type === '移動申請' ? '#FDF1E5' : '#FDF1E5',
  color: type === '移動申請' ? '#4A4A4A' : '#DA0000',
});

// --- モックデータ ---

const MOCK_PENDING_APPLICATIONS: PendingApplication[] = [
  {
    id: 'td-001', applicationNo: '廃-26001', applicationType: '廃棄申請',
    applicationDate: '2026-02-18',
    department: '01 救急部', section: '01 救命救急センター', roomName: '初療室',
    desiredDelivery: '2027年3月',
    qrCode: 'QR-00123', itemName: '電気メス', quantity: 1,
    maker: '日本光電', model: 'ECG-2550',
    desiredEquipments: [
      { rank: '第一希望', itemName: '電気手術器(電気メス)', maker: '日本メドトロニック', model: 'AEXジェネレータ' },
      { rank: '第二希望', itemName: '高周波焼灼装置', maker: 'アムコ', model: '高周波手術装置VIO200S' },
    ],
    purpose: '初療室ないでの簡易的な処置に使用', usageCount: '15 件／月',
    applicantDepartment: 'ME室', applicantName: '山田 太郎', applicantContact: '内線1234',
    destDepartment: '', destSection: '', destRoomName: '',
    comment: '現状は必要時にMEより借りているが件数増加に伴い、救急部に１台配置したい',
    attachments: ['見積_電気メス_アムコ.pdf'],
    connectionRequired: '接続不要', connectionTarget: '-',
  },
  {
    id: 'td-002', applicationNo: '廃-26002', applicationType: '廃棄申請',
    applicationDate: '2026-02-17',
    department: '診療技術部', section: '放射線科', roomName: '生理検査室',
    desiredDelivery: '2027年4月',
    qrCode: 'QR-00456', itemName: '超音波診断装置', quantity: 1,
    maker: 'GEヘルスケア', model: 'LOGIQ S8',
    desiredEquipments: [
      { rank: '第一希望', itemName: '超音波診断装置', maker: 'GEヘルスケア', model: 'LOGIQ E10s' },
    ],
    purpose: '生理検査全般', usageCount: '20 件／月',
    applicantDepartment: '放射線科', applicantName: '佐藤 花子', applicantContact: '内線5678',
    destDepartment: '', destSection: '', destRoomName: '',
    comment: '故障頻発のため廃棄・更新を希望',
    attachments: [],
    connectionRequired: '接続不要', connectionTarget: '-',
  },
  {
    id: 'td-003', applicationNo: '移-26001', applicationType: '移動申請',
    applicationDate: '2026-02-16',
    department: '01 救急部', section: '01 救命救急センター', roomName: '初療室',
    desiredDelivery: '2027年3月',
    qrCode: 'QR-00789', itemName: '電気メス', quantity: 1,
    maker: 'コヴィディエン', model: 'ForceTriad',
    desiredEquipments: [
      { rank: '第一希望', itemName: '電気手術器(電気メス)', maker: '日本メドトロニック', model: 'AEXジェネレータ' },
      { rank: '第二希望', itemName: '高周波焼灼装置', maker: 'アムコ', model: '高周波手術装置VIO200S' },
    ],
    purpose: '初療室ないでの簡易的な処置に使用', usageCount: '15 件／月',
    applicantDepartment: '手術部', applicantName: '鈴木 一郎', applicantContact: '内線9012',
    destDepartment: '内科', destSection: '検査室', destRoomName: '内科検査室1',
    comment: '現状は必要時にMEより借りているが件数増加に伴い、救急部に１台配置したい',
    attachments: ['見積_電気メス_アムコ.pdf'],
    connectionRequired: '接続不要', connectionTarget: '-',
  },
];

const MOCK_RFQ_GROUPS: DisposalRfqGroup[] = [
  {
    id: 1, rfqNo: 'RFQ-20260110-0001', groupName: 'ME室 心電計廃棄一式',
    vendorName: 'シーメンス・ジャパン', personInCharge: '山田太郎', tel: '03-1234-5678',
    status: '見積依頼済',
    rfqDeadline: '2026-03-20', orderDeadline: null, disposalDate: null, workDate: null, rejectionDate: null,
  },
  {
    id: 2, rfqNo: 'RFQ-20260111-0002', groupName: '放射線科 超音波装置廃棄',
    vendorName: 'GEヘルスケア', personInCharge: '鈴木一郎', tel: '03-2345-6789',
    status: '見積登録済',
    rfqDeadline: null, orderDeadline: '2026-03-25', disposalDate: null, workDate: null, rejectionDate: null,
  },
  {
    id: 3, rfqNo: 'RFQ-20260113-0003', groupName: '検査科 血液ガス分析装置廃棄',
    vendorName: 'フィリップス・ジャパン', personInCharge: '佐藤花子', tel: '03-3456-7890',
    status: '発注済',
    rfqDeadline: null, orderDeadline: null, disposalDate: '2026-04-10', workDate: null, rejectionDate: null,
  },
  {
    id: 4, rfqNo: 'RFQ-20260115-0004', groupName: '看護部 輸液ポンプ廃棄',
    vendorName: 'オリンパス', personInCharge: '田中次郎', tel: '03-4567-8901',
    status: '作業日確定',
    rfqDeadline: null, orderDeadline: null, disposalDate: null, workDate: '2026-04-15', rejectionDate: null,
  },
  {
    id: 5, rfqNo: 'RFQ-20260120-0005', groupName: '手術部 電気メス廃棄一式',
    vendorName: 'キヤノンメディカル', personInCharge: '高橋美咲', tel: '03-5678-9012',
    status: '完了',
    rfqDeadline: null, orderDeadline: null, disposalDate: null, workDate: null, rejectionDate: null,
  },
];

// --- ヘッダースタイル ---
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

const tdStyle: React.CSSProperties = {
  padding: '8px',
  borderBottom: '1px solid #E1E1E1',
  whiteSpace: 'nowrap',
};

export function TransferDisposalManagementTab() {
  const router = useRouter();
  const { generateRfqNo } = useRfqGroupStore();

  // --- 申請受付 ---
  const [selectedApplicationIds, setSelectedApplicationIds] = useState<Set<string>>(new Set());

  // 移動申請承認モーダル
  const [isApprovalModalOpen, setIsApprovalModalOpen] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState<PendingApplication | null>(null);

  // 見積依頼グループ作成モーダル
  const [isRfqGroupModalOpen, setIsRfqGroupModalOpen] = useState(false);
  const [rfqGroupName, setRfqGroupName] = useState('');

  const pendingApplications = MOCK_PENDING_APPLICATIONS;
  const pendingCount = pendingApplications.length;

  // 廃棄申請のみが廃棄依頼グループ作成の対象（移動申請は申請受付で完結）
  const disposalApplications = useMemo(
    () => pendingApplications.filter(a => a.applicationType === '廃棄申請'),
    [pendingApplications]
  );

  const handleSelectApplication = (id: string) => {
    const newSet = new Set(selectedApplicationIds);
    if (newSet.has(id)) { newSet.delete(id); } else { newSet.add(id); }
    setSelectedApplicationIds(newSet);
  };

  const handleSelectAllApplications = (checked: boolean) => {
    if (checked) {
      setSelectedApplicationIds(new Set(disposalApplications.map(a => a.id)));
    } else {
      setSelectedApplicationIds(new Set());
    }
  };

  const handleViewDetail = (app: PendingApplication) => {
    setSelectedApplication(app);
    setIsApprovalModalOpen(true);
  };

  const handleConfirmApproval = () => {
    if (!selectedApplication) return;
    setIsApprovalModalOpen(false);
    setSelectedApplication(null);
    alert('移動申請を承認しました。原本に反映されます。');
  };

  // --- 見積依頼グループ ---
  const [activeStep, setActiveStep] = useState<StepKey>('all');
  const [rfqGroups, setRfqGroups] = useState<DisposalRfqGroup[]>(MOCK_RFQ_GROUPS);

  const EXCLUDED_STATUSES: DisposalRfqStatus[] = ['申請を見送る'];
  const activeRfqGroups = useMemo(() => {
    return rfqGroups.filter(g => !EXCLUDED_STATUSES.includes(g.status));
  }, [rfqGroups]);

  const filteredRfqGroups = useMemo(() => {
    const tab = STEP_TABS.find(t => t.key === activeStep);
    if (!tab || tab.statuses.length === 0) return activeRfqGroups;
    return activeRfqGroups.filter(g => tab.statuses.includes(g.status));
  }, [activeRfqGroups, activeStep]);

  // 見積依頼グループ作成ハンドラー
  const handleCreateRfqGroup = () => {
    const rfqNo = generateRfqNo();
    const today = new Date();
    const createdDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    const newGroup: DisposalRfqGroup = {
      id: Math.max(0, ...rfqGroups.map(g => g.id)) + 1,
      rfqNo,
      groupName: rfqGroupName.trim(),
      vendorName: '',
      personInCharge: '',
      tel: '',
      status: '見積依頼',
      rfqDeadline: null,
      orderDeadline: null,
      disposalDate: null,
      workDate: null,
      rejectionDate: null,
    };

    setRfqGroups(prev => [...prev, newGroup]);
    alert(`廃棄依頼グループ「${rfqGroupName.trim()}」を作成しました\n\n廃棄依頼No.: ${rfqNo}\n選択レコード: ${selectedApplicationIds.size}件`);
    setIsRfqGroupModalOpen(false);
    setRfqGroupName('');
    setSelectedApplicationIds(new Set());
  };

  // ステータスバッジ
  const getStatusBadge = (status: DisposalRfqStatus) => {
    const bg = STATUS_BADGE_COLORS[status] || '#8A8A8A';
    const textColor = status === '作業日確定' ? '#4A4A4A' : 'white';
    return (
      <span style={{
        padding: '4px 12px',
        borderRadius: '12px',
        fontSize: '12px',
        fontWeight: 'bold',
        background: bg,
        color: textColor,
        whiteSpace: 'nowrap',
      }}>
        {status}
      </span>
    );
  };

  // アクションボタン
  const getActionButton = (group: DisposalRfqGroup) => {
    const btnBase: React.CSSProperties = {
      padding: '6px 12px',
      color: 'white',
      border: 'none',
      borderRadius: '4px',
      cursor: 'pointer',
      fontSize: '12px',
      whiteSpace: 'nowrap',
    };

    const navigateToTask = () => router.push(`/disposal-task?groupId=${group.id}`);

    switch (group.status) {
      case '見積依頼':
        return (
          <button style={{ ...btnBase, background: '#087CB6' }}
            onClick={navigateToTask}>
            業者選定
          </button>
        );
      case '見積依頼済':
        return (
          <button style={{ ...btnBase, background: '#008C1D' }}
            onClick={navigateToTask}>
            見積回収
          </button>
        );
      case '見積登録済':
        return (
          <button style={{ ...btnBase, background: '#4A4A4A' }}
            onClick={navigateToTask}>
            廃棄依頼
          </button>
        );
      case '発注済':
        return (
          <button style={{ ...btnBase, background: '#4A4A4A' }}
            onClick={navigateToTask}>
            作業日確定
          </button>
        );
      case '作業日確定':
        return (
          <button style={{ ...btnBase, background: '#4A4A4A' }}
            onClick={navigateToTask}>
            完了登録
          </button>
        );
      case '完了':
        return (
          <button style={{ ...btnBase, background: '#DA0000' }}
            onClick={() => alert(`削除: ${group.groupName}`)}>
            完了登録
          </button>
        );
      default:
        return <span style={{ color: '#8A8A8A', fontSize: '12px' }}>-</span>;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', flex: 1, overflow: 'hidden' }}>

      {/* ===== セクション1: 申請受付 ===== */}
      <div style={{
        background: 'white',
        borderRadius: '8px',
        border: '1px solid #E1E1E1',
        overflow: 'hidden',
      }}>
        {/* ヘッダー (Figma 準拠: 白背景 + 黒文字) */}
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
            未処理: {pendingCount}件
          </span>
        </div>

        {pendingApplications.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#8A8A8A' }}>
            <div style={{ fontSize: '32px', marginBottom: '12px' }}>📋</div>
            <div style={{ fontSize: '14px' }}>未処理の申請はありません</div>
          </div>
        ) : (
          <>
            {/* テーブル */}
            <div style={{ maxHeight: '300px', overflow: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead style={{ position: 'sticky', top: 0, zIndex: 1 }}>
                  {/* グループヘッダー行 */}
                  <tr style={{ background: '#F1F1F1', color: '#4A4A4A' }}>
                    <th rowSpan={2} style={{ ...thGroupStyle, width: '36px', verticalAlign: 'middle' }}>
                      <input
                        type="checkbox"
                        checked={disposalApplications.length > 0 && selectedApplicationIds.size === disposalApplications.length}
                        onChange={(e) => handleSelectAllApplications(e.target.checked)}
                        disabled={disposalApplications.length === 0}
                      />
                    </th>
                    <th colSpan={2} style={{ ...thGroupStyle, textAlign: 'center' }}>申請項目</th>
                    <th colSpan={3} style={{ ...thGroupStyle, textAlign: 'center' }}>設置情報</th>
                    <th colSpan={4} style={{ ...thGroupStyle, textAlign: 'center' }}>品目情報</th>
                    <th colSpan={3} style={{ ...thGroupStyle, textAlign: 'center' }}>院内担当情報</th>
                    <th rowSpan={2} style={{ ...thGroupStyle, textAlign: 'center', verticalAlign: 'middle' }}></th>
                  </tr>
                  {/* サブカラムヘッダー行 */}
                  <tr style={{ background: '#FAFAFA', color: '#4A4A4A' }}>
                    <th style={thSubStyle}>申請日</th>
                    <th style={thSubStyle}>申請No, 種別</th>
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
                  {pendingApplications.map((app) => {
                    const typeStyle = getApplicationTypeStyle(app.applicationType);
                    const isTransfer = app.applicationType === '移動申請';
                    return (
                      <tr
                        key={app.id}
                        style={{
                          borderBottom: '1px solid #E1E1E1',
                          background: selectedApplicationIds.has(app.id) ? '#EBF5EE' : 'transparent',
                          cursor: 'pointer',
                        }}
                        onClick={() => handleViewDetail(app)}
                      >
                        <td style={tdStyle} onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={selectedApplicationIds.has(app.id)}
                            onChange={() => handleSelectApplication(app.id)}
                            disabled={isTransfer}
                            title={isTransfer ? '移動申請は申請受付で完結します' : undefined}
                          />
                        </td>
                        {/* 申請項目: 申請日 */}
                        <td style={{ ...tdStyle, color: '#8A8A8A' }}>{app.applicationDate}</td>
                        {/* 申請項目: 申請No, 種別 */}
                        <td style={tdStyle}>
                          <span style={{ color: '#087CB6', fontWeight: 'bold', cursor: 'pointer' }}>{app.applicationNo}</span>
                          <span style={{
                            ...typeStyle,
                            padding: '2px 8px',
                            borderRadius: '4px',
                            fontSize: '11px',
                            fontWeight: 'bold',
                            marginLeft: '8px',
                            display: 'inline-block',
                          }}>
                            {app.applicationType}
                          </span>
                        </td>
                        {/* 設置情報: 部門名, 部署名, 室名 */}
                        <td style={{ ...tdStyle, color: '#4A4A4A' }}>{app.department}</td>
                        <td style={{ ...tdStyle, color: '#8A8A8A', fontSize: '12px' }}>{app.section || '-'}</td>
                        <td style={{ ...tdStyle, color: '#8A8A8A', fontSize: '12px' }}>{app.roomName || '-'}</td>
                        {/* 品目情報: QRコード, 品目名, メーカー名, 型式 */}
                        <td style={{ ...tdStyle, color: '#8A8A8A', fontSize: '12px' }}>{app.qrCode || '-'}</td>
                        <td style={{ ...tdStyle, color: '#4A4A4A' }}>{app.itemName}</td>
                        <td style={{ ...tdStyle, color: '#8A8A8A', fontSize: '12px' }}>{app.maker || '-'}</td>
                        <td style={{ ...tdStyle, color: '#8A8A8A', fontSize: '12px' }}>{app.model || '-'}</td>
                        {/* 院内担当情報: 所属部署, 氏名, 連絡先 */}
                        <td style={{ ...tdStyle, color: '#8A8A8A', fontSize: '12px' }}>{app.applicantDepartment}</td>
                        <td style={{ ...tdStyle, color: '#4A4A4A' }}>{app.applicantName}</td>
                        <td style={{ ...tdStyle, color: '#8A8A8A', fontSize: '12px' }}>{app.applicantContact || '-'}</td>
                        {/* 操作 */}
                        <td style={{ ...tdStyle, textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => handleViewDetail(app)}
                            style={{
                              padding: '6px 12px',
                              background: 'white',
                              border: '1px solid #E1E1E1',
                              borderRadius: '4px',
                              fontSize: '12px',
                              cursor: 'pointer',
                              color: '#4A4A4A',
                            }}
                          >
                            申請内容
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* アクションバー */}
            <div style={{
              padding: '12px 16px',
              borderTop: '1px solid #E1E1E1',
              background: '#FAFAFA',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
              <span style={{ fontSize: '13px', color: '#8A8A8A' }}>
                選択した申請: {selectedApplicationIds.size}件
              </span>
              <button
                onClick={() => setIsRfqGroupModalOpen(true)}
                disabled={selectedApplicationIds.size === 0}
                style={{
                  padding: '8px 16px',
                  background: selectedApplicationIds.size === 0 ? '#E1E1E1' : '#008C1D',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  fontSize: '13px',
                  fontWeight: 'bold',
                  cursor: selectedApplicationIds.size === 0 ? 'not-allowed' : 'pointer',
                }}
              >
                廃棄依頼グループ作成
              </button>
            </div>
          </>
        )}
      </div>

      {/* ===== セクション2: 廃棄依頼グループ ===== */}
      <div style={{
        flex: 1,
        background: 'white',
        borderRadius: '8px',
        border: '1px solid #E1E1E1',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}>
        {/* ヘッダー (Figma 準拠: 白背景 + 黒文字) */}
        <div style={{
          padding: '10px 16px',
          background: 'white',
          color: '#4A4A4A',
          borderBottom: '1px solid #E1E1E1',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <span style={{ fontWeight: 600, fontSize: 14 }}>廃棄依頼グループ</span>
        </div>

        {/* ステップタブ */}
        <div style={{
          borderBottom: '1px solid #E1E1E1',
          display: 'flex',
          background: '#FFFFFF',
          overflowX: 'auto',
        }}>
          {STEP_TABS.map((tab) => {
            const isActive = activeStep === tab.key;
            const count = tab.statuses.length === 0
              ? activeRfqGroups.length
              : activeRfqGroups.filter(g => tab.statuses.includes(g.status)).length;
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
                  fontSize: 12,
                  fontWeight: isActive ? 600 : 500,
                  color: isActive ? '#146E2E' : '#4A4A4A',
                  whiteSpace: 'nowrap',
                  marginBottom: -1,
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

        {/* テーブルエリア */}
        <div style={{ flex: 1, overflow: 'auto' }}>
          {filteredRfqGroups.length === 0 ? (
            <div style={{ padding: '60px 40px', textAlign: 'center', color: '#8A8A8A' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>📁</div>
              <div style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '8px' }}>廃棄依頼グループがありません</div>
              <div style={{ fontSize: '13px', lineHeight: '1.6' }}>
                廃棄申請を選択して廃棄依頼グループを作成すると、<br />
                ここに表示されます。
              </div>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead style={{ position: 'sticky', top: 0, zIndex: 1 }}>
                {/* グループヘッダー行 */}
                <tr style={{ background: '#F1F1F1', color: '#4A4A4A' }}>
                  <th rowSpan={2} style={{ ...thGroupStyle, textAlign: 'left' }}>廃棄依頼No,</th>
                  <th rowSpan={2} style={{ ...thGroupStyle, textAlign: 'left' }}>廃棄依頼グループ名称</th>
                  <th colSpan={3} style={{ ...thGroupStyle, textAlign: 'center' }}>廃棄業者情報</th>
                  <th rowSpan={2} style={{ ...thGroupStyle, textAlign: 'center' }}>ステータス</th>
                  <th rowSpan={2} style={{ ...thGroupStyle, textAlign: 'center' }}>期限</th>
                  <th rowSpan={2} style={{ ...thGroupStyle, textAlign: 'center' }}>操作</th>
                </tr>
                {/* サブカラムヘッダー行 */}
                <tr style={{ background: '#FAFAFA', color: '#4A4A4A' }}>
                  <th style={thSubStyle}>業者名</th>
                  <th style={thSubStyle}>氏名</th>
                  <th style={thSubStyle}>連絡先</th>
                </tr>
              </thead>
              <tbody>
                {filteredRfqGroups.map((group, index) => {
                  const deadlineMapping = STATUS_DEADLINE_MAP[group.status];
                  return (
                    <tr key={group.id} style={{ background: index % 2 === 0 ? 'white' : '#FAFAFA', verticalAlign: 'top' }}>
                      <td style={{ ...tdStyle, fontFamily: 'monospace', fontWeight: 600, border: '1px solid #E1E1E1' }}>
                        {group.rfqNo}
                      </td>
                      <td style={{ ...tdStyle, border: '1px solid #E1E1E1' }}>{group.groupName}</td>
                      <td style={{ ...tdStyle, border: '1px solid #E1E1E1' }}>{group.vendorName || '-'}</td>
                      <td style={{ ...tdStyle, border: '1px solid #E1E1E1' }}>{group.personInCharge || '-'}</td>
                      <td style={{ ...tdStyle, border: '1px solid #E1E1E1' }}>{group.tel || '-'}</td>
                      <td style={{ ...tdStyle, textAlign: 'center', border: '1px solid #E1E1E1' }}>
                        {getStatusBadge(group.status)}
                      </td>
                      <td style={{ ...tdStyle, verticalAlign: 'top', border: '1px solid #E1E1E1' }}>
                        {deadlineMapping && group[deadlineMapping.field] ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                            <span style={{ fontSize: '11px', color: '#8A8A8A', whiteSpace: 'nowrap' }}>
                              {deadlineMapping.label}
                            </span>
                            <span style={{ fontSize: '12px', color: '#4A4A4A' }} className="tabular-nums">
                              {group[deadlineMapping.field]}
                            </span>
                          </div>
                        ) : (
                          <span style={{ color: '#8A8A8A', fontSize: '12px' }}>-</span>
                        )}
                      </td>
                      <td style={{ ...tdStyle, textAlign: 'center', verticalAlign: 'top', border: '1px solid #E1E1E1' }}>
                        {getActionButton(group)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* ===== 申請内容確認モーダル ===== */}
      {isApprovalModalOpen && selectedApplication && (() => {
        const app = selectedApplication;
        const isTransfer = app.applicationType === '移動申請';
        const typeLabel = isTransfer ? '移動申請' : '廃棄申請';
        const modalTh: React.CSSProperties = {
          background: '#F1F1F1', padding: '8px 12px', fontSize: '13px',
          fontWeight: 600, textAlign: 'left', border: '1px solid #E1E1E1',
          whiteSpace: 'nowrap', width: '120px', color: '#4A4A4A',
        };
        const modalTd: React.CSSProperties = {
          background: 'white', padding: '8px 12px', fontSize: '13px',
          border: '1px solid #E1E1E1', color: '#4A4A4A',
        };
        const sectionLabel: React.CSSProperties = {
          fontSize: '13px', fontWeight: 600, color: '#4A4A4A',
          borderBottom: '1px solid #E1E1E1', paddingBottom: '4px', marginTop: '16px', marginBottom: '8px',
        };
        return (
          <div
            onClick={() => setIsApprovalModalOpen(false)}
            style={{
              position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
              background: 'rgba(0, 0, 0, 0.5)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              zIndex: 1000,
            }}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                background: '#FAFAFA', borderRadius: '8px',
                width: '90%', maxWidth: '700px', maxHeight: '90vh',
                boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
                display: 'flex', flexDirection: 'column',
              }}
            >
              {/* ヘッダー */}
              <div style={{
                background: 'white', padding: '16px 20px',
                borderRadius: '8px 8px 0 0', color: '#4A4A4A',
                borderBottom: '1px solid #E1E1E1',
                display: 'flex', alignItems: 'center', gap: '16px',
              }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span style={{ fontSize: '16px', fontWeight: 600, color: '#4A4A4A' }}>
                    {typeLabel}：内容確認
                  </span>
                  <span style={{ fontSize: '12px', color: '#8A8A8A' }}>
                    {typeLabel}No, {app.applicationNo}
                  </span>
                </div>
                <button
                  onClick={() => setIsApprovalModalOpen(false)}
                  style={{
                    marginLeft: 'auto', background: 'transparent', border: 'none',
                    color: '#4A4A4A', fontSize: '20px', cursor: 'pointer', padding: '4px 8px', lineHeight: 1,
                  }}
                  aria-label="閉じる"
                >
                  ×
                </button>
              </div>

              {/* コンテンツ */}
              <div style={{ padding: '16px 20px', overflowY: 'auto', flex: 1 }}>
                {/* 設置情報 */}
                <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '4px' }}>
                  <tbody>
                    <tr>
                      <th style={modalTh}>設置部門</th>
                      <td style={modalTd}>{app.department}</td>
                      <th style={modalTh}>設置部署</th>
                      <td style={modalTd}>{app.section}</td>
                    </tr>
                    <tr>
                      <th style={modalTh}>設置室名</th>
                      <td style={modalTd}>{app.roomName}</td>
                      <th style={modalTh}>希望納期</th>
                      <td style={modalTd}>{app.desiredDelivery}</td>
                    </tr>
                  </tbody>
                </table>

                {/* 申請品目 */}
                <div style={sectionLabel}>申請品目</div>
                <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '4px' }}>
                  <tbody>
                    <tr>
                      <th style={modalTh}>品目名</th>
                      <td style={modalTd}>{app.itemName}</td>
                      <th style={{ ...modalTh, width: '80px' }}>台数</th>
                      <td style={{ ...modalTd, width: '80px' }}>{app.quantity}</td>
                    </tr>
                  </tbody>
                </table>

                {/* 要望機器 */}
                <div style={sectionLabel}>要望機器</div>
                <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '4px' }}>
                  <thead>
                    <tr>
                      <th style={{ ...modalTh, width: '80px' }}>希望順</th>
                      <th style={modalTh}>品目</th>
                      <th style={modalTh}>メーカー</th>
                      <th style={modalTh}>型式</th>
                    </tr>
                  </thead>
                  <tbody>
                    {app.desiredEquipments.map((eq, i) => (
                      <tr key={i}>
                        <td style={modalTd}>{eq.rank}</td>
                        <td style={modalTd}>{eq.itemName}</td>
                        <td style={modalTd}>{eq.maker}</td>
                        <td style={modalTd}>{eq.model}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* 使用用途及び件数 */}
                <div style={sectionLabel}>使用用途及び件数</div>
                <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '4px' }}>
                  <tbody>
                    <tr>
                      <th style={modalTh}>用途</th>
                      <td style={modalTd}>{app.purpose}</td>
                      <th style={{ ...modalTh, width: '80px' }}>件数</th>
                      <td style={{ ...modalTd, width: '120px' }}>{app.usageCount}</td>
                    </tr>
                  </tbody>
                </table>

                {/* コメント（必要理由 他） */}
                <div style={sectionLabel}>コメント（必要理由 他）</div>
                <div style={{
                  background: '#FAFAFA', padding: '10px 12px', borderRadius: '4px',
                  fontSize: '13px', color: '#4A4A4A', border: '1px solid #E1E1E1',
                  marginBottom: '4px', minHeight: '40px',
                }}>
                  {app.comment || '-'}
                </div>

                {/* 添付ファイル */}
                <div style={sectionLabel}>添付ファイル</div>
                <div style={{
                  background: 'white', padding: '10px 12px', borderRadius: '4px',
                  fontSize: '13px', color: '#4A4A4A', border: '1px solid #E1E1E1',
                  marginBottom: '4px',
                }}>
                  {app.attachments.length > 0 ? app.attachments.map((f, i) => (
                    <div key={i} style={{ padding: '2px 0' }}>{f}</div>
                  )) : '-'}
                </div>

                {/* システム接続要望 */}
                <div style={sectionLabel}>システム接続要望</div>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <tbody>
                    <tr>
                      <th style={modalTh}>接続要望</th>
                      <td style={modalTd}>{app.connectionRequired}</td>
                      <th style={modalTh}>接続先</th>
                      <td style={modalTd}>{app.connectionTarget}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* フッターボタン (Figma 階層: 戻る=Secondary グレー / 中央=Outline / Primary=緑塗り) */}
              <div style={{
                padding: '16px 20px', borderTop: '1px solid #E1E1E1',
                display: 'flex', gap: '12px', justifyContent: 'flex-end', alignItems: 'center',
              }}>
                <button
                  onClick={() => setIsApprovalModalOpen(false)}
                  style={{
                    padding: '10px 32px', background: 'white', color: '#4A4A4A',
                    border: '1px solid #E1E1E1', borderRadius: '6px', cursor: 'pointer',
                    fontSize: '14px', fontWeight: 500, minWidth: '120px',
                  }}
                >
                  戻る
                </button>
                <button
                  onClick={() => alert('印刷プレビューを表示します（モック）')}
                  style={{
                    padding: '10px 24px', background: 'white', color: '#146E2E',
                    border: '1px solid #146E2E', borderRadius: '6px', cursor: 'pointer',
                    fontSize: '14px', fontWeight: 500, minWidth: '120px',
                  }}
                >
                  印刷
                </button>
                {isTransfer ? (
                  <button
                    onClick={handleConfirmApproval}
                    style={{
                      padding: '10px 24px', background: '#008C1D', color: 'white',
                      border: 'none', borderRadius: '6px', cursor: 'pointer',
                      fontSize: '14px', fontWeight: 600, minWidth: '180px',
                    }}
                  >
                    承認して原本に反映
                  </button>
                ) : (
                  <button
                    onClick={() => alert('添付ファイルを表示します（モック）')}
                    style={{
                      padding: '10px 24px', background: 'white', color: '#146E2E',
                      border: '1px solid #146E2E', borderRadius: '6px', cursor: 'pointer',
                      fontSize: '14px', fontWeight: 500, minWidth: '140px',
                    }}
                  >
                    添付ファイル
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })()}
      {/* ===== 見積依頼グループ作成モーダル ===== */}
      <RfqGroupModal
        isOpen={isRfqGroupModalOpen}
        onClose={() => setIsRfqGroupModalOpen(false)}
        rfqGroupName={rfqGroupName}
        setRfqGroupName={setRfqGroupName}
        selectedCount={selectedApplicationIds.size}
        generatedRfqNo={generateRfqNo()}
        onSubmit={handleCreateRfqGroup}
      />
    </div>
  );
}
