import { CurriculumModule } from '../types/curriculum';
import {
  KnowledgeBaseEntryItem,
  calculateContextRotTelemetry,
  parseKnowledgeBaseBundleJson,
} from './generators';

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

export interface DigitalTrophySpec {
  trophyId: string;
  code: string;
  titleFa: string;
  titleEn: string;
  rarity: 'Mythic' | 'Legendary' | 'Epic';
  category: 'Full Curriculum Mastery' | 'High-Difficulty Scenario';
  scenarioOrRequirementEn: string;
  descriptionFa: string;
  bonusXp: number;
  unlocked: boolean;
  unlockConditionType: 'all-modules' | 'scenario';
}

export interface TrophyCaseSummary {
  trophies: DigitalTrophySpec[];
  unlockedCount: number;
  totalTrophies: number;
  trophyBonusXp: number;
  allUnlocked: boolean;
}

const TROPHY_DEFINITIONS: Array<Omit<DigitalTrophySpec, 'unlocked'>> = [
  {
    trophyId: 'trophy-omni-mastery',
    code: 'TR-MYTHIC-01',
    titleFa: 'تاج تسلط ۱۰۰٪ معمار ارشد Antigravity',
    titleEn: 'Omni-Architect 100% Curriculum Crown',
    rarity: 'Mythic',
    category: 'Full Curriculum Mastery',
    scenarioOrRequirementEn: '100% Mastery Across All 8 Core Engineering Modules',
    descriptionFa:
      'اهداشده به معمارانی که هر ۸ فصل تخصصی آکادمی Google Antigravity را با تسلط کامل به پایان رسانده‌اند.',
    bonusXp: 500,
    unlockConditionType: 'all-modules',
  },
  {
    trophyId: 'scenario-zero-downtime-alembic',
    code: 'TR-LEGEND-02',
    titleFa: 'تندیس مهاجرت بدون قطعی Alembic و قفل تراکنش',
    titleEn: 'Zero-Downtime Alembic Migration Sentinel',
    rarity: 'Legendary',
    category: 'High-Difficulty Scenario',
    scenarioOrRequirementEn: 'Scenario #1 · Expand-and-Contract Async PostgreSQL Migration',
    descriptionFa:
      'تکمیل سناریوی سطح بالای مهاجرت دیتابیس‌های پرترافیک با استراتژی Expand-and-Contract و پایپ‌لاین // turbo.',
    bonusXp: 350,
    unlockConditionType: 'scenario',
  },
  {
    trophyId: 'scenario-worktree-isolation',
    code: 'TR-LEGEND-03',
    titleFa: 'نشان فرماندهی ۳ ایجنت موازی روی Git Worktrees',
    titleEn: 'Multi-Agent Git Worktree Orchestrator',
    rarity: 'Legendary',
    category: 'High-Difficulty Scenario',
    scenarioOrRequirementEn: 'Scenario #4 · Parallel Background Agents Without Index Lock',
    descriptionFa:
      'مهار تداخل فایل‌های کاری و اجرای هم‌زمان ۳ ایجنت مستقل روی شاخه‌های ایزوله Git Worktree در Mission Control.',
    bonusXp: 350,
    unlockConditionType: 'scenario',
  },
  {
    trophyId: 'scenario-fastmcp-security',
    code: 'TR-EPIC-04',
    titleFa: 'سپر امنیت FastMCP و مهار کوئری‌های مخرب',
    titleEn: 'Air-Gapped FastMCP Security Shield',
    rarity: 'Epic',
    category: 'High-Difficulty Scenario',
    scenarioOrRequirementEn: 'Scenario #3 · Read-Only FastMCP Telemetry & Guardrail Deny-List',
    descriptionFa:
      'پیاده‌سازی سرور FastMCP ایزوله با تراکنش‌های Read-Only و مسدودسازی دستورات مخرب در لیست سیاه ترمینال.',
    bonusXp: 300,
    unlockConditionType: 'scenario',
  },
  {
    trophyId: 'scenario-browser-subagent-e2e',
    code: 'TR-EPIC-05',
    titleFa: 'کاپ ممیزی بصری E2E و شکار خطاهای شبکه ۵xx',
    titleEn: 'Browser Subagent Telemetry & WebP Auditor',
    rarity: 'Epic',
    category: 'High-Difficulty Scenario',
    scenarioOrRequirementEn: 'Scenario #6 · Automated DOM/Network Inspection & WebP Proof',
    descriptionFa:
      'استفاده از ساب‌ایجنت مرورگر برای رهگیری خودکار خطاهای کنسول و شبکه و ثبت مدرک ویدیویی WebP در walkthrough.md.',
    bonusXp: 300,
    unlockConditionType: 'scenario',
  },
];

export function calculateTrophyCaseStatus(
  completedModuleCount: number,
  totalModules: number,
  completedScenarioIds: string[]
): TrophyCaseSummary {
  const safeTotalModules = Math.max(1, totalModules || 8);
  const hasFullMastery = completedModuleCount >= safeTotalModules;
  const completedScenarioSet = new Set(completedScenarioIds);

  const trophies: DigitalTrophySpec[] = TROPHY_DEFINITIONS.map((def) => {
    const unlocked =
      def.unlockConditionType === 'all-modules'
        ? hasFullMastery
        : completedScenarioSet.has(def.trophyId);
    return {
      ...def,
      unlocked,
    };
  });

  const unlockedCount = trophies.filter((t) => t.unlocked).length;
  const trophyBonusXp = trophies.reduce((sum, t) => (t.unlocked ? sum + t.bonusXp : sum), 0);

  return {
    trophies,
    unlockedCount,
    totalTrophies: trophies.length,
    trophyBonusXp,
    allUnlocked: unlockedCount === trophies.length,
  };
}

