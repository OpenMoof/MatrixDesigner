<script setup lang="ts">
import { MAX_LEVEL } from '@/constants/panel';
import { dutyHex, levelCss } from '@/core/palette';
import type { Level } from '@/types/matrix';

defineProps<{ modelValue: Level }>();

const emit = defineEmits<{ (event: 'update:modelValue', value: Level): void }>();

const levels = Array.from({ length: MAX_LEVEL + 1 }, (_, index) => index as Level);
</script>

<template>
  <div class="md-levels" role="radiogroup" aria-label="Brightness level">
    <button
      v-for="level in levels"
      :key="level"
      type="button"
      class="md-level"
      :class="{ 'md-level--on': level === modelValue }"
      role="radio"
      :aria-checked="level === modelValue"
      :title="`Level ${level} — PWM 0x${dutyHex(level)}`"
      @click="emit('update:modelValue', level)"
    >
      <span class="md-level-swatch" :style="{ background: levelCss(level) }" />
      <span class="md-level-value">{{ level }}</span>
    </button>
  </div>
</template>
