/* eslint-disable max-lines -- Extensive tests needed for 100% code coverage */
import { WritableSignal, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AssetsService } from '@app/services/assets/assets.service';
import { CombatService } from '@app/services/combat/combat.service';
import { InGameService } from '@app/services/in-game/in-game.service';
import { TimerCoordinatorService } from '@app/services/timer-coordinator/timer-coordinator.service';
import { Avatar } from '@common/enums/avatar.enum';
import { Dice } from '@common/enums/dice.enum';
import { TileCombatEffect } from '@common/enums/tile.enum';
import { Player } from '@common/interfaces/player.interface';
import { DamageDisplay } from '@app/interfaces/damage-display.interface';
import { CombatOverlayComponent } from './combat-overlay.component';

const MOCK_HEALTH_PLAYER_A = 8;
const MOCK_MAX_HEALTH = 10;
const MOCK_HEALTH_PLAYER_B = 6;
const MOCK_HEALTH_PERCENTAGE_A = 80;
const MOCK_HEALTH_PERCENTAGE_B = 60;
const MOCK_MIN_HEALTH = 2;
const MOCK_DAMAGE = 5;
const MOCK_TURN_TIME = 15;
const UNKNOWN_TILE_EFFECT = 999;

type MockCombatService = Partial<CombatService> & {
    _combatDataSignal: WritableSignal<unknown>;
    _damageDisplaysSignal: WritableSignal<unknown>;
    _selectedPostureSignal: WritableSignal<unknown>;
    _playerPosturesSignal: WritableSignal<unknown>;
    _victoryDataSignal: WritableSignal<unknown>;
    _minHealthDuringCombatSignal: WritableSignal<unknown>;
    _tileEffectsSignal: WritableSignal<unknown>;
    _isVictoryNotificationVisibleSignal: WritableSignal<unknown>;
};

