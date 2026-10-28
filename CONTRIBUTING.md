# Contributing to Google Antigravity Academy & Mission Control Studio

Welcome to the **Google Antigravity Academy, Mission Control Simulator & Architect Studio** repository. This project serves as the reference educational platform and interactive engineering workbench for mastering **Google Antigravity (`https://antigravity.google/docs`)** in both **Persian (RTL)** and **English (LTR)**.

Every contribution—whether expanding the 8-module curriculum, adding new interactive studio generators, refining the XP/Trophy progression engine, or hardening Cloud Firestore synchronization—must adhere to the architectural philosophy, coding standards, and Pull Request governance defined in this document.

---

## 1. Architectural Philosophy

Our codebase is engineered around five non-negotiable architectural principles that reflect the **Agent-First Engineering** paradigm taught inside the Academy:

### 1.1 Pure Logic Decoupling (Core Engine vs. Interactive Shell)
- **Pure Domain & Generator Layer (`src/utils/`):** All configuration generators (`.agent/rules/*.md`, `.agent/workflows/*.md`, `mcp_config.json`, `FastMCP` Python server templates), token-overhead calculators, XP/Level progression formulas, Daily Study Planner analytics, and Trophy Case predicates must be written as **pure, deterministic, side-effect-free TypeScript functions** with zero DOM or React dependencies.
- **Interactive Workbench Layer (`src/studios/` & `src/components/`):** React components are responsible solely for state orchestration, visual telemetry, and user interaction, delegating all computation and code synthesis to `src/utils/`.
- **Curriculum Knowledge Layer (`src/data/`):** All 8 learning modules, architectural matrices, and production case studies are strictly typed against `src/types/curriculum.ts`.

### 1.2 Zero-Truncation & Anti-Placeholder Law
- **No Placeholders Allowed:** Contributors are **strictly forbidden** from committing `// TODO`, `# ... rest of implementation`, `pass`, or abbreviated code snippets inside curriculum examples or studio generators.
- **Production-Grade Fidelity:** Every code example (Python 3.12+, FastAPI, SQLAlchemy 2.0 Async `AsyncSession`, Pydantic v2 `ConfigDict`, Alembic migrations, `pytest-asyncio` fixtures, and `FastMCP` servers) must be complete, syntactically valid, and ready for real-world execution.

### 1.3 Bidirectional Typography Precision (`FA-IR` RTL + `EN-US` LTR)
- The application is a first-class bilingual workbench where authoritative Persian technical prose (`dir="rtl"`) coexists with English engineering terminology, file paths, slash commands, and code blocks (`dir="ltr"`).
- Punctuation reversal, bracket flipping, or slash corruption in RTL paragraphs is treated as a **P0 visual defect**.

### 1.4 Scoped On-Demand PDF Portability
- Every new learning module, cheat sheet, certification report card, or studio generator must expose a clean `PrintableDocumentPayload` connected to `ExportSectionPdfButton` so engineers can export standalone, print-calibrated PDF specifications without UI chrome.

### 1.5 Security-By-Design Cloud Persistence
- All Cloud Firestore persistence (`src/lib/firebase.ts`) and security rules (`firestore.rules`) follow a **Default-Deny, 8-Pillar Security Architecture**: strict ownership verification (`isOwner(userId)`), exact schema whitelisting (`hasAll` & `hasOnly`), bounded field sizes, immutable audit fields (`ownerId`, `createdAt`), and server-enforced timestamps (`request.time`).

---

## 2. Coding Standards & Technical Conventions

### 2.1 Strict Bidirectional (`RTL` / `LTR`) Markup Rules
1. **Persian Narrative Containers:**
   - All Persian explanations, callouts, and UI labels must render inside `dir="rtl"` containers using the `'Vazirmatn'` font family.
2. **Inline English Terms, Paths & Commands:**
   - Every inline English technical term, file path (`.agent/rules/01-fastapi.md`), slash command (`/safe-migration`), directive (`// turbo`), or metric badge embedded inside a Persian sentence **must** be wrapped in an isolated LTR span:
     ```tsx
     <span dir="ltr" className="ltr-inline font-mono">
       .agent/workflows/safe-migration.md
     </span>
     ```
