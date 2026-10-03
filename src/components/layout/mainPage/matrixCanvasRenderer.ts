const tileSize = 32;
const antialiasPad = 2;

interface Commands {
  count: number;
  indices: Uint32Array;
  present: Uint8Array;
  glyph: Int32Array;
  color: string[];
  alpha: Float64Array;
  offsetX: Float64Array;
  offsetY: Float64Array;
  square: Uint8Array;
  left: Int32Array;
  top: Int32Array;
  right: Int32Array;
  bottom: Int32Array;
}

function allocateCommands(size: number): Commands {
  return {
    count: 0,
    indices: new Uint32Array(size),
    present: new Uint8Array(size),
    glyph: new Int32Array(size),
    color: new Array<string>(size),
    alpha: new Float64Array(size),
    offsetX: new Float64Array(size),
    offsetY: new Float64Array(size),
    square: new Uint8Array(size),
    left: new Int32Array(size),
    top: new Int32Array(size),
    right: new Int32Array(size),
    bottom: new Int32Array(size),
  };
}

interface MatrixCanvasRenderer {
  resize: (
    width: number,
    height: number,
    dpr: number,
    cols: number,
    rows: number
  ) => void;
  beginFrame: () => void;
  draw: (
    index: number,
    glyph: string,
    color: string,
    alpha: number,
    offsetX: number,
    offsetY: number,
    square: boolean
  ) => void;
  endFrame: () => void;
}

