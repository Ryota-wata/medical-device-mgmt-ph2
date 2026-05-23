import React, { useState } from 'react';
import { ApplicationType } from '@/lib/types';
import { OCRResultItem, ConfirmedAssetInfo } from '@/lib/types/quotation';

interface ApplicationFormData {
  applicationType: ApplicationType;
  building: string;
  floor: string;
  department: string;
  section: string;
  roomName: string;
  applicationReason: string;
  executionYear: string;
  quantity: number;
}

interface ApplicationCreationModalProps {
  show: boolean;
  ocrItem: OCRResultItem;
  assetInfo?: ConfirmedAssetInfo; // Step2で確定した資産情報（オプション）
  onSubmit: (formData: ApplicationFormData) => void;
  onClose: () => void;
}

const APPLICATION_TYPES: ApplicationType[] = ['新規申請', '増設申請', '更新申請', '移動申請', '廃棄申請'];

const BUILDINGS = ['本館', '別館', '新館', '東館', '西館'];
const FLOORS = ['B2F', 'B1F', '1F', '2F', '3F', '4F', '5F', '6F', '7F', '8F', '9F', '10F'];
const DEPARTMENTS = ['内科', '外科', '整形外科', '放射線科', '循環器科', '消化器科', '検査科', '手術室', '中央材料室', 'ICU', 'ER', 'リハビリテーション科'];

const currentYear = new Date().getFullYear();
const EXECUTION_YEARS = Array.from({ length: 5 }, (_, i) => (currentYear + i).toString());

