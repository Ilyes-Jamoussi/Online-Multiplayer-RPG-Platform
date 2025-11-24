import { signal, Signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { GameStatisticsDto } from '@app/dto/game-statistics-dto';
import { GlobalStatisticsDto } from '@app/dto/global-statistics-dto';
import { PlayerStatisticsDto } from '@app/dto/player-statistics-dto';
import { ROUTES } from '@app/enums/routes.enum';
import { SessionService } from '@app/services/session/session.service';
import { StatisticsService } from '@app/services/statistics/statistics.service';
import { StatisticsPageComponent } from './statistics-page.component';

const TEST_SESSION_ID = 'test-session-id';
const TEST_SESSION_ID_EMPTY = '';
const TEST_WINNER_ID = 'winner-id';
const TEST_WINNER_NAME = 'Winner Name';
const TEST_PLAYER_NAME_1 = 'Alice';
const TEST_PLAYER_NAME_2 = 'Bob';
const TEST_PLAYER_NAME_3 = 'Charlie';
const TEST_COMBAT_COUNT_1 = 5;
const TEST_COMBAT_COUNT_2 = 3;
const TEST_COMBAT_COUNT_3 = 7;
const TEST_COMBAT_WINS_1 = 4;
const TEST_COMBAT_WINS_2 = 2;
const TEST_COMBAT_WINS_3 = 6;
const TEST_COMBAT_LOSSES_1 = 1;
const TEST_COMBAT_LOSSES_2 = 1;
const TEST_COMBAT_LOSSES_3 = 1;
const TEST_HEALTH_LOST_1 = 10;
const TEST_HEALTH_LOST_2 = 5;
const TEST_HEALTH_LOST_3 = 15;
const TEST_HEALTH_DEALT_1 = 20;
const TEST_HEALTH_DEALT_2 = 15;
const TEST_HEALTH_DEALT_3 = 25;
const TEST_TILES_VISITED_PERCENTAGE_1 = 50;
const TEST_TILES_VISITED_PERCENTAGE_2 = 30;
const TEST_TILES_VISITED_PERCENTAGE_3 = 70;
const TEST_GAME_DURATION = '1:30:00';
const TEST_TOTAL_TURNS = 20;
const TEST_GLOBAL_TILES_VISITED_PERCENTAGE = 60;
const TEST_TOTAL_TELEPORTATIONS = 5;
const TEST_DOORS_MANIPULATED_PERCENTAGE = 40;
const TEST_SANCTUARIES_USED_PERCENTAGE = 30;
const TEST_FLAG_HOLDERS_COUNT = 2;
const DEFAULT_GAME_DURATION = '0:00';
const DEFAULT_TOTAL_TURNS = 0;
const DEFAULT_TILES_VISITED_PERCENTAGE = 0;
const DEFAULT_TOTAL_TELEPORTATIONS = 0;
const DEFAULT_DOORS_MANIPULATED_PERCENTAGE = 0;
const DEFAULT_SANCTUARIES_USED_PERCENTAGE = 0;
const DEFAULT_FLAG_HOLDERS_COUNT = 0;
const DEFAULT_SORT_COLUMN = 'name';
const DEFAULT_SORT_DIRECTION_ASC = 'asc';
const DEFAULT_SORT_DIRECTION_DESC = 'desc';
const SORT_ICON_EMPTY = '';

type MockSessionService = {
    id: Signal<string>;
};

type MockStatisticsService = {
    gameStatistics: Signal<GameStatisticsDto | null>;
    loadGameStatistics: jasmine.Spy;
    setGameStatistics: jasmine.Spy;
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

const createMockGlobalStatistics = (
    gameDuration: string = TEST_GAME_DURATION,
    totalTurns: number = TEST_TOTAL_TURNS,
    tilesVisitedPercentage: number = TEST_GLOBAL_TILES_VISITED_PERCENTAGE,
    totalTeleportations: number = TEST_TOTAL_TELEPORTATIONS,
    doorsManipulatedPercentage: number = TEST_DOORS_MANIPULATED_PERCENTAGE,
    sanctuariesUsedPercentage: number = TEST_SANCTUARIES_USED_PERCENTAGE,
    flagHoldersCount: number = TEST_FLAG_HOLDERS_COUNT,
): GlobalStatisticsDto => ({
    gameDuration,
    totalTurns,
    tilesVisitedPercentage,
    totalTeleportations,
    doorsManipulatedPercentage,
    sanctuariesUsedPercentage,
    flagHoldersCount,
});

const createMockGameStatistics = (
    playersStatistics: PlayerStatisticsDto[],
    globalStatistics: GlobalStatisticsDto,
): GameStatisticsDto => ({
    winnerId: TEST_WINNER_ID,
    winnerName: TEST_WINNER_NAME,
    playersStatistics,
    globalStatistics,
});

describe('StatisticsPageComponent', () => {
    let component: StatisticsPageComponent;
    let fixture: ComponentFixture<StatisticsPageComponent>;
    let mockRouter: jasmine.SpyObj<Router>;
    let mockSessionService: MockSessionService;
    let mockStatisticsService: MockStatisticsService;
    let sessionIdSignal: ReturnType<typeof signal<string>>;
    let gameStatisticsSignal: ReturnType<typeof signal<GameStatisticsDto | null>>;

    beforeEach(async () => {
        sessionIdSignal = signal<string>(TEST_SESSION_ID);
        gameStatisticsSignal = signal<GameStatisticsDto | null>(null);

        mockRouter = jasmine.createSpyObj('Router', ['navigate']);

        mockSessionService = {
            id: sessionIdSignal.asReadonly(),
        };

        mockStatisticsService = {
            gameStatistics: gameStatisticsSignal.asReadonly(),
            loadGameStatistics: jasmine.createSpy('loadGameStatistics'),
            setGameStatistics: jasmine.createSpy('setGameStatistics').and.callFake((stats: GameStatisticsDto) => {
                gameStatisticsSignal.set(stats);
            }),
        };

        await TestBed.configureTestingModule({
            imports: [StatisticsPageComponent],
            providers: [
                { provide: Router, useValue: mockRouter },
                { provide: SessionService, useValue: mockSessionService },
                { provide: StatisticsService, useValue: mockStatisticsService },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(StatisticsPageComponent);
        component = fixture.componentInstance;
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    describe('Initial state', () => {
        it('should have default sortColumn value of "name"', () => {
            expect(component.sortColumn).toBe(DEFAULT_SORT_COLUMN);
        });

        it('should have default sortDirection value of "asc"', () => {
            expect(component.sortDirection).toBe(DEFAULT_SORT_DIRECTION_ASC);
        });
    });

    describe('ngOnInit', () => {
        it('should call loadGameStatistics when sessionId exists', () => {
            sessionIdSignal.set(TEST_SESSION_ID);
            mockStatisticsService.loadGameStatistics.calls.reset();
            mockRouter.navigate.calls.reset();

            component.ngOnInit();

            expect(mockStatisticsService.loadGameStatistics).toHaveBeenCalledTimes(1);
            expect(mockStatisticsService.loadGameStatistics).toHaveBeenCalledWith(TEST_SESSION_ID);
            expect(mockRouter.navigate).not.toHaveBeenCalled();
        });

        it('should navigate to HomePage when sessionId is empty', () => {
            sessionIdSignal.set(TEST_SESSION_ID_EMPTY);
            mockStatisticsService.loadGameStatistics.calls.reset();
            mockRouter.navigate.calls.reset();

            component.ngOnInit();

            expect(mockStatisticsService.loadGameStatistics).not.toHaveBeenCalled();
            expect(mockRouter.navigate).toHaveBeenCalledTimes(1);
            expect(mockRouter.navigate).toHaveBeenCalledWith([ROUTES.HomePage]);
        });
    });

    describe('onBackClick', () => {
        it('should navigate to HomePage', () => {
            fixture.detectChanges();

            component.onBackClick();

            expect(mockRouter.navigate).toHaveBeenCalledTimes(1);
            expect(mockRouter.navigate).toHaveBeenCalledWith([ROUTES.HomePage]);
        });
    });

    describe('gameStatistics', () => {
        it('should return gameStatistics from statisticsService', () => {
            const mockGlobalStats = createMockGlobalStatistics();
            const mockPlayersStats = [
                createMockPlayerStatistics(TEST_PLAYER_NAME_1, TEST_COMBAT_COUNT_1, TEST_COMBAT_WINS_1, TEST_COMBAT_LOSSES_1, TEST_HEALTH_LOST_1, TEST_HEALTH_DEALT_1, TEST_TILES_VISITED_PERCENTAGE_1),
            ];
            const mockGameStats = createMockGameStatistics(mockPlayersStats, mockGlobalStats);
            gameStatisticsSignal.set(mockGameStats);
            fixture.detectChanges();

            const result = component.gameStatistics();

            expect(result).toEqual(mockGameStats);
        });

        it('should return null when statisticsService has no gameStatistics', () => {
            gameStatisticsSignal.set(null);
            fixture.detectChanges();

            const result = component.gameStatistics();

            expect(result).toBeNull();
        });
    });

    describe('playersStatistics', () => {
        it('should return playersStatistics from gameStatistics', () => {
            const mockGlobalStats = createMockGlobalStatistics();
            const mockPlayersStats = [
                createMockPlayerStatistics(TEST_PLAYER_NAME_1, TEST_COMBAT_COUNT_1, TEST_COMBAT_WINS_1, TEST_COMBAT_LOSSES_1, TEST_HEALTH_LOST_1, TEST_HEALTH_DEALT_1, TEST_TILES_VISITED_PERCENTAGE_1),
                createMockPlayerStatistics(TEST_PLAYER_NAME_2, TEST_COMBAT_COUNT_2, TEST_COMBAT_WINS_2, TEST_COMBAT_LOSSES_2, TEST_HEALTH_LOST_2, TEST_HEALTH_DEALT_2, TEST_TILES_VISITED_PERCENTAGE_2),
            ];
            const mockGameStats = createMockGameStatistics(mockPlayersStats, mockGlobalStats);
            gameStatisticsSignal.set(mockGameStats);
            fixture.detectChanges();

            const result = component.playersStatistics();

            expect(result).toEqual(mockPlayersStats);
            expect(result.length).toBe(2);
        });

        it('should return empty array when gameStatistics is null', () => {
            gameStatisticsSignal.set(null);
            fixture.detectChanges();

            const result = component.playersStatistics();

            expect(result).toEqual([]);
            expect(result.length).toBe(0);
        });

        it('should return empty array when gameStatistics has no playersStatistics', () => {
            const mockGlobalStats = createMockGlobalStatistics();
            const mockGameStats = createMockGameStatistics([], mockGlobalStats);
            gameStatisticsSignal.set(mockGameStats);
            fixture.detectChanges();

            const result = component.playersStatistics();

            expect(result).toEqual([]);
        });
    });

    describe('globalStatistics', () => {
        it('should return globalStatistics from gameStatistics', () => {
            const mockGlobalStats = createMockGlobalStatistics();
            const mockPlayersStats = [
                createMockPlayerStatistics(TEST_PLAYER_NAME_1, TEST_COMBAT_COUNT_1, TEST_COMBAT_WINS_1, TEST_COMBAT_LOSSES_1, TEST_HEALTH_LOST_1, TEST_HEALTH_DEALT_1, TEST_TILES_VISITED_PERCENTAGE_1),
            ];
            const mockGameStats = createMockGameStatistics(mockPlayersStats, mockGlobalStats);
            gameStatisticsSignal.set(mockGameStats);
            fixture.detectChanges();

            const result = component.globalStatistics();

            expect(result).toEqual(mockGlobalStats);
        });

        it('should return default globalStatistics when gameStatistics is null', () => {
            gameStatisticsSignal.set(null);
            fixture.detectChanges();

            const result = component.globalStatistics();

            expect(result).toEqual({
                gameDuration: DEFAULT_GAME_DURATION,
                totalTurns: DEFAULT_TOTAL_TURNS,
                tilesVisitedPercentage: DEFAULT_TILES_VISITED_PERCENTAGE,
                totalTeleportations: DEFAULT_TOTAL_TELEPORTATIONS,
                doorsManipulatedPercentage: DEFAULT_DOORS_MANIPULATED_PERCENTAGE,
                sanctuariesUsedPercentage: DEFAULT_SANCTUARIES_USED_PERCENTAGE,
                flagHoldersCount: DEFAULT_FLAG_HOLDERS_COUNT,
            });
        });
    });

    describe('sortBy', () => {
        beforeEach(() => {
            const mockGlobalStats = createMockGlobalStatistics();
            const mockPlayersStats = [
                createMockPlayerStatistics(TEST_PLAYER_NAME_1, TEST_COMBAT_COUNT_1, TEST_COMBAT_WINS_1, TEST_COMBAT_LOSSES_1, TEST_HEALTH_LOST_1, TEST_HEALTH_DEALT_1, TEST_TILES_VISITED_PERCENTAGE_1),
                createMockPlayerStatistics(TEST_PLAYER_NAME_2, TEST_COMBAT_COUNT_2, TEST_COMBAT_WINS_2, TEST_COMBAT_LOSSES_2, TEST_HEALTH_LOST_2, TEST_HEALTH_DEALT_2, TEST_TILES_VISITED_PERCENTAGE_2),
                createMockPlayerStatistics(TEST_PLAYER_NAME_3, TEST_COMBAT_COUNT_3, TEST_COMBAT_WINS_3, TEST_COMBAT_LOSSES_3, TEST_HEALTH_LOST_3, TEST_HEALTH_DEALT_3, TEST_TILES_VISITED_PERCENTAGE_3),
            ];
            const mockGameStats = createMockGameStatistics(mockPlayersStats, mockGlobalStats);
            gameStatisticsSignal.set(mockGameStats);
            fixture.detectChanges();
        });

        it('should set sortColumn to new column and sortDirection to asc when sorting by different column', () => {
            component.sortColumn = DEFAULT_SORT_COLUMN;
            component.sortDirection = DEFAULT_SORT_DIRECTION_ASC;
            fixture.detectChanges();

            component.sortBy('combatCount');

            expect(component.sortColumn).toBe('combatCount');
            expect(component.sortDirection).toBe(DEFAULT_SORT_DIRECTION_ASC);
            expect(mockStatisticsService.setGameStatistics).toHaveBeenCalledTimes(1);
        });

        it('should toggle sortDirection when sorting by same column', () => {
            component.sortColumn = 'combatCount';
            component.sortDirection = DEFAULT_SORT_DIRECTION_ASC;
            fixture.detectChanges();

            component.sortBy('combatCount');

            expect(component.sortColumn).toBe('combatCount');
            expect(component.sortDirection).toBe(DEFAULT_SORT_DIRECTION_DESC);
            expect(mockStatisticsService.setGameStatistics).toHaveBeenCalledTimes(1);
        });

        it('should toggle sortDirection from desc to asc when sorting by same column', () => {
            component.sortColumn = 'combatCount';
            component.sortDirection = DEFAULT_SORT_DIRECTION_DESC;
            fixture.detectChanges();

            component.sortBy('combatCount');

            expect(component.sortColumn).toBe('combatCount');
            expect(component.sortDirection).toBe(DEFAULT_SORT_DIRECTION_ASC);
            expect(mockStatisticsService.setGameStatistics).toHaveBeenCalledTimes(1);
        });

        it('should sort playersStatistics by name ascending', () => {
            // Set sortColumn to a different column so the call sets it to 'name' with 'asc'
            component.sortColumn = 'combatCount';
            component.sortDirection = DEFAULT_SORT_DIRECTION_ASC;
            fixture.detectChanges();

            component.sortBy('name');

            const callArgs = mockStatisticsService.setGameStatistics.calls.mostRecent().args[0];
            expect(callArgs.playersStatistics[0].name).toBe(TEST_PLAYER_NAME_1);
            expect(callArgs.playersStatistics[1].name).toBe(TEST_PLAYER_NAME_2);
            expect(callArgs.playersStatistics[2].name).toBe(TEST_PLAYER_NAME_3);
        });

        it('should sort playersStatistics by name descending', () => {
            // Set sortColumn to a different column so first call sets it to 'name' with 'asc'
            component.sortColumn = 'combatCount';
            component.sortDirection = DEFAULT_SORT_DIRECTION_ASC;
            fixture.detectChanges();

            // First call sets the column to 'name' and direction to 'asc'
            component.sortBy('name');
            // Second call toggles direction to 'desc'
            component.sortBy('name');

            const callArgs = mockStatisticsService.setGameStatistics.calls.mostRecent().args[0];
            expect(callArgs.playersStatistics[0].name).toBe(TEST_PLAYER_NAME_3);
            expect(callArgs.playersStatistics[1].name).toBe(TEST_PLAYER_NAME_2);
            expect(callArgs.playersStatistics[2].name).toBe(TEST_PLAYER_NAME_1);
        });

        it('should sort playersStatistics by combatCount ascending', () => {
            component.sortColumn = DEFAULT_SORT_COLUMN;
            component.sortDirection = DEFAULT_SORT_DIRECTION_ASC;
            fixture.detectChanges();

            component.sortBy('combatCount');

            const callArgs = mockStatisticsService.setGameStatistics.calls.mostRecent().args[0];
            expect(callArgs.playersStatistics[0].combatCount).toBe(TEST_COMBAT_COUNT_2);
            expect(callArgs.playersStatistics[1].combatCount).toBe(TEST_COMBAT_COUNT_1);
            expect(callArgs.playersStatistics[2].combatCount).toBe(TEST_COMBAT_COUNT_3);
        });

        it('should sort playersStatistics by combatCount descending', () => {
            // Set sortColumn to a different column so first call sets it to 'combatCount' with 'asc'
            component.sortColumn = DEFAULT_SORT_COLUMN;
            component.sortDirection = DEFAULT_SORT_DIRECTION_ASC;
            fixture.detectChanges();

            // First call sets the column to 'combatCount' and direction to 'asc'
            component.sortBy('combatCount');
            // Second call toggles direction to 'desc'
            component.sortBy('combatCount');

            const callArgs = mockStatisticsService.setGameStatistics.calls.mostRecent().args[0];
            expect(callArgs.playersStatistics[0].combatCount).toBe(TEST_COMBAT_COUNT_3);
            expect(callArgs.playersStatistics[1].combatCount).toBe(TEST_COMBAT_COUNT_1);
            expect(callArgs.playersStatistics[2].combatCount).toBe(TEST_COMBAT_COUNT_2);
        });

        it('should sort playersStatistics by combatWins ascending', () => {
            component.sortColumn = DEFAULT_SORT_COLUMN;
            component.sortDirection = DEFAULT_SORT_DIRECTION_ASC;
            fixture.detectChanges();

            component.sortBy('combatWins');

            const callArgs = mockStatisticsService.setGameStatistics.calls.mostRecent().args[0];
            expect(callArgs.playersStatistics[0].combatWins).toBe(TEST_COMBAT_WINS_2);
            expect(callArgs.playersStatistics[1].combatWins).toBe(TEST_COMBAT_WINS_1);
            expect(callArgs.playersStatistics[2].combatWins).toBe(TEST_COMBAT_WINS_3);
        });

        it('should sort playersStatistics by combatLosses ascending', () => {
            component.sortColumn = DEFAULT_SORT_COLUMN;
            component.sortDirection = DEFAULT_SORT_DIRECTION_ASC;
            fixture.detectChanges();

            component.sortBy('combatLosses');

            const callArgs = mockStatisticsService.setGameStatistics.calls.mostRecent().args[0];
            expect(callArgs.playersStatistics[0].combatLosses).toBe(TEST_COMBAT_LOSSES_1);
        });

        it('should sort playersStatistics by healthLost ascending', () => {
            component.sortColumn = DEFAULT_SORT_COLUMN;
            component.sortDirection = DEFAULT_SORT_DIRECTION_ASC;
            fixture.detectChanges();

            component.sortBy('healthLost');

            const callArgs = mockStatisticsService.setGameStatistics.calls.mostRecent().args[0];
            expect(callArgs.playersStatistics[0].healthLost).toBe(TEST_HEALTH_LOST_2);
            expect(callArgs.playersStatistics[1].healthLost).toBe(TEST_HEALTH_LOST_1);
            expect(callArgs.playersStatistics[2].healthLost).toBe(TEST_HEALTH_LOST_3);
        });

        it('should sort playersStatistics by healthDealt ascending', () => {
            component.sortColumn = DEFAULT_SORT_COLUMN;
            component.sortDirection = DEFAULT_SORT_DIRECTION_ASC;
            fixture.detectChanges();

            component.sortBy('healthDealt');

            const callArgs = mockStatisticsService.setGameStatistics.calls.mostRecent().args[0];
            expect(callArgs.playersStatistics[0].healthDealt).toBe(TEST_HEALTH_DEALT_2);
            expect(callArgs.playersStatistics[1].healthDealt).toBe(TEST_HEALTH_DEALT_1);
            expect(callArgs.playersStatistics[2].healthDealt).toBe(TEST_HEALTH_DEALT_3);
        });

        it('should sort playersStatistics by tilesVisitedPercentage ascending', () => {
            component.sortColumn = DEFAULT_SORT_COLUMN;
            component.sortDirection = DEFAULT_SORT_DIRECTION_ASC;
            fixture.detectChanges();

            component.sortBy('tilesVisitedPercentage');

            const callArgs = mockStatisticsService.setGameStatistics.calls.mostRecent().args[0];
            expect(callArgs.playersStatistics[0].tilesVisitedPercentage).toBe(TEST_TILES_VISITED_PERCENTAGE_2);
            expect(callArgs.playersStatistics[1].tilesVisitedPercentage).toBe(TEST_TILES_VISITED_PERCENTAGE_1);
            expect(callArgs.playersStatistics[2].tilesVisitedPercentage).toBe(TEST_TILES_VISITED_PERCENTAGE_3);
        });

        it('should not call setGameStatistics when gameStatistics is null', () => {
            gameStatisticsSignal.set(null);
            fixture.detectChanges();

            component.sortBy('combatCount');

            expect(mockStatisticsService.setGameStatistics).not.toHaveBeenCalled();
        });
    });

    describe('getSortIcon', () => {
        it('should return empty string when column is not active', () => {
            component.sortColumn = 'combatCount';
            fixture.detectChanges();

            const result = component.getSortIcon('name');

            expect(result).toBe(SORT_ICON_EMPTY);
        });

        it('should return "asc" when column is active and direction is asc', () => {
            component.sortColumn = 'combatCount';
            component.sortDirection = DEFAULT_SORT_DIRECTION_ASC;
            fixture.detectChanges();

            const result = component.getSortIcon('combatCount');

            expect(result).toBe(DEFAULT_SORT_DIRECTION_ASC);
        });

        it('should return "desc" when column is active and direction is desc', () => {
            component.sortColumn = 'combatCount';
            component.sortDirection = DEFAULT_SORT_DIRECTION_DESC;
            fixture.detectChanges();

            const result = component.getSortIcon('combatCount');

            expect(result).toBe(DEFAULT_SORT_DIRECTION_DESC);
        });
    });

    describe('isSortActive', () => {
        it('should return true when column matches sortColumn', () => {
            component.sortColumn = 'combatCount';
            fixture.detectChanges();

            const result = component.isSortActive('combatCount');

            expect(result).toBe(true);
        });

        it('should return false when column does not match sortColumn', () => {
            component.sortColumn = 'combatCount';
            fixture.detectChanges();

            const result = component.isSortActive('name');

            expect(result).toBe(false);
        });
    });
});

