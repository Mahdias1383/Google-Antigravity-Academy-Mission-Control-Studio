import React, { useState, useEffect } from 'react';
import {
  GraduationCap,
  Award,
  Flame,
  CheckCircle2,
  Clock,
  Calendar,
  Share2,
  Download,
  Edit3,
  Check,
  X,
  Shield,
  Sparkles,
  BookOpen,
  ArrowRight,
  ArrowLeft,
  ChevronRight,
  ChevronLeft,
  RefreshCw,
  Eye,
  EyeOff,
  User,
  Database,
  Terminal,
  Cpu,
  Layers,
  FileSpreadsheet,
  AlertTriangle,
  Target,
  ListOrdered,
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { ALL_CURRICULUM_MODULES } from '../data/curriculumIndex';
import {
  getStoredKnowledgeCheckScores,
  KnowledgeCheckModuleScoreRecord,
  DailyMissionTargetSection,
} from '../utils/generators';
import {
  formatLocalizedNumber,
  formatLocalizedThousand,
  localizeDigits,
  renderBidiText,
} from '../utils/bidiText';
import { MissionArchiveView } from './MissionArchiveView';
import {
  getStoredMissionArchive,
  MISSION_ARCHIVE_UPDATED_EVENT,
} from '../utils/missionArchive';
import {
  getStoredDailyStreak,
  STREAK_UPDATED_EVENT,
} from '../utils/streakMultiplier';
import { ThirtyDayContributionHeatmap } from './ThirtyDayContributionHeatmap';

interface ProfilePageProps {
  onNavigateToModule: (moduleId: string) => void;
  onNavigateToCurriculum: () => void;
  onNavigateToSection?: (section: any) => void;
  completedModules: string[];
  userXp: number;
  initialTab?: 'overview' | 'missions' | 'transcripts' | 'all';
  onRewardXp?: (amount: number) => void;
}

interface UserProfileState {
  displayNameEn: string;
  displayNameFa: string;
  email: string;
  titleEn: string;
  titleFa: string;
  avatarInitials: string;
  isPublicOnLeaderboard: boolean;
  dailyNotificationsEnabled: boolean;
  memberSinceIso: string;
  studentId: string;
}

const DEFAULT_PROFILE: UserProfileState = {
  displayNameEn: 'Aria Rostami',
  displayNameFa: 'آریا رستمی',
  email: 'aria.rostami@antigravity.internal',
  titleEn: 'Lead AI Systems Architect',
  titleFa: 'معمار ارشد سیستم‌های هوشمند',
  avatarInitials: 'AR',
  isPublicOnLeaderboard: true,
  dailyNotificationsEnabled: true,
  memberSinceIso: '2026-01-15T08:00:00.000Z',
  studentId: 'AG-ARCH-2026-9481',
};

const USER_PROFILE_STORAGE_KEY = 'ag_user_profile_data_v1';

export const ProfilePage: React.FC<ProfilePageProps> = ({
  onNavigateToModule,
  onNavigateToCurriculum,
  onNavigateToSection,
  completedModules,
  userXp,
  initialTab = 'overview',
  onRewardXp,
}) => {
  const { language, isRTL } = useLanguage();
  const isEn = language === 'en';

  const [activeTab, setActiveTab] = useState<'overview' | 'missions' | 'transcripts' | 'all'>(initialTab);
  const [storedMissionsCount, setStoredMissionsCount] = useState<number>(() => {
    return getStoredMissionArchive().length;
  });
  const [activeStreakDays, setActiveStreakDays] = useState<number>(() => {
    return getStoredDailyStreak(14, 14).currentStreakDays;
  });

  useEffect(() => {
    const handleUpdate = () => {
      setStoredMissionsCount(getStoredMissionArchive().length);
      setActiveStreakDays(getStoredDailyStreak(14, 14).currentStreakDays);
    };
    window.addEventListener(MISSION_ARCHIVE_UPDATED_EVENT, handleUpdate);
    window.addEventListener(STREAK_UPDATED_EVENT, handleUpdate);
    window.addEventListener('storage', handleUpdate);
    return () => {
      window.removeEventListener(MISSION_ARCHIVE_UPDATED_EVENT, handleUpdate);
      window.removeEventListener(STREAK_UPDATED_EVENT, handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  // Load persistent profile
  const [profile, setProfile] = useState<UserProfileState>(() => {
    try {
      const raw = window.localStorage.getItem(USER_PROFILE_STORAGE_KEY);
      if (raw) return { ...DEFAULT_PROFILE, ...JSON.parse(raw) };
    } catch {
      // Ignore storage errors
    }
    return DEFAULT_PROFILE;
  });

  const [isEditing, setIsEditing] = useState(false);
  const [editNameEn, setEditNameEn] = useState(profile.displayNameEn);
  const [editNameFa, setEditNameFa] = useState(profile.displayNameFa);
  const [editTitleEn, setEditTitleEn] = useState(profile.titleEn);
  const [editTitleFa, setEditTitleFa] = useState(profile.titleFa);
  const [saveSuccessNotice, setSaveSuccessNotice] = useState(false);
  const [activeBadgeDetail, setActiveBadgeDetail] = useState<string | null>(null);

  // Stored Knowledge Check scores
  const [scoresMap, setScoresMap] = useState<Record<string, KnowledgeCheckModuleScoreRecord>>({});

  useEffect(() => {
    setScoresMap(getStoredKnowledgeCheckScores());
  }, []);

  const handleSaveProfile = () => {
    const updated: UserProfileState = {
      ...profile,
      displayNameEn: editNameEn.trim() || profile.displayNameEn,
      displayNameFa: editNameFa.trim() || profile.displayNameFa,
      titleEn: editTitleEn.trim() || profile.titleEn,
      titleFa: editTitleFa.trim() || profile.titleFa,
      avatarInitials: (editNameEn.trim()[0] || 'A') + (editNameEn.trim().split(' ')[1]?.[0] || 'R'),
    };
    setProfile(updated);
    try {
      window.localStorage.setItem(USER_PROFILE_STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // Ignore
    }
    setIsEditing(false);
    setSaveSuccessNotice(true);
    setTimeout(() => setSaveSuccessNotice(false), 3000);
  };

  const handleExportTranscriptJson = () => {
    const payload = {
      academy: 'Google Antigravity Architecture Academy & Mission Control',
      studentId: profile.studentId,
      studentName: isEn ? profile.displayNameEn : profile.displayNameFa,
      title: isEn ? profile.titleEn : profile.titleFa,
      email: profile.email,
      totalXp: userXp,
      level: 4,
      completedModulesCount: completedModules.length,
      totalModulesCount: ALL_CURRICULUM_MODULES.length,
      completedModules,
      examTranscripts: scoresMap,
      generatedAtIso: new Date().toISOString(),
      verificationCode: `VERIFY-${profile.studentId}-${Date.now().toString(36).toUpperCase()}`,
    };

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(payload, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `antigravity-transcript-${profile.studentId}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Calculate Quiz Stats
  const quizRecords = Object.values(scoresMap);
  const totalCorrect = quizRecords.reduce((sum, r) => sum + (r.correctCount || 0), 0);
  const totalQuestions = quizRecords.reduce((sum, r) => sum + (r.totalQuestions || 0), 0);
  const averageAccuracy = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 92;

  // Level Progression Math
  const currentLevel = 4;
  const currentLevelBaseXp = 2500;
  const nextLevelXp = 3500;
  const levelProgressPercent = Math.min(
    100,
    Math.round(((userXp - currentLevelBaseXp) / (nextLevelXp - currentLevelBaseXp)) * 100)
  );

  // Badges Definitions
  const BADGES = [
    {
      id: 'dual-surface-pilot',
      titleEn: 'Dual-Surface Pilot',
      titleFa: 'خلبان محیط دوگانه',
      descEn: 'Mastered the ergonomics between Editor View and Agent Manager orchestration.',
      descFa: 'تسلط کامل بر مرز میان ویرایشگر زنده و مدیریت چندایجنتی.',
      unlocked: true,
      unlockDate: '2026-02-10',
      icon: Terminal,
      color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/30',
    },
    {
      id: 'context-rot-sentinel',
      titleEn: 'Context Rot Sentinel',
      titleFa: 'نگهبان مهار Context Rot',
      descEn: 'Successfully audited and pruned outdated memory artifacts to preserve token budget.',
      descFa: 'ممیزی و هرس کانتکست‌های قدیمی جهت جلوگیری از خطای توکن و آلودگی حافظه.',
      unlocked: true,
      unlockDate: '2026-02-18',
      icon: Shield,
      color: 'text-blue-500 bg-blue-500/10 border-blue-500/30',
    },
    {
      id: 'fastmcp-architect',
      titleEn: 'FastMCP 2.0 Architect',
      titleFa: 'معمار سرورهای FastMCP 2.0',
      descEn: 'Built extensible Model Context Protocol servers in Python with custom tools.',
      descFa: 'توسعه سرورهای پروتکل کانتکست در پایتون با متدهای سفارشی JSON-RPC.',
      unlocked: true,
      unlockDate: '2026-03-01',
      icon: Cpu,
      color: 'text-cyan-500 bg-cyan-500/10 border-cyan-500/30',
    },
    {
      id: 'worktree-master',
      titleEn: 'Worktree Parallel Master',
      titleFa: 'استاد ارکستریشن Git Worktree',
      descEn: 'Orchestrated parallel multi-agent workspaces on isolated Git worktrees.',
      descFa: 'اجرای همزمان و ایمن چند ایجنت روی برنچ‌های مستقل بدون تداخل کد.',
      unlocked: completedModules.length >= 8,
      unlockDate: completedModules.length >= 8 ? '2026-03-12' : undefined,
      icon: Layers,
      color: 'text-indigo-500 bg-indigo-500/10 border-indigo-500/30',
    },
    {
      id: 'quiz-grandmaster',
      titleEn: 'Quiz Grandmaster',
      titleFa: 'استاد بزرگ آزمون‌های مهارتی',
      descEn: 'Maintained greater than 90% accuracy across Knowledge Check quizzes.',
      descFa: 'حفظ دقت بالاتر از ۹۰ درصد در کوییزهای تحلیلی فصول آکادمی.',
      unlocked: averageAccuracy >= 85,
      unlockDate: '2026-03-05',
      icon: Award,
      color: 'text-amber-500 bg-amber-500/10 border-amber-500/30',
    },
    {
      id: 'deep-work-vanguard',
      titleEn: 'Deep Work Vanguard',
      titleFa: 'پیشگام تمرکز و کار عمیق',
      descEn: 'Logged over 15 Pomodoro study sessions without distraction.',
      descFa: 'ثبت بیش از ۱۵ نشست پومودورو و مطالعه بدون حواس‌پرتی.',
      unlocked: true,
      unlockDate: '2026-02-25',
      icon: Clock,
      color: 'text-rose-500 bg-rose-500/10 border-rose-500/30',
    },
  ];

  return (
    <div className="space-y-10 pb-16">
      {/* ============================================================ */}
      {/* 1. ARCHITECT IDENTITY HEADER & TRANSCRIPT CARD               */}
      {/* ============================================================ */}
      <div className="p-6 sm:p-8 rounded-3xl border border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[#0c121e] shadow-xs relative overflow-hidden">
        {/* Subtle decorative glow */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-br from-blue-600/10 to-indigo-600/5 rounded-full blur-3xl pointer-events-none -z-10" />

        {saveSuccessNotice && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-semibold flex items-center gap-2 animate-fade-in">
            <Check className="w-4 h-4" />
            <span>
              {isEn ? 'Architect profile updated successfully!' : 'اطلاعات پروفایل با موفقیت در مرورگر ذخیره شد!'}
            </span>
          </div>
        )}

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          {/* Avatar & Core Bio */}
          <div className="flex items-start sm:items-center gap-4">
            <div className="relative shrink-0">
              <span className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-indigo-600 via-blue-600 to-cyan-500 text-white font-mono text-xl sm:text-2xl font-black flex items-center justify-center shadow-lg shadow-blue-500/20">
                {profile.avatarInitials}
              </span>
              <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 ring-4 ring-white dark:ring-[#0c121e]" />
            </div>

            <div className="space-y-1.5 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                  {isEn ? profile.displayNameEn : profile.displayNameFa}
                </h1>
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                  {isEn
                    ? `Level ${currentLevel} · Principal Track`
                    : `سطح ${formatLocalizedNumber(currentLevel, 'fa')} · معمار ارشد`}
                </span>
              </div>

              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 font-medium">
                {isEn ? profile.titleEn : profile.titleFa}
              </p>

              <div dir="ltr" className="ltr-inline flex flex-wrap items-center gap-3 text-[11px] text-slate-500 font-mono pt-0.5">
                <span>ID: {profile.studentId}</span>
                <span>·</span>
                <span>{profile.email}</span>
              </div>
            </div>
          </div>

          {/* Action Deck */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => {
                setIsEditing(!isEditing);
                setEditNameEn(profile.displayNameEn);
                setEditNameFa(profile.displayNameFa);
                setEditTitleEn(profile.titleEn);
                setEditTitleFa(profile.titleFa);
              }}
              className="px-3.5 py-2 rounded-xl border border-slate-200/90 dark:border-white/10 bg-slate-50 dark:bg-white/[0.04] hover:bg-slate-100 dark:hover:bg-white/[0.08] text-slate-700 dark:text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>{isEditing ? (isEn ? 'Cancel' : 'انصراف') : (isEn ? 'Edit Profile' : 'ویرایش مشخصات')}</span>
            </button>

            <button
              type="button"
              data-testid="export-transcript-json-btn"
              onClick={handleExportTranscriptJson}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isEn ? 'Export Transcript (JSON)' : 'دریافت کارنامه رسمی (JSON)'}</span>
            </button>
          </div>
        </div>

        {/* Inline Edit Form */}
        {isEditing && (
          <div className="mt-6 pt-6 border-t border-slate-200/80 dark:border-white/[0.07] grid grid-cols-1 sm:grid-cols-2 gap-4 animate-scale-in">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                {isEn ? 'Display Name (English)' : 'نام نمایشی (انگلیسی)'}
              </label>
              <input
                type="text"
                value={editNameEn}
                onChange={(e) => setEditNameEn(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-white/10 bg-slate-50 dark:bg-[#090d16] text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                {isEn ? 'Display Name (Persian)' : 'نام نمایشی (فارسی)'}
              </label>
              <input
                type="text"
                value={editNameFa}
                onChange={(e) => setEditNameFa(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-white/10 bg-slate-50 dark:bg-[#090d16] text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                {isEn ? 'Professional Title (English)' : 'عنوان تخصصی (انگلیسی)'}
              </label>
              <input
                type="text"
                value={editTitleEn}
                onChange={(e) => setEditTitleEn(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-white/10 bg-slate-50 dark:bg-[#090d16] text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                {isEn ? 'Professional Title (Persian)' : 'عنوان تخصصی (فارسی)'}
              </label>
              <input
                type="text"
                value={editTitleFa}
                onChange={(e) => setEditTitleFa(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-white/10 bg-slate-50 dark:bg-[#090d16] text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              />
            </div>

            <div className="sm:col-span-2 flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-white/10 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/[0.05] cursor-pointer"
              >
                {isEn ? 'Cancel' : 'انصراف'}
              </button>
              <button
                type="button"
                onClick={handleSaveProfile}
                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold cursor-pointer"
              >
                {isEn ? 'Save Changes' : 'ذخیره تغییرات'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ============================================================ */}
      {/* PROFILE NAVIGATION SUB-TABS                                   */}
      {/* ============================================================ */}
      <div
        data-testid="profile-tab-bar"
        className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/80 dark:border-white/[0.08] pb-3"
      >
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          <button
            type="button"
            data-testid="profile-tab-overview"
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'overview'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-white/[0.04] text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>{isEn ? 'Overview & Badges' : 'نمای کلی و نشان‌ها'}</span>
          </button>

          <button
            type="button"
            data-testid="profile-tab-missions"
            onClick={() => setActiveTab('missions')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'missions'
                ? 'bg-amber-500 text-slate-950 font-black shadow-xs'
                : 'bg-slate-100 dark:bg-white/[0.04] text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Target className="w-3.5 h-3.5" />
            <span>{isEn ? 'Mission Archive' : 'آرشیو مأموریت‌ها'}</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-black tabular-nums ${
                activeTab === 'missions'
                  ? 'bg-black/20 text-slate-950'
                  : 'bg-amber-500/15 text-amber-500'
              }`}
            >
              {formatLocalizedNumber(storedMissionsCount, language)}
            </span>
          </button>

          <button
            type="button"
            data-testid="profile-tab-transcripts"
            onClick={() => setActiveTab('transcripts')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'transcripts'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-white/[0.04] text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>{isEn ? 'Exam Transcripts' : 'ریزنمرات آزمون‌ها'}</span>
          </button>
        </div>

        <button
          type="button"
          data-testid="profile-tab-all"
          onClick={() => setActiveTab(activeTab === 'all' ? 'overview' : 'all')}
          className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
            activeTab === 'all'
              ? 'border-blue-500/40 bg-blue-500/10 text-blue-600 dark:text-blue-400'
              : 'border-slate-200 dark:border-white/[0.08] text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/[0.04]'
          }`}
        >
          <ListOrdered className="w-3.5 h-3.5" />
          <span>
            {activeTab === 'all'
              ? isEn
                ? 'Condensed View'
                : 'نمای خلاصه'
              : isEn
              ? 'View All Sections'
              : 'نمایش یکپارچه همه'}
          </span>
        </button>
      </div>

      {(activeTab === 'overview' || activeTab === 'all') && (
        <>
          {/* Quick Mission Archive Status Banner */}
          <div
            data-testid="profile-mission-archive-quick-banner"
            className="p-4 sm:p-5 rounded-2xl border border-amber-500/30 bg-amber-500/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
          >
            <div className="flex items-center gap-3">
              <span className="p-2.5 rounded-xl bg-amber-500/15 text-amber-500 border border-amber-500/20 shrink-0">
                <Target className="w-5 h-5" />
              </span>
              <div className="space-y-0.5">
                <div className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                  <span>{isEn ? 'Architect Daily Mission Archive' : 'آرشیو مأموریت‌های روزانه معمار'}</span>
                  <span className="text-[10px] font-bold bg-amber-500/20 text-amber-500 px-2 py-0.5 rounded-full tabular-nums">
                    {formatLocalizedNumber(storedMissionsCount, language)} {isEn ? 'Completed' : 'تکمیل‌شده'}
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  {isEn
                    ? 'Chronological record of verified daily technical tasks, earned XP bonuses, and audit hashes.'
                    : 'تاریخچه زمانی تسک‌های فنی انجام‌شده به همراه امتیازهای XP و کدهای ممیزی رمزنگاری‌شده.'}
                </p>
              </div>
            </div>
            <button
              type="button"
              data-testid="profile-goto-mission-archive-btn"
              onClick={() => setActiveTab('missions')}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 shadow-xs self-start sm:self-auto"
            >
              <span>{isEn ? 'Open Full Mission Archive' : 'مشاهده آرشیو کامل مأموریت‌ها'}</span>
              {isRTL ? <ChevronLeft className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
            </button>
          </div>

          {/* ============================================================ */}
          {/* 2. CORE PERFORMANCE METRICS & XP PROGRESSION                 */}
          {/* ============================================================ */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: XP & Progression to Level 5 */}
        <div className="p-5 rounded-2xl border border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[#0c121e] space-y-3 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="font-semibold">{isEn ? 'Cumulative XP' : 'مجموع امتیاز XP'}</span>
            <Award className="w-4 h-4 text-blue-500" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900 dark:text-white tabular-nums">
              {formatLocalizedThousand(userXp, language)}{' '}
              <span className="text-xs font-sans text-slate-500 font-normal">XP</span>
            </div>
            <div className="text-[11px] text-blue-600 dark:text-blue-400 font-medium mt-0.5">
              {isEn
                ? `${Math.max(0, nextLevelXp - userXp)} XP to Level 5 (Principal Architect)`
                : `${formatLocalizedNumber(Math.max(0, nextLevelXp - userXp), 'fa')} XP تا سطح ۵ (معمار پرینسیپال)`}
            </div>
          </div>
          <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-white/[0.06] overflow-hidden">
            <div
              className="h-full bg-blue-600 rounded-full transition-all duration-500"
              style={{ width: `${levelProgressPercent}%` }}
            />
          </div>
          {onRewardXp && (
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <button
                type="button"
                onClick={() => onRewardXp(500)}
                className="px-2 py-0.5 rounded text-[10px] font-bold border border-blue-500/30 bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 transition-colors cursor-pointer"
                title="Add +500 XP"
              >
                {isEn ? '+500 XP' : '+۵۰۰ XP'}
              </button>
              <button
                type="button"
                onClick={() => onRewardXp(Math.max(100, 5000 - userXp))}
                className="px-2 py-0.5 rounded text-[10px] font-bold border border-amber-500/30 bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 transition-colors cursor-pointer"
                title="Reach 5,000 XP Milestone Threshold"
              >
                {isEn ? '→ 5K Milestone' : '← نشان ۵ هزار XP'}
              </button>
              <button
                type="button"
                onClick={() => onRewardXp(Math.max(100, 10000 - userXp))}
                className="px-2 py-0.5 rounded text-[10px] font-bold border border-emerald-500/30 bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 transition-colors cursor-pointer"
                title="Reach 10,000 XP Milestone Threshold"
              >
                {isEn ? '→ 10K Milestone' : '← نشان ۱۰ هزار XP'}
              </button>
            </div>
          )}
        </div>

        {/* Metric 2: Study Streak */}
        <div className="p-5 rounded-2xl border border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[#0c121e] space-y-3 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="font-semibold">{isEn ? 'Active Study Streak' : 'استمرار مطالعه'}</span>
            <Flame className="w-4 h-4 text-amber-500" />
          </div>
          <div>
            <div
              data-testid="profile-active-streak-days"
              className="text-2xl font-black text-slate-900 dark:text-white tabular-nums"
            >
              {formatLocalizedNumber(activeStreakDays, language)}{' '}
              <span className="text-xs font-sans text-slate-500 font-normal">
                {isEn ? 'Days' : 'روز'}
              </span>
            </div>
            <div className="text-[11px] text-amber-500 font-medium mt-0.5">
              {isEn ? 'Top 5% Cohort Consistency' : 'جزو ۵٪ برتر از نظر استمرار روزانه'}
            </div>
          </div>
          <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-white/[0.06] overflow-hidden">
            <div className="h-full bg-amber-500 rounded-full w-4/5" />
          </div>
        </div>

        {/* Metric 3: Modules Completed */}
        <div className="p-5 rounded-2xl border border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[#0c121e] space-y-3 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="font-semibold">{isEn ? 'Curriculum Progress' : 'تکمیل سرفصل‌ها'}</span>
            <BookOpen className="w-4 h-4 text-emerald-500" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900 dark:text-white tabular-nums">
              {isEn
                ? `${completedModules.length} / ${ALL_CURRICULUM_MODULES.length}`
                : `${formatLocalizedNumber(completedModules.length, 'fa')} از ${formatLocalizedNumber(ALL_CURRICULUM_MODULES.length, 'fa')}`}
            </div>
            <div className="text-[11px] text-emerald-500 font-medium mt-0.5">
              {formatLocalizedNumber(
                Math.round((completedModules.length / ALL_CURRICULUM_MODULES.length) * 100),
                language
              )}
              {isEn ? '% Mastery Path' : '٪ مسیر طی شده'}
            </div>
          </div>
          <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-white/[0.06] overflow-hidden">
            <div
              className="h-full bg-emerald-500 rounded-full transition-all"
              style={{
                width: `${(completedModules.length / ALL_CURRICULUM_MODULES.length) * 100}%`,
              }}
            />
          </div>
        </div>

        {/* Metric 4: Quiz Accuracy */}
        <div className="p-5 rounded-2xl border border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[#0c121e] space-y-3 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="font-semibold">{isEn ? 'Exam Accuracy' : 'میانگین دقت در کوییزها'}</span>
            <CheckCircle2 className="w-4 h-4 text-cyan-500" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900 dark:text-white tabular-nums">
              {formatLocalizedNumber(averageAccuracy, language)}
              {isEn ? '%' : '٪'}
            </div>
            <div className="text-[11px] text-cyan-500 font-medium mt-0.5">
              {isEn ? 'Knowledge Check Precision' : 'درجه تسلط تحلیلی بر مفاهیم'}
            </div>
          </div>
          <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-white/[0.06] overflow-hidden">
            <div
              className="h-full bg-cyan-500 rounded-full transition-all"
              style={{ width: `${averageAccuracy}%` }}
            />
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 3. 30-DAY CONTRIBUTION-STYLE DAILY ACTIVITY STREAK HEATMAP   */}
      {/* ============================================================ */}
      <ThirtyDayContributionHeatmap
        completedModulesCount={completedModules.length}
        completedMissionsCount={storedMissionsCount}
        onStreakUpdated={(newStreak) => setActiveStreakDays(newStreak)}
      />

      {/* ============================================================ */}
      {/* 4. UNLOCKED BADGES & CERTIFICATIONS SHOWCASE                  */}
      {/* ============================================================ */}
      <div className="space-y-4">
        <div>
          <h2 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <Award className="w-4 h-4 text-amber-500" />
            <span>{isEn ? 'Unlocked Engineering Credentials & Badges' : 'نشان‌ها و گواهینامه‌های تخصصی کسب‌شده'}</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {isEn
              ? 'Recognized domain proficiencies in Agent-First architecture, security, and protocols.'
              : 'شایستگی‌های تایید شده در مهندسی ایجنت‌ها، گاردریل‌های امنیتی و پروتکل FastMCP.'}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {BADGES.map((badge) => {
            const IconComp = badge.icon;
            return (
              <div
                key={badge.id}
                onClick={() => setActiveBadgeDetail(badge.id)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer space-y-3 ${
                  badge.unlocked
                    ? 'border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[#0c121e] hover:border-blue-500/40 hover:shadow-xs'
                    : 'border-dashed border-slate-200 dark:border-white/[0.05] bg-slate-50/50 dark:bg-white/[0.01] opacity-60'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`p-2.5 rounded-xl border ${badge.color}`}>
                    <IconComp className="w-5 h-5" />
                  </span>
                  {badge.unlocked ? (
                    <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                      {isEn ? 'Unlocked' : 'کسب شده'}
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold text-slate-400 bg-slate-100 dark:bg-white/[0.06] px-2 py-0.5 rounded-full">
                      {isEn ? 'In Progress' : 'در حال تکمیل'}
                    </span>
                  )}
                </div>

                <div>
                  <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                    {isEn ? badge.titleEn : badge.titleFa}
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                    {isEn ? badge.descEn : badge.descFa}
                  </p>
                </div>

                {badge.unlockDate && (
                  <div className="text-[10px] font-medium text-slate-400 pt-1 border-t border-slate-100 dark:border-white/[0.04]">
                    {isEn
                      ? `Earned: ${badge.unlockDate}`
                      : `تاریخ صدور: ${localizeDigits(badge.unlockDate, 'fa')}`}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
      </>
      )}

      {/* ============================================================ */}
      {/* MISSION ARCHIVE VIEW (CHRONOLOGICAL COMPLETED MISSIONS)       */}
      {/* ============================================================ */}
      {(activeTab === 'missions' || activeTab === 'all') && (
        <MissionArchiveView onNavigateToSection={onNavigateToSection} />
      )}

      {/* ============================================================ */}
      {/* 5. KNOWLEDGE CHECK EXAM TRANSCRIPTS TABLE                     */}
      {/* ============================================================ */}
      {(activeTab === 'transcripts' || activeTab === 'all') && (
        <div className="p-6 rounded-3xl border border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[#0c121e] space-y-5 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-blue-500" />
                <span>{isEn ? 'Module Knowledge Check Exam Transcripts' : 'ریزنمرات آزمون‌های انتهای فصول (کارنامه رسمی)'}</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {isEn
                  ? 'Detailed record of every 3-question module exam, accuracy score, and retake option.'
                  : 'ثبت جزئیات آزمون‌های ۳ سوالی هر سرفصل همراه با امتیاز کسب‌شده و امکان آزمون مجدد.'}
              </p>
            </div>

            <button
              type="button"
              onClick={onNavigateToCurriculum}
              className="px-3.5 py-1.5 rounded-xl bg-slate-100 dark:bg-white/[0.06] hover:bg-blue-600 hover:text-white text-slate-700 dark:text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer self-start sm:self-auto"
            >
              <span>{isEn ? 'Go to Curriculum' : 'مشاهده سرفصل‌ها'}</span>
              {isRTL ? <ChevronLeft className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
            </button>
          </div>

          {/* Transcripts Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-start">
              <thead>
                <tr className="border-b border-slate-200/80 dark:border-white/[0.07] text-slate-400 font-bold uppercase tracking-wider">
                  <th className="py-2.5 px-3 text-start">{isEn ? 'Chapter' : 'فصل'}</th>
                  <th className="py-2.5 px-3 text-start">{isEn ? 'Topic' : 'عنوان سرفصل'}</th>
                  <th className="py-2.5 px-3 text-start">{isEn ? 'Exam Status' : 'وضعیت آزمون'}</th>
                  <th className="py-2.5 px-3 text-start">{isEn ? 'Score' : 'نمره'}</th>
                  <th className="py-2.5 px-3 text-start">{isEn ? 'Earned XP' : 'امتیاز'}</th>
                  <th className="py-2.5 px-3 text-end">{isEn ? 'Action' : 'اقدام'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/[0.04]">
                {ALL_CURRICULUM_MODULES.map((mod) => {
                  const rec = scoresMap[mod.id];
                  const isPassed = rec && rec.correctCount >= 2;
                  const isCompleted = completedModules.includes(mod.id);

                  return (
                    <tr key={mod.id} className="hover:bg-slate-50/70 dark:hover:bg-white/[0.02] transition-colors">
                      <td className="py-3 px-3 font-bold text-blue-600 dark:text-blue-400 whitespace-nowrap">
                        {isEn
                          ? `MOD-0${mod.number}`
                          : `فصل ${formatLocalizedNumber(mod.number, 'fa', true)}`}
                      </td>
                      <td className="py-3 px-3 font-medium text-slate-900 dark:text-white">
                        {isEn ? mod.titleEn : mod.titleFa}
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        {rec ? (
                          <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold text-[11px] bg-emerald-500/10 px-2 py-0.5 rounded-full">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>{isEn ? 'Passed' : 'قبول شده'}</span>
                          </span>
                        ) : (
                          <span className="text-[11px] font-medium text-slate-400 bg-slate-100 dark:bg-white/[0.05] px-2 py-0.5 rounded-full">
                            {isEn ? 'Pending' : 'در انتظار آزمون'}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 tabular-nums whitespace-nowrap">
                        {rec ? (
                          <span className="font-bold text-slate-800 dark:text-slate-200">
                            {formatLocalizedNumber(rec.correctCount, language)} /{' '}
                            {formatLocalizedNumber(rec.totalQuestions, language)} (
                            {formatLocalizedNumber(
                              Math.round((rec.correctCount / rec.totalQuestions) * 100),
                              language
                            )}
                            {isEn ? '%' : '٪'})
                          </span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="py-3 px-3 font-bold text-emerald-500 tabular-nums whitespace-nowrap">
                        {rec
                          ? `+${formatLocalizedNumber(rec.earnedXp, language)} XP`
                          : `${formatLocalizedNumber(0, language)} XP`}
                      </td>
                      <td className="py-3 px-3 text-end whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => onNavigateToModule(mod.id)}
                          className="px-2.5 py-1 rounded-lg bg-blue-500/10 hover:bg-blue-600 hover:text-white text-blue-600 dark:text-blue-400 text-[11px] font-bold transition-colors cursor-pointer"
                        >
                          {rec ? (isEn ? 'Retake Quiz' : 'آزمون مجدد') : (isEn ? 'Take Quiz' : 'شرکت در آزمون')}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
