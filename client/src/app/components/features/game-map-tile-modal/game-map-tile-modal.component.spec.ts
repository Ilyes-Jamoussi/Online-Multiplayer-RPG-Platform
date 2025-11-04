import { ComponentFixture, TestBed } from '@angular/core/testing';
import { GameMapTileModalComponent } from './game-map-tile-modal.component';
import { GameMapService } from '@app/services/game-map/game-map.service';
import { AssetsService } from '@app/services/assets/assets.service';
import { GameEditorTileDto } from '@app/dto/game-editor-tile-dto';
import { GameEditorPlaceableDto } from '@app/dto/game-editor-placeable-dto';
import { Player } from '@common/interfaces/player.interface';
import { TileKind } from '@common/enums/tile.enum';
import { PlaceableKind } from '@common/enums/placeable-kind.enum';
import { Avatar } from '@common/enums/avatar.enum';
import { Dice } from '@common/enums/dice.enum';

describe('GameMapTileModalComponent', () => {
    let component: GameMapTileModalComponent;
    let fixture: ComponentFixture<GameMapTileModalComponent>;
    let mockGameMapService: jasmine.SpyObj<GameMapService>;
    let mockAssetsService: jasmine.SpyObj<AssetsService>;

    const mockTile: GameEditorTileDto = {
        x: 1,
        y: 1,
        kind: TileKind.BASE,
        open: true,
    };

    const mockObject: GameEditorPlaceableDto = {
        id: '1',
        x: 1,
        y: 1,
        kind: PlaceableKind.START,
        orientation: 'north',
        placed: true,
    };

    const mockPlayer: Player = {
        id: 'player1',
        name: 'Player 1',
        avatar: Avatar.Avatar1,
        isAdmin: false,
        baseHealth: 4,
        healthBonus: 0,
        health: 4,
        maxHealth: 4,
        baseSpeed: 3,
        speedBonus: 0,
        speed: 3,
        baseAttack: 4,
        attackBonus: 0,
        attack: 4,
        baseDefense: 4,
        defenseBonus: 0,
        defense: 4,
        attackDice: Dice.D6,
        defenseDice: Dice.D6,
        x: 1,
        y: 1,
        isInGame: true,
        startPointId: 'start1',
        actionsRemaining: 2,
        combatCount: 0,
        combatWins: 0,
        combatLosses: 0,
        combatDraws: 0,
    };

    beforeEach(async () => {
        mockGameMapService = jasmine.createSpyObj('GameMapService', [
            'getObjectOnTile',
            'getPlayerOnTile',
            'getActiveTile',
            'getAvatarByPlayerId',
            'closeTileModal',
        ]);

        mockAssetsService = jasmine.createSpyObj('AssetsService', [
            'getTileImage',
            'getPlaceableImage',
        ]);

        mockGameMapService.getObjectOnTile.and.returnValue(mockObject);
        mockGameMapService.getPlayerOnTile.and.returnValue(mockPlayer);
        mockGameMapService.getActiveTile.and.returnValue(mockTile);
        mockGameMapService.getAvatarByPlayerId.and.returnValue('/assets/avatar1.png');
        mockAssetsService.getTileImage.and.returnValue('/assets/tile.png');
        mockAssetsService.getPlaceableImage.and.returnValue('/assets/placeable.png');

        await TestBed.configureTestingModule({
            imports: [GameMapTileModalComponent],
            providers: [
                { provide: GameMapService, useValue: mockGameMapService },
                { provide: AssetsService, useValue: mockAssetsService },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(GameMapTileModalComponent);
        component = fixture.componentInstance;
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should return object on tile from service', () => {
        expect(component.objectOnTile).toBe(mockObject);
        expect(mockGameMapService.getObjectOnTile).toHaveBeenCalled();
    });

    it('should return player on tile from service', () => {
        expect(component.playerOnTile).toBe(mockPlayer);
        expect(mockGameMapService.getPlayerOnTile).toHaveBeenCalled();
    });

    it('should return active tile from service', () => {
        expect(component.activeTile).toBe(mockTile);
        expect(mockGameMapService.getActiveTile).toHaveBeenCalled();
    });

    it('should get tile image with open state', () => {
        const result = component.getTileImage(mockTile);
        expect(result).toBe('/assets/tile.png');
        expect(mockAssetsService.getTileImage).toHaveBeenCalledWith(TileKind.BASE, true);
    });

    it('should get tile image with closed state when open is false', () => {
        const closedTile = { ...mockTile, open: false };
        component.getTileImage(closedTile);
        expect(mockAssetsService.getTileImage).toHaveBeenCalledWith(TileKind.BASE, false);
    });

    it('should get tile image with closed state when open is undefined', () => {
        const tileWithoutOpen = { ...mockTile };
        delete tileWithoutOpen.open;
        component.getTileImage(tileWithoutOpen);
        expect(mockAssetsService.getTileImage).toHaveBeenCalledWith(TileKind.BASE, false);
    });

    it('should return empty string when tile is null', () => {
        const result = component.getTileImage(null as any);
        expect(result).toBe('');
        expect(mockAssetsService.getTileImage).not.toHaveBeenCalled();
    });

    it('should get object image', () => {
        const result = component.getObjectImage(PlaceableKind.START);
        expect(result).toBe('/assets/placeable.png');
        expect(mockAssetsService.getPlaceableImage).toHaveBeenCalledWith(PlaceableKind.START);
    });

    it('should get player avatar', () => {
        const result = component.getPlayerAvatar('player1');
        expect(result).toBe('/assets/avatar1.png');
        expect(mockGameMapService.getAvatarByPlayerId).toHaveBeenCalledWith('player1');
    });

    it('should close modal', () => {
        component.close();
        expect(mockGameMapService.closeTileModal).toHaveBeenCalled();
    });

    it('should return undefined when no object on tile', () => {
        mockGameMapService.getObjectOnTile.and.returnValue(undefined);
        expect(component.objectOnTile).toBeUndefined();
    });

    it('should return undefined when no player on tile', () => {
        mockGameMapService.getPlayerOnTile.and.returnValue(undefined);
        expect(component.playerOnTile).toBeUndefined();
    });

    it('should return null when no active tile', () => {
        mockGameMapService.getActiveTile.and.returnValue(null);
        expect(component.activeTile).toBeNull();
    });
});