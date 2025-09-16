import { TestBed } from '@angular/core/testing';
import { SocketService } from '@app/services/socket/socket.service';
import { GameStoreEvents } from '@common/constants/game-store-events';
import { GameStoreSocketService } from './game-store-socket.service';

describe('GameStoreSocketService', () => {
    let service: GameStoreSocketService;
    let socketServiceSpy: jasmine.SpyObj<SocketService>;

    beforeEach(() => {
        const socketSpy = jasmine.createSpyObj('SocketService', ['onSuccessEvent']);

        TestBed.configureTestingModule({
            providers: [{ provide: SocketService, useValue: socketSpy }],
        });

        service = TestBed.inject(GameStoreSocketService);
        socketServiceSpy = TestBed.inject(SocketService) as jasmine.SpyObj<SocketService>;
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    describe('onGameCreated', () => {
        it('should call socket.onSuccessEvent with GameCreated event', () => {
            const callback = jasmine.createSpy('callback');

            service.onGameCreated(callback);

            expect(socketServiceSpy.onSuccessEvent).toHaveBeenCalledWith(GameStoreEvents.GameCreated, callback);
        });
    });

    describe('onGameUpdated', () => {
        it('should call socket.onSuccessEvent with GameUpdated event', () => {
            const callback = jasmine.createSpy('callback');

            service.onGameUpdated(callback);

            expect(socketServiceSpy.onSuccessEvent).toHaveBeenCalledWith(GameStoreEvents.GameUpdated, callback);
        });
    });

    describe('onGameDeleted', () => {
        it('should call socket.onSuccessEvent with GameDeleted event', () => {
            const callback = jasmine.createSpy('callback');

            service.onGameDeleted(callback);

            expect(socketServiceSpy.onSuccessEvent).toHaveBeenCalledWith(GameStoreEvents.GameDeleted, callback);
        });
    });

    describe('onGameVisibilityToggled', () => {
        it('should call socket.onSuccessEvent with GameVisibilityToggled event', () => {
            const callback = jasmine.createSpy('callback');

            service.onGameVisibilityToggled(callback);

            expect(socketServiceSpy.onSuccessEvent).toHaveBeenCalledWith(GameStoreEvents.GameVisibilityToggled, callback);
        });
    });
});
