import { computed, Injectable, signal } from '@angular/core';
import { GameEditorDto } from '@app/dto/gameEditorDto';
import { GameEditorPlaceableDto } from '@app/dto/gameEditorPlaceableDto';
import { GameEditorTileDto } from '@app/dto/gameEditorTileDto';
import { GameMode } from '@common/enums/game-mode.enum';
import { MapSize } from '@common/enums/map-size.enum';
import { GameHttpService } from '@app/services/game-http/game-http.service';
import { catchError, finalize, take, tap } from 'rxjs/operators';
import { TileKind } from '@common/enums/tile-kind.enum';
import { PatchGameEditorDto } from '@app/dto/patchGameEditorDto';
import { ExtendedGameEditorPlaceableDto, Inventory, PLACEABLE_ORDER } from '@app/interfaces/game-editor.interface';
import { PlaceableFootprint, PlaceableKind } from '@common/enums/placeable-kind.enum';
import { of } from 'rxjs';

@Injectable()
export class GameEditorStoreService {
    private readonly _initial = signal<GameEditorDto>({
        id: '',
        name: '',
        description: '',
        size: MapSize.MEDIUM,
        mode: GameMode.CLASSIC,
        tiles: [],
        objects: [],
        lastModified: new Date().toISOString(),
        gridPreviewUrl: '',
    });

    private readonly _id = signal<string>('');
    private readonly _name = signal<string>('');
    private readonly _description = signal<string>('');
    private readonly _tiles = signal<GameEditorTileDto[]>([]);
    private readonly _objects = signal<GameEditorPlaceableDto[]>([]);
    private readonly _size = signal<MapSize>(MapSize.MEDIUM);
    private readonly _gridPreviewUrl = signal<string>('');
    private readonly _mode = signal<GameMode>(GameMode.CLASSIC);

    private readonly _tileSizePx = signal<number>(0);

    private readonly _loadingGame = signal<boolean>(false);
    private readonly _loadError = signal<string | null>(null);

    get placedObjects(): ExtendedGameEditorPlaceableDto[] {
        const objs = this._objects();
        const placed = objs.filter((o) => o.placed);
        const acc: ExtendedGameEditorPlaceableDto[] = [];

        for (const o of placed) {
            const footprint = PlaceableFootprint[PlaceableKind[o.kind]];
            const xs: number[] = [];
            const ys: number[] = [];
            for (let dx = 0; dx < footprint; dx++) {
                for (let dy = 0; dy < footprint; dy++) {
                    xs.push(o.x + dx);
                    ys.push(o.y + dy);
                }
            }
            acc.push({
                id: o.id,
                kind: o.kind,
                orientation: o.orientation,
                placed: o.placed,
                x: o.x,
                y: o.y,
                xs,
                ys,
            });
        }

        return acc;
    }

    /** Unplaced objects in the editor */
    readonly inventory = computed<Inventory>(() => {
        const objs = this._objects();
        const inv: Inventory = {} as Inventory;

        for (const o of objs) {
            const kind = PlaceableKind[o.kind];
            if (!inv[kind]) {
                inv[kind] = { kind, total: 0, remaining: 0, disabled: false };
            }
            inv[kind]!.total += 1;
            if (!o.placed) {
                inv[kind]!.remaining += 1;
            }
        }

        for (const k of PLACEABLE_ORDER) {
            if (!inv[k]) {
                inv[k] = { total: 0, remaining: 0, kind: k, disabled: true };
            } else {
                inv[k]!.disabled = inv[k]!.remaining === 0;
            }
        }

        return inv;
    });

    get isLoading() {
        return this._loadingGame.asReadonly();
    }

    get loadError() {
        return this._loadError.asReadonly();
    }

    get initial() {
        return this._initial.asReadonly();
    }

    get name() {
        return this._name();
    }
    set name(value: string) {
        this._name.set(value);
    }

    get description() {
        return this._description();
    }

    set description(value: string) {
        this._description.set(value);
    }

    get tiles() {
        return this._tiles.asReadonly();
    }

    get objects() {
        return this._objects.asReadonly();
    }

    get size() {
        return this._size.asReadonly();
    }

    get gridPreviewUrl() {
        return this._gridPreviewUrl.asReadonly();
    }

    get mode() {
        return this._mode.asReadonly();
    }

    get tileSizePx() {
        return this._tileSizePx();
    }
    set tileSizePx(value: number) {
        this._tileSizePx.set(value);
    }

    constructor(private readonly gameHttpService: GameHttpService) {}

