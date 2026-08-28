import type { ImageWindow } from '@/types/matrix';

export const LONG = 20;

export const SHORT = 9;

export const ROW_WIDTH: readonly number[] = [
  7, 7, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 7, 7, 3,
];

export const LUT: readonly number[] = [0x00, 0x04, 0x08, 0x10, 0x20, 0x40, 0x80, 0xff];

export const MAX_LEVEL = 7;

export const LED_COUNT = ROW_WIDTH.reduce((sum, width) => sum + width, 0);

export const DEFAULT_DELAY = 50;

export const MIN_DELAY = 1;

export const MAX_DELAY = 65535;

export const DEFAULT_TICK_MS = 10;

export const FULL_WINDOW: ImageWindow = { origin: 0, width: LONG };
