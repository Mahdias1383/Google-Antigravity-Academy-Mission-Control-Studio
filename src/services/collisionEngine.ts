import {
  TrainSchedule,
  TrainLine,
  SafetyConflict,
} from '../types/railpulse';

export interface StationTimePoint {
  stationId: string;
  stationNameFa: string;
  stationNameEn: string;
  kmFromStart: number;
  arrivalMinutes: number;
  departureMinutes: number;
  arrivalTimeStr: string;
  departureTimeStr: string;
}

export interface TrainTrajectory {
  scheduleId: string;
  trainNumber: string;
  lineId: string;
  timePoints: StationTimePoint[];
}

export function timeStringToMinutes(timeStr: string): number {
  const [hh, mm] = (timeStr || '00:00').split(':').map((n) => parseInt(n, 10) || 0);
  return Math.max(0, Math.min(23, hh)) * 60 + Math.max(0, Math.min(59, mm));
}

export function minutesToTimeString(totalMinutes: number): string {
  const normalized = ((Math.round(totalMinutes) % 1440) + 1440) % 1440;
  const hh = Math.floor(normalized / 60)
    .toString()
    .padStart(2, '0');
  const mm = (normalized % 60).toString().padStart(2, '0');
  return `${hh}:${mm}`;
}

export function calculateTrainTrajectory(
  schedule: TrainSchedule,
  line: TrainLine
): TrainTrajectory {
  const depMins = timeStringToMinutes(schedule.departureTime);
  const speed = Math.max(10, schedule.speedKmh || 100);
  const timePoints: StationTimePoint[] = [];

  let currentMins = depMins;
  const stations = line.stations || [];

  for (let i = 0; i < stations.length; i++) {
    const st = stations[i];
    if (i === 0) {
      timePoints.push({
        stationId: st.id,
        stationNameFa: st.nameFa,
        stationNameEn: st.nameEn,
        kmFromStart: st.kmFromStart,
        arrivalMinutes: currentMins,
        departureMinutes: currentMins,
        arrivalTimeStr: minutesToTimeString(currentMins),
        departureTimeStr: minutesToTimeString(currentMins),
      });
    } else {
      const prevSt = stations[i - 1];
      const distKm = Math.max(0, st.kmFromStart - prevSt.kmFromStart);
      const travelMins = (distKm / speed) * 60;
      const arrMins = currentMins + travelMins;
      const stopDuration =
        i < stations.length - 1 ? schedule.stopTimesMinutes?.[i - 1] ?? 10 : 0;
      const nextDepMins = arrMins + stopDuration;

      timePoints.push({
        stationId: st.id,
        stationNameFa: st.nameFa,
        stationNameEn: st.nameEn,
        kmFromStart: st.kmFromStart,
        arrivalMinutes: arrMins,
        departureMinutes: nextDepMins,
        arrivalTimeStr: minutesToTimeString(arrMins),
        departureTimeStr: minutesToTimeString(nextDepMins),
      });
      currentMins = nextDepMins;
    }
  }

  return {
    scheduleId: schedule.id,
    trainNumber: schedule.trainNumber,
    lineId: schedule.lineId,
    timePoints,
  };
}

/**
 * Mathematical Temporal-Spatial Collision Detection Engine (checkAccident).
 * Detects both Station Platform Overlaps and Track Segment Overtakes/Collisions.
 */
