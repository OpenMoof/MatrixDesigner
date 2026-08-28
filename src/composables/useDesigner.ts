import { computed, reactive, ref } from 'vue';
import { DEFAULT_TICK_MS, LED_COUNT, LONG } from '@/constants/panel';
import {
  blankFrame,
  clampDelay,
  cloneBitmap,
  cloneFrame,
  countLit,
  isBlank,
  mapMasked,
} from '@/core/frame';
import { inMask } from '@/core/geometry';
import { buildProject, parseProject, totalDurationMs } from '@/core/project';
import { stampNumber } from '@/core/stamps';
import { flipped, mirrored, shifted } from '@/core/transform';
import {
  clampWindow,
  contentBounds,
  countOutsideWindow,
  inWindow,
  isFullPanel,
  windowEnd,
} from '@/core/window';
import type { Bitmap, Frame, ImageWindow, Level } from '@/types/matrix';
import type { ProjectMeta } from '@/types/project';

interface Snapshot {
  frames: Frame[];
  current: number;
}

const HISTORY_LIMIT = 60;

const frames = ref<Frame[]>([blankFrame()]);
const current = ref(0);
const level = ref<Level>(7);
const revision = ref(0);

const meta = reactive<ProjectMeta>({
  name: 'my_image',
  origin: 0,
  width: LONG,
  tickMs: DEFAULT_TICK_MS,
  loop: true,
});

const undoStack = ref<Snapshot[]>([]);
const redoStack = ref<Snapshot[]>([]);

function touch(): void {
  revision.value++;
}

function snapshot(): Snapshot {
  return { frames: frames.value.map(cloneFrame), current: current.value };
}

function commit(): void {
  undoStack.value.push(snapshot());
  if (undoStack.value.length > HISTORY_LIMIT) undoStack.value.shift();
  redoStack.value = [];
}

function restore(snap: Snapshot): void {
  frames.value = snap.frames.map(cloneFrame);
  current.value = Math.min(snap.current, frames.value.length - 1);
  touch();
}

