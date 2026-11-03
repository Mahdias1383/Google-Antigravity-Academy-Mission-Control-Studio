import {
  TrainSchedule,
  TrainLine,
  Ticket,
  AuditLog,
} from '../types/railpulse';
import {
  SalesTimeWindow,
  ForecastHorizon,
  DemandScenario,
  TicketSalesTrendPoint,
  TicketDemandForecastPoint,
  CorridorPerformanceMetric,
  SystemActivityTimePoint,
  buildTicketSalesTimeSeries,
  buildTicketDemandForecast,
  buildCorridorPerformanceBreakdown,
  buildSystemActivityTimeSeries,
} from './dashboardAnalyticsService';

export type QuarterlyPlanningQuarter =
  | 'Q3-1405'
  | 'Q4-1405'
  | 'Q1-1406'
  | 'Q2-1406';

export interface StrategicRecommendation {
  id: string;
  priority: 'high' | 'medium' | 'low';
  titleFa: string;
  titleEn: string;
  impactFa: string;
  impactEn: string;
}

export interface QuarterlyImpactReportPayload {
  reportId: string;
  generatedAtIso: string;
  quarter: QuarterlyPlanningQuarter;
  quarterLabelFa: string;
  quarterLabelEn: string;
  salesWindow: SalesTimeWindow;
  forecastHorizon: ForecastHorizon;
  scenario: DemandScenario;
  scenarioLabelFa: string;
  scenarioLabelEn: string;
  executiveSummary: {
    historicalTicketsSold: number;
    historicalRevenueMillions: number;
    historicalCancellations: number;
    forecastHorizonSeats: number;
    forecastHorizonRevenueMillions: number;
    quarterlyProjectedSeats: number;
    quarterlyProjectedRevenueMillions: number;
    growthRatePercent: number;
    dailyTrendSlope: number;
    peakDemandDayFa: string;
    peakDemandDayEn: string;
    peakDemandSeats: number;
    capacityBottleneckDays: number;
    recommendedExtraTrainsets: number;
    confidenceLevelPercent: number;
  };
  corridorBreakdown: CorridorPerformanceMetric[];
  historicalSalesTrend: TicketSalesTrendPoint[];
  forecastTrajectory: TicketDemandForecastPoint[];
  systemActivityTelemetry: SystemActivityTimePoint[];
  strategicRecommendations: StrategicRecommendation[];
}

export const QUARTER_OPTIONS: Array<{
  id: QuarterlyPlanningQuarter;
  labelFa: string;
  labelEn: string;
  seasonMultiplier: number;
}> = [
  {
    id: 'Q3-1405',
    labelFa: 'پاییز ۱۴۰۵ (Q3 1405)',
    labelEn: 'Q3 1405 (Autumn Ops)',
    seasonMultiplier: 1.0,
  },
  {
    id: 'Q4-1405',
    labelFa: 'زمستان ۱۴۰۵ و پیک نوروز (Q4 1405)',
    labelEn: 'Q4 1405 (Winter & Nowruz Peak)',
    seasonMultiplier: 1.22,
  },
  {
    id: 'Q1-1406',
    labelFa: 'بهار ۱۴۰۶ (Q1 1406)',
    labelEn: 'Q1 1406 (Spring Network)',
    seasonMultiplier: 1.15,
  },
  {
    id: 'Q2-1406',
    labelFa: 'تابستان ۱۴۰۶ و سفرهای تابستانی (Q2 1406)',
    labelEn: 'Q2 1406 (Summer High-Demand)',
    seasonMultiplier: 1.28,
  },
];

