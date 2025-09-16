import { Injectable } from '@angular/core';
import { GameDraftService } from './game-draft.service';
import { TileSpec, Grid } from '@app/interfaces/game/game-editor.interface';
import { inBounds, indexOf } from '@app/services/game/utils/grid-utils';
import { TileKind } from '@common/enums/tile-kind.enum';

@Injectable({
    providedIn: 'root',
})
export class TileService {
    constructor(private readonly draftService: GameDraftService) {}

    /** Exposed Methods */
    applyPaint(x: number, y: number): void {
        this.draftService.update((draft) => {
            const tool = draft.editor?.activeTool;
            if (!tool || tool.type !== 'TILE_BRUSH') return draft;
            const tile = this.getTile(draft.grid, x, y);
            if (tile.kind === TileKind.DOOR && tool.tile === TileKind.DOOR) {
                const idx = indexOf(x, y, draft.grid.width);
                const tiles = draft.grid.tiles.slice();
                tiles[idx] = { kind: TileKind.DOOR, open: !tile.open };
                return { ...draft, grid: { ...draft.grid, tiles } };
            }

            if (tile.kind === tool.tile && tile.kind !== TileKind.DOOR) return draft;

            return { ...draft, grid: this.setTile(draft.grid, x, y, tool.tile) };
        });
    }

    applyRightClick(x: number, y: number): void {
        this.draftService.update((draft) => {
            const tool = draft.editor?.activeTool;
            if (!tool || tool.type !== 'TILE_BRUSH') return draft;

            const tile = this.getTile(draft.grid, x, y);
            if (tile.kind === TileKind.BASE) return draft;

            return { ...draft, grid: this.setTile(draft.grid, x, y, TileKind.BASE) };
        });
    }

    dragPaint(x: number, y: number): void {
        this.draftService.update((draft) => {
            const tool = draft.editor?.activeTool;
            if (!tool || tool.type !== 'TILE_BRUSH' || (!tool.leftDrag && !tool.rightDrag)) return draft;

            if (tool.leftDrag) {
                const tile = this.getTile(draft.grid, x, y);
                if (tile.kind === tool.tile) return draft;
                return { ...draft, grid: this.setTile(draft.grid, x, y, tool.tile) };
            } else {
                const tile = this.getTile(draft.grid, x, y);
                if (tile.kind === TileKind.BASE) return draft;
                return { ...draft, grid: this.setTile(draft.grid, x, y, TileKind.BASE) };
            }
        });
    }

    dragRightClick(x: number, y: number): void {
        this.draftService.update((draft) => {
            const tool = draft.editor?.activeTool;
            if (!tool || tool.type !== 'TILE_BRUSH' || !tool.rightDrag) return draft;

            const tile = this.getTile(draft.grid, x, y);
            if (tile.kind === TileKind.BASE) return draft;

            return { ...draft, grid: this.setTile(draft.grid, x, y, TileKind.BASE) };
        });
    }

    /** Private Helpers */
    private getTile(grid: Grid, x: number, y: number): TileSpec {
        const idx = indexOf(x, y, grid.width);
        return grid.tiles[idx];
    }
    private setTile(grid: Grid, x: number, y: number, tile: TileKind): Grid {
        if (!inBounds(x, y, grid)) return grid;
        const idx = indexOf(x, y, grid.width);
        const tiles = grid.tiles.slice();
        tiles[idx] = { kind: tile };
        return { ...grid, tiles };
    }
}
