'use client';

import React from 'react';

interface ApplicationCloseConfirmModalProps {
  isOpen: boolean;
  returnDestination?: string;
  onCancel: () => void;
  onConfirm: () => void;
}

export function ApplicationCloseConfirmModal({
  isOpen,
  returnDestination = 'メイン画面',
  onCancel,
  onConfirm,
}: ApplicationCloseConfirmModalProps) {
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
          borderRadius: '12px',
          width: '90%',
          maxWidth: '420px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
          overflow: 'hidden',
          padding: '32px',
        }}
      >
        {/* タイトル */}
        <h2
          style={{
            fontSize: '16px',
            fontWeight: 'bold',
            color: '#4A4A4A',
            margin: '0 0 12px',
            textAlign: 'center',
          }}
        >
          {returnDestination}に戻る
        </h2>

        {/* メッセージ */}
        <p
          style={{
            fontSize: '14px',
            color: '#8A8A8A',
            margin: '0 0 28px',
            textAlign: 'center',
            lineHeight: '1.6',
          }}
        >
          入力内容が破棄されます。{returnDestination}に戻りますか？
        </p>

        {/* ボタン */}
        <div
          style={{
            display: 'flex',
            gap: '12px',
            justifyContent: 'center',
          }}
        >
          <button
            onClick={onCancel}
            style={{
              padding: '10px 24px',
              background: '#E1E1E1',
              color: '#4A4A4A',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 'bold',
              minHeight: '44px',
              flex: 1,
              maxWidth: '160px',
            }}
          >
            入力を続ける
          </button>
          <button
            onClick={onConfirm}
            style={{
              padding: '10px 24px',
              background: '#4A4A4A',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 'bold',
              minHeight: '44px',
              flex: 1,
              maxWidth: '180px',
            }}
          >
            {returnDestination}に戻る
          </button>
        </div>
      </div>
    </div>
  );
}
