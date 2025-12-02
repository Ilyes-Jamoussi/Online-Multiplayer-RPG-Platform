/* eslint-disable max-lines -- Test file with comprehensive test coverage */
import { MILLISECONDS_PER_SECOND, PERCENTAGE_MULTIPLIER, SECONDS_PER_MINUTE, STATISTICS_DELETE_DELAY_MS } from '@app/constants/statistics.constants';
import { TeleportedPayload } from '@app/modules/game-log/dto/game-log-payloads.dto';
import { GameTracker, TrackingService } from '@app/modules/in-game/services/tracking/tracking.service';
import { GameMode } from '@common/enums/game-mode.enum';
import { MapSize } from '@common/enums/map-size.enum';
import { Player } from '@common/interfaces/player.interface';
import { Position } from '@common/interfaces/position.interface';
import { InGameSession } from '@common/interfaces/session.interface';
import { Test, TestingModule } from '@nestjs/testing';
import { StatisticsService } from './statistics.service';

describe('StatisticsService', () => {
    let service: StatisticsService;
    let trackingService: jest.Mocked<TrackingService>;

    const SESSION_ID = 'session-123';
    const PLAYER_ID_1 = 'player-1';
    const PLAYER_ID_2 = 'player-2';
    const PLAYER_NAME_1 = 'Player One';
    const PLAYER_NAME_2 = 'Player Two';
    const WINNER_ID = PLAYER_ID_1;
    const WINNER_NAME = PLAYER_NAME_1;
    const MAP_SIZE = MapSize.MEDIUM;
    const TOTAL_DOORS = 5;
    const TOTAL_SANCTUARIES = 3;
    const TOTAL_TELEPORT_TILES = 2;
    const POSITION_X = 5;
    const POSITION_Y = 10;
    const HEALTH_LOST = 20;
    const HEALTH_DEALT = 30;
    const TILES_VISITED_PLAYER_1 = 10;
    const TILES_VISITED_PLAYER_2 = 15;
    const TOTAL_TILES = 225;
    const TELEPORTATIONS = 3;
    const TOGGLED_DOORS_COUNT = 2;
    const USED_SANCTUARIES_COUNT = 1;
    const FLAG_HOLDERS_COUNT = 2;
    const TURN_NUMBER = 10;
    const COMBAT_COUNT = 5;
    const COMBAT_WINS = 3;
    const COMBAT_LOSSES = 2;
    const GAME_START_TIME_MS = 1000000;
    const GAME_END_TIME_MS = 2000000;
    const MINUTES = 16;
    const EXPECTED_DURATION = '16:40';
    const ZERO = 0;
    const ONE = 1;
    const TWO = 2;
    const THREE = 3;
    const FOUR = 4;
    const FIVE = 5;
    const TEN = 10;
    const THIRTY = 30;
    const HUNDRED = 100;

    const createMockPosition = (overrides: Partial<Position> = {}): Position => ({
        x: POSITION_X,
        y: POSITION_Y,
        ...overrides,
    });

    const createMockPlayer = (overrides: Partial<Player> = {}): Player => ({
        id: PLAYER_ID_1,
        name: PLAYER_NAME_1,
        avatar: null,
        isAdmin: false,
        baseHealth: HUNDRED,
        healthBonus: ZERO,
        health: HUNDRED,
        maxHealth: HUNDRED,
        baseSpeed: THREE,
        speedBonus: ZERO,
        speed: THREE,
        boatSpeedBonus: ZERO,
        boatSpeed: ZERO,
        baseAttack: TEN,
        attackBonus: ZERO,
        baseDefense: FIVE,
        defenseBonus: ZERO,
        attackDice: null,
        defenseDice: null,
        x: POSITION_X,
        y: POSITION_Y,
        isInGame: true,
        startPointId: '',
        actionsRemaining: ONE,
        combatCount: COMBAT_COUNT,
        combatWins: COMBAT_WINS,
        combatLosses: COMBAT_LOSSES,
        combatDraws: ZERO,
        hasCombatBonus: false,
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
            [PLAYER_ID_1]: createMockPlayer({ id: PLAYER_ID_1, name: PLAYER_NAME_1 }),
            [PLAYER_ID_2]: createMockPlayer({ id: PLAYER_ID_2, name: PLAYER_NAME_2 }),
        },
        teams: {
            // eslint-disable-next-line @typescript-eslint/naming-convention -- Team number must be numeric
            1: { number: ONE, playerIds: [PLAYER_ID_1, PLAYER_ID_2] },
        },
        currentTurn: { turnNumber: TURN_NUMBER, activePlayerId: PLAYER_ID_1, hasUsedAction: false },
        startPoints: [],
        mapSize: MAP_SIZE,
        turnOrder: [PLAYER_ID_1, PLAYER_ID_2],
        playerCount: TWO,
        ...overrides,
    });

    const createMockGameTracker = (overrides: Partial<GameTracker> = {}): GameTracker => {
        const playerTiles1 = new Set<string>();
        for (let i = ZERO; i < TILES_VISITED_PLAYER_1; i++) {
            playerTiles1.add(`${i},${i}`);
        }

        const playerTiles2 = new Set<string>();
        for (let i = ZERO; i < TILES_VISITED_PLAYER_2; i++) {
            playerTiles2.add(`${i + TEN},${i + TEN}`);
        }

        const playerTiles = new Map<string, Set<string>>();
        playerTiles.set(PLAYER_ID_1, playerTiles1);
        playerTiles.set(PLAYER_ID_2, playerTiles2);

        const playerDamage = new Map<string, { healthLost: number; healthDealt: number }>();
        playerDamage.set(PLAYER_ID_1, { healthLost: HEALTH_LOST, healthDealt: HEALTH_DEALT });
        playerDamage.set(PLAYER_ID_2, { healthLost: HEALTH_LOST, healthDealt: HEALTH_DEALT });

        const toggledDoors = new Set<string>();
        for (let i = ZERO; i < TOGGLED_DOORS_COUNT; i++) {
            toggledDoors.add(`${i},${i}`);
        }

        const usedSanctuaries = new Set<string>();
        for (let i = ZERO; i < USED_SANCTUARIES_COUNT; i++) {
            usedSanctuaries.add(`${i},${i}`);
        }

        const flagHolders = new Set<string>();
        flagHolders.add(PLAYER_ID_1);
        flagHolders.add(PLAYER_ID_2);

        return {
            sessionId: SESSION_ID,
            playerTiles,
            totalTiles: TOTAL_TILES,
            teleportations: TELEPORTATIONS,
            toggledDoors,
            totalDoors: TOTAL_DOORS,
            usedSanctuaries,
            totalSanctuaries: TOTAL_SANCTUARIES,
            totalTeleportTiles: TOTAL_TELEPORT_TILES,
            flagHolders,
            playerDamage,
            ...overrides,
        };
    };

    beforeEach(async () => {
        jest.useFakeTimers();
        const mockTrackingService = {
            initializeTracking: jest.fn(),
            trackTileVisited: jest.fn(),
            trackTeleportation: jest.fn(),
            trackFlagHolder: jest.fn(),
            getTrackingData: jest.fn(),
            removeTracking: jest.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                StatisticsService,
                {
                    provide: TrackingService,
                    useValue: mockTrackingService,
                },
            ],
        }).compile();

        service = module.get<StatisticsService>(StatisticsService);
        trackingService = module.get(TrackingService);
    });

    afterEach(() => {
        jest.clearAllTimers();
        jest.runOnlyPendingTimers();
        jest.useRealTimers();
    });

    describe('initializeTracking', () => {
        it('should call trackingService.initializeTracking with correct parameters', () => {
            service.initializeTracking(SESSION_ID, MAP_SIZE, TOTAL_DOORS, TOTAL_SANCTUARIES, TOTAL_TELEPORT_TILES);

            expect(trackingService.initializeTracking).toHaveBeenCalledWith(
                SESSION_ID,
                MAP_SIZE,
                TOTAL_DOORS,
                TOTAL_SANCTUARIES,
                TOTAL_TELEPORT_TILES,
            );
        });
    });

    describe('trackTileVisited', () => {
        it('should call trackingService.trackTileVisited with correct parameters', () => {
            const position = createMockPosition();

            service.trackTileVisited(SESSION_ID, PLAYER_ID_1, position);

            expect(trackingService.trackTileVisited).toHaveBeenCalledWith(SESSION_ID, PLAYER_ID_1, position);
        });
    });

    describe('handleTeleported', () => {
        it('should call trackingService.trackTeleportation with session id', () => {
            const session = createMockSession();
            const payload: TeleportedPayload = {
                session,
                playerId: PLAYER_ID_1,
                originX: ZERO,
                originY: ZERO,
                destinationX: ONE,
                destinationY: ONE,
            };

            service.handleTeleported(payload);

            expect(trackingService.trackTeleportation).toHaveBeenCalledWith(SESSION_ID);
        });
    });

    describe('handleFlagPickedUp', () => {
        it('should call trackingService.trackFlagHolder with session id and player id', () => {
            const session = createMockSession();
            const payload = { session, playerId: PLAYER_ID_1 };

            service.handleFlagPickedUp(payload);

            expect(trackingService.trackFlagHolder).toHaveBeenCalledWith(SESSION_ID, PLAYER_ID_1);
        });
    });

    describe('handleFlagTransferred', () => {
        it('should call trackingService.trackFlagHolder for both players', () => {
            const session = createMockSession();
            const payload = { session, fromPlayerId: PLAYER_ID_1, toPlayerId: PLAYER_ID_2 };

            service.handleFlagTransferred(payload);

            expect(trackingService.trackFlagHolder).toHaveBeenCalledWith(SESSION_ID, PLAYER_ID_1);
            expect(trackingService.trackFlagHolder).toHaveBeenCalledWith(SESSION_ID, PLAYER_ID_2);
        });
    });

    describe('calculateAndStoreGameStatistics', () => {

        it('should calculate and store game statistics', () => {
            const session = createMockSession();
            const gameStartTime = new Date(GAME_START_TIME_MS);
            const trackingData = createMockGameTracker();
            trackingService.getTrackingData.mockReturnValue(trackingData);

            jest.spyOn(Date, 'now').mockReturnValue(GAME_END_TIME_MS);

            const result = service.calculateAndStoreGameStatistics(session, WINNER_ID, WINNER_NAME, gameStartTime);

            expect(result.winnerId).toBe(WINNER_ID);
            expect(result.winnerName).toBe(WINNER_NAME);
            expect(result.playersStatistics).toHaveLength(TWO);
            expect(result.globalStatistics).toBeDefined();
            expect(trackingService.removeTracking).toHaveBeenCalledWith(SESSION_ID);
        });

        it('should delete stored statistics after delay', () => {
            const session = createMockSession();
            const gameStartTime = new Date(GAME_START_TIME_MS);
            const trackingData = createMockGameTracker();
            trackingService.getTrackingData.mockReturnValue(trackingData);

            jest.spyOn(Date, 'now').mockReturnValue(GAME_END_TIME_MS);

            service.calculateAndStoreGameStatistics(session, WINNER_ID, WINNER_NAME, gameStartTime);

            expect(service.getStoredGameStatistics(SESSION_ID)).not.toBeNull();

            jest.advanceTimersByTime(STATISTICS_DELETE_DELAY_MS);

            expect(service.getStoredGameStatistics(SESSION_ID)).toBeNull();
        });
    });

    describe('getStoredGameStatistics', () => {
        it('should return stored statistics when they exist', () => {
            const session = createMockSession();
            const gameStartTime = new Date(GAME_START_TIME_MS);
            const trackingData = createMockGameTracker();
            trackingService.getTrackingData.mockReturnValue(trackingData);

            jest.spyOn(Date, 'now').mockReturnValue(GAME_END_TIME_MS);

            service.calculateAndStoreGameStatistics(session, WINNER_ID, WINNER_NAME, gameStartTime);

            const result = service.getStoredGameStatistics(SESSION_ID);

            expect(result).not.toBeNull();
            expect(result?.winnerId).toBe(WINNER_ID);
        });

        it('should return null when statistics do not exist', () => {
            const result = service.getStoredGameStatistics('non-existent-session');

            expect(result).toBeNull();
        });
    });

    describe('calculateGameStatistics', () => {
        it('should calculate statistics for all players', () => {
            const session = createMockSession();
            const gameStartTime = new Date(GAME_START_TIME_MS);
            const trackingData = createMockGameTracker();
            trackingService.getTrackingData.mockReturnValue(trackingData);

            jest.spyOn(Date, 'now').mockReturnValue(GAME_END_TIME_MS);

            const result = service.calculateAndStoreGameStatistics(session, WINNER_ID, WINNER_NAME, gameStartTime);

            expect(result.playersStatistics).toHaveLength(TWO);
            expect(result.playersStatistics[ZERO].name).toBe(PLAYER_NAME_1);
            expect(result.playersStatistics[ONE].name).toBe(PLAYER_NAME_2);
        });
    });

    describe('calculatePlayerStatistics', () => {
        it('should calculate player statistics with damage data', () => {
            const session = createMockSession();
            const gameStartTime = new Date(GAME_START_TIME_MS);
            const trackingData = createMockGameTracker();
            trackingService.getTrackingData.mockReturnValue(trackingData);

            jest.spyOn(Date, 'now').mockReturnValue(GAME_END_TIME_MS);

            const result = service.calculateAndStoreGameStatistics(session, WINNER_ID, WINNER_NAME, gameStartTime);

            const playerStats = result.playersStatistics[ZERO];
            expect(playerStats.healthLost).toBe(HEALTH_LOST);
            expect(playerStats.healthDealt).toBe(HEALTH_DEALT);
            expect(playerStats.combatCount).toBe(COMBAT_COUNT);
            expect(playerStats.combatWins).toBe(COMBAT_WINS);
            expect(playerStats.combatLosses).toBe(COMBAT_LOSSES);
        });

        it('should calculate tiles visited percentage correctly', () => {
            const session = createMockSession();
            const gameStartTime = new Date(GAME_START_TIME_MS);
            const trackingData = createMockGameTracker();
            trackingService.getTrackingData.mockReturnValue(trackingData);

            jest.spyOn(Date, 'now').mockReturnValue(GAME_END_TIME_MS);

            const result = service.calculateAndStoreGameStatistics(session, WINNER_ID, WINNER_NAME, gameStartTime);

            const expectedPercentage = Math.round((TILES_VISITED_PLAYER_1 / TOTAL_TILES) * PERCENTAGE_MULTIPLIER);
            expect(result.playersStatistics[ZERO].tilesVisitedPercentage).toBe(expectedPercentage);
        });

        it('should return zero when player has no tiles visited', () => {
            const session = createMockSession();
            const gameStartTime = new Date(GAME_START_TIME_MS);
            const trackingData = createMockGameTracker();
            trackingData.playerTiles = new Map();
            trackingService.getTrackingData.mockReturnValue(trackingData);

            jest.spyOn(Date, 'now').mockReturnValue(GAME_END_TIME_MS);

            const result = service.calculateAndStoreGameStatistics(session, WINNER_ID, WINNER_NAME, gameStartTime);

            expect(result.playersStatistics[ZERO].tilesVisitedPercentage).toBe(ZERO);
        });

        it('should return zero when trackingData is null', () => {
            const session = createMockSession();
            const gameStartTime = new Date(GAME_START_TIME_MS);
            const emptyTrackingData = createMockGameTracker({
                playerTiles: new Map(),
                playerDamage: new Map(),
                totalTiles: TOTAL_TILES,
            });
            trackingService.getTrackingData.mockReturnValue(emptyTrackingData);

            jest.spyOn(Date, 'now').mockReturnValue(GAME_END_TIME_MS);

            const result = service.calculateAndStoreGameStatistics(session, WINNER_ID, WINNER_NAME, gameStartTime);

            expect(result.playersStatistics[ZERO].healthLost).toBe(ZERO);
            expect(result.playersStatistics[ZERO].healthDealt).toBe(ZERO);
            expect(result.playersStatistics[ZERO].tilesVisitedPercentage).toBe(ZERO);
        });

        it('should return zero when playerDamage is missing', () => {
            const session = createMockSession();
            const gameStartTime = new Date(GAME_START_TIME_MS);
            const trackingData = createMockGameTracker();
            trackingData.playerDamage = new Map();
            trackingService.getTrackingData.mockReturnValue(trackingData);

            jest.spyOn(Date, 'now').mockReturnValue(GAME_END_TIME_MS);

            const result = service.calculateAndStoreGameStatistics(session, WINNER_ID, WINNER_NAME, gameStartTime);

            expect(result.playersStatistics[ZERO].healthLost).toBe(ZERO);
            expect(result.playersStatistics[ZERO].healthDealt).toBe(ZERO);
        });
    });

    describe('calculateGlobalStatistics', () => {
        it('should calculate global statistics correctly', () => {
            const session = createMockSession();
            const gameStartTime = new Date(GAME_START_TIME_MS);
            const trackingData = createMockGameTracker();
            trackingService.getTrackingData.mockReturnValue(trackingData);

            jest.spyOn(Date, 'now').mockReturnValue(GAME_END_TIME_MS);

            const result = service.calculateAndStoreGameStatistics(session, WINNER_ID, WINNER_NAME, gameStartTime);

            expect(result.globalStatistics.totalTurns).toBe(TURN_NUMBER);
            expect(result.globalStatistics.totalTeleportations).toBe(TELEPORTATIONS);
            expect(result.globalStatistics.flagHoldersCount).toBe(FLAG_HOLDERS_COUNT);
        });

        it('should calculate tiles visited percentage correctly', () => {
            const session = createMockSession();
            const gameStartTime = new Date(GAME_START_TIME_MS);
            const trackingData = createMockGameTracker();
            trackingService.getTrackingData.mockReturnValue(trackingData);

            jest.spyOn(Date, 'now').mockReturnValue(GAME_END_TIME_MS);

            const result = service.calculateAndStoreGameStatistics(session, WINNER_ID, WINNER_NAME, gameStartTime);

            const allVisitedTiles = new Set<string>();
            trackingData.playerTiles.forEach((tiles: Set<string>) => {
                tiles.forEach((tile) => allVisitedTiles.add(tile));
            });
            const expectedPercentage = Math.round((allVisitedTiles.size / TOTAL_TILES) * PERCENTAGE_MULTIPLIER);
            expect(result.globalStatistics.tilesVisitedPercentage).toBe(expectedPercentage);
        });

        it('should calculate doors manipulated percentage correctly', () => {
            const session = createMockSession();
            const gameStartTime = new Date(GAME_START_TIME_MS);
            const trackingData = createMockGameTracker();
            trackingService.getTrackingData.mockReturnValue(trackingData);

            jest.spyOn(Date, 'now').mockReturnValue(GAME_END_TIME_MS);

            const result = service.calculateAndStoreGameStatistics(session, WINNER_ID, WINNER_NAME, gameStartTime);

            const expectedPercentage = Math.round((TOGGLED_DOORS_COUNT / TOTAL_DOORS) * PERCENTAGE_MULTIPLIER);
            expect(result.globalStatistics.doorsManipulatedPercentage).toBe(expectedPercentage);
        });

        it('should return zero for doors manipulated percentage when totalDoors is zero', () => {
            const session = createMockSession();
            const gameStartTime = new Date(GAME_START_TIME_MS);
            const trackingData = createMockGameTracker();
            trackingData.totalDoors = ZERO;
            trackingService.getTrackingData.mockReturnValue(trackingData);

            jest.spyOn(Date, 'now').mockReturnValue(GAME_END_TIME_MS);

            const result = service.calculateAndStoreGameStatistics(session, WINNER_ID, WINNER_NAME, gameStartTime);

            expect(result.globalStatistics.doorsManipulatedPercentage).toBe(ZERO);
        });

        it('should calculate sanctuaries used percentage correctly', () => {
            const session = createMockSession();
            const gameStartTime = new Date(GAME_START_TIME_MS);
            const trackingData = createMockGameTracker();
            trackingService.getTrackingData.mockReturnValue(trackingData);

            jest.spyOn(Date, 'now').mockReturnValue(GAME_END_TIME_MS);

            const result = service.calculateAndStoreGameStatistics(session, WINNER_ID, WINNER_NAME, gameStartTime);

            const expectedPercentage = Math.round((USED_SANCTUARIES_COUNT / TOTAL_SANCTUARIES) * PERCENTAGE_MULTIPLIER);
            expect(result.globalStatistics.sanctuariesUsedPercentage).toBe(expectedPercentage);
        });

        it('should return zero for sanctuaries used percentage when totalSanctuaries is zero', () => {
            const session = createMockSession();
            const gameStartTime = new Date(GAME_START_TIME_MS);
            const trackingData = createMockGameTracker();
            trackingData.totalSanctuaries = ZERO;
            trackingService.getTrackingData.mockReturnValue(trackingData);

            jest.spyOn(Date, 'now').mockReturnValue(GAME_END_TIME_MS);

            const result = service.calculateAndStoreGameStatistics(session, WINNER_ID, WINNER_NAME, gameStartTime);

            expect(result.globalStatistics.sanctuariesUsedPercentage).toBe(ZERO);
        });

        it('should return zero when trackingData is null', () => {
            const session = createMockSession();
            const gameStartTime = new Date(GAME_START_TIME_MS);
            const emptyTrackingData = createMockGameTracker({
                playerTiles: new Map(),
                totalTiles: TOTAL_TILES,
                teleportations: ZERO,
                toggledDoors: new Set(),
                totalDoors: ZERO,
                usedSanctuaries: new Set(),
                totalSanctuaries: ZERO,
                flagHolders: new Set(),
            });
            trackingService.getTrackingData.mockReturnValue(emptyTrackingData);

            jest.spyOn(Date, 'now').mockReturnValue(GAME_END_TIME_MS);

            const result = service.calculateAndStoreGameStatistics(session, WINNER_ID, WINNER_NAME, gameStartTime);

            expect(result.globalStatistics.tilesVisitedPercentage).toBe(ZERO);
            expect(result.globalStatistics.totalTeleportations).toBe(ZERO);
            expect(result.globalStatistics.flagHoldersCount).toBe(ZERO);
        });

        it('should return zero when playerTiles is missing', () => {
            const session = createMockSession();
            const gameStartTime = new Date(GAME_START_TIME_MS);
            const trackingData = createMockGameTracker();
            trackingData.playerTiles = undefined as unknown as Map<string, Set<string>>;
            trackingService.getTrackingData.mockReturnValue(trackingData);

            jest.spyOn(Date, 'now').mockReturnValue(GAME_END_TIME_MS);

            const result = service.calculateAndStoreGameStatistics(session, WINNER_ID, WINNER_NAME, gameStartTime);

            expect(result.globalStatistics.tilesVisitedPercentage).toBe(ZERO);
        });

        it('should return zero when flagHolders is missing', () => {
            const session = createMockSession();
            const gameStartTime = new Date(GAME_START_TIME_MS);
            const trackingData = createMockGameTracker();
            trackingData.flagHolders = new Set();
            trackingService.getTrackingData.mockReturnValue(trackingData);

            jest.spyOn(Date, 'now').mockReturnValue(GAME_END_TIME_MS);

            const result = service.calculateAndStoreGameStatistics(session, WINNER_ID, WINNER_NAME, gameStartTime);

            expect(result.globalStatistics.flagHoldersCount).toBe(ZERO);
        });
    });

    describe('formatDuration', () => {
        it('should format duration correctly with minutes and seconds', () => {
            const session = createMockSession();
            const gameStartTime = new Date(GAME_START_TIME_MS);
            const trackingData = createMockGameTracker();
            trackingService.getTrackingData.mockReturnValue(trackingData);

            jest.spyOn(Date, 'now').mockReturnValue(GAME_END_TIME_MS);

            const result = service.calculateAndStoreGameStatistics(session, WINNER_ID, WINNER_NAME, gameStartTime);

            expect(result.globalStatistics.gameDuration).toBe(EXPECTED_DURATION);
        });

        it('should format duration with single digit seconds correctly', () => {
            const session = createMockSession();
            const gameStartTime = new Date(GAME_START_TIME_MS);
            const trackingData = createMockGameTracker();
            trackingService.getTrackingData.mockReturnValue(trackingData);

            const singleDigitSecondsTime =
                GAME_START_TIME_MS + (MINUTES * SECONDS_PER_MINUTE * MILLISECONDS_PER_SECOND) + (FIVE * MILLISECONDS_PER_SECOND);
            jest.spyOn(Date, 'now').mockReturnValue(singleDigitSecondsTime);

            const result = service.calculateAndStoreGameStatistics(session, WINNER_ID, WINNER_NAME, gameStartTime);

            expect(result.globalStatistics.gameDuration).toBe('16:05');
        });

        it('should format duration with zero minutes correctly', () => {
            const session = createMockSession();
            const gameStartTime = new Date(GAME_START_TIME_MS);
            const trackingData = createMockGameTracker();
            trackingService.getTrackingData.mockReturnValue(trackingData);

            const zeroMinutesTime = GAME_START_TIME_MS + (THIRTY * MILLISECONDS_PER_SECOND);
            jest.spyOn(Date, 'now').mockReturnValue(zeroMinutesTime);

            const result = service.calculateAndStoreGameStatistics(session, WINNER_ID, WINNER_NAME, gameStartTime);

            expect(result.globalStatistics.gameDuration).toBe('0:30');
        });

        it('should format duration with zero seconds correctly', () => {
            const session = createMockSession();
            const gameStartTime = new Date(GAME_START_TIME_MS);
            const trackingData = createMockGameTracker();
            trackingService.getTrackingData.mockReturnValue(trackingData);

            const zeroSecondsTime = GAME_START_TIME_MS + (MINUTES * SECONDS_PER_MINUTE * MILLISECONDS_PER_SECOND);
            jest.spyOn(Date, 'now').mockReturnValue(zeroSecondsTime);

            const result = service.calculateAndStoreGameStatistics(session, WINNER_ID, WINNER_NAME, gameStartTime);

            expect(result.globalStatistics.gameDuration).toBe('16:00');
        });
    });
});