export interface SharedMasteryProgressCardSnapshot {
  cardSlugId: string;
  certificateSerial: string;
  architectName: string;
  roleTitle: string;
  organization: string;
  rankTitleEn: string;
  rankTitleFa: string;
  completedCount: number;
  totalModules: number;
  completionPercentage: number;
  totalCombinedXp: number;
  currentLevel: number;
  currentStreakDays: number;
  unlockedBadgeCodes: string[];
  generatedAtIso: string;
}

export interface ShareProgressCardBundle {
  cardSlugId: string;
  publicCardUrl: string;
  shareHeadlineEn: string;
  shareMessageEn: string;
  shareMessageFa: string;
  socialShareUrls: {
    linkedInUrl: string;
    twitterXUrl: string;
    telegramUrl: string;
    whatsappUrl: string;
  };
  snapshot: SharedMasteryProgressCardSnapshot;
}

const DEFAULT_PUBLIC_APP_ORIGIN =
  'https://ais-pre-hh7srqiqrom64yvyragqco-216100173841.europe-west2.run.app';

export function buildShareableProgressCardBundle(input: {
  baseUrl?: string;
  architectName: string;
  roleTitle: string;
  organization: string;
  metrics: CertificationReportMetrics;
  xpProgression: XpLevelBreakdown;
  currentStreakDays: number;
  generatedAtIso?: string;
}): ShareProgressCardBundle {
  const safeBaseUrl = (input.baseUrl || DEFAULT_PUBLIC_APP_ORIGIN).replace(/\/+$/, '');
  const safeName = input.architectName.trim() || 'Principal Engineer';
  const safeRole = input.roleTitle.trim() || 'AI Systems Architect';
  const safeOrg = input.organization.trim() || 'Enterprise Engineering';
  const safeStreak = Math.max(0, Math.floor(input.currentStreakDays));
  const generatedAtIso = input.generatedAtIso || '2026-10-31T12:00:00.000Z';

  const slugName =
    safeName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 18) || 'architect';

  const cardSlugId = `ag-card-${slugName}-${input.metrics.completedCount}of${input.metrics.totalModules}-lvl${input.xpProgression.currentLevel}-${input.xpProgression.totalCombinedXp}xp`;

  const unlockedBadgeCodes = input.metrics.badges
    .filter((b) => b.unlocked)
    .map((b) => b.badgeCode);

  const snapshot: SharedMasteryProgressCardSnapshot = {
    cardSlugId,
    certificateSerial: input.metrics.certificateSerial,
    architectName: safeName,
    roleTitle: safeRole,
    organization: safeOrg,
    rankTitleEn: input.metrics.rankTitleEn,
    rankTitleFa: input.metrics.rankTitleFa,
    completedCount: input.metrics.completedCount,
    totalModules: input.metrics.totalModules,
    completionPercentage: input.metrics.completionPercentage,
    totalCombinedXp: input.xpProgression.totalCombinedXp,
    currentLevel: input.xpProgression.currentLevel,
    currentStreakDays: safeStreak,
    unlockedBadgeCodes,
    generatedAtIso,
  };

  const params = new URLSearchParams();
  params.set('section', 'achievements');
  params.set('cardId', cardSlugId);
  params.set('cert', input.metrics.certificateSerial);
  params.set('name', safeName);
  params.set('role', safeRole);
  params.set('org', safeOrg);
  params.set('rank', input.metrics.rankTitleEn);
  params.set('mods', String(input.metrics.completedCount));
  params.set('totalMods', String(input.metrics.totalModules));
  params.set('xp', String(input.xpProgression.totalCombinedXp));
  params.set('lvl', String(input.xpProgression.currentLevel));
  params.set('streak', String(safeStreak));
  if (unlockedBadgeCodes.length > 0) {
    params.set('badges', unlockedBadgeCodes.join(','));
  }

  const publicCardUrl = `${safeBaseUrl}/?${params.toString()}`;

  const shareHeadlineEn = `Google Antigravity Mastery Card — ${safeName} (Level ${input.xpProgression.currentLevel} · ${input.metrics.completionPercentage}%)`;
  const shareMessageEn = `🚀 Verified Google Antigravity Mastery Progress Card for ${safeName} (${safeRole} @ ${safeOrg}): Level ${input.xpProgression.currentLevel} (${input.xpProgression.totalCombinedXp} XP) · ${input.metrics.completedCount}/${input.metrics.totalModules} Modules Mastered (${input.metrics.completionPercentage}%) · Certificate [${input.metrics.certificateSerial}].`;
  const shareMessageFa = `⚡ کارنامه رسمی پیشرفت مهندسی Google Antigravity — ${safeName} | سطح ${input.xpProgression.currentLevel} (${input.xpProgression.totalCombinedXp} XP) | تکمیل ${input.metrics.completedCount} از ${input.metrics.totalModules} فصل تخصصی (${input.metrics.completionPercentage}٪) | کد گواهینامه: ${input.metrics.certificateSerial}`;

  const socialShareUrls = {
    linkedInUrl: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(publicCardUrl)}`,
    twitterXUrl: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareMessageEn)}&url=${encodeURIComponent(publicCardUrl)}`,
    telegramUrl: `https://t.me/share/url?url=${encodeURIComponent(publicCardUrl)}&text=${encodeURIComponent(`${shareMessageFa}\n\n${shareMessageEn}`)}`,
    whatsappUrl: `https://api.whatsapp.com/send?text=${encodeURIComponent(`${shareMessageEn}\n\n${publicCardUrl}`)}`,
  };

  return {
    cardSlugId,
    publicCardUrl,
    shareHeadlineEn,
    shareMessageEn,
    shareMessageFa,
    socialShareUrls,
    snapshot,
  };
}

