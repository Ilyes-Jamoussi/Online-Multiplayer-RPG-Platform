import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AssetsService } from '@app/services/assets/assets.service';
import { CombatService } from '@app/services/combat/combat.service';
import { InGameService } from '@app/services/in-game/in-game.service';
import { TimerCoordinatorService } from '@app/services/timer-coordinator/timer-coordinator.service';
import { Avatar } from '@common/enums/avatar.enum';
import { Dice } from '@common/enums/dice.enum';
import { TileCombatEffect } from '@common/enums/tile.enum';
import { CombatOverlayComponent } from './combat-overlay.component';

describe('CombatOverlayComponent', () => {
    let component: CombatOverlayComponent;
    let fixture: ComponentFixture<CombatOverlayComponent>;
    let mockCombatService: any;
    let mockInGameService: jasmine.SpyObj<InGameService>;
    let mockAssetsService: jasmine.SpyObj<AssetsService>;
    let mockTimerCoordinatorService: jasmine.SpyObj<TimerCoordinatorService>;

    const mockCombatData = {
        attackerId: 'player1',
        targetId: 'player2',
        userRole: 'attacker' as const
    };

    const mockPlayerA = {
        id: 'player1',
        name: 'Player A',
        avatar: Avatar.Avatar1,
        health: 8,
        maxHealth: 10
    };

    const mockPlayerB = {
        id: 'player2',
        name: 'Player B',
        avatar: Avatar.Avatar2,
        health: 6,
        maxHealth: 10
    };

    const mockVictoryData = {
        playerAId: 'player1',
        playerBId: 'player2',
        winnerId: 'player1',
        abandon: false
    };

    beforeEach(async () => {
        mockCombatService = {
            combatData: signal(mockCombatData),
            damageDisplays: signal([]),
            selectedPosture: signal(null),
            playerPostures: signal({}),
            victoryData: signal(null),
            minHealthDuringCombat: signal({}),
            tileEffects: signal({}),
            isVictoryNotificationVisible: signal(false),
            chooseOffensive: jasmine.createSpy('chooseOffensive'),
            chooseDefensive: jasmine.createSpy('chooseDefensive'),
            closeVictoryOverlay: jasmine.createSpy('closeVictoryOverlay')
        };

        mockInGameService = jasmine.createSpyObj('InGameService', ['getPlayerByPlayerId']);
        mockInGameService.getPlayerByPlayerId.and.callFake((id: string) => {
            return id === 'player1' ? mockPlayerA as any : mockPlayerB as any;
        });

        mockAssetsService = jasmine.createSpyObj('AssetsService', ['getAvatarStaticImage', 'getDiceImage']);
        mockAssetsService.getAvatarStaticImage.and.returnValue('avatar.png');
        mockAssetsService.getDiceImage.and.returnValue('dice.png');

        mockTimerCoordinatorService = jasmine.createSpyObj('TimerCoordinatorService', ['getPausedTurnTime']);
        mockTimerCoordinatorService.getPausedTurnTime.and.returnValue(15);

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

        it('should return player A name', () => {
            expect(component.playerAName).toBe('Player A');
        });

        it('should return player B name', () => {
            expect(component.playerBName).toBe('Player B');
        });

        it('should return player A avatar', () => {
            expect(component.playerAAvatar).toBe('avatar.png');
            expect(mockAssetsService.getAvatarStaticImage).toHaveBeenCalledWith(Avatar.Avatar1);
        });

        it('should return player B avatar', () => {
            expect(component.playerBAvatar).toBe('avatar.png');
            expect(mockAssetsService.getAvatarStaticImage).toHaveBeenCalledWith(Avatar.Avatar2);
        });
    });

    describe('health getters', () => {
        it('should return player A health data', () => {
            const health = component.playerAHealth;
            expect(health.current).toBe(8);
            expect(health.max).toBe(10);
            expect(health.percentage).toBe(80);
        });

        it('should return player B health data', () => {
            const health = component.playerBHealth;
            expect(health.current).toBe(6);
            expect(health.max).toBe(10);
            expect(health.percentage).toBe(60);
        });

        it('should use min health during combat when victory data exists', () => {
            mockCombatService.victoryData.set(mockVictoryData);
            mockCombatService.minHealthDuringCombat.set({ 'player1': 2 });

            const health = component.playerAHealth;
            expect(health.current).toBe(2);
        });
    });

    describe('damage getters', () => {
        it('should return player A damage when visible', () => {
            const damageDisplay = { playerId: 'player1', damage: 5, visible: true };
            mockCombatService.damageDisplays.set([damageDisplay]);

            expect(component.playerADamage).toBeTruthy();
            expect(component.playerADamage?.playerId).toBe('player1');
        });

        it('should return null when no visible damage for player A', () => {
            const damageDisplay = { playerId: 'player1', damage: 5, visible: false };
            mockCombatService.damageDisplays.set([damageDisplay]);

            expect(component.playerADamage).toBeNull();
        });
    });

    describe('posture getters', () => {
        it('should return selected posture', () => {
            mockCombatService.selectedPosture.set('offensive');
            expect(component.selectedPosture).toBe('offensive');
        });

        it('should return true when posture is selected', () => {
            mockCombatService.selectedPosture.set('defensive');
            expect(component.isPostureSelected).toBe(true);
        });

        it('should return false when no posture is selected', () => {
            mockCombatService.selectedPosture.set(null);
            expect(component.isPostureSelected).toBe(false);
        });

        it('should return player A posture', () => {
            mockCombatService.playerPostures.set({ 'player1': 'offensive' });
            expect(component.playerAPosture).toBe('offensive');
        });

        it('should return player B posture', () => {
            mockCombatService.playerPostures.set({ 'player2': 'defensive' });
            expect(component.playerBPosture).toBe('defensive');
        });
    });

    describe('victory getters', () => {
        beforeEach(() => {
            mockCombatService.victoryData.set(mockVictoryData);
        });

        it('should return victory message for winner', () => {
            expect(component.victoryMessage).toBe('Victoire !');
        });

        it('should return victory message for loser', () => {
            mockCombatService.combatData.set({ ...mockCombatData, userRole: 'target' });
            expect(component.victoryMessage).toBe('Player A a gagné !');
        });

        it('should return draw message', () => {
            mockCombatService.victoryData.set({ ...mockVictoryData, winnerId: null });
            expect(component.victoryMessage).toBe('Match Nul !');
        });

        it('should return victory subtitle for winner', () => {
            expect(component.victorySubtitle).toBe('Tu as gagné le combat !');
        });

        it('should return abandon victory subtitle', () => {
            mockCombatService.victoryData.set({ ...mockVictoryData, abandon: true });
            expect(component.victorySubtitle).toBe('Victoire par abandon !');
        });

        it('should return true for isVictory when player wins', () => {
            expect(component.isVictory).toBe(true);
        });

        it('should return false for isVictory when player loses', () => {
            mockCombatService.combatData.set({ ...mockCombatData, userRole: 'target' });
            expect(component.isVictory).toBe(false);
        });
    });

    describe('spectator victory getters', () => {
        beforeEach(() => {
            mockCombatService.victoryData.set(mockVictoryData);
        });

        it('should return spectator victory title', () => {
            expect(component.spectatorVictoryTitle).toBe('Player A a gagné !');
        });

        it('should return spectator victory message', () => {
            expect(component.spectatorVictoryMessage).toBe('Player A a vaincu Player B');
        });

        it('should return abandon message for spectator', () => {
            mockCombatService.victoryData.set({ ...mockVictoryData, abandon: true });
            expect(component.spectatorVictoryMessage).toBe('Player A a gagné par abandon contre Player B');
        });
    });

    describe('tile effect getters', () => {
        it('should return player A tile effect', () => {
            mockCombatService.tileEffects.set({ 'player1': TileCombatEffect.ICE });
            expect(component.playerATileEffect).toBe(TileCombatEffect.ICE);
        });

        it('should return player A tile effect label for ice', () => {
            mockCombatService.tileEffects.set({ 'player1': TileCombatEffect.ICE });
            expect(component.playerATileEffectLabel).toBe(`Glace ${TileCombatEffect.ICE}`);
        });

        it('should return null for base tile effect', () => {
            mockCombatService.tileEffects.set({ 'player1': TileCombatEffect.BASE });
            expect(component.playerATileEffectLabel).toBeNull();
        });
    });

    describe('actions', () => {
        it('should call chooseOffensive', () => {
            component.chooseOffensive();
            expect(mockCombatService.chooseOffensive).toHaveBeenCalled();
        });

        it('should call chooseDefensive', () => {
            component.chooseDefensive();
            expect(mockCombatService.chooseDefensive).toHaveBeenCalled();
        });

        it('should call closeVictoryOverlay', () => {
            component.closeVictoryOverlay();
            expect(mockCombatService.closeVictoryOverlay).toHaveBeenCalled();
        });
    });

    describe('utility methods', () => {
        it('should get dice image', () => {
            const result = component.getDiceImage(Dice.D6);
            expect(result).toBe('dice.png');
            expect(mockAssetsService.getDiceImage).toHaveBeenCalledWith(Dice.D6);
        });

        it('should get paused turn time', () => {
            expect(component.pausedTurnTime).toBe(15);
            expect(mockTimerCoordinatorService.getPausedTurnTime).toHaveBeenCalled();
        });

        it('should return victory notification visibility', () => {
            mockCombatService.isVictoryNotificationVisible.set(true);
            expect(component.isVictoryNotificationVisible).toBe(true);
        });
    });

    describe('edge cases', () => {
        it('should handle null combat data', () => {
            mockCombatService.combatData.set(null);

            expect(component.playerAName).toBe('');
            expect(component.playerBName).toBe('');
            expect(component.playerAAvatar).toBe('');
            expect(component.playerBAvatar).toBe('');
            expect(component.playerAHealth).toEqual({ current: 0, max: 0, percentage: 0 });
            expect(component.playerBHealth).toEqual({ current: 0, max: 0, percentage: 0 });
        });

        it('should return player B damage when visible', () => {
            const damageDisplay = { playerId: 'player2', damage: 3, visible: true };
            mockCombatService.damageDisplays.set([damageDisplay]);

            expect(component.playerBDamage).toBeTruthy();
            expect(component.playerBDamage?.playerId).toBe('player2');
        });

        it('should return null when no visible damage for player B', () => {
            const damageDisplay = { playerId: 'player2', damage: 3, visible: false };
            mockCombatService.damageDisplays.set([damageDisplay]);

            expect(component.playerBDamage).toBeNull();
        });

        it('should handle null victory data in victoryMessage', () => {
            mockCombatService.victoryData.set(null);
            expect(component.victoryMessage).toBe('');
        });

        it('should handle null victory data in victorySubtitle', () => {
            mockCombatService.victoryData.set(null);
            expect(component.victorySubtitle).toBe('');
        });

        it('should handle null victory data in spectatorVictoryTitle', () => {
            mockCombatService.victoryData.set(null);
            expect(component.spectatorVictoryTitle).toBe('');
        });

        it('should handle null victory data in spectatorVictoryMessage', () => {
            mockCombatService.victoryData.set(null);
            expect(component.spectatorVictoryMessage).toBe('');
        });

        it('should handle null victory data in isVictory', () => {
            mockCombatService.victoryData.set(null);
            expect(component.isVictory).toBe(false);
        });

        it('should handle null combat data in playerAPosture', () => {
            mockCombatService.combatData.set(null);
            expect(component.playerAPosture).toBeNull();
        });

        it('should handle null combat data in playerBPosture', () => {
            mockCombatService.combatData.set(null);
            expect(component.playerBPosture).toBeNull();
        });

        it('should handle null combat data in playerATileEffect', () => {
            mockCombatService.combatData.set(null);
            expect(component.playerATileEffect).toBeNull();
        });

        it('should handle null combat data in playerBTileEffect', () => {
            mockCombatService.combatData.set(null);
            expect(component.playerBTileEffect).toBeNull();
        });

        it('should handle null combat data in playerBTileEffectLabel', () => {
            mockCombatService.combatData.set(null);
            expect(component.playerBTileEffectLabel).toBeNull();
        });

        it('should return player B tile effect label for ice', () => {
            mockCombatService.tileEffects.set({ 'player2': TileCombatEffect.ICE });
            expect(component.playerBTileEffectLabel).toBe(`Glace ${TileCombatEffect.ICE}`);
        });

        it('should return null for player B base tile effect', () => {
            mockCombatService.tileEffects.set({ 'player2': TileCombatEffect.BASE });
            expect(component.playerBTileEffectLabel).toBeNull();
        });

        it('should handle draw in spectatorVictoryTitle', () => {
            mockCombatService.victoryData.set({ ...mockVictoryData, winnerId: null });
            expect(component.spectatorVictoryTitle).toBe('Match Nul !');
        });

        it('should handle draw in spectatorVictoryMessage', () => {
            mockCombatService.victoryData.set({ ...mockVictoryData, winnerId: null });
            expect(component.spectatorVictoryMessage).toBe('Les deux combattants sont tombés');
        });

        it('should handle defeat by abandon in victorySubtitle', () => {
            mockCombatService.combatData.set({ ...mockCombatData, userRole: 'target' });
            mockCombatService.victoryData.set({ ...mockVictoryData, abandon: true });
            expect(component.victorySubtitle).toBe('Défaite par abandon...');
        });

        it('should handle defeat in victorySubtitle', () => {
            mockCombatService.combatData.set({ ...mockCombatData, userRole: 'target' });
            mockCombatService.victoryData.set({ ...mockVictoryData, abandon: false });
            expect(component.victorySubtitle).toBe('Tu as perdu le combat...');
        });
    });
});