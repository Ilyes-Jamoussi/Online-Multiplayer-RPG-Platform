import { TestBed } from '@angular/core/testing';
import { GameStatisticsDto } from '@app/dto/game-statistics-dto';
import { GlobalStatisticsDto } from '@app/dto/global-statistics-dto';
import { PlayerStatisticsDto } from '@app/dto/player-statistics-dto';
import { InGameSocketService } from '@app/services/in-game-socket/in-game-socket.service';
import { ResetService } from '@app/services/reset/reset.service';
import { StatisticsService } from './statistics.service';

// Test constants
const TEST_SESSION_ID = 'test-session-id';
const TEST_WINNER_ID = 'test-winner-id';
const TEST_WINNER_NAME = 'Test Winner';
const TEST_PLAYER_NAME_1 = 'Player 1';
const TEST_PLAYER_NAME_2 = 'Player 2';
const TEST_COMBAT_COUNT_1 = 5;
const TEST_COMBAT_COUNT_2 = 3;
const TEST_COMBAT_WINS_1 = 3;
const TEST_COMBAT_WINS_2 = 2;
const TEST_COMBAT_LOSSES_1 = 1;
const TEST_COMBAT_LOSSES_2 = 1;
const TEST_HEALTH_LOST_1 = 10;
const TEST_HEALTH_LOST_2 = 5;
const TEST_HEALTH_DEALT_1 = 15;
const TEST_HEALTH_DEALT_2 = 8;
const TEST_TILES_VISITED_PERCENTAGE_1 = 60;
const TEST_TILES_VISITED_PERCENTAGE_2 = 40;
const TEST_GAME_DURATION = '10:30';
const TEST_TOTAL_TURNS = 20;
const TEST_GLOBAL_TILES_VISITED_PERCENTAGE = 75;
const TEST_TOTAL_TELEPORTATIONS = 5;
const TEST_DOORS_MANIPULATED_PERCENTAGE = 50;
const TEST_SANCTUARIES_USED_PERCENTAGE = 25;
const TEST_FLAG_HOLDERS_COUNT = 1;

type MockInGameSocketService = {
    loadGameStatistics: jasmine.Spy;
    onLoadGameStatistics: jasmine.Spy;
};

const createMockPlayerStatistics = (
    name: string,
    combatCount: number,
    combatWins: number,
    combatLosses: number,
    healthLost: number,
    healthDealt: number,
    tilesVisitedPercentage: number,
): PlayerStatisticsDto => ({
    name,
    combatCount,
    combatWins,
    combatLosses,
    healthLost,
    healthDealt,
    tilesVisitedPercentage,
});

const createMockGlobalStatistics = (): GlobalStatisticsDto => ({
    gameDuration: TEST_GAME_DURATION,
    totalTurns: TEST_TOTAL_TURNS,
    tilesVisitedPercentage: TEST_GLOBAL_TILES_VISITED_PERCENTAGE,
    totalTeleportations: TEST_TOTAL_TELEPORTATIONS,
    doorsManipulatedPercentage: TEST_DOORS_MANIPULATED_PERCENTAGE,
    sanctuariesUsedPercentage: TEST_SANCTUARIES_USED_PERCENTAGE,
    flagHoldersCount: TEST_FLAG_HOLDERS_COUNT,
});

const createMockGameStatistics = (playersStats: PlayerStatisticsDto[], globalStats: GlobalStatisticsDto): GameStatisticsDto => ({
    winnerId: TEST_WINNER_ID,
    winnerName: TEST_WINNER_NAME,
    playersStatistics: playersStats,
    globalStatistics: globalStats,
});

