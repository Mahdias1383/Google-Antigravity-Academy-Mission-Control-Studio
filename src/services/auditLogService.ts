import {
  AuditLog,
  AuditActionType,
  AuditEntityType,
  AuditRiskLevel,
  UserRole,
} from '../types/railpulse';

const AUDIT_STORAGE_KEY = 'railpulse_audit_logs_v2';

// In-memory subscribers for real-time live events
type AuditListener = (newLog: AuditLog) => void;
const listeners = new Set<AuditListener>();

/**
 * Deterministic hash simulation for enterprise audit tamper detection
 */
function generateVerificationHash(
  id: string,
  timestamp: string,
  actorId: string,
  actionType: string,
  entityId: string,
  prevHash: string = '00000000'
): string {
  const raw = `${id}:${timestamp}:${actorId}:${actionType}:${entityId}:${prevHash}`;
  let hash = 0;
  for (let i = 0; i < raw.length; i++) {
    const char = raw.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // Convert to 32bit integer
  }
  const hex = Math.abs(hash).toString(16).padStart(8, '0');
  return `sha256-${hex}${prevHash.slice(0, 8)}`;
}

export function subscribeToAuditLogs(listener: AuditListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getStoredAuditLogs(): AuditLog[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(AUDIT_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error('Failed to parse audit logs from storage:', err);
    return [];
  }
}

export function saveStoredAuditLogs(logs: AuditLog[]): void {
  if (typeof window === 'undefined') return;
  try {
    // Keep last 1000 logs for high performance
    const capped = logs.slice(0, 1000);
    localStorage.setItem(AUDIT_STORAGE_KEY, JSON.stringify(capped));
  } catch (err) {
    console.error('Failed to save audit logs to storage:', err);
  }
}

export interface RecordAuditParams {
  actorId: string;
  actorName: string;
  actorRole: UserRole | 'system';
  actionType: AuditActionType;
  entityType: AuditEntityType;
  entityId: string;
  summaryFa: string;
  summaryEn: string;
  metadata?: Record<string, any>;
  riskLevel?: AuditRiskLevel;
  status?: 'success' | 'failure' | 'blocked';
  ipAddress?: string;
}

/**
 * Core Automated Audit Logger function called on all critical operations
 */
export function recordAuditAction(params: RecordAuditParams): AuditLog {
  const currentLogs = getStoredAuditLogs();
  const prevHash = currentLogs.length > 0 ? currentLogs[0].verificationHash : '00000000genesis';
  const id = `audit-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const timestamp = new Date().toISOString();

  const newLog: AuditLog = {
    id,
    timestamp,
    actorId: params.actorId || 'system',
    actorName: params.actorName || 'System Automated Dispatch',
    actorRole: params.actorRole || 'system',
    actionType: params.actionType,
    entityType: params.entityType,
    entityId: params.entityId,
    summaryFa: params.summaryFa,
    summaryEn: params.summaryEn,
    metadata: params.metadata || {},
    ipAddress: params.ipAddress || '192.168.10.42 (Enterprise VPN)',
    riskLevel: params.riskLevel || 'low',
    status: params.status || 'success',
    verificationHash: generateVerificationHash(
      id,
      timestamp,
      params.actorId,
      params.actionType,
      params.entityId,
      prevHash
    ),
  };

  // Prepend to top
  const updated = [newLog, ...currentLogs];
  saveStoredAuditLogs(updated);

  // Notify active UI listeners (e.g. Activity Monitor tab)
  listeners.forEach((listener) => {
    try {
      listener(newLog);
    } catch (e) {
      console.error('Audit listener error:', e);
    }
  });

  return newLog;
}

export interface AuditFilterCriteria {
  searchTerm?: string;
  actionType?: string;
  actorRole?: string;
  actorId?: string;
  startDate?: string; // YYYY-MM-DD
  endDate?: string;   // YYYY-MM-DD
  riskLevel?: string;
  entityType?: string;
  status?: string;
}

export function getDistinctAuditUsers(
  logs: AuditLog[]
): Array<{ actorId: string; actorName: string; actorRole: string; count: number }> {
  const map = new Map<
    string,
    { actorId: string; actorName: string; actorRole: string; count: number }
  >();
  for (const log of logs) {
    const key = log.actorId || log.actorName;
    const existing = map.get(key);
    if (existing) {
      existing.count += 1;
    } else {
      map.set(key, {
        actorId: log.actorId,
        actorName: log.actorName,
        actorRole: log.actorRole,
        count: 1,
      });
    }
  }
  return Array.from(map.values());
}

export function filterAuditLogs(logs: AuditLog[], criteria: AuditFilterCriteria): AuditLog[] {
  return logs.filter((log) => {
    if (criteria.actionType && criteria.actionType !== 'all') {
      if (log.actionType !== criteria.actionType) return false;
    }
    if (criteria.actorRole && criteria.actorRole !== 'all') {
      if (log.actorRole !== criteria.actorRole) return false;
    }
    if (criteria.actorId && criteria.actorId !== 'all') {
      if (log.actorId !== criteria.actorId && log.actorName !== criteria.actorId) {
        return false;
      }
    }
    if (criteria.riskLevel && criteria.riskLevel !== 'all') {
      if (log.riskLevel !== criteria.riskLevel) return false;
    }
    if (criteria.entityType && criteria.entityType !== 'all') {
      if (log.entityType !== criteria.entityType) return false;
    }
    if (criteria.status && criteria.status !== 'all') {
      if (log.status !== criteria.status) return false;
    }
    if (criteria.startDate && criteria.startDate.trim() !== '') {
      const logDateStr = log.timestamp.slice(0, 10);
      if (logDateStr < criteria.startDate.trim()) return false;
    }
    if (criteria.endDate && criteria.endDate.trim() !== '') {
      const logDateStr = log.timestamp.slice(0, 10);
      if (logDateStr > criteria.endDate.trim()) return false;
    }
    if (criteria.searchTerm && criteria.searchTerm.trim() !== '') {
      const q = criteria.searchTerm.toLowerCase().trim();
      const match =
        log.actorName.toLowerCase().includes(q) ||
        log.actorId.toLowerCase().includes(q) ||
        log.summaryFa.toLowerCase().includes(q) ||
        log.summaryEn.toLowerCase().includes(q) ||
        log.entityId.toLowerCase().includes(q) ||
        log.ipAddress.toLowerCase().includes(q) ||
        JSON.stringify(log.metadata).toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });
}

export function buildAuditExportFilename(
  format: 'csv' | 'json',
  criteria?: AuditFilterCriteria
): string {
  const parts = ['railpulse-audit-logs'];
  if (criteria?.actorId && criteria.actorId !== 'all') {
    parts.push(criteria.actorId.replace(/[^a-zA-Z0-9_-]/g, '_'));
  }
  if (criteria?.startDate) {
    parts.push(`from-${criteria.startDate}`);
  }
  if (criteria?.endDate) {
    parts.push(`to-${criteria.endDate}`);
  }
  if (parts.length === 1) {
    parts.push(new Date().toISOString().slice(0, 10));
  }
  return `${parts.join('-')}.${format}`;
}

export function computeAuditStats(logs: AuditLog[]) {
  const total = logs.length;
  let reservations = 0;
  let cancellations = 0;
  let scheduleEdits = 0;
  let highRisk = 0;
  let criticalRisk = 0;

  const now = new Date();
  const todayDateStr = now.toISOString().slice(0, 10);
  let todayCount = 0;

  for (const l of logs) {
    if (l.actionType === 'ticket_reservation') reservations++;
    if (l.actionType === 'ticket_cancellation') cancellations++;
    if (l.actionType === 'schedule_create' || l.actionType === 'schedule_update') scheduleEdits++;
    if (l.riskLevel === 'high') highRisk++;
    if (l.riskLevel === 'critical') criticalRisk++;
    if (l.timestamp.startsWith(todayDateStr)) todayCount++;
  }

  return {
    total,
    reservations,
    cancellations,
    scheduleEdits,
    highRisk,
    criticalRisk,
    todayCount,
  };
}

export function exportAuditLogsToJson(logs: AuditLog[]): string {
  return JSON.stringify(logs, null, 2);
}

export function exportAuditLogsToCsv(logs: AuditLog[]): string {
  const headers = [
    'Log ID',
    'Timestamp',
    'Actor ID',
    'Actor Name',
    'Actor Role',
    'Action Type',
    'Entity Type',
    'Entity ID',
    'Summary (FA)',
    'Summary (EN)',
    'Risk Level',
    'Status',
    'IP Address',
    'Hash',
  ];

  const rows = logs.map((l) => [
    `"${l.id}"`,
    `"${l.timestamp}"`,
    `"${l.actorId}"`,
    `"${l.actorName.replace(/"/g, '""')}"`,
    `"${l.actorRole}"`,
    `"${l.actionType}"`,
    `"${l.entityType}"`,
    `"${l.entityId}"`,
    `"${l.summaryFa.replace(/"/g, '""')}"`,
    `"${l.summaryEn.replace(/"/g, '""')}"`,
    `"${l.riskLevel}"`,
    `"${l.status}"`,
    `"${l.ipAddress}"`,
    `"${l.verificationHash}"`,
  ]);

  return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
}

