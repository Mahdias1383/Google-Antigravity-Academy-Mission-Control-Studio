import { KnowledgeBaseEntryItem, KnowledgeBaseEntryCategory } from './generators';

export interface KnowledgeQuizOption {
  id: 'A' | 'B' | 'C' | 'D';
  textFa: string;
  textEn: string;
}

export interface KnowledgeQuizQuestion {
  id: string;
  docId: string;
  keyPath: string;
  topicFa: string;
  topicEn: string;
  difficulty: 'Intermediate' | 'Advanced' | 'Principal';
  questionFa: string;
  questionEn: string;
  options: KnowledgeQuizOption[];
  correctOptionIndex: number;
  explanationFa: string;
  explanationEn: string;
  xpReward: number;
  conceptTagId: string;
}

export interface QuizEvaluationResult {
  isCorrect: boolean;
  correctOptionIndex: number;
  earnedXp: number;
  explanationFa: string;
  explanationEn: string;
}

export interface QuizScoreSummary {
  totalQuestions: number;
  correctCount: number;
  incorrectCount: number;
  unansweredCount: number;
  accuracyPercent: number;
  totalPossibleXp: number;
  earnedXp: number;
  masteryTierFa: string;
  masteryTierEn: string;
  passed: boolean;
}

export const KB_QUIZ_XP_STORAGE_KEY = 'ag_kb_quiz_xp_v1';
export const KB_QUIZ_HISTORY_STORAGE_KEY = 'ag_kb_quiz_history_v1';

