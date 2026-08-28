<script setup lang="ts">
import { computed, ref } from 'vue';
import { useDesigner } from '@/composables/useDesigner';
import { GIF_SCALES } from '@/constants/appearance';
import { LONG } from '@/constants/panel';
import { sanitiseName } from '@/core/project';
import { canvasSize } from '@/render/canvas';
import { encodeGif, encodePng } from '@/render/gif';
import type { StatusKind, StatusMessage } from '@/types/render';
import { downloadBlob, downloadJson } from '@/utils/download';

const STATUS_TIMEOUT_MS = 4000;

const designer = useDesigner();

const gifPitch = ref(20);
const gifGlow = ref(true);
const gifShowDead = ref(false);
const gifCrop = ref(false);
const busy = ref<'gif' | 'png' | null>(null);
const status = ref<StatusMessage | null>(null);
const fileInput = ref<HTMLInputElement | null>(null);

const filename = computed(() => sanitiseName(designer.meta.name));
const preview = computed(() => JSON.stringify(designer.toJson(), null, 2));
const jsonBytes = computed(() => new Blob([preview.value]).size);
const crop = computed(() => (gifCrop.value ? designer.imageWindow.value : null));
const gifSize = computed(() => canvasSize(gifPitch.value, crop.value ? crop.value.width : undefined));

function announce(kind: StatusKind, text: string): void {
  status.value = { kind, text };
  window.setTimeout(() => {
    if (status.value?.text === text) status.value = null;
  }, STATUS_TIMEOUT_MS);
}

