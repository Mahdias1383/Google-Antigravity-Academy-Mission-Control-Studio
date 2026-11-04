import React, { useState, useMemo } from 'react';
import {
  TrainLine,
  TrainSchedule,
  Ticket,
} from '../types/railpulse';
import {
  SearchCategory,
  performGlobalAdminSearch,
} from '../services/globalSearchService';
import { getStoredAuditLogs } from '../services/auditLogService';
import { Language } from '../i18n/translations';
import { Search, Command, Train, Ticket as TicketIcon, ShieldCheck, X } from 'lucide-react';

interface AdminGlobalSearchPanelProps {
  lines: TrainLine[];
  schedules: TrainSchedule[];
  tickets: Ticket[];
  language: Language;
  onOpenCommandPalette?: () => void;
}

export const AdminGlobalSearchPanel: React.FC<AdminGlobalSearchPanelProps> = ({
  lines,
  schedules,
  tickets,
  language,
  onOpenCommandPalette,
}) => {
  const isRtl = language === 'fa';
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<SearchCategory>('all');

  const results = useMemo(() => {
    return performGlobalAdminSearch({
      query,
      category,
      schedules,
      lines,
      tickets,
      auditLogs: getStoredAuditLogs(),
    });
  }, [query, category, schedules, lines, tickets]);

  return (
    <div className="no-print p-5 rounded-2xl bg-slate-900 border border-slate-700/80 shadow-lg space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Search className="w-4 h-4 text-cyan-400" />
            <h2 className="text-sm font-bold text-white">
              {isRtl
                ? 'جستجوی سراسری و آنی پورتال مدیریت (Global Search)'
                : 'Real-Time Global Admin Search'}
            </h2>
            {onOpenCommandPalette && (
              <button
                type="button"
                onClick={onOpenCommandPalette}
                className="px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-500/40 font-mono text-[10px] cursor-pointer"
                dir="ltr"
              >
                Ctrl+K
              </button>
            )}
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            {isRtl
              ? 'جستجوی همزمان در برنامه حرکت قطارها، بلیت‌های مسافران (PNR) و لاگ‌های حسابرسی امنیتی'
              : 'Simultaneous search across train schedules, passenger PNR tickets, and security audit logs'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <span className="text-slate-400 text-[11px]">
            {isRtl ? 'جستجوی سریع:' : 'Quick chips:'}
          </span>
          {['۱۰۱ فدک', 'PNR-8921-FA', 'سارا راد', 'TR-202', 'مشهد'].map((chip) => (
            <button
              key={chip}
              type="button"
              onClick={() => setQuery(chip)}
              className="px-2 py-0.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-[11px] cursor-pointer"
            >
              {chip}
            </button>
          ))}
        </div>
      </div>

      <div className="relative flex items-center">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label={
            isRtl
              ? 'جستجوی سراسری در قطارها، بلیت‌ها و لاگ‌های حسابرسی'
              : 'Global search across trains, tickets and audit logs'
          }
          placeholder={
            isRtl
              ? 'شماره قطار (مثلاً ۱۰۱)، کد رزرو (PNR-8921-FA)، نام مسافر، ایستگاه یا شناسه لاگ را وارد کنید...'
              : 'Enter train number (e.g. 101), PNR code, passenger name, station or audit ID...'
          }
          className="w-full h-10 bg-slate-950 border border-slate-700 focus:border-cyan-500 rounded-xl px-4 text-xs text-white focus:outline-none"
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery('')}
            className="px-3 text-slate-400 hover:text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {query.trim() !== '' && (
        <div className="p-3 rounded-xl bg-slate-950/90 border border-slate-800 space-y-2 text-xs">
          <div className="text-slate-300 font-semibold">
            {isRtl
              ? `نتایج یافت‌شده: ${results.totalCount} مورد`
              : `Found ${results.totalCount} matching records`}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            {results.schedules.map((s) => (
              <div key={s.id} className="p-2 rounded bg-slate-900 border border-slate-800 flex items-center gap-2">
                <Train className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                <span>{s.trainNumber} ({s.departureTime})</span>
              </div>
            ))}
            {results.tickets.map((tk) => (
              <div key={tk.id} className="p-2 rounded bg-slate-900 border border-slate-800 flex items-center gap-2">
                <TicketIcon className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>{tk.pnr} - {tk.passengerName}</span>
              </div>
            ))}
            {results.auditLogs.slice(0, 3).map((al) => (
              <div key={al.id} className="p-2 rounded bg-slate-900 border border-slate-800 flex items-center gap-2">
                <ShieldCheck className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span className="truncate">{isRtl ? al.summaryFa : al.summaryEn}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
