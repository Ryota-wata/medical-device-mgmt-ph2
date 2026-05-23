'use client';

import React, { useState, useRef, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { useResponsive } from '@/lib/hooks/useResponsive';
import { useAuthStore } from '@/lib/stores/authStore';
import { ApplicationCompleteModal } from '@/components/ui/ApplicationCompleteModal';
import { ApplicationCloseConfirmModal } from '@/components/ui/ApplicationCloseConfirmModal';
import { Header } from '@/components/layouts';

interface DeviceInfo {
  qrCode: string;
  itemName: string;
  maker: string;
  model: string;
  serialNo: string;
  department: string;
  roomName: string;
  photoUrl?: string;
}

function RepairRequestContent() {
  const router = useRouter();
  const { isMobile } = useResponsive();
  const { user } = useAuthStore();

  // 自動生成項目（hydration mismatch回避のためマウント後に生成）
  const [requestNo, setRequestNo] = useState('');
  const [requestDate, setRequestDate] = useState('');
  const [requestTime, setRequestTime] = useState('');

  const isInitializedRef = useRef(false);
  React.useEffect(() => {
    if (isInitializedRef.current) return;
    isInitializedRef.current = true;
    const now = new Date();
    setRequestNo(`REP-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`);
    setRequestDate(now.toISOString().split('T')[0]);
    setRequestTime(now.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' }));
  }, []);

  // 申請者情報
  const [applicantDepartment, setApplicantDepartment] = useState(user?.hospital || '');
  const [applicantName, setApplicantName] = useState(user?.username || '');

  // 機器情報
  const [isRegisteredAsset, setIsRegisteredAsset] = useState(true);
  const [qrCode, setQrCode] = useState('');
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo | null>(null);
  const [isQrScanning, setIsQrScanning] = useState(false);

  // 未登録資産用の手入力フィールド
  const [manualItemName, setManualItemName] = useState('');
  const [manualMaker, setManualMaker] = useState('');
  const [manualModel, setManualModel] = useState('');
  const [manualSerialNo, setManualSerialNo] = useState('');
  const [manualDepartment, setManualDepartment] = useState('');
  const [manualRoomName, setManualRoomName] = useState('');
  const [capturedPhotos, setCapturedPhotos] = useState<string[]>([]);

  // 症状・代替機・フリーコメント
  const [symptoms, setSymptoms] = useState('');
  const [alternativeDevice, setAlternativeDevice] = useState<'needed' | 'not_needed' | 'requested'>('not_needed');
  const [freeComment, setFreeComment] = useState('');

  // UI状態
  const [showHomeConfirm, setShowHomeConfirm] = useState(false);
  const [isConfirmView, setIsConfirmView] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [completedRequestNo, setCompletedRequestNo] = useState('');

  // ダミーの機器データ（QRコード読み取り時に使用）
  const mockDeviceData: Record<string, DeviceInfo> = {
    'QR-001': {
      qrCode: 'QR-001',
      itemName: '人工呼吸器',
      maker: 'フクダ電子',
      model: 'RES-500',
      serialNo: 'SN-2024-001',
      department: '集中治療室',
      roomName: 'ICU-1',
      photoUrl: '/images/device-placeholder.png'
    },
    'QR-002': {
      qrCode: 'QR-002',
      itemName: '輸液ポンプ',
      maker: 'テルモ',
      model: 'TE-361',
      serialNo: 'SN-2024-002',
      department: '外科病棟',
      roomName: '301号室',
      photoUrl: '/images/device-placeholder.png'
    }
  };

  // QRコード読み取りシミュレーション
  const handleQrScan = () => {
    setIsQrScanning(true);
    setTimeout(() => {
      const mockQr = 'QR-001';
      setQrCode(mockQr);
      setDeviceInfo(mockDeviceData[mockQr] || null);
      setIsQrScanning(false);
    }, 1500);
  };

  // QRコード手入力
  const handleQrInput = (value: string) => {
    setQrCode(value);
    if (mockDeviceData[value]) {
      setDeviceInfo(mockDeviceData[value]);
    } else {
      setDeviceInfo(null);
    }
  };

  // 写真添付用
  const photoInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoAdd = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (ev.target?.result) {
          setCapturedPhotos(prev => [...prev, ev.target!.result as string]);
        }
      };
      reader.readAsDataURL(file);
    });
    if (photoInputRef.current) photoInputRef.current.value = '';
  };

  const handlePhotoRemove = (index: number) => {
    setCapturedPhotos(prev => prev.filter((_, i) => i !== index));
  };

  // フォームの入力状態チェック
  const isFormDirty = qrCode !== '' || symptoms !== '' || manualItemName !== '' || capturedPhotos.length > 0 || freeComment !== '';

  const handleHomeClick = () => {
    if (isFormDirty || isConfirmView) {
      setShowHomeConfirm(true);
    } else {
      router.push('/main');
    }
  };

  // 確認画面へ遷移
  const handleConfirm = () => {
    if (!symptoms.trim()) {
      alert('症状を入力してください');
      return;
    }

    if (isRegisteredAsset && !deviceInfo) {
      alert('機器情報を読み込んでください');
      return;
    }

    if (!applicantDepartment.trim() || !applicantName.trim()) {
      alert('申請部署と申請者を入力してください');
      return;
    }

    setIsConfirmView(true);
    window.scrollTo(0, 0);
  };

  // 申請送信
  const handleSubmit = async () => {
    setIsSubmitting(true);

    const requestData = {
      requestNo,
      requestDate,
      requestTime,
      applicantDepartment,
      applicantName,
      isRegisteredAsset,
      device: isRegisteredAsset ? deviceInfo : {
        itemName: manualItemName,
        maker: manualMaker,
        model: manualModel,
        serialNo: manualSerialNo,
        department: manualDepartment,
        roomName: manualRoomName,
        photos: capturedPhotos
      },
      photos: capturedPhotos,
      symptoms,
      alternativeDevice,
      freeComment,
      status: '依頼受付'
    };

    console.log('修理依頼データ:', requestData);

    await new Promise(resolve => setTimeout(resolve, 1000));

    setIsSubmitting(false);
    setCompletedRequestNo(requestNo);
    setShowCompleteModal(true);
  };

  // フォームリセット
  const resetForm = () => {
    setQrCode('');
    setDeviceInfo(null);
    setSymptoms('');
    setAlternativeDevice('not_needed');
    setFreeComment('');
    setManualItemName('');
    setManualMaker('');
    setManualModel('');
    setManualSerialNo('');
    setManualDepartment('');
    setManualRoomName('');
    setCapturedPhotos([]);
    setIsConfirmView(false);
  };

  // 確認画面で表示する機器情報のヘルパー
  const getDeviceName = () => isRegisteredAsset ? (deviceInfo?.itemName || '-') : (manualItemName || '-');
  const getDeviceMaker = () => isRegisteredAsset ? (deviceInfo?.maker || '-') : (manualMaker || '-');
  const getDeviceModel = () => isRegisteredAsset ? (deviceInfo?.model || '-') : (manualModel || '-');
  const getDeviceSerial = () => isRegisteredAsset ? (deviceInfo?.serialNo || '-') : (manualSerialNo || '-');
  const getDeviceDepartment = () => isRegisteredAsset ? (deviceInfo?.department || '-') : (manualDepartment || '-');
  const getDeviceRoom = () => isRegisteredAsset ? (deviceInfo?.roomName || '-') : (manualRoomName || '-');
  const alternativeLabel = alternativeDevice === 'needed' ? '必要' : alternativeDevice === 'requested' ? '依頼済' : '不要';

  // 共通の入力クラス
  const inputClass = 'w-full px-3 py-2.5 text-sm border border-stroke-input rounded-md outline-none focus:border-cta-primary focus:ring-1 focus:ring-cta-primary/20 transition-colors';

  return (
    <div className="min-h-dvh flex flex-col bg-surface-screen">
      {/* 共通ヘッダー */}
      <Header
        title={isConfirmView ? '修理依頼 - 内容確認' : '修理依頼'}
        showBackButton={true}
        backHref="/main"
        backLabel="メイン画面に戻る"
        hideMenu={true}
      />

      {/* メインコンテンツ */}
      <div className="flex-1 w-full max-w-[800px] mx-auto px-3 py-6 sm:px-6">
        {isConfirmView ? (
          /* ========== 確認画面 ========== */
          <>
            <div className="bg-surface-select border border-cta-primary rounded-lg p-3 mb-4 text-center">
              <span className="text-sm font-bold text-cta-primary-dark">
                以下の内容で送信します。内容をご確認ください。
              </span>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-stroke-card p-4 sm:p-6">
              {/* 依頼情報 */}
              <div className="pb-6 border-b border-stroke-card">
                <h2 className="text-sm font-bold text-content-primary mb-3">依頼情報</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <div className="text-xs text-content-sub mb-0.5">修理依頼No.</div>
                    <div className="text-sm font-semibold text-content-primary tabular-nums">{requestNo}</div>
                  </div>
                  <div>
                    <div className="text-xs text-content-sub mb-0.5">依頼日</div>
                    <div className="text-sm font-semibold text-content-primary">{requestDate} {requestTime}</div>
                  </div>
                  <div>
                    <div className="text-xs text-content-sub mb-0.5">申請部署</div>
                    <div className="text-sm font-semibold text-content-primary">{applicantDepartment}</div>
                  </div>
                  <div>
                    <div className="text-xs text-content-sub mb-0.5">申請者</div>
                    <div className="text-sm font-semibold text-content-primary">{applicantName}</div>
                  </div>
                </div>
              </div>

              {/* 機器情報 */}
              <div className="py-6 border-b border-stroke-card">
                <h2 className="text-sm font-bold text-content-primary mb-3">
                  機器情報
                  <span className="ml-2 text-xs font-normal text-content-sub">
                    ({isRegisteredAsset ? '登録済み資産' : '未登録資産'})
                  </span>
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {isRegisteredAsset && (
                    <div className="sm:col-span-2">
                      <div className="text-xs text-content-sub mb-0.5">QRラベル</div>
                      <div className="text-sm font-semibold text-content-primary">{qrCode}</div>
                    </div>
                  )}
                  <div>
                    <div className="text-xs text-content-sub mb-0.5">品目</div>
                    <div className="text-sm font-semibold text-content-primary">{getDeviceName()}</div>
                  </div>
                  <div>
                    <div className="text-xs text-content-sub mb-0.5">メーカー</div>
                    <div className="text-sm font-semibold text-content-primary">{getDeviceMaker()}</div>
                  </div>
                  <div>
                    <div className="text-xs text-content-sub mb-0.5">型式</div>
                    <div className="text-sm font-semibold text-content-primary">{getDeviceModel()}</div>
                  </div>
                  <div>
                    <div className="text-xs text-content-sub mb-0.5">シリアルNo.</div>
                    <div className="text-sm font-semibold text-content-primary">{getDeviceSerial()}</div>
                  </div>
                  <div>
                    <div className="text-xs text-content-sub mb-0.5">設置部署</div>
                    <div className="text-sm font-semibold text-content-primary">{getDeviceDepartment()}</div>
                  </div>
                  <div>
                    <div className="text-xs text-content-sub mb-0.5">室名</div>
                    <div className="text-sm font-semibold text-content-primary">{getDeviceRoom()}</div>
                  </div>
                </div>
                {capturedPhotos.length > 0 && (
                  <div className="mt-4">
                    <div className="text-xs text-content-sub mb-2">添付写真（{capturedPhotos.length}枚）</div>
                    <div className="flex gap-2 flex-wrap">
                      {capturedPhotos.map((photo, i) => (
                        <div key={i} className="w-20 h-20 rounded-lg overflow-hidden border border-stroke-card">
                          <img src={photo} alt={`写真${i + 1}`} className="w-full h-full object-cover" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* 症状・代替機 */}
              <div className="py-6 border-b border-stroke-card">
                <h2 className="text-sm font-bold text-content-primary mb-3">症状・代替機</h2>
                <div className="space-y-3">
                  <div>
                    <div className="text-xs text-content-sub mb-0.5">症状</div>
                    <div className="text-sm text-content-primary whitespace-pre-wrap">{symptoms}</div>
                  </div>
                  <div>
                    <div className="text-xs text-content-sub mb-0.5">代替機</div>
                    <div className="text-sm font-semibold text-content-primary">{alternativeLabel}</div>
                  </div>
                  {freeComment && (
                    <div>
                      <div className="text-xs text-content-sub mb-0.5">フリーコメント</div>
                      <div className="text-sm text-content-primary whitespace-pre-wrap">{freeComment}</div>
                    </div>
                  )}
                </div>
              </div>

              {/* 確認画面のボタン */}
              <div className="pt-6 flex justify-center gap-4">
                <button
                  onClick={() => setIsConfirmView(false)}
                  className="px-8 py-3 bg-surface-negative text-sm font-bold text-content-primary rounded-md border-0 cursor-pointer hover:bg-stroke-input transition-colors min-h-[48px]"
                >
                  修正する
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className={`px-8 py-3 text-sm font-bold text-white rounded-md border-0 transition-colors min-h-[48px] ${
                    isSubmitting
                      ? 'bg-surface-disabled cursor-not-allowed'
                      : 'bg-cta-primary cursor-pointer hover:bg-cta-primary-dark'
                  }`}
                >
                  {isSubmitting ? '送信中...' : '修理依頼を送信する'}
                </button>
              </div>
            </div>
          </>
        ) : (
          /* ========== 入力画面 ========== */
          <>
            <div className="bg-white rounded-lg shadow-sm border border-stroke-card p-4 sm:p-6">

              {/* ① 依頼情報 */}
              <div className="pb-6 border-b border-stroke-card">
                <h2 className="text-sm font-bold text-content-primary mb-3">依頼情報</h2>
                <div className={`grid gap-3 ${isMobile ? 'grid-cols-1' : 'grid-cols-3'}`}>
                  <div>
                    <label className="block text-xs text-content-sub mb-1">修理依頼No.</label>
                    <div className="px-3 py-2 bg-stroke-card rounded-md text-sm font-semibold text-content-primary tabular-nums">
                      {requestNo}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-content-sub mb-1">依頼日</label>
                    <div className="px-3 py-2 bg-stroke-card rounded-md text-sm font-semibold text-content-primary">
                      {requestDate}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-content-sub mb-1">依頼時間</label>
                    <div className="px-3 py-2 bg-stroke-card rounded-md text-sm font-semibold text-content-primary">
                      {requestTime}
                    </div>
                  </div>
                </div>
                <div className={`grid gap-3 mt-3 ${isMobile ? 'grid-cols-1' : 'grid-cols-2'}`}>
                  <div>
                    <label className="block text-xs text-content-sub mb-1">
                      申請部署 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={applicantDepartment}
                      onChange={(e) => setApplicantDepartment(e.target.value)}
                      placeholder="例: 外科病棟"
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-content-sub mb-1">
                      申請者 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={applicantName}
                      onChange={(e) => setApplicantName(e.target.value)}
                      placeholder="例: 山田太郎"
                      className={inputClass}
                    />
                  </div>
                </div>
              </div>

              {/* ② 機器情報 */}
              <div className="py-6 border-b border-stroke-card">
                <h2 className="text-sm font-bold text-content-primary mb-3">機器情報</h2>

                {/* 登録済み/未登録切り替え（ラジオボタン） */}
                <div className="flex flex-wrap gap-x-5 gap-y-2 mb-4">
                  <label className="flex items-center gap-2 cursor-pointer min-h-[44px]">
                    <input
                      type="radio"
                      name="asset-type"
                      checked={isRegisteredAsset}
                      onChange={() => setIsRegisteredAsset(true)}
                      className="size-4 accent-cta-primary cursor-pointer"
                    />
                    <span className={`text-sm ${isRegisteredAsset ? 'font-semibold text-content-primary' : 'text-content-primary'}`}>
                      登録済み資産
                    </span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer min-h-[44px]">
                    <input
                      type="radio"
                      name="asset-type"
                      checked={!isRegisteredAsset}
                      onChange={() => setIsRegisteredAsset(false)}
                      className="size-4 accent-cta-primary cursor-pointer"
                    />
                    <span className={`text-sm ${!isRegisteredAsset ? 'font-semibold text-content-primary' : 'text-content-primary'}`}>
                      未登録資産
                    </span>
                  </label>
                </div>

                {isRegisteredAsset ? (
                  <>
                    {/* QRコード読み取り */}
                    <div className="mb-4">
                      <label className="block text-xs text-content-sub mb-1">QRラベル</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={qrCode}
                          onChange={(e) => handleQrInput(e.target.value)}
                          placeholder="例: QR-001 / QR-002"
                          className={`flex-1 ${inputClass}`}
                        />
                        <button
                          onClick={handleQrScan}
                          disabled={isQrScanning}
                          className={`px-4 py-2.5 text-white text-sm font-medium border-0 rounded-md whitespace-nowrap transition-colors ${
                            isQrScanning
                              ? 'bg-surface-disabled cursor-not-allowed'
                              : 'bg-cta-primary cursor-pointer hover:bg-cta-primary-dark'
                          }`}
                        >
                          {isQrScanning ? '読取中...' : 'QR読取'}
                        </button>
                      </div>
                    </div>

                    {/* 読み取った機器情報 */}
                    {deviceInfo && (
                      <div className="bg-surface-select border border-cta-primary rounded-lg p-4">
                        <div className={`grid gap-4 ${isMobile ? 'grid-cols-1' : 'grid-cols-[120px_1fr]'}`}>
                          {/* 機器写真プレースホルダー */}
                          <div className={`${isMobile ? 'w-full h-[150px]' : 'w-[120px] h-[120px]'} bg-surface-negative rounded-lg flex items-center justify-center`}>
                            <svg className="w-10 h-10 text-content-sub" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                          </div>
                          {/* 機器詳細 */}
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <span className="text-[11px] text-content-sub">品目</span>
                              <div className="text-sm font-semibold text-content-primary">{deviceInfo.itemName}</div>
                            </div>
                            <div>
                              <span className="text-[11px] text-content-sub">メーカー</span>
                              <div className="text-sm font-semibold text-content-primary">{deviceInfo.maker}</div>
                            </div>
                            <div>
                              <span className="text-[11px] text-content-sub">型式</span>
                              <div className="text-sm font-semibold text-content-primary">{deviceInfo.model}</div>
                            </div>
                            <div>
                              <span className="text-[11px] text-content-sub">シリアルNo.</span>
                              <div className="text-sm font-semibold text-content-primary">{deviceInfo.serialNo}</div>
                            </div>
                            <div>
                              <span className="text-[11px] text-content-sub">設置部署</span>
                              <div className="text-sm font-semibold text-content-primary">{deviceInfo.department}</div>
                            </div>
                            <div>
                              <span className="text-[11px] text-content-sub">室名</span>
                              <div className="text-sm font-semibold text-content-primary">{deviceInfo.roomName}</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  /* 未登録資産の場合 */
                  <div className={`grid gap-3 ${isMobile ? 'grid-cols-1' : 'grid-cols-2'}`}>
                    <div>
                      <label className="block text-xs text-content-sub mb-1">品目</label>
                      <input type="text" value={manualItemName} onChange={(e) => setManualItemName(e.target.value)} placeholder="例: 人工呼吸器" className={inputClass} />
                    </div>
                    <div>
                      <label className="block text-xs text-content-sub mb-1">メーカー</label>
                      <input type="text" value={manualMaker} onChange={(e) => setManualMaker(e.target.value)} placeholder="例: フクダ電子" className={inputClass} />
                    </div>
                    <div>
                      <label className="block text-xs text-content-sub mb-1">型式</label>
                      <input type="text" value={manualModel} onChange={(e) => setManualModel(e.target.value)} placeholder="例: RES-500" className={inputClass} />
                    </div>
                    <div>
                      <label className="block text-xs text-content-sub mb-1">シリアルNo.</label>
                      <input type="text" value={manualSerialNo} onChange={(e) => setManualSerialNo(e.target.value)} placeholder="例: SN-2024-001" className={inputClass} />
                    </div>
                    <div>
                      <label className="block text-xs text-content-sub mb-1">設置部署</label>
                      <input type="text" value={manualDepartment} onChange={(e) => setManualDepartment(e.target.value)} placeholder="例: 外科病棟" className={inputClass} />
                    </div>
                    <div>
                      <label className="block text-xs text-content-sub mb-1">室名</label>
                      <input type="text" value={manualRoomName} onChange={(e) => setManualRoomName(e.target.value)} placeholder="例: 301号室" className={inputClass} />
                    </div>
                  </div>
                )}

                {/* 機器写真 */}
                <div className="mt-4">
                  <label className="block text-xs text-content-sub mb-2">機器写真</label>
                  <input
                    ref={photoInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handlePhotoAdd}
                    className="hidden"
                  />
                  {capturedPhotos.length > 0 && (
                    <div className="flex gap-2 flex-wrap mb-3">
                      {capturedPhotos.map((photo, i) => (
                        <div key={i} className="relative w-[100px] h-[100px] rounded-lg overflow-hidden border border-stroke-card">
                          <img src={photo} alt={`写真${i + 1}`} className="w-full h-full object-cover" />
                          <button
                            onClick={() => handlePhotoRemove(i)}
                            aria-label={`写真${i + 1}を削除`}
                            className="absolute top-1 right-1 size-6 bg-black/60 text-white border-0 rounded-full cursor-pointer text-sm leading-6 text-center p-0"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  <button
                    onClick={() => photoInputRef.current?.click()}
                    className="w-full py-4 bg-stroke-card border-2 border-dashed border-stroke-input rounded-lg cursor-pointer flex items-center justify-center gap-2 hover:border-cta-primary transition-colors"
                  >
                    <svg className="w-5 h-5 text-content-sub" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span className="text-sm text-content-sub">
                      {isMobile ? '写真を撮影・選択して添付' : '写真を選択して添付'}
                    </span>
                  </button>
                </div>
              </div>

              {/* ③ 症状 */}
              <div className="py-6 border-b border-stroke-card">
                <h2 className="text-sm font-bold text-content-primary mb-3">
                  症状 <span className="text-red-500">*</span>
                </h2>
                <textarea
                  value={symptoms}
                  onChange={(e) => setSymptoms(e.target.value)}
                  placeholder="機器の症状や不具合の詳細を入力してください"
                  rows={4}
                  className="w-full px-3 py-2.5 text-sm border border-stroke-input rounded-md outline-none focus:border-cta-primary focus:ring-1 focus:ring-cta-primary/20 transition-colors resize-y"
                />
              </div>

              {/* ④ 代替機（ラジオボタン） */}
              <div className="py-6 border-b border-stroke-card">
                <h2 className="text-sm font-bold text-content-primary mb-3">代替機</h2>
                <div className="flex flex-wrap gap-x-5 gap-y-2">
                  {[
                    { value: 'not_needed' as const, label: '不要' },
                    { value: 'needed' as const, label: '必要' },
                    { value: 'requested' as const, label: '依頼済' },
                  ].map((option) => (
                    <label key={option.value} className="flex items-center gap-2 cursor-pointer min-h-[44px]">
                      <input
                        type="radio"
                        name="alternative-device"
                        value={option.value}
                        checked={alternativeDevice === option.value}
                        onChange={() => setAlternativeDevice(option.value)}
                        className="size-4 accent-cta-primary cursor-pointer"
                      />
                      <span className={`text-sm ${alternativeDevice === option.value ? 'font-semibold text-content-primary' : 'text-content-primary'}`}>
                        {option.label}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* ⑤ フリーコメント */}
              <div className="py-6">
                <h2 className="text-sm font-bold text-content-primary mb-3">フリーコメント</h2>
                <textarea
                  value={freeComment}
                  onChange={(e) => setFreeComment(e.target.value)}
                  placeholder="その他連絡事項があれば入力してください"
                  rows={3}
                  className="w-full px-3 py-2.5 text-sm border border-stroke-input rounded-md outline-none focus:border-cta-primary focus:ring-1 focus:ring-cta-primary/20 transition-colors resize-y"
                />
              </div>
            </div>

            {/* 確認画面へボタン */}
            <div className="mt-4">
              <button
                onClick={handleConfirm}
                className="w-full py-3.5 bg-cta-primary text-white text-base font-bold border-0 rounded-md cursor-pointer hover:bg-cta-primary-dark transition-colors"
              >
                記載内容を確認する
              </button>
            </div>
          </>
        )}

        {/* 戻るボタン */}
        <div className="mt-4">
          <button
            onClick={handleHomeClick}
            className="px-8 py-2.5 bg-surface-negative text-sm font-medium text-content-primary rounded-md border-0 cursor-pointer hover:bg-stroke-input transition-colors"
          >
            戻る
          </button>
        </div>
      </div>

      {/* フッター */}
      <footer className="py-3 text-center text-xs text-content-sub">
        &copy;Copyright 2024 SHIP HEALTHCARE Research&amp;Consulting, INC. All rights reserved
      </footer>

      {/* 完了モーダル */}
      <ApplicationCompleteModal
        isOpen={showCompleteModal}
        applicationName="修理依頼"
        applicationNo={completedRequestNo}
        guidanceText="担当者より折り返しご連絡いたします。&#10;修理ステータス画面で進捗を確認できます。"
        returnDestination="メイン画面"
        onGoToMain={() => {
          resetForm();
          setShowCompleteModal(false);
          router.push('/main');
        }}
        onContinue={() => {
          resetForm();
          setShowCompleteModal(false);
        }}
      />

      {/* 閉じる確認モーダル */}
      <ApplicationCloseConfirmModal
        isOpen={showHomeConfirm}
        returnDestination="メイン画面"
        onCancel={() => setShowHomeConfirm(false)}
        onConfirm={() => {
          setShowHomeConfirm(false);
          router.push('/main');
        }}
      />
    </div>
  );
}

export default function RepairRequestPage() {
  return (
    <Suspense fallback={<div>読み込み中...</div>}>
      <RepairRequestContent />
    </Suspense>
  );
}
