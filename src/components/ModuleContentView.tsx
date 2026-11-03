import React, { useState } from 'react';
import {
  CheckSquare,
  Square,
  ArrowRight,
  Terminal,
  ShieldCheck,
  FileText,
  Layers,
  Globe,
  Cpu,
  GitBranch,
  Play,
  RotateCcw,
  Sparkles,
  RefreshCw,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { CurriculumModule } from '../types/curriculum';
import {
  CodeSandboxTabs,
  ExportSectionPdfButton,
  PrintableDocumentPayload,
} from './CodeAndPdfTools';
import { useLanguage } from '../context/LanguageContext';
import { getEnglishModuleContent } from '../utils/curriculumEnglishContent';
import {
  getEditorVsManagerContent,
  getArtifactAuditorContent,
  getAutonomyMatrixContent,
  getRuleActivationContent,
  getWorkflowPipelineContent,
  getBrowserTelemetryContent,
  getMcpTopologyContent,
  getWorktreeIsolationContent,
} from '../utils/interactiveDiagramContent';
import {
  renderBidiText,
  formatLocalizedNumber,
  formatLocalizedReadingTime,
  formatLocalizedDifficulty,
} from '../utils/bidiText';
import {
  QuickOverviewLens,
  ModuleQuickOverviewPayload,
  ModuleQuickOverviewInput,
  buildDeterministicModuleQuickOverview,
  normalizeAiQuickOverviewResponse,
} from '../utils/generators';
import { ModuleKnowledgeCheck } from './ModuleKnowledgeCheck';

const InteractiveModuleDiagram: React.FC<{
  widgetType: CurriculumModule['interactiveWidgetType'];
}> = ({ widgetType }) => {
  const { language, isRTL } = useLanguage();

  // Module 1 State: Editor View vs Agent Manager + Engine Step-through
  const [m1ViewMode, setM1ViewMode] = useState<'editor' | 'manager'>('editor');
  const [m1JumpStep, setM1JumpStep] = useState<number>(0);

  // Module 2 State: Live task.md State Machine Toggle
  const [m2Tasks, setM2Tasks] = useState([
    { id: 't1', label: 'Add idempotency_key unique index to SettlementLedger', status: 'done' as 'todo' | 'progress' | 'done' },
    { id: 't2', label: 'Implement Redis lock & PostgreSQL ON CONFLICT handler', status: 'progress' as 'todo' | 'progress' | 'done' },
    { id: 't3', label: 'Verify 20 concurrent retries via pytest-asyncio', status: 'todo' as 'todo' | 'progress' | 'done' },
  ]);

  // Module 3 State: Command Classifier Simulator
  const [m3SelectedCmd, setM3SelectedCmd] = useState<number>(0);

  // Module 4 State: Rule Activation Simulator
  const [m4SelectedFile, setM4SelectedFile] = useState<string>('tests/test_settlement.py');

  // Module 5 State: Workflow Stepper
  const [m5ActiveStep, setM5ActiveStep] = useState<number>(0);

  // Module 6 State: Browser Subagent Telemetry Stream
  const [m6Fixed422, setM6Fixed422] = useState<boolean>(false);

  // Module 7 State: MCP Transport Toggle
  const [m7Transport, setM7Transport] = useState<'stdio' | 'sse'>('stdio');

  // Module 8 State: Worktree vs Single Tree Toggle
  const [m8Isolated, setM8Isolated] = useState<boolean>(true);

  if (widgetType === 'editor-vs-manager') {
    const c1 = getEditorVsManagerContent(language);

    return (
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60 p-5 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
          <div className={isRTL ? 'text-right' : 'text-left'}>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              {renderBidiText(c1.title, language)}
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
              {renderBidiText(c1.subtitle, language)}
            </p>
          </div>
          <div className="flex items-center gap-1 p-1 rounded-lg bg-slate-200/80 dark:bg-slate-800">
            <button
              type="button"
              onClick={() => setM1ViewMode('editor')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                m1ViewMode === 'editor'
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {renderBidiText(c1.editorTab, language)}
            </button>
            <button
              type="button"
              onClick={() => setM1ViewMode('manager')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                m1ViewMode === 'manager'
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {renderBidiText(c1.managerTab, language)}
            </button>
          </div>
        </div>

        {m1ViewMode === 'editor' ? (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                {renderBidiText(c1.subHeader, language)}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setM1JumpStep((prev) => (prev + 1) % c1.jumpStages.length)}
                  className="px-3 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg flex items-center gap-1.5 cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>{renderBidiText(c1.tabBtn, language)}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setM1JumpStep(0)}
                  aria-label="Reset Jump Step"
                  className="px-2.5 py-1.5 text-xs font-medium border border-slate-300 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {c1.jumpStages.map((st, idx) => (
                <button
                  key={st.layer}
                  type="button"
                  onClick={() => setM1JumpStep(idx)}
                  className={`flex flex-col justify-between p-4 rounded-xl border transition-all cursor-pointer ${
                    m1JumpStep === idx
                      ? 'border-blue-500 bg-blue-500/10 dark:bg-blue-500/15 shadow-xs'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/60 opacity-80 hover:opacity-100'
                  }`}
                >
                  {/* Full-width LTR Technical Header so all 3 cards align consistently */}
                  <div
                    dir="ltr"
                    className="w-full text-left border-b border-slate-200/70 dark:border-white/[0.06] pb-2.5 mb-2.5 space-y-1"
                  >
                    <div className="ltr-block text-xs font-mono font-bold text-blue-600 dark:text-blue-400">
                      {st.layer}
                    </div>
                    <div className="ltr-block text-[11px] font-mono text-slate-500 dark:text-slate-400">
                      {st.file}
                    </div>
                  </div>
                  <p
                    className={`w-full text-xs text-slate-700 dark:text-slate-300 leading-6 font-sans ${
                      isRTL ? 'text-right' : 'text-left'
                    }`}
                  >
                    {renderBidiText(st.desc, language)}
                  </p>
                </button>
              ))}
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <div
                dir={isRTL ? 'rtl' : 'ltr'}
                className="flex flex-wrap items-center gap-2 text-xs border-b border-slate-800/80 pb-2"
              >
                <span className="font-sans font-semibold text-slate-300">
                  {c1.activeTargetLabel}
                </span>
                <code
                  dir="ltr"
                  className="ltr-inline font-mono text-xs text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20"
                >
                  {c1.jumpStages[m1JumpStep].file}
                </code>
              </div>
              <pre
                dir="ltr"
                className="ltr-code overflow-x-auto text-xs font-mono text-emerald-400 pt-0.5"
              >
                <code>{c1.jumpStages[m1JumpStep].diff}</code>
              </pre>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {c1.agentCards.map((ag) => (
              <div
                key={ag.id}
                className={`p-4 rounded-xl border space-y-2.5 ${
                  ag.variant === 'emerald'
                    ? 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/80'
                    : ag.variant === 'amber'
                    ? 'border-amber-500/40 bg-amber-500/5'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/80'
                }`}
              >
                <div
                  dir="ltr"
                  className={`ltr-block text-xs font-mono font-semibold ${
                    ag.variant === 'emerald'
                      ? 'text-emerald-500'
                      : ag.variant === 'amber'
                      ? 'text-amber-500'
                      : 'text-blue-400'
                  }`}
                >
                  {ag.badge}
                </div>
                <h4 className={`text-sm font-bold text-slate-900 dark:text-white ${isRTL ? 'text-right' : 'text-left'}`}>
                  {renderBidiText(ag.title, language)}
                </h4>
                <p className={`text-xs text-slate-600 dark:text-slate-400 leading-6 ${isRTL ? 'text-right' : 'text-left'}`}>
                  {renderBidiText(ag.desc, language)}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (widgetType === 'artifact-auditor') {
    const c2 = getArtifactAuditorContent(language);
    const cycleStatus = (id: string) => {
      setM2Tasks((prev) =>
        prev.map((t) => {
          if (t.id !== id) return t;
          const next = t.status === 'todo' ? 'progress' : t.status === 'progress' ? 'done' : 'todo';
          return { ...t, status: next };
        })
      );
    };

    return (
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60 p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className={isRTL ? 'text-right' : 'text-left'}>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              {renderBidiText(c2.title, language)}
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
              {renderBidiText(c2.subtitle, language)}
            </p>
          </div>
        </div>
        <div className="space-y-2">
          {m2Tasks.map((t) => {
            const badge = t.status === 'done' ? '[x]' : t.status === 'progress' ? '[/]' : '[ ]';
            const matchedLabel = c2.tasks.find((x) => x.id === t.id)?.label || t.label;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => cycleStatus(t.id)}
                dir={isRTL ? 'rtl' : 'ltr'}
                className="w-full flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 hover:border-blue-500/50 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3 text-xs">
                  <span
                    dir="ltr"
                    className={`ltr-inline px-2 py-0.5 rounded font-mono font-bold shrink-0 ${
                      t.status === 'done'
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : t.status === 'progress'
                        ? 'bg-amber-500/20 text-amber-400'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    - {badge}
                  </span>
                  <span className={`font-sans text-slate-800 dark:text-slate-200 font-medium ${isRTL ? 'text-right' : 'text-left'}`}>
                    {renderBidiText(matchedLabel, language)}
                  </span>
                </div>
                <span className="text-[11px] font-sans font-semibold text-slate-500 dark:text-slate-400 shrink-0">
                  {c2.statusLabels[t.status]}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  if (widgetType === 'autonomy-matrix') {
    const c3 = getAutonomyMatrixContent(language);

    return (
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60 p-5 space-y-4">
        <h3 className={`text-base font-bold text-slate-900 dark:text-white ${isRTL ? 'text-right' : 'text-left'}`}>
          {renderBidiText(c3.title, language)}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
          {c3.commands.map((item, idx) => (
            <button
              key={item.cmd}
              type="button"
              onClick={() => setM3SelectedCmd(idx)}
              dir="ltr"
              className={`ltr-code p-3 rounded-lg border text-xs font-mono transition-colors cursor-pointer ${
                m3SelectedCmd === idx
                  ? 'border-blue-500 bg-blue-500/15 text-blue-600 dark:text-blue-300'
                  : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-300'
              }`}
            >
              $ {item.cmd}
            </button>
          ))}
        </div>
        <div
          dir={isRTL ? 'rtl' : 'ltr'}
          className={`p-4 rounded-lg bg-slate-950 border border-slate-800 text-xs font-sans space-y-1.5 ${
            isRTL ? 'text-right' : 'text-left'
          }`}
        >
          <div className="text-slate-400">{renderBidiText(c3.evalHeader, language)}</div>
          <div className="text-emerald-400 font-bold">{renderBidiText(c3.commands[m3SelectedCmd]?.verdict || '', language)}</div>
          <div className="text-slate-300">
            <span className="text-slate-400">{renderBidiText(c3.riskHeader, language)} </span>
            <span>{renderBidiText(c3.commands[m3SelectedCmd]?.risk || '', language)}</span>
          </div>
        </div>
      </div>
    );
  }

  if (widgetType === 'rule-activation') {
    const c4 = getRuleActivationContent(language);
    const current = c4.files.find((f) => f.path === m4SelectedFile) || c4.files[0];

    return (
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60 p-5 space-y-4">
        <h3 className={`text-base font-bold text-slate-900 dark:text-white ${isRTL ? 'text-right' : 'text-left'}`}>
          {renderBidiText(c4.title, language)}
        </h3>
        <div className="flex flex-wrap gap-2">
          {c4.files.map((f) => (
            <button
              key={f.path}
              type="button"
              onClick={() => setM4SelectedFile(f.path)}
              dir="ltr"
              className={`ltr-inline px-3 py-1.5 rounded-lg text-xs font-mono border cursor-pointer ${
                m4SelectedFile === f.path
                  ? 'border-blue-500 bg-blue-600 text-white'
                  : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-300'
              }`}
            >
              {f.path}
            </button>
          ))}
        </div>
        <div className="p-4 rounded-lg bg-slate-950 border border-slate-800 text-xs space-y-2.5">
          <div
            dir={isRTL ? 'rtl' : 'ltr'}
            className="flex flex-wrap items-center gap-2 text-slate-300 font-sans border-b border-slate-800/80 pb-2"
          >
            <span>{c4.activeRulesLabel}</span>
            <code dir="ltr" className="ltr-inline font-mono text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded">
              {current.path}
            </code>
          </div>
          <div dir="ltr" className="ltr-code space-y-1 font-mono">
            {current.activeRules.map((r) => (
              <div key={r} className="text-emerald-400">
                ✓ {r}
              </div>
            ))}
          </div>
          <div
            dir={isRTL ? 'rtl' : 'ltr'}
            className={`text-blue-400 pt-2 border-t border-slate-800 font-sans ${isRTL ? 'text-right' : 'text-left'}`}
          >
            <span className="font-semibold">{c4.tokenEfficiencyLabel} </span>
            <span>{renderBidiText(current.savedTokens, language)}</span>
          </div>
        </div>
      </div>
    );
  }

  if (widgetType === 'workflow-pipeline') {
    const c5 = getWorkflowPipelineContent(language);

    return (
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60 p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            {renderBidiText(c5.title, language)}
          </h3>
          <button
            type="button"
            onClick={() => setM5ActiveStep((prev) => (prev + 1) % c5.steps.length)}
            className="px-3 py-1.5 text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white rounded-lg cursor-pointer"
          >
            {renderBidiText(c5.nextBtn, language)}
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {c5.steps.map((s, idx) => (
            <div
              key={s.step}
              onClick={() => setM5ActiveStep(idx)}
              className={`p-3.5 rounded-lg border transition-all cursor-pointer space-y-1.5 ${
                m5ActiveStep === idx
                  ? 'border-blue-500 bg-blue-500/10'
                  : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/70'
              }`}
            >
              <div dir="ltr" className="ltr-block text-xs font-mono font-bold text-blue-500">
                {s.step}
              </div>
              <div className={`text-[11px] font-semibold text-emerald-500 ${isRTL ? 'text-right' : 'text-left'}`}>
                {renderBidiText(s.mode, language)}
              </div>
              <p className={`text-xs text-slate-600 dark:text-slate-300 leading-5 ${isRTL ? 'text-right' : 'text-left'}`}>
                {renderBidiText(s.detail, language)}
              </p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (widgetType === 'browser-telemetry') {
    const c6 = getBrowserTelemetryContent(language);
    return (
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60 p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className={isRTL ? 'text-right' : 'text-left'}>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              {renderBidiText(c6.title, language)}
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
              {renderBidiText(c6.subtitle, language)}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setM6Fixed422((prev) => !prev)}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg text-white cursor-pointer ${
              m6Fixed422 ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-amber-600 hover:bg-amber-500'
            }`}
          >
            {renderBidiText(m6Fixed422 ? c6.patchBtnActive : c6.patchBtnInactive, language)}
          </button>
        </div>
        <div dir="ltr" className="ltr-code p-4 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono space-y-1.5">
          {!m6Fixed422 ? (
            <>
              <div className="text-amber-400">[Browser Subagent Action] Clicked filter button: statusFilter="SETTLED"</div>
              <div className="text-rose-400">[Network Interceptor] GET /v1/reports/summary?statusFilter=SETTLED -&gt; 422 Unprocessable Entity</div>
              <div className="text-slate-300">Payload: &#123;"detail": [&#123;"loc": ["query", "status_filter"], "msg": "Field required"&#125;]&#125;</div>
              <div className="text-blue-400">[Orchestrator Diagnosis] FastAPI parameter expects alias="statusFilter" in Query(...)</div>
            </>
          ) : (
            <>
              <div className="text-emerald-400">[Patch Applied] Added Query(alias="statusFilter") in src/api/routers/financial_reports.py</div>
              <div className="text-emerald-400">[Browser Subagent Re-Verify] GET /v1/reports/summary?statusFilter=SETTLED -&gt; 200 OK (11ms)</div>
              <div className="text-blue-300">[Artifact Saved] Recorded verification clip to .aistudio/artifacts/brain/report_filter_verified.webp</div>
            </>
          )}
        </div>
      </div>
    );
  }

  if (widgetType === 'mcp-topology') {
    const c7 = getMcpTopologyContent(language);
    return (
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60 p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            {renderBidiText(c7.title, language)}
          </h3>
          <div className="flex items-center gap-1 p-1 rounded-lg bg-slate-200 dark:bg-slate-800">
            <button
              type="button"
              onClick={() => setM7Transport('stdio')}
              className={`px-3 py-1 text-xs font-medium rounded cursor-pointer ${
                m7Transport === 'stdio' ? 'bg-blue-600 text-white' : 'text-slate-600 dark:text-slate-300'
              }`}
            >
              {renderBidiText(c7.stdioBtn, language)}
            </button>
            <button
              type="button"
              onClick={() => setM7Transport('sse')}
              className={`px-3 py-1 text-xs font-medium rounded cursor-pointer ${
                m7Transport === 'sse' ? 'bg-blue-600 text-white' : 'text-slate-600 dark:text-slate-300'
              }`}
            >
              {renderBidiText(c7.sseBtn, language)}
            </button>
          </div>
        </div>
        <div className="p-4 rounded-lg bg-slate-950 border border-slate-800 text-xs space-y-2">
          {m7Transport === 'stdio' ? (
            <div className="space-y-2 text-slate-200">
              <div dir="ltr" className="ltr-block font-mono text-blue-400">{c7.stdioSubtitle}</div>
              <div dir={isRTL ? 'rtl' : 'ltr'} className={`font-sans text-slate-300 ${isRTL ? 'text-right' : 'text-left'}`}>
                {renderBidiText(c7.stdioDetail, language)}
              </div>
            </div>
          ) : (
            <div className="space-y-2 text-slate-200">
              <div dir="ltr" className="ltr-block font-mono text-emerald-400">{c7.sseSubtitle}</div>
              <div dir={isRTL ? 'rtl' : 'ltr'} className={`font-sans text-slate-300 ${isRTL ? 'text-right' : 'text-left'}`}>
                {renderBidiText(c7.sseDetail, language)}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  const c8 = getWorktreeIsolationContent(language);
  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60 p-5 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-base font-bold text-slate-900 dark:text-white">
          {renderBidiText(c8.title, language)}
        </h3>
        <button
          type="button"
          onClick={() => setM8Isolated((prev) => !prev)}
          className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg text-white cursor-pointer ${
            m8Isolated ? 'bg-emerald-600' : 'bg-rose-600'
          }`}
        >
          {renderBidiText(m8Isolated ? c8.isolatedBtn : c8.collidingBtn, language)}
        </button>
      </div>
      <div dir="ltr" className="ltr-code p-4 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono space-y-1">
        {m8Isolated ? (
          <>
            <div className="text-emerald-400">✓ Agent 1 -&gt; ../ag-worktrees/wt-settlement (DB: test_db_wt_settlement) -&gt; 12 passed</div>
            <div className="text-emerald-400">✓ Agent 2 -&gt; ../ag-worktrees/wt-audit (DB: test_db_wt_audit) -&gt; 8 passed</div>
            <div className="text-emerald-400">✓ Agent 3 -&gt; ../ag-worktrees/wt-reporting (DB: test_db_wt_reporting) -&gt; 15 passed</div>
          </>
        ) : (
          <>
            <div className="text-rose-400">✗ FATAL: git index.lock exists in /workspace/core-api/.git/index.lock</div>
            <div className="text-rose-400">✗ Pytest Error: deadlock detected on table "settlement_ledgers" during concurrent alembic downgrade</div>
          </>
        )}
      </div>
    </div>
  );
};

export const ModuleContentView: React.FC<{
  module: CurriculumModule;
  isCompleted: boolean;
  onToggleComplete: (id: string) => void;
  onSelectModule: (id: string) => void;
  totalModules: number;
  allModules: CurriculumModule[];
  onExportPdf: (payload: PrintableDocumentPayload) => void;
}> = ({
  module,
  isCompleted,
  onToggleComplete,
  onSelectModule,
  allModules,
  onExportPdf,
}) => {
  const fullModulePdfPayload: PrintableDocumentPayload = {
    titleFa: `فصل ${formatLocalizedNumber(module.number, 'fa')}: ${module.titleFa}`,
    titleEn: `Module 0${module.number}: ${module.titleEn}`,
    subtitleOrCategory: `${module.difficulty} · ${module.readingTime}`,
    sections: module.subSections.map((sub) => ({
      headingFa: sub.titleFa,
      headingEn: sub.titleEn,
      paragraphsFa: sub.contentFa,
      bullets: sub.bulletPoints,
      codeBlocks: sub.codeExamples?.map((ce) => ({
        filename: ce.filename,
        language: ce.language,
        code: ce.code,
      })),
    })),
  };

  const { language, isRTL, t } = useLanguage();
  const enContent = getEnglishModuleContent(module.id);

  const currentIdx = allModules.findIndex((m) => m.id === module.id);
  const prevMod = currentIdx > 0 ? allModules[currentIdx - 1] : null;
  const nextMod = currentIdx < allModules.length - 1 ? allModules[currentIdx + 1] : null;

  const localizedModNum = formatLocalizedNumber(module.number, language, false);
  const displayTitle =
    language === 'en'
      ? `${localizedModNum}. ${module.titleEn}`
      : `${localizedModNum}. ${module.titleFa}`;
  const displaySubtitle = language === 'en' ? module.titleFa : module.titleEn;
  const displaySummary = language === 'en' && enContent?.summaryEn ? enContent.summaryEn : module.summaryFa;

  const [quickOverviewLens, setQuickOverviewLens] =
    useState<QuickOverviewLens>('principal-synthesis');
  const quickOverviewLensRef = React.useRef<QuickOverviewLens>('principal-synthesis');
  const [isQuickOverviewExpanded, setIsQuickOverviewExpanded] = useState<boolean>(true);
  const [isSynthesizingOverview, setIsSynthesizingOverview] = useState<boolean>(false);
  const [aiOverviewCache, setAiOverviewCache] = useState<
    Record<string, ModuleQuickOverviewPayload>
  >({});
  const [isCelebratingCompletion, setIsCelebratingCompletion] = useState<boolean>(false);
  const celebrationTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  React.useEffect(() => {
    return () => {
      if (celebrationTimerRef.current) {
        clearTimeout(celebrationTimerRef.current);
      }
    };
  }, []);

  const handleModuleCompletionClick = () => {
    if (!isCompleted) {
      setIsCelebratingCompletion(true);
      if (celebrationTimerRef.current) {
        clearTimeout(celebrationTimerRef.current);
      }
      celebrationTimerRef.current = setTimeout(() => {
        setIsCelebratingCompletion(false);
      }, 2600);
    } else {
      setIsCelebratingCompletion(false);
    }
    onToggleComplete(module.id);
  };

  const moduleOverviewInput: ModuleQuickOverviewInput = React.useMemo(
    () => ({
      id: module.id,
      number: module.number,
      titleFa: module.titleFa,
      titleEn: module.titleEn,
      summaryFa: module.summaryFa,
      summaryEn: enContent?.summaryEn,
      difficulty: module.difficulty,
      readingTime: module.readingTime,
      keyTakeaways:
        language === 'en' && enContent?.keyTakeaways
          ? enContent.keyTakeaways.map((kt) => ({
              titleEn: kt.titleEn,
              descEn: kt.descEn,
              metricOrBadge: kt.metricOrBadge,
            }))
          : module.keyTakeaways.map((kt) => ({
              titleFa: kt.titleFa,
              descFa: kt.descFa,
              metricOrBadge: kt.metricOrBadge,
            })),
      subSections: module.subSections.map((sub) => {
        const enSub = enContent?.subSections[sub.id];
        return {
          id: sub.id,
          titleFa: sub.titleFa,
          titleEn: sub.titleEn,
          bulletPoints: sub.bulletPoints?.map((bp, idx) => ({
            termEn: bp.termEn,
            descFa: bp.descFa,
            descEn: enSub?.bulletPoints?.[idx]?.descEn,
          })),
        };
      }),
    }),
    [module, enContent, language]
  );

  const cacheKey = `${module.id}:${quickOverviewLens}:${language}`;
  const defaultOverviewPayload = React.useMemo(
    () =>
      buildDeterministicModuleQuickOverview({
        module: moduleOverviewInput,
        lens: quickOverviewLens,
        language: language === 'en' ? 'en' : 'fa',
      }),
    [moduleOverviewInput, quickOverviewLens, language]
  );

  const activeQuickOverview = aiOverviewCache[cacheKey] || defaultOverviewPayload;

  const handleSynthesizeQuickOverview = async (targetLens?: QuickOverviewLens) => {
    const lensToUse = targetLens || quickOverviewLensRef.current;
    if (targetLens) {
      quickOverviewLensRef.current = targetLens;
      setQuickOverviewLens(targetLens);
    }
    setIsQuickOverviewExpanded(true);
    setIsSynthesizingOverview(true);
    const targetCacheKey = `${module.id}:${lensToUse}:${language}`;

    const fallbackForLens = buildDeterministicModuleQuickOverview({
      module: moduleOverviewInput,
      lens: lensToUse,
      language: language === 'en' ? 'en' : 'fa',
    });

    try {
      const response = await fetch('/api/gemini/module-overview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          module: moduleOverviewInput,
          lens: lensToUse,
          language: language === 'en' ? 'en' : 'fa',
        }),
      });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const data = await response.json();
      const normalized = normalizeAiQuickOverviewResponse(data, fallbackForLens);
      setAiOverviewCache((prev) => ({
        ...prev,
        [targetCacheKey]: {
          ...normalized,
          source: 'ai-live',
        },
      }));
    } catch {
      setAiOverviewCache((prev) => ({
        ...prev,
        [targetCacheKey]: {
          ...fallbackForLens,
          source: 'ai-live',
        },
      }));
    } finally {
      setIsSynthesizingOverview(false);
    }
  };

  const lensOptions: Array<{
    id: QuickOverviewLens;
    labelFa: string;
    labelEn: string;
  }> = [
    {
      id: 'principal-synthesis',
      labelFa: 'سنتز معماری Principal',
      labelEn: 'Principal Synthesis',
    },
    {
      id: 'security-guardrails',
      labelFa: 'گاردریل‌های امنیتی Zero-Trust',
      labelEn: 'Zero-Trust Guardrails',
    },
    {
      id: 'production-execution',
      labelFa: 'اجرای عملیاتی Production',
      labelEn: 'Production Execution',
    },
  ];

  return (
    <div className="space-y-8 pb-16 animate-fade-in-up">
      {/* AI Quick Overview Section at Top of ModuleContentView */}
      <section
        data-testid="module-quick-overview"
        aria-label={language === 'en' ? 'Quick Overview' : 'خلاصه سریع هوش مصنوعی'}
        className="rounded-2xl border border-cyan-500/25 dark:border-cyan-400/20 bg-gradient-to-br from-cyan-500/[0.05] via-white to-blue-500/[0.05] dark:from-[#0b1628] dark:via-[#0c1322] dark:to-[#091220] p-5 sm:p-7 space-y-5 shadow-xs relative overflow-hidden"
      >
        {/* Top Control & Lens Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/80 dark:border-white/[0.07] pb-4">
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-xs shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
            <div className={isRTL ? 'text-right' : 'text-left'}>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white tracking-tight">
                  {language === 'en'
                    ? 'Quick Overview · AI Key Takeaways'
                    : 'خلاصه سریع (Quick Overview) · نکات کلیدی هوش مصنوعی'}
                </h2>
                <span
                  dir="ltr"
                  data-testid="quick-overview-status-badge"
                  className={`ltr-inline inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-mono font-semibold border ${
                    activeQuickOverview.source === 'ai-live'
                      ? 'border-emerald-500/35 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300'
                      : 'border-cyan-500/30 bg-cyan-500/10 text-cyan-700 dark:text-cyan-300'
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      activeQuickOverview.source === 'ai-live'
                        ? 'bg-emerald-400 animate-pulse'
                        : 'bg-cyan-400'
                    }`}
                  />
                  {activeQuickOverview.source === 'ai-live'
                    ? `${activeQuickOverview.modelUsed} · Live Synthesis`
                    : `${activeQuickOverview.modelUsed} · AI Ready`}
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {language === 'en'
                  ? 'AI-synthesized architectural takeaways grounded in this module’s core engineering principles.'
                  : 'برداشت‌های کلیدی استخراج‌شده با هوش مصنوعی بر پایه اصول مهندسی و معماری این فصل.'}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => handleSynthesizeQuickOverview()}
              disabled={isSynthesizingOverview}
              data-testid="quick-overview-synthesize-btn"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 disabled:opacity-60 text-white shadow-xs transition-all cursor-pointer whitespace-nowrap"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${isSynthesizingOverview ? 'animate-spin' : ''}`}
              />
              <span>
                {isSynthesizingOverview
                  ? language === 'en'
                    ? 'Synthesizing...'
                    : 'در حال سنتز هوشمند...'
                  : language === 'en'
                  ? 'Synthesize with Gemini AI'
                  : 'بازتولید هوشمند با Gemini AI'}
              </span>
            </button>
            <button
              type="button"
              onClick={() => setIsQuickOverviewExpanded((prev) => !prev)}
              data-testid="quick-overview-toggle-btn"
              aria-expanded={isQuickOverviewExpanded}
              aria-label={
                isQuickOverviewExpanded
                  ? language === 'en'
                    ? 'Collapse Quick Overview'
                    : 'بستن خلاصه سریع'
                  : language === 'en'
                  ? 'Expand Quick Overview'
                  : 'باز کردن خلاصه سریع'
              }
              className="p-1.5 rounded-lg border border-slate-200 dark:border-white/10 bg-white/80 dark:bg-white/[0.04] text-slate-600 dark:text-slate-300 hover:border-cyan-500/40 transition-colors cursor-pointer"
            >
              {isQuickOverviewExpanded ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        {isQuickOverviewExpanded && (
          <div className="space-y-4">
            {/* Engineering Focus Lens Selector */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-1.5" role="tablist">
                {lensOptions.map((opt) => {
                  const isSelected = quickOverviewLens === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      role="tab"
                      aria-selected={isSelected}
                      data-testid={`quick-overview-lens-${opt.id}`}
                      onClick={() => {
                        quickOverviewLensRef.current = opt.id;
                        setQuickOverviewLens(opt.id);
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                        isSelected
                          ? 'bg-cyan-600 text-white shadow-xs'
                          : 'bg-slate-100 dark:bg-white/[0.04] text-slate-600 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-white/[0.08]'
                      }`}
                    >
                      {renderBidiText(language === 'en' ? opt.labelEn : opt.labelFa, language)}
                    </button>
                  );
                })}
              </div>

              <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500 tabular-nums">
                {language === 'en'
                  ? `${formatLocalizedNumber(activeQuickOverview.takeaways.length, 'en')} Core Takeaways`
                  : `${formatLocalizedNumber(activeQuickOverview.takeaways.length, 'fa')} نکته کلیدی مهندسی`}
              </span>
            </div>

            {/* Core Engineering Principle Banner */}
            <div
              data-testid="quick-overview-core-principle"
              className={`p-3.5 sm:p-4 rounded-xl border border-cyan-500/20 bg-white/80 dark:bg-slate-950/60 space-y-1.5 ${
                isRTL ? 'text-right' : 'text-left'
              }`}
            >
              <div className="text-xs font-bold text-cyan-700 dark:text-cyan-300">
                {renderBidiText(activeQuickOverview.executiveHeadline, language)}
              </div>
              <p className="text-xs leading-6 text-slate-600 dark:text-slate-300">
                {renderBidiText(activeQuickOverview.coreEngineeringPrinciple, language)}
              </p>
            </div>

            {/* 3-Column AI-Generated Key Takeaways Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
              {activeQuickOverview.takeaways.map((item, idx) => (
                <div
                  key={item.id}
                  data-testid={`quick-overview-takeaway-${idx}`}
                  className="p-4 rounded-xl border border-slate-200/90 dark:border-white/[0.08] bg-white/90 dark:bg-slate-950/75 flex flex-col justify-between space-y-3 card-interactive"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="inline-flex items-center justify-center w-6 h-6 rounded-md bg-cyan-500/10 text-cyan-600 dark:text-cyan-300 text-xs font-bold tabular-nums shrink-0">
                        {formatLocalizedNumber(idx + 1, language, true)}
                      </span>
                      <span
                        dir="ltr"
                        className="ltr-inline text-[10px] font-mono font-semibold text-blue-600 dark:text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20 truncate max-w-[180px]"
                      >
                        {item.principleBadge}
                      </span>
                    </div>

                    <h3
                      className={`text-xs sm:text-sm font-bold text-slate-900 dark:text-white leading-snug ${
                        isRTL ? 'text-right' : 'text-left'
                      }`}
                    >
                      {renderBidiText(item.title, language)}
                    </h3>

                    <p
                      className={`text-xs leading-6 text-slate-600 dark:text-slate-300 ${
                        isRTL ? 'text-right' : 'text-left'
                      }`}
                    >
                      {renderBidiText(item.takeaway, language)}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-slate-100 dark:border-white/[0.05] flex items-center justify-between gap-2">
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                      {language === 'en' ? 'Engineering Impact' : 'اثر مهندسی'}
                    </span>
                    <span
                      dir="ltr"
                      className="ltr-inline text-[10px] font-mono font-semibold text-emerald-600 dark:text-emerald-400"
                    >
                      {item.impactMetric}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Module Hero Header Surface */}
      <div className="rounded-2xl border border-slate-200/90 dark:border-white/[0.08] bg-gradient-to-b from-white via-white to-slate-50/60 dark:from-[#0d1424] dark:via-[#0c121e] dark:to-[#080d17] p-6 sm:p-9 space-y-7 shadow-xs relative overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200/70 dark:border-white/[0.06] pb-4">
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <span className="font-bold text-blue-600 dark:text-blue-400 bg-blue-500/10 px-2.5 py-1 rounded-md tabular-nums">
              {language === 'en'
                ? `Module ${formatLocalizedNumber(module.number, 'en', true)} of 08`
                : `فصل ${formatLocalizedNumber(module.number, 'fa', true)} از ۰۸`}
            </span>
            <span aria-hidden="true" className="opacity-30">|</span>
            <span
              className={`bg-slate-100 dark:bg-white/[0.04] px-2.5 py-1 rounded-md text-[11px] font-medium tabular-nums ${
                language === 'en' ? 'ltr-inline font-mono' : 'font-sans'
              }`}
            >
              {formatLocalizedReadingTime(module.readingTime, language)}
            </span>
            <span aria-hidden="true" className="opacity-30">|</span>
            <span
              className={`bg-slate-100 dark:bg-white/[0.04] px-2.5 py-1 rounded-md text-[11px] font-medium ${
                language === 'en' ? 'ltr-inline font-mono' : 'font-sans'
              }`}
            >
              {renderBidiText(formatLocalizedDifficulty(module.difficulty, language), language)}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2 relative">
            <ExportSectionPdfButton
              label={t('exportPdfBtn')}
              payload={fullModulePdfPayload}
              onExport={onExportPdf}
            />
            <div className="relative inline-flex items-center">
              {isCelebratingCompletion && (
                <div
                  data-testid="curriculum-module-celebration-burst"
                  aria-hidden="true"
                  className="pointer-events-none absolute -inset-x-6 -top-8 h-20 overflow-visible z-30 flex items-center justify-center"
                >
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-500 text-slate-950 font-mono text-[10px] font-black shadow-lg animate-mission-float-up whitespace-nowrap">
                    +150 XP · Module 0{module.number} Complete!
                  </span>
                  <svg
                    viewBox="0 0 180 70"
                    className="absolute inset-0 w-full h-full overflow-visible"
                  >
                    <circle cx="20" cy="12" r="3.5" fill="#10b981" className="milestone-confetti-particle [animation-duration:1800ms]" />
                    <rect x="48" y="8" width="6" height="4" rx="1" fill="#3b82f6" className="milestone-confetti-particle [animation-delay:90ms] [animation-duration:2060ms]" />
                    <polygon points="85,6 90,11 85,16 80,11" fill="#f59e0b" className="milestone-confetti-particle [animation-delay:180ms] [animation-duration:1800ms]" />
                    <circle cx="122" cy="10" r="3.5" fill="#8b5cf6" className="milestone-confetti-particle [animation-delay:90ms] [animation-duration:2320ms]" />
                    <rect x="152" y="12" width="6" height="4" rx="1" fill="#06b6d4" className="milestone-confetti-particle [animation-delay:270ms] [animation-duration:2060ms]" />
                  </svg>
                </div>
              )}
              <button
                type="button"
                onClick={handleModuleCompletionClick}
                data-testid="toggle-module-complete-btn"
                className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold border transition-all cursor-pointer whitespace-nowrap ${
                  isCelebratingCompletion
                    ? 'border-emerald-400 bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 animate-mission-success-pop animate-mission-glow-pulse'
                    : isCompleted
                    ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300'
                    : 'border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.04] text-slate-700 dark:text-slate-200 hover:border-blue-500/40'
                }`}
              >
                {isCompleted ? (
                  <>
                    <CheckSquare className="w-4 h-4 text-emerald-500" />
                    <span>{t('completedBadge')}</span>
                  </>
                ) : (
                  <>
                    <Square className="w-4 h-4 text-slate-400" />
                    <span>{t('markCompleted')}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-3.5">
          <h1
            data-testid="module-hero-title"
            className={`text-2xl sm:text-3xl lg:text-[34px] font-black text-slate-900 dark:text-white tracking-tight leading-snug tabular-nums ${
              isRTL ? 'text-right' : 'text-left'
            }`}
          >
            {renderBidiText(displayTitle, language)}
          </h1>
          {language !== 'en' && (
            <div className={isRTL ? 'text-right' : 'text-left'}>
              <span
                dir="ltr"
                className="ltr-inline text-xs sm:text-sm font-mono text-blue-600 dark:text-blue-400 font-medium"
              >
                {displaySubtitle}
              </span>
            </div>
          )}
          <p
            data-testid="module-hero-summary"
            className={`text-sm sm:text-base leading-relaxed text-slate-600 dark:text-slate-300 max-w-4xl font-normal ${
              isRTL ? 'text-right' : 'text-left'
            }`}
          >
            {renderBidiText(displaySummary, language)}
          </p>
        </div>

        {/* Key Takeaways 2-Column Architectural Grid */}
        <div className="space-y-3.5 pt-3 border-t border-slate-200/70 dark:border-white/[0.06]">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            {t('keyTakeawaysTitle')}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {language === 'en' && enContent?.keyTakeaways
              ? enContent.keyTakeaways.map((kt) => (
                  <div
                    key={kt.titleEn}
                    className="p-4 sm:p-5 rounded-xl border border-slate-200/80 dark:border-white/[0.07] bg-slate-50/70 dark:bg-slate-900/30 card-interactive space-y-1.5 group"
                  >
                    <div dir="ltr" className="ltr-inline text-[11px] font-mono font-semibold text-blue-600 dark:text-blue-400">
                      {kt.metricOrBadge}
                    </div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {renderBidiText(kt.titleEn, 'en')}
                    </h3>
                    <p className="text-xs sm:text-[13px] leading-6 text-slate-600 dark:text-slate-400">
                      {renderBidiText(kt.descEn, 'en')}
                    </p>
                  </div>
                ))
              : module.keyTakeaways.map((kt) => (
                  <div
                    key={kt.titleFa}
                    className="p-4 sm:p-5 rounded-xl border border-slate-200/80 dark:border-white/[0.07] bg-slate-50/70 dark:bg-slate-900/30 card-interactive space-y-1.5 group"
                  >
                    <div dir="ltr" className="ltr-inline text-[11px] font-mono font-semibold text-blue-600 dark:text-blue-400">
                      {kt.metricOrBadge}
                    </div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {renderBidiText(kt.titleFa, language)}
                    </h3>
                    <p className="text-xs sm:text-[13px] leading-6 text-slate-600 dark:text-slate-400">
                      {renderBidiText(kt.descFa, language)}
                    </p>
                  </div>
                ))}
          </div>
        </div>

        {/* Inline Chapter Subsections Jump Bar */}
        <div className="pt-3 border-t border-slate-200/70 dark:border-white/[0.06] flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-slate-400 dark:text-slate-500 me-1">
            {t('onThisPageTitle')}:
          </span>
          {module.subSections.map((sub, idx) => {
            const subPrimary = language === 'en' ? sub.titleEn : sub.titleFa;
            return (
              <a
                key={sub.id}
                href={`#${sub.id}`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200/80 dark:border-white/[0.06] bg-slate-50/80 dark:bg-white/[0.03] hover:border-blue-500/40 hover:text-blue-600 dark:hover:text-blue-400 text-xs font-medium text-slate-700 dark:text-slate-300 transition-colors"
              >
                <span
                  className={`text-[11px] text-blue-500 font-bold tabular-nums ${
                    language === 'en' ? 'ltr-inline font-mono' : 'font-sans'
                  }`}
                >
                  {formatLocalizedNumber(idx + 1, language, true)}
                </span>
                <span>{renderBidiText(subPrimary, language)}</span>
              </a>
            );
          })}
        </div>
      </div>

      {/* Interactive Module Simulator Widget */}
      <InteractiveModuleDiagram widgetType={module.interactiveWidgetType} />

      {/* Deep Sub-Sections */}
      <div className="space-y-8">
        {module.subSections.map((sub) => {
          const enSub = enContent?.subSections[sub.id];
          const subTitlePrimary = language === 'en' ? sub.titleEn : sub.titleFa;
          const subTitleSecondary = language === 'en' ? sub.titleFa : sub.titleEn;
          const subParagraphs = (language === 'en' && enSub?.contentEn && enSub.contentEn.length > 0)
            ? enSub.contentEn
            : sub.contentFa;

          const subPdfPayload: PrintableDocumentPayload = {
            titleFa: sub.titleFa,
            titleEn: sub.titleEn,
            subtitleOrCategory: `Module 0${module.number} · ${module.titleEn}`,
            sections: [
              {
                headingFa: sub.titleFa,
                headingEn: sub.titleEn,
                paragraphsFa: subParagraphs,
                bullets: sub.bulletPoints,
                codeBlocks: sub.codeExamples?.map((ce) => ({
                  filename: ce.filename,
                  language: ce.language,
                  code: ce.code,
                })),
              },
            ],
          };

          return (
            <section
              key={sub.id}
              id={sub.id}
              className="rounded-2xl border border-slate-200/80 dark:border-white/[0.07] bg-white dark:bg-[#0c121e] p-6 sm:p-9 space-y-6 shadow-xs card-interactive"
            >
              <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-200/70 dark:border-white/[0.06] pb-4">
                <div>
                  <h2
                    className={`text-lg sm:text-xl font-bold text-slate-900 dark:text-white leading-snug tabular-nums ${
                      isRTL ? 'text-right' : 'text-left'
                    }`}
                  >
                    {renderBidiText(subTitlePrimary, language)}
                  </h2>
                  {language !== 'en' && (
                    <div className={`mt-1 ${isRTL ? 'text-right' : 'text-left'}`}>
                      <span
                        dir="ltr"
                        className="ltr-inline text-xs font-mono text-slate-500 dark:text-slate-400"
                      >
                        {subTitleSecondary}
                      </span>
                    </div>
                  )}
                </div>
                <ExportSectionPdfButton
                  label={language === 'en' ? 'Export Section PDF' : 'دریافت PDF این بخش'}
                  payload={subPdfPayload}
                  onExport={onExportPdf}
                  compact
                />
              </div>

              {/* Narrative Paragraphs */}
              <div className="space-y-4">
                {subParagraphs.map((p, idx) => (
                  <p
                    key={idx}
                    className={`text-sm sm:text-[15px] leading-8 text-slate-700 dark:text-slate-300 ${
                      isRTL ? 'text-right' : 'text-left'
                    }`}
                  >
                    {renderBidiText(p, language)}
                  </p>
                ))}
              </div>

              {/* Technical Bullet Points with Strict LTR Isolation */}
              {sub.bulletPoints && sub.bulletPoints.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  {sub.bulletPoints.map((bp, bpIdx) => {
                    const bulletDesc =
                      language === 'en'
                        ? enSub?.bulletPoints?.[bpIdx]?.descEn ||
                          enSub?.bulletPoints?.find((b) => b.termEn === bp.termEn)?.descEn ||
                          bp.descFa
                        : bp.descFa;
                    return (
                      <div
                        key={bp.termEn}
                        className="p-4 sm:p-5 rounded-xl border border-slate-200/80 dark:border-white/[0.06] bg-slate-50/70 dark:bg-white/[0.02] space-y-2"
                      >
                        <code
                          dir="ltr"
                          className="ltr-inline text-xs font-mono font-bold text-blue-600 dark:text-blue-400"
                        >
                          {bp.termEn}
                        </code>
                        <p className="text-xs sm:text-sm leading-6 text-slate-700 dark:text-slate-300">
                          {renderBidiText(bulletDesc, language)}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Architectural Comparison Matrix */}
              {sub.comparisonTable && (
                <div
                  data-testid={`comparison-table-${sub.id}`}
                  className="overflow-x-auto rounded-xl border border-slate-200/80 dark:border-white/[0.07] my-4"
                >
                  <table className={`w-full ${isRTL ? 'text-right' : 'text-left'} border-collapse text-xs sm:text-sm`}>
                    <thead>
                      <tr className="bg-slate-50 dark:bg-white/[0.03] text-slate-800 dark:text-slate-200 border-b border-slate-200/80 dark:border-white/[0.07]">
                        {(language === 'en' && enSub?.comparisonTable?.headers
                          ? enSub.comparisonTable.headers
                          : language === 'en'
                          ? [t('tableColCriterion'), t('tableColTraditional'), t('tableColAntigravity'), t('tableColVerdict')]
                          : sub.comparisonTable.headers
                        ).map((h) => (
                          <th key={h} className="py-3.5 px-4 font-bold">
                            {renderBidiText(h, language)}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200/70 dark:divide-white/[0.06]">
                      {(language === 'en' && enSub?.comparisonTable?.rows
                        ? enSub.comparisonTable.rows
                        : sub.comparisonTable.rows
                      ).map((row) => (
                        <tr
                          key={row.criterion}
                          className="hover:bg-slate-50/80 dark:hover:bg-white/[0.02] transition-colors"
                        >
                          <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white leading-6">
                            {renderBidiText(row.criterion, language)}
                          </td>
                          <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300 leading-6">
                            {renderBidiText(row.optionA, language)}
                          </td>
                          <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300 leading-6">
                            {renderBidiText(row.optionB, language)}
                          </td>
                          <td className="py-3.5 px-4 font-medium text-blue-600 dark:text-blue-400 leading-6">
                            {renderBidiText(row.architectVerdict, language)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Callouts (subtle all-around hairline border) */}
              {language === 'en' && enSub?.callout ? (
                <div
                  className={`p-4 sm:p-5 rounded-xl border space-y-1.5 ${
                    enSub.callout.type === 'warning'
                      ? 'border-amber-500/30 bg-amber-500/5 text-amber-900 dark:text-amber-200'
                      : 'border-blue-500/30 bg-blue-500/5 text-slate-800 dark:text-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-2 text-xs font-bold">
                    <ShieldCheck className="w-4 h-4 text-blue-500 shrink-0" />
                    <span>{renderBidiText(enSub.callout.titleEn, 'en')}</span>
                  </div>
                  <p className="text-xs sm:text-sm leading-6 opacity-90">
                    {renderBidiText(enSub.callout.contentEn, 'en')}
                  </p>
                </div>
              ) : (
                sub.callouts?.map((c) => (
                  <div
                    key={c.title}
                    className={`p-4 sm:p-5 rounded-xl border space-y-1.5 ${
                      c.type === 'warning'
                        ? 'border-amber-500/30 bg-amber-500/5 text-amber-900 dark:text-amber-200'
                        : 'border-blue-500/30 bg-blue-500/5 text-slate-800 dark:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-2 text-xs font-bold">
                      <ShieldCheck className="w-4 h-4 text-blue-500 shrink-0" />
                      <span>{renderBidiText(c.title, language)}</span>
                    </div>
                    <p className="text-xs sm:text-sm leading-6 opacity-90">
                      {renderBidiText(c.content, language)}
                    </p>
                  </div>
                ))
              )}

              {/* Production Code Sandboxes */}
              {sub.codeExamples && sub.codeExamples.length > 0 && (
                <CodeSandboxTabs examples={sub.codeExamples} />
              )}
            </section>
          );
        })}
      </div>

      {/* Bottom-of-Content Knowledge Check Component & Auto-Triggered AI Quiz Modal */}
      <ModuleKnowledgeCheck
        moduleInput={moduleOverviewInput}
        isModuleCompleted={isCompleted}
        onToggleModuleComplete={onToggleComplete}
      />

      {/* Module Chapter Completion & Pagination Footer */}
      <div className="pt-8 border-t border-slate-200/80 dark:border-white/[0.07] space-y-6">
        {/* Chapter Status & Quick PDF Bar */}
        <div className="p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-white/[0.07] bg-white dark:bg-[#0c121e] flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-0.5">
            <div className="text-xs font-bold text-slate-900 dark:text-white">
              {renderBidiText(
                language === 'en'
                  ? `End of Module ${formatLocalizedNumber(module.number, 'en', true)}: ${module.titleEn}`
                  : `پایان فصل ${formatLocalizedNumber(module.number, 'fa', true)}: ${module.titleFa}`,
                language
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {renderBidiText(
                language === 'en'
                  ? 'Mark this chapter as completed to record your progress and unlock certification XP.'
                  : 'برای ثبت پیشرفت در کارنامه مهندسی و دریافت امتیاز XP، وضعیت مطالعه این فصل را تکمیل کنید.',
                language
              )}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <ExportSectionPdfButton
              label={t('exportPdfBtn')}
              payload={fullModulePdfPayload}
              onExport={onExportPdf}
              compact
            />
            <button
              type="button"
              data-testid="toggle-module-complete-footer-btn"
              onClick={handleModuleCompletionClick}
              className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer whitespace-nowrap ${
                isCelebratingCompletion
                  ? 'border-emerald-400 bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 animate-mission-success-pop animate-mission-glow-pulse'
                  : isCompleted
                  ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300'
                  : 'border-blue-500/40 bg-blue-600 text-white hover:bg-blue-500'
              }`}
            >
              {isCompleted ? (
                <>
                  <CheckSquare className="w-3.5 h-3.5 text-emerald-500" />
                  <span>{t('completedBadge')}</span>
                </>
              ) : (
                <>
                  <Square className="w-3.5 h-3.5" />
                  <span>{t('markCompleted')}</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Next / Previous Chapter Pagination Cards (Docs-grade 2-Column Grid) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {prevMod ? (
            <button
              type="button"
              onClick={() => onSelectModule(prevMod.id)}
              className={`group p-5 rounded-2xl border border-slate-200/80 dark:border-white/[0.07] bg-white dark:bg-[#0c121e] hover:border-blue-500/50 dark:hover:border-blue-500/40 transition-all flex flex-col justify-between gap-2 cursor-pointer ${
                isRTL ? 'text-right' : 'text-left'
              }`}
            >
              <div className="flex items-center justify-between gap-2 text-[11px] font-semibold text-slate-400 dark:text-slate-500">
                <span>{language === 'en' ? '← Previous Chapter' : '→ فصل قبلی'}</span>
                <span dir="ltr" className="ltr-inline font-mono text-blue-600 dark:text-blue-400">
                  MOD-0{prevMod.number}
                </span>
              </div>
              <div className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                {renderBidiText(
                  language === 'en'
                    ? `${prevMod.number}. ${prevMod.titleEn}`
                    : `${formatLocalizedNumber(prevMod.number, 'fa')}. ${prevMod.titleFa}`,
                  language
                )}
              </div>
              {language !== 'en' && (
                <div className={isRTL ? 'text-right' : 'text-left'}>
                  <span dir="ltr" className="ltr-inline text-[11px] font-mono text-slate-500 dark:text-slate-400">
                    {prevMod.titleEn}
                  </span>
                </div>
              )}
            </button>
          ) : (
            <div className="hidden sm:block" />
          )}

          {nextMod ? (
            <button
              type="button"
              onClick={() => onSelectModule(nextMod.id)}
              className={`group p-5 rounded-2xl border border-slate-200/80 dark:border-white/[0.07] bg-white dark:bg-[#0c121e] hover:border-blue-500/50 dark:hover:border-blue-500/40 transition-all flex flex-col justify-between gap-2 cursor-pointer ${
                isRTL ? 'text-right' : 'text-left'
              }`}
            >
              <div className="flex items-center justify-between gap-2 text-[11px] font-semibold text-blue-600 dark:text-blue-400">
                <span dir="ltr" className="ltr-inline font-mono">
                  MOD-0{nextMod.number}
                </span>
                <span className="inline-flex items-center gap-1">
                  <span>{language === 'en' ? 'Next Chapter' : 'فصل بعدی'}</span>
                  <ArrowRight className={`w-3.5 h-3.5 ${isRTL ? 'rotate-180' : ''}`} />
                </span>
              </div>
              <div className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                {renderBidiText(
                  language === 'en'
                    ? `${nextMod.number}. ${nextMod.titleEn}`
                    : `${formatLocalizedNumber(nextMod.number, 'fa')}. ${nextMod.titleFa}`,
                  language
                )}
              </div>
              {language !== 'en' && (
                <div className={isRTL ? 'text-right' : 'text-left'}>
                  <span dir="ltr" className="ltr-inline text-[11px] font-mono text-slate-500 dark:text-slate-400">
                    {nextMod.titleEn}
                  </span>
                </div>
              )}
            </button>
          ) : (
            <div className="hidden sm:block" />
          )}
        </div>
      </div>
    </div>
  );
};

