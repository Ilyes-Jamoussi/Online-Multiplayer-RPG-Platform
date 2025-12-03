import { CommonModule, NgStyle } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { GameMapTileModalComponent } from '@app/components/features/game-map-tile-modal/game-map-tile-modal.component';
import { GameMapTileComponent } from '@app/components/features/game-map-tile/game-map-tile.component';
import { GameEditorPlaceableDto } from '@app/dto/game-editor-placeable-dto';
import { BorderStyle } from '@app/interfaces/style.interface';
import { AssetsService } from '@app/services/assets/assets.service';
import { GameMapService } from '@app/services/game-map/game-map.service';
import { PlayerService } from '@app/services/player/player.service';
import { InGameService } from '@app/services/in-game/in-game.service';
import { PlaceableFootprint, PlaceableKind } from '@common/enums/placeable-kind.enum';
import { TileKind } from '@common/enums/tile.enum';
import { GameMode } from '@common/enums/game-mode.enum';
import { TeamColor } from '@app/enums/team-color.enum';
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
        private readonly inGameService: InGameService,
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

    get startPoints() {
        return this.inGameService.startPoints();
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

    getTileClass(x: number, y: number): string {
        return this.gameMapService.getTileClass(x, y);
    }

    isCurrentUser(player: Player): boolean {
        return player.id === this.playerService.id();
    }

    isCTFMode(): boolean {
        return this.inGameService.mode() === GameMode.CTF;
    }

    getTeamColor(player: Player): string | undefined {
        if (this.isCurrentUser(player)) {
            return TeamColor.MyPlayer;
        }

        const teamColor = this.playerService.getTeamColor(player.teamNumber);
        if (teamColor === TeamColor.MyTeam) {
            return TeamColor.MyTeam;
        }

        if (!this.isCTFMode()) {
            return TeamColor.EnemyTeam;
        }

        return teamColor;
    }

    getPlayerBorderStyle(player: Player): BorderStyle {
        const teamColor = this.getTeamColor(player);
        if (!teamColor) {
            return {};
        }
        return {
            'border-color': teamColor,
            'border-width': '3px',
        };
    }

    hasFlag(player: Player): boolean {
        const flagData = this.gameMapService.flagData();
        return flagData?.holderPlayerId === player.id;
    }

    isPlaceableDisabled(placeableId: string): boolean {
        return this.gameMapService.isPlaceableDisabled(placeableId);
    }

    getPlaceableTurnCount(placeableId: string): number | null {
        return this.gameMapService.getPlaceableTurnCount(placeableId);
    }

    isMyStartPoint(startPoint: StartPoint): boolean {
        return startPoint.playerId === this.playerService.id();
    }

    getStartPointStyle(startPoint: StartPoint) {
        return {
            gridColumn: `${startPoint.x + 1}`,
            gridRow: `${startPoint.y + 1}`,
        };
    }

    getStartPointAvatarImage(playerId: string): string {
        return this.gameMapService.getAvatarByPlayerId(playerId);
    }

    getStartPointBorderStyle(startPoint: StartPoint): BorderStyle {
        const player = this.gameMapService.currentlyPlayers.find((playerItem) => playerItem.id === startPoint.playerId);
        if (!player) {
            return {};
        }
        const teamColor = this.getTeamColor(player);
        if (!teamColor) {
            return {};
        }
        return {
            'border-color': teamColor,
            'border-width': '3px',
        };
    }
}
