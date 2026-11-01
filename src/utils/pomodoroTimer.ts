import {
  DAILY_STREAK_STORAGE_KEY,
  StudySessionDay,
  parseDailyStreakStateFromStorage,
  serializeDailyStreakStateToStorage,
} from './achievements';

export type PomodoroSessionMode = 'focus' | 'deep-work' | 'short-break' | 'long-break';

export interface PomodoroModeConfig {
  mode: PomodoroSessionMode;
  labelFa: string;
  labelEn: string;
  durationSeconds: number; // in seconds
  descriptionFa: string;
  descriptionEn: string;
  badgeClass: string;
}

export const POMODORO_MODES: Record<PomodoroSessionMode, PomodoroModeConfig> = {
  'focus': {
    mode: 'focus',
    labelFa: 'پومودورو استاندارد',
    labelEn: 'Standard Pomodoro (25m)',
    durationSeconds: 25 * 60, // 1500s
    descriptionFa: '۲۵ دقیقه تمرکز خالص روی مباحث نظری و سورس‌کد فصل',
    descriptionEn: '25-minute uninterrupted study sprint on module theory and code.',
    badgeClass: 'bg-blue-500/15 border-blue-500/35 text-blue-600 dark:text-blue-400',
  },
  'deep-work': {
    mode: 'deep-work',
    labelFa: 'کار عمیق پیشرفته',
    labelEn: 'Deep Work Sprint (50m)',
    durationSeconds: 50 * 60, // 3000s
    descriptionFa: '۵۰ دقیقه تمرکز غوطه‌ور برای تحلیل عمیق معماری و سناریوها',
    descriptionEn: '50-minute immersive deep work block for complex architectural patterns.',
    badgeClass: 'bg-indigo-500/15 border-indigo-500/35 text-indigo-600 dark:text-indigo-400',
  },
  'short-break': {
    mode: 'short-break',
    labelFa: 'استراحت کوتاه',
    labelEn: 'Short Break (5m)',
    durationSeconds: 5 * 60, // 300s
    descriptionFa: '۵ دقیقه تنفس و بازنشانی توجه برای جلوگیری از خستگی شناختی',
    descriptionEn: '5-minute cognitive reset before next focus block.',
    badgeClass: 'bg-emerald-500/15 border-emerald-500/35 text-emerald-600 dark:text-emerald-400',
  },
  'long-break': {
    mode: 'long-break',
    labelFa: 'استراحت بلند',
    labelEn: 'Long Break (15m)',
    durationSeconds: 15 * 60, // 900s
    descriptionFa: '۱۵ دقیقه ریکاوری پس از ۴ دور فوکوس و مطالعه مستمر',
    descriptionEn: '15-minute recovery after completing 4 consecutive focus cycles.',
    badgeClass: 'bg-amber-500/15 border-amber-500/35 text-amber-600 dark:text-amber-400',
  },
};

export interface DeepWorkLogEntry {
  id: string;
  timestampIso: string;
  moduleId: string;
  moduleNumber: number;
  moduleTitleFa: string;
  moduleTitleEn: string;
  durationMinutes: number;
  mode: PomodoroSessionMode;
  notes?: string;
  xpEarned: number;
}

export interface ModuleDeepWorkSummary {
  moduleId: string;
  moduleNumber: number;
  moduleTitleFa: string;
  moduleTitleEn: string;
  totalMinutes: number;
  totalHoursFormatted: string; // e.g. "1.5h" or "45m"
  sessionsCount: number;
  xpEarned: number;
}

export interface OverallDeepWorkStats {
  totalMinutes: number;
  totalHoursFormatted: string;
  totalSessions: number;
  totalXpEarned: number;
  activeModulesCount: number;
  topModuleTitleFa: string;
}

export const DEEP_WORK_LOGS_STORAGE_KEY = 'ag_deep_work_logs_v1';

/**
 * Formats seconds into mm:ss monospace clock display.
 */
export function formatTimerDisplay(seconds: number): string {
  const safe = Math.max(0, Math.floor(seconds));
  const mins = Math.floor(safe / 60);
  const secs = safe % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

/**
 * Formats total minutes into human-readable hours and minutes (e.g. "2.4h" or "45m").
 */
export function formatDeepWorkDuration(minutes: number): string {
  const safe = Math.max(0, Math.floor(minutes));
  if (safe < 60) {
    return `${safe}m`;
  }
  const hours = (safe / 60).toFixed(1);
  return `${hours}h`;
}

/**
 * Calculates XP earned for a deep work session (2.5 XP per minute of focus).
 */
export function calculateDeepWorkXp(durationMinutes: number, mode: PomodoroSessionMode): number {
  const safeMins = Math.max(1, Math.floor(durationMinutes));
  const multiplier = mode === 'deep-work' ? 3 : mode === 'focus' ? 2.5 : 0;
  return Math.round(safeMins * multiplier);
}

/**
 * Safely parses deep work logs from localStorage JSON.
 */
export function parseDeepWorkLogsFromStorage(raw: string | null): DeepWorkLogEntry[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (item) =>
        item &&
        typeof item.id === 'string' &&
        typeof item.durationMinutes === 'number' &&
        typeof item.moduleId === 'string'
    );
  } catch {
    return [];
  }
}

