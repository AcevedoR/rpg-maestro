/**
 * A clock shared by every instance of the app, used to correct the local wall clock.
 *
 * Playback positions are reconstructed from `PlayingTrack.playTimestamp`, so that timestamp must
 * mean the same thing whichever pod stamped it. `Date.now()` does not qualify: two pods drift apart
 * by whatever their hosts' NTP daemons allow, and that drift lands straight on the playhead every
 * listener computes.
 */
export interface TimeReference {
  /** Used in logs only. */
  readonly name: string;

  /** Epoch ms according to the reference, read at the moment of the call. */
  read(): Promise<number>;

  close(): Promise<void>;
}
