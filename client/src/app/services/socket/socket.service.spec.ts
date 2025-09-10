import { TestBed } from '@angular/core/testing';
import { GameStoreEvents } from '@common/constants/game-store-events';
import { SocketResponse } from '@common/types/socket-response.type';
import { Observable, Subject } from 'rxjs';
import { Socket } from 'socket.io-client';
import { SocketService } from './socket.service';

describe('SocketService', () => {
    let service: SocketService;
    let mockSocket: jasmine.SpyObj<Socket>;
    let eventSubject: Subject<SocketResponse<unknown>>;

    beforeEach(() => {
        eventSubject = new Subject();
        mockSocket = jasmine.createSpyObj('Socket', ['emit', 'on', 'off', 'removeListener']);
        (mockSocket.on as jasmine.Spy).and.callFake((event, callback) => {
            eventSubject.subscribe(callback);
            return mockSocket;
        });

        // Mock the io function
        (window as any).io = jasmine.createSpy().and.returnValue(mockSocket);

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

        service.emit(event, data);

        expect(mockSocket.emit).toHaveBeenCalledWith(event, data);
    });

    it('should handle success events', (done) => {
        const event = GameStoreEvents.GameCreated;
        const successData = { test: 'success' };
        const response: SocketResponse<typeof successData> = {
            success: true,
            data: successData,
        };

        service.onSuccessEvent(event, (data) => {
            expect(data).toEqual(successData);
            done();
        });

        eventSubject.next(response);
    });

    it('should not call success callback on error response', () => {
        const event = GameStoreEvents.GameCreated;
        const callback = jasmine.createSpy('callback');
        const response: SocketResponse<never> = {
            success: false,
            message: 'error',
        };

        service.onSuccessEvent(event, callback);
        eventSubject.next(response);

        expect(callback).not.toHaveBeenCalled();
    });

    it('should handle error events', (done) => {
        const event = GameStoreEvents.GameCreated;
        const errorMessage = 'test error';
        const response: SocketResponse<never> = {
            success: false,
            message: errorMessage,
        };

        service.onErrorEvent(event, (message) => {
            expect(message).toBe(errorMessage);
            done();
        });

        eventSubject.next(response);
    });

    it('should not call error callback on success response', () => {
        const event = GameStoreEvents.GameCreated;
        const callback = jasmine.createSpy('callback');
        const response: SocketResponse<unknown> = {
            success: true,
            data: { test: 'data' },
        };

        service.onErrorEvent(event, callback);
        eventSubject.next(response);

        expect(callback).not.toHaveBeenCalled();
    });

    it('should return an observable of socket responses', () => {
        const event = GameStoreEvents.GameCreated;
        const result = service.onEvent(event);

        expect(result instanceof Observable).toBeTruthy();
        expect(mockSocket.on).toHaveBeenCalledWith(event, jasmine.any(Function));
    });
});
