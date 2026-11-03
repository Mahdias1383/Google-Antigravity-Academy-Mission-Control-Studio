import {
  TrainSchedule,
  TrainLine,
  Ticket,
  AuditLog,
} from '../types/railpulse';

export type GlobalSearchCategory = 'all' | 'schedules' | 'tickets' | 'auditLogs';

export interface GlobalSearchResults {
  query: string;
  normalizedQuery: string;
  schedules: TrainSchedule[];
  tickets: Ticket[];
  auditLogs: AuditLog[];
  totalCount: number;
}

/**
 * Normalizes Persian/Arabic numerals to ASCII digits and lowercases text
 * so searching "101" or "۱۰۱" matches both "TR-101" and "۱۰۱ فدک".
 */
export function normalizeSearchText(input: string): string {
  if (!input) return '';
  const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  const arabicDigits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];

  let out = input.trim().toLowerCase();
  for (let i = 0; i < 10; i++) {
    out = out.replace(new RegExp(persianDigits[i], 'g'), String(i));
    out = out.replace(new RegExp(arabicDigits[i], 'g'), String(i));
  }
  return out;
}

/**
 * Performs real-time global search across Train Schedules, Passenger Tickets, and Audit Logs.
 */
export function performGlobalAdminSearch(params: {
  query: string;
  category?: GlobalSearchCategory;
  schedules: TrainSchedule[];
  lines?: TrainLine[];
  tickets: Ticket[];
  auditLogs: AuditLog[];
}): GlobalSearchResults {
  const {
    query,
    category = 'all',
    schedules,
    lines = [],
    tickets,
    auditLogs,
  } = params;

  const normalizedQuery = normalizeSearchText(query);
  if (!normalizedQuery) {
    return {
      query,
      normalizedQuery: '',
      schedules: [],
      tickets: [],
      auditLogs: [],
      totalCount: 0,
    };
  }

  const linesMap = new Map<string, TrainLine>(lines.map((l) => [l.id, l]));

  const matchedSchedules =
    category === 'all' || category === 'schedules'
      ? schedules.filter((s) => {
          const line = linesMap.get(s.lineId);
          const stationNames = line
            ? line.stations.map((st) => `${st.nameFa} ${st.nameEn} ${st.code}`).join(' ')
            : '';
          const haystack = normalizeSearchText(
            [
              s.id,
              s.trainNumber,
              s.trainNameFa,
              s.trainNameEn,
              s.lineId,
              line?.nameFa || '',
              line?.nameEn || '',
              line?.code || '',
              stationNames,
              s.departureTime,
              String(s.speedKmh),
              String(s.ticketPrice),
              s.trainType,
              s.status,
            ].join(' ')
          );
          return haystack.includes(normalizedQuery);
        })
      : [];

  const matchedTickets =
    category === 'all' || category === 'tickets'
      ? tickets.filter((tk) => {
          const haystack = normalizeSearchText(
            [
              tk.id,
              tk.pnr,
              tk.trainId,
              tk.trainNumber,
              tk.trainNameFa,
              tk.trainNameEn,
              tk.lineNameFa,
              tk.lineNameEn,
              tk.passengerName,
              tk.passengerNationalId,
              tk.departureStation,
              tk.arrivalStation,
              tk.departureTime,
              tk.seatNumbers.join(','),
              String(tk.totalPrice),
              tk.status,
            ].join(' ')
          );
          return haystack.includes(normalizedQuery);
        })
      : [];

  const matchedAuditLogs =
    category === 'all' || category === 'auditLogs'
      ? auditLogs.filter((log) => {
          const haystack = normalizeSearchText(
            [
              log.id,
              log.actorName,
              log.actorRole,
              log.actionType,
              log.entityType,
              log.entityId,
              log.summaryFa,
              log.summaryEn,
              log.ipAddress,
              log.riskLevel,
              log.status,
              JSON.stringify(log.metadata || {}),
            ].join(' ')
          );
          return haystack.includes(normalizedQuery);
        })
      : [];

  return {
    query,
    normalizedQuery,
    schedules: matchedSchedules,
    tickets: matchedTickets,
    auditLogs: matchedAuditLogs,
    totalCount:
      matchedSchedules.length + matchedTickets.length + matchedAuditLogs.length,
  };
}
