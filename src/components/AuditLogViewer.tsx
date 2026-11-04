import React, { useState, useEffect, useMemo } from 'react';
import {
  ShieldCheck,
  FileJson,
  FileSpreadsheet,
  AlertTriangle,
  User,
  Ticket as TicketIcon,
  Calendar,
  Wallet,
  Sparkles,
  CheckCircle,
  XCircle,
  ExternalLink,
  RefreshCw,
  Activity,
  Layers,
  ArrowUpDown,
  Lock,
  Printer,
} from 'lucide-react';
import {
  AuditLog,
  AuditActionType,
  AuditRiskLevel,
} from '../types/railpulse';
import {
  getStoredAuditLogs,
  filterAuditLogs,
  computeAuditStats,
  exportAuditLogsToJson,
  exportAuditLogsToCsv,
  getDistinctAuditUsers,
  buildAuditExportFilename,
  subscribeToAuditLogs,
  seedInitialAuditLogs,
} from '../services/auditLogService';
import { reserveTickets, updateTrainSchedule } from '../services/bookingEngine';
import { getDatabase } from '../services/storageAndMigration';
import { Language, TRANSLATIONS } from '../i18n/translations';

interface AuditLogViewerProps {
  language: Language;
  onRefreshData?: () => void;
  refreshTick?: number;
  onPrintReport?: () => void;
}

