import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { GameEditorPlaceableDto } from '@app/dto/game-editor-placeable-dto';
import { GameEditorTileDto } from '@app/dto/game-editor-tile-dto';
import { PlaceableLabel } from '@app/enums/placeable-label.enum';
import { TileLabel } from '@app/enums/tile-label.enum';
import { AssetsService } from '@app/services/assets/assets.service';
import { GameMapService } from '@app/services/game-map/game-map.service';
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
    ) {}

    tileKind = TileKind;
    tileLabel = TileLabel;
    placeableLabel = PlaceableLabel;
    placeableKind = PlaceableKind;

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

    close(): void {
        this.gameMapService.closeTileModal();
    }
}
