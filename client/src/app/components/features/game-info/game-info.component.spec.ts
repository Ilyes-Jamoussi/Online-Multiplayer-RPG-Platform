import { signal, Signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SessionService } from '@app/services/session/session.service';
import { Avatar } from '@common/enums/avatar.enum';
import { Dice } from '@common/enums/dice.enum';
import { MapSize } from '@common/enums/map-size.enum';
import { Player } from '@common/interfaces/player.interface';
import { GameInfoComponent } from './game-info.component';

// Test constants
const TEST_PLAYER_ID_1 = 'test-player-id-1';
const TEST_PLAYER_ID_2 = 'test-player-id-2';
const TEST_PLAYER_ID_3 = 'test-player-id-3';
const TEST_PLAYER_NAME_1 = 'Test Player 1';
const TEST_PLAYER_NAME_2 = 'Test Player 2';
const TEST_PLAYER_NAME_3 = 'Test Player 3';
const TEST_ACTIVE_PLAYER = 'Active Player Name';
const TEST_ACTIVE_PLAYER_EMPTY = '';
const TEST_BASE_HEALTH = 4;
const TEST_HEALTH_BONUS = 0;
const TEST_HEALTH = 4;
const TEST_MAX_HEALTH = 4;
const TEST_BASE_SPEED = 3;
const TEST_SPEED_BONUS = 0;
const TEST_SPEED = 3;
const TEST_BASE_ATTACK = 4;
const TEST_ATTACK_BONUS = 0;
const TEST_ATTACK = 4;
const TEST_BASE_DEFENSE = 4;
const TEST_DEFENSE_BONUS = 0;
const TEST_DEFENSE = 4;
const TEST_X_POSITION = 0;
const TEST_Y_POSITION = 0;
const TEST_START_POINT_ID = '';
const TEST_ACTIONS_REMAINING = 1;
const TEST_COMBAT_COUNT = 0;
const TEST_COMBAT_WINS = 0;
const TEST_COMBAT_LOSSES = 0;
const TEST_COMBAT_DRAWS = 0;
const TEST_IS_ADMIN = true;
const TEST_IS_NOT_ADMIN = false;
const TEST_IS_IN_GAME = false;
const TEST_PLAYER_COUNT_ZERO = 0;
const TEST_PLAYER_COUNT_ONE = 1;
const TEST_PLAYER_COUNT_TWO = 2;
const TEST_PLAYER_COUNT_THREE = 3;
const MAP_SIZE_LABEL_SMALL = 'Petite';
const MAP_SIZE_LABEL_MEDIUM = 'Moyenne';
const MAP_SIZE_LABEL_LARGE = 'Grande';
const MAP_SIZE_LABEL_UNKNOWN = 'Inconnue';

type MockSessionService = {
    players: Signal<Player[]>;
};

const createMockPlayer = (id: string, name: string, isAdmin: boolean = TEST_IS_NOT_ADMIN): Player => ({
    id,
    name,
    avatar: Avatar.Avatar1,
    isAdmin,
    baseHealth: TEST_BASE_HEALTH,
    healthBonus: TEST_HEALTH_BONUS,
    health: TEST_HEALTH,
    maxHealth: TEST_MAX_HEALTH,
    baseSpeed: TEST_BASE_SPEED,
    speedBonus: TEST_SPEED_BONUS,
    speed: TEST_SPEED,
    baseAttack: TEST_BASE_ATTACK,
    attackBonus: TEST_ATTACK_BONUS,
    attack: TEST_ATTACK,
    baseDefense: TEST_BASE_DEFENSE,
    defenseBonus: TEST_DEFENSE_BONUS,
    defense: TEST_DEFENSE,
    attackDice: Dice.D6,
    defenseDice: Dice.D6,
    x: TEST_X_POSITION,
    y: TEST_Y_POSITION,
    isInGame: TEST_IS_IN_GAME,
    startPointId: TEST_START_POINT_ID,
    actionsRemaining: TEST_ACTIONS_REMAINING,
    combatCount: TEST_COMBAT_COUNT,
    combatWins: TEST_COMBAT_WINS,
    combatLosses: TEST_COMBAT_LOSSES,
    combatDraws: TEST_COMBAT_DRAWS,
});

