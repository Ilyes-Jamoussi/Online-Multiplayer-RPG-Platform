/* eslint-disable @typescript-eslint/naming-convention */
// client/src/app/core/services/game-save.service.ts
import { Injectable } from '@angular/core';
// import { HttpClient } from '@angular/common/http';
import { MapSize } from '@common/enums/map-size.enum';
import { GameMode } from '@common/enums/game-mode.enum';
import {
    GameDraft,
    GamePayload,
    PlaceableKind,
    PlaceableObject,
    TileKind,
    TileSpec,
} from '@app/pages/admin-page/edit-game-page/interfaces/game-editor.interface';
import { GameDraftService } from './game-draft.service';
import { coordOf, indexOf } from '@app/services/game/utils/grid-utils';
import { GameHttpService } from '@app/services/game/game-http/game-http.service';
import { map } from 'rxjs';
import { GameDto } from '@app/api/model/gameDto';

@Injectable({ providedIn: 'root' })
export class GameSaveService {
    constructor(
        private readonly draftService: GameDraftService,
        private readonly gameHttpService: GameHttpService, // private http: HttpClient,
    ) {}

    updateGame() {
        const draft = this.draftService.getDraftSnapshot();
        const payload = this.toPayload(draft);
        if (!draft.meta.id) throw new Error('Cannot update a game without an ID.');
        return this.gameHttpService.updateGame(draft.meta.id, payload);
    }

    loadGame$(id: string) {
        return this.gameHttpService.getGameById(id).pipe(
            map((dto) => this.dtoToDraft(dto)), // ta fonction inverse
        );
    }

    private mapSizePreset(preset: GameDraft['meta']['sizePreset']): MapSize {
        switch (preset) {
            case 's':
                return MapSize.Small;
            case 'm':
                return MapSize.Medium;
            case 'l':
                return MapSize.Large;
            default:
                throw new Error(`Size preset inconnu: ${preset}`);
        }
    }

    private mapMode(mode: GameDraft['meta']['mode']): GameMode {
        switch (mode) {
            case 'classic':
                return GameMode.Classic;
            case 'capture-the-flag':
                return GameMode.CaptureTheFlag;
            default:
                throw new Error(`Mode inconnu: ${mode}`);
        }
    }

    private toPayload(draft: GameDraft): GamePayload {
        const { meta, grid, objects } = draft;
        const { width, height, tiles } = grid;

        if (!meta.name?.trim()) throw new Error('Le nom du jeu est requis.');
        if (!meta.description?.trim()) throw new Error('La description est requise.');
        if (width <= 0 || height <= 0) throw new Error('Dimensions de grille invalides.');

        const sparseTiles: GamePayload['tiles'] = [];
        const expected = width * height;
        const len = Math.min(tiles.length, expected);

        for (let i = 0; i < len; i++) {
            const t = tiles[i];
            const { x, y } = coordOf(i, width);

            if (!t) continue;

            if (t.kind === 'BASE') {
                continue;
            }

            const entry: GamePayload['tiles'][number] = { x, y, kind: t.kind };
            if (t.kind === 'DOOR' && typeof t.open === 'boolean') entry.open = t.open;
            // todo implement teleport tiles
            // if (t.kind === 'TELEPORT' && typeof t.endpointId === 'number') entry.endpointId = t.endpointId;

            sparseTiles.push(entry);
        }

        const outObjects: GamePayload['objects'] = Object.values(objects.byId).map((o) => ({
            id: o.id,
            kind: o.kind,
            x: o.position.x,
            y: o.position.y,
            orientation: o.orientation,
        }));

        return {
            name: meta.name,
            description: meta.description,
            size: this.mapSizePreset(meta.sizePreset),
            mode: this.mapMode(meta.mode),
            visibility: false,
            lastModified: new Date(),
            tiles: sparseTiles,
            objects: outObjects,
        };
    }

    private dtoToDraft(dto: GameDto): GameDraft {
        const { size, mode, name, description, tiles, objects, id } = dto;
        const tileCount = size * size;
        const gridTiles: TileSpec[] = Array(tileCount).fill({ kind: 'BASE' });

        tiles.forEach((t) => {
            const x = t.x;
            const y = t.y;
            const index = indexOf(x, y, size);
            if (index < 0 || index >= tileCount) return;
            gridTiles[index] = { kind: t.kind as TileKind, open: t.open ?? false, pairId: '' };
        });

        const objectIds: (string | null)[] = Array(tileCount).fill(null);
        const byId: Record<string, PlaceableObject> = {};

        objects.forEach((o, i) => {
            const x = o.x;
            const y = o.y;
            const index = indexOf(x, y, size);
            if (index < 0 || index >= tileCount) return;
            objectIds[index] = o.id ?? i.toString();
            byId[o.id ?? i.toString()] = { ...o, kind: o.kind as PlaceableKind, id: o.id ?? i.toString(), position: { x, y } };
        });

        const draftMode: GameDraft['meta']['mode'] = mode === 'classic' ? 'classic' : mode === 'capture-the-flag' ? 'capture-the-flag' : 'classic';
        // eslint-disable-next-line @typescript-eslint/no-magic-numbers
        const draftSizePreset: GameDraft['meta']['sizePreset'] = size === 10 ? 's' : size === 15 ? 'm' : size === 20 ? 'l' : 'm';
        const draft: GameDraft = {
            meta: {
                name,
                description,
                sizePreset: draftSizePreset,
                mode: draftMode,
                id,
            },
            grid: {
                width: size,
                height: size,
                tiles: gridTiles,
                objectIds,
            },
            objects: { byId },
            inventory: {
                available: {
                    START: 0,
                    FLAG: 0,
                    HEAL: 0,
                    FIGHT: 0,
                    BOAT: 0,
                },
            },
            editor: {
                activeTool: {
                    type: 'TILE_BRUSH',
                    tile: { kind: TileKind.BASE },
                },
                tileSize: 32,
            },
        };
        return draft;
    }
}
