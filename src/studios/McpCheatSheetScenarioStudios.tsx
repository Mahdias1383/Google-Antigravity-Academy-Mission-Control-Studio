import React, { useState } from 'react';
import {
  Copy,
  Check,
  Search,
  Award,
  CheckCircle2,
  XCircle,
  RotateCcw,
} from 'lucide-react';
import { McpIntegrationSelection } from '../types/curriculum';
import {
  buildMcpConfigJson,
  buildFastMcpPythonCode,
} from '../utils/generators';
import {
  CHEAT_SHEET_CARDS,
  ARCHITECT_SCENARIOS,
} from '../data/curriculumIndex';
import {
  ExportSectionPdfButton,
  PrintableDocumentPayload,
} from '../components/CodeAndPdfTools';
import { useLanguage } from '../context/LanguageContext';
import {
  CHEAT_SHEET_ITEM_EN_MAP,
  SCENARIO_EN_MAP,
} from '../utils/curriculumEnglishContent';

export const McpVisualStudio: React.FC<{
  onExportPdf: (payload: PrintableDocumentPayload) => void;
}> = ({ onExportPdf }) => {
  const { language, isRTL } = useLanguage();
  const [selection, setSelection] = useState<McpIntegrationSelection>({
    postgres: true,
    github: true,
    opensearchTelemetry: true,
    rocketchatAlert: true,
    redisCache: false,
    envVars: {
      postgresUrl: 'postgresql://antigravity_ro:readonly@10.24.0.15:5432/core_ledger',
      opensearchUrl: 'https://opensearch.internal.corp:9200',
      rocketchatWebhook: 'https://chat.internal.corp/hooks/ag-deployments',
      githubTokenEnv: 'GITHUB_ENTERPRISE_PAT',
    },
  });
  const [activeCodeTab, setActiveCodeTab] = useState<'json' | 'python'>('json');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const jsonOutput = buildMcpConfigJson(selection);
  const pythonOutput = buildFastMcpPythonCode(selection);

  const handleCopy = (content: string, key: string) => {
    navigator.clipboard?.writeText(content);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1800);
  };

  const mcpPdfPayload: PrintableDocumentPayload = {
    titleFa: 'مشخصات سرور و پیکربندی پروتکل MCP سازمانی',
    titleEn: 'Enterprise MCP Configuration (mcp_config.json) & FastMCP Server',
    subtitleOrCategory: 'Model Context Protocol · stdio & FastMCP Python',
    sections: [
      {
        headingFa: '۱. فایل پیکربندی کلاینت (~/.gemini/antigravity/mcp_config.json)',
        headingEn: 'mcp_config.json',
        codeBlocks: [
          {
            filename: 'mcp_config.json',
            language: 'json',
            code: jsonOutput,
          },
        ],
      },
      {
        headingFa: '۲. کد کامل سرور پایتون (mcp_servers/telemetry_and_alert_mcp.py)',
        headingEn: 'FastMCP Async Server Implementation',
        codeBlocks: [
          {
            filename: 'mcp_servers/telemetry_and_alert_mcp.py',
            language: 'python',
            code: pythonOutput,
          },
        ],
      },
    ],
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="rounded-2xl border border-slate-200/80 dark:border-white/[0.07] bg-white dark:bg-[#0c121e] p-6 sm:p-8 space-y-5 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200/70 dark:border-white/[0.06] pb-4">
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <span className="font-bold text-blue-600 dark:text-blue-400">
              {language === 'en' ? 'Studio 03' : 'استودیو ۰۳'}
            </span>
            <span aria-hidden="true" className="opacity-40">·</span>
            <span dir="ltr" className="ltr-inline font-mono">
              Model Context Protocol (MCP) · FastMCP Python
            </span>
          </div>
          <ExportSectionPdfButton
            label={language === 'en' ? 'Export Section PDF' : 'دریافت PDF این بخش'}
            payload={mcpPdfPayload}
            onExport={onExportPdf}
          />
        </div>

        <div className="space-y-2.5">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            {language === 'en' ? (
              <>Visual Studio for Python <code dir="ltr" className="ltr-inline">FastMCP</code> &amp; <code dir="ltr" className="ltr-inline">mcp_config.json</code></>
            ) : (
              <>استودیوی بصری ساخت سرور پایتون <code dir="ltr" className="ltr-inline">FastMCP</code> و <code dir="ltr" className="ltr-inline">mcp_config.json</code></>
            )}
          </h1>
          <p className="text-xs sm:text-sm leading-7 text-slate-600 dark:text-slate-300 max-w-4xl">
            {language === 'en' ? (
              <>Select your infrastructure connectors to generate both client <code dir="ltr" className="ltr-inline">mcp_config.json</code> and full async Python server code with <code dir="ltr" className="ltr-inline">httpx.AsyncClient</code> in real time.</>
            ) : (
              <>سرویس‌های زیرساختی سازمان خود را انتخاب کنید تا هم فایل پیکربندی <code dir="ltr" className="ltr-inline">mcp_config.json</code> و هم کد کامل سرور پایتون با <code dir="ltr" className="ltr-inline">httpx.AsyncClient</code> به صورت بلادرنگ تولید شود.</>
            )}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-2">
          {/* Left Configuration Controls (5 Cols) */}
          <div className="lg:col-span-5 space-y-4">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              {language === 'en' ? '1. Select MCP Connectors & Tools:' : '۱. انتخاب کانکتورها و ابزارهای MCP:'}
            </h2>
            <div className="space-y-2">
              {(
                [
                  { key: 'postgres', label: 'PostgreSQL Read-Only Inspector (@modelcontextprotocol/server-postgres)' },
                  { key: 'github', label: 'GitHub Enterprise PR & Issue Context (@modelcontextprotocol/server-github)' },
                  { key: 'opensearchTelemetry', label: 'OpenSearch 5xx Log Query Tool (FastMCP @mcp.tool)' },
                  { key: 'rocketchatAlert', label: 'Rocket.Chat Walkthrough Dispatcher (FastMCP @mcp.tool)' },
                  { key: 'redisCache', label: 'Redis Keyspace Inspector (@modelcontextprotocol/server-redis)' },
                ] as const
              ).map((item) => (
                <label
                  key={item.key}
                  className="flex items-center gap-2.5 p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 text-xs cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selection[item.key]}
                    onChange={(e) =>
                      setSelection({ ...selection, [item.key]: e.target.checked })
                    }
                  />
                  <span dir="ltr" className="ltr-inline font-mono text-slate-800 dark:text-slate-200">
                    {item.label}
                  </span>
                </label>
              ))}
            </div>

            <h2 className="text-sm font-bold text-slate-900 dark:text-white pt-2">
              {language === 'en' ? '2. Environment Variables & Endpoints Configuration:' : '۲. تنظیم متغیرهای محیطی و اندپوینت‌ها:'}
            </h2>
            <div className="space-y-2.5">
              <div>
                <label className="block text-[11px] text-slate-500 mb-1">
                  PostgreSQL Read-Only Connection URI:
                </label>
                <input
                  type="text"
                  dir="ltr"
                  value={selection.envVars.postgresUrl}
                  onChange={(e) =>
                    setSelection({
                      ...selection,
                      envVars: { ...selection.envVars, postgresUrl: e.target.value },
                    })
                  }
                  className="ltr-code w-full px-3 py-1.5 text-xs font-mono rounded border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950"
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-500 mb-1">
                  OpenSearch Cluster Endpoint:
                </label>
                <input
                  type="text"
                  dir="ltr"
                  value={selection.envVars.opensearchUrl}
                  onChange={(e) =>
                    setSelection({
                      ...selection,
                      envVars: { ...selection.envVars, opensearchUrl: e.target.value },
                    })
                  }
                  className="ltr-code w-full px-3 py-1.5 text-xs font-mono rounded border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950"
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-500 mb-1">
                  Rocket.Chat Webhook URL:
                </label>
                <input
                  type="text"
                  dir="ltr"
                  value={selection.envVars.rocketchatWebhook}
                  onChange={(e) =>
                    setSelection({
                      ...selection,
                      envVars: { ...selection.envVars, rocketchatWebhook: e.target.value },
                    })
                  }
                  className="ltr-code w-full px-3 py-1.5 text-xs font-mono rounded border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950"
                />
              </div>
            </div>
          </div>

          {/* Right Generated Code Preview (7 Cols) */}
          <div className="lg:col-span-7 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-950 text-slate-100 overflow-hidden flex flex-col">
            <div dir="ltr" className="ltr-code flex items-center justify-between px-4 py-3 bg-slate-900 border-b border-slate-800 text-xs font-mono">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveCodeTab('json')}
                  className={`px-3 py-1 rounded font-semibold cursor-pointer ${
                    activeCodeTab === 'json'
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-800 text-slate-300'
                  }`}
                >
                  mcp_config.json
                </button>
                <button
                  type="button"
                  onClick={() => setActiveCodeTab('python')}
                  className={`px-3 py-1 rounded font-semibold cursor-pointer ${
                    activeCodeTab === 'python'
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-800 text-slate-300'
                  }`}
                >
                  telemetry_and_alert_mcp.py (FastMCP)
                </button>
              </div>
              <button
                type="button"
                onClick={() =>
                  handleCopy(
                    activeCodeTab === 'json' ? jsonOutput : pythonOutput,
                    activeCodeTab
                  )
                }
                className="px-3 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center gap-1.5 cursor-pointer"
              >
                {copiedKey === activeCodeTab ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy {activeCodeTab === 'json' ? 'JSON' : 'Python'}</span>
                  </>
                )}
              </button>
            </div>
            <pre dir="ltr" className="ltr-code p-5 text-xs font-mono leading-relaxed overflow-x-auto flex-1">
              <code>{activeCodeTab === 'json' ? jsonOutput : pythonOutput}</code>
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};

