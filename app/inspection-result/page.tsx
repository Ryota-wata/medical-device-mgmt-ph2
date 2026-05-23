'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect, Suspense } from 'react';
import { AlertTriangle } from 'lucide-react';
import { useResponsive } from '@/lib/hooks/useResponsive';
import { useInspectionStore } from '@/lib/stores';

interface InspectionResultData {
  // 点検元情報
  source: 'daily' | 'periodic';
  taskId?: string;
  // 機器情報
  qrCode: string;
  largeClass: string;
  mediumClass: string;
  item: string;
  maker: string;
  model: string;
  // 点検情報
  inspectionType: '日常点検' | '定期点検';
  usageTiming?: '使用前' | '使用中' | '使用後';
  menuName: string;
  inspectorName: string;
  inspectionDate: string;
  // 結果
  itemResults: {
    itemName: string;
    content: string;
    result: string;
    unit?: string;
  }[];
  remarks: string;
  overallResult: '合格' | '再点検' | '修理申請';
}

function InspectionResultContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isMobile, isTablet } = useResponsive();
  const { updateTask, deleteTask, getTaskById, getMenuById } = useInspectionStore();

  const [resultData, setResultData] = useState<InspectionResultData | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    // sessionStorageから点検結果を取得
    const storedResult = sessionStorage.getItem('inspectionResult');
    if (storedResult) {
      setResultData(JSON.parse(storedResult));
    }
  }, []);

  const handleExportReport = async () => {
    setIsExporting(true);
    // TODO: 実際のPDF生成処理
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setIsExporting(false);
    alert('点検結果報告書を出力しました');
  };

  const handleNextInspection = () => {
    // sessionStorageをクリア
    sessionStorage.removeItem('inspectionResult');

    if (resultData?.source === 'daily') {
      // 日常点検: QRスキャン画面に戻る
      router.push('/daily-inspection');
    } else {
      // 定期点検: 点検管理一覧に戻る
      router.push('/quotation-data-box/inspection-requests');
    }
  };

  const handleComplete = () => {
    if (!resultData) return;

    // 定期点検の場合、結果に応じてタスクを処理
    if (resultData.source === 'periodic' && resultData.taskId) {
      const task = getTaskById(resultData.taskId);

      switch (resultData.overallResult) {
        case '合格':
          // 合格: 点検周期に基づき次回点検予定日とステータスを更新（タスクは残る）
          if (task) {
            // 点検メニューから周期を取得（デフォルト1ヶ月）
            const menu = task.periodicMenuIds.length > 0
              ? getMenuById(task.periodicMenuIds[0])
              : null;
            const cycleMonths = menu?.cycleMonths || 1;

            // 次回点検予定日を計算
            const nextDate = new Date();
            nextDate.setMonth(nextDate.getMonth() + cycleMonths);
            const nextInspectionDate = nextDate.toISOString().split('T')[0];

            // ステータスを計算
            const diffDays = Math.ceil((nextDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
            let newStatus: string = '点検2ヶ月前';
            if (diffDays < 0) newStatus = '点検月超過';
            else if (diffDays <= 7) newStatus = '点検週';
            else if (diffDays <= 30) newStatus = '点検月';
            else { const m = Math.ceil(diffDays / 30); newStatus = `点検${m}ヶ月前`; }

            updateTask(resultData.taskId, {
              lastInspectionDate: resultData.inspectionDate,
              nextInspectionDate: nextInspectionDate,
              status: newStatus,
              completedCount: task.completedCount + 1,
            });
          }
          break;
        case '再点検':
          // 再点検: ステータスを「再点検」に更新（タスクは残る）
          updateTask(resultData.taskId, { status: '再点検' });
          break;
        case '修理申請':
          // 修理申請: 点検周期に基づき次回点検予定日とステータスを更新し、修理申請画面に遷移
          if (task) {
            // 点検メニューから周期を取得（デフォルト1ヶ月）
            const menu = task.periodicMenuIds.length > 0
              ? getMenuById(task.periodicMenuIds[0])
              : null;
            const cycleMonths = menu?.cycleMonths || 1;

            // 次回点検予定日を計算
            const nextDate = new Date();
            nextDate.setMonth(nextDate.getMonth() + cycleMonths);
            const nextInspectionDate = nextDate.toISOString().split('T')[0];

            // ステータスを計算
            const diffDays = Math.ceil((nextDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
            let newStatus: string = '点検2ヶ月前';
            if (diffDays < 0) newStatus = '点検月超過';
            else if (diffDays <= 7) newStatus = '点検週';
            else if (diffDays <= 30) newStatus = '点検月';
            else { const m = Math.ceil(diffDays / 30); newStatus = `点検${m}ヶ月前`; }

            updateTask(resultData.taskId, {
              lastInspectionDate: resultData.inspectionDate,
              nextInspectionDate: nextInspectionDate,
              status: newStatus,
              completedCount: task.completedCount + 1,
            });
          }
          // 修理申請用のデータをsessionStorageに保存
          sessionStorage.setItem('repairRequestData', JSON.stringify({
            qrCode: resultData.qrCode,
            largeClass: resultData.largeClass,
            mediumClass: resultData.mediumClass,
            item: resultData.item,
            maker: resultData.maker,
            model: resultData.model,
            inspectionRemarks: resultData.remarks,
            inspectionDate: resultData.inspectionDate,
            inspectorName: resultData.inspectorName,
          }));
          sessionStorage.removeItem('inspectionResult');
          router.push('/repair-request');
          return;
      }
    }

    // 日常点検で修理申請の場合
    if (resultData.source === 'daily' && resultData.overallResult === '修理申請') {
      // 修理申請用のデータをsessionStorageに保存
      sessionStorage.setItem('repairRequestData', JSON.stringify({
        qrCode: resultData.qrCode,
        largeClass: resultData.largeClass,
        mediumClass: resultData.mediumClass,
        item: resultData.item,
        maker: resultData.maker,
        model: resultData.model,
        inspectionRemarks: resultData.remarks,
        inspectionDate: resultData.inspectionDate,
        inspectorName: resultData.inspectorName,
      }));
      sessionStorage.removeItem('inspectionResult');
      router.push('/repair-request');
      return;
    }

    // sessionStorageをクリア
    sessionStorage.removeItem('inspectionResult');

    if (resultData.source === 'daily') {
      // 日常点検: オフライン準備画面に戻る
      router.push('/inspection-prep');
    } else {
      // 定期点検: 点検管理一覧に戻る
      router.push('/quotation-data-box/inspection-requests');
    }
  };

  const getOverallResultStyle = (result: string) => {
    switch (result) {
      case '合格':
        return { backgroundColor: '#EBF5EE', color: '#008C1D', borderColor: '#008C1D' };
      case '再点検':
        return { backgroundColor: '#FDF1E5', color: '#4A4A4A', borderColor: '#4A4A4A' };
      case '修理申請':
        return { backgroundColor: '#FDF1E5', color: '#DA0000', borderColor: '#DA0000' };
      default:
        return { backgroundColor: '#FAFAFA', color: '#8A8A8A', borderColor: '#E1E1E1' };
    }
  };

  const getOverallResultIcon = (result: string) => {
    switch (result) {
      case '合格':
        return '✓';
      case '再点検':
        return '⟳';
      case '修理申請':
        return '⚠';
      default:
        return '?';
    }
  };

  if (!resultData) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100dvh',
        background: '#FAFAFA',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '20px'
      }}>
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          padding: '32px',
          textAlign: 'center',
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
        }}>
          <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'center', color: '#8A8A8A' }}>
            <AlertTriangle size={48} strokeWidth={1.5} />
          </div>
          <h2 style={{ fontSize: '18px', color: '#4A4A4A', marginBottom: '8px' }}>点検結果がありません</h2>
          <p style={{ fontSize: '14px', color: '#8A8A8A', marginBottom: '24px' }}>
            点検を実施してからこの画面にアクセスしてください。
          </p>
          <button
            onClick={() => router.push('/main')}
            style={{
              backgroundColor: 'white',
              color: '#4A4A4A',
              border: '1px solid #E1E1E1',
              borderRadius: '6px',
              padding: '12px 24px',
              fontSize: '14px',
              fontWeight: 500,
              cursor: 'pointer'
            }}
          >
            メイン画面に戻る
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100dvh', background: '#FAFAFA' }}>
      {/* Header (Figma 通り: 緑塗りフラット) */}
      <header style={{
        background: '#008C1D',
        color: 'white',
        padding: isMobile ? '16px' : '20px 24px',
        textAlign: 'center'
      }}>
        <h1 style={{
          fontSize: isMobile ? '18px' : '22px',
          fontWeight: 600,
          margin: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px'
        }}>
          <span style={{ fontSize: isMobile ? '20px' : '24px' }}>✓</span>
          点検完了
        </h1>
      </header>

      {/* Main Content */}
      <main style={{
        flex: 1,
        padding: isMobile ? '16px 12px' : isTablet ? '24px 20px' : '32px 40px',
        overflowY: 'auto',
        paddingBottom: '160px'
      }}>
        <div style={{
          maxWidth: '700px',
          margin: '0 auto'
        }}>
          {/* 総合評価 */}
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            padding: isMobile ? '20px 16px' : '28px 32px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            marginBottom: '16px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '14px', color: '#8A8A8A', marginBottom: '12px' }}>総合評価</div>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '12px',
              padding: '16px 32px',
              borderRadius: '12px',
              border: `2px solid`,
              ...getOverallResultStyle(resultData.overallResult)
            }}>
              <span style={{ fontSize: '32px', fontWeight: 700 }}>
                {getOverallResultIcon(resultData.overallResult)}
              </span>
              <span style={{ fontSize: '24px', fontWeight: 700 }}>
                {resultData.overallResult}
              </span>
            </div>
          </div>

          {/* 機器情報 */}
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            padding: isMobile ? '16px' : '20px 24px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            marginBottom: '16px'
          }}>
            <h2 style={{
              fontSize: '15px',
              fontWeight: 600,
              color: '#4A4A4A',
              marginBottom: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <span>🏥</span> 点検対象機器
            </h2>
            <div style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr 1fr' : '1fr 1fr 1fr',
              gap: '8px'
            }}>
              <InfoItem label="QRコード" value={resultData.qrCode} tabular />
              <InfoItem label="大分類" value={resultData.largeClass} />
              <InfoItem label="中分類" value={resultData.mediumClass} />
              <InfoItem label="品目" value={resultData.item} />
              <InfoItem label="メーカー" value={resultData.maker} />
              <InfoItem label="型式" value={resultData.model} />
            </div>
          </div>

          {/* 点検情報 */}
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            padding: isMobile ? '16px' : '20px 24px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            marginBottom: '16px'
          }}>
            <h2 style={{
              fontSize: '15px',
              fontWeight: 600,
              color: '#4A4A4A',
              marginBottom: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <span>📋</span> 点検情報
            </h2>
            <div style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr 1fr' : '1fr 1fr 1fr 1fr',
              gap: '8px'
            }}>
              <InfoItem label="点検種別" value={resultData.inspectionType} />
              {resultData.usageTiming && (
                <InfoItem label="タイミング" value={resultData.usageTiming} />
              )}
              <InfoItem label="点検メニュー" value={resultData.menuName} />
              <InfoItem label="実施者" value={resultData.inspectorName} />
              <InfoItem label="実施日" value={resultData.inspectionDate} />
            </div>
          </div>

          {/* 点検項目結果 */}
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            padding: isMobile ? '16px' : '20px 24px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            marginBottom: '16px'
          }}>
            <h2 style={{
              fontSize: '15px',
              fontWeight: 600,
              color: '#4A4A4A',
              marginBottom: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <span>✅</span> 点検項目結果
            </h2>
            <div style={{ overflowX: 'auto' }}>
              <table style={{
                width: '100%',
                borderCollapse: 'collapse',
                fontSize: '13px',
                minWidth: '400px'
              }}>
                <thead>
                  <tr style={{ backgroundColor: '#FAFAFA' }}>
                    <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600, border: '2px solid #E1E1E1' }}>項目</th>
                    <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600, border: '2px solid #E1E1E1' }}>点検内容</th>
                    <th style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 600, border: '2px solid #E1E1E1', width: '80px' }}>評価</th>
                  </tr>
                </thead>
                <tbody>
                  {resultData.itemResults.map((item, index) => (
                    <tr key={index}>
                      <td style={{ padding: '10px 12px', border: '1px solid #E1E1E1' }}>{item.itemName}</td>
                      <td style={{ padding: '10px 12px', border: '1px solid #E1E1E1' }}>{item.content}</td>
                      <td style={{
                        padding: '10px 12px',
                        border: '1px solid #E1E1E1',
                        textAlign: 'center',
                        fontWeight: 600,
                        color: item.result === '○' ? '#008C1D' : item.result === '×' ? '#DA0000' : '#4A4A4A'
                      }}>
                        {item.unit ? `${item.result} ${item.unit}` : item.result}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* 備考 */}
          {resultData.remarks && (
            <div style={{
              backgroundColor: '#ffffff',
              borderRadius: '12px',
              padding: isMobile ? '16px' : '20px 24px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
              marginBottom: '16px'
            }}>
              <h2 style={{
                fontSize: '15px',
                fontWeight: 600,
                color: '#4A4A4A',
                marginBottom: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <span>📝</span> 備考
              </h2>
              <p style={{ fontSize: '14px', color: '#555', margin: 0, lineHeight: '1.6' }}>
                {resultData.remarks}
              </p>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#ffffff',
        borderTop: '1px solid #E1E1E1',
        padding: isMobile ? '16px' : '20px 24px',
        boxShadow: '0 -2px 8px rgba(0,0,0,0.08)'
      }}>
        <div style={{
          maxWidth: '700px',
          margin: '0 auto',
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row',
          gap: '12px',
          justifyContent: 'center'
        }}>
          <button
            onClick={handleExportReport}
            disabled={isExporting}
            style={{
              flex: isMobile ? 'none' : '1',
              maxWidth: isMobile ? 'none' : '200px',
              backgroundColor: '#008C1D',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              padding: '14px 24px',
              fontSize: '15px',
              fontWeight: 600,
              cursor: isExporting ? 'not-allowed' : 'pointer',
              opacity: isExporting ? 0.7 : 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              minHeight: '48px'
            }}
          >
            <span>📄</span>
            {isExporting ? '出力中...' : '報告書出力'}
          </button>

          {/* 日常点検のみ「次の点検へ」ボタンを表示 */}
          {resultData?.source === 'daily' && (
            <button
              onClick={handleNextInspection}
              style={{
                flex: isMobile ? 'none' : '1',
                maxWidth: isMobile ? 'none' : '200px',
                backgroundColor: '#008C1D',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                padding: '14px 24px',
                fontSize: '15px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                minHeight: '48px'
              }}
            >
              <span>→</span>
              次の点検へ
            </button>
          )}

          <button
            onClick={handleComplete}
            style={{
              flex: isMobile ? 'none' : '1',
              maxWidth: isMobile ? 'none' : '200px',
              backgroundColor: resultData?.overallResult === '修理申請' ? '#DA0000' : '#4A4A4A',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              padding: '14px 24px',
              fontSize: '15px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              minHeight: '48px'
            }}
          >
            <span>{resultData?.overallResult === '修理申請' ? '🔧' : '✓'}</span>
            {resultData?.overallResult === '修理申請' ? '修理申請へ' : '完了'}
          </button>
        </div>
      </footer>
    </div>
  );
}

function InfoItem({ label, value, tabular }: { label: string; value: string; tabular?: boolean }) {
  return (
    <div style={{
      backgroundColor: '#FAFAFA',
      borderRadius: '6px',
      padding: '8px 12px'
    }}>
      <div style={{ fontSize: '11px', color: '#888', marginBottom: '2px' }}>{label}</div>
      <div style={{
        fontSize: '13px',
        color: '#4A4A4A',
        fontWeight: 500,
        fontVariantNumeric: tabular ? 'tabular-nums' : 'normal',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap'
      }}>
        {value || '-'}
      </div>
    </div>
  );
}

export default function InspectionResultPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-dvh text-sm text-content-sub">読み込み中...</div>}>
      <InspectionResultContent />
    </Suspense>
  );
}
