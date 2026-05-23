'use client';

import React, { useState, useMemo, useCallback, useRef, Suspense } from 'react';
import { Inbox, FileText, Hourglass } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useRfqGroupStore } from '@/lib/stores/rfqGroupStore';
import { useEditListStore } from '@/lib/stores/editListStore';
import { Header } from '@/components/layouts/Header';

// ──────────────────────────────────────────────
// 全体ステップ定義
// ──────────────────────────────────────────────
const STEPS = [
  { num: 1, label: '見積情報入力' },
  { num: 2, label: 'OCR明細確認' },
  { num: 3, label: '登録区分登録' },
  { num: 4, label: '個体品目AI判定' },
  { num: 5, label: '個体登録,金額案分' },
  { num: 6, label: '登録確認' },
];

// ──────────────────────────────────────────────
// VendorEntry型
// ──────────────────────────────────────────────
interface VendorEntry {
  localId: string;
  rfqGroupId?: number;
  vendorName: string;
  personInCharge: string;
  email: string;
  tel: string;
  submitDeadline: string;
  requestNote: string;
  isSent: boolean;
}

let vendorLocalIdCounter = 0;
function generateLocalId(): string {
  vendorLocalIdCounter += 1;
  return `vendor-${vendorLocalIdCounter}`;
}

