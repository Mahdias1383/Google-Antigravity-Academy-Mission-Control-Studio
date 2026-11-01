import { AppLanguage } from './translations';

export interface JumpStageItem {
  layer: string;
  file: string;
  diff: string;
  desc: string;
}

export interface AgentCardItem {
  id: string;
  badge: string;
  title: string;
  desc: string;
  variant: 'emerald' | 'amber' | 'blue';
}

export interface TaskLifecycleItem {
  id: string;
  label: string;
  status: 'todo' | 'progress' | 'done';
}

export interface CommandSafetyItem {
  cmd: string;
  verdict: string;
  risk: string;
}

export interface RuleActivationFileItem {
  path: string;
  activeRules: string[];
  savedTokens: string;
}

export interface WorkflowStepItem {
  step: string;
  mode: string;
  detail: string;
}

export function getEditorVsManagerContent(lang: AppLanguage) {
  const isEn = lang === 'en';
  return {
    title: isEn
      ? 'Interactive Dual Workspace & Tab-to-Jump Chain Simulator'
      : 'شبیه‌ساز تعاملی معماری دوگانه و زنجیره Tab-to-Jump',
    subtitle: isEn
      ? 'Live comparison of Synchronous Editor View vs Asynchronous Agent Manager (Mission Control)'
      : 'مقایسه زنده محیط سنکرون Editor View و محیط ناهمگام Agent Manager / Mission Control',
    editorTab: isEn ? 'Editor View (Synchronous)' : 'Editor View (سنکرون)',
    managerTab: isEn ? 'Agent Manager (Mission Control)' : 'Agent Manager (کنترل مأموریت)',
    subHeader: isEn
      ? 'Step-by-step cursor leaping with Tab-to-Jump & Supercomplete:'
      : 'شبیه‌ساز گام‌به‌گام پرش کرسر با Tab-to-Jump و Supercomplete:',
    tabBtn: isEn ? 'Press Tab Key (Next Leap)' : 'فشردن کلید Tab (گام بعدی)',
    activeTargetLabel: isEn ? 'Active Cursor Target:' : 'هدف فعال کرسر:',
    jumpStages: [
      {
        layer: '1. SQLAlchemy 2.0 Model',
        file: 'src/models/settlement.py:21',
        diff: '+ risk_score_bps: Mapped[int] = mapped_column(Integer, default=0)',
        desc: isEn
          ? 'Step 1: You define a new column in the ORM model. The LSP engine detects schema drift in real time.'
          : 'گام اول: شما ستون جدید را در مدل ORM تعریف می‌کنید. موتور LSP تغییر اسکیما را تشخیص می‌دهد.',
      },
      {
        layer: '2. Pydantic v2 Request/Response Schema',
        file: 'src/schemas/settlement.py:16',
        diff: '+ risk_score_bps: Annotated[int, Field(ge=0, le=10000)] = 0',
        desc: isEn
          ? 'Step 2 (Press Tab): Cursor leaps to schema buffer; Supercomplete synthesizes type-safe Annotated validation.'
          : 'گام دوم (با فشردن Tab): کرسر به فایل اسکیما پریده و Supercomplete فیلد متناظر با اعتبارسنجی Annotated را پیشنهاد می‌دهد.',
      },
      {
        layer: '3. FastAPI Async Router Guard',
        file: 'src/api/routers/settlements.py:39',
        diff: '+ if payload.risk_score_bps >= 8500:\n+     raise HTTPException(status_code=422, detail="High risk")',
        desc: isEn
          ? 'Step 3 (Press Tab again): Cursor leaps to FastAPI router and completes the domain guardrail condition.'
          : 'گام سوم (با فشردن مجدد Tab): کرسر به روتر FastAPI پریده و شرط گاردریل دامنه را تکمیل می‌کند.',
      },
    ] as JumpStageItem[],
    agentCards: [
      {
        id: 'ag-1',
        badge: 'Agent #1 · wt-settlement · RUNNING',
        title: isEn ? 'Implement Idempotent Settlement Engine' : 'پیاده‌سازی موتور تسویه Idempotent',
        desc: isEn
          ? 'Autonomously executing pytest-asyncio integration tests in background worktree.'
          : 'در حال اجرای خودکار تست‌های pytest-asyncio در پس‌زمینه.',
        variant: 'emerald',
      },
      {
        id: 'ag-2',
        badge: 'Agent #2 · wt-audit · AWAITING REVIEW',
        title: isEn ? 'Audit Ledger Migration Pipeline' : 'مایگریشن جدول لاگ‌های ممیزی',
        desc: isEn
          ? 'Waiting for your review on implementation_plan.md in Mission Control Inbox.'
          : 'منتظر تایید شما روی آرتیفکت implementation_plan.md در صندوق ورودی (Inbox).',
        variant: 'amber',
      },
      {
        id: 'ag-3',
        badge: 'Agent #3 · wt-reporting · COMPLETED',
        title: isEn ? 'Resolve N+1 Financial Query Bottleneck' : 'رفع مشکل N+1 کوئری گزارش‌ها',
        desc: isEn
          ? 'walkthrough.md proof artifact with WebP telemetry video ready for merge.'
          : 'فایل walkthrough.md به همراه ویدیوی WebP آماده تحویل است.',
        variant: 'blue',
      },
    ] as AgentCardItem[],
  };
}

