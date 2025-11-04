import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { PlayerInfoComponent } from './player-info.component';
import { PlayerService } from '@app/services/player/player.service';
import { AssetsService } from '@app/services/assets/assets.service';
import { Player } from '@common/models/player.interface';
import { Avatar } from '@common/enums/avatar.enum';
import { Dice } from '@common/enums/dice.enum';

describe('PlayerInfoComponent', () => {
    let component: PlayerInfoComponent;
    let fixture: ComponentFixture<PlayerInfoComponent>;
    let mockPlayerService: jasmine.SpyObj<PlayerService>;
    let mockAssetsService: jasmine.SpyObj<AssetsService>;

    const mockPlayer: Player = {
        id: 'player1',
        name: 'Test Player',
        avatar: Avatar.Avatar1,
        isAdmin: false,
        baseHealth: 4,
        healthBonus: 0,
        health: 3,
        maxHealth: 4,
        baseSpeed: 3,
        speedBonus: 1,
        speed: 4,
        baseAttack: 4,
        attackBonus: 0,
        attack: 4,
        baseDefense: 4,
        defenseBonus: 0,
        defense: 4,
        attackDice: Dice.D6,
        defenseDice: Dice.D4,
        x: 1,
        y: 1,
        isInGame: true,
        startPointId: 'start1',
        actionsRemaining: 2,
        combatCount: 5,
        combatWins: 3,
        combatLosses: 1,
        combatDraws: 1,
    };

    beforeEach(async () => {
        mockPlayerService = jasmine.createSpyObj('PlayerService', [], {
            player: signal(mockPlayer),
            name: signal('Test Player'),
            health: signal(3),
            maxHealth: signal(4),
            speed: signal(4),
            attack: signal(4),
            defense: signal(4),
            attackDice: signal(Dice.D6),
            defenseDice: signal(Dice.D4),
            speedBonus: signal(1),
            actionsRemaining: signal(2),
            combatCount: signal(5),
            combatWins: signal(3),
            combatLosses: signal(1),
            combatDraws: signal(1),
        });

        mockAssetsService = jasmine.createSpyObj('AssetsService', ['getAvatarStaticImage']);
        mockAssetsService.getAvatarStaticImage.and.returnValue('/assets/avatar1.png');

        await TestBed.configureTestingModule({
            imports: [PlayerInfoComponent],
            providers: [
                { provide: PlayerService, useValue: mockPlayerService },
                { provide: AssetsService, useValue: mockAssetsService },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(PlayerInfoComponent);
        component = fixture.componentInstance;
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should return player from service', () => {
        expect(component.player).toBe(mockPlayer);
    });

    it('should return avatar image', () => {
        expect(component.avatarImage).toBe('/assets/avatar1.png');
        expect(mockAssetsService.getAvatarStaticImage).toHaveBeenCalledWith(Avatar.Avatar1);
    });

    it('should use default avatar when player has no avatar', () => {
        const playerWithoutAvatar = { ...mockPlayer, avatar: null };
        Object.defineProperty(mockPlayerService, 'player', {
            value: signal(playerWithoutAvatar),
            configurable: true,
        });
        
        component.avatarImage;
        expect(mockAssetsService.getAvatarStaticImage).toHaveBeenCalledWith(Avatar.Avatar1);
    });

    it('should return player name', () => {
        expect(component.playerName).toBe('Test Player');
    });

    it('should return current health', () => {
        expect(component.currentHealth).toBe(3);
    });

    it('should return max health', () => {
        expect(component.maxHealth).toBe(4);
    });

    it('should return rapidity value', () => {
        expect(component.rapidityValue).toBe(4);
    });

    it('should return attack value', () => {
        expect(component.attackValue).toBe(4);
    });

    it('should return defense value', () => {
        expect(component.defenseValue).toBe(4);
    });

    it('should return attack dice type', () => {
        expect(component.attackDiceType).toBe(Dice.D6);
    });

    it('should return defense dice type', () => {
        expect(component.defenseDiceType).toBe(Dice.D4);
    });

    it('should calculate remaining base movement points', () => {
        expect(component.remainingBaseMovementPoints).toBe(3);
    });

    it('should return 0 base movement points when speed bonus exceeds total speed', () => {
        Object.defineProperty(mockPlayerService, 'speed', {
            value: signal(2),
            configurable: true,
        });
        Object.defineProperty(mockPlayerService, 'speedBonus', {
            value: signal(5),
            configurable: true,
        });
        
        expect(component.remainingBaseMovementPoints).toBe(0);
    });

    it('should calculate remaining bonus movement points', () => {
        expect(component.remainingBonusMovementPoints).toBe(1);
    });

    it('should limit bonus movement points to total speed', () => {
        Object.defineProperty(mockPlayerService, 'speed', {
            value: signal(2),
            configurable: true,
        });
        Object.defineProperty(mockPlayerService, 'speedBonus', {
            value: signal(5),
            configurable: true,
        });
        
        expect(component.remainingBonusMovementPoints).toBe(2);
    });

    it('should return actions remaining', () => {
        expect(component.actionsRemaining).toBe(2);
    });

    it('should calculate HP percentage', () => {
        expect(component.hpPercentage).toBe(75);
    });

    it('should return 0 HP percentage when max health is 0', () => {
        Object.defineProperty(mockPlayerService, 'maxHealth', {
            value: signal(0),
            configurable: true,
        });
        
        expect(component.hpPercentage).toBe(0);
    });

    it('should return hp-high class for high HP', () => {
        Object.defineProperty(mockPlayerService, 'health', {
            value: signal(4),
            configurable: true,
        });
        
        expect(component.hpColorClass).toBe('hp-high');
    });

    it('should return hp-medium class for medium HP', () => {
        Object.defineProperty(mockPlayerService, 'health', {
            value: signal(2),
            configurable: true,
        });
        
        expect(component.hpColorClass).toBe('hp-medium');
    });

    it('should return hp-critical class for low HP', () => {
        Object.defineProperty(mockPlayerService, 'health', {
            value: signal(1),
            configurable: true,
        });
        
        expect(component.hpColorClass).toBe('hp-critical');
    });

    it('should return total combats', () => {
        expect(component.totalCombats).toBe(5);
    });

    it('should return combat wins', () => {
        expect(component.combatWins).toBe(3);
    });

    it('should return combat losses', () => {
        expect(component.combatLosses).toBe(1);
    });

    it('should return combat draws', () => {
        expect(component.combatDraws).toBe(1);
    });
});