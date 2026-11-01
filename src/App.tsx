import React, { useState, useEffect } from 'react';
import {
  Search,
  Sun,
  Moon,
  BookOpen,
  CheckCircle2,
  Circle,
  PanelRightClose,
  PanelRightOpen,
  Terminal,
  Shield,
  Cpu,
  FileSpreadsheet,
  Award,
  Globe,
  History,
  ArrowUpLeft,
  X,
  Database,
  Activity,
  Gamepad2,
  Sparkles,
  Compass,
  ChevronDown,
  LayoutGrid,
} from 'lucide-react';
import { ALL_CURRICULUM_MODULES } from './data/curriculumIndex';
import {
  NavigationActivityEvent,
  NAVIGATION_ACTIVITY_STORAGE_KEY,
  buildSeedNavigationActivityEvents,
  createSectionChangeEvent,
  appendSectionChangeEvent,
  parseActivityLogsFromStorage,
  serializeActivityLogsToStorage,
} from './utils/activityLogger';
import { NavigationActivityLoggerModal } from './components/NavigationActivityLoggerModal';
import {
  serializeRecentSessionSnapshot,
  resolveRecentSessionFromStorage,
  ResolvedRecentSessionDescriptor,
  buildMissionMilestoneNotification,
  MissionMilestonePayload,
} from './utils/generators';
import { LanguageProvider, useLanguage } from './context/LanguageContext';
import { ModuleContentView } from './components/ModuleContentView';
import {
  ScopedPdfExportModal,
  PrintableDocumentPayload,
} from './components/CodeAndPdfTools';
import { MissionControlSimulator } from './studios/MissionControlSimulator';
import { GuardrailAutomationStudio } from './studios/GuardrailAutomationStudio';
import {
  McpVisualStudio,
  CheatSheetsStudio,
  ArchitectScenarioLab,
} from './studios/McpCheatSheetScenarioStudios';
import {
  GlobalCommandSearchModal,
  GroundedAiArchitectCopilot,
} from './components/GlobalSearchAndAiCopilot';
import { AchievementsCertificationView } from './components/AchievementsCertificationView';
import { KnowledgeBaseExplorer } from './components/KnowledgeBaseExplorer';
import { MissionMilestoneOverlay } from './components/MissionMilestoneToast';
import { PWAInstallButton, OfflineIndicator } from './components/PWAInstallAndOffline';
import { PomodoroHeaderWidget } from './components/PomodoroHeaderWidget';
import { Antigravity3DGame } from './components/Antigravity3DGame';

type ActiveWorkspaceSection =
  | 'curriculum'
  | 'achievements'
  | 'simulator'
  | 'guardrails'
  | 'mcp'
  | 'cheatsheets'
  | 'scenarios'
  | 'ai-architect'
  | 'knowledge-base'
  | 'game-3d';

