import { chmodSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { UploadFromYoutubeJob } from './UploadFromYoutubeJob';
import { UploadFromYoutubeJobsStore } from './upload-from-youtube-jobs-store';
import { UploadFromYoutubeService } from './UploadFromYoutubeService';

// uploadAudioFromYoutube is fire-and-forget: poll the store until the job leaves 'running'
async function waitForSettledJob(store: UploadFromYoutubeJobsStore): Promise<UploadFromYoutubeJob> {
  for (let i = 0; i < 100; i++) {
    const jobs = await store.getAll();
    if (jobs.length > 0 && jobs[0].status !== 'running') {
      return jobs[0];
    }
    await new Promise((resolve) => setTimeout(resolve, 20));
  }
  throw new Error('job never settled');
}

describe('UploadFromYoutubeService', () => {
  let store: UploadFromYoutubeJobsStore;
  let service: UploadFromYoutubeService;
  let stubDir: string;

  beforeEach(() => {
    store = new UploadFromYoutubeJobsStore();
    service = new UploadFromYoutubeService(store);
    stubDir = mkdtempSync(join(tmpdir(), 'ytdlp-stub-'));
  });

  afterEach(() => {
    delete process.env.YTDLP_PATH;
    rmSync(stubDir, { recursive: true, force: true });
  });

  function stubYtdlp(script: string): void {
    const stubPath = join(stubDir, 'yt-dlp');
    writeFileSync(stubPath, `#!/bin/sh\n${script}\n`);
    chmodSync(stubPath, 0o755);
    process.env.YTDLP_PATH = stubPath;
  }

  it('should fail the job on a non-youtube URL without calling yt-dlp', async () => {
    stubYtdlp('echo "should not be called" >&2; exit 1');
    await service.uploadAudioFromYoutube({ urls: ['https://example.com/watch?v=abc'] });

    const job = await waitForSettledJob(store);
    expect(job.status).toEqual('failed');
    expect(job.error).toContain('invalid youtube URL');
  });

  it('should fail the job on a malformed URL', async () => {
    await service.uploadAudioFromYoutube({ urls: ['not-a-url'] });

    const job = await waitForSettledJob(store);
    expect(job.status).toEqual('failed');
    expect(job.error).toContain('invalid youtube URL');
  });

  it('should succeed with the file yt-dlp reports and build the public link', async () => {
    stubYtdlp('echo "/some/fileserver/uploads/My_Epic_Track.mp3"');
    await service.uploadAudioFromYoutube({ urls: ['https://www.youtube.com/watch?v=vyg5jJrZ42s'] });

    const job = await waitForSettledJob(store);
    expect(job.status).toEqual('success');
    expect(job.uploadedFile).toEqual('My_Epic_Track.mp3');
    expect(job.uploadedFileLink).toContain('/uploads/My_Epic_Track.mp3');
  });

  it('should accept youtu.be short URLs', async () => {
    stubYtdlp('echo "/some/fileserver/uploads/Short_Link_Track.mp3"');
    await service.uploadAudioFromYoutube({ urls: ['https://youtu.be/vyg5jJrZ42s'] });

    const job = await waitForSettledJob(store);
    expect(job.status).toEqual('success');
  });

  it('should fail the job with yt-dlp stderr when the download fails', async () => {
    stubYtdlp('echo "ERROR: Video unavailable" >&2; exit 1');
    await service.uploadAudioFromYoutube({ urls: ['https://www.youtube.com/watch?v=gone'] });

    const job = await waitForSettledJob(store);
    expect(job.status).toEqual('failed');
    expect(job.error).toContain('Video unavailable');
  });

  it('should fail the job when the yt-dlp binary is missing', async () => {
    process.env.YTDLP_PATH = join(stubDir, 'does-not-exist');
    await service.uploadAudioFromYoutube({ urls: ['https://www.youtube.com/watch?v=abc'] });

    const job = await waitForSettledJob(store);
    expect(job.status).toEqual('failed');
    expect(job.error).toContain('could not run yt-dlp');
  });
});
