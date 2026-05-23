'use client';

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Asset } from '@/lib/types';
import { useApplicationStore } from '@/lib/stores';
import { useResponsive } from '@/lib/hooks/useResponsive';
import { ApplicationCompleteModal } from './ApplicationCompleteModal';
import { ApplicationCloseConfirmModal } from './ApplicationCloseConfirmModal';

interface AttachedFile {
  name: string;
  size: number;
  type: string;
  file: File;
}

interface DisposalApplicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  assets: Asset[];  // 複数選択対応
  onSuccess?: () => void;
  returnDestination?: string;
  returnHref?: string;
}

export const DisposalApplicationModal: React.FC<DisposalApplicationModalProps> = ({
  isOpen,
  onClose,
  assets,
  onSuccess,
  returnDestination = '資産一覧',
  returnHref = '/asset-search-result',
}) => {
  const router = useRouter();
  const { addApplication } = useApplicationStore();
  const { isMobile } = useResponsive();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 完了モーダル・閉じる確認モーダル
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);
  const [completedAppNo, setCompletedAppNo] = useState('');

  // 確認画面表示
  const [isConfirmView, setIsConfirmView] = useState(false);

  // コメント
  const [comment, setComment] = useState('');

  // 添付ファイル
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([]);

  // 申請者（モック：ログインユーザー）
  const applicantName = '手部 術太郎';

  // 申請日（今日の日付）
  const applicationDate = new Date().toISOString().split('T')[0];

  // ファイル選択ハンドラー
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newFiles: AttachedFile[] = Array.from(files).map(file => ({
      name: file.name,
      size: file.size,
      type: file.type,
      file: file,
    }));

    setAttachedFiles(prev => [...prev, ...newFiles]);

    // inputをリセット（同じファイルを再選択可能に）
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // ファイル削除ハンドラー
  const handleFileRemove = (index: number) => {
    setAttachedFiles(prev => prev.filter((_, i) => i !== index));
  };

  // ファイルサイズのフォーマット
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // 確認画面へ遷移
  const handleConfirm = () => {
    setIsConfirmView(true);
  };

  // 入力画面に戻る
  const handleBackToEdit = () => {
    setIsConfirmView(false);
  };

  // 申請送信
  const handleSubmit = () => {
    const appNo = `DISP-${Date.now()}-${Math.floor(Math.random() * 10000)}`;

    // 各資産に対して申請を作成
    assets.forEach((asset) => {
      addApplication({
        applicationNo: appNo,
        applicationDate: applicationDate,
        applicationType: '廃棄申請',
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
        applicationReason: comment,
      });
    });

    setCompletedAppNo(appNo);
    setShowCompleteModal(true);
  };

  // フォームリセット
  const resetForm = () => {
    setComment('');
    setAttachedFiles([]);
    setIsConfirmView(false);
  };

  if (!isOpen || assets.length === 0) return null;

  // 最初の資産の情報を基本情報として表示（複数選択時）
  const primaryAsset = assets[0];

  // テーマカラー（廃棄申請：赤系）
  const themeColor = '#DA0000';

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
        {/* モーダルヘッダー (Figma 395:68355: 白背景 + 黒文字) */}
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
          <span>{isConfirmView ? '廃棄申請：内容確認' : '廃棄申請'}</span>
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
            <div style={{ color: themeColor, fontSize: '13px', fontWeight: 500, marginBottom: '16px' }}>
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

            {/* コメント */}
            {comment && (
              <div style={{ marginBottom: '24px' }}>
                <div style={{ fontSize: '14px', fontWeight: 600, color: '#4A4A4A', marginBottom: '16px', paddingBottom: '8px', borderBottom: '1px solid #E1E1E1' }}>
                  コメント（廃棄理由他）
                </div>
                <div style={{ padding: '12px', background: '#FAFAFA', borderRadius: '4px', border: '1px solid #E1E1E1', whiteSpace: 'pre-wrap' }}>
                  {comment}
                </div>
              </div>
            )}

            {/* 添付ファイル */}
            {attachedFiles.length > 0 && (
              <div style={{ marginBottom: '24px' }}>
                <div style={{ fontSize: '14px', fontWeight: 600, color: '#4A4A4A', marginBottom: '16px', paddingBottom: '8px', borderBottom: '1px solid #E1E1E1' }}>
                  添付ファイル
                </div>
                <ul style={{ margin: 0, paddingLeft: '20px' }}>
                  {attachedFiles.map((file, index) => (
                    <li key={index} style={{ padding: '4px 0', fontSize: '13px' }}>
                      {file.name} ({formatFileSize(file.size)})
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ) : (
          /* ===== 入力画面 ===== */
          <>
          {/* 注意文 (Figma 395:68355: 赤強調) */}
          <div style={{
            color: themeColor,
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
              /* 単数選択：テーブル表示 (Figma 395:68355 準拠) */
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
              コメント（廃棄理由他）
            </h3>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="廃棄理由やコメントを入力してください"
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

          {/* 添付ファイル */}
          <div style={{ marginBottom: '24px' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '12px',
              border: '1px solid #E1E1E1',
              borderRadius: '4px',
              marginBottom: '8px',
            }}>
              <div style={{
                padding: '8px 16px',
                background: '#F1F1F1',
                color: '#4A4A4A',
                borderRadius: '4px',
                fontSize: '13px',
                fontWeight: 600,
              }}>
                添付ファイル
              </div>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                onChange={handleFileSelect}
                style={{ display: 'none' }}
                id="disposal-file-input"
              />
              <label
                htmlFor="disposal-file-input"
                style={{
                  padding: '6px 12px',
                  background: '#FAFAFA',
                  border: '1px solid #E1E1E1',
                  borderRadius: '4px',
                  fontSize: '13px',
                  cursor: 'pointer',
                }}
              >
                ファイルの選択
              </label>
              <span style={{ fontSize: '13px', color: '#8A8A8A' }}>
                {attachedFiles.length === 0 ? 'ファイルが選択されていません' : `${attachedFiles.length}件のファイルが選択されています`}
              </span>
            </div>

            {/* 選択されたファイルリスト */}
            {attachedFiles.length > 0 && (
              <div style={{ marginBottom: '8px' }}>
                {attachedFiles.map((file, index) => (
                  <div
                    key={index}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 12px',
                      background: '#FAFAFA',
                      borderRadius: '4px',
                      marginBottom: '4px',
                      fontSize: '13px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span>{file.name}</span>
                      <span style={{ color: '#8A8A8A' }}>({formatFileSize(file.size)})</span>
                    </div>
                    <button
                      onClick={() => handleFileRemove(index)}
                      style={{
                        padding: '4px 8px',
                        background: '#DA0000',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '12px',
                      }}
                    >
                      削除
                    </button>
                  </div>
                ))}
              </div>
            )}

            <p style={{ fontSize: '12px', color: '#8A8A8A', margin: 0 }}>
              見積書・修理不能証明など手持ちの書類を添付してください
            </p>
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
                  background: themeColor,
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 'bold',
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
        applicationName="廃棄申請"
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
