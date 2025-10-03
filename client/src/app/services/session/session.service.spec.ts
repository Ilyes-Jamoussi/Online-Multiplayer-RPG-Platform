import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { DEFAULT_PLAYER } from '@app/constants/player.constants';
import { ROUTES } from '@app/constants/routes.constants';
import { DEFAULT_SESSION } from '@app/constants/session.constants';
import { GameHttpService } from '@app/services/game-http/game-http.service';
import { GameSessionService } from '@app/services/game-session/game-session.service';
import { SessionSocketService } from '@app/services/session-socket/session-socket.service';
import { SessionService } from '@app/services/session/session.service';
import { AvatarName } from '@common/enums/avatar-name.enum';
import { MapSize } from '@common/enums/map-size.enum';
import { GameSession } from '@common/models/game-session.model';
import { Player } from '@common/models/player.model';
import { Session } from '@common/models/session.model';

describe('SessionService', () => {
    let service: SessionService;
    let gameSessionServiceSpy: jasmine.SpyObj<GameSessionService>;
    let sessionSocketServiceSpy: jasmine.SpyObj<SessionSocketService>;
    let gameHttpServiceSpy: jasmine.SpyObj<GameHttpService>;
    let routerSpy: jasmine.SpyObj<Router>;

    const mockPlayer: Player = {
        ...DEFAULT_PLAYER,
        id: '1',
        name: 'Player 1',
        avatar: AvatarName.Avatar1,
        isAdmin: true,
    };

    const mockSession: Session = {
        ...DEFAULT_SESSION,
        id: '',
        players: [],
        avatarAssignments: [],
        isRoomLocked: false,
        gameInitializationData: {
            map: [],
            itemContainers: [],
            mapSize: MapSize.Small,
        },
    };

    const mockGameSession: GameSession = {
        mapSize: MapSize.Small,
        board: [],
        players: [mockPlayer],
    };

    beforeEach(() => {
        gameSessionServiceSpy = jasmine.createSpyObj('GameSessionService', ['initializeGame', 'gameSession', 'setGameSession']);
        sessionSocketServiceSpy = jasmine.createSpyObj('SessionSocketService', [
            'onSessionPlayersUpdated',
            'onAvatarAssignmentsUpdated',
            'onAvatarSelectionJoined',
            'onGameSessionStarted',
            'startGameSession',
        ]);
        gameHttpServiceSpy = jasmine.createSpyObj('GameHttpService', ['getAvailableMaps']);
        routerSpy = jasmine.createSpyObj('Router', ['navigate']);

        gameSessionServiceSpy.gameSession.and.returnValue(mockGameSession);

        TestBed.configureTestingModule({
            providers: [
                SessionService,
                { provide: GameSessionService, useValue: gameSessionServiceSpy },
                { provide: SessionSocketService, useValue: sessionSocketServiceSpy },
                { provide: GameHttpService, useValue: gameHttpServiceSpy },
                { provide: Router, useValue: routerSpy },
            ],
        });

        service = TestBed.inject(SessionService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should initialize with default session', () => {
        expect(service.session()).toEqual(mockSession);
    });

    it('should update session', () => {
        const partialUpdate = { id: 'new-id' };
        service.updateSession(partialUpdate);
        expect(service.session().id).toBe('new-id');
    });

    it('should reset session to default', () => {
        service.updateSession({ id: 'test-id' });
        service.resetSession();
        expect(service.session()).toEqual(DEFAULT_SESSION);
    });

    it('should check if room is locked', () => {
        service.updateSession({ ...mockSession, isRoomLocked: true });
        expect(service.isRoomLocked()).toBe(true);
    });

    it('should check if can start game', () => {
        service.updateSession({
            ...mockSession,
            isRoomLocked: true,
            players: [mockPlayer, { ...mockPlayer, id: '2' }],
        });
        expect(service.canStartGame()).toBe(true);
    });

    it('should start game', () => {
        service.startGame();
        expect(gameSessionServiceSpy.initializeGame).toHaveBeenCalled();
        expect(sessionSocketServiceSpy.startGameSession).toHaveBeenCalledWith({ gameSession: mockGameSession });
    });

    it('should handle game start', () => {
        service['handleGameStart']({ gameSession: mockGameSession });
        expect(gameSessionServiceSpy.setGameSession).toHaveBeenCalledWith(mockGameSession);
        expect(routerSpy.navigate).toHaveBeenCalledWith([ROUTES.gameSession]);
    });

    it('should initialize socket listeners', () => {
        expect(sessionSocketServiceSpy.onSessionPlayersUpdated).toHaveBeenCalled();
        expect(sessionSocketServiceSpy.onAvatarAssignmentsUpdated).toHaveBeenCalled();
        expect(sessionSocketServiceSpy.onAvatarSelectionJoined).toHaveBeenCalled();
        expect(sessionSocketServiceSpy.onGameSessionStarted).toHaveBeenCalled();
    });
});
