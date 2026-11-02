import React, { useState } from 'react';
import {
  Share2,
  Copy,
  Check,
  X,
  Send,
  MessageCircle,
  ExternalLink,
  Sparkles,
  Award,
  Users,
  QrCode,
  CheckCircle2,
  Globe,
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export interface InviteShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  completedModulesCount?: number;
  totalModulesCount?: number;
  userXp?: number;
  userLevel?: number;
  onRewardXp?: (amount: number) => void;
}

export const InviteShareModal: React.FC<InviteShareModalProps> = ({
  isOpen,
  onClose,
  completedModulesCount = 2,
  totalModulesCount = 8,
  userXp = 2900,
  userLevel = 4,
  onRewardXp,
}) => {
  const { language, isRTL, t } = useLanguage();
  const [copied, setCopied] = useState<boolean>(false);
  const [bonusClaimed, setBonusClaimed] = useState<boolean>(false);
  const [showQrCode, setShowQrCode] = useState<boolean>(false);

  if (!isOpen) return null;

  const originUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}${window.location.pathname}`
      : 'https://antigravity.google/docs';

  const inviteCode = `AG-ARCHITECT-${userLevel}X`;
  const inviteUrl = `${originUrl}?ref=invite&code=${inviteCode}`;

  const shareTextFa = `🚀 من در حال تسلط بر معماری Google Antigravity در این آکادمی تعاملی هستم (سطح ${userLevel} · ${userXp} XP). به من بپیوندید و شبیه‌سازهای زنده Mission Control و گاردریل‌های .agent/rules را تجربه کنید:`;
  const shareTextEn = `🚀 Mastering Google Antigravity Agent-First architecture in this interactive academy (Level ${userLevel} · ${userXp} XP). Explore live Mission Control simulators and FastMCP studios with me:`;
  const effectiveShareText = language === 'en' ? shareTextEn : shareTextFa;

  const telegramUrl = `https://t.me/share/url?url=${encodeURIComponent(
    inviteUrl
  )}&text=${encodeURIComponent(effectiveShareText)}`;

  const twitterUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(
    inviteUrl
  )}&text=${encodeURIComponent(
    `${effectiveShareText} #GoogleAntigravity #AgentFirst #AIArchitect`
  )}`;

  const linkedInUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
    inviteUrl
  )}`;

  const whatsAppUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(
    `${effectiveShareText} ${inviteUrl}`
  )}`;

  const handleCopyLink = async () => {
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(inviteUrl);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = inviteUrl;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);

      if (!bonusClaimed && onRewardXp) {
        onRewardXp(250);
        setBonusClaimed(true);
      }
    } catch {
      // Fallback
    }
  };

  const handleNativeShare = async () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: 'Google Antigravity Academy',
          text: effectiveShareText,
          url: inviteUrl,
        });
        if (!bonusClaimed && onRewardXp) {
          onRewardXp(250);
          setBonusClaimed(true);
        }
      } catch {
        // User cancelled share
      }
    } else {
      handleCopyLink();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 overflow-y-auto animate-fade-in-up"
      role="dialog"
      aria-modal="true"
      aria-labelledby="invite-share-modal-title"
    >
      <div className="relative w-full max-w-xl rounded-3xl border border-slate-200/90 dark:border-white/[0.12] bg-white dark:bg-[#0c121e] text-slate-900 dark:text-slate-100 shadow-2xl overflow-hidden animate-scale-in">
        {/* Glow ambient accent backdrop */}
        <div className="absolute top-0 right-1/4 w-64 h-64 bg-gradient-to-br from-blue-600/20 to-indigo-600/20 rounded-full blur-3xl pointer-events-none -z-10" />
        <div className="absolute bottom-0 left-10 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none -z-10" />

        {/* Modal Top Header */}
        <div className="px-6 py-5 border-b border-slate-200/80 dark:border-white/[0.08] flex items-center justify-between gap-4 bg-slate-50/80 dark:bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-md shadow-blue-500/25 ring-2 ring-white/20">
                <Share2 className="w-5 h-5" />
              </div>
              <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-[#0c121e] flex items-center justify-center text-[9px] text-white font-bold">
                ★
              </span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 id="invite-share-modal-title" className="text-base font-extrabold text-slate-900 dark:text-white">
                  {t('inviteModalTitle')}
                </h3>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {t('inviteModalSubtitle')}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close invite modal"
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-white/[0.08] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6">
          {/* Shareable Architect Card Preview */}
          <div className="p-5 rounded-2xl border border-blue-500/30 bg-gradient-to-br from-blue-500/[0.07] via-slate-50 to-indigo-500/[0.05] dark:from-[#0d1527] dark:via-[#0c121e] dark:to-[#090e1a] space-y-4 shadow-sm relative overflow-hidden">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white font-mono font-black text-sm flex items-center justify-center ring-2 ring-blue-500/30 shadow-md">
                  AG
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-black text-slate-900 dark:text-white">
                      Google Antigravity Architect
                    </span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-blue-500/15 text-blue-600 dark:text-blue-400 font-bold border border-blue-500/30">
                      LVL {userLevel}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                    {completedModulesCount}/{totalModulesCount} Modules Completed · {userXp} XP
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowQrCode((prev) => !prev)}
                className="p-2 rounded-xl border border-slate-200/80 dark:border-white/[0.08] bg-white/80 dark:bg-white/[0.04] text-slate-600 dark:text-slate-300 hover:text-blue-500 transition-colors text-xs flex items-center gap-1 cursor-pointer"
                title={showQrCode ? 'Hide QR' : 'Show QR'}
              >
                <QrCode className="w-4 h-4" />
                <span className="hidden sm:inline text-[11px] font-mono">QR</span>
              </button>
            </div>

            {/* QR Code expansion */}
            {showQrCode && (
              <div className="p-4 rounded-xl border border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[#080d16] flex flex-col items-center justify-center gap-2 text-center animate-fade-in-up">
                <div className="p-3 bg-white rounded-xl shadow-xs border border-slate-200 inline-block">
                  <svg className="w-28 h-28" viewBox="0 0 100 100">
                    <rect width="100" height="100" fill="white" />
                    <rect x="10" y="10" width="30" height="30" fill="black" />
                    <rect x="15" y="15" width="20" height="20" fill="white" />
                    <rect x="20" y="20" width="10" height="10" fill="black" />
                    <rect x="60" y="10" width="30" height="30" fill="black" />
                    <rect x="65" y="15" width="20" height="20" fill="white" />
                    <rect x="70" y="20" width="10" height="10" fill="black" />
                    <rect x="10" y="60" width="30" height="30" fill="black" />
                    <rect x="15" y="65" width="20" height="20" fill="white" />
                    <rect x="20" y="70" width="10" height="10" fill="black" />
                    <rect x="45" y="15" width="10" height="10" fill="black" />
                    <rect x="45" y="35" width="10" height="10" fill="black" />
                    <rect x="15" y="45" width="10" height="10" fill="black" />
                    <rect x="35" y="45" width="10" height="10" fill="black" />
                    <rect x="55" y="55" width="15" height="15" fill="black" />
                    <rect x="75" y="65" width="15" height="15" fill="black" />
                    <rect x="45" y="75" width="15" height="15" fill="black" />
                  </svg>
                </div>
                <span className="text-[11px] font-mono text-slate-500">
                  {language === 'en' ? 'Scan to open with mobile' : 'اسکن با دوربین گوشی برای ورود فوری'}
                </span>
              </div>
            )}

            {/* Invite incentive banner */}
            <div className="flex items-center justify-between text-xs font-semibold px-3 py-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                <span>
                  {language === 'en'
                    ? 'Referral Bonus: Earn +250 XP per colleague joining'
                    : 'پاداش دعوت: +۲۵۰ امتیاز XP برای هر همکار دعوت‌شده'}
                </span>
              </div>
              <span className="font-mono text-[11px] font-black">+250 XP</span>
            </div>
          </div>

          {/* Copy Invite Link Field */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
              <span>{t('copyInviteLink')}</span>
              {copied && (
                <span className="text-emerald-600 dark:text-emerald-400 text-[11px] font-bold flex items-center gap-1 animate-scale-in">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{t('inviteCopied')}</span>
                </span>
              )}
            </label>
            <div className="flex items-center gap-2">
              <div
                dir="ltr"
                className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-200/90 dark:border-white/[0.08] bg-slate-100/80 dark:bg-[#090d16] text-xs font-mono text-slate-600 dark:text-slate-300 truncate select-all"
              >
                {inviteUrl}
              </div>
              <button
                type="button"
                onClick={handleCopyLink}
                className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-md shadow-blue-500/20 cursor-pointer shrink-0 active:scale-95"
              >
                {copied ? <Check className="w-4 h-4 text-white" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? (language === 'en' ? 'Copied!' : 'کپی شد!') : (language === 'en' ? 'Copy Link' : 'کپی لینک')}</span>
              </button>
            </div>
          </div>

          {/* Direct 1-Click Social Sharing Grid */}
          <div className="space-y-2.5 pt-1">
            <div className="text-xs font-bold text-slate-500 dark:text-slate-400">
              {language === 'en' ? 'Share directly to networks:' : 'اشتراک‌گذاری مستقیم در شبکه‌ها:'}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {/* Telegram */}
              <a
                href={telegramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-3 rounded-xl border border-slate-200/80 dark:border-white/[0.08] bg-slate-50 dark:bg-white/[0.03] hover:border-sky-500/40 hover:bg-sky-500/10 text-slate-700 dark:text-slate-200 transition-all flex flex-col items-center justify-center gap-1.5 text-xs font-semibold cursor-pointer group"
              >
                <div className="w-7 h-7 rounded-lg bg-sky-500/15 text-sky-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Send className="w-3.5 h-3.5" />
                </div>
                <span>تلگرام</span>
              </a>

              {/* Twitter / X */}
              <a
                href={twitterUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-3 rounded-xl border border-slate-200/80 dark:border-white/[0.08] bg-slate-50 dark:bg-white/[0.03] hover:border-slate-400 hover:bg-slate-200/40 dark:hover:bg-white/[0.08] text-slate-700 dark:text-slate-200 transition-all flex flex-col items-center justify-center gap-1.5 text-xs font-semibold cursor-pointer group"
              >
                <div className="w-7 h-7 rounded-lg bg-slate-500/15 text-slate-700 dark:text-slate-300 flex items-center justify-center group-hover:scale-110 transition-transform font-bold font-mono">
                  𝕏
                </div>
                <span>توییتر / X</span>
              </a>

              {/* LinkedIn */}
              <a
                href={linkedInUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-3 rounded-xl border border-slate-200/80 dark:border-white/[0.08] bg-slate-50 dark:bg-white/[0.03] hover:border-blue-600/40 hover:bg-blue-600/10 text-slate-700 dark:text-slate-200 transition-all flex flex-col items-center justify-center gap-1.5 text-xs font-semibold cursor-pointer group"
              >
                <div className="w-7 h-7 rounded-lg bg-blue-600/15 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <ExternalLink className="w-3.5 h-3.5" />
                </div>
                <span>لینکدین</span>
              </a>

              {/* WhatsApp */}
              <a
                href={whatsAppUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-3 rounded-xl border border-slate-200/80 dark:border-white/[0.08] bg-slate-50 dark:bg-white/[0.03] hover:border-emerald-500/40 hover:bg-emerald-500/10 text-slate-700 dark:text-slate-200 transition-all flex flex-col items-center justify-center gap-1.5 text-xs font-semibold cursor-pointer group"
              >
                <div className="w-7 h-7 rounded-lg bg-emerald-500/15 text-emerald-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <MessageCircle className="w-3.5 h-3.5" />
                </div>
                <span>واتساپ</span>
              </a>
            </div>
          </div>

          {/* Native Web Share Button (if supported or mobile) */}
          <button
            type="button"
            onClick={handleNativeShare}
            className="w-full py-2.5 rounded-xl border border-slate-200/80 dark:border-white/[0.08] bg-slate-100/70 dark:bg-white/[0.04] hover:bg-slate-200/70 dark:hover:bg-white/[0.08] text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <Share2 className="w-4 h-4 text-blue-500" />
            <span>
              {language === 'en' ? 'Open System Share Sheet...' : 'باز کردن منوی اشتراک‌گذاری دستگاه...'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
