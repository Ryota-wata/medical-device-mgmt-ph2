'use client';

import { useRouter } from 'next/navigation';
import { useState, useRef, Suspense, useMemo, useEffect } from 'react';
import { useResponsive } from '@/lib/hooks/useResponsive';
import { InspectionTask } from '@/lib/types';
import { useInspectionStore, useAuthStore, useLendingStore } from '@/lib/stores';

// REQ-103: 評価項目の入力形式 3 パターン（定例0413 確定: マルバツ二択 / 単位付き数値 / フリーテキスト）
interface InspectionItemResult {
  itemName: string;
  content: string;
  result: '○' | '×' | string;
  unit?: string;
  evaluationType?: '合否' | '単位' | 'フリー入力';
}

const DEFAULT_ITEMS: InspectionItemResult[] = [
  { itemName: '清掃', content: '本体の清掃', result: '', evaluationType: '合否' },
  { itemName: '外装点検', content: 'ACインレット', result: '', evaluationType: '合否' },
  { itemName: '外装点検', content: 'スライダー', result: '', evaluationType: '合否' },
  { itemName: '性能点検', content: '閉塞圧測定', result: '', unit: 'kPa', evaluationType: '単位' },
  { itemName: '性能点検', content: '流量測定', result: '', unit: 'ml', evaluationType: '単位' },
];

type Step = 'qr-scan' | 'inspection' | 'confirm';

