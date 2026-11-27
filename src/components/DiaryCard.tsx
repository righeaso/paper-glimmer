import {FormEvent, useState} from 'react';
import {MessageCircle} from 'lucide-react';
import {MOOD_OPTIONS, REACTION_OPTIONS} from '../data/diaryConstants';
import {DiaryEntry, MoodTag, ReactionKey, SafetyTarget} from '../types/diary';

interface DiaryCardProps {
  diary: DiaryEntry;
  currentUserId?: string;
  hasPendingIncomingGlimmer?: boolean;
  isUnlockedPartner?: boolean;
  isHighlighted?: boolean;
  canInlineEdit?: boolean;
  onToggleReaction?: (diaryId: string, reaction: ReactionKey) => void;
  onOpenPartnerChat?: (authorId: string) => void;
  onSaveInlineEdit?: (payload: {
    id: string;
    title: string;
    content: string;
    mood: MoodTag;
  }) => void;
  onReportAuthor?: (target: SafetyTarget) => void;
  onBlockAuthor?: (target: SafetyTarget) => void;
}

export function DiaryCard({
  diary,
  currentUserId,
  hasPendingIncomingGlimmer = false,
  isUnlockedPartner = false,
  isHighlighted = false,
  canInlineEdit = false,
  onToggleReaction,
  onOpenPartnerChat,
  onSaveInlineEdit,
  onReportAuthor,
  onBlockAuthor,
}: DiaryCardProps) {
  const isOwnedByCurrentUser = currentUserId
    ? diary.authorId === currentUserId || diary.userId === currentUserId
    : false;
  const [isEditing, setIsEditing] = useState(false);
  const [editMood, setEditMood] = useState<MoodTag>(diary.mood);
  const [editTitle, setEditTitle] = useState(diary.title);
  const [editContent, setEditContent] = useState(diary.content);
  const [errorMsg, setErrorMsg] = useState('');

  const handleOpenEdit = () => {
    setEditMood(diary.mood);
    setEditTitle(diary.title);
    setEditContent(diary.content);
    setErrorMsg('');
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setErrorMsg('');
  };

  const handleSaveEdit = (e: FormEvent) => {
    e.preventDefault();
    const trimmedTitle = editTitle.trim();
    const trimmedContent = editContent.trim();

    if (!trimmedTitle) {
      setErrorMsg('請輸入日記標題。');
      return;
    }
    if (!trimmedContent) {
      setErrorMsg('請輸入日記內容。');
      return;
    }

    setErrorMsg('');
    onSaveInlineEdit?.({
      id: diary.id,
      title: trimmedTitle,
      content: trimmedContent,
      mood: editMood,
    });
    setIsEditing(false);
  };

  if (isEditing && canInlineEdit && onSaveInlineEdit) {
    return (
      <article
        id={`diary-card-${diary.id}`}
        className="bg-[#FFFDF9] border border-[#9E4737]/50 rounded-[12px] p-5 shadow-[0_4px_16px_rgba(44,42,41,0.05)]"
      >
        <form onSubmit={handleSaveEdit} className="space-y-3.5">
          <div className="flex items-center justify-between gap-2 pb-2 border-b border-[#E6E1D6]/80">
            <span className="text-xs font-medium text-[#5C6B54]">
              修訂今日日記（將同步至寫日記與我的本子）
            </span>
          </div>

          {/* Mood Tag Selector */}
          <div>
            <span className="block text-[11px] text-[#7A756E] mb-1.5">
              心情標籤
            </span>
            <div className="grid grid-cols-4 gap-1.5">
              {MOOD_OPTIONS.map((mood) => {
                const isSelected = editMood === mood;
                return (
                  <button
                    key={mood}
                    type="button"
                    onClick={() => setEditMood(mood)}
                    aria-pressed={isSelected}
                    className={`min-h-[38px] rounded-[8px] border text-xs transition-colors whitespace-nowrap cursor-pointer ${
                      isSelected
                        ? 'bg-[#5C6B54] border-[#5C6B54] text-[#FFFDF9] font-medium'
                        : 'bg-[#F9F7F2] border-[#E6E1D6] text-[#7A756E] hover:text-[#2C2A29]'
                    }`}
                  >
                    {mood}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Title Input */}
          <div>
            <label htmlFor={`inline-title-${diary.id}`} className="sr-only">
              日記標題
            </label>
            <input
              id={`inline-title-${diary.id}`}
              type="text"
              value={editTitle}
              onChange={(e) => {
                setEditTitle(e.target.value);
                if (errorMsg) setErrorMsg('');
              }}
              maxLength={40}
              placeholder="輸入日記標題…"
              className="w-full font-serif text-[17px] font-semibold text-[#2C2A29] placeholder:text-[#B5AEA4] bg-[#F9F7F2]/60 border border-[#E6E1D6] rounded-[8px] px-3 py-2 focus:outline-none focus:border-[#9E4737]"
            />
          </div>

          {/* Content Textarea */}
          <div>
            <label htmlFor={`inline-content-${diary.id}`} className="sr-only">
              日記內文
            </label>
            <textarea
              id={`inline-content-${diary.id}`}
              value={editContent}
              onChange={(e) => {
                setEditContent(e.target.value);
                if (errorMsg) setErrorMsg('');
              }}
              rows={5}
              placeholder="寫下今天的心情隨筆…"
              className="w-full font-serif text-[15px] text-[#2C2A29] leading-[1.8] placeholder:text-[#B5AEA4] bg-[#F9F7F2]/60 border border-[#E6E1D6] rounded-[8px] px-3 py-2.5 resize-none focus:outline-none focus:border-[#9E4737]"
            />
          </div>

          {errorMsg && (
            <p role="alert" className="text-xs text-[#9E4737]">
              {errorMsg}
            </p>
          )}

          {/* Save & Cancel Actions */}
          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={handleCancelEdit}
              className="min-h-[40px] px-4 rounded-[8px] border border-[#E6E1D6] bg-[#FFFDF9] hover:bg-[#F3EFE6] text-xs font-medium text-[#7A756E] hover:text-[#2C2A29] transition-colors cursor-pointer"
            >
              取消
            </button>
            <button
              type="submit"
              className="min-h-[40px] px-4 rounded-[8px] bg-[#9E4737] hover:bg-[#8A3B2D] text-xs font-medium text-[#FFFDF9] transition-colors cursor-pointer"
            >
              儲存修改
            </button>
          </div>
        </form>
      </article>
    );
  }

  return (
    <article
      id={`diary-card-${diary.id}`}
      className={`bg-[#FFFDF9] border rounded-[12px] p-5 shadow-[0_2px_12px_rgba(44,42,41,0.03)] transition-all duration-300 ${
        isHighlighted
          ? 'border-[#9E4737] ring-2 ring-[#9E4737]/20'
          : 'border-[#E6E1D6]'
      }`}
    >
      {/* Top metadata & inline edit / report & block buttons */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="min-w-0 space-y-1.5">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-[#7A756E]">
            <span className="font-medium text-[#2C2A29]">{diary.authorName}</span>
            <span aria-hidden="true">·</span>
            <span>
              {diary.isEdited && diary.updatedAt
                ? diary.updatedAt
                : diary.createdAt}
              {diary.isEdited ? '（已編輯）' : ''}
            </span>
            <span aria-hidden="true">·</span>
            <span className="text-[#5C6B54] font-medium">{diary.mood}</span>
          </div>

          {!isOwnedByCurrentUser && hasPendingIncomingGlimmer && (
            <div>
              <span className="inline-block text-[11px] font-medium text-[#5C6B54] bg-[#5C6B54]/10 border border-[#5C6B54]/25 px-2 py-0.5 rounded-[6px] whitespace-nowrap">
                對方曾回應過你的日記
              </span>
            </div>
          )}

          {!isOwnedByCurrentUser &&
            !hasPendingIncomingGlimmer &&
            isUnlockedPartner &&
            onOpenPartnerChat && (
              <div>
                <button
                  type="button"
                  onClick={() => onOpenPartnerChat(diary.authorId)}
                  className="inline-flex items-center gap-1 text-[11px] font-medium text-[#9E4737] hover:text-[#7E3528] bg-[#9E4737]/8 px-2 py-0.5 rounded-[6px] whitespace-nowrap transition-colors cursor-pointer"
                >
                  <MessageCircle className="w-3 h-3" />
                  <span>已解鎖對話</span>
                </button>
              </div>
            )}
        </div>

        {canInlineEdit && onSaveInlineEdit && (
          <button
            type="button"
            onClick={handleOpenEdit}
            className="text-[11px] font-medium text-[#7A756E] hover:text-[#2C2A29] bg-[#F9F7F2] hover:bg-[#F2ECE0] border border-[#E6E1D6] px-2.5 py-1 rounded-[6px] whitespace-nowrap shrink-0 transition-colors cursor-pointer"
          >
            ✎ 編輯
          </button>
        )}

        {!isOwnedByCurrentUser && (onReportAuthor || onBlockAuthor) && (
          <div className="flex items-center gap-1.5 shrink-0">
            {onReportAuthor && (
              <button
                type="button"
                onClick={() =>
                  onReportAuthor({
                    targetUserId: diary.authorId,
                    targetName: diary.authorName,
                    source: 'diary',
                    diaryId: diary.id,
                  })
                }
                className="min-h-[30px] px-2.5 rounded-[6px] border border-[#E6E1D6] bg-[#F9F7F2] hover:bg-[#F2ECE0] text-[11px] font-medium text-[#7A756E] hover:text-[#2C2A29] transition-colors whitespace-nowrap cursor-pointer"
              >
                檢舉
              </button>
            )}
            {onBlockAuthor && (
              <button
                type="button"
                onClick={() =>
                  onBlockAuthor({
                    targetUserId: diary.authorId,
                    targetName: diary.authorName,
                    source: 'diary',
                    diaryId: diary.id,
                  })
                }
                className="min-h-[30px] px-2.5 rounded-[6px] border border-[#E6E1D6] bg-[#F9F7F2] hover:bg-[#9E4737]/10 hover:border-[#9E4737]/40 text-[11px] font-medium text-[#7A756E] hover:text-[#9E4737] transition-colors whitespace-nowrap cursor-pointer"
              >
                封鎖
              </button>
            )}
          </div>
        )}
      </div>

      {/* Diary Title & Prose */}
      <h2 className="font-serif text-[18px] font-semibold text-[#2C2A29] leading-snug mb-2.5">
        {diary.title}
      </h2>
      <p className="font-serif text-[15px] text-[#2C2A29]/90 leading-[1.85] tracking-[0.01em] whitespace-pre-line">
        {diary.content}
      </p>

      {/* Reaction Buttons for other authors' diaries */}
      {!isOwnedByCurrentUser && onToggleReaction && (
        <div className="mt-5 pt-4 border-t border-[#E6E1D6]/80">
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-xs text-[#7A756E]">送出你的心意回應</span>
            {diary.myReaction && (
              <span className="text-xs font-medium text-[#9E4737]">
                已回應 · {diary.myReaction}
              </span>
            )}
          </div>
          <div className="grid grid-cols-2 gap-2">
            {REACTION_OPTIONS.map((option) => {
              const isSelected = diary.myReaction === option.key;
              return (
                <button
                  key={option.key}
                  type="button"
                  onClick={() => onToggleReaction(diary.id, option.key)}
                  aria-pressed={isSelected}
                  className={`min-h-[44px] px-3 py-2 rounded-[10px] border text-[13px] flex items-center justify-center gap-1.5 transition-all whitespace-nowrap cursor-pointer active:scale-[0.98] ${
                    isSelected
                      ? 'bg-[#9E4737]/10 border-[#9E4737] text-[#9E4737] font-medium'
                      : 'bg-[#F9F7F2] border-[#E6E1D6] text-[#2C2A29] hover:border-[#7A756E]/50 hover:bg-[#F3EFE6]'
                  }`}
                >
                  <span className="leading-none">{option.label}</span>
                  <span aria-hidden="true" className="text-[14px] leading-none">
                    {option.emoji}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Received reactions display for my own diary */}
      {isOwnedByCurrentUser &&
        diary.receivedReactions &&
        diary.receivedReactions.length > 0 && (
          <div className="mt-4 pt-3 border-t border-[#E6E1D6]/70 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-[#7A756E]">
            <span>收到回應：</span>
            {diary.receivedReactions.map((item, idx) => {
              const option = REACTION_OPTIONS.find(
                (r) => r.key === item.reaction,
              );
              return (
                <span
                  key={`${item.fromAuthorId}-${idx}`}
                  className="text-[#5C6B54]"
                >
                  {item.fromAuthorName}（{item.reaction} {option?.emoji}）
                </span>
              );
            })}
          </div>
        )}
    </article>
  );
}
