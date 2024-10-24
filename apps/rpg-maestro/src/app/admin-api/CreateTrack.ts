import { TrackCreation } from '../model/TrackCreation';
import { Track } from '../model/Track';
import { v4 as uuid } from 'uuid';

export function createTrack(trackCreation: TrackCreation): Track {
  const now = Date.now();
  return {
    id: uuid(),
    created_at:now,
    updated_at:now,

    source: {
      origin_media: 'same-server',
      origin_url: trackCreation.url,
      origin_name: trackCreation.url,
    },

    name: trackCreation.url,
    url: trackCreation.url,
    length: 0,
    tags: trackCreation.tags
  };
}
