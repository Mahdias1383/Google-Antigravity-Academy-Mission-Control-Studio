import {
  TrainLine,
  TrainSchedule,
  Ticket,
  AuditLog,
} from '../types/railpulse';
import {
  SalesTimeWindow,
  ForecastHorizon,
  DemandScenario,
  buildTicketSalesTimeSeries,
  buildCorridorPerformanceBreakdown,
  buildTicketDemandForecast,
} from './dashboardAnalyticsService';

export type QuarterlyPlanningQuarter = 'Q1-1405' | 'Q2-1405' | 'Q3-1405' | 'Q4-1405';

export const QUARTER_OPTIONS: Array<{
  id: QuarterlyPlanningQuarter;
  labelFa: string;
  labelEn: string;
}> = [
  { id: 'Q1-1405', labelFa: 'فصل اول ۱۴۰۵ (بهار)', labelEn: 'Q1 1405 (Spring)' },
  { id: 'Q2-1405', labelFa: 'فصل دوم ۱۴۰۵ (تابستان)', labelEn: 'Q2 1405 (Summer)' },
  { id: 'Q3-1405', labelFa: 'فصل سوم ۱۴۰۵ (پاییز)', labelEn: 'Q3 1405 (Autumn)' },
  { id: 'Q4-1405', labelFa: 'فصل چهارم ۱۴۰۵ (زمستان)', labelEn: 'Q4 1405 (Winter)' },
];

export interface QuarterlyImpactReport {
  reportId: string;
  quarter: QuarterlyPlanningQuarter;
  generatedAtIso: string;
  executiveSummaryFa: string;
  executiveSummaryEn: string;
  kpis: {
    historicalRevenueMillions: number;
    projectedRevenueMillions: number;
    projectedTicketsSold: number;
    fleetOccupancyPercent: number;
    safetyCompliancePercent: number;
  };
  corridorRecommendations: Array<{
    lineId: string;
    code: string;
    nameFa: string;
    nameEn: string;
    occupancyPercent: number;
    recommendationFa: string;
    recommendationEn: string;
  }>;
}

export function buildQuarterlyImpactReport(params: {
  lines: TrainLine[];
  schedules: TrainSchedule[];
  tickets: Ticket[];
  auditLogs: AuditLog[];
  quarter: QuarterlyPlanningQuarter;
  salesWindow: SalesTimeWindow;
  forecastHorizon: ForecastHorizon;
  scenario: DemandScenario;
}): QuarterlyImpactReport {
  const sales = buildTicketSalesTimeSeries(
    params.schedules,
    params.tickets,
    params.salesWindow
  );
  const corridors = buildCorridorPerformanceBreakdown(
    params.lines,
    params.schedules
  );
  const forecast = buildTicketDemandForecast(
    params.schedules,
    params.tickets,
    params.forecastHorizon,
    params.scenario
  );

  const historicalRevenueMillions = Number(
    sales.reduce((s, p) => s + p.revenueMillions, 0).toFixed(2)
  );
  const avgOccupancy =
    corridors.length > 0
      ? Math.round(
          corridors.reduce((s, c) => s + c.occupancyPercent, 0) / corridors.length
        )
      : 75;

  return {
    reportId: `QIR-${params.quarter}-${Date.now().toString().slice(-5)}`,
    quarter: params.quarter,
    generatedAtIso: new Date().toISOString(),
    executiveSummaryFa: `گزارش راهبردی ${params.quarter}: پیش‌بینی فروش ${forecast.totalProjectedSeats} صندلی با ضریب اشغال میانگین ${avgOccupancy}٪.`,
    executiveSummaryEn: `Executive Impact Report ${params.quarter}: Projected ${forecast.totalProjectedSeats} seats with ${avgOccupancy}% average fleet occupancy.`,
    kpis: {
      historicalRevenueMillions,
      projectedRevenueMillions: forecast.totalProjectedRevenueMillions,
      projectedTicketsSold: forecast.totalProjectedSeats,
      fleetOccupancyPercent: avgOccupancy,
      safetyCompliancePercent: 99.8,
    },
    corridorRecommendations: corridors.map((c) => ({
      lineId: c.lineId,
      code: c.code,
      nameFa: c.nameFa,
      nameEn: c.nameEn,
      occupancyPercent: c.occupancyPercent,
      recommendationFa:
        c.occupancyPercent >= 80
          ? 'افزایش رام قطار فوق‌العاده در ساعات اوج'
          : 'حفظ ظرفیت فعلی و بهینه‌سازی سرعت سیر',
      recommendationEn:
        c.occupancyPercent >= 80
          ? 'Add peak-hour express train consist'
          : 'Maintain current consist & optimize headway',
    })),
  };
}

export function buildImpactReportFilename(
  quarter: QuarterlyPlanningQuarter,
  scenario: DemandScenario,
  ext: 'pdf' | 'json'
): string {
  return `railpulse-impact-report-${quarter.toLowerCase()}-${scenario}.${ext}`;
}

export function exportImpactReportToJson(report: QuarterlyImpactReport): string {
  return JSON.stringify(report, null, 2);
}

export function exportImpactReportToPdfBytes(
  report: QuarterlyImpactReport
): Uint8Array {
  const pdfContent = `%PDF-1.4
1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj
2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj
3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R >> endobj
4 0 obj << /Length 120 >> stream
BT /F1 12 Tf 50 720 Td (RailPulse Quarterly Impact Report ${report.quarter} - ${report.reportId}) Tj ET
endstream endobj
xref
0 5
0000000000 65535 f 
trailer << /Size 5 /Root 1 0 R >>
startxref
300
%%EOF`;
  return new TextEncoder().encode(pdfContent);
}
