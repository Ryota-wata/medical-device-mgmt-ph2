'use client';

import React, { useMemo } from 'react';
import { X, Mail, Paperclip, Copy, ExternalLink, Info } from 'lucide-react';

export interface OutlookAttachment {
  filename: string;
  fileType: 'PDF' | 'Excel' | 'Word';
  /** モック上のサイズ表示 */
  size: string;
  /** ダウンロード用ハンドラ（モック: alertでもOK） */
  onDownload?: () => void;
}

export interface OutlookComposeModalProps {
  open: boolean;
  onClose: () => void;
  /** TO 宛先（複数業者対応） */
  toAddresses: string[];
  /** CC 宛先（任意） */
  ccAddresses?: string[];
  /** 件名 */
  subject: string;
  /** 本文（プレーンテキスト） */
  body: string;
  /** 添付ファイル一覧 */
  attachments: OutlookAttachment[];
  /** 業者の表示名（プレビュー用） */
  vendorLabels?: string[];
  /** Outlook 起動と連動して呼ばれるコールバック（送信済フラグ更新等） */
  onSend?: () => void;
  /** プライマリボタンのラベル（既定: "Outlook で新規メール作成"） */
  primaryButtonLabel?: string;
}

const FILE_ICON_COLOR: Record<OutlookAttachment['fileType'], string> = {
  PDF: 'text-rose-600',
  Excel: 'text-emerald-600',
  Word: 'text-sky-600',
};

