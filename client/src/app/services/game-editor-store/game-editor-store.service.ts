import { HttpErrorResponse } from '@angular/common/http';
import { computed, Injectable, signal } from '@angular/core';
import { PLACEABLE_ORDER } from '@app/constants/game-editor.constants';
import { CreateGameDto } from '@app/dto/create-game-dto';
import { GameEditorDto } from '@app/dto/game-editor-dto';
import { GameEditorPlaceableDto } from '@app/dto/game-editor-placeable-dto';
import { GameEditorTileDto } from '@app/dto/game-editor-tile-dto';
import { PatchGameEditorDto } from '@app/dto/patch-game-editor-dto';
import { TeleportChannelDto } from '@app/dto/teleport-channel-dto';
import { ROUTES } from '@app/enums/routes.enum';
import { ExtendedGameEditorPlaceableDto, Inventory } from '@app/interfaces/game-editor.interface';
import { AssetsService } from '@app/services/assets/assets.service';
import { GameHttpService } from '@app/services/game-http/game-http.service';
import { NotificationCoordinatorService } from '@app/services/notification-coordinator/notification-coordinator.service';
import { ScreenshotService } from '@app/services/screenshot/screenshot.service';
import { GameMode } from '@common/enums/game-mode.enum';
import { MapSize } from '@common/enums/map-size.enum';
import { PlaceableFootprint, PlaceableKind } from '@common/enums/placeable-kind.enum';
import { TileKind } from '@common/enums/tile.enum';
import { firstValueFrom, of, throwError } from 'rxjs';
import { catchError, switchMap, take, tap } from 'rxjs/operators';

