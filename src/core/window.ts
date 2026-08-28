import { LONG, SHORT } from '@/constants/panel';
import type { Frame, ImageWindow } from '@/types/matrix';
import { inMask } from './geometry';

export function clampWindow(window: Partial<ImageWindow>): ImageWindow {
  const width = Math.max(1, Math.min(LONG, Math.round(window.width ?? LONG) || LONG));
  const origin = Math.max(0, Math.min(LONG - width, Math.round(window.origin ?? 0) || 0));
  return { origin, width };
}

export function windowEnd(window: ImageWindow): number {
  return window.origin + window.width - 1;
}

export function inWindow(y: number, window: ImageWindow): boolean {
  return y >= window.origin && y <= windowEnd(window);
}

export function isFullPanel(window: ImageWindow): boolean {
  return window.origin === 0 && window.width === LONG;
}

export function contentBounds(frames: Frame[]): ImageWindow | null {
  let low = LONG;
  let high = -1;
  for (const frame of frames) {
    for (let y = 0; y < LONG; y++) {
      for (let x = 0; x < SHORT; x++) {
        if (!inMask(x, y) || frame.bitmap[y][x] === 0) continue;
        if (y < low) low = y;
        if (y > high) high = y;
        break;
      }
    }
  }
  if (high < 0) return null;
  return { origin: low, width: high - low + 1 };
}

export function countOutsideWindow(frames: Frame[], window: ImageWindow): number {
  let count = 0;
  for (const frame of frames) {
    for (let y = 0; y < LONG; y++) {
      if (inWindow(y, window)) continue;
      for (let x = 0; x < SHORT; x++) {
        if (inMask(x, y) && frame.bitmap[y][x] !== 0) count++;
      }
    }
  }
  return count;
}
