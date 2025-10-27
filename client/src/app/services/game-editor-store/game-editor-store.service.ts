import { computed, Injectable, signal } from '@angular/core';
import { GameEditorDto } from '@app/dto/game-editor-dto';
import { GameEditorPlaceableDto } from '@app/dto/game-editor-placeable-dto';
import { GameEditorTileDto } from '@app/dto/game-editor-tile-dto';
import { GameMode } from '@common/enums/game-mode.enum';
import { MapSize } from '@common/enums/map-size.enum';
import { GameHttpService } from '@app/services/game-http/game-http.service';
import { catchError, switchMap, take, tap } from 'rxjs/operators';
import { TileKind } from '@common/enums/tile-kind.enum';
import { PatchGameEditorDto } from '@app/dto/patch-game-editor-dto';
import { ExtendedGameEditorPlaceableDto, Inventory, PLACEABLE_ORDER } from '@app/interfaces/game-editor.interface';
import { PlaceableFootprint, PlaceableKind } from '@common/enums/placeable-kind.enum';
import { firstValueFrom, of, throwError } from 'rxjs';
import { AssetsService } from '@app/services/assets/assets.service';
import { CreateGameDto } from '@app/dto/create-game-dto';
import { ScreenshotService } from '@app/services/screenshot/screenshot.service';
import { NotificationService } from '@app/services/notification/notification.service';
import { ROUTES } from '@app/constants/routes.constants';

@Injectable()
export class GameEditorStoreService {
    constructor(
        private readonly gameHttpService: GameHttpService,
        private readonly screenshotService: ScreenshotService,
        private readonly assetsService: AssetsService,
        private readonly notificationService: NotificationService,
    ) {}

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

    readonly inventory = computed<Inventory>(() => {
        const objs = this._objects();
        const inv: Inventory = {} as Inventory;

        for (const o of objs) {
            const kind = PlaceableKind[o.kind];
            if (!(kind in inv)) {
                inv[kind] = { kind, total: 0, remaining: 0, disabled: false, image: this.assetsService.getPlaceableImage(kind) };
            }
            inv[kind].total += 1;
            if (!o.placed) {
                inv[kind].remaining += 1;
            }
        }

        for (const k of PLACEABLE_ORDER) {
            if (!(k in inv)) {
                inv[k] = { total: 0, remaining: 0, kind: k, disabled: true, image: this.assetsService.getPlaceableImage(k) };
            } else {
                inv[k].disabled = inv[k].remaining === 0;
            }
        }

        return inv;
    });

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

    // get objects() {
    //     return this._objects.asReadonly();
    // }

    get size() {
        return this._size.asReadonly();
    }

    // get gridPreviewUrl() {
    //     return this._gridPreviewUrl.asReadonly();
    // }

    get mode() {
        return this._mode.asReadonly();
    }

    get tileSizePx() {
        return this._tileSizePx();
    }

    set tileSizePx(value: number) {
        this._tileSizePx.set(value);
    }

