/* eslint-disable max-lines -- Extensive tests needed for 100% code coverage */
import { TestBed } from '@angular/core/testing';
import { CombatService } from './combat.service';
import { CombatSocketService } from '@app/services/combat-socket/combat-socket.service';
import { CombatStartedDto } from '@app/dto/combat-started-dto';
import { CombatVictoryDto } from '@app/dto/combat-victory-dto';
import { CombatPostureSelectedDto } from '@app/dto/combat-posture-selected-dto';
import { PlayerHealthChangedDto } from '@app/dto/player-health-changed-dto';
import { PlayerCombatStatsDto } from '@app/dto/player-combat-stats-dto';
import { PlayerCombatWinsDto } from '@app/dto/player-combat-wins-dto';
import { PlayerCombatLossesDto } from '@app/dto/player-combat-losses-dto';
import { PlayerCombatDrawsDto } from '@app/dto/player-combat-draws-dto';
import { InGameService } from '@app/services/in-game/in-game.service';
import { NotificationCoordinatorService } from '@app/services/notification-coordinator/notification-coordinator.service';
import { PlayerService } from '@app/services/player/player.service';
import { TimerCoordinatorService } from '@app/services/timer-coordinator/timer-coordinator.service';
import { CombatResult } from '@common/interfaces/combat.interface';
import { Dice } from '@common/enums/dice.enum';
import { TileCombatEffect } from '@common/enums/tile.enum';
import { CombatPosture } from '@common/enums/combat-posture.enum';
import { Player } from '@common/interfaces/player.interface';
import { InGameSession } from '@common/interfaces/session.interface';
import { MapSize } from '@common/enums/map-size.enum';
import { GameMode } from '@common/enums/game-mode.enum';

