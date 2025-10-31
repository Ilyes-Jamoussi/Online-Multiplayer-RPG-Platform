import { ComponentFixture, TestBed } from '@angular/core/testing';
import { GameEditorPlaceableDto } from '@app/dto/game-editor-placeable-dto';
import { ActiveTool, ToolType } from '@app/interfaces/game-editor.interface';
import { AssetsService } from '@app/services/assets/assets.service';
import { GameEditorInteractionsService } from '@app/services/game-editor-interactions/game-editor-interactions.service';
import { PlaceableKind, PlaceableLabel, PlaceableMime } from '@common/enums/placeable-kind.enum';
import { GameEditorObjectComponent } from './game-editor-object.component';

const NOOP = (): void => {
    /** no-op */
};

function createDataTransferStub(types: readonly string[], data: Readonly<Record<string, string>>): DataTransfer {
    const dataTransfer: DataTransfer = {
        dropEffect: 'none',
        effectAllowed: 'none',
        files: {} as FileList,
        items: {} as DataTransferItemList,
        types: Array.from(types),
        getData: (format: string): string => data[format] ?? '',
        setData: NOOP,
        clearData: NOOP,
        setDragImage: NOOP,
    } as unknown as DataTransfer;

    return dataTransfer;
}

type DragEvtInit = Partial<
    Pick<DragEvent, 'dataTransfer' | 'offsetX' | 'offsetY'> & {
        preventDefault: () => void;
        stopPropagation: () => void;
        button: number;
    }
>;

function makeDragEvent(init?: DragEvtInit): DragEvent {
    const evt = {
        preventDefault: init?.preventDefault ?? NOOP,
        stopPropagation: init?.stopPropagation ?? NOOP,
        dataTransfer: init?.dataTransfer ?? null,
        offsetX: init?.offsetX ?? 0,
        offsetY: init?.offsetY ?? 0,
        button: init?.button ?? 0,
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

describe('GameEditorObjectComponent', () => {
    let fixture: ComponentFixture<GameEditorObjectComponent>;
    let component: GameEditorObjectComponent;

    let interactionsSpy: jasmine.SpyObj<GameEditorInteractionsService>;
    let assetsSpy: jasmine.SpyObj<AssetsService>;

    let activeToolState: ActiveTool | null = null;
    const OBJ: GameEditorPlaceableDto = {
        id: 'obj-1',

        kind: PlaceableKind.BOAT,
        x: 3,
        y: 4,
        placed: true,
        orientation: 'N',
    };

    beforeEach(async () => {
        interactionsSpy = jasmine.createSpyObj<GameEditorInteractionsService>('GameEditorInteractionsService', [
            'setupObjectDrag',
            'revertToPreviousTool',
            'getFootprintOf',
            'removeObject',
        ]);

        assetsSpy = jasmine.createSpyObj<AssetsService>('AssetsService', ['getPlaceableImage']);

        Object.defineProperty(interactionsSpy, 'activeTool', {
            get: (): ActiveTool | null => activeToolState,
            set: (tool: ActiveTool | null) => {
                activeToolState = tool;
            },
            configurable: true,
        });

        await TestBed.configureTestingModule({
            imports: [GameEditorObjectComponent],
            providers: [
                { provide: GameEditorInteractionsService, useValue: interactionsSpy },
                { provide: AssetsService, useValue: assetsSpy },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(GameEditorObjectComponent);
        component = fixture.componentInstance;

        component.object = { ...OBJ };
        component.tileSize = 64;

        interactionsSpy.getFootprintOf.and.returnValue(2);
        assetsSpy.getPlaceableImage.and.returnValue('/assets/objects/boat.png');

        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('image getter should call AssetsService with resolved PlaceableKind and return its value', () => {
        const expectedKind = PlaceableKind[component.object.kind];
        const img = component.image;

        expect(assetsSpy.getPlaceableImage).toHaveBeenCalled();
        expect(assetsSpy.getPlaceableImage).toHaveBeenCalledWith(expectedKind);
        expect(img).toBe('/assets/objects/boat.png');
    });

    it('tooltip getter should map to PlaceableLabel', () => {
        const label = component.tooltip;
        const expected = PlaceableLabel[component.object.kind];
        expect(label).toBe(expected);
    });

    it('should set grid-column based on footprint and x', () => {
        fixture.detectChanges();
        const host = fixture.nativeElement as HTMLElement;
        expect(host.style.gridColumn).toBe('4 / span 2');
    });

    it('should set grid-row based on footprint and y', () => {
        fixture.detectChanges();
        const host = fixture.nativeElement as HTMLElement;
        expect(host.style.gridRow).toBe('5 / span 2');
    });

    it('should reflect CSS variable --tile-px from tileSize input', () => {
        const host = fixture.nativeElement as HTMLElement;
        expect(getComputedStyle(host).getPropertyValue('--tile-px').trim()).toBe('64');
        component.tileSize = 72;
        fixture.detectChanges();
        expect(getComputedStyle(host).getPropertyValue('--tile-px').trim()).toBe('72');
    });

    it('onDragStart should do nothing without dataTransfer', () => {
        const evt = makeDragEvent({
            dataTransfer: null,
            preventDefault: NOOP,
        });

        component.isDragging = false;
        component.onDragStart(evt);

        expect(interactionsSpy.setupObjectDrag).not.toHaveBeenCalled();
        expect(component.isDragging).toBeFalse();
    });

    it('onDragStart should delegate to interactions and set isDragging when dataTransfer exists', () => {
        const dataTransfer = createDataTransferStub([PlaceableMime.BOAT], {});
        const evt = makeDragEvent({
            dataTransfer,
            preventDefault: NOOP,
        });

        component.isDragging = false;
        component.onDragStart(evt);

        expect(interactionsSpy.setupObjectDrag).toHaveBeenCalledTimes(1);
        expect(interactionsSpy.setupObjectDrag).toHaveBeenCalledWith(component.object, evt);
        expect(component.isDragging).toBeTrue();
    });

    it('onDragEnd should reset isDragging and revert to previous tool', () => {
        component.isDragging = true;
        component.onDragEnd();
        expect(component.isDragging).toBeFalse();
        expect(interactionsSpy.revertToPreviousTool).toHaveBeenCalledTimes(1);
    });

    it('onDrop should prevent default and stop propagation', () => {
        let prevented = false;
        let stopped = false;

        const evt = makeDragEvent({
            dataTransfer: createDataTransferStub([], {}),
            preventDefault: (): void => {
                prevented = true;
            },
            stopPropagation: (): void => {
                stopped = true;
            },
        });

        component.onDrop(evt);

        expect(prevented).toBeTrue();
        expect(stopped).toBeTrue();
    });

    it('onContextMenu should prevent default', () => {
        let prevented = false;
        const evt = makeMouseEvent({
            preventDefault: (): void => {
                prevented = true;
            },
        });

        component.onContextMenu(evt);
        expect(prevented).toBeTrue();
    });

    it('onMouseDown (right click) should switch to PlaceableEraserTool', () => {
        const evt = makeMouseEvent({
            stopPropagation: NOOP,
            button: 2,
        });

        component.onMouseDown(evt);

        expect(activeToolState?.type as ToolType).toBe(ToolType.PlaceableEraserTool);
    });

    it('onMouseUp (right click) should remove the object by id', () => {
        const evt = makeMouseEvent({
            stopPropagation: NOOP,
            button: 2,
        });

        component.onMouseUp(evt);

        expect(interactionsSpy.removeObject).toHaveBeenCalledTimes(1);
        expect(interactionsSpy.removeObject).toHaveBeenCalledWith(component.object.id);
    });
});
