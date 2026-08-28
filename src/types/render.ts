import type { ImageWindow } from './matrix';

export interface RenderOptions {
  pitch: number;
  showDead: boolean;
  glow: boolean;
  background: boolean;
  crop: ImageWindow | null;
  window: ImageWindow | null;
}

export interface GifOptions {
  pitch: number;
  tickMs: number;
  loop: boolean;
  glow: boolean;
  showDead: boolean;
  crop: ImageWindow | null;
}

export type StatusKind = 'ok' | 'error';

export interface StatusMessage {
  kind: StatusKind;
  text: string;
}
