import {Component, type ReactNode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

if ('serviceWorker' in navigator) {
  if (import.meta.env.PROD) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js').catch(() => {
        // Ignore service worker registration errors in unsupported contexts
      });
    });
  } else {
    // In dev/preview mode, clean up any previously registered SW & caches so stale dev modules never cause white screens
    navigator.serviceWorker
      .getRegistrations()
      .then((registrations) => {
        for (const registration of registrations) {
          void registration.unregister();
        }
      })
      .catch(() => {});
    if ('caches' in window) {
      caches
        .keys()
        .then((keys) => {
          for (const key of keys) {
            if (key.startsWith('paper-glimmer-')) {
              void caches.delete(key);
            }
          }
        })
        .catch(() => {});
    }
  }
}

interface ErrorBoundaryState {
  errorMessage: string | null;
}

class AppErrorBoundary extends Component<
  {children: ReactNode},
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = {errorMessage: null};

  static getDerivedStateFromError(error: unknown): ErrorBoundaryState {
    return {
      errorMessage:
        error instanceof Error
          ? error.message
          : '頁面載入時發生未預期的執行錯誤。',
    };
  }

  render() {
    if (this.state.errorMessage) {
      return (
        <div className="min-h-screen bg-[#F2EFE8] flex items-center justify-center p-4">
          <div className="w-full max-w-[400px] bg-[#FFFDF9] border border-[#E6E1D6] rounded-[12px] p-6 text-center space-y-3 shadow-[0_4px_20px_rgba(44,42,41,0.08)]">
            <h1 className="font-serif text-[18px] font-semibold text-[#2C2A29]">
              紙間微光暫時無法顯示
            </h1>
            <p className="text-xs text-[#7A756E] leading-relaxed break-words">
              {this.state.errorMessage}
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="min-h-[40px] px-4 rounded-[8px] bg-[#5C6B54] text-[#FFFDF9] text-xs font-medium cursor-pointer"
            >
              重新整理頁面
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById('root')!).render(
  <AppErrorBoundary>
    <App />
  </AppErrorBoundary>,
);
