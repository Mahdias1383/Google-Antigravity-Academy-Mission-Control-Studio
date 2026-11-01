import React, { useEffect, useState } from 'react';
import { Download, WifiOff, Smartphone, X } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    setIsInstalled(isStandalone);

    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIOSDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIOSDevice);

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const install = async () => {
    if (!deferredPrompt) return false;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsInstalled(true);
      setDeferredPrompt(null);
      return true;
    }
    return false;
  };

  return {
    isInstallable: !!deferredPrompt,
    isInstalled,
    isIOS,
    install,
  };
}

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showGuideModal, setShowGuideModal] = useState(false);
  const { language, isRTL, t } = useLanguage();

  if (isInstalled) {
    return null;
  }

  return (
    <>
      <button
        type="button"
        data-testid="pwa-install-button"
        onClick={async () => {
          if (isInstallable) {
            await install();
          } else {
            setShowGuideModal(true);
          }
        }}
        className="h-6 inline-flex items-center gap-1 px-1.5 rounded-md text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white dark:hover:bg-white/[0.08] text-xs font-medium transition-colors cursor-pointer whitespace-nowrap"
        title={language === 'en' ? 'Install Google Antigravity Academy as Desktop/Mobile App (PWA)' : 'نصب وب‌اپلیکیشن پیش‌رونده آکادمی'}
      >
        <Download className="w-3.5 h-3.5 text-slate-400 shrink-0" />
        <span className="hidden 2xl:inline text-[11px]">{t('pwaInstallBtn')}</span>
      </button>

      {showGuideModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-sm p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-md rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-blue-500" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {t('pwaModalTitle')}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowGuideModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className={`space-y-3 text-xs leading-6 text-slate-600 dark:text-slate-300 ${isRTL ? 'text-right' : 'text-left'}`}>
              <p>
                {language === 'en' ? (
                  <>
                    This platform is powered by a <span dir="ltr" className="ltr-inline font-mono text-blue-500">Service Worker</span> and offline cache. All 8 modules, cheat sheets, and engineering studios remain accessible offline without network latency:
                  </>
                ) : (
                  <>
                    این پلتفرم مجهز به <span dir="ltr" className="ltr-inline font-mono text-blue-500">Service Worker</span> و کش آفلاین است تا تمام ۸ فصل آموزشی، چیت‌شیت‌ها و استودیوهای معماری بدون نیاز به مرورگر و در حالت آفلاین در دسترس باشند:
                  </>
                )}
              </p>
              {isIOS ? (
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1.5">
                  <div className="font-bold text-slate-900 dark:text-white">
                    {language === 'en' ? 'Install on iOS / Safari:' : 'نصب در iOS / Safari:'}
                  </div>
                  <div>
                    {language === 'en'
                      ? '1. Tap the Share button in the Safari bottom toolbar.'
                      : '۱. روی دکمه Share در نوار پایین مرورگر سافاری بزنید.'}
                  </div>
                  <div>
                    {language === 'en'
                      ? '2. Select Add to Home Screen from the share sheet.'
                      : '۲. گزینه Add to Home Screen را انتخاب نمایید.'}
                  </div>
                </div>
              ) : (
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1.5">
                  <div className="font-bold text-slate-900 dark:text-white">
                    {language === 'en'
                      ? 'Install on Desktop (Chrome / Edge) & Android:'
                      : 'نصب در دسکتاپ (Chrome / Edge) و اندروید:'}
                  </div>
                  <div>
                    {language === 'en'
                      ? '1. If running in a browser tab, click the Install icon in the address bar.'
                      : '۱. در صورتی که اپ را داخل تب مستقل باز کرده‌اید، روی آیکون نصب در نوار آدرس کلیک کنید.'}
                  </div>
                  <div>
                    {language === 'en'
                      ? '2. Or open the browser menu and select Install App.'
                      : '۲. یا از منوی سه نقطه مرورگر گزینه Install App را انتخاب نمایید.'}
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setShowGuideModal(false)}
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold cursor-pointer"
              >
                {t('pwaModalGotIt')}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();
  const { t } = useLanguage();

  if (isOnline) return null;

  return (
    <div
      data-testid="offline-indicator"
      className="fixed bottom-4 left-4 z-50 flex items-center gap-2 rounded-xl border border-amber-500/40 bg-slate-900/95 px-3.5 py-2 text-xs font-semibold text-amber-400 shadow-xl backdrop-blur-md"
    >
      <WifiOff className="w-4 h-4 text-amber-400 shrink-0" />
      <span>{t('offlineBanner')}</span>
    </div>
  );
};
