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
      readingTimeXp: xpProgression.readingTimeXp,
      studioLabXp: xpProgression.studioUsageXp,
      totalAccumulatedXp: xpProgression.totalCombinedXp,
      currentArchitectLevel: xpProgression.currentLevel,
      architectLevelTitleFa: xpProgression.levelTitleFa,
      architectLevelTitleEn: xpProgression.levelTitleEn,
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

export type MasteryRankId = 'trainee' | 'specialist' | 'architect' | 'principal';

export interface MasteryRankTierSpec {
  rankId: MasteryRankId;
  rankOrder: 1 | 2 | 3 | 4;
  rankCode: 'RANK-01' | 'RANK-02' | 'RANK-03' | 'RANK-04';
  badgeCode: 'RANK-01' | 'RANK-02' | 'RANK-03' | 'RANK-04';
  rankNameEn: 'Trainee' | 'Specialist' | 'Architect' | 'Principal';
  rankTitleFa: string;
  rankSubtitleEn: string;
  rankTitleEn: string;
  minXpRequired: number;
  minXp: number;
  minMilestonesRequired: number;
  minMilestones: number;
  unlocked: boolean;
  isCurrentRank: boolean;
  isCurrent: boolean;
  privilegesFa: string;
  descriptionFa: string;
  accentHex: string;
}

export interface MasteryRankStandingSummary {
  currentRank: MasteryRankTierSpec;
  nextRank: MasteryRankTierSpec | null;
  tiers: MasteryRankTierSpec[];
  ranks: MasteryRankTierSpec[];
  accumulatedXp: number;
  totalCombinedXp: number;
  unlockedMilestonesCount: number;
  totalMilestonesCompleted: number;
  totalPossibleMilestones: number;
  xpNeededForNextRank: number;
  milestonesNeededForNextRank: number;
  progressToNextRankPercent: number;
  overallProgressToNextPercent: number;
  xpProgressToNextPercent: number;
  milestoneProgressToNextPercent: number;
}

const MASTERY_RANK_DEFINITIONS: Array<
  Omit<
    MasteryRankTierSpec,
    | 'unlocked'
    | 'isCurrentRank'
    | 'isCurrent'
    | 'badgeCode'
    | 'rankTitleEn'
    | 'minXp'
    | 'minMilestones'
    | 'descriptionFa'
  >
> = [
  {
    rankId: 'trainee',
    rankOrder: 1,
    rankCode: 'RANK-01',
    rankNameEn: 'Trainee',
    rankTitleFa: 'کارآموز مهندسی ایجنت (Trainee)',
    rankSubtitleEn: 'Agentic IDE Trainee',
    minXpRequired: 0,
    minMilestonesRequired: 0,
    privilegesFa:
      'آشنایی با معماری دوگانه Editor View و Agent Manager، Supercomplete و چرخه پایه آرتیفکت‌ها.',
    accentHex: '#3b82f6',
  },
  {
    rankId: 'specialist',
    rankOrder: 2,
    rankCode: 'RANK-02',
    rankNameEn: 'Specialist',
    rankTitleFa: 'متخصص عملیات ایجنتی (Specialist)',
    rankSubtitleEn: 'Autonomous Workflow Specialist',
    minXpRequired: 1200,
    minMilestonesRequired: 2,
    privilegesFa:
      'تسلط بر ممیزی PR-Style روی implementation_plan.md، سیاست‌های ترمینال و تدوین قوانین .agent/rules.',
    accentHex: '#10b981',
  },
  {
    rankId: 'architect',
    rankOrder: 3,
    rankCode: 'RANK-03',
    rankNameEn: 'Architect',
    rankTitleFa: 'معمار سیستم‌های خودمختار (Architect)',
    rankSubtitleEn: 'Enterprise Systems Architect',
    minXpRequired: 2400,
    minMilestonesRequired: 5,
    privilegesFa:
      'طراحی پایپ‌لاین‌های // turbo، بازرسی تله‌متری Browser Subagent و پیاده‌سازی سرورهای امن FastMCP.',
    accentHex: '#6366f1',
  },
  {
    rankId: 'principal',
    rankOrder: 4,
    rankCode: 'RANK-04',
    rankNameEn: 'Principal',
    rankTitleFa: 'معمار ارشد Principal (Principal)',
    rankSubtitleEn: 'Principal Antigravity Architect',
    minXpRequired: 3600,
    minMilestonesRequired: 8,
    privilegesFa:
      'فرماندهی ارکستریشن چندایجنتی در Git Worktrees ایزوله، مهار کامل Context Rot و گواهینامه رسمی Principal.',
    accentHex: '#f59e0b',
  },
];

