import { PlayingTrack } from '@rpg-maestro/rpg-maestro-api-contract';
import { InMemoryTracksDatabase } from './InMemoryTracksDatabase';

function aTrack(id: string): PlayingTrack {
  return new PlayingTrack(id, id, `url-${id}`, 120000, false, 1730000000000, 0);
}

describe('InMemoryTracksDatabase revisions', () => {
  it('starts a created session at revision 0', async () => {
    const db = new InMemoryTracksDatabase();
    await db.createSession('s1');

    expect((await db.getSession('s1'))?.revision).toBe(0);
  });

  it('bumps the session revision on every write', async () => {
    const db = new InMemoryTracksDatabase();
    await db.createSession('s1');

    expect((await db.upsertCurrentTrack('s1', aTrack('t1'))).revision).toBe(1);
    expect((await db.upsertCurrentTrack('s1', aTrack('t2'))).revision).toBe(2);
    expect((await db.upsertShortEffectTrack('s1', aTrack('fx1'))).revision).toBe(3);
  });

  it('stamps the new revision onto the track it wrote', async () => {
    const db = new InMemoryTracksDatabase();
    await db.createSession('s1');

    const session = await db.upsertCurrentTrack('s1', aTrack('t1'));

    expect(session.currentTrack?.revision).toBe(session.revision);
  });

  /**
   * The reason revisions are per-track and not just per-session: players decide whether to reseek the music
   * by comparing currentTrack.revision. If a sound effect bumped it, every effect would yank the music's
   * playhead for every listener.
   */
  it('leaves the current track revision alone when only a short effect is played', async () => {
    const db = new InMemoryTracksDatabase();
    await db.createSession('s1');
    const afterMusic = await db.upsertCurrentTrack('s1', aTrack('t1'));
    const musicRevision = afterMusic.currentTrack?.revision;

    const afterEffect = await db.upsertShortEffectTrack('s1', aTrack('fx1'));

    expect(afterEffect.currentTrack?.revision).toBe(musicRevision);
    expect(afterEffect.shortEffectTrack?.revision).toBe(afterEffect.revision);
    expect(afterEffect.revision).not.toBe(musicRevision);
  });

  it('replaying the same effect changes its revision, so a repeat is not swallowed', async () => {
    const db = new InMemoryTracksDatabase();
    await db.createSession('s1');

    const first = await db.upsertShortEffectTrack('s1', aTrack('fx1'));
    const second = await db.upsertShortEffectTrack('s1', aTrack('fx1'));

    expect(second.shortEffectTrack?.revision).not.toBe(first.shortEffectTrack?.revision);
  });

  it('upserting into a session that was never created still produces a usable revision', async () => {
    const db = new InMemoryTracksDatabase();

    const session = await db.upsertCurrentTrack('never-created', aTrack('t1'));

    expect(session.revision).toBe(1);
    expect(session.currentTrack?.revision).toBe(1);
  });
});
