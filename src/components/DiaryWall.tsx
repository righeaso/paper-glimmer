import {useEffect} from 'react';
import {Sparkles} from 'lucide-react';
import {MOOD_FILTERS} from '../data/diaryConstants';
import {
  DiaryEntry,
  IncomingGlimmer,
  MoodFilter,
  MoodTag,
  ReactionKey,
  SafetyTarget,
  UnlockedConnection,
} from '../types/diary';
import {DiaryCard} from './DiaryCard';

const GUEST_DIARY_LIMIT = 3;

interface DiaryWallProps {
  diaries: DiaryEntry[];
  currentUserId: string | null;
  isLoading?: boolean;
  todayDateStr: string;
  activeFilter: MoodFilter;
  onSelectFilter: (filter: MoodFilter) => void;
  pendingGlimmers: IncomingGlimmer[];
  unlockedConnections: UnlockedConnection[];
  highlightedDiaryId: string | null;
  onClearHighlight: () => void;
  onToggleReaction: (diaryId: string, reaction: ReactionKey) => void;
  onOpenPartnerChat: (authorId: string) => void;
  onUpdateTodaysDiary: (payload: {
    id: string;
    title: string;
    content: string;
    mood: MoodTag;
  }) => void;
  onGoToWriteOrSignIn: () => void;
  onOpenSignIn: () => void;
  onReportAuthor: (target: SafetyTarget) => void;
  onBlockAuthor: (target: SafetyTarget) => void;
}

