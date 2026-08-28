import { FULL_WINDOW, LONG, SHORT } from '@/constants/panel';
import type { Bitmap, ImageWindow } from '@/types/matrix';
import { blankBitmap } from './frame';
import { inMask } from './geometry';
import { inWindow, windowEnd } from './window';

function outsideWindow(bitmap: Bitmap, window: ImageWindow): Bitmap {
  const out = blankBitmap();
  for (let y = 0; y < LONG; y++) {
    if (!inWindow(y, window)) out[y] = bitmap[y].slice();
  }
  return out;
}

export function shifted(
  bitmap: Bitmap,
  dx: number,
  dy: number,
  wrap = false,
  window: ImageWindow = FULL_WINDOW,
): Bitmap {
  const out = outsideWindow(bitmap, window);
  for (let y = window.origin; y <= windowEnd(window); y++) {
    for (let x = 0; x < SHORT; x++) {
      const level = bitmap[y][x];
      if (level === 0) continue;
      let ty = y + dy;
      let tx = x + dx;
      if (wrap) {
        ty = window.origin + ((((ty - window.origin) % window.width) + window.width) % window.width);
        tx = ((tx % SHORT) + SHORT) % SHORT;
      }
      if (inMask(tx, ty) && inWindow(ty, window)) out[ty][tx] = level;
    }
  }
  return out;
}

export function mirrored(bitmap: Bitmap, window: ImageWindow = FULL_WINDOW): Bitmap {
  const out = outsideWindow(bitmap, window);
  for (let y = window.origin; y <= windowEnd(window); y++) {
    for (let x = 0; x < SHORT; x++) {
      const tx = SHORT - 1 - x;
      if (inMask(tx, y)) out[y][tx] = bitmap[y][x];
    }
  }
  return out;
}

export function flipped(bitmap: Bitmap, window: ImageWindow = FULL_WINDOW): Bitmap {
  const out = outsideWindow(bitmap, window);
  const last = windowEnd(window);
  for (let y = window.origin; y <= last; y++) {
    const ty = window.origin + (last - y);
    for (let x = 0; x < SHORT; x++) {
      if (inMask(x, ty)) out[ty][x] = bitmap[y][x];
    }
  }
  return out;
}
