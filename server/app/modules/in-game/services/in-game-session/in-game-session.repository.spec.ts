/* eslint-disable max-lines -- Test file with comprehensive test coverage */
import { ServerEvents } from '@app/enums/server-events.enum';
import { GameCacheService } from '@app/modules/in-game/services/game-cache/game-cache.service';
import { Avatar } from '@common/enums/avatar.enum';
import { Dice } from '@common/enums/dice.enum';
import { GameMode } from '@common/enums/game-mode.enum';
import { MapSize } from '@common/enums/map-size.enum';
import { Player } from '@common/interfaces/player.interface';
import { InGameSession } from '@common/interfaces/session.interface';
import { NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { InGameSessionRepository } from './in-game-session.repository';

describe('InGameSessionRepository', () => {
    let service: InGameSessionRepository;
    let gameCache: jest.Mocked<GameCacheService>;
    let eventEmitter: jest.Mocked<EventEmitter2>;

    const SESSION_ID = 'session-123';
    const PLAYER_A_ID = 'player-a';
    const PLAYER_B_ID = 'player-b';
    const START_POINT_ID = 'start-point-1';
    const BASE_HEALTH = 100;
    const BASE_SPEED = 3;
    const BASE_ATTACK = 10;
    const BASE_DEFENSE = 5;
    const NO_BONUS = 0;
    const ACTIONS_REMAINING = 1;
    const NO_COMBAT_STATS = 0;
    const POS_X_1 = 1;
    const POS_Y_1 = 1;
    const POS_X_2 = 2;
    const POS_Y_3 = 3;
    const HEALTH_DAMAGE = 20;
    const HEALTH_AFTER_DAMAGE = 80;
    const NEW_HEALTH = 90;
    const MOVE_COST = 1;
    const NEGATIVE_POS = -1;
    const ZERO_HEALTH = 0;
    const PLAYER_COUNT = 2;
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
        baseDefense: BASE_DEFENSE,
        defenseBonus: NO_BONUS,
        attackDice: Dice.D6,
        defenseDice: Dice.D4,
        x: POS_X_1,
        y: POS_Y_1,
        isInGame: true,
        startPointId: START_POINT_ID,
        actionsRemaining: ACTIONS_REMAINING,
        combatCount: NO_COMBAT_STATS,
        combatWins: NO_COMBAT_STATS,
        combatLosses: NO_COMBAT_STATS,
        combatDraws: NO_COMBAT_STATS,
        hasCombatBonus: false,
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
            [PLAYER_B_ID]: createMockPlayer({ id: PLAYER_B_ID }),
        },
        currentTurn: { turnNumber: 1, activePlayerId: PLAYER_A_ID, hasUsedAction: false },
        startPoints: [{ id: START_POINT_ID, playerId: PLAYER_A_ID, x: POS_X_1, y: POS_Y_1 }],
        mapSize: MapSize.MEDIUM,
        mode: GameMode.CLASSIC,
        turnOrder: [PLAYER_A_ID, PLAYER_B_ID],
        isAdminModeActive: false,
        ...overrides,
    });

    beforeEach(() => {
        const mockGameCache = {
            clearTileOccupant: jest.fn(),
            moveTileOccupant: jest.fn(),
        };

        const mockEventEmitter = {
            emit: jest.fn(),
        };

        gameCache = mockGameCache as unknown as jest.Mocked<GameCacheService>;
        eventEmitter = mockEventEmitter as unknown as jest.Mocked<EventEmitter2>;

        service = new InGameSessionRepository(eventEmitter, gameCache);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('save', () => {
        it('should save session', () => {
            const session = createMockSession();

            service.save(session);

            expect(service.findById(SESSION_ID)).toBe(session);
        });

        it('should overwrite existing session', () => {
            const session1 = createMockSession({ isGameStarted: false });
            const session2 = createMockSession({ isGameStarted: true });

            service.save(session1);
            service.save(session2);

            expect(service.findById(SESSION_ID).isGameStarted).toBe(true);
        });
    });

    describe('findById', () => {
        it('should return session when found', () => {
            const session = createMockSession();
            service.save(session);

            const result = service.findById(SESSION_ID);

            expect(result).toBe(session);
        });

        it('should throw NotFoundException when session not found', () => {
            expect(() => service.findById('non-existent')).toThrow(NotFoundException);
            expect(() => service.findById('non-existent')).toThrow('Session not found');
        });
    });

    describe('update', () => {
        it('should update session', () => {
            const session = createMockSession();
            service.save(session);
            session.isGameStarted = true;

            service.update(session);

            expect(service.findById(SESSION_ID).isGameStarted).toBe(true);
        });
    });

    describe('delete', () => {
        it('should delete session', () => {
            const session = createMockSession();
            service.save(session);

            service.delete(SESSION_ID);

            expect(() => service.findById(SESSION_ID)).toThrow(NotFoundException);
        });

        it('should not throw when deleting non-existent session', () => {
            expect(() => service.delete('non-existent')).not.toThrow();
        });
    });

    describe('updatePlayer', () => {
        it('should update player properties', () => {
            const session = createMockSession();
            service.save(session);

            service.updatePlayer(SESSION_ID, PLAYER_A_ID, { health: NEW_HEALTH });

            expect(service.findById(SESSION_ID).inGamePlayers[PLAYER_A_ID].health).toBe(NEW_HEALTH);
        });

        it('should throw NotFoundException when session not found', () => {
            expect(() => service.updatePlayer('non-existent', PLAYER_A_ID, {})).toThrow(NotFoundException);
        });

        it('should throw NotFoundException when player not found', () => {
            const session = createMockSession();
            service.save(session);

            expect(() => service.updatePlayer(SESSION_ID, 'non-existent', {})).toThrow(NotFoundException);
            expect(() => service.updatePlayer(SESSION_ID, 'non-existent', {})).toThrow('Player not found');
        });

        it('should emit player.updated event', () => {
            const session = createMockSession();
            service.save(session);

            service.updatePlayer(SESSION_ID, PLAYER_A_ID, { health: NEW_HEALTH });

            expect(eventEmitter.emit).toHaveBeenCalledWith(ServerEvents.PlayerUpdated, {
                sessionId: SESSION_ID,
                player: service.findById(SESSION_ID).inGamePlayers[PLAYER_A_ID],
            });
        });
    });

    describe('decreasePlayerHealth', () => {
        it('should decrease player health', () => {
            const session = createMockSession();
            service.save(session);

            const result = service.decreasePlayerHealth(SESSION_ID, PLAYER_A_ID, HEALTH_DAMAGE);

            expect(result).toBe(HEALTH_AFTER_DAMAGE);
            expect(service.findById(SESSION_ID).inGamePlayers[PLAYER_A_ID].health).toBe(HEALTH_AFTER_DAMAGE);
        });

        it('should not set health below zero', () => {
            const session = createMockSession();
            service.save(session);

            const result = service.decreasePlayerHealth(SESSION_ID, PLAYER_A_ID, BASE_HEALTH + HEALTH_DAMAGE);

            expect(result).toBe(ZERO_HEALTH);
            expect(service.findById(SESSION_ID).inGamePlayers[PLAYER_A_ID].health).toBe(ZERO_HEALTH);
        });

        it('should throw NotFoundException when session not found', () => {
            expect(() => service.decreasePlayerHealth('non-existent', PLAYER_A_ID, HEALTH_DAMAGE)).toThrow(NotFoundException);
        });

        it('should throw NotFoundException when player not found', () => {
            const session = createMockSession();
            service.save(session);

            expect(() => service.decreasePlayerHealth(SESSION_ID, 'non-existent', HEALTH_DAMAGE)).toThrow(NotFoundException);
        });
    });

    describe('resetPlayerHealth', () => {
        it('should reset player health to maxHealth', () => {
            const session = createMockSession();
            session.inGamePlayers[PLAYER_A_ID].health = HEALTH_AFTER_DAMAGE;
            service.save(session);

            service.resetPlayerHealth(SESSION_ID, PLAYER_A_ID);

            expect(service.findById(SESSION_ID).inGamePlayers[PLAYER_A_ID].health).toBe(BASE_HEALTH);
        });

        it('should throw NotFoundException when session not found', () => {
            expect(() => service.resetPlayerHealth('non-existent', PLAYER_A_ID)).toThrow(NotFoundException);
        });

        it('should throw NotFoundException when player not found', () => {
            const session = createMockSession();
            service.save(session);

            expect(() => service.resetPlayerHealth(SESSION_ID, 'non-existent')).toThrow(NotFoundException);
        });

        it('should emit player.healthChanged event', () => {
            const session = createMockSession();
            session.inGamePlayers[PLAYER_A_ID].health = HEALTH_AFTER_DAMAGE;
            service.save(session);

            service.resetPlayerHealth(SESSION_ID, PLAYER_A_ID);

            expect(eventEmitter.emit).toHaveBeenCalledWith(ServerEvents.PlayerHealthChanged, {
                sessionId: SESSION_ID,
                playerId: PLAYER_A_ID,
                newHealth: BASE_HEALTH,
            });
        });
    });

    describe('incrementPlayerCombatCount', () => {
        it('should increment combat count', () => {
            const session = createMockSession();
            service.save(session);

            service.incrementPlayerCombatCount(SESSION_ID, PLAYER_A_ID);

            expect(service.findById(SESSION_ID).inGamePlayers[PLAYER_A_ID].combatCount).toBe(1);
        });

        it('should throw NotFoundException when session not found', () => {
            expect(() => service.incrementPlayerCombatCount('non-existent', PLAYER_A_ID)).toThrow(NotFoundException);
        });

        it('should throw NotFoundException when player not found', () => {
            const session = createMockSession();
            service.save(session);

            expect(() => service.incrementPlayerCombatCount(SESSION_ID, 'non-existent')).toThrow(NotFoundException);
        });

        it('should emit player.combatCountChanged event', () => {
            const session = createMockSession();
            service.save(session);

            service.incrementPlayerCombatCount(SESSION_ID, PLAYER_A_ID);

            expect(eventEmitter.emit).toHaveBeenCalledWith(ServerEvents.PlayerCombatCountChanged, {
                sessionId: SESSION_ID,
                playerId: PLAYER_A_ID,
                combatCount: 1,
            });
        });
    });

    describe('incrementPlayerCombatWins', () => {
        it('should increment combat wins', () => {
            const session = createMockSession();
            service.save(session);

            service.incrementPlayerCombatWins(SESSION_ID, PLAYER_A_ID);

            expect(service.findById(SESSION_ID).inGamePlayers[PLAYER_A_ID].combatWins).toBe(1);
        });

        it('should throw NotFoundException when session not found', () => {
            expect(() => service.incrementPlayerCombatWins('non-existent', PLAYER_A_ID)).toThrow(NotFoundException);
        });

        it('should throw NotFoundException when player not found', () => {
            const session = createMockSession();
            service.save(session);

            expect(() => service.incrementPlayerCombatWins(SESSION_ID, 'non-existent')).toThrow(NotFoundException);
        });

        it('should emit player.combatWinsChanged event', () => {
            const session = createMockSession();
            service.save(session);

            service.incrementPlayerCombatWins(SESSION_ID, PLAYER_A_ID);

            expect(eventEmitter.emit).toHaveBeenCalledWith(ServerEvents.PlayerCombatWinsChanged, {
                sessionId: SESSION_ID,
                playerId: PLAYER_A_ID,
                combatWins: 1,
            });
        });
    });

    describe('incrementPlayerCombatLosses', () => {
        it('should increment combat losses', () => {
            const session = createMockSession();
            service.save(session);

            service.incrementPlayerCombatLosses(SESSION_ID, PLAYER_A_ID);

            expect(service.findById(SESSION_ID).inGamePlayers[PLAYER_A_ID].combatLosses).toBe(1);
        });

        it('should throw NotFoundException when session not found', () => {
            expect(() => service.incrementPlayerCombatLosses('non-existent', PLAYER_A_ID)).toThrow(NotFoundException);
        });

        it('should throw NotFoundException when player not found', () => {
            const session = createMockSession();
            service.save(session);

            expect(() => service.incrementPlayerCombatLosses(SESSION_ID, 'non-existent')).toThrow(NotFoundException);
        });

        it('should emit player.combatLossesChanged event', () => {
            const session = createMockSession();
            service.save(session);

            service.incrementPlayerCombatLosses(SESSION_ID, PLAYER_A_ID);

            expect(eventEmitter.emit).toHaveBeenCalledWith(ServerEvents.PlayerCombatLossesChanged, {
                sessionId: SESSION_ID,
                playerId: PLAYER_A_ID,
                combatLosses: 1,
            });
        });
    });

    describe('incrementPlayerCombatDraws', () => {
        it('should increment combat draws', () => {
            const session = createMockSession();
            service.save(session);

            service.incrementPlayerCombatDraws(SESSION_ID, PLAYER_A_ID);

            expect(service.findById(SESSION_ID).inGamePlayers[PLAYER_A_ID].combatDraws).toBe(1);
        });

        it('should throw NotFoundException when session not found', () => {
            expect(() => service.incrementPlayerCombatDraws('non-existent', PLAYER_A_ID)).toThrow(NotFoundException);
        });

        it('should throw NotFoundException when player not found', () => {
            const session = createMockSession();
            service.save(session);

            expect(() => service.incrementPlayerCombatDraws(SESSION_ID, 'non-existent')).toThrow(NotFoundException);
        });

        it('should emit player.combatDrawsChanged event', () => {
            const session = createMockSession();
            service.save(session);

            service.incrementPlayerCombatDraws(SESSION_ID, PLAYER_A_ID);

            expect(eventEmitter.emit).toHaveBeenCalledWith(ServerEvents.PlayerCombatDrawsChanged, {
                sessionId: SESSION_ID,
                playerId: PLAYER_A_ID,
                combatDraws: 1,
            });
        });
    });

    describe('getIngamePlayers', () => {
        it('should return only in-game players', () => {
            const session = createMockSession();
            session.inGamePlayers[PLAYER_B_ID].isInGame = false;
            service.save(session);

            const result = service.getIngamePlayers(SESSION_ID);

            expect(result).toHaveLength(1);
            expect(result[0].id).toBe(PLAYER_A_ID);
        });

        it('should return empty array when no players in game', () => {
            const session = createMockSession();
            session.inGamePlayers[PLAYER_A_ID].isInGame = false;
            session.inGamePlayers[PLAYER_B_ID].isInGame = false;
            service.save(session);

            const result = service.getIngamePlayers(SESSION_ID);

            expect(result).toEqual([]);
        });

        it('should throw NotFoundException when session not found', () => {
            expect(() => service.getIngamePlayers('non-existent')).toThrow(NotFoundException);
        });
    });

    describe('inGamePlayersCount', () => {
        it('should return count of in-game players', () => {
            const session = createMockSession();
            service.save(session);

            const result = service.inGamePlayersCount(SESSION_ID);

            expect(result).toBe(PLAYER_COUNT);
        });

        it('should return zero when no players in game', () => {
            const session = createMockSession();
            session.inGamePlayers[PLAYER_A_ID].isInGame = false;
            session.inGamePlayers[PLAYER_B_ID].isInGame = false;
            service.save(session);

            const result = service.inGamePlayersCount(SESSION_ID);

            expect(result).toBe(0);
        });

        it('should throw NotFoundException when session not found', () => {
            expect(() => service.inGamePlayersCount('non-existent')).toThrow(NotFoundException);
        });
    });

    describe('playerLeave', () => {
        it('should set player isInGame to false', () => {
            const session = createMockSession();
            service.save(session);

            service.playerLeave(SESSION_ID, PLAYER_A_ID);

            expect(service.findById(SESSION_ID).inGamePlayers[PLAYER_A_ID].isInGame).toBe(false);
        });

        it('should clear tile occupant when player has valid position', () => {
            const session = createMockSession();
            service.save(session);

            service.playerLeave(SESSION_ID, PLAYER_A_ID);

            expect(gameCache.clearTileOccupant).toHaveBeenCalledWith(SESSION_ID, POS_X_1, POS_Y_1);
        });

        it('should not clear tile occupant when player has negative position', () => {
            const session = createMockSession();
            session.inGamePlayers[PLAYER_A_ID].x = NEGATIVE_POS;
            session.inGamePlayers[PLAYER_A_ID].y = NEGATIVE_POS;
            service.save(session);

            service.playerLeave(SESSION_ID, PLAYER_A_ID);

            expect(gameCache.clearTileOccupant).not.toHaveBeenCalled();
        });

        it('should set player position to -1', () => {
            const session = createMockSession();
            service.save(session);

            service.playerLeave(SESSION_ID, PLAYER_A_ID);

            expect(service.findById(SESSION_ID).inGamePlayers[PLAYER_A_ID].x).toBe(NEGATIVE_POS);
            expect(service.findById(SESSION_ID).inGamePlayers[PLAYER_A_ID].y).toBe(NEGATIVE_POS);
        });

        it('should remove start point', () => {
            const session = createMockSession();
            service.save(session);

            service.playerLeave(SESSION_ID, PLAYER_A_ID);

            expect(service.findById(SESSION_ID).startPoints.find((sp) => sp.id === START_POINT_ID)).toBeUndefined();
        });

        it('should return player', () => {
            const session = createMockSession();
            service.save(session);

            const result = service.playerLeave(SESSION_ID, PLAYER_A_ID);

            expect(result).toBe(session.inGamePlayers[PLAYER_A_ID]);
        });

        it('should throw NotFoundException when session not found', () => {
            expect(() => service.playerLeave('non-existent', PLAYER_A_ID)).toThrow(NotFoundException);
        });

        it('should throw NotFoundException when player not found', () => {
            const session = createMockSession();
            service.save(session);

            expect(() => service.playerLeave(SESSION_ID, 'non-existent')).toThrow(NotFoundException);
        });
    });

    describe('findSessionByPlayerId', () => {
        it('should return session when player is in game', () => {
            const session = createMockSession();
            service.save(session);

            const result = service.findSessionByPlayerId(PLAYER_A_ID);

            expect(result).toBe(session);
        });

        it('should return null when player is not in game', () => {
            const session = createMockSession();
            session.inGamePlayers[PLAYER_A_ID].isInGame = false;
            service.save(session);

            const result = service.findSessionByPlayerId(PLAYER_A_ID);

            expect(result).toBeNull();
        });

        it('should return null when player not found in any session', () => {
            const result = service.findSessionByPlayerId('non-existent');

            expect(result).toBeNull();
        });

        it('should return first matching session when player in multiple sessions', () => {
            const session1 = createMockSession({ id: 'session-1' });
            const session2 = createMockSession({ id: 'session-2' });
            service.save(session1);
            service.save(session2);

            const result = service.findSessionByPlayerId(PLAYER_A_ID);

            expect(result).toBeDefined();
        });
    });

    describe('findStartPointById', () => {
        it('should return start point when found', () => {
            const session = createMockSession();
            service.save(session);

            const result = service.findStartPointById(SESSION_ID, START_POINT_ID);

            expect(result).toBeDefined();
            expect(result?.id).toBe(START_POINT_ID);
        });

        it('should return null when start point not found', () => {
            const session = createMockSession();
            service.save(session);

            const result = service.findStartPointById(SESSION_ID, 'non-existent');

            expect(result).toBeUndefined();
        });

        it('should throw NotFoundException when session not found', () => {
            expect(() => service.findStartPointById('non-existent', START_POINT_ID)).toThrow(NotFoundException);
        });
    });

    describe('movePlayerPosition', () => {
        it('should move player to new position', () => {
            const session = createMockSession();
            service.save(session);

            const result = service.movePlayerPosition(SESSION_ID, PLAYER_A_ID, POS_X_2, POS_Y_3, MOVE_COST);

            expect(service.findById(SESSION_ID).inGamePlayers[PLAYER_A_ID].x).toBe(POS_X_2);
            expect(service.findById(SESSION_ID).inGamePlayers[PLAYER_A_ID].y).toBe(POS_Y_3);
            expect(service.findById(SESSION_ID).inGamePlayers[PLAYER_A_ID].speed).toBe(BASE_SPEED - MOVE_COST);
            expect(result).toEqual({ oldX: POS_X_1, oldY: POS_Y_1, newX: POS_X_2, newY: POS_Y_3 });
        });

        it('should call gameCache.moveTileOccupant', () => {
            const session = createMockSession();
            service.save(session);

            service.movePlayerPosition(SESSION_ID, PLAYER_A_ID, POS_X_2, POS_Y_3, MOVE_COST);

            expect(gameCache.moveTileOccupant).toHaveBeenCalledWith(SESSION_ID, POS_X_2, POS_Y_3, session.inGamePlayers[PLAYER_A_ID]);
        });

        it('should emit player.moved event', () => {
            const session = createMockSession();
            service.save(session);

            service.movePlayerPosition(SESSION_ID, PLAYER_A_ID, POS_X_2, POS_Y_3, MOVE_COST);

            expect(eventEmitter.emit).toHaveBeenCalledWith(ServerEvents.PlayerMoved, {
                session: service.findById(SESSION_ID),
                playerId: PLAYER_A_ID,
                x: POS_X_2,
                y: POS_Y_3,
                speed: BASE_SPEED - MOVE_COST,
            });
        });

        it('should throw NotFoundException when session not found', () => {
            expect(() => service.movePlayerPosition('non-existent', PLAYER_A_ID, POS_X_2, POS_Y_3, MOVE_COST)).toThrow(NotFoundException);
        });

        it('should throw NotFoundException when player not found', () => {
            const session = createMockSession();
            service.save(session);

            expect(() => service.movePlayerPosition(SESSION_ID, 'non-existent', POS_X_2, POS_Y_3, MOVE_COST)).toThrow(NotFoundException);
        });
    });
});
