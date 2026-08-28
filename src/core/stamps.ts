import { FULL_WINDOW, SHORT } from '@/constants/panel';
import type { Bitmap, ImageWindow, Level } from '@/types/matrix';
import { inMask } from './geometry';
import { inWindow } from './window';

const DIGITS: readonly (readonly number[])[] = [
  [0x0e, 0x11, 0x13, 0x15, 0x19, 0x11, 0x0e],
  [0x04, 0x0c, 0x04, 0x04, 0x04, 0x04, 0x0e],
  [0x0e, 0x11, 0x01, 0x02, 0x04, 0x08, 0x1f],
  [0x1f, 0x02, 0x04, 0x02, 0x01, 0x11, 0x0e],
  [0x02, 0x06, 0x0a, 0x12, 0x1f, 0x02, 0x02],
  [0x1f, 0x10, 0x1e, 0x01, 0x01, 0x11, 0x0e],
  [0x06, 0x08, 0x10, 0x1e, 0x11, 0x11, 0x0e],
  [0x1f, 0x01, 0x02, 0x04, 0x08, 0x08, 0x08],
  [0x0e, 0x11, 0x11, 0x0e, 0x11, 0x11, 0x0e],
  [0x0e, 0x11, 0x11, 0x0f, 0x01, 0x02, 0x0c],
];

const GLYPH_W = 5;
const GLYPH_H = 7;
const GLYPH_GAP = 2;

export function stampHeight(digitCount: number): number {
  return digitCount > 1 ? GLYPH_H * 2 + GLYPH_GAP : GLYPH_H;
}

export function blitDigit(
  bitmap: Bitmap,
  digit: number,
  baseX: number,
  baseY: number,
  level: Level,
  window: ImageWindow = FULL_WINDOW,
): void {
  const glyph = DIGITS[digit];
  if (!glyph) return;
  for (let gy = 0; gy < GLYPH_H; gy++) {
    const y = baseY + (GLYPH_H - 1 - gy);
    for (let gx = 0; gx < GLYPH_W; gx++) {
      if (glyph[gy] & (1 << (GLYPH_W - 1 - gx))) {
        const x = baseX + gx;
        if (inMask(x, y) && inWindow(y, window)) bitmap[y][x] = level;
      }
    }
  }
}

export function stampNumber(
  bitmap: Bitmap,
  value: number,
  level: Level,
  window: ImageWindow = FULL_WINDOW,
): void {
  const digits = String(Math.max(0, Math.min(99, Math.trunc(value)))).split('').map(Number);
  const baseX = (SHORT - GLYPH_W) >> 1;
  const baseY = window.origin + Math.max(0, Math.floor((window.width - stampHeight(digits.length)) / 2));

  if (digits.length === 1) {
    blitDigit(bitmap, digits[0], baseX, baseY, level, window);
    return;
  }
  blitDigit(bitmap, digits[0], baseX, baseY, level, window);
  blitDigit(bitmap, digits[1], baseX, baseY + GLYPH_H + GLYPH_GAP, level, window);
}