export function getArtifactAuditorContent(lang: AppLanguage) {
  const isEn = lang === 'en';
  return {
    title: isEn ? 'Live State Machine of task.md Artifact' : 'ماشین وضعیت زنده آرتیفکت task.md',
    subtitle: isEn
      ? 'Click any item to cycle state transitions: [ ] -> [/] -> [x]'
      : 'روی هر آیتم کلیک کنید تا چرخه انتقال وضعیت [ ] -> [/] -> [x] را مشاهده نمایید.',
    statusLabels: {
      done: isEn ? 'Completed' : 'تکمیل شده',
      progress: isEn ? 'In-Progress' : 'در حال اجرا',
      todo: isEn ? 'Pending' : 'در انتظار',
    },
    tasks: [
      {
        id: 't1',
        label: isEn
          ? 'Add idempotency_key unique index to SettlementLedger'
          : 'افزودن ایندکس یکتای idempotency_key به جدول SettlementLedger',
        status: 'done' as const,
      },
      {
        id: 't2',
        label: isEn
          ? 'Implement Redis distributed lock & PostgreSQL ON CONFLICT handler'
          : 'پیاده‌سازی قفل توزیع‌شده Redis و مدیریت ON CONFLICT در PostgreSQL',
        status: 'progress' as const,
      },
      {
        id: 't3',
        label: isEn
          ? 'Verify 20 concurrent retries via pytest-asyncio'
          : 'بررسی ۲۰ تلاش هم‌زمان تکراری از طریق pytest-asyncio',
        status: 'todo' as const,
      },
    ],
  };
}

export function getAutonomyMatrixContent(lang: AppLanguage) {
  const isEn = lang === 'en';
  return {
    title: isEn
      ? 'Command Safety Classifier & Terminal Autonomy Matrix'
      : 'آزمایشگاه طبقه‌بندی‌کننده ایمنی دستورات (Command Safety Classifier)',
    evalHeader: isEn ? 'Classifier Evaluation Result:' : 'نتیجه ارزیابی کلاسیفایر:',
    riskHeader: isEn ? 'Risk Classification:' : 'سطح ریسک امنیتی:',
    commands: [
      {
        cmd: 'poetry run pytest tests/ -v',
        verdict: isEn
          ? 'ALLOW LIST MATCH -> Auto-Executed in Auto & Turbo Modes'
          : 'تطابق با لیست مجاز -> اجرای خودکار در حالت‌های Auto و Turbo',
        risk: isEn ? 'Safe (Read/Test Only)' : 'ایمن (فقط خواندنی / تست)',
      },
      {
        cmd: 'poetry run alembic upgrade head',
        verdict: isEn
          ? 'STATE MUTATION -> Prompts User in Auto Mode, Runs in Turbo Mode'
          : 'تغییر وضعیت دیتابیس -> سوال از کاربر در Auto، اجرای مستقیم در Turbo',
        risk: isEn ? 'Medium (Schema Modification)' : 'متوسط (تغییر اسکیما دیتابیس)',
      },
      {
        cmd: 'git push --force origin main',
        verdict: isEn
          ? 'HARD DENY LIST MATCH -> Blocked in ALL Modes (Even Turbo)'
          : 'تطابق با لیست مسدود قطعی -> مسدود در تمام حالت‌ها (حتی Turbo)',
        risk: isEn ? 'Critical (Destructive History Rewrite)' : 'بحرانی (بازنویسی مخرب تاریخچه)',
      },
    ] as CommandSafetyItem[],
  };
}

