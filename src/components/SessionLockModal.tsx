import React, { useState } from 'react';
import { Lock, KeyRound, ShieldCheck, AlertCircle } from 'lucide-react';
import { User } from '../types/railpulse';
import { Language } from '../i18n/translations';
import {
  IdleSessionState,
  verifySessionUnlockCredential,
} from '../services/idleSessionService';

interface SessionLockModalProps {
  sessionState: IdleSessionState;
  language: Language;
  activeUser: User;
  onUnlockSuccess: () => void;
}

export const SessionLockModal: React.FC<SessionLockModalProps> = ({
  sessionState,
  language,
  activeUser,
  onUnlockSuccess,
}) => {
  const isFa = language === 'fa';
  const [passcode, setPasscode] = useState('1234');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!sessionState.isLocked) {
    return null;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const ok = verifySessionUnlockCredential(passcode, activeUser);
    if (ok) {
      setErrorMsg(null);
      onUnlockSuccess();
    } else {
      setErrorMsg(
        isFa
          ? 'رمز عبور یا کد امنیتی نامعتبر است (کد پیش‌فرض: 1234 یا admin)'
          : 'Invalid security passcode (Default demo PIN: 1234 or admin)'
      );
    }
  };

  return (
    <div
      data-testid="session-lock-modal"
      className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 no-print"
    >
      <div className="w-full max-w-md bg-slate-900 border border-amber-500/40 rounded-2xl p-6 shadow-2xl">
        <div className="flex items-center gap-3.5 mb-4">
          <div className="w-12 h-12 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
            <Lock className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">
              {isFa
                ? 'قفل امنیتی نشست (عدم فعالیت ۱۵ دقیقه‌ای)'
                : 'Mission Session Locked (15m Inactivity)'}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {isFa
                ? `اپراتور فعال: ${activeUser.fullName}`
                : `Active Operator: ${activeUser.fullName}`}
            </p>
          </div>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed mb-4">
          {isFa
            ? 'جهت حفاظت از سامانه فرماندهی و جلوگیری از دسترسی غیرمجاز در اتاق کنترل، نشست فعلی قفل شده است. لطفاً رمز امنیتی را وارد نمایید.'
            : 'For mission-critical operational security, your session was automatically locked due to inactivity. Please re-authenticate to resume.'}
        </p>

        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
              <span>
                {isFa ? 'پین امنیتی یا رمز عبور اپراتور' : 'Operator Security PIN / Password'}
              </span>
              <span dir="ltr" className="text-[11px] font-mono text-amber-400">
                PIN: 1234
              </span>
            </label>
            <div className="relative">
              <KeyRound className="w-4 h-4 text-slate-400 absolute top-1/2 -translate-y-1/2 start-3.5 pointer-events-none" />
              <input
                type="password"
                data-testid="session-unlock-input"
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                dir="ltr"
                placeholder="1234"
                className="w-full h-10 ps-10 pe-3 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white font-mono focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <button
            type="submit"
            data-testid="session-unlock-btn"
            className="w-full h-10 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs inline-flex items-center justify-center gap-2 transition cursor-pointer"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>
              {isFa ? 'بازگشایی قفل و ادامه نشست' : 'Authenticate & Unlock Session'}
            </span>
          </button>
        </form>
      </div>
    </div>
  );
};
