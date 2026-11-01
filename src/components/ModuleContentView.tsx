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
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              {c1.title}
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
              {c1.subtitle}
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
              {c1.editorTab}
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
              {c1.managerTab}
            </button>
          </div>
        </div>

        {m1ViewMode === 'editor' ? (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                {c1.subHeader}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setM1JumpStep((prev) => (prev + 1) % c1.jumpStages.length)}
                  className="px-3 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg flex items-center gap-1.5 cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>{c1.tabBtn}</span>
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
                  className={`${isRTL ? 'text-right' : 'text-left'} p-3.5 rounded-lg border transition-all cursor-pointer ${
                    m1JumpStep === idx
                      ? 'border-blue-500 bg-blue-500/10 dark:bg-blue-500/15'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/60 opacity-75 hover:opacity-100'
                  }`}
                >
                  <div dir="ltr" className="ltr-inline text-xs font-mono font-bold text-blue-600 dark:text-blue-400">
                    {st.layer}
                  </div>
                  <div dir="ltr" className="ltr-inline block text-[11px] font-mono text-slate-500 mt-1">
                    {st.file}
                  </div>
                  <p className="text-xs text-slate-700 dark:text-slate-300 mt-2 leading-5">
                    {st.desc}
                  </p>
                </button>
              ))}
            </div>

            <div dir="ltr" className="ltr-code p-3.5 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono text-emerald-400">
              <div className="text-slate-400 mb-1">
                {c1.activeTargetLabel} {c1.jumpStages[m1JumpStep].file}
              </div>
              <pre className="overflow-x-auto"><code>{c1.jumpStages[m1JumpStep].diff}</code></pre>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {c1.agentCards.map((ag) => (
              <div
                key={ag.id}
                className={`p-4 rounded-lg border space-y-2 ${
                  ag.variant === 'emerald'
                    ? 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/80'
                    : ag.variant === 'amber'
                    ? 'border-amber-500/40 bg-amber-500/5'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/80'
                }`}
              >
                <div
                  dir="ltr"
                  className={`ltr-inline text-xs font-mono font-semibold ${
                    ag.variant === 'emerald'
                      ? 'text-emerald-500'
                      : ag.variant === 'amber'
                      ? 'text-amber-500'
                      : 'text-blue-400'
                  }`}
                >
                  {ag.badge}
                </div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  {ag.title}
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-5">
                  {ag.desc}
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
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              {c2.title}
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              {c2.subtitle}
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
                dir="ltr"
                className="ltr-code w-full flex items-center justify-between p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 hover:border-blue-500/50 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3 text-xs font-mono">
                  <span
                    className={`px-2 py-0.5 rounded font-bold ${
                      t.status === 'done'
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : t.status === 'progress'
                        ? 'bg-amber-500/20 text-amber-400'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    - {badge}
                  </span>
                  <span className="text-slate-800 dark:text-slate-200">{matchedLabel}</span>
                </div>
                <span className="text-[11px] font-mono text-slate-500">
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
        <h3 className="text-base font-bold text-slate-900 dark:text-white">
          {c3.title}
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
        <div dir="ltr" className="ltr-code p-4 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono space-y-1.5">
          <div className="text-slate-400">{c3.evalHeader}</div>
          <div className="text-emerald-400 font-bold">{c3.commands[m3SelectedCmd]?.verdict}</div>
          <div className="text-slate-300">{c3.riskHeader} {c3.commands[m3SelectedCmd]?.risk}</div>
        </div>
      </div>
    );
  }

  if (widgetType === 'rule-activation') {
    const c4 = getRuleActivationContent(language);
    const current = c4.files.find((f) => f.path === m4SelectedFile) || c4.files[0];

    return (
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60 p-5 space-y-4">
        <h3 className="text-base font-bold text-slate-900 dark:text-white">
          {c4.title}
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
        <div dir="ltr" className="ltr-code p-4 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono space-y-2">
          <div className="text-slate-400">{c4.activeRulesLabel} {current.path}:</div>
          {current.activeRules.map((r) => (
            <div key={r} className="text-emerald-400">
              ✓ {r}
            </div>
          ))}
          <div className="text-blue-400 pt-1 border-t border-slate-800">
            {c4.tokenEfficiencyLabel} {current.savedTokens}
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
            {c5.title}
          </h3>
          <button
            type="button"
            onClick={() => setM5ActiveStep((prev) => (prev + 1) % c5.steps.length)}
            className="px-3 py-1.5 text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white rounded-lg cursor-pointer"
          >
            {c5.nextBtn}
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {c5.steps.map((s, idx) => (
            <div
              key={s.step}
              onClick={() => setM5ActiveStep(idx)}
              className={`p-3.5 rounded-lg border transition-all cursor-pointer ${
                m5ActiveStep === idx
                  ? 'border-blue-500 bg-blue-500/10'
                  : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/70'
              }`}
            >
              <div dir="ltr" className="ltr-inline text-xs font-mono font-bold text-blue-500">
                {s.step}
              </div>
              <div dir="ltr" className="ltr-inline block text-[11px] font-mono text-emerald-500 mt-1">
                {s.mode}
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-2">{s.detail}</p>
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
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              {c6.title}
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              {c6.subtitle}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setM6Fixed422((prev) => !prev)}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg text-white cursor-pointer ${
              m6Fixed422 ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-amber-600 hover:bg-amber-500'
            }`}
          >
            {m6Fixed422 ? c6.patchBtnActive : c6.patchBtnInactive}
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
            {c7.title}
          </h3>
          <div className="flex items-center gap-1 p-1 rounded-lg bg-slate-200 dark:bg-slate-800">
            <button
              type="button"
              onClick={() => setM7Transport('stdio')}
              dir="ltr"
              className={`ltr-inline px-3 py-1 text-xs font-mono rounded cursor-pointer ${
                m7Transport === 'stdio' ? 'bg-blue-600 text-white' : 'text-slate-600 dark:text-slate-300'
              }`}
            >
              {c7.stdioBtn}
            </button>
            <button
              type="button"
              onClick={() => setM7Transport('sse')}
              dir="ltr"
              className={`ltr-inline px-3 py-1 text-xs font-mono rounded cursor-pointer ${
                m7Transport === 'sse' ? 'bg-blue-600 text-white' : 'text-slate-600 dark:text-slate-300'
              }`}
            >
              {c7.sseBtn}
            </button>
          </div>
        </div>
        <div dir="ltr" className="ltr-code p-4 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono">
          {m7Transport === 'stdio' ? (
            <div className="space-y-1 text-slate-200">
              <div className="text-blue-400">{c7.stdioSubtitle}</div>
              <div className="text-slate-400">{c7.stdioDetail}</div>
            </div>
          ) : (
            <div className="space-y-1 text-slate-200">
              <div className="text-emerald-400">{c7.sseSubtitle}</div>
              <div className="text-slate-400">{c7.sseDetail}</div>
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
          {c8.title}
        </h3>
        <button
          type="button"
          onClick={() => setM8Isolated((prev) => !prev)}
          className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg text-white cursor-pointer ${
            m8Isolated ? 'bg-emerald-600' : 'bg-rose-600'
          }`}
        >
          {m8Isolated ? c8.isolatedBtn : c8.collidingBtn}
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
    titleFa: `فصل ${module.number}: ${module.titleFa}`,
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

  const displayTitle = language === 'en' ? `${module.number}. ${module.titleEn}` : `${module.number}. ${module.titleFa}`;
  const displaySubtitle = language === 'en' ? module.titleFa : module.titleEn;
  const displaySummary = language === 'en' && enContent?.summaryEn ? enContent.summaryEn : module.summaryFa;

  return (
    <div className="space-y-10 pb-16">
      {/* Module Hero Header Surface */}
      <div className="rounded-2xl border border-slate-200/80 dark:border-white/[0.07] bg-white dark:bg-[#0c121e] p-6 sm:p-9 space-y-7 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200/70 dark:border-white/[0.06] pb-4">
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <span className="font-bold text-blue-600 dark:text-blue-400">
              {language === 'en' ? `Module 0${module.number} of 08` : `فصل ۰${module.number} از ۰۸`}
            </span>
            <span aria-hidden="true" className="opacity-40">·</span>
            <span dir="ltr" className="ltr-inline">{module.readingTime}</span>
            <span aria-hidden="true" className="opacity-40">·</span>
            <span dir="ltr" className="ltr-inline">{module.difficulty}</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <ExportSectionPdfButton
              label={t('exportPdfBtn')}
              payload={fullModulePdfPayload}
              onExport={onExportPdf}
            />
            <button
              type="button"
              onClick={() => onToggleComplete(module.id)}
              data-testid="toggle-module-complete-btn"
              className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold border transition-colors cursor-pointer whitespace-nowrap ${
                isCompleted
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

        <div className="space-y-3.5">
          <h1 className="text-2xl sm:text-3xl lg:text-[32px] font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight">
            {displayTitle}
          </h1>
          {language !== 'en' && (
            <div className={isRTL ? 'text-right' : 'text-left'}>
              <span
                dir="ltr"
                className="ltr-inline text-xs sm:text-sm font-mono text-blue-600/90 dark:text-blue-400/90"
              >
                {displaySubtitle}
              </span>
            </div>
          )}
          <p className="text-sm sm:text-base leading-8 text-slate-600 dark:text-slate-300 max-w-4xl">
            {displaySummary}
          </p>
        </div>

        {/* Key Takeaways 2-Column Architectural Grid */}
        <div className="space-y-3 pt-2 border-t border-slate-200/70 dark:border-white/[0.06]">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            {t('keyTakeawaysTitle')}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {language === 'en' && enContent?.keyTakeaways
              ? enContent.keyTakeaways.map((kt) => (
                  <div
                    key={kt.titleEn}
                    className="p-4 sm:p-5 rounded-xl border border-slate-200/80 dark:border-white/[0.06] bg-slate-50/70 dark:bg-white/[0.02] space-y-1.5"
                  >
                    <div dir="ltr" className="ltr-inline text-[11px] font-mono font-semibold text-blue-600 dark:text-blue-400">
                      {kt.metricOrBadge}
                    </div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      {kt.titleEn}
                    </h3>
                    <p className="text-xs sm:text-[13px] leading-6 text-slate-600 dark:text-slate-400">
                      {kt.descEn}
                    </p>
                  </div>
                ))
              : module.keyTakeaways.map((kt) => (
                  <div
                    key={kt.titleFa}
                    className="p-4 sm:p-5 rounded-xl border border-slate-200/80 dark:border-white/[0.06] bg-slate-50/70 dark:bg-white/[0.02] space-y-1.5"
                  >
                    <div dir="ltr" className="ltr-inline text-[11px] font-mono font-semibold text-blue-600 dark:text-blue-400">
                      {kt.metricOrBadge}
                    </div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      {kt.titleFa}
                    </h3>
                    <p className="text-xs sm:text-[13px] leading-6 text-slate-600 dark:text-slate-400">
                      {kt.descFa}
                    </p>
                  </div>
                ))}
          </div>
        </div>

        {/* Inline Chapter Subsections Jump Bar (Replaces cramped 256px right sidebar) */}
        <div className="pt-2 border-t border-slate-200/70 dark:border-white/[0.06] flex flex-wrap items-center gap-2">
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
                <span dir="ltr" className="ltr-inline text-[10px] font-mono text-blue-500 font-bold">
                  0{idx + 1}
                </span>
                <span>{subPrimary}</span>
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
              className="rounded-2xl border border-slate-200/80 dark:border-white/[0.07] bg-white dark:bg-[#0c121e] p-6 sm:p-9 space-y-6 shadow-xs"
            >
              <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-200/70 dark:border-white/[0.06] pb-4">
                <div>
                  <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white leading-snug">
                    {subTitlePrimary}
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
                    {p}
                  </p>
                ))}
              </div>

              {/* Technical Bullet Points with Strict LTR Isolation */}
              {sub.bulletPoints && sub.bulletPoints.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  {sub.bulletPoints.map((bp, bpIdx) => (
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
                        {language === 'en'
                          ? (enSub?.bulletPoints?.[bpIdx]?.descEn ||
                              enSub?.bulletPoints?.find((b) => b.termEn === bp.termEn)?.descEn ||
                              bp.descFa)
                          : bp.descFa}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {/* Architectural Comparison Matrix */}
              {sub.comparisonTable && (
                <div className="overflow-x-auto rounded-xl border border-slate-200/80 dark:border-white/[0.07] my-4">
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
                            {h}
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
                          <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">
                            <span dir="ltr" className="ltr-inline">{row.criterion}</span>
                          </td>
                          <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300 leading-6">
                            {row.optionA}
                          </td>
                          <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300 leading-6">
                            {row.optionB}
                          </td>
                          <td className="py-3.5 px-4 font-medium text-blue-600 dark:text-blue-400 leading-6">
                            {row.architectVerdict}
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
                    <span>{enSub.callout.titleEn}</span>
                  </div>
                  <p className="text-xs sm:text-sm leading-6 opacity-90">{enSub.callout.contentEn}</p>
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
                      <span>{c.title}</span>
                    </div>
                    <p className="text-xs sm:text-sm leading-6 opacity-90">{c.content}</p>
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

      {/* Module Chapter Completion & Pagination Footer */}
      <div className="pt-8 border-t border-slate-200/80 dark:border-white/[0.07] space-y-6">
        {/* Chapter Status & Quick PDF Bar */}
        <div className="p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-white/[0.07] bg-white dark:bg-[#0c121e] flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-0.5">
            <div className="text-xs font-bold text-slate-900 dark:text-white">
              {language === 'en'
                ? `End of Module 0${module.number}: ${module.titleEn}`
                : `پایان فصل ۰${module.number}: ${module.titleFa}`}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {language === 'en'
                ? 'Mark this chapter as completed to record your progress and unlock certification XP.'
                : 'برای ثبت پیشرفت در کارنامه مهندسی و دریافت امتیاز XP، وضعیت مطالعه این فصل را تکمیل کنید.'}
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
              onClick={() => onToggleComplete(module.id)}
              className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold border transition-colors cursor-pointer whitespace-nowrap ${
                isCompleted
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
                {language === 'en'
                  ? `${prevMod.number}. ${prevMod.titleEn}`
                  : `${prevMod.number}. ${prevMod.titleFa}`}
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
                {language === 'en'
                  ? `${nextMod.number}. ${nextMod.titleEn}`
                  : `${nextMod.number}. ${nextMod.titleFa}`}
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
