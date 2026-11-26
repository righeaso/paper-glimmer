import {FormEvent, useEffect, useState} from 'react';
import {Check, RefreshCw} from 'lucide-react';
import {MOOD_OPTIONS, WRITING_PROMPTS} from '../data/diaryConstants';
import {DiaryEntry, MoodTag} from '../types/diary';

interface WriteDiaryProps {
  isAuthenticated: boolean;
  todayDateStr: string;
  todaysDiary: DiaryEntry | null;
  onPublishDiary: (payload: {
    title: string;
    content: string;
    mood: MoodTag;
  }) => void;
  onUpdateTodaysDiary: (payload: {
    id: string;
    title: string;
    content: string;
    mood: MoodTag;
  }) => void;
  onGoToSignIn: () => void;
}

export function WriteDiary({
  isAuthenticated,
  todayDateStr,
  todaysDiary,
  onPublishDiary,
  onUpdateTodaysDiary,
  onGoToSignIn,
}: WriteDiaryProps) {
  const [promptIndex, setPromptIndex] = useState(0);
  const [selectedMood, setSelectedMood] = useState<MoodTag>(MoodTag.CALM);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [justUpdatedNotice, setJustUpdatedNotice] = useState(false);

  // Reset local editor state whenever todaysDiary or account changes
  useEffect(() => {
    if (!todaysDiary) {
      setIsEditing(false);
      setJustUpdatedNotice(false);
    }
  }, [todaysDiary]);

  if (!isAuthenticated) {
    return (
      <section aria-label="寫日記" className="pt-3">
        <div className="bg-[#FFFDF9] border border-[#E6E1D6] rounded-[12px] shadow-[0_2px_12px_rgba(44,42,41,0.03)] p-7 text-center space-y-4">
          <h2 className="font-serif text-[17px] font-semibold text-[#2C2A29]">
            先登入帳號，再寫下今日信箋
          </h2>
          <p className="font-serif text-[14px] text-[#7A756E] leading-relaxed">
            登入或建立帳號後，你寫下的每篇日記都會安全保存於雲端本子，並依你的真實紀錄維持每日一篇的書寫節奏。
          </p>
          <button
            type="button"
            onClick={onGoToSignIn}
            className="min-h-[44px] px-5 bg-[#5C6B54] hover:bg-[#4D5B46] text-[#FFFDF9] text-[13px] font-medium rounded-[10px] transition-colors cursor-pointer"
          >
            前往登入或註冊
          </button>
        </div>
      </section>
    );
  }

  const handleNextPrompt = () => {
    setPromptIndex((prev) => (prev + 1) % WRITING_PROMPTS.length);
  };

  const handleStartEdit = () => {
    if (!todaysDiary) return;
    setSelectedMood(todaysDiary.mood);
    setTitle(todaysDiary.title);
    setContent(todaysDiary.content);
    setErrorMsg('');
    setJustUpdatedNotice(false);
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setErrorMsg('');
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmedTitle = title.trim();
    const trimmedContent = content.trim();

    if (!trimmedTitle) {
      setErrorMsg('請為這篇日記取一個簡短的標題。');
      return;
    }
    if (!trimmedContent) {
      setErrorMsg('寫下幾句今天的心情或日常吧。');
      return;
    }

    setErrorMsg('');

    if (todaysDiary && isEditing) {
      onUpdateTodaysDiary({
        id: todaysDiary.id,
        title: trimmedTitle,
        content: trimmedContent,
        mood: selectedMood,
      });
      setIsEditing(false);
      setJustUpdatedNotice(true);
      return;
    }

    onPublishDiary({
      title: trimmedTitle,
      content: trimmedContent,
      mood: selectedMood,
    });
    setTitle('');
    setContent('');
  };

  // Sealed Preview Card State (Already published today & not editing)
  if (todaysDiary && !isEditing) {
    const displayTime =
      todaysDiary.isEdited && todaysDiary.updatedAt
        ? todaysDiary.updatedAt
        : todaysDiary.createdAt;

    return (
      <section aria-label="寫日記" className="pt-3 space-y-5">
        <div className="bg-[#FFFDF9] border border-[#E6E1D6] rounded-[12px] shadow-[0_2px_12px_rgba(44,42,41,0.03)] p-5">
          {/* Status Header */}
          <div className="flex items-center justify-between gap-2 pb-4 border-b border-[#E6E1D6]/80">
            <div>
              <h2 className="font-serif text-[17px] font-semibold text-[#2C2A29]">
                今日信箋已封存
              </h2>
              <p className="text-xs text-[#7A756E] mt-0.5 tabular-nums">
                {todayDateStr} · 每日限發布一篇，當日仍可隨時修訂
              </p>
            </div>
            <span className="text-xs font-medium text-[#5C6B54] bg-[#5C6B54]/10 border border-[#5C6B54]/25 px-2.5 py-1 rounded-[6px] whitespace-nowrap shrink-0">
              {todaysDiary.mood}
            </span>
          </div>

          {justUpdatedNotice && (
            <div
              role="status"
              className="mt-3 flex items-center gap-1.5 text-xs text-[#5C6B54] bg-[#5C6B54]/8 border border-[#5C6B54]/20 rounded-[8px] px-3 py-2"
            >
              <Check className="w-3.5 h-3.5 shrink-0" />
              <span>已更新今日信箋，日記牆與我的本子皆已同步。</span>
            </div>
          )}

          {/* Today's Diary Content Preview */}
          <div className="mt-4">
            <div className="flex items-center justify-between gap-2 text-xs text-[#7A756E] mb-2">
              <span>最後更新：{displayTime}</span>
              {todaysDiary.isEdited && (
                <span className="text-[#9E4737]">（已編輯）</span>
              )}
            </div>

            <h3 className="font-serif text-[18px] font-semibold text-[#2C2A29] leading-snug mb-2.5">
              {todaysDiary.title}
            </h3>
            <p className="font-serif text-[15px] text-[#2C2A29]/90 leading-[1.85] tracking-[0.01em] whitespace-pre-line">
              {todaysDiary.content}
            </p>
          </div>

          {/* Secondary Edit Button */}
          <div className="mt-5 pt-4 border-t border-[#E6E1D6]/80">
            <button
              type="button"
              onClick={handleStartEdit}
              className="w-full min-h-[44px] bg-[#F9F7F2] hover:bg-[#F2ECE0] border border-[#E6E1D6] text-[#2C2A29] text-[14px] font-medium rounded-[10px] transition-colors cursor-pointer active:scale-[0.99]"
            >
              修改今日日記 ✎
            </button>
          </div>
        </div>
      </section>
    );
  }

  // Write Mode or Edit Mode
  const inEditMode = Boolean(todaysDiary && isEditing);

  return (
    <section aria-label="寫日記" className="pt-3 space-y-5">
      {/* Top Prompt Card OR Revision Hint */}
      {inEditMode ? (
        <div className="bg-[#F3EFE6] border border-[#E6E1D6] rounded-[12px] p-4">
          <p className="font-serif text-[14px] text-[#5C6B54] leading-relaxed font-medium">
            正在修訂今日信箋（不影響已收到的心情回應）
          </p>
        </div>
      ) : (
        <div className="bg-[#F3EFE6] border border-[#E6E1D6] rounded-[12px] p-4">
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="text-xs font-medium text-[#5C6B54] tracking-wide">
              今日引導小題
            </span>
            <button
              type="button"
              onClick={handleNextPrompt}
              className="inline-flex items-center gap-1.5 text-xs text-[#7A756E] hover:text-[#2C2A29] py-1.5 px-2.5 rounded-[8px] hover:bg-[#FFFDF9]/70 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>換個題目</span>
            </button>
          </div>
          <p className="font-serif text-[15px] text-[#2C2A29] leading-relaxed">
            {WRITING_PROMPTS[promptIndex]}
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Mood Tag Selector */}
        <div>
          <span className="block text-xs text-[#7A756E] mb-2">
            此刻的心情色調
          </span>
          <div className="grid grid-cols-4 gap-2">
            {MOOD_OPTIONS.map((mood) => {
              const isSelected = selectedMood === mood;
              return (
                <button
                  key={mood}
                  type="button"
                  onClick={() => setSelectedMood(mood)}
                  aria-pressed={isSelected}
                  className={`min-h-[42px] rounded-[10px] border text-[13px] transition-colors whitespace-nowrap cursor-pointer ${
                    isSelected
                      ? 'bg-[#5C6B54] border-[#5C6B54] text-[#FFFDF9] font-medium'
                      : 'bg-[#FFFDF9] border-[#E6E1D6] text-[#7A756E] hover:text-[#2C2A29]'
                  }`}
                >
                  {mood}
                </button>
              );
            })}
          </div>
        </div>

        {/* Lined Stationery Paper */}
        <div className="bg-[#FFFDF9] border border-[#E6E1D6] rounded-[12px] shadow-[0_2px_12px_rgba(44,42,41,0.03)] p-5">
          <label htmlFor="diary-title" className="sr-only">
            日記標題
          </label>
          <input
            id="diary-title"
            type="text"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              if (errorMsg) setErrorMsg('');
            }}
            placeholder="寫下今天的一個標題…"
            maxLength={40}
            className="w-full font-serif text-[18px] font-semibold text-[#2C2A29] placeholder:text-[#B5AEA4] bg-transparent border-b border-[#E6E1D6] pb-3 focus:outline-none focus:border-[#9E4737] transition-colors"
          />

          <label htmlFor="diary-content" className="sr-only">
            日記內文
          </label>
          <textarea
            id="diary-content"
            value={content}
            onChange={(e) => {
              setContent(e.target.value);
              if (errorMsg) setErrorMsg('');
            }}
            placeholder="把安靜的念頭、街角的微光，或是沒對人說的話留存在這張信紙上…"
            rows={7}
            className="w-full mt-2 font-serif text-[15px] text-[#2C2A29] placeholder:text-[#B5AEA4] bg-transparent stationery-lines resize-none focus:outline-none min-h-[224px]"
          />

          <div className="mt-3 pt-2 border-t border-[#E6E1D6]/60 flex items-center justify-between text-xs text-[#7A756E]">
            <span>以個人筆名發表於日記牆</span>
            <span className="tabular-nums">{content.length} 字</span>
          </div>
        </div>

        {errorMsg && (
          <p role="alert" className="text-xs text-[#9E4737] px-1">
            {errorMsg}
          </p>
        )}

        {inEditMode ? (
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={handleCancelEdit}
              className="min-h-[48px] px-5 bg-[#FFFDF9] hover:bg-[#F3EFE6] border border-[#E6E1D6] text-[#7A756E] hover:text-[#2C2A29] text-[14px] font-medium rounded-[12px] transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              取消
            </button>
            <button
              type="submit"
              className="flex-1 min-h-[48px] bg-[#9E4737] hover:bg-[#8A3B2D] active:scale-[0.99] text-[#FFFDF9] text-[14px] font-medium rounded-[12px] transition-all cursor-pointer shadow-[0_2px_10px_rgba(158,71,55,0.18)]"
            >
              儲存修改並更新
            </button>
          </div>
        ) : (
          <button
            type="submit"
            className="w-full min-h-[48px] bg-[#9E4737] hover:bg-[#8A3B2D] active:scale-[0.99] text-[#FFFDF9] text-[14px] font-medium rounded-[12px] transition-all cursor-pointer shadow-[0_2px_10px_rgba(158,71,55,0.18)]"
          >
            封存並投遞至日記牆
          </button>
        )}
      </form>
    </section>
  );
}
