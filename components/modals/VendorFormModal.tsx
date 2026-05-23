'use client';

import { useState, useEffect } from 'react';
import { VendorMaster } from '@/lib/types/master';
import { useMasterStore } from '@/lib/stores/masterStore';
import { SearchableSelect } from '@/components/ui/SearchableSelect';

interface VendorFormModalProps {
  isOpen: boolean;
  mode: 'create' | 'edit';
  vendor?: VendorMaster;
  onClose: () => void;
  onSubmit: (data: Partial<VendorMaster>) => void;
  isMobile: boolean;
}

export function VendorFormModal({
  isOpen,
  mode,
  vendor,
  onClose,
  onSubmit,
  isMobile
}: VendorFormModalProps) {
  const { facilities } = useMasterStore();
  const facilityOptions = facilities.map((f) => f.facilityName);

  const [formData, setFormData] = useState<Partial<VendorMaster>>({
    facilityName: '',
    invoiceNumber: '',
    vendorName: '',
    address: '',
    position: '',
    role: '',
    contactPerson: '',
    phone: '',
    email: '',
    isPrimaryContact: false,
  });

  useEffect(() => {
    if (mode === 'edit' && vendor) {
      setFormData({
        facilityName: vendor.facilityName,
        invoiceNumber: vendor.invoiceNumber,
        vendorName: vendor.vendorName,
        address: vendor.address,
        position: vendor.position,
        role: vendor.role,
        contactPerson: vendor.contactPerson,
        phone: vendor.phone,
        email: vendor.email,
        isPrimaryContact: vendor.isPrimaryContact,
      });
    } else {
      setFormData({
        facilityName: '',
        invoiceNumber: '',
        vendorName: '',
        address: '',
        position: '',
        role: '',
        contactPerson: '',
        phone: '',
        email: '',
        isPrimaryContact: false,
      });
    }
  }, [mode, vendor, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
    onClose();
  };

  if (!isOpen) return null;

  const labelStyle = {
    display: 'block' as const,
    fontSize: '13px',
    fontWeight: 600,
    marginBottom: '6px',
    color: '#4A4A4A',
  };

  const inputStyle = {
    width: '100%',
    padding: '10px 12px',
    border: '1px solid #E1E1E1',
    borderRadius: '6px',
    fontSize: '14px',
    boxSizing: 'border-box' as const,
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: isMobile ? '16px' : '20px'
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'white',
          borderRadius: '12px',
          width: '100%',
          maxWidth: '600px',
          maxHeight: '90vh',
          overflow: 'auto',
          boxShadow: '0 4px 20px rgba(0,0,0,0.3)'
        }}
      >
        {/* Header (白背景 + 黒文字 + 下罫線) */}
        <div style={{
          background: 'white',
          color: '#4A4A4A',
          padding: isMobile ? '16px' : '20px',
          borderTopLeftRadius: '12px',
          borderTopRightRadius: '12px',
          borderBottom: '1px solid #E1E1E1',
        }}>
          <h2 style={{ margin: 0, fontSize: isMobile ? '18px' : '20px', fontWeight: 600, color: '#4A4A4A' }}>
            {mode === 'create' ? '業者マスタ 新規作成' : '業者マスタ 編集'}
          </h2>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ padding: isMobile ? '16px' : '24px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* 担当施設名 */}
            <div>
              <label style={labelStyle}>
                担当施設名 <span style={{ color: '#DA0000' }}>*</span>
              </label>
              <SearchableSelect
                value={formData.facilityName || ''}
                onChange={(value) => setFormData({ ...formData, facilityName: value })}
                options={facilityOptions}
                placeholder="施設名を選択"
                isMobile={isMobile}
              />
            </div>

            {/* インボイス登録番号 */}
            <div>
              <label style={labelStyle}>
                インボイス登録番号 <span style={{ color: '#DA0000' }}>*</span>
              </label>
              <input
                type="text"
                value={formData.invoiceNumber || ''}
                onChange={(e) => setFormData({ ...formData, invoiceNumber: e.target.value })}
                required
                placeholder="例: T1234567890123"
                style={inputStyle}
              />
            </div>

            {/* 業者名 */}
            <div>
              <label style={labelStyle}>
                業者名 <span style={{ color: '#DA0000' }}>*</span>
              </label>
              <input
                type="text"
                value={formData.vendorName || ''}
                onChange={(e) => setFormData({ ...formData, vendorName: e.target.value })}
                required
                placeholder="例: オリンパスメディカルシステムズ株式会社"
                style={inputStyle}
              />
            </div>

            {/* 住所 */}
            <div>
              <label style={labelStyle}>
                住所
              </label>
              <input
                type="text"
                value={formData.address || ''}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="例: 東京都新宿区西新宿2-3-1"
                style={inputStyle}
              />
            </div>

            {/* 役職・役割 */}
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={labelStyle}>
                  役職
                </label>
                <input
                  type="text"
                  value={formData.position || ''}
                  onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                  placeholder="例: 部長"
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>
                  役割
                </label>
                <input
                  type="text"
                  value={formData.role || ''}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  placeholder="例: 営業"
                  style={inputStyle}
                />
              </div>
            </div>

            {/* 氏名 */}
            <div>
              <label style={labelStyle}>
                氏名 <span style={{ color: '#DA0000' }}>*</span>
              </label>
              <input
                type="text"
                value={formData.contactPerson || ''}
                onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                required
                placeholder="例: 山田 太郎"
                style={inputStyle}
              />
            </div>

            {/* 連絡先・メール */}
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={labelStyle}>
                  連絡先 <span style={{ color: '#DA0000' }}>*</span>
                </label>
                <input
                  type="tel"
                  value={formData.phone || ''}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  required
                  placeholder="例: 090-1234-5678"
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>
                  メール <span style={{ color: '#DA0000' }}>*</span>
                </label>
                <input
                  type="email"
                  value={formData.email || ''}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  placeholder="例: yamada@example.co.jp"
                  style={inputStyle}
                />
              </div>
            </div>

            {/* 担当フラグ */}
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={formData.isPrimaryContact || false}
                  onChange={(e) => setFormData({ ...formData, isPrimaryContact: e.target.checked })}
                  style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                />
                <span style={{ fontSize: '14px', fontWeight: 600, color: '#4A4A4A' }}>
                  担当フラグ（該当病院のメイン担当者）
                </span>
              </label>
            </div>
          </div>

          {/* Buttons */}
          <div style={{
            display: 'flex',
            gap: '12px',
            marginTop: '24px',
            justifyContent: 'flex-end'
          }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '10px 20px',
                background: '#8A8A8A',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              キャンセル
            </button>
            <button
              type="submit"
              style={{
                padding: '10px 20px',
                background: '#008C1D',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              {mode === 'create' ? '作成' : '更新'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
