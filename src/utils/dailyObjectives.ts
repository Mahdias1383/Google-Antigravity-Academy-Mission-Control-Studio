/**
 * Daily Objectives Engine
 * 
 * Manages daily architectural mission selection, tracking, completion status,
 * and integration with the daily streak multiplier to award boosted XP rewards.
 */

import {
  ARCHITECT_DAILY_MISSIONS_POOL,
  ArchitectDailyMissionTask,
  selectArchitectDailyMission,
} from './generators';
import {
  applyStreakXpMultiplier,
  calculateStreakMultiplier,
  getStoredDailyStreak,
} from './streakMultiplier';

export const DAILY_OBJECTIVE_STORAGE_KEY = 'ag_daily_objective_v1';
export const DAILY_OBJECTIVE_UPDATED_EVENT = 'antigravity_daily_objective_updated_event_v1';

export interface StoredDailyObjective {
  dateIso: string; // YYYY-MM-DD
  missionId: string;
  completed: boolean;
  completedAtIso?: string;
  baseXp: number;
  multiplier: number;
  bonusXp: number;
  awardedXp: number;
  streakDaysAtClaim?: number;
  customNotes?: string;
}

export interface DailyObjectiveEvaluation {
  objective: StoredDailyObjective;
  mission: ArchitectDailyMissionTask;
  streakMultiplier: number;
  streakTierLabel: string;
  currentStreakDays: number;
  potentialFinalXp: number;
  potentialBonusXp: number;
  canClaim: boolean;
}