function MainWorkspace() {
  const { language, toggleLanguage, isRTL, t } = useLanguage();
  const [darkMode, setDarkMode] = useState<boolean>(true);
  const [activeSection, setActiveSection] = useState<ActiveWorkspaceSection>('curriculum');
  const [activeModuleId, setActiveModuleId] = useState<string>(ALL_CURRICULUM_MODULES[0].id);
  const [completedModules, setCompletedModules] = useState<string[]>([
    'module-1',
    'module-2',
  ]);
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(true);
  const [megaMenuOpen, setMegaMenuOpen] = useState<boolean>(false);
  const [searchModalOpen, setSearchModalOpen] = useState<boolean>(false);
  const [pdfPayload, setPdfPayload] = useState<PrintableDocumentPayload | null>(null);

  // Resume Recent Session Modal State
  const [detectedSession, setDetectedSession] = useState<ResolvedRecentSessionDescriptor | null>(null);
  const [resumeModalOpen, setResumeModalOpen] = useState<boolean>(false);
  const [sessionTrackingReady, setSessionTrackingReady] = useState<boolean>(false);
  const [activeMilestone, setActiveMilestone] = useState<MissionMilestonePayload | null>(null);

  // Browser-Based Navigation Activity Logger State ('section_change' events)
  const [activityLogs, setActivityLogs] = useState<NavigationActivityEvent[]>(() => {
    const moduleSummaries = ALL_CURRICULUM_MODULES.map((m) => ({
      id: m.id,
      number: m.number,
      titleFa: m.titleFa,
      titleEn: m.titleEn,
    }));
    try {
      const raw = window.localStorage.getItem(NAVIGATION_ACTIVITY_STORAGE_KEY);
      if (!raw) {
        const seeded = buildSeedNavigationActivityEvents(moduleSummaries);
        window.localStorage.setItem(
          NAVIGATION_ACTIVITY_STORAGE_KEY,
          serializeActivityLogsToStorage(seeded)
        );
        return seeded;
      }
      return parseActivityLogsFromStorage(raw);
    } catch {
      return buildSeedNavigationActivityEvents(moduleSummaries);
    }
  });
  const [activityModalOpen, setActivityModalOpen] = useState<boolean>(false);
  const previousSectionRef = React.useRef<ActiveWorkspaceSection | null>(null);

  // Detect last accessed module or studio from localStorage on startup
  useEffect(() => {
    try {
      const searchParams = new URLSearchParams(window.location.search);
      const requestedSection = searchParams.get('section');
      const hasSharedCardQuery =
        requestedSection === 'achievements' ||
        Boolean(searchParams.get('cardId')) ||
        Boolean(searchParams.get('cert'));

      if (hasSharedCardQuery) {
        setActiveSection('achievements');
        setResumeModalOpen(false);
        setSessionTrackingReady(true);
        return;
      }

      if (requestedSection === 'knowledge-base') {
        setActiveSection('knowledge-base');
        setResumeModalOpen(false);
        setSessionTrackingReady(true);
        return;
      }

      if (
        requestedSection === 'game-3d' ||
        searchParams.get('game') === '1'
      ) {
        setActiveSection('game-3d');
        setResumeModalOpen(false);
        setSessionTrackingReady(true);
        return;
      }

      if (requestedSection === 'ai-architect') {
        setActiveSection('ai-architect');
        setResumeModalOpen(false);
        setSessionTrackingReady(true);
        return;
      }

      const moduleSummaries = ALL_CURRICULUM_MODULES.map((m) => ({
        id: m.id,
        number: m.number,
        titleFa: m.titleFa,
        titleEn: m.titleEn,
      }));
      let rawSession = window.localStorage.getItem('ag_recent_session_v1');
      const rawUserState = window.localStorage.getItem('ag_knowledge_base_user_state_v1');

      if (!rawSession && !rawUserState) {
        const seeded = serializeRecentSessionSnapshot({
          version: '1.0',
          lastAccessedSection: 'curriculum',
          lastAccessedModuleId: 'module-2',
          completedModules: ['module-1', 'module-2'],
          updatedAtIso: '2026-10-28T08:50:00.000Z',
        });
        window.localStorage.setItem('ag_recent_session_v1', seeded);
        rawSession = seeded;
      }

      const resolved = resolveRecentSessionFromStorage(
        rawSession,
        rawUserState,
        moduleSummaries
      );
      if (resolved) {
        setDetectedSession(resolved);
        if (searchParams.get('resume') === '1' && searchParams.get('autostart') !== '1') {
          setResumeModalOpen(true);
        }
      }
    } catch {
      // Ignore storage access errors
    } finally {
      setSessionTrackingReady(true);
    }
  }, []);

  // Persist current module/studio progress to localStorage when user navigates after startup modal is closed
  useEffect(() => {
    if (!sessionTrackingReady || resumeModalOpen) return;
    try {
      const snapshot = serializeRecentSessionSnapshot({
        version: '1.0',
        lastAccessedSection: activeSection,
        lastAccessedModuleId: activeModuleId,
        completedModules,
        updatedAtIso: new Date().toISOString(),
      });
      window.localStorage.setItem('ag_recent_session_v1', snapshot);
      const moduleSummaries = ALL_CURRICULUM_MODULES.map((m) => ({
        id: m.id,
        number: m.number,
        titleFa: m.titleFa,
        titleEn: m.titleEn,
      }));
      const updatedResolved = resolveRecentSessionFromStorage(
        snapshot,
        null,
        moduleSummaries
      );
      if (updatedResolved) {
        setDetectedSession(updatedResolved);
      }
    } catch {
      // Ignore storage access errors
    }
  }, [activeSection, activeModuleId, completedModules, sessionTrackingReady, resumeModalOpen]);

  // Lightweight Event Tracker: log 'section_change' events to browser-based activity logger
  useEffect(() => {
    if (!sessionTrackingReady) return;
    const moduleSummaries = ALL_CURRICULUM_MODULES.map((m) => ({
      id: m.id,
      number: m.number,
      titleFa: m.titleFa,
      titleEn: m.titleEn,
    }));

    const newEvent = createSectionChangeEvent({
      fromSection: previousSectionRef.current,
      toSection: activeSection,
      moduleId: activeSection === 'curriculum' ? activeModuleId : undefined,
      modules: moduleSummaries,
    });

    previousSectionRef.current = activeSection;

    setActivityLogs((prev) => {
      const nextLogs = appendSectionChangeEvent(prev, newEvent);
      try {
        window.localStorage.setItem(
          NAVIGATION_ACTIVITY_STORAGE_KEY,
          serializeActivityLogsToStorage(nextLogs)
        );
      } catch {
        // Ignore storage write errors
      }
      return nextLogs;
    });
  }, [activeSection, activeModuleId, sessionTrackingReady]);

  const handleClearActivityHistory = () => {
    setActivityLogs([]);
    try {
      window.localStorage.removeItem(NAVIGATION_ACTIVITY_STORAGE_KEY);
    } catch {
      // Ignore storage remove errors
    }
  };

  const handleJumpToRecentSession = () => {
    if (!detectedSession) {
      setResumeModalOpen(false);
      return;
    }
    setActiveSection(detectedSession.section);
    setActiveModuleId(detectedSession.moduleId);
    if (detectedSession.completedModules.length > 0) {
      setCompletedModules(detectedSession.completedModules);
    }
    setResumeModalOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    const rootEl = document.documentElement;
    if (darkMode) {
      rootEl.classList.add('dark');
    } else {
      rootEl.classList.remove('dark');
    }
  }, [darkMode]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchModalOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleToggleModuleComplete = (modId: string) => {
    const isAlreadyCompleted = completedModules.includes(modId);
    if (isAlreadyCompleted) {
      setCompletedModules((prev) => prev.filter((id) => id !== modId));
      return;
    }

    const nextCompleted = [...completedModules, modId];
    setCompletedModules(nextCompleted);

    const targetMod = ALL_CURRICULUM_MODULES.find((m) => m.id === modId);
    if (targetMod) {
      const milestonePayload = buildMissionMilestoneNotification({
        moduleId: targetMod.id,
        moduleNumber: targetMod.number,
        moduleTitleFa: targetMod.titleFa,
        moduleTitleEn: targetMod.titleEn,
        completedModules,
        totalModules: ALL_CURRICULUM_MODULES.length,
      });
      setActiveMilestone(milestonePayload);
    }
  };

  const handleCompleteAllModules = () => {
    const allIds = ALL_CURRICULUM_MODULES.map((m) => m.id);
    setCompletedModules(allIds);
    const finalMod = ALL_CURRICULUM_MODULES[ALL_CURRICULUM_MODULES.length - 1];
    if (finalMod) {
      const milestonePayload = buildMissionMilestoneNotification({
        moduleId: finalMod.id,
        moduleNumber: finalMod.number,
        moduleTitleFa: finalMod.titleFa,
        moduleTitleEn: finalMod.titleEn,
        completedModules: allIds,
        totalModules: ALL_CURRICULUM_MODULES.length,
      });
      setActiveMilestone(milestonePayload);
    }
  };

  const currentModule =
    ALL_CURRICULUM_MODULES.find((m) => m.id === activeModuleId) ||
    ALL_CURRICULUM_MODULES[0];

  const completionPercent = Math.round(
    (completedModules.length / ALL_CURRICULUM_MODULES.length) * 100
  );

  // Full-Viewport Game Shell Mode: when in 3D Cyber Arena ('game-3d'), render only the 100vw x 100vh WebGL Game Shell without website chrome
  if (activeSection === 'game-3d') {
    return (
      <Antigravity3DGame
        onExitToAcademy={() => setActiveSection('curriculum')}
      />
    );
  }

  return (
    <div
      id="top"
      dir={isRTL ? 'rtl' : 'ltr'}
      className="min-h-screen flex flex-col bg-[#f8fafc] dark:bg-[#090d16] text-slate-900 dark:text-slate-100 transition-colors"
    >
      {/* Single-Row Ultra-Clean Architectural Header + Categorized Workspace Mega-Menu */}
      <header className="sticky top-0 z-30 border-b border-slate-200/80 dark:border-white/[0.08] bg-white/95 dark:bg-[#090d16]/95 backdrop-blur-xl transition-colors">
        <div className="h-16 px-4 sm:px-6 max-w-[1600px] mx-auto flex items-center justify-between gap-2 sm:gap-4">
          {/* Zone 1: Brand Identity & Chapter Drawer Toggle */}
          <div className="flex items-center gap-2 sm:gap-2.5 min-w-0 shrink-0">
            {activeSection === 'curriculum' && (
              <>
                <button
                  type="button"
                  onClick={() => setSidebarOpen((prev) => !prev)}
                  className={`h-9 px-2.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                    sidebarOpen
                      ? 'border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-blue-400'
                      : 'border-slate-200/80 dark:border-white/[0.08] bg-slate-100/70 dark:bg-[#0c121e] text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                  }`}
                  aria-label="Toggle Curriculum Sidebar"
                  title={t('sidebarToggle')}
                >
                  {sidebarOpen ? (
                    <PanelRightClose className="w-4 h-4 text-blue-500 shrink-0" />
                  ) : (
                    <PanelRightOpen className="w-4 h-4 text-slate-400 shrink-0" />
                  )}
                  <span className="hidden 2xl:inline">{t('sidebarToggle')}</span>
                </button>
                <span
                  className="hidden sm:block h-5 w-px bg-slate-200 dark:bg-white/[0.08] shrink-0"
                  aria-hidden="true"
                />
              </>
            )}

            <a
              href="#top"
              onClick={(e) => {
                e.preventDefault();
                setActiveSection('curriculum');
                setMegaMenuOpen(false);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="flex items-center gap-2.5 group focus:outline-none min-w-0"
            >
              <span className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white font-mono text-xs font-black tracking-tighter flex items-center justify-center shadow-xs group-hover:from-blue-500 group-hover:to-indigo-500 transition-all shrink-0">
                AG
              </span>
              <div className="hidden lg:flex flex-col min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-extrabold tracking-tight text-slate-900 dark:text-white whitespace-nowrap">
                    {language === 'en' ? 'Antigravity Academy' : 'آکادمی Antigravity'}
                  </span>
                  <span
                    dir="ltr"
                    className="ltr-inline hidden 2xl:inline-flex items-center px-1.5 py-0.5 rounded border border-blue-500/20 bg-blue-500/[0.08] text-[10px] font-mono font-bold text-blue-600 dark:text-blue-400 shrink-0"
                  >
                    v2.4
                  </span>
                </div>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 truncate">
                  {language === 'en'
                    ? 'Agent-First Engineering'
                    : 'مهندسی سیستم‌های ایجنت‌محور'}
                </span>
              </div>
            </a>
          </div>

          {/* Zone 2: Focused 4-Pillar Segmented Bar + Categorized Mega-Menu Trigger */}
          <nav
            aria-label="Primary Workspace Navigation"
            className="flex items-center gap-1 p-1 rounded-xl border border-slate-200/80 dark:border-white/[0.08] bg-slate-100/80 dark:bg-[#0c121e] overflow-x-auto no-scrollbar shrink-0"
          >
            {/* Pillar 1: Curriculum Academy (8 Modules) */}
            <button
              type="button"
              onClick={() => {
                setActiveSection('curriculum');
                setMegaMenuOpen(false);
              }}
              className={`h-8 px-2.5 sm:px-3 rounded-lg text-xs flex items-center gap-1.5 transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                activeSection === 'curriculum'
                  ? 'bg-white dark:bg-blue-600 text-slate-950 dark:text-white font-bold shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 font-medium hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5 shrink-0" />
              <span>{language === 'en' ? 'Academy' : 'آکادمی'}</span>
              <span
                dir="ltr"
                className={`ltr-inline px-1.5 py-0.2 rounded text-[10px] font-mono font-bold ${
                  activeSection === 'curriculum'
                    ? 'bg-blue-500/15 dark:bg-white/20 text-blue-600 dark:text-white'
                    : 'bg-slate-200/80 dark:bg-white/[0.06] text-slate-500 dark:text-slate-400'
                }`}
              >
                8
              </span>
            </button>

            {/* Pillar 2: Engineering Studios Group */}
            <button
              type="button"
              onClick={() => {
                if (
                  !['simulator', 'guardrails', 'mcp', 'scenarios'].includes(
                    activeSection
                  )
                ) {
                  setActiveSection('simulator');
                }
                setMegaMenuOpen(false);
              }}
              className={`h-8 px-2.5 sm:px-3 rounded-lg text-xs flex items-center gap-1.5 transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                ['simulator', 'guardrails', 'mcp', 'scenarios'].includes(
                  activeSection
                )
                  ? 'bg-white dark:bg-blue-600 text-slate-950 dark:text-white font-bold shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 font-medium hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Terminal className="w-3.5 h-3.5 shrink-0" />
              <span>{language === 'en' ? 'Studios' : 'استودیوها'}</span>
              <span
                dir="ltr"
                className={`ltr-inline hidden sm:inline-block px-1.5 py-0.2 rounded text-[10px] font-mono font-bold ${
                  ['simulator', 'guardrails', 'mcp', 'scenarios'].includes(
                    activeSection
                  )
                    ? 'bg-blue-500/15 dark:bg-white/20 text-blue-600 dark:text-white'
                    : 'bg-slate-200/80 dark:bg-white/[0.06] text-slate-500 dark:text-slate-400'
                }`}
              >
                4
              </span>
            </button>

            {/* Pillar 3: Knowledge Base, AI & Reference Group */}
            <button
              type="button"
              onClick={() => {
                if (
                  !['knowledge-base', 'ai-architect', 'cheatsheets'].includes(
                    activeSection
                  )
                ) {
                  setActiveSection('knowledge-base');
                }
                setMegaMenuOpen(false);
              }}
              className={`hidden sm:flex h-8 px-2.5 sm:px-3 rounded-lg text-xs items-center gap-1.5 transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                ['knowledge-base', 'ai-architect', 'cheatsheets'].includes(
                  activeSection
                )
                  ? 'bg-white dark:bg-blue-600 text-slate-950 dark:text-white font-bold shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 font-medium hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Database className="w-3.5 h-3.5 shrink-0" />
              <span>
                {language === 'en' ? 'Knowledge & AI' : 'دانش و هوش مصنوعی'}
              </span>
            </button>

            {/* Pillar 4: Achievements & Certificate */}
            <button
              type="button"
              onClick={() => {
                setActiveSection('achievements');
                setMegaMenuOpen(false);
              }}
              data-testid="nav-tab-achievements"
              className={`hidden md:flex h-8 px-2.5 sm:px-3 rounded-lg text-xs items-center gap-1.5 transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                activeSection === 'achievements'
                  ? 'bg-white dark:bg-blue-600 text-slate-950 dark:text-white font-bold shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 font-medium hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Award className="w-3.5 h-3.5 shrink-0" />
              <span>{language === 'en' ? 'Mastery' : 'کارنامه'}</span>
              <span
                dir="ltr"
                className={`ltr-inline px-1.5 py-0.2 rounded text-[10px] font-mono font-bold tabular-nums ${
                  activeSection === 'achievements'
                    ? 'bg-emerald-500/20 text-emerald-700 dark:text-white'
                    : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                }`}
              >
                {completedModules.length}/8
              </span>
            </button>

            <span
              className="h-4 w-px bg-slate-200 dark:bg-white/[0.08] mx-0.5 shrink-0"
              aria-hidden="true"
            />

            {/* Categorized Mega-Menu Trigger ("منوی جامع بخش‌ها") */}
            <button
              type="button"
              onClick={() => setMegaMenuOpen((prev) => !prev)}
              data-testid="open-mega-menu-btn"
              aria-expanded={megaMenuOpen}
              className={`h-8 px-2.5 sm:px-3 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                megaMenuOpen
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-300 border border-indigo-500/25'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5 shrink-0" />
              <span>
                {language === 'en' ? 'All Sections' : 'منوی جامع'}
              </span>
              <ChevronDown
                className={`w-3.5 h-3.5 transition-transform duration-200 shrink-0 ${
                  megaMenuOpen ? 'rotate-180' : ''
                }`}
              />
            </button>
          </nav>

          {/* Zone 3: Command Search Trigger & Minimal System Control Pill */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Compact Command Search Button (Ctrl+K) */}
            <button
              type="button"
              onClick={() => setSearchModalOpen(true)}
              className="h-9 px-2.5 sm:px-3 rounded-xl border border-slate-200/90 dark:border-white/[0.08] bg-slate-100/75 dark:bg-[#0c121e] hover:border-blue-500/40 transition-all flex items-center gap-2 cursor-pointer group shrink-0"
              title={
                language === 'en'
                  ? 'Quick Search (Ctrl+K)'
                  : 'جستجوی سریع (Ctrl+K)'
              }
            >
              <Search className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-500 transition-colors shrink-0" />
              <span className="hidden lg:inline text-xs text-slate-500 dark:text-slate-400 group-hover:text-slate-800 dark:group-hover:text-slate-200">
                {language === 'en' ? 'Quick Search' : 'جستجوی سریع'}
              </span>
              <kbd
                dir="ltr"
                className="ltr-inline hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono font-semibold text-slate-500 dark:text-slate-400 bg-white dark:bg-[#090d16] border border-slate-200/80 dark:border-white/[0.08] rounded shrink-0"
              >
                Ctrl+K
              </kbd>
            </button>

            {/* Pomodoro Deep Work Timer */}
            <div className="hidden xl:block">
              <PomodoroHeaderWidget
                currentModule={currentModule}
                onStudyMinutesLogged={(minutes, modId) => {
                  try {
                    const nowIso = new Date().toISOString();
                    window.localStorage.setItem(
                      'ag_last_deep_work_logged_v1',
                      JSON.stringify({
                        moduleId: modId,
                        minutes,
                        loggedAtIso: nowIso,
                      })
                    );
                  } catch {
                    // Ignore storage error
                  }
                }}
              />
            </div>

            {/* Minimal System Utility Pill */}
            <div className="h-9 px-1.5 rounded-xl border border-slate-200/80 dark:border-white/[0.08] bg-slate-100/75 dark:bg-[#0c121e] flex items-center gap-0.5 shrink-0">
              {detectedSession && (
                <button
                  type="button"
                  onClick={() => setResumeModalOpen(true)}
                  data-testid="open-resume-modal-btn"
                  className="h-7 inline-flex items-center gap-1 px-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-white dark:hover:bg-white/[0.08] text-xs font-medium transition-colors cursor-pointer whitespace-nowrap"
                  title={t('resumeSession')}
                >
                  <History className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                </button>
              )}

              <button
                type="button"
                onClick={() => setActivityModalOpen(true)}
                data-testid="open-activity-logger-btn"
                aria-label={
                  language === 'en'
                    ? `Open Navigation History (${activityLogs.length} events)`
                    : `مشاهده تاریخچه ناوبری (${activityLogs.length} رویداد)`
                }
                title={
                  language === 'en'
                    ? `Navigation History (${activityLogs.length})`
                    : `تاریخچه ناوبری (${activityLogs.length})`
                }
                className="h-7 inline-flex items-center gap-1 px-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white dark:hover:bg-white/[0.08] text-xs font-medium transition-colors cursor-pointer whitespace-nowrap"
              >
                <Activity className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                <span
                  dir="ltr"
                  data-testid="activity-logger-badge-count"
                  className="ltr-inline text-[11px] font-mono font-semibold text-slate-600 dark:text-slate-300 tabular-nums"
                >
                  {activityLogs.length}
                </span>
              </button>

              <PWAInstallButton />

              <span
                className="h-3.5 w-px bg-slate-200/90 dark:bg-white/[0.08] mx-0.5 shrink-0"
                aria-hidden="true"
              />

              <button
                type="button"
                onClick={toggleLanguage}
                data-testid="language-toggle-btn"
                title={t('langSwitchLabel')}
                aria-label={
                  language === 'fa'
                    ? 'Switch interface to English'
                    : 'تغییر رابط کاربری به فارسی'
                }
                className="h-7 px-1.5 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-300 flex items-center gap-1 cursor-pointer hover:bg-white dark:hover:bg-white/[0.08] transition-colors whitespace-nowrap"
              >
                <Globe className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="font-mono text-[11px]">{t('langSwitchBadge')}</span>
              </button>

              <button
                type="button"
                onClick={() => setDarkMode((prev) => !prev)}
                className="h-7 w-7 rounded-lg inline-flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-white/[0.08] transition-colors cursor-pointer shrink-0"
                aria-label="Toggle Dark or Light Mode"
                title={darkMode ? t('themeLight') : t('themeDark')}
              >
                {darkMode ? (
                  <Sun className="w-3.5 h-3.5 text-amber-400" />
                ) : (
                  <Moon className="w-3.5 h-3.5 text-slate-600" />
                )}
                <span className="sr-only">
                  {darkMode ? t('themeLight') : t('themeDark')}
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Categorized 3-Column Workspace Mega-Menu Drawer (Always Mounted in DOM for Instant Access & Testability) */}
        <div
          aria-hidden={!megaMenuOpen}
          className={`border-t border-slate-200/80 dark:border-white/[0.08] bg-white/98 dark:bg-[#0b101b]/98 backdrop-blur-2xl shadow-2xl transition-all duration-200 overflow-hidden ${
            megaMenuOpen
              ? 'max-h-[680px] opacity-100 visible py-5'
              : 'max-h-0 opacity-0 invisible py-0 pointer-events-none'
          }`}
        >
          <div className="px-4 sm:px-6 max-w-6xl mx-auto space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200/70 dark:border-white/[0.06] pb-3">
              <div>
                <h2 className="text-sm font-extrabold text-slate-900 dark:text-white">
                  {language === 'en'
                    ? 'Google Antigravity Workspace Directory'
                    : 'راهنمای جامع محیط‌های کاری و آزمایشگاه‌های Antigravity'}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {language === 'en'
                    ? 'Select any learning track, interactive engineering studio, or AI reference tool below:'
                    : 'برای جلوگیری از شلوغی صفحه، تمام ابزارها در ۳ دسته تخصصی زیر با توضیح کاربرد هر بخش سازمان‌دهی شده‌اند:'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setMegaMenuOpen(false)}
                className="h-8 px-2.5 rounded-lg border border-slate-200 dark:border-white/10 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-white flex items-center gap-1 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
                <span>{language === 'en' ? 'Close' : 'بستن منو'}</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Column 1: Interactive Engineering Studios */}
              <div className="rounded-xl border border-slate-200/80 dark:border-white/[0.07] bg-slate-50/70 dark:bg-[#0f1624] p-3.5 space-y-2">
                <div className="px-2 py-1 text-[11px] font-extrabold uppercase tracking-wider text-blue-600 dark:text-blue-400 flex items-center justify-between">
                  <span>
                    {language === 'en'
                      ? '1. Interactive Engineering Studios'
                      : '۱. استودیوها و شبیه‌سازهای عملی'}
                  </span>
                  <span dir="ltr" className="ltr-inline font-mono text-[10px]">
                    4 LABS
                  </span>
                </div>

                {[
                  {
                    id: 'simulator' as const,
                    title:
                      language === 'en'
                        ? 'Mission Control Simulator'
                        : 'شبیه‌ساز Mission Control',
                    desc:
                      language === 'en'
                        ? 'Live Editor View, Agent Manager & terminal policy sandbox'
                        : 'شبیه‌سازی زنده محیط دوگانه Editor View و مدیریت ایجنت‌ها',
                    icon: Terminal,
                  },
                  {
                    id: 'guardrails' as const,
                    title:
                      language === 'en'
                        ? 'Rule & Workflow Studio'
                        : 'مهندسی Rule و Workflow',
                    desc:
                      language === 'en'
                        ? 'Build .agent/rules/*.md & slash-command workflows'
                        : 'طراحی قوانین ۴ حالته .agent/rules و اتوماسیون // turbo',
                    icon: Shield,
                  },
                  {
                    id: 'mcp' as const,
                    title:
                      language === 'en'
                        ? 'FastMCP Visual Studio'
                        : 'استودیو بصری FastMCP',
                    desc:
                      language === 'en'
                        ? 'Configure mcp_config.json & Python FastMCP tools'
                        : 'تولید زنده mcp_config.json و سرورهای پایتون FastMCP',
                    icon: Cpu,
                  },
                  {
                    id: 'scenarios' as const,
                    title:
                      language === 'en'
                        ? 'Architecture Scenario Lab'
                        : 'آزمایشگاه سناریوهای معماری',
                    desc:
                      language === 'en'
                        ? '8 real-world production engineering challenges'
                        : '۸ چالش تصمیم‌گیری واقعی برای معماران سیستم‌های ایجنتی',
                    icon: Compass,
                    testId: 'nav-tab-scenarios',
                  },
                ].map((item) => {
                  const IconComp = item.icon;
                  const active = activeSection === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      data-testid={item.testId}
                      onClick={() => {
                        setActiveSection(item.id);
                        setMegaMenuOpen(false);
                      }}
                      className={`w-full ${
                        isRTL ? 'text-right' : 'text-left'
                      } p-2.5 rounded-lg transition-all flex items-start gap-2.5 cursor-pointer ${
                        active
                          ? 'bg-blue-600/10 dark:bg-blue-500/15 border border-blue-500/30 text-blue-600 dark:text-blue-400'
                          : 'hover:bg-white dark:hover:bg-white/[0.05] border border-transparent text-slate-800 dark:text-slate-200'
                      }`}
                    >
                      <span className="p-2 rounded-lg bg-blue-500/10 text-blue-500 shrink-0 mt-0.5">
                        <IconComp className="w-4 h-4" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-xs font-bold truncate">
                          {item.title}
                        </span>
                        <span className="block text-[11px] text-slate-500 dark:text-slate-400 leading-4 mt-0.5">
                          {item.desc}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Column 2: Knowledge Base, AI Copilot & Reference Cheat Sheets */}
              <div className="rounded-xl border border-slate-200/80 dark:border-white/[0.07] bg-slate-50/70 dark:bg-[#0f1624] p-3.5 space-y-2">
                <div className="px-2 py-1 text-[11px] font-extrabold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 flex items-center justify-between">
                  <span>
                    {language === 'en'
                      ? '2. Knowledge, AI & Reference'
                      : '۲. پایگاه دانش، هوش مصنوعی و مراجع'}
                  </span>
                  <span dir="ltr" className="ltr-inline font-mono text-[10px]">
                    3 TOOLS
                  </span>
                </div>

                {[
                  {
                    id: 'knowledge-base' as const,
                    title:
                      language === 'en'
                        ? 'Knowledge Base & Context Rot'
                        : 'پایگاه دانش و جلوگیری از Context Rot',
                    desc:
                      language === 'en'
                        ? 'Inspect agent memory, D3 heatmaps & context hygiene'
                        : 'مدیریت حافظه پایدار ایجنت، گراف تگ‌ها و هرس کانتکست',
                    icon: Database,
                    testId: 'nav-tab-knowledge-base',
                  },
                  {
                    id: 'ai-architect' as const,
                    title:
                      language === 'en'
                        ? 'AI Architect & Live Docs'
                        : 'دستیار هوشمند و کاوشگر مستندات',
                    desc:
                      language === 'en'
                        ? 'Search grounding, quiz challenges & doc synthesis'
                        : 'جستجوی هوشمند در مستندات رسمی و آزمون‌های تعاملی',
                    icon: Sparkles,
                    testId: 'nav-tab-ai-architect',
                  },
                  {
                    id: 'cheatsheets' as const,
                    title:
                      language === 'en'
                        ? 'Reference Cheat Sheets & PDF'
                        : 'مرکز چیت‌شیت‌ها و خروجی PDF',
                    desc:
                      language === 'en'
                        ? 'Printable tables of shortcuts, policies & CLI flags'
                        : 'جداول مرجع شورتکات‌ها، دستورات و خروجی PDF ماژولار',
                    icon: FileSpreadsheet,
                  },
                ].map((item) => {
                  const IconComp = item.icon;
                  const active = activeSection === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      data-testid={item.testId}
                      onClick={() => {
                        setActiveSection(item.id);
                        setMegaMenuOpen(false);
                      }}
                      className={`w-full ${
                        isRTL ? 'text-right' : 'text-left'
                      } p-2.5 rounded-lg transition-all flex items-start gap-2.5 cursor-pointer ${
                        active
                          ? 'bg-indigo-600/10 dark:bg-indigo-500/15 border border-indigo-500/30 text-indigo-600 dark:text-indigo-300'
                          : 'hover:bg-white dark:hover:bg-white/[0.05] border border-transparent text-slate-800 dark:text-slate-200'
                      }`}
                    >
                      <span className="p-2 rounded-lg bg-indigo-500/10 text-indigo-500 shrink-0 mt-0.5">
                        <IconComp className="w-4 h-4" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-xs font-bold truncate">
                          {item.title}
                        </span>
                        <span className="block text-[11px] text-slate-500 dark:text-slate-400 leading-4 mt-0.5">
                          {item.desc}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Column 3: Curriculum Academy, Mastery Certification & 3D Cyber Arena */}
              <div className="rounded-xl border border-slate-200/80 dark:border-white/[0.07] bg-slate-50/70 dark:bg-[#0f1624] p-3.5 space-y-2 flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="px-2 py-1 text-[11px] font-extrabold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center justify-between">
                    <span>
                      {language === 'en'
                        ? '3. Academy, Mastery & 3D Sim'
                        : '۳. آموزش، گواهینامه و شبیه‌ساز سه‌بعدی'}
                    </span>
                    <span dir="ltr" className="ltr-inline font-mono text-[10px]">
                      {completionPercent}% DONE
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setActiveSection('curriculum');
                      setMegaMenuOpen(false);
                    }}
                    className={`w-full ${
                      isRTL ? 'text-right' : 'text-left'
                    } p-2.5 rounded-lg transition-all flex items-start gap-2.5 cursor-pointer ${
                      activeSection === 'curriculum'
                        ? 'bg-emerald-600/10 dark:bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-300'
                        : 'hover:bg-white dark:hover:bg-white/[0.05] border border-transparent text-slate-800 dark:text-slate-200'
                    }`}
                  >
                    <span className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500 shrink-0 mt-0.5">
                      <BookOpen className="w-4 h-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-xs font-bold truncate">
                        {language === 'en'
                          ? '8-Chapter Engineering Curriculum'
                          : 'دوره جامع ۸ فصلی مهندسی Antigravity'}
                      </span>
                      <span className="block text-[11px] text-slate-500 dark:text-slate-400 leading-4 mt-0.5">
                        {language === 'en'
                          ? 'Step-by-step mastery from Editor View to Multi-Agent'
                          : 'آموزش گام‌به‌گام از معماری هسته تا ارکستریشن چندایجنتی'}
                      </span>
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setActiveSection('achievements');
                      setMegaMenuOpen(false);
                    }}
                    className={`w-full ${
                      isRTL ? 'text-right' : 'text-left'
                    } p-2.5 rounded-lg transition-all flex items-start gap-2.5 cursor-pointer ${
                      activeSection === 'achievements'
                        ? 'bg-emerald-600/10 dark:bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-300'
                        : 'hover:bg-white dark:hover:bg-white/[0.05] border border-transparent text-slate-800 dark:text-slate-200'
                    }`}
                  >
                    <span className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500 shrink-0 mt-0.5">
                      <Award className="w-4 h-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-xs font-bold truncate">
                        {language === 'en'
                          ? 'Achievements & Official Certificate'
                          : 'کارنامه، نشان‌های مهارت و گواهینامه'}
                      </span>
                      <span className="block text-[11px] text-slate-500 dark:text-slate-400 leading-4 mt-0.5">
                        {language === 'en'
                          ? `${completedModules.length} of 8 modules completed (${completionPercent}%)`
                          : `${completedModules.length} فصل از ۸ فصل تکمیل شده (${completionPercent}٪)`}
                      </span>
                    </span>
                  </button>

                  <button
                    type="button"
                    data-testid="nav-tab-game-3d"
                    onClick={() => {
                      setActiveSection('game-3d');
                      setMegaMenuOpen(false);
                    }}
                    className={`w-full ${
                      isRTL ? 'text-right' : 'text-left'
                    } p-2.5 rounded-lg border border-amber-500/25 bg-amber-500/[0.07] hover:bg-amber-500/15 transition-all flex items-start gap-2.5 cursor-pointer text-amber-800 dark:text-amber-200`}
                  >
                    <span className="p-2 rounded-lg bg-amber-500/20 text-amber-500 shrink-0 mt-0.5">
                      <Gamepad2 className="w-4 h-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-xs font-bold truncate">
                        {language === 'en'
                          ? '3D Cyber-Defense Arena (WebGL)'
                          : 'میدان نبرد سه‌بعدی Antigravity (WebGL)'}
                      </span>
                      <span className="block text-[11px] text-amber-700/80 dark:text-amber-300/80 leading-4 mt-0.5">
                        {language === 'en'
                          ? 'Interactive 3D simulation against Context Rot waves'
                          : 'شبیه‌ساز تعاملی سه‌بعدی دفاع از کانتکست در برابر باگ‌ها'}
                      </span>
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Fluid Widescreen Workspace Grid */}
      <div className="flex-1 flex overflow-hidden">
        {/* Focused 3-Phase Curriculum Sidebar (Only shown in Academy view so Studios remain clutter-free) */}
        {activeSection === 'curriculum' && sidebarOpen && (
          <aside
            aria-label="Curriculum Modules Navigation"
            className={`w-64 lg:w-72 shrink-0 ${
              isRTL ? 'border-l' : 'border-r'
            } border-slate-200/80 dark:border-white/[0.07] bg-white dark:bg-[#0b101b] p-4 overflow-y-auto flex flex-col justify-between gap-6 hidden md:flex`}
          >
            <div className="space-y-5">
              {/* Mastery Progress Header Card */}
              <div className="p-3 rounded-xl border border-slate-200/80 dark:border-white/[0.07] bg-slate-50/80 dark:bg-[#0f1624] space-y-2">
                <div className="flex items-center justify-between text-[11px] font-bold text-slate-600 dark:text-slate-300">
                  <span>{t('sidebarTitle')}</span>
                  <span
                    dir="ltr"
                    className="ltr-inline font-mono text-emerald-600 dark:text-emerald-400 tabular-nums"
                  >
                    {completedModules.length}/8 ({completionPercent}%)
                  </span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-slate-200/80 dark:bg-white/[0.06] overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 transition-all duration-300"
                    style={{ width: `${completionPercent}%` }}
                  />
                </div>
              </div>

              {/* 8 Curriculum Modules Grouped into 3 Logical Learning Phases */}
              {[
                {
                  phaseTitle:
                    language === 'en'
                      ? 'Phase 1 · Core Architecture'
                      : 'گام اول · معماری هسته و اجرا',
                  modules: ALL_CURRICULUM_MODULES.slice(0, 3),
                },
                {
                  phaseTitle:
                    language === 'en'
                      ? 'Phase 2 · Context & Automation'
                      : 'گام دوم · قوانین و اتوماسیون',
                  modules: ALL_CURRICULUM_MODULES.slice(3, 6),
                },
                {
                  phaseTitle:
                    language === 'en'
                      ? 'Phase 3 · Scale & Multi-Agent'
                      : 'گام سوم · مقیاس‌پذیری و MCP',
                  modules: ALL_CURRICULUM_MODULES.slice(6, 8),
                },
              ].map((group) => (
                <div key={group.phaseTitle} className="space-y-1">
                  <div className="px-2 pb-1 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    {group.phaseTitle}
                  </div>
                  {group.modules.map((mod) => {
                    const isCurrent = activeModuleId === mod.id;
                    const isDone = completedModules.includes(mod.id);
                    const primaryTitle =
                      language === 'en' ? mod.titleEn : mod.titleFa;

                    return (
                      <button
                        key={mod.id}
                        type="button"
                        onClick={() => {
                          setActiveModuleId(mod.id);
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        className={`w-full ${
                          isRTL ? 'text-right' : 'text-left'
                        } px-2.5 py-2 rounded-lg transition-colors flex items-center gap-2.5 cursor-pointer group ${
                          isCurrent
                            ? 'bg-blue-600/10 dark:bg-blue-500/[0.14] text-blue-600 dark:text-blue-400 font-bold border border-blue-500/20'
                            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/[0.04] hover:text-slate-900 dark:hover:text-slate-200 border border-transparent'
                        }`}
                      >
                        <span
                          dir="ltr"
                          className={`ltr-inline text-[11px] font-mono tabular-nums shrink-0 ${
                            isCurrent
                              ? 'text-blue-600 dark:text-blue-400 font-bold'
                              : 'text-slate-400 dark:text-slate-500'
                          }`}
                        >
                          0{mod.number}
                        </span>
                        <span className="text-xs leading-5 truncate flex-1">
                          {primaryTitle}
                        </span>
                        {isDone ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                        ) : (
                          <Circle className="w-3.5 h-3.5 text-slate-300 dark:text-slate-700 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>

            {/* Clean Single Launcher Card Instead of 8 Duplicate Studio Links */}
            <div className="pt-3 border-t border-slate-200/70 dark:border-white/[0.06]">
              <button
                type="button"
                onClick={() => setMegaMenuOpen(true)}
                className="w-full p-3 rounded-xl border border-indigo-500/25 bg-indigo-500/[0.06] hover:bg-indigo-500/15 transition-all flex items-center justify-between gap-2 text-xs font-bold text-indigo-600 dark:text-indigo-300 cursor-pointer"
              >
                <span className="flex items-center gap-2 truncate">
                  <LayoutGrid className="w-4 h-4 shrink-0" />
                  <span className="truncate">
                    {language === 'en'
                      ? 'Open Studios & Tools Menu'
                      : 'مشاهده منوی استودیوها و ابزارها'}
                  </span>
                </span>
                <ArrowUpLeft className="w-3.5 h-3.5 shrink-0" />
              </button>
            </div>
          </aside>
        )}

        {/* Main Content Viewport — Spacious Editorial & Engineering Workbench + Global Architectural Footer */}
        <main className="flex-1 min-w-0 overflow-x-hidden overflow-y-auto flex flex-col justify-between">
          {activeSection === 'curriculum' && (
            <div className="md:hidden border-b border-slate-200/70 dark:border-white/[0.06] bg-white/80 dark:bg-[#0c121e]/80 px-3 py-2">
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 shrink-0 px-1">
                  {language === 'en' ? 'Chapters:' : 'فصل‌ها:'}
                </span>
                {ALL_CURRICULUM_MODULES.map((mod) => {
                  const isCurrent = activeModuleId === mod.id;
                  const isDone = completedModules.includes(mod.id);
                  return (
                    <button
                      key={mod.id}
                      type="button"
                      onClick={() => {
                        setActiveModuleId(mod.id);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className={`h-7 px-2.5 rounded-md text-xs font-mono flex items-center gap-1 transition-colors shrink-0 cursor-pointer ${
                        isCurrent
                          ? 'bg-blue-600 text-white font-bold'
                          : isDone
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25'
                          : 'bg-slate-100 dark:bg-white/[0.05] text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      <span dir="ltr" className="ltr-inline">
                        0{mod.number}
                      </span>
                      {isDone && !isCurrent && (
                        <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Contextual Sub-Bar ONLY When Inside Interactive Studios or Reference Tools */}
          {['simulator', 'guardrails', 'mcp', 'scenarios'].includes(
            activeSection
          ) && (
            <div className="border-b border-slate-200/70 dark:border-white/[0.06] bg-white/70 dark:bg-[#0c121e]/70 px-4 sm:px-8 py-2.5">
              <div className="max-w-5xl mx-auto flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                  <span className="text-[11px] font-extrabold text-slate-400 dark:text-slate-500 px-1 shrink-0">
                    {language === 'en' ? 'Active Studio:' : 'انتخاب استودیو:'}
                  </span>
                  {(
                    [
                      {
                        id: 'simulator',
                        label:
                          language === 'en'
                            ? 'Mission Control'
                            : 'شبیه‌ساز Mission Control',
                        icon: Terminal,
                      },
                      {
                        id: 'guardrails',
                        label:
                          language === 'en'
                            ? 'Rule & Workflow'
                            : 'استودیو Rule و Workflow',
                        icon: Shield,
                      },
                      {
                        id: 'mcp',
                        label:
                          language === 'en'
                            ? 'FastMCP Studio'
                            : 'استودیو FastMCP',
                        icon: Cpu,
                      },
                      {
                        id: 'scenarios',
                        label:
                          language === 'en'
                            ? 'Scenario Lab'
                            : 'آزمایشگاه سناریو',
                        icon: Compass,
                      },
                    ] as const
                  ).map((st) => {
                    const IconComp = st.icon;
                    const isCurrent = activeSection === st.id;
                    return (
                      <button
                        key={st.id}
                        type="button"
                        onClick={() => setActiveSection(st.id)}
                        className={`h-8 px-3 rounded-lg text-xs flex items-center gap-1.5 transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                          isCurrent
                            ? 'bg-blue-600 text-white font-bold shadow-2xs'
                            : 'bg-slate-100 dark:bg-white/[0.04] text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                        }`}
                      >
                        <IconComp className="w-3.5 h-3.5 shrink-0" />
                        <span>{st.label}</span>
                      </button>
                    );
                  })}
                </div>
                <button
                  type="button"
                  onClick={() => setActiveSection('curriculum')}
                  className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer shrink-0"
                >
                  {language === 'en'
                    ? '← Back to Curriculum'
                    : '→ بازگشت به فصل‌های آموزشی'}
                </button>
              </div>
            </div>
          )}

          {['knowledge-base', 'ai-architect', 'cheatsheets'].includes(
            activeSection
          ) && (
            <div className="border-b border-slate-200/70 dark:border-white/[0.06] bg-white/70 dark:bg-[#0c121e]/70 px-4 sm:px-8 py-2.5">
              <div className="max-w-5xl mx-auto flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                  <span className="text-[11px] font-extrabold text-slate-400 dark:text-slate-500 px-1 shrink-0">
                    {language === 'en' ? 'Reference Tool:' : 'بخش مرجع:'}
                  </span>
                  {(
                    [
                      {
                        id: 'knowledge-base',
                        label:
                          language === 'en'
                            ? 'Knowledge Base'
                            : 'پایگاه دانش و Context Rot',
                        icon: Database,
                      },
                      {
                        id: 'ai-architect',
                        label:
                          language === 'en'
                            ? 'AI Copilot & Docs'
                            : 'دستیار هوشمند و مستندات',
                        icon: Sparkles,
                      },
                      {
                        id: 'cheatsheets',
                        label:
                          language === 'en'
                            ? 'Cheat Sheets & PDF'
                            : 'چیت‌شیت‌ها و خروجی PDF',
                        icon: FileSpreadsheet,
                      },
                    ] as const
                  ).map((refItem) => {
                    const IconComp = refItem.icon;
                    const isCurrent = activeSection === refItem.id;
                    return (
                      <button
                        key={refItem.id}
                        type="button"
                        onClick={() => setActiveSection(refItem.id)}
                        className={`h-8 px-3 rounded-lg text-xs flex items-center gap-1.5 transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                          isCurrent
                            ? 'bg-indigo-600 text-white font-bold shadow-2xs'
                            : 'bg-slate-100 dark:bg-white/[0.04] text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                        }`}
                      >
                        <IconComp className="w-3.5 h-3.5 shrink-0" />
                        <span>{refItem.label}</span>
                      </button>
                    );
                  })}
                </div>
                <button
                  type="button"
                  onClick={() => setActiveSection('curriculum')}
                  className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer shrink-0"
                >
                  {language === 'en'
                    ? '← Back to Curriculum'
                    : '→ بازگشت به فصل‌های آموزشی'}
                </button>
              </div>
            </div>
          )}

          <div className="px-4 sm:px-8 lg:px-12 py-8 max-w-5xl mx-auto w-full flex-1">
            {activeSection === 'curriculum' && (
              <ModuleContentView
                module={currentModule}
                isCompleted={completedModules.includes(currentModule.id)}
                onToggleComplete={handleToggleModuleComplete}
                onSelectModule={(id) => {
                  setActiveModuleId(id);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                totalModules={ALL_CURRICULUM_MODULES.length}
                allModules={ALL_CURRICULUM_MODULES}
                onExportPdf={(payload) => setPdfPayload(payload)}
              />
            )}

            {activeSection === 'achievements' && (
              <AchievementsCertificationView
                allModules={ALL_CURRICULUM_MODULES}
                completedModules={completedModules}
                onToggleModuleComplete={handleToggleModuleComplete}
                onCompleteAllModules={handleCompleteAllModules}
                onNavigateToModule={(modId) => {
                  setActiveModuleId(modId);
                  setActiveSection('curriculum');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                onExportPdf={(payload) => setPdfPayload(payload)}
              />
            )}

            {activeSection === 'simulator' && (
              <MissionControlSimulator
                onExportPdf={(payload) => setPdfPayload(payload)}
                completedModules={completedModules}
                totalModules={ALL_CURRICULUM_MODULES.length}
                onRestoreCompletedModules={(restored) => setCompletedModules(restored)}
              />
            )}

            {activeSection === 'guardrails' && (
              <GuardrailAutomationStudio onExportPdf={(payload) => setPdfPayload(payload)} />
            )}

            {activeSection === 'mcp' && (
              <McpVisualStudio onExportPdf={(payload) => setPdfPayload(payload)} />
            )}

            {activeSection === 'cheatsheets' && (
              <CheatSheetsStudio onExportPdf={(payload) => setPdfPayload(payload)} />
            )}

            {activeSection === 'scenarios' && (
              <ArchitectScenarioLab onExportPdf={(payload) => setPdfPayload(payload)} />
            )}

            {activeSection === 'ai-architect' && (
              <GroundedAiArchitectCopilot
                onLaunch3DGame={() => setActiveSection('game-3d')}
              />
            )}

            {activeSection === 'knowledge-base' && (
              <KnowledgeBaseExplorer
                onExportPdf={(payload) => setPdfPayload(payload)}
                completedModules={completedModules}
                onRestoreCompletedModules={(restored) => setCompletedModules(restored)}
              />
            )}
          </div>

          {/* Global Architectural Footer */}
          <footer
            data-testid="global-architectural-footer"
            className="mt-12 border-t border-slate-200/80 dark:border-white/[0.07] bg-white dark:bg-[#0b101b]"
          >
            <div className="max-w-5xl mx-auto px-4 sm:px-8 lg:px-12 py-10 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8">
                {/* Column 1: Brand Identity & Academy Progress */}
                <div className="lg:col-span-4 space-y-3.5">
                  <div className="flex items-center gap-2.5">
                    <span className="w-6 h-6 rounded-md bg-blue-600/10 dark:bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-600 dark:text-blue-400 font-mono text-[11px] font-black">
                      AG
                    </span>
                    <span className="text-sm font-extrabold text-slate-900 dark:text-white">
                      {t('brandTitle')}
                    </span>
                  </div>
                  <p className="text-xs leading-6 text-slate-500 dark:text-slate-400">
                    {language === 'en'
                      ? 'Comprehensive interactive engineering workbench for mastering Google Antigravity IDE architecture, artifact review gates, .agent/rules guardrails, and FastMCP protocols.'
                      : 'میز کار مهندسی و مرجع جامع تعاملی برای تسلط بر معماری محیط توسعه ایجنت‌محور Google Antigravity، ممیزی آرتیفکت‌ها، گاردریل‌های .agent/rules و پروتکل FastMCP.'}
                  </p>
                  <div className="pt-1 flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setActiveSection('achievements')}
                      className="inline-flex items-center gap-2 px-2.5 py-1 rounded-lg border border-slate-200/80 dark:border-white/[0.07] bg-slate-50 dark:bg-[#0c121e] text-xs font-medium text-slate-700 dark:text-slate-300 hover:border-blue-500/40 transition-colors cursor-pointer"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      <span>
                        {language === 'en' ? 'Progress:' : 'پیشرفت:'}{' '}
                        <strong dir="ltr" className="ltr-inline font-mono text-emerald-600 dark:text-emerald-400">
                          {completedModules.length}/8 ({completionPercent}%)
                        </strong>
                      </span>
                    </button>
                    <a
                      href="#top"
                      onClick={(e) => {
                        e.preventDefault();
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-slate-200/80 dark:border-white/[0.07] bg-slate-50 dark:bg-[#0c121e] text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                    >
                      <span>{language === 'en' ? 'Back to Top ↑' : 'بازگشت به بالا ↑'}</span>
                    </a>
                  </div>
                </div>

                {/* Column 2: Curriculum Modules 01-08 */}
                <div className="lg:col-span-5 space-y-2.5">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    {t('sidebarTitle')}
                  </div>
                  <div className="grid grid-cols-1 gap-1">
                    {ALL_CURRICULUM_MODULES.map((mod) => {
                      const isDone = completedModules.includes(mod.id);
                      return (
                        <button
                          key={mod.id}
                          type="button"
                          onClick={() => {
                            setActiveSection('curriculum');
                            setActiveModuleId(mod.id);
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                          }}
                          className={`text-xs py-1 px-2 rounded-md transition-colors flex items-center gap-2 cursor-pointer truncate ${
                            isRTL ? 'text-right' : 'text-left'
                          } ${
                            activeSection === 'curriculum' && activeModuleId === mod.id
                              ? 'text-blue-600 dark:text-blue-400 font-semibold bg-blue-500/[0.07]'
                              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                          }`}
                        >
                          <span dir="ltr" className="ltr-inline font-mono text-[10px] text-slate-400 dark:text-slate-500 shrink-0">
                            0{mod.number}
                          </span>
                          <span className="truncate flex-1">
                            {language === 'en' ? mod.titleEn : mod.titleFa}
                          </span>
                          {isDone && (
                            <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Column 3: Engineering Studios & Quick Utilities */}
                <div className="lg:col-span-3 space-y-2.5">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    {t('studiosSectionTitle')}
                  </div>
                  <div className="grid grid-cols-1 gap-1">
                    {(
                      [
                        { id: 'simulator', label: t('navSimulator') },
                        { id: 'guardrails', label: t('navGuardrails') },
                        { id: 'mcp', label: t('navMcp') },
                        { id: 'cheatsheets', label: t('navCheatsheets') },
                        { id: 'scenarios', label: t('navScenarios') },
                        { id: 'knowledge-base', label: t('navKnowledgeBase') },
                        { id: 'ai-architect', label: t('navAiSearch') },
                        { id: 'achievements', label: t('navAchievements') },
                      ] as const
                    ).map((st) => (
                      <button
                        key={st.id}
                        type="button"
                        onClick={() => {
                          setActiveSection(st.id);
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        className={`text-xs py-1 px-2 rounded-md transition-colors truncate cursor-pointer ${
                          isRTL ? 'text-right' : 'text-left'
                        } ${
                          activeSection === st.id
                            ? 'text-blue-600 dark:text-blue-400 font-semibold bg-blue-500/[0.07]'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                        }`}
                      >
                        {st.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Bottom Legal & Documentation Bar */}
              <div className="pt-6 border-t border-slate-200/70 dark:border-white/[0.06] flex flex-wrap items-center justify-between gap-4 text-xs text-slate-500 dark:text-slate-400">
                <div className="flex flex-wrap items-center gap-2">
                  <span dir="ltr" className="ltr-inline font-mono text-[11px]">
                    https://antigravity.google/docs
                  </span>
                  <span aria-hidden="true" className="opacity-40">·</span>
                  <span>
                    {language === 'en'
                      ? 'Agent-First Engineering Workbench'
                      : 'مرجع مهندسی سیستم‌های ایجنت‌محور'}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setSearchModalOpen(true)}
                    className="hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
                  >
                    {language === 'en' ? 'Command Palette (Ctrl+K)' : 'جستجوی فرمان (Ctrl+K)'}
                  </button>
                  <span aria-hidden="true" className="opacity-40">·</span>
                  <button
                    type="button"
                    onClick={() => setActivityModalOpen(true)}
                    className="hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
                  >
                    {language === 'en' ? 'Activity Log' : 'تاریخچه ناوبری'}
                  </button>
                  <span aria-hidden="true" className="opacity-40">·</span>
                  <button
                    type="button"
                    onClick={toggleLanguage}
                    className="font-mono hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
                  >
                    {language === 'en' ? 'فارسی (RTL)' : 'English (LTR)'}
                  </button>
                </div>
              </div>
            </div>
          </footer>
        </main>
      </div>

      {/* Global Search Modal (Ctrl/Cmd + K) */}
      <GlobalCommandSearchModal
        isOpen={searchModalOpen}
        onClose={() => setSearchModalOpen(false)}
        onNavigateToModule={(modId) => {
          setActiveSection('curriculum');
          setActiveModuleId(modId);
        }}
        onNavigateToStudio={(studioId) => setActiveSection(studioId)}
      />

      {/* Scoped Per-Section PDF Export Modal */}
      <ScopedPdfExportModal
        payload={pdfPayload}
        onClose={() => setPdfPayload(null)}
      />

      {/* Browser-Based Navigation Activity Logger Modal ('section_change' history) */}
      <NavigationActivityLoggerModal
        isOpen={activityModalOpen}
        onClose={() => setActivityModalOpen(false)}
        logs={activityLogs}
        onClearHistory={handleClearActivityHistory}
        onNavigateToEntry={(section, moduleId) => {
          setActiveSection(section);
          if (moduleId) {
            setActiveModuleId(moduleId);
          }
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />

      {/* Mission Milestone Overlay Notification (Confetti + Antigravity Quote) */}
      <MissionMilestoneOverlay
        milestone={activeMilestone}
        onClose={() => setActiveMilestone(null)}
        onAdvanceNextModule={(nextNum) => {
          const nextMod = ALL_CURRICULUM_MODULES.find((m) => m.number === nextNum);
          if (nextMod) {
            setActiveModuleId(nextMod.id);
            setActiveSection('curriculum');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }
          setActiveMilestone(null);
        }}
        onOpenTrophyCase={() => {
          setActiveSection('achievements');
          setActiveMilestone(null);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />

      {/* Resume Recent Session Startup Modal */}
      {resumeModalOpen && detectedSession && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="resume-session-modal-title"
          data-testid="resume-session-modal"
        >
          <div className="w-full max-w-lg rounded-2xl border border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[#0c121e] text-slate-900 dark:text-slate-100 shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-slate-50/90 dark:bg-[#090d16] border-b border-slate-200/80 dark:border-white/[0.07] flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-600/10 border border-blue-500/30 flex items-center justify-center text-blue-500 shrink-0">
                  <History className="w-4 h-4" />
                </div>
                <div>
                  <h2
                    id="resume-session-modal-title"
                    className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white"
                  >
                    {t('resumeModalTitle')}
                  </h2>
                  <div
                    dir="ltr"
                    className="ltr-inline text-[11px] font-mono text-blue-600 dark:text-blue-400"
                  >
                    Detected from localStorage · Cross-Session Continuity
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setResumeModalOpen(false)}
                aria-label="Close Resume Session Modal"
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-white/[0.06] transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5">
              <p className="text-xs sm:text-sm leading-6 text-slate-600 dark:text-slate-300">
                {language === 'en'
                  ? 'Your previous activity and progress point was detected in browser localStorage. Would you like to resume right where you left off?'
                  : 'آخرین فعالیت و نقطه پیشرفت شما در حافظه مرورگر (localStorage) شناسایی شد. آیا مایلید مستقیماً به همان بخش بازگردید؟'}
              </p>

              {/* Detected Target Card */}
              <div
                className="p-4 rounded-xl border border-blue-500/30 bg-blue-500/5 space-y-2.5"
                data-testid="resume-session-target-card"
              >
                <div className="flex items-center justify-between gap-2 text-[11px]">
                  <span
                    dir="ltr"
                    className="ltr-inline text-blue-600 dark:text-blue-400 font-mono font-bold"
                  >
                    {detectedSession.badgeLabelEn}
                  </span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                    {detectedSession.kind === 'studio'
                      ? (language === 'en' ? 'Interactive Studio' : 'استودیوی تعاملی')
                      : (language === 'en' ? 'Learning Module' : 'سرفصل آموزشی')}
                  </span>
                </div>

                <div
                  className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white"
                  data-testid="resume-session-title-fa"
                >
                  {language === 'en' ? detectedSession.targetTitleEn : detectedSession.targetTitleFa}
                </div>

                <div
                  dir="ltr"
                  className="text-xs font-mono text-slate-500 dark:text-slate-400 block opacity-80"
                  data-testid="resume-session-title-en"
                >
                  {language === 'en' ? detectedSession.badgeLabelEn : detectedSession.targetTitleEn}
                </div>
              </div>

              {/* Saved Curriculum Progress Bar */}
              <div className="p-4 rounded-xl border border-slate-200/80 dark:border-white/[0.07] bg-slate-50 dark:bg-[#090d16] space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-700 dark:text-slate-300">
                    {language === 'en' ? 'Saved Academy Curriculum Progress:' : 'پیشرفت ثبت‌شده در سرفصل‌های آکادمی:'}
                  </span>
                  <span
                    dir="ltr"
                    className="ltr-inline font-mono font-bold text-emerald-500 tabular-nums"
                  >
                    {detectedSession.completedCount} / {detectedSession.totalModules} Modules ({detectedSession.completionPercent}%)
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-white/[0.06] overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 transition-all duration-300"
                    style={{ width: `${detectedSession.completionPercent}%` }}
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={() => setResumeModalOpen(false)}
                  data-testid="dismiss-resume-session-btn"
                  className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/[0.05] transition-colors cursor-pointer"
                >
                  {t('resumeModalStay')}
                </button>
                <button
                  type="button"
                  onClick={handleJumpToRecentSession}
                  data-testid="confirm-resume-session-btn"
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <span>{t('resumeModalJump')}</span>
                  <ArrowUpLeft className={`w-4 h-4 ${isRTL ? '' : 'rotate-90'}`} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PWA Offline Mode Connectivity Indicator */}
      <OfflineIndicator />
    </div>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <MainWorkspace />
    </LanguageProvider>
  );
}

