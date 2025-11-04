import { Injectable, Signal, computed, signal } from '@angular/core';
import { GameEditorDto } from '@app/dto/game-editor-dto';
import { GameEditorPlaceableDto } from '@app/dto/game-editor-placeable-dto';
import { GameEditorTileDto } from '@app/dto/game-editor-tile-dto';
import { Vector2 } from '@app/interfaces/game-editor.interface';
import { AssetsService } from '@app/services/assets/assets.service';
import { GameHttpService } from '@app/services/game-http/game-http.service';
import { InGameService } from '@app/services/in-game/in-game.service';
import { NotificationService } from '@app/services/notification/notification.service';
import { GameMode } from '@common/enums/game-mode.enum';
import { MapSize } from '@common/enums/map-size.enum';
import { PlaceableKind, PlaceableFootprint } from '@common/enums/placeable-kind.enum';
import { catchError, of, take, tap } from 'rxjs';
import { InGameSocketService } from '@app/services/in-game-socket/in-game-socket.service';
import { Player } from '@common/models/player.interface';
import { AvailableAction } from '@common/interfaces/available-action.interface';
import { ReachableTile } from '@common/interfaces/reachable-tile.interface';

@Injectable()
export class GameMapService {
    private readonly initialState = {
        tiles: [],
        objects: [],
        size: MapSize.MEDIUM,
        name: '',
        description: '',
        mode: GameMode.CLASSIC,
    };

    private readonly _tiles = signal<GameEditorTileDto[]>(this.initialState.tiles);
    private readonly _objects = signal<GameEditorPlaceableDto[]>(this.initialState.objects);
    private readonly _size = signal<MapSize>(this.initialState.size);
    private readonly _name = signal<string>(this.initialState.name);
    private readonly _description = signal<string>(this.initialState.description);
    private readonly _mode = signal<GameMode>(this.initialState.mode);
    private readonly _activeTileCoords = signal<{ x: number; y: number } | null>(null);

    readonly visibleObjects: Signal<GameEditorPlaceableDto[]> = computed(() => {
        const visibleObjects = this.objects().filter((obj) => obj.placed);
        return visibleObjects.filter((obj) => {
            const isInStartPoints = this.inGameService.startPoints().some((startPoint) => startPoint.id === obj.id);
            return obj.kind !== PlaceableKind.START || isInStartPoints;
        });
    });

    constructor(
        private readonly gameHttpService: GameHttpService,
        private readonly notificationService: NotificationService,
        private readonly inGameService: InGameService,
        private readonly assetsService: AssetsService,
        private readonly inGameSocketService: InGameSocketService,
    ) {
        this.initDoorListener();
    }

    private initDoorListener(): void {
        this.inGameSocketService.onDoorToggled((data) => {
            this.updateTileState(data.x, data.y, data.isOpen);
        });
    }

