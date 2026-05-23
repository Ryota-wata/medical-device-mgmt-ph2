'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { SearchableSelect } from '@/components/ui/SearchableSelect';
import { useMasterStore, useAuthStore } from '@/lib/stores';
import { usePurchaseApplicationStore } from '@/lib/stores/purchaseApplicationStore';
import { PurchaseApplication, CreatePurchaseApplicationInput, PurchaseApplicationAsset } from '@/lib/types/purchaseApplication';
import { ApplicationCompleteModal } from './ApplicationCompleteModal';
import { ApplicationCloseConfirmModal } from './ApplicationCloseConfirmModal';

// 要望機器
interface DesiredEquipment {
  item: string;
  maker: string;
  model: string;
  quantity: number;
  unit: string;
}

interface PurchaseApplicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (application: PurchaseApplication) => void;
  returnDestination?: string;
  returnHref?: string;
}

export function PurchaseApplicationModal({
  isOpen,
  onClose,
  onSuccess,
  returnDestination = '資産一覧',
  returnHref = '/asset-search-result',
}: PurchaseApplicationModalProps) {
  const router = useRouter();
  const { departments, facilities } = useMasterStore();
  const { user } = useAuthStore();
  const { addApplication } = usePurchaseApplicationStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 完了モーダル・閉じる確認モーダル
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);
  const [completedAppNo, setCompletedAppNo] = useState('');
  const [createdApplication, setCreatedApplication] = useState<PurchaseApplication | null>(null);

  // 申請基本情報
  const [managementDepartment] = useState(user?.department || '手術部');
  const [applicantName] = useState(user?.username || '手術 紺太郎');
  const [applicationDate] = useState(() => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  });
  const [installationDepartment, setInstallationDepartment] = useState('');
  const [installationSection, setInstallationSection] = useState('');
  const [installationRoomName, setInstallationRoomName] = useState('');
  const [priority, setPriority] = useState('1');
  const [desiredDeliveryYear, setDesiredDeliveryYear] = useState(() => String(new Date().getFullYear() + 1));
  const [desiredDeliveryMonth, setDesiredDeliveryMonth] = useState('3');
  const [basicItem, setBasicItem] = useState('');
  const [basicQuantity, setBasicQuantity] = useState('1');

  // 要望機器
  const [desiredEquipments, setDesiredEquipments] = useState<DesiredEquipment[]>([]);
  const [editingRowIndex, setEditingRowIndex] = useState<number | null>(null);

  // 使用用途及び件数
  const [usagePurpose, setUsagePurpose] = useState('');
  const [caseCount, setCaseCount] = useState('');
  const [caseCountUnit, setCaseCountUnit] = useState('件／月');

  // コメント
  const [comment, setComment] = useState('');

  // 添付ファイル
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);

  // システム接続要望
  const [requestConnectionStatus, setRequestConnectionStatus] = useState<'wired' | 'wireless' | 'not-required'>('not-required');
  const [requestConnectionDestination, setRequestConnectionDestination] = useState('');

  // 確認画面表示
  const [isConfirmView, setIsConfirmView] = useState(false);

  // 部門・部署オプション
  const divisionOptions = [...new Set(departments.map(d => d.division))];
  const departmentOptions = [...new Set(departments.map(d => d.department))];


  // 資産マスタからのメッセージを受信するハンドラー
  const handleAssetMessage = useCallback((event: MessageEvent) => {
    // 同一オリジンからのメッセージのみ処理
    if (event.origin !== window.location.origin) return;

    if (event.data?.type === 'ASSET_SELECTED' && event.data?.assets) {
      const receivedAssets = event.data.assets;
      if (receivedAssets.length > 0) {
        const asset = receivedAssets[0];
        const targetIndex = sessionStorage.getItem('editingEquipmentIndex');

        if (targetIndex !== null) {
          const index = parseInt(targetIndex, 10);
          setDesiredEquipments(prev => prev.map((e, i) =>
            i === index
              ? { ...e, item: asset.item || '', maker: asset.maker || '', model: asset.model || '' }
              : e
          ));
          sessionStorage.removeItem('editingEquipmentIndex');
          setEditingRowIndex(null);
        }
      }
    }
  }, []);

  // isOpenがtrueの時のみイベントリスナーを登録
  useEffect(() => {
    if (isOpen) {
      window.addEventListener('message', handleAssetMessage);
      return () => {
        window.removeEventListener('message', handleAssetMessage);
      };
    }
  }, [isOpen, handleAssetMessage]);

  if (!isOpen) return null;

  // 要望機器の追加（最大3つまで）
  const MAX_EQUIPMENT = 3;
  const handleAddEquipment = () => {
    if (desiredEquipments.length >= MAX_EQUIPMENT) return;
    setDesiredEquipments(prev => [...prev, { item: '', maker: '', model: '', quantity: 1, unit: '台' }]);
  };

  // 要望機器の削除
  const handleRemoveEquipment = (index: number) => {
    setDesiredEquipments(prev => prev.filter((_, i) => i !== index));
  };

  // 要望機器の順序入れ替え
  const handleMoveEquipment = (index: number, direction: 'up' | 'down') => {
    setDesiredEquipments(prev => {
      const newArr = [...prev];
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= newArr.length) return prev;
      [newArr[index], newArr[targetIndex]] = [newArr[targetIndex], newArr[index]];
      return newArr;
    });
  };

  // 希望順ラベル
  const getHopeLabel = (index: number): string => {
    const labels = ['第一希望', '第二希望', '第三希望'];
    return labels[index] || '';
  };

  // 要望機器の更新
  const handleUpdateEquipment = (index: number, field: keyof DesiredEquipment, value: string | number) => {
    setDesiredEquipments(prev => prev.map((e, i) => i === index ? { ...e, [field]: value } : e));
  };

  // 資産マスタを別ウィンドウで開く（行指定）
  const handleOpenAssetMaster = (index: number) => {
    sessionStorage.setItem('editingEquipmentIndex', String(index));
    setEditingRowIndex(index);

    const width = 1200;
    const height = 800;
    const left = (window.screen.width - width) / 2;
    const top = (window.screen.height - height) / 2;
    const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';

    window.open(
      `${basePath}/asset-master?mode=simple`,
      'AssetMasterWindow',
      `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes`
    );
  };

  // ファイル選択
  const handleFileSelect = (files: FileList | null) => {
    if (!files) return;
    setAttachedFiles(prev => [...prev, ...Array.from(files)]);
  };

  // ファイル削除
  const handleRemoveFile = (index: number) => {
    setAttachedFiles(prev => prev.filter((_, i) => i !== index));
  };

  // 確認画面へ遷移
  const handleConfirm = () => {
    // バリデーション
    if (!installationDepartment || !installationSection) {
      alert('設置部門・設置部署を入力してください');
      return;
    }

    setIsConfirmView(true);
  };

  // 入力画面に戻る
  const handleBackToEdit = () => {
    setIsConfirmView(false);
  };

  // 申請送信
  const handleSubmit = () => {
    const validEquipments = desiredEquipments.filter(e => e.item.trim() !== '');

    // 対象資産データを作成
    // 要望機器が登録されている場合はそれを使用、未登録の場合は基本品目情報から1件作成
    let assets: PurchaseApplicationAsset[];
    if (validEquipments.length > 0) {
      assets = validEquipments.map(equipment => ({
        name: equipment.item,
        maker: equipment.maker,
        model: equipment.model,
        quantity: equipment.quantity,
        unit: equipment.unit,
      }));
    } else {
      assets = [{
        name: basicItem.trim() || '（品目未指定）',
        maker: '',
        model: '',
        quantity: Number(basicQuantity) || 1,
        unit: '台',
      }];
    }

    // 申請データを作成（CreatePurchaseApplicationInput形式）
    const applicationInput: CreatePurchaseApplicationInput = {
      applicationType: '新規申請',
      applicantId: user?.id || 'user-unknown',
      applicantName: applicantName,
      applicantDepartment: managementDepartment,
      assets: assets,
      facility: facilities.length > 0 ? facilities[0].facilityName : '〇〇病院',
      building: '',
      floor: '',
      department: installationDepartment,
      section: installationSection,
      roomName: installationRoomName,
      desiredDeliveryDate: `${desiredDeliveryYear}-${String(desiredDeliveryMonth).padStart(2, '0')}-01`,
      applicationReason: '', // 個別フィールドに分割
      attachedFiles: attachedFiles.map(f => f.name),
      priority: priority,
      usagePurpose: usagePurpose,
      caseCount: caseCount ? `${caseCount} ${caseCountUnit}` : '',
      comment: comment,
      requestConnectionStatus: requestConnectionStatus === 'wired' ? '有線接続' : requestConnectionStatus === 'wireless' ? '無線接続' : '接続不要',
      requestConnectionDestination: requestConnectionDestination,
    };

    // 購入申請ストアに追加（購入管理画面の申請受付に反映される）
    const result = addApplication(applicationInput);

    setCompletedAppNo(result.applicationNo);
    setCreatedApplication(result);
    setShowCompleteModal(true);
  };

  // フォームリセット
  const resetForm = () => {
    setInstallationDepartment('');
    setInstallationSection('');
    setInstallationRoomName('');
    setPriority('1');
    setDesiredDeliveryYear(String(new Date().getFullYear() + 1));
    setDesiredDeliveryMonth('3');
    setBasicItem('');
    setBasicQuantity('1');
    setDesiredEquipments([]);
    setUsagePurpose('');
    setCaseCount('');
    setCaseCountUnit('件／月');
    setComment('');
    setAttachedFiles([]);
    setRequestConnectionStatus('not-required');
    setRequestConnectionDestination('');
    setIsConfirmView(false);
  };

  const styles: Record<string, React.CSSProperties> = {
    overlay: {
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
    },
    modal: {
      background: 'white',
      borderRadius: '8px',
      width: '95%',
      maxWidth: '900px',
      maxHeight: '90vh',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
    },
    header: {
      background: 'white',
      color: '#4A4A4A',
      padding: '16px 24px',
      fontSize: '18px',
      fontWeight: 600,
      borderBottom: '1px solid #E1E1E1',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    closeButton: {
      background: 'none',
      border: 'none',
      color: '#4A4A4A',
      fontSize: '20px',
      cursor: 'pointer',
      padding: '0',
      width: '30px',
      height: '30px',
      lineHeight: 1,
    },
    body: {
      flex: 1,
      overflowY: 'auto',
      padding: '24px',
    },
    section: {
      marginBottom: '24px',
    },
    sectionTitle: {
      fontSize: '14px',
      fontWeight: 600,
      color: '#4A4A4A',
      marginBottom: '16px',
      paddingBottom: '8px',
      borderBottom: '1px solid #E1E1E1',
    },
    note: {
      fontSize: '12px',
      color: '#8A8A8A',
      textAlign: 'right' as const,
      marginBottom: '12px',
    },
    formGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(4, 1fr)',
      gap: '16px',
      alignItems: 'end',
    },
    formItem: {
      display: 'flex',
      flexDirection: 'column' as const,
      gap: '6px',
    },
    label: {
      fontSize: '13px',
      fontWeight: 600,
      color: '#4A4A4A',
    },
    input: {
      padding: '8px 12px',
      border: '1px solid #E1E1E1',
      borderRadius: '4px',
      fontSize: '14px',
      boxSizing: 'border-box' as const,
    },
    inputDisabled: {
      padding: '8px 12px',
      border: '1px solid #E1E1E1',
      borderRadius: '4px',
      fontSize: '14px',
      background: '#FAFAFA',
      color: '#8A8A8A',
    },
    select: {
      padding: '8px 12px',
      border: '1px solid #E1E1E1',
      borderRadius: '4px',
      fontSize: '14px',
      cursor: 'pointer',
    },
    radioGroup: {
      display: 'flex',
      gap: '16px',
      alignItems: 'center',
    },
    radioLabel: {
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      cursor: 'pointer',
      fontSize: '14px',
    },
    textarea: {
      width: '100%',
      minHeight: '100px',
      padding: '12px',
      border: '1px solid #E1E1E1',
      borderRadius: '4px',
      fontSize: '14px',
      resize: 'vertical' as const,
      boxSizing: 'border-box' as const,
    },
    fileUploadSection: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      marginBottom: '8px',
    },
    attachButton: {
      padding: '8px 16px',
      background: '#F1F1F1',
      color: '#4A4A4A',
      border: 'none',
      borderRadius: '4px',
      cursor: 'pointer',
      fontSize: '13px',
      fontWeight: 600,
    },
    fileSelectButton: {
      padding: '8px 16px',
      background: 'white',
      color: '#4A4A4A',
      border: '1px solid #E1E1E1',
      borderRadius: '4px',
      cursor: 'pointer',
      fontSize: '13px',
    },
    fileHint: {
      fontSize: '12px',
      color: '#DA0000',
      marginTop: '8px',
    },
    footer: {
      padding: '16px 24px',
      borderTop: '1px solid #E1E1E1',
      display: 'flex',
      justifyContent: 'center',
      background: '#FAFAFA',
    },
    confirmButton: {
      padding: '12px 48px',
      background: 'white',
      color: '#146E2E',
      border: '1px solid #146E2E',
      borderRadius: '6px',
      cursor: 'pointer',
      fontSize: '15px',
      fontWeight: 600,
    },
  };

  return (
    <div style={styles.overlay}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* ヘッダー */}
        <div style={styles.header}>
          <span>{isConfirmView ? '新規購入申請 - 内容確認' : '新規購入申請'}</span>
          <button style={styles.closeButton} onClick={() => setShowCloseConfirm(true)} aria-label="閉じる">×</button>
        </div>

        {/* ボディ */}
        <div style={styles.body}>
        {isConfirmView ? (
          /* 確認画面 */
          <div>
            <div style={{ color: '#DA0000', fontSize: '13px', fontWeight: 500, marginBottom: '16px' }}>
              ※以下の項目に間違いがないかご確認ください
            </div>

            {/* 申請基本情報 */}
            <div style={styles.section}>
              <div style={styles.sectionTitle}>申請基本情報</div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <tbody>
                  <tr>
                    <th style={{ padding: '8px 12px', background: '#FAFAFA', border: '1px solid #E1E1E1', textAlign: 'left', width: '150px' }}>管理部署</th>
                    <td style={{ padding: '8px 12px', border: '1px solid #E1E1E1' }}>{managementDepartment}</td>
                    <th style={{ padding: '8px 12px', background: '#FAFAFA', border: '1px solid #E1E1E1', textAlign: 'left', width: '150px' }}>申請者</th>
                    <td style={{ padding: '8px 12px', border: '1px solid #E1E1E1' }}>{applicantName}</td>
                  </tr>
                  <tr>
                    <th style={{ padding: '8px 12px', background: '#FAFAFA', border: '1px solid #E1E1E1', textAlign: 'left' }}>申請日</th>
                    <td style={{ padding: '8px 12px', border: '1px solid #E1E1E1' }}>{applicationDate}</td>
                    <th style={{ padding: '8px 12px', background: '#FAFAFA', border: '1px solid #E1E1E1', textAlign: 'left' }}>優先順位</th>
                    <td style={{ padding: '8px 12px', border: '1px solid #E1E1E1' }}>{priority}</td>
                  </tr>
                  <tr>
                    <th style={{ padding: '8px 12px', background: '#FAFAFA', border: '1px solid #E1E1E1', textAlign: 'left' }}>設置部門</th>
                    <td style={{ padding: '8px 12px', border: '1px solid #E1E1E1' }}>{installationDepartment || '-'}</td>
                    <th style={{ padding: '8px 12px', background: '#FAFAFA', border: '1px solid #E1E1E1', textAlign: 'left' }}>設置部署</th>
                    <td style={{ padding: '8px 12px', border: '1px solid #E1E1E1' }}>{installationSection || '-'}</td>
                  </tr>
                  <tr>
                    <th style={{ padding: '8px 12px', background: '#FAFAFA', border: '1px solid #E1E1E1', textAlign: 'left' }}>設置室名</th>
                    <td style={{ padding: '8px 12px', border: '1px solid #E1E1E1' }}>{installationRoomName || '-'}</td>
                    <th style={{ padding: '8px 12px', background: '#FAFAFA', border: '1px solid #E1E1E1', textAlign: 'left' }}>希望納期</th>
                    <td style={{ padding: '8px 12px', border: '1px solid #E1E1E1' }}>{desiredDeliveryYear}年{desiredDeliveryMonth}月</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* 申請品目 */}
            <div style={styles.section}>
              <div style={styles.sectionTitle}>申請品目</div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <tbody>
                  <tr>
                    <th style={{ padding: '8px 12px', background: '#FAFAFA', border: '1px solid #E1E1E1', textAlign: 'left', width: '150px' }}>品目名</th>
                    <td style={{ padding: '8px 12px', border: '1px solid #E1E1E1' }}>{basicItem || '-'}</td>
                    <th style={{ padding: '8px 12px', background: '#FAFAFA', border: '1px solid #E1E1E1', textAlign: 'left', width: '150px' }}>台数</th>
                    <td style={{ padding: '8px 12px', border: '1px solid #E1E1E1', fontVariantNumeric: 'tabular-nums' }}>{basicQuantity}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* 要望機器 */}
            <div style={styles.section}>
              <div style={styles.sectionTitle}>要望機器</div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ background: '#FAFAFA' }}>
                    <th style={{ padding: '8px', border: '1px solid #E1E1E1', textAlign: 'center', width: '80px' }}>希望順</th>
                    <th style={{ padding: '8px', border: '1px solid #E1E1E1', textAlign: 'left' }}>品目</th>
                    <th style={{ padding: '8px', border: '1px solid #E1E1E1', textAlign: 'left' }}>メーカー</th>
                    <th style={{ padding: '8px', border: '1px solid #E1E1E1', textAlign: 'left' }}>型式</th>
                  </tr>
                </thead>
                <tbody>
                  {desiredEquipments.filter(e => e.item.trim() !== '').map((equipment, index) => (
                    <tr key={index}>
                      <td style={{ padding: '8px', border: '1px solid #E1E1E1', textAlign: 'center', fontWeight: 600, color: '#008C1D' }}>{getHopeLabel(index)}</td>
                      <td style={{ padding: '8px', border: '1px solid #E1E1E1' }}>{equipment.item}</td>
                      <td style={{ padding: '8px', border: '1px solid #E1E1E1' }}>{equipment.maker || '-'}</td>
                      <td style={{ padding: '8px', border: '1px solid #E1E1E1' }}>{equipment.model || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* 使用用途及び件数 */}
            <div style={styles.section}>
              <div style={styles.sectionTitle}>使用用途及び件数</div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <tbody>
                  <tr>
                    <th style={{ padding: '8px 12px', background: '#FAFAFA', border: '1px solid #E1E1E1', textAlign: 'left', width: '150px' }}>用途</th>
                    <td style={{ padding: '8px 12px', border: '1px solid #E1E1E1' }}>{usagePurpose || '-'}</td>
                    <th style={{ padding: '8px 12px', background: '#FAFAFA', border: '1px solid #E1E1E1', textAlign: 'left', width: '150px' }}>件数</th>
                    <td style={{ padding: '8px 12px', border: '1px solid #E1E1E1' }}>{caseCount ? `${caseCount} ${caseCountUnit}` : '-'}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* コメント */}
            {comment && (
              <div style={styles.section}>
                <div style={styles.sectionTitle}>コメント（必要理由 他）</div>
                <div style={{ padding: '12px', background: '#FAFAFA', borderRadius: '4px', border: '1px solid #E1E1E1', whiteSpace: 'pre-wrap' }}>
                  {comment}
                </div>
              </div>
            )}

            {/* 添付ファイル */}
            {attachedFiles.length > 0 && (
              <div style={styles.section}>
                <div style={styles.sectionTitle}>添付ファイル</div>
                <ul style={{ margin: 0, paddingLeft: '20px' }}>
                  {attachedFiles.map((file, index) => (
                    <li key={index} style={{ padding: '4px 0' }}>{file.name}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* システム接続要望 */}
            <div style={styles.section}>
              <div style={styles.sectionTitle}>システム接続要望</div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <tbody>
                  <tr>
                    <th style={{ padding: '8px 12px', background: '#FAFAFA', border: '1px solid #E1E1E1', textAlign: 'left', width: '150px' }}>接続要望</th>
                    <td style={{ padding: '8px 12px', border: '1px solid #E1E1E1' }}>{requestConnectionStatus === 'wired' ? '有線接続' : requestConnectionStatus === 'wireless' ? '無線接続' : '接続不要'}</td>
                    <th style={{ padding: '8px 12px', background: '#FAFAFA', border: '1px solid #E1E1E1', textAlign: 'left', width: '150px' }}>接続先</th>
                    <td style={{ padding: '8px 12px', border: '1px solid #E1E1E1' }}>{requestConnectionDestination || '-'}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          /* 入力画面 */
          <>
          {/* 申請基本情報 */}
          <div style={styles.section}>
            <div style={styles.sectionTitle}>申請基本情報</div>
            <div style={styles.formGrid}>
              <div style={styles.formItem}>
                <label style={styles.label}>所属部署</label>
                <input style={styles.inputDisabled} value={managementDepartment} disabled />
              </div>
              <div style={styles.formItem}>
                <label style={styles.label}>申請者</label>
                <input style={styles.inputDisabled} value={applicantName} disabled />
              </div>
              <div style={styles.formItem}>
                <label style={styles.label}>申請日</label>
                <input style={styles.inputDisabled} value={applicationDate} disabled />
              </div>
              <div></div>
              <div style={styles.formItem}>
                <label style={styles.label}>設置部門</label>
                <SearchableSelect
                  value={installationDepartment}
                  onChange={setInstallationDepartment}
                  options={divisionOptions}
                  placeholder="選択してください"
                />
              </div>
              <div style={styles.formItem}>
                <label style={styles.label}>設置部署</label>
                <SearchableSelect
                  value={installationSection}
                  onChange={setInstallationSection}
                  options={departmentOptions}
                  placeholder="選択してください"
                />
              </div>
              <div style={styles.formItem}>
                <label style={styles.label}>設置室名</label>
                <input
                  style={styles.input}
                  value={installationRoomName}
                  onChange={(e) => setInstallationRoomName(e.target.value)}
                  placeholder="手術室B"
                />
              </div>
              <div style={styles.formItem}>
                <label style={styles.label}>優先順位</label>
                <select style={styles.select} value={priority} onChange={(e) => setPriority(e.target.value)}>
                  {[1, 2, 3, 4, 5].map(n => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
              </div>
              <div style={styles.formItem}>
                <label style={styles.label}>希望納期</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <select
                    style={{ ...styles.select, width: '90px' }}
                    value={desiredDeliveryYear}
                    onChange={(e) => setDesiredDeliveryYear(e.target.value)}
                  >
                    {[2025, 2026, 2027, 2028, 2029, 2030].map(y => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                  <span>年</span>
                  <select
                    style={{ ...styles.select, width: '70px' }}
                    value={desiredDeliveryMonth}
                    onChange={(e) => setDesiredDeliveryMonth(e.target.value)}
                  >
                    {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                  <span>月</span>
                </div>
              </div>
            </div>
          </div>

          {/* 申請品目 */}
          <div style={styles.section}>
            <div style={styles.sectionTitle}>申請品目</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px', gap: '16px', alignItems: 'end' }}>
              <div style={styles.formItem}>
                <label style={styles.label}>品目名</label>
                <input
                  type="text"
                  style={styles.input}
                  value={basicItem}
                  onChange={(e) => setBasicItem(e.target.value)}
                  placeholder="申請する品目名を入力してください"
                />
              </div>
              <div style={styles.formItem}>
                <label style={styles.label}>台数</label>
                <input
                  type="number"
                  style={styles.input}
                  value={basicQuantity}
                  onChange={(e) => setBasicQuantity(e.target.value)}
                  min={1}
                  placeholder="1"
                />
              </div>
            </div>
          </div>

          {/* 要望機器 */}
          <div style={styles.section}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <div style={styles.sectionTitle}>要望機器（最大3つ）</div>
              <button
                onClick={handleAddEquipment}
                disabled={desiredEquipments.length >= MAX_EQUIPMENT}
                style={{
                  padding: '6px 16px',
                  background: desiredEquipments.length >= MAX_EQUIPMENT ? '#E1E1E1' : '#008C1D',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: desiredEquipments.length >= MAX_EQUIPMENT ? 'not-allowed' : 'pointer',
                  fontSize: '12px',
                }}
              >
                + 要望機器を追加 ({desiredEquipments.length}/{MAX_EQUIPMENT})
              </button>
            </div>

            <div style={{ border: '1px solid #E1E1E1', borderRadius: '4px', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                <thead>
                  <tr style={{ background: '#FAFAFA' }}>
                    <th style={{ padding: '8px', border: '1px solid #E1E1E1', textAlign: 'center', fontWeight: 600, width: '80px' }}>希望順</th>
                    <th style={{ padding: '8px', border: '1px solid #E1E1E1', textAlign: 'center', fontWeight: 600, width: '50px' }}>順序</th>
                    <th style={{ padding: '8px', border: '1px solid #E1E1E1', textAlign: 'left', fontWeight: 600 }}>品目</th>
                    <th style={{ padding: '8px', border: '1px solid #E1E1E1', textAlign: 'left', fontWeight: 600 }}>メーカー</th>
                    <th style={{ padding: '8px', border: '1px solid #E1E1E1', textAlign: 'left', fontWeight: 600 }}>型式</th>
                    <th style={{ padding: '8px', border: '1px solid #E1E1E1', textAlign: 'center', fontWeight: 600, width: '120px' }}>選択</th>
                    <th style={{ padding: '8px', border: '1px solid #E1E1E1', textAlign: 'center', fontWeight: 600, width: '50px' }}>削除</th>
                  </tr>
                </thead>
                <tbody>
                  {desiredEquipments.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ padding: '24px', textAlign: 'center', color: '#8A8A8A', border: '1px solid #E1E1E1' }}>
                        「+ 資産を追加」ボタンで要望機器を追加してください
                      </td>
                    </tr>
                  ) : (
                    desiredEquipments.map((equipment, index) => (
                      <tr key={index} style={{ background: index % 2 === 0 ? 'white' : '#FAFAFA' }}>
                        <td style={{ padding: '8px', border: '1px solid #E1E1E1', textAlign: 'center', fontWeight: 600, color: '#008C1D' }}>
                          {getHopeLabel(index)}
                        </td>
                        <td style={{ padding: '4px', border: '1px solid #E1E1E1', textAlign: 'center' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                            <button
                              onClick={() => handleMoveEquipment(index, 'up')}
                              disabled={index === 0}
                              style={{
                                padding: '2px 6px',
                                background: index === 0 ? '#E1E1E1' : '#8A8A8A',
                                color: 'white',
                                border: 'none',
                                borderRadius: '2px',
                                cursor: index === 0 ? 'not-allowed' : 'pointer',
                                fontSize: '10px',
                              }}
                              aria-label="上に移動"
                            >
                              ▲
                            </button>
                            <button
                              onClick={() => handleMoveEquipment(index, 'down')}
                              disabled={index === desiredEquipments.length - 1}
                              style={{
                                padding: '2px 6px',
                                background: index === desiredEquipments.length - 1 ? '#E1E1E1' : '#8A8A8A',
                                color: 'white',
                                border: 'none',
                                borderRadius: '2px',
                                cursor: index === desiredEquipments.length - 1 ? 'not-allowed' : 'pointer',
                                fontSize: '10px',
                              }}
                              aria-label="下に移動"
                            >
                              ▼
                            </button>
                          </div>
                        </td>
                        <td style={{ padding: '4px', border: '1px solid #E1E1E1' }}>
                          <input
                            type="text"
                            value={equipment.item}
                            onChange={(e) => handleUpdateEquipment(index, 'item', e.target.value)}
                            placeholder="品目"
                            style={{
                              width: '100%',
                              padding: '4px 6px',
                              border: '1px solid #E1E1E1',
                              borderRadius: '4px',
                              fontSize: '12px',
                              boxSizing: 'border-box',
                            }}
                          />
                        </td>
                        <td style={{ padding: '4px', border: '1px solid #E1E1E1' }}>
                          <input
                            type="text"
                            value={equipment.maker}
                            onChange={(e) => handleUpdateEquipment(index, 'maker', e.target.value)}
                            placeholder="メーカー"
                            style={{
                              width: '100%',
                              padding: '4px 6px',
                              border: '1px solid #E1E1E1',
                              borderRadius: '4px',
                              fontSize: '12px',
                              boxSizing: 'border-box',
                            }}
                          />
                        </td>
                        <td style={{ padding: '4px', border: '1px solid #E1E1E1' }}>
                          <input
                            type="text"
                            value={equipment.model}
                            onChange={(e) => handleUpdateEquipment(index, 'model', e.target.value)}
                            placeholder="型式"
                            style={{
                              width: '100%',
                              padding: '4px 6px',
                              border: '1px solid #E1E1E1',
                              borderRadius: '4px',
                              fontSize: '12px',
                              boxSizing: 'border-box',
                            }}
                          />
                        </td>
                        <td style={{ padding: '4px', border: '1px solid #E1E1E1', textAlign: 'center' }}>
                          <button
                            onClick={() => handleOpenAssetMaster(index)}
                            style={{
                              padding: '4px 8px',
                              background: '#008C1D',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: '11px',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            資産マスタから選択
                          </button>
                        </td>
                        <td style={{ padding: '4px', border: '1px solid #E1E1E1', textAlign: 'center' }}>
                          <button
                            onClick={() => handleRemoveEquipment(index)}
                            style={{
                              padding: '4px 8px',
                              background: '#DA0000',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: '11px',
                            }}
                            aria-label={`${equipment.item || '機器'}を削除`}
                          >
                            削除
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* 使用用途及び件数 */}
          <div style={styles.section}>
            <div style={styles.sectionTitle}>使用用途及び件数</div>
            <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-end' }}>
              <div style={{ flex: 1 }}>
                <input
                  style={{ ...styles.input, width: '100%' }}
                  value={usagePurpose}
                  onChange={(e) => setUsagePurpose(e.target.value)}
                  placeholder="使用用途を入力"
                />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <label style={styles.label}>件数</label>
                <input
                  type="number"
                  style={{ ...styles.input, width: '80px' }}
                  value={caseCount}
                  onChange={(e) => setCaseCount(e.target.value)}
                />
                <select
                  style={styles.select}
                  value={caseCountUnit}
                  onChange={(e) => setCaseCountUnit(e.target.value)}
                >
                  <option value="件／月">件／月</option>
                  <option value="件／週">件／週</option>
                  <option value="件／年">件／年</option>
                </select>
              </div>
            </div>
          </div>

          {/* コメント */}
          <div style={styles.section}>
            <div style={styles.sectionTitle}>コメント（必要理由 他）</div>
            <textarea
              style={styles.textarea}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="申請理由やコメントを入力してください"
            />
          </div>

          {/* 添付ファイル */}
          <div style={styles.section}>
            <div style={styles.fileUploadSection}>
              <button style={styles.attachButton}>添付ファイル</button>
              <button
                style={styles.fileSelectButton}
                onClick={() => fileInputRef.current?.click()}
              >
                ファイルの選択
              </button>
              <span style={{ fontSize: '13px', color: '#8A8A8A' }}>
                {attachedFiles.length === 0 ? 'ファイルが選択されていません' : `${attachedFiles.length}件選択中`}
              </span>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                style={{ display: 'none' }}
                onChange={(e) => handleFileSelect(e.target.files)}
              />
            </div>
            {attachedFiles.length > 0 && (
              <div style={{ marginTop: '8px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {attachedFiles.map((file, index) => (
                  <span
                    key={index}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '4px 10px',
                      background: '#EBF5EE',
                      borderRadius: '4px',
                      fontSize: '12px',
                    }}
                  >
                    {file.name}
                    <button
                      onClick={() => handleRemoveFile(index)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#DA0000' }}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
            <div style={styles.fileHint}>
              要望機種の見積書・修理不能証明など手持ちの書類を添付してください
            </div>
          </div>

          {/* システム接続要望 */}
          <div style={styles.section}>
            <div style={styles.sectionTitle}>システム接続要望</div>
            <div style={{ display: 'grid', gap: '16px' }}>
              <div>
                <label style={styles.label}>接続要望</label>
                <div style={{ ...styles.radioGroup, marginTop: '8px' }}>
                  <label style={styles.radioLabel}>
                    <input
                      type="radio"
                      checked={requestConnectionStatus === 'wired'}
                      onChange={() => setRequestConnectionStatus('wired')}
                    />
                    有線接続
                  </label>
                  <label style={styles.radioLabel}>
                    <input
                      type="radio"
                      checked={requestConnectionStatus === 'wireless'}
                      onChange={() => setRequestConnectionStatus('wireless')}
                    />
                    無線接続
                  </label>
                  <label style={styles.radioLabel}>
                    <input
                      type="radio"
                      checked={requestConnectionStatus === 'not-required'}
                      onChange={() => setRequestConnectionStatus('not-required')}
                    />
                    接続不要
                  </label>
                </div>
              </div>
              <div>
                <label style={styles.label}>接続先</label>
                <input
                  style={{ ...styles.input, width: '100%', marginTop: '6px' }}
                  value={requestConnectionDestination}
                  onChange={(e) => setRequestConnectionDestination(e.target.value)}
                  placeholder="接続先を入力してください"
                />
              </div>
            </div>
          </div>

          </>
        )}
        </div>

        {/* フッター */}
        <div style={styles.footer}>
          {isConfirmView ? (
            <>
              <button
                onClick={handleBackToEdit}
                style={{
                  padding: '12px 32px',
                  background: 'white',
                  color: '#4A4A4A',
                  border: '1px solid #E1E1E1',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 500,
                  marginRight: '16px',
                }}
              >
                戻る
              </button>
              <button
                onClick={handleSubmit}
                style={{
                  padding: '12px 32px',
                  background: '#008C1D',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 600,
                }}
              >
                申請する
              </button>
            </>
          ) : (
            <button style={styles.confirmButton} onClick={handleConfirm}>
              記載内容を確認する
            </button>
          )}
        </div>
      </div>

      {/* 完了モーダル */}
      <ApplicationCompleteModal
        isOpen={showCompleteModal}
        applicationName="購入申請"
        applicationNo={completedAppNo}
        guidanceText=""
        returnDestination={returnDestination}
        onGoToMain={() => {
          if (createdApplication && onSuccess) {
            onSuccess(createdApplication);
          }
          resetForm();
          setCreatedApplication(null);
          setShowCompleteModal(false);
          onClose();
          router.push(returnHref);
        }}
        onContinue={() => {
          if (createdApplication && onSuccess) {
            onSuccess(createdApplication);
          }
          resetForm();
          setCreatedApplication(null);
          setShowCompleteModal(false);
        }}
      />

      {/* 閉じる確認モーダル */}
      <ApplicationCloseConfirmModal
        isOpen={showCloseConfirm}
        returnDestination={returnDestination}
        onCancel={() => setShowCloseConfirm(false)}
        onConfirm={() => {
          setShowCloseConfirm(false);
          onClose();
        }}
      />
    </div>
  );
}