export function getRuleActivationContent(lang: AppLanguage) {
  const isEn = lang === 'en';
  return {
    title: isEn
      ? 'Conditional Rule Loading Engine (.agent/rules/ Context Router)'
      : 'شبیه‌ساز بارگذاری شرطی قوانین (.agent/rules/ Context Router)',
    activeRulesLabel: isEn
      ? 'Active Rules Loaded into Context Window for'
      : 'قوانین فعال بارگذاری‌شده در پنجره کانتکست برای',
    tokenEfficiencyLabel: isEn ? 'Token Efficiency:' : 'بهینه‌سازی مصرف توکن:',
    files: [
      {
        path: 'tests/test_settlement.py',
        activeRules: [
          '01-fastapi-sqlalchemy-async.md (Always On)',
          '02-pytest-qa-standards.md (Glob Match: tests/**/*.py)',
        ],
        savedTokens: isEn
          ? '650 tokens saved (Security rule stays dormant)'
          : '۶۵۰ توکن ذخیره شد (قانون امنیتی غیرفعال ماند)',
      },
      {
        path: 'src/middleware/auth_jwt.py',
        activeRules: [
          '01-fastapi-sqlalchemy-async.md (Always On)',
          '03-security-and-telemetry.md (Model Decision Match)',
        ],
        savedTokens: isEn
          ? '820 tokens saved (Pytest rule stays dormant)'
          : '۸۲۰ توکن ذخیره شد (قانون تست غیرفعال ماند)',
      },
      {
        path: 'README.md',
        activeRules: ['01-fastapi-sqlalchemy-async.md (Always On)'],
        savedTokens: isEn
          ? '1,470 tokens saved (Both Glob & Model Decision rules stay dormant)'
          : '۱,۴۷۰ توکن ذخیره شد (قوانین گلاب و مدل غیرفعال ماندند)',
      },
    ] as RuleActivationFileItem[],
  };
}

export function getWorkflowPipelineContent(lang: AppLanguage) {
  const isEn = lang === 'en';
  return {
    title: isEn
      ? 'Interactive /safe-migration Workflow Pipeline Sequencer'
      : 'پایپ‌لاین تعاملی ورک‌فلو /safe-migration',
    nextBtn: isEn ? 'Execute Next Pipeline Step' : 'اجرای گام بعدی پایپ‌لاین',
    steps: [
      {
        step: 'Step 1: alembic heads',
        mode: '// turbo (Auto)',
        detail: isEn
          ? 'Verify single-head migration graph without human pause'
          : 'بررسی تک‌هد بودن گراف مایگریشن بدون توقف',
      },
      {
        step: 'Step 2: alembic revision --autogenerate',
        mode: isEn ? 'Supervised Gate' : 'گیت نظارتی انسانی',
        detail: isEn
          ? 'Generate migration file and verify zero unwanted drop_column operations'
          : 'تولید فایل مایگریشن و بررسی عدم وجود drop_column ناخواسته',
      },
      {
        step: 'Step 3: upgrade head -> downgrade -1 -> upgrade head',
        mode: '// turbo (Auto)',
        detail: isEn
          ? 'Prove migration reversibility automatically against ephemeral test DB'
          : 'اثبات خودکار برگشت‌پذیری کامل مایگریشن روی دیتابیس تست',
      },
      {
        step: 'Step 4: pytest tests/integration/',
        mode: '// turbo (Auto)',
        detail: isEn
          ? 'Run async integration test suite and verify ORM data integrity'
          : 'اجرای تست‌های یکپارچگی ناهمگام و تایید سلامت ORM',
      },
    ] as WorkflowStepItem[],
  };
}