    get players() {
        return this.inGameService.inGamePlayers();
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

    get name() {
        return this._name.asReadonly();
    }

    get description() {
        return this._description.asReadonly();
    }

    get mode() {
        return this._mode.asReadonly();
    }

    get activeTileCoords() {
        return this._activeTileCoords.asReadonly();
    }

    get reachableTiles() {
        return this.inGameService.reachableTiles();
    }

    get isMyTurn() {
        return this.inGameService.isMyTurn();
    }

    get isActionModeActive() {
        return this.inGameService.isActionModeActive();
    }

    get availableActions() {
        return this.inGameService.availableActions();
    }

    getTileClass(x: number, y: number): string {
        let classes = '';
        
        if (this.isReachable(x, y)) {
            classes += 'reachable-tile ';
        }
        
        if (this.isActionModeActive && this.hasActionAt(x, y)) {
            classes += this.getActionClass(x, y) + ' ';
        }
        
        return classes.trim();
    }

    private isReachable(x: number, y: number): boolean {
        return this.reachableTiles.some((tile: ReachableTile) => tile.x === x && tile.y === y);
    }

    private hasActionAt(x: number, y: number): boolean {
        return this.availableActions.some((action: AvailableAction) => action.x === x && action.y === y);
    }

    private getActionClass(x: number, y: number): string {
        const action = this.availableActions.find((availableAction: AvailableAction) => availableAction.x === x && availableAction.y === y);
        return action?.type === 'ATTACK' ? 'action-attack' : 'action-door';
    }

    getActionTypeAt(x: number, y: number): 'ATTACK' | 'DOOR' | null {
        const action = this.availableActions.find((availableAction: AvailableAction) => availableAction.x === x && availableAction.y === y);
        if (action) {
            this.inGameService.deactivateActionMode();
        }
        return action?.type || null;
    }

    deactivateActionMode(): void {
        this.inGameService.deactivateActionMode();
    }

    toggleDoor(x: number, y: number): void {
        this.inGameService.toggleDoorAction(x, y);
    }

    updateTileState(x: number, y: number, isOpen: boolean): void {
        this._tiles.update(tiles => 
            tiles.map(tile => 
                tile.x === x && tile.y === y 
                    ? { ...tile, open: isOpen }
                    : tile
            )
        );
    }

    getActiveTile(coords?: Vector2): GameEditorTileDto | null {
        const targetCoords = coords ?? this._activeTileCoords();
        if (!targetCoords) return null;
        return this.tiles().find((tile) => tile.x === targetCoords.x && tile.y === targetCoords.y) ?? null;
    }

    openTileModal(tile: GameEditorTileDto): void {
        this._activeTileCoords.set({ x: tile.x, y: tile.y });
    }

    closeTileModal(): void {
        this._activeTileCoords.set(null);
    }

    isTileModalOpen(tile: GameEditorTileDto): boolean {
        const coords = this._activeTileCoords();
        return !!coords && coords.x === tile.x && coords.y === tile.y;
    }

    getPlayerOnTile(coords?: Vector2): Player | undefined {
        const targetCoords = coords ?? this._activeTileCoords();
        if (!targetCoords) return undefined;
        return this.currentlyPlayers.find((player) => player.x === targetCoords.x && player.y === targetCoords.y);
    }

    getObjectOnTile(coords?: Vector2): GameEditorPlaceableDto | undefined {
        const targetCoords = coords ?? this._activeTileCoords();
        if (!targetCoords) return undefined;

        return this.visibleObjects().find((obj) => {
            if (obj.x === targetCoords.x && obj.y === targetCoords.y) return true;

            if (PlaceableFootprint[obj.kind] === 2) {
                return (
                    (obj.x === targetCoords.x - 1 && obj.y === targetCoords.y) ||
                    (obj.x === targetCoords.x && obj.y === targetCoords.y - 1) ||
                    (obj.x === targetCoords.x - 1 && obj.y === targetCoords.y - 1)
                );
            }

            return false;
        });
    }

    get currentlyPlayers(): Player[] {
        return this.inGameService.currentlyPlayers;
    }

    loadGameMap(gameId: string): void {
        this.gameHttpService
            .getGameEditorById(gameId)
            .pipe(
                take(1),
                tap((gameData) => {
                    this.buildGameMap(gameData);
                }),
                catchError(() => {
                    this.notificationService.displayError({ title: 'Erreur', message: 'Erreur lors du chargement de la carte' });
                    return of(null);
                }),
            )
            .subscribe();
    }

    getAvatarByPlayerId(playerId: string): string {
        const player = this.inGameService.getPlayerByPlayerId(playerId);
        if (!player?.avatar) return '';
        return this.assetsService.getAvatarStaticImage(player.avatar);
    }

    private buildGameMap(gameData: GameEditorDto): void {
        this._name.set(gameData.name);
        this._description.set(gameData.description);
        this._size.set(gameData.size);
        this._mode.set(gameData.mode);

        const tiles: GameEditorTileDto[] = gameData.tiles.map((tile) => ({
            ...tile,
            open: tile.open ?? false,
        }));

        const objects: GameEditorPlaceableDto[] = gameData.objects.map((obj) => ({
            ...obj,
            placed: obj.placed,
        }));

        this._tiles.set(tiles);
        this._objects.set(objects);
    }

    reset(): void {
        this._tiles.set(this.initialState.tiles);
        this._objects.set(this.initialState.objects);
        this._size.set(this.initialState.size);
        this._name.set(this.initialState.name);
        this._description.set(this.initialState.description);
        this._mode.set(this.initialState.mode);
        this._activeTileCoords.set(null);
    }
}
