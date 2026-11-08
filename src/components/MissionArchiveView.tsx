import React, { useState, useEffect } from 'react';
import {
  CheckCircle2,
  Calendar,
  Search,
  Filter,
  ArrowUpDown,
  ExternalLink,
  Shield,
  FileCode,
  Sparkles,
  Award,
  Layers,
  Terminal,
  Cpu,
  Clock,
  Copy,
  Check,
  ChevronRight,
  ChevronLeft,
  Flame,
  RotateCcw,
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import {
  CompletedMissionArchiveEntry,
  getStoredMissionArchive,
  filterAndSortMissionArchive,
  calculateMissionArchiveStats,
  MISSION_ARCHIVE_UPDATED_EVENT,
} from '../utils/missionArchive';
import { DailyMissionTargetSection } from '../utils/generators';
import { formatLocalizedNumber } from '../utils/bidiText';

interface MissionArchiveViewProps {
  onNavigateToSection?: (section: DailyMissionTargetSection) => void;
  activeDailyMissionId?: string;
}

export const MissionArchiveView: React.FC<MissionArchiveViewProps> = ({
  onNavigateToSection,
  activeDailyMissionId,
}) => {
  const { language, isRTL } = useLanguage();
  const isEn = language === 'en';

  const [archiveEntries, setArchiveEntries] = useState<CompletedMissionArchiveEntry[]>(() =>
    getStoredMissionArchive()
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
  const [copiedHashId, setCopiedHashId] = useState<string | null>(null);

  // Listen for real-time mission completion events from sidebar or other modules
  useEffect(() => {
    const handleArchiveUpdate = () => {
      setArchiveEntries(getStoredMissionArchive());
    };
    window.addEventListener(MISSION_ARCHIVE_UPDATED_EVENT, handleArchiveUpdate);
    window.addEventListener('storage', handleArchiveUpdate);
    return () => {
      window.removeEventListener(MISSION_ARCHIVE_UPDATED_EVENT, handleArchiveUpdate);
      window.removeEventListener('storage', handleArchiveUpdate);
    };
  }, []);

  const stats = calculateMissionArchiveStats(archiveEntries);
  const filteredEntries = filterAndSortMissionArchive({
    entries: archiveEntries,
    searchQuery,
    selectedCategory,
    sortOrder,
  });

  const categories = [
    { id: 'all', labelEn: 'All Categories', labelFa: 'همه دسته‌ها' },
    { id: 'Refactor a Rule', labelEn: 'Refactor a Rule', labelFa: 'بازآرایی قوانین' },
    { id: 'Plan Review', labelEn: 'Plan Review', labelFa: 'ممیزی طرح' },
    { id: 'FastMCP Guard', labelEn: 'FastMCP Guard', labelFa: 'گارد FastMCP' },
    { id: 'Context Hygiene', labelEn: 'Context Hygiene', labelFa: 'بهداشت کانتکست' },
    { id: 'Turbo Workflow', labelEn: 'Turbo Workflow', labelFa: 'پایپ‌لاین توربو' },
    { id: 'Worktree Ops', labelEn: 'Worktree Ops', labelFa: 'عملیات Worktree' },
  ];

  const handleCopyHash = (entry: CompletedMissionArchiveEntry) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(entry.verificationHash);
      setCopiedHashId(entry.id);
      setTimeout(() => setCopiedHashId(null), 2000);
    }
  };

  const formatCompletedDate = (isoString: string) => {
    try {
      const d = new Date(isoString);
      if (isNaN(d.getTime())) return isoString;
      if (isEn) {
        return d.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        });
      }
      return d.toLocaleDateString('fa-IR', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return isoString;
    }
  };

  const getDifficultyBadge = (difficulty: CompletedMissionArchiveEntry['difficulty']) => {
    switch (difficulty) {
      case 'CRITICAL':
        return {
          text: isEn ? 'Critical Architectural Invariant' : 'قانون حیاتی معماری',
          color: 'text-rose-500 bg-rose-500/10 border-rose-500/20',
        };
      case 'ADVANCED':
        return {
          text: isEn ? 'Advanced Systems Task' : 'مأموریت مهندسی پیشرفته',
          color: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
        };
      default:
        return {
          text: isEn ? 'Standard Guardrail' : 'گاردریل استاندارد',
          color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
        };
    }
  };

  return (
    <div
      data-testid="profile-mission-archive-view"
      className="space-y-6 animate-fade-in"
    >
      {/* 1. Header Banner & Stats Overview */}
      <div className="p-6 rounded-3xl border border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[#0c121e] shadow-xs relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-br from-amber-500/10 via-blue-500/5 to-transparent rounded-full blur-3xl pointer-events-none -z-10" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-500">
                <Award className="w-5 h-5" />
              </span>
              <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
                {isEn ? 'Architect Mission Archive' : 'آرشیو مأموریت‌های روزانه معمار'}
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 font-medium max-w-2xl leading-relaxed">
              {isEn
                ? 'Chronological ledger of verified architectural missions completed across the workspace. Each record is sealed with an immutable verification audit hash.'
                : 'دفتر کل زمانی مأموریت‌های معماری انجام‌شده در محیط کاربری. هر مأموریت تکمیل‌شده دارای کد ممیزی و هش قطعی اختصاصی است.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div
              data-testid="mission-archive-stat-total"
              className="px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-white/[0.03] text-center min-w-[100px]"
            >
              <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                {isEn ? 'Completed' : 'مأموریت‌های تکمیل'}
              </div>
              <div className="text-xl font-black text-slate-900 dark:text-white mt-0.5 tabular-nums">
                {formatLocalizedNumber(stats.totalCompleted, language)}
              </div>
            </div>

            <div
              data-testid="mission-archive-stat-xp"
              className="px-4 py-2.5 rounded-2xl border border-amber-500/30 bg-amber-500/10 text-center min-w-[110px]"
            >
              <div className="text-[11px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                {isEn ? 'Earned XP' : 'مجموع امتیاز XP'}
              </div>
              <div className="text-xl font-black text-amber-500 mt-0.5 tabular-nums">
                +{formatLocalizedNumber(stats.totalXpEarned, language)}{' '}
                <span className="text-xs font-sans font-normal">XP</span>
              </div>
            </div>

            <div className="px-4 py-2.5 rounded-2xl border border-blue-500/30 bg-blue-500/10 text-center min-w-[110px]">
              <div className="text-[11px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                {isEn ? 'Artifacts Touched' : 'آرتیفکت‌های ویرایش'}
              </div>
              <div className="text-xl font-black text-blue-500 mt-0.5 tabular-nums">
                {formatLocalizedNumber(stats.distinctArtifactsCount, language)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Search, Filter & Sort Controls */}
      <div className="p-4 rounded-2xl border border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[#0c121e] shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className={`w-4 h-4 text-slate-400 absolute top-1/2 -translate-y-1/2 ${isRTL ? 'right-3' : 'left-3'}`} />
            <input
              type="text"
              data-testid="mission-archive-search-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                isEn
                  ? 'Search by mission code, title, artifact or audit hash...'
                  : 'جستجو با کد مأموریت (ADM-01)، عنوان، آرتیفکت یا هش ممیزی...'
              }
              className={`w-full py-2 text-xs rounded-xl border border-slate-200 dark:border-white/[0.08] bg-slate-50/70 dark:bg-[#090d16] text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 ${
                isRTL ? 'pr-9 pl-3 text-right' : 'pl-9 pr-3 text-left'
              }`}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className={`absolute top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-white ${isRTL ? 'left-3' : 'right-3'}`}
              >
                ✕
              </button>
            )}
          </div>

          {/* Sort Order Toggle */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              data-testid="mission-archive-sort-btn"
              onClick={() => setSortOrder(sortOrder === 'newest' ? 'oldest' : 'newest')}
              className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-white/[0.03] hover:bg-slate-100 dark:hover:bg-white/[0.06] text-slate-700 dark:text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <ArrowUpDown className="w-3.5 h-3.5 text-blue-500" />
              <span>
                {sortOrder === 'newest'
                  ? isEn
                    ? 'Newest First'
                    : 'جدیدترین اول'
                  : isEn
                  ? 'Oldest First'
                  : 'قدیمی‌ترین اول'}
              </span>
            </button>
          </div>
        </div>

        {/* Category Pills */}
        <div
          data-testid="mission-archive-category-filter"
          className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-slate-100 dark:border-white/[0.04]"
        >
          <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 me-2 flex items-center gap-1">
            <Filter className="w-3 h-3" />
            <span>{isEn ? 'Filter:' : 'دسته‌بندی:'}</span>
          </span>
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-white/[0.04] text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/[0.08]'
                }`}
              >
                {isEn ? cat.labelEn : cat.labelFa}
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Chronological Mission Timeline & Cards */}
      <div
        data-testid="mission-archive-list"
        className="space-y-3.5"
      >
        {filteredEntries.length === 0 ? (
          <div className="p-10 rounded-3xl border border-dashed border-slate-200 dark:border-white/[0.08] text-center space-y-3 bg-white/40 dark:bg-[#0c121e]/40">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-white/[0.04] text-slate-400 flex items-center justify-center mx-auto">
              <RotateCcw className="w-6 h-6" />
            </div>
            <div className="text-sm font-bold text-slate-700 dark:text-slate-300">
              {isEn ? 'No missions match your search or filter' : 'هیچ مأموریتی با این مشخصات یافت نشد'}
            </div>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {isEn
                ? 'Try adjusting your search query or reset category filter to see all completed missions.'
                : 'می‌توانید عبارت جستجو را پاک کنید یا فیلتر دسته‌بندی را روی «همه دسته‌ها» قرار دهید.'}
            </p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('all');
              }}
              className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-colors cursor-pointer"
            >
              {isEn ? 'Reset All Filters' : 'تنظیم مجدد فیلترها'}
            </button>
          </div>
        ) : (
          filteredEntries.map((entry) => {
            const diff = getDifficultyBadge(entry.difficulty);
            return (
              <div
                key={entry.id}
                data-testid={`mission-archive-card-${entry.code}`}
                className="p-5 rounded-2xl border border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[#0c121e] hover:border-blue-500/30 transition-all shadow-xs space-y-3 relative group"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  {/* Left: Code, Date & Difficulty */}
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-black px-2.5 py-1 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                      {entry.code}
                    </span>

                    <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>{formatCompletedDate(entry.completedAtIso)}</span>
                    </span>

                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${diff.color}`}>
                      {diff.text}
                    </span>

                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-white/[0.04] text-slate-600 dark:text-slate-400">
                      {entry.categoryBadge}
                    </span>
                  </div>

                  {/* Right: XP Earned & Verified Status */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-amber-500 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20 tabular-nums">
                      +{formatLocalizedNumber(entry.xpEarned, language)} XP
                    </span>

                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{isEn ? 'Verified' : 'تاییدشده'}</span>
                    </span>
                  </div>
                </div>

                {/* Mission Title & Technical Description */}
                <div>
                  <h3 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white group-hover:text-blue-500 transition-colors">
                    {isEn ? entry.titleEn : entry.titleFa}
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 font-medium mt-1 leading-relaxed">
                    {isEn ? entry.descEn : entry.descFa}
                  </p>
                </div>

                {/* Artifact Path, Hash & Target Jump Action */}
                <div className="pt-2 border-t border-slate-100 dark:border-white/[0.04] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div className="flex flex-wrap items-center gap-2 font-mono text-[11px] text-slate-500">
                    <span className="inline-flex items-center gap-1 text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-white/[0.04] px-2 py-0.5 rounded-md">
                      <FileCode className="w-3.5 h-3.5 text-blue-500" />
                      <span>{entry.targetArtifact}</span>
                    </span>

                    {/* Verification Hash with Copy Button */}
                    <button
                      type="button"
                      onClick={() => handleCopyHash(entry)}
                      title={isEn ? 'Copy verification audit hash' : 'کپی هش ممیزی'}
                      className="inline-flex items-center gap-1 text-[10px] text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors cursor-pointer"
                    >
                      <Shield className="w-3 h-3 text-emerald-500" />
                      <span>{entry.verificationHash}</span>
                      {copiedHashId === entry.id ? (
                        <Check className="w-3 h-3 text-emerald-500" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                    </button>
                  </div>

                  {/* Navigation Button to Target Workspace Section */}
                  {onNavigateToSection && (
                    <button
                      type="button"
                      data-testid={`mission-archive-goto-btn-${entry.code}`}
                      onClick={() => onNavigateToSection(entry.targetSection)}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-blue-500/10 hover:bg-blue-600 hover:text-white text-blue-600 dark:text-blue-400 font-bold text-xs transition-colors cursor-pointer self-start sm:self-auto"
                    >
                      <span>{isEn ? 'Inspect Studio' : 'بررسی در استودیو'}</span>
                      {isRTL ? <ChevronLeft className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
