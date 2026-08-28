import { LONG, ROW_WIDTH, SHORT } from '@/constants/panel';
import type { Cell } from '@/types/matrix';

export function rowLo(y: number): number {
  return (SHORT - ROW_WIDTH[y]) >> 1;
}

export function inMask(x: number, y: number): boolean {
  if (y < 0 || y >= LONG || x < 0 || x >= SHORT) return false;
  const lo = rowLo(y);
  return x >= lo && x < lo + ROW_WIDTH[y];
}

export function maskedCells(): Cell[] {
  const cells: Cell[] = [];
  for (let y = 0; y < LONG; y++) {
    const lo = rowLo(y);
    for (let x = lo; x < lo + ROW_WIDTH[y]; x++) cells.push({ x, y });
  }
  return cells;
}
