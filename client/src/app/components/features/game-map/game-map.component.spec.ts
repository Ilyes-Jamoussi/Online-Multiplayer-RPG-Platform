/* eslint-disable max-lines -- Extensive tests needed for 100% code coverage */
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { GameEditorPlaceableDto } from '@app/dto/game-editor-placeable-dto';
import { TeamColor } from '@app/enums/team-color.enum';
import { AssetsService } from '@app/services/assets/assets.service';
import { GameMapService } from '@app/services/game-map/game-map.service';
import { InGameService } from '@app/services/in-game/in-game.service';
import { PlayerService } from '@app/services/player/player.service';
import { GameMode } from '@common/enums/game-mode.enum';
import { Avatar } from '@common/enums/avatar.enum';
import { Dice } from '@common/enums/dice.enum';
import { PlaceableKind } from '@common/enums/placeable-kind.enum';
import { FlagData } from '@common/interfaces/flag-data.interface';
import { Player } from '@common/interfaces/player.interface';
import { StartPoint } from '@common/interfaces/start-point.interface';
import { GameMapComponent } from './game-map.component';

const TEST_MAP_SIZE = 10;
const MOCK_TEAM_NUMBER_2 = 2;
const MOCK_PLACEABLE_ID = 'placeable1';
const MOCK_TURN_COUNT = 3;
const MOCK_BORDER_WIDTH = '3px';
const MOCK_START_POINT_X = 5;
const MOCK_START_POINT_Y = 6;

