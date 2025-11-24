/* eslint-disable max-lines -- Test file with comprehensive test coverage */
/* eslint-disable @typescript-eslint/naming-convention -- Test file uses mock objects with underscores */
/* eslint-disable @typescript-eslint/no-magic-numbers -- Test file uses literal values for assertions */
import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { GameEditorPlaceableDto } from '@app/dto/game-editor-placeable-dto';
import { GameEditorTileDto } from '@app/dto/game-editor-tile-dto';
import { PlaceableMime } from '@app/enums/placeable-mime.enum';
import { ActiveTool, ExtendedGameEditorPlaceableDto, TileBrushTool, ToolType } from '@app/interfaces/game-editor.interface';
import { AssetsService } from '@app/services/assets/assets.service';
import { GameEditorStoreService } from '@app/services/game-editor-store/game-editor-store.service';
import { GameEditorTeleportService } from '@app/services/game-editor-teleport/game-editor-teleport.service';
import { MapSize } from '@common/enums/map-size.enum';
import { PlaceableFootprint, PlaceableKind } from '@common/enums/placeable-kind.enum';
import { TileKind } from '@common/enums/tile.enum';
import { GameEditorInteractionsService } from './game-editor-interactions.service';

class StoreStub implements Partial<GameEditorStoreService> {
    private _tileSizePx = 32;
    private _size = MapSize.MEDIUM;

    private readonly tilesSig = signal<GameEditorTileDto[]>([]);
    private readonly placedObjectsSig = signal<GameEditorPlaceableDto[]>([]);

    get tileSizePx() {
        return this._tileSizePx;
    }
    set tileSizePx(value: number) {
        this._tileSizePx = value;
    }

    get tiles() {
        return this.tilesSig.asReadonly();
    }
    get placedObjects() {
        return this.placedObjectsSig() as ExtendedGameEditorPlaceableDto[];
    }

    setTiles(tiles: GameEditorTileDto[]) {
        this.tilesSig.set(tiles);
    }
    setPlacedObjects(list: GameEditorPlaceableDto[]) {
        this.placedObjectsSig.set(list);
    }
    setSize(size: number) {
        this._size = size;
    }

    getTileAt(x: number, y: number) {
        if (x < 0 || y < 0 || x >= this._size || y >= this._size) return undefined;
        const idx = y * this._size + x;
        return this.tilesSig()[idx];
    }

    setTileAt = jasmine.createSpy('setTileAt').and.callFake((x: number, y: number, kind: TileKind) => {
        const tiles = [...this.tilesSig()];
        const idx = y * this._size + x;
        if (idx >= 0 && idx < tiles.length) {
            tiles[idx] = { x, y, kind };
            this.tilesSig.set(tiles);
        }
    });

    getPlacedObjectAt = jasmine.createSpy('getPlacedObjectAt').and.callFake((x: number, y: number) => {
        return this.placedObjectsSig().find((object) => object.x === x && object.y === y);
    });

    placeObjectFromInventory = jasmine.createSpy('placeObjectFromInventory').and.callFake((kind: PlaceableKind, x: number, y: number) => {
        const placeableKind = PlaceableKind[kind] as unknown as PlaceableKind;
        const id = `${kind}-${x}-${y}`;
        this.setPlacedObjects([...this.placedObjectsSig(), { id, kind: placeableKind, x, y, placed: true, orientation: 'N' }]);
    });

    movePlacedObject = jasmine.createSpy('movePlacedObject').and.callFake((id: string, x: number, y: number) => {
        const list = this.placedObjectsSig().map((object) => (object.id === id ? { ...object, x, y } : object));
        this.setPlacedObjects(list);
    });

    removeObject = jasmine.createSpy('removeObject').and.callFake((id: string) => {
        this.setPlacedObjects(this.placedObjectsSig().filter((object) => object.id !== id));
    });
}

function makeTiles(size: number, kind: TileKind = TileKind.BASE): GameEditorTileDto[] {
    const tiles: GameEditorTileDto[] = [];
    for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) tiles.push({ x, y, kind });
    return tiles;
}

function makeDragEvent(
    opts: {
        types?: string[];
        dataByType?: Record<string, string>;
        offsetX?: number;
        offsetY?: number;
        effectAllowed?: string;
    } = {},
): DragEvent {
    const types = opts.types;
    const dataByType = opts.dataByType ?? {};
    const dataTransfer: DataTransfer = {
        dropEffect: 'none',
        effectAllowed: (opts.effectAllowed ?? 'all') as DataTransfer['effectAllowed'],
        files: {},
        items: {},
        types,
        // eslint-disable-next-line @typescript-eslint/no-empty-function -- Intentionally empty method for DataTransfer stub
        clearData: () => {},
        getData: (format: string) => dataByType[format] ?? '',
        setData: (format: string, data: string) => {
            dataByType[format] = data;
            (dataTransfer.types as string[]).push(format);
            return true;
        },
        // eslint-disable-next-line @typescript-eslint/no-empty-function -- Intentionally empty method for DataTransfer stub
        setDragImage: () => {},
        // eslint-disable-next-line @typescript-eslint/no-empty-function -- Intentionally empty method for DataTransfer stub
        addElement: () => {},
    } as unknown as DataTransfer;

    return {
        dataTransfer,
        offsetX: opts.offsetX ?? 0,
        offsetY: opts.offsetY ?? 0,
    } as DragEvent;
}

function makeDragEventWithSpies(opts: { offsetX?: number; offsetY?: number } = {}): DragEvent & {
    _spies: { setData: jasmine.Spy; getData: jasmine.Spy };
} {
    const store: Record<string, string> = {};
    const setData = jasmine.createSpy('setData').and.callFake((format: string, data: string) => {
        store[format] = data;
        dataTransfer.types.push(format);
        return true;
    });
    const getData = jasmine.createSpy('getData').and.callFake((format: string) => store[format] ?? '');

    const dataTransfer: Partial<DataTransfer> & { types: string[] } = {
        types: [],
        effectAllowed: 'all',
        setData,
        getData,
        // eslint-disable-next-line @typescript-eslint/no-empty-function -- Intentionally empty method for DataTransfer stub
        clearData: () => {},
        // eslint-disable-next-line @typescript-eslint/no-empty-function -- Intentionally empty method for DataTransfer stub
        setDragImage: () => {},
        dropEffect: 'none',
        files: {} as FileList,
        items: {} as DataTransferItemList,
    };

    const evt = {
        dataTransfer: dataTransfer as DataTransfer,
        offsetX: opts.offsetX ?? 0,
        offsetY: opts.offsetY ?? 0,
        _spies: { setData, getData },
    } as unknown as DragEvent & { _spies: { setData: jasmine.Spy; getData: jasmine.Spy } };

    return evt;
}

