import {
  User,
  TrainLine,
  TrainSchedule,
  Ticket,
  WalletTransaction,
  LegacyV1Schema,
  MigrationLog,
} from '../types/railpulse';
import { recordAuditAction } from './auditLogService';

const DB_STORAGE_KEY = 'railpulse_db_v2';

export interface RailPulseDatabase {
  users: User[];
  lines: TrainLine[];
  schedules: TrainSchedule[];
  tickets: Ticket[];
  transactions: WalletTransaction[];
  migrationLogs: MigrationLog[];
  schemaVersion: string;
}

export const INITIAL_LINES: TrainLine[] = [
  {
    id: 'line-tehran-mashhad',
    code: 'LN-01',
    nameFa: 'خط اصلی تهران - مشهد (شرق)',
    nameEn: 'Tehran - Mashhad Main High-Speed Corridor',
    totalDistanceKm: 926,
    status: 'active',
    stations: [
      { id: 'st-thr', nameFa: 'تهران', nameEn: 'Tehran Central', code: 'THR', kmFromStart: 0, platformsCount: 8 },
      { id: 'st-smn', nameFa: 'سمنان', nameEn: 'Semnan', code: 'SMN', kmFromStart: 228, platformsCount: 2 },
      { id: 'st-shd', nameFa: 'شاهرود', nameEn: 'Shahroud', code: 'SHD', kmFromStart: 410, platformsCount: 2 },
      { id: 'st-nys', nameFa: 'نیشابور', nameEn: 'Neyshabur', code: 'NYS', kmFromStart: 810, platformsCount: 2 },
      { id: 'st-mhd', nameFa: 'مشهد مقدس', nameEn: 'Mashhad Holy Terminal', code: 'MHD', kmFromStart: 926, platformsCount: 6 },
    ],
  },
  {
    id: 'line-tehran-isfahan',
    code: 'LN-02',
    nameFa: 'خط سریع‌السیر تهران - اصفهان (مرکز)',
    nameEn: 'Tehran - Isfahan Express Corridor',
    totalDistanceKm: 410,
    status: 'active',
    stations: [
      { id: 'st-thr2', nameFa: 'تهران', nameEn: 'Tehran Central', code: 'THR', kmFromStart: 0, platformsCount: 8 },
      { id: 'st-qom', nameFa: 'قم', nameEn: 'Qom', code: 'QOM', kmFromStart: 132, platformsCount: 3 },
      { id: 'st-ksh', nameFa: 'کاشان', nameEn: 'Kashan', code: 'KSH', kmFromStart: 220, platformsCount: 2 },
      { id: 'st-isf', nameFa: 'اصفهان', nameEn: 'Isfahan Central', code: 'ISF', kmFromStart: 410, platformsCount: 4 },
    ],
  },
  {
    id: 'line-tabriz-tehran',
    code: 'LN-03',
    nameFa: 'خط تاریخی تبریز - تهران (شمال غرب)',
    nameEn: 'Tabriz - Tehran Golden Link',
    totalDistanceKm: 736,
    status: 'active',
    stations: [
      { id: 'st-tbz', nameFa: 'تبریز', nameEn: 'Tabriz', code: 'TBZ', kmFromStart: 0, platformsCount: 4 },
      { id: 'st-mrg', nameFa: 'مراغه', nameEn: 'Maragheh', code: 'MRG', kmFromStart: 129, platformsCount: 2 },
      { id: 'st-mnh', nameFa: 'میانه', nameEn: 'Mianeh', code: 'MNH', kmFromStart: 270, platformsCount: 2 },
      { id: 'st-znj', nameFa: 'زنجان', nameEn: 'Zanjan', code: 'ZNJ', kmFromStart: 421, platformsCount: 2 },
      { id: 'st-qzv', nameFa: 'قزوین', nameEn: 'Qazvin', code: 'QZV', kmFromStart: 592, platformsCount: 2 },
      { id: 'st-krj', nameFa: 'کرج', nameEn: 'Karaj', code: 'KRJ', kmFromStart: 695, platformsCount: 3 },
      { id: 'st-thr3', nameFa: 'تهران', nameEn: 'Tehran Central', code: 'THR', kmFromStart: 736, platformsCount: 8 },
    ],
  },
];

