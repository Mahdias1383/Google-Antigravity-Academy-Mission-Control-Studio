import {
  User,
  TrainLine,
  TrainSchedule,
  Ticket,
  WalletTransaction,
  MigrationLog,
  LegacyV1Schema,
} from '../types/railpulse';
import { recordAuditAction } from './auditLogService';

export interface RailPulseDatabase {
  version: number;
  users: User[];
  lines: TrainLine[];
  schedules: TrainSchedule[];
  tickets: Ticket[];
  transactions: WalletTransaction[];
  migrationLogs: MigrationLog[];
}

export const INITIAL_USERS: User[] = [
  {
    id: 'usr-admin-1',
    username: 'admin',
    fullName: 'سید علی محمدی (مدیر ارشد سامانه)',
    email: 'admin@railpulse.ir',
    role: 'admin',
    passwordHash: 'hash-admin-2026',
    walletBalance: 15000000,
    createdAt: '2026-01-10T08:00:00.000Z',
  },
  {
    id: 'usr-emp-1',
    username: 'reza.shams',
    fullName: 'مهندس رضا شمس (راهبر دیسپچینگ)',
    email: 'reza.shams@railpulse.ir',
    role: 'employee',
    passwordHash: 'hash-reza-2026',
    walletBalance: 4500000,
    assignedLines: ['line-tehran-mashhad', 'line-tehran-isfahan'],
    createdAt: '2026-01-12T09:30:00.000Z',
  },
  {
    id: 'usr-emp-2',
    username: 'maryam.kamali',
    fullName: 'مریم کمالی (کنترل ترافیک خط ۲)',
    email: 'maryam.kamali@railpulse.ir',
    role: 'employee',
    passwordHash: 'hash-maryam-2026',
    walletBalance: 3200000,
    assignedLines: ['line-tehran-isfahan', 'line-tabriz-tehran'],
    createdAt: '2026-01-15T10:15:00.000Z',
  },
  {
    id: 'usr-pass-1',
    username: 'sara.rad',
    fullName: 'سارا راد (مسافر ویژه)',
    email: 'sara.rad@example.ir',
    role: 'passenger',
    passwordHash: 'hash-sara-2026',
    walletBalance: 3850000,
    createdAt: '2026-02-01T11:00:00.000Z',
  },
];

export const INITIAL_LINES: TrainLine[] = [
  {
    id: 'line-tehran-mashhad',
    code: 'IR-HSR-01',
    nameFa: 'خط اصلی تهران - مشهد (شرق)',
    nameEn: 'Tehran - Mashhad High-Speed Corridor',
    totalDistanceKm: 926,
    stations: [
      { id: 'st-thr', nameFa: 'تهران (مرکزی)', nameEn: 'Tehran Central', kmFromStart: 0, platformsCount: 6 },
      { id: 'st-smn', nameFa: 'سمنان', nameEn: 'Semnan', kmFromStart: 228, platformsCount: 3 },
      { id: 'st-shr', nameFa: 'شاهرود', nameEn: 'Shahroud', kmFromStart: 414, platformsCount: 4 },
      { id: 'st-nsh', nameFa: 'نیشابور', nameEn: 'Neyshabur', kmFromStart: 788, platformsCount: 3 },
      { id: 'st-msh', nameFa: 'مشهد مقدس', nameEn: 'Mashhad Terminal', kmFromStart: 926, platformsCount: 8 },
    ],
  },
  {
    id: 'line-tehran-isfahan',
    code: 'IR-EXP-02',
    nameFa: 'خط سریع‌السیر تهران - قم - اصفهان',
    nameEn: 'Tehran - Qom - Isfahan Express',
    totalDistanceKm: 415,
    stations: [
      { id: 'st-thr-2', nameFa: 'تهران (جنوب)', nameEn: 'Tehran South', kmFromStart: 0, platformsCount: 5 },
      { id: 'st-qom', nameFa: 'قم', nameEn: 'Qom Junction', kmFromStart: 156, platformsCount: 4 },
      { id: 'st-ksh', nameFa: 'کاشان', nameEn: 'Kashan', kmFromStart: 254, platformsCount: 3 },
      { id: 'st-isf', nameFa: 'اصفهان', nameEn: 'Isfahan Central', kmFromStart: 415, platformsCount: 6 },
    ],
  },
  {
    id: 'line-tabriz-tehran',
    code: 'IR-NWR-03',
    nameFa: 'خط شمال‌غرب تبریز - زنجان - تهران',
    nameEn: 'Tabriz - Zanjan - Tehran Corridor',
    totalDistanceKm: 736,
    stations: [
      { id: 'st-tbz', nameFa: 'تبریز', nameEn: 'Tabriz Grand', kmFromStart: 0, platformsCount: 5 },
      { id: 'st-mrh', nameFa: 'مراغه', nameEn: 'Maragheh', kmFromStart: 127, platformsCount: 3 },
      { id: 'st-znj', nameFa: 'زنجان', nameEn: 'Zanjan', kmFromStart: 421, platformsCount: 4 },
      { id: 'st-qzv', nameFa: 'قزوین', nameEn: 'Qazvin', kmFromStart: 592, platformsCount: 4 },
      { id: 'st-thr-3', nameFa: 'تهران (غرب)', nameEn: 'Tehran West', kmFromStart: 736, platformsCount: 6 },
    ],
  },
];

