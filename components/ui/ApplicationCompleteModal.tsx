'use client';

import React from 'react';

interface ApplicationCompleteModalProps {
  isOpen: boolean;
  applicationName: string;
  applicationNo: string;
  guidanceText: string;
  returnDestination?: string;
  onGoToMain: () => void;
  onContinue: () => void;
}

export function ApplicationCompleteModal({
  isOpen,
  applicationName,
  applicationNo,
  guidanceText,
  returnDestination = 'メイン画面',
  onGoToMain,
  onContinue,
}: ApplicationCompleteModalProps) {
  if (!isOpen) return null;

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
        zIndex: 1100,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'white',
          borderRadius: '8px',
          width: '90%',
          maxWidth: '480px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
          overflow: 'hidden',
          textAlign: 'center',
          padding: '32px',
        }}
      >
        {/* 送信完了メッセージ */}
        <h2
          style={{
            fontSize: '18px',
            fontWeight: 600,
            color: '#4A4A4A',
            margin: '0 0 12px',
          }}
        >
          {applicationName}を送信しました
        </h2>

        {/* 申請No */}
        <p
          style={{
            fontSize: '14px',
            color: '#8A8A8A',
            margin: guidanceText ? '0 0 16px' : '0 0 32px',
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          申請No.: {applicationNo}
        </p>

        {/* ガイダンステキスト */}
        {guidanceText && (
          <p
            style={{
              fontSize: '13px',
              color: '#8A8A8A',
              margin: '0 0 32px',
              lineHeight: '1.6',
              whiteSpace: 'pre-line',
            }}
          >
            {guidanceText}
          </p>
        )}

        {/* ボタン (Figma 395:68355: 続けて申請するを上、戻るを下) */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
          }}
        >
          <button
            onClick={onContinue}
            style={{
              padding: '12px 24px',
              background: '#008C1D',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 600,
              minHeight: '44px',
            }}
          >
            続けて申請する
          </button>
          <button
            onClick={onGoToMain}
            style={{
              padding: '12px 24px',
              background: 'white',
              color: '#146E2E',
              border: '1px solid #146E2E',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 500,
              minHeight: '44px',
            }}
          >
            {returnDestination}に戻る
          </button>
        </div>
      </div>
    </div>
  );
}
