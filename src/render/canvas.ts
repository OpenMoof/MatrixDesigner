import { ACCENT_RGB, BACKDROP, DEAD_DOT, OFF_DOT, OUTSIDE_SCRIM } from '@/constants/appearance';
import { LONG, SHORT } from '@/constants/panel';
import { inMask } from '@/core/geometry';
import { intensity } from '@/core/palette';
import { isFullPanel, windowEnd } from '@/core/window';
import type { Bitmap, CanvasSize, Cell, ImageWindow, Level } from '@/types/matrix';
import type { RenderOptions } from '@/types/render';

export const DEFAULT_RENDER: RenderOptions = {
  pitch: 26,
  showDead: true,
  glow: true,
  background: true,
  crop: null,
  window: null,
};

export function canvasSize(pitch: number, columns: number = LONG): CanvasSize {
  return { width: SHORT * pitch, height: columns * pitch };
}

function topColumn(crop: ImageWindow | null): number {
  return crop ? windowEnd(crop) : LONG - 1;
}

export function cellCentre(
  x: number,
  y: number,
  pitch: number,
  crop: ImageWindow | null = null,
): { cx: number; cy: number } {
  return {
    cx: x * pitch + pitch / 2,
    cy: (topColumn(crop) - y) * pitch + pitch / 2,
  };
}

export function cellAt(
  px: number,
  py: number,
  pitch: number,
  crop: ImageWindow | null = null,
): Cell | null {
  const x = Math.floor(px / pitch);
  const y = topColumn(crop) - Math.floor(py / pitch);
  if (x < 0 || x >= SHORT || y < 0 || y >= LONG) return null;
  return { x, y };
}

function accentAlpha(t: number, alpha: number): string {
  return `rgba(${ACCENT_RGB[0]}, ${ACCENT_RGB[1]}, ${ACCENT_RGB[2]}, ${(t * alpha).toFixed(3)})`;
}

function drawWindowBounds(
  ctx: CanvasRenderingContext2D,
  window: ImageWindow,
  pitch: number,
  width: number,
): void {
  if (isFullPanel(window)) return;

  const top = (LONG - 1 - windowEnd(window)) * pitch;
  const bottom = (LONG - window.origin) * pitch;

  ctx.fillStyle = OUTSIDE_SCRIM;
  if (top > 0) ctx.fillRect(0, 0, width, top);
  if (bottom < LONG * pitch) ctx.fillRect(0, bottom, width, LONG * pitch - bottom);

  ctx.strokeStyle = accentAlpha(1, 0.45);
  ctx.lineWidth = 1;
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  ctx.moveTo(0, top + 0.5);
  ctx.lineTo(width, top + 0.5);
  ctx.moveTo(0, bottom - 0.5);
  ctx.lineTo(width, bottom - 0.5);
  ctx.stroke();
  ctx.setLineDash([]);
}

export function drawBitmap(
  ctx: CanvasRenderingContext2D,
  bitmap: Bitmap,
  options: Partial<RenderOptions> = {},
): void {
  const opts = { ...DEFAULT_RENDER, ...options };
  const { pitch, crop } = opts;
  const first = crop ? crop.origin : 0;
  const last = crop ? windowEnd(crop) : LONG - 1;
  const { width, height } = canvasSize(pitch, last - first + 1);
  const radius = pitch * 0.34;

  ctx.clearRect(0, 0, width, height);
  if (opts.background) {
    ctx.fillStyle = BACKDROP;
    ctx.fillRect(0, 0, width, height);
  }

  for (let y = first; y <= last; y++) {
    for (let x = 0; x < SHORT; x++) {
      const { cx, cy } = cellCentre(x, y, pitch, crop);

      if (!inMask(x, y)) {
        if (opts.showDead) {
          ctx.fillStyle = DEAD_DOT;
          ctx.beginPath();
          ctx.arc(cx, cy, radius * 0.42, 0, Math.PI * 2);
          ctx.fill();
        }
        continue;
      }

      const level = bitmap[y][x] as Level;
      if (level === 0) {
        ctx.fillStyle = OFF_DOT;
        ctx.beginPath();
        ctx.arc(cx, cy, radius * 0.72, 0, Math.PI * 2);
        ctx.fill();
        continue;
      }

      const t = intensity(level);

      if (opts.glow) {
        const halo = ctx.createRadialGradient(cx, cy, radius * 0.5, cx, cy, radius * 2.1);
        halo.addColorStop(0, accentAlpha(t, 0.42));
        halo.addColorStop(1, accentAlpha(t, 0));
        ctx.fillStyle = halo;
        ctx.beginPath();
        ctx.arc(cx, cy, radius * 2.1, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.fillStyle = `rgb(${Math.round(ACCENT_RGB[0] * t)}, ${Math.round(ACCENT_RGB[1] * t)}, ${Math.round(ACCENT_RGB[2] * t)})`;
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  if (!crop && opts.window) drawWindowBounds(ctx, opts.window, pitch, width);
}