export const INITIAL_SCHEDULES: TrainSchedule[] = [
  {
    id: 'TR-101',
    trainNumber: '۱۰۱ فدک',
    trainNameFa: 'قطار ۵ ستاره سریع‌السیر فدک ۱۰۱',
    trainNameEn: 'Fadak 5-Star High-Speed 101',
    lineId: 'line-tehran-mashhad',
    departureTime: '06:30',
    speedKmh: 160,
    stopTimesMinutes: [10, 12, 10],
    totalCapacity: 320,
    bookedSeats: 268,
    ticketPrice: 480000,
    trainType: 'high_speed',
    status: 'active',
  },
  {
    id: 'TR-103',
    trainNumber: '۱۰۳ غزال',
    trainNameFa: 'قطار تندرو غزال ۱۰۳',
    trainNameEn: 'Ghazal Express 103',
    lineId: 'line-tehran-mashhad',
    departureTime: '09:15',
    speedKmh: 140,
    stopTimesMinutes: [12, 15, 10],
    totalCapacity: 280,
    bookedSeats: 195,
    ticketPrice: 390000,
    trainType: 'express',
    status: 'scheduled',
  },
  {
    id: 'TR-202',
    trainNumber: '۲۰۲ پردیس',
    trainNameFa: 'قطار خودکشش پردیس ۲۰۲',
    trainNameEn: 'Pardis EMU Express 202',
    lineId: 'line-tehran-isfahan',
    departureTime: '07:45',
    speedKmh: 150,
    stopTimesMinutes: [8, 10],
    totalCapacity: 240,
    bookedSeats: 210,
    ticketPrice: 310000,
    trainType: 'high_speed',
    status: 'active',
  },
  {
    id: 'TR-305',
    trainNumber: '۳۰۵ سبلان',
    trainNameFa: 'قطار کوپه‌ای سبلان ۳۰۵',
    trainNameEn: 'Sabalan Sleeper 305',
    lineId: 'line-tabriz-tehran',
    departureTime: '11:00',
    speedKmh: 130,
    stopTimesMinutes: [10, 12, 10],
    totalCapacity: 300,
    bookedSeats: 224,
    ticketPrice: 360000,
    trainType: 'sleeper',
    status: 'scheduled',
  },
];