export function getTodayIsoDateString(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Finds a mission task from the pool by ID, falling back to the first pool mission
 */
export function findDailyMissionById(missionId: string): ArchitectDailyMissionTask {
  const match = ARCHITECT_DAILY_MISSIONS_POOL.find((m) => m.id === missionId);
  return match || ARCHITECT_DAILY_MISSIONS_POOL[0];
}

/**
 * Creates a fresh default daily objective for a given date
 */
export function createInitialDailyObjective(dateIso: string): StoredDailyObjective {
  const defaultMission = selectArchitectDailyMission({ seedOrIndex: dateIso });
  return {
    dateIso,
    missionId: defaultMission.id,
    completed: false,
    baseXp: defaultMission.xpReward,
    multiplier: 1.0,
    bonusXp: 0,
    awardedXp: 0,
  };
}

/**
 * Safely loads the stored daily objective from browser localStorage,
 * initializing today's mission if not present or if date has rolled over.
 */
export function getStoredDailyObjective(
  customStorage?: Storage,
  todayIso: string = getTodayIsoDateString()
): StoredDailyObjective {
  const storage =
    customStorage || (typeof window !== 'undefined' ? window.localStorage : undefined);

  if (!storage) {
    return createInitialDailyObjective(todayIso);
  }

  try {
    const raw = storage.getItem(DAILY_OBJECTIVE_STORAGE_KEY);
    if (!raw) {
      const initial = createInitialDailyObjective(todayIso);
      storage.setItem(DAILY_OBJECTIVE_STORAGE_KEY, JSON.stringify(initial));
      return initial;
    }

    const parsed: Partial<StoredDailyObjective> = JSON.parse(raw);

    // If date has rolled over, initialize fresh objective for today
    if (parsed.dateIso !== todayIso) {
      const fresh = createInitialDailyObjective(todayIso);
      storage.setItem(DAILY_OBJECTIVE_STORAGE_KEY, JSON.stringify(fresh));
      return fresh;
    }

    // Ensure mission ID is valid
    const mission = findDailyMissionById(parsed.missionId || '');

    return {
      dateIso: todayIso,
      missionId: mission.id,
      completed: Boolean(parsed.completed),
      completedAtIso: parsed.completedAtIso,
      baseXp: typeof parsed.baseXp === 'number' && parsed.baseXp > 0 ? parsed.baseXp : mission.xpReward,
      multiplier: typeof parsed.multiplier === 'number' && parsed.multiplier >= 1.0 ? parsed.multiplier : 1.0,
      bonusXp: typeof parsed.bonusXp === 'number' && parsed.bonusXp >= 0 ? parsed.bonusXp : 0,
      awardedXp: typeof parsed.awardedXp === 'number' && parsed.awardedXp >= 0 ? parsed.awardedXp : 0,
      streakDaysAtClaim: parsed.streakDaysAtClaim,
      customNotes: parsed.customNotes,
    };
  } catch {
    const fallback = createInitialDailyObjective(todayIso);
    return fallback;
  }
}

/**
 * Persists daily objective state to storage and dispatches update event
 */
export function saveStoredDailyObjective(
  objective: StoredDailyObjective,
  customStorage?: Storage
): void {
  const storage =
    customStorage || (typeof window !== 'undefined' ? window.localStorage : undefined);

  if (storage) {
    try {
      storage.setItem(DAILY_OBJECTIVE_STORAGE_KEY, JSON.stringify(objective));
    } catch {}
  }

  if (typeof window !== 'undefined') {
    try {
      window.dispatchEvent(
        new CustomEvent(DAILY_OBJECTIVE_UPDATED_EVENT, { detail: objective })
      );
    } catch {}
  }
}

/**
 * Evaluates current daily objective against active streak days and computes potential rewards
 */
export function evaluateDailyObjective(
  objective: StoredDailyObjective,
  streakDays: number
): DailyObjectiveEvaluation {
  const mission = findDailyMissionById(objective.missionId);
  const streakEval = calculateStreakMultiplier(streakDays);
  const xpBreakdown = applyStreakXpMultiplier(mission.xpReward, streakDays);

  return {
    objective,
    mission,
    streakMultiplier: streakEval.multiplier,
    streakTierLabel: streakEval.multiplierLabel,
    currentStreakDays: streakEval.currentStreakDays,
    potentialFinalXp: xpBreakdown.finalXp,
    potentialBonusXp: xpBreakdown.bonusXpEarned,
    canClaim: !objective.completed,
  };
}

/**
 * Changes the active mission of today's objective (allowed only if not completed yet)
 */
export function changeDailyObjectiveMission(
  newMissionId: string,
  customStorage?: Storage,
  todayIso: string = getTodayIsoDateString()
): StoredDailyObjective {
  const current = getStoredDailyObjective(customStorage, todayIso);
  const targetMission = findDailyMissionById(newMissionId);

  // If already completed, cannot change today's completed mission
  if (current.completed) {
    return current;
  }

  const updated: StoredDailyObjective = {
    ...current,
    missionId: targetMission.id,
    baseXp: targetMission.xpReward,
  };

  saveStoredDailyObjective(updated, customStorage);
  return updated;
}

/**
 * Claims today's daily mission with streak multiplier bonus applied
 */
export function claimDailyObjective(
  missionId: string,
  streakDays: number,
  customStorage?: Storage,
  todayIso: string = getTodayIsoDateString()
): {
  success: boolean;
  alreadyCompleted: boolean;
  awardedXp: number;
  bonusXp: number;
  multiplier: number;
  objective: StoredDailyObjective;
} {
  const current = getStoredDailyObjective(customStorage, todayIso);

  if (current.completed) {
    return {
      success: false,
      alreadyCompleted: true,
      awardedXp: current.awardedXp,
      bonusXp: current.bonusXp,
      multiplier: current.multiplier,
      objective: current,
    };
  }

  const mission = findDailyMissionById(missionId || current.missionId);
  const xpCalculation = applyStreakXpMultiplier(mission.xpReward, streakDays);

  const updated: StoredDailyObjective = {
    dateIso: todayIso,
    missionId: mission.id,
    completed: true,
    completedAtIso: new Date().toISOString(),
    baseXp: mission.xpReward,
    multiplier: xpCalculation.multiplier,
    bonusXp: xpCalculation.bonusXpEarned,
    awardedXp: xpCalculation.finalXp,
    streakDaysAtClaim: streakDays,
  };

  saveStoredDailyObjective(updated, customStorage);

  return {
    success: true,
    alreadyCompleted: false,
    awardedXp: xpCalculation.finalXp,
    bonusXp: xpCalculation.bonusXpEarned,
    multiplier: xpCalculation.multiplier,
    objective: updated,
  };
}
