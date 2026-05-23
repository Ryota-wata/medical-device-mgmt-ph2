'use client';

import React, { useState, useEffect, Suspense, useRef, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Download,
  ExternalLink,
  FileText,
  FolderOpen,
  Plus,
  Trash2,
} from 'lucide-react';
import { Header } from '@/components/layouts/Header';
import { ACCOUNT_DIVISIONS } from '@/lib/data/account-divisions';
import { OrderRegistrationModal } from '@/components/ui/OrderRegistrationModal';

// ============================================================
// Types
// ============================================================
interface VendorEntry {
  localId: string;
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
  return `dv-${vendorLocalIdCounter}`;
}

const DISPOSAL_STEPS = [
  { step: 1, label: '見積依頼' },
  { step: 2, label: '見積登録' },
  { step: 3, label: '発注登録' },
  { step: 4, label: '完了登録' },
];

type DisposalStatus = '新規申請' | '見積依頼済' | '発注用見積登録済' | '発注済' | '納期確定' | '検収済' | '完了' | '申請見送り';

interface RegisteredQuotation {
  id: number;
  phase: '発注用' | '参考';
  saveFormat: '電子取引' | 'スキャナ保存' | '未指定';
  fileName: string;
  vendorName: string;
  amount: number;
  accountType: string;
  registeredAt: string;
}

interface RegisteredDocument {
  id: number;
  documentType: '完了報告書' | '廃棄証明書' | 'マニフェスト' | '契約書' | '請求書' | 'その他';
  accountType: '修繕費' | '廃棄費' | 'その他';
  accountOther?: string;
  fileName: string;
  registeredAt: string;
}

interface DisposalApplication {
  id: string;
  groupId: string;
  groupName: string;
  rfqNo: string;
  applicationNo: string;
  applicationDate: string;
  applicantName: string;
  applicantDepartment: string;
  applicantContact: string;
  installationDivision: string;
  installationDepartment: string;
  installationRoom: string;
  itemName: string;
  maker: string;
  model: string;
  serialNo: string;
  qrLabel: string;
  disposalReason: string;
  comment: string;
  status: DisposalStatus;
  receptionDepartment: string;
  receptionPerson: string;
  receptionContact: string;
  quotationPhase: '発注用' | '参考';
  saveFormat: '電子取引' | 'スキャナ保存' | '未指定';
  deliveryDate: string;
  documentType: '完了報告書' | '廃棄証明書' | 'マニフェスト' | '契約書' | '請求書' | 'その他';
  accountType: '修繕費' | '廃棄費' | 'その他';
  accountOther: string;
}

const getMockApplication = (groupId: string): DisposalApplication => {
  const groupDataMap: Record<string, { groupName: string; rfqNo: string; status: DisposalStatus; vendorName: string; vendorPerson: string; vendorEmail: string; vendorContact: string }> = {
    '1': { groupName: 'ME室 心電計廃棄一式', rfqNo: 'RFQ-20260110-0001', status: '見積依頼済', vendorName: 'シーメンス・ジャパン', vendorPerson: '山田太郎', vendorEmail: 'yamada@siemens.co.jp', vendorContact: '03-1234-5678' },
    '2': { groupName: '放射線科 超音波装置廃棄', rfqNo: 'RFQ-20260111-0002', status: '発注用見積登録済', vendorName: 'GEヘルスケア', vendorPerson: '鈴木一郎', vendorEmail: 'suzuki@ge.co.jp', vendorContact: '03-2345-6789' },
    '3': { groupName: '検査科 血液ガス分析装置廃棄', rfqNo: 'RFQ-20260113-0003', status: '発注済', vendorName: 'フィリップス・ジャパン', vendorPerson: '佐藤花子', vendorEmail: 'sato@philips.co.jp', vendorContact: '03-3456-7890' },
    '4': { groupName: '看護部 輸液ポンプ廃棄', rfqNo: 'RFQ-20260115-0004', status: '納期確定', vendorName: 'オリンパス', vendorPerson: '田中次郎', vendorEmail: 'tanaka@olympus.co.jp', vendorContact: '03-4567-8901' },
    '5': { groupName: '手術部 電気メス移動作業', rfqNo: 'RFQ-20260120-0005', status: '完了', vendorName: 'キヤノンメディカル', vendorPerson: '高橋美咲', vendorEmail: 'takahashi@canon.co.jp', vendorContact: '03-5678-9012' },
  };

  const groupData = groupDataMap[groupId] || { groupName: '新規グループ', rfqNo: `RFQ-NEW-${groupId}`, status: '新規申請' as DisposalStatus, vendorName: '', vendorPerson: '', vendorEmail: '', vendorContact: '' };

  return {
    id: groupId,
    groupId,
    groupName: groupData.groupName,
    rfqNo: groupData.rfqNo,
    applicationNo: `DSP-2026-${groupId.padStart(3, '0')}`,
    applicationDate: '2026-02-10',
    applicantName: '山田 太郎',
    applicantDepartment: 'ME室',
    applicantContact: '内線2345',
    installationDivision: '診療技術部',
    installationDepartment: 'ME室',
    installationRoom: 'ME機器管理室',
    itemName: '心電計',
    maker: '日本光電',
    model: 'ECG-2550',
    serialNo: 'SN-2020-12345',
    qrLabel: 'QR-001234',
    disposalReason: '耐用年数超過',
    comment: '10年以上使用し、部品供給終了のため廃棄',
    status: groupData.status,
    receptionDepartment: 'ME室',
    receptionPerson: '佐藤 花子',
    receptionContact: '内線2346',
    quotationPhase: '発注用',
    saveFormat: '電子取引',
    deliveryDate: '',
    documentType: '完了報告書',
    accountType: '廃棄費',
    accountOther: '',
  };
};

const getInitialStep = (status: DisposalStatus): number => {
  switch (status) {
    case '新規申請': return 1;
    case '見積依頼済': return 1;
    case '発注用見積登録済': return 2;
    case '発注済': return 3;
    case '納期確定': return 3;
    case '検収済': return 4;
    case '完了': return 4;
    case '申請見送り': return 1;
    default: return 1;
  }
};

type PreviewDocTab = '見積依頼書' | '見積書' | '発注書' | '完了報告書他';

const PREVIEW_TABS: PreviewDocTab[] = ['見積依頼書', '見積書', '発注書', '完了報告書他'];

// ============================================================
// Tailwind class constants
// ============================================================
const inputCls =
  'h-[42px] w-full px-3 rounded-lg bg-surface-card border border-stroke-input text-base text-content-primary placeholder:text-content-placeholder focus:outline-none focus:border-cta-primary transition-colors disabled:bg-stroke-card disabled:text-content-sub disabled:cursor-not-allowed';

const labelCls = 'text-sm font-semibold text-content-primary whitespace-nowrap';

// ============================================================
// Sub components
// ============================================================

