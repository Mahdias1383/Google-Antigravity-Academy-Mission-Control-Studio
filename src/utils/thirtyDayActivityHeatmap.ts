import {
  calculateStreakMultiplier,
  getStoredDailyStreak,
  recordDailyStreakCheckIn,
  StreakMultiplierEvaluation,
} from './streakMultiplier';

export type HeatmapContributionCategory =
  | 'all'
  | 'missions'
  | 'curriculum'
  | 'deep-work';

export interface DailyContributionBreakdown {
  modulesCompleted: number;
  missionsCompleted: number;
  quizzesPassed: number;
  deepWorkSessions: number;
  studioActions: number;
}

export interface ThirtyDayHeatmapCell {
  dayIndex: number; // 0 (oldest, 29 days ago) to 29 (today)
  daysAgo: number; // 29 down to 0
  dateIso: string; // YYYY-MM-DD
  shortDateEn: string; // e.g. "Oct 05"
  shortDateFa: string; // e.g. "۱۴ مهر" or localized short date
  weekdayShortEn: string; // e.g. "Mon"
  weekdayShortFa: string; // e.g. "دوشنبه"
  totalContributions: number;
  filteredContributions: number;
  intensityLevel: 0 | 1 | 2 | 3 | 4;
  isToday: boolean;
  isActive: boolean;
  isPartOfCurrentStreak: boolean;
  isPartOfLongestStreak: boolean;
  xpEarned: number;
  minutesStudied: number;
  breakdown: DailyContributionBreakdown;
  summaryEn: string;
  summaryFa: string;
}

export interface ThirtyDayHeatmapSummary {
  cells: ThirtyDayHeatmapCell[];
  currentStreakDays: number;
  longestStreakInWindow: number;
  activeDaysCount: number;
  totalDays: number;
  consistencyPercent: number;
  totalContributions: number;
  totalXpInWindow: number;
  totalMinutesInWindow: number;
  peakDay: ThirtyDayHeatmapCell;
  streakEvaluation: StreakMultiplierEvaluation;
}

export const THIRTY_DAY_HEATMAP_STORAGE_KEY = 'ag_thirty_day_heatmap_logs_v1';
export const THIRTY_DAY_HEATMAP_UPDATED_EVENT = 'antigravity_thirty_day_heatmap_updated_v1';

export interface StoredDailyContributionOverride {
  dateIso: string;
  extraMissions?: number;
  extraModules?: number;
  extraQuizzes?: number;
  extraDeepWork?: number;
  extraStudioActions?: number;
  extraXp?: number;
  extraMinutes?: number;
}

const WEEKDAYS_EN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const WEEKDAYS_FA = [
  'یکشنبه',
  'دوشنبه',
  'سه‌شنبه',
  'چهارشنبه',
  'پنجشنبه',
  'جمعه',
  'شنبه',
];

const MONTHS_EN = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

/**
 * Maps a raw daily contribution count to a 0..4 visual intensity scale
 */
export function computeContributionIntensityLevel(
  count: number
): 0 | 1 | 2 | 3 | 4 {
  const safe = Math.max(0, Math.floor(count || 0));
  if (safe === 0) return 0;
  if (safe <= 2) return 1;
  if (safe <= 4) return 2;
  if (safe <= 6) return 3;
  return 4;
}

/**
 * Formats an ISO YYYY-MM-DD date offset by `daysOffset` from a reference date
 */
export function getOffsetDateIso(
  referenceDateIso: string,
  daysOffset: number
): string {
  const baseStr =
    typeof referenceDateIso === 'string' && referenceDateIso.length >= 10
      ? referenceDateIso.slice(0, 10)
      : new Date().toISOString().slice(0, 10);

  const [y, m, d] = baseStr.split('-').map((n) => parseInt(n, 10));
  const utcDate = new Date(Date.UTC(y || 2026, (m || 1) - 1, d || 1));
  utcDate.setUTCDate(utcDate.getUTCDate() + daysOffset);
  return utcDate.toISOString().slice(0, 10);
}

