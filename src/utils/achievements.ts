import { CurriculumModule } from '../types/curriculum';

export interface ModuleBadgeSpec {
  moduleId: string;
  moduleNumber: number;
  badgeCode: string;
  badgeTitleFa: string;
  badgeTitleEn: string;
  competencyDomain: string;
  unlocked: boolean;
  xpValue: number;
}

export interface StudySessionDay {
  dateIso: string;
  dayLabelFa: string;
  minutesStudied: number;
  modulesTouched: number;
  active: boolean;
}

export interface CertificationReportMetrics {
  completedCount: number;
  totalModules: number;
  completionPercentage: number;
  totalXp: number;
  maxXp: number;
  rankTitleFa: string;
  rankTitleEn: string;
  certificateSerial: string;
  isCertified: boolean;
  badges: ModuleBadgeSpec[];
}

const BADGE_METADATA: Record<
  string,
  { badgeCode: string; badgeTitleFa: string; badgeTitleEn: string; competencyDomain: string; xpValue: number }
> = {
  'module-1': {
    badgeCode: 'AG-CORE-01',
    badgeTitleFa: 'معمار هسته Agent-First',
    badgeTitleEn: 'Agent-First Core Architect',
    competencyDomain: 'Editor View · Supercomplete · Tab-to-Jump',
    xpValue: 150,
  },
  'module-2': {
    badgeCode: 'AG-ART-02',
    badgeTitleFa: 'ممیز ارشد آرتیفکت‌ها',
    badgeTitleEn: 'Lead Artifact & PR Auditor',
    competencyDomain: 'task.md · implementation_plan.md · walkthrough.md',
    xpValue: 200,
  },
  'module-3': {
    badgeCode: 'AG-GOV-03',
    badgeTitleFa: 'متخصص حاکمیت و ایمنی ترمینال',
    badgeTitleEn: 'Autonomy & Terminal Governance Specialist',
    competencyDomain: 'Planning/Fast Mode · Allow/Deny Guardrails',
    xpValue: 175,
  },
  'module-4': {
    badgeCode: 'AG-CTX-04',
    badgeTitleFa: 'مهندس ارشد کانتکست و قوانین',
    badgeTitleEn: 'Principal Context & Rules Engineer',
    competencyDomain: '.agent/rules/*.md · Glob & Semantic Routing',
    xpValue: 225,
  },
  'module-5': {
    badgeCode: 'AG-SOP-05',
    badgeTitleFa: 'اتوماسیون‌ساز پایپ‌لاین‌های Turbo',
    badgeTitleEn: 'Workflow & Turbo Pipeline Strategist',
    competencyDomain: '.agent/workflows/*.md · // turbo Directives',
    xpValue: 200,
  },
  'module-6': {
    badgeCode: 'AG-E2E-06',
    badgeTitleFa: 'بازرس تله‌متری Browser Subagent',
    badgeTitleEn: 'Visual E2E & Telemetry Inspector',
    competencyDomain: 'DOM/Console/Network Streams · WebP Proof',
    xpValue: 200,
  },
  'module-7': {
    badgeCode: 'AG-MCP-07',
    badgeTitleFa: 'طراح یکپارچه‌سازی Enterprise MCP',
    badgeTitleEn: 'Enterprise FastMCP Systems Integrator',
    competencyDomain: 'mcp_config.json · FastMCP Async Tools',
    xpValue: 250,
  },
  'module-8': {
    badgeCode: 'AG-ORC-08',
    badgeTitleFa: 'فرمانده ارکستریشن چندایجنتی',
    badgeTitleEn: 'Multi-Agent Worktree Commander',
    competencyDomain: 'Git Worktrees · Inbox Triage · Zero Context Rot',
    xpValue: 250,
  },
};

