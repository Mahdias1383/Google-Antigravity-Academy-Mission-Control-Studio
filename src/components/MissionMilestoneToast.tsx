import React from 'react';
import {
  Award,
  Sparkles,
  CheckCircle2,
  ArrowUpLeft,
  Quote,
  X,
  Trophy,
} from 'lucide-react';
import { MissionMilestonePayload } from '../utils/generators';

const DELAY_CLASS_MAP: Record<number, string> = {
  0: '[animation-delay:0ms]',
  90: '[animation-delay:90ms]',
  180: '[animation-delay:180ms]',
  270: '[animation-delay:270ms]',
  360: '[animation-delay:360ms]',
  450: '[animation-delay:450ms]',
};

const DURATION_CLASS_MAP: Record<number, string> = {
  1800: '[animation-duration:1800ms]',
  2060: '[animation-duration:2060ms]',
  2320: '[animation-duration:2320ms]',
  2580: '[animation-duration:2580ms]',
  2840: '[animation-duration:2840ms]',
};

export const MissionMilestoneOverlay: React.FC<{
  milestone: MissionMilestonePayload | null;
  onClose: () => void;
  onAdvanceNextModule: (nextModuleNumber: number) => void;
  onOpenTrophyCase: () => void;
}> = ({ milestone, onClose, onAdvanceNextModule, onOpenTrophyCase }) => {
  if (!milestone) return null;

  const nextModuleNum =
    milestone.moduleNumber < milestone.totalModules
      ? milestone.moduleNumber + 1
      : 1;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="mission-milestone-title"
      data-testid="mission-milestone-overlay"
    >
      <div className="relative w-full max-w-xl rounded-2xl border border-emerald-500/40 bg-white dark:bg-[#0d1322] text-slate-900 dark:text-slate-100 shadow-2xl overflow-hidden">
        {/* Subtle Confetti Animation SVG Layer */}
        <svg
          viewBox="0 0 600 180"
          preserveAspectRatio="none"
          aria-hidden="true"
          data-testid="mission-milestone-confetti"
          className="pointer-events-none absolute inset-x-0 top-0 h-44 w-full overflow-visible"
        >
          {milestone.confettiParticles.map((p) => {
            const cx = Math.round((p.leftPercent / 100) * 600);
            const delayCls = DELAY_CLASS_MAP[p.delayMs] || '[animation-delay:120ms]';
            const durCls =
              DURATION_CLASS_MAP[p.durationMs] || '[animation-duration:2200ms]';

            return (
              <g
                key={p.id}
                className={`milestone-confetti-particle ${delayCls} ${durCls}`}
              >
                {p.shape === 'circle' && (
                  <circle cx={cx} cy={14} r={3.5} fill={p.colorHex} />
                )}
                {p.shape === 'rect' && (
                  <rect
                    x={cx - 4}
                    y={10}
                    width={8}
                    height={4.5}
                    rx={1.5}
                    fill={p.colorHex}
                  />
                )}
                {p.shape === 'diamond' && (
                  <polygon
                    points={`${cx},8 ${cx + 4.5},13 ${cx},18 ${cx - 4.5},13`}
                    fill={p.colorHex}
                  />
                )}
              </g>
            );
          })}
        </svg>

        {/* Top Celebration Header */}
        <div className="relative px-6 py-4 bg-gradient-to-l from-emerald-500/15 via-blue-600/10 to-indigo-500/15 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-500 shrink-0">
              {milestone.isFullAcademyMastery ? (
                <Trophy className="w-5 h-5 text-amber-400" />
              ) : (
                <Award className="w-5 h-5" />
              )}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span
                  dir="ltr"
                  data-testid="mission-milestone-badge"
                  className="ltr-inline px-2.5 py-0.5 rounded-md bg-emerald-500/20 border border-emerald-500/40 text-emerald-600 dark:text-emerald-300 font-mono text-[11px] font-bold"
                >
                  MISSION MILESTONE · MODULE 0{milestone.moduleNumber}
                </span>
                <span
                  dir="ltr"
                  data-testid="mission-milestone-xp"
                  className="ltr-inline px-2 py-0.5 rounded-md bg-amber-500/20 border border-amber-500/40 text-amber-600 dark:text-amber-300 font-mono text-[11px] font-bold"
                >
                  +{milestone.xpAwarded} XP
                </span>
              </div>
              <h2
                id="mission-milestone-title"
                className="text-sm sm:text-base font-black text-slate-900 dark:text-white mt-1"
              >
                {milestone.isFullAcademyMastery
                  ? 'تبریک! تسلط کامل ۱۰۰٪ بر تمام ۸ فصل آکادمی Antigravity!'
                  : 'نقطه عطف مأموریت مهندسی با موفقیت ثبت شد!'}
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close Mission Milestone Overlay"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-200/70 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Overlay Body */}
        <div className="relative p-6 space-y-5">
          {/* Completed Module Summary Card */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-900/80 flex items-start justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
              <div>
                <div
                  data-testid="mission-milestone-module-fa"
                  className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white"
                >
                  فصل {milestone.moduleNumber}: {milestone.moduleTitleFa}
                </div>
                <div
                  dir="ltr"
                  data-testid="mission-milestone-module-en"
                  className="ltr-inline text-xs font-mono text-blue-600 dark:text-blue-400 mt-0.5 block"
                >
                  Module 0{milestone.moduleNumber}: {milestone.moduleTitleEn}
                </div>
              </div>
            </div>

            <span
              dir="ltr"
              className="ltr-inline px-2.5 py-1 rounded-lg bg-blue-600/15 border border-blue-500/30 text-blue-600 dark:text-blue-400 font-mono text-xs font-bold shrink-0 tabular-nums"
            >
              {milestone.completedCount}/{milestone.totalModules} ({milestone.completionPercent}%)
            </span>
          </div>

          {/* Antigravity Engineering Motivational Quote Card */}
          <div
            data-testid="mission-milestone-quote"
            className="p-5 rounded-2xl border border-blue-500/35 bg-gradient-to-br from-blue-600/10 via-indigo-600/5 to-emerald-500/10 space-y-3"
          >
            <div className="flex items-center justify-between gap-2">
              <span
                dir="ltr"
                data-testid="mission-milestone-principle"
                className="ltr-inline px-2.5 py-0.5 rounded bg-indigo-500/20 border border-indigo-500/30 text-indigo-600 dark:text-indigo-300 font-mono text-[10px] font-bold"
              >
                {milestone.quote.engineeringPrincipleEn}
              </span>
              <Quote className="w-4 h-4 text-blue-500 shrink-0" />
            </div>

            <blockquote
              data-testid="mission-milestone-quote-fa"
              className="text-xs sm:text-sm font-bold leading-7 text-slate-800 dark:text-slate-100"
            >
              «{milestone.quote.quoteFa}»
            </blockquote>

            <div
              dir="ltr"
              data-testid="mission-milestone-quote-en"
              className="ltr-inline text-xs font-mono italic text-slate-600 dark:text-slate-300 leading-5 block border-l-2 border-blue-500 pl-3"
            >
              &ldquo;{milestone.quote.quoteEn}&rdquo;
            </div>

            <div
              dir="ltr"
              className="ltr-inline text-[11px] font-mono font-semibold text-emerald-600 dark:text-emerald-400 block"
            >
              — {milestone.quote.authorRoleEn}
            </div>
          </div>

          {/* SVG Progress Bar (Zero Inline Style) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>پیشرفت کل در مسیر گواهینامه معمار ارشد:</span>
              </span>
              <span
                dir="ltr"
                className="ltr-inline font-mono font-bold text-emerald-500 tabular-nums"
              >
                {milestone.completionPercent}% Mastery
              </span>
            </div>
            <svg
              viewBox="0 0 100 4"
              preserveAspectRatio="none"
              className="w-full h-2.5 rounded-full overflow-hidden bg-slate-200 dark:bg-slate-800"
            >
              <rect
                x={0}
                y={0}
                width={milestone.completionPercent}
                height={4}
                fill="#10b981"
              />
            </svg>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2.5 pt-1">
            <button
              type="button"
              onClick={onClose}
              data-testid="dismiss-milestone-overlay-btn"
              className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              بستن و ادامه مطالعه (Dismiss)
            </button>

            <button
              type="button"
              onClick={onOpenTrophyCase}
              data-testid="milestone-view-trophies-btn"
              className="px-4 py-2.5 rounded-xl border border-amber-500/40 bg-amber-500/15 hover:bg-amber-500/25 text-amber-700 dark:text-amber-300 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <Trophy className="w-3.5 h-3.5" />
              <span>تالار افتخارات و XP</span>
            </button>

            {!milestone.isFullAcademyMastery && (
              <button
                type="button"
                onClick={() => onAdvanceNextModule(nextModuleNum)}
                data-testid="milestone-next-module-btn"
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <span>پرش به فصل {nextModuleNum}</span>
                <ArrowUpLeft className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