export const INITIAL_TICKETS: Ticket[] = [
  {
    id: 'tk-1001',
    pnr: 'PNR-8921-FA',
    userId: 'usr-pass-1',
    passengerName: 'سارا راد (مسافر ویژه)',
    scheduleId: 'TR-101',
    trainNumber: '۱۰۱ فدک',
    lineNameFa: 'خط اصلی تهران - مشهد (شرق)',
    lineNameEn: 'Tehran - Mashhad High-Speed Corridor',
    departureTime: '06:30',
    seatCount: 2,
    seatNumbers: ['C1-12A', 'C1-12B'],
    totalPrice: 960000,
    purchasedAt: '2026-11-03T08:15:00.000Z',
    status: 'confirmed',
    qrPayload: 'RAILPULSE|PNR-8921-FA|TR-101|SEATS:2|VERIFIED',
  },
];

export const INITIAL_TRANSACTIONS: WalletTransaction[] = [
  {
    id: 'tx-dep-1001',
    userId: 'usr-pass-1',
    type: 'deposit',
    amount: 1500000,
    balanceAfter: 4810000,
    descriptionFa: 'شارژ آنلاین کیف پول دیجیتال از درگاه شتاب',
    descriptionEn: 'Online digital wallet top-up via Shetab gateway',
    timestamp: '2026-11-03T07:50:00.000Z',
  },
  {
    id: 'tx-pur-1002',
    userId: 'usr-pass-1',
    type: 'purchase',
    amount: 960000,
    balanceAfter: 3850000,
    descriptionFa: 'خرید ۲ بلیت قطار ۱۰۱ فدک (کد رزرو PNR-8921-FA)',
    descriptionEn: 'Purchased 2 tickets on Train 101 Fadak (PNR-8921-FA)',
    timestamp: '2026-11-03T08:15:00.000Z',
    referenceId: 'PNR-8921-FA',
  },
];

const DB_STORAGE_KEY = 'railpulse_enterprise_db_v2';

let memoryDb: RailPulseDatabase | null = null;

function createSeedDatabase(): RailPulseDatabase {
  return {
    version: 2,
    users: JSON.parse(JSON.stringify(INITIAL_USERS)),
    lines: JSON.parse(JSON.stringify(INITIAL_LINES)),
    schedules: JSON.parse(JSON.stringify(INITIAL_SCHEDULES)),
    tickets: JSON.parse(JSON.stringify(INITIAL_TICKETS)),
    transactions: JSON.parse(JSON.stringify(INITIAL_TRANSACTIONS)),
    migrationLogs: [],
  };
}

export function getDatabase(): RailPulseDatabase {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const raw = window.localStorage.getItem(DB_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as RailPulseDatabase;
        if (parsed && parsed.version === 2 && Array.isArray(parsed.lines)) {
          memoryDb = parsed;
          return parsed;
        }
      }
    } catch {
      // Fallback to memoryDb
    }
  }
  if (!memoryDb) {
    memoryDb = createSeedDatabase();
    saveDatabase(memoryDb);
  }
  return memoryDb;
}

export function saveDatabase(db: RailPulseDatabase): void {
  memoryDb = db;
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      window.localStorage.setItem(DB_STORAGE_KEY, JSON.stringify(db));
    } catch {
      // Ignore storage quota errors
    }
  }
}

export function resetDatabaseToSeed(): RailPulseDatabase {
  const seed = createSeedDatabase();
  saveDatabase(seed);
  return seed;
}

