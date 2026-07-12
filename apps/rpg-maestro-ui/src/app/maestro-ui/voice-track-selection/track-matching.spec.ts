import { describe, expect, it } from 'vitest';
import { Track } from '@rpg-maestro/rpg-maestro-api-contract';
import { collectAvailableTags, pickBestMatchingTrack } from './track-matching';

function makeTrack(id: string, tags: string[]): Track {
  return {
    id,
    sessionId: 'session-1',
    created_at: 0,
    updated_at: 0,
    source: { origin_media: 'file', origin_url: '', origin_name: '' },
    name: id,
    duration: 1000,
    tags,
    url: `https://example.test/${id}.mp3`,
  };
}

describe('pickBestMatchingTrack', () => {
  it('prefers the track with the most overlapping tags', () => {
    const tracks = [
      makeTrack('one-tag', ['combat']),
      makeTrack('two-tags', ['combat', 'dungeon']),
    ];
    const picked = pickBestMatchingTrack(tracks, ['combat', 'dungeon']);
    expect(picked?.id).toBe('two-tags');
  });

  it('returns null when no track shares any requested tag', () => {
    const tracks = [makeTrack('forest', ['forest'])];
    expect(pickBestMatchingTrack(tracks, ['combat'])).toBeNull();
  });

  it('returns null when no tags are requested', () => {
    const tracks = [makeTrack('forest', ['forest'])];
    expect(pickBestMatchingTrack(tracks, [])).toBeNull();
  });

  it('excludes the currently playing track', () => {
    const tracks = [makeTrack('current', ['combat']), makeTrack('other', ['combat'])];
    const picked = pickBestMatchingTrack(tracks, ['combat'], { excludeTrackId: 'current' });
    expect(picked?.id).toBe('other');
  });

  it('matches tags case-insensitively', () => {
    const tracks = [makeTrack('t', ['Combat'])];
    expect(pickBestMatchingTrack(tracks, ['combat'])?.id).toBe('t');
  });

  it('chooses among top-scored tracks using injected randomness', () => {
    const tracks = [makeTrack('a', ['combat']), makeTrack('b', ['combat']), makeTrack('c', ['combat'])];
    expect(pickBestMatchingTrack(tracks, ['combat'], { random: () => 0 })?.id).toBe('a');
    expect(pickBestMatchingTrack(tracks, ['combat'], { random: () => 0.99 })?.id).toBe('c');
  });
});

describe('collectAvailableTags', () => {
  it('returns the sorted, de-duplicated set of tags across tracks', () => {
    const tracks = [makeTrack('a', ['forest', 'combat']), makeTrack('b', ['combat', 'travel'])];
    expect(collectAvailableTags(tracks)).toEqual(['combat', 'forest', 'travel']);
  });

  it('returns an empty array for no tracks', () => {
    expect(collectAvailableTags([])).toEqual([]);
  });
});
