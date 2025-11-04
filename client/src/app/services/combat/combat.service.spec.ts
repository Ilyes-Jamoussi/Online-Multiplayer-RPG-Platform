import { TestBed } from '@angular/core/testing';
import { CombatService } from './combat.service';
import { CombatSocketService } from '@app/services/combat-socket/combat-socket.service';
import { InGameService } from '@app/services/in-game/in-game.service';
import { NotificationCoordinatorService } from '@app/services/notification-coordinator/notification-coordinator.service';
import { PlayerService } from '@app/services/player/player.service';
import { TimerCoordinatorService } from '@app/services/timer-coordinator/timer-coordinator.service';
import { CombatResult } from '@common/interfaces/combat.interface';
import { Dice } from '@common/enums/dice.enum';
import { TileCombatEffect } from '@common/enums/tile.enum';
import { Player } from '@common/interfaces/player.interface';
import { InGameSession } from '@common/interfaces/session.interface';

describe('CombatService', () => {
    let service: CombatService;
    let mockCombatSocketService: jasmine.SpyObj<CombatSocketService>;
    let mockInGameService: jasmine.SpyObj<InGameService>;
    let mockNotificationService: jasmine.SpyObj<NotificationCoordinatorService>;
    let mockPlayerService: jasmine.SpyObj<PlayerService>;
    let mockTimerService: jasmine.SpyObj<TimerCoordinatorService>;

    const mockPlayer: Player = {
        id: 'player1',
        name: 'Player 1',
        avatar: null,
        isAdmin: false,
        baseHealth: 10,
        healthBonus: 0,
        health: 10,
        maxHealth: 10,
        baseSpeed: 3,
        speedBonus: 0,
        speed: 3,
        baseAttack: 5,
        attackBonus: 0,
        attack: 5,
        baseDefense: 4,
        defenseBonus: 0,
        defense: 4,
        attackDice: Dice.D6,
        defenseDice: Dice.D6,
        x: 0,
        y: 0,
        isInGame: true,
        startPointId: 'start1',
        actionsRemaining: 2,
        combatCount: 0,
        combatWins: 0,
        combatLosses: 0,
        combatDraws: 0,
    };

    const mockTargetPlayer: Player = {
        ...mockPlayer,
        id: 'player2',
        name: 'Player 2',
        x: 1,
        y: 1,
    };

    const mockSession: InGameSession = {
        id: 'session1',
        gameId: 'game1',
        maxPlayers: 4,
        isRoomLocked: false,
        inGameId: 'ingame1',
        isGameStarted: true,
        inGamePlayers: {
            player1: mockPlayer,
            player2: mockTargetPlayer,
        },
        currentTurn: { turnNumber: 1, activePlayerId: 'player1', hasUsedAction: false },
        startPoints: [],
        turnOrder: ['player1', 'player2'],
        mapSize: 'small' as any,
        mode: 'classic' as any,
    } as InGameSession;

    const mockCombatResult: CombatResult = {
        playerAId: 'player1',
        playerBId: 'player2',
        playerAAttack: {
            dice: Dice.D6,
            diceRoll: 4,
            baseAttack: 5,
            attackBonus: 0,
            totalAttack: 9,
            tileCombatEffect: TileCombatEffect.BASE,
        },
        playerBAttack: {
            dice: Dice.D6,
            diceRoll: 3,
            baseAttack: 5,
            attackBonus: 0,
            totalAttack: 8,
            tileCombatEffect: TileCombatEffect.BASE,
        },
        playerADefense: {
            dice: Dice.D6,
            diceRoll: 2,
            baseDefense: 4,
            defenseBonus: 0,
            totalDefense: 6,
            tileCombatEffect: TileCombatEffect.BASE,
        },
        playerBDefense: {
            dice: Dice.D6,
            diceRoll: 5,
            baseDefense: 4,
            defenseBonus: 0,
            totalDefense: 9,
            tileCombatEffect: TileCombatEffect.BASE,
        },
        playerADamage: 2,
        playerBDamage: 0,
    };

    let combatStartedCallback: (data: any) => void;
    let combatResultCallback: (data: CombatResult) => void;
    let healthChangedCallback: (data: any) => void;
    let newRoundCallback: () => void;
    let timerRestartCallback: () => void;
    let postureSelectedCallback: (data: any) => void;
    let victoryCallback: (data: any) => void;
    let combatCountCallback: (data: any) => void;
    let combatWinsCallback: (data: any) => void;
    let combatLossesCallback: (data: any) => void;
    let combatDrawsCallback: (data: any) => void;

    beforeEach(() => {
        const combatSocketSpy = jasmine.createSpyObj('CombatSocketService', [
            'attackPlayerAction',
            'combatChoice',
            'combatAbandon',
            'onCombatStarted',
            'onPlayerCombatResult',
            'onPlayerHealthChanged',
            'onCombatNewRoundStarted',
            'onCombatTimerRestart',
            'onCombatPostureSelected',
            'onCombatVictory',
            'onCombatCountChanged',
            'onCombatWinsChanged',
            'onCombatLossesChanged',
            'onCombatDrawsChanged',
        ]);

        combatSocketSpy.onCombatStarted.and.callFake((callback: any) => {
            combatStartedCallback = callback;
        });
        combatSocketSpy.onPlayerCombatResult.and.callFake((callback: any) => {
            combatResultCallback = callback;
        });
        combatSocketSpy.onPlayerHealthChanged.and.callFake((callback: any) => {
            healthChangedCallback = callback;
        });
        combatSocketSpy.onCombatNewRoundStarted.and.callFake((callback: any) => {
            newRoundCallback = callback;
        });
        combatSocketSpy.onCombatTimerRestart.and.callFake((callback: any) => {
            timerRestartCallback = callback;
        });
        combatSocketSpy.onCombatPostureSelected.and.callFake((callback: any) => {
            postureSelectedCallback = callback;
        });
        combatSocketSpy.onCombatVictory.and.callFake((callback: any) => {
            victoryCallback = callback;
        });
        combatSocketSpy.onCombatCountChanged.and.callFake((callback: any) => {
            combatCountCallback = callback;
        });
        combatSocketSpy.onCombatWinsChanged.and.callFake((callback: any) => {
            combatWinsCallback = callback;
        });
        combatSocketSpy.onCombatLossesChanged.and.callFake((callback: any) => {
            combatLossesCallback = callback;
        });
        combatSocketSpy.onCombatDrawsChanged.and.callFake((callback: any) => {
            combatDrawsCallback = callback;
        });

        const inGameSpy = jasmine.createSpyObj('InGameService', [
            'getPlayerByPlayerId',
            'updateInGameSession',
            'sessionId',
            'inGameSession',
        ]);

        const notificationSpy = jasmine.createSpyObj('NotificationCoordinatorService', [
            'showInfoToast',
            'showSuccessToast',
        ]);

        const playerSpy = jasmine.createSpyObj('PlayerService', ['id', 'updatePlayer']);

        const timerSpy = jasmine.createSpyObj('TimerCoordinatorService', [
            'pauseTurnTimer',
            'resumeTurnTimer',
            'startCombatTimer',
            'stopCombatTimer',
            'resetCombatTimer',
            'isCombatActive',
        ]);

        TestBed.configureTestingModule({
            providers: [
                CombatService,
                { provide: CombatSocketService, useValue: combatSocketSpy },
                { provide: InGameService, useValue: inGameSpy },
                { provide: NotificationCoordinatorService, useValue: notificationSpy },
                { provide: PlayerService, useValue: playerSpy },
                { provide: TimerCoordinatorService, useValue: timerSpy },
            ],
        });

        service = TestBed.inject(CombatService);
        mockCombatSocketService = TestBed.inject(CombatSocketService) as jasmine.SpyObj<CombatSocketService>;
        mockInGameService = TestBed.inject(InGameService) as jasmine.SpyObj<InGameService>;
        mockNotificationService = TestBed.inject(NotificationCoordinatorService) as jasmine.SpyObj<NotificationCoordinatorService>;
        mockPlayerService = TestBed.inject(PlayerService) as jasmine.SpyObj<PlayerService>;
        mockTimerService = TestBed.inject(TimerCoordinatorService) as jasmine.SpyObj<TimerCoordinatorService>;

        mockInGameService.getPlayerByPlayerId.and.callFake((id: string) => {
            return id === 'player1' ? mockPlayer : mockTargetPlayer;
        });
        mockInGameService.sessionId.and.returnValue('session1');
        mockInGameService.inGameSession.and.returnValue(mockSession);
        mockPlayerService.id.and.returnValue('player1');
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    describe('startCombat', () => {
        it('should initialize combat data correctly', () => {
            service.startCombat('player1', 'player2', 'attacker', 1, 0);

            expect(service.combatData()).toEqual({
                attackerId: 'player1',
                targetId: 'player2',
                userRole: 'attacker',
            });
            expect(service.isCombatActive()).toBe(true);
            expect(service.selectedPosture()).toBeNull();
            expect(service.playerPostures()).toEqual({});
        });

        it('should set tile effects when provided', () => {
            service.startCombat('player1', 'player2', 'attacker', TileCombatEffect.ICE, TileCombatEffect.BASE);

            expect(service.tileEffects()).toEqual({
                player1: TileCombatEffect.ICE,
                player2: TileCombatEffect.BASE,
            });
        });

        it('should set min health during combat', () => {
            service.startCombat('player1', 'player2', 'attacker');

            expect(service.minHealthDuringCombat()).toEqual({
                player1: 10,
                player2: 10,
            });
        });
    });

    describe('combatAbandon', () => {
        it('should call socket service when in combat', () => {
            service.startCombat('player1', 'player2', 'attacker');

            service.combatAbandon();

            expect(mockCombatSocketService.combatAbandon).toHaveBeenCalledWith('session1');
        });

        it('should not call socket service when not in combat', () => {
            service.combatAbandon();

            expect(mockCombatSocketService.combatAbandon).not.toHaveBeenCalled();
        });
    });

    describe('closeVictoryOverlay', () => {
        it('should reset all combat state', () => {
            service.startCombat('player1', 'player2', 'attacker');
            service.chooseOffensive();

            service.closeVictoryOverlay();

            expect(service.combatData()).toBeNull();
            expect(service.selectedPosture()).toBeNull();
            expect(service.playerPostures()).toEqual({});
            expect(service.victoryData()).toBeNull();
            expect(service.tileEffects()).toEqual({});
            expect(service.minHealthDuringCombat()).toEqual({});
            expect(service.isVictoryNotificationVisible()).toBe(false);
        });
    });

    describe('chooseOffensive', () => {
        it('should set posture and call socket service', () => {
            service.startCombat('player1', 'player2', 'attacker');

            service.chooseOffensive();

            expect(service.selectedPosture()).toBe('offensive');
            expect(mockCombatSocketService.combatChoice).toHaveBeenCalledWith('session1', 'offensive');
        });

        it('should not change posture if already selected', () => {
            service.startCombat('player1', 'player2', 'attacker');
            service.chooseOffensive();

            service.chooseOffensive();

            expect(mockCombatSocketService.combatChoice).toHaveBeenCalledTimes(1);
        });
    });

    describe('chooseDefensive', () => {
        it('should set posture and call socket service', () => {
            service.startCombat('player1', 'player2', 'attacker');

            service.chooseDefensive();

            expect(service.selectedPosture()).toBe('defensive');
            expect(mockCombatSocketService.combatChoice).toHaveBeenCalledWith('session1', 'defensive');
        });

        it('should not change posture if already selected', () => {
            service.startCombat('player1', 'player2', 'attacker');
            service.chooseDefensive();

            service.chooseDefensive();

            expect(mockCombatSocketService.combatChoice).toHaveBeenCalledTimes(1);
        });
    });

    describe('attackPlayer', () => {
        it('should call socket service with coordinates', () => {
            service.attackPlayer(2, 3);

            expect(mockCombatSocketService.attackPlayerAction).toHaveBeenCalledWith('session1', 2, 3);
        });
    });

    describe('socket event handlers', () => {
        describe('onCombatStarted', () => {
            it('should handle combat started as attacker', () => {
                mockTimerService.isCombatActive.and.returnValue(false);

                combatStartedCallback({
                    attackerId: 'player1',
                    targetId: 'player2',
                    attackerTileEffect: TileCombatEffect.BASE,
                    targetTileEffect: TileCombatEffect.BASE,
                });

                expect(mockTimerService.pauseTurnTimer).toHaveBeenCalled();
                expect(mockTimerService.startCombatTimer).toHaveBeenCalled();
                expect(service.combatData()).toEqual({
                    attackerId: 'player1',
                    targetId: 'player2',
                    userRole: 'attacker',
                });
            });

            it('should handle combat started as target', () => {
                mockPlayerService.id.and.returnValue('player2');
                mockTimerService.isCombatActive.and.returnValue(false);

                combatStartedCallback({
                    attackerId: 'player1',
                    targetId: 'player2',
                    attackerTileEffect: TileCombatEffect.BASE,
                    targetTileEffect: TileCombatEffect.BASE,
                });

                expect(service.combatData()).toEqual({
                    attackerId: 'player1',
                    targetId: 'player2',
                    userRole: 'target',
                });
            });

            it('should handle combat started as spectator', () => {
                mockPlayerService.id.and.returnValue('player3');
                mockTimerService.isCombatActive.and.returnValue(false);

                combatStartedCallback({
                    attackerId: 'player1',
                    targetId: 'player2',
                    attackerTileEffect: TileCombatEffect.BASE,
                    targetTileEffect: TileCombatEffect.BASE,
                });

                expect(service.combatData()).toEqual({
                    attackerId: 'player1',
                    targetId: 'player2',
                    userRole: 'spectator',
                });
                expect(mockNotificationService.showInfoToast).toHaveBeenCalledWith(
                    '⚔️ Combat en cours : Player 1 vs Player 2',
                    jasmine.any(Number),
                );
            });
        });

        describe('onPlayerCombatResult', () => {
            it('should handle combat result and show damage displays', () => {
                service.startCombat('player1', 'player2', 'attacker', TileCombatEffect.BASE, TileCombatEffect.BASE);

                combatResultCallback(mockCombatResult);

                expect(service.damageDisplays().length).toBe(2);
                expect(service.selectedPosture()).toBeNull();
            });
        });

        describe('onPlayerHealthChanged', () => {
            it('should update player health in session and service', () => {
                service.startCombat('player1', 'player2', 'attacker');

                healthChangedCallback({ playerId: 'player1', newHealth: 8 });

                expect(mockInGameService.updateInGameSession).toHaveBeenCalled();
                expect(mockPlayerService.updatePlayer).toHaveBeenCalledWith({ health: 8 });
            });

            it('should update min health during combat', () => {
                service.startCombat('player1', 'player2', 'attacker');

                healthChangedCallback({ playerId: 'player1', newHealth: 5 });

                expect(service.minHealthDuringCombat()['player1']).toBe(5);
            });
        });

        describe('onCombatNewRoundStarted', () => {
            it('should reset combat timer and postures', () => {
                service.startCombat('player1', 'player2', 'attacker');
                service.chooseOffensive();

                newRoundCallback();

                expect(mockTimerService.resetCombatTimer).toHaveBeenCalled();
                expect(service.selectedPosture()).toBeNull();
                expect(service.playerPostures()).toEqual({});
            });
        });

        describe('onCombatTimerRestart', () => {
            it('should restart combat timer when not active', () => {
                mockTimerService.isCombatActive.and.returnValue(false);
                service.startCombat('player1', 'player2', 'attacker');

                timerRestartCallback();

                expect(mockTimerService.pauseTurnTimer).toHaveBeenCalled();
                expect(mockTimerService.startCombatTimer).toHaveBeenCalled();
            });

            it('should reset combat timer when active', () => {
                mockTimerService.isCombatActive.and.returnValue(true);
                service.startCombat('player1', 'player2', 'attacker');

                timerRestartCallback();

                expect(mockTimerService.resetCombatTimer).toHaveBeenCalled();
            });
        });

        describe('onCombatPostureSelected', () => {
            it('should update player postures', () => {
                postureSelectedCallback({ playerId: 'player1', posture: 'offensive' });

                expect(service.playerPostures()).toEqual({ player1: 'offensive' });
            });
        });

        describe('onCombatVictory', () => {
            it('should handle victory as participant', () => {
                service.startCombat('player1', 'player2', 'attacker');

                victoryCallback({
                    playerAId: 'player1',
                    playerBId: 'player2',
                    winnerId: 'player1',
                    abandon: false,
                });

                expect(mockTimerService.stopCombatTimer).toHaveBeenCalled();
                expect(mockTimerService.resumeTurnTimer).toHaveBeenCalled();
                expect(service.victoryData()).toEqual({
                    playerAId: 'player1',
                    playerBId: 'player2',
                    winnerId: 'player1',
                    abandon: false,
                });
                expect(service.isVictoryNotificationVisible()).toBe(true);
            });
        });

        describe('combat stats updates', () => {
            it('should handle combat count changes', () => {
                combatCountCallback({ playerId: 'player1', combatCount: 5 });

                expect(mockInGameService.updateInGameSession).toHaveBeenCalled();
                expect(mockPlayerService.updatePlayer).toHaveBeenCalledWith({ combatCount: 5 });
            });

            it('should handle combat wins changes', () => {
                combatWinsCallback({ playerId: 'player1', combatWins: 3 });

                expect(mockInGameService.updateInGameSession).toHaveBeenCalled();
                expect(mockPlayerService.updatePlayer).toHaveBeenCalledWith({ combatWins: 3 });
            });

            it('should handle combat losses changes', () => {
                combatLossesCallback({ playerId: 'player1', combatLosses: 2 });

                expect(mockInGameService.updateInGameSession).toHaveBeenCalled();
                expect(mockPlayerService.updatePlayer).toHaveBeenCalledWith({ combatLosses: 2 });
            });

            it('should handle combat draws changes', () => {
                combatDrawsCallback({ playerId: 'player1', combatDraws: 1 });

                expect(mockInGameService.updateInGameSession).toHaveBeenCalled();
                expect(mockPlayerService.updatePlayer).toHaveBeenCalledWith({ combatDraws: 1 });
            });
        });
    });
});