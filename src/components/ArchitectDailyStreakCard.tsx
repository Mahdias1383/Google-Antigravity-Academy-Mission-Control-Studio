import React, { useState, useEffect } from 'react';
import { Flame, Zap, ChevronRight, Award, Sparkles, Check, Info } from 'lucide-react';
import {
  calculateStreakMultiplier,
  getStoredDailyStreak,
  recordDailyStreakCheckIn,
  STREAK_TIER_SPECS,
  STREAK_UPDATED_EVENT,
  StreakMultiplierEvaluation,
} from '../utils/streakMultiplier';

interface ArchitectDailyStreakCardProps {
  language: 'fa' | 'en';
  onXpAwarded?: (xp: number) => void;
  onNavigateToAchievements?: () => void;
}

export const ArchitectDailyStreakCard: React.FC<ArchitectDailyStreakCardProps> = ({
  language,
  onXpAwarded,
  onNavigateToAchievements,
}) => {
  const [streakState, setStreakState] = useState(() => getStoredDailyStreak(14, 14));
  const [evaluation, setEvaluation] = useState<StreakMultiplierEvaluation>(() =>
    calculateStreakMultiplier(streakState.currentStreakDays, streakState.longestStreakDays)
  );
  const [showTiersModal, setShowTiersModal] = useState<boolean>(false);
  const [isCheckInAnimating, setIsCheckInAnimating] = useState<boolean>(false);
  const [justCheckedInXp, setJustCheckedInXp] = useState<number | null>(null);

  // Sync state with storage and listen for global streak events
  useEffect(() => {
    const handleSync = () => {
      const updated = getStoredDailyStreak(14, 14);
      setStreakState(updated);
      setEvaluation(
        calculateStreakMultiplier(updated.currentStreakDays, updated.longestStreakDays)
      );
    };

    window.addEventListener(STREAK_UPDATED_EVENT, handleSync);
    window.addEventListener('storage', handleSync);
    return () => {
      window.removeEventListener(STREAK_UPDATED_EVENT, handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, []);

  const handleCheckIn = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isCheckInAnimating) return;

    const result = recordDailyStreakCheckIn({ forcedStreakIncrement: true });
    setIsCheckInAnimating(true);
    setJustCheckedInXp(result.xpAwarded);

    const updated = getStoredDailyStreak(result.updatedStreakDays, result.updatedLongestDays);
    setStreakState(updated);
    setEvaluation(
      calculateStreakMultiplier(updated.currentStreakDays, updated.longestStreakDays)
    );

    if (result.xpAwarded > 0 && onXpAwarded) {
      onXpAwarded(result.xpAwarded);
    }

    setTimeout(() => {
      setIsCheckInAnimating(false);
      setJustCheckedInXp(null);
    }, 2400);
  };

  const isRTL = language === 'fa';
  const tier = evaluation.tier;
  const nextTier = evaluation.nextTier;

  return (
    <div
      data-testid="sidebar-daily-streak-counter"
      className="mt-2.5 pt-2.5 border-t border-slate-200/70 dark:border-white/[0.06] space-y-2 relative"
    >
      {/* Header Row: Flame, Streak Days, and Multiplier Badge */}
      <div className="flex items-center justify-between gap-1.5">
        <div className="flex items-center gap-1.5 min-w-0">
          <span
            className={`w-5 h-5 rounded-lg flex items-center justify-center text-xs shrink-0 ${
              isCheckInAnimating
                ? 'bg-amber-500 text-slate-950 ring-2 ring-amber-400 scale-110 animate-bounce'
                : 'bg-gradient-to-br from-amber-500/20 to-orange-500/20 text-amber-500 ring-1 ring-amber-500/30'
            } transition-all duration-300`}
            title={language === 'en' ? 'Consecutive Daily Streak' : 'پیوستگی استمرار روزانه'}
          >
            <Flame className="w-3.5 h-3.5 fill-amber-500/40 text-amber-500" />
          </span>

          <div className="flex items-center gap-1 min-w-0">
            <span
              data-testid="sidebar-streak-days"
              className="text-[11px] font-extrabold text-slate-800 dark:text-slate-100 tabular-nums truncate"
            >
              {language === 'en'
                ? `${evaluation.currentStreakDays}-Day Streak`
                : `${evaluation.currentStreakDays} روز پیوستگی`}
            </span>

            <span
              data-testid="sidebar-streak-badge"
              className={`text-[9px] font-mono font-bold px-1 py-0.2 rounded ${tier.bgClass} ${tier.textClass} border ${tier.borderClass} shrink-0 truncate max-w-[90px]`}
              title={language === 'en' ? tier.descriptionEn : tier.descriptionFa}
            >
              {language === 'en' ? tier.badgeTitleEn : tier.badgeTitleFa}
            </span>
          </div>
        </div>

        {/* Multiplier Pill */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setShowTiersModal((prev) => !prev);
          }}
          data-testid="sidebar-streak-multiplier"
          title={
            language === 'en'
              ? `Current XP Multiplier: ${tier.multiplierLabel} (${tier.badgeTitleEn}). Click for tier breakdown.`
              : `ضریب فعلی امتیاز: ${tier.multiplierLabel} (${tier.badgeTitleFa}). کلیک برای مشاهده تمام سطوح.`
          }
          className={`px-1.5 py-0.5 rounded-md font-mono text-[10px] font-extrabold tabular-nums flex items-center gap-0.5 cursor-pointer transition-all ${
            isCheckInAnimating
              ? 'bg-emerald-500 text-white shadow-sm ring-2 ring-emerald-400 scale-105'
              : 'bg-gradient-to-r from-amber-500/15 via-orange-500/15 to-amber-500/15 text-amber-600 dark:text-amber-300 border border-amber-500/30 hover:border-amber-500/60'
          }`}
        >
          <Zap className="w-2.5 h-2.5 text-amber-500 fill-amber-500/30 shrink-0" />
          <span>{tier.multiplierLabel} XP</span>
        </button>
      </div>

      {/* Progress Bar & Subtitle toward next multiplier milestone */}
      {nextTier ? (
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[9px] text-slate-500 dark:text-slate-400">
            <span className="truncate">
              {language === 'en'
                ? `${evaluation.daysToNextTier}d to ${nextTier.multiplierLabel} (${nextTier.badgeTitleEn})`
                : `${evaluation.daysToNextTier} روز تا ضریب ${nextTier.multiplierLabel} (${nextTier.badgeTitleFa})`}
            </span>
            <span dir="ltr" className="ltr-inline font-mono font-bold text-[9px]">
              {evaluation.progressPercentToNextTier}%
            </span>
          </div>
          <div className="h-1 w-full bg-slate-200/80 dark:bg-white/[0.08] rounded-full overflow-hidden">
            <div
              data-testid="sidebar-streak-progress-bar"
              className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${Math.max(6, evaluation.progressPercentToNextTier)}%` }}
            />
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between text-[9px] text-emerald-600 dark:text-emerald-400 font-bold">
          <span>{language === 'en' ? 'Max XP Multiplier Active!' : 'حداکثر ضریب ۲.۰x فعال است!'}</span>
          <span className="font-mono text-[9px]">2.0x Double XP</span>
        </div>
      )}

      {/* Interactive Daily Check-in / Boost Button */}
      <div className="flex items-center gap-1.5 pt-0.5 relative">
        {isCheckInAnimating && justCheckedInXp !== null && (
          <div
            data-testid="sidebar-streak-checkin-floating-xp"
            className="absolute -top-6 left-1/2 -translate-x-1/2 flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500 text-slate-950 text-[9px] font-mono font-black shadow-lg shadow-amber-500/40 pointer-events-none animate-bounce z-20 whitespace-nowrap"
          >
            <Sparkles className="w-2.5 h-2.5" />
            <span>+{justCheckedInXp} XP ({tier.multiplierLabel})</span>
          </div>
        )}

        <button
          type="button"
          onClick={handleCheckIn}
          data-testid="sidebar-streak-checkin-btn"
          className={`flex-1 py-1 px-2 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 transition-all cursor-pointer ${
            isCheckInAnimating
              ? 'bg-amber-500 text-slate-950 shadow-xs ring-2 ring-amber-400'
              : streakState.checkedInToday
              ? 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25'
              : 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-2xs'
          }`}
          title={
            language === 'en'
              ? 'Log daily study attendance to boost consecutive streak & XP'
              : 'ثبت حضور روزانه جهت افزایش پیوستگی و دریافت ضریب XP'
          }
        >
          {streakState.checkedInToday ? (
            <>
              <Check className="w-3 h-3 text-emerald-500" />
              <span>{language === 'en' ? 'Checked in Today (+Streak)' : 'حضور امروز ثبت شد (+پیوستگی)'}</span>
            </>
          ) : (
            <>
              <Flame className="w-3 h-3 text-amber-500 fill-amber-500/30" />
              <span>{language === 'en' ? 'Check-in Today (+50 XP)' : 'ثبت استمرار امروز (+۵۰ XP)'}</span>
            </>
          )}
        </button>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            if (onNavigateToAchievements) {
              onNavigateToAchievements();
            } else {
              setShowTiersModal((prev) => !prev);
            }
          }}
          data-testid="sidebar-streak-info-btn"
          title={language === 'en' ? 'View Streak Milestones' : 'مشاهده نشان‌های پیوستگی'}
          className="p-1 rounded-lg border border-slate-200/80 dark:border-white/[0.08] hover:border-amber-500/40 text-slate-400 hover:text-amber-500 transition-colors cursor-pointer"
        >
          <Award className="w-3 h-3" />
        </button>
      </div>

      {/* Expandable Multiplier Tiers Modal / Popover */}
      {showTiersModal && (
        <div
          data-testid="sidebar-streak-tiers-popover"
          className="absolute bottom-full mb-2 left-0 right-0 p-3 rounded-2xl bg-white dark:bg-[#0c121e] border border-slate-200/90 dark:border-white/[0.1] shadow-xl space-y-2 z-30 animate-scale-in"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between border-b border-slate-200/60 dark:border-white/[0.06] pb-1.5">
            <div className="flex items-center gap-1.5">
              <Flame className="w-3.5 h-3.5 text-amber-500" />
              <span className="text-xs font-bold text-slate-900 dark:text-white">
                {language === 'en' ? 'XP Multiplier Tiers' : 'سطوح ضرایب استمرار XP'}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setShowTiersModal(false)}
              className="text-[10px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-bold px-1"
            >
              ✕
            </button>
          </div>

          <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed">
            {language === 'en'
              ? 'Consistency boosts all XP rewards from quizzes, deep work, and missions:'
              : 'استمرار روزانه ضریب تمام پاداش‌های آزمون‌ها، تایمر و مأموریت‌ها را افزایش می‌دهد:'}
          </p>

          <div className="space-y-1 max-h-48 overflow-y-auto custom-scrollbar">
            {STREAK_TIER_SPECS.map((spec) => {
              const isCurrent = spec.badgeCode === tier.badgeCode;
              return (
                <div
                  key={spec.badgeCode}
                  className={`p-1.5 rounded-xl border text-[10px] flex items-center justify-between gap-1.5 transition-all ${
                    isCurrent
                      ? 'border-amber-500/40 bg-amber-500/10 font-bold text-amber-600 dark:text-amber-300'
                      : 'border-slate-200/50 dark:border-white/[0.04] bg-slate-50/50 dark:bg-white/[0.02] text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="text-xs">{spec.icon}</span>
                    <div className="flex flex-col min-w-0">
                      <span className="truncate font-semibold">
                        {language === 'en' ? spec.badgeTitleEn : spec.badgeTitleFa}
                      </span>
                      <span className="text-[9px] text-slate-400 font-mono">
                        {spec.maxDays ? `${spec.minDays}-${spec.maxDays}d` : `${spec.minDays}+d`}
                      </span>
                    </div>
                  </div>
                  <span
                    dir="ltr"
                    className="ltr-inline font-mono font-extrabold text-[10px] px-1.5 py-0.2 rounded bg-white dark:bg-[#070b13] border border-slate-200/60 dark:border-white/[0.06]"
                  >
                    {spec.multiplierLabel} XP
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
