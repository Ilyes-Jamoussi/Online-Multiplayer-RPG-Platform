import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { GameEditorPlaceableDto } from '@app/dto/game-editor-placeable-dto';
import { TeamColor } from '@app/enums/team-color.enum';
import { AssetsService } from '@app/services/assets/assets.service';
import { GameMapService } from '@app/services/game-map/game-map.service';
import { PlayerService } from '@app/services/player/player.service';
import { Avatar } from '@common/enums/avatar.enum';
import { Dice } from '@common/enums/dice.enum';
import { PlaceableKind } from '@common/enums/placeable-kind.enum';
import { FlagData } from '@common/interfaces/flag-data.interface';
import { Player } from '@common/interfaces/player.interface';
import { GameMapComponent } from './game-map.component';

const TEST_MAP_SIZE = 10;
const MOCK_TEAM_NUMBER_2 = 2;
const MOCK_PLACEABLE_ID = 'placeable1';
const MOCK_TURN_COUNT = 3;
const MOCK_BORDER_WIDTH = '3px';
const MOCK_BOX_SHADOW_BLUR = 15;
const MOCK_BOX_SHADOW_OFFSET_Y_SECOND = 2;
const MOCK_BOX_SHADOW_BLUR_SECOND = 4;
const MOCK_RGBA_R = 0;
const MOCK_RGBA_G = 0;
const MOCK_RGBA_B = 0;
const MOCK_RGBA_A = 0.5;

