import React, { useState, useEffect, useRef } from 'react';
import {
  User,
  TrainLine,
  TrainSchedule,
  Ticket,
  WalletTransaction,
  LegacyV1Schema,
} from '../types/railpulse';
import { AuditLogViewer } from './AuditLogViewer';
import { AdminGlobalSearchPanel } from './AdminGlobalSearchPanel';
import { AdminPerformanceCharts } from './AdminPerformanceCharts';
import { migrateLegacyV1Data, resetDatabaseToSeed, getDatabase, saveDatabase } from '../services/storageAndMigration';
import { recordAuditAction } from '../services/auditLogService';
import {
  DEFAULT_ADMIN_POLL_INTERVAL_MS,
  AdminPollingController,
  AdminPollingState,
  createAdminPollingController,
} from '../services/adminPollingService';
import { Language, TRANSLATIONS } from '../i18n/translations';
import {
  ShieldCheck,
  Activity,
  Layers,
  Users,
  MapPin,
  TrendingUp,
  Database,
  RefreshCw,
  PlusCircle,
  FileCode,
  CheckCircle,
  AlertTriangle,
  Server,
  DollarSign,
  Train,
  Clock,
  Pause,
  Play,
} from 'lucide-react';

interface AdminPortalProps {
  currentUser: User;
  lines: TrainLine[];
  schedules: TrainSchedule[];
  tickets: Ticket[];
  transactions: WalletTransaction[];
  language: Language;
  onRefreshData: () => void;
}

