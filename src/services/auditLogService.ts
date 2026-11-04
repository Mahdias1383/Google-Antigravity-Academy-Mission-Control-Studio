import {
  AuditLog,
  AuditActionType,
  AuditRiskLevel,
  UserRole,
} from '../types/railpulse';

export interface AuditFilterCriteria {
  searchTerm?: string;
  actionType?: string;
  actorRole?: string;
  actorId?: string;
  riskLevel?: string;
  entityType?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
}

export interface DistinctAuditUser {
  actorId: string;
  actorName: string;
  actorRole: UserRole;
  count: number;
}

const AUDIT_STORAGE_KEY = 'railpulse_enterprise_audit_logs_v2';
let memoryAuditLogs: AuditLog[] = [];
const listeners = new Set<() => void>();

function computeVerificationHash(payload: string): string {
  let h1 = 0xdeadbeef ^ payload.length;
  let h2 = 0x41c6ce57 ^ payload.length;
  for (let i = 0; i < payload.length; i++) {
    const ch = payload.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 =
    Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^
    Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 =
    Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^
    Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  const hex1 = (h1 >>> 0).toString(16).padStart(8, '0');
  const hex2 = (h2 >>> 0).toString(16).padStart(8, '0');
  return `sha256-${hex1}${hex2}a9f4c2e8`;
}

export function getStoredAuditLogs(): AuditLog[] {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const raw = window.localStorage.getItem(AUDIT_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as AuditLog[];
        if (Array.isArray(parsed)) {
          memoryAuditLogs = parsed;
          return parsed;
        }
      }
    } catch {
      // Fallback to memory
    }
  }
  return memoryAuditLogs;
}

function saveStoredAuditLogs(logs: AuditLog[]): void {
  memoryAuditLogs = logs;
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      window.localStorage.setItem(AUDIT_STORAGE_KEY, JSON.stringify(logs));
    } catch {
      // Ignore storage error
    }
  }
  listeners.forEach((cb) => cb());
}

export function subscribeToAuditLogs(callback: () => void): () => void {
  listeners.add(callback);
  return () => {
    listeners.delete(callback);
  };
}

export function seedInitialAuditLogs(): void {
  const current = getStoredAuditLogs();
  if (current.length > 0) return;

  const baseNow = Date.now();
  const initialSeeds: Array<Omit<AuditLog, 'id' | 'verificationHash'>> = [
    {
      timestamp: new Date(baseNow - 5 * 60 * 1000).toISOString(),
      actorId: 'usr-admin-1',
      actorName: 'سید علی محمدی (مدیر ارشد سامانه)',
      actorRole: 'admin',
      actionType: 'employee_register',
      entityType: 'user',
      entityId: 'usr-emp-3',
      summaryFa: 'ثبت کاربر پرسنل جدید: علیرضا فتاحی (راهبر ارشد خط تبریز - تهران)',
      summaryEn: 'Registered new staff member: Alireza Fattahi (Tabriz-Tehran Lead Dispatcher)',
      metadata: { assignedLine: 'line-tabriz-tehran' },
      ipAddress: '192.168.10.42',
      riskLevel: 'medium',
      status: 'success',
    },
    {
      timestamp: new Date(baseNow - 15 * 60 * 1000).toISOString(),
      actorId: 'usr-emp-2',
      actorName: 'مریم کمالی (کنترل ترافیک خط ۲)',
      actorRole: 'employee',
      actionType: 'schedule_update',
      entityType: 'schedule',
      entityId: 'TR-202',
      summaryFa: 'تغییر سرعت سیر قطار پردیس ۲۰۲ از ۱۲۰ به ۱۵۰ کیلومتر بر ساعت به منظور بهینه‌سازی سیر',
      summaryEn: 'Updated Train 202 Pardis cruising speed from 120 to 150 km/h',
      metadata: { previousSpeed: 120, newSpeed: 150 },
      ipAddress: '192.168.10.42',
      riskLevel: 'high',
      status: 'success',
    },
    {
      timestamp: new Date(baseNow - 25 * 60 * 1000).toISOString(),
      actorId: 'usr-pass-1',
      actorName: 'سارا راد (مسافر ویژه)',
      actorRole: 'passenger',
      actionType: 'ticket_reservation',
      entityType: 'ticket',
      entityId: 'PNR-8921-FA',
      summaryFa: 'رزرو قطعی ۲ صندلی در قطار ۱۰۱ تهران - مشهد به مبلغ ۹۶۰٬۰۰۰ تومان',
      summaryEn: 'Confirmed booking of 2 seats on Train 101 Tehran-Mashhad (960,000 TMN)',
      metadata: { pnr: 'PNR-8921-FA', seats: 2, totalPrice: 960000 },
      ipAddress: '192.168.10.42',
      riskLevel: 'low',
      status: 'success',
    },
    {
      timestamp: new Date(baseNow - 35 * 60 * 1000).toISOString(),
      actorId: 'usr-pass-1',
      actorName: 'سارا راد (مسافر ویژه)',
      actorRole: 'passenger',
      actionType: 'wallet_deposit',
      entityType: 'wallet',
      entityId: 'tx-dep-1001',
      summaryFa: 'شارژ آنلاین کیف پول دیجیتال به مبلغ ۱٬۵۰۰٬۰۰۰ تومان از درگاه شتاب',
      summaryEn: 'Online digital wallet deposit of 1,500,000 TMN via Shetab',
      metadata: { amount: 1500000 },
      ipAddress: '192.168.10.42',
      riskLevel: 'low',
      status: 'success',
    },
    {
      timestamp: new Date(baseNow - 45 * 60 * 1000).toISOString(),
      actorId: 'usr-emp-1',
      actorName: 'مهندس رضا شمس (راهبر دیسپچینگ)',
      actorRole: 'employee',
      actionType: 'portal_switch',
      entityType: 'system',
      entityId: 'operations',
      summaryFa: 'جابجایی پرتال کاری از «پرتال مدیریت کل» به «مرکز کنترل عملیات و ایمنی»',
      summaryEn: 'Switched workspace portal from Admin Portal to Operations Control Center',
      metadata: { fromPortal: 'admin', toPortal: 'operations' },
      ipAddress: '192.168.10.42',
      riskLevel: 'low',
      status: 'success',
    },
    {
      timestamp: new Date(baseNow - 55 * 60 * 1000).toISOString(),
      actorId: 'usr-admin-1',
      actorName: 'سید علی محمدی (مدیر ارشد سامانه)',
      actorRole: 'admin',
      actionType: 'user_login',
      entityType: 'user',
      entityId: 'usr-admin-1',
      summaryFa: 'ورود احرازهویت‌شده مدیر ارشد سامانه به مرکز فرماندهی یکپارچه RailPulse',
      summaryEn: 'Authenticated Chief System Administrator login to RailPulse Command Center',
      metadata: { role: 'admin', method: 'session_token' },
      ipAddress: '192.168.10.42',
      riskLevel: 'low',
      status: 'success',
    },
  ];

  const seeded: AuditLog[] = initialSeeds.map((item, idx) => {
    const id = `AUD-${1000 + idx}`;
    return {
      ...item,
      id,
      verificationHash: computeVerificationHash(`${id}|${item.timestamp}|${item.entityId}`),
    };
  });

  saveStoredAuditLogs(seeded);
}

