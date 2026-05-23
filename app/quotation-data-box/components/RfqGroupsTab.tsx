import React, { useMemo } from 'react';
import { RfqGroup, RfqGroupStatus } from '@/lib/types';

interface RfqGroupsTabProps {
  rfqGroups: RfqGroup[];
  onSendRfq?: (rfqGroupId: number) => void;
  onRegisterQuotation: (rfqGroupId: number) => void;
  onRegisterOrder: (rfqGroupId: number) => void;
  onRegisterInspection: (rfqGroupId: number) => void;
  onRegisterAssetProvisional: (rfqGroupId: number) => void;
  onRegisterAsset: (rfqGroupId: number) => void;
  onDelete?: (rfqGroupId: number) => void;
  onUpdateDeadline: (rfqGroupId: number, field: string, value: string | undefined) => void;
  // 廃棄・移設ワークフロー用
  onApprove?: (rfqGroupId: number) => void;
  onReject?: (rfqGroupId: number) => void;
  onCompleteDisposal?: (rfqGroupId: number) => void;
  onCompleteTransfer?: (rfqGroupId: number) => void;
}

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

// ステータス別のバッジ色
const STATUS_BADGE_COLORS: Record<RfqGroupStatus, string> = {
  '見積依頼': '#8A8A8A',
  '見積依頼済': '#087CB6',
  '見積DB登録済': '#4A4A4A',
  '見積登録依頼中': '#4A4A4A',
  '発注用見積依頼済': '#4A4A4A',
  '発注見積登録済': '#4A4A4A',
  '発注済': '#4A4A4A',
  '納期確定': '#008C1D',
  '検収済': '#4A4A4A',
  '完了': '#8A8A8A',
  '申請を見送る': '#DA0000',
  // 廃棄ワークフロー
  '廃棄承認待ち': '#4A4A4A',
  '廃棄承認済み': '#008C1D',
  '廃棄完了': '#4A4A4A',
  // 移設ワークフロー
  '移動承認待ち': '#4A4A4A',
  '移動承認済み': '#008C1D',
  '移動完了': '#4A4A4A',
};

// ステータスに紐づく期限フィールド（そのステータスに入った時に設定済みのもの、読み取り専用）
interface DeadlineMapping {
  label: string;
  field: 'rfqDeadline' | 'orderDeadline' | 'registrationDeadline' | 'deliveryDeadline' | 'deliveryDate' | 'inspectionDate' | 'rejectionDate' | 'approvalDate' | 'completionDate';
}

const STATUS_DEADLINE_MAP: Partial<Record<RfqGroupStatus, DeadlineMapping>> = {
  '見積依頼済': { label: '見積提出期限', field: 'rfqDeadline' },
  '見積DB登録済': { label: '発注期限', field: 'orderDeadline' },
  '見積登録依頼中': { label: '登録期限', field: 'registrationDeadline' },
  '発注用見積依頼済': { label: '見積提出期限', field: 'rfqDeadline' },
  '発注済': { label: '納入期限', field: 'deliveryDeadline' },
  '納期確定': { label: '納入年月日', field: 'deliveryDate' },
  '検収済': { label: '検収年月日', field: 'inspectionDate' },
  '申請を見送る': { label: '却下日', field: 'rejectionDate' },
  // 廃棄・移設
  '廃棄承認済み': { label: '承認日', field: 'approvalDate' },
  '廃棄完了': { label: '完了日', field: 'completionDate' },
  '移動承認済み': { label: '承認日', field: 'approvalDate' },
  '移動完了': { label: '完了日', field: 'completionDate' },
};

// グルーピング色（同一rfqNoが複数ある場合の左ボーダー）
const GROUP_BORDER_COLORS = ['#087CB6', '#4A4A4A', '#008C1D', '#4A4A4A', '#DA0000', '#4A4A4A'];

