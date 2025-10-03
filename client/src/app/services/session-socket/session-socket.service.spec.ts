import { TestBed } from '@angular/core/testing';
import { SocketService } from '@app/services/socket/socket.service';
import { SessionEvents } from '@common/constants/session-events';
import { AvatarName } from '@common/enums/avatar-name.enum';
import { DiceType } from '@common/enums/dice-type.enum';
import { MapSize } from '@common/enums/map-size.enum';
import { TileType } from '@common/enums/tile-type.enum';
import { BoardTile } from '@common/interfaces/board-tile.interface';
import { Position } from '@common/interfaces/position.interface';
import { Tile } from '@common/interfaces/tile.interface';
import { GameSession } from '@common/models/game-session.model';
import { Player } from '@common/models/player.model';
import { SessionSocketService } from './session-socket.service';

describe('SessionSocketService', () => {
    let service: SessionSocketService;
    let socketServiceSpy: jasmine.SpyObj<SocketService>;

    const mockPosition: Position = { x: 0, y: 0 };

    const mockPlayer: Player = {
        id: '1',
        name: 'Player 1',
        avatar: AvatarName.Avatar1,
        isAdmin: false,
        maxHp: 100,
        currentHp: 100,
        speed: 3,
        attack: 10,
        defense: 5,
        attackDice: DiceType.D6,
        defenseDice: DiceType.D6,
        remainingMoves: 3,
        remainingActions: 1,
        remainingLives: 3,
        combatsWon: 0,
        isActive: false,
        hasAbandoned: false,
        inventory: [],
        startingPoint: mockPosition,
        currentPosition: mockPosition,
    };

    const mockTile: Tile = {
        type: TileType.Sand,
        item: null,
    };

    const mockBoardTile: BoardTile = {
        baseTile: mockTile,
        occupantId: null,
        isReachable: false,
        isInPath: false,
        isHighlighted: false,
    };

    const mockGameSession: GameSession = {
        mapSize: MapSize.Small,
        board: [[mockBoardTile]],
        players: [mockPlayer],
    };

    beforeEach(() => {
        const socketSpy = jasmine.createSpyObj('SocketService', ['emit', 'onSuccessEvent', 'onErrorEvent']);

        TestBed.configureTestingModule({
            providers: [SessionSocketService, { provide: SocketService, useValue: socketSpy }],
        });

        service = TestBed.inject(SessionSocketService);
        socketServiceSpy = TestBed.inject(SocketService) as jasmine.SpyObj<SocketService>;
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should create session', () => {
        const data = {
            mapSize: MapSize.Small,
            player: mockPlayer,
            map: [],
            itemContainers: [],
        };

        service.createSession(data);

        expect(socketServiceSpy.emit).toHaveBeenCalledWith(SessionEvents.CreateSession, data);
    });

    it('should lock session', () => {
        service.lockSession({});
        expect(socketServiceSpy.emit).toHaveBeenCalledWith(SessionEvents.LockSession, {});
    });

    it('should unlock session', () => {
        service.unlockSession({});
        expect(socketServiceSpy.emit).toHaveBeenCalledWith(SessionEvents.UnlockSession, {});
    });

    it('should handle session created', () => {
        const callback = jasmine.createSpy('callback');
        service.onSessionCreated(callback);
        expect(socketServiceSpy.onSuccessEvent).toHaveBeenCalledWith(SessionEvents.SessionCreated, callback);
    });

    it('should handle session created error', () => {
        const callback = jasmine.createSpy('callback');
        service.onSessionCreatedError(callback);
        expect(socketServiceSpy.onErrorEvent).toHaveBeenCalledWith(SessionEvents.SessionCreated, callback);
    });

    it('should join avatar selection', () => {
        const data = { sessionId: '1', player: mockPlayer };
        service.joinAvatarSelection(data);
        expect(socketServiceSpy.emit).toHaveBeenCalledWith(SessionEvents.JoinAvatarSelection, data);
    });

    it('should handle avatar selection joined', () => {
        const callback = jasmine.createSpy('callback');
        service.onAvatarSelectionJoined(callback);
        expect(socketServiceSpy.onSuccessEvent).toHaveBeenCalledWith(SessionEvents.AvatarSelectionJoined, callback);
    });

    it('should handle avatar selection join error', () => {
        const callback = jasmine.createSpy('callback');
        service.onAvatarSelectionJoinError(callback);
        expect(socketServiceSpy.onErrorEvent).toHaveBeenCalledWith(SessionEvents.AvatarSelectionJoined, callback);
    });

    it('should join session', () => {
        const data = { sessionId: '1', player: mockPlayer };
        service.joinSession(data);
        expect(socketServiceSpy.emit).toHaveBeenCalledWith(SessionEvents.JoinSession, data);
    });

    it('should handle session joined', () => {
        const callback = jasmine.createSpy('callback');
        service.onSessionJoined(callback);
        expect(socketServiceSpy.onSuccessEvent).toHaveBeenCalledWith(SessionEvents.SessionJoined, callback);
    });

    it('should handle session join error', () => {
        const callback = jasmine.createSpy('callback');
        service.onSessionJoinError(callback);
        expect(socketServiceSpy.onErrorEvent).toHaveBeenCalledWith(SessionEvents.SessionJoined, callback);
    });

    it('should update avatars assignment', () => {
        const data = {
            sessionId: '1',
            avatar: AvatarName.Avatar1,
        };
        service.updateAvatarsAssignment(data);
        expect(socketServiceSpy.emit).toHaveBeenCalledWith(SessionEvents.UpdateAvatarAssignments, data);
    });

    it('should start game session', () => {
        const data = { gameSession: mockGameSession };
        service.startGameSession(data);
        expect(socketServiceSpy.emit).toHaveBeenCalledWith(SessionEvents.StartGameSession, data);
    });

    it('should handle game session started', () => {
        const callback = jasmine.createSpy('callback');
        service.onGameSessionStarted(callback);
        expect(socketServiceSpy.onSuccessEvent).toHaveBeenCalledWith(SessionEvents.GameSessionStarted, callback);
    });

    it('should handle avatar assignments updated', () => {
        const callback = jasmine.createSpy('callback');
        service.onAvatarAssignmentsUpdated(callback);
        expect(socketServiceSpy.onSuccessEvent).toHaveBeenCalledWith(SessionEvents.AvatarAssignmentsUpdated, callback);
    });

    it('should handle session players updated', () => {
        const callback = jasmine.createSpy('callback');
        service.onSessionPlayersUpdated(callback);
        expect(socketServiceSpy.onSuccessEvent).toHaveBeenCalledWith(SessionEvents.SessionPlayersUpdated, callback);
    });
});
