/* tslint:disable */
/* eslint-disable */

export enum Cell {
    Dead = 0,
    Alive = 1,
}

export class Universe {
    private constructor();
    free(): void;
    [Symbol.dispose](): void;
    cells(): number;
    height(): number;
    static new(): Universe;
    /**
     * Render the current universe state onto the given canvas element.
     * Sizes the canvas automatically based on width, height, and cell_size.
     */
    render(canvas: HTMLCanvasElement, cell_size: number): void;
    /**
     * Set the height of the universe.
     *
     * Resets all cells to the dead state.
     */
    set_height(height: number): void;
    /**
     * Set the width of the universe.
     *
     * Resets all cells to the dead state.
     */
    set_width(width: number): void;
    tick(): void;
    toggle_cell(row: number, column: number): void;
    width(): number;
}

export type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

export interface InitOutput {
    readonly memory: WebAssembly.Memory;
    readonly __wbg_universe_free: (a: number, b: number) => void;
    readonly universe_cells: (a: number) => number;
    readonly universe_height: (a: number) => number;
    readonly universe_new: () => number;
    readonly universe_render: (a: number, b: any, c: number) => void;
    readonly universe_set_height: (a: number, b: number) => void;
    readonly universe_set_width: (a: number, b: number) => void;
    readonly universe_tick: (a: number) => void;
    readonly universe_toggle_cell: (a: number, b: number, c: number) => void;
    readonly universe_width: (a: number) => number;
    readonly __wbindgen_malloc: (a: number, b: number) => number;
    readonly __wbindgen_realloc: (a: number, b: number, c: number, d: number) => number;
    readonly __wbindgen_free: (a: number, b: number, c: number) => void;
    readonly __externref_table_alloc: () => number;
    readonly __wbindgen_externrefs: WebAssembly.Table;
    readonly __wbindgen_exn_store: (a: number) => void;
    readonly __wbindgen_start: () => void;
}

export type SyncInitInput = BufferSource | WebAssembly.Module;

/**
 * Instantiates the given `module`, which can either be bytes or
 * a precompiled `WebAssembly.Module`.
 *
 * @param {{ module: SyncInitInput }} module - Passing `SyncInitInput` directly is deprecated.
 *
 * @returns {InitOutput}
 */
export function initSync(module: { module: SyncInitInput } | SyncInitInput): InitOutput;

/**
 * If `module_or_path` is {RequestInfo} or {URL}, makes a request and
 * for everything else, calls `WebAssembly.instantiate` directly.
 *
 * @param {{ module_or_path: InitInput | Promise<InitInput> }} module_or_path - Passing `InitInput` directly is deprecated.
 *
 * @returns {Promise<InitOutput>}
 */
export default function __wbg_init (module_or_path?: { module_or_path: InitInput | Promise<InitInput> } | InitInput | Promise<InitInput>): Promise<InitOutput>;
