import { ACCENT_RGB, LED_GAMMA } from '@/constants/appearance';
import { LUT, MAX_LEVEL } from '@/constants/panel';
import type { Level } from '@/types/matrix';

export function intensity(level: Level): number {
  if (level <= 0) return 0;
  return Math.pow(LUT[Math.min(level, MAX_LEVEL)] / 255, 1 / LED_GAMMA);
}

export function levelRgb(level: Level): [number, number, number] {
  const t = intensity(level);
  return [
    Math.round(ACCENT_RGB[0] * t),
    Math.round(ACCENT_RGB[1] * t),
    Math.round(ACCENT_RGB[2] * t),
  ];
}

export function levelCss(level: Level): string {
  const [r, g, b] = levelRgb(level);
  return `rgb(${r}, ${g}, ${b})`;
}

export function levelDuty(level: Level): number {
  return LUT[Math.min(Math.max(level, 0), MAX_LEVEL)];
}

export function dutyHex(level: Level): string {
  return levelDuty(level).toString(16).toUpperCase().padStart(2, '0');
}