/**
 * Formats human-readable English and Persian date labels from YYYY-MM-DD
 */
export function formatHeatmapDateLabels(dateIso: string): {
  shortDateEn: string;
  shortDateFa: string;
  weekdayShortEn: string;
  weekdayShortFa: string;
} {
  const [y, m, d] = dateIso.split('-').map((n) => parseInt(n, 10));
  const utcDate = new Date(Date.UTC(y || 2026, (m || 1) - 1, d || 1));
  const dayOfWeek = utcDate.getUTCDay();
  const monthIdx = utcDate.getUTCMonth();
  const dayOfMonth = utcDate.getUTCDate();

  const shortDateEn = `${MONTHS_EN[monthIdx]} ${String(dayOfMonth).padStart(2, '0')}`;
  let shortDateFa = `${y}/${String(m).padStart(2, '0')}/${String(d).padStart(2, '0')}`;
  try {
    shortDateFa = utcDate.toLocaleDateString('fa-IR', {
      month: 'short',
      day: 'numeric',
      timeZone: 'UTC',
    });
  } catch {
    // Fallback if locale not supported
  }

  return {
    shortDateEn,
    shortDateFa,
    weekdayShortEn: WEEKDAYS_EN[dayOfWeek] || 'Day',
    weekdayShortFa: WEEKDAYS_FA[dayOfWeek] || 'روز',
  };
}

/**
 * Builds deterministic baseline activity for a given day in the 30-day window,
 * guaranteeing that the last `targetCurrentStreak` days ending today are active
 * so the visual heatmap matches the user's active daily streak.
 */
export function buildDeterministicDayBreakdown(params: {
  dayIndex: number; // 0..29
  daysAgo: number; // 29..0
  targetCurrentStreak: number;
  completedModulesCount: number;
  completedMissionsCount: number;
  override?: StoredDailyContributionOverride;
}): {
  breakdown: DailyContributionBreakdown;
  xpEarned: number;
  minutesStudied: number;
} {
  const {
    dayIndex,
    daysAgo,
    targetCurrentStreak,
    completedModulesCount,
    completedMissionsCount,
    override,
  } = params;

  const isWithinActiveStreak = daysAgo < Math.max(1, targetCurrentStreak);

  // Deterministic wave pattern for older days outside the current streak
  // Leave a 1-day rest gap right before `targetCurrentStreak` if targetCurrentStreak < 30
  // so the current streak boundary is mathematically exact, while earlier weeks show realistic streaks.
  const isStreakBoundaryGap =
    targetCurrentStreak < 30 && daysAgo === targetCurrentStreak;

  const seed = Math.sin((dayIndex + 1) * 12.9898) * 43758.5453;
  const frac = seed - Math.floor(seed);

  let isActiveDay = false;
  if (isWithinActiveStreak) {
    isActiveDay = true;
  } else if (isStreakBoundaryGap) {
    isActiveDay = false;
  } else {
    // ~70% activity rate in earlier weeks to form realistic multi-day contribution clusters
    isActiveDay = frac > 0.28;
  }

  let modulesCompleted = 0;
  let missionsCompleted = 0;
  let quizzesPassed = 0;
  let deepWorkSessions = 0;
  let studioActions = 0;

  if (isActiveDay) {
    // Distribute realistic engineering actions
    deepWorkSessions = (dayIndex % 3) + 1;
    studioActions = (dayIndex % 2) + 1;

    if (dayIndex % 4 === 0 || daysAgo === 0) {
      missionsCompleted = 1 + (daysAgo === 0 && completedMissionsCount > 3 ? 1 : 0);
    } else if (dayIndex % 2 === 1) {
      missionsCompleted = 1;
    }

    if (dayIndex % 5 === 0) {
      modulesCompleted = 1;
      quizzesPassed = 1;
    } else if (dayIndex % 3 === 0) {
      quizzesPassed = 1;
    }

    // Boost today's baseline slightly based on completed modules/missions
    if (daysAgo === 0) {
      studioActions = Math.max(2, Math.min(4, completedModulesCount));
    }
  }

  // Apply any user-logged overrides for that date
  if (override) {
    modulesCompleted += override.extraModules || 0;
    missionsCompleted += override.extraMissions || 0;
    quizzesPassed += override.extraQuizzes || 0;
    deepWorkSessions += override.extraDeepWork || 0;
    studioActions += override.extraStudioActions || 0;
  }

  const totalActions =
    modulesCompleted +
    missionsCompleted +
    quizzesPassed +
    deepWorkSessions +
    studioActions;

  const baseXp =
    modulesCompleted * 150 +
    missionsCompleted * 140 +
    quizzesPassed * 75 +
    deepWorkSessions * 50 +
    studioActions * 25 +
    (override?.extraXp || 0);

  const baseMinutes =
    totalActions > 0
      ? deepWorkSessions * 25 +
        modulesCompleted * 20 +
        missionsCompleted * 15 +
        studioActions * 10 +
        (override?.extraMinutes || 0)
      : 0;

  return {
    breakdown: {
      modulesCompleted,
      missionsCompleted,
      quizzesPassed,
      deepWorkSessions,
      studioActions,
    },
    xpEarned: baseXp,
    minutesStudied: baseMinutes,
  };
}

