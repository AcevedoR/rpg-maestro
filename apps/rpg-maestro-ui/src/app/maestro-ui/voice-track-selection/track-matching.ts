import { Tag, Track } from '@rpg-maestro/rpg-maestro-api-contract';

export interface PickBestMatchingTrackOptions {
  /** Track to exclude from selection (typically the currently playing one). */
  excludeTrackId?: string;
  /** Injectable randomness for deterministic tests. Defaults to Math.random. */
  random?: () => number;
}

/**
 * Picks a single track that matches the requested tags "as best as possible":
 * each candidate is scored by how many of its tags overlap the requested tags
 * (case-insensitive), and one track is chosen at random among the highest scorers.
 *
 * Returns null when no track shares any tag with the request.
 */
export function pickBestMatchingTrack(
  tracks: Track[],
  tags: Tag[],
  options: PickBestMatchingTrackOptions = {}
): Track | null {
  const { excludeTrackId, random = Math.random } = options;
  const requested = new Set(tags.map((tag) => tag.toLowerCase()));
  if (requested.size === 0) {
    return null;
  }

  let bestScore = 0;
  let bestTracks: Track[] = [];
  for (const track of tracks) {
    if (track.id === excludeTrackId) {
      continue;
    }
    const score = track.tags.reduce((count, tag) => (requested.has(tag.toLowerCase()) ? count + 1 : count), 0);
    if (score === 0) {
      continue;
    }
    if (score > bestScore) {
      bestScore = score;
      bestTracks = [track];
    } else if (score === bestScore) {
      bestTracks.push(track);
    }
  }

  if (bestTracks.length === 0) {
    return null;
  }
  const index = Math.floor(random() * bestTracks.length);
  return bestTracks[index];
}

/** Collects the unique set of tags used across the given tracks, sorted for stability. */
export function collectAvailableTags(tracks: Track[]): Tag[] {
  const tags = new Set<Tag>();
  for (const track of tracks) {
    for (const tag of track.tags) {
      tags.add(tag);
    }
  }
  return [...tags].sort((a, b) => a.localeCompare(b));
}