/**
 * Populates realistic initial audit events if storage is currently empty
 */
export function seedInitialAuditLogs(): AuditLog[] {
  const existing = getStoredAuditLogs();
  if (existing.length > 0) return existing;

  const now = Date.now();
  const seedEvents: RecordAuditParams[] = [
    {
      actorId: 'usr-admin-1',
      actorName: 'سید علی محمدی (مدیر ارشد سامانه)',
      actorRole: 'admin',
      actionType: 'migration_run',
      entityType: 'system',
      entityId: 'schema-v2-relational',
      summaryFa: 'اجرای مهاجرت دیتابیس از دیکشنری‌های پایتون v1 به اسکیمای رابطه‌ای نرمالیزه v2',
      summaryEn: 'Executed database schema migration from Python CLI v1 dicts to v2 relational schema',
      metadata: { migratedLines: 3, migratedTrains: 5, migratedUsers: 4 },
      riskLevel: 'high',
      status: 'success',
    },
    {
      actorId: 'usr-emp-1',
      actorName: 'مهندس رضا شمس (راهبر دیسپچینگ)',
      actorRole: 'employee',
      actionType: 'schedule_create',
      entityType: 'schedule',
      entityId: 'TR-101',
      summaryFa: 'ثبت و زمان‌بندی قطار سریع‌السیر فدک (۱۰۱) در خط تهران - مشهد برای ساعت ۰۶:۳۰',
      summaryEn: 'Scheduled High-Speed Fadak Train 101 on Tehran-Mashhad line at 06:30',
      metadata: { trainNumber: 'TR-101', lineId: 'line-tehran-mashhad', speed: 160, capacity: 320 },
      riskLevel: 'medium',
      status: 'success',
    },
    {
      actorId: 'usr-pass-1',
      actorName: 'سارا راد (مسافر ویژه)',
      actorRole: 'passenger',
      actionType: 'wallet_deposit',
      entityType: 'wallet',
      entityId: 'tx-dep-1001',
      summaryFa: 'شارژ آنلاین کیف پول دیجیتال به مبلغ ۱٬۵۰۰٬۰۰۰ تومان از درگاه شتاب',
      summaryEn: 'Online wallet top-up of 1,500,000 Tomans via Shetab gateway',
      metadata: { amount: 1500000, reference: 'SHETAB-998822' },
      riskLevel: 'low',
      status: 'success',
    },
    {
      actorId: 'usr-pass-1',
      actorName: 'سارا راد (مسافر ویژه)',
      actorRole: 'passenger',
      actionType: 'ticket_reservation',
      entityType: 'ticket',
      entityId: 'PNR-8921-FA',
      summaryFa: 'رزرو قطعی ۲ صندلی در قطار ۱۰۱ تهران - مشهد به مبلغ ۹۶۰٬۰۰۰ تومان',
      summaryEn: 'Reserved 2 seats on Train 101 Tehran-Mashhad for 960,000 Tomans',
      metadata: { pnr: 'PNR-8921-FA', trainNumber: 'TR-101', seats: [14, 15], seatCount: 2, amount: 960000 },
      riskLevel: 'low',
      status: 'success',
    },
    {
      actorId: 'usr-emp-2',
      actorName: 'مریم کمالی (کنترل ترافیک خط ۲)',
      actorRole: 'employee',
      actionType: 'schedule_update',
      entityType: 'schedule',
      entityId: 'TR-202',
      summaryFa: 'تغییر سرعت سیر قطار پردیس ۲۰۲ از ۱۲۰ به ۱۳۵ کیلومتر بر ساعت به منظور بهینه‌سازی سیر',
      summaryEn: 'Modified speed of Pardis Train 202 from 120 to 135 km/h for timetable optimization',
      metadata: { oldSpeed: 120, newSpeed: 135, trainNumber: 'TR-202' },
      riskLevel: 'high',
      status: 'success',
    },
    {
      actorId: 'usr-admin-1',
      actorName: 'سید علی محمدی (مدیر ارشد سامانه)',
      actorRole: 'admin',
      actionType: 'employee_register',
      entityType: 'user',
      entityId: 'usr-emp-3',
      summaryFa: 'ثبت کاربر پرسنل جدید: علیرضا فتاحی (راهبر ارشد خط تبریز - تهران)',
      summaryEn: 'Registered new railway operations staff: Alireza Fattahi for Tabriz-Tehran line',
      metadata: { username: 'alireza.dispatch', assignedLines: ['line-tabriz-tehran'] },
      riskLevel: 'medium',
      status: 'success',
    },
  ];

  const generated: AuditLog[] = [];
  let prevH = '00000000genesis';
  for (let i = 0; i < seedEvents.length; i++) {
    const ev = seedEvents[i];
    const offsetMs = (seedEvents.length - i) * 12 * 60 * 1000;
    const timeStr = new Date(now - offsetMs).toISOString();
    const id = `audit-seed-${i + 1}`;
    const hash = generateVerificationHash(id, timeStr, ev.actorId, ev.actionType, ev.entityId, prevH);
    prevH = hash;

    generated.unshift({
      id,
      timestamp: timeStr,
      actorId: ev.actorId,
      actorName: ev.actorName,
      actorRole: ev.actorRole,
      actionType: ev.actionType,
      entityType: ev.entityType,
      entityId: ev.entityId,
      summaryFa: ev.summaryFa,
      summaryEn: ev.summaryEn,
      metadata: ev.metadata || {},
      ipAddress: '192.168.10.42',
      riskLevel: ev.riskLevel || 'low',
      status: ev.status || 'success',
      verificationHash: hash,
    });
  }

  saveStoredAuditLogs(generated);
  return generated;
}