/**
 * Computes filtered contribution count for a specific category filter
 */
export function getFilteredContributionCount(
  breakdown: DailyContributionBreakdown,
  category: HeatmapContributionCategory
): number {
  if (category === 'missions') {
    return breakdown.missionsCompleted + breakdown.studioActions;
  }
  if (category === 'curriculum') {
    return breakdown.modulesCompleted + breakdown.quizzesPassed;
  }
  if (category === 'deep-work') {
    return breakdown.deepWorkSessions;
  }
  return (
    breakdown.modulesCompleted +
    breakdown.missionsCompleted +
    breakdown.quizzesPassed +
    breakdown.deepWorkSessions +
    breakdown.studioActions
  );
}

/**
 * Generates localized summary strings for a day cell
 */
export function formatCellContributionSummary(
  breakdown: DailyContributionBreakdown,
  total: number
): { summaryEn: string; summaryFa: string } {
  if (total <= 0) {
    return {
      summaryEn: 'Rest day · No logged engineering tasks',
      summaryFa: 'روز استراحت · بدون فعالیت ثبت‌شده',
    };
  }

  const partsEn: string[] = [];
  const partsFa: string[] = [];

  const toFaDigits = (n: number) =>
    String(n).replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[Number(d)]);

  if (breakdown.missionsCompleted > 0) {
    partsEn.push(
      `${breakdown.missionsCompleted} Mission${breakdown.missionsCompleted > 1 ? 's' : ''}`
    );
    partsFa.push(`${toFaDigits(breakdown.missionsCompleted)} مأموریت`);
  }
  if (breakdown.modulesCompleted > 0) {
    partsEn.push(
      `${breakdown.modulesCompleted} Module${breakdown.modulesCompleted > 1 ? 's' : ''}`
    );
    partsFa.push(`${toFaDigits(breakdown.modulesCompleted)} فصل`);
  }
  if (breakdown.quizzesPassed > 0) {
    partsEn.push(
      `${breakdown.quizzesPassed} Quiz${breakdown.quizzesPassed > 1 ? 'zes' : ''}`
    );
    partsFa.push(`${toFaDigits(breakdown.quizzesPassed)} آزمون`);
  }
  if (breakdown.deepWorkSessions > 0) {
    partsEn.push(
      `${breakdown.deepWorkSessions} Deep Work`
    );
    partsFa.push(`${toFaDigits(breakdown.deepWorkSessions)} نشست تمرکز`);
  }
  if (breakdown.studioActions > 0) {
    partsEn.push(
      `${breakdown.studioActions} Lab${breakdown.studioActions > 1 ? 's' : ''}`
    );
    partsFa.push(`${toFaDigits(breakdown.studioActions)} تمرین استودیو`);
  }

  return {
    summaryEn: partsEn.join(' · '),
    summaryFa: partsFa.join(' · '),
  };
}

