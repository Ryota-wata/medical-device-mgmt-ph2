import React, { useState } from 'react';
import { RfqGroup } from '@/lib/types';
import { QuotationFormData } from '@/lib/types/quotation';
import { useAuthStore } from '@/lib/stores/authStore';

interface Step1RfqGroupSelectionProps {
  rfqGroups: RfqGroup[];
  formData: QuotationFormData;
  ocrProcessing: boolean;
  onFormDataChange: (formData: QuotationFormData) => void;
  onPdfUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onGenerateTestOCR: () => void;
  onCancel: () => void;
}

// 保存形式の型
type SaveFormat = 'electronic' | 'scanner' | 'unspecified';

export const Step1RfqGroupSelection: React.FC<Step1RfqGroupSelectionProps> = ({
  rfqGroups,
  formData,
  ocrProcessing,
  onFormDataChange,
  onPdfUpload,
  onGenerateTestOCR,
  onCancel,
}) => {
  const { user } = useAuthStore();
  const [quotationPhase, setQuotationPhase] = useState('listPrice');
  const [saveFormat, setSaveFormat] = useState<SaveFormat>('scanner');
  const [fileName, setFileName] = useState('');
  const [registrationDeadline, setRegistrationDeadline] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFileName(file.name);
    }
    onPdfUpload(e);
  };

  return (
    <div>
      {/* フォームテーブル */}
      <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #4A4A4A' }}>
        <tbody>
          {/* 添付ファイル */}
          <tr>
            <th style={{
              background: '#4A4A4A',
              color: 'white',
              padding: '10px 12px',
              fontSize: '13px',
              fontWeight: 'bold',
              textAlign: 'left',
              width: '120px',
              border: '1px solid #4A4A4A',
              whiteSpace: 'nowrap',
            }}>
              添付ファイル
            </th>
            <td style={{
              background: 'white',
              padding: '10px 12px',
              border: '1px solid #4A4A4A',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <label style={{
                  padding: '6px 16px',
                  background: '#FAFAFA',
                  border: '1px solid #E1E1E1',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '13px',
                  whiteSpace: 'nowrap',
                }}>
                  ファイルの選択
                  <input
                    type="file"
                    accept=".pdf,.xlsx,.xls"
                    onChange={handleFileChange}
                    style={{ display: 'none' }}
                  />
                </label>
                <span style={{ color: '#8A8A8A', fontSize: '13px' }}>
                  {fileName || 'ファイルが選択されていません'}
                </span>
              </div>
            </td>
          </tr>

          {/* 申請者 */}
          <tr>
            <th style={{
              background: '#4A4A4A',
              color: 'white',
              padding: '10px 12px',
              fontSize: '13px',
              fontWeight: 'bold',
              textAlign: 'left',
              width: '120px',
              border: '1px solid #4A4A4A',
              whiteSpace: 'nowrap',
            }}>
              申請者
            </th>
            <td style={{
              background: 'white',
              padding: '10px 12px',
              border: '1px solid #4A4A4A',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{
                  padding: '6px 12px',
                  background: '#FAFAFA',
                  border: '1px solid #E1E1E1',
                  borderRadius: '4px',
                  fontSize: '13px',
                  color: '#4A4A4A',
                }}>
                  {user?.username || 'user001'}
                </span>
                <span style={{ fontSize: '13px', color: '#4A4A4A' }}>
                  {user?.email ? user.email.split('@')[0] : '担当者名'}
                </span>
              </div>
            </td>
          </tr>

          {/* 見積フェーズ */}
          <tr>
            <th style={{
              background: '#4A4A4A',
              color: 'white',
              padding: '10px 12px',
              fontSize: '13px',
              fontWeight: 'bold',
              textAlign: 'left',
              width: '120px',
              border: '1px solid #4A4A4A',
              whiteSpace: 'nowrap',
              verticalAlign: 'top',
            }}>
              見積フェーズ
            </th>
            <td style={{
              background: 'white',
              padding: '10px 12px',
              border: '1px solid #4A4A4A',
            }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '13px' }}>
                  <input
                    type="radio"
                    name="quotationPhase"
                    checked={quotationPhase === 'listPrice'}
                    onChange={() => setQuotationPhase('listPrice')}
                  />
                  定価
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '13px' }}>
                  <input
                    type="radio"
                    name="quotationPhase"
                    checked={quotationPhase === 'approximate'}
                    onChange={() => setQuotationPhase('approximate')}
                  />
                  概算
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '13px' }}>
                  <input
                    type="radio"
                    name="quotationPhase"
                    checked={quotationPhase === 'final'}
                    onChange={() => setQuotationPhase('final')}
                  />
                  最終原本登録用
                </label>
              </div>
            </td>
          </tr>

          {/* 保存形式 */}
          <tr>
            <th style={{
              background: '#4A4A4A',
              color: 'white',
              padding: '10px 12px',
              fontSize: '13px',
              fontWeight: 'bold',
              textAlign: 'left',
              width: '120px',
              border: '1px solid #4A4A4A',
              whiteSpace: 'nowrap',
              verticalAlign: 'top',
            }}>
              保存形式
            </th>
            <td style={{
              background: 'white',
              padding: '10px 12px',
              border: '1px solid #4A4A4A',
            }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '13px' }}>
                  <input
                    type="radio"
                    name="saveFormat"
                    checked={saveFormat === 'electronic'}
                    onChange={() => setSaveFormat('electronic')}
                  />
                  電子取引
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '13px' }}>
                  <input
                    type="radio"
                    name="saveFormat"
                    checked={saveFormat === 'scanner'}
                    onChange={() => setSaveFormat('scanner')}
                  />
                  スキャナ保存
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '13px' }}>
                  <input
                    type="radio"
                    name="saveFormat"
                    checked={saveFormat === 'unspecified'}
                    onChange={() => setSaveFormat('unspecified')}
                  />
                  未指定
                </label>
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      {/* ボタンエリア */}
      <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', alignItems: 'center', marginTop: '20px' }}>
        <button
          onClick={onCancel}
          style={{
            padding: '10px 20px',
            background: '#8A8A8A',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '13px',
            fontWeight: 'bold',
          }}
        >
          キャンセル
        </button>

        {/* SHIPへ依頼 + 登録期限 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={() => {/* SHIPへ依頼処理 */}}
            style={{
              padding: '10px 20px',
              background: '#4A4A4A',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: 'bold',
            }}
          >
            SHIPへ依頼
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <label style={{ fontSize: '12px', color: '#555' }}>登録期限:</label>
            <input
              type="date"
              value={registrationDeadline}
              onChange={(e) => setRegistrationDeadline(e.target.value)}
              style={{
                padding: '6px 10px',
                border: '1px solid #E1E1E1',
                borderRadius: '4px',
                fontSize: '13px',
              }}
            />
          </div>
        </div>

        <button
          onClick={() => {/* Excel取込処理 */}}
          style={{
            padding: '10px 20px',
            background: '#008C1D',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '13px',
            fontWeight: 'bold',
          }}
        >
          Excel取込
        </button>
        <button
          onClick={onGenerateTestOCR}
          disabled={ocrProcessing}
          style={{
            padding: '10px 20px',
            background: ocrProcessing ? '#E1E1E1' : '#087CB6',
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
    </div>
  );
};
