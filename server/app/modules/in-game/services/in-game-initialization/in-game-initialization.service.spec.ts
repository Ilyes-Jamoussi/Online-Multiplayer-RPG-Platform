/* eslint-disable max-lines -- Test file with comprehensive coverage */
import { InGameInitializationService } from './in-game-initialization.service';
import { GameCacheService } from '@app/modules/in-game/services/game-cache/game-cache.service';
import { InGameSessionRepository } from '@app/modules/in-game/services/in-game-session/in-game-session.repository';
import { Game } from '@app/modules/game-store/entities/game.entity';
import { InGameSession } from '@common/interfaces/session.interface';
import { Player } from '@common/interfaces/player.interface';
import { Avatar } from '@common/enums/avatar.enum';
import { Dice } from '@common/enums/dice.enum';
import { GameMode } from '@common/enums/game-mode.enum';
import { MapSize } from '@common/enums/map-size.enum';
import { Orientation } from '@common/enums/orientation.enum';
import { PlaceableKind } from '@common/enums/placeable-kind.enum';
import { Types } from 'mongoose';

describe('InGameInitializationService', () => {
    let service: InGameInitializationService;
    let sessionRepository: jest.Mocked<InGameSessionRepository>;
    let gameCache: jest.Mocked<GameCacheService>;

    const SESSION_ID = 'session-123';
    const PLAYER_A_ID = 'player-a';
    const PLAYER_B_ID = 'player-b';
    const PLAYER_C_ID = 'player-c';
    const BASE_SPEED = 3;
    const BASE_HEALTH = 100;
    const BASE_ATTACK = 10;
    const BASE_DEFENSE = 5;
    const NO_BONUS = 0;
    const ACTIONS_REMAINING = 1;
    const NO_COMBAT_STATS = 0;
    const SPEED_5 = 5;
    const SPEED_4 = 4;
    const LARGE_ARRAY_SIZE = 1000;
    const SHUFFLE_ITERATIONS = 10;
    const ARRAY_SIZE_FIVE = 5;
    const ARRAY_SIZE_TEN = 10;
    const SINGLE_ELEMENT = 42;
    const COORDINATE_TEN = 10;
    const START_POINT_COUNT_FIVE = 5;
    const START_POINT_COUNT_TEN = 10;
    const PLAYER_STAT_TWO = 2;
    const INITIAL_X = 0;
    const INITIAL_Y = 0;
    const MAX_PLAYERS = 4;
    const PLAYER_COUNT = 3;
    const ARRAY_ELEMENT_3 = 3;

    const createMockPlayer = (overrides: Partial<Player> = {}): Player => ({
        id: PLAYER_A_ID,
        name: 'Player A',
        avatar: Avatar.Avatar1,
        isAdmin: false,
        baseHealth: BASE_HEALTH,
        healthBonus: NO_BONUS,
        health: BASE_HEALTH,
        maxHealth: BASE_HEALTH,
        baseSpeed: BASE_SPEED,
        speedBonus: NO_BONUS,
        speed: BASE_SPEED,
        baseAttack: BASE_ATTACK,
        attackBonus: NO_BONUS,
        attack: BASE_ATTACK,
        baseDefense: BASE_DEFENSE,
        defenseBonus: NO_BONUS,
        defense: BASE_DEFENSE,
        attackDice: Dice.D6,
        defenseDice: Dice.D4,
        x: INITIAL_X,
        y: INITIAL_Y,
        isInGame: false,
        startPointId: '',
        actionsRemaining: ACTIONS_REMAINING,
        combatCount: NO_COMBAT_STATS,
        combatWins: NO_COMBAT_STATS,
        combatLosses: NO_COMBAT_STATS,
        combatDraws: NO_COMBAT_STATS,
        ...overrides,
    });

    const createMockSession = (overrides: Partial<InGameSession> = {}): InGameSession => ({
        id: SESSION_ID,
        inGameId: `${SESSION_ID}-game-456`,
        gameId: 'game-456',
        maxPlayers: MAX_PLAYERS,
        isGameStarted: false,
        inGamePlayers: {
            [PLAYER_A_ID]: createMockPlayer({ id: PLAYER_A_ID }),
            [PLAYER_B_ID]: createMockPlayer({ id: PLAYER_B_ID }),
            [PLAYER_C_ID]: createMockPlayer({ id: PLAYER_C_ID }),
        },
        currentTurn: { turnNumber: 1, activePlayerId: PLAYER_A_ID, hasUsedAction: false },
        startPoints: [],
        mapSize: MapSize.MEDIUM,
        mode: GameMode.CLASSIC,
        turnOrder: [PLAYER_A_ID, PLAYER_B_ID, PLAYER_C_ID],
        isAdminModeActive: false,
        ...overrides,
    });

    const createMockGame = (startPointCount = PLAYER_COUNT): Game => {
        const startPoints = Array.from({ length: startPointCount }, (_, i) => ({
            _id: new Types.ObjectId(),
            kind: PlaceableKind.START,
            x: i * PLAYER_STAT_TWO,
            y: i * PLAYER_STAT_TWO,
            placed: true,
            orientation: Orientation.N,
        }));

        return {
            _id: new Types.ObjectId(),
            name: 'Test Game',
            description: 'Test Description',
            size: MapSize.MEDIUM,
            mode: GameMode.CLASSIC,
            tiles: [],
            objects: startPoints,
            visibility: true,
            lastModified: new Date(),
            createdAt: new Date(),
            gridPreviewUrl: '',
            draft: false,
        };
    };

    beforeEach(() => {
        const mockSessionRepository = {};
        const mockGameCache = {
            setTileOccupant: jest.fn(),
        };

        sessionRepository = mockSessionRepository as unknown as jest.Mocked<InGameSessionRepository>;
        gameCache = mockGameCache as unknown as jest.Mocked<GameCacheService>;

        service = new InGameInitializationService(sessionRepository, gameCache);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('shuffleArray', () => {
        it('should return array with same length and elements', () => {
            const input = [1, PLAYER_STAT_TWO, ARRAY_ELEMENT_3, ARRAY_SIZE_FIVE - 1, ARRAY_SIZE_FIVE];
            const result = service.shuffleArray(input);

            expect(result.length).toBe(input.length);
            expect(result.sort()).toEqual(input.sort());
        });

        it('should not modify the original array', () => {
            const input = [1, PLAYER_STAT_TWO, ARRAY_ELEMENT_3];
            const original = [...input];

            service.shuffleArray(input);

            expect(input).toEqual(original);
        });

        it('should handle empty array', () => {
            expect(service.shuffleArray([])).toEqual([]);
        });

        it('should handle single element array', () => {
            expect(service.shuffleArray([SINGLE_ELEMENT])).toEqual([SINGLE_ELEMENT]);
        });

        it('should handle different types', () => {
            const strings = service.shuffleArray(['a', 'b', 'c']);
            expect(strings.length).toBe(PLAYER_COUNT);

            const objects = service.shuffleArray([{ id: 1 }, { id: PLAYER_STAT_TWO }]);
            expect(objects.length).toBe(PLAYER_STAT_TWO);
        });

        it('should produce different results (randomness check)', () => {
            const input = Array.from({ length: ARRAY_SIZE_TEN }, (_, i) => i);
            const results = new Set<string>();

            for (let i = 0; i < SHUFFLE_ITERATIONS; i++) {
                results.add(JSON.stringify(service.shuffleArray(input)));
            }

            expect(results.size).toBeGreaterThan(1);
        });

        it('should handle large arrays efficiently', () => {
            const input = Array.from({ length: LARGE_ARRAY_SIZE }, (_, i) => i);
            const result = service.shuffleArray(input);

            expect(result.length).toBe(LARGE_ARRAY_SIZE);
            expect(result.sort((a, b) => a - b)).toEqual(input);
        });

        it('should preserve duplicates', () => {
            const input = [1, 1, PLAYER_STAT_TWO, PLAYER_STAT_TWO];
            const result = service.shuffleArray(input);

            expect(result.filter((r) => r === 1).length).toBe(PLAYER_STAT_TWO);
            expect(result.filter((r) => r === PLAYER_STAT_TWO).length).toBe(PLAYER_STAT_TWO);
        });
    });

    describe('makeTurnOrder', () => {
        it('should order players by speed descending', () => {
            const players = [
                createMockPlayer({ id: PLAYER_A_ID, speed: BASE_SPEED }),
                createMockPlayer({ id: PLAYER_B_ID, speed: SPEED_5 }),
                createMockPlayer({ id: PLAYER_C_ID, speed: SPEED_4 }),
            ];

            const result = service.makeTurnOrder(players);

            expect(result[0]).toBe(PLAYER_B_ID);
            expect(result[1]).toBe(PLAYER_C_ID);
            expect(result[PLAYER_STAT_TWO]).toBe(PLAYER_A_ID);
        });

        it('should shuffle players with same speed', () => {
            const players = [
                createMockPlayer({ id: PLAYER_A_ID, speed: BASE_SPEED }),
                createMockPlayer({ id: PLAYER_B_ID, speed: BASE_SPEED }),
                createMockPlayer({ id: PLAYER_C_ID, speed: BASE_SPEED }),
            ];

            const results = new Set<string>();
            for (let i = 0; i < SHUFFLE_ITERATIONS; i++) {
                results.add(JSON.stringify(service.makeTurnOrder(players)));
            }

            expect(results.size).toBeGreaterThan(1);
        });

        it('should group players by speed and shuffle within groups', () => {
            const players = [
                createMockPlayer({ id: PLAYER_A_ID, speed: BASE_SPEED }),
                createMockPlayer({ id: PLAYER_B_ID, speed: SPEED_5 }),
                createMockPlayer({ id: PLAYER_C_ID, speed: SPEED_5 }),
            ];

            const result = service.makeTurnOrder(players);

            expect(result.length).toBe(PLAYER_COUNT);
            const speed5Index = result.indexOf(PLAYER_B_ID);
            const speed5Index2 = result.indexOf(PLAYER_C_ID);
            const speed3Index = result.indexOf(PLAYER_A_ID);
            expect(speed5Index).toBeGreaterThanOrEqual(0);
            expect(speed5Index2).toBeGreaterThanOrEqual(0);
            expect(speed3Index).toBeGreaterThanOrEqual(0);
            expect(Math.max(speed5Index, speed5Index2)).toBeLessThan(speed3Index);
            expect(result[speed5Index] === PLAYER_B_ID || result[speed5Index] === PLAYER_C_ID).toBe(true);
            expect(result[speed5Index2] === PLAYER_B_ID || result[speed5Index2] === PLAYER_C_ID).toBe(true);
        });

        it('should handle empty array', () => {
            const result = service.makeTurnOrder([]);
            expect(result).toEqual([]);
        });

        it('should handle single player', () => {
            const players = [createMockPlayer({ id: PLAYER_A_ID })];
            const result = service.makeTurnOrder(players);

            expect(result).toEqual([PLAYER_A_ID]);
        });

        it('should not modify original players array', () => {
            const players = [
                createMockPlayer({ id: PLAYER_A_ID }),
                createMockPlayer({ id: PLAYER_B_ID }),
            ];
            const original = [...players];

            service.makeTurnOrder(players);

            expect(players).toEqual(original);
        });
    });

    describe('assignStartPoints', () => {
        it('should assign start points to all players with coordinates', () => {
            const session = createMockSession();
            const game = createMockGame();

            service.assignStartPoints(session, game);

            expect(session.startPoints.length).toBe(PLAYER_COUNT);
            Object.values(session.inGamePlayers).forEach((player) => {
                expect(typeof player.x).toBe('number');
                expect(typeof player.y).toBe('number');
                expect(player.startPointId).toBeTruthy();
            });
        });

        it('should populate session.startPoints with correct structure', () => {
            const session = createMockSession();
            const game = createMockGame();

            service.assignStartPoints(session, game);

            session.startPoints.forEach((sp) => {
                expect(sp).toHaveProperty('id');
                expect(sp).toHaveProperty('playerId');
                expect(sp).toHaveProperty('x');
                expect(sp).toHaveProperty('y');
            });
        });

        it('should assign in turn order and match player coordinates', () => {
            const session = createMockSession();
            const game = createMockGame();

            service.assignStartPoints(session, game);

            expect(session.startPoints[0].playerId).toBe(PLAYER_A_ID);
            session.startPoints.forEach((sp) => {
                const player = session.inGamePlayers[sp.playerId];
                expect(player.x).toBe(sp.x);
                expect(player.y).toBe(sp.y);
                expect(player.startPointId).toBe(sp.id);
            });
        });

        it('should filter only START kind objects', () => {
            const session = createMockSession();
            const game = createMockGame();
            game.objects.push({
                _id: new Types.ObjectId(),
                kind: PlaceableKind.FLAG,
                x: COORDINATE_TEN,
                y: COORDINATE_TEN,
                placed: true,
                orientation: Orientation.N,
            });

            service.assignStartPoints(session, game);

            const nonStartPointUsed = session.startPoints.some((sp) => sp.x === COORDINATE_TEN);
            expect(nonStartPointUsed).toBe(false);
        });

        it('should shuffle start points before assignment', () => {
            const results = new Set<string>();

            for (let i = 0; i < SHUFFLE_ITERATIONS; i++) {
                const session = createMockSession();
                const game = createMockGame(START_POINT_COUNT_TEN);

                service.assignStartPoints(session, game);
                results.add(JSON.stringify(session.startPoints.map((sp) => sp.id)));
            }

            expect(results.size).toBeGreaterThan(1);
        });

        it('should handle more start points than players', () => {
            const session = createMockSession();
            const game = createMockGame(START_POINT_COUNT_FIVE);

            service.assignStartPoints(session, game);

            expect(session.startPoints.length).toBe(PLAYER_COUNT);
        });

        it('should assign unique start points', () => {
            const session = createMockSession();
            const game = createMockGame();

            service.assignStartPoints(session, game);

            const startPointIds = session.startPoints.map((sp) => sp.id);
            const uniqueIds = new Set(startPointIds);

            expect(uniqueIds.size).toBe(startPointIds.length);
        });

        it('should update player positions from initial zero', () => {
            const session = createMockSession();
            const game = createMockGame();

            expect(session.inGamePlayers[PLAYER_A_ID].x).toBe(INITIAL_X);

            service.assignStartPoints(session, game);

            const playerAStartPoint = session.startPoints.find((sp) => sp.playerId === PLAYER_A_ID);
            expect(session.inGamePlayers[PLAYER_A_ID].x).toBe(playerAStartPoint?.x);
        });

        it('should handle single player', () => {
            const session = createMockSession({
                inGamePlayers: {
                    [PLAYER_A_ID]: createMockPlayer({ id: PLAYER_A_ID }),
                },
                turnOrder: [PLAYER_A_ID],
            });
            const game = createMockGame(1);

            service.assignStartPoints(session, game);

            expect(session.startPoints.length).toBe(1);
            expect(session.startPoints[0].playerId).toBe(PLAYER_A_ID);
        });

        it('should preserve other player properties', () => {
            const session = createMockSession();
            const originalName = session.inGamePlayers[PLAYER_A_ID].name;
            const originalAvatar = session.inGamePlayers[PLAYER_A_ID].avatar;
            const game = createMockGame();

            service.assignStartPoints(session, game);

            expect(session.inGamePlayers[PLAYER_A_ID].name).toBe(originalName);
            expect(session.inGamePlayers[PLAYER_A_ID].avatar).toBe(originalAvatar);
        });

        it('should convert ObjectId to string', () => {
            const session = createMockSession();
            const game = createMockGame();

            service.assignStartPoints(session, game);

            Object.values(session.inGamePlayers).forEach((player) => {
                expect(typeof player.startPointId).toBe('string');
                expect(player.startPointId.length).toBeGreaterThan(0);
            });
        });

        it('should call setTileOccupant for each player', () => {
            const session = createMockSession();
            const game = createMockGame();

            service.assignStartPoints(session, game);

            expect(gameCache.setTileOccupant).toHaveBeenCalledTimes(PLAYER_COUNT);
            session.startPoints.forEach((sp) => {
                const player = session.inGamePlayers[sp.playerId];
                expect(gameCache.setTileOccupant).toHaveBeenCalledWith(SESSION_ID, sp.x, sp.y, player);
            });
        });

        it('should throw error when not enough start points', () => {
            const session = createMockSession();
            const game = createMockGame(PLAYER_STAT_TWO);

            expect(() => service.assignStartPoints(session, game)).toThrow();
            expect(() => service.assignStartPoints(session, game)).toThrow('Pas assez de points de départ');
        });
    });

    describe('integration', () => {
        it('should complete full initialization flow', () => {
            const session = createMockSession();
            const game = createMockGame();

            expect(session.startPoints.length).toBe(0);

            service.assignStartPoints(session, game);

            expect(session.startPoints.length).toBe(PLAYER_COUNT);
            Object.values(session.inGamePlayers).forEach((player) => {
                const matchingStartPoint = session.startPoints.find((sp) => sp.id === player.startPointId);
                expect(matchingStartPoint).toBeDefined();
                expect(player.x).toBe(matchingStartPoint?.x);
                expect(player.y).toBe(matchingStartPoint?.y);
            });
        });
    });
});
