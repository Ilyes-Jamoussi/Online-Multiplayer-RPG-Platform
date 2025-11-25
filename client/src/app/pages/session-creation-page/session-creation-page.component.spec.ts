import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { ROUTES } from '@app/enums/routes.enum';
import { GamePreviewDto } from '@app/dto/game-preview-dto';
import { GameStoreService } from '@app/services/game-store/game-store.service';
import { PlayerService } from '@app/services/player/player.service';
import { SessionService } from '@app/services/session/session.service';
import { GameTab } from '@app/types/game-tab.types';
import { GameMode } from '@common/enums/game-mode.enum';
import { of } from 'rxjs';
import { SessionCreationPageComponent } from './session-creation-page.component';

describe('SessionCreationPageComponent', () => {
    let component: SessionCreationPageComponent;
    let fixture: ComponentFixture<SessionCreationPageComponent>;
    let routerSpy: jasmine.SpyObj<Router>;
    let gameStoreServiceSpy: jasmine.SpyObj<GameStoreService>;
    let sessionServiceSpy: jasmine.SpyObj<SessionService>;
    let playerServiceSpy: jasmine.SpyObj<PlayerService>;

    const mockGames: GamePreviewDto[] = [
        {
            id: '1',
            name: 'Game 1',
            description: 'Description 1',
            size: 10,
            mode: GameMode.CLASSIC,
            lastModified: new Date().toISOString(),
            visibility: true,
            gridPreviewUrl: '/assets/game1-preview.png',
            draft: false,
        },
    ];

    beforeEach(async () => {
        const activeTabSignal = signal<GameTab>('all');
        const classicSignal = signal(mockGames);
        const ctfSignal = signal<GamePreviewDto[]>([]);

        gameStoreServiceSpy = jasmine.createSpyObj('GameStoreService', ['loadGames', 'setActiveTab'], {
            activeTab: activeTabSignal,
            visibleGames: signal(mockGames),
            classicGames: classicSignal,
            ctfGames: ctfSignal,
        });
        const routerSpyObj = jasmine.createSpyObj('Router', ['navigate']);
        sessionServiceSpy = jasmine.createSpyObj('SessionService', ['initializeSessionWithGame']);
        playerServiceSpy = jasmine.createSpyObj('PlayerService', ['setAsAdmin']);

        await TestBed.configureTestingModule({
            imports: [SessionCreationPageComponent],
            providers: [
                { provide: Router, useValue: routerSpyObj },
                { provide: GameStoreService, useValue: gameStoreServiceSpy },
                { provide: SessionService, useValue: sessionServiceSpy },
                { provide: PlayerService, useValue: playerServiceSpy },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(SessionCreationPageComponent);
        component = fixture.componentInstance;
        routerSpy = TestBed.inject(Router) as jasmine.SpyObj<Router>;
        gameStoreServiceSpy.loadGames.and.returnValue(of(mockGames));
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should load games on init', () => {
        expect(gameStoreServiceSpy.loadGames).toHaveBeenCalled();
    });

    it('should return visible games for active tab', () => {
        const signalRef = component.visibleGames;
        expect(signalRef()).toEqual(mockGames);
    });

    it('should navigate back to home when back is clicked', () => {
        component.onBack();

        expect(routerSpy.navigate).toHaveBeenCalledWith([ROUTES.HomePage]);
    });

    it('should initialize session when starting a game', () => {
        const mockGame = {
            id: 'test-game',
            name: 'Test Game',
            size: 10,
            mode: GameMode.CLASSIC,
        } as GamePreviewDto;
        component.onStartGame(mockGame);

        expect(sessionServiceSpy.initializeSessionWithGame).toHaveBeenCalledWith(mockGame.id, mockGame.size, mockGame.mode);
    });
});