describe('GameMapComponent', () => {
    let component: GameMapComponent;
    let fixture: ComponentFixture<GameMapComponent>;
    let mockGameMapService: jasmine.SpyObj<GameMapService>;
    let mockAssetsService: jasmine.SpyObj<AssetsService>;
    let mockPlayerService: jasmine.SpyObj<PlayerService>;

    const mockPlayer: Player = {
        id: 'player1',
        name: 'Test Player',
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
        baseDefense: 4,
        defenseBonus: 0,
        attackDice: Dice.D6,
        defenseDice: Dice.D6,
        x: 2,
        y: 3,
        isInGame: true,
        startPointId: '',
        actionsRemaining: 1,
        combatCount: 0,
        combatWins: 0,
        combatLosses: 0,
        combatDraws: 0,
        hasCombatBonus: false,
        boatSpeedBonus: 0,
        boatSpeed: 0,
    };

    const mockObject: GameEditorPlaceableDto = {
        id: 'obj1',
        kind: PlaceableKind.START,
        orientation: 'north',
        x: 1,
        y: 1,
        placed: true,
    };

    beforeEach(async () => {
        mockGameMapService = jasmine.createSpyObj(
            'GameMapService',
            ['loadGameMap', 'getTileClass', 'getAvatarByPlayerId', 'flagData', 'isPlaceableDisabled', 'getPlaceableTurnCount'],
            {
                currentlyPlayers: [mockPlayer],
                tiles: signal([]),
                objects: signal([mockObject]),
                size: signal(TEST_MAP_SIZE),
                visibleObjects: signal([mockObject]),
            },
        );

        mockAssetsService = jasmine.createSpyObj('AssetsService', ['getTileImage', 'getPlaceableImage']);

        mockPlayerService = jasmine.createSpyObj('PlayerService', ['getTeamColor'], {
            id: signal('player1'),
        });

        await TestBed.configureTestingModule({
            imports: [GameMapComponent],
            providers: [
                provideHttpClient(),
                provideHttpClientTesting(),
                { provide: AssetsService, useValue: mockAssetsService },
                { provide: PlayerService, useValue: mockPlayerService },
            ],
        })
            .overrideComponent(GameMapComponent, {
                set: {
                    providers: [{ provide: GameMapService, useValue: mockGameMapService }],
                },
            })
            .compileComponents();

        fixture = TestBed.createComponent(GameMapComponent);
        component = fixture.componentInstance;
        component.gameId = 'test-game-id';
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should load game map on init when gameId is provided', () => {
        component.ngOnInit();
        expect(mockGameMapService.loadGameMap).toHaveBeenCalledWith('test-game-id');
    });

    it('should not load game map when gameId is not provided', () => {
        component.gameId = '';
        component.ngOnInit();
        expect(mockGameMapService.loadGameMap).not.toHaveBeenCalled();
    });

    describe('getters', () => {
        it('should return players from game map service', () => {
            expect(component.players).toEqual([mockPlayer]);
        });

        it('should return tiles from game map service', () => {
            expect(component.tiles).toEqual([]);
        });

        it('should return objects from game map service', () => {
            expect(component.objects).toEqual([mockObject]);
        });

        it('should return size from game map service', () => {
            expect(component.size).toBe(TEST_MAP_SIZE);
        });

        it('should return visible objects from game map service', () => {
            expect(component.visibleObjects).toEqual([mockObject]);
        });

        it('should return placed objects count', () => {
            expect(component.placedObjectsCount).toBe(1);
        });

        it('should return grid style with correct columns and rows', () => {
            const style = component.gridStyle;
            expect(style.gridTemplateColumns).toBe(`repeat(${TEST_MAP_SIZE}, 1fr)`);
            expect(style.gridTemplateRows).toBe(`repeat(${TEST_MAP_SIZE}, 1fr)`);
        });
    });

    describe('image methods', () => {
        it('should get tile image from assets service', () => {
            mockAssetsService.getTileImage.and.returnValue('tile.png');
            const result = component.getTileImage('base', true);
            expect(mockAssetsService.getTileImage).toHaveBeenCalledWith(jasmine.any(String), true);
            expect(result).toBe('tile.png');
        });

        it('should get object image from assets service', () => {
            mockAssetsService.getPlaceableImage.and.returnValue('object.png');
            const result = component.getObjectImage(mockObject);
            expect(mockAssetsService.getPlaceableImage).toHaveBeenCalledWith(PlaceableKind.START);
            expect(result).toBe('object.png');
        });

        it('should get placeable image from assets service', () => {
            mockAssetsService.getPlaceableImage.and.returnValue('placeable.png');
            const result = component.getPlaceableImage('start');
            expect(mockAssetsService.getPlaceableImage).toHaveBeenCalledWith(jasmine.any(String));
            expect(result).toBe('placeable.png');
        });

        it('should get player avatar image from game map service', () => {
            mockGameMapService.getAvatarByPlayerId.and.returnValue('avatar.png');
            const result = component.getPlayerAvatarImage('player1');
            expect(mockGameMapService.getAvatarByPlayerId).toHaveBeenCalledWith('player1');
            expect(result).toBe('avatar.png');
        });
    });

    describe('style methods', () => {
        it('should return object style with correct grid position', () => {
            const style = component.getObjectStyle(mockObject);
            expect(style.gridColumn).toBe('2 / span 1');
            expect(style.gridRow).toBe('2 / span 1');
        });

        it('should return player style with correct grid position', () => {
            const style = component.getPlayerStyle(mockPlayer);
            expect(style.gridColumn).toBe('3');
            expect(style.gridRow).toBe('4');
        });
    });

    describe('utility methods', () => {
        it('should get object footprint', () => {
            const footprint = component.getObjectFootprint(PlaceableKind.START);
            expect(footprint).toBe(1);
        });

        it('should get tile class from game map service', () => {
            mockGameMapService.getTileClass.and.returnValue('tile-class');
            const result = component.getTileClass(1, 2);
            expect(mockGameMapService.getTileClass).toHaveBeenCalledWith(1, 2);
            expect(result).toBe('tile-class');
        });

        it('should return true when player is current user', () => {
            expect(component.isCurrentUser(mockPlayer)).toBe(true);
        });

        it('should return false when player is not current user', () => {
            const otherPlayer = { ...mockPlayer, id: 'player2' };
            expect(component.isCurrentUser(otherPlayer)).toBe(false);
        });
    });

    describe('getTeamColor', () => {
        it('should return undefined when player is current user', () => {
            const result = component.getTeamColor(mockPlayer);
            expect(result).toBeUndefined();
        });

        it('should return team color when player is not current user', () => {
            const otherPlayer = { ...mockPlayer, id: 'player2', teamNumber: MOCK_TEAM_NUMBER_2 };
            mockPlayerService.getTeamColor.and.returnValue(TeamColor.EnemyTeam);
            const result = component.getTeamColor(otherPlayer);
            expect(result).toBe(TeamColor.EnemyTeam);
            expect(mockPlayerService.getTeamColor).toHaveBeenCalledWith(MOCK_TEAM_NUMBER_2);
        });
    });

    describe('getPlayerBorderStyle', () => {
        it('should return empty object when player is current user', () => {
            const result = component.getPlayerBorderStyle(mockPlayer);
            expect(result).toEqual({});
        });

        it('should return empty object when team color is undefined', () => {
            const otherPlayer = { ...mockPlayer, id: 'player2', teamNumber: MOCK_TEAM_NUMBER_2 };
            mockPlayerService.getTeamColor.and.returnValue(undefined);
            const result = component.getPlayerBorderStyle(otherPlayer);
            expect(result).toEqual({});
        });

        it('should return border style when team color exists', () => {
            const otherPlayer = { ...mockPlayer, id: 'player2', teamNumber: MOCK_TEAM_NUMBER_2 };
            mockPlayerService.getTeamColor.and.returnValue(TeamColor.EnemyTeam);
            const result = component.getPlayerBorderStyle(otherPlayer);
            expect(result).toEqual({
                'border-color': TeamColor.EnemyTeam,
                'border-width': MOCK_BORDER_WIDTH,
                'box-shadow': `0 0 ${MOCK_BOX_SHADOW_BLUR}px ${TeamColor.EnemyTeam}, ` +
                    `0 ${MOCK_BOX_SHADOW_OFFSET_Y_SECOND}px ${MOCK_BOX_SHADOW_BLUR_SECOND}px ` +
                    `rgba(${MOCK_RGBA_R}, ${MOCK_RGBA_G}, ${MOCK_RGBA_B}, ${MOCK_RGBA_A})`,
            });
        });
    });

    describe('hasFlag', () => {
        it('should return false when flag data is null', () => {
            mockGameMapService.flagData.and.returnValue(undefined);
            const result = component.hasFlag(mockPlayer);
            expect(result).toBe(false);
        });

        it('should return false when flag holder is different player', () => {
            const flagData: FlagData = {
                position: { x: 0, y: 0 },
                holderPlayerId: 'player2',
            };
            mockGameMapService.flagData.and.returnValue(flagData);
            const result = component.hasFlag(mockPlayer);
            expect(result).toBe(false);
        });

        it('should return true when flag holder matches player', () => {
            const flagData: FlagData = {
                position: { x: 0, y: 0 },
                holderPlayerId: mockPlayer.id,
            };
            mockGameMapService.flagData.and.returnValue(flagData);
            const result = component.hasFlag(mockPlayer);
            expect(result).toBe(true);
        });
    });

    describe('isPlaceableDisabled', () => {
        it('should return false when placeable is not disabled', () => {
            mockGameMapService.isPlaceableDisabled.and.returnValue(false);
            const result = component.isPlaceableDisabled(MOCK_PLACEABLE_ID);
            expect(result).toBe(false);
            expect(mockGameMapService.isPlaceableDisabled).toHaveBeenCalledWith(MOCK_PLACEABLE_ID);
        });

        it('should return true when placeable is disabled', () => {
            mockGameMapService.isPlaceableDisabled.and.returnValue(true);
            const result = component.isPlaceableDisabled(MOCK_PLACEABLE_ID);
            expect(result).toBe(true);
            expect(mockGameMapService.isPlaceableDisabled).toHaveBeenCalledWith(MOCK_PLACEABLE_ID);
        });
    });

    describe('getPlaceableTurnCount', () => {
        it('should return null when placeable has no turn count', () => {
            mockGameMapService.getPlaceableTurnCount.and.returnValue(null);
            const result = component.getPlaceableTurnCount(MOCK_PLACEABLE_ID);
            expect(result).toBeNull();
            expect(mockGameMapService.getPlaceableTurnCount).toHaveBeenCalledWith(MOCK_PLACEABLE_ID);
        });

        it('should return turn count when placeable has turn count', () => {
            mockGameMapService.getPlaceableTurnCount.and.returnValue(MOCK_TURN_COUNT);
            const result = component.getPlaceableTurnCount(MOCK_PLACEABLE_ID);
            expect(result).toBe(MOCK_TURN_COUNT);
            expect(mockGameMapService.getPlaceableTurnCount).toHaveBeenCalledWith(MOCK_PLACEABLE_ID);
        });
    });
});
