'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { SearchableSelect } from '@/components/ui/SearchableSelect';
import { useMasterStore, useAuthStore } from '@/lib/stores';
import { usePurchaseApplicationStore } from '@/lib/stores/purchaseApplicationStore';
import { Asset } from '@/lib/types';
import { PurchaseApplication, CreatePurchaseApplicationInput, PurchaseApplicationAsset } from '@/lib/types/purchaseApplication';
import { ApplicationCompleteModal } from './ApplicationCompleteModal';
import { ApplicationCloseConfirmModal } from './ApplicationCloseConfirmModal';

interface AdditionApplicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  assets: Asset[];  // 増設参考として選択された資産（1件のみ）
  onSuccess?: (application: PurchaseApplication) => void;
  returnDestination?: string;
  returnHref?: string;
}

export function AdditionApplicationModal({
  isOpen,
  onClose,
  assets,
  onSuccess,
  returnDestination = '資産一覧',
  returnHref = '/asset-search-result',
}: AdditionApplicationModalProps) {
  const router = useRouter();
  const { departments, facilities } = useMasterStore();
  const { user } = useAuthStore();
  const { addApplication: addPurchaseApplication } = usePurchaseApplicationStore();
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

  // 増設数量
  const [additionQuantity, setAdditionQuantity] = useState(1);

  // 使用用途及び件数
  const [usagePurpose, setUsagePurpose] = useState('');
  const [caseCount, setCaseCount] = useState('');
  const [caseCountUnit, setCaseCountUnit] = useState('件／月');

  // コメント
  const [comment, setComment] = useState('');

  // 添付ファイル
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);

  // システム接続要望
  const [currentConnectionStatus, setCurrentConnectionStatus] = useState<'wired' | 'wireless' | 'not-required'>('not-required');
  const [currentConnectionDestination, setCurrentConnectionDestination] = useState('');
  const [requestConnectionStatus, setRequestConnectionStatus] = useState<'wired' | 'wireless' | 'not-required'>('not-required');
  const [requestConnectionDestination, setRequestConnectionDestination] = useState('');

  // 確認画面表示
  const [isConfirmView, setIsConfirmView] = useState(false);

  // 部門・部署オプション
  const divisionOptions = [...new Set(departments.map(d => d.division))];
  const departmentOptions = [...new Set(departments.map(d => d.department))];

  // 選択された資産から初期値を設定
  useEffect(() => {
    if (assets.length > 0 && isOpen) {
      const primaryAsset = assets[0];
      setInstallationDepartment(primaryAsset.department || '');
      setInstallationSection(primaryAsset.section || '');
      setInstallationRoomName(primaryAsset.roomName || '');
    }
  }, [assets, isOpen]);

  if (!isOpen || assets.length === 0) return null;

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

    if (additionQuantity < 1) {
      alert('増設数量は1以上を入力してください');
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
    const primaryAsset = assets[0];

    // 購入申請を作成（参考機器の情報を使用）
    const purchaseAssets: PurchaseApplicationAsset[] = [{
      name: primaryAsset.item || primaryAsset.name || '',
      maker: primaryAsset.maker || '',
      model: primaryAsset.model || '',
      quantity: additionQuantity,
      unit: '台',
    }];

    const purchaseInput: CreatePurchaseApplicationInput = {
      applicationType: '増設申請',
      applicantId: user?.id || 'user-unknown',
      applicantName: applicantName,
      applicantDepartment: managementDepartment,
      assets: purchaseAssets,
      facility: facilities.length > 0 ? facilities[0].facilityName : '〇〇病院',
      building: '',
      floor: '',
      department: installationDepartment,
      section: installationSection,
      roomName: installationRoomName,
      desiredDeliveryDate: `${desiredDeliveryYear}-${String(desiredDeliveryMonth).padStart(2, '0')}-01`,
      applicationReason: `${usagePurpose}${caseCount ? ` (症例数: ${caseCount}${caseCountUnit})` : ''}${comment ? `\n${comment}` : ''}\n\n【増設参考機器】\n- ${primaryAsset.name} (${primaryAsset.model})`,
      attachedFiles: attachedFiles.map(f => f.name),
    };

    const result = addPurchaseApplication(purchaseInput);

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
    setAdditionQuantity(1);
    setUsagePurpose('');
    setCaseCount('');
    setCaseCountUnit('件／月');
    setComment('');
    setAttachedFiles([]);
    setCurrentConnectionStatus('not-required');
    setCurrentConnectionDestination('');
    setRequestConnectionStatus('not-required');
    setRequestConnectionDestination('');
    setIsConfirmView(false);
  };

  // テーマカラー（増設申請用：青系）
  const themeColor = '#4A4A4A';
  const themeLightBg = '#EBF5EE';
  const themeBorder = '#087CB6';

  const tableTh: React.CSSProperties = {
    padding: '8px 12px', background: '#FAFAFA', border: '1px solid #E1E1E1',
    textAlign: 'left', width: '100px', fontSize: '13px', fontWeight: 600, color: '#4A4A4A',
    whiteSpace: 'nowrap',
  };
  const tableTd: React.CSSProperties = {
    padding: '8px 12px', border: '1px solid #E1E1E1', fontSize: '13px',
    background: 'white',
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
          <span>{isConfirmView ? '増設購入申請 - 内容確認' : '増設購入申請'}</span>
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
                  <tr>
                    <th style={{ padding: '8px 12px', background: '#FAFAFA', border: '1px solid #E1E1E1', textAlign: 'left' }}>品目</th>
                    <td style={{ padding: '8px 12px', border: '1px solid #E1E1E1' }}>{assets[0]?.item || assets[0]?.name || '-'}</td>
                    <th style={{ padding: '8px 12px', background: '#FAFAFA', border: '1px solid #E1E1E1', textAlign: 'left' }}>台数</th>
                    <td style={{ padding: '8px 12px', border: '1px solid #E1E1E1', fontVariantNumeric: 'tabular-nums' }}>{additionQuantity} 台</td>
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
                    <td style={{ padding: '8px 12px', border: '1px solid #E1E1E1' }}>{assets[0]?.item || assets[0]?.name || '-'}</td>
                    <th style={{ padding: '8px 12px', background: '#FAFAFA', border: '1px solid #E1E1E1', textAlign: 'left', width: '150px' }}>メーカー</th>
                    <td style={{ padding: '8px 12px', border: '1px solid #E1E1E1' }}>{assets[0]?.maker || '-'}</td>
                  </tr>
                  <tr>
                    <th style={{ padding: '8px 12px', background: '#FAFAFA', border: '1px solid #E1E1E1', textAlign: 'left' }}>型式</th>
                    <td colSpan={3} style={{ padding: '8px 12px', border: '1px solid #E1E1E1' }}>{assets[0]?.model || '-'}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* 増設対象機器 */}
            <div style={styles.section}>
              <div style={styles.sectionTitle}>増設対象機器</div>
              <div style={{ background: themeLightBg, border: `1px solid ${themeBorder}`, borderRadius: '8px', padding: '16px' }}>
                <div style={{ fontSize: '16px', fontWeight: 'bold', color: themeColor, marginBottom: '12px' }}>
                  {assets[0]?.name}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px', fontSize: '13px' }}>
                  <div><span style={{ color: '#8A8A8A' }}>メーカー:</span> {assets[0]?.maker || '-'}</div>
                  <div><span style={{ color: '#8A8A8A' }}>型式:</span> {assets[0]?.model || '-'}</div>
                  <div><span style={{ color: '#8A8A8A' }}>設置場所:</span> {assets[0]?.roomName || '-'}</div>
                  <div><span style={{ color: '#8A8A8A' }}>管理番号:</span> {assets[0]?.managementNo || '-'}</div>
                </div>
              </div>
            </div>

            {/* 使用用途及び件数 */}
            <div style={styles.section}>
              <div style={styles.sectionTitle}>使用用途及び件数</div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <tbody>
                  <tr>
                    <th style={{ padding: '8px 12px', background: '#FAFAFA', border: '1px solid #E1E1E1', textAlign: 'left', width: '150px' }}>用途</th>
                    <td style={{ padding: '8px 12px', border: '1px solid #E1E1E1' }}>{usagePurpose || '-'}</td>
                    <th style={{ padding: '8px 12px', background: '#FAFAFA', border: '1px solid #E1E1E1', textAlign: 'left', width: '150px' }}>症例数</th>
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
                    <th style={{ padding: '8px 12px', background: '#FAFAFA', border: '1px solid #E1E1E1', textAlign: 'left', width: '180px' }}>現在の接続状況</th>
                    <td style={{ padding: '8px 12px', border: '1px solid #E1E1E1' }}>{currentConnectionStatus === 'wired' ? '有線接続' : currentConnectionStatus === 'wireless' ? '無線接続' : '接続不要'}</td>
                    <th style={{ padding: '8px 12px', background: '#FAFAFA', border: '1px solid #E1E1E1', textAlign: 'left', width: '150px' }}>接続先</th>
                    <td style={{ padding: '8px 12px', border: '1px solid #E1E1E1' }}>{currentConnectionDestination || '-'}</td>
                  </tr>
                  <tr>
                    <th style={{ padding: '8px 12px', background: '#FAFAFA', border: '1px solid #E1E1E1', textAlign: 'left' }}>要望機器の接続要望</th>
                    <td style={{ padding: '8px 12px', border: '1px solid #E1E1E1' }}>{requestConnectionStatus === 'wired' ? '有線接続' : requestConnectionStatus === 'wireless' ? '無線接続' : '接続不要'}</td>
                    <th style={{ padding: '8px 12px', background: '#FAFAFA', border: '1px solid #E1E1E1', textAlign: 'left' }}>要望機器の接続先</th>
                    <td style={{ padding: '8px 12px', border: '1px solid #E1E1E1' }}>{requestConnectionDestination || '-'}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          /* 入力画面 */
          <>
          {/* 申請基本情報 (Figma 284:30759: テーブル UI) */}
          <div style={styles.section}>
            <div style={styles.sectionTitle}>申請基本情報</div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <tbody>
                <tr>
                  <th style={tableTh}>管理部署</th>
                  <td style={tableTd}>{managementDepartment}</td>
                  <th style={tableTh}>申請者</th>
                  <td style={tableTd}>{applicantName}</td>
                  <th style={tableTh}>申請日</th>
                  <td style={tableTd}>{applicationDate}</td>
                </tr>
                <tr>
                  <th style={tableTh}>設置部門<span style={{ color: '#DA0000' }}> *</span></th>
                  <td style={tableTd}>
                    <SearchableSelect
                      value={installationDepartment}
                      onChange={setInstallationDepartment}
                      options={divisionOptions}
                      placeholder="選択してください"
                    />
                  </td>
                  <th style={tableTh}>設置部署<span style={{ color: '#DA0000' }}> *</span></th>
                  <td style={tableTd}>
                    <SearchableSelect
                      value={installationSection}
                      onChange={setInstallationSection}
                      options={departmentOptions}
                      placeholder="選択してください"
                    />
                  </td>
                  <th style={tableTh}>設置室名</th>
                  <td style={tableTd}>
                    <input
                      style={{ ...styles.input, width: '100%', boxSizing: 'border-box' }}
                      value={installationRoomName}
                      onChange={(e) => setInstallationRoomName(e.target.value)}
                      placeholder="手術室B"
                    />
                  </td>
                </tr>
                <tr>
                  <th style={tableTh}>優先順位</th>
                  <td style={tableTd}>
                    <select style={{ ...styles.select, width: '80px' }} value={priority} onChange={(e) => setPriority(e.target.value)}>
                      {[1, 2, 3, 4, 5].map(n => (
                        <option key={n} value={n}>{n}</option>
                      ))}
                    </select>
                  </td>
                  <th style={tableTh}>希望納期</th>
                  <td style={tableTd}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <select style={{ ...styles.select, width: '80px' }} value={desiredDeliveryYear} onChange={(e) => setDesiredDeliveryYear(e.target.value)}>
                        {[2025, 2026, 2027, 2028, 2029, 2030].map(y => (
                          <option key={y} value={y}>{y}</option>
                        ))}
                      </select>
                      <span>年</span>
                      <select style={{ ...styles.select, width: '64px' }} value={desiredDeliveryMonth} onChange={(e) => setDesiredDeliveryMonth(e.target.value)}>
                        {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                          <option key={m} value={m}>{m}</option>
                        ))}
                      </select>
                      <span>月</span>
                    </div>
                  </td>
                  <th style={tableTh}>品目</th>
                  <td style={tableTd}>{assets[0]?.item || assets[0]?.name || '-'}</td>
                </tr>
                <tr>
                  <th style={tableTh}>台数<span style={{ color: '#DA0000' }}> *</span></th>
                  <td style={tableTd} colSpan={5}>
                    <input
                      type="number"
                      value={additionQuantity}
                      onChange={(e) => setAdditionQuantity(Math.max(1, Number(e.target.value) || 1))}
                      min={1}
                      style={{ ...styles.input, width: '80px', textAlign: 'center', fontVariantNumeric: 'tabular-nums' }}
                    />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* 申請品目 (Figma 284:30759: テーブル UI) */}
          <div style={styles.section}>
            <div style={styles.sectionTitle}>申請品目</div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <tbody>
                <tr>
                  <th style={tableTh}>品目名</th>
                  <td style={tableTd}>{assets[0]?.item || assets[0]?.name || '-'}</td>
                  <th style={tableTh}>メーカー</th>
                  <td style={tableTd}>{assets[0]?.maker || '-'}</td>
                  <th style={tableTh}>型式</th>
                  <td style={tableTd}>{assets[0]?.model || '-'}</td>
                </tr>
              </tbody>
            </table>
            <div style={{ marginTop: '8px', fontSize: '12px', color: '#8A8A8A' }}>
              ※ 増設対象資産から自動設定されています
            </div>
          </div>

          {/* 増設対象機器 (Figma 284:30759: テーブル UI) */}
          <div style={styles.section}>
            <div style={styles.sectionTitle}>増設対象機器</div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <tbody>
                <tr>
                  <th style={tableTh}>品目名</th>
                  <td style={tableTd} colSpan={5}>{assets[0]?.name || '-'}</td>
                </tr>
                <tr>
                  <th style={tableTh}>メーカー</th>
                  <td style={tableTd}>{assets[0]?.maker || '-'}</td>
                  <th style={tableTh}>型式</th>
                  <td style={tableTd}>{assets[0]?.model || '-'}</td>
                  <th style={tableTh}>管理番号</th>
                  <td style={tableTd}>{assets[0]?.managementNo || '-'}</td>
                </tr>
                <tr>
                  <th style={tableTh}>設置場所</th>
                  <td style={tableTd}>{assets[0]?.roomName || '-'}</td>
                  <th style={tableTh}>部門</th>
                  <td style={tableTd}>{assets[0]?.department || '-'}</td>
                  <th style={tableTh}>部署</th>
                  <td style={tableTd}>{assets[0]?.section || '-'}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* 使用用途及び件数 */}
          <div style={styles.section}>
            <div style={styles.sectionTitle}>使用用途及び件数</div>
            <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-end' }}>
              <div style={{ flex: 1 }}>
                <label style={styles.label}>用途</label>
                <input
                  style={{ ...styles.input, width: '100%' }}
                  value={usagePurpose}
                  onChange={(e) => setUsagePurpose(e.target.value)}
                  placeholder="使用用途を入力"
                />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <label style={styles.label}>症例数</label>
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
              placeholder="増設理由やコメントを入力してください"
            />
          </div>

          {/* 添付ファイル */}
          <div style={styles.section}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              marginBottom: '8px',
            }}>
              <button style={{
                padding: '8px 16px',
                background: '#F1F1F1',
                color: '#4A4A4A',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: 600,
              }}>添付ファイル</button>
              <button
                style={{
                  padding: '8px 16px',
                  background: 'white',
                  color: '#4A4A4A',
                  border: '1px solid #E1E1E1',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '13px',
                }}
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
                      background: themeLightBg,
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
            <div style={{ fontSize: '12px', color: '#8A8A8A', marginTop: '8px' }}>
              見積書・参考資料などを添付してください
            </div>
          </div>

          {/* システム接続要望 */}
          <div style={styles.section}>
            <div style={styles.sectionTitle}>システム接続要望</div>
            <div style={{ display: 'grid', gap: '16px' }}>
              <div>
                <label style={styles.label}>現在の接続状況</label>
                <div style={{ ...styles.radioGroup, marginTop: '8px' }}>
                  <label style={styles.radioLabel}>
                    <input
                      type="radio"
                      checked={currentConnectionStatus === 'wired'}
                      onChange={() => setCurrentConnectionStatus('wired')}
                    />
                    有線接続
                  </label>
                  <label style={styles.radioLabel}>
                    <input
                      type="radio"
                      checked={currentConnectionStatus === 'wireless'}
                      onChange={() => setCurrentConnectionStatus('wireless')}
                    />
                    無線接続
                  </label>
                  <label style={styles.radioLabel}>
                    <input
                      type="radio"
                      checked={currentConnectionStatus === 'not-required'}
                      onChange={() => setCurrentConnectionStatus('not-required')}
                    />
                    接続不要
                  </label>
                </div>
              </div>
              <div>
                <label style={styles.label}>現在の接続先</label>
                <input
                  style={{ ...styles.input, width: '100%', marginTop: '6px' }}
                  value={currentConnectionDestination}
                  onChange={(e) => setCurrentConnectionDestination(e.target.value)}
                  placeholder="接続先を入力してください"
                />
              </div>
              <div>
                <label style={styles.label}>要望機器の接続要望</label>
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
                <label style={styles.label}>要望機器の接続先</label>
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
        applicationName="増設申請"
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
