import { Grid } from '@app/pages/admin-page/edit-game-page/interfaces/game-editor.interface';

export function indexOf(x: number, y: number, width: number): number {
    return y * width + x;
}

export function inBounds(x: number, y: number, g: Grid): boolean {
    return x >= 0 && y >= 0 && x < g.width && y < g.height;
}

export function coordOf(index: number, width: number): { x: number; y: number } {
    return { x: index % width, y: Math.floor(index / width) };
}
