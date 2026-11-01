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
        if (searchParams.get('autostart') !== '1') {
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
      className="min-h-screen flex flex-col bg-slate-50 dark:bg-[#090d16] text-slate-900 dark:text-slate-100 transition-colors"
    >
      {/* Top Bar Contract: 3 Clean Zones separated by gap-8 */}
      <header className="sticky top-0 z-30 flex items-center justify-between gap-8 px-6 py-3.5 border-b border-slate-200 dark:border-slate-800/80 bg-white/85 dark:bg-[#090d16]/85 backdrop-blur-md">
        {/* Zone 1: Single text element wordmark */}
        <a
          href="#top"
          onClick={(e) => {
            e.preventDefault();
            setActiveSection('curriculum');
          }}
          className="text-base sm:text-lg font-extrabold tracking-tight text-slate-900 dark:text-white whitespace-nowrap shrink-0"
        >
          {t('brandTitle')}
        </a>

        {/* Zone 2: 5 concise single-line text navigation links */}
        <nav
          aria-label="Primary Workspace Navigation"
          className="hidden lg:flex items-center gap-6 text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-300"
        >
          <button
            type="button"
            onClick={() => setActiveSection('curriculum')}
            className={`hover:text-blue-600 dark:hover:text-blue-400 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              activeSection === 'curriculum' || activeSection === 'achievements'
                ? 'text-blue-600 dark:text-blue-400 underline underline-offset-8'
                : ''
            }`}
          >
            {t('navAcademy')}
          </button>
          <button
            type="button"
            onClick={() => setActiveSection('simulator')}
            className={`hover:text-blue-600 dark:hover:text-blue-400 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              activeSection === 'simulator'
                ? 'text-blue-600 dark:text-blue-400 underline underline-offset-8'
                : ''
            }`}
          >
            {t('navSimulator')}
          </button>
          <button
            type="button"
            onClick={() => setActiveSection('guardrails')}
            className={`hover:text-blue-600 dark:hover:text-blue-400 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              activeSection === 'guardrails'
                ? 'text-blue-600 dark:text-blue-400 underline underline-offset-8'
                : ''
            }`}
          >
            {t('navGuardrails')}
          </button>
          <button
            type="button"
            onClick={() => setActiveSection('mcp')}
            className={`hover:text-blue-600 dark:hover:text-blue-400 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              activeSection === 'mcp'
                ? 'text-blue-600 dark:text-blue-400 underline underline-offset-8'
                : ''
            }`}
          >
            {t('navMcp')}
          </button>
          <button
            type="button"
            onClick={() => setActiveSection('cheatsheets')}
            className={`hover:text-blue-600 dark:hover:text-blue-400 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              activeSection === 'cheatsheets'
                ? 'text-blue-600 dark:text-blue-400 underline underline-offset-8'
                : ''
            }`}
          >
            {t('navCheatsheets')}
          </button>
        </nav>

        {/* Zone 3: Pomodoro Study Timer & Deep Work Logger + Language Switcher + Search Launcher (Ctrl+K) */}
        <div className="flex items-center gap-3 shrink-0">
          <PomodoroHeaderWidget
            currentModule={currentModule}
            onStudyMinutesLogged={(minutes, modId) => {
              // Automatically link to session snapshot
              try {
                const nowIso = new Date().toISOString();
                window.localStorage.setItem('ag_last_deep_work_logged_v1', JSON.stringify({
                  moduleId: modId,
                  minutes,
                  loggedAtIso: nowIso,
                }));
              } catch {
                // Ignore storage error
              }
            }}
          />

          {/* Bilingual Language Switcher Button */}
          <button
            type="button"
            onClick={toggleLanguage}
            data-testid="language-toggle-btn"
            aria-label={language === 'fa' ? 'Switch interface to English' : 'تغییر رابط کاربری به فارسی'}
            className="px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5 cursor-pointer hover:border-blue-500/50 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            <Globe className="w-3.5 h-3.5 text-blue-500" />
            <span className="font-mono">{t('langSwitchBadge')}</span>
            <span className="text-[10px] text-slate-400 font-mono font-normal hidden sm:inline">
              ({t('langSwitchLabel')})
            </span>
          </button>

          <button
            type="button"
            onClick={() => setSearchModalOpen(true)}
            className="px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Search className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{t('quickSearch')}</span>
            <span className="sm:hidden">Ctrl+K</span>
          </button>
        </div>
      </header>

      {/* Secondary Workspace Toolbar (Below Header: Academy Achievements, Studio Quick Switcher, Progress & Theme Toggle) */}
      <div className="border-b border-slate-200 dark:border-slate-800/80 bg-slate-100/70 dark:bg-slate-900/50 px-6 py-2.5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setSidebarOpen((prev) => !prev)}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-medium text-slate-700 dark:text-slate-300 cursor-pointer"
            aria-label="Toggle Curriculum Sidebar"
          >
            {sidebarOpen ? (
              <PanelRightClose className="w-4 h-4 text-blue-500" />
            ) : (
              <PanelRightOpen className="w-4 h-4 text-blue-500" />
            )}
            <span className="hidden sm:inline">{t('sidebarToggle')}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSection('achievements')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${
              activeSection === 'achievements'
                ? 'bg-blue-600 text-white'
                : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
            }`}
          >
            <Award className="w-3.5 h-3.5 text-emerald-500" />
            <span>{t('navAchievements')}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSection('scenarios')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${
              activeSection === 'scenarios'
                ? 'bg-blue-600 text-white'
                : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
            }`}
          >
            <Award className="w-3.5 h-3.5 text-amber-500" />
            <span>{t('navScenarios')}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSection('ai-architect')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${
              activeSection === 'ai-architect'
                ? 'bg-blue-600 text-white'
                : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
            }`}
          >
            <Globe className="w-3.5 h-3.5 text-emerald-500" />
            <span>{t('navAiSearch')}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSection('knowledge-base')}
            data-testid="nav-tab-knowledge-base"
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${
              activeSection === 'knowledge-base'
                ? 'bg-blue-600 text-white'
                : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
            }`}
          >
            <Database className="w-3.5 h-3.5 text-blue-500" />
            <span>{t('navKnowledgeBase')}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSection('game-3d')}
            data-testid="nav-tab-game-3d"
            className="px-3 py-1.5 rounded-lg text-xs font-extrabold flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap bg-amber-500/15 border border-amber-500/40 text-amber-600 dark:text-amber-400 hover:bg-amber-500/25"
          >
            <Gamepad2 className="w-3.5 h-3.5 text-amber-500" />
            <span>
              {language === 'en' ? '3D Cyber Arena (Three.js)' : 'میدان نبرد سه‌بعدی (Three.js)'}
            </span>
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {detectedSession && (
            <button
              type="button"
              onClick={() => setResumeModalOpen(true)}
              data-testid="open-resume-modal-btn"
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-500/20 text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap"
            >
              <History className="w-3.5 h-3.5" />
              <span>{t('resumeSession')}</span>
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
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-indigo-500/30 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-500/20 text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap"
          >
            <Activity className="w-3.5 h-3.5" />
            <span>
              {language === 'en' ? 'Navigation History' : 'تاریخچه ناوبری'}
            </span>
            <span
              dir="ltr"
              data-testid="activity-logger-badge-count"
              className="ltr-inline px-1.5 py-0.2 rounded bg-indigo-500/20 text-[10px] font-mono font-bold tabular-nums"
            >
              {activityLogs.length}
            </span>
          </button>

          <PWAInstallButton />

          <button
            type="button"
            onClick={() => setActiveSection('achievements')}
            className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400 hover:text-blue-500 transition-colors cursor-pointer"
          >
            <span>{t('studyProgress')}</span>
            <span dir="ltr" className="ltr-inline font-mono font-bold text-blue-500 tabular-nums">
              {completedModules.length}/8 ({completionPercent}%)
            </span>
          </button>

          <button
            type="button"
            onClick={() => setDarkMode((prev) => !prev)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-700 dark:text-slate-200 cursor-pointer whitespace-nowrap"
            aria-label="Toggle Dark or Light Mode"
          >
            {darkMode ? (
              <>
                <Sun className="w-3.5 h-3.5 text-amber-400" />
                <span>{t('themeLight')}</span>
              </>
            ) : (
              <>
                <Moon className="w-3.5 h-3.5 text-blue-600" />
                <span>{t('themeDark')}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Fluid Widescreen Workspace Grid */}
      <div className="flex-1 flex overflow-hidden">
        {/* Navigation Sidebar */}
        {sidebarOpen && (
          <aside
            aria-label="Curriculum Modules & Studios Navigation"
            className={`w-72 sm:w-80 shrink-0 ${
              isRTL ? 'border-l' : 'border-r'
            } border-slate-200 dark:border-slate-800/80 bg-white/90 dark:bg-[#0d1322]/90 p-4 overflow-y-auto space-y-6 hidden md:block`}
          >
            {/* 8 Learning Modules + Academy Certification Card */}
            <div className="space-y-2">
              <div className="px-2 text-xs font-extrabold text-slate-500 dark:text-slate-400 flex items-center justify-between">
                <span>{t('sidebarTitle')}</span>
                <span dir="ltr" className="ltr-inline font-mono text-[11px]">
                  {t('sidebarSubtitle')}
                </span>
              </div>

              {/* Dedicated Academy Achievements & Certification Item inside Academy Sidebar */}
              <button
                type="button"
                onClick={() => setActiveSection('achievements')}
                className={`w-full ${
                  isRTL ? 'text-right' : 'text-left'
                } p-3 rounded-xl border transition-all flex items-start gap-2.5 cursor-pointer ${
                  activeSection === 'achievements'
                    ? 'border-emerald-500 bg-emerald-500/15 text-slate-900 dark:text-white'
                    : 'border-emerald-500/30 bg-emerald-500/5 hover:bg-emerald-500/10 text-slate-800 dark:text-slate-200'
                }`}
              >
                <Award className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-bold leading-5">
                    {language === 'en' ? 'Achievements & Certification' : 'دستاوردها و گواهینامه آکادمی'}
                  </div>
                  <div
                    dir="ltr"
                    className={`text-[10px] font-mono text-emerald-600 dark:text-emerald-400 ${
                      isRTL ? 'text-right' : 'text-left'
                    } leading-4 mt-0.5 break-words`}
                  >
                    Achievements &amp; Certification ({completedModules.length}/8)
                  </div>
                </div>
              </button>

              <div className="space-y-1 pt-1">
                {ALL_CURRICULUM_MODULES.map((mod) => {
                  const isCurrent =
                    activeSection === 'curriculum' && activeModuleId === mod.id;
                  const isDone = completedModules.includes(mod.id);
                  const primaryTitle = language === 'en' ? `Module ${mod.number}: ${mod.titleEn}` : `فصل ${mod.number}: ${mod.titleFa}`;
                  const secondaryTitle = language === 'en' ? `${mod.readingTime} · ${mod.difficulty}` : mod.titleEn;

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
                      } p-2.5 rounded-xl border transition-all flex items-start gap-2.5 cursor-pointer ${
                        isCurrent
                          ? 'border-blue-500 bg-blue-500/10 text-slate-900 dark:text-white'
                          : 'border-transparent hover:bg-slate-100 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {isDone ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                      ) : (
                        <Circle className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-bold leading-5">
                          {primaryTitle}
                        </div>
                        <div
                          dir="ltr"
                          className={`text-[10px] font-mono text-slate-500 dark:text-slate-400 ${
                            isRTL ? 'text-right' : 'text-left'
                          } leading-4 mt-0.5 break-words opacity-80`}
                        >
                          {secondaryTitle}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Interactive Studios List */}
            <div className="space-y-2 pt-4 border-t border-slate-200 dark:border-slate-800">
              <div className="px-2 text-xs font-extrabold text-slate-500 dark:text-slate-400">
                {t('studiosSectionTitle')}
              </div>
              <div className="space-y-1">
                {(
                  [
                    {
                      id: 'simulator',
                      label: t('studio1Label'),
                      sub: t('studio1Sub'),
                      icon: Terminal,
                    },
                    {
                      id: 'guardrails',
                      label: t('studio2Label'),
                      sub: t('studio2Sub'),
                      icon: Shield,
                    },
                    {
                      id: 'mcp',
                      label: t('studio3Label'),
                      sub: t('studio3Sub'),
                      icon: Cpu,
                    },
                    {
                      id: 'cheatsheets',
                      label: t('studio4Label'),
                      sub: t('studio4Sub'),
                      icon: FileSpreadsheet,
                    },
                    {
                      id: 'scenarios',
                      label: t('studio5Label'),
                      sub: t('studio5Sub'),
                      icon: Award,
                    },
                    {
                      id: 'knowledge-base',
                      label: t('studio6Label'),
                      sub: t('studio6Sub'),
                      icon: Database,
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
                      } p-2.5 rounded-xl border transition-all flex items-start gap-2.5 cursor-pointer ${
                        active
                          ? 'border-blue-500 bg-blue-500/10 text-slate-900 dark:text-white'
                          : 'border-transparent hover:bg-slate-100 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <IconComp className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-bold">{st.label}</div>
                        <div
                          dir="ltr"
                          className={`text-[10px] font-mono text-slate-500 dark:text-slate-400 ${
                            isRTL ? 'text-right' : 'text-left'
                          } leading-4 mt-0.5 break-words`}
                        >
                          {st.sub}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </aside>
        )}

        {/* Main Content Viewport */}
        <main className="flex-1 overflow-y-auto px-4 sm:px-8 py-6 max-w-6xl mx-auto w-full">
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

        {/* Sticky On-This-Page Mini-Map (When viewing Curriculum on XL screens) */}
        {activeSection === 'curriculum' && (
          <aside
            aria-label="On This Page Subsections"
            className={`w-64 shrink-0 ${
              isRTL ? 'border-r' : 'border-l'
            } border-slate-200 dark:border-slate-800/80 p-4 hidden xl:block space-y-4`}
          >
            <div className="text-xs font-bold text-slate-500 dark:text-slate-400">
              {t('onThisPageTitle')}
            </div>
            <div className="space-y-2">
              {currentModule.subSections.map((sub) => {
                const subPrimary = language === 'en' ? sub.titleEn : sub.titleFa;
                return (
                  <a
                    key={sub.id}
                    href={`#${sub.id}`}
                    className="block p-2.5 rounded-lg text-xs text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-blue-500 transition-colors"
                  >
                    <div className="font-semibold leading-5">{subPrimary}</div>
                    {language !== 'en' && (
                      <div
                        dir="ltr"
                        className={`text-[10px] font-mono opacity-75 ${
                          isRTL ? 'text-right' : 'text-left'
                        } leading-4 mt-1 break-words`}
                      >
                        {sub.titleEn}
                      </div>
                    )}
                  </a>
                );
              })}
            </div>
          </aside>
        )}
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
                <div className="flex items-center justify-between gap-2">
                  <span
                    dir="ltr"
                    className="ltr-inline px-2.5 py-0.5 rounded-md bg-blue-600/15 border border-blue-500/30 text-blue-600 dark:text-blue-400 font-mono text-[11px] font-bold"
                  >
                    {detectedSession.badgeLabelEn}
                  </span>
                  <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
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

