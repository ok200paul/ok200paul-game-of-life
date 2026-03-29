/**
 * Game of Life — self-contained loader.
 *
 * Usage:
 *   import { start } from "./module.js";
 *   start(document.getElementById("my-canvas"));
 *
 * Or with options:
 *   start(canvas, { wasmUrl: "./wasm_game_of_life_bg.wasm", cellSize: 5 });
 */

const CELL_SIZE_DEFAULT = 5;
const GRID_COLOR = "#CCCCCC";
const DEAD_COLOR = "#FFFFFF";
const ALIVE_COLOR = "#000000";

export async function start(canvas, options = {}) {
  const {
    wasmUrl = new URL("./wasm_game_of_life_bg.wasm", import.meta.url).href,
    cellSize = CELL_SIZE_DEFAULT,
  } = options;

  // Heap for externref values used by wasm-bindgen.
  const heap = [undefined, null, true, false];
  let heapNext = heap.length;

  function addToHeap(obj) {
    if (heapNext === heap.length) heap.push(heap.length + 1);
    const idx = heapNext;
    heapNext = heap[idx];
    heap[idx] = obj;
    return idx;
  }

  function getFromHeap(idx) { return heap[idx]; }

  function dropFromHeap(idx) {
    if (idx < 4) return; // builtin slots
    heap[idx] = heapNext;
    heapNext = idx;
  }

  // Decode a wasm string from linear memory.
  function getStringFromWasm(ptr, len, memory) {
    return new TextDecoder("utf-8").decode(
      new Uint8Array(memory.buffer, ptr, len)
    );
  }

  // Import object satisfying wasm-bindgen's requirements.
  // These are used for panic / error reporting only.
  const imports = {
    "./wasm_game_of_life_bg.js": {
      // Creates a new Error object (used by panic hook).
      __wbg_new_227d7c05414eb861: () => addToHeap(new Error()),

      // Reads Error.stack and writes it into wasm memory.
      __wbg_stack_3b0d974bbf31e44f: (retPtr, errIdx) => {
        const stack = getFromHeap(errIdx).stack || "";
        // We need to allocate in wasm memory — use the exported malloc.
        const encoder = new TextEncoder();
        const encoded = encoder.encode(stack);
        const ptr = wasm.__wbindgen_malloc(encoded.length, 1);
        new Uint8Array(wasm.memory.buffer, ptr, encoded.length).set(encoded);
        // retPtr is a pointer to two i32s: [ptr, len]
        const view = new DataView(wasm.memory.buffer);
        view.setInt32(retPtr, ptr, true);
        view.setInt32(retPtr + 4, encoded.length, true);
      },

      // Logs an error string to console.error.
      __wbg_error_a6fa202b58aa1cd3: (ptr, len) => {
        console.error(getStringFromWasm(ptr, len, wasm.memory));
      },

      // Throws a JS error from a wasm string.
      __wbg___wbindgen_throw_5549492daedad139: (ptr, len) => {
        throw new Error(getStringFromWasm(ptr, len, wasm.memory));
      },

      // Initialises the externref table.
      __wbindgen_init_externref_table: () => {
        const table = wasm.__wbindgen_externrefs;
        const offset = table.grow(4);
        table.set(0, undefined);
        table.set(offset + 1, null);
        table.set(offset + 2, true);
        table.set(offset + 3, false);
      },
    },
  };

  // Load and instantiate the raw wasm module.
  const response = await fetch(wasmUrl);
  const { instance } = await WebAssembly.instantiateStreaming(response, imports);
  const wasm = instance.exports;

  // Run the wasm-bindgen start function to initialise the module.
  wasm.__wbindgen_start();

  // Create a universe and read its dimensions.
  const universe = wasm.universe_new();
  const width = wasm.universe_width(universe);
  const height = wasm.universe_height(universe);

  // Size the canvas.
  canvas.height = (cellSize + 1) * height + 1;
  canvas.width = (cellSize + 1) * width + 1;
  const ctx = canvas.getContext("2d");

  // --- helpers ---

  const getIndex = (row, col) => row * width + col;

  const drawGrid = () => {
    ctx.beginPath();
    ctx.strokeStyle = GRID_COLOR;

    for (let i = 0; i <= width; i++) {
      ctx.moveTo(i * (cellSize + 1) + 1, 0);
      ctx.lineTo(i * (cellSize + 1) + 1, (cellSize + 1) * height + 1);
    }
    for (let j = 0; j <= height; j++) {
      ctx.moveTo(0, j * (cellSize + 1) + 1);
      ctx.lineTo((cellSize + 1) * width + 1, j * (cellSize + 1) + 1);
    }
    ctx.stroke();
  };

  const drawCells = () => {
    const cellsPtr = wasm.universe_cells(universe);
    const cells = new Uint8Array(wasm.memory.buffer, cellsPtr, width * height);

    ctx.beginPath();

    ctx.fillStyle = ALIVE_COLOR;
    for (let row = 0; row < height; row++) {
      for (let col = 0; col < width; col++) {
        if (cells[getIndex(row, col)] !== 1) continue;
        ctx.fillRect(
          col * (cellSize + 1) + 1,
          row * (cellSize + 1) + 1,
          cellSize,
          cellSize
        );
      }
    }

    ctx.fillStyle = DEAD_COLOR;
    for (let row = 0; row < height; row++) {
      for (let col = 0; col < width; col++) {
        if (cells[getIndex(row, col)] !== 0) continue;
        ctx.fillRect(
          col * (cellSize + 1) + 1,
          row * (cellSize + 1) + 1,
          cellSize,
          cellSize
        );
      }
    }

    ctx.stroke();
  };

  // --- click to toggle ---

  canvas.addEventListener("click", (event) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const canvasLeft = (event.clientX - rect.left) * scaleX;
    const canvasTop = (event.clientY - rect.top) * scaleY;
    const row = Math.min(Math.floor(canvasTop / (cellSize + 1)), height - 1);
    const col = Math.min(Math.floor(canvasLeft / (cellSize + 1)), width - 1);

    wasm.universe_toggle_cell(universe, row, col);
    drawCells();
    drawGrid();
  });

  // --- animation loop ---

  let animationId = null;

  const renderLoop = () => {
    for (let i = 0; i < 9; i++) {
      wasm.universe_tick(universe);
    }
    drawGrid();
    drawCells();
    animationId = requestAnimationFrame(renderLoop);
  };

  const play = () => {
    animationId = requestAnimationFrame(renderLoop);
  };

  const pause = () => {
    if (animationId !== null) {
      cancelAnimationFrame(animationId);
      animationId = null;
    }
  };

  const isPaused = () => animationId === null;

  // Start immediately.
  play();

  // Return controls so the host can pause/resume/stop.
  return { play, pause, isPaused, universe, wasm };
}