export function calculateCertificationMetrics(
  allModules: CurriculumModule[],
  completedModuleIds: string[],
  architectName: string
): CertificationReportMetrics {
  const uniqueCompleted = new Set(completedModuleIds);
  const badges: ModuleBadgeSpec[] = allModules.map((mod) => {
    const meta = BADGE_METADATA[mod.id] || {
      badgeCode: `AG-MOD-0${mod.number}`,
      badgeTitleFa: mod.titleFa,
      badgeTitleEn: mod.titleEn,
      competencyDomain: mod.difficulty,
      xpValue: 150,
    };
    return {
      moduleId: mod.id,
      moduleNumber: mod.number,
      badgeCode: meta.badgeCode,
      badgeTitleFa: meta.badgeTitleFa,
      badgeTitleEn: meta.badgeTitleEn,
      competencyDomain: meta.competencyDomain,
      unlocked: uniqueCompleted.has(mod.id),
      xpValue: meta.xpValue,
    };
  });

  const totalModules = allModules.length || 8;
  const completedCount = badges.filter((b) => b.unlocked).length;
  const completionPercentage = Math.round((completedCount / totalModules) * 100);
  const totalXp = badges.reduce((sum, b) => (b.unlocked ? sum + b.xpValue : sum), 0);
  const maxXp = badges.reduce((sum, b) => sum + b.xpValue, 0);

  let rankTitleFa = 'پژوهشگر معماری ایجنت (Associate Explorer)';
  let rankTitleEn = 'Associate Agent Explorer';

  if (completedCount === totalModules) {
    rankTitleFa = 'معمار ارشد گواهی‌شده Antigravity (Certified Principal Architect)';
    rankTitleEn = 'Certified Principal Antigravity Architect';
  } else if (completedCount >= 6) {
    rankTitleFa = 'فرمانده ارشد ارکستریشن (Staff Mission Commander)';
    rankTitleEn = 'Staff Mission Control Commander';
  } else if (completedCount >= 3) {
    rankTitleFa = 'مهندس سیستم‌های خودمختار (Autonomous Systems Engineer)';
    rankTitleEn = 'Autonomous Systems Engineer';
  }

  const sanitizedInitials =
    architectName
      .trim()
      .replace(/[^a-zA-Z0-9]/g, '')
      .slice(0, 4)
      .toUpperCase() || 'ARCH';

  const certificateSerial = `AG-2026-${sanitizedInitials}-${String(completedCount).padStart(2, '0')}0${totalXp}`;

  return {
    completedCount,
    totalModules,
    completionPercentage,
    totalXp,
    maxXp,
    rankTitleFa,
    rankTitleEn,
    certificateSerial,
    isCertified: completedCount === totalModules,
    badges,
  };
}

export function calculateStreakSummary(days: StudySessionDay[]): {
  currentStreakDays: number;
  longestStreakDays: number;
  totalMinutesStudied: number;
  activeDaysCount: number;
} {
  let currentStreakDays = 0;
  let longestStreakDays = 0;
  let runningStreak = 0;
  let totalMinutesStudied = 0;
  let activeDaysCount = 0;

  for (const day of days) {
    totalMinutesStudied += day.minutesStudied;
    if (day.active && day.minutesStudied > 0) {
      activeDaysCount += 1;
      runningStreak += 1;
      if (runningStreak > longestStreakDays) {
        longestStreakDays = runningStreak;
      }
    } else {
      runningStreak = 0;
    }
  }

  for (let i = days.length - 1; i >= 0; i--) {
    if (days[i].active && days[i].minutesStudied > 0) {
      currentStreakDays += 1;
    } else {
      break;
    }
  }

  return {
    currentStreakDays,
    longestStreakDays,
    totalMinutesStudied,
    activeDaysCount,
  };
}