export const AuditLogViewer: React.FC<AuditLogViewerProps> = ({
  language,
  onRefreshData,
  refreshTick = 0,
  onPrintReport,
}) => {
  const t = TRANSLATIONS[language];
  const isRtl = language === 'fa';

  const [logs, setLogs] = useState<AuditLog[]>(() => {
    seedInitialAuditLogs();
    return getStoredAuditLogs();
  });

  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAction, setFilterAction] = useState('all');
  const [filterRole, setFilterRole] = useState('all');
  const [filterUser, setFilterUser] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [filterRisk, setFilterRisk] = useState('all');
  const [activeSimulationToast, setActiveSimulationToast] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = subscribeToAuditLogs(() => {
      setLogs(getStoredAuditLogs());
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    setLogs(getStoredAuditLogs());
  }, [refreshTick]);

  const refreshLogs = () => {
    setLogs(getStoredAuditLogs());
    if (onRefreshData) onRefreshData();
  };

  const distinctUsers = useMemo(() => getDistinctAuditUsers(logs), [logs]);

  const activeCriteria = useMemo(
    () => ({
      searchTerm,
      actionType: filterAction,
      actorRole: filterRole,
      actorId: filterUser,
      startDate,
      endDate,
      riskLevel: filterRisk,
    }),
    [searchTerm, filterAction, filterRole, filterUser, startDate, endDate, filterRisk]
  );

  const filteredLogs = useMemo(
    () => filterAuditLogs(logs, activeCriteria),
    [logs, activeCriteria]
  );

  const stats = useMemo(() => computeAuditStats(logs), [logs]);

  const handleSimulateReservation = () => {
    const db = getDatabase();
    const passenger = db.users.find((u) => u.role === 'passenger') || db.users[0];
    const train = db.schedules.find((s) => s.bookedSeats < s.totalCapacity) || db.schedules[0];

    const result = reserveTickets(passenger, train.id, 1);
    if (result.success) {
      setActiveSimulationToast(
        isRtl
          ? `رزرو آزمایشی انجام شد: بلیت ${result.ticket?.pnr} با موفقیت در لاگ حسابرسی ثبت شد.`
          : `Simulated Booking: Ticket ${result.ticket?.pnr} automatically audited.`
      );
    }
    refreshLogs();
    setTimeout(() => setActiveSimulationToast(null), 4000);
  };

  const handleSimulateScheduleEdit = () => {
    const db = getDatabase();
    const admin = db.users.find((u) => u.role === 'admin') || db.users[0];
    const train = db.schedules[0];
    const newSpeed = train.speedKmh >= 150 ? 135 : 155;

    updateTrainSchedule(train.id, { speedKmh: newSpeed }, admin);
    setActiveSimulationToast(
      isRtl
        ? `تغییر زمان‌بندی آزمایشی برای قطار ${train.trainNumber} ثبت شد.`
        : `Simulated schedule update for ${train.trainNumber} logged.`
    );
    refreshLogs();
    setTimeout(() => setActiveSimulationToast(null), 4000);
  };

  const handleDownloadCsv = () => {
    const content = exportAuditLogsToCsv(filteredLogs);
    const filename = buildAuditExportFilename('csv', activeCriteria);
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadJson = () => {
    const content = exportAuditLogsToJson(filteredLogs);
    const filename = buildAuditExportFilename('json', activeCriteria);
    const blob = new Blob([content], { type: 'application/json;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getActionBadge = (type: AuditActionType) => {
    switch (type) {
      case 'ticket_reservation':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
            <TicketIcon className="w-3 h-3 text-emerald-400" />
            {isRtl ? 'رزرو بلیت' : 'Booking'}
          </span>
        );
      case 'schedule_update':
      case 'schedule_create':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30">
            <Calendar className="w-3 h-3 text-amber-400" />
            {isRtl ? 'تغییر برنامه حرکت' : 'Schedule Edit'}
          </span>
        );
      case 'wallet_deposit':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
            <Wallet className="w-3 h-3 text-cyan-400" />
            {isRtl ? 'شارژ کیف پول' : 'Wallet Deposit'}
          </span>
        );
      case 'employee_register':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-500/15 text-purple-300 border border-purple-500/30">
            <User className="w-3 h-3 text-purple-400" />
            {isRtl ? 'پرسنل جدید' : 'New Staff'}
          </span>
        );
      case 'portal_switch':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
            <ArrowUpDown className="w-3 h-3 text-indigo-400" />
            {isRtl ? 'تغییر پرتال' : 'Portal Switch'}
          </span>
        );
      case 'migration_run':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
            <Layers className="w-3 h-3 text-indigo-400" />
            {isRtl ? 'مهاجرت v1 پایتون' : 'v1 Migration'}
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-500/15 text-slate-300 border border-slate-500/30">
            <Activity className="w-3 h-3 text-slate-400" />
            {isRtl ? 'ورود کاربر' : type}
          </span>
        );
    }
  };

  const getRiskBadge = (risk: AuditRiskLevel) => {
    if (risk === 'critical' || risk === 'high') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-orange-950/70 text-orange-300 border border-orange-500/40">
          <AlertTriangle className="w-3 h-3 text-orange-400" />
          {isRtl ? 'پرریسک' : 'High Risk'}
        </span>
      );
    }
    if (risk === 'medium') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-amber-950/60 text-amber-300 border border-amber-500/30">
          {isRtl ? 'متوسط' : 'Medium'}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-normal bg-emerald-950/40 text-emerald-400 border border-emerald-500/20">
        <CheckCircle className="w-3 h-3 text-emerald-500" />
        {isRtl ? 'عادی' : 'Low'}
      </span>
    );
  };

  return (
    <div className="no-print space-y-6">
      {activeSimulationToast && (
        <div className="flex items-center justify-between p-4 bg-blue-950/90 border border-blue-500/50 rounded-xl text-blue-200 text-sm shadow-xl">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-blue-400 animate-pulse" />
            <span>{activeSimulationToast}</span>
          </div>
          <button
            onClick={() => setActiveSimulationToast(null)}
            className="text-xs text-blue-300 hover:text-white underline cursor-pointer"
          >
            {isRtl ? 'بستن' : 'Dismiss'}
          </button>
        </div>
      )}

      {/* Header Banner */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950/90 border border-slate-700/70 shadow-lg">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-11 h-11 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg sm:text-xl font-bold text-white whitespace-nowrap">
                {t.activityMonitor}
              </h2>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 whitespace-nowrap shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                {t.liveStreamActive}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
              {t.auditLogDescription}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleSimulateReservation}
            className="h-9 px-3.5 inline-flex items-center justify-center gap-1.5 text-xs font-semibold rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 transition cursor-pointer whitespace-nowrap shrink-0"
          >
            <TicketIcon className="w-3.5 h-3.5 shrink-0" />
            <span>{t.triggerSimulatedReservation}</span>
          </button>

          <button
            type="button"
            onClick={handleSimulateScheduleEdit}
            className="h-9 px-3.5 inline-flex items-center justify-center gap-1.5 text-xs font-semibold rounded-xl bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-500/40 transition cursor-pointer whitespace-nowrap shrink-0"
          >
            <Calendar className="w-3.5 h-3.5 shrink-0" />
            <span>{t.triggerSimulatedScheduleEdit}</span>
          </button>

          <button
            type="button"
            onClick={handleDownloadCsv}
            title={t.exportCsv}
            className="h-9 px-3 inline-flex items-center justify-center gap-1.5 text-xs font-semibold rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600/80 transition cursor-pointer whitespace-nowrap shrink-0"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>CSV</span>
          </button>

          <button
            type="button"
            onClick={handleDownloadJson}
            title={t.exportJson}
            className="h-9 px-3 inline-flex items-center justify-center gap-1.5 text-xs font-semibold rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600/80 transition cursor-pointer whitespace-nowrap shrink-0"
          >
            <FileJson className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>JSON</span>
          </button>

          {onPrintReport && (
            <button
              type="button"
              data-testid="audit-log-print-report-btn"
              onClick={onPrintReport}
              title={
                isRtl
                  ? 'چاپ گزارش جامع لاگ‌های حسابرسی و آمار داشبورد (Print Report)'
                  : 'Print printer-friendly report of audit logs and performance dashboard statistics'
              }
              className="h-9 px-3 inline-flex items-center justify-center gap-1.5 text-xs font-bold rounded-xl bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/40 transition cursor-pointer whitespace-nowrap shrink-0"
            >
              <Printer className="w-3.5 h-3.5 text-blue-400 shrink-0" />
              <span>{isRtl ? 'چاپ گزارش' : 'Print Report'}</span>
            </button>
          )}

          <button
            type="button"
            onClick={refreshLogs}
            className="h-9 w-9 inline-flex items-center justify-center rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-600/80 transition cursor-pointer shrink-0"
            title={isRtl ? 'بروزرسانی جدول' : 'Refresh Logs'}
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
          <div className="text-slate-400">{isRtl ? 'کل رویدادهای ثبت‌شده' : 'Total Events'}</div>
          <div className="text-xl font-bold text-white font-mono my-1">
            {stats.total.toLocaleString(isRtl ? 'fa-IR' : 'en-US')}
          </div>
          <div className="text-[11px] text-slate-500">{isRtl ? 'تمام وقایع ثبتی سامانه' : 'All recorded logs'}</div>
        </div>
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
          <div className="text-slate-400">{isRtl ? 'رزروهای بلیت' : 'Bookings'}</div>
          <div className="text-xl font-bold text-emerald-400 font-mono my-1">
            {stats.reservations.toLocaleString(isRtl ? 'fa-IR' : 'en-US')}
          </div>
          <div className="text-[11px] text-slate-500">{isRtl ? 'رزروهای خودکار مسافران' : 'Confirmed bookings'}</div>
        </div>
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
          <div className="text-slate-400">{isRtl ? 'تغییرات جدول حرکت' : 'Schedule Edits'}</div>
          <div className="text-xl font-bold text-amber-400 font-mono my-1">
            {stats.scheduleEdits.toLocaleString(isRtl ? 'fa-IR' : 'en-US')}
          </div>
          <div className="text-[11px] text-slate-500">{isRtl ? 'تغییرات جدول و سرعت' : 'Timetable modifications'}</div>
        </div>
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
          <div className="text-slate-400">{isRtl ? 'رویدادهای پرریسک' : 'High-Risk Events'}</div>
          <div className="text-xl font-bold text-rose-400 font-mono my-1">
            {(stats.highRisk + stats.criticalRisk).toLocaleString(isRtl ? 'fa-IR' : 'en-US')}
          </div>
          <div className="text-[11px] text-slate-500">{isRtl ? 'عملیات با ریسک بالا' : 'Elevated risk ops'}</div>
        </div>
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
          <div className="text-slate-400">{isRtl ? 'عملیات امروز' : 'Today Shift'}</div>
          <div className="text-xl font-bold text-cyan-400 font-mono my-1">
            {stats.todayCount.toLocaleString(isRtl ? 'fa-IR' : 'en-US')}
          </div>
          <div className="text-[11px] text-slate-500">{isRtl ? 'عملیات شیفت جاری' : 'Active shift actions'}</div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3 text-xs">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={
              isRtl
                ? 'جستجو در نام عامل، کد PNR، شماره قطار یا شرح واقعه...'
                : 'Search actor, PNR, train number or summary...'
            }
            className="h-9 bg-slate-950 border border-slate-700 rounded-xl px-3 text-white"
          />
          <select
            aria-label={isRtl ? 'فیلتر نوع عملیات' : 'Filter Action Type'}
            value={filterAction}
            onChange={(e) => setFilterAction(e.target.value)}
            className="h-9 bg-slate-950 border border-slate-700 rounded-xl px-3 text-white"
          >
            <option value="all">{isRtl ? 'همه عملیات‌ها' : 'All Actions'}</option>
            <option value="ticket_reservation">{isRtl ? 'رزرو بلیت' : 'Booking'}</option>
            <option value="schedule_update">{isRtl ? 'تغییر برنامه حرکت' : 'Schedule Update'}</option>
            <option value="wallet_deposit">{isRtl ? 'شارژ کیف پول' : 'Wallet Deposit'}</option>
            <option value="employee_register">{isRtl ? 'ثبت پرسنل' : 'Staff Registration'}</option>
            <option value="user_login">{isRtl ? 'ورود کاربر' : 'User Login'}</option>
            <option value="portal_switch">{isRtl ? 'جابجایی پرتال' : 'Portal Switch'}</option>
          </select>
          <select
            aria-label={isRtl ? 'فیلتر بر اساس کاربر' : 'Filter by User'}
            value={filterUser}
            onChange={(e) => setFilterUser(e.target.value)}
            className="h-9 bg-slate-950 border border-slate-700 rounded-xl px-3 text-white"
          >
            <option value="all">{isRtl ? 'همه کاربران (All Users)' : 'All Users'}</option>
            {distinctUsers.map((u) => (
              <option key={u.actorId} value={u.actorId}>
                {u.actorName} ({u.count})
              </option>
            ))}
          </select>
          <select
            aria-label={isRtl ? 'فیلتر سطح ریسک' : 'Filter Risk Level'}
            value={filterRisk}
            onChange={(e) => setFilterRisk(e.target.value)}
            className="h-9 bg-slate-950 border border-slate-700 rounded-xl px-3 text-white"
          >
            <option value="all">{isRtl ? 'همه سطوح ریسک' : 'All Risk Levels'}</option>
            <option value="low">{isRtl ? 'کم‌ریسک / عادی' : 'Low'}</option>
            <option value="medium">{isRtl ? 'متوسط' : 'Medium'}</option>
            <option value="high">{isRtl ? 'پرریسک' : 'High'}</option>
          </select>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900 overflow-x-auto">
        <table className="w-full text-xs text-slate-200">
          <thead className="bg-slate-800/90 text-slate-300 border-b border-slate-700">
            <tr>
              <th className="py-3 px-4 text-start">{isRtl ? 'زمان ثبت' : 'Timestamp'}</th>
              <th className="py-3 px-4 text-start">{isRtl ? 'عامل و نقش' : 'Actor & Role'}</th>
              <th className="py-3 px-4 text-start">{isRtl ? 'نوع رویداد' : 'Event Type'}</th>
              <th className="py-3 px-4 text-start">{isRtl ? 'شناسه مرجع' : 'Entity ID'}</th>
              <th className="py-3 px-4 text-start">{isRtl ? 'شرح خلاصه واقعه' : 'Summary'}</th>
              <th className="py-3 px-4 text-center">{isRtl ? 'سطح ریسک' : 'Risk'}</th>
              <th className="py-3 px-4 text-center">{isRtl ? 'عملیات' : 'Details'}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {filteredLogs.map((log) => (
              <tr
                key={log.id}
                onClick={() => setSelectedLog(log)}
                className="hover:bg-slate-800/40 cursor-pointer transition"
              >
                <td className="py-3 px-4 font-mono text-slate-400 whitespace-nowrap" dir="ltr">
                  {log.timestamp.replace('T', ' ').slice(0, 19)}
                </td>
                <td className="py-3 px-4 whitespace-nowrap">
                  <div className="font-semibold text-white">{log.actorName}</div>
                  <div className="text-[10px] font-mono text-slate-400">{log.actorRole}</div>
                </td>
                <td className="py-3 px-4 whitespace-nowrap">{getActionBadge(log.actionType)}</td>
                <td className="py-3 px-4 font-mono text-cyan-300 whitespace-nowrap" dir="ltr">
                  {log.entityId}
                </td>
                <td className="py-3 px-4 text-slate-300">
                  {isRtl ? log.summaryFa : log.summaryEn}
                </td>
                <td className="py-3 px-4 text-center whitespace-nowrap">
                  {getRiskBadge(log.riskLevel)}
                </td>
                <td className="py-3 px-4 text-center">
                  <button
                    type="button"
                    aria-label={isRtl ? 'مشاهده جزئیات و هش اعتبارسنجی' : 'Inspect audit log details'}
                    className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white">
                {isRtl ? 'جزئیات رکورد حسابرسی و امضای دیجیتال' : 'Audit Record & Cryptographic Hash'}
              </h3>
              <button
                type="button"
                onClick={() => setSelectedLog(null)}
                className="px-2 py-1 rounded bg-slate-800 text-slate-300 cursor-pointer"
              >
                ✕
              </button>
            </div>
            <div className="space-y-2">
              <div className="font-mono text-emerald-400" dir="ltr">
                HASH: {selectedLog.verificationHash}
              </div>
              <p className="text-slate-200">{isRtl ? selectedLog.summaryFa : selectedLog.summaryEn}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
