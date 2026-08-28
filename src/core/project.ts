import { DEFAULT_TICK_MS, LED_COUNT, LONG, LUT, ROW_WIDTH, SHORT } from '@/constants/panel';
import type { Frame, Level } from '@/types/matrix';
import type { ParsedProject, ProjectJson, ProjectMeta } from '@/types/project';
import { blankBitmap, clampDelay, clampLevel } from './frame';
import { fromHexWord, packBitmap, toHexWord, unpackColumn } from './packing';
import { clampWindow, windowEnd } from './window';

export const PROJECT_FORMAT = 'matrix-display/1';

export class ProjectParseError extends Error {}

function fail(message: string): never {
  throw new ProjectParseError(message);
}

export function sanitiseName(name: string): string {
  const cleaned = name.replace(/[^A-Za-z0-9_-]/g, '_').replace(/^_+|_+$/g, '');
  return cleaned.length > 0 ? cleaned.slice(0, 48) : 'untitled';
}

export function totalDurationMs(frames: Frame[], tickMs: number): number {
  return frames.reduce((sum, frame) => sum + frame.delay * tickMs, 0);
}

export function buildProject(frames: Frame[], meta: ProjectMeta): ProjectJson {
  const window = clampWindow(meta);
  const last = windowEnd(window);

  return {
    format: PROJECT_FORMAT,
    name: sanitiseName(meta.name),
    createdAt: new Date().toISOString(),
    geometry: {
      long: LONG,
      short: SHORT,
      rowWidth: [...ROW_WIDTH],
      ledCount: LED_COUNT,
      levels: LUT.length,
      lut: [...LUT],
    },
    playback: {
      origin: window.origin,
      width: window.width,
      tickMs: meta.tickMs,
      loop: meta.loop,
    },
    frames: frames.map((frame) => ({
      delay: frame.delay,
      pixels: frame.bitmap.slice(window.origin, last + 1).map((row) => row.slice()),
      packed: packBitmap(frame.bitmap, window).map(toHexWord),
    })),
  };
}

function entryLength(entry: Record<string, unknown>): number | null {
  if (Array.isArray(entry?.pixels)) return entry.pixels.length;
  if (Array.isArray(entry?.packed)) return entry.packed.length;
  return null;
}

export function parseProject(raw: unknown): ParsedProject {
  if (typeof raw !== 'object' || raw === null) fail('Not a JSON object.');
  const doc = raw as Record<string, any>;

  if (typeof doc.format === 'string' && !doc.format.startsWith('matrix-display/')) {
    fail(`Unsupported format "${doc.format}".`);
  }
  if (!Array.isArray(doc.frames) || doc.frames.length === 0) fail('No frames in file.');

  const geometry = doc.geometry ?? {};
  if (geometry.long !== undefined && geometry.long !== LONG) {
    fail(`File is for a ${geometry.long} column panel, this one has ${LONG}.`);
  }
  if (geometry.short !== undefined && geometry.short !== SHORT) {
    fail(`File is ${geometry.short} LEDs wide, this panel is ${SHORT}.`);
  }

  const playback = doc.playback ?? {};
  const declaredOrigin = Number(playback.origin) || 0;
  const declaredWidth = Number.isFinite(playback.width)
    ? Number(playback.width)
    : entryLength(doc.frames[0]) ?? LONG;
  const window = clampWindow({ origin: declaredOrigin, width: declaredWidth });

  if (window.width !== declaredWidth || window.origin !== declaredOrigin) {
    fail(`Image window ${declaredOrigin}+${declaredWidth} does not fit a ${LONG} column panel.`);
  }

  const frames: Frame[] = doc.frames.map((entry: any, index: number) => {
    if (typeof entry !== 'object' || entry === null) fail(`Frame ${index} is not an object.`);
    const bitmap = blankBitmap();

    if (Array.isArray(entry.pixels)) {
      if (entry.pixels.length !== window.width) {
        fail(`Frame ${index} has ${entry.pixels.length} columns, expected ${window.width}.`);
      }
      entry.pixels.forEach((row: unknown, offset: number) => {
        if (!Array.isArray(row) || row.length !== SHORT) {
          fail(`Frame ${index} column ${offset} must hold ${SHORT} levels.`);
        }
        for (let x = 0; x < SHORT; x++) {
          bitmap[window.origin + offset][x] = clampLevel(Number(row[x])) as Level;
        }
      });
    } else if (Array.isArray(entry.packed)) {
      if (entry.packed.length !== window.width) {
        fail(`Frame ${index} has ${entry.packed.length} words, expected ${window.width}.`);
      }
      entry.packed.forEach((word: unknown, offset: number) => {
        const value = typeof word === 'string' ? fromHexWord(word) : Number(word) >>> 0;
        unpackColumn(value, bitmap, window.origin + offset);
      });
    } else {
      fail(`Frame ${index} has neither "pixels" nor "packed".`);
    }

    return { bitmap, delay: clampDelay(Number(entry.delay)) };
  });

  return {
    frames,
    meta: {
      name: sanitiseName(typeof doc.name === 'string' ? doc.name : 'imported'),
      origin: window.origin,
      width: window.width,
      tickMs: Number.isFinite(playback.tickMs)
        ? Math.max(1, Math.trunc(playback.tickMs))
        : DEFAULT_TICK_MS,
      loop: playback.loop !== false,
    },
  };
}