/** Step bar — Figma 構造（円バッジ 40x40px + コネクタライン） */
function StepBar({ activeStep }: { activeStep: number }) {
  return (
    <div className="bg-surface-card border-b border-stroke-card px-8 py-4">
      <div className="flex items-start justify-between relative max-w-[1384px] mx-auto">
        {DISPOSAL_STEPS.map((item, index) => {
          const isCompleted = item.step < activeStep;
          const isActive = item.step === activeStep;
          const badgeClass = isCompleted
            ? 'bg-cta-primary-dark text-white'
            : isActive
            ? 'bg-cta-primary-dark text-white'
            : 'bg-stroke-card text-content-sub';
          const labelClass = isCompleted || isActive
            ? 'text-cta-primary-dark font-medium'
            : 'text-content-sub';
          return (
            <React.Fragment key={item.step}>
              <div className="flex flex-col items-center gap-2 relative z-10">
                <div className={`w-10 h-10 rounded-[20px] flex items-center justify-center text-sm font-normal ${badgeClass}`}>
                  {isCompleted ? <Check className="w-5 h-5" /> : item.step}
                </div>
                <span className={`text-sm text-center whitespace-nowrap ${labelClass}`}>
                  {item.label}
                </span>
              </div>
              {index < DISPOSAL_STEPS.length - 1 && (
                <div
                  className={`flex-1 h-px mt-[20px] mx-2 ${item.step < activeStep ? 'bg-cta-primary-dark' : 'bg-stroke-input'}`}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}

/** STEP セクション見出し（Figma: STEP X W7 24px + 副題 W7 16px + Instruction W4 14px #8A8A8A + border-b） */
function StepHeading({
  step,
  title,
  instruction,
}: {
  step: string;
  title: string;
  instruction?: string;
}) {
  return (
    <div className="border-b border-stroke-input pb-4 mb-6">
      <p className="text-content-primary leading-tight">
        <span className="text-2xl font-bold">{step}</span>
        <span className="text-base font-bold ml-2">{title}</span>
      </p>
      {instruction && (
        <p className="mt-2 text-sm text-content-sub leading-relaxed">{instruction}</p>
      )}
    </div>
  );
}

/** STEP 内のサブセクションタイトル（依頼先・登録済みデータ等） */
function SubSectionTitle({
  children,
  action,
}: {
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between mb-2">
      <p className="text-sm font-bold text-content-primary">{children}</p>
      {action}
    </div>
  );
}

/** 灰背景ラベルセル（Figma `contents bg: #F1F1F1`） */
function ThLabelCell({ children, width = 'w-[105px]' }: { children: React.ReactNode; width?: string }) {
  return (
    <td className={`${width} px-4 py-2 bg-stroke-card text-content-primary font-normal border border-stroke-input align-middle text-base whitespace-nowrap`}>
      {children}
    </td>
  );
}

/** 白背景データセル */
function TdCell({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <td className={`px-4 py-2 bg-surface-card border border-stroke-input text-base text-content-primary ${className}`}>
      {children}
    </td>
  );
}

// ============================================================
// Main content
// ============================================================
function DisposalTaskContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const groupId = searchParams.get('groupId') || '1';

  const [application, setApplication] = useState<DisposalApplication | null>(null);
  const [formData, setFormData] = useState<DisposalApplication | null>(null);
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [vendors, setVendors] = useState<VendorEntry[]>([]);
  const [registeredQuotations, setRegisteredQuotations] = useState<RegisteredQuotation[]>([]);
  const [selectedFileName, setSelectedFileName] = useState('');
  const [quotationVendorName, setQuotationVendorName] = useState<string>('');
  const [quotationAmount, setQuotationAmount] = useState<string>('');
  const [quotationAccountType, setQuotationAccountType] = useState<string>('');
  const [settlementNo, setSettlementNo] = useState<string>('');
  const [isOrderRegisterModalOpen, setIsOrderRegisterModalOpen] = useState(false);
  const [registeredOrderNo, setRegisteredOrderNo] = useState<string>('');
  const [registeredDocuments, setRegisteredDocuments] = useState<RegisteredDocument[]>([]);
  const [selectedDocFileName, setSelectedDocFileName] = useState<string>('');
  const [previewTab, setPreviewTab] = useState<PreviewDocTab>('見積依頼書');
  const [previewVendorIndex, setPreviewVendorIndex] = useState<number | null>(null);
  const [previewQuotationIndex, setPreviewQuotationIndex] = useState<number | null>(null);
  const [previewDocumentIndex, setPreviewDocumentIndex] = useState<number | null>(null);

  const [leftPanelWidth, setLeftPanelWidth] = useState<number>(58);
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
    const data = getMockApplication(groupId);
    setApplication(data);
    setFormData({ ...data });
    setCurrentStep(getInitialStep(data.status));

    const groupDataMap: Record<string, { vendorName: string; vendorPerson: string; vendorEmail: string; vendorContact: string }> = {
      '1': { vendorName: 'シーメンス・ジャパン', vendorPerson: '山田太郎', vendorEmail: 'yamada@siemens.co.jp', vendorContact: '03-1234-5678' },
      '2': { vendorName: 'GEヘルスケア', vendorPerson: '鈴木一郎', vendorEmail: 'suzuki@ge.co.jp', vendorContact: '03-2345-6789' },
      '3': { vendorName: 'フィリップス・ジャパン', vendorPerson: '佐藤花子', vendorEmail: 'sato@philips.co.jp', vendorContact: '03-3456-7890' },
      '4': { vendorName: 'オリンパス', vendorPerson: '田中次郎', vendorEmail: 'tanaka@olympus.co.jp', vendorContact: '03-4567-8901' },
      '5': { vendorName: 'キヤノンメディカル', vendorPerson: '高橋美咲', vendorEmail: 'takahashi@canon.co.jp', vendorContact: '03-5678-9012' },
    };
    const vd = groupDataMap[groupId];
    const isSent = data.status !== '新規申請';
    if (vd && vd.vendorName) {
      setVendors([{
        localId: generateLocalId(),
        vendorName: vd.vendorName,
        personInCharge: vd.vendorPerson,
        email: vd.vendorEmail,
        tel: vd.vendorContact,
        submitDeadline: '',
        requestNote: '',
        isSent,
      }]);
    } else {
      setVendors([{
        localId: generateLocalId(),
        vendorName: '',
        personInCharge: '',
        email: '',
        tel: '',
        submitDeadline: '',
        requestNote: '',
        isSent: false,
      }]);
    }
  }, [groupId]);

  const activeStep = currentStep;
  const isStepEnabled = (step: number) => step <= activeStep;

  if (!application || !formData) {
    return (
      <div className="flex flex-col min-h-dvh bg-surface-screen">
        <Header
          title="廃棄契約管理"
          hideMenu={true}
          showBackButton={true}
          backHref="/quotation-data-box/transfer-management"
          backLabel="一覧に戻る"
          backButtonVariant="secondary"
          hideHomeButton={true}
        />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-content-sub">読み込み中...</p>
        </div>
      </div>
    );
  }

  const updateFormData = (updates: Partial<DisposalApplication>) => {
    setFormData(prev => prev ? { ...prev, ...updates } : prev);
  };

  const updateVendorField = (index: number, field: keyof VendorEntry, value: string) => {
    setVendors(prev => prev.map((v, i) => i === index ? { ...v, [field]: value } : v));
  };

  const handleAddVendor = () => {
    setVendors(prev => [
      ...prev,
      { localId: generateLocalId(), vendorName: '', personInCharge: '', email: '', tel: '', submitDeadline: '', requestNote: '', isSent: false },
    ]);
  };

  const handleRemoveVendor = (index: number) => {
    setVendors(prev => prev.length <= 1 ? prev : prev.filter((_, i) => i !== index));
  };

  const unsentCount = vendors.filter(v => !v.isSent).length;

  const handleStep1VendorSubmit = (index: number) => {
    const vendor = vendors[index];
    if (!vendor.vendorName || !vendor.email) {
      alert('業者名とメールアドレスを入力してください');
      return;
    }
    if (!vendor.submitDeadline) {
      alert('見積提出期限を入力してください');
      return;
    }
    setVendors(prev => prev.map((v, i) => i === index ? { ...v, isSent: true } : v));
    alert(`${vendor.vendorName} への見積依頼を送信しました`);
  };

  const handleSendRfqAll = () => {
    const unsent = vendors.filter(v => !v.isSent);
    if (unsent.length === 0) {
      alert('送信対象の業者がありません');
      return;
    }
    const invalid = unsent.filter(v => !v.vendorName || !v.email);
    if (invalid.length > 0) {
      alert('未送信の業者すべてに業者名とメールアドレスを入力してください');
      return;
    }
    setVendors(prev => prev.map(v => ({ ...v, isSent: true })));
    alert(`${unsent.length}件の見積依頼を送信しました`);
  };

  const handleStep1Complete = () => {
    setIsSubmitting(true);
    setTimeout(() => {
      alert('見積依頼を完了しました。STEP②へ進みます。');
      setApplication(prev => prev ? { ...prev, status: '見積依頼済' } : prev);
      setCurrentStep(2);
      setIsSubmitting(false);
    }, 300);
  };

  const handleCancelApplication = () => {
    if (confirm('この廃棄申請を見送りますか？廃棄品の更新が必要な場合は原本リストより更新申請を行って下さい。')) {
      setApplication(prev => prev ? { ...prev, status: '申請見送り' } : prev);
      alert('申請を見送りました。一覧画面に戻ります。');
      router.push('/quotation-data-box/transfer-management');
    }
  };

  const handleAddQuotation = () => {
    if (!selectedFileName) {
      alert('見積ファイルを選択してください');
      return;
    }
    if (!quotationVendorName) {
      alert('見積登録業者を選択してください');
      return;
    }
    const newQuotation: RegisteredQuotation = {
      id: Date.now(),
      phase: formData.quotationPhase,
      saveFormat: formData.saveFormat,
      fileName: selectedFileName,
      vendorName: quotationVendorName,
      amount: parseFloat(quotationAmount) || 0,
      accountType: quotationAccountType,
      registeredAt: new Date().toISOString(),
    };
    setRegisteredQuotations(prev => [...prev, newQuotation]);
    setSelectedFileName('');
    setQuotationVendorName('');
    setQuotationAmount('');
    setQuotationAccountType('');
    alert(`${formData.quotationPhase === '発注用' ? '発注用' : '参考'}見積を登録しました`);
  };

  const handleStep2Complete = () => {
    setIsSubmitting(true);
    setTimeout(() => {
      setApplication(prev => prev ? { ...prev, status: '発注用見積登録済' } : prev);
      setCurrentStep(3);
      setIsSubmitting(false);
    }, 300);
  };

  const handleStep3Complete = () => {
    setIsSubmitting(true);
    setTimeout(() => {
      setApplication(prev => prev ? { ...prev, status: '発注済' } : prev);
      setCurrentStep(4);
      setIsSubmitting(false);
    }, 300);
  };

  const handleAddDocument = () => {
    if (!selectedDocFileName) return;
    const newDoc: RegisteredDocument = {
      id: Date.now(),
      documentType: formData.documentType,
      accountType: formData.accountType,
      accountOther: formData.accountType === 'その他' ? formData.accountOther : undefined,
      fileName: selectedDocFileName,
      registeredAt: new Date().toISOString(),
    };
    setRegisteredDocuments(prev => [...prev, newDoc]);
    setSelectedDocFileName('');
  };

  const handleStep5Complete = () => {
    if (confirm('検収を完了し、このタスクを完了しますか？')) {
      setIsSubmitting(true);
      setTimeout(() => {
        alert(`廃棄タスク（${application.applicationNo}）が完了しました。\n一覧画面に戻ります。`);
        router.push('/quotation-data-box/transfer-management');
      }, 300);
    }
  };

  const vendorOptions = vendors.filter(v => v.vendorName).map(v => v.vendorName);

  return (
    <div className="flex flex-col min-h-dvh bg-surface-screen">
      <Header
        title="廃棄契約管理"
        hideMenu={true}
        showBackButton={true}
        backHref="/quotation-data-box/transfer-management"
        backLabel="一覧に戻る"
        backButtonVariant="secondary"
        hideHomeButton={true}
      />

      <StepBar activeStep={activeStep} />

      <main className="flex-1 px-8 py-6 flex justify-center overflow-hidden">
        <div className="w-full max-w-[1384px] bg-surface-card border border-stroke-card rounded-2xl overflow-hidden">
          <div ref={containerRef} className="flex gap-4 p-4 h-full min-h-0">
            {/* Left: form */}
            <div
              className="flex flex-col min-w-0 overflow-y-auto"
              style={{ width: `${leftPanelWidth}%` }}
            >
              {/* Headline */}
              <div className="mb-8">
                <p className="text-xl font-bold text-content-primary leading-tight">
                  見積依頼グループ：{application.groupName}
                </p>
                <p className="text-base text-content-primary mt-1">{application.rfqNo}</p>
              </div>

              {/* ===== STEP① ===== */}
              <section className={`pb-8 mb-8 border-b border-stroke-input ${isStepEnabled(1) ? '' : 'opacity-60 pointer-events-none'}`}>
                <StepHeading
                  step="STEP①"
                  title="．見積依頼"
                  instruction="業者を登録し見積依頼書を作成してください。複数業者への相見積もりが可能です。"
                />

                {/* 基本情報テーブル */}
                <div className="mb-6">
                  <SubSectionTitle>基本情報</SubSectionTitle>
                  <table className="w-full border-collapse">
                    <tbody>
                      <tr>
                        <ThLabelCell>申請No.</ThLabelCell>
                        <TdCell>{application.applicationNo}</TdCell>
                        <ThLabelCell>品目</ThLabelCell>
                        <TdCell>{application.itemName}</TdCell>
                      </tr>
                      <tr>
                        <ThLabelCell>メーカー</ThLabelCell>
                        <TdCell>{application.maker}</TdCell>
                        <ThLabelCell>型式</ThLabelCell>
                        <TdCell>{application.model}</TdCell>
                      </tr>
                      <tr>
                        <ThLabelCell>QRラベル</ThLabelCell>
                        <TdCell className="font-mono">{application.qrLabel}</TdCell>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* 受付部署 */}
                <div className="mb-6">
                  <SubSectionTitle>受付部署</SubSectionTitle>
                  <table className="w-full border-collapse">
                    <tbody>
                      <tr>
                        <ThLabelCell>部署名</ThLabelCell>
                        <TdCell>
                          <input
                            type="text"
                            value={formData.receptionDepartment}
                            onChange={(e) => updateFormData({ receptionDepartment: e.target.value })}
                            className={inputCls}
                            disabled={1 < activeStep}
                          />
                        </TdCell>
                        <ThLabelCell>担当者名</ThLabelCell>
                        <TdCell>
                          <input
                            type="text"
                            value={formData.receptionPerson}
                            onChange={(e) => updateFormData({ receptionPerson: e.target.value })}
                            className={inputCls}
                            disabled={1 < activeStep}
                          />
                        </TdCell>
                      </tr>
                      <tr>
                        <ThLabelCell>連絡先</ThLabelCell>
                        <TdCell>
                          <input
                            type="text"
                            value={formData.receptionContact}
                            onChange={(e) => updateFormData({ receptionContact: e.target.value })}
                            className={inputCls}
                            disabled={1 < activeStep}
                          />
                        </TdCell>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* 依頼先 */}
                <div className="mb-6">
                  <SubSectionTitle
                    action={
                      <button
                        onClick={handleAddVendor}
                        disabled={1 < activeStep}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-surface-card border border-cta-primary text-cta-primary-dark rounded-md text-xs font-semibold hover:bg-surface-select transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        業者追加（{vendors.length}社）
                      </button>
                    }
                  >
                    依頼先
                  </SubSectionTitle>

                  {vendors.map((vendor, index) => (
                    <div
                      key={vendor.localId}
                      className={`mb-3 border rounded-lg overflow-hidden ${vendor.isSent ? 'bg-stroke-card border-stroke-input opacity-90' : 'bg-surface-card border-stroke-input'}`}
                    >
                      <div className="flex items-center gap-3 px-3 py-2 bg-surface-card border-b border-stroke-input">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-bold whitespace-nowrap ${vendor.isSent ? 'bg-surface-select text-cta-primary-dark' : 'bg-cta-primary text-white'}`}>
                          {vendor.isSent && <Check className="w-3 h-3" />}
                          {vendor.isSent ? '送信済' : `依頼${index + 1}`}
                        </span>
                        <div className="flex-1" />
                        <button
                          onClick={() => {
                            setPreviewVendorIndex(index);
                            setPreviewTab('見積依頼書');
                          }}
                          className="px-3 py-1 bg-surface-card border border-stroke-input text-content-primary rounded-md text-xs hover:bg-stroke-card transition-colors"
                        >
                          プレビュー
                        </button>
                        {!vendor.isSent && 1 >= activeStep && (
                          <button
                            onClick={() => handleStep1VendorSubmit(index)}
                            disabled={isSubmitting}
                            className="px-3 py-1 bg-cta-primary text-white rounded-md text-xs font-bold hover:bg-cta-primary-dark transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                          >
                            依頼送信
                          </button>
                        )}
                        {!vendor.isSent && vendors.length > 1 && 1 >= activeStep && (
                          <button
                            onClick={() => handleRemoveVendor(index)}
                            aria-label="業者を削除"
                            className="inline-flex items-center justify-center w-7 h-7 bg-surface-card border border-content-alert text-content-alert rounded-md hover:bg-stroke-card transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      <div className="p-3 grid grid-cols-2 gap-3">
                        <FieldLabel label="業者名" required>
                          <input
                            value={vendor.vendorName}
                            onChange={(e) => updateVendorField(index, 'vendorName', e.target.value)}
                            placeholder="業者名"
                            disabled={vendor.isSent || 1 < activeStep}
                            className={inputCls}
                          />
                        </FieldLabel>
                        <FieldLabel label="担当者名">
                          <input
                            value={vendor.personInCharge}
                            onChange={(e) => updateVendorField(index, 'personInCharge', e.target.value)}
                            placeholder="担当者"
                            disabled={vendor.isSent || 1 < activeStep}
                            className={inputCls}
                          />
                        </FieldLabel>
                        <FieldLabel label="メール" required>
                          <input
                            value={vendor.email}
                            onChange={(e) => updateVendorField(index, 'email', e.target.value)}
                            placeholder="email@example.com"
                            disabled={vendor.isSent || 1 < activeStep}
                            className={inputCls}
                          />
                        </FieldLabel>
                        <FieldLabel label="連絡先">
                          <input
                            value={vendor.tel}
                            onChange={(e) => updateVendorField(index, 'tel', e.target.value)}
                            placeholder="03-0000-0000"
                            disabled={vendor.isSent || 1 < activeStep}
                            className={inputCls}
                          />
                        </FieldLabel>
                        <FieldLabel label="提出期限">
                          <input
                            type="date"
                            value={vendor.submitDeadline}
                            onChange={(e) => updateVendorField(index, 'submitDeadline', e.target.value)}
                            disabled={vendor.isSent || 1 < activeStep}
                            className={`${inputCls} tabular-nums`}
                          />
                        </FieldLabel>
                      </div>

                      <div className="px-3 pb-3">
                        <FieldLabel label="ご依頼事項">
                          <textarea
                            value={vendor.requestNote}
                            onChange={(e) => updateVendorField(index, 'requestNote', e.target.value)}
                            placeholder="ご依頼事項を入力してください"
                            rows={2}
                            disabled={vendor.isSent || 1 < activeStep}
                            className="w-full px-3 py-2 rounded-lg bg-surface-card border border-stroke-input text-sm text-content-primary resize-y focus:outline-none focus:border-cta-primary transition-colors disabled:bg-stroke-card disabled:text-content-sub"
                          />
                        </FieldLabel>
                      </div>
                    </div>
                  ))}

                  <div className="pt-3 flex justify-end">
                    <button
                      onClick={handleSendRfqAll}
                      disabled={unsentCount === 0 || 1 < activeStep}
                      className={`h-12 px-6 rounded-lg text-base font-medium transition-colors ${unsentCount === 0 || 1 < activeStep ? 'bg-surface-negative text-content-primary cursor-not-allowed' : 'bg-cta-primary text-white hover:bg-cta-primary-dark cursor-pointer'}`}
                    >
                      {unsentCount > 0 ? `一括依頼送信（${unsentCount}件）` : '全件送信済'}
                    </button>
                  </div>
                </div>

                <div className="flex justify-between items-center gap-3 mt-6">
                  <button
                    onClick={handleCancelApplication}
                    disabled={1 < activeStep || isSubmitting}
                    className="h-12 px-6 bg-surface-card border border-content-alert text-content-alert rounded-lg text-base font-medium hover:bg-stroke-card transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    申請を見送る
                  </button>
                  <button
                    onClick={handleStep1Complete}
                    disabled={1 < activeStep || isSubmitting}
                    className="inline-flex items-center gap-2 h-12 px-6 bg-cta-primary text-white rounded-lg text-base font-medium hover:bg-cta-primary-dark transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    見積依頼完了
                    <ChevronRight className="w-4 h-4" />
                    STEP②へ
                  </button>
                </div>
              </section>

              {/* ===== STEP② ===== */}
              <section className={`pb-8 mb-8 border-b border-stroke-input ${isStepEnabled(2) ? '' : 'opacity-60 pointer-events-none'}`}>
                <StepHeading
                  step="STEP②"
                  title="．見積登録/発注登録"
                  instruction="見積書をファイル選択して登録し、業者名と見積金額を入力してください。"
                />

                <div className="mb-5">
                  <SubSectionTitle>見積を追加</SubSectionTitle>
                  <table className="w-full border-collapse">
                    <tbody>
                      <tr>
                        <ThLabelCell width="w-[200px]">添付ファイル</ThLabelCell>
                        <TdCell>
                          <div className="flex items-center gap-3">
                            <label className={`inline-flex items-center gap-1.5 px-4 py-2 bg-surface-card border border-stroke-input rounded-lg text-sm hover:bg-stroke-card transition-colors ${isStepEnabled(2) && activeStep <= 2 ? 'cursor-pointer' : 'cursor-not-allowed opacity-60'}`}>
                              <Download className="w-4 h-4" />
                              ファイルの選択
                              <input
                                type="file"
                                accept=".pdf,.jpg,.jpeg,.png"
                                disabled={!isStepEnabled(2) || 2 < activeStep}
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) setSelectedFileName(file.name);
                                }}
                                className="hidden"
                              />
                            </label>
                            <span className={`text-sm ${selectedFileName ? 'text-cta-primary' : 'text-content-sub'}`}>
                              {selectedFileName || 'ファイルが選択されていません'}
                            </span>
                          </div>
                        </TdCell>
                      </tr>
                      <tr>
                        <ThLabelCell width="w-[200px]">業者名</ThLabelCell>
                        <TdCell>
                          <input
                            type="text"
                            value={vendors[0]?.vendorName || ''}
                            disabled
                            className={inputCls}
                          />
                          <p className="text-xs text-content-sub mt-1">
                            ※STEP①で登録した依頼先から自動取得
                          </p>
                        </TdCell>
                      </tr>
                      <tr>
                        <ThLabelCell width="w-[200px]">見積フェーズ</ThLabelCell>
                        <TdCell>
                          <div className="flex flex-col gap-2">
                            <label className="inline-flex items-center gap-2 cursor-pointer text-base">
                              <input
                                type="radio"
                                name="quotationPhase"
                                checked={formData.quotationPhase === '発注用'}
                                onChange={() => updateFormData({ quotationPhase: '発注用' })}
                                disabled={!isStepEnabled(2) || 2 < activeStep}
                                className="accent-cta-primary w-4 h-4"
                              />
                              発注登録用見積
                            </label>
                            <label className="inline-flex items-center gap-2 cursor-pointer text-base">
                              <input
                                type="radio"
                                name="quotationPhase"
                                checked={formData.quotationPhase === '参考'}
                                onChange={() => updateFormData({ quotationPhase: '参考' })}
                                disabled={!isStepEnabled(2) || 2 < activeStep}
                                className="accent-cta-primary w-4 h-4"
                              />
                              参考見積
                            </label>
                          </div>
                        </TdCell>
                      </tr>
                      <tr>
                        <ThLabelCell width="w-[200px]">保存形式</ThLabelCell>
                        <TdCell>
                          <div className="flex flex-col gap-2">
                            {(['電子取引', 'スキャナ保存', '未指定'] as const).map(fmt => (
                              <label key={fmt} className="inline-flex items-center gap-2 cursor-pointer text-base">
                                <input
                                  type="radio"
                                  name="saveFormat"
                                  checked={formData.saveFormat === fmt}
                                  onChange={() => updateFormData({ saveFormat: fmt })}
                                  disabled={!isStepEnabled(2) || 2 < activeStep}
                                  className="accent-cta-primary w-4 h-4"
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

                {/* 見積登録業者 */}
                <div className="mb-5 border border-stroke-input rounded-lg overflow-hidden">
                  <div className="px-4 py-2 bg-stroke-card text-content-primary text-sm font-bold flex items-center justify-between">
                    <span>見積登録業者</span>
                    <button
                      onClick={() => setPreviewTab('見積書')}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-surface-card border border-stroke-input text-content-primary rounded-md text-xs hover:bg-stroke-card transition-colors"
                    >
                      プレビュー
                    </button>
                  </div>
                  <div className="p-4 flex flex-col gap-3">
                    <FieldRow label="業者名">
                      <div className="relative">
                        <select
                          value={quotationVendorName}
                          onChange={(e) => setQuotationVendorName(e.target.value)}
                          disabled={!isStepEnabled(2) || 2 < activeStep}
                          className={`${inputCls} appearance-none pr-9`}
                        >
                          <option value="">選択してください</option>
                          {vendorOptions.map((name, idx) => (
                            <option key={idx} value={name}>{name}</option>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-content-sub pointer-events-none" />
                      </div>
                    </FieldRow>
                    <FieldRow label="担当者">
                      <p className="text-base text-content-sub">
                        {vendors.find(v => v.vendorName === quotationVendorName)?.personInCharge || '---'}
                      </p>
                    </FieldRow>
                    <FieldRow label="見積金額（税別）">
                      <div className="inline-flex items-center gap-1">
                        <span className="text-base font-bold text-content-primary">¥</span>
                        <input
                          type="text"
                          value={quotationAmount}
                          onChange={(e) => setQuotationAmount(e.target.value)}
                          placeholder="0"
                          disabled={!isStepEnabled(2) || 2 < activeStep}
                          className={`${inputCls} max-w-[200px] tabular-nums`}
                        />
                        <span className="text-xs text-content-sub">（税別）</span>
                      </div>
                    </FieldRow>
                    <FieldRow label="会計区分">
                      <div className="relative">
                        <select
                          value={quotationAccountType}
                          onChange={(e) => setQuotationAccountType(e.target.value)}
                          disabled={!isStepEnabled(2) || 2 < activeStep}
                          className={`${inputCls} appearance-none pr-9`}
                        >
                          <option value="">選択してください</option>
                          {ACCOUNT_DIVISIONS.map((d) => (
                            <option key={d.value} value={d.value}>{d.label}</option>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-content-sub pointer-events-none" />
                      </div>
                    </FieldRow>
                    <div className="flex justify-end">
                      <button
                        onClick={handleAddQuotation}
                        disabled={!isStepEnabled(2) || isSubmitting || !selectedFileName || !quotationVendorName || 2 < activeStep}
                        className={`h-10 px-5 rounded-lg text-sm font-bold transition-colors ${selectedFileName && quotationVendorName ? 'bg-cta-primary text-white hover:bg-cta-primary-dark cursor-pointer' : 'bg-surface-negative text-content-sub cursor-not-allowed'}`}
                      >
                        見積書の登録
                      </button>
                    </div>

                    {formData.quotationPhase === '発注用' && registeredQuotations.some((q) => q.phase === '発注用') && (
                      <div className="pt-3 border-t border-dashed border-stroke-input">
                        <p className="text-xs font-bold text-cta-primary-dark mb-2">
                          発注登録用見積として登録済み — 発注登録に進めます
                        </p>
                        <FieldRow label="決済No,">
                          <input
                            type="text"
                            value={settlementNo}
                            onChange={(e) => setSettlementNo(e.target.value)}
                            placeholder="院内の任意の決済番号"
                            disabled={!isStepEnabled(2) || 2 < activeStep}
                            className={inputCls}
                          />
                        </FieldRow>
                        <div className="flex justify-end gap-2 mt-2">
                          <button
                            onClick={() => setPreviewTab('発注書')}
                            disabled={!isStepEnabled(2)}
                            className="inline-flex items-center gap-1.5 h-9 px-4 bg-surface-card border border-stroke-input text-content-primary rounded-lg text-sm hover:bg-stroke-card transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                          >
                            発注書プレビュー
                          </button>
                          <button
                            onClick={() => setIsOrderRegisterModalOpen(true)}
                            disabled={!isStepEnabled(2) || !!registeredOrderNo}
                            className={`h-9 px-4 rounded-lg text-sm font-bold transition-colors ${registeredOrderNo ? 'bg-surface-negative text-content-sub cursor-not-allowed' : 'bg-cta-primary text-white hover:bg-cta-primary-dark cursor-pointer'} disabled:cursor-not-allowed`}
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
                  <div className="mb-5">
                    <SubSectionTitle>登録済み見積（{registeredQuotations.length}件）</SubSectionTitle>
                    <div className="border border-stroke-input rounded-lg overflow-x-auto">
                      <table className="w-full border-collapse text-sm">
                        <thead>
                          <tr className="bg-stroke-card border-b border-stroke-input">
                            <th className="px-3 py-2 text-left font-semibold text-content-primary">フェーズ</th>
                            <th className="px-3 py-2 text-left font-semibold text-content-primary">業者名</th>
                            <th className="px-3 py-2 text-right font-semibold text-content-primary">見積金額</th>
                            <th className="px-3 py-2 text-left font-semibold text-content-primary">ファイル名</th>
                            <th className="px-3 py-2 text-center font-semibold text-content-primary w-[60px]"></th>
                          </tr>
                        </thead>
                        <tbody>
                          {registeredQuotations.map((q) => (
                            <tr key={q.id} className="border-b border-stroke-input last:border-b-0">
                              <td className="px-3 py-2">
                                <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-bold ${q.phase === '発注用' ? 'bg-surface-select text-cta-primary-dark' : 'bg-stroke-card text-content-sub'}`}>
                                  {q.phase === '発注用' ? '発注登録用' : '参考'}
                                </span>
                              </td>
                              <td className="px-3 py-2">{q.vendorName}</td>
                              <td className="px-3 py-2 text-right tabular-nums">¥{q.amount.toLocaleString()}</td>
                              <td className="px-3 py-2">
                                <span className="inline-flex items-center gap-1.5">
                                  <FileText className="w-4 h-4 text-content-sub" />
                                  {q.fileName}
                                </span>
                              </td>
                              <td className="px-3 py-2 text-center">
                                <button
                                  onClick={() => {
                                    if (confirm('この見積を削除しますか？')) {
                                      setRegisteredQuotations(prev => prev.filter(rq => rq.id !== q.id));
                                    }
                                  }}
                                  disabled={!isStepEnabled(2) || 2 < activeStep}
                                  aria-label="削除"
                                  className="inline-flex items-center justify-center w-7 h-7 bg-surface-card border border-content-alert text-content-alert rounded-md hover:bg-stroke-card transition-colors disabled:opacity-50"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                <div className="flex justify-end mt-6">
                  <button
                    onClick={handleStep2Complete}
                    disabled={!isStepEnabled(2) || 2 < activeStep || isSubmitting}
                    className="inline-flex items-center gap-2 h-12 px-6 bg-cta-primary text-white rounded-lg text-base font-medium hover:bg-cta-primary-dark transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    見積登録完了
                    <ChevronRight className="w-4 h-4" />
                    STEP③へ
                  </button>
                </div>
              </section>

              {/* ===== STEP③ ===== */}
              <section className={`pb-8 mb-8 border-b border-stroke-input ${isStepEnabled(3) ? '' : 'opacity-60 pointer-events-none'}`}>
                <StepHeading step="STEP③" title="．作業日登録" />

                <div className="mb-5">
                  <SubSectionTitle>作業日確認</SubSectionTitle>
                  <FieldRow label="作業日">
                    <input
                      type="date"
                      value={formData.deliveryDate}
                      onChange={(e) => updateFormData({ deliveryDate: e.target.value })}
                      className={`${inputCls} max-w-[200px] tabular-nums`}
                      disabled={!isStepEnabled(3) || 3 < activeStep}
                    />
                  </FieldRow>
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={handleStep3Complete}
                    disabled={!isStepEnabled(3) || 3 < activeStep || isSubmitting || !formData.deliveryDate}
                    className={`h-12 px-12 rounded-lg text-base font-medium transition-colors ${formData.deliveryDate ? 'bg-cta-primary text-white hover:bg-cta-primary-dark cursor-pointer' : 'bg-surface-negative text-content-sub cursor-not-allowed'} disabled:opacity-60`}
                  >
                    作業日確定
                  </button>
                </div>
              </section>

              {/* ===== STEP④ ===== */}
              <section className={`pb-8 ${isStepEnabled(5) ? '' : 'opacity-60 pointer-events-none'}`}>
                <StepHeading
                  step="STEP④"
                  title="．完了登録"
                  instruction="完了報告書・廃棄証明書等のドキュメントを登録し、検収を完了してください。"
                />

                <div className="mb-5">
                  <SubSectionTitle>ドキュメント追加</SubSectionTitle>
                  <table className="w-full border-collapse">
                    <tbody>
                      <tr>
                        <ThLabelCell width="w-[200px]">添付ファイル</ThLabelCell>
                        <TdCell>
                          <div className="flex items-center gap-3">
                            <label className={`inline-flex items-center gap-1.5 px-4 py-2 bg-surface-card border border-stroke-input rounded-lg text-sm hover:bg-stroke-card transition-colors ${isStepEnabled(5) ? 'cursor-pointer' : 'cursor-not-allowed opacity-60'}`}>
                              <Download className="w-4 h-4" />
                              ファイルの選択
                              <input
                                type="file"
                                accept=".pdf,.jpg,.jpeg,.png"
                                disabled={!isStepEnabled(5)}
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) setSelectedDocFileName(file.name);
                                }}
                                className="hidden"
                              />
                            </label>
                            <span className={`text-sm ${selectedDocFileName ? 'text-cta-primary' : 'text-content-sub'}`}>
                              {selectedDocFileName || 'ファイルが選択されていません'}
                            </span>
                          </div>
                        </TdCell>
                      </tr>
                      <tr>
                        <ThLabelCell width="w-[200px]">ドキュメント種別</ThLabelCell>
                        <TdCell>
                          <div className="flex flex-col gap-2">
                            {(['完了報告書', '廃棄証明書', 'マニフェスト', '契約書', '請求書', 'その他'] as const).map(dtype => (
                              <label key={dtype} className="inline-flex items-center gap-2 cursor-pointer text-base">
                                <input
                                  type="radio"
                                  name="documentType"
                                  checked={formData.documentType === dtype}
                                  onChange={() => updateFormData({ documentType: dtype })}
                                  disabled={!isStepEnabled(5)}
                                  className="accent-cta-primary w-4 h-4"
                                />
                                {dtype}
                              </label>
                            ))}
                          </div>
                        </TdCell>
                      </tr>
                    </tbody>
                  </table>

                  <div className="flex justify-end mt-3">
                    <button
                      onClick={handleAddDocument}
                      disabled={!isStepEnabled(5) || !selectedDocFileName}
                      className={`h-10 px-5 rounded-lg text-sm font-bold transition-colors ${selectedDocFileName ? 'bg-cta-primary text-white hover:bg-cta-primary-dark cursor-pointer' : 'bg-surface-negative text-content-sub cursor-not-allowed'}`}
                    >
                      ドキュメント登録
                    </button>
                  </div>
                </div>

                {registeredDocuments.length > 0 && (
                  <div className="mb-5">
                    <SubSectionTitle>登録済みドキュメント（{registeredDocuments.length}件）</SubSectionTitle>
                    <div className="border border-stroke-input rounded-lg overflow-x-auto">
                      <table className="w-full border-collapse text-sm">
                        <thead>
                          <tr className="bg-stroke-card border-b border-stroke-input">
                            <th className="px-3 py-2 text-left font-semibold text-content-primary">種別</th>
                            <th className="px-3 py-2 text-left font-semibold text-content-primary">ファイル名</th>
                            <th className="px-3 py-2 text-center font-semibold text-content-primary w-[60px]"></th>
                          </tr>
                        </thead>
                        <tbody>
                          {registeredDocuments.map((doc) => (
                            <tr key={doc.id} className="border-b border-stroke-input last:border-b-0">
                              <td className="px-3 py-2">
                                <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-bold bg-surface-select text-cta-primary-dark">
                                  {doc.documentType}
                                </span>
                              </td>
                              <td className="px-3 py-2">
                                <span className="inline-flex items-center gap-1.5">
                                  <FileText className="w-4 h-4 text-content-sub" />
                                  {doc.fileName}
                                </span>
                              </td>
                              <td className="px-3 py-2 text-center">
                                <button
                                  onClick={() => {
                                    if (confirm('このドキュメントを削除しますか？')) {
                                      setRegisteredDocuments(prev => prev.filter(d => d.id !== doc.id));
                                    }
                                  }}
                                  disabled={!isStepEnabled(5)}
                                  aria-label="削除"
                                  className="inline-flex items-center justify-center w-7 h-7 bg-surface-card border border-content-alert text-content-alert rounded-md hover:bg-stroke-card transition-colors disabled:opacity-50"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </section>

              {/* Bottom 検収完了 button */}
              <div className="flex justify-center pt-2 pb-6">
                <button
                  onClick={handleStep5Complete}
                  disabled={!isStepEnabled(5) || isSubmitting}
                  className="h-12 w-[239px] bg-cta-primary text-white rounded-lg text-base font-medium hover:bg-cta-primary-dark transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  検収完了（タスク完了）
                </button>
              </div>
            </div>

            {/* Drag handle */}
            <div
              onMouseDown={handleDragStart}
              className="w-2 cursor-col-resize bg-stroke-card hover:bg-stroke-input transition-colors flex items-center justify-center flex-shrink-0 rounded"
              aria-label="パネル幅を調整"
            >
              <div className="w-0.5 h-10 bg-stroke-input rounded" />
            </div>

            {/* Right: preview */}
            <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
              {/* Horizontal tabs */}
              <div className="flex border-b border-stroke-input">
                {PREVIEW_TABS.map((tab) => {
                  const isActive = previewTab === tab;
                  return (
                    <button
                      key={tab}
                      onClick={() => {
                        setPreviewTab(tab);
                        setPreviewQuotationIndex(null);
                        setPreviewDocumentIndex(null);
                      }}
                      className={`flex-1 h-12 px-4 text-base text-center transition-colors ${isActive ? 'border-b-4 border-cta-primary-dark text-cta-primary-dark font-medium' : 'text-content-primary hover:bg-stroke-card'}`}
                    >
                      {tab}
                    </button>
                  );
                })}
              </div>

              <div className="flex-1 overflow-auto p-4">
                {/* 見積依頼書プレビュー */}
                {previewTab === '見積依頼書' && (() => {
                  const vIdx = previewVendorIndex ?? 0;
                  const vendor = vendors[vIdx];
                  return (
                    <article className="bg-surface-card border border-stroke-input rounded-lg p-6 max-w-[600px] mx-auto">
                      <h2 className="text-center text-xl font-bold text-content-primary border-b border-stroke-input pb-3 mb-4">
                        見積依頼書
                      </h2>

                      <div className="flex justify-between gap-6 mb-4">
                        <div className="flex-1">
                          <p className="text-xs text-content-sub mb-1">【宛先】</p>
                          <p className="text-base font-bold text-content-primary">{vendor?.vendorName || '（未設定）'}</p>
                          <p className="text-sm text-content-primary">{vendor?.personInCharge || ''} 様</p>
                        </div>
                        <div className="flex-1 text-right">
                          <p className="text-xs text-content-sub mb-1">【差出人】</p>
                          <p className="text-sm text-content-primary">{formData.receptionDepartment || '○○病院'}</p>
                          <p className="text-xs text-content-primary">
                            {formData.receptionPerson} / {formData.receptionContact}
                          </p>
                        </div>
                      </div>

                      <p className="text-center text-base font-bold mb-3">記</p>
                      <p className="text-sm mb-3"><strong>申請No.</strong> {application.applicationNo}</p>

                      <table className="w-full border-collapse text-sm mb-4">
                        <tbody>
                          {([
                            ['QRラベル', application.qrLabel],
                            ['品目名', application.itemName],
                            ['メーカー', application.maker],
                            ['型式', application.model],
                            ['シリアルNo.', application.serialNo],
                            ['設置部署', `${application.installationDivision} ${application.installationDepartment}`],
                            ['室名', application.installationRoom],
                          ] as [string, string][]).map(([label, value]) => (
                            <tr key={label}>
                              <th className="px-3 py-1.5 bg-stroke-card text-content-primary font-normal text-left w-[128px] border border-stroke-input">{label}</th>
                              <td className="px-3 py-1.5 border border-stroke-input">{value}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>

                      <div className="mb-3">
                        <p className="text-sm font-bold text-content-primary mb-1">廃棄理由</p>
                        <p className="text-sm text-content-primary">{application.disposalReason}</p>
                      </div>

                      {vendor?.requestNote && (
                        <div className="mb-3">
                          <p className="text-sm font-bold text-content-primary mb-1">ご依頼事項</p>
                          <p className="text-sm text-content-primary p-3 bg-surface-select rounded-md border border-stroke-input">
                            {vendor.requestNote}
                          </p>
                        </div>
                      )}

                      <p className="text-center text-xs text-content-sub mt-6">— 以上 —</p>
                    </article>
                  );
                })()}

                {/* 見積書一覧 */}
                {previewTab === '見積書' && previewQuotationIndex === null && (
                  <div className="bg-surface-card border border-stroke-input rounded-lg p-4">
                    <h4 className="text-base font-bold text-content-primary mb-3">登録済み見積書一覧</h4>
                    {registeredQuotations.length > 0 ? (
                      <table className="w-full border-collapse text-sm">
                        <thead>
                          <tr className="bg-stroke-card border-b border-stroke-input">
                            <th className="px-3 py-2 text-left font-semibold text-content-primary">業者名</th>
                            <th className="px-3 py-2 text-right font-semibold text-content-primary">見積金額</th>
                            <th className="px-3 py-2 text-left font-semibold text-content-primary">ファイル名</th>
                            <th className="px-3 py-2 text-center font-semibold text-content-primary w-20">操作</th>
                          </tr>
                        </thead>
                        <tbody>
                          {registeredQuotations.map((q, idx) => (
                            <tr key={q.id} className="border-b border-stroke-input last:border-b-0">
                              <td className="px-3 py-2">{q.vendorName}</td>
                              <td className="px-3 py-2 text-right tabular-nums">¥{q.amount.toLocaleString()}</td>
                              <td className="px-3 py-2">{q.fileName}</td>
                              <td className="px-3 py-2 text-center">
                                <button
                                  onClick={() => setPreviewQuotationIndex(idx)}
                                  className="px-2.5 py-1 bg-cta-primary text-white rounded-md text-xs hover:bg-cta-primary-dark transition-colors"
                                >
                                  表示
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : (
                      <EmptyState message="登録済みの見積書はありません" hint="STEP②で見積書を登録してください" />
                    )}
                  </div>
                )}

                {/* 見積書個別 */}
                {previewTab === '見積書' && previewQuotationIndex !== null && (() => {
                  const q = registeredQuotations[previewQuotationIndex];
                  if (!q) return null;
                  return (
                    <div className="bg-surface-card border border-stroke-input rounded-lg p-4 h-full flex flex-col">
                      <button
                        onClick={() => setPreviewQuotationIndex(null)}
                        className="inline-flex items-center gap-1 self-start px-3 py-1.5 bg-surface-card border border-stroke-input rounded-md text-xs hover:bg-stroke-card transition-colors mb-4"
                      >
                        <ChevronLeft className="w-3.5 h-3.5" />
                        一覧に戻る
                      </button>
                      <div className="flex-1 bg-content-primary rounded-md flex flex-col items-center justify-center min-h-[300px]">
                        <FileText className="w-16 h-16 text-content-sub mb-4" />
                        <p className="text-base font-bold text-white">{q.fileName}</p>
                        <p className="text-xs text-content-sub mt-1">PDFプレビュー（モック）</p>
                      </div>
                      <table className="w-full border-collapse text-sm mt-4">
                        <tbody>
                          {([
                            ['業者名', q.vendorName],
                            ['見積金額', `¥${q.amount.toLocaleString()}（税別）`],
                            ['フェーズ', q.phase === '発注用' ? '発注登録用' : '参考'],
                            ['保存形式', q.saveFormat],
                          ] as [string, string][]).map(([label, value]) => (
                            <tr key={label}>
                              <th className="px-3 py-2 bg-stroke-card text-content-primary font-normal text-left w-[128px] border border-stroke-input">{label}</th>
                              <td className="px-3 py-2 border border-stroke-input">{value}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  );
                })()}

                {/* 発注書 */}
                {previewTab === '発注書' && (
                  <article className="bg-surface-card border border-stroke-input rounded-lg p-6 max-w-[600px] mx-auto">
                    <h2 className="text-center text-xl font-bold text-content-primary border-b border-stroke-input pb-3 mb-4">廃棄発注書</h2>

                    <div className="flex justify-between gap-6 mb-4">
                      <div className="flex-1">
                        <p className="text-xs text-content-sub mb-1">【宛先】</p>
                        <p className="text-base font-bold text-content-primary">{vendors[0]?.vendorName || '（未設定）'}</p>
                      </div>
                      <div className="flex-1 text-right">
                        <p className="text-xs text-content-sub mb-1">【差出人】</p>
                        <p className="text-sm text-content-primary">{formData.receptionDepartment || '○○病院'}</p>
                      </div>
                    </div>

                    <p className="text-center text-base font-bold mb-3">記</p>

                    <div className="mb-4">
                      <p className="text-sm font-bold mb-2 text-content-primary">【発注内容】</p>
                      <table className="w-full border-collapse text-sm">
                        <tbody>
                          {([
                            ['発注No.', application.applicationNo],
                            ['発注金額', `¥${(registeredQuotations.find(q => q.phase === '発注用')?.amount || 0).toLocaleString()}（税別）`],
                            ['納品場所', `${application.installationDivision} ${application.installationDepartment} ${application.installationRoom}`],
                          ] as [string, string][]).map(([label, value]) => (
                            <tr key={label}>
                              <th className="px-3 py-1.5 bg-stroke-card text-content-primary font-normal text-left w-[128px] border border-stroke-input">{label}</th>
                              <td className="px-3 py-1.5 border border-stroke-input tabular-nums">{value}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <p className="text-center text-xs text-content-sub mt-6">— 以上 —</p>
                  </article>
                )}

                {/* 完了報告書他 一覧 */}
                {previewTab === '完了報告書他' && previewDocumentIndex === null && (
                  <div className="bg-surface-card border border-stroke-input rounded-lg p-4">
                    <h4 className="text-base font-bold text-content-primary mb-3">登録済みドキュメント一覧</h4>
                    {registeredDocuments.length > 0 ? (
                      <table className="w-full border-collapse text-sm">
                        <thead>
                          <tr className="bg-stroke-card border-b border-stroke-input">
                            <th className="px-3 py-2 text-left font-semibold text-content-primary">種別</th>
                            <th className="px-3 py-2 text-left font-semibold text-content-primary">ファイル名</th>
                            <th className="px-3 py-2 text-center font-semibold text-content-primary">登録日</th>
                            <th className="px-3 py-2 text-center font-semibold text-content-primary w-20">操作</th>
                          </tr>
                        </thead>
                        <tbody>
                          {registeredDocuments.map((doc, idx) => (
                            <tr key={doc.id} className="border-b border-stroke-input last:border-b-0">
                              <td className="px-3 py-2">{doc.documentType}</td>
                              <td className="px-3 py-2">{doc.fileName}</td>
                              <td className="px-3 py-2 text-center tabular-nums">
                                {new Date(doc.registeredAt).toLocaleDateString('ja-JP')}
                              </td>
                              <td className="px-3 py-2 text-center">
                                <button
                                  onClick={() => setPreviewDocumentIndex(idx)}
                                  className="px-2.5 py-1 bg-cta-primary text-white rounded-md text-xs hover:bg-cta-primary-dark transition-colors"
                                >
                                  表示
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : (
                      <EmptyState message="登録済みのドキュメントはありません" hint="STEP④でドキュメントを登録してください" />
                    )}
                  </div>
                )}

                {/* 完了報告書他 個別 */}
                {previewTab === '完了報告書他' && previewDocumentIndex !== null && (() => {
                  const doc = registeredDocuments[previewDocumentIndex];
                  if (!doc) return null;
                  return (
                    <div className="bg-surface-card border border-stroke-input rounded-lg p-4 h-full flex flex-col">
                      <button
                        onClick={() => setPreviewDocumentIndex(null)}
                        className="inline-flex items-center gap-1 self-start px-3 py-1.5 bg-surface-card border border-stroke-input rounded-md text-xs hover:bg-stroke-card transition-colors mb-4"
                      >
                        <ChevronLeft className="w-3.5 h-3.5" />
                        一覧に戻る
                      </button>
                      <div className="flex-1 bg-content-primary rounded-md flex flex-col items-center justify-center min-h-[300px]">
                        <FileText className="w-16 h-16 text-content-sub mb-4" />
                        <p className="text-base font-bold text-white">{doc.fileName}</p>
                        <p className="text-xs text-content-sub mt-1">PDFプレビュー（モック）</p>
                      </div>
                      <table className="w-full border-collapse text-sm mt-4">
                        <tbody>
                          {([
                            ['種別', doc.documentType],
                            ['勘定科目', doc.accountType === 'その他' ? doc.accountOther || 'その他' : doc.accountType],
                            ['登録日時', new Date(doc.registeredAt).toLocaleString('ja-JP')],
                          ] as [string, string][]).map(([label, value]) => (
                            <tr key={label}>
                              <th className="px-3 py-2 bg-stroke-card text-content-primary font-normal text-left w-[128px] border border-stroke-input">{label}</th>
                              <td className="px-3 py-2 border border-stroke-input">{value}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>
        </div>
      </main>

      <OrderRegistrationModal
        isOpen={isOrderRegisterModalOpen}
        onClose={() => setIsOrderRegisterModalOpen(false)}
        orderNoPrefix="PO-DISPOSAL"
        onConfirm={(orderNo, deliveryMethod) => {
          setRegisteredOrderNo(orderNo);
          setIsOrderRegisterModalOpen(false);
          alert(`発注登録が完了しました。\n発注No,: ${orderNo}\n送付方法: ${deliveryMethod}`);
        }}
      />
    </div>
  );
}

// ============================================================
// Field helpers
// ============================================================
function FieldLabel({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="text-xs text-content-sub mb-1">
        {label}
        {required && <span className="text-content-alert ml-1">*</span>}
      </p>
      {children}
    </div>
  );
}

function FieldRow({ label, children }: { label: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3">
      <label className={`${labelCls} min-w-[140px]`}>{label}</label>
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  );
}

function EmptyState({ message, hint }: { message: string; hint?: string }) {
  return (
    <div className="text-center text-content-sub py-8">
      <FolderOpen className="w-10 h-10 mx-auto mb-3 text-content-sub" />
      <p className="text-sm">{message}</p>
      {hint && <p className="text-xs mt-2">{hint}</p>}
    </div>
  );
}

// ============================================================
// Page wrapper
// ============================================================
export default function DisposalTaskPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col min-h-dvh bg-surface-screen">
        <Header
          title="廃棄契約管理"
          hideMenu={true}
          showBackButton={true}
          backHref="/quotation-data-box/transfer-management"
          backLabel="一覧に戻る"
          backButtonVariant="secondary"
          hideHomeButton={true}
        />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-content-sub">読み込み中...</p>
        </div>
      </div>
    }>
      <DisposalTaskContent />
    </Suspense>
  );
}