@Injectable()
export class GameEditorStoreService {
    constructor(
        private readonly gameHttpService: GameHttpService,
        private readonly screenshotService: ScreenshotService,
        private readonly assetsService: AssetsService,
        private readonly notificationCoordinatorService: NotificationCoordinatorService,
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
        teleportChannels: [],
    });

    private readonly _id = signal<string>('');
    private readonly _name = signal<string>('');
    private readonly _description = signal<string>('');
    private readonly _tiles = signal<GameEditorTileDto[]>([]);
    private readonly _objects = signal<GameEditorPlaceableDto[]>([]);
    private readonly _size = signal<MapSize>(MapSize.MEDIUM);
    private readonly _gridPreviewUrl = signal<string>('');
    private readonly _mode = signal<GameMode>(GameMode.CLASSIC);
    private readonly _teleportChannels = signal<TeleportChannelDto[]>([]);

    private readonly _tileSizePx = signal<number>(0);

    get placedObjects(): ExtendedGameEditorPlaceableDto[] {
        const objects = this._objects();
        const placed = objects.filter((object) => object.placed);
        const accumulator: ExtendedGameEditorPlaceableDto[] = [];

        for (const object of placed) {
            const footprint = PlaceableFootprint[PlaceableKind[object.kind]];
            const xPositions: number[] = [];
            const yPositions: number[] = [];
            for (let deltaX = 0; deltaX < footprint; deltaX++) {
                for (let deltaY = 0; deltaY < footprint; deltaY++) {
                    xPositions.push(object.x + deltaX);
                    yPositions.push(object.y + deltaY);
                }
            }
            accumulator.push({
                id: object.id,
                kind: object.kind,
                orientation: object.orientation,
                placed: object.placed,
                x: object.x,
                y: object.y,
                xPositions,
                yPositions,
            });
        }

        return accumulator;
    }

    readonly inventory = computed<Inventory>(() => {
        const objects = this._objects();
        const inventory: Inventory = {} as Inventory;

        for (const object of objects) {
            const kind = PlaceableKind[object.kind];
            if (!(kind in inventory)) {
                inventory[kind] = { kind, total: 0, remaining: 0, disabled: false, image: this.assetsService.getPlaceableImage(kind) };
            }
            inventory[kind].total += 1;
            if (!object.placed) {
                inventory[kind].remaining += 1;
            }
        }

        for (const kind of PLACEABLE_ORDER) {
            if (!(kind in inventory)) {
                inventory[kind] = { total: 0, remaining: 0, kind, disabled: true, image: this.assetsService.getPlaceableImage(kind) };
            } else {
                inventory[kind].disabled = inventory[kind].remaining === 0;
            }
        }

        return inventory;
    });

    readonly availableTeleportChannels = computed<TeleportChannelDto[]>(() => {
        return this._teleportChannels().filter((channel) => !channel.tiles?.a && !channel.tiles?.b);
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

    get size() {
        return this._size.asReadonly();
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
                    this._teleportChannels.set(game.teleportChannels || []);
                }),
                catchError(() => {
                    return of(null);
                }),
            )
            .subscribe();
    }

    private async captureGridPreview(gridElement: HTMLElement): Promise<string | undefined> {
        return await this.screenshotService.captureElementAsBase64(gridElement);
    }

    private buildPatchDto(gridPreviewImage: string | undefined): PatchGameEditorDto {
        const current = {
            name: this._name(),
            description: this._description(),
            tiles: this._tiles(),
            objects: this._objects(),
            gridPreviewUrl: gridPreviewImage ?? this._gridPreviewUrl(),
            teleportChannels: this._teleportChannels(),
        };

        return this.pickChangedProperties(current, this._initial());
    }

    private saveOrCreateGame(patchDto: PatchGameEditorDto, gridPreviewImage: string | undefined) {
        return this.gameHttpService.patchGameEditorById(this._id(), patchDto).pipe(
            take(1),
            catchError((err) => this.handleSaveError(err, gridPreviewImage)),
        );
    }

    private handleSaveError(err: HttpErrorResponse, gridPreviewImage: string | undefined) {
        if (err.statusText === 'Conflict') {
            return throwError(() => new Error('Un jeu avec ce nom existe déjà.'));
        }

        const createDto: CreateGameDto = {
            name: this._name(),
            description: this._description(),
            size: this._size(),
            mode: this._mode(),
        };

        return this.gameHttpService.createGame(createDto).pipe(switchMap((newGame) => this.updateNewGame(newGame.id, gridPreviewImage)));
    }

    private updateNewGame(newGameId: string, gridPreviewImage: string | undefined) {
        this._id.set(newGameId);

        const updateGame: PatchGameEditorDto = {
            tiles: this._tiles(),
            objects: this._objects(),
            gridPreviewUrl: gridPreviewImage,
            teleportChannels: this._teleportChannels(),
        };

        return this.gameHttpService.patchGameEditorById(newGameId, updateGame).pipe(take(1));
    }

    private notifySuccess(): void {
        this.notificationCoordinatorService.displaySuccessPopup({
            title: 'Jeu sauvegardé',
            message: 'Votre jeu a été sauvegardé avec succès !',
            redirectRoute: ROUTES.ManagementPage,
        });
    }

    private notifyError(error: unknown): void {
        if (error instanceof Error) {
            this.notificationCoordinatorService.displayErrorPopup({
                title: 'Erreur lors de la sauvegarde',
                message: error.message,
            });
        }
    }

    async saveGame(gridElement: HTMLElement): Promise<void> {
        try {
            const gridPreviewImage = await this.captureGridPreview(gridElement);
            const patchDto = this.buildPatchDto(gridPreviewImage);

            await firstValueFrom(this.saveOrCreateGame(patchDto, gridPreviewImage));

            this.notifySuccess();
        } catch (error) {
            this.notifyError(error);
            throw error;
        }
    }

    getTileAt(x: number, y: number): GameEditorTileDto | undefined {
        if (!this.inBounds(x, y)) return undefined;
        const index = this.getIndexByCoord(x, y);
        return this._tiles()[index];
    }

    setTileAt(x: number, y: number, kind: TileKind, teleportChannel?: number): void {
        this.withBounds(x, y, () => {
            this.updateTiles((draft) => {
                const idx = this.getIndexByCoord(x, y);
                const currentTile = draft[idx];
                if (!currentTile) return;

                if (currentTile.kind !== TileKind.DOOR && currentTile.kind === kind) {
                    if (kind === TileKind.TELEPORT && currentTile.kind === TileKind.TELEPORT) {
                        if (currentTile.teleportChannel === teleportChannel) return;
                    } else {
                        return;
                    }
                }

                const open = currentTile.kind === TileKind.DOOR ? !currentTile.open : false;
                const tileData: GameEditorTileDto = { x, y, kind, open };
                if (kind === TileKind.TELEPORT && teleportChannel !== undefined) {
                    tileData.teleportChannel = teleportChannel;
                } else if (kind !== TileKind.TELEPORT && currentTile.kind === TileKind.TELEPORT) {
                    tileData.teleportChannel = undefined;
                }
                draft[idx] = tileData;
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
        this._teleportChannels.set(initial.teleportChannels || []);
    }

    getPlacedObjectAt(x: number, y: number): GameEditorPlaceableDto | undefined {
        if (!this.inBounds(x, y)) return undefined;
        return this.placedObjects.find((object) => object.xPositions.includes(x) && object.yPositions.includes(y));
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
        const size = this.size();
        return x >= 0 && y >= 0 && x < size && y < size;
    }

    private withBounds<T>(x: number, y: number, functionToRun: () => T): T | undefined {
        if (!this.inBounds(x, y)) return undefined;
        return functionToRun();
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
        return draft.findIndex((object) => object.id === id);
    }

    private findFirstUnplacedIndexByKind(draft: GameEditorPlaceableDto[], kind: PlaceableKind): number {
        return draft.findIndex((object) => object.kind === PlaceableKind[kind] && !object.placed);
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

    get teleportChannels(): readonly TeleportChannelDto[] {
        return this._teleportChannels();
    }

    isTeleportDisabled(): boolean {
        return this.availableTeleportChannels().length === 0;
    }

    placeTeleportTile(x: number, y: number, channelNumber: number, isFirstTile: boolean): void {
        this.updateTeleportChannels((draft) => {
            const channel = draft.find((c) => c.channelNumber === channelNumber);
            if (!channel) return;

            if (isFirstTile) {
                if (!channel.tiles) {
                    channel.tiles = { a: { x, y }, b: undefined };
                } else {
                    channel.tiles.a = { x, y };
                }
            } else {
                if (channel.tiles) {
                    channel.tiles.b = { x, y };
                }
            }
        });
        this.setTileAt(x, y, TileKind.TELEPORT, channelNumber);
    }

    cancelTeleportPlacement(channelNumber: number): void {
        this.updateTeleportChannels((draft) => {
            const channel = draft.find((c) => c.channelNumber === channelNumber);
            if (!channel || !channel.tiles) return;

            if (channel.tiles.a && !channel.tiles.b) {
                const tile = channel.tiles.a;
                this.resetTileAt(tile.x, tile.y);
                channel.tiles.a = undefined;
            }
        });
    }

    removeTeleportPair(x: number, y: number): void {
        const tile = this.getTileAt(x, y);
        if (!tile || tile.kind !== TileKind.TELEPORT || !tile.teleportChannel) return;

        const channelNumber = tile.teleportChannel;
        this.updateTeleportChannels((draft) => {
            const channel = draft.find((c) => c.channelNumber === channelNumber);
            if (!channel || !channel.tiles) return;

            const isTileA = channel.tiles.a?.x === x && channel.tiles.a?.y === y;
            const isTileB = channel.tiles.b?.x === x && channel.tiles.b?.y === y;

            if (isTileA || isTileB) {
                if (channel.tiles.a) {
                    this.resetTileAt(channel.tiles.a.x, channel.tiles.a.y);
                }
                if (channel.tiles.b) {
                    this.resetTileAt(channel.tiles.b.x, channel.tiles.b.y);
                }
                channel.tiles = { a: undefined, b: undefined };
            }
        });
    }

    private updateTeleportChannels(mutator: (draft: TeleportChannelDto[]) => void): void {
        this._teleportChannels.update((channels) => {
            const draft = [...channels];
            mutator(draft);
            return draft;
        });
    }
}
