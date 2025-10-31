import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { GameEditorPlaceableDto } from '@app/dto/game-editor-placeable-dto';
import { GameEditorTileDto } from '@app/dto/game-editor-tile-dto';
import { AssetsService } from '@app/services/assets/assets.service';
import { GameMapService } from '@app/services/game-map/game-map.service';
import { InGamePlayer } from '@common/models/player.interface';

@Component({
    selector: 'app-game-map-tile',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './game-map-tile.component.html',
    styleUrls: ['./game-map-tile.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GameMapTileComponent {
    @Input({ required: true }) tile: GameEditorTileDto;
    @Input({ required: true }) imageSrc: string;
    @Input() cssClass: string = '';

    constructor(
        private readonly gameMapService: GameMapService,
        private readonly assetsService: AssetsService,
    ) {}

    get objectOnTile(): GameEditorPlaceableDto | undefined {
        return this.gameMapService
            .objects()
            .find((object) => object.placed && object.x === this.tile.x && object.y === this.tile.y);
    }

    get playerOnTile(): InGamePlayer | undefined {
        return this.gameMapService.currentlyInGamePlayers.find(
            (player) => player.isInGame && player.x === this.tile.x && player.y === this.tile.y,
        );
    }

    get playerAvatarSrc(): string {
        const player = this.playerOnTile;
        return player ? this.gameMapService.getAvatarByPlayerId(player.id) : '';
    }

    get objectImageSrc(): string {
        const obj = this.objectOnTile;
        return obj ? this.assetsService.getPlaceableImage(obj.kind) : '';
    }

    openModal(event: MouseEvent): void {
        event.preventDefault();
        this.gameMapService.openTileModal(this.tile);
    }

    closeModal(): void {
        this.gameMapService.closeTileModal();
    }

    get isModalOpen(): boolean {
        return this.gameMapService.isTileModalOpen(this.tile);
    }
}


