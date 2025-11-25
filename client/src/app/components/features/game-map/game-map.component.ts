import { CommonModule, NgStyle } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { GameMapTileModalComponent } from '@app/components/features/game-map-tile-modal/game-map-tile-modal.component';
import { GameMapTileComponent } from '@app/components/features/game-map-tile/game-map-tile.component';
import { GameEditorPlaceableDto } from '@app/dto/game-editor-placeable-dto';
import { AssetsService } from '@app/services/assets/assets.service';
import { GameMapService } from '@app/services/game-map/game-map.service';
import { PlayerService } from '@app/services/player/player.service';
import { PlaceableFootprint, PlaceableKind } from '@common/enums/placeable-kind.enum';
import { TileKind } from '@common/enums/tile.enum';
import { Player } from '@common/interfaces/player.interface';
import { StartPoint } from '@common/interfaces/start-point.interface';

@Component({
    selector: 'app-game-map',
    standalone: true,
    imports: [CommonModule, NgStyle, GameMapTileComponent, GameMapTileModalComponent],
    templateUrl: './game-map.component.html',
    styleUrls: ['./game-map.component.scss'],
    providers: [GameMapService],
})
export class GameMapComponent implements OnInit {
    @Input() gameId!: string;

    constructor(
        private readonly gameMapService: GameMapService,
        private readonly assetsService: AssetsService,
        private readonly playerService: PlayerService,
    ) {}

    ngOnInit(): void {
        if (this.gameId) {
            this.gameMapService.loadGameMap(this.gameId);
        }
    }

    get players() {
        return this.gameMapService.currentlyPlayers;
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

    getPlayerStyle(player: Player) {
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

    getTileClass(x: number, y: number): string {
        return this.gameMapService.getTileClass(x, y);
    }

    isCurrentUser(player: Player): boolean {
        return player.id === this.playerService.id();
    }

    getTeamColor(player: Player): string | undefined {
        if (this.isCurrentUser(player)) return undefined;
        return this.playerService.getTeamColor(player.teamNumber);
    }

    getPlayerBorderStyle(player: Player): { 'border-color'?: string; 'border-width'?: string; 'box-shadow'?: string } {
        if (this.isCurrentUser(player)) {
            return {};
        }
        const teamColor = this.getTeamColor(player);
        if (!teamColor) {
            return {};
        }
        return {
            'border-color': teamColor,
            'border-width': '3px',
            'box-shadow': `0 0 15px ${teamColor}, 0 2px 4px rgba(0, 0, 0, 0.5)`,
        };
    }

    hasFlag(player: Player): boolean {
        const flagData = this.gameMapService.flagData();
        return flagData?.holderPlayerId === player.id;
    }
}
