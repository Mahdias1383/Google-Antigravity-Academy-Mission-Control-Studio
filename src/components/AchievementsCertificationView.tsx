import React, { useState, useEffect, useRef, useMemo } from 'react';
import * as d3 from 'd3';
import {
  Flame,
  Share2,
  Check,
  Copy,
  CheckCircle2,
  Lock,
  PlusCircle,
  UserCheck,
  Calendar,
  ArrowUpRight,
  Timer,
  Play,
  Pause,
  RotateCcw,
  Target,
  BarChart3,
  Trash2,
  Zap,
  Trophy,
  Cpu,
  BookOpen,
  Crown,
  ShieldCheck,
  Cloud,
  LogIn,
  LogOut,
  RefreshCw,
  Link2,
  ExternalLink,
  Globe,
  Send,
  MessageCircle,
  Eye,
  X,
} from 'lucide-react';
import type { User } from 'firebase/auth';
import {
  signInWithGooglePopup,
  signOutArchitect,
  subscribeToAuthChanges,
  syncArchitectProgressToCloud,
  loadArchitectProgressFromCloud,
} from '../lib/firebase';
import { CurriculumModule } from '../types/curriculum';
import { AcademyLeaderboard } from './AcademyLeaderboard';
import {
  StudySessionDay,
  DailyStudyGoalItem,
  StudioUsageItem,
  SharedMasteryProgressCardSnapshot,
  HeatmapActivitySource,
  HeatmapDayCell,
  calculateCertificationMetrics,
  calculateStreakSummary,
  calculateWeeklyPlannerMetrics,
  calculateXpAndLevelProgression,
  calculateTrophyCaseStatus,
  formatActiveTimerDisplay,
  formatShareableReportCardText,
  buildShareableProgressCardBundle,
  parseSharedProgressCardFromQuery,
  buildStudyStreakHeatmapData,
  DAILY_STREAK_STORAGE_KEY,
  evaluateDailyStreakMilestones,
  serializeDailyStreakStateToStorage,
  parseDailyStreakStateFromStorage,
  calculateMasteryRankStanding,
} from '../utils/achievements';
import {
  ExportSectionPdfButton,
  PrintableDocumentPayload,
} from './CodeAndPdfTools';
import { useLanguage } from '../context/LanguageContext';
import {
  XP_MILESTONES_STORAGE_KEY,
  XP_MILESTONE_THRESHOLDS,
  getStoredReachedXpMilestones,
  buildMilestoneTimelineHistory,
  syncReachedMilestonesWithCurrentXp,
  MilestoneHistoryEntry,
} from '../utils/generators';

const DAY_LABEL_EN_MAP: Record<string, string> = {
  'یکشنبه': 'Sun',
  'دوشنبه': 'Mon',
  'سه‌شنبه': 'Tue',
  'چهارشنبه': 'Wed',
  'پنج‌شنبه': 'Thu',
  'جمعه': 'Fri',
  'شنبه': 'Sat',
  'امروز (سه‌شنبه)': 'Today (Tue)',
  'امروز': 'Today',
};

function translateDayLabel(labelFa: string, language: 'fa' | 'en'): string {
  if (language === 'fa') return labelFa;
  return DAY_LABEL_EN_MAP[labelFa] || labelFa;
}

const GOAL_TITLE_EN_MAP: Record<string, string> = {
  'goal-1': 'Audit Artifact architecture & test PR-Style Review on implementation_plan.md',
  'goal-2': 'Author & test .agent/rules/backend-sqlalchemy.md with Glob activation',
  'goal-3': 'Implement FastMCP server with @mcp.tool() decorator for Read-Only query',
};

const RANK_DESC_EN_MAP: Record<string, string> = {
  trainee:
    'Foundational familiarity with dual Editor View & Agent Manager architecture, Supercomplete, and core Artifact lifecycle.',
  specialist:
    'Mastery of PR-Style review on implementation_plan.md, terminal governance policies, and authoring .agent/rules guardrails.',
  architect:
    'Architecting // turbo pipelines, inspecting Browser Subagent telemetry, and building secure FastMCP tool servers.',
  principal:
    'Commanding multi-agent orchestration in isolated Git Worktrees, eliminating Context Rot, and holding Principal certification.',
};

const STREAK_DESC_EN_MAP: Record<number, string> = {
  7: '7 consecutive days of uninterrupted study and hands-on practice across Antigravity architecture modules and studios.',
  30: '30 consecutive days of engineering consistency, artifact auditing, and autonomous pipeline mastery.',
  100: '100 days of absolute consistency in agentic systems engineering, zero Context Rot, and technical leadership.',
};

const TROPHY_DESC_EN_MAP: Record<string, string> = {
  'trophy-omni-mastery':
    'Awarded to architects who have completed all 8 specialized modules of Google Antigravity Academy with 100% mastery.',
  'scenario-zero-downtime-alembic':
    'Completed the high-traffic database migration scenario using Expand-and-Contract strategy and // turbo pipeline.',
  'scenario-worktree-isolation':
    'Prevented working tree conflicts and executed 3 independent parallel agents on isolated Git Worktree branches in Mission Control.',
  'scenario-fastmcp-security':
    'Implemented an isolated FastMCP server with Read-Only transactions and blocked destructive commands in the terminal deny-list.',
  'scenario-browser-subagent-e2e':
    'Used the Browser Subagent to automatically trace console and network errors and record WebP video proof in walkthrough.md.',
};

const INITIAL_STUDY_DAYS: StudySessionDay[] = [
  { dateIso: '2026-10-21', dayLabelFa: 'چهارشنبه', minutesStudied: 35, modulesTouched: 1, active: true },
  { dateIso: '2026-10-22', dayLabelFa: 'پنج‌شنبه', minutesStudied: 45, modulesTouched: 2, active: true },
  { dateIso: '2026-10-23', dayLabelFa: 'جمعه', minutesStudied: 20, modulesTouched: 1, active: true },
  { dateIso: '2026-10-24', dayLabelFa: 'شنبه', minutesStudied: 50, modulesTouched: 2, active: true },
  { dateIso: '2026-10-25', dayLabelFa: 'یکشنبه', minutesStudied: 55, modulesTouched: 2, active: true },
  { dateIso: '2026-10-26', dayLabelFa: 'دوشنبه', minutesStudied: 35, modulesTouched: 1, active: true },
  { dateIso: '2026-10-27', dayLabelFa: 'امروز (سه‌شنبه)', minutesStudied: 45, modulesTouched: 2, active: true },
];

const INITIAL_DAILY_GOALS: DailyStudyGoalItem[] = [
  {
    id: 'goal-1',
    titleFa: 'بازبینی معماری آرتیفکت‌ها و تست PR-Style Review روی implementation_plan.md',
    moduleRef: 'Module 2 · Artifact-Driven Engineering',
    targetMinutes: 20,
    completed: true,
  },
  {
    id: 'goal-2',
    titleFa: 'طراحی و تست فایل قانون .agent/rules/backend-sqlalchemy.md با حالت Glob',
    moduleRef: 'Module 4 · Context Engineering & Rules',
    targetMinutes: 15,
    completed: false,
  },
  {
    id: 'goal-3',
    titleFa: 'پیاده‌سازی سرور FastMCP با دکوراتور @mcp.tool() برای کوئری Read-Only',
    moduleRef: 'Module 7 · Enterprise MCP',
    targetMinutes: 25,
    completed: false,
  },
];