export const RfqGroupsTab: React.FC<RfqGroupsTabProps> = ({
  rfqGroups,
  onSendRfq,
  onRegisterQuotation,
  onRegisterOrder,
  onRegisterInspection,
  onRegisterAssetProvisional,
  onRegisterAsset,
  onDelete,
  onUpdateDeadline,
  onApprove,
  onReject,
  onCompleteDisposal,
  onCompleteTransfer,
}) => {
  // 同一rfqNoのカウントと色マッピング
  const rfqNoCountMap = useMemo(() => {
    const countMap: Record<string, number> = {};
    rfqGroups.forEach(g => {
      countMap[g.rfqNo] = (countMap[g.rfqNo] || 0) + 1;
    });
    return countMap;
  }, [rfqGroups]);

  const rfqNoColorMap = useMemo(() => {
    const colorMap: Record<string, string> = {};
    let colorIndex = 0;
    const seen = new Set<string>();
    rfqGroups.forEach(g => {
      if (!seen.has(g.rfqNo) && rfqNoCountMap[g.rfqNo] > 1) {
        colorMap[g.rfqNo] = GROUP_BORDER_COLORS[colorIndex % GROUP_BORDER_COLORS.length];
        colorIndex++;
        seen.add(g.rfqNo);
      }
    });
    return colorMap;
  }, [rfqGroups, rfqNoCountMap]);

  // 同一rfqNoが隣接するようにソート
  const sortedGroups = useMemo(() => {
    const grouped: Record<string, RfqGroup[]> = {};
    rfqGroups.forEach(g => {
      if (!grouped[g.rfqNo]) grouped[g.rfqNo] = [];
      grouped[g.rfqNo].push(g);
    });
    // 各グループ内はid順にソート
    Object.values(grouped).forEach(arr => arr.sort((a, b) => a.id - b.id));
    // rfqGroups内の出現順を維持し、同一rfqNoをまとめる
    const result: RfqGroup[] = [];
    const added = new Set<string>();
    rfqGroups.forEach(g => {
      if (!added.has(g.rfqNo)) {
        result.push(...grouped[g.rfqNo]);
        added.add(g.rfqNo);
      }
    });
    return result;
  }, [rfqGroups]);
  const getStatusBadge = (status: RfqGroupStatus) => {
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

  // 次のステップのActionボタンを返す
  const getActionButtons = (group: RfqGroup) => {
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

    switch (group.status) {
      // 見積依頼 → 見積依頼（送信） → 見積依頼済へ
      case '見積依頼':
        buttons.push(
          <button key="rfq" onClick={() => onSendRfq?.(group.id)} style={{ ...btnBase, background: '#087CB6' }}>
            見積依頼
          </button>
        );
        break;
      // 見積依頼済 → 見積登録
      case '見積依頼済':
        buttons.push(
          <button key="quote" onClick={() => onRegisterQuotation(group.id)} style={{ ...btnBase, background: '#087CB6' }}>
            見積登録
          </button>
        );
        break;
      // 見積DB登録済 → 削除
      case '見積DB登録済':
        if (onDelete) {
          buttons.push(
            <button key="delete" onClick={() => onDelete(group.id)} style={{ ...btnBase, background: '#DA0000' }}>
              削除
            </button>
          );
        }
        break;
      // ②発注見積依頼
      case '見積登録依頼中':
        // SHIP依頼済のため操作なし
        break;
      case '発注用見積依頼済':
        buttons.push(
          <button key="order-rfq-reg" onClick={() => onRegisterQuotation(group.id)} style={{ ...btnBase, background: '#4A4A4A' }}>
            発注見積登録
          </button>
        );
        break;
      // ③発注登録
      case '発注見積登録済':
        buttons.push(
          <button key="order" onClick={() => onRegisterOrder(group.id)} style={{ ...btnBase, background: '#4A4A4A' }}>
            発注登録
          </button>
        );
        break;
      // ④納品日登録
      case '発注済':
        buttons.push(
          <button key="delivery" onClick={() => onRegisterInspection(group.id)} style={{ ...btnBase, background: '#008C1D' }}>
            納品日登録
          </button>
        );
        break;
      // ⑤検収登録
      case '納期確定':
        buttons.push(
          <button key="inspection" onClick={() => onRegisterAssetProvisional(group.id)} style={{ ...btnBase, background: '#4A4A4A' }}>
            検収登録
          </button>
        );
        break;
      // ⑥資産登録
      case '検収済':
        buttons.push(
          <button key="asset" onClick={() => onRegisterAsset(group.id)} style={{ ...btnBase, background: '#4A4A4A' }}>
            資産登録
          </button>
        );
        break;
      // 完了・申請を見送る → 操作なし
      case '完了':
      case '申請を見送る':
        break;

      // 廃棄ワークフロー
      case '廃棄承認待ち':
        if (onApprove) {
          buttons.push(
            <button key="approve" onClick={() => onApprove(group.id)} style={{ ...btnBase, background: '#008C1D' }}>
              承認
            </button>
          );
        }
        if (onReject) {
          buttons.push(
            <button key="reject" onClick={() => onReject(group.id)} style={{ ...btnBase, background: '#DA0000' }}>
              却下
            </button>
          );
        }
        break;
      case '廃棄承認済み':
        if (onCompleteDisposal) {
          buttons.push(
            <button key="complete-disposal" onClick={() => onCompleteDisposal(group.id)} style={{ ...btnBase, background: '#4A4A4A' }}>
              廃棄完了
            </button>
          );
        }
        break;
      case '廃棄完了':
        break;

      // 移設ワークフロー
      case '移動承認待ち':
        if (onApprove) {
          buttons.push(
            <button key="approve" onClick={() => onApprove(group.id)} style={{ ...btnBase, background: '#008C1D' }}>
              承認
            </button>
          );
        }
        if (onReject) {
          buttons.push(
            <button key="reject" onClick={() => onReject(group.id)} style={{ ...btnBase, background: '#DA0000' }}>
              却下
            </button>
          );
        }
        break;
      case '移動承認済み':
        if (onCompleteTransfer) {
          buttons.push(
            <button key="complete-transfer" onClick={() => onCompleteTransfer(group.id)} style={{ ...btnBase, background: '#4A4A4A' }}>
              移動完了
            </button>
          );
        }
        break;
      case '移動完了':
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
          {/* グループヘッダー行 (Figma 304:37602: 薄灰 + 黒文字) */}
          <tr style={{ background: '#F1F1F1', color: '#4A4A4A' }}>
            <th rowSpan={2} style={{ ...thGroupStyle, textAlign: 'left' }}>見積（発注）依頼No,</th>
            <th rowSpan={2} style={{ ...thGroupStyle, textAlign: 'left' }}>見積（発注）グループ名称</th>
            <th colSpan={3} style={{ ...thGroupStyle, textAlign: 'center' }}>業者情報</th>
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
          {sortedGroups.map((group, index) => {
            const deadlineMapping = STATUS_DEADLINE_MAP[group.status];
            const groupColor = rfqNoColorMap[group.rfqNo];
            const hasMultiple = rfqNoCountMap[group.rfqNo] > 1;
            return (
              <tr key={group.id} style={{ background: index % 2 === 0 ? 'white' : '#FAFAFA', verticalAlign: 'top' }}>
                <td style={{
                  ...tdStyle,
                  fontFamily: 'monospace',
                  fontWeight: 600,
                  ...(hasMultiple && groupColor ? {
                    borderLeft: `4px solid ${groupColor}`,
                  } : {}),
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {group.rfqNo}
                    {hasMultiple && (
                      <span style={{
                        background: groupColor || '#8A8A8A',
                        color: 'white',
                        padding: '1px 6px',
                        borderRadius: '8px',
                        fontSize: '10px',
                        fontWeight: 'bold',
                        fontFamily: 'sans-serif',
                      }}>
                        {rfqNoCountMap[group.rfqNo]}社
                      </span>
                    )}
                  </div>
                </td>
                <td style={tdStyle}>{group.groupName}</td>
                <td style={tdStyle}>{group.vendorName || '-'}</td>
                <td style={tdStyle}>{group.personInCharge || '-'}</td>
                <td style={tdStyle}>{group.tel || '-'}</td>
                <td style={{ ...tdStyle, textAlign: 'center' }}>
                  {getStatusBadge(group.status)}
                </td>
                <td style={{ ...tdStyle, verticalAlign: 'top' }}>
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
                <td style={{ ...tdStyle, textAlign: 'center', verticalAlign: 'top' }}>
                  {getActionButtons(group)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {rfqGroups.length === 0 && (
        <div style={{ padding: '40px', textAlign: 'center', color: '#8A8A8A' }}>
          該当する見積依頼グループがありません
        </div>
      )}
    </div>
  );
};
