<script setup lang="ts">
import { ref } from 'vue';
import LevelPalette from './LevelPalette.vue';
import { useDesigner } from '@/composables/useDesigner';
import { dutyHex } from '@/core/palette';

const designer = useDesigner();
const stampValue = ref(67);
const wrapShift = ref(false);
</script>

<template>
  <section class="om-card" aria-label="Tools">
    <div class="om-card-head">
      <span class="om-card-title">Brush</span>
      <span class="md-mast-spacer" />
      <span class="om-pill">PWM 0x{{ dutyHex(designer.level.value) }}</span>
    </div>

    <LevelPalette :model-value="designer.level.value" @update:model-value="designer.setLevel" />
    <p class="md-hint">
      Drag to paint. <span class="md-code">Shift</span>, <span class="md-code">Alt</span> or right-drag erases.
    </p>

    <hr class="md-divider" />

    <span class="om-section-label">Frame</span>
    <div class="md-inline">
      <button type="button" class="md-tool md-tool--wide" @click="designer.clearFrame">Clear</button>
      <button type="button" class="md-tool md-tool--wide" @click="designer.fillFrame">Fill</button>
      <button type="button" class="md-tool md-tool--wide" @click="designer.invertFrame">Invert</button>
    </div>
    <div class="md-inline">
      <button type="button" class="md-tool md-tool--wide" @click="designer.nudgeBrightness(1)">Brighter</button>
      <button type="button" class="md-tool md-tool--wide" @click="designer.nudgeBrightness(-1)">Dimmer</button>
    </div>

    <hr class="md-divider" />

    <div class="md-inline">
      <span class="om-section-label">Transform</span>
      <span class="md-mast-spacer" />
      <button
        type="button"
        class="md-tool"
        :class="{ 'md-tool--on': wrapShift }"
        title="Wrap pixels around the window edges instead of dropping them"
        @click="wrapShift = !wrapShift"
      >
        Wrap
      </button>
    </div>
    <div class="md-inline">
      <button type="button" class="md-tool md-tool--icon" title="Shift up" @click="designer.shift(0, 1, wrapShift)">↑</button>
      <button type="button" class="md-tool md-tool--icon" title="Shift down" @click="designer.shift(0, -1, wrapShift)">↓</button>
      <button type="button" class="md-tool md-tool--icon" title="Shift left" @click="designer.shift(-1, 0, wrapShift)">←</button>
      <button type="button" class="md-tool md-tool--icon" title="Shift right" @click="designer.shift(1, 0, wrapShift)">→</button>
      <button type="button" class="md-tool md-tool--wide" @click="designer.mirror">Mirror</button>
      <button type="button" class="md-tool md-tool--wide" @click="designer.flip">Flip</button>
    </div>

    <hr class="md-divider" />

    <span class="om-section-label">Stamp number</span>
    <div class="md-inline">
      <input
        v-model.number="stampValue"
        class="md-input"
        type="number"
        min="0"
        max="99"
        aria-label="Number to stamp"
        style="width: 90px"
      />
      <button type="button" class="md-tool md-tool--wide" @click="designer.stamp(stampValue)">
        Stamp 5×7 digits
      </button>
    </div>
  </section>
</template>