export function DiaryWall({
  diaries,
  currentUserId,
  isLoading = false,
  todayDateStr,
  activeFilter,
  onSelectFilter,
  pendingGlimmers,
  unlockedConnections,
  highlightedDiaryId,
  onClearHighlight,
  onToggleReaction,
  onOpenPartnerChat,
  onUpdateTodaysDiary,
  onGoToWriteOrSignIn,
  onOpenSignIn,
  onReportAuthor,
  onBlockAuthor,
}: DiaryWallProps) {
  const isGuest = !currentUserId;
  const filteredDiaries =
    activeFilter === '全部'
      ? diaries
      : diaries.filter((diary) => diary.mood === activeFilter);
  const displayedDiaries = isGuest
    ? filteredDiaries.slice(0, GUEST_DIARY_LIMIT)
    : filteredDiaries;
  const hiddenCount = isGuest
    ? Math.max(0, filteredDiaries.length - displayedDiaries.length)
    : 0;

  useEffect(() => {
    if (!highlightedDiaryId) return;
    const el = document.getElementById(`diary-card-${highlightedDiaryId}`);
    if (el) {
      el.scrollIntoView({behavior: 'smooth', block: 'center'});
    }
    const timer = window.setTimeout(() => {
      onClearHighlight();
    }, 2600);
    return () => window.clearTimeout(timer);
  }, [highlightedDiaryId, onClearHighlight]);

  const pendingAuthorIds = new Set(
    pendingGlimmers.map((item) => item.fromAuthorId),
  );
  const unlockedPartnerIds = new Set(
    unlockedConnections.map((conn) => conn.partnerId),
  );

  return (
    <section aria-label="日記牆">
      {/* Mood Filter Capsule Bar */}
      <div className="sticky top-[56px] z-20 bg-[#F9F7F2]/95 backdrop-blur-sm py-3 -mx-4 px-4 border-b border-[#E6E1D6]/60">
        <div
          className="flex items-center gap-2 overflow-x-auto no-scrollbar"
          role="tablist"
          aria-label="心情篩選"
        >
          {MOOD_FILTERS.map((mood) => {
            const isActive = activeFilter === mood;
            return (
              <button
                key={mood}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => onSelectFilter(mood)}
                className={`min-h-[38px] px-4 rounded-full text-[13px] transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  isActive
                    ? 'bg-[#5C6B54] text-[#FFFDF9] font-medium'
                    : 'bg-[#FFFDF9] text-[#7A756E] border border-[#E6E1D6] hover:text-[#2C2A29] hover:border-[#7A756E]/50'
                }`}
              >
                {mood}
              </button>
            );
          })}
        </div>
      </div>

      {/* Subtle Guest Browsing Banner (Unauthenticated only) */}
      {isGuest && (
        <div
          role="status"
          className="mt-3 bg-[#FFFDF9] border border-[#E6E1D6] rounded-[10px] px-3.5 py-2.5 flex items-center justify-between gap-2.5 shadow-[0_1px_4px_rgba(44,42,41,0.02)]"
        >
          <p className="text-xs text-[#7A756E] leading-relaxed">
            目前為訪客瀏覽模式，登入後即可寫下日記或送出微光回應
          </p>
          <button
            type="button"
            onClick={onOpenSignIn}
            className="min-h-[34px] px-2.5 rounded-[7px] bg-[#5C6B54]/10 hover:bg-[#5C6B54]/20 text-xs font-medium text-[#5C6B54] hover:text-[#2C2A29] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            立即登入 →
          </button>
        </div>
      )}

      {/* Diary Cards Feed */}
      <div className="mt-4 space-y-4">
        {isLoading && displayedDiaries.length === 0 ? (
          <div className="bg-[#FFFDF9] border border-[#E6E1D6] rounded-[12px] p-8 text-center">
            <p className="font-serif text-[14px] text-[#7A756E]">
              正在載入公開日記牆…
            </p>
          </div>
        ) : displayedDiaries.length === 0 ? (
          <div className="bg-[#FFFDF9] border border-[#E6E1D6] rounded-[12px] p-8 text-center space-y-4">
            <p className="font-serif text-[15px] text-[#7A756E] leading-relaxed">
              {activeFilter === '全部'
                ? '今天還沒有人留下微光，成為第一個寫下心情的人吧'
                : `目前還沒有「${activeFilter}」心情的日記，換個分類看看吧。`}
            </p>
            {activeFilter === '全部' && (
              <button
                type="button"
                onClick={onGoToWriteOrSignIn}
                className="min-h-[40px] px-4 rounded-[8px] border border-[#E6E1D6] bg-[#F9F7F2] hover:bg-[#F2ECE0] text-xs font-medium text-[#2C2A29] transition-colors cursor-pointer"
              >
                去寫今日日記
              </button>
            )}
          </div>
        ) : (
          <>
            {displayedDiaries.map((diary) => {
              const isOwnedByCurrentUser = Boolean(
                currentUserId &&
                  (diary.authorId === currentUserId ||
                    diary.userId === currentUserId),
              );
              const isPublishedToday =
                (diary.publishedDate || diary.entryDate) === todayDateStr;
              const canInlineEdit = Boolean(
                isOwnedByCurrentUser && isPublishedToday,
              );

              return (
                <DiaryCard
                  key={`${currentUserId ?? 'anon'}-${diary.id}`}
                  diary={diary}
                  currentUserId={currentUserId ?? undefined}
                  hasPendingIncomingGlimmer={pendingAuthorIds.has(diary.authorId)}
                  isUnlockedPartner={unlockedPartnerIds.has(diary.authorId)}
                  isHighlighted={highlightedDiaryId === diary.id}
                  canInlineEdit={canInlineEdit}
                  onToggleReaction={onToggleReaction}
                  onOpenPartnerChat={onOpenPartnerChat}
                  onSaveInlineEdit={onUpdateTodaysDiary}
                  onReportAuthor={onReportAuthor}
                  onBlockAuthor={onBlockAuthor}
                />
              );
            })}

            {/* Guest Limit Unlock Prompt Card (shown below the 3rd diary card when logged out) */}
            {isGuest && (
              <div className="bg-[#FFFDF9] border border-[#E6E1D6] rounded-[12px] p-6 shadow-[0_2px_12px_rgba(44,42,41,0.03)] text-center space-y-4">
                <div className="w-10 h-10 rounded-full bg-[#F3EFE6] text-[#5C6B54] flex items-center justify-center mx-auto">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div className="space-y-1.5">
                  <p className="font-serif text-[14px] text-[#2C2A29]/90 leading-[1.8] max-w-[320px] mx-auto">
                    想閱讀更多溫暖的微光故事嗎？登入帳號即可解鎖完整日記牆，並能寫下你的日記與送出心意回應。
                  </p>
                  {hiddenCount > 0 && (
                    <p className="text-[11px] text-[#7A756E] tabular-nums">
                      訪客試閱顯示前 {GUEST_DIARY_LIMIT} 篇 · 尚有 {hiddenCount} 篇公開日記等待解鎖
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={onOpenSignIn}
                  className="min-h-[44px] px-6 rounded-[10px] bg-[#5C6B54] hover:bg-[#4D5B46] text-[#FFFDF9] text-[13px] font-medium transition-colors whitespace-nowrap cursor-pointer"
                >
                  立即登入 / 註冊
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}
