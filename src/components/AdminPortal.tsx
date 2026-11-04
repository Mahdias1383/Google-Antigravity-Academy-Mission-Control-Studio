import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  User,
  TrainLine,
  TrainSchedule,
  Ticket,
  WalletTransaction,
  LegacyV1Schema,
  AuditLog,
} from '../types/railpulse';
import { AuditLogViewer } from './AuditLogViewer';
import { GlobalActivityTimeline } from './GlobalActivityTimeline';
import { AdminGlobalSearchPanel } from './AdminGlobalSearchPanel';
import { AdminPerformanceCharts } from './AdminPerformanceCharts';
import { AdminCommandPalette } from './AdminCommandPalette';
import { AdminPrintableReport } from './AdminPrintableReport';
import {
  AdminViewTabId,
  AdminQuickActionKey,
  isCommandPaletteShortcut,
} from '../services/commandPaletteService';
import {
  migrateLegacyV1Data,
  resetDatabaseToSeed,
  getDatabase,
  saveDatabase,
} from '../services/storageAndMigration';
import {
  recordAuditAction,
  getStoredAuditLogs,
  seedInitialAuditLogs,
  subscribeToAuditLogs,
} from '../services/auditLogService';
import { buildAdminPrintableReport } from '../services/adminPrintReportService';
import {
  DEFAULT_ADMIN_POLL_INTERVAL_MS,
  AdminPollingController,
  AdminPollingState,
  createAdminPollingController,
} from '../services/adminPollingService';
import {
  LoadingFeedbackState,
  LoadingOperationType,
  createLoadingFeedbackState,
  resolveAdminTabSkeletonVariant,
} from '../services/loadingFeedbackService';
import {
  PortalProgressBar,
  PortalLoadingSkeleton,
} from './PortalLoadingFeedback';
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
  CheckCircle,
  Server,
  DollarSign,
  Clock,
  Pause,
  Play,
  Command,
  Settings,
  Printer,
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
  language,
  onRefreshData,
}) => {
  const t = TRANSLATIONS[language];
  const isRtl = language === 'fa';

  const [activeAdminTab, setActiveAdminTab] = useState<AdminViewTabId>('activity-monitor');
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState<boolean>(false);
  const [isPrintPreviewOpen, setIsPrintPreviewOpen] = useState<boolean>(false);
  const [auditLogsForPrint, setAuditLogsForPrint] = useState<AuditLog[]>(() => {
    seedInitialAuditLogs();
    return getStoredAuditLogs();
  });

  useEffect(() => {
    const unsub = subscribeToAuditLogs(() => {
      setAuditLogsForPrint(getStoredAuditLogs());
    });
    return () => unsub();
  }, []);

  const [showAddEmpModal, setShowAddEmpModal] = useState(false);
  const [empFullName, setEmpFullName] = useState('');
  const [empUsername, setEmpUsername] = useState('');
  const [empEmail, setEmpEmail] = useState('');
  const [empLineId, setEmpLineId] = useState(lines[0]?.id || '');

  const [migrationRunning, setMigrationRunning] = useState(false);
  const [migrationResultToast, setMigrationResultToast] = useState<string | null>(null);

  const [loadingFeedback, setLoadingFeedback] = useState<LoadingFeedbackState>(() =>
    createLoadingFeedbackState('admin_tab_transition', 0, false, false, false, 'timeline')
  );
  const loadingTimersRef = useRef<Array<ReturnType<typeof setTimeout>>>([]);

  const clearLoadingTimers = () => {
    loadingTimersRef.current.forEach((timerId) => clearTimeout(timerId));
    loadingTimersRef.current = [];
  };

  const triggerAdminLoadingFeedback = (
    operationType: LoadingOperationType,
    targetTab: AdminViewTabId = activeAdminTab,
    durationMs = 420
  ) => {
    clearLoadingTimers();
    const variant = resolveAdminTabSkeletonVariant(targetTab);

    setLoadingFeedback((prev) =>
      createLoadingFeedbackState(operationType, 32, true, true, prev.isPinnedPreview, variant)
    );

    const stepMidTimer = setTimeout(() => {
      setLoadingFeedback((prev) =>
        createLoadingFeedbackState(operationType, 74, true, true, prev.isPinnedPreview, variant)
      );
    }, Math.round(durationMs * 0.45));

    const stepFullTimer = setTimeout(() => {
      setLoadingFeedback((prev) =>
        createLoadingFeedbackState(operationType, 100, true, false, prev.isPinnedPreview, variant)
      );
    }, Math.round(durationMs * 0.8));

    const completeTimer = setTimeout(() => {
      setLoadingFeedback((prev) =>
        createLoadingFeedbackState(
          operationType,
          prev.isPinnedPreview ? 68 : 100,
          false,
          false,
          prev.isPinnedPreview,
          variant
        )
      );
    }, durationMs);

    loadingTimersRef.current = [stepMidTimer, stepFullTimer, completeTimer];
  };

  useEffect(() => {
    return () => clearLoadingTimers();
  }, []);

  const handleSelectAdminTab = (nextTab: AdminViewTabId) => {
    setActiveAdminTab(nextTab);
    triggerAdminLoadingFeedback('admin_tab_transition', nextTab, 380);
  };

  const handleToggleSkeletonPreview = () => {
    clearLoadingTimers();
    const variant = resolveAdminTabSkeletonVariant(activeAdminTab);
    setLoadingFeedback((prev) => {
      const nextPinned = !prev.isPinnedPreview;
      return createLoadingFeedbackState(
        'admin_data_sync',
        nextPinned ? 68 : 0,
        nextPinned,
        nextPinned,
        nextPinned,
        variant
      );
    });
  };

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

  useEffect(() => {
    if (pollingState.isPaused) return;
    const countdownTimer = setInterval(() => {
      setSecondsRemaining((prev) => (prev <= 1 ? 60 : prev - 1));
    }, 1000);
    return () => clearInterval(countdownTimer);
  }, [pollingState.isPaused]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isCommandPaletteShortcut(e)) {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleManualPollSync = () => {
    triggerAdminLoadingFeedback('admin_data_sync', activeAdminTab, 450);
    pollingControllerRef.current?.triggerNow();
    setSecondsRemaining(60);
  };

  const handleTogglePollPause = () => {
    pollingControllerRef.current?.setPaused(!pollingState.isPaused);
  };

  const totalRevenue = tickets
    .filter((tk) => tk.status === 'confirmed')
    .reduce((sum, tk) => sum + tk.totalPrice, 0);

  const totalSeatsBooked = schedules.reduce((sum, s) => sum + s.bookedSeats, 0);
  const totalFleetCapacity = schedules.reduce((sum, s) => sum + s.totalCapacity, 0);
  const fleetUtilization =
    totalFleetCapacity > 0 ? Math.round((totalSeatsBooked / totalFleetCapacity) * 100) : 0;

  useEffect(() => {
    setAuditLogsForPrint(getStoredAuditLogs());
  }, [refreshTick, schedules, tickets]);

  const printableReportData = useMemo(
    () =>
      buildAdminPrintableReport({
        lines,
        schedules,
        tickets,
        auditLogs: auditLogsForPrint,
        currentUser,
      }),
    [lines, schedules, tickets, auditLogsForPrint, currentUser]
  );

  const handleTriggerBrowserPrint = () => {
    try {
      if (typeof window !== 'undefined' && typeof window.print === 'function') {
        window.print();
      }
    } catch {
      // Ignore sandbox print restrictions
    }
  };

  const handleOpenAndPrintReport = () => {
    setAuditLogsForPrint(getStoredAuditLogs());
    setIsPrintPreviewOpen(true);
    setTimeout(() => {
      handleTriggerBrowserPrint();
    }, 60);
  };

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
    triggerAdminLoadingFeedback('admin_migration_pipeline', 'migration', 650);
    setTimeout(() => {
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
    resetDatabaseToSeed();
    onRefreshData();
  };

  return (
    <div className="space-y-6">
      {migrationResultToast && (
        <div className="no-print p-4 bg-indigo-950 border border-indigo-500/50 rounded-xl text-indigo-200 text-sm shadow-xl flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-indigo-400" />
            <span>{migrationResultToast}</span>
          </div>
          <button onClick={() => setMigrationResultToast(null)} className="text-xs text-indigo-400 underline">
            ✕
          </button>
        </div>
      )}

      <AdminGlobalSearchPanel
        lines={lines}
        schedules={schedules}
        tickets={tickets}
        language={language}
        onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
      />

      {/* Admin Sub-Tabs Navigation Bar */}
      <div className="no-print flex flex-col lg:flex-row lg:items-center justify-between gap-2.5 p-2 bg-slate-900 border border-slate-700/80 rounded-2xl shadow-lg">
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
          <button
            data-testid="admin-tab-activity-monitor"
            onClick={() => handleSelectAdminTab('activity-monitor')}
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
            type="button"
            data-testid="admin-tab-global-timeline"
            onClick={() => handleSelectAdminTab('global-timeline')}
            className={`h-9 inline-flex items-center justify-center gap-1.5 px-3 rounded-xl text-xs font-semibold transition cursor-pointer whitespace-nowrap shrink-0 ${
              activeAdminTab === 'global-timeline'
                ? 'bg-gradient-to-r from-indigo-600 to-cyan-600 text-white shadow-lg shadow-indigo-900/30 ring-1 ring-cyan-400/30'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Clock className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <span>{isRtl ? 'خط زمانی جامع فعالیت‌ها' : 'Global Activity Timeline'}</span>
          </button>

          <button
            data-testid="admin-tab-overview"
            onClick={() => handleSelectAdminTab('overview')}
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
            data-testid="admin-tab-lines"
            onClick={() => handleSelectAdminTab('lines')}
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
            data-testid="admin-tab-employees"
            onClick={() => handleSelectAdminTab('employees')}
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
            data-testid="admin-tab-migration"
            onClick={() => handleSelectAdminTab('migration')}
            className={`h-9 inline-flex items-center justify-center gap-1.5 px-3 rounded-xl text-xs font-semibold transition cursor-pointer whitespace-nowrap shrink-0 ${
              activeAdminTab === 'migration'
                ? 'bg-slate-800 text-white shadow border border-slate-700'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>{t.tabMigration}</span>
          </button>

          <button
            type="button"
            data-testid="admin-tab-system-settings"
            onClick={() => handleSelectAdminTab('system-settings')}
            className={`h-9 inline-flex items-center justify-center gap-1.5 px-3 rounded-xl text-xs font-semibold transition cursor-pointer whitespace-nowrap shrink-0 ${
              activeAdminTab === 'system-settings'
                ? 'bg-slate-800 text-white shadow border border-slate-700'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Settings className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
            <span>{isRtl ? 'تنظیمات سامانه' : 'System Settings'}</span>
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            data-testid="open-command-palette-btn"
            onClick={() => setIsCommandPaletteOpen(true)}
            className="h-9 inline-flex items-center justify-center gap-1.5 px-3 rounded-xl text-xs font-bold bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 transition cursor-pointer whitespace-nowrap shrink-0"
          >
            <Command className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
            <span>{isRtl ? 'پالت فرمان' : 'Command Palette'}</span>
            <kbd
              dir="ltr"
              className="px-1.5 py-0.5 rounded bg-indigo-950/90 border border-indigo-500/40 font-mono text-[10px] text-indigo-200"
            >
              Ctrl+K
            </kbd>
          </button>

          <div
            data-testid="admin-polling-status"
            className="h-9 inline-flex items-center gap-1.5 px-2.5 rounded-xl bg-slate-950/90 border border-emerald-500/30 text-[11px] text-slate-300 whitespace-nowrap shrink-0"
          >
            <span
              className={`w-2 h-2 rounded-full shrink-0 ${
                pollingState.isPaused ? 'bg-amber-400' : 'bg-emerald-400 animate-pulse'
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
              title={isRtl ? 'همگام‌سازی فوری داده‌ها و لاگ‌ها' : 'Trigger immediate data & audit log refresh'}
            >
              <RefreshCw className="w-3 h-3" />
            </button>
            <button
              type="button"
              data-testid="admin-poll-toggle-btn"
              onClick={handleTogglePollPause}
              className="w-6 h-6 inline-flex items-center justify-center rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer shrink-0"
              title={isRtl ? 'توقف/ادامه بروزرسانی خودکار' : 'Pause/Resume 60s Auto-Polling'}
            >
              {pollingState.isPaused ? (
                <Play className="w-3 h-3 text-amber-400" />
              ) : (
                <Pause className="w-3 h-3 text-slate-400" />
              )}
            </button>
          </div>

          <button
            type="button"
            data-testid="admin-print-report-btn"
            onClick={handleOpenAndPrintReport}
            className={`h-9 inline-flex items-center justify-center gap-1.5 px-3 rounded-xl text-xs font-bold border transition cursor-pointer whitespace-nowrap shrink-0 ${
              isPrintPreviewOpen
                ? 'bg-emerald-600 text-white border-emerald-400 shadow-lg shadow-emerald-950/50'
                : 'bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border-emerald-500/40'
            }`}
            title={
              isRtl
                ? 'چاپ گزارش جامع آمار عملکرد داشبورد و لاگ‌های حسابرسی (Print Report)'
                : 'Print printer-friendly report of current audit logs and performance dashboard statistics'
            }
          >
            <Printer className="w-3.5 h-3.5 text-emerald-300 shrink-0" />
            <span>{isRtl ? 'چاپ گزارش (Print Report)' : 'Print Report'}</span>
          </button>

          <button
            type="button"
            data-testid="admin-toggle-skeleton-preview-btn"
            onClick={handleToggleSkeletonPreview}
            className={`h-9 inline-flex items-center justify-center gap-1.5 px-3 rounded-xl text-[11px] font-semibold border transition cursor-pointer whitespace-nowrap shrink-0 ${
              loadingFeedback.isPinnedPreview
                ? 'bg-cyan-600/30 text-cyan-200 border-cyan-400/60 shadow-lg shadow-cyan-950/50'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
            }`}
          >
            <Server className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <span>
              {loadingFeedback.isPinnedPreview
                ? isRtl
                  ? 'پایان پیش‌نمایش بارگذاری'
                  : 'Exit Loading View'
                : isRtl
                ? 'تست اسکلت بارگذاری'
                : 'Loading Skeleton'}
            </span>
          </button>

          <button
            onClick={handleResetSeed}
            className="h-9 inline-flex items-center justify-center gap-1.5 px-3 rounded-xl text-[11px] font-semibold bg-slate-800 hover:bg-rose-950/70 text-slate-300 hover:text-rose-300 border border-slate-700 transition cursor-pointer whitespace-nowrap shrink-0"
          >
            <RefreshCw className="w-3.5 h-3.5 shrink-0" />
            <span>{isRtl ? 'بازنشانی (Seed)' : 'Reset Seed'}</span>
          </button>
        </div>
      </div>

      {/* Printer-Friendly Report Sheet (Visible in @media print & when Print Report is triggered) */}
      <AdminPrintableReport
        report={printableReportData}
        language={language}
        isPreviewOpen={isPrintPreviewOpen}
        onClosePreview={() => setIsPrintPreviewOpen(false)}
        onTriggerBrowserPrint={handleTriggerBrowserPrint}
      />

      {/* Visual Progress Bar & Contextual Loading Skeleton */}
      <PortalProgressBar
        state={loadingFeedback}
        language={language}
        portalName="admin"
      />
      <PortalLoadingSkeleton
        state={loadingFeedback}
        language={language}
        portalName="admin"
      />

      {/* SUB-TAB 1: ACTIVITY MONITOR */}
      {activeAdminTab === 'activity-monitor' && (
        <div className="no-print space-y-6">
          <GlobalActivityTimeline
            language={language}
            currentUser={currentUser}
            refreshTick={refreshTick}
            onRefreshData={onRefreshData}
          />
          <AuditLogViewer
            language={language}
            onRefreshData={onRefreshData}
            refreshTick={refreshTick}
            onPrintReport={handleOpenAndPrintReport}
          />
        </div>
      )}

      {/* SUB-TAB 1B: STANDALONE GLOBAL ACTIVITY TIMELINE */}
      {activeAdminTab === 'global-timeline' && (
        <GlobalActivityTimeline
          language={language}
          currentUser={currentUser}
          refreshTick={refreshTick}
          onRefreshData={onRefreshData}
        />
      )}

      {/* SUB-TAB 2: EXECUTIVE DASHBOARD OVERVIEW */}
      {activeAdminTab === 'overview' && (
        <div className="no-print space-y-6">
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
                {tickets.filter((tk) => tk.status === 'confirmed').length.toLocaleString(isRtl ? 'fa-IR' : 'en-US')}{' '}
                {isRtl ? 'بلیت قطعی صادرشده' : 'confirmed tickets'}
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-700/80 shadow flex flex-col justify-between min-h-[116px]">
              <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
                <span>{isRtl ? 'ضریب اشغال ناوگان' : 'Fleet Utilization'}</span>
                <TrendingUp className="w-4 h-4 text-blue-400 shrink-0" />
              </div>
              <div className="text-2xl font-bold text-white font-mono my-1" dir="ltr">
                {fleetUtilization}%
              </div>
              <p className="text-[11px] text-slate-400">
                {totalSeatsBooked.toLocaleString(isRtl ? 'fa-IR' : 'en-US')} /{' '}
                {totalFleetCapacity.toLocaleString(isRtl ? 'fa-IR' : 'en-US')}{' '}
                {isRtl ? 'صندلی پر شده' : 'seats occupied'}
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
              <p className="text-[11px] text-slate-400">
                {schedules.length.toLocaleString(isRtl ? 'fa-IR' : 'en-US')}{' '}
                {isRtl ? 'قطار زمان‌بندی‌شده' : 'scheduled trains'}
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-700/80 shadow flex flex-col justify-between min-h-[116px]">
              <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
                <span>{isRtl ? 'شاخص سلامت و ایمنی' : 'Safety Integrity Index'}</span>
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              </div>
              <div className="text-2xl font-bold text-emerald-400 font-mono my-1" dir="ltr">
                99.8%
              </div>
              <p className="text-[11px] text-slate-400">
                {isRtl ? 'موتور checkAccident برخط' : 'checkAccident engine active'}
              </p>
            </div>
          </div>

          <AdminPerformanceCharts
            lines={lines}
            schedules={schedules}
            tickets={tickets}
            language={language}
            refreshTick={refreshTick}
          />
        </div>
      )}

      {/* SUB-TAB 3: LINES */}
      {activeAdminTab === 'lines' && (
        <div className="no-print grid grid-cols-1 md:grid-cols-3 gap-4">
          {lines.map((line) => (
            <div key={line.id} className="p-5 rounded-2xl bg-slate-900 border border-slate-700/80 shadow space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                <span className="font-mono text-xs font-bold text-blue-400 bg-blue-950 px-2 py-0.5 rounded border border-blue-700/40" dir="ltr">
                  {line.code}
                </span>
                <span className="text-xs font-mono text-slate-300" dir="ltr">{line.totalDistanceKm} km</span>
              </div>
              <h4 className="text-sm font-bold text-white">{isRtl ? line.nameFa : line.nameEn}</h4>
            </div>
          ))}
        </div>
      )}

      {/* SUB-TAB 4: EMPLOYEES */}
      {activeAdminTab === 'employees' && (
        <div className="no-print space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white">
              {isRtl ? 'فهرست پرسنل و دسترسی‌های خطوط ریلی' : 'Operations Staff & Line Access'}
            </h3>
            <button
              onClick={() => setShowAddEmpModal(true)}
              className="h-9 px-3.5 rounded-xl bg-purple-600 text-white text-xs font-semibold cursor-pointer"
            >
              {isRtl ? '+ تعریف پرسنل جدید' : '+ Register Staff'}
            </button>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-900 overflow-x-auto">
            <table className="w-full text-xs text-slate-200">
              <thead className="bg-slate-800 text-slate-300">
                <tr>
                  <th className="py-3 px-4 text-start">{isRtl ? 'نام و نام خانوادگی' : 'Full Name'}</th>
                  <th className="py-3 px-4 text-start">{isRtl ? 'نام کاربری' : 'Username'}</th>
                  <th className="py-3 px-4 text-start">{isRtl ? 'نقش' : 'Role'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {getDatabase()
                  .users.filter((u) => u.role === 'employee' || u.role === 'admin')
                  .map((emp) => (
                    <tr key={emp.id}>
                      <td className="py-3 px-4 font-semibold text-white">{emp.fullName}</td>
                      <td className="py-3 px-4 font-mono" dir="ltr">{emp.username}</td>
                      <td className="py-3 px-4 font-mono" dir="ltr">{emp.role}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUB-TAB 5: MIGRATION */}
      {activeAdminTab === 'migration' && (
        <div className="no-print p-5 rounded-2xl bg-slate-900 border border-slate-700/80 shadow flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-white">
              {isRtl
                ? 'پایپ‌لاین مهاجرت داده‌های کدبیس قدیمی پایتون به اسکیمای رابطه‌ای v2'
                : 'Legacy Python CLI v1 to Relational Schema v2 Migration Pipeline'}
            </h3>
          </div>
          <button
            disabled={migrationRunning}
            onClick={handleRunSampleMigration}
            className="px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs cursor-pointer"
          >
            {isRtl ? 'اجرای تست مهاجرت داده' : 'Run Migration Pipeline'}
          </button>
        </div>
      )}

      {/* SUB-TAB 6: SYSTEM SETTINGS */}
      {activeAdminTab === 'system-settings' && (
        <div data-testid="admin-system-settings-view" className="no-print p-6 rounded-2xl bg-slate-900 border border-slate-700/80 shadow space-y-4">
          <h3 className="text-base font-bold text-white">
            {isRtl ? 'تنظیمات سامانه و پیکربندی مرکز فرماندهی' : 'System Settings & Command Center Configuration'}
          </h3>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleManualPollSync}
              className="h-9 px-4 rounded-xl bg-emerald-600/20 text-emerald-300 border border-emerald-500/40 text-xs font-semibold cursor-pointer"
            >
              {isRtl ? 'همگام‌سازی فوری اکنون' : 'Sync Data Now'}
            </button>
            <button
              type="button"
              onClick={handleOpenAndPrintReport}
              className="h-9 px-4 rounded-xl bg-blue-600/20 text-blue-300 border border-blue-500/40 text-xs font-semibold cursor-pointer"
            >
              {isRtl ? 'چاپ گزارش رسمی (Print Report)' : 'Print Official Report'}
            </button>
          </div>
        </div>
      )}

      <AdminCommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        activeTab={activeAdminTab}
        onSelectTab={(targetTab) => handleSelectAdminTab(targetTab)}
        onExecuteAction={(actionKey) => {
          if (actionKey === 'register_staff') setShowAddEmpModal(true);
          else if (actionKey === 'sync_now') handleManualPollSync();
          else if (actionKey === 'toggle_polling') handleTogglePollPause();
          else if (actionKey === 'run_migration') {
            handleSelectAdminTab('migration');
            handleRunSampleMigration();
          } else if (actionKey === 'reset_seed') handleResetSeed();
        }}
        language={language}
      />

      {showAddEmpModal && (
        <div className="no-print fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6 space-y-4">
            <h3 className="text-base font-bold text-white">
              {isRtl ? 'ثبت پرسنل عملیات خطوط ریلی' : 'Register Operations Staff'}
            </h3>
            <form onSubmit={handleRegisterEmployee} className="flex flex-col gap-4 text-xs">
              <div className="grid grid-cols-auto gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-slate-300 font-semibold">{isRtl ? 'نام و نام خانوادگی:' : 'Full Name:'}</label>
                  <input
                    type="text"
                    value={empFullName}
                    onChange={(e) => setEmpFullName(e.target.value)}
                    className="h-10 bg-slate-800 border border-slate-700 rounded-xl px-3 text-white"
                    required
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-slate-300 font-semibold">{isRtl ? 'نام کاربری:' : 'Username:'}</label>
                  <input
                    type="text"
                    value={empUsername}
                    onChange={(e) => setEmpUsername(e.target.value)}
                    className="h-10 bg-slate-800 border border-slate-700 rounded-xl px-3 text-white font-mono"
                    required
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddEmpModal(false)}
                  className="h-9 px-4 rounded-xl bg-slate-800 text-slate-300"
                >
                  {isRtl ? 'انصراف' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="h-9 px-5 rounded-xl bg-purple-600 text-white font-semibold"
                >
                  {isRtl ? 'ثبت' : 'Register'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
