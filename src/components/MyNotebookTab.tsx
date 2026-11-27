import {FormEvent, useEffect, useState} from 'react';
import {
  Check,
  Cloud,
  LogOut,
  Pencil,
  RefreshCw,
  ShieldBan,
  X,
} from 'lucide-react';
import {REACTION_OPTIONS} from '../data/diaryConstants';
import {getSupabaseEnvDiagnostic} from '../lib/supabase';
import {computeWritingDaysFromDiaries} from '../services/supabaseSync';
import {
  BlockedUserItem,
  DiaryEntry,
  ReactionKey,
  UserProfile,
} from '../types/diary';
import type {AuthActionResult} from './AuthModal';
import {DiaryCard} from './DiaryCard';
import {PWAInstallButton} from './PWAInstallButton';

interface MyNotebookTabProps {
  currentUserId: string | null;
  profile: UserProfile;
  myDiaries: DiaryEntry[];
  blockedUsers: BlockedUserItem[];
  isSupabaseReady: boolean;
  authEmail: string | null;
  isSyncing: boolean;
  syncError: string | null;
  syncNotice: string | null;
  onUpdateProfile: (updates: {nickname: string; bio: string}) => void;
  onUnblockUser: (userId: string) => void;
  onSignIn: (email: string, password: string) => Promise<AuthActionResult>;
  onSignUp: (
    email: string,
    password: string,
    nickname?: string,
  ) => Promise<AuthActionResult>;
  onSignOut: () => Promise<void>;
  onManualSync: () => Promise<void>;
}

