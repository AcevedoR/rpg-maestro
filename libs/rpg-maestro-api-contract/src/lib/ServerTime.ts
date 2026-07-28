/**
 * The server's own clock, as read when the request was handled.
 *
 * Clients need this because `PlayingTrack.playTimestamp` is expressed on the server clock, and a
 * browser's `Date.now()` is routinely seconds away from it. Reconstructing a playhead by mixing the
 * two makes every listener sit at a different position in the track.
 */
export interface ServerTime {
  /** Epoch ms on the server clock. */
  serverTime: number;
}