function PeriodicInspectionContent() {
  const router = useRouter();
  const { isMobile, isTablet } = useResponsive();
  const { menus, getMenuById, completeInspection, startInspection } = useInspectionStore();
  const { user } = useAuthStore();
  const lendingDevices = useLendingStore((s) => s.devices);
  const updateLendingDevice = useLendingStore((s) => s.updateDevice);
  const videoRef = useRef<HTMLVideoElement>(null);

  // タスク情報（sessionStorageから取得）
  const [task, setTask] = useState<InspectionTask | null>(null);

  // ステップ管理
  const [step, setStep] = useState<Step>('qr-scan');

  // QRスキャン状態
  const [qrCode, setQrCode] = useState('');
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isVerified, setIsVerified] = useState(false);

  // 点検実施状態
  const [inspectorName, setInspectorName] = useState('');
  const [itemResults, setItemResults] = useState<InspectionItemResult[]>(DEFAULT_ITEMS);
  const [remarks, setRemarks] = useState('');
  const [overallResult, setOverallResult] = useState<'合格' | '異常あり' | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  // sessionStorageからタスク情報を取得
  useEffect(() => {
    const stored = sessionStorage.getItem('periodicInspectionTask');
    if (stored) {
      const parsed = JSON.parse(stored) as InspectionTask;
      setTask(parsed);
    }
  }, []);

  // ログインユーザー名を自動取得
  useEffect(() => {
    if (user?.username) {
      setInspectorName(user.username);
    }
  }, [user]);

  // タスクに紐付く点検メニュー
  const selectedMenu = useMemo(() => {
    if (!task || task.periodicMenuIds.length === 0) return null;
    return getMenuById(task.periodicMenuIds[0]) || null;
  }, [task, getMenuById]);

  // メニュー変更時に点検項目を更新
  useEffect(() => {
    if (selectedMenu && selectedMenu.inspectionItems.length > 0) {
      setItemResults(
        selectedMenu.inspectionItems.map((item) => ({
          itemName: item.itemName,
          content: item.content,
          result: '',
          unit: item.evaluationType === '単位' ? item.unitValue : undefined,
        }))
      );
    } else {
      setItemResults(DEFAULT_ITEMS);
    }
  }, [selectedMenu]);

  // カメラ起動
  const handleStartCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsCameraActive(true);
      }
    } catch {
      alert('カメラの起動に失敗しました。カメラへのアクセスを許可してください。');
    }
  };

  // カメラ停止
  const handleStopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach((track) => track.stop());
      videoRef.current.srcObject = null;
      setIsCameraActive(false);
    }
  };

  // QRコード照合 → 点検実施へ
  const handleVerifyQR = () => {
    if (!task) {
      alert('タスク情報が読み込まれていません');
      return;
    }

    const inputQr = qrCode.trim();

    // 空欄の場合はそのまま進む（デモ用）
    if (!inputQr) {
      setIsVerified(true);
      handleStopCamera();
      setStep('inspection');
      return;
    }

    // QRコード照合
    if (inputQr === task.assetId) {
      setIsVerified(true);
      handleStopCamera();
      setStep('inspection');
    } else {
      alert(`QRコードが一致しません。\n期待: ${task.assetId}\n入力: ${inputQr}`);
    }
  };

  // 点検項目の結果変更
  const handleItemResultChange = (index: number, value: string) => {
    setItemResults((prev) => {
      const newResults = [...prev];
      newResults[index] = { ...newResults[index], result: value };
      return newResults;
    });
  };

  // 確認画面表示
  const handleShowConfirm = (result: '合格' | '異常あり') => {
    if (!inspectorName) {
      alert('実施者名を入力してください');
      return;
    }
    setOverallResult(result);
    setStep('confirm');
  };

  // 報告書出力
  const handleExportReport = async () => {
    setIsExporting(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setIsExporting(false);
    alert('点検結果報告書を出力しました');
  };

  // REQ-129: 貸出機器の場合の貸出ステータス更新
  // 判定基準: lendingStore に当該QRコードが存在 = 貸出機器（管理部署=ME系で貸出登録済）
  // 合格 → 貸出可 / 異常あり → 使用不可（4/30定例: 貸出機の異常時は「使用不可」共通）
  const updateLendingStatusFromInspection = (result: '合格' | '異常あり') => {
    if (!task?.assetId) return;
    const device = lendingDevices.find((d) => d.qrCode === task.assetId);
    if (!device) return;
    updateLendingDevice(device.id, {
      status: result === '合格' ? '貸出可' : '使用不可',
    });
  };

  // 完了
  const handleFinish = () => {
    if (!task) return;

    updateLendingStatusFromInspection('合格');

    // 点検実績を登録
    completeInspection(task.id, {
      taskId: task.id,
      assetId: task.assetId,
      menuId: selectedMenu?.id || '',
      plannedDate: task.nextInspectionDate,
      actualDate: new Date().toISOString().split('T')[0],
      result: '合格',
      staffName: inspectorName,
      resultDetails: itemResults.map((item) => ({
        itemId: item.itemName,
        itemName: item.itemName,
        result: item.result || '-',
        note: item.unit ? `${item.result} ${item.unit}` : undefined,
      })),
      memo: remarks || undefined,
    });

    sessionStorage.removeItem('periodicInspectionTask');
    alert('点検記録を登録しました');
    router.push('/quotation-data-box/inspection-requests');
  };

  // 修理申請へ
  const handleRepairRequest = () => {
    if (!task) return;
    updateLendingStatusFromInspection('異常あり');
    sessionStorage.setItem('repairRequestData', JSON.stringify({
      qrCode: task.assetId,
      largeClass: task.largeClass,
      mediumClass: task.mediumClass,
      item: task.assetName,
      maker: task.maker,
      model: task.model,
      inspectionRemarks: remarks,
      inspectionDate: new Date().toISOString().split('T')[0],
      inspectorName,
    }));
    sessionStorage.removeItem('periodicInspectionTask');
    router.push('/repair-request');
  };

  // 戻る
  const handleBack = () => {
    if (step === 'confirm') {
      setStep('inspection');
    } else if (step === 'inspection') {
      setStep('qr-scan');
      setIsVerified(false);
    } else {
      handleStopCamera();
      sessionStorage.removeItem('periodicInspectionTask');
      router.push('/quotation-data-box/inspection-requests');
    }
  };

  const today = new Date().toLocaleDateString('ja-JP', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\//g, '/');

  if (!task) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100dvh', background: '#FAFAFA' }}>
        <header style={{
          background: '#FFFFFF',
          borderBottom: '1px solid #E1E1E1',
          color: '#4A4A4A',
          padding: '12px 20px',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
        }}>
          <div style={{ width: 36, height: 36, background: '#008C1D', borderRadius: 6, color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, letterSpacing: 0.4 }}>SHIP</div>
          <h1 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>定期点検</h1>
        </header>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <p>タスク情報を読み込み中...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100dvh', background: '#FAFAFA' }}>
      {/* Header（Figma準拠: 白bg + 軽い罫線） */}
      <header style={{
        background: '#FFFFFF',
        borderBottom: '1px solid #E1E1E1',
        color: '#4A4A4A',
        padding: isMobile ? '10px 14px' : '12px 20px',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
      }}>
        <div style={{ width: isMobile ? 32 : 36, height: isMobile ? 32 : 36, background: '#008C1D', borderRadius: 6, color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, letterSpacing: 0.4 }}>SHIP</div>
        <h1 style={{ fontSize: isMobile ? 14 : 16, fontWeight: 700, margin: 0 }}>
          定期点検 <span style={{ color: '#8A8A8A', fontWeight: 500, marginLeft: 8, fontSize: isMobile ? 12 : 13 }}>{step === 'qr-scan' ? 'QRコード読み取り' : step === 'confirm' ? '確認' : '点検実施'}</span>
        </h1>
      </header>

      {/* Main Content */}
      <main style={{
        flex: 1,
        padding: isMobile ? '16px 12px 100px 12px' : isTablet ? '24px 20px 100px 20px' : '32px 40px 100px 40px',
        overflowY: 'auto'
      }}>
        {step === 'qr-scan' ? (
          /* QRスキャン画面 */
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: isMobile ? '8px' : '12px',
            padding: isMobile ? '16px' : isTablet ? '24px' : '32px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            maxWidth: '600px',
            margin: '0 auto'
          }}>
            {/* 対象機器情報 */}
            <div style={{
              backgroundColor: '#EBF5EE',
              border: '1px solid #EBF5EE',
              borderRadius: '8px',
              padding: '12px 16px',
              marginBottom: '20px',
              fontSize: '13px',
              color: '#4A4A4A',
            }}>
              <div style={{ fontWeight: 600, marginBottom: '8px', color: '#008C1D' }}>点検対象機器</div>
              <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                <span><span style={{ color: '#8A8A8A' }}>QRコード:</span> {task.assetId}</span>
                <span><span style={{ color: '#8A8A8A' }}>品目:</span> {task.assetName}</span>
                <span><span style={{ color: '#8A8A8A' }}>メーカー:</span> {task.maker}</span>
                <span><span style={{ color: '#8A8A8A' }}>型式:</span> {task.model}</span>
              </div>
            </div>

            <div style={{
              backgroundColor: '#000',
              borderRadius: '8px',
              overflow: 'hidden',
              marginBottom: '16px',
              aspectRatio: '4/3',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              {isCameraActive ? (
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                <div style={{ textAlign: 'center', color: '#888' }}>
                  <div style={{ fontSize: '48px', marginBottom: '8px' }}>📷</div>
                  <p style={{ margin: 0, fontSize: '14px' }}>カメラを起動してQRコードをスキャン</p>
                </div>
              )}
            </div>

            <button
              onClick={isCameraActive ? handleStopCamera : handleStartCamera}
              style={{
                width: '100%',
                padding: '14px',
                fontSize: '15px',
                fontWeight: 600,
                color: '#ffffff',
                backgroundColor: isCameraActive ? '#DA0000' : '#008C1D',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                marginBottom: '24px',
                minHeight: '44px'
              }}
            >
              {isCameraActive ? 'カメラを停止' : 'カメラを起動'}
            </button>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              marginBottom: '16px'
            }}>
              <div style={{ flex: 1, height: '1px', backgroundColor: '#E1E1E1' }}></div>
              <span style={{ color: '#888', fontSize: '13px' }}>または</span>
              <div style={{ flex: 1, height: '1px', backgroundColor: '#E1E1E1' }}></div>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', color: '#8A8A8A', marginBottom: '6px' }}>
                QRコードを手入力
              </label>
              <input
                type="text"
                value={qrCode}
                onChange={(e) => setQrCode(e.target.value)}
                placeholder={`例: ${task.assetId}（空欄可）`}
                style={{
                  width: '100%',
                  padding: '12px',
                  fontSize: '16px',
                  border: '1px solid #E1E1E1',
                  borderRadius: '8px',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <button
              onClick={handleVerifyQR}
              style={{
                width: '100%',
                padding: '14px',
                fontSize: '15px',
                fontWeight: 600,
                color: '#ffffff',
                backgroundColor: '#008C1D',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                minHeight: '44px'
              }}
            >
              照合して点検開始
            </button>
          </div>
        ) : step === 'inspection' ? (
          /* 点検実施画面 */
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: isMobile ? '8px' : '12px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            maxWidth: '600px',
            margin: '0 auto',
            overflow: 'hidden'
          }}>
            {/* ヘッダー情報 (Figma 597:42208: 2 列テーブル) */}
            <div style={{
              padding: '16px',
              borderBottom: '1px solid #E1E1E1',
              backgroundColor: '#FAFAFA'
            }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', border: '1px solid #E1E1E1' }}>
                <tbody>
                  <tr>
                    <th style={infoTableTh}>QRコード</th>
                    <td style={{ ...infoTableTd, fontVariantNumeric: 'tabular-nums' }}>{task.assetId}</td>
                  </tr>
                  <tr>
                    <th style={infoTableTh}>実施者名</th>
                    <td style={infoTableTd}>
                      <input
                        type="text"
                        value={inspectorName}
                        onChange={(e) => setInspectorName(e.target.value)}
                        placeholder="氏名を入力"
                        style={{
                          width: '100%',
                          border: '1px solid #E1E1E1',
                          borderRadius: '4px',
                          padding: '4px 8px',
                          fontSize: '13px',
                          boxSizing: 'border-box',
                        }}
                      />
                    </td>
                  </tr>
                  <tr>
                    <th style={infoTableTh}>実施日</th>
                    <td style={{ ...infoTableTd, fontVariantNumeric: 'tabular-nums' }}>{today}</td>
                  </tr>
                  <tr>
                    <th style={infoTableTh}>対象機器</th>
                    <td style={infoTableTd}>{task.assetName}　{task.maker}　{task.model}</td>
                  </tr>
                  <tr>
                    <th style={infoTableTh}>点検種別</th>
                    <td style={{ ...infoTableTd, color: '#008C1D' }}>定期点検</td>
                  </tr>
                  <tr>
                    <th style={infoTableTh}>点検メニュー</th>
                    <td style={infoTableTd}>{selectedMenu?.name || '（メニュー未設定）'}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* 点検項目 */}
            <div style={{ padding: '16px' }}>
              <div style={styles.notice}>
                点検対象機器、点検メニューにまちがいがないか確認して点検を実施してください
              </div>

              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>項目</th>
                    <th style={styles.th}>点検内容</th>
                    <th style={styles.th}>評価</th>
                  </tr>
                </thead>
                <tbody>
                  {itemResults.map((item, index) => (
                    <tr key={index}>
                      <td style={styles.td}>{item.itemName}</td>
                      <td style={styles.td}>{item.content}</td>
                      <td style={styles.td}>
                        {/* REQ-103: 評価項目の入力形式を 3 パターンで切替（定例0413 確定） */}
                        {item.evaluationType === '単位' ? (
                          <div style={{ display: 'flex', alignItems: 'center' }}>
                            <input
                              type="number"
                              style={styles.numericInput}
                              value={item.result}
                              onChange={(e) => handleItemResultChange(index, e.target.value)}
                            />
                            <span style={styles.unit}>{item.unit}</span>
                          </div>
                        ) : item.evaluationType === 'フリー入力' ? (
                          <input
                            type="text"
                            style={{ ...styles.numericInput, width: '200px' }}
                            value={item.result}
                            onChange={(e) => handleItemResultChange(index, e.target.value)}
                            placeholder="自由記述"
                          />
                        ) : (
                          // 合否（マルバツ） — デフォルト
                          <div style={{ display: 'flex', gap: '4px' }}>
                            <button
                              style={item.result === '○' ? styles.resultButtonActive : styles.resultButton}
                              onClick={() => handleItemResultChange(index, '○')}
                            >
                              ○
                            </button>
                            <button
                              style={item.result === '×' ? styles.resultButtonNg : styles.resultButton}
                              onClick={() => handleItemResultChange(index, '×')}
                            >
                              ×
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* 備考 */}
              <div style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '13px', color: '#8A8A8A', marginBottom: '4px' }}>備考（交換部品等）</div>
                <input
                  type="text"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="備考を入力"
                  style={{
                    width: '100%',
                    border: '1px solid #E1E1E1',
                    borderRadius: '4px',
                    padding: '8px 12px',
                    fontSize: '14px',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              {/* 総合評価ボタン */}
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
              }}>
                <div style={{ fontSize: '13px', color: '#8A8A8A', marginBottom: '4px' }}>総合評価</div>
                <button
                  onClick={() => handleShowConfirm('合格')}
                  style={styles.passButton}
                >
                  合格（使用可）
                </button>
                <button
                  onClick={() => handleShowConfirm('異常あり')}
                  style={styles.repairButton}
                >
                  異常あり（使用停止へ）
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* 確認画面 */
          <div style={{
            maxWidth: '600px',
            margin: '0 auto'
          }}>
            {/* 案内文 (Figma 597:42958: 黒の強調文) */}
            <div style={{
              padding: '8px 0',
              marginBottom: '16px',
            }}>
              <span style={{
                fontSize: '15px',
                fontWeight: 600,
                color: '#4A4A4A',
              }}>
                下記内容で問題がなければ完了してください
              </span>
            </div>

            {/* 総合評価 (Figma 597:42958: ラベル + 値の縦並び) */}
            <div style={{
              backgroundColor: '#ffffff',
              borderRadius: '12px',
              padding: isMobile ? '16px' : '20px 24px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
              marginBottom: '16px',
            }}>
              <div style={{ fontSize: '11px', color: '#8A8A8A', marginBottom: '4px' }}>総合評価</div>
              <div style={{
                fontSize: '20px',
                fontWeight: 700,
                color: overallResult === '合格' ? '#008C1D' : '#DA0000',
              }}>
                {overallResult}
              </div>
            </div>

            {/* 点検対象機器 (Figma 597:42958: 1セル内にラベル+値) */}
            <div style={{
              backgroundColor: '#ffffff',
              borderRadius: '12px',
              padding: isMobile ? '16px' : '20px 24px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
              marginBottom: '16px'
            }}>
              <h2 style={{ fontSize: '15px', fontWeight: 600, color: '#4A4A4A', marginBottom: '12px' }}>
                点検対象機器
              </h2>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <tbody>
                  <tr>
                    <td style={infoCellTd}><div style={infoCellLabel}>QRコード</div><div style={infoCellValue}>{task.assetId || '-'}</div></td>
                    <td style={infoCellTd}><div style={infoCellLabel}>大分類</div><div style={infoCellValue}>{task.largeClass || '-'}</div></td>
                    <td style={infoCellTd}><div style={infoCellLabel}>中分類</div><div style={infoCellValue}>{task.mediumClass || '-'}</div></td>
                  </tr>
                  <tr>
                    <td style={infoCellTd}><div style={infoCellLabel}>品目</div><div style={infoCellValue}>{task.assetName || '-'}</div></td>
                    <td style={infoCellTd}><div style={infoCellLabel}>メーカー</div><div style={infoCellValue}>{task.maker || '-'}</div></td>
                    <td style={infoCellTd}><div style={infoCellLabel}>型式</div><div style={infoCellValue}>{task.model || '-'}</div></td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* 点検情報 (Figma 597:42958: 1セル内にラベル+値) */}
            <div style={{
              backgroundColor: '#ffffff',
              borderRadius: '12px',
              padding: isMobile ? '16px' : '20px 24px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
              marginBottom: '16px'
            }}>
              <h2 style={{ fontSize: '15px', fontWeight: 600, color: '#4A4A4A', marginBottom: '12px' }}>
                点検情報
              </h2>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <tbody>
                  <tr>
                    <td style={infoCellTd}><div style={infoCellLabel}>点検種別</div><div style={infoCellValue}>定期点検</div></td>
                    <td style={infoCellTd}><div style={infoCellLabel}>点検メニュー</div><div style={infoCellValue}>{selectedMenu?.name || '（メニュー未設定）'}</div></td>
                    <td style={infoCellTd}><div style={infoCellLabel}>実施者</div><div style={infoCellValue}>{inspectorName || '-'}</div></td>
                    <td style={infoCellTd}><div style={infoCellLabel}>実施日</div><div style={infoCellValue}>{today}</div></td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* 点検項目結果テーブル */}
            <div style={{
              backgroundColor: '#ffffff',
              borderRadius: '12px',
              padding: isMobile ? '16px' : '20px 24px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
              marginBottom: '16px'
            }}>
              <h2 style={{ fontSize: '15px', fontWeight: 600, color: '#4A4A4A', marginBottom: '12px' }}>
                点検項目結果
              </h2>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', minWidth: '400px' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#FAFAFA' }}>
                      <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600, borderBottom: '2px solid #E1E1E1' }}>項目</th>
                      <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600, borderBottom: '2px solid #E1E1E1' }}>点検内容</th>
                      <th style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 600, borderBottom: '2px solid #E1E1E1', width: '80px' }}>評価</th>
                    </tr>
                  </thead>
                  <tbody>
                    {itemResults.map((item, index) => (
                      <tr key={index}>
                        <td style={{ padding: '10px 12px', borderBottom: '1px solid #E1E1E1' }}>{item.itemName}</td>
                        <td style={{ padding: '10px 12px', borderBottom: '1px solid #E1E1E1' }}>{item.content}</td>
                        <td style={{
                          padding: '10px 12px',
                          borderBottom: '1px solid #E1E1E1',
                          textAlign: 'center',
                          fontWeight: 600,
                          color: item.result === '○' ? '#008C1D' : item.result === '×' ? '#DA0000' : '#4A4A4A'
                        }}>
                          {item.unit ? `${item.result} ${item.unit}` : item.result || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 備考 */}
            {remarks && (
              <div style={{
                backgroundColor: '#ffffff',
                borderRadius: '12px',
                padding: isMobile ? '16px' : '20px 24px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                marginBottom: '16px'
              }}>
                <h2 style={{ fontSize: '15px', fontWeight: 600, color: '#4A4A4A', marginBottom: '8px' }}>
                  備考
                </h2>
                <p style={{ fontSize: '14px', color: '#555', margin: 0, lineHeight: '1.6' }}>
                  {remarks}
                </p>
              </div>
            )}

            {/* 報告書出力 */}
            <button
              onClick={handleExportReport}
              disabled={isExporting}
              style={{
                width: '100%',
                backgroundColor: '#008C1D',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                padding: '14px 24px',
                fontSize: '15px',
                fontWeight: 600,
                cursor: isExporting ? 'not-allowed' : 'pointer',
                opacity: isExporting ? 0.7 : 1,
                minHeight: '48px',
              }}
            >
              {isExporting ? '出力中...' : '報告書出力'}
            </button>
          </div>
        )}
      </main>

      {/* Footer */}
      {step === 'confirm' ? (
        <footer style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: '#ffffff',
          borderTop: '1px solid #E1E1E1',
          padding: isMobile ? '16px' : '20px 24px',
          paddingBottom: isMobile ? 'max(16px, env(safe-area-inset-bottom))' : 'max(20px, env(safe-area-inset-bottom))',
          boxShadow: '0 -2px 8px rgba(0,0,0,0.08)',
          boxSizing: 'border-box'
        }}>
          <div style={{
            maxWidth: '600px',
            margin: '0 auto',
            display: 'flex',
            gap: '12px',
            justifyContent: 'center'
          }}>
            <button
              onClick={handleBack}
              aria-label="戻る"
              style={{
                flex: 1,
                backgroundColor: 'white',
                color: '#4A4A4A',
                border: '1px solid #E1E1E1',
                borderRadius: '6px',
                padding: '14px 16px',
                fontSize: '15px',
                fontWeight: 500,
                cursor: 'pointer',
                minHeight: '48px',
              }}
            >
              戻る
            </button>
            {overallResult === '合格' ? (
              <button
                onClick={handleFinish}
                aria-label="完了"
                style={{
                  flex: 1,
                  backgroundColor: 'white',
                  color: '#146E2E',
                  border: '1px solid #146E2E',
                  borderRadius: '6px',
                  padding: '14px 16px',
                  fontSize: '15px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  minHeight: '48px',
                }}
              >
                完了
              </button>
            ) : (
              <button
                onClick={handleRepairRequest}
                aria-label="修理申請へ"
                style={{
                  flex: 1,
                  backgroundColor: '#DA0000',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '14px 16px',
                  fontSize: '15px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  minHeight: '48px',
                }}
              >
                修理申請へ
              </button>
            )}
          </div>
        </footer>
      ) : (
        <footer style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          width: '100%',
          backgroundColor: '#ffffff',
          borderTop: '1px solid #E1E1E1',
          padding: isMobile ? '12px 16px' : '16px 24px',
          paddingBottom: isMobile ? 'max(12px, env(safe-area-inset-bottom))' : 'max(16px, env(safe-area-inset-bottom))',
          display: 'flex',
          justifyContent: 'flex-start',
          boxShadow: '0 -2px 10px rgba(0,0,0,0.08)',
          boxSizing: 'border-box'
        }}>
          <button
            onClick={handleBack}
            aria-label="戻る"
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '4px',
              padding: '6px',
              borderRadius: '8px',
              minWidth: '44px',
              minHeight: '44px'
            }}
          >
            <div style={{
              background: '#FAFAFA',
              borderRadius: '50%',
              width: '44px',
              height: '44px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <div style={{
                width: 0,
                height: 0,
                borderRight: '8px solid #4A4A4A',
                borderTop: '5px solid transparent',
                borderBottom: '5px solid transparent'
              }}></div>
            </div>
            <span style={{ fontSize: '11px', color: '#4A4A4A' }}>
              {step === 'inspection' ? 'QR読取に戻る' : '戻る'}
            </span>
          </button>
        </footer>
      )}
    </div>
  );
}

