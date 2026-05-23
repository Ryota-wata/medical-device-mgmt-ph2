'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Asset } from '@/lib/types';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useAssetStore } from '@/lib/stores';

function AssetDetailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const qrCode = searchParams.get('qrCode');
  const assetNo = searchParams.get('no');
  const isReadOnly = searchParams.get('readonly') === 'true';
  const from = searchParams.get('from');

  // 戻り先マッピング
  const backConfig = (() => {
    switch (from) {
      case 'inventory':
        return { href: '/inventory', label: '棚卸一覧に戻る' };
      case 'remodel':
        return { href: '/remodel-application', label: '編集リストに戻る' };
      case 'asset-search':
      default:
        return { href: '/asset-search-result', label: '資産一覧に戻る' };
    }
  })();

  const { assets: storeAssets } = useAssetStore();
  const foundAsset = storeAssets.find(a => {
    if (qrCode && a.qrCode === qrCode) return true;
    if (assetNo && a.no === parseInt(assetNo)) return true;
    return false;
  });

  const [asset, setAsset] = useState<Asset | null>(null);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [isEditMode, setIsEditMode] = useState(false);
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);
  const [selectedDocIndex, setSelectedDocIndex] = useState<number | null>(null);

  useEffect(() => {
    if (foundAsset) setAsset({ ...foundAsset });
  }, [foundAsset?.no]);

  const handleClose = () => {
    if (isEditMode) setShowCloseConfirm(true);
    else router.push(backConfig.href);
  };

  const [uploadedDocuments, setUploadedDocuments] = useState<{ name: string; date: string }[]>([]);
  const handleDocumentUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const today = new Date().toISOString().slice(0, 10);
    const newDocs = Array.from(files).map((f) => ({ name: f.name, date: today }));
    setUploadedDocuments((prev) => [...prev, ...newDocs]);
    e.target.value = '';
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !asset) return;
    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setAsset((prev) => {
            if (!prev) return prev;
            return { ...prev, photos: [...(prev.photos || []), event.target?.result as string] };
          });
        }
      };
      reader.readAsDataURL(file);
    });
  };

  if (!asset) return <div className="flex items-center justify-center h-dvh text-sm text-content-sub">読み込み中...</div>;

  // 資産に写真が登録されていない場合、デモ用のサンプル4枚を表示（プレースホルダー）
  const makePlaceholderSvg = (label: string, bg: string) => {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="400" height="400"><rect width="400" height="400" fill="${bg}"/><g fill="white" font-family="sans-serif" text-anchor="middle"><text x="200" y="190" font-size="28" font-weight="600">${asset.item || '医療機器'}</text><text x="200" y="230" font-size="18" opacity="0.85">${label}</text></g></svg>`;
    return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
  };
  const photos = (asset.photos && asset.photos.length > 0)
    ? asset.photos
    : [
        makePlaceholderSvg('正面', '#4A4A4A'),
        makePlaceholderSvg('側面', '#4A4A4A'),
        makePlaceholderSvg('操作部', '#4A4A4A'),
        makePlaceholderSvg('銘板', '#4A4A4A'),
      ];
  const hasPhotos = photos.length > 0;

  // モックデータ（asset master に無い項目はプレースホルダー）
  const vendorInfo = {
    supplier: { name: 'グリーンホスピタルサプライ株式会社', person: '緑病 供太', tel: '090-●●●●-●●●●', email: 'midori@ghs.co.jp' },
    maintenance: { name: 'キヤノンメディカルシステムズ株式会社', person: '保守南良 任朗', tel: '090-●●●●-●●●●', email: 'hosyunara@cannon.co.jp' },
  };
  const lifecycle = {
    purchaseAmount: '¥ 120,000,000.-',
    maintenanceAmount: '¥ 20,000,000.-',
    repairFeeTotal: '¥ ●●●,●●●.-',
    repairCount: '●回',
    lendingTarget: '—',
    lendingCount: '—',
  };
  const inspectionInfo = {
    type: 'メーカー保守契約',
    groupName: 'キヤノン定期点検',
    periodicMenu: 'キヤノン定期点検 2回／年',
    dailyMenu: '—',
  };
  const contractInfo = {
    no: '●●●●●●●●●',
    type: '「保守契約」',
    groupName: 'キヤノン保守契約一式',
    contractDate: 'yyyy-mm-dd',
    period: 'yyyy-mm-dd〜yyyy-mm-dd',
    contractClass: 'フルメンテナンス契約',
    excludedAmount: '￥15,000,000.-',
    partsFree: '有り',
    oncall: '○',
    remote: '○',
  };
  const pharmaInfo = {
    jmdn: '37618010',
    jan: '●●●●●●●●●●●●●',
    typeCode: '器09',
    classification: 'Ⅱ',
    specialMgmt: '該当',
    genericName: '全身用X線CT診断装置',
    approvalNo: '229ABZX00012000',
    approvalDate: 'yyyy-mm-dd',
  };
  const inspectionHistory = [
    { date: 'yyyy-mm-dd', category: '外部依頼', vendor: '業者名（発注業者）', symptom: '●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●' },
    { date: 'yyyy-mm-dd', category: 'メーカー点検', vendor: 'キヤノンメディカル', symptom: '●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●' },
    { date: 'yyyy-mm-dd', category: '外部依頼', vendor: '業者名（発注業者）', symptom: '●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●', repair: true },
    { date: 'yyyy-mm-dd', category: '外部依頼', vendor: '業者名（発注業者）', symptom: '●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●', repair: true },
  ];

  return (
    <div className="min-h-dvh flex flex-col bg-surface-screen">
      {/* 上部タイトルバー（品名・メーカー・型番 + 閉じるのみ） */}
      <div className="bg-surface-card border-b border-stroke-card px-5 py-2.5 flex justify-between items-center gap-3 flex-wrap">
        <div className="flex items-baseline gap-3 flex-wrap min-w-0">
          <h1 className="text-base font-bold text-content-primary truncate">{asset.item || asset.name}</h1>
          <span className="text-sm text-content-sub">{asset.maker || 'メーカー'}</span>
          <span className="text-sm font-medium text-content-primary">{asset.model || '—'}</span>
        </div>
        <button onClick={handleClose} aria-label="閉じる" className="size-7 flex items-center justify-center rounded text-content-sub hover:bg-surface-disabled border-0 bg-transparent cursor-pointer">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>

      {/* 設置情報バー */}
      <div className="bg-surface-screen border-b border-stroke-card px-5 py-2 flex items-center gap-6 flex-wrap text-sm">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-content-sub">設置情報:</span>
          {asset.building && <><span className="text-content-primary">{asset.building}</span><span className="text-content-sub">|</span></>}
          <span className="text-content-primary">{asset.floor || '—'}</span>
          <span className="text-content-sub">|</span>
          <span className="text-content-primary">{asset.department || '—'}</span>
          <span className="text-content-sub">|</span>
          <span className="text-content-primary">{asset.section || '—'}</span>
          <span className="text-content-sub">|</span>
          <span className="text-content-primary">{asset.roomName || '—'}</span>
        </div>
        <div className="flex items-center gap-2 ml-auto">
          <span className="text-xs text-content-sub">管理部署:</span>
          <span className="text-content-primary">{asset.managementDept || '—'}</span>
        </div>
      </div>

      {/* メインコンテンツ（3カラム: スライド37準拠） */}
      <div className="flex-1 overflow-auto p-4">
        <div className="grid grid-cols-12 gap-4">
          {/* 左カラム: 写真 + 登録ドキュメント */}
          <div className="col-span-12 lg:col-span-3 space-y-3">
            <div className="bg-surface-card rounded-lg border border-stroke-card p-4">
              {hasPhotos ? (
                <>
                  <div className="relative bg-surface-screen rounded-lg overflow-hidden">
                    <img src={photos[currentPhotoIndex]} alt="資産写真" className="w-full h-[400px] object-contain" />
                    {photos.length > 1 && (
                      <>
                        <button
                          onClick={() => setCurrentPhotoIndex(Math.max(0, currentPhotoIndex - 1))}
                          disabled={currentPhotoIndex === 0}
                          aria-label="前の写真"
                          className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 text-white rounded-full size-9 flex items-center justify-center disabled:opacity-30 cursor-pointer border-0 hover:bg-black/70 transition-colors"
                        >
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
                        </button>
                        <button
                          onClick={() => setCurrentPhotoIndex(Math.min(photos.length - 1, currentPhotoIndex + 1))}
                          disabled={currentPhotoIndex === photos.length - 1}
                          aria-label="次の写真"
                          className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 text-white rounded-full size-9 flex items-center justify-center disabled:opacity-30 cursor-pointer border-0 hover:bg-black/70 transition-colors"
                        >
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
                        </button>
                        <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-0.5 rounded tabular-nums">
                          {currentPhotoIndex + 1} / {photos.length}
                        </div>
                      </>
                    )}
                  </div>
                  <div className="flex gap-2 mt-3 flex-wrap">
                    {photos.map((p, i) => (
                      <img
                        key={i}
                        src={p}
                        alt={`サムネ${i+1}`}
                        onClick={() => setCurrentPhotoIndex(i)}
                        className={`size-14 object-cover rounded cursor-pointer transition-all ${
                          i === currentPhotoIndex
                            ? 'border-2 border-cta-primary opacity-100'
                            : 'border border-stroke-input opacity-70 hover:opacity-100'
                        }`}
                      />
                    ))}
                  </div>
                </>
              ) : (
                <div className="w-full h-[400px] flex flex-col items-center justify-center bg-surface-screen rounded-lg text-content-sub text-sm gap-2">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                  <span>写真なし</span>
                </div>
              )}
              {isEditMode && (
                <label htmlFor="photo-upload" className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 bg-cta-primary text-white rounded-md cursor-pointer text-xs font-medium hover:opacity-90">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                  写真を追加
                </label>
              )}
              <input id="photo-upload" type="file" accept="image/*" multiple onChange={handlePhotoUpload} className="hidden" />
            </div>

            {/* 登録ドキュメント（写真の下） */}
            <div className="bg-surface-card rounded-lg border border-stroke-card p-4">
              <h3 className="text-sm font-bold text-content-primary mb-3">登録ドキュメント</h3>
              <div className="flex flex-col gap-1.5">
                {['契約書.pdf', '納品書.pdf', '検収書.pdf'].map((doc, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedDocIndex(i)}
                    className={`flex items-center gap-2 p-2 rounded border cursor-pointer transition-colors w-full text-left ${
                      selectedDocIndex === i
                        ? 'bg-surface-select border-cta-primary'
                        : 'bg-transparent border-transparent hover:bg-surface-screen'
                    }`}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={selectedDocIndex === i ? '#008C1D' : '#8A8A8A'} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium text-content-primary truncate">{doc}</div>
                      <div className="text-[10px] text-content-sub">2025/12/12</div>
                    </div>
                  </button>
                ))}
                {uploadedDocuments.map((doc, i) => {
                  const docIdx = 3 + i; // 既定3件の後
                  return (
                    <button
                      key={`u${i}`}
                      onClick={() => setSelectedDocIndex(docIdx)}
                      className={`flex items-center gap-2 p-2 rounded border cursor-pointer transition-colors w-full text-left ${
                        selectedDocIndex === docIdx
                          ? 'bg-surface-select border-cta-primary'
                          : 'bg-transparent border-transparent hover:bg-surface-screen'
                      }`}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={selectedDocIndex === docIdx ? '#008C1D' : '#8A8A8A'} strokeWidth="1.75"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-medium text-content-primary truncate">{doc.name}</div>
                        <div className="text-[10px] text-content-sub">{doc.date}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
              {isEditMode && (
                <>
                  <label htmlFor="doc-upload" className="mt-3 inline-flex items-center gap-1 px-2.5 py-1 bg-cta-primary text-white rounded text-xs cursor-pointer hover:opacity-90">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                    追加
                  </label>
                  <input id="doc-upload" type="file" accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png" multiple onChange={handleDocumentUpload} className="hidden" />
                </>
              )}
            </div>
          </div>

          {/* 中央カラム: 業者情報 + 操作ボタン + 点検・修理履歴 */}
          <div className="col-span-12 lg:col-span-4 space-y-3">
            <KartCard title="業者情報">
              <div className="space-y-3">
                <div>
                  <div className="text-xs text-content-sub mb-1">納入窓口業者</div>
                  <KartRow label="氏名" value={vendorInfo.supplier.name} />
                  <KartRow label="" value={vendorInfo.supplier.person} />
                  <KartRow label="連絡先" value={vendorInfo.supplier.tel} />
                  <KartRow label="メール" value={vendorInfo.supplier.email} />
                </div>
                <div className="pt-3 border-t border-stroke-card">
                  <div className="text-xs text-content-sub mb-1">保守窓口業者</div>
                  <KartRow label="氏名" value={vendorInfo.maintenance.name} />
                  <KartRow label="" value={vendorInfo.maintenance.person} />
                  <KartRow label="連絡先" value={vendorInfo.maintenance.tel} />
                  <KartRow label="メール" value={vendorInfo.maintenance.email} />
                </div>
              </div>
            </KartCard>

            <div className="flex gap-2">
              <button className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-surface-card text-content-primary border border-stroke-input rounded-md text-xs font-medium hover:bg-surface-disabled transition-colors">
                取扱説明書
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
              </button>
              <button className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-surface-card text-content-primary border border-stroke-input rounded-md text-xs font-medium hover:bg-surface-disabled transition-colors">
                点検マニュアル
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
              </button>
              <button className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-surface-card text-content-primary border border-stroke-input rounded-md text-xs font-medium hover:bg-surface-disabled transition-colors">
                添付文書
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
              </button>
            </div>

            {/* 点検・修理履歴（中央カラム内） */}
            <KartCard title="点検・修理履歴">
              <div className="space-y-2 max-h-[400px] overflow-auto">
                {inspectionHistory.map((h, i) => (
                  <div key={i} className="border border-stroke-card rounded-md p-3 hover:bg-surface-screen transition-colors">
                    <div className="flex items-center gap-3 text-xs mb-1 flex-wrap">
                      <span><span className="text-content-sub">実施日</span> <span className="text-content-primary font-medium ml-1">{h.date}</span></span>
                      <span><span className="text-content-sub">{h.repair ? '修理区分' : '区分'}</span> <span className="text-content-primary ml-1">{h.category}</span></span>
                      <span><span className="text-content-sub">業者名</span> <span className="text-content-primary ml-1">{h.vendor}</span></span>
                    </div>
                    <div className="flex items-start gap-2 text-xs">
                      <span className="text-content-sub shrink-0">症状</span>
                      <span className="text-content-primary break-all">{h.symptom}</span>
                    </div>
                  </div>
                ))}
              </div>
            </KartCard>
          </div>

          {/* 右カラム: ライフサイクル + 品目情報 + 点検保守 + 契約 + 薬事 */}
          <div className="col-span-12 lg:col-span-5 space-y-3">
            <KartCard title="ライフサイクル">
              <div className="grid grid-cols-2 gap-x-6 gap-y-1.5">
                <KartRow label="購入金額" value={lifecycle.purchaseAmount} numeric />
                <KartRow label="保守金額" value={lifecycle.maintenanceAmount} numeric />
                <KartRow label="累計修理費用" value={lifecycle.repairFeeTotal} numeric />
                <KartRow label="修理回数" value={lifecycle.repairCount} numeric />
                <KartRow label="貸出対象" value={lifecycle.lendingTarget} />
                <KartRow label="累計貸出回数" value={lifecycle.lendingCount} />
              </div>
            </KartCard>

            <KartCard title="品目情報">
              <div className="grid grid-cols-2 gap-x-6 gap-y-1.5">
                {/* 資産マスタに値があるサンプル項目 */}
                <KartRow label="QRコード" value={asset.qrCode} />
                <KartRow label="シリアル番号" value={asset.serialNumber || '—'} />
                <KartRow label="固定資産番号" value={asset.assetNo || '—'} />
                <KartRow label="ME管理機器番号" value={asset.managementNo || '—'} />
                <KartRow label="台帳番号" value={asset.ledgerNo || '—'} />
                <KartRow label="備品番号" value={asset.equipmentNo || '—'} />
                <KartRow label="個体管理名称" value={asset.name || '—'} />
                <KartRow label="個体管理品目" value={asset.item || '—'} />
                <KartRow label="メーカー名" value={asset.maker || '—'} />
                <KartRow label="型式" value={asset.model || '—'} />
                <KartRow label="納入年月日" value={asset.purchaseDate || '—'} />
                <KartRow label="W × D × H" value={`${asset.width || '—'} × ${asset.depth || '—'} × ${asset.height || '—'}`} />
                {/* 資産マスタに該当項目なし: プレースホルダー */}
                <KartRow label="契約決済No," value="●●●●●●●●" highlight />
                <KartRow label="発注依頼No," value="●●●●●●●●" highlight />
                <KartRow label="発注グループ名称" value="●●●●●●● 一式" />
                <KartRow label="耐用年数" value="● 年" />
                <KartRow label="耐用期間" value="●● 年" />
                <KartRow label="リース会社" value="●●●●●株式会社" />
                <KartRow label="リース期間" value="yyyy-mm-dd〜yyyy-mm-dd" />
              </div>
              <div className="mt-3 pt-2 border-t border-stroke-card grid grid-cols-2 gap-x-6 gap-y-1.5">
                <KartRow label="システム接続" value={asset.currentConnectionStatus || '—'} />
                <KartRow label="システム接続先" value="—" />
              </div>
            </KartCard>

            <KartCard title="点検・保守情報">
              <div className="grid grid-cols-2 gap-x-6 gap-y-1.5">
                <KartRow label="点検種別" value={inspectionInfo.type} />
                <KartRow label="点検グループ名" value={inspectionInfo.groupName} />
                <KartRow label="定期点検メニュー" value={inspectionInfo.periodicMenu} />
                <KartRow label="日常点検メニュー" value={inspectionInfo.dailyMenu} />
              </div>
              <div className="mt-3 pt-2 border-t border-stroke-card grid grid-cols-2 gap-x-6 gap-y-1.5">
                <KartRow label="契約金額No," value={contractInfo.no} highlight />
                <KartRow label="契約種別" value={contractInfo.type} highlight />
                <KartRow label="契約グループ名" value={contractInfo.groupName} />
                <KartRow label="契約日" value={contractInfo.contractDate} />
                <KartRow label="契約種別" value={contractInfo.contractClass} />
                <KartRow label="契約期間" value={contractInfo.period} />
                <KartRow label="部品免責" value={contractInfo.partsFree} />
                <KartRow label="免責金額（税別）" value={contractInfo.excludedAmount} numeric />
                <KartRow label="オンコール対応" value={contractInfo.oncall} />
                <KartRow label="リモート対応" value={contractInfo.remote} />
              </div>
            </KartCard>

            <KartCard title="薬事情報">
              <div className="grid grid-cols-2 gap-x-6 gap-y-1.5">
                <KartRow label="JMDNコード" value={pharmaInfo.jmdn} />
                <KartRow label="JANコード" value={pharmaInfo.jan} />
                <KartRow label="類別コード" value={pharmaInfo.typeCode} />
                <KartRow label="クラス分類" value={pharmaInfo.classification} />
                <KartRow label="特定保守管理区分" value={pharmaInfo.specialMgmt} />
                <KartRow label="一般的名称" value={pharmaInfo.genericName} />
                <KartRow label="認証番号" value={pharmaInfo.approvalNo} />
                <KartRow label="認証年月日" value={pharmaInfo.approvalDate} />
              </div>
            </KartCard>
          </div>
        </div>
      </div>

      {/* フッター: 閉じる / 編集する */}
      <div className="bg-surface-card border-t border-stroke-card px-5 py-3 flex justify-end gap-2">
        <button
          onClick={handleClose}
          className="px-6 py-2 bg-surface-disabled text-content-sub border-0 rounded-md cursor-pointer text-sm font-medium hover:bg-stroke-card transition-colors"
        >
          閉じる
        </button>
        {!isReadOnly && (
          !isEditMode ? (
            <button
              onClick={() => setIsEditMode(true)}
              className="px-6 py-2 bg-cta-primary text-white border-0 rounded-md cursor-pointer text-sm font-medium hover:opacity-90 transition-opacity"
            >
              編集する
            </button>
          ) : (
            <button
              onClick={() => { alert('保存しました'); setIsEditMode(false); }}
              className="px-6 py-2 bg-cta-primary text-white border-0 rounded-md cursor-pointer text-sm font-medium hover:opacity-90 transition-opacity"
            >
              保存する
            </button>
          )
        )}
      </div>

      <ConfirmDialog
        isOpen={showCloseConfirm}
        onClose={() => setShowCloseConfirm(false)}
        onConfirm={() => router.push(backConfig.href)}
        title="編集を破棄して閉じる"
        message="編集中の内容が破棄されます。閉じてもよろしいですか？"
        confirmLabel="閉じる"
        cancelLabel="編集を続ける"
        variant="warning"
      />

      {/* ドキュメントプレビューモーダル（Figmaスライド37参照） */}
      {selectedDocIndex !== null && (() => {
        const defaultDocs = [
          { name: '契約書.pdf', date: '2025/12/12' },
          { name: '納品書.pdf', date: '2025/12/12' },
          { name: '検収書.pdf', date: '2025/12/12' },
        ];
        const allDocs = [...defaultDocs, ...uploadedDocuments];
        const doc = allDocs[selectedDocIndex];
        if (!doc) return null;
        const goPrev = () => setSelectedDocIndex(Math.max(0, selectedDocIndex - 1));
        const goNext = () => setSelectedDocIndex(Math.min(allDocs.length - 1, selectedDocIndex + 1));
        return (
          <div
            className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-6"
            onClick={() => setSelectedDocIndex(null)}
          >
            <div
              className="bg-surface-card rounded-lg w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* ヘッダー */}
              <div className="bg-surface-screen border-b border-stroke-card px-5 py-3 flex justify-between items-center rounded-t-lg">
                <div>
                  <h3 className="text-sm font-bold text-content-primary">{doc.name}</h3>
                  <div className="text-xs text-content-sub mt-0.5">{doc.date}</div>
                </div>
                <button
                  onClick={() => setSelectedDocIndex(null)}
                  aria-label="閉じる"
                  className="size-8 flex items-center justify-center rounded text-content-sub hover:bg-surface-disabled border-0 bg-transparent cursor-pointer"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              </div>

              {/* PDFプレビュー（黒背景 + 白い紙イメージ） */}
              <div className="flex-1 overflow-auto bg-[#4A4A4A] p-8 flex items-start justify-center">
                <div className="bg-white shadow-xl p-10 w-full max-w-[480px] aspect-[210/297]">
                  <h2 className="text-center text-base font-bold mb-6 text-content-primary">{doc.name.replace('.pdf', '')}</h2>
                  <div className="text-[10px] leading-relaxed text-content-primary text-justify space-y-3">
                    <p>●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●</p>
                    <p>●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●</p>
                    <p>●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●</p>
                  </div>
                  <p className="text-right text-xs text-content-primary mt-12">●●●●●●●●</p>
                </div>
              </div>

              {/* ページネーション */}
              <div className="bg-surface-screen border-t border-stroke-card px-5 py-2.5 flex justify-between items-center rounded-b-lg">
                <button
                  onClick={goPrev}
                  disabled={selectedDocIndex === 0}
                  aria-label="前のドキュメント"
                  className="size-8 flex items-center justify-center rounded text-content-sub hover:bg-surface-disabled disabled:opacity-30 disabled:cursor-not-allowed border-0 bg-transparent cursor-pointer"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
                </button>
                <span className="text-xs text-content-sub tabular-nums">{selectedDocIndex + 1} / {allDocs.length}</span>
                <button
                  onClick={goNext}
                  disabled={selectedDocIndex === allDocs.length - 1}
                  aria-label="次のドキュメント"
                  className="size-8 flex items-center justify-center rounded text-content-sub hover:bg-surface-disabled disabled:opacity-30 disabled:cursor-not-allowed border-0 bg-transparent cursor-pointer"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}

// カード（タイトル + ボディ）
function KartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-surface-card rounded-lg border border-stroke-card p-4">
      <h3 className="text-sm font-bold text-content-primary mb-3 pb-2 border-b border-stroke-card">{title}</h3>
      {children}
    </div>
  );
}

// 1行（ラベル + 値）
function KartRow({ label, value, numeric, highlight }: { label: string; value: any; numeric?: boolean; highlight?: boolean }) {
  return (
    <div className="flex items-baseline gap-2 text-xs">
      <span className={`shrink-0 w-[100px] ${highlight ? 'text-content-alert' : 'text-content-sub'}`}>{label}</span>
      <span className={`flex-1 min-w-0 break-all ${numeric ? 'tabular-nums' : ''} text-content-primary`}>{value}</span>
    </div>
  );
}

export default function AssetDetailPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-dvh text-sm text-content-sub">読み込み中...</div>}>
      <AssetDetailContent />
    </Suspense>
  );
}