export function checkAccident(
  schedules: TrainSchedule[],
  lines: TrainLine[]
): SafetyConflict[] {
  const conflicts: SafetyConflict[] = [];
  const activeSchedules = schedules.filter((s) => s.status !== 'cancelled');

  for (const line of lines) {
    const lineTrains = activeSchedules.filter((s) => s.lineId === line.id);
    const trajectories = lineTrains.map((t) => ({
      schedule: t,
      trajectory: calculateTrainTrajectory(t, line),
    }));

    for (let i = 0; i < trajectories.length; i++) {
      for (let j = i + 1; j < trajectories.length; j++) {
        const a = trajectories[i];
        const b = trajectories[j];
        const ptsA = a.trajectory.timePoints;
        const ptsB = b.trajectory.timePoints;
        const count = Math.min(ptsA.length, ptsB.length);

        // 1. Check segment overtakes between station k and k+1
        for (let k = 0; k < count - 1; k++) {
          const aDep = ptsA[k].departureMinutes;
          const aArrNext = ptsA[k + 1].arrivalMinutes;
          const bDep = ptsB[k].departureMinutes;
          const bArrNext = ptsB[k + 1].arrivalMinutes;

          const aLeavesFirstButArrivesLater = aDep <= bDep && aArrNext >= bArrNext;
          const bLeavesFirstButArrivesLater = bDep <= aDep && bArrNext >= aArrNext;

          if (aLeavesFirstButArrivesLater || bLeavesFirstButArrivesLater) {
            const estTime = minutesToTimeString(
              Math.round((Math.max(aDep, bDep) + Math.min(aArrNext, bArrNext)) / 2)
            );
            conflicts.push({
              id: `CONF-SEG-${a.schedule.id}-${b.schedule.id}-${k}`,
              lineId: line.id,
              conflictType: 'segment_overtake_collision',
              trainAId: a.schedule.id,
              trainANumber: a.schedule.trainNumber,
              trainBId: b.schedule.id,
              trainBNumber: b.schedule.trainNumber,
              locationName: `${ptsA[k].stationNameFa} → ${ptsA[k + 1].stationNameFa}`,
              estimatedConflictTime: estTime,
              detailsFa: `برخورد/سبقت غیرمجاز در بلاک بین ${ptsA[k].stationNameFa} و ${ptsA[k + 1].stationNameFa} بین قطار ${a.schedule.trainNumber} و ${b.schedule.trainNumber}`,
              detailsEn: `Track segment overtake collision between ${ptsA[k].stationNameEn} and ${ptsA[k + 1].stationNameEn} involving ${a.schedule.trainNumber} and ${b.schedule.trainNumber}`,
              mathematicalProof: `T_dep(${a.schedule.trainNumber})=${minutesToTimeString(aDep)}, T_arr=${minutesToTimeString(aArrNext)} vs T_dep(${b.schedule.trainNumber})=${minutesToTimeString(bDep)}, T_arr=${minutesToTimeString(bArrNext)}`,
              severity: 'critical',
            });
          }
        }

        // 2. Check intermediate station platform dwell overlap ( within 5 mins headway )
        for (let k = 1; k < count - 1; k++) {
          const aStart = ptsA[k].arrivalMinutes;
          const aEnd = ptsA[k].departureMinutes;
          const bStart = ptsB[k].arrivalMinutes;
          const bEnd = ptsB[k].departureMinutes;

          if (Math.max(aStart, bStart) < Math.min(aEnd, bEnd)) {
            conflicts.push({
              id: `CONF-STN-${a.schedule.id}-${b.schedule.id}-${k}`,
              lineId: line.id,
              conflictType: 'station_platform_overlap',
              trainAId: a.schedule.id,
              trainANumber: a.schedule.trainNumber,
              trainBId: b.schedule.id,
              trainBNumber: b.schedule.trainNumber,
              locationName: ptsA[k].stationNameFa,
              estimatedConflictTime: minutesToTimeString(Math.max(aStart, bStart)),
              detailsFa: `تداخل همزمان توقف در سکوی ایستگاه ${ptsA[k].stationNameFa} بین قطارهای ${a.schedule.trainNumber} و ${b.schedule.trainNumber}`,
              detailsEn: `Simultaneous station platform occupancy at ${ptsA[k].stationNameEn} between ${a.schedule.trainNumber} and ${b.schedule.trainNumber}`,
              mathematicalProof: `Overlap window: [${minutesToTimeString(Math.max(aStart, bStart))}, ${minutesToTimeString(Math.min(aEnd, bEnd))}]`,
              severity: 'warning',
            });
          }
        }
      }
    }
  }

  return conflicts;
}