function ConfirmInfoItem({ label, value }: { label: string; value: string }) {
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
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap'
      }}>
        {value || '-'}
      </div>
    </div>
  );
}

const infoTableTh: React.CSSProperties = {
  background: '#F1F1F1',
  color: '#4A4A4A',
  fontWeight: 600,
  fontSize: '13px',
  textAlign: 'left',
  padding: '8px 12px',
  border: '1px solid #E1E1E1',
  width: '120px',
  whiteSpace: 'nowrap',
};

const infoTableTd: React.CSSProperties = {
  background: '#FFFFFF',
  color: '#4A4A4A',
  fontSize: '13px',
  padding: '8px 12px',
  border: '1px solid #E1E1E1',
};

const infoCellTd: React.CSSProperties = {
  background: '#FFFFFF',
  padding: '8px 12px',
  border: '1px solid #E1E1E1',
  verticalAlign: 'top',
};

const infoCellLabel: React.CSSProperties = {
  fontSize: '11px',
  color: '#8A8A8A',
  marginBottom: '2px',
};

const infoCellValue: React.CSSProperties = {
  fontSize: '13px',
  color: '#4A4A4A',
  fontWeight: 500,
};

const styles: Record<string, React.CSSProperties> = {
  infoItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    backgroundColor: '#ffffff',
    padding: '6px 12px',
    borderRadius: '4px',
    fontSize: '13px',
    border: '1px solid #E1E1E1',
  },
  infoLabel: {
    color: '#8A8A8A',
    fontSize: '12px',
  },
  infoValue: {
    color: '#4A4A4A',
    fontWeight: 500,
  },
  input: {
    border: '1px solid #E1E1E1',
    borderRadius: '4px',
    padding: '6px 10px',
    fontSize: '14px',
    width: '100px',
  },
  dateDisplay: {
    backgroundColor: '#EBF5EE',
    padding: '6px 12px',
    borderRadius: '4px',
    fontSize: '13px',
    color: '#008C1D',
  },
  notice: {
    backgroundColor: '#FDF1E5',
    padding: '12px',
    borderRadius: '4px',
    fontSize: '13px',
    color: '#4A4A4A',
    marginBottom: '16px',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse' as const,
    fontSize: '13px',
    marginBottom: '16px',
  },
  th: {
    backgroundColor: '#EBF5EE',
    padding: '10px 8px',
    textAlign: 'left' as const,
    fontWeight: 500,
    color: '#4A4A4A',
    borderBottom: '1px solid #E1E1E1',
  },
  td: {
    padding: '10px 8px',
    borderBottom: '1px solid #E1E1E1',
    verticalAlign: 'middle' as const,
  },
  resultButton: {
    padding: '6px 12px',
    border: '1px solid #E1E1E1',
    borderRadius: '4px',
    backgroundColor: 'white',
    cursor: 'pointer',
    fontSize: '12px',
    minWidth: '44px',
    minHeight: '32px',
  },
  resultButtonActive: {
    padding: '6px 12px',
    border: '1px solid #008C1D',
    borderRadius: '4px',
    backgroundColor: '#EBF5EE',
    cursor: 'pointer',
    fontSize: '12px',
    color: '#008C1D',
    minWidth: '44px',
    minHeight: '32px',
  },
  resultButtonNg: {
    padding: '6px 12px',
    border: '1px solid #DA0000',
    borderRadius: '4px',
    backgroundColor: '#FDF1E5',
    cursor: 'pointer',
    fontSize: '12px',
    color: '#DA0000',
    minWidth: '44px',
    minHeight: '32px',
  },
  numericInput: {
    border: '1px solid #E1E1E1',
    borderRadius: '4px',
    padding: '6px 8px',
    fontSize: '13px',
    width: '60px',
    textAlign: 'right' as const,
  },
  unit: {
    fontSize: '12px',
    color: '#8A8A8A',
    marginLeft: '4px',
  },
  passButton: {
    width: '100%',
    padding: '14px 24px',
    backgroundColor: '#008C1D',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: 600,
    minHeight: '50px',
  },
  repairButton: {
    width: '100%',
    padding: '14px 24px',
    backgroundColor: '#DA0000',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: 600,
    minHeight: '50px',
  },
};

export default function PeriodicInspectionPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-dvh text-sm text-content-sub">読み込み中...</div>}>
      <PeriodicInspectionContent />
    </Suspense>
  );
}
