# Matrix Designer

![Deploy](https://github.com/OpenMoof/MatrixDesigner/actions/workflows/deploy.yml/badge.svg)

Matrix Designer is a small web app for drawing pictures and animations on the
9 by 20 LED matrix panel, then handing the result off as files you can actually
use.

![The app with a two digit animation open](docs/screenshot.png)

[Open the app](https://openmoof.github.io/MatrixDesigner/)

## What it is for

The panel is a lozenge of 166 LEDs. Twenty long positions run from the rider
edge outward, nine sit across the short axis, and the corners are simply not
wired. Every LED holds three bits of brightness, so eight levels from off to
full.

Drawing for a panel like that in a text editor is miserable. This app gives you
the panel on screen at the right shape, lets you paint it frame by frame, and
then gives you back two files: a JSON file that carries the animation as data,
and an animated GIF that shows what it looks like. You can also save a still
PNG of whichever frame you are on. Nothing else is produced, and in particular
no source code is generated.

## What you can do with it

Paint straight onto the panel by dragging across it. Holding Shift or Alt while
you drag erases instead, and so does dragging with the right mouse button. The
unwired corners are masked off, so you cannot accidentally draw somewhere the
hardware cannot show.

Pick from eight brightness levels. They are mapped through the same PWM table
the firmware uses, and gamma corrected on screen so that every step is actually
distinguishable rather than five shades of black.

Build up an animation on the frame timeline. Frames can be added, duplicated,
reordered and deleted, each one carries its own delay, and you can play the
whole thing back at real speed to see how it reads.

Rearrange what you have drawn with shift, wrap, mirror, flip, invert, brighten
and dim. All of them stay inside the image window, so nothing quietly falls off
the edge of the panel.

Set the image window itself. An image does not have to cover the whole panel:
it can be a shorter band placed at an offset, which is how the firmware places
it too. Set the offset and the size by hand, or press Fit to content and let
the app shrink the window around whatever you have drawn.

Stamp one and two digit numbers using built in 5 by 7 glyphs, centred for you.

Import any JSON file the app produced and carry on where you left off, and undo
or redo any edit, including a whole paint stroke as a single step.

## Running it locally

You need Node 20 or newer. Install the dependencies and start the dev server:

```bash
npm install
npm run dev
```

The app will be at http://localhost:5173 with hot reload.

There are three other scripts. `npm run build` typechecks the project and then
builds it into `dist`. `npm run preview` serves that build locally so you can
check it before publishing. `npm run typecheck` runs the TypeScript checker on
its own, which is handy while you are working.

## How the code is laid out

Everything lives under `src`, split by what each piece is responsible for.

`types` holds type declarations and nothing else. `constants` holds the panel
geometry, the PWM table and the visual values the renderer needs. `core` is the
pure logic: geometry and masking, image windows, frames, transforms, bit
packing, the brightness palette, digit glyphs and the project file format. None
of it touches the DOM, so it is easy to test on its own.

`render` draws things. One canvas renderer is shared by the editor, the frame
thumbnails and the GIF encoder, which is the reason the file you export looks
exactly like what you drew. `composables` holds the editor state and playback,
`components` holds the Vue components, `utils` holds small browser helpers, and
`styles` holds the design tokens and component styles.

## The JSON file

This is what the app writes out, shortened to one frame:

```jsonc
{
  "format": "matrix-display/1",
  "name": "gear_67",
  "createdAt": "2026-08-28T17:00:00.000Z",

  "geometry": {
    "long": 20,
    "short": 9,
    "rowWidth": [7, 7, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 7, 7, 3],
    "ledCount": 166,
    "levels": 8,
    "lut": [0, 4, 8, 16, 32, 64, 128, 255]
  },

  "playback": {
    "origin": 2,
    "width": 16,
    "tickMs": 10,
    "loop": true
  },

  "frames": [
    {
      "delay": 50,
      "pixels": [[0, 0, 0, 7, 7, 7, 0, 0, 0]],
      "packed": ["0x0003FE00"]
    }
  ]
}
```

The `geometry` block describes the physical panel. It never changes and it is
written into every file so that anything reading one does not have to know the
panel by heart.

The `origin` and `width` fields under `playback` say where the image sits. It
starts at long column `origin` and covers `width` columns, and every frame in
the file carries exactly that many columns. Anything you drew outside the
window is not part of the file at all, which is why the app warns you on screen
when lit LEDs are about to be left behind.

Each frame gives you the same pixels twice. The `pixels` array is the editable
form, one row of nine brightness levels per long column, lowest column first.
The `packed` array is the firmware form, one unsigned 32 bit word per long
column with pixel x sitting at bits 3x through 3x plus 2, so that whatever
consumes the file does not have to work the bit order out again. When you
import a file, either one is enough.

One field is worth explaining. `tickMs` is a viewing convention rather than
something the hardware reports. The panel counts delay ticks and says nothing
about how long a tick lasts, but the app needs a figure in milliseconds to time
the preview and the GIF. Ten is the assumed default. If a tick turns out to be
something else, change it in the Export panel and everything retimes.

## Keyboard

Number keys 0 through 7 pick a brightness level. Left and right arrows step
through frames. Space plays and pauses. Cmd Z undoes and Shift Cmd Z redoes.

If you focus the grid itself, the arrow keys move a cursor around it and Enter
paints, so the whole editor is usable without a mouse.

## Publishing

Every push to `main` builds the app and publishes it to GitHub Pages through
the workflow in `.github/workflows/deploy.yml`. Pull requests run exactly the
same build without deploying, so a broken build is caught before it merges.

On a fresh clone you need to point GitHub at the workflow once: go to Settings,
then Pages, and set the source to GitHub Actions. Assets are referenced
relatively, so the build works from any path without further configuration.

## Licence

MIT
