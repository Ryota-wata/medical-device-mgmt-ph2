'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronDown, Eye, EyeOff } from 'lucide-react';
import { useAuthStore, TEST_USERS } from '@/lib/stores';

const CATEGORY_LABELS: Record<string, { label: string; color: string; hoverBorder: string; hoverBg: string; badgeBg: string; badgeText: string }> = {
  system: { label: 'システム', color: 'border-red-500', hoverBorder: 'hover:border-red-500', hoverBg: 'hover:bg-red-50', badgeBg: 'bg-red-100', badgeText: 'text-red-700' },
  org_default: { label: '組織デフォルト', color: 'border-purple-500', hoverBorder: 'hover:border-purple-500', hoverBg: 'hover:bg-purple-50', badgeBg: 'bg-purple-100', badgeText: 'text-purple-700' },
  hospital: { label: '病院', color: 'border-sky-500', hoverBorder: 'hover:border-sky-500', hoverBg: 'hover:bg-sky-50', badgeBg: 'bg-sky-100', badgeText: 'text-sky-700' },
  dedicated: { label: '専用', color: 'border-amber-500', hoverBorder: 'hover:border-amber-500', hoverBg: 'hover:bg-amber-50', badgeBg: 'bg-amber-100', badgeText: 'text-amber-700' },
};

const CATEGORY_ORDER = ['system', 'org_default', 'hospital', 'dedicated'] as const;

