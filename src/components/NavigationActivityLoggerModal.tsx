import React, { useState, useMemo } from 'react';
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

  const stats = useMemo(() => calculateActivityLogStats(logs), [logs]);
  const filteredLogs = useMemo(
    () => filterActivityLogEvents(logs, filterCategory, searchQuery, startDate, endDate),
    [logs, filterCategory, searchQuery, startDate, endDate]
  );
  const chartSummary = useMemo(
    () => aggregateActivityEventsByDateAndSection(filteredLogs),
    [filteredLogs]
  );

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

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="activity-logger-modal-title"
      data-testid="activity-logger-modal"
    >
      <div
        dir={isRTL ? 'rtl' : 'ltr'}
        className="w-full max-w-3xl rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0d1322] text-slate-900 dark:text-slate-100 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="px-6 py-3.5 bg-slate-100 dark:bg-slate-900/90 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/15 border border-indigo-500/40 flex items-center justify-center text-indigo-500 shrink-0">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h2
                id="activity-logger-modal-title"
                className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white"
              >
                {language === 'en'
                  ? 'Browser Navigation History & Event Logger'
                  : 'تاریخچه ناوبری و ثبت‌کننده رویدادهای مرورگر'}
              </h2>
              <div
                dir="ltr"
                className="ltr-inline text-[11px] font-mono text-indigo-600 dark:text-indigo-400"
              >
                event: section_change · localStorage Activity Stream
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label={language === 'en' ? 'Close Navigation Activity Logger' : 'بستن پنجره تاریخچه ناوبری'}
            data-testid="close-activity-logger-btn"
            className="p-2 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Summary Stats Card: Total Session Time & Most Visited Section + Telemetry */}
        <div className="px-6 pt-3">
          <div
            data-testid="activity-logger-summary-stats-card"
            className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-900/60 grid grid-cols-1 sm:grid-cols-12 gap-3 items-stretch"
          >
            {/* Total Session Time */}
            <div
              data-testid="activity-logger-total-session-time"
              className="sm:col-span-4 p-2.5 rounded-lg border border-indigo-500/20 bg-indigo-500/5 dark:bg-indigo-950/30 flex items-center gap-3"
            >
              <div className="w-8 h-8 rounded-lg bg-indigo-500/15 text-indigo-500 flex items-center justify-center shrink-0">
                <Clock className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400 whitespace-nowrap">
                  {language === 'en' ? 'Total Session Time' : 'مجموع زمان نشست'}
                </div>
                <div className="flex items-center justify-between gap-2 mt-1">
                  <span
                    dir="ltr"
                    data-testid="activity-logger-session-time-value"
                    className="ltr-inline text-sm font-mono font-extrabold text-indigo-600 dark:text-indigo-400 tabular-nums"
                  >
                    {stats.totalSessionTimeFormatted}
                  </span>
                  <span
                    dir="ltr"
                    className="ltr-inline text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded bg-indigo-500/15 text-indigo-600 dark:text-indigo-300 tabular-nums shrink-0"
                  >
                    {stats.activeSessionsCount} {stats.activeSessionsCount === 1 ? 'session' : 'sessions'}
                  </span>
                </div>
              </div>
            </div>

            {/* Most Visited Section */}
            <div
              data-testid="activity-logger-most-visited-section"
              className="sm:col-span-5 p-2.5 rounded-lg border border-amber-500/20 bg-amber-500/5 dark:bg-amber-950/25 flex items-center gap-3"
            >
              <div className="w-8 h-8 rounded-lg bg-amber-500/15 text-amber-500 flex items-center justify-center shrink-0">
                <Compass className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 whitespace-nowrap">
                    {language === 'en' ? 'Most Visited Section' : 'پربازدیدترین بخش'}
                  </span>
                  <span
                    dir="ltr"
                    data-testid="activity-logger-most-visited-count"
                    className="ltr-inline text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-600 dark:text-amber-300 tabular-nums shrink-0"
                  >
                    {stats.topSectionCount} {stats.topSectionCount === 1 ? 'visit' : 'visits'}
                  </span>
                </div>
                <div
                  data-testid="activity-logger-most-visited-value"
                  className="text-xs font-bold text-slate-900 dark:text-white leading-snug mt-1"
                >
                  {language === 'en' ? stats.topSectionTitleEn : stats.topSectionTitleFa}
                </div>
              </div>
            </div>

            {/* Logged Events & Unique Sections */}
            <div className="sm:col-span-3 p-2.5 rounded-lg border border-slate-200/80 dark:border-slate-800 bg-white/60 dark:bg-slate-900/80 flex flex-col justify-between gap-1.5 overflow-hidden">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5 whitespace-nowrap">
                  <Activity className="w-3 h-3 text-blue-500 shrink-0" />
                  {language === 'en' ? 'Logged Events' : 'رویدادهای ثبت‌شده'}
                </span>
                <span
                  dir="ltr"
                  data-testid="activity-logger-total-count"
                  className="ltr-inline text-xs font-mono font-extrabold text-slate-900 dark:text-white tabular-nums shrink-0"
                >
                  {stats.totalEvents}
                </span>
              </div>
              <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-200/60 dark:border-slate-800/80">
                <span className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5 whitespace-nowrap">
                  <Layers className="w-3 h-3 text-emerald-500 shrink-0" />
                  {language === 'en' ? 'Unique Sections' : 'بخش‌های یکتا'}
                </span>
                <span
                  dir="ltr"
                  data-testid="activity-logger-unique-sections"
                  className="ltr-inline text-xs font-mono font-extrabold text-emerald-600 dark:text-emerald-400 tabular-nums shrink-0"
                >
                  {stats.uniqueSectionsCount} / 9
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Recharts Bar Chart Panel: Frequency of Navigation Events by Date & Section */}
        <div className="px-6 pt-3">
          <div
            data-testid="activity-logger-chart-panel"
            className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/50"
          >
            <div className="flex flex-col gap-2 mb-2.5">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-md bg-indigo-500/15 text-indigo-500 flex items-center justify-center shrink-0">
                    <BarChart3 className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    {language === 'en'
                      ? 'Navigation Event Frequency by Date & Section'
                      : 'نمودار فراوانی رویدادهای ناوبری بر اساس تاریخ و بخش'}
                  </span>
                </div>
                <span
                  dir="ltr"
                  className="ltr-code px-2 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/20 text-[10px] font-mono font-semibold text-indigo-600 dark:text-indigo-400 shrink-0"
                >
                  {chartSummary.totalDates}d · {chartSummary.totalEvents} events
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
                      className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/80 text-[10px] font-medium text-slate-700 dark:text-slate-300 hover:border-indigo-500/50 transition-colors cursor-pointer"
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
                        ({sec.count})
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {chartSummary.data.length === 0 ? (
              <div
                data-testid="activity-logger-chart-empty"
                className="h-24 flex items-center justify-center text-xs text-slate-400 dark:text-slate-500 font-medium"
              >
                {language === 'en'
                  ? 'No date-aggregated navigation data to chart for current filter'
                  : 'داده‌ای برای نمایش در نمودار بر اساس فیلتر فعلی وجود ندارد'}
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
                      stroke="rgba(148, 163, 184, 0.16)"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="date"
                      tick={{ fill: '#94a3b8', fontSize: 10, fontFamily: 'JetBrains Mono, monospace' }}
                      axisLine={{ stroke: 'rgba(148, 163, 184, 0.25)' }}
                      tickLine={false}
                    />
                    <YAxis
                      allowDecimals={false}
                      tick={{ fill: '#94a3b8', fontSize: 10, fontFamily: 'JetBrains Mono, monospace' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      cursor={{ fill: 'rgba(99, 102, 241, 0.08)' }}
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        borderColor: '#334155',
                        borderRadius: '0.5rem',
                        fontSize: '11px',
                        color: '#f8fafc',
                        padding: '6px 10px',
                      }}
                      labelStyle={{
                        fontFamily: 'JetBrains Mono, monospace',
                        fontWeight: 700,
                        color: '#818cf8',
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
                        maxBarSize={42}
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

        {/* Filter & Search Bar */}
        <div className="px-6 py-2.5 space-y-2 border-b border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-900/20">
          <div className="flex flex-wrap items-center justify-between gap-2.5">
            <div className="flex items-center gap-1.5" role="group" aria-label="Filter navigation events by category">
              <Filter className="w-3.5 h-3.5 text-slate-400 mx-1" />
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
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                    filterCategory === tab.id
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800'
                  }`}
                >
                  {language === 'en' ? tab.labelEn : tab.labelFa}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 flex-1 min-w-[240px] max-w-md">
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
                      ? 'Filter by section name or date (YYYY-MM-DD)...'
                      : 'فیلتر بر اساس نام بخش یا تاریخ (YYYY-MM-DD)...'
                  }
                  className={`w-full ${
                    isRTL ? 'pr-8 pl-8' : 'pl-8 pr-8'
                  } py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-500`}
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
                    } p-0.5 rounded text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors cursor-pointer`}
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              <span
                dir="ltr"
                data-testid="activity-logger-filtered-count"
                className="ltr-inline px-2 py-1 rounded-md bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px] font-mono font-semibold text-slate-600 dark:text-slate-300 shrink-0 tabular-nums"
              >
                {filteredLogs.length}/{logs.length}
              </span>
            </div>
          </div>

          {/* Date Range Picker Inputs (Start Date / End Date) */}
          <div
            data-testid="activity-logger-date-range-bar"
            className="flex flex-wrap items-center justify-between gap-2 pt-1.5 border-t border-slate-200/70 dark:border-slate-800/70"
          >
            <div className="flex flex-wrap items-center gap-2.5">
              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                <Calendar className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                <span>{language === 'en' ? 'Date Range:' : 'بازه زمانی:'}</span>
              </div>

              <label
                htmlFor="activity-filter-start-date"
                className="flex items-center gap-1.5 text-[11px] font-medium text-slate-600 dark:text-slate-300"
              >
                <span>{language === 'en' ? 'Start Date' : 'از تاریخ'}</span>
                <input
                  id="activity-filter-start-date"
                  type="date"
                  dir="ltr"
                  value={startDate}
                  max={endDate || undefined}
                  onChange={(e) => setStartDate(e.target.value)}
                  data-testid="activity-logger-start-date-input"
                  aria-label={language === 'en' ? 'Start Date' : 'از تاریخ'}
                  className="ltr-inline font-mono text-[11px] px-2 py-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-500 cursor-pointer"
                />
              </label>

              <label
                htmlFor="activity-filter-end-date"
                className="flex items-center gap-1.5 text-[11px] font-medium text-slate-600 dark:text-slate-300"
              >
                <span>{language === 'en' ? 'End Date' : 'تا تاریخ'}</span>
                <input
                  id="activity-filter-end-date"
                  type="date"
                  dir="ltr"
                  value={endDate}
                  min={startDate || undefined}
                  onChange={(e) => setEndDate(e.target.value)}
                  data-testid="activity-logger-end-date-input"
                  aria-label={language === 'en' ? 'End Date' : 'تا تاریخ'}
                  className="ltr-inline font-mono text-[11px] px-2 py-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-500 cursor-pointer"
                />
              </label>
            </div>

            {(startDate || endDate) && (
              <div className="flex items-center gap-2">
                <span
                  dir="ltr"
                  data-testid="activity-logger-active-date-range-badge"
                  className="ltr-inline px-2 py-0.5 rounded bg-indigo-500/15 border border-indigo-500/30 text-[10px] font-mono font-semibold text-indigo-600 dark:text-indigo-400"
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
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-200/80 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-[11px] font-semibold text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                >
                  <X className="w-3 h-3" />
                  <span>{language === 'en' ? 'Clear Dates' : 'پاک کردن تاریخ‌ها'}</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Event Log Stream */}
        <div
          className="flex-1 overflow-y-auto p-6 space-y-2.5"
          data-testid="activity-logger-list"
        >
          {filteredLogs.length === 0 ? (
            <div
              className="py-12 text-center space-y-2 rounded-xl border border-dashed border-slate-300 dark:border-slate-800"
              data-testid="activity-logger-empty"
            >
              <Clock className="w-8 h-8 text-slate-400 mx-auto" />
              <div className="text-sm font-bold text-slate-700 dark:text-slate-300">
                {language === 'en'
                  ? 'No navigation events match the current view'
                  : 'هیچ رویداد ناوبری در این نما یافت نشد'}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                {language === 'en'
                  ? 'Navigate between curriculum modules or engineering studios to automatically log section_change events.'
                  : 'با جابه‌جایی میان فصل‌های آموزشی و استودیوهای مهندسی، رویدادهای section_change به‌صورت خودکار ثبت می‌شوند.'}
              </p>
              {(filterCategory !== 'all' || searchQuery.trim() !== '' || startDate !== '' || endDate !== '') && (
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
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-colors cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>{language === 'en' ? 'Reset All Filters' : 'بازنشانی تمام فیلترها'}</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            filteredLogs.map((item, idx) => {
              const dateMeta = formatActivityDateDisplay(item.timestampIso, language);
              return (
              <div
                key={item.id}
                data-testid="activity-log-entry"
                className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800/90 bg-slate-50/70 dark:bg-slate-900/50 hover:border-indigo-500/40 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="space-y-1.5 min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      dir="ltr"
                      className="ltr-inline px-2 py-0.5 rounded bg-indigo-500/15 border border-indigo-500/30 text-indigo-600 dark:text-indigo-400 font-mono text-[10px] font-bold"
                    >
                      {item.eventType}
                    </span>
                    <span
                      dir="ltr"
                      className="ltr-inline px-2 py-0.5 rounded bg-slate-200/80 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono text-[10px] font-semibold"
                    >
                      {item.badgeCode}
                    </span>
                    {logs[0]?.id === item.id && (
                      <span className="px-2 py-0.5 rounded bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold whitespace-nowrap">
                        {language === 'en' ? 'Current Active' : 'نمای فعلی'}
                      </span>
                    )}
                    <span
                      dir="ltr"
                      data-testid="activity-log-entry-date"
                      className="ltr-code px-2 py-0.5 rounded bg-slate-200/60 dark:bg-slate-800/80 text-[10px] font-mono text-slate-600 dark:text-slate-300 inline-flex items-center gap-1.5 whitespace-nowrap"
                    >
                      <Calendar className="w-3 h-3 text-indigo-500 shrink-0" />
                      <span>{dateMeta.isoDate}</span>
                    </span>
                    <span
                      dir="ltr"
                      className="ltr-code text-[11px] font-mono text-slate-400 inline-flex items-center gap-1 whitespace-nowrap"
                    >
                      <Clock className="w-3 h-3 shrink-0" />
                      <span>{dateMeta.localizedTime}</span>
                    </span>
                  </div>

                  <div className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
                    {language === 'en' ? item.targetTitleEn : item.targetTitleFa}
                  </div>

                  <div className="text-[11px] text-slate-500 dark:text-slate-400 flex flex-wrap items-center gap-1.5">
                    <span>
                      {language === 'en' ? 'Transition from:' : 'انتقال از:'}{' '}
                      <strong className="font-semibold text-slate-700 dark:text-slate-300">
                        {language === 'en' ? item.fromTitleEn : item.fromTitleFa}
                      </strong>
                    </span>
                    <span dir="ltr" className="ltr-inline font-mono text-[10px] opacity-75">
                      ({item.fromSection || 'init'} → {item.toSection}
                      {item.moduleId ? `/${item.moduleId}` : ''})
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    onNavigateToEntry(item.toSection, item.moduleId);
                    onClose();
                  }}
                  data-testid={`jump-to-history-${idx}`}
                  className="px-3 py-1.5 rounded-lg bg-indigo-600/15 hover:bg-indigo-600 hover:text-white border border-indigo-500/30 text-indigo-600 dark:text-indigo-400 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shrink-0 cursor-pointer"
                >
                  <span>{language === 'en' ? 'Jump to View' : 'پرش به این بخش'}</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </div>
              );
            })
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-3.5 bg-slate-100 dark:bg-slate-900/90 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyOrDownloadJson}
              disabled={logs.length === 0}
              data-testid="export-activity-json-btn"
              className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:border-indigo-500/50 disabled:opacity-40 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              {copiedJson ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                  <span>{language === 'en' ? 'Exported JSON' : 'خروجی JSON کپی شد'}</span>
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5 text-indigo-500" />
                  <span>{language === 'en' ? 'Export JSON Log' : 'خروجی JSON تاریخچه'}</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={onClearHistory}
              disabled={logs.length === 0}
              data-testid="clear-activity-history-btn"
              className="px-3 py-1.5 rounded-lg border border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-500/20 disabled:opacity-40 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{language === 'en' ? 'Clear History' : 'پاک‌سازی تاریخچه'}</span>
            </button>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 dark:bg-slate-700 text-white text-xs font-bold hover:bg-slate-700 dark:hover:bg-slate-600 transition-colors cursor-pointer"
          >
            {language === 'en' ? 'Close' : 'بستن'}
          </button>
        </div>
      </div>
    </div>
  );
};
