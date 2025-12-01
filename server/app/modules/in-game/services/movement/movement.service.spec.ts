/* eslint-disable max-lines -- Test file with comprehensive test coverage */
import { ServerEvents } from '@app/enums/server-events.enum';
import { Placeable } from '@app/modules/game-store/entities/placeable.entity';
import { Tile } from '@app/modules/game-store/entities/tile.entity';
import { GameCacheService } from '@app/modules/in-game/services/game-cache/game-cache.service';
import { InGameSessionRepository } from '@app/modules/in-game/services/in-game-session/in-game-session.repository';
import { GameMode } from '@common/enums/game-mode.enum';
import { MapSize } from '@common/enums/map-size.enum';
import { Orientation } from '@common/enums/orientation.enum';
import { PlaceableKind } from '@common/enums/placeable-kind.enum';
import { TileKind } from '@common/enums/tile.enum';
import { Player } from '@common/interfaces/player.interface';
import { Position } from '@common/interfaces/position.interface';
import { InGameSession } from '@common/interfaces/session.interface';
import { StartPoint } from '@common/interfaces/start-point.interface';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Test, TestingModule } from '@nestjs/testing';
import { Types } from 'mongoose';
import { MovementService } from './movement.service';

describe('MovementService', () => {
    let service: MovementService;
    let gameCache: jest.Mocked<GameCacheService>;
    let sessionRepository: jest.Mocked<InGameSessionRepository>;
    let eventEmitter: jest.Mocked<EventEmitter2>;

    const SESSION_ID = 'session-123';
    const PLAYER_ID = 'player-123';
    const START_POINT_ID = 'start-point-123';
    const POSITION_X = 5;
    const POSITION_Y = 10;
    const NEXT_X = 6;
    const NEXT_Y = 10;
    const DESTINATION_X = 7;
    const DESTINATION_Y = 7;
    const SPEED = 3;
    const BOAT_SPEED = 2;
    const MAX_HEALTH = 100;
    const HEALTH = 80;
    const MAP_SIZE = 15;
    const ZERO = 0;
    const ONE = 1;

    const createMockPosition = (overrides: Partial<Position> = {}): Position => ({
        x: POSITION_X,
        y: POSITION_Y,
        ...overrides,
    });

    const createMockTile = (overrides: Partial<Tile> = {}): Tile & { playerId: string | null } => ({
        x: POSITION_X,
        y: POSITION_Y,
        kind: TileKind.BASE,
        open: false,
        playerId: null,
        ...overrides,
    });

    const createMockPlaceable = (overrides: Partial<Placeable> = {}): Placeable => {
        const mockObjectId = new Types.ObjectId();
        Object.defineProperty(mockObjectId, 'toString', {
            value: jest.fn().mockReturnValue('placeable-id'),
            writable: true,
        });
        return {
            _id: mockObjectId,
            kind: PlaceableKind.FLAG,
            x: POSITION_X,
            y: POSITION_Y,
            placed: true,
            ...overrides,
        };
    };

    const createMockPlayer = (overrides: Partial<Player> = {}): Player => ({
        id: PLAYER_ID,
        name: 'Test Player',
        avatar: null,
        isAdmin: false,
        baseHealth: MAX_HEALTH,
        healthBonus: ZERO,
        health: HEALTH,
        maxHealth: MAX_HEALTH,
        baseSpeed: SPEED,
        speedBonus: ZERO,
        speed: SPEED,
        boatSpeedBonus: ZERO,
        boatSpeed: ZERO,
        baseAttack: 10,
        attackBonus: ZERO,
        baseDefense: 5,
        defenseBonus: ZERO,
        attackDice: null,
        defenseDice: null,
        x: POSITION_X,
        y: POSITION_Y,
        isInGame: true,
        startPointId: START_POINT_ID,
        actionsRemaining: ONE,
        combatCount: ZERO,
        combatWins: ZERO,
        combatLosses: ZERO,
        combatDraws: ZERO,
        hasCombatBonus: false,
        ...overrides,
    });

    const createMockStartPoint = (overrides: Partial<StartPoint> = {}): StartPoint => ({
        id: START_POINT_ID,
        playerId: PLAYER_ID,
        x: POSITION_X,
        y: POSITION_Y,
        ...overrides,
    });

    const FOUR = 4;

    const createMockSession = (overrides: Partial<InGameSession> = {}): InGameSession => ({
        id: SESSION_ID,
        inGameId: 'in-game-123',
        gameId: 'game-123',
        chatId: 'chat-123',
        maxPlayers: FOUR,
        mode: GameMode.CLASSIC,
        isGameStarted: true,
        inGamePlayers: {
            [PLAYER_ID]: createMockPlayer(),
        },
        teams: {},
        currentTurn: { turnNumber: ONE, activePlayerId: PLAYER_ID, hasUsedAction: false },
        startPoints: [createMockStartPoint()],
        mapSize: MapSize.MEDIUM,
        turnOrder: [PLAYER_ID],
        playerCount: ONE,
        ...overrides,
    });

    beforeEach(async () => {
        const mockGameCache = {
            getNextPosition: jest.fn(),
            getTileAtPosition: jest.fn(),
            getPlaceableAtPosition: jest.fn(),
            getTeleportDestination: jest.fn(),
            getTileOccupant: jest.fn(),
            updatePlaceablePosition: jest.fn(),
            getMapSize: jest.fn(),
            isTileFree: jest.fn(),
        };

        const mockSessionRepository = {
            movePlayerPosition: jest.fn(),
            playerHasFlag: jest.fn(),
            updateFlagPosition: jest.fn(),
            pickUpFlag: jest.fn(),
            findStartPointById: jest.fn(),
            resetPlayerBoatSpeedBonus: jest.fn(),
        };

        const mockEventEmitter = {
            emit: jest.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                MovementService,
                {
                    provide: GameCacheService,
                    useValue: mockGameCache,
                },
                {
                    provide: InGameSessionRepository,
                    useValue: mockSessionRepository,
                },
                {
                    provide: EventEmitter2,
                    useValue: mockEventEmitter,
                },
            ],
        }).compile();

        service = module.get<MovementService>(MovementService);
        gameCache = module.get(GameCacheService);
        sessionRepository = module.get(InGameSessionRepository);
        eventEmitter = module.get(EventEmitter2);
    });

    describe('movePlayer', () => {
        it('should move player successfully', () => {
            const session = createMockSession();
            const nextPosition = createMockPosition({ x: NEXT_X });
            const tile = createMockTile({ x: NEXT_X });
            gameCache.getNextPosition.mockReturnValue(nextPosition);
            gameCache.getTileAtPosition.mockReturnValue(tile);
            gameCache.getPlaceableAtPosition.mockReturnValue(null);
            gameCache.getTileOccupant.mockReturnValue(null);
            sessionRepository.movePlayerPosition.mockReturnValue({ oldX: POSITION_X, oldY: POSITION_Y, newX: NEXT_X, newY: POSITION_Y });
            sessionRepository.playerHasFlag.mockReturnValue(false);
            gameCache.getMapSize.mockReturnValue(MAP_SIZE);
            sessionRepository.movePlayerPosition.mockImplementation(() => {
                session.inGamePlayers[PLAYER_ID].speed = SPEED - ONE;
                return { oldX: POSITION_X, oldY: POSITION_Y, newX: NEXT_X, newY: POSITION_Y };
            });

            const result = service.movePlayer(session, PLAYER_ID, Orientation.E);

            expect(result).toBe(SPEED - ONE);
            expect(sessionRepository.movePlayerPosition).toHaveBeenCalledWith(SESSION_ID, PLAYER_ID, NEXT_X, POSITION_Y, ONE);
            expect(eventEmitter.emit).toHaveBeenCalledWith(ServerEvents.PlayerReachableTiles, expect.objectContaining({ playerId: PLAYER_ID }));
        });

        it('should throw NotFoundException when player not found', () => {
            const session = createMockSession({
                inGamePlayers: {},
            });

            expect(() => service.movePlayer(session, PLAYER_ID, Orientation.E)).toThrow(NotFoundException);
        });

        it('should throw NotFoundException when tile not found', () => {
            const session = createMockSession();
            const nextPosition = createMockPosition({ x: NEXT_X });
            gameCache.getNextPosition.mockReturnValue(nextPosition);
            gameCache.getTileAtPosition.mockReturnValue(null);

            expect(() => service.movePlayer(session, PLAYER_ID, Orientation.E)).toThrow(NotFoundException);
        });

        it('should throw BadRequestException when placeable is not reachable', () => {
            const session = createMockSession();
            const nextPosition = createMockPosition({ x: NEXT_X });
            const tile = createMockTile({ x: NEXT_X });
            const placeable = createMockPlaceable({ kind: PlaceableKind.HEAL });
            gameCache.getNextPosition.mockReturnValue(nextPosition);
            gameCache.getTileAtPosition.mockReturnValue(tile);
            gameCache.getPlaceableAtPosition.mockReturnValue(placeable);

            expect(() => service.movePlayer(session, PLAYER_ID, Orientation.E)).toThrow(BadRequestException);
        });

        it('should throw BadRequestException when on boat and trying to use teleporter', () => {
            const session = createMockSession({
                inGamePlayers: {
                    [PLAYER_ID]: createMockPlayer({ onBoatId: 'boat-123' }),
                },
            });
            const nextPosition = createMockPosition({ x: NEXT_X });
            const tile = createMockTile({ x: NEXT_X, kind: TileKind.TELEPORT });
            gameCache.getNextPosition.mockReturnValue(nextPosition);
            gameCache.getTileAtPosition.mockReturnValue(tile);
            gameCache.getPlaceableAtPosition.mockReturnValue(null);

            expect(() => service.movePlayer(session, PLAYER_ID, Orientation.E)).toThrow(BadRequestException);
        });

        it('should throw BadRequestException when move cost is null', () => {
            const session = createMockSession();
            const nextPosition = createMockPosition({ x: NEXT_X });
            const tile = createMockTile({ x: NEXT_X, kind: TileKind.WALL });
            gameCache.getNextPosition.mockReturnValue(nextPosition);
            gameCache.getTileAtPosition.mockReturnValue(tile);
            gameCache.getPlaceableAtPosition.mockReturnValue(null);

            expect(() => service.movePlayer(session, PLAYER_ID, Orientation.E)).toThrow(BadRequestException);
        });

        it('should throw BadRequestException when not enough movement points', () => {
            const session = createMockSession({
                inGamePlayers: {
                    [PLAYER_ID]: createMockPlayer({ speed: ONE, boatSpeed: ZERO }),
                },
            });
            const nextPosition = createMockPosition({ x: NEXT_X });
            const tile = createMockTile({ x: NEXT_X, kind: TileKind.WATER });
            gameCache.getNextPosition.mockReturnValue(nextPosition);
            gameCache.getTileAtPosition.mockReturnValue(tile);
            gameCache.getPlaceableAtPosition.mockReturnValue(null);

            expect(() => service.movePlayer(session, PLAYER_ID, Orientation.E)).toThrow(BadRequestException);
        });

        it('should handle teleportation when destination is free', () => {
            const session = createMockSession();
            const nextPosition = createMockPosition({ x: NEXT_X });
            const destination = createMockPosition({ x: DESTINATION_X, y: DESTINATION_Y });
            const tile = createMockTile({ x: NEXT_X, kind: TileKind.TELEPORT });
            gameCache.getNextPosition.mockReturnValue(nextPosition);
            gameCache.getTileAtPosition.mockReturnValue(tile);
            gameCache.getPlaceableAtPosition.mockReturnValue(null);
            gameCache.getTeleportDestination.mockReturnValue(destination);
            gameCache.getTileOccupant.mockReturnValue(null);
            sessionRepository.movePlayerPosition.mockReturnValue({ oldX: POSITION_X, oldY: POSITION_Y, newX: DESTINATION_X, newY: DESTINATION_Y });
            sessionRepository.playerHasFlag.mockReturnValue(false);
            gameCache.getMapSize.mockReturnValue(MAP_SIZE);

            service.movePlayer(session, PLAYER_ID, Orientation.E);

            expect(sessionRepository.movePlayerPosition).toHaveBeenCalledWith(SESSION_ID, PLAYER_ID, DESTINATION_X, DESTINATION_Y, ZERO);
            expect(eventEmitter.emit).toHaveBeenCalledWith(ServerEvents.Teleported, {
                session,
                playerId: PLAYER_ID,
                originX: POSITION_X,
                originY: POSITION_Y,
                destinationX: DESTINATION_X,
                destinationY: DESTINATION_Y,
            });
        });

        it('should not teleport when destination is occupied', () => {
            const session = createMockSession();
            const nextPosition = createMockPosition({ x: NEXT_X });
            const destination = createMockPosition({ x: DESTINATION_X, y: DESTINATION_Y });
            const tile = createMockTile({ x: NEXT_X, kind: TileKind.TELEPORT });
            gameCache.getNextPosition.mockReturnValue(nextPosition);
            gameCache.getTileAtPosition.mockReturnValue(tile);
            gameCache.getPlaceableAtPosition.mockReturnValue(null);
            gameCache.getTeleportDestination.mockReturnValue(destination);
            gameCache.getTileOccupant.mockImplementation((sessionId: string, position: Position) => {
                if (position.x === destination.x && position.y === destination.y) {
                    return 'other-player';
                }
                return null;
            });
            sessionRepository.movePlayerPosition.mockReturnValue({ oldX: POSITION_X, oldY: POSITION_Y, newX: NEXT_X, newY: POSITION_Y });
            sessionRepository.playerHasFlag.mockReturnValue(false);
            gameCache.getMapSize.mockReturnValue(MAP_SIZE);

            service.movePlayer(session, PLAYER_ID, Orientation.E);

            expect(sessionRepository.movePlayerPosition).toHaveBeenCalledWith(SESSION_ID, PLAYER_ID, NEXT_X, POSITION_Y, ZERO);
            expect(eventEmitter.emit).not.toHaveBeenCalledWith(ServerEvents.Teleported, expect.anything());
        });

        it('should throw BadRequestException when final position is occupied', () => {
            const session = createMockSession();
            const nextPosition = createMockPosition({ x: NEXT_X });
            const tile = createMockTile({ x: NEXT_X });
            gameCache.getNextPosition.mockReturnValue(nextPosition);
            gameCache.getTileAtPosition.mockReturnValue(tile);
            gameCache.getPlaceableAtPosition.mockReturnValue(null);
            gameCache.getTileOccupant.mockReturnValue('other-player');

            expect(() => service.movePlayer(session, PLAYER_ID, Orientation.E)).toThrow(BadRequestException);
        });

        it('should update placeable position when player is on boat', () => {
            const session = createMockSession({
                inGamePlayers: {
                    [PLAYER_ID]: createMockPlayer({ onBoatId: 'boat-123', boatSpeed: BOAT_SPEED }),
                },
            });
            const nextPosition = createMockPosition({ x: NEXT_X });
            const tile = createMockTile({ x: NEXT_X, kind: TileKind.WATER });
            gameCache.getNextPosition.mockReturnValue(nextPosition);
            gameCache.getTileAtPosition.mockReturnValue(tile);
            gameCache.getPlaceableAtPosition.mockReturnValue(null);
            gameCache.getTileOccupant.mockReturnValue(null);
            sessionRepository.movePlayerPosition.mockReturnValue({ oldX: POSITION_X, oldY: POSITION_Y, newX: NEXT_X, newY: POSITION_Y });
            sessionRepository.playerHasFlag.mockReturnValue(false);
            gameCache.getMapSize.mockReturnValue(MAP_SIZE);

            service.movePlayer(session, PLAYER_ID, Orientation.E);

            expect(gameCache.updatePlaceablePosition).toHaveBeenCalledWith(
                SESSION_ID,
                { x: POSITION_X, y: POSITION_Y },
                { x: NEXT_X, y: POSITION_Y },
            );
        });

        it('should handle CTF mode when player has flag', () => {
            const session = createMockSession({
                mode: GameMode.CTF,
            });
            const nextPosition = createMockPosition({ x: NEXT_X });
            const tile = createMockTile({ x: NEXT_X });
            gameCache.getNextPosition.mockReturnValue(nextPosition);
            gameCache.getTileAtPosition.mockReturnValue(tile);
            gameCache.getPlaceableAtPosition.mockReturnValue(null);
            gameCache.getTileOccupant.mockReturnValue(null);
            sessionRepository.movePlayerPosition.mockReturnValue({ oldX: POSITION_X, oldY: POSITION_Y, newX: NEXT_X, newY: POSITION_Y });
            sessionRepository.playerHasFlag.mockReturnValue(true);
            sessionRepository.findStartPointById.mockReturnValue(createMockStartPoint());
            gameCache.getMapSize.mockReturnValue(MAP_SIZE);

            service.movePlayer(session, PLAYER_ID, Orientation.E);

            expect(sessionRepository.updateFlagPosition).toHaveBeenCalledWith(session, PLAYER_ID, { x: NEXT_X, y: POSITION_Y });
        });

        it('should try to pick up flag in CTF mode', () => {
            const session = createMockSession({
                mode: GameMode.CTF,
            });
            const nextPosition = createMockPosition({ x: NEXT_X });
            const tile = createMockTile({ x: NEXT_X });
            const placeable = createMockPlaceable({ kind: PlaceableKind.FLAG, x: NEXT_X, y: POSITION_Y });
            gameCache.getNextPosition.mockReturnValue(nextPosition);
            gameCache.getTileAtPosition.mockReturnValue(tile);
            gameCache.getPlaceableAtPosition.mockImplementation((sessionId: string, position: Position) => {
                if (position.x === NEXT_X && position.y === POSITION_Y) {
                    return placeable;
                }
                return null;
            });
            gameCache.getTileOccupant.mockReturnValue(null);
            sessionRepository.movePlayerPosition.mockReturnValue({ oldX: POSITION_X, oldY: POSITION_Y, newX: NEXT_X, newY: POSITION_Y });
            sessionRepository.playerHasFlag.mockReturnValue(false);
            gameCache.getMapSize.mockReturnValue(MAP_SIZE);

            service.movePlayer(session, PLAYER_ID, Orientation.E);

            expect(sessionRepository.pickUpFlag).toHaveBeenCalledWith(session, PLAYER_ID, { x: NEXT_X, y: POSITION_Y });
        });
    });

    describe('checkCTFVictory', () => {
        it('should emit GameOver when player returns flag to start point', () => {
            const session = createMockSession({
                mode: GameMode.CTF,
            });
            const position = createMockPosition();
            sessionRepository.playerHasFlag.mockReturnValue(true);
            sessionRepository.findStartPointById.mockReturnValue(createMockStartPoint());

            service.checkCTFVictory(session, PLAYER_ID, position);

            expect(eventEmitter.emit).toHaveBeenCalledWith(ServerEvents.GameOver, {
                sessionId: SESSION_ID,
                winnerId: PLAYER_ID,
                winnerName: 'Test Player',
            });
        });

        it('should not emit GameOver when player does not have flag', () => {
            const session = createMockSession({
                mode: GameMode.CTF,
            });
            const position = createMockPosition();
            sessionRepository.playerHasFlag.mockReturnValue(false);
            sessionRepository.findStartPointById.mockReturnValue(createMockStartPoint());

            service.checkCTFVictory(session, PLAYER_ID, position);

            expect(eventEmitter.emit).not.toHaveBeenCalledWith(ServerEvents.GameOver, expect.anything());
        });

        it('should not emit GameOver when position does not match start point', () => {
            const session = createMockSession({
                mode: GameMode.CTF,
            });
            const position = createMockPosition({ x: NEXT_X });
            sessionRepository.playerHasFlag.mockReturnValue(true);
            sessionRepository.findStartPointById.mockReturnValue(createMockStartPoint());

            service.checkCTFVictory(session, PLAYER_ID, position);

            expect(eventEmitter.emit).not.toHaveBeenCalledWith(ServerEvents.GameOver, expect.anything());
        });

        it('should return early when player not found', () => {
            const session = createMockSession({
                inGamePlayers: {},
            });
            const position = createMockPosition();

            service.checkCTFVictory(session, PLAYER_ID, position);

            expect(eventEmitter.emit).not.toHaveBeenCalledWith(ServerEvents.GameOver, expect.anything());
        });

        it('should return early when start point not found', () => {
            const session = createMockSession({
                mode: GameMode.CTF,
            });
            const position = createMockPosition();
            sessionRepository.playerHasFlag.mockReturnValue(true);
            sessionRepository.findStartPointById.mockReturnValue(undefined);

            service.checkCTFVictory(session, PLAYER_ID, position);

            expect(eventEmitter.emit).not.toHaveBeenCalledWith(ServerEvents.GameOver, expect.anything());
        });
    });

    describe('movePlayerToStartPosition', () => {
        it('should move player to start position when not already there', () => {
            const session = createMockSession({
                inGamePlayers: {
                    [PLAYER_ID]: createMockPlayer({ x: NEXT_X, y: NEXT_Y }),
                },
            });
            const startPoint = createMockStartPoint();
            sessionRepository.findStartPointById.mockReturnValue(startPoint);
            gameCache.isTileFree.mockReturnValue(true);
            sessionRepository.movePlayerPosition.mockReturnValue({ oldX: NEXT_X, oldY: NEXT_Y, newX: POSITION_X, newY: POSITION_Y });
            gameCache.getMapSize.mockReturnValue(MAP_SIZE);

            service.movePlayerToStartPosition(session, PLAYER_ID);

            expect(session.inGamePlayers[PLAYER_ID].health).toBe(MAX_HEALTH);
            expect(sessionRepository.movePlayerPosition).toHaveBeenCalledWith(SESSION_ID, PLAYER_ID, POSITION_X, POSITION_Y, ZERO);
            expect(eventEmitter.emit).toHaveBeenCalledWith(ServerEvents.PlayerReachableTiles, expect.objectContaining({ playerId: PLAYER_ID }));
        });

        it('should not move player when already at start position', () => {
            const session = createMockSession();
            const startPoint = createMockStartPoint();
            sessionRepository.findStartPointById.mockReturnValue(startPoint);
            gameCache.getMapSize.mockReturnValue(MAP_SIZE);

            service.movePlayerToStartPosition(session, PLAYER_ID);

            expect(sessionRepository.movePlayerPosition).not.toHaveBeenCalled();
        });

        it('should find closest free tile when start position is occupied', () => {
            const session = createMockSession({
                inGamePlayers: {
                    [PLAYER_ID]: createMockPlayer({ x: NEXT_X, y: NEXT_Y }),
                },
            });
            const startPoint = createMockStartPoint();
            sessionRepository.findStartPointById.mockReturnValue(startPoint);
            gameCache.isTileFree.mockReturnValueOnce(false).mockReturnValueOnce(false).mockReturnValueOnce(false).mockReturnValueOnce(true);
            gameCache.getMapSize.mockReturnValue(MAP_SIZE);
            gameCache.getTileAtPosition.mockReturnValue(createMockTile());
            gameCache.getPlaceableAtPosition.mockReturnValue(null);
            gameCache.getTileOccupant.mockReturnValue(null);
            sessionRepository.movePlayerPosition.mockReturnValue({ oldX: NEXT_X, oldY: NEXT_Y, newX: POSITION_X + ONE, newY: POSITION_Y });

            service.movePlayerToStartPosition(session, PLAYER_ID);

            expect(sessionRepository.movePlayerPosition).toHaveBeenCalled();
        });

        it('should throw NotFoundException when player not found', () => {
            const session = createMockSession({
                inGamePlayers: {},
            });

            expect(() => service.movePlayerToStartPosition(session, PLAYER_ID)).toThrow(NotFoundException);
        });

        it('should throw NotFoundException when start point not found', () => {
            const session = createMockSession();
            sessionRepository.findStartPointById.mockReturnValue(undefined);

            expect(() => service.movePlayerToStartPosition(session, PLAYER_ID)).toThrow(NotFoundException);
        });

        it('should throw NotFoundException when no free tile found', () => {
            const session = createMockSession({
                inGamePlayers: {
                    [PLAYER_ID]: createMockPlayer({ x: NEXT_X, y: NEXT_Y }),
                },
            });
            const startPoint = createMockStartPoint();
            sessionRepository.findStartPointById.mockReturnValue(startPoint);
            gameCache.isTileFree.mockReturnValue(false);
            gameCache.getMapSize.mockReturnValue(MAP_SIZE);
            gameCache.getTileAtPosition.mockReturnValue(createMockTile());
            gameCache.getPlaceableAtPosition.mockReturnValue(null);
            gameCache.getTileOccupant.mockReturnValue('other-player');

            expect(() => service.movePlayerToStartPosition(session, PLAYER_ID)).toThrow(NotFoundException);
        });
    });

    describe('disembarkBoat', () => {
        it('should disembark boat and move player when position differs', () => {
            const session = createMockSession({
                inGamePlayers: {
                    [PLAYER_ID]: createMockPlayer({ onBoatId: 'boat-123', x: POSITION_X, y: POSITION_Y }),
                },
            });
            const newPosition = createMockPosition({ x: NEXT_X });
            sessionRepository.movePlayerPosition.mockReturnValue({ oldX: POSITION_X, oldY: POSITION_Y, newX: NEXT_X, newY: POSITION_Y });
            sessionRepository.playerHasFlag.mockReturnValue(false);
            gameCache.getMapSize.mockReturnValue(MAP_SIZE);

            service.disembarkBoat(session, PLAYER_ID, newPosition);

            expect(session.inGamePlayers[PLAYER_ID].onBoatId).toBeUndefined();
            expect(sessionRepository.movePlayerPosition).toHaveBeenCalledWith(SESSION_ID, PLAYER_ID, NEXT_X, POSITION_Y, ZERO);
            expect(sessionRepository.resetPlayerBoatSpeedBonus).toHaveBeenCalledWith(SESSION_ID, PLAYER_ID);
        });

        it('should disembark boat without moving when position matches', () => {
            const session = createMockSession({
                inGamePlayers: {
                    [PLAYER_ID]: createMockPlayer({ onBoatId: 'boat-123' }),
                },
            });
            const position = createMockPosition();
            sessionRepository.playerHasFlag.mockReturnValue(false);
            gameCache.getMapSize.mockReturnValue(MAP_SIZE);

            service.disembarkBoat(session, PLAYER_ID, position);

            expect(session.inGamePlayers[PLAYER_ID].onBoatId).toBeUndefined();
            expect(sessionRepository.movePlayerPosition).not.toHaveBeenCalled();
            expect(sessionRepository.resetPlayerBoatSpeedBonus).toHaveBeenCalledWith(SESSION_ID, PLAYER_ID);
        });

        it('should throw NotFoundException when player not found', () => {
            const session = createMockSession({
                inGamePlayers: {},
            });

            expect(() => service.disembarkBoat(session, PLAYER_ID, createMockPosition())).toThrow(NotFoundException);
        });
    });

    describe('calculateReachableTiles', () => {
        it('should calculate reachable tiles', () => {
            const session = createMockSession();
            gameCache.getMapSize.mockReturnValue(MAP_SIZE);
            gameCache.getPlaceableAtPosition.mockReturnValue(null);
            gameCache.getTileAtPosition.mockReturnValue(createMockTile());
            gameCache.getTileOccupant.mockReturnValue(null);

            const result = service.calculateReachableTiles(session, PLAYER_ID);

            expect(result.length).toBeGreaterThan(ZERO);
            expect(result[ZERO]).toEqual({ x: POSITION_X, y: POSITION_Y, cost: ZERO, remainingPoints: SPEED });
            expect(eventEmitter.emit).toHaveBeenCalledWith(ServerEvents.PlayerReachableTiles, { playerId: PLAYER_ID, reachable: result });
        });

        it('should throw NotFoundException when player not found', () => {
            const session = createMockSession({
                inGamePlayers: {},
            });

            expect(() => service.calculateReachableTiles(session, PLAYER_ID)).toThrow(NotFoundException);
        });

        it('should handle teleport tiles', () => {
            const session = createMockSession();
            gameCache.getMapSize.mockReturnValue(MAP_SIZE);
            gameCache.getPlaceableAtPosition.mockReturnValue(null);
            gameCache.getTileAtPosition.mockReturnValueOnce(createMockTile()).mockReturnValueOnce(createMockTile({ kind: TileKind.TELEPORT }));
            gameCache.getTileOccupant.mockReturnValue(null);
            gameCache.getTeleportDestination.mockReturnValue(createMockPosition({ x: DESTINATION_X, y: DESTINATION_Y }));

            const result = service.calculateReachableTiles(session, PLAYER_ID);

            expect(result.length).toBeGreaterThan(ZERO);
        });

        it('should handle boat movement', () => {
            const session = createMockSession({
                inGamePlayers: {
                    [PLAYER_ID]: createMockPlayer({ onBoatId: 'boat-123', boatSpeed: BOAT_SPEED }),
                },
            });
            gameCache.getMapSize.mockReturnValue(MAP_SIZE);
            gameCache.getPlaceableAtPosition.mockReturnValue(null);
            gameCache.getTileAtPosition.mockReturnValue(createMockTile({ kind: TileKind.WATER }));
            gameCache.getTileOccupant.mockReturnValue(null);

            const result = service.calculateReachableTiles(session, PLAYER_ID);

            expect(result.length).toBeGreaterThan(ZERO);
            expect(result[ZERO].remainingPoints).toBe(SPEED + BOAT_SPEED);
        });

        it('should skip unreachable placeables', () => {
            const session = createMockSession();
            gameCache.getMapSize.mockReturnValue(MAP_SIZE);
            gameCache.getPlaceableAtPosition.mockReturnValue(createMockPlaceable({ kind: PlaceableKind.HEAL }));
            gameCache.getTileAtPosition.mockReturnValue(createMockTile());
            gameCache.getTileOccupant.mockReturnValue(null);

            const result = service.calculateReachableTiles(session, PLAYER_ID);

            expect(result.length).toBe(ONE);
        });

        it('should include start position even with unreachable placeable', () => {
            const session = createMockSession();
            gameCache.getMapSize.mockReturnValue(MAP_SIZE);
            gameCache.getPlaceableAtPosition.mockReturnValue(createMockPlaceable({ kind: PlaceableKind.HEAL }));
            gameCache.getTileAtPosition.mockReturnValue(createMockTile());
            gameCache.getTileOccupant.mockReturnValue(null);

            const result = service.calculateReachableTiles(session, PLAYER_ID);

            expect(result.length).toBe(ONE);
            expect(result[ZERO]).toEqual({ x: POSITION_X, y: POSITION_Y, cost: ZERO, remainingPoints: SPEED });
        });

        it('should handle door tiles', () => {
            const session = createMockSession();
            gameCache.getMapSize.mockReturnValue(MAP_SIZE);
            gameCache.getPlaceableAtPosition.mockReturnValue(null);
            gameCache.getTileAtPosition
                .mockReturnValueOnce(createMockTile())
                .mockReturnValueOnce(createMockTile({ kind: TileKind.DOOR, open: true }));
            gameCache.getTileOccupant.mockReturnValue(null);

            const result = service.calculateReachableTiles(session, PLAYER_ID);

            expect(result.length).toBeGreaterThan(ZERO);
        });

        it('should handle closed door tiles', () => {
            const session = createMockSession();
            gameCache.getMapSize.mockReturnValue(MAP_SIZE);
            gameCache.getPlaceableAtPosition.mockReturnValue(null);
            gameCache.getTileAtPosition
                .mockReturnValueOnce(createMockTile())
                .mockReturnValueOnce(createMockTile({ kind: TileKind.DOOR, open: false }));
            gameCache.getTileOccupant.mockReturnValue(null);

            const result = service.calculateReachableTiles(session, PLAYER_ID);

            expect(result.length).toBeGreaterThan(ZERO);
        });

        it('should skip teleport when destination is occupied', () => {
            const session = createMockSession();
            gameCache.getMapSize.mockReturnValue(MAP_SIZE);
            gameCache.getPlaceableAtPosition.mockReturnValue(null);
            gameCache.getTileAtPosition.mockReturnValueOnce(createMockTile()).mockReturnValueOnce(createMockTile({ kind: TileKind.TELEPORT }));
            gameCache.getTileOccupant.mockReturnValue(null);
            gameCache.getTeleportDestination.mockReturnValue(createMockPosition({ x: DESTINATION_X, y: DESTINATION_Y }));
            gameCache.getTileOccupant.mockReturnValueOnce(null).mockReturnValueOnce('other-player');

            const result = service.calculateReachableTiles(session, PLAYER_ID);

            expect(result.length).toBeGreaterThan(ZERO);
        });

        it('should handle teleport destination error', () => {
            const session = createMockSession();
            gameCache.getMapSize.mockReturnValue(MAP_SIZE);
            gameCache.getPlaceableAtPosition.mockReturnValue(null);
            gameCache.getTileAtPosition.mockReturnValueOnce(createMockTile()).mockReturnValueOnce(createMockTile({ kind: TileKind.TELEPORT }));
            gameCache.getTileOccupant.mockReturnValue(null);
            gameCache.getTeleportDestination.mockImplementation(() => {
                throw new Error('Teleport error');
            });

            const result = service.calculateReachableTiles(session, PLAYER_ID);

            expect(result.length).toBeGreaterThan(ZERO);
        });

        it('should handle occupied positions', () => {
            const session = createMockSession();
            gameCache.getMapSize.mockReturnValue(MAP_SIZE);
            gameCache.getPlaceableAtPosition.mockReturnValue(null);
            gameCache.getTileAtPosition.mockReturnValue(createMockTile());
            gameCache.getTileOccupant.mockImplementation((sessionId: string, position: Position) => {
                if (position.x === POSITION_X && position.y === POSITION_Y) {
                    return null;
                }
                return 'other-player';
            });

            const result = service.calculateReachableTiles(session, PLAYER_ID);

            expect(result.length).toBe(ONE);
        });

        it('should skip positions outside map bounds', () => {
            const session = createMockSession();
            gameCache.getMapSize.mockReturnValue(MAP_SIZE);
            gameCache.getPlaceableAtPosition.mockReturnValue(null);
            gameCache.getTileAtPosition.mockReturnValue(createMockTile());
            gameCache.getTileOccupant.mockReturnValue(null);

            const result = service.calculateReachableTiles(session, PLAYER_ID);

            expect(result.length).toBeGreaterThan(ZERO);
        });

        it('should handle ice tiles', () => {
            const session = createMockSession();
            gameCache.getMapSize.mockReturnValue(MAP_SIZE);
            gameCache.getPlaceableAtPosition.mockReturnValue(null);
            gameCache.getTileAtPosition.mockReturnValueOnce(createMockTile()).mockReturnValueOnce(createMockTile({ kind: TileKind.ICE }));
            gameCache.getTileOccupant.mockReturnValue(null);

            const result = service.calculateReachableTiles(session, PLAYER_ID);

            expect(result.length).toBeGreaterThan(ZERO);
        });

        it('should handle water tiles', () => {
            const session = createMockSession();
            gameCache.getMapSize.mockReturnValue(MAP_SIZE);
            gameCache.getPlaceableAtPosition.mockReturnValue(null);
            gameCache.getTileAtPosition.mockReturnValueOnce(createMockTile()).mockReturnValueOnce(createMockTile({ kind: TileKind.WATER }));
            gameCache.getTileOccupant.mockReturnValue(null);

            const result = service.calculateReachableTiles(session, PLAYER_ID);

            expect(result.length).toBeGreaterThan(ZERO);
        });

        it('should skip tiles with null cost', () => {
            const session = createMockSession();
            gameCache.getMapSize.mockReturnValue(MAP_SIZE);
            gameCache.getPlaceableAtPosition.mockReturnValue(null);
            gameCache.getTileAtPosition.mockImplementation((sessionId: string, position: Position) => {
                if (position.x === POSITION_X && position.y === POSITION_Y) {
                    return createMockTile();
                }
                return null;
            });
            gameCache.getTileOccupant.mockReturnValue(null);

            const result = service.calculateReachableTiles(session, PLAYER_ID);

            expect(result.length).toBe(ONE);
        });

        it('should skip tiles when remaining points are negative', () => {
            const session = createMockSession({
                inGamePlayers: {
                    [PLAYER_ID]: createMockPlayer({ speed: ONE }),
                },
            });
            gameCache.getMapSize.mockReturnValue(MAP_SIZE);
            gameCache.getPlaceableAtPosition.mockReturnValue(null);
            gameCache.getTileAtPosition.mockImplementation((sessionId: string, position: Position) => {
                if (position.x === POSITION_X && position.y === POSITION_Y) {
                    return createMockTile();
                }
                return createMockTile({ kind: TileKind.WATER });
            });
            gameCache.getTileOccupant.mockReturnValue(null);

            const result = service.calculateReachableTiles(session, PLAYER_ID);

            expect(result.length).toBe(ONE);
        });

        it('should handle reachable placeables', () => {
            const session = createMockSession();
            gameCache.getMapSize.mockReturnValue(MAP_SIZE);
            gameCache.getPlaceableAtPosition.mockReturnValue(createMockPlaceable({ kind: PlaceableKind.BOAT }));
            gameCache.getTileAtPosition.mockReturnValue(createMockTile());
            gameCache.getTileOccupant.mockReturnValue(null);

            const result = service.calculateReachableTiles(session, PLAYER_ID);

            expect(result.length).toBeGreaterThan(ZERO);
        });
    });
});
