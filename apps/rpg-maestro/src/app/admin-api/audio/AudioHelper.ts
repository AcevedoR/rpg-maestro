import ffmpeg from "fluent-ffmpeg";

export async function getTrackDuration(url: URL): Promise<number> {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(url.toString(), (err, metadata) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(metadata.format.duration * 1000);
    });
  });
}