export const INITIAL_SCHEDULES: TrainSchedule[] = [
  {
    id: 'TR-101',
    trainNumber: '۱۰۱ فدک',
    trainNameFa: 'قطار ۵ ستاره فدک ویژه مشهد',
    trainNameEn: 'Fadak 5-Star VIP Express',
    lineId: 'line-tehran-mashhad',
    departureTime: '06:30',
    speedKmh: 160,
    stopTimesMinutes: [10, 15, 10], // stops at Semnan, Shahroud, Neyshabur
    totalCapacity: 280,
    bookedSeats: 112,
    ticketPrice: 480000, // Tomans
    trainType: 'high-speed',
    status: 'scheduled',
  },
  {
    id: 'TR-102',
    trainNumber: '۱۰۲ زندگی',
    trainNameFa: 'قطار لوکس زندگی تهران - مشهد',
    trainNameEn: 'Zendegi Luxury InterCity',
    lineId: 'line-tehran-mashhad',
    departureTime: '07:45',
    speedKmh: 140,
    stopTimesMinutes: [15, 20, 15],
    totalCapacity: 320,
    bookedSeats: 180,
    ticketPrice: 520000,
    trainType: 'express',
    status: 'scheduled',
  },
  {
    id: 'TR-103',
    trainNumber: '۱۰۳ نورالرضا',
    trainNameFa: 'قطار نورالرضا (کلاس اقتصادی)',
    trainNameEn: 'Nour Al-Reza Standard',
    lineId: 'line-tehran-mashhad',
    departureTime: '08:15',
    speedKmh: 110,
    stopTimesMinutes: [15, 20, 15],
    totalCapacity: 400,
    bookedSeats: 85,
    ticketPrice: 320000,
    trainType: 'intercity',
    status: 'scheduled',
  },
  {
    id: 'TR-201',
    trainNumber: '۲۰۱ پردیس',
    trainNameFa: 'قطار تندرو پردیس تهران - اصفهان',
    trainNameEn: 'Pardis Fast Commuter',
    lineId: 'line-tehran-isfahan',
    departureTime: '07:15',
    speedKmh: 150,
    stopTimesMinutes: [10, 10], // Qom, Kashan
    totalCapacity: 240,
    bookedSeats: 145,
    ticketPrice: 290000,
    trainType: 'high-speed',
    status: 'scheduled',
  },
  {
    id: 'TR-202',
    trainNumber: '۲۰۲ ریل‌باس',
    trainNameFa: 'ترن‌ست نگین تهران - اصفهان',
    trainNameEn: 'Negin Regional Express',
    lineId: 'line-tehran-isfahan',
    departureTime: '09:30',
    speedKmh: 130,
    stopTimesMinutes: [12, 12],
    totalCapacity: 260,
    bookedSeats: 90,
    ticketPrice: 240000,
    trainType: 'express',
    status: 'scheduled',
  },
  {
    id: 'TR-301',
    trainNumber: '۳۰۱ خلیج فارس',
    trainNameFa: 'قطار خلیج فارس تبریز - تهران',
    trainNameEn: 'Persian Gulf Night Sleeper',
    lineId: 'line-tabriz-tehran',
    departureTime: '18:00',
    speedKmh: 120,
    stopTimesMinutes: [10, 12, 15, 12, 10], // Maragheh, Mianeh, Zanjan, Qazvin, Karaj
    totalCapacity: 300,
    bookedSeats: 210,
    ticketPrice: 380000,
    trainType: 'express',
    status: 'scheduled',
  },
];