export function parseSharedProgressCardFromQuery(
  queryString: string
): SharedMasteryProgressCardSnapshot | null {
  if (!queryString || !queryString.trim()) {
    return null;
  }
  const cleanQuery = queryString.startsWith('?') ? queryString.slice(1) : queryString;
  const params = new URLSearchParams(cleanQuery);
  const cardId = params.get('cardId');
  const cert = params.get('cert');
  if (!cardId && !cert) {
    return null;
  }

  const completedCount = Math.max(0, Math.min(8, Number(params.get('mods')) || 2));
  const totalModules = Math.max(1, Math.min(16, Number(params.get('totalMods')) || 8));
  const completionPercentage = Math.round((completedCount / totalModules) * 100);
  const totalCombinedXp = Math.max(0, Number(params.get('xp')) || 350);
  const currentLevel = Math.max(1, Math.min(7, Number(params.get('lvl')) || 1));
  const currentStreakDays = Math.max(0, Number(params.get('streak')) || 1);
  const badgesParam = params.get('badges') || '';
  const unlockedBadgeCodes = badgesParam
    ? badgesParam
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
    : [];

  const rankTitleEn = params.get('rank') || 'Associate Agent Explorer';
  let rankTitleFa = 'پژوهشگر معماری ایجنت (Associate Explorer)';
  if (completedCount >= totalModules) {
    rankTitleFa = 'معمار ارشد گواهی‌شده Antigravity (Certified Principal Architect)';
  } else if (completedCount >= 6) {
    rankTitleFa = 'فرمانده ارشد ارکستریشن (Staff Mission Commander)';
  } else if (completedCount >= 3) {
    rankTitleFa = 'مهندس سیستم‌های خودمختار (Autonomous Systems Engineer)';
  }

  return {
    cardSlugId: cardId || `ag-card-shared-${cert || 'verified'}`,
    certificateSerial: cert || 'AG-2026-ARCH-020350',
    architectName: params.get('name') || 'Principal Engineer',
    roleTitle: params.get('role') || 'AI Systems Architect',
    organization: params.get('org') || 'Enterprise Engineering',
    rankTitleEn,
    rankTitleFa,
    completedCount,
    totalModules,
    completionPercentage,
    totalCombinedXp,
    currentLevel,
    currentStreakDays,
    unlockedBadgeCodes,
    generatedAtIso: new Date().toISOString(),
  };
}

export type HeatmapActivitySource = 'none' | 'academy' | 'studios' | 'both';

export interface HeatmapDayCell {
  dateIso: string;
  dayOfWeek: number; // 0 (Sun) .. 6 (Sat)
  weekIndex: number; // 0 .. weeksCount - 1
  monthLabelEn: string;
  dayLabelFa: string;
  minutesStudied: number;
  modulesTouched: number;
  studioRuns: number;
  activitySource: HeatmapActivitySource;
  intensityLevel: 0 | 1 | 2 | 3 | 4;
  xpEarned: number;
  active: boolean;
}

export interface HeatmapCalendarSummary {
  cells: HeatmapDayCell[];
  totalWeeks: number;
  activeDaysCount: number;
  academyOnlyDaysCount: number;
  studiosOnlyDaysCount: number;
  bothActiveDaysCount: number;
  totalMinutesInWindow: number;
  totalStudioRunsInWindow: number;
  maxDailyMinutes: number;
  monthMarkers: Array<{ weekIndex: number; labelEn: string }>;
}

const WEEKDAY_LABELS_FA = [
  'یکشنبه',
  'دوشنبه',
  'سه‌شنبه',
  'چهارشنبه',
  'پنج‌شنبه',
  'جمعه',
  'شنبه',
];

