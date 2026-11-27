import {useEffect} from 'react';
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

interface DiaryWallProps {
  diaries: DiaryEntry[];
  currentUserId: string | null;
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
  onReportAuthor: (target: SafetyTarget) => void;
  onBlockAuthor: (target: SafetyTarget) => void;
}

export function DiaryWall({
  diaries,
  currentUserId,
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
  onReportAuthor,
  onBlockAuthor,
}: DiaryWallProps) {
  const filteredDiaries =
    activeFilter === '全部'
      ? diaries
      : diaries.filter((diary) => diary.mood === activeFilter);

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

      {/* Diary Cards Feed */}
      <div className="mt-4 space-y-4">
        {filteredDiaries.length === 0 ? (
          <div className="bg-[#FFFDF9] border border-[#E6E1D6] rounded-[12px] p-8 text-center space-y-4">
            <p className="font-serif text-[15px] text-[#7A756E] leading-relaxed">
              {!currentUserId
                ? '登入雲端帳號後，即可閱讀日記牆並分享今天的心情。'
                : activeFilter === '全部'
                  ? '今天還沒有人留下微光，成為第一個寫下心情的人吧'
                  : `目前還沒有「${activeFilter}」心情的日記，換個分類看看吧。`}
            </p>
            {(activeFilter === '全部' || !currentUserId) && (
              <button
                type="button"
                onClick={onGoToWriteOrSignIn}
                className="min-h-[40px] px-4 rounded-[8px] border border-[#E6E1D6] bg-[#F9F7F2] hover:bg-[#F2ECE0] text-xs font-medium text-[#2C2A29] transition-colors cursor-pointer"
              >
                {currentUserId ? '去寫今日日記' : '前往登入或註冊'}
              </button>
            )}
          </div>
        ) : (
          filteredDiaries.map((diary) => {
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
          })
        )}
      </div>
    </section>
  );
}
