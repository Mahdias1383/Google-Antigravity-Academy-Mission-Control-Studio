import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Search,
  X,
  Train,
  Ticket as TicketIcon,
  ShieldCheck,
  Clock,
  MapPin,
  User,
  QrCode,
  Lock,
  ExternalLink,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Calendar,
  Sparkles,
  Layers,
} from 'lucide-react';
import {
  TrainSchedule,
  TrainLine,
  Ticket,
  AuditLog,
} from '../types/railpulse';
import {
  performGlobalAdminSearch,
  GlobalSearchCategory,
} from '../services/globalSearchService';
import {
  getStoredAuditLogs,
  subscribeToAuditLogs,
  seedInitialAuditLogs,
} from '../services/auditLogService';
import { calculateTrainTrajectory } from '../services/collisionEngine';
import { Language } from '../i18n/translations';

interface AdminGlobalSearchPanelProps {
  lines: TrainLine[];
  schedules: TrainSchedule[];
  tickets: Ticket[];
  language: Language;
}

export const AdminGlobalSearchPanel: React.FC<AdminGlobalSearchPanelProps> = ({
  lines,
  schedules,
  tickets,
  language,
}) => {
  const isRtl = language === 'fa';
  const inputRef = useRef<HTMLInputElement | null>(null);

  const [query, setQuery] = useState<string>('');
  const [category, setCategory] = useState<GlobalSearchCategory>('all');
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => {
    seedInitialAuditLogs();
    return getStoredAuditLogs();
  });

  // Inspection modals for search result items
  const [inspectedSchedule, setInspectedSchedule] = useState<TrainSchedule | null>(null);
  const [inspectedTicket, setInspectedTicket] = useState<Ticket | null>(null);
  const [inspectedAuditLog, setInspectedAuditLog] = useState<AuditLog | null>(null);

  // Keep audit logs reactive in real-time
  useEffect(() => {
    const unsubscribe = subscribeToAuditLogs(() => {
      setAuditLogs(getStoredAuditLogs());
    });
    return () => unsubscribe();
  }, []);

  // Refresh audit logs when schedules or tickets change
  useEffect(() => {
    setAuditLogs(getStoredAuditLogs());
  }, [schedules, tickets]);

  // Keyboard shortcut Ctrl+K / Cmd+K to focus global search input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Compute all counts (regardless of active category filter) for badge counters
  const allCategorySearch = useMemo(() => {
    return performGlobalAdminSearch({
      query,
      category: 'all',
      schedules,
      lines,
      tickets,
      auditLogs,
    });
  }, [query, schedules, lines, tickets, auditLogs]);

  // Compute filtered results based on active category
  const searchResults = useMemo(() => {
    return performGlobalAdminSearch({
      query,
      category,
      schedules,
      lines,
      tickets,
      auditLogs,
    });
  }, [query, category, schedules, lines, tickets, auditLogs]);

  const hasActiveQuery = query.trim().length > 0;

  const quickQueries = [
    { labelFa: '۱۰۱ فدک', labelEn: '101 Fadak', value: '101' },
    { labelFa: 'PNR-8921-FA', labelEn: 'PNR-8921-FA', value: 'PNR-8921-FA' },
    { labelFa: 'سارا راد', labelEn: 'Sara Rad', value: isRtl ? 'سارا راد' : 'Sara' },
    { labelFa: 'TR-202', labelEn: 'TR-202', value: 'TR-202' },
    { labelFa: 'مشهد', labelEn: 'Mashhad', value: isRtl ? 'مشهد' : 'Mashhad' },
  ];

  return (
    <div className="rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950/60 border border-slate-700/80 p-5 shadow-xl space-y-4">
      {/* Top Header & Real-Time Search Input */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400 flex-shrink-0">
            <Search className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white">
                {isRtl
                  ? 'جستجوی سراسری و آنی پورتال مدیریت (Global Search)'
                  : 'Real-Time Global Admin Search'}
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-500/20 text-blue-300 border border-blue-500/30 font-mono">
                Ctrl+K
              </span>
            </div>
            <p className="text-xs text-slate-400">
              {isRtl
                ? 'جستجوی همزمان در برنامه حرکت قطارها، بلیت‌های مسافران (PNR) و لاگ‌های حسابرسی امنیتی'
                : 'Instantly query across train schedules, passenger tickets (PNR), and security audit logs'}
            </p>
          </div>
        </div>

        {/* Quick Search Chips */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <span className="text-slate-400 text-[11px] me-1">
            {isRtl ? 'جستجوی سریع:' : 'Quick Try:'}
          </span>
          {quickQueries.map((chip) => (
            <button
              key={chip.value}
              type="button"
              onClick={() => setQuery(chip.value)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-medium border transition cursor-pointer ${
                query === chip.value
                  ? 'bg-blue-600 text-white border-blue-400'
                  : 'bg-slate-800/90 hover:bg-slate-700 text-slate-300 border-slate-700'
              }`}
            >
              {isRtl ? chip.labelFa : chip.labelEn}
            </button>
          ))}
        </div>
      </div>

      {/* Search Box */}
      <div className="relative">
        <Search
          className={`w-4 h-4 text-blue-400 absolute top-1/2 -translate-y-1/2 ${
            isRtl ? 'right-3.5' : 'left-3.5'
          }`}
        />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label={
            isRtl
              ? 'جستجوی سراسری در قطارها، بلیت‌ها و لاگ‌های حسابرسی'
              : 'Global search across train schedules, passenger tickets, and audit logs'
          }
          placeholder={
            isRtl
              ? 'شماره قطار (مثلاً ۱۰۱)، کد رزرو (PNR-8921-FA)، نام مسافر، ایستگاه یا شناسه لاگ را وارد کنید...'
              : 'Search train number (e.g. 101), ticket PNR (PNR-8921-FA), passenger name, station, or audit event...'
          }
          className={`w-full bg-slate-950/90 border border-slate-700 focus:border-blue-500 rounded-xl py-3 text-xs sm:text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition ${
            isRtl ? 'pr-10 pl-24' : 'pl-10 pr-24'
          }`}
        />
        {hasActiveQuery && (
          <button
            type="button"
            onClick={() => setQuery('')}
            aria-label={isRtl ? 'پاک کردن جستجو' : 'Clear global search'}
            className={`absolute top-1/2 -translate-y-1/2 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs flex items-center gap-1 cursor-pointer ${
              isRtl ? 'left-2.5' : 'right-2.5'
            }`}
          >
            <X className="w-3.5 h-3.5" />
            <span>{isRtl ? 'پاک کردن' : 'Clear'}</span>
          </button>
        )}
      </div>

      {/* Live Results Container when user types a query */}
      {hasActiveQuery && (
        <div className="space-y-4 pt-2 border-t border-slate-800/80 animate-fade-in">
          {/* Category Filter Tabs */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={() => setCategory('all')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                  category === 'all'
                    ? 'bg-blue-600 text-white shadow'
                    : 'bg-slate-800/80 text-slate-300 hover:text-white'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>{isRtl ? 'همه نتایج' : 'All Results'}</span>
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-black/30 font-mono">
                  {allCategorySearch.totalCount}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setCategory('schedules')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                  category === 'schedules'
                    ? 'bg-amber-600 text-white shadow'
                    : 'bg-slate-800/80 text-slate-300 hover:text-white'
                }`}
              >
                <Train className="w-3.5 h-3.5" />
                <span>{isRtl ? 'برنامه حرکت قطارها' : 'Train Schedules'}</span>
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-black/30 font-mono">
                  {allCategorySearch.schedules.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setCategory('tickets')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                  category === 'tickets'
                    ? 'bg-emerald-600 text-white shadow'
                    : 'bg-slate-800/80 text-slate-300 hover:text-white'
                }`}
              >
                <TicketIcon className="w-3.5 h-3.5" />
                <span>{isRtl ? 'بلیت‌های مسافران' : 'Passenger Tickets'}</span>
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-black/30 font-mono">
                  {allCategorySearch.tickets.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setCategory('auditLogs')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                  category === 'auditLogs'
                    ? 'bg-indigo-600 text-white shadow'
                    : 'bg-slate-800/80 text-slate-300 hover:text-white'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>{isRtl ? 'لاگ‌های حسابرسی (Audit)' : 'Audit Logs'}</span>
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-black/30 font-mono">
                  {allCategorySearch.auditLogs.length}
                </span>
              </button>
            </div>

            <div className="text-xs text-slate-400">
              {isRtl
                ? `${searchResults.totalCount} نتیجه منطبق با «${query}» یافت شد`
                : `Found ${searchResults.totalCount} matching record(s) for "${query}"`}
            </div>
          </div>

          {searchResults.totalCount === 0 ? (
            <div className="p-8 text-center rounded-xl bg-slate-950/60 border border-slate-800 text-slate-400 space-y-2">
              <Search className="w-8 h-8 text-slate-600 mx-auto" />
              <p className="text-xs font-medium">
                {isRtl
                  ? `هیچ قطار، بلیت یا لاگ حسابرسی منطبق با عبارت «${query}» یافت نشد.`
                  : `No train schedules, passenger tickets, or audit logs matched "${query}".`}
              </p>
            </div>
          ) : (
            <div className="space-y-5">
              {/* 1. MATCHING TRAIN SCHEDULES */}
              {searchResults.schedules.length > 0 && (
                <div className="space-y-2.5">
                  <div className="flex items-center gap-2 text-xs font-bold text-amber-400">
                    <Train className="w-4 h-4" />
                    <span>
                      {isRtl
                        ? `برنامه حرکت قطارها (${searchResults.schedules.length})`
                        : `Matching Train Schedules (${searchResults.schedules.length})`}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {searchResults.schedules.map((sch) => {
                      const line = lines.find((l) => l.id === sch.lineId);
                      const remaining = sch.totalCapacity - sch.bookedSeats;
                      return (
                        <div
                          key={sch.id}
                          onClick={() => setInspectedSchedule(sch)}
                          className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 hover:border-amber-500/50 transition cursor-pointer space-y-2"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-mono text-xs font-bold text-amber-300 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-600/30">
                              {sch.trainNumber} ({sch.id})
                            </span>
                            <span className="font-mono text-xs text-emerald-400 font-bold">
                              {sch.departureTime}
                            </span>
                          </div>
                          <div>
                            <div className="text-xs font-bold text-white">
                              {isRtl ? sch.trainNameFa : sch.trainNameEn}
                            </div>
                            <div className="text-[11px] text-slate-400">
                              {isRtl ? line?.nameFa : line?.nameEn}
                            </div>
                          </div>
                          <div className="flex items-center justify-between text-[11px] text-slate-300 pt-1.5 border-t border-slate-800/80 font-mono">
                            <span>{sch.speedKmh} km/h</span>
                            <span>
                              {sch.bookedSeats}/{sch.totalCapacity}{' '}
                              {isRtl ? `(${remaining} خالی)` : `(${remaining} free)`}
                            </span>
                            <span className="text-amber-300">
                              {sch.ticketPrice.toLocaleString(isRtl ? 'fa-IR' : 'en-US')}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 2. MATCHING PASSENGER TICKETS */}
              {searchResults.tickets.length > 0 && (
                <div className="space-y-2.5">
                  <div className="flex items-center gap-2 text-xs font-bold text-emerald-400">
                    <TicketIcon className="w-4 h-4" />
                    <span>
                      {isRtl
                        ? `بلیت‌های مسافران (${searchResults.tickets.length})`
                        : `Matching Passenger Tickets (${searchResults.tickets.length})`}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {searchResults.tickets.map((tk) => (
                      <div
                        key={tk.id}
                        onClick={() => setInspectedTicket(tk)}
                        className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 hover:border-emerald-500/50 transition cursor-pointer flex items-center justify-between gap-3"
                      >
                        <div className="space-y-1 text-xs">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-emerald-300 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-600/30">
                              {tk.pnr}
                            </span>
                            <span className="font-bold text-white">{tk.passengerName}</span>
                            <span className="text-[11px] text-slate-400 font-mono">
                              ({tk.passengerNationalId})
                            </span>
                          </div>
                          <div className="text-slate-300">
                            {tk.trainNumber} • {tk.departureStation} ➔ {tk.arrivalStation}
                          </div>
                          <div className="text-[11px] text-slate-400 font-mono">
                            {isRtl
                              ? `صندلی‌ها: ${tk.seatNumbers.join('، ')} | مبلغ: ${tk.totalPrice.toLocaleString('fa-IR')} تومان`
                              : `Seats: ${tk.seatNumbers.join(', ')} | Total: ${tk.totalPrice.toLocaleString('en-US')} TMN`}
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1.5">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              tk.status === 'confirmed'
                                ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/30'
                                : 'bg-rose-950 text-rose-300 border border-rose-500/30'
                            }`}
                          >
                            {tk.status}
                          </span>
                          <span className="text-[11px] text-blue-400 flex items-center gap-1">
                            <QrCode className="w-3.5 h-3.5" />
                            {isRtl ? 'کارت سوارشدن' : 'Boarding Pass'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 3. MATCHING AUDIT LOGS */}
              {searchResults.auditLogs.length > 0 && (
                <div className="space-y-2.5">
                  <div className="flex items-center gap-2 text-xs font-bold text-indigo-400">
                    <ShieldCheck className="w-4 h-4" />
                    <span>
                      {isRtl
                        ? `وقایع و لاگ‌های حسابرسی (${searchResults.auditLogs.length})`
                        : `Matching Audit Logs (${searchResults.auditLogs.length})`}
                    </span>
                  </div>
                  <div className="space-y-2">
                    {searchResults.auditLogs.slice(0, 8).map((log) => (
                      <div
                        key={log.id}
                        onClick={() => setInspectedAuditLog(log)}
                        className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 hover:border-indigo-500/50 transition cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                      >
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-indigo-950/70 text-indigo-300 border border-indigo-600/30">
                              {log.entityId}
                            </span>
                            <span className="font-semibold text-white">{log.actorName}</span>
                            <span className="text-[10px] uppercase px-1.5 py-0.2 rounded bg-slate-800 text-slate-300">
                              {log.actorRole}
                            </span>
                            <span className="text-[11px] text-slate-400 font-mono">
                              {new Date(log.timestamp).toLocaleTimeString(isRtl ? 'fa-IR' : 'en-US')}
                            </span>
                          </div>
                          <p className="text-slate-300">
                            {isRtl ? log.summaryFa : log.summaryEn}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 self-end sm:self-center">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              log.riskLevel === 'high' || log.riskLevel === 'critical'
                                ? 'bg-orange-950 text-orange-300 border border-orange-500/40'
                                : 'bg-slate-800 text-slate-300 border border-slate-700'
                            }`}
                          >
                            {log.riskLevel}
                          </span>
                          <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Inspect Schedule Modal */}
      {inspectedSchedule && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl text-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Train className="w-5 h-5 text-amber-400" />
                <div>
                  <h3 className="text-base font-bold text-white">
                    {isRtl ? inspectedSchedule.trainNameFa : inspectedSchedule.trainNameEn}
                  </h3>
                  <p className="text-slate-400 font-mono">
                    {inspectedSchedule.trainNumber} ({inspectedSchedule.id})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setInspectedSchedule(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg bg-slate-800 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {(() => {
              const line = lines.find((l) => l.id === inspectedSchedule.lineId);
              const traj = line ? calculateTrainTrajectory(inspectedSchedule, line) : null;
              return (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2.5">
                    <div className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/60">
                      <span className="text-slate-400 block">{isRtl ? 'ساعت حرکت:' : 'Departure:'}</span>
                      <span className="font-mono font-bold text-emerald-400 text-sm">
                        {inspectedSchedule.departureTime}
                      </span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/60">
                      <span className="text-slate-400 block">{isRtl ? 'سرعت سیر:' : 'Cruise Speed:'}</span>
                      <span className="font-mono font-bold text-blue-300 text-sm">
                        {inspectedSchedule.speedKmh} km/h
                      </span>
                    </div>
                  </div>

                  {traj && (
                    <div className="space-y-1.5">
                      <div className="font-semibold text-slate-300">
                        {isRtl ? 'جدول زمان‌بندی ایستگاه‌های مسیر:' : 'Station Arrival & Departure Stops:'}
                      </div>
                      <div className="space-y-1 max-h-48 overflow-y-auto">
                        {traj.timePoints.map((pt, i) => (
                          <div
                            key={pt.stationId}
                            className="flex items-center justify-between p-2 rounded-lg bg-slate-800/50 border border-slate-800"
                          >
                            <span className="font-medium text-white">
                              {i + 1}. {isRtl ? pt.stationNameFa : pt.stationNameEn} ({pt.kmFromStart} km)
                            </span>
                            <span className="font-mono text-emerald-300">
                              {pt.arrivalTimeStr} ➔ {pt.departureTimeStr}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}

            <div className="flex justify-end pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setInspectedSchedule(null)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-semibold cursor-pointer"
              >
                {isRtl ? 'بستن' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Inspect Ticket Modal */}
      {inspectedTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-2xl text-center text-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <span className="font-bold text-slate-300">
                {isRtl ? 'کارت سوارشدن دیجیتال (PNR)' : 'Passenger Boarding Pass'}
              </span>
              <button
                type="button"
                onClick={() => setInspectedTicket(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg bg-slate-800 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-3 bg-white rounded-2xl text-slate-950 inline-block shadow-lg">
              <QrCode className="w-32 h-32 mx-auto text-slate-950" />
              <div className="font-mono font-bold text-[11px] mt-1">{inspectedTicket.pnr}</div>
            </div>

            <div className="space-y-1 text-start bg-slate-800/60 p-3 rounded-xl border border-slate-700">
              <div className="flex justify-between">
                <span className="text-slate-400">{isRtl ? 'نام مسافر:' : 'Passenger:'}</span>
                <span className="font-bold text-white">{inspectedTicket.passengerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">{isRtl ? 'قطار:' : 'Train:'}</span>
                <span className="text-slate-200">{inspectedTicket.trainNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">{isRtl ? 'صندلی‌ها:' : 'Seats:'}</span>
                <span className="font-mono text-emerald-400 font-bold">
                  {inspectedTicket.seatNumbers.join(', ')}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">{isRtl ? 'مبلغ کل:' : 'Total Paid:'}</span>
                <span className="font-mono text-amber-300 font-bold">
                  {inspectedTicket.totalPrice.toLocaleString(isRtl ? 'fa-IR' : 'en-US')}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setInspectedTicket(null)}
              className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-semibold cursor-pointer"
            >
              {isRtl ? 'بستن' : 'Close'}
            </button>
          </div>
        </div>
      )}

      {/* Inspect Audit Log Modal */}
      {inspectedAuditLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl text-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-indigo-400" />
                <div>
                  <h3 className="text-sm font-bold text-white">
                    {isRtl ? 'سند حسابرسی امنیتی' : 'Audit Log Security Record'}
                  </h3>
                  <p className="text-slate-400 font-mono text-[11px]">{inspectedAuditLog.id}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setInspectedAuditLog(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg bg-slate-800 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-3 rounded-xl bg-slate-800/70 border border-slate-700 space-y-1">
              <div className="font-semibold text-white">
                {inspectedAuditLog.actorName} ({inspectedAuditLog.actorRole})
              </div>
              <p className="text-slate-300">
                {isRtl ? inspectedAuditLog.summaryFa : inspectedAuditLog.summaryEn}
              </p>
            </div>

            <div className="p-3 bg-emerald-950/40 border border-emerald-600/30 rounded-xl space-y-1">
              <div className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                <Lock className="w-3.5 h-3.5" />
                <span>SHA-256 Verification Hash</span>
              </div>
              <div className="font-mono text-[11px] text-emerald-200 break-all">
                {inspectedAuditLog.verificationHash}
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setInspectedAuditLog(null)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-semibold cursor-pointer"
              >
                {isRtl ? 'بستن' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
