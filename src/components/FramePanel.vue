<script setup lang="ts">
import FrameStrip from './FrameStrip.vue';
import { useDesigner } from '@/composables/useDesigner';

const designer = useDesigner();

defineProps<{
  isPlaying: boolean;
  liveIndex: number | null;
  canPlay: boolean;
}>();

const emit = defineEmits<{ (event: 'toggle-play'): void }>();
</script>

<template>
  <section class="om-card" aria-label="Frames" style="width: 100%">
    <div class="om-card-head">
      <span class="om-card-title">Frames</span>
      <span class="md-mast-spacer" />
      <button
        type="button"
        class="md-tool"
        :class="{ 'md-tool--on': isPlaying }"
        :disabled="!canPlay"
        @click="emit('toggle-play')"
      >
        {{ isPlaying ? '❚❚ Pause' : '▶ Play' }}
      </button>
    </div>

    <FrameStrip
      :frames="designer.frames.value"
      :current="designer.current.value"
      :revision="designer.revision.value"
      :live-index="liveIndex"
      @select="designer.select"
    />

    <div class="md-inline">
      <button type="button" class="md-tool md-tool--wide" @click="designer.addFrame">+ Frame</button>
      <button type="button" class="md-tool md-tool--wide" @click="designer.duplicateFrame">Duplicate</button>
      <button
        type="button"
        class="md-tool md-tool--wide md-tool--danger"
        :disabled="designer.frameCount.value <= 1"
        @click="designer.deleteFrame"
      >
        Delete
      </button>
    </div>

    <div class="md-inline">
      <button
        type="button"
        class="md-tool md-tool--icon"
        title="Move earlier"
        :disabled="designer.current.value === 0"
        @click="designer.moveFrame(designer.current.value, designer.current.value - 1)"
      >
        ‹
      </button>
      <button
        type="button"
        class="md-tool md-tool--icon"
        title="Move later"
        :disabled="designer.current.value >= designer.frameCount.value - 1"
        @click="designer.moveFrame(designer.current.value, designer.current.value + 1)"
      >
        ›
      </button>
      <div class="md-field" style="flex: 1">
        <label for="fp-delay">Frame {{ designer.current.value }} delay (ticks)</label>
        <input
          id="fp-delay"
          class="md-input"
          type="number"
          min="1"
          max="65535"
          :value="designer.frame.value.delay"
          @input="designer.setDelay(Number(($event.target as HTMLInputElement).value))"
        />
      </div>
      <button type="button" class="md-tool" title="Copy this delay to every frame" @click="designer.applyDelayToAll">
        Apply to all
      </button>
    </div>
  </section>
</template>
