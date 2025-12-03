import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CombatService } from '@app/services/combat/combat.service';
import { GameMapService } from '@app/services/game-map/game-map.service';
import { InGameKeyboardEventsService } from '@app/services/in-game-keyboard-events/in-game-keyboard-events.service';
import { InGameService } from '@app/services/in-game/in-game.service';
import { SessionService } from '@app/services/session/session.service';
import { Avatar } from '@common/enums/avatar.enum';
import { Dice } from '@common/enums/dice.enum';
import { GameMode } from '@common/enums/game-mode.enum';
import { MapSize } from '@common/enums/map-size.enum';
import { GameSessionPageComponent } from './game-session-page.component';

const TEST_MAP_SIZE = 10;
const TEST_TIME_REMAINING = 30;
const TEST_PLAYER_SPEED = 4;
const TEST_BASE_HEALTH = 10;
const TEST_MAX_HEALTH = 10;

describe('GameSessionPageComponent', () => {
    let component: GameSessionPageComponent;
    let fixture: ComponentFixture<GameSessionPageComponent>;
    let mockSessionService: jasmine.SpyObj<SessionService>;
    let mockGameMapService: jasmine.SpyObj<GameMapService>;
    let mockInGameService: jasmine.SpyObj<InGameService>;
    let mockKeyboardEventsService: jasmine.SpyObj<InGameKeyboardEventsService>;
    let mockCombatService: jasmine.SpyObj<CombatService>;

    const mockInGameSession = {
        id: 'session-1',
        gameId: 'game-1',
        maxPlayers: 4,
        players: [],
        avatarAssignments: [],
        isRoomLocked: false,
        inGameId: 'in-game-1',
        isGameStarted: true,
        inGamePlayers: {
            'player-1': {
                id: 'player-1',
                name: 'Test Player',
                avatar: Avatar.Avatar1,
                isAdmin: false,
                baseHealth: TEST_BASE_HEALTH,
                healthBonus: 0,
                health: TEST_BASE_HEALTH,
                maxHealth: TEST_MAX_HEALTH,
                baseSpeed: TEST_PLAYER_SPEED,
                speedBonus: 0,
                speed: TEST_PLAYER_SPEED,
                baseAttack: 6,
                attackBonus: 0,
                baseDefense: 5,
                defenseBonus: 0,
                attackDice: Dice.D6,
                defenseDice: Dice.D6,
                x: 5,
                y: 3,
                isInGame: true,
                startPointId: 'start-1',
                actionsRemaining: 2,
                combatCount: 0,
                combatWins: 0,
                combatLosses: 0,
                combatDraws: 0,
                hasCombatBonus: false,
                boatSpeedBonus: 0,
                boatSpeed: 0,
            },
        },
        currentTurn: {
            turnNumber: 1,
            activePlayerId: 'player-1',
            hasUsedAction: false,
        },
        startPoints: [],
        turnOrder: ['player-1'],
        mapSize: MapSize.MEDIUM,
        mode: GameMode.CLASSIC,
    };

    beforeEach(async () => {
        mockSessionService = jasmine.createSpyObj('SessionService', [], {
            gameId: jasmine.createSpy().and.returnValue('test-game-id'),
        });

        mockGameMapService = jasmine.createSpyObj('GameMapService', ['size']);
        mockGameMapService.size.and.returnValue(TEST_MAP_SIZE);

        mockInGameService = jasmine.createSpyObj('InGameService', ['loadInGameSession', 'reset', 'leaveGame']);

        Object.defineProperty(mockInGameService, 'activePlayer', {
            value: { name: 'Active Player' },
            writable: true,
        });
        Object.defineProperty(mockInGameService, 'turnTransitionMessage', {
            value: 'Transition message',
        });
        Object.defineProperty(mockInGameService, 'mapSize', {
            value: jasmine.createSpy().and.returnValue(MapSize.MEDIUM),
        });
        Object.defineProperty(mockInGameService, 'mode', {
            value: jasmine.createSpy().and.returnValue(GameMode.CLASSIC),
        });
        Object.defineProperty(mockInGameService, 'timeRemaining', {
            value: jasmine.createSpy().and.returnValue(TEST_TIME_REMAINING),
        });
        Object.defineProperty(mockInGameService, 'isTransitioning', {
            value: jasmine.createSpy().and.returnValue(false),
        });
        Object.defineProperty(mockInGameService, 'inGameSession', {
            value: jasmine.createSpy().and.returnValue(mockInGameSession),
        });
        Object.defineProperty(mockInGameService, 'reachableTiles', {
            value: jasmine.createSpy().and.returnValue([
                { x: 1, y: 1 },
                { x: 2, y: 2 },
            ]),
        });

        mockKeyboardEventsService = jasmine.createSpyObj('InGameKeyboardEventsService', ['startListening', 'stopListening']);

        mockCombatService = jasmine.createSpyObj('CombatService', ['combatAbandon']);

        await TestBed.configureTestingModule({
            imports: [GameSessionPageComponent],
            providers: [
                provideHttpClient(),
                provideHttpClientTesting(),
                { provide: SessionService, useValue: mockSessionService },
                { provide: InGameService, useValue: mockInGameService },
                { provide: InGameKeyboardEventsService, useValue: mockKeyboardEventsService },
                { provide: CombatService, useValue: mockCombatService },
            ],
        })
            .overrideComponent(GameSessionPageComponent, {
                set: {
                    providers: [{ provide: GameMapService, useValue: mockGameMapService }],
                },
            })
            .compileComponents();

        fixture = TestBed.createComponent(GameSessionPageComponent);
        component = fixture.componentInstance;
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    describe('getters', () => {
        it('should return gameId from sessionService', () => {
            expect(component.gameId).toBe('test-game-id');
            expect(mockSessionService.gameId).toHaveBeenCalled();
        });

        it('should return mapSize from gameMapService', () => {
            expect(component.mapSize).toBe(TEST_MAP_SIZE);
            expect(mockGameMapService.size).toHaveBeenCalled();
        });

        it('should return activePlayer name or default message', () => {
            expect(component.activePlayer).toBe('Active Player');

            Object.defineProperty(mockInGameService, 'activePlayer', { value: null });
            expect(component.activePlayer).toBe('En attente...');
        });

        it('should return transitionMessage from inGameService', () => {
            expect(component.transitionMessage).toBe('Transition message');
        });

        it('should return mapSizeValue from inGameService', () => {
            expect(component.mapSizeValue).toBe(MapSize.MEDIUM);
            expect(mockInGameService.mapSize).toHaveBeenCalled();
        });

        it('should return mode from inGameService', () => {
            expect(component.mode).toBe(GameMode.CLASSIC);
            expect(mockInGameService.mode).toHaveBeenCalled();
        });

        it('should return timeRemaining from inGameService', () => {
            expect(component.timeRemaining).toBe(TEST_TIME_REMAINING);
            expect(mockInGameService.timeRemaining).toHaveBeenCalled();
        });

        it('should return isTransitioning from inGameService', () => {
            expect(component.isTransitioning).toBe(false);
            expect(mockInGameService.isTransitioning).toHaveBeenCalled();
        });
    });

    describe('lifecycle methods', () => {
        it('should initialize services on ngOnInit', () => {
            component.ngOnInit();

            expect(mockInGameService.loadInGameSession).toHaveBeenCalled();
            expect(mockKeyboardEventsService.startListening).toHaveBeenCalled();
        });

        it('should cleanup services on ngOnDestroy', () => {
            component.ngOnDestroy();

            expect(mockKeyboardEventsService.stopListening).toHaveBeenCalled();
            expect(mockInGameService.reset).toHaveBeenCalled();
        });
    });
});
