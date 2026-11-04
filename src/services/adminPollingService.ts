export const DEFAULT_ADMIN_POLL_INTERVAL_MS = 60_000;

export interface AdminPollingState {
  isRunning: boolean;
  isPaused: boolean;
  intervalMs: number;
  syncCount: number;
  lastSyncedAtIso: string;
}

export interface AdminPollingOptions {
  intervalMs?: number;
  onRefreshData: () => void;
  onStateChange?: (state: AdminPollingState) => void;
}

export interface AdminPollingController {
  start: () => void;
  stop: () => void;
  setPaused: (paused: boolean) => void;
  triggerNow: () => void;
  getState: () => AdminPollingState;
}

export function createAdminPollingController(
  options: AdminPollingOptions
): AdminPollingController {
  const intervalMs =
    options.intervalMs && options.intervalMs > 0
      ? options.intervalMs
      : DEFAULT_ADMIN_POLL_INTERVAL_MS;

  let timerId: ReturnType<typeof setInterval> | null = null;
  const state: AdminPollingState = {
    isRunning: false,
    isPaused: false,
    intervalMs,
    syncCount: 0,
    lastSyncedAtIso: new Date().toISOString(),
  };

  const notify = () => {
    options.onStateChange?.({ ...state });
  };

  const executeTick = () => {
    state.syncCount += 1;
    state.lastSyncedAtIso = new Date().toISOString();
    options.onRefreshData();
    notify();
  };

  const start = () => {
    if (timerId) clearInterval(timerId);
    state.isRunning = true;
    timerId = setInterval(() => {
      if (!state.isPaused) {
        executeTick();
      }
    }, state.intervalMs);
    notify();
  };

  const stop = () => {
    if (timerId) {
      clearInterval(timerId);
      timerId = null;
    }
    state.isRunning = false;
    notify();
  };

  const setPaused = (paused: boolean) => {
    state.isPaused = paused;
    notify();
  };

  const triggerNow = () => {
    executeTick();
  };

  return {
    start,
    stop,
    setPaused,
    triggerNow,
    getState: () => ({ ...state }),
  };
}
