/* eslint-disable max-lines -- Test file */
import { CombatService } from '@app/modules/in-game/services/combat/combat.service';
import { InGameEvents } from '@common/enums/in-game-events.enum';
import { CombatResult, CombatAttack, CombatDefense } from '@common/interfaces/combat.interface';
import { InGameSession } from '@common/interfaces/session.interface';
import { Dice } from '@common/enums/dice.enum';
import { Test, TestingModule } from '@nestjs/testing';
import { Logger } from '@nestjs/common';
import { CombatGateway } from './combat.gateway';
import { validationExceptionFactory } from '@app/utils/validation/validation.util';
import { Server, Socket } from 'socket.io';
import 'reflect-metadata';

describe('CombatGateway', () => {
    let gateway: CombatGateway;
    let combatService: jest.Mocked<CombatService>;
    let mockServer: jest.Mocked<Server>;
    let mockSocket: jest.Mocked<Socket>;

    const SESSION_ID = 'session-123';
    const IN_GAME_ID = 'in-game-789';
    const SOCKET_ID = 'socket-id-123';
    const PLAYER_A_ID = 'player-a';
    const PLAYER_B_ID = 'player-b';
    const TARGET_X = 1;
    const TARGET_Y = 2;
    const ATTACKER_TILE_EFFECT = 1;
    const TARGET_TILE_EFFECT = 2;
    const NEW_HEALTH = 50;
    const COMBAT_COUNT = 5;
    const COMBAT_WINS = 3;
    const COMBAT_LOSSES = 1;
    const COMBAT_DRAWS = 1;

    const createMockSocket = (id: string = SOCKET_ID): jest.Mocked<Socket> => {
        return {
            id,
            emit: jest.fn(),
        } as unknown as jest.Mocked<Socket>;
    };

    const createMockServer = (): jest.Mocked<Server> => {
        return {
            to: jest.fn().mockReturnThis(),
            emit: jest.fn(),
        } as unknown as jest.Mocked<Server>;
    };

    const createMockInGameSession = (overrides: Partial<InGameSession> = {}): InGameSession => {
        return {
            id: SESSION_ID,
            inGameId: IN_GAME_ID,
            ...overrides,
        } as InGameSession;
    };

    const createMockCombatAttack = (overrides: Partial<CombatAttack> = {}): CombatAttack => ({
        dice: Dice.D6,
        diceRoll: 4,
        baseAttack: 10,
        attackBonus: 0,
        totalAttack: 10,
        tileCombatEffect: 0,
        ...overrides,
    });

    const createMockCombatDefense = (overrides: Partial<CombatDefense> = {}): CombatDefense => ({
        dice: Dice.D4,
        diceRoll: 3,
        baseDefense: 5,
        defenseBonus: 0,
        totalDefense: 5,
        tileCombatEffect: 0,
        ...overrides,
    });

    const createMockCombatResult = (overrides: Partial<CombatResult> = {}): CombatResult => ({
        playerAId: PLAYER_A_ID,
        playerBId: PLAYER_B_ID,
        playerAAttack: createMockCombatAttack(),
        playerBAttack: createMockCombatAttack({ totalAttack: 8 }),
        playerADefense: createMockCombatDefense(),
        playerBDefense: createMockCombatDefense({ totalDefense: 3 }),
        playerADamage: 3,
        playerBDamage: 5,
        ...overrides,
    });

    beforeEach(async () => {
        mockServer = createMockServer();
        mockSocket = createMockSocket();

        const mockCombatService = {
            attackPlayerAction: jest.fn(),
            combatChoice: jest.fn(),
            combatAbandon: jest.fn(),
            getSession: jest.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                CombatGateway,
                {
                    provide: CombatService,
                    useValue: mockCombatService,
                },
            ],
        }).compile();

        gateway = module.get<CombatGateway>(CombatGateway);
        combatService = module.get(CombatService);

        (gateway as unknown as { server: jest.Mocked<Server> }).server = mockServer;
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(gateway).toBeDefined();
    });

    describe('ValidationPipe exceptionFactory', () => {
        it('should trigger validation error factory', () => {
            const loggerSpy = jest.spyOn(Logger.prototype, 'error').mockImplementation();
            const mockErrors = [{ property: 'sessionId', constraints: { isString: 'sessionId must be a string' } }];

            expect(() => {
                validationExceptionFactory(mockErrors);
            }).toThrow('Validation failed');

            expect(loggerSpy).toHaveBeenCalledWith('Validation failed:', mockErrors);
            loggerSpy.mockRestore();
        });
    });

    describe('attackPlayerAction', () => {
        it('should call combatService.attackPlayerAction successfully', () => {
            const payload = { sessionId: SESSION_ID, x: TARGET_X, y: TARGET_Y };

            gateway.attackPlayerAction(mockSocket, payload);

            expect(combatService.attackPlayerAction).toHaveBeenCalledWith(SESSION_ID, SOCKET_ID, TARGET_X, TARGET_Y);
            expect(mockSocket.emit).not.toHaveBeenCalled();
        });

        it('should emit error when combatService throws', () => {
            const payload = { sessionId: SESSION_ID, x: TARGET_X, y: TARGET_Y };
            const errorMessage = 'Player not found';
            combatService.attackPlayerAction.mockImplementation(() => {
                throw new Error(errorMessage);
            });

            gateway.attackPlayerAction(mockSocket, payload);

            expect(mockSocket.emit).toHaveBeenCalledWith(InGameEvents.AttackPlayerAction, {
                success: false,
                message: errorMessage,
            });
        });
    });

    describe('combatChoice', () => {
        it('should call combatService.combatChoice successfully', () => {
            const payload = { sessionId: SESSION_ID, choice: 'offensive' as const };

            gateway.combatChoice(mockSocket, payload);

            expect(combatService.combatChoice).toHaveBeenCalledWith(SESSION_ID, SOCKET_ID, 'offensive');
            expect(mockSocket.emit).not.toHaveBeenCalled();
        });

        it('should call combatService.combatChoice with defensive choice', () => {
            const payload = { sessionId: SESSION_ID, choice: 'defensive' as const };

            gateway.combatChoice(mockSocket, payload);

            expect(combatService.combatChoice).toHaveBeenCalledWith(SESSION_ID, SOCKET_ID, 'defensive');
        });

        it('should emit error when combatService throws', () => {
            const payload = { sessionId: SESSION_ID, choice: 'offensive' as const };
            const errorMessage = 'Combat not found';
            combatService.combatChoice.mockImplementation(() => {
                throw new Error(errorMessage);
            });

            gateway.combatChoice(mockSocket, payload);

            expect(mockSocket.emit).toHaveBeenCalledWith(InGameEvents.CombatChoice, {
                success: false,
                message: errorMessage,
            });
        });
    });

    describe('combatAbandon', () => {
        it('should call combatService.combatAbandon successfully', () => {
            const payload = { sessionId: SESSION_ID };

            gateway.combatAbandon(mockSocket, payload);

            expect(combatService.combatAbandon).toHaveBeenCalledWith(SESSION_ID, SOCKET_ID);
            expect(mockSocket.emit).not.toHaveBeenCalled();
        });

        it('should emit error when combatService throws', () => {
            const payload = { sessionId: SESSION_ID };
            const errorMessage = 'Combat not found';
            combatService.combatAbandon.mockImplementation(() => {
                throw new Error(errorMessage);
            });

            gateway.combatAbandon(mockSocket, payload);

            expect(mockSocket.emit).toHaveBeenCalledWith(InGameEvents.CombatAbandon, {
                success: false,
                message: errorMessage,
            });
        });
    });

    describe('handleCombatStarted', () => {
        it('should emit CombatStarted when session exists', () => {
            const session = createMockInGameSession();
            combatService.getSession.mockReturnValue(session);
            const payload = {
                sessionId: SESSION_ID,
                attackerId: PLAYER_A_ID,
                targetId: PLAYER_B_ID,
                attackerTileEffect: ATTACKER_TILE_EFFECT,
                targetTileEffect: TARGET_TILE_EFFECT,
            };

            gateway.handleCombatStarted(payload);

            expect(combatService.getSession).toHaveBeenCalledWith(SESSION_ID);
            expect(mockServer.to).toHaveBeenCalledWith(IN_GAME_ID);
            expect(mockServer.emit).toHaveBeenCalledWith(
                InGameEvents.CombatStarted,
                expect.objectContaining({
                    success: true,
                    data: {
                        attackerId: PLAYER_A_ID,
                        targetId: PLAYER_B_ID,
                        attackerTileEffect: ATTACKER_TILE_EFFECT,
                        targetTileEffect: TARGET_TILE_EFFECT,
                    },
                }),
            );
        });

        it('should emit CombatStarted without tile effects', () => {
            const session = createMockInGameSession();
            combatService.getSession.mockReturnValue(session);
            const payload = {
                sessionId: SESSION_ID,
                attackerId: PLAYER_A_ID,
                targetId: PLAYER_B_ID,
            };

            gateway.handleCombatStarted(payload);

            expect(mockServer.emit).toHaveBeenCalledWith(
                InGameEvents.CombatStarted,
                expect.objectContaining({
                    success: true,
                    data: {
                        attackerId: PLAYER_A_ID,
                        targetId: PLAYER_B_ID,
                        attackerTileEffect: undefined,
                        targetTileEffect: undefined,
                    },
                }),
            );
        });

        it('should not emit when session does not exist', () => {
            combatService.getSession.mockReturnValue(null as unknown as InGameSession);
            const payload = {
                sessionId: SESSION_ID,
                attackerId: PLAYER_A_ID,
                targetId: PLAYER_B_ID,
            };

            gateway.handleCombatStarted(payload);

            expect(combatService.getSession).toHaveBeenCalledWith(SESSION_ID);
            expect(mockServer.to).not.toHaveBeenCalled();
            expect(mockServer.emit).not.toHaveBeenCalled();
        });
    });

    describe('handleCombatTimerRestart', () => {
        it('should log and emit CombatTimerRestart when session exists', () => {
            const session = createMockInGameSession();
            combatService.getSession.mockReturnValue(session);
            const loggerSpy = jest.spyOn(Logger.prototype, 'log').mockImplementation();
            const payload = { sessionId: SESSION_ID };

            gateway.handleCombatTimerRestart(payload);

            expect(combatService.getSession).toHaveBeenCalledWith(SESSION_ID);
            expect(loggerSpy).toHaveBeenCalledWith(`Combat timer restarted for session ${SESSION_ID}`);
            expect(mockServer.to).toHaveBeenCalledWith(IN_GAME_ID);
            expect(mockServer.emit).toHaveBeenCalledWith(InGameEvents.CombatTimerRestart, {
                success: true,
                data: {},
            });
            loggerSpy.mockRestore();
        });

        it('should not emit when session does not exist', () => {
            combatService.getSession.mockReturnValue(null as unknown as InGameSession);
            const payload = { sessionId: SESSION_ID };

            gateway.handleCombatTimerRestart(payload);

            expect(combatService.getSession).toHaveBeenCalledWith(SESSION_ID);
            expect(mockServer.to).not.toHaveBeenCalled();
            expect(mockServer.emit).not.toHaveBeenCalled();
        });
    });

    describe('handleCombatVictory', () => {
        it('should emit CombatVictory when session exists', () => {
            const session = createMockInGameSession();
            combatService.getSession.mockReturnValue(session);
            const payload = {
                sessionId: SESSION_ID,
                playerAId: PLAYER_A_ID,
                playerBId: PLAYER_B_ID,
                winnerId: PLAYER_A_ID,
                abandon: false,
            };

            gateway.handleCombatVictory(payload);

            expect(combatService.getSession).toHaveBeenCalledWith(SESSION_ID);
            expect(mockServer.to).toHaveBeenCalledWith(IN_GAME_ID);
            expect(mockServer.emit).toHaveBeenCalledWith(
                InGameEvents.CombatVictory,
                expect.objectContaining({
                    success: true,
                    data: {
                        playerAId: PLAYER_A_ID,
                        playerBId: PLAYER_B_ID,
                        winnerId: PLAYER_A_ID,
                        abandon: false,
                    },
                }),
            );
        });

        it('should emit CombatVictory with null winner', () => {
            const session = createMockInGameSession();
            combatService.getSession.mockReturnValue(session);
            const payload = {
                sessionId: SESSION_ID,
                playerAId: PLAYER_A_ID,
                playerBId: PLAYER_B_ID,
                winnerId: null,
                abandon: true,
            };

            gateway.handleCombatVictory(payload);

            expect(mockServer.emit).toHaveBeenCalledWith(
                InGameEvents.CombatVictory,
                expect.objectContaining({
                    success: true,
                    data: {
                        playerAId: PLAYER_A_ID,
                        playerBId: PLAYER_B_ID,
                        winnerId: null,
                        abandon: true,
                    },
                }),
            );
        });

        it('should not emit when session does not exist', () => {
            combatService.getSession.mockReturnValue(null as unknown as InGameSession);
            const payload = {
                sessionId: SESSION_ID,
                playerAId: PLAYER_A_ID,
                playerBId: PLAYER_B_ID,
                winnerId: PLAYER_A_ID,
                abandon: false,
            };

            gateway.handleCombatVictory(payload);

            expect(combatService.getSession).toHaveBeenCalledWith(SESSION_ID);
            expect(mockServer.to).not.toHaveBeenCalled();
            expect(mockServer.emit).not.toHaveBeenCalled();
        });
    });

    describe('handleCombatNewRound', () => {
        it('should emit CombatNewRoundStarted when session exists', () => {
            const session = createMockInGameSession();
            combatService.getSession.mockReturnValue(session);
            const payload = { sessionId: SESSION_ID };

            gateway.handleCombatNewRound(payload);

            expect(combatService.getSession).toHaveBeenCalledWith(SESSION_ID);
            expect(mockServer.to).toHaveBeenCalledWith(IN_GAME_ID);
            expect(mockServer.emit).toHaveBeenCalledWith(InGameEvents.CombatNewRoundStarted, {
                success: true,
                data: {},
            });
        });

        it('should not emit when session does not exist', () => {
            combatService.getSession.mockReturnValue(null as unknown as InGameSession);
            const payload = { sessionId: SESSION_ID };

            gateway.handleCombatNewRound(payload);

            expect(combatService.getSession).toHaveBeenCalledWith(SESSION_ID);
            expect(mockServer.to).not.toHaveBeenCalled();
            expect(mockServer.emit).not.toHaveBeenCalled();
        });
    });

    describe('handleCombatPostureSelected', () => {
        it('should emit CombatPostureSelected when session exists', () => {
            const session = createMockInGameSession();
            combatService.getSession.mockReturnValue(session);
            const payload = {
                sessionId: SESSION_ID,
                playerId: PLAYER_A_ID,
                posture: 'offensive' as const,
            };

            gateway.handleCombatPostureSelected(payload);

            expect(combatService.getSession).toHaveBeenCalledWith(SESSION_ID);
            expect(mockServer.to).toHaveBeenCalledWith(IN_GAME_ID);
            expect(mockServer.emit).toHaveBeenCalledWith(
                InGameEvents.CombatPostureSelected,
                expect.objectContaining({
                    success: true,
                    data: {
                        playerId: PLAYER_A_ID,
                        posture: 'offensive',
                    },
                }),
            );
        });

        it('should emit CombatPostureSelected with defensive posture', () => {
            const session = createMockInGameSession();
            combatService.getSession.mockReturnValue(session);
            const payload = {
                sessionId: SESSION_ID,
                playerId: PLAYER_B_ID,
                posture: 'defensive' as const,
            };

            gateway.handleCombatPostureSelected(payload);

            expect(mockServer.emit).toHaveBeenCalledWith(
                InGameEvents.CombatPostureSelected,
                expect.objectContaining({
                    success: true,
                    data: {
                        playerId: PLAYER_B_ID,
                        posture: 'defensive',
                    },
                }),
            );
        });

        it('should not emit when session does not exist', () => {
            combatService.getSession.mockReturnValue(null as unknown as InGameSession);
            const payload = {
                sessionId: SESSION_ID,
                playerId: PLAYER_A_ID,
                posture: 'offensive' as const,
            };

            gateway.handleCombatPostureSelected(payload);

            expect(combatService.getSession).toHaveBeenCalledWith(SESSION_ID);
            expect(mockServer.to).not.toHaveBeenCalled();
            expect(mockServer.emit).not.toHaveBeenCalled();
        });
    });

    describe('handlePlayerCombatResult', () => {
        it('should emit PlayerCombatResult when session exists', () => {
            const session = createMockInGameSession();
            combatService.getSession.mockReturnValue(session);
            const combatResult = createMockCombatResult();
            const payload = {
                sessionId: SESSION_ID,
                ...combatResult,
            };

            gateway.handlePlayerCombatResult(payload);

            expect(combatService.getSession).toHaveBeenCalledWith(SESSION_ID);
            expect(mockServer.to).toHaveBeenCalledWith(IN_GAME_ID);
            expect(mockServer.emit).toHaveBeenCalledWith(
                InGameEvents.PlayerCombatResult,
                expect.objectContaining({
                    success: true,
                    data: combatResult,
                }),
            );
        });

        it('should not emit when session does not exist', () => {
            combatService.getSession.mockReturnValue(null as unknown as InGameSession);
            const combatResult = createMockCombatResult();
            const payload = {
                sessionId: SESSION_ID,
                ...combatResult,
            };

            gateway.handlePlayerCombatResult(payload);

            expect(combatService.getSession).toHaveBeenCalledWith(SESSION_ID);
            expect(mockServer.to).not.toHaveBeenCalled();
            expect(mockServer.emit).not.toHaveBeenCalled();
        });
    });

    describe('handlePlayerHealthChanged', () => {
        it('should emit PlayerHealthChanged', () => {
            const session = createMockInGameSession();
            combatService.getSession.mockReturnValue(session);
            const payload = {
                sessionId: SESSION_ID,
                playerId: PLAYER_A_ID,
                newHealth: NEW_HEALTH,
            };

            gateway.handlePlayerHealthChanged(payload);

            expect(combatService.getSession).toHaveBeenCalledWith(SESSION_ID);
            expect(mockServer.to).toHaveBeenCalledWith(IN_GAME_ID);
            expect(mockServer.emit).toHaveBeenCalledWith(
                InGameEvents.PlayerHealthChanged,
                expect.objectContaining({
                    success: true,
                    data: {
                        playerId: PLAYER_A_ID,
                        newHealth: NEW_HEALTH,
                    },
                }),
            );
        });

        it('should handle null session gracefully', () => {
            combatService.getSession.mockReturnValue(null as unknown as InGameSession);
            const payload = {
                sessionId: SESSION_ID,
                playerId: PLAYER_A_ID,
                newHealth: NEW_HEALTH,
            };

            expect(() => {
                gateway.handlePlayerHealthChanged(payload);
            }).toThrow();

            expect(combatService.getSession).toHaveBeenCalledWith(SESSION_ID);
        });
    });

    describe('handlePlayerCombatCountChanged', () => {
        it('should emit CombatCountChanged', () => {
            const session = createMockInGameSession();
            combatService.getSession.mockReturnValue(session);
            const payload = {
                sessionId: SESSION_ID,
                playerId: PLAYER_A_ID,
                combatCount: COMBAT_COUNT,
            };

            gateway.handlePlayerCombatCountChanged(payload);

            expect(combatService.getSession).toHaveBeenCalledWith(SESSION_ID);
            expect(mockServer.to).toHaveBeenCalledWith(IN_GAME_ID);
            expect(mockServer.emit).toHaveBeenCalledWith(
                InGameEvents.CombatCountChanged,
                expect.objectContaining({
                    success: true,
                    data: {
                        playerId: PLAYER_A_ID,
                        combatCount: COMBAT_COUNT,
                    },
                }),
            );
        });

        it('should handle null session gracefully', () => {
            combatService.getSession.mockReturnValue(null as unknown as InGameSession);
            const payload = {
                sessionId: SESSION_ID,
                playerId: PLAYER_A_ID,
                combatCount: COMBAT_COUNT,
            };

            expect(() => {
                gateway.handlePlayerCombatCountChanged(payload);
            }).toThrow();

            expect(combatService.getSession).toHaveBeenCalledWith(SESSION_ID);
        });
    });

    describe('handlePlayerCombatWinsChanged', () => {
        it('should emit CombatWinsChanged', () => {
            const session = createMockInGameSession();
            combatService.getSession.mockReturnValue(session);
            const payload = {
                sessionId: SESSION_ID,
                playerId: PLAYER_A_ID,
                combatWins: COMBAT_WINS,
            };

            gateway.handlePlayerCombatWinsChanged(payload);

            expect(combatService.getSession).toHaveBeenCalledWith(SESSION_ID);
            expect(mockServer.to).toHaveBeenCalledWith(IN_GAME_ID);
            expect(mockServer.emit).toHaveBeenCalledWith(
                InGameEvents.CombatWinsChanged,
                expect.objectContaining({
                    success: true,
                    data: {
                        playerId: PLAYER_A_ID,
                        combatWins: COMBAT_WINS,
                    },
                }),
            );
        });

        it('should handle null session gracefully', () => {
            combatService.getSession.mockReturnValue(null as unknown as InGameSession);
            const payload = {
                sessionId: SESSION_ID,
                playerId: PLAYER_A_ID,
                combatWins: COMBAT_WINS,
            };

            expect(() => {
                gateway.handlePlayerCombatWinsChanged(payload);
            }).toThrow();

            expect(combatService.getSession).toHaveBeenCalledWith(SESSION_ID);
        });
    });

    describe('handlePlayerCombatLossesChanged', () => {
        it('should emit CombatLossesChanged', () => {
            const session = createMockInGameSession();
            combatService.getSession.mockReturnValue(session);
            const payload = {
                sessionId: SESSION_ID,
                playerId: PLAYER_A_ID,
                combatLosses: COMBAT_LOSSES,
            };

            gateway.handlePlayerCombatLossesChanged(payload);

            expect(combatService.getSession).toHaveBeenCalledWith(SESSION_ID);
            expect(mockServer.to).toHaveBeenCalledWith(IN_GAME_ID);
            expect(mockServer.emit).toHaveBeenCalledWith(
                InGameEvents.CombatLossesChanged,
                expect.objectContaining({
                    success: true,
                    data: {
                        playerId: PLAYER_A_ID,
                        combatLosses: COMBAT_LOSSES,
                    },
                }),
            );
        });

        it('should handle null session gracefully', () => {
            combatService.getSession.mockReturnValue(null as unknown as InGameSession);
            const payload = {
                sessionId: SESSION_ID,
                playerId: PLAYER_A_ID,
                combatLosses: COMBAT_LOSSES,
            };

            expect(() => {
                gateway.handlePlayerCombatLossesChanged(payload);
            }).toThrow();

            expect(combatService.getSession).toHaveBeenCalledWith(SESSION_ID);
        });
    });

    describe('handlePlayerCombatDrawsChanged', () => {
        it('should emit CombatDrawsChanged', () => {
            const session = createMockInGameSession();
            combatService.getSession.mockReturnValue(session);
            const payload = {
                sessionId: SESSION_ID,
                playerId: PLAYER_A_ID,
                combatDraws: COMBAT_DRAWS,
            };

            gateway.handlePlayerCombatDrawsChanged(payload);

            expect(combatService.getSession).toHaveBeenCalledWith(SESSION_ID);
            expect(mockServer.to).toHaveBeenCalledWith(IN_GAME_ID);
            expect(mockServer.emit).toHaveBeenCalledWith(
                InGameEvents.CombatDrawsChanged,
                expect.objectContaining({
                    success: true,
                    data: {
                        playerId: PLAYER_A_ID,
                        combatDraws: COMBAT_DRAWS,
                    },
                }),
            );
        });

        it('should handle null session gracefully', () => {
            combatService.getSession.mockReturnValue(null as unknown as InGameSession);
            const payload = {
                sessionId: SESSION_ID,
                playerId: PLAYER_A_ID,
                combatDraws: COMBAT_DRAWS,
            };

            expect(() => {
                gateway.handlePlayerCombatDrawsChanged(payload);
            }).toThrow();

            expect(combatService.getSession).toHaveBeenCalledWith(SESSION_ID);
        });
    });
});

