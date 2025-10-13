import { CommonModule, NgStyle } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { AssetsService } from '@app/services/assets/assets.service';
import { GameMapService } from '@app/services/game-map/game-map.service';
import { PlaceableFootprint, PlaceableKind } from '@common/enums/placeable-kind.enum';
import { TileKind } from '@common/enums/tile-kind.enum';

@Component({
    selector: 'app-game-map',
    standalone: true,
    imports: [CommonModule, NgStyle],
    templateUrl: './game-map.component.html',
    styleUrls: ['./game-map.component.scss'],
    providers: [GameMapService]
})
export class GameMapComponent implements OnInit {
    @Input() gameId!: string;

    constructor(
        private readonly gameMapService: GameMapService,
        private readonly assetsService: AssetsService
    ) {}

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
        return this.objects.filter((obj: any) => obj.placed).length;
    }

    get gridStyle() {
        return {
            gridTemplateColumns: `repeat(${this.size}, 1fr)`,
            gridTemplateRows: `repeat(${this.size}, 1fr)`
        };
    }

    getObjectStyle(obj: any) {
        const footprint = this.getObjectFootprint(obj.kind);
        return {
            gridColumn: `${obj.x + 1} / span ${footprint}`,
            gridRow: `${obj.y + 1} / span ${footprint}`
        };
    }

    ngOnInit(): void {
        if (this.gameId) {
            this.gameMapService.loadGameMap(this.gameId);
        }
    }

    getTileImage(tileKind: string, opened: boolean = false): string {
        return this.assetsService.getTileImage(tileKind as TileKind, opened);
    }

    getPlaceableImage(placeableKind: string): string {
        return this.assetsService.getPlaceableImage(placeableKind as PlaceableKind);
    }

    getObjectFootprint(placeableKind: string): number {
        return PlaceableFootprint[placeableKind as PlaceableKind] || 1;
    }
}
