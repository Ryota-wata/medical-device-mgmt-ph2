'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Pencil, Trash2, Plus, Download } from 'lucide-react';
import { Header } from '@/components/layouts/Header';
import { useResponsive } from '@/lib/hooks/useResponsive';
import { useMasterStore } from '@/lib/stores/masterStore';
import { FacilityMaster } from '@/lib/types/master';
import { FacilityFormModal } from '@/components/modals/FacilityFormModal';
import { exportFacilitiesToExcel } from '@/lib/utils/excel-facility-master';
import { EmptyState } from '@/components/ui/EmptyState';

const FACILITY_COLUMNS: { key: string; label: string }[] = [
  { key: 'facilityCode', label: '医療機関コード' },
  { key: 'facilityName', label: '施設名' },
  { key: 'foundingBody', label: '経営主体' },
  { key: 'prefecture', label: '都道府県' },
  { key: 'city', label: '市区町村' },
  { key: 'secondaryMedicalArea', label: '二次医療圏名' },
  { key: 'rebuildYear', label: '建替年度' },
  { key: 'buildingArea', label: '建物面積' },
  { key: 'emergencyCenter', label: '救命救急センター' },
  { key: 'secondaryEmergency', label: '2次/3次救急' },
  { key: 'perinatalCenter', label: '周産期母子医療' },
  { key: 'disasterHospital', label: '災害拠点病院' },
  { key: 'cancerHospital', label: 'がん診療拠点' },
  { key: 'regionalSupport', label: '地域医療支援' },
  { key: 'erRooms', label: '救急初療室数' },
  { key: 'centralTreatmentBeds', label: '中央処置ベッド数' },
  { key: 'chemotherapyBeds', label: '化学療法ベッド数' },
  { key: 'deliveryRooms', label: '分娩室数' },
  { key: 'endoscopyRooms', label: '内視鏡室数' },
  { key: 'dialysisBeds', label: '人工透析ベッド数' },
  { key: 'operatingRooms', label: '手術室数' },
  { key: 'bloodCollectionUnits', label: '中央採血台数' },
  { key: 'totalBeds', label: '総病床数' },
  { key: 'emergencyWard', label: '救急病棟' },
  { key: 'eICU', label: 'E-ICU' },
  { key: 'icu', label: 'ICU' },
  { key: 'hcu', label: 'HCU' },
  { key: 'gICU', label: 'G-ICU' },
  { key: 'ccu', label: 'CCU' },
  { key: 'scu', label: 'SCU' },
  { key: 'nicu', label: 'NICU' },
  { key: 'gcu', label: 'GCU' },
  { key: 'mficu', label: 'MFICU' },
  { key: 'generalBeds', label: '一般病床' },
  { key: 'cleanRoomBeds', label: '無菌病棟' },
  { key: 'palliativeBeds', label: '緩和ケア' },
  { key: 'rehabilitationBeds', label: '回復期リハ' },
  { key: 'communityCareBeds', label: '地域包括ケア' },
  { key: 'chronicBeds', label: '療養病床' },
  { key: 'psychiatricBeds', label: '精神病床' },
  { key: 'infectiousBeds', label: '感染症・結核' },
];

