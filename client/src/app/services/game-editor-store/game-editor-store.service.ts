import { HttpErrorResponse } from '@angular/common/http';
import { computed, Injectable, signal } from '@angular/core';
import { CreateGameDto } from '@app/dto/create-game-dto';
import { GameEditorDto } from '@app/dto/game-editor-dto';
import { GameEditorPlaceableDto } from '@app/dto/game-editor-placeable-dto';
import { GameEditorTileDto } from '@app/dto/game-editor-tile-dto';
import { PatchGameEditorDto } from '@app/dto/patch-game-editor-dto';
import { ExtendedGameEditorPlaceableDto, Inventory } from '@app/interfaces/game-editor.interface';
import { PLACEABLE_ORDER } from '@app/constants/game-editor.constants';
import { AssetsService } from '@app/services/assets/assets.service';
import { GameHttpService } from '@app/services/game-http/game-http.service';
import { NotificationCoordinatorService } from '@app/services/notification-coordinator/notification-coordinator.service';
import { ScreenshotService } from '@app/services/screenshot/screenshot.service';
import { GameMode } from '@common/enums/game-mode.enum';
import { MapSize } from '@common/enums/map-size.enum';
import { PlaceableFootprint, PlaceableKind } from '@common/enums/placeable-kind.enum';
import { ROUTES } from '@app/enums/routes.enum';
import { TileKind } from '@common/enums/tile-kind.enum';
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
    //}

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
}
