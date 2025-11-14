import { Injectable, Signal, computed, signal } from '@angular/core';
import { GameEditorDto } from '@app/dto/game-editor-dto';
import { GameEditorPlaceableDto } from '@app/dto/game-editor-placeable-dto';
import { GameEditorTileDto } from '@app/dto/game-editor-tile-dto';
import { TeleportChannelDto } from '@app/dto/teleport-channel-dto';
import { Vector2 } from '@app/interfaces/game-editor.interface';
import { AssetsService } from '@app/services/assets/assets.service';
import { GameHttpService } from '@app/services/game-http/game-http.service';
import { InGameSocketService } from '@app/services/in-game-socket/in-game-socket.service';
import { InGameService } from '@app/services/in-game/in-game.service';
import { NotificationCoordinatorService } from '@app/services/notification-coordinator/notification-coordinator.service';
import { GameMode } from '@common/enums/game-mode.enum';
import { MapSize } from '@common/enums/map-size.enum';
import { PlaceableFootprint, PlaceableKind } from '@common/enums/placeable-kind.enum';
import { TileKind } from '@common/enums/tile.enum';
import { AvailableAction } from '@common/interfaces/available-action.interface';
import { Player } from '@common/interfaces/player.interface';
import { ReachableTile } from '@common/interfaces/reachable-tile.interface';
import { catchError, of, take, tap } from 'rxjs';

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
    private readonly _teleportChannels = signal<TeleportChannelDto[]>([]);

    readonly visibleObjects: Signal<GameEditorPlaceableDto[]> = computed(() => {
        const visibleObjects = this._objects().filter((obj) => obj.placed);
        return visibleObjects.filter((obj) => {
            const isInStartPoints = this.inGameService.startPoints().some((startPoint) => startPoint.id === obj.id);
            return obj.kind !== PlaceableKind.START || isInStartPoints;
        });
    });

    constructor(
        private readonly gameHttpService: GameHttpService,
        private readonly notificationCoordinatorService: NotificationCoordinatorService,
        private readonly inGameService: InGameService,
        private readonly assetsService: AssetsService,
        private readonly inGameSocketService: InGameSocketService,
    ) {
        this.initListeners();
    }

    private initListeners(): void {
        this.inGameSocketService.onDoorToggled((data) => {
            this.updateTileState(data.x, data.y, data.isOpen);
        });
        this.inGameSocketService.onPlaceablePositionUpdated((data) => {
            this.updateObjectState(data);
        });
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

    private get reachableTiles() {
        return this.inGameService.reachableTiles();
    }

    get isActionModeActive() {
        return this.inGameService.isActionModeActive();
    }

    private get availableActions() {
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

    getActionTypeAt(x: number, y: number): 'ATTACK' | 'DOOR' | 'HEAL' | 'FIGHT' | 'BOAT' | null {
        const action = this.availableActions.find((availableAction: AvailableAction) => availableAction.x === x && availableAction.y === y);
        if (action) {
            this.inGameService.deactivateActionMode();
        }
        return action?.type || null;
    }

    toggleDoor(x: number, y: number): void {
        this.inGameService.toggleDoorAction(x, y);
    }

    healPlayer(x: number, y: number): void {
        this.inGameService.healPlayer(x, y);
    }

    fightPlayer(x: number, y: number): void {
        this.inGameService.fightPlayer(x, y);
    }

    private updateTileState(x: number, y: number, isOpen: boolean): void {
        this._tiles.update((tiles) => tiles.map((tile) => (tile.x === x && tile.y === y ? { ...tile, open: isOpen } : tile)));
    }

    private updateObjectState(placeable: GameEditorPlaceableDto): void {
        this._objects.update((objects) => objects.map((obj) => (obj.id === placeable.id ? placeable : obj)));
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
                    this.notificationCoordinatorService.displayErrorPopup({ title: 'Erreur', message: 'Erreur lors du chargement de la carte' });
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

    private getIndexByCoord(x: number, y: number): number {
        const width = this.size();
        return y * width + x;
    }

    private buildGameMap(gameData: GameEditorDto): void {
        this._name.set(gameData.name);
        this._description.set(gameData.description);
        this._size.set(gameData.size);
        this._mode.set(gameData.mode);
        this._teleportChannels.set(gameData.teleportChannels);

        const tiles: GameEditorTileDto[] = gameData.tiles.map((tile) => ({
            ...tile,
            open: tile.open ?? false,
        }));

        const updateTile = (x: number, y: number, channelNumber: number) => {
            const index = this.getIndexByCoord(x, y);
            if (index >= 0 && index < tiles.length) {
                tiles[index] = { ...tiles[index], kind: TileKind.TELEPORT, teleportChannel: channelNumber };
            }
        };
        for (const channel of gameData.teleportChannels) {
            if (channel.tiles?.entryA) {
                updateTile(channel.tiles.entryA.x, channel.tiles.entryA.y, channel.channelNumber);
            }
            if (channel.tiles?.entryB) {
                updateTile(channel.tiles.entryB.x, channel.tiles.entryB.y, channel.channelNumber);
            }
        }

        const objects: GameEditorPlaceableDto[] = gameData.objects.map((obj) => ({
            ...obj,
            placed: obj.placed,
        }));

        this._tiles.set(tiles);
        this._objects.set(objects);
    }

    boatAction(x: number, y: number): void {
        this.inGameService.boatAction(x, y);
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