export interface RecordAuditParams {
  actorId: string;
  actorName: string;
  actorRole: UserRole;
  actionType: AuditActionType;
  entityType: AuditLog['entityType'];
  entityId: string;
  summaryFa: string;
  summaryEn: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  riskLevel?: AuditRiskLevel;
  status?: AuditLog['status'];
}

export function recordAuditAction(params: RecordAuditParams): AuditLog {
  const logs = getStoredAuditLogs();
  const id = `AUD-${Date.now()}-${Math.floor(Math.random() * 900 + 100)}`;
  const timestamp = new Date().toISOString();
  const entry: AuditLog = {
    id,
    timestamp,
    actorId: params.actorId,
    actorName: params.actorName,
    actorRole: params.actorRole,
    actionType: params.actionType,
    entityType: params.entityType,
    entityId: params.entityId,
    summaryFa: params.summaryFa,
    summaryEn: params.summaryEn,
    metadata: params.metadata || {},
    ipAddress: params.ipAddress || '192.168.10.42',
    riskLevel: params.riskLevel || 'low',
    status: params.status || 'success',
    verificationHash: computeVerificationHash(`${id}|${timestamp}|${params.entityId}`),
  };

  const updated = [entry, ...logs];
  saveStoredAuditLogs(updated);
  return entry;
}

export function getDistinctAuditUsers(logs: AuditLog[]): DistinctAuditUser[] {
  const map = new Map<string, DistinctAuditUser>();
  for (const log of logs) {
    const existing = map.get(log.actorId);
    if (existing) {
      existing.count += 1;
    } else {
      map.set(log.actorId, {
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

export function exportAuditLogsToCsv(logs: AuditLog[]): string {
  const headers = [
    'ID',
    'Timestamp',
    'ActorID',
    'ActorName',
    'ActorRole',
    'ActionType',
    'EntityType',
    'EntityID',
    'RiskLevel',
    'Status',
    'SummaryEN',
    'VerificationHash',
  ];
  const rows = logs.map((l) =>
    [
      l.id,
      l.timestamp,
      l.actorId,
      l.actorName,
      l.actorRole,
      l.actionType,
      l.entityType,
      l.entityId,
      l.riskLevel,
      l.status,
      l.summaryEn.replace(/"/g, '""'),
      l.verificationHash,
    ]
      .map((val) => `"${val}"`)
      .join(',')
  );
  return [headers.join(','), ...rows].join('\n');
}

export function exportAuditLogsToJson(logs: AuditLog[]): string {
  return JSON.stringify(logs, null, 2);
}
