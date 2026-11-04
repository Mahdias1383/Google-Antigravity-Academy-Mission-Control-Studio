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
} from './utils/generators';
import { formatLocalizedNumber } from './utils/bidiText';
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
import { OfflineIndicator, PWAInstallButton } from './components/PWAInstallAndOffline';

function AntigravityAcademyContent() {
  const { language, setLanguage, toggleLanguage, isRTL, t } = useLanguage();

  // Navigation State
  const [activeSection, setActiveSection] = useState<WorkspaceSectionId>('landing');
  const [activeModuleId, setActiveModuleId] = useState<string>('module-1');
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);

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

  return (
    <div
      className="min-h-screen bg-slate-950 text-slate-100 selection:bg-cyan-500/30 font-sans"
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      {/* Top Application Header */}
      <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-slate-950/90 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          {/* Brand & Breadcrumbs */}
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setIsSidebarOpen((prev) => !prev)}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 lg:hidden cursor-pointer"
              aria-label="Toggle Navigation Menu"
            >
              {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            <button
              type="button"
              onClick={() => navigateToSection('landing')}
              className="flex items-center gap-2.5 font-bold text-white hover:opacity-90 transition-opacity shrink-0 cursor-pointer"
            >
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-cyan-500/20">
                <Terminal className="w-4 h-4" />
              </div>
              <div className="hidden sm:block text-start">
                <div className="text-sm font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-cyan-400 bg-clip-text text-transparent">
                  Antigravity Academy
                </div>
                <div className="text-[10px] text-cyan-400/80 font-mono tracking-wider uppercase">
                  Mission Control Studio
                </div>
              </div>
            </button>

            {/* Breadcrumb Trail */}
            <div className="hidden md:flex items-center gap-2 text-xs text-slate-400 min-w-0 border-s border-slate-800 ps-3 ms-1">
              <span className="text-slate-500">{breadcrumbs.group}</span>
              <span className="text-slate-600">/</span>
              <span className="text-cyan-400 font-medium truncate max-w-[200px] xl:max-w-[320px]">
                {breadcrumbs.item}
              </span>
            </div>
          </div>

          {/* Quick Actions & Telemetry Widgets */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Pomodoro Timer Header Widget */}
            <PomodoroHeaderWidget currentModule={currentModule} />

            {/* Streak & Multiplier Badge */}
            <div
              className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-amber-500/30 bg-amber-500/10 text-amber-400 text-xs font-mono"
              title={`Streak: ${streakData.currentStreakDays} days (${streakMultiplierInfo.multiplier}x Multiplier)`}
            >
              <Flame className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
              <span className="font-bold">{streakData.currentStreakDays}d</span>
              <span className="text-[10px] text-amber-300/80">({streakMultiplierInfo.multiplier}x)</span>
            </div>

            {/* Search (Cmd+K) Trigger */}
            <button
              type="button"
              onClick={() => setIsSearchOpen(true)}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-slate-800 bg-slate-900/60 text-slate-300 hover:text-white hover:border-slate-700 text-xs transition-colors cursor-pointer"
            >
              <Search className="w-3.5 h-3.5 text-slate-400" />
              <span className="hidden sm:inline">{language === 'en' ? 'Quick Search' : 'جستجوی سریع'}</span>
              <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono bg-slate-800 rounded text-slate-400 border border-slate-700">
                ⌘K
              </kbd>
            </button>

            {/* Navigation Activity Log Modal Trigger */}
            <button
              type="button"
              onClick={() => setIsActivityModalOpen(true)}
              className="p-2 rounded-lg border border-slate-800 bg-slate-900/60 text-slate-400 hover:text-cyan-400 hover:border-slate-700 text-xs transition-colors cursor-pointer"
              title={language === 'en' ? 'Activity Log' : 'تاریخچه فعالیت‌ها'}
            >
              <Activity className="w-4 h-4" />
            </button>

            {/* Invite & Share Modal Trigger */}
            <button
              type="button"
              onClick={() => setIsInviteModalOpen(true)}
              className="p-2 rounded-lg border border-slate-800 bg-slate-900/60 text-slate-400 hover:text-emerald-400 hover:border-slate-700 text-xs transition-colors cursor-pointer"
              title={language === 'en' ? 'Invite & Share' : 'دعوت و اشتراک‌گذاری'}
            >
              <Share2 className="w-4 h-4" />
            </button>

            {/* Language Switcher */}
            <button
              type="button"
              onClick={toggleLanguage}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-800 bg-slate-900/60 text-slate-300 hover:text-white text-xs font-mono transition-colors cursor-pointer"
              title="Toggle Persian / English"
            >
              <Globe className="w-3.5 h-3.5 text-cyan-400" />
              <span>{language === 'fa' ? 'FA' : 'EN'}</span>
            </button>

            {/* Profile Avatar & XP Link */}
            <button
              type="button"
              onClick={() => navigateToSection('profile')}
              className={`flex items-center gap-2 p-1 sm:px-2.5 sm:py-1.5 rounded-lg border text-xs font-medium transition-colors cursor-pointer ${
                activeSection === 'profile'
                  ? 'border-cyan-500 bg-cyan-500/10 text-cyan-300'
                  : 'border-slate-800 bg-slate-900/60 text-slate-300 hover:border-slate-700'
              }`}
            >
              <div className="w-6 h-6 rounded-md bg-gradient-to-tr from-cyan-600 to-indigo-600 flex items-center justify-center text-white text-[10px] font-bold">
                AG
              </div>
              <span className="hidden sm:inline font-mono font-bold text-cyan-400">{userXp} XP</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Layout Body */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 flex gap-6">
        {/* Navigation Sidebar (Desktop + Mobile Slide-over) */}
        <aside
          className={`fixed inset-y-0 start-0 z-50 w-72 bg-slate-950/95 border-e border-slate-800/80 p-5 transform transition-transform duration-200 lg:static lg:inset-auto lg:w-64 lg:p-0 lg:bg-transparent lg:border-none lg:transform-none shrink-0 ${
            isSidebarOpen ? 'translate-x-0' : isRTL ? 'translate-x-full lg:translate-x-0' : '-translate-x-full lg:translate-x-0'
          }`}
        >
          <div className="flex items-center justify-between mb-4 lg:hidden">
            <span className="font-bold text-sm text-slate-300">منوی ناوبری</span>
            <button
              type="button"
              onClick={() => setIsSidebarOpen(false)}
              className="p-1 rounded text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <nav className="space-y-6 text-sm">
            {/* Primary Core Sections */}
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 px-3 mb-2">
                {language === 'en' ? 'Core Workspaces' : 'بخش‌های اصلی'}
              </div>
              <div className="space-y-1">
                <button
                  type="button"
                  onClick={() => navigateToSection('landing')}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-start transition-colors cursor-pointer ${
                    activeSection === 'landing'
                      ? 'bg-cyan-500/10 text-cyan-400 font-semibold border border-cyan-500/20'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
                  }`}
                >
                  <Compass className="w-4 h-4 shrink-0" />
                  <span>{language === 'en' ? 'Academy Roadmap' : 'نقشه راه آکادمی'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => navigateToSection('curriculum', activeModuleId)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-start transition-colors cursor-pointer ${
                    activeSection === 'curriculum'
                      ? 'bg-cyan-500/10 text-cyan-400 font-semibold border border-cyan-500/20'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
                  }`}
                >
                  <BookOpen className="w-4 h-4 shrink-0" />
                  <span>{language === 'en' ? 'Curriculum Modules' : 'سرفصل‌های آموزشی'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => navigateToSection('profile')}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-start transition-colors cursor-pointer ${
                    activeSection === 'profile'
                      ? 'bg-cyan-500/10 text-cyan-400 font-semibold border border-cyan-500/20'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
                  }`}
                >
                  <User className="w-4 h-4 shrink-0" />
                  <span>{language === 'en' ? 'Architect Profile' : 'پروفایل و کارنامه'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => navigateToSection('achievements')}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-start transition-colors cursor-pointer ${
                    activeSection === 'achievements'
                      ? 'bg-cyan-500/10 text-cyan-400 font-semibold border border-cyan-500/20'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
                  }`}
                >
                  <Award className="w-4 h-4 shrink-0" />
                  <span>{language === 'en' ? 'Certifications & XP' : 'گواهینامه‌ها و امتیازات'}</span>
                </button>
              </div>
            </div>

            {/* Interactive Engineering Studios */}
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 px-3 mb-2">
                {language === 'en' ? 'Live Engineering Studios' : 'استودیوهای مهندسی زنده'}
              </div>
              <div className="space-y-1">
                <button
                  type="button"
                  onClick={() => navigateToSection('simulator')}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-start transition-colors cursor-pointer ${
                    activeSection === 'simulator'
                      ? 'bg-cyan-500/10 text-cyan-400 font-semibold border border-cyan-500/20'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
                  }`}
                >
                  <Terminal className="w-4 h-4 shrink-0" />
                  <span>{language === 'en' ? 'Mission Control IDE' : 'شبیه‌ساز Mission Control'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => navigateToSection('guardrails')}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-start transition-colors cursor-pointer ${
                    activeSection === 'guardrails'
                      ? 'bg-cyan-500/10 text-cyan-400 font-semibold border border-cyan-500/20'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
                  }`}
                >
                  <Shield className="w-4 h-4 shrink-0" />
                  <span>{language === 'en' ? 'Rules & Guardrails' : 'استودیوی قوانین .agent'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => navigateToSection('mcp')}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-start transition-colors cursor-pointer ${
                    activeSection === 'mcp'
                      ? 'bg-cyan-500/10 text-cyan-400 font-semibold border border-cyan-500/20'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
                  }`}
                >
                  <Code2 className="w-4 h-4 shrink-0" />
                  <span>{language === 'en' ? 'FastMCP 2.0 Studio' : 'توسعه سرور FastMCP'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => navigateToSection('knowledge-base')}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-start transition-colors cursor-pointer ${
                    activeSection === 'knowledge-base'
                      ? 'bg-cyan-500/10 text-cyan-400 font-semibold border border-cyan-500/20'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
                  }`}
                >
                  <Database className="w-4 h-4 shrink-0" />
                  <span>{language === 'en' ? 'D3 Knowledge Graph' : 'پایگاه دانش و گراف D3'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => navigateToSection('scenarios')}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-start transition-colors cursor-pointer ${
                    activeSection === 'scenarios'
                      ? 'bg-cyan-500/10 text-cyan-400 font-semibold border border-cyan-500/20'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
                  }`}
                >
                  <Zap className="w-4 h-4 shrink-0" />
                  <span>{language === 'en' ? 'Architect Scenarios' : 'سناریوهای بحران پروداکشن'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => navigateToSection('cheatsheets')}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-start transition-colors cursor-pointer ${
                    activeSection === 'cheatsheets'
                      ? 'bg-cyan-500/10 text-cyan-400 font-semibold border border-cyan-500/20'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
                  }`}
                >
                  <Layers className="w-4 h-4 shrink-0" />
                  <span>{language === 'en' ? 'Architect Cheat Sheets' : 'چیت‌شیت‌های معماری'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => navigateToSection('game-3d')}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-start transition-colors cursor-pointer ${
                    activeSection === 'game-3d'
                      ? 'bg-cyan-500/10 text-cyan-400 font-semibold border border-cyan-500/20'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
                  }`}
                >
                  <Gamepad2 className="w-4 h-4 shrink-0" />
                  <span>{language === 'en' ? '3D Cyber Arena' : 'گیم سه‌بعدی دفاع ایجنت'}</span>
                </button>
              </div>
            </div>

            {/* Quick 8-Module Chapter Jump */}
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 px-3 mb-2">
                {language === 'en' ? 'Curriculum Chapters' : 'سرفصل‌های ۸گانه'}
              </div>
              <div className="space-y-1">
                {ALL_CURRICULUM_MODULES.map((mod) => {
                  const isCurrent = activeSection === 'curriculum' && activeModuleId === mod.id;
                  const isDone = completedModules.includes(mod.id);
                  return (
                    <button
                      key={mod.id}
                      type="button"
                      onClick={() => handleModuleSelect(mod.id)}
                      className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs text-start transition-colors cursor-pointer ${
                        isCurrent
                          ? 'bg-cyan-500/20 text-cyan-300 font-bold'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
                      }`}
                    >
                      <span className="truncate max-w-[170px]">
                        {formatLocalizedNumber(mod.number, language, true)}. {language === 'en' ? mod.titleEn : mod.titleFa}
                      </span>
                      {isDone && <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />}
                    </button>
                  );
                })}
              </div>
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
                const nextCompleted = completedModules.includes(modId)
                  ? completedModules.filter((id) => id !== modId)
                  : [...completedModules, modId];
                setCompletedModules(nextCompleted);
                localStorage.setItem('ag_completed_modules', JSON.stringify(nextCompleted));
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
            />
          )}

          {activeSection === 'achievements' && (
            <AchievementsCertificationView
              allModules={ALL_CURRICULUM_MODULES}
              completedModules={completedModules}
              onToggleModuleComplete={(modId) => {
                const nextCompleted = completedModules.includes(modId)
                  ? completedModules.filter((id) => id !== modId)
                  : [...completedModules, modId];
                setCompletedModules(nextCompleted);
                localStorage.setItem('ag_completed_modules', JSON.stringify(nextCompleted));
              }}
              onCompleteAllModules={() => {
                const allIds = ALL_CURRICULUM_MODULES.map((m) => m.id);
                setCompletedModules(allIds);
                localStorage.setItem('ag_completed_modules', JSON.stringify(allIds));
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
        onRewardXp={(amt) => {
          setUserXp((prev) => {
            const next = prev + amt;
            localStorage.setItem('ag_user_xp', next.toString());
            return next;
          });
        }}
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