export function calculateMasteryRankStanding(params: {
  totalCombinedXp: number;
  completedModulesCount: number;
  unlockedStreakMilestonesCount: number;
  unlockedTrophiesCount?: number;
}): MasteryRankStandingSummary {
  const safeXp = Math.max(0, Math.floor(params.totalCombinedXp));
  const unlockedMilestonesCount = Math.max(
    0,
    Math.floor(params.completedModulesCount) +
      Math.floor(params.unlockedStreakMilestonesCount) +
      Math.floor(params.unlockedTrophiesCount || 0)
  );
  const totalPossibleMilestones = 15; // 8 module badges + 3 streak milestones + 4 rare trophies

  let highestUnlockedIdx = 0;
  for (let i = 0; i < MASTERY_RANK_DEFINITIONS.length; i++) {
    const def = MASTERY_RANK_DEFINITIONS[i];
    if (
      safeXp >= def.minXpRequired &&
      unlockedMilestonesCount >= def.minMilestonesRequired
    ) {
      highestUnlockedIdx = i;
    }
  }

  const tiers: MasteryRankTierSpec[] = MASTERY_RANK_DEFINITIONS.map(
    (def, idx) => ({
      ...def,
      badgeCode: def.rankCode,
      rankTitleEn: def.rankSubtitleEn,
      minXp: def.minXpRequired,
      minMilestones: def.minMilestonesRequired,
      descriptionFa: def.privilegesFa,
      unlocked: idx <= highestUnlockedIdx,
      isCurrentRank: idx === highestUnlockedIdx,
      isCurrent: idx === highestUnlockedIdx,
    })
  );

  const currentRank = tiers[highestUnlockedIdx];
  const nextRank =
    highestUnlockedIdx + 1 < tiers.length
      ? tiers[highestUnlockedIdx + 1]
      : null;

  let xpNeededForNextRank = 0;
  let milestonesNeededForNextRank = 0;
  let progressToNextRankPercent = 100;
  let xpProgressToNextPercent = 100;
  let milestoneProgressToNextPercent = 100;

  if (nextRank) {
    xpNeededForNextRank = Math.max(0, nextRank.minXpRequired - safeXp);
    milestonesNeededForNextRank = Math.max(
      0,
      nextRank.minMilestonesRequired - unlockedMilestonesCount
    );

    const xpSpan = Math.max(
      1,
      nextRank.minXpRequired - currentRank.minXpRequired
    );
    const xpRatio = Math.min(
      1,
      Math.max(0, (safeXp - currentRank.minXpRequired) / xpSpan)
    );
    xpProgressToNextPercent = Math.round(xpRatio * 100);

    const milestoneSpan = Math.max(
      1,
      nextRank.minMilestonesRequired - currentRank.minMilestonesRequired
    );
    const milestoneRatio = Math.min(
      1,
      Math.max(
        0,
        (unlockedMilestonesCount - currentRank.minMilestonesRequired) /
          milestoneSpan
      )
    );
    milestoneProgressToNextPercent = Math.round(milestoneRatio * 100);

    progressToNextRankPercent = Math.min(
      99,
      Math.round((xpRatio * 0.5 + milestoneRatio * 0.5) * 100)
    );
  }

  return {
    currentRank,
    nextRank,
    tiers,
    ranks: tiers,
    accumulatedXp: safeXp,
    totalCombinedXp: safeXp,
    unlockedMilestonesCount,
    totalMilestonesCompleted: unlockedMilestonesCount,
    totalPossibleMilestones,
    xpNeededForNextRank,
    milestonesNeededForNextRank,
    progressToNextRankPercent,
    overallProgressToNextPercent: progressToNextRankPercent,
    xpProgressToNextPercent,
    milestoneProgressToNextPercent,
  };
}

// ============================================================================
// ACADEMY LEADERBOARD & AI WEEKLY RANKING CHALLENGES
// ============================================================================

export type WeeklyChallengeTrackId =
  | 'worktree-orchestration'
  | 'fastmcp-security'
  | 'zero-context-rot';

export interface WeeklyRankingChallengeItem {
  id: string;
  code: string;
  title: string;
  scenarioBrief: string;
  verificationCriterion: string;
  targetArtifactOrPath: string;
  difficulty: 'SPECIALIST' | 'ARCHITECT' | 'PRINCIPAL';
  xpReward: number;
}

export interface AiWeeklyLeaderboardChallengeSuite {
  weekCode: string;
  track: WeeklyChallengeTrackId;
  language: 'fa' | 'en';
  themeHeadline: string;
  aiDirectiveSummary: string;
  challenges: WeeklyRankingChallengeItem[];
  modelUsed: string;
  source: 'ai-live' | 'deterministic-fallback';
}

export interface LeaderboardArchitectEntry {
  architectId: string;
  anonymizedHandle: string;
  strictHandle: string;
  displayHandle: string;
  isCurrentUser: boolean;
  rank: number;
  cumulativeXp: number;
  weeklyXpGain: number;
  completedModulesCount: number;
  streakDays: number;
  challengesSolved: number;
  masteryRankId: MasteryRankId;
  masteryRankCode: string;
  masteryRankNameEn: string;
  masteryRankTitleFa: string;
  accentHex: string;
  specializationBadge: string;
}