export const CURATED_KNOWLEDGE_QUIZ_BANK: KnowledgeQuizQuestion[] = [
  // 1. kb-user-state-sync
  {
    id: 'quiz-user-state-01',
    docId: 'kb-user-state-sync',
    keyPath: '.agent/knowledge-base/user-state.json',
    topicFa: 'مدیریت حافظه پایدار و رفع فراموشی بین‌نشستی',
    topicEn: 'Persistent User State & Cross-Session Memory',
    difficulty: 'Advanced',
    questionFa:
      'در معماری Google Antigravity، فایل `.agent/knowledge-base/user-state.json` چه نقشی در جلوگیری از «فراموشی بین‌نشستی» (Cross-Session Amnesia) ایفا می‌کند؟',
    questionEn:
      'In Google Antigravity architecture, what role does .agent/knowledge-base/user-state.json play in preventing Cross-Session Amnesia?',
    options: [
      {
        id: 'A',
        textFa: 'فقط کش موقت لاگ‌های بیلد برای جلوگیری از کامپایل مجدد است.',
        textEn: 'It is solely a temporary build cache to prevent recompilation.',
      },
      {
        id: 'B',
        textFa:
          'وضعیت تکامل‌یافته کاربر، ترجیحات تست و چک‌پوینت‌های تکمیل‌شده را ذخیره کرده و به عنوان لایه پایدار به پرامپت ایجنت تزریق می‌شود.',
        textEn:
          'It preserves user preferences, test requirements, and progression checkpoints as a persistent context layer across sessions.',
      },
      {
        id: 'C',
        textFa: 'کدهای سورس پروژه را با فرمت JSON فشرده می‌کند تا مصرف RAM کاهش یابد.',
        textEn: 'It minifies source code to reduce runtime RAM consumption.',
      },
      {
        id: 'D',
        textFa: 'کلیدهای خصوصی OAuth را برای اتصال به گوگل درایو ذخیره می‌کند.',
        textEn: 'It stores private OAuth credentials for Google Drive.',
      },
    ],
    correctOptionIndex: 1,
    explanationFa:
      'فایل user-state.json حافظه بلندمدت و فشرده ایجنت است که تصمیمات مهندسی قبلی، متغیرهای محیطی و ترجیحات کاربر را نگهداری کرده و مانع از فراموش شدن زمینه در نشست‌های جدید می‌شود.',
    explanationEn:
      'user-state.json acts as persistent semantic memory, retaining past decisions, testing paradigms, and state checkpoints without bloating the token budget.',
    xpReward: 40,
    conceptTagId: 'user-state-sync',
  },
  {
    id: 'quiz-user-state-02',
    docId: 'kb-user-state-sync',
    keyPath: '.agent/knowledge-base/user-state.json',
    topicFa: 'بهینه‌سازی بودجه توکن و هرس متادیتا',
    topicEn: 'Token Budget Allocation for Persistent Memory',
    difficulty: 'Principal',
    questionFa:
      'چرا توصیه می‌شود حجم توکن فایل `user-state.json` زیر ۵۰۰ توکن حفظ شود و متادیتای غیرضروری هرس گردد؟',
    questionEn:
      'Why must user-state.json remain under 500 tokens with aggressive pruning of redundant metadata?',
    options: [
      {
        id: 'A',
        textFa:
          'زیرا این فایل در هر نشست به عنوان System Prompt تزریق می‌شود و حجم زیاد آن پنجره توجه ایجنت را مسموم کرده و هزینه استنتاج را بالا می‌برد.',
        textEn:
          'Because it is loaded in every session; excessive weight causes Context Rot and starves the model of attention budget for real code.',
      },
      {
        id: 'B',
        textFa: 'سیستم‌عامل ویندوز فایل‌های JSON بزرگتر از ۵ کیلو‌بایت را قفل می‌کند.',
        textEn: 'Windows OS locks JSON files greater than 5KB.',
      },
      {
        id: 'C',
        textFa: 'پروتکل Git امکان Commit فایل‌های JSON بالای ۱۰۰ خط را ندارد.',
        textEn: 'Git cannot commit JSON files exceeding 100 lines.',
      },
      {
        id: 'D',
        textFa: 'برای جلوگیری از نشت رم در متد JSON.parse در مرورگرهای قدیمی.',
        textEn: 'To prevent memory leaks during JSON.parse in legacy browsers.',
      },
    ],
    correctOptionIndex: 0,
    explanationFa:
      'تمام فایل‌های پایگاه دانش فعال در پنجره زمینه قرار می‌گیرند. اگر حافظه وضعیت بیش از حد متورم شود، ایجنت دچار Context Rot شده و توجه کمتری به دستورات مستقیم تسک فعلی خواهد داشت.',
    explanationEn:
      'Persistent memory occupies high-priority context slots. Overblown states create Context Rot and degrade planning fidelity on complex code changes.',
    xpReward: 50,
    conceptTagId: 'user-state-sync',
  },

  // 2. kb-recent-session-pointer
  {
    id: 'quiz-recent-session-01',
    docId: 'kb-recent-session-pointer',
    keyPath: 'localStorage://ag_recent_session_v1',
    topicFa: 'بازیابی فوری وضعیت کاری و چک‌پوینت نشست',
    topicEn: 'Session Resume & Fast Checkpoint Reload',
    difficulty: 'Intermediate',
    questionFa:
      'هنگامی که کاربر مرورگر را پس از یک وقفه باز می‌کند، کلید `ag_recent_session_v1` چگونه تجربه کاربری یکپارچه را تضمین می‌کند؟',
    questionEn:
      'When an engineer reopens the workspace after a pause, how does ag_recent_session_v1 guarantee a seamless resume experience?',
    options: [
      {
        id: 'A',
        textFa: 'تمام ماژول‌های قبلی را ریست کرده و کاربر را به آزمون ورودی می‌فرستد.',
        textEn: 'It resets all progress and routes the user back to the orientation quiz.',
      },
      {
        id: 'B',
        textFa:
          'آخرین استودیوی مهندسی، ماژول در حال مطالعه و شناسه نشست را بازشناسی کرده و دیالوگ هوشمند ادامه مطالعه را فعال می‌سازد.',
        textEn:
          'It captures the exact module ID, active studio tab, and timestamp to offer an instant one-click resume dialog.',
      },
      {
        id: 'C',
        textFa: 'یک درخواست سوکت زنده به سرور GitHub برای ادغام شاخه‌ها ارسال می‌کند.',
        textEn: 'It opens a live socket to GitHub to merge open branches automatically.',
      },
      {
        id: 'D',
        textFa: 'تمام کَش Vite را پاک کرده و سرور لوکال را از نو بیلد می‌کند.',
        textEn: 'It clears the Vite cache and rebuilds the local server from scratch.',
      },
    ],
    correctOptionIndex: 1,
    explanationFa:
      'کلید ag_recent_session_v1 وضعیت دقیق آخرین تعامل کاربر (ماژول، استودیو، زمان) را ذخیره می‌کند تا بدون سردرگمی مستقیماً به ادامه تسک کاری خود بازگردد.',
    explanationEn:
      'The session checkpoint pointer tracks last-accessed module ID and studio mode, allowing instantaneous context restoration.',
    xpReward: 35,
    conceptTagId: 'user-state-sync',
  },

  // 3. kb-rule-sqlalchemy-async
  {
    id: 'quiz-rule-sql-01',
    docId: 'kb-rule-sqlalchemy-async',
    keyPath: '.agent/rules/01-sqlalchemy-async.md',
    topicFa: 'حاکمیت کانتکست و گاردریل‌های SQLAlchemy 2.0',
    topicEn: 'SQLAlchemy 2.0 Async Guardrails & Rule Scoping',
    difficulty: 'Advanced',
    questionFa:
      'قانون معماری `.agent/rules/01-sqlalchemy-async.md` به چه دلیل متد قدیمی `session.query()` را در ریپازیتوری‌های پایتون اکیداً منع می‌کند؟',
    questionEn:
      'Why does .agent/rules/01-sqlalchemy-async.md strictly forbid legacy session.query() in modern asynchronous repositories?',
    options: [
      {
        id: 'A',
        textFa:
          'زیرا `session.query()` عملیات مسدودکننده (Blocking Sync I/O) انجام می‌دهد و Event Loop سرور AsyncIO/FastAPI را قفل می‌کند.',
        textEn:
          'Because session.query() performs synchronous blocking I/O, freezing the AsyncIO/FastAPI event loop under load.',
      },
      {
        id: 'B',
        textFa: 'چون در پایتون ۳.۱۲ کلمه query به عنوان کلیدواژه رزرو شده زبان تعریف شده است.',
        textEn: 'Because Python 3.12 made "query" a reserved language keyword.',
      },
      {
        id: 'C',
        textFa: 'برای اینکه حجم فایل‌های دیتابیس SQLite افزایش پیدا نکند.',
        textEn: 'To prevent SQLite database file size inflation.',
      },
      {
        id: 'D',
        textFa: 'به دلیل اینکه کامپایلر Rust امکان بهینه‌سازی کدهای Sync را ندارد.',
        textEn: 'Because the Rust compiler cannot optimize synchronous Python code.',
      },
    ],
    correctOptionIndex: 0,
    explanationFa:
      'در SQLAlchemy 2.0 با موتورهای Asynchronous، باید حتماً از AsyncSession به همراه سازه‌های select() و await session.execute() استفاده شود تا جریان اجرای غیرهمگام مسدود نشود.',
    explanationEn:
      'Legacy session.query() forces synchronous I/O on the thread, defeating the purpose of FastAPI AsyncSession concurrency and introducing thread pool exhaustion.',
    xpReward: 45,
    conceptTagId: 'alembic-zero-downtime',
  },
  {
    id: 'quiz-rule-sql-02',
    docId: 'kb-rule-sqlalchemy-async',
    keyPath: '.agent/rules/01-sqlalchemy-async.md',
    topicFa: 'استراتژی فعال‌سازی قوانین (Activation Modes)',
    topicEn: 'Rule Activation Modes (Always On vs Glob)',
    difficulty: 'Principal',
    questionFa:
      'اگر قانونی با الگوی Glob مانند `glob: "src/repositories/**/*.py"` تنظیم شود، ایجنت در چه زمانی آن را بارگذاری می‌کند؟',
    questionEn:
      'If a rule is configured with glob: "src/repositories/**/*.py", when does Antigravity inject it into the agent context?',
    options: [
      {
        id: 'A',
        textFa: 'همیشه و در تمام فایل‌های پروژه از جمله CSS و HTML بارگذاری می‌شود.',
        textEn: 'Always and in every project file, including CSS and HTML.',
      },
      {
        id: 'B',
        textFa:
          'فقط زمانی که ایجنت در حال ویرایش، خواندن یا ایجاد فایلی در مسیر تطبیق‌یافته `src/repositories/` باشد.',
        textEn:
          'Only when the agent edits, inspects, or generates files matching the specified repository glob path.',
      },
      {
        id: 'C',
        textFa: 'تنها وقتی کاربر دستور /turbo را به صورت دستی تایپ کند.',
        textEn: 'Only when the user manually enters the /turbo slash command.',
      },
      {
        id: 'D',
        textFa: 'فقط در صورت بروز خطای 500 در تله‌متری سرور.',
        textEn: 'Only when a 500 server error occurs in telemetry.',
      },
    ],
    correctOptionIndex: 1,
    explanationFa:
      'حالت Glob Rule باعث می‌شود قوانین تخصصی تنها در فیلتر مسیرهای مربوطه فعال شوند؛ این کار مصرف توکن را به حداقل رسانده و از تداخل قوانین جلوگیری می‌کند.',
    explanationEn:
      'Glob scoping ensures domain rules activate strictly when target paths are touched, conserving token budget and avoiding irrelevant constraint clashes.',
    xpReward: 45,
    conceptTagId: 'alembic-zero-downtime',
  },

  // 4. kb-stale-legacy-celery-context
  {
    id: 'quiz-stale-celery-01',
    docId: 'kb-stale-legacy-celery-context',
    keyPath: '.agent/knowledge-base/legacy-celery-v4-migration.md',
    topicFa: 'ریشه‌یابی و درمان پوسیدگی زمینه (Context Rot)',
    topicEn: 'Context Rot Root Causes & Stale Memory Risks',
    difficulty: 'Advanced',
    questionFa:
      'چرا نگهداری مستندات منسوخ Celery v4 در حافظه پایگاه دانش (`.agent/knowledge-base`) یک ریسک بحرانی برای Context Rot به شمار می‌رود؟',
    questionEn:
      'Why does retaining obsolete Celery v4 documentation in .agent/knowledge-base pose a critical Context Rot risk?',
    options: [
      {
        id: 'A',
        textFa:
          'زیرا ایجنت کدهای قدیمی را به عنوان مرجع معتبر دانسته و در تسک‌های جدید، دکوراتورها و الگوهای منقضی‌شده منسوخ را تولید می‌کند.',
        textEn:
          'Because the agent treats stale docs as truth, hallucinating deprecated decorators and conflicting broker configs in new tasks.',
      },
      {
        id: 'B',
        textFa: 'چون کلمه Celery باعث خطای تایپ اسکریپت در فایل‌های React می‌شود.',
        textEn: 'Because the word Celery throws TypeScript errors in React components.',
      },
      {
        id: 'C',
        textFa: 'برای اینکه حجم هارد دیسک سرورهای ابری پر نشود.',
        textEn: 'To prevent hard disk exhaustion on cloud servers.',
      },
      {
        id: 'D',
        textFa: 'چون پروتکل RabbitMQ دیگر توسط مرورگرهای مدرن پشتیبانی نمی‌شود.',
        textEn: 'Because RabbitMQ is no longer supported by modern web browsers.',
      },
    ],
    correctOptionIndex: 0,
    explanationFa:
      'پوسیدگی زمینه (Context Rot) زمانی رخ می‌دهد که اطلاعات تاریخ‌گذشته در حافظه ایجنت باقی بماند. ایجنت بر اساس مستندات موجود اقدام به نوشتن کد می‌کند و اگر مستند غلط باشد، رفتارهای متناقض و باگ‌های خاموش تولید خواهد شد.',
    explanationEn:
      'Stale context poisons model reasoning. When obsolete frameworks linger in KB memory, the agent synthesizes deprecated APIs contrary to modern project standards.',
    xpReward: 40,
    conceptTagId: 'context-rot-hygiene',
  },

  // 5. kb-pr-inline-audit-directives
  {
    id: 'quiz-pr-audit-01',
    docId: 'kb-pr-inline-audit-directives',
    keyPath: '.agent/knowledge-base/pr-review-gate-directives.json',
    topicFa: 'ممیزی پیش از اجرا و مهار دروازه‌های امنیتی در آرتیفکت',
    topicEn: 'Pre-Execution Audits & PR-Style Review Gates',
    difficulty: 'Principal',
    questionFa:
      'در متدولوژی Google Antigravity، چگونه کامنت‌های ممیزی PR-Style روی `implementation_plan.md` مانع از اجرای تغییرات پرخطر می‌شوند؟',
    questionEn:
      'In Google Antigravity methodology, how do inline PR-style comments on implementation_plan.md halt risky changes before terminal execution?',
    options: [
      {
        id: 'A',
        textFa:
          'کاربر مستقیماً روی خطوط پلن کامنت گذاشته یا گیت‌های بازبینی را رد می‌کند؛ تا زمان تأیید مهندس ارشد، ایجنت هیچ دستور ترمینال یا تغییری را اجرا نمی‌کند.',
        textEn:
          'Engineers annotate lines or request revisions on implementation_plan.md; the agent cannot trigger irreversible mutations until sign-off.',
      },
      {
        id: 'B',
        textFa: 'با ارسال ایمیل خودکار به مدیر محصول و دریافت امضای دیجیتال.',
        textEn: 'By sending an automated email to the product manager for digital signature.',
      },
      {
        id: 'C',
        textFa: 'با متوقف کردن کامل سرور دیتابیس در حالت Read-Only.',
        textEn: 'By temporarily putting the database in read-only maintenance mode.',
      },
      {
        id: 'D',
        textFa: 'با قفل کردن فایل package.json با کلید GPG.',
        textEn: 'By locking the package.json file with a private GPG key.',
      },
    ],
    correctOptionIndex: 0,
    explanationFa:
      'بررسی PR-Style روی آرتیفکت implementation_plan.md خط‌به‌خط انجام می‌شود و به معمار اجازه می‌دهد پیش از لمس کدهای پروداکشن یا اجرای اسکریپت‌های مخرب در ترمینال، ایجنت را متوقف و هدایت کند.',
    explanationEn:
      'Inline PR-style review enforces human-in-the-loop governance before tool execution. Critical security gates halt autonomous changes until approved.',
    xpReward: 50,
    conceptTagId: 'pr-review-gate',
  },

  // 6. kb-stale-monolith-trace-dump
  {
    id: 'quiz-stale-trace-01',
    docId: 'kb-stale-monolith-trace-dump',
    keyPath: '.agent/knowledge-base/stale-webpack4-trace-log.txt',
    topicFa: 'هرس لاگ‌های حجیم و آزادسازی سقف توکن',
    topicEn: 'Telemetry Pruning & Token Budget Recovery',
    difficulty: 'Intermediate',
    questionFa:
      'حذف لاگ‌های منسوخ چند مگابایتی (مانند `stale-webpack4-trace-log.txt`) از حافظه پایگاه دانش چه تأثیر مستقیمی بر کارایی ایجنت دارد؟',
    questionEn:
      'What is the immediate impact of pruning heavy legacy build logs (such as stale-webpack4-trace-log.txt) from the knowledge base?',
    options: [
      {
        id: 'A',
        textFa:
          'آزادسازی فوری صدها تا هزاران توکن در پنجره زمینه و بالا رفتن چشمگیر دقت ایجنت در حالت Planning Mode.',
        textEn:
          'Immediate recovery of high token budget, eliminating noise and vastly enhancing Planning Mode reasoning fidelity.',
      },
      {
        id: 'B',
        textFa: 'کاهش سرعت دانلود فایل‌های فونت از گوگل فونتز.',
        textEn: 'Slowing down Google Fonts web download speeds.',
      },
      {
        id: 'C',
        textFa: 'غیرفعال شدن اکستنشن‌های VS Code در محیط لوکال.',
        textEn: 'Deactivation of VS Code local extensions.',
      },
      {
        id: 'D',
        textFa: 'نیاز به فرمت کردن مجدد دیسک ماشین مجازی.',
        textEn: 'Requirement to reformat the virtual machine disk drive.',
      },
    ],
    correctOptionIndex: 0,
    explanationFa:
      'لاگ‌های متنی خام بزرگترین دشمن پنجره زمینه هستند. هرس آن‌ها باعث می‌شود توکن‌های باارزش مدل صرفاً به قوانین کلیدی و کد جاری اختصاص یابد و خطر فراموشی دستورات مرتفع گردد.',
    explanationEn:
      'Raw trace dumps saturate context tokens without adding actionable semantic value. Pruning them restores focus on primary engineering goals.',
    xpReward: 35,
    conceptTagId: 'context-rot-hygiene',
  },
];

