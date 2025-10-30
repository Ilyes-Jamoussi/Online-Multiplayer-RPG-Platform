import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, HostListener, Input } from '@angular/core';
import { GameEditorTileDto } from '@app/dto/game-editor-tile-dto';
import { GameEditorPlaceableDto } from '@app/dto/game-editor-placeable-dto';
import { InGamePlayer } from '@common/models/player.interface';
import { GameMapService } from '@app/services/game-map/game-map.service';
import { AssetsService } from '@app/services/assets/assets.service';
import { InGameService } from '@app/services/in-game/in-game.service';
import { AdminModeService } from '@app/services/admin-mode/admin-mode.service';

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
        private readonly inGameService: InGameService,
        private readonly adminModeService: AdminModeService,
    ) {}

    get objectOnTile(): GameEditorPlaceableDto | undefined {
        return this.gameMapService
            .objects()
            .find((o) => o.placed && o.x === this.tile.x && o.y === this.tile.y);
    }

    get playerOnTile(): InGamePlayer | undefined {
        return this.gameMapService.currentlyInGamePlayers.find(
            (p) => p.isInGame && p.x === this.tile.x && p.y === this.tile.y,
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

    @HostListener('contextmenu', ['$event'])
    onRightClick(event: MouseEvent): void {
        event.preventDefault();
        event.stopPropagation();
        
        if (this.adminModeService.isAdminModeActivated() && this.inGameService.isMyTurn() && this.inGameService.isGameStarted()) {
            if (!this.playerOnTile && !this.objectOnTile) {
                this.inGameService.teleportPlayer(this.tile.x, this.tile.y);
                return;
            }
            return;
        }
        this.gameMapService.openTileModal(this.tile);
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


