declare module 'gifenc' {
  export type QuantizeFormat = 'rgb565' | 'rgb444' | 'rgba4444';

  export interface QuantizeOptions {
    format?: QuantizeFormat;
    clearAlpha?: boolean;
    clearAlphaColor?: number;
    clearAlphaThreshold?: number;
    oneBitAlpha?: boolean;
    useSqrt?: boolean;
  }

  export interface WriteFrameOptions {
    palette?: number[][] | null;
    delay?: number;
    repeat?: number;
    transparent?: boolean;
    transparentIndex?: number;
    colorDepth?: number;
    dispose?: number;
    first?: boolean;
  }

  export interface GIFEncoderInstance {
    writeFrame(index: Uint8Array, width: number, height: number, opts?: WriteFrameOptions): void;
    writeHeader(): void;
    finish(): void;
    reset(): void;
    bytes(): Uint8Array;
    bytesView(): Uint8Array;
    readonly buffer: ArrayBuffer;
  }

  export function GIFEncoder(opts?: { initialCapacity?: number; auto?: boolean }): GIFEncoderInstance;

  export function quantize(
    rgba: Uint8Array | Uint8ClampedArray,
    maxColors: number,
    opts?: QuantizeOptions,
  ): number[][];

  export function applyPalette(
    rgba: Uint8Array | Uint8ClampedArray,
    palette: number[][],
    format?: QuantizeFormat,
  ): Uint8Array;

  export function nearestColorIndex(palette: number[][], pixel: number[]): number;
  export function snapColorsToPalette(palette: number[][], knownColors: number[][], threshold?: number): void;

  export default GIFEncoder;
}
