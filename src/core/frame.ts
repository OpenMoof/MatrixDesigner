import {
  DEFAULT_DELAY,
  FULL_WINDOW,
  LONG,
  MAX_DELAY,
  MAX_LEVEL,
  MIN_DELAY,
  SHORT,
} from '@/constants/panel';
import type { Bitmap, Frame, ImageWindow, Level } from '@/types/matrix';
import { inMask } from './geometry';
import { windowEnd } from './window';

export function blankBitmap(): Bitmap {
  return Array.from({ length: LONG }, () => new Array<Level>(SHORT).fill(0));
}

export function cloneBitmap(bitmap: Bitmap): Bitmap {
  return bitmap.map((row) => row.slice());
}

export function blankFrame(delay = DEFAULT_DELAY): Frame {
  return { bitmap: blankBitmap(), delay };
}

export function cloneFrame(frame: Frame): Frame {
  return { bitmap: cloneBitmap(frame.bitmap), delay: frame.delay };
}

export function clampDelay(value: number): number {
  if (!Number.isFinite(value)) return DEFAULT_DELAY;
  return Math.max(MIN_DELAY, Math.min(MAX_DELAY, Math.round(value)));
}

export function clampLevel(value: number): Level {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(MAX_LEVEL, Math.round(value))) as Level;
}

export function isBlank(bitmap: Bitmap): boolean {
  for (let y = 0; y < LONG; y++) {
    for (let x = 0; x < SHORT; x++) {
      if (inMask(x, y) && bitmap[y][x] !== 0) return false;
    }
  }
  return true;
}

export function countLit(bitmap: Bitmap): number {
  let lit = 0;
  for (let y = 0; y < LONG; y++) {
    for (let x = 0; x < SHORT; x++) {
      if (inMask(x, y) && bitmap[y][x] > 0) lit++;
    }
  }
  return lit;
}

export function mapMasked(
  bitmap: Bitmap,
  fn: (level: Level, x: number, y: number) => Level,
  window: ImageWindow = FULL_WINDOW,
): void {
  for (let y = window.origin; y <= windowEnd(window); y++) {
    for (let x = 0; x < SHORT; x++) {
      if (inMask(x, y)) bitmap[y][x] = fn(bitmap[y][x], x, y);
    }
  }
}
