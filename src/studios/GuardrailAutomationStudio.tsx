import React, { useState } from 'react';
import {
  Shield,
  Workflow,
  Terminal,
  Copy,
  Check,
  Plus,
  Trash2,
} from 'lucide-react';
import {
  RuleGeneratorConfig,
  WorkflowGeneratorConfig,
  AutonomyRiskProfile,
} from '../types/curriculum';
import {
  buildRuleMarkdown,
  buildWorkflowMarkdown,
  recommendAutonomyPolicy,
  estimateRuleTokenOverhead,
} from '../utils/generators';
import {
  ExportSectionPdfButton,
  PrintableDocumentPayload,
} from '../components/CodeAndPdfTools';

export const GuardrailAutomationStudio: React.FC<{
  onExportPdf: (payload: PrintableDocumentPayload) => void;
}> = ({ onExportPdf }) => {
  const [activeSubStudio, setActiveSubStudio] = useState<'rule' | 'workflow' | 'autonomy'>('rule');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // 1. Rule Generator State
  const [ruleConfig, setRuleConfig] = useState<RuleGeneratorConfig>({
    name: '01-backend-async-guardrails',
    activationMode: 'Glob',
    globs: ['src/**/*.py', 'tests/**/*.py'],
    description: 'Strict FastAPI, SQLAlchemy 2.0 Async, and Pydantic v2 architectural invariants',
    domains: {
      fastapi: true,
      sqlalchemy: true,
      alembic: true,
      pytest: true,
      security: true,
      logging: false,
    },
  });
  const [globInput, setGlobInput] = useState<string>('src/**/*.py, tests/**/*.py');

  // 2. Workflow Sequencer State
  const [workflowConfig, setWorkflowConfig] = useState<WorkflowGeneratorConfig>({
    commandName: 'safe-migration',
    description: 'Standard Operating Procedure for reversible Alembic schema migrations',
    turboAll: false,
    steps: [
      {
        id: 'st-1',
        title: 'Check Single Alembic Head',
        description: 'Verify no branched migration heads exist before generating a revision.',
        commandOrAction: 'poetry run alembic heads && poetry run alembic current',
        turboStep: true,
      },
      {
        id: 'st-2',
        title: 'Generate Autogenerate Revision',
        description: 'Generate revision against SQLAlchemy 2.0 metadata and inspect for drop_column.',
        commandOrAction: 'poetry run alembic revision --autogenerate -m "update_schema"',
        turboStep: false,
      },
      {
        id: 'st-3',
        title: 'Verify Reversibility Cycle & Run Pytest',
        description: 'Apply upgrade head, downgrade -1, upgrade head, and run integration tests.',
        commandOrAction: 'poetry run alembic upgrade head && poetry run alembic downgrade -1 && poetry run alembic upgrade head && poetry run pytest tests/integration/ -v',
        turboStep: true,
      },
    ],
  });
  const [newStepTitle, setNewStepTitle] = useState<string>('');
  const [newStepCommand, setNewStepCommand] = useState<string>('');

  // 3. Autonomy Calibrator State
  const [riskProfile, setRiskProfile] = useState<AutonomyRiskProfile>({
    environment: 'staging-ci',
    hasDestructiveDbAccess: false,
    teamExperience: 'senior',
    requiresAuditTrail: false,
  });

  const generatedRuleMd = buildRuleMarkdown(ruleConfig);
  const tokenStats = estimateRuleTokenOverhead(ruleConfig.activationMode, generatedRuleMd.length);
  const generatedWorkflowMd = buildWorkflowMarkdown(workflowConfig);
  const autonomyRec = recommendAutonomyPolicy(riskProfile);

  const handleCopyText = (text: string, key: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1800);
  };

  const handleAddWorkflowStep = () => {
    if (!newStepTitle.trim() || !newStepCommand.trim()) return;
    setWorkflowConfig((prev) => ({
      ...prev,
      steps: [
        ...prev.steps,
        {
          id: `st-${Date.now()}`,
          title: newStepTitle.trim(),
          description: `Execute ${newStepTitle.trim()} step.`,
          commandOrAction: newStepCommand.trim(),
          turboStep: true,
        },
      ],
    }));
    setNewStepTitle('');
    setNewStepCommand('');
  };

  const studioPdfPayload: PrintableDocumentPayload = {
    titleFa: 'مشخصات خروجی استودیوی طراحی Rule، Workflow و پالیسی ترمینال',
    titleEn: 'Generated Guardrails, Slash Workflow & Autonomy Calibration Spec',
    subtitleOrCategory: `.agent/rules/${ruleConfig.name}.md · /${workflowConfig.commandName}`,
    sections: [
      {
        headingFa: `۱. فایل قانون تولیدشده (.agent/rules/${ruleConfig.name}.md)`,
        headingEn: `Activation Mode: ${ruleConfig.activationMode}`,
        codeBlocks: [
          {
            filename: `.agent/rules/${ruleConfig.name}.md`,
            language: 'markdown',
            code: generatedRuleMd,
          },
        ],
      },
      {
        headingFa: `۲. فایل ورک‌فلو تولیدشده (.agent/workflows/${workflowConfig.commandName}.md)`,
        headingEn: `Slash Command: /${workflowConfig.commandName}`,
        codeBlocks: [
          {
            filename: `.agent/workflows/${workflowConfig.commandName}.md`,
            language: 'markdown',
            code: generatedWorkflowMd,
          },
        ],
      },
      {
        headingFa: '۳. کالیبراسیون خودمختاری و سیاست ترمینال',
        headingEn: `Mode: ${autonomyRec.executionMode} · Terminal: ${autonomyRec.terminalPolicy}`,
        paragraphsFa: [autonomyRec.rationaleFa],
        bullets: [
          { termEn: 'Recommended Allow List', descFa: autonomyRec.allowList.join(' , ') },
          { termEn: 'Mandatory Deny List', descFa: autonomyRec.denyList.join(' , ') },
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
              استودیو ۲ · مهندسی گاردریل‌ها و پایپ‌لاین‌های اتوماسیون
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-1">
              استودیوی طراحی Rule، Workflow و کالیبراسیون پالیسی ترمینال
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-1">
              ساخت تعاملی فایل‌های استاندارد <code dir="ltr" className="ltr-inline">.agent/rules/*.md</code>، دستورات اسلش <code dir="ltr" className="ltr-inline">.agent/workflows/*.md</code> و تنظیم سطح خودمختاری ترمینال.
            </p>
          </div>
          <ExportSectionPdfButton
            label="دریافت PDF این بخش"
            payload={studioPdfPayload}
            onExport={onExportPdf}
          />
        </div>

        {/* Sub-Studio Switcher */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <button
            type="button"
            onClick={() => setActiveSubStudio('rule')}
            className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer ${
              activeSubStudio === 'rule'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
            }`}
          >
            <Shield className="w-4 h-4 shrink-0" />
            <span>۱. سازنده هوشمند قوانین</span>
            <span dir="ltr" className="ltr-inline font-mono text-[11px] opacity-90">(.agent/rules)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveSubStudio('workflow')}
            className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer ${
              activeSubStudio === 'workflow'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
            }`}
          >
            <Workflow className="w-4 h-4 shrink-0" />
            <span>۲. سکوئنسر ورک‌فلو</span>
            <span dir="ltr" className="ltr-inline font-mono text-[11px] opacity-90">(// turbo &amp; /slash)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveSubStudio('autonomy')}
            className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer ${
              activeSubStudio === 'autonomy'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
            }`}
          >
            <Terminal className="w-4 h-4 shrink-0" />
            <span>۳. کالیبراتور خودمختاری و پالیسی ترمینال</span>
          </button>
        </div>
      </div>

      {/* Sub-Studio 1: Interactive Rule Generator */}
      {activeSubStudio === 'rule' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/75 p-6 space-y-5">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              تنظیمات متادیتا و دامنه‌های قانون
            </h2>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                نام فایل قانون (در مسیر <code dir="ltr" className="ltr-inline">.agent/rules/</code>):
              </label>
              <input
                type="text"
                dir="ltr"
                value={ruleConfig.name}
                onChange={(e) => setRuleConfig({ ...ruleConfig, name: e.target.value })}
                className="ltr-code w-full px-3 py-2 text-xs font-mono rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                حالت فعال‌سازی (Activation Mode):
              </label>
              <div className="grid grid-cols-2 gap-2">
                {(['Always On', 'Glob', 'Model Decision', 'Manual'] as const).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setRuleConfig({ ...ruleConfig, activationMode: mode })}
                    dir="ltr"
                    className={`ltr-inline py-2 px-3 rounded-lg text-xs font-mono font-semibold border transition-colors cursor-pointer ${
                      ruleConfig.activationMode === mode
                        ? 'border-blue-500 bg-blue-600 text-white'
                        : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {mode}
                  </button>
                ))}
              </div>
            </div>

            {ruleConfig.activationMode === 'Glob' && (
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  الگوهای مسیر فایل (<code dir="ltr" className="ltr-inline">globs</code> جداشده با ویرگول):
                </label>
                <input
                  type="text"
                  dir="ltr"
                  value={globInput}
                  onChange={(e) => {
                    setGlobInput(e.target.value);
                    setRuleConfig({
                      ...ruleConfig,
                      globs: e.target.value.split(',').map((s) => s.trim()).filter(Boolean),
                    });
                  }}
                  className="ltr-code w-full px-3 py-2 text-xs font-mono rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white"
                />
              </div>
            )}

            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                انتخاب ماژول‌های استاندارد مهندسی:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {(
                  [
                    { key: 'fastapi', label: 'FastAPI & Pydantic v2' },
                    { key: 'sqlalchemy', label: 'SQLAlchemy 2.0 Async' },
                    { key: 'alembic', label: 'Alembic Migration Safety' },
                    { key: 'pytest', label: 'Pytest Async QA' },
                    { key: 'security', label: 'Security & Secret Scrub' },
                    { key: 'logging', label: 'Structured JSON Telemetry' },
                  ] as const
                ).map((dom) => (
                  <label
                    key={dom.key}
                    className="flex items-center gap-2 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 text-xs cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={ruleConfig.domains[dom.key]}
                      onChange={(e) =>
                        setRuleConfig({
                          ...ruleConfig,
                          domains: { ...ruleConfig.domains, [dom.key]: e.target.checked },
                        })
                      }
                      className="rounded text-blue-600"
                    />
                    <span dir="ltr" className="ltr-inline font-mono text-slate-800 dark:text-slate-200">
                      {dom.label}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <div className="p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-600 dark:text-slate-400">تخمین سربار توکن در هر نوبت:</span>
                <span dir="ltr" className="ltr-inline font-mono font-bold text-blue-500">
                  ~{tokenStats.tokensPerTurn} tokens/turn ({tokenStats.efficiencyRating})
                </span>
              </div>
            </div>
          </div>

          <div className="lg:col-span-7 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-950 text-slate-100 overflow-hidden flex flex-col">
            <div dir="ltr" className="ltr-code flex items-center justify-between px-4 py-3 bg-slate-900 border-b border-slate-800 text-xs font-mono">
              <span className="text-blue-400 font-semibold">.agent/rules/{ruleConfig.name}.md</span>
              <button
                type="button"
                onClick={() => handleCopyText(generatedRuleMd, 'rule-md')}
                className="px-3 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center gap-1.5 cursor-pointer"
              >
                {copiedKey === 'rule-md' ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Rule File</span>
                  </>
                )}
              </button>
            </div>
            <pre dir="ltr" className="ltr-code p-5 text-xs font-mono leading-relaxed overflow-x-auto flex-1">
              <code>{generatedRuleMd}</code>
            </pre>
          </div>
        </div>
      )}

      {/* Sub-Studio 2: Interactive Workflow Sequencer */}
      {activeSubStudio === 'workflow' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/75 p-6 space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                طراحی گام‌های دستور اسلش (<code dir="ltr" className="ltr-inline">/{workflowConfig.commandName}</code>)
              </h2>
              <label className="flex items-center gap-2 text-xs font-bold text-emerald-600 dark:text-emerald-400 cursor-pointer">
                <input
                  type="checkbox"
                  checked={workflowConfig.turboAll}
                  onChange={(e) => setWorkflowConfig({ ...workflowConfig, turboAll: e.target.checked })}
                />
                <span dir="ltr" className="ltr-inline font-mono">// turbo-all (Full Pipeline)</span>
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  نام دستور اسلش:
                </label>
                <input
                  type="text"
                  dir="ltr"
                  value={workflowConfig.commandName}
                  onChange={(e) => setWorkflowConfig({ ...workflowConfig, commandName: e.target.value })}
                  className="ltr-code w-full px-3 py-2 text-xs font-mono rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  توضیح YAML ورک‌فلو:
                </label>
                <input
                  type="text"
                  dir="ltr"
                  value={workflowConfig.description}
                  onChange={(e) => setWorkflowConfig({ ...workflowConfig, description: e.target.value })}
                  className="ltr-code w-full px-3 py-2 text-xs font-mono rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white"
                />
              </div>
            </div>

            {/* Existing Steps List */}
            <div className="space-y-2.5">
              {workflowConfig.steps.map((st, idx) => (
                <div
                  key={st.id}
                  className="p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 space-y-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span dir="ltr" className="ltr-inline text-xs font-mono font-bold text-slate-900 dark:text-white">
                      Step {idx + 1}: {st.title}
                    </span>
                    <div className="flex items-center gap-3">
                      <label className="flex items-center gap-1.5 text-xs font-mono text-emerald-500 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={st.turboStep}
                          disabled={workflowConfig.turboAll}
                          onChange={(e) =>
                            setWorkflowConfig({
                              ...workflowConfig,
                              steps: workflowConfig.steps.map((item) =>
                                item.id === st.id ? { ...item, turboStep: e.target.checked } : item
                              ),
                            })
                          }
                        />
                        <span dir="ltr" className="ltr-inline">// turbo</span>
                      </label>
                      <button
                        type="button"
                        onClick={() =>
                          setWorkflowConfig({
                            ...workflowConfig,
                            steps: workflowConfig.steps.filter((item) => item.id !== st.id),
                          })
                        }
                        aria-label={`Delete step ${st.title}`}
                        className="text-rose-500 hover:text-rose-400 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <div dir="ltr" className="ltr-code text-[11px] font-mono text-blue-400 bg-slate-900 px-2.5 py-1.5 rounded">
                    $ {st.commandOrAction}
                  </div>
                </div>
              ))}
            </div>

            {/* Add New Step Form */}
            <div className="p-4 rounded-lg border border-slate-200 dark:border-slate-800 space-y-2.5">
              <div className="text-xs font-bold text-slate-700 dark:text-slate-300">
                افزودن گام جدید به پایپ‌لاین:
              </div>
              <input
                type="text"
                dir="ltr"
                value={newStepTitle}
                onChange={(e) => setNewStepTitle(e.target.value)}
                placeholder="Step Title (e.g., Run Security Bandit Check)"
                className="ltr-code w-full px-3 py-1.5 text-xs font-mono rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950"
              />
              <div className="flex gap-2">
                <input
                  type="text"
                  dir="ltr"
                  value={newStepCommand}
                  onChange={(e) => setNewStepCommand(e.target.value)}
                  placeholder="Command (e.g., poetry run ruff check src/ --select S)"
                  className="ltr-code flex-1 px-3 py-1.5 text-xs font-mono rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950"
                />
                <button
                  type="button"
                  onClick={handleAddWorkflowStep}
                  className="px-3.5 py-1.5 rounded bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-1 cursor-pointer whitespace-nowrap"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>افزودن گام</span>
                </button>
              </div>
            </div>
          </div>

          <div className="lg:col-span-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-950 text-slate-100 overflow-hidden flex flex-col">
            <div dir="ltr" className="ltr-code flex items-center justify-between px-4 py-3 bg-slate-900 border-b border-slate-800 text-xs font-mono">
              <span className="text-emerald-400 font-semibold">
                .agent/workflows/{workflowConfig.commandName.replace(/^\/+/, '')}.md
              </span>
              <button
                type="button"
                onClick={() => handleCopyText(generatedWorkflowMd, 'wf-md')}
                className="px-3 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center gap-1.5 cursor-pointer"
              >
                {copiedKey === 'wf-md' ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Workflow File</span>
                  </>
                )}
              </button>
            </div>
            <pre dir="ltr" className="ltr-code p-5 text-xs font-mono leading-relaxed overflow-x-auto flex-1">
              <code>{generatedWorkflowMd}</code>
            </pre>
          </div>
        </div>
      )}

      {/* Sub-Studio 3: Autonomy & Terminal Policy Calibrator */}
      {activeSubStudio === 'autonomy' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/75 p-6 space-y-5">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              پروفایل ریسک پروژه و محیط اجرایی
            </h2>

            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                ۱. نوع محیط هدف (Target Environment):
              </label>
              <div className="grid grid-cols-1 gap-2">
                {(
                  [
                    { id: 'local-sandbox', label: 'Local Sandbox / Isolated Git Worktree' },
                    { id: 'staging-ci', label: 'Staging / Shared Integration Branch' },
                    { id: 'enterprise-prod', label: 'Enterprise Production / Regulated Core' },
                  ] as const
                ).map((env) => (
                  <button
                    key={env.id}
                    type="button"
                    onClick={() => setRiskProfile({ ...riskProfile, environment: env.id })}
                    dir="ltr"
                    className={`ltr-inline p-3 rounded-lg text-xs font-mono border text-left transition-colors cursor-pointer ${
                      riskProfile.environment === env.id
                        ? 'border-blue-500 bg-blue-600 text-white font-bold'
                        : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {env.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2.5 pt-2">
              <label className="flex items-center gap-2.5 text-xs text-slate-800 dark:text-slate-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={riskProfile.hasDestructiveDbAccess}
                  onChange={(e) =>
                    setRiskProfile({ ...riskProfile, hasDestructiveDbAccess: e.target.checked })
                  }
                />
                <span>دسترسی به دیتابیس دارای داده‌های حساس یا غیرقابل بازگشت</span>
              </label>

              <label className="flex items-center gap-2.5 text-xs text-slate-800 dark:text-slate-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={riskProfile.requiresAuditTrail}
                  onChange={(e) =>
                    setRiskProfile({ ...riskProfile, requiresAuditTrail: e.target.checked })
                  }
                />
                <span>الزام ممیزی انطباق (Compliance Sign-Off پیش از تغییر کد)</span>
              </label>
            </div>
          </div>

          <div className="lg:col-span-7 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/75 p-6 space-y-5">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              پیکربندی پیشنهادی کالیبراتور معماری
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-4 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
                <div className="text-[11px] text-slate-500">Execution Mode</div>
                <div dir="ltr" className="ltr-inline text-sm font-mono font-bold text-blue-500 mt-1">
                  {autonomyRec.executionMode}
                </div>
              </div>
              <div className="p-4 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
                <div className="text-[11px] text-slate-500">Terminal Policy</div>
                <div dir="ltr" className="ltr-inline text-sm font-mono font-bold text-emerald-500 mt-1">
                  {autonomyRec.terminalPolicy}
                </div>
              </div>
              <div className="p-4 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
                <div className="text-[11px] text-slate-500">Artifact Review Gate</div>
                <div dir="ltr" className="ltr-inline text-sm font-mono font-bold text-amber-500 mt-1">
                  {autonomyRec.artifactReviewPolicy}
                </div>
              </div>
            </div>

            <p className="text-xs sm:text-sm leading-7 text-slate-700 dark:text-slate-300 bg-blue-500/5 border border-blue-500/30 p-4 rounded-lg">
              {autonomyRec.rationaleFa}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div dir="ltr" className="ltr-code p-4 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono space-y-1.5">
                <div className="text-emerald-400 font-bold mb-2">Recommended Allow List:</div>
                {autonomyRec.allowList.map((cmd) => (
                  <div key={cmd} className="text-slate-300">
                    + {cmd}
                  </div>
                ))}
              </div>
              <div dir="ltr" className="ltr-code p-4 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono space-y-1.5">
                <div className="text-rose-400 font-bold mb-2">Mandatory Deny List:</div>
                {autonomyRec.denyList.map((cmd) => (
                  <div key={cmd} className="text-slate-300">
                    - {cmd}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
