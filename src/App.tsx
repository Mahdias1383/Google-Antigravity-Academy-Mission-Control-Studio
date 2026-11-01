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
  ChevronUp,
  ChevronRight,
  LayoutGrid,
  Menu,
  Layers,
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

  // Comprehensive Sidebar Groups Collapse State (Default: all expanded)
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});
  const toggleGroupCollapse = (key: string) => {
    setCollapsedGroups((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleNavigate = (section: ActiveWorkspaceSection, moduleId?: string) => {
    setActiveSection(section);
    if (moduleId) {
      setActiveModuleId(moduleId);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      setSidebarOpen(false);
    }
  };

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
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        setSidebarOpen((prev) => !prev);
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

  const activeBreadcrumb = React.useMemo(() => {
    if (activeSection === 'curriculum') {
      const phaseTitle =
        currentModule.number <= 3
          ? (language === 'en' ? 'Phase 1 · Core Architecture' : 'گام اول · معماری هسته و اجرا')
          : currentModule.number <= 6
          ? (language === 'en' ? 'Phase 2 · Rules & Automation' : 'گام دوم · قوانین و اتوماسیون')
          : (language === 'en' ? 'Phase 3 · Scale & Multi-Agent' : 'گام سوم · مقیاس‌پذیری و MCP');
      return {
        group: language === 'en' ? 'Curriculum' : 'سرفصل‌های آموزشی',
        subgroup: phaseTitle,
        item: language === 'en' ? `Module 0${currentModule.number}: ${currentModule.titleEn}` : `فصل ۰${currentModule.number}: ${currentModule.titleFa}`,
      };
    }
    if (['simulator', 'guardrails', 'mcp', 'scenarios'].includes(activeSection)) {
      const map: Record<string, { fa: string; en: string }> = {
        simulator: { fa: 'شبیه‌ساز Mission Control', en: 'Mission Control Simulator' },
        guardrails: { fa: 'مهندسی Rule و Workflow', en: 'Rule & Workflow Studio' },
        mcp: { fa: 'استودیو بصری FastMCP', en: 'FastMCP Visual Studio' },
        scenarios: { fa: 'آزمایشگاه سناریوهای معماری', en: 'Architect Scenario Lab' },
      };
      return {
        group: language === 'en' ? 'Engineering Studios' : 'استودیوهای مهندسی زنده',
        subgroup: language === 'en' ? 'Interactive Workbenches' : 'میز کارهای تعاملی',
        item: language === 'en' ? map[activeSection]?.en : map[activeSection]?.fa,
      };
    }
    if (['knowledge-base', 'ai-architect', 'cheatsheets'].includes(activeSection)) {
      const map: Record<string, { fa: string; en: string }> = {
        'knowledge-base': { fa: 'پایگاه دانش و مهار Context Rot', en: 'Knowledge Base & Context Rot' },
        'ai-architect': { fa: 'دستیار هوشمند و کاوشگر مستندات', en: 'AI Architect & Live Docs' },
        cheatsheets: { fa: 'مرکز چیت‌شیت‌ها و مراجع PDF', en: 'Reference Cheat Sheets & PDF' },
      };
      return {
        group: language === 'en' ? 'Knowledge & AI' : 'پایگاه دانش و هوش مصنوعی',
        subgroup: language === 'en' ? 'Documentation & Memory' : 'کانتکست و مستندات رسمی',
        item: language === 'en' ? map[activeSection]?.en : map[activeSection]?.fa,
      };
    }
    if (activeSection === 'achievements') {
      return {
        group: language === 'en' ? 'Mastery & Evaluation' : 'ارزیابی و کارنامه مهندسی',
        subgroup: language === 'en' ? 'Certification' : 'رتبه‌بندی و نشان‌ها',
        item: language === 'en' ? 'Official Architect Certification' : 'کارنامه مهارت و صدور گواهینامه',
      };
    }
    return {
      group: language === 'en' ? 'Mission Control' : 'میز کار مهندسی',
      subgroup: '',
      item: '',
    };
  }, [activeSection, currentModule, language]);

  // Reusable Comprehensive Sidebar Content (Unified across Desktop and Mobile Drawer)
  const renderComprehensiveSidebarContent = (isMobile = false) => (
    <div className="flex flex-col h-full justify-between gap-4">
      <div className="space-y-4">
        {/* Brand & Mobile Close */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200/80 dark:border-white/[0.08]">
          <a
            href="#top"
            onClick={(e) => {
              e.preventDefault();
              handleNavigate('curriculum');
            }}
            className="flex items-center gap-2.5 group focus:outline-none min-w-0"
          >
            <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 text-white font-mono text-xs font-black tracking-tighter flex items-center justify-center shadow-xs group-hover:from-blue-500 group-hover:to-indigo-500 transition-all shrink-0">
              AG
            </span>
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-extrabold tracking-tight text-slate-900 dark:text-white whitespace-nowrap">
                {language === 'en' ? 'Google Antigravity' : 'گوگل آنتی‌گرویتی'}
              </span>
              <span className="text-[10px] text-slate-400 dark:text-slate-500 truncate font-mono">
                {language === 'en' ? 'Agent-First Academy & Studios' : 'آکادمی و استودیوهای مهندسی'}
              </span>
            </div>
          </a>

          {isMobile && (
            <button
              type="button"
              onClick={() => setSidebarOpen(false)}
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.08] cursor-pointer"
              aria-label="Close Mobile Menu"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Quick Search Shortcut Inside Sidebar */}
        <button
          type="button"
          onClick={() => {
            setSearchModalOpen(true);
            if (isMobile) setSidebarOpen(false);
          }}
          className="w-full px-3 py-2 rounded-xl border border-slate-200/80 dark:border-white/[0.08] bg-slate-100/70 dark:bg-[#0c121e] hover:border-blue-500/40 transition-all flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 cursor-pointer group"
        >
          <div className="flex items-center gap-2">
            <Search className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-500 transition-colors" />
            <span className="group-hover:text-slate-800 dark:group-hover:text-slate-200">
              {language === 'en' ? 'Search docs, rules, code...' : 'جستجوی مستندات، قوانین و کد...'}
            </span>
          </div>
          <kbd
            dir="ltr"
            className="ltr-inline px-1.5 py-0.5 text-[10px] font-mono font-semibold text-slate-400 bg-white dark:bg-[#090d16] border border-slate-200/80 dark:border-white/[0.08] rounded"
          >
            Ctrl+K
          </kbd>
        </button>

        {/* Overall Mastery Progress Bar Card */}
        <div className="p-3 rounded-xl border border-slate-200/80 dark:border-white/[0.07] bg-slate-50/80 dark:bg-[#0f1624] space-y-2">
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-600 dark:text-slate-300">
            <span>{language === 'en' ? 'Academy Progress' : 'پیشرفت دوره آکادمی'}</span>
            <span dir="ltr" className="ltr-inline font-mono text-emerald-600 dark:text-emerald-400 tabular-nums">
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

        {/* ============================================================ */}
        {/* GROUP 1: سرفصل‌های آموزشی آکادمی (Academy Curriculum - 8 Chapters) */}
        {/* ============================================================ */}
        <div className="rounded-xl border border-slate-200/80 dark:border-white/[0.07] bg-slate-50/40 dark:bg-white/[0.015] overflow-hidden">
          <button
            type="button"
            onClick={() => toggleGroupCollapse('curriculum')}
            className="w-full px-3 py-2.5 flex items-center justify-between text-xs font-bold text-slate-800 dark:text-slate-200 hover:bg-slate-100/70 dark:hover:bg-white/[0.03] transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-blue-500 shrink-0" />
              <span>{language === 'en' ? 'Academy Curriculum' : 'سرفصل‌های آموزشی آکادمی'}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span dir="ltr" className="ltr-inline text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400">
                8 Ch
              </span>
              {collapsedGroups['curriculum'] ? (
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              ) : (
                <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
              )}
            </div>
          </button>

          {!collapsedGroups['curriculum'] && (
            <div className="p-2 pt-0 space-y-3 border-t border-slate-200/60 dark:border-white/[0.04]">
              {[
                {
                  phaseTitle: language === 'en' ? 'Phase 1 · Core Architecture' : 'گام اول · معماری هسته و اجرا',
                  modules: ALL_CURRICULUM_MODULES.slice(0, 3),
                },
                {
                  phaseTitle: language === 'en' ? 'Phase 2 · Context & Automation' : 'گام دوم · قوانین و اتوماسیون',
                  modules: ALL_CURRICULUM_MODULES.slice(3, 6),
                },
                {
                  phaseTitle: language === 'en' ? 'Phase 3 · Scale & Multi-Agent' : 'گام سوم · مقیاس‌پذیری و MCP',
                  modules: ALL_CURRICULUM_MODULES.slice(6, 8),
                },
              ].map((group) => (
                <div key={group.phaseTitle} className="space-y-1 pt-1.5">
                  <div className="px-2 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    {group.phaseTitle}
                  </div>
                  {group.modules.map((mod) => {
                    const isCurrent = activeSection === 'curriculum' && activeModuleId === mod.id;
                    const isDone = completedModules.includes(mod.id);
                    const primaryTitle = language === 'en' ? mod.titleEn : mod.titleFa;

                    return (
                      <button
                        key={mod.id}
                        type="button"
                        onClick={() => handleNavigate('curriculum', mod.id)}
                        className={`w-full ${
                          isRTL ? 'text-right' : 'text-left'
                        } px-2.5 py-2 rounded-lg transition-all flex items-center gap-2 cursor-pointer group ${
                          isCurrent
                            ? 'bg-blue-600/10 dark:bg-blue-500/[0.15] text-blue-600 dark:text-blue-400 font-bold border border-blue-500/25 shadow-2xs'
                            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/[0.04] hover:text-slate-900 dark:hover:text-slate-200 border border-transparent'
                        }`}
                      >
                        <span
                          dir="ltr"
                          className={`ltr-inline text-[11px] font-mono tabular-nums shrink-0 ${
                            isCurrent ? 'text-blue-600 dark:text-blue-400 font-bold' : 'text-slate-400 dark:text-slate-500'
                          }`}
                        >
                          0{mod.number}
                        </span>
                        <span className="text-xs leading-4.5 truncate flex-1">{primaryTitle}</span>
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
          )}
        </div>

        {/* ============================================================ */}
        {/* GROUP 2: استودیوهای مهندسی زنده (Interactive Engineering Studios) */}
        {/* ============================================================ */}
        <div className="rounded-xl border border-slate-200/80 dark:border-white/[0.07] bg-slate-50/40 dark:bg-white/[0.015] overflow-hidden">
          <button
            type="button"
            onClick={() => toggleGroupCollapse('studios')}
            className="w-full px-3 py-2.5 flex items-center justify-between text-xs font-bold text-slate-800 dark:text-slate-200 hover:bg-slate-100/70 dark:hover:bg-white/[0.03] transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>{language === 'en' ? 'Live Engineering Studios' : 'استودیوهای مهندسی زنده'}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span dir="ltr" className="ltr-inline text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                4 St
              </span>
              {collapsedGroups['studios'] ? (
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              ) : (
                <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
              )}
            </div>
          </button>

          {!collapsedGroups['studios'] && (
            <div className="p-2 pt-1.5 space-y-1 border-t border-slate-200/60 dark:border-white/[0.04]">
              {[
                {
                  id: 'simulator' as const,
                  title: language === 'en' ? 'Mission Control Simulator' : 'شبیه‌ساز Mission Control',
                  desc: language === 'en' ? 'Editor View, Agent Manager & policies' : 'محیط دوگانه کدنویسی و مدیریت ایجنت‌ها',
                  icon: Terminal,
                },
                {
                  id: 'guardrails' as const,
                  title: language === 'en' ? 'Rule & Workflow Studio' : 'مهندسی Rule و Workflow',
                  desc: language === 'en' ? '.agent/rules/*.md & // turbo automation' : 'طراحی قوانین ۴ حالته و اتوماسیون توربو',
                  icon: Shield,
                },
                {
                  id: 'mcp' as const,
                  title: language === 'en' ? 'FastMCP Visual Studio' : 'استودیو بصری FastMCP',
                  desc: language === 'en' ? 'mcp_config.json & Python MCP tools' : 'پیکربندی سرورهای پایتون و پروتکل MCP',
                  icon: Cpu,
                },
                {
                  id: 'scenarios' as const,
                  title: language === 'en' ? 'Architecture Scenario Lab' : 'آزمایشگاه سناریوهای معماری',
                  desc: language === 'en' ? '8 real-world production engineering challenges' : '۸ چالش تصمیم‌گیری معمار سیستم',
                  icon: Compass,
                  testId: 'nav-tab-scenarios',
                },
              ].map((st) => {
                const IconComp = st.icon;
                const isCurrent = activeSection === st.id;
                return (
                  <button
                    key={st.id}
                    type="button"
                    data-testid={'testId' in st ? st.testId : undefined}
                    onClick={() => handleNavigate(st.id)}
                    className={`w-full ${
                      isRTL ? 'text-right' : 'text-left'
                    } p-2 rounded-lg transition-all flex items-start gap-2.5 cursor-pointer ${
                      isCurrent
                        ? 'bg-emerald-600/10 dark:bg-emerald-500/[0.15] text-emerald-600 dark:text-emerald-400 font-bold border border-emerald-500/25 shadow-2xs'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/[0.04] hover:text-slate-900 dark:hover:text-slate-200 border border-transparent'
                    }`}
                  >
                    <span className={`p-1.5 rounded-md shrink-0 mt-0.5 ${isCurrent ? 'bg-emerald-500/20 text-emerald-500' : 'bg-slate-200/60 dark:bg-white/[0.05] text-slate-400'}`}>
                      <IconComp className="w-3.5 h-3.5" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-xs font-bold truncate">{st.title}</span>
                      <span className="block text-[10px] text-slate-500 dark:text-slate-400 leading-3.5 mt-0.5 truncate">{st.desc}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* ============================================================ */}
        {/* GROUP 3: پایگاه دانش و هوش مصنوعی (Knowledge & AI Intelligence) */}
        {/* ============================================================ */}
        <div className="rounded-xl border border-slate-200/80 dark:border-white/[0.07] bg-slate-50/40 dark:bg-white/[0.015] overflow-hidden">
          <button
            type="button"
            onClick={() => toggleGroupCollapse('knowledge')}
            className="w-full px-3 py-2.5 flex items-center justify-between text-xs font-bold text-slate-800 dark:text-slate-200 hover:bg-slate-100/70 dark:hover:bg-white/[0.03] transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-indigo-500 shrink-0" />
              <span>{language === 'en' ? 'Knowledge & AI Intelligence' : 'پایگاه دانش و هوش مصنوعی'}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span dir="ltr" className="ltr-inline text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                3 Tools
              </span>
              {collapsedGroups['knowledge'] ? (
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              ) : (
                <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
              )}
            </div>
          </button>

          {!collapsedGroups['knowledge'] && (
            <div className="p-2 pt-1.5 space-y-1 border-t border-slate-200/60 dark:border-white/[0.04]">
              {[
                {
                  id: 'knowledge-base' as const,
                  title: language === 'en' ? 'Knowledge Base & Context Rot' : 'پایگاه دانش و مهار Context Rot',
                  desc: language === 'en' ? 'Inspect memory, D3 heatmaps & context' : 'مدیریت حافظه پایدار و هیت‌مپ سالانه',
                  icon: Database,
                  testId: 'nav-tab-knowledge-base',
                },
                {
                  id: 'ai-architect' as const,
                  title: language === 'en' ? 'AI Architect & Live Docs' : 'دستیار هوشمند و کاوشگر مستندات',
                  desc: language === 'en' ? 'Search grounding & knowledge quizzes' : 'جستجوی مستندات رسمی و آزمون‌ها',
                  icon: Sparkles,
                  testId: 'nav-tab-ai-architect',
                },
                {
                  id: 'cheatsheets' as const,
                  title: language === 'en' ? 'Reference Cheat Sheets & PDF' : 'مرکز چیت‌شیت‌ها و خروجی PDF',
                  desc: language === 'en' ? 'Tables of shortcuts, CLI flags & PDF' : 'جداول شورتکات‌ها، دستورات و PDF',
                  icon: FileSpreadsheet,
                },
              ].map((tool) => {
                const IconComp = tool.icon;
                const isCurrent = activeSection === tool.id;
                return (
                  <button
                    key={tool.id}
                    type="button"
                    data-testid={'testId' in tool ? tool.testId : undefined}
                    onClick={() => handleNavigate(tool.id)}
                    className={`w-full ${
                      isRTL ? 'text-right' : 'text-left'
                    } p-2 rounded-lg transition-all flex items-start gap-2.5 cursor-pointer ${
                      isCurrent
                        ? 'bg-indigo-600/10 dark:bg-indigo-500/[0.15] text-indigo-600 dark:text-indigo-300 font-bold border border-indigo-500/25 shadow-2xs'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/[0.04] hover:text-slate-900 dark:hover:text-slate-200 border border-transparent'
                    }`}
                  >
                    <span className={`p-1.5 rounded-md shrink-0 mt-0.5 ${isCurrent ? 'bg-indigo-500/20 text-indigo-500' : 'bg-slate-200/60 dark:bg-white/[0.05] text-slate-400'}`}>
                      <IconComp className="w-3.5 h-3.5" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-xs font-bold truncate">{tool.title}</span>
                      <span className="block text-[10px] text-slate-500 dark:text-slate-400 leading-3.5 mt-0.5 truncate">{tool.desc}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* ============================================================ */}
        {/* GROUP 4: ارزیابی، کارنامه و میدان نبرد (Mastery & Simulation) */}
        {/* ============================================================ */}
        <div className="rounded-xl border border-slate-200/80 dark:border-white/[0.07] bg-slate-50/40 dark:bg-white/[0.015] overflow-hidden">
          <button
            type="button"
            onClick={() => toggleGroupCollapse('mastery')}
            className="w-full px-3 py-2.5 flex items-center justify-between text-xs font-bold text-slate-800 dark:text-slate-200 hover:bg-slate-100/70 dark:hover:bg-white/[0.03] transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-500 shrink-0" />
              <span>{language === 'en' ? 'Mastery & Gaming' : 'کارنامه، رتبه و شبیه‌ساز'}</span>
            </div>
            {collapsedGroups['mastery'] ? (
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            ) : (
              <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
            )}
          </button>

          {!collapsedGroups['mastery'] && (
            <div className="p-2 pt-1.5 space-y-1 border-t border-slate-200/60 dark:border-white/[0.04]">
              {/* Mastery & Certificate */}
              <button
                type="button"
                data-testid="nav-tab-achievements"
                onClick={() => handleNavigate('achievements')}
                className={`w-full ${
                  isRTL ? 'text-right' : 'text-left'
                } p-2 rounded-lg transition-all flex items-start gap-2.5 cursor-pointer ${
                  activeSection === 'achievements'
                    ? 'bg-amber-600/10 dark:bg-amber-500/[0.15] text-amber-600 dark:text-amber-300 font-bold border border-amber-500/25 shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/[0.04] hover:text-slate-900 dark:hover:text-slate-200 border border-transparent'
                }`}
              >
                <span className={`p-1.5 rounded-md shrink-0 mt-0.5 ${activeSection === 'achievements' ? 'bg-amber-500/20 text-amber-500' : 'bg-slate-200/60 dark:bg-white/[0.05] text-slate-400'}`}>
                  <Award className="w-3.5 h-3.5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-xs font-bold truncate">
                    {language === 'en' ? 'Mastery & Certification' : 'کارنامه مهارت و صدور گواهینامه'}
                  </span>
                  <span className="block text-[10px] text-slate-500 dark:text-slate-400 leading-3.5 mt-0.5 truncate">
                    {language === 'en' ? 'Trophy case, rank standing & printable cert' : 'رتبه مهندسی (Architect)، نشان‌ها و ذخیره در ابر'}
                  </span>
                </span>
              </button>

              {/* 3D Cyber Arena */}
              <button
                type="button"
                data-testid="nav-tab-game-3d"
                onClick={() => handleNavigate('game-3d')}
                className="w-full p-2 rounded-lg border border-amber-500/25 bg-amber-500/[0.06] hover:bg-amber-500/15 transition-all flex items-start gap-2.5 text-xs font-bold text-amber-700 dark:text-amber-300 cursor-pointer"
              >
                <span className="p-1.5 rounded-md shrink-0 mt-0.5 bg-amber-500/20 text-amber-500">
                  <Gamepad2 className="w-3.5 h-3.5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-xs font-bold truncate">
                    {language === 'en' ? '3D Cyber Arena' : 'میدان سه‌بعدی شبیه‌سازی'}
                  </span>
                  <span className="block text-[10px] text-amber-600/80 dark:text-amber-400/80 leading-3.5 mt-0.5 truncate">
                    {language === 'en' ? 'Interactive WebGL agentic defense simulator' : 'شبیه‌ساز گیم دفاع سایبری ایجنت‌محور'}
                  </span>
                </span>
              </button>
            </div>
          )}
        </div>

        {/* ============================================================ */}
        {/* GROUP 5: ابزارهای سیستمی و مدیریت (System & Operations) */}
        {/* ============================================================ */}
        <div className="rounded-xl border border-slate-200/80 dark:border-white/[0.07] bg-slate-50/40 dark:bg-white/[0.015] overflow-hidden">
          <button
            type="button"
            onClick={() => toggleGroupCollapse('system')}
            className="w-full px-3 py-2.5 flex items-center justify-between text-xs font-bold text-slate-800 dark:text-slate-200 hover:bg-slate-100/70 dark:hover:bg-white/[0.03] transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-slate-500 shrink-0" />
              <span>{language === 'en' ? 'System & Telemetry' : 'ابزارهای سیستمی و پایش'}</span>
            </div>
            {collapsedGroups['system'] ? (
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            ) : (
              <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
            )}
          </button>

          {!collapsedGroups['system'] && (
            <div className="p-2 pt-1.5 space-y-1.5 border-t border-slate-200/60 dark:border-white/[0.04]">
              {/* Activity Logger */}
              <button
                type="button"
                onClick={() => {
                  setActivityModalOpen(true);
                  if (isMobile) setSidebarOpen(false);
                }}
                data-testid="open-activity-logger-btn"
                className="w-full p-2 rounded-lg border border-slate-200/80 dark:border-white/[0.06] bg-white dark:bg-[#0c121e] hover:border-indigo-500/40 transition-all flex items-center justify-between text-xs text-slate-700 dark:text-slate-300 cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <Activity className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                  <span>{language === 'en' ? 'Navigation History' : 'تاریخچه ناوبری'}</span>
                </div>
                <span
                  dir="ltr"
                  data-testid="activity-logger-badge-count"
                  className="ltr-inline text-[11px] font-mono font-semibold px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 tabular-nums"
                >
                  {activityLogs.length}
                </span>
              </button>

              {/* Resume Session */}
              {detectedSession && (
                <button
                  type="button"
                  onClick={() => {
                    setResumeModalOpen(true);
                    if (isMobile) setSidebarOpen(false);
                  }}
                  data-testid="open-resume-modal-btn"
                  className="w-full p-2 rounded-lg border border-slate-200/80 dark:border-white/[0.06] bg-white dark:bg-[#0c121e] hover:border-blue-500/40 transition-all flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer"
                >
                  <History className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                  <span>{t('resumeSession')}</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Sidebar Footer & User Standing */}
      <div className="pt-3 border-t border-slate-200/70 dark:border-white/[0.06] space-y-3 shrink-0">
        <div className="p-2.5 rounded-xl border border-slate-200/80 dark:border-white/[0.06] bg-slate-50/70 dark:bg-[#0c121e] flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className="w-7 h-7 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 font-mono text-xs font-bold flex items-center justify-center shrink-0">
              AR
            </span>
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                {language === 'en' ? 'Aria Rostami' : 'آریا رستمی'}
              </span>
              <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">
                Architect · 2900 XP
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <PWAInstallButton />
          </div>
        </div>

        {/* Quick Language & Theme Controls Inside Sidebar */}
        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 px-1">
          <button
            type="button"
            onClick={toggleLanguage}
            data-testid="language-toggle-btn"
            className="flex items-center gap-1 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
          >
            <Globe className="w-3.5 h-3.5" />
            <span>{t('langSwitchBadge')}</span>
          </button>
          <button
            type="button"
            onClick={() => setDarkMode((prev) => !prev)}
            className="flex items-center gap-1 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
          >
            {darkMode ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-slate-500" />}
            <span>{darkMode ? t('themeLight') : t('themeDark')}</span>
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div
      id="top"
      dir={isRTL ? 'rtl' : 'ltr'}
      className="h-screen overflow-hidden flex flex-col bg-[#f8fafc] dark:bg-[#090d16] text-slate-900 dark:text-slate-100 transition-colors"
    >
      {/* Precision Top Header with Dynamic Breadcrumb & Essential Controls */}
      <header className="sticky top-0 z-30 h-14 border-b border-slate-200/80 dark:border-white/[0.08] bg-white/95 dark:bg-[#090d16]/95 backdrop-blur-xl transition-colors">
        <div className="h-full px-3 sm:px-6 max-w-[1700px] mx-auto flex items-center justify-between gap-3">
          {/* Start: Sidebar Toggle & Hierarchical Breadcrumbs */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setSidebarOpen((prev) => !prev)}
              className={`h-8 sm:h-9 px-2.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                sidebarOpen
                  ? 'border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-blue-400'
                  : 'border-slate-200/80 dark:border-white/[0.08] bg-slate-100/70 dark:bg-[#0c121e] text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
              aria-label="Toggle Side Menu"
              title={sidebarOpen ? (language === 'en' ? 'Collapse Menu (Ctrl+B)' : 'بستن منو (Ctrl+B)') : (language === 'en' ? 'Expand Menu (Ctrl+B)' : 'باز کردن منو (Ctrl+B)')}
            >
              {sidebarOpen ? (
                <PanelRightClose className="w-4 h-4 text-blue-500 shrink-0" />
              ) : (
                <PanelRightOpen className="w-4 h-4 text-slate-400 shrink-0" />
              )}
              <span className="hidden sm:inline text-xs">{language === 'en' ? 'Menu' : 'منوی جامع'}</span>
            </button>

            <span className="h-4 w-px bg-slate-200 dark:bg-white/[0.08] shrink-0" aria-hidden="true" />

            {/* Hierarchical Breadcrumb */}
            <nav aria-label="Breadcrumb Navigation" className="flex items-center gap-1.5 text-xs min-w-0 overflow-hidden">
              <span className="font-semibold text-slate-400 dark:text-slate-500 truncate hidden sm:inline">
                {activeBreadcrumb.group}
              </span>
              <span className="text-slate-300 dark:text-slate-700 hidden sm:inline" aria-hidden="true">/</span>
              {activeBreadcrumb.subgroup && (
                <>
                  <span className="text-slate-500 dark:text-slate-400 truncate hidden md:inline">
                    {activeBreadcrumb.subgroup}
                  </span>
                  <span className="text-slate-300 dark:text-slate-700 hidden md:inline" aria-hidden="true">/</span>
                </>
              )}
              <span className="font-bold text-slate-800 dark:text-slate-100 truncate">
                {activeBreadcrumb.item}
              </span>
            </nav>
          </div>

          {/* End: Quick Search, Pomodoro, XP Badge & Controls */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Quick Search Ctrl+K Button */}
            <button
              type="button"
              onClick={() => setSearchModalOpen(true)}
              className="h-8 px-2.5 sm:px-3 rounded-lg border border-slate-200/90 dark:border-white/[0.08] bg-slate-100/75 dark:bg-[#0c121e] hover:border-blue-500/40 transition-all flex items-center gap-2 cursor-pointer group shrink-0"
              title={language === 'en' ? 'Quick Search (Ctrl+K)' : 'جستجوی سریع (Ctrl+K)'}
            >
              <Search className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-500 transition-colors shrink-0" />
              <span className="hidden xl:inline text-xs text-slate-500 dark:text-slate-400 group-hover:text-slate-800 dark:group-hover:text-slate-200">
                {language === 'en' ? 'Search...' : 'جستجو...'}
              </span>
              <kbd
                dir="ltr"
                className="ltr-inline hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono font-semibold text-slate-500 dark:text-slate-400 bg-white dark:bg-[#090d16] border border-slate-200/80 dark:border-white/[0.08] rounded shrink-0"
              >
                Ctrl+K
              </kbd>
            </button>

            {/* Pomodoro Timer */}
            <div className="hidden lg:block">
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

            {/* Rank / XP Pill */}
            <div
              dir="ltr"
              className="ltr-inline hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-blue-500/25 bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs font-mono font-bold"
            >
              <span>LVL 4</span>
              <span className="opacity-40">·</span>
              <span>2900 XP</span>
            </div>

            {/* Quick Header Utility Deck */}
            <div className="h-8 px-1 rounded-lg border border-slate-200/80 dark:border-white/[0.08] bg-slate-100/75 dark:bg-[#0c121e] flex items-center gap-0.5 shrink-0">
              <button
                type="button"
                onClick={toggleLanguage}
                title={t('langSwitchLabel')}
                aria-label={language === 'fa' ? 'Switch interface to English' : 'تغییر رابط کاربری به فارسی'}
                className="h-6.5 px-1.5 rounded text-xs font-semibold text-slate-600 dark:text-slate-300 flex items-center gap-1 cursor-pointer hover:bg-white dark:hover:bg-white/[0.08] transition-colors whitespace-nowrap"
              >
                <Globe className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="font-mono text-[11px]">{t('langSwitchBadge')}</span>
              </button>

              <button
                type="button"
                onClick={() => setDarkMode((prev) => !prev)}
                className="h-6.5 w-6.5 rounded inline-flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-white/[0.08] transition-colors cursor-pointer shrink-0"
                aria-label="Toggle Dark or Light Mode"
                title={darkMode ? t('themeLight') : t('themeDark')}
              >
                {darkMode ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-slate-600" />}
                <span className="sr-only">{darkMode ? t('themeLight') : t('themeDark')}</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Fluid Widescreen Workspace Grid */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* Mobile Slide-over Drawer (< md) */}
        {sidebarOpen && (
          <div className="fixed inset-0 z-50 md:hidden flex">
            {/* Dark Backdrop */}
            <div
              className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
              onClick={() => setSidebarOpen(false)}
              aria-hidden="true"
            />
            {/* Drawer Surface */}
            <aside
              aria-label="Mobile Navigation Drawer"
              className={`relative z-10 w-80 max-w-[85vw] h-full bg-white dark:bg-[#0b101b] ${
                isRTL ? 'border-l' : 'border-r'
              } border-slate-200/80 dark:border-white/[0.08] p-4 overflow-y-auto flex flex-col justify-between shadow-2xl`}
            >
              {renderComprehensiveSidebarContent(true)}
            </aside>
          </div>
        )}

        {/* Desktop Persistent, Comprehensive Sidebar (md:) */}
        {sidebarOpen && (
          <aside
            aria-label="Comprehensive Sidebar Navigation"
            className={`w-72 lg:w-80 shrink-0 h-full ${
              isRTL ? 'border-l' : 'border-r'
            } border-slate-200/80 dark:border-white/[0.07] bg-white dark:bg-[#0b101b] p-3.5 overflow-y-auto flex flex-col justify-between gap-6 hidden md:flex`}
          >
            {renderComprehensiveSidebarContent(false)}
          </aside>
        )}

        {/* Main Content Viewport */}
        <main className="flex-1 min-w-0 h-full overflow-x-hidden overflow-y-auto flex flex-col justify-between">
          {/* Mobile Quick Action Pill (< md) */}
          <div className="md:hidden border-b border-slate-200/70 dark:border-white/[0.06] bg-white/80 dark:bg-[#0c121e]/80 px-3 py-2 flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 text-xs truncate">
              <span className="font-bold text-blue-600 dark:text-blue-400">{activeBreadcrumb.group}</span>
              <span className="opacity-40" aria-hidden="true">/</span>
              <span className="text-slate-700 dark:text-slate-200 truncate">{activeBreadcrumb.item}</span>
            </div>
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="px-2.5 py-1 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs font-semibold shrink-0 cursor-pointer flex items-center gap-1"
            >
              <Menu className="w-3.5 h-3.5" />
              <span>{language === 'en' ? 'All Menus' : 'منوی جامع'}</span>
            </button>
          </div>

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

