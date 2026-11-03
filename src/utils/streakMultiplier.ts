/**
 * Daily Streak & Incremental XP Multiplier Engine
 * 
 * Computes consecutive activity streaks, unlocks progressive streak badges,
 * and calculates incremental XP multipliers (1.0x -> 2.0x) for consistent daily engineering activity.
 */

import { DAILY_STREAK_STORAGE_KEY } from './achievements';

export const STREAK_UPDATED_EVENT = 'antigravity_streak_updated_event_v1';

export interface StreakTierSpec {
  minDays: number;
  maxDays: number | null;
  multiplier: number;
  multiplierLabel: string;
  badgeCode: string;
  badgeTitleFa: string;
  badgeTitleEn: string;
  icon: string;
  colorClass: string;
  bgClass: string;
  borderClass: string;
  textClass: string;
  descriptionFa: string;
  descriptionEn: string;
}

export const STREAK_TIER_SPECS: StreakTierSpec[] = [
  {
    minDays: 0,
    maxDays: 2,
    multiplier: 1.0,
    multiplierLabel: '1.0x',
    badgeCode: 'STRK-NOV',
    badgeTitleFa: 'پیوستگی آغازین',
    badgeTitleEn: 'Spark Novice',
    icon: '⚡',
    colorClass: 'text-slate-400',
    bgClass: 'bg-slate-500/10',
    borderClass: 'border-slate-500/20',
    textClass: 'text-slate-600 dark:text-slate-400',
    descriptionFa: 'شروع استمرار روزانه در یادگیری و استودیوهای مهندسی.',
    descriptionEn: 'Initial daily learning momentum in academy and studios.',
  },
  {
    minDays: 3,
    maxDays: 6,
    multiplier: 1.1,
    multiplierLabel: '1.1x',
    badgeCode: 'STRK-BLD',
    badgeTitleFa: 'معمار مستمر',
    badgeTitleEn: 'Steady Builder',
    icon: '🔥',
    colorClass: 'text-amber-500',
    bgClass: 'bg-amber-500/10',
    borderClass: 'border-amber-500/25',
    textClass: 'text-amber-600 dark:text-amber-400',
    descriptionFa: '۳ روز استمرار متوالی، افزایش ۱۰ درصدی کلیه جوایز XP.',
    descriptionEn: '3 days of consecutive engineering, +10% bonus across all XP gains.',
  },
  {
    minDays: 7,
    maxDays: 13,
    multiplier: 1.25,
    multiplierLabel: '1.25x',
    badgeCode: 'AG-STRK-007',
    badgeTitleFa: 'پیشتاز هفتگی',
    badgeTitleEn: 'Weekly Vanguard',
    icon: '⚡',
    colorClass: 'text-blue-500',
    bgClass: 'bg-blue-500/10',
    borderClass: 'border-blue-500/25',
    textClass: 'text-blue-600 dark:text-blue-400',
    descriptionFa: '۷ روز پیوستگی کامل، افزایش ۲۵ درصدی XP و تسلط بر چرخه کار هفتگی.',
    descriptionEn: '7 days of uninterrupted streak, +25% XP multiplier and full weekly cadence.',
  },
  {
    minDays: 14,
    maxDays: 29,
    multiplier: 1.5,
    multiplierLabel: '1.5x',
    badgeCode: 'AG-STRK-014',
    badgeTitleFa: 'معمار پولادین',
    badgeTitleEn: 'Fortified Architect',
    icon: '💎',
    colorClass: 'text-indigo-500',
    bgClass: 'bg-indigo-500/10',
    borderClass: 'border-indigo-500/25',
    textClass: 'text-indigo-600 dark:text-indigo-400',
    descriptionFa: '۱۴ روز استمرار پولادین، افزایش ۵۰ درصدی XP و مصونیت از Context Rot.',
    descriptionEn: '14 consecutive days of deep work, +50% XP multiplier and ironclad focus.',
  },
  {
    minDays: 30,
    maxDays: 99,
    multiplier: 1.75,
    multiplierLabel: '1.75x',
    badgeCode: 'AG-STRK-030',
    badgeTitleFa: 'فرمانده تایتان',
    badgeTitleEn: 'Mission Titan',
    icon: '👑',
    colorClass: 'text-purple-500',
    bgClass: 'bg-purple-500/10',
    borderClass: 'border-purple-500/25',
    textClass: 'text-purple-600 dark:text-purple-400',
    descriptionFa: '۳۰ روز استمرار مطلق، افزایش ۷۵ درصدی XP و رهبری تیم معماری.',
    descriptionEn: '30 days of consistent leadership, +75% XP multiplier and principal standing.',
  },
  {
    minDays: 100,
    maxDays: null,
    multiplier: 2.0,
    multiplierLabel: '2.0x',
    badgeCode: 'AG-STRK-100',
    badgeTitleFa: 'معمار جاویدان',
    badgeTitleEn: 'Mythic Centurion',
    icon: '🔥',
    colorClass: 'text-rose-500',
    bgClass: 'bg-rose-500/15',
    borderClass: 'border-rose-500/35',
    textClass: 'text-rose-600 dark:text-rose-400',
    descriptionFa: '۱۰۰ روز رکورد طلایی، ۲ برابر شدن کامل کلیه جوایز XP (ضریب ۲.۰x).',
    descriptionEn: '100 days of mythic discipline, full 2.0x double XP across the entire platform.',
  },
];

