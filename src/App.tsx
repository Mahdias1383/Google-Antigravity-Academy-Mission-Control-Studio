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
      dir={isRTL ? 'rtl' : 'ltr'}
      className="min-h-screen flex flex-col bg-[#f8fafc] dark:bg-[#090d16] text-slate-900 dark:text-slate-100 transition-colors"
    >
      {/* Top Bar Contract: 3 Clean Zones separated by gap-8 */}
      <header className="sticky top-0 z-30 h-14 flex items-center justify-between gap-8 px-4 sm:px-6 border-b border-slate-200/80 dark:border-white/[0.07] bg-white/90 dark:bg-[#090d16]/90 backdrop-blur-md">
        {/* Zone 1: Single text element wordmark */}
        <a
          href="#top"
          onClick={(e) => {
            e.preventDefault();
            setActiveSection('curriculum');
          }}
          className="text-sm sm:text-base font-extrabold tracking-tight text-slate-900 dark:text-white whitespace-nowrap shrink-0"
        >
          {t('brandTitle')}
        </a>

        {/* Zone 2: 5 concise single-line text navigation links */}
        <nav
          aria-label="Primary Workspace Navigation"
          className="hidden lg:flex items-center gap-1 text-xs sm:text-[13px] font-medium text-slate-600 dark:text-slate-400"
        >
          <button
            type="button"
            onClick={() => setActiveSection('curriculum')}
            className={`px-3 py-1.5 rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              activeSection === 'curriculum'
                ? 'bg-slate-900/[0.06] dark:bg-white/[0.08] text-slate-950 dark:text-white font-semibold'
                : 'hover:text-slate-900 dark:hover:text-white hover:bg-slate-900/[0.03] dark:hover:bg-white/[0.04]'
            }`}
          >
            {t('navAcademy')}
          </button>
          <button
            type="button"
            onClick={() => setActiveSection('simulator')}
            className={`px-3 py-1.5 rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              activeSection === 'simulator'
                ? 'bg-slate-900/[0.06] dark:bg-white/[0.08] text-slate-950 dark:text-white font-semibold'
                : 'hover:text-slate-900 dark:hover:text-white hover:bg-slate-900/[0.03] dark:hover:bg-white/[0.04]'
            }`}
          >
            {t('navSimulator')}
          </button>
          <button
            type="button"
            onClick={() => setActiveSection('guardrails')}
            className={`px-3 py-1.5 rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              activeSection === 'guardrails'
                ? 'bg-slate-900/[0.06] dark:bg-white/[0.08] text-slate-950 dark:text-white font-semibold'
                : 'hover:text-slate-900 dark:hover:text-white hover:bg-slate-900/[0.03] dark:hover:bg-white/[0.04]'
            }`}
          >
            {t('navGuardrails')}
          </button>
          <button
            type="button"
            onClick={() => setActiveSection('mcp')}
            className={`px-3 py-1.5 rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              activeSection === 'mcp'
                ? 'bg-slate-900/[0.06] dark:bg-white/[0.08] text-slate-950 dark:text-white font-semibold'
                : 'hover:text-slate-900 dark:hover:text-white hover:bg-slate-900/[0.03] dark:hover:bg-white/[0.04]'
            }`}
          >
            {t('navMcp')}
          </button>
          <button
            type="button"
            onClick={() => setActiveSection('cheatsheets')}
            className={`px-3 py-1.5 rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              activeSection === 'cheatsheets'
                ? 'bg-slate-900/[0.06] dark:bg-white/[0.08] text-slate-950 dark:text-white font-semibold'
                : 'hover:text-slate-900 dark:hover:text-white hover:bg-slate-900/[0.03] dark:hover:bg-white/[0.04]'
            }`}
          >
            {t('navCheatsheets')}
          </button>
        </nav>

        {/* Zone 3: Strictly 1 Primary Action CTA — Quick Search (Ctrl+K) */}
        <button
          type="button"
          onClick={() => setSearchModalOpen(true)}
          className="px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer shadow-xs"
        >
          <Search className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">{t('quickSearch')}</span>
          <span className="sm:hidden">Ctrl+K</span>
        </button>
      </header>

      {/* Quiet Single-Line Workspace Sub-Header (Linear-style utility & lab strip) */}
      <div className="border-b border-slate-200/70 dark:border-white/[0.06] bg-slate-100/60 dark:bg-[#0b101b] px-4 sm:px-6 py-1.5 min-h-[40px] flex flex-wrap items-center justify-between gap-x-4 gap-y-1.5">
        <div className="flex flex-wrap items-center gap-1 min-w-0">
          <button
            type="button"
            onClick={() => setSidebarOpen((prev) => !prev)}
            className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-white/[0.05] transition-colors cursor-pointer whitespace-nowrap"
            aria-label="Toggle Curriculum Sidebar"
          >
            {sidebarOpen ? (
              <PanelRightClose className="w-3.5 h-3.5 text-slate-400" />
            ) : (
              <PanelRightOpen className="w-3.5 h-3.5 text-slate-400" />
            )}
            <span className="hidden sm:inline">{t('sidebarToggle')}</span>
          </button>

          <span className="h-3.5 w-px bg-slate-200 dark:bg-white/10 mx-1 shrink-0" aria-hidden="true" />

          <button
            type="button"
            onClick={() => setActiveSection('scenarios')}
            data-testid="nav-tab-scenarios"
            className={`px-2.5 py-1 rounded-md text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${
              activeSection === 'scenarios'
                ? 'bg-blue-600/10 dark:bg-blue-500/15 text-blue-600 dark:text-blue-400 font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-white/[0.04]'
            }`}
          >
            <span>{t('navScenarios')}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSection('ai-architect')}
            data-testid="nav-tab-ai-architect"
            className={`px-2.5 py-1 rounded-md text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${
              activeSection === 'ai-architect'
                ? 'bg-blue-600/10 dark:bg-blue-500/15 text-blue-600 dark:text-blue-400 font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-white/[0.04]'
            }`}
          >
            <span>{t('navAiSearch')}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSection('knowledge-base')}
            data-testid="nav-tab-knowledge-base"
            className={`px-2.5 py-1 rounded-md text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${
              activeSection === 'knowledge-base'
                ? 'bg-blue-600/10 dark:bg-blue-500/15 text-blue-600 dark:text-blue-400 font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-white/[0.04]'
            }`}
          >
            <span>{t('navKnowledgeBase')}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSection('achievements')}
            data-testid="nav-tab-achievements"
            className={`px-2.5 py-1 rounded-md text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${
              activeSection === 'achievements'
                ? 'bg-blue-600/10 dark:bg-blue-500/15 text-blue-600 dark:text-blue-400 font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-white/[0.04]'
            }`}
          >
            <span>{t('navAchievements')}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSection('game-3d')}
            data-testid="nav-tab-game-3d"
            className="px-2.5 py-1 rounded-md text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap text-amber-600 dark:text-amber-400 hover:bg-amber-500/10"
          >
            <Gamepad2 className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            <span>
              {language === 'en' ? '3D Arena' : 'میدان سه‌بعدی'}
            </span>
          </button>
        </div>

        {/* Quiet Right/End Utility Cluster */}
        <div className="flex flex-wrap items-center gap-1.5 min-w-0">
          {detectedSession && (
            <button
              type="button"
              onClick={() => setResumeModalOpen(true)}
              data-testid="open-resume-modal-btn"
              className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-200/50 dark:hover:bg-white/[0.05] text-xs font-medium transition-colors cursor-pointer whitespace-nowrap"
              title={t('resumeSession')}
            >
              <History className="w-3.5 h-3.5 text-blue-500 shrink-0" />
              <span className="hidden xl:inline">{t('resumeSession')}</span>
            </button>
          )}

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

          <button
            type="button"
            onClick={() => setActivityModalOpen(true)}
            data-testid="open-activity-logger-btn"
            aria-label={
              language === 'en'
                ? `Open Navigation History (${activityLogs.length} events)`
                : `مشاهده تاریخچه ناوبری (${activityLogs.length} رویداد)`
            }
            className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-white/[0.05] text-xs font-medium transition-colors cursor-pointer whitespace-nowrap"
          >
            <Activity className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
            <span className="hidden 2xl:inline">
              {language === 'en' ? 'History' : 'تاریخچه'}
            </span>
            <span
              dir="ltr"
              data-testid="activity-logger-badge-count"
              className="ltr-inline text-[11px] font-mono font-semibold text-slate-500 dark:text-slate-400 tabular-nums"
            >
              {activityLogs.length}
            </span>
          </button>

          <PWAInstallButton />

          <span className="h-3.5 w-px bg-slate-200 dark:bg-white/10 mx-0.5 shrink-0" aria-hidden="true" />

          <button
            type="button"
            onClick={() => setActiveSection('achievements')}
            className="flex items-center gap-1.5 px-2 py-1 rounded-md text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer whitespace-nowrap"
            title={t('studyProgress')}
          >
            <span dir="ltr" className="ltr-inline font-mono font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums">
              {completedModules.length}/8
            </span>
          </button>

          <button
            type="button"
            onClick={toggleLanguage}
            data-testid="language-toggle-btn"
            title={t('langSwitchLabel')}
            aria-label={language === 'fa' ? 'Switch interface to English' : 'تغییر رابط کاربری به فارسی'}
            className="px-2 py-1 rounded-md text-xs font-semibold text-slate-600 dark:text-slate-300 flex items-center gap-1 cursor-pointer hover:bg-slate-200/60 dark:hover:bg-white/[0.06] transition-colors whitespace-nowrap"
          >
            <Globe className="w-3.5 h-3.5 text-slate-400" />
            <span className="font-mono text-[11px]">{t('langSwitchBadge')}</span>
          </button>

          <button
            type="button"
            onClick={() => setDarkMode((prev) => !prev)}
            className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-white/[0.06] transition-colors cursor-pointer whitespace-nowrap"
            aria-label="Toggle Dark or Light Mode"
            title={darkMode ? t('themeLight') : t('themeDark')}
          >
            {darkMode ? (
              <Sun className="w-3.5 h-3.5 text-amber-400" />
            ) : (
              <Moon className="w-3.5 h-3.5 text-slate-600" />
            )}
            <span className="sr-only">{darkMode ? t('themeLight') : t('themeDark')}</span>
          </button>
        </div>
      </div>

      {/* Main Fluid Widescreen Workspace Grid */}
      <div className="flex-1 flex overflow-hidden">
        {/* Clean Linear/Raycast-Grade Navigation Sidebar */}
        {sidebarOpen && (
          <aside
            aria-label="Curriculum Modules & Studios Navigation"
            className={`w-64 lg:w-72 shrink-0 ${
              isRTL ? 'border-l' : 'border-r'
            } border-slate-200/80 dark:border-white/[0.07] bg-white dark:bg-[#0b101b] p-4 overflow-y-auto space-y-6 hidden md:block`}
          >
            {/* Curriculum Progress & 8 Modules */}
            <div className="space-y-3">
              <div className="px-2 space-y-2">
                <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  <span>{t('sidebarTitle')}</span>
                  <span dir="ltr" className="ltr-inline font-mono text-emerald-500 tabular-nums">
                    {completionPercent}%
                  </span>
                </div>
                <div className="w-full h-1 rounded-full bg-slate-100 dark:bg-white/[0.06] overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 transition-all duration-300"
                    style={{ width: `${completionPercent}%` }}
                  />
                </div>
              </div>

              <div className="space-y-0.5">
                {ALL_CURRICULUM_MODULES.map((mod) => {
                  const isCurrent =
                    activeSection === 'curriculum' && activeModuleId === mod.id;
                  const isDone = completedModules.includes(mod.id);
                  const primaryTitle = language === 'en' ? mod.titleEn : mod.titleFa;

                  return (
                    <button
                      key={mod.id}
                      type="button"
                      onClick={() => {
                        setActiveSection('curriculum');
                        setActiveModuleId(mod.id);
                      }}
                      className={`w-full ${
                        isRTL ? 'text-right' : 'text-left'
                      } px-2.5 py-2 rounded-lg transition-colors flex items-center gap-2.5 cursor-pointer group ${
                        isCurrent
                          ? 'bg-blue-600/10 dark:bg-blue-500/[0.14] text-blue-600 dark:text-blue-400 font-semibold'
                          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/[0.04] hover:text-slate-900 dark:hover:text-slate-200'
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
            </div>

            {/* Interactive Studios & Workbenches */}
            <div className="space-y-2 pt-4 border-t border-slate-200/70 dark:border-white/[0.06]">
              <div className="px-2 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                {t('studiosSectionTitle')}
              </div>
              <div className="space-y-0.5">
                {(
                  [
                    {
                      id: 'simulator',
                      label: t('studio1Label'),
                      icon: Terminal,
                    },
                    {
                      id: 'guardrails',
                      label: t('studio2Label'),
                      icon: Shield,
                    },
                    {
                      id: 'mcp',
                      label: t('studio3Label'),
                      icon: Cpu,
                    },
                    {
                      id: 'cheatsheets',
                      label: t('studio4Label'),
                      icon: FileSpreadsheet,
                    },
                    {
                      id: 'scenarios',
                      label: t('studio5Label'),
                      icon: Award,
                    },
                    {
                      id: 'knowledge-base',
                      label: t('studio6Label'),
                      icon: Database,
                    },
                    {
                      id: 'ai-architect',
                      label: t('navAiSearch'),
                      icon: Globe,
                    },
                    {
                      id: 'achievements',
                      label: language === 'en' ? 'Achievements & Certificate' : 'دستاوردها و گواهینامه',
                      icon: Award,
                    },
                  ] as const
                ).map((st) => {
                  const IconComp = st.icon;
                  const active = activeSection === st.id;
                  return (
                    <button
                      key={st.id}
                      type="button"
                      onClick={() => setActiveSection(st.id)}
                      className={`w-full ${
                        isRTL ? 'text-right' : 'text-left'
                      } px-2.5 py-2 rounded-lg transition-colors flex items-center gap-2.5 cursor-pointer ${
                        active
                          ? 'bg-blue-600/10 dark:bg-blue-500/[0.14] text-blue-600 dark:text-blue-400 font-semibold'
                          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/[0.04] hover:text-slate-900 dark:hover:text-slate-200'
                      }`}
                    >
                      <IconComp
                        className={`w-3.5 h-3.5 shrink-0 ${
                          active ? 'text-blue-500' : 'text-slate-400 dark:text-slate-500'
                        }`}
                      />
                      <span className="text-xs leading-5 truncate flex-1">
                        {st.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </aside>
        )}

        {/* Main Content Viewport — Spacious Editorial & Engineering Workbench */}
        <main className="flex-1 overflow-y-auto px-4 sm:px-8 lg:px-12 py-8 max-w-5xl mx-auto w-full">
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
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0d1322] text-slate-900 dark:text-slate-100 shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-slate-100 dark:bg-slate-900/90 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-600/15 border border-blue-500/40 flex items-center justify-center text-blue-500 shrink-0">
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
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer"
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
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/70 space-y-2">
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
                <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
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
                  className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
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

