import { TestBed } from '@angular/core/testing';
import { GameStoreEvents } from '@common/constants/game-store-events';
import { SocketResponse } from '@common/types/socket-response.type';
import { of } from 'rxjs';
import { Socket } from 'socket.io-client';
import { SocketService } from './socket.service';

describe('SocketService', () => {
    let service: SocketService;
    let mockSocket: jasmine.SpyObj<Socket>;

    beforeEach(() => {
        mockSocket = jasmine.createSpyObj('Socket', ['emit']);

        // Mock the io function globally before service creation
        (globalThis as unknown as { io: jasmine.Spy }).io = jasmine.createSpy('io').and.returnValue(mockSocket);

        TestBed.configureTestingModule({
            providers: [SocketService],
        });

        service = TestBed.inject(SocketService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should emit events', () => {
        const event = GameStoreEvents.GameCreated;
        const data = { test: 'data' };

        // Spy on the actual socket instance
        spyOn(service['socket'], 'emit');

        service.emit(event, data);

        expect(service['socket'].emit).toHaveBeenCalledWith(event, data);
    });

    it('should return observable from onEvent', () => {
        const event = GameStoreEvents.GameCreated;

        const result = service.onEvent(event);

        expect(result).toBeDefined();
    });

    it('should handle success events', () => {
        const event = GameStoreEvents.GameCreated;
        const successData = { test: 'success' };
        const callback = jasmine.createSpy('callback');

        spyOn(service, 'onEvent').and.returnValue(
            of({
                success: true,
                data: successData,
            } as SocketResponse<typeof successData>),
        );

        service.onSuccessEvent(event, callback);

        expect(callback).toHaveBeenCalledWith(successData);
    });

    it('should not call success callback on error response', () => {
        const event = GameStoreEvents.GameCreated;
        const callback = jasmine.createSpy('callback');

        spyOn(service, 'onEvent').and.returnValue(
            of({
                success: false,
                message: 'error',
            } as SocketResponse<never>),
        );

        service.onSuccessEvent(event, callback);

        expect(callback).not.toHaveBeenCalled();
    });

    it('should handle error events', () => {
        const event = GameStoreEvents.GameCreated;
        const errorMessage = 'test error';
        const callback = jasmine.createSpy('callback');

        spyOn(service, 'onEvent').and.returnValue(
            of({
                success: false,
                message: errorMessage,
            } as SocketResponse<never>),
        );

        service.onErrorEvent(event, callback);

        expect(callback).toHaveBeenCalledWith(errorMessage);
    });

    it('should not call error callback on success response', () => {
        const event = GameStoreEvents.GameCreated;
        const callback = jasmine.createSpy('callback');

        spyOn(service, 'onEvent').and.returnValue(
            of({
                success: true,
                data: { test: 'data' },
            } as SocketResponse<unknown>),
        );

        service.onErrorEvent(event, callback);

        expect(callback).not.toHaveBeenCalled();
    });
});
