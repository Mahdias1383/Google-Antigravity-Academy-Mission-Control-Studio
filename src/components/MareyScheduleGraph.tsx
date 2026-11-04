import React from 'react';
import {
  TrainLine,
  TrainSchedule,
  SafetyConflict,
} from '../types/railpulse';
import { calculateTrainTrajectory } from '../services/collisionEngine';
import { Language } from '../i18n/translations';
import { Activity, MapPin } from 'lucide-react';

interface MareyScheduleGraphProps {
  line: TrainLine;
  schedules: TrainSchedule[];
  conflicts: SafetyConflict[];
  language: Language;
}

export const MareyScheduleGraph: React.FC<MareyScheduleGraphProps> = ({
  line,
  schedules,
  language,
}) => {
  const isRtl = language === 'fa';
  const lineSchedules = schedules.filter((s) => s.lineId === line.id);

  return (
    <div
      data-testid="marey-schedule-graph"
      className="p-5 rounded-2xl bg-slate-900 border border-slate-700/80 shadow-xl space-y-4"
    >
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-cyan-400" />
          <h3 className="text-sm font-bold text-white">
            {isRtl
              ? `نمودار زمان-مسافت ماری (Marey's Graph) — ${line.nameFa}`
              : `Marey's Time-Distance Schedule Graph — ${line.nameEn}`}
          </h3>
        </div>
        <span className="text-xs font-mono text-slate-400" dir="ltr">
          {line.code} • {line.totalDistanceKm} km
        </span>
      </div>

      <div className="space-y-3">
        {lineSchedules.map((train) => {
          const traj = calculateTrainTrajectory(train, line);
          return (
            <div
              key={train.id}
              className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2"
            >
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-white">{train.trainNumber} — {isRtl ? train.trainNameFa : train.trainNameEn}</span>
                <span className="font-mono text-cyan-300" dir="ltr">{train.speedKmh} km/h</span>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-[11px]">
                {traj.timePoints.map((pt, idx) => (
                  <div
                    key={pt.stationId}
                    className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 flex items-center gap-1.5"
                  >
                    <MapPin className="w-3 h-3 text-blue-400" />
                    <span className="text-slate-200">{isRtl ? pt.stationNameFa : pt.stationNameEn}</span>
                    <span className="font-mono text-emerald-400" dir="ltr">
                      {idx === 0 ? pt.departureTimeStr : pt.arrivalTimeStr}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