export function buildQuarterlyImpactReport(params: {
  lines: TrainLine[];
  schedules: TrainSchedule[];
  tickets: Ticket[];
  auditLogs: AuditLog[];
  quarter: QuarterlyPlanningQuarter;
  salesWindow: SalesTimeWindow;
  forecastHorizon: ForecastHorizon;
  scenario: DemandScenario;
}): QuarterlyImpactReportPayload {
  const {
    lines,
    schedules,
    tickets,
    auditLogs,
    quarter,
    salesWindow,
    forecastHorizon,
    scenario,
  } = params;

  const salesSeries = buildTicketSalesTimeSeries(schedules, tickets, salesWindow);
  const forecastSummary = buildTicketDemandForecast(
    schedules,
    tickets,
    forecastHorizon,
    scenario
  );
  const corridorBreakdown = buildCorridorPerformanceBreakdown(lines, schedules);
  const systemActivityTelemetry = buildSystemActivityTimeSeries(auditLogs);

  const quarterMeta =
    QUARTER_OPTIONS.find((q) => q.id === quarter) || QUARTER_OPTIONS[1];

  const scenarioLabelFa =
    scenario === 'peak_holiday'
      ? 'سناریوی پیک سفرهای تعطیلات (+۲۸٪)'
      : scenario === 'weather_disruption'
      ? 'سناریوی کاهش جوی و تعمیرات خط (-۱۸٪)'
      : 'سناریوی روند پایه (رگرسیون خطی OLS)';

  const scenarioLabelEn =
    scenario === 'peak_holiday'
      ? 'Holiday Surge Scenario (+28%)'
      : scenario === 'weather_disruption'
      ? 'Weather / Maintenance Shift (-18%)'
      : 'Baseline Regression Scenario (OLS)';

  const historicalTicketsSold = salesSeries.reduce(
    (sum, pt) => sum + pt.ticketsSold,
    0
  );
  const historicalRevenueMillions = Number(
    salesSeries.reduce((sum, pt) => sum + pt.revenueMillions, 0).toFixed(1)
  );
  const historicalCancellations = salesSeries.reduce(
    (sum, pt) => sum + pt.cancellations,
    0
  );

  // Extrapolate 90-day quarterly impact from daily forecast average * quarter seasonal multiplier
  const dailyForecastSeats =
    forecastSummary.totalProjectedSeats / Math.max(1, forecastSummary.horizonDays);
  const quarterlyProjectedSeats = Math.round(
    dailyForecastSeats * 90 * quarterMeta.seasonMultiplier
  );
  const avgTicketRevenueMillions =
    forecastSummary.totalProjectedRevenueMillions /
    Math.max(1, forecastSummary.totalProjectedSeats);
  const quarterlyProjectedRevenueMillions = Number(
    (quarterlyProjectedSeats * avgTicketRevenueMillions).toFixed(1)
  );

  const recommendedExtraTrainsets = Math.max(
    1,
    Math.ceil(
      (forecastSummary.capacityBottleneckDays * 0.6 +
        (quarterMeta.seasonMultiplier - 1) * 10)
    )
  );

  const topCorridor = [...corridorBreakdown].sort(
    (a, b) => b.occupancyPercent - a.occupancyPercent
  )[0];

  const strategicRecommendations: StrategicRecommendation[] = [
    {
      id: 'rec-capacity',
      priority:
        forecastSummary.capacityBottleneckDays > 0 ||
        scenario === 'peak_holiday'
          ? 'high'
          : 'medium',
      titleFa: `تخصیص ${recommendedExtraTrainsets} رام قطار فوق‌العاده در کریدور ${
        topCorridor?.nameFa || 'تهران - مشهد'
      }`,
      titleEn: `Deploy ${recommendedExtraTrainsets} additional trainsets on ${
        topCorridor?.nameEn || 'Tehran - Mashhad'
      } corridor`,
      impactFa: `پوشش تقاضای فصلی ${quarterlyProjectedSeats.toLocaleString(
        'fa-IR'
      )} صندلی و جلوگیری از اشباع ظرفیت در روز اوج (${
        forecastSummary.peakForecastDayFa
      })`,
      impactEn: `Absorbs ${quarterlyProjectedSeats.toLocaleString(
        'en-US'
      )} quarterly projected seats and prevents bottleneck on ${
        forecastSummary.peakForecastDayEn
      }`,
    },
    {
      id: 'rec-pricing',
      priority: 'medium',
      titleFa: 'بهینه‌سازی نرخ بلیت و مدیریت شناور ظرفیت در ساعات غیرپیک',
      titleEn: 'Dynamic off-peak inventory allocation & revenue yield optimization',
      impactFa: `افزایش درآمد فصلی به سطح ${quarterlyProjectedRevenueMillions.toLocaleString(
        'fa-IR'
      )} میلیون تومان با حفظ ضریب اطمینان ${
        forecastSummary.confidenceLevelPercent
      }٪`,
      impactEn: `Supports ${quarterlyProjectedRevenueMillions}M TMN quarterly revenue target at ${forecastSummary.confidenceLevelPercent}% confidence interval`,
    },
    {
      id: 'rec-safety',
      priority: 'high',
      titleFa: 'بازبینی فاصله زمانی اعزام (Headway) با موتور ایمنی checkAccident',
      titleEn: 'Validate dispatch headways via checkAccident safety engine',
      impactFa:
        'حفظ ایمنی ۱۰۰٪ بلاک‌های ریلی هنگام افزودن قطارهای فوق‌العاده برنامه فصلی',
      impactEn:
        'Guarantees zero single-track overtake or platform conflicts when scheduling extra quarterly dispatches',
    },
  ];

  return {
    reportId: `RPT-${quarter}-${Date.now().toString(36).toUpperCase().slice(-5)}`,
    generatedAtIso: new Date().toISOString(),
    quarter,
    quarterLabelFa: quarterMeta.labelFa,
    quarterLabelEn: quarterMeta.labelEn,
    salesWindow,
    forecastHorizon,
    scenario,
    scenarioLabelFa,
    scenarioLabelEn,
    executiveSummary: {
      historicalTicketsSold,
      historicalRevenueMillions,
      historicalCancellations,
      forecastHorizonSeats: forecastSummary.totalProjectedSeats,
      forecastHorizonRevenueMillions:
        forecastSummary.totalProjectedRevenueMillions,
      quarterlyProjectedSeats,
      quarterlyProjectedRevenueMillions,
      growthRatePercent: forecastSummary.growthRatePercent,
      dailyTrendSlope: forecastSummary.dailyTrendSlope,
      peakDemandDayFa: forecastSummary.peakForecastDayFa,
      peakDemandDayEn: forecastSummary.peakForecastDayEn,
      peakDemandSeats: forecastSummary.peakForecastSeats,
      capacityBottleneckDays: forecastSummary.capacityBottleneckDays,
      recommendedExtraTrainsets,
      confidenceLevelPercent: forecastSummary.confidenceLevelPercent,
    },
    corridorBreakdown,
    historicalSalesTrend: salesSeries,
    forecastTrajectory: forecastSummary.points,
    systemActivityTelemetry,
    strategicRecommendations,
  };
}

