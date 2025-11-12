import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { ROUTES } from '@app/enums/routes.enum';
import { InGameService } from '@app/services/in-game/in-game.service';
import { PlayerService } from '@app/services/player/player.service';
import { TimerCoordinatorService } from '@app/services/timer-coordinator/timer-coordinator.service';
import { Avatar } from '@common/enums/avatar.enum';
import { Dice } from '@common/enums/dice.enum';
import { Player } from '@common/interfaces/player.interface';
import { GameOverOverlayComponent } from './game-over-overlay.component';

const TEST_TIMER_DURATION = 5000;

describe('GameOverOverlayComponent', () => {
    let component: GameOverOverlayComponent;
    let fixture: ComponentFixture<GameOverOverlayComponent>;
    let mockInGameService: jasmine.SpyObj<InGameService>;
    let mockPlayerService: jasmine.SpyObj<PlayerService>;
    let mockRouter: jasmine.SpyObj<Router>;
    let mockTimerCoordinatorService: jasmine.SpyObj<TimerCoordinatorService>;

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
        },
    ];

    beforeEach(async () => {
        mockInGameService = jasmine.createSpyObj('InGameService', ['reset'], {
            gameOverData: signal(mockGameOverData),
            inGamePlayers: signal(mockPlayers.reduce((acc, player) => ({ ...acc, [player.id]: player }), {})),
        });

        mockPlayerService = jasmine.createSpyObj('PlayerService', [], {
            id: signal('player1'),
        });

        mockRouter = jasmine.createSpyObj('Router', ['navigate']);
        mockTimerCoordinatorService = jasmine.createSpyObj('TimerCoordinatorService', [
            'startGameOverTimer',
            'stopGameOverTimer',
            'gameOverTimeRemaining',
        ]);

        await TestBed.configureTestingModule({
            imports: [GameOverOverlayComponent],
            providers: [
                { provide: InGameService, useValue: mockInGameService },
                { provide: PlayerService, useValue: mockPlayerService },
                { provide: Router, useValue: mockRouter },
                { provide: TimerCoordinatorService, useValue: mockTimerCoordinatorService },
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
        expect(mockTimerCoordinatorService.startGameOverTimer).toHaveBeenCalledWith(mockRouter);
    });

    it('should stop game over timer when game over data is null', () => {
        Object.defineProperty(mockInGameService, 'gameOverData', {
            value: signal(null),
            configurable: true,
        });
        fixture.detectChanges();
        expect(mockTimerCoordinatorService.stopGameOverTimer).toHaveBeenCalled();
    });

    it('should return game over time remaining from timer service', () => {
        mockTimerCoordinatorService.gameOverTimeRemaining.and.returnValue(TEST_TIMER_DURATION);
        expect(component.gameOverTimeRemaining).toBe(TEST_TIMER_DURATION);
    });

    it('should stop timer on destroy', () => {
        component.ngOnDestroy();
        expect(mockTimerCoordinatorService.stopGameOverTimer).toHaveBeenCalled();
    });

    it('should stop timer on return to home', () => {
        component.returnToHome();
        expect(mockTimerCoordinatorService.stopGameOverTimer).toHaveBeenCalled();
    });
});
