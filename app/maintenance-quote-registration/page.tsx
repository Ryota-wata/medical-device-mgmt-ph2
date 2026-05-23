'use client';

import React, { useState, useEffect, Suspense, useRef, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Printer } from 'lucide-react';
import { useAuthStore } from '@/lib/stores';
import { Header } from '@/components/layouts/Header';
import { ACCOUNT_DIVISIONS } from '@/lib/data/account-divisions';
import { OrderRegistrationModal } from '@/components/ui/OrderRegistrationModal';

/** 保守契約登録のステップ定義 */
const MAINTENANCE_STEPS = [
  { step: 1, label: '見積依頼' },
  { step: 2, label: '見積登録' },
  { step: 3, label: '契約登録' },
  { step: 4, label: '完了登録' },
];

// 依頼先業者
interface RfqVendor {
  id: number;
  vendorName: string;
  personInCharge: string;
  email: string;
  tel: string;
  isSent: boolean;
}

// 登録済み見積
interface RegisteredQuotation {
  id: number;
  phase: '発注登録用見積' | '参考見積';
  saveFormat: '電子取引' | 'スキャナ保存' | '未指定';
  fileName: string;
  registeredAt: string;
  vendorName: string;
  personInCharge: string;
  quotationAmount: number;
  annualAmount: number;
}

// 登録済みドキュメント
interface RegisteredDocument {
  id: number;
  documentType: '契約書' | 'その他（免責部品一覧など）';
  accountType: string;
  accountOther?: string;
  fileName: string;
  registeredAt: string;
}

// 保守契約データ
interface MaintenanceContract {
  id: string;
  applicationDepartment: string;
  applicationPerson: string;
  applicationContact: string;
  maintenanceNo: string;
  contractGroupName: string;
  settlementNo: string;
  contractType: string;
  contractTypeMemo: string;
  contractPeriodStart: string;
  contractPeriodEnd: string;
  contractReviewStartDate: string;
  rfqNote: string;
  documentType: '契約書' | 'その他（免責部品一覧など）';
  accountType: string;
  accountOther: string;
  itemName: string;
  maker: string;
  model: string;
  assetCount: number;
}

const getMockContract = (id: string): MaintenanceContract => ({
  id,
  applicationDepartment: 'ME室',
  applicationPerson: '佐藤 花子',
  applicationContact: '内線2346',
  maintenanceNo: `MC-2026-${id.padStart(4, '0')}`,
  contractGroupName: '',
  settlementNo: '',
  contractType: '',
  contractTypeMemo: 'フルメンテナンス',
  contractPeriodStart: '',
  contractPeriodEnd: '',
  contractReviewStartDate: '',
  rfqNote: '',
  documentType: '契約書',
  accountType: '',
  accountOther: '',
  itemName: '人工呼吸器',
  maker: 'フィリップス',
  model: 'V680',
  assetCount: 2,
});

// ============================================================
// Tailwind class constants
// ============================================================
const inputCls =
  'h-[42px] px-3 rounded-lg bg-surface-card border border-stroke-input text-sm text-content-primary focus:outline-none focus:border-cta-primary transition-colors disabled:bg-stroke-card disabled:cursor-not-allowed';

// ============================================================
// Sub-components
// ============================================================

/** Step カード */
function Section({
  step,
  title,
  children,
  enabled,
  completed,
}: {
  step: number;
  title: string;
  children: React.ReactNode;
  enabled: boolean;
  completed: boolean;
}) {
  // Figma 構造: プレーンテキストヘッダー (色帯なし)、active/inactive は文字色で表現
  // 元モック文言 (STEP①./STEP②./STEP③./STEP④.) を保持
  // (step prop は未使用だが、呼び出し側API互換のため引数は残す)
  void step;
  const titleColor = enabled || completed ? 'text-content-primary' : 'text-content-sub';
  return (
    <div className={`bg-surface-card border border-stroke-card rounded-2xl mb-4 ${enabled ? 'opacity-100' : 'opacity-70'}`}>
      <div className="flex items-center gap-3 px-4 py-3 border-b border-stroke-card">
        <span className={`text-sm font-bold flex-1 ${titleColor}`}>
          {title}
        </span>
        {completed && <span className="text-xs text-cta-primary-dark border border-cta-primary px-2 py-0.5 rounded-full">完了</span>}
        {enabled && !completed && (
          <span className="text-xs text-cta-primary-dark border border-cta-primary px-2 py-0.5 rounded-full">作業中</span>
        )}
      </div>
      <div className={`p-4 ${enabled ? '' : 'pointer-events-none'}`}>{children}</div>
    </div>
  );
}