describe('GameInfoComponent', () => {
    let component: GameInfoComponent;
    let fixture: ComponentFixture<GameInfoComponent>;
    let mockSessionService: MockSessionService;
    let playersSignal: ReturnType<typeof signal<Player[]>>;

    beforeEach(async () => {
        const mockPlayer1 = createMockPlayer(TEST_PLAYER_ID_1, TEST_PLAYER_NAME_1, TEST_IS_ADMIN);
        const mockPlayer2 = createMockPlayer(TEST_PLAYER_ID_2, TEST_PLAYER_NAME_2);
        const mockPlayers = [mockPlayer1, mockPlayer2];

        playersSignal = signal<Player[]>(mockPlayers);

        mockSessionService = {
            players: playersSignal.asReadonly(),
        };

        await TestBed.configureTestingModule({
            imports: [GameInfoComponent],
            providers: [{ provide: SessionService, useValue: mockSessionService }],
        }).compileComponents();

        fixture = TestBed.createComponent(GameInfoComponent);
        component = fixture.componentInstance;
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    describe('Inputs', () => {
        it('should have default mapSize value of MEDIUM', () => {
            expect(component.mapSize).toBe(MapSize.MEDIUM);
        });

        it('should have default activePlayer value of empty string', () => {
            expect(component.activePlayer).toBe(TEST_ACTIVE_PLAYER_EMPTY);
        });

        it('should accept mapSize input', () => {
            component.mapSize = MapSize.SMALL;
            fixture.detectChanges();

            expect(component.mapSize).toBe(MapSize.SMALL);
        });

        it('should accept activePlayer input', () => {
            component.activePlayer = TEST_ACTIVE_PLAYER;
            fixture.detectChanges();

            expect(component.activePlayer).toBe(TEST_ACTIVE_PLAYER);
        });
    });

    describe('players', () => {
        it('should return players from sessionService', () => {
            fixture.detectChanges();

            const result = component.players;

            expect(result.length).toBe(TEST_PLAYER_COUNT_TWO);
            expect(result[0].id).toBe(TEST_PLAYER_ID_1);
            expect(result[0].name).toBe(TEST_PLAYER_NAME_1);
            expect(result[1].id).toBe(TEST_PLAYER_ID_2);
            expect(result[1].name).toBe(TEST_PLAYER_NAME_2);
        });

        it('should return empty array when sessionService has no players', () => {
            playersSignal.set([]);
            fixture.detectChanges();

            const result = component.players;

            expect(result).toEqual([]);
            expect(result.length).toBe(TEST_PLAYER_COUNT_ZERO);
        });

        it('should reflect changes in sessionService players', () => {
            fixture.detectChanges();

            const initialPlayers = component.players;
            expect(initialPlayers.length).toBe(TEST_PLAYER_COUNT_TWO);

            const newPlayer = createMockPlayer(TEST_PLAYER_ID_3, TEST_PLAYER_NAME_3);
            playersSignal.set([newPlayer]);
            fixture.detectChanges();

            const updatedPlayers = component.players;
            expect(updatedPlayers.length).toBe(TEST_PLAYER_COUNT_ONE);
            expect(updatedPlayers[0].id).toBe(TEST_PLAYER_ID_3);
        });
    });

    describe('playerCount', () => {
        it('should return correct count when there are players', () => {
            fixture.detectChanges();

            const result = component.playerCount;

            expect(result).toBe(TEST_PLAYER_COUNT_TWO);
        });

        it('should return zero when there are no players', () => {
            playersSignal.set([]);
            fixture.detectChanges();

            const result = component.playerCount;

            expect(result).toBe(TEST_PLAYER_COUNT_ZERO);
        });

        it('should return correct count when players change', () => {
            fixture.detectChanges();

            expect(component.playerCount).toBe(TEST_PLAYER_COUNT_TWO);

            const mockPlayer1 = createMockPlayer(TEST_PLAYER_ID_1, TEST_PLAYER_NAME_1);
            const mockPlayer2 = createMockPlayer(TEST_PLAYER_ID_2, TEST_PLAYER_NAME_2);
            const mockPlayer3 = createMockPlayer(TEST_PLAYER_ID_3, TEST_PLAYER_NAME_3);
            playersSignal.set([mockPlayer1, mockPlayer2, mockPlayer3]);
            fixture.detectChanges();

            expect(component.playerCount).toBe(TEST_PLAYER_COUNT_THREE);
        });
    });

    describe('mapSizeLabel', () => {
        it('should return "Petite" for SMALL map size', () => {
            component.mapSize = MapSize.SMALL;
            fixture.detectChanges();

            const result = component.mapSizeLabel;

            expect(result).toBe(MAP_SIZE_LABEL_SMALL);
        });

        it('should return "Moyenne" for MEDIUM map size', () => {
            component.mapSize = MapSize.MEDIUM;
            fixture.detectChanges();

            const result = component.mapSizeLabel;

            expect(result).toBe(MAP_SIZE_LABEL_MEDIUM);
        });

        it('should return "Grande" for LARGE map size', () => {
            component.mapSize = MapSize.LARGE;
            fixture.detectChanges();

            const result = component.mapSizeLabel;

            expect(result).toBe(MAP_SIZE_LABEL_LARGE);
        });

        it('should return "Inconnue" for unknown map size', () => {
            component.mapSize = -1 as MapSize;
            fixture.detectChanges();

            const result = component.mapSizeLabel;

            expect(result).toBe(MAP_SIZE_LABEL_UNKNOWN);
        });
    });
});