export function getBrowserTelemetryContent(lang: AppLanguage) {
  const isEn = lang === 'en';
  return {
    title: isEn
      ? 'Browser Subagent Live Telemetry & 422 Error Auto-Patcher'
      : 'رهگیر زنده تله‌متری Browser Subagent (شکار و ترمیم خطای 422)',
    subtitle: isEn
      ? 'Observe network interceptor detecting Query param mismatch and agent auto-patching FastAPI router'
      : 'مشاهده نحوه شکار خطای عدم تطابق پارامتر Query در شبکه و اصلاح خودکار روتر FastAPI',
    patchBtnActive: isEn
      ? 'Status: Auto-Patch Applied (HTTP 200 OK)'
      : 'وضعیت: پچ خودکار اعمال شد (HTTP 200 OK)',
    patchBtnInactive: isEn
      ? 'Execute Auto-Patch via Agent on FastAPI Router'
      : 'اجرای Auto-Patch توسط ایجنت روی روتر FastAPI',
  };
}

export function getMcpTopologyContent(lang: AppLanguage) {
  const isEn = lang === 'en';
  return {
    title: isEn
      ? 'MCP Client Topology: stdio vs sse Transport Invariants'
      : 'توپولوژی ارتباطی کلاینت MCP: مقایسه stdio و sse',
    stdioBtn: isEn ? 'stdio Transport (Local Subprocess)' : 'ترانسپورت stdio (پروسس محلی)',
    sseBtn: isEn ? 'sse Transport (Remote HTTP Stream)' : 'ترانسپورت sse (استریم راه دور HTTP)',
    stdioSubtitle: isEn
      ? 'Antigravity IDE Host <==[stdin/stdout JSON-RPC 2.0]==> Local Subprocess (poetry run python telemetry_mcp.py)'
      : 'Antigravity IDE Host <==[stdin/stdout JSON-RPC 2.0]==> Local Subprocess (poetry run python telemetry_mcp.py)',
    stdioDetail: isEn
      ? '• Zero network port exposure on workstation · Lifecycle managed directly by Antigravity'
      : '• عدم باز شدن پورت شبکه در سیستم · چرخه حیات پروسس مستقیماً توسط Antigravity کنترل می‌شود',
    sseSubtitle: isEn
      ? 'Antigravity IDE Host <==[HTTPS Server-Sent Events + POST]==> Enterprise Internal MCP Gateway'
      : 'Antigravity IDE Host <==[HTTPS Server-Sent Events + POST]==> Enterprise Internal MCP Gateway',
    sseDetail: isEn
      ? '• Centralized VPC deployment · Shared across engineering teams with mTLS / Bearer Auth'
      : '• استقرار متمرکز در VPC سازمان · اشتراک‌گذاری امن میان تیم‌های مهندسی با mTLS و Bearer Auth',
  };
}

export function getWorktreeIsolationContent(lang: AppLanguage) {
  const isEn = lang === 'en';
  return {
    title: isEn
      ? 'Multi-Agent Concurrency Simulator: Single Root vs Git Worktrees'
      : 'شبیه‌ساز هم‌زمانی ایجنت‌ها: پوشه واحد در برابر Git Worktrees',
    isolatedBtn: isEn
      ? 'Current: Isolated via 3 Git Worktrees (Safe)'
      : 'حالت فعلی: ایزوله با ۳ Git Worktree مجزا (ایمن)',
    collidingBtn: isEn
      ? 'Current: 3 Agents in Single Root (Race Condition Collision!)'
      : 'حالت فعلی: ۳ ایجنت روی یک پوشه واحد (Race Condition!)',
  };
}
