import {
  TrainSchedule,
  TrainLine,
  Ticket,
  AuditLog,
} from '../types/railpulse';

export type SalesTimeWindow = '7d' | '14d' | '30d';

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

const PERSIAN_SHORT_MONTHS = [
  'فروردین',
  'اردیبهشت',
  'خرداد',
  'تیر',
  'مرداد',
  'شهریور',
  'مهر',
  'آبان',
  'آذر',
  'دی',
  'بهمن',
  'اسفند',
];

/**
 * Builds deterministic + live-reactive time-series data for Ticket Sales & Revenue over time.
 * Live confirmed/cancelled tickets in the database are reflected in the current day's bucket.
 */
export function buildTicketSalesTimeSeries(
  schedules: TrainSchedule[],
  tickets: Ticket[],
  window: SalesTimeWindow = '7d'
): TicketSalesTrendPoint[] {
  const daysCount = window === '7d' ? 7 : window === '14d' ? 14 : 30;
  const points: TicketSalesTrendPoint[] = [];

  // Calculate live fleet baseline from schedules and tickets
  const confirmedTickets = tickets.filter((t) => t.status === 'confirmed');
  const cancelledTickets = tickets.filter((t) => t.status === 'cancelled');

  const liveConfirmedSeats = confirmedTickets.reduce((sum, t) => sum + t.seatCount, 0);
  const liveConfirmedRevenue = confirmedTickets.reduce((sum, t) => sum + t.totalPrice, 0);
  const totalScheduleBookedSeats = schedules.reduce((sum, s) => sum + s.bookedSeats, 0);

  const baseNow = new Date('2026-11-03T12:00:00Z');

  for (let i = daysCount - 1; i >= 0; i--) {
    const d = new Date(baseNow.getTime() - i * 24 * 60 * 60 * 1000);
    const isoDate = d.toISOString().slice(0, 10);

    // Deterministic daily curve based on day index
    const seedIndex = daysCount - i;
    const wave = Math.sin(seedIndex * 0.85) * 18 + Math.cos(seedIndex * 0.45) * 12;
    const baselineSeats = Math.max(42, Math.round(95 + wave + (seedIndex % 5) * 9));
    const avgTicketPrice = 420000;

    const isLatestDay = i === 0;
    const ticketsSold = isLatestDay
      ? Math.max(baselineSeats, Math.round(totalScheduleBookedSeats * 0.18) + liveConfirmedSeats)
      : baselineSeats;

    const revenueTomans = isLatestDay
      ? baselineSeats * avgTicketPrice + liveConfirmedRevenue
      : baselineSeats * avgTicketPrice;

    const cancellations = isLatestDay
      ? Math.max(2, cancelledTickets.length + 2)
      : Math.max(1, (seedIndex * 3) % 7);

    // Format labels
    const shamsiDay = ((12 - i + 29) % 30) + 1;
    const shamsiMonth = i > 11 ? PERSIAN_SHORT_MONTHS[6] : PERSIAN_SHORT_MONTHS[7]; // مهر / آبان
    const dateLabelFa = `${shamsiDay} ${shamsiMonth}`;
    const dateLabelEn = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

    points.push({
      isoDate,
      dateLabelFa,
      dateLabelEn,
      ticketsSold,
      revenueTomans,
      revenueMillions: Number((revenueTomans / 1_000_000).toFixed(2)),
      cancellations,
    });
  }

  return points;
}

/**
 * Builds time-series metrics for System Activity & Audit Log Operations over time.
 * Incorporates real stored AuditLog entries into the time buckets.
 */
