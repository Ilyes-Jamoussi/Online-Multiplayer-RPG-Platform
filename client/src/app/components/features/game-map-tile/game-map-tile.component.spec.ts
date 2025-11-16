import { WritableSignal, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { GameEditorPlaceableDto } from '@app/dto/game-editor-placeable-dto';
import { GameEditorTileDto } from '@app/dto/game-editor-tile-dto';
import { AdminModeService } from '@app/services/admin-mode/admin-mode.service';
import { AssetsService } from '@app/services/assets/assets.service';
import { CombatService } from '@app/services/combat/combat.service';
import { GameMapService } from '@app/services/game-map/game-map.service';
import { InGameService } from '@app/services/in-game/in-game.service';
import { Avatar } from '@common/enums/avatar.enum';
import { Dice } from '@common/enums/dice.enum';
import { PlaceableKind } from '@common/enums/placeable-kind.enum';
import { TileKind } from '@common/enums/tile.enum';
import { Player } from '@common/interfaces/player.interface';
import { GameMapTileComponent } from './game-map-tile.component';

const TEST_TILE_X = 5;
const TEST_TILE_Y = 3;

type MockGameMapService = Partial<Omit<GameMapService, 'currentlyPlayers' | 'isActionModeActive'>> & {
    _objectsSignal: WritableSignal<GameEditorPlaceableDto[]>;
    currentlyPlayers: Player[];
    isActionModeActive: boolean;
};

describe('GameMapTileComponent', () => {
    let component: GameMapTileComponent;
    let fixture: ComponentFixture<GameMapTileComponent>;
    let mockGameMapService: MockGameMapService;
    let mockAssetsService: jasmine.SpyObj<AssetsService>;
    let mockInGameService: Partial<InGameService>;
    let mockAdminModeService: jasmine.SpyObj<AdminModeService>;
    let mockCombatService: jasmine.SpyObj<CombatService>;

    const mockTile: GameEditorTileDto = {
        kind: TileKind.BASE,
        x: TEST_TILE_X,
        y: TEST_TILE_Y,
    };

    const mockPlayer: Player = {
        id: 'player-1',
        name: 'Test Player',
        avatar: Avatar.Avatar1,
        isAdmin: false,
        baseHealth: 10,
        healthBonus: 0,
        health: 10,
        maxHealth: 10,
        baseSpeed: 4,
        speedBonus: 0,
        speed: 4,
        baseAttack: 6,
        attackBonus: 0,
        baseDefense: 5,
        defenseBonus: 0,
        attackDice: Dice.D6,
        defenseDice: Dice.D6,
        x: TEST_TILE_X,
        y: TEST_TILE_Y,
        isInGame: true,
        startPointId: 'start-1',
        actionsRemaining: 2,
        combatCount: 0,
        combatWins: 0,
        combatLosses: 0,
        combatDraws: 0,
        hasCombatBonus: false,
        boatSpeedBonus: 0,
        boatSpeed: 0,
    };

    const mockObject: GameEditorPlaceableDto = {
        id: 'obj-1',
        kind: PlaceableKind.FLAG,
        orientation: 'north',
        x: TEST_TILE_X,
        y: TEST_TILE_Y,
        placed: true,
    };

    beforeEach(async () => {
        const objectsSignal = signal([mockObject]);

        mockGameMapService = {
            openTileModal: jasmine.createSpy('openTileModal'),
            closeTileModal: jasmine.createSpy('closeTileModal'),
            isTileModalOpen: jasmine.createSpy('isTileModalOpen').and.returnValue(false),
            toggleDoor: jasmine.createSpy('toggleDoor'),
            getActionTypeAt: jasmine.createSpy('getActionTypeAt').and.returnValue(null),
            getAvatarByPlayerId: jasmine.createSpy('getAvatarByPlayerId').and.returnValue(''),
            objects: objectsSignal.asReadonly(),
            currentlyPlayers: [mockPlayer],
            isActionModeActive: false,
            _objectsSignal: objectsSignal,
        };

        mockAssetsService = jasmine.createSpyObj('AssetsService', ['getPlaceableImage']);
        mockAssetsService.getPlaceableImage.and.returnValue('flag-image.png');

        mockInGameService = {
            isMyTurn: signal(true),
            isGameStarted: signal(true),
        };

        mockAdminModeService = jasmine.createSpyObj('AdminModeService', ['isAdminModeActivated', 'teleportPlayer']);
        mockAdminModeService.isAdminModeActivated.and.returnValue(false);

        mockCombatService = jasmine.createSpyObj('CombatService', ['attackPlayer']);

        await TestBed.configureTestingModule({
            imports: [GameMapTileComponent],
            providers: [
                { provide: GameMapService, useValue: mockGameMapService },
                { provide: AssetsService, useValue: mockAssetsService },
                { provide: InGameService, useValue: mockInGameService },
                { provide: AdminModeService, useValue: mockAdminModeService },
                { provide: CombatService, useValue: mockCombatService },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(GameMapTileComponent);
        component = fixture.componentInstance;
        component.tile = mockTile;
        component.imageSrc = 'tile-image.png';
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    describe('getters', () => {
        it('should return object on tile when object exists at tile position', () => {
            expect(component.objectOnTile).toEqual(mockObject);
        });

        it('should return undefined when no object on tile', () => {
            mockGameMapService._objectsSignal.set([]);
            expect(component.objectOnTile).toBeUndefined();
        });

        it('should return player on tile when player exists at tile position', () => {
            expect(component.playerOnTile).toEqual(mockPlayer);
        });

        it('should return undefined when no player on tile', () => {
            mockGameMapService.currentlyPlayers = [];
            expect(component.playerOnTile).toBeUndefined();
        });

        it('should return player avatar src when player on tile', () => {
            (mockGameMapService.getAvatarByPlayerId as jasmine.Spy).and.returnValue('avatar.png');
            expect(component.playerAvatarSrc).toBe('avatar.png');
            expect(mockGameMapService.getAvatarByPlayerId).toHaveBeenCalledWith('player-1');
        });

        it('should return empty string when no player on tile', () => {
            mockGameMapService.currentlyPlayers = [];
            expect(component.playerAvatarSrc).toBe('');
        });

        it('should return object image src when object on tile', () => {
            expect(component.objectImageSrc).toBe('flag-image.png');
            expect(mockAssetsService.getPlaceableImage).toHaveBeenCalledWith(PlaceableKind.FLAG);
        });

        it('should return empty string when no object on tile', () => {
            mockGameMapService._objectsSignal.set([]);
            expect(component.objectImageSrc).toBe('');
        });

        it('should return modal open state', () => {
            (mockGameMapService.isTileModalOpen as jasmine.Spy).and.returnValue(true);
            expect(component.isModalOpen).toBe(true);
            expect(mockGameMapService.isTileModalOpen).toHaveBeenCalledWith(mockTile);
        });
    });

    describe('onRightClick', () => {
        let mockEvent: jasmine.SpyObj<MouseEvent>;

        beforeEach(() => {
            mockEvent = jasmine.createSpyObj('MouseEvent', ['preventDefault', 'stopPropagation']);
        });

        it('should prevent default and stop propagation', () => {
            component.onRightClick(mockEvent);
            expect(mockEvent.preventDefault).toHaveBeenCalled();
            expect(mockEvent.stopPropagation).toHaveBeenCalled();
        });

        it('should teleport player when admin mode is active and conditions are met', () => {
            mockAdminModeService.isAdminModeActivated.and.returnValue(true);
            mockGameMapService.currentlyPlayers = [];

            component.onRightClick(mockEvent);
            expect(mockAdminModeService.teleportPlayer).toHaveBeenCalledWith(TEST_TILE_X, TEST_TILE_Y);
        });

        it('should open tile modal when not in admin mode', () => {
            mockAdminModeService.isAdminModeActivated.and.returnValue(false);

            component.onRightClick(mockEvent);
            expect(mockGameMapService.openTileModal).toHaveBeenCalledWith(mockTile);
        });
    });

    describe('onTileClick', () => {
        let mockEvent: jasmine.SpyObj<MouseEvent>;

        beforeEach(() => {
            mockEvent = jasmine.createSpyObj('MouseEvent', ['preventDefault']);
        });

        it('should prevent default', () => {
            component.onTileClick(mockEvent);
            expect(mockEvent.preventDefault).toHaveBeenCalled();
        });

        it('should return early when action mode is not active', () => {
            mockGameMapService.isActionModeActive = false;
            component.onTileClick(mockEvent);
            expect(mockGameMapService.getActionTypeAt).not.toHaveBeenCalled();
        });

        it('should toggle door when action type is DOOR', () => {
            mockGameMapService.isActionModeActive = true;
            (mockGameMapService.getActionTypeAt as jasmine.Spy).and.returnValue('DOOR');

            component.onTileClick(mockEvent);
            expect(mockGameMapService.toggleDoor).toHaveBeenCalledWith(TEST_TILE_X, TEST_TILE_Y);
        });

        it('should attack player when action type is ATTACK', () => {
            mockGameMapService.isActionModeActive = true;
            (mockGameMapService.getActionTypeAt as jasmine.Spy).and.returnValue('ATTACK');

            component.onTileClick(mockEvent);
            expect(mockCombatService.attackPlayer).toHaveBeenCalledWith(TEST_TILE_X, TEST_TILE_Y);
        });
    });

    describe('modal methods', () => {
        it('should open modal', () => {
            const mockEvent = jasmine.createSpyObj('MouseEvent', ['preventDefault']);
            component.openModal(mockEvent);
            expect(mockGameMapService.openTileModal).toHaveBeenCalledWith(mockTile);
        });

        it('should close modal', () => {
            component.closeModal();
            expect(mockGameMapService.closeTileModal).toHaveBeenCalled();
        });
    });
});
