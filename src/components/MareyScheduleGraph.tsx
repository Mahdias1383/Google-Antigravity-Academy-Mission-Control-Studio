import React, { useState, useMemo } from 'react';
import { TrainLine, TrainSchedule, SafetyConflict } from '../types/railpulse';
import { calculateTrainTrajectory, timeStringToMinutes, minutesToTimeString } from '../services/collisionEngine';
import { Language } from '../i18n/translations';
import { AlertTriangle, Clock, MapPin, Gauge, Eye } from 'lucide-react';

interface MareyScheduleGraphProps {
  line: TrainLine;
  schedules: TrainSchedule[];
  conflicts: SafetyConflict[];
  language: Language;
}

const TRAIN_COLORS = [
  '#3b82f6', // blue
  '#10b981', // emerald
  '#f59e0b', // amber
  '#ec4899', // pink
  '#8b5cf6', // purple
  '#06b6d4', // cyan
];

export const MareyScheduleGraph: React.FC<MareyScheduleGraphProps> = ({
  line,
  schedules,
  conflicts,
  language,
}) => {
  const isRtl = language === 'fa';
  const [hoveredTrainId, setHoveredTrainId] = useState<string | null>(null);

  // Time window: 05:00 (300 min) to 23:00 (1380 min)
  const START_MINUTE = 300; // 05:00
  const END_MINUTE = 1400; // 23:20
  const TOTAL_MINUTES = END_MINUTE - START_MINUTE;

  const lineSchedules = useMemo(() => {
    return schedules.filter((s) => s.lineId === line.id && s.status !== 'cancelled');
  }, [schedules, line.id]);

  const trajectories = useMemo(() => {
    return lineSchedules.map((s) => calculateTrainTrajectory(s, line));
  }, [lineSchedules, line]);

  const maxKm = line.totalDistanceKm || 900;

  // SVG coordinate dimensions
  const SVG_WIDTH = 900;
  const SVG_HEIGHT = 420;
  const PADDING_TOP = 40;
  const PADDING_BOTTOM = 40;
  const PADDING_LEFT = 110;
  const PADDING_RIGHT = 40;

  const graphWidth = SVG_WIDTH - PADDING_LEFT - PADDING_RIGHT;
  const graphHeight = SVG_HEIGHT - PADDING_TOP - PADDING_BOTTOM;

  const minuteToX = (min: number) => {
    const clamped = Math.max(START_MINUTE, Math.min(END_MINUTE, min));
    return PADDING_LEFT + ((clamped - START_MINUTE) / TOTAL_MINUTES) * graphWidth;
  };

  const kmToY = (km: number) => {
    const ratio = Math.max(0, Math.min(1, km / maxKm));
    return PADDING_TOP + ratio * graphHeight;
  };

  // Hour markers
  const hours = useMemo(() => {
    const result = [];
    for (let h = 5; h <= 23; h += 2) {
      result.push(h);
    }
    return result;
  }, []);

  return (
    <div className="bg-slate-900/90 border border-slate-700/70 rounded-2xl p-5 shadow-xl space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Clock className="w-4 h-4 text-blue-400" />
            {isRtl ? `نمودار فاصله-زمان ماری (Marey Graph): ${line.nameFa}` : `Marey Time-Distance Schedule: ${line.nameEn}`}
          </h3>
          <p className="text-xs text-slate-400">
            {isRtl
              ? 'موقعیت زمانی-مکانی قطارها در طول خط. تقاطع خطوط نشان‌دهنده ریسک برخورد یا سبقت در بلاک است.'
              : 'Spatial-temporal train trajectories along line. Intersections denote collision/overtake hazards.'}
          </p>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {lineSchedules.map((s, idx) => {
            const color = TRAIN_COLORS[idx % TRAIN_COLORS.length];
            const isHovered = hoveredTrainId === s.id;
            return (
              <button
                key={s.id}
                onMouseEnter={() => setHoveredTrainId(s.id)}
                onMouseLeave={() => setHoveredTrainId(null)}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border transition cursor-pointer ${
                  isHovered
                    ? 'bg-slate-700 text-white border-white scale-105'
                    : 'bg-slate-850 bg-slate-800 text-slate-300 border-slate-700 hover:border-slate-500'
                }`}
              >
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
                <span>{s.trainNumber}</span>
                <span className="text-[10px] text-slate-400 font-mono">({s.speedKmh} km/h)</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* SVG Canvas */}
      <div className="overflow-x-auto">
        <svg
          viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
          className="w-full h-auto min-w-[700px] bg-slate-950/60 rounded-xl border border-slate-800 font-sans"
        >
          {/* Hour Grid Lines */}
          {hours.map((h) => {
            const min = h * 60;
            const x = minuteToX(min);
            return (
              <g key={`hour-${h}`}>
                <line
                  x1={x}
                  y1={PADDING_TOP}
                  x2={x}
                  y2={SVG_HEIGHT - PADDING_BOTTOM}
                  stroke="#334155"
                  strokeWidth="1"
                  strokeDasharray="3 3"
                />
                <text
                  x={x}
                  y={SVG_HEIGHT - PADDING_BOTTOM + 16}
                  fill="#94a3b8"
                  fontSize="11"
                  textAnchor="middle"
                  fontFamily="JetBrains Mono"
                >
                  {`${h.toString().padStart(2, '0')}:00`}
                </text>
                <text
                  x={x}
                  y={PADDING_TOP - 12}
                  fill="#64748b"
                  fontSize="10"
                  textAnchor="middle"
                  fontFamily="JetBrains Mono"
                >
                  {`${h.toString().padStart(2, '0')}:00`}
                </text>
              </g>
            );
          })}

          {/* Station Horizontal Lines & Labels */}
          {line.stations.map((st, sIdx) => {
            const y = kmToY(st.kmFromStart);
            return (
              <g key={st.id}>
                <line
                  x1={PADDING_LEFT}
                  y1={y}
                  x2={SVG_WIDTH - PADDING_RIGHT}
                  y2={y}
                  stroke="#1e293b"
                  strokeWidth="1.5"
                />
                <circle cx={PADDING_LEFT} cy={y} r="3" fill="#60a5fa" />
                <text
                  x={PADDING_LEFT - 8}
                  y={y + 4}
                  fill="#cbd5e1"
                  fontSize="11"
                  fontWeight="600"
                  textAnchor="end"
                >
                  {isRtl ? st.nameFa : st.nameEn}
                </text>
                <text
                  x={PADDING_LEFT - 8}
                  y={y + 16}
                  fill="#64748b"
                  fontSize="9"
                  fontFamily="JetBrains Mono"
                  textAnchor="end"
                >
                  {st.kmFromStart} km
                </text>
              </g>
            );
          })}

          {/* Train Trajectory Polylines */}
          {trajectories.map((traj, idx) => {
            const color = TRAIN_COLORS[idx % TRAIN_COLORS.length];
            const isHovered = hoveredTrainId === traj.train.id;

            // Build path points: for each station, draw arrival point, then departure point (horizontal dwell)
            const pathSegments: string[] = [];
            traj.timePoints.forEach((pt, pIdx) => {
              const y = kmToY(pt.kmFromStart);
              const xArr = minuteToX(pt.arrivalTimeMinutes);
              const xDep = minuteToX(pt.departureTimeMinutes);

              if (pIdx === 0) {
                pathSegments.push(`M ${xDep} ${y}`);
              } else {
                pathSegments.push(`L ${xArr} ${y}`);
                if (xDep !== xArr) {
                  pathSegments.push(`L ${xDep} ${y}`); // Station stop flat dwell
                }
              }
            });

            return (
              <g
                key={traj.train.id}
                onMouseEnter={() => setHoveredTrainId(traj.train.id)}
                onMouseLeave={() => setHoveredTrainId(null)}
                className="cursor-pointer transition-opacity"
              >
                {/* Thick glow when hovered */}
                {isHovered && (
                  <path
                    d={pathSegments.join(' ')}
                    fill="none"
                    stroke={color}
                    strokeWidth="8"
                    strokeOpacity="0.3"
                    strokeLinecap="round"
                  />
                )}

                {/* Main trajectory path */}
                <path
                  d={pathSegments.join(' ')}
                  fill="none"
                  stroke={color}
                  strokeWidth={isHovered ? '4' : '2.5'}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                {/* Start Marker */}
                {traj.timePoints[0] && (
                  <circle
                    cx={minuteToX(traj.timePoints[0].departureTimeMinutes)}
                    cy={kmToY(traj.timePoints[0].kmFromStart)}
                    r={isHovered ? '5' : '3.5'}
                    fill={color}
                    stroke="#ffffff"
                    strokeWidth="1.5"
                  />
                )}

                {/* End Marker */}
                {traj.timePoints[traj.timePoints.length - 1] && (
                  <circle
                    cx={minuteToX(traj.timePoints[traj.timePoints.length - 1].arrivalTimeMinutes)}
                    cy={kmToY(traj.timePoints[traj.timePoints.length - 1].kmFromStart)}
                    r={isHovered ? '5' : '3.5'}
                    fill={color}
                    stroke="#ffffff"
                    strokeWidth="1.5"
                  />
                )}
              </g>
            );
          })}

          {/* Conflict Warning Markers on Graph */}
          {conflicts
            .filter((c) => c.lineId === line.id)
            .map((conf, cIdx) => {
              const confMin = timeStringToMinutes(conf.estimatedConflictTime);
              const x = minuteToX(confMin);
              const y = PADDING_TOP + (graphHeight / 2) + (cIdx * 20); // Mid-graph marker

              return (
                <g key={conf.id} className="cursor-pointer animate-pulse">
                  <circle cx={x} cy={y} r="8" fill="#ef4444" fillOpacity="0.8" />
                  <circle cx={x} cy={y} r="14" fill="none" stroke="#ef4444" strokeWidth="1.5" />
                  <text
                    x={x}
                    y={y + 4}
                    fill="#ffffff"
                    fontSize="10"
                    fontWeight="bold"
                    textAnchor="middle"
                  >
                    !
                  </text>
                </g>
              );
            })}
        </svg>
      </div>
    </div>
  );
};
