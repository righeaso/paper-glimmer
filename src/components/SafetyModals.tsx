import {FormEvent, useEffect, useState} from 'react';
import {Flag, ShieldBan, X} from 'lucide-react';
import {SafetyTarget} from '../types/diary';

const REPORT_REASONS = [
  '騷擾或不當言論',
  '廣告垃圾訊息',
  '冒充他人或隱私侵害',
  '其他',
] as const;

interface SafetyModalsProps {
  reportTarget: SafetyTarget | null;
  blockTarget: SafetyTarget | null;
  onCloseReport: () => void;
  onSubmitReport: (reason: string, details: string) => void;
  onCloseBlock: () => void;
  onConfirmBlock: () => void;
}

export function SafetyModals({
  reportTarget,
  blockTarget,
  onCloseReport,
  onSubmitReport,
  onCloseBlock,
  onConfirmBlock,
}: SafetyModalsProps) {
  const [selectedReason, setSelectedReason] = useState<string>(
    REPORT_REASONS[0],
  );
  const [details, setDetails] = useState('');

  useEffect(() => {
    if (reportTarget) {
      setSelectedReason(REPORT_REASONS[0]);
      setDetails('');
    }
  }, [reportTarget]);

  useEffect(() => {
    if (!reportTarget && !blockTarget) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (reportTarget) onCloseReport();
        if (blockTarget) onCloseBlock();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [reportTarget, blockTarget, onCloseReport, onCloseBlock]);

  const handleReportSubmit = (e: FormEvent) => {
    e.preventDefault();
    onSubmitReport(selectedReason, details.trim());
  };

  return (
    <>
      {/* Report Modal */}
      {reportTarget && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="report-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#2C2A29]/45 backdrop-blur-[1px] p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              onCloseReport();
            }
          }}
        >
          <div className="w-full max-w-[390px] bg-[#FFFDF9] border border-[#E6E1D6] rounded-[12px] shadow-[0_14px_36px_rgba(44,42,41,0.18)] p-5 space-y-4">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <Flag className="w-4 h-4 text-[#9E4737] shrink-0" />
                <div>
                  <h2
                    id="report-modal-title"
                    className="font-serif text-[17px] font-semibold text-[#2C2A29]"
                  >
                    檢舉「{reportTarget.targetName}」
                  </h2>
                  <p className="text-[11px] text-[#7A756E] mt-0.5">
                    請選擇檢舉原因，我們會審核並妥善處理不當內容
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onCloseReport}
                aria-label="關閉檢舉視窗"
                className="min-w-[32px] min-h-[32px] -mr-1 -mt-1 flex items-center justify-center rounded-[8px] text-[#7A756E] hover:text-[#2C2A29] hover:bg-[#F3EFE6] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleReportSubmit} className="space-y-3.5">
              <div className="space-y-2">
                <span className="block text-xs text-[#7A756E]">檢舉原因</span>
                <div className="space-y-1.5">
                  {REPORT_REASONS.map((reason) => {
                    const isSelected = selectedReason === reason;
                    return (
                      <button
                        key={reason}
                        type="button"
                        onClick={() => setSelectedReason(reason)}
                        aria-pressed={isSelected}
                        className={`w-full min-h-[40px] px-3 rounded-[8px] border text-left text-xs transition-colors cursor-pointer ${
                          isSelected
                            ? 'bg-[#9E4737]/10 border-[#9E4737] text-[#9E4737] font-medium'
                            : 'bg-[#F9F7F2] border-[#E6E1D6] text-[#2C2A29] hover:bg-[#F3EFE6]'
                        }`}
                      >
                        {reason}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label
                  htmlFor="report-details"
                  className="block text-xs text-[#7A756E] mb-1"
                >
                  補充說明（選填）
                </label>
                <textarea
                  id="report-details"
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  rows={2}
                  maxLength={200}
                  placeholder="簡述令你感到不適或違規的情況…"
                  className="w-full px-3 py-2 rounded-[8px] bg-[#F9F7F2] border border-[#E6E1D6] text-xs text-[#2C2A29] placeholder:text-[#B5AEA4] resize-none focus:outline-none focus:border-[#9E4737]"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={onCloseReport}
                  className="min-h-[42px] px-4 rounded-[8px] border border-[#E6E1D6] bg-[#FFFDF9] hover:bg-[#F3EFE6] text-xs font-medium text-[#7A756E] hover:text-[#2C2A29] transition-colors cursor-pointer"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="flex-1 min-h-[42px] rounded-[8px] bg-[#9E4737] hover:bg-[#8A3B2D] text-[#FFFDF9] text-xs font-medium transition-colors cursor-pointer"
                >
                  送出檢舉
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Block Confirmation Modal */}
      {blockTarget && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="block-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#2C2A29]/45 backdrop-blur-[1px] p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              onCloseBlock();
            }
          }}
        >
          <div className="w-full max-w-[380px] bg-[#FFFDF9] border border-[#E6E1D6] rounded-[12px] shadow-[0_14px_36px_rgba(44,42,41,0.18)] p-5 space-y-4">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <ShieldBan className="w-4 h-4 text-[#9E4737] shrink-0" />
                <h2
                  id="block-modal-title"
                  className="font-serif text-[17px] font-semibold text-[#2C2A29]"
                >
                  確認封鎖「{blockTarget.targetName}」？
                </h2>
              </div>
              <button
                type="button"
                onClick={onCloseBlock}
                aria-label="關閉封鎖確認視窗"
                className="min-w-[32px] min-h-[32px] -mr-1 -mt-1 flex items-center justify-center rounded-[8px] text-[#7A756E] hover:text-[#2C2A29] hover:bg-[#F3EFE6] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-[#7A756E] leading-relaxed">
              封鎖後，系統將立即在【日記牆】與【心意連結】中隱藏對方的所有日記、心意通知與一對一對話紀錄。
            </p>

            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={onCloseBlock}
                className="min-h-[42px] px-4 rounded-[8px] border border-[#E6E1D6] bg-[#FFFDF9] hover:bg-[#F3EFE6] text-xs font-medium text-[#7A756E] hover:text-[#2C2A29] transition-colors cursor-pointer"
              >
                取消
              </button>
              <button
                type="button"
                onClick={onConfirmBlock}
                className="flex-1 min-h-[42px] rounded-[8px] bg-[#9E4737] hover:bg-[#8A3B2D] text-[#FFFDF9] text-xs font-medium transition-colors cursor-pointer"
              >
                確認封鎖
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
