import { TestBed } from '@angular/core/testing';
import { PlayerService } from '@app/services/player/player.service';
import { ResetService } from '@app/services/reset/reset.service';
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

    it('should initialize with filterByMe false', () => {
        expect(service.filterByMe()).toBe(false);
    });
});
