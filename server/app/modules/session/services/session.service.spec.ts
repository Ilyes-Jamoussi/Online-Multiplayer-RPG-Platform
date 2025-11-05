
/* eslint-disable max-lines -- Test file */
import { ACCESS_CODE_LENGTH } from '@app/constants/session.constants';
import { CreateSessionDto } from '@app/modules/session/dto/create-session.dto';
import { JoinSessionDto } from '@app/modules/session/dto/join-session.dto';
import { SessionService } from '@app/modules/session/services/session.service';
import { Avatar } from '@common/enums/avatar.enum';
import { Dice } from '@common/enums/dice.enum';
import { ServerEvents } from '@app/enums/server-events.enum';
import { EventEmitter2 } from '@nestjs/event-emitter';

describe('SessionService', () => {
    let service: SessionService;
    let mockEventEmitter: jest.Mocked<EventEmitter2>;

    const ADMIN_ID = 'admin-123';
    const PLAYER_ID_1 = 'player-1';
    const PLAYER_ID_2 = 'player-2';
    const GAME_ID = 'game-123';
    const MAX_PLAYERS = 4;
    const TEST_ITERATIONS = 100;
    const MAX_PLAYERS_TEST = 6;
    const EXPECTED_PLAYERS_COUNT = 3;

    const createMockPlayerDto = (overrides: Partial<CreateSessionDto['player']> = {}) => ({
        id: '',
        name: 'Player',
        avatar: Avatar.Avatar1,
        isAdmin: false,
        attackDice: Dice.D6,
        defenseDice: Dice.D6,
        baseHealth: 100,
        healthBonus: 0,
        health: 100,
        maxHealth: 100,
        baseAttack: 10,
        attackBonus: 0,
        attack: 10,
        baseDefense: 5,
        defenseBonus: 0,
        defense: 5,
        baseSpeed: 5,
        speedBonus: 0,
        speed: 5,
        actionsRemaining: 1,
        ...overrides,
    });

    const createCreateSessionDto = (overrides: Partial<CreateSessionDto> = {}): CreateSessionDto => ({
        gameId: GAME_ID,
        maxPlayers: MAX_PLAYERS,
        player: createMockPlayerDto({ isAdmin: true, ...overrides.player }),
        ...overrides,
    });

    const createJoinSessionDto = (sessionId: string, overrides: Partial<JoinSessionDto> = {}): JoinSessionDto => ({
        sessionId,
        player: createMockPlayerDto(overrides.player),
        ...overrides,
    });

    beforeEach(() => {
        mockEventEmitter = {
            emit: jest.fn(),
        } as unknown as jest.Mocked<EventEmitter2>;

        service = new SessionService(mockEventEmitter);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('createSession', () => {
        it('should create a session with unique access code', () => {
            const dto = createCreateSessionDto();

            const sessionId = service.createSession(ADMIN_ID, dto);

            expect(sessionId).toBeDefined();
            expect(sessionId.length).toBe(ACCESS_CODE_LENGTH);
            expect(mockEventEmitter.emit).toHaveBeenCalledWith(ServerEvents.SessionAvailabilityChanged);
        });

        it('should create session with admin player', () => {
            const dto = createCreateSessionDto();
            const playerName = 'AdminPlayer';

            const sessionId = service.createSession(ADMIN_ID, {
                ...dto,
                player: createMockPlayerDto({ name: playerName, isAdmin: true }),
            });

            const session = service.getSession(sessionId);
            expect(session.players).toHaveLength(1);
            expect(session.players[0].id).toBe(ADMIN_ID);
            expect(session.players[0].name).toBe(playerName);
            expect(session.players[0].isAdmin).toBe(true);
        });

        it('should initialize avatar assignments with admin avatar selected', () => {
            const dto = createCreateSessionDto({
                player: createMockPlayerDto({ avatar: Avatar.Avatar3, isAdmin: true }),
            });

            const sessionId = service.createSession(ADMIN_ID, dto);
            const session = service.getSession(sessionId);

            const adminAvatar = session.avatarAssignments.find((a) => a.chosenBy === ADMIN_ID);
            expect(adminAvatar).toBeDefined();
            expect(adminAvatar?.avatar).toBe(Avatar.Avatar3);
        });

        it('should create unique session IDs', () => {
            const dto = createCreateSessionDto();
            const sessionIds = new Set<string>();

            for (let i = 0; i < TEST_ITERATIONS; i++) {
                const sessionId = service.createSession(`${ADMIN_ID}-${i}`, dto);
                expect(sessionIds.has(sessionId)).toBe(false);
                sessionIds.add(sessionId);
            }
        });

        it('should set session properties correctly', () => {
            const dto = createCreateSessionDto({ maxPlayers: MAX_PLAYERS_TEST });

            const sessionId = service.createSession(ADMIN_ID, dto);
            const session = service.getSession(sessionId);

            expect(session.gameId).toBe(GAME_ID);
            expect(session.maxPlayers).toBe(MAX_PLAYERS_TEST);
            expect(session.isRoomLocked).toBe(false);
            expect(session.id).toBe(sessionId);
        });
    });

    describe('endSession', () => {
        it('should delete session and emit availabilityChanged event', () => {
            const dto = createCreateSessionDto();
            const sessionId = service.createSession(ADMIN_ID, dto);

            service.endSession(sessionId);

            expect(() => service.getSession(sessionId)).toThrow('Session non trouvée');
            expect(mockEventEmitter.emit).toHaveBeenCalledWith(ServerEvents.SessionAvailabilityChanged);
        });
    });

    describe('joinSession', () => {
        it('should add player to session', () => {
            const dto = createCreateSessionDto();
            const sessionId = service.createSession(ADMIN_ID, dto);
            const joinDto = createJoinSessionDto(sessionId, {
                player: createMockPlayerDto({ name: 'NewPlayer' }),
            });

            const uniqueName = service.joinSession(PLAYER_ID_1, joinDto);

            const session = service.getSession(sessionId);
            expect(session.players).toHaveLength(2);
            expect(session.players.some((p) => p.id === PLAYER_ID_1)).toBe(true);
            expect(uniqueName).toBe('NewPlayer');
        });

        it('should generate unique name when name already exists', () => {
            const dto = createCreateSessionDto();
            const sessionId = service.createSession(ADMIN_ID, {
                ...dto,
                player: createMockPlayerDto({ name: 'Player', isAdmin: true }),
            });
            const joinDto1 = createJoinSessionDto(sessionId, {
                player: createMockPlayerDto({ name: 'Player' }),
            });
            const joinDto2 = createJoinSessionDto(sessionId, {
                player: createMockPlayerDto({ name: 'Player' }),
            });

            const name1 = service.joinSession(PLAYER_ID_1, joinDto1);
            const name2 = service.joinSession(PLAYER_ID_2, joinDto2);

            expect(name1).toBe('Player-2');
            expect(name2).toBe('Player-3');
        });

        it('should auto-lock session when max players reached', () => {
            const dto = createCreateSessionDto({ maxPlayers: 2 });
            const sessionId = service.createSession(ADMIN_ID, dto);
            const joinDto = createJoinSessionDto(sessionId);

            service.joinSession(PLAYER_ID_1, joinDto);

            expect(service.isRoomLocked(sessionId)).toBe(true);
            expect(mockEventEmitter.emit).toHaveBeenCalledWith(ServerEvents.SessionAutoLocked, sessionId);
        });

        it('should not auto-lock when session not full', () => {
            const dto = createCreateSessionDto({ maxPlayers: 4 });
            const sessionId = service.createSession(ADMIN_ID, dto);
            const joinDto = createJoinSessionDto(sessionId);

            service.joinSession(PLAYER_ID_1, joinDto);

            expect(service.isRoomLocked(sessionId)).toBe(false);
            expect(mockEventEmitter.emit).not.toHaveBeenCalledWith(ServerEvents.SessionAutoLocked, expect.anything());
        });

        it('should initialize player with default game values', () => {
            const dto = createCreateSessionDto();
            const sessionId = service.createSession(ADMIN_ID, dto);
            const joinDto = createJoinSessionDto(sessionId);

            service.joinSession(PLAYER_ID_1, joinDto);

            const session = service.getSession(sessionId);
            const player = session.players.find((p) => p.id === PLAYER_ID_1);
            expect(player).toBeDefined();
            expect(player?.x).toBe(0);
            expect(player?.y).toBe(0);
            expect(player?.isInGame).toBe(false);
            expect(player?.startPointId).toBe('');
            expect(player?.combatCount).toBe(0);
            expect(player?.combatWins).toBe(0);
            expect(player?.combatLosses).toBe(0);
            expect(player?.combatDraws).toBe(0);
            expect(player?.actionsRemaining).toBe(1);
        });
    });

    describe('leaveSession', () => {
        it('should remove player from session', () => {
            const dto = createCreateSessionDto();
            const sessionId = service.createSession(ADMIN_ID, dto);
            const joinDto = createJoinSessionDto(sessionId);
            service.joinSession(PLAYER_ID_1, joinDto);

            service.leaveSession(sessionId, PLAYER_ID_1);

            const session = service.getSession(sessionId);
            expect(session.players).toHaveLength(1);
            expect(session.players.some((p) => p.id === PLAYER_ID_1)).toBe(false);
        });

        it('should release avatar when player leaves', () => {
            const dto = createCreateSessionDto();
            const sessionId = service.createSession(ADMIN_ID, dto);
            const joinDto = createJoinSessionDto(sessionId);
            service.joinSession(PLAYER_ID_1, joinDto);
            service.chooseAvatar(sessionId, PLAYER_ID_1, Avatar.Avatar2);

            service.leaveSession(sessionId, PLAYER_ID_1);

            const avatars = service.getChosenAvatars(sessionId);
            const avatar = avatars.find((a) => a.avatar === Avatar.Avatar2);
            expect(avatar?.chosenBy).toBeNull();
        });
    });

    describe('isSessionFull', () => {
        it('should return false when session is not full', () => {
            const dto = createCreateSessionDto({ maxPlayers: 4 });
            const sessionId = service.createSession(ADMIN_ID, dto);
            service.joinSession(PLAYER_ID_1, createJoinSessionDto(sessionId));

            expect(service.isSessionFull(sessionId)).toBe(false);
        });

        it('should return true when session is full', () => {
            const dto = createCreateSessionDto({ maxPlayers: 2 });
            const sessionId = service.createSession(ADMIN_ID, dto);
            service.joinSession(PLAYER_ID_1, createJoinSessionDto(sessionId));

            expect(service.isSessionFull(sessionId)).toBe(true);
        });
    });

    describe('getPlayerSessionId', () => {
        it('should return session ID for existing player', () => {
            const dto = createCreateSessionDto();
            const sessionId = service.createSession(ADMIN_ID, dto);
            service.joinSession(PLAYER_ID_1, createJoinSessionDto(sessionId));

            const foundSessionId = service.getPlayerSessionId(PLAYER_ID_1);

            expect(foundSessionId).toBe(sessionId);
        });

        it('should return session ID when player is in second session', () => {
            const dto = createCreateSessionDto();
            service.createSession(ADMIN_ID, dto);
            const sessionId2 = service.createSession('admin-2', dto);
            service.joinSession(PLAYER_ID_1, createJoinSessionDto(sessionId2));

            const foundSessionId = service.getPlayerSessionId(PLAYER_ID_1);

            expect(foundSessionId).toBe(sessionId2);
        });

        it('should return null for non-existent player', () => {
            const result = service.getPlayerSessionId('non-existent-player');

            expect(result).toBeNull();
        });
    });

    describe('getPlayersSession', () => {
        it('should return all players in session', () => {
            const dto = createCreateSessionDto();
            const sessionId = service.createSession(ADMIN_ID, dto);
            service.joinSession(PLAYER_ID_1, createJoinSessionDto(sessionId));
            service.joinSession(PLAYER_ID_2, createJoinSessionDto(sessionId));

            const players = service.getPlayersSession(sessionId);

            expect(players).toHaveLength(EXPECTED_PLAYERS_COUNT);
            expect(players.some((p) => p.id === ADMIN_ID)).toBe(true);
            expect(players.some((p) => p.id === PLAYER_ID_1)).toBe(true);
            expect(players.some((p) => p.id === PLAYER_ID_2)).toBe(true);
        });
    });

    describe('chooseAvatar', () => {
        it('should assign avatar to player', () => {
            const dto = createCreateSessionDto();
            const sessionId = service.createSession(ADMIN_ID, dto);
            service.joinSession(PLAYER_ID_1, createJoinSessionDto(sessionId));

            service.chooseAvatar(sessionId, PLAYER_ID_1, Avatar.Avatar5);

            const avatars = service.getChosenAvatars(sessionId);
            const avatar = avatars.find((a) => a.avatar === Avatar.Avatar5);
            expect(avatar?.chosenBy).toBe(PLAYER_ID_1);
        });

        it('should release previous avatar when choosing new one', () => {
            const dto = createCreateSessionDto();
            const sessionId = service.createSession(ADMIN_ID, dto);
            service.joinSession(PLAYER_ID_1, createJoinSessionDto(sessionId));
            service.chooseAvatar(sessionId, PLAYER_ID_1, Avatar.Avatar3);

            service.chooseAvatar(sessionId, PLAYER_ID_1, Avatar.Avatar7);

            const avatars = service.getChosenAvatars(sessionId);
            const previousAvatar = avatars.find((a) => a.avatar === Avatar.Avatar3);
            const newAvatar = avatars.find((a) => a.avatar === Avatar.Avatar7);
            expect(previousAvatar?.chosenBy).toBeNull();
            expect(newAvatar?.chosenBy).toBe(PLAYER_ID_1);
        });
    });

    describe('getChosenAvatars', () => {
        it('should return all avatar assignments', () => {
            const dto = createCreateSessionDto();
            const sessionId = service.createSession(ADMIN_ID, dto);

            const avatars = service.getChosenAvatars(sessionId);

            expect(avatars).toBeDefined();
            expect(avatars.length).toBeGreaterThan(0);
        });
    });

    describe('lock', () => {
        it('should lock session and emit availabilityChanged event', () => {
            const dto = createCreateSessionDto();
            const sessionId = service.createSession(ADMIN_ID, dto);

            service.lock(sessionId);

            expect(service.isRoomLocked(sessionId)).toBe(true);
            expect(mockEventEmitter.emit).toHaveBeenCalledWith(ServerEvents.SessionAvailabilityChanged);
        });

        it('should throw error when locking non-existent session', () => {
            expect(() => service.lock('non-existent-session')).toThrow('Session non trouvée');
        });

        it('should throw error with session ID when getSession returns null', () => {
            const sessionId = 'test-session';
            jest.spyOn(service, 'getSession').mockReturnValue(null as unknown as ReturnType<typeof service.getSession>);

            expect(() => service.lock(sessionId)).toThrow(`Session ${sessionId} introuvable`);
        });
    });

    describe('unlock', () => {
        it('should unlock session and emit availabilityChanged event', () => {
            const dto = createCreateSessionDto();
            const sessionId = service.createSession(ADMIN_ID, dto);
            service.lock(sessionId);

            service.unlock(sessionId);

            expect(service.isRoomLocked(sessionId)).toBe(false);
            expect(mockEventEmitter.emit).toHaveBeenCalledWith(ServerEvents.SessionAvailabilityChanged);
        });
    });

    describe('isRoomLocked', () => {
        it('should return false for unlocked session', () => {
            const dto = createCreateSessionDto();
            const sessionId = service.createSession(ADMIN_ID, dto);

            expect(service.isRoomLocked(sessionId)).toBe(false);
        });

        it('should return true for locked session', () => {
            const dto = createCreateSessionDto();
            const sessionId = service.createSession(ADMIN_ID, dto);
            service.lock(sessionId);

            expect(service.isRoomLocked(sessionId)).toBe(true);
        });
    });

    describe('isAdmin', () => {
        it('should return true for admin player', () => {
            const dto = createCreateSessionDto();
            service.createSession(ADMIN_ID, dto);

            expect(service.isAdmin(ADMIN_ID)).toBe(true);
        });

        it('should return true when admin is in second session', () => {
            const dto = createCreateSessionDto();
            service.createSession('admin-1', dto);
            service.createSession(ADMIN_ID, dto);

            expect(service.isAdmin(ADMIN_ID)).toBe(true);
        });

        it('should return false for non-admin player', () => {
            const dto = createCreateSessionDto();
            const sessionId = service.createSession(ADMIN_ID, dto);
            service.joinSession(PLAYER_ID_1, createJoinSessionDto(sessionId));

            expect(service.isAdmin(PLAYER_ID_1)).toBe(false);
        });

        it('should return false for non-existent player', () => {
            expect(service.isAdmin('non-existent-player')).toBe(false);
        });
    });

    describe('kickPlayer', () => {
        it('should remove player from session', () => {
            const dto = createCreateSessionDto();
            const sessionId = service.createSession(ADMIN_ID, dto);
            service.joinSession(PLAYER_ID_1, createJoinSessionDto(sessionId));

            service.kickPlayer(sessionId, PLAYER_ID_1);

            const session = service.getSession(sessionId);
            expect(session.players).toHaveLength(1);
            expect(session.players.some((p) => p.id === PLAYER_ID_1)).toBe(false);
        });

        it('should release avatar when player is kicked', () => {
            const dto = createCreateSessionDto();
            const sessionId = service.createSession(ADMIN_ID, dto);
            service.joinSession(PLAYER_ID_1, createJoinSessionDto(sessionId));
            service.chooseAvatar(sessionId, PLAYER_ID_1, Avatar.Avatar4);

            service.kickPlayer(sessionId, PLAYER_ID_1);

            const avatars = service.getChosenAvatars(sessionId);
            const avatar = avatars.find((a) => a.avatar === Avatar.Avatar4);
            expect(avatar?.chosenBy).toBeNull();
        });
    });

    describe('getSession', () => {
        it('should return session for valid session ID', () => {
            const dto = createCreateSessionDto();
            const sessionId = service.createSession(ADMIN_ID, dto);

            const session = service.getSession(sessionId);

            expect(session).toBeDefined();
            expect(session.id).toBe(sessionId);
        });

        it('should throw error for non-existent session', () => {
            expect(() => service.getSession('non-existent-session')).toThrow('Session non trouvée');
        });
    });

    describe('getAvailableSessions', () => {
        it('should return only unlocked sessions', () => {
            const dto = createCreateSessionDto();
            const sessionId1 = service.createSession(ADMIN_ID, dto);
            const sessionId2 = service.createSession('admin-2', dto);
            service.lock(sessionId1);

            const availableSessions = service.getAvailableSessions();

            expect(availableSessions.length).toBe(1);
            expect(availableSessions[0].id).toBe(sessionId2);
        });

        it('should return session preview with correct data', () => {
            const dto = createCreateSessionDto({ maxPlayers: MAX_PLAYERS_TEST });
            const sessionId = service.createSession(ADMIN_ID, dto);
            service.joinSession(PLAYER_ID_1, createJoinSessionDto(sessionId));

            const availableSessions = service.getAvailableSessions();

            expect(availableSessions).toHaveLength(1);
            expect(availableSessions[0].id).toBe(sessionId);
            expect(availableSessions[0].currentPlayers).toBe(2);
            expect(availableSessions[0].maxPlayers).toBe(MAX_PLAYERS_TEST);
        });

        it('should return empty array when no sessions available', () => {
            const availableSessions = service.getAvailableSessions();

            expect(availableSessions).toEqual([]);
        });
    });

    describe('releaseAvatar', () => {
        it('should release avatar when called directly', () => {
            const dto = createCreateSessionDto();
            const sessionId = service.createSession(ADMIN_ID, dto);
            service.joinSession(PLAYER_ID_1, createJoinSessionDto(sessionId));
            service.chooseAvatar(sessionId, PLAYER_ID_1, Avatar.Avatar6);

            service.releaseAvatar(sessionId, PLAYER_ID_1);

            const avatars = service.getChosenAvatars(sessionId);
            const avatar = avatars.find((a) => a.avatar === Avatar.Avatar6);
            expect(avatar?.chosenBy).toBeNull();
        });

        it('should not throw error when session does not exist', () => {
            expect(() => service.releaseAvatar('non-existent-session', PLAYER_ID_1)).not.toThrow();
        });
    });
});