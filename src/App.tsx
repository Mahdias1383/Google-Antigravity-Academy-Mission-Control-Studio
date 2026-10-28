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
} from 'lucide-react';
import { ALL_CURRICULUM_MODULES } from './data/curriculumIndex';
import {
  serializeRecentSessionSnapshot,
  resolveRecentSessionFromStorage,
  ResolvedRecentSessionDescriptor,
} from './utils/generators';
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
import { PWAInstallButton, OfflineIndicator } from './components/PWAInstallAndOffline';

type ActiveWorkspaceSection =
  | 'curriculum'
  | 'achievements'
  | 'simulator'
  | 'guardrails'
  | 'mcp'
  | 'cheatsheets'
  | 'scenarios'
  | 'ai-architect';

export default function App() {
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

  // Detect last accessed module or studio from localStorage on startup
  useEffect(() => {
    try {
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
        setResumeModalOpen(true);
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
    setCompletedModules((prev) =>
      prev.includes(modId) ? prev.filter((id) => id !== modId) : [...prev, modId]
    );
  };

  const handleCompleteAllModules = () => {
    setCompletedModules(ALL_CURRICULUM_MODULES.map((m) => m.id));
  };

  const currentModule =
    ALL_CURRICULUM_MODULES.find((m) => m.id === activeModuleId) ||
    ALL_CURRICULUM_MODULES[0];

  const completionPercent = Math.round(
    (completedModules.length / ALL_CURRICULUM_MODULES.length) * 100
  );

  return (
    <div
      dir="rtl"
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
          Google Antigravity Academy
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
            آکادمی (۸ فصل)
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
            شبیه‌ساز Mission Control
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
            استودیوی Rule و Workflow
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
            استودیوی FastMCP
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
            چیت‌شیت‌ها و PDF
          </button>
        </nav>

        {/* Zone 3: 1 Primary Action (Command Search Launcher Cmd+K) */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => setSearchModalOpen(true)}
            className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Search className="w-3.5 h-3.5" />
            <span>جستجوی سریع (Ctrl+K)</span>
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
            <span className="hidden sm:inline">فهرست فصل‌ها</span>
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
            <span>دستاوردها و گواهینامه (Achievements &amp; Certification)</span>
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
            <span>آزمایشگاه ۸ چالش معماری</span>
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
            <span>جستجوی زنده مستندات (Search Grounding)</span>
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
              <span>ادامه آخرین نشست (Resume)</span>
            </button>
          )}

          <PWAInstallButton />

          <button
            type="button"
            onClick={() => setActiveSection('achievements')}
            className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400 hover:text-blue-500 transition-colors cursor-pointer"
          >
            <span>پیشرفت مطالعه:</span>
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
                <span>حالت روشن (Light)</span>
              </>
            ) : (
              <>
                <Moon className="w-3.5 h-3.5 text-blue-600" />
                <span>حالت تیره (Dark)</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Fluid Widescreen Workspace Grid */}
      <div className="flex-1 flex overflow-hidden">
        {/* Right-Hand Navigation Sidebar (RTL) */}
        {sidebarOpen && (
          <aside
            aria-label="Curriculum Modules & Studios Navigation"
            className="w-72 sm:w-80 shrink-0 border-l border-slate-200 dark:border-slate-800/80 bg-white/90 dark:bg-[#0d1322]/90 p-4 overflow-y-auto space-y-6 hidden md:block"
          >
            {/* 8 Learning Modules + Academy Certification Card */}
            <div className="space-y-2">
              <div className="px-2 text-xs font-extrabold text-slate-500 dark:text-slate-400 flex items-center justify-between">
                <span>سرفصل‌های جامع آموزشی (۸ ماژول)</span>
                <span dir="ltr" className="ltr-inline font-mono text-[11px]">
                  8 Modules
                </span>
              </div>

              {/* Dedicated Academy Achievements & Certification Item inside Academy Sidebar */}
              <button
                type="button"
                onClick={() => setActiveSection('achievements')}
                className={`w-full text-right p-3 rounded-xl border transition-all flex items-start gap-2.5 cursor-pointer ${
                  activeSection === 'achievements'
                    ? 'border-emerald-500 bg-emerald-500/15 text-slate-900 dark:text-white'
                    : 'border-emerald-500/30 bg-emerald-500/5 hover:bg-emerald-500/10 text-slate-800 dark:text-slate-200'
                }`}
              >
                <Award className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-bold leading-5">
                    دستاوردها و گواهینامه آکادمی
                  </div>
                  <div
                    dir="ltr"
                    className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 text-right leading-4 mt-0.5 break-words"
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
                  return (
                    <button
                      key={mod.id}
                      type="button"
                      onClick={() => {
                        setActiveSection('curriculum');
                        setActiveModuleId(mod.id);
                      }}
                      className={`w-full text-right p-2.5 rounded-xl border transition-all flex items-start gap-2.5 cursor-pointer ${
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
                          فصل {mod.number}: {mod.titleFa}
                        </div>
                        <div
                          dir="ltr"
                          className="text-[10px] font-mono text-slate-500 dark:text-slate-400 text-right leading-4 mt-0.5 break-words"
                        >
                          {mod.titleEn}
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
                استودیوهای مهندسی و شبیه‌سازها
              </div>
              <div className="space-y-1">
                {(
                  [
                    {
                      id: 'simulator',
                      labelFa: '۱. شبیه‌ساز زنده Mission Control',
                      labelEn: 'Artifact & PR Review Simulator',
                      icon: Terminal,
                    },
                    {
                      id: 'guardrails',
                      labelFa: '۲. استودیوی Rule و Workflow',
                      labelEn: '.agent/rules & // turbo Builder',
                      icon: Shield,
                    },
                    {
                      id: 'mcp',
                      labelFa: '۳. استودیوی بصری سرور FastMCP',
                      labelEn: 'mcp_config.json & Python Code',
                      icon: Cpu,
                    },
                    {
                      id: 'cheatsheets',
                      labelFa: '۴. مرکز چیت‌شیت‌ها و خروجی PDF',
                      labelEn: 'Modular Reference Cards',
                      icon: FileSpreadsheet,
                    },
                    {
                      id: 'scenarios',
                      labelFa: '۵. آزمایشگاه چالش‌های معماری',
                      labelEn: '8 Principal Case Studies',
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
                      className={`w-full text-right p-2.5 rounded-xl border transition-all flex items-start gap-2.5 cursor-pointer ${
                        active
                          ? 'border-blue-500 bg-blue-500/10 text-slate-900 dark:text-white'
                          : 'border-transparent hover:bg-slate-100 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <IconComp className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-bold">{st.labelFa}</div>
                        <div
                          dir="ltr"
                          className="text-[10px] font-mono text-slate-500 dark:text-slate-400 text-right leading-4 mt-0.5 break-words"
                        >
                          {st.labelEn}
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

          {activeSection === 'ai-architect' && <GroundedAiArchitectCopilot />}
        </main>

        {/* Sticky On-This-Page Mini-Map (When viewing Curriculum on XL screens) */}
        {activeSection === 'curriculum' && (
          <aside
            aria-label="On This Page Subsections"
            className="w-64 shrink-0 border-r border-slate-200 dark:border-slate-800/80 p-4 hidden xl:block space-y-4"
          >
            <div className="text-xs font-bold text-slate-500 dark:text-slate-400">
              در این فصل می‌خوانید (On This Page)
            </div>
            <div className="space-y-2">
              {currentModule.subSections.map((sub) => (
                <a
                  key={sub.id}
                  href={`#${sub.id}`}
                  className="block p-2.5 rounded-lg text-xs text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-blue-500 transition-colors"
                >
                  <div className="font-semibold leading-5">{sub.titleFa}</div>
                  <div dir="ltr" className="text-[10px] font-mono opacity-75 text-right leading-4 mt-1 break-words">
                    {sub.titleEn}
                  </div>
                </a>
              ))}
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
                    ادامه آخرین نشست مهندسی (Resume Recent Session)
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
                آخرین فعالیت و نقطه پیشرفت شما در حافظه مرورگر (<code dir="ltr" className="ltr-inline">localStorage</code>) شناسایی شد. آیا مایلید مستقیماً به همان بخش بازگردید؟
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
                    {detectedSession.kind === 'studio' ? 'استودیوی تعاملی' : 'سرفصل آموزشی'}
                  </span>
                </div>

                <div
                  className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white"
                  data-testid="resume-session-title-fa"
                >
                  {detectedSession.targetTitleFa}
                </div>

                <div
                  dir="ltr"
                  className="ltr-inline text-xs font-mono text-slate-500 dark:text-slate-400 block"
                  data-testid="resume-session-title-en"
                >
                  {detectedSession.targetTitleEn}
                </div>
              </div>

              {/* Saved Curriculum Progress Bar */}
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/70 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-700 dark:text-slate-300">
                    پیشرفت ثبت‌شده در سرفصل‌های آکادمی:
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
                  ماندن در نمای فعلی (Stay Here)
                </button>
                <button
                  type="button"
                  onClick={handleJumpToRecentSession}
                  data-testid="confirm-resume-session-btn"
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <span>پرش مستقیم به آخرین نقطه پیشرفت (Jump Back)</span>
                  <ArrowUpLeft className="w-4 h-4" />
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

