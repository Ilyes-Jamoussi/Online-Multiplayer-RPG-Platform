import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MessagesZoneComponent } from './messages-zone.component';
import { GameLogService } from '@app/services/game-log/game-log.service';

describe('MessagesZoneComponent', () => {
    let component: MessagesZoneComponent;
    let fixture: ComponentFixture<MessagesZoneComponent>;
    let gameLogService: jasmine.SpyObj<GameLogService>;

    beforeEach(async () => {
        gameLogService = jasmine.createSpyObj('GameLogService', ['toggleFilter'], {
            filterByMe: jasmine.createSpy().and.returnValue(false),
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
});

