import {
  AuditLog,
  AuditActionType,
  PortalTab,
  User,
} from '../types/railpulse';
import { recordAuditAction } from './auditLogService';

export type TimelineCategory =
  | 'all'
  | 'auth_and_portal'
  | 'dispatch_and_ops'
  | 'tickets_and_wallet'
  | 'security_and_system';

export interface TimelineSummaryMetrics {
  totalEvents: number;
  loginCount: number;
  portalSwitchCount: number;
  authAndPortalCount: number;
  dispatchAndOpsCount: number;
  ticketsAndWalletCount: number;
  securityAndSystemCount: number;
}

export interface TimelineEventItem {
  log: AuditLog;
  category: Exclude<TimelineCategory, 'all'>;
  portalTransition?: {
    fromPortal: string;
    toPortal: string;
  };
}

export interface TimelineFilterOptions {
  category?: TimelineCategory;
  actorRole?: string;
  searchQuery?: string;
  sortOrder?: 'newest' | 'oldest';
}

export function classifyTimelineCategory(
  actionType: AuditActionType
): Exclude<TimelineCategory, 'all'> {
  switch (actionType) {
    case 'user_login':
    case 'portal_switch':
    case 'employee_register':
      return 'auth_and_portal';
    case 'schedule_create':
    case 'schedule_update':
    case 'schedule_delete':
      return 'dispatch_and_ops';
    case 'ticket_reservation':
    case 'ticket_cancellation':
    case 'wallet_deposit':
      return 'tickets_and_wallet';
    case 'security_alert':
    case 'safety_override':
    case 'migration_run':
    default:
      return 'security_and_system';
  }
}

export function computeTimelineSummaryMetrics(
  logs: AuditLog[]
): TimelineSummaryMetrics {
  let loginCount = 0;
  let portalSwitchCount = 0;
  let authAndPortalCount = 0;
  let dispatchAndOpsCount = 0;
  let ticketsAndWalletCount = 0;
  let securityAndSystemCount = 0;

  for (const log of logs) {
    if (log.actionType === 'user_login') loginCount++;
    if (log.actionType === 'portal_switch') portalSwitchCount++;

    const cat = classifyTimelineCategory(log.actionType);
    if (cat === 'auth_and_portal') authAndPortalCount++;
    else if (cat === 'dispatch_and_ops') dispatchAndOpsCount++;
    else if (cat === 'tickets_and_wallet') ticketsAndWalletCount++;
    else securityAndSystemCount++;
  }

  return {
    totalEvents: logs.length,
    loginCount,
    portalSwitchCount,
    authAndPortalCount,
    dispatchAndOpsCount,
    ticketsAndWalletCount,
    securityAndSystemCount,
  };
}

export function buildGlobalActivityTimeline(
  logs: AuditLog[],
  options: TimelineFilterOptions = {}
): { items: TimelineEventItem[]; metrics: TimelineSummaryMetrics } {
  const metrics = computeTimelineSummaryMetrics(logs);
  const category = options.category || 'all';
  const actorRole = options.actorRole || 'all';
  const q = (options.searchQuery || '').trim().toLowerCase();
  const sortOrder = options.sortOrder || 'newest';

  const filtered = logs.filter((log) => {
    const itemCat = classifyTimelineCategory(log.actionType);
    if (category !== 'all' && itemCat !== category) return false;
    if (actorRole !== 'all' && log.actorRole !== actorRole) return false;
    if (q) {
      const hay = `${log.actorName} ${log.entityId} ${log.summaryFa} ${log.summaryEn} ${log.actionType}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });

  const sorted = [...filtered].sort((a, b) => {
    const tA = new Date(a.timestamp).getTime();
    const tB = new Date(b.timestamp).getTime();
    return sortOrder === 'oldest' ? tA - tB : tB - tA;
  });

  const items: TimelineEventItem[] = sorted.map((log) => {
    const cat = classifyTimelineCategory(log.actionType);
    const fromPortal =
      typeof log.metadata?.fromPortal === 'string'
        ? log.metadata.fromPortal
        : undefined;
    const toPortal =
      typeof log.metadata?.toPortal === 'string'
        ? log.metadata.toPortal
        : log.actionType === 'portal_switch'
        ? log.entityId
        : undefined;

    return {
      log,
      category: cat,
      portalTransition:
        fromPortal && toPortal ? { fromPortal, toPortal } : undefined,
    };
  });

  return { items, metrics };
}

export function recordPortalSwitchEvent(
  user: User,
  fromPortal: PortalTab,
  toPortal: PortalTab
): AuditLog {
  return recordAuditAction({
    actorId: user.id,
    actorName: user.fullName,
    actorRole: user.role,
    actionType: 'portal_switch',
    entityType: 'system',
    entityId: toPortal,
    summaryFa: `جابجایی پرتال کاری از «${fromPortal}» به «${toPortal}»`,
    summaryEn: `Switched workspace portal from ${fromPortal} to ${toPortal}`,
    metadata: { fromPortal, toPortal },
    riskLevel: 'low',
    status: 'success',
  });
}
