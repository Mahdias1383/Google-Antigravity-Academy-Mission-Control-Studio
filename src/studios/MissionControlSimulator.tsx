import React, { useState, useEffect } from 'react';
import {
  Play,
  MessageSquarePlus,
  CheckCircle2,
  Terminal,
  FileText,
  RotateCcw,
  Send,
  AlertTriangle,
  Eye,
  Download,
  RefreshCw,
  Upload,
  Database,
  Copy,
  Check,
} from 'lucide-react';
import {
  ExportSectionPdfButton,
  PrintableDocumentPayload,
  CodeSandboxTabs,
} from '../components/CodeAndPdfTools';
import {
  buildKnowledgeBaseUserStateJson,
  parseKnowledgeBaseUserStateJson,
} from '../utils/generators';
import { useLanguage } from '../context/LanguageContext';

const USER_STATE_STORAGE_KEY = 'ag_knowledge_base_user_state_v1';

interface SimulatorTaskTemplate {
  id: string;
  titleFa: string;
  titleEn: string;
  worktree: string;
  tasks: { id: string; text: string; doneAfterExec: boolean }[];
  planLines: { lineNumber: number; text: string; highlightable: boolean }[];
  terminalLogs: string[];
  walkthroughReport: string;
}

const SIMULATOR_TASKS: SimulatorTaskTemplate[] = [
  {
    id: 'task-websocket',
    titleFa: 'ساخت سرویس اعلان بلادرنگ WebSocket با Redis Pub/Sub',
    titleEn: 'Build Async WebSocket Notification Service with Redis Pub/Sub',
    worktree: '../ag-worktrees/wt-websocket',
    tasks: [
      { id: 't1', text: 'Define Pydantic v2 WebSocketEnvelope schema in src/schemas/ws_events.py', doneAfterExec: true },
      { id: 't2', text: 'Implement Redis async fan-out manager in src/services/ws_broker.py', doneAfterExec: true },
      { id: 't3', text: 'Mount /v1/ws/notifications endpoint with JWT handshake validation', doneAfterExec: true },
      { id: 't4', text: 'Run pytest-asyncio & Browser Subagent WebSocket E2E verification', doneAfterExec: true },
    ],
    planLines: [
      { lineNumber: 1, text: '# Implementation Plan: Async WebSocket Notification Broker', highlightable: false },
      { lineNumber: 2, text: '## Goal Description', highlightable: false },
      { lineNumber: 3, text: 'Stream real-time settlement status transitions to connected clients over WebSockets backed by Redis Pub/Sub.', highlightable: true },
      { lineNumber: 4, text: '## User Review Required', highlightable: false },
      { lineNumber: 5, text: '> [!IMPORTANT] WebSocket connections require short-lived ticket token in ?ticket= query param.', highlightable: true },
      { lineNumber: 6, text: '## Proposed Changes', highlightable: false },
      { lineNumber: 7, text: '- [NEW] src/schemas/ws_events.py: Strict Pydantic v2 event payload contract.', highlightable: true },
      { lineNumber: 8, text: '- [NEW] src/services/ws_broker.py: Asyncio task group managing Redis channel subscriptions.', highlightable: true },
      { lineNumber: 9, text: '- [MODIFY] src/api/routers/notifications.py: Register @router.websocket("/v1/ws/notifications").', highlightable: true },
      { lineNumber: 10, text: '## Verification Plan', highlightable: false },
      { lineNumber: 11, text: '1. Execute poetry run pytest tests/test_ws_broker.py -v', highlightable: true },
      { lineNumber: 12, text: '2. Launch Browser Subagent on http://localhost:3000/live-feed and verify 0 console disconnects.', highlightable: true },
    ],
    terminalLogs: [
      '$ poetry run ruff check src/ tests/',
      'All checks passed!',
      '$ poetry run pytest tests/test_ws_broker.py -v',
      'tests/test_ws_broker.py::test_redis_pubsub_fanout PASSED [ 33%]',
      'tests/test_ws_broker.py::test_invalid_ticket_closes_1008 PASSED [ 66%]',
      'tests/test_ws_broker.py::test_graceful_disconnect_cleanup PASSED [100%]',
      '============================== 3 passed in 0.62s ===============================',
      '[Browser Subagent] Connected to ws://localhost:3000/v1/ws/notifications -> 101 Switching Protocols',
      '[Browser Subagent] Captured live stream artifact: .aistudio/artifacts/brain/ws_live_verified.webp',
    ],
    walkthroughReport: `# Walkthrough: Async WebSocket Notification Service

## 1. Delivered Changes
- Created \`src/schemas/ws_events.py\` with \`ConfigDict(extra="forbid")\`.
- Implemented \`RedisWebSocketBroker\` in \`src/services/ws_broker.py\` with heartbeat ping/pong every \`15s\`.
- Incorporated inline architectural review comments from \`implementation_plan.md\`.

## 2. Verification & Telemetry Proof
- **Pytest Async Suite:** \`3 passed in 0.62s\`
- **Browser Subagent Console:** \`0 errors\`, \`101 Switching Protocols\` verified.
- **Visual Artifact:** \`![WebSocket E2E Recording](/.aistudio/artifacts/brain/ws_live_verified.webp)\``,
  },
  {
    id: 'task-nplus1',
    titleFa: 'رفع گلوگاه کوئری N+1 در API گزارش‌گیری مالی SQLAlchemy 2.0',
    titleEn: 'Fix N+1 SQLAlchemy 2.0 Query in Financial Reporting API',
    worktree: '../ag-worktrees/wt-reporting',
    tasks: [
      { id: 't1', text: 'Write failing SQL query-counter test in tests/test_reporting_perf.py', doneAfterExec: true },
      { id: 't2', text: 'Refactor select(Merchant) to include selectinload(Merchant.settlements)', doneAfterExec: true },
      { id: 't3', text: 'Verify query count drops from 51 queries to 2 queries for 50 merchants', doneAfterExec: true },
      { id: 't4', text: 'Confirm p99 latency < 25ms in Browser Subagent Network tab', doneAfterExec: true },
    ],
    planLines: [
      { lineNumber: 1, text: '# Implementation Plan: Eliminate N+1 ORM Queries in Reporting Router', highlightable: false },
      { lineNumber: 2, text: '## Goal Description', highlightable: false },
      { lineNumber: 3, text: 'Replace implicit lazy relationship access with explicit SQLAlchemy 2.0 selectinload() eager loading.', highlightable: true },
      { lineNumber: 4, text: '## User Review Required', highlightable: false },
      { lineNumber: 5, text: '> [!WARNING] Setting lazy="raise" on Merchant.settlements will raise StatementError on any un-eager-loaded access.', highlightable: true },
      { lineNumber: 6, text: '## Proposed Changes', highlightable: false },
      { lineNumber: 7, text: '- [MODIFY] src/models/merchant.py: Set relationship(..., lazy="raise") to prevent future N+1 regressions.', highlightable: true },
      { lineNumber: 8, text: '- [MODIFY] src/api/routers/reports.py: Add .options(selectinload(Merchant.settlements)) to select() statement.', highlightable: true },
      { lineNumber: 9, text: '- [NEW] tests/test_reporting_perf.py: Assert SQLAlchemy event listener counts <= 2 SQL statements.', highlightable: true },
      { lineNumber: 10, text: '## Verification Plan', highlightable: false },
      { lineNumber: 11, text: '1. Run poetry run pytest tests/test_reporting_perf.py -v', highlightable: true },
      { lineNumber: 12, text: '2. Verify GET /v1/reports/merchants response time in Browser Subagent.', highlightable: true },
    ],
    terminalLogs: [
      '$ poetry run pytest tests/test_reporting_perf.py -v',
      'tests/test_reporting_perf.py::test_merchant_report_query_count_is_two PASSED [ 50%]',
      'tests/test_reporting_perf.py::test_unloaded_relationship_raises_strict PASSED [100%]',
      '============================== 2 passed in 0.41s ===============================',
      '[Browser Subagent] GET /v1/reports/merchants?limit=50 -> 200 OK (18ms, down from 340ms)',
      '[Browser Subagent] Saved proof recording: .aistudio/artifacts/brain/nplus1_fixed.webp',
    ],
    walkthroughReport: `# Walkthrough: SQLAlchemy 2.0 N+1 Query Elimination

## 1. Delivered Changes
- Updated \`src/models/merchant.py\` with \`lazy="raise"\` guardrail.
- Refactored \`src/api/routers/reports.py\` using \`selectinload(Merchant.settlements)\`.
- Applied all inline PR-style review directives.

## 2. Performance & Verification Telemetry
- **SQL Statement Count (50 Merchants):** Reduced from \`51 statements\` to \`2 statements\`.
- **Endpoint Latency:** Reduced from \`340ms\` to \`18ms\`.
- **Visual Artifact:** \`![N+1 Performance Verification](/.aistudio/artifacts/brain/nplus1_fixed.webp)\``,
  },
];

