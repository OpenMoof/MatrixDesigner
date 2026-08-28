export type Level = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;

export type Bitmap = Level[][];

export interface Frame {
  bitmap: Bitmap;
  delay: number;
}

export interface ImageWindow {
  origin: number;
  width: number;
}

export interface Cell {
  x: number;
  y: number;
}

export interface CanvasSize {
  width: number;
  height: number;
}
