import { TrackCreation } from "../model/TrackCreation";
import { Track } from "../model/Track";
import { v4 as uuid } from "uuid";
import path from "path";

export async function createTrack(
  trackCreation: TrackCreation
): Promise<Track> {
  const now = Date.now();

  const fileName = getFileName(trackCreation.url);
  await checkFileIfActuallyUsable(trackCreation.url);

  // TODO get length
  // https://stackoverflow.com/questions/72043194/how-to-fetch-time-duration-of-an-audio-file-from-database-using-nodejs
  // https://stackoverflow.com/questions/50503460/get-duration-of-remote-mp3-file-without-full-download
  //

  return {
    id: uuid(),
    created_at: now,
    updated_at: now,

    source: {
      origin_media: "same-server",
      origin_url: trackCreation.url,
      origin_name: fileName,
    },

    name: fileName,
    url: trackCreation.url,
    length: 0,
    tags: trackCreation.tags,
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

function getFileName(fileUrl: string) {
  const fileFullName = new URL(fileUrl).pathname;
  const extension = path.extname(fileFullName);
  return path.basename(fileFullName, extension);
}
