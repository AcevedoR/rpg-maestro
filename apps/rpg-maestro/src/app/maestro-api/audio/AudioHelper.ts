import ffmpeg from 'fluent-ffmpeg';

// ffprobe reports the duration in (possibly fractional) seconds. Tracks store the duration as an
// integer number of milliseconds, so round to avoid values like 50717.210999999996 that would leak
// floating-point noise into playback sync calculations.
export function toDurationInMs(durationInSeconds: number): number {
  return Math.round(durationInSeconds * 1000);
}

export async function getTrackDuration(url: URL): Promise<number> {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(url.toString(), (err, metadata) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(toDurationInMs(metadata.format.duration));
    });
  });
}
