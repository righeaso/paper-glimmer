import {Sparkles, X, ArrowRight} from 'lucide-react';
import {AnimatePresence, motion} from 'motion/react';

interface UnlockBannerProps {
  partnerName: string | null;
  onDismiss: () => void;
  onGoToChat: () => void;
}

export function UnlockBanner({
  partnerName,
  onDismiss,
  onGoToChat,
}: UnlockBannerProps) {
  return (
    <AnimatePresence>
      {partnerName && (
        <motion.div
          initial={{opacity: 0, y: -16}}
          animate={{opacity: 1, y: 0}}
          exit={{opacity: 0, y: -16}}
          transition={{duration: 0.22, ease: [0.16, 1, 0.3, 1]}}
          role="status"
          aria-live="polite"
          className="fixed top-3 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-24px)] max-w-[456px]"
        >
          <div className="bg-[#FFFDF9] border border-[#9E4737]/40 rounded-[12px] shadow-[0_8px_28px_rgba(44,42,41,0.12)] p-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-[#9E4737]/10 text-[#9E4737] flex items-center justify-center shrink-0 mt-0.5">
                <Sparkles className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-serif text-[14px] leading-relaxed text-[#2C2A29] font-semibold">
                  ✨ 心意相通！你們都回應了彼此的日記，已為你們開啟專屬對話空間
                </p>
                <div className="mt-2.5 flex items-center justify-between gap-2">
                  <span className="text-xs text-[#7A756E]">
                    已與「{partnerName}」成為筆友
                  </span>
                  <button
                    type="button"
                    onClick={onGoToChat}
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-[#9E4737] hover:text-[#7E3528] py-1.5 px-2.5 rounded-[8px] bg-[#9E4737]/8 hover:bg-[#9E4737]/14 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    <span>前往對話</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              <button
                type="button"
                onClick={onDismiss}
                aria-label="關閉提示"
                className="min-w-[36px] min-h-[36px] -mt-1 -mr-1 flex items-center justify-center text-[#7A756E] hover:text-[#2C2A29] rounded-[8px] transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
