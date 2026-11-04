import {
  TrainSchedule,
  TrainLine,
  Ticket,
  AuditLog,
} from '../types/railpulse';

export type SalesTimeWindow = '7d' | '14d' | '30d';
export type ForecastHorizon = '7d' | '14d';
export type DemandScenario = 'baseline' | 'peak_holiday' | 'weather_disruption';

export interface TicketSalesTrendPoint {
  isoDate: string;
  dateLabelFa: string;
  dateLabelEn: string;
  ticketsSold: number;
  revenueTomans: number;
  revenueMillions: number;
  cancellations: number;
}

export interface SystemActivityTimePoint {
  bucketLabelFa: string;
  bucketLabelEn: string;
  reservations: number;
  scheduleOps: number;
  systemAndWallet: number;
  highRiskEvents: number;
  totalEvents: number;
}

export interface CorridorPerformanceMetric {
  lineId: string;
  nameFa: string;
  nameEn: string;
  code: string;
  bookedSeats: number;
  availableSeats: number;
  totalCapacity: number;
  occupancyPercent: number;
  estimatedRevenueMillions: number;
}

export interface DemandForecastPoint {
  dayIndex: number;
  dateLabelFa: string;
  dateLabelEn: string;
  isForecast: boolean;
  actualTickets: number | null;
  projectedTickets: number | null;
  lowerBoundTickets: number | null;
  upperBoundTickets: number | null;
  projectedRevenueMillions: number;
}

export interface TicketDemandForecastResult {
  horizonDays: number;
  scenario: DemandScenario;
  points: DemandForecastPoint[];
  totalProjectedSeats: number;
  totalProjectedRevenueMillions: number;
  peakForecastSeats: number;
  growthRatePercent: number;
}

export function buildTicketSalesTimeSeries(
  schedules: TrainSchedule[],
  tickets: Ticket[],
  window: SalesTimeWindow = '7d'
): TicketSalesTrendPoint[] {
  const daysCount = window === '7d' ? 7 : window === '14d' ? 14 : 30;
  const points: TicketSalesTrendPoint[] = [];

  const confirmedTickets = tickets.filter((t) => t.status === 'confirmed');
  const liveConfirmedSeats = confirmedTickets.reduce((sum, t) => sum + t.seatCount, 0);
  const totalScheduleBookedSeats = schedules.reduce((sum, s) => sum + s.bookedSeats, 0);
  const baseNow = new Date('2026-11-03T12:00:00Z');

  for (let i = daysCount - 1; i >= 0; i--) {
    const d = new Date(baseNow.getTime() - i * 24 * 60 * 60 * 1000);
    const isoDate = d.toISOString().slice(0, 10);
    const wave = Math.round(Math.sin(i * 0.9) * 45 + (daysCount - i) * 6);
    const ticketsSold = Math.max(
      120,
      Math.round(totalScheduleBookedSeats * 0.35 + liveConfirmedSeats * 4 + wave)
    );
    const revenueTomans = ticketsSold * 410000;
    const revenueMillions = Number((revenueTomans / 1_000_000).toFixed(2));

    points.push({
      isoDate,
      dateLabelFa: `${d.getUTCMonth() + 1}/${d.getUTCDate()}`,
      dateLabelEn: isoDate.slice(5),
      ticketsSold,
      revenueTomans,
      revenueMillions,
      cancellations: Math.max(2, Math.round(ticketsSold * 0.04)),
    });
  }

  return points;
}

export function buildSystemActivityTimeSeries(
  auditLogs: AuditLog[]
): SystemActivityTimePoint[] {
  const buckets = [
    { fa: '۰۰:۰۰ - ۰۴:۰۰', en: '00:00 - 04:00', base: 14 },
    { fa: '۰۴:۰۰ - ۰۸:۰۰', en: '04:00 - 08:00', base: 38 },
    { fa: '۰۸:۰۰ - ۱۲:۰۰', en: '08:00 - 12:00', base: 64 },
    { fa: '۱۲:۰۰ - ۱۶:۰۰', en: '12:00 - 16:00', base: 52 },
    { fa: '۱۶:۰۰ - ۲۰:۰۰', en: '16:00 - 20:00', base: 71 },
    { fa: '۲۰:۰۰ - ۲۴:۰۰', en: '20:00 - 24:00', base: 43 },
  ];

  const liveBoost = auditLogs.length;

  return buckets.map((b, idx) => {
    const reservations = Math.round(b.base * 0.55) + (idx === 2 ? liveBoost : 0);
    const scheduleOps = Math.round(b.base * 0.25);
    const systemAndWallet = Math.round(b.base * 0.2);
    const highRiskEvents = Math.max(1, Math.round(b.base * 0.06));
    return {
      bucketLabelFa: b.fa,
      bucketLabelEn: b.en,
      reservations,
      scheduleOps,
      systemAndWallet,
      highRiskEvents,
      totalEvents: reservations + scheduleOps + systemAndWallet,
    };
  });
}

