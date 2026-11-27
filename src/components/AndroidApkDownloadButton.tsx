import {useState} from 'react';
import {ANDROID_APK_DOWNLOAD_URL} from '../data/diaryConstants';

interface AndroidApkDownloadButtonProps {
  variant?: 'footer' | 'modal' | 'card';
}

export function AndroidApkDownloadButton({
  variant = 'footer',
}: AndroidApkDownloadButtonProps) {
  const [missingUrlNotice, setMissingUrlNotice] = useState(false);
  const hasValidUrl = /^https?:\/\//i.test(ANDROID_APK_DOWNLOAD_URL);

  const handleMissingClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (!hasValidUrl) {
      e.preventDefault();
      setMissingUrlNotice(true);
    }
  };

  if (variant === 'card') {
    return (
      <div className="bg-[#FFFDF9] border border-[#E6E1D6] rounded-[12px] p-5 shadow-[0_2px_12px_rgba(44,42,41,0.03)] space-y-2.5 text-center">
        <a
          href={hasValidUrl ? ANDROID_APK_DOWNLOAD_URL : '#'}
          target={hasValidUrl ? '_blank' : undefined}
          rel={hasValidUrl ? 'noopener noreferrer' : undefined}
          onClick={handleMissingClick}
          className="w-full min-h-[44px] px-4 rounded-[10px] border border-[#E6E1D6] bg-[#F9F7F2] hover:bg-[#F2ECE0] text-[#2C2A29] text-[13px] font-medium inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
        >
          <span>📱 下載 Android 版 App (APK)</span>
        </a>
        <p className="text-[11px] text-[#7A756E] leading-relaxed">
          下載後點擊檔案並允許安裝未知來源，即可全螢幕使用
        </p>
        {missingUrlNotice && !hasValidUrl && (
          <p role="status" className="text-[11px] text-[#9E4737]">
            尚未設定 GitHub Release APK 下載網址，請提供實際網址後即可直接下載。
          </p>
        )}
      </div>
    );
  }

  if (variant === 'modal') {
    return (
      <div className="space-y-1.5 text-center">
        <a
          href={hasValidUrl ? ANDROID_APK_DOWNLOAD_URL : '#'}
          target={hasValidUrl ? '_blank' : undefined}
          rel={hasValidUrl ? 'noopener noreferrer' : undefined}
          onClick={handleMissingClick}
          className="w-full min-h-[40px] px-3 rounded-[8px] border border-[#E6E1D6] bg-[#F9F7F2] hover:bg-[#F2ECE0] text-[#2C2A29] text-xs font-medium inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
        >
          <span>📱 下載 Android 版 App (APK)</span>
        </a>
        {missingUrlNotice && !hasValidUrl && (
          <p role="status" className="text-[11px] text-[#9E4737]">
            尚未設定 GitHub Release APK 下載網址，請提供實際網址後即可直接下載。
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-1.5">
      <a
        href={hasValidUrl ? ANDROID_APK_DOWNLOAD_URL : '#'}
        target={hasValidUrl ? '_blank' : undefined}
        rel={hasValidUrl ? 'noopener noreferrer' : undefined}
        onClick={handleMissingClick}
        className="min-h-[38px] px-4 rounded-[10px] border border-[#E6E1D6] bg-[#FFFDF9] hover:bg-[#F2ECE0] text-[#2C2A29] text-xs font-medium inline-flex items-center justify-center gap-1.5 shadow-[0_1px_4px_rgba(44,42,41,0.03)] transition-colors cursor-pointer"
      >
        <span>📱 下載 Android 版 App (APK)</span>
      </a>
      {missingUrlNotice && !hasValidUrl && (
        <p role="status" className="text-[11px] text-[#9E4737]">
          尚未設定 GitHub Release APK 下載網址，請提供實際網址後即可直接下載。
        </p>
      )}
    </div>
  );
}
