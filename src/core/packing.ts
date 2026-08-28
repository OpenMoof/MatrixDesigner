import { FULL_WINDOW, SHORT } from '@/constants/panel';
import type { Bitmap, ImageWindow, Level } from '@/types/matrix';
import { windowEnd } from './window';

export function packColumn(bitmap: Bitmap, y: number): number {
  let word = 0;
  for (let x = 0; x < SHORT; x++) word |= (bitmap[y][x] & 7) << (3 * x);
  return word >>> 0;
}

export function packBitmap(bitmap: Bitmap, window: ImageWindow = FULL_WINDOW): number[] {
  const words: number[] = [];
  for (let y = window.origin; y <= windowEnd(window); y++) words.push(packColumn(bitmap, y));
  return words;
}

export function unpackColumn(word: number, into: Bitmap, y: number): void {
  for (let x = 0; x < SHORT; x++) into[y][x] = ((word >>> (3 * x)) & 7) as Level;
}

export function toHexWord(word: number): string {
  return '0x' + (word >>> 0).toString(16).toUpperCase().padStart(8, '0');
}

export function fromHexWord(text: string): number {
  return Number.parseInt(text.replace(/^0x/i, '').replace(/u$/i, ''), 16) >>> 0;
}
