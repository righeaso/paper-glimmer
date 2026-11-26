import {FormEvent, useEffect, useState} from 'react';
import {AlertCircle, CheckCircle2, Cloud, X} from 'lucide-react';

export interface AuthActionResult {
  error: string | null;
  notice?: string | null;
}

interface AuthModalProps {
  isOpen: boolean;
  isSupabaseReady: boolean;
  initialMode?: 'signin' | 'signup';
  onClose: () => void;
  onSignIn: (email: string, password: string) => Promise<AuthActionResult>;
  onSignUp: (
    email: string,
    password: string,
    nickname?: string,
  ) => Promise<AuthActionResult>;
}

export function AuthModal({
  isOpen,
  isSupabaseReady,
  initialMode = 'signin',
  onClose,
  onSignIn,
  onSignUp,
}: AuthModalProps) {
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>(initialMode);
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [nicknameInput, setNicknameInput] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [noticeMsg, setNoticeMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setAuthMode(initialMode);
    setErrorMsg(null);
    setNoticeMsg(null);
  }, [isOpen, initialMode]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setNoticeMsg(null);

    if (!isSupabaseReady) {
      setErrorMsg(
        '尚未設定 Supabase 環境變數（請確認已設定 VITE_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_URL 與 PUBLISHABLE_KEY 後重新部署）。',
      );
      return;
    }

    const cleanEmail = emailInput.trim();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setErrorMsg('請輸入有效的電子信箱。');
      return;
    }
    if (passwordInput.length < 6) {
      setErrorMsg('密碼至少需 6 個字元。');
      return;
    }

    setBusy(true);
    try {
      const result =
        authMode === 'signin'
          ? await onSignIn(cleanEmail, passwordInput)
          : await onSignUp(cleanEmail, passwordInput, nicknameInput.trim());

      if (result.error) {
        setErrorMsg(result.error);
      } else if (result.notice) {
        setNoticeMsg(result.notice);
        setPasswordInput('');
      } else {
        setPasswordInput('');
        setNicknameInput('');
        onClose();
      }
    } catch (err) {
      setErrorMsg(
        err instanceof Error ? err.message : '登入或註冊過程發生未預期錯誤。',
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#2C2A29]/45 backdrop-blur-[1px] p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="w-full max-w-[400px] bg-[#FFFDF9] border border-[#E6E1D6] rounded-[12px] shadow-[0_14px_36px_rgba(44,42,41,0.18)] p-5 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <Cloud className="w-4 h-4 text-[#5C6B54] shrink-0" />
            <div>
              <h2
                id="auth-modal-title"
                className="font-serif text-[17px] font-semibold text-[#2C2A29]"
              >
                {authMode === 'signin' ? '登入紙間微光' : '建立雲端帳號'}
              </h2>
              <p className="text-[11px] text-[#7A756E] mt-0.5">
                登入後即可撰寫今日信箋並同步心意對話
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="關閉登入視窗"
            className="min-w-[36px] min-h-[36px] -mr-1 -mt-1 flex items-center justify-center rounded-[8px] text-[#7A756E] hover:text-[#2C2A29] hover:bg-[#F3EFE6] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Missing Env Warning */}
        {!isSupabaseReady && (
          <div
            role="alert"
            className="flex items-start gap-2 text-xs text-[#9E4737] bg-[#9E4737]/8 border border-[#9E4737]/25 rounded-[8px] px-3 py-2.5 leading-relaxed"
          >
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>
              尚未設定 Supabase 環境變數（VITE_SUPABASE_URL /
              NEXT_PUBLIC_SUPABASE_URL 與金鑰），目前無法連線登入。
            </span>
          </div>
        )}

        {/* Sign In / Sign Up Mode Toggle */}
        <div
          role="tablist"
          aria-label="帳號模式切換"
          className="grid grid-cols-2 gap-1.5 p-1 bg-[#F3EFE6] rounded-[8px]"
        >
          <button
            type="button"
            role="tab"
            aria-selected={authMode === 'signin'}
            onClick={() => {
              setAuthMode('signin');
              setErrorMsg(null);
              setNoticeMsg(null);
            }}
            className={`min-h-[38px] text-xs rounded-[6px] transition-colors cursor-pointer ${
              authMode === 'signin'
                ? 'bg-[#FFFDF9] text-[#2C2A29] font-medium shadow-xs'
                : 'text-[#7A756E] hover:text-[#2C2A29]'
            }`}
          >
            登入
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={authMode === 'signup'}
            onClick={() => {
              setAuthMode('signup');
              setErrorMsg(null);
              setNoticeMsg(null);
            }}
            className={`min-h-[38px] text-xs rounded-[6px] transition-colors cursor-pointer ${
              authMode === 'signup'
                ? 'bg-[#FFFDF9] text-[#2C2A29] font-medium shadow-xs'
                : 'text-[#7A756E] hover:text-[#2C2A29]'
            }`}
          >
            註冊
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          {authMode === 'signup' && (
            <div>
              <label
                htmlFor="modal-auth-nickname"
                className="block text-[11px] text-[#7A756E] mb-1"
              >
                個人筆名（選填）
              </label>
              <input
                id="modal-auth-nickname"
                type="text"
                value={nicknameInput}
                onChange={(e) => setNicknameInput(e.target.value)}
                maxLength={16}
                placeholder="例如：微光筆友"
                className="w-full min-h-[42px] px-3 rounded-[8px] bg-[#F9F7F2] border border-[#E6E1D6] text-xs text-[#2C2A29] placeholder:text-[#B5AEA4] focus:outline-none focus:border-[#9E4737]"
              />
            </div>
          )}

          <div>
            <label
              htmlFor="modal-auth-email"
              className="block text-[11px] text-[#7A756E] mb-1"
            >
              電子信箱
            </label>
            <input
              id="modal-auth-email"
              type="email"
              value={emailInput}
              onChange={(e) => {
                setEmailInput(e.target.value);
                if (errorMsg) setErrorMsg(null);
              }}
              placeholder="writer@example.com"
              autoComplete="email"
              className="w-full min-h-[42px] px-3 rounded-[8px] bg-[#F9F7F2] border border-[#E6E1D6] text-xs text-[#2C2A29] placeholder:text-[#B5AEA4] focus:outline-none focus:border-[#9E4737]"
            />
          </div>

          <div>
            <label
              htmlFor="modal-auth-password"
              className="block text-[11px] text-[#7A756E] mb-1"
            >
              密碼
            </label>
            <input
              id="modal-auth-password"
              type="password"
              value={passwordInput}
              onChange={(e) => {
                setPasswordInput(e.target.value);
                if (errorMsg) setErrorMsg(null);
              }}
              placeholder="至少 6 個字元"
              autoComplete={
                authMode === 'signin' ? 'current-password' : 'new-password'
              }
              className="w-full min-h-[42px] px-3 rounded-[8px] bg-[#F9F7F2] border border-[#E6E1D6] text-xs text-[#2C2A29] placeholder:text-[#B5AEA4] focus:outline-none focus:border-[#9E4737]"
            />
          </div>

          {errorMsg && (
            <div
              role="alert"
              className="flex items-start gap-2 text-xs text-[#9E4737] bg-[#9E4737]/8 border border-[#9E4737]/25 rounded-[8px] px-3 py-2 leading-relaxed break-words"
            >
              <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {noticeMsg && (
            <div
              role="status"
              className="flex items-start gap-2 text-xs text-[#5C6B54] bg-[#5C6B54]/8 border border-[#5C6B54]/20 rounded-[8px] px-3 py-2 leading-relaxed"
            >
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              <span>{noticeMsg}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={busy}
            className="w-full min-h-[44px] rounded-[8px] bg-[#5C6B54] hover:bg-[#4D5B46] text-[#FFFDF9] text-xs font-medium transition-colors cursor-pointer disabled:opacity-60"
          >
            {busy
              ? '處理中…'
              : authMode === 'signin'
                ? '登入帳號'
                : '註冊並啟用帳號'}
          </button>
        </form>
      </div>
    </div>
  );
}
