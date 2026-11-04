import React, { useState } from 'react';
import {
  Train,
  Shield,
  Activity,
  Ticket,
  FlaskConical,
  Globe,
  Palette,
  Clock,
  Lock,
  Sparkles,
} from 'lucide-react';
import { PortalTab } from '../types/railpulse';
import { Language } from '../i18n/translations';
import { MissionThemePresetId } from '../services/themeSettingsService';

interface QuickRoleSwitcherBarProps {
  activePortal: PortalTab;
  onSelectPortal: (portal: PortalTab) => void;
  language: Language;
  onToggleLanguage: () => void;
  themeMode: MissionThemePresetId;
  onToggleThemeMode: (mode: MissionThemePresetId) => void;
  idleRemainingFormatted: string;
  onSimulateIdleLock: () => void;
}

export const QuickRoleSwitcherBar: React.FC<QuickRoleSwitcherBarProps> = ({
  activePortal,
  onSelectPortal,
  language,
  onToggleLanguage,
  themeMode,
  onToggleThemeMode,
  idleRemainingFormatted,
  onSimulateIdleLock,
}) => {
  const isFa = language === 'fa';
  const [themeDropdownOpen, setThemeDropdownOpen] = useState(false);

  const roles: Array<{
    id: PortalTab;
    labelFa: string;
    labelEn: string;
    badgeFa: string;
    badgeEn: string;
    icon: React.ReactNode;
  }> = [
    {
      id: 'admin',
      labelFa: 'پرتال مدیر ارشد سامانه',
      labelEn: 'System Admin Portal',
      badgeFa: 'حسابرسی و تحلیل',
      badgeEn: 'Audit & Analytics',
      icon: <Shield className="w-4 h-4" />,
    },
    {
      id: 'operations',
      labelFa: 'مرکز فرماندهی و عملیات خط',
      labelEn: 'Operations & Dispatch',
      badgeFa: 'ایمنی و گراف ماری',
      badgeEn: 'Safety & Marey',
      icon: <Activity className="w-4 h-4" />,
    },
    {
      id: 'passenger',
      labelFa: 'پرتال مسافر و رزرواسیون',
      labelEn: 'Passenger Reservation',
      badgeFa: 'کیف پول و بلیت QR',
      badgeEn: 'Wallet & QR Ticket',
      icon: <Ticket className="w-4 h-4" />,
    },
    {
      id: 'qa',
      labelFa: 'پنل تست و تضمین کیفیت مهندسی',
      labelEn: 'Engineering QA Suite',
      badgeFa: '۵ فاز تست خودکار',
      badgeEn: '5-Phase Auto QA',
      icon: <FlaskConical className="w-4 h-4" />,
    },
  ];

  return (
    <header className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-md border-b border-slate-800/90 no-print">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
        {/* Brand Identity */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-cyan-600 flex items-center justify-center text-slate-950 shadow-lg shadow-emerald-950/50 shrink-0">
              <Train className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-black tracking-tight text-white">
                  {isFa ? 'ریل‌پالس اینترپرایز' : 'RailPulse Enterprise'}
                </span>
                <span
                  dir="ltr"
                  className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30"
                >
                  v2.4 LTS
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                {isFa
                  ? 'سامانه یکپارچه فرماندهی ایمنی سیر، اعزام قطار و رزرواسیون هوشمند'
                  : 'Integrated Railway Safety Dispatch, Operations & Ticketing Platform'}
              </p>
            </div>
          </div>
        </div>

        {/* Role & Persona Switcher Buttons */}
        <nav
          aria-label={isFa ? 'انتخابگر سریع نقش و پرتال' : 'Quick Role Switcher'}
          className="grid grid-cols-2 sm:grid-cols-4 gap-2"
        >
          {roles.map((role) => {
            const isActive = activePortal === role.id;
            return (
              <button
                key={role.id}
                type="button"
                data-testid={`role-switch-${role.id}`}
                onClick={() => onSelectPortal(role.id)}
                className={`h-11 px-3 rounded-xl border text-start flex items-center gap-2.5 transition cursor-pointer ${
                  isActive
                    ? 'bg-emerald-500/15 border-emerald-500/50 text-emerald-300 shadow-sm'
                    : 'bg-slate-900/80 hover:bg-slate-800/80 border-slate-800 text-slate-300'
                }`}
              >
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                    isActive
                      ? 'bg-emerald-500 text-slate-950'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {role.icon}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-bold truncate">
                    {isFa ? role.labelFa : role.labelEn}
                  </div>
                  <div className="text-[10px] text-slate-400 truncate">
                    {isFa ? role.badgeFa : role.badgeEn}
                  </div>
                </div>
              </button>
            );
          })}
        </nav>

        {/* Controls: Idle Security Timer, Theme Settings, Language Switcher */}
        <div className="flex flex-wrap items-center justify-end gap-2">
          {/* Idle Session Timer Badge & Lock Trigger */}
          <div className="flex items-center rounded-xl bg-slate-900 border border-slate-800 p-1">
            <div
              data-testid="idle-timer-badge"
              className="px-2.5 py-1 flex items-center gap-1.5 text-xs text-slate-300"
              title={
                isFa
                  ? 'زمان باقی‌مانده تا قفل خودکار نشست (۱۵ دقیقه عدم فعالیت)'
                  : 'Remaining time before 15-minute auto-lock'
              }
            >
              <Clock className="w-3.5 h-3.5 text-emerald-400" />
              <span dir="ltr" className="font-mono font-semibold text-emerald-300">
                {idleRemainingFormatted}
              </span>
            </div>
            <button
              type="button"
              data-testid="simulate-idle-lock-btn"
              onClick={onSimulateIdleLock}
              className="h-7 px-2.5 rounded-lg bg-slate-800 hover:bg-amber-500/20 hover:text-amber-300 text-slate-300 text-[11px] font-semibold inline-flex items-center gap-1 transition cursor-pointer"
              title={isFa ? 'قفل فوری نشست امنیتی' : 'Lock Session Immediately'}
            >
              <Lock className="w-3 h-3" />
              <span>{isFa ? 'قفل نشست' : 'Lock'}</span>
            </button>
          </div>

          {/* Theme Settings Panel Dropdown */}
          <div className="relative">
            <button
              type="button"
              data-testid="theme-settings-toggle-btn"
              onClick={() => setThemeDropdownOpen((prev) => !prev)}
              className="h-9 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 text-xs font-semibold inline-flex items-center gap-1.5 transition cursor-pointer"
            >
              <Palette className="w-3.5 h-3.5 text-cyan-400" />
              <span>
                {themeMode === 'deep-space'
                  ? isFa
                    ? 'پوسته: فضای عمیق (کنتراست بالا)'
                    : 'Theme: Deep Space'
                  : isFa
                  ? 'پوسته: نیمه‌شب (استاندارد)'
                  : 'Theme: Midnight'}
              </span>
            </button>

            {themeDropdownOpen && (
              <div
                data-testid="theme-settings-panel"
                className="absolute end-0 mt-2 w-72 rounded-2xl bg-slate-900 border border-slate-700 p-3 shadow-2xl z-50"
              >
                <div className="text-xs font-bold text-white mb-2 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                  <span>
                    {isFa
                      ? 'تنظیمات پوسته اتاق فرماندهی (Theme Settings)'
                      : 'Mission Control Theme Settings'}
                  </span>
                </div>
                <div className="flex flex-col gap-2">
                  <button
                    type="button"
                    data-testid="theme-option-midnight"
                    onClick={() => {
                      onToggleThemeMode('midnight');
                      setThemeDropdownOpen(false);
                    }}
                    className={`p-2.5 rounded-xl border text-start transition cursor-pointer ${
                      themeMode === 'midnight'
                        ? 'bg-emerald-500/15 border-emerald-500/50 text-white'
                        : 'bg-slate-950/80 border-slate-800 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <div className="text-xs font-bold">
                      {isFa ? 'نیمه‌شب استاندارد (Midnight Dark)' : 'Midnight Default'}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      {isFa
                        ? 'پوسته پیش‌فرض با کنتراست متوازن برای شیفت‌های روزانه'
                        : 'Balanced slate-950 dark palette for standard shifts'}
                    </div>
                  </button>

                  <button
                    type="button"
                    data-testid="theme-option-deep-space"
                    onClick={() => {
                      onToggleThemeMode('deep-space');
                      setThemeDropdownOpen(false);
                    }}
                    className={`p-2.5 rounded-xl border text-start transition cursor-pointer ${
                      themeMode === 'deep-space'
                        ? 'bg-cyan-500/15 border-cyan-400 text-white'
                        : 'bg-slate-950/80 border-slate-800 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <div className="text-xs font-bold">
                      {isFa
                        ? 'فضای عمیق کنتراست بالا (Deep Space OLED)'
                        : 'Deep Space High-Contrast'}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      {isFa
                        ? 'پس‌زمینه مشکی مطلق و کادرهای درخشان مخصوص اتاق کنترل کم‌نور'
                        : 'Pure OLED black canvas with high-luminance borders for low-light rooms'}
                    </div>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Language Toggle */}
          <button
            type="button"
            data-testid="language-toggle-btn"
            onClick={onToggleLanguage}
            className="h-9 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 text-xs font-bold inline-flex items-center gap-1.5 transition cursor-pointer"
          >
            <Globe className="w-3.5 h-3.5 text-emerald-400" />
            <span>{isFa ? 'English (LTR)' : 'فارسی (RTL)'}</span>
          </button>
        </div>
      </div>
    </header>
  );
};
