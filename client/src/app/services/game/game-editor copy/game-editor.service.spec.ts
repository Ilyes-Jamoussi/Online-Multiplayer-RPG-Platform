import { TestBed } from '@angular/core/testing';
import { GameMapService } from '@app/services/game-map/game-map.service';
import { ItemType } from '@common/enums/item-type.enum';
import { MapSize } from '@common/enums/map-size.enum';
import { TileType } from '@common/enums/tile-type.enum';
import { GameEditorService } from './game-editor.service';

describe('GameEditorService', () => {
    let service: GameEditorService;
    let mapService: jasmine.SpyObj<GameMapService>;

    const mockTiles = Array.from({ length: 2 }, () => Array.from({ length: 2 }, () => ({ type: TileType.Sand, item: null })));

    const mockItemContainers = [
        { item: ItemType.HealthAndDefenseBoost, count: 1 },
        { item: ItemType.SpeedAndAttackBoost, count: 1 },
        { item: ItemType.SpawnPoint, count: 2 },
    ];

    beforeEach(() => {
        mapService = jasmine.createSpyObj('GameMapService', ['buildBaseGrid', 'buildItemsContainer']);
        mapService.buildBaseGrid.and.returnValue(mockTiles);
        mapService.buildItemsContainer.and.returnValue(mockItemContainers);

        TestBed.configureTestingModule({
            providers: [GameEditorService, { provide: GameMapService, useValue: mapService }],
        });

        service = TestBed.inject(GameEditorService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should initialize map with correct size', () => {
        service.setMapSize(MapSize.Medium);
        expect(mapService.buildBaseGrid).toHaveBeenCalledWith(MapSize.Medium);
        expect(mapService.buildItemsContainer).toHaveBeenCalledWith(MapSize.Medium);
        expect(service.grid()).toEqual(mockTiles);
        expect(service.itemContainers()).toEqual(mockItemContainers);
    });

    it('should place and remove items correctly', () => {
        service.setMapSize(MapSize.Medium);
        service.setActiveItem(ItemType.HealthAndDefenseBoost);
        service.placeActiveItemAt(0, 0);

        const updatedTile = service.getTile(0, 0);
        expect(updatedTile.item).toBe(ItemType.HealthAndDefenseBoost);

        service.removeItemAt(0, 0);
        expect(service.getTile(0, 0).item).toBeNull();
    });

    it('should validate game before saving', () => {
        service.setMapSize(MapSize.Medium);
        service.setActiveItem(ItemType.HealthAndDefenseBoost);
        expect(service.canSaveGame()).toBeFalse();
    });
});
