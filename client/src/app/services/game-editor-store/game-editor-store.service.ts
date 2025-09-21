import { Injectable, signal } from '@angular/core';
import { GameEditorDto } from '@app/api/model/gameEditorDto';
import { GameEditorPlaceableDto } from '@app/api/model/gameEditorPlaceableDto';
import { GameEditorTileDto } from '@app/api/model/gameEditorTileDto';
import { GameMode } from '@common/enums/game-mode.enum';
import { MapSize } from '@common/enums/map-size.enum';
import { GameHttpService } from '@app/services/game-http/game-http.service';
import { take, tap } from 'rxjs/operators';
import { TileKind } from '@common/enums/tile-kind.enum';
import { PatchGameEditorDto } from '@app/api/model/patchGameEditorDto';

@Injectable({ providedIn: 'root' })
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

    constructor(private readonly http: GameHttpService) {}

    loadGameById(id: string): void {
        this.http
            .getGameEditorById(id)
            .pipe(
                take(1),
                tap((game) => {
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
            )
            .subscribe();
    }

    saveGame(): void {
        const game: PatchGameEditorDto = {
            name: this._name() !== this._initial().name ? this._name() : undefined,
            description: this._description() !== this._initial().description ? this._description() : undefined,
            tiles: this._tiles() !== this._initial().tiles ? this._tiles() : undefined,
            // objects: this._objects() !== this._initial().objects ? this._objects() : undefined,
        };
        this.http
            .patchGameEditorById(this._id(), game)
            .pipe(take(1))
            .subscribe((updated) => {
                this._initial.set(updated);
                this._name.set(updated.name);
                this._description.set(updated.description);
                this._tiles.set(updated.tiles);
                this._objects.set(updated.objects);
                this._size.set(updated.size);
                this._gridPreviewUrl.set(updated.gridPreviewUrl);
            });
    }

    getTileAt(x: number, y: number): GameEditorTileDto | undefined {
        if (x < 0 || y < 0 || x >= this.size() || y >= this.size()) return undefined;
        const index = this.getIndexByCoord(x, y);
        return this._tiles()[index];
    }

    setTileAt(x: number, y: number, kind: TileKind): void {
        if(x < 0 || y < 0 || x >= this.size() || y >= this.size()) return;
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
        if(x < 0 || y < 0 || x >= this.size() || y >= this.size()) return;
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

    private getIndexByCoord(x: number, y: number): number {
        const width = this.size();
        return y * width + x;
    }
}
