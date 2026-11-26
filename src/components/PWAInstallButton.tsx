import {useState} from 'react';
import {Download, Share, X} from 'lucide-react';
import {usePWAInstall} from '../hooks/usePWAInstall';

interface PWAInstallButtonProps {
  variant?: 'compact' | 'card';
}

export function PWAInstallButton({variant = 'compact'}: PWAInstallButtonProps) {
  const {isInstallable, isInstalled, isIOS, install} = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  if (isInstalled) {
    return null;
  }

  if (!isInstallable && !isIOS) {
    return null;
  }

  const handleClick = () => {
    if (isInstallable) {
      void install();
    } else if (isIOS) {
      setShowIOSGuide(true);
    }
  };

  return (
    <>
      {variant === 'compact' ? (
        <button
          type="button"
          onClick={handleClick}
          className="min-h-[32px] px-2.5 rounded-[8px] border border-[#E6E1D6] bg-[#FFFDF9] hover:bg-[#F3EFE6] text-[11px] font-medium text-[#5C6B54] inline-flex items-center gap-1 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          <Download className="w-3 h-3" />
          <span>加入主畫面</span>
        </button>
      ) : (
        <div className="bg-[#FFFDF9] border border-[#E6E1D6] rounded-[12px] p-4 shadow-[0_2px_12px_rgba(44,42,41,0.03)] flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h3 className="font-serif text-[15px] font-semibold text-[#2C2A29]">
              將紙間微光加入主畫面
            </h3>
            <p className="text-xs text-[#7A756E] mt-0.5 leading-relaxed">
              以獨立視窗開啟，獲得更安靜純粹的書寫體驗。
            </p>
          </div>
          <button
            type="button"
            onClick={handleClick}
            className="min-h-[40px] px-3.5 rounded-[8px] bg-[#5C6B54] hover:bg-[#4D5B46] text-[#FFFDF9] text-xs font-medium inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>安裝 App</span>
          </button>
        </div>
      )}

      {showIOSGuide && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="ios-install-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#2C2A29]/45 p-4"
        >
          <div className="w-full max-w-[360px] rounded-[12px] bg-[#FFFDF9] border border-[#E6E1D6] p-5 shadow-[0_12px_32px_rgba(44,42,41,0.18)] space-y-3">
            <div className="flex items-start justify-between gap-2">
              <h3
                id="ios-install-title"
                className="font-serif text-[17px] font-semibold text-[#2C2A29]"
              >
                加入 iPhone / iPad 主畫面
              </h3>
              <button
                type="button"
                onClick={() => setShowIOSGuide(false)}
                aria-label="關閉安裝說明"
                className="min-w-[32px] min-h-[32px] flex items-center justify-center rounded-[8px] text-[#7A756E] hover:text-[#2C2A29] hover:bg-[#F3EFE6] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <ol className="space-y-2 text-xs text-[#2C2A29]/90 leading-relaxed list-decimal list-inside">
              <li>
                點擊 Safari 底部或上方工具列的{' '}
                <span className="inline-flex items-center gap-1 font-medium text-[#5C6B54]">
                  分享按鈕 <Share className="w-3.5 h-3.5 inline" />
                </span>
              </li>
              <li>
                向下捲動並選擇{' '}
                <span className="font-medium text-[#2C2A29]">
                  「加入主畫面」
                </span>
                ，再點擊右上角「新增」即可。
              </li>
            </ol>
            <button
              type="button"
              onClick={() => setShowIOSGuide(false)}
              className="w-full min-h-[42px] rounded-[8px] bg-[#5C6B54] hover:bg-[#4D5B46] text-[#FFFDF9] text-xs font-medium transition-colors cursor-pointer"
            >
              知道了
            </button>
          </div>
        </div>
      )}
    </>
  );
}
