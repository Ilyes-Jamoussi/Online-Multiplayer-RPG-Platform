import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { GameEditorPlaceableDto } from '@app/dto/game-editor-placeable-dto';
import { GameEditorTileDto } from '@app/dto/game-editor-tile-dto';
import { PlaceableLabel } from '@app/enums/placeable-label.enum';
import { TileLabel } from '@app/enums/tile-label.enum';
import { AssetsService } from '@app/services/assets/assets.service';
import { GameMapService } from '@app/services/game-map/game-map.service';
import { InGameService } from '@app/services/in-game/in-game.service';
import { PlayerService } from '@app/services/player/player.service';
import { PlaceableKind } from '@common/enums/placeable-kind.enum';
import { TileKind } from '@common/enums/tile.enum';
import { Player } from '@common/interfaces/player.interface';

@Component({
    selector: 'app-game-map-tile-modal',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './game-map-tile-modal.component.html',
    styleUrls: ['./game-map-tile-modal.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GameMapTileModalComponent {
    constructor(
        private readonly gameMapService: GameMapService,
        private readonly assetsService: AssetsService,
        private readonly inGameService: InGameService,
        private readonly playerService: PlayerService,
    ) {}

    tileKind = TileKind;
    tileLabel = TileLabel;
    placeableLabel = PlaceableLabel;

    get objectOnTile(): GameEditorPlaceableDto | undefined {
        return this.gameMapService.getObjectOnTile();
    }

    get playerOnTile(): Player | undefined {
        return this.gameMapService.getPlayerOnTile();
    }

    get activeTile(): GameEditorTileDto | null {
        return this.gameMapService.getActiveTile();
    }

    getTileImage(tile: GameEditorTileDto): string {
        if (!tile) return '';
        return this.assetsService.getTileImage(tile.kind, tile.open ?? false);
    }

    getObjectImage(kind: PlaceableKind): string {
        return this.assetsService.getPlaceableImage(kind);
    }

    getPlayerAvatar(playerId: string): string {
        return this.gameMapService.getAvatarByPlayerId(playerId);
    }

    hasFlag(player: Player): boolean {
        return this.inGameService.flagData()?.holderPlayerId === player.id;
    }

    getTeamNumber(player: Player): number | undefined {
        return player.teamNumber;
    }

    getTeamColor(teamNumber: number | undefined): string | undefined {
        return this.playerService.getTeamColor(teamNumber);
    }

    get startPointOnTile() {
        const activeTile = this.activeTile;
        if (!activeTile) return undefined;
        const startPoint = this.inGameService.startPoints().find((point) => point.x === activeTile.x && point.y === activeTile.y);
        if (!startPoint) return undefined;
        const startPointPlayer = this.gameMapService.currentlyPlayers.find((player) => player.id === startPoint.playerId);
        return { playerId: startPoint.playerId, player: startPointPlayer };
    }

    close(): void {
        this.gameMapService.closeTileModal();
    }
}
