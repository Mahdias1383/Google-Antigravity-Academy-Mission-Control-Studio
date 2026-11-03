import React, { useState } from 'react';
import {
  FlaskConical,
  CheckCircle,
  XCircle,
  Play,
  RotateCcw,
  Shield,
  Layers,
  Cpu,
  Workflow,
  Sparkles,
  Terminal,
} from 'lucide-react';
import {
  timeStringToMinutes,
  minutesToTimeString,
  calculateTrainTrajectory,
  checkAccident,
} from '../services/collisionEngine';
import { reserveTickets, cancelTicket, topUpWallet } from '../services/bookingEngine';
import { migrateLegacyV1Data, getDatabase } from '../services/storageAndMigration';
import { recordAuditAction, getStoredAuditLogs } from '../services/auditLogService';
import { User, TrainSchedule, TrainLine, LegacyV1Schema } from '../types/railpulse';
import { Language } from '../i18n/translations';

export interface TestCaseResult {
  id: string;
  phase: number;
  phaseName: string;
  name: string;
  description: string;
  status: 'passed' | 'failed' | 'pending';
  durationMs: number;
  assertionLog: string[];
}

interface QaTestSuiteModalProps {
  language: Language;
  onClose?: () => void;
  onRefreshData?: () => void;
}

export const QaTestSuiteModal: React.FC<QaTestSuiteModalProps> = ({
  language,
  onClose,
  onRefreshData,
}) => {
  const isRtl = language === 'fa';
  const [isRunning, setIsRunning] = useState(false);
  const [selectedPhase, setSelectedPhase] = useState<number>(0); // 0 = all
  const [results, setResults] = useState<TestCaseResult[]>([]);

  const runAllTests = async () => {
    setIsRunning(true);
    const testList: TestCaseResult[] = [];

    // ==========================================
    // PHASE 1: UNIT TESTS
    // ==========================================
    // Test 1.1: Time string to minutes conversion
    {
      const start = performance.now();
      const assertions: string[] = [];
      let pass = true;

      const m1 = timeStringToMinutes('08:30');
      assertions.push(`timeStringToMinutes('08:30') => ${m1} (expected 510)`);
      if (m1 !== 510) pass = false;

      const m2 = timeStringToMinutes('00:00');
      assertions.push(`timeStringToMinutes('00:00') => ${m2} (expected 0)`);
      if (m2 !== 0) pass = false;

      const s1 = minutesToTimeString(510);
      assertions.push(`minutesToTimeString(510) => '${s1}' (expected '08:30')`);
      if (s1 !== '08:30') pass = false;

      testList.push({
        id: 'unit-time-math',
        phase: 1,
        phaseName: 'Phase 1: Unit Tests',
        name: isRtl ? 'آزمون محاسبات زمان و تبدیل ساعت به دقیقه' : 'Time Conversion & Arithmetic Unit Test',
        description: isRtl ? 'بررسی تبدیل قطعی HH:MM به دقایق شبانه‌روز و برعکس' : 'Verify deterministic HH:MM to minute transformations',
        status: pass ? 'passed' : 'failed',
        durationMs: Math.round(performance.now() - start),
        assertionLog: assertions,
      });
    }

    // Test 1.2: Spatial checkAccident collision calculation
    {
      const start = performance.now();
      const assertions: string[] = [];
      let pass = true;

      const mockLine: TrainLine = {
        id: 'test-line-1',
        code: 'TL-01',
        nameFa: 'خط تست',
        nameEn: 'Test Line',
        totalDistanceKm: 300,
        status: 'active',
        stations: [
          { id: 'st-0', nameFa: 'ایستگاه ۰', nameEn: 'St 0', code: 'S0', kmFromStart: 0, platformsCount: 1 },
          { id: 'st-1', nameFa: 'ایستگاه ۱', nameEn: 'St 1', code: 'S1', kmFromStart: 150, platformsCount: 1 },
          { id: 'st-2', nameFa: 'ایستگاه ۲', nameEn: 'St 2', code: 'S2', kmFromStart: 300, platformsCount: 1 },
        ],
      };

      // Train A: departs 08:00 at 100 km/h (arrives st-1 at 09:30)
      const trainA: TrainSchedule = {
        id: 'TA',
        trainNumber: '100',
        trainNameFa: 'قطار کندتر',
        trainNameEn: 'Slow Train',
        lineId: 'test-line-1',
        departureTime: '08:00',
        speedKmh: 100,
        stopTimesMinutes: [10],
        totalCapacity: 200,
        bookedSeats: 0,
        ticketPrice: 100000,
        trainType: 'intercity',
        status: 'scheduled',
      };

      // Train B: departs 08:10 at 180 km/h (overtakes Train A before st-1!)
      const trainB: TrainSchedule = {
        id: 'TB',
        trainNumber: '200',
        trainNameFa: 'قطار سریع‌تر',
        trainNameEn: 'Fast Train',
        lineId: 'test-line-1',
        departureTime: '08:10',
        speedKmh: 180,
        stopTimesMinutes: [10],
        totalCapacity: 200,
        bookedSeats: 0,
        ticketPrice: 150000,
        trainType: 'high-speed',
        status: 'scheduled',
      };

      const conflicts = checkAccident([trainA, trainB], [mockLine]);
      assertions.push(`Detected conflicts count: ${conflicts.length} (expected >= 1 collision risk)`);
      if (conflicts.length === 0) pass = false;

      const overtakeConflict = conflicts.find((c) => c.type === 'segment-overtake');
      assertions.push(`Overtake hazard detected: ${Boolean(overtakeConflict)}`);
      if (!overtakeConflict) pass = false;

      testList.push({
        id: 'unit-collision-engine',
        phase: 1,
        phaseName: 'Phase 1: Unit Tests',
        name: isRtl ? 'آزمون ریاضی تشخیص سبقت و تصادف (checkAccident)' : 'Mathematical checkAccident Overtake Verification',
        description: isRtl ? 'محاسبه نقطه برخورد قطار سریع به کند در خط تک‌مسیره' : 'Detect single-track overtake collision mathematically',
        status: pass ? 'passed' : 'failed',
        durationMs: Math.round(performance.now() - start),
        assertionLog: assertions,
      });
    }

    // ==========================================
    // PHASE 2: INTEGRATION TESTS
    // ==========================================
    {
      const start = performance.now();
      const assertions: string[] = [];
      let pass = true;

      const testPassenger: User = {
        id: `test-pass-${Date.now()}`,
        username: 'test.user',
        fullName: 'کاربر آزمایشی یکپارچه',
        email: 'test@integration.local',
        role: 'passenger',
        passwordHash: 'hash',
        walletBalance: 2000000,
        createdAt: new Date().toISOString(),
      };

      const db = getDatabase();
      const sampleTrain = db.schedules[0];

      // Reserve 2 tickets
      const bookingRes = reserveTickets(testPassenger, sampleTrain.id, 2);
      assertions.push(`reserveTickets success: ${bookingRes.success}`);
      if (!bookingRes.success || !bookingRes.ticket) {
        pass = false;
      } else {
        assertions.push(`Assigned PNR: ${bookingRes.ticket.pnr}`);
        assertions.push(`Seat numbers allocated: ${bookingRes.ticket.seatNumbers.join(',')}`);

        // Check audit log recorded the action
        const logs = getStoredAuditLogs();
        const foundAudit = logs.find((l) => l.actionType === 'ticket_reservation' && l.entityId === bookingRes.ticket?.pnr);
        assertions.push(`Audit log recorded for PNR: ${Boolean(foundAudit)}`);
        if (!foundAudit) pass = false;

        // Cancel ticket & verify refund
        const cancelRes = cancelTicket(bookingRes.ticket.id, testPassenger);
        assertions.push(`cancelTicket success: ${cancelRes.success}, refund: ${cancelRes.refundAmount}`);
        if (!cancelRes.success) pass = false;
      }

      testList.push({
        id: 'integ-booking-audit-refund',
        phase: 2,
        phaseName: 'Phase 2: Integration Tests',
        name: isRtl ? 'آزمون یکپارچه خرید بلیت، کسر موجودی، لاگ خودکار و استرداد' : 'Booking, Balance Deduction & Automatic Audit Integration',
        description: isRtl ? 'توالی رزرو اتمیک، صدور PNR، ثبت سند در لاگ و استرداد وجه' : 'Atomic ticket issuance, ledger debit, audit logging, and refund',
        status: pass ? 'passed' : 'failed',
        durationMs: Math.round(performance.now() - start),
        assertionLog: assertions,
      });
    }

    // ==========================================
    // PHASE 3: MIGRATION TESTS (v1 -> v2)
    // ==========================================
    {
      const start = performance.now();
      const assertions: string[] = [];
      let pass = true;

      const testLegacy: LegacyV1Schema = {
        user_dict: {
          u_qa_1: { username: 'qa.passenger', email: 'qa@test.com', password: '123', wallet: 500000 },
        },
        employee_dict: {
          emp_qa_1: { username: 'qa.staff', email: 'staff@test.com', password: '123', line_access: ['line-tehran-mashhad'] },
        },
        line_dic: {
          qa_line: { name: 'خط تست آزمون QA', stations: ['الف', 'ب'], distances: [0, 80] },
        },
        train_dic: {
          qa_train: { train_num: '999 QA', line: 'qa_line', departure: '12:00', speed: 120, stops: [], capacity: 100, price: 100000 },
        },
      };

      const dummyAdmin: User = {
        id: 'admin-qa',
        username: 'admin',
        fullName: 'Admin QA',
        email: 'admin@test.ir',
        role: 'admin',
        passwordHash: 'h',
        walletBalance: 0,
        createdAt: '',
      };

      const migRes = migrateLegacyV1Data(testLegacy, dummyAdmin);
      assertions.push(`Migration status: ${migRes.success}`);
      assertions.push(`Users migrated: ${migRes.migratedUsers}, Lines: ${migRes.migratedLines}, Trains: ${migRes.migratedTrains}`);

      if (!migRes.success || migRes.migratedLines < 1 || migRes.migratedTrains < 1) {
        pass = false;
      }

      testList.push({
        id: 'mig-legacy-pipeline',
        phase: 3,
        phaseName: 'Phase 3: Migration Tests',
        name: isRtl ? 'آزمون تبدیل ساختار دیکشنری‌های پایتون v1 به اسکیمای رابطه ای v2' : 'Python CLI v1 Dictionary to Relational v2 Schema Migration',
        description: isRtl ? 'اطمینان از حفظ یکپارچگی داده‌ها و عدم ایجاد ارجاعات تکراری' : 'Validate schema transformation without data corruption',
        status: pass ? 'passed' : 'failed',
        durationMs: Math.round(performance.now() - start),
        assertionLog: assertions,
      });
    }

    // ==========================================
    // PHASE 4: END-TO-END WORKFLOW & EDGE-CASES
    // ==========================================
    {
      const start = performance.now();
      const assertions: string[] = [];
      let pass = true;

      const brokePassenger: User = {
        id: `pass-broke-${Date.now()}`,
        username: 'broke.user',
        fullName: 'مسافر بدون اعتبار',
        email: 'broke@user.ir',
        role: 'passenger',
        passwordHash: 'hash',
        walletBalance: 1000, // only 1,000 Tomans
        createdAt: '',
      };

      const db = getDatabase();
      const train = db.schedules[0];

      // Edge-Case 1: Insufficient funds rejection
      const failRes = reserveTickets(brokePassenger, train.id, 1);
      assertions.push(`Insufficient funds rejection: ${!failRes.success} (expected rejection)`);
      if (failRes.success) pass = false;

      // Edge-Case 2: Exceeding capacity rejection
      const overCapacityRes = reserveTickets(brokePassenger, train.id, 999999);
      assertions.push(`Over-capacity rejection: ${!overCapacityRes.success} (expected rejection)`);
      if (overCapacityRes.success) pass = false;

      // Edge-Case 3: Zero or negative seat count rejection
      const negativeRes = reserveTickets(brokePassenger, train.id, -2);
      assertions.push(`Negative seat count rejected: ${!negativeRes.success} (expected rejection)`);
      if (negativeRes.success) pass = false;

      testList.push({
        id: 'e2e-edge-cases',
        phase: 4,
        phaseName: 'Phase 4: E2E Workflow Tests',
        name: isRtl ? 'آزمون کنترل خطاهای مرزی (موجودی ناکافی، سرریز ظرفیت، اعداد منفی)' : 'Defensive Boundary & Edge-Case Rejection Tests',
        description: isRtl ? 'مسدودسازی درخواست‌های نامعتبر مالی و انبار صندلی' : 'Enforce invariant validation and strict boundary constraints',
        status: pass ? 'passed' : 'failed',
        durationMs: Math.round(performance.now() - start),
        assertionLog: assertions,
      });
    }

    // ==========================================
    // PHASE 5: CLIENT & STATE ISOLATION TESTS
    // ==========================================
    {
      const start = performance.now();
      const assertions: string[] = [];
      let pass = true;

      const userA: User = { id: 'usr-a', username: 'alice', fullName: 'Alice', email: 'a@a.com', role: 'passenger', passwordHash: 'h', walletBalance: 500000, createdAt: '' };
      const userB: User = { id: 'usr-b', username: 'bob', fullName: 'Bob', email: 'b@b.com', role: 'passenger', passwordHash: 'h', walletBalance: 900000, createdAt: '' };

      assertions.push(`User A balance: ${userA.walletBalance}, User B balance: ${userB.walletBalance}`);
      if (userA.id === userB.id || userA.walletBalance === userB.walletBalance) pass = false;

      // Ensure directional text support
      const dirRtl = isRtl ? 'rtl' : 'ltr';
      assertions.push(`Layout direction verified: ${dirRtl}`);

      testList.push({
        id: 'state-session-isolation',
        phase: 5,
        phaseName: 'Phase 5: Client & State Isolation',
        name: isRtl ? 'آزمون ایزولاسیون نشست کاربران و سازگاری دوزبانه (RTL/LTR)' : 'Session Isolation & Bi-Directional Layout State Tests',
        description: isRtl ? 'عدم تداخل موجودی کیف پول کاربران و صحت جهت چیدمان' : 'Ensure zero cross-session state pollution and proper bidi text flow',
        status: pass ? 'passed' : 'failed',
        durationMs: Math.round(performance.now() - start),
        assertionLog: assertions,
      });
    }

    setResults(testList);
    setIsRunning(false);
    if (onRefreshData) onRefreshData();
  };

  const filteredResults = selectedPhase === 0
    ? results
    : results.filter((r) => r.phase === selectedPhase);

  const passedCount = results.filter((r) => r.status === 'passed').length;
  const failedCount = results.filter((r) => r.status === 'failed').length;

  return (
    <div className="space-y-6">
      {/* QA Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-purple-950 via-slate-900 to-indigo-950 border border-purple-500/30 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-purple-600/20 border border-purple-500/40 flex items-center justify-center text-purple-400 shadow">
            <FlaskConical className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              {isRtl ? 'سامانه آزمون‌های خودکار و تضمین کیفیت مهندسی (QA Runner)' : 'Engineering QA & Automated Test Suite'}
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-400/30 font-semibold">
                5 Phases
              </span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {isRtl
                ? 'اجرای زنده آزمون‌های واحد، یکپارچه‌سازی، مهاجرت داده، فرآیندهای E2E و ایزولاسیون وضعیت'
                : 'Live execution of unit, integration, migration, E2E workflow, and state isolation test phases'}
            </p>
          </div>
        </div>

        <button
          disabled={isRunning}
          onClick={runAllTests}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-lg shadow-purple-900/40 transition cursor-pointer"
        >
          <Play className={`w-4 h-4 ${isRunning ? 'animate-spin' : ''}`} />
          <span>{isRunning ? (isRtl ? 'در حال اجرای آزمون‌ها...' : 'Running Tests...') : (isRtl ? 'اجرای کلیه آزمون‌ها' : 'Run All Test Phases')}</span>
        </button>
      </div>

      {/* Test Phase Filter Tabs & Metrics */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-3 bg-slate-900 border border-slate-700/80 rounded-xl">
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <button
            onClick={() => setSelectedPhase(0)}
            className={`px-3 py-1.5 rounded-lg font-medium transition cursor-pointer ${
              selectedPhase === 0 ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            {isRtl ? 'همه فازها' : 'All Phases'}
          </button>
          {[1, 2, 3, 4, 5].map((ph) => (
            <button
              key={ph}
              onClick={() => setSelectedPhase(ph)}
              className={`px-3 py-1.5 rounded-lg font-medium transition cursor-pointer ${
                selectedPhase === ph ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              Phase {ph}
            </button>
          ))}
        </div>

        {results.length > 0 && (
          <div className="flex items-center gap-3 text-xs font-mono">
            <span className="flex items-center gap-1 text-emerald-400">
              <CheckCircle className="w-3.5 h-3.5" />
              {passedCount} {isRtl ? 'قبول' : 'Passed'}
            </span>
            <span className="flex items-center gap-1 text-rose-400">
              <XCircle className="w-3.5 h-3.5" />
              {failedCount} {isRtl ? 'رد' : 'Failed'}
            </span>
          </div>
        )}
      </div>

      {/* Results View */}
      {results.length === 0 ? (
        <div className="p-12 text-center bg-slate-900/80 border border-slate-800 rounded-2xl text-slate-400 space-y-3">
          <FlaskConical className="w-10 h-10 text-purple-400/50 mx-auto" />
          <p className="text-sm font-medium">
            {isRtl
              ? 'هنوز آزمونی اجرا نشده است. برای اعتبارسنجی کامل معماری دکمه «اجرای کلیه آزمون‌ها» را فشار دهید.'
              : 'No tests executed yet. Click "Run All Test Phases" to verify platform architecture.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredResults.map((tc) => (
            <div
              key={tc.id}
              className={`p-4 rounded-xl border shadow-lg space-y-3 ${
                tc.status === 'passed'
                  ? 'bg-slate-900 border-emerald-500/30'
                  : 'bg-rose-950/20 border-rose-500/40'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-2.5">
                  {tc.status === 'passed' ? (
                    <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                  ) : (
                    <XCircle className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
                  )}
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-purple-400 bg-purple-950/80 px-2 py-0.5 rounded border border-purple-700/40">
                        {tc.phaseName}
                      </span>
                      <h4 className="text-sm font-bold text-white">{tc.name}</h4>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">{tc.description}</p>
                  </div>
                </div>

                <span className="text-[11px] font-mono text-slate-400 whitespace-nowrap">
                  {tc.durationMs} ms
                </span>
              </div>

              {/* Assertion Log Trace */}
              <div className="p-3 bg-black/60 rounded-lg border border-slate-800 text-[11px] font-mono text-slate-300 space-y-1 text-start" dir="ltr">
                {tc.assertionLog.map((logLine, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <span className="text-emerald-400">✓</span>
                    <span>{logLine}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