    loadGameById(id: string): void {
        this._loadingGame.set(true);
        this._loadError.set(null);

        this.gameHttpService
            .getGameEditorById(id)
            .pipe(
                take(1),
                tap((game) => {
                    if (!game) {
                        this._loadError.set(`Game with ID ${id} not found`);
                        return;
                    }
                    this._id.set(game.id);
                    this._initial.set(game);
                    this._name.set(game.name);
                    this._description.set(game.description);
                    this._tiles.set(game.tiles);
                    this._objects.set(game.objects);
                    this._size.set(game.size);
                    this._gridPreviewUrl.set(game.gridPreviewUrl);
                    this._mode.set(game.mode as GameMode);
                }),
                catchError((error) => {
                    this._loadError.set(error?.message);
                    return of(null);
                }),
                finalize(() => {
                    this._loadingGame.set(false);
                }),
            )
            .subscribe();
    }

    saveGame(gridPreviewImage?: string): void {
        const game: PatchGameEditorDto = {
            name: this._name() !== this._initial().name ? this._name() : undefined,
            description: this._description() !== this._initial().description ? this._description() : undefined,
            tiles: this._tiles() !== this._initial().tiles ? this._tiles() : undefined,
            objects: this._objects() !== this._initial().objects ? this._objects() : undefined,
            gridPreviewUrl: gridPreviewImage,
        };

       this.gameHttpService.patchGameEditorById(this._id(), game).subscribe();
    }

    getTileAt(x: number, y: number): GameEditorTileDto | undefined {
        if (x < 0 || y < 0 || x >= this.size() || y >= this.size()) return undefined;
        const index = this.getIndexByCoord(x, y);
        return this._tiles()[index];
    }

    setTileAt(x: number, y: number, kind: TileKind): void {
        if (x < 0 || y < 0 || x >= this.size() || y >= this.size()) return;
        const index = this.getIndexByCoord(x, y);
        const tiles = this.tiles();
        const newTiles = [...tiles];
        const currentTile = newTiles[index];
        if (currentTile.kind !== TileKind.DOOR && currentTile.kind === kind) return;
        const open = currentTile.kind !== TileKind.DOOR ? false : !currentTile.open;
        newTiles[index] = { x, y, kind, open };
        this._tiles.set(newTiles);
    }

    resetTileAt(x: number, y: number): void {
        if (x < 0 || y < 0 || x >= this.size() || y >= this.size()) return;
        const index = this.getIndexByCoord(x, y);
        const tiles = this.tiles();
        const newTiles = [...tiles];
        newTiles[index] = { x, y, kind: TileKind.BASE };
        this._tiles.set(newTiles);
    }

    reset(): void {
        const initial = this._initial();
        this._name.set(initial.name);
        this._description.set(initial.description);
        this._tiles.set(initial.tiles);
        this._objects.set(initial.objects);
        this._size.set(initial.size);
    }

    getPlacedObjectAt(x: number, y: number): GameEditorPlaceableDto | undefined {
        return this.placedObjects.find((o) => o.xs.includes(x) && o.ys.includes(y));
    }

    placeObject(kind: PlaceableKind, x: number, y: number): void {
        if (x < 0 || y < 0 || x >= this.size() || y >= this.size()) return;
        const objects = this._objects();
        const newObjects = [...objects];
        const objIndex = newObjects.findIndex((o) => o.kind === PlaceableKind[kind] && !o.placed);
        if (objIndex === -1) return;
        const existing = this.getPlacedObjectAt(x, y);
        if (existing) return;
        newObjects[objIndex] = { ...newObjects[objIndex], x, y, placed: true };
        this._objects.set(newObjects);
    }

    moveObject(id: string, x: number, y: number): void {
        if (x < 0 || y < 0 || x >= this.size() || y >= this.size()) return;
        const objects = this.objects();
        const newObjects = [...objects];
        const objIndex = newObjects.findIndex((o) => o.id === id);
        if (objIndex === -1) return;
        const existing = this.getPlacedObjectAt(x, y);
        if (existing && existing.id !== id) return;
        newObjects[objIndex] = { ...newObjects[objIndex], x, y, placed: x >= 0 && y >= 0 };
        this._objects.set(newObjects);
    }

    removeObject(id: string): void {
        const objects = this.objects();
        const newObjects = [...objects];
        const objIndex = newObjects.findIndex((o) => o.id === id);
        if (objIndex === -1) return;
        newObjects[objIndex] = { ...newObjects[objIndex], x: -1, y: -1, placed: false };
        this._objects.set(newObjects);
    }

    private getIndexByCoord(x: number, y: number): number {
        const width = this.size();
        return y * width + x;
    }
}