export interface AcademyLeaderboardSummary {
  entries: LeaderboardArchitectEntry[];
  currentUserEntry: LeaderboardArchitectEntry;
  topThreePodium: LeaderboardArchitectEntry[];
  cohortTotalXp: number;
  currentUserPercentile: number;
  xpToNextLeaderboardSpot: number;
}

/**
 * Deterministically converts a raw student architect name or email into a
 * privacy-preserving anonymized handle so raw PII is never displayed on the leaderboard.
 */
export function anonymizeArchitectHandle(
  rawName: string,
  architectId: string,
  strictPrivacyMode = false
): string {
  const safeId = (architectId || 'anon').trim().toLowerCase();
  const cleanedRaw = (rawName || 'Architect')
    .replace(/<[^>]*>/g, '')
    .split('@')[0]
    .trim();

  // Compute deterministic 16-bit hex digest from architectId + cleanedRaw
  const seedInput = `${safeId}::${cleanedRaw}`;
  let hash = 0x811c9dc5;
  for (let i = 0; i < seedInput.length; i++) {
    hash ^= seedInput.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  const hexTag = ((hash >>> 0) & 0xffff).toString(16).padStart(4, '0');

  if (strictPrivacyMode) {
    return `zk-node#${hexTag}`;
  }

  const tokens = cleanedRaw
    .split(/[\s._-]+/)
    .map((t) => t.trim())
    .filter((t) => t.length > 0);

  if (tokens.length === 0) {
    return `arch#${hexTag} · A.***`;
  }

  const firstChar = Array.from(tokens[0])[0] || 'A';
  if (tokens.length === 1) {
    return `arch#${hexTag} · ${firstChar.toUpperCase()}.***`;
  }

  const secondChar = Array.from(tokens[tokens.length - 1])[0] || 'X';
  return `arch#${hexTag} · ${firstChar.toUpperCase()}.${secondChar.toUpperCase()}***`;
}

interface SeededPeerArchitect {
  architectId: string;
  rawName: string;
  baseCumulativeXp: number;
  weeklyXpGain: number;
  completedModulesCount: number;
  streakDays: number;
  challengesSolved: number;
  specializationBadge: string;
}

const SEEDED_ACADEMY_PEERS: ReadonlyArray<SeededPeerArchitect> = [
  {
    architectId: 'peer-arch-01',
    rawName: 'Kourosh Rostami',
    baseCumulativeXp: 4480,
    weeklyXpGain: 820,
    completedModulesCount: 8,
    streakDays: 21,
    challengesSolved: 6,
    specializationBadge: 'Git Worktree Commander',
  },
  {
    architectId: 'peer-arch-02',
    rawName: 'Elena Vance',
    baseCumulativeXp: 3960,
    weeklyXpGain: 690,
    completedModulesCount: 8,
    streakDays: 16,
    challengesSolved: 5,
    specializationBadge: 'FastMCP Zero-Trust Lead',
  },
  {
    architectId: 'peer-arch-03',
    rawName: 'Nima Farhadi',
    baseCumulativeXp: 3520,
    weeklyXpGain: 540,
    completedModulesCount: 7,
    streakDays: 14,
    challengesSolved: 4,
    specializationBadge: 'Browser Subagent Auditor',
  },
  {
    architectId: 'peer-arch-04',
    rawName: 'Sora Takahashi',
    baseCumulativeXp: 3080,
    weeklyXpGain: 480,
    completedModulesCount: 6,
    streakDays: 11,
    challengesSolved: 4,
    specializationBadge: 'LSP Supercomplete Specialist',
  },
  {
    architectId: 'peer-arch-05',
    rawName: 'Parnia Alavi',
    baseCumulativeXp: 2640,
    weeklyXpGain: 410,
    completedModulesCount: 5,
    streakDays: 9,
    challengesSolved: 3,
    specializationBadge: 'Glob Rule Strategist',
  },
  {
    architectId: 'peer-arch-06',
    rawName: 'Marcus Lindqvist',
    baseCumulativeXp: 2190,
    weeklyXpGain: 330,
    completedModulesCount: 4,
    streakDays: 7,
    challengesSolved: 2,
    specializationBadge: 'Artifact PR Reviewer',
  },
  {
    architectId: 'peer-arch-07',
    rawName: 'Darya Mohammadi',
    baseCumulativeXp: 1680,
    weeklyXpGain: 260,
    completedModulesCount: 3,
    streakDays: 5,
    challengesSolved: 2,
    specializationBadge: 'Context Hygiene Analyst',
  },
];

function resolveRankSpecForLeaderboardEntry(
  cumulativeXp: number,
  completedModulesCount: number,
  streakDays: number
): MasteryRankTierSpec {
  const streakMilestones =
    streakDays >= 14 ? 3 : streakDays >= 7 ? 2 : streakDays >= 3 ? 1 : 0;
  const standing = calculateMasteryRankStanding({
    totalCombinedXp: cumulativeXp,
    completedModulesCount,
    unlockedStreakMilestonesCount: streakMilestones,
    unlockedTrophiesCount: Math.min(4, Math.floor(completedModulesCount / 2)),
  });
  return standing.currentRank;
}

export function buildAcademyLeaderboardStandings(params: {
  currentArchitectName: string;
  currentArchitectId?: string;
  currentUserCumulativeXp: number;
  currentUserCompletedModules: number;
  currentUserStreakDays: number;
  currentUserChallengesSolved?: number;
  currentUserWeeklyBonusXp?: number;
  strictPrivacyMode?: boolean;
}): AcademyLeaderboardSummary {
  const strictMode = Boolean(params.strictPrivacyMode);
  const userArchId = params.currentArchitectId || 'current-session-architect';
  const safeUserXp = Math.max(0, Math.floor(params.currentUserCumulativeXp));
  const safeUserModules = Math.max(
    0,
    Math.min(8, Math.floor(params.currentUserCompletedModules))
  );
  const safeUserStreak = Math.max(0, Math.floor(params.currentUserStreakDays));
  const safeUserSolved = Math.max(
    0,
    Math.floor(params.currentUserChallengesSolved ?? 0)
  );
  const safeWeeklyBonus = Math.max(
    0,
    Math.floor(params.currentUserWeeklyBonusXp ?? 0)
  );

  const rawRows: Omit<LeaderboardArchitectEntry, 'rank'>[] =
    SEEDED_ACADEMY_PEERS.map((peer) => {
      const rankSpec = resolveRankSpecForLeaderboardEntry(
        peer.baseCumulativeXp,
        peer.completedModulesCount,
        peer.streakDays
      );
      const anonymizedHandle = anonymizeArchitectHandle(
        peer.rawName,
        peer.architectId,
        false
      );
      const strictHandle = anonymizeArchitectHandle(
        peer.rawName,
        peer.architectId,
        true
      );
      return {
        architectId: peer.architectId,
        anonymizedHandle,
        strictHandle,
        displayHandle: strictMode ? strictHandle : anonymizedHandle,
        isCurrentUser: false,
        cumulativeXp: peer.baseCumulativeXp,
        weeklyXpGain: peer.weeklyXpGain,
        completedModulesCount: peer.completedModulesCount,
        streakDays: peer.streakDays,
        challengesSolved: peer.challengesSolved,
        masteryRankId: rankSpec.rankId,
        masteryRankCode: rankSpec.rankCode,
        masteryRankNameEn: rankSpec.rankNameEn,
        masteryRankTitleFa: rankSpec.rankTitleFa,
        accentHex: rankSpec.accentHex,
        specializationBadge: peer.specializationBadge,
      };
    });

  const userRankSpec = resolveRankSpecForLeaderboardEntry(
    safeUserXp,
    safeUserModules,
    safeUserStreak
  );
  const userAnonHandle = anonymizeArchitectHandle(
    params.currentArchitectName || 'Principal Architect',
    userArchId,
    false
  );
  const userStrictHandle = anonymizeArchitectHandle(
    params.currentArchitectName || 'Principal Architect',
    userArchId,
    true
  );

  rawRows.push({
    architectId: userArchId,
    anonymizedHandle: userAnonHandle,
    strictHandle: userStrictHandle,
    displayHandle: strictMode ? userStrictHandle : userAnonHandle,
    isCurrentUser: true,
    cumulativeXp: safeUserXp,
    weeklyXpGain: 320 + safeWeeklyBonus,
    completedModulesCount: safeUserModules,
    streakDays: safeUserStreak,
    challengesSolved: 2 + safeUserSolved,
    masteryRankId: userRankSpec.rankId,
    masteryRankCode: userRankSpec.rankCode,
    masteryRankNameEn: userRankSpec.rankNameEn,
    masteryRankTitleFa: userRankSpec.rankTitleFa,
    accentHex: userRankSpec.accentHex,
    specializationBadge: 'Active Studio Architect',
  });

  rawRows.sort((a, b) => {
    if (b.cumulativeXp !== a.cumulativeXp) {
      return b.cumulativeXp - a.cumulativeXp;
    }
    if (b.completedModulesCount !== a.completedModulesCount) {
      return b.completedModulesCount - a.completedModulesCount;
    }
    if (b.streakDays !== a.streakDays) {
      return b.streakDays - a.streakDays;
    }
    return a.isCurrentUser ? -1 : 1;
  });

  const entries: LeaderboardArchitectEntry[] = rawRows.map((row, index) => ({
    ...row,
    rank: index + 1,
  }));

  const currentUserEntry =
    entries.find((e) => e.isCurrentUser) || entries[entries.length - 1];

  const topThreePodium = entries.slice(0, 3);
  const cohortTotalXp = entries.reduce((acc, e) => acc + e.cumulativeXp, 0);

  const totalParticipants = entries.length;
  const currentUserPercentile = Math.max(
    1,
    Math.min(
      99,
      Math.round(
        ((totalParticipants - currentUserEntry.rank + 1) / totalParticipants) *
          100
      )
    )
  );

  let xpToNextLeaderboardSpot = 0;
  if (currentUserEntry.rank > 1) {
    const aboveEntry = entries[currentUserEntry.rank - 2];
    if (aboveEntry) {
      xpToNextLeaderboardSpot = Math.max(
        10,
        aboveEntry.cumulativeXp - currentUserEntry.cumulativeXp + 10
      );
    }
  }

  return {
    entries,
    currentUserEntry,
    topThreePodium,
    cohortTotalXp,
    currentUserPercentile,
    xpToNextLeaderboardSpot,
  };
}

export function buildWeeklyLeaderboardChallengePrompt(params: {
  track: WeeklyChallengeTrackId;
  language: 'fa' | 'en';
  currentRankNameEn?: string;
  completedModulesCount?: number;
}): string {
  const {
    track,
    language,
    currentRankNameEn = 'Architect',
    completedModulesCount = 4,
  } = params;

  const trackDescriptions: Record<WeeklyChallengeTrackId, string> = {
    'worktree-orchestration':
      'Parallel Multi-Agent Orchestration in isolated Git Worktrees, Mission Control Inbox triage, and zero-conflict branch merges.',
    'fastmcp-security':
      'Zero-Trust FastMCP Server Governance, mcp_config.json schema hardening, read-only database pools, and terminal command policy enforcement.',
    'zero-context-rot':
      'Context Window Hygiene, .agent/knowledge-base/ invariant offloading, Glob-scoped .agent/rules/, and Browser Subagent WebP verification.',
  };

  const langDirective =
    language === 'en'
      ? 'Write all titles, scenario briefs, and verification criteria in clear, technical English.'
      : 'Write all titles, scenario briefs, and verification criteria in fluent Persian (فارسی) while keeping technical identifiers, file paths (.agent/rules/, mcp_config.json, task.md, implementation_plan.md, walkthrough.md), and codes in English.';

  return [
    `Generate 3 weekly ranking engineering challenges for the Google Antigravity Academy Leaderboard.`,
    `Selected Track: ${track} (${trackDescriptions[track]})`,
    `Student Standing: ${currentRankNameEn} (${completedModulesCount}/8 modules mastered).`,
    langDirective,
    `Each challenge must include a code (e.g., WRC-44-01), title, scenarioBrief, verificationCriterion, targetArtifactOrPath, difficulty (SPECIALIST, ARCHITECT, or PRINCIPAL), and xpReward (between 200 and 500).`,
  ].join('\n');
}

export function buildDeterministicWeeklyLeaderboardChallenges(params: {
  track: WeeklyChallengeTrackId;
  language: 'fa' | 'en';
}): AiWeeklyLeaderboardChallengeSuite {
  const { track, language } = params;
  const isEn = language === 'en';

  if (track === 'fastmcp-security') {
    return {
      weekCode: '2026-W44',
      track,
      language,
      themeHeadline: isEn
        ? 'Week 44 Sprint: FastMCP Zero-Trust Perimeter & Terminal Guardrails'
        : 'اسپرینت هفته ۴۴: حصار امنیتی Zero-Trust در FastMCP و گاردریل‌های ترمینال',
      aiDirectiveSummary: isEn
        ? 'AI Challenge Agent synthesized 3 high-signal security audits targeting mcp_config.json transport isolation, read-only SQL pools, and Glob-scoped rule enforcement.'
        : 'ایجنت طراح چالش، ۳ ممیزی امنیتی پیشرفته با محوریت ایزولاسیون ترنسپورت در mcp_config.json، استخرهای دیتابیس Read-Only و قوانین Glob-scoped تولید کرده است.',
      challenges: [
        {
          id: 'wrc-fastmcp-1',
          code: 'WRC-44-01',
          title: isEn
            ? 'Enforce Read-Only Transaction Pool in FastMCP Server'
            : 'اعمال استخر تراکنش Read-Only در سرور FastMCP',
          scenarioBrief: isEn
            ? 'Prevent autonomous background agents from executing DDL/DML mutations via the PostgreSQL telemetry MCP server.'
            : 'جلوگیری از اجرای دستورات تغییر ساختار یا داده (DDL/DML) توسط ایجنت‌های پس‌زمینه در سرور تله‌متری PostgreSQL MCP.',
          verificationCriterion: isEn
            ? 'Verify default_transaction_read_only=on in mcp_config.json and @mcp.tool() decorator guardrails.'
            : 'صحت‌سنجی پارامتر default_transaction_read_only=on در فایل mcp_config.json و گاردریل دکوراتور @mcp.tool().',
          targetArtifactOrPath: 'mcp_config.json',
          difficulty: 'SPECIALIST',
          xpReward: 250,
        },
        {
          id: 'wrc-fastmcp-2',
          code: 'WRC-44-02',
          title: isEn
            ? 'Lock Destructive Shell Flags via Terminal Policy Deny-List'
            : 'مسدودسازی فلگ‌های مخرب شل در Deny-List سیاست ترمینال',
          scenarioBrief: isEn
            ? 'Configure Auto terminal execution policy while intercepting force-push, raw rm -rf, and unreviewed migration drops.'
            : 'تنظیم سیاست اجرای ترمینال روی حالت Auto همراه با رهگیری و مسدودسازی دستورات force-push، حذف بازگشتی و drop مایگریشن.',
          verificationCriterion: isEn
            ? 'Audit .agent/rules/security-governance.md with Always On activation and explicit command deny patterns.'
            : 'ممیزی فایل .agent/rules/security-governance.md با حالت فعال‌سازی Always On و الگوهای مسدودسازی صریح.',
          targetArtifactOrPath: '.agent/rules/security-governance.md',
          difficulty: 'ARCHITECT',
          xpReward: 350,
        },
        {
          id: 'wrc-fastmcp-3',
          code: 'WRC-44-03',
          title: isEn
            ? 'Zero-Trust SSE Gateway Token Rotation & Schema Pinning'
            : 'چرخش توکن درگاه SSE Zero-Trust و تثبیت اسکیما (Schema Pinning)',
          scenarioBrief: isEn
            ? 'Eliminate configuration drift between local stdio development and remote SSE production MCP endpoints.'
            : 'حذف انحراف پیکربندی (Configuration Drift) میان محیط توسعه محلی stdio و درگاه عملیاتی راه دور SSE در سرورهای MCP.',
          verificationCriterion: isEn
            ? 'Validate pinned tool schema digests in implementation_plan.md before agent tool invocation.'
            : 'اعتبارسنجی هش اسکیماهای ابزار در implementation_plan.md پیش از فراخوانی ابزار توسط ایجنت.',
          targetArtifactOrPath: 'implementation_plan.md',
          difficulty: 'PRINCIPAL',
          xpReward: 450,
        },
      ],
      modelUsed: 'gemini-3.8-flash',
      source: 'deterministic-fallback',
    };
  }

  if (track === 'zero-context-rot') {
    return {
      weekCode: '2026-W44',
      track,
      language,
      themeHeadline: isEn
        ? 'Week 44 Sprint: Zero Context Rot & Knowledge Base Distillation'
        : 'اسپرینت هفته ۴۴: مهار کامل Context Rot و تقطیر پایگاه دانش',
      aiDirectiveSummary: isEn
        ? 'AI Challenge Agent generated 3 context-efficiency challenges focused on pruning stale AST dumps, scoping rules via Glob, and compacting long-horizon sessions.'
        : 'ایجنت هوش مصنوعی ۳ چالش بهینه‌سازی پنجره زمینه با تمرکز بر حذف لاگ‌های منسوخ، محدودسازی قوانین با Glob و فشرده‌سازی نشست‌های طولانی تولید کرد.',
      challenges: [
        {
          id: 'wrc-rot-1',
          code: 'WRC-44-01',
          title: isEn
            ? 'Convert Global Domain Rules to Scoped Glob Activation'
            : 'تبدیل قوانین سراسری دامنه به حالت فعال‌سازی هدفمند Glob',
          scenarioBrief: isEn
            ? 'Reduce baseline token overhead by ensuring database migration rules only load when editing SQLAlchemy or Alembic files.'
            : 'کاهش مصرف پایه توکن با محدود کردن بارگذاری قوانین مایگریشن دیتابیس صرفاً هنگام ویرایش فایل‌های SQLAlchemy یا Alembic.',
          verificationCriterion: isEn
            ? 'Set activation: glob with pattern alembic/versions/*.py in .agent/rules/db-migrations.md.'
            : 'تنظیم هدر activation: glob با الگوی alembic/versions/*.py در فایل .agent/rules/db-migrations.md.',
          targetArtifactOrPath: '.agent/rules/db-migrations.md',
          difficulty: 'SPECIALIST',
          xpReward: 250,
        },
        {
          id: 'wrc-rot-2',
          code: 'WRC-44-02',
          title: isEn
            ? 'Prune Stale Monolith Snapshots from .agent/knowledge-base/'
            : 'پاک‌سازی اسنپ‌شات‌های منسوخ از مسیر .agent/knowledge-base/',
          scenarioBrief: isEn
            ? 'Identify and archive knowledge base entries with >65% staleness score before they trigger hallucinated tool calls.'
            : 'شناسایی و آرشیو اسناد دارای شاخص فرسودگی بالای ۶۵٪ در پایگاه دانش پیش از ایجاد خطای تصمیم‌گیری در ایجنت.',
          verificationCriterion: isEn
            ? 'Distill core invariants into a <350-token architectural summary in .agent/knowledge-base/core-invariants.md.'
            : 'تقطیر قواعد کلیدی معماری در یک خلاصه زیر ۳۵۰ توکن درون فایل .agent/knowledge-base/core-invariants.md.',
          targetArtifactOrPath: '.agent/knowledge-base/core-invariants.md',
          difficulty: 'ARCHITECT',
          xpReward: 350,
        },
        {
          id: 'wrc-rot-3',
          code: 'WRC-44-03',
          title: isEn
            ? 'Checkpoint State Handoff via task.md & walkthrough.md'
            : 'انتقال وضعیت بدون افت حافظه با آرتیفکت‌های task.md و walkthrough.md',
          scenarioBrief: isEn
            ? 'Terminate a bloated 90k-token debugging thread and bootstrap a fresh agent using only structured artifact state.'
            : 'بستن نشست دیباگ متورم ۹۰ هزار توکنی و راه‌اندازی ایجنت تازه صرفاً با تکیه بر وضعیت ساختاریافته آرتیفکت‌ها.',
          verificationCriterion: isEn
            ? 'Verify 100% task continuity in fresh Agent Manager session with <12% context utilization.'
            : 'صحت‌سنجی تداوم ۱۰۰٪ تسک در نشست جدید Agent Manager با اشغال کمتر از ۱۲٪ پنجره زمینه.',
          targetArtifactOrPath: 'task.md',
          difficulty: 'PRINCIPAL',
          xpReward: 450,
        },
      ],
      modelUsed: 'gemini-3.8-flash',
      source: 'deterministic-fallback',
    };
  }

  // Default: 'worktree-orchestration'
  return {
    weekCode: '2026-W44',
    track: 'worktree-orchestration',
    language,
    themeHeadline: isEn
      ? 'Week 44 Sprint: Multi-Agent Git Worktree Orchestration & PR Review'
      : 'اسپرینت هفته ۴۴: ارکستریشن چندایجنتی در Git Worktrees و ممیزی PR-Style',
    aiDirectiveSummary: isEn
      ? 'AI Challenge Agent curated 3 Principal-grade orchestration missions testing parallel worktree isolation, PR-style plan review, and Browser Subagent WebP proof capture.'
      : 'ایجنت هوش مصنوعی ۳ مأموریت ارکستریشن در سطح Principal شامل ایزولاسیون Git Worktree، ممیزی PR-Style روی طرح پیاده‌سازی و ثبت مدرک بصری WebP طراحی کرده است.',
    challenges: [
      {
        id: 'wrc-worktree-1',
        code: 'WRC-44-01',
        title: isEn
          ? 'Inline PR-Style Audit on implementation_plan.md Before Codegen'
          : 'ممیزی خطی PR-Style روی implementation_plan.md پیش از تولید کد',
        scenarioBrief: isEn
          ? 'Intercept an agent plan that mutates API contracts without updating Pydantic v2 schemas and steer it via inline comments.'
          : 'رهگیری طرح ایجنت که قرارداد API را بدون به‌روزرسانی اسکیمای Pydantic v2 تغییر می‌دهد و اصلاح مسیر آن با کامنت خطی.',
        verificationCriterion: isEn
          ? 'Attach 2 inline review directives on implementation_plan.md in Planning Mode prior to approval.'
          : 'ثبت ۲ دستور بازنگری خطی روی فایل implementation_plan.md در حالت Planning Mode پیش از تایید نهایی.',
        targetArtifactOrPath: 'implementation_plan.md',
        difficulty: 'SPECIALIST',
        xpReward: 250,
      },
      {
        id: 'wrc-worktree-2',
        code: 'WRC-44-02',
        title: isEn
          ? 'Spawn 3 Parallel Agents Across Isolated Git Worktrees'
          : 'اجرای همزمان ۳ ایجنت موازی روی Git Worktreeهای ایزوله',
        scenarioBrief: isEn
          ? 'Run schema migration, FastAPI router refactoring, and Playwright E2E verification simultaneously without index.lock collisions.'
          : 'اجرای موازی مایگریشن اسکیما، بازآرایی روتر FastAPI و تست Playwright بدون تداخل فایل‌های قفل گیت (index.lock).',
        verificationCriterion: isEn
          ? 'Verify clean worktree branch merge and zero file-tree conflicts in Mission Control Inbox.'
          : 'صحت‌سنجی ادغام تمیز شاخه‌های Worktree و عدم تداخل درخت فایل در صندوق ورودی Mission Control.',
        targetArtifactOrPath: '.agent/workflows/parallel-worktrees.md',
        difficulty: 'ARCHITECT',
        xpReward: 350,
      },
      {
        id: 'wrc-worktree-3',
        code: 'WRC-44-03',
        title: isEn
          ? 'Automated Browser Subagent DOM Audit & walkthrough.md WebP Proof'
          : 'ممیزی خودکار DOM با Browser Subagent و ثبت مدرک WebP در walkthrough.md',
        scenarioBrief: isEn
          ? 'Dispatch the headless Browser Subagent to verify zero console errors and embed visual WebP recordings in walkthrough.md.'
          : 'اعزام Browser Subagent برای تایید نبود خطای کنسول و الصاق ویدیوی WebP صحت‌سنجی در آرتیفکت walkthrough.md.',
        verificationCriterion: isEn
          ? 'Confirm walkthrough.md contains verified DOM assertions and embedded WebP replay artifact.'
          : 'تایید وجود گزارش صحت‌سنجی DOM و آرتیفکت تصویری WebP درون فایل walkthrough.md.',
        targetArtifactOrPath: 'walkthrough.md',
        difficulty: 'PRINCIPAL',
        xpReward: 450,
      },
    ],
    modelUsed: 'gemini-3.8-flash',
    source: 'deterministic-fallback',
  };
}

export function normalizeAiWeeklyLeaderboardChallengesResponse(
  raw: unknown,
  fallback: AiWeeklyLeaderboardChallengeSuite
): AiWeeklyLeaderboardChallengeSuite {
  if (!raw || typeof raw !== 'object') {
    return fallback;
  }

  const candidate = raw as Record<string, unknown>;
  const themeHeadline =
    typeof candidate.themeHeadline === 'string' &&
    candidate.themeHeadline.trim().length > 5
      ? candidate.themeHeadline.trim()
      : fallback.themeHeadline;

  const aiDirectiveSummary =
    typeof candidate.aiDirectiveSummary === 'string' &&
    candidate.aiDirectiveSummary.trim().length > 10
      ? candidate.aiDirectiveSummary.trim()
      : fallback.aiDirectiveSummary;

  const rawChallenges = Array.isArray(candidate.challenges)
    ? candidate.challenges
    : [];

  const validDifficulties = new Set(['SPECIALIST', 'ARCHITECT', 'PRINCIPAL']);

  const normalizedChallenges: WeeklyRankingChallengeItem[] = rawChallenges
    .filter((item): item is Record<string, unknown> =>
      Boolean(item && typeof item === 'object')
    )
    .slice(0, 4)
    .map((item, idx) => {
      const fbItem =
        fallback.challenges[idx % fallback.challenges.length] ||
        fallback.challenges[0];
      const rawDiff = String(item.difficulty || '')
        .trim()
        .toUpperCase();
      const difficulty = validDifficulties.has(rawDiff)
        ? (rawDiff as 'SPECIALIST' | 'ARCHITECT' | 'PRINCIPAL')
        : fbItem.difficulty;

      const numericXp = Number(item.xpReward);
      const xpReward =
        Number.isFinite(numericXp) && numericXp >= 100 && numericXp <= 1000
          ? Math.round(numericXp)
          : fbItem.xpReward;

      return {
        id:
          typeof item.id === 'string' && item.id.trim()
            ? item.id.trim()
            : `${fallback.track}-ai-${idx + 1}`,
        code:
          typeof item.code === 'string' && item.code.trim()
            ? item.code.trim()
            : `WRC-44-0${idx + 1}`,
        title:
          typeof item.title === 'string' && item.title.trim().length > 3
            ? item.title.trim()
            : fbItem.title,
        scenarioBrief:
          typeof item.scenarioBrief === 'string' &&
          item.scenarioBrief.trim().length > 5
            ? item.scenarioBrief.trim()
            : fbItem.scenarioBrief,
        verificationCriterion:
          typeof item.verificationCriterion === 'string' &&
          item.verificationCriterion.trim().length > 5
            ? item.verificationCriterion.trim()
            : fbItem.verificationCriterion,
        targetArtifactOrPath:
          typeof item.targetArtifactOrPath === 'string' &&
          item.targetArtifactOrPath.trim().length > 1
            ? item.targetArtifactOrPath.trim()
            : fbItem.targetArtifactOrPath,
        difficulty,
        xpReward,
      };
    });

  if (normalizedChallenges.length < 2) {
    return {
      ...fallback,
      themeHeadline,
      aiDirectiveSummary,
      source:
        candidate.source === 'ai-live' ? 'ai-live' : fallback.source,
    };
  }

  return {
    weekCode:
      typeof candidate.weekCode === 'string' && candidate.weekCode.trim()
        ? candidate.weekCode.trim()
        : fallback.weekCode,
    track: fallback.track,
    language: fallback.language,
    themeHeadline,
    aiDirectiveSummary,
    challenges: normalizedChallenges,
    modelUsed:
      typeof candidate.modelUsed === 'string' && candidate.modelUsed.trim()
        ? candidate.modelUsed.trim()
        : fallback.modelUsed,
    source:
      candidate.source === 'ai-live' ? 'ai-live' : fallback.source,
  };
}
