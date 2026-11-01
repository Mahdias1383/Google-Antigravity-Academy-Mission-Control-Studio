import React, { useState } from 'react';
import { Check, Copy, FileCode, Terminal, Printer, X } from 'lucide-react';
import { CodeExample } from '../types/curriculum';
import { useLanguage } from '../context/LanguageContext';
import { CODE_EXAMPLE_EN_MAP } from '../utils/curriculumEnglishContent';

export interface PrintableDocumentPayload {
  titleFa: string;
  titleEn: string;
  subtitleOrCategory: string;
  sections: {
    headingFa: string;
    headingEn?: string;
    paragraphsFa?: string[];
    bullets?: { termEn: string; descFa: string }[];
    codeBlocks?: { filename: string; language: string; code: string }[];
  }[];
}

export const ExportSectionPdfButton: React.FC<{
  label?: string;
  payload: PrintableDocumentPayload;
  onExport: (payload: PrintableDocumentPayload) => void;
  compact?: boolean;
}> = ({ label, payload, onExport, compact = false }) => {
  const { language } = useLanguage();
  const effectiveLabel = label || (language === 'en' ? 'Export Section PDF' : 'دریافت PDF این بخش');

  return (
    <button
      type="button"
      onClick={() => onExport(payload)}
      className={`inline-flex items-center gap-2 font-medium transition-colors rounded-lg border border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-blue-300 hover:bg-blue-500/20 whitespace-nowrap shrink-0 cursor-pointer ${
        compact ? 'px-3 py-1.5 text-xs' : 'px-3.5 py-2 text-xs'
      }`}
      aria-label={`${effectiveLabel} - ${payload.titleEn}`}
    >
      <Printer className="w-3.5 h-3.5 shrink-0" />
      <span>{effectiveLabel}</span>
    </button>
  );
};