export const OutlookComposeModal: React.FC<OutlookComposeModalProps> = ({
  open,
  onClose,
  toAddresses,
  ccAddresses = [],
  subject,
  body,
  attachments,
  vendorLabels = [],
  onSend,
  primaryButtonLabel = 'Outlook で新規メール作成',
}) => {
  // mailto: URI 構築
  const mailtoUri = useMemo(() => {
    const to = toAddresses.join(',');
    const params = new URLSearchParams();
    if (ccAddresses.length > 0) params.set('cc', ccAddresses.join(','));
    params.set('subject', subject);
    params.set('body', body);
    return `mailto:${to}?${params.toString()}`;
  }, [toAddresses, ccAddresses, subject, body]);

  const handleOpenOutlook = () => {
    window.location.href = mailtoUri;
    if (onSend) onSend();
  };

  const handleCopyBody = async () => {
    try {
      await navigator.clipboard.writeText(body);
    } catch {
      // fallback: nothing
    }
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-6"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="outlook-compose-title"
    >
      <div
        className="bg-white w-full max-w-3xl rounded-2xl shadow-xl flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ヘッダ */}
        <div className="flex items-start justify-between gap-3 px-6 pt-5 pb-3 border-b border-stroke-card">
          <div>
            <h2
              id="outlook-compose-title"
              className="text-lg font-semibold text-content-primary inline-flex items-center gap-2"
            >
              <Mail className="w-5 h-5 text-sky-600" aria-hidden />
              Outlook メール作成プレビュー
            </h2>
            <p className="mt-1 text-xs text-content-sub text-pretty">
              「Outlookで新規メール作成」を押すと、宛先・件名・本文がセットされた状態で
              既定のメールクライアント（Outlook 等）が起動します。
              <span className="font-medium"> ※ 添付ファイルは別途ご自身でダウンロード → 添付してください。</span>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="閉じる"
            className="p-1 rounded text-content-sub hover:bg-surface-screen border-0 bg-transparent cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* メール内容 */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
          {/* 宛先 */}
          <div className="border border-stroke-card rounded-md">
            <div className="flex flex-wrap items-start gap-2 px-3 py-2 border-b border-stroke-card">
              <span className="text-xs font-semibold text-content-sub w-12 mt-1">TO</span>
              <div className="flex-1 min-w-0 flex flex-wrap gap-1.5">
                {toAddresses.map((addr, i) => (
                  <span
                    key={addr}
                    className="inline-flex items-center gap-1.5 px-2 py-1 text-xs rounded bg-sky-50 border border-sky-200"
                  >
                    {vendorLabels[i] && (
                      <span className="font-semibold text-sky-800">{vendorLabels[i]}</span>
                    )}
                    <span className="text-sky-700 font-mono">{addr}</span>
                  </span>
                ))}
              </div>
            </div>
            {ccAddresses.length > 0 && (
              <div className="flex items-start gap-2 px-3 py-2 border-b border-stroke-card">
                <span className="text-xs font-semibold text-content-sub w-12 mt-1">CC</span>
                <div className="flex-1 flex flex-wrap gap-1.5">
                  {ccAddresses.map((addr) => (
                    <span
                      key={addr}
                      className="inline-flex items-center px-2 py-1 text-xs rounded bg-stone-50 border border-stone-200 font-mono text-stone-700"
                    >
                      {addr}
                    </span>
                  ))}
                </div>
              </div>
            )}
            <div className="flex items-start gap-2 px-3 py-2">
              <span className="text-xs font-semibold text-content-sub w-12 mt-1">件名</span>
              <div className="flex-1 text-sm text-content-primary font-medium">{subject}</div>
            </div>
          </div>

          {/* 本文 */}
          <div className="border border-stroke-card rounded-md">
            <div className="flex items-center justify-between px-3 py-2 border-b border-stroke-card bg-surface-screen">
              <span className="text-xs font-semibold text-content-sub">本文</span>
              <button
                type="button"
                onClick={handleCopyBody}
                className="inline-flex items-center gap-1 text-xs text-content-link hover:underline bg-transparent border-0 cursor-pointer p-0"
              >
                <Copy className="w-3 h-3" aria-hidden /> 本文をコピー
              </button>
            </div>
            <pre className="px-3 py-3 text-sm text-content-primary whitespace-pre-wrap font-sans leading-relaxed">
              {body}
            </pre>
          </div>

          {/* 添付ファイル */}
          {attachments.length > 0 && (
            <div className="border border-stroke-card rounded-md">
              <div className="flex items-center justify-between px-3 py-2 border-b border-stroke-card bg-surface-screen">
                <span className="text-xs font-semibold text-content-sub inline-flex items-center gap-1">
                  <Paperclip className="w-3 h-3" aria-hidden /> 添付ファイル ({attachments.length})
                </span>
                <span className="text-[10px] text-content-sub">手動添付用にダウンロード</span>
              </div>
              <ul className="divide-y divide-stroke-card">
                {attachments.map((a) => (
                  <li
                    key={a.filename}
                    className="flex items-center justify-between gap-3 px-3 py-2"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <Paperclip className={`w-4 h-4 ${FILE_ICON_COLOR[a.fileType]}`} aria-hidden />
                      <span className="text-sm text-content-primary truncate font-medium">
                        {a.filename}
                      </span>
                      <span className="text-xs text-content-sub">({a.fileType} · {a.size})</span>
                    </div>
                    <button
                      type="button"
                      onClick={a.onDownload}
                      className="inline-flex items-center gap-1 text-xs text-content-link hover:underline bg-transparent border-0 cursor-pointer p-0 whitespace-nowrap"
                    >
                      ダウンロード
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* 補足説明 */}
          <div className="bg-sky-50 border border-sky-200 rounded-md p-3 flex items-start gap-2">
            <Info className="w-4 h-4 text-sky-700 shrink-0 mt-0.5" aria-hidden />
            <div className="text-xs text-sky-900 text-pretty space-y-1">
              <p>
                <span className="font-semibold">技術仕様:</span>{' '}
                <code className="px-1 py-0.5 bg-white rounded text-[11px]">mailto:</code>{' '}
                URI スキームを使用。OS の既定メールクライアント（Outlook デスクトップ / Outlook
                Web / Apple Mail 等）が起動します。
              </p>
              <p>
                <span className="font-semibold">Microsoft アカウント認証は不要</span>です（既にお使いの
                Outlook にサインイン済の状態でメール作成画面が開きます）。
              </p>
            </div>
          </div>
        </div>

        {/* フッタ */}
        <div className="px-6 py-4 border-t border-stroke-card flex items-center justify-between gap-3 bg-surface-screen rounded-b-2xl flex-wrap">
          <p className="text-xs text-content-sub">
            宛先 <span className="font-semibold tabular-nums">{toAddresses.length}</span> 件 ／
            添付 <span className="font-semibold tabular-nums">{attachments.length}</span> 件
          </p>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={onClose}
              className="h-10 px-4 text-sm text-content-primary border border-stroke-input rounded-lg bg-white hover:bg-surface-screen transition-colors cursor-pointer"
            >
              キャンセル
            </button>
            <button
              type="button"
              onClick={handleOpenOutlook}
              className="h-10 px-5 text-sm font-medium text-white bg-sky-600 rounded-lg hover:opacity-90 transition-opacity cursor-pointer inline-flex items-center gap-1.5"
            >
              <ExternalLink className="w-4 h-4" aria-hidden />
              {primaryButtonLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
