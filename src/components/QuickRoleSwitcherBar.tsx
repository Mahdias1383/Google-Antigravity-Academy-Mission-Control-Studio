import React from 'react';
import { User, UserRole } from '../types/railpulse';
import { Language, TRANSLATIONS } from '../i18n/translations';
import {
  Shield,
  Train,
  User as UserIcon,
  FlaskConical,
  Globe,
  Sun,
  Moon,
  Sparkles,
  Wallet,
  Activity,
  Layers,
} from 'lucide-react';

interface QuickRoleSwitcherBarProps {
  currentUser: User;
  onSwitchRole: (role: UserRole) => void;
  activePortal: 'admin' | 'operations' | 'passenger' | 'qa-suite';
  onSelectPortal: (portal: 'admin' | 'operations' | 'passenger' | 'qa-suite') => void;
  language: Language;
  onToggleLanguage: () => void;
  darkMode: boolean;
  onToggleDarkMode: () => void;
}

export const QuickRoleSwitcherBar: React.FC<QuickRoleSwitcherBarProps> = ({
  currentUser,
  onSwitchRole,
  activePortal,
  onSelectPortal,
  language,
  onToggleLanguage,
  darkMode,
  onToggleDarkMode,
}) => {
  const t = TRANSLATIONS[language];
  const isRtl = language === 'fa';

  return (
    <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-md border-b border-slate-700/80 shadow-md">
      <div className="max-w-7xl mx-auto px-4 py-2.5 flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Brand & System Identity */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-500 flex items-center justify-center text-white shadow-md shadow-blue-900/30">
            <Train className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-sm tracking-wide text-white font-mono">RAILPULSE</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded font-bold bg-blue-500/20 text-blue-300 border border-blue-400/30">
                ENTERPRISE
              </span>
            </div>
            <div className="text-[11px] text-slate-400 hidden sm:block">
              {isRtl ? 'سامانه یکپارچه دیسپچینگ، ایمنی و رزرو' : 'Integrated Railway Operations & Audit Platform'}
            </div>
          </div>
        </div>

        {/* 1-Click Persona Switcher Toolbar */}
        <div className="flex items-center gap-1.5 bg-slate-800/90 border border-slate-700/80 p-1 rounded-xl shadow-inner">
          {/* Admin */}
          <button
            onClick={() => {
              onSwitchRole('admin');
              onSelectPortal('admin');
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
              currentUser.role === 'admin' && activePortal === 'admin'
                ? 'bg-blue-600 text-white shadow'
                : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
            }`}
            title="System Admin & Activity Monitor"
          >
            <Shield className="w-3.5 h-3.5 text-blue-300" />
            <span className="hidden sm:inline">{t.personaAdmin}</span>
            <span className="sm:hidden">Admin</span>
          </button>

          {/* Operations Staff */}
          <button
            onClick={() => {
              onSwitchRole('employee');
              onSelectPortal('operations');
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
              currentUser.role === 'employee' && activePortal === 'operations'
                ? 'bg-amber-600 text-white shadow'
                : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
            }`}
            title="Train Operations & Marey Graph"
          >
            <Train className="w-3.5 h-3.5 text-amber-300" />
            <span className="hidden sm:inline">{t.personaStaff}</span>
            <span className="sm:hidden">Staff</span>
          </button>

          {/* Passenger */}
          <button
            onClick={() => {
              onSwitchRole('passenger');
              onSelectPortal('passenger');
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
              currentUser.role === 'passenger' && activePortal === 'passenger'
                ? 'bg-emerald-600 text-white shadow'
                : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
            }`}
            title="Passenger Reservation & Digital Pass"
          >
            <UserIcon className="w-3.5 h-3.5 text-emerald-300" />
            <span className="hidden sm:inline">{t.personaPassenger}</span>
            <span className="sm:hidden">Passenger</span>
          </button>

          {/* QA Test Runner Suite */}
          <button
            onClick={() => onSelectPortal('qa-suite')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
              activePortal === 'qa-suite'
                ? 'bg-purple-600 text-white shadow'
                : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
            }`}
            title="Run 5-Phase Automated Test Suite"
          >
            <FlaskConical className="w-3.5 h-3.5 text-purple-300" />
            <span className="hidden sm:inline">QA Test Suite</span>
            <span className="sm:hidden">QA</span>
          </button>
        </div>

        {/* User Info, Language, Dark Mode */}
        <div className="flex items-center gap-2">
          {currentUser.role === 'passenger' && (
            <div className="hidden lg:flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-950/70 border border-emerald-600/40 text-[11px] font-mono text-emerald-300">
              <Wallet className="w-3 h-3 text-emerald-400" />
              <span>{currentUser.walletBalance.toLocaleString(isRtl ? 'fa-IR' : 'en-US')} تومان</span>
            </div>
          )}

          {/* Language Switcher */}
          <button
            onClick={onToggleLanguage}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition cursor-pointer"
            title="Toggle Language (Persian RTL / English LTR)"
          >
            <Globe className="w-3.5 h-3.5 text-blue-400" />
            <span>{language === 'fa' ? 'EN' : 'فا'}</span>
          </button>

          {/* Dark Mode Toggle */}
          <button
            onClick={onToggleDarkMode}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition cursor-pointer"
            title="Toggle Theme"
          >
            {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-blue-400" />}
          </button>
        </div>
      </div>
    </header>
  );
};
