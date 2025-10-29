import { CommonModule, NgStyle } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { GameEditorPlaceableDto } from '@app/dto/game-editor-placeable-dto';
import { AssetsService } from '@app/services/assets/assets.service';
import { GameMapService } from '@app/services/game-map/game-map.service';
import { PlaceableFootprint, PlaceableKind } from '@common/enums/placeable-kind.enum';
import { TileKind } from '@common/enums/tile-kind.enum';
import { InGamePlayer } from '@common/models/player.interface';
import { StartPoint } from '@common/models/start-point.interface';
import { GameMapTileComponent } from '@app/components/features/game-map-tile/game-map-tile.component';
import { GameMapTileModalComponent } from '@app/components/features/game-map-tile-modal/game-map-tile-modal.component';

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
    ) {}

    ngOnInit(): void {
        if (this.gameId) {
            this.gameMapService.loadGameMap(this.gameId);
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

    getTileClass(x: number, y: number): string {
        return this.gameMapService.getTileClass(x, y);
    }
}
