import { GIFEncoder, applyPalette, quantize } from 'gifenc';
import { DEFAULT_TICK_MS } from '@/constants/panel';
import type { Frame, ImageWindow } from '@/types/matrix';
import type { GifOptions } from '@/types/render';
import { canvasSize, drawBitmap } from './canvas';

export const DEFAULT_GIF: GifOptions = {
  pitch: 20,
  tickMs: DEFAULT_TICK_MS,
  loop: true,
  glow: true,
  showDead: false,
  crop: null,
};

const PALETTE_SAMPLE_BUDGET = 250_000;

const MIN_GIF_DELAY_MS = 10;

export function sampleForPalette(frames: Uint8ClampedArray[]): Uint8ClampedArray {
  const totalPixels = frames.reduce((sum, buffer) => sum + buffer.length / 4, 0);
  const stride = Math.max(1, Math.ceil(totalPixels / PALETTE_SAMPLE_BUDGET));
  if (stride === 1 && frames.length === 1) return frames[0];

  const kept = Math.ceil(totalPixels / stride);
  const out = new Uint8ClampedArray(kept * 4);
  let write = 0;
  let index = 0;
  for (const buffer of frames) {
    for (let p = 0; p < buffer.length; p += 4, index++) {
      if (index % stride !== 0 || write + 4 > out.length) continue;
      out[write++] = buffer[p];
      out[write++] = buffer[p + 1];
      out[write++] = buffer[p + 2];
      out[write++] = buffer[p + 3];
    }
  }
  return write === out.length ? out : out.slice(0, write);
}

export function encodeGifFrames(
  rasters: Uint8ClampedArray[],
  width: number,
  height: number,
  delaysMs: number[],
  loop: boolean,
): Uint8Array {
  if (rasters.length === 0) throw new Error('Nothing to export — the animation has no frames.');

  const palette = quantize(sampleForPalette(rasters), 256, { format: 'rgb565' });
  const encoder = GIFEncoder();

  rasters.forEach((raster, index) => {
    encoder.writeFrame(applyPalette(raster, palette, 'rgb565'), width, height, {
      palette: index === 0 ? palette : undefined,
      delay: Math.max(MIN_GIF_DELAY_MS, delaysMs[index] ?? 100),
      repeat: loop ? 0 : -1,
    });
  });

  encoder.finish();
  return encoder.bytes();
}

function rasterise(
  frames: Frame[],
  pitch: number,
  glow: boolean,
  showDead: boolean,
  crop: ImageWindow | null,
): { rasters: Uint8ClampedArray[]; width: number; height: number } {
  const { width, height } = canvasSize(pitch, crop ? crop.width : undefined);
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new Error('Could not get a 2D canvas context.');

  const rasters = frames.map((frame) => {
    drawBitmap(ctx, frame.bitmap, { pitch, glow, showDead, background: true, crop });
    return ctx.getImageData(0, 0, width, height).data;
  });

  return { rasters, width, height };
}

export async function encodeGif(frames: Frame[], options: Partial<GifOptions> = {}): Promise<Blob> {
  const opts = { ...DEFAULT_GIF, ...options };
  if (frames.length === 0) throw new Error('Nothing to export — the animation has no frames.');

  const { rasters, width, height } = rasterise(
    frames,
    opts.pitch,
    opts.glow,
    opts.showDead,
    opts.crop,
  );

  const bytes = encodeGifFrames(
    rasters,
    width,
    height,
    frames.map((frame) => frame.delay * opts.tickMs),
    opts.loop,
  );
  return new Blob([bytes], { type: 'image/gif' });
}

export async function encodePng(
  frame: Frame,
  pitch = 20,
  crop: ImageWindow | null = null,
): Promise<Blob> {
  const { width, height } = canvasSize(pitch, crop ? crop.width : undefined);
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not get a 2D canvas context.');
  drawBitmap(ctx, frame.bitmap, { pitch, glow: true, showDead: false, background: true, crop });

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('PNG encoding failed.'))),
      'image/png',
    );
  });
}