describe('GameEditorInteractionsService', () => {
    let service: GameEditorInteractionsService;
    let store: StoreStub;

    const SIZE = 10;

    beforeEach(() => {
        store = new StoreStub();
        store.setSize(SIZE);
        store.setTiles(makeTiles(SIZE, TileKind.BASE));
        store.tileSizePx = 50;

        const assetsServiceSpy = jasmine.createSpyObj('AssetsService', ['getTileImage']);
        assetsServiceSpy.getTileImage.and.returnValue('/assets/tiles/base.png');

        TestBed.configureTestingModule({
            providers: [
                GameEditorInteractionsService,
                { provide: GameEditorStoreService, useValue: store },
                { provide: AssetsService, useValue: assetsServiceSpy },
                {
                    provide: GameEditorTeleportService,
                    useValue: jasmine.createSpyObj('GameEditorTeleportService', [
                        'getAvailableTeleportChannels',
                        'getNextAvailableTeleportChannel',
                        'isTeleportDisabled',
                        'placeTeleportTile',
                        'cancelTeleportPlacement',
                        'removeTeleportPair',
                    ]),
                },
            ],
        });

        service = TestBed.inject(GameEditorInteractionsService);
    });

    it('should create', () => {
        expect(service).toBeTruthy();
    });

    describe('getToolbarBrushes', () => {
        it('returns one ToolbarItem per TileKind with correct image and class', () => {
            const brushes = service.getToolbarBrushes();
            expect(brushes.length).toBe(Object.keys(TileKind).length - 1);
            brushes.forEach((brush) => {
                expect(brush.image).toBeTruthy();
                expect(brush.class).toBe(brush.tileKind.toLowerCase());
                expect(brush.tileKind).toBe(TileKind[brush.tileKind]);
            });
        });
    });

    describe('setupObjectDrag', () => {
        it('sets effectAllowed="move" and sets the MIME when footprint > 0', () => {
            const obj: GameEditorPlaceableDto = { id: 'boat-1', kind: PlaceableKind.BOAT, x: 1, y: 1, placed: true, orientation: 'N' };
            spyOn(service, 'getFootprintOf').and.returnValue(2);

            const evt = makeDragEventWithSpies({ offsetX: 7, offsetY: 9 });
            service.setupObjectDrag(obj, evt);

            const mime = PlaceableMime[PlaceableKind.BOAT];
            expect(evt._spies.setData).toHaveBeenCalledWith(mime, 'boat-1');

            expect((evt.dataTransfer as DataTransfer).effectAllowed).toBe('move');

            expect(service.activeTool).toEqual(
                jasmine.objectContaining({
                    type: ToolType.PlaceableTool,
                    placeableKind: PlaceableKind.BOAT,
                }),
            );
            expect(service['objectGrabOffset']).toEqual({ x: 7, y: 9 });
        });

        it('empty id -> payload = kind (fallback), MIME set, but tool/offset only if footprint > 0', () => {
            const obj: GameEditorPlaceableDto = { id: '', kind: PlaceableKind.HEAL, x: 0, y: 0, placed: true, orientation: 'N' };
            spyOn(service, 'getFootprintOf').and.returnValue(1);

            const evt = makeDragEventWithSpies({ offsetX: 3, offsetY: 4 });
            service.setupObjectDrag(obj, evt);

            const mime = PlaceableMime[PlaceableKind.HEAL];
            expect(evt._spies.setData).toHaveBeenCalledWith(mime, PlaceableKind.HEAL as unknown as string);

            expect((evt.dataTransfer as DataTransfer).effectAllowed).toBe('move');
            expect(service.activeTool).toEqual(
                jasmine.objectContaining({
                    type: ToolType.PlaceableTool,
                    placeableKind: PlaceableKind.HEAL,
                }),
            );
            expect(service['objectGrabOffset']).toEqual({ x: 3, y: 4 });
        });

        it('footprint NaN -> MIME set, but tool/offset remain unchanged (early return)', () => {
            const obj: GameEditorPlaceableDto = { id: 'x', kind: PlaceableKind.START, x: 0, y: 0, placed: true, orientation: 'N' };
            spyOn(service, 'getFootprintOf').and.returnValue(NaN);

            const evt = makeDragEventWithSpies({ offsetX: 10, offsetY: 11 });
            service.setupObjectDrag(obj, evt);

            const mime = PlaceableMime[PlaceableKind.START];
            expect(evt._spies.setData).toHaveBeenCalledWith(mime, 'x');
            expect((evt.dataTransfer as DataTransfer).effectAllowed).toBe('move');

            expect(service.activeTool).toBeNull();
            expect(service['objectGrabOffset']).toEqual({ x: 0, y: 0 });
        });

        it('footprint <= 0 (0) -> MIME set, tool/offset unchanged', () => {
            const obj: GameEditorPlaceableDto = { id: 'x', kind: PlaceableKind.FLAG, x: 0, y: 0, placed: true, orientation: 'N' };
            spyOn(service, 'getFootprintOf').and.returnValue(0);

            const evt = makeDragEventWithSpies({ offsetX: 1, offsetY: 2 });
            service.setupObjectDrag(obj, evt);

            const mime = PlaceableMime[PlaceableKind.FLAG];
            expect(evt._spies.setData).toHaveBeenCalledWith(mime, 'x');
            expect((evt.dataTransfer as DataTransfer).effectAllowed).toBe('move');
            expect(service.activeTool).toBeNull();
            expect(service['objectGrabOffset']).toEqual({ x: 0, y: 0 });
        });

        it('footprint < 0 (-1) -> MIME set, tool/offset unchanged', () => {
            const obj: GameEditorPlaceableDto = { id: 'x', kind: PlaceableKind.FIGHT, x: 0, y: 0, placed: true, orientation: 'N' };
            spyOn(service, 'getFootprintOf').and.returnValue(-1);

            const evt = makeDragEventWithSpies({ offsetX: 5, offsetY: 6 });
            service.setupObjectDrag(obj, evt);

            const mime = PlaceableMime[PlaceableKind.FIGHT];
            expect(evt._spies.setData).toHaveBeenCalledWith(mime, 'x');
            expect((evt.dataTransfer as DataTransfer).effectAllowed).toBe('move');
            expect(service.activeTool).toBeNull();
            expect(service['objectGrabOffset']).toEqual({ x: 0, y: 0 });
        });

        it('no dataTransfer -> does nothing (complete no-op)', () => {
            const obj: GameEditorPlaceableDto = { id: 'id-1', kind: PlaceableKind.BOAT, x: 0, y: 0, placed: true, orientation: 'N' };
            const evt = { dataTransfer: null } as unknown as DragEvent;

            const spyFoot = spyOn(service, 'getFootprintOf').and.callThrough();

            service.setupObjectDrag(obj, evt);

            expect(spyFoot).not.toHaveBeenCalled();
            expect(service.activeTool).toBeNull();
            expect(service['objectGrabOffset']).toEqual({ x: 0, y: 0 });
        });

        it('checks that the MIME used matches PlaceableMime[object.kind]', () => {
            const obj: GameEditorPlaceableDto = { id: 'heal-42', kind: PlaceableKind.HEAL, x: 2, y: 2, placed: true, orientation: 'N' };
            spyOn(service, 'getFootprintOf').and.returnValue(1);

            const evt = makeDragEventWithSpies({ offsetX: 0, offsetY: 0 });
            service.setupObjectDrag(obj, evt);

            const expectedMime = PlaceableMime[PlaceableKind.HEAL];
            expect(evt._spies.setData).toHaveBeenCalledWith(expectedMime, 'heal-42');
        });
    });

    describe('tile brush drag lifecycle', () => {
        const makeTool = (overrides: Partial<TileBrushTool> = {}): ActiveTool => ({
            type: ToolType.TileBrushTool,
            tileKind: TileKind.BASE,
            leftDrag: false,
            rightDrag: false,
            ...overrides,
        });

        it('dragStart activates the leftDrag or rightDrag flag and paints the tile', () => {
            service.activeTool = makeTool({
                tileKind: TileKind.ICE,
            });
            service.dragStart(2, 3, 'left');

            expect(service.activeTool).toEqual(jasmine.objectContaining({ leftDrag: true }));
            expect(store.setTileAt).toHaveBeenCalledWith(2, 3, TileKind.ICE);

            service.activeTool = makeTool();
            service.dragStart(4, 5, 'right');
            expect(store.setTileAt).toHaveBeenCalledWith(4, 5, TileKind.BASE);
        });

        it('tilePaint removes the object if the painted tile is incompatible', () => {
            store.setPlacedObjects([{ id: 'boat-1', kind: PlaceableKind.BOAT, x: 1, y: 1, placed: true, orientation: 'N' }]);
            store.getPlacedObjectAt.calls.reset();
            store.removeObject.calls.reset();

            service.activeTool = makeTool({ leftDrag: true, tileKind: TileKind.WALL });
            service.tilePaint(1, 1);

            expect(store.setTileAt).toHaveBeenCalledWith(1, 1, TileKind.WALL);
            expect(store.getPlacedObjectAt).toHaveBeenCalledWith(1, 1);
            expect(store.removeObject).toHaveBeenCalledWith('boat-1');
        });

        it('dragEnd resets left/right drag', () => {
            service.activeTool = makeTool({ leftDrag: true, rightDrag: true });
            service.dragEnd();
            expect(service.activeTool).toEqual(jasmine.objectContaining({ leftDrag: false, rightDrag: false }));
        });

        it('tilePaint should early return if not TileBrushTool', () => {
            service.activeTool = {
                type: ToolType.PlaceableTool,
                placeableKind: PlaceableKind.BOAT,
            };
            store.setTileAt.calls.reset();
            service.tilePaint(1, 1);
            expect(store.setTileAt).not.toHaveBeenCalled();
        });

        it('tilePaint should early return if not dragging', () => {
            service.activeTool = makeTool({ leftDrag: false, rightDrag: false });
            store.setTileAt.calls.reset();
            service.tilePaint(1, 1);
            expect(store.setTileAt).not.toHaveBeenCalled();
        });

        it('tilePaint should remove object on tile if kind=WALL/DOOR or boat on non-water', () => {
            store.setPlacedObjects([{ id: 'obj-1', kind: PlaceableKind.BOAT, x: 3, y: 3, placed: true, orientation: 'N' }]);
            store.removeObject.calls.reset();
            store.getPlacedObjectAt.calls.reset();
            service.activeTool = makeTool({ leftDrag: true, tileKind: TileKind.WALL });
            service.tilePaint(3, 3);
            expect(store.getPlacedObjectAt).toHaveBeenCalledWith(3, 3);
            expect(store.removeObject).toHaveBeenCalledWith('obj-1');

            store.setPlacedObjects([{ id: 'obj-2', kind: PlaceableKind.BOAT, x: 4, y: 4, placed: true, orientation: 'N' }]);
            store.removeObject.calls.reset();
            store.getPlacedObjectAt.calls.reset();
            service.activeTool = makeTool({ leftDrag: true, tileKind: TileKind.DOOR });
            service.tilePaint(4, 4);
            expect(store.getPlacedObjectAt).toHaveBeenCalledWith(4, 4);
            expect(store.removeObject).toHaveBeenCalledWith('obj-2');

            store.setPlacedObjects([{ id: 'obj-3', kind: PlaceableKind.BOAT, x: 5, y: 5, placed: true, orientation: 'N' }]);
            store.removeObject.calls.reset();
            store.getPlacedObjectAt.calls.reset();
            service.activeTool = makeTool({ leftDrag: true, tileKind: TileKind.BASE });
            service.tilePaint(5, 5);
            expect(store.getPlacedObjectAt).toHaveBeenCalledWith(5, 5);
            expect(store.removeObject).toHaveBeenCalledWith('obj-3');

            store.setPlacedObjects([{ id: 'obj-4', kind: PlaceableKind.BOAT, x: 6, y: 6, placed: true, orientation: 'N' }]);
            store.removeObject.calls.reset();
            store.getPlacedObjectAt.calls.reset();
            service.activeTool = makeTool({ leftDrag: true, tileKind: TileKind.WATER });
            service.tilePaint(6, 6);
            expect(store.getPlacedObjectAt).toHaveBeenCalledWith(6, 6);
            expect(store.removeObject).not.toHaveBeenCalled();
        });

        it('dragStart should early return if not TileBrushTool', () => {
            service.activeTool = {
                type: ToolType.PlaceableTool,
                placeableKind: PlaceableKind.BOAT,
            };
            store.setTileAt.calls.reset();
            service.dragStart(1, 1, 'left');
            expect(store.setTileAt).not.toHaveBeenCalled();
        });

        it('dragEnd should early return if not TileBrushTool', () => {
            service.activeTool = {
                type: ToolType.PlaceableTool,
                placeableKind: PlaceableKind.BOAT,
            };
            store.setTileAt.calls.reset();
            service.dragEnd();
            expect(store.setTileAt).not.toHaveBeenCalled();
        });
    });

    describe('resolveHoveredTiles + drop', () => {
        it('calculates hoveredTiles according to footprint and centers placement via processDropTile', () => {
            service.activeTool = {
                type: ToolType.PlaceableTool,
                placeableKind: PlaceableKind.HEAL,
            };

            const evt = makeDragEvent({ offsetX: 25, offsetY: 25 });
            service.resolveHoveredTiles(evt, 5, 5);
            const hovered = service.hoveredTiles();
            expect(hovered).toBeTruthy();
            expect(hovered.length).toBe(4);

            const origin = service['objectDropVec2'];
            const includesOrigin = hovered.some((tile) => tile.x === origin.x && tile.y === origin.y);
            expect(includesOrigin).toBeTrue();
        });

        it('resolveDropAction places a new object from inventory (MIME = kind)', () => {
            service.activeTool = {
                type: ToolType.PlaceableTool,
                placeableKind: PlaceableKind.START,
            } as ActiveTool;
            service['objectDropVec2'] = { x: 2, y: 3 };

            const mime = PlaceableMime[PlaceableKind.START];
            const evt = makeDragEvent({ types: [mime], dataByType: { [mime]: PlaceableKind.START } });

            store.placeObjectFromInventory.calls.reset();
            service.resolveDropAction(evt);

            expect(store.placeObjectFromInventory).toHaveBeenCalledWith(PlaceableKind.START, 2, 3);
        });

        it('resolveDropAction moves an existing object (MIME = id)', () => {
            const obj: GameEditorPlaceableDto = { id: 'obj-1', kind: PlaceableKind.HEAL, x: 1, y: 1, placed: true, orientation: 'N' };
            store.setPlacedObjects([obj]);

            service['objectDropVec2'] = { x: 6, y: 7 };

            const mime = PlaceableMime[PlaceableKind.HEAL];
            const evt = makeDragEvent({ types: [mime], dataByType: { [mime]: 'obj-1' } });

            store.movePlacedObject.calls.reset();
            service.resolveDropAction(evt);

            expect(store.movePlacedObject).toHaveBeenCalledWith('obj-1', 6, 7);
        });

        it('ignore resolveDropAction if MIME not found', () => {
            store.placeObjectFromInventory.calls.reset();
            store.movePlacedObject.calls.reset();

            const evt = makeDragEvent({ types: ['text/plain'], dataByType: { 'text/plain': 'x' } });
            service.resolveDropAction(evt);

            expect(store.placeObjectFromInventory).not.toHaveBeenCalled();
            expect(store.movePlacedObject).not.toHaveBeenCalled();
        });

        it("resolveDropAction can't place a boat if tile is not water", () => {
            service.activeTool = {
                type: ToolType.PlaceableTool,
                placeableKind: PlaceableKind.BOAT,
            } as ActiveTool;
            service['objectDropVec2'] = { x: 4, y: 4 };
            store.setTileAt(4, 4, TileKind.BASE);
            const mime = PlaceableMime[PlaceableKind.BOAT];
            const evt = makeDragEvent({ types: [mime], dataByType: { [mime]: PlaceableKind.BOAT } });

            store.placeObjectFromInventory.calls.reset();
            service.resolveDropAction(evt);
        });

        it('resolveDropAction can place a boat if tile is water', () => {
            service.activeTool = {
                type: ToolType.PlaceableTool,
                placeableKind: PlaceableKind.BOAT,
            } as ActiveTool;
            service['objectDropVec2'] = { x: 4, y: 4 };
            store.setTileAt(4, 4, TileKind.WATER);
            const mime = PlaceableMime[PlaceableKind.BOAT];
            const evt = makeDragEvent({ types: [mime], dataByType: { [mime]: PlaceableKind.BOAT } });
            store.placeObjectFromInventory.calls.reset();
            service.resolveDropAction(evt);
            expect(store.placeObjectFromInventory).toHaveBeenCalledWith(PlaceableKind.BOAT, 4, 4);
        });

        it('resolveHoveredTiles should early return if not PlaceableTool', () => {
            service.activeTool = {
                type: ToolType.TileBrushTool,
                tileKind: TileKind.BASE,
                leftDrag: false,
                rightDrag: false,
            };
            store.setTileAt.calls.reset();
            const evt = makeDragEvent({ offsetX: 0, offsetY: 0 });
            service.resolveHoveredTiles(evt, 1, 1);
            expect(service.hoveredTiles()).toEqual([]);
        });

        it('resolveHoveredTiles should early return if tool=null', () => {
            service.activeTool = null as unknown as ActiveTool;
            const evt = makeDragEvent({ offsetX: 0, offsetY: 0 });
            service.resolveHoveredTiles(evt, 1, 1);
            expect(service.hoveredTiles()).toEqual([]);
        });

        it('resolveDropAction should early return if no data is found for mime', () => {
            service.activeTool = {
                type: ToolType.PlaceableTool,
                placeableKind: PlaceableKind.HEAL,
            } as ActiveTool;
            service['objectDropVec2'] = { x: 2, y: 3 };
            const mime = PlaceableMime[PlaceableKind.HEAL];
            const evt = makeDragEvent({ types: [mime] });
            service.resolveDropAction(evt);
            expect(store.placeObjectFromInventory).not.toHaveBeenCalled();
            expect(store.movePlacedObject).not.toHaveBeenCalled();
        });

        it('resolveDropAction should early return if index out of bounds for objectDropVec2', () => {
            service.activeTool = {
                type: ToolType.PlaceableTool,
                placeableKind: PlaceableKind.HEAL,
            } as ActiveTool;
            service['objectDropVec2'] = { x: -1, y: 3 };
            const mime = PlaceableMime[PlaceableKind.HEAL];
            const evt = makeDragEvent({ types: [mime], dataByType: { [mime]: PlaceableKind.HEAL } });
            service.resolveDropAction(evt);
            expect(store.placeObjectFromInventory).not.toHaveBeenCalled();
            expect(store.movePlacedObject).not.toHaveBeenCalled();
        });

        it('resolveDropAction should early return if one of the tiles on drop position is door / wall', () => {
            service.activeTool = {
                type: ToolType.PlaceableTool,
                placeableKind: PlaceableKind.HEAL,
            } as ActiveTool;
            service['objectDropVec2'] = { x: 2, y: 3 };
            store.setTileAt(2, 3, TileKind.WALL);
            const mime = PlaceableMime[PlaceableKind.HEAL];
            const evt = makeDragEvent({ types: [mime], dataByType: { [mime]: PlaceableKind.HEAL } });
            service.resolveDropAction(evt);
            expect(store.placeObjectFromInventory).not.toHaveBeenCalled();
            expect(store.movePlacedObject).not.toHaveBeenCalled();

            store.setTileAt(2, 3, TileKind.DOOR);
            service.resolveDropAction(evt);
            expect(store.placeObjectFromInventory).not.toHaveBeenCalled();
            expect(store.movePlacedObject).not.toHaveBeenCalled();
        });

        it('resolveDropAction should early return if an object is found at the drop position', () => {
            service.activeTool = {
                type: ToolType.PlaceableTool,
                placeableKind: PlaceableKind.HEAL,
            } as ActiveTool;
            store.setPlacedObjects([{ id: 'obj-1', kind: PlaceableKind.HEAL, x: 2, y: 3, placed: true, orientation: 'N' }]);
            service['objectDropVec2'] = { x: 2, y: 3 };
            const mime = PlaceableMime[PlaceableKind.HEAL];
            const evt = makeDragEvent({ types: [mime], dataByType: { [mime]: PlaceableKind.HEAL } });
            service.resolveDropAction(evt);
            expect(store.placeObjectFromInventory).not.toHaveBeenCalled();
            expect(store.movePlacedObject).not.toHaveBeenCalled();
        });

        it('resolveDropAction should call store.movePlacedObject if mime is id and object found at id', () => {
            const obj: GameEditorPlaceableDto = { id: 'obj-1', kind: PlaceableKind.HEAL, x: 1, y: 1, placed: true, orientation: 'N' };
            store.setPlacedObjects([obj]);
            service['objectDropVec2'] = { x: 6, y: 7 };

            const mime = PlaceableMime[PlaceableKind.HEAL];
            const evt = makeDragEvent({ types: [mime], dataByType: { [mime]: 'obj-1' } });
            store.movePlacedObject.calls.reset();
            service.resolveDropAction(evt);
            expect(store.movePlacedObject).toHaveBeenCalledWith('obj-1', 6, 7);
        });

        it('resolveDropAction should call store.placeObjectFromInventory if mime is kind and no object found at drop position', () => {
            service.activeTool = {
                type: ToolType.PlaceableTool,
                placeableKind: PlaceableKind.START,
            } as ActiveTool;
            service['objectDropVec2'] = { x: 2, y: 3 };
            const mime = PlaceableMime[PlaceableKind.START];
            const evt = makeDragEvent({ types: [mime], dataByType: { [mime]: PlaceableKind.START } });
            store.placeObjectFromInventory.calls.reset();
            service.resolveDropAction(evt);
            expect(store.placeObjectFromInventory).toHaveBeenCalledWith(PlaceableKind.START, 2, 3);
        });

        it("resolveDropAction shouldn't move object if id is not found", () => {
            const obj: GameEditorPlaceableDto = { id: 'obj-1', kind: PlaceableKind.HEAL, x: 1, y: 1, placed: true, orientation: 'N' };
            store.setPlacedObjects([obj]);
            service['objectDropVec2'] = { x: 6, y: 7 };
            const mime = PlaceableMime[PlaceableKind.HEAL];
            const evt = makeDragEvent({ types: [mime], dataByType: { [mime]: 'unknown-id' } });
            store.movePlacedObject.calls.reset();
            service.resolveDropAction(evt);
            expect(store.movePlacedObject).not.toHaveBeenCalled();
        });

        it("resolveDropAction shouldn't move object if drop position is occupied", () => {
            const obj: GameEditorPlaceableDto = { id: 'obj-1', kind: PlaceableKind.HEAL, x: 1, y: 1, placed: true, orientation: 'N' };
            store.setPlacedObjects([obj, { id: 'obj-2', kind: PlaceableKind.FIGHT, x: 6, y: 7, placed: true, orientation: 'N' }]);
            service['objectDropVec2'] = { x: 6, y: 7 };
            const mime = PlaceableMime[PlaceableKind.HEAL];
            const evt = makeDragEvent({ types: [mime], dataByType: { [mime]: 'obj-1' } });
            store.movePlacedObject.calls.reset();
            service.resolveDropAction(evt);
            expect(store.movePlacedObject).not.toHaveBeenCalled();
        });

        it("resolveDropAction shouldn't place object if drop position is occupied", () => {
            store.setPlacedObjects([{ id: 'obj-2', kind: PlaceableKind.FIGHT, x: 6, y: 7, placed: true, orientation: 'N' }]);
            service.activeTool = {
                type: ToolType.PlaceableTool,
                placeableKind: PlaceableKind.HEAL,
            } as ActiveTool;
            service['objectDropVec2'] = { x: 6, y: 7 };
            const mime = PlaceableMime[PlaceableKind.HEAL];
            const evt = makeDragEvent({ types: [mime], dataByType: { [mime]: PlaceableKind.HEAL } });
            store.placeObjectFromInventory.calls.reset();
            service.resolveDropAction(evt);
            expect(store.placeObjectFromInventory).not.toHaveBeenCalled();
        });
    });

    describe('removeObject (eraser)', () => {
        it('removes only when the eraser tool is active and restores the previous tool', () => {
            service.activeTool = { type: ToolType.TileBrushTool, tileKind: TileKind.BASE, leftDrag: false, rightDrag: false };

            service.revertToPreviousTool();
            service.activeTool = { type: ToolType.PlaceableEraserTool } as ActiveTool;

            store.removeObject.calls.reset();
            service.removeObject('id-123');

            expect(store.removeObject).toHaveBeenCalledWith('id-123');
        });

        it('does not remove if the eraser tool is not active', () => {
            service.activeTool = { type: ToolType.TileBrushTool, tileKind: TileKind.BASE, leftDrag: false, rightDrag: false };
            store.removeObject.calls.reset();

            service.removeObject('id-456');
            expect(store.removeObject).not.toHaveBeenCalled();
        });

        it('removes the object based on the _draggedObject signal if id is not provided', () => {
            const obj: GameEditorPlaceableDto = { id: 'obj-1', kind: PlaceableKind.HEAL, x: 1, y: 1, placed: true, orientation: 'N' };
            store.setPlacedObjects([obj]);
            service['_draggedObject'].set(obj.id);

            service.activeTool = { type: ToolType.PlaceableEraserTool };
            store.removeObject.calls.reset();
            service.removeObject();
            expect(store.removeObject).toHaveBeenCalledWith('obj-1');
        });
    });

    describe('hasMime', () => {
        it('returns true if one of the types matches a PlaceableMime', () => {
            const someMime = Object.values(PlaceableMime)[0] as string;
            const evt = makeDragEvent({ types: [someMime] });
            expect(service.hasMime(evt)).toBeTrue();
        });

        it('returns false otherwise', () => {
            const evt = makeDragEvent({ types: ['text/plain'] });
            expect(service.hasMime(evt)).toBeFalse();
        });

        it('should return false if no mime at all', () => {
            const evt = makeDragEvent();
            expect(service.hasMime(evt)).toBeFalse();
        });
    });

    describe('getFootprintOf', () => {
        it('returns the declared footprint', () => {
            expect(service.getFootprintOf(PlaceableKind.FIGHT)).toBe(PlaceableFootprint[PlaceableKind.FIGHT]);
            expect(service.getFootprintOf(PlaceableKind.BOAT)).toBe(PlaceableFootprint[PlaceableKind.BOAT]);
            expect(service.getFootprintOf(PlaceableKind.START)).toBe(PlaceableFootprint[PlaceableKind.START]);
            expect(service.getFootprintOf(PlaceableKind.FLAG)).toBe(PlaceableFootprint[PlaceableKind.FLAG]);
            expect(service.getFootprintOf(PlaceableKind.HEAL)).toBe(PlaceableFootprint[PlaceableKind.HEAL]);
        });
    });

    describe('selectTeleportTool', () => {
        it('sets activeTool to TeleportTileTool when channel is available', () => {
            const teleportService = TestBed.inject(GameEditorTeleportService);
            const mockChannel = { channelNumber: 1, tiles: { entryA: { x: 0, y: 0 }, entryB: { x: 1, y: 1 } } };
            (teleportService.getNextAvailableTeleportChannel as jasmine.Spy).and.returnValue(mockChannel);

            service.selectTeleportTool();

            expect(service.activeTool).toEqual({
                type: ToolType.TeleportTileTool,
                channelNumber: 1,
                teleportChannel: mockChannel,
            });
        });

        it('does nothing when no channel is available', () => {
            const teleportService = TestBed.inject(GameEditorTeleportService);
            (teleportService.getNextAvailableTeleportChannel as jasmine.Spy).and.returnValue(undefined);

            service.activeTool = null;
            service.selectTeleportTool();

            expect(service.activeTool).toBeNull();
        });
    });

    describe('selectTeleportTileEraserTool', () => {
        it('sets activeTool to TeleportTileEraserTool', () => {
            service.selectTeleportTileEraserTool();

            expect(service.activeTool).toEqual({
                type: ToolType.TeleportTileEraserTool,
            });
        });
    });

    describe('cancelTeleportPlacement', () => {
        it('cancels teleport placement and selects teleport tool when TeleportTileTool is active', () => {
            const teleportService = TestBed.inject(GameEditorTeleportService);
            const mockChannel = { channelNumber: 2, tiles: { entryA: { x: 0, y: 0 }, entryB: { x: 1, y: 1 } } };
            (teleportService.getNextAvailableTeleportChannel as jasmine.Spy).and.returnValue(mockChannel);

            service.activeTool = {
                type: ToolType.TeleportTileTool,
                channelNumber: 2,
                teleportChannel: mockChannel,
            };

            service.cancelTeleportPlacement();

            expect(teleportService.cancelTeleportPlacement).toHaveBeenCalledWith(2);
            expect(service.activeTool).toEqual({
                type: ToolType.TeleportTileTool,
                channelNumber: 2,
                teleportChannel: mockChannel,
            });
        });

        it('does nothing when tool is not TeleportTileTool', () => {
            const teleportService = TestBed.inject(GameEditorTeleportService);
            service.activeTool = {
                type: ToolType.TileBrushTool,
                tileKind: TileKind.BASE,
                leftDrag: false,
                rightDrag: false,
            };

            service.cancelTeleportPlacement();

            expect(teleportService.cancelTeleportPlacement).not.toHaveBeenCalled();
        });

        it('does nothing when tool is null', () => {
            const teleportService = TestBed.inject(GameEditorTeleportService);
            service.activeTool = null;

            service.cancelTeleportPlacement();

            expect(teleportService.cancelTeleportPlacement).not.toHaveBeenCalled();
        });
    });

    describe('handleTeleportTileClick', () => {
        it('places first tile when firstTilePlaced is not set', () => {
            const teleportService = TestBed.inject(GameEditorTeleportService);
            const mockChannel = { channelNumber: 1, tiles: { entryA: { x: 0, y: 0 }, entryB: { x: 1, y: 1 } } };

            service.activeTool = {
                type: ToolType.TeleportTileTool,
                channelNumber: 1,
                teleportChannel: mockChannel,
            };

            service.dragStart(5, 6, 'left');

            expect(teleportService.placeTeleportTile).toHaveBeenCalledWith(5, 6, 1, true);
            expect(service.activeTool).toEqual(
                jasmine.objectContaining({
                    type: ToolType.TeleportTileTool,
                    channelNumber: 1,
                    firstTilePlaced: { x: 5, y: 6 },
                }),
            );
        });

        it('places second tile and selects next channel when available', () => {
            const teleportService = TestBed.inject(GameEditorTeleportService);
            const mockChannel1 = { channelNumber: 1, tiles: { entryA: { x: 0, y: 0 }, entryB: { x: 1, y: 1 } } };
            const mockChannel2 = { channelNumber: 2, tiles: { entryA: { x: 2, y: 2 }, entryB: { x: 3, y: 3 } } };
            (teleportService.getNextAvailableTeleportChannel as jasmine.Spy).and.returnValue(mockChannel2);

            service.activeTool = {
                type: ToolType.TeleportTileTool,
                channelNumber: 1,
                teleportChannel: mockChannel1,
                firstTilePlaced: { x: 5, y: 6 },
            };

            service.dragStart(7, 8, 'left');

            expect(teleportService.placeTeleportTile).toHaveBeenCalledWith(7, 8, 1, false);
            expect(service.activeTool).toEqual({
                type: ToolType.TeleportTileTool,
                channelNumber: 2,
                teleportChannel: mockChannel2,
            });
        });

        it('places second tile and sets tool to null when no next channel available', () => {
            const teleportService = TestBed.inject(GameEditorTeleportService);
            const mockChannel1 = { channelNumber: 1, tiles: { entryA: { x: 0, y: 0 }, entryB: { x: 1, y: 1 } } };
            (teleportService.getNextAvailableTeleportChannel as jasmine.Spy).and.returnValue(undefined);

            service.activeTool = {
                type: ToolType.TeleportTileTool,
                channelNumber: 1,
                teleportChannel: mockChannel1,
                firstTilePlaced: { x: 5, y: 6 },
            };

            service.dragStart(7, 8, 'left');

            expect(teleportService.placeTeleportTile).toHaveBeenCalledWith(7, 8, 1, false);
            expect(service.activeTool).toBeNull();
        });

        it('does nothing when tool is null', () => {
            const teleportService = TestBed.inject(GameEditorTeleportService);
            service.activeTool = null;

            service.dragStart(5, 6, 'left');

            expect(teleportService.placeTeleportTile).not.toHaveBeenCalled();
        });

        it('does nothing when tool is not TeleportTileTool', () => {
            const teleportService = TestBed.inject(GameEditorTeleportService);
            service.activeTool = {
                type: ToolType.TileBrushTool,
                tileKind: TileKind.BASE,
                leftDrag: false,
                rightDrag: false,
            };

            service.dragStart(5, 6, 'left');

            expect(teleportService.placeTeleportTile).not.toHaveBeenCalled();
        });
    });

    describe('handleTeleportTileRightClick', () => {
        it('cancels teleport placement when TeleportTileTool with firstTilePlaced is active', () => {
            const teleportService = TestBed.inject(GameEditorTeleportService);
            const mockChannel = { channelNumber: 1, tiles: { entryA: { x: 0, y: 0 }, entryB: { x: 1, y: 1 } } };
            (teleportService.getNextAvailableTeleportChannel as jasmine.Spy).and.returnValue(mockChannel);

            service.activeTool = {
                type: ToolType.TeleportTileTool,
                channelNumber: 1,
                teleportChannel: mockChannel,
                firstTilePlaced: { x: 5, y: 6 },
            };

            // Call the private method directly to test this branch
            (service as any).handleTeleportTileRightClick(7, 8);

            expect(teleportService.cancelTeleportPlacement).toHaveBeenCalledWith(1);
        });

        it('removes teleport pair when tile is TELEPORT with teleportChannel', () => {
            const teleportService = TestBed.inject(GameEditorTeleportService);
            const mockChannel = { channelNumber: 2, tiles: { entryA: { x: 0, y: 0 }, entryB: { x: 1, y: 1 } } };
            (teleportService.getNextAvailableTeleportChannel as jasmine.Spy).and.returnValue(mockChannel);

            const tiles = makeTiles(SIZE, TileKind.BASE);
            const idx = 4 * SIZE + 3;
            tiles[idx] = { x: 3, y: 4, kind: TileKind.TELEPORT, teleportChannel: 1 };
            store.setTiles(tiles);

            service.activeTool = {
                type: ToolType.TeleportTileEraserTool,
            };

            service.dragStart(3, 4, 'right');

            expect(teleportService.removeTeleportPair).toHaveBeenCalledWith(3, 4);
        });

        it('selects next channel after removing teleport pair when TeleportTileTool is active', () => {
            const teleportService = TestBed.inject(GameEditorTeleportService);
            const mockChannel = { channelNumber: 2, tiles: { entryA: { x: 0, y: 0 }, entryB: { x: 1, y: 1 } } };
            (teleportService.getNextAvailableTeleportChannel as jasmine.Spy).and.returnValue(mockChannel);

            const tiles = makeTiles(SIZE, TileKind.BASE);
            const idx = 4 * SIZE + 3;
            tiles[idx] = { x: 3, y: 4, kind: TileKind.TELEPORT, teleportChannel: 1 };
            store.setTiles(tiles);

            // Tool without firstTilePlaced so it doesn't cancel immediately
            service.activeTool = {
                type: ToolType.TeleportTileTool,
                channelNumber: 1,
                teleportChannel: { channelNumber: 1, tiles: { entryA: { x: 0, y: 0 }, entryB: { x: 1, y: 1 } } },
            };

            // Call the private method directly to test this branch
            (service as any).handleTeleportTileRightClick(3, 4);

            expect(teleportService.removeTeleportPair).toHaveBeenCalledWith(3, 4);
            expect(service.activeTool).toEqual(
                jasmine.objectContaining({
                    type: ToolType.TeleportTileTool,
                    channelNumber: 2,
                    teleportChannel: mockChannel,
                }),
            );
        });

        it('sets tool to null after removing teleport pair when no next channel available', () => {
            const teleportService = TestBed.inject(GameEditorTeleportService);
            (teleportService.getNextAvailableTeleportChannel as jasmine.Spy).and.returnValue(undefined);

            const tiles = makeTiles(SIZE, TileKind.BASE);
            const idx = 4 * SIZE + 3;
            tiles[idx] = { x: 3, y: 4, kind: TileKind.TELEPORT, teleportChannel: 1 };
            store.setTiles(tiles);

            // Tool without firstTilePlaced so it doesn't cancel immediately
            service.activeTool = {
                type: ToolType.TeleportTileTool,
                channelNumber: 1,
                teleportChannel: { channelNumber: 1, tiles: { entryA: { x: 0, y: 0 }, entryB: { x: 1, y: 1 } } },
            };

            // Call the private method directly to test this branch
            (service as any).handleTeleportTileRightClick(3, 4);

            expect(teleportService.removeTeleportPair).toHaveBeenCalledWith(3, 4);
            expect(service.activeTool).toBeNull();
        });

        it('does nothing when tile is not TELEPORT', () => {
            const teleportService = TestBed.inject(GameEditorTeleportService);
            store.setTileAt(3, 4, TileKind.BASE);

            service.activeTool = {
                type: ToolType.TeleportTileEraserTool,
            };

            service.dragStart(3, 4, 'right');

            expect(teleportService.removeTeleportPair).not.toHaveBeenCalled();
        });

        it('does nothing when tile has no teleportChannel', () => {
            const teleportService = TestBed.inject(GameEditorTeleportService);
            const tiles = makeTiles(SIZE, TileKind.BASE);
            const idx = 4 * SIZE + 3;
            tiles[idx] = { x: 3, y: 4, kind: TileKind.TELEPORT };
            store.setTiles(tiles);

            service.activeTool = {
                type: ToolType.TeleportTileEraserTool,
            };

            service.dragStart(3, 4, 'right');

            expect(teleportService.removeTeleportPair).not.toHaveBeenCalled();
        });
    });

    describe('dragStart with teleport tools', () => {
        it('calls handleTeleportTileClick when TeleportTileTool is active', () => {
            const teleportService = TestBed.inject(GameEditorTeleportService);
            const mockChannel = { channelNumber: 1, tiles: { entryA: { x: 0, y: 0 }, entryB: { x: 1, y: 1 } } };
            (teleportService.getNextAvailableTeleportChannel as jasmine.Spy).and.returnValue(mockChannel);

            service.activeTool = {
                type: ToolType.TeleportTileTool,
                channelNumber: 1,
                teleportChannel: mockChannel,
            };

            service.dragStart(5, 6, 'left');

            expect(teleportService.placeTeleportTile).toHaveBeenCalled();
        });

        it('calls handleTeleportTileRightClick when TeleportTileEraserTool is active', () => {
            const teleportService = TestBed.inject(GameEditorTeleportService);
            const tiles = makeTiles(SIZE, TileKind.BASE);
            const idx = 4 * SIZE + 3;
            tiles[idx] = { x: 3, y: 4, kind: TileKind.TELEPORT, teleportChannel: 1 };
            store.setTiles(tiles);

            service.activeTool = {
                type: ToolType.TeleportTileEraserTool,
            };

            service.dragStart(3, 4, 'right');

            expect(teleportService.removeTeleportPair).toHaveBeenCalled();
        });
    });

    describe('revertToPreviousTool', () => {
        it('selects teleport tool when reverting from TeleportTileEraserTool to TeleportTileTool', () => {
            const teleportService = TestBed.inject(GameEditorTeleportService);
            const mockChannel = { channelNumber: 1, tiles: { entryA: { x: 0, y: 0 }, entryB: { x: 1, y: 1 } } };
            (teleportService.getNextAvailableTeleportChannel as jasmine.Spy).and.returnValue(mockChannel);

            const previousTool: ActiveTool = {
                type: ToolType.TeleportTileTool,
                channelNumber: 1,
                teleportChannel: mockChannel,
            };

            service.activeTool = previousTool;
            service.activeTool = { type: ToolType.TeleportTileEraserTool };

            service.revertToPreviousTool();

            expect(service.activeTool).toEqual(
                jasmine.objectContaining({
                    type: ToolType.TeleportTileTool,
                    channelNumber: 1,
                    teleportChannel: mockChannel,
                }),
            );
        });

        it('reverts to previous tool normally when not TeleportTileEraserTool', () => {
            const previousTool: ActiveTool = {
                type: ToolType.TileBrushTool,
                tileKind: TileKind.BASE,
                leftDrag: false,
                rightDrag: false,
            };

            service.activeTool = previousTool;
            service.activeTool = {
                type: ToolType.PlaceableTool,
                placeableKind: PlaceableKind.HEAL,
            };

            service.revertToPreviousTool();

            expect(service.activeTool).toEqual(jasmine.objectContaining(previousTool));
        });
    });

    describe('activeTool setter', () => {
        it('cancels teleport placement when switching away from TeleportTileTool', () => {
            const teleportService = TestBed.inject(GameEditorTeleportService);
            const mockChannel = { channelNumber: 1, tiles: { entryA: { x: 0, y: 0 }, entryB: { x: 1, y: 1 } } };

            service.activeTool = {
                type: ToolType.TeleportTileTool,
                channelNumber: 1,
                teleportChannel: mockChannel,
            };

            service.activeTool = {
                type: ToolType.TileBrushTool,
                tileKind: TileKind.BASE,
                leftDrag: false,
                rightDrag: false,
            };

            expect(teleportService.cancelTeleportPlacement).toHaveBeenCalledWith(1);
        });

        it('does not cancel when switching to TeleportTileTool', () => {
            const teleportService = TestBed.inject(GameEditorTeleportService);
            const mockChannel = { channelNumber: 1, tiles: { entryA: { x: 0, y: 0 }, entryB: { x: 1, y: 1 } } };

            service.activeTool = {
                type: ToolType.TeleportTileTool,
                channelNumber: 1,
                teleportChannel: mockChannel,
            };

            (teleportService.cancelTeleportPlacement as jasmine.Spy).calls.reset();

            service.activeTool = {
                type: ToolType.TeleportTileTool,
                channelNumber: 2,
                teleportChannel: { channelNumber: 2, tiles: { entryA: { x: 0, y: 0 }, entryB: { x: 1, y: 1 } } },
            };

            expect(teleportService.cancelTeleportPlacement).not.toHaveBeenCalled();
        });

        it('does not cancel when current tool is null', () => {
            const teleportService = TestBed.inject(GameEditorTeleportService);
            service.activeTool = null;

            service.activeTool = {
                type: ToolType.TileBrushTool,
                tileKind: TileKind.BASE,
                leftDrag: false,
                rightDrag: false,
            };

            expect(teleportService.cancelTeleportPlacement).not.toHaveBeenCalled();
        });
    });
});
