/* eslint-disable max-lines -- Test file with comprehensive test coverage */
import { Game } from '@app/modules/game-store/entities/game.entity';
import { Placeable } from '@app/modules/game-store/entities/placeable.entity';
import { GameCacheService } from '@app/modules/in-game/services/game-cache/game-cache.service';
import { Avatar } from '@common/enums/avatar.enum';
import { Dice } from '@common/enums/dice.enum';
import { GameMode } from '@common/enums/game-mode.enum';
import { MapSize } from '@common/enums/map-size.enum';
import { PlaceableKind } from '@common/enums/placeable-kind.enum';
import { Player } from '@common/interfaces/player.interface';
import { InGameSession } from '@common/interfaces/session.interface';
import { Test, TestingModule } from '@nestjs/testing';
import { Types } from 'mongoose';
import { InitializationService } from './initialization.service';

const MOCK_SESSION_ID = 'session-123';
const MOCK_GAME_ID = 'game-123';
const MOCK_CHAT_ID = 'chat-123';
const MOCK_IN_GAME_ID = 'in-game-123';
const MOCK_PLAYER_ID_1 = 'player-1';
const MOCK_PLAYER_ID_2 = 'player-2';
const MOCK_PLAYER_ID_3 = 'player-3';
const MOCK_PLAYER_NAME_1 = 'Player 1';
const MOCK_SPEED_1 = 5;
const MOCK_SPEED_2 = 3;
const MOCK_SPEED_3 = 1;
const MOCK_X_1 = 0;
const MOCK_Y_1 = 0;
const MOCK_X_2 = 1;
const MOCK_Y_2 = 1;
const MOCK_X_3 = 2;
const MOCK_Y_3 = 2;
const MOCK_START_POINT_ID_1 = 'start-point-1';
const MOCK_START_POINT_ID_2 = 'start-point-2';
const MOCK_START_POINT_ID_3 = 'start-point-3';
const MOCK_ARRAY_INDEX_0 = 0;
const MOCK_ARRAY_INDEX_1 = 1;
const MOCK_ARRAY_INDEX_2 = 2;
const MOCK_RANDOM_VALUE_1 = 0.3;
const MOCK_RANDOM_VALUE_2 = 0.7;
const MOCK_RANDOM_VALUE_MIDDLE = 0.5;
const MOCK_RANDOM_VALUE_HIGH = 0.999;
const MOCK_BASE_HEALTH = 100;
const MOCK_HEALTH_BONUS = 0;
const MOCK_MAX_HEALTH = 100;
const MOCK_BASE_SPEED = 3;
const MOCK_SPEED_BONUS = 0;
const MOCK_BASE_ATTACK = 10;
const MOCK_ATTACK_BONUS = 0;
const MOCK_BASE_DEFENSE = 5;
const MOCK_DEFENSE_BONUS = 0;
const MOCK_ACTIONS_REMAINING = 1;
const MOCK_COMBAT_COUNT = 0;
const MOCK_COMBAT_WINS = 0;
const MOCK_COMBAT_LOSSES = 0;
const MOCK_COMBAT_DRAWS = 0;
const MOCK_MAX_PLAYERS = 4;
const MOCK_TURN_NUMBER = 1;
const MOCK_PLAYER_COUNT = 2;

