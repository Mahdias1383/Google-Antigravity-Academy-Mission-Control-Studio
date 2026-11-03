import {
  TrainLine,
  TrainSchedule,
  CalculatedTrainTrajectory,
  StationTimePoint,
  SafetyConflict,
} from '../types/railpulse';

/**
 * Converts "HH:MM" format to minutes from midnight (0..1439)
 */
export function timeStringToMinutes(timeStr: string): number {
  if (!timeStr || typeof timeStr !== 'string') return 0;
  const parts = timeStr.trim().split(':');
  const hours = parseInt(parts[0] || '0', 10);
  const minutes = parseInt(parts[1] || '0', 10);
  return (hours * 60 + minutes) % 1440;
}

/**
 * Converts minutes from midnight to "HH:MM"
 */
export function minutesToTimeString(totalMinutes: number): string {
  const normalized = Math.floor(((totalMinutes % 1440) + 1440) % 1440);
  const hours = Math.floor(normalized / 60);
  const minutes = normalized % 60;
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}

/**
 * Calculates exact arrival and departure times for each station along a train line
 * based on train average speed, inter-station distances, and stop durations.
 */
export function calculateTrainTrajectory(
  train: TrainSchedule,
  line: TrainLine
): CalculatedTrainTrajectory {
  const stations = line.stations;
  if (!stations || stations.length === 0) {
    return { train, line, timePoints: [] };
  }

  const departureMinutes = timeStringToMinutes(train.departureTime);
  const timePoints: StationTimePoint[] = [];

  let currentDepartureMinutes = departureMinutes;
  const speed = Math.max(10, train.speedKmh || 120);

  for (let i = 0; i < stations.length; i++) {
    const station = stations[i];

    if (i === 0) {
      // First station: departs at schedule time
      timePoints.push({
        stationId: station.id,
        stationNameFa: station.nameFa,
        stationNameEn: station.nameEn,
        kmFromStart: station.kmFromStart,
        arrivalTimeMinutes: departureMinutes,
        departureTimeMinutes: departureMinutes,
        arrivalTimeStr: minutesToTimeString(departureMinutes),
        departureTimeStr: minutesToTimeString(departureMinutes),
      });
      currentDepartureMinutes = departureMinutes;
    } else {
      const prevStation = stations[i - 1];
      const deltaKm = Math.abs(station.kmFromStart - prevStation.kmFromStart);
      const travelMinutes = (deltaKm / speed) * 60;

      const arrivalMinutes = currentDepartureMinutes + travelMinutes;
      const isTerminal = i === stations.length - 1;
      const stopDuration = isTerminal ? 0 : (train.stopTimesMinutes[i - 1] ?? 5);
      const departureFromStation = isTerminal ? arrivalMinutes : arrivalMinutes + stopDuration;

      timePoints.push({
        stationId: station.id,
        stationNameFa: station.nameFa,
        stationNameEn: station.nameEn,
        kmFromStart: station.kmFromStart,
        arrivalTimeMinutes: arrivalMinutes,
        departureTimeMinutes: departureFromStation,
        arrivalTimeStr: minutesToTimeString(arrivalMinutes),
        departureTimeStr: minutesToTimeString(departureFromStation),
      });

      currentDepartureMinutes = departureFromStation;
    }
  }

  return { train, line, timePoints };
}

/**
 * checkAccident Algorithm:
 * Evaluates whether any two trains scheduled on the same line have spatial/temporal conflicts:
 * 1. Station Platform Overlap (two trains present at the same station simultaneously beyond platform capacity)
 * 2. Track Segment Overtake (faster train catching up or passing a slower train between two stations)
 * 3. Headway Spacing Violation (< 5 min separation entering the same block segment)
 */