export function migrateLegacyV1Data(
  legacy: LegacyV1Schema,
  actor: User
): MigrationLog {
  const db = getDatabase();
  let migratedUsers = 0;
  let migratedEmployees = 0;
  let migratedLines = 0;
  let migratedTrains = 0;
  const diffSummary: string[] = [];

  for (const [key, u] of Object.entries(legacy.user_dict || {})) {
    const normUsername = u.username.toLowerCase().trim();
    if (!db.users.some((existing) => existing.username === normUsername)) {
      db.users.push({
        id: `usr-mig-${key}-${Date.now()}`,
        username: normUsername,
        fullName: u.username,
        email: u.email,
        role: 'passenger',
        passwordHash: `hash-${normUsername}`,
        walletBalance: Math.max(0, Number(u.wallet) || 0),
        createdAt: new Date().toISOString(),
      });
      migratedUsers++;
    }
  }

  for (const [key, emp] of Object.entries(legacy.employee_dict || {})) {
    const normUsername = emp.username.toLowerCase().trim();
    if (!db.users.some((existing) => existing.username === normUsername)) {
      db.users.push({
        id: `emp-mig-${key}-${Date.now()}`,
        username: normUsername,
        fullName: emp.username,
        email: emp.email,
        role: 'employee',
        passwordHash: `hash-${normUsername}`,
        walletBalance: 1000000,
        assignedLines: [...(emp.line_access || [])],
        createdAt: new Date().toISOString(),
      });
      migratedEmployees++;
    }
  }

  const lineKeyMap: Record<string, string> = {};
  for (const [key, l] of Object.entries(legacy.line_dic || {})) {
    const newLineId = `line-mig-${key}`;
    lineKeyMap[key] = newLineId;
    if (!db.lines.some((existing) => existing.id === newLineId)) {
      const stations = (l.stations || []).map((stName, idx) => ({
        id: `st-${key}-${idx}`,
        nameFa: stName,
        nameEn: stName,
        kmFromStart: l.distances?.[idx] ?? idx * 80,
        platformsCount: 3,
      }));
      const totalDist =
        stations.length > 0 ? stations[stations.length - 1].kmFromStart : 250;
      db.lines.push({
        id: newLineId,
        code: `MIG-${key.toUpperCase().slice(0, 6)}`,
        nameFa: l.name,
        nameEn: l.name,
        stations,
        totalDistanceKm: totalDist,
      });
      migratedLines++;
    }
  }

  for (const [key, tr] of Object.entries(legacy.train_dic || {})) {
    const newTrainId = `TR-MIG-${key.toUpperCase()}`;
    if (!db.schedules.some((existing) => existing.id === newTrainId)) {
      const targetLineId = lineKeyMap[tr.line] || db.lines[0]?.id || 'line-tehran-mashhad';
      db.schedules.push({
        id: newTrainId,
        trainNumber: tr.train_num,
        trainNameFa: `قطار انتقالی ${tr.train_num}`,
        trainNameEn: `Migrated Train ${tr.train_num}`,
        lineId: targetLineId,
        departureTime: tr.departure || '12:00',
        speedKmh: Math.max(60, Number(tr.speed) || 120),
        stopTimesMinutes: [...(tr.stops || [10, 10])],
        totalCapacity: Math.max(50, Number(tr.capacity) || 200),
        bookedSeats: 0,
        ticketPrice: Math.max(50000, Number(tr.price) || 250000),
        trainType: 'express',
        status: 'scheduled',
      });
      migratedTrains++;
    }
  }

  diffSummary.push(
    `+${migratedUsers} Users`,
    `+${migratedEmployees} Staff`,
    `+${migratedLines} Lines`,
    `+${migratedTrains} Trains`
  );

  const logEntry: MigrationLog = {
    id: `MIG-${Date.now()}`,
    timestamp: new Date().toISOString(),
    executedBy: actor.fullName,
    migratedUsers,
    migratedEmployees,
    migratedLines,
    migratedTrains,
    diffSummary,
  };

  db.migrationLogs.unshift(logEntry);
  saveDatabase(db);

  recordAuditAction({
    actorId: actor.id,
    actorName: actor.fullName,
    actorRole: actor.role,
    actionType: 'migration_run',
    entityType: 'system',
    entityId: logEntry.id,
    summaryFa: `اجرای موفق پایپ‌لاین مهاجرت v1 پایتون به v2 (${diffSummary.join('، ')})`,
    summaryEn: `Executed Python v1 to Enterprise v2 schema migration (${diffSummary.join(', ')})`,
    metadata: { migrationId: logEntry.id, diffSummary },
    riskLevel: 'high',
    status: 'success',
  });

  return logEntry;
}