export function MyNotebookTab({
  currentUserId,
  profile,
  myDiaries,
  blockedUsers,
  isSupabaseReady,
  authEmail,
  isSyncing,
  syncError,
  syncNotice,
  onUpdateProfile,
  onUnblockUser,
  onSignIn,
  onSignUp,
  onSignOut,
  onManualSync,
}: MyNotebookTabProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [nicknameDraft, setNicknameDraft] = useState(profile.nickname);
  const [bioDraft, setBioDraft] = useState(profile.bio);

  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [signupNicknameInput, setSignupNicknameInput] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [authNotice, setAuthNotice] = useState<string | null>(null);
  const [authBusy, setAuthBusy] = useState(false);

  useEffect(() => {
    setIsEditing(false);
    setNicknameDraft(profile.nickname);
    setBioDraft(profile.bio);
  }, [currentUserId, profile.nickname, profile.bio]);

  const handleStartEdit = () => {
    setNicknameDraft(profile.nickname);
    setBioDraft(profile.bio);
    setIsEditing(true);
  };

  const handleSave = (e: FormEvent) => {
    e.preventDefault();
    const cleanName = nicknameDraft.trim() || '匿名筆友';
    const cleanBio = bioDraft.trim();
    onUpdateProfile({nickname: cleanName, bio: cleanBio});
    setIsEditing(false);
  };

  const handleAuthSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthNotice(null);

    if (!isSupabaseReady) {
      setAuthError(
        `尚未完成 Supabase 環境變數設定（${getSupabaseEnvDiagnostic()}）。請確認已設定 VITE_SUPABASE_URL 與 VITE_SUPABASE_ANON_KEY。`,
      );
      return;
    }

    const cleanEmail = emailInput.trim();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setAuthError('請輸入有效的電子信箱。');
      return;
    }
    if (passwordInput.length < 6) {
      setAuthError('密碼至少需 6 個字元。');
      return;
    }

    setAuthBusy(true);
    try {
      const result =
        authMode === 'signin'
          ? await onSignIn(cleanEmail, passwordInput)
          : await onSignUp(cleanEmail, passwordInput, signupNicknameInput.trim());

      if (result.error) {
        setAuthError(result.error);
      } else if (result.notice) {
        setAuthNotice(result.notice);
        setPasswordInput('');
      } else {
        setPasswordInput('');
        setSignupNicknameInput('');
      }
    } catch (err) {
      setAuthError(
        err instanceof Error ? err.message : '登入或註冊過程發生未預期錯誤。',
      );
    } finally {
      setAuthBusy(false);
    }
  };

  const actualWritingDays = computeWritingDaysFromDiaries(myDiaries);

  // Calculate total received reactions and breakdown
  const reactionCounts = REACTION_OPTIONS.reduce(
    (acc, opt) => {
      acc[opt.key] = 0;
      return acc;
    },
    {} as Record<ReactionKey, number>,
  );

  let totalReactions = 0;
  for (const diary of myDiaries) {
    if (diary.receivedReactions) {
      for (const item of diary.receivedReactions) {
        reactionCounts[item.reaction] =
          (reactionCounts[item.reaction] || 0) + 1;
        totalReactions += 1;
      }
    }
  }

  return (
    <section aria-label="我的本子" className="pt-3 space-y-6">
      {/* Personal Profile Card */}
      <div className="bg-[#FFFDF9] border border-[#E6E1D6] rounded-[12px] p-5 shadow-[0_2px_12px_rgba(44,42,41,0.03)]">
        {isEditing ? (
          <form onSubmit={handleSave} className="space-y-3">
            <div>
              <label
                htmlFor="profile-nickname"
                className="block text-xs text-[#7A756E] mb-1"
              >
                我的筆名
              </label>
              <input
                id="profile-nickname"
                type="text"
                value={nicknameDraft}
                onChange={(e) => setNicknameDraft(e.target.value)}
                maxLength={16}
                className="w-full min-h-[42px] px-3 rounded-[8px] bg-[#F9F7F2] border border-[#E6E1D6] font-serif text-[16px] text-[#2C2A29] focus:outline-none focus:border-[#9E4737]"
              />
            </div>
            <div>
              <label
                htmlFor="profile-bio"
                className="block text-xs text-[#7A756E] mb-1"
              >
                一句話簡介
              </label>
              <textarea
                id="profile-bio"
                value={bioDraft}
                onChange={(e) => setBioDraft(e.target.value)}
                maxLength={60}
                rows={2}
                className="w-full px-3 py-2 rounded-[8px] bg-[#F9F7F2] border border-[#E6E1D6] text-[13px] text-[#2C2A29] resize-none focus:outline-none focus:border-[#9E4737]"
              />
            </div>
            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="min-h-[40px] px-3.5 rounded-[8px] border border-[#E6E1D6] text-xs text-[#7A756E] hover:text-[#2C2A29] inline-flex items-center gap-1 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
                <span>取消</span>
              </button>
              <button
                type="submit"
                className="min-h-[40px] px-4 rounded-[8px] bg-[#5C6B54] text-[#FFFDF9] text-xs font-medium inline-flex items-center gap-1 cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" />
                <span>儲存</span>
              </button>
            </div>
          </form>
        ) : (
          <div>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] text-[#7A756E] mb-1">個人筆名</p>
                <h2 className="font-serif text-[20px] font-semibold text-[#2C2A29]">
                  {profile.nickname}
                </h2>
              </div>
              {authEmail && (
                <button
                  type="button"
                  onClick={handleStartEdit}
                  className="min-h-[40px] px-3 rounded-[8px] border border-[#E6E1D6] bg-[#F9F7F2] hover:bg-[#F2ECE0] text-xs text-[#7A756E] hover:text-[#2C2A29] inline-flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
                >
                  <Pencil className="w-3.5 h-3.5" />
                  <span>編輯簡歷</span>
                </button>
              )}
            </div>
            <p className="mt-2.5 font-serif text-[14px] text-[#7A756E] leading-relaxed">
              {profile.bio ||
                (authEmail
                  ? '尚未填寫一句話簡介'
                  : '登入雲端帳號後，即可設定筆名與個人簡介。')}
            </p>
          </div>
        )}

        {/* Writing & Mood Stats */}
        <div className="mt-5 pt-4 border-t border-[#E6E1D6]/80 grid grid-cols-2 gap-4">
          <div>
            <span className="block text-xs text-[#7A756E]">累計寫作天數</span>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="font-serif text-[24px] font-semibold text-[#2C2A29] tabular-nums">
                {actualWritingDays}
              </span>
              <span className="text-xs text-[#7A756E]">天</span>
            </div>
          </div>

          <div>
            <span className="block text-xs text-[#7A756E]">收到的心情統計</span>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="font-serif text-[24px] font-semibold text-[#9E4737] tabular-nums">
                {totalReactions}
              </span>
              <span className="text-xs text-[#7A756E]">份心意</span>
            </div>
          </div>
        </div>

        {/* Reaction breakdown inline */}
        <div className="mt-3 pt-3 border-t border-[#E6E1D6]/60 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-[#7A756E]">
          {REACTION_OPTIONS.map((opt) => (
            <span key={opt.key} className="tabular-nums">
              {opt.emoji} {opt.label} {reactionCounts[opt.key]}
            </span>
          ))}
        </div>
      </div>

      {/* Supabase Cloud Account Sync Card */}
      <div className="bg-[#FFFDF9] border border-[#E6E1D6] rounded-[12px] p-5 shadow-[0_2px_12px_rgba(44,42,41,0.03)]">
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-2">
              <Cloud className="w-4 h-4 text-[#5C6B54]" />
              <h3 className="font-serif text-[16px] font-semibold text-[#2C2A29]">
                雲端同步帳號
              </h3>
            </div>
            {authEmail && (
              <span className="text-[11px] font-medium text-[#5C6B54] bg-[#5C6B54]/10 px-2 py-0.5 rounded-[6px]">
                已登入同步
              </span>
            )}
          </div>

          {authEmail ? (
            <div className="space-y-3">
              <p className="text-xs text-[#7A756E]">
                目前帳號：<span className="text-[#2C2A29]">{authEmail}</span>
              </p>

              {syncError && (
                <p
                  role="alert"
                  className="text-xs text-[#9E4737] bg-[#9E4737]/8 border border-[#9E4737]/25 rounded-[8px] px-3 py-2 leading-relaxed break-all"
                >
                  雲端同步失敗：{syncError}（已完整保留您的本機日記資料）
                </p>
              )}

              {!syncError && syncNotice && (
                <p
                  role="status"
                  className="text-xs text-[#5C6B54] bg-[#5C6B54]/8 border border-[#5C6B54]/20 rounded-[8px] px-3 py-2 leading-relaxed"
                >
                  {syncNotice}
                </p>
              )}

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={onManualSync}
                  disabled={isSyncing}
                  className="min-h-[40px] px-3.5 rounded-[8px] border border-[#E6E1D6] bg-[#F9F7F2] hover:bg-[#F2ECE0] text-xs text-[#2C2A29] inline-flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-60"
                >
                  <RefreshCw
                    className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`}
                  />
                  <span>{isSyncing ? '同步中…' : '立即同步'}</span>
                </button>
                <button
                  type="button"
                  onClick={onSignOut}
                  className="min-h-[40px] px-3.5 rounded-[8px] border border-[#E6E1D6] bg-[#FFFDF9] hover:bg-[#F3EFE6] text-xs text-[#7A756E] hover:text-[#9E4737] inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>登出</span>
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleAuthSubmit} className="space-y-3 mt-2">
              <p className="text-xs text-[#7A756E] leading-relaxed">
                登入或建立帳號後，你的日記、心情回應與心意對話將保存至雲端資料庫。
              </p>

              {!isSupabaseReady && (
                <div
                  role="alert"
                  className="text-xs text-[#9E4737] bg-[#9E4737]/8 border border-[#9E4737]/25 rounded-[8px] px-3 py-2 leading-relaxed space-y-1"
                >
                  <p>
                    尚未完成 Supabase 環境變數設定（需設定{' '}
                    <code className="font-mono">VITE_SUPABASE_URL</code> 與{' '}
                    <code className="font-mono">VITE_SUPABASE_ANON_KEY</code>）。
                  </p>
                  <p className="text-[11px] opacity-90 break-words">
                    目前偵測狀態：{getSupabaseEnvDiagnostic()}
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-1.5 p-1 bg-[#F3EFE6] rounded-[8px]">
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('signin');
                    setAuthError(null);
                  }}
                  className={`min-h-[36px] text-xs rounded-[6px] transition-colors cursor-pointer ${
                    authMode === 'signin'
                      ? 'bg-[#FFFDF9] text-[#2C2A29] font-medium shadow-xs'
                      : 'text-[#7A756E]'
                  }`}
                >
                  登入帳號
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('signup');
                    setAuthError(null);
                  }}
                  className={`min-h-[36px] text-xs rounded-[6px] transition-colors cursor-pointer ${
                    authMode === 'signup'
                      ? 'bg-[#FFFDF9] text-[#2C2A29] font-medium shadow-xs'
                      : 'text-[#7A756E]'
                  }`}
                >
                  註冊新帳號
                </button>
              </div>

              <div className="space-y-2">
                {authMode === 'signup' && (
                  <div>
                    <label htmlFor="auth-nickname" className="sr-only">
                      筆名（選填）
                    </label>
                    <input
                      id="auth-nickname"
                      type="text"
                      value={signupNicknameInput}
                      onChange={(e) => setSignupNicknameInput(e.target.value)}
                      maxLength={16}
                      placeholder="你的筆名（選填，例如：微光筆友）"
                      className="w-full min-h-[42px] px-3 rounded-[8px] bg-[#F9F7F2] border border-[#E6E1D6] text-xs text-[#2C2A29] placeholder:text-[#B5AEA4] focus:outline-none focus:border-[#9E4737]"
                    />
                  </div>
                )}
                <div>
                  <label htmlFor="auth-email" className="sr-only">
                    電子信箱
                  </label>
                  <input
                    id="auth-email"
                    type="email"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    placeholder="電子信箱（例如：writer@example.com）"
                    autoComplete="email"
                    className="w-full min-h-[42px] px-3 rounded-[8px] bg-[#F9F7F2] border border-[#E6E1D6] text-xs text-[#2C2A29] placeholder:text-[#B5AEA4] focus:outline-none focus:border-[#9E4737]"
                  />
                </div>
                <div>
                  <label htmlFor="auth-password" className="sr-only">
                    密碼
                  </label>
                  <input
                    id="auth-password"
                    type="password"
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    placeholder="密碼（至少 6 個字元）"
                    autoComplete={
                      authMode === 'signin' ? 'current-password' : 'new-password'
                    }
                    className="w-full min-h-[42px] px-3 rounded-[8px] bg-[#F9F7F2] border border-[#E6E1D6] text-xs text-[#2C2A29] placeholder:text-[#B5AEA4] focus:outline-none focus:border-[#9E4737]"
                  />
                </div>
              </div>

              {authError && (
                <p role="alert" className="text-xs text-[#9E4737]">
                  {authError}
                </p>
              )}

              {authNotice && (
                <p role="status" className="text-xs text-[#5C6B54]">
                  {authNotice}
                </p>
              )}

              <button
                type="submit"
                disabled={authBusy}
                className="w-full min-h-[42px] rounded-[8px] bg-[#5C6B54] hover:bg-[#4D5B46] text-[#FFFDF9] text-xs font-medium transition-colors cursor-pointer disabled:opacity-60"
              >
                {authBusy
                  ? '處理中…'
                  : authMode === 'signin'
                    ? '登入並同步本子'
                    : '註冊並啟用雲端同步'}
              </button>
            </form>
          )}
      </div>

      {/* PWA Home Screen Install Prompt Card (auto-hidden when already installed) */}
      <PWAInstallButton variant="card" />

      {/* My Diaries Archive */}
      <div>
        <div className="flex items-baseline justify-between mb-3">
          <h3 className="font-serif text-[17px] font-semibold text-[#2C2A29]">
            我寫過的日記
          </h3>
          <span className="text-xs text-[#7A756E] tabular-nums">
            共 {myDiaries.length} 篇
          </span>
        </div>

        <div className="space-y-4">
          {myDiaries.length === 0 ? (
            <div className="bg-[#FFFDF9] border border-[#E6E1D6] rounded-[12px] p-6 text-center">
              <p className="font-serif text-sm text-[#7A756E]">
                {authEmail
                  ? '這本筆記還沒有留下任何篇章，去「寫日記」寫下第一頁吧。'
                  : '登入或註冊帳號後，你寫下的每篇日記都會收藏在這本筆記裡。'}
              </p>
            </div>
          ) : (
            myDiaries.map((diary) => (
              <DiaryCard
                key={`${currentUserId ?? 'anon'}-${diary.id}`}
                diary={diary}
                currentUserId={currentUserId ?? undefined}
              />
            ))
          )}
        </div>
      </div>

      {/* Blocked Users Management Card (Always visible) */}
      <div className="bg-[#FFFDF9] border border-[#E6E1D6] rounded-[12px] p-5 shadow-[0_2px_12px_rgba(44,42,41,0.03)] space-y-3">
        <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-[#E6E1D6]/80">
          <div className="flex items-center gap-2">
            <ShieldBan className="w-4 h-4 text-[#7A756E] shrink-0" />
            <h3 className="font-serif text-[16px] font-semibold text-[#2C2A29]">
              已封鎖名單（Blocked Users）
            </h3>
          </div>
          <span className="text-xs text-[#7A756E] tabular-nums shrink-0">
            {blockedUsers.length} 位
          </span>
        </div>

        {blockedUsers.length === 0 ? (
          <p className="text-xs text-[#7A756E] text-center py-2">
            目前沒有已封鎖的筆友
          </p>
        ) : (
          <ul className="divide-y divide-[#E6E1D6]/70">
            {blockedUsers.map((user) => (
              <li
                key={user.userId}
                className="py-2.5 first:pt-1 last:pb-1 flex items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <p className="font-serif text-[14px] font-medium text-[#2C2A29] truncate">
                    {user.name || '匿名筆友'}
                  </p>
                  {user.blockedAt && (
                    <p className="text-[11px] text-[#7A756E]">
                      封鎖時間：{user.blockedAt}
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => onUnblockUser(user.userId)}
                  className="min-h-[34px] px-3 rounded-[8px] border border-[#E6E1D6] bg-[#F9F7F2] hover:bg-[#F2ECE0] text-xs font-medium text-[#5C6B54] hover:text-[#2C2A29] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  解除封鎖
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