export function checkAccident(
  schedules: TrainSchedule[],
  lines: TrainLine[]
): SafetyConflict[] {
  const conflicts: SafetyConflict[] = [];
  const linesMap = new Map<string, TrainLine>(lines.map((l) => [l.id, l]));

  // Group schedules by line
  const schedulesByLine = new Map<string, TrainSchedule[]>();
  for (const s of schedules) {
    if (s.status === 'cancelled') continue;
    const list = schedulesByLine.get(s.lineId) || [];
    list.push(s);
    schedulesByLine.set(s.lineId, list);
  }

  for (const [lineId, trainList] of schedulesByLine.entries()) {
    const line = linesMap.get(lineId);
    if (!line || trainList.length < 2) continue;

    const trajectories = trainList.map((t) => calculateTrainTrajectory(t, line));

    for (let a = 0; a < trajectories.length; a++) {
      for (let b = a + 1; b < trajectories.length; b++) {
        const trajA = trajectories[a];
        const trajB = trajectories[b];

        // 1. Station Platform Overlap Check
        for (let sIdx = 0; sIdx < line.stations.length; sIdx++) {
          const station = line.stations[sIdx];
          const ptA = trajA.timePoints[sIdx];
          const ptB = trajB.timePoints[sIdx];
          if (!ptA || !ptB) continue;

          // Check overlap in interval [arr, dep]
          const startOverlap = Math.max(ptA.arrivalTimeMinutes, ptB.arrivalTimeMinutes);
          const endOverlap = Math.min(ptA.departureTimeMinutes, ptB.departureTimeMinutes);

          if (startOverlap <= endOverlap) {
            // Overlap detected! Check platform count
            const maxPlatforms = station.platformsCount || 1;
            if (maxPlatforms <= 1) {
              const overlapDuration = Math.round(endOverlap - startOverlap);
              conflicts.push({
                id: `conflict-platform-${trajA.train.id}-${trajB.train.id}-${station.id}`,
                type: 'platform-overlap',
                severity: 'critical',
                trainAId: trajA.train.id,
                trainBId: trajB.train.id,
                trainANumber: trajA.train.trainNumber,
                trainBNumber: trajB.train.trainNumber,
                lineId: line.id,
                lineNameFa: line.nameFa,
                lineNameEn: line.nameEn,
                locationName: `${station.nameFa} (${station.nameEn})`,
                estimatedConflictTime: minutesToTimeString(startOverlap),
                detailsFa: `تداخل همزمان سکو در ایستگاه ${station.nameFa}: قطار ${trajA.train.trainNumber} و قطار ${trajB.train.trainNumber} به مدت ${overlapDuration} دقیقه در بازه [${minutesToTimeString(startOverlap)} تا ${minutesToTimeString(endOverlap)}] به طور مشترک نیاز به سکوی ۱ دارند.`,
                detailsEn: `Simultaneous platform conflict at ${station.nameEn}: Train ${trajA.train.trainNumber} and Train ${trajB.train.trainNumber} overlap for ${overlapDuration} min [${minutesToTimeString(startOverlap)} - ${minutesToTimeString(endOverlap)}] on a single available platform.`,
                mathematicalProof: `Interval_A=[${ptA.arrivalTimeStr}, ${ptA.departureTimeStr}], Interval_B=[${ptB.arrivalTimeStr}, ${ptB.departureTimeStr}] => Intersection=[${minutesToTimeString(startOverlap)}, ${minutesToTimeString(endOverlap)}], Duration=${overlapDuration}min, PlatformsCount=${maxPlatforms}`,
              });
            }
          }
        }

        // 2. Track Segment Overtake Check
        for (let segIdx = 0; segIdx < line.stations.length - 1; segIdx++) {
          const stFrom = line.stations[segIdx];
          const stTo = line.stations[segIdx + 1];

          const depA = trajA.timePoints[segIdx]?.departureTimeMinutes;
          const arrA = trajA.timePoints[segIdx + 1]?.arrivalTimeMinutes;
          const depB = trajB.timePoints[segIdx]?.departureTimeMinutes;
          const arrB = trajB.timePoints[segIdx + 1]?.arrivalTimeMinutes;

          if (depA === undefined || arrA === undefined || depB === undefined || arrB === undefined) {
            continue;
          }

          // Case 1: Train A departed before Train B, but Train A arrived after Train B (Train B passed Train A)
          // Case 2: Train B departed before Train A, but Train B arrived after Train A (Train A passed Train B)
          const aDepartedFirst = depA < depB;
          const bArrivedFirst = arrB < arrA;
          const bDepartedFirst = depB < depA;
          const aArrivedFirst = arrA < arrB;

          if ((aDepartedFirst && bArrivedFirst) || (bDepartedFirst && aArrivedFirst)) {
            const firstTrainTraj = aDepartedFirst ? trajA : trajB;
            const secondTrainTraj = aDepartedFirst ? trajB : trajA;

            const v1 = firstTrainTraj.train.speedKmh;
            const v2 = secondTrainTraj.train.speedKmh;
            const tDep1 = (aDepartedFirst ? depA : depB) / 60; // in hours
            const tDep2 = (aDepartedFirst ? depB : depA) / 60; // in hours

            // Intersection equation:
            // x = v1 * (t - tDep1) = v2 * (t - tDep2)
            // v1*t - v1*tDep1 = v2*t - v2*tDep2
            // t*(v2 - v1) = v2*tDep2 - v1*tDep1
            let conflictTimeMin = Math.round(((depA + arrB) / 2));
            if (v2 !== v1) {
              const tIntersectHours = (v2 * tDep2 - v1 * tDep1) / (v2 - v1);
              conflictTimeMin = Math.round(tIntersectHours * 60);
            }

            const segmentName = `${stFrom.nameFa} ➔ ${stTo.nameFa}`;
            conflicts.push({
              id: `conflict-overtake-${trajA.train.id}-${trajB.train.id}-${segIdx}`,
              type: 'segment-overtake',
              severity: 'critical',
              trainAId: trajA.train.id,
              trainBId: trajB.train.id,
              trainANumber: trajA.train.trainNumber,
              trainBNumber: trajB.train.trainNumber,
              lineId: line.id,
              lineNameFa: line.nameFa,
              lineNameEn: line.nameEn,
              locationName: segmentName,
              estimatedConflictTime: minutesToTimeString(conflictTimeMin),
              detailsFa: `خطر برخورد و سبقت در بلاک یک‌خطه بین ${segmentName}: قطار سریع‌تر (${secondTrainTraj.train.trainNumber} با سرعت ${secondTrainTraj.train.speedKmh} km/h) قطار کندتر (${firstTrainTraj.train.trainNumber} با سرعت ${firstTrainTraj.train.speedKmh} km/h) را در این سگمنت رد می‌کند که منجر به سانحه شاخ‌به‌شاخ یا برخورد از پشت می‌شود.`,
              detailsEn: `Dangerous mid-track overtake on single-track block between ${stFrom.nameEn} and ${stTo.nameEn}: Faster Train ${secondTrainTraj.train.trainNumber} (${secondTrainTraj.train.speedKmh} km/h) intercepts slower Train ${firstTrainTraj.train.trainNumber} (${firstTrainTraj.train.speedKmh} km/h).`,
              mathematicalProof: `t_cross = (v2*t2 - v1*t1)/(v2 - v1) = (${v2}*${tDep2.toFixed(2)} - ${v1}*${tDep1.toFixed(2)}) / (${v2 - v1}) => ${minutesToTimeString(conflictTimeMin)}`,
            });
          } else {
            // 3. Minimum Headway Check (< 8 minutes separation entering same block)
            const depDiff = Math.abs(depA - depB);
            if (depDiff > 0 && depDiff < 8) {
              const earlierTrain = depA < depB ? trajA.train.trainNumber : trajB.train.trainNumber;
              const laterTrain = depA < depB ? trajB.train.trainNumber : trajA.train.trainNumber;
              conflicts.push({
                id: `conflict-headway-${trajA.train.id}-${trajB.train.id}-${segIdx}`,
                type: 'spacing-violation',
                severity: 'warning',
                trainAId: trajA.train.id,
                trainBId: trajB.train.id,
                trainANumber: trajA.train.trainNumber,
                trainBNumber: trajB.train.trainNumber,
                lineId: line.id,
                lineNameFa: line.nameFa,
                lineNameEn: line.nameEn,
                locationName: `${stFrom.nameFa} ➔ ${stTo.nameFa}`,
                estimatedConflictTime: minutesToTimeString(Math.min(depA, depB)),
                detailsFa: `نقض فاصله ایمنی بلاک (Headway): قطار ${laterTrain} فقط ${depDiff} دقیقه پس از قطار ${earlierTrain} وارد بلاک ${stFrom.nameFa} می‌شود (حداقل مجاز ۸ دقیقه).`,
                detailsEn: `Block spacing violation: Train ${laterTrain} follows Train ${earlierTrain} with only ${depDiff} min separation (minimum standard is 8 min).`,
                mathematicalProof: `Δt_departure = |${minutesToTimeString(depA)} - ${minutesToTimeString(depB)}| = ${depDiff} min < 8 min safety limit`,
              });
            }
          }
        }
      }
    }
  }

  return conflicts;
}
