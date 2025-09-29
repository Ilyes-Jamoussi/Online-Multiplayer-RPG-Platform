/* eslint-disable @typescript-eslint/naming-convention */
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { GameEditorInventoryComponent } from './game-editor-inventory.component';
import { GameEditorStoreService } from '@app/services/game-editor-store/game-editor-store.service';
import { GameEditorInteractionsService } from '@app/services/game-editor-interactions/game-editor-interactions.service';
import { ActiveTool, Inventory, ToolType } from '@app/interfaces/game-editor.interface';
import { PlaceableKind, PlaceableMime } from '@common/enums/placeable-kind.enum';
import { Signal, signal } from '@angular/core';

const NOOP = (): void => {
    /** no-op */
};

function createDataTransferStub(types: readonly string[], data: Readonly<Record<string, string>>): DataTransfer {
    const dt: DataTransfer = {
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

    return dt;
}

type DragEvtInit = Partial<
    Pick<DragEvent, 'dataTransfer' | 'offsetX' | 'offsetY'> & {
        preventDefault: () => void;
        stopPropagation: () => void;
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

/* -------------------------------------------------------------------------- */

const MOCK_TILE_SIZE = 64;

describe('GameEditorInventoryComponent', () => {
    let fixture: ComponentFixture<GameEditorInventoryComponent>;
    let component: GameEditorInventoryComponent;

    let storeSpy: jasmine.SpyObj<GameEditorStoreService>;
    let interactionsSpy: jasmine.SpyObj<GameEditorInteractionsService>;

    let invSig: Signal<Inventory>;
    let tileSize = MOCK_TILE_SIZE;
    let activeToolState: ActiveTool | null = null;

    beforeEach(async () => {
        const inv: Inventory = {
            BOAT: { kind: 'BOAT', total: 1, remaining: 1, disabled: false, image: 'boat.png' },
            FLAG: { kind: 'FLAG', total: 2, remaining: 0, disabled: true, image: 'flag.png' },
        } as Inventory;

        invSig = signal<Inventory>(inv);
        tileSize = MOCK_TILE_SIZE;
        activeToolState = null;

        // IMPORTANT: donner au moins un nom de méthode (dummy) pour éviter l’erreur Jasmine
        storeSpy = jasmine.createSpyObj<GameEditorStoreService>('GameEditorStoreService', ['tileSizePx', 'inventory']);
        interactionsSpy = jasmine.createSpyObj<GameEditorInteractionsService>('GameEditorInteractionsService', [
            'setupObjectDrag',
            'revertToPreviousTool',
            'removeObject',
        ]);

        // Propriétés définies via defineProperty (getters/setters)
        Object.defineProperty(storeSpy, 'inventory', {
            get: (): Signal<Inventory> => invSig,
            configurable: true,
        });
        Object.defineProperty(storeSpy, 'tileSizePx', {
            get: (): number => tileSize,
            set: (v: number) => {
                tileSize = v;
            },
            configurable: true,
        });

        Object.defineProperty(interactionsSpy, 'activeTool', {
            get: (): ActiveTool | null => activeToolState,
            set: (t: ActiveTool | null) => {
                activeToolState = t;
            },
            configurable: true,
        });

        await TestBed.configureTestingModule({
            imports: [GameEditorInventoryComponent],
            providers: [
                { provide: GameEditorStoreService, useValue: storeSpy },
                { provide: GameEditorInteractionsService, useValue: interactionsSpy },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(GameEditorInventoryComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should expose inventory from store', () => {
        expect(component.inventory).toBe(invSig());
    });

    it('should expose tileSizePx from store', () => {
        expect(component.tileSizePx).toBe(MOCK_TILE_SIZE);
    });

    it('should reflect host CSS variable for tile size', () => {
        const host = fixture.nativeElement as HTMLElement;
        expect(getComputedStyle(host).getPropertyValue('--tile-px').trim()).toBe('64');

        storeSpy.tileSizePx = 72;
        fixture.detectChanges();

        expect(getComputedStyle(host).getPropertyValue('--tile-px').trim()).toBe('72');
    });

    it('should prevent and return on drag start when disabled', () => {
        const kind: PlaceableKind = PlaceableKind.BOAT;
        let prevented = false;

        const evt = makeDragEvent({
            dataTransfer: createDataTransferStub([], {}),
            preventDefault: (): void => {
                prevented = true;
            },
        });

        component.onDragStart(evt, kind, true);

        expect(prevented).toBeTrue();
        expect(interactionsSpy.setupObjectDrag).not.toHaveBeenCalled();
    });

    it('should return on drag start without dataTransfer', () => {
        const kind: PlaceableKind = PlaceableKind.BOAT;

        const evt = makeDragEvent({
            dataTransfer: null,
            preventDefault: NOOP,
        });

        component.onDragStart(evt, kind, false);

        expect(interactionsSpy.setupObjectDrag).not.toHaveBeenCalled();
    });

    it('should delegate to interactions on valid drag start', () => {
        const kind: PlaceableKind = PlaceableKind.BOAT;

        const evt = makeDragEvent({
            dataTransfer: createDataTransferStub([], {}),
            preventDefault: NOOP,
            offsetX: 0,
            offsetY: 0,
        });

        component.onDragStart(evt, kind, false);

        expect(interactionsSpy.setupObjectDrag).toHaveBeenCalledTimes(1);
    });

    it('should revert tool on drag end', () => {
        component.onDragEnd();
        expect(interactionsSpy.revertToPreviousTool).toHaveBeenCalledTimes(1);
    });

    it('should ignore slot drag over when no dataTransfer', () => {
        const kind: PlaceableKind = PlaceableKind.BOAT;
        let prevented = false;
        let stopped = false;

        const evt = makeDragEvent({
            dataTransfer: null,
            preventDefault: (): void => {
                prevented = true;
            },
            stopPropagation: (): void => {
                stopped = true;
            },
        });

        component.onSlotDragOver(evt, kind);

        expect(prevented).toBeTrue();
        expect(stopped).toBeTrue();
    });

    it('should not set dropEffect when slot does not accept', () => {
        const kind: PlaceableKind = PlaceableKind.BOAT;
        const dt = createDataTransferStub(['text/plain'], {});
        const evt = makeDragEvent({
            dataTransfer: dt,
            preventDefault: NOOP,
            stopPropagation: NOOP,
        });

        component.onSlotDragOver(evt, kind);

        expect(dt.dropEffect).toBe('none');
    });

    it('should set dropEffect to move when slot accepts', () => {
        const kind: PlaceableKind = PlaceableKind.BOAT;
        const mime = PlaceableMime[kind];
        const dt = createDataTransferStub([mime], {});
        const evt = makeDragEvent({
            dataTransfer: dt,
            preventDefault: NOOP,
            stopPropagation: NOOP,
        });

        component.onSlotDragOver(evt, kind);

        expect(dt.dropEffect).toBe('move');
    });

    it('should set dragOver on drag enter when accepted', () => {
        const kind: PlaceableKind = PlaceableKind.BOAT;
        const mime = PlaceableMime[kind];
        const dt = createDataTransferStub([mime], {});
        const evt = makeDragEvent({
            dataTransfer: dt,
            preventDefault: NOOP,
            stopPropagation: NOOP,
        });

        component.onSlotDragEnter(evt, kind);

        expect(component.dragOver).toBe(kind);
    });

    it('should not set dragOver on drag enter when not accepted', () => {
        const kind: PlaceableKind = PlaceableKind.BOAT;
        const dt = createDataTransferStub(['x'], {});
        const evt = makeDragEvent({
            dataTransfer: dt,
            preventDefault: NOOP,
            stopPropagation: NOOP,
        });

        component.onSlotDragEnter(evt, kind);

        expect(component.dragOver).toBe('');
    });

    it('should reset dragOver on drag leave', () => {
        component.dragOver = 'BOAT';
        component.onSlotDragLeave();
        expect(component.dragOver).toBe('');
    });

    it('should ignore slot drop without dataTransfer', () => {
        const kind: PlaceableKind = PlaceableKind.BOAT;
        const evt = makeDragEvent({
            dataTransfer: null,
            preventDefault: NOOP,
            stopPropagation: NOOP,
        });

        component.onSlotDrop(evt, kind);

        expect(interactionsSpy.removeObject).not.toHaveBeenCalled();
    });

    it('should ignore slot drop when no id in dataTransfer', () => {
        const kind: PlaceableKind = PlaceableKind.BOAT;
        const mime = PlaceableMime[kind];
        const dt = createDataTransferStub([mime], { [mime]: '' });
        const evt = makeDragEvent({
            dataTransfer: dt,
            preventDefault: NOOP,
            stopPropagation: NOOP,
        });

        component.onSlotDrop(evt, kind);

        expect(interactionsSpy.removeObject).not.toHaveBeenCalled();
    });

    it('should erase object on valid slot drop and clear dragOver', () => {
        const kind: PlaceableKind = PlaceableKind.BOAT;
        const mime = PlaceableMime[kind];
        const dt = createDataTransferStub([mime], { [mime]: 'obj-1' });
        const evt = makeDragEvent({
            dataTransfer: dt,
            preventDefault: NOOP,
            stopPropagation: NOOP,
        });

        component.dragOver = kind;
        component.onSlotDrop(evt, kind);

        expect(activeToolState?.type).toBe(ToolType.PlaceableEraserTool);
        expect(interactionsSpy.removeObject).toHaveBeenCalledWith('obj-1');
        expect(component.dragOver).toBe('');
    });

    it('should accept slot when mime matches kind (slotAccepts direct test)', () => {
        const kind: PlaceableKind = PlaceableKind.BOAT;
        const evt = makeDragEvent({ dataTransfer: null });

        const result = component['slotAccepts'](evt, kind);
        expect(result).toBeFalse();
    });
});
