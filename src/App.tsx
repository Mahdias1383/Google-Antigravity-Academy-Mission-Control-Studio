import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  BookOpen,
  Sparkles,
  Award,
  Terminal,
  Shield,
  Zap,
  Globe,
  Search,
  Activity,
  Menu,
  X,
  ChevronRight,
  ChevronLeft,
  Flame,
  Code2,
  Gamepad2,
  Database,
  Layers,
  Share2,
  Lock,
  ArrowRight,
  User,
  Compass,
  PanelLeftClose,
  PanelLeftOpen,
  ChevronDown,
  CheckCircle2,
} from 'lucide-react';
import { LanguageProvider, useLanguage } from './context/LanguageContext';
import { ALL_CURRICULUM_MODULES } from './data/curriculumIndex';
import { CurriculumModule } from './types/curriculum';
import {
  WorkspaceSectionId,
  NavigationActivityEvent,
  createSectionChangeEvent,
  appendSectionChangeEvent,
  parseActivityLogsFromStorage,
  serializeActivityLogsToStorage,
  NAVIGATION_ACTIVITY_STORAGE_KEY,
} from './utils/activityLogger';
import {
  buildBreadcrumbDescriptorWithTooltips,
  buildSidebarModulePathGraph,
  getStoredKnowledgeCheckScores,
  MissionMilestonePayload,
  XP_MILESTONES_STORAGE_KEY,
  XP_MILESTONE_THRESHOLDS,
  saveStoredReachedXpMilestones,
  checkAndTriggerXpMilestones,
} from './utils/generators';
import {
  formatLocalizedNumber,
  formatLocalizedThousand,
  localizeDigits,
} from './utils/bidiText';
import {
  getStoredDailyStreak,
  recordDailyStreakCheckIn,
  calculateStreakMultiplier,
} from './utils/streakMultiplier';

// Primary Views & Studios
import { LandingPage } from './components/LandingPage';
import { ProfilePage } from './components/ProfilePage';
import { ModuleContentView } from './components/ModuleContentView';
import { AchievementsCertificationView } from './components/AchievementsCertificationView';
import { KnowledgeBaseExplorer } from './components/KnowledgeBaseExplorer';
import { Antigravity3DGame } from './components/Antigravity3DGame';
import { MissionControlSimulator } from './studios/MissionControlSimulator';
import { GuardrailAutomationStudio } from './studios/GuardrailAutomationStudio';
import {
  McpVisualStudio,
  ArchitectScenarioLab,
  CheatSheetsStudio,
} from './studios/McpCheatSheetScenarioStudios';

// Modals & Navigation Tools
import {
  GlobalCommandSearchModal,
  StudioNavigationTarget,
} from './components/GlobalSearchAndAiCopilot';
import { NavigationActivityLoggerModal } from './components/NavigationActivityLoggerModal';
import { InviteShareModal } from './components/InviteShareModal';
import { MissionMilestoneOverlay } from './components/MissionMilestoneToast';
import { ScopedPdfExportModal, PrintableDocumentPayload } from './components/CodeAndPdfTools';
import { PomodoroHeaderWidget } from './components/PomodoroHeaderWidget';
import { DailyObjectivesHeaderWidget } from './components/DailyObjectivesHeaderWidget';
import { OfflineIndicator, PWAInstallButton } from './components/PWAInstallAndOffline';