export const ScopedPdfExportModal: React.FC<{
  payload: PrintableDocumentPayload | null;
  onClose: () => void;
}> = ({ payload, onClose }) => {
  const { language, isRTL } = useLanguage();
  if (!payload) return null;

  const handlePrintNow = () => {
    window.print();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="pdf-modal-title"
    >
      <div className="relative w-full max-w-4xl max-h-[90vh] flex flex-col rounded-xl bg-white text-slate-900 border border-slate-200 shadow-2xl overflow-hidden">
        {/* Top Action Bar (Hidden in Print) */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white border-b border-slate-800 print:hidden">
          <div className="flex items-center gap-3">
            <Printer className="w-5 h-5 text-blue-400" />
            <div>
              <h3 id="pdf-modal-title" className="text-sm font-bold">
                {language === 'en'
                  ? 'Standard PDF Export Preview (Scoped Section Export)'
                  : 'پیش‌نمایش و خروجی استاندارد PDF (Scoped Section Export)'}
              </h3>
              <p className="text-xs text-slate-400">
                {language === 'en'
                  ? 'Print-optimized layout with isolated JetBrains Mono code blocks and high-contrast typography'
                  : 'قالب‌بندی بهینه‌شده با فونت Vazirmatn (RTL) و ایزولاسیون کدهای JetBrains Mono (LTR)'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrintNow}
              className="px-4 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors flex items-center gap-2 cursor-pointer whitespace-nowrap"
            >
              <Printer className="w-4 h-4" />
              <span>{language === 'en' ? 'Print / Save as PDF' : 'چاپ / ذخیره فایل PDF'}</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label={language === 'en' ? 'Close PDF modal' : 'بستن پنجره PDF'}
              className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Document Root */}
        <div
          id="scoped-pdf-print-root"
          dir={isRTL ? 'rtl' : 'ltr'}
          className="p-8 overflow-y-auto space-y-6 bg-white text-slate-900"
        >
          <div className="border-b-2 border-slate-900 pb-4 flex flex-col sm:flex-row sm:items-end justify-between gap-2">
            <div>
              <div className="text-xs font-semibold text-blue-700 mb-1">
                Google Antigravity Engineering Specification · {payload.subtitleOrCategory}
              </div>
              <h1 className="text-2xl font-bold text-slate-900">
                {language === 'en' ? payload.titleEn : payload.titleFa}
              </h1>
              {language !== 'en' && (
                <div dir="ltr" className="ltr-inline text-sm font-mono text-slate-600 mt-1">
                  {payload.titleEn}
                </div>
              )}
            </div>
            <div dir="ltr" className="ltr-inline text-xs font-mono text-slate-500">
              https://antigravity.google/docs
            </div>
          </div>

          {payload.sections.map((sec, idx) => (
            <div key={idx} className="space-y-3 avoid-break border-b border-slate-200 pb-5 last:border-none">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h2 className="text-lg font-bold text-slate-900">
                  {language === 'en' && sec.headingEn ? sec.headingEn : sec.headingFa}
                </h2>
                {language !== 'en' && sec.headingEn && (
                  <span dir="ltr" className="ltr-inline text-xs font-mono text-slate-500">
                    {sec.headingEn}
                  </span>
                )}
              </div>

              {sec.paragraphsFa?.map((p, pIdx) => (
                <p key={pIdx} className="text-sm leading-7 text-slate-700 text-justify">
                  {p}
                </p>
              ))}

              {sec.bullets && sec.bullets.length > 0 && (
                <ul className="space-y-2 pt-1">
                  {sec.bullets.map((b, bIdx) => (
                    <li key={bIdx} className="text-sm text-slate-800 flex flex-col sm:flex-row sm:items-baseline gap-2 bg-slate-50 p-2.5 rounded border border-slate-200">
                      <code dir="ltr" className="ltr-inline font-mono text-xs font-semibold text-blue-800 bg-blue-50 px-2 py-0.5 rounded shrink-0">
                        {b.termEn}
                      </code>
                      <span className="text-slate-700 leading-6">{b.descFa}</span>
                    </li>
                  ))}
                </ul>
              )}

              {sec.codeBlocks?.map((cb, cIdx) => (
                <div key={cIdx} dir="ltr" className="ltr-code my-3 rounded-lg border border-slate-300 overflow-hidden avoid-break">
                  <div className="bg-slate-100 px-3 py-1.5 border-b border-slate-300 flex items-center justify-between text-xs font-mono text-slate-700">
                    <span className="font-semibold">{cb.filename}</span>
                    <span>{cb.language}</span>
                  </div>
                  <pre className="p-3 text-xs font-mono leading-relaxed bg-slate-50 text-slate-900 overflow-x-auto">
                    <code>{cb.code}</code>
                  </pre>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export const CodeSandboxTabs: React.FC<{ examples: CodeExample[] }> = ({ examples }) => {
  const { language } = useLanguage();
  const [activeIndex, setActiveIndex] = useState(0);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  if (!examples || examples.length === 0) return null;
  const activeExample = examples[activeIndex] || examples[0];
  const activeEn = CODE_EXAMPLE_EN_MAP[activeExample.id];

  const handleCopy = (code: string, id: string) => {
    navigator.clipboard?.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1800);
  };

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-950 text-slate-100 overflow-hidden my-4">
      {/* Tab Selector Header */}
      {examples.length > 1 && (
        <div className="flex items-center gap-1 px-3 pt-2.5 bg-slate-900/90 border-b border-slate-800 overflow-x-auto">
          {examples.map((ex, idx) => {
            const exEn = CODE_EXAMPLE_EN_MAP[ex.id];
            return (
              <button
                key={ex.id}
                type="button"
                onClick={() => setActiveIndex(idx)}
                className={`px-3.5 py-2 text-xs font-medium rounded-t-lg transition-colors flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer ${
                  idx === activeIndex
                    ? 'bg-slate-950 text-blue-400 border-t border-x border-slate-800'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <FileCode className="w-3.5 h-3.5 shrink-0" />
                <span>{language === 'en' && exEn ? exEn.titleEn : ex.title}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Description Bar */}
      <div className="px-4 py-2.5 bg-slate-900/50 border-b border-slate-800/80 text-xs text-slate-300 flex flex-wrap items-center justify-between gap-2">
        <span>{language === 'en' && activeEn ? activeEn.descriptionEn : activeExample.description}</span>
        <div dir="ltr" className="ltr-inline flex items-center gap-3 text-slate-400 font-mono">
          <span>{activeExample.filename}</span>
          <span>·</span>
          <span>{activeExample.language}</span>
        </div>
      </div>

      {/* Strict LTR Code Header & Body */}
      <div dir="ltr" className="ltr-code relative">
        <div className="flex items-center justify-between px-4 py-2 bg-slate-900/80 border-b border-slate-800/80 text-xs font-mono text-slate-400">
          <div className="flex items-center gap-2">
            <Terminal className="w-3.5 h-3.5 text-blue-400" />
            <span className="text-slate-200 font-medium">{activeExample.filename}</span>
          </div>
          <button
            type="button"
            onClick={() => handleCopy(activeExample.code, activeExample.id)}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors cursor-pointer"
            aria-label={`Copy ${activeExample.filename}`}
          >
            {copiedId === activeExample.id ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Code</span>
              </>
            )}
          </button>
        </div>
        <pre className="p-4 text-xs sm:text-[13px] leading-relaxed font-mono overflow-x-auto text-slate-100">
          <code>{activeExample.code}</code>
        </pre>
      </div>
    </div>
  );
};