export interface StreakMultiplierEvaluation {
  currentStreakDays: number;
  longestStreakDays: number;
  tier: StreakTierSpec;
  multiplier: number;
  multiplierLabel: string;
  nextTier: StreakTierSpec | null;
  daysToNextTier: number;
  progressPercentToNextTier: number;
}

/**
 * Calculates current streak tier, exact XP multiplier and progress to next tier
 */
export function calculateStreakMultiplier(
  currentStreakDays: number,
  longestStreakDays = 0
): StreakMultiplierEvaluation {
  const safeCurrent = Math.max(0, Math.floor(currentStreakDays || 0));
  const safeLongest = Math.max(safeCurrent, Math.floor(longestStreakDays || 0));

  // Find matching tier
  let matchingTier = STREAK_TIER_SPECS[0];
  let tierIndex = 0;

  for (let i = 0; i < STREAK_TIER_SPECS.length; i++) {
    const spec = STREAK_TIER_SPECS[i];
    if (safeCurrent >= spec.minDays) {
      if (spec.maxDays === null || safeCurrent <= spec.maxDays) {
        matchingTier = spec;
        tierIndex = i;
        break;
      }
    }
  }

  const nextTier =
    tierIndex < STREAK_TIER_SPECS.length - 1
      ? STREAK_TIER_SPECS[tierIndex + 1]
      : null;

  let daysToNextTier = 0;
  let progressPercentToNextTier = 100;

  if (nextTier) {
    daysToNextTier = Math.max(0, nextTier.minDays - safeCurrent);
    const span = Math.max(1, nextTier.minDays - matchingTier.minDays);
    const completedInSpan = Math.max(0, safeCurrent - matchingTier.minDays);
    progressPercentToNextTier = Math.min(
      100,
      Math.max(0, Math.round((completedInSpan / span) * 100))
    );
  }

  return {
    currentStreakDays: safeCurrent,
    longestStreakDays: safeLongest,
    tier: matchingTier,
    multiplier: matchingTier.multiplier,
    multiplierLabel: matchingTier.multiplierLabel,
    nextTier,
    daysToNextTier,
    progressPercentToNextTier,
  };
}

/**
 * Computes multiplied XP with breakdown
 */
export function applyStreakXpMultiplier(
  baseXp: number,
  streakDays: number
): {
  baseXp: number;
  multiplier: number;
  finalXp: number;
  bonusXpEarned: number;
} {
  const safeBase = Math.max(0, Math.floor(baseXp));
  const evaluation = calculateStreakMultiplier(streakDays);
  const finalXp = Math.round(safeBase * evaluation.multiplier);
  const bonusXpEarned = Math.max(0, finalXp - safeBase);

  return {
    baseXp: safeBase,
    multiplier: evaluation.multiplier,
    finalXp,
    bonusXpEarned,
  };
}

export interface StoredStreakSnapshot {
  currentStreakDays: number;
  longestStreakDays: number;
  lastLoggedDateIso: string;
  checkedInToday: boolean;
  todayIso: string;
}

/**
 * Reads the persistent streak state from browser localStorage safely
 */
