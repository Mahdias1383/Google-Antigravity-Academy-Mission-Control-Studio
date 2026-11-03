import React, { useState, useEffect, useMemo } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  BarChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
} from 'recharts';
import {
  TrendingUp,
  Activity,
  Train,
  Ticket as TicketIcon,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  Gauge,
  FileText,
  FileJson,
  Download,
  Eye,
  Briefcase,
} from 'lucide-react';
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
  buildTicketSalesTimeSeries,
  buildSystemActivityTimeSeries,
  buildCorridorPerformanceBreakdown,
  buildTicketDemandForecast,
} from '../services/dashboardAnalyticsService';
import {
  QuarterlyPlanningQuarter,
  QUARTER_OPTIONS,
  buildQuarterlyImpactReport,
  buildImpactReportFilename,
  exportImpactReportToJson,
  exportImpactReportToPdfBytes,
  triggerReportFileDownload,
} from '../services/impactReportService';
import {
  getStoredAuditLogs,
  subscribeToAuditLogs,
  seedInitialAuditLogs,
  recordAuditAction,
} from '../services/auditLogService';
import { Language } from '../i18n/translations';

interface AdminPerformanceChartsProps {
  lines: TrainLine[];
  schedules: TrainSchedule[];
  tickets: Ticket[];
  language: Language;
  refreshTick?: number;
}

