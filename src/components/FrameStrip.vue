<script setup lang="ts">
import { onMounted, ref, watch } from 'vue';
import { THUMB_PITCH } from '@/constants/appearance';
import { canvasSize, drawBitmap } from '@/render/canvas';
import type { Frame } from '@/types/matrix';

const props = defineProps<{
  frames: Frame[];
  current: number;
  revision: number;
  liveIndex: number | null;
}>();

const emit = defineEmits<{ (event: 'select', index: number): void }>();

const thumbs = ref<HTMLCanvasElement[]>([]);
const size = canvasSize(THUMB_PITCH);

function setThumb(element: unknown, index: number): void {
  if (element instanceof HTMLCanvasElement) thumbs.value[index] = element;
}

function paintThumbs(): void {
  const dpr = window.devicePixelRatio || 1;
  props.frames.forEach((frame, index) => {
    const element = thumbs.value[index];
    if (!element) return;
    if (element.width !== Math.round(size.width * dpr)) {
      element.width = Math.round(size.width * dpr);
      element.height = Math.round(size.height * dpr);
    }
    const ctx = element.getContext('2d');
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    drawBitmap(ctx, frame.bitmap, {
      pitch: THUMB_PITCH,
      showDead: false,
      glow: false,
      background: true,
    });
  });
}

onMounted(paintThumbs);
watch(() => [props.revision, props.frames.length], paintThumbs, { flush: 'post' });
</script>

<template>
  <div class="md-strip">
    <button
      v-for="(frame, index) in frames"
      :key="index"
      type="button"
      class="md-strip-item"
      :class="{
        'md-strip-item--on': index === current,
        'md-strip-item--live': index === liveIndex && index !== current,
      }"
      :aria-current="index === current"
      :title="`Frame ${index} — ${frame.delay} ticks`"
      @click="emit('select', index)"
    >
      <canvas
        :ref="(element) => setThumb(element, index)"
        class="md-strip-thumb"
        :style="{ width: `${size.width}px`, height: `${size.height}px` }"
      />
      <span class="md-strip-label">{{ index }} · {{ frame.delay }}t</span>
    </button>
  </div>
</template>
