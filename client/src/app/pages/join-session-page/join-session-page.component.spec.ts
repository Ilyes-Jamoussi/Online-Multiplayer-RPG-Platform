import { signal, Signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SessionPreviewDto } from '@app/dto/session-preview-dto';
import { PlayerService } from '@app/services/player/player.service';
import { SessionService } from '@app/services/session/session.service';
import { GameMode } from '@common/enums/game-mode.enum';
import { MapSize } from '@common/enums/map-size.enum';
import { JoinSessionPageComponent } from './join-session-page.component';

// Test constants
const TEST_SESSION_ID_1 = 'test-session-id-1';
const TEST_SESSION_ID_2 = 'test-session-id-2';
const TEST_CURRENT_PLAYERS_2 = 2;
const TEST_CURRENT_PLAYERS_4 = 4;
const TEST_MAX_PLAYERS_4 = 4;
const TEST_MAX_PLAYERS_6 = 6;
const TEST_PLAYER_COUNT_ZERO = 0;
const TEST_GAME_NAME_1 = 'Test Game 1';
const TEST_GAME_NAME_2 = 'Test Game 2';
const TEST_GAME_DESCRIPTION_1 = 'Test game description 1';
const TEST_GAME_DESCRIPTION_2 = 'Test game description 2';

type MockPlayerService = {
    setAsGuest: jasmine.Spy;
};

type MockSessionService = {
    availableSessions: Signal<SessionPreviewDto[]>;
    loadAvailableSessions: jasmine.Spy;
    joinAvatarSelection: jasmine.Spy;
};

describe('JoinSessionPageComponent', () => {
    let component: JoinSessionPageComponent;
    let fixture: ComponentFixture<JoinSessionPageComponent>;
    let mockPlayerService: MockPlayerService;
    let mockSessionService: MockSessionService;
    let availableSessionsSignal: ReturnType<typeof signal<SessionPreviewDto[]>>;

    beforeEach(async () => {
        const mockSessions: SessionPreviewDto[] = [
            {
                id: TEST_SESSION_ID_1,
                currentPlayers: TEST_CURRENT_PLAYERS_2,
                maxPlayers: TEST_MAX_PLAYERS_4,
                gameName: TEST_GAME_NAME_1,
                gameDescription: TEST_GAME_DESCRIPTION_1,
                mapSize: MapSize.SMALL,
                gameMode: GameMode.CLASSIC,
            },
            {
                id: TEST_SESSION_ID_2,
                currentPlayers: TEST_CURRENT_PLAYERS_4,
                maxPlayers: TEST_MAX_PLAYERS_6,
                gameName: TEST_GAME_NAME_2,
                gameDescription: TEST_GAME_DESCRIPTION_2,
                mapSize: MapSize.MEDIUM,
                gameMode: GameMode.CTF,
            },
        ];

        availableSessionsSignal = signal<SessionPreviewDto[]>(mockSessions);

        mockPlayerService = {
            setAsGuest: jasmine.createSpy('setAsGuest'),
        };

        mockSessionService = {
            availableSessions: availableSessionsSignal.asReadonly(),
            loadAvailableSessions: jasmine.createSpy('loadAvailableSessions'),
            joinAvatarSelection: jasmine.createSpy('joinAvatarSelection'),
        };

        await TestBed.configureTestingModule({
            imports: [JoinSessionPageComponent],
            providers: [
                { provide: PlayerService, useValue: mockPlayerService },
                { provide: SessionService, useValue: mockSessionService },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(JoinSessionPageComponent);
        component = fixture.componentInstance;
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    describe('ngOnInit', () => {
        it('should call playerService.setAsGuest', () => {
            component.ngOnInit();

            expect(mockPlayerService.setAsGuest).toHaveBeenCalledTimes(1);
        });

        it('should call sessionService.loadAvailableSessions', () => {
            component.ngOnInit();

            expect(mockSessionService.loadAvailableSessions).toHaveBeenCalledTimes(1);
        });
    });

    describe('availableSessions', () => {
        it('should return availableSessions signal from sessionService', () => {
            fixture.detectChanges();

            const result = component.availableSessions;

            expect(result).toBe(availableSessionsSignal.asReadonly());
            expect(result().length).toBe(2);
            expect(result()[0].id).toBe(TEST_SESSION_ID_1);
            expect(result()[0].currentPlayers).toBe(TEST_CURRENT_PLAYERS_2);
            expect(result()[0].maxPlayers).toBe(TEST_MAX_PLAYERS_4);
            expect(result()[1].id).toBe(TEST_SESSION_ID_2);
            expect(result()[1].currentPlayers).toBe(TEST_CURRENT_PLAYERS_4);
            expect(result()[1].maxPlayers).toBe(TEST_MAX_PLAYERS_6);
        });

        it('should return empty array when no sessions are available', () => {
            availableSessionsSignal.set([]);
            fixture.detectChanges();

            const result = component.availableSessions();

            expect(result).toEqual([]);
            expect(result.length).toBe(TEST_PLAYER_COUNT_ZERO);
        });

        it('should reflect changes in sessionService availableSessions', () => {
            fixture.detectChanges();

            const initialSessions = component.availableSessions();
            expect(initialSessions.length).toBe(2);

            const newSession: SessionPreviewDto = {
                id: 'new-session-id',
                currentPlayers: 1,
                maxPlayers: 4,
                gameName: 'New Game',
                gameDescription: 'New game description',
                mapSize: MapSize.SMALL,
                gameMode: GameMode.CLASSIC,
            };
            availableSessionsSignal.set([newSession]);
            fixture.detectChanges();

            const updatedSessions = component.availableSessions();
            expect(updatedSessions.length).toBe(1);
            expect(updatedSessions[0].id).toBe('new-session-id');
        });
    });

    describe('onJoinSession', () => {
        it('should call sessionService.joinAvatarSelection with session id', () => {
            fixture.detectChanges();

            component.onJoinSession(TEST_SESSION_ID_1);

            expect(mockSessionService.joinAvatarSelection).toHaveBeenCalledTimes(1);
            expect(mockSessionService.joinAvatarSelection).toHaveBeenCalledWith(TEST_SESSION_ID_1);
        });

        it('should call sessionService.joinAvatarSelection with different session id', () => {
            fixture.detectChanges();

            component.onJoinSession(TEST_SESSION_ID_2);

            expect(mockSessionService.joinAvatarSelection).toHaveBeenCalledTimes(1);
            expect(mockSessionService.joinAvatarSelection).toHaveBeenCalledWith(TEST_SESSION_ID_2);
        });
    });
});

