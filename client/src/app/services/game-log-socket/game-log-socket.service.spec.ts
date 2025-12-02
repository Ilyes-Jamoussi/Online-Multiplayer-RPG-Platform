import { TestBed } from '@angular/core/testing';
import { SocketService } from '@app/services/socket/socket.service';
import { GameLogEntryType } from '@common/enums/game-log-entry-type.enum';
import { GameLogEvents } from '@common/enums/game-log-events.enum';
import { GameLogEntry } from '@common/interfaces/game-log-entry.interface';
import { SocketResponse } from '@common/types/socket-response.type';
import { of } from 'rxjs';
import { GameLogSocketService } from './game-log-socket.service';

const TEST_LOG_ENTRY_ID = 'test-log-entry-id';
const TEST_TIMESTAMP = '2024-01-01T00:00:00Z';
const TEST_MESSAGE = 'Test log message';
const TEST_INVOLVED_PLAYER_ID_1 = 'player-id-1';
const TEST_INVOLVED_PLAYER_ID_2 = 'player-id-2';
const TEST_INVOLVED_PLAYER_NAME_1 = 'Player 1';
const TEST_INVOLVED_PLAYER_NAME_2 = 'Player 2';

type MockSocketService = {
    onEvent: jasmine.Spy;
};

const CREATE_MOCK_GAME_LOG_ENTRY = (): GameLogEntry => ({
    id: TEST_LOG_ENTRY_ID,
    timestamp: TEST_TIMESTAMP,
    type: GameLogEntryType.TurnStart,
    message: TEST_MESSAGE,
    involvedPlayerIds: [TEST_INVOLVED_PLAYER_ID_1, TEST_INVOLVED_PLAYER_ID_2],
    involvedPlayerNames: [TEST_INVOLVED_PLAYER_NAME_1, TEST_INVOLVED_PLAYER_NAME_2],
});

const CREATE_MOCK_SUCCESS_RESPONSE = (data: GameLogEntry): SocketResponse<GameLogEntry> => ({
    success: true,
    data,
});

const CREATE_MOCK_ERROR_RESPONSE = (): SocketResponse<GameLogEntry> => ({
    success: false,
    message: 'Error message',
});

describe('GameLogSocketService', () => {
    let service: GameLogSocketService;
    let mockSocketService: MockSocketService;

    beforeEach(() => {
        mockSocketService = {
            onEvent: jasmine.createSpy('onEvent'),
        };

        TestBed.configureTestingModule({
            providers: [GameLogSocketService, { provide: SocketService, useValue: mockSocketService }],
        });

        service = TestBed.inject(GameLogSocketService);
    });

    it('should create', () => {
        expect(service).toBeTruthy();
    });

    describe('onLogEntry', () => {
        it('should call socketService.onEvent with LogEntry event', () => {
            mockSocketService.onEvent.and.returnValue(of(CREATE_MOCK_SUCCESS_RESPONSE(CREATE_MOCK_GAME_LOG_ENTRY())));

            const callback = jasmine.createSpy('callback');
            service.onLogEntry(callback);

            expect(mockSocketService.onEvent).toHaveBeenCalledTimes(1);
            expect(mockSocketService.onEvent).toHaveBeenCalledWith(GameLogEvents.LogEntry);
        });

        it('should invoke callback with log entry data when success response is received', () => {
            const logEntry = CREATE_MOCK_GAME_LOG_ENTRY();
            mockSocketService.onEvent.and.returnValue(of(CREATE_MOCK_SUCCESS_RESPONSE(logEntry)));

            const callback = jasmine.createSpy('callback');
            service.onLogEntry(callback);

            expect(callback).toHaveBeenCalledTimes(1);
            expect(callback).toHaveBeenCalledWith(logEntry);
        });

        it('should not invoke callback when error response is received', () => {
            mockSocketService.onEvent.and.returnValue(of(CREATE_MOCK_ERROR_RESPONSE()));

            const callback = jasmine.createSpy('callback');
            service.onLogEntry(callback);

            expect(callback).not.toHaveBeenCalled();
        });

        it('should invoke callback with different log entry data', () => {
            const differentLogEntry: GameLogEntry = {
                id: 'different-log-entry-id',
                timestamp: '2024-01-02T00:00:00Z',
                type: GameLogEntryType.CombatStart,
                message: 'Different message',
                involvedPlayerIds: [TEST_INVOLVED_PLAYER_ID_1],
                involvedPlayerNames: [TEST_INVOLVED_PLAYER_NAME_1],
            };

            mockSocketService.onEvent.and.returnValue(of(CREATE_MOCK_SUCCESS_RESPONSE(differentLogEntry)));

            const callback = jasmine.createSpy('callback');
            service.onLogEntry(callback);

            expect(callback).toHaveBeenCalledWith(differentLogEntry);
        });

        it('should invoke callback multiple times for multiple success responses', () => {
            const logEntry1 = CREATE_MOCK_GAME_LOG_ENTRY();
            const logEntry2: GameLogEntry = {
                ...logEntry1,
                id: 'second-log-entry-id',
                message: 'Second message',
            };

            mockSocketService.onEvent.and.returnValue(
                of(CREATE_MOCK_SUCCESS_RESPONSE(logEntry1), CREATE_MOCK_SUCCESS_RESPONSE(logEntry2)),
            );

            const callback = jasmine.createSpy('callback');
            service.onLogEntry(callback);

            expect(callback).toHaveBeenCalledTimes(2);
            expect(callback).toHaveBeenCalledWith(logEntry1);
            expect(callback).toHaveBeenCalledWith(logEntry2);
        });

        it('should handle mixed success and error responses', () => {
            const logEntry = CREATE_MOCK_GAME_LOG_ENTRY();
            mockSocketService.onEvent.and.returnValue(
                of(CREATE_MOCK_SUCCESS_RESPONSE(logEntry), CREATE_MOCK_ERROR_RESPONSE(), CREATE_MOCK_SUCCESS_RESPONSE(logEntry)),
            );

            const callback = jasmine.createSpy('callback');
            service.onLogEntry(callback);

            expect(callback).toHaveBeenCalledTimes(2);
            expect(callback).toHaveBeenCalledWith(logEntry);
        });
    });
});