describe('GameMapComponent', () => {
    let component: GameMapComponent;
    let fixture: ComponentFixture<GameMapComponent>;
    let mockGameMapService: jasmine.SpyObj<GameMapService>;
    let mockAssetsService: jasmine.SpyObj<AssetsService>;
    let mockPlayerService: jasmine.SpyObj<PlayerService>;
    let mockInGameService: { mode: () => GameMode; activePlayer: Player | null; startPoints: () => StartPoint[] };
    let modeSignal: ReturnType<typeof signal<GameMode>>;
    let startPointsSignal: ReturnType<typeof signal<StartPoint[]>>;

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

        modeSignal = signal(GameMode.CLASSIC);
        startPointsSignal = signal<StartPoint[]>([]);
        mockInGameService = {
            mode: () => modeSignal(),
            activePlayer: mockPlayer,
            startPoints: () => startPointsSignal(),
        };

        await TestBed.configureTestingModule({
            imports: [GameMapComponent],
            providers: [
                provideHttpClient(),
                provideHttpClientTesting(),
                { provide: AssetsService, useValue: mockAssetsService },
                { provide: PlayerService, useValue: mockPlayerService },
                { provide: InGameService, useValue: mockInGameService },
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

        it('should get tile image with default opened value false', () => {
            mockAssetsService.getTileImage.and.returnValue('tile-closed.png');
            const result = component.getTileImage('base');
            expect(mockAssetsService.getTileImage).toHaveBeenCalledWith(jasmine.any(String), false);
            expect(result).toBe('tile-closed.png');
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
        it('should return MyPlayer when player is current user', () => {
            const result = component.getTeamColor(mockPlayer);
            expect(result).toBe(TeamColor.MyPlayer);
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
        it('should return border style when player is current user', () => {
            const result = component.getPlayerBorderStyle(mockPlayer);
            expect(result).toEqual({
                'border-color': TeamColor.MyPlayer,
                'border-width': MOCK_BORDER_WIDTH,
            });
        });

        it('should return empty object when team color is undefined in CTF mode', () => {
            const otherPlayer = { ...mockPlayer, id: 'player2', teamNumber: MOCK_TEAM_NUMBER_2 };
            mockPlayerService.getTeamColor.and.returnValue(undefined);
            modeSignal.set(GameMode.CTF);
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

    describe('isActivePlayer', () => {
        it('should return true when player is active player', () => {
            expect(component.isActivePlayer(mockPlayer)).toBe(true);
        });

        it('should return false when player is not active player', () => {
            const otherPlayer = { ...mockPlayer, id: 'player2' };
            expect(component.isActivePlayer(otherPlayer)).toBe(false);
        });

        it('should return false when there is no active player', () => {
            mockInGameService.activePlayer = null;
            expect(component.isActivePlayer(mockPlayer)).toBe(false);
        });
    });

    describe('isCTFMode', () => {
        it('should return true when mode is CTF', () => {
            modeSignal.set(GameMode.CTF);
            expect(component.isCTFMode()).toBe(true);
        });

        it('should return false when mode is CLASSIC', () => {
            modeSignal.set(GameMode.CLASSIC);
            expect(component.isCTFMode()).toBe(false);
        });
    });

    describe('getTeamColor with MyTeam', () => {
        it('should return MyTeam when player is on same team but not current user', () => {
            const otherPlayer = { ...mockPlayer, id: 'player2', teamNumber: MOCK_TEAM_NUMBER_2 };
            mockPlayerService.getTeamColor.and.returnValue(TeamColor.MyTeam);
            const result = component.getTeamColor(otherPlayer);
            expect(result).toBe(TeamColor.MyTeam);
        });

        it('should return team color from service in CTF mode when not MyTeam', () => {
            const otherPlayer = { ...mockPlayer, id: 'player2', teamNumber: MOCK_TEAM_NUMBER_2 };
            modeSignal.set(GameMode.CTF);
            mockPlayerService.getTeamColor.and.returnValue(TeamColor.EnemyTeam);
            const result = component.getTeamColor(otherPlayer);
            expect(result).toBe(TeamColor.EnemyTeam);
        });
    });

    describe('startPoints', () => {
        it('should return start points from inGameService', () => {
            const mockStartPoints: StartPoint[] = [{ id: 'sp1', playerId: 'player1', x: 0, y: 0 }];
            startPointsSignal.set(mockStartPoints);
            expect(component.startPoints).toEqual(mockStartPoints);
        });
    });

    describe('isMyStartPoint', () => {
        it('should return true when start point belongs to current user', () => {
            const startPoint: StartPoint = { id: 'sp1', playerId: 'player1', x: 0, y: 0 };
            expect(component.isMyStartPoint(startPoint)).toBe(true);
        });

        it('should return false when start point belongs to other player', () => {
            const startPoint: StartPoint = { id: 'sp1', playerId: 'player2', x: 0, y: 0 };
            expect(component.isMyStartPoint(startPoint)).toBe(false);
        });
    });

    describe('getStartPointStyle', () => {
        it('should return correct grid position for start point', () => {
            const startPoint: StartPoint = { id: 'sp1', playerId: 'player1', x: MOCK_START_POINT_X, y: MOCK_START_POINT_Y };
            const style = component.getStartPointStyle(startPoint);
            expect(style.gridColumn).toBe(`${MOCK_START_POINT_X + 1}`);
            expect(style.gridRow).toBe(`${MOCK_START_POINT_Y + 1}`);
        });
    });

    describe('getStartPointAvatarImage', () => {
        it('should return avatar image from game map service', () => {
            mockGameMapService.getAvatarByPlayerId.and.returnValue('start-avatar.png');
            const result = component.getStartPointAvatarImage('player1');
            expect(mockGameMapService.getAvatarByPlayerId).toHaveBeenCalledWith('player1');
            expect(result).toBe('start-avatar.png');
        });
    });

    describe('getStartPointBorderStyle', () => {
        it('should return empty object when player not found', () => {
            Object.defineProperty(mockGameMapService, 'currentlyPlayers', { value: [], configurable: true });
            const startPoint: StartPoint = { id: 'sp1', playerId: 'unknown', x: 0, y: 0 };
            const result = component.getStartPointBorderStyle(startPoint);
            expect(result).toEqual({});
        });

        it('should return empty object when team color is undefined', () => {
            const otherPlayer = { ...mockPlayer, id: 'player2', teamNumber: undefined };
            Object.defineProperty(mockGameMapService, 'currentlyPlayers', { value: [otherPlayer], configurable: true });
            mockPlayerService.getTeamColor.and.returnValue(undefined);
            modeSignal.set(GameMode.CTF);
            const startPoint: StartPoint = { id: 'sp1', playerId: 'player2', x: 0, y: 0 };
            const result = component.getStartPointBorderStyle(startPoint);
            expect(result).toEqual({});
        });

        it('should return border style when player and team color exist', () => {
            Object.defineProperty(mockGameMapService, 'currentlyPlayers', { value: [mockPlayer], configurable: true });
            const startPoint: StartPoint = { id: 'sp1', playerId: 'player1', x: 0, y: 0 };
            const result = component.getStartPointBorderStyle(startPoint);
            expect(result).toEqual({
                'border-color': TeamColor.MyPlayer,
                'border-width': MOCK_BORDER_WIDTH,
            });
        });
    });
});
