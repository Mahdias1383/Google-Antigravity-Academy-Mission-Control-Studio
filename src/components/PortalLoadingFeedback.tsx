import React from 'react';
import { LoadingFeedbackState } from '../services/loadingFeedbackService';
import { Language } from '../i18n/translations';
import { Loader2, Sparkles, Activity, Train, BarChart3, Table2 } from 'lucide-react';

interface PortalProgressBarProps {
  state: LoadingFeedbackState;
  language: Language;
  portalName: 'admin' | 'operations';
}

export const PortalProgressBar: React.FC<PortalProgressBarProps> = ({
  state,
  language,
  portalName,
}) => {
  if (!state.isActive && !state.isPinnedPreview) {
    return null;
  }

  const isRtl = language === 'fa';

  const badgeColors: Record<LoadingFeedbackState['accentColor'], string> = {
    emerald: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
    blue: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
    indigo: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40',
    amber: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
    cyan: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
  };

  const barColors: Record<LoadingFeedbackState['accentColor'], string> = {
    emerald: 'from-emerald-500 via-teal-400 to-cyan-400',
    blue: 'from-blue-600 via-indigo-500 to-cyan-400',
    indigo: 'from-indigo-600 via-purple-500 to-cyan-400',
    amber: 'from-amber-500 via-orange-400 to-yellow-300',
    cyan: 'from-cyan-500 via-blue-500 to-indigo-400',
  };

  return (
    <div
      data-testid="portal-transition-progress-bar"
      data-portal={portalName}
      data-progress={state.progressPercent}
      role="status"
      aria-live="polite"
      className="no-print p-3.5 rounded-2xl bg-slate-900/95 border border-slate-700/90 shadow-xl space-y-2.5 transition-all"
    >
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2 min-w-0">
          <Loader2 className="w-4 h-4 text-cyan-400 animate-spin shrink-0" />
          <span
            className={`px-2 py-0.5 rounded-md text-[10px] font-bold border uppercase tracking-wider shrink-0 ${
              badgeColors[state.accentColor]
            }`}
          >
            {isRtl ? state.badgeFa : state.badgeEn}
          </span>
          <span className="font-semibold text-slate-200 truncate">
            {isRtl ? state.stageLabelFa : state.stageLabelEn}
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[11px] text-slate-400">
            {isRtl ? 'پیشرفت واکشی:' : 'Fetch Progress:'}
          </span>
          <span
            dir="ltr"
            data-testid="portal-progress-percent"
            className="px-2 py-0.5 rounded bg-slate-950 border border-slate-700 font-mono text-[11px] font-bold text-cyan-300"
          >
            {state.progressPercent}%
          </span>
        </div>
      </div>

      {/* Zero-Inline-Style Stepped Tailwind Progress Track */}
      <div
        dir="ltr"
        className="w-full h-2 rounded-full bg-slate-950 border border-slate-800 overflow-hidden p-0.5"
      >
        <div
          data-testid="portal-progress-fill"
          className={`h-full rounded-full bg-gradient-to-r ${barColors[state.accentColor]} ${state.widthClass} transition-all duration-200`}
        />
      </div>

      {/* Step Milestones */}
      <div className="grid grid-cols-3 gap-2 pt-0.5 text-[10px] text-slate-400">
        <div className="flex items-center gap-1.5">
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              state.progressPercent >= 25 ? 'bg-emerald-400' : 'bg-slate-600'
            }`}
          />
          <span className={state.progressPercent >= 25 ? 'text-slate-200 font-medium' : ''}>
            {isRtl ? '۱. واکشی مخزن داده' : '1. Repository Fetch'}
          </span>
        </div>
        <div className="flex items-center gap-1.5 justify-center">
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              state.progressPercent >= 65 ? 'bg-cyan-400' : 'bg-slate-600'
            }`}
          />
          <span className={state.progressPercent >= 65 ? 'text-slate-200 font-medium' : ''}>
            {isRtl ? '۲. اعتبارسنجی و محاسبات' : '2. Validation & Math'}
          </span>
        </div>
        <div className="flex items-center gap-1.5 justify-end">
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              state.progressPercent >= 95 ? 'bg-indigo-400' : 'bg-slate-600'
            }`}
          />
          <span className={state.progressPercent >= 95 ? 'text-slate-200 font-medium' : ''}>
            {isRtl ? '۳. همگام‌سازی رابط کاربری' : '3. UI Synchronization'}
          </span>
        </div>
      </div>
    </div>
  );
};

interface PortalLoadingSkeletonProps {
  state: LoadingFeedbackState;
  language: Language;
  portalName: 'admin' | 'operations';
}

export const PortalLoadingSkeleton: React.FC<PortalLoadingSkeletonProps> = ({
  state,
  language,
  portalName,
}) => {
  if (!state.isSkeletonVisible && !state.isPinnedPreview) {
    return null;
  }

  const isRtl = language === 'fa';

  return (
    <div
      data-testid="portal-loading-skeleton"
      data-variant={state.skeletonVariant}
      data-portal={portalName}
      aria-busy="true"
      className="no-print p-5 rounded-2xl bg-slate-900/90 border border-slate-700/80 shadow-xl space-y-5 animate-pulse"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3.5">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-cyan-400">
            {state.skeletonVariant === 'marey_graph' ? (
              <Train className="w-4 h-4" />
            ) : state.skeletonVariant === 'dashboard' ? (
              <BarChart3 className="w-4 h-4" />
            ) : state.skeletonVariant === 'timeline' ? (
              <Activity className="w-4 h-4" />
            ) : (
              <Table2 className="w-4 h-4" />
            )}
          </div>
          <div className="space-y-1.5">
            <div className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>
                {isRtl
                  ? 'در حال آماده‌سازی و بروزرسانی ساختار داده‌ها (اسکلت بارگذاری)...'
                  : 'Preparing & synchronizing view telemetry (Loading Skeleton)...'}
              </span>
            </div>
            <div className="h-2.5 w-48 rounded bg-slate-800" />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="h-7 w-24 rounded-lg bg-slate-800 border border-slate-700/60" />
          <div className="h-7 w-20 rounded-lg bg-slate-800 border border-slate-700/60" />
        </div>
      </div>

      {state.skeletonVariant === 'dashboard' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {[1, 2, 3, 4].map((idx) => (
              <div
                key={idx}
                className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="h-3 w-24 rounded bg-slate-800" />
                  <div className="h-5 w-5 rounded-lg bg-slate-800" />
                </div>
                <div className="h-6 w-32 rounded bg-slate-800" />
                <div className="h-2.5 w-20 rounded bg-slate-800/70" />
              </div>
            ))}
          </div>
        </div>
      )}

      {state.skeletonVariant === 'marey_graph' && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3">
            {[1, 2, 3, 4].map((stationIdx) => (
              <div key={stationIdx} className="flex items-center gap-3">
                <div className="h-3 w-20 rounded bg-slate-800 shrink-0" />
                <div className="w-full h-2 rounded-full bg-slate-800/80" />
              </div>
            ))}
          </div>
        </div>
      )}

      {(state.skeletonVariant === 'timeline' || state.skeletonVariant === 'table') && (
        <div className="space-y-2.5">
          {[1, 2, 3].map((rowIdx) => (
            <div
              key={rowIdx}
              className="h-12 rounded-xl bg-slate-950/70 border border-slate-800 px-4 flex items-center justify-between gap-4"
            >
              <div className="h-3.5 w-48 rounded bg-slate-800" />
              <div className="h-3.5 w-28 rounded bg-slate-800" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
