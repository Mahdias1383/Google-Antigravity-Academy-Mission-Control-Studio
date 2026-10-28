import { CurriculumModule } from '../types/curriculum';

export const MODULES_PART_1: CurriculumModule[] = [
  {
    id: 'module-1',
    number: 1,
    titleFa: 'معماری هسته و فلسفه Agent-First',
    titleEn: 'Core Architecture: Editor View vs. Agent Manager',
    readingTime: '18 min read',
    difficulty: 'Principal Foundation',
    summaryFa:
      'گذار بنیادین از کدنویسی خط‌به‌خط سنکرون (Synchronous Copilot Era) به ارکستریشن ناهمگام چندایجنتی (Asynchronous Agent-First Engineering) در محیط دوگانه Google Antigravity.',
    keyTakeaways: [
      {
        titleFa: 'تفکیک محیط کاربری دوگانه',
        metricOrBadge: 'Editor View + Mission Control',
        descFa: 'جدا کردن محیط ویرایش جراحی کد (Synchronous) از مرکز فرماندهی ایجنت‌های موازی پس‌زمینه (Asynchronous).',
      },
      {
        titleFa: 'موتور پیش‌بینی Supercomplete',
        metricOrBadge: 'LSP + Diff-History Aware',
        descFa: 'پیش‌بینی تغییرات چندخطی و چندفایلی بر اساس گراف وابستگی LSP و تاریخچه Diffهای اخیر.',
      },
      {
        titleFa: 'جهش هوشمند کرسر Tab-to-Jump',
        metricOrBadge: 'Zero-Friction AST Navigation',
        descFa: 'انتقال خودکار کرسر بین لایه‌های مدل دیتابیس، اسکیمای Pydantic و روتر FastAPI تنها با فشردن کلید Tab.',
      },
      {
        titleFa: 'تزریق کانتکست ساختاریافته',
        metricOrBadge: '@file · @rule · @mcp',
        descFa: 'کاهش نویز کانتکست با اشاره دقیق به فایل‌ها، قوانین معماری، سرورهای MCP و خروجی زنده ترمینال.',
      },
    ],
    interactiveWidgetType: 'editor-vs-manager',
    subSections: [
      {
        id: 'm1-s1',
        titleFa: '۱.۱ پارادایم شیفت: از دستیارهای خط‌به‌خط تا ارکستریشن Agent-First',
        titleEn: 'Synchronous Copilot Era vs. Asynchronous Agent-First Engineering',
        contentFa: [
          'در نسل اول ابزارهای هوش مصنوعی، توسعه‌دهنده در یک حلقه سنکرون (Synchronous Loop) قفل می‌شد: شما یک خط کد می‌نوشتید، چند ثانیه منتظر پیشنهاد Autocomplete می‌ماندید یا در یک پنل چت جانبی سوالی می‌پرسیدید و سپس کد تولیدشده را به صورت دستی کپی و دیباگ می‌کردید. این الگو برای وظایف خرد مناسب بود اما در معماری‌های سازمانی مقیاس‌پذیر نبود زیرا توسعه‌دهنده همچنان گلوگاه اصلی اجرای هر گام باقی می‌ماند.',
          'پلتفرم Google Antigravity با معرفی معماری Agent-First این معادله را وارونه کرده است. در این معماری، شما به عنوان Principal Architect هم‌زمان به دو فضای کاری مکمل دسترسی دارید: محیط Editor View برای مداخلات جراحی و کدنویسی مستقیم با سرعت بالا، و محیط Agent Manager (یا Mission Control) برای تعریف، نظارت و ممیزی ایجنت‌های خودمختاری که در پس‌زمینه به صورت موازی روی تسک‌های پیچیده مهندسی کار می‌کنند.',
        ],
        comparisonTable: {
          headers: ['معیار معماری (Criterion)', 'Editor View (Synchronous IDE)', 'Agent Manager / Mission Control (Async)', 'حکم معمار (Architect Verdict)'],
          rows: [
            {
              criterion: 'واحد تمرکز (Primary Unit)',
              optionA: 'فایل، خط کد و AST محلی (File & Cursor-Centric)',
              optionB: 'تسک مهندسی و آرتیفکت‌ها (Task & Artifact-Centric)',
              architectVerdict: 'استفاده از Editor برای تغییر سریع منطق و Agent Manager برای فیچرهای چندلایه',
            },
            {
              criterion: 'مدل هم‌زمانی (Concurrency)',
              optionA: 'تک‌ریسمانی، وابسته به حضور لحظه‌ای برنامه‌نویس',
              optionB: 'چندایجنتی موازی در پس‌زمینه (Parallel Background Agents)',
              architectVerdict: 'اجرای هم‌زمان ۳+ ایجنت روی Git Worktreeهای ایزوله',
            },
            {
              criterion: 'ابزارهای هوش مصنوعی کلیدی',
              optionA: 'Supercomplete, Tab-to-Jump, Cmd/Ctrl + I',
              optionB: 'Planning Mode, Browser Subagent, Inbox Triage',
              architectVerdict: 'ترکیب هر دو محیط با کلید میانبر سوییچ آنی',
            },
            {
              criterion: 'خروجی و ممیزی (Deliverable)',
              optionA: 'تغییرات مستقیم بافر فایل (Direct Buffer Diff)',
              optionB: 'task.md, implementation_plan.md, walkthrough.md',
              architectVerdict: 'ممیزی PR-Style روی آرتیفکت‌ها پیش از ادغام کد',
            },
          ],
        },
        callouts: [
          {
            type: 'architecture',
            title: 'قانون طلایی تفکیک بار کاری (Workload Allocation Rule)',
            content:
              'هرگاه تغییری بیش از ۲ فایل را درگیر می‌کند یا نیازمند اجرای تست‌های Pytest و بررسی مرورگر است، آن را از طریق Agent Manager در قالب یک تسک ساختاریافته تعریف کنید تا آرتیفکت‌های ممیزی تولید شوند.',
          },
        ],
      },
      {
        id: 'm1-s2',
        titleFa: '۱.۲ کالبدشکافی موتورهای هوشمند در Editor View',
        titleEn: 'Editor AI Engines: Supercomplete, Tab-to-Jump, Inline Command & @ Mentions',
        contentFa: [
          'محیط Editor View در Google Antigravity صرفاً یک ویرایشگر متن نیست، بلکه به سه موتور پیش‌بینی بلادرنگ مجهز است که با سرور زبان (LSP)، درخت سینتکس انتزاعی (AST) و تاریخچه تغییرات اخیر گیت (Diff History) یکپارچه شده‌اند.',
          'موتور Supercomplete برخلاف تکمیل‌کننده‌های سنتی که فقط ادامه خط فعلی را حدس می‌زنند، کل پنجره تغییرات اخیر شما و خطاهای تایپ LSP را تحلیل کرده و یک بلوک Diff کامل (شامل حذف کدهای قدیمی و درج کدهای جدید) پیشنهاد می‌دهد. بلافاصله پس از اعمال تغییر در یک فایل، موتور Tab-to-Jump فعال شده و دقیقاً محل بعدی در فایل‌های مرتبط را که باید متناسب با این تغییر آپدیت شود پیش‌بینی می‌کند.',
        ],
        bulletPoints: [
          {
            termEn: 'Supercomplete',
            descFa: 'پیشنهاد هوشمند چندخطی و بازنویسی هم‌زمان امضای متدها با آگاهی کامل از تشخیص‌های LSP و تاریخچه Diff.',
          },
          {
            termEn: 'Tab-to-Jump & Tab-to-Import',
            descFa: 'پیش‌بینی مکان بعدی کرسر در طول فایل یا فایل‌های وابسته و افزودن خودکار ایمپورت‌های کسرشده در بالای فایل با یک بار فشردن Tab.',
          },
          {
            termEn: 'Inline Command (Cmd/Ctrl + I)',
            descFa: 'بازنویسی جراحی در سطح AST داخل همان فایل بدون ترک محل کرسر، ایده‌آل برای تبدیل توابع سنکرون به Async یا افزودن Type Annotation.',
          },
          {
            termEn: '@file · @folder · @rule · @mcp · @terminal',
            descFa: 'سیستم Context Mentions برای سنجاق کردن دقیق منابع به پرامپت ایجنت بدون آلوده کردن پنجره کانتکست.',
          },
        ],
        codeExamples: [
          {
            id: 'm1-code-1',
            title: 'گام ۱: مدل SQLAlchemy 2.0 Async (شروع زنجیره Supercomplete)',
            filename: 'src/models/settlement.py',
            language: 'python',
            description: 'هنگامی که فیلد risk_score_bps را به مدل SQLAlchemy اضافه می‌کنید، موتور Tab-to-Jump بلافاصله پرش به اسکیمای Pydantic و روتر FastAPI را پیشنهاد می‌دهد.',
            code: `from datetime import datetime
from decimal import Decimal
from uuid import UUID, uuid4
from sqlalchemy import Numeric, String, DateTime, Integer, Index, func
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column


class Base(DeclarativeBase):
    pass


class SettlementLedger(Base):
    __tablename__ = "settlement_ledgers"

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    merchant_id: Mapped[str] = mapped_column(String(64), index=True, nullable=False)
    amount_minor: Mapped[Decimal] = mapped_column(Numeric(18, 4), nullable=False)
    currency: Mapped[str] = mapped_column(String(3), default="USD", nullable=False)
    status: Mapped[str] = mapped_column(String(24), default="PENDING", nullable=False)
    # [Supercomplete + Tab-to-Jump Trigger]: Adding basis-points risk score column
    risk_score_bps: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    __table_args__ = (
        Index("ix_settlement_merchant_status", "merchant_id", "status"),
    )`,
          },
          {
            id: 'm1-code-2',
            title: 'گام ۲: اسکیمای Pydantic v2 و روتر FastAPI (مقصد Tab-to-Jump)',
            filename: 'src/api/routers/settlements.py',
            language: 'python',
            description: 'پس از فشردن Tab، کرسر به فایل روتر و اسکیما پریده و Supercomplete فیلد جدید را با اعتبارسنجی Annotated تکمیل می‌کند.',
            code: `from typing import Annotated
from uuid import UUID
from decimal import Decimal
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, ConfigDict, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.models.settlement import SettlementLedger
from src.core.database import get_async_session

router = APIRouter(prefix="/v1/settlements", tags=["Settlements"])


class SettlementCreateRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    merchant_id: Annotated[str, Field(min_length=3, max_length=64)]
    amount_minor: Annotated[Decimal, Field(gt=Decimal("0"))]
    currency: Annotated[str, Field(pattern=r"^[A-Z]{3}$")] = "USD"
    risk_score_bps: Annotated[int, Field(ge=0, le=10000)] = 0


class SettlementResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    merchant_id: str
    amount_minor: Decimal
    currency: str
    status: str
    risk_score_bps: int


@router.post(
    "",
    response_model=SettlementResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_settlement(
    payload: SettlementCreateRequest,
    session: Annotated[AsyncSession, Depends(get_async_session)],
) -> SettlementLedger:
    if payload.risk_score_bps >= 8500:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Settlement rejected: risk_score_bps exceeds autonomous threshold (8500 bps).",
        )
    record = SettlementLedger(**payload.model_dump())
    session.add(record)
    await session.commit()
    await session.refresh(record)
    return record`,
          },
        ],
      },
    ],
  },
  {
    id: 'module-2',
    number: 2,
    titleFa: 'مهندسی مبتنی بر آرتیفکت و ممیزی تعاملی',
    titleEn: 'Artifact-Driven Engineering & Inline Auditing',
    readingTime: '22 min read',
    difficulty: 'Core Architecture',
    summaryFa:
      'چرا لاگ‌های چت خام در مقیاس سازمانی شکست می‌خورند و چگونه سه آرتیفکت زنده (task.md، implementation_plan.md و walkthrough.md) به همراه کامنت‌گذاری خطی PR-Style، کنترل کامل معماری را تضمین می‌کنند.',
    keyTakeaways: [
      {
        titleFa: 'آرتیفکت task.md',
        metricOrBadge: '[ ] · [/] · [x] State Machine',
        descFa: 'ماشین وضعیت سلسله‌مراتبی برای ردیابی لحظه‌ای پیشرفت زیرتسک‌های ایجنت بدون نیاز به خواندن صدها خط لاگ.',
      },
      {
        titleFa: 'آرتیفکت implementation_plan.md',
        metricOrBadge: '[NEW] · [MODIFY] · [DELETE]',
        descFa: 'سند طراحی فنی پیش از اجرا شامل هشدارهای User Review Required و برنامه صحت‌سنجی دقیق.',
      },
      {
        titleFa: 'ممیزی خطی PR-Style',
        metricOrBadge: 'Inline Plan Commenting',
        descFa: 'امکان هایلایت کردن هر خط از برنامه پیاده‌سازی و ثبت کامنت اصلاحی پیش از نوشته شدن حتی یک خط کد.',
      },
      {
        titleFa: 'آرتیفکت walkthrough.md',
        metricOrBadge: 'Verified Proof + WebP',
        descFa: 'گزارش اثبات تحویل کار شامل لینک‌های Git Diff، خروجی Pytest و ویدیوی WebP ضبط‌شده توسط Browser Subagent.',
      },
    ],
    interactiveWidgetType: 'artifact-auditor',
    subSections: [
      {
        id: 'm2-s1',
        titleFa: '۲.۱ کالبدشکافی سه آرتیفکت هسته در دایرکتوری brain/',
        titleEn: 'Anatomy of task.md, implementation_plan.md, and walkthrough.md',
        contentFa: [
          'در چت‌بات‌های برنامه‌نویسی سنتی، تصمیمات معماری، کدهای آزمایشی و خروجی خطاها همگی در یک رشته متنی طولانی و خطی دفن می‌شوند. پس از ۲۰ پیام، هم مهندس انسان و هم مدل زبانی دچار سردرگمی و فراموشی اهداف اولیه می‌شوند.',
          'در Google Antigravity، ایجنت‌ها به جای تکیه بر حافظه ناپایدار چت، تفکر و وضعیت اجرای خود را در سه فایل Markdown استاندارد و ساختاریافته بیرون‌ریزی (Externalize) می‌کنند. این آرتیفکت‌ها به صورت زنده به‌روزرسانی شده و منبع حقیقت (Single Source of Truth) بین معمار و ایجنت هستند.',
        ],
        bulletPoints: [
          {
            termEn: 'task.md',
            descFa: 'چک‌لیست سلسله‌مراتبی زنده با سه وضعیت استاندارد: [ ] در انتظار (Pending)، [/] در حال اجرا (In-Progress) و [x] تکمیل‌شده (Completed).',
          },
          {
            termEn: 'implementation_plan.md',
            descFa: 'بلوپرینت معماری شامل چهار بخش اجباری: Goal Description، بخش هشدار User Review Required، لیست فایل‌ها با تگ‌های [NEW]/[MODIFY]/[DELETE] و بخش Verification Plan.',
          },
          {
            termEn: 'walkthrough.md',
            descFa: 'گزارش نهایی پس از اجرا که ثابت می‌کند کد نوشته‌شده واقعاً کار می‌کند؛ حاوی نتایج اجرای تست‌ها، تغییرات کلیدی و مدارک بصری مرورگر.',
          },
        ],
        codeExamples: [
          {
            id: 'm2-code-task',
            title: 'نمونه کامل آرتیفکت ۱: فایل وضعیت اجرای زنده (task.md)',
            filename: '.aistudio/artifacts/brain/task.md',
            language: 'markdown',
            description: 'ساختار استاندارد فایل task.md در حین اجرای یک فیچر بازطراحی سرویس تسویه حساب ناهمگام.',
            code: `# Task Backlog: Async Idempotent Settlement Engine

- [x] Phase 1: Schema & Persistence Layer
  - [x] Add \`idempotency_key\` unique index to \`SettlementLedger\` in \`src/models/settlement.py\`
  - [x] Generate Alembic migration \`20261027_add_idempotency_key.py\`
  - [x] Verify reversible migration (\`upgrade head\` -> \`downgrade -1\` -> \`upgrade head\`)
- [/] Phase 2: Service & FastAPI Router Implementation
  - [x] Implement Redis distributed lock wrapper in \`src/services/idempotency.py\`
  - [/] Refactor \`POST /v1/settlements\` to enforce \`Idempotency-Key\` header
  - [ ] Map duplicate key conflicts to HTTP \`409 Conflict\` RFC 7807 payload
- [ ] Phase 3: Automated QA & Browser Subagent Verification
  - [ ] Add concurrent \`asyncio.gather\` race-condition test in \`tests/test_settlement_idempotency.py\`
  - [ ] Verify settlement dashboard status table via Browser Subagent and capture WebP`,
          },
          {
            id: 'm2-code-plan',
            title: 'نمونه کامل آرتیفکت ۲: بلوپرینت معماری (implementation_plan.md)',
            filename: '.aistudio/artifacts/brain/implementation_plan.md',
            language: 'markdown',
            description: 'سند برنامه پیاده‌سازی که پیش از تغییر کد برای ممیزی خط‌به‌خط (Inline PR-Style Review) به معمار ارائه می‌شود.',
            code: `# Implementation Plan: Idempotent Settlement Processing Pipeline

## Goal Description
Eliminate duplicate ledger entries caused by client network retries on \`POST /v1/settlements\` by introducing strict database-backed idempotency keys paired with SQLAlchemy 2.0 async conflict handling.

## User Review Required
> [!IMPORTANT]
> **Breaking API Contract Change:** Clients calling \`POST /v1/settlements\` must now provide a valid UUIDv4 in the \`X-Idempotency-Key\` HTTP header. Requests missing this header will receive \`422 Unprocessable Entity\`.

> [!WARNING]
> **Database Index Lock:** Creating the unique index \`uq_settlement_idempotency_key\` uses \`postgresql_concurrently=True\` to avoid table locking in production. Alembic transaction wrapping must use \`autocommit_block()\`.

## Proposed Changes

### Persistence & Migration Component
- **[MODIFY]** \`src/models/settlement.py\`: Add \`idempotency_key: Mapped[str]\` with unique constraint.
- **[NEW]** \`alembic/versions/8f3a91c2_concurrent_idempotency_idx.py\`: Non-blocking unique index migration.

### API & Domain Service Layer
- **[NEW]** \`src/services/settlement_processor.py\`: Implement \`execute_idempotent_settlement()\` using PostgreSQL \`INSERT ... ON CONFLICT DO NOTHING\` and state recovery.
- **[MODIFY]** \`src/api/routers/settlements.py\`: Extract \`X-Idempotency-Key\` header and wire service layer.
- **[DELETE]** \`src/utils/legacy_memory_dedup.py\`: Remove unsafe in-memory dictionary deduplication cache.

## Verification Plan
### Automated Tests
1. Run \`poetry run pytest tests/test_settlement_idempotency.py -v\` verifying 20 parallel identical requests result in exactly 1 database row.
2. Execute \`poetry run alembic upgrade head\` and \`poetry run ruff check .\`.

### Browser Subagent Verification
1. Open \`http://localhost:3000/settlements-monitor\` in Browser Subagent.
2. Trigger retry simulation button and verify 0 console errors, HTTP 200/409 handling, and capture \`settlement_audit.webp\`.`,
          },
          {
            id: 'm2-code-walkthrough',
            title: 'نمونه کامل آرتیفکت ۳: گزارش اثبات تحویل (walkthrough.md)',
            filename: '.aistudio/artifacts/brain/walkthrough.md',
            language: 'markdown',
            description: 'گزارش نهایی تولیدشده توسط ایجنت پس از اتمام کدنویسی و پاس شدن تمامی تست‌های ترمینال و مرورگر.',
            code: `# Walkthrough: Idempotent Settlement Engine Completed

## Summary of Changes
Implemented strict idempotency enforcement across the settlement pipeline and removed the legacy in-memory deduplication utility.

- **Database Model (\`src/models/settlement.py\`):** Added \`idempotency_key\` column with concurrent unique index.
- **Service Layer (\`src/services/settlement_processor.py\`):** Added atomic conflict resolution.
- **Router (\`src/api/routers/settlements.py\`):** Enforced \`X-Idempotency-Key\` header validation.

## Terminal Verification Output
\`\`\`text
$ poetry run pytest tests/test_settlement_idempotency.py -v
============================= test session starts ==============================
collected 4 items

tests/test_settlement_idempotency.py::test_single_settlement_creation PASSED [ 25%]
tests/test_settlement_idempotency.py::test_concurrent_20_retries_idempotent PASSED [ 50%]
tests/test_settlement_idempotency.py::test_missing_header_returns_422 PASSED [ 75%]
tests/test_settlement_idempotency.py::test_payload_mismatch_returns_409 PASSED [100%]
============================== 4 passed in 0.84s ===============================
\`\`\`

## Visual Browser Subagent Telemetry
- **Target URL:** \`http://localhost:3000/settlements-monitor\`
- **Console Stream:** \`0 uncaught exceptions\`
- **Network Stream:** \`POST /v1/settlements -> 201 Created (14ms)\`, retry \`-> 200 OK (Idempotent Hit, 4ms)\`
- **Recorded Artifact:** \`![Settlement Verification Recording](/.aistudio/artifacts/brain/settlement_audit.webp)\``,
          },
        ],
      },
      {
        id: 'm2-s2',
        titleFa: '۲.۲ راهنمای گام‌به‌گام ممیزی خطی (Inline PR-Style Review)',
        titleEn: 'Step-by-Step Visual Guide to Inline PR-Style Review on Artifacts',
        contentFa: [
          'بزرگ‌ترین مزیت رقابتی Google Antigravity نسبت به سایر ابزارهای کدنویسی، قابلیت کامنت‌گذاری مستقیم روی خطوط `implementation_plan.md` درست مانند Pull Requestهای گیت‌هاب یا Google Docs است، اما قبل از اینکه ایجنت زمان و توکن را صرف نوشتن کد اشتباه کند.',
          'هنگامی که ایجنت در حالت Planning Mode فایل `implementation_plan.md` را تولید کرده و منتظر تایید شما می‌ماند، شما می‌توانید هر خط یا بلوک را انتخاب کرده، چندین کامنت معماری در بخش‌های مختلف سند ثبت کنید و سپس دکمه Submit Review را بزنید تا ایجنت تمامی اصلاحات را به صورت یکجا در برنامه و اجرای خود اعمال کند.',
        ],
        callouts: [
          {
            type: 'best-practice',
            title: 'پروتکل ممیزی دسته‌ای (Batch Review Protocol)',
            content:
              'به جای ارسال پیام‌های پراکنده در چت، تمام نکات اصلاحی خود (مثلاً تغییر نوع ایندکس، تغییر نام متغیر، یا افزودن یک کیس تست خاص) را به صورت کامنت‌های خطی روی خطوط مربوطه در implementation_plan.md ثبت کرده و در یک نوبت ارسال کنید.',
          },
        ],
      },
    ],
  },
  {
    id: 'module-3',
    number: 3,
    titleFa: 'حالت‌های اجرایی، سیاست‌های ترمینال و کالیبراسیون خودمختاری',
    titleEn: 'Execution Modes, Terminal Policies & Autonomy Calibration',
    readingTime: '20 min read',
    difficulty: 'Security & Governance',
    summaryFa:
      'کالیبره کردن دقیق سطح خودمختاری ایجنت با انتخاب هوشمندانه بین Planning Mode و Fast Mode، تنظیم سیاست‌های اجرای ترمینال (Off / Auto / Turbo) و مهندسی لیست‌های مجاز و ممنوعه.',
    keyTakeaways: [
      {
        titleFa: 'دوگانگی حالت‌های اجرا',
        metricOrBadge: 'Planning vs. Fast Mode',
        descFa: 'استفاده از Planning Mode برای طراحی معماری چندفایلی و Fast Mode برای تغییرات جراحی و سریع با تاخیر پایین.',
      },
      {
        titleFa: 'سیاست‌های اجرای ترمینال',
        metricOrBadge: 'Off · Auto · Turbo',
        descFa: 'موازنه بین کنترل دستی، طبقه‌بندی هوشمند ایمنی دستورات (Command Safety Classifier) و اجرای بدون توقف.',
      },
      {
        titleFa: 'مهندسی Allow / Deny List',
        metricOrBadge: 'Zero-Trust Shell Guardrails',
        descFa: 'صدور مجوز خودکار برای تست‌ها و لینترها در کنار مسدودسازی قطعی دستورات مخرب دیتابیس و گیت.',
      },
      {
        titleFa: 'سیاست مرور آرتیفکت‌ها',
        metricOrBadge: 'Request Review · Agent Decides',
        descFa: 'تنظیم دروازه‌های تایید انسانی متناسب با محیط Local Sandbox، محیط Staging یا Enterprise Production.',
      },
    ],
    interactiveWidgetType: 'autonomy-matrix',
    subSections: [
      {
        id: 'm3-s1',
        titleFa: '۳.۱ ماتریس تصمیم‌گیری: Planning Mode در برابر Fast Mode',
        titleEn: 'Decision Matrix: Planning Mode vs. Fast Mode',
        contentFa: [
          'انتخاب حالت اجرایی مناسب در ابتدای هر تسک، تاثیر مستقیمی بر مصرف توکن، زمان پاسخ‌دهی (Latency) و ایمنی معماری دارد. در حالت Planning Mode، ایجنت پیش از دست زدن به کدهای پروژه، ابتدا کدبیس را کاوش کرده و آرتیفکت‌های `task.md` و `implementation_plan.md` را تولید می‌کند.',
          'در مقابل، حالت Fast Mode مرحله تولید آرتیفکت برنامه را دور زده و مستقیماً تغییرات را روی فایل‌ها اعمال می‌کند. این حالت برای تسک‌های مشخص، رفع باگ‌های تایپی یا تغییر استایل یک کامپوننت منفرد که نیازی به بازنگری معماری ندارند، حدود ۶۰٪ سریع‌تر و کم‌هزینه‌تر است.',
        ],
        comparisonTable: {
          headers: ['ویژگی (Dimension)', 'Planning Mode (Structured)', 'Fast Mode (Direct Execution)', 'توصیه معماری (Architect Guidance)'],
          rows: [
            {
              criterion: 'تولید آرتیفکت‌ها',
              optionA: 'تولید کامل task.md, implementation_plan.md, walkthrough.md',
              optionB: 'بدون آرتیفکت پیش‌نیاز؛ اعمال مستقیم روی فایل‌ها',
              architectVerdict: 'Planning Mode برای هر تسک با بیش از ۲ فایل یا تغییر اسکیما',
            },
            {
              criterion: 'مصرف توکن و Latency اولیه',
              optionA: 'بالاتر (به دلیل استدلال عمیق و نگارش مستندات طراحی)',
              optionB: 'حداقل تاخیر؛ شروع فوری ویرایش کد',
              architectVerdict: 'Fast Mode برای تغییر نام، اصلاح CSS و افزودن تست واحد ساده',
            },
            {
              criterion: 'ریسک انحراف معماری (Drift Risk)',
              optionA: 'بسیار پایین (امکان ممیزی خطی قبل از اجرا)',
              optionB: 'متوسط تا بالا در صورت مبهم بودن پرامپت',
              architectVerdict: 'هرگز از Fast Mode برای مایگریشن دیتابیس یا تغییر API عمومی استفاده نکنید',
            },
          ],
        },
      },
      {
        id: 'm3-s2',
        titleFa: '۳.۲ سیاست‌های اجرای ترمینال و طبقه‌بندی‌کننده ایمنی دستورات',
        titleEn: 'Terminal Execution Policies (Off, Auto, Turbo) & Allow/Deny Lists',
        contentFa: [
          'ایجنت‌های Google Antigravity برای اجرای تست‌ها، بررسی وضعیت گیت و اعمال مایگریشن‌ها به شل ترمینال دسترسی دارند. موتور داخلی Command Safety Classifier هر دستور پیشنهادی ایجنت را پیش از اجرا تحلیل می‌کند تا مشخص کند آیا دستور صرفاً خواندنی و بی‌خطر است یا دارای اثرات جانبی مخرب (Side-Effects) روی سیستم فایل، شبکه یا دیتابیس است.',
          'با ترکیب سه سیاست کلی (`Off`، `Auto`، `Turbo`) و تعریف دقیق لیست‌های `Allow List` و `Deny List`، شما می‌توانید سرعت اجرای خودکار را بدون به خطر انداختن امنیت زیرساخت به حداکثر برسانید. توجه داشته باشید که دستورات موجود در `Deny List` حتی در حالت `Turbo` یا با وجود دایرکتیو `// turbo-all` نیز به صورت سخت‌افزاری مسدود می‌شوند.',
        ],
        comparisonTable: {
          headers: ['سیاست / لیست', 'رفتار سیستم (System Behavior)', 'دستورات نمونه / کاربرد', 'سطح ریسک و محیط هدف'],
          rows: [
            {
              criterion: 'Terminal Policy: Off',
              optionA: 'هیچ دستوری بدون کلیک تایید دستی کاربر اجرا نمی‌شود',
              optionB: 'مناسب برای ممیزی امنیتی روی مخازن ناشناخته',
              architectVerdict: 'ایمن‌ترین حالت؛ اما سرعت کار ایجنت‌های پس‌زمینه را کاهش می‌دهد',
            },
            {
              criterion: 'Terminal Policy: Auto',
              optionA: 'اجرای خودکار دستورات Allow List و دستورات بی‌خطر به تشخیص Classifier',
              optionB: 'توقف و درخواست مجوز برای دستورات ناشناخته یا تغییر وضعیت',
              architectVerdict: 'تنظیم پیش‌فرض پیشنهادی برای محیط‌های سازمانی و Staging',
            },
            {
              criterion: 'Terminal Policy: Turbo',
              optionA: 'اجرای خودکار تمام دستورات ترمینال به جز موارد صریح در Deny List',
              optionB: 'مناسب برای محیط‌های کانتینری ایزوله و Local Sandbox',
              architectVerdict: 'الزاماً باید همراه با یک Deny List جامع پیکربندی شود',
            },
            {
              criterion: 'Artifact Review Policies',
              optionA: 'Always Proceed vs. Agent Decides vs. Request Review',
              optionB: 'تعیین زمان توقف ایجنت پس از تولید implementation_plan.md',
              architectVerdict: 'استفاده از Request Review برای تغییرات Production و Agent Decides برای توسعه روزمره',
            },
          ],
        },
        codeExamples: [
          {
            id: 'm3-code-policy',
            title: 'پیکربندی استاندارد سازمانی Allow List و Deny List ترمینال',
            filename: '.agent/terminal_policy.json',
            language: 'json',
            description: 'الگوی پیشنهادی برای تیم‌های بک‌اند Python/FastAPI جهت اجرای خودکار ابزارهای تست و مسدودسازی کامل دستورات مخرب.',
            code: `{
  "terminalExecutionPolicy": "Auto",
  "artifactReviewPolicy": "Agent Decides",
  "commandSafetyClassifier": {
    "strictness": "high",
    "blockNetworkExfiltration": true
  },
  "allowList": [
    "poetry run pytest",
    "poetry run ruff check .",
    "poetry run mypy src",
    "alembic heads",
    "alembic current",
    "alembic history",
    "git status",
    "git diff",
    "git log -n 5"
  ],
  "denyList": [
    "rm -rf",
    "git push --force",
    "git reset --hard",
    "docker system prune -a",
    "alembic downgrade base",
    "DROP TABLE",
    "TRUNCATE TABLE",
    "curl -X POST"
  ]
}`,
          },
        ],
      },
    ],
  },
  {
    id: 'module-4',
    number: 4,
    titleFa: 'مهندسی کانتکست و معماری قوانین پروژه',
    titleEn: 'Context Engineering & .agent/rules Architecture',
    readingTime: '25 min read',
    difficulty: 'Principal Context Engineering',
    summaryFa:
      'طراحی گاردریل‌های معماری نسخه‌بندی‌شده در گیت با استفاده از فایل‌های .agent/rules/*.md و بهینه‌سازی مصرف توکن از طریق ۴ حالت فعال‌سازی هوشمند.',
    keyTakeaways: [
      {
        titleFa: 'قوانین Global در برابر Workspace',
        metricOrBadge: '~/.gemini/ vs .agent/rules/',
        descFa: 'نگهداری ترجیحات فردی در سطح سیستم‌عامل و ذخیره‌سازی استانداردهای تیمی در مخزن گیت پروژه.',
      },
      {
        titleFa: '۴ حالت فعال‌سازی هوشمند',
        metricOrBadge: 'Always On · Glob · Model Decision · Manual',
        descFa: 'جلوگیری از اشباع پنجره کانتکست با بارگذاری شرطی قوانین فقط در زمان نیاز.',
      },
      {
        titleFa: 'فرانت‌متر استاندارد YAML',
        metricOrBadge: 'alwaysApply · globs · description',
        descFa: 'تعریف دقیق متادیتای مسیریابی قوانین در بالای هر فایل Markdown.',
      },
      {
        titleFa: 'حذف تکرار در پرامپت‌ها',
        metricOrBadge: 'Zero Repetitive Prompting',
        descFa: 'تضمین رعایت خودکار استانداردهای SQLAlchemy 2.0، Pydantic v2 و امنیت بدون نیاز به یادآوری در هر چت.',
      },
    ],
    interactiveWidgetType: 'rule-activation',
    subSections: [
      {
        id: 'm4-s1',
        titleFa: '۴.۱ تحلیل مهندسی توکن و ۴ حالت فعال‌سازی قوانین',
        titleEn: 'Global vs. Workspace Rules & The 4 Activation Modes',
        contentFa: [
          'یکی از خطاهای رایج تیم‌های مهندسی، قرار دادن یک فایل قانون بسیار حجیم (مثلاً ۵۰۰۰ توکن) در حالت دائمی برای تمام تسک‌هاست. این کار باعث می‌شود حتی زمانی که ایجنت در حال ویرایش یک فایل CSS یا اسکریپت CI ساده است، هزاران توکن از قوانین دیتابیس و تست در پنجره کانتکست بارگذاری شود که منجر به افزایش هزینه، تاخیر و کاهش دقت توجه مدل (Attention Dilution) می‌گردد.',
          'معماری `.agent/rules/*.md` در Google Antigravity به شما اجازه می‌دهد قوانین را به ماژول‌های تخصصی و کوچک شکسته و برای هر کدام یکی از ۴ حالت فعال‌سازی (`Always On`، `Glob`، `Model Decision` یا `Manual`) را از طریق YAML Frontmatter تعیین کنید.',
        ],
        comparisonTable: {
          headers: ['حالت فعال‌سازی (Mode)', 'پیکربندی YAML Frontmatter', 'مکانیزم تریگر شدن (Trigger Mechanism)', 'بهترین مورد استفاده (Ideal Use Case)'],
          rows: [
            {
              criterion: '1. Always On',
              optionA: 'alwaysApply: true',
              optionB: 'تزریق دائمی به سیستم‌پرامپت تمام تسک‌های فضای کاری',
              architectVerdict: 'فقط برای اصول بنیادی پروژه (حداکثر ۲۰۰ تا ۳۰۰ توکن) مانند نسخه پایتون و معماری کلی',
            },
            {
              criterion: '2. Glob (File Pattern)',
              optionA: 'alwaysApply: false + globs: ["tests/**/*.py"]',
              optionB: 'فعال‌سازی خودکار به محض خواندن یا ویرایش فایل‌های منطبق با الگو',
              architectVerdict: 'بهترین گزینه برای استانداردهای فریم‌ورک، قوانین Pytest و کامپوننت‌های UI',
            },
            {
              criterion: '3. Model Decision',
              optionA: 'alwaysApply: false + description: "..." (بدون globs)',
              optionB: 'تصمیم‌گیری معنایی روتر ایجنت بر اساس تطابق تسک با متن description',
              architectVerdict: 'ایده‌آل برای قوانین مقطعی مانند ممیزی امنیتی، تله‌متری یا بهینه‌سازی کوئری',
            },
            {
              criterion: '4. Manual (@rule)',
              optionA: 'alwaysApply: false (فراخوانی صریح با @rule-name)',
              optionB: 'فقط زمانی که کاربر صراحتاً نام قانون را در پرامپت منشن کند',
              architectVerdict: 'مناسب برای چک‌لیست‌های خاص مانند مایگریشن نسخه یا ریفکتورینگ‌های نادر',
            },
          ],
        },
      },
      {
        id: 'm4-s2',
        titleFa: '۴.۲ سه فایل قانون کامل و آماده بهره‌برداری (Production-Grade Rules)',
        titleEn: '3 Complete Production-Grade Copyable Rule Files',
        contentFa: [
          'در ادامه، سه فایل قانون استاندارد و کامل برای معماری بک‌اند مدرن (FastAPI + SQLAlchemy 2.0 Async + Pydantic v2 + Pytest + Security Telemetry) آورده شده است که می‌توانید مستقیماً در مسیر `.agent/rules/` پروژه خود کپی و در گیت کامیت کنید.',
        ],
        codeExamples: [
          {
            id: 'm4-rule-1',
            title: 'فایل قانون ۱: استانداردهای FastAPI و SQLAlchemy 2.0 Async',
            filename: '.agent/rules/01-fastapi-sqlalchemy-async.md',
            language: 'markdown',
            description: 'قانون هسته بک‌اند برای تضمین استفاده از سینتکس SQLAlchemy 2.0، اسکیمای Pydantic v2 و مدیریت خطای استاندارد.',
            code: `---
alwaysApply: true
description: "Core architectural invariants for FastAPI, SQLAlchemy 2.0 Async, and Pydantic v2"
---

# Backend Architecture Standards: FastAPI & SQLAlchemy 2.0 Async

## 1. SQLAlchemy 2.0 Async ORM Invariants
- **Strict 2.0 Query Syntax:** NEVER use legacy \`session.query()\`. Always construct statements using \`select()\`, \`insert()\`, \`update()\`, or \`delete()\` and execute via \`await session.execute(stmt)\`.
- **Typed Declarative Mapping:** Define all ORM columns using \`Mapped[T]\` and \`mapped_column()\` with explicit types and nullability constraints.
- **Relationship Loading:** Lazy loading is strictly prohibited in async sessions (\`MissingGreenlet\` hazard). Always specify \`selectinload()\` or \`joinedload()\` explicitly in queries, or set \`lazy="raise"\` on model relationships.
- **Unit of Work & Transactions:** Route handlers must receive \`Annotated[AsyncSession, Depends(get_async_session)]\`. Commit transactions explicitly at the service boundary.

## 2. Pydantic v2 Data Contracts
- **Strict Schema Configuration:** Every request/response model MUST declare \`model_config = ConfigDict(from_attributes=True, extra="forbid")\`.
- **Annotated Field Validation:** Use \`Annotated[T, Field(...)]\` for constraints (e.g., \`min_length\`, \`gt\`, \`pattern\`) and \`@field_validator(..., mode="after")\` instead of deprecated v1 \`@validator\`.

## 3. Domain Exception Handling
- Raise custom domain exceptions inheriting from \`DomainError(status_code, error_code, detail)\`.
- Never leak raw \`SQLAlchemyError\` or database stack traces in HTTP \`500\` responses.`,
          },
          {
            id: 'm4-rule-2',
            title: 'فایل قانون ۲: استانداردهای تضمین کیفیت و تست (Glob-Triggered)',
            filename: '.agent/rules/02-pytest-qa-standards.md',
            language: 'markdown',
            description: 'این قانون تنها زمانی که ایجنت فایل‌های داخل دایرکتوری tests/ را باز یا ویرایش می‌کند فعال می‌شود.',
            code: `---
alwaysApply: false
globs: ["tests/**/*.py", "conftest.py"]
description: "Pytest async testing standards, transactional rollback fixtures, and factory patterns"
---

# QA & Automated Testing Standards (Pytest Async)

## 1. Async Test Execution
- Mark all asynchronous test coroutines with \`@pytest.mark.asyncio\`.
- Use \`httpx.AsyncClient\` with \`ASGITransport(app=app)\` for testing FastAPI endpoints; never use synchronous \`TestClient\` for async database routes.

## 2. Isolated Transactional Rollback Fixtures
- Every test must run inside an isolated database transaction using nested \`SAVEPOINT\` (\`begin_nested()\`) that rolls back automatically on teardown.
- Never truncate shared tables between tests; ensure tests can run in parallel via \`pytest-xdist\`.

## 3. Deterministic Factories & Assertions
- Construct test entities using typed factory functions rather than brittle hardcoded SQL fixtures.
- Every endpoint test suite must cover:
  1. Happy path (\`200 OK\` / \`201 Created\`)
  2. Schema validation rejection (\`422 Unprocessable Entity\`)
  3. Authorization & tenant isolation boundary (\`403 Forbidden\` / \`404 Not Found\`)`,
          },
          {
            id: 'm4-rule-3',
            title: 'فایل قانون ۳: امنیت، لاگ ساختاریافته و تله‌متری (Model-Decision Triggered)',
            filename: '.agent/rules/03-security-and-telemetry.md',
            language: 'markdown',
            description: 'این قانون بر اساس تشخیص معنایی مدل، هنگام کار روی احراز هویت، میدل‌ورها، لاگینگ یا یکپارچه‌سازی خارجی فعال می‌شود.',
            code: `---
alwaysApply: false
description: "Activate when implementing authentication, logging middlewares, external HTTP clients, audit trails, or secret handling"
---

# Enterprise Security, Secret Scrubbing & Structured Telemetry

## 1. Structured JSON Logging & Correlation
- Use \`structlog\` configured for JSON output in production.
- Every log event MUST bind \`correlation_id\`, \`request_id\`, \`service_name\`, and \`latency_ms\` from \`contextvars\`.

## 2. Mandatory PII & Secret Scrubbing
- Register a processor in \`structlog\` that redacts keys matching \`/(password|secret|token|authorization|api_key|card_number|cvv)/i\` with \`"[REDACTED]"\`.
- Never log raw request bodies on authentication or payment endpoints.

## 3. Outbound HTTP Resiliency
- All \`httpx.AsyncClient\` calls must define explicit \`timeout=httpx.Timeout(10.0, connect=3.0)\` and propagate the inbound \`X-Correlation-ID\` header.`,
          },
        ],
      },
    ],
  },
];
