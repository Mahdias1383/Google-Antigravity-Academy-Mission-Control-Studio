import React, { useState, useEffect, useRef } from 'react';
import {
  Timer,
  Play,
  Pause,
  RotateCcw,
  Flame,
  CheckCircle2,
  Clock,
  BookOpen,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Zap,
  BarChart3,
  Calendar,
  X,
  Plus,
  Minus,
  Check,
} from 'lucide-react';
import { CurriculumModule } from '../types/curriculum';
import {
  PomodoroSessionMode,
  POMODORO_MODES,
  DeepWorkLogEntry,
  formatTimerDisplay,
  formatDeepWorkDuration,
  calculateDeepWorkXp,
  recordDeepWorkSession,
  calculateModuleDeepWorkSummaries,
  calculateTotalDeepWorkStats,
  parseDeepWorkLogsFromStorage,
  serializeDeepWorkLogsToStorage,
  syncDeepWorkMinutesToStreakStorage,
  DEEP_WORK_LOGS_STORAGE_KEY,
} from '../utils/pomodoroTimer';
import { StudySessionDay } from '../utils/achievements';
import { useLanguage } from '../context/LanguageContext';

export interface PomodoroHeaderWidgetProps {
  currentModule: CurriculumModule;
  onStudyMinutesLogged?: (minutes: number, moduleId: string) => void;
  className?: string;
}

const DEFAULT_FALLBACK_STUDY_DAYS: StudySessionDay[] = [
  { dateIso: '2026-10-21', dayLabelFa: 'چهارشنبه', minutesStudied: 35, modulesTouched: 1, active: true },
  { dateIso: '2026-10-22', dayLabelFa: 'پنج‌شنبه', minutesStudied: 45, modulesTouched: 2, active: true },
  { dateIso: '2026-10-23', dayLabelFa: 'جمعه', minutesStudied: 20, modulesTouched: 1, active: true },
  { dateIso: '2026-10-24', dayLabelFa: 'شنبه', minutesStudied: 50, modulesTouched: 2, active: true },
  { dateIso: '2026-10-25', dayLabelFa: 'یکشنبه', minutesStudied: 55, modulesTouched: 2, active: true },
  { dateIso: '2026-10-26', dayLabelFa: 'دوشنبه', minutesStudied: 35, modulesTouched: 1, active: true },
  { dateIso: '2026-10-27', dayLabelFa: 'امروز (سه‌شنبه)', minutesStudied: 45, modulesTouched: 2, active: true },
];