export function formatShareableReportCardText(
  architectName: string,
  roleTitle: string,
  organization: string,
  metrics: CertificationReportMetrics,
  streakDays: number,
  totalMinutes: number
): string {
  const unlockedBadgesList = metrics.badges
    .filter((b) => b.unlocked)
    .map((b) => `  ✓ [${b.badgeCode}] ${b.badgeTitleEn}`)
    .join('\n');

  return [
    '============================================================',
    'GOOGLE ANTIGRAVITY ACADEMY — ARCHITECT PROGRESS REPORT CARD',
    '============================================================',
    `Candidate       : ${architectName || 'Principal Engineer'}`,
    `Role & Org      : ${roleTitle || 'AI Systems Architect'} @ ${organization || 'Enterprise Engineering'}`,
    `Standing Rank   : ${metrics.rankTitleEn}`,
    `Certificate ID  : ${metrics.certificateSerial}`,
    '------------------------------------------------------------',
    `Modules Mastered: ${metrics.completedCount} / ${metrics.totalModules} (${metrics.completionPercentage}%)`,
    `Engineering XP  : ${metrics.totalXp} / ${metrics.maxXp} XP`,
    `Study Streak    : ${streakDays} Consecutive Day(s) (${totalMinutes} mins logged)`,
    '------------------------------------------------------------',
    'Earned Competency Badges:',
    unlockedBadgesList || '  (No modules completed yet)',
    '============================================================',
    'Verified via Google Antigravity Academy & Mission Control Studio',
  ].join('\n');
}

export interface DailyStudyGoalItem {
  id: string;
  titleFa: string;
  moduleRef: string;
  targetMinutes: number;
  completed: boolean;
}

export interface WeeklyPlannerBarPoint {
  dateIso: string;
  dayLabelFa: string;
  actualMinutes: number;
  dailyTargetMinutes: number;
  heightPercent: number;
  targetLinePercent: number;
  metTarget: boolean;
}

export interface WeeklyPlannerAnalytics {
  weeklyTargetMinutes: number;
  weeklyActualMinutes: number;
  weeklyCompletionPercent: number;
  todayActualMinutes: number;
  todayTargetMinutes: number;
  todayCompletionPercent: number;
  daysMetTargetCount: number;
  chartBars: WeeklyPlannerBarPoint[];
}

export function calculateWeeklyPlannerMetrics(
  days: StudySessionDay[],
  dailyTargetMinutes: number
): WeeklyPlannerAnalytics {
  const safeDailyTarget = Math.max(10, Math.min(240, dailyTargetMinutes || 45));
  const weeklyTargetMinutes = safeDailyTarget * 7;
  const weeklyActualMinutes = days.reduce((sum, d) => sum + d.minutesStudied, 0);
  const weeklyCompletionPercent = Math.min(
    100,
    Math.round((weeklyActualMinutes / Math.max(1, weeklyTargetMinutes)) * 100)
  );

  const todayEntry = days[days.length - 1];
  const todayActualMinutes = todayEntry ? todayEntry.minutesStudied : 0;
  const todayCompletionPercent = Math.min(
    100,
    Math.round((todayActualMinutes / safeDailyTarget) * 100)
  );

  const maxScaleMinutes = Math.max(
    safeDailyTarget * 1.25,
    ...days.map((d) => d.minutesStudied),
    60
  );

  let daysMetTargetCount = 0;
  const chartBars: WeeklyPlannerBarPoint[] = days.map((d) => {
    const metTarget = d.minutesStudied >= safeDailyTarget;
    if (metTarget) {
      daysMetTargetCount += 1;
    }
    return {
      dateIso: d.dateIso,
      dayLabelFa: d.dayLabelFa,
      actualMinutes: d.minutesStudied,
      dailyTargetMinutes: safeDailyTarget,
      heightPercent: Math.min(100, Math.round((d.minutesStudied / maxScaleMinutes) * 100)),
      targetLinePercent: Math.min(100, Math.round((safeDailyTarget / maxScaleMinutes) * 100)),
      metTarget,
    };
  });

  return {
    weeklyTargetMinutes,
    weeklyActualMinutes,
    weeklyCompletionPercent,
    todayActualMinutes,
    todayTargetMinutes: safeDailyTarget,
    todayCompletionPercent,
    daysMetTargetCount,
    chartBars,
  };
}

