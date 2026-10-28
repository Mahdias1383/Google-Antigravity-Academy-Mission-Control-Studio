import { ArchitectScenario, CheatSheetCard, CurriculumModule } from '../types/curriculum';
import { MODULES_PART_1 } from './modulesPart1';
import { MODULES_PART_2 } from './modulesPart2';

export const ALL_CURRICULUM_MODULES: CurriculumModule[] = [
  ...MODULES_PART_1,
  ...MODULES_PART_2,
];

export const CHEAT_SHEET_CARDS: CheatSheetCard[] = [
  {
    id: 'cs-shortcuts',
    titleFa: 'میانبرهای کلیدی و ناوبری هوشمند',
    titleEn: 'Keyboard Shortcuts & Editor AI Navigation',
    category: 'Editor View',
    items: [
      {
        keyEn: 'Tab',
        labelFa: 'پذیرش Supercomplete یا اجرای Tab-to-Jump',
        detailFa: 'اعمال پیشنهاد چندخطی و پرش هوشمند به محل تغییر بعدی در فایل یا اسکیمای مرتبط.',
      },
      {
        keyEn: 'Cmd / Ctrl + I',
        labelFa: 'فرمان درون‌خطی (Inline Command)',
        detailFa: 'بازنویسی جراحی تابع یا کلاس انتخاب‌شده در سطح AST بدون ترک ویرایشگر.',
      },
      {
        keyEn: 'Cmd / Ctrl + K',
        labelFa: 'جستجوی سراسری و لانچر دستورات',
        detailFa: 'دسترسی آنی به تمام فصل‌ها، استودیوها، قوانین و دستورات اسلش.',
      },
      {
        keyEn: 'Cmd / Ctrl + Shift + M',
        labelFa: 'سوییچ آنی بین Editor View و Agent Manager',
        detailFa: 'انتقال سریع از کدنویسی خطی به داشبورد Mission Control و صندوق ورودی (Inbox).',
      },
    ],
  },
  {
    id: 'cs-mentions',
    titleFa: 'منشن‌های تزریق کانتکست به ایجنت',
    titleEn: '@ Context Mentions Reference',
    category: 'Context Engineering',
    items: [
      {
        keyEn: '@file',
        labelFa: 'سنجاق کردن فایل مشخص به پرامپت',
        detailFa: 'مثال: @src/models/settlement.py برای تمرکز دقیق ایجنت روی مدل دیتابیس.',
      },
      {
        keyEn: '@folder',
        labelFa: 'اسکن ساختار و فایل‌های یک دایرکتوری',
        detailFa: 'مثال: @src/api/routers برای بررسی یکپارچگی تمام اندپوینت‌ها.',
      },
      {
        keyEn: '@rule',
        labelFa: 'فراخوانی دستی یک قانون خاص',
        detailFa: 'مثال: @03-security-and-telemetry برای اعمال چک‌لیست امنیتی در تسک جاری.',
      },
      {
        keyEn: '@mcp',
        labelFa: 'هدایت ایجنت به یک سرور یا ابزار MCP',
        detailFa: 'مثال: @mcp:postgres-analytics-ro برای کوئری گرفتن از اسکیمای دیتابیس.',
      },
      {
        keyEn: '@terminal',
        labelFa: 'تزریق خروجی و استک‌تریس آخرین دستور ترمینال',
        detailFa: 'ارسال مستقیم لاگ شکست Pytest یا Alembic به ایجنت بدون کپی‌پیست دستی.',
      },
    ],
  },
  {
    id: 'cs-rules-yaml',
    titleFa: 'مرجع YAML Frontmatter قوانین (.agent/rules)',
    titleEn: '.agent/rules/*.md YAML Frontmatter Spec',
    category: 'Rules & Guardrails',
    items: [
      {
        keyEn: 'alwaysApply: true',
        labelFa: 'حالت Always On (تزریق دائمی)',
        detailFa: 'مناسب برای قوانین پایه و کوتاه که در ۱۰۰٪ تسک‌های پروژه کاربرد دارند.',
      },
      {
        keyEn: 'globs: ["src/**/*.py"]',
        labelFa: 'حالت Glob (فعال‌سازی مبتنی بر الگو)',
        detailFa: 'بارگذاری خودکار قانون فقط هنگام باز شدن فایل‌های منطبق با الگوی مسیر.',
      },
      {
        keyEn: 'description: "Activate when..."',
        labelFa: 'حالت Model Decision (تصمیم‌گیری معنایی)',
        detailFa: 'فعال‌سازی هوشمند توسط روتر معنایی زمانی که موضوع تسک با توضیحات همخوانی دارد.',
      },
      {
        keyEn: 'alwaysApply: false (No globs)',
        labelFa: 'حالت Manual (فراخوانی صریح)',
        detailFa: 'بدون مصرف توکن تا زمانی که کاربر صراحتاً با @rule-name آن را صدا بزند.',
      },
    ],
  },
  {
    id: 'cs-workflows',
    titleFa: 'دایرکتیوهای ورک‌فلو و اتوماسیون (/slash)',
    titleEn: '.agent/workflows/*.md & Turbo Directives',
    category: 'Workflows & SOPs',
    items: [
      {
        keyEn: '.agent/workflows/<name>.md',
        labelFa: 'مسیر ثبت خودکار دستور اسلش',
        detailFa: 'نام فایل مستقیماً به دستور /name در پنجره ورودی ایجنت تبدیل می‌شود.',
      },
      {
        keyEn: '// turbo',
        labelFa: 'اجرای خودکار تک‌گام (Single-Step Auto-Run)',
        detailFa: 'درج بالای یک بلوک کد bash برای اجرای بدون توقف فقط همان گام.',
      },
      {
        keyEn: '// turbo-all',
        labelFa: 'اجرای خودکار کل پایپ‌لاین (Full Pipeline)',
        detailFa: 'درج در بالای فایل ورک‌فلو برای اجرای پیوسته تمام گام‌ها بدون درخواست تایید.',
      },
      {
        keyEn: 'task.md · implementation_plan.md · walkthrough.md',
        labelFa: 'چرخه حیات ۳ آرتیفکت استاندارد',
        detailFa: 'خروجی‌های ساختاریافته ایجنت در دایرکتوری brain/ برای ممیزی PR-Style.',
      },
    ],
  },
  {
    id: 'cs-terminal-lists',
    titleFa: 'لیست‌های استاندارد Allow List و Deny List ترمینال',
    titleEn: 'Production Terminal Allow & Deny Lists',
    category: 'Security & Governance',
    items: [
      {
        keyEn: 'ALLOW: poetry run pytest / ruff check .',
        labelFa: 'دستورات تست و تحلیل ایستا (ایمن)',
        detailFa: 'اجرای خودکار در حالت Auto برای تسریع حلقه بازخورد TDD.',
      },
      {
        keyEn: 'ALLOW: alembic heads / current / history',
        labelFa: 'دستورات بازرسی وضعیت اسکیمای دیتابیس',
        detailFa: 'کاملاً خواندنی و بدون تغییر در وضعیت جداول دیتابیس.',
      },
      {
        keyEn: 'DENY: rm -rf / git push --force / reset --hard',
        labelFa: 'مسدودسازی دستورات مخرب فایل و تاریخچه گیت',
        detailFa: 'جلوگیری قطعی از حذف فایل‌ها یا بازنویسی تاریخچه مخزن حتی در حالت Turbo.',
      },
      {
        keyEn: 'DENY: alembic downgrade base / DROP TABLE',
        labelFa: 'حفاظت در برابر تخریب داده‌های دیتابیس',
        detailFa: 'الزام به بررسی انسانی برای هرگونه عملیات حذف جدول یا بازگشت کامل اسکیما.',
      },
    ],
  },
  {
    id: 'cs-worktrees',
    titleFa: 'دستورات Git Worktree برای ایجنت‌های موازی',
    titleEn: 'Git Worktree Parallel Orchestration CLI',
    category: 'Multi-Agent Scaling',
    items: [
      {
        keyEn: 'git worktree add -b feat/x ../wt-x main',
        labelFa: 'ایجاد فضای کاری فیزیکی و برنچ ایزوله',
        detailFa: 'اختصاص یک پوشه مستقل به ایجنت جدید برای جلوگیری از قفل شدن فایل‌ها.',
      },
      {
        keyEn: 'git worktree list',
        labelFa: 'مشاهده تمام Worktreeهای فعال و کامیت‌های آن‌ها',
        detailFa: 'بررسی وضعیت پوشه‌های موازی در حال اجرا توسط ایجنت‌های مختلف.',
      },
      {
        keyEn: 'git worktree remove ../wt-x',
        labelFa: 'پاک‌سازی محیط پس از ادغام Pull Request',
        detailFa: 'بستن و حذف ایمن پوشه کاری ایجنت پس از تحویل نهایی walkthrough.md.',
      },
      {
        keyEn: '1 Feature = 1 Fresh Agent Task',
        labelFa: 'قانون طلایی جلوگیری از Context Rot',
        detailFa: 'عدم استفاده مجدد از یک ترد چت قدیمی برای فیچرهای جدید جهت حفظ دقت مدل.',
      },
    ],
  },
];