export const INITIAL_USERS: User[] = [
  {
    id: 'usr-admin-1',
    username: 'admin',
    fullName: 'سید علی محمدی',
    email: 'admin@railpulse.ir',
    role: 'admin',
    passwordHash: 'hash-admin-pass-2026',
    walletBalance: 25000000,
    nationalId: '0019283741',
    phoneNumber: '09121112233',
    createdAt: '2026-01-01T08:00:00Z',
  },
  {
    id: 'usr-emp-1',
    username: 'reza.staff',
    fullName: 'مهندس رضا شمس',
    email: 'reza.staff@railpulse.ir',
    role: 'employee',
    passwordHash: 'hash-emp-pass-2026',
    walletBalance: 3200000,
    nationalId: '0029384756',
    phoneNumber: '09123334455',
    assignedLines: ['line-tehran-mashhad', 'line-tehran-isfahan'],
    createdAt: '2026-01-10T09:30:00Z',
  },
  {
    id: 'usr-emp-2',
    username: 'maryam.kamali',
    fullName: 'مریم کمالی',
    email: 'maryam.kamali@railpulse.ir',
    role: 'employee',
    passwordHash: 'hash-maryam-2026',
    walletBalance: 2800000,
    nationalId: '0038475619',
    phoneNumber: '09125556677',
    assignedLines: ['line-tabriz-tehran'],
    createdAt: '2026-01-15T11:00:00Z',
  },
  {
    id: 'usr-pass-1',
    username: 'sara.rad',
    fullName: 'سارا راد',
    email: 'sara.rad@gmail.com',
    role: 'passenger',
    passwordHash: 'hash-sara-2026',
    walletBalance: 4500000,
    nationalId: '0076543219',
    phoneNumber: '09351234567',
    createdAt: '2026-02-01T14:20:00Z',
  },
  {
    id: 'usr-pass-2',
    username: 'farhad.amini',
    fullName: 'فرهاد امینی',
    email: 'farhad.amini@yahoo.com',
    role: 'passenger',
    passwordHash: 'hash-farhad-2026',
    walletBalance: 1200000,
    nationalId: '0087654321',
    phoneNumber: '09367890123',
    createdAt: '2026-02-10T16:40:00Z',
  },
];

export const INITIAL_TICKETS: Ticket[] = [
  {
    id: 'tkt-init-1',
    pnr: 'PNR-8921-FA',
    trainId: 'TR-101',
    trainNumber: '۱۰۱ فدک',
    trainNameFa: 'قطار ۵ ستاره فدک ویژه مشهد',
    trainNameEn: 'Fadak 5-Star VIP Express',
    lineId: 'line-tehran-mashhad',
    lineNameFa: 'خط اصلی تهران - مشهد (شرق)',
    lineNameEn: 'Tehran - Mashhad Main High-Speed Corridor',
    passengerId: 'usr-pass-1',
    passengerName: 'سارا راد',
    passengerNationalId: '0076543219',
    seatCount: 2,
    seatNumbers: [14, 15],
    unitPrice: 480000,
    totalPrice: 960000,
    departureStation: 'تهران (مرکزی)',
    arrivalStation: 'مشهد مقدس',
    departureTime: '06:30',
    estimatedArrivalTime: '12:55',
    bookingTimestamp: '2026-11-01T09:15:00Z',
    status: 'confirmed',
    qrPayload: 'RAILPULSE:PNR-8921-FA:PASSENGER-SARA_RAD:TR-101:SEATS-14-15:STATUS-CONFIRMED',
  },
];

export const INITIAL_TRANSACTIONS: WalletTransaction[] = [
  {
    id: 'tx-init-1',
    userId: 'usr-pass-1',
    type: 'credit',
    amount: 5460000,
    previousBalance: 0,
    newBalance: 5460000,
    referenceId: 'DEP-SHETAB-998822',
    descriptionFa: 'شارژ آنلاین کیف پول دیجیتال مسافر از درگاه بانکی شتاب',
    descriptionEn: 'Online wallet top-up via Shetab payment portal',
    timestamp: '2026-11-01T09:05:00Z',
  },
  {
    id: 'tx-init-2',
    userId: 'usr-pass-1',
    type: 'debit',
    amount: 960000,
    previousBalance: 5460000,
    newBalance: 4500000,
    referenceId: 'PNR-8921-FA',
    descriptionFa: 'کسر وجه جهت رزرو ۲ صندلی در قطار ۱۰۱ فدک تهران - مشهد',
    descriptionEn: 'Debit for reservation of 2 seats on Train 101 Tehran-Mashhad',
    timestamp: '2026-11-01T09:15:00Z',
  },
];

/**
 * Gets database from persistent storage or bootstraps initial dataset
 */