/**
 * Safely serializes deep work logs to localStorage JSON.
 */
export function serializeDeepWorkLogsToStorage(logs: DeepWorkLogEntry[]): string {
  return JSON.stringify(logs);
}

/**
 * Adds a new deep work log entry and returns updated logs, earned XP, and the created entry.
 */
export function recordDeepWorkSession(
  existingLogs: DeepWorkLogEntry[],
  input: {
    moduleId: string;
    moduleNumber: number;
    moduleTitleFa: string;
    moduleTitleEn: string;
    durationMinutes: number;
    mode: PomodoroSessionMode;
    notes?: string;
    timestampIso?: string;
  }
): {
  updatedLogs: DeepWorkLogEntry[];
  xpEarned: number;
  createdEntry: DeepWorkLogEntry;
} {
  const durationMinutes = Math.max(1, Math.floor(input.durationMinutes));
  const xpEarned = calculateDeepWorkXp(durationMinutes, input.mode);
  const nowIso = input.timestampIso || new Date().toISOString();
  const id = `dw-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

  const createdEntry: DeepWorkLogEntry = {
    id,
    timestampIso: nowIso,
    moduleId: input.moduleId,
    moduleNumber: input.moduleNumber,
    moduleTitleFa: input.moduleTitleFa,
    moduleTitleEn: input.moduleTitleEn,
    durationMinutes,
    mode: input.mode,
    notes: input.notes,
    xpEarned,
  };

  const updatedLogs = [createdEntry, ...existingLogs];

  return {
    updatedLogs,
    xpEarned,
    createdEntry,
  };
}

/**
 * Groups and summarizes logged deep work by curriculum module.
 */
export function calculateModuleDeepWorkSummaries(
  logs: DeepWorkLogEntry[]
): Record<string, ModuleDeepWorkSummary> {
  const map: Record<string, ModuleDeepWorkSummary> = {};

  for (const log of logs) {
    if (!map[log.moduleId]) {
      map[log.moduleId] = {
        moduleId: log.moduleId,
        moduleNumber: log.moduleNumber,
        moduleTitleFa: log.moduleTitleFa,
        moduleTitleEn: log.moduleTitleEn,
        totalMinutes: 0,
        totalHoursFormatted: '0m',
        sessionsCount: 0,
        xpEarned: 0,
      };
    }

    const current = map[log.moduleId];
    current.totalMinutes += log.durationMinutes;
    current.sessionsCount += 1;
    current.xpEarned += log.xpEarned;
    current.totalHoursFormatted = formatDeepWorkDuration(current.totalMinutes);
  }

  return map;
}

/**
 * Aggregates overall deep work statistics across all modules and sessions.
 */
export function calculateTotalDeepWorkStats(logs: DeepWorkLogEntry[]): OverallDeepWorkStats {
  const totalMinutes = logs.reduce((sum, l) => sum + Math.max(0, l.durationMinutes), 0);
  const totalSessions = logs.length;
  const totalXpEarned = logs.reduce((sum, l) => sum + Math.max(0, l.xpEarned), 0);

  const summaries = calculateModuleDeepWorkSummaries(logs);
  const activeModulesCount = Object.keys(summaries).length;

  let topModuleTitleFa = 'هنوز نشستی ثبت نشده';
  let maxModuleMins = -1;

  for (const summary of Object.values(summaries)) {
    if (summary.totalMinutes > maxModuleMins) {
      maxModuleMins = summary.totalMinutes;
      topModuleTitleFa = `فصل ${summary.moduleNumber}: ${summary.moduleTitleFa}`;
    }
  }

  return {
    totalMinutes,
    totalHoursFormatted: formatDeepWorkDuration(totalMinutes),
    totalSessions,
    totalXpEarned,
    activeModulesCount,
    topModuleTitleFa,
  };
}

/**
 * Synchronizes logged focus minutes with the persistent daily streak state in localStorage.
 * Updates today's study minutes and marks today active.
 */
export function syncDeepWorkMinutesToStreakStorage(
  durationMinutes: number,
  fallbackDays: StudySessionDay[]
): {
  studyDays: StudySessionDay[];
  currentStreakDays: number;
} {
  if (typeof window === 'undefined') {
    return { studyDays: fallbackDays, currentStreakDays: 1 };
  }

  try {
    const raw = window.localStorage.getItem(DAILY_STREAK_STORAGE_KEY);
    const streakState = parseDailyStreakStateFromStorage(raw, fallbackDays);
    const days = [...streakState.studyDays];

    if (days.length > 0) {
      const todayIdx = days.length - 1;
      const today = days[todayIdx];
      days[todayIdx] = {
        ...today,
        minutesStudied: today.minutesStudied + Math.max(1, durationMinutes),
        active: true,
      };
    }

    const nextStreak = {
      ...streakState,
      studyDays: days,
    };

    window.localStorage.setItem(
      DAILY_STREAK_STORAGE_KEY,
      serializeDailyStreakStateToStorage(nextStreak)
    );

    return {
      studyDays: days,
      currentStreakDays: nextStreak.currentStreakDays,
    };
  } catch {
    return { studyDays: fallbackDays, currentStreakDays: 1 };
  }
}
