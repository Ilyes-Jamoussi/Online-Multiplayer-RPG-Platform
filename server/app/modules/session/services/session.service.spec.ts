/* eslint-disable max-lines -- Test file with comprehensive test coverage */
import { ACCESS_CODE_LENGTH } from '@app/constants/session.constants';
import { BASE_STAT_VALUE, BONUS_VALUE, RANDOM_THRESHOLD, VIRTUAL_PLAYER_NAMES } from '@app/constants/virtual-player.constants';
import { ServerEvents } from '@app/enums/server-events.enum';
import { ChatService } from '@app/modules/chat/services/chat.service';
import { CreateSessionDto } from '@app/modules/session/dto/create-session.dto';
import { JoinSessionDto } from '@app/modules/session/dto/join-session.dto';
import { SessionService } from '@app/modules/session/services/session.service';
import { Avatar } from '@common/enums/avatar.enum';
import { Dice } from '@common/enums/dice.enum';
import { GameMode } from '@common/enums/game-mode.enum';
import { VirtualPlayerType } from '@common/enums/virtual-player-type.enum';
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
    const ZERO = 0;
    const ONE = 1;
    const TWO = 2;
    const RANDOM_OFFSET_ABOVE_THRESHOLD = 0.1;
    const RANDOM_OFFSET_BELOW_THRESHOLD = 0.1;
    const MOCK_DATE_NOW_1 = 1234567890;
    const MOCK_DATE_NOW_2 = 1234567891;
    const MOCK_RANDOM_VALUE_1 = 0.123;
    const MOCK_RANDOM_VALUE_2 = 0.456;

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
        baseDefense: 5,
        defenseBonus: 0,
        baseSpeed: 5,
        speedBonus: 0,
        speed: 5,
        actionsRemaining: 1,
        hasCombatBonus: false,
        boatSpeedBonus: 0,
        boatSpeed: 0,
        ...overrides,
    });

    const createCreateSessionDto = (overrides: Partial<CreateSessionDto> = {}): CreateSessionDto => ({
        gameId: GAME_ID,
        maxPlayers: MAX_PLAYERS,
        mode: GameMode.CLASSIC,
        player: createMockPlayerDto({ isAdmin: true, ...overrides.player }),
        ...overrides,
    });

    const createJoinSessionDto = (sessionId: string, overrides: Partial<JoinSessionDto> = {}): JoinSessionDto => ({
        sessionId,
        player: createMockPlayerDto(overrides.player),
        ...overrides,
    });

    const expectVirtualPlayerBaseStats = (virtualPlayer: ReturnType<typeof service.addVirtualPlayer>[number] | undefined): void => {
        expectBaseStats(virtualPlayer);
        expectBonusStats(virtualPlayer);
        expectPositionStats(virtualPlayer);
        expectCombatStats(virtualPlayer);
        expectBoatStats(virtualPlayer);
    };

    const expectBaseStats = (virtualPlayer: ReturnType<typeof service.addVirtualPlayer>[number] | undefined): void => {
        expect(virtualPlayer?.baseHealth).toBe(BASE_STAT_VALUE);
        expect(virtualPlayer?.baseSpeed).toBe(BASE_STAT_VALUE);
        expect(virtualPlayer?.baseAttack).toBe(BASE_STAT_VALUE);
        expect(virtualPlayer?.baseDefense).toBe(BASE_STAT_VALUE);
    };

    const expectBonusStats = (virtualPlayer: ReturnType<typeof service.addVirtualPlayer>[number] | undefined): void => {
        expect(virtualPlayer?.attackBonus).toBe(ZERO);
        expect(virtualPlayer?.defenseBonus).toBe(ZERO);
    };

    const expectPositionStats = (virtualPlayer: ReturnType<typeof service.addVirtualPlayer>[number] | undefined): void => {
        expect(virtualPlayer?.x).toBe(ZERO);
        expect(virtualPlayer?.y).toBe(ZERO);
        expect(virtualPlayer?.isInGame).toBe(false);
        expect(virtualPlayer?.startPointId).toBe('');
        expect(virtualPlayer?.actionsRemaining).toBe(ONE);
    };

    const expectCombatStats = (virtualPlayer: ReturnType<typeof service.addVirtualPlayer>[number] | undefined): void => {
        expect(virtualPlayer?.combatCount).toBe(ZERO);
        expect(virtualPlayer?.combatWins).toBe(ZERO);
        expect(virtualPlayer?.combatLosses).toBe(ZERO);
        expect(virtualPlayer?.combatDraws).toBe(ZERO);
        expect(virtualPlayer?.hasCombatBonus).toBe(false);
    };

    const expectBoatStats = (virtualPlayer: ReturnType<typeof service.addVirtualPlayer>[number] | undefined): void => {
        expect(virtualPlayer?.boatSpeedBonus).toBe(ZERO);
        expect(virtualPlayer?.boatSpeed).toBe(ZERO);
    };

    beforeEach(() => {
        mockEventEmitter = {
            emit: jest.fn(),
        } as unknown as jest.Mocked<EventEmitter2>;

        const mockChatService = {
            createChat: jest.fn().mockReturnValue('chat1'),
            deleteChat: jest.fn(),
        };

        const mockGameModel = {
            findById: jest.fn().mockReturnValue({
                lean: jest.fn().mockResolvedValue({
                    name: 'Test Game',
                    description: 'Test Description',
                    size: { width: 100, height: 100 },
                    mode: 'classic',
                }),
            }),
        };

        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Mock object for testing
        service = new SessionService(mockEventEmitter, mockChatService as unknown as ChatService, mockGameModel as any);
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

            const result = service.createSession(ADMIN_ID, dto);

            expect(result).toBeDefined();
            expect(result.sessionId.length).toBe(ACCESS_CODE_LENGTH);
            expect(mockEventEmitter.emit).toHaveBeenCalledWith(ServerEvents.SessionAvailabilityChanged);
        });

        it('should create session with admin player', () => {
            const dto = createCreateSessionDto();
            const playerName = 'AdminPlayer';

            const result = service.createSession(ADMIN_ID, {
                ...dto,
                player: createMockPlayerDto({ name: playerName, isAdmin: true }),
            });

            const session = service.getSession(result.sessionId);
            expect(session.players).toHaveLength(1);
            expect(session.players[0].id).toBe(ADMIN_ID);
            expect(session.players[0].name).toBe(playerName);
            expect(session.players[0].isAdmin).toBe(true);
        });

        it('should initialize avatar assignments with admin avatar selected', () => {
            const dto = createCreateSessionDto({
                player: createMockPlayerDto({ avatar: Avatar.Avatar3, isAdmin: true }),
            });

            const result = service.createSession(ADMIN_ID, dto);
            const session = service.getSession(result.sessionId);

            const adminAvatar = session.avatarAssignments.find((a) => a.chosenBy === ADMIN_ID);
            expect(adminAvatar).toBeDefined();
            expect(adminAvatar?.avatar).toBe(Avatar.Avatar3);
        });

        it('should create unique session IDs', () => {
            const dto = createCreateSessionDto();
            const sessionIds = new Set<string>();

            for (let i = 0; i < TEST_ITERATIONS; i++) {
                const result = service.createSession(`${ADMIN_ID}-${i}`, dto);
                expect(sessionIds.has(result.sessionId)).toBe(false);
                sessionIds.add(result.sessionId);
            }
        });

        it('should set session properties correctly', () => {
            const dto = createCreateSessionDto({ maxPlayers: MAX_PLAYERS_TEST });

            const result = service.createSession(ADMIN_ID, dto);
            const session = service.getSession(result.sessionId);

            expect(session.gameId).toBe(GAME_ID);
            expect(session.maxPlayers).toBe(MAX_PLAYERS_TEST);
            expect(session.isRoomLocked).toBe(false);
            expect(session.id).toBe(result.sessionId);
        });
    });

    describe('endSession', () => {
        it('should delete session and emit availabilityChanged event', () => {
            const dto = createCreateSessionDto();
            const result = service.createSession(ADMIN_ID, dto);

            service.endSession(result.sessionId);

            expect(() => service.getSession(result.sessionId)).toThrow('Session non trouvée');
            expect(mockEventEmitter.emit).toHaveBeenCalledWith(ServerEvents.SessionAvailabilityChanged);
        });
    });

    describe('joinSession', () => {
        it('should add player to session', () => {
            const dto = createCreateSessionDto();
            const result = service.createSession(ADMIN_ID, dto);
            const joinDto = createJoinSessionDto(result.sessionId, {
                player: createMockPlayerDto({ name: 'NewPlayer' }),
            });

            const uniqueName = service.joinSession(PLAYER_ID_1, joinDto);

            const session = service.getSession(result.sessionId);
            expect(session.players).toHaveLength(2);
            expect(session.players.some((p) => p.id === PLAYER_ID_1)).toBe(true);
            expect(uniqueName).toBe('NewPlayer');
        });

        it('should generate unique name when name already exists', () => {
            const dto = createCreateSessionDto();
            const result = service.createSession(ADMIN_ID, {
                ...dto,
                player: createMockPlayerDto({ name: 'Player', isAdmin: true }),
            });
            const joinDto1 = createJoinSessionDto(result.sessionId, {
                player: createMockPlayerDto({ name: 'Player' }),
            });
            const joinDto2 = createJoinSessionDto(result.sessionId, {
                player: createMockPlayerDto({ name: 'Player' }),
            });

            const name1 = service.joinSession(PLAYER_ID_1, joinDto1);
            const name2 = service.joinSession(PLAYER_ID_2, joinDto2);

            expect(name1).toBe('Player-2');
            expect(name2).toBe('Player-3');
        });

        it('should auto-lock session when max players reached', () => {
            const dto = createCreateSessionDto({ maxPlayers: 2 });
            const result = service.createSession(ADMIN_ID, dto);
            const joinDto = createJoinSessionDto(result.sessionId);

            service.joinSession(PLAYER_ID_1, joinDto);

            expect(service.isRoomLocked(result.sessionId)).toBe(true);
            expect(mockEventEmitter.emit).toHaveBeenCalledWith(ServerEvents.SessionAutoLocked, result.sessionId);
        });

        it('should not auto-lock when session not full', () => {
            const dto = createCreateSessionDto({ maxPlayers: 4 });
            const result = service.createSession(ADMIN_ID, dto);
            const joinDto = createJoinSessionDto(result.sessionId);

            service.joinSession(PLAYER_ID_1, joinDto);

            expect(service.isRoomLocked(result.sessionId)).toBe(false);
            expect(mockEventEmitter.emit).not.toHaveBeenCalledWith(ServerEvents.SessionAutoLocked, expect.anything());
        });

        it('should initialize player with default game values', () => {
            const dto = createCreateSessionDto();
            const result = service.createSession(ADMIN_ID, dto);
            const joinDto = createJoinSessionDto(result.sessionId);

            service.joinSession(PLAYER_ID_1, joinDto);

            const session = service.getSession(result.sessionId);
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
            const result = service.createSession(ADMIN_ID, dto);
            const joinDto = createJoinSessionDto(result.sessionId);
            service.joinSession(PLAYER_ID_1, joinDto);

            service.leaveSession(result.sessionId, PLAYER_ID_1);

            const session = service.getSession(result.sessionId);
            expect(session.players).toHaveLength(1);
            expect(session.players.some((p) => p.id === PLAYER_ID_1)).toBe(false);
        });

        it('should release avatar when player leaves', () => {
            const dto = createCreateSessionDto();
            const result = service.createSession(ADMIN_ID, dto);
            const joinDto = createJoinSessionDto(result.sessionId);
            service.joinSession(PLAYER_ID_1, joinDto);
            service.chooseAvatar(result.sessionId, PLAYER_ID_1, Avatar.Avatar2);

            service.leaveSession(result.sessionId, PLAYER_ID_1);

            const avatars = service.getChosenAvatars(result.sessionId);
            const avatar = avatars.find((a) => a.avatar === Avatar.Avatar2);
            expect(avatar?.chosenBy).toBeNull();
        });
    });

    describe('isSessionFull', () => {
        it('should return false when session is not full', () => {
            const dto = createCreateSessionDto({ maxPlayers: 4 });
            const result = service.createSession(ADMIN_ID, dto);
            service.joinSession(PLAYER_ID_1, createJoinSessionDto(result.sessionId));

            expect(service.isSessionFull(result.sessionId)).toBe(false);
        });

        it('should return true when session is full', () => {
            const dto = createCreateSessionDto({ maxPlayers: 2 });
            const result = service.createSession(ADMIN_ID, dto);
            service.joinSession(PLAYER_ID_1, createJoinSessionDto(result.sessionId));

            expect(service.isSessionFull(result.sessionId)).toBe(true);
        });
    });

    describe('getPlayerSessionId', () => {
        it('should return session ID for existing player', () => {
            const dto = createCreateSessionDto();
            const result = service.createSession(ADMIN_ID, dto);
            service.joinSession(PLAYER_ID_1, createJoinSessionDto(result.sessionId));

            const foundSessionId = service.getPlayerSessionId(PLAYER_ID_1);

            expect(foundSessionId).toBe(result.sessionId);
        });

        it('should return session ID when player is in second session', () => {
            const dto = createCreateSessionDto();
            service.createSession(ADMIN_ID, dto);
            const result2 = service.createSession('admin-2', dto);
            service.joinSession(PLAYER_ID_1, createJoinSessionDto(result2.sessionId));

            const foundSessionId = service.getPlayerSessionId(PLAYER_ID_1);

            expect(foundSessionId).toBe(result2.sessionId);
        });

        it('should return null for non-existent player', () => {
            const result = service.getPlayerSessionId('non-existent-player');

            expect(result).toBeNull();
        });
    });

    describe('getPlayersSession', () => {
        it('should return all players in session', () => {
            const dto = createCreateSessionDto();
            const result = service.createSession(ADMIN_ID, dto);
            service.joinSession(PLAYER_ID_1, createJoinSessionDto(result.sessionId));
            service.joinSession(PLAYER_ID_2, createJoinSessionDto(result.sessionId));

            const players = service.getPlayersSession(result.sessionId);

            expect(players).toHaveLength(EXPECTED_PLAYERS_COUNT);
            expect(players.some((p) => p.id === ADMIN_ID)).toBe(true);
            expect(players.some((p) => p.id === PLAYER_ID_1)).toBe(true);
            expect(players.some((p) => p.id === PLAYER_ID_2)).toBe(true);
        });
    });

    describe('chooseAvatar', () => {
        it('should assign avatar to player', () => {
            const dto = createCreateSessionDto();
            const result = service.createSession(ADMIN_ID, dto);
            service.joinSession(PLAYER_ID_1, createJoinSessionDto(result.sessionId));

            service.chooseAvatar(result.sessionId, PLAYER_ID_1, Avatar.Avatar5);

            const avatars = service.getChosenAvatars(result.sessionId);
            const avatar = avatars.find((a) => a.avatar === Avatar.Avatar5);
            expect(avatar?.chosenBy).toBe(PLAYER_ID_1);
        });

        it('should release previous avatar when choosing new one', () => {
            const dto = createCreateSessionDto();
            const result = service.createSession(ADMIN_ID, dto);
            service.joinSession(PLAYER_ID_1, createJoinSessionDto(result.sessionId));
            service.chooseAvatar(result.sessionId, PLAYER_ID_1, Avatar.Avatar3);

            service.chooseAvatar(result.sessionId, PLAYER_ID_1, Avatar.Avatar7);

            const avatars = service.getChosenAvatars(result.sessionId);
            const previousAvatar = avatars.find((a) => a.avatar === Avatar.Avatar3);
            const newAvatar = avatars.find((a) => a.avatar === Avatar.Avatar7);
            expect(previousAvatar?.chosenBy).toBeNull();
            expect(newAvatar?.chosenBy).toBe(PLAYER_ID_1);
        });
    });

    describe('getChosenAvatars', () => {
        it('should return all avatar assignments', () => {
            const dto = createCreateSessionDto();
            const result = service.createSession(ADMIN_ID, dto);

            const avatars = service.getChosenAvatars(result.sessionId);

            expect(avatars).toBeDefined();
            expect(avatars.length).toBeGreaterThan(0);
        });
    });

    describe('lock', () => {
        it('should lock session and emit availabilityChanged event', () => {
            const dto = createCreateSessionDto();
            const result = service.createSession(ADMIN_ID, dto);

            service.lock(result.sessionId);

            expect(service.isRoomLocked(result.sessionId)).toBe(true);
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
            const result = service.createSession(ADMIN_ID, dto);
            service.lock(result.sessionId);

            service.unlock(result.sessionId);

            expect(service.isRoomLocked(result.sessionId)).toBe(false);
            expect(mockEventEmitter.emit).toHaveBeenCalledWith(ServerEvents.SessionAvailabilityChanged);
        });
    });

    describe('isRoomLocked', () => {
        it('should return false for unlocked session', () => {
            const dto = createCreateSessionDto();
            const result = service.createSession(ADMIN_ID, dto);

            expect(service.isRoomLocked(result.sessionId)).toBe(false);
        });

        it('should return true for locked session', () => {
            const dto = createCreateSessionDto();
            const result = service.createSession(ADMIN_ID, dto);
            service.lock(result.sessionId);

            expect(service.isRoomLocked(result.sessionId)).toBe(true);
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
            const result = service.createSession(ADMIN_ID, dto);
            service.joinSession(PLAYER_ID_1, createJoinSessionDto(result.sessionId));

            expect(service.isAdmin(PLAYER_ID_1)).toBe(false);
        });

        it('should return false for non-existent player', () => {
            expect(service.isAdmin('non-existent-player')).toBe(false);
        });
    });

    describe('kickPlayer', () => {
        it('should remove player from session', () => {
            const dto = createCreateSessionDto();
            const result = service.createSession(ADMIN_ID, dto);
            service.joinSession(PLAYER_ID_1, createJoinSessionDto(result.sessionId));

            service.kickPlayer(result.sessionId, PLAYER_ID_1);

            const session = service.getSession(result.sessionId);
            expect(session.players).toHaveLength(1);
            expect(session.players.some((p) => p.id === PLAYER_ID_1)).toBe(false);
        });

        it('should release avatar when player is kicked', () => {
            const dto = createCreateSessionDto();
            const result = service.createSession(ADMIN_ID, dto);
            service.joinSession(PLAYER_ID_1, createJoinSessionDto(result.sessionId));
            service.chooseAvatar(result.sessionId, PLAYER_ID_1, Avatar.Avatar4);

            service.kickPlayer(result.sessionId, PLAYER_ID_1);

            const avatars = service.getChosenAvatars(result.sessionId);
            const avatar = avatars.find((a) => a.avatar === Avatar.Avatar4);
            expect(avatar?.chosenBy).toBeNull();
        });
    });

    describe('getSession', () => {
        it('should return session for valid session ID', () => {
            const dto = createCreateSessionDto();
            const result = service.createSession(ADMIN_ID, dto);

            const session = service.getSession(result.sessionId);

            expect(session).toBeDefined();
            expect(session.id).toBe(result.sessionId);
        });

        it('should throw error for non-existent session', () => {
            expect(() => service.getSession('non-existent-session')).toThrow('Session non trouvée');
        });
    });

    describe('getAvailableSessions', () => {
        it('should return only unlocked sessions', async () => {
            const dto = createCreateSessionDto();
            const result1 = service.createSession(ADMIN_ID, dto);
            const result2 = service.createSession('admin-2', dto);
            service.lock(result1.sessionId);

            const availableSessions = await service.getAvailableSessions();

            expect(availableSessions.length).toBe(1);
            expect(availableSessions[0].id).toBe(result2.sessionId);
        });

        it('should return session preview with correct data', async () => {
            const dto = createCreateSessionDto({ maxPlayers: MAX_PLAYERS_TEST });
            const result = service.createSession(ADMIN_ID, dto);
            service.joinSession(PLAYER_ID_1, createJoinSessionDto(result.sessionId));

            const availableSessions = await service.getAvailableSessions();

            expect(availableSessions).toHaveLength(1);
            expect(availableSessions[0].id).toBe(result.sessionId);
            expect(availableSessions[0].currentPlayers).toBe(2);
            expect(availableSessions[0].maxPlayers).toBe(MAX_PLAYERS_TEST);
        });

        it('should return empty array when no sessions available', async () => {
            const availableSessions = await service.getAvailableSessions();

            expect(availableSessions).toEqual([]);
        });
    });

    describe('releaseAvatar', () => {
        it('should release avatar when called directly', () => {
            const dto = createCreateSessionDto();
            const result = service.createSession(ADMIN_ID, dto);
            service.joinSession(PLAYER_ID_1, createJoinSessionDto(result.sessionId));
            service.chooseAvatar(result.sessionId, PLAYER_ID_1, Avatar.Avatar6);

            service.releaseAvatar(result.sessionId, PLAYER_ID_1);

            const avatars = service.getChosenAvatars(result.sessionId);
            const avatar = avatars.find((a) => a.avatar === Avatar.Avatar6);
            expect(avatar?.chosenBy).toBeNull();
        });

        it('should not throw error when session does not exist', () => {
            expect(() => service.releaseAvatar('non-existent-session', PLAYER_ID_1)).not.toThrow();
        });
    });

    describe('addVirtualPlayer', () => {
        it('should add virtual player to session', () => {
            const dto = createCreateSessionDto();
            const result = service.createSession(ADMIN_ID, dto);
            jest.spyOn(Math, 'random')
                .mockReturnValueOnce(ZERO)
                .mockReturnValueOnce(ZERO)
                .mockReturnValueOnce(RANDOM_THRESHOLD + RANDOM_OFFSET_ABOVE_THRESHOLD)
                .mockReturnValueOnce(RANDOM_THRESHOLD - RANDOM_OFFSET_BELOW_THRESHOLD);

            const players = service.addVirtualPlayer(result.sessionId, VirtualPlayerType.Offensive);

            expect(players.length).toBe(TWO);
            const virtualPlayer = players.find((p) => p.virtualPlayerType === VirtualPlayerType.Offensive);
            expect(virtualPlayer).toBeDefined();
            expect(virtualPlayer?.isAdmin).toBe(false);
        });

        it('should select avatar for virtual player', () => {
            const dto = createCreateSessionDto();
            const result = service.createSession(ADMIN_ID, dto);
            jest.spyOn(Math, 'random')
                .mockReturnValueOnce(ZERO)
                .mockReturnValueOnce(ZERO)
                .mockReturnValueOnce(RANDOM_THRESHOLD + RANDOM_OFFSET_ABOVE_THRESHOLD)
                .mockReturnValueOnce(RANDOM_THRESHOLD - RANDOM_OFFSET_BELOW_THRESHOLD);

            service.addVirtualPlayer(result.sessionId, VirtualPlayerType.Offensive);

            const avatars = service.getChosenAvatars(result.sessionId);
            const assignedAvatar = avatars.find((a) => a.chosenBy && a.chosenBy.startsWith('virtual-'));
            expect(assignedAvatar).toBeDefined();
        });

        it('should return updated players array', () => {
            const dto = createCreateSessionDto();
            const result = service.createSession(ADMIN_ID, dto);
            jest.spyOn(Math, 'random')
                .mockReturnValueOnce(ZERO)
                .mockReturnValueOnce(ZERO)
                .mockReturnValueOnce(RANDOM_THRESHOLD + RANDOM_OFFSET_ABOVE_THRESHOLD)
                .mockReturnValueOnce(RANDOM_THRESHOLD - RANDOM_OFFSET_BELOW_THRESHOLD);

            const players = service.addVirtualPlayer(result.sessionId, VirtualPlayerType.Defensive);

            expect(players.length).toBe(TWO);
            expect(players).toBe(service.getPlayersSession(result.sessionId));
        });

        it('should create virtual player with available name from list', () => {
            const dto = createCreateSessionDto();
            const result = service.createSession(ADMIN_ID, dto);
            jest.spyOn(Math, 'random')
                .mockReturnValueOnce(ZERO)
                .mockReturnValueOnce(ZERO)
                .mockReturnValueOnce(RANDOM_THRESHOLD + RANDOM_OFFSET_ABOVE_THRESHOLD)
                .mockReturnValueOnce(RANDOM_THRESHOLD - RANDOM_OFFSET_BELOW_THRESHOLD);

            const players = service.addVirtualPlayer(result.sessionId, VirtualPlayerType.Offensive);

            const virtualPlayer = players.find((p) => p.virtualPlayerType);
            expect(virtualPlayer).toBeDefined();
            expect(VIRTUAL_PLAYER_NAMES).toContain(virtualPlayer?.name);
        });

        it('should use fallback name when all names are taken', () => {
            const dto = createCreateSessionDto();
            const result = service.createSession(ADMIN_ID, dto);
            VIRTUAL_PLAYER_NAMES.forEach((name, index) => {
                service.joinSession(
                    `player-${index}`,
                    createJoinSessionDto(result.sessionId, {
                        player: createMockPlayerDto({ name }),
                    }),
                );
            });
            jest.spyOn(Math, 'random')
                .mockReturnValueOnce(ZERO)
                .mockReturnValueOnce(ZERO)
                .mockReturnValueOnce(RANDOM_THRESHOLD + RANDOM_OFFSET_ABOVE_THRESHOLD)
                .mockReturnValueOnce(RANDOM_THRESHOLD - RANDOM_OFFSET_BELOW_THRESHOLD);
            jest.spyOn(Date, 'now').mockReturnValue(MOCK_DATE_NOW_1);

            const players = service.addVirtualPlayer(result.sessionId, VirtualPlayerType.Offensive);

            const virtualPlayer = players.find((p) => p.virtualPlayerType);
            expect(virtualPlayer?.name).toBe(`Bot-${MOCK_DATE_NOW_1}`);
        });

        it('should select available avatar', () => {
            const dto = createCreateSessionDto();
            const result = service.createSession(ADMIN_ID, dto);
            const allAvatars = Object.values(Avatar);
            allAvatars.slice(0, allAvatars.length - ONE).forEach((avatar, index) => {
                service.joinSession(`player-${index}`, createJoinSessionDto(result.sessionId));
                service.chooseAvatar(result.sessionId, `player-${index}`, avatar);
            });
            jest.spyOn(Math, 'random')
                .mockReturnValueOnce(ZERO)
                .mockReturnValueOnce(ZERO)
                .mockReturnValueOnce(RANDOM_THRESHOLD + RANDOM_OFFSET_ABOVE_THRESHOLD)
                .mockReturnValueOnce(RANDOM_THRESHOLD - RANDOM_OFFSET_BELOW_THRESHOLD);

            const players = service.addVirtualPlayer(result.sessionId, VirtualPlayerType.Offensive);

            const virtualPlayer = players.find((p) => p.virtualPlayerType);
            expect(virtualPlayer?.avatar).toBeDefined();
            expect(virtualPlayer?.avatar).not.toBeNull();
        });

        it('should assign D4 attack dice when random is above threshold', () => {
            const dto = createCreateSessionDto();
            const result = service.createSession(ADMIN_ID, dto);
            jest.spyOn(Math, 'random')
                .mockReturnValueOnce(ZERO)
                .mockReturnValueOnce(ZERO)
                .mockReturnValueOnce(RANDOM_THRESHOLD + RANDOM_OFFSET_ABOVE_THRESHOLD)
                .mockReturnValueOnce(RANDOM_THRESHOLD - RANDOM_OFFSET_BELOW_THRESHOLD);

            const players = service.addVirtualPlayer(result.sessionId, VirtualPlayerType.Offensive);

            const virtualPlayer = players.find((p) => p.virtualPlayerType);
            expect(virtualPlayer?.attackDice).toBe(Dice.D4);
            expect(virtualPlayer?.defenseDice).toBe(Dice.D6);
        });

        it('should assign D6 attack dice when random is below threshold', () => {
            const dto = createCreateSessionDto();
            const result = service.createSession(ADMIN_ID, dto);
            jest.spyOn(Math, 'random')
                .mockReturnValueOnce(ZERO)
                .mockReturnValueOnce(ZERO)
                .mockReturnValueOnce(RANDOM_THRESHOLD - RANDOM_OFFSET_BELOW_THRESHOLD)
                .mockReturnValueOnce(RANDOM_THRESHOLD - RANDOM_OFFSET_BELOW_THRESHOLD);

            const players = service.addVirtualPlayer(result.sessionId, VirtualPlayerType.Offensive);

            const virtualPlayer = players.find((p) => p.virtualPlayerType);
            expect(virtualPlayer?.attackDice).toBe(Dice.D6);
            expect(virtualPlayer?.defenseDice).toBe(Dice.D4);
        });

        it('should assign health bonus when random is above threshold', () => {
            const dto = createCreateSessionDto();
            const result = service.createSession(ADMIN_ID, dto);
            jest.spyOn(Math, 'random')
                .mockReturnValueOnce(ZERO)
                .mockReturnValueOnce(ZERO)
                .mockReturnValueOnce(RANDOM_THRESHOLD - RANDOM_OFFSET_BELOW_THRESHOLD)
                .mockReturnValueOnce(RANDOM_THRESHOLD + RANDOM_OFFSET_ABOVE_THRESHOLD);

            const players = service.addVirtualPlayer(result.sessionId, VirtualPlayerType.Offensive);

            const virtualPlayer = players.find((p) => p.virtualPlayerType);
            expect(virtualPlayer?.healthBonus).toBe(BONUS_VALUE);
            expect(virtualPlayer?.speedBonus).toBe(ZERO);
            expect(virtualPlayer?.health).toBe(BASE_STAT_VALUE + BONUS_VALUE);
            expect(virtualPlayer?.maxHealth).toBe(BASE_STAT_VALUE + BONUS_VALUE);
            expect(virtualPlayer?.baseHealth).toBe(BASE_STAT_VALUE);
            expect(virtualPlayer?.isAdmin).toBe(false);
            expect(virtualPlayer?.id).toMatch(/^virtual-/);
            expect(virtualPlayer?.name).toBeDefined();
            expect(virtualPlayer?.avatar).toBeDefined();
        });

        it('should assign speed bonus when health bonus is zero', () => {
            const dto = createCreateSessionDto();
            const result = service.createSession(ADMIN_ID, dto);
            jest.spyOn(Math, 'random')
                .mockReturnValueOnce(ZERO)
                .mockReturnValueOnce(ZERO)
                .mockReturnValueOnce(RANDOM_THRESHOLD - RANDOM_OFFSET_BELOW_THRESHOLD)
                .mockReturnValueOnce(RANDOM_THRESHOLD - RANDOM_OFFSET_BELOW_THRESHOLD);

            const players = service.addVirtualPlayer(result.sessionId, VirtualPlayerType.Offensive);

            const virtualPlayer = players.find((p) => p.virtualPlayerType);
            expect(virtualPlayer?.healthBonus).toBe(ZERO);
            expect(virtualPlayer?.speedBonus).toBe(BONUS_VALUE);
            expect(virtualPlayer?.speed).toBe(BASE_STAT_VALUE + BONUS_VALUE);
            expect(virtualPlayer?.health).toBe(BASE_STAT_VALUE + ZERO);
            expect(virtualPlayer?.baseHealth).toBe(BASE_STAT_VALUE);
            expect(virtualPlayer?.isAdmin).toBe(false);
            expect(virtualPlayer?.id).toMatch(/^virtual-/);
            expect(virtualPlayer?.name).toBeDefined();
            expect(virtualPlayer?.avatar).toBeDefined();
        });

        it('should create virtual player with correct base stats', () => {
            const dto = createCreateSessionDto();
            const result = service.createSession(ADMIN_ID, dto);
            jest.spyOn(Math, 'random')
                .mockReturnValueOnce(ZERO)
                .mockReturnValueOnce(ZERO)
                .mockReturnValueOnce(RANDOM_THRESHOLD - RANDOM_OFFSET_BELOW_THRESHOLD)
                .mockReturnValueOnce(RANDOM_THRESHOLD - RANDOM_OFFSET_BELOW_THRESHOLD);

            const players = service.addVirtualPlayer(result.sessionId, VirtualPlayerType.Defensive);

            const virtualPlayer = players.find((p) => p.virtualPlayerType);
            expectVirtualPlayerBaseStats(virtualPlayer);
        });

        it('should create virtual player with correct virtualPlayerType', () => {
            const dto = createCreateSessionDto();
            const result = service.createSession(ADMIN_ID, dto);
            jest.spyOn(Math, 'random')
                .mockReturnValueOnce(ZERO)
                .mockReturnValueOnce(ZERO)
                .mockReturnValueOnce(RANDOM_THRESHOLD - RANDOM_OFFSET_BELOW_THRESHOLD)
                .mockReturnValueOnce(RANDOM_THRESHOLD - RANDOM_OFFSET_BELOW_THRESHOLD);

            const players = service.addVirtualPlayer(result.sessionId, VirtualPlayerType.Defensive);

            const virtualPlayer = players.find((p) => p.virtualPlayerType);
            expect(virtualPlayer?.virtualPlayerType).toBe(VirtualPlayerType.Defensive);
        });

        it('should create virtual player with unique ID', () => {
            const dto = createCreateSessionDto();
            const result = service.createSession(ADMIN_ID, dto);
            jest.spyOn(Date, 'now').mockReturnValue(MOCK_DATE_NOW_1);
            jest.spyOn(Math, 'random')
                .mockReturnValueOnce(ZERO)
                .mockReturnValueOnce(ZERO)
                .mockReturnValueOnce(RANDOM_THRESHOLD - RANDOM_OFFSET_BELOW_THRESHOLD)
                .mockReturnValueOnce(RANDOM_THRESHOLD - RANDOM_OFFSET_BELOW_THRESHOLD)
                .mockReturnValueOnce(MOCK_RANDOM_VALUE_1);

            const players1 = service.addVirtualPlayer(result.sessionId, VirtualPlayerType.Offensive);
            jest.spyOn(Date, 'now').mockReturnValue(MOCK_DATE_NOW_2);
            jest.spyOn(Math, 'random')
                .mockReturnValueOnce(ZERO)
                .mockReturnValueOnce(ZERO)
                .mockReturnValueOnce(RANDOM_THRESHOLD - RANDOM_OFFSET_BELOW_THRESHOLD)
                .mockReturnValueOnce(RANDOM_THRESHOLD - RANDOM_OFFSET_BELOW_THRESHOLD)
                .mockReturnValueOnce(MOCK_RANDOM_VALUE_2);
            const players2 = service.addVirtualPlayer(result.sessionId, VirtualPlayerType.Defensive);

            const virtualPlayer1 = players1.find((p) => p.virtualPlayerType === VirtualPlayerType.Offensive);
            const virtualPlayer2 = players2.find((p) => p.virtualPlayerType === VirtualPlayerType.Defensive);
            expect(virtualPlayer1?.id).not.toBe(virtualPlayer2?.id);
            expect(virtualPlayer1?.id).toMatch(/^virtual-/);
            expect(virtualPlayer2?.id).toMatch(/^virtual-/);
        });

        it('should create virtual player with all return object properties correctly set', () => {
            const dto = createCreateSessionDto();
            const result = service.createSession(ADMIN_ID, dto);
            jest.spyOn(Math, 'random')
                .mockReturnValueOnce(ZERO)
                .mockReturnValueOnce(ZERO)
                .mockReturnValueOnce(RANDOM_THRESHOLD + RANDOM_OFFSET_ABOVE_THRESHOLD)
                .mockReturnValueOnce(RANDOM_THRESHOLD + RANDOM_OFFSET_ABOVE_THRESHOLD);

            const players = service.addVirtualPlayer(result.sessionId, VirtualPlayerType.Offensive);

            const virtualPlayer = players.find((p) => p.virtualPlayerType);
            expect(virtualPlayer).toBeDefined();
            expect(virtualPlayer?.id).toBeDefined();
            expect(virtualPlayer?.id).toMatch(/^virtual-/);
            expect(virtualPlayer?.name).toBeDefined();
            expect(virtualPlayer?.avatar).toBeDefined();
            expect(virtualPlayer?.isAdmin).toBe(false);
            expect(virtualPlayer?.baseHealth).toBe(BASE_STAT_VALUE);
            expect(virtualPlayer?.healthBonus).toBe(BONUS_VALUE);
            expect(virtualPlayer?.health).toBe(BASE_STAT_VALUE + BONUS_VALUE);
        });

        it('should create virtual player with healthBonus zero and health calculated correctly', () => {
            const dto = createCreateSessionDto();
            const result = service.createSession(ADMIN_ID, dto);
            jest.spyOn(Math, 'random')
                .mockReturnValueOnce(ZERO)
                .mockReturnValueOnce(ZERO)
                .mockReturnValueOnce(RANDOM_THRESHOLD - RANDOM_OFFSET_BELOW_THRESHOLD)
                .mockReturnValueOnce(RANDOM_THRESHOLD - RANDOM_OFFSET_BELOW_THRESHOLD);

            const players = service.addVirtualPlayer(result.sessionId, VirtualPlayerType.Defensive);

            const virtualPlayer = players.find((p) => p.virtualPlayerType);
            expect(virtualPlayer).toBeDefined();
            expect(virtualPlayer?.id).toBeDefined();
            expect(virtualPlayer?.id).toMatch(/^virtual-/);
            expect(virtualPlayer?.name).toBeDefined();
            expect(virtualPlayer?.avatar).toBeDefined();
            expect(virtualPlayer?.isAdmin).toBe(false);
            expect(virtualPlayer?.baseHealth).toBe(BASE_STAT_VALUE);
            expect(virtualPlayer?.healthBonus).toBe(ZERO);
            expect(virtualPlayer?.health).toBe(BASE_STAT_VALUE + ZERO);
        });
    });
});