export function getDatabase(): RailPulseDatabase {
  if (typeof window === 'undefined') {
    return {
      users: INITIAL_USERS,
      lines: INITIAL_LINES,
      schedules: INITIAL_SCHEDULES,
      tickets: INITIAL_TICKETS,
      transactions: INITIAL_TRANSACTIONS,
      migrationLogs: [],
      schemaVersion: '2.0.0',
    };
  }

  try {
    const raw = localStorage.getItem(DB_STORAGE_KEY);
    if (!raw) {
      const initialDb: RailPulseDatabase = {
        users: INITIAL_USERS,
        lines: INITIAL_LINES,
        schedules: INITIAL_SCHEDULES,
        tickets: INITIAL_TICKETS,
        transactions: INITIAL_TRANSACTIONS,
        migrationLogs: [],
        schemaVersion: '2.0.0',
      };
      saveDatabase(initialDb);
      return initialDb;
    }
    const parsed = JSON.parse(raw);
    return {
      users: parsed.users || INITIAL_USERS,
      lines: parsed.lines || INITIAL_LINES,
      schedules: parsed.schedules || INITIAL_SCHEDULES,
      tickets: parsed.tickets || INITIAL_TICKETS,
      transactions: parsed.transactions || INITIAL_TRANSACTIONS,
      migrationLogs: parsed.migrationLogs || [],
      schemaVersion: parsed.schemaVersion || '2.0.0',
    };
  } catch (err) {
    console.error('Error reading RailPulse database:', err);
    return {
      users: INITIAL_USERS,
      lines: INITIAL_LINES,
      schedules: INITIAL_SCHEDULES,
      tickets: INITIAL_TICKETS,
      transactions: INITIAL_TRANSACTIONS,
      migrationLogs: [],
      schemaVersion: '2.0.0',
    };
  }
}

export function saveDatabase(db: RailPulseDatabase): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(DB_STORAGE_KEY, JSON.stringify(db));
  } catch (err) {
    console.error('Error writing RailPulse database:', err);
  }
}

/**
 * Reset database back to pristine initial state
 */
export function resetDatabaseToSeed(): RailPulseDatabase {
  const freshDb: RailPulseDatabase = {
    users: INITIAL_USERS,
    lines: INITIAL_LINES,
    schedules: INITIAL_SCHEDULES,
    tickets: INITIAL_TICKETS,
    transactions: INITIAL_TRANSACTIONS,
    migrationLogs: [],
    schemaVersion: '2.0.0',
  };
  saveDatabase(freshDb);
  recordAuditAction({
    actorId: 'system',
    actorName: 'مدیریت پایگاه داده سامانه (DB Reset)',
    actorRole: 'system',
    actionType: 'schedule_update',
    entityType: 'system',
    entityId: 'db-seed-reset',
    summaryFa: 'بازنشانی پایگاه داده سامانه به داده‌های پایه (Seed State)',
    summaryEn: 'Reset database to initial pristine seed state',
    riskLevel: 'high',
    status: 'success',
  });
  return freshDb;
}

/**
 * Legacy Python CLI V1 to Enterprise V2 Migration Pipeline
 */
