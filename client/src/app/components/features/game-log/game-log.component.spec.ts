import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { GameLogComponent } from './game-log.component';
import { GameLogService } from '@app/services/game-log/game-log.service';

describe('GameLogComponent', () => {
    let component: GameLogComponent;
    let fixture: ComponentFixture<GameLogComponent>;
    let gameLogService: jasmine.SpyObj<GameLogService>;

    beforeEach(async () => {
        gameLogService = jasmine.createSpyObj('GameLogService', ['toggleFilter'], {
            getFilteredEntries: jasmine.createSpy('getFilteredEntries').and.returnValue(signal([])),
            filterByMe: signal(false),
        });

        await TestBed.configureTestingModule({
            imports: [GameLogComponent],
            providers: [{ provide: GameLogService, useValue: gameLogService }],
        }).compileComponents();

        fixture = TestBed.createComponent(GameLogComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should toggle filter when toggleFilter is called', () => {
        component.toggleFilter();
        expect(gameLogService.toggleFilter).toHaveBeenCalled();
    });

    it('should format time correctly', () => {
        const timestamp = '2024-01-01T12:30:45.000Z';
        const formatted = component.formatTime(timestamp);
        expect(formatted).toMatch(/\d{2}:\d{2}:\d{2}/);
    });
});
