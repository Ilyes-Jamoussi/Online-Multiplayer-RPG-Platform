import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { GameLogSocketService } from '@app/services/game-log-socket/game-log-socket.service';
import { PlayerService } from '@app/services/player/player.service';
import { ResetService } from '@app/services/reset/reset.service';
import { GameLogEntryType } from '@common/enums/game-log-entry-type.enum';
import { GameLogEntry } from '@common/interfaces/game-log-entry.interface';
import { Subject } from 'rxjs';
import { GameLogService } from './game-log.service';

const MOCK_PLAYER_ID = 'player-1';
const MOCK_OTHER_PLAYER_ID = 'player-2';
const MOCK_ENTRY_ID_1 = 'entry-1';
const MOCK_ENTRY_ID_2 = 'entry-2';
const MOCK_TIMESTAMP = '2024-01-01T00:00:00.000Z';

describe('GameLogService', () => {
    let service: GameLogService;
    let playerService: jasmine.SpyObj<PlayerService>;
    let resetService: { reset$: Subject<void> };
    let gameLogSocketService: jasmine.SpyObj<GameLogSocketService>;
    let onLogEntryCallback: ((entry: GameLogEntry) => void) | undefined;

    const mockEntry1: GameLogEntry = {
        id: MOCK_ENTRY_ID_1,
        timestamp: MOCK_TIMESTAMP,
        type: GameLogEntryType.TurnStart,
        message: 'Player 1 started turn',
        involvedPlayerIds: [MOCK_PLAYER_ID],
        involvedPlayerNames: ['Player 1'],
    };

    const mockEntry2: GameLogEntry = {
        id: MOCK_ENTRY_ID_2,
        timestamp: MOCK_TIMESTAMP,
        type: GameLogEntryType.CombatStart,
        message: 'Combat started',
        involvedPlayerIds: [MOCK_OTHER_PLAYER_ID],
        involvedPlayerNames: ['Player 2'],
    };

    beforeEach(() => {
        resetService = { reset$: new Subject<void>() };
        playerService = jasmine.createSpyObj('PlayerService', [], {
            id: signal(MOCK_PLAYER_ID),
        });

        gameLogSocketService = jasmine.createSpyObj('GameLogSocketService', ['onLogEntry']);
        gameLogSocketService.onLogEntry.and.callFake((callback: (entry: GameLogEntry) => void) => {
            onLogEntryCallback = callback;
        });

        TestBed.configureTestingModule({
            providers: [
                GameLogService,
                { provide: PlayerService, useValue: playerService },
                { provide: ResetService, useValue: resetService },
                { provide: GameLogSocketService, useValue: gameLogSocketService },
            ],
        });
        service = TestBed.inject(GameLogService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should initialize with filterByMe false', () => {
        expect(service.filterByMe()).toBe(false);
    });

    it('should call initListeners on construction', () => {
        expect(gameLogSocketService.onLogEntry).toHaveBeenCalled();
    });

    it('should subscribe to reset$ on construction', () => {
        expect(resetService.reset$.observers.length).toBeGreaterThan(0);
    });

    describe('initListeners', () => {
        it('should add entry when onLogEntry is called', () => {
            expect(service.entries().length).toBe(0);
            if (onLogEntryCallback) {
                onLogEntryCallback(mockEntry1);
            }
            expect(service.entries().length).toBe(1);
            expect(service.entries()[0]).toEqual(mockEntry1);
        });

        it('should append multiple entries', () => {
            if (onLogEntryCallback) {
                onLogEntryCallback(mockEntry1);
                onLogEntryCallback(mockEntry2);
            }
            expect(service.entries().length).toBe(2);
            expect(service.entries()[0]).toEqual(mockEntry1);
            expect(service.entries()[1]).toEqual(mockEntry2);
        });
    });

    describe('toggleFilter', () => {
        it('should toggle filterByMe from false to true', () => {
            expect(service.filterByMe()).toBe(false);
            service.toggleFilter();
            expect(service.filterByMe()).toBe(true);
        });

        it('should toggle filterByMe from true to false', () => {
            service.toggleFilter();
            expect(service.filterByMe()).toBe(true);
            service.toggleFilter();
            expect(service.filterByMe()).toBe(false);
        });
    });

    describe('reset', () => {
        it('should clear entries and reset filterByMe to false', () => {
            if (onLogEntryCallback) {
                onLogEntryCallback(mockEntry1);
                onLogEntryCallback(mockEntry2);
            }
            service.toggleFilter();
            expect(service.entries().length).toBe(2);
            expect(service.filterByMe()).toBe(true);

            service.reset();

            expect(service.entries().length).toBe(0);
            expect(service.filterByMe()).toBe(false);
        });
    });

    describe('getFilteredEntries', () => {
        it('should return all entries when filterByMe is false', () => {
            if (onLogEntryCallback) {
                onLogEntryCallback(mockEntry1);
                onLogEntryCallback(mockEntry2);
            }
            const filtered = service.getFilteredEntries()();
            expect(filtered.length).toBe(2);
            expect(filtered).toContain(mockEntry1);
            expect(filtered).toContain(mockEntry2);
        });

        it('should filter entries by myId when filterByMe is true', () => {
            if (onLogEntryCallback) {
                onLogEntryCallback(mockEntry1);
                onLogEntryCallback(mockEntry2);
            }
            service.toggleFilter();
            const filtered = service.getFilteredEntries()();
            expect(filtered.length).toBe(1);
            expect(filtered[0]).toEqual(mockEntry1);
            expect(filtered).not.toContain(mockEntry2);
        });

        it('should return empty array when filterByMe is true and no entries match', () => {
            if (onLogEntryCallback) {
                onLogEntryCallback(mockEntry2);
            }
            service.toggleFilter();
            const filtered = service.getFilteredEntries()();
            expect(filtered.length).toBe(0);
        });
    });

    describe('reset subscription', () => {
        it('should call reset when reset$ emits', () => {
            if (onLogEntryCallback) {
                onLogEntryCallback(mockEntry1);
            }
            service.toggleFilter();
            expect(service.entries().length).toBe(1);
            expect(service.filterByMe()).toBe(true);

            resetService.reset$.next();

            expect(service.entries().length).toBe(0);
            expect(service.filterByMe()).toBe(false);
        });
    });
});
