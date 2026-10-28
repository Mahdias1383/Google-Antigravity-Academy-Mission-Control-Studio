import { CurriculumModule } from '../types/curriculum';

export const MODULES_PART_2: CurriculumModule[] = [
  {
    id: 'module-5',
    number: 5,
    titleFa: 'استانداردسازی عملیات با ورک‌فلوها و دستورات اسلش',
    titleEn: 'Workflows, Slash Commands & Turbo Pipelines',
    readingTime: '22 min read',
    difficulty: 'DevOps & Automation',
    summaryFa:
      'تبدیل رویه‌های عملیاتی تکرارپذیر تیم (SOPs) به دستورات اسلش خودکار در مسیر .agent/workflows/*.md با کنترل دقیق اجرای بدون توقف از طریق دایرکتیوهای // turbo و // turbo-all.',
    keyTakeaways: [
      {
        titleFa: 'تفاوت معماری Rule و Workflow',
        metricOrBadge: 'Declarative vs. Procedural',
        descFa: 'قوانین (Rules) نحوه نوشتن کد را دیکته می‌کنند؛ ورک‌فلوها (Workflows) گام‌های ترتیبی اجرای یک عملیات را تعریف می‌کنند.',
      },
      {
        titleFa: 'ثبت خودکار دستورات اسلش',
        metricOrBadge: '.agent/workflows/<cmd>.md',
        descFa: 'هر فایل Markdown در این پوشه بلافاصله به عنوان یک دستور /slash-command در پنجره ایجنت قابل فراخوانی می‌شود.',
      },
      {
        titleFa: 'دایرکتیو تک‌گام // turbo',
        metricOrBadge: 'Step-Level Auto-Run',
        descFa: 'قرار دادن // turbo بالای یک گام خاص باعث اجرای خودکار دستور ترمینال فقط در همان گام می‌شود.',
      },
      {
        titleFa: 'دایرکتیو پایپ‌لاین کامل // turbo-all',
        metricOrBadge: 'Full Autonomous SOP',
        descFa: 'اجرای سرتاسری و بدون توقف تمام گام‌های ورک‌فلو از ابتدا تا انتها بدون درخواست تایید دستی.',
      },
    ],
    interactiveWidgetType: 'workflow-pipeline',
    subSections: [
      {
        id: 'm5-s1',
        titleFa: '۵.۱ تضاد معماری: Rules (گاردریل‌های اعلانی) در برابر Workflows (رویه‌های اجرایی)',
        titleEn: 'Architectural Contrast: Declarative Rules vs. Procedural Workflows',
        contentFa: [
          'برای طراحی یک سیستم Agent-First تمیز، باید مرز دقیقی بین `.agent/rules/` و `.agent/workflows/` قائل شوید. قوانین (Rules) ماهیت اعلانی (Declarative) دارند و قیدوبندهای ثابتی را تعریف می‌کنند (مثلاً: «همیشه از SQLAlchemy 2.0 استفاده کن»). در مقابل، ورک‌فلوها (Workflows) ماهیت رویه‌ای و گام‌به‌گام (Procedural State Machine) دارند و یک پایپ‌لاین عملیاتی استاندارد (SOP) را از گام اول تا گام آخر هدایت می‌کنند.',
          'هنگامی که فایلی با نام `.agent/workflows/safe-migration.md` ایجاد می‌کنید، Google Antigravity به صورت خودکار دستور `/safe-migration` را ثبت می‌کند. با تایپ این دستور، ایجنت دقیقاً طبق گام‌های شماره‌گذاری‌شده حرکت می‌کند. اگر بالای یک بلوک دستور عبارت `// turbo` قرار گیرد، ایجنت آن دستور خاص را بدون توقف اجرا می‌کند و اگر در ابتدای فایل عبارت `// turbo-all` درج شود، کل زنجیره ورک‌فلو به صورت کاملاً خودکار اجرا خواهد شد.',
        ],
        comparisonTable: {
          headers: ['ویژگی مقایسه', 'Rules (.agent/rules/*.md)', 'Workflows (.agent/workflows/*.md)', 'الگوی ترکیب بهینه'],
          rows: [
            {
              criterion: 'ماهیت مهندسی',
              optionA: 'Declarative Guardrails (چگونه کد بنویسیم)',
              optionB: 'Procedural SOPs (چه مراحلی را به ترتیب اجرا کنیم)',
              architectVerdict: 'ورک‌فلو مراحل را اجرا می‌کند و در حین نوشتن کد، قوانین فعال را رعایت می‌نماید',
            },
            {
              criterion: 'نحوه فراخوانی',
              optionA: 'خودکار (Always On / Glob / Model Decision) یا @rule',
              optionB: 'فراخوانی صریح با دستور اسلش مانند /safe-migration',
              architectVerdict: 'استفاده از /slash-command برای عملیات استاندارد روزانه تیم',
            },
            {
              criterion: 'کنترل اتوماسیون ترمینال',
              optionA: 'تبعیت از سیاست کلی ترمینال (Off/Auto/Turbo)',
              optionB: 'قابلیت ارتقای موضعی با // turbo و // turbo-all',
              architectVerdict: 'استفاده از // turbo برای گام‌های خواندنی و تست، و توقف روی گام‌های حساس',
            },
          ],
        },
      },
      {
        id: 'm5-s2',
        titleFa: '۵.۲ سه فایل ورک‌فلو کامل و عملیاتی (Production-Grade Workflows)',
        titleEn: '3 Complete Copyable Workflow Files (/safe-migration, /pr-security-audit, /incident-triage)',
        contentFa: [
          'در ادامه، کد کامل سه ورک‌فلو حیاتی برای تیم‌های مهندسی نرم‌افزار آورده شده است که فرآیندهای مایگریشن دیتابیس، ممیزی امنیتی Pull Request و تریاژ رخدادهای عملیاتی را به صورت استاندارد خودکارسازی می‌کنند.',
        ],
        codeExamples: [
          {
            id: 'm5-wf-1',
            title: 'ورک‌فلو ۱: مایگریشن ایمن و تست برگشت‌پذیری (/safe-migration)',
            filename: '.agent/workflows/safe-migration.md',
            language: 'markdown',
            description: 'بررسی هدهای Alembic، تولید مایگریشن، ممیزی عملیات مخرب، و تست کامل چرخه upgrade -> downgrade -> upgrade.',
            code: `---
description: "Generate, audit, and verify reversible Alembic database migrations safely"
---

# Workflow: /safe-migration

## Step 1: Verify Single Alembic Head
Check that the migration graph has no branched heads before generating a new revision.
// turbo
\`\`\`bash
poetry run alembic heads
poetry run alembic current
\`\`\`

## Step 2: Autogenerate Revision Against SQLAlchemy 2.0 Metadata
Generate a descriptive revision file based on recent model changes in \`src/models/\`.
\`\`\`bash
poetry run alembic revision --autogenerate -m "schema_update"
\`\`\`

## Step 3: Static Audit of upgrade() and downgrade()
Inspect the newly generated file in \`alembic/versions/\`:
1. Ensure \`downgrade()\` is fully implemented and reverses every operation in \`upgrade()\`.
2. If \`op.drop_table()\` or \`op.drop_column()\` is present, halt and flag under \`User Review Required\`.
3. Ensure index creation on large tables uses \`postgresql_concurrently=True\`.

## Step 4: Execute Reversibility Cycle (Upgrade -> Downgrade -> Upgrade)
Verify that both directions apply cleanly against the local test database.
// turbo
\`\`\`bash
poetry run alembic upgrade head
poetry run alembic downgrade -1
poetry run alembic upgrade head
\`\`\`

## Step 5: Run Async Integration Test Suite
Execute the database integration tests to confirm ORM mappings match the migrated schema.
// turbo
\`\`\`bash
poetry run pytest tests/integration/ -v
\`\`\``,
          },
          {
            id: 'm5-wf-2',
            title: 'ورک‌فلو ۲: ممیزی امنیتی و کیفیت پیش از ادغام (/pr-security-audit)',
            filename: '.agent/workflows/pr-security-audit.md',
            language: 'markdown',
            description: 'اجرای خودکار تمام بررسی‌های امنیتی، لینتر و اعتبارسنجی اسکیماهای Pydantic با استفاده از // turbo-all.',
            code: `---
description: "Automated pre-PR security scan, AST lint audit, and Pydantic contract verification"
---

// turbo-all

# Workflow: /pr-security-audit

## Step 1: Inspect Staged & Branch Diff
Analyze all modified files against \`main\` to identify touched routers, models, and dependencies.
\`\`\`bash
git diff main...HEAD --stat
git diff main...HEAD
\`\`\`

## Step 2: Run Static Security & Type Analyzers
Run Ruff security rules (\`S\` bandit ruleset) and strict Mypy type verification.
\`\`\`bash
poetry run ruff check src/ tests/ --select E,F,I,S,B
poetry run mypy src/
\`\`\`

## Step 3: Audit FastAPI Route Contracts & Secret Exposure
Verify across all modified files:
1. Every Pydantic input schema enforces \`extra="forbid"\`.
2. Every protected endpoint injects authentication dependencies.
3. Zero hardcoded secrets, tokens, or raw SQL string interpolations exist.

## Step 4: Execute Security & Boundary Test Suite
Run automated test cases targeting \`401\`, \`403\`, and \`422\` boundary conditions.
\`\`\`bash
poetry run pytest tests/security/ -v
\`\`\``,
          },
          {
            id: 'm5-wf-3',
            title: 'ورک‌فلو ۳: تریاژ رخداد و رفع باگ مبتنی بر تله‌متری (/incident-triage)',
            filename: '.agent/workflows/incident-triage.md',
            language: 'markdown',
            description: 'واکشی لاگ‌های خطا از سرور MCP، نوشتن تست بازتولید باگ (Reproduction Test)، اعمال پچ و تولید گزارش walkthrough.md.',
            code: `---
description: "End-to-end production incident triage via MCP telemetry, reproduction test, and verified patch"
---

# Workflow: /incident-triage

## Step 1: Query Error Logs via OpenSearch MCP Tool
Invoke the \`@mcp:enterprise-telemetry-fastmcp\` tool \`fetch_opensearch_error_logs\` for the target service over the last 30 minutes to extract stack traces and correlation IDs.

## Step 2: Write Failing Reproduction Test First (TDD)
Create a dedicated test case in \`tests/regressions/\` that reproduces the exact payload and exception observed in the MCP telemetry log.
// turbo
\`\`\`bash
poetry run pytest tests/regressions/ -k "reproduce_incident" -v
\`\`\`

## Step 3: Patch Root Cause in Service Layer
Apply the minimal, surgical fix in \`src/\` following \`.agent/rules/01-fastapi-sqlalchemy-async.md\`.

## Step 4: Verify Full Test Suite & Compile Walkthrough
Confirm the reproduction test now passes along with the entire regression suite, then generate \`walkthrough.md\`.
// turbo
\`\`\`bash
poetry run pytest -v
\`\`\``,
          },
        ],
      },
    ],
  },
  {
    id: 'module-6',
    number: 6,
    titleFa: 'ساب‌ایجنت مرورگر و تله‌متری بصری (Browser Subagent)',
    titleEn: 'Browser Subagent & Visual E2E Verification',
    readingTime: '20 min read',
    difficulty: 'Full-Stack Verification',
    summaryFa:
      'چگونه ایجنت اصلی وظیفه صحت‌سنجی بصری UI/UX و قراردادهای شبکه API را به ساب‌ایجنت مرورگر مجهز به کرومیوم ایزوله واگذار کرده و خطاهای کنسول و 422/500 را به صورت خودکار وصله می‌کند.',
    keyTakeaways: [
      {
        titleFa: 'کرومیوم ابزارگذاری‌شده و ایزوله',
        metricOrBadge: 'Instrumented Chromium Profile',
        descFa: 'اجرای مرورگر واقعی در یک پروفایل کاملاً مجزا بدون تداخل با کوکی‌ها یا نشست‌های شخصی توسعه‌دهنده.',
      },
      {
        titleFa: '۳ جریان تله‌متری هم‌زمان',
        metricOrBadge: 'DOM + Console + Network',
        descFa: 'شنود هم‌زمان درخت دسترس‌پذیری DOM، استریم خطاهای جاوااسکریپت کنسول و پेलودهای HTTP 4xx/5xx.',
      },
      {
        titleFa: 'حلقه خودترمیمی بک‌اند و فرانت‌اند',
        metricOrBadge: 'Auto-Patching 422/500 Loops',
        descFa: 'تشخیص عدم تطابق اسکیمای JSON بین فرانت‌اند و FastAPI از طریق تله‌متری شبکه و اصلاح خودکار کد.',
      },
      {
        titleFa: 'ضبط خودکار مدرک WebP',
        metricOrBadge: 'Embedded Walkthrough Video',
        descFa: 'ضبط ویدیوی WebP و اسکرین‌شات از جریان تعامل با صفحه و الصاق مستقیم آن به فایل walkthrough.md.',
      },
    ],
    interactiveWidgetType: 'browser-telemetry',
    subSections: [
      {
        id: 'm6-s1',
        titleFa: '۶.۱ معماری ساب‌ایجنت مرورگر و سه استریم تله‌متری',
        titleEn: 'Architecture of the Browser Subagent & The 3 Telemetry Streams',
        contentFa: [
          'پاس شدن تست‌های واحد (Unit Tests) در ترمینال به تنهایی تضمین نمی‌کند که اپلیکیشن در مرورگر واقعی بدون خطا رندر شود. ممکن است یک تغییر در نام فیلد اسکیمای Pydantic در بک‌اند باعث خطای `422 Unprocessable Entity` در هنگام ارسال فرم فرانت‌اند شود، یا یک خطای Hydration در جاوااسکریپت صفحه را سفید کند.',
          'در Google Antigravity، ایجنت اصلی (Main Orchestrator Agent) پس از بالا آوردن سرور توسعه، یک زیرتسک تخصصی به **Browser Subagent** واگذار می‌کند. این ساب‌ایجنت یک نمونه Chromium ابزارگذاری‌شده را باز کرده، روی دکمه‌ها کلیک می‌کند، فرم‌ها را پر می‌کند، ابعاد صفحه (Responsive Viewports) را تغییر می‌دهد و سه جریان تله‌متری زیر را به ایجنت اصلی مخابره می‌کند:',
        ],
        bulletPoints: [
          {
            termEn: '1. DOM & Accessibility Tree Stream',
            descFa: 'بررسی ساختار معنایی عناصر، استایل‌های محاسبه‌شده (Computed Styles)، صحت چیدمان RTL/LTR و نبود هم‌پوشانی بصری.',
          },
          {
            termEn: '2. Console Log & Runtime Exception Stream',
            descFa: 'رهگیری آنی خطاهای Uncaught TypeError، هشدارهای React Hydration و قطعی‌های غیرمنتظره WebSocket.',
          },
          {
            termEn: '3. Network Payload & Status Interceptor',
            descFa: 'شنود کامل درخواست‌ها و پاسخ‌های XHR/Fetch، استخراج بدنه JSON خطاهای 400/422/500 و ارسال آن به ایجنت اصلی جهت اصلاح خودکار روتر FastAPI.',
          },
        ],
      },
      {
        id: 'm6-s2',
        titleFa: '۶.۲ مطالعه موردی E2E: دیباگ خودکار داشبورد گزارش‌دهی مالی WebSocket',
        titleEn: 'Complete E2E Case Study: Real-Time Financial Reporting Dashboard',
        contentFa: [
          'در این سناریوی واقعی، ایجنت پس از پیاده‌سازی اندپوینت فیلتر گزارش‌های مالی و استریم WebSocket، ساب‌ایجنت مرورگر را مامور تست صفحه می‌کند. ساب‌ایجنت پس از انتخاب فیلتر وضعیت پرداخت (`SETTLED`)، یک خطای شبکه `422 Unprocessable Entity` روی پارامتر صفحه‌بندی رهگیری کرده، بدنه خطا را می‌خواند و ایجنت اصلی بدون دخالت انسان، اسکیمای Query را اصلاح و مجدداً تست می‌کند.',
        ],
        codeExamples: [
          {
            id: 'm6-code-1',
            title: 'لاگ تله‌متری شکارشده توسط Browser Subagent و پچ خودکار FastAPI',
            filename: 'src/api/routers/financial_reports.py',
            language: 'python',
            description: 'اصلاح خودکار عدم تطابق نام پارامترهای Query و محاسبه دقیق خلاصه صفحه‌بندی پس از رهگیری خطای 422 توسط Browser Subagent.',
            code: `from typing import Annotated, Literal
from decimal import Decimal
from fastapi import APIRouter, Depends, Query, WebSocket, WebSocketDisconnect
from pydantic import BaseModel, ConfigDict
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from src.models.settlement import SettlementLedger
from src.core.database import get_async_session

router = APIRouter(prefix="/v1/reports", tags=["Financial Reports"])


class PaginationSummaryResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    page: int
    page_size: int
    total_records: int
    total_volume_minor: Decimal
    status_filter: str


@router.get("/summary", response_model=PaginationSummaryResponse)
async def get_settlement_summary(
    session: Annotated[AsyncSession, Depends(get_async_session)],
    # [Auto-Patched after Browser Subagent caught 422 on ?statusFilter=SETTLED]
    status_filter: Annotated[
        Literal["ALL", "PENDING", "SETTLED", "FAILED"],
        Query(alias="statusFilter"),
    ] = "ALL",
    page: Annotated[int, Query(ge=1)] = 1,
    page_size: Annotated[int, Query(alias="pageSize", ge=1, le=200)] = 25,
) -> PaginationSummaryResponse:
    stmt = select(
        func.count(SettlementLedger.id),
        func.coalesce(func.sum(SettlementLedger.amount_minor), Decimal("0")),
    )
    if status_filter != "ALL":
        stmt = stmt.where(SettlementLedger.status == status_filter)

    result = await session.execute(stmt)
    total_records, total_volume = result.one()

    return PaginationSummaryResponse(
        page=page,
        page_size=page_size,
        total_records=int(total_records or 0),
        total_volume_minor=Decimal(total_volume),
        status_filter=status_filter,
    )`,
          },
        ],
      },
    ],
  },
  {
    id: 'module-7',
    number: 7,
    titleFa: 'یکپارچه‌سازی پروتکل MCP در مقیاس Enterprise',
    titleEn: 'Model Context Protocol (MCP) & Custom FastMCP Servers',
    readingTime: '26 min read',
    difficulty: 'Enterprise Systems',
    summaryFa:
      'اتصال امن ایجنت‌های Google Antigravity به دیتابیس‌های سازمانی، خوشه‌های لاگ OpenSearch و سیستم‌های پیام‌رسان با پیکربندی mcp_config.json و توسعه سرورهای اختصاصی پایتون با FastMCP.',
    keyTakeaways: [
      {
        titleFa: 'معماری کلاینت MCP در Antigravity',
        metricOrBadge: 'Tools · Resources · Prompts',
        descFa: 'پشتیبانی بومی از استاندارد Model Context Protocol از طریق دو لایه انتقال stdio (محلی) و sse (راه دور).',
      },
      {
        titleFa: 'پیکربندی یکپارچه mcp_config.json',
        metricOrBadge: 'Postgres + GitHub + Custom',
        descFa: 'تعریف متمرکز سرورهای MCP به همراه متغیرهای محیطی ایزوله و تایم‌اوت‌های شبکه.',
      },
      {
        titleFa: 'توسعه سریع با FastMCP پایتون',
        metricOrBadge: '@mcp.tool() · @mcp.resource()',
        descFa: 'ساخت سرورهای MCP سفارشی با تایپ‌هینت‌های پایتون و کلاینت ناهمگام httpx.AsyncClient.',
      },
      {
        titleFa: 'امنیت و اصل حداقل دسترسی',
        metricOrBadge: 'Read-Only Credentials',
        descFa: 'الزام به استفاده از یوزرهای دیتابیس Read-Only و توکن‌های محدودشده در فایل کانفیگ MCP.',
      },
    ],
    interactiveWidgetType: 'mcp-topology',
    subSections: [
      {
        id: 'm7-s1',
        titleFa: '۷.۱ معماری MCP در Antigravity: لایه‌های انتقال stdio و sse',
        titleEn: 'MCP Client Architecture: Tools, Resources, Prompts & Transports',
        contentFa: [
          'پروتکل Model Context Protocol (MCP) به ایجنت‌های Antigravity اجازه می‌دهد بدون نیاز به کپی‌پیست کردن دستی لاگ‌ها یا اسکیمای دیتابیس توسط کاربر، مستقیماً با زیرساخت‌های داخلی سازمان تعامل داشته باشند. کلاینت MCP داخلی Antigravity از سه جزء اصلی پشتیبانی می‌کند: **Tools** (توابع قابل فراخوانی توسط مدل)، **Resources** (داده‌ها و اسکیماهای خواندنی شبیه به فایل) و **Prompts** (الگوهای آماده تعامل).',
          'ارتباط بین Antigravity و سرورهای MCP از دو طریق برقرار می‌شود: روش `stdio` که در آن Antigravity فرآیند سرور MCP (مانند اسکریپت Python یا پکیج Node) را به صورت زیرفرآیند محلی اجرا و از طریق ورودی/خروجی استاندارد با آن صحبت می‌کند، و روش `sse` (Server-Sent Events) که برای اتصال به سرورهای MCP مستقر در شبکه داخلی سازمان از طریق HTTP استفاده می‌شود.',
        ],
        codeExamples: [
          {
            id: 'm7-code-json',
            title: 'فایل پیکربندی کامل و آماده کپی mcp_config.json',
            filename: '~/.gemini/antigravity/mcp_config.json',
            language: 'json',
            description: 'اتصال هم‌زمان به دیتابیس PostgreSQL (Read-Only)، مخزن GitHub سازمانی و سرور تله‌متری اختصاصی پایتون.',
            code: `{
  "mcpServers": {
    "postgres-analytics-ro": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-postgres",
        "postgresql://antigravity_ro:readonly_pass@10.24.0.15:5432/core_ledger"
      ],
      "env": {
        "PGCONNECT_TIMEOUT": "10",
        "PGOPTIONS": "-c default_transaction_read_only=on"
      }
    },
    "github-enterprise": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-github"
      ],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "\${GITHUB_ENTERPRISE_PAT}"
      }
    },
    "enterprise-telemetry-fastmcp": {
      "command": "poetry",
      "args": [
        "run",
        "python",
        "/opt/mcp_servers/telemetry_and_alert_mcp.py"
      ],
      "env": {
        "OPENSEARCH_URL": "https://opensearch.internal.corp:9200",
        "OPENSEARCH_API_KEY": "\${OPENSEARCH_READ_API_KEY}",
        "ROCKETCHAT_WEBHOOK_URL": "https://chat.internal.corp/hooks/ag-deployments"
      }
    }
  }
}`,
          },
          {
            id: 'm7-code-py',
            title: 'پیاده‌سازی کامل سرور پایتون با FastMCP (telemetry_and_alert_mcp.py)',
            filename: 'mcp_servers/telemetry_and_alert_mcp.py',
            language: 'python',
            description: 'اسکریپت کامل و Production-Ready پایتون با استفاده از FastMCP و httpx.AsyncClient برای جستجوی لاگ‌های OpenSearch و ارسال گزارش استقرار به Rocket.Chat.',
            code: `from typing import Any
import os
import httpx
from mcp.server.fastmcp import FastMCP

# Initialize custom Enterprise FastMCP server
mcp = FastMCP("Enterprise-Telemetry-And-Alerting")

OPENSEARCH_URL = os.getenv("OPENSEARCH_URL", "https://opensearch.internal.corp:9200")
OPENSEARCH_API_KEY = os.getenv("OPENSEARCH_API_KEY", "")
ROCKETCHAT_WEBHOOK_URL = os.getenv("ROCKETCHAT_WEBHOOK_URL", "")


@mcp.tool()
async def fetch_opensearch_error_logs(
    service_name: str,
    minutes_back: int = 30,
    min_status_code: int = 500,
) -> dict[str, Any]:
    """
    Query OpenSearch cluster for recent HTTP 5xx exceptions and stack traces
    for a specific microservice so Antigravity can diagnose root causes.
    """
    dsl_query = {
        "size": 20,
        "sort": [{"@timestamp": {"order": "desc"}}],
        "query": {
            "bool": {
                "must": [
                    {"match": {"service.name": service_name}},
                    {"range": {"http.response.status_code": {"gte": min_status_code}}},
                    {"range": {"@timestamp": {"gte": f"now-{minutes_back}m", "lte": "now"}}},
                ]
            }
        },
    }
    headers = {
        "Authorization": f"ApiKey {OPENSEARCH_API_KEY}",
        "Content-Type": "application/json",
    }
    async with httpx.AsyncClient(timeout=httpx.Timeout(10.0, connect=3.0)) as client:
        response = await client.post(
            f"{OPENSEARCH_URL}/microservices-logs-*/_search",
            json=dsl_query,
            headers=headers,
        )
        response.raise_for_status()
        raw_hits = response.json().get("hits", {}).get("hits", [])
        return {
            "service_name": service_name,
            "window_minutes": minutes_back,
            "error_count": len(raw_hits),
            "logs": [hit.get("_source", {}) for hit in raw_hits],
        }


@mcp.tool()
async def send_rocketchat_deployment_report(
    channel: str,
    branch_name: str,
    passed_tests: int,
    summary_markdown: str,
) -> dict[str, str]:
    """
    Send a verified walkthrough summary and test report to a Rocket.Chat channel.
    """
    payload = {
        "channel": channel,
        "username": "Antigravity-Mission-Control",
        "text": (
            f"### ✅ Antigravity Verified Delivery: \`{branch_name}\`\\n"
            f"- **Pytest Suite:** \`{passed_tests} passed\`\\n"
            f"- **Walkthrough Summary:** {summary_markdown}"
        ),
    }
    async with httpx.AsyncClient(timeout=8.0) as client:
        response = await client.post(ROCKETCHAT_WEBHOOK_URL, json=payload)
        response.raise_for_status()
        return {"status": "sent", "channel": channel, "branch": branch_name}


@mcp.resource("telemetry://slo/production-targets")
def get_production_slo_targets() -> dict[str, Any]:
    """Expose architectural SLO budgets as a read-only MCP resource."""
    return {
        "max_p99_latency_ms": 150,
        "error_budget_percent": 0.05,
        "mandatory_idempotency_headers": ["X-Idempotency-Key", "X-Correlation-ID"],
    }


if __name__ == "__main__":
    mcp.run(transport="stdio")`,
          },
        ],
      },
    ],
  },
  {
    id: 'module-8',
    number: 8,
    titleFa: 'ارکستریشن چندایجنتی، مدیریت دانش و بهینه‌سازی ROI',
    titleEn: 'Multi-Agent Orchestration, Git Worktrees & Knowledge Base',
    readingTime: '24 min read',
    difficulty: 'Principal Architect',
    summaryFa:
      'اجرای موازی ۳+ ایجنت بدون تداخل فایل و دیتابیس با Git Worktrees، مدیریت صندوق ورودی (Inbox Triage)، پایگاه دانش پایدار و ریشه‌کنی پدیده Context Rot.',
    keyTakeaways: [
      {
        titleFa: 'ایزولاسیون فیزیکی با Git Worktrees',
        metricOrBadge: 'Zero Lock Contention',
        descFa: 'اختصاص یک دایرکتوری کاری و برنچ مستقل به هر ایجنت موازی برای جلوگیری از تداخل فایل‌ها و دیتابیس تست.',
      },
      {
        titleFa: 'الگوی تریاژ صندوق ورودی (Inbox)',
        metricOrBadge: 'Async Architect Supervision',
        descFa: 'نظارت متمرکز بر اعلان‌های توقف ایجنت‌ها (درخواست مرور آرتیفکت یا تایید دستور ترمینال) در Mission Control.',
      },
      {
        titleFa: 'ریشه‌کنی Context Rot',
        metricOrBadge: '1 Feature = 1 Fresh Agent',
        descFa: 'جلوگیری از افت دقت Lost-in-the-Middle با بستن تسک‌های تمام‌شده و تکیه بر پایگاه دانش پایدار.',
      },
      {
        titleFa: 'ماتریس جامع عیب‌یابی',
        metricOrBadge: 'Anti-Pattern Resolution',
        descFa: 'مرجع سریع شناسایی و رفع خطاهای رایج در پیکربندی قوانین، ترمینال، MCP و هم‌زمانی ایجنت‌ها.',
      },
    ],
    interactiveWidgetType: 'worktree-troubleshooter',
    subSections: [
      {
        id: 'm8-s1',
        titleFa: '۸.۱ اجرای موازی ایجنت‌ها با Git Worktrees و الگوی Inbox Triage',
        titleEn: 'Parallel Execution via Git Worktrees & Agent Manager Inbox Triage',
        contentFa: [
          'اگر تلاش کنید در Agent Manager هم‌زمان ۳ ایجنت را روی یک دایرکتوری کاری واحد (Single Working Tree) اجرا کنید، به سرعت با فاجعه مواجه می‌شوید: ایجنت اول فایل مدل را تغییر می‌دهد در حالی که ایجنت دوم در حال اجرای `pytest` است، فایل‌های `.venv` یا کش قفل می‌شوند و مایگریشن‌های دیتابیس با یکدیگر تصادم (Race Condition) پیدا می‌کنند.',
          'راهکار مهندسی استاندارد، استفاده از قابلیت بومی **Git Worktrees** است. با دستور `git worktree add` شما می‌توانید از یک مخزن گیت واحد، چندین پوشه فیزیکی کاملاً مجزا روی دیسک (هر کدام روی یک برنچ مستقل) بسازید و هر ایجنت را در فضای کاری ایزوله خودش مامور یک فیچر کنید. سپس از طریق پنل **Inbox** در Agent Manager، تنها زمانی که ایجنتی به مرحله `Request Review` روی `implementation_plan.md` یا تحویل `walkthrough.md` رسید، آن را بررسی و تایید می‌کنید.',
        ],
        codeExamples: [
          {
            id: 'm8-code-worktree',
            title: 'اسکریپت راه‌اندازی ۳ محیط ایزوله Git Worktree برای ۳ ایجنت موازی',
            filename: 'scripts/spawn_parallel_worktrees.sh',
            language: 'bash',
            description: 'ایجاد ۳ دایرکتوری کاری ایزوله با دیتابیس تست مجزا برای اجرای هم‌زمان ۳ ایجنت در Google Antigravity.',
            code: `#!/usr/bin/env bash
set -euo pipefail

# Base repository root: /workspace/core-banking-api
mkdir -p ../ag-worktrees

# 1. Spawn Worktree A: Idempotent Settlement Engine
git worktree add -b feat/settlement-idempotency ../ag-worktrees/wt-settlement main
cp .env.test ../ag-worktrees/wt-settlement/.env.test
sed -i 's/test_db/test_db_wt_settlement/g' ../ag-worktrees/wt-settlement/.env.test

# 2. Spawn Worktree B: OpenSearch Audit Log Exporter
git worktree add -b feat/opensearch-exporter ../ag-worktrees/wt-audit main
cp .env.test ../ag-worktrees/wt-audit/.env.test
sed -i 's/test_db/test_db_wt_audit/g' ../ag-worktrees/wt-audit/.env.test

# 3. Spawn Worktree C: N+1 Query Optimization in Reporting Router
git worktree add -b perf/reporting-selectinload ../ag-worktrees/wt-reporting main
cp .env.test ../ag-worktrees/wt-reporting/.env.test
sed -i 's/test_db/test_db_wt_reporting/g' ../ag-worktrees/wt-reporting/.env.test

# List active worktrees
git worktree list`,
          },
        ],
      },
      {
        id: 'm8-s2',
        titleFa: '۸.۲ پایگاه دانش پایدار (Knowledge Base) و جلوگیری از پوسیدگی کانتکست (Context Rot)',
        titleEn: 'Persistent Knowledge Base & Eliminating Context Rot (Lost-in-the-Middle)',
        contentFa: [
          'پدیده **Context Rot** (پوسیدگی کانتکست) زمانی رخ می‌دهد که یک مهندس از یک ترد چت واحد برای انجام ۵ تسک غیرمرتبط پشت سر هم استفاده می‌کند. با عبور حجم تاریخچه مکالمه از ۱۰۰ هزار توکن، مدل دچار پدیده علمی *Lost-in-the-Middle* شده، دستورالعمل‌های اولیه را فراموش می‌کند، مصرف توکن هر نوبت به شدت افزایش می‌یابد و سرعت پاسخ‌دهی افت می‌کند.',
          'قانون آهنین در Google Antigravity عبارت است از: **1 Feature = 1 Fresh Agent Task**. به محض اینکه ایجنت آرتیفکت `walkthrough.md` یک فیچر را تحویل داد و کد کامیت شد، آن تسک را ببندید و برای فیچر بعدی یک تسک کاملاً جدید باز کنید. اطلاعات و الگوهای معماری مهم پروژه به جای ماندن در چت‌های قدیمی، در **Knowledge Base** پایدار و فایل‌های `.agent/rules/` ذخیره می‌شوند و در تسک‌های جدید بدون سربار اضافی در دسترس ایجنت قرار می‌گیرند.',
        ],
        comparisonTable: {
          headers: ['ضدالگو / خطا (Anti-Pattern)', 'علت ریشه‌ای (Root Cause)', 'علائم مشاهده‌شده در پروژه', 'راهکار دقیق مهندسی (Exact Solution)'],
          rows: [
            {
              criterion: 'ادامه دادن یک چت برای چند فیچر مختلف',
              optionA: 'انباشت خروجی‌های قدیمی ترمینال و دیف‌های منقضی در کانتکست',
              optionB: 'افزایش شدید Latency، فراموشی قوانین و توهم در نام متغیرها',
              architectVerdict: 'اعمال قانون 1 Feature = 1 Fresh Agent Task و ذخیره تصمیمات پایدار در .agent/rules/',
            },
            {
              criterion: 'اجرای هم‌زمان ۲ ایجنت روی یک پوشه واحد',
              optionA: 'بازنویسی هم‌زمان فایل‌ها و تصادم تراکنش‌های دیتابیس تست',
              optionB: 'شکست تصادفی تست‌های Pytest و خراب شدن Git Index',
              architectVerdict: 'ایزولاسیون کامل هر ایجنت در یک git worktree مستقل با دیتابیس تست مجزا',
            },
            {
              criterion: 'تنظیم تمام فایل‌های .agent/rules روی Always On',
              optionA: 'تزریق هزاران توکن غیرمرتبط در هر نوبت درخواست',
              optionB: 'کند شدن پاسخ‌دهی و کاهش تمرکز مدل روی دستور اصلی',
              architectVerdict: 'تبدیل قوانین تخصصی به حالت Glob (مانند tests/**/*.py) یا Model Decision',
            },
            {
              criterion: 'اجرای دستورات تغییر اسکیما در Fast Mode',
              optionA: 'حذف مرحله طراحی implementation_plan.md و ممیزی انسانی',
              optionB: 'ایجاد مایگریشن‌های غیرقابل برگشت یا قفل شدن جداول دیتابیس',
              architectVerdict: 'الزام به Planning Mode + ورک‌فلو /safe-migration برای هرگونه تغییر مدل',
            },
          ],
        },
      },
    ],
  },
];

export const ALL_MODULES: CurriculumModule[] = [];