describe('StatisticsService', () => {
    let service: StatisticsService;
    let mockInGameSocketService: MockInGameSocketService;
    let resetService: ResetService;
    let loadGameStatisticsCallback: ((data: GameStatisticsDto) => void) | undefined;

    beforeEach(() => {
        loadGameStatisticsCallback = undefined;

        mockInGameSocketService = {
            loadGameStatistics: jasmine.createSpy('loadGameStatistics'),
            onLoadGameStatistics: jasmine.createSpy('onLoadGameStatistics').and.callFake((callback: (data: GameStatisticsDto) => void) => {
                loadGameStatisticsCallback = callback;
            }),
        };

        TestBed.configureTestingModule({
            providers: [
                StatisticsService,
                ResetService,
                { provide: InGameSocketService, useValue: mockInGameSocketService },
            ],
        });

        service = TestBed.inject(StatisticsService);
        resetService = TestBed.inject(ResetService);
    });

    it('should create', () => {
        expect(service).toBeTruthy();
    });

    describe('gameStatistics', () => {
        it('should return null initially', () => {
            expect(service.gameStatistics()).toBeNull();
        });

        it('should return readonly signal', () => {
            const gameStatistics = service.gameStatistics;
            expect(gameStatistics).toBeDefined();
        });
    });

    describe('loadGameStatistics', () => {
        it('should call inGameSocketService.loadGameStatistics with sessionId', () => {
            service.loadGameStatistics(TEST_SESSION_ID);

            expect(mockInGameSocketService.loadGameStatistics).toHaveBeenCalledTimes(1);
            expect(mockInGameSocketService.loadGameStatistics).toHaveBeenCalledWith(TEST_SESSION_ID);
        });

        it('should call inGameSocketService.loadGameStatistics with different sessionId', () => {
            const differentSessionId = 'different-session-id';
            service.loadGameStatistics(differentSessionId);

            expect(mockInGameSocketService.loadGameStatistics).toHaveBeenCalledWith(differentSessionId);
        });
    });

    describe('setGameStatistics', () => {
        it('should update gameStatistics signal', () => {
            const mockPlayersStats = [
                createMockPlayerStatistics(TEST_PLAYER_NAME_1, TEST_COMBAT_COUNT_1, TEST_COMBAT_WINS_1, TEST_COMBAT_LOSSES_1, TEST_HEALTH_LOST_1, TEST_HEALTH_DEALT_1, TEST_TILES_VISITED_PERCENTAGE_1),
            ];
            const mockGlobalStats = createMockGlobalStatistics();
            const mockGameStats = createMockGameStatistics(mockPlayersStats, mockGlobalStats);

            service.setGameStatistics(mockGameStats);

            expect(service.gameStatistics()).toEqual(mockGameStats);
        });

        it('should update gameStatistics signal with different statistics', () => {
            const mockPlayersStats = [
                createMockPlayerStatistics(TEST_PLAYER_NAME_1, TEST_COMBAT_COUNT_1, TEST_COMBAT_WINS_1, TEST_COMBAT_LOSSES_1, TEST_HEALTH_LOST_1, TEST_HEALTH_DEALT_1, TEST_TILES_VISITED_PERCENTAGE_1),
                createMockPlayerStatistics(TEST_PLAYER_NAME_2, TEST_COMBAT_COUNT_2, TEST_COMBAT_WINS_2, TEST_COMBAT_LOSSES_2, TEST_HEALTH_LOST_2, TEST_HEALTH_DEALT_2, TEST_TILES_VISITED_PERCENTAGE_2),
            ];
            const mockGlobalStats = createMockGlobalStatistics();
            const mockGameStats = createMockGameStatistics(mockPlayersStats, mockGlobalStats);

            service.setGameStatistics(mockGameStats);

            expect(service.gameStatistics()).toEqual(mockGameStats);
            expect(service.gameStatistics()?.playersStatistics.length).toBe(2);
        });
    });

    describe('initListeners', () => {
        it('should register loadGameStatistics callback on initialization', () => {
            expect(mockInGameSocketService.onLoadGameStatistics).toHaveBeenCalledTimes(1);
        });

        it('should update gameStatistics when callback is invoked', () => {
            expect(service.gameStatistics()).toBeNull();

            const mockPlayersStats = [
                createMockPlayerStatistics(TEST_PLAYER_NAME_1, TEST_COMBAT_COUNT_1, TEST_COMBAT_WINS_1, TEST_COMBAT_LOSSES_1, TEST_HEALTH_LOST_1, TEST_HEALTH_DEALT_1, TEST_TILES_VISITED_PERCENTAGE_1),
            ];
            const mockGlobalStats = createMockGlobalStatistics();
            const mockGameStats = createMockGameStatistics(mockPlayersStats, mockGlobalStats);

            if (loadGameStatisticsCallback) {
                loadGameStatisticsCallback(mockGameStats);
            }

            expect(service.gameStatistics()).toEqual(mockGameStats);
        });

        it('should update gameStatistics with different data when callback is invoked multiple times', () => {
            const mockPlayersStats1 = [
                createMockPlayerStatistics(TEST_PLAYER_NAME_1, TEST_COMBAT_COUNT_1, TEST_COMBAT_WINS_1, TEST_COMBAT_LOSSES_1, TEST_HEALTH_LOST_1, TEST_HEALTH_DEALT_1, TEST_TILES_VISITED_PERCENTAGE_1),
            ];
            const mockGlobalStats1 = createMockGlobalStatistics();
            const mockGameStats1 = createMockGameStatistics(mockPlayersStats1, mockGlobalStats1);

            if (loadGameStatisticsCallback) {
                loadGameStatisticsCallback(mockGameStats1);
            }

            expect(service.gameStatistics()).toEqual(mockGameStats1);

            const mockPlayersStats2 = [
                createMockPlayerStatistics(TEST_PLAYER_NAME_2, TEST_COMBAT_COUNT_2, TEST_COMBAT_WINS_2, TEST_COMBAT_LOSSES_2, TEST_HEALTH_LOST_2, TEST_HEALTH_DEALT_2, TEST_TILES_VISITED_PERCENTAGE_2),
            ];
            const mockGlobalStats2 = createMockGlobalStatistics();
            const mockGameStats2 = createMockGameStatistics(mockPlayersStats2, mockGlobalStats2);

            if (loadGameStatisticsCallback) {
                loadGameStatisticsCallback(mockGameStats2);
            }

            expect(service.gameStatistics()).toEqual(mockGameStats2);
        });
    });

    describe('ResetService integration', () => {
        it('should reset gameStatistics when ResetService triggers reset', () => {
            const mockPlayersStats = [
                createMockPlayerStatistics(TEST_PLAYER_NAME_1, TEST_COMBAT_COUNT_1, TEST_COMBAT_WINS_1, TEST_COMBAT_LOSSES_1, TEST_HEALTH_LOST_1, TEST_HEALTH_DEALT_1, TEST_TILES_VISITED_PERCENTAGE_1),
            ];
            const mockGlobalStats = createMockGlobalStatistics();
            const mockGameStats = createMockGameStatistics(mockPlayersStats, mockGlobalStats);

            service.setGameStatistics(mockGameStats);
            expect(service.gameStatistics()).toEqual(mockGameStats);

            resetService.triggerReset();

            expect(service.gameStatistics()).toBeNull();
        });

        it('should reset gameStatistics multiple times when ResetService triggers reset multiple times', () => {
            const mockPlayersStats = [
                createMockPlayerStatistics(TEST_PLAYER_NAME_1, TEST_COMBAT_COUNT_1, TEST_COMBAT_WINS_1, TEST_COMBAT_LOSSES_1, TEST_HEALTH_LOST_1, TEST_HEALTH_DEALT_1, TEST_TILES_VISITED_PERCENTAGE_1),
            ];
            const mockGlobalStats = createMockGlobalStatistics();
            const mockGameStats = createMockGameStatistics(mockPlayersStats, mockGlobalStats);

            service.setGameStatistics(mockGameStats);
            expect(service.gameStatistics()).toEqual(mockGameStats);

            resetService.triggerReset();
            expect(service.gameStatistics()).toBeNull();

            service.setGameStatistics(mockGameStats);
            expect(service.gameStatistics()).toEqual(mockGameStats);

            resetService.triggerReset();
            expect(service.gameStatistics()).toBeNull();
        });
    });
});