describe('CombatOverlayComponent', () => {
    let component: CombatOverlayComponent;
    let fixture: ComponentFixture<CombatOverlayComponent>;
    let mockCombatService: MockCombatService;
    let mockInGameService: jasmine.SpyObj<InGameService>;
    let mockAssetsService: jasmine.SpyObj<AssetsService>;
    let mockTimerCoordinatorService: jasmine.SpyObj<TimerCoordinatorService>;

    const mockCombatData = {
        attackerId: 'player1',
        targetId: 'player2',
        userRole: 'attacker' as const
    };

    const mockPlayerA: Player = {
        id: 'player1',
        name: 'Player A',
        avatar: Avatar.Avatar1,
        health: MOCK_HEALTH_PLAYER_A,
        maxHealth: MOCK_MAX_HEALTH,
        isAdmin: false,
        baseHealth: MOCK_MAX_HEALTH,
        healthBonus: 0,
        baseSpeed: 4,
        speedBonus: 0,
        speed: 4,
        baseAttack: 4,
        attackBonus: 0,
        attack: 4,
        baseDefense: 4,
        defenseBonus: 0,
        defense: 4,
        attackDice: Dice.D6,
        defenseDice: Dice.D6,
        x: 0,
        y: 0,
        isInGame: true,
        startPointId: '',
        actionsRemaining: 1,
        combatCount: 0,
        combatWins: 0,
        combatLosses: 0,
        combatDraws: 0
    };

    const mockPlayerB: Player = {
        id: 'player2',
        name: 'Player B',
        avatar: Avatar.Avatar2,
        health: MOCK_HEALTH_PLAYER_B,
        maxHealth: MOCK_MAX_HEALTH,
        isAdmin: false,
        baseHealth: MOCK_MAX_HEALTH,
        healthBonus: 0,
        baseSpeed: 4,
        speedBonus: 0,
        speed: 4,
        baseAttack: 4,
        attackBonus: 0,
        attack: 4,
        baseDefense: 4,
        defenseBonus: 0,
        defense: 4,
        attackDice: Dice.D6,
        defenseDice: Dice.D6,
        x: 0,
        y: 0,
        isInGame: true,
        startPointId: '',
        actionsRemaining: 1,
        combatCount: 0,
        combatWins: 0,
        combatLosses: 0,
        combatDraws: 0
    };

    const mockVictoryData = {
        playerAId: 'player1',
        playerBId: 'player2',
        winnerId: 'player1',
        abandon: false
    };

    const mockDamageDisplay: DamageDisplay = {
        playerId: 'player1',
        damage: MOCK_DAMAGE,
        attackRoll: 4,
        attackDice: Dice.D6,
        totalAttack: 8,
        defenseRoll: 2,
        defenseDice: Dice.D6,
        totalDefense: 6,
        tileEffect: 0,
        visible: true
    };

    beforeEach(async () => {
        const combatDataSignal = signal(mockCombatData);
        const damageDisplaysSignal = signal([]);
        const selectedPostureSignal = signal(null);
        const playerPosturesSignal = signal({});
        const victoryDataSignal = signal(null);
        const minHealthDuringCombatSignal = signal({});
        const tileEffectsSignal = signal({});
        const isVictoryNotificationVisibleSignal = signal(false);

        mockCombatService = {
            combatData: combatDataSignal.asReadonly(),
            damageDisplays: damageDisplaysSignal.asReadonly(),
            selectedPosture: selectedPostureSignal.asReadonly(),
            playerPostures: playerPosturesSignal.asReadonly(),
            victoryData: victoryDataSignal.asReadonly(),
            minHealthDuringCombat: minHealthDuringCombatSignal.asReadonly(),
            tileEffects: tileEffectsSignal.asReadonly(),
            isVictoryNotificationVisible: isVictoryNotificationVisibleSignal.asReadonly(),
            chooseOffensive: jasmine.createSpy('chooseOffensive'),
            chooseDefensive: jasmine.createSpy('chooseDefensive'),
            closeVictoryOverlay: jasmine.createSpy('closeVictoryOverlay'),
            _combatDataSignal: combatDataSignal,
            _damageDisplaysSignal: damageDisplaysSignal,
            _selectedPostureSignal: selectedPostureSignal,
            _playerPosturesSignal: playerPosturesSignal,
            _victoryDataSignal: victoryDataSignal,
            _minHealthDuringCombatSignal: minHealthDuringCombatSignal,
            _tileEffectsSignal: tileEffectsSignal,
            _isVictoryNotificationVisibleSignal: isVictoryNotificationVisibleSignal
        };

        mockInGameService = jasmine.createSpyObj('InGameService', ['getPlayerByPlayerId']);
        mockInGameService.getPlayerByPlayerId.and.callFake((id: string) => {
            return id === 'player1' ? mockPlayerA : mockPlayerB;
        });

        mockAssetsService = jasmine.createSpyObj('AssetsService', ['getAvatarStaticImage', 'getDiceImage']);
        mockAssetsService.getAvatarStaticImage.and.returnValue('avatar.png');
        mockAssetsService.getDiceImage.and.returnValue('dice.png');

        mockTimerCoordinatorService = jasmine.createSpyObj('TimerCoordinatorService', ['getPausedTurnTime']);
        mockTimerCoordinatorService.getPausedTurnTime.and.returnValue(MOCK_TURN_TIME);

        await TestBed.configureTestingModule({
            imports: [CombatOverlayComponent],
            providers: [
                { provide: CombatService, useValue: mockCombatService },
                { provide: InGameService, useValue: mockInGameService },
                { provide: AssetsService, useValue: mockAssetsService },
                { provide: TimerCoordinatorService, useValue: mockTimerCoordinatorService }
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(CombatOverlayComponent);
        component = fixture.componentInstance;
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    describe('basic getters', () => {
        it('should return combat data', () => {
            expect(component.combatData).toEqual(mockCombatData);
        });

        it('should return player names and avatars', () => {
            expect(component.playerAName).toBe('Player A');
            expect(component.playerBName).toBe('Player B');
            expect(component.playerAAvatar).toBe('avatar.png');
            expect(component.playerBAvatar).toBe('avatar.png');
        });
    });

    describe('health getters', () => {
        it('should return player health data', () => {
            const healthA = component.playerAHealth;
            const healthB = component.playerBHealth;
            expect(healthA.current).toBe(MOCK_HEALTH_PLAYER_A);
            expect(healthA.max).toBe(MOCK_MAX_HEALTH);
            expect(healthA.percentage).toBe(MOCK_HEALTH_PERCENTAGE_A);
            expect(healthB.current).toBe(MOCK_HEALTH_PLAYER_B);
            expect(healthB.percentage).toBe(MOCK_HEALTH_PERCENTAGE_B);
        });

        it('should use min health during combat when victory data exists', () => {
            mockCombatService._victoryDataSignal.set(mockVictoryData);
            mockCombatService._minHealthDuringCombatSignal.set({ player1: MOCK_MIN_HEALTH });
            expect(component.playerAHealth.current).toBe(MOCK_MIN_HEALTH);
        });

        it('should use player health when min health is not set', () => {
            mockCombatService._victoryDataSignal.set(mockVictoryData);
            mockCombatService._minHealthDuringCombatSignal.set({});
            expect(component.playerAHealth.current).toBe(MOCK_HEALTH_PLAYER_A);
            expect(component.playerBHealth.current).toBe(MOCK_HEALTH_PLAYER_B);
        });
    });

    describe('damage displays', () => {
        it('should find visible damage display for attacker', () => {
            mockCombatService._damageDisplaysSignal.set([mockDamageDisplay]);
            expect(component.playerADamage).toEqual(mockDamageDisplay);
        });

        it('should find visible damage display for target', () => {
            const targetDamage = { ...mockDamageDisplay, playerId: 'player2' };
            mockCombatService._damageDisplaysSignal.set([targetDamage]);
            expect(component.playerBDamage).toEqual(targetDamage);
        });

        it('should return null when no visible damage display found', () => {
            const invisibleDamage = { ...mockDamageDisplay, visible: false };
            mockCombatService._damageDisplaysSignal.set([invisibleDamage]);
            expect(component.playerADamage).toBeNull();
        });
    });

    describe('postures', () => {
        it('should return null when no combat data', () => {
            mockCombatService._combatDataSignal.set(null);
            expect(component.playerAPosture).toBeNull();
            expect(component.playerBPosture).toBeNull();
        });

        it('should return posture from service', () => {
            mockCombatService._playerPosturesSignal.set({ player1: 'offensive', player2: 'defensive' });
            expect(component.playerAPosture).toBe('offensive');
            expect(component.playerBPosture).toBe('defensive');
        });

        it('should return null when posture not set', () => {
            mockCombatService._playerPosturesSignal.set({});
            expect(component.playerAPosture).toBeNull();
            expect(component.playerBPosture).toBeNull();
        });
    });

    describe('victory getters', () => {
        beforeEach(() => {
            mockCombatService._victoryDataSignal.set(mockVictoryData);
        });

        it('should return victory subtitle for abandon victory', () => {
            mockCombatService._victoryDataSignal.set({ ...mockVictoryData, abandon: true });
            expect(component.victorySubtitle).toBe('Victoire par abandon !');
        });

        it('should return victory subtitle for abandon defeat', () => {
            mockCombatService._victoryDataSignal.set({ ...mockVictoryData, winnerId: 'player2', abandon: true });
            expect(component.victorySubtitle).toBe('Défaite par abandon...');
        });

        it('should return victory subtitle for match nul', () => {
            mockCombatService._victoryDataSignal.set({ ...mockVictoryData, winnerId: null });
            expect(component.victorySubtitle).toBe('Les deux combattants sont tombés');
        });

        it('should return victory subtitle for win', () => {
            expect(component.victorySubtitle).toBe('Tu as gagné le combat !');
        });

        it('should return victory subtitle for loss', () => {
            mockCombatService._victoryDataSignal.set({ ...mockVictoryData, winnerId: 'player2' });
            expect(component.victorySubtitle).toBe('Tu as perdu le combat...');
        });

        it('should return spectator victory title for match nul', () => {
            mockCombatService._victoryDataSignal.set({ ...mockVictoryData, winnerId: null });
            expect(component.spectatorVictoryTitle).toBe('Match Nul !');
        });

        it('should return spectator victory message for match nul', () => {
            mockCombatService._victoryDataSignal.set({ ...mockVictoryData, winnerId: null });
            expect(component.spectatorVictoryMessage).toBe('Les deux combattants sont tombés');
        });

        it('should return spectator victory message for abandon', () => {
            mockCombatService._victoryDataSignal.set({ ...mockVictoryData, abandon: true });
            expect(component.spectatorVictoryMessage).toBe('Player A a gagné par abandon contre Player B');
        });

        it('should return spectator victory message for normal victory', () => {
            expect(component.spectatorVictoryMessage).toBe('Player A a vaincu Player B');
        });

        it('should return empty strings when no victory data', () => {
            mockCombatService._victoryDataSignal.set(null);
            expect(component.victoryMessage).toBe('');
            expect(component.victorySubtitle).toBe('');
            expect(component.spectatorVictoryTitle).toBe('');
            expect(component.spectatorVictoryMessage).toBe('');
        });
    });

    describe('tile effects', () => {
        it('should return ice effect label', () => {
            mockCombatService._tileEffectsSignal.set({ player1: TileCombatEffect.ICE, player2: TileCombatEffect.ICE });
            expect(component.playerATileEffectLabel).toBe(`Glace ${TileCombatEffect.ICE}`);
            expect(component.playerBTileEffectLabel).toBe(`Glace ${TileCombatEffect.ICE}`);
        });

        it('should return null for base effect', () => {
            mockCombatService._tileEffectsSignal.set({ player1: TileCombatEffect.BASE });
            expect(component.playerATileEffectLabel).toBeNull();
        });

        it('should return null when no effect', () => {
            mockCombatService._tileEffectsSignal.set({});
            expect(component.playerATileEffectLabel).toBeNull();
        });
    });

    describe('null combat data scenarios', () => {
        beforeEach(() => {
            mockCombatService._combatDataSignal.set(null);
        });

        it('should return empty strings when no combat data', () => {
            expect(component.playerAName).toBe('');
            expect(component.playerBName).toBe('');
            expect(component.playerAAvatar).toBe('');
            expect(component.playerBAvatar).toBe('');
        });

        it('should return default health when no combat data', () => {
            expect(component.playerAHealth).toEqual({ current: 0, max: 0, percentage: 0 });
            expect(component.playerBHealth).toEqual({ current: 0, max: 0, percentage: 0 });
        });

        it('should return null for tile effects when no combat data', () => {
            expect(component.playerATileEffect).toBeNull();
            expect(component.playerBTileEffect).toBeNull();
        });
    });

    describe('posture selection', () => {
        it('should return selected posture', () => {
            mockCombatService._selectedPostureSignal.set('offensive');
            expect(component.selectedPosture).toBe('offensive');
        });

        it('should check if posture is selected', () => {
            mockCombatService._selectedPostureSignal.set('defensive');
            expect(component.isPostureSelected).toBe(true);
            
            mockCombatService._selectedPostureSignal.set(null);
            expect(component.isPostureSelected).toBe(false);
        });
    });

    describe('victory scenarios with user roles', () => {
        it('should handle attacker victory', () => {
            mockCombatService._victoryDataSignal.set(mockVictoryData);
            expect(component.victoryMessage).toBe('Victoire !');
            expect(component.isVictory).toBe(true);
        });

        it('should handle target victory', () => {
            mockCombatService._combatDataSignal.set({ ...mockCombatData, userRole: 'target' });
            mockCombatService._victoryDataSignal.set(mockVictoryData);
            expect(component.victoryMessage).toBe('Player A a gagné !');
            expect(component.isVictory).toBe(false);
        });

        it('should handle match nul in victory message', () => {
            mockCombatService._victoryDataSignal.set({ ...mockVictoryData, winnerId: null });
            expect(component.victoryMessage).toBe('Match Nul !');
        });

        it('should return false for isVictory when no victory data', () => {
            mockCombatService._victoryDataSignal.set(null);
            expect(component.isVictory).toBe(false);
        });

        it('should get winner name in spectator victory title', () => {
            mockCombatService._victoryDataSignal.set(mockVictoryData);
            expect(component.spectatorVictoryTitle).toBe('Player A a gagné !');
        });
    });

    describe('tile effect labels edge cases', () => {
        it('should return null for playerA when effect is null', () => {
            mockCombatService._tileEffectsSignal.set({ player1: null });
            expect(component.playerATileEffectLabel).toBeNull();
        });

        it('should return null for playerB when effect is null', () => {
            mockCombatService._tileEffectsSignal.set({ player2: null });
            expect(component.playerBTileEffectLabel).toBeNull();
        });

        it('should return null for unknown tile effects', () => {
            mockCombatService._tileEffectsSignal.set({ player1: UNKNOWN_TILE_EFFECT as TileCombatEffect });
            expect(component.playerATileEffectLabel).toBeNull();
        });
    });

    describe('methods', () => {
        it('should call combat service methods', () => {
            component.chooseOffensive();
            component.chooseDefensive();
            component.closeVictoryOverlay();
            
            expect(mockCombatService.chooseOffensive).toHaveBeenCalled();
            expect(mockCombatService.chooseDefensive).toHaveBeenCalled();
            expect(mockCombatService.closeVictoryOverlay).toHaveBeenCalled();
        });

        it('should get dice image', () => {
            const result = component.getDiceImage(Dice.D6);
            expect(result).toBe('dice.png');
            expect(mockAssetsService.getDiceImage).toHaveBeenCalledWith(Dice.D6);
        });

        it('should get paused turn time', () => {
            expect(component.pausedTurnTime).toBe(MOCK_TURN_TIME);
        });

        it('should get victory notification visibility', () => {
            mockCombatService._isVictoryNotificationVisibleSignal.set(true);
            expect(component.isVictoryNotificationVisible).toBe(true);
        });
    });
});