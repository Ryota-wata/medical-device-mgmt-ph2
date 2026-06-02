'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronDown, Eye, EyeOff, X } from 'lucide-react';
import { useAuthStore, TEST_USERS } from '@/lib/stores';
import { getUserType } from '@/lib/types/user';

const REPRESENTATIVE_HOSPITAL_EMAIL = 'hospital-me@hospital.com';
const REPRESENTATIVE_SHIP_EMAIL = 'admin@ship.com';

const MicrosoftLogo: React.FC<{ size?: number }> = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 21 21" aria-hidden>
    <rect x="1" y="1" width="9" height="9" fill="#F35325" />
    <rect x="11" y="1" width="9" height="9" fill="#81BC06" />
    <rect x="1" y="11" width="9" height="9" fill="#05A6F0" />
    <rect x="11" y="11" width="9" height="9" fill="#FFBA08" />
  </svg>
);

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
  const [showSsoModal, setShowSsoModal] = useState(false);
  const [showSsoAllAccounts, setShowSsoAllAccounts] = useState(false);
  const [ssoError, setSsoError] = useState('');
  const [ssoSubmittingEmail, setSsoSubmittingEmail] = useState<string | null>(null);

  const hospitalRepUser = TEST_USERS.find((u) => u.email === REPRESENTATIVE_HOSPITAL_EMAIL);
  const shipRepUser = TEST_USERS.find((u) => u.email === REPRESENTATIVE_SHIP_EMAIL);

  const handleSsoLogin = async (ssoEmail: string) => {
    setSsoError('');
    setSsoSubmittingEmail(ssoEmail);
    try {
      await login({ username: ssoEmail, password: 'あ' });
      router.push('/facility-select');
    } catch (_err) {
      setSsoError('サインインに失敗しました。アカウントを確認してください');
      setSsoSubmittingEmail(null);
    }
  };

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
        <h1 className="text-[24px] font-bold text-center mb-8 text-balance text-content-primary leading-[1.3]">
          医療機器管理システム
        </h1>

        {/* Microsoft SSO サインインボタン（Ph2 主推奨） */}
        <button
          type="button"
          onClick={() => {
            setShowSsoModal(true);
            setSsoError('');
            setShowSsoAllAccounts(false);
          }}
          className="w-full h-12 mb-6 flex items-center justify-center gap-3 bg-white border border-stroke-input rounded-lg text-base font-medium text-content-primary hover:bg-surface-screen transition-colors cursor-pointer"
        >
          <MicrosoftLogo />
          <span>Microsoftアカウントでサインイン</span>
        </button>

        {/* 区切り線 */}
        <div className="flex items-center gap-3 mb-6">
          <div className="flex-1 h-px bg-stroke-card" />
          <span className="text-xs text-content-sub">またはメール・パスワード</span>
          <div className="flex-1 h-px bg-stroke-card" />
        </div>

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

      {/* Microsoft SSO 風 アカウントピッカー モーダル */}
      {showSsoModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
          onClick={() => {
            if (!ssoSubmittingEmail) setShowSsoModal(false);
          }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="sso-modal-title"
        >
          <div
            className="bg-white w-full max-w-md rounded-2xl shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* ヘッダ */}
            <div className="flex items-center justify-between px-6 pt-6 pb-3">
              <div className="flex items-center gap-2">
                <MicrosoftLogo size={18} />
                <span className="text-sm font-semibold text-content-primary">Microsoft</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (!ssoSubmittingEmail) setShowSsoModal(false);
                }}
                disabled={!!ssoSubmittingEmail}
                className="p-1 rounded text-content-sub hover:bg-surface-screen disabled:opacity-50 cursor-pointer border-0 bg-transparent"
                aria-label="閉じる"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <h2
              id="sso-modal-title"
              className="px-6 text-[20px] font-semibold text-content-primary leading-tight text-balance"
            >
              アカウントを選択してください
            </h2>
            <p className="px-6 mt-1 text-xs text-content-sub text-pretty">
              モック動作: 本番では Microsoft Entra ID (Azure AD) によるサインインに置き換わります
            </p>

            {/* 代表アカウント2件（病院 / SHIP） */}
            <div className="px-6 mt-5 space-y-2">
              {hospitalRepUser && (
                <button
                  type="button"
                  onClick={() => handleSsoLogin(hospitalRepUser.email)}
                  disabled={!!ssoSubmittingEmail}
                  className="w-full flex items-center gap-3 p-3 border border-stroke-card rounded-lg hover:border-sky-400 hover:bg-sky-50 transition-colors text-left bg-white cursor-pointer disabled:opacity-60 disabled:cursor-default"
                >
                  <div className="size-10 rounded-full bg-sky-100 text-sky-700 flex items-center justify-center text-base font-semibold">
                    病
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-content-primary truncate">
                        {hospitalRepUser.name}
                      </span>
                      <span className="inline-flex items-center px-1.5 py-0.5 text-[10px] font-semibold rounded border bg-sky-50 text-sky-700 border-sky-200">
                        病院
                      </span>
                    </div>
                    <div className="text-xs text-content-sub mt-0.5 truncate font-mono">
                      {hospitalRepUser.email}
                    </div>
                  </div>
                  {ssoSubmittingEmail === hospitalRepUser.email && (
                    <span className="text-xs text-content-sub">…</span>
                  )}
                </button>
              )}
              {shipRepUser && (
                <button
                  type="button"
                  onClick={() => handleSsoLogin(shipRepUser.email)}
                  disabled={!!ssoSubmittingEmail}
                  className="w-full flex items-center gap-3 p-3 border border-stroke-card rounded-lg hover:border-emerald-400 hover:bg-emerald-50 transition-colors text-left bg-white cursor-pointer disabled:opacity-60 disabled:cursor-default"
                >
                  <div className="size-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-base font-semibold">
                    S
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-content-primary truncate">
                        {shipRepUser.name}
                      </span>
                      <span className="inline-flex items-center px-1.5 py-0.5 text-[10px] font-semibold rounded border bg-emerald-50 text-emerald-700 border-emerald-200">
                        SHIP
                      </span>
                    </div>
                    <div className="text-xs text-content-sub mt-0.5 truncate font-mono">
                      {shipRepUser.email}
                    </div>
                  </div>
                  {ssoSubmittingEmail === shipRepUser.email && (
                    <span className="text-xs text-content-sub">…</span>
                  )}
                </button>
              )}
            </div>

            {ssoError && (
              <p className="px-6 mt-3 text-sm text-content-alert">{ssoError}</p>
            )}

            {/* 別のアカウントを使用 */}
            <div className="px-6 mt-4 pb-2">
              <button
                type="button"
                onClick={() => setShowSsoAllAccounts(!showSsoAllAccounts)}
                className="text-sm text-content-link hover:opacity-80 flex items-center gap-1 bg-transparent border-0 cursor-pointer p-0"
                aria-expanded={showSsoAllAccounts}
              >
                <span>別のアカウントを使用する</span>
                <ChevronDown className={`w-4 h-4 transition-transform ${showSsoAllAccounts ? 'rotate-180' : ''}`} aria-hidden />
              </button>
            </div>

            {showSsoAllAccounts && (
              <div className="px-6 pb-2 max-h-[40vh] overflow-y-auto">
                {(['hospital', 'ship'] as const).map((persona) => {
                  const users = TEST_USERS.filter((u) => getUserType(u.email) === persona);
                  if (users.length === 0) return null;
                  return (
                    <div key={persona} className="mt-3">
                      <div className="text-xs text-content-sub font-semibold mb-2">
                        {persona === 'hospital' ? '病院アカウント' : 'SHIP アカウント'}
                      </div>
                      {users.map((u) => (
                        <button
                          key={u.email}
                          type="button"
                          onClick={() => handleSsoLogin(u.email)}
                          disabled={!!ssoSubmittingEmail}
                          className="w-full flex items-center justify-between px-3 py-2 mb-1.5 rounded-lg border border-stroke-card hover:bg-surface-screen transition-colors text-left bg-transparent cursor-pointer disabled:opacity-60 disabled:cursor-default"
                        >
                          <div className="min-w-0">
                            <div className="text-sm font-medium text-content-primary truncate">
                              {u.roleLabel}（{u.name}）
                            </div>
                            <div className="text-xs text-content-sub mt-0.5 truncate font-mono">
                              {u.email}
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  );
                })}
              </div>
            )}

            <div className="px-6 py-4 mt-2 border-t border-stroke-card bg-surface-screen rounded-b-2xl">
              <p className="text-xs text-content-sub text-pretty">
                利用規約・プライバシーに同意の上、サインインしてください
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