export function formatActiveTimerDisplay(elapsedSeconds: number): string {
  const safeSecs = Math.max(0, Math.floor(elapsedSeconds));
  const mins = Math.floor(safeSecs / 60);
  const secs = safeSecs % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export interface StudioUsageItem {
  studioId: string;
  titleFa: string;
  titleEn: string;
  xpPerAction: number;
  actionsLogged: number;
}

export interface XpLevelBreakdown {
  moduleXp: number;
  readingTimeXp: number;
  studioUsageXp: number;
  totalCombinedXp: number;
  currentLevel: number;
  levelTitleFa: string;
  levelTitleEn: string;
  nextLevelTitleEn: string;
  currentLevelFloorXp: number;
  nextLevelTargetXp: number;
  xpIntoCurrentLevel: number;
  xpNeededForNextLevel: number;
  levelProgressPercent: number;
}

const LEVEL_RANKS: Array<{
  level: number;
  minXp: number;
  titleFa: string;
  titleEn: string;
}> = [
  { level: 1, minXp: 0, titleFa: 'معمار کارآموز ایجنت', titleEn: 'Agentic IDE Cadet' },
  { level: 2, minXp: 600, titleFa: 'اپراتور محیط Editor View', titleEn: 'Editor View Operator' },
  { level: 3, minXp: 1300, titleFa: 'طراح آرتیفکت و ممیزی', titleEn: 'Artifact & PR Review Auditor' },
  { level: 4, minXp: 2100, titleFa: 'مهندس کانتکست و قوانین', titleEn: 'Context & Guardrail Engineer' },
  { level: 5, minXp: 3000, titleFa: 'معمار پایپ‌لاین‌های خودکار و پروتکل MCP', titleEn: 'FastMCP & Turbo Pipeline Specialist' },
  { level: 6, minXp: 4000, titleFa: 'فرمانده ارشد ارکستریشن', titleEn: 'Staff Mission Control Commander' },
  { level: 7, minXp: 5200, titleFa: 'معمار ممتاز Google Antigravity', titleEn: 'Distinguished Antigravity Principal' },
];

export function calculateXpAndLevelProgression(
  moduleXp: number,
  totalReadingMinutes: number,
  studioItems: StudioUsageItem[]
): XpLevelBreakdown {
  const safeModuleXp = Math.max(0, Math.floor(moduleXp));
  const readingTimeXp = Math.max(0, Math.floor(totalReadingMinutes)) * 4;
  const studioUsageXp = studioItems.reduce(
    (sum, item) => sum + Math.max(0, item.actionsLogged) * Math.max(0, item.xpPerAction),
    0
  );
  const totalCombinedXp = safeModuleXp + readingTimeXp + studioUsageXp;

  let currentRankIdx = 0;
  for (let i = LEVEL_RANKS.length - 1; i >= 0; i--) {
    if (totalCombinedXp >= LEVEL_RANKS[i].minXp) {
      currentRankIdx = i;
      break;
    }
  }

  const currentRank = LEVEL_RANKS[currentRankIdx];
  const nextRank = LEVEL_RANKS[currentRankIdx + 1];

  const currentLevelFloorXp = currentRank.minXp;
  const nextLevelTargetXp = nextRank ? nextRank.minXp : currentRank.minXp + 1500;
  const levelSpanXp = Math.max(1, nextLevelTargetXp - currentLevelFloorXp);
  const xpIntoCurrentLevel = Math.max(0, totalCombinedXp - currentLevelFloorXp);
  const xpNeededForNextLevel = Math.max(0, nextLevelTargetXp - totalCombinedXp);
  const levelProgressPercent = nextRank
    ? Math.min(100, Math.round((xpIntoCurrentLevel / levelSpanXp) * 100))
    : 100;

  return {
    moduleXp: safeModuleXp,
    readingTimeXp,
    studioUsageXp,
    totalCombinedXp,
    currentLevel: currentRank.level,
    levelTitleFa: currentRank.titleFa,
    levelTitleEn: currentRank.titleEn,
    nextLevelTitleEn: nextRank ? nextRank.titleEn : 'Max Level Achieved (Distinguished Principal)',
    currentLevelFloorXp,
    nextLevelTargetXp,
    xpIntoCurrentLevel,
    xpNeededForNextLevel,
    levelProgressPercent,
  };
}