function AntigravityAcademyContent() {
  const { language, setLanguage, toggleLanguage, isRTL, t } = useLanguage();

  // Navigation State
  const [activeSection, setActiveSection] = useState<WorkspaceSectionId>('landing');
  const [activeModuleId, setActiveModuleId] = useState<string>('module-1');
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem('ag_sidebar_collapsed_v1') === 'true';
    } catch {
      return false;
    }
  });
  const [expandedSidebarGroups, setExpandedSidebarGroups] = useState<{
    core: boolean;
    studios: boolean;
    chapters: boolean;
  }>({
    core: true,
    studios: true,
    chapters: true,
  });

  const toggleDesktopSidebarCollapse = useCallback(() => {
    setIsSidebarCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('ag_sidebar_collapsed_v1', String(next));
      } catch {}
      return next;
    });
  }, []);

  const toggleSidebarGroup = useCallback((groupKey: 'core' | 'studios' | 'chapters') => {
    setExpandedSidebarGroups((prev) => ({
      ...prev,
      [groupKey]: !prev[groupKey],
    }));
  }, []);

  // Modals
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);
  const [isActivityModalOpen, setIsActivityModalOpen] = useState<boolean>(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState<boolean>(false);
  const [pdfPayload, setPdfPayload] = useState<PrintableDocumentPayload | null>(null);
  const [milestone, setMilestone] = useState<MissionMilestonePayload | null>(null);

  // Progress, XP & Streak
  const [completedModules, setCompletedModules] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('ag_completed_modules');
      return saved ? JSON.parse(saved) : ['module-1', 'module-2'];
    } catch {
      return ['module-1', 'module-2'];
    }
  });

  const [userXp, setUserXp] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('ag_user_xp');
      return saved ? parseInt(saved, 10) : 2950;
    } catch {
      return 2950;
    }
  });

  const [activityLogs, setActivityLogs] = useState<NavigationActivityEvent[]>(() => {
    try {
      const raw = localStorage.getItem(NAVIGATION_ACTIVITY_STORAGE_KEY);
      return parseActivityLogsFromStorage(raw);
    } catch {
      return [];
    }
  });

  const [streakData, setStreakData] = useState(() => getStoredDailyStreak());

  // Record Daily Streak Check-in on mount
  useEffect(() => {
    recordDailyStreakCheckIn();
    setStreakData(getStoredDailyStreak());
  }, []);

  // Award XP helper that updates state and syncs to localStorage
  const awardXp = useCallback((amount: number) => {
    setUserXp((prev) => {
      const next = prev + amount;
      try {
        localStorage.setItem('ag_user_xp', next.toString());
      } catch {}
      return next;
    });
  }, []);

  // On initial mount: if ag_reached_xp_milestones_v1 is empty, seed all thresholds strictly below current XP
  // so existing starting XP doesn't trigger unexpected retro toasts on page launch.
  const isInitialMountRef = React.useRef(true);
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        if (localStorage.getItem(XP_MILESTONES_STORAGE_KEY) === null) {
          const historical = XP_MILESTONE_THRESHOLDS
            .filter((m) => m.threshold <= userXp)
            .map((m) => m.threshold);
          saveStoredReachedXpMilestones(historical);
        }
      } catch {}
    }
    isInitialMountRef.current = false;
  }, []);

  // Automatically check & trigger MissionMilestoneOverlay when reaching XP thresholds (e.g. 5000 XP, 10000 XP)
  // and store reached milestones in local storage to prevent duplicate toasts.
  useEffect(() => {
    if (isInitialMountRef.current) return;

    checkAndTriggerXpMilestones({
      currentXp: userXp,
      completedModulesCount: completedModules.length,
      totalModules: ALL_CURRICULUM_MODULES.length,
      onTriggerMilestone: (payload) => {
        setMilestone(payload);
      },
    });
  }, [userXp, completedModules.length]);

  // Sync Activity Log
  const navigateToSection = useCallback(
    (targetSection: WorkspaceSectionId, targetModuleId?: string) => {
      setActivityLogs((prevLogs) => {
        const nextEvt = createSectionChangeEvent({
          fromSection: activeSection,
          toSection: targetSection,
          moduleId: targetModuleId || activeModuleId,
          modules: ALL_CURRICULUM_MODULES,
        });
        const nextLogs = appendSectionChangeEvent(prevLogs, nextEvt);
        try {
          localStorage.setItem(
            NAVIGATION_ACTIVITY_STORAGE_KEY,
            serializeActivityLogsToStorage(nextLogs)
          );
        } catch {}
        return nextLogs;
      });

      setActiveSection(targetSection);
      if (targetModuleId) {
        setActiveModuleId(targetModuleId);
      }
      setIsSidebarOpen(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    [activeSection, activeModuleId]
  );

  // Hotkey listener: Cmd/Ctrl + K (Search), Cmd/Ctrl + Shift + M (Mission Control)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === 'm') {
        e.preventDefault();
        navigateToSection('simulator');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigateToSection]);

  const currentModule = useMemo(() => {
    return (
      ALL_CURRICULUM_MODULES.find((m) => m.id === activeModuleId) ||
      ALL_CURRICULUM_MODULES[0]
    );
  }, [activeModuleId]);

  const formattedModNumber = useMemo(() => {
    return formatLocalizedNumber(currentModule.number, language, true);
  }, [currentModule.number, language]);

  const breadcrumbs = useMemo(() => {
    return buildBreadcrumbDescriptorWithTooltips({
      activeSection,
      language,
      currentModule,
      formattedModNumber,
    });
  }, [activeSection, language, currentModule, formattedModNumber]);

  const sidebarGraph = useMemo(() => {
    return buildSidebarModulePathGraph({
      modules: ALL_CURRICULUM_MODULES,
      completedModules,
      activeModuleId,
      activeSection,
    });
  }, [completedModules, activeModuleId, activeSection]);

  const streakMultiplierInfo = useMemo(() => {
    return calculateStreakMultiplier(streakData.currentStreakDays);
  }, [streakData.currentStreakDays]);

  const handleModuleSelect = (moduleId: string) => {
    setActiveModuleId(moduleId);
    navigateToSection('curriculum', moduleId);
  };

  const handleExportPdf = (payload: PrintableDocumentPayload) => {
    setPdfPayload(payload);
  };

  const coreWorkspaceItems = [
    {
      id: 'landing' as WorkspaceSectionId,
      icon: Compass,
      labelEn: 'Academy Roadmap',
      labelFa: 'نقشه راه آکادمی',
    },
    {
      id: 'curriculum' as WorkspaceSectionId,
      icon: BookOpen,
      labelEn: 'Curriculum Modules',
      labelFa: 'سرفصل‌های آموزشی',
    },
    {
      id: 'profile' as WorkspaceSectionId,
      icon: User,
      labelEn: 'Architect Profile',
      labelFa: 'پروفایل و کارنامه',
    },
    {
      id: 'achievements' as WorkspaceSectionId,
      icon: Award,
      labelEn: 'Certifications & XP',
      labelFa: 'گواهینامه‌ها و امتیازات',
    },
  ];

  const studioItems = [
    {
      id: 'simulator' as WorkspaceSectionId,
      icon: Terminal,
      labelEn: 'Mission Control IDE',
      labelFa: 'شبیه‌ساز Mission Control',
    },
    {
      id: 'guardrails' as WorkspaceSectionId,
      icon: Shield,
      labelEn: 'Rules & Guardrails',
      labelFa: 'استودیوی قوانین .agent',
    },
    {
      id: 'mcp' as WorkspaceSectionId,
      icon: Code2,
      labelEn: 'FastMCP 2.0 Studio',
      labelFa: 'توسعه سرور FastMCP',
    },
    {
      id: 'knowledge-base' as WorkspaceSectionId,
      icon: Database,
      labelEn: 'D3 Knowledge Graph',
      labelFa: 'پایگاه دانش و گراف D3',
    },
    {
      id: 'scenarios' as WorkspaceSectionId,
      icon: Zap,
      labelEn: 'Architect Scenarios',
      labelFa: 'سناریوهای بحران پروداکشن',
    },
    {
      id: 'cheatsheets' as WorkspaceSectionId,
      icon: Layers,
      labelEn: 'Architect Cheat Sheets',
      labelFa: 'چیت‌شیت‌های معماری',
    },
    {
      id: 'game-3d' as WorkspaceSectionId,
      icon: Gamepad2,
      labelEn: '3D Cyber Arena',
      labelFa: 'گیم سه‌بعدی دفاع ایجنت',
    },
  ];

  const completionPercentage = Math.round(
    (completedModules.length / Math.max(1, ALL_CURRICULUM_MODULES.length)) * 100
  );

  return (
    <div
      className="min-h-screen bg-slate-950 text-slate-100 selection:bg-cyan-500/30 font-sans"
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      {/* Top Application Header */}
      <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-slate-950/90 backdrop-blur-xl shadow-sm">
        <div className="max-w-[1440px] mx-auto px-3 sm:px-6 h-16 flex items-center justify-between gap-2 sm:gap-4">
          {/* Left/Start: Sidebar Toggles, Brand & Single-Line Breadcrumb */}
          <div className="flex items-center gap-2.5 min-w-0 shrink-0">
            {/* Mobile Menu Drawer Toggle */}
            <button
              type="button"
              data-testid="mobile-sidebar-toggle-btn"
              onClick={() => setIsSidebarOpen((prev) => !prev)}
              className="h-9 w-9 rounded-xl border border-slate-800 bg-slate-900/70 text-slate-400 hover:text-white hover:bg-slate-800 flex items-center justify-center lg:hidden cursor-pointer shrink-0 transition-colors"
              aria-label="Toggle Navigation Menu"
            >
              {isSidebarOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>

            {/* Desktop Sidebar Collapse / Expand Button */}
            <button
              type="button"
              data-testid="sidebar-collapse-toggle-btn"
              onClick={toggleDesktopSidebarCollapse}
              title={
                isSidebarCollapsed
                  ? language === 'en'
                    ? 'Expand Navigation Sidebar'
                    : 'باز کردن منوی کناری'
                  : language === 'en'
                  ? 'Collapse Navigation Sidebar'
                  : 'جمع کردن منوی کناری'
              }
              className="hidden lg:flex h-9 w-9 items-center justify-center rounded-xl border border-slate-800/90 bg-slate-900/70 text-slate-400 hover:text-cyan-400 hover:border-cyan-500/40 hover:bg-slate-900 transition-all cursor-pointer shrink-0"
              aria-label="Toggle Desktop Sidebar"
            >
              {isSidebarCollapsed ? (
                <PanelLeftOpen className={`w-4 h-4 ${isRTL ? 'rotate-180' : ''}`} />
              ) : (
                <PanelLeftClose className={`w-4 h-4 ${isRTL ? 'rotate-180' : ''}`} />
              )}
            </button>

            {/* Brand Identity */}
            <button
              type="button"
              onClick={() => navigateToSection('landing')}
              className="flex items-center gap-2.5 font-bold text-white hover:opacity-95 transition-opacity shrink-0 cursor-pointer"
            >
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-md shadow-cyan-500/20 shrink-0">
                <Terminal className="w-4 h-4" />
              </div>
              <div className="hidden sm:block text-start whitespace-nowrap">
                <div className="text-sm font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-cyan-400 bg-clip-text text-transparent leading-tight">
                  Antigravity Academy
                </div>
                <div className="text-[10px] text-cyan-400/80 font-mono tracking-wider uppercase leading-tight">
                  Mission Control Studio
                </div>
              </div>
            </button>

            {/* Single-line Breadcrumb Pill */}
            <div className="hidden xl:flex items-center gap-2 text-xs text-slate-400 border-s border-slate-800/90 ps-3 ms-1 min-w-0 overflow-hidden">
              <span className="text-slate-400 font-medium truncate max-w-[120px] 2xl:max-w-[180px]">
                {breadcrumbs.group}
              </span>
              <span className="text-slate-600 shrink-0">/</span>
              <span className="text-cyan-400 font-bold truncate max-w-[140px] 2xl:max-w-[220px]">
                {breadcrumbs.item}
              </span>
            </div>
          </div>

          {/* Right/End: Uniform Single-Line Quick Actions & Telemetry Deck */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Daily Objectives Header Widget */}
            <DailyObjectivesHeaderWidget
              currentStreakDays={streakData.currentStreakDays}
              onAwardXp={awardXp}
              onNavigateToSection={navigateToSection}
            />

            {/* Pomodoro Timer Header Widget */}
            <PomodoroHeaderWidget currentModule={currentModule} />

            {/* Streak & Multiplier Badge */}
            <div
              className="hidden 2xl:flex items-center gap-1.5 h-9 px-2.5 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-400 text-xs whitespace-nowrap shrink-0"
              title={
                language === 'en'
                  ? `Streak: ${streakData.currentStreakDays} days (${streakMultiplierInfo.multiplier}x Multiplier)`
                  : `استمرار: ${formatLocalizedNumber(streakData.currentStreakDays, 'fa')} روز (ضریب ${localizeDigits(streakMultiplierInfo.multiplier, 'fa')}x)`
              }
            >
              <Flame className="w-3.5 h-3.5 fill-amber-500 text-amber-500 shrink-0" />
              <span className="font-extrabold tabular-nums">
                {language === 'en'
                  ? `${streakData.currentStreakDays}d`
                  : `${formatLocalizedNumber(streakData.currentStreakDays, 'fa')} روز`}
              </span>
              <span dir="ltr" className="text-[10px] font-bold text-amber-300/90 tabular-nums">
                ({localizeDigits(streakMultiplierInfo.multiplier, language)}x)
              </span>
            </div>

            {/* Search (Cmd+K) Trigger */}
            <button
              type="button"
              data-testid="header-search-btn"
              onClick={() => setIsSearchOpen(true)}
              className="flex items-center gap-2 h-9 px-3 rounded-xl border border-slate-800/90 bg-slate-900/75 text-slate-300 hover:text-white hover:border-slate-700 text-xs transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="hidden md:inline font-medium whitespace-nowrap">
                {language === 'en' ? 'Quick Search' : 'جستجوی سریع'}
              </span>
              <kbd className="hidden md:inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono bg-slate-800/90 rounded-md text-slate-400 border border-slate-700/80">
                ⌘K
              </kbd>
            </button>

            {/* Navigation Activity Log Modal Trigger */}
            <button
              type="button"
              data-testid="header-activity-log-btn"
              onClick={() => setIsActivityModalOpen(true)}
              className="h-9 w-9 flex items-center justify-center rounded-xl border border-slate-800/90 bg-slate-900/75 text-slate-400 hover:text-cyan-400 hover:border-slate-700 text-xs transition-colors cursor-pointer shrink-0"
              title={language === 'en' ? 'Activity Log' : 'تاریخچه فعالیت‌ها'}
            >
              <Activity className="w-4 h-4" />
            </button>

            {/* Invite & Share Modal Trigger */}
            <button
              type="button"
              data-testid="header-invite-share-btn"
              onClick={() => setIsInviteModalOpen(true)}
              className="h-9 w-9 flex items-center justify-center rounded-xl border border-slate-800/90 bg-slate-900/75 text-slate-400 hover:text-emerald-400 hover:border-slate-700 text-xs transition-colors cursor-pointer shrink-0"
              title={language === 'en' ? 'Invite & Share' : 'دعوت و اشتراک‌گذاری'}
            >
              <Share2 className="w-4 h-4" />
            </button>

            {/* Language Switcher */}
            <button
              type="button"
              data-testid="header-language-toggle-btn"
              onClick={toggleLanguage}
              className="flex items-center gap-1.5 h-9 px-2.5 rounded-xl border border-slate-800/90 bg-slate-900/75 text-slate-300 hover:text-white hover:border-slate-700 text-xs font-mono font-bold transition-colors cursor-pointer whitespace-nowrap shrink-0"
              title="Toggle Persian / English"
            >
              <Globe className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              <span>{language === 'fa' ? 'FA' : 'EN'}</span>
            </button>

            {/* Profile Avatar & XP Pill */}
            <button
              type="button"
              data-testid="header-profile-xp-btn"
              onClick={() => navigateToSection('profile')}
              className={`flex items-center gap-2 h-9 px-2.5 rounded-xl border text-xs font-medium transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                activeSection === 'profile'
                  ? 'border-cyan-500/80 bg-cyan-500/15 text-cyan-300 shadow-sm shadow-cyan-500/10'
                  : 'border-slate-800/90 bg-slate-900/75 text-slate-300 hover:border-slate-700 hover:text-white'
              }`}
            >
              <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-cyan-600 to-indigo-600 flex items-center justify-center text-white text-[10px] font-black shrink-0">
                AG
              </div>
              <span className="hidden sm:inline font-extrabold text-cyan-400 tabular-nums whitespace-nowrap">
                {formatLocalizedThousand(userXp, language)} XP
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Drawer Backdrop */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/70 backdrop-blur-xs lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Main Layout Body */}
      <div className="max-w-[1440px] mx-auto px-3 sm:px-6 py-5 flex items-start gap-5">
        {/* Collapsible Navigation Sidebar (Desktop Dock + Mobile Slide-over) */}
        <aside
          data-testid="app-navigation-sidebar"
          data-collapsed={isSidebarCollapsed ? 'true' : 'false'}
          className={`fixed inset-y-0 start-0 z-50 w-72 bg-slate-950/95 backdrop-blur-2xl border-e border-slate-800/90 p-3.5 transform transition-all duration-300 ease-out lg:sticky lg:top-20 lg:z-30 lg:h-[calc(100vh-6.25rem)] lg:rounded-2xl lg:border lg:border-slate-800/80 lg:bg-slate-900/55 lg:shadow-xl lg:transform-none shrink-0 flex flex-col ${
            isSidebarCollapsed ? 'lg:w-[76px] lg:p-2.5' : 'lg:w-72 lg:p-3.5'
          } ${
            isSidebarOpen
              ? 'translate-x-0'
              : isRTL
              ? 'translate-x-full lg:translate-x-0'
              : '-translate-x-full lg:translate-x-0'
          }`}
        >
          {/* Sidebar Header & Collapse Toggle */}
          <div
            className={`flex items-center pb-3 mb-3 border-b border-slate-800/80 ${
              isSidebarCollapsed ? 'lg:justify-center justify-between' : 'justify-between'
            }`}
          >
            <div className={`flex items-center gap-2.5 min-w-0 ${isSidebarCollapsed ? 'lg:hidden' : ''}`}>
              <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-xs shadow-cyan-400/50 shrink-0" />
              <span className="font-extrabold text-xs text-slate-200 tracking-wide truncate">
                {language === 'en' ? 'Navigation Dock' : 'ناوبری و میز کار'}
              </span>
            </div>

            {/* Desktop Collapse / Expand Button inside Sidebar */}
            <button
              type="button"
              data-testid="sidebar-inner-collapse-btn"
              onClick={toggleDesktopSidebarCollapse}
              title={
                isSidebarCollapsed
                  ? language === 'en'
                    ? 'Expand Sidebar'
                    : 'باز کردن منوی ناوبری'
                  : language === 'en'
                  ? 'Collapse Sidebar'
                  : 'جمع کردن منوی ناوبری'
              }
              className="hidden lg:flex items-center justify-center w-8 h-8 rounded-xl border border-slate-800 bg-slate-900/80 text-slate-400 hover:text-cyan-400 hover:border-cyan-500/40 transition-colors cursor-pointer shrink-0"
            >
              {isSidebarCollapsed ? (
                <PanelLeftOpen className={`w-4 h-4 ${isRTL ? 'rotate-180' : ''}`} />
              ) : (
                <PanelLeftClose className={`w-4 h-4 ${isRTL ? 'rotate-180' : ''}`} />
              )}
            </button>

            {/* Mobile Close Button */}
            <button
              type="button"
              onClick={() => setIsSidebarOpen(false)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 lg:hidden cursor-pointer"
              aria-label="Close Sidebar"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Architect Progress Mini-Card (Visible when Expanded) */}
          <div
            className={`mb-3.5 p-2.5 rounded-xl border border-slate-800/90 bg-slate-950/60 space-y-2 ${
              isSidebarCollapsed ? 'lg:hidden' : ''
            }`}
          >
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-400 font-semibold">
                {language === 'en' ? 'Mastery Progress' : 'پیشرفت دوره'}
              </span>
              <span className="font-bold text-cyan-400 tabular-nums">
                {language === 'en'
                  ? `${completedModules.length} / ${ALL_CURRICULUM_MODULES.length}`
                  : `${formatLocalizedNumber(completedModules.length, 'fa')} از ${formatLocalizedNumber(ALL_CURRICULUM_MODULES.length, 'fa')}`}{' '}
                <span className="text-slate-500">
                  ({formatLocalizedNumber(completionPercentage, language)}
                  {language === 'en' ? '%' : '٪'})
                </span>
              </span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-slate-800/90 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-300"
                style={{ width: `${completionPercentage}%` }}
              />
            </div>
          </div>

          {/* Scrollable Navigation Sections */}
          <nav className="flex-1 overflow-y-auto space-y-4 pr-0.5 text-sm scrollbar-thin">
            {/* 1. Primary Core Sections */}
            <div>
              {!isSidebarCollapsed && (
                <button
                  type="button"
                  onClick={() => toggleSidebarGroup('core')}
                  className="w-full flex items-center justify-between text-[11px] font-extrabold uppercase tracking-wider text-slate-400 hover:text-slate-200 px-2.5 py-1 mb-1 transition-colors cursor-pointer"
                >
                  <span>{language === 'en' ? 'Core Workspaces' : 'بخش‌های اصلی'}</span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 text-slate-500 transition-transform duration-200 ${
                      expandedSidebarGroups.core ? 'rotate-0' : '-rotate-90'
                    }`}
                  />
                </button>
              )}

              {(expandedSidebarGroups.core || isSidebarCollapsed) && (
                <div className="space-y-1">
                  {coreWorkspaceItems.map((item) => {
                    const IconComp = item.icon;
                    const isActive = activeSection === item.id;
                    const label = language === 'en' ? item.labelEn : item.labelFa;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        data-testid={`sidebar-nav-${item.id}`}
                        onClick={() =>
                          item.id === 'curriculum'
                            ? navigateToSection('curriculum', activeModuleId)
                            : navigateToSection(item.id)
                        }
                        title={label}
                        className={`w-full flex items-center gap-3 rounded-xl text-start transition-all cursor-pointer relative group ${
                          isSidebarCollapsed
                            ? 'lg:justify-center lg:px-0 lg:py-2.5 px-3 py-2'
                            : 'px-3 py-2'
                        } ${
                          isActive
                            ? 'bg-gradient-to-r from-cyan-500/15 to-blue-500/10 text-cyan-300 font-bold border border-cyan-500/30 shadow-xs'
                            : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/50 border border-transparent'
                        }`}
                      >
                        <IconComp
                          className={`w-4 h-4 shrink-0 transition-colors ${
                            isActive ? 'text-cyan-400' : 'text-slate-400 group-hover:text-cyan-300'
                          }`}
                        />
                        <span className={`truncate text-xs ${isSidebarCollapsed ? 'lg:hidden' : ''}`}>
                          {label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 2. Interactive Engineering Studios */}
            <div className="pt-2 border-t border-slate-800/60">
              {!isSidebarCollapsed && (
                <button
                  type="button"
                  onClick={() => toggleSidebarGroup('studios')}
                  className="w-full flex items-center justify-between text-[11px] font-extrabold uppercase tracking-wider text-slate-400 hover:text-slate-200 px-2.5 py-1 mb-1 transition-colors cursor-pointer"
                >
                  <span>{language === 'en' ? 'Live Engineering Studios' : 'استودیوهای مهندسی زنده'}</span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 text-slate-500 transition-transform duration-200 ${
                      expandedSidebarGroups.studios ? 'rotate-0' : '-rotate-90'
                    }`}
                  />
                </button>
              )}

              {(expandedSidebarGroups.studios || isSidebarCollapsed) && (
                <div className="space-y-1">
                  {studioItems.map((item) => {
                    const IconComp = item.icon;
                    const isActive = activeSection === item.id;
                    const label = language === 'en' ? item.labelEn : item.labelFa;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        data-testid={`sidebar-nav-${item.id}`}
                        onClick={() => navigateToSection(item.id)}
                        title={label}
                        className={`w-full flex items-center gap-3 rounded-xl text-start transition-all cursor-pointer relative group ${
                          isSidebarCollapsed
                            ? 'lg:justify-center lg:px-0 lg:py-2.5 px-3 py-2'
                            : 'px-3 py-2'
                        } ${
                          isActive
                            ? 'bg-gradient-to-r from-cyan-500/15 to-blue-500/10 text-cyan-300 font-bold border border-cyan-500/30 shadow-xs'
                            : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/50 border border-transparent'
                        }`}
                      >
                        <IconComp
                          className={`w-4 h-4 shrink-0 transition-colors ${
                            isActive ? 'text-cyan-400' : 'text-slate-400 group-hover:text-cyan-300'
                          }`}
                        />
                        <span className={`truncate text-xs ${isSidebarCollapsed ? 'lg:hidden' : ''}`}>
                          {label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 3. Quick 8-Module Chapter Jump */}
            <div className="pt-2 border-t border-slate-800/60">
              {!isSidebarCollapsed && (
                <button
                  type="button"
                  onClick={() => toggleSidebarGroup('chapters')}
                  className="w-full flex items-center justify-between text-[11px] font-extrabold uppercase tracking-wider text-slate-400 hover:text-slate-200 px-2.5 py-1 mb-1 transition-colors cursor-pointer"
                >
                  <span>{language === 'en' ? 'Curriculum Chapters' : 'سرفصل‌های ۸گانه'}</span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 text-slate-500 transition-transform duration-200 ${
                      expandedSidebarGroups.chapters ? 'rotate-0' : '-rotate-90'
                    }`}
                  />
                </button>
              )}

              {(expandedSidebarGroups.chapters || isSidebarCollapsed) && (
                <div className="space-y-1">
                  {ALL_CURRICULUM_MODULES.map((mod) => {
                    const isCurrent = activeSection === 'curriculum' && activeModuleId === mod.id;
                    const isDone = completedModules.includes(mod.id);
                    const modNumStr = formatLocalizedNumber(mod.number, language, true);
                    const fullTitle = `${modNumStr}. ${language === 'en' ? mod.titleEn : mod.titleFa}`;
                    return (
                      <button
                        key={mod.id}
                        type="button"
                        onClick={() => handleModuleSelect(mod.id)}
                        title={fullTitle}
                        className={`w-full flex items-center justify-between rounded-xl text-xs text-start transition-all cursor-pointer ${
                          isSidebarCollapsed
                            ? 'lg:justify-center lg:px-0 lg:py-2 px-2.5 py-1.5'
                            : 'px-2.5 py-1.5'
                        } ${
                          isCurrent
                            ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/30'
                            : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/45 border border-transparent'
                        }`}
                      >
                        {isSidebarCollapsed ? (
                          <span className="hidden lg:inline-flex items-center justify-center w-6 h-6 rounded-lg bg-slate-800/90 text-[11px] font-bold text-slate-200 relative">
                            {modNumStr}
                            {isDone && (
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 absolute -top-0.5 -right-0.5" />
                            )}
                          </span>
                        ) : null}

                        <div
                          className={`flex items-center gap-2 min-w-0 flex-1 ${
                            isSidebarCollapsed ? 'lg:hidden' : ''
                          }`}
                        >
                          <span
                            className={`w-5 h-5 rounded-md text-[10px] font-bold flex items-center justify-center shrink-0 ${
                              isCurrent
                                ? 'bg-cyan-500 text-slate-950'
                                : isDone
                                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                                : 'bg-slate-800 text-slate-400'
                            }`}
                          >
                            {modNumStr}
                          </span>
                          <span className="truncate">
                            {language === 'en' ? mod.titleEn : mod.titleFa}
                          </span>
                        </div>

                        {isDone && (
                          <CheckCircle2
                            className={`w-3.5 h-3.5 text-emerald-400 shrink-0 ms-1.5 ${
                              isSidebarCollapsed ? 'lg:hidden' : ''
                            }`}
                          />
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </nav>
        </aside>

        {/* Primary Workspace Stage */}
        <main className="flex-1 min-w-0">
          {activeSection === 'landing' && (
            <LandingPage
              onStartCurriculum={(modId) => navigateToSection('curriculum', modId || 'module-1')}
              onOpenStudio={(studio) => navigateToSection(studio)}
              onOpenProfile={() => navigateToSection('profile')}
              onOpenAchievements={() => navigateToSection('achievements')}
              completedModules={completedModules}
              totalModules={ALL_CURRICULUM_MODULES.length}
              userXp={userXp}
            />
          )}

          {activeSection === 'curriculum' && (
            <ModuleContentView
              module={currentModule}
              isCompleted={completedModules.includes(currentModule.id)}
              onToggleComplete={(modId) => {
                const isCompleting = !completedModules.includes(modId);
                const nextCompleted = isCompleting
                  ? [...completedModules, modId]
                  : completedModules.filter((id) => id !== modId);
                setCompletedModules(nextCompleted);
                localStorage.setItem('ag_completed_modules', JSON.stringify(nextCompleted));
                if (isCompleting) {
                  awardXp(350);
                }
              }}
              onSelectModule={handleModuleSelect}
              totalModules={ALL_CURRICULUM_MODULES.length}
              allModules={ALL_CURRICULUM_MODULES}
              onExportPdf={handleExportPdf}
            />
          )}

          {activeSection === 'profile' && (
            <ProfilePage
              completedModules={completedModules}
              userXp={userXp}
              onNavigateToModule={handleModuleSelect}
              onNavigateToCurriculum={() => navigateToSection('curriculum')}
              onNavigateToSection={(sec) => navigateToSection(sec)}
              onRewardXp={awardXp}
            />
          )}

          {activeSection === 'achievements' && (
            <AchievementsCertificationView
              allModules={ALL_CURRICULUM_MODULES}
              completedModules={completedModules}
              onToggleModuleComplete={(modId) => {
                const isCompleting = !completedModules.includes(modId);
                const nextCompleted = isCompleting
                  ? [...completedModules, modId]
                  : completedModules.filter((id) => id !== modId);
                setCompletedModules(nextCompleted);
                localStorage.setItem('ag_completed_modules', JSON.stringify(nextCompleted));
                if (isCompleting) {
                  awardXp(350);
                }
              }}
              onCompleteAllModules={() => {
                const allIds = ALL_CURRICULUM_MODULES.map((m) => m.id);
                const newlyCompleted = allIds.filter((id) => !completedModules.includes(id)).length;
                setCompletedModules(allIds);
                localStorage.setItem('ag_completed_modules', JSON.stringify(allIds));
                if (newlyCompleted > 0) {
                  awardXp(newlyCompleted * 350);
                }
              }}
              onNavigateToModule={handleModuleSelect}
              onExportPdf={handleExportPdf}
            />
          )}

          {activeSection === 'simulator' && (
            <MissionControlSimulator
              onExportPdf={handleExportPdf}
              completedModules={completedModules}
              totalModules={ALL_CURRICULUM_MODULES.length}
            />
          )}

          {activeSection === 'guardrails' && (
            <GuardrailAutomationStudio onExportPdf={handleExportPdf} />
          )}

          {activeSection === 'mcp' && (
            <McpVisualStudio onExportPdf={handleExportPdf} />
          )}

          {activeSection === 'scenarios' && (
            <ArchitectScenarioLab onExportPdf={handleExportPdf} />
          )}

          {activeSection === 'cheatsheets' && (
            <CheatSheetsStudio onExportPdf={handleExportPdf} />
          )}

          {activeSection === 'knowledge-base' && (
            <KnowledgeBaseExplorer
              onExportPdf={handleExportPdf}
              completedModules={completedModules}
            />
          )}

          {activeSection === 'game-3d' && (
            <Antigravity3DGame onExitToAcademy={() => navigateToSection('landing')} />
          )}
        </main>
      </div>

      {/* Global Modals & Overlays */}
      <GlobalCommandSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onNavigateToModule={(modId) => {
          setIsSearchOpen(false);
          handleModuleSelect(modId);
        }}
        onNavigateToStudio={(studio) => {
          setIsSearchOpen(false);
          navigateToSection(studio);
        }}
      />

      <NavigationActivityLoggerModal
        isOpen={isActivityModalOpen}
        onClose={() => setIsActivityModalOpen(false)}
        logs={activityLogs}
        onClearHistory={() => {
          setActivityLogs([]);
          localStorage.removeItem(NAVIGATION_ACTIVITY_STORAGE_KEY);
        }}
        onNavigateToEntry={(sec, modId) => {
          setIsActivityModalOpen(false);
          navigateToSection(sec, modId);
        }}
      />

      <InviteShareModal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        completedModulesCount={completedModules.length}
        totalModulesCount={ALL_CURRICULUM_MODULES.length}
        userXp={userXp}
        onRewardXp={awardXp}
      />

      <ScopedPdfExportModal
        payload={pdfPayload}
        onClose={() => setPdfPayload(null)}
      />

      <MissionMilestoneOverlay
        milestone={milestone}
        onClose={() => setMilestone(null)}
        onAdvanceNextModule={(nextNum) => {
          const nextMod = ALL_CURRICULUM_MODULES.find((m) => m.number === nextNum);
          if (nextMod) handleModuleSelect(nextMod.id);
          setMilestone(null);
        }}
        onOpenTrophyCase={() => {
          navigateToSection('achievements');
          setMilestone(null);
        }}
      />

      <OfflineIndicator />
    </div>
  );
}

export function App() {
  return (
    <LanguageProvider>
      <AntigravityAcademyContent />
    </LanguageProvider>
  );
}

export default App;
