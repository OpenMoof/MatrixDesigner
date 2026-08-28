<script setup lang="ts">
import { computed, onMounted, onUnmounted } from 'vue';
import ExportPanel from './components/ExportPanel.vue';
import FramePanel from './components/FramePanel.vue';
import MatrixCanvas from './components/MatrixCanvas.vue';
import ToolPanel from './components/ToolPanel.vue';
import { useDesigner } from '@/composables/useDesigner';
import { usePlayback } from '@/composables/usePlayback';
import { STAGE_PITCH } from '@/constants/appearance';
import { LED_COUNT, MAX_LEVEL } from '@/constants/panel';
import type { Level } from '@/types/matrix';

const designer = useDesigner();

const tickMs = computed(() => designer.meta.tickMs);
const loop = computed(() => designer.meta.loop);
const playback = usePlayback(designer.frames, tickMs, loop);

const stageFrame = computed(() =>
  playback.isPlaying.value
    ? designer.frames.value[playback.index.value] ?? designer.frame.value
    : designer.frame.value,
);

const durationLabel = computed(() => {
  const ms = designer.durationMs.value;
  return ms >= 1000 ? `${(ms / 1000).toFixed(2)}s` : `${ms}ms`;
});

function onPaint(x: number, y: number, erase: boolean): void {
  designer.paint(x, y, erase ? 0 : designer.level.value, false);
}

function isTyping(target: EventTarget | null): boolean {
  return target instanceof HTMLElement && /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName);
}

function onGlobalKey(event: KeyboardEvent): void {
  if (isTyping(event.target)) return;

  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'z') {
    event.preventDefault();
    if (event.shiftKey) designer.redo();
    else designer.undo();
    return;
  }
  if (event.metaKey || event.ctrlKey || event.altKey) return;

  if (event.key >= '0' && event.key <= String(MAX_LEVEL)) {
    designer.setLevel(Number(event.key) as Level);
    event.preventDefault();
    return;
  }
  if (event.key === ' ') {
    playback.toggle();
    event.preventDefault();
    return;
  }
  if (event.target instanceof HTMLCanvasElement) return;

  if (event.key === 'ArrowLeft') {
    designer.select(designer.current.value - 1);
    event.preventDefault();
  } else if (event.key === 'ArrowRight') {
    designer.select(designer.current.value + 1);
    event.preventDefault();
  }
}

onMounted(() => window.addEventListener('keydown', onGlobalKey));
onUnmounted(() => window.removeEventListener('keydown', onGlobalKey));
</script>

<template>
  <div class="md-shell">
    <header class="md-mast">
      <div>
        <p class="md-eyebrow">OpenMoof</p>
        <h1>Matrix Designer</h1>
      </div>
      <span class="md-mast-spacer" />
      <div class="md-inline">
        <button type="button" class="md-tool" :disabled="!designer.canUndo.value" @click="designer.undo">Undo</button>
        <button type="button" class="md-tool" :disabled="!designer.canRedo.value" @click="designer.redo">Redo</button>
        <button type="button" class="md-tool md-tool--danger" @click="designer.resetAll">Reset</button>
      </div>
    </header>

    <main class="md-body">
      <div class="md-col">
        <ToolPanel />
      </div>

      <div class="md-col md-col--stage">
        <div class="md-stage">
          <span class="md-axis">▲ far · 3 LEDs</span>
          <MatrixCanvas
            :bitmap="stageFrame.bitmap"
            :revision="designer.revision.value"
            :pitch="STAGE_PITCH"
            :window="designer.imageWindow.value"
            :interactive="!playback.isPlaying.value"
            @stroke-start="designer.beginStroke"
            @paint="onPaint"
          />
          <span class="md-axis">rider · 7 LEDs ▼</span>

          <div class="om-facts" style="width: 100%">
            <div class="om-fact">
              <span class="om-fact-value">{{ designer.frameCount.value }}</span>
              <span class="om-fact-label">FRAMES</span>
            </div>
            <div class="om-fact">
              <span class="om-fact-value">{{ designer.litCount.value }}/{{ LED_COUNT }}</span>
              <span class="om-fact-label">LIT</span>
            </div>
            <div class="om-fact">
              <span class="om-fact-value">{{ durationLabel }}</span>
              <span class="om-fact-label">LOOP</span>
            </div>
            <div class="om-fact">
              <span class="om-fact-value">{{ designer.imageWindow.value.width }}×9</span>
              <span class="om-fact-label">SIZE @{{ designer.imageWindow.value.origin }}</span>
            </div>
          </div>

          <p v-if="designer.outsideCount.value > 0" class="md-notice md-notice--error">
            {{ designer.outsideCount.value }} lit LED{{ designer.outsideCount.value === 1 ? '' : 's' }}
            sit outside the image window and will not be exported.
          </p>
        </div>

        <FramePanel
          :is-playing="playback.isPlaying.value"
          :can-play="playback.canPlay.value"
          :live-index="playback.isPlaying.value ? playback.index.value : null"
          @toggle-play="playback.toggle"
        />
      </div>

      <div class="md-col">
        <ExportPanel />
      </div>
    </main>
  </div>
</template>
