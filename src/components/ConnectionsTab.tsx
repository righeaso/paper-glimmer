import {FormEvent, useEffect, useRef, useState} from 'react';
import {
  ArrowLeft,
  ChevronRight,
  Feather,
  Send,
  Sparkles,
} from 'lucide-react';
import {REACTION_OPTIONS} from '../data/diaryConstants';
import {
  IncomingGlimmer,
  ReactionKey,
  SafetyTarget,
  UnlockedConnection,
} from '../types/diary';

interface ConnectionsTabProps {
  pendingGlimmers: IncomingGlimmer[];
  unlockedConnections: UnlockedConnection[];
  activePartnerId: string | null;
  onSelectPartner: (partnerId: string | null) => void;
  onJumpToDiary: (diaryId: string) => void;
  onSendMessage: (partnerId: string, text: string) => void;
  onReportPartner?: (target: SafetyTarget) => void;
  onBlockPartner?: (target: SafetyTarget) => void;
}

function getReactionLabelWithEmoji(reaction: ReactionKey): string {
  const found = REACTION_OPTIONS.find((item) => item.key === reaction);
  return found ? `${found.label} ${found.emoji}` : reaction;
}

export function ConnectionsTab({
  pendingGlimmers,
  unlockedConnections,
  activePartnerId,
  onSelectPartner,
  onJumpToDiary,
  onSendMessage,
  onReportPartner,
  onBlockPartner,
}: ConnectionsTabProps) {
  const [draft, setDraft] = useState('');
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const activeChat = unlockedConnections.find(
    (conn) => conn.partnerId === activePartnerId,
  );

  useEffect(() => {
    if (activeChat) {
      messagesEndRef.current?.scrollIntoView({behavior: 'smooth'});
    }
  }, [activeChat, activeChat?.messages.length]);

  const handleSubmitMessage = (e: FormEvent) => {
    e.preventDefault();
    if (!activeChat) return;
    const trimmed = draft.trim();
    if (!trimmed) return;
    onSendMessage(activeChat.partnerId, trimmed);
    setDraft('');
  };

  if (activeChat) {

    return (
      <section aria-label="專屬對話空間" className="pt-2 flex flex-col min-h-[calc(100vh-160px)]">
        {/* Chat Sub-Header */}
        <div className="flex items-center justify-between gap-2 pb-3 border-b border-[#E6E1D6]">
          <div className="flex items-center gap-2 min-w-0">
            <button
              type="button"
              onClick={() => onSelectPartner(null)}
              className="min-w-[44px] min-h-[44px] -ml-2 flex items-center justify-center text-[#7A756E] hover:text-[#2C2A29] rounded-[10px] transition-colors cursor-pointer shrink-0"
              aria-label="返回心意連結列表"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="min-w-0 flex-1">
              <h2 className="font-serif text-[17px] font-semibold text-[#2C2A29] truncate">
                {activeChat.partnerName}
              </h2>
              <p className="text-[11px] text-[#7A756E] truncate">
                {activeChat.unlockedAt} 開啟對話
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {onReportPartner && (
              <button
                type="button"
                onClick={() =>
                  onReportPartner({
                    targetUserId: activeChat.partnerId,
                    targetName: activeChat.partnerName,
                    source: 'chat',
                  })
                }
                className="min-h-[32px] px-2.5 rounded-[6px] border border-[#E6E1D6] bg-[#FFFDF9] hover:bg-[#F2ECE0] text-[11px] font-medium text-[#7A756E] hover:text-[#2C2A29] transition-colors whitespace-nowrap cursor-pointer"
              >
                檢舉
              </button>
            )}
            {onBlockPartner && (
              <button
                type="button"
                onClick={() =>
                  onBlockPartner({
                    targetUserId: activeChat.partnerId,
                    targetName: activeChat.partnerName,
                    source: 'chat',
                  })
                }
                className="min-h-[32px] px-2.5 rounded-[6px] border border-[#E6E1D6] bg-[#FFFDF9] hover:bg-[#9E4737]/10 hover:border-[#9E4737]/40 text-[11px] font-medium text-[#7A756E] hover:text-[#9E4737] transition-colors whitespace-nowrap cursor-pointer"
              >
                封鎖
              </button>
            )}
          </div>
        </div>

        {/* Encounter Dual-Diary Summary Header */}
        <div className="mt-3 bg-[#FFFDF9] border border-[#E6E1D6] rounded-[12px] p-4 space-y-3 shadow-[0_2px_10px_rgba(44,42,41,0.025)]">
          <div className="flex items-center gap-1.5 text-xs font-medium text-[#9E4737]">
            <Sparkles className="w-3.5 h-3.5 shrink-0" />
            <span>你們因彼此的日記而相遇</span>
          </div>

          <div className="grid grid-cols-1 gap-2.5">
            <div className="bg-[#F9F7F2] rounded-[8px] p-3 border border-[#E6E1D6]/70">
              <div className="flex items-center justify-between gap-2 text-[11px] text-[#7A756E] mb-1">
                <span>你的日記 ·《{activeChat.myDiaryTitle}》</span>
                <span className="text-[#5C6B54] font-medium shrink-0">
                  對方回應：{getReactionLabelWithEmoji(activeChat.partnerReactionToMe)}
                </span>
              </div>
              <p className="font-serif text-xs text-[#2C2A29]/85 line-clamp-2 leading-relaxed">
                {activeChat.myDiaryExcerpt}
              </p>
            </div>

            <div className="bg-[#F9F7F2] rounded-[8px] p-3 border border-[#E6E1D6]/70">
              <div className="flex items-center justify-between gap-2 text-[11px] text-[#7A756E] mb-1">
                <span>{activeChat.partnerName} 的日記 ·《{activeChat.theirDiaryTitle}》</span>
                <span className="text-[#9E4737] font-medium shrink-0">
                  你回應：{getReactionLabelWithEmoji(activeChat.myReactionToThem)}
                </span>
              </div>
              <p className="font-serif text-xs text-[#2C2A29]/85 line-clamp-2 leading-relaxed">
                {activeChat.theirDiaryExcerpt}
              </p>
            </div>
          </div>
        </div>

        {/* Messages Thread */}
        <div className="flex-1 py-4 space-y-3">
          {activeChat.messages.length === 0 ? (
            <div className="py-6 text-center">
              <p className="font-serif text-sm text-[#7A756E]">
                從那篇打動彼此的日記開始，寫下第一句問候吧。
              </p>
            </div>
          ) : (
            activeChat.messages.map((msg) => {
              const isMe = msg.sender === 'me';
              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${
                    isMe ? 'items-end' : 'items-start'
                  }`}
                >
                  <div
                    className={`max-w-[82%] rounded-[12px] px-4 py-2.5 text-[14px] leading-relaxed ${
                      isMe
                        ? 'bg-[#5C6B54] text-[#FFFDF9]'
                        : 'bg-[#FFFDF9] border border-[#E6E1D6] text-[#2C2A29] font-serif'
                    }`}
                  >
                    {msg.text}
                  </div>
                  <span className="text-[10px] text-[#7A756E] mt-1 px-1 tabular-nums">
                    {msg.timestamp}
                  </span>
                </div>
              );
            })
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Message Input */}
        <form
          onSubmit={handleSubmitMessage}
          className="sticky bottom-[76px] pt-2 pb-1 bg-[#F9F7F2]"
        >
          <div className="flex items-center gap-2 bg-[#FFFDF9] border border-[#E6E1D6] rounded-[12px] p-1.5 shadow-[0_2px_10px_rgba(44,42,41,0.03)]">
            <label htmlFor="chat-input" className="sr-only">
              輸入訊息
            </label>
            <input
              id="chat-input"
              type="text"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder={`寫一則訊息給 ${activeChat.partnerName}…`}
              className="flex-1 min-h-[40px] px-3 bg-transparent text-[14px] text-[#2C2A29] placeholder:text-[#B5AEA4] focus:outline-none"
            />
            <button
              type="submit"
              disabled={!draft.trim()}
              aria-label="傳送訊息"
              className="min-w-[44px] min-h-[40px] px-3.5 rounded-[9px] bg-[#9E4737] disabled:bg-[#E6E1D6] text-[#FFFDF9] disabled:text-[#7A756E] flex items-center justify-center gap-1.5 text-xs font-medium transition-colors cursor-pointer disabled:cursor-not-allowed"
            >
              <Send className="w-3.5 h-3.5" />
              <span>寄出</span>
            </button>
          </div>
        </form>
      </section>
    );
  }

  return (
    <section aria-label="心意連結" className="pt-3 space-y-7">
      {/* Upper Section: 待回應的微光 */}
      <div>
        <div className="flex items-baseline justify-between mb-3">
          <h2 className="font-serif text-[17px] font-semibold text-[#2C2A29]">
            待回應的微光
          </h2>
          <span className="text-xs text-[#7A756E] tabular-nums">
            {pendingGlimmers.length} 位筆友曾駐足
          </span>
        </div>

        {pendingGlimmers.length === 0 ? (
          <div className="bg-[#FFFDF9] border border-[#E6E1D6] rounded-[12px] p-5 text-center">
            <p className="text-sm text-[#7A756E] leading-relaxed">
              目前沒有等待回應的單向微光，去日記牆看看其他人的故事吧。
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {pendingGlimmers.map((glimmer) => (
              <button
                key={glimmer.fromAuthorId}
                type="button"
                onClick={() => onJumpToDiary(glimmer.theirDiaryId)}
                className="w-full text-left bg-[#FFFDF9] hover:bg-[#FAF7F0] border border-[#E6E1D6] rounded-[12px] p-4 shadow-[0_2px_10px_rgba(44,42,41,0.025)] transition-colors flex items-center justify-between gap-3 cursor-pointer"
              >
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="font-medium text-[#2C2A29] text-[14px]">
                      {glimmer.fromAuthorName}
                    </span>
                    <span className="text-[#7A756E]" aria-hidden="true">
                      ·
                    </span>
                    <span className="text-[#7A756E]">{glimmer.reactedAt}</span>
                  </div>
                  <p className="text-xs text-[#5C6B54] truncate">
                    對你的《{glimmer.myDiaryTitle}》送出{' '}
                    {getReactionLabelWithEmoji(glimmer.reaction)}
                  </p>
                  <p className="text-[11px] text-[#7A756E]">
                    點擊前往閱讀對方的日記，若也有共鳴即可開啟對話
                  </p>
                </div>
                <div className="shrink-0 flex items-center gap-1 text-xs font-medium text-[#9E4737]">
                  <span>去讀日記</span>
                  <ChevronRight className="w-4 h-4" />
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Lower Section: 已雙向解鎖的對話 */}
      <div>
        <div className="flex items-baseline justify-between mb-3">
          <h2 className="font-serif text-[17px] font-semibold text-[#2C2A29]">
            已雙向解鎖的對話
          </h2>
          <span className="text-xs text-[#7A756E] tabular-nums">
            {unlockedConnections.length} 間對話室
          </span>
        </div>

        {unlockedConnections.length === 0 ? (
          <div className="bg-[#FFFDF9] border border-[#E6E1D6] rounded-[12px] p-6 text-center space-y-2">
            <div className="w-9 h-9 rounded-full bg-[#F3EFE6] text-[#7A756E] flex items-center justify-center mx-auto">
              <Feather className="w-4 h-4" />
            </div>
            <p className="font-serif text-[14px] text-[#2C2A29]">
              還沒有已解鎖的專屬對話
            </p>
            <p className="text-xs text-[#7A756E] leading-relaxed max-w-[300px] mx-auto">
              當你與另一位寫作者彼此回應對方的日記時，專屬的對話空間就會在這裡靜靜開啟。
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {unlockedConnections.map((conn) => {
              const lastMsg = conn.messages[conn.messages.length - 1];
              return (
                <button
                  key={conn.partnerId}
                  type="button"
                  onClick={() => onSelectPartner(conn.partnerId)}
                  className="w-full text-left bg-[#FFFDF9] hover:bg-[#FAF7F0] border border-[#E6E1D6] rounded-[12px] p-4 shadow-[0_2px_10px_rgba(44,42,41,0.025)] transition-colors flex items-center justify-between gap-3 cursor-pointer"
                >
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-serif font-semibold text-[15px] text-[#2C2A29]">
                        {conn.partnerName}
                      </span>
                      <span className="text-[11px] text-[#7A756E] tabular-nums shrink-0">
                        {lastMsg ? lastMsg.timestamp : conn.unlockedAt}
                      </span>
                    </div>
                    <p className="text-xs text-[#7A756E] truncate">
                      {lastMsg
                        ? `${lastMsg.sender === 'me' ? '你：' : ''}${lastMsg.text}`
                        : `因《${conn.myDiaryTitle}》與《${conn.theirDiaryTitle}》而相遇`}
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[#7A756E] shrink-0" />
                </button>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