export const ApplicationCreationModal: React.FC<ApplicationCreationModalProps> = ({
  show,
  ocrItem,
  assetInfo,
  onSubmit,
  onClose,
}) => {
  const [formData, setFormData] = useState<ApplicationFormData>({
    applicationType: '新規申請',
    building: '',
    floor: '',
    department: '',
    section: '',
    roomName: '',
    applicationReason: '',
    executionYear: currentYear.toString(),
    quantity: ocrItem.quantity || 1,
  });

  if (!show) return null;

  const handleChange = (field: keyof ApplicationFormData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = () => {
    // バリデーション
    if (!formData.applicationType || !formData.building || !formData.floor || !formData.department) {
      alert('必須項目を入力してください');
      return;
    }
    onSubmit(formData);
  };

  const inputStyle = {
    width: '100%',
    padding: '8px 12px',
    border: '1px solid #E1E1E1',
    borderRadius: '4px',
    fontSize: '14px',
    boxSizing: 'border-box' as const,
  };

  const selectStyle = {
    ...inputStyle,
    background: 'white',
  };

  const labelStyle = {
    display: 'block',
    marginBottom: '6px',
    fontSize: '13px',
    fontWeight: 'bold' as const,
    color: '#4A4A4A',
  };

  const requiredMark = <span style={{ color: '#DA0000', marginLeft: '4px' }}>*</span>;

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
        zIndex: 1100,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'white',
          borderRadius: '8px',
          padding: '24px',
          width: '600px',
          maxHeight: '85vh',
          overflow: 'auto',
          boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 style={{ margin: '0 0 20px 0', fontSize: '18px', fontWeight: 'bold', color: '#4A4A4A' }}>
          申請作成
        </h3>

        {/* 確定資産情報（assetInfoがある場合） */}
        {assetInfo && (
          <div style={{ marginBottom: '20px', padding: '15px', background: '#FAFAFA', borderRadius: '4px', border: '1px solid #8A8A8A' }}>
            <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#4A4A4A', marginBottom: '10px' }}>確定資産情報（Step2で確定）</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '6px 12px', fontSize: '13px' }}>
              <span style={{ color: '#4A4A4A' }}>category:</span>
              <span>{assetInfo.category || '-'}</span>
              <span style={{ color: '#4A4A4A' }}>大分類:</span>
              <span>{assetInfo.majorCategory || '-'}</span>
              <span style={{ color: '#4A4A4A' }}>中分類:</span>
              <span>{assetInfo.middleCategory || '-'}</span>
              <span style={{ color: '#4A4A4A' }}>資産名:</span>
              <span style={{ fontWeight: 'bold' }}>{assetInfo.assetName}</span>
              <span style={{ color: '#4A4A4A' }}>メーカー:</span>
              <span>{assetInfo.manufacturer || '-'}</span>
              <span style={{ color: '#4A4A4A' }}>型式:</span>
              <span>{assetInfo.model || '-'}</span>
            </div>
          </div>
        )}

        {/* 見積明細情報（原本） */}
        <div style={{ marginBottom: '20px', padding: '15px', background: '#FAFAFA', borderRadius: '4px', border: '1px solid #E1E1E1' }}>
          <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#4A4A4A', marginBottom: '10px' }}>見積明細情報（原本）</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '6px 12px', fontSize: '13px' }}>
            <span style={{ color: '#8A8A8A' }}>品名:</span>
            <span style={{ fontWeight: 'bold' }}>{ocrItem.itemName}</span>
            <span style={{ color: '#8A8A8A' }}>メーカー:</span>
            <span>{ocrItem.manufacturer || '-'}</span>
            <span style={{ color: '#8A8A8A' }}>型式:</span>
            <span>{ocrItem.model || '-'}</span>
            <span style={{ color: '#8A8A8A' }}>数量:</span>
            <span>{ocrItem.quantity} {ocrItem.unit}</span>
          </div>
        </div>

        {/* 申請フォーム */}
        <div style={{ display: 'grid', gap: '16px' }}>
          {/* 申請種別 */}
          <div>
            <label style={labelStyle}>申請種別{requiredMark}</label>
            <select
              value={formData.applicationType}
              onChange={(e) => handleChange('applicationType', e.target.value as ApplicationType)}
              style={selectStyle}
            >
              {APPLICATION_TYPES.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          {/* 設置場所 */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={labelStyle}>棟{requiredMark}</label>
              <select
                value={formData.building}
                onChange={(e) => handleChange('building', e.target.value)}
                style={selectStyle}
              >
                <option value="">選択してください</option>
                {BUILDINGS.map(b => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={labelStyle}>階{requiredMark}</label>
              <select
                value={formData.floor}
                onChange={(e) => handleChange('floor', e.target.value)}
                style={selectStyle}
              >
                <option value="">選択してください</option>
                {FLOORS.map(f => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={labelStyle}>部門{requiredMark}</label>
              <select
                value={formData.department}
                onChange={(e) => handleChange('department', e.target.value)}
                style={selectStyle}
              >
                <option value="">選択してください</option>
                {DEPARTMENTS.map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={labelStyle}>部署</label>
              <input
                type="text"
                value={formData.section}
                onChange={(e) => handleChange('section', e.target.value)}
                placeholder="例: 検査室"
                style={inputStyle}
              />
            </div>
          </div>

          <div>
            <label style={labelStyle}>部屋名</label>
            <input
              type="text"
              value={formData.roomName}
              onChange={(e) => handleChange('roomName', e.target.value)}
              placeholder="例: MRI検査室1"
              style={inputStyle}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={labelStyle}>数量</label>
              <input
                type="number"
                value={formData.quantity}
                onChange={(e) => handleChange('quantity', parseInt(e.target.value) || 1)}
                min={1}
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>執行年度</label>
              <select
                value={formData.executionYear}
                onChange={(e) => handleChange('executionYear', e.target.value)}
                style={selectStyle}
              >
                {EXECUTION_YEARS.map(year => (
                  <option key={year} value={year}>{year}年度</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label style={labelStyle}>申請理由</label>
            <textarea
              value={formData.applicationReason}
              onChange={(e) => handleChange('applicationReason', e.target.value)}
              placeholder="例: 老朽化による更新"
              rows={3}
              style={{ ...inputStyle, resize: 'vertical' }}
            />
          </div>
        </div>

        {/* ボタン */}
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '24px' }}>
          <button
            onClick={onClose}
            style={{
              padding: '10px 20px',
              background: '#8A8A8A',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 'bold',
            }}
          >
            キャンセル
          </button>
          <button
            onClick={handleSubmit}
            style={{
              padding: '10px 20px',
              background: '#008C1D',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 'bold',
            }}
          >
            申請を作成
          </button>
        </div>
      </div>
    </div>
  );
};

// 型エクスポート
export type { ApplicationFormData };