/** プログレスバー */
function ProgressBar({ activeStep }: { activeStep: number }) {
  return (
    <div className="flex items-center justify-center px-4 py-3 bg-stroke-card border-b border-stroke-input">
      {MAINTENANCE_STEPS.map((item, index) => {
        const isCompleted = item.step < activeStep;
        const isActive = item.step === activeStep;
        const circleClass = isCompleted
          ? 'bg-cta-primary-dark text-white'
          : isActive
          ? 'bg-cta-primary text-white border-2 border-cta-primary'
          : 'bg-stroke-input text-content-sub';
        const labelClass = isActive
          ? 'text-cta-primary font-bold'
          : isCompleted
          ? 'text-cta-primary-dark'
          : 'text-content-sub';
        return (
          <React.Fragment key={item.step}>
            <div className="flex flex-col items-center min-w-[80px]">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${circleClass}`}>
                {isCompleted ? '✓' : item.step}
              </div>
              <span className={`text-xs mt-1 text-center whitespace-nowrap ${labelClass}`}>
                {item.label}
              </span>
            </div>
            {index < MAINTENANCE_STEPS.length - 1 && (
              <div
                className={`flex-1 h-[3px] mx-2 mb-4 min-w-[24px] max-w-[60px] ${isCompleted ? 'bg-cta-primary-dark' : 'bg-stroke-input'}`}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

/** タグラベル（受付部署/ご依頼事項 用） */
function TagLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="bg-surface-select border border-cta-primary text-cta-primary-dark px-2 py-0.5 rounded-full text-xs font-bold">
      {children}
    </span>
  );
}

/** 灰背景ラベルセル */
function ThLabelCell({ children, width = 'w-[180px]' }: { children: React.ReactNode; width?: string }) {
  return (
    <td className={`${width} px-3 py-2.5 bg-stroke-card text-content-primary font-semibold border border-stroke-input align-middle text-sm`}>
      {children}
    </td>
  );
}

/** 白背景データセル */
function TdCell({ children }: { children: React.ReactNode }) {
  return (
    <td className="px-3 py-2.5 border border-stroke-input bg-surface-card text-sm text-content-primary">
      {children}
    </td>
  );
}

/** 読み取り専用セル */
function ReadOnlyTdCell({ children }: { children: React.ReactNode }) {
  return (
    <td className="px-3 py-2.5 border border-stroke-input bg-surface-screen text-sm text-content-primary">
      {children}
    </td>
  );
}

/** 業者テーブルヘッダー（緑） */
function VendorTh({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <th className={`px-2.5 py-2 bg-cta-primary text-white font-semibold text-xs border border-cta-primary whitespace-nowrap text-left ${className}`}>
      {children}
    </th>
  );
}

/** 業者テーブルデータセル */
function VendorTd({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <td className={`px-2 py-1.5 border border-stroke-input text-xs align-middle ${className}`}>
      {children}
    </td>
  );
}

// ============================================================
// Main content
// ============================================================
function MaintenanceQuoteRegistrationContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const contractId = searchParams.get('id') || '1';
  const user = useAuthStore((s) => s.user);

  const [formData, setFormData] = useState<MaintenanceContract | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState<number>(1);

  const [rfqVendors, setRfqVendors] = useState<RfqVendor[]>([
    { id: 1, vendorName: 'フィリップス・ジャパン', personInCharge: '田中 太郎', email: 'tanaka@philips.example.com', tel: '03-1234-5678', isSent: false },
    { id: 2, vendorName: '', personInCharge: '', email: '', tel: '', isSent: false },
    { id: 3, vendorName: '', personInCharge: '', email: '', tel: '', isSent: false },
  ]);

  const [registeredQuotations, setRegisteredQuotations] = useState<RegisteredQuotation[]>([]);
  const [selectedQuotationFile, setSelectedQuotationFile] = useState<string>('');
  const [quotationPhase, setQuotationPhase] = useState<'発注登録用見積' | '参考見積'>('発注登録用見積');
  const [saveFormat, setSaveFormat] = useState<'電子取引' | 'スキャナ保存' | '未指定'>('未指定');
  const [selectedQuotationVendorId, setSelectedQuotationVendorId] = useState<number | ''>('');
  const [quotationAmount, setQuotationAmount] = useState<string>('');
  const [quotationAccountDivision, setQuotationAccountDivision] = useState<string>('');
  const [isOrderRegisterModalOpen, setIsOrderRegisterModalOpen] = useState(false);
  const [registeredOrderNo, setRegisteredOrderNo] = useState<string>('');
  const [annualAmount, setAnnualAmount] = useState<string>('');

  const [registeredDocuments, setRegisteredDocuments] = useState<RegisteredDocument[]>([]);

  // Figma 構造: 右サイドバーは単一プレビュー (activeStep 連動、宣言は下の方なので関数経由)
  const [previewQuotationIndex, setPreviewQuotationIndex] = useState<number | null>(null);
  const [previewDocumentIndex, setPreviewDocumentIndex] = useState<number | null>(null);

  const [leftPanelWidth, setLeftPanelWidth] = useState<number>(55);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef<boolean>(false);

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

  useEffect(() => {
    const departmentDefault = user?.department || 'ME室';
    const storedData = sessionStorage.getItem('maintenanceContract');
    if (storedData) {
      try {
        const parsed = JSON.parse(storedData);
        const data: MaintenanceContract = {
          ...getMockContract(contractId),
          applicationDepartment: parsed.managementDepartment || departmentDefault,
          contractGroupName: parsed.contractGroupName || '',
          contractType: parsed.contractType || '',
          itemName: parsed.item || '人工呼吸器',
          maker: parsed.maker || 'フィリップス',
        };
        setFormData({ ...data });
      } catch {
        setFormData({ ...getMockContract(contractId), applicationDepartment: departmentDefault });
      }
    } else {
      setFormData({ ...getMockContract(contractId), applicationDepartment: departmentDefault });
    }
  }, [contractId, user?.department]);

  const activeStep = currentStep;
  // Figma 構造: 右プレビューエリア top に 4 横タブあり (manual 切替)
  const [previewTab, setPreviewTab] = useState<number>(1);
  const isStepEnabled = (step: number) => step <= activeStep;

  if (!formData) {
    return (
      <div className="flex flex-col min-h-dvh bg-surface-screen">
        <Header title="保守契約管理" hideMenu={true} showBackButton={false} />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-content-sub">読み込み中...</p>
        </div>
      </div>
    );
  }

  const updateFormData = (updates: Partial<MaintenanceContract>) => {
    setFormData(prev => prev ? { ...prev, ...updates } : prev);
  };

  const filledVendors = rfqVendors.filter(v => v.vendorName.trim() !== '');

  // === Handlers ===
  const handleStep1Complete = () => {
    const sentVendors = rfqVendors.filter(v => v.isSent);
    if (sentVendors.length === 0) {
      alert('少なくとも1社に見積依頼を送信してください。');
      return;
    }
    setIsSubmitting(true);
    setTimeout(() => {
      setCurrentStep(2);
      setPreviewTab(2);
      setIsSubmitting(false);
    }, 300);
  };

  const handleRejectApplication = () => {
    if (confirm('申請を見送りますか？この操作は元に戻せません。')) {
      alert('申請を見送りました。');
      router.push('/quotation-data-box/maintenance-contracts');
    }
  };

  const handleStep2Complete = () => {
    setIsSubmitting(true);
    setTimeout(() => {
      setCurrentStep(3);
      setPreviewTab(3);
      setIsSubmitting(false);
    }, 300);
  };

  const handleStep3Complete = () => {
    setIsSubmitting(true);
    setTimeout(() => {
      setCurrentStep(4);
      setPreviewTab(4);
      setIsSubmitting(false);
    }, 300);
  };

  const handleFinalComplete = () => {
    setIsSubmitting(true);
    setTimeout(() => {
      alert('保守契約の登録が完了しました。');
      router.push('/quotation-data-box/maintenance-contracts');
      setIsSubmitting(false);
    }, 500);
  };

  const updateVendor = (id: number, updates: Partial<RfqVendor>) => {
    setRfqVendors(prev => prev.map(v => v.id === id ? { ...v, ...updates } : v));
  };

  const handleSendRfq = (vendorId: number) => {
    const vendor = rfqVendors.find(v => v.id === vendorId);
    if (!vendor || !vendor.vendorName.trim()) {
      alert('業者名を入力してください。');
      return;
    }
    if (confirm(`${vendor.vendorName} に見積依頼を送信しますか？`)) {
      updateVendor(vendorId, { isSent: true });
    }
  };

  const handleRegisterQuotation = () => {
    if (!selectedQuotationFile) return;
    const vendor = filledVendors.find(v => v.id === selectedQuotationVendorId);
    const newQuotation: RegisteredQuotation = {
      id: Date.now(),
      phase: quotationPhase,
      saveFormat,
      fileName: selectedQuotationFile,
      registeredAt: new Date().toISOString(),
      vendorName: vendor?.vendorName || '',
      personInCharge: vendor?.personInCharge || '',
      quotationAmount: parseInt(quotationAmount.replace(/,/g, ''), 10) || 0,
      annualAmount: parseInt(annualAmount.replace(/,/g, ''), 10) || 0,
    };
    setRegisteredQuotations(prev => [...prev, newQuotation]);
    setSelectedQuotationFile('');
    setQuotationAmount('');
    setQuotationAccountDivision('');
    setAnnualAmount('');
    setSelectedQuotationVendorId('');
  };

  const handleQuotationDelete = (id: number) => {
    if (confirm('この見積を削除しますか？')) {
      setRegisteredQuotations(prev => prev.filter(q => q.id !== id));
      setPreviewQuotationIndex(null);
    }
  };

  const handleDocumentDelete = (id: number) => {
    if (confirm('このドキュメントを削除しますか？')) {
      setRegisteredDocuments(prev => prev.filter(d => d.id !== id));
      setPreviewDocumentIndex(null);
    }
  };

  return (
    <div className="flex flex-col min-h-dvh bg-surface-screen">
      <Header
        title="保守契約管理"
        hideMenu={true}
        showBackButton={true}
        backHref="/quotation-data-box/maintenance-contracts"
        backLabel="一覧に戻る"
        backButtonVariant="secondary"
        hideHomeButton={true}
      />

      <ProgressBar activeStep={activeStep} />

      {/* 基本情報バー */}
      <div className="flex gap-6 flex-wrap px-4 py-2 bg-surface-select border-b border-cta-primary text-xs text-cta-primary-dark">
        <span><strong>保守No:</strong> {formData.maintenanceNo}</span>
        <span><strong>品目:</strong> {formData.itemName}</span>
        <span><strong>メーカー:</strong> {formData.maker}</span>
        <span><strong>型式:</strong> {formData.model}</span>
        <span><strong>対象台数:</strong> {formData.assetCount}台</span>
      </div>

      {/* メインコンテンツ */}
      <div ref={containerRef} className="flex flex-1 min-h-0 relative">
        {/* 左側: タスク入力エリア */}
        <div
          className="flex flex-col overflow-auto p-4"
          style={{ width: `${leftPanelWidth}%` }}
        >
          {/* ===== STEP① ===== */}
          <Section step={1} title="STEP①. 見積依頼" enabled={isStepEnabled(1)} completed={1 < activeStep}>
            <div className="px-3.5 py-2.5 bg-surface-select rounded-md mb-4 text-sm text-cta-primary-dark leading-relaxed">
              業者を登録し見積依頼書を作成してください。プレビューで内容を確認後、依頼を送信できます。
            </div>

            {/* 受付部署 */}
            <div className="mb-4">
              <div className="mb-2 flex items-center gap-2">
                <TagLabel>受付部署</TagLabel>
              </div>
              <table className="w-full border-collapse">
                <tbody>
                  <tr>
                    <ThLabelCell>部署名</ThLabelCell>
                    <ReadOnlyTdCell>{formData.applicationDepartment || '（未設定）'}</ReadOnlyTdCell>
                  </tr>
                  <tr>
                    <ThLabelCell>担当者名</ThLabelCell>
                    <ReadOnlyTdCell>{formData.applicationPerson || '（未設定）'}</ReadOnlyTdCell>
                  </tr>
                  <tr>
                    <ThLabelCell>連絡先</ThLabelCell>
                    <ReadOnlyTdCell>{formData.applicationContact || '（未設定）'}</ReadOnlyTdCell>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* 依頼先テーブル */}
            <div className="mb-4">
              <p className="text-sm font-bold text-cta-primary-dark mb-2">依頼先</p>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr>
                      <VendorTh className="w-[30px] text-center">#</VendorTh>
                      <VendorTh>業者名</VendorTh>
                      <VendorTh>担当者</VendorTh>
                      <VendorTh>メール</VendorTh>
                      <VendorTh>連絡先</VendorTh>
                      <VendorTh className="text-center w-[160px]">操作</VendorTh>
                    </tr>
                  </thead>
                  <tbody>
                    {rfqVendors.map((vendor, idx) => (
                      <tr key={vendor.id} className={idx % 2 === 0 ? 'bg-surface-card' : 'bg-surface-screen'}>
                        <VendorTd className="text-center font-bold text-content-sub">{idx + 1}</VendorTd>
                        <VendorTd>
                          <input
                            type="text"
                            value={vendor.vendorName}
                            onChange={(e) => updateVendor(vendor.id, { vendorName: e.target.value })}
                            placeholder="業者名"
                            disabled={vendor.isSent || !isStepEnabled(1)}
                            className={`${inputCls} h-8 text-xs w-full disabled:bg-stroke-card`}
                          />
                        </VendorTd>
                        <VendorTd>
                          <input
                            type="text"
                            value={vendor.personInCharge}
                            onChange={(e) => updateVendor(vendor.id, { personInCharge: e.target.value })}
                            placeholder="担当者"
                            disabled={vendor.isSent || !isStepEnabled(1)}
                            className={`${inputCls} h-8 text-xs w-full disabled:bg-stroke-card`}
                          />
                        </VendorTd>
                        <VendorTd>
                          <input
                            type="email"
                            value={vendor.email}
                            onChange={(e) => updateVendor(vendor.id, { email: e.target.value })}
                            placeholder="email@example.com"
                            disabled={vendor.isSent || !isStepEnabled(1)}
                            className={`${inputCls} h-8 text-xs w-full disabled:bg-stroke-card`}
                          />
                        </VendorTd>
                        <VendorTd>
                          <input
                            type="text"
                            value={vendor.tel}
                            onChange={(e) => updateVendor(vendor.id, { tel: e.target.value })}
                            placeholder="03-xxxx-xxxx"
                            disabled={vendor.isSent || !isStepEnabled(1)}
                            className={`${inputCls} h-8 text-xs w-[120px] disabled:bg-stroke-card`}
                          />
                        </VendorTd>
                        <VendorTd className="text-center">
                          {vendor.isSent ? (
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-surface-select text-cta-primary">
                              送信済
                            </span>
                          ) : vendor.vendorName.trim() ? (
                            <div className="flex gap-1 justify-center">
                              <button
                                onClick={() => setPreviewTab(1)}
                                className="px-2.5 py-1 bg-stroke-card text-content-primary border border-stroke-input rounded-md cursor-pointer text-xs hover:bg-stroke-input transition-colors"
                              >
                                プレビュー
                              </button>
                              <button
                                onClick={() => handleSendRfq(vendor.id)}
                                disabled={!isStepEnabled(1)}
                                className="px-2.5 py-1 bg-cta-primary text-white border-0 rounded-md cursor-pointer text-xs font-bold hover:bg-cta-primary-dark transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                              >
                                依頼送信
                              </button>
                            </div>
                          ) : (
                            <span className="text-content-sub text-xs">---</span>
                          )}
                        </VendorTd>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* ご依頼事項 */}
            <div className="mb-4">
              <div className="mb-2 flex items-center gap-2">
                <TagLabel>ご依頼事項</TagLabel>
              </div>
              <textarea
                placeholder="例：廃棄品の引取りをお願いします / 見積書を作成してください"
                value={formData.rfqNote}
                onChange={(e) => updateFormData({ rfqNote: e.target.value })}
                disabled={!isStepEnabled(1)}
                className="w-full px-3 py-2 rounded-lg bg-surface-card border border-stroke-input text-sm text-content-primary min-h-[80px] resize-y focus:outline-none focus:border-cta-primary transition-colors disabled:bg-stroke-card"
              />
            </div>

            <div className="flex justify-between mt-4">
              <button
                onClick={handleRejectApplication}
                disabled={!isStepEnabled(1) || isSubmitting}
                className="h-10 px-6 rounded-lg bg-surface-card text-content-alert border-2 border-content-alert text-sm font-bold cursor-pointer hover:bg-surface-screen transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                申請を見送る
              </button>
              <button
                onClick={handleStep1Complete}
                disabled={!isStepEnabled(1) || isSubmitting}
                className="h-10 px-6 rounded-lg bg-cta-primary text-white border-0 text-sm font-bold cursor-pointer hover:bg-cta-primary-dark transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                見積依頼完了→STEP②へ
              </button>
            </div>
          </Section>

          {/* ===== STEP② ===== */}
          <Section step={2} title="STEP②. 見積登録" enabled={isStepEnabled(2)} completed={2 < activeStep}>
            <div className="px-3.5 py-2.5 bg-surface-select rounded-md mb-4 text-sm text-cta-primary-dark leading-relaxed">
              見積書をファイル選択して登録し、業者名と見積金額を入力してください。
            </div>

            {/* 見積を追加テーブル */}
            <div className="mb-5">
              <p className="text-sm font-bold text-cta-primary-dark mb-2">見積を追加</p>
              <table className="w-full border-collapse border border-stroke-input">
                <tbody>
                  <tr>
                    <ThLabelCell>添付ファイル</ThLabelCell>
                    <TdCell>
                      <div className="flex items-center gap-2.5">
                        <label className={`px-4 py-1.5 bg-stroke-card border border-stroke-input rounded-md text-sm whitespace-nowrap hover:bg-stroke-input transition-colors ${isStepEnabled(2) ? 'cursor-pointer' : 'cursor-not-allowed opacity-60'}`}>
                          ファイルの選択
                          <input
                            type="file"
                            accept=".pdf,.jpg,.jpeg,.png"
                            disabled={!isStepEnabled(2)}
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) setSelectedQuotationFile(file.name);
                            }}
                            className="hidden"
                          />
                        </label>
                        <span className={`text-sm ${selectedQuotationFile ? 'text-cta-primary' : 'text-content-sub'}`}>
                          {selectedQuotationFile || 'ファイルが選択されていません'}
                        </span>
                      </div>
                    </TdCell>
                  </tr>
                  <tr>
                    <ThLabelCell>業者名</ThLabelCell>
                    <ReadOnlyTdCell>
                      <span className="text-content-sub">
                        {filledVendors.length > 0
                          ? filledVendors.map(v => v.vendorName).join('、')
                          : '（STEP①で業者を登録してください）'}
                      </span>
                    </ReadOnlyTdCell>
                  </tr>
                  <tr>
                    <ThLabelCell>見積フェーズ</ThLabelCell>
                    <TdCell>
                      <div className="flex flex-col gap-1.5">
                        <label className="flex items-center gap-1.5 cursor-pointer text-sm">
                          <input
                            type="radio"
                            name="quotationPhase"
                            checked={quotationPhase === '発注登録用見積'}
                            onChange={() => setQuotationPhase('発注登録用見積')}
                            disabled={!isStepEnabled(2)}
                            className="accent-cta-primary"
                          />
                          発注登録用見積
                        </label>
                        <label className="flex items-center gap-1.5 cursor-pointer text-sm">
                          <input
                            type="radio"
                            name="quotationPhase"
                            checked={quotationPhase === '参考見積'}
                            onChange={() => setQuotationPhase('参考見積')}
                            disabled={!isStepEnabled(2)}
                            className="accent-cta-primary"
                          />
                          参考見積
                        </label>
                      </div>
                    </TdCell>
                  </tr>
                  <tr>
                    <ThLabelCell>保存形式</ThLabelCell>
                    <TdCell>
                      <div className="flex flex-col gap-1.5">
                        {(['電子取引', 'スキャナ保存', '未指定'] as const).map(fmt => (
                          <label key={fmt} className="flex items-center gap-1.5 cursor-pointer text-sm">
                            <input
                              type="radio"
                              name="saveFormat"
                              checked={saveFormat === fmt}
                              onChange={() => setSaveFormat(fmt)}
                              disabled={!isStepEnabled(2)}
                              className="accent-cta-primary"
                            />
                            {fmt}
                          </label>
                        ))}
                      </div>
                    </TdCell>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* 見積登録業者セクション */}
            <div className="mb-5 border-2 border-cta-primary rounded-lg p-4">
              <p className="text-sm font-bold text-cta-primary mb-3">見積登録業者</p>
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  <label className="text-sm font-bold min-w-[120px]">業者名</label>
                  <select
                    value={selectedQuotationVendorId}
                    onChange={(e) => setSelectedQuotationVendorId(e.target.value ? parseInt(e.target.value, 10) : '')}
                    disabled={!isStepEnabled(2)}
                    className={`${inputCls} w-[250px]`}
                  >
                    <option value="">選択してください</option>
                    {filledVendors.map(v => (
                      <option key={v.id} value={v.id}>{v.vendorName}</option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center gap-3">
                  <label className="text-sm font-bold min-w-[120px]">担当者</label>
                  <span className="text-sm text-content-sub">
                    {filledVendors.find(v => v.id === selectedQuotationVendorId)?.personInCharge || '---'}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <label className="text-sm font-bold min-w-[120px]">見積金額（税別）</label>
                  <div className="flex items-center gap-1">
                    <span className="text-sm font-bold">¥</span>
                    <input
                      type="text"
                      placeholder="0"
                      value={quotationAmount}
                      onChange={(e) => setQuotationAmount(e.target.value)}
                      disabled={!isStepEnabled(2)}
                      className={`${inputCls} w-[160px] tabular-nums`}
                    />
                    <span className="text-xs text-content-sub">（税別）</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <label className="text-sm font-bold min-w-[120px]">単年度金額</label>
                  <div className="flex items-center gap-1">
                    <span className="text-sm font-bold">¥</span>
                    <input
                      type="text"
                      placeholder="0"
                      value={annualAmount}
                      onChange={(e) => setAnnualAmount(e.target.value)}
                      disabled={!isStepEnabled(2)}
                      className={`${inputCls} w-[160px] bg-[#FAFAFA] tabular-nums`}
                    />
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <label className="text-sm font-bold min-w-[120px]">会計区分</label>
                  <select
                    value={quotationAccountDivision}
                    onChange={(e) => setQuotationAccountDivision(e.target.value)}
                    disabled={!isStepEnabled(2)}
                    className={`${inputCls} w-[250px]`}
                  >
                    <option value="">選択してください</option>
                    {ACCOUNT_DIVISIONS.map((d) => (
                      <option key={d.value} value={d.value}>{d.label}</option>
                    ))}
                  </select>
                </div>
                <div className="flex justify-end">
                  <button
                    onClick={handleRegisterQuotation}
                    disabled={!isStepEnabled(2) || !selectedQuotationFile}
                    className={`h-9 px-5 rounded-md text-white text-sm font-bold transition-colors ${selectedQuotationFile ? 'bg-cta-primary hover:bg-cta-primary-dark cursor-pointer' : 'bg-content-sub cursor-not-allowed'}`}
                  >
                    見積書の登録
                  </button>
                </div>

                {quotationPhase === '発注登録用見積' && registeredQuotations.some((q) => q.phase === '発注登録用見積') && (
                  <div className="mt-2 pt-3 border-t border-dashed border-stroke-input">
                    <p className="text-xs font-bold text-cta-primary-dark mb-2">
                      発注登録用見積として登録済み — 発注登録に進めます
                    </p>
                    <div className="flex items-center gap-3 mb-3">
                      <label className="text-sm font-bold min-w-[120px]">決済No,</label>
                      <input
                        type="text"
                        value={formData.settlementNo}
                        onChange={(e) => updateFormData({ settlementNo: e.target.value })}
                        placeholder="院内の任意の決済番号"
                        disabled={!isStepEnabled(2)}
                        className={`${inputCls} w-[250px]`}
                      />
                    </div>
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => alert('発注書プレビュー（mock）')}
                        disabled={!isStepEnabled(2)}
                        className="h-9 px-4 bg-content-primary text-white border-0 rounded-md text-sm font-bold cursor-pointer hover:bg-content-primary/90 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        発注書プレビュー
                      </button>
                      <button
                        onClick={() => setIsOrderRegisterModalOpen(true)}
                        disabled={!isStepEnabled(2) || !!registeredOrderNo}
                        className={`h-9 px-4 text-white border-0 rounded-md text-sm font-bold transition-colors ${registeredOrderNo ? 'bg-content-sub cursor-not-allowed' : 'bg-cta-primary hover:bg-cta-primary-dark cursor-pointer'} disabled:cursor-not-allowed`}
                      >
                        {registeredOrderNo ? `発注登録済 (${registeredOrderNo})` : '発注登録'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* 登録済み見積一覧 */}
            {registeredQuotations.length > 0 && (
              <div className="mb-4">
                <p className="text-sm font-bold text-content-primary mb-2">
                  登録済み見積（{registeredQuotations.length}件）
                </p>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-xs">
                    <thead>
                      <tr className="bg-stroke-card">
                        <th className="px-2 py-2 text-left border-b border-stroke-input font-semibold">フェーズ</th>
                        <th className="px-2 py-2 text-left border-b border-stroke-input font-semibold">業者名</th>
                        <th className="px-2 py-2 text-right border-b border-stroke-input font-semibold">見積金額</th>
                        <th className="px-2 py-2 text-left border-b border-stroke-input font-semibold">ファイル名</th>
                        <th className="px-2 py-2 text-center border-b border-stroke-input w-[60px]"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {registeredQuotations.map((q) => (
                        <tr key={q.id} className="border-b border-stroke-input">
                          <td className="px-2 py-2 border border-stroke-input">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${q.phase === '発注登録用見積' ? 'bg-surface-select text-cta-primary-dark' : 'bg-stroke-card text-content-sub'}`}>
                              {q.phase === '発注登録用見積' ? '発注登録用' : '参考'}
                            </span>
                          </td>
                          <td className="px-2 py-2 border border-stroke-input">{q.vendorName || '---'}</td>
                          <td className="px-2 py-2 text-right tabular-nums border border-stroke-input">
                            {q.quotationAmount > 0 ? `¥${q.quotationAmount.toLocaleString()}` : '---'}
                          </td>
                          <td className="px-2 py-2 border border-stroke-input">{q.fileName}</td>
                          <td className="px-2 py-2 text-center border border-stroke-input">
                            <button
                              onClick={() => handleQuotationDelete(q.id)}
                              disabled={!isStepEnabled(2)}
                              className="px-2 py-0.5 bg-transparent text-content-alert border border-content-alert rounded-md cursor-pointer text-xs hover:bg-surface-card transition-colors disabled:opacity-50"
                            >
                              削除
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div className="flex justify-end mt-4">
              <button
                onClick={handleStep2Complete}
                disabled={!isStepEnabled(2) || isSubmitting}
                className="h-10 px-6 rounded-lg bg-cta-primary text-white border-0 text-sm font-bold cursor-pointer hover:bg-cta-primary-dark transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                見積登録完了→STEP③へ
              </button>
            </div>
          </Section>

          {/* ===== STEP③ ===== */}
          <Section step={3} title="STEP③. 契約登録" enabled={isStepEnabled(3)} completed={3 < activeStep}>
            <table className="w-full border-collapse text-sm">
              <tbody>
                <tr>
                  <ThLabelCell>決済No,</ThLabelCell>
                  <TdCell>
                    <input
                      type="text"
                      value={formData.settlementNo}
                      onChange={(e) => updateFormData({ settlementNo: e.target.value })}
                      placeholder="院内の任意の決済番号"
                      disabled={!isStepEnabled(3)}
                      className={`${inputCls} w-[240px]`}
                    />
                  </TdCell>
                </tr>
                <tr>
                  <ThLabelCell>契約グループ</ThLabelCell>
                  <ReadOnlyTdCell>{formData.contractGroupName || '（未設定）'}</ReadOnlyTdCell>
                </tr>
                <tr>
                  <ThLabelCell>契約種別</ThLabelCell>
                  <ReadOnlyTdCell>{formData.contractType || '（未設定）'}</ReadOnlyTdCell>
                </tr>
                <tr>
                  <ThLabelCell>種別備考</ThLabelCell>
                  <TdCell>
                    <select
                      value={formData.contractTypeMemo}
                      onChange={(e) => updateFormData({ contractTypeMemo: e.target.value })}
                      disabled={!isStepEnabled(3)}
                      className={`${inputCls} w-[200px]`}
                    >
                      <option value="フルメンテナンス">フルメンテナンス</option>
                      <option value="定期点検">定期点検</option>
                      <option value="スポット対応">スポット対応</option>
                      <option value="POG契約">POG契約</option>
                    </select>
                  </TdCell>
                </tr>
                <tr>
                  <ThLabelCell>契約期間</ThLabelCell>
                  <TdCell>
                    <div className="flex items-center gap-2">
                      <input
                        type="date"
                        value={formData.contractPeriodStart}
                        onChange={(e) => updateFormData({ contractPeriodStart: e.target.value })}
                        disabled={!isStepEnabled(3)}
                        className={`${inputCls} w-[160px] tabular-nums`}
                      />
                      <span>〜</span>
                      <input
                        type="date"
                        value={formData.contractPeriodEnd}
                        onChange={(e) => updateFormData({ contractPeriodEnd: e.target.value })}
                        disabled={!isStepEnabled(3)}
                        className={`${inputCls} w-[160px] tabular-nums`}
                      />
                    </div>
                  </TdCell>
                </tr>
              </tbody>
            </table>

            <div className="flex justify-end mt-4">
              <button
                onClick={handleStep3Complete}
                disabled={!isStepEnabled(3) || isSubmitting}
                className="h-10 px-6 rounded-lg bg-cta-primary text-white border-0 text-sm font-bold cursor-pointer hover:bg-cta-primary-dark transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                契約登録完了→STEP④へ
              </button>
            </div>
          </Section>

          {/* ===== STEP④ ===== */}
          <Section step={4} title="STEP④. 完了登録（添付ドキュメントの登録）" enabled={isStepEnabled(4)} completed={4 < activeStep}>
            <table className="w-full border-collapse text-sm">
              <tbody>
                <tr>
                  <ThLabelCell>添付ファイル</ThLabelCell>
                  <TdCell>
                    <div className="flex items-center gap-3">
                      <label className={`px-4 py-1.5 bg-stroke-card border border-stroke-input rounded-md text-sm hover:bg-stroke-input transition-colors ${isStepEnabled(4) ? 'cursor-pointer' : 'cursor-not-allowed opacity-60'}`}>
                        ファイルの選択
                        <input
                          type="file"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const newDocument: RegisteredDocument = {
                                id: Date.now(),
                                documentType: formData.documentType,
                                accountType: formData.accountType,
                                accountOther: formData.accountOther,
                                fileName: file.name,
                                registeredAt: new Date().toISOString(),
                              };
                              setRegisteredDocuments(prev => [...prev, newDocument]);
                              alert(`ドキュメント「${file.name}」を登録しました。`);
                            }
                          }}
                          disabled={!isStepEnabled(4)}
                        />
                      </label>
                      <span className="text-sm text-content-sub">ファイルが選択されていません</span>
                    </div>
                  </TdCell>
                </tr>
                <tr>
                  <ThLabelCell>ドキュメント種別</ThLabelCell>
                  <TdCell>
                    <div className="flex items-center gap-4">
                      <label className="flex items-center gap-1 cursor-pointer text-sm">
                        <input
                          type="radio"
                          name="documentType"
                          checked={formData.documentType === '契約書'}
                          onChange={() => updateFormData({ documentType: '契約書' })}
                          disabled={!isStepEnabled(4)}
                          className="accent-cta-primary"
                        />
                        契約書
                      </label>
                      <label className="flex items-center gap-1 cursor-pointer text-sm">
                        <input
                          type="radio"
                          name="documentType"
                          checked={formData.documentType === 'その他（免責部品一覧など）'}
                          onChange={() => updateFormData({ documentType: 'その他（免責部品一覧など）' })}
                          disabled={!isStepEnabled(4)}
                          className="accent-cta-primary"
                        />
                        その他（免責部品一覧など）
                      </label>
                    </div>
                  </TdCell>
                </tr>
              </tbody>
            </table>

            <div className="flex justify-between mt-4">
              <button
                disabled={!isStepEnabled(4) || isSubmitting}
                className="h-10 px-6 rounded-lg bg-surface-card text-cta-primary border-2 border-cta-primary text-sm font-bold cursor-pointer hover:bg-surface-select transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                明細の登録
              </button>
              <button
                onClick={handleFinalComplete}
                disabled={!isStepEnabled(4) || isSubmitting}
                className="h-10 px-6 rounded-lg bg-cta-primary text-white border-0 text-base font-bold cursor-pointer hover:bg-cta-primary-dark transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                保守登録
              </button>
            </div>
          </Section>
        </div>

        {/* ドラッグハンドル */}
        <div
          onMouseDown={handleDragStart}
          className="w-2 cursor-col-resize bg-stroke-card flex items-center justify-center shrink-0"
        >
          <div className="w-1 h-10 bg-stroke-input rounded" />
        </div>

        {/* 右側: プレビューエリア (Figma 構造: top に 4 横タブ + Printer アイコン) */}
        <div className="flex-1 flex flex-col overflow-hidden bg-stroke-card">
          {/* 4 横タブ */}
          <div className="flex items-stretch bg-surface-card border-b border-stroke-input">
            {MAINTENANCE_STEPS.map((item) => {
              const isActive = previewTab === item.step;
              return (
                <button
                  key={item.step}
                  onClick={() => {
                    setPreviewTab(item.step);
                    if (item.step !== 2) setPreviewQuotationIndex(null);
                    if (item.step !== 4) setPreviewDocumentIndex(null);
                  }}
                  className={`flex-1 px-3 py-3 text-xs font-bold cursor-pointer border-0 border-b-[3px] transition-colors ${
                    isActive
                      ? 'border-b-cta-primary text-cta-primary-dark bg-surface-card'
                      : 'border-b-transparent text-content-sub bg-surface-card hover:bg-stroke-card'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
            <button
              className="inline-flex items-center justify-center w-10 h-10 bg-surface-card border-0 border-b-[3px] border-b-transparent text-content-sub cursor-pointer hover:text-content-primary transition-colors shrink-0"
              aria-label="印刷"
              title="印刷"
            >
              <Printer size={18} />
            </button>
          </div>
          {/* タブヘッダー: タイトル */}
          <div className="px-4 py-3 border-b border-stroke-input bg-surface-card">
            <h3 className="m-0 text-sm font-bold text-content-primary">
              {previewTab === 1 && '見積依頼書プレビュー'}
              {previewTab === 2 && (previewQuotationIndex !== null
                ? `見積プレビュー - ${registeredQuotations[previewQuotationIndex]?.fileName || ''}`
                : '登録済み見積一覧')}
              {previewTab === 3 && '契約情報プレビュー'}
              {previewTab === 4 && (previewDocumentIndex !== null
                ? `ドキュメントプレビュー - ${registeredDocuments[previewDocumentIndex]?.fileName || ''}`
                : '登録済みドキュメント一覧')}
            </h3>
          </div>

          <div className="flex-1 p-4 overflow-auto">
            {/* STEP①: 見積依頼書プレビュー */}
            {previewTab === 1 && (
              <div className="bg-surface-card border border-stroke-input rounded-2xl p-6">
                <h4 className="text-base font-bold mb-4 text-content-primary text-center">見積依頼書</h4>
                <div className="p-4 bg-surface-screen rounded-md mb-4 text-sm">
                  <p className="mb-2"><strong>保守No:</strong> {formData.maintenanceNo}</p>
                  <p className="mb-2"><strong>品目:</strong> {formData.itemName}</p>
                  <p className="mb-2"><strong>メーカー:</strong> {formData.maker}</p>
                  <p><strong>対象台数:</strong> {formData.assetCount}台</p>
                </div>
                <div className="p-4 bg-surface-select rounded-md mb-4 text-sm">
                  <p className="font-bold mb-2 text-cta-primary-dark">受付部署</p>
                  <p>{formData.applicationDepartment} / {formData.applicationPerson} / {formData.applicationContact}</p>
                </div>
                {formData.rfqNote ? (
                  <div className="p-4 bg-surface-select rounded-md text-sm">
                    <p className="font-bold mb-2 text-cta-primary-dark">ご依頼事項</p>
                    <p className="whitespace-pre-wrap">{formData.rfqNote}</p>
                  </div>
                ) : (
                  <p className="text-center text-content-sub p-4 text-sm">
                    ご依頼事項が入力されるとここに表示されます
                  </p>
                )}
              </div>
            )}

            {/* STEP②: 見積一覧 */}
            {previewTab === 2 && previewQuotationIndex === null && (
              <div className="bg-surface-card border border-stroke-input rounded-2xl p-4">
                <h4 className="text-sm font-bold mb-3 text-content-primary">登録済み見積一覧</h4>
                {registeredQuotations.length > 0 ? (
                  <table className="w-full border-collapse text-xs">
                    <thead>
                      <tr className="bg-cta-primary text-white">
                        <th className="px-2 py-2 text-left border border-stroke-input">ファイル名</th>
                        <th className="px-2 py-2 text-center border border-stroke-input w-20">フェーズ</th>
                        <th className="px-2 py-2 text-left border border-stroke-input w-[150px]">業者名</th>
                        <th className="px-2 py-2 text-right border border-stroke-input w-[120px]">見積金額</th>
                        <th className="px-2 py-2 text-center border border-stroke-input w-20">操作</th>
                      </tr>
                    </thead>
                    <tbody>
                      {registeredQuotations.map((q, idx) => (
                        <tr key={q.id} className={idx % 2 === 0 ? 'bg-surface-card' : 'bg-surface-screen'}>
                          <td className="px-2 py-2 border border-stroke-input">{q.fileName}</td>
                          <td className="px-2 py-2 border border-stroke-input text-center">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] ${q.phase === '発注登録用見積' ? 'bg-surface-select text-cta-primary-dark' : 'bg-stroke-card text-content-sub'}`}>
                              {q.phase === '発注登録用見積' ? '発注登録用' : '参考'}
                            </span>
                          </td>
                          <td className="px-2 py-2 border border-stroke-input">{q.vendorName || '---'}</td>
                          <td className="px-2 py-2 border border-stroke-input text-right tabular-nums">
                            {q.quotationAmount > 0 ? `¥${q.quotationAmount.toLocaleString()}` : '---'}
                          </td>
                          <td className="px-2 py-2 border border-stroke-input text-center">
                            <button
                              onClick={() => setPreviewQuotationIndex(idx)}
                              className="px-2 py-1 bg-cta-primary text-white border-0 rounded-md cursor-pointer text-xs mr-1 hover:bg-cta-primary-dark transition-colors"
                            >
                              表示
                            </button>
                            <button
                              onClick={() => handleQuotationDelete(q.id)}
                              className="px-2 py-1 bg-content-alert text-white border-0 rounded-md cursor-pointer text-xs hover:opacity-90 transition-colors"
                            >
                              削除
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="text-center text-content-sub p-8">
                    <p className="text-4xl mb-3">📁</p>
                    <p>登録済みの見積はありません</p>
                    <p className="text-xs mt-2">STEP②で見積を登録してください</p>
                  </div>
                )}
              </div>
            )}

            {/* STEP②: 見積プレビュー */}
            {previewTab === 2 && previewQuotationIndex !== null && registeredQuotations[previewQuotationIndex] && (
              <div className="bg-surface-card border border-stroke-input rounded-2xl p-4">
                <button
                  onClick={() => setPreviewQuotationIndex(null)}
                  className="px-3 py-1.5 bg-stroke-card border border-stroke-input rounded-md cursor-pointer text-xs mb-4 hover:bg-stroke-input transition-colors"
                >
                  ← 一覧に戻る
                </button>
                <div className="text-center p-8 bg-surface-screen rounded-md mb-4">
                  <p className="text-6xl mb-4">📄</p>
                  <p className="text-sm font-bold mb-2">{registeredQuotations[previewQuotationIndex].fileName}</p>
                  <p className="text-xs text-content-sub">PDFプレビュー（モック）</p>
                </div>
                <table className="w-full border-collapse text-xs">
                  <tbody>
                    <tr>
                      <td className="px-2 py-2 bg-cta-primary text-white font-bold w-[120px] border border-stroke-input">見積フェーズ</td>
                      <td className="px-2 py-2 border border-stroke-input">{registeredQuotations[previewQuotationIndex].phase}</td>
                    </tr>
                    <tr>
                      <td className="px-2 py-2 bg-cta-primary text-white font-bold border border-stroke-input">業者名</td>
                      <td className="px-2 py-2 border border-stroke-input">{registeredQuotations[previewQuotationIndex].vendorName || '---'}</td>
                    </tr>
                    <tr>
                      <td className="px-2 py-2 bg-cta-primary text-white font-bold border border-stroke-input">見積金額</td>
                      <td className="px-2 py-2 border border-stroke-input tabular-nums">
                        {registeredQuotations[previewQuotationIndex].quotationAmount > 0
                          ? `¥${registeredQuotations[previewQuotationIndex].quotationAmount.toLocaleString()}`
                          : '---'}
                      </td>
                    </tr>
                    <tr>
                      <td className="px-2 py-2 bg-cta-primary text-white font-bold border border-stroke-input">保存形式</td>
                      <td className="px-2 py-2 border border-stroke-input">{registeredQuotations[previewQuotationIndex].saveFormat}</td>
                    </tr>
                    <tr>
                      <td className="px-2 py-2 bg-cta-primary text-white font-bold border border-stroke-input">登録日時</td>
                      <td className="px-2 py-2 border border-stroke-input">
                        {new Date(registeredQuotations[previewQuotationIndex].registeredAt).toLocaleString('ja-JP')}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}

            {/* STEP③: 契約情報プレビュー */}
            {previewTab === 3 && (
              <div className="bg-surface-card border border-stroke-input rounded-2xl p-6">
                <h4 className="text-sm font-bold mb-4 text-cta-primary-dark">契約情報サマリー</h4>
                <table className="w-full border-collapse text-sm">
                  <tbody>
                    <tr>
                      <td className="px-3 py-2.5 bg-cta-primary text-white font-bold w-[140px] border border-stroke-input">保守No</td>
                      <td className="px-3 py-2.5 border border-stroke-input">{formData.maintenanceNo}</td>
                    </tr>
                    <tr>
                      <td className="px-3 py-2.5 bg-cta-primary text-white font-bold border border-stroke-input">契約グループ</td>
                      <td className="px-3 py-2.5 border border-stroke-input">{formData.contractGroupName || '（未設定）'}</td>
                    </tr>
                    <tr>
                      <td className="px-3 py-2.5 bg-cta-primary text-white font-bold border border-stroke-input">種別備考</td>
                      <td className="px-3 py-2.5 border border-stroke-input">{formData.contractTypeMemo}</td>
                    </tr>
                    <tr>
                      <td className="px-3 py-2.5 bg-cta-primary text-white font-bold border border-stroke-input">契約期間</td>
                      <td className="px-3 py-2.5 border border-stroke-input">
                        {formData.contractPeriodStart && formData.contractPeriodEnd
                          ? `${formData.contractPeriodStart} 〜 ${formData.contractPeriodEnd}`
                          : '（未設定）'}
                      </td>
                    </tr>
                    <tr>
                      <td className="px-3 py-2.5 bg-cta-primary text-white font-bold border border-stroke-input">登録見積数</td>
                      <td className="px-3 py-2.5 border border-stroke-input">{registeredQuotations.length}件</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}

            {/* STEP④: ドキュメント一覧 */}
            {previewTab === 4 && previewDocumentIndex === null && (
              <div className="bg-surface-card border border-stroke-input rounded-2xl p-4">
                <h4 className="text-sm font-bold mb-3 text-cta-primary-dark">登録済みドキュメント一覧</h4>
                {registeredDocuments.length > 0 ? (
                  <table className="w-full border-collapse text-xs">
                    <thead>
                      <tr className="bg-cta-primary text-white">
                        <th className="px-2 py-2 text-left border border-stroke-input">ファイル名</th>
                        <th className="px-2 py-2 text-center border border-stroke-input w-24">種別</th>
                        <th className="px-2 py-2 text-center border border-stroke-input w-20">操作</th>
                      </tr>
                    </thead>
                    <tbody>
                      {registeredDocuments.map((d, idx) => (
                        <tr key={d.id} className={idx % 2 === 0 ? 'bg-surface-card' : 'bg-surface-screen'}>
                          <td className="px-2 py-2 border border-stroke-input">{d.fileName}</td>
                          <td className="px-2 py-2 border border-stroke-input text-center">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] ${d.documentType === '契約書' ? 'bg-surface-select text-cta-primary-dark' : 'bg-stroke-card text-content-sub'}`}>
                              {d.documentType === '契約書' ? '契約書' : 'その他'}
                            </span>
                          </td>
                          <td className="px-2 py-2 border border-stroke-input text-center">
                            <button
                              onClick={() => setPreviewDocumentIndex(idx)}
                              className="px-2 py-1 bg-cta-primary text-white border-0 rounded-md cursor-pointer text-xs mr-1 hover:bg-cta-primary-dark transition-colors"
                            >
                              表示
                            </button>
                            <button
                              onClick={() => handleDocumentDelete(d.id)}
                              className="px-2 py-1 bg-content-alert text-white border-0 rounded-md cursor-pointer text-xs hover:opacity-90 transition-colors"
                            >
                              削除
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="text-center text-content-sub p-8">
                    <p className="text-4xl mb-3">📁</p>
                    <p>登録済みのドキュメントはありません</p>
                    <p className="text-xs mt-2">STEP④でドキュメントを登録してください</p>
                  </div>
                )}
              </div>
            )}

            {/* STEP④: ドキュメントプレビュー */}
            {previewTab === 4 && previewDocumentIndex !== null && registeredDocuments[previewDocumentIndex] && (
              <div className="bg-surface-card border border-stroke-input rounded-2xl p-4">
                <button
                  onClick={() => setPreviewDocumentIndex(null)}
                  className="px-3 py-1.5 bg-stroke-card border border-stroke-input rounded-md cursor-pointer text-xs mb-4 hover:bg-stroke-input transition-colors"
                >
                  ← 一覧に戻る
                </button>
                <div className="text-center p-8 bg-surface-screen rounded-md mb-4">
                  <p className="text-6xl mb-4">📄</p>
                  <p className="text-sm font-bold mb-2">{registeredDocuments[previewDocumentIndex].fileName}</p>
                  <p className="text-xs text-content-sub">PDFプレビュー（モック）</p>
                </div>
                <table className="w-full border-collapse text-xs">
                  <tbody>
                    <tr>
                      <td className="px-2 py-2 bg-cta-primary text-white font-bold w-[120px] border border-stroke-input">種別</td>
                      <td className="px-2 py-2 border border-stroke-input">{registeredDocuments[previewDocumentIndex].documentType}</td>
                    </tr>
                    <tr>
                      <td className="px-2 py-2 bg-cta-primary text-white font-bold border border-stroke-input">登録日時</td>
                      <td className="px-2 py-2 border border-stroke-input">
                        {new Date(registeredDocuments[previewDocumentIndex].registeredAt).toLocaleString('ja-JP')}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Figma 構造: 単一プレビュー (activeStep 連動)、縦タブバーは撤去 */}
      </div>

      <OrderRegistrationModal
        isOpen={isOrderRegisterModalOpen}
        onClose={() => setIsOrderRegisterModalOpen(false)}
        orderNoPrefix="PO-MAINT"
        onConfirm={(orderNo, deliveryMethod) => {
          setRegisteredOrderNo(orderNo);
          setIsOrderRegisterModalOpen(false);
          alert(`発注登録が完了しました。\n発注No,: ${orderNo}\n送付方法: ${deliveryMethod}`);
        }}
      />
    </div>
  );
}

export default function MaintenanceQuoteRegistrationPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col min-h-dvh bg-surface-screen">
        <Header title="保守契約管理" hideMenu={true} showBackButton={false} />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-content-sub">読み込み中...</p>
        </div>
      </div>
    }>
      <MaintenanceQuoteRegistrationContent />
    </Suspense>
  );
}
