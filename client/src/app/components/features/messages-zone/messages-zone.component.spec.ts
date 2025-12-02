import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MessagesZoneComponent } from './messages-zone.component';
import { GameLogService } from '@app/services/game-log/game-log.service';

describe('MessagesZoneComponent', () => {
    let component: MessagesZoneComponent;
    let fixture: ComponentFixture<MessagesZoneComponent>;
    let gameLogService: jasmine.SpyObj<GameLogService>;

    beforeEach(async () => {
        const filterByMeSignal = signal(false);
        gameLogService = jasmine.createSpyObj('GameLogService', ['toggleFilter'], {
            filterByMe: filterByMeSignal.asReadonly(),
        });

        await TestBed.configureTestingModule({
            imports: [MessagesZoneComponent],
            providers: [{ provide: GameLogService, useValue: gameLogService }],
        }).compileComponents();

        fixture = TestBed.createComponent(MessagesZoneComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should set active tab', () => {
        component.setActiveTab('journal');
        expect(component.isActiveTab('journal')).toBe(true);
        expect(component.isActiveTab('chat')).toBe(false);
    });

    it('should toggle filter when toggleFilter is called', () => {
        component.toggleFilter();
        expect(gameLogService.toggleFilter).toHaveBeenCalled();
    });

    it('should return filterByMe value from gameLogService', () => {
        Object.defineProperty(gameLogService, 'filterByMe', {
            value: signal(false).asReadonly(),
            configurable: true,
        });
        expect(component.isFilterByMe()).toBe(false);

        Object.defineProperty(gameLogService, 'filterByMe', {
            value: signal(true).asReadonly(),
            configurable: true,
        });
        expect(component.isFilterByMe()).toBe(true);
    });
});
