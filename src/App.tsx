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
  ChevronLeft,
  Glasses,
  Minimize2,
  Share2,
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
  computeReadingEstimateForModule,
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
import { InviteShareModal } from './components/InviteShareModal';

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
  const [inviteModalOpen, setInviteModalOpen] = useState<boolean>(false);
  const [userBonusXp, setUserBonusXp] = useState<number>(0);

  // Comprehensive Sidebar Groups State (Default: all closed per user request)
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});
  const toggleGroup = (key: string) => {
    setOpenGroups((prev) => ({ ...prev, [key]: !prev[key] }));
  };
  const expandAllGroups = () => {
    setOpenGroups({
      curriculum: true,
      studios: true,
      knowledge: true,
      mastery: true,
      system: true,
    });
  };
  const collapseAllGroups = () => {
    setOpenGroups({});
  };

  // Quick Study Mode State (Distraction-free reading view)
  const [isStudyMode, setIsStudyMode] = useState<boolean>(false);
  const toggleQuickStudyMode = () => {
    if (!isStudyMode) {
      setIsStudyMode(true);
      setSidebarOpen(false);
      collapseAllGroups();
      setActiveSection('curriculum');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      setIsStudyMode(false);
    }
  };

  const handleNavigate = (section: ActiveWorkspaceSection, moduleId?: string) => {
    setActiveSection(section);
    if (moduleId) {
      setActiveModuleId(moduleId);
    }
    // Auto-expand the active section's group so user sees where they are
    if (section === 'curriculum') {
      setOpenGroups((prev) => ({ ...prev, curriculum: true }));
    } else if (['simulator', 'guardrails', 'mcp', 'scenarios'].includes(section)) {
      setOpenGroups((prev) => ({ ...prev, studios: true }));
    } else if (['knowledge-base', 'ai-architect', 'cheatsheets'].includes(section)) {
      setOpenGroups((prev) => ({ ...prev, knowledge: true }));
    } else if (section === 'achievements') {
      setOpenGroups((prev) => ({ ...prev, mastery: true }));
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
      if (e.key === 'Escape' && isStudyMode) {
        setIsStudyMode(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isStudyMode]);

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
    <div className="flex flex-col h-full justify-between gap-5 text-slate-800 dark:text-slate-200">
      <div className="space-y-4">
        {/* Brand & Mobile Close */}
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-200/80 dark:border-white/[0.08]">
          <a
            href="#top"
            onClick={(e) => {
              e.preventDefault();
              handleNavigate('curriculum');
            }}
            className="flex items-center gap-2.5 group focus:outline-none min-w-0"
          >
            <div className="relative">
              <div className="absolute -inset-0.5 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 opacity-60 blur-xs group-hover:opacity-100 transition-opacity" />
              <div className="relative flex items-center justify-center w-8 h-8 rounded-xl bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-600 text-white font-mono text-xs font-black shadow-md shadow-blue-500/25 ring-1 ring-white/20 group-hover:scale-105 transition-transform shrink-0">
                AG
              </div>
            </div>
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-extrabold tracking-tight text-slate-900 dark:text-white whitespace-nowrap">
                  {language === 'en' ? 'Google Antigravity' : 'گوگل آنتی‌گرویتی'}
                </span>
                <span className="text-[9px] font-mono px-1 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold border border-blue-500/25 shadow-2xs">
                  PRO
                </span>
              </div>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 truncate font-mono">
                {language === 'en' ? 'Agent-First Architecture Workbench' : 'آکادمی و استودیوهای مهندسی ایجنت'}
              </span>
            </div>
          </a>

          {isMobile && (
            <button
              type="button"
              onClick={() => setSidebarOpen(false)}
              className="p-1.5 rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.08] cursor-pointer transition-colors"
              aria-label="Close Mobile Menu"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Quick Search Shortcut Inside Sidebar (Raycast / Linear style) */}
        <button
          type="button"
          onClick={() => {
            setSearchModalOpen(true);
            if (isMobile) setSidebarOpen(false);
          }}
          className="w-full px-3 py-2 rounded-xl border border-slate-200/90 dark:border-white/[0.08] bg-slate-100/80 dark:bg-white/[0.03] hover:bg-white dark:hover:bg-white/[0.06] hover:border-blue-500/40 hover:shadow-sm transition-all flex items-center justify-between text-xs text-slate-600 dark:text-slate-400 cursor-pointer group shadow-2xs"
        >
          <div className="flex items-center gap-2 min-w-0">
            <Search className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-500 transition-colors shrink-0" />
            <span className="group-hover:text-slate-900 dark:group-hover:text-slate-200 truncate font-medium">
              {language === 'en' ? 'Search docs, rules, code...' : 'جستجوی مستندات، قوانین و کد...'}
            </span>
          </div>
          <kbd
            dir="ltr"
            className="ltr-inline px-1.5 py-0.5 text-[10px] font-mono font-semibold text-slate-500 dark:text-slate-400 bg-white dark:bg-[#090d16] border border-slate-200/90 dark:border-white/[0.1] rounded shrink-0 shadow-2xs"
          >
            Ctrl+K
          </kbd>
        </button>

        {/* Overall Mastery Progress Bar Card */}
        <div className="p-3.5 rounded-2xl border border-slate-200/80 dark:border-blue-500/15 bg-gradient-to-br from-slate-50 via-white to-slate-100/80 dark:from-[#0d1424] dark:via-[#0b101c] dark:to-[#080d17] space-y-2.5 shadow-2xs">
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-700 dark:text-slate-200">
            <div className="flex items-center gap-1.5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span>{language === 'en' ? 'Curriculum Mastery' : 'روند تسلط بر آکادمی'}</span>
            </div>
            <span dir="ltr" className="ltr-inline font-mono text-emerald-600 dark:text-emerald-400 tabular-nums font-extrabold">
              {completedModules.length}/8 ({completionPercent}%)
            </span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-slate-200/80 dark:bg-white/[0.06] overflow-hidden p-0.5">
            <div
              className="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-emerald-400 rounded-full transition-all duration-500 shadow-xs shadow-blue-500/40"
              style={{ width: `${completionPercent}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 font-mono pt-0.5">
            <span className="tabular-nums">LVL 4 · 2900 XP</span>
            <span className="text-amber-500 dark:text-amber-400 font-semibold flex items-center gap-1">
              <Award className="w-3 h-3 text-amber-500 inline shrink-0" />
              <span>Architect Rank</span>
            </span>
          </div>
        </div>

        {/* Navigation Groups Header & Quick Master Toggles */}
        <div className="flex items-center justify-between px-1 pt-1 text-[11px] font-bold text-slate-500 dark:text-slate-400">
          <span className="uppercase tracking-wider">
            {language === 'en' ? 'Workspaces & Modules' : 'سرفصل‌ها و استودیوها'}
          </span>
          <div className="flex items-center gap-1.5 font-mono text-[10px]">
            <button
              type="button"
              onClick={expandAllGroups}
              className="px-1.5 py-0.5 rounded hover:bg-slate-200/60 dark:hover:bg-white/[0.08] hover:text-slate-800 dark:hover:text-white transition-colors cursor-pointer"
              title={language === 'en' ? 'Expand All Groups' : 'باز کردن همه بخش‌ها'}
            >
              {language === 'en' ? 'Expand All' : 'باز کردن همه'}
            </button>
            <span className="text-slate-300 dark:text-slate-700">·</span>
            <button
              type="button"
              onClick={collapseAllGroups}
              className="px-1.5 py-0.5 rounded hover:bg-slate-200/60 dark:hover:bg-white/[0.08] hover:text-slate-800 dark:hover:text-white transition-colors cursor-pointer"
              title={language === 'en' ? 'Collapse All Groups' : 'بستن همه بخش‌ها'}
            >
              {language === 'en' ? 'Collapse All' : 'بستن همه'}
            </button>
          </div>
        </div>

        {/* ============================================================ */}
        {/* GROUP 1: سرفصل‌های آموزشی آکادمی (Academy Curriculum - 8 Chapters) */}
        {/* ============================================================ */}
        {(() => {
          const isOpen = !!openGroups['curriculum'];
          const isGroupActive = activeSection === 'curriculum';
          return (
            <div
              className={`rounded-2xl border transition-all duration-300 overflow-hidden shadow-2xs ${
                isOpen
                  ? 'border-blue-500/40 dark:border-blue-500/30 bg-blue-500/[0.03] dark:bg-blue-950/15 ring-1 ring-blue-500/20'
                  : 'border-slate-200/80 dark:border-white/[0.07] bg-white/80 dark:bg-white/[0.02] hover:border-slate-300 dark:hover:border-white/[0.12]'
              }`}
            >
              <button
                type="button"
                onClick={() => toggleGroup('curriculum')}
                className="w-full px-3 py-2.5 flex items-center justify-between text-xs font-bold text-slate-800 dark:text-slate-200 hover:bg-blue-500/[0.04] transition-colors cursor-pointer group"
                aria-expanded={isOpen}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className={`p-1 rounded-lg transition-colors ring-1 ${
                      isOpen
                        ? 'bg-blue-600 text-white ring-blue-600 shadow-xs shadow-blue-500/30'
                        : 'bg-blue-500/10 text-blue-500 ring-blue-500/20 group-hover:bg-blue-500/20'
                    }`}
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                  </span>
                  <span className="truncate">{language === 'en' ? 'Academy Curriculum' : 'سرفصل‌های آموزشی آکادمی'}</span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  {!isOpen && isGroupActive && (
                    <span
                      dir="ltr"
                      className="ltr-inline flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-mono font-bold bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                      0{currentModule.number}
                    </span>
                  )}
                  <span
                    dir="ltr"
                    className="ltr-inline text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400"
                  >
                    8 Ch
                  </span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-300 ease-out ${
                      isOpen ? 'rotate-180 text-blue-500 dark:text-blue-400' : ''
                    }`}
                  />
                </div>
              </button>

              <div
                className={`grid transition-[grid-template-rows,opacity] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                  isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0 pointer-events-none'
                }`}
              >
                <div className="overflow-hidden">
                  <div className="p-2 pt-0 space-y-3.5 border-t border-slate-200/60 dark:border-white/[0.04]">
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
                      <div key={group.phaseTitle} className="space-y-1 pt-2">
                        <div className="px-2 text-[10px] font-extrabold uppercase tracking-widest text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-500/70" />
                          <span>{group.phaseTitle}</span>
                        </div>
                        <div className="border-s-2 border-blue-500/20 dark:border-blue-500/15 ms-2.5 ps-2.5 space-y-1">
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
                                } px-2.5 py-2 rounded-xl transition-all flex items-start gap-2.5 cursor-pointer group ${
                                  isCurrent
                                    ? 'bg-gradient-to-r from-blue-600/15 via-blue-500/10 to-transparent text-blue-600 dark:text-blue-300 font-bold border border-blue-500/30 shadow-2xs'
                                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100/80 dark:hover:bg-white/[0.04] hover:text-slate-900 dark:hover:text-slate-200 border border-transparent'
                                }`}
                              >
                                <span
                                  dir="ltr"
                                  className={`ltr-inline w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-mono font-bold shrink-0 mt-0.5 ${
                                    isCurrent
                                      ? 'bg-blue-600 text-white shadow-xs shadow-blue-500/30'
                                      : 'bg-slate-100 dark:bg-white/[0.06] text-slate-500 dark:text-slate-400 border border-slate-200/80 dark:border-white/[0.08] group-hover:border-blue-500/30 group-hover:text-blue-500'
                                  }`}
                                >
                                  0{mod.number}
                                </span>
                                <span className="text-xs leading-snug line-clamp-2 text-start flex-1 font-medium group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
                                  {primaryTitle}
                                </span>
                                {isDone ? (
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5 drop-shadow-xs" />
                                ) : (
                                  <Circle className="w-3.5 h-3.5 text-slate-300 dark:text-slate-700 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-0.5" />
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

        {/* ============================================================ */}
        {/* GROUP 2: استودیوهای مهندسی زنده (Interactive Engineering Studios) */}
        {/* ============================================================ */}
        {(() => {
          const isOpen = !!openGroups['studios'];
          const isGroupActive = ['simulator', 'guardrails', 'mcp', 'scenarios'].includes(activeSection);
          return (
            <div
              className={`rounded-2xl border transition-all duration-300 overflow-hidden shadow-2xs ${
                isOpen
                  ? 'border-emerald-500/40 dark:border-emerald-500/30 bg-emerald-500/[0.03] dark:bg-emerald-950/15 ring-1 ring-emerald-500/20'
                  : 'border-slate-200/80 dark:border-white/[0.07] bg-white/80 dark:bg-white/[0.02] hover:border-slate-300 dark:hover:border-white/[0.12]'
              }`}
            >
              <button
                type="button"
                onClick={() => toggleGroup('studios')}
                className="w-full px-3 py-2.5 flex items-center justify-between text-xs font-bold text-slate-800 dark:text-slate-200 hover:bg-emerald-500/[0.04] transition-colors cursor-pointer group"
                aria-expanded={isOpen}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className={`p-1 rounded-lg transition-colors ring-1 ${
                      isOpen
                        ? 'bg-emerald-600 text-white ring-emerald-600 shadow-xs shadow-emerald-500/30'
                        : 'bg-emerald-500/10 text-emerald-500 ring-emerald-500/20 group-hover:bg-emerald-500/20'
                    }`}
                  >
                    <Terminal className="w-3.5 h-3.5" />
                  </span>
                  <span className="truncate">{language === 'en' ? 'Live Engineering Studios' : 'استودیوهای مهندسی زنده'}</span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  {!isOpen && isGroupActive && (
                    <span
                      dir="ltr"
                      className="ltr-inline flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-mono font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      Live
                    </span>
                  )}
                  <span
                    dir="ltr"
                    className="ltr-inline text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                  >
                    4 St
                  </span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-300 ease-out ${
                      isOpen ? 'rotate-180 text-emerald-500 dark:text-emerald-400' : ''
                    }`}
                  />
                </div>
              </button>

              <div
                className={`grid transition-[grid-template-rows,opacity] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                  isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0 pointer-events-none'
                }`}
              >
                <div className="overflow-hidden">
                  <div className="p-2 pt-1.5 space-y-1.5 border-t border-slate-200/60 dark:border-white/[0.04]">
                    {[
                      {
                        id: 'simulator' as const,
                        title: language === 'en' ? 'Mission Control Simulator' : 'شبیه‌ساز Mission Control',
                        desc: language === 'en' ? 'Dual-surface Editor & Agent Manager' : 'محیط دوگانه کدنویسی و مدیریت ایجنت‌ها',
                        tag: 'Live IDE',
                        icon: Terminal,
                        colorClass: 'text-blue-500 bg-blue-500/10 ring-blue-500/25',
                      },
                      {
                        id: 'guardrails' as const,
                        title: language === 'en' ? 'Rule & Workflow Studio' : 'مهندسی Rule و Workflow',
                        desc: language === 'en' ? '.agent/rules/*.md & // turbo directives' : 'طراحی قوانین ۴ حالته و اتوماسیون توربو',
                        tag: 'Turbo Rules',
                        icon: Shield,
                        colorClass: 'text-violet-500 bg-violet-500/10 ring-violet-500/25',
                      },
                      {
                        id: 'mcp' as const,
                        title: language === 'en' ? 'FastMCP Visual Studio' : 'استودیو بصری FastMCP',
                        desc: language === 'en' ? 'mcp_config.json & Python MCP servers' : 'پیکربندی سرورهای پایتون و پروتکل MCP',
                        tag: 'MCP Hub',
                        icon: Cpu,
                        colorClass: 'text-emerald-500 bg-emerald-500/10 ring-emerald-500/25',
                      },
                      {
                        id: 'scenarios' as const,
                        title: language === 'en' ? 'Architecture Scenario Lab' : 'آزمایشگاه سناریوهای معماری',
                        desc: language === 'en' ? '8 real-world production engineering decisions' : '۸ چالش تصمیم‌گیری معمار سیستم',
                        tag: '8 Labs',
                        icon: Compass,
                        colorClass: 'text-amber-500 bg-amber-500/10 ring-amber-500/25',
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
                          } p-2 rounded-xl transition-all flex items-start gap-2.5 cursor-pointer ${
                            isCurrent
                              ? 'bg-emerald-600/10 dark:bg-emerald-500/[0.14] text-emerald-600 dark:text-emerald-300 font-bold border border-emerald-500/35 shadow-xs'
                              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/[0.04] hover:text-slate-900 dark:hover:text-slate-200 border border-transparent'
                          }`}
                        >
                          <span className={`p-1.5 rounded-lg shrink-0 mt-0.5 ring-1 ${st.colorClass}`}>
                            <IconComp className="w-3.5 h-3.5" />
                          </span>
                          <span className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-1">
                              <span className="text-xs font-bold truncate">{st.title}</span>
                              <span dir="ltr" className="ltr-inline text-[9px] font-mono px-1.5 py-0.2 rounded bg-slate-100 dark:bg-white/[0.06] text-slate-500 dark:text-slate-400 shrink-0">
                                {st.tag}
                              </span>
                            </div>
                            <span className="block text-[10px] text-slate-500 dark:text-slate-400 leading-3.5 mt-0.5 truncate font-mono">
                              {st.desc}
                            </span>
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

        {/* ============================================================ */}
        {/* GROUP 3: پایگاه دانش و هوش مصنوعی (Knowledge & AI Intelligence) */}
        {/* ============================================================ */}
        {(() => {
          const isOpen = !!openGroups['knowledge'];
          const isGroupActive = ['knowledge-base', 'ai-architect', 'cheatsheets'].includes(activeSection);
          return (
            <div
              className={`rounded-2xl border transition-all duration-300 overflow-hidden shadow-2xs ${
                isOpen
                  ? 'border-indigo-500/40 dark:border-indigo-500/30 bg-indigo-500/[0.03] dark:bg-indigo-950/15 ring-1 ring-indigo-500/20'
                  : 'border-slate-200/80 dark:border-white/[0.07] bg-white/80 dark:bg-white/[0.02] hover:border-slate-300 dark:hover:border-white/[0.12]'
              }`}
            >
              <button
                type="button"
                onClick={() => toggleGroup('knowledge')}
                className="w-full px-3 py-2.5 flex items-center justify-between text-xs font-bold text-slate-800 dark:text-slate-200 hover:bg-indigo-500/[0.04] transition-colors cursor-pointer group"
                aria-expanded={isOpen}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className={`p-1 rounded-lg transition-colors ring-1 ${
                      isOpen
                        ? 'bg-indigo-600 text-white ring-indigo-600 shadow-xs shadow-indigo-500/30'
                        : 'bg-indigo-500/10 text-indigo-500 ring-indigo-500/20 group-hover:bg-indigo-500/20'
                    }`}
                  >
                    <Database className="w-3.5 h-3.5" />
                  </span>
                  <span className="truncate">{language === 'en' ? 'Knowledge & AI Intelligence' : 'پایگاه دانش و هوش مصنوعی'}</span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  {!isOpen && isGroupActive && (
                    <span
                      dir="ltr"
                      className="ltr-inline flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-mono font-bold bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                      Active
                    </span>
                  )}
                  <span
                    dir="ltr"
                    className="ltr-inline text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400"
                  >
                    3 Tools
                  </span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-300 ease-out ${
                      isOpen ? 'rotate-180 text-indigo-500 dark:text-indigo-400' : ''
                    }`}
                  />
                </div>
              </button>

              <div
                className={`grid transition-[grid-template-rows,opacity] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                  isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0 pointer-events-none'
                }`}
              >
                <div className="overflow-hidden">
                  <div className="p-2 pt-1.5 space-y-1.5 border-t border-slate-200/60 dark:border-white/[0.04]">
                    {[
                      {
                        id: 'knowledge-base' as const,
                        title: language === 'en' ? 'Knowledge Base & Context Rot' : 'پایگاه دانش و مهار Context Rot',
                        desc: language === 'en' ? 'Memory pruning, D3 heatmaps & telemetry' : 'مدیریت حافظه پایدار و هیت‌مپ سالانه',
                        tag: 'Memory',
                        icon: Database,
                        testId: 'nav-tab-knowledge-base',
                        colorClass: 'text-indigo-500 bg-indigo-500/10 ring-indigo-500/25',
                      },
                      {
                        id: 'ai-architect' as const,
                        title: language === 'en' ? 'AI Architect & Live Docs' : 'دستیار هوشمند و کاوشگر مستندات',
                        desc: language === 'en' ? 'Official grounding & interactive quizzes' : 'جستجوی مستندات رسمی و آزمون‌ها',
                        tag: 'Grounding',
                        icon: Sparkles,
                        testId: 'nav-tab-ai-architect',
                        colorClass: 'text-violet-500 bg-violet-500/10 ring-violet-500/25',
                      },
                      {
                        id: 'cheatsheets' as const,
                        title: language === 'en' ? 'Reference Cheat Sheets & PDF' : 'مرکز چیت‌شیت‌ها و خروجی PDF',
                        desc: language === 'en' ? 'Shortcuts, CLI matrices & clean exports' : 'جداول شورتکات‌ها، دستورات و PDF',
                        tag: 'Tables & PDF',
                        icon: FileSpreadsheet,
                        colorClass: 'text-rose-500 bg-rose-500/10 ring-rose-500/25',
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
                          } p-2 rounded-xl transition-all flex items-start gap-2.5 cursor-pointer ${
                            isCurrent
                              ? 'bg-indigo-600/10 dark:bg-indigo-500/[0.14] text-indigo-600 dark:text-indigo-300 font-bold border border-indigo-500/35 shadow-xs'
                              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/[0.04] hover:text-slate-900 dark:hover:text-slate-200 border border-transparent'
                          }`}
                        >
                          <span className={`p-1.5 rounded-lg shrink-0 mt-0.5 ring-1 ${tool.colorClass}`}>
                            <IconComp className="w-3.5 h-3.5" />
                          </span>
                          <span className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-1">
                              <span className="text-xs font-bold truncate">{tool.title}</span>
                              <span dir="ltr" className="ltr-inline text-[9px] font-mono px-1.5 py-0.2 rounded bg-slate-100 dark:bg-white/[0.06] text-slate-500 dark:text-slate-400 shrink-0">
                                {tool.tag}
                              </span>
                            </div>
                            <span className="block text-[10px] text-slate-500 dark:text-slate-400 leading-3.5 mt-0.5 truncate font-mono">
                              {tool.desc}
                            </span>
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

        {/* ============================================================ */}
        {/* GROUP 4: ارزیابی، کارنامه و میدان نبرد (Mastery & Simulation) */}
        {/* ============================================================ */}
        {(() => {
          const isOpen = !!openGroups['mastery'];
          const isGroupActive = activeSection === 'achievements';
          return (
            <div
              className={`rounded-2xl border transition-all duration-300 overflow-hidden shadow-2xs ${
                isOpen
                  ? 'border-amber-500/40 dark:border-amber-500/30 bg-amber-500/[0.03] dark:bg-amber-950/15 ring-1 ring-amber-500/20'
                  : 'border-slate-200/80 dark:border-white/[0.07] bg-white/80 dark:bg-white/[0.02] hover:border-slate-300 dark:hover:border-white/[0.12]'
              }`}
            >
              <button
                type="button"
                onClick={() => toggleGroup('mastery')}
                className="w-full px-3 py-2.5 flex items-center justify-between text-xs font-bold text-slate-800 dark:text-slate-200 hover:bg-amber-500/[0.04] transition-colors cursor-pointer group"
                aria-expanded={isOpen}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className={`p-1 rounded-lg transition-colors ring-1 ${
                      isOpen
                        ? 'bg-amber-600 text-white ring-amber-600 shadow-xs shadow-amber-500/30'
                        : 'bg-amber-500/10 text-amber-500 ring-amber-500/20 group-hover:bg-amber-500/20'
                    }`}
                  >
                    <Award className="w-3.5 h-3.5" />
                  </span>
                  <span className="truncate">{language === 'en' ? 'Mastery & Gaming' : 'کارنامه، رتبه و شبیه‌ساز'}</span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  {!isOpen && isGroupActive && (
                    <span
                      dir="ltr"
                      className="ltr-inline flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-mono font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                      Active
                    </span>
                  )}
                  <ChevronDown
                    className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-300 ease-out ${
                      isOpen ? 'rotate-180 text-amber-500 dark:text-amber-400' : ''
                    }`}
                  />
                </div>
              </button>

              <div
                className={`grid transition-[grid-template-rows,opacity] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                  isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0 pointer-events-none'
                }`}
              >
                <div className="overflow-hidden">
                  <div className="p-2 pt-1.5 space-y-1.5 border-t border-slate-200/60 dark:border-white/[0.04]">
                    {/* Mastery & Certificate */}
                    <button
                      type="button"
                      data-testid="nav-tab-achievements"
                      onClick={() => handleNavigate('achievements')}
                      className={`w-full ${
                        isRTL ? 'text-right' : 'text-left'
                      } p-2 rounded-xl transition-all flex items-start gap-2.5 cursor-pointer ${
                        activeSection === 'achievements'
                          ? 'bg-amber-600/10 dark:bg-amber-500/[0.14] text-amber-600 dark:text-amber-300 font-bold border border-amber-500/35 shadow-xs'
                          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/[0.04] hover:text-slate-900 dark:hover:text-slate-200 border border-transparent'
                      }`}
                    >
                      <span className="p-1.5 rounded-lg shrink-0 mt-0.5 text-amber-500 bg-amber-500/10 ring-1 ring-amber-500/25">
                        <Award className="w-3.5 h-3.5" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-xs font-bold truncate">
                            {language === 'en' ? 'Mastery & Certification' : 'کارنامه مهارت و صدور گواهینامه'}
                          </span>
                          <span dir="ltr" className="ltr-inline text-[9px] font-mono px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 shrink-0 font-bold">
                            Cert
                          </span>
                        </div>
                        <span className="block text-[10px] text-slate-500 dark:text-slate-400 leading-3.5 mt-0.5 truncate font-mono">
                          {language === 'en' ? 'Trophy case, rank standing & printable cert' : 'رتبه مهندسی (Architect)، نشان‌ها و ابر'}
                        </span>
                      </span>
                    </button>

                    {/* 3D Cyber Arena */}
                    <button
                      type="button"
                      data-testid="nav-tab-game-3d"
                      onClick={() => handleNavigate('game-3d')}
                      className="w-full p-2.5 rounded-xl border border-amber-500/35 bg-gradient-to-r from-amber-500/[0.1] via-amber-500/[0.05] to-transparent hover:from-amber-500/[0.18] transition-all flex items-start gap-2.5 text-xs font-bold text-amber-800 dark:text-amber-300 cursor-pointer shadow-xs group"
                    >
                      <span className="p-1.5 rounded-lg shrink-0 mt-0.5 bg-amber-500/20 text-amber-500 ring-1 ring-amber-500/35 group-hover:scale-105 transition-transform">
                        <Gamepad2 className="w-3.5 h-3.5" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-xs font-bold truncate">
                            {language === 'en' ? '3D Cyber Arena' : 'میدان سه‌بعدی شبیه‌سازی'}
                          </span>
                          <span dir="ltr" className="ltr-inline text-[9px] font-mono px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-600 dark:text-amber-400 font-bold shrink-0">
                            WebGL
                          </span>
                        </div>
                        <span className="block text-[10px] text-amber-700/90 dark:text-amber-400/90 leading-3.5 mt-0.5 truncate font-mono">
                          {language === 'en' ? 'Interactive WebGL agentic defense simulator' : 'شبیه‌ساز گیم دفاع سایبری ایجنت‌محور'}
                        </span>
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

        {/* ============================================================ */}
        {/* GROUP 5: ابزارهای سیستمی و مدیریت (System & Operations) */}
        {/* ============================================================ */}
        {(() => {
          const isOpen = !!openGroups['system'];
          return (
            <div
              className={`rounded-2xl border transition-all duration-300 overflow-hidden shadow-2xs ${
                isOpen
                  ? 'border-cyan-500/40 dark:border-cyan-500/30 bg-cyan-500/[0.03] dark:bg-cyan-950/15 ring-1 ring-cyan-500/20'
                  : 'border-slate-200/80 dark:border-white/[0.07] bg-white/80 dark:bg-white/[0.02] hover:border-slate-300 dark:hover:border-white/[0.12]'
              }`}
            >
              <button
                type="button"
                onClick={() => toggleGroup('system')}
                className="w-full px-3 py-2.5 flex items-center justify-between text-xs font-bold text-slate-800 dark:text-slate-200 hover:bg-cyan-500/[0.04] transition-colors cursor-pointer group"
                aria-expanded={isOpen}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className={`p-1 rounded-lg transition-colors ring-1 ${
                      isOpen
                        ? 'bg-cyan-600 text-white ring-cyan-600 shadow-xs shadow-cyan-500/30'
                        : 'bg-cyan-500/10 text-cyan-500 ring-cyan-500/20 group-hover:bg-cyan-500/20'
                    }`}
                  >
                    <Activity className="w-3.5 h-3.5" />
                  </span>
                  <span className="truncate">{language === 'en' ? 'System & Telemetry' : 'ابزارهای سیستمی و پایش'}</span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span
                    dir="ltr"
                    className="ltr-inline text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-600 dark:text-cyan-400"
                  >
                    {activityLogs.length}
                  </span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-300 ease-out ${
                      isOpen ? 'rotate-180 text-cyan-500 dark:text-cyan-400' : ''
                    }`}
                  />
                </div>
              </button>

              <div
                className={`grid transition-[grid-template-rows,opacity] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                  isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0 pointer-events-none'
                }`}
              >
                <div className="overflow-hidden">
                  <div className="p-2 pt-1.5 space-y-1.5 border-t border-slate-200/60 dark:border-white/[0.04]">
                    {/* Activity Logger */}
                    <button
                      type="button"
                      onClick={() => {
                        setActivityModalOpen(true);
                        if (isMobile) setSidebarOpen(false);
                      }}
                      data-testid="open-activity-logger-btn"
                      className="w-full p-2 rounded-xl border border-slate-200/80 dark:border-white/[0.06] bg-slate-50 dark:bg-[#0c121e] hover:border-cyan-500/40 hover:bg-white dark:hover:bg-white/[0.04] transition-all flex items-center justify-between text-xs text-slate-700 dark:text-slate-300 cursor-pointer shadow-2xs"
                    >
                      <div className="flex items-center gap-2">
                        <Activity className="w-3.5 h-3.5 text-cyan-500 shrink-0" />
                        <span className="font-medium">{language === 'en' ? 'Navigation History' : 'تاریخچه ناوبری'}</span>
                      </div>
                      <span
                        dir="ltr"
                        data-testid="activity-logger-badge-count"
                        className="ltr-inline text-[11px] font-mono font-bold px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 tabular-nums border border-cyan-500/20"
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
                        className="w-full p-2 rounded-xl border border-slate-200/80 dark:border-white/[0.06] bg-slate-50 dark:bg-[#0c121e] hover:border-blue-500/40 hover:bg-white dark:hover:bg-white/[0.04] transition-all flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer shadow-2xs"
                      >
                        <History className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                        <span className="font-medium">{t('resumeSession')}</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })()}
      </div>

      {/* Sidebar Footer & User Standing */}
      <div className="pt-3 border-t border-slate-200/80 dark:border-white/[0.07] space-y-3 shrink-0">
        <div className="p-3 rounded-2xl border border-slate-200/80 dark:border-white/[0.08] bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200/60 dark:from-[#0d1424] dark:via-[#0b101c] dark:to-[#090d16] flex items-center justify-between gap-2 shadow-2xs">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="relative shrink-0">
              <span className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-600 via-blue-600 to-cyan-500 text-white font-mono text-xs font-extrabold flex items-center justify-center shadow-xs">
                AR
              </span>
              <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-[#090d16]" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                {language === 'en' ? 'Aria Rostami' : 'آریا رستمی'}
              </span>
              <span className="text-[10px] text-amber-500 dark:text-amber-400 font-mono font-medium truncate">
                Lead Architect · 2900 XP
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <PWAInstallButton />
          </div>
        </div>

        {/* Quick Language & Theme Controls Inside Sidebar */}
        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 px-1">
          <button
            type="button"
            onClick={toggleLanguage}
            data-testid="language-toggle-btn"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-white/[0.06] hover:text-slate-900 dark:hover:text-white border border-transparent hover:border-slate-200/80 dark:hover:border-white/[0.08] transition-all cursor-pointer font-medium"
          >
            <Globe className="w-3.5 h-3.5 text-slate-400" />
            <span className="font-mono text-[11px] font-semibold">{t('langSwitchBadge')}</span>
          </button>
          <button
            type="button"
            onClick={() => setDarkMode((prev) => !prev)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-white/[0.06] hover:text-slate-900 dark:hover:text-white border border-transparent hover:border-slate-200/80 dark:hover:border-white/[0.08] transition-all cursor-pointer font-medium"
          >
            {darkMode ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-slate-500" />}
            <span className="text-[11px]">{darkMode ? t('themeLight') : t('themeDark')}</span>
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div
      id="top"
      dir={isRTL ? 'rtl' : 'ltr'}
      className="h-screen overflow-hidden flex flex-col bg-[#f8fafc] dark:bg-[#090d16] text-slate-900 dark:text-slate-100 transition-colors relative"
    >
      {/* Ambient Glassmorphic Lighting Accents (Linear/Raycast Studio Depth) */}
      <div className="fixed top-0 left-1/4 w-[500px] h-[500px] bg-gradient-to-br from-blue-600/10 to-indigo-600/5 rounded-full blur-[120px] pointer-events-none -z-10" />
      <div className="fixed bottom-0 right-1/4 w-[450px] h-[450px] bg-gradient-to-tr from-indigo-600/10 to-emerald-500/5 rounded-full blur-[130px] pointer-events-none -z-10" />

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

            {/* Quick Study Mode Button (Distraction-free toggle) */}
            <button
              type="button"
              data-testid="quick-study-mode-btn"
              onClick={toggleQuickStudyMode}
              className={`h-8 px-2.5 sm:px-3 rounded-lg border transition-all flex items-center gap-1.5 cursor-pointer text-xs font-semibold shrink-0 ${
                isStudyMode
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-blue-400 shadow-md shadow-blue-500/25 ring-2 ring-blue-500/30'
                  : 'border-slate-200/90 dark:border-white/[0.08] bg-slate-100/75 dark:bg-[#0c121e] text-slate-700 dark:text-slate-300 hover:border-blue-500/40 hover:bg-white dark:hover:bg-white/[0.06]'
              }`}
              title={isStudyMode ? t('exitStudyMode') : t('quickStudyMode')}
              aria-pressed={isStudyMode}
            >
              {isStudyMode ? (
                <Minimize2 className="w-3.5 h-3.5 text-white shrink-0 animate-pulse" />
              ) : (
                <Glasses className="w-3.5 h-3.5 text-blue-500 dark:text-blue-400 shrink-0" />
              )}
              <span className="hidden sm:inline whitespace-nowrap">
                {isStudyMode ? t('exitStudyMode') : t('quickStudyMode')}
              </span>
              {isStudyMode && (
                <kbd
                  dir="ltr"
                  className="ltr-inline hidden md:inline-block px-1 py-0.2 text-[9px] font-mono font-semibold bg-white/20 text-white rounded shrink-0"
                >
                  Esc
                </kbd>
              )}
            </button>

            {/* Rank / XP Pill */}
            <div
              dir="ltr"
              className="ltr-inline hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-blue-500/25 bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs font-mono font-bold"
            >
              <span>LVL 4</span>
              <span className="opacity-40">·</span>
              <span>{2900 + userBonusXp} XP</span>
            </div>

            {/* Viral Share & Invite Academy Button */}
            <button
              type="button"
              data-testid="open-invite-modal-btn"
              onClick={() => setInviteModalOpen(true)}
              className="h-8 px-2 sm:px-2.5 rounded-lg border border-indigo-500/30 bg-gradient-to-r from-indigo-500/10 via-blue-500/10 to-indigo-500/15 text-indigo-600 dark:text-indigo-400 hover:from-indigo-500/20 hover:to-blue-500/25 hover:border-indigo-500/50 transition-all flex items-center gap-1.5 cursor-pointer text-xs font-semibold shrink-0 shadow-2xs hover:shadow-sm group active:scale-95"
              title={t('inviteAndShare')}
              aria-label={t('inviteAndShare')}
            >
              <Share2 className="w-3.5 h-3.5 text-indigo-500 group-hover:scale-110 transition-transform" />
              <span className="hidden xl:inline">{t('inviteAndShare')}</span>
              <span className="font-mono text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-indigo-500/15 text-indigo-600 dark:text-indigo-300 border border-indigo-500/25">
                +250 XP
              </span>
            </button>

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
              className={`relative z-10 w-84 max-w-[90vw] h-full bg-white/95 dark:bg-[#0a0f1d]/95 backdrop-blur-xl ${
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
            className={`w-80 xl:w-[350px] shrink-0 h-full ${
              isRTL ? 'border-l' : 'border-r'
            } border-slate-200/80 dark:border-white/[0.08] bg-slate-50/70 dark:bg-[#0a0f1d]/90 backdrop-blur-xl p-3.5 overflow-y-auto flex flex-col justify-between gap-6 hidden md:flex transition-all duration-200`}
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

          <div className={`px-4 sm:px-8 lg:px-12 py-8 ${isStudyMode ? 'max-w-4xl' : 'max-w-5xl'} mx-auto w-full flex-1 transition-all duration-300`}>
            {/* Zen Distraction-Free Reading HUD */}
            {isStudyMode && activeSection === 'curriculum' && (
              <div
                data-testid="zen-reading-hud"
                className="sticky top-2 z-30 mb-6 p-3 rounded-2xl border border-blue-500/30 dark:border-blue-500/25 bg-white/95 dark:bg-[#0a0f1d]/95 backdrop-blur-md shadow-lg shadow-blue-500/5 flex flex-wrap items-center justify-between gap-3 animate-fade-in"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="relative flex h-2.5 w-2.5 shrink-0">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-600" />
                  </span>
                  <div className="flex flex-col min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                        {language === 'en'
                          ? `Module 0${currentModule.number}: ${currentModule.titleEn}`
                          : `فصل ۰${currentModule.number}: ${currentModule.titleFa}`}
                      </span>
                      <span
                        dir="ltr"
                        className="ltr-inline hidden sm:inline-block px-2 py-0.5 rounded-full text-[10px] font-mono font-medium bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-500/20"
                      >
                        {language === 'en'
                          ? computeReadingEstimateForModule(currentModule.number).labelEn
                          : computeReadingEstimateForModule(currentModule.number).labelFa}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 hidden md:inline">
                      {t('distractionFreeNotice')}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {/* Prev Module */}
                  <button
                    type="button"
                    disabled={currentModule.number <= 1}
                    onClick={() => {
                      const prev = ALL_CURRICULUM_MODULES.find((m) => m.number === currentModule.number - 1);
                      if (prev) {
                        setActiveModuleId(prev.id);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }
                    }}
                    className="p-1.5 rounded-lg border border-slate-200/80 dark:border-white/[0.08] hover:bg-slate-100 dark:hover:bg-white/[0.08] disabled:opacity-30 disabled:cursor-not-allowed text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                    title={language === 'en' ? 'Previous Chapter' : 'فصل قبلی'}
                  >
                    {isRTL ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
                  </button>

                  {/* Next Module */}
                  <button
                    type="button"
                    disabled={currentModule.number >= ALL_CURRICULUM_MODULES.length}
                    onClick={() => {
                      const next = ALL_CURRICULUM_MODULES.find((m) => m.number === currentModule.number + 1);
                      if (next) {
                        setActiveModuleId(next.id);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }
                    }}
                    className="p-1.5 rounded-lg border border-slate-200/80 dark:border-white/[0.08] hover:bg-slate-100 dark:hover:bg-white/[0.08] disabled:opacity-30 disabled:cursor-not-allowed text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                    title={language === 'en' ? 'Next Chapter' : 'فصل بعدی'}
                  >
                    {isRTL ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                  </button>

                  {/* Exit Study Mode */}
                  <button
                    type="button"
                    data-testid="exit-study-mode-hud-btn"
                    onClick={() => setIsStudyMode(false)}
                    className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-white/[0.08] hover:bg-slate-200 dark:hover:bg-white/[0.14] text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Minimize2 className="w-3.5 h-3.5 text-blue-500" />
                    <span>{t('exitStudyMode')}</span>
                    <kbd
                      dir="ltr"
                      className="ltr-inline hidden sm:inline-block px-1 py-0.2 text-[9px] font-mono font-semibold bg-white dark:bg-[#090d16] border border-slate-200 dark:border-white/[0.1] rounded text-slate-500 dark:text-slate-400"
                    >
                      Esc
                    </kbd>
                  </button>
                </div>
              </div>
            )}

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

          {/* Global Architectural Footer (Distraction-free suppression in Quick Study Mode) */}
          {!isStudyMode ? (
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
        ) : (
          <div className="py-8 text-center text-xs text-slate-400 dark:text-slate-500 font-mono border-t border-slate-200/40 dark:border-white/[0.04]">
            <span>{t('distractionFreeNotice')} · </span>
            <button
              type="button"
              onClick={() => setIsStudyMode(false)}
              className="text-blue-500 hover:underline cursor-pointer font-semibold"
            >
              {t('exitStudyMode')} (Esc)
            </button>
          </div>
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

      {/* Viral Mastery & Colleague Invite Modal */}
      <InviteShareModal
        isOpen={inviteModalOpen}
        onClose={() => setInviteModalOpen(false)}
        completedModulesCount={completedModules.length}
        totalModulesCount={ALL_CURRICULUM_MODULES.length}
        userXp={2900 + userBonusXp}
        userLevel={4}
        onRewardXp={(amount) => {
          setUserBonusXp((prev) => prev + amount);
        }}
      />

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