export function buildImpactReportFilename(
  format: 'pdf' | 'json',
  quarter: QuarterlyPlanningQuarter,
  scenario: DemandScenario
): string {
  const safeQuarter = quarter.replace(/[^a-zA-Z0-9_-]/g, '');
  const safeScenario = scenario.replace(/[^a-zA-Z0-9_-]/g, '');
  return `railpulse-quarterly-impact-${safeQuarter}-${safeScenario}.${format}`;
}

export function exportImpactReportToJson(
  report: QuarterlyImpactReportPayload
): string {
  return JSON.stringify(report, null, 2);
}

function escapePdfText(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)')
    .replace(/[^\x20-\x7E]/g, '');
}

/**
 * Generates a self-contained, standards-compliant PDF 1.4 document with embedded
 * vector sales/forecast line charts, corridor capacity bar charts, KPI cards, and tables.
 */
export function exportImpactReportToPdfBytes(
  report: QuarterlyImpactReportPayload
): Uint8Array {
  const ops: string[] = [];

  const addRect = (
    x: number,
    y: number,
    w: number,
    h: number,
    r: number,
    g: number,
    b: number,
    stroke = false
  ) => {
    ops.push(`${r.toFixed(2)} ${g.toFixed(2)} ${b.toFixed(2)} rg`);
    if (stroke) {
      ops.push(`${r.toFixed(2)} ${g.toFixed(2)} ${b.toFixed(2)} RG`);
      ops.push(`${x.toFixed(1)} ${y.toFixed(1)} ${w.toFixed(1)} ${h.toFixed(1)} re B`);
    } else {
      ops.push(`${x.toFixed(1)} ${y.toFixed(1)} ${w.toFixed(1)} ${h.toFixed(1)} re f`);
    }
  };

  const addText = (
    x: number,
    y: number,
    size: number,
    text: string,
    bold = false,
    r = 0.08,
    g = 0.11,
    b = 0.18
  ) => {
    const fontRef = bold ? '/F2' : '/F1';
    ops.push('BT');
    ops.push(`${fontRef} ${size} Tf`);
    ops.push(`${r.toFixed(2)} ${g.toFixed(2)} ${b.toFixed(2)} rg`);
    ops.push(`${x.toFixed(1)} ${y.toFixed(1)} Td`);
    ops.push(`(${escapePdfText(text)}) Tj`);
    ops.push('ET');
  };

  const addLine = (
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    width: number,
    r: number,
    g: number,
    b: number,
    dashed = false
  ) => {
    ops.push('q');
    ops.push(`${width.toFixed(2)} w`);
    ops.push(`${r.toFixed(2)} ${g.toFixed(2)} ${b.toFixed(2)} RG`);
    if (dashed) {
      ops.push('[4 3] 0 d');
    }
    ops.push(`${x1.toFixed(1)} ${y1.toFixed(1)} m ${x2.toFixed(1)} ${y2.toFixed(1)} l S`);
    ops.push('Q');
  };

  // Page Background & Top Header Banner (A4: 595 x 842 pt)
  addRect(0, 768, 595, 74, 0.06, 0.09, 0.16);
  addRect(0, 764, 595, 4, 0.45, 0.22, 0.92);

  addText(
    36,
    814,
    15,
    'RAILPULSE ENTERPRISE - QUARTERLY BUSINESS IMPACT REPORT',
    true,
    0.98,
    0.99,
    1.0
  );
  addText(
    36,
    796,
    9,
    `Report ID: ${report.reportId} | Quarter: ${report.quarterLabelEn} | Scenario: ${report.scenarioLabelEn}`,
    false,
    0.75,
    0.82,
    0.94
  );
  addText(
    36,
    780,
    8,
    `Generated: ${report.generatedAtIso.slice(0, 19).replace('T', ' ')} UTC | Horizon: +${report.forecastHorizon.toUpperCase()} | Sales Window: ${report.salesWindow.toUpperCase()}`,
    false,
    0.58,
    0.66,
    0.78
  );

  // Executive KPI Summary Cards Row (y = 688..748)
  const kpis = [
    {
      title: '90-DAY QUARTERLY DEMAND',
      value: `${report.executiveSummary.quarterlyProjectedSeats.toLocaleString('en-US')} Seats`,
      sub: `Growth: ${report.executiveSummary.growthRatePercent >= 0 ? '+' : ''}${report.executiveSummary.growthRatePercent}% vs baseline`,
    },
    {
      title: 'QUARTERLY REVENUE PROJECTION',
      value: `${report.executiveSummary.quarterlyProjectedRevenueMillions.toLocaleString('en-US')} M TMN`,
      sub: `Horizon (${report.forecastHorizon}): ${report.executiveSummary.forecastHorizonRevenueMillions} M TMN`,
    },
    {
      title: 'PEAK DEMAND & SLOPE',
      value: `${report.executiveSummary.peakDemandDayEn} (${report.executiveSummary.peakDemandSeats})`,
      sub: `OLS Slope: +${report.executiveSummary.dailyTrendSlope} seats/day`,
    },
    {
      title: 'FLEET CAPACITY IMPACT',
      value: `+${report.executiveSummary.recommendedExtraTrainsets} Extra Trainsets`,
      sub: `${report.executiveSummary.capacityBottleneckDays} High-Load Days (${report.executiveSummary.confidenceLevelPercent}% CI)`,
    },
  ];

  kpis.forEach((kpi, idx) => {
    const cardX = 36 + idx * 132;
    const cardY = 686;
    addRect(cardX, cardY, 124, 60, 0.95, 0.97, 1.0);
    addRect(cardX, cardY + 57, 124, 3, 0.38, 0.25, 0.88);
    addText(cardX + 7, cardY + 43, 7, kpi.title, true, 0.35, 0.42, 0.55);
    addText(cardX + 7, cardY + 25, 10, kpi.value, true, 0.06, 0.09, 0.16);
    addText(cardX + 7, cardY + 10, 6.8, kpi.sub, false, 0.3, 0.36, 0.48);
  });

  // VISUALIZATION 1: Historical Sales & Predictive Demand Forecast Trajectory Chart
  addText(
    36,
    664,
    10.5,
    '1. Historical Ticket Sales & Predictive Demand Trajectory (Vector Chart)',
    true,
    0.06,
    0.09,
    0.16
  );

  const chartX = 50;
  const chartY = 515;
  const chartW = 505;
  const chartH = 135;

  addRect(chartX, chartY, chartW, chartH, 0.97, 0.98, 1.0);
  addLine(chartX, chartY, chartX + chartW, chartY, 1, 0.65, 0.72, 0.82);
  addLine(chartX, chartY, chartX, chartY + chartH, 1, 0.65, 0.72, 0.82);

  const pts = report.forecastTrajectory;
  const maxVal = Math.max(
    220,
    ...pts.map((p) =>
      Math.max(
        p.actualTickets || 0,
        p.upperBoundTickets || 0,
        p.projectedTickets || 0,
        p.fleetCapacityLimit || 0
      )
    )
  );

  // Horizontal grid lines & Y axis labels
  for (let g = 0; g <= 4; g++) {
    const gy = chartY + (chartH * g) / 4;
    const gVal = Math.round((maxVal * g) / 4);
    addLine(chartX, gy, chartX + chartW, gy, 0.5, 0.86, 0.89, 0.94, true);
    addText(24, gy - 3, 6.5, `${gVal}`, false, 0.4, 0.45, 0.55);
  }

  // Plot lines across trajectory points
  if (pts.length > 1) {
    const stepX = chartW / (pts.length - 1);

    // Fleet capacity ceiling line
    const capY = chartY + (pts[0].fleetCapacityLimit / maxVal) * chartH;
    addLine(chartX, capY, chartX + chartW, capY, 1.1, 0.92, 0.58, 0.08, true);
    addText(
      chartX + chartW - 95,
      capY + 4,
      6.5,
      `Capacity Ceiling (${pts[0].fleetCapacityLimit})`,
      true,
      0.8,
      0.45,
      0.05
    );

    for (let i = 0; i < pts.length - 1; i++) {
      const x1 = chartX + i * stepX;
      const x2 = chartX + (i + 1) * stepX;

      // Historical actual segment (Blue)
      if (pts[i].actualTickets !== null && pts[i + 1].actualTickets !== null) {
        const y1 = chartY + ((pts[i].actualTickets || 0) / maxVal) * chartH;
        const y2 = chartY + ((pts[i + 1].actualTickets || 0) / maxVal) * chartH;
        addLine(x1, y1, x2, y2, 2.0, 0.15, 0.45, 0.92, false);
      }

      // Forecast projection segment (Purple Dashed)
      if (
        pts[i].projectedTickets !== null &&
        pts[i + 1].projectedTickets !== null
      ) {
        const y1 = chartY + ((pts[i].projectedTickets || 0) / maxVal) * chartH;
        const y2 =
          chartY + ((pts[i + 1].projectedTickets || 0) / maxVal) * chartH;
        addLine(x1, y1, x2, y2, 2.0, 0.58, 0.2, 0.92, true);
      }

      // Upper & Lower CI bounds (Light Slate)
      if (
        pts[i].upperBoundTickets !== null &&
        pts[i + 1].upperBoundTickets !== null
      ) {
        const uy1 = chartY + ((pts[i].upperBoundTickets || 0) / maxVal) * chartH;
        const uy2 =
          chartY + ((pts[i + 1].upperBoundTickets || 0) / maxVal) * chartH;
        addLine(x1, uy1, x2, uy2, 0.8, 0.65, 0.45, 0.88, true);
      }
    }

    // X-axis date ticks
    pts.forEach((p, idx) => {
      if (idx % 2 === 0 || idx === pts.length - 1) {
        const tx = chartX + idx * stepX - 10;
        addText(tx, chartY - 11, 6.2, p.dateLabelEn, false, 0.35, 0.42, 0.52);
      }
    });
  }

  addText(
    chartX,
    chartY - 23,
    7,
    'Legend: [Solid Blue] Historical Actual Sales   |   [Dashed Purple] OLS Forecast Projection   |   [Dashed Amber] Daily Fleet Capacity Ceiling',
    false,
    0.28,
    0.34,
    0.45
  );

  // VISUALIZATION 2: Corridor Occupancy & Capacity Bar Breakdown
  addText(
    36,
    472,
    10.5,
    '2. National Railway Corridor Occupancy & Revenue Breakdown',
    true,
    0.06,
    0.09,
    0.16
  );

  report.corridorBreakdown.slice(0, 4).forEach((cor, idx) => {
    const rowY = 442 - idx * 28;
    addText(
      36,
      rowY + 8,
      8,
      `${cor.code} - ${cor.nameEn}`,
      true,
      0.12,
      0.16,
      0.24
    );
    addText(
      210,
      rowY + 8,
      7.5,
      `${cor.bookedSeats}/${cor.totalCapacity} seats (${cor.occupancyPercent}%) | ${cor.estimatedRevenueMillions}M TMN`,
      false,
      0.3,
      0.36,
      0.48
    );

    const barX = 385;
    const barW = 170;
    addRect(barX, rowY + 5, barW, 10, 0.88, 0.91, 0.96);
    const fillW = Math.min(barW, Math.max(4, (cor.occupancyPercent / 100) * barW));
    addRect(barX, rowY + 5, fillW, 10, 0.14, 0.48, 0.92);
  });

  // SECTION 3: Forecast Horizon Schedule Table (Top 7 Future Days)
  addText(
    36,
    332,
    10.5,
    '3. Daily Forecast Trajectory & Confidence Interval Schedule',
    true,
    0.06,
    0.09,
    0.16
  );

  const tableTop = 312;
  addRect(36, tableTop, 523, 16, 0.1, 0.14, 0.24);
  addText(42, tableTop + 5, 7.5, 'Date', true, 1, 1, 1);
  addText(125, tableTop + 5, 7.5, 'Projected Seats', true, 1, 1, 1);
  addText(225, tableTop + 5, 7.5, '95% Confidence Band', true, 1, 1, 1);
  addText(345, tableTop + 5, 7.5, 'Est. Revenue (M TMN)', true, 1, 1, 1);
  addText(465, tableTop + 5, 7.5, 'Capacity Util %', true, 1, 1, 1);

  const futureRows = report.forecastTrajectory
    .filter((pt) => pt.isForecast)
    .slice(0, 8);

  futureRows.forEach((row, rIdx) => {
    const ry = tableTop - (rIdx + 1) * 15;
    if (rIdx % 2 === 0) {
      addRect(36, ry, 523, 15, 0.95, 0.97, 1.0);
    }
    addText(42, ry + 4, 7.2, `${row.dateLabelEn} (${row.isoDate})`, false);
    addText(125, ry + 4, 7.2, `${row.projectedTickets ?? 0} seats`, true);
    addText(
      225,
      ry + 4,
      7.2,
      `[${row.lowerBoundTickets ?? 0} .. ${row.upperBoundTickets ?? 0}]`,
      false
    );
    addText(
      345,
      ry + 4,
      7.2,
      `${row.projectedRevenueMillions ?? 0} M TMN`,
      false
    );
    addText(
      465,
      ry + 4,
      7.2,
      `${row.capacityUtilizationPct}%`,
      row.capacityUtilizationPct >= 85
    );
  });

  // SECTION 4: Strategic Business Planning Recommendations
  addText(
    36,
    164,
    10.5,
    '4. Executive Quarterly Action Plan & Dispatch Recommendations',
    true,
    0.06,
    0.09,
    0.16
  );

  report.strategicRecommendations.forEach((rec, idx) => {
    const recY = 136 - idx * 34;
    addRect(36, recY, 523, 28, 0.96, 0.97, 0.99);
    addText(
      44,
      recY + 16,
      8,
      `[${rec.priority.toUpperCase()}] ${rec.titleEn}`,
      true,
      0.1,
      0.15,
      0.28
    );
    addText(44, recY + 5, 7.2, rec.impactEn, false, 0.32, 0.38, 0.48);
  });

  // Footer
  addLine(36, 36, 559, 36, 0.6, 0.75, 0.8, 0.88);
  addText(
    36,
    24,
    7,
    'RailPulse Enterprise v2.0 • Automated Quarterly Business Planning & Predictive Demand Analytics Engine',
    false,
    0.45,
    0.52,
    0.62
  );

  const streamContent = ops.join('\n');
  const streamBytesLength = new TextEncoder().encode(streamContent).length;

  const objects: string[] = [
    '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n',
    '2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n',
    '3 0 obj\n<< /Type /Page /Parent 2 0 R /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /MediaBox [0 0 595 842] /Contents 6 0 R >>\nendobj\n',
    '4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n',
    '5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>\nendobj\n',
    `6 0 obj\n<< /Length ${streamBytesLength} >>\nstream\n${streamContent}\nendstream\nendobj\n`,
  ];

  let pdfBody = '%PDF-1.4\n';
  const offsets: number[] = [0];

  for (const obj of objects) {
    offsets.push(new TextEncoder().encode(pdfBody).length);
    pdfBody += obj;
  }

  const xrefOffset = new TextEncoder().encode(pdfBody).length;
  pdfBody += `xref\n0 ${objects.length + 1}\n`;
  pdfBody += '0000000000 65535 f \n';
  for (let i = 1; i <= objects.length; i++) {
    pdfBody += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`;
  }
  pdfBody += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`;

  return new TextEncoder().encode(pdfBody);
}

export function triggerReportFileDownload(
  content: string | Uint8Array,
  filename: string,
  mimeType: string
): void {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;
  const blobPart =
    typeof content === 'string'
      ? content
      : new Uint8Array(content.buffer.slice(content.byteOffset, content.byteOffset + content.byteLength));
  const blob = new Blob([blobPart], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