export const PomodoroHeaderWidget: React.FC<PomodoroHeaderWidgetProps> = ({
  currentModule,
  onStudyMinutesLogged,
  className = '',
}) => {
  const { language, isRTL, t } = useLanguage();
  const [mode, setMode] = useState<PomodoroSessionMode>('focus');
  const [remainingSeconds, setRemainingSeconds] = useState<number>(
    POMODORO_MODES['focus'].durationSeconds
  );
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [isPopoverOpen, setIsPopoverOpen] = useState<boolean>(false);
  const [elapsedActiveSeconds, setElapsedActiveSeconds] = useState<number>(0);
  const [sessionNotes, setSessionNotes] = useState<string>('');
  const [feedbackToast, setFeedbackToast] = useState<string | null>(null);

  // Deep work logs
  const [deepWorkLogs, setDeepWorkLogs] = useState<DeepWorkLogEntry[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const raw = window.localStorage.getItem(DEEP_WORK_LOGS_STORAGE_KEY);
      return parseDeepWorkLogsFromStorage(raw);
    } catch {
      return [];
    }
  });

  const popoverRef = useRef<HTMLDivElement | null>(null);

  // Close popover when clicking outside
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node)
      ) {
        setIsPopoverOpen(false);
      }
    };
    if (isPopoverOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isPopoverOpen]);

  // Main countdown timer ticker
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;

    if (isRunning) {
      interval = setInterval(() => {
        setRemainingSeconds((prev) => {
          if (prev <= 1) {
            // Auto complete session
            setIsRunning(false);
            handleAutoFinishSession();
            return 0;
          }
          return prev - 1;
        });

        setElapsedActiveSeconds((prev) => prev + 1);
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, mode, currentModule.id]);

  // Handle auto completion when countdown hits 0
  const handleAutoFinishSession = () => {
    const targetMins = Math.max(1, Math.round(POMODORO_MODES[mode].durationSeconds / 60));
    commitDeepWorkLog(targetMins, mode, 'اتمام خودکار دور تمرکز پومودورو');
  };

  // Change mode
  const handleSwitchMode = (nextMode: PomodoroSessionMode) => {
    setMode(nextMode);
    setIsRunning(false);
    setRemainingSeconds(POMODORO_MODES[nextMode].durationSeconds);
  };

  // Toggle run / pause
  const handleTogglePlayPause = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setIsRunning((prev) => !prev);
  };

  // Reset timer
  const handleResetTimer = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setIsRunning(false);
    setRemainingSeconds(POMODORO_MODES[mode].durationSeconds);
    setElapsedActiveSeconds(0);
  };

  // Quick adjust duration (+5m / -5m)
  const handleAdjustSeconds = (deltaSeconds: number) => {
    setRemainingSeconds((prev) => Math.max(60, prev + deltaSeconds));
  };

  // Commit deep work log to persistent storage
  const commitDeepWorkLog = (
    minutes: number,
    sessionMode: PomodoroSessionMode,
    customNotes?: string
  ) => {
    const safeMinutes = Math.max(1, Math.round(minutes));
    const result = recordDeepWorkSession(deepWorkLogs, {
      moduleId: currentModule.id,
      moduleNumber: currentModule.number,
      moduleTitleFa: currentModule.titleFa,
      moduleTitleEn: currentModule.titleEn,
      durationMinutes: safeMinutes,
      mode: sessionMode,
      notes: customNotes || sessionNotes || undefined,
    });

    setDeepWorkLogs(result.updatedLogs);
    try {
      window.localStorage.setItem(
        DEEP_WORK_LOGS_STORAGE_KEY,
        serializeDeepWorkLogsToStorage(result.updatedLogs)
      );
    } catch {
      // Ignore quota errors
    }

    // Sync study minutes to streak tracker
    syncDeepWorkMinutesToStreakStorage(safeMinutes, DEFAULT_FALLBACK_STUDY_DAYS);

    if (onStudyMinutesLogged) {
      onStudyMinutesLogged(safeMinutes, currentModule.id);
    }

    const toastMsg = language === 'en'
      ? `Logged! ${safeMinutes}m deep work saved for Module ${currentModule.number} (+${result.xpEarned} XP)`
      : `ثبت موفق! ${safeMinutes} دقیقه کار عمیق برای فصل ${currentModule.number} ذخیره شد (+${result.xpEarned} XP)`;

    setFeedbackToast(toastMsg);
    setTimeout(() => setFeedbackToast(null), 4500);

    // Reset elapsed
    setElapsedActiveSeconds(0);
    setSessionNotes('');
  };

  // Manually log current elapsed or full focus session
  const handleManualLogDeepWork = () => {
    const elapsedMinutes = Math.max(
      1,
      Math.round(
        elapsedActiveSeconds > 60
          ? elapsedActiveSeconds / 60
          : POMODORO_MODES[mode].durationSeconds / 60
      )
    );
    commitDeepWorkLog(elapsedMinutes, mode);
  };

  // Computed statistics
  const moduleSummaries = calculateModuleDeepWorkSummaries(deepWorkLogs);
  const currentModuleSummary = moduleSummaries[currentModule.id] || {
    moduleId: currentModule.id,
    moduleNumber: currentModule.number,
    moduleTitleFa: currentModule.titleFa,
    moduleTitleEn: currentModule.titleEn,
    totalMinutes: 0,
    totalHoursFormatted: '0m',
    sessionsCount: 0,
    xpEarned: 0,
  };
  const totalStats = calculateTotalDeepWorkStats(deepWorkLogs);

  // Progress ratio for ring or bar
  const totalDuration = POMODORO_MODES[mode].durationSeconds;
  const progressPercent = Math.min(
    100,
    Math.max(0, Math.round(((totalDuration - remainingSeconds) / totalDuration) * 100))
  );

  const getModeLabel = (mKey: PomodoroSessionMode) => {
    switch (mKey) {
      case 'focus':
        return t('pomodoroStandard');
      case 'deep-work':
        return t('pomodoroDeepWork');
      case 'short-break':
        return t('pomodoroShortBreak');
      case 'long-break':
        return t('pomodoroLongBreak');
    }
  };

  return (
    <div
      ref={popoverRef}
      className={`relative inline-flex items-center ${className}`}
      data-testid="pomodoro-header-widget"
    >
      {/* Compact Header Utility Trigger */}
      <div
        onClick={() => setIsPopoverOpen((prev) => !prev)}
        data-testid="pomodoro-pill-button"
        className={`group h-8 flex items-center gap-1.5 px-2.5 rounded-lg border transition-colors cursor-pointer select-none ${
          isRunning
            ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300'
            : 'border-slate-200/80 dark:border-white/[0.08] bg-slate-100/70 dark:bg-[#0c121e] hover:border-slate-300 dark:hover:border-white/15 hover:bg-slate-200/60 dark:hover:bg-white/[0.05] text-slate-600 dark:text-slate-300'
        }`}
        title={language === 'en' ? 'Pomodoro Study Timer & Deep Work Logger' : 'تایمر مطالعه پومودورو و کار عمیق (Deep Work Timer)'}
      >
        <div className="relative flex items-center justify-center">
          {isRunning ? (
            <Flame className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
          ) : (
            <Timer className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-400 shrink-0" />
          )}
        </div>

        <span
          dir="ltr"
          data-testid="pomodoro-header-clock"
          className="ltr-inline font-mono font-semibold text-xs tracking-tight tabular-nums"
        >
          {formatTimerDisplay(remainingSeconds)}
        </span>

        <button
          type="button"
          onClick={handleTogglePlayPause}
          data-testid="pomodoro-quick-play-btn"
          aria-label={isRunning ? (language === 'en' ? 'Pause Timer' : 'توقف موقت تایمر') : (language === 'en' ? 'Start Pomodoro Timer' : 'شروع تایمر پومودورو')}
          className={`p-0.5 rounded transition-colors cursor-pointer ${
            isRunning
              ? 'text-emerald-600 dark:text-emerald-300 hover:bg-emerald-500/20'
              : 'text-slate-400 hover:text-blue-500'
          }`}
        >
          {isRunning ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3 fill-current" />}
        </button>

        <span
          dir="ltr"
          data-testid="pomodoro-header-module-hours"
          className="sr-only"
        >
          {currentModuleSummary.totalHoursFormatted}
        </span>
      </div>

      {/* Expanded Focus Center Popover Modal */}
      {isPopoverOpen && (
        <div
          data-testid="pomodoro-popover-panel"
          className={`absolute ${
            isRTL ? 'left-0' : 'right-0'
          } top-full mt-2 w-80 sm:w-96 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-[#0c121e]/95 backdrop-blur-xl shadow-2xl p-4 sm:p-5 z-50 space-y-4 animate-in fade-in zoom-in-95 duration-150`}
        >
          {/* Popover Header */}
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-500/15 border border-blue-500/35 flex items-center justify-center text-blue-500">
                <Timer className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white">
                  {t('pomodoroTitle')}
                </h3>
                <div
                  dir="ltr"
                  className={`ltr-inline text-[10px] font-mono text-slate-500 ${
                    isRTL ? 'text-left' : 'text-left'
                  } block`}
                >
                  {t('pomodoroSubtitle')}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsPopoverOpen(false)}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer"
              aria-label={language === 'en' ? 'Close Pomodoro Panel' : 'بستن پنجره پومودورو'}
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Active Target Module Indicator */}
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800/80 space-y-1">
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 dark:text-slate-400">
              <span className="flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-blue-500" />
                <span>{t('activeModuleTarget')}</span>
              </span>
              <span
                dir="ltr"
                data-testid="pomodoro-target-module-badge"
                className="ltr-inline font-mono text-[10px] text-blue-500 font-extrabold"
              >
                MOD-0{currentModule.number}
              </span>
            </div>
            <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
              {language === 'en'
                ? `Module ${currentModule.number}: ${currentModule.titleEn}`
                : `فصل ${currentModule.number}: ${currentModule.titleFa}`}
            </div>
            <div
              dir={language === 'en' ? 'rtl' : 'ltr'}
              className={`text-[10px] font-mono text-slate-500 truncate block ${
                isRTL ? 'text-left' : 'text-left'
              }`}
            >
              {language === 'en' ? currentModule.titleFa : currentModule.titleEn}
            </div>
          </div>

          {/* 4 Mode Selector Tabs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            {(['focus', 'deep-work', 'short-break', 'long-break'] as const).map((mKey) => {
              const cfg = POMODORO_MODES[mKey];
              const isCurrent = mode === mKey;
              return (
                <button
                  key={mKey}
                  type="button"
                  onClick={() => handleSwitchMode(mKey)}
                  data-testid={`pomodoro-mode-btn-${mKey}`}
                  className={`px-2 py-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer flex flex-col items-center justify-center gap-0.5 ${
                    isCurrent
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <span className="truncate w-full text-center">{getModeLabel(mKey)}</span>
                  <span
                    dir="ltr"
                    className="ltr-inline font-mono text-[9px] opacity-80"
                  >
                    {Math.round(cfg.durationSeconds / 60)}m
                  </span>
                </button>
              );
            })}
          </div>

          {/* Big Clock Display & Circular Progress Bar */}
          <div className="py-2 flex flex-col items-center justify-center space-y-3">
            <div className="relative w-44 h-44 rounded-full border-4 border-slate-100 dark:border-slate-800 flex flex-col items-center justify-center shadow-inner">
              {/* Animated Progress Ring SVG */}
              <svg className="absolute inset-0 w-full h-full -rotate-90">
                <circle
                  cx="88"
                  cy="88"
                  r="80"
                  className="stroke-slate-200 dark:stroke-slate-800/80"
                  strokeWidth="6"
                  fill="none"
                />
                <circle
                  cx="88"
                  cy="88"
                  r="80"
                  className={`transition-all duration-500 ${
                    isRunning ? 'stroke-emerald-500' : 'stroke-blue-500'
                  }`}
                  strokeWidth="6"
                  strokeDasharray={2 * Math.PI * 80}
                  strokeDashoffset={2 * Math.PI * 80 * (1 - progressPercent / 100)}
                  strokeLinecap="round"
                  fill="none"
                />
              </svg>

              {/* Big Time Readout */}
              <div
                dir="ltr"
                data-testid="pomodoro-clock-display"
                className="ltr-inline text-3xl sm:text-4xl font-mono font-black tracking-tight text-slate-900 dark:text-white tabular-nums z-10"
              >
                {formatTimerDisplay(remainingSeconds)}
              </div>

              {/* Mode Label */}
              <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 mt-1 z-10">
                {getModeLabel(mode)}
              </div>

              {/* Reward preview */}
              {(mode === 'focus' || mode === 'deep-work') && (
                <div
                  dir="ltr"
                  className="ltr-inline text-[10px] font-mono text-amber-500 font-extrabold z-10"
                >
                  +{calculateDeepWorkXp(Math.round(POMODORO_MODES[mode].durationSeconds / 60), mode)} XP
                </div>
              )}
            </div>

            {/* Quick Adjustment Controls (+5m / -5m) */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleAdjustSeconds(-300)}
                data-testid="pomodoro-adjust-minus-btn"
                className="px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-800 text-[10px] font-mono font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-1 cursor-pointer"
              >
                <Minus className="w-3 h-3" />
                <span>5m</span>
              </button>

              <button
                type="button"
                onClick={handleResetTimer}
                data-testid="pomodoro-reset-btn"
                className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-800 text-[10px] font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>{t('resetTimer')}</span>
              </button>

              <button
                type="button"
                onClick={() => handleAdjustSeconds(300)}
                data-testid="pomodoro-adjust-plus-btn"
                className="px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-800 text-[10px] font-mono font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3 h-3" />
                <span>5m</span>
              </button>
            </div>
          </div>

          {/* Primary Action Buttons: Start/Pause & Log Deep Work */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
            <button
              type="button"
              onClick={() => handleTogglePlayPause()}
              data-testid="pomodoro-main-play-btn"
              className={`w-full py-2.5 rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer ${
                isRunning
                  ? 'bg-amber-600 hover:bg-amber-500 text-white'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white'
              }`}
            >
              {isRunning ? (
                <>
                  <Pause className="w-4 h-4 fill-current" />
                  <span>{t('pauseFocus')}</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current" />
                  <span>{t('startFocus')}</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleManualLogDeepWork}
              data-testid="pomodoro-log-deepwork-btn"
              className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-extrabold flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer"
            >
              <Zap className="w-4 h-4 fill-current" />
              <span>{t('logDeepWorkBtn', { num: currentModule.number })}</span>
            </button>
          </div>

          {/* Optional Short Session Note */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1">
              {t('sessionNotesLabel')}
            </label>
            <input
              type="text"
              value={sessionNotes}
              onChange={(e) => setSessionNotes(e.target.value)}
              placeholder={t('sessionNotesPlaceholder')}
              className="w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-2.5 py-1.5 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Success Toast Banner */}
          {feedbackToast && (
            <div
              data-testid="pomodoro-feedback-toast"
              className="p-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/35 text-emerald-600 dark:text-emerald-300 text-xs font-bold flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
              <span>{feedbackToast}</span>
            </div>
          )}

          {/* Deep Work Stats for Current Module vs Overall */}
          <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-200">
              <span className="flex items-center gap-1.5">
                <BarChart3 className="w-3.5 h-3.5 text-indigo-500" />
                <span>{t('moduleStatsTitle', { num: currentModule.number })}</span>
              </span>
              <span
                dir="ltr"
                data-testid="pomodoro-module-total-mins"
                className="ltr-inline font-mono text-emerald-500 font-extrabold"
              >
                {currentModuleSummary.totalMinutes} Mins ({currentModuleSummary.totalHoursFormatted})
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-500 dark:text-slate-400">
              <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <div>{t('moduleSessionsLabel')}</div>
                <div
                  dir="ltr"
                  className="ltr-inline font-mono font-bold text-slate-800 dark:text-slate-200 text-xs"
                >
                  {currentModuleSummary.sessionsCount} Sessions
                </div>
              </div>

              <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <div>{t('totalDeepWorkLabel')}</div>
                <div
                  dir="ltr"
                  data-testid="pomodoro-all-modules-hours"
                  className="ltr-inline font-mono font-bold text-indigo-500 text-xs"
                >
                  {totalStats.totalHoursFormatted} ({totalStats.totalSessions} Sessions)
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