export default function LoginPage() {
  const router = useRouter();
  const { login, isLoading } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showTestAccounts, setShowTestAccounts] = useState(false);

  const isFormValid = email.trim() !== '' && password.trim() !== '';

  // ページ読み込み時に保存されたログイン情報を復元
  useEffect(() => {
    const savedEmail = localStorage.getItem('rememberedEmail');
    const savedRememberMe = localStorage.getItem('rememberMe');

    if (savedRememberMe === 'true' && savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }
  }, []);

  // テストアカウントをクリックしてメール欄に入力
  const handleTestAccountClick = (testEmail: string) => {
    setEmail(testEmail);
    setPassword('あ');
    setEmailError('');
    setPasswordError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailError('');
    setPasswordError('');

    let hasError = false;
    if (!email) {
      setEmailError('メールアドレスを入力してください');
      hasError = true;
    }
    if (!password) {
      setPasswordError('パスワードを入力してください');
      hasError = true;
    }
    if (hasError) return;

    try {
      await login({ username: email, password });

      if (rememberMe) {
        localStorage.setItem('rememberedEmail', email);
        localStorage.setItem('rememberMe', 'true');
      } else {
        localStorage.removeItem('rememberedEmail');
        localStorage.removeItem('rememberMe');
      }

      router.push('/facility-select');
    } catch (_err) {
      setEmailError('アドレスが間違っています');
      setPasswordError('パスワードが間違ってます');
    }
  };

  const handlePasswordReset = (e: React.MouseEvent) => {
    e.preventDefault();
    router.push('/password-reset');
  };

  return (
    <div className="min-h-dvh flex items-center justify-center bg-surface-screen overflow-y-auto py-8 font-figma">
      <div className="bg-surface-card border border-stroke-card w-full max-w-md mx-5 p-10 my-auto rounded-2xl">
        {/* タイトル */}
        <h1 className="text-[24px] font-bold text-center mb-10 text-balance text-content-primary leading-[1.3]">
          医療機器管理システム
        </h1>

        {/* フォーム */}
        <form onSubmit={handleSubmit}>
          {/* メールアドレス */}
          <div className="mb-6">
            <label className="block text-base font-normal mb-1 text-content-primary leading-[1.5]">
              <span className="text-content-alert">※</span>メールアドレス
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (emailError) setEmailError('');
              }}
              placeholder="入力してください"
              className={`w-full h-[42px] px-3 py-[9px] text-base rounded-lg border outline-none transition-colors placeholder:text-content-placeholder ${
                emailError
                  ? 'border-content-alert text-content-alert bg-surface-card'
                  : 'border-stroke-input text-content-primary bg-surface-card focus:border-content-link'
              }`}
            />
            {emailError && (
              <p className="mt-1 text-sm text-content-alert">{emailError}</p>
            )}
          </div>

          {/* パスワード */}
          <div className="mb-6">
            <label className="block text-base font-normal mb-1 text-content-primary leading-[1.5]">
              <span className="text-content-alert">※</span>パスワード
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (passwordError) setPasswordError('');
                }}
                placeholder="・・・・・"
                className={`w-full h-[42px] px-3 py-[9px] pr-12 text-base rounded-lg border outline-none transition-colors placeholder:text-content-placeholder ${
                  passwordError
                    ? 'border-content-alert text-content-alert bg-surface-card'
                    : 'border-stroke-input text-content-primary bg-surface-card focus:border-content-link'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-content-sub"
                aria-label={showPassword ? 'パスワードを隠す' : 'パスワードを表示'}
              >
                {showPassword ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
              </button>
            </div>
            {passwordError && (
              <p className="mt-1 text-sm text-content-alert">{passwordError}</p>
            )}
          </div>

          {/* ログイン状態を記憶する */}
          <div className="mb-4 flex justify-center">
            <label className="flex items-center cursor-pointer gap-2">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="size-6 rounded cursor-pointer accent-cta-primary"
              />
              <span className="text-base text-content-primary leading-[1.5]">
                ログイン状態を記憶する
              </span>
            </label>
          </div>

          {/* ログインボタン */}
          <button
            type="submit"
            disabled={isLoading || !isFormValid}
            className={`w-full h-12 border-0 rounded-lg text-base font-normal px-6 transition-colors ${
              isFormValid
                ? 'bg-cta-primary hover:opacity-90 text-white cursor-pointer'
                : 'bg-surface-disabled text-content-disabled cursor-default'
            }`}
          >
            {isLoading ? 'ログイン中...' : 'ログイン'}
          </button>
        </form>

        {/* パスワードリセットリンク */}
        <div className="mt-6 text-center">
          <a
            href="#"
            onClick={handlePasswordReset}
            className="text-sm font-light underline text-content-link hover:opacity-80 transition-opacity leading-[1.3]"
          >
            パスワードをお忘れの方
          </a>
        </div>

        {/* テストアカウント一覧（mock専用拡張: Figma準拠トークンで統一） */}
        <div className="mt-8 pt-6 border-t border-stroke-card">
          <button
            type="button"
            onClick={() => setShowTestAccounts(!showTestAccounts)}
            className="w-full text-sm text-content-sub flex items-center justify-center gap-2 transition-colors bg-transparent border-none cursor-pointer"
          >
            <span>テストアカウント一覧</span>
            <ChevronDown className={`w-4 h-4 transition-transform ${showTestAccounts ? 'rotate-180' : ''}`} aria-hidden />
          </button>

          {showTestAccounts && (
            <div className="mt-4 space-y-2 max-h-[40vh] overflow-y-auto">
              {CATEGORY_ORDER.map((cat) => {
                const catInfo = CATEGORY_LABELS[cat];
                const users = TEST_USERS.filter(u => u.category === cat);
                if (users.length === 0) return null;
                return (
                  <div key={cat}>
                    <div className="text-xs text-content-sub font-semibold mt-3 mb-2">{catInfo.label}</div>
                    {users.map((user) => (
                      <button
                        key={user.email}
                        type="button"
                        onClick={() => handleTestAccountClick(user.email)}
                        className={`w-full text-left px-3 py-2 mb-1.5 rounded-lg border border-stroke-card ${catInfo.hoverBorder} ${catInfo.hoverBg} transition-colors bg-transparent cursor-pointer`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-content-primary">{user.roleLabel}</span>
                          <span className={`text-xs px-2 py-0.5 rounded ${catInfo.badgeBg} ${catInfo.badgeText}`}>{user.role}</span>
                        </div>
                        <div className="text-xs text-content-sub mt-1 font-mono">{user.email}</div>
                      </button>
                    ))}
                  </div>
                );
              })}

              <p className="text-xs text-content-sub mt-3 text-center text-pretty">
                クリックするとメール欄に入力されます（パスワード: あ）
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
