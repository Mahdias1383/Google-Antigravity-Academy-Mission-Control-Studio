import React, { useState, useEffect, useMemo } from 'react';
import {
  ShieldCheck,
  Search,
  Filter,
  Download,
  FileJson,
  FileSpreadsheet,
  AlertTriangle,
  Clock,
  User,
  Ticket as TicketIcon,
  Calendar,
  Wallet,
  Sparkles,
  CheckCircle,
  XCircle,
  ExternalLink,
  RefreshCw,
  Hash,
  Activity,
  Layers,
  ArrowUpDown,
  Lock,
} from 'lucide-react';
import {
  AuditLog,
  AuditActionType,
  AuditRiskLevel,
  UserRole,
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
  recordAuditAction,
  seedInitialAuditLogs,
} from '../services/auditLogService';
import { reserveTickets, updateTrainSchedule } from '../services/bookingEngine';
import { getDatabase } from '../services/storageAndMigration';
import { Language, TRANSLATIONS } from '../i18n/translations';

interface AuditLogViewerProps {
  language: Language;
  onRefreshData?: () => void;
}

export const AuditLogViewer: React.FC<AuditLogViewerProps> = ({
  language,
  onRefreshData,
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
  const [exportPreviewModal, setExportPreviewModal] = useState<{
    format: 'CSV' | 'JSON';
    filename: string;
    recordCount: number;
    content: string;
  } | null>(null);

  // Subscribe to real-time events generated anywhere across the platform
  useEffect(() => {
    const unsubscribe = subscribeToAuditLogs((newLog) => {
      setLogs(getStoredAuditLogs());
    });
    return () => unsubscribe();
  }, []);

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

  const filteredLogs = useMemo(() => {
    return filterAuditLogs(logs, activeCriteria);
  }, [logs, activeCriteria]);

  const stats = useMemo(() => computeAuditStats(logs), [logs]);

  // Simulation triggers for testing and demo evaluation
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
    } else {
      setActiveSimulationToast(
        isRtl ? result.errorMessageFa || 'خطا در رزرو' : result.errorMessageEn || 'Booking error'
      );
    }
    refreshLogs();
    setTimeout(() => setActiveSimulationToast(null), 4500);
  };

  const handleSimulateScheduleEdit = () => {
    const db = getDatabase();
    const admin = db.users.find((u) => u.role === 'admin') || db.users[0];
    const train = db.schedules[0];
    const newSpeed = train.speedKmh >= 150 ? 135 : 155;

    updateTrainSchedule(train.id, { speedKmh: newSpeed }, admin);
    setActiveSimulationToast(
      isRtl
        ? `تغییر زمان‌بندی اعمال شد: سرعت قطار ${train.trainNumber} به ${newSpeed} km/h بروزرسانی و لاگ شد.`
        : `Simulated Schedule Edit: Train ${train.trainNumber} speed updated to ${newSpeed} km/h and logged.`
    );
    refreshLogs();
    setTimeout(() => setActiveSimulationToast(null), 4500);
  };

  const handleDownloadCsv = () => {
    const csvData = exportAuditLogsToCsv(filteredLogs);
    const filename = buildAuditExportFilename('csv', activeCriteria);
    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setExportPreviewModal({
      format: 'CSV',
      filename,
      recordCount: filteredLogs.length,
      content: csvData,
    });
  };

  const handleDownloadJson = () => {
    const jsonData = exportAuditLogsToJson(filteredLogs);
    const filename = buildAuditExportFilename('json', activeCriteria);
    const blob = new Blob([jsonData], { type: 'application/json;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setExportPreviewModal({
      format: 'JSON',
      filename,
      recordCount: filteredLogs.length,
      content: jsonData,
    });
  };

  const formatTimestamp = (iso: string) => {
    try {
      const d = new Date(iso);
      if (isRtl) {
        return d.toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) +
          ' ' + d.toLocaleDateString('fa-IR');
      }
      return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) +
        ' ' + d.toLocaleDateString('en-US');
    } catch {
      return iso;
    }
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
      case 'ticket_cancellation':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/15 text-rose-300 border border-rose-500/30">
            <XCircle className="w-3 h-3 text-rose-400" />
            {isRtl ? 'لغو و استرداد' : 'Cancellation'}
          </span>
        );
      case 'schedule_update':
      case 'schedule_create':
      case 'schedule_delete':
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
            {type}
          </span>
        );
    }
  };

  const getRiskBadge = (risk: AuditRiskLevel) => {
    switch (risk) {
      case 'critical':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-red-950/80 text-red-300 border border-red-600/50">
            <AlertTriangle className="w-3 h-3 text-red-400" />
            {isRtl ? 'بحرانی' : 'Critical'}
          </span>
        );
      case 'high':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-orange-950/70 text-orange-300 border border-orange-500/40">
            <AlertTriangle className="w-3 h-3 text-orange-400" />
            {isRtl ? 'پرریسک' : 'High Risk'}
          </span>
        );
      case 'medium':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-amber-950/60 text-amber-300 border border-amber-500/30">
            {isRtl ? 'متوسط' : 'Medium'}
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-normal bg-emerald-950/40 text-emerald-400 border border-emerald-500/20">
            <CheckCircle className="w-3 h-3 text-emerald-500" />
            {isRtl ? 'عادی' : 'Low'}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification for Live Simulation */}
      {activeSimulationToast && (
        <div className="flex items-center justify-between p-4 bg-blue-950/90 border border-blue-500/50 rounded-xl text-blue-200 text-sm shadow-xl backdrop-blur animate-fade-in">
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
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 border border-slate-700/60 shadow-lg">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                {t.activityMonitor}
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  {t.liveStreamActive}
                </span>
              </h2>
              <p className="text-xs text-slate-400">{t.auditLogDescription}</p>
            </div>
          </div>
        </div>

        {/* Live Simulation Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleSimulateReservation}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 transition cursor-pointer"
          >
            <TicketIcon className="w-3.5 h-3.5" />
            {t.triggerSimulatedReservation}
          </button>

          <button
            onClick={handleSimulateScheduleEdit}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-500/40 transition cursor-pointer"
          >
            <Calendar className="w-3.5 h-3.5" />
            {t.triggerSimulatedScheduleEdit}
          </button>

          <button
            onClick={handleDownloadCsv}
            title={t.exportCsv}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 transition cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
            <span>CSV</span>
          </button>

          <button
            onClick={handleDownloadJson}
            title={t.exportJson}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 transition cursor-pointer"
          >
            <FileJson className="w-3.5 h-3.5 text-amber-400" />
            <span>JSON</span>
          </button>

          <button
            onClick={refreshLogs}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-600 transition cursor-pointer"
            title="Refresh"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* KPI Metric Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
        <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700/60 shadow">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>{t.totalAuditLogs}</span>
            <Activity className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-bold text-white">{stats.total.toLocaleString(isRtl ? 'fa-IR' : 'en-US')}</div>
          <div className="text-[11px] text-slate-400 mt-1">{isRtl ? 'تمام وقایع ثبتی' : 'All recorded logs'}</div>
        </div>

        <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700/60 shadow">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>{t.ticketReservations}</span>
            <TicketIcon className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-400">
            {stats.reservations.toLocaleString(isRtl ? 'fa-IR' : 'en-US')}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">{isRtl ? 'رزروهای خودکار مسافران' : 'Passenger reservations'}</div>
        </div>

        <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700/60 shadow">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>{t.scheduleModifications}</span>
            <Calendar className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-amber-400">
            {stats.scheduleEdits.toLocaleString(isRtl ? 'fa-IR' : 'en-US')}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">{isRtl ? 'تغییرات جدول و سرعت' : 'Schedule changes'}</div>
        </div>

        <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700/60 shadow">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>{t.highRiskEvents}</span>
            <AlertTriangle className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-bold text-rose-400">
            {(stats.highRisk + stats.criticalRisk).toLocaleString(isRtl ? 'fa-IR' : 'en-US')}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">{isRtl ? 'عملیات با ریسک بالا' : 'Elevated risk actions'}</div>
        </div>

        <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700/60 shadow col-span-2 md:col-span-1">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>{t.todayOperations}</span>
            <Clock className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold text-cyan-400">
            {stats.todayCount.toLocaleString(isRtl ? 'fa-IR' : 'en-US')}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">{isRtl ? 'عملیات شیفت جاری' : 'Current shift ops'}</div>
        </div>
      </div>

      {/* Filter, User/Date Scope & Export Bar */}
      <div className="p-4 rounded-xl bg-slate-850 bg-slate-900/90 border border-slate-700/70 shadow space-y-3.5">
        <div className="flex flex-col md:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className={`w-4 h-4 text-slate-400 absolute top-1/2 -translate-y-1/2 ${isRtl ? 'right-3' : 'left-3'}`} />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={t.searchLogsPlaceholder}
              className={`w-full bg-slate-800 border border-slate-700 rounded-lg py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 transition ${isRtl ? 'pr-9 pl-3' : 'pl-9 pr-3'}`}
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            {/* Filter Action */}
            <select
              value={filterAction}
              onChange={(e) => setFilterAction(e.target.value)}
              aria-label={isRtl ? 'فیلتر نوع عملیات' : 'Filter by Action Type'}
              className="bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-lg px-2.5 py-2 focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              <option value="all">{isRtl ? 'همه عملیات‌ها' : 'All Action Types'}</option>
              <option value="ticket_reservation">{isRtl ? 'رزرو بلیت' : 'Ticket Reservation'}</option>
              <option value="ticket_cancellation">{isRtl ? 'لغو و استرداد' : 'Ticket Cancellation'}</option>
              <option value="schedule_create">{isRtl ? 'ایجاد برنامه حرکت' : 'Schedule Create'}</option>
              <option value="schedule_update">{isRtl ? 'تغییر برنامه حرکت' : 'Schedule Update'}</option>
              <option value="wallet_deposit">{isRtl ? 'شارژ کیف پول' : 'Wallet Deposit'}</option>
              <option value="employee_register">{isRtl ? 'ثبت پرسنل' : 'Employee Register'}</option>
              <option value="migration_run">{isRtl ? 'مهاجرت v1' : 'v1 Migration'}</option>
            </select>

            {/* Filter Role */}
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              aria-label={isRtl ? 'فیلتر نقش' : 'Filter by Role'}
              className="bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-lg px-2.5 py-2 focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              <option value="all">{isRtl ? 'همه نقش‌ها' : 'All Roles'}</option>
              <option value="admin">{isRtl ? 'مدیر ارشد' : 'Admin'}</option>
              <option value="employee">{isRtl ? 'پرسنل خطوط' : 'Staff/Employee'}</option>
              <option value="passenger">{isRtl ? 'مسافر' : 'Passenger'}</option>
              <option value="system">{isRtl ? 'سامانه خودکار' : 'System'}</option>
            </select>

            {/* Filter Risk */}
            <select
              value={filterRisk}
              onChange={(e) => setFilterRisk(e.target.value)}
              aria-label={isRtl ? 'فیلتر سطح ریسک' : 'Filter by Risk Level'}
              className="bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-lg px-2.5 py-2 focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              <option value="all">{isRtl ? 'همه سطوح ریسک' : 'All Risk Levels'}</option>
              <option value="low">{isRtl ? 'کم‌ریسک / عادی' : 'Low'}</option>
              <option value="medium">{isRtl ? 'متوسط' : 'Medium'}</option>
              <option value="high">{isRtl ? 'پرریسک' : 'High'}</option>
              <option value="critical">{isRtl ? 'بحرانی' : 'Critical'}</option>
            </select>
          </div>
        </div>

        {/* Dedicated Row for User / Actor Filter, Date Range Filter, and Filtered Export Actions */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pt-3 border-t border-slate-800">
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Filter by Specific User */}
            <div className="flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-blue-400" />
              <label className="text-xs text-slate-400 whitespace-nowrap">
                {isRtl ? 'فیلتر کاربر:' : 'Filter by User:'}
              </label>
              <select
                value={filterUser}
                onChange={(e) => setFilterUser(e.target.value)}
                aria-label={isRtl ? 'فیلتر بر اساس کاربر' : 'Filter by User'}
                className="bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-blue-500 cursor-pointer"
              >
                <option value="all">{isRtl ? 'همه کاربران (All Users)' : 'All Users'}</option>
                {distinctUsers.map((u) => (
                  <option key={u.actorId} value={u.actorId}>
                    {u.actorName} ({u.count})
                  </option>
                ))}
              </select>
            </div>

            {/* Filter by Date Range */}
            <div className="flex flex-wrap items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-emerald-400" />
              <label className="text-xs text-slate-400 whitespace-nowrap">
                {isRtl ? 'از تاریخ:' : 'From Date:'}
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                aria-label={isRtl ? 'از تاریخ' : 'Start Date'}
                className="bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-lg px-2.5 py-1.5 font-mono focus:outline-none focus:border-blue-500"
              />
              <label className="text-xs text-slate-400 whitespace-nowrap">
                {isRtl ? 'تا تاریخ:' : 'To Date:'}
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                aria-label={isRtl ? 'تا تاریخ' : 'End Date'}
                className="bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-lg px-2.5 py-1.5 font-mono focus:outline-none focus:border-blue-500"
              />
              <button
                type="button"
                onClick={() => {
                  const todayIso = new Date().toISOString().slice(0, 10);
                  setStartDate(todayIso);
                  setEndDate(todayIso);
                }}
                className="px-2.5 py-1.5 rounded-lg text-[11px] font-medium bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 transition cursor-pointer"
              >
                {isRtl ? 'فقط امروز' : 'Today Only'}
              </button>
            </div>

            {(searchTerm ||
              filterAction !== 'all' ||
              filterRole !== 'all' ||
              filterUser !== 'all' ||
              startDate !== '' ||
              endDate !== '' ||
              filterRisk !== 'all') && (
              <button
                type="button"
                onClick={() => {
                  setSearchTerm('');
                  setFilterAction('all');
                  setFilterRole('all');
                  setFilterUser('all');
                  setStartDate('');
                  setEndDate('');
                  setFilterRisk('all');
                }}
                className="px-2.5 py-1.5 text-xs text-rose-300 hover:text-white bg-rose-950/40 border border-rose-600/30 rounded-lg transition cursor-pointer"
              >
                {t.clearFilters}
              </button>
            )}
          </div>

          {/* Filtered Audit Export Controls */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] text-slate-400">
              {isRtl
                ? `آماده خروجی: ${filteredLogs.length.toLocaleString('fa-IR')} از ${logs.length.toLocaleString('fa-IR')} رویداد`
                : `Exporting ${filteredLogs.length} of ${logs.length} log(s)`}
            </span>

            <button
              type="button"
              onClick={handleDownloadCsv}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 transition cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
              <span>
                {isRtl
                  ? `خروجی CSV فیلترشده (${filteredLogs.length.toLocaleString('fa-IR')})`
                  : `Export Filtered CSV (${filteredLogs.length})`}
              </span>
            </button>

            <button
              type="button"
              onClick={handleDownloadJson}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-500/40 transition cursor-pointer"
            >
              <FileJson className="w-3.5 h-3.5 text-amber-400" />
              <span>
                {isRtl
                  ? `خروجی JSON فیلترشده (${filteredLogs.length.toLocaleString('fa-IR')})`
                  : `Export Filtered JSON (${filteredLogs.length})`}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Audit Log Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-700/70 bg-slate-900/80 shadow-xl">
        <table className="w-full text-xs text-slate-200">
          <thead className="bg-slate-800/90 text-slate-300 font-semibold border-b border-slate-700">
            <tr>
              <th className="py-3 px-4 text-start">{t.colTimestamp}</th>
              <th className="py-3 px-4 text-start">{t.colActor}</th>
              <th className="py-3 px-4 text-start">{t.colActionType}</th>
              <th className="py-3 px-4 text-start">{t.colEntity}</th>
              <th className="py-3 px-4 text-start">{t.colSummary}</th>
              <th className="py-3 px-4 text-center">{t.colRisk}</th>
              <th className="py-3 px-4 text-center">{t.colStatus}</th>
              <th className="py-3 px-4 text-center">{isRtl ? 'عملیات' : 'Inspect'}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {filteredLogs.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-slate-400">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Filter className="w-8 h-8 text-slate-600" />
                    <p className="text-sm">{isRtl ? 'هیچ رویدادی مطابق با فیلترها یافت نشد.' : 'No audit events found.'}</p>
                  </div>
                </td>
              </tr>
            ) : (
              filteredLogs.map((log) => (
                <tr
                  key={log.id}
                  className="hover:bg-slate-800/50 transition cursor-pointer group"
                  onClick={() => setSelectedLog(log)}
                >
                  <td className="py-3.5 px-4 whitespace-nowrap text-slate-300 font-mono text-[11px]">
                    {formatTimestamp(log.timestamp)}
                  </td>
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-slate-700 border border-slate-600 flex items-center justify-center text-[11px] font-bold text-blue-400">
                        {log.actorName.charAt(0)}
                      </div>
                      <div>
                        <div className="font-medium text-white">{log.actorName}</div>
                        <div className="text-[10px] text-slate-400 uppercase tracking-wider">{log.actorRole}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 whitespace-nowrap">{getActionBadge(log.actionType)}</td>
                  <td className="py-3.5 px-4 whitespace-nowrap font-mono text-slate-300">
                    <span className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-[11px]">
                      {log.entityId}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-slate-300 max-w-md line-clamp-2">
                    {isRtl ? log.summaryFa : log.summaryEn}
                  </td>
                  <td className="py-3.5 px-4 whitespace-nowrap text-center">{getRiskBadge(log.riskLevel)}</td>
                  <td className="py-3.5 px-4 whitespace-nowrap text-center">
                    {log.status === 'success' ? (
                      <span className="inline-flex items-center gap-1 text-emerald-400 text-[11px]">
                        <CheckCircle className="w-3 h-3" />
                        {isRtl ? 'موفق' : 'OK'}
                      </span>
                    ) : log.status === 'blocked' ? (
                      <span className="inline-flex items-center gap-1 text-amber-400 text-[11px]">
                        <AlertTriangle className="w-3 h-3" />
                        {isRtl ? 'مسدود' : 'Blocked'}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-rose-400 text-[11px]">
                        <XCircle className="w-3 h-3" />
                        {isRtl ? 'ناموفق' : 'Failed'}
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 whitespace-nowrap text-center">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedLog(log);
                      }}
                      className="p-1 rounded bg-slate-800 hover:bg-blue-600 text-slate-300 hover:text-white transition cursor-pointer"
                      title={t.viewDetails}
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Audit Detail Modal / Drawer */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-2xl w-full p-6 space-y-5 shadow-2xl overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="w-6 h-6 text-blue-400" />
                <div>
                  <h3 className="text-base font-bold text-white">
                    {isRtl ? 'جزئیات سند حسابرسی امنیتی' : 'Audit Security Record'}
                  </h3>
                  <p className="text-xs text-slate-400 font-mono">{selectedLog.id}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg bg-slate-800 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-slate-800/50 rounded-xl border border-slate-700/50">
                <span className="text-slate-400 block mb-1">{isRtl ? 'عامل مجری:' : 'Executing Actor:'}</span>
                <span className="font-semibold text-white">{selectedLog.actorName}</span> ({selectedLog.actorRole})
              </div>

              <div className="p-3 bg-slate-800/50 rounded-xl border border-slate-700/50">
                <span className="text-slate-400 block mb-1">{isRtl ? 'زمان دقیق ثبت:' : 'Exact Timestamp:'}</span>
                <span className="font-mono text-slate-200">{selectedLog.timestamp}</span>
              </div>

              <div className="p-3 bg-slate-800/50 rounded-xl border border-slate-700/50">
                <span className="text-slate-400 block mb-1">{isRtl ? 'نوع عملیات و شناسه مرجع:' : 'Action & Entity:'}</span>
                <div className="flex items-center gap-2 mt-1">
                  {getActionBadge(selectedLog.actionType)}
                  <span className="font-mono text-slate-300 bg-slate-700 px-1.5 py-0.5 rounded text-[11px]">
                    {selectedLog.entityId}
                  </span>
                </div>
              </div>

              <div className="p-3 bg-slate-800/50 rounded-xl border border-slate-700/50">
                <span className="text-slate-400 block mb-1">{isRtl ? 'آدرس IP و سطح ریسک:' : 'IP Address & Risk:'}</span>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-slate-300">{selectedLog.ipAddress}</span>
                  {getRiskBadge(selectedLog.riskLevel)}
                </div>
              </div>
            </div>

            <div className="p-3.5 bg-slate-800/70 rounded-xl border border-slate-700 text-xs space-y-1">
              <span className="text-slate-400 block font-semibold">{isRtl ? 'شرح واقعه:' : 'Operation Summary:'}</span>
              <p className="text-white leading-relaxed">{isRtl ? selectedLog.summaryFa : selectedLog.summaryEn}</p>
            </div>

            {/* Cryptographic Tamper-Proof Hash Verification Box */}
            <div className="p-3.5 bg-emerald-950/40 rounded-xl border border-emerald-600/40 text-xs space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-emerald-400 font-semibold flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5" />
                  {t.tamperProofVerified}
                </span>
                <span className="text-[10px] text-emerald-300 font-mono">SHA-256 Chain</span>
              </div>
              <div className="font-mono text-[11px] text-emerald-200 bg-black/40 p-2 rounded border border-emerald-500/20 break-all select-all">
                {selectedLog.verificationHash}
              </div>
            </div>

            {/* JSON Metadata Payload */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>{isRtl ? 'داده‌های متا و پیلود عملیاتی (JSON Payload):' : 'Raw Metadata Payload (JSON):'}</span>
              </div>
              <pre className="p-3 bg-black/60 border border-slate-700 rounded-xl text-slate-300 text-[11px] font-mono overflow-x-auto max-h-48 text-start" dir="ltr">
                {JSON.stringify(selectedLog.metadata, null, 2)}
              </pre>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-800">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold transition cursor-pointer"
              >
                {isRtl ? 'تایید و بازگشت' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Export Confirmation & Payload Preview Modal */}
      {exportPreviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-2xl w-full p-6 space-y-4 shadow-2xl text-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <Download className="w-5 h-5 text-emerald-400" />
                <div>
                  <h3 className="text-base font-bold text-white">
                    {isRtl
                      ? `فایل خروجی ${exportPreviewModal.format} لاگ حسابرسی آماده و دانلود شد`
                      : `Filtered ${exportPreviewModal.format} Audit Log Exported`}
                  </h3>
                  <p className="text-slate-400 font-mono text-[11px]">{exportPreviewModal.filename}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setExportPreviewModal(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg bg-slate-800 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60">
                <span className="text-slate-400 block mb-0.5">{isRtl ? 'فرمت خروجی:' : 'Export Format:'}</span>
                <span className="font-mono font-bold text-emerald-400">{exportPreviewModal.format}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60">
                <span className="text-slate-400 block mb-0.5">{isRtl ? 'تعداد رکوردهای فیلترشده:' : 'Filtered Records:'}</span>
                <span className="font-mono font-bold text-white">
                  {exportPreviewModal.recordCount.toLocaleString(isRtl ? 'fa-IR' : 'en-US')}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60">
                <span className="text-slate-400 block mb-0.5">{isRtl ? 'فیلتر کاربر و تاریخ:' : 'User & Date Scope:'}</span>
                <span className="text-slate-200 font-medium">
                  {filterUser === 'all' ? (isRtl ? 'همه کاربران' : 'All Users') : filterUser}
                  {startDate || endDate ? ` (${startDate || '...'} → ${endDate || '...'})` : ''}
                </span>
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="text-slate-400 font-semibold">
                {isRtl
                  ? `پیش‌نمایش محتوای فایل (${exportPreviewModal.format}):`
                  : `Exported File Content Preview (${exportPreviewModal.format}):`}
              </div>
              <pre
                className="p-3 bg-black/70 border border-slate-800 rounded-xl text-slate-300 text-[11px] font-mono overflow-x-auto max-h-60 text-start"
                dir="ltr"
              >
                {exportPreviewModal.content}
              </pre>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setExportPreviewModal(null)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-semibold transition cursor-pointer"
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
