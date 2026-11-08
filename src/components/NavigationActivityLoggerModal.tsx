import React, { useState, useMemo, useEffect } from 'react';
import {
  Activity,
  X,
  Search,
  Trash2,
  Download,
  ArrowUpRight,
  Clock,
  Layers,
  Compass,
  Filter,
  Check,
  Calendar,
  BarChart3,
  Flame,
  ChevronRight,
  ArrowRight,
  Zap,
  RotateCcw,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import {
  NavigationActivityEvent,
  WorkspaceSectionId,
  aggregateActivityEventsByDateAndSection,
  calculateActivityLogStats,
  filterActivityLogEvents,
  formatActivityDateDisplay,
  serializeActivityLogsToStorage,
} from '../utils/activityLogger';
import { useLanguage } from '../context/LanguageContext';
import { formatLocalizedNumber, localizeDigits } from '../utils/bidiText';

interface NavigationActivityLoggerModalProps {
  isOpen: boolean;
  onClose: () => void;
  logs: NavigationActivityEvent[];
  onClearHistory: () => void;
  onNavigateToEntry: (section: WorkspaceSectionId, moduleId?: string) => void;
}

export const NavigationActivityLoggerModal: React.FC<NavigationActivityLoggerModalProps> = ({
  isOpen,
  onClose,
  logs,
  onClearHistory,
  onNavigateToEntry,
}) => {
  const { language, isRTL } = useLanguage();
  const [filterCategory, setFilterCategory] = useState<'all' | 'curriculum' | 'studio'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [copiedJson, setCopiedJson] = useState<boolean>(false);
  const [showChart, setShowChart] = useState<boolean>(true);

  const stats = useMemo(() => calculateActivityLogStats(logs), [logs]);
  const filteredLogs = useMemo(
    () => filterActivityLogEvents(logs, filterCategory, searchQuery, startDate, endDate),
    [logs, filterCategory, searchQuery, startDate, endDate]
  );
  const chartSummary = useMemo(
    () => aggregateActivityEventsByDateAndSection(filteredLogs),
    [filteredLogs]
  );

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleCopyOrDownloadJson = () => {
    const jsonPayload = serializeActivityLogsToStorage(logs);
    try {
      if (navigator.clipboard) {
        navigator.clipboard.writeText(jsonPayload);
        setCopiedJson(true);
        setTimeout(() => setCopiedJson(false), 2000);
      }
      const blob = new Blob([jsonPayload], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `antigravity-navigation-history-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      // Ignore clipboard/download error
    }
  };

  const hasActiveFilters = filterCategory !== 'all' || searchQuery.trim() !== '' || startDate !== '' || endDate !== '';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 dark:bg-black/80 backdrop-blur-xl p-3 sm:p-5"
      role="dialog"
      aria-modal="true"
      aria-labelledby="activity-logger-modal-title"
      data-testid="activity-logger-modal"
      onClick={onClose}
    >
      {/* Outer Subtle Refined Gradient Border Capsule (Mission Control Aesthetic) */}
      <div
        className="relative w-full max-w-4xl p-[1px] rounded-3xl bg-gradient-to-br from-cyan-500/40 via-indigo-500/25 to-slate-800/40 shadow-[0_0_50px_-10px_rgba(6,182,212,0.28)] transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Inner Semi-Transparent Glassmorphic Modal Panel */}
        <div
          dir={isRTL ? 'rtl' : 'ltr'}
          className="w-full rounded-[calc(1.5rem-1px)] bg-white/80 dark:bg-[#070b14]/80 backdrop-blur-2xl text-slate-900 dark:text-slate-100 shadow-2xl flex flex-col max-h-[92vh] overflow-hidden border border-white/20 dark:border-white/[0.06]"
        >
          {/* Terminal Header with Frosted Glass Overlay */}
          <div className="px-6 py-4 bg-slate-100/60 dark:bg-[#040811]/60 backdrop-blur-md border-b border-slate-200/70 dark:border-cyan-500/15 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0 shadow-inner">
              <Activity className="w-5 h-5 animate-pulse" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2
                  id="activity-logger-modal-title"
                  className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white tracking-tight truncate"
                >
                  {language === 'en'
                    ? 'Browser Navigation History & Event Logger'
                    : 'تاریخچه ناوبری و ثبت‌کننده رویدادهای مرورگر'}
                </h2>
                <span className="hidden sm:inline-block w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              </div>
              <div
                dir="ltr"
                className="ltr-inline text-[11px] font-mono text-cyan-600 dark:text-cyan-400 flex items-center gap-1.5"
              >
                <span>event: section_change</span>
                <span className="opacity-40">/</span>
                <span>localStorage Stream</span>
                <span className="opacity-40">/</span>
                <span className="text-emerald-500">Live Telemetry</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => setShowChart((prev) => !prev)}
              aria-label={language === 'en' ? 'Toggle Analytics Chart' : 'نمایش/مخفی‌سازی نمودار تحلیلی'}
              className={`p-2 rounded-lg text-xs font-medium transition-colors border cursor-pointer ${
                showChart
                  ? 'bg-cyan-500/15 border-cyan-500/30 text-cyan-400'
                  : 'bg-slate-100 dark:bg-slate-800/60 border-transparent text-slate-400 hover:text-slate-200'
              }`}
              title={language === 'en' ? 'Toggle Analytics Chart' : 'تغییر وضعیت نمودار'}
            >
              <BarChart3 className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={onClose}
              aria-label={language === 'en' ? 'Close Navigation Activity Logger' : 'بستن پنجره تاریخچه ناوبری'}
              data-testid="close-activity-logger-btn"
              className="p-2 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-800/80 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Studio-Grade Metric Cards Banner */}
        <div className="px-6 pt-4 pb-1">
          <div
            data-testid="activity-logger-summary-stats-card"
            className="p-3.5 rounded-2xl border border-slate-200/70 dark:border-white/[0.08] bg-slate-100/50 dark:bg-slate-900/40 backdrop-blur-md grid grid-cols-1 sm:grid-cols-12 gap-3 items-stretch shadow-inner"
          >
            {/* Total Session Time */}
            <div
              data-testid="activity-logger-total-session-time"
              className="sm:col-span-4 p-3 rounded-xl border border-cyan-500/25 bg-cyan-500/10 dark:bg-cyan-950/30 backdrop-blur-sm flex items-center gap-3.5 relative overflow-hidden"
            >
              <div className="w-9 h-9 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center shrink-0 shadow-sm border border-cyan-500/30">
                <Clock className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 tracking-wide uppercase">
                  {language === 'en' ? 'Total Session Time' : 'مجموع زمان نشست'}
                </div>
                <div className="flex items-baseline justify-between gap-2 mt-1">
                  <span
                    dir="ltr"
                    data-testid="activity-logger-session-time-value"
                    className="ltr-inline text-base font-mono font-extrabold text-cyan-600 dark:text-cyan-400 tabular-nums"
                  >
                    {localizeDigits(stats.totalSessionTimeFormatted, language)}
                  </span>
                  <span
                    dir="ltr"
                    className="ltr-inline text-[11px] font-mono text-cyan-700 dark:text-cyan-300 tabular-nums shrink-0 opacity-80"
                  >
                    {language === 'en'
                      ? `${stats.activeSessionsCount} ${stats.activeSessionsCount === 1 ? 'session' : 'sessions'}`
                      : `${formatLocalizedNumber(stats.activeSessionsCount, 'fa')} نشست`}
                  </span>
                </div>
              </div>
            </div>

            {/* Most Visited Section */}
            <div
              data-testid="activity-logger-most-visited-section"
              className="sm:col-span-5 p-3 rounded-xl border border-amber-500/25 bg-amber-500/10 dark:bg-amber-950/30 backdrop-blur-sm flex items-center gap-3.5 relative overflow-hidden"
            >
              <div className="w-9 h-9 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 shadow-sm border border-amber-500/30">
                <Compass className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 tracking-wide uppercase">
                    {language === 'en' ? 'Most Visited Section' : 'پربازدیدترین بخش'}
                  </span>
                  <span
                    dir="ltr"
                    data-testid="activity-logger-most-visited-count"
                    className="ltr-inline text-[11px] font-mono font-semibold text-amber-600 dark:text-amber-300 tabular-nums shrink-0"
                  >
                    {language === 'en'
                      ? `${stats.topSectionCount} ${stats.topSectionCount === 1 ? 'visit' : 'visits'}`
                      : `${formatLocalizedNumber(stats.topSectionCount, 'fa')} بازدید`}
                  </span>
                </div>
                <div
                  data-testid="activity-logger-most-visited-value"
                  className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white leading-snug mt-1 truncate"
                >
                  {language === 'en' ? stats.topSectionTitleEn : stats.topSectionTitleFa}
                </div>
              </div>
            </div>

            {/* Logged Events & Unique Sections */}
            <div className="sm:col-span-3 p-3 rounded-xl border border-slate-200/70 dark:border-white/[0.08] bg-white/50 dark:bg-slate-900/40 backdrop-blur-sm flex flex-col justify-between gap-2">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1.5 whitespace-nowrap">
                  <Activity className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                  {language === 'en' ? 'Logged Events' : 'رویدادهای ثبت‌شده'}
                </span>
                <span
                  dir="ltr"
                  data-testid="activity-logger-total-count"
                  className="ltr-inline text-xs font-mono font-extrabold text-slate-900 dark:text-white tabular-nums shrink-0"
                >
                  {formatLocalizedNumber(stats.totalEvents, language)}
                </span>
              </div>
              <div className="flex items-center justify-between gap-2 pt-1.5 border-t border-slate-200/80 dark:border-slate-800/80">
                <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1.5 whitespace-nowrap">
                  <Layers className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  {language === 'en' ? 'Unique Sections' : 'بخش‌های یکتا'}
                </span>
                <span
                  dir="ltr"
                  data-testid="activity-logger-unique-sections"
                  className="ltr-inline text-xs font-mono font-extrabold text-emerald-600 dark:text-emerald-400 tabular-nums shrink-0"
                >
                  {localizeDigits(`${stats.uniqueSectionsCount} / 9`, language)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Collapsible Recharts Bar Chart Panel */}
        {showChart && (
          <div className="px-6 pt-2">
            <div
              data-testid="activity-logger-chart-panel"
              className="p-3.5 rounded-2xl border border-slate-200/70 dark:border-white/[0.08] bg-slate-100/40 dark:bg-slate-900/35 backdrop-blur-md shadow-inner"
            >
              <div className="flex flex-col gap-2.5 mb-2.5">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-md bg-cyan-500/15 text-cyan-400 flex items-center justify-center shrink-0">
                      <BarChart3 className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      {language === 'en'
                        ? 'Navigation Frequency by Date & Section'
                        : 'نمودار فراوانی رویدادهای ناوبری بر اساس تاریخ و بخش'}
                    </span>
                  </div>
                  <span
                    dir="ltr"
                    className="ltr-code text-[11px] font-mono font-semibold text-cyan-600 dark:text-cyan-400 tabular-nums shrink-0"
                  >
                    {language === 'en'
                      ? `${chartSummary.totalDates}d · ${chartSummary.totalEvents} events`
                      : `${formatLocalizedNumber(chartSummary.totalDates, 'fa')} روز · ${formatLocalizedNumber(chartSummary.totalEvents, 'fa')} رویداد`}
                  </span>
                </div>

                {chartSummary.activeSections.length > 0 && (
                  <div
                    className="flex flex-wrap items-center gap-1.5"
                    data-testid="activity-logger-chart-legend"
                  >
                    {chartSummary.activeSections.map((sec) => (
                      <button
                        key={sec.sectionId}
                        type="button"
                        onClick={() =>
                          setSearchQuery((prev) =>
                            prev === sec.sectionId ? '' : sec.sectionId
                          )
                        }
                        title={language === 'en' ? sec.titleEn : sec.titleFa}
                        className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm border border-slate-200/80 dark:border-white/[0.08] text-[10px] font-medium text-slate-700 dark:text-slate-300 hover:border-cyan-500/50 transition-colors cursor-pointer"
                      >
                        <span
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{ backgroundColor: sec.color }}
                        />
                        <span className="whitespace-nowrap">
                          {language === 'en' ? sec.titleEn : sec.titleFa}
                        </span>
                        <span
                          dir="ltr"
                          className="ltr-code font-mono font-bold text-slate-500 dark:text-slate-400"
                        >
                          ({formatLocalizedNumber(sec.count, language)})
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {chartSummary.data.length === 0 ? (
                <div
                  data-testid="activity-logger-chart-empty"
                  className="h-28 flex flex-col items-center justify-center text-xs text-slate-400 dark:text-slate-500 font-medium gap-1"
                >
                  <BarChart3 className="w-5 h-5 opacity-40" />
                  <span>
                    {language === 'en'
                      ? 'No date-aggregated navigation data to chart for current filter'
                      : 'داده‌ای برای نمایش در نمودار بر اساس فیلتر فعلی وجود ندارد'}
                  </span>
                </div>
              ) : (
                <div
                  dir="ltr"
                  data-testid="activity-logger-recharts-container"
                  className="ltr-code w-full h-32"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={chartSummary.data}
                      margin={{ top: 6, right: 12, left: -18, bottom: 0 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="rgba(148, 163, 184, 0.12)"
                        vertical={false}
                      />
                      <XAxis
                        dataKey="date"
                        tick={{ fill: '#94a3b8', fontSize: 10, fontFamily: 'JetBrains Mono, monospace' }}
                        axisLine={{ stroke: 'rgba(148, 163, 184, 0.2)' }}
                        tickLine={false}
                      />
                      <YAxis
                        allowDecimals={false}
                        tick={{ fill: '#94a3b8', fontSize: 10, fontFamily: 'JetBrains Mono, monospace' }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip
                        cursor={{ fill: 'rgba(6, 182, 212, 0.08)' }}
                        contentStyle={{
                          backgroundColor: '#070b14',
                          borderColor: '#1e293b',
                          borderRadius: '0.5rem',
                          fontSize: '11px',
                          color: '#f8fafc',
                          padding: '6px 10px',
                          boxShadow: '0 10px 25px -5px rgba(0,0,0,0.5)',
                        }}
                        labelStyle={{
                          fontFamily: 'JetBrains Mono, monospace',
                          fontWeight: 700,
                          color: '#22d3ee',
                          marginBottom: '4px',
                        }}
                      />
                      {chartSummary.activeSections.map((sec, idx) => (
                        <Bar
                          key={sec.sectionId}
                          dataKey={sec.sectionId}
                          name={language === 'en' ? sec.titleEn : sec.titleFa}
                          stackId="sections"
                          fill={sec.color}
                          maxBarSize={36}
                          isAnimationActive={false}
                          radius={
                            idx === chartSummary.activeSections.length - 1
                              ? [4, 4, 0, 0]
                              : [0, 0, 0, 0]
                          }
                        />
                      ))}
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Filter, Search & Date Controls Bar */}
        <div className="px-6 py-3 space-y-2.5 border-b border-slate-200/70 dark:border-white/[0.06] bg-slate-100/40 dark:bg-slate-900/25 backdrop-blur-md">
          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* Segmented Category Filter Tabs */}
            <div
              className="flex items-center gap-1 p-1 bg-slate-200/50 dark:bg-slate-800/60 backdrop-blur-sm rounded-xl border border-slate-300/40 dark:border-white/[0.05]"
              role="group"
              aria-label="Filter navigation events by category"
            >
              {(
                [
                  {
                    id: 'all',
                    labelEn: 'All Events',
                    labelFa: 'همه رویدادها',
                  },
                  {
                    id: 'curriculum',
                    labelEn: 'Curriculum',
                    labelFa: 'سرفصل‌های آموزشی',
                  },
                  {
                    id: 'studio',
                    labelEn: 'Studios',
                    labelFa: 'استودیوها',
                  },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setFilterCategory(tab.id)}
                  data-testid={`activity-filter-${tab.id}`}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    filterCategory === tab.id
                      ? 'bg-white/90 dark:bg-cyan-500 text-slate-900 dark:text-slate-950 shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {language === 'en' ? tab.labelEn : tab.labelFa}
                </button>
              ))}
            </div>

            {/* Search Input Box */}
            <div className="flex items-center gap-2 flex-1 min-w-[260px] max-w-md">
              <div className="relative flex-1">
                <Search
                  className={`w-3.5 h-3.5 text-slate-400 absolute top-1/2 -translate-y-1/2 pointer-events-none ${
                    isRTL ? 'right-3' : 'left-3'
                  }`}
                />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  data-testid="activity-logger-search-input"
                  aria-label={
                    language === 'en'
                      ? 'Filter navigation history by section name or date'
                      : 'فیلتر تاریخچه ناوبری بر اساس نام بخش یا تاریخ'
                  }
                  placeholder={
                    language === 'en'
                      ? 'Search section name or date (YYYY-MM-DD)...'
                      : 'جستجو در نام بخش یا تاریخ (YYYY-MM-DD)...'
                  }
                  className={`w-full ${
                    isRTL ? 'pr-8 pl-8' : 'pl-8 pr-8'
                  } py-1.5 rounded-xl border border-slate-300 dark:border-slate-700/80 bg-white dark:bg-slate-900/90 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/30 transition-all`}
                />
                {searchQuery.trim().length > 0 && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    data-testid="activity-logger-clear-search-btn"
                    aria-label={
                      language === 'en'
                        ? 'Clear section or date filter'
                        : 'پاک کردن فیلتر نام بخش یا تاریخ'
                    }
                    className={`absolute top-1/2 -translate-y-1/2 ${
                      isRTL ? 'left-2' : 'right-2'
                    } p-0.5 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors cursor-pointer`}
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              <span
                dir="ltr"
                data-testid="activity-logger-filtered-count"
                className="ltr-inline text-xs font-mono font-semibold px-2 py-1 rounded-md bg-slate-100 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 shrink-0 tabular-nums"
              >
                {localizeDigits(`${filteredLogs.length}/${logs.length}`, language)}
              </span>
            </div>
          </div>

          {/* Date Range Picker Controls */}
          <div
            data-testid="activity-logger-date-range-bar"
            className="flex flex-wrap items-center justify-between gap-2.5 pt-2 border-t border-slate-200/80 dark:border-slate-800/80"
          >
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                <Calendar className="w-3.5 h-3.5 text-cyan-500 shrink-0" />
                <span>{language === 'en' ? 'Date Range:' : 'بازه زمانی:'}</span>
              </div>

              <label
                htmlFor="activity-filter-start-date"
                className="flex items-center gap-1.5 text-[11px] font-medium text-slate-600 dark:text-slate-300"
              >
                <span className="text-slate-400">{language === 'en' ? 'From' : 'از'}</span>
                <input
                  id="activity-filter-start-date"
                  type="date"
                  dir="ltr"
                  value={startDate}
                  max={endDate || undefined}
                  onChange={(e) => setStartDate(e.target.value)}
                  data-testid="activity-logger-start-date-input"
                  aria-label={language === 'en' ? 'Start Date' : 'از تاریخ'}
                  className="ltr-inline font-mono text-[11px] px-2.5 py-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-cyan-500 cursor-pointer"
                />
              </label>

              <label
                htmlFor="activity-filter-end-date"
                className="flex items-center gap-1.5 text-[11px] font-medium text-slate-600 dark:text-slate-300"
              >
                <span className="text-slate-400">{language === 'en' ? 'To' : 'تا'}</span>
                <input
                  id="activity-filter-end-date"
                  type="date"
                  dir="ltr"
                  value={endDate}
                  min={startDate || undefined}
                  onChange={(e) => setEndDate(e.target.value)}
                  data-testid="activity-logger-end-date-input"
                  aria-label={language === 'en' ? 'End Date' : 'تا تاریخ'}
                  className="ltr-inline font-mono text-[11px] px-2.5 py-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-cyan-500 cursor-pointer"
                />
              </label>
            </div>

            {(startDate || endDate) && (
              <div className="flex items-center gap-2">
                <span
                  dir="ltr"
                  data-testid="activity-logger-active-date-range-badge"
                  className="ltr-inline text-[11px] font-mono font-semibold text-cyan-600 dark:text-cyan-400 tabular-nums px-2 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/20"
                >
                  {startDate || '…'} → {endDate || '…'}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setStartDate('');
                    setEndDate('');
                  }}
                  data-testid="activity-logger-clear-dates-btn"
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-200/80 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-[11px] font-semibold text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                >
                  <X className="w-3 h-3" />
                  <span>{language === 'en' ? 'Clear Dates' : 'پاک کردن تاریخ‌ها'}</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Event Log Stream Timeline List */}
        <div
          className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-3"
          data-testid="activity-logger-list"
        >
          {filteredLogs.length === 0 ? (
            <div
              className="py-16 text-center space-y-3 rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/20"
              data-testid="activity-logger-empty"
            >
              <div className="w-12 h-12 rounded-2xl bg-slate-200/70 dark:bg-slate-800/80 flex items-center justify-center text-slate-400 mx-auto">
                <Clock className="w-6 h-6" />
              </div>
              <div className="text-sm font-bold text-slate-700 dark:text-slate-200">
                {language === 'en'
                  ? 'No navigation events match the current view'
                  : 'هیچ رویداد ناوبری در این نما یافت نشد'}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
                {language === 'en'
                  ? 'Navigate between curriculum modules or engineering studios to automatically log section_change events.'
                  : 'با جابه‌جایی میان فصل‌های آموزشی و استودیوهای مهندسی، رویدادهای section_change به‌صورت خودکار ثبت می‌شوند.'}
              </p>
              {hasActiveFilters && (
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setFilterCategory('all');
                      setSearchQuery('');
                      setStartDate('');
                      setEndDate('');
                    }}
                    data-testid="activity-logger-reset-filters-btn"
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold text-xs transition-colors cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>{language === 'en' ? 'Reset All Filters' : 'بازنشانی تمام فیلترها'}</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            filteredLogs.map((item, idx) => {
              const dateMeta = formatActivityDateDisplay(item.timestampIso, language);
              const isFirst = logs[0]?.id === item.id;

              return (
                <div
                  key={item.id}
                  data-testid="activity-log-entry"
                  className={`group p-4 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 ${
                    isFirst
                      ? 'border-cyan-500/40 bg-cyan-500/5 dark:bg-cyan-950/25 shadow-sm'
                      : 'border-slate-200 dark:border-slate-800/80 bg-slate-50/80 dark:bg-slate-900/40 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="space-y-1.5 min-w-0 flex-1">
                    {/* Clean Metadata Line (Anti-Slop Zero-Pill Rules) */}
                    <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                      <span
                        dir="ltr"
                        className="ltr-inline text-cyan-600 dark:text-cyan-400 font-bold"
                      >
                        {item.eventType}
                      </span>
                      <span aria-hidden="true" className="opacity-40">·</span>
                      <span
                        dir="ltr"
                        className="ltr-inline text-slate-700 dark:text-slate-300 font-semibold"
                      >
                        {item.badgeCode}
                      </span>
                      {isFirst && (
                        <>
                          <span aria-hidden="true" className="opacity-40">·</span>
                          <span className="text-emerald-500 font-sans font-bold flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                            {language === 'en' ? 'Current Active' : 'نمای فعلی'}
                          </span>
                        </>
                      )}
                      <span aria-hidden="true" className="opacity-40">·</span>
                      <span
                        dir="ltr"
                        data-testid="activity-log-entry-date"
                        className="ltr-code inline-flex items-center gap-1 text-slate-600 dark:text-slate-300 tabular-nums"
                      >
                        <Calendar className="w-3 h-3 text-cyan-500 shrink-0" />
                        <span>{dateMeta.isoDate}</span>
                      </span>
                      <span aria-hidden="true" className="opacity-40">·</span>
                      <span
                        dir="ltr"
                        className="ltr-code inline-flex items-center gap-1 text-slate-400 tabular-nums"
                      >
                        <Clock className="w-3 h-3 shrink-0" />
                        <span>{dateMeta.localizedTime}</span>
                      </span>
                    </div>

                    {/* Section Title */}
                    <div className="text-sm sm:text-base font-bold text-slate-900 dark:text-white truncate">
                      {language === 'en' ? item.targetTitleEn : item.targetTitleFa}
                    </div>

                    {/* Transition Flow */}
                    <div className="text-xs text-slate-500 dark:text-slate-400 flex flex-wrap items-center gap-1.5">
                      <span className="text-slate-400">
                        {language === 'en' ? 'Transition:' : 'انتقال:'}
                      </span>
                      <span className="font-semibold text-slate-700 dark:text-slate-300">
                        {language === 'en' ? item.fromTitleEn : item.fromTitleFa}
                      </span>
                      <ArrowRight className={`w-3 h-3 text-cyan-400 ${isRTL ? 'rotate-180' : ''}`} />
                      <span className="font-semibold text-cyan-600 dark:text-cyan-400">
                        {language === 'en' ? item.targetTitleEn : item.targetTitleFa}
                      </span>
                      <span dir="ltr" className="ltr-inline font-mono text-[10px] opacity-60">
                        ({item.fromSection || 'init'} → {item.toSection}
                        {item.moduleId ? `/${item.moduleId}` : ''})
                      </span>
                    </div>
                  </div>

                  {/* Jump Action Button */}
                  <button
                    type="button"
                    onClick={() => {
                      onNavigateToEntry(item.toSection, item.moduleId);
                      onClose();
                    }}
                    data-testid={`jump-to-history-${idx}`}
                    className="px-3.5 py-2 rounded-xl bg-cyan-500/10 hover:bg-cyan-500 hover:text-slate-950 border border-cyan-500/30 text-cyan-500 dark:text-cyan-400 text-xs font-bold flex items-center justify-center gap-2 transition-all shrink-0 cursor-pointer shadow-sm group-hover:scale-102"
                  >
                    <span>{language === 'en' ? 'Jump to View' : 'پرش به این بخش'}</span>
                    <ArrowUpRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer Actions */}
        <div className="px-6 py-4 bg-slate-100/60 dark:bg-[#040811]/60 backdrop-blur-md border-t border-slate-200/70 dark:border-cyan-500/15 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={handleCopyOrDownloadJson}
              disabled={logs.length === 0}
              data-testid="export-activity-json-btn"
              className="px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900/80 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:border-cyan-500/50 disabled:opacity-40 flex items-center gap-2 transition-all cursor-pointer shadow-sm"
            >
              {copiedJson ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-500 font-bold">
                    {language === 'en' ? 'Exported JSON' : 'خروجی JSON کپی شد'}
                  </span>
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5 text-cyan-400" />
                  <span>{language === 'en' ? 'Export JSON Log' : 'خروجی JSON تاریخچه'}</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={onClearHistory}
              disabled={logs.length === 0}
              data-testid="clear-activity-history-btn"
              className="px-3.5 py-2 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-500/20 disabled:opacity-40 text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{language === 'en' ? 'Clear History' : 'پاک‌سازی تاریخچه'}</span>
            </button>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-900 dark:bg-slate-800 text-white text-xs font-bold hover:bg-slate-800 dark:hover:bg-slate-700 transition-colors cursor-pointer shadow-sm"
          >
            {language === 'en' ? 'Close' : 'بستن'}
          </button>
        </div>
      </div>
      </div>
    </div>
  );
};
