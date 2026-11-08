import React, { useState, useEffect, useMemo } from 'react';
import {
  Flame,
  Calendar,
  Zap,
  Award,
  CheckCircle2,
  Clock,
  Sparkles,
  Target,
  BookOpen,
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import {
  buildThirtyDayActivityHeatmap,
  getStoredHeatmapOverrides,
  recordThirtyDayActivityBoost,
  HeatmapContributionCategory,
  THIRTY_DAY_HEATMAP_UPDATED_EVENT,
  ThirtyDayHeatmapCell,
} from '../utils/thirtyDayActivityHeatmap';
import {
  getStoredDailyStreak,
  STREAK_UPDATED_EVENT,
} from '../utils/streakMultiplier';
import {
  formatLocalizedNumber,
  formatLocalizedThousand,
  localizeDigits,
} from '../utils/bidiText';

interface ThirtyDayContributionHeatmapProps {
  completedModulesCount: number;
  completedMissionsCount: number;
  onStreakUpdated?: (currentStreakDays: number, xpAwarded: number) => void;
}

export const ThirtyDayContributionHeatmap: React.FC<
  ThirtyDayContributionHeatmapProps
> = ({
  completedModulesCount,
  completedMissionsCount,
  onStreakUpdated,
}) => {
  const { language } = useLanguage();
  const isEn = language === 'en';

  const [categoryFilter, setCategoryFilter] =
    useState<HeatmapContributionCategory>('all');
  const [streakSnapshot, setStreakSnapshot] = useState(() =>
    getStoredDailyStreak(14, 14)
  );
  const [overridesMap, setOverridesMap] = useState(() =>
    getStoredHeatmapOverrides()
  );
  const [selectedDayIndex, setSelectedDayIndex] = useState<number>(29); // Default to Today (index 29)
  const [justLoggedBoost, setJustLoggedBoost] = useState<boolean>(false);

  useEffect(() => {
    const handleSync = () => {
      setStreakSnapshot(getStoredDailyStreak(14, 14));
      setOverridesMap(getStoredHeatmapOverrides());
    };
    window.addEventListener(STREAK_UPDATED_EVENT, handleSync);
    window.addEventListener(THIRTY_DAY_HEATMAP_UPDATED_EVENT, handleSync);
    window.addEventListener('storage', handleSync);
    return () => {
      window.removeEventListener(STREAK_UPDATED_EVENT, handleSync);
      window.removeEventListener(THIRTY_DAY_HEATMAP_UPDATED_EVENT, handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, []);

  const heatmapSummary = useMemo(
    () =>
      buildThirtyDayActivityHeatmap({
        referenceDateIso: streakSnapshot.todayIso,
        targetCurrentStreak: streakSnapshot.currentStreakDays,
        completedModulesCount,
        completedMissionsCount,
        categoryFilter,
        overridesMap,
      }),
    [
      streakSnapshot.todayIso,
      streakSnapshot.currentStreakDays,
      completedModulesCount,
      completedMissionsCount,
      categoryFilter,
      overridesMap,
    ]
  );

  const selectedCell: ThirtyDayHeatmapCell =
    heatmapSummary.cells[selectedDayIndex] ||
    heatmapSummary.cells[heatmapSummary.cells.length - 1];

  const handleLogTodayActivity = () => {
    const result = recordThirtyDayActivityBoost();
    setStreakSnapshot(
      getStoredDailyStreak(
        result.streakResult.updatedStreakDays,
        result.streakResult.updatedLongestDays
      )
    );
    setOverridesMap(getStoredHeatmapOverrides());
    setSelectedDayIndex(29);
    setJustLoggedBoost(true);

    if (onStreakUpdated) {
      onStreakUpdated(
        result.streakResult.updatedStreakDays,
        result.streakResult.xpAwarded
      );
    }

    setTimeout(() => {
      setJustLoggedBoost(false);
    }, 2200);
  };

  const categoryButtons: Array<{
    id: HeatmapContributionCategory;
    labelEn: string;
    labelFa: string;
  }> = [
    { id: 'all', labelEn: 'All Activity', labelFa: 'همه فعالیت‌ها' },
    { id: 'missions', labelEn: 'Missions & Labs', labelFa: 'مأموریت و استودیو' },
    { id: 'curriculum', labelEn: 'Curriculum & Quizzes', labelFa: 'فصول و آزمون‌ها' },
    { id: 'deep-work', labelEn: 'Deep Work', labelFa: 'تمرکز عمیق' },
  ];

  const getIntensityCellClasses = (cell: ThirtyDayHeatmapCell) => {
    if (cell.intensityLevel === 4) {
      return cell.isPartOfCurrentStreak
        ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-xs'
        : 'bg-blue-600 text-white border-blue-500';
    }
    if (cell.intensityLevel === 3) {
      return cell.isPartOfCurrentStreak
        ? 'bg-emerald-500/80 text-white border-emerald-500/50'
        : 'bg-blue-500/80 text-white border-blue-500/50';
    }
    if (cell.intensityLevel === 2) {
      return cell.isPartOfCurrentStreak
        ? 'bg-emerald-500/50 text-slate-900 dark:text-white border-emerald-500/35'
        : 'bg-blue-500/50 text-slate-900 dark:text-white border-blue-500/35';
    }
    if (cell.intensityLevel === 1) {
      return cell.isPartOfCurrentStreak
        ? 'bg-emerald-500/25 text-slate-800 dark:text-emerald-200 border-emerald-500/25'
        : 'bg-blue-500/25 text-slate-800 dark:text-blue-200 border-blue-500/25';
    }
    return 'bg-slate-100 dark:bg-white/[0.04] text-slate-400 dark:text-slate-500 border-slate-200/70 dark:border-white/[0.06]';
  };

  const tier = heatmapSummary.streakEvaluation.tier;
  const nextTier = heatmapSummary.streakEvaluation.nextTier;

  return (
    <section
      data-testid="profile-30day-heatmap"
      aria-label={
        isEn
          ? '30-Day Daily Activity Streak Contribution Heatmap'
          : 'هیت‌مپ ۳۰ روزه پیوستگی و مشارکت روزانه معمار'
      }
      className="p-6 sm:p-7 rounded-3xl border border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[#0c121e] space-y-6 shadow-xs relative overflow-hidden font-sans"
    >
      {/* 1. Header Bar: Title, Streak Multiplier Status & Quick Check-In Action */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-200/70 dark:border-white/[0.06] pb-5">
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2.5">
            <Calendar className="w-4 h-4 text-emerald-500 shrink-0" />
            <h2 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white">
              {isEn
                ? '30-Day Contribution & Daily Activity Streak Heatmap'
                : 'هیت‌مپ مشارکت و استمرار فعالیت روزانه (۳۰ روز اخیر)'}
            </h2>
            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold tabular-nums">
              · <bdi dir="ltr">{localizeDigits(tier.multiplierLabel, language)} XP</bdi> ({isEn ? tier.badgeTitleEn : tier.badgeTitleFa})
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            {isEn
              ? 'Visualizes your daily engineering momentum over the last 30 days. Active streak days are highlighted in emerald to gamify consistent engagement.'
              : 'نمایش بصری پیوستگی مهندسی شما در ۳۰ روز گذشته؛ روزهای زنجیره استمرار فعال با رنگ سبز زمردی متمایز شده‌اند تا استمرار روزانه پاداش بگیرد.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          {justLoggedBoost && (
            <span
              data-testid="heatmap-boost-confirmation"
              className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 animate-scale-in tabular-nums"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>
                {isEn
                  ? '+3 Contributions & Streak Boosted!'
                  : '+۳ مشارکت و افزایش استمرار ثبت شد!'}
              </span>
            </span>
          )}

          <button
            type="button"
            data-testid="heatmap-log-activity-btn"
            onClick={handleLogTodayActivity}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap shrink-0 ${
              justLoggedBoost
                ? 'bg-emerald-500 text-slate-950 ring-2 ring-emerald-400 scale-105'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs'
            }`}
          >
            <Flame className="w-3.5 h-3.5 fill-current" />
            <span>
              {isEn
                ? 'Log Daily Activity (+Streak)'
                : 'ثبت فعالیت امروز (+افزایش استمرار)'}
            </span>
          </button>
        </div>
      </div>

      {/* 2. Gamified 30-Day Streak KPI Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div
          data-testid="heatmap-kpi-current-streak"
          className="p-4 rounded-2xl border border-slate-200/80 dark:border-white/[0.07] bg-slate-50/60 dark:bg-white/[0.02] space-y-1.5"
        >
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-medium">
            <span>{isEn ? 'Current Daily Streak' : 'زنجیره استمرار فعلی'}</span>
            <Flame className="w-4 h-4 text-amber-500 shrink-0" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tabular-nums">
            {formatLocalizedNumber(heatmapSummary.currentStreakDays, language)}{' '}
            <span className="text-xs font-normal text-slate-500">
              {isEn ? 'Days' : 'روز متوالی'}
            </span>
          </div>
          <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold tabular-nums">
            {nextTier ? (
              isEn ? (
                `${heatmapSummary.streakEvaluation.daysToNextTier}d to ${nextTier.multiplierLabel} (${nextTier.badgeTitleEn})`
              ) : (
                <>
                  {formatLocalizedNumber(heatmapSummary.streakEvaluation.daysToNextTier, 'fa')} روز تا ضریب{' '}
                  <bdi dir="ltr">{localizeDigits(nextTier.multiplierLabel, 'fa')}</bdi>
                </>
              )
            ) : isEn ? (
              'Max 2.0x XP Multiplier Unlocked'
            ) : (
              'حداکثر ضریب ۲.۰x فعال است'
            )}
          </div>
        </div>

        <div
          data-testid="heatmap-kpi-longest-streak"
          className="p-4 rounded-2xl border border-slate-200/80 dark:border-white/[0.07] bg-slate-50/60 dark:bg-white/[0.02] space-y-1.5"
        >
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-medium">
            <span>{isEn ? 'Best 30-Day Streak' : 'بهترین رکورد ۳۰ روزه'}</span>
            <Award className="w-4 h-4 text-blue-500 shrink-0" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tabular-nums">
            {formatLocalizedNumber(heatmapSummary.longestStreakInWindow, language)}{' '}
            <span className="text-xs font-normal text-slate-500">
              {isEn ? 'Days' : 'روز'}
            </span>
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 tabular-nums">
            {isEn
              ? `Peak: ${heatmapSummary.peakDay.totalContributions} actions on ${heatmapSummary.peakDay.shortDateEn}`
              : `اوج فعالیت: ${formatLocalizedNumber(heatmapSummary.peakDay.totalContributions, 'fa')} اقدام در ${heatmapSummary.peakDay.shortDateFa}`}
          </div>
        </div>

        <div
          data-testid="heatmap-kpi-active-days"
          className="p-4 rounded-2xl border border-slate-200/80 dark:border-white/[0.07] bg-slate-50/60 dark:bg-white/[0.02] space-y-1.5"
        >
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-medium">
            <span>{isEn ? '30-Day Consistency' : 'ضریب حضور ۳۰ روزه'}</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tabular-nums">
            {isEn
              ? `${heatmapSummary.activeDaysCount} / 30`
              : `${formatLocalizedNumber(heatmapSummary.activeDaysCount, 'fa')} از ${formatLocalizedNumber(30, 'fa')}`}{' '}
            <span className="text-xs font-normal text-slate-500">
              ({formatLocalizedNumber(heatmapSummary.consistencyPercent, language)}{isEn ? '%' : '٪'})
            </span>
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 tabular-nums">
            {isEn
              ? `${heatmapSummary.totalContributions} total engineering contributions`
              : `${formatLocalizedNumber(heatmapSummary.totalContributions, 'fa')} مشارکت مهندسی ثبت‌شده`}
          </div>
        </div>

        <div
          data-testid="heatmap-kpi-window-xp"
          className="p-4 rounded-2xl border border-slate-200/80 dark:border-white/[0.07] bg-slate-50/60 dark:bg-white/[0.02] space-y-1.5"
        >
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-medium">
            <span>{isEn ? '30-Day XP & Focus' : 'امتیاز و تمرکز ۳۰ روزه'}</span>
            <Zap className="w-4 h-4 text-cyan-500 shrink-0" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tabular-nums">
            +{formatLocalizedNumber(heatmapSummary.totalXpInWindow, language)}{' '}
            <span className="text-xs font-normal text-slate-500">XP</span>
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 tabular-nums">
            {isEn
              ? `${heatmapSummary.totalMinutesInWindow} mins deep engineering focus`
              : `${formatLocalizedNumber(heatmapSummary.totalMinutesInWindow, 'fa')} دقیقه مطالعه و کار عمیق`}
          </div>
        </div>
      </div>

      {/* 3. Filter Controls & Intensity Legend */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div
          role="group"
          aria-label={isEn ? 'Filter heatmap by activity type' : 'فیلتر نوع فعالیت هیت‌مپ'}
          className="flex flex-wrap items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-white/[0.04]"
        >
          {categoryButtons.map((btn) => {
            const active = categoryFilter === btn.id;
            return (
              <button
                key={btn.id}
                type="button"
                data-testid={`heatmap-filter-${btn.id}`}
                onClick={() => setCategoryFilter(btn.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                  active
                    ? 'bg-white dark:bg-[#162033] text-slate-900 dark:text-white shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {isEn ? btn.labelEn : btn.labelFa}
              </button>
            );
          })}
        </div>

        {/* Intensity & Streak Legend */}
        <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-500 dark:text-slate-400 font-medium tabular-nums">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-xs bg-emerald-500 inline-block" />
            <span>{isEn ? 'Active Streak Chain' : 'زنجیره استمرار فعال'}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-xs bg-blue-500 inline-block" />
            <span>{isEn ? 'Past Activity' : 'فعالیت قبلی'}</span>
          </div>
          <div className="flex items-center gap-1">
            <span>{isEn ? 'Less' : 'کمتر'}</span>
            <span className="w-2.5 h-2.5 rounded-xs bg-slate-100 dark:bg-white/[0.05] border border-slate-200 dark:border-white/10" />
            <span className="w-2.5 h-2.5 rounded-xs bg-emerald-500/25" />
            <span className="w-2.5 h-2.5 rounded-xs bg-emerald-500/50" />
            <span className="w-2.5 h-2.5 rounded-xs bg-emerald-500/80" />
            <span className="w-2.5 h-2.5 rounded-xs bg-emerald-500" />
            <span>{isEn ? 'More' : 'بیشتر'}</span>
          </div>
        </div>
      </div>

      {/* 4. 30-Day Contribution Grid */}
      <div
        data-testid="heatmap-30day-grid"
        className="grid grid-cols-6 sm:grid-cols-10 lg:grid-cols-15 gap-2"
      >
        {heatmapSummary.cells.map((cell) => {
          const isSelected = cell.dayIndex === selectedCell.dayIndex;
          const cellColorClass = getIntensityCellClasses(cell);

          return (
            <button
              key={cell.dateIso}
              type="button"
              data-testid={`heatmap-day-cell-${cell.dayIndex}`}
              data-intensity={cell.intensityLevel}
              data-streak={cell.isPartOfCurrentStreak ? 'true' : 'false'}
              onClick={() => setSelectedDayIndex(cell.dayIndex)}
              aria-label={`${cell.shortDateEn} (${cell.dateIso}): ${cell.filteredContributions} contributions, intensity level ${cell.intensityLevel}${
                cell.isPartOfCurrentStreak ? ', active streak' : ''
              }`}
              aria-pressed={isSelected}
              className={`group relative p-2 rounded-xl border transition-all cursor-pointer flex flex-col items-center justify-between min-h-[60px] focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${cellColorClass} ${
                isSelected
                  ? 'ring-2 ring-slate-900 dark:ring-white scale-[1.03] z-10'
                  : 'hover:scale-[1.02]'
              }`}
            >
              {/* Top row: Localized Short Day Number & Streak Flame indicator */}
              <div className="w-full flex items-center justify-between gap-0.5 text-[10px] font-semibold opacity-90 tabular-nums">
                <span>{localizeDigits(cell.dateIso.slice(8, 10), language)}</span>
                {cell.isToday ? (
                  <span className="text-[9px] font-extrabold">
                    {isEn ? 'TDY' : 'امروز'}
                  </span>
                ) : cell.isPartOfCurrentStreak ? (
                  <Flame className="w-2.5 h-2.5 shrink-0 fill-current" />
                ) : null}
              </div>

              {/* Center: Contribution count */}
              <div className="text-xs sm:text-sm font-black tabular-nums my-0.5">
                {formatLocalizedNumber(cell.filteredContributions, language)}
              </div>

              {/* Bottom: Short weekday */}
              <div className="text-[9px] font-medium opacity-80 truncate max-w-full">
                {isEn ? cell.weekdayShortEn : cell.weekdayShortFa}
              </div>
            </button>
          );
        })}
      </div>

      {/* 5. Interactive Selected Day Breakdown */}
      <div
        data-testid="heatmap-selected-day-inspector"
        className="p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-white/[0.07] bg-slate-50/70 dark:bg-white/[0.02] flex flex-col lg:flex-row lg:items-center justify-between gap-4"
      >
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span
              data-testid="heatmap-inspector-date"
              className="font-extrabold text-slate-900 dark:text-white tabular-nums"
            >
              {isEn
                ? `${selectedCell.weekdayShortEn}, ${selectedCell.shortDateEn} (${selectedCell.dateIso})`
                : `${selectedCell.weekdayShortFa}، ${selectedCell.shortDateFa} (${localizeDigits(selectedCell.dateIso, 'fa')})`}
            </span>
            <span aria-hidden="true" className="text-slate-400">·</span>
            <span
              data-testid="heatmap-inspector-status"
              className={`font-semibold ${
                selectedCell.isPartOfCurrentStreak
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : selectedCell.isActive
                  ? 'text-blue-600 dark:text-blue-400'
                  : 'text-slate-500'
              }`}
            >
              {selectedCell.isToday
                ? isEn
                  ? 'Today (Active Streak Anchor)'
                  : 'امروز (مرکز استمرار فعال)'
                : selectedCell.isPartOfCurrentStreak
                ? isEn
                  ? 'Part of Active Streak Chain'
                  : 'عضو زنجیره استمرار فعال'
                : selectedCell.isActive
                ? isEn
                  ? 'Completed Study Day'
                  : 'روز دارای مشارکت مهندسی'
                : isEn
                ? 'Rest Day'
                : 'روز استراحت'}
            </span>
          </div>

          <p
            data-testid="heatmap-inspector-summary"
            className="text-xs text-slate-600 dark:text-slate-300"
          >
            {isEn ? selectedCell.summaryEn : selectedCell.summaryFa}
          </p>
        </div>

        {/* Selected Day Granular Breakdown Counters */}
        <div className="flex flex-wrap items-center gap-4 text-xs font-semibold tabular-nums shrink-0">
          <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
            <Target className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            <span>
              {formatLocalizedNumber(
                selectedCell.breakdown.missionsCompleted,
                language
              )}{' '}
              {isEn ? 'Missions' : 'مأموریت'}
            </span>
          </div>
          <span aria-hidden="true" className="text-slate-300 dark:text-slate-700">·</span>
          <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
            <BookOpen className="w-3.5 h-3.5 text-blue-500 shrink-0" />
            <span>
              {formatLocalizedNumber(
                selectedCell.breakdown.modulesCompleted +
                  selectedCell.breakdown.quizzesPassed,
                language
              )}{' '}
              {isEn ? 'Mod/Quiz' : 'فصل/آزمون'}
            </span>
          </div>
          <span aria-hidden="true" className="text-slate-300 dark:text-slate-700">·</span>
          <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
            <Clock className="w-3.5 h-3.5 text-rose-500 shrink-0" />
            <span>
              {formatLocalizedNumber(selectedCell.minutesStudied, language)}
              {isEn ? 'm Focus' : ' دقیقه'}
            </span>
          </div>
          <span aria-hidden="true" className="text-slate-300 dark:text-slate-700">·</span>
          <div
            data-testid="heatmap-inspector-xp"
            className="font-bold text-emerald-600 dark:text-emerald-400"
          >
            +{formatLocalizedNumber(selectedCell.xpEarned, language)} XP
          </div>
        </div>
      </div>
    </section>
  );
};