function describe(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

function fitWindow(): void {
  if (designer.fitWindowToContent()) announce('ok', `Window set to ${designer.windowLabel.value}`);
  else announce('error', 'Nothing drawn to fit');
}

function exportJson(): void {
  downloadJson(designer.toJson(), `${filename.value}.json`);
  announce('ok', `Saved ${filename.value}.json`);
}

async function copyJson(): Promise<void> {
  try {
    await navigator.clipboard.writeText(preview.value);
    announce('ok', 'JSON copied to clipboard');
  } catch {
    announce('error', 'Clipboard blocked — use Download instead');
  }
}

async function exportGif(): Promise<void> {
  busy.value = 'gif';
  try {
    const blob = await encodeGif(designer.frames.value, {
      pitch: gifPitch.value,
      tickMs: designer.meta.tickMs,
      loop: designer.meta.loop,
      glow: gifGlow.value,
      showDead: gifShowDead.value,
      crop: crop.value,
    });
    downloadBlob(blob, `${filename.value}.gif`);
    announce('ok', `Saved ${filename.value}.gif — ${Math.round(blob.size / 1024)} kB`);
  } catch (error) {
    announce('error', describe(error, 'GIF export failed'));
  } finally {
    busy.value = null;
  }
}

async function exportPng(): Promise<void> {
  busy.value = 'png';
  try {
    const blob = await encodePng(designer.frame.value, gifPitch.value, crop.value);
    downloadBlob(blob, `${filename.value}_f${designer.current.value}.png`);
    announce('ok', 'Saved still frame');
  } catch (error) {
    announce('error', describe(error, 'PNG export failed'));
  } finally {
    busy.value = null;
  }
}

async function onImport(event: Event): Promise<void> {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  input.value = '';
  if (!file) return;
  try {
    designer.loadJson(JSON.parse(await file.text()));
    announce('ok', `Loaded ${file.name}`);
  } catch (error) {
    announce('error', describe(error, 'Could not read that file'));
  }
}
</script>

<template>
  <section class="om-card" aria-label="Export">
    <div class="om-card-head">
      <span class="om-card-title">Export</span>
    </div>

    <div class="md-field">
      <label for="ex-name">Name</label>
      <input id="ex-name" v-model="designer.meta.name" class="md-input md-input--text" type="text" spellcheck="false" />
    </div>

    <div class="md-inline">
      <div class="md-field" style="flex: 1">
        <label for="ex-tick">Tick length (ms)</label>
        <input
          id="ex-tick"
          class="md-input"
          type="number"
          min="1"
          max="1000"
          :value="designer.meta.tickMs"
          @input="designer.meta.tickMs = Math.max(1, Math.min(1000, Number(($event.target as HTMLInputElement).value) || 1))"
        />
      </div>
    </div>

    <hr class="md-divider" />

    <div class="md-inline">
      <span class="om-section-label">Image window</span>
      <span class="md-mast-spacer" />
      <span class="om-pill">{{ designer.windowLabel.value }}</span>
    </div>
    <div class="md-inline">
      <div class="md-field" style="flex: 1">
        <label for="ex-origin">Offset</label>
        <input
          id="ex-origin"
          class="md-input"
          type="number"
          min="0"
          :max="LONG - designer.imageWindow.value.width"
          :value="designer.imageWindow.value.origin"
          @input="designer.setWindow({ origin: Number(($event.target as HTMLInputElement).value) })"
        />
      </div>
      <div class="md-field" style="flex: 1">
        <label for="ex-size">Size (columns)</label>
        <input
          id="ex-size"
          class="md-input"
          type="number"
          min="1"
          :max="LONG"
          :value="designer.imageWindow.value.width"
          @input="designer.setWindow({ width: Number(($event.target as HTMLInputElement).value) })"
        />
      </div>
    </div>
    <div class="md-inline">
      <button type="button" class="md-tool md-tool--wide" @click="fitWindow">Fit to content</button>
      <button type="button" class="md-tool md-tool--wide" @click="designer.resetWindow">Full panel</button>
    </div>

    <hr class="md-divider" />

    <div class="md-inline">
      <span class="om-section-label">GIF options</span>
      <span class="md-mast-spacer" />
      <span class="om-pill">{{ gifSize.width }}&thinsp;×&thinsp;{{ gifSize.height }}</span>
    </div>
    <div class="md-inline">
      <button
        v-for="scale in GIF_SCALES"
        :key="scale.value"
        type="button"
        class="md-tool md-tool--wide"
        :class="{ 'md-tool--on': gifPitch === scale.value }"
        @click="gifPitch = scale.value"
      >
        {{ scale.label }}
      </button>
    </div>
    <div class="md-inline">
      <button type="button" class="md-tool md-tool--wide" :class="{ 'md-tool--on': gifGlow }" @click="gifGlow = !gifGlow">
        Glow
      </button>
      <button
        type="button"
        class="md-tool md-tool--wide"
        :class="{ 'md-tool--on': gifShowDead }"
        @click="gifShowDead = !gifShowDead"
      >
        Lozenge
      </button>
      <button
        type="button"
        class="md-tool md-tool--wide"
        :class="{ 'md-tool--on': designer.meta.loop }"
        @click="designer.meta.loop = !designer.meta.loop"
      >
        Loop
      </button>
      <button type="button" class="md-tool md-tool--wide" :class="{ 'md-tool--on': gifCrop }" @click="gifCrop = !gifCrop">
        Crop
      </button>
    </div>

    <div class="md-inline">
      <button type="button" class="md-tool md-tool--wide" :disabled="busy === 'gif'" @click="exportGif">
        {{ busy === 'gif' ? 'Encoding…' : 'Download GIF' }}
      </button>
      <button type="button" class="md-tool md-tool--wide" :disabled="busy === 'png'" @click="exportPng">
        Still PNG
      </button>
    </div>

    <hr class="md-divider" />

    <div class="md-inline">
      <button type="button" class="md-tool md-tool--wide" @click="exportJson">Download JSON</button>
      <button type="button" class="md-tool md-tool--wide" @click="copyJson">Copy JSON</button>
    </div>
    <div class="md-inline">
      <button type="button" class="md-tool md-tool--wide" @click="fileInput?.click()">Import JSON…</button>
      <input ref="fileInput" type="file" accept="application/json,.json" hidden @change="onImport" />
    </div>

    <p v-if="status" class="md-notice" :class="status.kind === 'ok' ? 'md-notice--ok' : 'md-notice--error'">
      {{ status.text }}
    </p>

    <details>
      <summary class="om-section-label" style="cursor: pointer">
        JSON preview · {{ (jsonBytes / 1024).toFixed(1) }} kB
      </summary>
      <pre class="md-json">{{ preview }}</pre>
    </details>
  </section>
</template>
