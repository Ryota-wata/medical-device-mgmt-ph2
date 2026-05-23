import React, { useState } from 'react';
import { Application, RfqGroup } from '@/lib/types';
import { OCRResult, OCRResultItem, ConfirmedStateMap } from '@/lib/types/quotation';
import { ApplicationCreationModal, ApplicationFormData } from './ApplicationCreationModal';

interface Step3AssetMasterLinkingProps {
  ocrResult: OCRResult;
  rfqGroup?: RfqGroup;
  applications: Application[];
  confirmedState: ConfirmedStateMap;
  onCreateApplication: (formData: ApplicationFormData, ocrItem: OCRResultItem) => void;
  onBack: () => void;
  onSubmit: () => void;
}

export const Step3AssetMasterLinking: React.FC<Step3AssetMasterLinkingProps> = ({
  ocrResult,
  rfqGroup,
  applications,
  onCreateApplication,
  onBack,
  onSubmit,
}) => {
  // 申請作成モーダルの状態
  const [showApplicationModal, setShowApplicationModal] = useState(false);
  const [selectedOcrItem, setSelectedOcrItem] = useState<OCRResultItem | null>(null);

  // 見積依頼グループに紐づいた申請を取得
  const linkedApplications = rfqGroup
    ? applications.filter(app => rfqGroup.applicationIds.includes(String(app.id)))
    : [];

  // 金額フォーマット
  const formatCurrency = (value: number) => `¥${value.toLocaleString()}`;

  const handleOpenApplicationModal = (ocrItem: OCRResultItem) => {
    setSelectedOcrItem(ocrItem);
    setShowApplicationModal(true);
  };

  const handleCloseApplicationModal = () => {
    setShowApplicationModal(false);
    setSelectedOcrItem(null);
  };

  const handleSubmitApplication = (formData: ApplicationFormData) => {
    if (selectedOcrItem) {
      onCreateApplication(formData, selectedOcrItem);
    }
    handleCloseApplicationModal();
  };

  return (
    <div>
      {/* 説明 */}
      <div style={{ marginBottom: '20px', padding: '14px', background: '#EBF5EE', borderRadius: '6px', border: '1px solid #087CB6' }}>
        <p style={{ margin: '0', fontSize: '12px', color: '#4A4A4A', lineHeight: '1.5' }}>
          以下の全ての明細が見積明細情報画面に登録されます。
        </p>
      </div>

      {/* 申請済み資産セクション */}
      <div style={{ marginBottom: '20px' }}>
        <h4 style={{
          margin: '0 0 10px 0',
          fontSize: '14px',
          fontWeight: 'bold',
          color: '#4A4A4A',
          borderLeft: '4px solid #008C1D',
          paddingLeft: '10px'
        }}>
          紐づく申請（{linkedApplications.length}件）
        </h4>
        <div style={{
          maxHeight: '150px',
          overflow: 'auto',
          border: '1px solid #E1E1E1',
          borderRadius: '6px',
          background: '#FAFAFA'
        }}>
          {linkedApplications.length === 0 ? (
            <div style={{ padding: '16px', textAlign: 'center', color: '#8A8A8A', fontSize: '13px' }}>
              紐づいた申請がありません
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
              <thead style={{ position: 'sticky', top: 0, background: '#FAFAFA', zIndex: 1 }}>
                <tr>
                  <th style={{ padding: '8px', textAlign: 'left', border: '2px solid #E1E1E1', fontWeight: 'bold', color: '#4A4A4A', width: '100px' }}>申請No</th>
                  <th style={{ padding: '8px', textAlign: 'left', border: '2px solid #E1E1E1', fontWeight: 'bold', color: '#4A4A4A', width: '80px' }}>種別</th>
                  <th style={{ padding: '8px', textAlign: 'left', border: '2px solid #E1E1E1', fontWeight: 'bold', color: '#4A4A4A' }}>品目</th>
                  <th style={{ padding: '8px', textAlign: 'left', border: '2px solid #E1E1E1', fontWeight: 'bold', color: '#4A4A4A' }}>型式</th>
                  <th style={{ padding: '8px', textAlign: 'left', border: '2px solid #E1E1E1', fontWeight: 'bold', color: '#4A4A4A' }}>設置場所</th>
                </tr>
              </thead>
              <tbody>
                {linkedApplications.map((app) => (
                  <tr key={app.id} style={{ borderBottom: '1px solid #E1E1E1' }}>
                    <td style={{ padding: '8px', fontWeight: 'bold', color: '#008C1D' }}>{app.applicationNo}</td>
                    <td style={{ padding: '8px' }}>
                      <span style={{
                        display: 'inline-block',
                        padding: '2px 6px',
                        borderRadius: '3px',
                        fontSize: '10px',
                        fontWeight: 'bold',
                        background: app.applicationType === '新規申請' ? '#008C1D' :
                                   app.applicationType === '更新申請' ? '#4A4A4A' :
                                   app.applicationType === '増設申請' ? '#087CB6' : '#8A8A8A',
                        color: 'white',
                      }}>
                        {app.applicationType}
                      </span>
                    </td>
                    <td style={{ padding: '8px' }}>{app.asset.name}</td>
                    <td style={{ padding: '8px', color: '#555' }}>{app.asset.model}</td>
                    <td style={{ padding: '8px', color: '#555', fontSize: '10px' }}>
                      {app.facility.building} {app.facility.floor} {app.facility.department}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* 登録される見積明細 */}
      <div style={{ marginBottom: '20px' }}>
        <h4 style={{
          margin: '0 0 10px 0',
          fontSize: '14px',
          fontWeight: 'bold',
          color: '#4A4A4A',
          borderLeft: '4px solid #4A4A4A',
          paddingLeft: '10px'
        }}>
          登録される見積明細（{ocrResult.items.length}件）
        </h4>
        <div style={{ border: '1px solid #E1E1E1', borderRadius: '6px', overflow: 'hidden' }}>
          <div style={{ maxHeight: '300px', overflowX: 'auto', overflowY: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', minWidth: '900px' }}>
              <thead style={{ position: 'sticky', top: 0, zIndex: 2, background: '#FAFAFA' }}>
                <tr>
                  <th style={{ padding: '8px', textAlign: 'center', border: '2px solid #E1E1E1', fontWeight: 'bold', color: '#4A4A4A', width: '40px' }}>No</th>
                  <th style={{ padding: '8px', textAlign: 'left', border: '2px solid #E1E1E1', fontWeight: 'bold', color: '#4A4A4A' }}>品名</th>
                  <th style={{ padding: '8px', textAlign: 'left', border: '2px solid #E1E1E1', fontWeight: 'bold', color: '#4A4A4A', width: '120px' }}>メーカー</th>
                  <th style={{ padding: '8px', textAlign: 'left', border: '2px solid #E1E1E1', fontWeight: 'bold', color: '#4A4A4A', width: '120px' }}>型式</th>
                  <th style={{ padding: '8px', textAlign: 'right', border: '2px solid #E1E1E1', fontWeight: 'bold', color: '#4A4A4A', width: '60px' }}>数量</th>
                  <th style={{ padding: '8px', textAlign: 'right', border: '2px solid #E1E1E1', fontWeight: 'bold', color: '#4A4A4A', width: '100px' }}>税込金額</th>
                  <th style={{ padding: '8px', textAlign: 'center', border: '2px solid #E1E1E1', fontWeight: 'bold', color: '#4A4A4A', width: '80px' }}>操作</th>
                </tr>
              </thead>
              <tbody>
                {ocrResult.items.map((item, index) => (
                  <tr key={index} style={{ borderBottom: '1px solid #E1E1E1' }}>
                    <td style={{ padding: '8px', textAlign: 'center', fontWeight: 'bold' }}>{index + 1}</td>
                    <td style={{ padding: '8px', fontWeight: 'bold' }}>{item.itemName}</td>
                    <td style={{ padding: '8px', color: '#555' }}>{item.manufacturer || '-'}</td>
                    <td style={{ padding: '8px', color: '#555' }}>{item.model || '-'}</td>
                    <td style={{ padding: '8px', textAlign: 'right' }}>{item.quantity} {item.unit || ''}</td>
                    <td style={{ padding: '8px', textAlign: 'right', fontWeight: 'bold' }}>{formatCurrency(item.totalWithTax)}</td>
                    <td style={{ padding: '8px', textAlign: 'center' }}>
                      <button
                        onClick={() => handleOpenApplicationModal(item)}
                        style={{
                          padding: '4px 10px',
                          background: '#4A4A4A',
                          color: 'white',
                          border: 'none',
                          borderRadius: '3px',
                          cursor: 'pointer',
                          fontSize: '10px',
                          fontWeight: 'bold',
                        }}
                      >
                        申請作成
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

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
          onClick={onSubmit}
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
          登録確定
        </button>
      </div>

      {/* 申請作成モーダル */}
      {showApplicationModal && selectedOcrItem && (
        <ApplicationCreationModal
          show={showApplicationModal}
          ocrItem={selectedOcrItem}
          assetInfo={{
            category: '',
            majorCategory: '',
            middleCategory: '',
            assetName: selectedOcrItem.itemName,
            manufacturer: selectedOcrItem.manufacturer || '',
            model: selectedOcrItem.model || '',
          }}
          onSubmit={handleSubmitApplication}
          onClose={handleCloseApplicationModal}
        />
      )}
    </div>
  );
};
