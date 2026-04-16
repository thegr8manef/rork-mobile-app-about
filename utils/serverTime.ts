/**
 * serverTime.ts
 *
 * Keeps a running offset between the server clock and the device clock.
 * Every API response that includes a `Date` header updates the offset.
 *
 * Usage:
 *   import { serverNow } from "@/utils/serverTime";
 *   const today = serverNow();   // reliable "now", not the phone's clock
 */

let _offsetMs = 0; // server time - device time

/**
 * Called by the axios interceptor on every successful response.
 * Parses the HTTP `Date` response header and stores the drift.
 */
export function syncServerTime(dateHeader: string | undefined) {
  if (!dateHeader) return;
  const serverTs = Date.parse(dateHeader);
  if (!isNaN(serverTs)) {
    _offsetMs = serverTs - Date.now();
  }
}

/**
 * Returns the current time corrected by the server offset.
 * Falls back to the device clock if no server response has been seen yet.
 */
export function serverNow(): Date {
  return new Date(Date.now() + _offsetMs);
}
