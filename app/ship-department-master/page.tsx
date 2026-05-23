'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Pencil, Trash2, Plus } from 'lucide-react';
import { Header } from '@/components/layouts/Header';
import { useResponsive } from '@/lib/hooks/useResponsive';
import { useMasterStore } from '@/lib/stores/masterStore';
import { DepartmentMaster, RoomCategoryMaster } from '@/lib/types/master';
import { EmptyState } from '@/components/ui/EmptyState';

export default function ShipDepartmentMasterPage() {
  const router = useRouter();
  const { isMobile, isTablet } = useResponsive();
  const {
    departments, addDepartment, updateDepartment, deleteDepartment,
    roomCategories, addRoomCategory, updateRoomCategory, deleteRoomCategory,
  } = useMasterStore();

  // 左テーブル: 部署マスタ フィルター
  const [filterDivision, setFilterDivision] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('');

  // 右テーブル: 諸室区分マスタ フィルター
  const [filterRoomCategory1, setFilterRoomCategory1] = useState('');
  const [filterRoomCategory2, setFilterRoomCategory2] = useState('');

  // 左テーブル: モーダル状態
  const [showNewDeptModal, setShowNewDeptModal] = useState(false);
  const [showEditDeptModal, setShowEditDeptModal] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState<DepartmentMaster | null>(null);
  const [deptFormData, setDeptFormData] = useState({ division: '', department: '' });

  // 右テーブル: モーダル状態
  const [showNewRoomModal, setShowNewRoomModal] = useState(false);
  const [showEditRoomModal, setShowEditRoomModal] = useState(false);
  const [selectedRoomCategory, setSelectedRoomCategory] = useState<RoomCategoryMaster | null>(null);
  const [roomFormData, setRoomFormData] = useState({ roomCategory1: '', roomCategory2: '' });

  // 左テーブル: フィルタリング
  const filteredDepartments = departments.filter((dept) => {
    const matchDivision = !filterDivision || dept.division.includes(filterDivision);
    const matchDepartment = !filterDepartment || dept.department.includes(filterDepartment);
    return matchDivision && matchDepartment;
  });

  // 右テーブル: フィルタリング
  const filteredRoomCategories = roomCategories.filter((rc) => {
    const matchRC1 = !filterRoomCategory1 || rc.roomCategory1.includes(filterRoomCategory1);
    const matchRC2 = !filterRoomCategory2 || rc.roomCategory2.includes(filterRoomCategory2);
    return matchRC1 && matchRC2;
  });

  // --- 左テーブル: 部署マスタ ハンドラ ---
  const handleEditDept = (dept: DepartmentMaster) => {
    setSelectedDepartment(dept);
    setDeptFormData({ division: dept.division, department: dept.department });
    setShowEditDeptModal(true);
  };

  const handleDeleteDept = (id: string) => {
    if (confirm('この部署マスタを削除してもよろしいですか?')) {
      deleteDepartment(id);
    }
  };

  const handleNewDeptSubmit = () => {
    const newDept: DepartmentMaster = {
      id: `DEPT${String(departments.length + 1).padStart(3, '0')}`,
      division: deptFormData.division,
      department: deptFormData.department,
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    addDepartment(newDept);
    setShowNewDeptModal(false);
    setDeptFormData({ division: '', department: '' });
  };

  const handleEditDeptSubmit = () => {
    if (selectedDepartment) {
      updateDepartment(selectedDepartment.id, deptFormData);
      setShowEditDeptModal(false);
      setSelectedDepartment(null);
      setDeptFormData({ division: '', department: '' });
    }
  };

  // --- 右テーブル: 諸室区分マスタ ハンドラ ---
  const handleEditRoom = (rc: RoomCategoryMaster) => {
    setSelectedRoomCategory(rc);
    setRoomFormData({ roomCategory1: rc.roomCategory1, roomCategory2: rc.roomCategory2 });
    setShowEditRoomModal(true);
  };

  const handleDeleteRoom = (id: string) => {
    if (confirm('この諸室区分マスタを削除してもよろしいですか?')) {
      deleteRoomCategory(id);
    }
  };

  const handleNewRoomSubmit = () => {
    const newRoom: RoomCategoryMaster = {
      id: `ROOM${String(roomCategories.length + 1).padStart(3, '0')}`,
      roomCategory1: roomFormData.roomCategory1,
      roomCategory2: roomFormData.roomCategory2,
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    addRoomCategory(newRoom);
    setShowNewRoomModal(false);
    setRoomFormData({ roomCategory1: '', roomCategory2: '' });
  };

  const handleEditRoomSubmit = () => {
    if (selectedRoomCategory) {
      updateRoomCategory(selectedRoomCategory.id, roomFormData);
      setShowEditRoomModal(false);
      setSelectedRoomCategory(null);
      setRoomFormData({ roomCategory1: '', roomCategory2: '' });
    }
  };

  const filterInputCls = `w-full ${isMobile ? 'p-2 text-[13px]' : 'p-2.5 text-sm'} border border-stroke-input rounded-md box-border bg-surface-card focus:outline-none focus:border-cta-primary transition-colors`;
  const filterLabelCls = `block ${isMobile ? 'text-xs' : 'text-[13px]'} font-semibold mb-1.5 text-content-primary`;

  // --- モーダル共通レンダラー ---
  const renderModal = (
    title: string,
    fields: { label: string; value: string; onChange: (v: string) => void; placeholder: string }[],
    onSubmit: () => void,
    onCancel: () => void,
    submitLabel: string,
  ) => (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1000]">
      <div className={`bg-surface-card rounded-lg shadow-lg ${isMobile ? 'w-[90%]' : 'max-w-[560px] w-[90%]'} max-h-[90vh] overflow-auto`}>
        <div className="px-6 py-4 border-b border-stroke-input">
          <h2 className="text-base font-bold text-content-primary text-balance">{title}</h2>
        </div>
        <div className="p-6 flex flex-col gap-5">
          {fields.map((f) => (
            <div key={f.label}>
              <label className="block text-sm font-semibold text-content-primary mb-1.5">{f.label}</label>
              <input
                type="text"
                value={f.value}
                onChange={(e) => f.onChange(e.target.value)}
                placeholder={f.placeholder}
                className="w-full px-3 py-2.5 border border-stroke-input rounded-md text-sm bg-surface-card focus:outline-none focus:border-cta-primary transition-colors"
              />
            </div>
          ))}
        </div>
        <div className="px-6 pb-6 flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="px-5 py-2.5 bg-surface-card text-content-primary border border-stroke-input rounded-md text-sm font-semibold cursor-pointer hover:bg-surface-screen transition-colors"
          >
            キャンセル
          </button>
          <button
            onClick={onSubmit}
            className="px-5 py-2.5 bg-cta-primary text-white border-0 rounded-md text-sm font-semibold cursor-pointer hover:bg-cta-primary-dark transition-colors"
          >
            {submitLabel}
          </button>
        </div>
      </div>
    </div>
  );

  // --- 共通カード見出し (タイトル + 件数 + 新規作成ボタン) ---
  const renderCardHeader = (title: string, count: number, onNew: () => void) => (
    <div className={`flex items-center justify-between ${isMobile ? 'px-4 py-3' : 'px-5 py-4'} border-b border-stroke-input bg-surface-card`}>
      <div className="flex items-center gap-3">
        <h2 className={`${isMobile ? 'text-[15px]' : 'text-base'} font-bold text-content-primary text-balance`}>{title}</h2>
        <span className="bg-stroke-card text-content-primary px-2.5 py-0.5 rounded-full text-xs font-semibold tabular-nums">{count}件</span>
      </div>
      <button
        onClick={onNew}
        className={`inline-flex items-center justify-center gap-1.5 ${isMobile ? 'px-3 py-1.5 text-[13px]' : 'px-4 py-2 text-sm'} bg-cta-primary text-white border-0 rounded-md cursor-pointer font-semibold whitespace-nowrap hover:bg-cta-primary-dark transition-colors`}
      >
        <Plus size={16} aria-hidden />
        新規作成
      </button>
    </div>
  );

  // --- 共通操作ボタン (編集 / 削除) ---
  const renderActionButtons = (onEdit: () => void, onDelete: () => void, label: string) => (
    <div className="flex gap-1 justify-center">
      <button
        onClick={onEdit}
        className="inline-flex items-center justify-center w-7 h-7 bg-transparent text-cta-primary-dark border border-cta-primary rounded cursor-pointer hover:bg-surface-select transition-colors"
        aria-label={`${label} を編集`}
      >
        <Pencil size={14} />
      </button>
      <button
        onClick={onDelete}
        className="inline-flex items-center justify-center w-7 h-7 bg-transparent text-content-alert border border-content-alert rounded cursor-pointer hover:bg-stroke-card transition-colors"
        aria-label={`${label} を削除`}
      >
        <Trash2 size={14} />
      </button>
    </div>
  );

  // --- 左テーブル: 部署マスタ レンダリング ---
  const renderDeptTable = () => (
    <div className="bg-surface-card rounded-lg overflow-hidden shadow-sm">
      {renderCardHeader('部署マスタ', filteredDepartments.length, () => { setDeptFormData({ division: '', department: '' }); setShowNewDeptModal(true); })}

      {/* フィルター */}
      <div className={`${isMobile ? 'px-4 py-3' : 'px-5 py-4'} border-b border-stroke-input grid ${isMobile ? 'grid-cols-1' : 'grid-cols-2'} gap-3 bg-surface-card`}>
        <div>
          <label className={filterLabelCls}>部門</label>
          <input type="text" value={filterDivision} onChange={(e) => setFilterDivision(e.target.value)} placeholder="診療部門" className={filterInputCls} />
        </div>
        <div>
          <label className={filterLabelCls}>部署</label>
          <input type="text" value={filterDepartment} onChange={(e) => setFilterDepartment(e.target.value)} placeholder="外科" className={filterInputCls} />
        </div>
      </div>

      {/* テーブル / カード */}
      {isMobile ? (
        <div className="p-3 flex flex-col gap-3">
          {filteredDepartments.map((dept) => (
            <div key={dept.id} className="bg-surface-screen rounded-lg p-4 border border-stroke-input">
              <div className="text-base font-semibold text-content-primary mb-1">{dept.department}</div>
              <div className="text-[13px] text-content-sub mb-3">{dept.division}</div>
              {renderActionButtons(() => handleEditDept(dept), () => handleDeleteDept(dept.id), dept.department)}
            </div>
          ))}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className={`${isTablet ? 'px-3 py-2' : 'px-3.5 py-2.5'} text-left ${isTablet ? 'text-[13px]' : 'text-sm'} font-semibold text-content-primary bg-stroke-card border border-stroke-input`}>部門</th>
                <th className={`${isTablet ? 'px-3 py-2' : 'px-3.5 py-2.5'} text-left ${isTablet ? 'text-[13px]' : 'text-sm'} font-semibold text-content-primary bg-stroke-card border border-stroke-input`}>部署</th>
                <th className={`${isTablet ? 'px-3 py-2' : 'px-3.5 py-2.5'} text-center ${isTablet ? 'text-[13px]' : 'text-sm'} font-semibold text-content-primary bg-stroke-card border border-stroke-input whitespace-nowrap w-[110px]`}>操作</th>
              </tr>
            </thead>
            <tbody>
              {filteredDepartments.map((dept, index) => (
                <tr key={dept.id} className={index % 2 === 0 ? 'bg-surface-card' : 'bg-surface-screen'}>
                  <td className={`${isTablet ? 'px-3 py-2' : 'px-3.5 py-2.5'} ${isTablet ? 'text-[13px]' : 'text-sm'} text-content-primary border border-stroke-input`}>{dept.division}</td>
                  <td className={`${isTablet ? 'px-3 py-2' : 'px-3.5 py-2.5'} ${isTablet ? 'text-[13px]' : 'text-sm'} text-content-primary border border-stroke-input`}>{dept.department}</td>
                  <td className={`${isTablet ? 'px-3 py-2' : 'px-3.5 py-2.5'} text-center whitespace-nowrap border border-stroke-input`}>
                    {renderActionButtons(() => handleEditDept(dept), () => handleDeleteDept(dept.id), dept.department)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {filteredDepartments.length === 0 && (
        <EmptyState
          title="検索条件に一致する部署マスタがありません"
          description="検索条件を変更するか、フィルターを見直してください"
          actionLabel="フィルターをリセット"
          onAction={() => { setFilterDivision(''); setFilterDepartment(''); }}
        />
      )}
    </div>
  );

  // --- 右テーブル: 諸室区分マスタ レンダリング ---
  const renderRoomTable = () => (
    <div className="bg-surface-card rounded-lg overflow-hidden shadow-sm">
      {renderCardHeader('諸室区分マスタ', filteredRoomCategories.length, () => { setRoomFormData({ roomCategory1: '', roomCategory2: '' }); setShowNewRoomModal(true); })}

      {/* フィルター */}
      <div className={`${isMobile ? 'px-4 py-3' : 'px-5 py-4'} border-b border-stroke-input grid ${isMobile ? 'grid-cols-1' : 'grid-cols-2'} gap-3 bg-surface-card`}>
        <div>
          <label className={filterLabelCls}>諸室区分①</label>
          <input type="text" value={filterRoomCategory1} onChange={(e) => setFilterRoomCategory1(e.target.value)} placeholder="手術室" className={filterInputCls} />
        </div>
        <div>
          <label className={filterLabelCls}>諸室区分②</label>
          <input type="text" value={filterRoomCategory2} onChange={(e) => setFilterRoomCategory2(e.target.value)} placeholder="オペ室1" className={filterInputCls} />
        </div>
      </div>

      {/* テーブル / カード */}
      {isMobile ? (
        <div className="p-3 flex flex-col gap-3">
          {filteredRoomCategories.map((rc) => (
            <div key={rc.id} className="bg-surface-screen rounded-lg p-4 border border-stroke-input">
              <div className="text-base font-semibold text-content-primary mb-1">{rc.roomCategory1}</div>
              <div className="text-[13px] text-content-sub mb-3">{rc.roomCategory2}</div>
              {renderActionButtons(() => handleEditRoom(rc), () => handleDeleteRoom(rc.id), rc.roomCategory1)}
            </div>
          ))}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className={`${isTablet ? 'px-3 py-2' : 'px-3.5 py-2.5'} text-left ${isTablet ? 'text-[13px]' : 'text-sm'} font-semibold text-content-primary bg-stroke-card border border-stroke-input`}>諸室区分①</th>
                <th className={`${isTablet ? 'px-3 py-2' : 'px-3.5 py-2.5'} text-left ${isTablet ? 'text-[13px]' : 'text-sm'} font-semibold text-content-primary bg-stroke-card border border-stroke-input`}>諸室区分②</th>
                <th className={`${isTablet ? 'px-3 py-2' : 'px-3.5 py-2.5'} text-center ${isTablet ? 'text-[13px]' : 'text-sm'} font-semibold text-content-primary bg-stroke-card border border-stroke-input whitespace-nowrap w-[110px]`}>操作</th>
              </tr>
            </thead>
            <tbody>
              {filteredRoomCategories.map((rc, index) => (
                <tr key={rc.id} className={index % 2 === 0 ? 'bg-surface-card' : 'bg-surface-screen'}>
                  <td className={`${isTablet ? 'px-3 py-2' : 'px-3.5 py-2.5'} ${isTablet ? 'text-[13px]' : 'text-sm'} text-content-primary border border-stroke-input`}>{rc.roomCategory1}</td>
                  <td className={`${isTablet ? 'px-3 py-2' : 'px-3.5 py-2.5'} ${isTablet ? 'text-[13px]' : 'text-sm'} text-content-primary border border-stroke-input`}>{rc.roomCategory2}</td>
                  <td className={`${isTablet ? 'px-3 py-2' : 'px-3.5 py-2.5'} text-center whitespace-nowrap border border-stroke-input`}>
                    {renderActionButtons(() => handleEditRoom(rc), () => handleDeleteRoom(rc.id), rc.roomCategory1)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {filteredRoomCategories.length === 0 && (
        <EmptyState
          title="検索条件に一致する諸室区分マスタがありません"
          description="検索条件を変更するか、フィルターを見直してください"
          actionLabel="フィルターをリセット"
          onAction={() => { setFilterRoomCategory1(''); setFilterRoomCategory2(''); }}
        />
      )}
    </div>
  );

  return (
    <div className="flex flex-col min-h-dvh bg-surface-screen">
      <Header
        title="SHIP部署マスタ"
        showBackButton={true}
        backHref="/main"
        backLabel="メイン画面に戻る"
        backButtonVariant="secondary"
        hideMenu={true}
        hideHomeButton={true}
      />

      <main className={`flex-1 overflow-y-auto ${isMobile ? 'p-4' : isTablet ? 'p-5' : 'p-6'}`}>
        <div className={`grid ${isMobile ? 'grid-cols-1 gap-4' : 'grid-cols-2 gap-6'} items-start`}>
          {renderDeptTable()}
          {renderRoomTable()}
        </div>
      </main>

      <footer className="py-3 text-center text-xs text-content-sub">
        &copy;Copyright 2024 SHIP HEALTHCARE HOLDINGS, INC.
      </footer>

      {/* 部署マスタ: 新規作成モーダル */}
      {showNewDeptModal && renderModal(
        '新規部署マスタ作成',
        [
          { label: '部門', value: deptFormData.division, onChange: (v) => setDeptFormData({ ...deptFormData, division: v }), placeholder: '診療部門' },
          { label: '部署', value: deptFormData.department, onChange: (v) => setDeptFormData({ ...deptFormData, department: v }), placeholder: '外科' },
        ],
        handleNewDeptSubmit,
        () => setShowNewDeptModal(false),
        '作成',
      )}

      {/* 部署マスタ: 編集モーダル */}
      {showEditDeptModal && renderModal(
        '部署マスタ編集',
        [
          { label: '部門', value: deptFormData.division, onChange: (v) => setDeptFormData({ ...deptFormData, division: v }), placeholder: '診療部門' },
          { label: '部署', value: deptFormData.department, onChange: (v) => setDeptFormData({ ...deptFormData, department: v }), placeholder: '外科' },
        ],
        handleEditDeptSubmit,
        () => { setShowEditDeptModal(false); setSelectedDepartment(null); },
        '更新',
      )}

      {/* 諸室区分マスタ: 新規作成モーダル */}
      {showNewRoomModal && renderModal(
        '新規諸室区分マスタ作成',
        [
          { label: '諸室区分①', value: roomFormData.roomCategory1, onChange: (v) => setRoomFormData({ ...roomFormData, roomCategory1: v }), placeholder: '手術室' },
          { label: '諸室区分②', value: roomFormData.roomCategory2, onChange: (v) => setRoomFormData({ ...roomFormData, roomCategory2: v }), placeholder: 'オペ室1' },
        ],
        handleNewRoomSubmit,
        () => setShowNewRoomModal(false),
        '作成',
      )}

      {/* 諸室区分マスタ: 編集モーダル */}
      {showEditRoomModal && renderModal(
        '諸室区分マスタ編集',
        [
          { label: '諸室区分①', value: roomFormData.roomCategory1, onChange: (v) => setRoomFormData({ ...roomFormData, roomCategory1: v }), placeholder: '手術室' },
          { label: '諸室区分②', value: roomFormData.roomCategory2, onChange: (v) => setRoomFormData({ ...roomFormData, roomCategory2: v }), placeholder: 'オペ室1' },
        ],
        handleEditRoomSubmit,
        () => { setShowEditRoomModal(false); setSelectedRoomCategory(null); },
        '更新',
      )}
    </div>
  );
}