/** Retains unchanged native pixels; dirty rectangles repaint in draw order. */
export function createMatrixCanvasRenderer(
  ctx: CanvasRenderingContext2D,
  cellSize: number,
  glyphs: string
): MatrixCanvasRenderer {
  const canvas = ctx.canvas;
  const glyphValues: string[] = [];
  const glyphIndices: Record<string, number> = Object.create(null);
  for (const glyph of glyphs) {
    if (glyphIndices[glyph] === undefined) {
      glyphIndices[glyph] = glyphValues.length;
      glyphValues.push(glyph);
    }
  }
  const glyphLeft = new Float64Array(glyphValues.length);
  const glyphTop = new Float64Array(glyphValues.length);
  const glyphRight = new Float64Array(glyphValues.length);
  const glyphBottom = new Float64Array(glyphValues.length);
  const halfCell = cellSize / 2;
  let measuredFont = '';
  let measuredAlign: CanvasTextAlign | null = null;
  let measuredBaseline: CanvasTextBaseline | null = null;
  let width = 0;
  let height = 0;
  let dpr = 1;
  let backingWidth = 0;
  let backingHeight = 0;
  let cellCount = 0;
  let tileColumns = 0;
  let tileRows = 0;
  let dirtyCount = 0;
  let fullRepaint = true;
  let fractionalRight = false;
  let fractionalBottom = false;
  let cellX: Float64Array;
  let cellY: Float64Array;
  let dirty: Uint8Array;
  let previous: Commands;
  let current: Commands;

  function measureGlyphs() {
    if (
      measuredFont === ctx.font &&
      measuredAlign === ctx.textAlign &&
      measuredBaseline === ctx.textBaseline
    ) {
      return;
    }
    measuredFont = ctx.font;
    measuredAlign = ctx.textAlign;
    measuredBaseline = ctx.textBaseline;
    for (let i = 0; i < glyphValues.length; i++) {
      const metrics = ctx.measureText(glyphValues[i]);
      glyphLeft[i] = metrics.actualBoundingBoxLeft;
      glyphTop[i] = metrics.actualBoundingBoxAscent;
      glyphRight[i] = metrics.actualBoundingBoxRight;
      glyphBottom[i] = metrics.actualBoundingBoxDescent;
    }
    fullRepaint = true;
  }

  function resize(
    nextWidth: number,
    nextHeight: number,
    nextDpr: number,
    cols: number,
    rows: number
  ) {
    width = nextWidth;
    height = nextHeight;
    dpr = nextDpr;
    backingWidth = canvas.width;
    backingHeight = canvas.height;
    cellCount = cols * rows;
    tileColumns = Math.ceil(backingWidth / tileSize);
    tileRows = Math.ceil(backingHeight / tileSize);
    dirty = new Uint8Array(tileColumns * tileRows);
    cellX = new Float64Array(cellCount);
    cellY = new Float64Array(cellCount);
    previous = allocateCommands(cellCount);
    current = allocateCommands(cellCount);
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const index = r * cols + c;
        cellX[index] = c * cellSize;
        cellY[index] = r * cellSize;
      }
    }
    // Preserve the original CSS clear extent, including rounded-up DPR edges.
    fractionalRight = width * dpr < backingWidth;
    fractionalBottom = height * dpr < backingHeight;
    dirtyCount = 0;
    fullRepaint = true;
    measureGlyphs();
  }

  function markTile(tile: number) {
    if (dirty[tile] === 0) {
      dirty[tile] = 1;
      dirtyCount++;
      if (dirtyCount > dirty.length / 2) fullRepaint = true;
    }
  }

  function markCommand(commands: Commands, index: number) {
    if (fullRepaint) return;
    const left = commands.left[index];
    const right = commands.right[index];
    const bottom = commands.bottom[index];
    for (let y = commands.top[index]; y <= bottom; y++) {
      const row = y * tileColumns;
      for (let x = left; x <= right; x++) {
        markTile(row + x);
        if (fullRepaint) return;
      }
    }
  }

  function beginFrame() {
    current.count = 0;
    current.present.fill(0);
    dirty.fill(0);
    dirtyCount = 0;
    measureGlyphs();
    if (!fullRepaint) {
      // A fractional outer clear can retain coverage from the preceding frame.
      if (fractionalRight) {
        for (let y = 0; y < tileRows; y++) {
          markTile(y * tileColumns + tileColumns - 1);
        }
      }
      if (fractionalBottom) {
        const row = (tileRows - 1) * tileColumns;
        for (let x = 0; x < tileColumns; x++) markTile(row + x);
      }
    }
  }

  function draw(
    index: number,
    glyph: string,
    color: string,
    alpha: number,
    offsetX: number,
    offsetY: number,
    square: boolean
  ) {
    const glyphIndex = square ? -1 : glyphIndices[glyph];
    const squareFlag = square ? 1 : 0;
    current.indices[current.count++] = index;
    current.present[index] = 1;
    current.glyph[index] = glyphIndex;
    current.color[index] = color;
    current.alpha[index] = alpha;
    current.offsetX[index] = offsetX;
    current.offsetY[index] = offsetY;
    current.square[index] = squareFlag;

    if (
      !fullRepaint &&
      previous.present[index] !== 0 &&
      previous.glyph[index] === glyphIndex &&
      previous.color[index] === color &&
      previous.alpha[index] === alpha &&
      previous.offsetX[index] === offsetX &&
      previous.offsetY[index] === offsetY &&
      previous.square[index] === squareFlag
    ) {
      current.left[index] = previous.left[index];
      current.top[index] = previous.top[index];
      current.right[index] = previous.right[index];
      current.bottom[index] = previous.bottom[index];
      return;
    }

    const x = cellX[index] + offsetX;
    const y = cellY[index] + offsetY;
    const glyphX = cellX[index] + halfCell + offsetX;
    const glyphY = cellY[index] + halfCell + 1 + offsetY;
    const left = square ? x : glyphX - glyphLeft[glyphIndex];
    const top = square ? y : glyphY - glyphTop[glyphIndex];
    const right = square ? x + cellSize : glyphX + glyphRight[glyphIndex];
    const bottom = square ? y + cellSize : glyphY + glyphBottom[glyphIndex];
    current.left[index] = Math.max(
      0,
      Math.floor((Math.floor(left * dpr) - antialiasPad) / tileSize)
    );
    current.top[index] = Math.max(
      0,
      Math.floor((Math.floor(top * dpr) - antialiasPad) / tileSize)
    );
    current.right[index] = Math.min(
      tileColumns - 1,
      Math.floor((Math.ceil(right * dpr) + antialiasPad - 1) / tileSize)
    );
    current.bottom[index] = Math.min(
      tileRows - 1,
      Math.floor((Math.ceil(bottom * dpr) + antialiasPad - 1) / tileSize)
    );
    if (!fullRepaint) {
      if (previous.present[index] !== 0) markCommand(previous, index);
      markCommand(current, index);
    }
  }

  function overlapsDirty(index: number) {
    for (let y = current.top[index]; y <= current.bottom[index]; y++) {
      const row = y * tileColumns;
      for (let x = current.left[index]; x <= current.right[index]; x++) {
        if (dirty[row + x] !== 0) return true;
      }
    }
    return false;
  }

  function repaint(all: boolean) {
    let lastColor: string | null = null;
    let lastAlpha = ctx.globalAlpha;
    for (let position = 0; position < current.count; position++) {
      const index = current.indices[position];
      if (!all && !overlapsDirty(index)) {
        continue;
      }
      const color = current.color[index];
      const alpha = current.alpha[index];
      if (color !== lastColor) {
        ctx.fillStyle = color;
        lastColor = color;
      }
      if (alpha !== lastAlpha) {
        ctx.globalAlpha = alpha;
        lastAlpha = alpha;
      }
      const x = cellX[index] + current.offsetX[index];
      const y = cellY[index] + current.offsetY[index];
      if (current.square[index] !== 0) {
        ctx.fillRect(x, y, cellSize, cellSize);
      } else {
        ctx.fillText(
          glyphValues[current.glyph[index]],
          cellX[index] + halfCell + current.offsetX[index],
          cellY[index] + halfCell + 1 + current.offsetY[index]
        );
      }
    }
    if (lastAlpha !== 1) ctx.globalAlpha = 1;
  }

  function endFrame() {
    if (!fullRepaint) {
      for (
        let position = 0;
        position < previous.count && !fullRepaint;
        position++
      ) {
        const index = previous.indices[position];
        if (current.present[index] === 0) {
          markCommand(previous, index);
        }
      }
    }
    if (fullRepaint) {
      ctx.clearRect(0, 0, width, height);
      repaint(true);
    } else if (dirtyCount !== 0) {
      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.beginPath();
      for (let y = 0; y < tileRows; y++) {
        const row = y * tileColumns;
        let x = 0;
        while (x < tileColumns) {
          if (dirty[row + x] === 0) {
            x++;
            continue;
          }
          const start = x;
          while (x < tileColumns && dirty[row + x] !== 0) x++;
          const left = start * tileSize;
          const top = y * tileSize;
          ctx.rect(
            left,
            top,
            Math.min(x * tileSize, backingWidth) - left,
            Math.min(top + tileSize, backingHeight) - top
          );
          ctx.clearRect(
            left,
            top,
            Math.max(0, Math.min(x * tileSize, width * dpr) - left),
            Math.max(0, Math.min(top + tileSize, height * dpr) - top)
          );
        }
      }
      ctx.clip();
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      repaint(false);
      ctx.restore();
    }
    const swap = previous;
    previous = current;
    current = swap;
    fullRepaint = false;
  }

  return { resize, beginFrame, draw, endFrame };
}
