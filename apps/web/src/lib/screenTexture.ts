import * as THREE from "three"

const DIGITS: Record<string, number[][]> = {
  "0": [
    [0, 1, 1, 1, 0],
    [1, 0, 0, 0, 1],
    [1, 0, 0, 0, 1],
    [1, 0, 0, 0, 1],
    [1, 0, 0, 0, 1],
    [1, 0, 0, 0, 1],
    [0, 1, 1, 1, 0],
  ],
  "1": [
    [0, 0, 1, 0, 0],
    [0, 1, 1, 0, 0],
    [0, 0, 1, 0, 0],
    [0, 0, 1, 0, 0],
    [0, 0, 1, 0, 0],
    [0, 0, 1, 0, 0],
    [0, 1, 1, 1, 0],
  ],
  "2": [
    [0, 1, 1, 1, 0],
    [1, 0, 0, 0, 1],
    [0, 0, 0, 0, 1],
    [0, 0, 0, 1, 0],
    [0, 0, 1, 0, 0],
    [0, 1, 0, 0, 0],
    [1, 1, 1, 1, 1],
  ],
  "3": [
    [1, 1, 1, 1, 0],
    [0, 0, 0, 0, 1],
    [0, 0, 0, 0, 1],
    [0, 1, 1, 1, 0],
    [0, 0, 0, 0, 1],
    [0, 0, 0, 0, 1],
    [1, 1, 1, 1, 0],
  ],
  "4": [
    [0, 0, 0, 1, 0],
    [0, 0, 1, 1, 0],
    [0, 1, 0, 1, 0],
    [1, 0, 0, 1, 0],
    [1, 1, 1, 1, 1],
    [0, 0, 0, 1, 0],
    [0, 0, 0, 1, 0],
  ],
  "5": [
    [1, 1, 1, 1, 1],
    [1, 0, 0, 0, 0],
    [1, 1, 1, 1, 0],
    [0, 0, 0, 0, 1],
    [0, 0, 0, 0, 1],
    [1, 0, 0, 0, 1],
    [0, 1, 1, 1, 0],
  ],
  "6": [
    [0, 0, 1, 1, 0],
    [0, 1, 0, 0, 0],
    [1, 0, 0, 0, 0],
    [1, 1, 1, 1, 0],
    [1, 0, 0, 0, 1],
    [1, 0, 0, 0, 1],
    [0, 1, 1, 1, 0],
  ],
  "7": [
    [1, 1, 1, 1, 1],
    [0, 0, 0, 0, 1],
    [0, 0, 0, 1, 0],
    [0, 0, 1, 0, 0],
    [0, 1, 0, 0, 0],
    [0, 1, 0, 0, 0],
    [0, 1, 0, 0, 0],
  ],
  "8": [
    [0, 1, 1, 1, 0],
    [1, 0, 0, 0, 1],
    [1, 0, 0, 0, 1],
    [0, 1, 1, 1, 0],
    [1, 0, 0, 0, 1],
    [1, 0, 0, 0, 1],
    [0, 1, 1, 1, 0],
  ],
  "9": [
    [0, 1, 1, 1, 0],
    [1, 0, 0, 0, 1],
    [1, 0, 0, 0, 1],
    [0, 1, 1, 1, 1],
    [0, 0, 0, 0, 1],
    [0, 0, 0, 1, 0],
    [0, 1, 1, 0, 0],
  ],
}

const SIZE = 512
const COLS = 11 // 5 + 1 gap + 5
const ROWS = 7

export type ScreenContent =
  | { kind: "minutes"; minutes: number }
  | { kind: "ms"; minutes: number; seconds: number }

export function createScreenTexture(content: ScreenContent): THREE.CanvasTexture {
  const canvas = document.createElement("canvas")
  canvas.width = SIZE
  canvas.height = SIZE
  const ctx = canvas.getContext("2d")!

  // Transparent background — only the digit pixels rotate during the cube tip,
  // so the static bezel shows through everywhere else.
  ctx.clearRect(0, 0, SIZE, SIZE)

  if (content.kind === "minutes") {
    drawTwoDigitRow(ctx, content.minutes, ROWS, COLS, 1.0, 0)
  } else {
    // stacked: minutes on top, seconds below — used for the 14:24 display
    drawTwoDigitRow(ctx, content.minutes, ROWS, COLS, 0.78, -1)
    drawTwoDigitRow(ctx, content.seconds, ROWS, COLS, 0.78, +1)
  }

  const tex = new THREE.CanvasTexture(canvas)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.minFilter = THREE.LinearFilter
  tex.magFilter = THREE.NearestFilter
  tex.anisotropy = 4
  tex.needsUpdate = true
  return tex
}

function drawTwoDigitRow(
  ctx: CanvasRenderingContext2D,
  value: number,
  rows: number,
  cols: number,
  scale: number,
  yBias: -1 | 0 | 1
) {
  const text = String(Math.max(0, Math.min(99, value))).padStart(2, "0")

  const margin = 60
  const usable = SIZE - margin * 2
  const baseCell = Math.min(usable / cols, usable / rows)
  const cell = baseCell * scale

  const gridW = cell * cols
  const gridH = cell * rows
  const x0 = (SIZE - gridW) / 2

  let y0: number
  if (yBias === 0) {
    y0 = (SIZE - gridH) / 2
  } else if (yBias < 0) {
    y0 = SIZE / 2 - gridH - cell * 0.4
  } else {
    y0 = SIZE / 2 + cell * 0.4
  }

  const dotSize = cell * 0.86
  const dotInset = (cell - dotSize) / 2

  ctx.fillStyle = "#fefefe"
  for (let i = 0; i < 2; i++) {
    const ch = text[i]!
    const pattern = DIGITS[ch]
    if (!pattern) continue
    const colOffset = i * 6 // 5 cols + 1 gap
    for (let r = 0; r < 7; r++) {
      for (let c = 0; c < 5; c++) {
        if (pattern[r]![c]) {
          const x = x0 + (colOffset + c) * cell + dotInset
          const y = y0 + r * cell + dotInset
          ctx.fillRect(x, y, dotSize, dotSize)
        }
      }
    }
  }
}
