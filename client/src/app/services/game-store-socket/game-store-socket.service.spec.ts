import { TestBed } from '@angular/core/testing';
import { GamePreviewDto } from '@app/api/model/models';
import { SocketService } from '@app/services/socket/socket.service';
import { GameStoreEvents } from '@common/constants/game-store-events';
import { GameMode } from '@common/enums/game-mode.enum';
import { MapSize } from '@common/enums/map-size.enum';
import { GameStoreSocketService } from './game-store-socket.service';

describe('GameStoreSocketService', () => {
    let service: GameStoreSocketService;
    let socketServiceSpy: jasmine.SpyObj<SocketService>;

    const mockGame: GamePreviewDto = {
        id: '1',
        name: 'Test Game',
        description: 'Test Description',
        size: MapSize.Small,
        mode: GameMode.Classic,
        lastModified: new Date(),
        visibility: true,
    };

    beforeEach(() => {
        const socketSpy = jasmine.createSpyObj('SocketService', ['onSuccessEvent']);

        TestBed.configureTestingModule({
            providers: [GameStoreSocketService, { provide: SocketService, useValue: socketSpy }],
        });

        service = TestBed.inject(GameStoreSocketService);
        socketServiceSpy = TestBed.inject(SocketService) as jasmine.SpyObj<SocketService>;
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should handle game created event', () => {
        const callback = jasmine.createSpy('callback');

        service.onGameCreated(callback);

        expect(socketServiceSpy.onSuccessEvent).toHaveBeenCalledWith(GameStoreEvents.GameCreated, jasmine.any(Function));

        // Simulate the callback being called by the socket service
        const [[, socketCallback]] = socketServiceSpy.onSuccessEvent.calls.allArgs();
        socketCallback(mockGame);

        expect(callback).toHaveBeenCalledWith(mockGame);
    });

    it('should handle game updated event', () => {
        const callback = jasmine.createSpy('callback');

        service.onGameUpdated(callback);

        expect(socketServiceSpy.onSuccessEvent).toHaveBeenCalledWith(GameStoreEvents.GameUpdated, jasmine.any(Function));

        // Simulate the callback being called by the socket service
        const [[, socketCallback]] = socketServiceSpy.onSuccessEvent.calls.allArgs();
        socketCallback(mockGame);

        expect(callback).toHaveBeenCalledWith(mockGame);
    });

    it('should handle game deleted event', () => {
        const callback = jasmine.createSpy('callback');
        const deleteData = { id: '1' };

        service.onGameDeleted(callback);

        expect(socketServiceSpy.onSuccessEvent).toHaveBeenCalledWith(GameStoreEvents.GameDeleted, jasmine.any(Function));

        // Simulate the callback being called by the socket service
        const [[, socketCallback]] = socketServiceSpy.onSuccessEvent.calls.allArgs();
        socketCallback(deleteData);

        expect(callback).toHaveBeenCalledWith(deleteData);
    });

    it('should handle game visibility toggled event', () => {
        const callback = jasmine.createSpy('callback');
        const visibilityData = { id: '1' };

        service.onGameVisibilityToggled(callback);

        expect(socketServiceSpy.onSuccessEvent).toHaveBeenCalledWith(GameStoreEvents.GameVisibilityToggled, jasmine.any(Function));

        // Simulate the callback being called by the socket service
        const [[, socketCallback]] = socketServiceSpy.onSuccessEvent.calls.allArgs();
        socketCallback(visibilityData);

        expect(callback).toHaveBeenCalledWith(visibilityData);
    });
});
