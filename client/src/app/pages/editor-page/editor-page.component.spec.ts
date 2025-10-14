import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ElementRef } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, ParamMap } from '@angular/router';
import { ToolType } from '@app/interfaces/game-editor.interface';
import { GameEditorCheckService } from '@app/services/game-editor-check/game-editor-check.service';
import { GameEditorInteractionsService } from '@app/services/game-editor-interactions/game-editor-interactions.service';
import { GameEditorStoreService } from '@app/services/game-editor-store/game-editor-store.service';
import { NotificationService } from '@app/services/notification/notification.service';
import { MapSize } from '@common/enums/map-size.enum';
import { TileKind } from '@common/enums/tile-kind.enum';
import { Subject } from 'rxjs';
import { EditorPageComponent } from './editor-page.component';

const MOCK_TILE_SIZE = 32;
const NEW_TILE_SIZE = 64;

describe('EditorPageComponent', () => {
    let component: EditorPageComponent;
    let fixture: ComponentFixture<EditorPageComponent>;
    let mockActivatedRoute: jasmine.SpyObj<ActivatedRoute>;
    let mockGameEditorStoreService: jasmine.SpyObj<GameEditorStoreService>;
    let mockGameEditorCheckService: jasmine.SpyObj<GameEditorCheckService>;
    let mockNotificationService: jasmine.SpyObj<NotificationService>;
    let mockGameEditorInteractionsService: jasmine.SpyObj<GameEditorInteractionsService> & { activeTool: unknown };
    let paramMapSubject: Subject<ParamMap>;

    beforeEach(async () => {
        paramMapSubject = new Subject<ParamMap>();

        mockActivatedRoute = jasmine.createSpyObj('ActivatedRoute', [], {
            paramMap: paramMapSubject.asObservable(),
        });

        mockGameEditorStoreService = jasmine.createSpyObj('GameEditorStoreService', ['loadGameById', 'reset', 'saveGame']);

        Object.defineProperty(mockGameEditorStoreService, 'tiles', {
            value: jasmine.createSpy().and.returnValue([{ x: 0, y: 0, kind: TileKind.BASE }]),
        });
        Object.defineProperty(mockGameEditorStoreService, 'size', {
            value: jasmine.createSpy().and.returnValue(MapSize.SMALL),
        });
        Object.defineProperty(mockGameEditorStoreService, 'placedObjects', {
            value: [],
            writable: true,
        });
        Object.defineProperty(mockGameEditorStoreService, 'tileSizePx', {
            value: MOCK_TILE_SIZE,
            writable: true,
        });
        Object.defineProperty(mockGameEditorStoreService, 'name', {
            value: 'Test Game',
            writable: true,
        });
        Object.defineProperty(mockGameEditorStoreService, 'description', {
            value: 'Test Description',
            writable: true,
        });
        Object.defineProperty(mockGameEditorStoreService, 'inventory', {
            value: jasmine.createSpy().and.returnValue([]),
        });

        mockGameEditorCheckService = jasmine.createSpyObj('GameEditorCheckService', ['canSave']);
        mockNotificationService = jasmine.createSpyObj('NotificationService', ['displaySuccess', 'displayError']);

        mockGameEditorInteractionsService = jasmine.createSpyObj('GameEditorInteractionsService', ['removeObject', 'dragEnd']);
        Object.defineProperty(mockGameEditorInteractionsService, 'activeTool', {
            value: null,
            writable: true,
        });

        await TestBed.configureTestingModule({
            imports: [EditorPageComponent],
            providers: [
                provideHttpClient(),
                provideHttpClientTesting(),
                { provide: ActivatedRoute, useValue: mockActivatedRoute },
                { provide: GameEditorStoreService, useValue: mockGameEditorStoreService },
                { provide: GameEditorCheckService, useValue: mockGameEditorCheckService },
                { provide: NotificationService, useValue: mockNotificationService },
                { provide: GameEditorInteractionsService, useValue: mockGameEditorInteractionsService },
            ],
        })
            .overrideComponent(EditorPageComponent, {
                set: {
                    providers: [
                        { provide: GameEditorStoreService, useValue: mockGameEditorStoreService },
                        { provide: GameEditorInteractionsService, useValue: mockGameEditorInteractionsService },
                        { provide: GameEditorCheckService, useValue: mockGameEditorCheckService },
                    ],
                },
            })
            .compileComponents();

        fixture = TestBed.createComponent(EditorPageComponent);
        component = fixture.componentInstance;
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should have correct constants', () => {
        expect(component.gameNameMaxLength).toBeDefined();
        expect(component.descriptionMaxLength).toBeDefined();
    });

    it('should get gameId$ from route params', () => {
        let gameId: string | undefined;
        component.gameId$.subscribe((id) => (gameId = id));

        const mockParamMap = {
            get: (key: string) => (key === 'id' ? 'test-game-id' : null),
            has: (key: string) => key === 'id',
            getAll: (key: string) => (key === 'id' ? ['test-game-id'] : []),
            keys: ['id'],
        } as ParamMap;
        paramMapSubject.next(mockParamMap);
        expect(gameId).toBe('test-game-id');
    });

    it('should filter out null gameId from route params', () => {
        const gameIds: string[] = [];
        component.gameId$.subscribe((id) => gameIds.push(id));

        const emptyParamMap = {
            get: () => null,
            has: () => false,
            getAll: () => [],
            keys: [],
        } as ParamMap;
        const validParamMap = {
            get: (key: string) => (key === 'id' ? 'valid-id' : null),
            has: (key: string) => key === 'id',
            getAll: (key: string) => (key === 'id' ? ['valid-id'] : []),
            keys: ['id'],
        } as ParamMap;

        paramMapSubject.next(emptyParamMap);
        paramMapSubject.next(validParamMap);

        expect(gameIds).toEqual(['valid-id']);
    });

    it('should get disableOverlayPointerEvents correctly when tool is TileBrushTool with drag', () => {
        mockGameEditorInteractionsService.activeTool = {
            type: ToolType.TileBrushTool,
            tileKind: TileKind.BASE,
            leftDrag: true,
            rightDrag: false,
        };
        expect(component.disableOverlayPointerEvents).toBe(true);

        mockGameEditorInteractionsService.activeTool = {
            type: ToolType.TileBrushTool,
            tileKind: TileKind.BASE,
            leftDrag: false,
            rightDrag: true,
        };
        expect(component.disableOverlayPointerEvents).toBe(true);
    });

    it('should get disableOverlayPointerEvents correctly when tool is not TileBrushTool', () => {
        mockGameEditorInteractionsService.activeTool = {
            type: ToolType.PlaceableEraserTool,
        };
        expect(component.disableOverlayPointerEvents).toBe(false);
    });

    it('should get disableOverlayPointerEvents correctly when no active tool', () => {
        (mockGameEditorInteractionsService as unknown as { activeTool: null }).activeTool = null;
        expect(component.disableOverlayPointerEvents).toBe(false);
    });

    it('should get tiles from store service', () => {
        const tiles = component.tiles;
        expect(mockGameEditorStoreService.tiles).toHaveBeenCalled();
        expect(tiles).toEqual([{ x: 0, y: 0, kind: TileKind.BASE }]);
    });

    it('should get size from store service', () => {
        const size = component.size;
        expect(mockGameEditorStoreService.size).toHaveBeenCalled();
        expect(size).toBe(MapSize.SMALL);
    });

    it('should get placedObjects from store service', () => {
        expect(component.placedObjects).toBe(mockGameEditorStoreService.placedObjects);
    });

    it('should get tileSizePx from store service', () => {
        expect(component.tileSizePx).toBe(MOCK_TILE_SIZE);
    });

    it('should get and set name from store service', () => {
        expect(component.name).toBe('Test Game');

        component.name = 'New Name';
        expect(mockGameEditorStoreService.name).toBe('New Name');
    });

    it('should get and set description from store service', () => {
        expect(component.description).toBe('Test Description');

        component.description = 'New Description';
        expect(mockGameEditorStoreService.description).toBe('New Description');
    });

    it('should get canSave from check service', () => {
        mockGameEditorCheckService.canSave.and.returnValue(true);
        expect(component.canSave).toBe(true);
        expect(mockGameEditorCheckService.canSave).toHaveBeenCalled();
    });

    it('should load game on init when gameId is available', () => {
        component.ngOnInit();

        const mockParamMap = {
            get: (key: string) => (key === 'id' ? 'test-id' : null),
            has: (key: string) => key === 'id',
            getAll: (key: string) => (key === 'id' ? ['test-id'] : []),
            keys: ['id'],
        } as ParamMap;
        paramMapSubject.next(mockParamMap);

        expect(mockGameEditorStoreService.loadGameById).toHaveBeenCalledWith('test-id');
    });

    it('should complete destroy$ on ngOnDestroy', () => {
        spyOn(component['destroy$'], 'next');
        spyOn(component['destroy$'], 'complete');

        component.ngOnDestroy();

        expect(component['destroy$'].next).toHaveBeenCalled();
        expect(component['destroy$'].complete).toHaveBeenCalled();
    });

    it('should reset game on onReset', () => {
        component.onReset();
        expect(mockGameEditorStoreService.reset).toHaveBeenCalled();
    });

    it('should update tile size on onResize', () => {
        component.onResize(NEW_TILE_SIZE);
        expect(mockGameEditorStoreService.tileSizePx).toBe(NEW_TILE_SIZE);
    });

    it('should handle drop outside grid', () => {
        const mockEvent = new DragEvent('drop');
        spyOn(mockEvent, 'preventDefault');

        component.onDropOutsideOfGrid(mockEvent);

        expect(mockEvent.preventDefault).toHaveBeenCalled();
        expect(mockGameEditorInteractionsService.activeTool).toEqual({
            type: ToolType.PlaceableEraserTool,
        });
        expect(mockGameEditorInteractionsService.removeObject).toHaveBeenCalled();
    });

    it('should handle drag over', () => {
        const mockEvent = new DragEvent('dragover');
        spyOn(mockEvent, 'preventDefault');

        component.onDragOver(mockEvent);

        expect(mockEvent.preventDefault).toHaveBeenCalled();
    });

    it('should save game successfully when canSave is true', async () => {
        mockGameEditorCheckService.canSave.and.returnValue(true);

        component.gridWrapper = {
            nativeElement: document.createElement('div'),
        } as ElementRef<HTMLElement>;

        await component.onSave();

        expect(mockGameEditorStoreService.saveGame).toHaveBeenCalledWith(component.gridWrapper.nativeElement);
    });

    it('should not save game when canSave is false', async () => {
        mockGameEditorCheckService.canSave.and.returnValue(false);

        component.gridWrapper = {
            nativeElement: document.createElement('div'),
        } as ElementRef<HTMLElement>;

        await component.onSave();

        expect(mockGameEditorStoreService.saveGame).not.toHaveBeenCalled();
    });

    it('should call dragEnd on mouseover when target is NOT a tile', () => {
        const nonTile = document.createElement('div');
        const evt = { target: nonTile } as unknown as MouseEvent;

        component.onMouseOver(evt);

        expect(mockGameEditorInteractionsService.dragEnd).toHaveBeenCalled();
    });

    it('should NOT call dragEnd on mouseover when target HAS class "tile"', () => {
        const tile = document.createElement('div');
        tile.classList.add('tile');
        const evt = { target: tile } as unknown as MouseEvent;

        component.onMouseOver(evt);

        expect(mockGameEditorInteractionsService.dragEnd).not.toHaveBeenCalled();
    });
});
