import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { OCRResult, QuotationItemType, AIJudgmentResult, ConfirmedStateMap, ConfirmedAssetInfo, OCRResultItem } from '@/lib/types/quotation';

// 登録区分の色設定
const ITEM_TYPE_COLORS: Record<QuotationItemType, { bg: string; text: string }> = {
  'A_表紙明細': { bg: '#EBF5EE', text: '#4A4A4A' },
  'B_明細代表': { bg: '#FAFAFA', text: '#4A4A4A' },
  'C_個体管理品目': { bg: '#EBF5EE', text: '#146E2E' },
  'D_付属品': { bg: '#FDF1E5', text: '#4A4A4A' },
  'E_その他役務': { bg: '#FDF1E5', text: '#4A4A4A' },
  'F_値引き': { bg: '#FDF1E5', text: '#DA0000' },
};

interface Step4IndividualItemLinkingProps {
  ocrResult: OCRResult;
  confirmedState: ConfirmedStateMap;
  onConfirmedStateChange: (state: ConfirmedStateMap) => void;
  onBack: () => void;
  onNext: () => void;
}

export const Step4IndividualItemLinking: React.FC<Step4IndividualItemLinkingProps> = ({
  ocrResult,
  confirmedState,
  onConfirmedStateChange,
  onBack,
  onNext,
}) => {
  // C_個体管理品目のみをフィルタ
  const individualItems = useMemo(() => {
    return ocrResult.items
      .map((item, index) => ({ item, index }))
      .filter(({ item }) => item.itemType === 'C_個体管理品目');
  }, [ocrResult.items]);

  // 選択中の行（資産マスタ選択待ち）
  const [selectingRow, setSelectingRow] = useState<number | null>(null);

  // 別ウィンドウからの資産マスタ選択を受信
  const handleAssetMasterMessage = useCallback((event: MessageEvent) => {
    if (event.origin !== window.location.origin) return;

    if (event.data?.type === 'ASSET_MASTER_SELECTED' && selectingRow !== null) {
      const assetData: ConfirmedAssetInfo = event.data.data;
      const key = `${selectingRow}`;
      onConfirmedStateChange({
        ...confirmedState,
        [key]: {
          status: 'asset_master_selected',
          assetInfo: assetData,
        },
      });
      setSelectingRow(null);
    }
  }, [selectingRow, confirmedState, onConfirmedStateChange]);

  useEffect(() => {
    window.addEventListener('message', handleAssetMasterMessage);
    return () => {
      window.removeEventListener('message', handleAssetMasterMessage);
    };
  }, [handleAssetMasterMessage]);

  // AI判定を確定する
  const handleConfirm = (ocrItemIndex: number, aiJudgment: AIJudgmentResult) => {
    const key = `${ocrItemIndex}`;
    onConfirmedStateChange({
      ...confirmedState,
      [key]: {
        status: 'ai_confirmed',
        assetInfo: {
          category: aiJudgment.category,
          majorCategory: aiJudgment.majorCategory,
          middleCategory: aiJudgment.middleCategory,
          assetName: aiJudgment.assetName,
          manufacturer: aiJudgment.manufacturer,
          model: aiJudgment.model,
        },
      },
    });
  };

  // 確定を解除する
  const handleUnconfirm = (ocrItemIndex: number) => {
    const key = `${ocrItemIndex}`;
    const newState = { ...confirmedState };
    delete newState[key];
    onConfirmedStateChange(newState);
  };

  // 資産マスタを別ウィンドウで開いて選択させる
  const handleOpenAssetMasterForSelection = (ocrItemIndex: number) => {
    setSelectingRow(ocrItemIndex);
    const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
    window.open(`${basePath}/ship-asset-master?mode=select`, '_blank', 'width=1200,height=800');
  };

  // 確定状態を取得
  const getConfirmedInfo = (ocrItemIndex: number) => {
    const key = `${ocrItemIndex}`;
    return confirmedState[key] || null;
  };

  // 確定済み件数
  const confirmedCount = useMemo(() => {
    return individualItems.filter(({ index }) => getConfirmedInfo(index) !== null).length;
  }, [individualItems, confirmedState]);

  return (
    <div>
      {/* 説明 */}
      <div style={{ marginBottom: '16px', padding: '14px', background: '#FAFAFA', borderRadius: '6px', border: '1px solid #8A8A8A' }}>
        <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#4A4A4A', marginBottom: '8px' }}>
          ② 個体管理品目のAI判定を実施し確認・修正を実施してください
        </div>
        <div style={{ fontSize: '12px', color: '#555', lineHeight: 1.6 }}>
          ・不適格な場合は資産Masterから選択が可能です<br />
          ・IDの登録により耐用年数、推奨使用年数、添付文書などの情報が登録できます
        </div>
      </div>

      {/* 進捗状況 */}
      <div style={{ marginBottom: '16px', display: 'flex', gap: '16px', alignItems: 'center' }}>
        <div style={{
          padding: '8px 16px',
          background: '#EBF5EE',
          border: '1px solid #008C1D',
          borderRadius: '4px',
          fontSize: '13px',
          fontWeight: 'bold',
          color: '#146E2E',
        }}>
          個体管理品目: {individualItems.length}件
        </div>
        <div style={{
          padding: '8px 16px',
          background: confirmedCount === individualItems.length ? '#EBF5EE' : '#FDF1E5',
          border: `1px solid ${confirmedCount === individualItems.length ? '#008C1D' : '#FDF1E5'}`,
          borderRadius: '4px',
          fontSize: '13px',
          fontWeight: 'bold',
          color: confirmedCount === individualItems.length ? '#146E2E' : '#4A4A4A',
        }}>
          紐付け済み: {confirmedCount}/{individualItems.length}件
        </div>
        <button
          onClick={() => {
            const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
            window.open(`${basePath}/ship-asset-master`, '_blank', 'width=1200,height=800');
          }}
          style={{
            padding: '8px 16px',
            background: '#4A4A4A',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '12px',
            fontWeight: 'bold',
          }}
        >
          資産Masterを開く
        </button>
      </div>

      {/* 明細テーブル */}
      <div style={{ marginBottom: '16px', border: '1px solid #E1E1E1', borderRadius: '6px', overflow: 'hidden' }}>
        <div style={{ maxHeight: '450px', overflow: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10px', minWidth: '1100px' }}>
            <thead style={{ position: 'sticky', top: 0, zIndex: 2 }}>
              {/* 2段ヘッダー */}
              <tr>
                <th colSpan={5} style={{
                  padding: '6px',
                  textAlign: 'center',
                  border: '2px solid #087CB6',
                  fontWeight: 'bold',
                  color: '#087CB6',
                  background: '#EBF5EE',
                  fontSize: '11px'
                }}>
                  元明細（原本情報）
                </th>
                <th style={{ padding: '6px', background: '#FAFAFA', width: '25px' }}>⇒</th>
                <th colSpan={6} style={{
                  padding: '6px',
                  textAlign: 'center',
                  border: '2px solid #4A4A4A',
                  fontWeight: 'bold',
                  color: '#4A4A4A',
                  background: '#FAFAFA',
                  fontSize: '11px'
                }}>
                  個体品目のAI判定
                </th>
                <th style={{ padding: '6px', background: '#FAFAFA', width: '150px', fontSize: '11px' }}>操作</th>
              </tr>
              <tr style={{ background: '#FAFAFA' }}>
                <th style={{ padding: '5px', textAlign: 'center', border: '1px solid #E1E1E1', width: '30px', fontSize: '9px' }}>No</th>
                <th style={{ padding: '5px', textAlign: 'left', border: '1px solid #E1E1E1', fontSize: '9px' }}>品名</th>
                <th style={{ padding: '5px', textAlign: 'left', border: '1px solid #E1E1E1', width: '80px', fontSize: '9px' }}>メーカー</th>
                <th style={{ padding: '5px', textAlign: 'left', border: '1px solid #E1E1E1', width: '80px', fontSize: '9px' }}>型式</th>
                <th style={{ padding: '5px', textAlign: 'center', border: '1px solid #E1E1E1', width: '40px', fontSize: '9px' }}>数量</th>
                <th style={{ padding: '5px', background: '#FAFAFA' }}></th>
                <th style={{ padding: '5px', textAlign: 'left', border: '1px solid #E1E1E1', width: '70px', fontSize: '9px', background: '#FAFAFA' }}>category</th>
                <th style={{ padding: '5px', textAlign: 'left', border: '1px solid #E1E1E1', width: '90px', fontSize: '9px', background: '#FAFAFA' }}>大分類</th>
                <th style={{ padding: '5px', textAlign: 'left', border: '1px solid #E1E1E1', width: '80px', fontSize: '9px', background: '#FAFAFA' }}>中分類</th>
                <th style={{ padding: '5px', textAlign: 'left', border: '1px solid #E1E1E1', fontSize: '9px', background: '#FAFAFA' }}>個体管理品目</th>
                <th style={{ padding: '5px', textAlign: 'left', border: '1px solid #E1E1E1', width: '70px', fontSize: '9px', background: '#FAFAFA' }}>メーカー</th>
                <th style={{ padding: '5px', textAlign: 'left', border: '1px solid #E1E1E1', width: '70px', fontSize: '9px', background: '#FAFAFA' }}>型式</th>
                <th style={{ padding: '5px', border: '1px solid #E1E1E1' }}></th>
              </tr>
            </thead>
            <tbody>
              {individualItems.map(({ item, index }) => {
                const confirmedInfo = getConfirmedInfo(index);
                const rowIsConfirmed = confirmedInfo !== null;
                const isSelectingThisRow = selectingRow === index;
                const aiJudgment = item.aiJudgments[0] || null;
                const displayData = confirmedInfo?.assetInfo || aiJudgment;

                return (
                  <tr key={index} style={{
                    borderBottom: '1px solid #E1E1E1',
                    background: isSelectingThisRow ? '#FDF1E5' : rowIsConfirmed ? '#EBF5EE' : 'transparent',
                  }}>
                    <td style={{ padding: '5px', textAlign: 'center' }}>{item.rowNo || '-'}</td>
                    <td style={{ padding: '5px', fontWeight: 'bold' }} title={item.itemName}>{item.itemName}</td>
                    <td style={{ padding: '5px', color: '#555' }}>{item.manufacturer || '-'}</td>
                    <td style={{ padding: '5px', color: '#555' }}>{item.model || '-'}</td>
                    <td style={{ padding: '5px', textAlign: 'center' }}>{item.quantity}</td>
                    <td style={{ padding: '5px', textAlign: 'center', background: '#FAFAFA' }}>⇒</td>
                    <td style={{ padding: '5px', background: rowIsConfirmed ? '#EBF5EE' : '#FAFAFA', fontSize: '9px' }}>
                      {displayData && 'category' in displayData ? displayData.category : '-'}
                    </td>
                    <td style={{ padding: '5px', background: rowIsConfirmed ? '#EBF5EE' : '#FAFAFA', fontSize: '9px' }}>
                      {displayData && 'majorCategory' in displayData ? displayData.majorCategory : '-'}
                    </td>
                    <td style={{ padding: '5px', background: rowIsConfirmed ? '#EBF5EE' : '#FAFAFA', fontSize: '9px' }}>
                      {displayData && 'middleCategory' in displayData ? displayData.middleCategory : '-'}
                    </td>
                    <td style={{ padding: '5px', background: rowIsConfirmed ? '#EBF5EE' : '#FAFAFA', fontWeight: 'bold' }}>
                      {displayData?.assetName || '-'}
                    </td>
                    <td style={{ padding: '5px', background: rowIsConfirmed ? '#EBF5EE' : '#FAFAFA', color: '#555', fontSize: '9px' }}>
                      {displayData?.manufacturer || '-'}
                    </td>
                    <td style={{ padding: '5px', background: rowIsConfirmed ? '#EBF5EE' : '#FAFAFA', color: '#555', fontSize: '9px' }}>
                      {displayData?.model || '-'}
                    </td>
                    <td style={{ padding: '5px', textAlign: 'center' }}>
                      {rowIsConfirmed ? (
                        <div style={{ display: 'flex', gap: '4px', justifyContent: 'center', alignItems: 'center' }}>
                          <span style={{
                            display: 'inline-block',
                            padding: '3px 6px',
                            background: confirmedInfo?.status === 'asset_master_selected' ? '#4A4A4A' : '#008C1D',
                            color: 'white',
                            borderRadius: '3px',
                            fontSize: '8px',
                            fontWeight: 'bold',
                          }}>
                            {confirmedInfo?.status === 'asset_master_selected' ? '紐付済' : 'AI適用'}
                          </span>
                          <button
                            onClick={() => handleUnconfirm(index)}
                            style={{
                              padding: '3px 5px',
                              background: '#DA0000',
                              color: 'white',
                              border: 'none',
                              borderRadius: '3px',
                              cursor: 'pointer',
                              fontSize: '8px',
                              fontWeight: 'bold',
                            }}
                          >
                            解除
                          </button>
                        </div>
                      ) : isSelectingThisRow ? (
                        <span style={{
                          display: 'inline-block',
                          padding: '3px 8px',
                          background: '#4A4A4A',
                          color: 'white',
                          borderRadius: '3px',
                          fontSize: '8px',
                          fontWeight: 'bold',
                        }}>
                          選択中...
                        </span>
                      ) : (
                        <div style={{ display: 'flex', gap: '3px', justifyContent: 'center' }}>
                          {aiJudgment && (
                            <button
                              onClick={() => handleConfirm(index, aiJudgment)}
                              style={{
                                padding: '3px 5px',
                                background: '#4A4A4A',
                                color: 'white',
                                border: 'none',
                                borderRadius: '3px',
                                cursor: 'pointer',
                                fontSize: '8px',
                                fontWeight: 'bold',
                              }}
                            >
                              AI適用
                            </button>
                          )}
                          <button
                            onClick={() => handleOpenAssetMasterForSelection(index)}
                            style={{
                              padding: '3px 5px',
                              background: '#4A4A4A',
                              color: 'white',
                              border: 'none',
                              borderRadius: '3px',
                              cursor: 'pointer',
                              fontSize: '8px',
                              fontWeight: 'bold',
                            }}
                          >
                            マスタ選択
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {individualItems.length === 0 && (
        <div style={{ marginBottom: '16px', padding: '20px', textAlign: 'center', background: '#FAFAFA', borderRadius: '6px', color: '#8A8A8A' }}>
          個体管理品目がありません。次のステップへ進んでください。
        </div>
      )}

      <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
        <button
          onClick={onBack}
          style={{
            padding: '10px 24px',
            background: '#8A8A8A',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 'bold'
          }}
        >
          戻る
        </button>
        <button
          onClick={onNext}
          style={{
            padding: '10px 24px',
            background: '#008C1D',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 'bold'
          }}
        >
          次へ（金額案分・登録確定）
        </button>
      </div>
    </div>
  );
};