3. **Code Blocks & Terminal Output:**
   - All multi-line code blocks, JSON previews, and simulated terminal logs **must** enforce `dir="ltr"`, `text-align: left`, `unicode-bidi: isolate` (`className="ltr-code"`), and `'JetBrains Mono'`.
4. **Numeric Alignment:**
   - All counters, XP bars, level badges, timers (`MM:SS`), and token metrics must include the `tabular-nums` utility class (`font-variant-numeric: tabular-nums`) to prevent horizontal jitter during live updates.

### 2.2 TypeScript & React Guidelines
- **Strict TypeScript:** Avoid `any` or unsafe type assertions. Define explicit interfaces in `src/types/curriculum.ts` or module-level exports. Use standard TypeScript `enum` declarations where appropriate (e.g., `OperationType` in `src/lib/firebase.ts`).
- **Import Discipline:** Keep all `import` statements at the top of the file. When importing JSON configuration files (such as `firebase-applet-config.json`), always use static ES module imports—never dynamic `fs.readFileSync` or `require()`.
- **Deterministic Test Selectors:** Attach semantic `data-testid` attributes to all primary navigation tabs, interactive studio buttons, timers, and cloud sync controls so automated unit and browser tests remain resilient.
- **No Native Browser Dialogs:** Never use `window.alert()`, `window.confirm()`, or `window.prompt()`. Use inline status banners, toast badges, or accessible modal surfaces.

### 2.3 Styling & Design System ("Mission Control Dark & Crisp Light")
- **Tailwind CSS v4:** Use utility classes exclusively; do not introduce separate per-component CSS stylesheets or inline `style={{ ... }}` objects (except for dynamic runtime values like progress bar percentages `style={{ width: `${percent}%` }}`).
- **Dual-Theme Parity:** Every surface must support both **Deep Space Dark Mode** (`dark:bg-slate-900/75`, `dark:border-slate-800`, `dark:text-slate-100`) and **Crisp Daylight Mode** (`bg-white`, `border-slate-200`, `text-slate-900`).
- **Semantic Status Accents:**
  - `Blue (#3b82f6)` / `Indigo (#6366f1)`: Active studio controls, primary actions, and architectural highlights.
  - `Emerald (#10b981)`: Active/completed agent tasks, verified tests, and Cloud Firestore connection status.
  - `Amber (#f59e0b)`: Human-in-the-loop review gates (`Request Review`), warnings, and `Legendary` trophies.
  - `Purple (#a855f7)`: `Mythic` mastery trophies and enterprise MCP telemetry.
  - `Rose (#f43f5e)`: Deny-list terminal guardrails and breaking-change alerts.

### 2.4 Firebase & Firestore Rules Standards
- Whenever modifying data models in `firebase-blueprint.json` or `src/lib/firebase.ts`:
  1. Update `security_spec.md` and `firestore.rules` to validate every field's type, bounds, and mutability (`incoming().diff(existing()).affectedKeys().hasOnly([...])`).
  2. Route all Firestore SDK errors through `handleFirestoreError(error, operationType, path)`.
  3. Lint `firestore.rules` using `@firebase/eslint-plugin-security-rules` and add regression tests in `firestore.rules.test.ts`.

---

## 3. Rules for Submitting Pull Requests (Artifact-Driven PR Workflow)

In the spirit of Google Antigravity's **Artifact-Driven Engineering**, Pull Requests must be structured as verifiable engineering specifications rather than opaque code dumps.

### 3.1 Branch Naming & Conventional Commits
Use descriptive branch names and **Conventional Commit** prefixes:
- `feat(curriculum): add deep-dive section on Browser Subagent WebP telemetry`
- `feat(studio): add OpenSearch tool preset to FastMCP builder`
- `feat(achievements): add Mythic trophy unlock animation and XP breakdown`
- `fix(bidi): isolate slash command inside Module 5 callout card`
- `sec(firestore): tighten affectedKeys whitelist on user progress update`
- `test(generators): add edge-case unit tests for weekly planner metrics`

### 3.2 Artifact-Style Pull Request Description
Every Pull Request description must include the following three sections modeled after Antigravity's core artifacts:

1. **Task Checklist (`task.md` Summary):**
   ```markdown
   - [x] Implement pure logic helper in `src/utils/...`
   - [x] Add unit test coverage in `src/utils/generators.test.ts`
   - [x] Wire interactive UI component with `dir="rtl"` / `dir="ltr"` isolation
   - [x] Verify PDF export payload and dual-theme contrast
   ```
