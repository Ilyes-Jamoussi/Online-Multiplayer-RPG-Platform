import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AssetsService } from '@app/services/assets/assets.service';
import { InGameService } from '@app/services/in-game/in-game.service';
import { PlayerService } from '@app/services/player/player.service';
import { TeamColor } from '@app/enums/team-color.enum';
import { Avatar } from '@common/enums/avatar.enum';
import { Dice } from '@common/enums/dice.enum';
import { FlagData } from '@common/interfaces/flag-data.interface';
import { Player } from '@common/interfaces/player.interface';
import { PlayersListComponent } from './players-list.component';

const TEST_COMBAT_WINS_PLAYER1 = 3;
const TEST_HEALTH_PERCENTAGE_PLAYER1 = 75;
const TEST_HEALTH_PERCENTAGE_PLAYER2 = 50;

describe('PlayersListComponent', () => {
    let component: PlayersListComponent;
    let fixture: ComponentFixture<PlayersListComponent>;
    let mockInGameService: jasmine.SpyObj<InGameService>;
    let mockPlayerService: jasmine.SpyObj<PlayerService>;
    let mockAssetsService: jasmine.SpyObj<AssetsService>;

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
            baseDefense: 4,
            defenseBonus: 0,
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
            hasCombatBonus: false,
            boatSpeedBonus: 0,
            boatSpeed: 0,
        },
    };

    const mockTurnOrder = ['player1', 'player2'];

    beforeEach(async () => {
        mockInGameService = jasmine.createSpyObj('InGameService', [], {
            turnOrder: signal(mockTurnOrder),
            inGamePlayers: signal(mockPlayers),
            activePlayer: mockPlayers.player1,
            flagData: signal(undefined),
        });

        mockPlayerService = jasmine.createSpyObj('PlayerService', ['getTeamColor'], {
            id: signal('player1'),
        });

        mockAssetsService = jasmine.createSpyObj('AssetsService', ['getAvatarStaticImage']);

        await TestBed.configureTestingModule({
            imports: [PlayersListComponent],
            providers: [
                { provide: InGameService, useValue: mockInGameService },
                { provide: PlayerService, useValue: mockPlayerService },
                { provide: AssetsService, useValue: mockAssetsService },
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

    describe('getPlayerAvatar', () => {
        const mockAvatarPath = './assets/images/avatars/static/avatar1.png';
        const mockEmptyString = '';

        it('should return avatar path from assets service', () => {
            mockAssetsService.getAvatarStaticImage.and.returnValue(mockAvatarPath);
            const result = component.getPlayerAvatar(Avatar.Avatar1);
            expect(result).toBe(mockAvatarPath);
            expect(mockAssetsService.getAvatarStaticImage).toHaveBeenCalledWith(Avatar.Avatar1);
        });

        it('should return empty string when avatar is null', () => {
            mockAssetsService.getAvatarStaticImage.and.returnValue(mockEmptyString);
            const result = component.getPlayerAvatar(null);
            expect(result).toBe(mockEmptyString);
            expect(mockAssetsService.getAvatarStaticImage).toHaveBeenCalledWith(null);
        });
    });

    describe('getTeamNumber', () => {
        const mockTeamNumber = 1;

        it('should return teamNumber when player has teamNumber', () => {
            const playerWithTeam = { ...mockPlayers.player1, teamNumber: mockTeamNumber };
            const result = component.getTeamNumber(playerWithTeam);
            expect(result).toBe(mockTeamNumber);
        });

        it('should return undefined when player has no teamNumber', () => {
            const result = component.getTeamNumber(mockPlayers.player1);
            expect(result).toBeUndefined();
        });
    });

    describe('getTeamColor', () => {
        const mockTeamNumber = 2;

        it('should return team color from player service', () => {
            mockPlayerService.getTeamColor.and.returnValue(TeamColor.EnemyTeam);
            const result = component.getTeamColor(mockTeamNumber);
            expect(result).toBe(TeamColor.EnemyTeam);
            expect(mockPlayerService.getTeamColor).toHaveBeenCalledWith(mockTeamNumber);
        });

        it('should return undefined when teamNumber is undefined', () => {
            mockPlayerService.getTeamColor.and.returnValue(undefined);
            const result = component.getTeamColor(undefined);
            expect(result).toBeUndefined();
            expect(mockPlayerService.getTeamColor).toHaveBeenCalledWith(undefined);
        });
    });

    describe('hasFlag', () => {
        const mockPlayerId = 'player1';
        const mockOtherPlayerId = 'player2';

        it('should return false when flagData is undefined', () => {
            Object.defineProperty(mockInGameService, 'flagData', {
                value: signal(undefined),
                configurable: true,
            });
            const result = component.hasFlag(mockPlayers.player1);
            expect(result).toBe(false);
        });

        it('should return false when flagData holderPlayerId is null', () => {
            const flagData: FlagData = {
                position: { x: 0, y: 0 },
                holderPlayerId: null,
            };
            Object.defineProperty(mockInGameService, 'flagData', {
                value: signal(flagData),
                configurable: true,
            });
            const result = component.hasFlag(mockPlayers.player1);
            expect(result).toBe(false);
        });

        it('should return false when flag holder is different player', () => {
            const flagData: FlagData = {
                position: { x: 0, y: 0 },
                holderPlayerId: mockOtherPlayerId,
            };
            Object.defineProperty(mockInGameService, 'flagData', {
                value: signal(flagData),
                configurable: true,
            });
            const result = component.hasFlag(mockPlayers.player1);
            expect(result).toBe(false);
        });

        it('should return true when flag holder matches player', () => {
            const flagData: FlagData = {
                position: { x: 0, y: 0 },
                holderPlayerId: mockPlayerId,
            };
            Object.defineProperty(mockInGameService, 'flagData', {
                value: signal(flagData),
                configurable: true,
            });
            const result = component.hasFlag(mockPlayers.player1);
            expect(result).toBe(true);
        });
    });
});
