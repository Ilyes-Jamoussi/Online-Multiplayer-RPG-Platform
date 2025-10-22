import { Test, TestingModule } from '@nestjs/testing';
import { InGameInitializationService } from './in-game-initialization.service';
import { InGameSession } from '@common/models/session.interface';
import { Game } from '@app/modules/game-store/entities/game.entity';
import { PlaceableKind } from '@common/enums/placeable-kind.enum';
import { MapSize } from '@common/enums/map-size.enum';
import { GameMode } from '@common/enums/game-mode.enum';
import { Avatar } from '@common/enums/avatar.enum';
import { Orientation } from '@common/enums/orientation.enum';
import { Types } from 'mongoose';
import { Dice } from '@common/enums/dice.enum';

describe('InGameInitializationService', () => {
    let service: InGameInitializationService;

    const BASE_SPEED = 5;
    const BASE_HEALTH = 100;
    const LARGE_ARRAY_SIZE = 1000;
    const SHUFFLE_ITERATIONS = 10;
    const PLAYER_COUNT = 3;
    const ARRAY_SIZE_FIVE = 5;
    const ARRAY_SIZE_TEN = 10;
    const SINGLE_ELEMENT = 42;
    const COORDINATE_TEN = 10;
    const START_POINT_COUNT_FIVE = 5;
    const START_POINT_COUNT_TEN = 10;
    const PLAYER_STAT_TWO = 2;

    const createMockSession = (overrides: Partial<InGameSession> = {}): InGameSession => ({
        id: 'session-123',
        inGameId: 'session-123-game-456',
        gameId: 'game-456',
        maxPlayers: 4,
        isGameStarted: false,
        inGamePlayers: {
            player1: {
                id: 'player1',
                name: 'Alice',
                x: 0,
                y: 0,
                startPointId: '',
                isInGame: false,
                avatar: Avatar.Avatar1,
                isAdmin: false,
                speed: BASE_SPEED,
                health: BASE_HEALTH,
                attack: Dice.D6,
                defense: Dice.D6,
                movementPoints: 0,
            },
            player2: {
                id: 'player2',
                name: 'Bob',
                x: 0,
                y: 0,
                startPointId: '',
                isInGame: false,
                avatar: Avatar.Avatar2,
                isAdmin: false,
                speed: BASE_SPEED,
                health: BASE_HEALTH,
                attack: Dice.D6,
                defense: Dice.D6,
                movementPoints: 0,
            },
            player3: {
                id: 'player3',
                name: 'Charlie',
                x: 0,
                y: 0,
                startPointId: '',
                isInGame: false,
                avatar: Avatar.Avatar3,
                isAdmin: false,
                speed: BASE_SPEED,
                health: BASE_HEALTH,
                attack: Dice.D6,
                defense: Dice.D6,
                movementPoints: 0,
            },
        },
        currentTurn: { turnNumber: 1, activePlayerId: 'player1' },
        startPoints: [],
        mapSize: MapSize.MEDIUM,
        mode: GameMode.CLASSIC,
        turnOrderPlayerId: ['player1', 'player2', 'player3'],
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

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [InGameInitializationService],
        }).compile();

        service = module.get<InGameInitializationService>(InGameInitializationService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('shuffleArray', () => {
        it('should return array with same length and elements', () => {
            const input = [1, 2, PLAYER_COUNT, PLAYER_COUNT + 1, ARRAY_SIZE_FIVE];
            const result = service.shuffleArray(input);

            expect(result.length).toBe(input.length);
            expect(result.sort()).toEqual(input.sort());
        });

        it('should not modify the original array', () => {
            const input = [1, 2, PLAYER_COUNT];
            const original = [...input];

            service.shuffleArray(input);

            expect(input).toEqual(original);
        });

        it('should handle empty and single element arrays', () => {
            expect(service.shuffleArray([])).toEqual([]);
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

            expect(session.startPoints[0].playerId).toBe('player1');
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

            expect(session.inGamePlayers.player1.x).toBe(0);

            service.assignStartPoints(session, game);

            const player1StartPoint = session.startPoints.find((sp) => sp.playerId === 'player1');
            expect(session.inGamePlayers.player1.x).toBe(player1StartPoint?.x);
        });

        it('should handle single player', () => {
            const session = createMockSession({
                inGamePlayers: {
                    player1: {
                        id: 'player1',
                        name: 'Solo',
                        x: 0,
                        y: 0,
                        startPointId: '',
                        isInGame: false,
                        avatar: Avatar.Avatar1,
                        isAdmin: true,
                        speed: BASE_SPEED,
                        health: BASE_HEALTH,
                        attack: Dice.D6,
                        defense: Dice.D6,
                        movementPoints: 0,
                    },
                },
                turnOrderPlayerId: ['player1'],
            });
            const game = createMockGame(1);

            service.assignStartPoints(session, game);

            expect(session.startPoints.length).toBe(1);
            expect(session.startPoints[0].playerId).toBe('player1');
        });

        it('should preserve other player properties', () => {
            const session = createMockSession();
            const originalName = session.inGamePlayers.player1.name;
            const originalAvatar = session.inGamePlayers.player1.avatar;
            const game = createMockGame();

            service.assignStartPoints(session, game);

            expect(session.inGamePlayers.player1.name).toBe(originalName);
            expect(session.inGamePlayers.player1.avatar).toBe(originalAvatar);
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
