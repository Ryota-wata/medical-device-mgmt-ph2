'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function PasswordResetPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (!email) {
      setError('メールアドレスを入力してください');
      return;
    }

    // 簡易的なメールアドレスバリデーション
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('有効なメールアドレスを入力してください');
      return;
    }

    setIsLoading(true);

    // 実際のAPI呼び出しをシミュレート
    setTimeout(() => {
      setIsLoading(false);
      setMessage('パスワード再設定用のリンクを送信しました。メールをご確認ください。');
      setEmail('');
    }, 1500);
  };

  const handleBackToLogin = (e: React.MouseEvent) => {
    e.preventDefault();
    router.push('/login');
  };

  return (
    <div className="min-h-dvh flex items-center justify-center bg-surface-screen">
      <div className="bg-surface-card rounded-2xl shadow-2xl w-full max-w-md mx-5 p-12">
        {/* タイトル */}
        <h1 className="text-3xl font-bold text-center mb-4 text-balance text-content-primary">
          パスワード再設定
        </h1>

        {/* 説明文 */}
        <p className="text-center mb-8 text-sm text-pretty text-content-sub">
          登録されたメールアドレスにパスワード再設定用のリンクを送信します。
        </p>

        {/* フォーム */}
        <form onSubmit={handleSubmit}>
          {/* メールアドレス */}
          <div className="mb-6">
            <label className="block text-sm font-semibold mb-2 text-content-sub">
              メールアドレス
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="登録メールアドレスを入力"
              className="w-full px-4 py-3 rounded-lg text-base border-2 border-stroke-input focus:border-cta-primary focus:ring-2 focus:ring-cta-primary/20 outline-none transition-colors"
            />
          </div>

          {/* エラーメッセージ */}
          {error && (
            <div className="mb-6 p-3 bg-stroke-card border border-content-alert rounded text-content-alert text-sm">
              {error}
            </div>
          )}

          {/* 成功メッセージ */}
          {message && (
            <div className="mb-6 p-3 bg-surface-select border border-cta-primary rounded text-cta-primary-dark text-sm">
              {message}
            </div>
          )}

          {/* 送信ボタン */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full text-white border-0 rounded-lg text-base font-semibold cursor-pointer py-3.5 px-6 bg-cta-primary shadow-lg shadow-cta-primary/30 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-cta-primary/40 active:translate-y-0 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? '送信中...' : '送信'}
          </button>
        </form>

        {/* ログイン画面に戻るリンク */}
        <div className="mt-6 text-center">
          <a
            href="#"
            onClick={handleBackToLogin}
            className="text-sm text-content-sub hover:text-cta-primary transition-colors"
          >
            ログイン画面に戻る
          </a>
        </div>
      </div>
    </div>
  );
}
