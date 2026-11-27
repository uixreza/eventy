const LIVE_BUS_KEY = "__koojaLiveBus";

/**
 * A tiny in-process fan-out bus shared by the custom WebSocket server and the
 * bundled Next server actions.
 *
 * Both halves run in the same Node process, but Next can bundle its own copy
 * of this module. Keeping the listener set on `globalThis` means every copy
 * sees the same bus, so a mutation in a server action reaches the upgrade
 * handler without a second server or a polling loop.
 */
export function getLiveBus() {
  if (!globalThis[LIVE_BUS_KEY]) {
    globalThis[LIVE_BUS_KEY] = { listeners: new Set() };
  }
  return globalThis[LIVE_BUS_KEY];
}
