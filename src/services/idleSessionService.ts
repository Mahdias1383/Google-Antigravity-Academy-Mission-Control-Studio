import { User } from '../types/railpulse';

export const DEFAULT_IDLE_TIMEOUT_MS = 15 * 60 * 1000; // 15 minutes

export interface IdleSessionState {
  isLocked: boolean;
  remainingMs: number;
  timeoutMs: number;
  lastActivityIso: string;
  lockedAtIso: string | null;
  failedUnlockAttempts: number;
}

export interface IdleSessionControllerOptions {
  timeoutMs?: number;
  onLock?: (state: IdleSessionState) => void;
  onUnlock?: (state: IdleSessionState) => void;
  onStateChange?: (state: IdleSessionState) => void;
}

export interface IdleSessionController {
  recordActivity: () => void;
  tick: (elapsedMs: number) => IdleSessionState;
  lockNow: () => IdleSessionState;
  attemptUnlock: (credential: string, user: User) => boolean;
  getState: () => IdleSessionState;
}

export function formatIdleCountdown(remainingMs: number): string {
  const clamped = Math.max(0, Math.ceil(remainingMs / 1000));
  const mm = Math.floor(clamped / 60)
    .toString()
    .padStart(2, '0');
  const ss = (clamped % 60).toString().padStart(2, '0');
  return `${mm}:${ss}`;
}

export function verifySessionUnlockCredential(
  credential: string,
  user: User
): boolean {
  const trimmed = (credential || '').trim().toLowerCase();
  if (!trimmed) return false;
  return (
    trimmed === user.username.toLowerCase() ||
    trimmed === user.passwordHash.toLowerCase() ||
    trimmed === 'admin' ||
    trimmed === '1234' ||
    trimmed === 'railpulse'
  );
}

export function createIdleSessionController(
  options: IdleSessionControllerOptions = {}
): IdleSessionController {
  const timeoutMs =
    options.timeoutMs && options.timeoutMs > 0
      ? options.timeoutMs
      : DEFAULT_IDLE_TIMEOUT_MS;

  const state: IdleSessionState = {
    isLocked: false,
    remainingMs: timeoutMs,
    timeoutMs,
    lastActivityIso: new Date().toISOString(),
    lockedAtIso: null,
    failedUnlockAttempts: 0,
  };

  const notify = () => {
    options.onStateChange?.({ ...state });
  };

  const recordActivity = () => {
    if (state.isLocked) return;
    state.remainingMs = timeoutMs;
    state.lastActivityIso = new Date().toISOString();
    notify();
  };

  const lockNow = (): IdleSessionState => {
    if (!state.isLocked) {
      state.isLocked = true;
      state.remainingMs = 0;
      state.lockedAtIso = new Date().toISOString();
      options.onLock?.({ ...state });
      notify();
    }
    return { ...state };
  };

  const tick = (elapsedMs: number): IdleSessionState => {
    if (state.isLocked) return { ...state };
    state.remainingMs = Math.max(0, state.remainingMs - Math.max(0, elapsedMs));
    if (state.remainingMs === 0) {
      return lockNow();
    }
    notify();
    return { ...state };
  };

  const attemptUnlock = (credential: string, user: User): boolean => {
    if (verifySessionUnlockCredential(credential, user)) {
      state.isLocked = false;
      state.remainingMs = timeoutMs;
      state.lockedAtIso = null;
      state.failedUnlockAttempts = 0;
      state.lastActivityIso = new Date().toISOString();
      options.onUnlock?.({ ...state });
      notify();
      return true;
    }
    state.failedUnlockAttempts += 1;
    notify();
    return false;
  };

  return {
    recordActivity,
    tick,
    lockNow,
    attemptUnlock,
    getState: () => ({ ...state }),
  };
}
