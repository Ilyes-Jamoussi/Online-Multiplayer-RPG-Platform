import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { PlayersListComponent } from './players-list.component';
import { InGameService } from '@app/services/in-game/in-game.service';
import { PlayerService } from '@app/services/player/player.service';
import { Player } from '@common/interfaces/player.interface';
import { Avatar } from '@common/enums/avatar.enum';
import { Dice } from '@common/enums/dice.enum';

const TEST_COMBAT_WINS_PLAYER1 = 3;
const TEST_HEALTH_PERCENTAGE_PLAYER1 = 75;
const TEST_HEALTH_PERCENTAGE_PLAYER2 = 50;

describe('PlayersListComponent', () => {
    let component: PlayersListComponent;
    let fixture: ComponentFixture<PlayersListComponent>;
    let mockInGameService: jasmine.SpyObj<InGameService>;
    let mockPlayerService: jasmine.SpyObj<PlayerService>;

    const mockPlayers: Record<string, Player> = {
        player1: {
            id: 'player1',
            name: 'Player 1',
            avatar: Avatar.Avatar1,
            isAdmin: true,
            baseHealth: 4,
            healthBonus: 0,
            health: 3,
            maxHealth: 4,
            baseSpeed: 3,
            speedBonus: 0,
            speed: 3,
            baseAttack: 4,
            attackBonus: 0,
            attack: 4,
            baseDefense: 4,
            defenseBonus: 0,
            defense: 4,
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
        },
        player2: {
            id: 'player2',
            name: 'Player 2',
            avatar: Avatar.Avatar2,
            isAdmin: false,
            baseHealth: 4,
            healthBonus: 0,
            health: 2,
            maxHealth: 4,
            baseSpeed: 3,
            speedBonus: 0,
            speed: 3,
            baseAttack: 4,
            attackBonus: 0,
            attack: 4,
            baseDefense: 4,
            defenseBonus: 0,
            defense: 4,
            attackDice: Dice.D6,
            defenseDice: Dice.D6,
            x: 2,
            y: 2,
            isInGame: false,
            startPointId: 'start2',
            actionsRemaining: 2,
            combatCount: 3,
            combatWins: 1,
            combatLosses: 2,
            combatDraws: 0,
        },
    };

    const mockTurnOrder = ['player1', 'player2'];

    beforeEach(async () => {
        mockInGameService = jasmine.createSpyObj('InGameService', [], {
            turnOrder: signal(mockTurnOrder),
            inGamePlayers: signal(mockPlayers),
            activePlayer: mockPlayers.player1,
        });

        mockPlayerService = jasmine.createSpyObj('PlayerService', [], {
            id: signal('player1'),
        });

        await TestBed.configureTestingModule({
            imports: [PlayersListComponent],
            providers: [
                { provide: InGameService, useValue: mockInGameService },
                { provide: PlayerService, useValue: mockPlayerService },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(PlayersListComponent);
        component = fixture.componentInstance;
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should return ordered players based on turn order', () => {
        const orderedPlayers = component.orderedPlayers();
        expect(orderedPlayers).toEqual([mockPlayers.player1, mockPlayers.player2]);
    });

    it('should return true when player is active player', () => {
        expect(component.isActivePlayer(mockPlayers.player1)).toBe(true);
    });

    it('should return false when player is not active player', () => {
        expect(component.isActivePlayer(mockPlayers.player2)).toBe(false);
    });

    it('should return true when player is current user', () => {
        expect(component.isCurrentUser(mockPlayers.player1)).toBe(true);
    });

    it('should return false when player is not current user', () => {
        expect(component.isCurrentUser(mockPlayers.player2)).toBe(false);
    });

    it('should return true when player is admin', () => {
        expect(component.isAdmin(mockPlayers.player1)).toBe(true);
    });

    it('should return false when player is not admin', () => {
        expect(component.isAdmin(mockPlayers.player2)).toBe(false);
    });

    it('should return false when player has not abandoned', () => {
        expect(component.hasAbandoned(mockPlayers.player1)).toBe(false);
    });

    it('should return true when player has abandoned', () => {
        expect(component.hasAbandoned(mockPlayers.player2)).toBe(true);
    });

    it('should return combat wins for player', () => {
        expect(component.getCombatWins(mockPlayers.player1)).toBe(TEST_COMBAT_WINS_PLAYER1);
        expect(component.getCombatWins(mockPlayers.player2)).toBe(1);
    });

    it('should calculate health percentage correctly', () => {
        expect(component.getHealthPercentage(mockPlayers.player1)).toBe(TEST_HEALTH_PERCENTAGE_PLAYER1);
        expect(component.getHealthPercentage(mockPlayers.player2)).toBe(TEST_HEALTH_PERCENTAGE_PLAYER2);
    });

    it('should return 0 health percentage when max health is 0', () => {
        const playerWithZeroMaxHealth = { ...mockPlayers.player1, maxHealth: 0 };
        expect(component.getHealthPercentage(playerWithZeroMaxHealth)).toBe(0);
    });

    it('should handle empty turn order', () => {
        Object.defineProperty(mockInGameService, 'turnOrder', {
            value: signal([]),
            configurable: true,
        });
        
        const orderedPlayers = component.orderedPlayers();
        expect(orderedPlayers).toEqual([]);
    });

    it('should handle no active player', () => {
        Object.defineProperty(mockInGameService, 'activePlayer', {
            value: null,
            configurable: true,
        });
        
        expect(component.isActivePlayer(mockPlayers.player1)).toBe(false);
    });
});