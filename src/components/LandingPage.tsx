import React, { useState } from 'react';
import {
  Sparkles,
  Terminal,
  Shield,
  Zap,
  BookOpen,
  Cpu,
  Database,
  Award,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Play,
  Code2,
  Layers,
  Users,
  Target,
  FileSpreadsheet,
  Activity,
  Flame,
  GraduationCap,
  Star,
  Check,
  ExternalLink,
  ChevronRight,
  ChevronLeft,
  Compass,
  Lock,
  GitBranch,
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { ALL_CURRICULUM_MODULES } from '../data/curriculumIndex';
import {
  buildKnowledgeCheckTop5Leaderboard,
  selectArchitectDailyMission,
} from '../utils/generators';
import {
  formatLocalizedNumber,
  formatLocalizedThousand,
  localizeDigits,
  renderBidiText,
} from '../utils/bidiText';

interface LandingPageProps {
  onStartCurriculum: (moduleId?: string) => void;
  onOpenStudio: (
    studioSection:
      | 'simulator'
      | 'guardrails'
      | 'mcp'
      | 'scenarios'
      | 'knowledge-base'
      | 'ai-architect'
      | 'game-3d'
  ) => void;
  onOpenProfile: () => void;
  onOpenAchievements: () => void;
  completedModules: string[];
  totalModules: number;
  userXp: number;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onStartCurriculum,
  onOpenStudio,
  onOpenProfile,
  onOpenAchievements,
  completedModules,
  totalModules,
  userXp,
}) => {
  const { language, isRTL } = useLanguage();
  const isEn = language === 'en';

  // Active Daily Mission Preview
  const [dailyMission] = useState(() =>
    selectArchitectDailyMission({ seedOrIndex: 1 })
  );

  // Top 5 Cohort Leaderboard Preview
  const leaderboard = React.useMemo(() => {
    return buildKnowledgeCheckTop5Leaderboard();
  }, []);

  // Filter or Phase Selector for Curriculum Preview
  const [selectedPhase, setSelectedPhase] = useState<number>(0); // 0 = all, 1 = phase1, 2 = phase2, 3 = phase3

  const displayedModules = React.useMemo(() => {
    if (selectedPhase === 1) return ALL_CURRICULUM_MODULES.slice(0, 3);
    if (selectedPhase === 2) return ALL_CURRICULUM_MODULES.slice(3, 6);
    if (selectedPhase === 3) return ALL_CURRICULUM_MODULES.slice(6, 8);
    return ALL_CURRICULUM_MODULES;
  }, [selectedPhase]);

  const completionPercent = Math.round(
    (completedModules.length / Math.max(1, totalModules)) * 100
  );

  return (
    <div className="space-y-20 pb-16">
      {/* ============================================================ */}
      {/* 1. HERO SECTION & TELEMETRY                                  */}
      {/* ============================================================ */}
      <section className="relative overflow-hidden pt-4 pb-12">
        {/* Subtle radial ambient gradients */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[450px] bg-gradient-to-r from-blue-600/15 via-indigo-600/15 to-cyan-500/10 rounded-full blur-[140px] pointer-events-none -z-10" />

        <div className="max-w-5xl mx-auto text-center space-y-7">
          {/* Top Flagship Banner */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-blue-300 text-xs font-semibold shadow-xs">
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-ping" />
            <Sparkles className="w-3.5 h-3.5" />
            <span>
              {isEn
                ? 'Flagship 2026 Curriculum · Agent-First Software Engineering'
                : 'دوره جامع تخصصی ۲۰۲۶ · مهندسی نرم‌افزار معمار ایجنت‌محور'}
            </span>
          </div>

          {/* Master Title */}
          <div className="space-y-4">
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.2] text-slate-900 dark:text-white">
              {isEn ? (
                <>
                  Master <span className="bg-gradient-to-r from-blue-600 via-indigo-500 to-cyan-400 bg-clip-text text-transparent">Google Antigravity</span> Architecture
                </>
              ) : (
                <>
                  آکادمی جامع معماری <span className="bg-gradient-to-r from-blue-600 via-indigo-500 to-cyan-400 bg-clip-text text-transparent">Google Antigravity</span>
                </>
              )}
            </h1>

            <p className="text-base sm:text-lg lg:text-xl text-slate-600 dark:text-slate-300 max-w-3xl mx-auto leading-relaxed font-normal">
              {isEn
                ? 'The enterprise training platform for Principal AI Systems Architects. Move beyond linear copilot completions to deterministic multi-agent workspaces, FastMCP 2.0 servers, and zero-drift context guardrails.'
                : 'پلتفرم استاندارد و جامع تربیت معماران ارشد سیستم‌های هوشمند. گذر از اتوکامپلیت‌های خط‌به‌خط به سمت معماری دوگانه IDE، پروتکل ارتباطی FastMCP 2.0، مهار پوسیدگی کانتکست (Context Rot) و ارکستریشن موازی Git Worktree.'}
            </p>
          </div>

          {/* Primary Action Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              type="button"
              data-testid="landing-start-curriculum-btn"
              onClick={() => onStartCurriculum('module-1')}
              className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm shadow-lg shadow-blue-500/25 flex items-center gap-2.5 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
            >
              <BookOpen className="w-4 h-4" />
              <span>{isEn ? 'Start Curriculum (Module 1)' : 'شروع یادگیری (ورود به فصل ۱)'}</span>
              {isRTL ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
            </button>

            <button
              type="button"
              data-testid="landing-open-simulator-btn"
              onClick={() => onOpenStudio('simulator')}
              className="px-5 py-3.5 rounded-xl border border-slate-300 dark:border-white/10 bg-white/80 dark:bg-white/[0.04] hover:bg-slate-100 dark:hover:bg-white/[0.08] text-slate-800 dark:text-slate-200 font-semibold text-sm transition-all flex items-center gap-2 cursor-pointer shadow-2xs"
            >
              <Terminal className="w-4 h-4 text-emerald-500" />
              <span>{isEn ? 'Mission Control Simulator' : 'شبیه‌ساز زنده اتاق فرمان'}</span>
            </button>

            <button
              type="button"
              data-testid="landing-open-profile-btn"
              onClick={onOpenProfile}
              className="px-5 py-3.5 rounded-xl border border-indigo-500/30 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 font-semibold text-sm transition-all flex items-center gap-2 cursor-pointer shadow-2xs"
            >
              <GraduationCap className="w-4 h-4 text-indigo-500" />
              <span>{isEn ? 'Architect Profile & Transcript' : 'پروفایل و کارنامه معمار'}</span>
            </button>
          </div>

          {/* User Progress Micro-Bar */}
          <div className="pt-4 max-w-md mx-auto">
            <div className="p-3 rounded-xl border border-slate-200/80 dark:border-white/[0.08] bg-white/60 dark:bg-[#0c121e]/60 backdrop-blur-md flex items-center justify-between text-xs gap-3">
              <div className="flex items-center gap-2">
                <Flame className="w-4 h-4 text-amber-500 animate-bounce" />
                <span className="text-slate-600 dark:text-slate-300 font-medium">
                  {isEn ? 'Your Academy Standing:' : 'وضعیت تحصیلی شما:'}
                </span>
              </div>
              <div className="flex items-center gap-2 font-bold tabular-nums">
                <span className="text-blue-600 dark:text-blue-400">
                  {formatLocalizedNumber(completedModules.length, language)}/
                  {formatLocalizedNumber(totalModules, language)} {isEn ? 'Modules' : 'فصل'}
                </span>
                <span className="text-slate-400">·</span>
                <span className="text-emerald-500">
                  {formatLocalizedThousand(userXp, language)} XP
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Live Metrics Grid (Zero-pill, high density) */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-12 max-w-4xl mx-auto">
          {[
            {
              labelEn: 'Curriculum Chapters',
              labelFa: 'سرفصل تخصصی معماری',
              valueEn: '8',
              valueFa: '۸',
              unitEn: 'Deep Modules',
              unitFa: 'ماژول عمیق',
              colorClass: 'text-blue-500 border-blue-500/20 bg-blue-500/5',
              icon: BookOpen,
            },
            {
              labelEn: 'Interactive Studios',
              labelFa: 'استودیوی شبیه‌سازی زنده',
              valueEn: '4',
              valueFa: '۴',
              unitEn: 'Real-time Sandboxes',
              unitFa: 'میز کار تعاملی',
              colorClass: 'text-emerald-500 border-emerald-500/20 bg-emerald-500/5',
              icon: Terminal,
            },
            {
              labelEn: 'Verifiable Assertions',
              labelFa: 'تست خودکار و ممیزی',
              valueEn: '46+',
              valueFa: '+۴۶',
              unitEn: 'Automated Tests',
              unitFa: 'آزمون تضمین کیفیت',
              colorClass: 'text-cyan-500 border-cyan-500/20 bg-cyan-500/5',
              icon: Shield,
            },
            {
              labelEn: 'Cohort Average XP',
              labelFa: 'میانگین امتیاز نخبگان',
              valueEn: '2,900+',
              valueFa: '+۲٬۹۰۰',
              unitEn: 'Mastery Points',
              unitFa: 'امتیاز تسلط',
              colorClass: 'text-amber-500 border-amber-500/20 bg-amber-500/5',
              icon: Award,
            },
          ].map((item, idx) => {
            const IconComp = item.icon;
            return (
              <div
                key={idx}
                className="p-4 rounded-2xl border border-slate-200/80 dark:border-white/[0.08] bg-white/70 dark:bg-[#0c121e]/70 backdrop-blur-md space-y-1.5 shadow-2xs"
              >
                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                  <span className="font-semibold">
                    {isEn ? item.labelEn : item.labelFa}
                  </span>
                  <IconComp className="w-4 h-4 opacity-70" />
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white tabular-nums">
                    {isEn ? item.valueEn : item.valueFa}
                  </span>
                  <span className="text-[11px] text-slate-500 font-medium">
                    {isEn ? item.unitEn : item.unitFa}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ============================================================ */}
      {/* 2. THE 8-MODULE ARCHITECTURAL CURRICULUM ROADMAP              */}
      {/* ============================================================ */}
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-200/80 dark:border-white/[0.07] pb-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-1">
              <Layers className="w-4 h-4" />
              <span>{isEn ? 'Roadmap & Chapters' : 'نقشه راه و سرفصل‌ها'}</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
              {isEn ? 'The 8-Chapter Engineering Curriculum' : 'برنامه درسی ۸ فصلی معمار ارشد سیستم‌های ایجنت‌محور'}
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1 max-w-2xl">
              {isEn
                ? 'From dual-surface workspaces to deterministic guardrails and multi-agent Git worktree scaling.'
                : 'مسیر یادگیری گام‌به‌گام از سطح مبانی تا پیشرفته‌ترین تکنیک‌های ارکستریشن و مهار Context Rot.'}
            </p>
          </div>

          {/* Phase Filter Tabs */}
          <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-white/[0.05] border border-slate-200/80 dark:border-white/[0.08] text-xs font-medium shrink-0">
            {[
              { id: 0, labelEn: 'All (8)', labelFa: 'همه (۸ فصل)' },
              { id: 1, labelEn: 'Phase 1', labelFa: 'گام ۱ (معماری هسته)' },
              { id: 2, labelEn: 'Phase 2', labelFa: 'گام ۲ (قوانین و کانتکست)' },
              { id: 3, labelEn: 'Phase 3', labelFa: 'گام ۳ (FastMCP و مقیاس)' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSelectedPhase(tab.id)}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  selectedPhase === tab.id
                    ? 'bg-white dark:bg-blue-600 text-slate-900 dark:text-white font-bold shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {isEn ? tab.labelEn : tab.labelFa}
              </button>
            ))}
          </div>
        </div>

        {/* Modules Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {displayedModules.map((mod) => {
            const isCompleted = completedModules.includes(mod.id);
            return (
              <div
                key={mod.id}
                className={`p-5 rounded-2xl border transition-all duration-200 flex flex-col justify-between gap-4 group ${
                  isCompleted
                    ? 'border-emerald-500/30 bg-emerald-500/[0.02] dark:bg-emerald-950/10'
                    : 'border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[#0c121e]/80 hover:border-blue-500/40 hover:shadow-md'
                }`}
              >
                <div className="space-y-3">
                  {/* Card Header & Meta */}
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-lg bg-blue-600 text-white font-mono text-xs font-black flex items-center justify-center shrink-0">
                        {formatLocalizedNumber(mod.number, language, true)}
                      </span>
                      <span className="text-slate-500 dark:text-slate-400 font-medium">
                        {mod.readingTime} · {mod.difficulty}
                      </span>
                    </div>

                    {isCompleted ? (
                      <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold text-[11px] bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>{isEn ? 'Completed' : 'تکمیل شده'}</span>
                      </span>
                    ) : (
                      <span className="text-[11px] font-mono text-slate-400">
                        {isEn ? 'Incomplete' : 'در انتظار مطالعه'}
                      </span>
                    )}
                  </div>

                  {/* Title & Summary */}
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {isEn ? mod.titleEn : mod.titleFa}
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mt-1 line-clamp-2">
                      {isEn ? (mod as any).summaryEn || mod.summaryFa : mod.summaryFa}
                    </p>
                  </div>

                  {/* Key Takeaways Highlights */}
                  {mod.keyTakeaways && mod.keyTakeaways.length > 0 && (
                    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200/60 dark:border-white/[0.05] space-y-1">
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        {isEn ? 'Key Takeaway' : 'مفهوم کلیدی معماری'}
                      </div>
                      <div className="text-xs text-slate-700 dark:text-slate-300 font-medium flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
                        <span className="truncate">{mod.keyTakeaways[0].titleFa}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer Action */}
                <div className="pt-2 border-t border-slate-100 dark:border-white/[0.05] flex items-center justify-between gap-3">
                  <span className="text-[11px] text-slate-500 font-bold">
                    {isEn
                      ? `MOD-0${mod.number}`
                      : `فصل ${formatLocalizedNumber(mod.number, 'fa', true)}`}
                  </span>
                  <button
                    type="button"
                    onClick={() => onStartCurriculum(mod.id)}
                    className="px-3.5 py-1.5 rounded-xl bg-slate-100 dark:bg-white/[0.06] hover:bg-blue-600 hover:text-white text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer group-hover:bg-blue-600 group-hover:text-white"
                  >
                    <span>{isEn ? 'Study Chapter' : 'مطالعه سرفصل'}</span>
                    {isRTL ? <ChevronLeft className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ============================================================ */}
      {/* 3. INTERACTIVE ENGINEERING STUDIOS SHOWCASE                   */}
      {/* ============================================================ */}
      <section className="space-y-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-1">
            <Terminal className="w-4 h-4" />
            <span>{isEn ? 'Interactive Sandboxes' : 'میز کارهای مهندسی زنده'}</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
            {isEn ? '4 Mission-Critical Engineering Studios' : '۴ استودیوی شبیه‌سازی زنده و آزمایشی'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1 max-w-2xl">
            {isEn
              ? 'Test, audit, and generate production code in real-time without leaving your browser.'
              : 'ابزارهای کارگاهی بلادرنگ برای شبیه‌سازی اتاق فرمان، تولید قوانین و سناریوهای بحرانی.'}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              id: 'simulator' as const,
              titleEn: 'Mission Control Simulator',
              titleFa: 'شبیه‌ساز Mission Control',
              descEn: 'Dual-surface Editor vs Manager view and artifact audit workflows.',
              descFa: 'معماری دوگانه ویرایشگر و مدیر ایجنت، همراه با ممیزی task.md و plan.',
              icon: Terminal,
              color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/30',
              tag: 'Dual-View IDE',
            },
            {
              id: 'guardrails' as const,
              titleEn: 'Rule & Workflow Studio',
              titleFa: 'استودیوی Rule و اتوماسیون',
              descEn: '4-mode rules, turbo pipelines, and terminal safety guardrails.',
              descFa: 'طراحی قوانین چهارحالته، پایپ‌لاین‌های // turbo و مهار فرامین مخرب.',
              icon: Shield,
              color: 'text-amber-500 bg-amber-500/10 border-amber-500/30',
              tag: 'Turbo Rules',
            },
            {
              id: 'mcp' as const,
              titleEn: 'FastMCP Visual Studio',
              titleFa: 'استودیوی بصری FastMCP',
              descEn: 'Model Context Protocol 2.0 servers with real-time JSON-RPC inspector.',
              descFa: 'توسعه سرورهای پایتون FastMCP 2.0، بازرسی JSON-RPC و فایل‌های پیکربندی.',
              icon: Cpu,
              color: 'text-cyan-500 bg-cyan-500/10 border-cyan-500/30',
              tag: 'MCP 2.0',
            },
            {
              id: 'scenarios' as const,
              titleEn: 'Architect Scenario Lab',
              titleFa: 'آزمایشگاه سناریوهای معماری',
              descEn: '8 production incident challenges with trade-off audits and scoring.',
              descFa: '۸ چالش تصمیم‌گیری در شرایط بحرانی پروداکشن با ارزیابی تریدآف‌ها.',
              icon: Target,
              color: 'text-rose-500 bg-rose-500/10 border-rose-500/30',
              tag: '8 Scenarios',
            },
          ].map((studio) => {
            const IconComp = studio.icon;
            return (
              <div
                key={studio.id}
                className="p-5 rounded-2xl border border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[#0c121e]/80 flex flex-col justify-between gap-4 group hover:border-blue-500/40 transition-all hover:shadow-md"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className={`p-2 rounded-xl border ${studio.color}`}>
                      <IconComp className="w-5 h-5" />
                    </span>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-white/[0.06] text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-white/[0.06]">
                      {studio.tag}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-sm font-extrabold text-slate-900 dark:text-white group-hover:text-blue-500 transition-colors">
                      {isEn ? studio.titleEn : studio.titleFa}
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                      {isEn ? studio.descEn : studio.descFa}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onOpenStudio(studio.id)}
                  className="w-full py-2 rounded-xl bg-slate-100 dark:bg-white/[0.06] hover:bg-blue-600 hover:text-white text-slate-800 dark:text-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>{isEn ? 'Launch Studio' : 'ورود به استودیو'}</span>
                </button>
              </div>
            );
          })}
        </div>
      </section>

      {/* ============================================================ */}
      {/* 4. ACADEMY LEADERBOARD & STUDENT COHORT TEASER               */}
      {/* ============================================================ */}
      <section className="p-6 sm:p-8 rounded-3xl border border-slate-200/80 dark:border-white/[0.08] bg-gradient-to-br from-white via-slate-50 to-blue-50/40 dark:from-[#0d1424] dark:via-[#0b101c] dark:to-[#080c14] space-y-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-amber-500 dark:text-amber-400 uppercase tracking-wider mb-1">
              <Award className="w-4 h-4" />
              <span>{isEn ? 'Top Performers' : 'نخبگان و معماران برتر دوره'}</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
              {isEn ? 'Academy Knowledge Check Leaderboard' : 'جدول رتبه‌بندی آزمون‌های مهارتی آکادمی'}
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-0.5">
              {isEn
                ? 'Top scoring student architects ranked by quiz XP and precision accuracy.'
                : 'رده‌بندی برترین معماران سیستم بر اساس پاسخ به آزمون‌های انتهای هر فصل و سنجش دقت.'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onOpenAchievements}
              className="px-4 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-500/30 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <span>{isEn ? 'Full Leaderboard & Certificates' : 'مشاهده کارنامه و گواهینامه‌ها'}</span>
              {isRTL ? <ChevronLeft className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Top 3 Preview Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {leaderboard.top5Students.slice(0, 3).map((student) => (
            <div
              key={student.studentId}
              className={`p-4 rounded-xl border flex items-center justify-between gap-3 ${
                student.isCurrentUser
                  ? 'border-blue-500/40 bg-blue-500/10 ring-1 ring-blue-500/20'
                  : 'border-slate-200/80 dark:border-white/[0.06] bg-white/70 dark:bg-white/[0.02]'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <span
                  className={`w-7 h-7 rounded-lg text-xs font-black flex items-center justify-center shrink-0 tabular-nums ${
                    student.rank === 1
                      ? 'bg-amber-500 text-white shadow-xs'
                      : student.rank === 2
                      ? 'bg-slate-300 dark:bg-slate-700 text-slate-800 dark:text-slate-100'
                      : 'bg-amber-700 text-white'
                  }`}
                >
                  #{formatLocalizedNumber(student.rank, language)}
                </span>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                    {isEn ? student.displayNameEn : student.displayNameFa}
                  </div>
                  <div className="text-[10px] font-medium text-slate-500 dark:text-slate-400 truncate">
                    {student.topSpecialtyBadge}
                  </div>
                </div>
              </div>

              <div className="text-end shrink-0 tabular-nums">
                <div className="text-xs font-bold text-blue-600 dark:text-blue-400">
                  {formatLocalizedThousand(student.cumulativeScoreXp, language)} XP
                </div>
                <div className="text-[10px] text-emerald-500 font-semibold">
                  {formatLocalizedNumber(student.averageAccuracyPercent, language)}
                  {isEn ? '% Acc' : '٪ دقت'}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ============================================================ */}
      {/* 5. ARCHITECT'S DAILY MISSION BANNER                          */}
      {/* ============================================================ */}
      <section className="p-6 rounded-2xl border border-blue-500/30 bg-blue-500/5 flex flex-col sm:flex-row items-center justify-between gap-5">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-blue-500/30">
            <Flame className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-blue-600 dark:text-blue-400">
                {isEn ? "Architect's Daily Mission" : 'ماموریت روزانه معمار'}
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-600 dark:text-blue-400 tabular-nums">
                +{formatLocalizedNumber(dailyMission.xpReward, language)} XP
              </span>
            </div>
            <h3 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white">
              {isEn ? dailyMission.titleEn : dailyMission.titleFa}
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-1">
              {isEn ? dailyMission.descEn : dailyMission.descFa}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => onOpenStudio(dailyMission.targetSection as any)}
          className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shrink-0 transition-colors cursor-pointer shadow-xs"
        >
          {isEn ? 'Accept & Solve Mission' : 'انجام ماموریت و کسب XP'}
        </button>
      </section>

      {/* ============================================================ */}
      {/* 6. WHY ANTIGRAVITY ARCHITECTURE? (PARADIGM COMPARISON)        */}
      {/* ============================================================ */}
      <section className="space-y-6">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <h2 className="text-2xl font-black text-slate-900 dark:text-white">
            {isEn ? 'The Paradigm Shift: Autocomplete vs. Agent-First' : 'تحول بنیادین: اتوکامپلیت خط‌به‌خط در برابر معماری ایجنت‌محور'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
            {isEn
              ? 'Why industry engineering teams are migrating to Google Antigravity dual-view architecture.'
              : 'چرا تیم‌های مهندسی مدرن به معماری دوگانه و ایزولاسیون Git Worktree روی می‌آورند.'}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            {
              titleEn: '1. Verifiable Artifacts',
              titleFa: '۱. آرتیفکت‌های قابل ممیزی',
              descEn: 'Agents never touch production code directly. Every action produces task.md, implementation_plan.md, and walkthrough.md for strict human-in-the-loop audit.',
              descFa: 'ایجنت مستقیماً کد را بدون طرح تغییر نمی‌دهد؛ تمام مراحل از طریق اسناد ممیزی دقیق task.md و plan تایید می‌شوند.',
              icon: FileSpreadsheet,
            },
            {
              titleEn: '2. Deterministic Context Rules',
              titleFa: '۲. مهار Context Rot با قوانین ۴ حالته',
              descEn: 'Say goodbye to bloated 50,000-token prompts. Four activation modes (Always On, Glob, Model Decision, Manual) enforce surgical token hygiene.',
              descFa: 'پایان تزریق فایل‌های غیرضروری به حافظه ایجنت؛ قوانین براساس Glob و ارزیابی هوشمند فقط در زمان نیاز لود می‌شوند.',
              icon: Shield,
            },
            {
              titleEn: '3. Parallel Worktree Isolation',
              titleFa: '۳. ارکستریشن موازی روی Git Worktree',
              descEn: 'Spin up 5 concurrent agents on isolated branches without merge conflicts or workspace pollution. Scaled for enterprise monorepos.',
              descFa: 'اجرای همزمان چندین ایجنت روی شاخه‌های ایزوله Git بدون تداخل فایلی یا ریسک خراب شدن برنچ اصلی.',
              icon: GitBranch,
            },
          ].map((card, idx) => {
            const IconComp = card.icon;
            return (
              <div
                key={idx}
                className="p-5 rounded-2xl border border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[#0c121e]/80 space-y-3 shadow-2xs"
              >
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                  <IconComp className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                  {isEn ? card.titleEn : card.titleFa}
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  {isEn ? card.descEn : card.descFa}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* ============================================================ */}
      {/* 7. FINAL CALL TO ACTION BANNER                                */}
      {/* ============================================================ */}
      <section className="relative overflow-hidden p-8 sm:p-12 rounded-3xl border border-blue-500/30 bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-600 text-white text-center space-y-5 shadow-xl shadow-blue-500/20">
        <div className="max-w-2xl mx-auto space-y-3">
          <h2 className="text-2xl sm:text-4xl font-black">
            {isEn ? 'Ready to Elevate Your Engineering Standards?' : 'آماده‌اید به معمار ارشد سیستم‌های ایجنت‌محور تبدیل شوید؟'}
          </h2>
          <p className="text-xs sm:text-sm text-blue-100 font-normal leading-relaxed">
            {isEn
              ? 'Join hundreds of software architects mastering Google Antigravity. Start with Module 1, practice in live studios, and earn your official verified certification.'
              : 'به جمع مهندسان و معماران پیشرو بپیوندید. از فصل اول آغاز کنید، در استودیوهای بلادرنگ مهارت کسب کنید و گواهینامه رسمی خود را دریافت نمایید.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <button
            type="button"
            onClick={() => onStartCurriculum('module-1')}
            className="px-6 py-3 rounded-xl bg-white hover:bg-slate-100 text-blue-600 font-bold text-xs sm:text-sm shadow-md transition-all cursor-pointer hover:scale-[1.02]"
          >
            {isEn ? 'Start Learning Now (Free & Open Source)' : 'شروع یادگیری (رایگان و متن‌باز)'}
          </button>
          <button
            type="button"
            onClick={onOpenProfile}
            className="px-5 py-3 rounded-xl bg-blue-700/60 hover:bg-blue-700 text-white font-semibold text-xs sm:text-sm border border-white/20 transition-all cursor-pointer"
          >
            {isEn ? 'View My Transcript' : 'مشاهده کارنامه من'}
          </button>
        </div>
      </section>
    </div>
  );
};
