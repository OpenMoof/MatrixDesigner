<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { STAGE_PITCH } from '@/constants/appearance';
import { LONG, SHORT } from '@/constants/panel';
import { inMask } from '@/core/geometry';
import { canvasSize, cellAt, cellCentre, drawBitmap } from '@/render/canvas';
import type { Bitmap, Cell, ImageWindow } from '@/types/matrix';

const props = withDefaults(
  defineProps<{
    bitmap: Bitmap;
    revision: number;
    pitch?: number;
    interactive?: boolean;
    window?: ImageWindow | null;
  }>(),
  { pitch: STAGE_PITCH, interactive: true, window: null },
);

const emit = defineEmits<{
  (event: 'stroke-start'): void;
  (event: 'paint', x: number, y: number, erase: boolean): void;
}>();

const canvas = ref<HTMLCanvasElement | null>(null);
const cursor = ref<Cell>({ x: 4, y: 0 });
const focused = ref(false);
const size = computed(() => canvasSize(props.pitch));

let painting = false;
let erasing = false;
let lastCell = '';

function drawCursor(ctx: CanvasRenderingContext2D): void {
  const { cx, cy } = cellCentre(cursor.value.x, cursor.value.y, props.pitch);
  ctx.strokeStyle = '#FCC051';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(cx, cy, props.pitch * 0.44, 0, Math.PI * 2);
  ctx.stroke();
}

function draw(): void {
  const element = canvas.value;
  if (!element) return;
  const ctx = element.getContext('2d');
  if (!ctx) return;

  const dpr = window.devicePixelRatio || 1;
  const { width, height } = size.value;
  if (element.width !== Math.round(width * dpr)) {
    element.width = Math.round(width * dpr);
    element.height = Math.round(height * dpr);
  }

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  drawBitmap(ctx, props.bitmap, {
    pitch: props.pitch,
    showDead: true,
    glow: true,
    background: true,
    window: props.window,
  });

  if (props.interactive && focused.value) drawCursor(ctx);
}

function locate(event: PointerEvent): Cell | null {
  const element = canvas.value;
  if (!element) return null;
  const rect = element.getBoundingClientRect();
  return cellAt(event.clientX - rect.left, event.clientY - rect.top, props.pitch);
}

function applyAt(cell: Cell): void {
  const key = `${cell.x},${cell.y}`;
  if (key === lastCell || !inMask(cell.x, cell.y)) return;
  lastCell = key;
  cursor.value = cell;
  emit('paint', cell.x, cell.y, erasing);
}

function onPointerDown(event: PointerEvent): void {
  if (!props.interactive) return;
  const cell = locate(event);
  if (!cell || !inMask(cell.x, cell.y)) return;

  event.preventDefault();
  canvas.value?.setPointerCapture(event.pointerId);
  painting = true;
  erasing = event.button === 2 || event.altKey || event.shiftKey;
  lastCell = '';
  cursor.value = cell;
  emit('stroke-start');
  applyAt(cell);
}

function onPointerMove(event: PointerEvent): void {
  if (!painting) return;
  const cell = locate(event);
  if (cell) applyAt(cell);
}

function endStroke(event: PointerEvent): void {
  if (!painting) return;
  painting = false;
  lastCell = '';
  canvas.value?.releasePointerCapture?.(event.pointerId);
}

function moveCursor(dx: number, dy: number): void {
  const next = { x: cursor.value.x + dx, y: cursor.value.y + dy };
  if (next.x < 0 || next.x >= SHORT || next.y < 0 || next.y >= LONG) return;
  cursor.value = next;
  draw();
}

function onKeydown(event: KeyboardEvent): void {
  if (!props.interactive) return;
  switch (event.key) {
    case 'ArrowUp':
      moveCursor(0, 1);
      break;
    case 'ArrowDown':
      moveCursor(0, -1);
      break;
    case 'ArrowLeft':
      moveCursor(-1, 0);
      break;
    case 'ArrowRight':
      moveCursor(1, 0);
      break;
    case 'Enter':
    case ' ':
      emit('stroke-start');
      emit('paint', cursor.value.x, cursor.value.y, event.shiftKey);
      break;
    case 'Backspace':
    case 'Delete':
      emit('stroke-start');
      emit('paint', cursor.value.x, cursor.value.y, true);
      break;
    default:
      return;
  }
  event.preventDefault();
}

onMounted(draw);
watch(
  () => [props.revision, props.bitmap, props.pitch, props.window, focused.value],
  draw,
  { flush: 'post' },
);
</script>

<template>
  <canvas
    ref="canvas"
    class="md-canvas"
    :class="{ 'md-canvas--live': !interactive }"
    :style="{ width: `${size.width}px`, height: `${size.height}px` }"
    :tabindex="interactive ? 0 : -1"
    role="application"
    :aria-label="`LED grid, ${SHORT} by ${LONG}. Arrow keys move, Enter paints, Shift and Enter erases.`"
    @pointerdown="onPointerDown"
    @pointermove="onPointerMove"
    @pointerup="endStroke"
    @pointercancel="endStroke"
    @contextmenu.prevent
    @keydown="onKeydown"
    @focus="focused = true"
    @blur="focused = false"
  />
</template>
