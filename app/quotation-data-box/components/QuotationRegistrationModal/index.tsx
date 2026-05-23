import React, { useState, useCallback } from 'react';
import { RfqGroup, AssetMaster, Application } from '@/lib/types';
import { OCRResult, QuotationFormData, OCRResultItem, ConfirmedStateMap } from '@/lib/types/quotation';
import { Step1RfqGroupSelection } from './Step1RfqGroupSelection';
import { Step2OcrResultDisplay } from './Step2OcrResultDisplay';
import { Step3ItemTypeClassification } from './Step3ItemTypeClassification';
import { Step4IndividualItemLinking } from './Step4IndividualItemLinking';
import { Step5PriceAllocation } from './Step5PriceAllocation';
import { ApplicationFormData } from './ApplicationCreationModal';

// ステップ数の定義
type StepNumber = 1 | 2 | 3 | 4 | 5;

// ステップ名の定義
const STEP_NAMES: Record<StepNumber, string> = {
  1: 'PDF取込',
  2: 'OCR明細確認',
  3: '登録区分AI判定',
  4: '個体管理品目AI判定',
  5: '金額案分・登録',
};

interface QuotationRegistrationModalProps {
  show: boolean;
  step: StepNumber;
  rfqGroups: RfqGroup[];
  assetMasterData: AssetMaster[];
  applications: Application[];
  formData: QuotationFormData;
  ocrProcessing: boolean;
  ocrResult: OCRResult | null;
  onFormDataChange: (formData: QuotationFormData) => void;
  onPdfUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onGenerateTestOCR: () => void;
  onStepChange: (step: StepNumber) => void;
  onCreateApplication: (formData: ApplicationFormData, ocrItem: OCRResultItem) => void;
  onSubmit: (confirmedState: ConfirmedStateMap, ocrResult: OCRResult) => void;
  onClose: () => void;
}

export const QuotationRegistrationModal: React.FC<QuotationRegistrationModalProps> = ({
  show,
  step,
  rfqGroups,
  assetMasterData,
  applications,
  formData,
  ocrProcessing,
  ocrResult,
  onFormDataChange,
  onPdfUpload,
  onGenerateTestOCR,
  onStepChange,
  onCreateApplication,
  onSubmit,
  onClose,
}) => {
  // Step2以降で確定された内容を管理
  const [confirmedState, setConfirmedState] = useState<ConfirmedStateMap>({});
  // OCR結果の編集版を管理
  const [editedOcrResult, setEditedOcrResult] = useState<OCRResult | null>(null);

  // 実際に使用するOCR結果（編集版があればそれを使用）
  const currentOcrResult = editedOcrResult || ocrResult;

  // 確定状態変更コールバック
  const handleConfirmedStateChange = useCallback((newState: ConfirmedStateMap) => {
    setConfirmedState(newState);
  }, []);

  // OCR結果更新コールバック
  const handleOcrResultChange = useCallback((result: OCRResult) => {
    setEditedOcrResult(result);
  }, []);

  // 最終登録
  const handleSubmit = useCallback(() => {
    if (currentOcrResult) {
      onSubmit(confirmedState, currentOcrResult);
    }
  }, [confirmedState, currentOcrResult, onSubmit]);

  if (!show) return null;

  // 選択された見積依頼グループを取得
  const selectedRfqGroup = formData.rfqGroupId
    ? rfqGroups.find(g => g.id.toString() === formData.rfqGroupId)
    : undefined;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'white',
          borderRadius: '8px',
          padding: '30px',
          minWidth: '600px',
          maxWidth: '95%',
          width: step >= 2 ? '1400px' : undefined,
          maxHeight: '92vh',
          overflow: 'auto',
          boxShadow: '0 4px 20px rgba(0,0,0,0.15)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ヘッダー */}
        <div style={{ marginBottom: '20px' }}>
          <h2 style={{ margin: '0 0 12px 0', fontSize: '20px', fontWeight: 'bold', color: '#4A4A4A' }}>
            見積登録（購入）
          </h2>

          {/* ステッププログレス */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            {([1, 2, 3, 4, 5] as StepNumber[]).map((s) => (
              <React.Fragment key={s}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 12px',
                    borderRadius: '4px',
                    background: step === s ? '#087CB6' : step > s ? '#008C1D' : '#FAFAFA',
                    color: step >= s ? 'white' : '#8A8A8A',
                    fontSize: '11px',
                    fontWeight: step === s ? 'bold' : 'normal',
                  }}
                >
                  <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '18px',
                    height: '18px',
                    borderRadius: '50%',
                    background: step >= s ? 'rgba(255,255,255,0.3)' : '#E1E1E1',
                    fontSize: '10px',
                    fontWeight: 'bold',
                  }}>
                    {step > s ? '✓' : s}
                  </span>
                  {STEP_NAMES[s]}
                </div>
                {s < 5 && (
                  <div style={{
                    width: '20px',
                    height: '2px',
                    background: step > s ? '#008C1D' : '#E1E1E1',
                  }} />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Step1: PDF取込 */}
        {step === 1 && (
          <Step1RfqGroupSelection
            rfqGroups={rfqGroups}
            formData={formData}
            ocrProcessing={ocrProcessing}
            onFormDataChange={onFormDataChange}
            onPdfUpload={onPdfUpload}
            onGenerateTestOCR={onGenerateTestOCR}
            onCancel={onClose}
          />
        )}

        {/* Step2: OCR明細確認 */}
        {step === 2 && currentOcrResult && (
          <Step2OcrResultDisplay
            ocrResult={currentOcrResult}
            pdfFile={formData.pdfFile}
            confirmedState={confirmedState}
            onConfirmedStateChange={handleConfirmedStateChange}
            onOcrResultChange={handleOcrResultChange}
            onBack={() => onStepChange(1)}
            onNext={() => onStepChange(3)}
          />
        )}

        {/* Step3: 登録区分AI判定 */}
        {step === 3 && currentOcrResult && (
          <Step3ItemTypeClassification
            ocrResult={currentOcrResult}
            onOcrResultChange={handleOcrResultChange}
            onBack={() => onStepChange(2)}
            onNext={() => onStepChange(4)}
          />
        )}

        {/* Step4: 個体管理品目AI判定 */}
        {step === 4 && currentOcrResult && (
          <Step4IndividualItemLinking
            ocrResult={currentOcrResult}
            confirmedState={confirmedState}
            onConfirmedStateChange={handleConfirmedStateChange}
            onBack={() => onStepChange(3)}
            onNext={() => onStepChange(5)}
          />
        )}

        {/* Step5: 金額案分・登録確定 */}
        {step === 5 && currentOcrResult && (
          <Step5PriceAllocation
            ocrResult={currentOcrResult}
            confirmedState={confirmedState}
            onBack={() => onStepChange(4)}
            onSubmit={handleSubmit}
          />
        )}
      </div>
    </div>
  );
};
