import ffmpeg from "fluent-ffmpeg";
import { path as ffprobePath } from "@ffprobe-installer/ffprobe";

ffmpeg.setFfprobePath(ffprobePath);

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
