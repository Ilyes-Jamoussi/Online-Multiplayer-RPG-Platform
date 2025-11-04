import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AssetsService } from '@app/services/assets/assets.service';
import { InGameService } from '@app/services/in-game/in-game.service';
import { PlayerService } from '@app/services/player/player.service';
import { Avatar } from '@common/enums/avatar.enum';
import { Dice } from '@common/enums/dice.enum';
import { Player } from '@common/interfaces/player.interface';
import { PlayerInfoComponent } from './player-info.component';

describe('PlayerInfoComponent', () => {
    let component: PlayerInfoComponent;
    let fixture: ComponentFixture<PlayerInfoComponent>;
    let mockPlayerService: jasmine.SpyObj<PlayerService>;
    let mockAssetsService: jasmine.SpyObj<AssetsService>;
    let mockInGameService: jasmine.SpyObj<InGameService>;

    const mockPlayer: Player = {
        id: 'test-id',
        name: 'Test Player',
        avatar: Avatar.Avatar1,
        isAdmin: false,
        baseHealth: 10,
        healthBonus: 2,
        health: 8,
        maxHealth: 12,
        baseSpeed: 5,
        speedBonus: 1,
        speed: 6,
        baseAttack: 4,
        attackBonus: 1,
        attack: 5,
        baseDefense: 3,
        defenseBonus: 2,
        defense: 5,
        attackDice: Dice.D6,
        defenseDice: Dice.D4,
        x: 0,
        y: 0,
        isInGame: true,
        startPointId: 'start1',
        actionsRemaining: 2,
        combatCount: 5,
        combatWins: 3,
        combatLosses: 1,
        combatDraws: 1,
    };

    beforeEach(async () => {
        mockPlayerService = jasmine.createSpyObj('PlayerService', [
            'player',
            'name',
            'health',
            'maxHealth',
            'speed',
            'attack',
            'attackDice',
            'defense',
            'defenseDice',
            'speedBonus',
            'actionsRemaining',
            'combatCount',
            'combatWins',
            'combatLosses',
            'combatDraws',
        ]);

        mockAssetsService = jasmine.createSpyObj('AssetsService', ['getAvatarStaticImage']);

        mockInGameService = jasmine.createSpyObj('InGameService', [
            'isMyTurn',
            'isGameStarted',
            'hasUsedAction',
            'availableActions',
            'activateActionMode',
        ]);

        await TestBed.configureTestingModule({
            imports: [PlayerInfoComponent],
            providers: [
                { provide: PlayerService, useValue: mockPlayerService },
                { provide: AssetsService, useValue: mockAssetsService },
                { provide: InGameService, useValue: mockInGameService },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(PlayerInfoComponent);
        component = fixture.componentInstance;

        // Setup default return values
        mockPlayerService.player.and.returnValue(mockPlayer);
        mockPlayerService.name.and.returnValue(mockPlayer.name);
        mockPlayerService.health.and.returnValue(mockPlayer.health);
        mockPlayerService.maxHealth.and.returnValue(mockPlayer.maxHealth);
        mockPlayerService.speed.and.returnValue(mockPlayer.speed);
        mockPlayerService.attack.and.returnValue(mockPlayer.attack);
        mockPlayerService.attackDice.and.returnValue(mockPlayer.attackDice);
        mockPlayerService.defense.and.returnValue(mockPlayer.defense);
        mockPlayerService.defenseDice.and.returnValue(mockPlayer.defenseDice);
        mockPlayerService.speedBonus.and.returnValue(mockPlayer.speedBonus);
        mockPlayerService.actionsRemaining.and.returnValue(mockPlayer.actionsRemaining);
        mockPlayerService.combatCount.and.returnValue(mockPlayer.combatCount);
        mockPlayerService.combatWins.and.returnValue(mockPlayer.combatWins);
        mockPlayerService.combatLosses.and.returnValue(mockPlayer.combatLosses);
        mockPlayerService.combatDraws.and.returnValue(mockPlayer.combatDraws);
        mockAssetsService.getAvatarStaticImage.and.returnValue('avatar-image.png');
        mockInGameService.isMyTurn.and.returnValue(true);
        mockInGameService.isGameStarted.and.returnValue(true);
        mockInGameService.hasUsedAction.and.returnValue(false);
        mockInGameService.availableActions.and.returnValue([{ type: 'ATTACK', x: 1, y: 1 }]);
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should get player from service', () => {
        expect(component.player).toBe(mockPlayer);
        expect(mockPlayerService.player).toHaveBeenCalled();
    });

    it('should get avatar image with player avatar', () => {
        expect(component.avatarImage).toBe('avatar-image.png');
        expect(mockAssetsService.getAvatarStaticImage).toHaveBeenCalledWith(Avatar.Avatar1);
    });

    it('should get avatar image with default avatar when player has no avatar', () => {
        const playerWithoutAvatar = { ...mockPlayer, avatar: null };
        mockPlayerService.player.and.returnValue(playerWithoutAvatar);

        expect(component.avatarImage).toBe('avatar-image.png');
        expect(mockAssetsService.getAvatarStaticImage).toHaveBeenCalledWith(Avatar.Avatar1);
    });

    it('should get player name', () => {
        expect(component.playerName).toBe('Test Player');
        expect(mockPlayerService.name).toHaveBeenCalled();
    });

    it('should get current health', () => {
        expect(component.currentHealth).toBe(8);
        expect(mockPlayerService.health).toHaveBeenCalled();
    });

    it('should get max health', () => {
        expect(component.maxHealth).toBe(12);
        expect(mockPlayerService.maxHealth).toHaveBeenCalled();
    });

    it('should get rapidity value', () => {
        expect(component.rapidityValue).toBe(6);
        expect(mockPlayerService.speed).toHaveBeenCalled();
    });

    it('should get base attack', () => {
        expect(component.baseAttack).toBe(4);
    });

    it('should get attack value', () => {
        expect(component.attackValue).toBe(5);
        expect(mockPlayerService.attack).toHaveBeenCalled();
    });

    it('should get attack dice type', () => {
        expect(component.attackDiceType).toBe(Dice.D6);
        expect(mockPlayerService.attackDice).toHaveBeenCalled();
    });

    it('should get base defense', () => {
        expect(component.baseDefense).toBe(3);
    });

    it('should get defense value', () => {
        expect(component.defenseValue).toBe(5);
        expect(mockPlayerService.defense).toHaveBeenCalled();
    });

    it('should get defense dice type', () => {
        expect(component.defenseDiceType).toBe(Dice.D4);
        expect(mockPlayerService.defenseDice).toHaveBeenCalled();
    });

    it('should get base speed', () => {
        expect(component.baseSpeed).toBe(5);
    });

    it('should get speed bonus', () => {
        expect(component.speedBonus).toBe(1);
    });

    it('should get base health', () => {
        expect(component.baseHealth).toBe(10);
    });

    it('should get health bonus', () => {
        expect(component.healthBonus).toBe(2);
    });

    it('should calculate remaining base movement points', () => {
        expect(component.remainingBaseMovementPoints).toBe(5);
    });

    it('should calculate remaining base movement points when negative', () => {
        mockPlayerService.speed.and.returnValue(0);
        mockPlayerService.speedBonus.and.returnValue(2);
        expect(component.remainingBaseMovementPoints).toBe(0);
    });

    it('should calculate remaining bonus movement points', () => {
        expect(component.remainingBonusMovementPoints).toBe(1);
    });

    it('should calculate remaining bonus movement points when speed is less than bonus', () => {
        mockPlayerService.speed.and.returnValue(0);
        mockPlayerService.speedBonus.and.returnValue(2);
        expect(component.remainingBonusMovementPoints).toBe(0);
    });

    it('should get actions remaining', () => {
        expect(component.actionsRemaining).toBe(2);
        expect(mockPlayerService.actionsRemaining).toHaveBeenCalled();
    });

    it('should calculate HP percentage', () => {
        expect(component.hpPercentage).toBeCloseTo(66.67, 2);
    });

    it('should calculate HP percentage when max health is 0', () => {
        mockPlayerService.maxHealth.and.returnValue(0);
        expect(component.hpPercentage).toBe(0);
    });

    it('should return hp-high class for high HP', () => {
        mockPlayerService.health.and.returnValue(10);
        mockPlayerService.maxHealth.and.returnValue(12);
        expect(component.hpColorClass).toBe('hp-high');
    });

    it('should return hp-medium class for medium HP', () => {
        mockPlayerService.health.and.returnValue(5);
        mockPlayerService.maxHealth.and.returnValue(12);
        expect(component.hpColorClass).toBe('hp-medium');
    });

    it('should return hp-critical class for low HP', () => {
        mockPlayerService.health.and.returnValue(2);
        mockPlayerService.maxHealth.and.returnValue(12);
        expect(component.hpColorClass).toBe('hp-critical');
    });

    it('should get total combats', () => {
        expect(component.totalCombats).toBe(5);
        expect(mockPlayerService.combatCount).toHaveBeenCalled();
    });

    it('should get combat wins', () => {
        expect(component.combatWins).toBe(3);
        expect(mockPlayerService.combatWins).toHaveBeenCalled();
    });

    it('should get combat losses', () => {
        expect(component.combatLosses).toBe(1);
        expect(mockPlayerService.combatLosses).toHaveBeenCalled();
    });

    it('should get combat draws', () => {
        expect(component.combatDraws).toBe(1);
        expect(mockPlayerService.combatDraws).toHaveBeenCalled();
    });

    it('should disable action when not my turn', () => {
        mockInGameService.isMyTurn.and.returnValue(false);
        expect(component.isActionDisabled()).toBe(true);
    });

    it('should disable action when game not started', () => {
        mockInGameService.isGameStarted.and.returnValue(false);
        expect(component.isActionDisabled()).toBe(true);
    });

    it('should disable action when already used action', () => {
        mockInGameService.hasUsedAction.and.returnValue(true);
        expect(component.isActionDisabled()).toBe(true);
    });

    it('should disable action when no available actions', () => {
        mockInGameService.availableActions.and.returnValue([]);
        expect(component.isActionDisabled()).toBe(true);
    });

    it('should enable action when all conditions are met', () => {
        expect(component.isActionDisabled()).toBe(false);
    });

    it('should return true when has available actions', () => {
        expect(component.hasAvailableActions()).toBe(true);
    });

    it('should return false when no available actions', () => {
        mockInGameService.availableActions.and.returnValue([]);
        expect(component.hasAvailableActions()).toBe(false);
    });

    it('should activate action mode on action', () => {
        component.onAction();
        expect(mockInGameService.activateActionMode).toHaveBeenCalled();
    });
});