export function getStoredDailyStreak(
  fallbackDays = 14,
  fallbackLongest = 14
): StoredStreakSnapshot {
  const todayIso = new Date().toISOString().slice(0, 10);

  if (typeof window === 'undefined') {
    return {
      currentStreakDays: fallbackDays,
      longestStreakDays: fallbackLongest,
      lastLoggedDateIso: todayIso,
      checkedInToday: true,
      todayIso,
    };
  }

  try {
    const raw = window.localStorage.getItem(DAILY_STREAK_STORAGE_KEY);
    if (!raw) {
      return {
        currentStreakDays: fallbackDays,
        longestStreakDays: fallbackLongest,
        lastLoggedDateIso: todayIso,
        checkedInToday: true,
        todayIso,
      };
    }

    const parsed = JSON.parse(raw);
    const current =
      typeof parsed?.currentStreakDays === 'number' && parsed.currentStreakDays >= 0
        ? Math.floor(parsed.currentStreakDays)
        : fallbackDays;
    const longest = Math.max(
      current,
      typeof parsed?.longestStreakDays === 'number' && parsed.longestStreakDays >= 0
        ? Math.floor(parsed.longestStreakDays)
        : fallbackLongest
    );
    const lastDate = typeof parsed?.lastLoggedDateIso === 'string'
      ? parsed.lastLoggedDateIso
      : todayIso;

    const checkedInToday = lastDate === todayIso;

    return {
      currentStreakDays: current,
      longestStreakDays: longest,
      lastLoggedDateIso: lastDate,
      checkedInToday,
      todayIso,
    };
  } catch {
    return {
      currentStreakDays: fallbackDays,
      longestStreakDays: fallbackLongest,
      lastLoggedDateIso: todayIso,
      checkedInToday: true,
      todayIso,
    };
  }
}

/**
 * Records daily check-in, increments streak if eligible, persists to localStorage and dispatches event
 */
export function recordDailyStreakCheckIn(options?: {
  forcedStreakIncrement?: boolean;
}): {
  updatedStreakDays: number;
  updatedLongestDays: number;
  xpAwarded: number;
  multiplier: number;
  alreadyCheckedIn: boolean;
} {
  const todayIso = new Date().toISOString().slice(0, 10);
  const currentSnapshot = getStoredDailyStreak(14, 14);

  // If already checked in today and not forced
  if (currentSnapshot.checkedInToday && !options?.forcedStreakIncrement) {
    const evalResult = calculateStreakMultiplier(currentSnapshot.currentStreakDays);
    return {
      updatedStreakDays: currentSnapshot.currentStreakDays,
      updatedLongestDays: currentSnapshot.longestStreakDays,
      xpAwarded: 0,
      multiplier: evalResult.multiplier,
      alreadyCheckedIn: true,
    };
  }

  const nextStreak = currentSnapshot.currentStreakDays + 1;
  const nextLongest = Math.max(currentSnapshot.longestStreakDays, nextStreak);
  const evalResult = calculateStreakMultiplier(nextStreak, nextLongest);

  // Base daily check-in is 50 XP multiplied by current streak multiplier
  const xpCalculation = applyStreakXpMultiplier(50, nextStreak);

  if (typeof window !== 'undefined') {
    try {
      const raw = window.localStorage.getItem(DAILY_STREAK_STORAGE_KEY);
      let studyDays = [];
      if (raw) {
        try {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed.studyDays)) studyDays = parsed.studyDays;
        } catch {
          // Ignore parse error
        }
      }

      const updatedPayload = {
        schemaVersion: '1.0.0',
        currentStreakDays: nextStreak,
        longestStreakDays: nextLongest,
        lastLoggedDateIso: todayIso,
        studyDays,
        updatedAtIso: new Date().toISOString(),
      };

      window.localStorage.setItem(
        DAILY_STREAK_STORAGE_KEY,
        JSON.stringify(updatedPayload)
      );

      // Dispatch custom event for reactive UI synchronization across applet components
      window.dispatchEvent(
        new CustomEvent(STREAK_UPDATED_EVENT, {
          detail: {
            currentStreakDays: nextStreak,
            longestStreakDays: nextLongest,
            lastLoggedDateIso: todayIso,
            multiplier: evalResult.multiplier,
          },
        })
      );
    } catch {
      // Ignore storage errors
    }
  }

  return {
    updatedStreakDays: nextStreak,
    updatedLongestDays: nextLongest,
    xpAwarded: xpCalculation.finalXp,
    multiplier: evalResult.multiplier,
    alreadyCheckedIn: false,
  };
}