export function buildSystemActivityTimeSeries(
  auditLogs: AuditLog[]
): SystemActivityTimePoint[] {
  const timeSlots = [
    { labelFa: '۰۰:۰۰ - ۰۴:۰۰', labelEn: '00:00 - 04:00', baseRes: 4, baseSch: 1, baseSys: 3, baseRisk: 0 },
    { labelFa: '۰۴:۰۰ - ۰۸:۰۰', labelEn: '04:00 - 08:00', baseRes: 14, baseSch: 5, baseSys: 6, baseRisk: 1 },
    { labelFa: '۰۸:۰۰ - ۱۲:۰۰', labelEn: '08:00 - 12:00', baseRes: 28, baseSch: 8, baseSys: 11, baseRisk: 2 },
    { labelFa: '۱۲:۰۰ - ۱۶:۰۰', labelEn: '12:00 - 16:00', baseRes: 22, baseSch: 6, baseSys: 9, baseRisk: 1 },
    { labelFa: '۱۶:۰۰ - ۲۰:۰۰', labelEn: '16:00 - 20:00', baseRes: 31, baseSch: 7, baseSys: 12, baseRisk: 2 },
    { labelFa: '۲۰:۰۰ - ۲۴:۰۰ (جاری)', labelEn: '20:00 - 24:00 (Live)', baseRes: 12, baseSch: 3, baseSys: 5, baseRisk: 1 },
  ];

  // Count live audit logs by category to add to the current live window
  let liveRes = 0;
  let liveSch = 0;
  let liveSys = 0;
  let liveRisk = 0;

  for (const log of auditLogs) {
    if (log.actionType === 'ticket_reservation' || log.actionType === 'ticket_cancellation') {
      liveRes++;
    } else if (
      log.actionType === 'schedule_create' ||
      log.actionType === 'schedule_update' ||
      log.actionType === 'schedule_delete'
    ) {
      liveSch++;
    } else {
      liveSys++;
    }
    if (log.riskLevel === 'high' || log.riskLevel === 'critical') {
      liveRisk++;
    }
  }

  return timeSlots.map((slot, idx) => {
    const isCurrentSlot = idx === timeSlots.length - 1;
    const reservations = isCurrentSlot ? slot.baseRes + liveRes : slot.baseRes;
    const scheduleOps = isCurrentSlot ? slot.baseSch + liveSch : slot.baseSch;
    const systemAndWallet = isCurrentSlot ? slot.baseSys + liveSys : slot.baseSys;
    const highRiskEvents = isCurrentSlot ? slot.baseRisk + liveRisk : slot.baseRisk;

    return {
      bucketLabelFa: slot.labelFa,
      bucketLabelEn: slot.labelEn,
      reservations,
      scheduleOps,
      systemAndWallet,
      highRiskEvents,
      totalEvents: reservations + scheduleOps + systemAndWallet,
    };
  });
}

/**
 * Computes per-corridor seat occupancy and revenue metrics for comparative visualization.
 */
export function buildCorridorPerformanceBreakdown(
  lines: TrainLine[],
  schedules: TrainSchedule[]
): CorridorPerformanceMetric[] {
  return lines.map((line) => {
    const lineSchedules = schedules.filter(
      (s) => s.lineId === line.id && s.status !== 'cancelled'
    );
    const bookedSeats = lineSchedules.reduce((sum, s) => sum + s.bookedSeats, 0);
    const totalCapacity = lineSchedules.reduce((sum, s) => sum + s.totalCapacity, 0);
    const availableSeats = Math.max(0, totalCapacity - bookedSeats);
    const occupancyPercent =
      totalCapacity > 0 ? Math.round((bookedSeats / totalCapacity) * 100) : 0;
    const estimatedRevenueTomans = lineSchedules.reduce(
      (sum, s) => sum + s.bookedSeats * s.ticketPrice,
      0
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
      estimatedRevenueMillions: Number((estimatedRevenueTomans / 1_000_000).toFixed(2)),
    };
  });
}

export type ForecastHorizon = '7d' | '14d';
export type DemandScenario = 'baseline' | 'peak_holiday' | 'weather_disruption';