export const AdminPerformanceCharts: React.FC<AdminPerformanceChartsProps> = ({
  lines,
  schedules,
  tickets,
  language,
  refreshTick = 0,
}) => {
  const isRtl = language === 'fa';
  const [salesWindow, setSalesWindow] = useState<SalesTimeWindow>('7d');
  const [forecastHorizon, setForecastHorizon] = useState<ForecastHorizon>('7d');
  const [demandScenario, setDemandScenario] = useState<DemandScenario>('baseline');
  const [selectedQuarter, setSelectedQuarter] =
    useState<QuarterlyPlanningQuarter>('Q4-1405');
  const [showReportPreview, setShowReportPreview] = useState<boolean>(true);
  const [reportExportFeedback, setReportExportFeedback] = useState<{
    format: 'PDF' | 'JSON';
    filename: string;
    sizeKb: string;
    quarterLabel: string;
  } | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => {
    seedInitialAuditLogs();
    return getStoredAuditLogs();
  });

  useEffect(() => {
    const unsub = subscribeToAuditLogs(() => {
      setAuditLogs(getStoredAuditLogs());
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    setAuditLogs(getStoredAuditLogs());
  }, [schedules, tickets, refreshTick]);

  const salesSeries = useMemo(
    () => buildTicketSalesTimeSeries(schedules, tickets, salesWindow),
    [schedules, tickets, salesWindow]
  );

  const activitySeries = useMemo(
    () => buildSystemActivityTimeSeries(auditLogs),
    [auditLogs]
  );

  const corridorMetrics = useMemo(
    () => buildCorridorPerformanceBreakdown(lines, schedules),
    [lines, schedules]
  );

  const demandForecast = useMemo(
    () =>
      buildTicketDemandForecast(
        schedules,
        tickets,
        forecastHorizon,
        demandScenario
      ),
    [schedules, tickets, forecastHorizon, demandScenario]
  );

  const quarterlyImpactReport = useMemo(
    () =>
      buildQuarterlyImpactReport({
        lines,
        schedules,
        tickets,
        auditLogs,
        quarter: selectedQuarter,
        salesWindow,
        forecastHorizon,
        scenario: demandScenario,
      }),
    [
      lines,
      schedules,
      tickets,
      auditLogs,
      selectedQuarter,
      salesWindow,
      forecastHorizon,
      demandScenario,
    ]
  );

  const handleExportImpactReport = (format: 'pdf' | 'json') => {
    const filename = buildImpactReportFilename(
      format,
      selectedQuarter,
      demandScenario
    );

    if (format === 'json') {
      const jsonContent = exportImpactReportToJson(quarterlyImpactReport);
      const sizeKb = (new TextEncoder().encode(jsonContent).length / 1024).toFixed(
        1
      );
      triggerReportFileDownload(
        jsonContent,
        filename,
        'application/json;charset=utf-8'
      );
      setReportExportFeedback({
        format: 'JSON',
        filename,
        sizeKb,
        quarterLabel: isRtl
          ? quarterlyImpactReport.quarterLabelFa
          : quarterlyImpactReport.quarterLabelEn,
      });
    } else {
      const pdfBytes = exportImpactReportToPdfBytes(quarterlyImpactReport);
      const sizeKb = (pdfBytes.byteLength / 1024).toFixed(1);
      triggerReportFileDownload(pdfBytes, filename, 'application/pdf');
      setReportExportFeedback({
        format: 'PDF',
        filename,
        sizeKb,
        quarterLabel: isRtl
          ? quarterlyImpactReport.quarterLabelFa
          : quarterlyImpactReport.quarterLabelEn,
      });
    }

    recordAuditAction({
      actorId: 'usr-admin-1',
      actorName: 'مهندس آرش کمالی (مدیر ارشد)',
      actorRole: 'admin',
      actionType: 'system_seed_reset',
      entityType: 'system',
      entityId: quarterlyImpactReport.reportId,
      summaryFa: `صدور گزارش تحلیلی برنامه‌ریزی فصلی (${format.toUpperCase()}) برای ${quarterlyImpactReport.quarterLabelFa}`,
      summaryEn: `Exported Quarterly Business Impact Report (${format.toUpperCase()}) for ${quarterlyImpactReport.quarterLabelEn}`,
      metadata: {
        reportId: quarterlyImpactReport.reportId,
        format: format.toUpperCase(),
        quarter: selectedQuarter,
        scenario: demandScenario,
        quarterlyProjectedSeats:
          quarterlyImpactReport.executiveSummary.quarterlyProjectedSeats,
      },
      riskLevel: 'low',
    });
  };

  const totalWindowTickets = useMemo(
    () => salesSeries.reduce((sum, pt) => sum + pt.ticketsSold, 0),
    [salesSeries]
  );

  const totalWindowRevenueMillions = useMemo(
    () =>
      Number(
        salesSeries.reduce((sum, pt) => sum + pt.revenueMillions, 0).toFixed(1)
      ),
    [salesSeries]
  );

  const totalActivityOps = useMemo(
    () => activitySeries.reduce((sum, pt) => sum + pt.totalEvents, 0),
    [activitySeries]
  );

  const bridgeDateLabel = useMemo(() => {
    const bridgePoint = demandForecast.points.find(
      (pt) => !pt.isForecast && pt.projectedTickets !== null
    );
    if (!bridgePoint) return undefined;
    return isRtl ? bridgePoint.dateLabelFa : bridgePoint.dateLabelEn;
  }, [demandForecast.points, isRtl]);

  return (
    <div className="space-y-6" data-testid="admin-performance-charts">
      {/* Section Header & Time Window Selector */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-blue-950/60 border border-slate-700/80 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              {isRtl
                ? 'داشبورد تحلیلی فروش بلیت و شاخص‌های فعالیت سامانه (Recharts Analytics)'
                : 'Visual Performance Dashboard: Ticket Sales & System Activity'}
            </h3>
            <p className="text-xs text-slate-400">
              {isRtl
                ? 'روند زمانی فروش بلیت، درآمد خطوط ریلی و توزیع عملیات حسابرسی در طول زمان'
                : 'Real-time ticket sales trajectories, revenue trends, and system activity telemetry over time'}
            </p>
          </div>
        </div>

        {/* Time Window Filter Buttons */}
        <div className="inline-flex items-center gap-1 bg-slate-800/90 border border-slate-700 p-1 rounded-xl shrink-0">
          {(
            [
              { id: '7d', labelFa: '۷ روز اخیر', labelEn: 'Last 7 Days' },
              { id: '14d', labelFa: '۱۴ روز اخیر', labelEn: 'Last 14 Days' },
              { id: '30d', labelFa: '۳۰ روز اخیر', labelEn: 'Last 30 Days' },
            ] as const
          ).map((w) => (
            <button
              key={w.id}
              type="button"
              onClick={() => setSalesWindow(w.id)}
              className={`h-8 inline-flex items-center justify-center px-3 rounded-lg text-xs font-semibold transition cursor-pointer whitespace-nowrap shrink-0 ${
                salesWindow === w.id
                  ? 'bg-blue-600 text-white shadow'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
              }`}
            >
              {isRtl ? w.labelFa : w.labelEn}
            </button>
          ))}
        </div>
      </div>

      {/* Main Charts Grid: Ticket Sales Trend + System Activity Metrics Over Time */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* CHART 1: Ticket Sales & Revenue Trend Over Time */}
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-700/80 shadow-xl space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
            <div>
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <TicketIcon className="w-4 h-4 text-emerald-400" />
                <span>
                  {isRtl
                    ? 'روند فروش بلیت و درآمد روزانه (میلیون تومان)'
                    : 'Ticket Sales Volume & Revenue Trend (M Tomans)'}
                </span>
              </h4>
              <p className="text-[11px] text-slate-400">
                {isRtl
                  ? `مجموع بازه: ${totalWindowTickets.toLocaleString('fa-IR')} صندلی | درآمد: ${totalWindowRevenueMillions.toLocaleString('fa-IR')} میلیون تومان`
                  : `Period Total: ${totalWindowTickets.toLocaleString('en-US')} seats | Revenue: ${totalWindowRevenueMillions}M TMN`}
              </p>
            </div>
            <span className="px-2.5 py-1 rounded-full text-[11px] font-mono font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
              {salesWindow.toUpperCase()}
            </span>
          </div>

          <div className="h-72 w-full" dir="ltr">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={salesSeries}
                margin={{ top: 10, right: 15, left: 0, bottom: 5 }}
              >
                <defs>
                  <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.45} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis
                  dataKey={isRtl ? 'dateLabelFa' : 'dateLabelEn'}
                  stroke="#94a3b8"
                  fontSize={11}
                  tickMargin={8}
                />
                <YAxis
                  yAxisId="left"
                  stroke="#10b981"
                  fontSize={11}
                  unit="M"
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  stroke="#3b82f6"
                  fontSize={11}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    borderRadius: '0.75rem',
                    fontSize: '12px',
                    color: '#f8fafc',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                <Area
                  yAxisId="left"
                  type="monotone"
                  dataKey="revenueMillions"
                  name={isRtl ? 'درآمد (میلیون تومان)' : 'Revenue (M TMN)'}
                  stroke="#10b981"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#revenueGrad)"
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="ticketsSold"
                  name={isRtl ? 'تعداد بلیت فروخته‌شده' : 'Tickets Sold'}
                  stroke="#3b82f6"
                  strokeWidth={2.5}
                  dot={{ r: 3.5, fill: '#3b82f6' }}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="cancellations"
                  name={isRtl ? 'استرداد / لغو' : 'Cancellations'}
                  stroke="#f43f5e"
                  strokeWidth={1.8}
                  strokeDasharray="4 4"
                  dot={{ r: 2.5, fill: '#f43f5e' }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* CHART 2: System Activity & Audit Telemetry Over Time */}
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-700/80 shadow-xl space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
            <div>
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <Activity className="w-4 h-4 text-blue-400" />
                <span>
                  {isRtl
                    ? 'متریک‌های فعالیت سامانه و توزیع زمانی رویدادها'
                    : 'System Activity & Audit Telemetry Over Time'}
                </span>
              </h4>
              <p className="text-[11px] text-slate-400">
                {isRtl
                  ? `حجم کل تراکنش‌ها و رویدادهای ثبت‌شده: ${totalActivityOps.toLocaleString('fa-IR')} عملیات`
                  : `Total Tracked System Operations: ${totalActivityOps.toLocaleString('en-US')} events`}
              </p>
            </div>
            <span className="px-2.5 py-1 rounded-full text-[11px] font-mono font-semibold bg-blue-500/15 text-blue-300 border border-blue-500/30">
              24H TELEMETRY
            </span>
          </div>

          <div className="h-72 w-full" dir="ltr">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={activitySeries}
                margin={{ top: 10, right: 15, left: 0, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis
                  dataKey={isRtl ? 'bucketLabelFa' : 'bucketLabelEn'}
                  stroke="#94a3b8"
                  fontSize={10}
                  tickMargin={8}
                />
                <YAxis stroke="#94a3b8" fontSize={11} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    borderRadius: '0.75rem',
                    fontSize: '12px',
                    color: '#f8fafc',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                <Bar
                  dataKey="reservations"
                  stackId="ops"
                  name={isRtl ? 'رزرو و استرداد بلیت' : 'Ticket Bookings/Refunds'}
                  fill="#10b981"
                  radius={[0, 0, 0, 0]}
                />
                <Bar
                  dataKey="scheduleOps"
                  stackId="ops"
                  name={isRtl ? 'تغییرات جدول حرکت' : 'Schedule Dispatch Ops'}
                  fill="#f59e0b"
                />
                <Bar
                  dataKey="systemAndWallet"
                  stackId="ops"
                  name={isRtl ? 'کیف پول و سیستم' : 'Wallet & System Ops'}
                  fill="#6366f1"
                  radius={[4, 4, 0, 0]}
                />
                <Line
                  type="monotone"
                  dataKey="highRiskEvents"
                  name={isRtl ? 'رویدادهای پرریسک' : 'High-Risk Alerts'}
                  stroke="#ef4444"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: '#ef4444' }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* CHART 3: Predictive Ticket Demand Forecast Module */}
      <div
        className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900/95 to-purple-950/35 border border-purple-500/30 shadow-xl space-y-5"
        data-testid="ticket-demand-forecast-module"
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-300 shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h4 className="text-sm font-bold text-white">
                  {isRtl
                    ? 'ماژول پیش‌بینی تقاضای بلیت و آینده‌نگری ظرفیت ناوگان (OLS Demand Forecast)'
                    : 'Predictive Ticket Demand Forecast & Fleet Capacity Projection'}
                </h4>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40">
                  {demandForecast.confidenceLevelPercent}% CI • OLS + SEASONAL
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {isRtl
                  ? 'برآورد آماری تقاضای صندلی در روزهای آینده بر اساس رگرسیون خطی داده‌های تاریخی، نوسان فصلی و سناریوهای عملیاتی'
                  : 'Statistical projection of future passenger seat demand based on historical linear regression trends and seasonal harmonics'}
              </p>
            </div>
          </div>

          {/* Forecast Controls: Scenario Selector + Horizon Toggle */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {/* Scenario Pills */}
            <div className="inline-flex items-center gap-1 bg-slate-950/80 border border-slate-800 p-1 rounded-xl">
              {(
                [
                  {
                    id: 'baseline',
                    labelFa: 'روند پایه',
                    labelEn: 'Baseline Trend',
                  },
                  {
                    id: 'peak_holiday',
                    labelFa: 'پیک تعطیلات (+۲۸٪)',
                    labelEn: 'Holiday Surge (+28%)',
                  },
                  {
                    id: 'weather_disruption',
                    labelFa: 'کاهش جوی (-۱۸٪)',
                    labelEn: 'Weather Shift (-18%)',
                  },
                ] as const
              ).map((sc) => (
                <button
                  key={sc.id}
                  type="button"
                  onClick={() => setDemandScenario(sc.id)}
                  className={`h-8 inline-flex items-center justify-center px-2.5 rounded-lg text-[11px] font-semibold transition cursor-pointer whitespace-nowrap shrink-0 ${
                    demandScenario === sc.id
                      ? 'bg-purple-600 text-white shadow'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  {isRtl ? sc.labelFa : sc.labelEn}
                </button>
              ))}
            </div>

            {/* Horizon Toggle (7d vs 14d) */}
            <div className="inline-flex items-center gap-1 bg-slate-950/80 border border-slate-800 p-1 rounded-xl">
              {(
                [
                  { id: '7d', labelFa: '+۷ روز آینده', labelEn: '+7D Horizon' },
                  { id: '14d', labelFa: '+۱۴ روز آینده', labelEn: '+14D Horizon' },
                ] as const
              ).map((hz) => (
                <button
                  key={hz.id}
                  type="button"
                  onClick={() => setForecastHorizon(hz.id)}
                  className={`h-8 inline-flex items-center justify-center px-2.5 rounded-lg text-[11px] font-semibold transition cursor-pointer whitespace-nowrap shrink-0 ${
                    forecastHorizon === hz.id
                      ? 'bg-indigo-600 text-white shadow'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  {isRtl ? hz.labelFa : hz.labelEn}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 4 Forecast Summary KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/90">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span>
                {isRtl ? 'تقاضای پیش‌بینی‌شده افق' : 'Projected Horizon Demand'}
              </span>
              <span
                className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold ${
                  demandForecast.growthRatePercent >= 0
                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                    : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                }`}
              >
                {demandForecast.growthRatePercent >= 0 ? '+' : ''}
                {demandForecast.growthRatePercent}%
              </span>
            </div>
            <div className="text-lg font-black text-white">
              {demandForecast.totalProjectedSeats.toLocaleString(
                isRtl ? 'fa-IR' : 'en-US'
              )}{' '}
              <span className="text-xs font-normal text-slate-400">
                {isRtl ? 'صندلی' : 'seats'}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {isRtl
                ? `شیب رگرسیون روزانه: ${demandForecast.dailyTrendSlope > 0 ? '+' : ''}${demandForecast.dailyTrendSlope} صندلی/روز`
                : `Linear trend slope: ${demandForecast.dailyTrendSlope > 0 ? '+' : ''}${demandForecast.dailyTrendSlope} seats/day`}
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/90">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span>
                {isRtl ? 'درآمد پیش‌بینی‌شده فروش' : 'Projected Ticket Revenue'}
              </span>
              <TrendingUp className="w-3.5 h-3.5 text-purple-400" />
            </div>
            <div className="text-lg font-black text-purple-300">
              {demandForecast.totalProjectedRevenueMillions.toLocaleString(
                isRtl ? 'fa-IR' : 'en-US'
              )}{' '}
              <span className="text-xs font-normal text-slate-400">
                {isRtl ? 'میلیون تومان' : 'M TMN'}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {isRtl
                ? `طی ${demandForecast.horizonDays.toLocaleString('fa-IR')} روز آینده`
                : `Across next ${demandForecast.horizonDays} forecast days`}
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/90">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span>
                {isRtl ? 'روز اوج تقاضا (Peak Day)' : 'Projected Peak Demand Day'}
              </span>
              <Gauge className="w-3.5 h-3.5 text-cyan-400" />
            </div>
            <div className="text-lg font-black text-cyan-300">
              {isRtl
                ? demandForecast.peakForecastDayFa
                : demandForecast.peakForecastDayEn}{' '}
              <span className="text-xs font-semibold text-slate-300">
                ({demandForecast.peakForecastSeats.toLocaleString(
                  isRtl ? 'fa-IR' : 'en-US'
                )}{' '}
                {isRtl ? 'بلیت' : 'tickets'})
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {isRtl
                ? 'پیشنهاد اعزام رام قطار فوق‌العاده در این تاریخ'
                : 'Recommended extra trainset dispatch window'}
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/90">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span>
                {isRtl ? 'تحلیل گلوگاه ظرفیت ناوگان' : 'Fleet Capacity Risk'}
              </span>
              {demandForecast.capacityBottleneckDays > 0 ? (
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
              ) : (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              )}
            </div>
            <div
              className={`text-lg font-black ${
                demandForecast.capacityBottleneckDays > 0
                  ? 'text-amber-300'
                  : 'text-emerald-300'
              }`}
            >
              {demandForecast.capacityBottleneckDays > 0
                ? isRtl
                  ? `${demandForecast.capacityBottleneckDays.toLocaleString('fa-IR')} روز پروازی اشباع`
                  : `${demandForecast.capacityBottleneckDays} High-Load Days`
                : isRtl
                ? 'ظرفیت کاملاً پایدار'
                : 'Capacity Optimal'}
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {isRtl
                ? 'بررسی مرز اشغال ۸۵٪ ظرفیت روزانه خطوط'
                : 'Threshold monitored at 85% daily seat ceiling'}
            </p>
          </div>
        </div>

        {/* Recharts Forecast ComposedChart */}
        <div className="h-80 w-full" dir="ltr">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={demandForecast.points}
              margin={{ top: 15, right: 20, left: 0, bottom: 5 }}
            >
              <defs>
                <linearGradient id="forecastBandGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#a855f7" stopOpacity={0.32} />
                  <stop offset="95%" stopColor="#a855f7" stopOpacity={0.04} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis
                dataKey={isRtl ? 'dateLabelFa' : 'dateLabelEn'}
                stroke="#94a3b8"
                fontSize={11}
                tickMargin={8}
              />
              <YAxis stroke="#94a3b8" fontSize={11} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0f172a',
                  borderColor: '#475569',
                  borderRadius: '0.75rem',
                  fontSize: '12px',
                  color: '#f8fafc',
                }}
              />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />

              {bridgeDateLabel && (
                <ReferenceLine
                  x={bridgeDateLabel}
                  stroke="#94a3b8"
                  strokeDasharray="3 3"
                  label={{
                    value: isRtl ? 'مرز شروع پیش‌بینی' : 'Forecast Start',
                    position: 'top',
                    fill: '#cbd5e1',
                    fontSize: 10,
                  }}
                />
              )}

              <Area
                type="monotone"
                dataKey="upperBoundTickets"
                name={
                  isRtl
                    ? 'کران بالای فاصله اطمینان (Upper CI)'
                    : 'Upper Confidence Bound'
                }
                stroke="none"
                fill="url(#forecastBandGrad)"
                connectNulls
              />
              <Line
                type="monotone"
                dataKey="lowerBoundTickets"
                name={
                  isRtl
                    ? 'کران پایین فاصله اطمینان (Lower CI)'
                    : 'Lower Confidence Bound'
                }
                stroke="#64748b"
                strokeWidth={1.2}
                strokeDasharray="2 4"
                dot={false}
                connectNulls
              />
              <Line
                type="monotone"
                dataKey="fleetCapacityLimit"
                name={isRtl ? 'سقف ظرفیت روزانه ناوگان' : 'Daily Fleet Capacity Ceiling'}
                stroke="#f59e0b"
                strokeWidth={1.5}
                strokeDasharray="6 4"
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="actualTickets"
                name={
                  isRtl
                    ? 'فروش واقعی ثبت‌شده (تاریخی)'
                    : 'Historical Actual Sales'
                }
                stroke="#3b82f6"
                strokeWidth={3}
                dot={{ r: 4, fill: '#3b82f6' }}
                connectNulls
              />
              <Line
                type="monotone"
                dataKey="projectedTickets"
                name={
                  isRtl
                    ? 'تقاضای پیش‌بینی‌شده (Forecast)'
                    : 'Projected Ticket Demand'
                }
                stroke="#a855f7"
                strokeWidth={3}
                strokeDasharray="5 5"
                dot={{ r: 4, fill: '#a855f7' }}
                connectNulls
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* QUARTERLY BUSINESS PLANNING & IMPACT REPORT GENERATOR */}
        <div
          className="pt-4 border-t border-purple-500/25 space-y-4"
          data-testid="quarterly-report-generator"
        >
          <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 p-4 rounded-xl bg-slate-950/90 border border-indigo-500/30">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-300 shrink-0">
                <Briefcase className="w-5 h-5" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h5 className="text-sm font-bold text-white">
                    {isRtl
                      ? 'مولد گزارش تحلیلی و برنامه‌ریزی کسب‌وکار فصلی (Report Generator)'
                      : 'Quarterly Business Planning & Impact Report Generator'}
                  </h5>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
                    {quarterlyImpactReport.reportId}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  {isRtl
                    ? 'تولید گزارش جامع PDF (دارای نمودارهای برداری فروش و پیش‌بینی) و فایل داده JSON جهت برنامه‌ریزی بودجه و ناوگان فصلی'
                    : 'Export detailed PDF (with embedded sales & forecast vector visualizations) or JSON impact reports for quarterly planning'}
                </p>
              </div>
            </div>

            {/* Quarter Selector + Export Actions */}
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <select
                aria-label={
                  isRtl ? 'انتخاب فصل برنامه‌ریزی' : 'Select Planning Quarter'
                }
                value={selectedQuarter}
                onChange={(e) =>
                  setSelectedQuarter(
                    e.target.value as QuarterlyPlanningQuarter
                  )
                }
                className="h-9 px-3 rounded-xl bg-slate-900 border border-slate-700 text-xs font-semibold text-slate-200 focus:outline-none focus:border-indigo-500 cursor-pointer shrink-0"
              >
                {QUARTER_OPTIONS.map((q) => (
                  <option key={q.id} value={q.id}>
                    {isRtl ? q.labelFa : q.labelEn}
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={() => setShowReportPreview((prev) => !prev)}
                className="h-9 inline-flex items-center justify-center gap-1.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition cursor-pointer whitespace-nowrap shrink-0"
              >
                <Eye className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                <span>
                  {isRtl
                    ? showReportPreview
                      ? 'بستن پیش‌نمایش گزارش'
                      : 'پیش‌نمایش گزارش فصلی'
                    : showReportPreview
                    ? 'Hide Report Preview'
                    : 'Preview Impact Report'}
                </span>
              </button>

              <button
                type="button"
                data-testid="export-impact-pdf-btn"
                onClick={() => handleExportImpactReport('pdf')}
                className="h-9 inline-flex items-center justify-center gap-1.5 px-3.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold shadow-lg shadow-indigo-900/40 transition cursor-pointer whitespace-nowrap shrink-0"
              >
                <FileText className="w-3.5 h-3.5 shrink-0" />
                <span>
                  {isRtl ? 'خروجی PDF گزارش فصلی' : 'Export PDF Report'}
                </span>
                <Download className="w-3.5 h-3.5 opacity-80 shrink-0" />
              </button>

              <button
                type="button"
                data-testid="export-impact-json-btn"
                onClick={() => handleExportImpactReport('json')}
                className="h-9 inline-flex items-center justify-center gap-1.5 px-3.5 rounded-xl bg-emerald-600/90 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-900/30 transition cursor-pointer whitespace-nowrap shrink-0"
              >
                <FileJson className="w-3.5 h-3.5 shrink-0" />
                <span>
                  {isRtl ? 'خروجی JSON برنامه فصلی' : 'Export JSON Report'}
                </span>
                <Download className="w-3.5 h-3.5 opacity-80 shrink-0" />
              </button>
            </div>
          </div>

          {/* Export Confirmation Toast Banner */}
          {reportExportFeedback && (
            <div
              data-testid="report-export-confirmation"
              className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-xs text-emerald-200"
            >
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>
                  {isRtl
                    ? `گزارش تحلیلی ${reportExportFeedback.format} برای «${reportExportFeedback.quarterLabel}» با موفقیت تولید و دانلود شد:`
                    : `${reportExportFeedback.format} Impact Report for "${reportExportFeedback.quarterLabel}" generated and downloaded:`}
                </span>
                <code className="px-2 py-0.5 rounded bg-slate-900/90 text-emerald-300 font-mono text-[11px]">
                  {reportExportFeedback.filename}
                </code>
              </div>
              <span className="font-mono text-[11px] text-emerald-300/90">
                {reportExportFeedback.sizeKb} KB • VISUAL CHARTS INCLUDED
              </span>
            </div>
          )}

          {/* Expandable Quarterly Impact Report Preview */}
          {showReportPreview && (
            <div
              data-testid="quarterly-report-preview-panel"
              className="p-4 rounded-xl bg-slate-950/75 border border-slate-800 space-y-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
                <div>
                  <h6 className="text-xs font-bold text-indigo-300 uppercase tracking-wider">
                    {isRtl
                      ? `خلاصه مدیریتی برنامه کسب‌وکار فصلی — ${quarterlyImpactReport.quarterLabelFa}`
                      : `Executive Quarterly Business Impact Summary — ${quarterlyImpactReport.quarterLabelEn}`}
                  </h6>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {isRtl
                      ? `${quarterlyImpactReport.scenarioLabelFa} • ترکیب داده‌های فروش واقعی (${salesWindow.toUpperCase()}) و پیش‌بینی (${forecastHorizon.toUpperCase()})`
                      : `${quarterlyImpactReport.scenarioLabelEn} • Combined Historical Sales (${salesWindow.toUpperCase()}) & Forecast (${forecastHorizon.toUpperCase()})`}
                  </p>
                </div>
                <span className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-[11px] font-mono text-slate-300">
                  90-DAY EXTRAPOLATION
                </span>
              </div>

              {/* 3 Quarterly Projection Metrics + Recommendations */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800">
                  <div className="text-[11px] text-slate-400">
                    {isRtl
                      ? 'تقاضای برآوردی کل فصل (۹۰ روزه)'
                      : 'Projected 90-Day Quarterly Seat Demand'}
                  </div>
                  <div className="text-base font-black text-white mt-1">
                    {quarterlyImpactReport.executiveSummary.quarterlyProjectedSeats.toLocaleString(
                      isRtl ? 'fa-IR' : 'en-US'
                    )}{' '}
                    <span className="text-xs font-normal text-slate-400">
                      {isRtl ? 'صندلی در فصل' : 'quarterly seats'}
                    </span>
                  </div>
                  <div className="text-[11px] text-emerald-400 mt-0.5">
                    {isRtl
                      ? `بر پایه فروش تاریخی ${quarterlyImpactReport.executiveSummary.historicalTicketsSold.toLocaleString('fa-IR')} بلیت`
                      : `Anchored on ${quarterlyImpactReport.executiveSummary.historicalTicketsSold.toLocaleString('en-US')} historical tickets`}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800">
                  <div className="text-[11px] text-slate-400">
                    {isRtl
                      ? 'درآمد ناخالص پیش‌بینی‌شده فصل'
                      : 'Projected 90-Day Quarterly Revenue'}
                  </div>
                  <div className="text-base font-black text-indigo-300 mt-1">
                    {quarterlyImpactReport.executiveSummary.quarterlyProjectedRevenueMillions.toLocaleString(
                      isRtl ? 'fa-IR' : 'en-US'
                    )}{' '}
                    <span className="text-xs font-normal text-slate-400">
                      {isRtl ? 'میلیون تومان' : 'M TMN'}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    {isRtl
                      ? `درآمد بازه فعلی: ${quarterlyImpactReport.executiveSummary.historicalRevenueMillions.toLocaleString('fa-IR')} میلیون تومان`
                      : `Historical Window Revenue: ${quarterlyImpactReport.executiveSummary.historicalRevenueMillions}M TMN`}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800">
                  <div className="text-[11px] text-slate-400">
                    {isRtl
                      ? 'نیاز ناوگان تقویتی فصل'
                      : 'Recommended Fleet Expansion'}
                  </div>
                  <div className="text-base font-black text-amber-300 mt-1">
                    +{quarterlyImpactReport.executiveSummary.recommendedExtraTrainsets.toLocaleString(
                      isRtl ? 'fa-IR' : 'en-US'
                    )}{' '}
                    <span className="text-xs font-normal text-slate-400">
                      {isRtl ? 'رام قطار فوق‌العاده' : 'Extra Trainsets'}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    {isRtl
                      ? `ضریب اطمینان مدل آماری: ${quarterlyImpactReport.executiveSummary.confidenceLevelPercent.toLocaleString('fa-IR')}٪`
                      : `Statistical Model Confidence: ${quarterlyImpactReport.executiveSummary.confidenceLevelPercent}% CI`}
                  </div>
                </div>
              </div>

              {/* Strategic Recommendations List */}
              <div className="space-y-2">
                <div className="text-xs font-bold text-slate-300">
                  {isRtl
                    ? 'توصیه‌های راهبردی مستخرج از نمودارهای فروش و پیش‌بینی (مندرج در فایل PDF و JSON):'
                    : 'Strategic Recommendations Derived from Sales & Forecast Visualizations:'}
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-2.5">
                  {quarterlyImpactReport.strategicRecommendations.map((rec) => (
                    <div
                      key={rec.id}
                      className="p-3 rounded-xl bg-slate-900/70 border border-slate-800/90 flex flex-col justify-between gap-1.5"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold text-white">
                          {isRtl ? rec.titleFa : rec.titleEn}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase shrink-0 ${
                            rec.priority === 'high'
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                              : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                          }`}
                        >
                          {rec.priority}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 leading-relaxed">
                        {isRtl ? rec.impactFa : rec.impactEn}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* CHART 4: Corridor Seat Occupancy & Capacity Breakdown */}
      <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-700/80 shadow-xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <div>
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <Train className="w-4 h-4 text-amber-400" />
              <span>
                {isRtl
                  ? 'مقایسه ضریب اشغال صندلی و ظرفیت خطوط ریلی سراسری'
                  : 'Corridor Seat Occupancy vs. Available Capacity Breakdown'}
              </span>
            </h4>
            <p className="text-[11px] text-slate-400">
              {isRtl
                ? 'تحلیل مقایسه‌ای صندلی‌های رزروشده در برابر ظرفیت آزاد هر کریدور ریلی'
                : 'Comparative analysis of booked seats versus remaining capacity across active corridors'}
            </p>
          </div>
        </div>

        <div className="h-64 w-full" dir="ltr">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={corridorMetrics}
              margin={{ top: 10, right: 20, left: 0, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis
                dataKey={isRtl ? 'nameFa' : 'nameEn'}
                stroke="#94a3b8"
                fontSize={11}
                tickMargin={8}
              />
              <YAxis stroke="#94a3b8" fontSize={11} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0f172a',
                  borderColor: '#334155',
                  borderRadius: '0.75rem',
                  fontSize: '12px',
                  color: '#f8fafc',
                }}
              />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
              <Bar
                dataKey="bookedSeats"
                name={isRtl ? 'صندلی‌های رزروشده' : 'Booked Seats'}
                fill="#3b82f6"
                radius={[6, 6, 0, 0]}
              />
              <Bar
                dataKey="availableSeats"
                name={isRtl ? 'ظرفیت آزاد باقیمانده' : 'Available Seats'}
                fill="#334155"
                radius={[6, 6, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

