/* eslint-disable max-lines -- Test file with comprehensive test coverage */
import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { ROUTES } from '@app/enums/routes.enum';
import { InGameService } from '@app/services/in-game/in-game.service';
import { PlayerService } from '@app/services/player/player.service';
import { TimerService } from '@app/services/timer/timer.service';
import { Avatar } from '@common/enums/avatar.enum';
import { Dice } from '@common/enums/dice.enum';
import { GameMode } from '@common/enums/game-mode.enum';
import { Player } from '@common/interfaces/player.interface';
import { MapSize } from '@common/enums/map-size.enum';
import { InGameSession } from '@common/interfaces/session.interface';
import { GameOverOverlayComponent } from './game-over-overlay.component';

const TEST_TIMER_DURATION = 5000;

describe('GameOverOverlayComponent', () => {
    let component: GameOverOverlayComponent;
    let fixture: ComponentFixture<GameOverOverlayComponent>;
    let mockInGameService: jasmine.SpyObj<InGameService>;
    let mockPlayerService: jasmine.SpyObj<PlayerService>;
    let mockRouter: jasmine.SpyObj<Router>;
    let mockTimerService: jasmine.SpyObj<TimerService>;

    const mockGameOverData = {
        winnerId: 'player1',
        winnerName: 'Winner Player',
    };

    const mockPlayers: Player[] = [
        {
            id: 'player1',
            name: 'Winner Player',
            avatar: Avatar.Avatar1,
            isAdmin: false,
            baseHealth: 4,
            healthBonus: 0,
            health: 4,
            maxHealth: 4,
            baseSpeed: 3,
            speedBonus: 0,
            speed: 3,
            baseAttack: 4,
            attackBonus: 0,
            baseDefense: 4,
            defenseBonus: 0,
            attackDice: Dice.D6,
            defenseDice: Dice.D6,
            x: 1,
            y: 1,
            isInGame: true,
            startPointId: 'start1',
            actionsRemaining: 2,
            combatCount: 5,
            combatWins: 3,
            combatLosses: 1,
            combatDraws: 1,
            hasCombatBonus: false,
            boatSpeedBonus: 0,
            boatSpeed: 0,
        },
        {
            id: 'player2',
            name: 'Second Player',
            avatar: Avatar.Avatar2,
            isAdmin: false,
            baseHealth: 4,
            healthBonus: 0,
            health: 4,
            maxHealth: 4,
            baseSpeed: 3,
            speedBonus: 0,
            speed: 3,
            baseAttack: 4,
            attackBonus: 0,
            baseDefense: 4,
            defenseBonus: 0,
            attackDice: Dice.D6,
            defenseDice: Dice.D6,
            x: 2,
            y: 2,
            isInGame: true,
            startPointId: 'start2',
            actionsRemaining: 2,
            combatCount: 3,
            combatWins: 1,
            combatLosses: 2,
            combatDraws: 0,
            hasCombatBonus: false,
            boatSpeedBonus: 0,
            boatSpeed: 0,
        },
    ];

    beforeEach(async () => {
        const inGamePlayersRecord: Record<string, Player> = mockPlayers.reduce((acc, player) => ({ ...acc, [player.id]: player }), {});
        const mockSession: InGameSession = {
            id: 'session1',
            gameId: 'game1',
            maxPlayers: 4,
            mode: GameMode.CLASSIC,
            inGameId: 'ingame1',
            chatId: 'chat1',
            isGameStarted: true,
            inGamePlayers: inGamePlayersRecord,
            teams: {
                1: { number: 1, playerIds: ['player1'] },
                2: { number: 2, playerIds: ['player2'] },
            },
            currentTurn: { turnNumber: 1, activePlayerId: 'player1', hasUsedAction: false },
            startPoints: [],
            mapSize: MapSize.SMALL,
            turnOrder: ['player1', 'player2'],
            playerCount: mockPlayers.length,
        };

        mockInGameService = jasmine.createSpyObj('InGameService', ['reset', 'getPlayerByPlayerId'], {
            gameOverData: signal(mockGameOverData),
            inGamePlayers: signal(inGamePlayersRecord),
            mode: () => GameMode.CLASSIC,
            inGameSession: signal(mockSession),
        });
        mockInGameService.getPlayerByPlayerId.and.callFake((playerId: string) => inGamePlayersRecord[playerId]);

        mockPlayerService = jasmine.createSpyObj('PlayerService', [], {
            id: signal('player1'),
        });

        mockRouter = jasmine.createSpyObj('Router', ['navigate']);
        mockTimerService = jasmine.createSpyObj('TimerService', ['startGameOverTimer', 'stopGameOverTimer', 'gameOverTimeRemaining']);

        await TestBed.configureTestingModule({
            imports: [GameOverOverlayComponent],
            providers: [
                { provide: InGameService, useValue: mockInGameService },
                { provide: PlayerService, useValue: mockPlayerService },
                { provide: Router, useValue: mockRouter },
                { provide: TimerService, useValue: mockTimerService },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(GameOverOverlayComponent);
        component = fixture.componentInstance;
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should return game over data from service', () => {
        expect(component.gameOverData).toBe(mockGameOverData);
    });

    it('should return true when current player is winner', () => {
        expect(component.isWinner).toBe(true);
    });

    it('should return false when current player is not winner', () => {
        Object.defineProperty(mockPlayerService, 'id', {
            value: signal('player2'),
            configurable: true,
        });
        expect(component.isWinner).toBe(false);
    });

    it('should return winner title when current player is winner', () => {
        expect(component.title).toBe('Tu as gagné la partie !');
    });

    it('should return winner name title when current player is not winner', () => {
        Object.defineProperty(mockPlayerService, 'id', {
            value: signal('player2'),
            configurable: true,
        });
        expect(component.title).toBe('Winner Player a gagné la partie !');
    });

    it('should return empty array when no game over data', () => {
        Object.defineProperty(mockInGameService, 'gameOverData', {
            value: signal(null),
            configurable: true,
        });
        expect(component.playerStats).toEqual([]);
    });

    it('should return sorted player stats with winner marked', () => {
        const stats = component.playerStats;

        expect(stats).toEqual([
            { name: 'Winner Player', wins: 3, isWinner: true },
            { name: 'Second Player', wins: 1, isWinner: false },
        ]);
    });

    it('should filter out players not in game', () => {
        const playersWithInactive = [
            ...mockPlayers,
            {
                ...mockPlayers[0],
                id: 'player3',
                name: 'Inactive Player',
                isInGame: false,
                combatWins: 5,
            },
        ];

        Object.defineProperty(mockInGameService, 'inGamePlayers', {
            value: signal(playersWithInactive.reduce((acc, player) => ({ ...acc, [player.id]: player }), {})),
            configurable: true,
        });

        const stats = component.playerStats;
        expect(stats.length).toBe(2);
        expect(stats.find((stat) => stat.name === 'Inactive Player')).toBeUndefined();
    });

    it('should reset service and navigate to home on returnToHome', () => {
        component.returnToHome();

        expect(mockInGameService.reset).toHaveBeenCalled();
        expect(mockRouter.navigate).toHaveBeenCalledWith([ROUTES.HomePage]);
    });

    it('should handle undefined game over data in isWinner', () => {
        Object.defineProperty(mockInGameService, 'gameOverData', {
            value: signal(undefined),
            configurable: true,
        });
        expect(component.isWinner).toBe(false);
    });

    it('should handle undefined game over data in title', () => {
        Object.defineProperty(mockInGameService, 'gameOverData', {
            value: signal(undefined),
            configurable: true,
        });
        expect(component.title).toBe('undefined a gagné la partie !');
    });

    it('should start game over timer when game over data exists', () => {
        fixture.detectChanges();
        expect(mockTimerService.startGameOverTimer).toHaveBeenCalledWith(mockRouter);
    });

    it('should stop game over timer when game over data is null', () => {
        Object.defineProperty(mockInGameService, 'gameOverData', {
            value: signal(null),
            configurable: true,
        });
        fixture.detectChanges();
        expect(mockTimerService.stopGameOverTimer).toHaveBeenCalled();
    });

    it('should return game over time remaining from timer service', () => {
        mockTimerService.gameOverTimeRemaining.and.returnValue(TEST_TIMER_DURATION);
        expect(component.gameOverTimeRemaining).toBe(TEST_TIMER_DURATION);
    });

    it('should stop timer on destroy', () => {
        component.ngOnDestroy();
        expect(mockTimerService.stopGameOverTimer).toHaveBeenCalled();
    });

    it('should stop timer on return to home', () => {
        component.returnToHome();
        expect(mockTimerService.stopGameOverTimer).toHaveBeenCalled();
    });

    describe('winnerTeamNumber', () => {
        const mockTeamNumber = 1;

        it('should return null when gameOverData is null', () => {
            Object.defineProperty(mockInGameService, 'gameOverData', {
                value: signal(null),
                configurable: true,
            });
            Object.defineProperty(mockInGameService, 'mode', {
                value: () => GameMode.CTF,
                configurable: true,
            });
            expect(component.winnerTeamNumber).toBeNull();
        });

        it('should return null when not in CTF mode', () => {
            Object.defineProperty(mockInGameService, 'gameOverData', {
                value: signal(mockGameOverData),
                configurable: true,
            });
            Object.defineProperty(mockInGameService, 'mode', {
                value: () => GameMode.CLASSIC,
                configurable: true,
            });
            expect(component.winnerTeamNumber).toBeNull();
        });

        it('should return null when winner player has no teamNumber', () => {
            Object.defineProperty(mockInGameService, 'gameOverData', {
                value: signal(mockGameOverData),
                configurable: true,
            });
            Object.defineProperty(mockInGameService, 'mode', {
                value: () => GameMode.CTF,
                configurable: true,
            });
            mockInGameService.getPlayerByPlayerId.and.returnValue(undefined as unknown as Player);
            expect(component.winnerTeamNumber).toBeNull();
        });

        it('should return teamNumber when winner exists and has teamNumber', () => {
            const winnerPlayer = { ...mockPlayers[0], teamNumber: mockTeamNumber };
            Object.defineProperty(mockInGameService, 'gameOverData', {
                value: signal(mockGameOverData),
                configurable: true,
            });
            Object.defineProperty(mockInGameService, 'mode', {
                value: () => GameMode.CTF,
                configurable: true,
            });
            mockInGameService.getPlayerByPlayerId.and.returnValue(winnerPlayer);
            expect(component.winnerTeamNumber).toBe(mockTeamNumber);
        });
    });

    describe('myTeamNumber', () => {
        const mockTeamNumber = 2;

        it('should return null when not in CTF mode', () => {
            Object.defineProperty(mockInGameService, 'mode', {
                value: () => GameMode.CLASSIC,
                configurable: true,
            });
            expect(component.myTeamNumber).toBeNull();
        });

        it('should return null when player has no teamNumber', () => {
            Object.defineProperty(mockInGameService, 'mode', {
                value: () => GameMode.CTF,
                configurable: true,
            });
            mockInGameService.getPlayerByPlayerId.and.returnValue(undefined as unknown as Player);
            expect(component.myTeamNumber).toBeNull();
        });

        it('should return teamNumber when player exists and has teamNumber', () => {
            const myPlayer = { ...mockPlayers[0], teamNumber: mockTeamNumber };
            Object.defineProperty(mockInGameService, 'mode', {
                value: () => GameMode.CTF,
                configurable: true,
            });
            mockInGameService.getPlayerByPlayerId.and.returnValue(myPlayer);
            expect(component.myTeamNumber).toBe(mockTeamNumber);
        });
    });

    describe('winnerTeamPlayers', () => {
        const mockTeamNumber = 1;
        const mockPlayerName1 = 'Player One';
        const mockPlayerName2 = 'Player Two';
        const mockPlayerId1 = 'player1';
        const mockPlayerId2 = 'player2';
        const mockPlayerId3 = 'player3';

        it('should return empty array when winnerTeamNumber is null', () => {
            Object.defineProperty(mockInGameService, 'gameOverData', {
                value: signal(null),
                configurable: true,
            });
            Object.defineProperty(mockInGameService, 'mode', {
                value: () => GameMode.CTF,
                configurable: true,
            });
            expect(component.winnerTeamPlayers).toEqual([]);
        });

        it('should return empty array when team does not exist', () => {
            const sessionWithoutTeam: InGameSession = {
                ...mockInGameService.inGameSession(),
                teams: {},
            };
            Object.defineProperty(mockInGameService, 'gameOverData', {
                value: signal(mockGameOverData),
                configurable: true,
            });
            Object.defineProperty(mockInGameService, 'mode', {
                value: () => GameMode.CTF,
                configurable: true,
            });
            Object.defineProperty(mockInGameService, 'inGameSession', {
                value: signal(sessionWithoutTeam),
                configurable: true,
            });
            const winnerPlayer = { ...mockPlayers[0], teamNumber: mockTeamNumber };
            mockInGameService.getPlayerByPlayerId.and.returnValue(winnerPlayer);
            expect(component.winnerTeamPlayers).toEqual([]);
        });

        it('should return player names for winner team', () => {
            const sessionWithTeam: InGameSession = {
                ...mockInGameService.inGameSession(),
                teams: {
                    [mockTeamNumber]: { number: mockTeamNumber, playerIds: [mockPlayerId1, mockPlayerId2] },
                },
                inGamePlayers: {
                    [mockPlayerId1]: { ...mockPlayers[0], name: mockPlayerName1 },
                    [mockPlayerId2]: { ...mockPlayers[1], name: mockPlayerName2 },
                },
            };
            Object.defineProperty(mockInGameService, 'gameOverData', {
                value: signal(mockGameOverData),
                configurable: true,
            });
            Object.defineProperty(mockInGameService, 'mode', {
                value: () => GameMode.CTF,
                configurable: true,
            });
            Object.defineProperty(mockInGameService, 'inGameSession', {
                value: signal(sessionWithTeam),
                configurable: true,
            });
            const winnerPlayer = { ...mockPlayers[0], teamNumber: mockTeamNumber };
            mockInGameService.getPlayerByPlayerId.and.returnValue(winnerPlayer);
            expect(component.winnerTeamPlayers).toEqual([mockPlayerName1, mockPlayerName2]);
        });

        it('should filter out empty names', () => {
            const sessionWithTeam: InGameSession = {
                ...mockInGameService.inGameSession(),
                teams: {
                    [mockTeamNumber]: { number: mockTeamNumber, playerIds: [mockPlayerId1, mockPlayerId3] },
                },
                inGamePlayers: {
                    [mockPlayerId1]: { ...mockPlayers[0], name: mockPlayerName1 },
                    [mockPlayerId3]: undefined as unknown as Player,
                },
            };
            Object.defineProperty(mockInGameService, 'gameOverData', {
                value: signal(mockGameOverData),
                configurable: true,
            });
            Object.defineProperty(mockInGameService, 'mode', {
                value: () => GameMode.CTF,
                configurable: true,
            });
            Object.defineProperty(mockInGameService, 'inGameSession', {
                value: signal(sessionWithTeam),
                configurable: true,
            });
            const winnerPlayer = { ...mockPlayers[0], teamNumber: mockTeamNumber };
            mockInGameService.getPlayerByPlayerId.and.returnValue(winnerPlayer);
            expect(component.winnerTeamPlayers).toEqual([mockPlayerName1]);
        });
    });

    describe('title', () => {
        const mockTeamNumber = 1;
        const mockMyTeamNumber = 1;
        const mockOtherTeamNumber = 2;

        it('should return team win message when CTF mode and my team wins', () => {
            const winnerPlayer = { ...mockPlayers[0], teamNumber: mockTeamNumber };
            const myPlayer = { ...mockPlayers[0], teamNumber: mockMyTeamNumber };
            Object.defineProperty(mockInGameService, 'gameOverData', {
                value: signal(mockGameOverData),
                configurable: true,
            });
            Object.defineProperty(mockInGameService, 'mode', {
                value: () => GameMode.CTF,
                configurable: true,
            });
            mockInGameService.getPlayerByPlayerId.and.callFake((playerId: string) => {
                if (playerId === mockGameOverData.winnerId) return winnerPlayer;
                if (playerId === mockPlayerService.id()) return myPlayer;
                return undefined as unknown as Player;
            });
            expect(component.title).toBe('Votre équipe a gagné la partie !');
        });

        it('should return other team win message when CTF mode and other team wins', () => {
            const mockMyPlayerId = 'player2';
            const winnerPlayer = { ...mockPlayers[0], teamNumber: mockTeamNumber };
            const myPlayer = { ...mockPlayers[1], id: mockMyPlayerId, teamNumber: mockOtherTeamNumber };
            Object.defineProperty(mockPlayerService, 'id', {
                value: signal(mockMyPlayerId),
                configurable: true,
            });
            Object.defineProperty(mockInGameService, 'gameOverData', {
                value: signal(mockGameOverData),
                configurable: true,
            });
            Object.defineProperty(mockInGameService, 'mode', {
                value: () => GameMode.CTF,
                configurable: true,
            });
            mockInGameService.getPlayerByPlayerId.and.callFake((playerId: string) => {
                if (playerId === mockGameOverData.winnerId) return winnerPlayer;
                if (playerId === mockMyPlayerId) return myPlayer;
                return undefined as unknown as Player;
            });
            expect(component.title).toBe(`L'équipe ${mockTeamNumber} a gagné la partie !`);
        });
    });

    describe('playerStats', () => {
        const mockCombatWins1 = 5;
        const mockCombatWins2 = 2;
        const mockCombatWins3 = 8;

        it('should return empty array when gameOverData is null', () => {
            Object.defineProperty(mockInGameService, 'gameOverData', {
                value: signal(null),
                configurable: true,
            });
            expect(component.playerStats).toEqual([]);
        });

        it('should return sorted player stats by wins descending', () => {
            const playersWithWins: Record<string, Player> = {
                player1: { ...mockPlayers[0], combatWins: mockCombatWins1 },
                player2: { ...mockPlayers[1], combatWins: mockCombatWins2 },
                player3: {
                    ...mockPlayers[0],
                    id: 'player3',
                    name: 'Third Player',
                    combatWins: mockCombatWins3,
                },
            };
            Object.defineProperty(mockInGameService, 'inGamePlayers', {
                value: signal(playersWithWins),
                configurable: true,
            });
            const stats = component.playerStats;
            expect(stats[0].wins).toBe(mockCombatWins3);
            expect(stats[1].wins).toBe(mockCombatWins1);
            expect(stats[2].wins).toBe(mockCombatWins2);
        });

        it('should mark winner correctly in player stats', () => {
            const stats = component.playerStats;
            const winnerStat = stats.find((stat) => stat.isWinner);
            expect(winnerStat).toBeDefined();
            expect(winnerStat?.name).toBe('Winner Player');
            expect(winnerStat?.isWinner).toBe(true);
        });
    });

    describe('ngOnDestroy', () => {
        it('should stop game over timer', () => {
            component.ngOnDestroy();
            expect(mockTimerService.stopGameOverTimer).toHaveBeenCalled();
        });
    });

    describe('returnToHome', () => {
        it('should stop timer, reset service and navigate to home', () => {
            mockTimerService.stopGameOverTimer.calls.reset();
            mockInGameService.reset.calls.reset();
            mockRouter.navigate.calls.reset();

            component.returnToHome();

            expect(mockTimerService.stopGameOverTimer).toHaveBeenCalled();
            expect(mockInGameService.reset).toHaveBeenCalled();
            expect(mockRouter.navigate).toHaveBeenCalledWith([ROUTES.HomePage]);
        });
    });

    describe('viewStatistics', () => {
        it('should stop timer and navigate to statistics page', () => {
            mockTimerService.stopGameOverTimer.calls.reset();
            mockRouter.navigate.calls.reset();

            component.viewStatistics();

            expect(mockTimerService.stopGameOverTimer).toHaveBeenCalled();
            expect(mockRouter.navigate).toHaveBeenCalledWith([ROUTES.StatisticsPage]);
        });
    });
});