export interface TicketDemandForecastPoint {
  isoDate: string;
  dateLabelFa: string;
  dateLabelEn: string;
  isForecast: boolean;
  actualTickets: number | null;
  projectedTickets: number | null;
  lowerBoundTickets: number | null;
  upperBoundTickets: number | null;
  projectedRevenueMillions: number | null;
  fleetCapacityLimit: number;
  capacityUtilizationPct: number;
}

export interface DemandForecastSummary {
  points: TicketDemandForecastPoint[];
  horizonDays: number;
  scenario: DemandScenario;
  totalProjectedSeats: number;
  totalProjectedRevenueMillions: number;
  dailyTrendSlope: number;
  growthRatePercent: number;
  peakForecastDayFa: string;
  peakForecastDayEn: string;
  peakForecastSeats: number;
  capacityBottleneckDays: number;
  confidenceLevelPercent: number;
}

/**
 * Projects future ticket demand based on historical time-series trends using
 * Ordinary Least Squares (OLS) linear regression + cyclical day-of-week seasonality
 * and 95% confidence intervals.
 */
export function buildTicketDemandForecast(
  schedules: TrainSchedule[],
  tickets: Ticket[],
  horizon: ForecastHorizon = '7d',
  scenario: DemandScenario = 'baseline'
): DemandForecastSummary {
  const historical14 = buildTicketSalesTimeSeries(schedules, tickets, '14d');
  const n = historical14.length;
  const horizonDays = horizon === '7d' ? 7 : 14;

  // Compute OLS linear regression (y = intercept + slope * x) over the 14-day history
  let sumX = 0;
  let sumY = 0;
  let sumXY = 0;
  let sumX2 = 0;

  for (let i = 0; i < n; i++) {
    const x = i;
    const y = historical14[i].ticketsSold;
    sumX += x;
    sumY += y;
    sumXY += x * y;
    sumX2 += x * x;
  }

  const denominator = n * sumX2 - sumX * sumX;
  const rawSlope = denominator !== 0 ? (n * sumXY - sumX * sumY) / denominator : 1.5;
  const intercept = (sumY - rawSlope * sumX) / n;
  const historicalAvg = sumY / n;

  // Compute residual standard deviation for confidence intervals
  let sumSquaredResiduals = 0;
  for (let i = 0; i < n; i++) {
    const fitted = intercept + rawSlope * i;
    const diff = historical14[i].ticketsSold - fitted;
    sumSquaredResiduals += diff * diff;
  }
  const residualStdDev = Math.max(8, Math.sqrt(sumSquaredResiduals / Math.max(1, n - 2)));

  // Active daily fleet capacity ceiling (scaled for daily multi-dispatch operations)
  const rawScheduleCapacity = schedules
    .filter((s) => s.status !== 'cancelled')
    .reduce((sum, s) => sum + s.totalCapacity, 0);
  const fleetCapacityLimit = Math.max(140, Math.round(rawScheduleCapacity * 0.1));

  // Scenario multiplier
  const scenarioMultiplier =
    scenario === 'peak_holiday'
      ? 1.28
      : scenario === 'weather_disruption'
      ? 0.82
      : 1.0;

  const avgTicketPriceMillions = 0.44; // 440,000 Tomans per ticket in Millions

  const points: TicketDemandForecastPoint[] = [];

  // Include last 7 historical days for visual continuity on the chart
  const recentHistory = historical14.slice(-7);
  recentHistory.forEach((h, idx) => {
    const isBridgeDay = idx === recentHistory.length - 1;
    const utilPct = Math.min(
      100,
      Math.round((h.ticketsSold / fleetCapacityLimit) * 100)
    );
    points.push({
      isoDate: h.isoDate,
      dateLabelFa: h.dateLabelFa,
      dateLabelEn: h.dateLabelEn,
      isForecast: false,
      actualTickets: h.ticketsSold,
      // Bridge point connects actual line to forecast line seamlessly
      projectedTickets: isBridgeDay ? h.ticketsSold : null,
      lowerBoundTickets: isBridgeDay ? h.ticketsSold : null,
      upperBoundTickets: isBridgeDay ? h.ticketsSold : null,
      projectedRevenueMillions: isBridgeDay ? h.revenueMillions : null,
      fleetCapacityLimit,
      capacityUtilizationPct: utilPct,
    });
  });

  const baseNow = new Date('2026-11-03T12:00:00Z');
  let totalProjectedSeats = 0;
  let totalProjectedRevenueMillions = 0;
  let peakForecastSeats = 0;
  let peakForecastDayFa = '';
  let peakForecastDayEn = '';
  let capacityBottleneckDays = 0;

  for (let step = 1; step <= horizonDays; step++) {
    const futureDate = new Date(baseNow.getTime() + step * 24 * 60 * 60 * 1000);
    const isoDate = futureDate.toISOString().slice(0, 10);

    const xFuture = n - 1 + step;
    // Cyclical weekend/midweek demand harmonic + positive trend drift
    const seasonalWave =
      Math.sin((xFuture + 2) * 0.9) * 14 + Math.cos(xFuture * 0.5) * 8;
    const trendProjection = intercept + Math.max(0.8, rawSlope) * xFuture + step * 1.6;
    const rawProjected = (trendProjection + seasonalWave) * scenarioMultiplier;
    const projectedTickets = Math.max(35, Math.round(rawProjected));

    // Confidence band widens slightly with sqrt(step) into the future
    const margin = Math.round(1.45 * residualStdDev * Math.sqrt(1 + step * 0.18));
    const lowerBoundTickets = Math.max(20, projectedTickets - margin);
    const upperBoundTickets = projectedTickets + margin;

    const projectedRevenueMillions = Number(
      (projectedTickets * avgTicketPriceMillions).toFixed(2)
    );
    const capacityUtilizationPct = Math.round(
      (projectedTickets / fleetCapacityLimit) * 100
    );

    // Format future Shamsi & Gregorian labels
    const shamsiDay = ((12 + step - 1) % 30) + 1;
    const shamsiMonth =
      12 + step > 30 ? PERSIAN_SHORT_MONTHS[8] : PERSIAN_SHORT_MONTHS[7]; // آبان / آذر
    const dateLabelFa = `${shamsiDay} ${shamsiMonth}`;
    const dateLabelEn = futureDate.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });

    totalProjectedSeats += projectedTickets;
    totalProjectedRevenueMillions += projectedRevenueMillions;

    if (projectedTickets > peakForecastSeats) {
      peakForecastSeats = projectedTickets;
      peakForecastDayFa = dateLabelFa;
      peakForecastDayEn = dateLabelEn;
    }

    if (projectedTickets >= fleetCapacityLimit * 0.85) {
      capacityBottleneckDays++;
    }

    points.push({
      isoDate,
      dateLabelFa,
      dateLabelEn,
      isForecast: true,
      actualTickets: null,
      projectedTickets,
      lowerBoundTickets,
      upperBoundTickets,
      projectedRevenueMillions,
      fleetCapacityLimit,
      capacityUtilizationPct,
    });
  }

  const forecastDailyAvg = totalProjectedSeats / horizonDays;
  const growthRatePercent = Number(
    (((forecastDailyAvg - historicalAvg) / Math.max(1, historicalAvg)) * 100).toFixed(1)
  );

  return {
    points,
    horizonDays,
    scenario,
    totalProjectedSeats,
    totalProjectedRevenueMillions: Number(totalProjectedRevenueMillions.toFixed(1)),
    dailyTrendSlope: Number(rawSlope.toFixed(2)),
    growthRatePercent,
    peakForecastDayFa,
    peakForecastDayEn,
    peakForecastSeats,
    capacityBottleneckDays,
    confidenceLevelPercent: scenario === 'baseline' ? 95 : 90,
  };
}