const TEST_TIMEOUT_ID_1 = 123;
const TEST_TIMEOUT_ID_2 = 456;
const TEST_TIMEOUT_ID_3 = 789;
const TEST_ATTACK_COORDINATE = 3;
const TEST_DAMAGE_DISPLAY_TIMEOUT = 2100;
const TEST_HEALTH_VALUE = 5;
const TEST_HEALTH_VALUE_7 = 7;

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
        mapSize: MapSize.SMALL,
        mode: GameMode.CLASSIC,
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

    let combatStartedCallback: (data: CombatStartedDto) => void;
    let combatResultCallback: (data: CombatResult) => void;
    let healthChangedCallback: (data: PlayerHealthChangedDto) => void;
    let newRoundCallback: () => void;
    let timerRestartCallback: () => void;
    let postureSelectedCallback: (data: CombatPostureSelectedDto) => void;
    let victoryCallback: (data: CombatVictoryDto) => void;
    let combatCountCallback: (data: PlayerCombatStatsDto) => void;
    let combatWinsCallback: (data: PlayerCombatWinsDto) => void;
    let combatLossesCallback: (data: PlayerCombatLossesDto) => void;
    let combatDrawsCallback: (data: PlayerCombatDrawsDto) => void;

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

        combatSocketSpy.onCombatStarted.and.callFake((callback: (data: CombatStartedDto) => void) => {
            combatStartedCallback = callback;
        });
        combatSocketSpy.onPlayerCombatResult.and.callFake((callback: (data: CombatResult) => void) => {
            combatResultCallback = callback;
        });
        combatSocketSpy.onPlayerHealthChanged.and.callFake((callback: (data: PlayerHealthChangedDto) => void) => {
            healthChangedCallback = callback;
        });
        combatSocketSpy.onCombatNewRoundStarted.and.callFake((callback: () => void) => {
            newRoundCallback = callback;
        });
        combatSocketSpy.onCombatTimerRestart.and.callFake((callback: () => void) => {
            timerRestartCallback = callback;
        });
        combatSocketSpy.onCombatPostureSelected.and.callFake((callback: (data: CombatPostureSelectedDto) => void) => {
            postureSelectedCallback = callback;
        });
        combatSocketSpy.onCombatVictory.and.callFake((callback: (data: CombatVictoryDto) => void) => {
            victoryCallback = callback;
        });
        combatSocketSpy.onCombatCountChanged.and.callFake((callback: (data: PlayerCombatStatsDto) => void) => {
            combatCountCallback = callback;
        });
        combatSocketSpy.onCombatWinsChanged.and.callFake((callback: (data: PlayerCombatWinsDto) => void) => {
            combatWinsCallback = callback;
        });
        combatSocketSpy.onCombatLossesChanged.and.callFake((callback: (data: PlayerCombatLossesDto) => void) => {
            combatLossesCallback = callback;
        });
        combatSocketSpy.onCombatDrawsChanged.and.callFake((callback: (data: PlayerCombatDrawsDto) => void) => {
            combatDrawsCallback = callback;
        });

        const inGameSpy = jasmine.createSpyObj('InGameService', ['getPlayerByPlayerId', 'updateInGameSession', 'sessionId', 'inGameSession']);

        const notificationSpy = jasmine.createSpyObj('NotificationCoordinatorService', ['showInfoToast', 'showSuccessToast']);

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

    describe('startCombat (via handleCombatStarted)', () => {
        it('should initialize combat data correctly', () => {
            mockTimerService.isCombatActive.and.returnValue(false);

            combatStartedCallback({
                attackerId: 'player1',
                targetId: 'player2',
                attackerTileEffect: 1,
                targetTileEffect: 0,
            });

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
            mockTimerService.isCombatActive.and.returnValue(false);

            combatStartedCallback({
                attackerId: 'player1',
                targetId: 'player2',
                attackerTileEffect: TileCombatEffect.ICE,
                targetTileEffect: TileCombatEffect.BASE,
            });

            expect(service.tileEffects()).toEqual({
                player1: TileCombatEffect.ICE,
                player2: TileCombatEffect.BASE,
            });
        });

        it('should set min health during combat', () => {
            mockTimerService.isCombatActive.and.returnValue(false);

            combatStartedCallback({
                attackerId: 'player1',
                targetId: 'player2',
            });

            expect(service.minHealthDuringCombat()).toEqual({
                player1: 10,
                player2: 10,
            });
        });
    });

    describe('combatAbandon', () => {
        it('should call socket service when in combat', () => {
            mockTimerService.isCombatActive.and.returnValue(false);
            combatStartedCallback({
                attackerId: 'player1',
                targetId: 'player2',
            });

            service.combatAbandon();

            expect(mockCombatSocketService.combatAbandon).toHaveBeenCalledWith({ sessionId: 'session1' });
        });

        it('should not call socket service when not in combat', () => {
            service.combatAbandon();

            expect(mockCombatSocketService.combatAbandon).not.toHaveBeenCalled();
        });
    });

    describe('closeVictoryOverlay', () => {
        it('should reset all combat state', () => {
            mockTimerService.isCombatActive.and.returnValue(false);
            combatStartedCallback({
                attackerId: 'player1',
                targetId: 'player2',
            });
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

        it('should clear timeout when timeout exists', () => {
            spyOn(window, 'clearTimeout');
            (service as unknown as { victoryNotificationTimeout: number }).victoryNotificationTimeout = TEST_TIMEOUT_ID_1;

            service.closeVictoryOverlay();

            expect(clearTimeout).toHaveBeenCalledWith(TEST_TIMEOUT_ID_1);
            expect((service as unknown as { victoryNotificationTimeout: number | null }).victoryNotificationTimeout).toBeNull();
        });
    });

    describe('chooseOffensive', () => {
        it('should set posture and call socket service', () => {
            mockTimerService.isCombatActive.and.returnValue(false);
            combatStartedCallback({
                attackerId: 'player1',
                targetId: 'player2',
            });

            service.chooseOffensive();

            expect(service.selectedPosture()).toBe(CombatPosture.OFFENSIVE);
            expect(mockCombatSocketService.combatChoice).toHaveBeenCalledWith({ sessionId: 'session1', choice: CombatPosture.OFFENSIVE });
        });

        it('should not change posture if already selected', () => {
            mockTimerService.isCombatActive.and.returnValue(false);
            combatStartedCallback({
                attackerId: 'player1',
                targetId: 'player2',
            });
            service.chooseOffensive();

            service.chooseOffensive();

            expect(mockCombatSocketService.combatChoice).toHaveBeenCalledTimes(1);
        });
    });

    describe('chooseDefensive', () => {
        it('should set posture and call socket service', () => {
            mockTimerService.isCombatActive.and.returnValue(false);
            combatStartedCallback({
                attackerId: 'player1',
                targetId: 'player2',
            });

            service.chooseDefensive();

            expect(service.selectedPosture()).toBe(CombatPosture.DEFENSIVE);
            expect(mockCombatSocketService.combatChoice).toHaveBeenCalledWith({ sessionId: 'session1', choice: CombatPosture.DEFENSIVE });
        });

        it('should not change posture if already selected', () => {
            mockTimerService.isCombatActive.and.returnValue(false);
            combatStartedCallback({
                attackerId: 'player1',
                targetId: 'player2',
            });
            service.chooseDefensive();

            service.chooseDefensive();

            expect(mockCombatSocketService.combatChoice).toHaveBeenCalledTimes(1);
        });
    });

    describe('attackPlayer', () => {
        it('should call socket service with coordinates', () => {
            service.attackPlayer(2, TEST_ATTACK_COORDINATE);

            expect(mockCombatSocketService.attackPlayerAction).toHaveBeenCalledWith({ sessionId: 'session1', x: 2, y: 3 });
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
                expect(mockNotificationService.showInfoToast).toHaveBeenCalledWith('⚔️ Combat en cours : Player 1 vs Player 2', jasmine.any(Number));
            });
        });

        describe('onPlayerCombatResult', () => {
            it('should handle combat result and show damage displays', () => {
                mockTimerService.isCombatActive.and.returnValue(false);
                combatStartedCallback({
                    attackerId: 'player1',
                    targetId: 'player2',
                    attackerTileEffect: TileCombatEffect.BASE,
                    targetTileEffect: TileCombatEffect.BASE,
                });

                combatResultCallback(mockCombatResult);

                expect(service.damageDisplays().length).toBe(2);
                expect(service.selectedPosture()).toBeNull();
            });

            it('should hide damage display after timeout', (done) => {
                mockTimerService.isCombatActive.and.returnValue(false);
                combatStartedCallback({
                    attackerId: 'player1',
                    targetId: 'player2',
                    attackerTileEffect: TileCombatEffect.BASE,
                    targetTileEffect: TileCombatEffect.BASE,
                });
                combatResultCallback(mockCombatResult);

                const initialDisplays = service.damageDisplays();
                expect(initialDisplays[0].visible).toBe(true);

                setTimeout(() => {
                    const updatedDisplays = service.damageDisplays();
                    expect(updatedDisplays[0].visible).toBe(false);
                    done();
                }, TEST_DAMAGE_DISPLAY_TIMEOUT);
            });

            it('should use default tile effect of 0 when tile effect is not provided', () => {
                mockTimerService.isCombatActive.and.returnValue(false);
                combatStartedCallback({
                    attackerId: 'player1',
                    targetId: 'player2',
                });

                combatResultCallback(mockCombatResult);

                const displays = service.damageDisplays();
                expect(displays.length).toBe(2);
                expect(displays.find((display) => display.playerId === 'player1')?.tileEffect).toBe(0);
                expect(displays.find((display) => display.playerId === 'player2')?.tileEffect).toBe(0);
            });
        });

        describe('onPlayerHealthChanged', () => {
            it('should update player health in session and service', () => {
                mockTimerService.isCombatActive.and.returnValue(false);
                combatStartedCallback({
                    attackerId: 'player1',
                    targetId: 'player2',
                });

                healthChangedCallback({ playerId: 'player1', newHealth: 8 });

                expect(mockInGameService.updateInGameSession).toHaveBeenCalled();
                expect(mockPlayerService.updatePlayer).toHaveBeenCalledWith({ health: 8 });
            });

            it('should update min health during combat', () => {
                mockTimerService.isCombatActive.and.returnValue(false);
                combatStartedCallback({
                    attackerId: 'player1',
                    targetId: 'player2',
                });

                healthChangedCallback({ playerId: 'player1', newHealth: TEST_HEALTH_VALUE });

                expect(service.minHealthDuringCombat()['player1']).toBe(TEST_HEALTH_VALUE);
            });

            it('should use newHealth as default when playerId is not in minHealthDuringCombat', () => {
                mockTimerService.isCombatActive.and.returnValue(false);
                combatStartedCallback({
                    attackerId: 'player1',
                    targetId: 'player2',
                });
                service['_minHealthDuringCombat'].set({ player1: 10 });
                service['_combatData'].set({ attackerId: 'player1', targetId: 'player2', userRole: 'attacker' });
                service['_victoryData'].set(null);

                healthChangedCallback({ playerId: 'player3', newHealth: TEST_HEALTH_VALUE_7 });

                expect(service.minHealthDuringCombat()['player3']).toBe(TEST_HEALTH_VALUE_7);
            });
        });

        describe('onCombatNewRoundStarted', () => {
            it('should reset combat timer and postures', () => {
                mockTimerService.isCombatActive.and.returnValue(false);
                combatStartedCallback({
                    attackerId: 'player1',
                    targetId: 'player2',
                });
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
                combatStartedCallback({
                    attackerId: 'player1',
                    targetId: 'player2',
                });

                timerRestartCallback();

                expect(mockTimerService.pauseTurnTimer).toHaveBeenCalled();
                expect(mockTimerService.startCombatTimer).toHaveBeenCalled();
            });

            it('should reset combat timer when active', () => {
                mockTimerService.isCombatActive.and.returnValue(false);
                combatStartedCallback({
                    attackerId: 'player1',
                    targetId: 'player2',
                });
                mockTimerService.isCombatActive.and.returnValue(true);

                timerRestartCallback();

                expect(mockTimerService.resetCombatTimer).toHaveBeenCalled();
            });
        });

        describe('onCombatPostureSelected', () => {
            it('should update player postures', () => {
                postureSelectedCallback({ playerId: 'player1', posture: CombatPosture.OFFENSIVE });

                expect(service.playerPostures()).toEqual({ player1: CombatPosture.OFFENSIVE });
            });
        });

        describe('onCombatVictory', () => {
            it('should handle victory as participant', () => {
                mockTimerService.isCombatActive.and.returnValue(false);
                combatStartedCallback({
                    attackerId: 'player1',
                    targetId: 'player2',
                });

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

            it('should handle draw victory', () => {
                mockPlayerService.id.and.returnValue('player3');
                mockTimerService.isCombatActive.and.returnValue(false);
                combatStartedCallback({
                    attackerId: 'player1',
                    targetId: 'player2',
                });

                victoryCallback({
                    playerAId: 'player1',
                    playerBId: 'player2',
                    winnerId: null,
                    abandon: false,
                });

                expect(mockNotificationService.showInfoToast).toHaveBeenCalledWith('⚔️ Match nul entre Player 1 et Player 2', jasmine.any(Number));
            });

            it('should handle abandon victory', () => {
                mockPlayerService.id.and.returnValue('player3');
                mockTimerService.isCombatActive.and.returnValue(false);
                combatStartedCallback({
                    attackerId: 'player1',
                    targetId: 'player2',
                });

                victoryCallback({
                    playerAId: 'player1',
                    playerBId: 'player2',
                    winnerId: 'player1',
                    abandon: true,
                });

                expect(mockNotificationService.showSuccessToast).toHaveBeenCalledWith(
                    '🏆 Player 1 a gagné par abandon contre Player 2',
                    jasmine.any(Number),
                );
            });

            it('should handle abandon victory when winner is playerB', () => {
                mockPlayerService.id.and.returnValue('player3');
                mockTimerService.isCombatActive.and.returnValue(false);
                combatStartedCallback({
                    attackerId: 'player1',
                    targetId: 'player2',
                });

                victoryCallback({
                    playerAId: 'player1',
                    playerBId: 'player2',
                    winnerId: 'player2',
                    abandon: true,
                });

                expect(mockNotificationService.showSuccessToast).toHaveBeenCalledWith(
                    '🏆 Player 2 a gagné par abandon contre Player 1',
                    jasmine.any(Number),
                );
            });

            it('should handle normal victory', () => {
                mockPlayerService.id.and.returnValue('player3');
                mockTimerService.isCombatActive.and.returnValue(false);
                combatStartedCallback({
                    attackerId: 'player1',
                    targetId: 'player2',
                });

                victoryCallback({
                    playerAId: 'player1',
                    playerBId: 'player2',
                    winnerId: 'player1',
                    abandon: false,
                });

                expect(mockNotificationService.showSuccessToast).toHaveBeenCalledWith('🏆 Player 1 a vaincu Player 2', jasmine.any(Number));
            });

            it('should handle normal victory when winner is playerB', () => {
                mockPlayerService.id.and.returnValue('player3');
                mockTimerService.isCombatActive.and.returnValue(false);
                combatStartedCallback({
                    attackerId: 'player1',
                    targetId: 'player2',
                });

                victoryCallback({
                    playerAId: 'player1',
                    playerBId: 'player2',
                    winnerId: 'player2',
                    abandon: false,
                });

                expect(mockNotificationService.showSuccessToast).toHaveBeenCalledWith('🏆 Player 2 a vaincu Player 1', jasmine.any(Number));
            });

            it('should set victory notification timeout', () => {
                spyOn(window, 'setTimeout').and.returnValue(TEST_TIMEOUT_ID_2 as unknown as NodeJS.Timeout);
                mockTimerService.isCombatActive.and.returnValue(false);
                combatStartedCallback({
                    attackerId: 'player1',
                    targetId: 'player2',
                });

                victoryCallback({
                    playerAId: 'player1',
                    playerBId: 'player2',
                    winnerId: 'player1',
                    abandon: false,
                });

                expect(setTimeout).toHaveBeenCalled();
                expect((service as unknown as { victoryNotificationTimeout: number }).victoryNotificationTimeout).toBe(TEST_TIMEOUT_ID_2);
            });

            it('should clear existing timeout before setting new one', () => {
                spyOn(window, 'clearTimeout');
                spyOn(window, 'setTimeout').and.returnValue(TEST_TIMEOUT_ID_3 as unknown as NodeJS.Timeout);
                (service as unknown as { victoryNotificationTimeout: number }).victoryNotificationTimeout = TEST_TIMEOUT_ID_1;
                mockTimerService.isCombatActive.and.returnValue(false);
                combatStartedCallback({
                    attackerId: 'player1',
                    targetId: 'player2',
                });

                victoryCallback({
                    playerAId: 'player1',
                    playerBId: 'player2',
                    winnerId: 'player1',
                    abandon: false,
                });

                expect(clearTimeout).toHaveBeenCalledWith(TEST_TIMEOUT_ID_1);
                expect(setTimeout).toHaveBeenCalled();
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
