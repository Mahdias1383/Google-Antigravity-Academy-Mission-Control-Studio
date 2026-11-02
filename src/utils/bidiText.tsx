import React from 'react';
import { AppLanguage } from './translations';

const PERSIAN_DIGITS = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];

/**
 * Converts ASCII digits (0-9) to Persian digits (۰-۹).
 */
export function toPersianDigits(value: string | number): string {
  return String(value).replace(/\d/g, (d) => PERSIAN_DIGITS[Number(d)] ?? d);
}

/**
 * Formats a number according to the active language ('fa' -> Persian digits, 'en' -> ASCII digits),
 * with optional zero-padding (e.g. 1 -> '۰۱' in fa or '01' in en).
 */
export function formatLocalizedNumber(
  num: number | string,
  lang: AppLanguage,
  padTwoDigits: boolean = false
): string {
  const raw = padTwoDigits ? String(num).padStart(2, '0') : String(num);
  return lang === 'fa' ? toPersianDigits(raw) : raw;
}

/**
 * Localizes reading time strings such as "18 min read" -> "۱۸ دقیقه مطالعه" in Persian mode.
 */
export function formatLocalizedReadingTime(
  readingTime: string,
  lang: AppLanguage
): string {
  if (lang === 'en') return readingTime;
  const match = readingTime.match(/(\d+)\s*min\s*read/i);
  if (match) {
    return `${toPersianDigits(match[1])} دقیقه مطالعه`;
  }
  return toPersianDigits(readingTime);
}

/**
 * Localizes module difficulty badges in Persian mode while keeping technical clarity.
 */
export function formatLocalizedDifficulty(
  difficulty: string,
  lang: AppLanguage
): string {
  if (lang === 'en') return difficulty;
  const map: Record<string, string> = {
    'Principal Foundation': 'سطح پایه ارشد (Principal Foundation)',
    'Foundation & Architecture': 'مبانی و معماری پایه',
    'Core Architecture': 'معماری هسته (Core Architecture)',
    'Security & DevSecOps': 'امنیت و گاردریل (DevSecOps)',
    'Context Engineering': 'مهندسی کانتکست (Context Engineering)',
    'Workflow Automation': 'اتوماسیون ورک‌فلو (Automation)',
    'Browser Subagent & QA': 'عامل مرورگر و تست (QA Subagent)',
    'MCP & Extensibility': 'پروتکل MCP و توسعه‌پذیری',
    'Multi-Agent Concurrency': 'هم‌زمانی چندایجنتی (Concurrency)',
  };
  return map[difficulty] || difficulty;
}

/**
 * Wraps English parentheticals and technical compound tokens (containing hyphens, slashes, dots, etc.)
 * with Unicode Left-to-Right Isolate (\u2066 ... \u2069) for plain-string contexts, preventing RTL parenthesis
 * reversal like "(& Task (Artifact-Centric" or "(-Asynchronous Agent".
 */
export function stabilizeBidiString(text: string, lang: AppLanguage): string {
  if (!text || lang === 'en') return text;

  // 1. Convert leading ASCII numbering at start of Persian titles: "1. معماری" -> "۱. معماری"
  let processed = text.replace(/^(\d+)(\.\d+)?(?=\s|\.)/g, (m) =>
    toPersianDigits(m)
  );

  // 2. Isolate pure-Latin parenthetical expressions: (Synchronous Copilot Era), (Task & Artifact-Centric)
  processed = processed.replace(
    /\(([A-Za-z0-9_@./+*:&,\s-]*[A-Za-z][A-Za-z0-9_@./+*:&,\s-]*)\)/g,
    '\u2066($1)\u2069'
  );

  return processed;
}

/**
 * Splits mixed Persian/English prose and wraps pure-English parentheticals and technical phrases
 * in <bdi dir="ltr" className="bidi-ltr-run"> elements so that parentheses, hyphens (e.g. Agent-First, Tab-to-Jump),
 * slashes (e.g. Cmd/Ctrl + I), comma-separated English lists, and version numbers never reverse or detach in RTL layout,
 * while preserving Persian parentheticals like (با فشردن Tab) and sentence-ending periods.
 */
export function renderBidiText(
  text: string,
  lang: AppLanguage
): React.ReactNode {
  if (!text) return null;
  if (lang === 'en') return text;

  // Normalize leading numbering in Persian titles (e.g., "1. معماری" -> "۱. معماری")
  const normalized = text.replace(/^(\d+)(\.\d+)?(?=\s|\.)/g, (m) =>
    toPersianDigits(m)
  );

  // Match either:
  // 1) Pure-Latin parenthetical (no Persian characters inside): \([A-Za-z0-9_@./+*:&,\s-]*[A-Za-z][A-Za-z0-9_@./+*:&,\s-]*\)
  // 2) Pure-Latin/technical phrase (single word, hyphenated/slashed token, or multi-word/comma-separated English run),
  //    never swallowing trailing sentence punctuation (period/colon) at the end of the run.
  const tokenRegex =
    /(\([A-Za-z0-9_@./+*:&,\s-]*[A-Za-z][A-Za-z0-9_@./+*:&,\s-]*\)|[@A-Za-z](?:[A-Za-z0-9_./+:-]*[A-Za-z0-9_+*/])?(?:(?:\s*,\s*|\s+)[@A-Za-z0-9_./+:&-]*[A-Za-z0-9_+*/])*)/g;

  const parts = normalized.split(tokenRegex);
  if (parts.length <= 1) {
    return normalized;
  }

  return parts.map((part, idx) => {
    if (!part) return null;
    if (tokenRegex.test(part)) {
      tokenRegex.lastIndex = 0;
      return (
        <bdi
          key={idx}
          dir="ltr"
          className="bidi-ltr-run"
        >
          {part}
        </bdi>
      );
    }
    tokenRegex.lastIndex = 0;
    return <React.Fragment key={idx}>{part}</React.Fragment>;
  });
}