const MONTH_NAMES_SHORT_EN = [
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

export function buildStudyStreakHeatmapData(
  recentStudyDays: StudySessionDay[],
  studioUsageItems: StudioUsageItem[],
  weeksCount = 12,
  customHistoricalOverrides: Record<string, { active: boolean; minutesStudied: number; studioRuns: number }> = {}
): HeatmapCalendarSummary {
  const safeWeeks = Math.max(4, Math.min(26, Math.floor(weeksCount || 12)));
  const totalDays = safeWeeks * 7;

  const recentMap = new Map<string, StudySessionDay>();
  for (const d of recentStudyDays) {
    recentMap.set(d.dateIso, d);
  }

  const totalStudioActions = studioUsageItems.reduce(
    (sum, item) => sum + Math.max(0, item.actionsLogged),
    0
  );

  // Anchor end date to the last entry in recentStudyDays or 2026-10-27
  const anchorIso =
    recentStudyDays.length > 0
      ? recentStudyDays[recentStudyDays.length - 1].dateIso
      : '2026-10-27';
  const anchorParts = anchorIso.split('-').map(Number);
  const anchorUtc = Date.UTC(
    anchorParts[0] || 2026,
    (anchorParts[1] || 10) - 1,
    anchorParts[2] || 27
  );

  const cells: HeatmapDayCell[] = [];
  const monthMarkers: Array<{ weekIndex: number; labelEn: string }> = [];
  let lastSeenMonth = -1;

  for (let i = 0; i < totalDays; i++) {
    const offsetDaysFromAnchor = totalDays - 1 - i;
    const dayUtc = anchorUtc - offsetDaysFromAnchor * 86400000;
    const dateObj = new Date(dayUtc);
    const year = dateObj.getUTCFullYear();
    const monthIdx = dateObj.getUTCMonth();
    const dayNum = dateObj.getUTCDate();
    const dayOfWeek = dateObj.getUTCDay();
    const weekIndex = Math.floor(i / 7);

    const dateIso = `${year}-${String(monthIdx + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
    const monthLabelEn = MONTH_NAMES_SHORT_EN[monthIdx] || 'Oct';
    const dayLabelFa = WEEKDAY_LABELS_FA[dayOfWeek] || 'سه‌شنبه';

    if (monthIdx !== lastSeenMonth) {
      if (!monthMarkers.some((m) => m.weekIndex === weekIndex)) {
        monthMarkers.push({ weekIndex, labelEn: monthLabelEn });
      }
      lastSeenMonth = monthIdx;
    }

    const recentEntry = recentMap.get(dateIso);
    const override = customHistoricalOverrides[dateIso];

    let minutesStudied = 0;
    let modulesTouched = 0;
    let studioRuns = 0;
    let active = false;

    if (override) {
      active = override.active;
      minutesStudied = override.active ? override.minutesStudied : 0;
      modulesTouched = override.active && minutesStudied >= 20 ? 1 : 0;
      studioRuns = override.active ? override.studioRuns : 0;
    } else if (recentEntry) {
      active = recentEntry.active && recentEntry.minutesStudied > 0;
      minutesStudied = active ? recentEntry.minutesStudied : 0;
      modulesTouched = active ? recentEntry.modulesTouched : 0;
      if (active) {
        // Distribute current studio runs across the active recent days deterministically
        const recentIndex = recentStudyDays.findIndex((r) => r.dateIso === dateIso);
        if (recentIndex === recentStudyDays.length - 1) {
          studioRuns = Math.max(1, Math.min(6, totalStudioActions - 3));
        } else if (recentIndex % 2 === 1) {
          studioRuns = 2;
        } else if (recentIndex === 0) {
          studioRuns = 1;
        }
      }
    } else {
      // Deterministic historical telemetry pattern across the preceding weeks
      const seed = (i * 17 + dayNum * 7 + (monthIdx + 1) * 13) % 19;
      if (seed >= 6) {
        active = true;
        if (seed % 4 === 0) {
          // Combined Academy + Studio deep session
          minutesStudied = 45 + (seed % 3) * 15;
          modulesTouched = 2;
          studioRuns = 2 + (seed % 2);
        } else if (seed % 3 === 0) {
          // Studio-focused engineering lab day
          minutesStudied = 25 + (seed % 3) * 10;
          modulesTouched = 0;
          studioRuns = 2 + (seed % 3);
        } else {
          // Academy curriculum study day
          minutesStudied = 30 + (seed % 4) * 10;
          modulesTouched = 1 + (seed % 2);
          studioRuns = 0;
        }
      }
    }

    let activitySource: HeatmapActivitySource = 'none';
    if (active && (minutesStudied > 0 || studioRuns > 0)) {
      if (modulesTouched > 0 && studioRuns > 0) {
        activitySource = 'both';
      } else if (studioRuns > 0 && modulesTouched === 0) {
        activitySource = 'studios';
      } else {
        activitySource = 'academy';
      }
    } else {
      active = false;
      minutesStudied = 0;
      modulesTouched = 0;
      studioRuns = 0;
    }

    const effectiveScore = minutesStudied + studioRuns * 18;
    let intensityLevel: 0 | 1 | 2 | 3 | 4 = 0;
    if (!active || effectiveScore <= 0) {
      intensityLevel = 0;
    } else if (effectiveScore < 35) {
      intensityLevel = 1;
    } else if (effectiveScore < 55) {
      intensityLevel = 2;
    } else if (effectiveScore < 80) {
      intensityLevel = 3;
    } else {
      intensityLevel = 4;
    }

    const xpEarned = active ? minutesStudied * 4 + studioRuns * 100 : 0;

    cells.push({
      dateIso,
      dayOfWeek,
      weekIndex,
      monthLabelEn,
      dayLabelFa,
      minutesStudied,
      modulesTouched,
      studioRuns,
      activitySource,
      intensityLevel,
      xpEarned,
      active,
    });
  }

  let activeDaysCount = 0;
  let academyOnlyDaysCount = 0;
  let studiosOnlyDaysCount = 0;
  let bothActiveDaysCount = 0;
  let totalMinutesInWindow = 0;
  let totalStudioRunsInWindow = 0;
  let maxDailyMinutes = 0;

  for (const c of cells) {
    if (c.active) {
      activeDaysCount += 1;
      totalMinutesInWindow += c.minutesStudied;
      totalStudioRunsInWindow += c.studioRuns;
      if (c.minutesStudied > maxDailyMinutes) {
        maxDailyMinutes = c.minutesStudied;
      }
      if (c.activitySource === 'academy') academyOnlyDaysCount += 1;
      else if (c.activitySource === 'studios') studiosOnlyDaysCount += 1;
      else if (c.activitySource === 'both') bothActiveDaysCount += 1;
    }
  }

  return {
    cells,
    totalWeeks: safeWeeks,
    activeDaysCount,
    academyOnlyDaysCount,
    studiosOnlyDaysCount,
    bothActiveDaysCount,
    totalMinutesInWindow,
    totalStudioRunsInWindow,
    maxDailyMinutes,
    monthMarkers,
  };
}

export const DAILY_STREAK_STORAGE_KEY = 'antigravity_daily_streak_state_v1';

export type StreakMilestoneThreshold = 7 | 30 | 100;

export interface StreakMilestoneBadge {
  thresholdDays: StreakMilestoneThreshold;
  badgeId: string;
  badgeCode: string;
  titleFa: string;
  titleEn: string;
  descriptionFa: string;
  tier: 'Bronze' | 'Gold' | 'Mythic';
  bonusXp: number;
  unlocked: boolean;
  progressPercent: number;
  daysRemaining: number;
}

export interface PersistedDailyStreakState {
  schemaVersion: '1.0.0';
  currentStreakDays: number;
  longestStreakDays: number;
  lastLoggedDateIso: string;
  studyDays: StudySessionDay[];
  updatedAtIso: string;
}

export interface DailyStreakMilestoneEvaluation {
  currentStreakDays: number;
  longestStreakDays: number;
  nextMilestoneDays: StreakMilestoneThreshold | null;
  daysToNextMilestone: number;
  nextMilestoneProgressPercent: number;
  unlockedMilestoneCount: number;
  totalMilestones: number;
  totalMilestoneBonusXp: number;
  highestUnlockedBadge: StreakMilestoneBadge | null;
  milestones: StreakMilestoneBadge[];
}

const STREAK_MILESTONE_SPECS: Array<{
  thresholdDays: StreakMilestoneThreshold;
  badgeId: string;
  badgeCode: string;
  titleFa: string;
  titleEn: string;
  descriptionFa: string;
  tier: 'Bronze' | 'Gold' | 'Mythic';
  bonusXp: number;
}> = [
  {
    thresholdDays: 7,
    badgeId: 'streak-milestone-7',
    badgeCode: 'AG-STRK-007',
    titleFa: 'نشان پیوستگی ۷ روزه: پیشگام نظم ایجنتیک',
    titleEn: '7-Day Agentic Cadence Pioneer',
    descriptionFa:
      '۷ روز متوالی مطالعه و تمرین بی‌وقفه در ماژول‌های معماری و استودیوهای Antigravity.',
    tier: 'Bronze',
    bonusXp: 150,
  },
  {
    thresholdDays: 30,
    badgeId: 'streak-milestone-30',
    badgeCode: 'AG-STRK-030',
    titleFa: 'نشان پیوستگی ۳۰ روزه: فرمانده استمرار Mission Control',
    titleEn: '30-Day Mission Control Vanguard',
    descriptionFa:
      '۳۰ روز متوالی استمرار مهندسی، بازبینی آرتیفکت‌ها و تسلط بر پایپ‌لاین‌های خودمختار.',
    tier: 'Gold',
    bonusXp: 500,
  },
  {
    thresholdDays: 100,
    badgeId: 'streak-milestone-100',
    badgeCode: 'AG-STRK-100',
    titleFa: 'نشان افسانه‌ای ۱۰۰ روزه: معمار جاویدان Antigravity',
    titleEn: '100-Day Centurion Principal Architect',
    descriptionFa:
      '۱۰۰ روز پیوستگی مطلق در مهندسی سیستم‌های ایجنتیک، حذف کامل Context Rot و رهبری فنی.',
    tier: 'Mythic',
    bonusXp: 1500,
  },
];

export function evaluateDailyStreakMilestones(
  currentStreakDays: number,
  longestStreakDays = 0
): DailyStreakMilestoneEvaluation {
  const safeCurrent = Math.max(0, Math.floor(currentStreakDays));
  const safeLongest = Math.max(safeCurrent, Math.floor(longestStreakDays));

  const milestones: StreakMilestoneBadge[] = STREAK_MILESTONE_SPECS.map((spec) => {
    const unlocked = safeCurrent >= spec.thresholdDays;
    const progressPercent = Math.min(
      100,
      Math.round((safeCurrent / spec.thresholdDays) * 100)
    );
    const daysRemaining = Math.max(0, spec.thresholdDays - safeCurrent);
    return {
      ...spec,
      unlocked,
      progressPercent,
      daysRemaining,
    };
  });

  const unlockedMilestones = milestones.filter((m) => m.unlocked);
  const highestUnlockedBadge =
    unlockedMilestones.length > 0
      ? unlockedMilestones[unlockedMilestones.length - 1]
      : null;

  const nextMilestone = milestones.find((m) => !m.unlocked) || null;
  const nextMilestoneDays = nextMilestone ? nextMilestone.thresholdDays : null;
  const daysToNextMilestone = nextMilestone ? nextMilestone.daysRemaining : 0;

  let nextMilestoneProgressPercent = 100;
  if (nextMilestone) {
    const prevThreshold =
      nextMilestone.thresholdDays === 100
        ? 30
        : nextMilestone.thresholdDays === 30
        ? 7
        : 0;
    const span = Math.max(1, nextMilestone.thresholdDays - prevThreshold);
    const progressedInSpan = Math.max(0, safeCurrent - prevThreshold);
    nextMilestoneProgressPercent = Math.min(
      100,
      Math.round((progressedInSpan / span) * 100)
    );
  }

  const totalMilestoneBonusXp = unlockedMilestones.reduce(
    (sum, m) => sum + m.bonusXp,
    0
  );

  return {
    currentStreakDays: safeCurrent,
    longestStreakDays: safeLongest,
    nextMilestoneDays,
    daysToNextMilestone,
    nextMilestoneProgressPercent,
    unlockedMilestoneCount: unlockedMilestones.length,
    totalMilestones: milestones.length,
    totalMilestoneBonusXp,
    highestUnlockedBadge,
    milestones,
  };
}

export function serializeDailyStreakStateToStorage(
  state: Omit<PersistedDailyStreakState, 'schemaVersion' | 'updatedAtIso'>
): string {
  const payload: PersistedDailyStreakState = {
    schemaVersion: '1.0.0',
    currentStreakDays: Math.max(0, Math.floor(state.currentStreakDays)),
    longestStreakDays: Math.max(
      Math.max(0, Math.floor(state.currentStreakDays)),
      Math.floor(state.longestStreakDays)
    ),
    lastLoggedDateIso: state.lastLoggedDateIso || '2026-10-27',
    studyDays: Array.isArray(state.studyDays) ? state.studyDays : [],
    updatedAtIso: new Date().toISOString(),
  };
  return JSON.stringify(payload);
}

export function parseDailyStreakStateFromStorage(
  rawJson: string | null | undefined,
  fallbackStudyDays: StudySessionDay[]
): PersistedDailyStreakState {
  const fallbackSummary = calculateStreakSummary(fallbackStudyDays);
  const fallbackLastDate =
    fallbackStudyDays.length > 0
      ? fallbackStudyDays[fallbackStudyDays.length - 1].dateIso
      : '2026-10-27';

  const defaultState: PersistedDailyStreakState = {
    schemaVersion: '1.0.0',
    currentStreakDays: fallbackSummary.currentStreakDays,
    longestStreakDays: fallbackSummary.longestStreakDays,
    lastLoggedDateIso: fallbackLastDate,
    studyDays: fallbackStudyDays,
    updatedAtIso: '2026-10-27T12:00:00.000Z',
  };

  if (!rawJson || typeof rawJson !== 'string') {
    return defaultState;
  }

  try {
    const parsed = JSON.parse(rawJson) as Partial<PersistedDailyStreakState>;
    if (!parsed || typeof parsed !== 'object') {
      return defaultState;
    }

    const validStudyDays =
      Array.isArray(parsed.studyDays) && parsed.studyDays.length > 0
        ? parsed.studyDays.filter(
            (d): d is StudySessionDay =>
              Boolean(
                d &&
                  typeof d.dateIso === 'string' &&
                  typeof d.dayLabelFa === 'string' &&
                  typeof d.minutesStudied === 'number' &&
                  typeof d.active === 'boolean'
              )
          )
        : fallbackStudyDays;

    const computedFromStrip = calculateStreakSummary(validStudyDays);
    const currentStreakDays =
      typeof parsed.currentStreakDays === 'number' && parsed.currentStreakDays >= 0
        ? Math.floor(parsed.currentStreakDays)
        : computedFromStrip.currentStreakDays;

    const longestStreakDays = Math.max(
      currentStreakDays,
      typeof parsed.longestStreakDays === 'number' && parsed.longestStreakDays >= 0
        ? Math.floor(parsed.longestStreakDays)
        : computedFromStrip.longestStreakDays
    );

    return {
      schemaVersion: '1.0.0',
      currentStreakDays,
      longestStreakDays,
      lastLoggedDateIso:
        typeof parsed.lastLoggedDateIso === 'string' && parsed.lastLoggedDateIso
          ? parsed.lastLoggedDateIso
          : fallbackLastDate,
      studyDays: validStudyDays.length > 0 ? validStudyDays : fallbackStudyDays,
      updatedAtIso:
        typeof parsed.updatedAtIso === 'string'
          ? parsed.updatedAtIso
          : defaultState.updatedAtIso,
    };
  } catch {
    return defaultState;
  }
}

export interface UnifiedLearningMigrationBackup {
  schemaVersion: '1.0.0';
  bundleType: 'google-antigravity-unified-migration-backup';
  exportedAtIso: string;
  targetPath: '.agent/knowledge-base/antigravity-unified-backup.json';
  architectProfile: {
    architectName: string;
    standingRankFa: string;
    standingRankEn: string;
    certificateSerial: string;
    isCertified: boolean;
  };
  learningHistory: {
    completedModuleIds: string[];
    completedModulesCount: number;
    totalModulesCount: number;
    completionPercentage: number;
    completedModulesDetail: Array<{
      moduleId: string;
      moduleNumber: number;
      titleFa: string;
      titleEn: string;
      completed: boolean;
    }>;
    currentStreakDays: number;
    longestStreakDays: number;
    totalMinutesStudied: number;
    activeStudyDaysCount: number;
    studySessionLog: StudySessionDay[];
    lastAccessedSession: {
      section: string;
      moduleId?: string;
      updatedAtIso: string;
    } | null;
  };
  badgeList: {
    unlockedModuleBadgesCount: number;
    totalModuleBadgesCount: number;
    unlockedStreakMilestonesCount: number;
    totalStreakMilestonesCount: number;
    totalUnlockedBadgesCount: number;
    unlockedBadgeCodes: string[];
    moduleCompetencyBadges: ModuleBadgeSpec[];
    streakMilestoneBadges: StreakMilestoneBadge[];
  };
  accumulatedXp: {
    moduleMasteryXp: number;
    streakMilestoneBonusXp: number;
    readingTimeXp: number;
    studioLabXp: number;
    totalAccumulatedXp: number;
    currentArchitectLevel: number;
    architectLevelTitleFa: string;
    architectLevelTitleEn: string;
    levelProgressPercent: number;
    xpNeededForNextLevel: number;
  };
  knowledgeBase: {
    totalEntries: number;
    totalTokens: number;
    averageStalenessPercent: number;
    rotStatus: string;
    entries: KnowledgeBaseEntryItem[];
  };
}

export const DEFAULT_MIGRATION_STUDIO_USAGE: StudioUsageItem[] = [
  {
    studioId: 'mission-control-sim',
    titleFa: 'شبیه‌ساز زنده Mission Control و PR Review',
    titleEn: 'Mission Control & PR Review Simulator',
    xpPerAction: 80,
    actionsLogged: 2,
  },
  {
    studioId: 'rule-workflow-studio',
    titleFa: 'استودیوی قوانین (.agent/rules) و ورک‌فلوها',
    titleEn: 'Rule & Workflow Generator Studio',
    xpPerAction: 90,
    actionsLogged: 2,
  },
  {
    studioId: 'fastmcp-builder-studio',
    titleFa: 'استودیوی بصری سرور FastMCP و تولید mcp_config.json',
    titleEn: 'Enterprise FastMCP Server Studio',
    xpPerAction: 120,
    actionsLogged: 1,
  },
  {
    studioId: 'principal-case-studies',
    titleFa: 'آزمایشگاه ۸ چالش معماری واقعی (Production Scenarios)',
    titleEn: '8 Principal Architecture Case Studies',
    xpPerAction: 110,
    actionsLogged: 1,
  },
];

export function buildUnifiedLearningMigrationBackup(params: {
  allModules: CurriculumModule[];
  completedModuleIds: string[];
  architectName?: string;
  streakState: PersistedDailyStreakState;
  studioUsageItems?: StudioUsageItem[];
  knowledgeEntries: KnowledgeBaseEntryItem[];
  lastAccessedSession?: {
    section: string;
    moduleId?: string;
    updatedAtIso: string;
  } | null;
  exportedAtIso?: string;
}): UnifiedLearningMigrationBackup {
  const architectName =
    params.architectName?.trim() || 'آریا رستمی (Aria Rostami)';
  const exportedAtIso = params.exportedAtIso || new Date().toISOString();
  const studioItems =
    params.studioUsageItems && params.studioUsageItems.length > 0
      ? params.studioUsageItems
      : DEFAULT_MIGRATION_STUDIO_USAGE;

  const certMetrics = calculateCertificationMetrics(
    params.allModules,
    params.completedModuleIds,
    architectName
  );
  const stripSummary = calculateStreakSummary(params.streakState.studyDays);
  const currentStreakDays = Math.max(
    0,
    params.streakState.currentStreakDays
  );
  const longestStreakDays = Math.max(
    currentStreakDays,
    params.streakState.longestStreakDays,
    stripSummary.longestStreakDays
  );
  const streakEval = evaluateDailyStreakMilestones(
    currentStreakDays,
    longestStreakDays
  );

  const xpProgression = calculateXpAndLevelProgression(
    certMetrics.totalXp + streakEval.totalMilestoneBonusXp,
    stripSummary.totalMinutesStudied,
    studioItems
  );

  const unlockedModuleCodes = certMetrics.badges
    .filter((b) => b.unlocked)
    .map((b) => b.badgeCode);
  const unlockedStreakCodes = streakEval.milestones
    .filter((m) => m.unlocked)
    .map((m) => m.badgeCode);
  const unlockedBadgeCodes = [...unlockedModuleCodes, ...unlockedStreakCodes];

  const completedSet = new Set(params.completedModuleIds);
  const completedModulesDetail = params.allModules.map((mod) => ({
    moduleId: mod.id,
    moduleNumber: mod.number,
    titleFa: mod.titleFa,
    titleEn: mod.titleEn,
    completed: completedSet.has(mod.id),
  }));

  const kbTelemetry = calculateContextRotTelemetry(
    params.knowledgeEntries,
    4500
  );

  return {
    schemaVersion: '1.0.0',
    bundleType: 'google-antigravity-unified-migration-backup',
    exportedAtIso,
    targetPath: '.agent/knowledge-base/antigravity-unified-backup.json',
    architectProfile: {
      architectName,
      standingRankFa: certMetrics.rankTitleFa,
      standingRankEn: certMetrics.rankTitleEn,
      certificateSerial: certMetrics.certificateSerial,
      isCertified: certMetrics.isCertified,
    },
    learningHistory: {
      completedModuleIds: Array.from(completedSet),
      completedModulesCount: certMetrics.completedCount,
      totalModulesCount: certMetrics.totalModules,
      completionPercentage: certMetrics.completionPercentage,
      completedModulesDetail,
      currentStreakDays,
      longestStreakDays,
      totalMinutesStudied: stripSummary.totalMinutesStudied,
      activeStudyDaysCount: stripSummary.activeDaysCount,
      studySessionLog: params.streakState.studyDays,
      lastAccessedSession: params.lastAccessedSession ?? null,
    },
    badgeList: {
      unlockedModuleBadgesCount: unlockedModuleCodes.length,
      totalModuleBadgesCount: certMetrics.badges.length,
      unlockedStreakMilestonesCount: unlockedStreakCodes.length,
      totalStreakMilestonesCount: streakEval.milestones.length,
      totalUnlockedBadgesCount: unlockedBadgeCodes.length,
      unlockedBadgeCodes,
      moduleCompetencyBadges: certMetrics.badges,
      streakMilestoneBadges: streakEval.milestones,
    },
    accumulatedXp: {
      moduleMasteryXp: certMetrics.totalXp,
      streakMilestoneBonusXp: streakEval.totalMilestoneBonusXp,
      readingTimeXp: xpProgression.readingXp,
      studioLabXp: xpProgression.studioXp,
      totalAccumulatedXp: xpProgression.totalCombinedXp,
      currentArchitectLevel: xpProgression.currentLevel,
      architectLevelTitleFa: xpProgression.currentLevelTitleFa,
      architectLevelTitleEn: xpProgression.currentLevelTitleEn,
      levelProgressPercent: xpProgression.levelProgressPercent,
      xpNeededForNextLevel: xpProgression.xpNeededForNextLevel,
    },
    knowledgeBase: {
      totalEntries: kbTelemetry.totalEntries,
      totalTokens: kbTelemetry.totalTokens,
      averageStalenessPercent: kbTelemetry.averageStalenessPercent,
      rotStatus: kbTelemetry.rotStatus,
      entries: params.knowledgeEntries,
    },
  };
}

export function exportUnifiedLearningMigrationJson(
  backup: UnifiedLearningMigrationBackup
): string {
  return JSON.stringify(backup, null, 2);
}

export function parseUnifiedLearningMigrationJson(rawJson: string): {
  valid: boolean;
  error?: string;
  completedModuleIds?: string[];
  currentStreakDays?: number;
  longestStreakDays?: number;
  studySessionLog?: StudySessionDay[];
  knowledgeEntries?: KnowledgeBaseEntryItem[];
  exportedAtIso?: string;
} {
  if (!rawJson || !rawJson.trim()) {
    return {
      valid: false,
      error: 'محتوای فایل پشتیبان JSON خالی است.',
    };
  }

  try {
    const parsed = JSON.parse(rawJson) as Record<string, unknown>;
    if (!parsed || typeof parsed !== 'object') {
      return {
        valid: false,
        error: 'ساختار فایل پشتیبان یک آبجکت معتبر JSON نیست.',
      };
    }

    const learningHistory = parsed.learningHistory as
      | Record<string, unknown>
      | undefined;
    const knowledgeBase = parsed.knowledgeBase as
      | Record<string, unknown>
      | undefined;

    if (!learningHistory || typeof learningHistory !== 'object') {
      return {
        valid: false,
        error:
          'فیلد الزامی learningHistory در فایل پشتیبان مهاجرت یافت نشد.',
      };
    }

    const completedModuleIds = Array.isArray(learningHistory.completedModuleIds)
      ? learningHistory.completedModuleIds.filter(
          (id): id is string => typeof id === 'string' && id.trim().length > 0
        )
      : [];

    const currentStreakDays =
      typeof learningHistory.currentStreakDays === 'number' &&
      learningHistory.currentStreakDays >= 0
        ? Math.floor(learningHistory.currentStreakDays)
        : 7;

    const longestStreakDays = Math.max(
      currentStreakDays,
      typeof learningHistory.longestStreakDays === 'number' &&
        learningHistory.longestStreakDays >= 0
        ? Math.floor(learningHistory.longestStreakDays)
        : currentStreakDays
    );

    const studySessionLog = Array.isArray(learningHistory.studySessionLog)
      ? learningHistory.studySessionLog.filter(
          (d): d is StudySessionDay =>
            Boolean(
              d &&
                typeof d === 'object' &&
                typeof (d as StudySessionDay).dateIso === 'string' &&
                typeof (d as StudySessionDay).minutesStudied === 'number'
            )
        )
      : undefined;

    let knowledgeEntries: KnowledgeBaseEntryItem[] | undefined;
    if (knowledgeBase && Array.isArray(knowledgeBase.entries)) {
      const kbParsed = parseKnowledgeBaseBundleJson(
        JSON.stringify({
          entries: knowledgeBase.entries,
          exportedAtIso:
            typeof parsed.exportedAtIso === 'string'
              ? parsed.exportedAtIso
              : undefined,
        })
      );
      if (kbParsed.valid && kbParsed.entries) {
        knowledgeEntries = kbParsed.entries;
      }
    }

    return {
      valid: true,
      completedModuleIds,
      currentStreakDays,
      longestStreakDays,
      studySessionLog,
      knowledgeEntries,
      exportedAtIso:
        typeof parsed.exportedAtIso === 'string'
          ? parsed.exportedAtIso
          : '2026-10-31T22:45:00.000Z',
    };
  } catch {
    return {
      valid: false,
      error: 'فرمت JSON نامعتبر است (خطای نحوی در پارس کردن فایل پشتیبان).',
    };
  }
}

