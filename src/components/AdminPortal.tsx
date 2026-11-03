import React, { useState } from 'react';
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
import { migrateLegacyV1Data, resetDatabaseToSeed, getDatabase, saveDatabase } from '../services/storageAndMigration';
import { recordAuditAction } from '../services/auditLogService';
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
      <div className="flex flex-wrap items-center justify-between gap-3 p-2 bg-slate-900 border border-slate-700/80 rounded-2xl shadow-lg">
        <div className="flex flex-wrap items-center gap-1.5">
          {/* Activity Monitor (Audit Log) - Highlighted as Requested */}
          <button
            onClick={() => setActiveAdminTab('activity-monitor')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeAdminTab === 'activity-monitor'
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-900/30 ring-2 ring-blue-400/30'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Activity className="w-4 h-4 text-emerald-400 animate-pulse" />
            <span>{t.tabActivityMonitor}</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              Live Audit
            </span>
          </button>

          <button
            onClick={() => setActiveAdminTab('overview')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
              activeAdminTab === 'overview'
                ? 'bg-slate-800 text-white shadow'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <TrendingUp className="w-4 h-4 text-cyan-400" />
            <span>{t.tabDashboard}</span>
          </button>

          <button
            onClick={() => setActiveAdminTab('lines')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
              activeAdminTab === 'lines'
                ? 'bg-slate-800 text-white shadow'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <MapPin className="w-4 h-4 text-blue-400" />
            <span>{t.tabLines}</span>
          </button>

          <button
            onClick={() => setActiveAdminTab('employees')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
              activeAdminTab === 'employees'
                ? 'bg-slate-800 text-white shadow'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Users className="w-4 h-4 text-purple-400" />
            <span>{t.tabStaff}</span>
          </button>

          <button
            onClick={() => setActiveAdminTab('migration')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
              activeAdminTab === 'migration'
                ? 'bg-slate-800 text-white shadow'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Layers className="w-4 h-4 text-amber-400" />
            <span>{t.tabMigration}</span>
          </button>
        </div>

        <button
          onClick={handleResetSeed}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium bg-slate-800 hover:bg-rose-950/70 text-slate-400 hover:text-rose-300 border border-slate-700 transition cursor-pointer"
          title="Reset Database to Seed State"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>{isRtl ? 'بازنشانی پایگاه داده (Seed)' : 'Reset DB Seed'}</span>
        </button>
      </div>

      {/* SUB-TAB 1: DEDICATED ACTIVITY MONITOR (AUDIT LOG VIEWER) */}
      {activeAdminTab === 'activity-monitor' && (
        <AuditLogViewer language={language} onRefreshData={onRefreshData} />
      )}

      {/* SUB-TAB 2: EXECUTIVE DASHBOARD OVERVIEW */}
      {activeAdminTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-700/80 shadow space-y-2">
              <div className="flex items-center justify-between text-slate-400 text-xs">
                <span>{isRtl ? 'درآمد کل فروش بلیت' : 'Total Revenue'}</span>
                <DollarSign className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-2xl font-bold text-emerald-400 font-mono">
                {totalRevenue.toLocaleString(isRtl ? 'fa-IR' : 'en-US')}{' '}
                <span className="text-xs text-slate-400 font-normal">{isRtl ? 'تومان' : 'TMN'}</span>
              </div>
              <p className="text-[11px] text-slate-400">
                {tickets.filter((tk) => tk.status === 'confirmed').length} {isRtl ? 'بلیت قطعی صادرشده' : 'confirmed tickets'}
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-700/80 shadow space-y-2">
              <div className="flex items-center justify-between text-slate-400 text-xs">
                <span>{isRtl ? 'ضریب اشغال ناوگان' : 'Fleet Utilization'}</span>
                <TrendingUp className="w-4 h-4 text-blue-400" />
              </div>
              <div className="text-2xl font-bold text-white font-mono">
                %{fleetUtilization.toLocaleString(isRtl ? 'fa-IR' : 'en-US')}
              </div>
              <p className="text-[11px] text-slate-400">
                {totalSeatsBooked} / {totalFleetCapacity} {isRtl ? 'صندلی پر شده' : 'seats occupied'}
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-700/80 shadow space-y-2">
              <div className="flex items-center justify-between text-slate-400 text-xs">
                <span>{isRtl ? 'خطوط ریلی فعال' : 'Active Corridors'}</span>
                <MapPin className="w-4 h-4 text-purple-400" />
              </div>
              <div className="text-2xl font-bold text-purple-400 font-mono">
                {lines.length} {isRtl ? 'کریدور سراسری' : 'lines'}
              </div>
              <p className="text-[11px] text-slate-400">{schedules.length} {isRtl ? 'قطار زمان‌بندی‌شده' : 'scheduled trains'}</p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-700/80 shadow space-y-2">
              <div className="flex items-center justify-between text-slate-400 text-xs">
                <span>{isRtl ? 'شاخص سلامت و ایمنی' : 'Safety Integrity Index'}</span>
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-2xl font-bold text-emerald-400 font-mono">
                ۹۹.۸٪
              </div>
              <p className="text-[11px] text-slate-400">{isRtl ? 'موتور checkAccident برخط' : 'checkAccident engine active'}</p>
            </div>
          </div>

          {/* Quick Shortcuts */}
          <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-700/80 shadow space-y-3">
            <h3 className="text-sm font-bold text-white">{isRtl ? 'دسترسی سریع مدیر ارشد' : 'Admin Quick Actions'}</h3>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => setActiveAdminTab('activity-monitor')}
                className="px-4 py-2.5 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/40 text-xs font-semibold cursor-pointer flex items-center gap-2"
              >
                <Activity className="w-4 h-4 text-blue-400" />
                <span>{isRtl ? 'مشاهده Activity Monitor (لاگ‌های لحظه‌ای)' : 'Open Activity Monitor'}</span>
              </button>

              <button
                onClick={() => setShowAddEmpModal(true)}
                className="px-4 py-2.5 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/40 text-xs font-semibold cursor-pointer flex items-center gap-2"
              >
                <PlusCircle className="w-4 h-4 text-purple-400" />
                <span>{isRtl ? 'ثبت پرسنل عملیاتی جدید' : 'Register New Staff'}</span>
              </button>

              <button
                onClick={() => setActiveAdminTab('migration')}
                className="px-4 py-2.5 rounded-xl bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-500/40 text-xs font-semibold cursor-pointer flex items-center gap-2"
              >
                <Layers className="w-4 h-4 text-amber-400" />
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
                  <div className="space-y-1 max-h-40 overflow-y-auto pr-1">
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
                          <span className="px-1.5 py-0.2 rounded bg-slate-700 text-blue-300 text-[10px]">
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
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-purple-400" />
              {isRtl ? 'فهرست پرسنل، راهبران و دسترسی‌های خطوط ریلی' : 'Operations Staff & Line Access'}
            </h3>
            <button
              onClick={() => setShowAddEmpModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-lg shadow-purple-900/30 transition cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>{isRtl ? 'تعریف پرسنل جدید' : 'Register Staff'}</span>
            </button>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-700/80 bg-slate-900 shadow">
            <table className="w-full text-xs text-slate-200">
              <thead className="bg-slate-800 text-slate-300 font-semibold border-b border-slate-700">
                <tr>
                  <th className="py-3 px-4 text-start">{isRtl ? 'نام و نام خانوادگی' : 'Full Name'}</th>
                  <th className="py-3 px-4 text-start">{isRtl ? 'نام کاربری' : 'Username'}</th>
                  <th className="py-3 px-4 text-start">{isRtl ? 'پست الکترونیک' : 'Email'}</th>
                  <th className="py-3 px-4 text-start">{isRtl ? 'خطوط ریلی تحت هدایت' : 'Assigned Lines'}</th>
                  <th className="py-3 px-4 text-center">{isRtl ? 'سطح دسترسی' : 'Role'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {getDatabase()
                  .users.filter((u) => u.role === 'employee' || u.role === 'admin')
                  .map((emp) => (
                    <tr key={emp.id} className="hover:bg-slate-800/40">
                      <td className="py-3 px-4 font-semibold text-white">{emp.fullName}</td>
                      <td className="py-3 px-4 font-mono text-slate-300">{emp.username}</td>
                      <td className="py-3 px-4 font-mono text-slate-400">{emp.email}</td>
                      <td className="py-3 px-4">
                        <div className="flex flex-wrap gap-1">
                          {emp.assignedLines && emp.assignedLines.length > 0 ? (
                            emp.assignedLines.map((lid) => {
                              const l = lines.find((x) => x.id === lid);
                              return (
                                <span
                                  key={lid}
                                  className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-blue-300 text-[10px]"
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
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
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
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-purple-400" />
                {isRtl ? 'ثبت پرسنل عملیات خطوط ریلی' : 'Register Operations Staff'}
              </h3>
              <button
                onClick={() => setShowAddEmpModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg bg-slate-800 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleRegisterEmployee} className="space-y-3.5 text-xs">
              <div>
                <label className="text-slate-300 block mb-1 font-semibold">{isRtl ? 'نام و نام خانوادگی:' : 'Full Name:'}</label>
                <input
                  type="text"
                  value={empFullName}
                  onChange={(e) => setEmpFullName(e.target.value)}
                  placeholder="مهندس علیرضا فتاحی"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white"
                  required
                />
              </div>

              <div>
                <label className="text-slate-300 block mb-1 font-semibold">{isRtl ? 'نام کاربری سیستم:' : 'Username:'}</label>
                <input
                  type="text"
                  value={empUsername}
                  onChange={(e) => setEmpUsername(e.target.value)}
                  placeholder="alireza.dispatch"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white font-mono"
                  required
                />
              </div>

              <div>
                <label className="text-slate-300 block mb-1 font-semibold">{isRtl ? 'پست الکترونیک سازمانی:' : 'Work Email:'}</label>
                <input
                  type="email"
                  value={empEmail}
                  onChange={(e) => setEmpEmail(e.target.value)}
                  placeholder="alireza.dispatch@railpulse.ir"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white font-mono"
                />
              </div>

              <div>
                <label className="text-slate-300 block mb-1 font-semibold">{isRtl ? 'تخصیص خط تحت هدایت:' : 'Assign Railway Line:'}</label>
                <select
                  value={empLineId}
                  onChange={(e) => setEmpLineId(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white"
                >
                  {lines.map((l) => (
                    <option key={l.id} value={l.id}>
                      {isRtl ? l.nameFa : l.nameEn}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddEmpModal(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
                >
                  {isRtl ? 'انصراف' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-semibold transition cursor-pointer"
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
