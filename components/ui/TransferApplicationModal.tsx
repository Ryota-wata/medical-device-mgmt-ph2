'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Asset } from '@/lib/types';
import { useMasterStore, useApplicationStore } from '@/lib/stores';
import { SearchableSelect } from './SearchableSelect';
import { useResponsive } from '@/lib/hooks/useResponsive';
import { ApplicationCompleteModal } from './ApplicationCompleteModal';
import { ApplicationCloseConfirmModal } from './ApplicationCloseConfirmModal';

interface TransferApplicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  assets: Asset[];  // 複数選択対応
  onSuccess?: () => void;
  returnDestination?: string;
  returnHref?: string;
}

export const TransferApplicationModal: React.FC<TransferApplicationModalProps> = ({
  isOpen,
  onClose,
  assets,
  onSuccess,
  returnDestination = '資産一覧',
  returnHref = '/asset-search-result',
}) => {
  const router = useRouter();
  const { facilities } = useMasterStore();
  const { addApplication } = useApplicationStore();
  const { isMobile } = useResponsive();

  // 完了モーダル・閉じる確認モーダル
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);
  const [completedAppNo, setCompletedAppNo] = useState('');

  // 確認画面表示
  const [isConfirmView, setIsConfirmView] = useState(false);

  // 接続本体QRコード
  const [parentQrCode, setParentQrCode] = useState('');

  // 移動先の状態
  const [destDepartment, setDestDepartment] = useState('');
  const [destSection, setDestSection] = useState('');
  const [destRoomName, setDestRoomName] = useState('');
  const [comment, setComment] = useState('');

  // 申請者（モック：ログインユーザー）
  const applicantName = '手部 術太郎';

  // 申請日（今日の日付）
  const applicationDate = new Date().toISOString().split('T')[0];

  // 部門オプション
  const departmentOptions = useMemo(() => {
    const uniqueDepartments = Array.from(new Set(facilities.map(f => f.department)));
    return uniqueDepartments.filter(Boolean) as string[];
  }, [facilities]);

  // 部署オプション（選択された部門に基づく）
  const sectionOptions = useMemo(() => {
    if (destDepartment) {
      const filtered = facilities.filter(f => f.department === destDepartment);
      const uniqueSections = Array.from(new Set(filtered.map(f => f.section)));
      return uniqueSections.filter(Boolean) as string[];
    }
    const uniqueSections = Array.from(new Set(facilities.map(f => f.section)));
    return uniqueSections.filter(Boolean) as string[];
  }, [facilities, destDepartment]);

  // 部門変更時のハンドラー
  const handleDepartmentChange = (value: string) => {
    setDestDepartment(value);
    // 部署が新しい部門に属さない場合はクリア
    if (destSection) {
      const validSection = facilities.find(f =>
        f.department === value && f.section === destSection
      );
      if (!validSection) {
        setDestSection('');
      }
    }
  };

  // 部署変更時のハンドラー（親自動選択）
  const handleSectionChange = (value: string) => {
    setDestSection(value);
    // 部門が未選択の場合、自動選択
    if (value && !destDepartment) {
      const facility = facilities.find(f => f.section === value);
      if (facility && facility.department) {
        setDestDepartment(facility.department);
      }
    }
  };

  // 確認画面へ遷移
  const handleConfirm = () => {
    if (!destDepartment || !destSection || !destRoomName) {
      alert('移動先の設置部門、設置部署、設置室名を入力してください');
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
    const appNo = `TRAN-${Date.now()}-${Math.floor(Math.random() * 10000)}`;

    // 各資産に対して申請を作成
    assets.forEach((asset) => {
      addApplication({
        applicationNo: appNo,
        applicationDate: applicationDate,
        applicationType: '移動申請',
        asset: {
          name: asset.name,
          model: asset.model,
        },
        vendor: asset.maker,
        quantity: String(asset.quantity || 1),
        unit: '台',
        status: '承認待ち',
        approvalProgress: {
          current: 0,
          total: 3,
        },
        facility: {
          building: asset.building,
          floor: asset.floor,
          department: asset.department,
          section: asset.section,
        },
        roomName: asset.roomName || '',
        freeInput: comment,
        executionYear: new Date().getFullYear().toString(),
        // 移動先情報
        transferDestination: {
          department: destDepartment,
          section: destSection,
          roomName: destRoomName,
        },
      });
    });

    setCompletedAppNo(appNo);
    setShowCompleteModal(true);
  };

  // フォームリセット
  const resetForm = () => {
    setParentQrCode('');
    setDestDepartment('');
    setDestSection('');
    setDestRoomName('');
    setComment('');
    setIsConfirmView(false);
  };

  if (!isOpen || assets.length === 0) return null;

  // 最初の資産の情報を基本情報として表示（複数選択時）
  const primaryAsset = assets[0];

  // テーマカラー
  const themeColor = '#008C1D';

  // 確認画面用テーブルスタイル
  const thStyle: React.CSSProperties = { padding: '8px 12px', background: '#FAFAFA', border: '1px solid #E1E1E1', textAlign: 'left', width: '150px' };
  const tdStyle: React.CSSProperties = { padding: '8px 12px', border: '1px solid #E1E1E1' };

  return (
    <div
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
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'white',
          borderRadius: '8px',
          width: '90%',
          maxWidth: '900px',
          maxHeight: '90vh',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* モーダルヘッダー (Figma 284:31989: 白背景 + 黒文字) */}
        <div
          style={{
            background: 'white',
            padding: '16px 24px',
            fontSize: '18px',
            fontWeight: 600,
            color: '#4A4A4A',
            borderBottom: '1px solid #E1E1E1',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span>{isConfirmView ? '移動申請:内容確認' : '移動申請'}</span>
          <button
            onClick={() => setShowCloseConfirm(true)}
            style={{
              background: 'none',
              border: 'none',
              color: '#4A4A4A',
              fontSize: '20px',
              cursor: 'pointer',
              padding: '0',
              width: '30px',
              height: '30px',
              lineHeight: 1,
            }}
            aria-label="閉じる"
          >
            ×
          </button>
        </div>

        {/* モーダルボディ */}
        <div style={{ padding: '24px', flex: 1, overflowY: 'auto' }}>
        {isConfirmView ? (
          /* ===== 確認画面 ===== */
          <div>
            <div style={{ color: '#DA0000', fontSize: '13px', fontWeight: 500, marginBottom: '16px' }}>
              ※以下の項目に間違いがないかご確認ください
            </div>

            {/* 申請基本情報 */}
            <div style={{ marginBottom: '24px' }}>
              <div style={{ fontSize: '14px', fontWeight: 600, color: '#4A4A4A', marginBottom: '16px', paddingBottom: '8px', borderBottom: '1px solid #E1E1E1' }}>
                申請基本情報
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <tbody>
                  <tr>
                    <th style={thStyle}>所属部署</th>
                    <td style={tdStyle}>{primaryAsset.department || '-'}</td>
                    <th style={thStyle}>申請者</th>
                    <td style={tdStyle}>{applicantName}</td>
                  </tr>
                  <tr>
                    <th style={thStyle}>申請日</th>
                    <td style={tdStyle}>{applicationDate}</td>
                    <th style={thStyle}>設置部門</th>
                    <td style={tdStyle}>{primaryAsset.department || '-'}</td>
                  </tr>
                  <tr>
                    <th style={thStyle}>設置部署</th>
                    <td style={tdStyle}>{primaryAsset.section || '-'}</td>
                    <th style={thStyle}>設置室名</th>
                    <td style={tdStyle}>{primaryAsset.roomName || '-'}</td>
                  </tr>
                </tbody>
              </table>
              {assets.length > 1 && (
                <div style={{ marginTop: '8px', padding: '8px 12px', background: '#FDF1E5', borderRadius: '4px', fontSize: '13px', color: '#4A4A4A' }}>
                  ※ {assets.length}件の資産が選択されています
                </div>
              )}
            </div>

            {/* 対象資産情報 */}
            <div style={{ marginBottom: '24px' }}>
              <div style={{ fontSize: '14px', fontWeight: 600, color: '#4A4A4A', marginBottom: '16px', paddingBottom: '8px', borderBottom: '1px solid #E1E1E1' }}>
                対象資産情報
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ background: '#FAFAFA' }}>
                    {['QRコード', '品目名', 'メーカー名', '型式', '数量', 'シリアルNo.', '納入年月日'].map(label => (
                      <th key={label} style={{ padding: '8px', border: '1px solid #E1E1E1', textAlign: 'left', whiteSpace: 'nowrap' }}>
                        {label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {assets.map((asset, idx) => (
                    <tr key={idx}>
                      <td style={tdStyle}>{asset.qrCode || '-'}</td>
                      <td style={tdStyle}>{asset.name || '-'}</td>
                      <td style={tdStyle}>{asset.maker || '-'}</td>
                      <td style={tdStyle}>{asset.model || '-'}</td>
                      <td style={{ ...tdStyle, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{asset.quantity ?? '-'}</td>
                      <td style={tdStyle}>{asset.serialNumber || '-'}</td>
                      <td style={tdStyle}>{asset.deliveryDate || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* 移動先 */}
            <div style={{ marginBottom: '24px' }}>
              <div style={{ fontSize: '14px', fontWeight: 600, color: '#4A4A4A', marginBottom: '16px', paddingBottom: '8px', borderBottom: '1px solid #E1E1E1' }}>
                移動先
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <tbody>
                  {parentQrCode && (
                    <tr>
                      <th style={thStyle}>接続本体QRコード</th>
                      <td colSpan={3} style={tdStyle}>{parentQrCode}</td>
                    </tr>
                  )}
                  <tr>
                    <th style={thStyle}>設置部門</th>
                    <td style={tdStyle}>{destDepartment}</td>
                    <th style={thStyle}>設置部署</th>
                    <td style={tdStyle}>{destSection}</td>
                  </tr>
                  <tr>
                    <th style={thStyle}>設置室名</th>
                    <td colSpan={3} style={tdStyle}>{destRoomName}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* コメント */}
            {comment && (
              <div style={{ marginBottom: '24px' }}>
                <div style={{ fontSize: '14px', fontWeight: 600, color: '#4A4A4A', marginBottom: '16px', paddingBottom: '8px', borderBottom: '1px solid #E1E1E1' }}>
                  コメント（移動理由他）
                </div>
                <div style={{ padding: '12px', background: '#FAFAFA', borderRadius: '4px', border: '1px solid #E1E1E1', whiteSpace: 'pre-wrap' }}>
                  {comment}
                </div>
              </div>
            )}
          </div>
        ) : (
          /* ===== 入力画面 ===== */
          <>
          {/* 注意文 (Figma 284:31989: 赤強調) */}
          <div style={{
            color: '#DA0000',
            fontSize: '13px',
            fontWeight: 500,
            marginBottom: '16px',
          }}>
            ※以下の項目に間違いがないかご確認ください
          </div>

          {/* 申請基本情報 */}
          <div style={{ marginBottom: '24px' }}>
            <h3 style={{
              fontSize: '14px',
              fontWeight: 600,
              color: '#4A4A4A',
              marginBottom: '16px',
              borderBottom: '1px solid #E1E1E1',
              paddingBottom: '8px'
            }}>
              申請基本情報
            </h3>

            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <tbody>
                <tr>
                  <th style={thStyle}>所属部署</th>
                  <td style={tdStyle}>{primaryAsset.department || '-'}</td>
                  <th style={thStyle}>申請者</th>
                  <td style={tdStyle}>{applicantName}</td>
                  <th style={thStyle}>申請日</th>
                  <td style={tdStyle}>{applicationDate}</td>
                </tr>
                <tr>
                  <th style={thStyle}>設置部門</th>
                  <td style={tdStyle}>{primaryAsset.department || '-'}</td>
                  <th style={thStyle}>設置部署</th>
                  <td style={tdStyle}>{primaryAsset.section || '-'}</td>
                  <th style={thStyle}>設置室名</th>
                  <td style={tdStyle}>{primaryAsset.roomName || '-'}</td>
                </tr>
              </tbody>
            </table>

            {/* 複数選択時の表示 */}
            {assets.length > 1 && (
              <div style={{
                marginTop: '12px',
                padding: '8px 12px',
                background: '#FDF1E5',
                borderRadius: '4px',
                fontSize: '13px',
                color: '#4A4A4A'
              }}>
                ※ {assets.length}件の資産が選択されています
              </div>
            )}
          </div>

          {/* 対象資産情報 */}
          <div style={{ marginBottom: '24px' }}>
            <h3 style={{
              fontSize: '14px',
              fontWeight: 600,
              color: '#4A4A4A',
              marginBottom: '16px',
              borderBottom: '1px solid #E1E1E1',
              paddingBottom: '8px'
            }}>
              対象資産情報
            </h3>

            {assets.length === 1 ? (
              /* 単数選択：テーブル表示 (Figma 284:31989 準拠) */
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <tbody>
                  <tr>
                    <th style={thStyle}>QRコード</th>
                    <td style={tdStyle}>{primaryAsset.qrCode || '-'}</td>
                    <th style={thStyle}>品目名</th>
                    <td style={tdStyle}>{primaryAsset.name || '-'}</td>
                    <th style={thStyle}>メーカー名</th>
                    <td style={tdStyle}>{primaryAsset.maker || '-'}</td>
                  </tr>
                  <tr>
                    <th style={thStyle}>型式</th>
                    <td style={tdStyle}>{primaryAsset.model || '-'}</td>
                    <th style={thStyle}>数量</th>
                    <td style={tdStyle}>{primaryAsset.quantity ?? '-'}</td>
                    <th style={thStyle}>シリアルNo.</th>
                    <td style={tdStyle}>{primaryAsset.serialNumber || '-'}</td>
                  </tr>
                  <tr>
                    <th style={thStyle}>納入年月日</th>
                    <td style={tdStyle} colSpan={5}>{primaryAsset.deliveryDate || '-'}</td>
                  </tr>
                </tbody>
              </table>
            ) : (
              /* 複数選択：テーブル表示 */
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                  <thead>
                    <tr style={{ background: '#FAFAFA' }}>
                      {['QRコード', '品目名', 'メーカー名', '型式', '数量', 'シリアルNo.', '納入年月日'].map(label => (
                        <th key={label} style={{ padding: '8px 10px', textAlign: 'left', border: '1px solid #E1E1E1', fontWeight: 'bold', color: '#555', whiteSpace: 'nowrap' }}>
                          {label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {assets.map((asset, idx) => (
                      <tr key={idx} style={{ background: idx % 2 === 0 ? 'white' : '#FAFAFA' }}>
                        <td style={{ padding: '7px 10px', border: '1px solid #E1E1E1' }}>{asset.qrCode || '-'}</td>
                        <td style={{ padding: '7px 10px', border: '1px solid #E1E1E1' }}>{asset.name || '-'}</td>
                        <td style={{ padding: '7px 10px', border: '1px solid #E1E1E1' }}>{asset.maker || '-'}</td>
                        <td style={{ padding: '7px 10px', border: '1px solid #E1E1E1' }}>{asset.model || '-'}</td>
                        <td style={{ padding: '7px 10px', border: '1px solid #E1E1E1', textAlign: 'right' }}>{asset.quantity ?? '-'}</td>
                        <td style={{ padding: '7px 10px', border: '1px solid #E1E1E1' }}>{asset.serialNumber || '-'}</td>
                        <td style={{ padding: '7px 10px', border: '1px solid #E1E1E1' }}>{asset.deliveryDate || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* 移動先 */}
          <div style={{ marginBottom: '24px' }}>
            <h3 style={{
              fontSize: '14px',
              fontWeight: 600,
              color: '#4A4A4A',
              marginBottom: '8px',
              borderBottom: '1px solid #E1E1E1',
              paddingBottom: '8px'
            }}>
              移動先
            </h3>

            <div style={{
              padding: '10px 14px',
              background: '#FAFAFA',
              border: '1px solid #FDF1E5',
              borderRadius: '4px',
              fontSize: '12px',
              color: '#4A4A4A',
              marginBottom: '16px',
            }}>
              接続本体が変更となる資産は移動先の本体QRコードを登録してください
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr' : 'auto 1fr',
              gap: '12px 16px',
              alignItems: 'center',
              marginBottom: '16px',
            }}>
              <div style={{ fontSize: '13px', color: '#8A8A8A' }}>QRコード</div>
              <input
                type="text"
                value={parentQrCode}
                onChange={(e) => setParentQrCode(e.target.value)}
                placeholder="接続本体のQRコードを入力"
                style={{
                  padding: '8px 12px',
                  border: '1px solid #E1E1E1',
                  borderRadius: '4px',
                  fontSize: '13px',
                  maxWidth: '280px',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr' : 'auto 1fr auto 1fr auto 1fr',
              gap: '12px 16px',
              alignItems: 'center'
            }}>
              <div style={{ fontSize: '13px', color: '#8A8A8A' }}>設置部門 <span style={{ color: '#DA0000' }}>*</span></div>
              <div style={{ position: 'relative', zIndex: 12 }}>
                <SearchableSelect
                  value={destDepartment}
                  onChange={handleDepartmentChange}
                  options={departmentOptions}
                  placeholder="選択してください"
                  isMobile={isMobile}
                />
              </div>

              <div style={{ fontSize: '13px', color: '#8A8A8A' }}>設置部署 <span style={{ color: '#DA0000' }}>*</span></div>
              <div style={{ position: 'relative', zIndex: 11 }}>
                <SearchableSelect
                  value={destSection}
                  onChange={handleSectionChange}
                  options={sectionOptions}
                  placeholder="選択してください"
                  isMobile={isMobile}
                />
              </div>

              <div style={{ fontSize: '13px', color: '#8A8A8A' }}>設置室名 <span style={{ color: '#DA0000' }}>*</span></div>
              <input
                type="text"
                value={destRoomName}
                onChange={(e) => setDestRoomName(e.target.value)}
                placeholder="入力してください"
                style={{
                  padding: '8px 12px',
                  border: '1px solid #E1E1E1',
                  borderRadius: '4px',
                  fontSize: '13px',
                  width: '100%',
                  boxSizing: 'border-box',
                }}
              />
            </div>
          </div>

          {/* コメント */}
          <div style={{ marginBottom: '24px' }}>
            <h3 style={{
              fontSize: '14px',
              fontWeight: 600,
              color: '#4A4A4A',
              marginBottom: '12px',
              borderBottom: '1px solid #E1E1E1',
              paddingBottom: '8px'
            }}>
              コメント（移動理由他）
            </h3>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="移動理由やコメントを入力してください"
              rows={5}
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #E1E1E1',
                borderRadius: '4px',
                fontSize: '13px',
                boxSizing: 'border-box',
                resize: 'vertical',
              }}
            />
          </div>
          </>
        )}
        </div>

        {/* フッター */}
        <div style={{
          padding: '16px 24px',
          borderTop: '1px solid #E1E1E1',
          display: 'flex',
          justifyContent: 'center',
          background: '#FAFAFA',
        }}>
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
            <button
              onClick={handleConfirm}
              style={{
                padding: '12px 48px',
                background: 'white',
                color: '#146E2E',
                border: '1px solid #146E2E',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '15px',
                fontWeight: 600,
              }}
            >
              記載内容を確認する
            </button>
          )}
        </div>
      </div>

      {/* 完了モーダル */}
      <ApplicationCompleteModal
        isOpen={showCompleteModal}
        applicationName="移動申請"
        applicationNo={completedAppNo}
        guidanceText=""
        returnDestination={returnDestination}
        onGoToMain={() => {
          resetForm();
          setShowCompleteModal(false);
          onClose();
          router.push(returnHref);
        }}
        onContinue={() => {
          resetForm();
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
};