/**
 * Pure calculation of the 30-day activity heatmap, streaks, and gamified consistency metrics
 */
export function buildThirtyDayActivityHeatmap(params?: {
  referenceDateIso?: string;
  targetCurrentStreak?: number;
  completedModulesCount?: number;
  completedMissionsCount?: number;
  categoryFilter?: HeatmapContributionCategory;
  overridesMap?: Record<string, StoredDailyContributionOverride>;
}): ThirtyDayHeatmapSummary {
  const referenceDateIso =
    params?.referenceDateIso || new Date().toISOString().slice(0, 10);
  const targetCurrentStreak =
    typeof params?.targetCurrentStreak === 'number'
      ? Math.max(0, Math.floor(params.targetCurrentStreak))
      : 14;
  const completedModulesCount = params?.completedModulesCount ?? 2;
  const completedMissionsCount = params?.completedMissionsCount ?? 3;
  const categoryFilter: HeatmapContributionCategory =
    params?.categoryFilter || 'all';
  const overridesMap = params?.overridesMap || {};

  const rawCells: ThirtyDayHeatmapCell[] = [];

  for (let i = 0; i < 30; i++) {
    const daysAgo = 29 - i;
    const dateIso = getOffsetDateIso(referenceDateIso, -daysAgo);
    const dateLabels = formatHeatmapDateLabels(dateIso);
    const override = overridesMap[dateIso];

    const { breakdown, xpEarned, minutesStudied } = buildDeterministicDayBreakdown({
      dayIndex: i,
      daysAgo,
      targetCurrentStreak,
      completedModulesCount,
      completedMissionsCount,
      override,
    });

    const totalContributions = getFilteredContributionCount(breakdown, 'all');
    const filteredContributions = getFilteredContributionCount(
      breakdown,
      categoryFilter
    );
    const intensityLevel = computeContributionIntensityLevel(filteredContributions);
    const { summaryEn, summaryFa } = formatCellContributionSummary(
      breakdown,
      totalContributions
    );

    rawCells.push({
      dayIndex: i,
      daysAgo,
      dateIso,
      shortDateEn: dateLabels.shortDateEn,
      shortDateFa: dateLabels.shortDateFa,
      weekdayShortEn: dateLabels.weekdayShortEn,
      weekdayShortFa: dateLabels.weekdayShortFa,
      totalContributions,
      filteredContributions,
      intensityLevel,
      isToday: daysAgo === 0,
      isActive: totalContributions > 0,
      isPartOfCurrentStreak: false,
      isPartOfLongestStreak: false,
      xpEarned,
      minutesStudied,
      breakdown,
      summaryEn,
      summaryFa,
    });
  }

  // Compute current streak (from index 29 backwards) and longest streak window
  let currentStreakDays = 0;
  for (let i = rawCells.length - 1; i >= 0; i--) {
    if (rawCells[i].isActive) {
      currentStreakDays += 1;
      rawCells[i].isPartOfCurrentStreak = true;
    } else {
      break;
    }
  }

  let longestStreakInWindow = 0;
  let longestStart = -1;
  let longestEnd = -1;
  let runCount = 0;
  let runStart = 0;

  for (let i = 0; i < rawCells.length; i++) {
    if (rawCells[i].isActive) {
      if (runCount === 0) runStart = i;
      runCount += 1;
      if (runCount >= longestStreakInWindow) {
        longestStreakInWindow = runCount;
        longestStart = runStart;
        longestEnd = i;
      }
    } else {
      runCount = 0;
    }
  }

  if (longestStart >= 0 && longestEnd >= longestStart) {
    for (let i = longestStart; i <= longestEnd; i++) {
      rawCells[i].isPartOfLongestStreak = true;
    }
  }

  const activeDaysCount = rawCells.filter((c) => c.isActive).length;
  const consistencyPercent = Math.round((activeDaysCount / 30) * 100);
  const totalContributions = rawCells.reduce(
    (sum, c) => sum + c.totalContributions,
    0
  );
  const totalXpInWindow = rawCells.reduce((sum, c) => sum + c.xpEarned, 0);
  const totalMinutesInWindow = rawCells.reduce(
    (sum, c) => sum + c.minutesStudied,
    0
  );

  let peakDay = rawCells[rawCells.length - 1];
  for (const cell of rawCells) {
    if (cell.totalContributions >= peakDay.totalContributions) {
      peakDay = cell;
    }
  }

  // If the user's stored streak is even higher than the 30-day window (e.g. >30), respect it
  const effectiveCurrentStreak =
    targetCurrentStreak > 30 && currentStreakDays === 30
      ? targetCurrentStreak
      : currentStreakDays;
  const effectiveLongestStreak = Math.max(
    longestStreakInWindow,
    effectiveCurrentStreak
  );

  const streakEvaluation = calculateStreakMultiplier(
    effectiveCurrentStreak,
    effectiveLongestStreak
  );

  return {
    cells: rawCells,
    currentStreakDays: effectiveCurrentStreak,
    longestStreakInWindow: effectiveLongestStreak,
    activeDaysCount,
    totalDays: 30,
    consistencyPercent,
    totalContributions,
    totalXpInWindow,
    totalMinutesInWindow,
    peakDay,
    streakEvaluation,
  };
}

