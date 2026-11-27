import {useState} from 'react';
import {
  ChevronDown,
  ChevronUp,
  Compass,
  PlusSquare,
  Share,
  Smartphone,
} from 'lucide-react';

interface IOSPwaGuideProps {
  variant?: 'footer' | 'modal' | 'card';
}

const APP_URL = 'https://paper-glimmer.vercel.app/';

export function IOSPwaGuide({variant = 'footer'}: IOSPwaGuideProps) {
  // Default expanded on Home footer and My Notebook so instructions are visible right away,
  // and collapsible so they stay unobtrusive; collapsed by default inside AuthModal to keep login focused.
  const [isOpen, setIsOpen] = useState(variant !== 'modal');

  const isModal = variant === 'modal';
  const isCard = variant === 'card';

  return (
    <div
      className={
        isModal
          ? 'rounded-[8px] border border-[#E6E1D6] bg-[#F9F7F2] text-left'
          : isCard
            ? 'bg-[#FFFDF9] border border-[#E6E1D6] rounded-[12px] p-5 shadow-[0_2px_12px_rgba(44,42,41,0.03)] text-left'
            : 'w-full max-w-[380px] mx-auto rounded-[10px] border border-[#E6E1D6] bg-[#FFFDF9] shadow-[0_1px_4px_rgba(44,42,41,0.03)] text-left'
      }
    >
      <button
        type="button"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((prev) => !prev)}
        className={`w-full flex items-center justify-between gap-2 text-left transition-colors cursor-pointer ${
          isCard
            ? 'min-h-[40px]'
            : isModal
              ? 'min-h-[40px] px-3 py-2'
              : 'min-h-[42px] px-3.5 py-2'
        }`}
      >
        <span className="inline-flex items-center gap-2 min-w-0">
          <Smartphone className="w-3.5 h-3.5 text-[#5C6B54] shrink-0" />
          <span
            className={
              isCard
                ? 'font-serif text-[15px] font-semibold text-[#2C2A29] truncate'
                : 'text-xs font-medium text-[#2C2A29] truncate'
            }
          >
            iPhone 加入主畫面（PWA）安裝引導
          </span>
        </span>
        <span className="inline-flex items-center gap-1 text-[11px] text-[#7A756E] shrink-0 whitespace-nowrap">
          <span>{isOpen ? '收合' : '查看步驟'}</span>
          {isOpen ? (
            <ChevronUp className="w-3.5 h-3.5" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5" />
          )}
        </span>
      </button>

      {isOpen && (
        <div
          className={
            isCard
              ? 'mt-3 pt-3 border-t border-[#E6E1D6]/70 space-y-2.5'
              : isModal
                ? 'px-3 pb-3 pt-2 border-t border-[#E6E1D6]/70 space-y-2'
                : 'px-3.5 pb-3.5 pt-2.5 border-t border-[#E6E1D6]/70 space-y-2.5'
          }
        >
          <ol className="space-y-2 text-[12px] text-[#2C2A29]/90 leading-relaxed">
            <li className="flex items-start gap-2">
              <span className="w-4 h-4 rounded-[4px] bg-[#F3EFE6] text-[#5C6B54] text-[10px] font-medium inline-flex items-center justify-center shrink-0 mt-0.5 tabular-nums">
                1
              </span>
              <div className="min-w-0">
                <span>使用 iPhone 的 </span>
                <span className="inline-flex items-center gap-1 font-medium text-[#2C2A29]">
                  <Compass className="w-3.5 h-3.5 text-[#5C6B54] inline" />
                  Safari 瀏覽器
                </span>
                <span> 開啟 </span>
                <a
                  href={APP_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#5C6B54] hover:text-[#2C2A29] underline underline-offset-2 break-all font-medium"
                >
                  {APP_URL}
                </a>
              </div>
            </li>

            <li className="flex items-start gap-2">
              <span className="w-4 h-4 rounded-[4px] bg-[#F3EFE6] text-[#5C6B54] text-[10px] font-medium inline-flex items-center justify-center shrink-0 mt-0.5 tabular-nums">
                2
              </span>
              <div>
                點擊底部工具列的{' '}
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-[5px] bg-[#F3EFE6] border border-[#E6E1D6] font-medium text-[#2C2A29]">
                  <Share className="w-3 h-3 text-[#5C6B54]" />
                  <span>分享</span>
                </span>{' '}
                圖示（方框向上箭頭）。
              </div>
            </li>

            <li className="flex items-start gap-2">
              <span className="w-4 h-4 rounded-[4px] bg-[#F3EFE6] text-[#5C6B54] text-[10px] font-medium inline-flex items-center justify-center shrink-0 mt-0.5 tabular-nums">
                3
              </span>
              <div>
                往下滑選擇{' '}
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-[5px] bg-[#F3EFE6] border border-[#E6E1D6] font-medium text-[#2C2A29]">
                  <PlusSquare className="w-3 h-3 text-[#5C6B54]" />
                  <span>加入主畫面</span>
                </span>{' '}
                並按右上角 <span className="font-medium text-[#2C2A29]">「新增」</span>，即可在桌面產生獨立 App 圖示全螢幕開啟。
              </div>
            </li>
          </ol>
        </div>
      )}
    </div>
  );
}
