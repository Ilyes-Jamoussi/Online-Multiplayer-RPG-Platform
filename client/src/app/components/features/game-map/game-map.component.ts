import { CommonModule, NgStyle } from '@angular/common';
import { Component, Input, OnInit, OnDestroy, inject } from '@angular/core';
import { GameEditorPlaceableDto } from '@app/dto/game-editor-placeable-dto';
import { AssetsService } from '@app/services/assets/assets.service';
import { GameMapService } from '@app/services/game-map/game-map.service';
import { ReachableTilesService, ReachableTile } from '@app/services/reachable-tiles/reachable-tiles.service';
import { InGameService } from '@app/services/in-game/in-game.service';
import { PlayerService } from '@app/services/player/player.service';
import { PlaceableFootprint, PlaceableKind } from '@common/enums/placeable-kind.enum';
import { TileKind } from '@common/enums/tile-kind.enum';
import { InGamePlayer } from '@common/models/player.interface';
import { StartPoint } from '@common/models/start-point.interface';
import { GameMapTileComponent } from '@app/components/features/game-map-tile/game-map-tile.component';
import { GameMapTileModalComponent } from '@app/components/features/game-map-tile-modal/game-map-tile-modal.component';

const UPDATE_INTERVAL_MS = 1000;

@Component({
    selector: 'app-game-map',
    standalone: true,
    imports: [CommonModule, NgStyle, GameMapTileComponent, GameMapTileModalComponent],
    templateUrl: './game-map.component.html',
    styleUrls: ['./game-map.component.scss'],
    providers: [GameMapService],
})
export class GameMapComponent implements OnInit, OnDestroy {
    @Input() gameId!: string;
    
    private readonly reachableTilesService = inject(ReachableTilesService);
    private readonly inGameService = inject(InGameService);
    private readonly playerService = inject(PlayerService);
    
    reachableTiles: ReachableTile[] = [];
    private updateInterval?: number;

    constructor(
        private readonly gameMapService: GameMapService,
        private readonly assetsService: AssetsService,
    ) {}

    ngOnInit(): void {
        if (this.gameId) {
            this.gameMapService.loadGameMap(this.gameId);
        }
        this.updateReachableTiles();
        
        this.updateInterval = window.setInterval(() => {
            this.updateReachableTiles();
        }, UPDATE_INTERVAL_MS);
    }

    ngOnDestroy(): void {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
        }
    }

    get players() {
        return this.gameMapService.currentlyInGamePlayers;
    }

    get tiles() {
        return this.gameMapService.tiles();
    }

    get objects() {
        return this.gameMapService.objects();
    }

    get size() {
        return this.gameMapService.size();
    }

    get placedObjectsCount(): number {
        return this.objects.filter((obj: GameEditorPlaceableDto) => obj.placed).length;
    }

    get gridStyle() {
        return {
            gridTemplateColumns: `repeat(${this.size}, 1fr)`,
            gridTemplateRows: `repeat(${this.size}, 1fr)`,
        };
    }

    get visibleObjects() {
        return this.gameMapService.visibleObjects();
    }

    getTileImage(tileKind: string, opened: boolean = false): string {
        return this.assetsService.getTileImage(tileKind as TileKind, opened);
    }

    getObjectImage(placeable: GameEditorPlaceableDto): string {
        return this.assetsService.getPlaceableImage(placeable.kind);
    }

    getPlaceableImage(placeableKind: string): string {
        return this.assetsService.getPlaceableImage(placeableKind as PlaceableKind);
    }

    getPlayerAvatarImage(playerId: string): string {
        return this.gameMapService.getAvatarByPlayerId(playerId);
    }

    getObjectStyle(obj: GameEditorPlaceableDto) {
        const footprint = this.getObjectFootprint(obj.kind);
        return {
            gridColumn: `${obj.x + 1} / span ${footprint}`,
            gridRow: `${obj.y + 1} / span ${footprint}`,
        };
    }

    getPlayerStyle(player: InGamePlayer) {
        return {
            gridColumn: `${player.x + 1}`,
            gridRow: `${player.y + 1}`,
        };
    }

    getObjectFootprint(placeableKind: string): number {
        return PlaceableFootprint[placeableKind as PlaceableKind];
    }

    getStartPointStyle(startPoint: StartPoint) {
        return {
            gridColumn: `${startPoint.x + 1}`,
            gridRow: `${startPoint.y + 1}`,
        };
    }
    
    updateReachableTiles(): void {
        const currentPlayer = this.playerService.player();
        const session = this.inGameService.inGameSession();
        
        if (!session.isGameStarted) {
            this.reachableTiles = [];
            return;
        }
        
        if (!currentPlayer || !session || session.currentTurn.activePlayerId !== currentPlayer.id) {
            this.reachableTiles = [];
            return;
        }
        
        const player = session.inGamePlayers[currentPlayer.id];
        if (!player) {
            this.reachableTiles = [];
            return;
        }
        
        this.reachableTiles = this.reachableTilesService.calculateReachableTiles({
            startX: player.x,
            startY: player.y,
            movementPoints: player.movementPoints,
            getTileKind: (x, y) => this.getTileKindAt(x, y),
            isOccupied: (x, y) => this.isPositionOccupied(x, y),
            isOnBoat: this.isPlayerOnBoat(),
            hasSanctuary: () => this.hasSanctuary()
        });
    }
    
    private getTileKindAt(x: number, y: number): TileKind | null {
        const tiles = this.gameMapService.tiles();
        const index = y * this.size + x;
        return tiles[index]?.kind || null;
    }
    
    private isPositionOccupied(x: number, y: number): boolean {
        const players = this.gameMapService.currentlyInGamePlayers;
        return players.some(player => player.x === x && player.y === y);
    }
    
    isReachable(x: number, y: number): boolean {
        return this.reachableTiles.some(tile => tile.x === x && tile.y === y);
    }
    
    getTileClass(x: number, y: number): string {
        return this.isReachable(x, y) ? 'reachable-tile' : '';
    }
    
    private isPlayerOnBoat(): boolean {
        return false;
    }
    
    private hasSanctuary(): boolean {
        return false;
    }
}
