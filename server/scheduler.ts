/**
 * Optional periodic refresh scheduler. Disabled by default.
 * Enabled/disabled via store settings (autoRefreshIntervalHours = 0 means off).
 */
import { store } from "./store";

type RefreshFn = () => Promise<void>;

let timer: NodeJS.Timeout | null = null;
let lastAutoRefreshAt: string | null = null;

export function getLastAutoRefreshAt(): string | null {
  return lastAutoRefreshAt;
}

export function startScheduler(refreshFn: RefreshFn): void {
  reschedule(refreshFn);
}

export function reschedule(refreshFn: RefreshFn): void {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }

  const intervalHours = store.getAutoRefreshInterval();
  if (!intervalHours || intervalHours <= 0) return;

  const ms = intervalHours * 60 * 60 * 1000;
  timer = setInterval(async () => {
    try {
      await refreshFn();
      lastAutoRefreshAt = new Date().toISOString();
    } catch {
      // Scheduler errors are non-fatal
    }
  }, ms);
}
