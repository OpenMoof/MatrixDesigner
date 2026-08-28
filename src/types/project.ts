import type { Frame, ImageWindow } from './matrix';

export interface PanelGeometry {
  long: number;
  short: number;
  rowWidth: number[];
  ledCount: number;
  levels: number;
  lut: number[];
}

export interface PlaybackSettings {
  origin: number;
  width: number;
  tickMs: number;
  loop: boolean;
}

export interface ProjectFrame {
  delay: number;
  pixels: number[][];
  packed: string[];
}

export interface ProjectJson {
  format: string;
  name: string;
  createdAt: string;
  geometry: PanelGeometry;
  playback: PlaybackSettings;
  frames: ProjectFrame[];
}

export interface ProjectMeta extends ImageWindow {
  name: string;
  tickMs: number;
  loop: boolean;
}

export interface ParsedProject {
  frames: Frame[];
  meta: ProjectMeta;
}
