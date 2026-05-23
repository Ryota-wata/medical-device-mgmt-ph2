import React from 'react';
import { EmptyState } from '@/components/ui/EmptyState';

// 修理タスクのステータス
export type RepairStatus = '見積依頼' | '見積依頼済' | '見積登録済' | '発注登録済' | '作業日確定' | '完了' | '却下';

// 修理タスクデータ型
export interface RepairRequest {
  id: number;
  requestNo: string;
  requestDate: string;
  repairCategory: string;
  qrLabel: string;
  itemName: string;
  maker: string;
  applicantDepartment: string;
  applicantName: string;
  applicantContact: string;
  vendorName: string;
  vendorPerson: string;
  vendorContact: string;
  status: RepairStatus;
  quotationDeadline: string | null;
  orderDeadline: string | null;
  deliveryDeadline: string | null;
  deliveryDate: string | null;
  inspectionDate: string | null;
  rejectedDate: string | null;
  alternativeDevice: string | null;
  alternativeUnreturned: boolean;
}

interface RepairRequestsTabProps {
  repairRequests: RepairRequest[];
  onSendRfq: (id: number) => void;
  onRegisterQuotation: (id: number) => void;
  onRegisterOrder: (id: number) => void;
  onRegisterWorkDate: (id: number) => void;
  onComplete: (id: number) => void;
  onDelete?: (id: number) => void;
  onClickRequestNo?: (id: number) => void;
}

// ステータスバッジ色
const STATUS_BADGE_COLORS: Record<RepairStatus, string> = {
  '見積依頼': '#8A8A8A',
  '見積依頼済': '#087CB6',
  '見積登録済': '#4A4A4A',
  '発注登録済': '#4A4A4A',
  '作業日確定': '#008C1D',
  '完了': '#8A8A8A',
  '却下': '#DA0000',
};

// ステータスに紐づく期限
interface DeadlineMapping {
  label: string;
  field: 'quotationDeadline' | 'orderDeadline' | 'deliveryDeadline' | 'deliveryDate' | 'inspectionDate' | 'rejectedDate';
}

const STATUS_DEADLINE_MAP: Partial<Record<RepairStatus, DeadlineMapping>> = {
  '見積依頼済': { label: '見積提出期限', field: 'quotationDeadline' },
  '見積登録済': { label: '発注期限', field: 'orderDeadline' },
  '発注登録済': { label: '納入期限', field: 'deliveryDeadline' },
  '作業日確定': { label: '納入日', field: 'deliveryDate' },
  '完了': { label: '検収日', field: 'inspectionDate' },
  '却下': { label: '却下日', field: 'rejectedDate' },
};

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
  border: '1px solid #E1E1E1',
  whiteSpace: 'nowrap',
};

