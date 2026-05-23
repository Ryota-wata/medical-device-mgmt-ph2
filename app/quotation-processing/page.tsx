'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { OcrResult, MatchingResult, AssetMasterCandidate } from '@/lib/types/rfq';

// サンプルOCR結果データ
const mockOcrResults: OcrResult[] = [
  { id: 1, itemName: '超音波診断装置 ProSound Alpha 7', quantity: 1, unitPrice: 15000000, amount: 15000000, note: '' },
  { id: 2, itemName: 'リニアプローブ UST-5713T', quantity: 2, unitPrice: 800000, amount: 1600000, note: '' },
  { id: 3, itemName: 'コンベックスプローブ UST-675P', quantity: 1, unitPrice: 900000, amount: 900000, note: '' },
  { id: 4, itemName: 'カート型ワークステーション', quantity: 1, unitPrice: 300000, amount: 300000, note: '' },
  { id: 5, itemName: '保守点検(1年間)', quantity: 1, unitPrice: 500000, amount: 500000, note: '' },
];

// サンプル資産マスタ候補データ
const mockCandidates: AssetMasterCandidate[][] = [
  [
    { itemId: 'ITM-001', itemName: '超音波診断装置', itemCode: 'ITM-001', largeName: '生体検査機器', mediumName: '超音波検査用機器', similarity: 0.95 },
    { itemId: 'ITM-002', itemName: '超音波画像診断装置', itemCode: 'ITM-002', largeName: '生体検査機器', mediumName: '超音波検査用機器', similarity: 0.85 },
    { itemId: 'ITM-003', itemName: '診断用超音波装置', itemCode: 'ITM-003', largeName: '生体検査機器', mediumName: '超音波検査用機器', similarity: 0.75 },
  ],
  [
    { itemId: 'ITM-011', itemName: '超音波プローブ(リニア)', itemCode: 'ITM-011', largeName: '生体検査機器', mediumName: '超音波検査用機器', similarity: 0.90 },
    { itemId: 'ITM-012', itemName: 'リニアプローブ', itemCode: 'ITM-012', largeName: '生体検査機器', mediumName: '超音波検査用機器', similarity: 0.88 },
    { itemId: 'ITM-013', itemName: 'リニア型超音波探触子', itemCode: 'ITM-013', largeName: '生体検査機器', mediumName: '超音波検査用機器', similarity: 0.80 },
  ],
  [
    { itemId: 'ITM-021', itemName: 'コンベックスプローブ', itemCode: 'ITM-021', largeName: '生体検査機器', mediumName: '超音波検査用機器', similarity: 0.92 },
    { itemId: 'ITM-022', itemName: '超音波プローブ(コンベックス)', itemCode: 'ITM-022', largeName: '生体検査機器', mediumName: '超音波検査用機器', similarity: 0.85 },
    { itemId: 'ITM-023', itemName: 'コンベックス型探触子', itemCode: 'ITM-023', largeName: '生体検査機器', mediumName: '超音波検査用機器', similarity: 0.78 },
  ],
  [
    { itemId: 'ITM-031', itemName: 'ワークステーション', itemCode: 'ITM-031', largeName: '生体検査機器', mediumName: '超音波検査用機器', similarity: 0.70 },
    { itemId: 'ITM-032', itemName: 'カート', itemCode: 'ITM-032', largeName: '医療用器具', mediumName: '医療用カート', similarity: 0.60 },
    { itemId: 'ITM-033', itemName: '機器用カート', itemCode: 'ITM-033', largeName: '医療用器具', mediumName: '医療用カート', similarity: 0.55 },
  ],
  [
    { itemId: 'ITM-041', itemName: '保守点検', itemCode: 'ITM-041', largeName: 'サービス', mediumName: '保守サービス', similarity: 0.80 },
    { itemId: 'ITM-042', itemName: '定期保守', itemCode: 'ITM-042', largeName: 'サービス', mediumName: '保守サービス', similarity: 0.75 },
    { itemId: 'ITM-043', itemName: 'メンテナンス契約', itemCode: 'ITM-043', largeName: 'サービス', mediumName: '保守サービス', similarity: 0.70 },
  ],
];

function QuotationProcessingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rfqNo = searchParams.get('rfqNo') || 'RFQ-2025-0001';

  const [currentStep, setCurrentStep] = useState(1);
  const [ocrResults, setOcrResults] = useState<OcrResult[]>([]);
  const [isOcrExtracting, setIsOcrExtracting] = useState(false);
  const [isOcrComplete, setIsOcrComplete] = useState(false);
  const [matchingResults, setMatchingResults] = useState<MatchingResult[]>([]);

  // Step 1: OCR抽出開始
  const handleStartOcr = () => {
    setIsOcrExtracting(true);
    setTimeout(() => {
      setOcrResults(mockOcrResults);
      setIsOcrExtracting(false);
      setIsOcrComplete(true);

      // マッチング結果を初期化
      const initialMatching: MatchingResult[] = mockOcrResults.map((ocr, index) => ({
        id: ocr.id,
        ocrItemName: ocr.itemName,
        quantity: ocr.quantity,
        unitPrice: ocr.unitPrice,
        amount: ocr.amount,
        candidates: mockCandidates[index] || [],
        selectedCandidate: null,
        linkedApplication: null,
        isConfirmed: false,
      }));
      setMatchingResults(initialMatching);
    }, 2000);
  };

  // Step 2に進む
  const handleGoToStep2 = () => {
    setCurrentStep(2);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Step 1に戻る
  const handleBackToStep1 = () => {
    setCurrentStep(1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // 候補を選択
  const handleSelectCandidate = (itemId: number, candidateIndex: number) => {
    setMatchingResults((prev) =>
      prev.map((item) =>
        item.id === itemId
          ? { ...item, selectedCandidate: item.candidates[candidateIndex] }
          : item
      )
    );
  };

  // 確定
  const handleConfirmItem = (itemId: number) => {
    const item = matchingResults.find((r) => r.id === itemId);
    if (!item) return;

    if (!item.selectedCandidate) {
      alert('資産マスタ候補を選択してください');
      return;
    }

    if (!item.linkedApplication) {
      alert('申請を選択してください');
      return;
    }

    setMatchingResults((prev) =>
      prev.map((r) => (r.id === itemId ? { ...r, isConfirmed: true } : r))
    );
  };

  // 確定解除
  const handleUnconfirmItem = (itemId: number) => {
    if (confirm('確定を解除しますか？')) {
      setMatchingResults((prev) =>
        prev.map((r) => (r.id === itemId ? { ...r, isConfirmed: false } : r))
      );
    }
  };

  // 申請選択（モック）
  const handleSelectApplication = (itemId: number) => {
    const mockApplication = {
      applicationNo: 'APP-2025-0001',
      asset: { name: '超音波診断装置', model: 'ProSound Alpha 7' },
    };

    setMatchingResults((prev) =>
      prev.map((r) => (r.id === itemId ? { ...r, linkedApplication: mockApplication } : r))
    );
  };

  // 処理完了
  const handleCompleteProcessing = () => {
    const unconfirmedCount = matchingResults.filter((r) => !r.isConfirmed).length;

    if (unconfirmedCount > 0) {
      if (!confirm(`未確定の項目が${unconfirmedCount}件あります。\n\nこのまま処理を完了しますか？`)) {
        return;
      }
    }

    if (confirm('見積明細の紐付けを完了しますか？\n\n処理状態が「紐付け完了」に更新され、申請情報に見積情報が追加されます。')) {
      const confirmedItems = matchingResults.filter((r) => r.isConfirmed);
      alert(`見積明細の紐付けが完了しました。\n\n${confirmedItems.length}件の明細を申請情報に追加しました。`);
      router.push('/quotation-data-box');
    }
  };

  const confirmedCount = matchingResults.filter((r) => r.isConfirmed).length;
  const unconfirmedCount = matchingResults.length - confirmedCount;

  return (
    <div style={{ minHeight: '100vh', background: '#FAFAFA' }}>
      {/* ヘッダー */}
      <header
        style={{
          background: 'white',
          color: '#4A4A4A',
          padding: '15px 20px',
          borderBottom: '1px solid #E1E1E1',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <div
              style={{
                background: '#008C1D',
                color: 'white',
                width: '50px',
                height: '50px',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 'bold',
                fontSize: '14px',
              }}
            >
              SHIP
            </div>
            <h1 style={{ fontSize: '20px', fontWeight: 600, margin: 0, color: '#4A4A4A' }}>見積処理</h1>
          </div>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <span style={{ background: '#F1F1F1', color: '#4A4A4A', padding: '6px 16px', borderRadius: '20px', fontSize: '14px', fontWeight: 600 }}>
              {rfqNo}
            </span>
            <span style={{ color: '#8A8A8A', fontSize: '14px' }}>業者: 〇〇〇〇商事</span>
          </div>
        </div>
        <button
          onClick={() => router.push('/quotation-data-box')}
          style={{
            background: 'white',
            color: '#4A4A4A',
            border: '1px solid #E1E1E1',
            borderRadius: '6px',
            padding: '8px 16px',
            cursor: 'pointer',
            fontSize: '14px',
          }}
        >
          見積書管理に戻る
        </button>
      </header>

      {/* ステップインジケーター */}
      <div
        style={{
          background: 'white',
          borderBottom: '1px solid #E1E1E1',
          padding: '30px 20px',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '40px',
        }}
      >
        {/* Step 1 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <div
            style={{
              width: '50px',
              height: '50px',
              borderRadius: '50%',
              background: currentStep === 1 ? '#008C1D' : currentStep > 1 ? '#008C1D' : '#E1E1E1',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '24px',
              fontWeight: 'bold',
              flexShrink: 0,
            }}
          >
            {currentStep > 1 ? '✓' : '1'}
          </div>
          <div>
            <div style={{ fontSize: '16px', fontWeight: 'bold', color: currentStep === 1 ? '#008C1D' : currentStep > 1 ? '#008C1D' : '#8A8A8A' }}>
              AI-OCR抽出
            </div>
            <div style={{ fontSize: '12px', color: '#8A8A8A' }}>🤖</div>
          </div>
        </div>

        {/* Connector */}
        <div style={{ width: '80px', height: '2px', background: currentStep > 1 ? '#008C1D' : '#E1E1E1' }}></div>

        {/* Step 2 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <div
            style={{
              width: '50px',
              height: '50px',
              borderRadius: '50%',
              background: currentStep === 2 ? '#008C1D' : '#E1E1E1',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '24px',
              fontWeight: 'bold',
              flexShrink: 0,
            }}
          >
            2
          </div>
          <div>
            <div style={{ fontSize: '16px', fontWeight: 'bold', color: currentStep === 2 ? '#008C1D' : '#8A8A8A' }}>
              資産マスタ突き合わせ & 申請紐付け
            </div>
            <div style={{ fontSize: '12px', color: '#8A8A8A' }}>🔍</div>
          </div>
        </div>
      </div>

      {/* メインコンテンツ */}
      <div style={{ padding: '40px 20px', maxWidth: '1600px', margin: '0 auto' }}>
        {/* Step 1: AI-OCR抽出 */}
        {currentStep === 1 && (
          <div>
            <div style={{ marginBottom: '30px' }}>
              <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: '#4A4A4A', marginBottom: '8px' }}>
                Step 1: AI-OCR抽出
              </h2>
              <p style={{ color: '#8A8A8A', fontSize: '14px' }}>見積書PDFから明細情報を自動抽出します</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '20px', marginBottom: '30px' }}>
              {/* PDF表示エリア */}
              <div style={{ background: 'white', borderRadius: '8px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#4A4A4A', marginBottom: '15px' }}>
                  📄 見積書PDF
                </div>
                <div
                  style={{
                    border: '2px dashed #E1E1E1',
                    borderRadius: '8px',
                    padding: '60px 20px',
                    textAlign: 'center',
                    background: '#FAFAFA',
                  }}
                >
                  <div style={{ fontSize: '64px', marginBottom: '15px' }}>📑</div>
                  <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#4A4A4A', marginBottom: '10px' }}>
                    見積書.pdf
                  </div>
                  <button
                    onClick={() => alert('PDFプレビュー機能は実装予定です')}
                    style={{
                      background: '#008C1D',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      padding: '8px 20px',
                      cursor: 'pointer',
                      fontSize: '14px',
                    }}
                  >
                    PDFを開く
                  </button>
                </div>
              </div>

              {/* OCR抽出結果エリア */}
              <div style={{ background: 'white', borderRadius: '8px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#4A4A4A', marginBottom: '15px' }}>
                  🤖 OCR抽出結果
                </div>

                {!isOcrComplete && (
                  <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                    <button
                      onClick={handleStartOcr}
                      disabled={isOcrExtracting}
                      style={{
                        background: isOcrExtracting ? '#8A8A8A' : '#008C1D',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        padding: '12px 30px',
                        cursor: isOcrExtracting ? 'not-allowed' : 'pointer',
                        fontSize: '16px',
                        fontWeight: 'bold',
                      }}
                    >
                      {isOcrExtracting ? '⏳ 抽出中...' : '▶ OCR抽出を開始'}
                    </button>
                  </div>
                )}

                {isOcrComplete && (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ background: '#FAFAFA', borderBottom: '2px solid #E1E1E1' }}>
                          <th style={{ padding: '10px', textAlign: 'left', fontSize: '13px', color: '#4A4A4A', width: '40px' }}>No</th>
                          <th style={{ padding: '10px', textAlign: 'left', fontSize: '13px', color: '#4A4A4A' }}>品目名</th>
                          <th style={{ padding: '10px', textAlign: 'right', fontSize: '13px', color: '#4A4A4A', width: '60px' }}>数量</th>
                          <th style={{ padding: '10px', textAlign: 'right', fontSize: '13px', color: '#4A4A4A', width: '120px' }}>単価</th>
                          <th style={{ padding: '10px', textAlign: 'right', fontSize: '13px', color: '#4A4A4A', width: '120px' }}>金額</th>
                          <th style={{ padding: '10px', textAlign: 'left', fontSize: '13px', color: '#4A4A4A', width: '100px' }}>備考</th>
                        </tr>
                      </thead>
                      <tbody>
                        {ocrResults.map((item) => (
                          <tr key={item.id} style={{ borderBottom: '1px solid #E1E1E1' }}>
                            <td style={{ padding: '10px', color: '#8A8A8A', fontSize: '13px' }}>{item.id}</td>
                            <td style={{ padding: '10px', color: '#4A4A4A', fontSize: '13px' }}>{item.itemName}</td>
                            <td style={{ padding: '10px', textAlign: 'right', color: '#8A8A8A', fontSize: '13px' }}>{item.quantity}</td>
                            <td style={{ padding: '10px', textAlign: 'right', color: '#8A8A8A', fontSize: '13px' }}>
                              ¥{item.unitPrice.toLocaleString()}
                            </td>
                            <td style={{ padding: '10px', textAlign: 'right', color: '#8A8A8A', fontSize: '13px' }}>
                              ¥{item.amount.toLocaleString()}
                            </td>
                            <td style={{ padding: '10px', color: '#8A8A8A', fontSize: '13px' }}>{item.note}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            {/* ボタンエリア */}
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => router.push('/quotation-data-box')}
                style={{
                  background: '#8A8A8A',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  padding: '12px 30px',
                  cursor: 'pointer',
                  fontSize: '16px',
                  fontWeight: 'bold',
                }}
              >
                キャンセル
              </button>
              <button
                onClick={handleGoToStep2}
                disabled={!isOcrComplete}
                style={{
                  background: isOcrComplete ? '#008C1D' : '#E1E1E1',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  padding: '12px 30px',
                  cursor: isOcrComplete ? 'pointer' : 'not-allowed',
                  fontSize: '16px',
                  fontWeight: 'bold',
                }}
              >
                次へ: 資産マスタ突き合わせ & 申請紐付け →
              </button>
            </div>
          </div>
        )}

        {/* Step 2: 資産マスタ突き合わせ & 申請紐付け */}
        {currentStep === 2 && (
          <div>
            <div style={{ marginBottom: '30px' }}>
              <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: '#4A4A4A', marginBottom: '8px' }}>
                Step 2: 資産マスタ突き合わせ & 申請紐付け
              </h2>
              <p style={{ color: '#8A8A8A', fontSize: '14px' }}>
                抽出した明細を資産マスタの個体管理品目と突き合わせ、申請に紐付けます
              </p>
            </div>

            {/* サマリー */}
            <div style={{ display: 'flex', gap: '20px', marginBottom: '30px' }}>
              <div style={{ flex: 1, background: 'white', borderRadius: '8px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                <div style={{ fontSize: '14px', color: '#8A8A8A', marginBottom: '8px' }}>抽出明細数</div>
                <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#4A4A4A' }}>{matchingResults.length}</div>
              </div>
              <div style={{ flex: 1, background: 'white', borderRadius: '8px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                <div style={{ fontSize: '14px', color: '#8A8A8A', marginBottom: '8px' }}>確定済み</div>
                <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#008C1D' }}>{confirmedCount}</div>
              </div>
              <div style={{ flex: 1, background: 'white', borderRadius: '8px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                <div style={{ fontSize: '14px', color: '#8A8A8A', marginBottom: '8px' }}>未確定</div>
                <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#4A4A4A' }}>{unconfirmedCount}</div>
              </div>
            </div>

            {/* マッチング結果テーブル */}
            <div style={{ background: 'white', borderRadius: '8px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', marginBottom: '30px' }}>
              {matchingResults.map((item) => (
                <div
                  key={item.id}
                  style={{
                    borderBottom: '1px solid #E1E1E1',
                    padding: '20px 0',
                    background: item.isConfirmed ? '#EBF5EE' : 'transparent',
                  }}
                >
                  <div style={{ display: 'grid', gridTemplateColumns: '40px 1fr', gap: '20px' }}>
                    {/* No */}
                    <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#4A4A4A', textAlign: 'center' }}>
                      {item.id}
                    </div>

                    <div>
                      {/* OCR抽出品目 */}
                      <div style={{ marginBottom: '15px' }}>
                        <div style={{ fontSize: '12px', color: '#8A8A8A', marginBottom: '5px' }}>OCR抽出品目</div>
                        <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#4A4A4A' }}>{item.ocrItemName}</div>
                        <div style={{ fontSize: '14px', color: '#8A8A8A', marginTop: '5px' }}>
                          数量: {item.quantity} / 単価: ¥{item.unitPrice.toLocaleString()}
                        </div>
                      </div>

                      {/* 資産マスタ候補 */}
                      <div style={{ marginBottom: '15px' }}>
                        <div style={{ fontSize: '12px', color: '#8A8A8A', marginBottom: '10px' }}>資産マスタ候補</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                          {item.candidates.map((candidate, index) => (
                            <label
                              key={index}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px',
                                padding: '12px',
                                border:
                                  item.selectedCandidate?.itemId === candidate.itemId
                                    ? '2px solid #008C1D'
                                    : '1px solid #E1E1E1',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                background:
                                  item.selectedCandidate?.itemId === candidate.itemId ? '#EBF5EE' : 'white',
                              }}
                            >
                              <input
                                type="radio"
                                name={`candidate_${item.id}`}
                                checked={item.selectedCandidate?.itemId === candidate.itemId}
                                onChange={() => handleSelectCandidate(item.id, index)}
                                style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                              />
                              <div style={{ flex: 1 }}>
                                <span
                                  style={{
                                    display: 'inline-block',
                                    background: '#008C1D',
                                    color: 'white',
                                    padding: '2px 8px',
                                    borderRadius: '10px',
                                    fontSize: '11px',
                                    fontWeight: 'bold',
                                    marginRight: '8px',
                                  }}
                                >
                                  候補{index + 1}
                                </span>
                                <span style={{ color: '#8A8A8A', fontSize: '13px' }}>
                                  {candidate.largeName} › {candidate.mediumName} › {candidate.itemName}
                                </span>
                              </div>
                              <span
                                style={{
                                  background: '#4A4A4A',
                                  color: 'white',
                                  padding: '4px 10px',
                                  borderRadius: '12px',
                                  fontSize: '12px',
                                  fontWeight: 'bold',
                                }}
                              >
                                {Math.round(candidate.similarity * 100)}%
                              </span>
                            </label>
                          ))}
                        </div>
                      </div>

                      {/* 申請紐付け */}
                      <div style={{ marginBottom: '15px' }}>
                        <div style={{ fontSize: '12px', color: '#8A8A8A', marginBottom: '10px' }}>申請紐付け</div>
                        {item.selectedCandidate ? (
                          item.linkedApplication ? (
                            <div
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px',
                                padding: '12px',
                                border: '1px solid #E1E1E1',
                                borderRadius: '6px',
                                background: '#FAFAFA',
                              }}
                            >
                              <div style={{ flex: 1 }}>
                                <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#4A4A4A' }}>
                                  {item.linkedApplication.applicationNo}
                                </div>
                                <div style={{ fontSize: '12px', color: '#8A8A8A' }}>
                                  {item.linkedApplication.asset.name} {item.linkedApplication.asset.model}
                                </div>
                              </div>
                              <button
                                onClick={() => handleSelectApplication(item.id)}
                                style={{
                                  background: '#8A8A8A',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '4px',
                                  padding: '6px 12px',
                                  cursor: 'pointer',
                                  fontSize: '13px',
                                }}
                              >
                                変更
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => handleSelectApplication(item.id)}
                              style={{
                                background: '#008C1D',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                padding: '10px 20px',
                                cursor: 'pointer',
                                fontSize: '14px',
                                fontWeight: 'bold',
                              }}
                            >
                              申請を選択
                            </button>
                          )
                        ) : (
                          <div style={{ color: '#8A8A8A', fontSize: '14px' }}>候補を選択してください</div>
                        )}
                      </div>

                      {/* ステータスと確定ボタン */}
                      <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                        <span
                          style={{
                            display: 'inline-block',
                            padding: '6px 16px',
                            borderRadius: '20px',
                            fontSize: '13px',
                            fontWeight: 'bold',
                            background: item.isConfirmed ? '#008C1D' : '#4A4A4A',
                            color: 'white',
                          }}
                        >
                          {item.isConfirmed ? '✓ 確定済み' : '未確定'}
                        </span>
                        {item.isConfirmed ? (
                          <button
                            onClick={() => handleUnconfirmItem(item.id)}
                            style={{
                              background: '#8A8A8A',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              padding: '8px 20px',
                              cursor: 'pointer',
                              fontSize: '14px',
                              fontWeight: 'bold',
                            }}
                          >
                            解除
                          </button>
                        ) : item.selectedCandidate && item.linkedApplication ? (
                          <button
                            onClick={() => handleConfirmItem(item.id)}
                            style={{
                              background: '#008C1D',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              padding: '8px 20px',
                              cursor: 'pointer',
                              fontSize: '14px',
                              fontWeight: 'bold',
                            }}
                          >
                            確定
                          </button>
                        ) : (
                          <button
                            disabled
                            style={{
                              background: '#E1E1E1',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              padding: '8px 20px',
                              cursor: 'not-allowed',
                              fontSize: '14px',
                              fontWeight: 'bold',
                            }}
                          >
                            確定
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* ボタンエリア */}
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                onClick={handleBackToStep1}
                style={{
                  background: '#8A8A8A',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  padding: '12px 30px',
                  cursor: 'pointer',
                  fontSize: '16px',
                  fontWeight: 'bold',
                }}
              >
                ← 戻る
              </button>
              <button
                onClick={handleCompleteProcessing}
                style={{
                  background: '#008C1D',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  padding: '12px 30px',
                  cursor: 'pointer',
                  fontSize: '16px',
                  fontWeight: 'bold',
                }}
              >
                ✓ 紐付けを完了
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function QuotationProcessingPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <QuotationProcessingContent />
    </Suspense>
  );
}