export const AdminPortal: React.FC<AdminPortalProps> = ({
  currentUser,
  lines,
  schedules,
  tickets,
  transactions,
  language,
  onRefreshData,
}) => {
  const t = TRANSLATIONS[language];
  const isRtl = language === 'fa';

  // Admin Portal Sub-Tabs: Default directly to 'activity-monitor' per user focus!
  const [activeAdminTab, setActiveAdminTab] = useState<
    'activity-monitor' | 'overview' | 'lines' | 'employees' | 'migration'
  >('activity-monitor');

  // Employee Registration Form
  const [showAddEmpModal, setShowAddEmpModal] = useState(false);
  const [empFullName, setEmpFullName] = useState('');
  const [empUsername, setEmpUsername] = useState('');
  const [empEmail, setEmpEmail] = useState('');
  const [empLineId, setEmpLineId] = useState(lines[0]?.id || '');

  // Migration Demo State
  const [migrationRunning, setMigrationRunning] = useState(false);
  const [migrationResultToast, setMigrationResultToast] = useState<string | null>(null);

  // 60-Second Periodic Polling State & Controller
  const onRefreshDataRef = useRef(onRefreshData);
  useEffect(() => {
    onRefreshDataRef.current = onRefreshData;
  }, [onRefreshData]);

  const pollingControllerRef = useRef<AdminPollingController | null>(null);
  const [refreshTick, setRefreshTick] = useState<number>(0);
  const [pollingState, setPollingState] = useState<AdminPollingState>({
    isRunning: true,
    isPaused: false,
    intervalMs: DEFAULT_ADMIN_POLL_INTERVAL_MS,
    syncCount: 0,
    lastSyncedAtIso: new Date().toISOString(),
  });
  const [secondsRemaining, setSecondsRemaining] = useState<number>(60);

  useEffect(() => {
    const controller = createAdminPollingController({
      intervalMs: DEFAULT_ADMIN_POLL_INTERVAL_MS,
      onRefreshData: () => {
        onRefreshDataRef.current();
        setRefreshTick((prev) => prev + 1);
        setSecondsRemaining(60);
      },
      onStateChange: (nextState) => {
        setPollingState(nextState);
      },
    });
    pollingControllerRef.current = controller;
    controller.start();

    return () => {
      controller.stop();
      pollingControllerRef.current = null;
    };
  }, []);

  // 1-second UI countdown timer reflecting time until next 60s poll
  useEffect(() => {
    if (pollingState.isPaused) return;
    const countdownTimer = setInterval(() => {
      setSecondsRemaining((prev) => (prev <= 1 ? 60 : prev - 1));
    }, 1000);
    return () => clearInterval(countdownTimer);
  }, [pollingState.isPaused]);

  const handleManualPollSync = () => {
    pollingControllerRef.current?.triggerNow();
    setSecondsRemaining(60);
  };

  const handleTogglePollPause = () => {
    pollingControllerRef.current?.setPaused(!pollingState.isPaused);
  };

  // Compute Overview Stats
  const totalRevenue = tickets
    .filter((tk) => tk.status === 'confirmed')
    .reduce((sum, tk) => sum + tk.totalPrice, 0);

  const totalSeatsBooked = schedules.reduce((sum, s) => sum + s.bookedSeats, 0);
  const totalFleetCapacity = schedules.reduce((sum, s) => sum + s.totalCapacity, 0);
  const fleetUtilization = totalFleetCapacity > 0 ? Math.round((totalSeatsBooked / totalFleetCapacity) * 100) : 0;

  const handleRegisterEmployee = (e: React.FormEvent) => {
    e.preventDefault();
    if (!empUsername || !empFullName) return;

    const db = getDatabase();
    const newEmpId = `usr-emp-${Date.now()}`;
    const newEmp: User = {
      id: newEmpId,
      username: empUsername.toLowerCase().trim(),
      fullName: empFullName.trim(),
      email: empEmail.trim() || `${empUsername}@railpulse.ir`,
      role: 'employee',
      passwordHash: `hash-${empUsername}-2026`,
      walletBalance: 2000000,
      assignedLines: [empLineId],
      createdAt: new Date().toISOString(),
    };

    db.users.push(newEmp);
    saveDatabase(db);

    recordAuditAction({
      actorId: currentUser.id,
      actorName: currentUser.fullName,
      actorRole: 'admin',
      actionType: 'employee_register',
      entityType: 'user',
      entityId: newEmpId,
      summaryFa: `ثبت پرسنل عملیاتی جدید: «${empFullName}» با دسترسی به خط ریلی انتخابی`,
      summaryEn: `Registered new operations employee: ${empFullName} with line dispatching access`,
      metadata: { employeeId: newEmpId, username: newEmp.username, assignedLines: newEmp.assignedLines },
      riskLevel: 'medium',
      status: 'success',
    });

    setShowAddEmpModal(false);
    setEmpFullName('');
    setEmpUsername('');
    setEmpEmail('');
    onRefreshData();
  };

  const handleRunSampleMigration = () => {
    setMigrationRunning(true);
    setTimeout(() => {
      // Legacy Python Dict payload simulation
      const sampleLegacy: LegacyV1Schema = {
        user_dict: {
          u_legacy_1: {
            username: 'ehsan.karimi',
            email: 'ehsan@legacy.ir',
            password: 'pwd',
            wallet: 850000,
          },
        },
        employee_dict: {
          emp_legacy_1: {
            username: 'hasan.dispatch',
            email: 'hasan@railpulse.ir',
            password: 'pwd',
            line_access: ['line-tehran-mashhad'],
          },
        },
        line_dic: {
          kashan_yazd: {
            name: 'خط کاشان - یزد (توسعه فاز ۱)',
            stations: ['کاشان', 'اردستان', 'نایین', 'یزد'],
            distances: [0, 95, 180, 310],
          },
        },
        train_dic: {
          tr_99: {
            train_num: '۹۹ کویر',
            line: 'kashan_yazd',
            departure: '14:20',
            speed: 130,
            stops: [10, 10],
            capacity: 220,
            price: 260000,
          },
        },
      };

      const res = migrateLegacyV1Data(sampleLegacy, currentUser);
      setMigrationRunning(false);
      setMigrationResultToast(
        isRtl
          ? `مهاجرت با موفقیت به پایان رسید. (${res.migratedLines} خط، ${res.migratedTrains} قطار، ${res.migratedUsers} کاربر اضافه شدند).`
          : `Migration finished: +${res.migratedLines} lines, +${res.migratedTrains} trains, +${res.migratedUsers} users.`
      );
      onRefreshData();
      setTimeout(() => setMigrationResultToast(null), 5000);
    }, 600);
  };

  const handleResetSeed = () => {
    if (confirm(isRtl ? 'آیا از بازنشانی کلیه داده‌های پایگاه داده به داده‌های اولیه اطمینان دارید؟' : 'Reset database back to initial seed data?')) {
      resetDatabaseToSeed();
      onRefreshData();
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast */}
      {migrationResultToast && (
        <div className="p-4 bg-indigo-950 border border-indigo-500/50 rounded-xl text-indigo-200 text-sm shadow-xl flex items-center justify-between animate-fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-indigo-400" />
            <span>{migrationResultToast}</span>
          </div>
          <button onClick={() => setMigrationResultToast(null)} className="text-xs text-indigo-400 underline">
            ✕
          </button>
        </div>
      )}

      {/* Real-Time Global Search Across Schedules, Tickets & Audit Logs */}
      <AdminGlobalSearchPanel
        lines={lines}
        schedules={schedules}
        tickets={tickets}
        language={language}
      />

      {/* Admin Sub-Tabs Navigation Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2.5 p-2 bg-slate-900 border border-slate-700/80 rounded-2xl shadow-lg">
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
          {/* Activity Monitor (Audit Log) - Highlighted as Requested */}
          <button
            onClick={() => setActiveAdminTab('activity-monitor')}
            className={`h-9 inline-flex items-center justify-center gap-1.5 px-3 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap shrink-0 ${
              activeAdminTab === 'activity-monitor'
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-900/30 ring-1 ring-blue-400/30'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Activity className="w-3.5 h-3.5 text-emerald-400 animate-pulse shrink-0" />
            <span>{t.tabActivityMonitor}</span>
            <span className="px-1.5 py-0.5 rounded-full text-[10px] leading-none bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono">
              Live
            </span>
          </button>

          <button
            onClick={() => setActiveAdminTab('overview')}
            className={`h-9 inline-flex items-center justify-center gap-1.5 px-3 rounded-xl text-xs font-semibold transition cursor-pointer whitespace-nowrap shrink-0 ${
              activeAdminTab === 'overview'
                ? 'bg-slate-800 text-white shadow border border-slate-700'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <span>{t.tabDashboard}</span>
          </button>

          <button
            onClick={() => setActiveAdminTab('lines')}
            className={`h-9 inline-flex items-center justify-center gap-1.5 px-3 rounded-xl text-xs font-semibold transition cursor-pointer whitespace-nowrap shrink-0 ${
              activeAdminTab === 'lines'
                ? 'bg-slate-800 text-white shadow border border-slate-700'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <MapPin className="w-3.5 h-3.5 text-blue-400 shrink-0" />
            <span>{t.tabLines}</span>
          </button>

          <button
            onClick={() => setActiveAdminTab('employees')}
            className={`h-9 inline-flex items-center justify-center gap-1.5 px-3 rounded-xl text-xs font-semibold transition cursor-pointer whitespace-nowrap shrink-0 ${
              activeAdminTab === 'employees'
                ? 'bg-slate-800 text-white shadow border border-slate-700'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Users className="w-3.5 h-3.5 text-purple-400 shrink-0" />
            <span>{t.tabStaff}</span>
          </button>

          <button
            onClick={() => setActiveAdminTab('migration')}
            className={`h-9 inline-flex items-center justify-center gap-1.5 px-3 rounded-xl text-xs font-semibold transition cursor-pointer whitespace-nowrap shrink-0 ${
              activeAdminTab === 'migration'
                ? 'bg-slate-800 text-white shadow border border-slate-700'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>{t.tabMigration}</span>
          </button>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* 60-Second Auto-Polling Status & Controls */}
          <div
            data-testid="admin-polling-status"
            className="h-9 inline-flex items-center gap-1.5 px-2.5 rounded-xl bg-slate-950/90 border border-emerald-500/30 text-[11px] text-slate-300 whitespace-nowrap shrink-0"
          >
            <span
              className={`w-2 h-2 rounded-full shrink-0 ${
                pollingState.isPaused
                  ? 'bg-amber-400'
                  : 'bg-emerald-400 animate-pulse'
              }`}
            />
            <Clock className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span className="font-semibold text-slate-200">
              {isRtl
                ? pollingState.isPaused
                  ? 'بروزرسانی متوقف'
                  : `بروزرسانی (۶۰ث): ${secondsRemaining.toLocaleString('fa-IR')} ث`
                : pollingState.isPaused
                ? 'Auto-Poll Paused'
                : `Auto-Sync (60s): ${secondsRemaining}s`}
            </span>
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
              #{pollingState.syncCount}
            </span>
            <button
              type="button"
              data-testid="admin-poll-now-btn"
              onClick={handleManualPollSync}
              className="w-6 h-6 inline-flex items-center justify-center rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-300 transition cursor-pointer shrink-0"
              title={
                isRtl
                  ? 'همگام‌سازی فوری داده‌ها و لاگ‌ها'
                  : 'Trigger immediate data & audit log refresh'
              }
            >
              <RefreshCw className="w-3 h-3" />
            </button>
            <button
              type="button"
              data-testid="admin-poll-toggle-btn"
              onClick={handleTogglePollPause}
              className="w-6 h-6 inline-flex items-center justify-center rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer shrink-0"
              title={
                isRtl
                  ? pollingState.isPaused
                    ? 'ادامه بروزرسانی خودکار ۶۰ ثانیه‌ای'
                    : 'توقف موقت بروزرسانی خودکار'
                  : pollingState.isPaused
                  ? 'Resume 60s Auto-Polling'
                  : 'Pause 60s Auto-Polling'
              }
            >
              {pollingState.isPaused ? (
                <Play className="w-3 h-3 text-amber-400" />
              ) : (
                <Pause className="w-3 h-3 text-slate-400" />
              )}
            </button>
          </div>

          <button
            onClick={handleResetSeed}
            className="h-9 inline-flex items-center justify-center gap-1.5 px-3 rounded-xl text-[11px] font-semibold bg-slate-800 hover:bg-rose-950/70 text-slate-300 hover:text-rose-300 border border-slate-700 transition cursor-pointer whitespace-nowrap shrink-0"
            title="Reset Database to Seed State"
          >
            <RefreshCw className="w-3.5 h-3.5 shrink-0" />
            <span>{isRtl ? 'بازنشانی (Seed)' : 'Reset Seed'}</span>
          </button>
        </div>
      </div>

      {/* SUB-TAB 1: DEDICATED ACTIVITY MONITOR (AUDIT LOG VIEWER) */}
      {activeAdminTab === 'activity-monitor' && (
        <AuditLogViewer
          language={language}
          onRefreshData={onRefreshData}
          refreshTick={refreshTick}
        />
      )}

      {/* SUB-TAB 2: EXECUTIVE DASHBOARD OVERVIEW */}
      {activeAdminTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-700/80 shadow flex flex-col justify-between min-h-[116px]">
              <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
                <span>{isRtl ? 'درآمد کل فروش بلیت' : 'Total Revenue'}</span>
                <DollarSign className="w-4 h-4 text-emerald-400 shrink-0" />
              </div>
              <div className="text-2xl font-bold text-emerald-400 font-mono my-1">
                {totalRevenue.toLocaleString(isRtl ? 'fa-IR' : 'en-US')}{' '}
                <span className="text-xs text-slate-400 font-normal">{isRtl ? 'تومان' : 'TMN'}</span>
              </div>
              <p className="text-[11px] text-slate-400">
                {tickets.filter((tk) => tk.status === 'confirmed').length.toLocaleString(isRtl ? 'fa-IR' : 'en-US')} {isRtl ? 'بلیت قطعی صادرشده' : 'confirmed tickets'}
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-700/80 shadow flex flex-col justify-between min-h-[116px]">
              <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
                <span>{isRtl ? 'ضریب اشغال ناوگان' : 'Fleet Utilization'}</span>
                <TrendingUp className="w-4 h-4 text-blue-400 shrink-0" />
              </div>
              <div className="text-2xl font-bold text-white font-mono my-1">
                {isRtl
                  ? `%${fleetUtilization.toLocaleString('fa-IR')}`
                  : `${fleetUtilization}%`}
              </div>
              <p className="text-[11px] text-slate-400">
                {totalSeatsBooked.toLocaleString(isRtl ? 'fa-IR' : 'en-US')} / {totalFleetCapacity.toLocaleString(isRtl ? 'fa-IR' : 'en-US')} {isRtl ? 'صندلی پر شده' : 'seats occupied'}
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-700/80 shadow flex flex-col justify-between min-h-[116px]">
              <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
                <span>{isRtl ? 'خطوط ریلی فعال' : 'Active Corridors'}</span>
                <MapPin className="w-4 h-4 text-purple-400 shrink-0" />
              </div>
              <div className="text-2xl font-bold text-purple-400 font-mono my-1">
                {lines.length.toLocaleString(isRtl ? 'fa-IR' : 'en-US')}{' '}
                <span className="text-sm font-semibold">{isRtl ? 'کریدور سراسری' : 'lines'}</span>
              </div>
              <p className="text-[11px] text-slate-400">{schedules.length.toLocaleString(isRtl ? 'fa-IR' : 'en-US')} {isRtl ? 'قطار زمان‌بندی‌شده' : 'scheduled trains'}</p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-700/80 shadow flex flex-col justify-between min-h-[116px]">
              <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
                <span>{isRtl ? 'شاخص سلامت و ایمنی' : 'Safety Integrity Index'}</span>
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              </div>
              <div className="text-2xl font-bold text-emerald-400 font-mono my-1">
                {isRtl ? '۹۹.۸٪' : '99.8%'}
              </div>
              <p className="text-[11px] text-slate-400">{isRtl ? 'موتور checkAccident برخط' : 'checkAccident engine active'}</p>
            </div>
          </div>

          {/* Visual Performance Analytics Dashboard (Recharts) */}
          <AdminPerformanceCharts
            lines={lines}
            schedules={schedules}
            tickets={tickets}
            language={language}
            refreshTick={refreshTick}
          />

          {/* Quick Shortcuts */}
          <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-700/80 shadow space-y-3">
            <h3 className="text-sm font-bold text-white">{isRtl ? 'دسترسی سریع مدیر ارشد' : 'Admin Quick Actions'}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                onClick={() => setActiveAdminTab('activity-monitor')}
                className="h-10 px-4 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/40 text-xs font-semibold cursor-pointer inline-flex items-center justify-center gap-2 whitespace-nowrap transition"
              >
                <Activity className="w-4 h-4 text-blue-400 shrink-0" />
                <span>{isRtl ? 'مشاهده Activity Monitor (لاگ‌های لحظه‌ای)' : 'Open Activity Monitor'}</span>
              </button>

              <button
                onClick={() => setShowAddEmpModal(true)}
                className="h-10 px-4 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/40 text-xs font-semibold cursor-pointer inline-flex items-center justify-center gap-2 whitespace-nowrap transition"
              >
                <PlusCircle className="w-4 h-4 text-purple-400 shrink-0" />
                <span>{isRtl ? 'ثبت پرسنل عملیاتی جدید' : 'Register New Staff'}</span>
              </button>

              <button
                onClick={() => setActiveAdminTab('migration')}
                className="h-10 px-4 rounded-xl bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-500/40 text-xs font-semibold cursor-pointer inline-flex items-center justify-center gap-2 whitespace-nowrap transition"
              >
                <Layers className="w-4 h-4 text-amber-400 shrink-0" />
                <span>{isRtl ? 'اجرای تست پایپ‌لاین مهاجرت پایتون v1' : 'Run Python v1 Migration'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 3: LINES & INFRASTRUCTURE */}
      {activeAdminTab === 'lines' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {lines.map((line) => (
              <div
                key={line.id}
                className="p-5 rounded-2xl bg-slate-900 border border-slate-700/80 shadow space-y-3"
              >
                <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                  <span className="font-mono text-xs font-bold text-blue-400 bg-blue-950 px-2 py-0.5 rounded border border-blue-700/40">
                    {line.code}
                  </span>
                  <span className="text-xs font-mono text-slate-300">{line.totalDistanceKm} km</span>
                </div>

                <div>
                  <h4 className="text-sm font-bold text-white">{isRtl ? line.nameFa : line.nameEn}</h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {line.stations.length} {isRtl ? 'ایستگاه و سکوی توقف' : 'stations along route'}
                  </p>
                </div>

                <div className="space-y-1.5 pt-2 border-t border-slate-800">
                  <div className="text-[11px] text-slate-400 font-semibold">{isRtl ? 'ایستگاه‌ها و فواصل (کیلومتر):' : 'Station Milestones:'}</div>
                  <div className="space-y-1 max-h-40 overflow-y-auto pe-1">
                    {line.stations.map((st, idx) => (
                      <div
                        key={st.id}
                        className="flex items-center justify-between text-xs py-1 px-2 rounded bg-slate-800/60"
                      >
                        <span className="text-slate-200">
                          {idx + 1}. {isRtl ? st.nameFa : st.nameEn}
                        </span>
                        <div className="flex items-center gap-2 text-slate-400 font-mono text-[11px]">
                          <span>{st.kmFromStart} km</span>
                          <span className="px-1.5 py-0.5 rounded bg-slate-700 text-blue-300 text-[10px]">
                            {st.platformsCount} {isRtl ? 'سکو' : 'plat.'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUB-TAB 4: EMPLOYEES & STAFF MANAGEMENT */}
      {activeAdminTab === 'employees' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-purple-400 shrink-0" />
              <span>{isRtl ? 'فهرست پرسنل، راهبران و دسترسی‌های خطوط ریلی' : 'Operations Staff & Line Access'}</span>
            </h3>
            <button
              onClick={() => setShowAddEmpModal(true)}
              className="h-9 inline-flex items-center justify-center gap-1.5 px-3.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-lg shadow-purple-900/30 transition cursor-pointer whitespace-nowrap shrink-0"
            >
              <PlusCircle className="w-4 h-4 shrink-0" />
              <span>{isRtl ? 'تعریف پرسنل جدید' : 'Register Staff'}</span>
            </button>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-700/80 bg-slate-900 shadow">
            <table className="w-full min-w-[760px] text-xs text-slate-200">
              <thead className="bg-slate-800 text-slate-300 font-semibold border-b border-slate-700">
                <tr>
                  <th className="py-3.5 px-4 text-start whitespace-nowrap">{isRtl ? 'نام و نام خانوادگی' : 'Full Name'}</th>
                  <th className="py-3.5 px-4 text-start whitespace-nowrap">{isRtl ? 'نام کاربری' : 'Username'}</th>
                  <th className="py-3.5 px-4 text-start whitespace-nowrap">{isRtl ? 'پست الکترونیک' : 'Email'}</th>
                  <th className="py-3.5 px-4 text-start whitespace-nowrap">{isRtl ? 'خطوط ریلی تحت هدایت' : 'Assigned Lines'}</th>
                  <th className="py-3.5 px-4 text-center whitespace-nowrap">{isRtl ? 'سطح دسترسی' : 'Role'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {getDatabase()
                  .users.filter((u) => u.role === 'employee' || u.role === 'admin')
                  .map((emp) => (
                    <tr key={emp.id} className="hover:bg-slate-800/40">
                      <td className="py-3.5 px-4 font-semibold text-white whitespace-nowrap">{emp.fullName}</td>
                      <td className="py-3.5 px-4 font-mono text-slate-300 whitespace-nowrap">{emp.username}</td>
                      <td className="py-3.5 px-4 font-mono text-slate-400 whitespace-nowrap">{emp.email}</td>
                      <td className="py-3.5 px-4">
                        <div className="flex flex-wrap gap-1">
                          {emp.assignedLines && emp.assignedLines.length > 0 ? (
                            emp.assignedLines.map((lid) => {
                              const l = lines.find((x) => x.id === lid);
                              return (
                                <span
                                  key={lid}
                                  className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-blue-300 text-[10px] whitespace-nowrap"
                                >
                                  {isRtl ? l?.nameFa : l?.nameEn}
                                </span>
                              );
                            })
                          ) : (
                            <span className="text-slate-400 text-[11px]">{isRtl ? 'دسترسی سراسری' : 'All Lines'}</span>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            emp.role === 'admin'
                              ? 'bg-rose-950 text-rose-300 border border-rose-600/40'
                              : 'bg-purple-950 text-purple-300 border border-purple-600/40'
                          }`}
                        >
                          {emp.role}
                        </span>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUB-TAB 5: LEGACY PYTHON CLI V1 TO ENTERPRISE V2 MIGRATION */}
      {activeAdminTab === 'migration' && (
        <div className="space-y-4">
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-700/80 shadow space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Database className="w-5 h-5 text-amber-400" />
                  {isRtl
                    ? 'پایپ‌لاین مهاجرت داده‌های کدبیس قدیمی پایتون به اسکیمای رابطه‌ای v2'
                    : 'Legacy Python CLI v1 to Relational Schema v2 Migration Pipeline'}
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  {isRtl
                    ? 'تبدیل ساختار دیکشنری‌های پایتون (user_dict, employee_dict, line_dic, train_dic) به موجودیت‌های رابطه‌ای همراه با اعتبارسنجی و ثبت خودکار در Activity Monitor'
                    : 'Transforms legacy Python CLI nested dictionaries into normalized relational entities with automated audit logging.'}
                </p>
              </div>

              <button
                disabled={migrationRunning}
                onClick={handleRunSampleMigration}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs shadow-lg shadow-amber-900/30 transition cursor-pointer"
              >
                <RefreshCw className={`w-4 h-4 ${migrationRunning ? 'animate-spin' : ''}`} />
                <span>{isRtl ? 'اجرای تست مهاجرت داده' : 'Run Migration Pipeline'}</span>
              </button>
            </div>
          </div>

          {/* Past Migration Logs */}
          <div className="rounded-2xl border border-slate-700/80 bg-slate-900 p-5 shadow space-y-3">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              {isRtl ? 'تاریخچه عملیات‌های مهاجرت ثبت‌شده:' : 'Migration Audit History:'}
            </h4>

            {getDatabase().migrationLogs.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">
                {isRtl ? 'هنوز مهاجرت دستی انجام نشده است.' : 'No manual migrations executed yet.'}
              </p>
            ) : (
              <div className="space-y-2">
                {getDatabase().migrationLogs.map((mlog) => (
                  <div key={mlog.id} className="p-3.5 bg-slate-800/70 rounded-xl border border-slate-700 text-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-emerald-400 font-bold">{mlog.id}</span>
                      <span className="text-[11px] text-slate-400 font-mono">{new Date(mlog.timestamp).toLocaleString()}</span>
                    </div>
                    <div className="flex flex-wrap gap-2 text-[11px] text-slate-300">
                      <span>{isRtl ? `کاربران انتقال‌یافته: ${mlog.migratedUsers}` : `Users: ${mlog.migratedUsers}`}</span>
                      <span>•</span>
                      <span>{isRtl ? `پرسنل: ${mlog.migratedEmployees}` : `Staff: ${mlog.migratedEmployees}`}</span>
                      <span>•</span>
                      <span>{isRtl ? `خطوط: ${mlog.migratedLines}` : `Lines: ${mlog.migratedLines}`}</span>
                      <span>•</span>
                      <span>{isRtl ? `قطارها: ${mlog.migratedTrains}` : `Trains: ${mlog.migratedTrains}`}</span>
                    </div>
                    <div className="p-2 bg-black/40 rounded border border-slate-800 text-[11px] text-slate-300">
                      {mlog.diffSummary.join(' | ')}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add Employee Modal */}
      {showAddEmpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6 flex flex-col gap-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-purple-400 shrink-0" />
                <span>{isRtl ? 'ثبت پرسنل عملیات خطوط ریلی' : 'Register Operations Staff'}</span>
              </h3>
              <button
                onClick={() => setShowAddEmpModal(false)}
                className="text-slate-400 hover:text-white p-1.5 rounded-lg bg-slate-800 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleRegisterEmployee} className="flex flex-col gap-4 text-xs">
              <div className="grid grid-cols-auto gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-slate-300 font-semibold">{isRtl ? 'نام و نام خانوادگی:' : 'Full Name:'}</label>
                  <input
                    type="text"
                    value={empFullName}
                    onChange={(e) => setEmpFullName(e.target.value)}
                    placeholder="مهندس علیرضا فتاحی"
                    className="w-full h-10 bg-slate-800 border border-slate-700 focus:border-purple-500 rounded-xl px-3 text-white focus:outline-none"
                    required
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-slate-300 font-semibold">{isRtl ? 'نام کاربری سیستم:' : 'Username:'}</label>
                  <input
                    type="text"
                    value={empUsername}
                    onChange={(e) => setEmpUsername(e.target.value)}
                    placeholder="alireza.dispatch"
                    className="w-full h-10 bg-slate-800 border border-slate-700 focus:border-purple-500 rounded-xl px-3 text-white font-mono focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-auto gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-slate-300 font-semibold">{isRtl ? 'پست الکترونیک سازمانی:' : 'Work Email:'}</label>
                  <input
                    type="email"
                    value={empEmail}
                    onChange={(e) => setEmpEmail(e.target.value)}
                    placeholder="alireza.dispatch@railpulse.ir"
                    className="w-full h-10 bg-slate-800 border border-slate-700 focus:border-purple-500 rounded-xl px-3 text-white font-mono focus:outline-none"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-slate-300 font-semibold">{isRtl ? 'تخصیص خط تحت هدایت:' : 'Assign Railway Line:'}</label>
                  <select
                    value={empLineId}
                    onChange={(e) => setEmpLineId(e.target.value)}
                    className="w-full h-10 bg-slate-800 border border-slate-700 focus:border-purple-500 rounded-xl px-3 text-white focus:outline-none cursor-pointer"
                  >
                    {lines.map((l) => (
                      <option key={l.id} value={l.id}>
                        {isRtl ? l.nameFa : l.nameEn}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddEmpModal(false)}
                  className="h-9 px-4 inline-flex items-center justify-center rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium cursor-pointer"
                >
                  {isRtl ? 'انصراف' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="h-9 px-5 inline-flex items-center justify-center rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold transition cursor-pointer shadow-lg shadow-purple-900/30"
                >
                  {isRtl ? 'ثبت و صدور مجوز' : 'Register & Audit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
