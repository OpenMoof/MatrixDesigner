import { computed, onUnmounted, ref, watch, type Ref } from 'vue';
import type { Frame } from '@/types/matrix';

const MIN_HOLD_MS = 10;

export function usePlayback(frames: Ref<Frame[]>, tickMs: Ref<number>, loop: Ref<boolean>) {
  const isPlaying = ref(false);
  const index = ref(0);

  let raf = 0;
  let frameStartedAt = 0;

  const canPlay = computed(() => frames.value.length > 1);

  function holdMs(at: number): number {
    return Math.max(MIN_HOLD_MS, (frames.value[at]?.delay ?? 1) * tickMs.value);
  }

  function stop(): void {
    isPlaying.value = false;
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
  }

  function step(now: number): void {
    if (!isPlaying.value) return;
    if (now - frameStartedAt >= holdMs(index.value)) {
      frameStartedAt = now;
      const next = index.value + 1;
      if (next >= frames.value.length) {
        if (!loop.value) {
          stop();
          return;
        }
        index.value = 0;
      } else {
        index.value = next;
      }
    }
    raf = requestAnimationFrame(step);
  }

  function play(from = 0): void {
    if (isPlaying.value || frames.value.length === 0) return;
    index.value = Math.min(from, frames.value.length - 1);
    isPlaying.value = true;
    frameStartedAt = performance.now();
    raf = requestAnimationFrame(step);
  }

  function toggle(): void {
    if (isPlaying.value) stop();
    else play();
  }

  watch(
    () => frames.value.length,
    (length) => {
      if (index.value >= length) index.value = Math.max(0, length - 1);
    },
  );

  onUnmounted(stop);

  return { isPlaying, index, canPlay, play, stop, toggle };
}