export function migrateLegacyV1Data(legacy: LegacyV1Schema, actor: User): {
  success: boolean;
  migratedUsers: number;
  migratedEmployees: number;
  migratedLines: number;
  migratedTrains: number;
  diffSummary: string[];
} {
  const db = getDatabase();
  const diffSummary: string[] = [];

  let uCount = 0;
  let eCount = 0;
  let lCount = 0;
  let tCount = 0;

  // 1. Migrate Users
  if (legacy.user_dict) {
    for (const [key, val] of Object.entries(legacy.user_dict)) {
      const existing = db.users.find((u) => u.username.toLowerCase() === val.username.toLowerCase());
      if (!existing) {
        db.users.push({
          id: `usr-migrated-${Date.now()}-${uCount}`,
          username: val.username,
          fullName: val.username,
          email: val.email || `${val.username}@passenger.local`,
          role: 'passenger',
          passwordHash: `migrated-hash-${val.password || '123456'}`,
          walletBalance: Number(val.wallet) || 0,
          createdAt: new Date().toISOString(),
        });
        uCount++;
        diffSummary.push(`کاربر جدید «${val.username}» از ساختار دیکشنری با موجودی ${val.wallet} ریال منتقل شد.`);
      }
    }
  }

  // 2. Migrate Employees
  if (legacy.employee_dict) {
    for (const [key, val] of Object.entries(legacy.employee_dict)) {
      const existing = db.users.find((u) => u.username.toLowerCase() === val.username.toLowerCase());
      if (!existing) {
        db.users.push({
          id: `usr-emp-migrated-${Date.now()}-${eCount}`,
          username: val.username,
          fullName: val.username,
          email: val.email || `${val.username}@railpulse.ir`,
          role: 'employee',
          passwordHash: `migrated-hash-${val.password || '123456'}`,
          walletBalance: 1000000,
          assignedLines: val.line_access || ['line-tehran-mashhad'],
          createdAt: new Date().toISOString(),
        });
        eCount++;
        diffSummary.push(`پرسنل «${val.username}» به اسکیمای v2 با دسترسی خط منتقل شد.`);
      }
    }
  }

  // 3. Migrate Lines
  if (legacy.line_dic) {
    for (const [lineKey, lineVal] of Object.entries(legacy.line_dic)) {
      const lineId = `line-migrated-${lineKey.replace(/\s+/g, '-').toLowerCase()}`;
      const existing = db.lines.find((l) => l.nameFa === lineVal.name || l.id === lineId);
      if (!existing) {
        const stationsList = (lineVal.stations || []).map((stName, idx) => {
          const dist = lineVal.distances && lineVal.distances[idx] !== undefined ? lineVal.distances[idx] : idx * 100;
          return {
            id: `st-mig-${lineKey}-${idx}`,
            nameFa: stName,
            nameEn: stName,
            code: stName.slice(0, 3).toUpperCase(),
            kmFromStart: dist,
            platformsCount: 2,
          };
        });
        const totalDist = stationsList.length > 0 ? stationsList[stationsList.length - 1].kmFromStart : 500;

        db.lines.push({
          id: lineId,
          code: `LN-MIG-${lCount + 1}`,
          nameFa: lineVal.name || `خط انتقالی ${lineKey}`,
          nameEn: `Migrated Line ${lineKey}`,
          stations: stationsList,
          totalDistanceKm: totalDist,
          status: 'active',
        });
        lCount++;
        diffSummary.push(`خط ریلی «${lineVal.name || lineKey}» با ${stationsList.length} ایستگاه ثبت شد.`);
      }
    }
  }

  // 4. Migrate Trains
  if (legacy.train_dic) {
    for (const [trainKey, trainVal] of Object.entries(legacy.train_dic)) {
      const trainId = `TR-MIG-${trainVal.train_num || trainKey}`;
      const existing = db.schedules.find((s) => s.id === trainId || s.trainNumber === trainVal.train_num);
      if (!existing) {
        db.schedules.push({
          id: trainId,
          trainNumber: String(trainVal.train_num || trainKey),
          trainNameFa: `قطار انتقالی ${trainVal.train_num || trainKey}`,
          trainNameEn: `Migrated Train ${trainVal.train_num || trainKey}`,
          lineId: db.lines[0]?.id || 'line-tehran-mashhad',
          departureTime: trainVal.departure || '08:00',
          speedKmh: Number(trainVal.speed) || 120,
          stopTimesMinutes: trainVal.stops || [10, 10],
          totalCapacity: Number(trainVal.capacity) || 200,
          bookedSeats: 0,
          ticketPrice: Number(trainVal.price) || 250000,
          trainType: 'intercity',
          status: 'scheduled',
        });
        tCount++;
        diffSummary.push(`قطار «${trainVal.train_num || trainKey}» با ظرفیت ${trainVal.capacity} مسافر با موفقیت نرمالایز شد.`);
      }
    }
  }

  const logRecord: MigrationLog = {
    id: `mig-${Date.now()}`,
    legacyFormat: 'Python Dict (CLI v1)',
    targetVersion: 'RailPulse Relational v2',
    migratedUsers: uCount,
    migratedEmployees: eCount,
    migratedLines: lCount,
    migratedTrains: tCount,
    timestamp: new Date().toISOString(),
    status: 'completed',
    diffSummary,
  };

  db.migrationLogs.unshift(logRecord);
  saveDatabase(db);

  // Automated Audit Log
  recordAuditAction({
    actorId: actor.id,
    actorName: actor.fullName,
    actorRole: actor.role,
    actionType: 'migration_run',
    entityType: 'system',
    entityId: logRecord.id,
    summaryFa: `مهاجرت موفق داده‌های پایتون v1 به اسکیمای ریلی v2 (${uCount} مسافر، ${eCount} پرسنل، ${lCount} خط، ${tCount} قطار)`,
    summaryEn: `Successful migration of legacy Python v1 data to RailPulse v2 (${uCount} users, ${eCount} staff, ${lCount} lines, ${tCount} trains)`,
    metadata: { ...logRecord },
    riskLevel: 'high',
    status: 'success',
  });

  return {
    success: true,
    migratedUsers: uCount,
    migratedEmployees: eCount,
    migratedLines: lCount,
    migratedTrains: tCount,
    diffSummary,
  };
}
