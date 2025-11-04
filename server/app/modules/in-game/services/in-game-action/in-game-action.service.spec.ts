/* eslint-disable max-lines -- Test file with comprehensive coverage */
import { InGameActionService } from './in-game-action.service';
import { GameCacheService } from '@app/modules/in-game/services/game-cache/game-cache.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { NotFoundException } from '@nestjs/common';
import { Orientation } from '@common/enums/orientation.enum';
import { TileKind } from '@common/enums/tile.enum';
import { InGameSession } from '@common/interfaces/session.interface';
import { Avatar } from '@common/enums/avatar.enum';
import { Dice } from '@common/enums/dice.enum';
import { GameMode } from '@common/enums/game-mode.enum';
import { MapSize } from '@common/enums/map-size.enum';
import { Player } from '@common/interfaces/player.interface';
import { GameMap } from '@app/interfaces/game-map.interface';
import { Tile } from '@app/modules/game-store/entities/tile.entity';

describe('InGameActionService', () => {
    let service: InGameActionService;
    let gameCache: jest.Mocked<GameCacheService>;
    let eventEmitter: jest.Mocked<EventEmitter2>;

    const SESSION_ID = 'session-123';
    const PLAYER_A_ID = 'player-a';
    const PLAYER_B_ID = 'player-b';
    const POS_X_2 = 2;
    const POS_Y_3 = 3;
    const POS_X_1 = 1;
    const POS_Y_1 = 1;
    const POS_X_0 = 0;
    const POS_Y_0 = 0;
    const POS_X_3 = 3;
    const BASE_HEALTH = 100;
    const BASE_SPEED = 3;
    const BASE_ATTACK = 10;
    const BASE_DEFENSE = 5;
    const NO_BONUS = 0;
    const ACTIONS_REMAINING = 1;
    const NO_COMBAT_STATS = 0;
    const NO_ACTIONS = 0;
    const ORIENTATIONS_COUNT = 4;

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
        x: POS_X_1,
        y: POS_Y_1,
        isInGame: true,
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
        maxPlayers: ORIENTATIONS_COUNT,
        isGameStarted: false,
        inGamePlayers: {
            [PLAYER_A_ID]: createMockPlayer({ id: PLAYER_A_ID }),
            [PLAYER_B_ID]: createMockPlayer({ id: PLAYER_B_ID, x: POS_X_2, y: POS_Y_3 }),
        },
        currentTurn: { turnNumber: 1, activePlayerId: PLAYER_A_ID, hasUsedAction: false },
        startPoints: [],
        mapSize: MapSize.MEDIUM,
        mode: GameMode.CLASSIC,
        turnOrder: [PLAYER_A_ID, PLAYER_B_ID],
        isAdminModeActive: false,
        ...overrides,
    });

    beforeEach(() => {
        const mockGameCache = {
            getTileOccupant: jest.fn(),
            getGameMapForSession: jest.fn(),
            getNextPosition: jest.fn(),
            getTileAtPosition: jest.fn(),
        };

        const mockEventEmitter = {
            emit: jest.fn(),
        };

        gameCache = mockGameCache as unknown as jest.Mocked<GameCacheService>;
        eventEmitter = mockEventEmitter as unknown as jest.Mocked<EventEmitter2>;

        service = new InGameActionService(gameCache, eventEmitter);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('attackPlayer', () => {
        it('should throw NotFoundException when target player not found', () => {
            const session = createMockSession();
            gameCache.getTileOccupant.mockReturnValue(null);

            expect(() => service.attackPlayer(session, PLAYER_A_ID, POS_X_2, POS_Y_3)).toThrow(NotFoundException);
            expect(() => service.attackPlayer(session, PLAYER_A_ID, POS_X_2, POS_Y_3)).toThrow('Target player not found');
        });

        it('should throw NotFoundException when player not found in session', () => {
            const session = createMockSession();
            gameCache.getTileOccupant.mockReturnValue(PLAYER_B_ID);
            session.inGamePlayers = {};

            expect(() => service.attackPlayer(session, PLAYER_A_ID, POS_X_2, POS_Y_3)).toThrow(NotFoundException);
            expect(() => service.attackPlayer(session, PLAYER_A_ID, POS_X_2, POS_Y_3)).toThrow('Player not found');
        });

        it('should not throw when target and player are found', () => {
            const session = createMockSession();
            gameCache.getTileOccupant.mockReturnValue(PLAYER_B_ID);

            expect(() => service.attackPlayer(session, PLAYER_A_ID, POS_X_2, POS_Y_3)).not.toThrow();
            expect(gameCache.getTileOccupant).toHaveBeenCalledWith(SESSION_ID, POS_X_2, POS_Y_3);
        });
    });

    type TileWithPlayerId = Tile & { playerId: string | null };

    describe('toggleDoor', () => {
        it('should toggle door when tile is a door', () => {
            const session = createMockSession();
            const mockTile: TileWithPlayerId = {
                x: POS_X_2,
                y: POS_Y_3,
                kind: TileKind.DOOR,
                open: false,
                playerId: null,
            };
            const mockGameMap: GameMap = {
                tiles: [mockTile],
                objects: [],
                size: MapSize.MEDIUM,
            };
            gameCache.getGameMapForSession.mockReturnValue(mockGameMap);

            service.toggleDoor(session, PLAYER_A_ID, POS_X_2, POS_Y_3);

            expect(mockGameMap.tiles[0].open).toBe(true);
            expect(eventEmitter.emit).toHaveBeenCalledWith('door.toggled', {
                session,
                playerId: PLAYER_A_ID,
                x: POS_X_2,
                y: POS_Y_3,
                isOpen: true,
            });
        });

        it('should toggle door from open to closed', () => {
            const session = createMockSession();
            const mockTile: TileWithPlayerId = {
                x: POS_X_2,
                y: POS_Y_3,
                kind: TileKind.DOOR,
                open: true,
                playerId: null,
            };
            const mockGameMap: GameMap = {
                tiles: [mockTile],
                objects: [],
                size: MapSize.MEDIUM,
            };
            gameCache.getGameMapForSession.mockReturnValue(mockGameMap);

            service.toggleDoor(session, PLAYER_A_ID, POS_X_2, POS_Y_3);

            expect(mockGameMap.tiles[0].open).toBe(false);
            expect(eventEmitter.emit).toHaveBeenCalledWith('door.toggled', {
                session,
                playerId: PLAYER_A_ID,
                x: POS_X_2,
                y: POS_Y_3,
                isOpen: false,
            });
        });

        it('should not toggle when tile is not a door', () => {
            const session = createMockSession();
            const mockTile: TileWithPlayerId = {
                x: POS_X_2,
                y: POS_Y_3,
                kind: TileKind.BASE,
                playerId: null,
            };
            const mockGameMap: GameMap = {
                tiles: [mockTile],
                objects: [],
                size: MapSize.MEDIUM,
            };
            gameCache.getGameMapForSession.mockReturnValue(mockGameMap);

            service.toggleDoor(session, PLAYER_A_ID, POS_X_2, POS_Y_3);

            expect(eventEmitter.emit).not.toHaveBeenCalled();
        });

        it('should not toggle when tile not found', () => {
            const session = createMockSession();
            const mockGameMap: GameMap = {
                tiles: [],
                objects: [],
                size: MapSize.MEDIUM,
            };
            gameCache.getGameMapForSession.mockReturnValue(mockGameMap);

            service.toggleDoor(session, PLAYER_A_ID, POS_X_2, POS_Y_3);

            expect(eventEmitter.emit).not.toHaveBeenCalled();
        });
    });

    describe('calculateAvailableActions', () => {
        it('should return empty array when player not found', () => {
            const session = createMockSession();
            session.inGamePlayers = {};

            const result = service.calculateAvailableActions(session, PLAYER_A_ID);

            expect(result).toEqual([]);
        });

        it('should return empty array when player has no actions remaining', () => {
            const session = createMockSession();
            session.inGamePlayers[PLAYER_A_ID].actionsRemaining = NO_ACTIONS;

            const result = service.calculateAvailableActions(session, PLAYER_A_ID);

            expect(result).toEqual([]);
        });

        it('should return attack action when enemy player is adjacent', () => {
            const session = createMockSession();
            const mockTile: TileWithPlayerId = {
                x: POS_X_2,
                y: POS_Y_3,
                kind: TileKind.BASE,
                playerId: PLAYER_B_ID,
            };
            gameCache.getNextPosition.mockReturnValue({ x: POS_X_2, y: POS_Y_3 });
            gameCache.getTileOccupant.mockReturnValue(PLAYER_B_ID);
            gameCache.getTileAtPosition.mockReturnValue(mockTile);

            const result = service.calculateAvailableActions(session, PLAYER_A_ID);

            expect(result).toContainEqual({ type: 'ATTACK', x: POS_X_2, y: POS_Y_3 });
            expect(eventEmitter.emit).toHaveBeenCalledWith('player.availableActions', {
                session,
                playerId: PLAYER_A_ID,
                actions: result,
            });
        });

        it('should not return attack action when same player is on tile', () => {
            const session = createMockSession();
            const mockTile: TileWithPlayerId = {
                x: POS_X_2,
                y: POS_Y_3,
                kind: TileKind.BASE,
                playerId: PLAYER_A_ID,
            };
            gameCache.getNextPosition.mockReturnValue({ x: POS_X_2, y: POS_Y_3 });
            gameCache.getTileOccupant.mockReturnValue(PLAYER_A_ID);
            gameCache.getTileAtPosition.mockReturnValue(mockTile);

            const result = service.calculateAvailableActions(session, PLAYER_A_ID);

            expect(result).not.toContainEqual({ type: 'ATTACK', x: POS_X_2, y: POS_Y_3 });
        });

        it('should return door action when door tile is adjacent', () => {
            const session = createMockSession();
            const mockTile: TileWithPlayerId = {
                x: POS_X_2,
                y: POS_Y_3,
                kind: TileKind.DOOR,
                open: false,
                playerId: null,
            };
            gameCache.getNextPosition.mockReturnValue({ x: POS_X_2, y: POS_Y_3 });
            gameCache.getTileOccupant.mockReturnValue(null);
            gameCache.getTileAtPosition.mockReturnValue(mockTile);

            const result = service.calculateAvailableActions(session, PLAYER_A_ID);

            expect(result).toContainEqual({ type: 'DOOR', x: POS_X_2, y: POS_Y_3 });
        });

        it('should return both attack and door actions when applicable', () => {
            const session = createMockSession();
            const mockTile1: TileWithPlayerId = {
                x: POS_X_2,
                y: POS_Y_3,
                kind: TileKind.BASE,
                playerId: PLAYER_B_ID,
            };
            const mockTile2: TileWithPlayerId = {
                x: POS_X_1,
                y: POS_Y_1,
                kind: TileKind.DOOR,
                open: false,
                playerId: null,
            };
            const mockTile3: TileWithPlayerId = {
                x: POS_X_0,
                y: POS_Y_0,
                kind: TileKind.BASE,
                playerId: null,
            };
            const mockTile4: TileWithPlayerId = {
                x: POS_X_3,
                y: POS_Y_3,
                kind: TileKind.BASE,
                playerId: null,
            };
            gameCache.getNextPosition
                .mockReturnValueOnce({ x: POS_X_2, y: POS_Y_3 })
                .mockReturnValueOnce({ x: POS_X_1, y: POS_Y_1 })
                .mockReturnValueOnce({ x: POS_X_0, y: POS_Y_0 })
                .mockReturnValueOnce({ x: POS_X_3, y: POS_Y_3 });
            gameCache.getTileOccupant
                .mockReturnValueOnce(PLAYER_B_ID)
                .mockReturnValueOnce(null)
                .mockReturnValueOnce(null)
                .mockReturnValueOnce(null);
            gameCache.getTileAtPosition
                .mockReturnValueOnce(mockTile1)
                .mockReturnValueOnce(mockTile2)
                .mockReturnValueOnce(mockTile3)
                .mockReturnValueOnce(mockTile4);

            const result = service.calculateAvailableActions(session, PLAYER_A_ID);

            expect(result).toContainEqual({ type: 'ATTACK', x: POS_X_2, y: POS_Y_3 });
            expect(result).toContainEqual({ type: 'DOOR', x: POS_X_1, y: POS_Y_1 });
        });

        it('should skip positions that throw errors', () => {
            const session = createMockSession();
            const mockTile1: TileWithPlayerId = {
                x: POS_X_2,
                y: POS_Y_3,
                kind: TileKind.BASE,
                playerId: PLAYER_B_ID,
            };
            const mockTile2: TileWithPlayerId = {
                x: POS_X_0,
                y: POS_Y_0,
                kind: TileKind.BASE,
                playerId: null,
            };
            const mockTile3: TileWithPlayerId = {
                x: POS_X_3,
                y: POS_Y_3,
                kind: TileKind.BASE,
                playerId: null,
            };
            gameCache.getNextPosition
                .mockReturnValueOnce({ x: POS_X_2, y: POS_Y_3 })
                .mockImplementationOnce(() => {
                    throw new Error('Invalid position');
                })
                .mockReturnValueOnce({ x: POS_X_0, y: POS_Y_0 })
                .mockReturnValueOnce({ x: POS_X_3, y: POS_Y_3 });
            gameCache.getTileOccupant
                .mockReturnValueOnce(PLAYER_B_ID)
                .mockReturnValueOnce(null)
                .mockReturnValueOnce(null);
            gameCache.getTileAtPosition
                .mockReturnValueOnce(mockTile1)
                .mockReturnValueOnce(mockTile2)
                .mockReturnValueOnce(mockTile3);

            const result = service.calculateAvailableActions(session, PLAYER_A_ID);

            expect(result).toContainEqual({ type: 'ATTACK', x: POS_X_2, y: POS_Y_3 });
            expect(result.length).toBeGreaterThanOrEqual(1);
        });

        it('should check all four orientations', () => {
            const session = createMockSession();
            const mockTile: TileWithPlayerId = {
                x: POS_X_2,
                y: POS_Y_3,
                kind: TileKind.BASE,
                playerId: null,
            };
            gameCache.getNextPosition
                .mockReturnValue({ x: POS_X_2, y: POS_Y_3 });
            gameCache.getTileOccupant.mockReturnValue(null);
            gameCache.getTileAtPosition.mockReturnValue(mockTile);

            service.calculateAvailableActions(session, PLAYER_A_ID);

            expect(gameCache.getNextPosition).toHaveBeenCalledTimes(ORIENTATIONS_COUNT);
            expect(gameCache.getNextPosition).toHaveBeenCalledWith(SESSION_ID, POS_X_1, POS_Y_1, Orientation.N);
            expect(gameCache.getNextPosition).toHaveBeenCalledWith(SESSION_ID, POS_X_1, POS_Y_1, Orientation.E);
            expect(gameCache.getNextPosition).toHaveBeenCalledWith(SESSION_ID, POS_X_1, POS_Y_1, Orientation.S);
            expect(gameCache.getNextPosition).toHaveBeenCalledWith(SESSION_ID, POS_X_1, POS_Y_1, Orientation.W);
        });

        it('should emit player.availableActions event', () => {
            const session = createMockSession();
            const mockTile: TileWithPlayerId = {
                x: POS_X_2,
                y: POS_Y_3,
                kind: TileKind.BASE,
                playerId: null,
            };
            gameCache.getNextPosition.mockReturnValue({ x: POS_X_2, y: POS_Y_3 });
            gameCache.getTileOccupant.mockReturnValue(null);
            gameCache.getTileAtPosition.mockReturnValue(mockTile);

            const result = service.calculateAvailableActions(session, PLAYER_A_ID);

            expect(eventEmitter.emit).toHaveBeenCalledWith('player.availableActions', {
                session,
                playerId: PLAYER_A_ID,
                actions: result,
            });
        });
    });
});

