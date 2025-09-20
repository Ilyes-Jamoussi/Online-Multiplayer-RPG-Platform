import { Injectable, signal } from '@angular/core';
import { GameEditorDto } from '@app/api/model/gameEditorDto';
import { GameEditorPlaceableDto } from '@app/api/model/gameEditorPlaceableDto';
import { GameEditorTileDto } from '@app/api/model/gameEditorTileDto';
import { GameMode } from '@common/enums/game-mode.enum';
import { MapSize } from '@common/enums/map-size.enum';
import { GameHttpService } from '@app/services/game-http/game-http.service';
import { take, tap } from 'rxjs/operators';
import { TileKind } from '@common/enums/tile-kind.enum';

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
    });

    private readonly _name = signal<string>('');
    private readonly _description = signal<string>('');
    private readonly _tiles = signal<GameEditorTileDto[]>([]);
    private readonly _objects = signal<GameEditorPlaceableDto[]>([]);
    private readonly _size = signal<MapSize>(MapSize.MEDIUM);

    get initial() {
        return this._initial.asReadonly();
    }
    get name() {
        return this._name.asReadonly();
    }
    get description() {
        return this._description.asReadonly();
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

    constructor(private readonly http: GameHttpService) {}

    loadGameById(id: string): void {
        this.http
            .getGameEditorById(id)
            .pipe(
                take(1),
                tap((game) => {
                    this._initial.set(game);
                    this._name.set(game.name);
                    this._description.set(game.description);
                    this._tiles.set(game.tiles);
                    this._objects.set(game.objects);
                    this._size.set(game.size);
                }),
            )
            .subscribe();
    }

    // private getCoordByIndex(index: number): { x: number; y: number } {
    //     const width = this.size();
    //     return { x: index % width, y: Math.floor(index / width) };
    // }

    private getIndexByCoord(x: number, y: number): number {
        const width = this.size();
        return y * width + x;
    }

    getTileAt(x: number, y: number): GameEditorTileDto | undefined {
        const index = this.getIndexByCoord(x, y);
        return this._tiles()[index];
    }

    setTileAt(x: number, y: number, kind: TileKind): void {
        const index = this.getIndexByCoord(x, y);
        const tiles = this.tiles();
        if (index < 0 || index >= tiles.length) return;
        const newTiles = [...tiles];
        const currentTile = newTiles[index];
        if (currentTile.kind !== TileKind.DOOR && currentTile.kind === kind) return;
        const open = currentTile.kind !== TileKind.DOOR ? false : !currentTile.open;
        newTiles[index] = { x, y, kind, open };
        this._tiles.set(newTiles);
    }

    resetTileAt(x: number, y: number): void {
        const index = this.getIndexByCoord(x, y);
        const tiles = this.tiles();
        if (index < 0 || index >= tiles.length) return;
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
}
