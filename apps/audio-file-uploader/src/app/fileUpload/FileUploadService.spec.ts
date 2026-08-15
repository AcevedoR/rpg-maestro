import { BadRequestException } from '@nestjs/common';
import ffmpeg from 'fluent-ffmpeg';
import { promises as fs } from 'fs';
import { beforeEach, describe, expect, it, Mock, vi } from 'vitest';
import { FileUploadService, MAX_UPLOAD_SIZE_BYTES } from './FileUploadService';

type Handler = (...args: unknown[]) => void;

interface FfmpegMockState {
  handlers: Record<string, Handler>;
  failWith?: Error;
}

vi.mock('fluent-ffmpeg', () => {
  const mockState: FfmpegMockState = { handlers: {} };
  const chain: Record<string, Mock> = {};
  for (const method of ['noVideo', 'audioCodec', 'audioBitrate', 'format']) {
    chain[method] = vi.fn(() => chain);
  }
  chain.on = vi.fn((event: string, cb: Handler) => {
    mockState.handlers[event] = cb;
    return chain;
  });
  chain.save = vi.fn(() => {
    setImmediate(() =>
      mockState.failWith ? mockState.handlers['error']?.(mockState.failWith) : mockState.handlers['end']?.()
    );
    return chain;
  });
  return { default: Object.assign(vi.fn(() => chain), { ffprobe: vi.fn(), __mockState: mockState, __chain: chain }) };
});

vi.mock('fs', async (importOriginal) => ({
  ...(await importOriginal<typeof import('fs')>()),
  promises: {
    unlink: vi.fn().mockResolvedValue(undefined),
    rename: vi.fn().mockResolvedValue(undefined),
    stat: vi.fn().mockResolvedValue({ size: 4 * 1024 * 1024 }),
  },
}));

const ffmpegMock = ffmpeg as unknown as Mock & {
  ffprobe: Mock;
  __mockState: FfmpegMockState;
  __chain: Record<string, Mock>;
};

function multerFile(overrides: Partial<Express.Multer.File>): Express.Multer.File {
  return {
    fieldname: 'file',
    originalname: 'song.mp3',
    filename: 'song.mp3',
    path: '/uploads/song.mp3',
    mimetype: 'audio/mpeg',
    size: 5 * 1024 * 1024,
    ...overrides,
  } as Express.Multer.File;
}

function mockProbeResult(formatName: string, bitrate: number | undefined): void {
  ffmpegMock.ffprobe.mockImplementation((_path: string, cb: (err: Error | null, data: unknown) => void) =>
    cb(null, { format: { format_name: formatName, bit_rate: bitrate } })
  );
}

describe('FileUploadService', () => {
  let service: FileUploadService;

  beforeEach(() => {
    vi.clearAllMocks();
    ffmpegMock.__mockState.handlers = {};
    ffmpegMock.__mockState.failWith = undefined;
    service = new FileUploadService();
  });

  it('rejects when no file was uploaded', async () => {
    await expect(service.handleFileUpload(undefined as unknown as Express.Multer.File)).rejects.toThrow(
      BadRequestException
    );
  });

  it('rejects non-audio mime types and deletes the stored file', async () => {
    const file = multerFile({ mimetype: 'application/pdf', filename: 'doc.pdf', path: '/uploads/doc.pdf' });
    await expect(service.handleFileUpload(file)).rejects.toThrow('invalid file type: application/pdf');
    expect(fs.unlink).toHaveBeenCalledWith('/uploads/doc.pdf');
    expect(ffmpegMock).not.toHaveBeenCalled();
  });

  it('rejects files over the size cap and deletes the stored file', async () => {
    const file = multerFile({ size: MAX_UPLOAD_SIZE_BYTES + 1 });
    await expect(service.handleFileUpload(file)).rejects.toThrow('file is too large!');
    expect(fs.unlink).toHaveBeenCalledWith('/uploads/song.mp3');
  });

  it('stores an mp3 already at or below 160kbps as-is, without transcoding', async () => {
    mockProbeResult('mp3', 128000);
    const result = await service.handleFileUpload(multerFile({}));
    expect(result.fileURL).toMatch(/\/uploads\/song\.mp3$/);
    expect(ffmpegMock).not.toHaveBeenCalled();
    expect(fs.unlink).not.toHaveBeenCalled();
  });

  it('transcodes a wav to a 128kbps mp3 and deletes the original', async () => {
    mockProbeResult('wav', 1411000);
    const file = multerFile({ mimetype: 'audio/wav', filename: 'song.wav', path: '/uploads/song.wav' });
    const result = await service.handleFileUpload(file);
    expect(ffmpegMock).toHaveBeenCalledWith('/uploads/song.wav');
    expect(ffmpegMock.__chain.audioBitrate).toHaveBeenCalledWith(128);
    expect(ffmpegMock.__chain.save).toHaveBeenCalledWith('/uploads/song.mp3');
    expect(fs.unlink).toHaveBeenCalledWith('/uploads/song.wav');
    expect(result.fileURL).toMatch(/\/uploads\/song\.mp3$/);
  });

  it('re-encodes a high-bitrate mp3 through a temp file onto its own name', async () => {
    mockProbeResult('mp3', 320000);
    const result = await service.handleFileUpload(multerFile({}));
    expect(ffmpegMock.__chain.save).toHaveBeenCalledWith('/uploads/song.mp3.transcoding.mp3');
    expect(fs.rename).toHaveBeenCalledWith('/uploads/song.mp3.transcoding.mp3', '/uploads/song.mp3');
    expect(result.fileURL).toMatch(/\/uploads\/song\.mp3$/);
  });

  it('rejects and cleans up when transcoding fails (file is not actually audio)', async () => {
    mockProbeResult('wav', undefined);
    ffmpegMock.__mockState.failWith = new Error('Invalid data found when processing input');
    const file = multerFile({ mimetype: 'audio/wav', filename: 'fake.wav', path: '/uploads/fake.wav' });
    await expect(service.handleFileUpload(file)).rejects.toThrow('file could not be processed as audio');
    expect(fs.unlink).toHaveBeenCalledWith('/uploads/fake.wav');
    expect(fs.unlink).toHaveBeenCalledWith('/uploads/fake.mp3');
  });

  it('transcodes when ffprobe cannot read the file', async () => {
    ffmpegMock.ffprobe.mockImplementation((_path: string, cb: (err: Error | null, data: unknown) => void) =>
      cb(new Error('probe failed'), undefined)
    );
    const file = multerFile({ mimetype: 'audio/flac', filename: 'song.flac', path: '/uploads/song.flac' });
    const result = await service.handleFileUpload(file);
    expect(ffmpegMock.__chain.save).toHaveBeenCalledWith('/uploads/song.mp3');
    expect(result.fileURL).toMatch(/\/uploads\/song\.mp3$/);
  });
});