export const CheatSheetsStudio: React.FC<{
  onExportPdf: (payload: PrintableDocumentPayload) => void;
}> = ({ onExportPdf }) => {
  const { language } = useLanguage();
  const [searchFilter, setSearchFilter] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  const categories = ['ALL', ...Array.from(new Set(CHEAT_SHEET_CARDS.map((c) => c.category)))];

  const filteredCards = CHEAT_SHEET_CARDS.filter((card) => {
    const matchesCat = selectedCategory === 'ALL' || card.category === selectedCategory;
    if (!searchFilter.trim()) return matchesCat;
    const q = searchFilter.toLowerCase();
    return (
      matchesCat &&
      (card.titleFa.toLowerCase().includes(q) ||
        card.titleEn.toLowerCase().includes(q) ||
        card.items.some(
          (i) =>
            i.keyEn.toLowerCase().includes(q) ||
            i.labelFa.toLowerCase().includes(q) ||
            i.detailFa.toLowerCase().includes(q)
        ))
    );
  });

  const allCheatSheetsPdf: PrintableDocumentPayload = {
    titleFa: 'مرجع کامل چیت‌شیت‌های مهندسی Google Antigravity',
    titleEn: 'Complete Google Antigravity Master Cheat Sheets',
    subtitleOrCategory: 'Shortcuts · @ Mentions · Rules YAML · Slash Workflows · Worktrees',
    sections: filteredCards.map((c) => ({
      headingFa: c.titleFa,
      headingEn: c.titleEn,
      bullets: c.items.map((it) => ({
        termEn: it.keyEn,
        descFa: `${it.labelFa} — ${it.detailFa}`,
      })),
    })),
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="rounded-2xl border border-slate-200/80 dark:border-white/[0.07] bg-white dark:bg-[#0c121e] p-6 sm:p-8 space-y-5 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200/70 dark:border-white/[0.06] pb-4">
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <span className="font-bold text-blue-600 dark:text-blue-400">
              {language === 'en' ? 'Studio 04' : 'استودیو ۰۴'}
            </span>
            <span aria-hidden="true" className="opacity-40">·</span>
            <span dir="ltr" className="ltr-inline font-mono">
              Quick Reference Cards &amp; Scoped PDF Export
            </span>
          </div>
          <ExportSectionPdfButton
            label={language === 'en' ? 'Export All Cheat Sheets PDF' : 'دریافت PDF تمام چیت‌شیت‌ها'}
            payload={allCheatSheetsPdf}
            onExport={onExportPdf}
          />
        </div>

        <div className="space-y-2.5">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            {language === 'en'
              ? 'Interactive Master Cheat Sheets & Modular PDF Export Center'
              : 'مرکز چیت‌شیت‌های تعاملی و خروجی PDF ماژولار'}
          </h1>
          <p className="text-xs sm:text-sm leading-7 text-slate-600 dark:text-slate-300 max-w-4xl">
            {language === 'en' ? (
              <>Every reference card features a dedicated <span className="font-bold text-blue-500">"Export Section PDF"</span> button to generate isolated printable cheat sheets for your engineering team.</>
            ) : (
              <>هر کارت مرجع دارای دکمه اختصاصی <span className="font-bold text-blue-500">«دریافت PDF این بخش»</span> است تا بتوانید برگه‌های تقلب مجزا برای تیم خود چاپ یا ذخیره کنید.</>
            )}
          </p>
        </div>

        {/* Search & Category Filter */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          <div className="relative flex-1 min-w-[260px]">
            <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder={
                language === 'en'
                  ? 'Search commands, shortcuts, @rule, // turbo, or Git Worktrees...'
                  : 'جستجو در دستورات، میانبرها، @rule، // turbo یا Git Worktree...'
              }
              className="w-full pr-10 pl-4 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white"
            />
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                dir="ltr"
                className={`ltr-inline px-3 py-1.5 rounded-lg text-xs font-mono font-semibold cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Bento Grid of Cheat Sheet Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredCards.map((card) => {
          const singleCardPdf: PrintableDocumentPayload = {
            titleFa: card.titleFa,
            titleEn: card.titleEn,
            subtitleOrCategory: `Cheat Sheet · ${card.category}`,
            sections: [
              {
                headingFa: card.titleFa,
                headingEn: card.titleEn,
                bullets: card.items.map((it) => ({
                  termEn: it.keyEn,
                  descFa: `${it.labelFa} — ${it.detailFa}`,
                })),
              },
            ],
          };

          return (
            <div
              key={card.id}
              className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/75 p-6 flex flex-col justify-between space-y-4"
            >
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
                  <div>
                    <div dir="ltr" className="ltr-inline text-[11px] font-mono text-blue-600 dark:text-blue-400">
                      {card.category} · {card.titleEn}
                    </div>
                    <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mt-0.5 flex flex-wrap items-center gap-1.5">
                      <span>{language === 'en' ? card.titleEn : card.titleFa}</span>
                    </h2>
                  </div>
                  <ExportSectionPdfButton
                    label={language === 'en' ? 'Export Section PDF' : 'دریافت PDF این بخش'}
                    payload={singleCardPdf}
                    onExport={onExportPdf}
                    compact
                  />
                </div>

                <div className="space-y-2.5">
                  {card.items.map((item) => {
                    const itemEn = CHEAT_SHEET_ITEM_EN_MAP[item.keyEn];
                    return (
                      <div
                        key={item.keyEn}
                        className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/60 space-y-1"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <code
                            dir="ltr"
                            className="ltr-inline text-xs font-mono font-bold text-blue-600 dark:text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded"
                          >
                            {item.keyEn}
                          </code>
                          <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                            {language === 'en' ? (itemEn?.labelEn || item.keyEn) : item.labelFa}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-400 leading-5">
                          {language === 'en' ? (itemEn?.detailEn || item.detailFa) : item.detailFa}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export const ArchitectScenarioLab: React.FC<{
  onExportPdf: (payload: PrintableDocumentPayload) => void;
}> = ({ onExportPdf }) => {
  const { language, isRTL } = useLanguage();
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});

  const answeredCount = Object.keys(selectedAnswers).length;
  const correctCount = ARCHITECT_SCENARIOS.filter((scen) => {
    const chosenId = selectedAnswers[scen.id];
    const opt = scen.options.find((o) => o.id === chosenId);
    return Boolean(opt?.isOptimal);
  }).length;

  const labPdfPayload: PrintableDocumentPayload = {
    titleFa: 'آزمایشگاه چالش‌های معماری Principal Architect در Google Antigravity',
    titleEn: 'Principal Architect Scenario Lab & Decision Rationales',
    subtitleOrCategory: `8 Production Case Studies · Score: ${correctCount}/${ARCHITECT_SCENARIOS.length}`,
    sections: ARCHITECT_SCENARIOS.map((scen) => {
      const optimal = scen.options.find((o) => o.isOptimal)!;
      return {
        headingFa: `چالش ${scen.number}: ${scen.titleFa}`,
        headingEn: scen.titleEn,
        paragraphsFa: [scen.problemStatementFa, `پاسخ بهینه معماری: ${optimal.labelFa}`, optimal.explanationFa],
        bullets: [
          { termEn: optimal.commandOrSpecEn, descFa: optimal.impactMetrics },
        ],
      };
    }),
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="rounded-2xl border border-slate-200/80 dark:border-white/[0.07] bg-white dark:bg-[#0c121e] p-6 sm:p-8 space-y-5 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200/70 dark:border-white/[0.06] pb-4">
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <span className="font-bold text-blue-600 dark:text-blue-400">
              {language === 'en' ? 'Studio 05' : 'استودیو ۰۵'}
            </span>
            <span aria-hidden="true" className="opacity-40">·</span>
            <span dir="ltr" className="ltr-inline font-mono">
              Principal Architect Decision Lab
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            <div dir="ltr" className="ltr-inline px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-[#090d16] border border-slate-200/80 dark:border-white/[0.07] text-xs font-mono font-bold text-blue-600 dark:text-blue-400">
              Score: {correctCount} / {ARCHITECT_SCENARIOS.length} ({answeredCount} Answered)
            </div>
            {answeredCount > 0 && (
              <button
                type="button"
                onClick={() => setSelectedAnswers({})}
                className="p-2 rounded-lg border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/[0.05] cursor-pointer"
                aria-label="Reset scenarios"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            )}
            <ExportSectionPdfButton
              label={language === 'en' ? 'Export Section PDF' : 'دریافت PDF این بخش'}
              payload={labPdfPayload}
              onExport={onExportPdf}
            />
          </div>
        </div>

        <div className="space-y-2.5">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            {language === 'en'
              ? 'Google Antigravity 8 Production Case Studies Lab'
              : 'آزمایشگاه ۸ چالش واقعی معماری Google Antigravity'}
          </h1>
          <p className="text-xs sm:text-sm leading-7 text-slate-600 dark:text-slate-300 max-w-4xl">
            {language === 'en'
              ? 'Select the optimal architectural decision for each production scenario to view technical analysis, impact metrics, and trade-offs.'
              : 'در هر سناریوی واقعی، تصمیم معماری بهینه را انتخاب کنید تا تحلیل فنی و متریک‌های اثرگذاری آن را مشاهده نمایید.'}
          </p>
        </div>
      </div>

      <div className="space-y-6">
        {ARCHITECT_SCENARIOS.map((scen) => {
          const chosenOptionId = selectedAnswers[scen.id];
          const chosenOption = scen.options.find((o) => o.id === chosenOptionId);
          const scenEn = SCENARIO_EN_MAP[scen.id];

          return (
            <div
              key={scen.id}
              className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/75 p-6 space-y-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="text-xs font-bold text-blue-600 dark:text-blue-400">
                  {language === 'en' ? `Scenario 0${scen.number} · ` : `سناریوی ۰${scen.number} · `}
                  <span dir="ltr" className="ltr-inline">{scen.category}</span>
                </div>
                <div dir="ltr" className="ltr-inline text-xs font-mono text-slate-500">
                  {scen.titleEn}
                </div>
              </div>

              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                {language === 'en' ? scen.titleEn : scen.titleFa}
              </h2>

              <p className="text-xs sm:text-sm leading-7 text-slate-700 dark:text-slate-300">
                {language === 'en' && scenEn ? scenEn.problemStatementEn : scen.problemStatementFa}
              </p>

              <pre dir="ltr" className="ltr-code p-3.5 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono text-slate-300 overflow-x-auto">
                <code>{scen.contextCodeOrConfig}</code>
              </pre>

              <div className="space-y-2.5 pt-1">
                {scen.options.map((opt) => {
                  const isSelected = chosenOptionId === opt.id;
                  const optEn = scenEn?.optionsEn[opt.id];
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() =>
                        setSelectedAnswers((prev) => ({ ...prev, [scen.id]: opt.id }))
                      }
                      className={`w-full ${isRTL ? 'text-right' : 'text-left'} p-4 rounded-xl border transition-all cursor-pointer space-y-1.5 ${
                        isSelected
                          ? opt.isOptimal
                            ? 'border-emerald-500 bg-emerald-500/10'
                            : 'border-rose-500 bg-rose-500/10'
                          : 'border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/50 hover:border-blue-500/50'
                      }`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                          {language === 'en' ? (optEn?.labelEn || opt.commandOrSpecEn) : opt.labelFa}
                        </span>
                        <code dir="ltr" className="ltr-inline text-[11px] font-mono text-blue-500">
                          {opt.commandOrSpecEn}
                        </code>
                      </div>
                    </button>
                  );
                })}
              </div>

              {chosenOption && (
                <div
                  className={`p-4 rounded-xl border space-y-2 ${
                    chosenOption.isOptimal
                      ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-950 dark:text-emerald-200'
                      : 'border-rose-500/40 bg-rose-500/10 text-rose-950 dark:text-rose-200'
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-bold">
                    <div className="flex items-center gap-2">
                      {chosenOption.isOptimal ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                      ) : (
                        <XCircle className="w-4 h-4 text-rose-500 shrink-0" />
                      )}
                      <span>
                        {chosenOption.isOptimal
                          ? (language === 'en'
                              ? 'Optimal Architecture Decision (Principal Architect Approved)'
                              : 'تصمیم معماری بهینه (Principal Architect Approved)')
                          : (language === 'en'
                              ? 'Architectural Anti-Pattern / Sub-optimal Choice'
                              : 'ضدالگو / انتخاب غیربهینه (Architectural Anti-Pattern)')}
                      </span>
                    </div>
                    <span dir="ltr" className="ltr-inline font-mono text-[11px]">
                      {chosenOption.impactMetrics}
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm leading-6">
                    {language === 'en' && scenEn?.optionsEn[chosenOption.id]
                      ? scenEn.optionsEn[chosenOption.id].explanationEn
                      : chosenOption.explanationFa}
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