export function useDesigner() {
  const frame = computed(() => frames.value[current.value]);
  const frameCount = computed(() => frames.value.length);
  const canUndo = computed(() => undoStack.value.length > 0);
  const canRedo = computed(() => redoStack.value.length > 0);
  const durationMs = computed(() => totalDurationMs(frames.value, meta.tickMs));

  const litCount = computed(() => {
    void revision.value;
    return countLit(frames.value[current.value].bitmap);
  });

  const imageWindow = computed<ImageWindow>(() => clampWindow(meta));

  const outsideCount = computed(() => {
    void revision.value;
    return countOutsideWindow(frames.value, imageWindow.value);
  });

  const windowLabel = computed(() =>
    isFullPanel(imageWindow.value)
      ? `full panel · ${LONG} cols`
      : `col ${imageWindow.value.origin}–${windowEnd(imageWindow.value)} · ${imageWindow.value.width} cols`,
  );

  function select(index: number): void {
    if (index < 0 || index >= frames.value.length) return;
    current.value = index;
  }

  function setLevel(next: Level): void {
    level.value = next;
  }

  function setWindow(next: Partial<ImageWindow>): void {
    const clamped = clampWindow({ ...imageWindow.value, ...next });
    meta.origin = clamped.origin;
    meta.width = clamped.width;
  }

  function fitWindowToContent(): boolean {
    const bounds = contentBounds(frames.value);
    if (!bounds) return false;
    setWindow(bounds);
    return true;
  }

  function resetWindow(): void {
    setWindow({ origin: 0, width: LONG });
  }

  function paint(x: number, y: number, value: Level, record = true): boolean {
    if (!inMask(x, y) || !inWindow(y, imageWindow.value)) return false;
    const bitmap = frames.value[current.value].bitmap;
    if (bitmap[y][x] === value) return false;
    if (record) commit();
    bitmap[y][x] = value;
    touch();
    return true;
  }

  function beginStroke(): void {
    commit();
  }

  function replaceBitmap(next: Bitmap): void {
    commit();
    frames.value[current.value].bitmap = next;
    touch();
  }

  function editBitmap(fn: (level: Level, x: number, y: number) => Level): void {
    const next = cloneBitmap(frame.value.bitmap);
    mapMasked(next, fn, imageWindow.value);
    replaceBitmap(next);
  }

  function clearFrame(): void {
    if (isBlank(frame.value.bitmap)) return;
    editBitmap(() => 0);
  }

  function fillFrame(): void {
    editBitmap(() => level.value);
  }

  function invertFrame(): void {
    editBitmap((value) => (value === 0 ? level.value : 0));
  }

  function nudgeBrightness(delta: number): void {
    editBitmap((value) => (value === 0 ? 0 : (Math.max(1, Math.min(7, value + delta)) as Level)));
  }

  function shift(dx: number, dy: number, wrap = false): void {
    replaceBitmap(shifted(frame.value.bitmap, dx, dy, wrap, imageWindow.value));
  }

  function mirror(): void {
    replaceBitmap(mirrored(frame.value.bitmap, imageWindow.value));
  }

  function flip(): void {
    replaceBitmap(flipped(frame.value.bitmap, imageWindow.value));
  }

  function stamp(value: number): void {
    const next = cloneBitmap(frame.value.bitmap);
    stampNumber(next, value, level.value, imageWindow.value);
    replaceBitmap(next);
  }

  function addFrame(): void {
    commit();
    frames.value.splice(current.value + 1, 0, blankFrame(frame.value.delay));
    current.value += 1;
    touch();
  }

  function duplicateFrame(): void {
    commit();
    frames.value.splice(current.value + 1, 0, cloneFrame(frame.value));
    current.value += 1;
    touch();
  }

  function deleteFrame(): void {
    if (frames.value.length <= 1) return;
    commit();
    frames.value.splice(current.value, 1);
    current.value = Math.max(0, current.value - 1);
    touch();
  }

  function moveFrame(from: number, to: number): void {
    if (from === to || to < 0 || to >= frames.value.length) return;
    commit();
    const [moved] = frames.value.splice(from, 1);
    frames.value.splice(to, 0, moved);
    current.value = to;
    touch();
  }

  function setDelay(ticks: number): void {
    frames.value[current.value].delay = clampDelay(ticks);
  }

  function applyDelayToAll(): void {
    commit();
    const ticks = frame.value.delay;
    for (const item of frames.value) item.delay = ticks;
  }

  function undo(): void {
    const snap = undoStack.value.pop();
    if (!snap) return;
    redoStack.value.push(snapshot());
    restore(snap);
  }

  function redo(): void {
    const snap = redoStack.value.pop();
    if (!snap) return;
    undoStack.value.push(snapshot());
    restore(snap);
  }

  function resetAll(): void {
    commit();
    frames.value = [blankFrame()];
    current.value = 0;
    touch();
  }

  function toJson() {
    return buildProject(frames.value, { ...meta });
  }

  function loadJson(raw: unknown): void {
    const parsed = parseProject(raw);
    commit();
    frames.value = parsed.frames;
    current.value = 0;
    Object.assign(meta, parsed.meta);
    touch();
  }

  return {
    frames,
    current,
    level,
    revision,
    meta,
    frame,
    frameCount,
    litCount,
    imageWindow,
    windowLabel,
    outsideCount,
    ledCount: LED_COUNT,
    durationMs,
    canUndo,
    canRedo,
    select,
    setLevel,
    setWindow,
    fitWindowToContent,
    resetWindow,
    paint,
    beginStroke,
    clearFrame,
    fillFrame,
    invertFrame,
    nudgeBrightness,
    shift,
    mirror,
    flip,
    stamp,
    addFrame,
    duplicateFrame,
    deleteFrame,
    moveFrame,
    setDelay,
    applyDelayToAll,
    undo,
    redo,
    resetAll,
    toJson,
    loadJson,
  };
}