/**
 * Generates or retrieves questions for a specific knowledge base entry item.
 * If dedicated questions exist for the document, returns them.
 * If it is a custom document without pre-built questions, synthesizes high-quality questions
 * grounded in the document's category, keyPath, and content.
 */
export function getKnowledgeQuizQuestionsForDoc(
  doc: KnowledgeBaseEntryItem,
  customQuestions?: KnowledgeQuizQuestion[]
): KnowledgeQuizQuestion[] {
  const bank = customQuestions && customQuestions.length > 0
    ? customQuestions
    : CURATED_KNOWLEDGE_QUIZ_BANK;

  // Direct ID or keyPath match
  const matched = bank.filter(
    (q) => q.docId === doc.id || q.keyPath === doc.keyPath
  );

  if (matched.length > 0) {
    return matched;
  }

  // Synthesize dedicated questions dynamically for custom documents
  return generateDynamicQuestionsForCustomDoc(doc);
}

/**
 * Dynamic question generator for arbitrary or user-added documentation entries.
 */
export function generateDynamicQuestionsForCustomDoc(
  doc: KnowledgeBaseEntryItem
): KnowledgeQuizQuestion[] {
  const cleanSnippet = (doc.contentSnippet || '').slice(0, 140).trim();
  const categoryTitle =
    doc.category === 'architecture-rule'
      ? 'قوانین و استانداردهای معماری'
      : doc.category === 'workflow-sop'
      ? 'دستورالعمل‌ها و ورک‌فلوهای عملیاتی'
      : doc.category === 'pr-review-directive'
      ? 'ممیزی دروازه‌های امنیتی PR'
      : doc.category === 'mcp-schema'
      ? 'طرحواره‌های ابزار FastMCP'
      : 'پایگاه داده وضعیت نشست کاربر';

  const categoryTitleEn =
    doc.category === 'architecture-rule'
      ? 'Architecture Guardrail'
      : doc.category === 'workflow-sop'
      ? 'Standard Operating Workflow'
      : doc.category === 'pr-review-directive'
      ? 'PR Review Security Gate'
      : doc.category === 'mcp-schema'
      ? 'FastMCP Schema & Tooling'
      : 'User Session State Memory';

  return [
    {
      id: `quiz-dyn-${doc.id}-01`,
      docId: doc.id,
      keyPath: doc.keyPath,
      topicFa: `تحلیل سند ${doc.titleFa}`,
      topicEn: `${doc.titleEn} Architectural Invariants`,
      difficulty: 'Advanced',
      questionFa: `بر اساس سند «${doc.titleFa}» با مسیر \`${doc.keyPath}\`، هدف اصلی این متغیر یا قانون در معماری پروژه چیست؟`,
      questionEn: `Based on "${doc.titleEn}" at path \`${doc.keyPath}\`, what is the primary invariant enforced in the project architecture?`,
      options: [
        {
          id: 'A',
          textFa:
            'حفظ انطباق دقیق با قراردادهای تعریف‌شده و جلوگیری از نقض اصول معماری توسط ایجنت حین توسعه خودکار.',
          textEn:
            'Ensuring strict compliance with defined invariants and preventing architectural deviations during autonomous agent turns.',
        },
        {
          id: 'B',
          textFa: 'تولید فایل‌های بک‌آپ موقت روی دسکتاپ کاربر برای بازیابی دستی.',
          textEn: 'Creating temporary desktop backup files for manual recovery.',
        },
        {
          id: 'C',
          textFa: 'غیرفعال‌سازی تمام تست‌های واحد قبل از دستورات ترمینال.',
          textEn: 'Disabling all unit tests prior to terminal command runs.',
        },
        {
          id: 'D',
          textFa: 'افزایش عمدی حجم توکن برای فعال‌سازی مدل‌های سنگین‌تر.',
          textEn: 'Intentionally bloating token count to force heavier models.',
        },
      ],
      correctOptionIndex: 0,
      explanationFa: `این سند تحت دسته‌بندی ${categoryTitle} قرار دارد و مأموریت آن تثبیت خطوط قرمز و تضمین پایداری سیستم در تعاملات ایجنت است: «${cleanSnippet}»`,
      explanationEn: `Categorized under ${categoryTitleEn}, this entry establishes deterministic boundaries to maintain workspace integrity.`,
      xpReward: 45,
      conceptTagId: 'user-state-sync',
    },
    {
      id: `quiz-dyn-${doc.id}-02`,
      docId: doc.id,
      keyPath: doc.keyPath,
      topicFa: `بهداشت زمینه و جلوگیری از کهنگی سند ${doc.titleEn}`,
      topicEn: `Context Hygiene & Staleness Management for ${doc.titleEn}`,
      difficulty: 'Intermediate',
      questionFa: `اگر اطلاعات مندرج در \`${doc.keyPath}\` با تکامل پروژه دچار تغییر شود، بهترین اقدام برای پیشگیری از Context Rot چیست؟`,
      questionEn: `If specifications in \`${doc.keyPath}\` change as the codebase evolves, what is the best practice to prevent Context Rot?`,
      options: [
        {
          id: 'A',
          textFa: 'رها کردن نسخه قبلی بدون تغییر، تا تاریخچه تغییرات دست‌نخورده بماند.',
          textEn: 'Leaving the outdated version intact so history is untouched.',
        },
        {
          id: 'B',
          textFa:
            'به‌روزرسانی سریع محتوا با اطلاعات جدید یا هرس کامل مدخل در صورت منسوخ شدن کل سناریو.',
          textEn:
            'Promptly updating the snippet with current specs or pruning the entry entirely if deprecated.',
        },
        {
          id: 'C',
          textFa: 'تغییر پسوند فایل به txt بدون ویرایش محتوا.',
          textEn: 'Changing the file extension to .txt without editing content.',
        },
        {
          id: 'D',
          textFa: 'پاک کردن مخزن Git و ایجاد ریپازیتوری جدید.',
          textEn: 'Deleting the Git repository and initializing a fresh one.',
        },
      ],
      correctOptionIndex: 1,
      explanationFa:
        'بهداشت کانتکست ایجاب می‌کند هر مدخل پایگاه دانش همواره با واقعیت فعلی سورس‌کد منطبق باشد تا مدل بر اساس فرضیات کهنه کد نویسی نکند.',
      explanationEn:
        'Active context hygiene demands immediate updates or pruning of stale knowledge base entries to avert hallucinated implementations.',
      xpReward: 40,
      conceptTagId: 'context-rot-hygiene',
    },
  ];
}

