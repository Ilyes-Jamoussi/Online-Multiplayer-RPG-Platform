/* eslint-disable max-lines -- Test file with comprehensive test coverage */
import { ServerEvents } from '@app/enums/server-events.enum';
import { Placeable } from '@app/modules/game-store/entities/placeable.entity';
import { Tile } from '@app/modules/game-store/entities/tile.entity';
import { CombatService } from '@app/modules/in-game/services/combat/combat.service';
import { GameCacheService } from '@app/modules/in-game/services/game-cache/game-cache.service';
import { InGameSessionRepository } from '@app/modules/in-game/services/in-game-session/in-game-session.repository';
import { MovementService } from '@app/modules/in-game/services/movement/movement.service';
import { AvailableActionType } from '@common/enums/available-action-type.enum';
import { Avatar } from '@common/enums/avatar.enum';
import { CombatPosture } from '@common/enums/combat-posture.enum';
import { Dice } from '@common/enums/dice.enum';
import { GameMode } from '@common/enums/game-mode.enum';
import { MapSize } from '@common/enums/map-size.enum';
import { Orientation } from '@common/enums/orientation.enum';
import { PlaceableKind } from '@common/enums/placeable-kind.enum';
import { TileKind } from '@common/enums/tile.enum';
import { AvailableAction } from '@common/interfaces/available-action.interface';
import { FlagData } from '@common/interfaces/flag-data.interface';
import { Player } from '@common/interfaces/player.interface';
import { Position } from '@common/interfaces/position.interface';
import { ReachableTile } from '@common/interfaces/reachable-tile.interface';
import { InGameSession } from '@common/interfaces/session.interface';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Test, TestingModule } from '@nestjs/testing';
import { Types } from 'mongoose';
import { ActionService } from './action.service';

const MOCK_SESSION_ID = 'session-123';
const MOCK_PLAYER_ID_1 = 'player-1';
const MOCK_PLAYER_ID_2 = 'player-2';
const MOCK_PLAYER_NAME_1 = 'Player 1';
const MOCK_PLAYER_NAME_2 = 'Player 2';
const MOCK_X = 5;
const MOCK_Y = 10;
const MOCK_X_2 = 6;
const MOCK_Y_2 = 11;
const MOCK_HEALTH_BONUS = 2;
const MOCK_DOUBLE_HEALTH_BONUS = 4;
const MOCK_FIGHT_BONUS = 1;
const MOCK_DOUBLE_FIGHT_BONUS = 2;
const MOCK_ACTIONS_REMAINING = 1;
const MOCK_SPEED = 3;
const MOCK_TEAM_NUMBER_1 = 1;
const MOCK_TEAM_NUMBER_2 = 2;
const MOCK_PLACEABLE_ID = 'placeable-123';
const MOCK_BOAT_ID = 'boat-123';
const MOCK_RANDOM_VALUE = 0.3;
const MOCK_RANDOM_VALUE_ABOVE_THRESHOLD = 0.6;

const createMockPlayer = (overrides: Partial<Player> = {}): Player => ({
    id: MOCK_PLAYER_ID_1,
    name: MOCK_PLAYER_NAME_1,
    avatar: Avatar.Avatar1,
    isAdmin: false,
    baseHealth: 100,
    healthBonus: 0,
    health: 100,
    maxHealth: 100,
    baseSpeed: MOCK_SPEED,
    speedBonus: 0,
    speed: MOCK_SPEED,
    boatSpeedBonus: 0,
    boatSpeed: 0,
    baseAttack: 10,
    attackBonus: 0,
    baseDefense: 5,
    defenseBonus: 0,
    attackDice: Dice.D6,
    defenseDice: Dice.D4,
    x: MOCK_X,
    y: MOCK_Y,
    isInGame: true,
    startPointId: '',
    actionsRemaining: MOCK_ACTIONS_REMAINING,
    combatCount: 0,
    combatWins: 0,
    combatLosses: 0,
    combatDraws: 0,
    hasCombatBonus: false,
    ...overrides,
});

const createMockSession = (overrides: Partial<InGameSession> = {}): InGameSession => ({
    id: MOCK_SESSION_ID,
    inGameId: 'in-game-123',
    gameId: 'game-123',
    chatId: 'chat-123',
    maxPlayers: 4,
    mode: GameMode.CLASSIC,
    isGameStarted: false,
    inGamePlayers: {
        [MOCK_PLAYER_ID_1]: createMockPlayer({ id: MOCK_PLAYER_ID_1, name: MOCK_PLAYER_NAME_1 }),
        [MOCK_PLAYER_ID_2]: createMockPlayer({ id: MOCK_PLAYER_ID_2, name: MOCK_PLAYER_NAME_2 }),
    },
    teams: {
        // eslint-disable-next-line @typescript-eslint/naming-convention -- Team number must be numeric
        1: { number: 1, playerIds: [MOCK_PLAYER_ID_1, MOCK_PLAYER_ID_2] },
    },
    currentTurn: { turnNumber: 1, activePlayerId: MOCK_PLAYER_ID_1, hasUsedAction: false },
    startPoints: [],
    mapSize: MapSize.MEDIUM,
    turnOrder: [MOCK_PLAYER_ID_1, MOCK_PLAYER_ID_2],
    playerCount: 2,
    ...overrides,
});

const createMockPlaceable = (overrides: Partial<Placeable> = {}): Placeable => {
    const mockObjectId = new Types.ObjectId();
    Object.defineProperty(mockObjectId, 'toString', {
        value: jest.fn().mockReturnValue(MOCK_PLACEABLE_ID),
        writable: true,
    });
    return {
        _id: mockObjectId,
        kind: PlaceableKind.START,
        x: MOCK_X,
        y: MOCK_Y,
        placed: true,
        ...overrides,
    };
};

const createMockTile = (overrides: Partial<Tile> = {}): Tile => ({
    kind: TileKind.BASE,
    x: MOCK_X,
    y: MOCK_Y,
    open: false,
    ...overrides,
});

const createMockTileWithPlayerId = (overrides: Partial<Tile & { playerId: string | null }> = {}): Tile & { playerId: string | null } => ({
    kind: TileKind.BASE,
    x: MOCK_X,
    y: MOCK_Y,
    open: false,
    playerId: null,
    ...overrides,
});

