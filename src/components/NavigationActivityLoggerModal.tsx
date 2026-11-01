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
} from 'lucide-react';
import {
  NavigationActivityEvent,
  WorkspaceSectionId,
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
  const [copiedJson, setCopiedJson] = useState<boolean>(false);

  const stats = useMemo(() => calculateActivityLogStats(logs), [logs]);
  const filteredLogs = useMemo(
    () => filterActivityLogEvents(logs, filterCategory, searchQuery),
    [logs, filterCategory, searchQuery]
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
        className="w-full max-w-3xl rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0d1322] text-slate-900 dark:text-slate-100 shadow-2xl overflow-hidden flex flex-col max-h-[88vh]"
      >
        {/* Header */}
        <div className="px-6 py-4 bg-slate-100 dark:bg-slate-900/90 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
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

        {/* Summary Metrics Bento Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 px-6 pt-4">
          <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-500/15 text-blue-500 flex items-center justify-center shrink-0">
              <Activity className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="text-[11px] text-slate-500 dark:text-slate-400">
                {language === 'en' ? 'Logged Events' : 'رویدادهای ثبت‌شده'}
              </div>
              <div
                dir="ltr"
                data-testid="activity-logger-total-count"
                className="ltr-inline text-sm font-mono font-extrabold text-slate-900 dark:text-white tabular-nums"
              >
                {stats.totalEvents} section_change
              </div>
            </div>
          </div>

          <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/15 text-emerald-500 flex items-center justify-center shrink-0">
              <Layers className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="text-[11px] text-slate-500 dark:text-slate-400">
                {language === 'en' ? 'Unique Sections Visited' : 'بخش‌های یکتای بازدیدشده'}
              </div>
              <div
                dir="ltr"
                className="ltr-inline text-sm font-mono font-extrabold text-emerald-600 dark:text-emerald-400 tabular-nums"
              >
                {stats.uniqueSectionsCount} / 9 Sections
              </div>
            </div>
          </div>

          <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-500/15 text-amber-500 flex items-center justify-center shrink-0">
              <Compass className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[11px] text-slate-500 dark:text-slate-400">
                {language === 'en' ? 'Most Active Section' : 'پربازدیدترین بخش'}
              </div>
              <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                {language === 'en' ? stats.topSectionTitleEn : stats.topSectionTitleFa}
              </div>
            </div>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="px-6 py-3.5 flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800">
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
