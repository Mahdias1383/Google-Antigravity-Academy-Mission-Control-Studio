export const DEFAULT_ADMIN_POLL_INTERVAL_MS = 60_000;

export interface AdminPollingState {
  isRunning: boolean;
  isPaused: boolean;
  intervalMs: number;
  syncCount: number;
  lastSyncedAtIso: string;
}

export interface AdminPollingController {
  start: () => void;
  stop: () => void;
  triggerNow: () => void;
  setPaused: (paused: boolean) => void;
  getState: () => AdminPollingState;
}

/**
 * Creates a lifecycle-safe polling controller that periodically invokes `onRefreshData`
 * every `intervalMs` (defaults to 60,000ms / 60 seconds) to keep Admin Portal dashboard
 * visualizations and audit logs synchronized without user intervention.
 */
export function createAdminPollingController(options: {
  onRefreshData: () => void;
  onStateChange?: (state: AdminPollingState) => void;
  intervalMs?: number;
}): AdminPollingController {
  const intervalMs = options.intervalMs ?? DEFAULT_ADMIN_POLL_INTERVAL_MS;
  let timerId: ReturnType<typeof setInterval> | null = null;

  const state: AdminPollingState = {
    isRunning: false,
    isPaused: false,
    intervalMs,
    syncCount: 0,
    lastSyncedAtIso: new Date().toISOString(),
  };

  const notify = () => {
    if (options.onStateChange) {
      options.onStateChange({ ...state });
    }
  };

  const executePoll = () => {
    if (state.isPaused) return;
    state.syncCount += 1;
    state.lastSyncedAtIso = new Date().toISOString();
    options.onRefreshData();
    notify();
  };

  const start = () => {
    if (timerId !== null) {
      clearInterval(timerId);
    }
    state.isRunning = true;
    timerId = setInterval(executePoll, state.intervalMs);
    notify();
  };

  const stop = () => {
    if (timerId !== null) {
      clearInterval(timerId);
      timerId = null;
    }
    state.isRunning = false;
    notify();
  };

  const triggerNow = () => {
    state.syncCount += 1;
    state.lastSyncedAtIso = new Date().toISOString();
    options.onRefreshData();
    // Reset interval timer so next automatic poll is a full 60s from now
    if (state.isRunning && timerId !== null) {
      clearInterval(timerId);
      timerId = setInterval(executePoll, state.intervalMs);
    }
    notify();
  };

  const setPaused = (paused: boolean) => {
    state.isPaused = paused;
    notify();
  };

  const getState = (): AdminPollingState => ({ ...state });

  return {
    start,
    stop,
    triggerNow,
    setPaused,
    getState,
  };
}
