'use client';

import { useRouter } from 'next/navigation';
import { useState, useMemo, Suspense } from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import { Header } from '@/components/layouts/Header';
import { useResponsive } from '@/lib/hooks/useResponsive';
import { useMasterStore } from '@/lib/stores/masterStore';
import { VendorMaster } from '@/lib/types/master';
import { VendorFormModal } from '@/components/modals/VendorFormModal';
import { SearchableSelect } from '@/components/ui/SearchableSelect';

function VendorMasterContent() {
  const router = useRouter();
  const { isMobile, isTablet } = useResponsive();
  const { vendors, facilities, addVendor, updateVendor, deleteVendor } = useMasterStore();

  const facilityOptions = useMemo(() => facilities.map(f => f.facilityName), [facilities]);

  const [filterFacilityName, setFilterFacilityName] = useState('');
  const [filterVendorName, setFilterVendorName] = useState('');
  const [filterKeyword, setFilterKeyword] = useState('');
  const [showNewModal, setShowNewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState<VendorMaster | null>(null);

  const filteredVendors = vendors.filter((vendor) => {
    const matchFacilityName = !filterFacilityName || vendor.facilityName.toLowerCase().includes(filterFacilityName.toLowerCase());
    const matchVendorName = !filterVendorName || vendor.vendorName.toLowerCase().includes(filterVendorName.toLowerCase());
    if (!matchFacilityName || !matchVendorName) return false;
    if (!filterKeyword) return true;
    const kw = filterKeyword.toLowerCase();
    return (
      vendor.invoiceNumber.toLowerCase().includes(kw) ||
      vendor.address.toLowerCase().includes(kw) ||
      vendor.position.toLowerCase().includes(kw) ||
      vendor.role.toLowerCase().includes(kw) ||
      vendor.contactPerson.toLowerCase().includes(kw) ||
      vendor.phone.toLowerCase().includes(kw) ||
      vendor.email.toLowerCase().includes(kw)
    );
  });

  const handleEdit = (vendor: VendorMaster) => {
    setSelectedVendor(vendor);
    setShowEditModal(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('この業者マスタを削除してもよろしいですか?')) {
      deleteVendor(id);
    }
  };

  const handleNewSubmit = (data: Partial<VendorMaster>) => {
    const newVendor: VendorMaster = {
      id: `VND${String(vendors.length + 1).padStart(3, '0')}`,
      facilityName: data.facilityName || '',
      invoiceNumber: data.invoiceNumber || '',
      vendorName: data.vendorName || '',
      address: data.address || '',
      position: data.position || '',
      role: data.role || '',
      contactPerson: data.contactPerson || '',
      phone: data.phone || '',
      email: data.email || '',
      isPrimaryContact: data.isPrimaryContact || false,
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    addVendor(newVendor);
  };

  const handleEditSubmit = (data: Partial<VendorMaster>) => {
    if (selectedVendor) updateVendor(selectedVendor.id, data);
  };

  const thCls = `${isTablet ? 'p-3 text-[13px]' : 'p-3.5 text-sm'} text-left font-semibold text-content-primary whitespace-nowrap border border-stroke-input`;
  const tdCls = `${isTablet ? 'p-3 text-[13px]' : 'p-3.5 text-sm'} text-content-primary whitespace-nowrap border border-stroke-input`;

  return (
    <div className="flex flex-col h-dvh bg-surface-screen">
      <Header
        title="業者マスタ"
        showBackButton={true}
        backHref="/main"
        backLabel="メイン画面に戻る"
        backButtonVariant="secondary"
        hideMenu={true}
        hideHomeButton={true}
        resultCount={filteredVendors.length}
        showOriginalLabel={false}
      >
        <button
          onClick={() => setShowNewModal(true)}
          className="inline-flex items-center justify-center h-9 px-4 bg-cta-primary text-white border-0 rounded-md cursor-pointer text-sm font-semibold whitespace-nowrap hover:bg-cta-primary-dark transition-colors"
        >
          新規作成
        </button>
      </Header>

      {/* Filter */}
      <div className={`bg-surface-card border-b border-stroke-input ${isMobile ? 'px-4 py-3' : isTablet ? 'px-5 py-4' : 'px-6 py-5'} grid ${isMobile ? 'grid-cols-1' : 'grid-cols-[repeat(3,minmax(180px,1fr))]'} gap-4`}>
        <div>
          <label className={`block ${isMobile ? 'text-xs' : 'text-[13px]'} font-semibold mb-1.5 text-content-primary`}>施設名</label>
          <SearchableSelect
            value={filterFacilityName}
            onChange={setFilterFacilityName}
            options={['', ...facilityOptions]}
            placeholder="施設名で検索"
            isMobile={isMobile}
          />
        </div>
        <div>
          <label className={`block ${isMobile ? 'text-xs' : 'text-[13px]'} font-semibold mb-1.5 text-content-primary`}>業者名</label>
          <input
            type="text"
            value={filterVendorName}
            onChange={(e) => setFilterVendorName(e.target.value)}
            placeholder="業者名で検索"
            className={`w-full ${isMobile ? 'p-2 text-[13px]' : 'p-2.5 text-sm'} border border-stroke-input rounded-md box-border bg-surface-card focus:outline-none focus:border-cta-primary transition-colors`}
          />
        </div>
        <div>
          <label className={`block ${isMobile ? 'text-xs' : 'text-[13px]'} font-semibold mb-1.5 text-content-primary`}>キーワード検索</label>
          <input
            type="text"
            value={filterKeyword}
            onChange={(e) => setFilterKeyword(e.target.value)}
            placeholder="登録番号・住所・氏名・連絡先など"
            className={`w-full ${isMobile ? 'p-2 text-[13px]' : 'p-2.5 text-sm'} border border-stroke-input rounded-md box-border bg-surface-card focus:outline-none focus:border-cta-primary transition-colors`}
          />
        </div>
      </div>

      <main className={`flex-1 overflow-hidden flex flex-col ${isMobile ? 'p-4' : isTablet ? 'p-5' : 'p-6'}`} style={{ minHeight: 0 }}>
        {isMobile ? (
          <div className="flex flex-col gap-3 flex-1 overflow-y-auto">
            {filteredVendors.map((vendor) => (
              <div key={vendor.id} className="bg-surface-card rounded-lg p-4 shadow-sm">
                <div className="mb-3 pb-3 border-b border-stroke-input">
                  <p className="text-base font-semibold text-content-primary mb-1">{vendor.vendorName}</p>
                  <p className="text-xs text-content-sub tabular-nums">{vendor.invoiceNumber}</p>
                </div>
                <div className="flex flex-col gap-2 text-[13px]">
                  <div><span className="text-content-sub">担当施設:</span> {vendor.facilityName}</div>
                  <div><span className="text-content-sub">住所:</span> {vendor.address}</div>
                  <div><span className="text-content-sub">役職:</span> {vendor.position}</div>
                  <div><span className="text-content-sub">役割:</span> {vendor.role}</div>
                  <div><span className="text-content-sub">氏名:</span> {vendor.contactPerson}</div>
                  <div><span className="text-content-sub">連絡先:</span> {vendor.phone}</div>
                  <div><span className="text-content-sub">メール:</span> {vendor.email}</div>
                  <div><span className="text-content-sub">担当フラグ:</span> {vendor.isPrimaryContact ? '○' : '---'}</div>
                </div>
                <div className="flex gap-2 mt-3">
                  <button onClick={() => handleEdit(vendor)} className="flex-1 py-2 bg-content-primary text-white border-0 rounded text-[13px] font-semibold cursor-pointer hover:bg-content-primary/90 transition-colors">編集</button>
                  <button onClick={() => handleDelete(vendor.id)} className="flex-1 py-2 bg-content-alert text-white border-0 rounded text-[13px] font-semibold cursor-pointer hover:opacity-90 transition-colors">削除</button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-surface-card rounded-lg overflow-hidden shadow-sm flex-1 flex flex-col" style={{ minHeight: 0 }}>
            <div className="overflow-auto flex-1">
              <table className="w-full border-collapse">
                <thead className="bg-surface-screen border-b border-stroke-input sticky top-0 z-10">
                  <tr>
                    <th className={thCls}>担当施設名</th>
                    <th className={thCls}>インボイス登録番号</th>
                    <th className={thCls}>業者名</th>
                    <th className={thCls}>住所</th>
                    <th className={thCls}>役職</th>
                    <th className={thCls}>役割</th>
                    <th className={thCls}>氏名</th>
                    <th className={thCls}>連絡先</th>
                    <th className={thCls}>メール</th>
                    <th className={`${thCls} text-center`}>担当フラグ</th>
                    <th className={`${thCls} text-center`}>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredVendors.map((vendor, index) => (
                    <tr key={vendor.id} className={`border-b border-stroke-input ${index % 2 === 0 ? 'bg-surface-card' : 'bg-surface-screen'}`}>
                      <td className={tdCls}>{vendor.facilityName}</td>
                      <td className={`${tdCls} tabular-nums`}>{vendor.invoiceNumber}</td>
                      <td className={tdCls}>{vendor.vendorName}</td>
                      <td className={tdCls}>{vendor.address}</td>
                      <td className={tdCls}>{vendor.position}</td>
                      <td className={tdCls}>{vendor.role}</td>
                      <td className={tdCls}>{vendor.contactPerson}</td>
                      <td className={`${tdCls} tabular-nums`}>{vendor.phone}</td>
                      <td className={tdCls}>{vendor.email}</td>
                      <td className={`${tdCls} text-center`}>{vendor.isPrimaryContact ? '○' : '---'}</td>
                      <td className={`${isTablet ? 'p-3' : 'p-3.5'} text-center whitespace-nowrap border border-stroke-input`}>
                        <div className="flex gap-1 justify-center">
                          <button
                            onClick={() => handleEdit(vendor)}
                            className="inline-flex items-center justify-center w-8 h-8 bg-transparent text-content-primary border-0 rounded cursor-pointer hover:bg-stroke-card transition-colors"
                            aria-label={`${vendor.vendorName} を編集`}
                          >
                            <Pencil size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(vendor.id)}
                            className="inline-flex items-center justify-center w-8 h-8 bg-transparent text-content-alert border-0 rounded cursor-pointer hover:bg-stroke-card transition-colors"
                            aria-label={`${vendor.vendorName} を削除`}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {filteredVendors.length === 0 && (
          <div className={`bg-surface-card rounded-lg ${isMobile ? 'px-5 py-10' : 'px-10 py-14'} text-center text-content-sub ${isMobile ? 'text-sm' : 'text-base'}`}>
            <p className="mb-4">検索条件に一致する業者マスタがありません</p>
            <button onClick={() => setShowNewModal(true)} className="h-10 px-5 bg-cta-primary text-white border-0 rounded-md text-sm font-semibold cursor-pointer hover:bg-cta-primary-dark transition-colors">
              新規作成
            </button>
          </div>
        )}
      </main>

      <footer className="py-3 text-center text-xs text-content-sub">
        &copy;Copyright 2024 SHIP HEALTHCARE HOLDINGS, INC.
      </footer>

      <VendorFormModal
        isOpen={showNewModal}
        mode="create"
        onClose={() => { setShowNewModal(false); setSelectedVendor(null); }}
        onSubmit={handleNewSubmit}
        isMobile={isMobile}
      />
      <VendorFormModal
        isOpen={showEditModal}
        mode="edit"
        vendor={selectedVendor || undefined}
        onClose={() => { setShowEditModal(false); setSelectedVendor(null); }}
        onSubmit={handleEditSubmit}
        isMobile={isMobile}
      />
    </div>
  );
}

export default function VendorMasterPage() {
  return (
    <Suspense fallback={<div className="p-5 text-center text-content-sub">読み込み中...</div>}>
      <VendorMasterContent />
    </Suspense>
  );
}