// ──────────────────────────────────────────────
// メインコンテンツ
// ──────────────────────────────────────────────
function RfqProcessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rfqGroupId = searchParams.get('rfqGroupId');

  const { rfqGroups, updateRfqGroup, cloneRfqGroupForVendor, getRfqGroupsByRfqNo } = useRfqGroupStore();
  const { getItemsByEditListId } = useEditListStore();

  const rfqGroup = useMemo(() => {
    if (!rfqGroupId) return null;
    return rfqGroups.find(g => g.id === Number(rfqGroupId)) || null;
  }, [rfqGroups, rfqGroupId]);

  // 編集リストの品目
  const editListItems = useMemo(() => {
    if (!rfqGroup?.editListId) return [];
    return getItemsByEditListId(rfqGroup.editListId);
  }, [rfqGroup, getItemsByEditListId]);

  // ── 複数業者の初期化 ──
  const [vendors, setVendors] = useState<VendorEntry[]>(() => {
    if (!rfqGroup) return [];

    // 同一rfqNoの兄弟レコードを取得
    const siblings = getRfqGroupsByRfqNo(rfqGroup.rfqNo);

    if (siblings.length <= 1) {
      // 兄弟なし → 現在のグループだけで初期化
      const isSent = rfqGroup.status !== '見積依頼';
      return [{
        localId: generateLocalId(),
        rfqGroupId: rfqGroup.id,
        vendorName: rfqGroup.vendorName || '',
        personInCharge: rfqGroup.personInCharge || '',
        email: rfqGroup.email || '',
        tel: rfqGroup.tel || '',
        submitDeadline: rfqGroup.rfqDeadline || rfqGroup.deadline || '',
        requestNote: '',
        isSent,
      }];
    }

    // 兄弟あり → URLパラメータのIDを先頭に配置
    const sorted = [
      ...siblings.filter(s => s.id === Number(rfqGroupId)),
      ...siblings.filter(s => s.id !== Number(rfqGroupId)),
    ];

    return sorted.map(s => ({
      localId: generateLocalId(),
      rfqGroupId: s.id,
      vendorName: s.vendorName || '',
      personInCharge: s.personInCharge || '',
      email: s.email || '',
      tel: s.tel || '',
      submitDeadline: s.rfqDeadline || s.deadline || '',
      requestNote: '',
      isSent: s.status !== '見積依頼',
    }));
  });

  // ── アクティブ業者インデックス（プレビュー連動） ──
  const [activeVendorIndex, setActiveVendorIndex] = useState(0);

  // ── 見積登録フォーム ──
  const [quotationPhase, setQuotationPhase] = useState<'定価見積' | '概算見積' | '発注登録用見積'>('定価見積');
  const [saveFormat, setSaveFormat] = useState<'電子取引' | 'スキャナ保存' | '未指定'>('スキャナ保存');
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [registrationDeadline, setRegistrationDeadline] = useState('');
  const [ocrProcessing, setOcrProcessing] = useState(false);

  // ── プレビュー表示 ──
  const [showPreview, setShowPreview] = useState(false);

  // ── パネル幅（ドラッグリサイズ） ──
  const [leftPanelWidth, setLeftPanelWidth] = useState<number>(55);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef<boolean>(false);
  const today = new Date().toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' });

  // アクティブ業者
  const activeVendor = vendors[activeVendorIndex] || vendors[0];

  // ── 業者フィールド更新 ──
  const updateVendorField = useCallback((index: number, field: keyof VendorEntry, value: string) => {
    setVendors(prev => prev.map((v, i) =>
      i === index ? { ...v, [field]: value } : v
    ));
  }, []);

  // ── 業者追加 ──
  const handleAddVendor = useCallback(() => {
    setVendors(prev => [
      ...prev,
      {
        localId: generateLocalId(),
        vendorName: '',
        personInCharge: '',
        email: '',
        tel: '',
        submitDeadline: '',
        requestNote: '',
        isSent: false,
      },
    ]);
  }, []);

  // ── 業者削除（未送信のみ） ──
  const handleRemoveVendor = useCallback((index: number) => {
    setVendors(prev => {
      if (prev.length <= 1) return prev;
      const updated = prev.filter((_, i) => i !== index);
      return updated;
    });
    setActiveVendorIndex(prev => {
      if (prev >= vendors.length - 1) return Math.max(0, vendors.length - 2);
      return prev;
    });
  }, [vendors.length]);

  // ── 個別依頼送信 ──
  const handleSendSingleVendor = useCallback((index: number) => {
    if (!rfqGroup) return;
    const vendor = vendors[index];
    if (!vendor.vendorName || !vendor.email) {
      alert('業者名とメールアドレスは必須です');
      return;
    }

    if (index === 0 || vendor.rfqGroupId) {
      // 先頭業者 or 既存レコード → updateRfqGroup
      const targetId = vendor.rfqGroupId || rfqGroup.id;
      updateRfqGroup(targetId, {
        vendorName: vendor.vendorName,
        personInCharge: vendor.personInCharge,
        email: vendor.email,
        tel: vendor.tel,
        rfqDeadline: vendor.submitDeadline,
        status: '見積依頼済',
      });
      setVendors(prev => prev.map((v, i) =>
        i === index ? { ...v, isSent: true, rfqGroupId: targetId } : v
      ));
    } else {
      // 追加業者 → cloneRfqGroupForVendor
      const newGroup = cloneRfqGroupForVendor(rfqGroup.id, {
        vendorName: vendor.vendorName,
        personInCharge: vendor.personInCharge,
        email: vendor.email,
        tel: vendor.tel,
        deadline: vendor.submitDeadline,
      });
      setVendors(prev => prev.map((v, i) =>
        i === index ? { ...v, isSent: true, rfqGroupId: newGroup.id } : v
      ));
    }

    alert(`${vendor.vendorName} への見積依頼を送信しました`);
  }, [rfqGroup, vendors, updateRfqGroup, cloneRfqGroupForVendor]);

  // ドラッグハンドラ
  const handleDragMove = useCallback((e: MouseEvent) => {
    if (!isDragging.current || !containerRef.current) return;
    const containerRect = containerRef.current.getBoundingClientRect();
    const newWidth = ((e.clientX - containerRect.left) / containerRect.width) * 100;
    setLeftPanelWidth(Math.min(70, Math.max(30, newWidth)));
  }, []);

  const handleDragEnd = useCallback(() => {
    isDragging.current = false;
    document.removeEventListener('mousemove', handleDragMove);
    document.removeEventListener('mouseup', handleDragEnd);
  }, [handleDragMove]);

  const handleDragStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    isDragging.current = true;
    document.addEventListener('mousemove', handleDragMove);
    document.addEventListener('mouseup', handleDragEnd);
  }, [handleDragMove, handleDragEnd]);

  // ── PDF アップロード ──
  const handlePdfUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setPdfFile(file);
  };

  // ── 「登録へ」→ OCR処理 → OCR確認画面へ ──
  const handleProceedToRegistration = () => {
    setOcrProcessing(true);
    setTimeout(() => {
      setOcrProcessing(false);
      router.push('/quotation-data-box/ocr-confirm');
    }, 1500);
  };

  // ── 「SHIPへ依頼」一括送信 ──
  const handleSendRfqAll = () => {
    if (!rfqGroup) return;

    const unsent = vendors.filter(v => !v.isSent);
    if (unsent.length === 0) {
      alert('送信対象の業者がありません');
      return;
    }

    // バリデーション
    const invalid = unsent.filter(v => !v.vendorName || !v.email);
    if (invalid.length > 0) {
      alert('未送信の業者すべてに業者名とメールアドレスを入力してください');
      return;
    }

    // 各未送信業者を送信
    unsent.forEach(vendor => {
      const index = vendors.indexOf(vendor);
      if (index === 0 || vendor.rfqGroupId) {
        const targetId = vendor.rfqGroupId || rfqGroup.id;
        updateRfqGroup(targetId, {
          vendorName: vendor.vendorName,
          personInCharge: vendor.personInCharge,
          email: vendor.email,
          tel: vendor.tel,
          rfqDeadline: vendor.submitDeadline,
          status: '見積依頼済',
        });
      } else {
        cloneRfqGroupForVendor(rfqGroup.id, {
          vendorName: vendor.vendorName,
          personInCharge: vendor.personInCharge,
          email: vendor.email,
          tel: vendor.tel,
          deadline: vendor.submitDeadline,
        });
      }
    });

    alert(`${unsent.length}件の見積依頼をSHIPへ送信しました`);
    router.push('/quotation-data-box/purchase-management');
  };

  // ── 「タスク管理に戻る」 ──
  const handleCancel = () => {
    router.push('/quotation-data-box/purchase-management');
  };

  // ── Not Found ──
  if (!rfqGroup) {
    return (
      <div className="min-h-dvh flex flex-col" style={{ background: '#FAFAFA' }}>
        <Header title="見積依頼" showBackButton backHref="/quotation-data-box/purchase-management" backLabel="タスク管理に戻る" hideMenu />
        <div style={{ padding: '60px 40px', textAlign: 'center', color: '#8A8A8A' }}>
          <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'center' }}><Inbox size={48} aria-hidden /></div>
          <div style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '8px' }}>見積依頼グループが見つかりません</div>
          <div style={{ fontSize: '13px', marginBottom: '24px' }}>URLのパラメータを確認してください。</div>
          <button
            onClick={() => router.push('/quotation-data-box/purchase-management')}
            style={{ padding: '8px 24px', background: '#087CB6', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '13px' }}
          >
            タスク管理に戻る
          </button>
        </div>
      </div>
    );
  }

  // 未送信件数
  const unsentCount = vendors.filter(v => !v.isSent).length;

  // ──────────────────────────────────────────────
  // Render
  // ──────────────────────────────────────────────
  return (
    <div className="min-h-dvh flex flex-col" style={{ background: '#FAFAFA' }}>
      {/* ===== ヘッダー ===== */}
      <div style={{
        background: '#4A4A4A',
        color: 'white',
        padding: '8px 16px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
      }}>
        <span style={{
          background: '#087CB6',
          padding: '4px 10px',
          borderRadius: '4px',
          fontSize: '12px',
          fontWeight: 'bold',
        }}>SHIP</span>
        <span style={{ fontSize: '14px', fontWeight: 'bold' }}>
          見積依頼・見積登録
        </span>
        <span style={{
          background: '#DA0000',
          padding: '2px 10px',
          borderRadius: '4px',
          fontSize: '11px',
          fontWeight: 'bold',
        }}>STEP 1</span>
        <span style={{ fontSize: '12px', color: '#E1E1E1', marginLeft: '8px' }}>
          {rfqGroup.rfqNo} - {rfqGroup.groupName}
        </span>
        <div style={{ flex: 1 }} />
        <button
          onClick={handleCancel}
          style={{
            padding: '6px 16px',
            background: 'rgba(255,255,255,0.15)',
            color: 'white',
            border: '1px solid rgba(255,255,255,0.3)',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '12px',
          }}
        >
          タスク管理に戻る
        </button>
      </div>

      {/* ===== プログレスバー ===== */}
      <div style={{
        background: 'white',
        padding: '16px 32px',
        borderBottom: '1px solid #E1E1E1',
        display: 'flex',
        justifyContent: 'center',
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0' }}>
          {STEPS.map((step, i) => (
            <React.Fragment key={step.num}>
              {i > 0 && (
                <div style={{
                  height: '2px',
                  width: '64px',
                  background: step.num <= 1 ? '#087CB6' : '#E1E1E1',
                  marginTop: '13px',
                }} />
              )}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', minWidth: '80px' }}>
                <div style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  background: step.num < 1 ? '#008C1D'
                    : step.num === 1 ? '#087CB6'
                    : '#E1E1E1',
                  color: step.num <= 1 ? 'white' : '#8A8A8A',
                }}>
                  {step.num < 1 ? '\u2713' : step.num}
                </div>
                <span style={{
                  fontSize: '11px',
                  color: step.num === 1 ? '#4A4A4A' : step.num < 1 ? '#008C1D' : '#8A8A8A',
                  whiteSpace: 'nowrap',
                  fontWeight: step.num === 1 ? 600 : 400,
                }}>
                  {step.label}
                </span>
              </div>
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* ===== メインコンテンツ（STEP1: 見積情報入力）===== */}
      <div ref={containerRef} style={{ display: 'flex', flex: 1, minHeight: 0, position: 'relative' }}>

        {/* ── 左カラム ── */}
        <div style={{ width: `${leftPanelWidth}%`, display: 'flex', flexDirection: 'column', overflow: 'auto', padding: '16px', gap: '16px' }}>

          {/* ========== セクション1: 見積依頼 ========== */}
          <div style={{ background: 'white', borderRadius: '8px', border: '1px solid #E1E1E1', overflow: 'hidden' }}>
            <div style={{ background: '#087CB6', color: 'white', padding: '6px 12px', fontSize: '13px', fontWeight: 'bold', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>見積依頼</span>
              <button
                onClick={handleAddVendor}
                style={{
                  padding: '4px 12px',
                  background: 'rgba(255,255,255,0.2)',
                  color: 'white',
                  border: '1px solid rgba(255,255,255,0.4)',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: 600,
                }}
              >
                + 業者追加（{vendors.length}社）
              </button>
            </div>

            {/* 黄色ガイダンス */}
            <div style={{
              background: '#FDF1E5',
              border: '1px solid #4A4A4A',
              margin: '12px',
              padding: '10px 16px',
              borderRadius: '4px',
              fontSize: '13px',
              color: '#4A4A4A',
              fontWeight: 500,
            }}>
              業者を登録し見積依頼書を作成してください。複数業者への相見積もりが可能です。
            </div>

            {/* ヘッダーラベル行 */}
            <div style={{ padding: '0 12px', display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '6px' }}>
              <div style={{ width: '56px', flexShrink: 0 }} />
              <div style={{ flex: 1, fontSize: '12px', fontWeight: 600, color: '#555' }}>
                業者名 <span style={{ color: '#DA0000' }}>*</span>
              </div>
              <div style={{ flex: 1, fontSize: '12px', fontWeight: 600, color: '#555' }}>担当者名</div>
              <div style={{ flex: 1, fontSize: '12px', fontWeight: 600, color: '#555' }}>
                メール <span style={{ color: '#DA0000' }}>*</span>
              </div>
              <div style={{ flex: 1, fontSize: '12px', fontWeight: 600, color: '#555' }}>連絡先</div>
              <div style={{ width: '140px', fontSize: '12px', fontWeight: 600, color: '#555' }}>提出期限</div>
              <div style={{ width: '200px', fontSize: '12px', fontWeight: 600, color: '#555' }}>アクション</div>
            </div>

            {/* 業者入力行 ループ */}
            {vendors.map((vendor, index) => (
              <div key={vendor.localId}>
                <div style={{
                  padding: '0 12px 8px',
                  display: 'flex',
                  gap: '8px',
                  alignItems: 'center',
                  opacity: vendor.isSent ? 0.7 : 1,
                }}>
                  {/* インデックスバッジ */}
                  <span style={{
                    background: vendor.isSent ? '#008C1D' : '#4A4A4A',
                    color: 'white',
                    padding: '4px 6px',
                    borderRadius: '4px',
                    fontSize: '11px',
                    fontWeight: 'bold',
                    flexShrink: 0,
                    width: '56px',
                    textAlign: 'center',
                    whiteSpace: 'nowrap',
                  }}>
                    {vendor.isSent ? '済' : `依頼${index + 1}`}
                  </span>
                  <input
                    value={vendor.vendorName}
                    onChange={(e) => updateVendorField(index, 'vendorName', e.target.value)}
                    placeholder="業者名"
                    disabled={vendor.isSent}
                    style={{ ...inputStyle, ...(vendor.isSent ? disabledInputStyle : {}) }}
                  />
                  <input
                    value={vendor.personInCharge}
                    onChange={(e) => updateVendorField(index, 'personInCharge', e.target.value)}
                    placeholder="担当者"
                    disabled={vendor.isSent}
                    style={{ ...inputStyle, ...(vendor.isSent ? disabledInputStyle : {}) }}
                  />
                  <input
                    value={vendor.email}
                    onChange={(e) => updateVendorField(index, 'email', e.target.value)}
                    placeholder="email@example.com"
                    disabled={vendor.isSent}
                    style={{ ...inputStyle, ...(vendor.isSent ? disabledInputStyle : {}) }}
                  />
                  <input
                    value={vendor.tel}
                    onChange={(e) => updateVendorField(index, 'tel', e.target.value)}
                    placeholder="03-0000-0000"
                    disabled={vendor.isSent}
                    style={{ ...inputStyle, maxWidth: '150px', ...(vendor.isSent ? disabledInputStyle : {}) }}
                  />
                  <input
                    type="date"
                    value={vendor.submitDeadline}
                    onChange={(e) => updateVendorField(index, 'submitDeadline', e.target.value)}
                    disabled={vendor.isSent}
                    style={{ ...inputStyle, width: '140px', flexShrink: 0, ...(vendor.isSent ? disabledInputStyle : {}) }}
                  />
                  <div style={{ display: 'flex', gap: '4px', width: '200px', flexShrink: 0 }}>
                    <button
                      onClick={() => {
                        setActiveVendorIndex(index);
                        setShowPreview(true);
                      }}
                      style={{
                        padding: '6px 8px',
                        background: activeVendorIndex === index && showPreview ? '#4A4A4A' : '#8A8A8A',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '11px',
                        whiteSpace: 'nowrap',
                      }}
                    >プレビュー</button>
                    {!vendor.isSent && (
                      <button
                        onClick={() => handleSendSingleVendor(index)}
                        style={accentBtnSmall}
                      >依頼送信</button>
                    )}
                    {!vendor.isSent && vendors.length > 1 && (
                      <button
                        onClick={() => handleRemoveVendor(index)}
                        style={{
                          padding: '6px 8px',
                          background: '#DA0000',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '11px',
                          whiteSpace: 'nowrap',
                        }}
                      >削除</button>
                    )}
                  </div>
                </div>

                {/* ご依頼事項（業者ごと） */}
                <div style={{
                  margin: '0 12px 12px',
                  border: '1px solid #E1E1E1',
                  borderRadius: '4px',
                  overflow: 'hidden',
                }}>
                  <div style={{
                    padding: '4px 12px',
                    fontSize: '12px',
                    color: '#555',
                    background: '#FAFAFA',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}>
                    <span style={{ color: vendor.isSent ? '#008C1D' : '#4A4A4A', fontWeight: 600 }}>
                      依頼先{index + 1}
                    </span>
                    <span style={{ fontWeight: 600 }}>ご依頼事項</span>
                  </div>
                  <textarea
                    value={vendor.requestNote}
                    onChange={(e) => updateVendorField(index, 'requestNote', e.target.value)}
                    placeholder="ご依頼事項を入力してください"
                    rows={2}
                    disabled={vendor.isSent}
                    style={{
                      ...textareaStyle,
                      ...(vendor.isSent ? { background: '#FAFAFA', color: '#8A8A8A' } : {}),
                    }}
                  />
                </div>
              </div>
            ))}

            {/* 一括送信エリア */}
            <div style={{
              padding: '12px',
              borderTop: '1px solid #E1E1E1',
              display: 'flex',
              justifyContent: 'flex-end',
            }}>
              <button
                onClick={handleSendRfqAll}
                disabled={unsentCount === 0}
                style={{
                  padding: '8px 24px',
                  background: unsentCount === 0 ? '#8A8A8A' : '#DA0000',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: unsentCount === 0 ? 'not-allowed' : 'pointer',
                  fontSize: '13px',
                  fontWeight: 'bold',
                }}
              >
                {unsentCount > 0 ? `SHIPへ一括依頼（${unsentCount}件）` : '全件送信済'}
              </button>
            </div>
          </div>

          {/* ========== セクション2: 見積登録 ========== */}
          <div style={{
            background: 'white',
            borderRadius: '8px',
            border: '1px solid #E1E1E1',
            overflow: 'hidden',
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
          }}>
            <div style={{ background: '#008C1D', color: 'white', padding: '6px 12px', fontSize: '13px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>見積登録</span>
              <span style={{
                background: 'rgba(255,255,255,0.25)',
                padding: '2px 8px',
                borderRadius: '4px',
                fontSize: '11px',
              }}>
                {rfqGroup.vendorName || '業者未設定'}
              </span>
            </div>

            {/* 登録フォーム */}
            <div style={{ padding: '16px', flex: 1 }}>
              <table style={{ fontSize: '13px', borderCollapse: 'collapse' }}>
                <tbody>
                  {/* 添付ファイル */}
                  <tr>
                    <td style={formLabelTd}>添付ファイル</td>
                    <td style={formValueTd}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <label style={{
                          padding: '6px 16px',
                          background: 'white',
                          border: '1px solid #E1E1E1',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '13px',
                        }}>
                          ファイルの選択
                          <input
                            type="file"
                            accept=".pdf,.xlsx,.xls"
                            onChange={handlePdfUpload}
                            style={{ display: 'none' }}
                          />
                        </label>
                        <span style={{ color: '#8A8A8A', fontSize: '12px' }}>
                          {pdfFile ? pdfFile.name : 'ファイルが選択されていません'}
                        </span>
                      </div>
                    </td>
                  </tr>
                  {/* 申請者 */}
                  <tr>
                    <td style={formLabelTd}>申請者</td>
                    <td style={formValueTd}>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <input
                          type="text"
                          defaultValue="user001"
                          readOnly
                          style={{ ...inputStyleCompact, width: '100px', background: '#FAFAFA' }}
                        />
                        <span style={{ fontSize: '13px', color: '#555' }}>担当者名</span>
                      </div>
                    </td>
                  </tr>
                  {/* 見積フェーズ */}
                  <tr>
                    <td style={formLabelTd}>見積フェーズ</td>
                    <td style={formValueTd}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {(['定価見積', '概算見積', '発注登録用見積'] as const).map((phase) => (
                          <label key={phase} style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', fontSize: '13px' }}>
                            <input
                              type="radio"
                              name="quotationPhase"
                              checked={quotationPhase === phase}
                              onChange={() => setQuotationPhase(phase)}
                            />
                            {phase}
                          </label>
                        ))}
                      </div>
                    </td>
                  </tr>
                  {/* 保存形式 */}
                  <tr>
                    <td style={formLabelTd}>保存形式</td>
                    <td style={formValueTd}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {(['電子取引', 'スキャナ保存', '未指定'] as const).map((fmt) => (
                          <label key={fmt} style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', fontSize: '13px' }}>
                            <input
                              type="radio"
                              name="saveFormat"
                              checked={saveFormat === fmt}
                              onChange={() => setSaveFormat(fmt)}
                            />
                            {fmt}
                          </label>
                        ))}
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* アクションエリア */}
            <div style={{
              padding: '12px 16px',
              borderTop: '1px solid #E1E1E1',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
              <button
                onClick={() => alert('Excel取込機能（モック）')}
                style={{
                  padding: '8px 20px',
                  background: '#087CB6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '13px',
                }}
              >
                Excel取込
              </button>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <span style={{ fontSize: '12px', color: '#555', fontWeight: 600 }}>登録期限:</span>
                <input
                  type="date"
                  value={registrationDeadline}
                  onChange={(e) => setRegistrationDeadline(e.target.value)}
                  style={{ ...inputStyleCompact, width: '160px' }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* ドラッグハンドル */}
        <div
          onMouseDown={handleDragStart}
          style={{
            width: '8px',
            cursor: 'col-resize',
            background: '#E1E1E1',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <div style={{
            width: '4px',
            height: '40px',
            background: '#8A8A8A',
            borderRadius: '2px',
          }} />
        </div>

        {/* ── 右カラム: プレビューエリア（常時表示） ── */}
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          background: '#F1F1F1',
        }}>
          {/* プレビューヘッダー */}
          <div style={{
            padding: '8px 16px',
            background: '#4A4A4A',
            color: 'white',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexShrink: 0,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '13px', fontWeight: 'bold' }}>見積依頼書 プレビュー</span>
              {showPreview && activeVendor && (
                <span style={{
                  background: '#087CB6',
                  padding: '2px 8px',
                  borderRadius: '4px',
                  fontSize: '11px',
                }}>
                  依頼先{activeVendorIndex + 1}: {activeVendor.vendorName || '（未入力）'}
                </span>
              )}
            </div>
            {showPreview && (
              <button
                onClick={() => window.print()}
                style={{
                  padding: '4px 12px',
                  background: 'rgba(255,255,255,0.15)',
                  color: 'white',
                  border: '1px solid rgba(255,255,255,0.3)',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '11px',
                }}
              >
                印刷
              </button>
            )}
          </div>

          {/* 帳票本体 or プレースホルダー */}
          {showPreview && activeVendor ? (
            <div style={{ flex: 1, overflow: 'auto', padding: '20px' }}>
              <div style={{
                background: 'white',
                border: '1px solid #E1E1E1',
                padding: '40px 48px',
                margin: '0 auto',
                fontFamily: '"Yu Mincho", "Hiragino Mincho ProN", serif',
                color: '#4A4A4A',
                lineHeight: 1.8,
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
              }}>
                {/* タイトル */}
                <h1 style={{
                  textAlign: 'center',
                  fontSize: '22px',
                  fontWeight: 'bold',
                  letterSpacing: '8px',
                  borderBottom: '2px solid #4A4A4A',
                  paddingBottom: '8px',
                  marginBottom: '28px',
                }}>
                  見積依頼書
                </h1>

                {/* 日付・依頼番号 */}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', fontSize: '12px' }}>
                  <div>
                    <span style={{ fontWeight: 'bold' }}>依頼番号:</span>{' '}
                    <span className="tabular-nums">{rfqGroup.rfqNo}</span>
                  </div>
                  <div>{today}</div>
                </div>

                {/* 宛先 */}
                <div style={{ marginBottom: '20px' }}>
                  <div style={{ fontSize: '15px', fontWeight: 'bold', borderBottom: '1px solid #555', display: 'inline-block', paddingBottom: '2px' }}>
                    {activeVendor.vendorName || '（業者名未入力）'}
                  </div>
                  <span style={{ fontSize: '15px', marginLeft: '4px' }}>御中</span>
                  {activeVendor.personInCharge && (
                    <div style={{ fontSize: '12px', color: '#555', marginTop: '4px' }}>
                      ご担当: {activeVendor.personInCharge} 様
                    </div>
                  )}
                </div>

                {/* 差出人 */}
                <div style={{ textAlign: 'right', marginBottom: '28px', fontSize: '12px' }}>
                  <div style={{ fontWeight: 'bold' }}>医療法人社団 サンプル病院</div>
                  <div>医療機器管理部</div>
                  <div style={{ marginTop: '4px', color: '#555' }}>
                    TEL: 03-0000-0000　FAX: 03-0000-0001
                  </div>
                </div>

                {/* 件名 */}
                <div style={{ marginBottom: '20px' }}>
                  <div style={{ fontSize: '12px', color: '#555', marginBottom: '4px' }}>件名</div>
                  <div style={{ fontSize: '14px', fontWeight: 'bold', padding: '6px 10px', background: '#FAFAFA', border: '1px solid #E1E1E1', borderRadius: '2px' }}>
                    {rfqGroup.groupName} に係るお見積りのお願い
                  </div>
                </div>

                {/* 本文 */}
                <div style={{ fontSize: '12px', marginBottom: '20px' }}>
                  <p style={{ margin: '0 0 6px' }}>
                    拝啓　時下ますますご清栄のこととお慶び申し上げます。
                  </p>
                  <p style={{ margin: '0 0 6px' }}>
                    下記の品目につきまして、お見積りをいただきたくお願い申し上げます。
                  </p>
                  <p style={{ margin: 0 }}>
                    ご多用中誠に恐縮ですが、ご対応のほどよろしくお願いいたします。
                  </p>
                </div>

                {/* 提出期限 */}
                {activeVendor.submitDeadline && (
                  <div style={{
                    marginBottom: '20px',
                    padding: '8px 12px',
                    background: '#FDF1E5',
                    border: '1px solid #4A4A4A',
                    borderRadius: '2px',
                    fontSize: '12px',
                  }}>
                    <span style={{ fontWeight: 'bold' }}>ご提出期限:</span>{' '}
                    <span className="tabular-nums">
                      {new Date(activeVendor.submitDeadline + 'T00:00:00').toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </span>
                  </div>
                )}

                {/* 依頼品目テーブル */}
                <div style={{ marginBottom: '20px' }}>
                  <div style={{ fontSize: '13px', fontWeight: 'bold', marginBottom: '6px', borderBottom: '1px solid #E1E1E1', paddingBottom: '4px' }}>
                    依頼品目（{editListItems.length}件）
                  </div>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
                    <thead>
                      <tr style={{ background: '#FAFAFA' }}>
                        <th style={previewThStyle}>No.</th>
                        <th style={previewThStyle}>部署</th>
                        <th style={previewThStyle}>室名</th>
                        <th style={previewThStyle}>品目</th>
                        <th style={previewThStyle}>参考型式</th>
                        <th style={previewThStyle}>備考</th>
                      </tr>
                    </thead>
                    <tbody>
                      {editListItems.length === 0 ? (
                        <tr>
                          <td colSpan={6} style={{ padding: '16px', textAlign: 'center', color: '#8A8A8A', border: '1px solid #E1E1E1' }}>
                            品目が登録されていません
                          </td>
                        </tr>
                      ) : (
                        editListItems.map((item, idx) => (
                          <tr key={item.id}>
                            <td style={{ ...previewTdStyle, textAlign: 'center' }} className="tabular-nums border border-stroke-input">{idx + 1}</td>
                            <td style={previewTdStyle}>{item.department || '-'}</td>
                            <td style={previewTdStyle}>{item.roomName || '-'}</td>
                            <td style={previewTdStyle}>{item.name || item.item || '-'}</td>
                            <td style={previewTdStyle}>{item.model || '-'}</td>
                            <td style={previewTdStyle}>{item.comment || '-'}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* ご依頼事項 */}
                {activeVendor.requestNote && (
                  <div style={{ marginBottom: '20px' }}>
                    <div style={{ fontSize: '13px', fontWeight: 'bold', marginBottom: '6px', borderBottom: '1px solid #E1E1E1', paddingBottom: '4px' }}>
                      ご依頼事項
                    </div>
                    <div style={{
                      padding: '10px 12px',
                      background: '#FAFAFA',
                      border: '1px solid #E1E1E1',
                      borderRadius: '2px',
                      fontSize: '12px',
                      whiteSpace: 'pre-wrap',
                      minHeight: '40px',
                    }}>
                      {activeVendor.requestNote}
                    </div>
                  </div>
                )}

                {/* 連絡先 */}
                <div style={{
                  marginTop: '24px',
                  paddingTop: '12px',
                  borderTop: '1px solid #E1E1E1',
                  fontSize: '11px',
                  color: '#555',
                }}>
                  <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>ご回答送付先</div>
                  {activeVendor.email && <div>E-mail: {activeVendor.email}</div>}
                  {activeVendor.tel && <div>TEL: {activeVendor.tel}</div>}
                  {!activeVendor.email && !activeVendor.tel && <div style={{ color: '#8A8A8A' }}>（連絡先未入力）</div>}
                </div>

                <div style={{ textAlign: 'right', marginTop: '24px', fontSize: '12px' }}>以上</div>
              </div>
            </div>
          ) : (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px' }}>
              <div style={{ textAlign: 'center', color: '#8A8A8A' }}>
                <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'center' }}><FileText size={48} aria-hidden /></div>
                <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '8px' }}>見積依頼書プレビュー</div>
                <div style={{ fontSize: '12px' }}>左側の基本情報を入力し「プレビュー」ボタンを押すと、見積依頼書が表示されます</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ===== フッター ===== */}
      <div style={{
        padding: '12px 16px',
        background: 'white',
        borderTop: '1px solid #E1E1E1',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        {/* 左: 戻る */}
        <button
          onClick={handleCancel}
          style={{
            padding: '8px 16px',
            background: '#8A8A8A',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '13px',
          }}
        >
          タスク管理に戻る
        </button>

        {/* 右: 登録へ */}
        <button
          onClick={handleProceedToRegistration}
          disabled={ocrProcessing}
          style={{
            padding: '8px 20px',
            background: ocrProcessing ? '#8A8A8A' : '#008C1D',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: ocrProcessing ? 'not-allowed' : 'pointer',
            fontSize: '13px',
            fontWeight: 'bold',
          }}
        >
          {ocrProcessing ? '処理中...' : '登録へ'}
        </button>
      </div>

      {/* OCR処理中オーバーレイ */}
      {ocrProcessing && (
        <div style={{
          position: 'fixed',
          inset: 0,
          zIndex: 1000,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '32px 48px',
            textAlign: 'center',
            boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
          }}>
            <div style={{ marginBottom: '12px', display: 'flex', justifyContent: 'center', color: '#8A8A8A' }}><Hourglass size={32} aria-hidden /></div>
            <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#4A4A4A', marginBottom: '8px' }}>
              OCR処理中...
            </div>
            <div style={{ fontSize: '13px', color: '#8A8A8A' }}>
              見積書のAI読み取りを実行しています
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ──────────────────────────────────────────────
// スタイル定数
// ──────────────────────────────────────────────
const inputStyle: React.CSSProperties = {
  flex: 1,
  padding: '6px 10px',
  border: '1px solid #E1E1E1',
  borderRadius: '4px',
  fontSize: '13px',
  minWidth: 0,
};

const disabledInputStyle: React.CSSProperties = {
  background: '#FAFAFA',
  color: '#8A8A8A',
};

const inputStyleCompact: React.CSSProperties = {
  padding: '6px 10px',
  border: '1px solid #E1E1E1',
  borderRadius: '4px',
  fontSize: '13px',
};

const textareaStyle: React.CSSProperties = {
  width: '100%',
  border: 'none',
  padding: '8px 12px',
  fontSize: '13px',
  resize: 'vertical',
  outline: 'none',
  boxSizing: 'border-box',
};

const accentBtnSmall: React.CSSProperties = {
  padding: '6px 10px',
  background: '#4A4A4A',
  color: 'white',
  border: 'none',
  borderRadius: '4px',
  cursor: 'pointer',
  fontSize: '11px',
  fontWeight: 'bold',
  whiteSpace: 'nowrap',
};

const formLabelTd: React.CSSProperties = {
  padding: '10px 16px',
  fontSize: '13px',
  fontWeight: 'bold',
  color: '#4A4A4A',
  background: '#FAFAFA',
  border: '1px solid #E1E1E1',
  whiteSpace: 'nowrap',
  verticalAlign: 'top',
  width: '120px',
};

const formValueTd: React.CSSProperties = {
  padding: '10px 16px',
  border: '1px solid #E1E1E1',
  verticalAlign: 'top',
};

const previewThStyle: React.CSSProperties = {
  padding: '6px 10px',
  border: '1px solid #E1E1E1',
  textAlign: 'left',
  fontWeight: 600,
  fontSize: '12px',
  whiteSpace: 'nowrap',
};

const previewTdStyle: React.CSSProperties = {
  padding: '6px 10px',
  border: '1px solid #E1E1E1',
  fontSize: '12px',
};

// ──────────────────────────────────────────────
// Page Export
// ──────────────────────────────────────────────
export default function RfqProcessPage() {
  return (
    <Suspense fallback={<div style={{ padding: '20px', textAlign: 'center' }}>読み込み中...</div>}>
      <RfqProcessContent />
    </Suspense>
  );
}