const INITIAL_STUDIO_USAGE: StudioUsageItem[] = [
  {
    studioId: 'mission-control-sim',
    titleFa: 'شبیه‌ساز زنده Mission Control و ممیزی آرتیفکت',
    titleEn: 'Mission Control & PR Review Simulator',
    xpPerAction: 100,
    actionsLogged: 2,
  },
  {
    studioId: 'guardrail-workflow-studio',
    titleFa: 'استودیوی ساخت قوانین .agent/rules و پایپ‌لاین // turbo',
    titleEn: 'Rule & Workflow Guardrail Studio',
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

export const AchievementsCertificationView: React.FC<{
  allModules: CurriculumModule[];
  completedModules: string[];
  onToggleModuleComplete: (moduleId: string) => void;
  onCompleteAllModules: () => void;
  onNavigateToModule: (moduleId: string) => void;
  onExportPdf: (payload: PrintableDocumentPayload) => void;
}> = ({
  allModules,
  completedModules,
  onToggleModuleComplete,
  onCompleteAllModules,
  onNavigateToModule,
  onExportPdf,
}) => {
  const { language } = useLanguage();
  const [architectName, setArchitectName] = useState<string>('آریا رستمی (Aria Rostami)');
  const displayArchitectName =
    language === 'en' && architectName === 'آریا رستمی (Aria Rostami)'
      ? 'Aria Rostami'
      : architectName;
  const [roleTitle, setRoleTitle] = useState<string>('Principal AI Systems Architect');
  const [organization, setOrganization] = useState<string>('Enterprise Cloud Engineering');
  const [initialPersistedStreak] = useState(() => {
    if (typeof window === 'undefined') {
      return parseDailyStreakStateFromStorage(null, INITIAL_STUDY_DAYS);
    }
    return parseDailyStreakStateFromStorage(
      window.localStorage.getItem(DAILY_STREAK_STORAGE_KEY),
      INITIAL_STUDY_DAYS
    );
  });
  const [studyDays, setStudyDays] = useState<StudySessionDay[]>(
    initialPersistedStreak.studyDays
  );
  const [persistedStreakDays, setPersistedStreakDays] = useState<number>(
    initialPersistedStreak.currentStreakDays
  );
  const [longestStreakDaysRecord, setLongestStreakDaysRecord] = useState<number>(
    initialPersistedStreak.longestStreakDays
  );
  const [sessionMinutesInput, setSessionMinutesInput] = useState<number>(30);
  const [copiedReportState, setCopiedReportState] = useState<'none' | 'text' | 'link'>('none');

  // Daily Study Planner State
  const [dailyTargetMinutes, setDailyTargetMinutes] = useState<number>(45);
  const [dailyGoals, setDailyGoals] = useState<DailyStudyGoalItem[]>(INITIAL_DAILY_GOALS);
  const [newGoalTitle, setNewGoalTitle] = useState<string>('');
  const [newGoalModuleRef, setNewGoalModuleRef] = useState<string>('Module 8 · Multi-Agent Worktrees');
  const [newGoalMinutes, setNewGoalMinutes] = useState<number>(20);

  // Active Session Timer State
  const [timerRunning, setTimerRunning] = useState<boolean>(false);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(900); // 15:00 default ready session

  // Interactive Studio Usage State (for XP & Level System)
  const [studioUsageItems, setStudioUsageItems] = useState<StudioUsageItem[]>(INITIAL_STUDIO_USAGE);

  // Completed High-Difficulty Mission Scenarios State (for Trophy Case)
  const [completedScenarioIds, setCompletedScenarioIds] = useState<string[]>([
    'scenario-zero-downtime-alembic',
    'scenario-fastmcp-security',
  ]);

  // AI Weekly Ranking Challenges State (for Academy Leaderboard)
  const [completedWeeklyChallenges, setCompletedWeeklyChallenges] = useState<
    Record<string, number>
  >({});

  const handleToggleWeeklyChallengeComplete = (
    challengeId: string,
    xpReward: number
  ) => {
    setCompletedWeeklyChallenges((prev) => {
      const next = { ...prev };
      if (challengeId in next) {
        delete next[challengeId];
      } else {
        next[challengeId] = xpReward;
      }
      return next;
    });
  };

  const completedWeeklyChallengeIds = Object.keys(completedWeeklyChallenges);
  const weeklyChallengeBonusXp = Object.values(completedWeeklyChallenges).reduce(
    (sum, val) => sum + val,
    0
  );

  // Firebase Auth & Cloud Firestore Sync State
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [cloudSyncStatus, setCloudSyncStatus] = useState<'idle' | 'syncing' | 'synced' | 'error'>('idle');
  const [cloudSyncMessage, setCloudSyncMessage] = useState<string>('');

  // Public Mastery Progress Card & Social Share State
  const [sharedCardPreview, setSharedCardPreview] =
    useState<SharedMasteryProgressCardSnapshot | null>(() => {
      if (typeof window === 'undefined') return null;
      return parseSharedProgressCardFromQuery(window.location.search);
    });
  const [publicLinkStatus, setPublicLinkStatus] = useState<
    'idle' | 'generated' | 'copied' | 'shared'
  >('idle');

  // D3.js Calendar Heatmap State
  const heatmapSvgRef = useRef<SVGSVGElement | null>(null);
  const [heatmapWeeksCount, setHeatmapWeeksCount] = useState<12 | 24>(12);
  const [heatmapFilterSource, setHeatmapFilterSource] = useState<
    'all' | HeatmapActivitySource
  >('all');
  const [selectedHeatmapDateIso, setSelectedHeatmapDateIso] =
    useState<string>('2026-10-27');
  const [heatmapOverrides, setHeatmapOverrides] = useState<
    Record<string, { active: boolean; minutesStudied: number; studioRuns: number }>
  >({});

  // Reached XP Milestones State (synced from storage key ag_reached_xp_milestones_v1)
  const [reachedMilestones, setReachedMilestones] = useState<number[]>(() => {
    return getStoredReachedXpMilestones();
  });
  const [milestoneFilter, setMilestoneFilter] = useState<'all' | 'unlocked' | 'locked'>('all');

  useEffect(() => {
    const handleStorageChange = () => {
      setReachedMilestones(getStoredReachedXpMilestones());
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const handleRefreshMilestonesFromStorage = () => {
    setReachedMilestones(getStoredReachedXpMilestones());
  };

  useEffect(() => {
    const unsubscribe = subscribeToAuthChanges(async (user) => {
      setFirebaseUser(user);
      if (user) {
        try {
          setCloudSyncStatus('syncing');
          const saved = await loadArchitectProgressFromCloud(user.uid);
          if (saved) {
            setArchitectName(saved.architectName);
            setRoleTitle(saved.roleTitle);
            setOrganization(saved.organization);
            setCompletedScenarioIds(saved.completedScenarioIds);
            setDailyTargetMinutes(saved.dailyTargetMinutes);
            setCloudSyncStatus('synced');
            setCloudSyncMessage(
              language === 'en'
                ? 'Report card restored from Cloud Firestore'
                : 'اطلاعات کارنامه از پایگاه داده ابری بازیابی شد (Loaded from Firestore)'
            );
          } else {
            if (user.displayName) {
              setArchitectName(user.displayName);
            }
            setCloudSyncStatus('idle');
            setCloudSyncMessage(
              language === 'en'
                ? 'Ready to save your first report card to Firestore'
                : 'آماده ذخیره اولین نسخه کارنامه در Firestore'
            );
          }
        } catch {
          setCloudSyncStatus('error');
          setCloudSyncMessage(
            language === 'en'
              ? 'Error loading cloud data'
              : 'خطا در بازیابی اطلاعات ابری'
          );
        }
      } else {
        setCloudSyncStatus('idle');
        setCloudSyncMessage('');
      }
    });
    return () => unsubscribe();
  }, [language]);

  useEffect(() => {
    if (!timerRunning) return;
    const interval = window.setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => window.clearInterval(interval);
  }, [timerRunning]);

  const metrics = calculateCertificationMetrics(allModules, completedModules, displayArchitectName);
  const rawStripStreakStats = calculateStreakSummary(studyDays);
  const effectiveCurrentStreak = Math.max(
    0,
    persistedStreakDays
  );
  const effectiveLongestStreak = Math.max(
    effectiveCurrentStreak,
    longestStreakDaysRecord,
    rawStripStreakStats.longestStreakDays
  );
  const streakStats = {
    ...rawStripStreakStats,
    currentStreakDays: effectiveCurrentStreak,
    longestStreakDays: effectiveLongestStreak,
  };
  const streakMilestoneEval = evaluateDailyStreakMilestones(
    streakStats.currentStreakDays,
    streakStats.longestStreakDays
  );

  // Persist daily streak counter and study days to localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const lastDate =
        studyDays.length > 0
          ? studyDays[studyDays.length - 1].dateIso
          : '2026-10-27';
      const serialized = serializeDailyStreakStateToStorage({
        currentStreakDays: streakStats.currentStreakDays,
        longestStreakDays: streakStats.longestStreakDays,
        lastLoggedDateIso: lastDate,
        studyDays,
      });
      window.localStorage.setItem(DAILY_STREAK_STORAGE_KEY, serialized);
    } catch {
      // Ignore storage quota errors in restricted frames
    }
  }, [
    studyDays,
    streakStats.currentStreakDays,
    streakStats.longestStreakDays,
  ]);

  const plannerAnalytics = calculateWeeklyPlannerMetrics(studyDays, dailyTargetMinutes);
  const trophyCase = calculateTrophyCaseStatus(
    metrics.completedCount,
    metrics.totalModules,
    completedScenarioIds
  );
  const baseProgressionWithoutWeeklyChallenges = calculateXpAndLevelProgression(
    metrics.totalXp + trophyCase.trophyBonusXp + streakMilestoneEval.totalMilestoneBonusXp,
    streakStats.totalMinutesStudied,
    studioUsageItems
  );
  const xpProgression = calculateXpAndLevelProgression(
    metrics.totalXp +
      trophyCase.trophyBonusXp +
      streakMilestoneEval.totalMilestoneBonusXp +
      weeklyChallengeBonusXp,
    streakStats.totalMinutesStudied,
    studioUsageItems
  );
  const masteryRankStanding = calculateMasteryRankStanding({
    totalCombinedXp: xpProgression.totalCombinedXp,
    completedModulesCount: metrics.completedCount,
    unlockedStreakMilestonesCount: streakMilestoneEval.unlockedMilestoneCount,
    unlockedTrophiesCount: trophyCase.unlockedCount,
  });

  const timelineMilestones = useMemo(() => {
    let activeTotalXp = xpProgression.totalCombinedXp;
    try {
      const stored = localStorage.getItem('ag_user_xp');
      if (stored && !isNaN(parseInt(stored, 10))) {
        activeTotalXp = Math.max(activeTotalXp, parseInt(stored, 10));
      }
    } catch {}

    const entries = buildMilestoneTimelineHistory(activeTotalXp, reachedMilestones);
    if (milestoneFilter === 'unlocked') {
      return entries.filter((m) => m.isUnlocked);
    }
    if (milestoneFilter === 'locked') {
      return entries.filter((m) => !m.isUnlocked);
    }
    return entries;
  }, [xpProgression.totalCombinedXp, reachedMilestones, milestoneFilter]);

  const unlockedMilestonesCount = useMemo(() => {
    let activeTotalXp = xpProgression.totalCombinedXp;
    try {
      const stored = localStorage.getItem('ag_user_xp');
      if (stored && !isNaN(parseInt(stored, 10))) {
        activeTotalXp = Math.max(activeTotalXp, parseInt(stored, 10));
      }
    } catch {}
    return buildMilestoneTimelineHistory(activeTotalXp, reachedMilestones).filter((m) => m.isUnlocked).length;
  }, [xpProgression.totalCombinedXp, reachedMilestones]);
  const heatmapSummary = buildStudyStreakHeatmapData(
    studyDays,
    studioUsageItems,
    heatmapWeeksCount,
    heatmapOverrides
  );
  const selectedHeatmapCell: HeatmapDayCell =
    heatmapSummary.cells.find((c) => c.dateIso === selectedHeatmapDateIso) ||
    heatmapSummary.cells[heatmapSummary.cells.length - 1];

  const handleSetHeatmapCellMode = (
    cell: HeatmapDayCell,
    mode: HeatmapActivitySource
  ) => {
    const nextConfig =
      mode === 'both'
        ? { active: true, minutesStudied: 60, studioRuns: 3 }
        : mode === 'academy'
        ? { active: true, minutesStudied: 50, studioRuns: 0 }
        : mode === 'studios'
        ? { active: true, minutesStudied: 0, studioRuns: 4 }
        : { active: false, minutesStudied: 0, studioRuns: 0 };

    setHeatmapOverrides((prev) => ({
      ...prev,
      [cell.dateIso]: nextConfig,
    }));

    // Synchronize with recent 7-day strip if date matches
    if (studyDays.some((d) => d.dateIso === cell.dateIso)) {
      setStudyDays((prev) =>
        prev.map((d) =>
          d.dateIso === cell.dateIso
            ? {
                ...d,
                active: nextConfig.active,
                minutesStudied:
                  nextConfig.minutesStudied > 0
                    ? nextConfig.minutesStudied
                    : nextConfig.studioRuns * 10,
                modulesTouched: nextConfig.minutesStudied > 0 ? 2 : 0,
              }
            : d
        )
      );
    }
  };

  const handleToggleHeatmapCellActivity = (cell: HeatmapDayCell) => {
    handleSetHeatmapCellMode(cell, cell.active ? 'none' : 'both');
  };

  // D3.js Calendar Heatmap Renderer Effect
  useEffect(() => {
    const svgEl = heatmapSvgRef.current;
    if (!svgEl) return;

    const svg = d3.select(svgEl);
    svg.selectAll('*').remove();

    const margin = { top: 24, right: 16, bottom: 12, left: 42 };
    const cellSize = 20;
    const cellGap = 5;
    const totalWeeks = heatmapSummary.totalWeeks;
    const innerWidth = totalWeeks * (cellSize + cellGap);
    const innerHeight = 7 * (cellSize + cellGap);
    const width = margin.left + innerWidth + margin.right;
    const height = margin.top + innerHeight + margin.bottom;

    svg
      .attr('viewBox', `0 0 ${width} ${height}`)
      .attr('preserveAspectRatio', 'xMidYMid meet');

    const rootG = svg
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    const weekIndices = d3.range(0, totalWeeks);
    const dayIndices = d3.range(0, 7);

    const xScale = d3
      .scaleBand<number>()
      .domain(weekIndices)
      .range([0, innerWidth])
      .paddingInner(0.18);

    const yScale = d3
      .scaleBand<number>()
      .domain(dayIndices)
      .range([0, innerHeight])
      .paddingInner(0.18);

    const academyColorScale = d3
      .scaleThreshold<number, string>()
      .domain([1, 2, 3, 4])
      .range(['#1e293b', '#1e3a8a', '#1d4ed8', '#3b82f6', '#60a5fa']);

    const studiosColorScale = d3
      .scaleThreshold<number, string>()
      .domain([1, 2, 3, 4])
      .range(['#1e293b', '#312e81', '#4338ca', '#6366f1', '#818cf8']);

    const bothColorScale = d3
      .scaleThreshold<number, string>()
      .domain([1, 2, 3, 4])
      .range(['#1e293b', '#064e3b', '#047857', '#10b981', '#34d399']);

    const resolveCellFill = (d: HeatmapDayCell): string => {
      if (
        heatmapFilterSource !== 'all' &&
        d.activitySource !== heatmapFilterSource
      ) {
        return '#0f172a';
      }
      if (!d.active || d.intensityLevel === 0) {
        return '#1e293b';
      }
      if (d.activitySource === 'both') {
        return bothColorScale(d.intensityLevel);
      }
      if (d.activitySource === 'studios') {
        return studiosColorScale(d.intensityLevel);
      }
      return academyColorScale(d.intensityLevel);
    };

    // Month Labels along top X axis
    rootG
      .append('g')
      .attr('class', 'heatmap-months')
      .selectAll('text.heatmap-month-label')
      .data(heatmapSummary.monthMarkers)
      .join('text')
      .attr('class', 'heatmap-month-label')
      .attr('x', (m) => xScale(m.weekIndex) ?? 0)
      .attr('y', -8)
      .attr('fill', '#94a3b8')
      .attr('font-size', '10px')
      .attr('font-family', 'JetBrains Mono, monospace')
      .attr('font-weight', '700')
      .text((m) => m.labelEn);

    // Weekday Labels along left Y axis
    const weekdayShortEn = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    rootG
      .append('g')
      .attr('class', 'heatmap-weekdays')
      .selectAll('text.heatmap-weekday-label')
      .data([0, 1, 2, 3, 4, 5, 6])
      .join('text')
      .attr('class', 'heatmap-weekday-label')
      .attr('x', -8)
      .attr('y', (d) => (yScale(d) ?? 0) + (yScale.bandwidth() / 2) + 3.5)
      .attr('text-anchor', 'end')
      .attr('fill', '#64748b')
      .attr('font-size', '9px')
      .attr('font-family', 'JetBrains Mono, monospace')
      .text((d) => (d % 2 === 1 || d === 0 || d === 6 ? weekdayShortEn[d] : ''));

    // Day Cells Grid
    const cellsGroup = rootG.append('g').attr('class', 'heatmap-cells');

    const rects = cellsGroup
      .selectAll<SVGRectElement, HeatmapDayCell>('rect.heatmap-day-cell')
      .data(heatmapSummary.cells, (d) => d.dateIso)
      .join('rect')
      .attr('class', 'heatmap-day-cell')
      .attr('data-testid', (d) => `heatmap-cell-${d.dateIso}`)
      .attr('data-date', (d) => d.dateIso)
      .attr('data-source', (d) => d.activitySource)
      .attr('data-intensity', (d) => String(d.intensityLevel))
      .attr('x', (d) => xScale(d.weekIndex) ?? 0)
      .attr('y', (d) => yScale(d.dayOfWeek) ?? 0)
      .attr('width', xScale.bandwidth())
      .attr('height', yScale.bandwidth())
      .attr('rx', 4)
      .attr('ry', 4)
      .attr('fill', (d) => resolveCellFill(d))
      .attr('stroke', (d) =>
        d.dateIso === selectedHeatmapDateIso
          ? '#f59e0b'
          : d.activitySource === 'both'
          ? 'rgba(52, 211, 153, 0.45)'
          : 'rgba(255, 255, 255, 0.06)'
      )
      .attr('stroke-width', (d) =>
        d.dateIso === selectedHeatmapDateIso ? 2.2 : 1
      )
      .attr('cursor', 'pointer')
      .on('click', (_event, d) => {
        setSelectedHeatmapDateIso(d.dateIso);
      });

    rects
      .append('title')
      .text(
        (d) =>
          `${d.dateIso} (${translateDayLabel(d.dayLabelFa, language)}) — ${
            d.active
              ? `${d.minutesStudied}m Academy · ${d.studioRuns} Studio Runs · +${d.xpEarned} XP [${d.activitySource.toUpperCase()}]`
              : 'Rest Day (0m)'
          }`
      );

    // Subtle dual-domain indicator dot for days active in BOTH Academy and Studios
    cellsGroup
      .selectAll<SVGCircleElement, HeatmapDayCell>('circle.heatmap-both-dot')
      .data(
        heatmapSummary.cells.filter(
          (c) =>
            c.activitySource === 'both' &&
            (heatmapFilterSource === 'all' || heatmapFilterSource === 'both')
        ),
        (d) => d.dateIso
      )
      .join('circle')
      .attr('class', 'heatmap-both-dot')
      .attr('cx', (d) => (xScale(d.weekIndex) ?? 0) + xScale.bandwidth() - 4)
      .attr('cy', (d) => (yScale(d.dayOfWeek) ?? 0) + 4)
      .attr('r', 2)
      .attr('fill', '#ffffff')
      .attr('fill-opacity', 0.85)
      .attr('pointer-events', 'none');
  }, [heatmapSummary, heatmapFilterSource, selectedHeatmapDateIso, language]);

  const handleToggleScenarioTrophy = (scenarioId: string) => {
    setCompletedScenarioIds((prev) =>
      prev.includes(scenarioId)
        ? prev.filter((id) => id !== scenarioId)
        : [...prev, scenarioId]
    );
  };

  const handleUnlockAllTrophies = () => {
    onCompleteAllModules();
    setCompletedScenarioIds([
      'scenario-zero-downtime-alembic',
      'scenario-worktree-isolation',
      'scenario-fastmcp-security',
      'scenario-browser-subagent-e2e',
    ]);
  };

  const completedGoalsCount = dailyGoals.filter((g) => g.completed).length;
  const totalPlannedGoalMinutes = dailyGoals.reduce((sum, g) => sum + g.targetMinutes, 0);

  const shareableText = formatShareableReportCardText(
    displayArchitectName,
    roleTitle,
    organization,
    metrics,
    streakStats.currentStreakDays,
    streakStats.totalMinutesStudied
  );

  const handleLogStudySession = () => {
    const addedMins = Math.max(5, Math.min(240, Number(sessionMinutesInput) || 25));
    setStudyDays((prev) => {
      const next = prev.map((d, idx) =>
        idx === prev.length - 1
          ? {
              ...d,
              active: true,
              minutesStudied: d.minutesStudied + addedMins,
              modulesTouched: d.modulesTouched + 1,
            }
          : d
      );
      const nextSummary = calculateStreakSummary(next);
      setPersistedStreakDays((curr) => {
        const updated = Math.max(curr + 1, nextSummary.currentStreakDays);
        setLongestStreakDaysRecord((best) => Math.max(best, updated));
        return updated;
      });
      return next;
    });
  };

  const handleIncrementConsecutiveStreakDay = () => {
    setStudyDays((prev) =>
      prev.map((d, idx) =>
        idx === prev.length - 1
          ? {
              ...d,
              active: true,
              minutesStudied: Math.max(30, d.minutesStudied + 15),
              modulesTouched: Math.max(1, d.modulesTouched),
            }
          : d
      )
    );
    setPersistedStreakDays((curr) => {
      const next = curr + 1;
      setLongestStreakDaysRecord((best) => Math.max(best, next));
      return next;
    });
  };

  const handleSetStreakMilestonePreset = (targetDays: number) => {
    const safeDays = Math.max(0, Math.floor(targetDays));
    if (safeDays > 0) {
      setStudyDays((prev) =>
        prev.map((d) => ({
          ...d,
          active: true,
          minutesStudied: Math.max(35, d.minutesStudied),
          modulesTouched: Math.max(1, d.modulesTouched),
        }))
      );
    } else {
      setStudyDays((prev) =>
        prev.map((d, idx) =>
          idx === prev.length - 1
            ? { ...d, active: false, minutesStudied: 0, modulesTouched: 0 }
            : d
        )
      );
    }
    setPersistedStreakDays(safeDays);
    setLongestStreakDaysRecord((best) => Math.max(best, safeDays));
  };

  const handleQuickAddReadingTimeXp = (minutesToAdd: number) => {
    setStudyDays((prev) =>
      prev.map((d, idx) =>
        idx === prev.length - 1
          ? {
              ...d,
              active: true,
              minutesStudied: d.minutesStudied + minutesToAdd,
              modulesTouched: d.modulesTouched + 1,
            }
          : d
      )
    );
  };

  const handleLogStudioAction = (studioId: string) => {
    setStudioUsageItems((prev) =>
      prev.map((item) =>
        item.studioId === studioId
          ? { ...item, actionsLogged: item.actionsLogged + 1 }
          : item
      )
    );
  };

  const handleCommitActiveTimerSession = () => {
    const minutesToCommit = Math.max(1, Math.round(elapsedSeconds / 60));
    setStudyDays((prev) =>
      prev.map((d, idx) =>
        idx === prev.length - 1
          ? {
              ...d,
              active: true,
              minutesStudied: d.minutesStudied + minutesToCommit,
              modulesTouched: d.modulesTouched + 1,
            }
          : d
      )
    );
    setTimerRunning(false);
    setElapsedSeconds(0);
  };

  const handleAddDailyGoal = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newGoalTitle.trim();
    if (!trimmed) return;
    const newGoal: DailyStudyGoalItem = {
      id: `goal-${Date.now()}`,
      titleFa: trimmed,
      moduleRef: newGoalModuleRef,
      targetMinutes: Math.max(5, Math.min(180, Number(newGoalMinutes) || 20)),
      completed: false,
    };
    setDailyGoals((prev) => [...prev, newGoal]);
    setNewGoalTitle('');
  };

  const handleToggleDailyGoal = (goalId: string) => {
    setDailyGoals((prev) =>
      prev.map((g) => (g.id === goalId ? { ...g, completed: !g.completed } : g))
    );
  };

  const handleDeleteDailyGoal = (goalId: string) => {
    setDailyGoals((prev) => prev.filter((g) => g.id !== goalId));
  };

  const handleToggleStudyDay = (dateIso: string) => {
    setStudyDays((prev) => {
      const next = prev.map((d) => {
        if (d.dateIso !== dateIso) return d;
        const nextActive = !d.active;
        return {
          ...d,
          active: nextActive,
          minutesStudied: nextActive ? Math.max(30, d.minutesStudied) : 0,
          modulesTouched: nextActive ? Math.max(1, d.modulesTouched) : 0,
        };
      });
      const summary = calculateStreakSummary(next);
      setPersistedStreakDays(summary.currentStreakDays);
      setLongestStreakDaysRecord((best) =>
        Math.max(best, summary.longestStreakDays)
      );
      return next;
    });
  };

  const shareBundle = buildShareableProgressCardBundle({
    baseUrl: typeof window !== 'undefined' ? window.location.origin : undefined,
    architectName: displayArchitectName,
    roleTitle,
    organization,
    metrics,
    xpProgression,
    currentStreakDays: streakStats.currentStreakDays,
  });

  const handleGeneratePublicProgressLink = () => {
    try {
      const urlObj = new URL(shareBundle.publicCardUrl);
      window.history.replaceState(null, '', `${urlObj.pathname}${urlObj.search}`);
    } catch {
      // Ignore history API errors in restricted frames
    }
    void navigator.clipboard?.writeText(shareBundle.publicCardUrl).catch(() => {});
    setSharedCardPreview(shareBundle.snapshot);
    setPublicLinkStatus('generated');
    setCopiedReportState('link');
    setTimeout(() => {
      setPublicLinkStatus('idle');
      setCopiedReportState('none');
    }, 2800);
  };

  const handleCopyPublicProgressLink = () => {
    void navigator.clipboard?.writeText(shareBundle.publicCardUrl).catch(() => {});
    setPublicLinkStatus('copied');
    setCopiedReportState('link');
    setTimeout(() => {
      setPublicLinkStatus('idle');
      setCopiedReportState('none');
    }, 2400);
  };

  const handleWebShareProgressCard = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: shareBundle.shareHeadlineEn,
          text: shareBundle.shareMessageEn,
          url: shareBundle.publicCardUrl,
        });
        setPublicLinkStatus('shared');
        setTimeout(() => setPublicLinkStatus('idle'), 2400);
        return;
      } catch {
        // Fallback to copying link + text
      }
    }
    void navigator.clipboard
      ?.writeText(
        language === 'en'
          ? `${shareBundle.shareMessageEn}\n\n${shareBundle.publicCardUrl}`
          : `${shareBundle.shareMessageFa}\n\n${shareBundle.shareMessageEn}\n\n${shareBundle.publicCardUrl}`
      )
      .catch(() => {});
    setPublicLinkStatus('copied');
    setTimeout(() => setPublicLinkStatus('idle'), 2400);
  };

  const handleShareReportCard = async (mode: 'text' | 'link') => {
    if (mode === 'text') {
      if (navigator.share) {
        try {
          await navigator.share({
            title: `Google Antigravity Progress Report — ${displayArchitectName}`,
            text: shareableText,
          });
        } catch {
          void navigator.clipboard?.writeText(shareableText).catch(() => {});
        }
      } else {
        void navigator.clipboard?.writeText(shareableText).catch(() => {});
      }
      setCopiedReportState('text');
      setTimeout(() => setCopiedReportState('none'), 2200);
      return;
    }

    handleGeneratePublicProgressLink();
  };

  const certificationPdfPayload: PrintableDocumentPayload = {
    titleFa:
      language === 'en'
        ? `Architect Progress Report & Certification: ${displayArchitectName}`
        : `کارنامه پیشرفت و گواهینامه معماری: ${displayArchitectName}`,
    titleEn: `Google Antigravity Architect Progress Report & Certification (${metrics.certificateSerial})`,
    subtitleOrCategory: `Level ${xpProgression.currentLevel} (${xpProgression.levelTitleEn}) · ${xpProgression.totalCombinedXp} Total XP`,
    sections: [
      {
        headingFa:
          language === 'en'
            ? '1. Architect Standing & Level Summary'
            : '۱. مشخصات معمار و خلاصه امتیازات (Architect Standing & Level)',
        headingEn: `Certificate Serial: ${metrics.certificateSerial}`,
        paragraphsFa:
          language === 'en'
            ? [
                `Architect Name: ${displayArchitectName} | Role: ${roleTitle} | Organization: ${organization}`,
                `Current Level: Level ${xpProgression.currentLevel} — ${xpProgression.levelTitleEn} with ${xpProgression.totalCombinedXp} Total XP (Module XP: ${xpProgression.moduleXp} | Reading XP: ${xpProgression.readingTimeXp} | Studio XP: ${xpProgression.studioUsageXp}).`,
                `Study Streak: ${streakStats.currentStreakDays} consecutive active days (${streakStats.totalMinutesStudied} total minutes logged).`,
              ]
            : [
                `نام معمار: ${displayArchitectName} | سمت: ${roleTitle} | سازمان: ${organization}`,
                `سطح فعلی (Architect Level): Level ${xpProgression.currentLevel} — ${xpProgression.levelTitleFa} با مجموع ${xpProgression.totalCombinedXp} امتیاز کل (Module XP: ${xpProgression.moduleXp} | Reading XP: ${xpProgression.readingTimeXp} | Studio XP: ${xpProgression.studioUsageXp}).`,
                `رکورد پیوستگی مطالعه (Study Streak): ${streakStats.currentStreakDays} روز متوالی فعال (مجموعاً ${streakStats.totalMinutesStudied} دقیقه مطالعه ثبت‌شده).`,
              ],
      },
      {
        headingFa:
          language === 'en'
            ? '2. Earned Competency Badges'
            : '۲. نشان‌های مهارت کسب‌شده (Earned Competency Badges)',
        headingEn: `${metrics.completedCount} / ${metrics.totalModules} Module Badges Unlocked`,
        bullets: metrics.badges.map((b) => ({
          termEn: `${b.unlocked ? 'UNLOCKED' : 'LOCKED'} · [${b.badgeCode}] (${b.xpValue} XP)`,
          descFa:
            language === 'en'
              ? `${b.badgeTitleEn} — ${b.competencyDomain}`
              : `${b.badgeTitleFa} (${b.badgeTitleEn}) — ${b.competencyDomain}`,
        })),
      },
      {
        headingFa:
          language === 'en'
            ? '3. Verified Shareable Transcript'
            : '۳. نسخه متنی قابل اشتراک‌گذاری (Verified Shareable Transcript)',
        headingEn: 'Cryptographic Verification Block',
        codeBlocks: [
          {
            filename: `${metrics.certificateSerial}.txt`,
            language: 'text',
            code: shareableText,
          },
        ],
      },
    ],
  };

  return (
    <div className="space-y-8 pb-12" data-testid="achievements-certification-view">
      {/* Shared Public Mastery Progress Card Verification Banner */}
      {sharedCardPreview && (
        <div
          data-testid="public-mastery-card-preview"
          className="rounded-xl border-2 border-emerald-500/60 bg-gradient-to-br from-slate-900 via-[#0b172a] to-slate-950 text-white p-6 sm:p-7 space-y-5 shadow-2xl"
        >
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="inline-flex items-center gap-1.5 text-emerald-300 font-bold">
                <Globe className="w-3.5 h-3.5" />
                <span>
                  {language === 'en'
                    ? 'Verified Public Mastery Progress Card'
                    : 'کارت عمومی تاییدشده پیشرفت معمار (Verified Public Mastery Card)'}
                </span>
              </span>
              <span aria-hidden="true" className="text-slate-600">·</span>
              <span
                dir="ltr"
                data-testid="preview-card-slug-badge"
                className="ltr-inline text-blue-300 font-mono"
              >
                {sharedCardPreview.cardSlugId}
              </span>
            </div>

            <button
              type="button"
              onClick={() => setSharedCardPreview(null)}
              data-testid="close-public-card-preview-btn"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
              <span>
                {language === 'en' ? 'Close Public Card Preview' : 'بستن پیش‌نمایش کارت عمومی'}
              </span>
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            <div className="lg:col-span-7 space-y-3">
              <div dir="ltr" className="ltr-inline text-xs font-mono text-emerald-400">
                CERTIFICATE SERIAL: {sharedCardPreview.certificateSerial} · LEVEL{' '}
                {sharedCardPreview.currentLevel}
              </div>
              <div className="text-2xl sm:text-3xl font-black text-white">
                {sharedCardPreview.architectName}
              </div>
              <div dir="ltr" className="ltr-inline text-xs sm:text-sm font-mono text-blue-300">
                {sharedCardPreview.roleTitle} @ {sharedCardPreview.organization}
              </div>
              <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/70 space-y-1">
                <div className="text-xs text-slate-400">
                  {language === 'en'
                    ? 'Verified Standing Rank in Public Link:'
                    : 'درجه تخصصی ثبت‌شده در لینک عمومی:'}
                </div>
                <div className="text-sm font-bold text-emerald-400">
                  {language === 'en'
                    ? sharedCardPreview.rankTitleEn
                    : sharedCardPreview.rankTitleFa}
                </div>
                <div dir="ltr" className="ltr-inline text-xs font-mono text-slate-300">
                  {sharedCardPreview.rankTitleEn}
                </div>
              </div>
            </div>

            <div className="lg:col-span-5 grid grid-cols-3 gap-3 text-center">
              <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/80">
                <div dir="ltr" className="ltr-inline text-xl font-mono font-black text-blue-400 tabular-nums">
                  {sharedCardPreview.completedCount}/{sharedCardPreview.totalModules}
                </div>
                <div className="text-[11px] text-slate-400 mt-1">
                  {language === 'en'
                    ? `Modules Mastered (${sharedCardPreview.completionPercentage}%)`
                    : `ماژول‌های تکمیل‌شده (${sharedCardPreview.completionPercentage}٪)`}
                </div>
              </div>
              <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/80">
                <div dir="ltr" className="ltr-inline text-xl font-mono font-black text-emerald-400 tabular-nums">
                  {sharedCardPreview.totalCombinedXp} XP
                </div>
                <div className="text-[11px] text-slate-400 mt-1">
                  {language === 'en'
                    ? `Total XP (Level ${sharedCardPreview.currentLevel})`
                    : `امتیاز کل (Level ${sharedCardPreview.currentLevel})`}
                </div>
              </div>
              <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/80">
                <div dir="ltr" className="ltr-inline text-xl font-mono font-black text-amber-400 tabular-nums">
                  {sharedCardPreview.currentStreakDays}d
                </div>
                <div className="text-[11px] text-slate-400 mt-1">
                  {language === 'en' ? 'Study Streak' : 'پیوستگی مطالعه'}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header Banner */}
      <div
        className="rounded-2xl border border-slate-200/80 dark:border-white/[0.07] bg-white dark:bg-[#0c121e] p-6 sm:p-8 space-y-5 shadow-xs"
        data-testid="achievements-header-banner"
      >
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200/70 dark:border-white/[0.06] pb-4">
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <span className="font-bold text-blue-600 dark:text-blue-400">
              {language === 'en'
                ? 'Studio 08 · Achievements, Mastery Rank & Certification'
                : 'استودیو ۰۸ · دستاوردها، رتبه مهارت و گواهینامه رسمی'}
            </span>
            <span aria-hidden="true" className="opacity-40">·</span>
            <span dir="ltr" className="ltr-inline font-mono">
              {metrics.certificateSerial}
            </span>
            <span aria-hidden="true" className="opacity-40">·</span>
            <span dir="ltr" className="ltr-inline font-mono text-emerald-500 font-bold">
              LVL {xpProgression.currentLevel} · {xpProgression.totalCombinedXp} Total XP
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <ExportSectionPdfButton
              label={
                language === 'en'
                  ? 'Export Report Card & Certificate PDF'
                  : 'دریافت PDF کارنامه و گواهینامه'
              }
              payload={certificationPdfPayload}
              onExport={onExportPdf}
            />
            {metrics.completedCount < metrics.totalModules && (
              <button
                type="button"
                onClick={onCompleteAllModules}
                data-testid="achievements-unlock-all-modules-btn"
                className="px-3.5 py-2 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors cursor-pointer whitespace-nowrap"
              >
                {language === 'en'
                  ? 'Unlock All 8 Modules'
                  : 'تکمیل تمام ۸ فصل'}
              </button>
            )}
          </div>
        </div>

        {/* Architect Identity & Mastery Rank Header Bar (User Name + Assigned Mastery Rank Next to Name) */}
        <div
          className="rounded-xl border border-slate-200/80 dark:border-white/[0.07] bg-slate-50/80 dark:bg-[#090d16] p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4"
          data-testid="achievements-header-identity-bar"
        >
          <div className="flex flex-wrap items-center gap-3">
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border"
              style={{
                backgroundColor: `${masteryRankStanding.currentRank.accentHex}18`,
                borderColor: `${masteryRankStanding.currentRank.accentHex}55`,
                color: masteryRankStanding.currentRank.accentHex,
              }}
            >
              <Crown className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                  {language === 'en' ? 'Systems Architect:' : 'معمار سیستم:'}
                </span>
                <span
                  data-testid="achievements-header-architect-name"
                  className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white"
                >
                  {displayArchitectName}
                </span>
                {/* Assigned Mastery Rank Badge directly next to User's Name */}
                <span
                  dir="ltr"
                  data-testid="achievements-header-mastery-rank-badge"
                  className="ltr-inline px-3 py-1 rounded-lg text-xs font-mono font-extrabold tracking-wide border shadow-sm"
                  style={{
                    backgroundColor: `${masteryRankStanding.currentRank.accentHex}20`,
                    borderColor: masteryRankStanding.currentRank.accentHex,
                    color: masteryRankStanding.currentRank.accentHex,
                  }}
                >
                  [{masteryRankStanding.currentRank.badgeCode}] {masteryRankStanding.currentRank.rankNameEn}
                </span>
                <span
                  data-testid="achievements-header-mastery-rank-fa"
                  className="px-2.5 py-0.5 rounded-md bg-slate-200/80 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-bold"
                >
                  {language === 'en'
                    ? masteryRankStanding.currentRank.rankTitleEn
                    : masteryRankStanding.currentRank.rankTitleFa}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                <span dir="ltr" className="ltr-inline font-mono text-slate-600 dark:text-slate-300">
                  {roleTitle} · {organization}
                </span>
                <span aria-hidden="true">·</span>
                {language === 'en' ? (
                  <span>
                    Completed Milestones:{' '}
                    <strong dir="ltr" className="ltr-inline font-mono text-emerald-500">
                      {masteryRankStanding.totalMilestonesCompleted} Milestones
                    </strong>{' '}
                    ({metrics.completedCount} Modules + {streakMilestoneEval.unlockedMilestoneCount} Streak Badges +{' '}
                    {trophyCase.unlockedCount} Trophies)
                  </span>
                ) : (
                  <span>
                    نقاط عطف تکمیل‌شده:{' '}
                    <strong dir="ltr" className="ltr-inline font-mono text-emerald-500">
                      {masteryRankStanding.totalMilestonesCompleted} Milestones
                    </strong>{' '}
                    ({metrics.completedCount} ماژول + {streakMilestoneEval.unlockedMilestoneCount} نشان پیوستگی +{' '}
                    {trophyCase.unlockedCount} جام)
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <label
              htmlFor="header-architect-name-input"
              className="text-[11px] font-semibold text-slate-500 dark:text-slate-400"
            >
              {language === 'en' ? 'Quick Edit Name:' : 'ویرایش سریع نام در هدر:'}
            </label>
            <input
              id="header-architect-name-input"
              type="text"
              value={displayArchitectName}
              onChange={(e) => setArchitectName(e.target.value)}
              data-testid="achievements-header-name-input"
              className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 w-52"
              placeholder={language === 'en' ? 'Architect Name...' : 'نام معمار...'}
            />
          </div>
        </div>

        <div className="space-y-5">
          <div className="space-y-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              {language === 'en' ? (
                'Achievements, Mastery Rank, XP Progression & Architect Report Card'
              ) : (
                <>
                  دستاوردها، رتبه مهارت (<span dir="ltr" className="ltr-inline">Mastery Rank</span>)، سیستم <span dir="ltr" className="ltr-inline">XP</span> و کارنامه معماری
                </>
              )}
            </h1>
            <div dir="ltr" className="ltr-inline text-sm font-mono text-blue-600 dark:text-blue-400">
              Mastery Rank System (Trainee · Specialist · Architect · Principal), XP Progression &amp; Report Card
            </div>
            <p className="text-xs sm:text-sm leading-7 text-slate-600 dark:text-slate-300 max-w-4xl">
              {language === 'en' ? (
                <>
                  Based on your total accumulated experience (<span dir="ltr" className="ltr-inline">Accumulated XP</span>) and completed engineering milestones (<span dir="ltr" className="ltr-inline">Milestones</span>), your official standing rank from{' '}
                  <span dir="ltr" className="ltr-inline font-mono font-bold">Trainee</span> to{' '}
                  <span dir="ltr" className="ltr-inline font-mono font-bold">Specialist</span>,{' '}
                  <span dir="ltr" className="ltr-inline font-mono font-bold">Architect</span>, and{' '}
                  <span dir="ltr" className="ltr-inline font-mono font-bold">Principal</span> is computed in real time and displayed beside your name in the header.
                </>
              ) : (
                <>
                  بر اساس مجموع امتیاز تجربه (<span dir="ltr" className="ltr-inline">Accumulated XP</span>) و نقاط عطف تکمیل‌شده (<span dir="ltr" className="ltr-inline">Milestones</span>)، رتبه رسمی شما از{' '}
                  <span dir="ltr" className="ltr-inline font-mono font-bold">Trainee</span> تا{' '}
                  <span dir="ltr" className="ltr-inline font-mono font-bold">Specialist</span>،{' '}
                  <span dir="ltr" className="ltr-inline font-mono font-bold">Architect</span> و{' '}
                  <span dir="ltr" className="ltr-inline font-mono font-bold">Principal</span> محاسبه و در کنار نام شما در هدر نمایش داده می‌شود.
                </>
              )}
            </p>
          </div>

          {/* Summary KPI Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full">
            <div
              className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/70 text-center"
              data-testid="achievements-header-rank-kpi"
            >
              <div
                dir="ltr"
                className="ltr-inline text-lg font-mono font-extrabold tabular-nums"
                style={{ color: masteryRankStanding.currentRank.accentHex }}
              >
                {masteryRankStanding.currentRank.rankNameEn}
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                {language === 'en'
                  ? `Mastery Rank (${masteryRankStanding.currentRank.rankTitleEn})`
                  : `رتبه مهارت (${masteryRankStanding.currentRank.rankTitleFa})`}
              </div>
            </div>
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/70 text-center">
              <div dir="ltr" className="ltr-inline text-xl font-mono font-extrabold text-blue-500 tabular-nums">
                LVL {xpProgression.currentLevel}
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                {language === 'en' ? 'Current Architect Level' : 'سطح فعلی معمار'}
              </div>
            </div>
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/70 text-center">
              <div dir="ltr" className="ltr-inline text-xl font-mono font-extrabold text-amber-500 tabular-nums">
                {streakStats.currentStreakDays}d
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                {language === 'en' ? 'Current Streak' : 'پیوستگی فعلی (Streak)'}
              </div>
            </div>
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/70 text-center">
              <div dir="ltr" className="ltr-inline text-xl font-mono font-extrabold text-emerald-500 tabular-nums">
                {xpProgression.totalCombinedXp}
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                {language === 'en' ? 'Total Experience (XP)' : 'مجموع امتیاز (Total XP)'}
              </div>
            </div>
          </div>
        </div>

        {/* Firebase Auth & Cloud Firestore Sync Bar */}
        <div
          className="pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
          data-testid="firebase-cloud-sync-bar"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-500 shrink-0">
              <Cloud className="w-4 h-4" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold text-slate-900 dark:text-white">
                  {language === 'en'
                    ? 'Cloud Database & Authentication (Firebase Firestore & Google Auth)'
                    : 'پایگاه داده ابری و احراز هویت (Firebase Firestore & Google Auth)'}
                </span>
                <span aria-hidden="true" className="text-slate-400">·</span>
                <span
                  dir="ltr"
                  className="ltr-inline text-emerald-600 dark:text-emerald-400 font-mono text-[11px] font-bold"
                >
                  elevated-gravity-h01dl · Active
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                {firebaseUser
                  ? language === 'en'
                    ? `Connected as ${firebaseUser.email || firebaseUser.displayName} — ${
                        cloudSyncMessage || 'Ready to sync XP, trophies, and report card to the cloud'
                      }`
                    : `متصل به حساب ${firebaseUser.email || firebaseUser.displayName} — ${
                        cloudSyncMessage || 'آماده همگام‌سازی امتیازات، جام‌ها و کارنامه در فضای ابری'
                      }`
                  : language === 'en'
                  ? 'Sign in with Google to permanently sync your XP, digital trophies, and engineering report card across devices.'
                  : 'برای ذخیره‌سازی دائمی امتیازات XP، جام‌های کلکسیونی و کارنامه مهندسی بین دستگاه‌ها، با حساب گوگل وارد شوید.'}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {!firebaseUser ? (
              <button
                type="button"
                onClick={async () => {
                  try {
                    setCloudSyncStatus('syncing');
                    await signInWithGooglePopup();
                  } catch {
                    setCloudSyncStatus('error');
                    setCloudSyncMessage(
                      language === 'en'
                        ? 'Google Sign-In popup was closed or restricted in preview frame'
                        : 'پنجره ورود گوگل بسته شد یا در محیط پیش‌نمایش محدود شد'
                    );
                  }
                }}
                data-testid="firebase-google-signin-btn"
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white transition-colors cursor-pointer"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>
                  {language === 'en' ? 'Google Sign-In' : 'ورود با گوگل (Google Sign-In)'}
                </span>
              </button>
            ) : (
              <>
                <button
                  type="button"
                  disabled={cloudSyncStatus === 'syncing'}
                  onClick={async () => {
                    if (!firebaseUser) return;
                    try {
                      setCloudSyncStatus('syncing');
                      await syncArchitectProgressToCloud(firebaseUser.uid, {
                        architectName: displayArchitectName,
                        roleTitle,
                        organization,
                        completedModules,
                        completedScenarioIds,
                        dailyTargetMinutes,
                        totalMinutesStudied: streakStats.totalMinutesStudied,
                        totalCombinedXp: xpProgression.totalCombinedXp,
                        currentLevel: xpProgression.currentLevel,
                      });
                      setCloudSyncStatus('synced');
                      setCloudSyncMessage(
                        language === 'en'
                          ? 'Successfully synced to Cloud Firestore ✓'
                          : 'ذخیره‌سازی در Cloud Firestore با موفقیت انجام شد ✓'
                      );
                    } catch {
                      setCloudSyncStatus('error');
                      setCloudSyncMessage(
                        language === 'en' ? 'Cloud sync failed' : 'خطا در ذخیره‌سازی ابری'
                      );
                    }
                  }}
                  data-testid="firebase-cloud-sync-btn"
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white transition-colors cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${cloudSyncStatus === 'syncing' ? 'animate-spin' : ''}`} />
                  <span>
                    {cloudSyncStatus === 'syncing'
                      ? language === 'en'
                        ? 'Syncing...'
                        : 'در حال همگام‌سازی...'
                      : cloudSyncStatus === 'synced'
                      ? language === 'en'
                        ? 'Synced to Firestore'
                        : 'همگام‌سازی شد (Synced to Firestore)'
                      : language === 'en'
                      ? 'Sync to Cloud'
                      : 'ذخیره در فضای ابری (Sync to Cloud)'}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => void signOutArchitect()}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>{language === 'en' ? 'Sign Out' : 'خروج'}</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Academy Leaderboard & AI Weekly Ranking Challenges */}
      <AcademyLeaderboard
        architectName={displayArchitectName}
        baseCumulativeXp={baseProgressionWithoutWeeklyChallenges.totalCombinedXp}
        completedModulesCount={metrics.completedCount}
        currentStreakDays={streakStats.currentStreakDays}
        bonusChallengeXp={weeklyChallengeBonusXp}
        completedChallengeIds={completedWeeklyChallengeIds}
        onToggleChallengeComplete={handleToggleWeeklyChallengeComplete}
      />

      {/* Mastery Rank System Ladder (Trainee · Specialist · Architect · Principal) */}
      <div
        className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/75 p-6 sm:p-8 space-y-6"
        data-testid="mastery-rank-system-section"
      >
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border"
              style={{
                backgroundColor: `${masteryRankStanding.currentRank.accentHex}18`,
                borderColor: `${masteryRankStanding.currentRank.accentHex}55`,
                color: masteryRankStanding.currentRank.accentHex,
              }}
            >
              <Crown className="w-5 h-5" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                  {language === 'en'
                    ? 'Engineering Mastery Rank Progression System'
                    : 'سیستم رتبه‌بندی مهارت مهندسی (Mastery Rank Progression System)'}
                </h2>
                <span
                  dir="ltr"
                  data-testid="mastery-rank-current-pill"
                  className="ltr-inline px-2.5 py-0.5 rounded-md text-xs font-mono font-extrabold border"
                  style={{
                    backgroundColor: `${masteryRankStanding.currentRank.accentHex}20`,
                    borderColor: masteryRankStanding.currentRank.accentHex,
                    color: masteryRankStanding.currentRank.accentHex,
                  }}
                >
                  {masteryRankStanding.currentRank.badgeCode} · {masteryRankStanding.currentRank.rankNameEn}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {language === 'en' ? (
                  <>
                    Your rank is evaluated in real time from your combined experience (<span dir="ltr" className="ltr-inline font-mono">{masteryRankStanding.totalCombinedXp} XP</span>) and completed milestones (<span dir="ltr" className="ltr-inline font-mono">{masteryRankStanding.totalMilestonesCompleted} Milestones</span>) and shown beside <strong className="text-slate-800 dark:text-slate-200">{displayArchitectName}</strong> in the header.
                  </>
                ) : (
                  <>
                    رتبه شما به‌صورت بلادرنگ بر اساس مجموع امتیاز (<span dir="ltr" className="ltr-inline font-mono">{masteryRankStanding.totalCombinedXp} XP</span>) و نقاط عطف تکمیل‌شده (<span dir="ltr" className="ltr-inline font-mono">{masteryRankStanding.totalMilestonesCompleted} Milestones</span>) تعیین شده و در هدر کنار نام <strong className="text-slate-800 dark:text-slate-200">{displayArchitectName}</strong> نمایش داده می‌شود.
                  </>
                )}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {masteryRankStanding.nextRank ? (
              <div className="px-3.5 py-2 rounded-lg border border-blue-500/30 bg-blue-500/10 text-xs text-blue-600 dark:text-blue-300">
                {language === 'en' ? (
                  <>
                    <span>Next Rank: </span>
                    <strong dir="ltr" className="ltr-inline font-mono">
                      {masteryRankStanding.nextRank.rankNameEn}
                    </strong>
                    <span>
                      {' '}
                      (Requires{' '}
                      <span dir="ltr" className="ltr-inline font-mono font-bold">
                        {masteryRankStanding.xpNeededForNextRank} XP
                      </span>{' '}
                      &amp;{' '}
                      <span dir="ltr" className="ltr-inline font-mono font-bold">
                        {masteryRankStanding.milestonesNeededForNextRank}
                      </span>{' '}
                      more milestones)
                    </span>
                  </>
                ) : (
                  <>
                    <span>رتبه بعدی: </span>
                    <strong dir="ltr" className="ltr-inline font-mono">
                      {masteryRankStanding.nextRank.rankNameEn}
                    </strong>
                    <span>
                      {' '}
                      (نیاز به{' '}
                      <span dir="ltr" className="ltr-inline font-mono font-bold">
                        {masteryRankStanding.xpNeededForNextRank} XP
                      </span>{' '}
                      و{' '}
                      <span dir="ltr" className="ltr-inline font-mono font-bold">
                        {masteryRankStanding.milestonesNeededForNextRank}
                      </span>{' '}
                      نقطه عطف دیگر)
                    </span>
                  </>
                )}
              </div>
            ) : (
              <div className="px-3.5 py-2 rounded-lg border border-amber-500/40 bg-amber-500/10 text-xs font-bold text-amber-600 dark:text-amber-300">
                {language === 'en'
                  ? 'Maximum Principal Rank Achieved ★'
                  : 'بالاترین رتبه معماری بازگشایی شد (Maximum Principal Rank Achieved ★)'}
              </div>
            )}
          </div>
        </div>

        {/* Progress Bar Toward Next Mastery Rank */}
        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 space-y-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
            <span className="font-bold text-slate-700 dark:text-slate-200">
              {language === 'en' ? 'Progress Toward Next Rank (' : 'پیشرفت به سمت رتبه بعدی ('}
              <span dir="ltr" className="ltr-inline font-mono">
                {masteryRankStanding.currentRank.rankNameEn} →{' '}
                {masteryRankStanding.nextRank ? masteryRankStanding.nextRank.rankNameEn : 'MAX RANK'}
              </span>
              )
            </span>
            <span
              dir="ltr"
              data-testid="mastery-rank-progress-percent"
              className="ltr-inline font-mono font-bold text-blue-500 tabular-nums"
            >
              {masteryRankStanding.overallProgressToNextPercent}% (XP: {masteryRankStanding.xpProgressToNextPercent}% · Milestones: {masteryRankStanding.milestoneProgressToNextPercent}%)
            </span>
          </div>
          <div className="w-full h-3 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
            <div
              data-testid="mastery-rank-progress-bar"
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${masteryRankStanding.overallProgressToNextPercent}%`,
                backgroundColor: masteryRankStanding.currentRank.accentHex,
              }}
            />
          </div>
        </div>

        {/* 4-Tier Mastery Rank Cards (Trainee, Specialist, Architect, Principal) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {masteryRankStanding.ranks.map((tier) => (
            <div
              key={tier.rankId}
              data-testid={`mastery-rank-card-${tier.rankId}`}
              className={`rounded-xl p-4 border transition-all flex flex-col justify-between gap-3 ${
                tier.isCurrent
                  ? 'bg-blue-500/10 dark:bg-slate-900 border-2 shadow-md'
                  : tier.unlocked
                  ? 'bg-emerald-500/5 dark:bg-slate-950/80 border-emerald-500/30'
                  : 'bg-slate-50 dark:bg-slate-950/40 border-slate-200 dark:border-slate-800 opacity-75'
              }`}
              style={
                tier.isCurrent
                  ? { borderColor: tier.accentHex }
                  : undefined
              }
            >
              <div className="space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <span
                    dir="ltr"
                    className="ltr-inline px-2 py-0.5 rounded text-[11px] font-mono font-extrabold border"
                    style={{
                      backgroundColor: `${tier.accentHex}18`,
                      borderColor: `${tier.accentHex}55`,
                      color: tier.accentHex,
                    }}
                  >
                    {tier.badgeCode} · {tier.rankNameEn}
                  </span>
                  {tier.isCurrent ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 dark:text-blue-400">
                      <span aria-hidden="true">●</span>
                      <span>{language === 'en' ? 'Current Rank' : 'رتبه فعلی شما'}</span>
                    </span>
                  ) : tier.unlocked ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-500">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{language === 'en' ? 'Unlocked' : 'باز شده'}</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-400">
                      <Lock className="w-3.5 h-3.5" />
                      <span>{language === 'en' ? 'Locked' : 'قفل'}</span>
                    </span>
                  )}
                </div>

                <div>
                  <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                    {language === 'en' ? tier.rankTitleEn : tier.rankTitleFa}
                  </h3>
                  <div dir="ltr" className="ltr-inline text-[11px] font-mono text-slate-500 dark:text-slate-400">
                    {tier.rankTitleEn}
                  </div>
                </div>

                <p className="text-xs leading-6 text-slate-600 dark:text-slate-300">
                  {language === 'en'
                    ? RANK_DESC_EN_MAP[tier.rankId] || tier.descriptionFa
                    : tier.descriptionFa}
                </p>
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800/80 space-y-1.5 text-[11px]">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 dark:text-slate-400">
                    {language === 'en' ? 'Min Required XP:' : 'حداقل امتیاز لازم:'}
                  </span>
                  <span dir="ltr" className="ltr-inline font-mono font-bold text-slate-800 dark:text-slate-200">
                    {tier.minXp.toLocaleString('en-US')} XP
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 dark:text-slate-400">
                    {language === 'en' ? 'Min Milestones:' : 'حداقل نقاط عطف:'}
                  </span>
                  <span dir="ltr" className="ltr-inline font-mono font-bold text-slate-800 dark:text-slate-200">
                    {tier.minMilestones} Milestones
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* NEW: XP and Level Progression System (Modules + Reading Time + Studio Usage) */}
      <div
        className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/75 p-6 sm:p-8 space-y-6"
        data-testid="xp-level-system"
      >
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-blue-600/15 border border-blue-500/40 flex items-center justify-center text-blue-500 shrink-0">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                  {language === 'en'
                    ? 'Experience Points (XP) & Level Progression System'
                    : 'سیستم امتیاز تجربه و ارتقای سطح (XP & Level Progression)'}
                </h2>
                <span
                  dir="ltr"
                  data-testid="current-level-badge"
                  className="ltr-inline px-2.5 py-0.5 rounded-md bg-blue-600 text-white text-xs font-mono font-extrabold tabular-nums"
                >
                  LEVEL {xpProgression.currentLevel}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                <span className="font-semibold text-slate-700 dark:text-slate-200">
                  {language === 'en' ? xpProgression.levelTitleEn : xpProgression.levelTitleFa}
                </span>
                <span aria-hidden="true">·</span>
                <span dir="ltr" className="ltr-inline font-mono text-blue-500">
                  {xpProgression.levelTitleEn}
                </span>
              </div>
            </div>
          </div>

          <div className="text-left" dir="ltr">
            <div className="text-xs font-mono text-slate-400">TOTAL COMBINED EXPERIENCE</div>
            <div
              data-testid="total-combined-xp"
              className="text-2xl font-mono font-black text-emerald-500 tabular-nums"
            >
              {xpProgression.totalCombinedXp} XP
            </div>
          </div>
        </div>

        {/* Interactive Level-Up Progress Bar */}
        <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/70 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex flex-wrap items-center gap-2">
              <Zap className="w-4 h-4 text-amber-500" />
              <span className="font-bold text-slate-800 dark:text-slate-100">
                {language === 'en' ? 'Progress to Next Level-Up:' : 'پیشرفت تا ارتقای سطح بعدی:'}
              </span>
              <span dir="ltr" className="ltr-inline font-mono text-slate-600 dark:text-slate-300 font-bold">
                Level {xpProgression.currentLevel} → Level {Math.min(7, xpProgression.currentLevel + 1)}
              </span>
              <span aria-hidden="true">·</span>
              <span dir="ltr" className="ltr-inline font-mono text-blue-500 font-semibold">
                {xpProgression.nextLevelTitleEn}
              </span>
            </div>
            <div dir="ltr" className="ltr-inline font-mono font-bold text-slate-700 dark:text-slate-200 tabular-nums">
              {xpProgression.totalCombinedXp} / {xpProgression.nextLevelTargetXp} XP ({xpProgression.levelProgressPercent}%)
            </div>
          </div>

          <div className="w-full h-3.5 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden p-0.5">
            <div
              data-testid="xp-level-progress-bar"
              className="h-full rounded-full bg-gradient-to-r from-blue-600 via-indigo-500 to-emerald-400 transition-all duration-300"
              style={{ width: `${Math.max(4, xpProgression.levelProgressPercent)}%` }}
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500 dark:text-slate-400">
            <span>
              {language === 'en'
                ? 'XP Sources: Curriculum Module Mastery + Daily Study Minutes + Interactive Studio Runs'
                : 'منابع کسب امتیاز: تکمیل ماژول‌های آموزشی + زمان مطالعه روزانه + استفاده از استودیوهای تعاملی'}
            </span>
            <span dir="ltr" className="ltr-inline font-mono text-amber-500 font-semibold tabular-nums">
              {xpProgression.xpNeededForNextLevel > 0
                ? `${xpProgression.xpNeededForNextLevel} XP needed for next level-up`
                : 'MAX ARCHITECT LEVEL UNLOCKED'}
            </span>
          </div>
        </div>

        {/* 3 XP Source Pillars: Module Completion, Reading Time, Interactive Studio Usage */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Pillar 1: Module Completion XP (3 Cols) */}
          <div className="lg:col-span-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/60 p-4 flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-blue-500" />
                  <span>{language === 'en' ? '1. Module Completion' : '۱. تکمیل فصل‌ها'}</span>
                </span>
                <span dir="ltr" className="ltr-inline text-xs font-mono font-bold text-blue-500 tabular-nums">
                  +{xpProgression.moduleXp} XP
                </span>
              </div>
              <div dir="ltr" className="ltr-inline text-[11px] font-mono text-slate-500 block">
                Module Completion ({metrics.completedCount}/{metrics.totalModules} Modules)
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-5">
                {language === 'en'
                  ? 'Each curriculum module awards between 150 and 250 XP toward your architect standing.'
                  : 'هر فصل بین ۱۵۰ تا ۲۵۰ امتیاز تجربه به کارنامه شما اضافه می‌کند.'}
              </p>
            </div>

            <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-500">
                  {language === 'en' ? 'Module XP Cap:' : 'سهم از سقف ماژول‌ها:'}
                </span>
                <span dir="ltr" className="ltr-inline font-mono font-bold text-slate-700 dark:text-slate-200 tabular-nums">
                  {xpProgression.moduleXp} / {metrics.maxXp} XP
                </span>
              </div>
              {metrics.completedCount < metrics.totalModules && (
                <button
                  type="button"
                  onClick={onCompleteAllModules}
                  className="w-full py-2 px-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <span>{language === 'en' ? 'Complete All Modules' : 'تکمیل تمام فصول'}</span>
                  <span dir="ltr" className="ltr-inline font-mono">+{metrics.maxXp - xpProgression.moduleXp} XP</span>
                </button>
              )}
            </div>
          </div>

          {/* Pillar 2: Reading & Study Time XP (3 Cols) */}
          <div className="lg:col-span-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/60 p-4 flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4 text-emerald-500" />
                  <span>{language === 'en' ? '2. Deep Study Time' : '۲. زمان مطالعه و بررسی'}</span>
                </span>
                <span dir="ltr" className="ltr-inline text-xs font-mono font-bold text-emerald-500 tabular-nums">
                  +{xpProgression.readingTimeXp} XP
                </span>
              </div>
              <div dir="ltr" className="ltr-inline text-[11px] font-mono text-slate-500 block">
                Reading Time ({streakStats.totalMinutesStudied}m × 4 XP/min)
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-5">
                {language === 'en'
                  ? 'Earn 4 XP for every minute spent studying documentation and reviewing architecture code.'
                  : 'به ازای هر دقیقه مطالعه عمیق مستندات و کدهای آکادمی، ۴ امتیاز تجربه دریافت می‌کنید.'}
              </p>
            </div>

            <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-500">
                  {language === 'en' ? 'Total Logged Time:' : 'زمان ثبت‌شده کل:'}
                </span>
                <span dir="ltr" className="ltr-inline font-mono font-bold text-slate-700 dark:text-slate-200 tabular-nums">
                  {streakStats.totalMinutesStudied} mins
                </span>
              </div>
              <button
                type="button"
                onClick={() => handleQuickAddReadingTimeXp(15)}
                className="w-full py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-colors cursor-pointer flex items-center justify-center gap-1.5"
              >
                <span>{language === 'en' ? 'Log 15m Study' : 'ثبت ۱۵ دقیقه مطالعه'}</span>
                <span dir="ltr" className="ltr-inline font-mono">+60 XP</span>
              </button>
            </div>
          </div>

          {/* Pillar 3: Interactive Studio Usage XP (6 Cols) */}
          <div className="lg:col-span-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/60 p-4 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-2.5">
              <div>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <Cpu className="w-4 h-4 text-indigo-500" />
                  <span>
                    {language === 'en'
                      ? '3. Hands-On Studio Lab XP'
                      : '۳. امتیاز کار با استودیوهای عملی'}
                  </span>
                </span>
                <div dir="ltr" className="ltr-inline text-[11px] font-mono text-slate-500">
                  Interactive Studio Usage XP · Simulator, Guardrails &amp; FastMCP
                </div>
              </div>
              <span dir="ltr" className="ltr-inline text-xs font-mono font-bold text-indigo-400 tabular-nums">
                +{xpProgression.studioUsageXp} XP
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {studioUsageItems.map((studio) => (
                <div
                  key={studio.studioId}
                  className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between gap-2"
                >
                  <div className="space-y-0.5 min-w-0">
                    <div className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">
                      {language === 'en' ? studio.titleEn : studio.titleFa}
                    </div>
                    <div dir="ltr" className="ltr-inline text-[10px] font-mono text-slate-500 block truncate">
                      {studio.actionsLogged} runs · +{studio.actionsLogged * studio.xpPerAction} XP
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleLogStudioAction(studio.studioId)}
                    className="px-2.5 py-1.5 rounded-lg bg-indigo-600/15 hover:bg-indigo-600 text-indigo-600 dark:text-indigo-300 hover:text-white text-[11px] font-mono font-bold transition-colors cursor-pointer shrink-0 tabular-nums"
                  >
                    <span dir="ltr" className="ltr-inline">+{studio.xpPerAction} XP</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Daily Study Planner Dashboard (Goals, Active Session Timer & Weekly Progress Chart) */}
      <div
        className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/75 p-6 sm:p-8 space-y-6"
        data-testid="daily-study-planner"
      >
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-2.5">
            <Target className="w-5 h-5 text-blue-500 shrink-0" />
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                {language === 'en'
                  ? 'Daily Study Planner & Weekly Target Telemetry'
                  : 'برنامه‌ریز روزانه مطالعه و پایش هدف هفتگی'}
              </h2>
              <div dir="ltr" className="ltr-inline text-xs font-mono text-slate-500 dark:text-slate-400">
                Daily Study Planner · Active Session Telemetry &amp; Weekly Target Progress Chart
              </div>
            </div>
          </div>

          {/* Daily Target Selector */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
              {language === 'en' ? 'Daily Study Target:' : 'هدف مطالعه روزانه:'}
            </span>
            <div dir="ltr" className="inline-flex rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-950 p-1 gap-1">
              {[30, 45, 60, 90].map((targetMins) => (
                <button
                  key={targetMins}
                  type="button"
                  onClick={() => setDailyTargetMinutes(targetMins)}
                  className={`px-2.5 py-1 rounded-md text-xs font-mono font-bold transition-colors cursor-pointer tabular-nums ${
                    dailyTargetMinutes === targetMins
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {targetMins}m/day
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Column 1 (5 Cols): Daily Study Goals Checklist & Builder */}
          <div className="lg:col-span-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/60 p-5 space-y-4 flex flex-col justify-between">
            <div className="space-y-3.5">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  {language === 'en'
                    ? "Today's Study Goals (Daily Study Goals)"
                    : 'اهداف مطالعه امروز (Daily Study Goals)'}
                </h3>
                <span dir="ltr" className="ltr-inline text-xs font-mono font-semibold text-blue-500 tabular-nums">
                  {completedGoalsCount}/{dailyGoals.length} Done · {totalPlannedGoalMinutes}m Planned
                </span>
              </div>

              <div className="space-y-2 max-h-60 overflow-y-auto pl-1">
                {dailyGoals.map((goal) => (
                  <div
                    key={goal.id}
                    className={`p-3 rounded-lg border transition-colors flex items-start justify-between gap-2.5 ${
                      goal.completed
                        ? 'border-emerald-500/40 bg-emerald-500/5 dark:bg-emerald-500/10'
                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => handleToggleDailyGoal(goal.id)}
                      className={`flex items-start gap-2.5 ${
                        language === 'en' ? 'text-left' : 'text-right'
                      } flex-1 cursor-pointer`}
                    >
                      <div
                        className={`w-4 h-4 rounded mt-0.5 flex items-center justify-center border shrink-0 ${
                          goal.completed
                            ? 'bg-emerald-500 border-emerald-500 text-white'
                            : 'border-slate-400 dark:border-slate-600'
                        }`}
                      >
                        {goal.completed && <Check className="w-3 h-3" />}
                      </div>
                      <div className="space-y-1 flex-1">
                        <div
                          className={`text-xs font-semibold leading-5 ${
                            goal.completed
                              ? 'line-through text-slate-400 dark:text-slate-500'
                              : 'text-slate-800 dark:text-slate-100'
                          }`}
                        >
                          {language === 'en'
                            ? GOAL_TITLE_EN_MAP[goal.id] || goal.titleFa
                            : goal.titleFa}
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span dir="ltr" className="ltr-inline text-[10px] font-mono text-blue-600 dark:text-blue-400">
                            {goal.moduleRef}
                          </span>
                          <span dir="ltr" className="ltr-inline text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 tabular-nums">
                            {goal.targetMinutes}m
                          </span>
                        </div>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDeleteDailyGoal(goal.id)}
                      aria-label={language === 'en' ? 'Delete study goal' : 'حذف هدف مطالعه'}
                      className="p-1 text-slate-400 hover:text-rose-500 transition-colors cursor-pointer shrink-0"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Add New Daily Goal Form */}
            <form onSubmit={handleAddDailyGoal} className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-2.5">
              <div className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                {language === 'en'
                  ? "Define a new goal for today's session:"
                  : 'تعریف هدف جدید برای جلسه امروز:'}
              </div>
              <input
                type="text"
                placeholder={
                  language === 'en'
                    ? 'Goal title (e.g., Practice // turbo-all directive in pipeline)...'
                    : 'عنوان هدف (مثلاً: تمرین دستور // turbo-all در پایپ‌لاین)...'
                }
                value={newGoalTitle}
                onChange={(e) => setNewGoalTitle(e.target.value)}
                className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
              />
              <div className="flex flex-wrap items-center gap-2">
                <select
                  aria-label={language === 'en' ? 'Select target module' : 'انتخاب ماژول هدف'}
                  dir="ltr"
                  value={newGoalModuleRef}
                  onChange={(e) => setNewGoalModuleRef(e.target.value)}
                  className="ltr-code flex-1 min-w-[140px] px-2.5 py-1.5 text-[11px] font-mono rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                >
                  {allModules.map((m) => (
                    <option key={m.id} value={`Module ${m.number} · ${m.titleEn.split(':')[0]}`}>
                      Module {m.number} · {m.titleEn.split(':')[0]}
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  aria-label={language === 'en' ? 'Target time in minutes' : 'زمان هدف به دقیقه'}
                  dir="ltr"
                  min={5}
                  max={180}
                  step={5}
                  value={newGoalMinutes}
                  onChange={(e) => setNewGoalMinutes(Number(e.target.value))}
                  className="ltr-code w-16 px-2 py-1.5 text-xs font-mono rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white tabular-nums"
                />
                <button
                  type="submit"
                  className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold cursor-pointer whitespace-nowrap"
                >
                  {language === 'en' ? '+ Add Goal' : '+ افزودن هدف'}
                </button>
              </div>
            </form>
          </div>

          {/* Column 2 (3 Cols): Active Study Session Time Tracker */}
          <div className="lg:col-span-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/60 p-5 flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Timer className="w-4 h-4 text-emerald-500" />
                  <span>{language === 'en' ? 'Active Session Timer' : 'تایمر جلسه فعال'}</span>
                </span>
                <span
                  dir="ltr"
                  className={`ltr-inline text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                    timerRunning
                      ? 'bg-emerald-500/20 text-emerald-500'
                      : 'bg-slate-200 dark:bg-slate-800 text-slate-500'
                  }`}
                >
                  {timerRunning ? 'ACTIVE SESSION' : 'PAUSED'}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-5">
                {language === 'en'
                  ? "Track your current study session and commit it directly to today's progress chart."
                  : 'زمان مطالعه فعلی خود را اندازه‌گیری کرده و مستقیماً در نمودار پیشرفت امروز ثبت کنید.'}
              </p>
            </div>

            {/* Digital Monospace Timer Readout */}
            <div className="py-5 px-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-center space-y-1.5">
              <div
                dir="ltr"
                data-testid="active-timer-display"
                className="ltr-inline text-3xl sm:text-4xl font-mono font-black tracking-tight text-slate-900 dark:text-white tabular-nums"
              >
                {formatActiveTimerDisplay(elapsedSeconds)}
              </div>
              <div dir="ltr" className="ltr-inline text-[11px] font-mono text-slate-500 tabular-nums">
                Ready to log: +{Math.max(1, Math.round(elapsedSeconds / 60))} mins to Today
              </div>
            </div>

            {/* Timer Controls */}
            <div className="space-y-2">
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setTimerRunning((prev) => !prev)}
                  className={`py-2 px-2.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                    timerRunning
                      ? 'bg-amber-500 hover:bg-amber-400 text-slate-950'
                      : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                  }`}
                >
                  {timerRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                  <span>
                    {timerRunning
                      ? language === 'en'
                        ? 'Pause'
                        : 'توقف'
                      : language === 'en'
                      ? 'Start'
                      : 'شروع'}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setElapsedSeconds((prev) => prev + 900)}
                  className="py-2 px-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-blue-500 text-xs font-mono font-bold text-blue-600 dark:text-blue-400 cursor-pointer tabular-nums"
                >
                  <span dir="ltr" className="ltr-inline">+15m</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setTimerRunning(false);
                    setElapsedSeconds(0);
                  }}
                  aria-label={language === 'en' ? 'Reset timer' : 'ریست تایمر'}
                  className="py-2 px-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-300 flex items-center justify-center gap-1 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>{language === 'en' ? 'Reset' : 'صفر'}</span>
                </button>
              </div>

              <button
                type="button"
                onClick={handleCommitActiveTimerSession}
                className="w-full py-2.5 px-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>
                  {language === 'en'
                    ? "Commit Timer to Today's Stats"
                    : 'ثبت زمان تایمر در آمار امروز'}
                </span>
              </button>
            </div>
          </div>

          {/* Column 3 (4 Cols): Weekly Progress vs. Target Visual Chart */}
          <div className="lg:col-span-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/60 p-5 flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <BarChart3 className="w-4 h-4 text-blue-500" />
                  <span>{language === 'en' ? 'Weekly Progress Chart' : 'نمودار پیشرفت هفتگی'}</span>
                </span>
                <span dir="ltr" className="ltr-inline text-xs font-mono font-bold text-emerald-500 tabular-nums">
                  {plannerAnalytics.weeklyActualMinutes} / {plannerAnalytics.weeklyTargetMinutes}m ({plannerAnalytics.weeklyCompletionPercent}%)
                </span>
              </div>

              {/* Weekly Progress Bar */}
              <div className="space-y-1">
                <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-emerald-500 transition-all duration-300"
                    style={{ width: `${plannerAnalytics.weeklyCompletionPercent}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                  <span>
                    {language === 'en'
                      ? `Days Meeting Target (${dailyTargetMinutes}m+):`
                      : `روزهای منطبق با هدف (${dailyTargetMinutes}m+):`}
                  </span>
                  <span dir="ltr" className="ltr-inline font-mono font-bold text-slate-700 dark:text-slate-200 tabular-nums">
                    {plannerAnalytics.daysMetTargetCount} / 7 Days Met
                  </span>
                </div>
              </div>
            </div>

            {/* 7-Day Vertical Bar Chart with Target Threshold Line */}
            <div className="relative pt-4 pb-1 px-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
              {/* Target Line */}
              <div
                className="absolute inset-x-3 border-t border-dashed border-amber-500/70 pointer-events-none z-10 flex justify-end"
                style={{
                  bottom: `${Math.max(18, Math.min(85, plannerAnalytics.chartBars[0]?.targetLinePercent || 65))}%`,
                }}
              >
                <span
                  dir="ltr"
                  className="ltr-inline -mt-2.5 bg-amber-500/20 text-amber-500 text-[9px] font-mono font-bold px-1 rounded tabular-nums"
                >
                  Target {dailyTargetMinutes}m
                </span>
              </div>

              <div className="grid grid-cols-7 gap-2 items-end h-32 pt-4">
                {plannerAnalytics.chartBars.map((bar) => (
                  <div key={bar.dateIso} className="flex flex-col items-center h-full justify-end gap-1">
                    <div
                      dir="ltr"
                      className="ltr-inline text-[9px] font-mono text-slate-500 dark:text-slate-400 tabular-nums"
                    >
                      {bar.actualMinutes}m
                    </div>
                    <div className="w-full h-20 bg-slate-100 dark:bg-slate-800/80 rounded-md overflow-hidden flex items-end">
                      <div
                        className={`w-full rounded-t-md transition-all duration-300 ${
                          bar.metTarget
                            ? 'bg-emerald-500'
                            : bar.actualMinutes > 0
                            ? 'bg-blue-500'
                            : 'bg-slate-300 dark:bg-slate-700'
                        }`}
                        style={{ height: `${Math.max(6, bar.heightPercent)}%` }}
                      />
                    </div>
                    <div className="text-[10px] font-semibold text-slate-600 dark:text-slate-300 truncate max-w-full">
                      {translateDayLabel(
                        bar.dayLabelFa.replace('امروز (سه‌شنبه)', 'امروز'),
                        language
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500 inline-block" />
                <span>{language === 'en' ? 'Target Met' : 'تحقق هدف روزانه'}</span>
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-blue-500 inline-block" />
                <span>{language === 'en' ? 'In Progress' : 'در حال پیشرفت'}</span>
              </span>
              <span dir="ltr" className="ltr-inline font-mono text-slate-600 dark:text-slate-300 tabular-nums">
                Today: {plannerAnalytics.todayActualMinutes}/{plannerAnalytics.todayTargetMinutes}m
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Section 1: Visual Daily Streak Counter, 7/30/100-Day Milestone Badges & Session Tracker */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div
          data-testid="daily-streak-counter-card"
          className="lg:col-span-7 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/75 p-6 space-y-5"
        >
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3.5">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-amber-500/15 border border-amber-500/40 flex items-center justify-center text-amber-500 shrink-0">
                <Flame className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                  {language === 'en' ? (
                    'Visual Daily Streak Counter & 7, 30 & 100-Day Milestone Badges'
                  ) : (
                    <>
                      شمارنده بصری پیوستگی روزانه و نشان‌های ۷، ۳۰ و ۱۰۰ روزه{' '}
                      <span dir="ltr" className="ltr-inline font-mono text-xs sm:text-sm text-amber-500">
                        (Daily Streak Counter)
                      </span>
                    </>
                  )}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {language === 'en' ? (
                    <>
                      Auto-persisted in <span dir="ltr" className="ltr-inline font-mono">localStorage</span> · Unlock milestone badges at 7, 30, and 100 consecutive study days
                    </>
                  ) : (
                    <>
                      ذخیره خودکار در <span dir="ltr" className="ltr-inline font-mono">localStorage</span> · کسب نشان‌های ویژه در نقاط عطف ۷، ۳۰ و ۱۰۰ روز مطالعه متوالی
                    </>
                  )}
                </p>
              </div>
            </div>
            <div dir="ltr" className="ltr-inline text-xs font-mono font-bold text-emerald-500 tabular-nums">
              {streakMilestoneEval.unlockedMilestoneCount} / {streakMilestoneEval.totalMilestones} Milestones · +{streakMilestoneEval.totalMilestoneBonusXp} XP
            </div>
          </div>

          {/* Visual Daily Streak Counter Hero Box + Controls */}
          <div className="p-4 sm:p-5 rounded-xl border border-amber-500/30 bg-gradient-to-br from-amber-500/10 via-slate-900/40 to-slate-950/70 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-amber-500 text-slate-950 flex flex-col items-center justify-center shrink-0 shadow-lg">
                  <Flame className="w-6 h-6" />
                  <span
                    dir="ltr"
                    data-testid="daily-streak-count-value"
                    className="ltr-inline text-lg font-mono font-black leading-none mt-0.5 tabular-nums"
                  >
                    {streakStats.currentStreakDays}
                  </span>
                </div>
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white">
                      {language === 'en'
                        ? `${streakStats.currentStreakDays} Consecutive Study Days`
                        : `${streakStats.currentStreakDays} روز مطالعه متوالی`}
                    </span>
                    <span
                      dir="ltr"
                      data-testid="daily-streak-best-value"
                      className="ltr-inline text-xs font-mono text-amber-500 font-bold tabular-nums"
                    >
                      (Best: {streakStats.longestStreakDays}d)
                    </span>
                  </div>
                  <div className="text-xs text-slate-600 dark:text-slate-300">
                    {streakMilestoneEval.highestUnlockedBadge ? (
                      <>
                        {language === 'en' ? 'Highest Active Badge: ' : 'بالاترین نشان فعال: '}
                        <span className="font-bold text-amber-400">
                          {language === 'en'
                            ? streakMilestoneEval.highestUnlockedBadge.titleEn
                            : streakMilestoneEval.highestUnlockedBadge.titleFa}
                        </span>{' '}
                        <span dir="ltr" className="ltr-inline font-mono text-[11px] text-emerald-400">
                          [{streakMilestoneEval.highestUnlockedBadge.badgeCode}]
                        </span>
                      </>
                    ) : language === 'en' ? (
                      <span>
                        {streakMilestoneEval.daysToNextMilestone} days until your first 7-Day Streak Badge (<span dir="ltr" className="ltr-inline font-mono">AG-STRK-007</span>)
                      </span>
                    ) : (
                      <span>
                        {streakMilestoneEval.daysToNextMilestone} روز دیگر تا کسب اولین نشان پیوستگی ۷ روزه (<span dir="ltr" className="ltr-inline font-mono">AG-STRK-007</span>)
                      </span>
                    )}
                  </div>
                  <div dir="ltr" className="ltr-inline text-[11px] font-mono text-slate-400">
                    localStorage: {DAILY_STREAK_STORAGE_KEY} · Synced
                  </div>
                </div>
              </div>

              {/* Streak Action Controls (+1 Day & Milestone Presets) */}
              <div className="flex flex-col items-stretch sm:items-end gap-2 shrink-0">
                <button
                  type="button"
                  data-testid="streak-increment-day-btn"
                  onClick={handleIncrementConsecutiveStreakDay}
                  className="px-3.5 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-extrabold flex items-center justify-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>
                    {language === 'en' ? 'Log Consecutive Day' : 'ثبت روز متوالی جدید'}
                  </span>
                  <span dir="ltr" className="ltr-inline font-mono text-[11px]">
                    (+1 Day Streak)
                  </span>
                </button>

                <div
                  dir="ltr"
                  className="ltr-inline inline-flex items-center gap-1"
                  data-testid="streak-milestone-presets"
                >
                  {[
                    { days: 7, label: '7d' },
                    { days: 30, label: '30d' },
                    { days: 100, label: '100d' },
                  ].map((preset) => (
                    <button
                      key={preset.days}
                      type="button"
                      data-testid={`streak-preset-${preset.days}`}
                      onClick={() => handleSetStreakMilestonePreset(preset.days)}
                      className={`px-2.5 py-1 rounded text-[11px] font-mono font-bold transition-colors cursor-pointer ${
                        streakStats.currentStreakDays === preset.days
                          ? 'bg-emerald-500 text-slate-950'
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                  <button
                    type="button"
                    data-testid="streak-preset-reset"
                    onClick={() => handleSetStreakMilestonePreset(5)}
                    className="px-2 py-1 rounded text-[11px] font-mono text-slate-400 hover:text-white bg-slate-900 border border-slate-800 cursor-pointer"
                  >
                    5d
                  </button>
                </div>
              </div>
            </div>

            {/* Progress Bar toward Next Milestone (7 -> 30 -> 100 Days) */}
            <div className="space-y-1.5 pt-2 border-t border-slate-800/60">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-600 dark:text-slate-300 font-semibold">
                  {streakMilestoneEval.nextMilestoneDays
                    ? language === 'en'
                      ? `Progress to ${streakMilestoneEval.nextMilestoneDays}-Day Milestone (${streakMilestoneEval.daysToNextMilestone} days remaining)`
                      : `پیشرفت تا نقطه عطف ${streakMilestoneEval.nextMilestoneDays} روزه (${streakMilestoneEval.daysToNextMilestone} روز باقی‌مانده)`
                    : language === 'en'
                    ? 'All 7, 30, and 100-Day Streak Milestones Unlocked!'
                    : 'تمامی نقاط عطف ۷، ۳۰ و ۱۰۰ روزه با موفقیت فتح شدند!'}
                </span>
                <span
                  dir="ltr"
                  data-testid="streak-next-milestone-progress-label"
                  className="ltr-inline font-mono text-xs font-bold text-amber-400 tabular-nums"
                >
                  {streakStats.currentStreakDays} / {streakMilestoneEval.nextMilestoneDays ?? 100} Days ({streakMilestoneEval.nextMilestoneProgressPercent}%)
                </span>
              </div>
              <div className="w-full h-2.5 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                <div
                  data-testid="streak-next-milestone-progress-bar"
                  className="h-full rounded-full bg-gradient-to-r from-amber-500 via-emerald-500 to-blue-500 transition-all duration-300"
                  style={{ width: `${Math.max(4, streakMilestoneEval.nextMilestoneProgressPercent)}%` }}
                />
              </div>
            </div>
          </div>

          {/* 7, 30, and 100-Day Milestone Badges Row */}
          <div
            className="grid grid-cols-1 sm:grid-cols-3 gap-3"
            data-testid="streak-milestone-badges-grid"
          >
            {streakMilestoneEval.milestones.map((badge) => {
              const tierStyles =
                badge.tier === 'Mythic'
                  ? badge.unlocked
                    ? 'border-amber-500/70 bg-amber-500/10'
                    : 'border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/60 opacity-75'
                  : badge.tier === 'Gold'
                  ? badge.unlocked
                    ? 'border-emerald-500/60 bg-emerald-500/10'
                    : 'border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/60 opacity-75'
                  : badge.unlocked
                  ? 'border-blue-500/60 bg-blue-500/10'
                  : 'border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/60 opacity-75';

              return (
                <div
                  key={badge.badgeId}
                  data-testid={`streak-milestone-badge-${badge.thresholdDays}`}
                  data-unlocked={badge.unlocked ? 'true' : 'false'}
                  className={`rounded-xl border p-3.5 flex flex-col justify-between space-y-2.5 transition-all ${tierStyles}`}
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between gap-1.5 text-[11px] font-mono" dir="ltr">
                      <span className="font-bold text-slate-700 dark:text-slate-200">
                        {badge.badgeCode} · {badge.thresholdDays}D
                      </span>
                      <span className="font-extrabold text-emerald-500 tabular-nums">
                        +{badge.bonusXp} XP
                      </span>
                    </div>

                    <div className="flex items-start gap-2 pt-0.5">
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                          badge.unlocked
                            ? badge.tier === 'Mythic'
                              ? 'bg-amber-500 text-slate-950'
                              : badge.tier === 'Gold'
                              ? 'bg-emerald-500 text-slate-950'
                              : 'bg-blue-600 text-white'
                            : 'bg-slate-200 dark:bg-slate-800 text-slate-400'
                        }`}
                      >
                        {badge.unlocked ? (
                          <Trophy className="w-4 h-4" />
                        ) : (
                          <Lock className="w-3.5 h-3.5" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-extrabold text-slate-900 dark:text-white leading-5">
                          {language === 'en' ? badge.titleEn : badge.titleFa}
                        </div>
                        <div
                          dir="ltr"
                          className="ltr-inline text-[10px] font-mono text-blue-500 leading-4 block mt-0.5"
                        >
                          {badge.titleEn}
                        </div>
                      </div>
                    </div>

                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-5">
                      {language === 'en'
                        ? STREAK_DESC_EN_MAP[badge.thresholdDays] || badge.descriptionFa
                        : badge.descriptionFa}
                    </p>
                  </div>

                  <div className="space-y-1 pt-2 border-t border-slate-200/70 dark:border-slate-800/80">
                    <div className="flex items-center justify-between text-[10px] font-mono" dir="ltr">
                      <span
                        data-testid={`streak-milestone-status-${badge.thresholdDays}`}
                        className={
                          badge.unlocked
                            ? 'font-extrabold text-emerald-500'
                            : 'text-slate-400'
                        }
                      >
                        {badge.unlocked
                          ? 'UNLOCKED ✓'
                          : `${badge.daysRemaining}d REMAINING`}
                      </span>
                      <span className="text-slate-400 tabular-nums">
                        {badge.progressPercent}%
                      </span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          badge.unlocked ? 'bg-emerald-500' : 'bg-blue-500'
                        }`}
                        style={{ width: `${badge.progressPercent}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* 7-Day Activity Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-7 gap-2.5">
            {studyDays.map((day) => (
              <button
                key={day.dateIso}
                type="button"
                onClick={() => handleToggleStudyDay(day.dateIso)}
                className={`p-3 rounded-xl border text-center transition-all cursor-pointer space-y-1.5 ${
                  day.active
                    ? 'border-amber-500/50 bg-amber-500/10 text-slate-900 dark:text-white'
                    : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 text-slate-400 opacity-75 hover:opacity-100'
                }`}
              >
                <div className="text-[11px] font-bold truncate">
                  {translateDayLabel(day.dayLabelFa, language)}
                </div>
                <div dir="ltr" className="ltr-inline text-[10px] font-mono text-slate-500 block">
                  {day.dateIso.slice(5)}
                </div>
                <div className="flex items-center justify-center py-1">
                  <Flame
                    className={`w-5 h-5 ${
                      day.active ? 'text-amber-500' : 'text-slate-400 dark:text-slate-700'
                    }`}
                  />
                </div>
                <div dir="ltr" className="ltr-inline text-xs font-mono font-bold tabular-nums block">
                  {day.minutesStudied}m
                </div>
              </button>
            ))}
          </div>

          {/* Log Study Session Bar */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/60 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="space-y-0.5">
              <div className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-blue-500" />
                <span>
                  {language === 'en'
                    ? "Log a New Study Session into Today's Report:"
                    : 'ثبت جلسه مطالعه جدید در کارنامه امروز:'}
                </span>
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">
                {language === 'en' ? (
                  <>
                    Weekly Study Total: <span dir="ltr" className="ltr-inline font-mono font-bold text-slate-700 dark:text-slate-200">{streakStats.totalMinutesStudied} mins</span> across <span dir="ltr" className="ltr-inline font-mono font-bold text-slate-700 dark:text-slate-200">{streakStats.activeDaysCount}</span> active days
                  </>
                ) : (
                  <>
                    مجموع زمان مطالعه هفتگی: <span dir="ltr" className="ltr-inline font-mono font-bold text-slate-700 dark:text-slate-200">{streakStats.totalMinutesStudied} mins</span> در <span dir="ltr" className="ltr-inline font-mono font-bold text-slate-700 dark:text-slate-200">{streakStats.activeDaysCount}</span> روز فعال
                  </>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <label htmlFor="session-minutes-input" className="sr-only">
                {language === 'en' ? 'Study duration in minutes' : 'مدت زمان مطالعه به دقیقه'}
              </label>
              <input
                id="session-minutes-input"
                type="number"
                min={5}
                max={240}
                step={5}
                dir="ltr"
                value={sessionMinutesInput}
                onChange={(e) => setSessionMinutesInput(Number(e.target.value))}
                className="ltr-code w-20 px-2.5 py-1.5 text-xs font-mono rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
              />
              <span className="text-xs text-slate-500">
                {language === 'en' ? 'mins' : 'دقیقه'}
              </span>
              <button
                type="button"
                onClick={handleLogStudySession}
                className="px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>{language === 'en' ? 'Log Study Session' : 'ثبت جلسه مطالعه'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Personalization Form for Report Card (5 Cols) */}
        <div className="lg:col-span-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/75 p-6 space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3.5">
            <UserCheck className="w-5 h-5 text-blue-500 shrink-0" />
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                {language === 'en'
                  ? 'Personalize Report Card & Certificate'
                  : 'شخصی‌سازی کارنامه و گواهینامه'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {language === 'en'
                  ? 'Your profile details are rendered live on the official certificate card and shareable transcript'
                  : 'اطلاعات شما به صورت زنده روی کارت گواهینامه و خروجی اشتراک‌گذاری درج می‌شود'}
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <label htmlFor="architect-name-input" className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                <span>
                  {language === 'en' ? 'Architect Full Name:' : 'نام و نام خانوادگی معمار:'}
                </span>
                <span dir="ltr" className="ltr-inline font-mono text-[11px] text-slate-500">Candidate Name</span>
              </label>
              <input
                id="architect-name-input"
                type="text"
                value={displayArchitectName}
                onChange={(e) => setArchitectName(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label htmlFor="architect-role-input" className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                <span>
                  {language === 'en' ? 'Engineering Role & Title:' : 'عنوان شغلی و تخصصی:'}
                </span>
                <span dir="ltr" className="ltr-inline font-mono text-[11px] text-slate-500">Engineering Title</span>
              </label>
              <input
                id="architect-role-input"
                type="text"
                dir="ltr"
                value={roleTitle}
                onChange={(e) => setRoleTitle(e.target.value)}
                className="ltr-code w-full px-3 py-2 text-xs font-mono rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label htmlFor="architect-org-input" className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                <span>{language === 'en' ? 'Team or Organization:' : 'تیم یا سازمان:'}</span>
                <span dir="ltr" className="ltr-inline font-mono text-[11px] text-slate-500">Organization / Team</span>
              </label>
              <input
                id="architect-org-input"
                type="text"
                dir="ltr"
                value={organization}
                onChange={(e) => setOrganization(e.target.value)}
                className="ltr-code w-full px-3 py-2 text-xs font-mono rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white"
              />
            </div>
          </div>
        </div>
      </div>

      {/* NEW: D3.js Powered Calendar Heatmap (Academy & Studios Study Streak Activity) */}
      <div
        className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/75 p-6 sm:p-8 space-y-6"
        data-testid="d3-study-streak-heatmap"
      >
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-emerald-500/15 border border-emerald-500/40 flex items-center justify-center text-emerald-500 shrink-0">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                  {language === 'en'
                    ? 'Study Streak & Studio Activity Calendar Heatmap (D3.js Calendar Heatmap)'
                    : 'نقشه حرارتی تقویم پیوستگی مطالعه و فعالیت استودیوها (D3.js Calendar Heatmap)'}
                </h2>
                <span
                  dir="ltr"
                  data-testid="heatmap-active-days-badge"
                  className="ltr-inline px-2.5 py-0.5 rounded-md bg-emerald-500/20 text-emerald-500 text-xs font-mono font-extrabold tabular-nums"
                >
                  {heatmapSummary.activeDaysCount} / {heatmapSummary.cells.length} ACTIVE DAYS
                </span>
              </div>
              <div dir="ltr" className="ltr-inline text-xs font-mono text-slate-500 dark:text-slate-400 mt-0.5">
                D3.js SVG Activity Matrix · {heatmapWeeksCount}-Week Academy Curriculum &amp; Interactive Studio Telemetry
              </div>
            </div>
          </div>

          {/* Window Switcher (12W / 24W) + Filter Pills by Activity Domain */}
          <div className="flex flex-wrap items-center gap-2">
            <div
              dir="ltr"
              className="ltr-inline inline-flex items-center rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-950 p-0.5"
              data-testid="heatmap-window-selector"
            >
              {([12, 24] as const).map((weeks) => (
                <button
                  key={weeks}
                  type="button"
                  data-testid={`heatmap-weeks-${weeks}`}
                  onClick={() => setHeatmapWeeksCount(weeks)}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-mono font-bold transition-colors cursor-pointer ${
                    heatmapWeeksCount === weeks
                      ? 'bg-emerald-600 text-white'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {weeks}W ({weeks * 7}d)
                </button>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-1.5" data-testid="heatmap-domain-filters">
              {[
                { id: 'all' as const, labelFa: 'همه فعالیت‌ها', labelEn: 'All' },
                { id: 'both' as const, labelFa: 'تلفیقی (آکادمی + استودیو)', labelEn: 'Academy + Studios' },
                { id: 'academy' as const, labelFa: 'مطالعه آکادمی', labelEn: 'Academy Only' },
                { id: 'studios' as const, labelFa: 'آزمایشگاه استودیو', labelEn: 'Studios Only' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  data-testid={`heatmap-filter-${tab.id}`}
                  onClick={() => setHeatmapFilterSource(tab.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
                    heatmapFilterSource === tab.id
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-950 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
                  }`}
                >
                  <span>{language === 'en' ? tab.labelEn : tab.labelFa}</span>
                  {language === 'fa' && (
                    <span dir="ltr" className="ltr-inline font-mono text-[10px] opacity-80">
                      ({tab.labelEn})
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Summary KPI Strip for 12-Week Heatmap */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/60">
            <div className="text-[11px] text-slate-500 dark:text-slate-400">
              {language === 'en'
                ? 'Combined Days (Academy + Studios)'
                : 'روزهای تلفیقی (Academy + Studios)'}
            </div>
            <div dir="ltr" className="ltr-inline text-lg font-mono font-extrabold text-emerald-500 mt-0.5 tabular-nums">
              {heatmapSummary.bothActiveDaysCount} Days
            </div>
          </div>

          <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/60">
            <div className="text-[11px] text-slate-500 dark:text-slate-400">
              {language === 'en'
                ? 'Academy Curriculum Study Days'
                : 'روزهای مطالعه ماژول‌های آکادمی'}
            </div>
            <div dir="ltr" className="ltr-inline text-lg font-mono font-extrabold text-blue-500 mt-0.5 tabular-nums">
              {heatmapSummary.academyOnlyDaysCount} Days
            </div>
          </div>

          <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/60">
            <div className="text-[11px] text-slate-500 dark:text-slate-400">
              {language === 'en'
                ? 'Hands-On Studio Practice Days'
                : 'روزهای تمرین در استودیوهای عملی'}
            </div>
            <div dir="ltr" className="ltr-inline text-lg font-mono font-extrabold text-indigo-400 mt-0.5 tabular-nums">
              {heatmapSummary.studiosOnlyDaysCount} Days
            </div>
          </div>

          <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/60">
            <div className="text-[11px] text-slate-500 dark:text-slate-400">
              {language === 'en'
                ? `Total ${heatmapWeeksCount}-Week Window Activity`
                : 'مجموع فعالیت ۱۲ هفته اخیر'}
            </div>
            <div dir="ltr" className="ltr-inline text-lg font-mono font-extrabold text-amber-500 mt-0.5 tabular-nums">
              {heatmapSummary.totalMinutesInWindow}m · {heatmapSummary.totalStudioRunsInWindow} Runs
            </div>
          </div>
        </div>

        {/* D3 SVG Canvas + Selected Day Telemetry Inspector */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* D3 SVG Matrix Container (7 Cols) */}
          <div className="lg:col-span-7 rounded-xl border border-slate-800 bg-slate-950 p-4 sm:p-5 flex flex-col justify-between space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span dir="ltr" className="ltr-inline text-xs font-mono font-bold text-slate-300">
                D3.JS CALENDAR MATRIX (84 DAYS · CLICK ANY CELL TO INSPECT OR TOGGLE)
              </span>
              <span dir="ltr" className="ltr-inline text-[11px] font-mono text-emerald-400">
                d3.scaleBand + d3.scaleThreshold
              </span>
            </div>

            <div dir="ltr" className="w-full overflow-x-auto py-1">
              <svg
                ref={heatmapSvgRef}
                data-testid="d3-calendar-heatmap-svg"
                className="w-full min-w-[340px] max-w-full h-auto select-none"
                role="img"
                aria-label="D3.js Study Streak Calendar Heatmap"
              />
            </div>

            {/* Color Legend */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800/80 text-[11px] text-slate-400">
              <div className="flex flex-wrap items-center gap-3">
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-sm bg-slate-800 border border-slate-700 inline-block" />
                  <span>{language === 'en' ? 'Rest (No Activity)' : 'بدون فعالیت (Rest)'}</span>
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-sm bg-blue-500 inline-block" />
                  <span>{language === 'en' ? 'Academy' : 'آکادمی (Academy)'}</span>
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-sm bg-indigo-500 inline-block" />
                  <span>{language === 'en' ? 'Studios' : 'استودیو (Studios)'}</span>
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-sm bg-emerald-400 inline-block" />
                  <span>
                    {language === 'en' ? 'Combined (Academy + Studios)' : 'تلفیقی (Academy + Studios)'}
                  </span>
                </span>
              </div>
              <div dir="ltr" className="ltr-inline font-mono text-[10px] text-slate-500">
                Peak Day: {heatmapSummary.maxDailyMinutes} mins
              </div>
            </div>
          </div>

          {/* Selected Day Telemetry Inspector (5 Cols) */}
          <div
            data-testid="d3-heatmap-day-inspector"
            className="lg:col-span-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/70 p-5 flex flex-col justify-between space-y-4"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
                <div>
                  <div className="text-xs font-bold text-slate-500 dark:text-slate-400">
                    {language === 'en'
                      ? 'Selected Day Telemetry Inspector in D3 Map:'
                      : 'بازرس تله‌متری روز انتخاب‌شده در نقشه D3:'}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-base font-extrabold text-slate-900 dark:text-white">
                      {translateDayLabel(selectedHeatmapCell.dayLabelFa, language)}
                    </span>
                    <span
                      dir="ltr"
                      data-testid="selected-heatmap-date"
                      className="ltr-inline text-xs font-mono font-bold px-2 py-0.5 rounded bg-blue-500/15 text-blue-600 dark:text-blue-400"
                    >
                      {selectedHeatmapCell.dateIso}
                    </span>
                  </div>
                </div>

                <span
                  dir="ltr"
                  data-testid="selected-heatmap-source-badge"
                  className={`ltr-inline px-2.5 py-1 rounded-md text-[11px] font-mono font-extrabold uppercase ${
                    selectedHeatmapCell.activitySource === 'both'
                      ? 'bg-emerald-500/20 text-emerald-500 border border-emerald-500/40'
                      : selectedHeatmapCell.activitySource === 'studios'
                      ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/40'
                      : selectedHeatmapCell.activitySource === 'academy'
                      ? 'bg-blue-500/20 text-blue-400 border border-blue-500/40'
                      : 'bg-slate-200 dark:bg-slate-800 text-slate-500'
                  }`}
                >
                  {selectedHeatmapCell.activitySource === 'both'
                    ? 'ACADEMY + STUDIOS'
                    : selectedHeatmapCell.activitySource === 'studios'
                    ? 'STUDIOS LAB'
                    : selectedHeatmapCell.activitySource === 'academy'
                    ? 'ACADEMY STUDY'
                    : 'REST DAY'}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2.5 text-center">
                <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                  <div
                    dir="ltr"
                    data-testid="selected-heatmap-minutes"
                    className="ltr-inline text-base font-mono font-black text-blue-500 tabular-nums"
                  >
                    {selectedHeatmapCell.minutesStudied}m
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">
                    {language === 'en' ? 'Academy Study' : 'مطالعه آکادمی'}
                  </div>
                </div>

                <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                  <div
                    dir="ltr"
                    data-testid="selected-heatmap-studio-runs"
                    className="ltr-inline text-base font-mono font-black text-indigo-400 tabular-nums"
                  >
                    {selectedHeatmapCell.studioRuns}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">
                    {language === 'en' ? 'Studio Runs' : 'اجرای استودیو'}
                  </div>
                </div>

                <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                  <div
                    dir="ltr"
                    data-testid="selected-heatmap-xp"
                    className="ltr-inline text-base font-mono font-black text-emerald-500 tabular-nums"
                  >
                    +{selectedHeatmapCell.xpEarned} XP
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">
                    {language === 'en' ? 'Day XP' : 'امتیاز روز'}
                  </div>
                </div>
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-300 leading-6">
                {selectedHeatmapCell.active
                  ? language === 'en'
                    ? `On ${selectedHeatmapCell.dateIso}, you logged ${selectedHeatmapCell.minutesStudied} minutes of Academy module study and executed ${selectedHeatmapCell.studioRuns} interactive studio runs.`
                    : `در تاریخ ${selectedHeatmapCell.dateIso}، شما به مدت ${selectedHeatmapCell.minutesStudied} دقیقه در ماژول‌های آکادمی مطالعه داشته و ${selectedHeatmapCell.studioRuns} بار سناریوهای استودیو را اجرا کرده‌اید.`
                  : language === 'en'
                  ? `No activity logged on ${selectedHeatmapCell.dateIso}. Use the controls below to assign an activity domain (Academy, Studios, or Both) for this day.`
                  : `در تاریخ ${selectedHeatmapCell.dateIso} فعالیتی ثبت نشده است. با دکمه‌های زیر می‌توانید نوع فعالیت (آکادمی، استودیو یا تلفیقی) را برای این روز ثبت کنید.`}
              </p>

              {/* Quick Activity Mode Selector for Selected Day */}
              <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-2">
                <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                  {language === 'en'
                    ? 'Set Day Activity Domain Directly:'
                    : 'تنظیم مستقیم نوع فعالیت برای این روز (Set Day Activity Domain):'}
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                  {[
                    {
                      mode: 'academy' as const,
                      labelFa: 'فقط آکادمی',
                      labelEn: 'Academy',
                      activeClass: 'bg-blue-600 text-white border-blue-500',
                    },
                    {
                      mode: 'studios' as const,
                      labelFa: 'فقط استودیو',
                      labelEn: 'Studios',
                      activeClass: 'bg-indigo-600 text-white border-indigo-500',
                    },
                    {
                      mode: 'both' as const,
                      labelFa: 'تلفیقی کامل',
                      labelEn: 'Both',
                      activeClass: 'bg-emerald-600 text-white border-emerald-500',
                    },
                    {
                      mode: 'none' as const,
                      labelFa: 'استراحت',
                      labelEn: 'Rest',
                      activeClass: 'bg-slate-700 text-white border-slate-600',
                    },
                  ].map((item) => (
                    <button
                      key={item.mode}
                      type="button"
                      data-testid={`set-heatmap-mode-${item.mode}`}
                      onClick={() => handleSetHeatmapCellMode(selectedHeatmapCell, item.mode)}
                      className={`px-2 py-1.5 rounded-lg text-[11px] font-bold border transition-colors cursor-pointer flex flex-col items-center justify-center ${
                        selectedHeatmapCell.activitySource === item.mode
                          ? item.activeClass
                          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:border-blue-500/40'
                      }`}
                    >
                      <span>{language === 'en' ? item.labelEn : item.labelFa}</span>
                      {language === 'fa' && (
                        <span dir="ltr" className="ltr-inline text-[9px] font-mono opacity-80">
                          {item.labelEn}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <button
              type="button"
              data-testid="toggle-heatmap-day-btn"
              onClick={() => handleToggleHeatmapCellActivity(selectedHeatmapCell)}
              className={`w-full py-2.5 px-4 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-2 ${
                selectedHeatmapCell.active
                  ? 'bg-slate-200 dark:bg-slate-800 hover:bg-rose-500/20 text-slate-700 dark:text-slate-200 hover:text-rose-400'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white'
              }`}
            >
              <Flame className="w-4 h-4" />
              <span>
                {selectedHeatmapCell.active
                  ? language === 'en'
                    ? 'Clear Day Activity in Heatmap'
                    : 'پاک کردن فعالیت این روز در نقشه حرارتی (Clear Day Activity)'
                  : language === 'en'
                  ? 'Log Active Academy + Studio Day'
                  : 'ثبت فعالیت آکادمی و استودیو برای این روز (Log Active Day)'}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* NEW: Rare Digital Trophy Case (100% Curriculum Mastery & High-Difficulty Mission Scenarios) */}
      <div
        className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/75 p-6 sm:p-8 space-y-6"
        data-testid="trophy-case-section"
      >
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-amber-500/15 border border-amber-500/40 flex items-center justify-center text-amber-500 shrink-0">
              <Crown className="w-5 h-5" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                  {language === 'en'
                    ? 'Rare Digital Trophy Case'
                    : 'ویترین تندیس‌های نادر دیجیتال'}
                </h2>
                <span
                  dir="ltr"
                  data-testid="trophy-unlocked-counter"
                  className="ltr-inline px-2.5 py-0.5 rounded-md bg-amber-500/20 text-amber-500 text-xs font-mono font-extrabold tabular-nums"
                >
                  {trophyCase.unlockedCount} / {trophyCase.totalTrophies} UNLOCKED
                </span>
              </div>
              <div dir="ltr" className="ltr-inline text-xs font-mono text-amber-500/90 mt-0.5">
                Rare Digital Trophy Case · 100% Curriculum Mastery &amp; High-Difficulty Mission Scenarios
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div dir="ltr" className="ltr-inline text-xs font-mono font-bold text-emerald-500 tabular-nums">
              +{trophyCase.trophyBonusXp} Bonus Trophy XP
            </div>
            {!trophyCase.allUnlocked && (
              <button
                type="button"
                onClick={handleUnlockAllTrophies}
                className="px-3.5 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-extrabold transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1.5"
              >
                <Trophy className="w-3.5 h-3.5" />
                <span>
                  {language === 'en' ? 'Unlock All Rare Trophies' : 'فتح تمام تندیس‌های نادر'}
                </span>
              </button>
            )}
          </div>
        </div>

        {/* Trophy Pedestals Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {trophyCase.trophies.map((trophy) => {
            const isMythic = trophy.rarity === 'Mythic';
            const isLegendary = trophy.rarity === 'Legendary';

            const rarityBadgeStyle = isMythic
              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
              : isLegendary
              ? 'bg-purple-500/20 text-purple-400 border border-purple-500/40'
              : 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40';

            const activeCardBorder = trophy.unlocked
              ? isMythic
                ? 'border-amber-500/60 bg-gradient-to-br from-amber-500/10 via-slate-900/40 to-slate-950/60'
                : isLegendary
                ? 'border-purple-500/50 bg-purple-500/5 dark:bg-purple-500/10'
                : 'border-cyan-500/50 bg-cyan-500/5 dark:bg-cyan-500/10'
              : 'border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/50 opacity-75';

            return (
              <div
                key={trophy.trophyId}
                data-testid={`trophy-card-${trophy.trophyId}`}
                className={`rounded-xl border p-5 flex flex-col justify-between transition-all space-y-4 overflow-hidden ${activeCardBorder} ${
                  isMythic ? 'md:col-span-2 lg:col-span-1' : ''
                }`}
              >
                <div className="space-y-3">
                  {/* Top Meta Row: Code + Rarity + Bonus XP */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <span
                        dir="ltr"
                        className={`ltr-inline text-[10px] font-mono font-extrabold px-2 py-0.5 rounded uppercase ${rarityBadgeStyle}`}
                      >
                        {trophy.rarity}
                      </span>
                      <span dir="ltr" className="ltr-inline text-[11px] font-mono text-slate-500">
                        {trophy.code}
                      </span>
                    </div>
                    <span dir="ltr" className="ltr-inline text-xs font-mono font-bold text-emerald-500 tabular-nums">
                      +{trophy.bonusXp} XP
                    </span>
                  </div>

                  {/* Trophy Emblem & Title */}
                  <div className="flex items-start gap-3 pt-1">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
                        trophy.unlocked
                          ? isMythic
                            ? 'bg-amber-500 text-slate-950 border-amber-400'
                            : isLegendary
                            ? 'bg-purple-600 text-white border-purple-400'
                            : 'bg-cyan-600 text-white border-cyan-400'
                          : 'bg-slate-200 dark:bg-slate-800 text-slate-400 border-slate-300 dark:border-slate-700'
                      }`}
                    >
                      {trophy.unlocked ? (
                        isMythic ? (
                          <Crown className="w-5 h-5" />
                        ) : (
                          <Trophy className="w-5 h-5" />
                        )
                      ) : (
                        <Lock className="w-4 h-4" />
                      )}
                    </div>

                    <div className="space-y-1 min-w-0 flex-1">
                      <h3 className="text-sm font-extrabold text-slate-900 dark:text-white leading-5">
                        {language === 'en' ? trophy.titleEn : trophy.titleFa}
                      </h3>
                      <div
                        dir="ltr"
                        className={`text-[11px] font-mono text-blue-500 truncate ${
                          language === 'en' ? 'text-left' : 'text-right'
                        }`}
                      >
                        {trophy.titleEn}
                      </div>
                    </div>
                  </div>

                  {/* Scenario or Mastery Requirement Pill */}
                  <div
                    dir="ltr"
                    className="ltr-code text-[10px] font-mono px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-slate-600 dark:text-slate-300"
                  >
                    {trophy.scenarioOrRequirementEn}
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-6">
                    {language === 'en'
                      ? TROPHY_DESC_EN_MAP[trophy.trophyId] || trophy.descriptionFa
                      : trophy.descriptionFa}
                  </p>
                </div>

                {/* Action Footer */}
                <div className="pt-3 border-t border-slate-200/70 dark:border-slate-800/80 flex items-center justify-between gap-2">
                  <span
                    dir="ltr"
                    className={`ltr-inline text-[10px] font-mono font-bold ${
                      trophy.unlocked ? 'text-emerald-500' : 'text-slate-400'
                    }`}
                  >
                    {trophy.unlocked ? 'UNLOCKED IN VAULT' : 'LOCKED CHALLENGE'}
                  </span>

                  {trophy.unlockConditionType === 'all-modules' ? (
                    <button
                      type="button"
                      onClick={onCompleteAllModules}
                      disabled={trophy.unlocked}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                        trophy.unlocked
                          ? 'bg-emerald-500/20 text-emerald-500 cursor-default'
                          : 'bg-amber-500 hover:bg-amber-400 text-slate-950 cursor-pointer'
                      }`}
                    >
                      {trophy.unlocked
                        ? language === 'en'
                          ? '100% Mastery Verified'
                          : 'تسلط ۱۰۰٪ احراز شد'
                        : language === 'en'
                        ? 'Complete 100% Modules'
                        : 'تکمیل ۱۰۰٪ کل ماژول‌ها'}
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleToggleScenarioTrophy(trophy.trophyId)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
                        trophy.unlocked
                          ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 hover:bg-emerald-500/30'
                          : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-blue-600 hover:text-white'
                      }`}
                    >
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>
                        {trophy.unlocked
                          ? language === 'en'
                            ? 'Scenario Mastered'
                            : 'سناریو فتح شد'
                          : language === 'en'
                          ? 'Log Scenario Mastery'
                          : 'ثبت تکمیل سناریو'}
                      </span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Section 2: 8 Module Competency Badges Grid */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/75 p-6 sm:p-8 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-4">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
              {language === 'en'
                ? '8-Module Competency Badges'
                : 'نشان‌های مهارت ماژول‌های ۸گانه (Module Competency Badges)'}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {language === 'en'
                ? 'Completing each module unlocks its specialized architecture competency badge and XP in your report card'
                : 'تکمیل هر فصل، نشان تخصصی مربوط به آن معماری و امتیاز XP آن را در کارنامه شما فعال می‌کند'}
            </p>
          </div>
          <div dir="ltr" className="ltr-inline text-xs font-mono text-blue-500 font-semibold">
            {metrics.completedCount} of {metrics.totalModules} Badges Unlocked ({metrics.completionPercentage}%)
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {metrics.badges.map((badge) => (
            <div
              key={badge.moduleId}
              className={`rounded-xl border p-4 flex flex-col justify-between transition-all space-y-4 ${
                badge.unlocked
                  ? 'border-blue-500/50 bg-blue-500/5 dark:bg-blue-500/10'
                  : 'border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/50 opacity-75'
              }`}
            >
              <div className="space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <span
                    dir="ltr"
                    className={`ltr-inline text-[11px] font-mono font-bold px-2 py-0.5 rounded ${
                      badge.unlocked
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-200 dark:bg-slate-800 text-slate-500'
                    }`}
                  >
                    {badge.badgeCode}
                  </span>
                  <span dir="ltr" className="ltr-inline text-xs font-mono font-semibold text-emerald-500 tabular-nums">
                    +{badge.xpValue} XP
                  </span>
                </div>

                <div className="flex items-start gap-2.5 pt-1">
                  {badge.unlocked ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                  ) : (
                    <Lock className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-5">
                      {language === 'en' ? badge.badgeTitleEn : badge.badgeTitleFa}
                    </h3>
                    <div dir="ltr" className="text-[11px] font-mono text-blue-600 dark:text-blue-400 mt-0.5">
                      {badge.badgeTitleEn}
                    </div>
                  </div>
                </div>

                <div
                  dir="ltr"
                  className="text-[11px] font-mono text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-200/70 dark:border-slate-800/70"
                >
                  {badge.competencyDomain}
                </div>
              </div>

              <div className="flex items-center justify-between gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => onToggleModuleComplete(badge.moduleId)}
                  className={`px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer ${
                    badge.unlocked
                      ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 hover:bg-emerald-500/30'
                      : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-blue-600 hover:text-white'
                  }`}
                >
                  {badge.unlocked
                    ? language === 'en'
                      ? 'Unlocked'
                      : 'کسب‌شده (Unlocked)'
                    : language === 'en'
                    ? 'Unlock Badge'
                    : 'فعالسازی نشان'}
                </button>
                <button
                  type="button"
                  onClick={() => onNavigateToModule(badge.moduleId)}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                >
                  <span>
                    {language === 'en'
                      ? `View Module ${badge.moduleNumber}`
                      : `مشاهده فصل ${badge.moduleNumber}`}
                  </span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* Section 2.5: Reached Milestone History & Vertical Timeline Component       */}
      {/* ========================================================================= */}
      <div
        className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/80 backdrop-blur-md p-6 sm:p-8 space-y-6 shadow-sm"
        data-testid="milestone-history-section"
      >
        {/* Section Header & Storage Telemetry */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-md text-[10px] font-mono font-bold uppercase tracking-wider bg-cyan-500/10 border border-cyan-500/30 text-cyan-600 dark:text-cyan-400">
                VERIFIED XP MILESTONES
              </span>
              <span className="hidden sm:inline-block text-slate-400">·</span>
              <span
                dir="ltr"
                className="hidden sm:inline-block ltr-inline text-[11px] font-mono text-slate-500 dark:text-slate-400"
              >
                Key: {XP_MILESTONES_STORAGE_KEY}
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2.5 mt-1">
              <Trophy className="w-5 h-5 text-amber-500 shrink-0" />
              <span>
                {language === 'en'
                  ? 'Milestone History & Vertical Timeline'
                  : 'تاریخچه نقاط عطف و خط زمانی عمودی XP (Milestone History)'}
              </span>
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-400 max-w-3xl leading-relaxed">
              {language === 'en'
                ? 'Chronological progression of verified Antigravity XP milestone thresholds and architectural principles fetched from persistent storage keys.'
                : 'مسیر زمانی پیشرفت نقاط عطف امتیاز تجربه (XP) و اصول معماری Antigravity که مستقیماً از کلیدهای ذخیره‌سازی پایدار مرورگر فراخوانی شده است.'}
            </p>
          </div>

          {/* Quick Metrics & Storage Sync Button */}
          <div className="flex flex-wrap items-center gap-2.5 self-start lg:self-center">
            {/* Unlocked Counter Pill */}
            <div className="px-3 py-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-mono font-bold flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" />
              <span>
                {unlockedMilestonesCount} / {XP_MILESTONE_THRESHOLDS.length}{' '}
                {language === 'en' ? 'Unlocked' : 'نقطه عطف ثبت‌شده'}
              </span>
            </div>

            {/* Storage Refresh Button */}
            <button
              type="button"
              onClick={handleRefreshMilestonesFromStorage}
              data-testid="refresh-milestones-btn"
              title={language === 'en' ? 'Refresh from Storage' : 'بازخوانی از حافظه محلی'}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-cyan-500 transition-colors cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Filter Controls Row */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 text-xs">
            <button
              type="button"
              onClick={() => setMilestoneFilter('all')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer ${
                milestoneFilter === 'all'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-2xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {language === 'en'
                ? `All (${XP_MILESTONE_THRESHOLDS.length})`
                : `همه (${XP_MILESTONE_THRESHOLDS.length})`}
            </button>
            <button
              type="button"
              onClick={() => setMilestoneFilter('unlocked')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer ${
                milestoneFilter === 'unlocked'
                  ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-2xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {language === 'en'
                ? `Reached (${unlockedMilestonesCount})`
                : `آزادشده (${unlockedMilestonesCount})`}
            </button>
            <button
              type="button"
              onClick={() => setMilestoneFilter('locked')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer ${
                milestoneFilter === 'locked'
                  ? 'bg-white dark:bg-slate-800 text-amber-600 dark:text-amber-400 shadow-2xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {language === 'en'
                ? `Upcoming (${XP_MILESTONE_THRESHOLDS.length - unlockedMilestonesCount})`
                : `در انتظار (${XP_MILESTONE_THRESHOLDS.length - unlockedMilestonesCount})`}
            </button>
          </div>

          <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
            <span>{language === 'en' ? 'Synced with Local Storage' : 'همگام با حافظه کلاینت'}</span>
          </div>
        </div>

        {/* The Vertical Timeline Component */}
        <div
          className="relative pt-4 pb-2"
          data-testid="milestone-vertical-timeline"
        >
          {/* Vertical Backbone Line */}
          <div
            aria-hidden="true"
            className="absolute top-8 bottom-8 start-5 sm:start-7 w-0.5 -translate-x-1/2 rtl:translate-x-1/2 bg-gradient-to-b from-cyan-500 via-emerald-500 to-slate-300 dark:to-slate-800"
          />

          <div className="space-y-6">
            {timelineMilestones.map((item) => {
              return (
                <div
                  key={item.badgeCode}
                  data-testid={`milestone-timeline-item-${item.threshold}`}
                  className="relative flex items-start gap-4 sm:gap-6 group"
                >
                  {/* Vertical Timeline Node Circle */}
                  <div className="relative z-10 shrink-0">
                    <div
                      className={`w-10 h-10 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center font-mono font-bold text-xs sm:text-sm border-2 transition-transform duration-200 group-hover:scale-105 shadow-md ${
                        item.isUnlocked
                          ? 'border-emerald-500 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 ring-4 ring-emerald-500/20'
                          : item.progressPercent > 0
                          ? 'border-cyan-500/60 bg-cyan-500/10 text-cyan-500 ring-4 ring-cyan-500/15'
                          : 'border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-400'
                      }`}
                    >
                      {item.isUnlocked ? (
                        <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6" />
                      ) : item.progressPercent > 0 ? (
                        <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-400 animate-pulse" />
                      ) : (
                        <Lock className="w-4 h-4 text-slate-400" />
                      )}
                    </div>
                  </div>

                  {/* Milestone Card Content */}
                  <div
                    className={`flex-1 rounded-2xl border p-5 sm:p-6 space-y-3.5 transition-all duration-200 ${
                      item.isUnlocked
                        ? 'border-emerald-500/35 bg-gradient-to-br from-emerald-500/5 via-slate-50 dark:via-slate-900/90 to-blue-500/5 shadow-md'
                        : 'border-slate-200 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-950/40'
                    }`}
                  >
                    {/* Header Row: Badge Code, XP Tag, Status */}
                    <div className="flex flex-wrap items-center justify-between gap-2.5">
                      <div className="flex items-center gap-2">
                        <span
                          dir="ltr"
                          className={`ltr-inline px-2.5 py-1 rounded-lg text-xs font-mono font-bold border ${
                            item.isUnlocked
                              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
                              : 'bg-slate-200/60 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-500'
                          }`}
                        >
                          {item.badgeCode}
                        </span>

                        <span
                          dir="ltr"
                          className="ltr-inline text-xs font-mono font-extrabold text-amber-500 dark:text-amber-400"
                        >
                          +{item.threshold.toLocaleString()} XP
                        </span>
                      </div>

                      {/* Status Badge */}
                      {item.isUnlocked ? (
                        <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-1 rounded-lg">
                          <Check className="w-3.5 h-3.5" />
                          <span>
                            {language === 'en'
                              ? 'Reached & Storage Verified'
                              : 'تاییدشده در حافظه پایدار'}
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-400 bg-slate-200/50 dark:bg-slate-800/60 border border-slate-300/40 dark:border-slate-700/60 px-2.5 py-1 rounded-lg">
                          <Lock className="w-3.5 h-3.5" />
                          <span>
                            {language === 'en'
                              ? `${item.remainingXpToUnlock.toLocaleString()} XP to unlock`
                              : `${item.remainingXpToUnlock.toLocaleString()} XP تا بازگشایی`}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Milestone Titles & Module Link */}
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <h3 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white">
                          {language === 'en' ? item.titleEn : item.titleFa}
                        </h3>
                        <div
                          dir="ltr"
                          className="ltr-inline text-xs font-mono text-cyan-600 dark:text-cyan-400 mt-0.5 block"
                        >
                          {language === 'en' ? item.titleFa : item.titleEn}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => onNavigateToModule(`module-${item.moduleNumber}`)}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-cyan-400 transition-colors cursor-pointer shrink-0"
                      >
                        <span>
                          {language === 'en'
                            ? `Module 0${item.moduleNumber} Curriculum`
                            : `فصل ۰${item.moduleNumber} آموزشی`}
                        </span>
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Progress Bar for Locked / In-Progress Milestones */}
                    {!item.isUnlocked && (
                      <div className="space-y-1.5 pt-1">
                        <div className="flex items-center justify-between text-[11px] font-mono text-slate-500">
                          <span>{language === 'en' ? 'Threshold Progress' : 'پیشرفت تا آستانه'}</span>
                          <span>{item.progressPercent}%</span>
                        </div>
                        <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full transition-all duration-500"
                            style={{ width: `${item.progressPercent}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Architectural Principle & Quote Card */}
                    <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800/80 bg-white/70 dark:bg-slate-950/60 space-y-2 text-xs">
                      <div className="flex items-center justify-between gap-2">
                        <span
                          dir="ltr"
                          className="ltr-inline text-[11px] font-mono font-bold text-indigo-500 dark:text-indigo-400"
                        >
                          {item.principleEn}
                        </span>
                        <span className="text-[10px] text-slate-400">· Antigravity Principle</span>
                      </div>

                      <p className="text-slate-700 dark:text-slate-300 italic leading-relaxed">
                        {language === 'en' ? `“${item.quoteEn}”` : `«${item.quoteFa}»`}
                      </p>

                      <div
                        dir="ltr"
                        className="ltr-inline text-[10px] font-mono text-slate-400 dark:text-slate-500 pt-1"
                      >
                        — {item.authorRoleEn}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Section 3: Personalized Shareable Progress Report Card, Public Link Generator & Social Media Sharing Studio */}
      <div
        className="rounded-xl border border-blue-500/40 bg-gradient-to-br from-slate-900 via-[#0d1528] to-slate-950 text-white p-6 sm:p-8 space-y-6 shadow-xl"
        data-testid="share-progress-section"
      >
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-800 pb-5">
          <div className="space-y-1">
            <div dir="ltr" className="ltr-inline text-xs font-mono text-blue-400">
              OFFICIAL ARCHITECT PROGRESS REPORT CARD · {metrics.certificateSerial}
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-white">
              {language === 'en'
                ? 'Official Progress Report Card, Unique Public Link & Social Sharing'
                : 'کارنامه رسمی پیشرفت، لینک عمومی یکتا و اشتراک‌گذاری در شبکه‌های اجتماعی'}
            </h2>
            <p className="text-xs text-slate-300">
              {language === 'en'
                ? 'Generate your unique public mastery card URL and publish it directly via social sharing APIs'
                : 'لینک عمومی یکتای کارت مهارت خود را تولید کنید و مستقیماً از طریق APIهای اشتراک‌گذاری شبکه‌های اجتماعی منتشر نمایید'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => handleShareReportCard('text')}
              data-testid="copy-report-text-btn"
              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap"
            >
              {copiedReportState === 'text' ? (
                <>
                  <Check className="w-4 h-4 text-emerald-300" />
                  <span>
                    {language === 'en'
                      ? 'Report Card Copied to Clipboard!'
                      : 'کارنامه در کلیپ‌بورد کپی شد!'}
                  </span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>
                    {language === 'en'
                      ? 'Copy Report Card'
                      : 'کپی متن کارنامه (Copy Report Card)'}
                  </span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleGeneratePublicProgressLink}
              data-testid="generate-public-link-btn"
              className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap"
            >
              {publicLinkStatus === 'generated' ? (
                <>
                  <Check className="w-4 h-4 text-white" />
                  <span>
                    {language === 'en'
                      ? 'Unique Public Link Generated & Copied!'
                      : 'لینک عمومی یکتا ساخته و کپی شد!'}
                  </span>
                </>
              ) : (
                <>
                  <Link2 className="w-4 h-4" />
                  <span>
                    {language === 'en'
                      ? 'Share Progress Link'
                      : 'تولید لینک عمومی کارنامه (Share Progress Link)'}
                  </span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Certificate Visual Body */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          <div className="lg:col-span-7 space-y-4">
            <div className="space-y-1">
              <div className="text-xs text-slate-400">
                {language === 'en'
                  ? 'Presented to Systems Architect:'
                  : 'اعطاشده به معمار سیستم (Presented To):'}
              </div>
              <div className="text-2xl sm:text-3xl font-black text-white">
                {displayArchitectName || 'Principal Engineer'}
              </div>
              <div dir="ltr" className="ltr-inline text-xs sm:text-sm font-mono text-blue-300">
                {roleTitle} · {organization}
              </div>
            </div>

            <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/70 space-y-2">
              <div className="text-xs text-slate-400">
                {language === 'en'
                  ? 'Earned Standing Rank:'
                  : 'درجه تخصصی کسب‌شده (Standing Rank):'}
              </div>
              <div className="text-base font-bold text-emerald-400">
                {language === 'en' ? metrics.rankTitleEn : metrics.rankTitleFa}
              </div>
              <div dir="ltr" className="ltr-inline text-xs font-mono text-slate-300">
                {metrics.rankTitleEn}
              </div>
            </div>

            {/* Progress Bar */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300">
                  {language === 'en'
                    ? 'Antigravity Engineering Curriculum Mastery:'
                    : 'درصد تکمیل سرفصل‌های مهندسی Antigravity:'}
                </span>
                <span dir="ltr" className="ltr-inline font-mono font-bold text-blue-400 tabular-nums">
                  {metrics.completedCount} / {metrics.totalModules} Modules ({metrics.completionPercentage}%)
                </span>
              </div>
              <div className="w-full h-2.5 rounded-full bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-emerald-400 transition-all duration-300"
                  style={{ width: `${metrics.completionPercentage}%` }}
                />
              </div>
            </div>
          </div>

          {/* Shareable Transcript Preview Box (5 Cols) */}
          <div className="lg:col-span-5">
            <div dir="ltr" className="ltr-code rounded-xl border border-slate-800 bg-slate-950 p-4 text-[11px] font-mono text-slate-200 overflow-x-auto">
              <pre className="leading-relaxed"><code>{shareableText}</code></pre>
            </div>
          </div>
        </div>

        {/* Share Progress Hub: Unique Public Link + Social Media Sharing APIs */}
        <div
          data-testid="share-progress-hub"
          className="rounded-xl border border-slate-800 bg-slate-950/85 p-5 sm:p-6 space-y-5"
        >
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/90 pb-4">
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <Share2 className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm sm:text-base font-extrabold text-white">
                  {language === 'en'
                    ? 'Share Mastery Progress Card & Unique Public Link'
                    : 'اشتراک‌گذاری کارت پیشرفت و لینک عمومی یکتا (Share Mastery Progress Card)'}
                </h3>
                <span
                  dir="ltr"
                  data-testid="public-card-slug-id"
                  className="ltr-inline px-2 py-0.5 rounded bg-blue-500/15 border border-blue-500/30 text-blue-300 font-mono text-[11px]"
                >
                  {shareBundle.cardSlugId}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {language === 'en'
                  ? 'The URL below encodes your verified level, XP, mastered modules, and certificate serial to reconstruct your mastery card for any visitor.'
                  : 'لینک زیر شامل پارامترهای رمزنگاری‌شده سطح، امتیاز XP، تعداد فصول تکمیل‌شده و کد گواهینامه شماست و برای هر بازدیدکننده کارت مهارت شما را بازسازی می‌کند.'}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() =>
                  setSharedCardPreview((prev) => (prev ? null : shareBundle.snapshot))
                }
                data-testid="preview-public-card-btn"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs font-semibold cursor-pointer"
              >
                <Eye className="w-3.5 h-3.5 text-blue-400" />
                <span>
                  {sharedCardPreview
                    ? language === 'en'
                      ? 'Close Public Card Preview'
                      : 'بستن پیش‌نمایش کارت عمومی'
                    : language === 'en'
                    ? 'Preview Public Card'
                    : 'پیش‌نمایش کارت عمومی (Preview Public Card)'}
                </span>
              </button>

              <button
                type="button"
                onClick={() => void handleWebShareProgressCard()}
                data-testid="web-share-api-btn"
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold cursor-pointer"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>
                  {publicLinkStatus === 'shared'
                    ? language === 'en'
                      ? 'Shared via Web API!'
                      : 'منتشر شد (Shared via Web API)!'
                    : language === 'en'
                    ? 'Quick Share (Web Share API)'
                    : 'اشتراک‌گذاری سریع (Web Share API)'}
                </span>
              </button>
            </div>
          </div>

          {/* Unique Public Link URL Bar */}
          <div className="space-y-2">
            <label
              htmlFor="public-progress-card-url-input"
              className="flex items-center justify-between text-xs text-slate-300 font-semibold"
            >
              <span>
                {language === 'en'
                  ? 'Unique Public Mastery Progress Link:'
                  : 'آدرس عمومی یکتای کارنامه مهارت (Unique Public Mastery Progress Link):'}
              </span>
              <span dir="ltr" className="ltr-inline font-mono text-[11px] text-emerald-400">
                Direct Verification URL
              </span>
            </label>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
              <input
                id="public-progress-card-url-input"
                data-testid="public-progress-card-url-input"
                type="text"
                readOnly
                dir="ltr"
                value={shareBundle.publicCardUrl}
                className="ltr-code flex-1 px-3.5 py-2.5 rounded-lg border border-slate-800 bg-slate-900 text-xs font-mono text-blue-300 select-all focus:outline-none focus:border-blue-500"
              />
              <button
                type="button"
                onClick={handleCopyPublicProgressLink}
                data-testid="copy-public-link-btn"
                className="px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center justify-center gap-2 cursor-pointer shrink-0"
              >
                {publicLinkStatus === 'copied' ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-300" />
                    <span>
                      {language === 'en' ? 'Public Link Copied!' : 'لینک عمومی کپی شد!'}
                    </span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>
                      {language === 'en'
                        ? 'Copy Unique Link'
                        : 'کپی لینک عمومی (Copy Unique Link)'}
                    </span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Social Media Sharing APIs Grid */}
          <div className="space-y-2.5 pt-2">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
              <span className="font-semibold text-slate-200">
                {language === 'en'
                  ? 'Direct Social Media Sharing APIs:'
                  : 'انتشار مستقیم با API شبکه‌های اجتماعی (Social Media Sharing APIs):'}
              </span>
              <span dir="ltr" className="ltr-inline font-mono text-[11px] text-slate-400">
                LinkedIn · X (Twitter) · Telegram · WhatsApp
              </span>
            </div>

            <div
              data-testid="social-share-grid"
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3"
            >
              <a
                href={shareBundle.socialShareUrls.linkedInUrl}
                target="_blank"
                rel="noopener noreferrer"
                data-testid="share-linkedin-link"
                className="p-3.5 rounded-xl border border-blue-500/30 bg-blue-500/10 hover:bg-blue-500/20 transition-colors flex items-center justify-between gap-3 group"
              >
                <div className="space-y-0.5">
                  <div className="text-xs font-bold text-white flex items-center gap-1.5">
                    <span>{language === 'en' ? 'Share on LinkedIn' : 'اشتراک در لینکدین'}</span>
                  </div>
                  <div dir="ltr" className="ltr-inline text-[11px] font-mono text-blue-300">
                    LinkedIn Share Offsite API
                  </div>
                </div>
                <ExternalLink className="w-4 h-4 text-blue-400 group-hover:translate-x-0.5 transition-transform shrink-0" />
              </a>

              <a
                href={shareBundle.socialShareUrls.twitterXUrl}
                target="_blank"
                rel="noopener noreferrer"
                data-testid="share-twitter-link"
                className="p-3.5 rounded-xl border border-slate-700 bg-slate-900/90 hover:bg-slate-800 transition-colors flex items-center justify-between gap-3 group"
              >
                <div className="space-y-0.5">
                  <div className="text-xs font-bold text-white flex items-center gap-1.5">
                    <span>
                      {language === 'en' ? 'Post on X (Twitter)' : 'انتشار در شبکه X (توییتر)'}
                    </span>
                  </div>
                  <div dir="ltr" className="ltr-inline text-[11px] font-mono text-slate-300">
                    X / Twitter Intent Tweet API
                  </div>
                </div>
                <ExternalLink className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform shrink-0" />
              </a>

              <a
                href={shareBundle.socialShareUrls.telegramUrl}
                target="_blank"
                rel="noopener noreferrer"
                data-testid="share-telegram-link"
                className="p-3.5 rounded-xl border border-cyan-500/30 bg-cyan-500/10 hover:bg-cyan-500/20 transition-colors flex items-center justify-between gap-3 group"
              >
                <div className="space-y-0.5">
                  <div className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Send className="w-3.5 h-3.5 text-cyan-400" />
                    <span>{language === 'en' ? 'Share on Telegram' : 'ارسال در تلگرام'}</span>
                  </div>
                  <div dir="ltr" className="ltr-inline text-[11px] font-mono text-cyan-300">
                    Telegram Share URL API
                  </div>
                </div>
                <ExternalLink className="w-4 h-4 text-cyan-400 group-hover:translate-x-0.5 transition-transform shrink-0" />
              </a>

              <a
                href={shareBundle.socialShareUrls.whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                data-testid="share-whatsapp-link"
                className="p-3.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 transition-colors flex items-center justify-between gap-3 group"
              >
                <div className="space-y-0.5">
                  <div className="text-xs font-bold text-white flex items-center gap-1.5">
                    <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{language === 'en' ? 'Share on WhatsApp' : 'ارسال در واتساپ'}</span>
                  </div>
                  <div dir="ltr" className="ltr-inline text-[11px] font-mono text-emerald-300">
                    WhatsApp Send API
                  </div>
                </div>
                <ExternalLink className="w-4 h-4 text-emerald-400 group-hover:translate-x-0.5 transition-transform shrink-0" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