/**
 * Pure evaluation function for a single question response.
 */
export function evaluateQuizAnswer(
  question: KnowledgeQuizQuestion,
  selectedOptionIndex: number
): QuizEvaluationResult {
  const isCorrect = selectedOptionIndex === question.correctOptionIndex;
  return {
    isCorrect,
    correctOptionIndex: question.correctOptionIndex,
    earnedXp: isCorrect ? question.xpReward : 0,
    explanationFa: question.explanationFa,
    explanationEn: question.explanationEn,
  };
}

/**
 * Calculates aggregate score metrics, accuracy percentage, and mastery rank for a set of answers.
 */
export function calculateQuizScoreSummary(
  questions: KnowledgeQuizQuestion[],
  answers: Record<string, number>
): QuizScoreSummary {
  const totalQuestions = questions.length;
  let correctCount = 0;
  let incorrectCount = 0;
  let unansweredCount = 0;
  let totalPossibleXp = 0;
  let earnedXp = 0;

  for (const q of questions) {
    totalPossibleXp += q.xpReward;
    const selectedIdx = answers[q.id];
    if (selectedIdx === undefined || selectedIdx === null) {
      unansweredCount += 1;
    } else if (selectedIdx === q.correctOptionIndex) {
      correctCount += 1;
      earnedXp += q.xpReward;
    } else {
      incorrectCount += 1;
    }
  }

  const answeredCount = correctCount + incorrectCount;
  const accuracyPercent =
    answeredCount > 0 ? Math.round((correctCount / answeredCount) * 100) : 0;

  let masteryTierFa = 'کارآموز پایگاه دانش (KB Trainee)';
  let masteryTierEn = 'Knowledge Base Trainee';
  let passed = false;

  if (totalQuestions > 0 && correctCount === totalQuestions) {
    masteryTierFa = 'معمار ارشد دانشی (Principal Antigravity Auditor)';
    masteryTierEn = 'Principal Antigravity Auditor';
    passed = true;
  } else if (accuracyPercent >= 80 && correctCount >= 2) {
    masteryTierFa = 'متخصص گاردریل و پایگاه دانش (Lead KB Specialist)';
    masteryTierEn = 'Lead KB Specialist';
    passed = true;
  } else if (accuracyPercent >= 50 && correctCount >= 1) {
    masteryTierFa = 'پژوهشگر معتبر (Certified KB Researcher)';
    masteryTierEn = 'Certified KB Researcher';
    passed = true;
  }

  return {
    totalQuestions,
    correctCount,
    incorrectCount,
    unansweredCount,
    accuracyPercent,
    totalPossibleXp,
    earnedXp,
    masteryTierFa,
    masteryTierEn,
    passed,
  };
}

/**
 * Reads the total accumulated quiz XP from localStorage safely.
 */
export function getAccumulatedQuizXpFromStorage(): number {
  if (typeof window === 'undefined') return 0;
  try {
    const raw = window.localStorage.getItem(KB_QUIZ_XP_STORAGE_KEY);
    if (!raw) return 0;
    const parsed = parseInt(raw, 10);
    return isNaN(parsed) ? 0 : Math.max(0, parsed);
  } catch {
    return 0;
  }
}

/**
 * Safely persists rewarded XP to localStorage and returns updated total.
 */
export function persistRewardedQuizXpToStorage(xpGained: number): number {
  if (typeof window === 'undefined') return Math.max(0, xpGained);
  try {
    const current = getAccumulatedQuizXpFromStorage();
    const next = current + Math.max(0, xpGained);
    window.localStorage.setItem(KB_QUIZ_XP_STORAGE_KEY, String(next));
    return next;
  } catch {
    return Math.max(0, xpGained);
  }
}
