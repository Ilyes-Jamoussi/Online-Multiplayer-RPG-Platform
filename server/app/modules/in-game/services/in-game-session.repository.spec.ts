import { InGameSessionRepository } from './in-game-session.repository';
import { InGameSession } from '@common/models/session.interface';
import { NotFoundException } from '@nestjs/common';
import { MapSize } from '@common/enums/map-size.enum';
import { GameMode } from '@common/enums/game-mode.enum';
import { Avatar } from '@common/enums/avatar.enum';

describe('InGameSessionRepository', () => {
    let repository: InGameSessionRepository;

    const BASE_SPEED = 5;
    const BASE_HEALTH = 100;
    const BASE_ATTACK = 10;
    const BASE_DEFENSE = 5;
    const POSITION_FIVE = 5;
    const POSITION_TEN = 10;
    const TURN_NUMBER_TWO = 2;

    const createMockSession = (id = 'session-123', overrides: Partial<InGameSession> = {}): InGameSession => ({
        id,
        inGameId: `${id}-game-456`,
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
                isAdmin: true,
                speed: BASE_SPEED,
                health: BASE_HEALTH,
                attack: BASE_ATTACK,
                defense: BASE_DEFENSE,
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
                attack: BASE_ATTACK,
                defense: BASE_DEFENSE,
            },
        },
        currentTurn: { turnNumber: 1, activePlayerId: 'player1' },
        startPoints: [],
        mapSize: MapSize.MEDIUM,
        mode: GameMode.CLASSIC,
        turnOrderPlayerId: ['player1', 'player2'],
        ...overrides,
    });

    beforeEach(() => {
        repository = new InGameSessionRepository();
    });

    it('should be defined', () => {
        expect(repository).toBeDefined();
    });

    describe('save', () => {
        it('should save a new session', () => {
            const session = createMockSession();

            repository.save(session);

            const retrievedSession = repository.findById(session.id);
            expect(retrievedSession).toEqual(session);
        });

        it('should save multiple sessions independently', () => {
            const session1 = createMockSession('session-1');
            const session2 = createMockSession('session-2');

            repository.save(session1);
            repository.save(session2);

            expect(repository.findById('session-1')).toEqual(session1);
            expect(repository.findById('session-2')).toEqual(session2);
        });

        it('should override existing session with same id', () => {
            const session1 = createMockSession('session-1', { isGameStarted: false });
            const session2 = createMockSession('session-1', { isGameStarted: true });

            repository.save(session1);
            repository.save(session2);

            const retrievedSession = repository.findById('session-1');
            expect(retrievedSession.isGameStarted).toBe(true);
        });

        it('should preserve session data exactly as provided', () => {
            const session = createMockSession();
            session.currentTurn.turnNumber = POSITION_FIVE;
            session.inGamePlayers.player1.x = POSITION_TEN;

            repository.save(session);

            const retrievedSession = repository.findById(session.id);
            expect(retrievedSession.currentTurn.turnNumber).toBe(POSITION_FIVE);
            expect(retrievedSession.inGamePlayers.player1.x).toBe(POSITION_TEN);
        });
    });

    describe('findById', () => {
        it('should return saved session by id', () => {
            const session = createMockSession();
            repository.save(session);

            const result = repository.findById(session.id);

            expect(result).toEqual(session);
        });

        it('should throw NotFoundException when session does not exist', () => {
            expect(() => repository.findById('non-existent-id')).toThrow(NotFoundException);
            expect(() => repository.findById('non-existent-id')).toThrow('Session not found');
        });

        it('should return correct session when multiple sessions exist', () => {
            const session1 = createMockSession('session-1');
            const session2 = createMockSession('session-2');
            const session3 = createMockSession('session-3');

            repository.save(session1);
            repository.save(session2);
            repository.save(session3);

            expect(repository.findById('session-2')).toEqual(session2);
        });

        it('should throw NotFoundException after session is deleted', () => {
            const session = createMockSession();
            repository.save(session);
            repository.delete(session.id);

            expect(() => repository.findById(session.id)).toThrow(NotFoundException);
        });
    });

    describe('update', () => {
        it('should update an existing session', () => {
            const session = createMockSession();
            repository.save(session);

            session.isGameStarted = true;
            session.currentTurn.turnNumber = TURN_NUMBER_TWO;

            repository.update(session);

            const updatedSession = repository.findById(session.id);
            expect(updatedSession.isGameStarted).toBe(true);
            expect(updatedSession.currentTurn.turnNumber).toBe(TURN_NUMBER_TWO);
        });

        it('should create session if it does not exist', () => {
            const session = createMockSession();

            repository.update(session);

            const retrievedSession = repository.findById(session.id);
            expect(retrievedSession).toEqual(session);
        });

        it('should update player states', () => {
            const session = createMockSession();
            repository.save(session);

            session.inGamePlayers.player1.x = POSITION_FIVE;
            session.inGamePlayers.player1.y = POSITION_FIVE;
            session.inGamePlayers.player1.isInGame = true;

            repository.update(session);

            const updatedSession = repository.findById(session.id);
            expect(updatedSession.inGamePlayers.player1.x).toBe(POSITION_FIVE);
            expect(updatedSession.inGamePlayers.player1.y).toBe(POSITION_FIVE);
            expect(updatedSession.inGamePlayers.player1.isInGame).toBe(true);
        });

        it('should update turn order', () => {
            const session = createMockSession();
            repository.save(session);

            session.turnOrderPlayerId = ['player2', 'player1'];
            session.currentTurn.activePlayerId = 'player2';

            repository.update(session);

            const updatedSession = repository.findById(session.id);
            expect(updatedSession.turnOrderPlayerId).toEqual(['player2', 'player1']);
            expect(updatedSession.currentTurn.activePlayerId).toBe('player2');
        });

        it('should not affect other sessions when updating', () => {
            const session1 = createMockSession('session-1');
            const session2 = createMockSession('session-2');

            repository.save(session1);
            repository.save(session2);

            session1.isGameStarted = true;
            repository.update(session1);

            expect(repository.findById('session-1').isGameStarted).toBe(true);
            expect(repository.findById('session-2').isGameStarted).toBe(false);
        });
    });

    describe('delete', () => {
        it('should delete an existing session', () => {
            const session = createMockSession();
            repository.save(session);

            repository.delete(session.id);

            expect(() => repository.findById(session.id)).toThrow(NotFoundException);
        });

        it('should not throw when deleting non-existent session', () => {
            expect(() => repository.delete('non-existent-id')).not.toThrow();
        });

        it('should only delete specified session', () => {
            const session1 = createMockSession('session-1');
            const session2 = createMockSession('session-2');

            repository.save(session1);
            repository.save(session2);

            repository.delete('session-1');

            expect(() => repository.findById('session-1')).toThrow(NotFoundException);
            expect(() => repository.findById('session-2')).not.toThrow();
        });

        it('should handle deleting same session multiple times', () => {
            const session = createMockSession();
            repository.save(session);

            repository.delete(session.id);
            repository.delete(session.id);

            expect(() => repository.findById(session.id)).toThrow(NotFoundException);
        });

        it('should allow re-saving after deletion', () => {
            const session = createMockSession();
            repository.save(session);

            repository.delete(session.id);

            session.isGameStarted = true;
            repository.save(session);

            const retrievedSession = repository.findById(session.id);
            expect(retrievedSession.isGameStarted).toBe(true);
        });
    });

    describe('integration', () => {
        it('should handle complete session lifecycle', () => {
            const session = createMockSession();

            repository.save(session);
            expect(repository.findById(session.id)).toEqual(session);

            session.isGameStarted = true;
            repository.update(session);
            expect(repository.findById(session.id).isGameStarted).toBe(true);

            repository.delete(session.id);
            expect(() => repository.findById(session.id)).toThrow(NotFoundException);
        });

        it('should handle multiple sessions lifecycle', () => {
            const session1 = createMockSession('session-1');
            const session2 = createMockSession('session-2');

            repository.save(session1);
            repository.save(session2);

            expect(repository.findById('session-1')).toEqual(session1);
            expect(repository.findById('session-2')).toEqual(session2);

            session1.isGameStarted = true;
            repository.update(session1);

            expect(repository.findById('session-1').isGameStarted).toBe(true);
            expect(repository.findById('session-2').isGameStarted).toBe(false);

            repository.delete('session-1');

            expect(() => repository.findById('session-1')).toThrow(NotFoundException);
            expect(() => repository.findById('session-2')).not.toThrow();
        });

        it('should maintain data integrity during complex operations', () => {
            const session = createMockSession();

            repository.save(session);

            session.inGamePlayers.player1.x = POSITION_FIVE;
            session.currentTurn.turnNumber = TURN_NUMBER_TWO;
            repository.update(session);

            let retrievedSession = repository.findById(session.id);
            expect(retrievedSession.inGamePlayers.player1.x).toBe(POSITION_FIVE);
            expect(retrievedSession.currentTurn.turnNumber).toBe(TURN_NUMBER_TWO);

            session.inGamePlayers.player2.isInGame = true;
            repository.update(session);

            retrievedSession = repository.findById(session.id);
            expect(retrievedSession.inGamePlayers.player1.x).toBe(POSITION_FIVE);
            expect(retrievedSession.inGamePlayers.player2.isInGame).toBe(true);
        });
    });
});