export const ARCHITECT_SCENARIOS: ArchitectScenario[] = [
  {
    id: 'scen-1',
    number: 1,
    titleFa: 'تداخل فایل و شکست تصادفی Pytest در اجرای هم‌زمان ۳ ایجنت',
    titleEn: 'Concurrent Multi-Agent File Lock & Test DB Race Condition',
    category: 'Multi-Agent Orchestration',
    problemStatementFa:
      'شما در Agent Manager سه ایجنت را به صورت موازی مامور پیاده‌سازی سه فیچر مختلف کرده‌اید. پس از چند دقیقه متوجه می‌شوید تست‌های Pytest با خطاهای عجیب دیتابیس شکست می‌خورند و تغییرات گیت ایجنت اول با ایجنت دوم قاطی شده است. بهترین راهکار معماری چیست؟',
    contextCodeOrConfig: `# Current anti-pattern:
# Agent 1, Agent 2, and Agent 3 all running inside /workspace/core-api
$ pytest -> ERROR: relation "settlement_ledgers" is being accessed by other users`,
    options: [
      {
        id: 's1-opt1',
        labelFa: 'ایجاد ۳ محیط ایزوله با git worktree add و اختصاص دیتابیس تست مجزا به هر Worktree',
        commandOrSpecEn: 'git worktree add -b feat/a ../wt-a main && export TEST_DB=db_wt_a',
        isOptimal: true,
        explanationFa:
          'کاملاً صحیح! استفاده از Git Worktrees یک دایرکتوری فیزیکی و ایندکس گیت کاملاً مستقل به هر ایجنت می‌دهد و تفکیک نام دیتابیس تست در .env.test هرگونه Race Condition را به صفر می‌رساند.',
        impactMetrics: 'Zero Lock Contention · 3x Parallel Throughput',
      },
      {
        id: 's1-opt2',
        labelFa: 'تغییر سیاست ترمینال به Off و اجرای تک‌به‌تک دستورات به صورت دستی',
        commandOrSpecEn: 'Terminal Policy: Off (Manual Sequential Execution)',
        isOptimal: false,
        explanationFa:
          'این کار مشکل بازنویسی هم‌زمان فایل‌های کد در یک Working Tree واحد را حل نمی‌کند و مزیت سرعت ایجنت‌های ناهمگام را از بین می‌برد.',
        impactMetrics: 'High Human Bottleneck · File Collisions Remain',
      },
      {
        id: 's1-opt3',
        labelFa: 'ادغام هر ۳ فیچر در یک پرامپت واحد داخل یک ایجنت',
        commandOrSpecEn: 'Single Mega-Prompt in 1 Agent Session',
        isOptimal: false,
        explanationFa:
          'ترکیب ۳ فیچر غیرمرتبط در یک نشست واحد منجر به Context Rot شدید، افت دقت Lost-in-the-Middle و پیچیده شدن ممیزی implementation_plan.md می‌شود.',
        impactMetrics: 'Severe Context Rot · High Token Cost',
      },
    ],
  },
  {
    id: 'scen-2',
    number: 2,
    titleFa: 'بهینه‌سازی مصرف توکن برای قوانین سنگین تست و امنیت',
    titleEn: 'Rule Activation Optimization & Token Budget Governance',
    category: 'Context Engineering',
    problemStatementFa:
      'تیم شما یک فایل قانون ۲۵۰۰ توکنی شامل تمام جزئیات فیکسچرهای Pytest و شبیه‌سازی بار (Load Testing) نوشته و آن را روی Always On قرار داده است. اکنون حتی برای تغییر رنگ یک دکمه در UI، این ۲۵۰۰ توکن در هر نوبت ارسال می‌شود. چگونه آن را اصلاح می‌کنید؟',
    contextCodeOrConfig: `---
alwaysApply: true
description: "Massive 2,500-token Pytest and Load Testing manual"
---`,
    options: [
      {
        id: 's2-opt1',
        labelFa: 'تغییر حالت فعال‌سازی به Glob محدود به مسیرهای تست (tests/**/*.py)',
        commandOrSpecEn: 'alwaysApply: false + globs: ["tests/**/*.py", "conftest.py"]',
        isOptimal: true,
        explanationFa:
          'دقیقاً درست است! با استفاده از حالت فعال‌سازی Glob، این قانون سنگین تنها زمانی که ایجنت فایل‌های تست را باز یا ویرایش می‌کند بارگذاری شده و در سایر تسک‌ها ۰ توکن مصرف می‌کند.',
        impactMetrics: '-78% Context Token Overhead · Sharper Model Attention',
      },
      {
        id: 's2-opt2',
        labelFa: 'حذف کامل فایل قانون و کپی دستی آن در چت هر زمان که لازم شد',
        commandOrSpecEn: 'Delete .agent/rules/ file and paste manually in chat',
        isOptimal: false,
        explanationFa:
          'حذف فایل از مخزن گیت باعث از دست رفتن استانداردسازی تیمی و فراموشی قوانین توسط سایر اعضای تیم می‌شود.',
        impactMetrics: 'Unstandardized QA · Manual Friction',
      },
      {
        id: 's2-opt3',
        labelFa: 'انتقال کل محتوا به تنظیمات Global در مسیر ~/.gemini/',
        commandOrSpecEn: 'Move to ~/.gemini/GEMINI.md with alwaysApply: true',
        isOptimal: false,
        explanationFa:
          'انتقال به قوانین Global نه تنها مشکل مصرف دائمی توکن را حل نمی‌کند بلکه آن را به سایر پروژه‌های غیرمرتبط شما نیز تحمیل می‌کند.',
        impactMetrics: 'Global Context Pollution',
      },
    ],
  },
  {
    id: 'scen-3',
    number: 3,
    titleFa: 'ممیزی تغییر مخرب اسکیمای دیتابیس پیش از اجرای کد',
    titleEn: 'Pre-Execution Auditing of Destructive Schema Changes',
    category: 'Artifact Governance',
    problemStatementFa:
      'شما از ایجنت خواسته‌اید مدل تراکنش‌های بانکی را بازطراحی کند. می‌خواهید مطمئن شوید ایجنت تحت هیچ شرایطی بدون تایید مستقیم شما ستونی را حذف (drop_column) نمی‌کند یا کد را مستقیماً تغییر نمی‌دهد. کدام ترکیب تنظیمات الزامی است؟',
    contextCodeOrConfig: `# Target: Refactor src/models/settlement.py & generate Alembic revision
# Requirement: Mandatory human sign-off on architectural plan before file edits`,
    options: [
      {
        id: 's3-opt1',
        labelFa: 'اجرا در Planning Mode با سیاست مرور Request Review و کامنت‌گذاری خطی روی implementation_plan.md',
        commandOrSpecEn: 'Mode: Planning Mode · Review Policy: Request Review',
        isOptimal: true,
        explanationFa:
          'بهترین تصمیم! در این حالت ایجنت ابتدا فایل implementation_plan.md را به همراه هشدار User Review Required تولید کرده و متوقف می‌شود تا شما خطوط مربوطه را به صورت PR-Style ممیزی کنید.',
        impactMetrics: '100% Pre-Execution Audit · Zero Accidental Data Loss',
      },
      {
        id: 's3-opt2',
        labelFa: 'اجرا در Fast Mode به همراه سیاست ترمینال Turbo',
        commandOrSpecEn: 'Mode: Fast Mode · Terminal Policy: Turbo',
        isOptimal: false,
        explanationFa:
          'بسیار خطرناک! حالت Fast Mode تولید implementation_plan.md را دور می‌زند و سیاست Turbo مایگریشن را بلافاصله روی دیتابیس اعمال می‌کند.',
        impactMetrics: 'High Risk of Unreviewed Schema Drop',
      },
      {
        id: 's3-opt3',
        labelFa: 'استفاده از دایرکتیو // turbo-all در ابتدای ورک‌فلو',
        commandOrSpecEn: '// turbo-all inside migration workflow',
        isOptimal: false,
        explanationFa:
          'دایرکتیو // turbo-all تمام گام‌های ورک‌فلو را بدون توقف اجرا می‌کند و فرصت بازبینی انسانی پیش از اعمال مایگریشن را سلب می‌نماید.',
        impactMetrics: 'Bypasses Human Review Gate',
      },
    ],
  },
  {
    id: 'scen-4',
    number: 4,
    titleFa: 'خودکارسازی چرخه تست برگشت‌پذیری مایگریشن‌های Alembic',
    titleEn: 'Automating Reversible Alembic Migration SOP via Slash Workflows',
    category: 'Workflows & Turbo',
    problemStatementFa:
      'تیم شما می‌خواهد هر بار که دستور /safe-migration اجرا می‌شود، مراحل بررسی هدها و اجرای تست‌های برگشت‌پذیری (upgrade -> downgrade -> upgrade) به صورت خودکار اجرا شوند، اما تولید خود فایل مایگریشن تحت نظارت باشد. چگونه فایل ورک‌فلو را طراحی می‌کنید؟',
    contextCodeOrConfig: `# File: .agent/workflows/safe-migration.md
# Goal: Auto-run safe verification steps while keeping revision generation supervised`,
    options: [
      {
        id: 's4-opt1',
        labelFa: 'استفاده از دایرکتیو تک‌گام // turbo فقط بالای گام‌های بررسی هد، تست برگشت‌پذیری و Pytest',
        commandOrSpecEn: 'Place // turbo above Step 1, Step 4, and Step 5 only',
        isOptimal: true,
        explanationFa:
          'طراحی دقیق و مهندسی‌شده! دایرکتیو // turbo فقط گام مشخص‌شده را به صورت خودکار اجرا می‌کند و به شما اجازه می‌دهد در گام‌های حساس کنترل را در دست بگیرید.',
        impactMetrics: 'Granular Step Automation · Safe Revision Audit',
      },
      {
        id: 's4-opt2',
        labelFa: 'قرار دادن // turbo-all در خط اول فایل .agent/workflows/safe-migration.md',
        commandOrSpecEn: 'Global // turbo-all at top of workflow file',
        isOptimal: false,
        explanationFa:
          'دایرکتیو // turbo-all تمام گام‌ها از جمله گام تولید و اعمال اولیه را بدون توقف اجرا می‌کند.',
        impactMetrics: 'Zero Intermediate Supervision',
      },
      {
        id: 's4-opt3',
        labelFa: 'نوشتن مراحل داخل فایل .agent/rules/migrations.md',
        commandOrSpecEn: 'Put sequential bash steps inside .agent/rules/',
        isOptimal: false,
        explanationFa:
          'قوانین (.agent/rules) برای گاردریل‌های اعلانی هستند، نه پایپ‌لاین‌های اجرایی ترتیبی و قابلیت ثبت دستور اسلش یا // turbo را ندارند.',
        impactMetrics: 'Wrong Abstraction Layer',
      },
    ],
  },
  {
    id: 'scen-5',
    number: 5,
    titleFa: 'شکار خودکار خطای 422 Unprocessable Entity بین جدول UI و روتر FastAPI',
    titleEn: 'Autonomous 422 Payload Interception via Browser Subagent',
    category: 'Browser Subagent',
    problemStatementFa:
      'پس از تغییر نام فیلد صفحه‌بندی در بک‌اند FastAPI، تست‌های واحد بک‌اند پاس می‌شوند اما وقتی کاربر در داشبورد فرانت‌اند روی فیلتر وضعیت کلیک می‌کند، جدول خالی می‌ماند. ایجنت چگونه باید این مشکل را کشف و برطرف کند؟',
    contextCodeOrConfig: `GET /v1/reports/summary?status_filter=SETTLED&page_size=25 -> HTTP 422
Response: {"detail":[{"loc":["query","statusFilter"],"msg":"Field required"}]}`,
    options: [
      {
        id: 's5-opt1',
        labelFa: 'اجرای Browser Subagent، رهگیری پاسخ 422 در استریم Network، اصلاح خودکار Query(alias=...) و ضبط WebP در walkthrough.md',
        commandOrSpecEn: 'Browser Subagent Network Interceptor -> Auto-Patch FastAPI -> Capture WebP',
        isOptimal: true,
        explanationFa:
          'عالی! ساب‌ایجنت مرورگر در کرومیوم ابزارگذاری‌شده با کلیک واقعی روی فیلتر، خطای شبکه 422 و بدنه JSON آن را شکار کرده، کد بک‌اند را اصلاح می‌کند و ویدیوی WebP اثبات سلامت را در walkthrough.md قرار می‌دهد.',
        impactMetrics: 'End-to-End Self-Healing · Visual WebP Proof',
      },
      {
        id: 's5-opt2',
        labelFa: 'اکتفا به اجرای مجدد pytest روی تست‌های واحد فعلی',
        commandOrSpecEn: 'Re-run unit tests with mocked payloads',
        isOptimal: false,
        explanationFa:
          'تست‌های واحد بک‌اند که با پेलودهای فرضی نوشته شده‌اند، عدم تطابق واقعی قرارداد فرانت‌اند و بک‌اند را نشان نمی‌دهند.',
        impactMetrics: 'Misses Integration Contract Mismatch',
      },
      {
        id: 's5-opt3',
        labelFa: 'غیرفعال کردن اعتبارسنجی Pydantic در روتر FastAPI',
        commandOrSpecEn: 'Remove Pydantic Query validation and use raw Request',
        isOptimal: false,
        explanationFa:
          'حذف اعتبارسنجی Pydantic امنیت و قرارداد تایپ‌های API را از بین می‌برد و ناقض قوانین معماری است.',
        impactMetrics: 'Breaks API Type Safety',
      },
    ],
  },
  {
    id: 'scen-6',
    number: 6,
    titleFa: 'طراحی سرور FastMCP برای واکشی امن لاگ‌های خطای Production',
    titleEn: 'Architecting Custom FastMCP Telemetry Server & Read-Only MCP Config',
    category: 'Enterprise MCP',
    problemStatementFa:
      'تیم عملیات می‌خواهد ایجنت‌های Antigravity بتوانند هنگام بررسی رخدادها، لاگ‌های ۵xx خوشه OpenSearch و ساختار جداول PostgreSQL را مستقیماً بخوانند اما هرگز نتوانند داده‌ای را در دیتابیس Production تغییر دهند. بهترین معماری MCP چیست؟',
    contextCodeOrConfig: `# Target: ~/.gemini/antigravity/mcp_config.json + FastMCP Python server`,
    options: [
      {
        id: 's6-opt1',
        labelFa: 'توسعه ابزار @mcp.tool() با httpx.AsyncClient در FastMCP و تنظیم default_transaction_read_only=on برای سرور Postgres در mcp_config.json',
        commandOrSpecEn: 'FastMCP @mcp.tool() + PGOPTIONS="-c default_transaction_read_only=on"',
        isOptimal: true,
        explanationFa:
          'کاملاً استاندارد! استفاده از FastMCP با تایم‌اوت صریح و اتصال به دیتابیس با کاربر Read-Only و فلگ تراکنش فقط-خواندنی، امنیت کامل زیرساخت را در کنار دسترسی غنی به تله‌متری تضمین می‌کند.',
        impactMetrics: 'Zero Production Write Risk · Real-Time Telemetry Grounding',
      },
      {
        id: 's6-opt2',
        labelFa: 'قرار دادن پسورد کاربر Superuser دیتابیس در فایل قوانین .agent/rules/',
        commandOrSpecEn: 'Hardcode postgres superuser URI inside .agent/rules/',
        isOptimal: false,
        explanationFa:
          'فاجعه امنیتی! قرار دادن اطلاعات حساس در فایل‌های قوانین گیت و استفاده از دسترسی Superuser کاملاً ممنوع است.',
        impactMetrics: 'Critical Credential Leak & Data Destruction Risk',
      },
      {
        id: 's6-opt3',
        labelFa: 'استفاده از کتابخانه سنکرون requests بدون تایم‌اوت در ابزار MCP',
        commandOrSpecEn: 'Synchronous requests.post() without timeout',
        isOptimal: false,
        explanationFa:
          'درخواست‌های شبکه بدون تایم‌اوت در صورت کندی OpenSearch باعث قفل شدن حلقه رویداد (Event Loop) سرور MCP و هنگ کردن ایجنت می‌شوند.',
        impactMetrics: 'Event Loop Starvation · Hung Agent Sessions',
      },
    ],
  },
  {
    id: 'scen-7',
    number: 7,
    titleFa: 'افت شدید هوشمندی ایجنت و کندی پاسخ پس از ۴ ساعت کار مداوم در یک ترد',
    titleEn: 'Diagnosing & Eliminating Context Rot (Lost-in-the-Middle Degradation)',
    category: 'Context & Memory ROI',
    problemStatementFa:
      'یک توسعه‌دهنده ارشد از صبح در یک تسک واحد ۴ فیچر مختلف (احراز هویت، گزارش‌گیری PDF، کش Redis و تغییر استایل جدول) را با ایجنت پیش برده است. در فیچر چهارم، ایجنت قوانین SQLAlchemy 2.0 را فراموش کرده و بسیار کند پاسخ می‌دهد. علت و راهکار چیست؟',
    contextCodeOrConfig: `Session Token Count: 148,000 / 200,000 tokens
History: 64 terminal outputs, 18 obsolete file diffs, 4 unrelated features`,
    options: [
      {
        id: 's7-opt1',
        labelFa: 'وقوع Context Rot (Lost-in-the-Middle)؛ بستن تسک فعلی و اجرای قانون 1 Feature = 1 Fresh Agent Task با تکیه بر Knowledge Base',
        commandOrSpecEn: 'Close completed task -> Start Fresh Agent Task per feature',
        isOptimal: true,
        explanationFa:
          'تشخیص بی‌نقص! انباشت لاگ‌ها و دیف‌های قدیمی باعث رقیق شدن توجه مدل (Context Rot) می‌شود. شروع یک تسک تازه برای هر فیچر، کانتکست را تمیز نگه داشته و قوانین `.agent/rules/` و Knowledge Base را با حداکثر دقت اعمال می‌کند.',
        impactMetrics: '3.4x Faster Response · 99% Rule Adherence · -70% Token Cost',
      },
      {
        id: 's7-opt2',
        labelFa: 'تکرار مجدد تمام قوانین پروژه با حروف بزرگ (ALL CAPS) در انتهای همان چت طولانی',
        commandOrSpecEn: 'Paste 3,000 tokens of ALL CAPS instructions into the bloated thread',
        isOptimal: false,
        explanationFa:
          'افزودن متن بیشتر به یک پنجره کانتکست اشباع‌شده، هزینه هر نوبت را بالاتر برده و مشکل Lost-in-the-Middle را ریشه‌ای حل نمی‌کند.',
        impactMetrics: 'Escalating Token Burn · Persistent Hallucinations',
      },
      {
        id: 's7-opt3',
        labelFa: 'غیرفعال کردن کامل سرور زبان (LSP) و قوانین پروژه',
        commandOrSpecEn: 'Disable LSP and .agent/rules/ to save tokens',
        isOptimal: false,
        explanationFa:
          'غیرفعال کردن LSP و قوانین معماری باعث تولید کدهای دارای خطای سینتکس و غیراستاندارد می‌شود.',
        impactMetrics: 'High Regression Rate',
      },
    ],
  },
  {
    id: 'scen-8',
    number: 8,
    titleFa: 'پرش زنجیره‌ای بین لایه‌های ORM، اسکیمای Pydantic و روتر در Editor View',
    titleEn: 'High-Velocity Synchronous Refactoring with Supercomplete & Tab-to-Jump',
    category: 'Editor AI Engines',
    problemStatementFa:
      'شما در محیط Editor View یک ستون جدید به نام settlement_fee_bps به مدل SQLAlchemy اضافه کرده‌اید و می‌خواهید در کمتر از ۱۰ ثانیه همان فیلد را به اسکیمای Pydantic و روتر FastAPI اضافه کنید بدون اینکه با ماوس دنبال فایل‌ها بگردید. جریان کار بهینه چیست؟',
    contextCodeOrConfig: `# Just edited: src/models/settlement.py (+ settlement_fee_bps: Mapped[int])
# Next targets: src/schemas/settlement.py -> src/api/routers/settlements.py`,
    options: [
      {
        id: 's8-opt1',
        labelFa: 'فشردن کلید Tab برای فعال‌سازی زنجیره Tab-to-Jump و پذیرش پیشنهاد چندخطی Supercomplete در هر مقصد',
        commandOrSpecEn: 'Press Tab (Tab-to-Jump) -> Press Tab (Accept Supercomplete Diff)',
        isOptimal: true,
        explanationFa:
          'دقیقاً برای همین ساخته شده است! موتور Tab-to-Jump با تحلیل گراف وابستگی LSP، مکان دقیق اسکیما و روتر وابسته را پیش‌بینی کرده و Supercomplete کد متناظر را بر اساس Diff اخیر شما تولید می‌کند.',
        impactMetrics: '< 6 Seconds End-to-End · Zero Context Switching',
      },
      {
        id: 's8-opt2',
        labelFa: 'ایجاد یک تسک سنگین Planning Mode در Agent Manager برای اضافه کردن یک فیلد ساده',
        commandOrSpecEn: 'Spawn full Planning Mode task with 3 artifacts for a 2-line edit',
        isOptimal: false,
        explanationFa:
          'برای تغییرات کوچک و خطی که خودتان روی خط کد حضور دارید، استفاده از Planning Mode سربار زمانی غیرضروری ایجاد می‌کند.',
        impactMetrics: 'Unnecessary Planning Latency',
      },
      {
        id: 's8-opt3',
        labelFa: 'جستجوی دستی نام فیلدهای قبلی با grep در ترمینال',
        commandOrSpecEn: 'Manual grep + manual copy-paste across files',
        isOptimal: false,
        explanationFa:
          'جستجوی دستی و کپی‌پیست سنتی کند است و از هوشمندی گراف LSP و تاریخچه Diff در Editor View بهره نمی‌برد.',
        impactMetrics: 'Slow Manual Workflow',
      },
    ],
  },
];