describe('ActionService', () => {
    let service: ActionService;
    let mockGameCache: jest.Mocked<GameCacheService>;
    let mockMovementService: jest.Mocked<MovementService>;
    let mockCombatService: jest.Mocked<CombatService>;
    let mockEventEmitter: jest.Mocked<EventEmitter2>;
    let mockRepository: jest.Mocked<InGameSessionRepository>;

    beforeEach(async () => {
        const mockGameCacheValue = {
            getTileOccupant: jest.fn(),
            getTileAtPosition: jest.fn(),
            getTeleportDestination: jest.fn(),
            getPlaceableAtPosition: jest.fn(),
            getGameMapForSession: jest.fn(),
            isPlaceableDisabled: jest.fn(),
            getNextPosition: jest.fn(),
            getPlaceablePositions: jest.fn(),
            disablePlaceable: jest.fn(),
            fetchAndCacheGame: jest.fn(),
            getInitialFlagData: jest.fn(),
            isTileFree: jest.fn(),
            clearSessionGameCache: jest.fn(),
            getTileByPlayerId: jest.fn(),
        };

        const mockMovementServiceValue = {
            movePlayer: jest.fn(),
            calculateReachableTiles: jest.fn(),
            disembarkBoat: jest.fn(),
            checkCTFVictory: jest.fn(),
        };

        const mockCombatServiceValue = {
            clearActiveCombatForSession: jest.fn(),
            combatChoice: jest.fn(),
            getActiveCombat: jest.fn(),
            attackPlayerAction: jest.fn(),
        };

        const mockEventEmitterValue = {
            emit: jest.fn(),
        };

        const mockRepositoryValue = {
            pickUpFlag: jest.fn(),
            transferFlag: jest.fn(),
            findById: jest.fn(),
            movePlayerPosition: jest.fn(),
            applyPlayerBoatSpeedBonus: jest.fn(),
            increasePlayerHealth: jest.fn(),
            applyPlayerBonus: jest.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ActionService,
                {
                    provide: GameCacheService,
                    useValue: mockGameCacheValue,
                },
                {
                    provide: MovementService,
                    useValue: mockMovementServiceValue,
                },
                {
                    provide: CombatService,
                    useValue: mockCombatServiceValue,
                },
                {
                    provide: EventEmitter2,
                    useValue: mockEventEmitterValue,
                },
                {
                    provide: InGameSessionRepository,
                    useValue: mockRepositoryValue,
                },
            ],
        }).compile();

        service = module.get<ActionService>(ActionService);
        mockGameCache = module.get(GameCacheService);
        mockMovementService = module.get(MovementService);
        mockCombatService = module.get(CombatService);
        mockEventEmitter = module.get(EventEmitter2);
        mockRepository = module.get(InGameSessionRepository);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('pickUpFlag', () => {
        it('should pick up flag successfully', () => {
            const session = createMockSession({
                flagData: { holderPlayerId: null, position: { x: MOCK_X, y: MOCK_Y } },
            });
            const position: Position = { x: MOCK_X, y: MOCK_Y };

            service.pickUpFlag(session, MOCK_PLAYER_ID_1, position);

            expect(mockRepository.pickUpFlag).toHaveBeenCalledWith(session, MOCK_PLAYER_ID_1, position);
        });

        it('should throw NotFoundException when player not found', () => {
            const session = createMockSession();
            const position: Position = { x: MOCK_X, y: MOCK_Y };

            expect(() => service.pickUpFlag(session, 'non-existent', position)).toThrow(NotFoundException);
        });

        it('should throw NotFoundException when flag data not found', () => {
            const session = createMockSession({ flagData: undefined });
            const position: Position = { x: MOCK_X, y: MOCK_Y };

            expect(() => service.pickUpFlag(session, MOCK_PLAYER_ID_1, position)).toThrow(NotFoundException);
        });

        it('should throw BadRequestException when flag already picked up', () => {
            const session = createMockSession({
                flagData: { holderPlayerId: MOCK_PLAYER_ID_2, position: { x: MOCK_X, y: MOCK_Y } },
            });
            const position: Position = { x: MOCK_X, y: MOCK_Y };

            expect(() => service.pickUpFlag(session, MOCK_PLAYER_ID_1, position)).toThrow(BadRequestException);
        });
    });

    describe('transferFlag', () => {
        it('should transfer flag successfully', () => {
            const session = createMockSession({
                flagData: { holderPlayerId: MOCK_PLAYER_ID_1, position: { x: MOCK_X, y: MOCK_Y } },
            });
            const position: Position = { x: MOCK_X_2, y: MOCK_Y_2 };
            mockGameCache.getTileOccupant.mockReturnValue(MOCK_PLAYER_ID_2);

            service.transferFlag(session, MOCK_PLAYER_ID_1, position);

            expect(mockRepository.transferFlag).toHaveBeenCalledWith(session, MOCK_PLAYER_ID_1, MOCK_PLAYER_ID_2);
            expect(mockMovementService.checkCTFVictory).toHaveBeenCalled();
        });

        it('should throw NotFoundException when player not found', () => {
            const session = createMockSession();
            const position: Position = { x: MOCK_X, y: MOCK_Y };

            expect(() => service.transferFlag(session, 'non-existent', position)).toThrow(NotFoundException);
        });

        it('should throw NotFoundException when flag data not found', () => {
            const session = createMockSession({ flagData: undefined });
            const position: Position = { x: MOCK_X, y: MOCK_Y };

            expect(() => service.transferFlag(session, MOCK_PLAYER_ID_1, position)).toThrow(NotFoundException);
        });

        it('should throw BadRequestException when player does not hold flag', () => {
            const session = createMockSession({
                flagData: { holderPlayerId: MOCK_PLAYER_ID_2, position: { x: MOCK_X, y: MOCK_Y } },
            });
            const position: Position = { x: MOCK_X, y: MOCK_Y };

            expect(() => service.transferFlag(session, MOCK_PLAYER_ID_1, position)).toThrow(BadRequestException);
        });

        it('should throw NotFoundException when no player at target position', () => {
            const session = createMockSession({
                flagData: { holderPlayerId: MOCK_PLAYER_ID_1, position: { x: MOCK_X, y: MOCK_Y } },
            });
            const position: Position = { x: MOCK_X_2, y: MOCK_Y_2 };
            mockGameCache.getTileOccupant.mockReturnValue(null);

            expect(() => service.transferFlag(session, MOCK_PLAYER_ID_1, position)).toThrow(NotFoundException);
        });
    });

    describe('requestFlagTransfer', () => {
        it('should request flag transfer successfully', () => {
            const session = createMockSession({
                flagData: { holderPlayerId: MOCK_PLAYER_ID_1, position: { x: MOCK_X, y: MOCK_Y } },
                mode: GameMode.CTF,
            });
            const player1 = createMockPlayer({ id: MOCK_PLAYER_ID_1, teamNumber: MOCK_TEAM_NUMBER_1 });
            const player2 = createMockPlayer({ id: MOCK_PLAYER_ID_2, teamNumber: MOCK_TEAM_NUMBER_1 });
            session.inGamePlayers[MOCK_PLAYER_ID_1] = player1;
            session.inGamePlayers[MOCK_PLAYER_ID_2] = player2;
            const position: Position = { x: MOCK_X_2, y: MOCK_Y_2 };
            mockGameCache.getTileOccupant.mockReturnValue(MOCK_PLAYER_ID_2);

            service.requestFlagTransfer(session, MOCK_PLAYER_ID_1, position);

            expect(mockEventEmitter.emit).toHaveBeenCalledWith(
                ServerEvents.FlagTransferRequested,
                expect.objectContaining({
                    session,
                    fromPlayerId: MOCK_PLAYER_ID_1,
                    toPlayerId: MOCK_PLAYER_ID_2,
                    fromPlayerName: MOCK_PLAYER_NAME_1,
                }),
            );
        });

        it('should throw BadRequestException when player does not hold flag', () => {
            const session = createMockSession({
                flagData: { holderPlayerId: MOCK_PLAYER_ID_2, position: { x: MOCK_X, y: MOCK_Y } },
            });
            const position: Position = { x: MOCK_X_2, y: MOCK_Y_2 };

            expect(() => service.requestFlagTransfer(session, MOCK_PLAYER_ID_1, position)).toThrow(BadRequestException);
        });

        it('should throw BadRequestException when invalid target player', () => {
            const session = createMockSession({
                flagData: { holderPlayerId: MOCK_PLAYER_ID_1, position: { x: MOCK_X, y: MOCK_Y } },
            });
            const position: Position = { x: MOCK_X_2, y: MOCK_Y_2 };
            mockGameCache.getTileOccupant.mockReturnValue(null);

            expect(() => service.requestFlagTransfer(session, MOCK_PLAYER_ID_1, position)).toThrow(BadRequestException);
        });

        it('should throw BadRequestException when target is same player', () => {
            const session = createMockSession({
                flagData: { holderPlayerId: MOCK_PLAYER_ID_1, position: { x: MOCK_X, y: MOCK_Y } },
            });
            const position: Position = { x: MOCK_X_2, y: MOCK_Y_2 };
            mockGameCache.getTileOccupant.mockReturnValue(MOCK_PLAYER_ID_1);

            expect(() => service.requestFlagTransfer(session, MOCK_PLAYER_ID_1, position)).toThrow(BadRequestException);
        });

        it('should throw BadRequestException when not teammates', () => {
            const session = createMockSession({
                flagData: { holderPlayerId: MOCK_PLAYER_ID_1, position: { x: MOCK_X, y: MOCK_Y } },
            });
            const position: Position = { x: MOCK_X_2, y: MOCK_Y_2 };
            mockGameCache.getTileOccupant.mockReturnValue(MOCK_PLAYER_ID_2);
            const player1 = createMockPlayer({ id: MOCK_PLAYER_ID_1, teamNumber: MOCK_TEAM_NUMBER_1 });
            const player2 = createMockPlayer({ id: MOCK_PLAYER_ID_2, teamNumber: MOCK_TEAM_NUMBER_2 });
            session.inGamePlayers[MOCK_PLAYER_ID_1] = player1;
            session.inGamePlayers[MOCK_PLAYER_ID_2] = player2;

            expect(() => service.requestFlagTransfer(session, MOCK_PLAYER_ID_1, position)).toThrow(BadRequestException);
        });

        it('should throw BadRequestException when request already pending', () => {
            const session = createMockSession({
                flagData: { holderPlayerId: MOCK_PLAYER_ID_1, position: { x: MOCK_X, y: MOCK_Y } },
                mode: GameMode.CTF,
            });
            const player1 = createMockPlayer({ id: MOCK_PLAYER_ID_1, teamNumber: MOCK_TEAM_NUMBER_1 });
            const player2 = createMockPlayer({ id: MOCK_PLAYER_ID_2, teamNumber: MOCK_TEAM_NUMBER_1 });
            session.inGamePlayers[MOCK_PLAYER_ID_1] = player1;
            session.inGamePlayers[MOCK_PLAYER_ID_2] = player2;
            const position: Position = { x: MOCK_X_2, y: MOCK_Y_2 };
            mockGameCache.getTileOccupant.mockReturnValue(MOCK_PLAYER_ID_2);
            service.requestFlagTransfer(session, MOCK_PLAYER_ID_1, position);

            expect(() => service.requestFlagTransfer(session, MOCK_PLAYER_ID_1, position)).toThrow(BadRequestException);
        });
    });

    describe('clearPendingFlagTransfersForSession', () => {
        it('should clear pending flag transfers for session', () => {
            const session = createMockSession({
                flagData: { holderPlayerId: MOCK_PLAYER_ID_1, position: { x: MOCK_X, y: MOCK_Y } },
                mode: GameMode.CTF,
            });
            const player1 = createMockPlayer({ id: MOCK_PLAYER_ID_1, teamNumber: MOCK_TEAM_NUMBER_1 });
            const player2 = createMockPlayer({ id: MOCK_PLAYER_ID_2, teamNumber: MOCK_TEAM_NUMBER_1 });
            session.inGamePlayers[MOCK_PLAYER_ID_1] = player1;
            session.inGamePlayers[MOCK_PLAYER_ID_2] = player2;
            const position: Position = { x: MOCK_X_2, y: MOCK_Y_2 };
            mockGameCache.getTileOccupant.mockReturnValue(MOCK_PLAYER_ID_2);
            service.requestFlagTransfer(session, MOCK_PLAYER_ID_1, position);

            service.clearPendingFlagTransfersForSession({ session });

            expect(mockEventEmitter.emit).toHaveBeenCalledWith(
                ServerEvents.FlagTransferRequestsCleared,
                expect.objectContaining({
                    session,
                    affectedPlayerIds: expect.arrayContaining([MOCK_PLAYER_ID_1, MOCK_PLAYER_ID_2]),
                }),
            );
        });

        it('should not emit event when no transfers to clear', () => {
            const session = createMockSession();

            service.clearPendingFlagTransfersForSession({ session });

            expect(mockEventEmitter.emit).not.toHaveBeenCalledWith(ServerEvents.FlagTransferRequestsCleared, expect.anything());
        });
    });

    describe('respondToFlagTransfer', () => {
        it('should accept flag transfer', () => {
            const session = createMockSession({
                flagData: { holderPlayerId: MOCK_PLAYER_ID_1, position: { x: MOCK_X, y: MOCK_Y } },
                mode: GameMode.CTF,
            });
            const player1 = createMockPlayer({ id: MOCK_PLAYER_ID_1, teamNumber: MOCK_TEAM_NUMBER_1 });
            const player2 = createMockPlayer({ id: MOCK_PLAYER_ID_2, teamNumber: MOCK_TEAM_NUMBER_1 });
            session.inGamePlayers[MOCK_PLAYER_ID_1] = player1;
            session.inGamePlayers[MOCK_PLAYER_ID_2] = player2;
            const position: Position = { x: MOCK_X_2, y: MOCK_Y_2 };
            mockGameCache.getTileOccupant.mockReturnValue(MOCK_PLAYER_ID_2);
            service.requestFlagTransfer(session, MOCK_PLAYER_ID_1, position);
            mockRepository.findById.mockReturnValue(session);
            mockGameCache.getTileOccupant.mockReturnValue(MOCK_PLAYER_ID_2);

            service.respondToFlagTransfer(MOCK_SESSION_ID, MOCK_PLAYER_ID_2, MOCK_PLAYER_ID_1, true);

            expect(mockRepository.transferFlag).toHaveBeenCalled();
            expect(mockEventEmitter.emit).toHaveBeenCalledWith(
                ServerEvents.FlagTransferResult,
                expect.objectContaining({
                    sessionId: MOCK_SESSION_ID,
                    fromPlayerId: MOCK_PLAYER_ID_1,
                    toPlayerId: MOCK_PLAYER_ID_2,
                    accepted: true,
                }),
            );
        });

        it('should reject flag transfer', () => {
            const session = createMockSession({
                flagData: { holderPlayerId: MOCK_PLAYER_ID_1, position: { x: MOCK_X, y: MOCK_Y } },
                mode: GameMode.CTF,
            });
            const player1 = createMockPlayer({ id: MOCK_PLAYER_ID_1, teamNumber: MOCK_TEAM_NUMBER_1 });
            const player2 = createMockPlayer({ id: MOCK_PLAYER_ID_2, teamNumber: MOCK_TEAM_NUMBER_1 });
            session.inGamePlayers[MOCK_PLAYER_ID_1] = player1;
            session.inGamePlayers[MOCK_PLAYER_ID_2] = player2;
            const position: Position = { x: MOCK_X_2, y: MOCK_Y_2 };
            mockGameCache.getTileOccupant.mockReturnValue(MOCK_PLAYER_ID_2);
            service.requestFlagTransfer(session, MOCK_PLAYER_ID_1, position);

            service.respondToFlagTransfer(MOCK_SESSION_ID, MOCK_PLAYER_ID_2, MOCK_PLAYER_ID_1, false);

            expect(mockRepository.transferFlag).not.toHaveBeenCalled();
            expect(mockEventEmitter.emit).toHaveBeenCalledWith(
                ServerEvents.FlagTransferResult,
                expect.objectContaining({
                    sessionId: MOCK_SESSION_ID,
                    fromPlayerId: MOCK_PLAYER_ID_1,
                    toPlayerId: MOCK_PLAYER_ID_2,
                    accepted: false,
                }),
            );
        });

        it('should throw NotFoundException when request not found', () => {
            expect(() => service.respondToFlagTransfer(MOCK_SESSION_ID, MOCK_PLAYER_ID_2, MOCK_PLAYER_ID_1, true)).toThrow(
                NotFoundException,
            );
        });
    });

    describe('getTileOccupant', () => {
        it('should return tile occupant', () => {
            const position: Position = { x: MOCK_X, y: MOCK_Y };
            mockGameCache.getTileOccupant.mockReturnValue(MOCK_PLAYER_ID_1);

            const result = service.getTileOccupant(MOCK_SESSION_ID, position);

            expect(mockGameCache.getTileOccupant).toHaveBeenCalledWith(MOCK_SESSION_ID, position);
            expect(result).toBe(MOCK_PLAYER_ID_1);
        });
    });

    describe('getTileAtPosition', () => {
        it('should return tile at position', () => {
            const position: Position = { x: MOCK_X, y: MOCK_Y };
            const tile = createMockTileWithPlayerId();
            mockGameCache.getTileAtPosition.mockReturnValue(tile);

            const result = service.getTileAtPosition(MOCK_SESSION_ID, position);

            expect(mockGameCache.getTileAtPosition).toHaveBeenCalledWith(MOCK_SESSION_ID, position);
            expect(result).toBe(tile);
        });
    });

    describe('getTeleportDestination', () => {
        it('should return teleport destination', () => {
            const position: Position = { x: MOCK_X, y: MOCK_Y };
            const destination: Position = { x: MOCK_X_2, y: MOCK_Y_2 };
            mockGameCache.getTeleportDestination.mockReturnValue(destination);

            const result = service.getTeleportDestination(MOCK_SESSION_ID, position);

            expect(mockGameCache.getTeleportDestination).toHaveBeenCalledWith(MOCK_SESSION_ID, position);
            expect(result).toBe(destination);
        });
    });

    describe('getPlaceableAtPosition', () => {
        it('should return placeable at position', () => {
            const position: Position = { x: MOCK_X, y: MOCK_Y };
            const placeable = createMockPlaceable();
            mockGameCache.getPlaceableAtPosition.mockReturnValue(placeable);

            const result = service.getPlaceableAtPosition(MOCK_SESSION_ID, position);

            expect(mockGameCache.getPlaceableAtPosition).toHaveBeenCalledWith(MOCK_SESSION_ID, position);
            expect(result).toBe(placeable);
        });
    });

    describe('toggleDoor', () => {
        it('should toggle door successfully', () => {
            const session = createMockSession();
            const position: Position = { x: MOCK_X, y: MOCK_Y };
            const gameMap = {
                tiles: [createMockTileWithPlayerId({ kind: TileKind.DOOR, open: false })],
                objects: [],
                size: MapSize.MEDIUM,
            };
            mockGameCache.getGameMapForSession.mockReturnValue(gameMap);

            service.toggleDoor(session, MOCK_PLAYER_ID_1, position);

            expect(mockEventEmitter.emit).toHaveBeenCalledWith(
                ServerEvents.DoorToggled,
                expect.objectContaining({
                    session,
                    playerId: MOCK_PLAYER_ID_1,
                    x: MOCK_X,
                    y: MOCK_Y,
                    isOpen: true,
                }),
            );
        });

        it('should not toggle when tile is not door', () => {
            const session = createMockSession();
            const position: Position = { x: MOCK_X, y: MOCK_Y };
            const gameMap = {
                tiles: [createMockTileWithPlayerId({ kind: TileKind.BASE })],
                objects: [],
                size: MapSize.MEDIUM,
            };
            mockGameCache.getGameMapForSession.mockReturnValue(gameMap);

            service.toggleDoor(session, MOCK_PLAYER_ID_1, position);

            expect(mockEventEmitter.emit).not.toHaveBeenCalled();
        });
    });

    describe('sanctuaryRequest', () => {
        it('should emit OpenSanctuary for HEAL', () => {
            const session = createMockSession();
            const position: Position = { x: MOCK_X, y: MOCK_Y };
            const placeable = createMockPlaceable({ kind: PlaceableKind.HEAL });
            mockGameCache.getPlaceableAtPosition.mockReturnValue(placeable);
            mockGameCache.isPlaceableDisabled.mockReturnValue(false);

            service.sanctuaryRequest(session, MOCK_PLAYER_ID_1, position, PlaceableKind.HEAL);

            expect(mockEventEmitter.emit).toHaveBeenCalledWith(
                ServerEvents.OpenSanctuary,
                expect.objectContaining({
                    session,
                    playerId: MOCK_PLAYER_ID_1,
                    kind: PlaceableKind.HEAL,
                    x: MOCK_X,
                    y: MOCK_Y,
                }),
            );
        });

        it('should emit OpenSanctuaryDenied when player has combat bonuses for FIGHT', () => {
            const session = createMockSession();
            const player = createMockPlayer({ id: MOCK_PLAYER_ID_1, attackBonus: 1, defenseBonus: 1 });
            session.inGamePlayers[MOCK_PLAYER_ID_1] = player;
            const position: Position = { x: MOCK_X, y: MOCK_Y };
            const placeable = createMockPlaceable({ kind: PlaceableKind.FIGHT });
            mockGameCache.getPlaceableAtPosition.mockReturnValue(placeable);

            service.sanctuaryRequest(session, MOCK_PLAYER_ID_1, position, PlaceableKind.FIGHT);

            expect(mockEventEmitter.emit).toHaveBeenCalledWith(
                ServerEvents.OpenSanctuaryDenied,
                expect.objectContaining({
                    session,
                    playerId: MOCK_PLAYER_ID_1,
                    message: expect.stringContaining('bonus de combat'),
                }),
            );
        });

        it('should emit OpenSanctuaryDenied when placeable is disabled', () => {
            const session = createMockSession();
            const position: Position = { x: MOCK_X, y: MOCK_Y };
            const placeable = createMockPlaceable({ kind: PlaceableKind.HEAL });
            mockGameCache.getPlaceableAtPosition.mockReturnValue(placeable);
            mockGameCache.isPlaceableDisabled.mockReturnValue(true);

            service.sanctuaryRequest(session, MOCK_PLAYER_ID_1, position, PlaceableKind.HEAL);

            expect(mockEventEmitter.emit).toHaveBeenCalledWith(
                ServerEvents.OpenSanctuaryDenied,
                expect.objectContaining({
                    session,
                    playerId: MOCK_PLAYER_ID_1,
                    message: expect.stringContaining('récemment'),
                }),
            );
        });

        it('should throw NotFoundException when player not found', () => {
            const session = createMockSession();
            const position: Position = { x: MOCK_X, y: MOCK_Y };

            expect(() => service.sanctuaryRequest(session, 'non-existent', position, PlaceableKind.HEAL)).toThrow(NotFoundException);
        });

        it('should throw BadRequestException when no actions remaining', () => {
            const session = createMockSession();
            const player = createMockPlayer({ id: MOCK_PLAYER_ID_1, actionsRemaining: 0 });
            session.inGamePlayers[MOCK_PLAYER_ID_1] = player;
            const position: Position = { x: MOCK_X, y: MOCK_Y };

            expect(() => service.sanctuaryRequest(session, MOCK_PLAYER_ID_1, position, PlaceableKind.HEAL)).toThrow(BadRequestException);
        });
    });

    describe('performSanctuaryAction', () => {
        it('should perform HEAL sanctuary action', () => {
            const session = createMockSession();
            const position: Position = { x: MOCK_X, y: MOCK_Y };
            const placeable = createMockPlaceable({ kind: PlaceableKind.HEAL });
            mockGameCache.getPlaceableAtPosition.mockReturnValue(placeable);

            service.performSanctuaryAction(session, MOCK_PLAYER_ID_1, position, false);

            expect(mockEventEmitter.emit).toHaveBeenCalledWith(
                ServerEvents.SanctuaryActionSuccess,
                expect.objectContaining({
                    session,
                    playerId: MOCK_PLAYER_ID_1,
                    kind: PlaceableKind.HEAL,
                    x: MOCK_X,
                    y: MOCK_Y,
                    addedHealth: MOCK_HEALTH_BONUS,
                }),
            );
            expect(mockRepository.increasePlayerHealth).toHaveBeenCalledWith(MOCK_SESSION_ID, MOCK_PLAYER_ID_1, MOCK_HEALTH_BONUS);
        });

        it('should perform HEAL sanctuary action with double', () => {
            const session = createMockSession();
            const position: Position = { x: MOCK_X, y: MOCK_Y };
            const placeable = createMockPlaceable({ kind: PlaceableKind.HEAL });
            mockGameCache.getPlaceableAtPosition.mockReturnValue(placeable);
            const originalRandom = Math.random;
            Math.random = jest.fn().mockReturnValue(MOCK_RANDOM_VALUE);

            service.performSanctuaryAction(session, MOCK_PLAYER_ID_1, position, true);

            expect(mockEventEmitter.emit).toHaveBeenCalledWith(
                ServerEvents.SanctuaryActionSuccess,
                expect.objectContaining({
                    addedHealth: MOCK_DOUBLE_HEALTH_BONUS,
                }),
            );
            expect(mockRepository.increasePlayerHealth).toHaveBeenCalledWith(MOCK_SESSION_ID, MOCK_PLAYER_ID_1, MOCK_DOUBLE_HEALTH_BONUS);

            Math.random = originalRandom;
        });

        it('should perform FIGHT sanctuary action', () => {
            const session = createMockSession();
            const position: Position = { x: MOCK_X, y: MOCK_Y };
            const placeable = createMockPlaceable({ kind: PlaceableKind.FIGHT });
            mockGameCache.getPlaceableAtPosition.mockReturnValue(placeable);

            service.performSanctuaryAction(session, MOCK_PLAYER_ID_1, position, false);

            expect(mockEventEmitter.emit).toHaveBeenCalledWith(
                ServerEvents.SanctuaryActionSuccess,
                expect.objectContaining({
                    session,
                    playerId: MOCK_PLAYER_ID_1,
                    kind: PlaceableKind.FIGHT,
                    x: MOCK_X,
                    y: MOCK_Y,
                    addedDefense: MOCK_FIGHT_BONUS,
                    addedAttack: MOCK_FIGHT_BONUS,
                }),
            );
            expect(mockRepository.applyPlayerBonus).toHaveBeenCalledWith(MOCK_SESSION_ID, MOCK_PLAYER_ID_1, MOCK_FIGHT_BONUS);
        });

        it('should perform FIGHT sanctuary action with double', () => {
            const session = createMockSession();
            const position: Position = { x: MOCK_X, y: MOCK_Y };
            const placeable = createMockPlaceable({ kind: PlaceableKind.FIGHT });
            mockGameCache.getPlaceableAtPosition.mockReturnValue(placeable);
            const originalRandom = Math.random;
            Math.random = jest.fn().mockReturnValue(MOCK_RANDOM_VALUE);

            service.performSanctuaryAction(session, MOCK_PLAYER_ID_1, position, true);

            expect(mockEventEmitter.emit).toHaveBeenCalledWith(
                ServerEvents.SanctuaryActionSuccess,
                expect.objectContaining({
                    addedDefense: MOCK_DOUBLE_FIGHT_BONUS,
                    addedAttack: MOCK_DOUBLE_FIGHT_BONUS,
                }),
            );
            expect(mockRepository.applyPlayerBonus).toHaveBeenCalledWith(MOCK_SESSION_ID, MOCK_PLAYER_ID_1, MOCK_DOUBLE_FIGHT_BONUS);
            Math.random = originalRandom;
        });

        it('should emit SanctuaryActionFailed when double fails', () => {
            const session = createMockSession();
            const position: Position = { x: MOCK_X, y: MOCK_Y };
            const placeable = createMockPlaceable({ kind: PlaceableKind.HEAL });
            mockGameCache.getPlaceableAtPosition.mockReturnValue(placeable);
            const originalRandom = Math.random;
            Math.random = jest.fn().mockReturnValue(MOCK_RANDOM_VALUE_ABOVE_THRESHOLD);

            service.performSanctuaryAction(session, MOCK_PLAYER_ID_1, position, true);

            expect(mockEventEmitter.emit).toHaveBeenCalledWith(ServerEvents.SanctuaryActionFailed, { session, playerId: MOCK_PLAYER_ID_1 });
            expect(mockRepository.increasePlayerHealth).not.toHaveBeenCalled();

            Math.random = originalRandom;
        });

        it('should throw NotFoundException when object not found', () => {
            const session = createMockSession();
            const position: Position = { x: MOCK_X, y: MOCK_Y };
            mockGameCache.getPlaceableAtPosition.mockReturnValue(null);

            expect(() => service.performSanctuaryAction(session, MOCK_PLAYER_ID_1, position, false)).toThrow(NotFoundException);
        });

        it('should throw BadRequestException when invalid object kind', () => {
            const session = createMockSession();
            const position: Position = { x: MOCK_X, y: MOCK_Y };
            const placeable = createMockPlaceable({ kind: PlaceableKind.START });
            mockGameCache.getPlaceableAtPosition.mockReturnValue(placeable);

            expect(() => service.performSanctuaryAction(session, MOCK_PLAYER_ID_1, position, false)).toThrow(BadRequestException);
        });
    });

    describe('boardBoat', () => {
        it('should board boat successfully', () => {
            const session = createMockSession();
            const position: Position = { x: MOCK_X, y: MOCK_Y };
            const boatObjectId = new Types.ObjectId();
            Object.defineProperty(boatObjectId, 'toString', {
                value: jest.fn().mockReturnValue(MOCK_BOAT_ID),
                writable: true,
            });
            const boat = createMockPlaceable({ kind: PlaceableKind.BOAT, _id: boatObjectId });
            mockGameCache.getPlaceableAtPosition.mockReturnValue(boat);
            mockMovementService.calculateReachableTiles.mockReturnValue([]);

            service.boardBoat(session, MOCK_PLAYER_ID_1, position);

            expect(mockRepository.applyPlayerBoatSpeedBonus).toHaveBeenCalledWith(MOCK_SESSION_ID, MOCK_PLAYER_ID_1);
            expect(mockEventEmitter.emit).toHaveBeenCalledWith(
                ServerEvents.PlayerBoardedBoat,
                expect.objectContaining({
                    session,
                    playerId: MOCK_PLAYER_ID_1,
                    boatId: MOCK_BOAT_ID,
                }),
            );
        });

        it('should move player to boat position when not on boat', () => {
            const session = createMockSession();
            const player = createMockPlayer({ id: MOCK_PLAYER_ID_1, x: MOCK_X, y: MOCK_Y });
            session.inGamePlayers[MOCK_PLAYER_ID_1] = player;
            const position: Position = { x: MOCK_X_2, y: MOCK_Y_2 };
            const boatObjectId = new Types.ObjectId();
            Object.defineProperty(boatObjectId, 'toString', {
                value: jest.fn().mockReturnValue(MOCK_BOAT_ID),
                writable: true,
            });
            const boat = createMockPlaceable({ kind: PlaceableKind.BOAT, x: MOCK_X_2, y: MOCK_Y_2, _id: boatObjectId });
            mockGameCache.getPlaceableAtPosition.mockReturnValue(boat);
            mockMovementService.calculateReachableTiles.mockReturnValue([]);

            service.boardBoat(session, MOCK_PLAYER_ID_1, position);

            expect(mockRepository.movePlayerPosition).toHaveBeenCalledWith(MOCK_SESSION_ID, MOCK_PLAYER_ID_1, MOCK_X_2, MOCK_Y_2, 0);
        });

        it('should throw NotFoundException when player not found', () => {
            const session = createMockSession();
            const position: Position = { x: MOCK_X, y: MOCK_Y };

            expect(() => service.boardBoat(session, 'non-existent', position)).toThrow(NotFoundException);
        });

        it('should throw BadRequestException when no actions remaining', () => {
            const session = createMockSession();
            const player = createMockPlayer({ id: MOCK_PLAYER_ID_1, actionsRemaining: 0 });
            session.inGamePlayers[MOCK_PLAYER_ID_1] = player;
            const position: Position = { x: MOCK_X, y: MOCK_Y };

            expect(() => service.boardBoat(session, MOCK_PLAYER_ID_1, position)).toThrow(BadRequestException);
        });

        it('should throw BadRequestException when player already on boat', () => {
            const session = createMockSession();
            const player = createMockPlayer({ id: MOCK_PLAYER_ID_1, onBoatId: MOCK_BOAT_ID });
            session.inGamePlayers[MOCK_PLAYER_ID_1] = player;
            const position: Position = { x: MOCK_X, y: MOCK_Y };

            expect(() => service.boardBoat(session, MOCK_PLAYER_ID_1, position)).toThrow(BadRequestException);
        });

        it('should throw NotFoundException when boat not found', () => {
            const session = createMockSession();
            const position: Position = { x: MOCK_X, y: MOCK_Y };
            mockGameCache.getPlaceableAtPosition.mockReturnValue(null);

            expect(() => service.boardBoat(session, MOCK_PLAYER_ID_1, position)).toThrow(NotFoundException);
        });
    });

    describe('disembarkBoat', () => {
        it('should disembark boat successfully', () => {
            const session = createMockSession();
            const player = createMockPlayer({ id: MOCK_PLAYER_ID_1, onBoatId: MOCK_BOAT_ID });
            session.inGamePlayers[MOCK_PLAYER_ID_1] = player;
            const position: Position = { x: MOCK_X, y: MOCK_Y };
            // eslint-disable-next-line @typescript-eslint/no-empty-function -- Intentionally empty function for test stub
            mockMovementService.disembarkBoat.mockImplementation(() => {});
            mockMovementService.calculateReachableTiles.mockReturnValue([]);

            service.disembarkBoat(session, MOCK_PLAYER_ID_1, position);

            expect(mockMovementService.disembarkBoat).toHaveBeenCalledWith(session, MOCK_PLAYER_ID_1, position);
            expect(mockEventEmitter.emit).toHaveBeenCalledWith(
                ServerEvents.PlayerDisembarkedBoat,
                expect.objectContaining({
                    session,
                    playerId: MOCK_PLAYER_ID_1,
                }),
            );
        });

        it('should throw NotFoundException when player not found', () => {
            const session = createMockSession();
            const position: Position = { x: MOCK_X, y: MOCK_Y };

            expect(() => service.disembarkBoat(session, 'non-existent', position)).toThrow(NotFoundException);
        });

        it('should throw BadRequestException when no actions remaining', () => {
            const session = createMockSession();
            const player = createMockPlayer({ id: MOCK_PLAYER_ID_1, actionsRemaining: 0 });
            session.inGamePlayers[MOCK_PLAYER_ID_1] = player;
            const position: Position = { x: MOCK_X, y: MOCK_Y };

            expect(() => service.disembarkBoat(session, MOCK_PLAYER_ID_1, position)).toThrow(BadRequestException);
        });

        it('should throw BadRequestException when player not on boat', () => {
            const session = createMockSession();
            const position: Position = { x: MOCK_X, y: MOCK_Y };

            expect(() => service.disembarkBoat(session, MOCK_PLAYER_ID_1, position)).toThrow(BadRequestException);
        });
    });

    describe('calculateAvailableActions', () => {
        it('should return empty array when player not found', () => {
            const session = createMockSession();

            const result = service.calculateAvailableActions(session, 'non-existent');

            expect(result).toEqual([]);
        });

        it('should return empty array when no actions remaining', () => {
            const session = createMockSession();
            const player = createMockPlayer({ id: MOCK_PLAYER_ID_1, actionsRemaining: 0 });
            session.inGamePlayers[MOCK_PLAYER_ID_1] = player;

            const result = service.calculateAvailableActions(session, MOCK_PLAYER_ID_1);

            expect(result).toEqual([]);
        });

        it('should calculate available actions', () => {
            const session = createMockSession();
            const nextPosition: Position = { x: MOCK_X_2, y: MOCK_Y_2 };
            mockGameCache.getNextPosition.mockReturnValue(nextPosition);
            mockGameCache.getTileOccupant.mockReturnValue(null);
            mockGameCache.getTileAtPosition.mockReturnValue(createMockTileWithPlayerId());
            mockGameCache.getPlaceableAtPosition.mockReturnValue(null);

            service.calculateAvailableActions(session, MOCK_PLAYER_ID_1);

            expect(mockEventEmitter.emit).toHaveBeenCalledWith(
                ServerEvents.PlayerAvailableActions,
                expect.objectContaining({
                    session,
                    playerId: MOCK_PLAYER_ID_1,
                    actions: expect.any(Array),
                }),
            );
        });
    });

    describe('addAttackAction', () => {
        it('should add attack action when valid opponent', () => {
            const session = createMockSession({ mode: GameMode.CLASSIC });
            const actions: AvailableAction[] = [];
            const position: Position = { x: MOCK_X, y: MOCK_Y };
            mockGameCache.getTileOccupant.mockReturnValue(MOCK_PLAYER_ID_2);

            service['addAttackAction'](actions, MOCK_PLAYER_ID_2, MOCK_PLAYER_ID_1, position, session);

            expect(actions).toContainEqual({ type: AvailableActionType.ATTACK, x: MOCK_X, y: MOCK_Y });
        });

        it('should not add attack action when same player', () => {
            const session = createMockSession();
            const actions: AvailableAction[] = [];
            const position: Position = { x: MOCK_X, y: MOCK_Y };

            service['addAttackAction'](actions, MOCK_PLAYER_ID_1, MOCK_PLAYER_ID_1, position, session);

            expect(actions).not.toContainEqual({ type: AvailableActionType.ATTACK, x: MOCK_X, y: MOCK_Y });
        });

        it('should not add attack action when CTF mode and same team', () => {
            const session = createMockSession({ mode: GameMode.CTF });
            const player1 = createMockPlayer({ id: MOCK_PLAYER_ID_1, teamNumber: MOCK_TEAM_NUMBER_1 });
            const player2 = createMockPlayer({ id: MOCK_PLAYER_ID_2, teamNumber: MOCK_TEAM_NUMBER_1 });
            session.inGamePlayers[MOCK_PLAYER_ID_1] = player1;
            session.inGamePlayers[MOCK_PLAYER_ID_2] = player2;
            const actions: AvailableAction[] = [];
            const position: Position = { x: MOCK_X, y: MOCK_Y };
            mockGameCache.getTileOccupant.mockReturnValue(MOCK_PLAYER_ID_2);

            service['addAttackAction'](actions, MOCK_PLAYER_ID_2, MOCK_PLAYER_ID_1, position, session);

            expect(actions).not.toContainEqual({ type: AvailableActionType.ATTACK, x: MOCK_X, y: MOCK_Y });
        });
    });

    describe('addTransferFlagAction', () => {
        it('should add transfer flag action when valid teammate', () => {
            const session = createMockSession({
                mode: GameMode.CTF,
                flagData: { holderPlayerId: MOCK_PLAYER_ID_1, position: { x: MOCK_X, y: MOCK_Y } },
            });
            const player1 = createMockPlayer({ id: MOCK_PLAYER_ID_1, teamNumber: MOCK_TEAM_NUMBER_1 });
            const player2 = createMockPlayer({ id: MOCK_PLAYER_ID_2, teamNumber: MOCK_TEAM_NUMBER_1 });
            session.inGamePlayers[MOCK_PLAYER_ID_1] = player1;
            session.inGamePlayers[MOCK_PLAYER_ID_2] = player2;
            const actions: AvailableAction[] = [];
            const position: Position = { x: MOCK_X, y: MOCK_Y };
            mockGameCache.getTileOccupant.mockReturnValue(MOCK_PLAYER_ID_2);

            service['addTransferFlagAction'](actions, MOCK_PLAYER_ID_2, MOCK_PLAYER_ID_1, position, session);

            expect(actions).toContainEqual({ type: AvailableActionType.TRANSFER_FLAG, x: MOCK_X, y: MOCK_Y });
        });

        it('should not add transfer flag action when not CTF mode', () => {
            const session = createMockSession({ mode: GameMode.CLASSIC });
            const actions: AvailableAction[] = [];
            const position: Position = { x: MOCK_X, y: MOCK_Y };

            service['addTransferFlagAction'](actions, MOCK_PLAYER_ID_2, MOCK_PLAYER_ID_1, position, session);

            expect(actions).not.toContainEqual({ type: AvailableActionType.TRANSFER_FLAG, x: MOCK_X, y: MOCK_Y });
        });

        it('should not add transfer flag action when player does not hold flag', () => {
            const session = createMockSession({
                mode: GameMode.CTF,
                flagData: { holderPlayerId: MOCK_PLAYER_ID_2, position: { x: MOCK_X, y: MOCK_Y } },
            });
            const actions: AvailableAction[] = [];
            const position: Position = { x: MOCK_X, y: MOCK_Y };

            service['addTransferFlagAction'](actions, MOCK_PLAYER_ID_2, MOCK_PLAYER_ID_1, position, session);

            expect(actions).not.toContainEqual({ type: AvailableActionType.TRANSFER_FLAG, x: MOCK_X, y: MOCK_Y });
        });
    });

    describe('addDoorAction', () => {
        it('should add door action when tile is door', () => {
            const actions: AvailableAction[] = [];
            const position: Position = { x: MOCK_X, y: MOCK_Y };
            const tile = createMockTile({ kind: TileKind.DOOR });

            service['addDoorAction'](actions, tile, position);

            expect(actions).toContainEqual({ type: AvailableActionType.DOOR, x: MOCK_X, y: MOCK_Y });
        });

        it('should not add door action when tile is not door', () => {
            const actions: AvailableAction[] = [];
            const position: Position = { x: MOCK_X, y: MOCK_Y };
            const tile = createMockTile({ kind: TileKind.BASE });

            service['addDoorAction'](actions, tile, position);

            expect(actions).not.toContainEqual({ type: AvailableActionType.DOOR, x: MOCK_X, y: MOCK_Y });
        });
    });

    describe('addPlaceableActions', () => {
        it('should add HEAL action', () => {
            const sessionId = MOCK_SESSION_ID;
            const actions: AvailableAction[] = [];
            const position: Position = { x: MOCK_X, y: MOCK_Y };
            const placeable = createMockPlaceable({ kind: PlaceableKind.HEAL });
            const positions: Position[] = [position];
            mockGameCache.getPlaceablePositions.mockReturnValue(positions);

            service['addPlaceableActions'](actions, placeable, position, sessionId);

            expect(actions).toContainEqual({ type: AvailableActionType.HEAL, x: MOCK_X, y: MOCK_Y });
        });

        it('should add FIGHT action', () => {
            const sessionId = MOCK_SESSION_ID;
            const actions: AvailableAction[] = [];
            const position: Position = { x: MOCK_X, y: MOCK_Y };
            const placeable = createMockPlaceable({ kind: PlaceableKind.FIGHT });
            const positions: Position[] = [position];
            mockGameCache.getPlaceablePositions.mockReturnValue(positions);

            service['addPlaceableActions'](actions, placeable, position, sessionId);

            expect(actions).toContainEqual({ type: AvailableActionType.FIGHT, x: MOCK_X, y: MOCK_Y });
        });

        it('should add BOAT action', () => {
            const sessionId = MOCK_SESSION_ID;
            const actions: AvailableAction[] = [];
            const position: Position = { x: MOCK_X, y: MOCK_Y };
            const placeable = createMockPlaceable({ kind: PlaceableKind.BOAT });

            service['addPlaceableActions'](actions, placeable, position, sessionId);

            expect(actions).toContainEqual({ type: AvailableActionType.BOAT, x: MOCK_X, y: MOCK_Y });
        });

        it('should not add action when placeable is null', () => {
            const sessionId = MOCK_SESSION_ID;
            const actions: AvailableAction[] = [];
            const position: Position = { x: MOCK_X, y: MOCK_Y };

            service['addPlaceableActions'](actions, null, position, sessionId);

            expect(actions).toEqual([]);
        });
    });

    describe('addDisembarkAction', () => {
        it('should add boat action when player can disembark on BASE tile', () => {
            const actions: AvailableAction[] = [];
            const position: Position = { x: MOCK_X, y: MOCK_Y };
            const player = createMockPlayer({ id: MOCK_PLAYER_ID_1, onBoatId: MOCK_BOAT_ID });
            const tile = createMockTile({ kind: TileKind.BASE });
            mockGameCache.getTileOccupant.mockReturnValue(null);

            service['addDisembarkAction'](actions, player, tile, null, position);

            expect(actions).toContainEqual({ type: AvailableActionType.BOAT, x: MOCK_X, y: MOCK_Y });
        });

        it('should add boat action when player can disembark on WATER tile', () => {
            const actions: AvailableAction[] = [];
            const position: Position = { x: MOCK_X, y: MOCK_Y };
            const player = createMockPlayer({ id: MOCK_PLAYER_ID_1, onBoatId: MOCK_BOAT_ID });
            const tile = createMockTile({ kind: TileKind.WATER });
            mockGameCache.getTileOccupant.mockReturnValue(null);

            service['addDisembarkAction'](actions, player, tile, null, position);

            expect(actions).toContainEqual({ type: AvailableActionType.BOAT, x: MOCK_X, y: MOCK_Y });
        });

        it('should add boat action when player can disembark on TELEPORT tile', () => {
            const actions: AvailableAction[] = [];
            const position: Position = { x: MOCK_X, y: MOCK_Y };
            const player = createMockPlayer({ id: MOCK_PLAYER_ID_1, onBoatId: MOCK_BOAT_ID });
            const tile = createMockTile({ kind: TileKind.TELEPORT });
            mockGameCache.getTileOccupant.mockReturnValue(null);

            service['addDisembarkAction'](actions, player, tile, null, position);

            expect(actions).toContainEqual({ type: AvailableActionType.BOAT, x: MOCK_X, y: MOCK_Y });
        });

        it('should add boat action when player can disembark on open DOOR tile', () => {
            const actions: AvailableAction[] = [];
            const position: Position = { x: MOCK_X, y: MOCK_Y };
            const player = createMockPlayer({ id: MOCK_PLAYER_ID_1, onBoatId: MOCK_BOAT_ID });
            const tile = createMockTile({ kind: TileKind.DOOR, open: true });
            mockGameCache.getTileOccupant.mockReturnValue(null);

            service['addDisembarkAction'](actions, player, tile, null, position);

            expect(actions).toContainEqual({ type: AvailableActionType.BOAT, x: MOCK_X, y: MOCK_Y });
        });

        it('should not add boat action when player not on boat', () => {
            const actions: AvailableAction[] = [];
            const position: Position = { x: MOCK_X, y: MOCK_Y };
            const player = createMockPlayer({ id: MOCK_PLAYER_ID_1 });
            const tile = createMockTile({ kind: TileKind.BASE });

            service['addDisembarkAction'](actions, player, tile, null, position);

            expect(actions).not.toContainEqual({ type: AvailableActionType.BOAT, x: MOCK_X, y: MOCK_Y });
        });

        it('should not add boat action when tile has occupant', () => {
            const actions: AvailableAction[] = [];
            const position: Position = { x: MOCK_X, y: MOCK_Y };
            const player = createMockPlayer({ id: MOCK_PLAYER_ID_1, onBoatId: MOCK_BOAT_ID });
            const tile = createMockTile({ kind: TileKind.BASE });
            mockGameCache.getTileOccupant.mockReturnValue(MOCK_PLAYER_ID_2);

            service['addDisembarkAction'](actions, player, tile, MOCK_PLAYER_ID_2, position);

            expect(actions).not.toContainEqual({ type: AvailableActionType.BOAT, x: MOCK_X, y: MOCK_Y });
        });
    });

    describe('movePlayer', () => {
        it('should call movementService.movePlayer', () => {
            const session = createMockSession();
            mockMovementService.movePlayer.mockReturnValue(MOCK_SPEED);

            const result = service.movePlayer(session, MOCK_PLAYER_ID_1, Orientation.N);

            expect(mockMovementService.movePlayer).toHaveBeenCalledWith(session, MOCK_PLAYER_ID_1, Orientation.N);
            expect(result).toBe(MOCK_SPEED);
        });
    });

    describe('calculateReachableTiles', () => {
        it('should call movementService.calculateReachableTiles', () => {
            const session = createMockSession();
            const reachableTiles: ReachableTile[] = [];
            mockMovementService.calculateReachableTiles.mockReturnValue(reachableTiles);

            const result = service.calculateReachableTiles(session, MOCK_PLAYER_ID_1);

            expect(mockMovementService.calculateReachableTiles).toHaveBeenCalledWith(session, MOCK_PLAYER_ID_1);
            expect(result).toBe(reachableTiles);
        });
    });

    describe('fetchAndCacheGame', () => {
        it('should call gameCache.fetchAndCacheGame', async () => {
            const game = {} as never;
            mockGameCache.fetchAndCacheGame.mockResolvedValue(game);

            const result = await service.fetchAndCacheGame(MOCK_SESSION_ID, 'game-123');

            expect(mockGameCache.fetchAndCacheGame).toHaveBeenCalledWith(MOCK_SESSION_ID, 'game-123');
            expect(result).toBe(game);
        });
    });

    describe('getInitialFlagData', () => {
        it('should call gameCache.getInitialFlagData', () => {
            const flagData: FlagData = { holderPlayerId: null, position: { x: MOCK_X, y: MOCK_Y } };
            mockGameCache.getInitialFlagData.mockReturnValue(flagData);

            const result = service.getInitialFlagData(MOCK_SESSION_ID);

            expect(mockGameCache.getInitialFlagData).toHaveBeenCalledWith(MOCK_SESSION_ID);
            expect(result).toBe(flagData);
        });
    });

    describe('isTileFree', () => {
        it('should call gameCache.isTileFree', () => {
            const position: Position = { x: MOCK_X, y: MOCK_Y };
            mockGameCache.isTileFree.mockReturnValue(true);

            const result = service.isTileFree(MOCK_SESSION_ID, position);

            expect(mockGameCache.isTileFree).toHaveBeenCalledWith(MOCK_SESSION_ID, position);
            expect(result).toBe(true);
        });
    });

    describe('clearSessionGameCache', () => {
        it('should call gameCache.clearSessionGameCache', () => {
            service.clearSessionGameCache(MOCK_SESSION_ID);

            expect(mockGameCache.clearSessionGameCache).toHaveBeenCalledWith(MOCK_SESSION_ID);
        });
    });

    describe('clearActiveCombatForSession', () => {
        it('should call combatService.clearActiveCombatForSession', () => {
            service.clearActiveCombatForSession(MOCK_SESSION_ID);

            expect(mockCombatService.clearActiveCombatForSession).toHaveBeenCalledWith(MOCK_SESSION_ID);
        });
    });

    describe('selectCombatPosture', () => {
        it('should call combatService.combatChoice', () => {
            service.selectCombatPosture(MOCK_SESSION_ID, MOCK_PLAYER_ID_1, CombatPosture.OFFENSIVE);

            expect(mockCombatService.combatChoice).toHaveBeenCalledWith(MOCK_SESSION_ID, MOCK_PLAYER_ID_1, CombatPosture.OFFENSIVE);
        });
    });

    describe('getActiveCombat', () => {
        it('should call combatService.getActiveCombat', () => {
            const activeCombat = { playerAId: MOCK_PLAYER_ID_1, playerBId: MOCK_PLAYER_ID_2 };
            mockCombatService.getActiveCombat.mockReturnValue(activeCombat);

            const result = service.getActiveCombat(MOCK_SESSION_ID);

            expect(mockCombatService.getActiveCombat).toHaveBeenCalledWith(MOCK_SESSION_ID);
            expect(result).toBe(activeCombat);
        });
    });

    describe('calculateDirectionToTarget', () => {
        it('should return E when dx > dy and dx > 0', () => {
            const current: Position = { x: MOCK_X, y: MOCK_Y };
            const target: Position = { x: MOCK_X_2, y: MOCK_Y };

            const result = service.calculateDirectionToTarget(current, target);

            expect(result).toBe(Orientation.E);
        });

        it('should return W when dx > dy and dx < 0', () => {
            const current: Position = { x: MOCK_X_2, y: MOCK_Y };
            const target: Position = { x: MOCK_X, y: MOCK_Y };

            const result = service.calculateDirectionToTarget(current, target);

            expect(result).toBe(Orientation.W);
        });

        it('should return S when dy > dx and dy > 0', () => {
            const current: Position = { x: MOCK_X, y: MOCK_Y };
            const target: Position = { x: MOCK_X, y: MOCK_Y_2 };

            const result = service.calculateDirectionToTarget(current, target);

            expect(result).toBe(Orientation.S);
        });

        it('should return N when dy > dx and dy < 0', () => {
            const current: Position = { x: MOCK_X, y: MOCK_Y_2 };
            const target: Position = { x: MOCK_X, y: MOCK_Y };

            const result = service.calculateDirectionToTarget(current, target);

            expect(result).toBe(Orientation.N);
        });
    });

    describe('attackPlayer', () => {
        it('should call combatService.attackPlayerAction', () => {
            const targetPosition: Position = { x: MOCK_X, y: MOCK_Y };

            service.attackPlayer(MOCK_SESSION_ID, MOCK_PLAYER_ID_1, targetPosition);

            expect(mockCombatService.attackPlayerAction).toHaveBeenCalledWith(MOCK_SESSION_ID, MOCK_PLAYER_ID_1, targetPosition);
        });
    });
});