/**
 * Reads stored daily overrides from localStorage
 */
export function getStoredHeatmapOverrides(): Record<
  string,
  StoredDailyContributionOverride
> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(THIRTY_DAY_HEATMAP_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object') {
      return parsed;
    }
    return {};
  } catch {
    return {};
  }
}

/**
 * Logs a live daily contribution boost for today, persists to localStorage,
 * and synchronizes with the global daily streak counter.
 */
export function recordThirtyDayActivityBoost(options?: {
  dateIso?: string;
  extraMissions?: number;
  extraStudioActions?: number;
  extraDeepWork?: number;
}): {
  updatedOverride: StoredDailyContributionOverride;
  streakResult: ReturnType<typeof recordDailyStreakCheckIn>;
} {
  const todayIso = options?.dateIso || new Date().toISOString().slice(0, 10);
  const currentOverrides = getStoredHeatmapOverrides();
  const existing = currentOverrides[todayIso] || { dateIso: todayIso };

  const updatedOverride: StoredDailyContributionOverride = {
    dateIso: todayIso,
    extraMissions: (existing.extraMissions || 0) + (options?.extraMissions ?? 1),
    extraModules: existing.extraModules || 0,
    extraQuizzes: existing.extraQuizzes || 0,
    extraDeepWork: (existing.extraDeepWork || 0) + (options?.extraDeepWork ?? 1),
    extraStudioActions:
      (existing.extraStudioActions || 0) + (options?.extraStudioActions ?? 1),
    extraXp: (existing.extraXp || 0) + 75,
    extraMinutes: (existing.extraMinutes || 0) + 25,
  };

  const nextOverrides = {
    ...currentOverrides,
    [todayIso]: updatedOverride,
  };

  const streakResult = recordDailyStreakCheckIn({ forcedStreakIncrement: true });

  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(
        THIRTY_DAY_HEATMAP_STORAGE_KEY,
        JSON.stringify(nextOverrides)
      );
      window.dispatchEvent(
        new CustomEvent(THIRTY_DAY_HEATMAP_UPDATED_EVENT, {
          detail: { dateIso: todayIso, updatedOverride, streakResult },
        })
      );
    } catch {
      // Ignore storage errors
    }
  }

  return {
    updatedOverride,
    streakResult,
  };
}
