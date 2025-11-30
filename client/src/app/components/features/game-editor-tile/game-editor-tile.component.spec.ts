import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { GameEditorTileDto } from '@app/dto/game-editor-tile-dto';
import { ActiveTool, GameEditorIssues, ToolType } from '@app/interfaces/game-editor.interface';
import { AssetsService } from '@app/services/assets/assets.service';
import { GameEditorCheckService } from '@app/services/game-editor-check/game-editor-check.service';
import { GameEditorInteractionsService } from '@app/services/game-editor-interactions/game-editor-interactions.service';
import { PlaceableKind } from '@common/enums/placeable-kind.enum';
import { TileKind } from '@common/enums/tile.enum';
import { Position } from '@common/interfaces/position.interface';
import { GameEditorTileComponent } from './game-editor-tile.component';

// eslint-disable-next-line @typescript-eslint/no-empty-function -- Intentionally empty function for test stubs
const NOOP = (): void => {};

function createDataTransferStub(types: readonly string[]): DataTransfer {
    const dataTransfer: DataTransfer = {
        dropEffect: 'none',
        effectAllowed: 'none',
        files: {} as FileList,
        items: {} as DataTransferItemList,
        types: Array.from(types),
        getData: (): string => '',
        setData: NOOP,
        clearData: NOOP,
        setDragImage: NOOP,
    } as DataTransfer;
    return dataTransfer;
}

type DragEvtInit = Partial<
    Pick<DragEvent, 'dataTransfer'> & {
        preventDefault: () => void;
        stopPropagation: () => void;
        offsetX: number;
        offsetY: number;
    }
>;

function makeDragEvent(init?: DragEvtInit): DragEvent {
    const evt = {
        preventDefault: init?.preventDefault ?? NOOP,
        stopPropagation: init?.stopPropagation ?? NOOP,
        dataTransfer: init?.dataTransfer ?? null,
        offsetX: init?.offsetX ?? 0,
        offsetY: init?.offsetY ?? 0,
    } as unknown as DragEvent;
    return evt;
}

type MouseEvtInit = Partial<{
    preventDefault: () => void;
    stopPropagation: () => void;
    button: number;
}>;

function makeMouseEvent(init?: MouseEvtInit): MouseEvent {
    const evt = {
        preventDefault: init?.preventDefault ?? NOOP,
        stopPropagation: init?.stopPropagation ?? NOOP,
        button: init?.button ?? 0,
    } as unknown as MouseEvent;
    return evt;
}

