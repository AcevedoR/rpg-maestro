import { TrackCreation } from '../model/TrackCreation';
import { Track } from '../model/Track';
import { v4 as uuid } from 'uuid';

export async function createTrack(trackCreation: TrackCreation): Promise<Track> {
  const now = Date.now();
  await checkFileIfActuallyUsable(trackCreation.url);

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

async function checkFileIfActuallyUsable(url: string){
  const response = await fetch(url);
  if(!response.ok || response.status != 200){
    const shortError = `httpStatus: ${response.status}, statusText: ${response.statusText}`;
    console.log(`checkFileIfActuallyUsable failed with error: ${shortError}`, response);
    throw new Error(`Cannot create track, file not reachable, fetch error: ${shortError}, full error: ${await response.text()}`);
  }
}