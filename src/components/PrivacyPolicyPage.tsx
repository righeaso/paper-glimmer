import {ArrowLeft, ShieldCheck} from 'lucide-react';

interface PrivacyPolicyPageProps {
  onBackHome: () => void;
}

export function PrivacyPolicyPage({onBackHome}: PrivacyPolicyPageProps) {
  return (
    <div className="min-h-screen desktop-backdrop">
      <div className="max-w-[480px] mx-auto min-h-screen bg-[#F9F7F2] sm:border-x sm:border-[#E6E1D6] sm:shadow-[0_12px_48px_rgba(44,42,41,0.16)] flex flex-col">
        {/* Sticky Top Header */}
        <header className="sticky top-0 z-30 h-[56px] bg-[#F9F7F2]/95 backdrop-blur-sm border-b border-[#E6E1D6] px-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <img
              src="/icon.png?v=2"
              alt="紙間微光"
              className="w-8 h-8 rounded-lg object-cover shrink-0"
            />
            <div className="flex items-baseline gap-2 min-w-0">
              <h1 className="font-serif text-[18px] font-semibold text-[#2C2A29] tracking-wide whitespace-nowrap">
                紙間微光
              </h1>
              <span className="text-[11px] text-[#7A756E] tracking-wider whitespace-nowrap">
                隱私權政策
              </span>
            </div>
          </div>
          <a
            href="/"
            onClick={(e) => {
              e.preventDefault();
              onBackHome();
            }}
            className="min-h-[36px] px-3 rounded-[8px] border border-[#E6E1D6] bg-[#FFFDF9] hover:bg-[#F3EFE6] text-xs font-medium text-[#2C2A29] inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>返回首頁</span>
          </a>
        </header>

        {/* Privacy Content */}
        <main className="flex-1 px-4 py-6 space-y-5">
          <article className="bg-[#FFFDF9] border border-[#E6E1D6] rounded-[12px] p-5 shadow-[0_2px_12px_rgba(44,42,41,0.03)] space-y-5">
            <div className="flex items-start gap-2.5 pb-4 border-b border-[#E6E1D6]/80">
              <ShieldCheck className="w-5 h-5 text-[#5C6B54] shrink-0 mt-0.5" />
              <div>
                <h2 className="font-serif text-[19px] font-semibold text-[#2C2A29] leading-snug">
                  紙間微光（Paper Glimmer）隱私權政策
                </h2>
                <p className="text-xs text-[#7A756E] mt-1">
                  我們重視你留下的每一頁文字與個人隱私，以下說明資料如何被收集、保存與刪除。
                </p>
              </div>
            </div>

            <section className="space-y-2">
              <h3 className="font-serif text-[15px] font-semibold text-[#2C2A29]">
                一、我們收集的資料
              </h3>
              <ul className="text-[13px] text-[#2C2A29]/85 leading-[1.8] space-y-1.5 list-disc list-inside">
                <li>
                  <span className="font-medium text-[#2C2A29]">帳號驗證資訊：</span>
                  你於註冊或登入時填寫的電子郵件（Email）。
                </li>
                <li>
                  <span className="font-medium text-[#2C2A29]">個人公開檔案：</span>
                  你自行設定的個人筆名與一句話簡介。
                </li>
                <li>
                  <span className="font-medium text-[#2C2A29]">書寫與互動內容：</span>
                  你發布的日記標題、內文、心情標籤、送出或收到的心意回應。
                </li>
                <li>
                  <span className="font-medium text-[#2C2A29]">一對一對話訊息：</span>
                  與筆友達成雙向心意回應並開啟專屬對話室後，雙方傳送的聊天訊息內容。
                </li>
              </ul>
            </section>

            <section className="space-y-2 pt-2 border-t border-[#E6E1D6]/60">
              <h3 className="font-serif text-[15px] font-semibold text-[#2C2A29]">
                二、資料儲存位置與保護方式
              </h3>
              <p className="text-[13px] text-[#2C2A29]/85 leading-[1.8]">
                你的帳號驗證、個人檔案、日記內容、心意回應與聊天訊息均安全儲存於{' '}
                <span className="font-medium text-[#2C2A29]">Supabase 雲端資料庫</span>
                ，並透過工作階段驗證與存取權限控管保護資料安全。同時，瀏覽器端本機暫存亦會依個別帳號識別碼隔離，在登出或切換帳號時自動清空他人快取。我們不會將你的個人資料販售、出租或用於第三方廣告追蹤。
              </p>
            </section>

            <section className="space-y-2 pt-2 border-t border-[#E6E1D6]/60">
              <h3 className="font-serif text-[15px] font-semibold text-[#2C2A29]">
                三、使用者如何申請刪除帳號與資料
              </h3>
              <p className="text-[13px] text-[#2C2A29]/85 leading-[1.8]">
                你可以隨時聯絡服務維運信箱{' '}
                <a
                  href="mailto:rigxiao1199@gmail.com"
                  className="text-[#9E4737] underline underline-offset-2"
                >
                  rigxiao1199@gmail.com
                </a>{' '}
                並提供你註冊使用的電子郵件（Email）提出刪除申請。我們在核對帳號身分後，將於合理作業時間內永久刪除你的 Supabase 帳號以及所有關聯的個人檔案、日記、心意回應與聊天訊息紀錄；此外，當你在「我的本子」點擊「登出」時，系統亦會立即清除該裝置上的本機快取資料。
              </p>
            </section>

            <div className="pt-4 border-t border-[#E6E1D6]/80">
              <a
                href="/"
                onClick={(e) => {
                  e.preventDefault();
                  onBackHome();
                }}
                className="w-full min-h-[44px] rounded-[10px] bg-[#5C6B54] hover:bg-[#4D5B46] text-[#FFFDF9] text-[13px] font-medium inline-flex items-center justify-center gap-1.5 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>返回首頁</span>
              </a>
            </div>
          </article>
        </main>
      </div>
    </div>
  );
}