export default function ShipFacilityMasterPage() {
  const router = useRouter();
  const { isMobile, isTablet } = useResponsive();
  const { facilities, setFacilities, addFacility, updateFacility, deleteFacility } = useMasterStore();

  const [filterFacilityCode, setFilterFacilityCode] = useState('');
  const [filterFacilityName, setFilterFacilityName] = useState('');
  const [filterPrefecture, setFilterPrefecture] = useState('');
  const [filterFoundingBody, setFilterFoundingBody] = useState('');
  const [showNewModal, setShowNewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedFacility, setSelectedFacility] = useState<FacilityMaster | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  useEffect(() => {
    if (facilities.length < 1000) {
      setIsLoading(true);
      import('@/lib/data/customer/facility-master').then(({ customerFacilities }) => {
        const mapped = customerFacilities.map((item, i) => ({
          ...item,
          id: `FAC-${i}`,
          address: '',
          postalCode: '',
          phoneNumber: '',
          establishedDate: '',
          facilityType: '',
          bedCount: parseInt(item.totalBeds || '0', 10) || 0,
          status: 'active' as const,
          createdAt: '2025-01-01T00:00:00Z',
          updatedAt: '2025-01-01T00:00:00Z',
        })) as FacilityMaster[];
        setFacilities(mapped);
        setIsLoading(false);
      });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const filteredFacilities = facilities.filter((facility) => {
    const matchFacilityCode = !filterFacilityCode || facility.facilityCode.includes(filterFacilityCode);
    const matchFacilityName = !filterFacilityName || facility.facilityName.toLowerCase().includes(filterFacilityName.toLowerCase());
    const matchPrefecture = !filterPrefecture || facility.prefecture.includes(filterPrefecture);
    const matchFoundingBody = !filterFoundingBody || (facility.foundingBody && facility.foundingBody.includes(filterFoundingBody));
    return matchFacilityCode && matchFacilityName && matchPrefecture && matchFoundingBody;
  });

  const handleEdit = (facility: FacilityMaster) => {
    setSelectedFacility(facility);
    setShowEditModal(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('この施設マスタを削除してもよろしいですか?')) {
      deleteFacility(id);
    }
  };

  const handleNewSubmit = (data: Partial<FacilityMaster>) => {
    const newFacility: FacilityMaster = {
      id: `F${String(facilities.length + 1).padStart(3, '0')}`,
      facilityCode: data.facilityCode || '',
      facilityName: data.facilityName || '',
      building: data.building,
      floor: data.floor,
      department: data.department,
      section: data.section,
      prefecture: '',
      foundingBody: '',
      city: '',
      address: '',
      postalCode: '',
      phoneNumber: '',
      establishedDate: new Date().toISOString().split('T')[0],
      facilityType: '',
      bedCount: 0,
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    addFacility(newFacility);
  };

  const handleEditSubmit = (data: Partial<FacilityMaster>) => {
    if (selectedFacility) updateFacility(selectedFacility.id, data);
  };

  const filterInputCls = `w-full ${isMobile ? 'p-2 text-[13px]' : 'p-2.5 text-sm'} border border-stroke-input rounded-md box-border bg-surface-card focus:outline-none focus:border-cta-primary transition-colors`;
  const filterLabelCls = `block ${isMobile ? 'text-xs' : 'text-[13px]'} font-semibold mb-1.5 text-content-primary`;

  return (
    <div className="flex flex-col min-h-dvh bg-surface-screen">
      <Header
        title="SHIP施設マスタ"
        showBackButton={true}
        backHref="/main"
        backLabel="メイン画面に戻る"
        backButtonVariant="secondary"
        hideMenu={true}
        hideHomeButton={true}
        resultCount={filteredFacilities.length}
        showOriginalLabel={false}
      >
        <button
          onClick={() => exportFacilitiesToExcel(filteredFacilities)}
          className={`inline-flex items-center justify-center gap-1.5 h-9 ${isMobile ? 'px-3 text-[13px]' : 'px-4 text-sm'} bg-surface-card text-cta-primary-dark border border-cta-primary rounded-md cursor-pointer font-semibold whitespace-nowrap hover:bg-surface-select transition-colors`}
        >
          <Download size={16} aria-hidden />
          エクスポート
        </button>
        <button
          onClick={() => setShowNewModal(true)}
          className={`inline-flex items-center justify-center gap-1.5 h-9 ${isMobile ? 'px-3 text-[13px]' : 'px-4 text-sm'} bg-cta-primary text-white border-0 rounded-md cursor-pointer font-semibold whitespace-nowrap hover:bg-cta-primary-dark transition-colors`}
        >
          <Plus size={16} aria-hidden />
          新規作成
        </button>
      </Header>

      <div className={`bg-surface-card border-b border-stroke-input ${isMobile ? 'px-4 py-3' : isTablet ? 'px-5 py-4' : 'px-6 py-5'} grid ${isMobile ? 'grid-cols-1' : 'grid-cols-[repeat(auto-fit,minmax(200px,1fr))]'} gap-4`}>
        <div>
          <label className={filterLabelCls}>都道府県</label>
          <input type="text" value={filterPrefecture} onChange={(e) => setFilterPrefecture(e.target.value)} placeholder="東京都" className={filterInputCls} />
        </div>
        <div>
          <label className={filterLabelCls}>設立母体</label>
          <input type="text" value={filterFoundingBody} onChange={(e) => setFilterFoundingBody(e.target.value)} placeholder="国立、公立、医療法人" className={filterInputCls} />
        </div>
        <div>
          <label className={filterLabelCls}>施設コード</label>
          <input type="text" value={filterFacilityCode} onChange={(e) => setFilterFacilityCode(e.target.value)} placeholder="F001" className={filterInputCls} />
        </div>
        <div>
          <label className={filterLabelCls}>施設名</label>
          <input type="text" value={filterFacilityName} onChange={(e) => setFilterFacilityName(e.target.value)} placeholder="施設名で検索" className={filterInputCls} />
        </div>
      </div>

      <main className={`flex-1 overflow-y-auto ${isMobile ? 'p-4' : isTablet ? 'p-5' : 'p-6'}`}>
        {isLoading && (
          <div className="bg-surface-card rounded-lg p-6 text-center text-content-sub text-sm mb-4">
            読み込み中...
          </div>
        )}

        {isMobile ? (
          <div className="flex flex-col gap-3">
            {filteredFacilities.map((facility) => (
              <div key={facility.id} className="bg-surface-card rounded-lg p-4 shadow-sm">
                <div className="mb-3 pb-3 border-b border-stroke-input">
                  <p className="text-base font-semibold text-content-primary mb-1">{facility.facilityName}</p>
                  <p className="text-[13px] text-content-sub tabular-nums">{facility.facilityCode}</p>
                </div>
                <div className="flex flex-col gap-2 text-[13px] text-content-primary">
                  <div><span className="text-content-sub">都道府県:</span> {facility.prefecture}</div>
                  <div><span className="text-content-sub">設立母体:</span> {facility.foundingBody}</div>
                  <div><span className="text-content-sub">病床数:</span> <span className="tabular-nums">{facility.bedCount}</span>床</div>
                </div>
                <div className="flex gap-2 mt-3">
                  <button onClick={() => handleEdit(facility)} className="flex-1 py-2 bg-content-primary text-white border-0 rounded text-[13px] font-semibold cursor-pointer hover:bg-content-primary/90 transition-colors">編集</button>
                  <button onClick={() => handleDelete(facility.id)} className="flex-1 py-2 bg-content-alert text-white border-0 rounded text-[13px] font-semibold cursor-pointer hover:opacity-90 transition-colors">削除</button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-surface-card rounded-lg shadow-sm overflow-auto max-h-[calc(100vh-220px)]">
            <table className="w-full border-collapse">
              <thead className="sticky top-0 z-[2]">
                <tr>
                  {([
                    { label: '基本情報', span: 8 },
                    { label: '認定情報', span: 6 },
                    { label: '諸室情報', span: 8 },
                    { label: '病床情報', span: 19 },
                    { label: '', span: 1 },
                  ] as const).map((g, i) => (
                    <th key={i} colSpan={g.span} className="px-1.5 py-1 text-center text-[10px] font-bold text-content-primary bg-stroke-card border-r border-stroke-input whitespace-nowrap">
                      {g.label}
                    </th>
                  ))}
                </tr>
                <tr>
                  {FACILITY_COLUMNS.map(col => (
                    <th key={col.key} className="px-1.5 py-1 text-left text-[10px] font-semibold text-content-primary bg-surface-screen border border-stroke-input whitespace-nowrap">{col.label}</th>
                  ))}
                  <th className="px-1.5 py-1 text-center text-[10px] font-semibold text-content-primary bg-surface-screen border border-stroke-input whitespace-nowrap">操作</th>
                </tr>
              </thead>
              <tbody>
                {filteredFacilities.map((facility, index) => (
                  <tr key={facility.id} className={index % 2 === 0 ? 'bg-surface-card' : 'bg-surface-screen'}>
                    {FACILITY_COLUMNS.map(col => (
                      <td key={col.key} className="px-1.5 py-1 text-[11px] text-content-primary whitespace-nowrap border border-stroke-input">
                        {String((facility as unknown as Record<string, unknown>)[col.key] || '')}
                      </td>
                    ))}
                    <td className="px-1.5 py-1 text-center whitespace-nowrap border border-stroke-input">
                      <div className="flex gap-1 justify-center">
                        <button
                          onClick={() => handleEdit(facility)}
                          className="inline-flex items-center justify-center w-7 h-7 bg-transparent text-content-primary border-0 rounded cursor-pointer hover:bg-stroke-card transition-colors"
                          aria-label={`${facility.facilityName} を編集`}
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(facility.id)}
                          className="inline-flex items-center justify-center w-7 h-7 bg-transparent text-content-alert border-0 rounded cursor-pointer hover:bg-stroke-card transition-colors"
                          aria-label={`${facility.facilityName} を削除`}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {filteredFacilities.length === 0 && !isLoading && (
          <div className="bg-surface-card rounded-lg">
            <EmptyState
              title="検索条件に一致する施設マスタがありません"
              description="検索条件を変更するか、フィルターをリセットしてください"
              actionLabel="フィルターをリセット"
              onAction={() => {
                setFilterFacilityCode('');
                setFilterFacilityName('');
                setFilterPrefecture('');
                setFilterFoundingBody('');
              }}
            />
          </div>
        )}
      </main>

      <FacilityFormModal
        isOpen={showNewModal}
        mode="create"
        onClose={() => { setShowNewModal(false); setSelectedFacility(null); }}
        onSubmit={handleNewSubmit}
        isMobile={isMobile}
      />
      <FacilityFormModal
        isOpen={showEditModal}
        mode="edit"
        facility={selectedFacility || undefined}
        onClose={() => { setShowEditModal(false); setSelectedFacility(null); }}
        onSubmit={handleEditSubmit}
        isMobile={isMobile}
      />

      <footer className="py-3 text-center text-xs text-content-sub">
        &copy;Copyright 2024 SHIP HEALTHCARE HOLDINGS, INC.
      </footer>
    </div>
  );
}
