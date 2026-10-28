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

const InteractiveModuleDiagram: React.FC<{
  widgetType: CurriculumModule['interactiveWidgetType'];
}> = ({ widgetType }) => {
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
    const jumpStages = [
      {
        layer: '1. SQLAlchemy 2.0 Model',
        file: 'src/models/settlement.py:21',
        diff: '+ risk_score_bps: Mapped[int] = mapped_column(Integer, default=0)',
        descFa: 'گام اول: شما ستون جدید را در مدل ORM تعریف می‌کنید. موتور LSP تغییر اسکیما را تشخیص می‌دهد.',
      },
      {
        layer: '2. Pydantic v2 Request/Response Schema',
        file: 'src/schemas/settlement.py:16',
        diff: '+ risk_score_bps: Annotated[int, Field(ge=0, le=10000)] = 0',
        descFa: 'گام دوم (با فشردن Tab): کرسر به فایل اسکیما پریده و Supercomplete فیلد متناظر با اعتبارسنجی Annotated را پیشنهاد می‌دهد.',
      },
      {
        layer: '3. FastAPI Async Router Guard',
        file: 'src/api/routers/settlements.py:39',
        diff: '+ if payload.risk_score_bps >= 8500:\n+     raise HTTPException(status_code=422, detail="High risk")',
        descFa: 'گام سوم (با فشردن مجدد Tab): کرسر به روتر FastAPI پریده و شرط گاردریل دامنه را تکمیل می‌کند.',
      },
    ];

    return (
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60 p-5 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              شبیه‌ساز تعاملی معماری دوگانه و زنجیره Tab-to-Jump
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
              مقایسه زنده محیط سنکرون Editor View و محیط ناهمگام Agent Manager / Mission Control
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
              Editor View (Synchronous)
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
              Agent Manager (Mission Control)
            </button>
          </div>
        </div>

        {m1ViewMode === 'editor' ? (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                شبیه‌ساز گام‌به‌گام پرش کرسر با <code dir="ltr" className="ltr-inline px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800">Tab-to-Jump</code> و <code dir="ltr" className="ltr-inline px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800">Supercomplete</code>:
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setM1JumpStep((prev) => (prev + 1) % jumpStages.length)}
                  className="px-3 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg flex items-center gap-1.5 cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>فشردن کلید Tab (گام بعدی)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setM1JumpStep(0)}
                  className="px-2.5 py-1.5 text-xs font-medium border border-slate-300 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {jumpStages.map((st, idx) => (
                <button
                  key={st.layer}
                  type="button"
                  onClick={() => setM1JumpStep(idx)}
                  className={`text-right p-3.5 rounded-lg border transition-all cursor-pointer ${
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
                    {st.descFa}
                  </p>
                </button>
              ))}
            </div>

            <div dir="ltr" className="ltr-code p-3.5 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono text-emerald-400">
              <div className="text-slate-400 mb-1">
                Active Cursor Target: {jumpStages[m1JumpStep].file}
              </div>
              <pre className="overflow-x-auto"><code>{jumpStages[m1JumpStep].diff}</code></pre>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/80 space-y-2">
              <div dir="ltr" className="ltr-inline text-xs font-mono text-emerald-500 font-semibold">
                Agent #1 · wt-settlement · RUNNING
              </div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                پیاده‌سازی موتور تسویه Idempotent
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                در حال اجرای خودکار تست‌های <code dir="ltr" className="ltr-inline">pytest-asyncio</code> در پس‌زمینه.
              </p>
            </div>
            <div className="p-4 rounded-lg border border-amber-500/40 bg-amber-500/5 space-y-2">
              <div dir="ltr" className="ltr-inline text-xs font-mono text-amber-500 font-semibold">
                Agent #2 · wt-audit · AWAITING REVIEW
              </div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                مایگریشن جدول لاگ‌های ممیزی
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                منتظر تایید شما روی آرتیفکت <code dir="ltr" className="ltr-inline">implementation_plan.md</code> در صندوق ورودی (Inbox).
              </p>
            </div>
            <div className="p-4 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/80 space-y-2">
              <div dir="ltr" className="ltr-inline text-xs font-mono text-blue-400 font-semibold">
                Agent #3 · wt-reporting · COMPLETED
              </div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                رفع مشکل N+1 کوئری گزارش‌ها
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                فایل <code dir="ltr" className="ltr-inline">walkthrough.md</code> به همراه ویدیوی WebP آماده تحویل است.
              </p>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (widgetType === 'artifact-auditor') {
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
              ماشین وضعیت زنده آرتیفکت <code dir="ltr" className="ltr-inline text-blue-500">task.md</code>
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              روی هر آیتم کلیک کنید تا چرخه انتقال وضعیت <code dir="ltr" className="ltr-inline">[ ] -&gt; [/] -&gt; [x]</code> را مشاهده نمایید.
            </p>
          </div>
        </div>
        <div className="space-y-2">
          {m2Tasks.map((t) => {
            const badge = t.status === 'done' ? '[x]' : t.status === 'progress' ? '[/]' : '[ ]';
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
                  <span className="text-slate-800 dark:text-slate-200">{t.label}</span>
                </div>
                <span className="text-[11px] font-mono text-slate-500">
                  {t.status === 'done' ? 'Completed' : t.status === 'progress' ? 'In-Progress' : 'Pending'}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  if (widgetType === 'autonomy-matrix') {
    const sampleCommands = [
      {
        cmd: 'poetry run pytest tests/ -v',
        verdict: 'ALLOW LIST MATCH -> Auto-Executed in Auto & Turbo Modes',
        risk: 'Safe (Read/Test Only)',
      },
      {
        cmd: 'poetry run alembic upgrade head',
        verdict: 'STATE MUTATION -> Prompts User in Auto Mode, Runs in Turbo Mode',
        risk: 'Medium (Schema Modification)',
      },
      {
        cmd: 'git push --force origin main',
        verdict: 'HARD DENY LIST MATCH -> Blocked in ALL Modes (Even Turbo)',
        risk: 'Critical (Destructive History Rewrite)',
      },
    ];

    return (
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60 p-5 space-y-4">
        <h3 className="text-base font-bold text-slate-900 dark:text-white">
          آزمایشگاه طبقه‌بندی‌کننده ایمنی دستورات (Command Safety Classifier)
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
          {sampleCommands.map((item, idx) => (
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
          <div className="text-slate-400">Classifier Evaluation Result:</div>
          <div className="text-emerald-400 font-bold">{sampleCommands[m3SelectedCmd].verdict}</div>
          <div className="text-slate-300">Risk Classification: {sampleCommands[m3SelectedCmd].risk}</div>
        </div>
      </div>
    );
  }

  if (widgetType === 'rule-activation') {
    const files = [
      {
        path: 'tests/test_settlement.py',
        activeRules: ['01-fastapi-sqlalchemy-async.md (Always On)', '02-pytest-qa-standards.md (Glob Match: tests/**/*.py)'],
        savedTokens: '650 tokens saved (Security rule stays dormant)',
      },
      {
        path: 'src/middleware/auth_jwt.py',
        activeRules: ['01-fastapi-sqlalchemy-async.md (Always On)', '03-security-and-telemetry.md (Model Decision Match)'],
        savedTokens: '820 tokens saved (Pytest rule stays dormant)',
      },
      {
        path: 'README.md',
        activeRules: ['01-fastapi-sqlalchemy-async.md (Always On)'],
        savedTokens: '1,470 tokens saved (Both Glob & Model Decision rules stay dormant)',
      },
    ];
    const current = files.find((f) => f.path === m4SelectedFile) || files[0];

    return (
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60 p-5 space-y-4">
        <h3 className="text-base font-bold text-slate-900 dark:text-white">
          شبیه‌ساز بارگذاری شرطی قوانین (<code dir="ltr" className="ltr-inline">.agent/rules/</code> Context Router)
        </h3>
        <div className="flex flex-wrap gap-2">
          {files.map((f) => (
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
          <div className="text-slate-400">Active Rules Loaded into Context Window for {current.path}:</div>
          {current.activeRules.map((r) => (
            <div key={r} className="text-emerald-400">
              ✓ {r}
            </div>
          ))}
          <div className="text-blue-400 pt-1 border-t border-slate-800">
            Token Efficiency: {current.savedTokens}
          </div>
        </div>
      </div>
    );
  }

  if (widgetType === 'workflow-pipeline') {
    const wfSteps = [
      { step: 'Step 1: alembic heads', mode: '// turbo (Auto)', detail: 'بررسی تک‌هد بودن گراف مایگریشن بدون توقف' },
      { step: 'Step 2: alembic revision --autogenerate', mode: 'Supervised Gate', detail: 'تولید فایل مایگریشن و بررسی عدم وجود drop_column ناخواسته' },
      { step: 'Step 3: upgrade head -> downgrade -1 -> upgrade head', mode: '// turbo (Auto)', detail: 'اثبات خودکار برگشت‌پذیری کامل مایگریشن روی دیتابیس تست' },
      { step: 'Step 4: pytest tests/integration/', mode: '// turbo (Auto)', detail: 'اجرای تست‌های یکپارچگی ناهمگام و تایید سلامت ORM' },
    ];

    return (
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60 p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            پایپ‌لاین تعاملی ورک‌فلو <code dir="ltr" className="ltr-inline text-blue-500">/safe-migration</code>
          </h3>
          <button
            type="button"
            onClick={() => setM5ActiveStep((prev) => (prev + 1) % wfSteps.length)}
            className="px-3 py-1.5 text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white rounded-lg cursor-pointer"
          >
            اجرای گام بعدی پایپ‌لاین
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {wfSteps.map((s, idx) => (
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
    return (
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60 p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              رهگیر زنده تله‌متری Browser Subagent (شکار و ترمیم خطای 422)
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              مشاهده نحوه شکار خطای عدم تطابق پارامتر Query در شبکه و اصلاح خودکار روتر FastAPI
            </p>
          </div>
          <button
            type="button"
            onClick={() => setM6Fixed422((prev) => !prev)}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg text-white cursor-pointer ${
              m6Fixed422 ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-amber-600 hover:bg-amber-500'
            }`}
          >
            {m6Fixed422 ? 'وضعیت: پچ خودکار اعمال شد (HTTP 200 OK)' : 'اجرای Auto-Patch توسط ایجنت روی روتر FastAPI'}
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
    return (
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60 p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            توپولوژی ارتباطی کلاینت MCP: مقایسه <code dir="ltr" className="ltr-inline">stdio</code> و <code dir="ltr" className="ltr-inline">sse</code>
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
              stdio Transport (Local Process)
            </button>
            <button
              type="button"
              onClick={() => setM7Transport('sse')}
              dir="ltr"
              className={`ltr-inline px-3 py-1 text-xs font-mono rounded cursor-pointer ${
                m7Transport === 'sse' ? 'bg-blue-600 text-white' : 'text-slate-600 dark:text-slate-300'
              }`}
            >
              sse Transport (Remote HTTP Stream)
            </button>
          </div>
        </div>
        <div dir="ltr" className="ltr-code p-4 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono">
          {m7Transport === 'stdio' ? (
            <div className="space-y-1 text-slate-200">
              <div className="text-blue-400">Antigravity IDE Host &lt;==[stdin/stdout JSON-RPC 2.0]==&gt; Local Subprocess (poetry run python telemetry_mcp.py)</div>
              <div className="text-slate-400">• Zero network port exposure on workstation · Lifecycle managed directly by Antigravity</div>
            </div>
          ) : (
            <div className="space-y-1 text-slate-200">
              <div className="text-emerald-400">Antigravity IDE Host &lt;==[HTTPS Server-Sent Events + POST]==&gt; Enterprise Internal MCP Gateway</div>
              <div className="text-slate-400">• Centralized VPC deployment · Shared across engineering teams with mTLS / Bearer Auth</div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60 p-5 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-base font-bold text-slate-900 dark:text-white">
          شبیه‌ساز هم‌زمانی ایجنت‌ها: پوشه واحد در برابر <code dir="ltr" className="ltr-inline">Git Worktrees</code>
        </h3>
        <button
          type="button"
          onClick={() => setM8Isolated((prev) => !prev)}
          className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg text-white cursor-pointer ${
            m8Isolated ? 'bg-emerald-600' : 'bg-rose-600'
          }`}
        >
          {m8Isolated ? 'حالت فعلی: ایزوله با ۳ Git Worktree مجزا (ایمن)' : 'حالت فعلی: ۳ ایجنت روی یک پوشه واحد (Race Condition!)'}
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

  const currentIdx = allModules.findIndex((m) => m.id === module.id);
  const prevMod = currentIdx > 0 ? allModules[currentIdx - 1] : null;
  const nextMod = currentIdx < allModules.length - 1 ? allModules[currentIdx + 1] : null;

  return (
    <div className="space-y-8 pb-12">
      {/* Module Header Card */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/75 p-6 sm:p-8 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <span className="font-bold text-blue-600 dark:text-blue-400">
              فصل ۰{module.number} از ۰۸
            </span>
            <span aria-hidden="true">·</span>
            <span dir="ltr" className="ltr-inline">{module.readingTime}</span>
            <span aria-hidden="true">·</span>
            <span dir="ltr" className="ltr-inline">{module.difficulty}</span>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <ExportSectionPdfButton
              label="دریافت PDF این فصل (Export Module PDF)"
              payload={fullModulePdfPayload}
              onExport={onExportPdf}
            />
            <button
              type="button"
              onClick={() => onToggleComplete(module.id)}
              className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold border transition-colors cursor-pointer whitespace-nowrap ${
                isCompleted
                  ? 'border-emerald-500/40 bg-emerald-500/15 text-emerald-600 dark:text-emerald-300'
                  : 'border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:border-blue-500/40'
              }`}
            >
              {isCompleted ? (
                <>
                  <CheckSquare className="w-4 h-4 text-emerald-500" />
                  <span>تکمیل شده (Completed)</span>
                </>
              ) : (
                <>
                  <Square className="w-4 h-4" />
                  <span>علامت‌گذاری به عنوان مطالعه‌شده</span>
                </>
              )}
            </button>
          </div>
        </div>

        <div className="space-y-3">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            {module.number}. {module.titleFa}
          </h1>
          <div dir="ltr" className="ltr-inline text-sm sm:text-base font-mono text-blue-600 dark:text-blue-400">
            {module.titleEn}
          </div>
          <p className="text-sm sm:text-base leading-7 text-slate-600 dark:text-slate-300 max-w-4xl">
            {module.summaryFa}
          </p>
        </div>

        {/* Key Takeaways Bento Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 pt-2">
          {module.keyTakeaways.map((kt) => (
            <div
              key={kt.titleFa}
              className="p-4 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/60 space-y-1.5"
            >
              <div dir="ltr" className="ltr-inline text-[11px] font-mono font-semibold text-blue-600 dark:text-blue-400">
                {kt.metricOrBadge}
              </div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                {kt.titleFa}
              </h3>
              <p className="text-xs leading-5 text-slate-600 dark:text-slate-400">
                {kt.descFa}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Interactive Module Simulator Widget */}
      <InteractiveModuleDiagram widgetType={module.interactiveWidgetType} />

      {/* Deep Sub-Sections */}
      <div className="space-y-8">
        {module.subSections.map((sub) => {
          const subPdfPayload: PrintableDocumentPayload = {
            titleFa: sub.titleFa,
            titleEn: sub.titleEn,
            subtitleOrCategory: `Module 0${module.number} · ${module.titleEn}`,
            sections: [
              {
                headingFa: sub.titleFa,
                headingEn: sub.titleEn,
                paragraphsFa: sub.contentFa,
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
              className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/75 p-6 sm:p-8 space-y-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
                <div>
                  <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                    {sub.titleFa}
                  </h2>
                  <div dir="ltr" className="ltr-inline text-xs font-mono text-slate-500 dark:text-slate-400 mt-1">
                    {sub.titleEn}
                  </div>
                </div>
                <ExportSectionPdfButton
                  label="دریافت PDF این بخش"
                  payload={subPdfPayload}
                  onExport={onExportPdf}
                  compact
                />
              </div>

              {/* Narrative Paragraphs */}
              <div className="space-y-4">
                {sub.contentFa.map((p, idx) => (
                  <p
                    key={idx}
                    className="text-sm sm:text-[15px] leading-8 text-slate-700 dark:text-slate-300 text-justify"
                  >
                    {p}
                  </p>
                ))}
              </div>

              {/* Technical Bullet Points with Strict LTR Isolation */}
              {sub.bulletPoints && sub.bulletPoints.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                  {sub.bulletPoints.map((bp) => (
                    <div
                      key={bp.termEn}
                      className="p-4 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/50 space-y-1.5"
                    >
                      <code
                        dir="ltr"
                        className="ltr-inline text-xs font-mono font-bold text-blue-600 dark:text-blue-400"
                      >
                        {bp.termEn}
                      </code>
                      <p className="text-xs sm:text-sm leading-6 text-slate-700 dark:text-slate-300">
                        {bp.descFa}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {/* Architectural Comparison Matrix */}
              {sub.comparisonTable && (
                <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800 my-4">
                  <table className="w-full text-right border-collapse text-xs sm:text-sm">
                    <thead>
                      <tr className="bg-slate-100 dark:bg-slate-950 text-slate-800 dark:text-slate-200 border-b border-slate-200 dark:border-slate-800">
                        {sub.comparisonTable.headers.map((h) => (
                          <th key={h} className="py-3 px-4 font-bold">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800/80">
                      {sub.comparisonTable.rows.map((row) => (
                        <tr
                          key={row.criterion}
                          className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                        >
                          <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                            <span dir="ltr" className="ltr-inline">{row.criterion}</span>
                          </td>
                          <td className="py-3 px-4 text-slate-700 dark:text-slate-300">
                            {row.optionA}
                          </td>
                          <td className="py-3 px-4 text-slate-700 dark:text-slate-300">
                            {row.optionB}
                          </td>
                          <td className="py-3 px-4 font-medium text-blue-600 dark:text-blue-400">
                            {row.architectVerdict}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Callouts (No thick left border — subtle all-around hairline border) */}
              {sub.callouts?.map((c) => (
                <div
                  key={c.title}
                  className={`p-4 rounded-xl border space-y-1.5 ${
                    c.type === 'warning'
                      ? 'border-amber-500/40 bg-amber-500/5 text-amber-900 dark:text-amber-200'
                      : 'border-blue-500/40 bg-blue-500/5 text-slate-800 dark:text-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-2 text-xs font-bold">
                    <ShieldCheck className="w-4 h-4 text-blue-500 shrink-0" />
                    <span>{c.title}</span>
                  </div>
                  <p className="text-xs sm:text-sm leading-6 opacity-90">{c.content}</p>
                </div>
              ))}

              {/* Production Code Sandboxes */}
              {sub.codeExamples && sub.codeExamples.length > 0 && (
                <CodeSandboxTabs examples={sub.codeExamples} />
              )}
            </section>
          );
        })}
      </div>

      {/* Next / Prev Module Footer Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-slate-200 dark:border-slate-800">
        {prevMod ? (
          <button
            type="button"
            onClick={() => onSelectModule(prevMod.id)}
            className="px-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-blue-500/50 text-xs font-semibold text-slate-700 dark:text-slate-200 cursor-pointer"
          >
            فصل قبلی: {prevMod.number}. {prevMod.titleFa}
          </button>
        ) : (
          <div />
        )}
        {nextMod && (
          <button
            type="button"
            onClick={() => onSelectModule(nextMod.id)}
            className="px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-xs font-semibold text-white flex items-center gap-2 cursor-pointer"
          >
            <span>فصل بعدی: {nextMod.number}. {nextMod.titleFa}</span>
            <ArrowRight className="w-4 h-4 rotate-180" />
          </button>
        )}
      </div>
    </div>
  );
};
