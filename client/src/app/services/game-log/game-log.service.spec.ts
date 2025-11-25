import { TestBed } from '@angular/core/testing';
import { PlayerService } from '@app/services/player/player.service';
import { ResetService } from '@app/services/reset/reset.service';
import { GameLogEntryType } from '@common/enums/game-log-entry-type.enum';
import { Subject } from 'rxjs';
import { GameLogService } from './game-log.service';

describe('GameLogService', () => {
    let service: GameLogService;
    let playerService: jasmine.SpyObj<PlayerService>;
    let resetService: { reset$: Subject<void> };

    beforeEach(() => {
        resetService = { reset$: new Subject<void>() };
        playerService = jasmine.createSpyObj('PlayerService', [], {
            id: jasmine.createSpy().and.returnValue('player-1'),
        });

        TestBed.configureTestingModule({
            providers: [GameLogService, { provide: PlayerService, useValue: playerService }, { provide: ResetService, useValue: resetService }],
        });
        service = TestBed.inject(GameLogService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should add entry', () => {
        service.addEntry({
            type: GameLogEntryType.TurnStart,
            message: 'Test message',
            involvedPlayerIds: ['player-1'],
            involvedPlayerNames: ['Player 1'],
        });

        expect(service.entries().length).toBe(1);
        expect(service.entries()[0].message).toBe('Test message');
    });

    it('should toggle filter', () => {
        expect(service.filterByMe()).toBe(false);
        service.toggleFilter();
        expect(service.filterByMe()).toBe(true);
        service.toggleFilter();
        expect(service.filterByMe()).toBe(false);
    });

    it('should filter entries by player', () => {
        service.addEntry({
            type: GameLogEntryType.TurnStart,
            message: 'Player 1 message',
            involvedPlayerIds: ['player-1'],
            involvedPlayerNames: ['Player 1'],
        });

        service.addEntry({
            type: GameLogEntryType.TurnStart,
            message: 'Player 2 message',
            involvedPlayerIds: ['player-2'],
            involvedPlayerNames: ['Player 2'],
        });

        service.setFilter(true);
        const filtered = service.getFilteredEntries();
        expect(filtered().length).toBe(1);
        expect(filtered()[0].message).toBe('Player 1 message');
    });

    it('should reset entries', () => {
        service.addEntry({
            type: GameLogEntryType.TurnStart,
            message: 'Test',
            involvedPlayerIds: [],
            involvedPlayerNames: [],
        });

        service.reset();
        expect(service.entries().length).toBe(0);
        expect(service.filterByMe()).toBe(false);
    });
});