export const RepairRequestsTab: React.FC<RepairRequestsTabProps> = ({
  repairRequests,
  onSendRfq,
  onRegisterQuotation,
  onRegisterOrder,
  onRegisterWorkDate,
  onComplete,
  onDelete,
  onClickRequestNo,
}) => {
  const getStatusBadge = (status: RepairStatus) => {
    const bg = STATUS_BADGE_COLORS[status] || '#8A8A8A';
    return (
      <span style={{
        padding: '4px 12px',
        borderRadius: '12px',
        fontSize: '12px',
        fontWeight: 'bold',
        background: bg,
        color: 'white',
        whiteSpace: 'nowrap',
      }}>
        {status}
      </span>
    );
  };

  const getActionButtons = (req: RepairRequest) => {
    const btnBase: React.CSSProperties = {
      padding: '6px 12px',
      color: 'white',
      border: 'none',
      borderRadius: '4px',
      cursor: 'pointer',
      fontSize: '12px',
      whiteSpace: 'nowrap',
      flexShrink: 0,
    };

    const buttons: React.ReactNode[] = [];

    switch (req.status) {
      case '見積依頼':
        buttons.push(
          <button key="rfq" onClick={() => onSendRfq(req.id)} style={{ ...btnBase, background: '#087CB6' }}>
            見積依頼
          </button>
        );
        break;
      case '見積依頼済':
        buttons.push(
          <button key="quote" onClick={() => onRegisterQuotation(req.id)} style={{ ...btnBase, background: '#087CB6' }}>
            見積登録
          </button>
        );
        break;
      case '見積登録済':
        buttons.push(
          <button key="order" onClick={() => onRegisterOrder(req.id)} style={{ ...btnBase, background: '#008C1D' }}>
            発注登録
          </button>
        );
        if (onDelete) {
          buttons.push(
            <button key="delete" onClick={() => onDelete(req.id)} style={{ ...btnBase, background: '#DA0000' }}>
              削除
            </button>
          );
        }
        break;
      case '発注登録済':
        buttons.push(
          <button key="work" onClick={() => onRegisterWorkDate(req.id)} style={{ ...btnBase, background: '#008C1D' }}>
            作業日登録
          </button>
        );
        break;
      case '作業日確定':
        buttons.push(
          <button key="complete" onClick={() => onComplete(req.id)} style={{ ...btnBase, background: '#4A4A4A' }}>
            完了登録
          </button>
        );
        break;
      case '完了':
      case '却下':
        break;
    }

    if (buttons.length === 0) {
      return <span style={{ color: '#8A8A8A', fontSize: '12px' }}>-</span>;
    }
    return <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'flex-end' }}>{buttons}</div>;
  };

  return (
    <div style={{ flex: 1, overflow: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
        <thead style={{ position: 'sticky', top: 0, zIndex: 1 }}>
          <tr style={{ background: '#F1F1F1', color: '#4A4A4A' }}>
            <th colSpan={3} style={{ ...thGroupStyle, textAlign: 'center' }}>申請項目</th>
            <th colSpan={3} style={{ ...thGroupStyle, textAlign: 'center' }}>品目情報</th>
            <th colSpan={3} style={{ ...thGroupStyle, textAlign: 'center' }}>担当情報</th>
            <th colSpan={3} style={{ ...thGroupStyle, textAlign: 'center' }}>業者情報</th>
            <th rowSpan={2} style={{ ...thGroupStyle, textAlign: 'center' }}>ステータス</th>
            <th rowSpan={2} style={{ ...thGroupStyle, textAlign: 'center' }}>期限</th>
            <th rowSpan={2} style={{ ...thGroupStyle, textAlign: 'center' }}>操作</th>
          </tr>
          <tr style={{ background: '#FAFAFA', color: '#4A4A4A' }}>
            <th style={thSubStyle}>修理区分</th>
            <th style={thSubStyle}>申請日</th>
            <th style={thSubStyle}>申請依頼No.</th>
            <th style={thSubStyle}>QRラベル</th>
            <th style={thSubStyle}>品名</th>
            <th style={thSubStyle}>メーカー名</th>
            <th style={thSubStyle}>申請部署</th>
            <th style={thSubStyle}>氏名</th>
            <th style={thSubStyle}>連絡先</th>
            <th style={thSubStyle}>業者名</th>
            <th style={thSubStyle}>氏名</th>
            <th style={thSubStyle}>連絡先</th>
          </tr>
        </thead>
        <tbody>
          {repairRequests.map((req, index) => {
            const deadlineMapping = STATUS_DEADLINE_MAP[req.status];
            return (
              <tr key={req.id} style={{ background: index % 2 === 0 ? 'white' : '#FAFAFA', verticalAlign: 'top' }}>
                <td style={tdStyle}>{req.repairCategory}</td>
                <td style={tdStyle}>{req.requestDate}</td>
                <td style={{ ...tdStyle, fontFamily: 'monospace', fontWeight: 600 }}>
                  {onClickRequestNo ? (
                    <span
                      style={{ color: '#087CB6', cursor: 'pointer', textDecoration: 'underline' }}
                      onClick={() => onClickRequestNo(req.id)}
                    >
                      {req.requestNo}
                    </span>
                  ) : req.requestNo}
                </td>
                <td style={{ ...tdStyle, fontFamily: 'monospace', color: '#087CB6' }}>{req.qrLabel}</td>
                <td style={tdStyle}>{req.itemName}</td>
                <td style={tdStyle}>{req.maker}</td>
                <td style={tdStyle}>{req.applicantDepartment}</td>
                <td style={tdStyle}>{req.applicantName}</td>
                <td style={{ ...tdStyle, fontSize: '12px' }} className="tabular-nums border border-stroke-input">{req.applicantContact}</td>
                <td style={tdStyle}>{req.vendorName || '-'}</td>
                <td style={tdStyle}>{req.vendorPerson || '-'}</td>
                <td style={{ ...tdStyle, fontSize: '12px' }} className="tabular-nums border border-stroke-input">{req.vendorContact || '-'}</td>
                <td style={{ ...tdStyle, textAlign: 'center' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                    {getStatusBadge(req.status)}
                    {req.alternativeUnreturned && (
                      <span style={{
                        padding: '1px 6px',
                        borderRadius: '8px',
                        fontSize: '10px',
                        fontWeight: 'bold',
                        background: '#FDF1E5',
                        color: '#DA0000',
                        border: '1px solid #FDF1E5',
                        whiteSpace: 'nowrap',
                      }}>
                        代替機未返却
                      </span>
                    )}
                  </div>
                </td>
                <td style={{ ...tdStyle, verticalAlign: 'top' }}>
                  {deadlineMapping && req[deadlineMapping.field] ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <span style={{ fontSize: '11px', color: '#8A8A8A', whiteSpace: 'nowrap' }}>
                        {deadlineMapping.label}
                      </span>
                      <span style={{ fontSize: '12px', color: '#4A4A4A' }} className="tabular-nums">
                        {req[deadlineMapping.field]}
                      </span>
                    </div>
                  ) : (
                    <span style={{ color: '#8A8A8A', fontSize: '12px' }}>-</span>
                  )}
                </td>
                <td style={{ ...tdStyle, textAlign: 'center', verticalAlign: 'top' }}>
                  {getActionButtons(req)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {repairRequests.length === 0 && (
        <EmptyState
          title="該当する修理依頼がありません"
          description="検索条件を変更するか、フィルターを見直してください"
        />
      )}
    </div>
  );
};
