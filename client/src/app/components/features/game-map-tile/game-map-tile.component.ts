import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, HostListener, Input } from '@angular/core';
import { GameEditorTileDto } from '@app/dto/game-editor-tile-dto';
import { GameEditorPlaceableDto } from '@app/dto/game-editor-placeable-dto';
import { Player } from '@common/models/player.interface';
import { GameMapService } from '@app/services/game-map/game-map.service';
import { AssetsService } from '@app/services/assets/assets.service';
import { InGameService } from '@app/services/in-game/in-game.service';
import { AdminModeService } from '@app/services/admin-mode/admin-mode.service';
import { CombatService } from '@app/services/combat/combat.service';

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
        private readonly combatService: CombatService,
    ) {}

    get objectOnTile(): GameEditorPlaceableDto | undefined {
        return this.gameMapService.objects().find((object) => object.placed && object.x === this.tile.x && object.y === this.tile.y);
    }

    get playerOnTile(): Player | undefined {
        return this.gameMapService.currentlyPlayers.find((player) => player.isInGame && player.x === this.tile.x && player.y === this.tile.y);
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
            if (!this.playerOnTile) {
                this.adminModeService.teleportPlayer(this.tile.x, this.tile.y);
            }
            return;
        }
        this.gameMapService.openTileModal(this.tile);
    }

    onTileClick(event: MouseEvent): void {
        event.preventDefault();

        if (!this.gameMapService.isActionModeActive) {
            return;
        }

        const actionType = this.gameMapService.getActionTypeAt(this.tile.x, this.tile.y);

        if (actionType === 'DOOR') {
            this.gameMapService.toggleDoor(this.tile.x, this.tile.y);
        } else if (actionType === 'ATTACK') {
            this.combatService.attackPlayer(this.tile.x, this.tile.y);
        }
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
