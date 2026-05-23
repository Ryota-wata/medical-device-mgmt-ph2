'use client';

import { useState, useEffect, useMemo } from 'react';
import { HospitalFacilityMaster } from '@/lib/types/hospitalFacility';
import { useMasterStore } from '@/lib/stores/masterStore';
import { SearchableSelect } from '@/components/ui/SearchableSelect';

interface HospitalFacilityFormModalProps {
  isOpen: boolean;
  mode: 'create' | 'edit';
  facility?: HospitalFacilityMaster;
  onClose: () => void;
  onSubmit: (data: Partial<HospitalFacilityMaster>) => void;
  isMobile: boolean;
}

export function HospitalFacilityFormModal({
  isOpen,
  mode,
  facility,
  onClose,
  onSubmit,
  isMobile,
}: HospitalFacilityFormModalProps) {
  const { departments, roomCategories } = useMasterStore();

  const [formData, setFormData] = useState({
    oldShipDivision: '',
    oldShipDepartment: '',
    oldShipRoomCategory: '',
    shipRoomCategory2: '',
    divisionId: '',
    departmentId: '',
    roomId: '',
    oldBuilding: '',
    oldFloor: '',
    oldDepartment: '',
    oldSection: '',
    oldRoomName: '',
    newShipDivision: '',
    newShipDepartment: '',
    newShipRoomCategory: '',
    newBuilding: '',
    newFloor: '',
    newDepartment: '',
    newSection: '',
    newRoomName: '',
    newRoomCount: '',
  });

  useEffect(() => {
    if (mode === 'edit' && facility) {
      setFormData({
        oldShipDivision: facility.oldShipDivision,
        oldShipDepartment: facility.oldShipDepartment,
        oldShipRoomCategory: facility.oldShipRoomCategory,
        shipRoomCategory2: facility.shipRoomCategory2,
        divisionId: facility.divisionId,
        departmentId: facility.departmentId,
        roomId: facility.roomId,
        oldBuilding: facility.oldBuilding,
        oldFloor: facility.oldFloor,
        oldDepartment: facility.oldDepartment,
        oldSection: facility.oldSection,
        oldRoomName: facility.oldRoomName,
        newShipDivision: facility.newShipDivision,
        newShipDepartment: facility.newShipDepartment,
        newShipRoomCategory: facility.newShipRoomCategory,
        newBuilding: facility.newBuilding,
        newFloor: facility.newFloor,
        newDepartment: facility.newDepartment,
        newSection: facility.newSection,
        newRoomName: facility.newRoomName,
        newRoomCount: facility.newRoomCount,
      });
    } else {
      setFormData({
        oldShipDivision: '',
        oldShipDepartment: '',
        oldShipRoomCategory: '',
        shipRoomCategory2: '',
        divisionId: '',
        departmentId: '',
        roomId: '',
        oldBuilding: '',
        oldFloor: '',
        oldDepartment: '',
        oldSection: '',
        oldRoomName: '',
        newShipDivision: '',
        newShipDepartment: '',
        newShipRoomCategory: '',
        newBuilding: '',
        newFloor: '',
        newDepartment: '',
        newSection: '',
        newRoomName: '',
        newRoomCount: '',
      });
    }
  }, [mode, facility, isOpen]);

  // SHIP部門の一意なオプション
  const divisionOptions = useMemo(() => {
    return Array.from(new Set(departments.map(d => d.division))).filter(Boolean);
  }, [departments]);

  // 旧: SHIP部署（SHIP部門で絞り込み）
  const oldDeptOptions = useMemo(() => {
    if (!formData.oldShipDivision) return [];
    return Array.from(new Set(
      departments.filter(d => d.division === formData.oldShipDivision).map(d => d.department)
    )).filter(Boolean);
  }, [departments, formData.oldShipDivision]);

  // 旧: SHIP諸室区分①
  const oldRoomCatOptions = useMemo(() => {
    return Array.from(new Set(roomCategories.map(r => r.roomCategory1))).filter(Boolean);
  }, [roomCategories]);

  // 諸室区分②（諸室区分①でフィルタ）
  const roomCat2Options = useMemo(() => {
    if (!formData.oldShipRoomCategory) return [];
    return Array.from(new Set(
      roomCategories.filter(r => r.roomCategory1 === formData.oldShipRoomCategory).map(r => r.roomCategory2)
    )).filter(Boolean);
  }, [roomCategories, formData.oldShipRoomCategory]);

  // 新: SHIP部署（SHIP部門で絞り込み）
  const newDeptOptions = useMemo(() => {
    if (!formData.newShipDivision) return [];
    return Array.from(new Set(
      departments.filter(d => d.division === formData.newShipDivision).map(d => d.department)
    )).filter(Boolean);
  }, [departments, formData.newShipDivision]);

  // 新: SHIP諸室区分
  const newRoomCatOptions = useMemo(() => {
    return Array.from(new Set(roomCategories.map(r => r.roomCategory1))).filter(Boolean);
  }, [roomCategories]);

  // 旧: 親変更時に子をクリア
  const handleOldDivisionChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      oldShipDivision: value,
      oldShipDepartment: '',
    }));
  };

  const handleOldDeptChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      oldShipDepartment: value,
    }));
  };

  const handleOldRoomCatChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      oldShipRoomCategory: value,
      shipRoomCategory2: '',
    }));
  };

  // 新: 親変更時に子をクリア
  const handleNewDivisionChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      newShipDivision: value,
      newShipDepartment: '',
    }));
  };

  const handleNewDeptChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      newShipDepartment: value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
    onClose();
  };

  if (!isOpen) return null;

  const inputStyle = {
    width: '100%',
    padding: isMobile ? '10px' : '12px',
    border: '1px solid #E1E1E1',
    borderRadius: '6px',
    fontSize: isMobile ? '14px' : '15px',
    boxSizing: 'border-box' as const,
  };

  const labelStyle = {
    display: 'block' as const,
    fontSize: isMobile ? '13px' : '14px',
    fontWeight: 600 as const,
    marginBottom: '6px',
    color: '#4A4A4A',
  };

  const sectionGrid = {
    display: 'grid' as const,
    gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)',
    gap: isMobile ? '12px' : '16px',
  };

  const subInfoStyle = {
    fontSize: '12px',
    color: '#8A8A8A',
    marginTop: '4px',
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: isMobile ? '16px' : '24px',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'white',
          borderRadius: '12px',
          width: '100%',
          maxWidth: isMobile ? '100%' : '800px',
          maxHeight: '90vh',
          overflow: 'auto',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header (白背景 + 黒文字 + 下罫線) */}
        <div
          style={{
            background: 'white',
            color: '#4A4A4A',
            padding: isMobile ? '16px' : '20px',
            borderRadius: '12px 12px 0 0',
            borderBottom: '1px solid #E1E1E1',
          }}
        >
          <h2 style={{ margin: 0, fontSize: isMobile ? '18px' : '20px', fontWeight: 600, color: '#4A4A4A' }}>
            {mode === 'create' ? '施設マスタ新規作成' : '施設マスタ編集'}
          </h2>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ padding: isMobile ? '16px' : '24px' }}>
          {/* 共通マスタセクション */}
          <div style={{ marginBottom: '24px' }}>
            <h3
              style={{
                fontSize: isMobile ? '14px' : '16px',
                fontWeight: 600,
                color: '#4A4A4A',
                marginBottom: '16px',
                paddingBottom: '8px',
                borderBottom: '2px solid #E1E1E1',
              }}
            >
              共通マスタ
            </h3>

            <div style={sectionGrid}>
              <div>
                <SearchableSelect
                  label="部門"
                  value={formData.oldShipDivision}
                  onChange={handleOldDivisionChange}
                  options={['', ...divisionOptions]}
                  placeholder="選択してください"
                  isMobile={isMobile}
                />
              </div>
              <div>
                <SearchableSelect
                  label="部署"
                  value={formData.oldShipDepartment}
                  onChange={handleOldDeptChange}
                  options={['', ...oldDeptOptions]}
                  placeholder={formData.oldShipDivision ? '選択してください' : '部門を先に選択'}
                  isMobile={isMobile}
                  disabled={!formData.oldShipDivision}
                />
              </div>
              <div>
                <SearchableSelect
                  label="諸室区分①"
                  value={formData.oldShipRoomCategory}
                  onChange={handleOldRoomCatChange}
                  options={['', ...oldRoomCatOptions]}
                  placeholder="選択してください"
                  isMobile={isMobile}
                />
              </div>
              <div>
                <SearchableSelect
                  label="諸室区分②"
                  value={formData.shipRoomCategory2}
                  onChange={(v) => setFormData(prev => ({ ...prev, shipRoomCategory2: v }))}
                  options={['', ...roomCat2Options]}
                  placeholder={formData.oldShipRoomCategory ? '選択してください' : '諸室区分①を先に選択'}
                  isMobile={isMobile}
                  disabled={!formData.oldShipRoomCategory}
                />
              </div>
            </div>
          </div>

          {/* 旧（現状）セクション */}
          <div style={{ marginBottom: '24px' }}>
            <h3
              style={{
                fontSize: isMobile ? '14px' : '16px',
                fontWeight: 600,
                color: '#146E2E',
                marginBottom: '16px',
                paddingBottom: '8px',
                borderBottom: '2px solid #EBF5EE',
              }}
            >
              旧（現状）
            </h3>

            {/* 病院用ID */}
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: isMobile ? '12px' : '16px' }}>
              <div>
                <label style={{ ...labelStyle, color: '#146E2E' }}>部門ID</label>
                <input
                  type="text"
                  value={formData.divisionId}
                  onChange={(e) => setFormData(prev => ({ ...prev, divisionId: e.target.value }))}
                  placeholder="部門ID"
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={{ ...labelStyle, color: '#146E2E' }}>部署ID</label>
                <input
                  type="text"
                  value={formData.departmentId}
                  onChange={(e) => setFormData(prev => ({ ...prev, departmentId: e.target.value }))}
                  placeholder="部署ID"
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={{ ...labelStyle, color: '#146E2E' }}>諸室ID</label>
                <input
                  type="text"
                  value={formData.roomId}
                  onChange={(e) => setFormData(prev => ({ ...prev, roomId: e.target.value }))}
                  placeholder="諸室ID"
                  style={inputStyle}
                />
              </div>
            </div>

            {/* 場所情報 */}
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)', gap: isMobile ? '12px' : '16px', marginTop: isMobile ? '12px' : '16px' }}>
              <div>
                <label style={labelStyle}>棟</label>
                <input
                  type="text"
                  value={formData.oldBuilding}
                  onChange={(e) => setFormData(prev => ({ ...prev, oldBuilding: e.target.value }))}
                  placeholder="棟"
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>部門</label>
                <input
                  type="text"
                  value={formData.oldDepartment}
                  onChange={(e) => setFormData(prev => ({ ...prev, oldDepartment: e.target.value }))}
                  placeholder="部門"
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>部署</label>
                <input
                  type="text"
                  value={formData.oldSection}
                  onChange={(e) => setFormData(prev => ({ ...prev, oldSection: e.target.value }))}
                  placeholder="部署"
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>諸室</label>
                <input
                  type="text"
                  value={formData.oldRoomName}
                  onChange={(e) => setFormData(prev => ({ ...prev, oldRoomName: e.target.value }))}
                  placeholder="室名"
                  style={inputStyle}
                />
              </div>
            </div>

            {/* 補助情報: 階 */}
            <div style={{ marginTop: '12px' }}>
              <label style={{ ...labelStyle, fontSize: '12px', color: '#8A8A8A' }}>階（補助情報）</label>
              <input
                type="text"
                value={formData.oldFloor}
                onChange={(e) => setFormData(prev => ({ ...prev, oldFloor: e.target.value }))}
                placeholder="3F"
                style={{ ...inputStyle, maxWidth: '150px', fontSize: '13px' }}
              />
              <div style={subInfoStyle}>※ テーブル非表示項目（データは保持されます）</div>
            </div>
          </div>

          {/* 新（リモデルのみ）セクション */}
          <div style={{ marginBottom: '24px' }}>
            <h3
              style={{
                fontSize: isMobile ? '14px' : '16px',
                fontWeight: 600,
                color: '#4A4A4A',
                marginBottom: '16px',
                paddingBottom: '8px',
                borderBottom: '2px solid #FAFAFA',
              }}
            >
              新（リモデルのみ）
            </h3>

            <div style={sectionGrid}>
              <div>
                <label style={{ ...labelStyle, color: '#4A4A4A' }}>棟</label>
                <input
                  type="text"
                  value={formData.newBuilding}
                  onChange={(e) => setFormData(prev => ({ ...prev, newBuilding: e.target.value }))}
                  placeholder="棟"
                  style={{ ...inputStyle, borderColor: '#FAFAFA' }}
                />
              </div>
              <div>
                <label style={{ ...labelStyle, color: '#4A4A4A' }}>部門</label>
                <input
                  type="text"
                  value={formData.newDepartment}
                  onChange={(e) => setFormData(prev => ({ ...prev, newDepartment: e.target.value }))}
                  placeholder="部門"
                  style={{ ...inputStyle, borderColor: '#FAFAFA' }}
                />
              </div>
              <div>
                <label style={{ ...labelStyle, color: '#4A4A4A' }}>部署</label>
                <input
                  type="text"
                  value={formData.newSection}
                  onChange={(e) => setFormData(prev => ({ ...prev, newSection: e.target.value }))}
                  placeholder="部署"
                  style={{ ...inputStyle, borderColor: '#FAFAFA' }}
                />
              </div>
              <div>
                <label style={{ ...labelStyle, color: '#4A4A4A' }}>諸室</label>
                <input
                  type="text"
                  value={formData.newRoomName}
                  onChange={(e) => setFormData(prev => ({ ...prev, newRoomName: e.target.value }))}
                  placeholder="室名"
                  style={{ ...inputStyle, borderColor: '#FAFAFA' }}
                />
              </div>
            </div>

            {/* 補助情報 */}
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: isMobile ? '12px' : '16px', marginTop: '12px' }}>
              <div>
                <label style={{ ...labelStyle, fontSize: '12px', color: '#8A8A8A' }}>階（補助情報）</label>
                <input
                  type="text"
                  value={formData.newFloor}
                  onChange={(e) => setFormData(prev => ({ ...prev, newFloor: e.target.value }))}
                  placeholder="4F"
                  style={{ ...inputStyle, fontSize: '13px' }}
                />
              </div>
              <div>
                <label style={{ ...labelStyle, fontSize: '12px', color: '#8A8A8A' }}>室数（補助情報）</label>
                <input
                  type="text"
                  value={formData.newRoomCount}
                  onChange={(e) => setFormData(prev => ({ ...prev, newRoomCount: e.target.value }))}
                  placeholder="室数"
                  style={{ ...inputStyle, fontSize: '13px' }}
                />
              </div>
            </div>
            <div style={subInfoStyle}>※ テーブル非表示項目（データは保持されます）</div>

            {/* SHIP連携（新）補助情報 */}
            <div style={{ marginTop: '16px', padding: '12px', background: '#FAFAFA', borderRadius: '6px' }}>
              <div style={{ fontSize: '13px', fontWeight: 600, color: '#8A8A8A', marginBottom: '12px' }}>SHIP連携（新）- 補助情報</div>
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: isMobile ? '12px' : '16px' }}>
                <div>
                  <SearchableSelect
                    label="SHIP部門"
                    value={formData.newShipDivision}
                    onChange={handleNewDivisionChange}
                    options={['', ...divisionOptions]}
                    placeholder="選択してください"
                    isMobile={isMobile}
                  />
                </div>
                <div>
                  <SearchableSelect
                    label="SHIP部署"
                    value={formData.newShipDepartment}
                    onChange={handleNewDeptChange}
                    options={['', ...newDeptOptions]}
                    placeholder={formData.newShipDivision ? '選択してください' : 'SHIP部門を先に選択'}
                    isMobile={isMobile}
                    disabled={!formData.newShipDivision}
                  />
                </div>
                <div>
                  <SearchableSelect
                    label="SHIP諸室区分"
                    value={formData.newShipRoomCategory}
                    onChange={(v) => setFormData(prev => ({ ...prev, newShipRoomCategory: v }))}
                    options={['', ...newRoomCatOptions]}
                    placeholder="選択してください"
                    isMobile={isMobile}
                  />
                </div>
              </div>
              <div style={subInfoStyle}>※ テーブル非表示項目（データは保持されます）</div>
            </div>

            <p style={{ marginTop: '8px', fontSize: '12px', color: '#8A8A8A' }}>
              ※ 新居の設置場所は後から入力できます。全て入力するとステータスが「マッピング済」になります。
            </p>
          </div>

          {/* Buttons */}
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: isMobile ? '10px 20px' : '12px 24px',
                background: '#FAFAFA',
                color: '#4A4A4A',
                border: 'none',
                borderRadius: '6px',
                fontSize: isMobile ? '14px' : '15px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              キャンセル
            </button>
            <button
              type="submit"
              style={{
                padding: isMobile ? '10px 20px' : '12px 24px',
                background: '#008C1D',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: isMobile ? '14px' : '15px',
                fontWeight: 600,
                cursor: 'pointer',
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
