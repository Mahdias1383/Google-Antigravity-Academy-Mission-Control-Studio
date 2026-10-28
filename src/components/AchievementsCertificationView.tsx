import React, { useState, useEffect } from 'react';
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
} from 'lucide-react';
import { CurriculumModule } from '../types/curriculum';
import {
  StudySessionDay,
  DailyStudyGoalItem,
  StudioUsageItem,
  calculateCertificationMetrics,
  calculateStreakSummary,
  calculateWeeklyPlannerMetrics,
  calculateXpAndLevelProgression,
  calculateTrophyCaseStatus,
  formatActiveTimerDisplay,
  formatShareableReportCardText,
} from '../utils/achievements';
import {
  ExportSectionPdfButton,
  PrintableDocumentPayload,
} from './CodeAndPdfTools';

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
  const [architectName, setArchitectName] = useState<string>('آریا رستمی (Aria Rostami)');
  const [roleTitle, setRoleTitle] = useState<string>('Principal AI Systems Architect');
  const [organization, setOrganization] = useState<string>('Enterprise Cloud Engineering');
  const [studyDays, setStudyDays] = useState<StudySessionDay[]>(INITIAL_STUDY_DAYS);
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

  useEffect(() => {
    if (!timerRunning) return;
    const interval = window.setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => window.clearInterval(interval);
  }, [timerRunning]);

  const metrics = calculateCertificationMetrics(allModules, completedModules, architectName);
  const streakStats = calculateStreakSummary(studyDays);
  const plannerAnalytics = calculateWeeklyPlannerMetrics(studyDays, dailyTargetMinutes);
  const trophyCase = calculateTrophyCaseStatus(
    metrics.completedCount,
    metrics.totalModules,
    completedScenarioIds
  );
  const xpProgression = calculateXpAndLevelProgression(
    metrics.totalXp + trophyCase.trophyBonusXp,
    streakStats.totalMinutesStudied,
    studioUsageItems
  );

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
    architectName,
    roleTitle,
    organization,
    metrics,
    streakStats.currentStreakDays,
    streakStats.totalMinutesStudied
  );

  const handleLogStudySession = () => {
    const addedMins = Math.max(5, Math.min(240, Number(sessionMinutesInput) || 25));
    setStudyDays((prev) =>
      prev.map((d, idx) =>
        idx === prev.length - 1
          ? {
              ...d,
              active: true,
              minutesStudied: d.minutesStudied + addedMins,
              modulesTouched: d.modulesTouched + 1,
            }
          : d
      )
    );
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
    setStudyDays((prev) =>
      prev.map((d) => {
        if (d.dateIso !== dateIso) return d;
        const nextActive = !d.active;
        return {
          ...d,
          active: nextActive,
          minutesStudied: nextActive ? Math.max(30, d.minutesStudied) : 0,
          modulesTouched: nextActive ? Math.max(1, d.modulesTouched) : 0,
        };
      })
    );
  };

  const handleShareReportCard = async (mode: 'text' | 'link') => {
    if (mode === 'text') {
      if (navigator.share) {
        try {
          await navigator.share({
            title: `Google Antigravity Progress Report — ${architectName}`,
            text: shareableText,
          });
        } catch {
          navigator.clipboard?.writeText(shareableText);
        }
      } else {
        navigator.clipboard?.writeText(shareableText);
      }
      setCopiedReportState('text');
      setTimeout(() => setCopiedReportState('none'), 2200);
      return;
    }

    const shareUrl = `${window.location.origin}/?cert=${encodeURIComponent(
      metrics.certificateSerial
    )}&completed=${metrics.completedCount}`;
    navigator.clipboard?.writeText(`${shareableText}\n\nVerification Link: ${shareUrl}`);
    setCopiedReportState('link');
    setTimeout(() => setCopiedReportState('none'), 2200);
  };

  const certificationPdfPayload: PrintableDocumentPayload = {
    titleFa: `کارنامه پیشرفت و گواهینامه معماری: ${architectName}`,
    titleEn: `Google Antigravity Architect Progress Report & Certification (${metrics.certificateSerial})`,
    subtitleOrCategory: `Level ${xpProgression.currentLevel} (${xpProgression.levelTitleEn}) · ${xpProgression.totalCombinedXp} Total XP`,
    sections: [
      {
        headingFa: '۱. مشخصات معمار و خلاصه امتیازات (Architect Standing & Level)',
        headingEn: `Certificate Serial: ${metrics.certificateSerial}`,
        paragraphsFa: [
          `نام معمار: ${architectName} | سمت: ${roleTitle} | سازمان: ${organization}`,
          `سطح فعلی (Architect Level): Level ${xpProgression.currentLevel} — ${xpProgression.levelTitleFa} با مجموع ${xpProgression.totalCombinedXp} امتیاز کل (Module XP: ${xpProgression.moduleXp} | Reading XP: ${xpProgression.readingTimeXp} | Studio XP: ${xpProgression.studioUsageXp}).`,
          `رکورد پیوستگی مطالعه (Study Streak): ${streakStats.currentStreakDays} روز متوالی فعال (مجموعاً ${streakStats.totalMinutesStudied} دقیقه مطالعه ثبت‌شده).`,
        ],
      },
      {
        headingFa: '۲. نشان‌های مهارت کسب‌شده (Earned Competency Badges)',
        headingEn: `${metrics.completedCount} / ${metrics.totalModules} Module Badges Unlocked`,
        bullets: metrics.badges.map((b) => ({
          termEn: `${b.unlocked ? 'UNLOCKED' : 'LOCKED'} · [${b.badgeCode}] (${b.xpValue} XP)`,
          descFa: `${b.badgeTitleFa} (${b.badgeTitleEn}) — ${b.competencyDomain}`,
        })),
      },
      {
        headingFa: '۳. نسخه متنی قابل اشتراک‌گذاری (Verified Shareable Transcript)',
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
      {/* Header Banner */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/75 p-6 sm:p-8 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <span className="font-bold text-blue-600 dark:text-blue-400">
              آکادمی مهندسی · دستاوردها، سطح‌بندی XP و گواهینامه رسمی
            </span>
            <span aria-hidden="true">·</span>
            <span dir="ltr" className="ltr-inline font-mono">
              {metrics.certificateSerial}
            </span>
            <span aria-hidden="true">·</span>
            <span dir="ltr" className="ltr-inline font-mono text-emerald-500 font-bold">
              LVL {xpProgression.currentLevel} · {xpProgression.totalCombinedXp} Total XP
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <ExportSectionPdfButton
              label="دریافت PDF کارنامه و گواهینامه"
              payload={certificationPdfPayload}
              onExport={onExportPdf}
            />
            {metrics.completedCount < metrics.totalModules && (
              <button
                type="button"
                onClick={onCompleteAllModules}
                className="px-3.5 py-2 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors cursor-pointer whitespace-nowrap"
              >
                تکمیل تمام ۸ فصل (Unlock Full Certification)
              </button>
            )}
          </div>
        </div>

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              دستاوردها، سیستم سطح‌بندی XP، برنامه‌ریز مطالعه و کارنامه معماری
            </h1>
            <div dir="ltr" className="ltr-inline text-sm font-mono text-blue-600 dark:text-blue-400">
              XP &amp; Level Progression, Daily Study Planner &amp; Shareable Architect Report Card
            </div>
            <p className="text-xs sm:text-sm leading-7 text-slate-600 dark:text-slate-300 max-w-3xl">
              با تکمیل ماژول‌های ۸گانه، ثبت زمان مطالعه روزانه و اجرای شبیه‌سازها و استودیوهای عملی، امتیاز تجربه (<span dir="ltr" className="ltr-inline">XP</span>) کسب کنید، سطح مهندسی (<span dir="ltr" className="ltr-inline">Architect Level</span>) خود را ارتقا دهید و کارنامه رسمی خود را منتشر نمایید.
            </p>
          </div>

          {/* Summary KPI Strip */}
          <div className="grid grid-cols-3 gap-3 shrink-0">
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/70 text-center">
              <div dir="ltr" className="ltr-inline text-xl font-mono font-extrabold text-blue-500 tabular-nums">
                LVL {xpProgression.currentLevel}
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                سطح فعلی معمار
              </div>
            </div>
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/70 text-center">
              <div dir="ltr" className="ltr-inline text-xl font-mono font-extrabold text-amber-500 tabular-nums">
                {streakStats.currentStreakDays}d
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                پیوستگی فعلی (Streak)
              </div>
            </div>
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/70 text-center">
              <div dir="ltr" className="ltr-inline text-xl font-mono font-extrabold text-emerald-500 tabular-nums">
                {xpProgression.totalCombinedXp}
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                مجموع امتیاز (Total XP)
              </div>
            </div>
          </div>
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
                  سیستم امتیاز تجربه و ارتقای سطح (XP &amp; Level Progression)
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
                  {xpProgression.levelTitleFa}
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
                پیشرفت تا ارتقای سطح بعدی:
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
              منابع کسب امتیاز: تکمیل ماژول‌های آموزشی + زمان مطالعه روزانه + استفاده از استودیوهای تعاملی
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
                  <span>۱. تکمیل فصل‌ها</span>
                </span>
                <span dir="ltr" className="ltr-inline text-xs font-mono font-bold text-blue-500 tabular-nums">
                  +{xpProgression.moduleXp} XP
                </span>
              </div>
              <div dir="ltr" className="ltr-inline text-[11px] font-mono text-slate-500 block">
                Module Completion ({metrics.completedCount}/{metrics.totalModules} Modules)
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-5">
                هر فصل بین ۱۵۰ تا ۲۵۰ امتیاز تجربه به کارنامه شما اضافه می‌کند.
              </p>
            </div>

            <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-500">سهم از سقف ماژول‌ها:</span>
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
                  <span>تکمیل تمام فصول</span>
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
                  <span>۲. زمان مطالعه و بررسی</span>
                </span>
                <span dir="ltr" className="ltr-inline text-xs font-mono font-bold text-emerald-500 tabular-nums">
                  +{xpProgression.readingTimeXp} XP
                </span>
              </div>
              <div dir="ltr" className="ltr-inline text-[11px] font-mono text-slate-500 block">
                Reading Time ({streakStats.totalMinutesStudied}m × 4 XP/min)
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-5">
                به ازای هر دقیقه مطالعه عمیق مستندات و کدهای آکادمی، ۴ امتیاز تجربه دریافت می‌کنید.
              </p>
            </div>

            <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-500">زمان ثبت‌شده کل:</span>
                <span dir="ltr" className="ltr-inline font-mono font-bold text-slate-700 dark:text-slate-200 tabular-nums">
                  {streakStats.totalMinutesStudied} mins
                </span>
              </div>
              <button
                type="button"
                onClick={() => handleQuickAddReadingTimeXp(15)}
                className="w-full py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-colors cursor-pointer flex items-center justify-center gap-1.5"
              >
                <span>ثبت ۱۵ دقیقه مطالعه</span>
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
                  <span>۳. امتیاز کار با استودیوهای عملی</span>
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
                      {studio.titleFa}
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
                برنامه‌ریز روزانه مطالعه و پایش هدف هفتگی
              </h2>
              <div dir="ltr" className="ltr-inline text-xs font-mono text-slate-500 dark:text-slate-400">
                Daily Study Planner · Active Session Telemetry &amp; Weekly Target Progress Chart
              </div>
            </div>
          </div>

          {/* Daily Target Selector */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
              هدف مطالعه روزانه:
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
                  اهداف مطالعه امروز (Daily Study Goals)
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
                      className="flex items-start gap-2.5 text-right flex-1 cursor-pointer"
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
                          {goal.titleFa}
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
                      aria-label="حذف هدف مطالعه"
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
                تعریف هدف جدید برای جلسه امروز:
              </div>
              <input
                type="text"
                placeholder="عنوان هدف (مثلاً: تمرین دستور // turbo-all در پایپ‌لاین)..."
                value={newGoalTitle}
                onChange={(e) => setNewGoalTitle(e.target.value)}
                className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
              />
              <div className="flex flex-wrap items-center gap-2">
                <select
                  aria-label="انتخاب ماژول هدف"
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
                  aria-label="زمان هدف به دقیقه"
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
                  + افزودن هدف
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
                  <span>تایمر جلسه فعال</span>
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
                زمان مطالعه فعلی خود را اندازه‌گیری کرده و مستقیماً در نمودار پیشرفت امروز ثبت کنید.
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
                  <span>{timerRunning ? 'توقف' : 'شروع'}</span>
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
                  aria-label="ریست تایمر"
                  className="py-2 px-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-300 flex items-center justify-center gap-1 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>صفر</span>
                </button>
              </div>

              <button
                type="button"
                onClick={handleCommitActiveTimerSession}
                className="w-full py-2.5 px-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>ثبت زمان تایمر در آمار امروز</span>
              </button>
            </div>
          </div>

          {/* Column 3 (4 Cols): Weekly Progress vs. Target Visual Chart */}
          <div className="lg:col-span-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/60 p-5 flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <BarChart3 className="w-4 h-4 text-blue-500" />
                  <span>نمودار پیشرفت هفتگی</span>
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
                  <span>روزهای منطبق با هدف ({dailyTargetMinutes}m+):</span>
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
                      {bar.dayLabelFa.replace('امروز (سه‌شنبه)', 'امروز')}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500 inline-block" />
                <span>تحقق هدف روزانه</span>
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-blue-500 inline-block" />
                <span>در حال پیشرفت</span>
              </span>
              <span dir="ltr" className="ltr-inline font-mono text-slate-600 dark:text-slate-300 tabular-nums">
                Today: {plannerAnalytics.todayActualMinutes}/{plannerAnalytics.todayTargetMinutes}m
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Section 1: Study Streak Counter & Session Tracker */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/75 p-6 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-3.5">
            <div className="flex items-center gap-2">
              <Flame className="w-5 h-5 text-amber-500 shrink-0" />
              <div>
                <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                  شمارنده پیوستگی جلسات مطالعه (Study Session Streak)
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  روی هر روز کلیک کنید تا وضعیت فعالیت تغییر کند یا جلسه مطالعه جدیدی برای امروز ثبت نمایید
                </p>
              </div>
            </div>
            <div dir="ltr" className="ltr-inline text-xs font-mono font-bold text-amber-500 tabular-nums">
              Current: {streakStats.currentStreakDays} Days · Best: {streakStats.longestStreakDays} Days
            </div>
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
                <div className="text-[11px] font-bold truncate">{day.dayLabelFa}</div>
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
                <span>ثبت جلسه مطالعه جدید در کارنامه امروز:</span>
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">
                مجموع زمان مطالعه هفتگی: <span dir="ltr" className="ltr-inline font-mono font-bold text-slate-700 dark:text-slate-200">{streakStats.totalMinutesStudied} mins</span> در <span dir="ltr" className="ltr-inline font-mono font-bold text-slate-700 dark:text-slate-200">{streakStats.activeDaysCount}</span> روز فعال
              </div>
            </div>

            <div className="flex items-center gap-2">
              <label htmlFor="session-minutes-input" className="sr-only">
                مدت زمان مطالعه به دقیقه
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
              <span className="text-xs text-slate-500">دقیقه</span>
              <button
                type="button"
                onClick={handleLogStudySession}
                className="px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>ثبت جلسه مطالعه</span>
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
                شخصی‌سازی کارنامه و گواهینامه
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                اطلاعات شما به صورت زنده روی کارت گواهینامه و خروجی اشتراک‌گذاری درج می‌شود
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <label htmlFor="architect-name-input" className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                <span>نام و نام خانوادگی معمار:</span>
                <span dir="ltr" className="ltr-inline font-mono text-[11px] text-slate-500">Candidate Name</span>
              </label>
              <input
                id="architect-name-input"
                type="text"
                value={architectName}
                onChange={(e) => setArchitectName(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label htmlFor="architect-role-input" className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                <span>عنوان شغلی و تخصصی:</span>
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
                <span>تیم یا سازمان:</span>
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
                  ویترین تندیس‌های نادر دیجیتال
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
                <span>فتح تمام تندیس‌های نادر</span>
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
                        {trophy.titleFa}
                      </h3>
                      <div dir="ltr" className="text-[11px] font-mono text-blue-500 truncate text-right">
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
                    {trophy.descriptionFa}
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
                      {trophy.unlocked ? 'تسلط ۱۰۰٪ احراز شد' : 'تکمیل ۱۰۰٪ کل ماژول‌ها'}
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
                      <span>{trophy.unlocked ? 'سناریو فتح شد' : 'ثبت تکمیل سناریو'}</span>
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
              نشان‌های مهارت ماژول‌های ۸گانه (Module Competency Badges)
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              تکمیل هر فصل، نشان تخصصی مربوط به آن معماری و امتیاز XP آن را در کارنامه شما فعال می‌کند
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
                      {badge.badgeTitleFa}
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
                  {badge.unlocked ? 'کسب‌شده (Unlocked)' : 'فعالسازی نشان'}
                </button>
                <button
                  type="button"
                  onClick={() => onNavigateToModule(badge.moduleId)}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                >
                  <span>مشاهده فصل {badge.moduleNumber}</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Section 3: Personalized Shareable Progress Report Card & Certificate Preview */}
      <div className="rounded-xl border border-blue-500/40 bg-gradient-to-br from-slate-900 via-[#0d1528] to-slate-950 text-white p-6 sm:p-8 space-y-6 shadow-xl">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-800 pb-5">
          <div className="space-y-1">
            <div dir="ltr" className="ltr-inline text-xs font-mono text-blue-400">
              OFFICIAL ARCHITECT PROGRESS REPORT CARD · {metrics.certificateSerial}
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-white">
              کارنامه رسمی پیشرفت و گواهینامه معمار Google Antigravity
            </h2>
            <p className="text-xs text-slate-300">
              آماده اشتراک‌گذاری با تیم مهندسی، ضمیمه در رزومه فنی یا چاپ به عنوان گواهینامه PDF
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => handleShareReportCard('text')}
              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap"
            >
              {copiedReportState === 'text' ? (
                <>
                  <Check className="w-4 h-4 text-emerald-300" />
                  <span>کارنامه در کلیپ‌بورد کپی شد!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>کپی متن کارنامه (Copy Report Card)</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => handleShareReportCard('link')}
              className="px-4 py-2 rounded-lg border border-slate-700 bg-slate-800/90 hover:bg-slate-700 text-slate-100 text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap"
            >
              {copiedReportState === 'link' ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>لینک تایید کپی شد!</span>
                </>
              ) : (
                <>
                  <Share2 className="w-4 h-4 text-blue-400" />
                  <span>اشتراک‌گذاری لینک کارنامه (Share Link)</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Certificate Visual Body */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          <div className="lg:col-span-7 space-y-4">
            <div className="space-y-1">
              <div className="text-xs text-slate-400">اعطاشده به معمار سیستم (Presented To):</div>
              <div className="text-2xl sm:text-3xl font-black text-white">
                {architectName || 'Principal Engineer'}
              </div>
              <div dir="ltr" className="ltr-inline text-xs sm:text-sm font-mono text-blue-300">
                {roleTitle} · {organization}
              </div>
            </div>

            <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/70 space-y-2">
              <div className="text-xs text-slate-400">درجه تخصصی کسب‌شده (Standing Rank):</div>
              <div className="text-base font-bold text-emerald-400">{metrics.rankTitleFa}</div>
              <div dir="ltr" className="ltr-inline text-xs font-mono text-slate-300">
                {metrics.rankTitleEn}
              </div>
            </div>

            {/* Progress Bar */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300">درصد تکمیل سرفصل‌های مهندسی Antigravity:</span>
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
      </div>
    </div>
  );
};