export const MissionControlSimulator: React.FC<{
  onExportPdf: (payload: PrintableDocumentPayload) => void;
  completedModules?: string[];
  totalModules?: number;
  onRestoreCompletedModules?: (modules: string[]) => void;
}> = ({
  onExportPdf,
  completedModules = ['module-1', 'module-2'],
  totalModules = 8,
  onRestoreCompletedModules,
}) => {
  const { language, isRTL, t } = useLanguage();
  const [selectedTaskId, setSelectedTaskId] = useState<string>(SIMULATOR_TASKS[0].id);
  const [executionMode, setExecutionMode] = useState<'Planning Mode' | 'Fast Mode'>('Planning Mode');
  const [activeArtifactTab, setActiveArtifactTab] = useState<'task.md' | 'implementation_plan.md' | 'walkthrough.md'>('implementation_plan.md');
  const [selectedLineNumber, setSelectedLineNumber] = useState<number | null>(8);
  const [commentDraft, setCommentDraft] = useState<string>('Use heartbeat ping interval of 15s and enforce Pydantic extra="forbid" on incoming frames.');
  const [inlineComments, setInlineComments] = useState<{ line: number; comment: string }[]>([
    { line: 5, comment: 'Ensure expired tickets return HTTP 403 before WebSocket upgrade.' },
  ]);
  const [executionStage, setExecutionStage] = useState<'planning-review' | 'executing' | 'completed'>('planning-review');

  // Sync Workspace (.agent/knowledge-base/user-state.json) State
  const [lastSyncedIso, setLastSyncedIso] = useState<string>('2026-10-28T08:45:00.000Z');
  const [syncStatusBanner, setSyncStatusBanner] = useState<string>('');
  const [copiedUserState, setCopiedUserState] = useState<boolean>(false);
  const [showRestorePanel, setShowRestorePanel] = useState<boolean>(false);
  const [restoreJsonDraft, setRestoreJsonDraft] = useState<string>('');
  const [restoreError, setRestoreError] = useState<string>('');

  // Hydrate persisted .agent/knowledge-base/user-state.json on mount for cross-session continuity
  useEffect(() => {
    try {
      const savedRaw = window.localStorage.getItem(USER_STATE_STORAGE_KEY);
      if (!savedRaw) return;
      const parsed = parseKnowledgeBaseUserStateJson(savedRaw);
      if (parsed.valid && parsed.data) {
        const doc = parsed.data;
        if (SIMULATOR_TASKS.some((t) => t.id === doc.activeTaskState.taskId)) {
          setSelectedTaskId(doc.activeTaskState.taskId);
        }
        setExecutionMode(doc.workspaceProfile.executionMode);
        setExecutionStage(doc.workspaceProfile.executionStage);
        setActiveArtifactTab(doc.activeTaskState.activeArtifactTab);
        setInlineComments(doc.activeTaskState.inlineReviewComments);
        setLastSyncedIso(doc.exportedAtIso);
      }
    } catch {
      // Ignore storage errors in restricted environments
    }
  }, []);

  const currentTask = SIMULATOR_TASKS.find((t) => t.id === selectedTaskId) || SIMULATOR_TASKS[0];

  const userStateJson = buildKnowledgeBaseUserStateJson({
    exportedAtIso: lastSyncedIso,
    workspaceName: 'google-antigravity-academy-workspace',
    taskId: currentTask.id,
    titleEn: currentTask.titleEn,
    titleFa: language === 'en' ? currentTask.titleEn : currentTask.titleFa,
    worktree: currentTask.worktree,
    executionMode,
    executionStage,
    activeArtifactTab,
    inlineComments,
    tasks: currentTask.tasks,
    completedModules,
    totalModules,
  });

  const handleSyncAndExportWorkspace = (triggerDownload: boolean = true) => {
    const nowIso = new Date().toISOString();
    setLastSyncedIso(nowIso);
    const freshJson = buildKnowledgeBaseUserStateJson({
      exportedAtIso: nowIso,
      workspaceName: 'google-antigravity-academy-workspace',
      taskId: currentTask.id,
      titleEn: currentTask.titleEn,
      titleFa: language === 'en' ? currentTask.titleEn : currentTask.titleFa,
      worktree: currentTask.worktree,
      executionMode,
      executionStage,
      activeArtifactTab,
      inlineComments,
      tasks: currentTask.tasks,
      completedModules,
      totalModules,
    });

    try {
      window.localStorage.setItem(USER_STATE_STORAGE_KEY, freshJson);
    } catch {
      // Ignore storage quota issues
    }

    if (triggerDownload) {
      const blob = new Blob([freshJson], { type: 'application/json;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = 'user-state.json';
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      URL.revokeObjectURL(url);
      setSyncStatusBanner(
        language === 'en'
          ? 'Workspace state synchronized and downloaded to .agent/knowledge-base/user-state.json (Cross-Session Continuity Active).'
          : 'وضعیت محیط کار در .agent/knowledge-base/user-state.json همگام‌سازی و دانلود شد (Cross-Session Continuity Active).'
      );
    } else {
      setSyncStatusBanner(
        language === 'en'
          ? 'Current workspace state saved to persistent storage in .agent/knowledge-base/user-state.json.'
          : 'وضعیت فعلی در حافظه پایدار .agent/knowledge-base/user-state.json ذخیره شد.'
      );
    }
  };

  const handleCopyUserStateJson = () => {
    navigator.clipboard?.writeText(userStateJson);
    setCopiedUserState(true);
    setTimeout(() => setCopiedUserState(false), 2000);
  };

  const handleApplyRestoredState = () => {
    setRestoreError('');
    const result = parseKnowledgeBaseUserStateJson(restoreJsonDraft);
    if (!result.valid || !result.data) {
      setRestoreError(
        result.error ||
          (language === 'en' ? 'Invalid JSON document schema.' : 'ساختار فایل JSON معتبر نیست.')
      );
      return;
    }
    const doc = result.data;
    if (SIMULATOR_TASKS.some((t) => t.id === doc.activeTaskState.taskId)) {
      setSelectedTaskId(doc.activeTaskState.taskId);
    }
    setExecutionMode(doc.workspaceProfile.executionMode);
    setExecutionStage(doc.workspaceProfile.executionStage);
    setActiveArtifactTab(doc.activeTaskState.activeArtifactTab);
    setInlineComments(doc.activeTaskState.inlineReviewComments);
    setLastSyncedIso(doc.exportedAtIso);
    if (onRestoreCompletedModules && Array.isArray(doc.academyProgress.completedModules)) {
      onRestoreCompletedModules(doc.academyProgress.completedModules);
    }
    try {
      window.localStorage.setItem(USER_STATE_STORAGE_KEY, restoreJsonDraft);
    } catch {
      // Ignore storage error
    }
    setShowRestorePanel(false);
    setSyncStatusBanner(
      language === 'en'
        ? 'Workspace state and module progress successfully restored from .agent/knowledge-base/user-state.json!'
        : 'وضعیت محیط کار و پیشرفت ماژول‌ها با موفقیت از .agent/knowledge-base/user-state.json بازیابی شد!'
    );
  };

  const handleAddInlineComment = () => {
    if (!selectedLineNumber || !commentDraft.trim()) return;
    setInlineComments((prev) => [
      ...prev.filter((c) => c.line !== selectedLineNumber),
      { line: selectedLineNumber, comment: commentDraft.trim() },
    ]);
    setCommentDraft('');
  };

  const handleExecutePipeline = () => {
    setExecutionStage('executing');
    setTimeout(() => {
      setExecutionStage('completed');
      setActiveArtifactTab('walkthrough.md');
    }, 450);
  };

  const handleReset = () => {
    setExecutionStage('planning-review');
    setActiveArtifactTab('implementation_plan.md');
  };

  const simulatorPdfPayload: PrintableDocumentPayload = {
    titleFa: `گزارش شبیه‌ساز Mission Control: ${currentTask.titleFa}`,
    titleEn: `Mission Control Artifact Audit: ${currentTask.titleEn}`,
    subtitleOrCategory: `${executionMode} · Worktree: ${currentTask.worktree}`,
    sections: [
      {
        headingFa: '۱. چک‌لیست وضعیت تسک (task.md)',
        headingEn: '.aistudio/artifacts/brain/task.md',
        bullets: currentTask.tasks.map((t) => ({
          termEn: executionStage === 'completed' ? '[x]' : '[/]',
          descFa: t.text,
        })),
      },
      {
        headingFa: '۲. برنامه پیاده‌سازی و کامنت‌های ممیزی خطی (implementation_plan.md)',
        headingEn: 'Inline PR-Style Review Comments',
        bullets: inlineComments.map((c) => ({
          termEn: `Line ${c.line}`,
          descFa: c.comment,
        })),
        codeBlocks: [
          {
            filename: 'implementation_plan.md',
            language: 'markdown',
            code: currentTask.planLines.map((l) => `${l.lineNumber}: ${l.text}`).join('\n'),
          },
        ],
      },
      {
        headingFa: '۳. گزارش اثبات تحویل (walkthrough.md)',
        headingEn: 'Terminal & Browser Subagent Proof',
        codeBlocks: [
          {
            filename: 'walkthrough.md',
            language: 'markdown',
            code: currentTask.walkthroughReport,
          },
        ],
      },
    ],
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Studio Header */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/75 p-6 sm:p-8 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
          <div>
            <div className="text-xs font-bold text-blue-600 dark:text-blue-400">
              {language === 'en'
                ? 'Studio 1 · Google Antigravity Interactive Environment Simulator'
                : 'استودیو ۱ · شبیه‌ساز تعاملی محیط Google Antigravity'}
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-1">
              {language === 'en'
                ? 'Live Mission Control Simulator & Artifact PR-Style Review'
                : 'شبیه‌ساز زنده Mission Control و ممیزی خطی آرتیفکت‌ها'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-1">
              {language === 'en'
                ? 'Select an engineering task, click any line of implementation_plan.md to submit PR-style review comments, and observe autonomous agent execution producing walkthrough.md.'
                : 'یک تسک مهندسی را انتخاب کنید، روی هر خط از implementation_plan.md کلیک کرده و کامنت ممیزی PR-Style ثبت کنید، سپس اجرای خودکار ایجنت و تولید walkthrough.md را مشاهده نمایید.'}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => handleSyncAndExportWorkspace(true)}
              data-testid="sync-workspace-btn"
              className="px-3.5 py-2 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors flex items-center gap-2 cursor-pointer whitespace-nowrap"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{language === 'en' ? 'Sync Workspace' : 'همگام‌سازی محیط کار (Sync Workspace)'}</span>
            </button>
            <ExportSectionPdfButton
              label={language === 'en' ? 'Export Section PDF' : 'دریافت PDF این بخش'}
              payload={simulatorPdfPayload}
              onExport={onExportPdf}
            />
          </div>
        </div>

        {syncStatusBanner && (
          <div
            data-testid="sync-workspace-status-banner"
            className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs font-semibold flex items-center justify-between gap-3"
          >
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>{syncStatusBanner}</span>
            </div>
            <span dir="ltr" className="ltr-inline font-mono text-[11px] text-emerald-500">
              .agent/knowledge-base/user-state.json
            </span>
          </div>
        )}

        {/* Task & Mode Controls */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 pt-2">
          <div className="lg:col-span-2 space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              {language === 'en'
                ? 'Select Active Engineering Scenario in Agent Manager:'
                : 'انتخاب سناریوی مهندسی در حال اجرا در Agent Manager:'}
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {SIMULATOR_TASKS.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => {
                    setSelectedTaskId(t.id);
                    setExecutionStage('planning-review');
                    setActiveArtifactTab('implementation_plan.md');
                  }}
                  className={`p-3.5 rounded-lg border ${
                    isRTL ? 'text-right' : 'text-left'
                  } transition-all cursor-pointer ${
                    selectedTaskId === t.id
                      ? 'border-blue-500 bg-blue-500/10 text-slate-900 dark:text-white'
                      : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <div className="text-xs font-bold">
                    {language === 'en' ? t.titleEn : t.titleFa}
                  </div>
                  <div dir="ltr" className="ltr-inline text-[11px] font-mono text-blue-500 mt-1">
                    {t.worktree}
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              {language === 'en' ? 'Agent Execution Mode:' : 'حالت اجرای ایجنت (Execution Mode):'}
            </label>
            <div className="flex items-center gap-1 p-1 rounded-lg bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setExecutionMode('Planning Mode')}
                className={`flex-1 py-2 px-3 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                  executionMode === 'Planning Mode'
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                Planning Mode
              </button>
              <button
                type="button"
                onClick={() => setExecutionMode('Fast Mode')}
                className={`flex-1 py-2 px-3 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                  executionMode === 'Fast Mode'
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                Fast Mode
              </button>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-5">
              {executionMode === 'Planning Mode'
                ? language === 'en'
                  ? 'Full artifact generation and pause at Request Review gate before code mutation.'
                  : 'تولید کامل آرتیفکت‌ها و توقف در دروازه Request Review پیش از تغییر کد.'
                : language === 'en'
                ? 'Direct code mutation with minimal latency for straightforward edits.'
                : 'اجرای مستقیم تغییرات کد با حداقل تاخیر برای تسک‌های کوچک.'}
            </p>
          </div>
        </div>
      </div>

      {/* Main Split Workbench: Left/Right Panes */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Artifact Viewer & Inline PR Review Pane (8 Cols) */}
        <div className="lg:col-span-8 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/75 overflow-hidden flex flex-col">
          {/* Artifact Tabs Header */}
          <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 bg-slate-100 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-1.5">
              {(['task.md', 'implementation_plan.md', 'walkthrough.md'] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveArtifactTab(tab)}
                  dir="ltr"
                  className={`ltr-inline px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition-colors cursor-pointer ${
                    activeArtifactTab === tab
                      ? 'bg-blue-600 text-white'
                      : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              {executionStage !== 'completed' ? (
                <button
                  type="button"
                  onClick={handleExecutePipeline}
                  className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>{language === 'en' ? 'Submit Review & Execute' : 'تایید ممیزی و اجرای ایجنت (Submit Review & Execute)'}</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleReset}
                  className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1.5 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>{language === 'en' ? 'Restart Audit' : 'شروع مجدد ممیزی'}</span>
                </button>
              )}
            </div>
          </div>

          {/* Artifact Tab Body */}
          <div className="p-5 flex-1 space-y-4">
            {activeArtifactTab === 'task.md' && (
              <div className="space-y-3">
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  {language === 'en' ? (
                    <>Live checklist status in <code dir="ltr" className="ltr-inline">.aistudio/artifacts/brain/task.md</code>:</>
                  ) : (
                    <>وضعیت لحظه‌ای چک‌لیست در <code dir="ltr" className="ltr-inline">.aistudio/artifacts/brain/task.md</code>:</>
                  )}
                </div>
                <div dir="ltr" className="ltr-code space-y-2">
                  {currentTask.tasks.map((item, idx) => {
                    const statusBadge =
                      executionStage === 'completed'
                        ? '[x]'
                        : idx === 0
                        ? '[x]'
                        : idx === 1
                        ? '[/]'
                        : '[ ]';
                    return (
                      <div
                        key={item.id}
                        className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono flex items-center justify-between"
                      >
                        <span className="text-slate-200">
                          <strong className="text-blue-400 mr-2">- {statusBadge}</strong>
                          {item.text}
                        </span>
                        <span className="text-emerald-400 text-[11px]">
                          {statusBadge === '[x]' ? 'COMPLETED' : statusBadge === '[/]' ? 'IN_PROGRESS' : 'PENDING'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {activeArtifactTab === 'implementation_plan.md' && (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600 dark:text-slate-400">
                  <span>
                    {language === 'en'
                      ? 'Click on any line below to add an architectural PR-style review comment:'
                      : 'روی هر خط از سند زیر کلیک کنید تا کامنت ممیزی معماری (Inline PR-Style Comment) اضافه نمایید:'}
                  </span>
                  <span dir="ltr" className="ltr-inline font-mono text-amber-500">
                    {inlineComments.length} Active Review Comment(s)
                  </span>
                </div>

                <div dir="ltr" className="ltr-code rounded-lg border border-slate-800 bg-slate-950 overflow-hidden divide-y divide-slate-900">
                  {currentTask.planLines.map((line) => {
                    const existingComment = inlineComments.find((c) => c.line === line.lineNumber);
                    const isSelected = selectedLineNumber === line.lineNumber;
                    return (
                      <div key={line.lineNumber} className="text-xs font-mono">
                        <button
                          type="button"
                          onClick={() => setSelectedLineNumber(line.lineNumber)}
                          className={`w-full text-left px-3 py-2 flex items-start gap-3 transition-colors cursor-pointer ${
                            isSelected
                              ? 'bg-blue-500/20 text-white'
                              : existingComment
                              ? 'bg-amber-500/10 text-slate-200'
                              : 'hover:bg-slate-900 text-slate-300'
                          }`}
                        >
                          <span className="w-6 text-right text-slate-600 select-none shrink-0">
                            {line.lineNumber}
                          </span>
                          <span className="flex-1 break-all">{line.text}</span>
                          <MessageSquarePlus className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
                        </button>
                        {existingComment && (
                          <div className="px-10 py-2 bg-amber-950/40 border-t border-amber-500/30 text-amber-300 flex items-center justify-between gap-2">
                            <span>
                              <strong>[Architect Inline Review]:</strong> {existingComment.comment}
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                setInlineComments((prev) => prev.filter((c) => c.line !== line.lineNumber))
                              }
                              className="text-[11px] underline text-amber-400 hover:text-white cursor-pointer"
                            >
                              Delete
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Inline Comment Input Box */}
                {selectedLineNumber && (
                  <div className="p-4 rounded-lg border border-blue-500/40 bg-blue-500/5 space-y-2.5">
                    <div className="flex items-center justify-between text-xs font-bold text-blue-600 dark:text-blue-400">
                      <span>
                        {language === 'en'
                          ? `Add review comment on line #${selectedLineNumber}:`
                          : `افزودن کامنت ممیزی روی خط شماره ${selectedLineNumber}:`}
                      </span>
                      <span dir="ltr" className="ltr-inline font-mono">Line #{selectedLineNumber}</span>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <input
                        type="text"
                        value={commentDraft}
                        onChange={(e) => setCommentDraft(e.target.value)}
                        placeholder={
                          language === 'en'
                            ? "e.g. Use selectinload() and enforce Pydantic ConfigDict(extra='forbid')..."
                            : "مثال: Use selectinload() and enforce Pydantic ConfigDict(extra='forbid')..."
                        }
                        className="flex-1 px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white"
                      />
                      <button
                        type="button"
                        onClick={handleAddInlineComment}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>
                          {language === 'en'
                            ? `Save Comment on Line ${selectedLineNumber}`
                            : `ثبت کامنت روی خط ${selectedLineNumber}`}
                        </span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeArtifactTab === 'walkthrough.md' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between text-xs text-emerald-500 font-bold">
                  <span>
                    {language === 'en'
                      ? 'Final Delivery & Verification Proof Artifact (walkthrough.md):'
                      : 'آرتیفکت نهایی تحویل و صحت‌سنجی بصری (walkthrough.md):'}
                  </span>
                  <span dir="ltr" className="ltr-inline font-mono">VERIFIED BY BROWSER SUBAGENT</span>
                </div>
                <div dir="ltr" className="ltr-code p-4 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono text-slate-200 overflow-x-auto">
                  <pre><code>{currentTask.walkthroughReport}</code></pre>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Live Terminal & Browser Subagent Telemetry Stream (4 Cols) */}
        <div className="lg:col-span-4 space-y-5">
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/75 p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Terminal className="w-4 h-4 text-blue-500" />
                <span>{language === 'en' ? 'Agent Terminal & Telemetry' : 'ترمینال و تله‌متری ایجنت'}</span>
              </h3>
              <span dir="ltr" className="ltr-inline text-[11px] font-mono text-slate-500">
                {executionStage.toUpperCase()}
              </span>
            </div>

            <div dir="ltr" className="ltr-code p-3.5 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono space-y-1.5 max-h-72 overflow-y-auto">
              <div className="text-blue-400">
                [Worktree Isolated] {currentTask.worktree}
              </div>
              <div className="text-amber-400">
                [Inline Comments Applied] {inlineComments.length} architect constraint(s) merged into plan.
              </div>
              {executionStage === 'completed' ? (
                currentTask.terminalLogs.map((log, i) => (
                  <div
                    key={i}
                    className={
                      log.includes('PASSED') || log.includes('passed') || log.includes('101') || log.includes('200 OK')
                        ? 'text-emerald-400'
                        : 'text-slate-300'
                    }
                  >
                    {log}
                  </div>
                ))
              ) : (
                <div className="text-slate-400">
                  {language === 'en'
                    ? 'Awaiting human sign-off on implementation_plan.md. Click "Submit Review & Execute" to run terminal & Browser Subagent pipeline.'
                    : 'در انتظار تایید معمار روی implementation_plan.md. برای اجرای پایپ‌لاین دکمه «تایید ممیزی و اجرای ایجنت» را بزنید.'}
                </div>
              )}
            </div>
          </div>

          {/* Simulated WebP Visual Proof Card */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/75 p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Eye className="w-4 h-4 text-emerald-500" />
                <span>{language === 'en' ? 'Browser Subagent Visual Telemetry' : 'ضبط بصری Browser Subagent'}</span>
              </h3>
              <span dir="ltr" className="ltr-inline text-[11px] font-mono text-emerald-500">
                WebP Capture
              </span>
            </div>
            <div dir="ltr" className="ltr-code p-4 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono space-y-2">
              <div className="flex items-center justify-between text-slate-400 border-b border-slate-800 pb-1.5">
                <span>Chromium Headless Viewport</span>
                <span>1440x900</span>
              </div>
              <div className="text-emerald-400">
                ● DOM Accessibility Tree: Verified (RTL/LTR Isolated)
              </div>
              <div className="text-emerald-400">
                ● Console Stream: 0 Uncaught Errors
              </div>
              <div className="text-blue-400">
                ● Artifact Output: .aistudio/artifacts/brain/verified_e2e.webp
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Persistent Knowledge Base & Workspace Sync Inspector (.agent/knowledge-base/user-state.json) */}
      <div
        className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/75 p-6 space-y-5"
        data-testid="workspace-sync-panel"
      >
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/40 flex items-center justify-center text-emerald-500 shrink-0">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                  {language === 'en'
                    ? 'Persistent Workspace & Knowledge Base Sync'
                    : 'همگام‌سازی پایدار محیط کار و پایگاه دانش (Sync Workspace & Knowledge Base)'}
                </h2>
                <span
                  dir="ltr"
                  className="ltr-inline px-2.5 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 font-mono text-xs font-bold"
                >
                  .agent/knowledge-base/user-state.json
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {language === 'en' ? (
                  <>To prevent <span dir="ltr" className="ltr-inline">Context Rot</span> and preserve cross-session continuity, export or restore current task status, inline review comments, and academy module progress in standardized <code dir="ltr" className="ltr-inline">.agent/knowledge-base/user-state.json</code>.</>
                ) : (
                  <>برای جلوگیری از فراموشی کانتکست (<span dir="ltr" className="ltr-inline">Context Rot</span>) و حفظ پیوستگی بین نشست‌های کاری، وضعیت فعلی تسک، کامنت‌های ممیزی خطی و پیشرفت ماژول‌های آکادمی را در قالب فایل استاندارد <code dir="ltr" className="ltr-inline">.agent/knowledge-base/user-state.json</code> استخراج یا بازیابی کنید.</>
                )}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => handleSyncAndExportWorkspace(true)}
              data-testid="export-user-state-json-btn"
              className="px-3.5 py-2 rounded-lg text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{language === 'en' ? 'Download user-state.json' : 'دانلود user-state.json'}</span>
            </button>

            <button
              type="button"
              onClick={handleCopyUserStateJson}
              data-testid="copy-user-state-json-btn"
              className="px-3 py-2 rounded-lg text-xs font-semibold border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-200 hover:border-blue-500 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              {copiedUserState ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                  <span>{language === 'en' ? 'Copied!' : 'کپی شد!'}</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-blue-500" />
                  <span>{language === 'en' ? 'Copy JSON' : 'کپی JSON'}</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                setRestoreJsonDraft(userStateJson);
                setRestoreError('');
                setShowRestorePanel((prev) => !prev);
              }}
              data-testid="toggle-restore-state-btn"
              className="px-3 py-2 rounded-lg text-xs font-semibold border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-200 hover:border-emerald-500 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5 text-emerald-500" />
              <span>{language === 'en' ? 'Import / Restore State' : 'بازیابی وضعیت (Import / Restore State)'}</span>
            </button>
          </div>
        </div>

        {/* Summary KPI Strip for Persistent State */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60">
            <div className="text-[11px] text-slate-500 dark:text-slate-400">
              {language === 'en' ? 'Persistent Artifact Path' : 'مسیر آرتیفکت پایدار'}
            </div>
            <div dir="ltr" className="ltr-inline text-xs font-mono font-bold text-blue-500 mt-1 truncate">
              .agent/knowledge-base/user-state.json
            </div>
          </div>
          <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60">
            <div className="text-[11px] text-slate-500 dark:text-slate-400">
              {language === 'en' ? 'Active Isolated Worktree' : 'شاخه ایزوله فعال (Worktree)'}
            </div>
            <div dir="ltr" className="ltr-inline text-xs font-mono font-bold text-emerald-500 mt-1 truncate">
              {currentTask.worktree}
            </div>
          </div>
          <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60">
            <div className="text-[11px] text-slate-500 dark:text-slate-400">
              {language === 'en' ? 'Stored Audit Comments' : 'کامنت‌های ممیزی ذخیره شده'}
            </div>
            <div dir="ltr" className="ltr-inline text-xs font-mono font-bold text-amber-500 mt-1 tabular-nums">
              {inlineComments.length} Inline Review(s)
            </div>
          </div>
          <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60">
            <div className="text-[11px] text-slate-500 dark:text-slate-400">
              {language === 'en' ? 'Academy Progress' : 'پیشرفت ماژول‌های آکادمی'}
            </div>
            <div dir="ltr" className="ltr-inline text-xs font-mono font-bold text-purple-500 mt-1 tabular-nums">
              {completedModules.length} / {totalModules} ModulesSynced
            </div>
          </div>
        </div>

        {/* Optional Restore / Import Drawer */}
        {showRestorePanel && (
          <div
            data-testid="restore-state-drawer"
            className="p-4 rounded-xl border border-emerald-500/40 bg-emerald-500/5 space-y-3"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300">
                {language === 'en' ? (
                  <>Paste the content of your <code dir="ltr" className="ltr-inline">.agent/knowledge-base/user-state.json</code> to hydrate your previous session:</>
                ) : (
                  <>محتوای فایل <code dir="ltr" className="ltr-inline">.agent/knowledge-base/user-state.json</code> خود را برای بازیابی نشست قبلی وارد کنید:</>
                )}
              </span>
              <span dir="ltr" className="ltr-inline text-[11px] font-mono text-emerald-500">
                Cross-Session State Hydration
              </span>
            </div>
            <textarea
              dir="ltr"
              rows={7}
              value={restoreJsonDraft}
              onChange={(e) => setRestoreJsonDraft(e.target.value)}
              data-testid="restore-state-textarea"
              className="ltr-code w-full p-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs font-mono text-slate-800 dark:text-slate-200"
            />
            {restoreError && (
              <div className="text-xs text-rose-500 font-semibold">{restoreError}</div>
            )}
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowRestorePanel(false)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 cursor-pointer"
              >
                {language === 'en' ? 'Cancel' : 'انصراف'}
              </button>
              <button
                type="button"
                onClick={handleApplyRestoredState}
                data-testid="apply-restore-state-btn"
                className="px-4 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-1.5 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>{language === 'en' ? 'Restore Workspace' : 'اعمال و بازیابی وضعیت (Restore Workspace)'}</span>
              </button>
            </div>
          </div>
        )}

        {/* Live .agent/knowledge-base/user-state.json Code Preview */}
        <CodeSandboxTabs
          examples={[
            {
              id: 'user-state-json-preview',
              title: 'user-state.json',
              filename: '.agent/knowledge-base/user-state.json',
              language: 'json',
              description:
                language === 'en'
                  ? 'Live structured export of workspace state (including active Worktree, task.md checklist state, inline PR review comments, and academy curriculum progress):'
                  : 'خروجی زنده و ساختاریافته وضعیت محیط کار (شامل Worktree فعال، وضعیت چک‌لیست task.md، کامنت‌های ممیزی خطی و پیشرفت سرفصل‌های آکادمی):',
              code: userStateJson,
            },
          ]}
        />
      </div>
    </div>
  );
};
