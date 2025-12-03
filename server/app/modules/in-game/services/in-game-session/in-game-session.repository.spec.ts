/* eslint-disable max-lines -- Test file with comprehensive test coverage */
import { ServerEvents } from '@app/enums/server-events.enum';
import { Placeable } from '@app/modules/game-store/entities/placeable.entity';
import { GameCacheService } from '@app/modules/in-game/services/game-cache/game-cache.service';
import { BOAT_SPEED_BONUS } from '@common/constants/game.constants';
import { GameMode } from '@common/enums/game-mode.enum';
import { MapSize } from '@common/enums/map-size.enum';
import { PlaceableKind } from '@common/enums/placeable-kind.enum';
import { VirtualPlayerType } from '@common/enums/virtual-player-type.enum';
import { Player } from '@common/interfaces/player.interface';
import { Position } from '@common/interfaces/position.interface';
import { InGameSession } from '@common/interfaces/session.interface';
import { StartPoint } from '@common/interfaces/start-point.interface';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Test, TestingModule } from '@nestjs/testing';
import { Types } from 'mongoose';
import { InGameSessionRepository } from './in-game-session.repository';

describe('InGameSessionRepository', () => {
    let repository: InGameSessionRepository;
    let eventEmitter: jest.Mocked<EventEmitter2>;
    let gameCache: jest.Mocked<GameCacheService>;

    const SESSION_ID = 'session-123';
    const PLAYER_ID_1 = 'player-1';
    const PLAYER_ID_2 = 'player-2';
    const START_POINT_ID = 'start-point-123';
    const POSITION_X = 5;
    const POSITION_Y = 10;
    const NEW_X = 7;
    const NEW_Y = 12;
    const HEALTH = 100;
    const MAX_HEALTH = 100;
    const HEALTH_DAMAGE = 20;
    const HEALTH_HEAL = 15;
    const SPEED = 3;
    const BOAT_SPEED = 2;
    const COST = 1;
    const ATTACK_BONUS = 5;
    const DEFENSE_BONUS = 3;
    const BONUS_VALUE_1 = 1;
    const BONUS_VALUE_2 = 2;
    const TEAM_1 = 1;
    const TEAM_2 = 2;
    const ZERO = 0;
    const ONE = 1;
    const TWO = 2;
    const FOUR = 4;

    const createMockPosition = (overrides: Partial<Position> = {}): Position => ({
        x: POSITION_X,
        y: POSITION_Y,
        ...overrides,
    });

    const createMockPlayer = (overrides: Partial<Player> = {}): Player => ({
        id: PLAYER_ID_1,
        name: 'Test Player',
        avatar: null,
        isAdmin: false,
        baseHealth: HEALTH,
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
        playerId: PLAYER_ID_1,
        x: POSITION_X,
        y: POSITION_Y,
        ...overrides,
    });

    const createMockSession = (overrides: Partial<InGameSession> = {}): InGameSession => ({
        id: SESSION_ID,
        inGameId: 'in-game-123',
        gameId: 'game-123',
        chatId: 'chat-123',
        maxPlayers: FOUR,
        mode: GameMode.CLASSIC,
        isGameStarted: true,
        inGamePlayers: {
            [PLAYER_ID_1]: createMockPlayer({ id: PLAYER_ID_1 }),
        },
        teams: {
            [TEAM_1]: { number: TEAM_1, playerIds: [PLAYER_ID_1] },
            [TEAM_2]: { number: TEAM_2, playerIds: [] },
        },
        currentTurn: { turnNumber: ONE, activePlayerId: PLAYER_ID_1, hasUsedAction: false },
        startPoints: [createMockStartPoint()],
        mapSize: MapSize.MEDIUM,
        turnOrder: [PLAYER_ID_1],
        playerCount: ONE,
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

    beforeEach(async () => {
        const mockEventEmitter = {
            emit: jest.fn(),
        };

        const mockGameCache = {
            hidePlaceable: jest.fn(),
            showPlaceable: jest.fn(),
            getFlagPlaceable: jest.fn(),
            clearTileOccupant: jest.fn(),
            reenablePlaceablesForPlayer: jest.fn(),
            moveTileOccupant: jest.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                InGameSessionRepository,
                {
                    provide: EventEmitter2,
                    useValue: mockEventEmitter,
                },
                {
                    provide: GameCacheService,
                    useValue: mockGameCache,
                },
            ],
        }).compile();

        repository = module.get<InGameSessionRepository>(InGameSessionRepository);
        eventEmitter = module.get(EventEmitter2);
        gameCache = module.get(GameCacheService);
    });

    describe('isVirtualPlayer', () => {
        it('should return true when player has virtualPlayerType', () => {
            const session = createMockSession({
                inGamePlayers: {
                    [PLAYER_ID_1]: createMockPlayer({ id: PLAYER_ID_1, virtualPlayerType: VirtualPlayerType.Offensive }),
                },
            });
            repository.save(session);

            const result = repository.isVirtualPlayer(SESSION_ID, PLAYER_ID_1);

            expect(result).toBe(true);
        });

        it('should return false when player has no virtualPlayerType', () => {
            const session = createMockSession();
            repository.save(session);

            const result = repository.isVirtualPlayer(SESSION_ID, PLAYER_ID_1);

            expect(result).toBe(false);
        });

        it('should throw NotFoundException when session not found', () => {
            expect(() => repository.isVirtualPlayer('non-existent', PLAYER_ID_1)).toThrow(NotFoundException);
        });
    });

    describe('pickUpFlag', () => {
        it('should pick up flag successfully', () => {
            const session = createMockSession({
                flagData: { position: createMockPosition(), holderPlayerId: null },
            });
            const mockPlaceable = createMockPlaceable();
            gameCache.getFlagPlaceable.mockReturnValue(mockPlaceable);

            repository.pickUpFlag(session, PLAYER_ID_1);

            expect(session.flagData?.holderPlayerId).toBe(PLAYER_ID_1);
            expect(gameCache.hidePlaceable).toHaveBeenCalledWith(session.id, mockPlaceable);
            expect(eventEmitter.emit).toHaveBeenCalledWith(ServerEvents.FlagPickedUp, { session, playerId: PLAYER_ID_1 });
        });

        it('should throw NotFoundException when flagData is missing', () => {
            const session = createMockSession();

            expect(() => repository.pickUpFlag(session, PLAYER_ID_1)).toThrow(NotFoundException);
        });

        it('should throw BadRequestException when flag already picked up', () => {
            const session = createMockSession({
                flagData: { position: createMockPosition(), holderPlayerId: PLAYER_ID_2 },
            });

            expect(() => repository.pickUpFlag(session, PLAYER_ID_1)).toThrow(BadRequestException);
        });

        it('should throw NotFoundException when player not found', () => {
            const session = createMockSession({
                flagData: { position: createMockPosition(), holderPlayerId: null },
                inGamePlayers: {},
            });

            expect(() => repository.pickUpFlag(session, PLAYER_ID_1)).toThrow(NotFoundException);
        });
    });

    describe('updateFlagPosition', () => {
        it('should update flag position successfully', () => {
            const session = createMockSession({
                flagData: { position: createMockPosition(), holderPlayerId: PLAYER_ID_1 },
            });
            const newPosition = createMockPosition({ x: NEW_X, y: NEW_Y });

            repository.updateFlagPosition(session, PLAYER_ID_1, newPosition);

            expect(session.flagData?.position).toEqual(newPosition);
        });

        it('should throw NotFoundException when flagData is missing', () => {
            const session = createMockSession();

            expect(() => repository.updateFlagPosition(session, PLAYER_ID_1, createMockPosition())).toThrow(NotFoundException);
        });

        it('should throw BadRequestException when player does not hold flag', () => {
            const session = createMockSession({
                flagData: { position: createMockPosition(), holderPlayerId: PLAYER_ID_2 },
            });

            expect(() => repository.updateFlagPosition(session, PLAYER_ID_1, createMockPosition())).toThrow(BadRequestException);
        });
    });

    describe('transferFlag', () => {
        it('should transfer flag successfully', () => {
            const session = createMockSession({
                flagData: { position: createMockPosition(), holderPlayerId: PLAYER_ID_1 },
                inGamePlayers: {
                    [PLAYER_ID_1]: createMockPlayer({ id: PLAYER_ID_1 }),
                    [PLAYER_ID_2]: createMockPlayer({ id: PLAYER_ID_2, x: NEW_X, y: NEW_Y }),
                },
            });

            repository.transferFlag(session, PLAYER_ID_1, PLAYER_ID_2);

            expect(session.flagData?.holderPlayerId).toBe(PLAYER_ID_2);
            expect(session.flagData?.position).toEqual({ x: NEW_X, y: NEW_Y });
            expect(eventEmitter.emit).toHaveBeenCalledWith(ServerEvents.FlagTransferred, {
                session,
                fromPlayerId: PLAYER_ID_1,
                toPlayerId: PLAYER_ID_2,
            });
        });

        it('should throw NotFoundException when flagData is missing', () => {
            const session = createMockSession();

            expect(() => repository.transferFlag(session, PLAYER_ID_1, PLAYER_ID_2)).toThrow(NotFoundException);
        });

        it('should throw BadRequestException when player does not hold flag', () => {
            const session = createMockSession({
                flagData: { position: createMockPosition(), holderPlayerId: PLAYER_ID_2 },
            });

            expect(() => repository.transferFlag(session, PLAYER_ID_1, PLAYER_ID_2)).toThrow(BadRequestException);
        });

        it('should throw NotFoundException when fromPlayer not found', () => {
            const session = createMockSession({
                flagData: { position: createMockPosition(), holderPlayerId: PLAYER_ID_1 },
                inGamePlayers: {
                    [PLAYER_ID_2]: createMockPlayer({ id: PLAYER_ID_2 }),
                },
            });

            expect(() => repository.transferFlag(session, PLAYER_ID_1, PLAYER_ID_2)).toThrow(NotFoundException);
        });

        it('should throw NotFoundException when toPlayer not found', () => {
            const session = createMockSession({
                flagData: { position: createMockPosition(), holderPlayerId: PLAYER_ID_1 },
            });

            expect(() => repository.transferFlag(session, PLAYER_ID_1, PLAYER_ID_2)).toThrow(NotFoundException);
        });
    });

    describe('playerHasFlag', () => {
        it('should return true when player has flag', () => {
            const session = createMockSession({
                flagData: { position: createMockPosition(), holderPlayerId: PLAYER_ID_1 },
            });
            repository.save(session);

            const result = repository.playerHasFlag(SESSION_ID, PLAYER_ID_1);

            expect(result).toBe(true);
        });

        it('should return false when player does not have flag', () => {
            const session = createMockSession({
                flagData: { position: createMockPosition(), holderPlayerId: PLAYER_ID_2 },
            });
            repository.save(session);

            const result = repository.playerHasFlag(SESSION_ID, PLAYER_ID_1);

            expect(result).toBe(false);
        });

        it('should return false when flagData is missing', () => {
            const session = createMockSession();
            repository.save(session);

            const result = repository.playerHasFlag(SESSION_ID, PLAYER_ID_1);

            expect(result).toBe(false);
        });
    });

    describe('dropFlag', () => {
        it('should drop flag successfully', () => {
            const session = createMockSession({
                flagData: { position: createMockPosition(), holderPlayerId: PLAYER_ID_1 },
            });
            repository.save(session);
            const flagPlaceable = createMockPlaceable();
            gameCache.getFlagPlaceable.mockReturnValue(flagPlaceable);

            repository.dropFlag(SESSION_ID, PLAYER_ID_1);

            expect(session.flagData?.holderPlayerId).toBeNull();
            expect(flagPlaceable.x).toBe(POSITION_X);
            expect(flagPlaceable.y).toBe(POSITION_Y);
            expect(gameCache.showPlaceable).toHaveBeenCalledWith(SESSION_ID, createMockPosition());
            expect(eventEmitter.emit).toHaveBeenCalledWith(ServerEvents.SessionUpdated, { session });
        });

        it('should throw NotFoundException when session not found', () => {
            expect(() => repository.dropFlag('non-existent', PLAYER_ID_1)).toThrow(NotFoundException);
        });

        it('should throw NotFoundException when flagData is missing', () => {
            const session = createMockSession();
            repository.save(session);

            expect(() => repository.dropFlag(SESSION_ID, PLAYER_ID_1)).toThrow(NotFoundException);
        });

        it('should throw BadRequestException when player does not hold flag', () => {
            const session = createMockSession({
                flagData: { position: createMockPosition(), holderPlayerId: PLAYER_ID_2 },
            });
            repository.save(session);

            expect(() => repository.dropFlag(SESSION_ID, PLAYER_ID_1)).toThrow(BadRequestException);
        });

        it('should throw NotFoundException when flag placeable not found', () => {
            const session = createMockSession({
                flagData: { position: createMockPosition(), holderPlayerId: PLAYER_ID_1 },
            });
            repository.save(session);
            gameCache.getFlagPlaceable.mockReturnValue(null);

            expect(() => repository.dropFlag(SESSION_ID, PLAYER_ID_1)).toThrow(NotFoundException);
        });
    });

    describe('updatePlayer', () => {
        it('should update player successfully', () => {
            const session = createMockSession();
            repository.save(session);
            const updates = { health: HEALTH - HEALTH_DAMAGE };

            repository.updatePlayer(SESSION_ID, PLAYER_ID_1, updates);

            expect(session.inGamePlayers[PLAYER_ID_1].health).toBe(HEALTH - HEALTH_DAMAGE);
            expect(eventEmitter.emit).toHaveBeenCalledWith(ServerEvents.PlayerUpdated, {
                sessionId: SESSION_ID,
                player: session.inGamePlayers[PLAYER_ID_1],
            });
        });

        it('should throw NotFoundException when session not found', () => {
            expect(() => repository.updatePlayer('non-existent', PLAYER_ID_1, {})).toThrow(NotFoundException);
        });

        it('should throw NotFoundException when player not found', () => {
            const session = createMockSession();
            repository.save(session);

            expect(() => repository.updatePlayer(SESSION_ID, 'non-existent', {})).toThrow(NotFoundException);
        });
    });

    describe('decreasePlayerHealth', () => {
        it('should decrease player health', () => {
            const session = createMockSession();
            repository.save(session);

            const result = repository.decreasePlayerHealth(SESSION_ID, PLAYER_ID_1, HEALTH_DAMAGE);

            expect(result).toBe(HEALTH - HEALTH_DAMAGE);
            expect(session.inGamePlayers[PLAYER_ID_1].health).toBe(HEALTH - HEALTH_DAMAGE);
        });

        it('should set health to zero when damage exceeds health', () => {
            const session = createMockSession();
            repository.save(session);

            const result = repository.decreasePlayerHealth(SESSION_ID, PLAYER_ID_1, HEALTH + ONE);

            expect(result).toBe(ZERO);
            expect(session.inGamePlayers[PLAYER_ID_1].health).toBe(ZERO);
        });

        it('should throw NotFoundException when session not found', () => {
            expect(() => repository.decreasePlayerHealth('non-existent', PLAYER_ID_1, HEALTH_DAMAGE)).toThrow(NotFoundException);
        });

        it('should throw NotFoundException when player not found', () => {
            const session = createMockSession();
            repository.save(session);

            expect(() => repository.decreasePlayerHealth(SESSION_ID, 'non-existent', HEALTH_DAMAGE)).toThrow(NotFoundException);
        });
    });

    describe('increasePlayerHealth', () => {
        it('should increase player health', () => {
            const session = createMockSession({
                inGamePlayers: {
                    [PLAYER_ID_1]: createMockPlayer({ id: PLAYER_ID_1, health: HEALTH - HEALTH_HEAL }),
                },
            });
            repository.save(session);

            repository.increasePlayerHealth(SESSION_ID, PLAYER_ID_1, HEALTH_HEAL);

            expect(session.inGamePlayers[PLAYER_ID_1].health).toBe(HEALTH);
            expect(eventEmitter.emit).toHaveBeenCalledWith(ServerEvents.PlayerHealthChanged, {
                sessionId: SESSION_ID,
                playerId: PLAYER_ID_1,
                newHealth: HEALTH,
            });
        });

        it('should cap health at maxHealth', () => {
            const session = createMockSession();
            repository.save(session);

            repository.increasePlayerHealth(SESSION_ID, PLAYER_ID_1, HEALTH_HEAL);

            expect(session.inGamePlayers[PLAYER_ID_1].health).toBe(MAX_HEALTH);
        });

        it('should throw NotFoundException when session not found', () => {
            expect(() => repository.increasePlayerHealth('non-existent', PLAYER_ID_1, HEALTH_HEAL)).toThrow(NotFoundException);
        });

        it('should throw NotFoundException when player not found', () => {
            const session = createMockSession();
            repository.save(session);

            expect(() => repository.increasePlayerHealth(SESSION_ID, 'non-existent', HEALTH_HEAL)).toThrow(NotFoundException);
        });
    });

    describe('resetPlayerHealth', () => {
        it('should reset player health to maxHealth', () => {
            const session = createMockSession({
                inGamePlayers: {
                    [PLAYER_ID_1]: createMockPlayer({ id: PLAYER_ID_1, health: HEALTH - HEALTH_DAMAGE }),
                },
            });
            repository.save(session);

            repository.resetPlayerHealth(SESSION_ID, PLAYER_ID_1);

            expect(session.inGamePlayers[PLAYER_ID_1].health).toBe(MAX_HEALTH);
            expect(eventEmitter.emit).toHaveBeenCalledWith(ServerEvents.PlayerHealthChanged, {
                sessionId: SESSION_ID,
                playerId: PLAYER_ID_1,
                newHealth: MAX_HEALTH,
            });
        });

        it('should throw NotFoundException when session not found', () => {
            expect(() => repository.resetPlayerHealth('non-existent', PLAYER_ID_1)).toThrow(NotFoundException);
        });

        it('should throw NotFoundException when player not found', () => {
            const session = createMockSession();
            repository.save(session);

            expect(() => repository.resetPlayerHealth(SESSION_ID, 'non-existent')).toThrow(NotFoundException);
        });
    });

    describe('applyPlayerBonus', () => {
        it('should apply bonus value 1', () => {
            const session = createMockSession();
            repository.save(session);

            repository.applyPlayerBonus(SESSION_ID, PLAYER_ID_1, BONUS_VALUE_1);

            expect(session.inGamePlayers[PLAYER_ID_1].attackBonus).toBe(BONUS_VALUE_1);
            expect(session.inGamePlayers[PLAYER_ID_1].defenseBonus).toBe(BONUS_VALUE_1);
            expect(eventEmitter.emit).toHaveBeenCalledWith(ServerEvents.PlayerBonusesChanged, {
                sessionId: SESSION_ID,
                playerId: PLAYER_ID_1,
                attackBonus: BONUS_VALUE_1,
                defenseBonus: BONUS_VALUE_1,
            });
        });

        it('should apply bonus value 2', () => {
            const session = createMockSession();
            repository.save(session);

            repository.applyPlayerBonus(SESSION_ID, PLAYER_ID_1, BONUS_VALUE_2);

            expect(session.inGamePlayers[PLAYER_ID_1].attackBonus).toBe(BONUS_VALUE_2);
            expect(session.inGamePlayers[PLAYER_ID_1].defenseBonus).toBe(BONUS_VALUE_2);
        });

        it('should add to existing bonuses', () => {
            const session = createMockSession({
                inGamePlayers: {
                    [PLAYER_ID_1]: createMockPlayer({ id: PLAYER_ID_1, attackBonus: BONUS_VALUE_1, defenseBonus: BONUS_VALUE_1 }),
                },
            });
            repository.save(session);

            repository.applyPlayerBonus(SESSION_ID, PLAYER_ID_1, BONUS_VALUE_1);

            expect(session.inGamePlayers[PLAYER_ID_1].attackBonus).toBe(BONUS_VALUE_1 + BONUS_VALUE_1);
            expect(session.inGamePlayers[PLAYER_ID_1].defenseBonus).toBe(BONUS_VALUE_1 + BONUS_VALUE_1);
        });

        it('should throw NotFoundException when session not found', () => {
            expect(() => repository.applyPlayerBonus('non-existent', PLAYER_ID_1, BONUS_VALUE_1)).toThrow(NotFoundException);
        });

        it('should throw NotFoundException when player not found', () => {
            const session = createMockSession();
            repository.save(session);

            expect(() => repository.applyPlayerBonus(SESSION_ID, 'non-existent', BONUS_VALUE_1)).toThrow(NotFoundException);
        });
    });

    describe('applyPlayerBoatSpeedBonus', () => {
        it('should apply boat speed bonus', () => {
            const session = createMockSession();
            repository.save(session);

            repository.applyPlayerBoatSpeedBonus(SESSION_ID, PLAYER_ID_1);

            expect(session.inGamePlayers[PLAYER_ID_1].boatSpeedBonus).toBe(BOAT_SPEED_BONUS);
            expect(session.inGamePlayers[PLAYER_ID_1].boatSpeed).toBe(BOAT_SPEED_BONUS);
        });

        it('should throw NotFoundException when session not found', () => {
            expect(() => repository.applyPlayerBoatSpeedBonus('non-existent', PLAYER_ID_1)).toThrow(NotFoundException);
        });

        it('should throw NotFoundException when player not found', () => {
            const session = createMockSession();
            repository.save(session);

            expect(() => repository.applyPlayerBoatSpeedBonus(SESSION_ID, 'non-existent')).toThrow(NotFoundException);
        });
    });

    describe('resetPlayerBoatSpeedBonus', () => {
        it('should reset boat speed bonus to zero', () => {
            const session = createMockSession({
                inGamePlayers: {
                    [PLAYER_ID_1]: createMockPlayer({ id: PLAYER_ID_1, boatSpeedBonus: BOAT_SPEED_BONUS, boatSpeed: BOAT_SPEED_BONUS }),
                },
            });
            repository.save(session);

            repository.resetPlayerBoatSpeedBonus(SESSION_ID, PLAYER_ID_1);

            expect(session.inGamePlayers[PLAYER_ID_1].boatSpeedBonus).toBe(ZERO);
            expect(session.inGamePlayers[PLAYER_ID_1].boatSpeed).toBe(ZERO);
        });

        it('should throw NotFoundException when session not found', () => {
            expect(() => repository.resetPlayerBoatSpeedBonus('non-existent', PLAYER_ID_1)).toThrow(NotFoundException);
        });

        it('should throw NotFoundException when player not found', () => {
            const session = createMockSession();
            repository.save(session);

            expect(() => repository.resetPlayerBoatSpeedBonus(SESSION_ID, 'non-existent')).toThrow(NotFoundException);
        });
    });

    describe('resetPlayerBonuses', () => {
        it('should reset player bonuses', () => {
            const session = createMockSession({
                inGamePlayers: {
                    [PLAYER_ID_1]: createMockPlayer({
                        id: PLAYER_ID_1,
                        attackBonus: ATTACK_BONUS,
                        defenseBonus: DEFENSE_BONUS,
                        hasCombatBonus: true,
                    }),
                },
            });
            repository.save(session);

            repository.resetPlayerBonuses(SESSION_ID, PLAYER_ID_1);

            expect(session.inGamePlayers[PLAYER_ID_1].attackBonus).toBe(ZERO);
            expect(session.inGamePlayers[PLAYER_ID_1].defenseBonus).toBe(ZERO);
            expect(session.inGamePlayers[PLAYER_ID_1].hasCombatBonus).toBe(false);
            expect(eventEmitter.emit).toHaveBeenCalledWith(ServerEvents.PlayerBonusesChanged, {
                sessionId: SESSION_ID,
                playerId: PLAYER_ID_1,
                attackBonus: ZERO,
                defenseBonus: ZERO,
            });
        });

        it('should throw NotFoundException when session not found', () => {
            expect(() => repository.resetPlayerBonuses('non-existent', PLAYER_ID_1)).toThrow(NotFoundException);
        });

        it('should throw NotFoundException when player not found', () => {
            const session = createMockSession();
            repository.save(session);

            expect(() => repository.resetPlayerBonuses(SESSION_ID, 'non-existent')).toThrow(NotFoundException);
        });
    });

    describe('incrementPlayerCombatCount', () => {
        it('should increment combat count', () => {
            const session = createMockSession();
            repository.save(session);

            repository.incrementPlayerCombatCount(SESSION_ID, PLAYER_ID_1);

            expect(session.inGamePlayers[PLAYER_ID_1].combatCount).toBe(ONE);
            expect(eventEmitter.emit).toHaveBeenCalledWith(ServerEvents.PlayerCombatCountChanged, {
                sessionId: SESSION_ID,
                playerId: PLAYER_ID_1,
                combatCount: ONE,
            });
        });

        it('should throw NotFoundException when session not found', () => {
            expect(() => repository.incrementPlayerCombatCount('non-existent', PLAYER_ID_1)).toThrow(NotFoundException);
        });

        it('should throw NotFoundException when player not found', () => {
            const session = createMockSession();
            repository.save(session);

            expect(() => repository.incrementPlayerCombatCount(SESSION_ID, 'non-existent')).toThrow(NotFoundException);
        });
    });

    describe('incrementPlayerCombatWins', () => {
        it('should increment combat wins', () => {
            const session = createMockSession();
            repository.save(session);

            repository.incrementPlayerCombatWins(SESSION_ID, PLAYER_ID_1);

            expect(session.inGamePlayers[PLAYER_ID_1].combatWins).toBe(ONE);
            expect(eventEmitter.emit).toHaveBeenCalledWith(ServerEvents.PlayerCombatWinsChanged, {
                sessionId: SESSION_ID,
                playerId: PLAYER_ID_1,
                combatWins: ONE,
            });
        });

        it('should throw NotFoundException when session not found', () => {
            expect(() => repository.incrementPlayerCombatWins('non-existent', PLAYER_ID_1)).toThrow(NotFoundException);
        });

        it('should throw NotFoundException when player not found', () => {
            const session = createMockSession();
            repository.save(session);

            expect(() => repository.incrementPlayerCombatWins(SESSION_ID, 'non-existent')).toThrow(NotFoundException);
        });
    });

    describe('incrementPlayerCombatLosses', () => {
        it('should increment combat losses', () => {
            const session = createMockSession();
            repository.save(session);

            repository.incrementPlayerCombatLosses(SESSION_ID, PLAYER_ID_1);

            expect(session.inGamePlayers[PLAYER_ID_1].combatLosses).toBe(ONE);
            expect(eventEmitter.emit).toHaveBeenCalledWith(ServerEvents.PlayerCombatLossesChanged, {
                sessionId: SESSION_ID,
                playerId: PLAYER_ID_1,
                combatLosses: ONE,
            });
        });

        it('should throw NotFoundException when session not found', () => {
            expect(() => repository.incrementPlayerCombatLosses('non-existent', PLAYER_ID_1)).toThrow(NotFoundException);
        });

        it('should throw NotFoundException when player not found', () => {
            const session = createMockSession();
            repository.save(session);

            expect(() => repository.incrementPlayerCombatLosses(SESSION_ID, 'non-existent')).toThrow(NotFoundException);
        });
    });

    describe('incrementPlayerCombatDraws', () => {
        it('should increment combat draws', () => {
            const session = createMockSession();
            repository.save(session);

            repository.incrementPlayerCombatDraws(SESSION_ID, PLAYER_ID_1);

            expect(session.inGamePlayers[PLAYER_ID_1].combatDraws).toBe(ONE);
            expect(eventEmitter.emit).toHaveBeenCalledWith(ServerEvents.PlayerCombatDrawsChanged, {
                sessionId: SESSION_ID,
                playerId: PLAYER_ID_1,
                combatDraws: ONE,
            });
        });

        it('should throw NotFoundException when session not found', () => {
            expect(() => repository.incrementPlayerCombatDraws('non-existent', PLAYER_ID_1)).toThrow(NotFoundException);
        });

        it('should throw NotFoundException when player not found', () => {
            const session = createMockSession();
            repository.save(session);

            expect(() => repository.incrementPlayerCombatDraws(SESSION_ID, 'non-existent')).toThrow(NotFoundException);
        });
    });

    describe('inGamePlayersCount', () => {
        it('should return count of in-game players', () => {
            const session = createMockSession({
                inGamePlayers: {
                    [PLAYER_ID_1]: createMockPlayer({ id: PLAYER_ID_1, isInGame: true }),
                    [PLAYER_ID_2]: createMockPlayer({ id: PLAYER_ID_2, isInGame: true }),
                },
            });
            repository.save(session);

            const result = repository.inGamePlayersCount(SESSION_ID);

            expect(result).toBe(TWO);
        });

        it('should exclude players not in game', () => {
            const session = createMockSession({
                inGamePlayers: {
                    [PLAYER_ID_1]: createMockPlayer({ id: PLAYER_ID_1, isInGame: true }),
                    [PLAYER_ID_2]: createMockPlayer({ id: PLAYER_ID_2, isInGame: false }),
                },
            });
            repository.save(session);

            const result = repository.inGamePlayersCount(SESSION_ID);

            expect(result).toBe(ONE);
        });

        it('should throw NotFoundException when session not found', () => {
            expect(() => repository.inGamePlayersCount('non-existent')).toThrow(NotFoundException);
        });
    });

    describe('realPlayersCount', () => {
        it('should return count of real players', () => {
            const session = createMockSession({
                inGamePlayers: {
                    [PLAYER_ID_1]: createMockPlayer({ id: PLAYER_ID_1, isInGame: true }),
                    [PLAYER_ID_2]: createMockPlayer({ id: PLAYER_ID_2, isInGame: true, virtualPlayerType: VirtualPlayerType.Offensive }),
                },
            });
            repository.save(session);

            const result = repository.realPlayersCount(SESSION_ID);

            expect(result).toBe(ONE);
        });

        it('should throw NotFoundException when session not found', () => {
            expect(() => repository.realPlayersCount('non-existent')).toThrow(NotFoundException);
        });
    });

    describe('getIngamePlayers', () => {
        it('should return in-game players', () => {
            const session = createMockSession({
                inGamePlayers: {
                    [PLAYER_ID_1]: createMockPlayer({ id: PLAYER_ID_1, isInGame: true }),
                    [PLAYER_ID_2]: createMockPlayer({ id: PLAYER_ID_2, isInGame: false }),
                },
            });
            repository.save(session);

            const result = repository.getIngamePlayers(SESSION_ID);

            expect(result.length).toBe(ONE);
            expect(result[ZERO].id).toBe(PLAYER_ID_1);
        });

        it('should throw NotFoundException when session not found', () => {
            expect(() => repository.getIngamePlayers('non-existent')).toThrow(NotFoundException);
        });
    });

    describe('save', () => {
        it('should save session', () => {
            const session = createMockSession();

            repository.save(session);

            expect(repository.findById(SESSION_ID)).toBe(session);
        });
    });

    describe('findById', () => {
        it('should return session when found', () => {
            const session = createMockSession();
            repository.save(session);

            const result = repository.findById(SESSION_ID);

            expect(result).toBe(session);
        });

        it('should throw NotFoundException when session not found', () => {
            expect(() => repository.findById('non-existent')).toThrow(NotFoundException);
        });
    });

    describe('update', () => {
        it('should update session without emitting event', () => {
            const session = createMockSession();
            repository.save(session);
            session.mode = GameMode.CTF;

            repository.update(session, false);

            expect(repository.findById(SESSION_ID).mode).toBe(GameMode.CTF);
            expect(eventEmitter.emit).not.toHaveBeenCalled();
        });

        it('should update session and emit event when emitEvent is true', () => {
            const session = createMockSession();
            repository.save(session);
            session.mode = GameMode.CTF;

            repository.update(session, true);

            expect(repository.findById(SESSION_ID).mode).toBe(GameMode.CTF);
            expect(eventEmitter.emit).toHaveBeenCalledWith(ServerEvents.SessionUpdated, { session });
        });
    });

    describe('delete', () => {
        it('should delete session', () => {
            const session = createMockSession();
            repository.save(session);

            repository.delete(SESSION_ID);

            expect(() => repository.findById(SESSION_ID)).toThrow(NotFoundException);
        });
    });

    describe('playerLeave', () => {
        it('should mark player as not in game', () => {
            const session = createMockSession();
            repository.save(session);

            const result = repository.playerLeave(SESSION_ID, PLAYER_ID_1);

            expect(session.inGamePlayers[PLAYER_ID_1].isInGame).toBe(false);
            expect(result).toBe(session.inGamePlayers[PLAYER_ID_1]);
        });

        it('should clear tile occupant when player position is valid', () => {
            const session = createMockSession();
            repository.save(session);

            repository.playerLeave(SESSION_ID, PLAYER_ID_1);

            expect(gameCache.clearTileOccupant).toHaveBeenCalledWith(SESSION_ID, { x: POSITION_X, y: POSITION_Y });
        });

        it('should not clear tile occupant when player position is invalid', () => {
            const session = createMockSession({
                inGamePlayers: {
                    [PLAYER_ID_1]: createMockPlayer({ id: PLAYER_ID_1, x: -ONE, y: -ONE }),
                },
            });
            repository.save(session);

            repository.playerLeave(SESSION_ID, PLAYER_ID_1);

            expect(gameCache.clearTileOccupant).not.toHaveBeenCalled();
        });

        it('should reenable placeables for player', () => {
            const session = createMockSession();
            repository.save(session);

            repository.playerLeave(SESSION_ID, PLAYER_ID_1);

            expect(gameCache.reenablePlaceablesForPlayer).toHaveBeenCalledWith(SESSION_ID, PLAYER_ID_1);
        });

        it('should set player position to -1', () => {
            const session = createMockSession();
            repository.save(session);

            repository.playerLeave(SESSION_ID, PLAYER_ID_1);

            expect(session.inGamePlayers[PLAYER_ID_1].x).toBe(-ONE);
            expect(session.inGamePlayers[PLAYER_ID_1].y).toBe(-ONE);
        });

        it('should remove start point', () => {
            const session = createMockSession();
            repository.save(session);

            repository.playerLeave(SESSION_ID, PLAYER_ID_1);

            expect(session.startPoints.length).toBe(ZERO);
        });

        it('should throw NotFoundException when session not found', () => {
            expect(() => repository.playerLeave('non-existent', PLAYER_ID_1)).toThrow(NotFoundException);
        });

        it('should throw NotFoundException when player not found', () => {
            const session = createMockSession();
            repository.save(session);

            expect(() => repository.playerLeave(SESSION_ID, 'non-existent')).toThrow(NotFoundException);
        });
    });

    describe('findSessionByPlayerId', () => {
        it('should return session when player is in game', () => {
            const session = createMockSession();
            repository.save(session);

            const result = repository.findSessionByPlayerId(PLAYER_ID_1);

            expect(result).toBe(session);
        });

        it('should return null when player is not in game', () => {
            const session = createMockSession({
                inGamePlayers: {
                    [PLAYER_ID_1]: createMockPlayer({ id: PLAYER_ID_1, isInGame: false }),
                },
            });
            repository.save(session);

            const result = repository.findSessionByPlayerId(PLAYER_ID_1);

            expect(result).toBeNull();
        });

        it('should return null when player not found', () => {
            const session = createMockSession();
            repository.save(session);

            const result = repository.findSessionByPlayerId('non-existent');

            expect(result).toBeNull();
        });
    });

    describe('findStartPointById', () => {
        it('should return start point when found', () => {
            const session = createMockSession();
            repository.save(session);

            const result = repository.findStartPointById(SESSION_ID, START_POINT_ID);

            expect(result).toBeDefined();
            expect(result?.id).toBe(START_POINT_ID);
        });

        it('should return null when start point not found', () => {
            const session = createMockSession();
            repository.save(session);

            const result = repository.findStartPointById(SESSION_ID, 'non-existent');

            expect(result).toBeUndefined();
        });

        it('should throw NotFoundException when session not found', () => {
            expect(() => repository.findStartPointById('non-existent', START_POINT_ID)).toThrow(NotFoundException);
        });
    });

    describe('movePlayerPosition', () => {
        it('should move player position and decrease speed', () => {
            const session = createMockSession();
            repository.save(session);

            const result = repository.movePlayerPosition(SESSION_ID, PLAYER_ID_1, NEW_X, NEW_Y, COST);

            expect(session.inGamePlayers[PLAYER_ID_1].x).toBe(NEW_X);
            expect(session.inGamePlayers[PLAYER_ID_1].y).toBe(NEW_Y);
            expect(session.inGamePlayers[PLAYER_ID_1].speed).toBe(SPEED - COST);
            expect(gameCache.moveTileOccupant).toHaveBeenCalledWith(SESSION_ID, { x: NEW_X, y: NEW_Y }, session.inGamePlayers[PLAYER_ID_1]);
            expect(eventEmitter.emit).toHaveBeenCalledWith(ServerEvents.PlayerMoved, {
                session,
                playerId: PLAYER_ID_1,
                x: NEW_X,
                y: NEW_Y,
                speed: SPEED - COST,
                boatSpeed: ZERO,
            });
            expect(result).toEqual({ oldX: POSITION_X, oldY: POSITION_Y, newX: NEW_X, newY: NEW_Y });
        });

        it('should decrease boatSpeed when player is on boat', () => {
            const session = createMockSession({
                inGamePlayers: {
                    [PLAYER_ID_1]: createMockPlayer({ id: PLAYER_ID_1, onBoatId: 'boat-123', boatSpeed: BOAT_SPEED }),
                },
            });
            repository.save(session);

            repository.movePlayerPosition(SESSION_ID, PLAYER_ID_1, NEW_X, NEW_Y, COST);

            expect(session.inGamePlayers[PLAYER_ID_1].boatSpeed).toBe(BOAT_SPEED - COST);
            expect(eventEmitter.emit).toHaveBeenCalledWith(ServerEvents.PlayerMoved, {
                session,
                playerId: PLAYER_ID_1,
                x: NEW_X,
                y: NEW_Y,
                speed: SPEED,
                boatSpeed: BOAT_SPEED - COST,
            });
        });

        it('should decrease speed when player is on boat but boatSpeed is zero', () => {
            const session = createMockSession({
                inGamePlayers: {
                    [PLAYER_ID_1]: createMockPlayer({ id: PLAYER_ID_1, onBoatId: 'boat-123', boatSpeed: ZERO }),
                },
            });
            repository.save(session);

            repository.movePlayerPosition(SESSION_ID, PLAYER_ID_1, NEW_X, NEW_Y, COST);

            expect(session.inGamePlayers[PLAYER_ID_1].speed).toBe(SPEED - COST);
        });

        it('should throw NotFoundException when session not found', () => {
            expect(() => repository.movePlayerPosition('non-existent', PLAYER_ID_1, NEW_X, NEW_Y, COST)).toThrow(NotFoundException);
        });

        it('should throw NotFoundException when player not found', () => {
            const session = createMockSession();
            repository.save(session);

            expect(() => repository.movePlayerPosition(SESSION_ID, 'non-existent', NEW_X, NEW_Y, COST)).toThrow(NotFoundException);
        });
    });

    describe('getNextFreeTeam', () => {
        it('should return team with fewer players', () => {
            const session = createMockSession({
                playerCount: FOUR,
                teams: {
                    [TEAM_1]: { number: TEAM_1, playerIds: [PLAYER_ID_1, PLAYER_ID_2] },
                    [TEAM_2]: { number: TEAM_2, playerIds: [] },
                },
            });
            repository.save(session);

            const result = repository.getNextFreeTeam(SESSION_ID);

            expect(result).toBeDefined();
            expect(result?.number).toBe(TEAM_2);
        });

        it('should return null when no team is free', () => {
            const session = createMockSession({
                playerCount: TWO,
                teams: {
                    [TEAM_1]: { number: TEAM_1, playerIds: [PLAYER_ID_1] },
                    [TEAM_2]: { number: TEAM_2, playerIds: [PLAYER_ID_2] },
                },
            });
            repository.save(session);

            const result = repository.getNextFreeTeam(SESSION_ID);

            expect(result).toBeNull();
        });

        it('should throw NotFoundException when session not found', () => {
            expect(() => repository.getNextFreeTeam('non-existent')).toThrow(NotFoundException);
        });
    });

    describe('assignPlayerToTeam', () => {
        it('should assign player to team', () => {
            const session = createMockSession({
                playerCount: FOUR,
                inGamePlayers: {
                    [PLAYER_ID_1]: createMockPlayer({ id: PLAYER_ID_1 }),
                    [PLAYER_ID_2]: createMockPlayer({ id: PLAYER_ID_2 }),
                },
                teams: {
                    [TEAM_1]: { number: TEAM_1, playerIds: [PLAYER_ID_1, 'other-player'] },
                    [TEAM_2]: { number: TEAM_2, playerIds: [] },
                },
            });
            repository.save(session);

            repository.assignPlayerToTeam(SESSION_ID, PLAYER_ID_2);

            expect(session.teams[TEAM_2].playerIds).toContain(PLAYER_ID_2);
            expect(session.inGamePlayers[PLAYER_ID_2]?.teamNumber).toBe(TEAM_2);
            expect(eventEmitter.emit).toHaveBeenCalledWith(ServerEvents.SessionUpdated, { session });
        });

        it('should throw NotFoundException when session not found', () => {
            expect(() => repository.assignPlayerToTeam('non-existent', PLAYER_ID_1)).toThrow(NotFoundException);
        });

        it('should throw NotFoundException when player not found', () => {
            const session = createMockSession();
            repository.save(session);

            expect(() => repository.assignPlayerToTeam(SESSION_ID, 'non-existent')).toThrow(NotFoundException);
        });
    });
});