2. **Implementation Blueprint (`implementation_plan.md` Summary):**
   - **Goal Description:** 1–2 sentences explaining the architectural objective.
   - **User Review Required:** Highlight any breaking changes to `localStorage` keys, Firestore document schemas, or public TypeScript interfaces.
   - **Proposed Changes:** List modified/created files tagged with `[NEW]`, `[MODIFY]`, or `[DELETE]`.
3. **Verification Proof (`walkthrough.md` Summary):**
   - Paste the passing output of the test suite and build pipeline.

### 3.3 Mandatory Pre-PR Verification Pipeline
Before opening or marking a Pull Request ready for review, run the complete verification suite locally and ensure **zero errors**:

```bash
# 1. Execute pure-logic unit tests and Firestore security rule tests
npx tsx --test src/utils/generators.test.ts firestore.rules.test.ts

# 2. Lint Firestore security rules for syntax and security anti-patterns
npx eslint firestore.rules

# 3. Run TypeScript compiler typechecking across client and server
npm run lint

# 4. Build production bundle and verify PWA service worker generation
npm run build
```

All four checks are automatically enforced on every `push` and `pull_request` via `.github/workflows/ci.yml`.

---

<div dir="rtl" align="right">

## ۴. راهنمای فارسی مشارکت در پروژه (Persian Contribution Guide)

از علاقه‌مندی شما برای مشارکت در توسعه **آکادمی و استودیوی مهندسی Google Antigravity** سپاسگزاریم. برای حفظ کیفیت در تراز سیستم‌های سازمانی (Principal-Grade)، لطفاً پیش از ارسال هرگونه `Pull Request` اصول زیر را رعایت فرمایید:

### ۱. فلسفه معماری (Architectural Philosophy)
- **جداسازی منطق خالص از رابط کاربری (`Pure Logic Decoupling`):** تمامی فرمول‌های محاسبه `XP` و `Level`، منطق بازگشایی جام‌ها (`Trophy Case`)، تخمین مصرف توکن و تولیدکننده‌های فایل‌های `.agent/rules/*.md`، `.agent/workflows/*.md` و `FastMCP` باید به‌صورت توابع خالص (Pure Functions) در پوشه `src/utils/` نوشته شده و دارای تست واحد در `src/utils/generators.test.ts` باشند.
- **قانون ممنوعیت کدهای ناقص (`Zero-Placeholder Policy`):** استفاده از عباراتی مانند `// TODO` یا خلاصه‌سازی کدها در مثال‌های آموزشی و استودیوها اکیداً ممنوع است. تمام کدهای پایتون (`FastAPI`، `SQLAlchemy 2.0 Async`، `Pydantic v2`، `Alembic`، `Pytest` و `FastMCP`) باید ۱۰۰٪ کامل و قابل اجرا باشند.

### ۲. قانون طلایی تایپوگرافی دوجهته (`RTL` + `LTR`)
- تمامی متون فارسی باید در کانتینرهای `dir="rtl"` با فونت `Vazirmatn` قرار بگیرند.
- تمامی اصطلاحات فنی انگلیسی، مسیر فایل‌ها (مانند `.agent/rules/backend.md`)، دستورات اسلش (`/safe-migration`) و اعداد تایمر/امتیازات در دل متون فارسی **الزاماً** باید درون تگ `<span dir="ltr" className="ltr-inline">` ایزوله شوند تا علامت‌های اسلش (`/`) و پرانتزها به هم نریزند.
- تمامی بلوک‌های کد چندخطی باید دارای `dir="ltr"` و کلاس `ltr-code` با فونت `JetBrains Mono` باشند.

### ۳. چک‌لیست الزامی پیش از ارسال Pull Request
پیش از ثبت نهایی PR، دستورات زیر را در ترمینال اجرا کرده و از پاس شدن تمام تست‌ها و بیلد پروژه اطمینان حاصل کنید:

</div>

```bash
npx tsx --test src/utils/generators.test.ts firestore.rules.test.ts
npx eslint firestore.rules
npm run lint
npm run build
```

---

## License

By contributing to **Google Antigravity Academy & Mission Control Studio**, you agree that your contributions will be licensed under the **Apache License 2.0** (see [`LICENSE`](./LICENSE)).