describe('InitializationService', () => {
    const MOCK_ARRAY_LENGTH_2 = 2;
    const MOCK_ARRAY_LENGTH_3 = 3;

    let service: InitializationService;
    let mockGameCacheService: jest.Mocked<GameCacheService>;

    const createMockPlayer = (overrides: Partial<Player> = {}): Player => ({
        id: MOCK_PLAYER_ID_1,
        name: MOCK_PLAYER_NAME_1,
        avatar: Avatar.Avatar1,
        isAdmin: false,
        baseHealth: MOCK_BASE_HEALTH,
        healthBonus: MOCK_HEALTH_BONUS,
        health: MOCK_BASE_HEALTH,
        maxHealth: MOCK_MAX_HEALTH,
        baseSpeed: MOCK_BASE_SPEED,
        speedBonus: MOCK_SPEED_BONUS,
        speed: MOCK_SPEED_1,
        boatSpeedBonus: 0,
        boatSpeed: 0,
        baseAttack: MOCK_BASE_ATTACK,
        attackBonus: MOCK_ATTACK_BONUS,
        baseDefense: MOCK_BASE_DEFENSE,
        defenseBonus: MOCK_DEFENSE_BONUS,
        attackDice: Dice.D6,
        defenseDice: Dice.D4,
        x: MOCK_X_1,
        y: MOCK_Y_1,
        isInGame: true,
        startPointId: '',
        actionsRemaining: MOCK_ACTIONS_REMAINING,
        combatCount: MOCK_COMBAT_COUNT,
        combatWins: MOCK_COMBAT_WINS,
        combatLosses: MOCK_COMBAT_LOSSES,
        combatDraws: MOCK_COMBAT_DRAWS,
        hasCombatBonus: false,
        ...overrides,
    });

    const createMockPlaceable = (overrides: Partial<Placeable> = {}): Placeable => {
        const mockObjectId = new Types.ObjectId();
        Object.defineProperty(mockObjectId, 'toString', {
            value: jest.fn().mockReturnValue(MOCK_START_POINT_ID_1),
            writable: true,
        });
        return {
            _id: mockObjectId,
            kind: PlaceableKind.START,
            x: MOCK_X_1,
            y: MOCK_Y_1,
            placed: true,
            ...overrides,
        };
    };

    const createMockGame = (overrides: Partial<Game> = {}): Game => {
        const mockObjectId = new Types.ObjectId();
        Object.defineProperty(mockObjectId, 'toString', {
            value: jest.fn().mockReturnValue(MOCK_GAME_ID),
            writable: true,
        });
        return {
            _id: mockObjectId,
            name: 'Test Game',
            description: 'Test Description',
            size: MapSize.MEDIUM,
            mode: GameMode.CLASSIC,
            visibility: true,
            lastModified: new Date(),
            createdAt: new Date(),
            gridPreviewUrl: '',
            tiles: [],
            objects: [],
            draft: false,
            teleportChannels: [],
            ...overrides,
        };
    };

    const createMockInGameSession = (overrides: Partial<InGameSession> = {}): InGameSession => ({
        id: MOCK_SESSION_ID,
        inGameId: MOCK_IN_GAME_ID,
        gameId: MOCK_GAME_ID,
        maxPlayers: MOCK_MAX_PLAYERS,
        mode: GameMode.CLASSIC,
        chatId: MOCK_CHAT_ID,
        isGameStarted: false,
        inGamePlayers: {
            [MOCK_PLAYER_ID_1]: createMockPlayer({ id: MOCK_PLAYER_ID_1 }),
            [MOCK_PLAYER_ID_2]: createMockPlayer({ id: MOCK_PLAYER_ID_2 }),
        },
        teams: {
            // eslint-disable-next-line @typescript-eslint/naming-convention -- Team number must be numeric
            1: { number: 1, playerIds: [MOCK_PLAYER_ID_1, MOCK_PLAYER_ID_2] },
        },
        currentTurn: { turnNumber: MOCK_TURN_NUMBER, activePlayerId: MOCK_PLAYER_ID_1, hasUsedAction: false },
        startPoints: [],
        mapSize: MapSize.MEDIUM,
        turnOrder: [MOCK_PLAYER_ID_1, MOCK_PLAYER_ID_2],
        playerCount: MOCK_PLAYER_COUNT,
        ...overrides,
    });

    beforeEach(async () => {
        mockGameCacheService = {
            setTileOccupant: jest.fn(),
        } as unknown as jest.Mocked<GameCacheService>;

        const module: TestingModule = await Test.createTestingModule({
            providers: [InitializationService, { provide: GameCacheService, useValue: mockGameCacheService }],
        }).compile();

        service = module.get<InitializationService>(InitializationService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('makeTurnOrder', () => {
        it('should sort players by speed in descending order', () => {
            const player1 = createMockPlayer({ id: MOCK_PLAYER_ID_1, speed: MOCK_SPEED_1 });
            const player2 = createMockPlayer({ id: MOCK_PLAYER_ID_2, speed: MOCK_SPEED_2 });
            const player3 = createMockPlayer({ id: MOCK_PLAYER_ID_3, speed: MOCK_SPEED_3 });
            const players = [player2, player3, player1];

            const result = service.makeTurnOrder(players);

            expect(result[MOCK_ARRAY_INDEX_0]).toBe(MOCK_PLAYER_ID_1);
            expect(result[MOCK_ARRAY_INDEX_1]).toBe(MOCK_PLAYER_ID_2);
            expect(result[MOCK_ARRAY_INDEX_2]).toBe(MOCK_PLAYER_ID_3);
        });

        it('should shuffle players with same speed', () => {
            const player1 = createMockPlayer({ id: MOCK_PLAYER_ID_1, speed: MOCK_SPEED_1 });
            const player2 = createMockPlayer({ id: MOCK_PLAYER_ID_2, speed: MOCK_SPEED_1 });
            const players = [player1, player2];
            const originalRandom = Math.random;
            let callCount = 0;
            Math.random = jest.fn().mockImplementation(() => {
                callCount++;
                return callCount === 1 ? MOCK_RANDOM_VALUE_1 : MOCK_RANDOM_VALUE_2;
            });

            const result = service.makeTurnOrder(players);

            expect(result.length).toBe(MOCK_ARRAY_LENGTH_2);
            expect(result).toContain(MOCK_PLAYER_ID_1);
            expect(result).toContain(MOCK_PLAYER_ID_2);
            Math.random = originalRandom;
        });

        it('should handle single player', () => {
            const player = createMockPlayer({ id: MOCK_PLAYER_ID_1, speed: MOCK_SPEED_1 });
            const players = [player];

            const result = service.makeTurnOrder(players);

            expect(result.length).toBe(1);
            expect(result[MOCK_ARRAY_INDEX_0]).toBe(MOCK_PLAYER_ID_1);
        });

        it('should include all players in result', () => {
            const player1 = createMockPlayer({ id: MOCK_PLAYER_ID_1, speed: MOCK_SPEED_1 });
            const player2 = createMockPlayer({ id: MOCK_PLAYER_ID_2, speed: MOCK_SPEED_2 });
            const player3 = createMockPlayer({ id: MOCK_PLAYER_ID_3, speed: MOCK_SPEED_3 });
            const players = [player1, player2, player3];

            const result = service.makeTurnOrder(players);

            expect(result.length).toBe(MOCK_ARRAY_LENGTH_3);
            expect(result).toContain(MOCK_PLAYER_ID_1);
            expect(result).toContain(MOCK_PLAYER_ID_2);
            expect(result).toContain(MOCK_PLAYER_ID_3);
        });

        it('should handle players with different speeds correctly', () => {
            const originalRandom = Math.random;
            let callCount = 0;
            jest.spyOn(Math, 'random').mockImplementation(() => {
                callCount++;
                if (callCount === 1) return 0.0;
                return MOCK_RANDOM_VALUE_MIDDLE;
            });

            const player1 = createMockPlayer({ id: MOCK_PLAYER_ID_1, speed: MOCK_SPEED_1 });
            const player2 = createMockPlayer({ id: MOCK_PLAYER_ID_2, speed: MOCK_SPEED_2 });
            const player3 = createMockPlayer({ id: MOCK_PLAYER_ID_3, speed: MOCK_SPEED_1 });
            const players = [player2, player3, player1];

            const result = service.makeTurnOrder(players);

            expect(result[MOCK_ARRAY_INDEX_0]).toBe(MOCK_PLAYER_ID_1);
            expect(result[MOCK_ARRAY_INDEX_1]).toBe(MOCK_PLAYER_ID_3);
            expect(result[MOCK_ARRAY_INDEX_2]).toBe(MOCK_PLAYER_ID_2);

            jest.restoreAllMocks();
            Math.random = originalRandom;
        });
    });

    describe('assignStartPoints', () => {
        it('should assign start points to all players', () => {
            const mockObjectId1 = new Types.ObjectId();
            Object.defineProperty(mockObjectId1, 'toString', {
                value: jest.fn().mockReturnValue(MOCK_START_POINT_ID_1),
                writable: true,
            });
            const mockObjectId2 = new Types.ObjectId();
            Object.defineProperty(mockObjectId2, 'toString', {
                value: jest.fn().mockReturnValue(MOCK_START_POINT_ID_2),
                writable: true,
            });
            const startPoint1 = createMockPlaceable({
                _id: mockObjectId1,
                x: MOCK_X_1,
                y: MOCK_Y_1,
            });
            const startPoint2 = createMockPlaceable({
                _id: mockObjectId2,
                x: MOCK_X_2,
                y: MOCK_Y_2,
            });
            const game = createMockGame({ objects: [startPoint1, startPoint2] });
            const session = createMockInGameSession({
                turnOrder: [MOCK_PLAYER_ID_1, MOCK_PLAYER_ID_2],
                inGamePlayers: {
                    [MOCK_PLAYER_ID_1]: createMockPlayer({ id: MOCK_PLAYER_ID_1 }),
                    [MOCK_PLAYER_ID_2]: createMockPlayer({ id: MOCK_PLAYER_ID_2 }),
                },
            });

            service.assignStartPoints(session, game);

            expect(session.startPoints.length).toBe(MOCK_ARRAY_LENGTH_2);
            expect(session.startPoints[MOCK_ARRAY_INDEX_0].playerId).toBe(MOCK_PLAYER_ID_1);
            expect(session.startPoints[MOCK_ARRAY_INDEX_1].playerId).toBe(MOCK_PLAYER_ID_2);
        });

        it('should set player positions correctly', () => {
            const mockObjectId = new Types.ObjectId();
            Object.defineProperty(mockObjectId, 'toString', {
                value: jest.fn().mockReturnValue(MOCK_START_POINT_ID_1),
                writable: true,
            });
            const startPoint = createMockPlaceable({
                _id: mockObjectId,
                x: MOCK_X_1,
                y: MOCK_Y_1,
            });
            const game = createMockGame({ objects: [startPoint] });
            const player = createMockPlayer({ id: MOCK_PLAYER_ID_1, x: 0, y: 0 });
            const session = createMockInGameSession({
                turnOrder: [MOCK_PLAYER_ID_1],
                inGamePlayers: { [MOCK_PLAYER_ID_1]: player },
            });

            service.assignStartPoints(session, game);

            expect(player.x).toBe(MOCK_X_1);
            expect(player.y).toBe(MOCK_Y_1);
            expect(player.startPointId).toBe(MOCK_START_POINT_ID_1);
        });

        it('should call setTileOccupant for each player', () => {
            const originalRandom = Math.random;
            jest.spyOn(Math, 'random').mockReturnValue(MOCK_RANDOM_VALUE_HIGH);

            const mockObjectId1 = new Types.ObjectId();
            Object.defineProperty(mockObjectId1, 'toString', {
                value: jest.fn().mockReturnValue(MOCK_START_POINT_ID_1),
                writable: true,
            });
            const mockObjectId2 = new Types.ObjectId();
            Object.defineProperty(mockObjectId2, 'toString', {
                value: jest.fn().mockReturnValue(MOCK_START_POINT_ID_2),
                writable: true,
            });
            const startPoint1 = createMockPlaceable({
                _id: mockObjectId1,
                x: MOCK_X_1,
                y: MOCK_Y_1,
            });
            const startPoint2 = createMockPlaceable({
                _id: mockObjectId2,
                x: MOCK_X_2,
                y: MOCK_Y_2,
            });
            const game = createMockGame({ objects: [startPoint1, startPoint2] });
            const player1 = createMockPlayer({ id: MOCK_PLAYER_ID_1 });
            const player2 = createMockPlayer({ id: MOCK_PLAYER_ID_2 });
            const session = createMockInGameSession({
                turnOrder: [MOCK_PLAYER_ID_1, MOCK_PLAYER_ID_2],
                inGamePlayers: {
                    [MOCK_PLAYER_ID_1]: player1,
                    [MOCK_PLAYER_ID_2]: player2,
                },
            });

            service.assignStartPoints(session, game);

            expect(mockGameCacheService.setTileOccupant).toHaveBeenCalledTimes(MOCK_ARRAY_LENGTH_2);
            expect(mockGameCacheService.setTileOccupant).toHaveBeenCalledWith(MOCK_SESSION_ID, { x: MOCK_X_1, y: MOCK_Y_1 }, player1);
            expect(mockGameCacheService.setTileOccupant).toHaveBeenCalledWith(MOCK_SESSION_ID, { x: MOCK_X_2, y: MOCK_Y_2 }, player2);

            jest.restoreAllMocks();
            Math.random = originalRandom;
        });

        it('should create startPoints with correct structure', () => {
            const mockObjectId = new Types.ObjectId();
            Object.defineProperty(mockObjectId, 'toString', {
                value: jest.fn().mockReturnValue(MOCK_START_POINT_ID_1),
                writable: true,
            });
            const startPoint = createMockPlaceable({
                _id: mockObjectId,
                x: MOCK_X_1,
                y: MOCK_Y_1,
            });
            const game = createMockGame({ objects: [startPoint] });
            const session = createMockInGameSession({
                turnOrder: [MOCK_PLAYER_ID_1],
                inGamePlayers: { [MOCK_PLAYER_ID_1]: createMockPlayer({ id: MOCK_PLAYER_ID_1 }) },
            });

            service.assignStartPoints(session, game);

            expect(session.startPoints[MOCK_ARRAY_INDEX_0].id).toBe(MOCK_START_POINT_ID_1);
            expect(session.startPoints[MOCK_ARRAY_INDEX_0].playerId).toBe(MOCK_PLAYER_ID_1);
            expect(session.startPoints[MOCK_ARRAY_INDEX_0].x).toBe(MOCK_X_1);
            expect(session.startPoints[MOCK_ARRAY_INDEX_0].y).toBe(MOCK_Y_1);
        });

        it('should throw error when not enough start points', () => {
            const mockObjectId = new Types.ObjectId();
            Object.defineProperty(mockObjectId, 'toString', {
                value: jest.fn().mockReturnValue(MOCK_START_POINT_ID_1),
                writable: true,
            });
            const startPoint = createMockPlaceable({
                _id: mockObjectId,
                x: MOCK_X_1,
                y: MOCK_Y_1,
            });
            const game = createMockGame({ objects: [startPoint] });
            const session = createMockInGameSession({
                turnOrder: [MOCK_PLAYER_ID_1, MOCK_PLAYER_ID_2],
                inGamePlayers: {
                    [MOCK_PLAYER_ID_1]: createMockPlayer({ id: MOCK_PLAYER_ID_1 }),
                    [MOCK_PLAYER_ID_2]: createMockPlayer({ id: MOCK_PLAYER_ID_2 }),
                },
            });

            expect(() => service.assignStartPoints(session, game)).toThrow('Pas assez de points de départ');
        });

        it('should filter only START placeables', () => {
            const mockObjectId1 = new Types.ObjectId();
            Object.defineProperty(mockObjectId1, 'toString', {
                value: jest.fn().mockReturnValue(MOCK_START_POINT_ID_1),
                writable: true,
            });
            const mockObjectId2 = new Types.ObjectId();
            Object.defineProperty(mockObjectId2, 'toString', {
                value: jest.fn().mockReturnValue('heal-1'),
                writable: true,
            });
            const startPoint = createMockPlaceable({
                _id: mockObjectId1,
                kind: PlaceableKind.START,
                x: MOCK_X_1,
                y: MOCK_Y_1,
            });
            const healPlaceable = createMockPlaceable({
                _id: mockObjectId2,
                kind: PlaceableKind.HEAL,
                x: MOCK_X_2,
                y: MOCK_Y_2,
            });
            const game = createMockGame({ objects: [startPoint, healPlaceable] });
            const session = createMockInGameSession({
                turnOrder: [MOCK_PLAYER_ID_1],
                inGamePlayers: { [MOCK_PLAYER_ID_1]: createMockPlayer({ id: MOCK_PLAYER_ID_1 }) },
            });

            service.assignStartPoints(session, game);

            expect(session.startPoints.length).toBe(1);
            expect(session.startPoints[MOCK_ARRAY_INDEX_0].x).toBe(MOCK_X_1);
            expect(session.startPoints[MOCK_ARRAY_INDEX_0].y).toBe(MOCK_Y_1);
        });

        it('should shuffle start points before assignment', () => {
            const mockObjectId1 = new Types.ObjectId();
            Object.defineProperty(mockObjectId1, 'toString', {
                value: jest.fn().mockReturnValue(MOCK_START_POINT_ID_1),
                writable: true,
            });
            const mockObjectId2 = new Types.ObjectId();
            Object.defineProperty(mockObjectId2, 'toString', {
                value: jest.fn().mockReturnValue(MOCK_START_POINT_ID_2),
                writable: true,
            });
            const mockObjectId3 = new Types.ObjectId();
            Object.defineProperty(mockObjectId3, 'toString', {
                value: jest.fn().mockReturnValue(MOCK_START_POINT_ID_3),
                writable: true,
            });
            const startPoint1 = createMockPlaceable({
                _id: mockObjectId1,
                x: MOCK_X_1,
                y: MOCK_Y_1,
            });
            const startPoint2 = createMockPlaceable({
                _id: mockObjectId2,
                x: MOCK_X_2,
                y: MOCK_Y_2,
            });
            const startPoint3 = createMockPlaceable({
                _id: mockObjectId3,
                x: MOCK_X_3,
                y: MOCK_Y_3,
            });
            const game = createMockGame({ objects: [startPoint1, startPoint2, startPoint3] });
            const session = createMockInGameSession({
                turnOrder: [MOCK_PLAYER_ID_1],
                inGamePlayers: { [MOCK_PLAYER_ID_1]: createMockPlayer({ id: MOCK_PLAYER_ID_1 }) },
            });
            const originalRandom = Math.random;
            Math.random = jest.fn().mockReturnValue(MOCK_RANDOM_VALUE_1);

            service.assignStartPoints(session, game);

            expect(session.startPoints.length).toBe(1);
            Math.random = originalRandom;
        });
    });
});
