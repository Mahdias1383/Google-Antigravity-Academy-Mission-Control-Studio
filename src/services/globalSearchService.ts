import {
  TrainSchedule,
  TrainLine,
  Ticket,
  AuditLog,
} from '../types/railpulse';

export type SearchCategory = 'all' | 'schedules' | 'tickets' | 'audit_logs';

export interface GlobalAdminSearchInput {
  query: string;
  category: SearchCategory;
  schedules: TrainSchedule[];
  lines: TrainLine[];
  tickets: Ticket[];
  auditLogs: AuditLog[];
}

export interface GlobalAdminSearchResult {
  schedules: TrainSchedule[];
  tickets: Ticket[];
  auditLogs: AuditLog[];
  totalCount: number;
}

const PERSIAN_DIGITS = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
const ARABIC_DIGITS = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];

export function normalizeSearchText(input: string): string {
  let out = (input || '').toLowerCase().trim();
  for (let i = 0; i < 10; i++) {
    out = out.replaceAll(PERSIAN_DIGITS[i], String(i));
    out = out.replaceAll(ARABIC_DIGITS[i], String(i));
  }
  return out;
}

export function performGlobalAdminSearch({
  query,
  category,
  schedules,
  lines,
  tickets,
  auditLogs,
}: GlobalAdminSearchInput): GlobalAdminSearchResult {
  const normQ = normalizeSearchText(query);
  if (!normQ) {
    return { schedules: [], tickets: [], auditLogs: [], totalCount: 0 };
  }

  const lineMap = new Map<string, TrainLine>();
  lines.forEach((l) => lineMap.set(l.id, l));

  const matchedSchedules =
    category === 'all' || category === 'schedules'
      ? schedules.filter((s) => {
          const line = lineMap.get(s.lineId);
          const stationNames =
            line?.stations.map((st) => `${st.nameFa} ${st.nameEn}`).join(' ') || '';
          const haystack = normalizeSearchText(
            `${s.id} ${s.trainNumber} ${s.trainNameFa} ${s.trainNameEn} ${s.departureTime} ${line?.nameFa || ''} ${line?.nameEn || ''} ${stationNames}`
          );
          return haystack.includes(normQ);
        })
      : [];

  const matchedTickets =
    category === 'all' || category === 'tickets'
      ? tickets.filter((tk) => {
          const haystack = normalizeSearchText(
            `${tk.id} ${tk.pnr} ${tk.passengerName} ${tk.trainNumber} ${tk.lineNameFa} ${tk.lineNameEn} ${tk.scheduleId}`
          );
          return haystack.includes(normQ);
        })
      : [];

  const matchedAuditLogs =
    category === 'all' || category === 'audit_logs'
      ? auditLogs.filter((log) => {
          const haystack = normalizeSearchText(
            `${log.id} ${log.actorName} ${log.actorId} ${log.entityId} ${log.actionType} ${log.summaryFa} ${log.summaryEn} ${JSON.stringify(log.metadata)}`
          );
          return haystack.includes(normQ);
        })
      : [];

  return {
    schedules: matchedSchedules,
    tickets: matchedTickets,
    auditLogs: matchedAuditLogs,
    totalCount:
      matchedSchedules.length + matchedTickets.length + matchedAuditLogs.length,
  };
}