    loadGameById(id: string): void {
        this.gameHttpService
            .getGameEditorById(id)
            .pipe(
                take(1),
                tap((game) => {
                    if (!game) {
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
                    this._mode.set(game.mode);
                }),
                catchError(() => {
                    return of(null);
                }),
            )
            .subscribe();
    }

    async saveGame(gridElement: HTMLElement): Promise<void> {
        try {
            const gridPreviewImage = await this.screenshotService.captureElementAsBase64(gridElement);

            const current = {
                name: this._name(),
                description: this._description(),
                tiles: this._tiles(),
                objects: this._objects(),
                gridPreviewUrl: gridPreviewImage ?? this._gridPreviewUrl(),
            };
            const game: PatchGameEditorDto = this.pickChangedProperties(current, this._initial());

            await firstValueFrom(
                this.gameHttpService.patchGameEditorById(this._id(), game).pipe(
                    take(1),
                    catchError((err) => {
                        if (err.statusText === 'Conflict') {
                            return throwError(() => new Error('Un jeu avec ce nom existe déjà.'));
                        }
                        const createDto: CreateGameDto = {
                            name: this._name(),
                            description: this._description(),
                            size: this._size(),
                            mode: this._mode(),
                        };
                        return this.gameHttpService.createGame(createDto).pipe(
                            switchMap((newGame) => {
                                this._id.set(newGame.id);
                                const updateGame: PatchGameEditorDto = {
                                    tiles: this._tiles(),
                                    objects: this._objects(),
                                    gridPreviewUrl: gridPreviewImage,
                                };
                                return this.gameHttpService.patchGameEditorById(newGame.id, updateGame);
                            }),
                        );
                    }),
                ),
            );

            this.notificationService.displaySuccess({
                title: 'Jeu sauvegardé',
                message: 'Votre jeu a été sauvegardé avec succès !',
                redirectRoute: ROUTES.managementPage,
            });
        } catch (error) {
            if (error instanceof Error) {
                this.notificationService.displayError({
                    title: 'Erreur lors de la sauvegarde',
                    message: error.message,
                });
            }
            throw error;
        }
    }

    getTileAt(x: number, y: number): GameEditorTileDto | undefined {
        if (!this.inBounds(x, y)) return undefined;
        const index = this.getIndexByCoord(x, y);
        return this._tiles()[index];
    }

    setTileAt(x: number, y: number, kind: TileKind): void {
        this.withBounds(x, y, () => {
            this.updateTiles((draft) => {
                const idx = this.getIndexByCoord(x, y);
                const currentTile = draft[idx];
                if (!currentTile) return;

                if (currentTile.kind !== TileKind.DOOR && currentTile.kind === kind) return;

                const open = currentTile.kind === TileKind.DOOR ? !currentTile.open : false;
                draft[idx] = { x, y, kind, open };
            });
        });
    }

    resetTileAt(x: number, y: number): void {
        this.withBounds(x, y, () => {
            this.updateTiles((draft) => {
                const idx = this.getIndexByCoord(x, y);
                draft[idx] = { x, y, kind: TileKind.BASE };
            });
        });
    }

    reset(): void {
        const initial = this._initial();
        this._tiles.set(initial.tiles);
        this._objects.set(initial.objects);
        this._size.set(initial.size);
        this._name.set(initial.name);
        this._description.set(initial.description);
        this._mode.set(initial.mode);
        this._gridPreviewUrl.set(initial.gridPreviewUrl);
    }

    getPlacedObjectAt(x: number, y: number): GameEditorPlaceableDto | undefined {
        if (!this.inBounds(x, y)) return undefined;
        return this.placedObjects.find((o) => o.xs.includes(x) && o.ys.includes(y));
    }

    placeObjectFromInventory(kind: PlaceableKind, x: number, y: number): void {
        this.withBounds(x, y, () => {
            if (this.isOccupiedByOther(null, x, y)) return;

            this.updateObjects((draft) => {
                const idx = this.findFirstUnplacedIndexByKind(draft, kind);
                if (idx === -1) return;
                draft[idx] = { ...draft[idx], x, y, placed: true };
            });
        });
    }

    movePlacedObject(id: string, x: number, y: number): void {
        this.withBounds(x, y, () => {
            if (this.isOccupiedByOther(id, x, y)) return;

            this.updateObjects((draft) => {
                const idx = this.findObjectIndexById(draft, id);
                if (idx === -1) return;
                draft[idx] = { ...draft[idx], x, y, placed: x >= 0 && y >= 0 };
            });
        });
    }

    removeObject(id: string): void {
        this.updateObjects((draft) => {
            const idx = this.findObjectIndexById(draft, id);
            if (idx === -1) return;
            draft[idx] = { ...draft[idx], x: -1, y: -1, placed: false };
        });
    }

    private getIndexByCoord(x: number, y: number): number {
        const width = this.size();
        return y * width + x;
    }

    private inBounds(x: number, y: number): boolean {
        const n = this.size();
        return x >= 0 && y >= 0 && x < n && y < n;
    }

    private withBounds<T>(x: number, y: number, fn: () => T): T | undefined {
        if (!this.inBounds(x, y)) return undefined;
        return fn();
    }

    private updateTiles(mutator: (draft: GameEditorTileDto[]) => void): void {
        this._tiles.update((tiles) => {
            const draft = [...tiles];
            mutator(draft);
            return draft;
        });
    }

    private updateObjects(mutator: (draft: GameEditorPlaceableDto[]) => void): void {
        this._objects.update((objects) => {
            const draft = [...objects];
            mutator(draft);
            return draft;
        });
    }

    private findObjectIndexById(draft: GameEditorPlaceableDto[], id: string): number {
        return draft.findIndex((o) => o.id === id);
    }

    private findFirstUnplacedIndexByKind(draft: GameEditorPlaceableDto[], kind: PlaceableKind): number {
        return draft.findIndex((o) => o.kind === PlaceableKind[kind] && !o.placed);
    }

    private isOccupiedByOther(id: string | null, x: number, y: number): boolean {
        const occ = this.getPlacedObjectAt(x, y);
        return !!occ && (!id || occ.id !== id);
    }

    private pickChangedProperties<T extends object>(current: T, initial: T): Partial<T> {
        const out: Partial<T> = {};
        for (const k of Object.keys(current) as (keyof T)[]) {
            if (current[k] !== initial[k]) out[k] = current[k];
        }
        return out;
    }
}