describe('GameEditorTileComponent', () => {
    let fixture: ComponentFixture<GameEditorTileComponent>;
    let component: GameEditorTileComponent;

    let interactionsSpy: jasmine.SpyObj<GameEditorInteractionsService>;
    let checkSpy: jasmine.SpyObj<GameEditorCheckService>;
    let assetsSpy: jasmine.SpyObj<AssetsService>;

    const tile: GameEditorTileDto = {
        x: 2,
        y: 3,
        kind: TileKind.BASE,
        open: false,
    };

    let activeToolState: ActiveTool | null = null;
    let hoveredTilesState: Position[] = [];

    beforeEach(async () => {
        interactionsSpy = jasmine.createSpyObj<GameEditorInteractionsService>('GameEditorInteractionsService', [
            'dragStart',
            'dragEnd',
            'revertToPreviousTool',
            'tilePaint',
            'hasMime',
            'resolveHoveredTiles',
            'resolveDropAction',
            'selectTeleportTileEraserTool',
        ]);

        assetsSpy = jasmine.createSpyObj<AssetsService>('AssetsService', ['getTileImage']);

        const problems: GameEditorIssues = {
            terrainCoverage: { hasIssue: false },
            doors: { hasIssue: false, tiles: [] },
            terrainAccessibility: { hasIssue: false, tiles: [] },
            startPlacement: { hasIssue: false },
            flagPlacement: { hasIssue: false },
            nameValidation: { hasIssue: false },
            descriptionValidation: { hasIssue: false },
        };

        const editorProblemsSig = signal<GameEditorIssues>(problems);

        checkSpy = jasmine.createSpyObj<GameEditorCheckService>('GameEditorCheckService', [], {
            editorProblems: editorProblemsSig,
        });

        Object.defineProperty(interactionsSpy, 'activeTool', {
            get: (): ActiveTool | null => activeToolState,
            set: (activeTool: ActiveTool | null) => {
                activeToolState = activeTool;
            },
            configurable: true,
        });

        Object.defineProperty(interactionsSpy, 'hoveredTiles', {
            get: (): (() => readonly Position[]) => {
                return () => hoveredTilesState;
            },
            configurable: true,
        });

        assetsSpy.getTileImage.and.returnValue('/assets/tiles/base.png');
        interactionsSpy.hasMime.and.returnValue(false);

        await TestBed.configureTestingModule({
            imports: [GameEditorTileComponent],
            providers: [
                { provide: GameEditorInteractionsService, useValue: interactionsSpy },
                { provide: GameEditorCheckService, useValue: checkSpy },
                { provide: AssetsService, useValue: assetsSpy },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(GameEditorTileComponent);
        component = fixture.componentInstance;
        component.tile = { ...tile };
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('image getter should use AssetsService with kind and open', () => {
        component.tile = { ...tile, kind: TileKind.DOOR, open: true };
        fixture.detectChanges();
        const src = component.tileImage;
        expect(assetsSpy.getTileImage).toHaveBeenCalledWith(TileKind.DOOR, true);
        expect(src).toBe('/assets/tiles/base.png');
    });

    it('hasProblem should be false when tile not listed in problems', () => {
        const res = component.isInvalid;
        expect(res).toBeFalse();
    });

    it('hasProblem should be true when tile is in terrainAccessibility tiles', () => {
        const problems = checkSpy.editorProblems();
        problems.terrainAccessibility.tiles.push({ x: tile.x, y: tile.y });
        const res = component.isInvalid;
        expect(res).toBeTrue();
    });

    it('hasProblem should be true when tile is in doors tiles', () => {
        const problems = checkSpy.editorProblems();
        problems.terrainAccessibility.tiles = [];
        problems.doors.tiles.push({ x: tile.x, y: tile.y });
        const res = component.isInvalid;
        expect(res).toBeTrue();
    });

    it('isDropHovered should reflect hoveredTiles from interactions', () => {
        hoveredTilesState = [];
        expect(component.isDropHovered).toBeFalse();
        hoveredTilesState = [{ x: tile.x, y: tile.y }];
        expect(component.isDropHovered).toBeTrue();
    });

    it('isBrushHovered should be true only when active tool is TileBrushTool', () => {
        activeToolState = null;
        expect(component.isBrushHovered).toBeFalse();
        activeToolState = { type: ToolType.PlaceableTool, placeableKind: 0 as unknown as never };
        expect(component.isBrushHovered).toBeFalse();
        activeToolState = { type: ToolType.TileBrushTool, tileKind: TileKind.WALL, leftDrag: false, rightDrag: false };
        expect(component.isBrushHovered).toBeTrue();
    });

    describe('onRightClick', () => {
        it('should prevent default', () => {
            let prevented = false;
            const evt = makeMouseEvent({ preventDefault: () => (prevented = true) });
            component.onRightClick(evt);
            expect(prevented).toBeTrue();
        });
    });

    describe('onMouseDown', () => {
        const MOCK_BUTTON_LEFT = 0;
        const MOCK_BUTTON_RIGHT = 2;

        beforeEach(() => {
            interactionsSpy.dragStart.calls.reset();
            interactionsSpy.selectTeleportTileEraserTool.calls.reset();
        });

        it('should prevent default', () => {
            let prevented = false;
            const evt = makeMouseEvent({ preventDefault: () => (prevented = true), button: MOCK_BUTTON_LEFT });
            component.onMouseDown(evt);
            expect(prevented).toBeTrue();
        });

        it('should start left drag when button is 0', () => {
            let prevented = false;
            const evt = makeMouseEvent({ preventDefault: () => (prevented = true), button: MOCK_BUTTON_LEFT });
            component.onMouseDown(evt);
            expect(prevented).toBeTrue();
            expect(interactionsSpy.dragStart).toHaveBeenCalledWith(tile.x, tile.y, 'left');
        });

        it('should call selectTeleportTileEraserTool when right click on TELEPORT tile', () => {
            component.tile = { ...tile, kind: TileKind.TELEPORT };
            fixture.detectChanges();
            let prevented = false;
            const evt = makeMouseEvent({ preventDefault: () => (prevented = true), button: MOCK_BUTTON_RIGHT });
            component.onMouseDown(evt);
            expect(prevented).toBeTrue();
            expect(interactionsSpy.selectTeleportTileEraserTool).toHaveBeenCalledTimes(1);
            expect(interactionsSpy.dragStart).toHaveBeenCalledWith(tile.x, tile.y, 'right');
        });

        it('should set TileBrushTool BASE and start right drag when right click on non-TELEPORT tile', () => {
            component.tile = { ...tile, kind: TileKind.BASE };
            fixture.detectChanges();
            let prevented = false;
            const evt = makeMouseEvent({ preventDefault: () => (prevented = true), button: MOCK_BUTTON_RIGHT });
            component.onMouseDown(evt);
            expect(prevented).toBeTrue();
            expect(activeToolState?.type).toBe(ToolType.TileBrushTool);
            expect((activeToolState as ActiveTool & { tileKind: TileKind }).tileKind).toBe(TileKind.BASE);
            expect(interactionsSpy.selectTeleportTileEraserTool).not.toHaveBeenCalled();
            expect(interactionsSpy.dragStart).toHaveBeenCalledWith(tile.x, tile.y, 'right');
        });
    });

    it('onMouseUp should call dragEnd always', () => {
        let prevented = false;
        const evt = makeMouseEvent({ preventDefault: () => (prevented = true), button: 0 });
        component.onMouseUp(evt);
        expect(prevented).toBeTrue();
        expect(interactionsSpy.dragEnd).toHaveBeenCalledTimes(1);
    });

    it('onMouseUp right should also revertToPreviousTool', () => {
        activeToolState = {
            type: ToolType.TileBrushTool,
            tileKind: TileKind.BASE,
            leftDrag: false,
            rightDrag: false,
        };
        let prevented = false;
        const evt = makeMouseEvent({ preventDefault: () => (prevented = true), button: 2 });
        component.onMouseUp(evt);
        expect(prevented).toBeTrue();
        expect(interactionsSpy.dragEnd).toHaveBeenCalled();
        expect(interactionsSpy.revertToPreviousTool).toHaveBeenCalledTimes(1);
    });

    it('onMouseOver should call tilePaint with tile coords', () => {
        let prevented = false;
        const evt = makeMouseEvent({ preventDefault: () => (prevented = true) });
        component.onMouseOver(evt);
        expect(prevented).toBeTrue();
        expect(interactionsSpy.tilePaint).toHaveBeenCalledWith(tile.x, tile.y);
    });

    it('onTileDragOver should ignore when hasMime is false', () => {
        interactionsSpy.hasMime.and.returnValue(false);
        const dataTransfer = createDataTransferStub([]);
        let prevented = false;
        const evt = makeDragEvent({ dataTransfer, preventDefault: () => (prevented = true) });
        component.onTileDragOver(evt);
        expect(prevented).toBeFalse();
        expect(interactionsSpy.resolveHoveredTiles).not.toHaveBeenCalled();
    });

    it('onTileDragOver should ignore when dataTransfer is null', () => {
        interactionsSpy.hasMime.and.returnValue(true);
        let prevented = false;
        const evt = makeDragEvent({ dataTransfer: null, preventDefault: () => (prevented = true) });
        component.onTileDragOver(evt);
        expect(prevented).toBeFalse();
        expect(interactionsSpy.resolveHoveredTiles).not.toHaveBeenCalled();
    });

    it('onTileDragOver should set dropEffect move and resolveHoveredTiles when accepted', () => {
        interactionsSpy.hasMime.and.returnValue(true);
        const dataTransfer = createDataTransferStub([]);
        let prevented = false;
        const evt = makeDragEvent({ dataTransfer, preventDefault: () => (prevented = true) });
        component.onTileDragOver(evt);
        expect(prevented).toBeTrue();
        expect(dataTransfer.dropEffect).toBe('move');
        expect(interactionsSpy.resolveHoveredTiles).toHaveBeenCalled();
    });

    it('onTileDragEnter should only check hasMime', () => {
        interactionsSpy.hasMime.and.returnValue(false);
        const evt = makeDragEvent({ dataTransfer: createDataTransferStub([]) });
        component.onTileDragEnter(evt);
        expect(interactionsSpy.hasMime).toHaveBeenCalledWith(evt);
        interactionsSpy.hasMime.calls.reset();
        interactionsSpy.hasMime.and.returnValue(true);
        component.onTileDragEnter(evt);
        expect(interactionsSpy.hasMime).toHaveBeenCalledWith(evt);
    });

    it('onTileDrop should ignore when hasMime is false', () => {
        interactionsSpy.hasMime.and.returnValue(false);
        const evt = makeDragEvent({ dataTransfer: createDataTransferStub([]) });
        component.onTileDrop(evt);
        expect(interactionsSpy.resolveDropAction).not.toHaveBeenCalled();
    });

    it('onTileDrop should ignore when dataTransfer is null', () => {
        interactionsSpy.hasMime.and.returnValue(true);
        const evt = makeDragEvent({ dataTransfer: null });
        component.onTileDrop(evt);
        expect(interactionsSpy.resolveDropAction).not.toHaveBeenCalled();
    });

    it('onTileDrop should prevent, stop and resolveDropAction when accepted', () => {
        interactionsSpy.hasMime.and.returnValue(true);
        let prevented = false;
        let stopped = false;
        const evt = makeDragEvent({
            dataTransfer: createDataTransferStub([]),
            preventDefault: () => (prevented = true),
            stopPropagation: () => (stopped = true),
        });
        component.onTileDrop(evt);
        expect(prevented).toBeTrue();
        expect(stopped).toBeTrue();
        expect(interactionsSpy.resolveDropAction).toHaveBeenCalledWith(evt);
    });

    it('isDropHovered returns false when hoveredTiles is undefined', () => {
        const original = Object.getOwnPropertyDescriptor(interactionsSpy, 'hoveredTiles');
        Object.defineProperty(interactionsSpy, 'hoveredTiles', {
            get: (): (() => readonly Position[] | undefined) => () => undefined,
            configurable: true,
        });
        expect(component.isDropHovered).toBeFalse();
        Object.defineProperty(interactionsSpy, 'hoveredTiles', original as PropertyDescriptor);
    });

    it('isDropHovered returns false when list does not include tile', () => {
        hoveredTilesState = [{ x: tile.x + 1, y: tile.y + 1 }];
        expect(component.isDropHovered).toBeFalse();
    });

    it('isDropHovered returns true when list includes tile', () => {
        hoveredTilesState = [{ x: tile.x, y: tile.y }];
        expect(component.isDropHovered).toBeTrue();
    });

    describe('teleportChannelNumber', () => {
        const MOCK_TELEPORT_CHANNEL = 1;

        it('should return null when tile kind is not TELEPORT', () => {
            component.tile = { ...tile, kind: TileKind.BASE };
            fixture.detectChanges();
            expect(component.teleportChannelNumber).toBeNull();
        });

        it('should return null when tile kind is TELEPORT but teleportChannel is undefined', () => {
            component.tile = { ...tile, kind: TileKind.TELEPORT };
            fixture.detectChanges();
            expect(component.teleportChannelNumber).toBeNull();
        });

        it('should return null when tile kind is TELEPORT but teleportChannel is 0', () => {
            component.tile = { ...tile, kind: TileKind.TELEPORT, teleportChannel: 0 };
            fixture.detectChanges();
            expect(component.teleportChannelNumber).toBeNull();
        });

        it('should return teleportChannel when tile kind is TELEPORT and teleportChannel exists', () => {
            component.tile = { ...tile, kind: TileKind.TELEPORT, teleportChannel: MOCK_TELEPORT_CHANNEL };
            fixture.detectChanges();
            expect(component.teleportChannelNumber).toBe(MOCK_TELEPORT_CHANNEL);
        });
    });

    describe('activeTeleportChannelNumber', () => {
        const MOCK_CHANNEL_NUMBER = 2;

        it('should return null when activeTool is null', () => {
            activeToolState = null;
            fixture.detectChanges();
            expect(component.activeTeleportChannelNumber).toBeNull();
        });

        it('should return null when activeTool type is not TeleportTileTool', () => {
            activeToolState = { type: ToolType.TileBrushTool, tileKind: TileKind.BASE, leftDrag: false, rightDrag: false };
            fixture.detectChanges();
            expect(component.activeTeleportChannelNumber).toBeNull();
        });

        it('should return null when activeTool type is PlaceableTool', () => {
            activeToolState = { type: ToolType.PlaceableTool, placeableKind: PlaceableKind.START };
            fixture.detectChanges();
            expect(component.activeTeleportChannelNumber).toBeNull();
        });

        it('should return channelNumber when activeTool type is TeleportTileTool', () => {
            activeToolState = {
                type: ToolType.TeleportTileTool,
                channelNumber: MOCK_CHANNEL_NUMBER,
                teleportChannel: {
                    channelNumber: MOCK_CHANNEL_NUMBER,
                    tiles: { entryA: { x: 0, y: 0 }, entryB: { x: 1, y: 1 } },
                },
            };
            fixture.detectChanges();
            expect(component.activeTeleportChannelNumber).toBe(MOCK_CHANNEL_NUMBER);
        });
    });

    describe('isTeleportToolActive', () => {
        it('should return false when activeTool is null', () => {
            activeToolState = null;
            fixture.detectChanges();
            expect(component.isTeleportToolActive).toBeFalse();
        });

        it('should return false when activeTool type is not TeleportTileTool', () => {
            activeToolState = { type: ToolType.TileBrushTool, tileKind: TileKind.BASE, leftDrag: false, rightDrag: false };
            fixture.detectChanges();
            expect(component.isTeleportToolActive).toBeFalse();
        });

        it('should return false when activeTool type is PlaceableTool', () => {
            activeToolState = { type: ToolType.PlaceableTool, placeableKind: PlaceableKind.START };
            fixture.detectChanges();
            expect(component.isTeleportToolActive).toBeFalse();
        });

        it('should return true when activeTool type is TeleportTileTool', () => {
            activeToolState = {
                type: ToolType.TeleportTileTool,
                channelNumber: 1,
                teleportChannel: {
                    channelNumber: 1,
                    tiles: { entryA: { x: 0, y: 0 }, entryB: { x: 1, y: 1 } },
                },
            };
            fixture.detectChanges();
            expect(component.isTeleportToolActive).toBeTrue();
        });
    });
});
