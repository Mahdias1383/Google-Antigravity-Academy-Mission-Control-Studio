import React, { useState, useMemo } from 'react';
import {
  TrainLine,
  TrainSchedule,
  Ticket,
} from '../types/railpulse';
import {
  SalesTimeWindow,
  ForecastHorizon,
  DemandScenario,
  buildTicketSalesTimeSeries,
  buildCorridorPerformanceBreakdown,
  buildTicketDemandForecast,
} from '../services/dashboardAnalyticsService';
import { Language } from '../i18n/translations';
import { TrendingUp, Gauge, Sparkles } from 'lucide-react';

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
}) => {
  const isRtl = language === 'fa';
  const [salesWindow, setSalesWindow] = useState<SalesTimeWindow>('7d');
  const [forecastHorizon, setForecastHorizon] = useState<ForecastHorizon>('7d');
  const [scenario, setScenario] = useState<DemandScenario>('baseline');

  const salesSeries = useMemo(
    () => buildTicketSalesTimeSeries(schedules, tickets, salesWindow),
    [schedules, tickets, salesWindow]
  );

  const corridors = useMemo(
    () => buildCorridorPerformanceBreakdown(lines, schedules),
    [lines, schedules]
  );

  const forecast = useMemo(
    () => buildTicketDemandForecast(schedules, tickets, forecastHorizon, scenario),
    [schedules, tickets, forecastHorizon, scenario]
  );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Sales Trend Card */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-700/80 shadow space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              <span>{isRtl ? 'روند فروش بلیت و درآمد (تومان)' : 'Ticket Sales & Revenue Trend'}</span>
            </h3>
            <div className="flex items-center gap-1">
              {(['7d', '14d', '30d'] as const).map((w) => (
                <button
                  key={w}
                  type="button"
                  onClick={() => setSalesWindow(w)}
                  className={`px-2 py-0.5 rounded text-[11px] font-mono cursor-pointer ${
                    salesWindow === w
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {w}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            {salesSeries.slice(-4).map((pt) => (
              <div key={pt.isoDate} className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                <div className="text-[11px] text-slate-400 font-mono" dir="ltr">{pt.dateLabelEn}</div>
                <div className="text-sm font-bold text-emerald-400 font-mono mt-0.5">
                  {pt.ticketsSold.toLocaleString(isRtl ? 'fa-IR' : 'en-US')} {isRtl ? 'بلیت' : 'tks'}
                </div>
                <div className="text-[10px] text-slate-400 font-mono" dir="ltr">
                  {pt.revenueMillions}M TMN
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Corridor Occupancy Breakdown */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-700/80 shadow space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Gauge className="w-4 h-4 text-blue-400" />
            <span>{isRtl ? 'عملکرد و ضریب اشغال کریدورهای ریلی' : 'Corridor Occupancy Breakdown'}</span>
          </h3>
          <div className="space-y-2.5">
            {corridors.map((c) => (
              <div key={c.lineId} className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs">
                <div>
                  <div className="font-bold text-white">{isRtl ? c.nameFa : c.nameEn}</div>
                  <div className="text-[11px] text-slate-400 font-mono" dir="ltr">
                    {c.code} • {c.bookedSeats}/{c.totalCapacity} seats
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-lg bg-blue-500/20 text-blue-300 border border-blue-500/30 font-mono font-bold" dir="ltr">
                  {c.occupancyPercent}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Demand Forecast Summary */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-700/80 shadow space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>
              {isRtl
                ? `پیش‌بینی تقاضای بلیت (${forecast.totalProjectedSeats.toLocaleString('fa-IR')} صندلی در افق ${forecast.horizonDays} روزه)`
                : `Demand Forecast (${forecast.totalProjectedSeats} projected seats over ${forecast.horizonDays}d)`}
            </span>
          </h3>
          <div className="flex items-center gap-1.5 text-xs">
            {(['baseline', 'peak_holiday', 'weather_disruption'] as const).map((sc) => (
              <button
                key={sc}
                type="button"
                onClick={() => setScenario(sc)}
                className={`px-2.5 py-1 rounded-lg text-[11px] cursor-pointer ${
                  scenario === sc
                    ? 'bg-amber-600 text-white font-bold'
                    : 'bg-slate-800 text-slate-400'
                }`}
              >
                {sc}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