export function buildCorridorPerformanceBreakdown(
  lines: TrainLine[],
  schedules: TrainSchedule[]
): CorridorPerformanceMetric[] {
  return lines.map((line) => {
    const lineSchedules = schedules.filter((s) => s.lineId === line.id);
    const bookedSeats = lineSchedules.reduce((sum, s) => sum + s.bookedSeats, 0);
    const totalCapacity = lineSchedules.reduce((sum, s) => sum + s.totalCapacity, 0);
    const availableSeats = Math.max(0, totalCapacity - bookedSeats);
    const occupancyPercent =
      totalCapacity > 0 ? Math.round((bookedSeats / totalCapacity) * 100) : 0;
    const avgPrice =
      lineSchedules.length > 0
        ? lineSchedules.reduce((sum, s) => sum + s.ticketPrice, 0) / lineSchedules.length
        : 380000;
    const estimatedRevenueMillions = Number(
      ((bookedSeats * avgPrice) / 1_000_000).toFixed(2)
    );

    return {
      lineId: line.id,
      nameFa: line.nameFa,
      nameEn: line.nameEn,
      code: line.code,
      bookedSeats,
      availableSeats,
      totalCapacity,
      occupancyPercent,
      estimatedRevenueMillions,
    };
  });
}

export function buildTicketDemandForecast(
  schedules: TrainSchedule[],
  tickets: Ticket[],
  horizon: ForecastHorizon = '7d',
  scenario: DemandScenario = 'baseline'
): TicketDemandForecastResult {
  const historical7d = buildTicketSalesTimeSeries(schedules, tickets, '7d');
  const horizonDays = horizon === '7d' ? 7 : 14;
  const scenarioMultiplier =
    scenario === 'peak_holiday' ? 1.28 : scenario === 'weather_disruption' ? 0.78 : 1.0;

  const points: DemandForecastPoint[] = [];

  historical7d.forEach((h, idx) => {
    const isBridge = idx === historical7d.length - 1;
    points.push({
      dayIndex: idx,
      dateLabelFa: h.dateLabelFa,
      dateLabelEn: h.dateLabelEn,
      isForecast: false,
      actualTickets: h.ticketsSold,
      projectedTickets: isBridge ? h.ticketsSold : null,
      lowerBoundTickets: isBridge ? h.ticketsSold : null,
      upperBoundTickets: isBridge ? h.ticketsSold : null,
      projectedRevenueMillions: h.revenueMillions,
    });
  });

  const lastActual = historical7d[historical7d.length - 1]?.ticketsSold || 320;
  let totalProjectedSeats = 0;
  let totalProjectedRevenueMillions = 0;
  let peakForecastSeats = 0;

  for (let f = 1; f <= horizonDays; f++) {
    const trendStep = f * 12;
    const wave = Math.sin(f * 0.8) * 18;
    const projected = Math.max(
      80,
      Math.round((lastActual + trendStep + wave) * scenarioMultiplier)
    );
    const margin = Math.round(projected * (0.08 + f * 0.005));
    const lower = Math.max(40, projected - margin);
    const upper = projected + margin;
    const revMillions = Number(((projected * 410000) / 1_000_000).toFixed(2));

    totalProjectedSeats += projected;
    totalProjectedRevenueMillions = Number(
      (totalProjectedRevenueMillions + revMillions).toFixed(2)
    );
    if (projected > peakForecastSeats) peakForecastSeats = projected;

    points.push({
      dayIndex: historical7d.length - 1 + f,
      dateLabelFa: `+${f} روز`,
      dateLabelEn: `+${f}d`,
      isForecast: true,
      actualTickets: null,
      projectedTickets: projected,
      lowerBoundTickets: lower,
      upperBoundTickets: upper,
      projectedRevenueMillions: revMillions,
    });
  }

  return {
    horizonDays,
    scenario,
    points,
    totalProjectedSeats,
    totalProjectedRevenueMillions,
    peakForecastSeats,
    growthRatePercent:
      scenario === 'peak_holiday' ? 24.5 : scenario === 'weather_disruption' ? -14.2 : 8.4,
  };
}
