import React, { useState } from 'react';
import {
  Search,
  Send,
  ExternalLink,
  BookOpen,
  Sparkles,
  FileCode,
  X,
} from 'lucide-react';
import {
  ALL_CURRICULUM_MODULES,
  CHEAT_SHEET_CARDS,
  ARCHITECT_SCENARIOS,
} from '../data/curriculumIndex';

export const GlobalCommandSearchModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onNavigateToModule: (moduleId: string) => void;
  onNavigateToStudio: (
    studioId:
      | 'achievements'
      | 'simulator'
      | 'guardrails'
      | 'mcp'
      | 'cheatsheets'
      | 'scenarios'
      | 'ai-architect'
      | 'knowledge-base'
  ) => void;
}> = ({ isOpen, onClose, onNavigateToModule, onNavigateToStudio }) => {
  const [query, setQuery] = useState<string>('');

  if (!isOpen) return null;

  const q = query.trim().toLowerCase();

  const matchedModules = ALL_CURRICULUM_MODULES.filter(
    (m) =>
      !q ||
      m.titleFa.toLowerCase().includes(q) ||
      m.titleEn.toLowerCase().includes(q) ||
      m.summaryFa.toLowerCase().includes(q) ||
      m.subSections.some(
        (s) =>
          s.titleFa.toLowerCase().includes(q) ||
          s.titleEn.toLowerCase().includes(q)
      )
  );

  const studiosList: {
    id:
      | 'achievements'
      | 'simulator'
      | 'guardrails'
      | 'mcp'
      | 'cheatsheets'
      | 'scenarios'
      | 'ai-architect'
      | 'knowledge-base';
    titleFa: string;
    titleEn: string;
  }[] = [
    {
      id: 'knowledge-base',
      titleFa: 'کاوشگر پایگاه دانش (.agent/knowledge-base) و مهار Context Rot',
      titleEn: 'Knowledge Base Explorer & Context Rot Bento Grid',
    },
    {
      id: 'achievements',
      titleFa: 'دستاوردها، پیوستگی مطالعه و کارنامه گواهینامه (Achievements & Certification)',
      titleEn: 'Badges, Study Streak Counter & Shareable Progress Report Card',
    },
    {
      id: 'simulator',
      titleFa: 'شبیه‌ساز زنده محیط Antigravity (Mission Control Simulator)',
      titleEn: 'Interactive Artifact Review & Execution Simulator',
    },
    {
      id: 'guardrails',
      titleFa: 'استودیوی طراحی Rule، Workflow و پالیسی ترمینال',
      titleEn: '.agent/rules & /slash-command Automation Studio',
    },
    {
      id: 'mcp',
      titleFa: 'استودیوی بصری ساخت سرور و کانفیگ MCP',
      titleEn: 'mcp_config.json & FastMCP Python Generator',
    },
    {
      id: 'cheatsheets',
      titleFa: 'مرکز چیت‌شیت‌های تعاملی و خروجی PDF موضوعی',
      titleEn: 'Interactive Cheat Sheets & Modular PDF Exporter',
    },
    {
      id: 'scenarios',
      titleFa: 'آزمایشگاه ۸ چالش معماری (Principal Architect Lab)',
      titleEn: '8 Production Architectural Case Studies',
    },
    {
      id: 'ai-architect',
      titleFa: 'دستیار جستجوی مستندات زنده و تحلیلگر معماری',
      titleEn: 'Live Search-Grounded Documentation & Deep Reasoning',
    },
  ];

  const matchedStudios = studiosList.filter(
    (s) => !q || s.titleFa.toLowerCase().includes(q) || s.titleEn.toLowerCase().includes(q)
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/75 backdrop-blur-sm pt-16 p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Global Command Search"
    >
      <div className="w-full max-w-2xl rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl overflow-hidden">
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-200 dark:border-slate-800">
          <Search className="w-4 h-4 text-blue-500 shrink-0" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="جستجوی فصل، مفهوم (مثلاً Supercomplete، task.md، FastMCP، Worktree)..."
            className="flex-1 bg-transparent text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none"
          />
          <button
            type="button"
            onClick={onClose}
            aria-label="Close search modal"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="max-h-96 overflow-y-auto p-3 space-y-4">
          {matchedModules.length > 0 && (
            <div className="space-y-1.5">
              <div className="px-2 text-[11px] font-bold text-slate-400">
                فصل‌های آموزشی (8 Modules)
              </div>
              {matchedModules.map((mod) => (
                <button
                  key={mod.id}
                  type="button"
                  onClick={() => {
                    onNavigateToModule(mod.id);
                    onClose();
                  }}
                  className="w-full text-right p-2.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-between gap-3 transition-colors cursor-pointer"
                >
                  <div>
                    <div className="text-xs font-bold text-slate-900 dark:text-white">
                      فصل {mod.number}: {mod.titleFa}
                    </div>
                    <div dir="ltr" className="ltr-inline text-[11px] font-mono text-slate-500">
                      {mod.titleEn}
                    </div>
                  </div>
                  <BookOpen className="w-4 h-4 text-blue-500 shrink-0" />
                </button>
              ))}
            </div>
          )}

          {matchedStudios.length > 0 && (
            <div className="space-y-1.5">
              <div className="px-2 text-[11px] font-bold text-slate-400">
                استودیوهای مهندسی و ابزارهای تعاملی (Interactive Studios)
              </div>
              {matchedStudios.map((st) => (
                <button
                  key={st.id}
                  type="button"
                  onClick={() => {
                    onNavigateToStudio(st.id);
                    onClose();
                  }}
                  className="w-full text-right p-2.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-between gap-3 transition-colors cursor-pointer"
                >
                  <div>
                    <div className="text-xs font-bold text-slate-900 dark:text-white">
                      {st.titleFa}
                    </div>
                    <div dir="ltr" className="ltr-inline text-[11px] font-mono text-blue-500">
                      {st.titleEn}
                    </div>
                  </div>
                  <FileCode className="w-4 h-4 text-emerald-500 shrink-0" />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export const GroundedAiArchitectCopilot: React.FC = () => {
  const [prompt, setPrompt] = useState<string>(
    'چگونه در Google Antigravity با استفاده از .agent/workflows/safe-migration.md و Browser Subagent یک مایگریشن Alembic بدون قفل شدن جدول در PostgreSQL اجرا و صحت‌سنجی کنیم؟'
  );
  const [mode, setMode] = useState<'search-grounding' | 'high-thinking'>('search-grounding');
  const [loading, setLoading] = useState<boolean>(false);
  const [answer, setAnswer] = useState<string>(
    `### معماری پیشنهادی اجرای ایمن مایگریشن با \`/safe-migration\` و \`Browser Subagent\`

1. **تعریف گاردریل در \`.agent/rules/01-fastapi-sqlalchemy-async.md\`:**
   - الزام به استفاده از \`postgresql_concurrently=True\` برای ساخت ایندکس‌ها در جداول پرترافیک به همراه \`op.get_bind().execution_options(isolation_level="AUTOCOMMIT")\`.
2. **اجرای پایپ‌لاین \`/safe-migration\` در \`.agent/workflows/safe-migration.md\`:**
   - گام اول با دایرکتیو \`// turbo\` دستور \`poetry run alembic heads\` را بررسی می‌کند تا از نبود دو شاخه موازی (Branched Heads) اطمینان حاصل شود.
   - گام چهارم چرخه برگشت‌پذیری کامل (\`upgrade head -> downgrade -1 -> upgrade head\`) را روی دیتابیس تست اجرا می‌نماید.
3. **صحت‌سنجی نهایی با \`Browser Subagent\`:**
   - پس از اعمال مایگریشن، ساب‌ایجنت مرورگر داشبورد گزارش‌گیری را باز کرده، استریم شبکه را برای عدم بروز خطای \`422\` یا \`500\` شنود می‌کند و ویدیوی \`WebP\` را در \`walkthrough.md\` ثبت می‌نماید.`
  );
  const [sources, setSources] = useState<{ title: string; uri: string }[]>([
    { title: 'Google Antigravity Official Documentation — Artifacts & Workflows', uri: 'https://antigravity.google/docs' },
  ]);

  const handleQuerySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;
    setLoading(true);
    try {
      const response = await fetch('/api/antigravity/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, mode }),
      });
      const data = await response.json();
      if (data.text) {
        setAnswer(data.text);
      }
      if (Array.isArray(data.sources) && data.sources.length > 0) {
        setSources(data.sources);
      }
    } catch {
      // Retain deterministic architectural reference output if offline
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/75 p-6 sm:p-8 space-y-5">
        <div className="border-b border-slate-200 dark:border-slate-800 pb-4">
          <div className="text-xs font-bold text-blue-600 dark:text-blue-400">
            کاوشگر هوشمند مستندات با Google Search Grounding و استدلال عمیق
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-1">
            تحلیلگر معماری و جستجوگر زنده مستندات Google Antigravity
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-1">
            پاسخگویی به سوالات پیچیده معماری بر اساس مستندات رسمی <code dir="ltr" className="ltr-inline">https://antigravity.google/docs</code> با پشتیبانی از ابزار <code dir="ltr" className="ltr-inline">googleSearch</code> (مدل <code dir="ltr" className="ltr-inline">gemini-3.8-flash</code>) و استدلال عمیق.
          </p>
        </div>

        <form onSubmit={handleQuerySubmit} className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setMode('search-grounding')}
              dir="ltr"
              className={`ltr-inline px-3.5 py-1.5 rounded-lg text-xs font-mono font-semibold cursor-pointer ${
                mode === 'search-grounding'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
              }`}
            >
              Google Search Grounding (gemini-3.8-flash)
            </button>
            <button
              type="button"
              onClick={() => setMode('high-thinking')}
              dir="ltr"
              className={`ltr-inline px-3.5 py-1.5 rounded-lg text-xs font-mono font-semibold cursor-pointer ${
                mode === 'high-thinking'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
              }`}
            >
              Deep Architectural Thinking (ThinkingLevel.HIGH)
            </button>
          </div>

          <div className="flex flex-col sm:flex-row gap-2.5">
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="سوال معماری خود درباره Google Antigravity را بنویسید..."
              className="flex-1 px-4 py-2.5 text-xs sm:text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white"
            />
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-bold flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap"
            >
              <Send className="w-4 h-4" />
              <span>{loading ? 'در حال تحلیل و جستجو...' : 'ارسال پرسش معماری'}</span>
            </button>
          </div>
        </form>

        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950 p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2.5 text-xs font-bold text-blue-600 dark:text-blue-400">
            <span>پاسخ سنتزشده معمار سیستم:</span>
            <span dir="ltr" className="ltr-inline font-mono">
              {mode === 'search-grounding' ? 'Grounded via Google Search' : 'ThinkingLevel.HIGH'}
            </span>
          </div>
          <div className="text-xs sm:text-sm leading-7 text-slate-800 dark:text-slate-200 whitespace-pre-wrap">
            {answer}
          </div>

          {sources.length > 0 && (
            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-1.5">
              <div className="text-[11px] font-bold text-slate-500">
                منابع و پیوندهای مستندات (Citations):
              </div>
              <div className="flex flex-wrap gap-2">
                {sources.map((src, i) => (
                  <a
                    key={i}
                    href={src.uri}
                    target="_blank"
                    rel="noreferrer"
                    dir="ltr"
                    className="ltr-inline inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-blue-500/10 text-blue-500 hover:underline text-xs font-mono"
                  >
                    <span>{src.title}</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
