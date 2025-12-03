/* eslint-disable max-lines -- Test file with comprehensive test coverage */
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TeleportChannelDto } from '@app/dto/teleport-channel-dto';
import { TeleportTilesDto } from '@app/dto/teleport-tiles-dto';
import { TileLabel } from '@app/enums/tile-label.enum';
import { ActiveTool, ToolbarItem, ToolType } from '@app/interfaces/game-editor.interface';
import { GameEditorInteractionsService } from '@app/services/game-editor-interactions/game-editor-interactions.service';
import { GameEditorTeleportService } from '@app/services/game-editor-teleport/game-editor-teleport.service';
import { TileKind } from '@common/enums/tile.enum';
import { GameEditorToolbarComponent } from './game-editor-toolbar.component';

const TEST_CHANNEL_NUMBER_1 = 1;
const TEST_CHANNEL_NUMBER_2 = 2;
const TEST_TILE_IMAGE_WATER = '/assets/tiles/water.png';
const TEST_TILE_IMAGE_WALL = '/assets/tiles/wall.png';
const TEST_TILE_IMAGE_TELEPORT = '/assets/tiles/teleport.png';
const TEST_TILE_CLASS_WATER = 'water';
const TEST_TILE_CLASS_WALL = 'wall';
const TEST_TILE_CLASS_TELEPORT = 'teleport';
const TEST_CHANNELS_COUNT_ZERO = 0;
const TEST_CHANNELS_COUNT_ONE = 1;
const TEST_CHANNELS_COUNT_TWO = 2;
const TEST_LEFT_DRAG_FALSE = false;
const TEST_RIGHT_DRAG_FALSE = false;

type MockGameEditorInteractionsService = {
    getToolbarBrushes: jasmine.Spy;
    selectTeleportTool: jasmine.Spy;
    activeTool: ActiveTool | null;
};

type MockGameEditorTeleportService = {
    isTeleportDisabled: jasmine.Spy;
    getAvailableTeleportChannels: jasmine.Spy;
};

const CREATE_MOCK_TOOLBAR_ITEM = (tileKind: TileKind, image: string, className: string): ToolbarItem => ({
    image,
    tileKind,
    class: className,
});

const CREATE_MOCK_TELEPORT_CHANNEL = (channelNumber: number, tiles?: TeleportTilesDto): TeleportChannelDto => ({
    channelNumber,
    tiles: tiles || { entryA: undefined, entryB: undefined },
});

describe('GameEditorToolbarComponent', () => {
    let component: GameEditorToolbarComponent;
    let fixture: ComponentFixture<GameEditorToolbarComponent>;
    let mockGameEditorInteractionsService: MockGameEditorInteractionsService;
    let mockGameEditorTeleportService: MockGameEditorTeleportService;

    beforeEach(async () => {
        const mockBrushes: ToolbarItem[] = [
            CREATE_MOCK_TOOLBAR_ITEM(TileKind.WATER, TEST_TILE_IMAGE_WATER, TEST_TILE_CLASS_WATER),
            CREATE_MOCK_TOOLBAR_ITEM(TileKind.WALL, TEST_TILE_IMAGE_WALL, TEST_TILE_CLASS_WALL),
            CREATE_MOCK_TOOLBAR_ITEM(TileKind.TELEPORT, TEST_TILE_IMAGE_TELEPORT, TEST_TILE_CLASS_TELEPORT),
        ];

        mockGameEditorInteractionsService = {
            getToolbarBrushes: jasmine.createSpy('getToolbarBrushes').and.returnValue(mockBrushes),
            selectTeleportTool: jasmine.createSpy('selectTeleportTool'),
            activeTool: null,
        };

        mockGameEditorTeleportService = {
            isTeleportDisabled: jasmine.createSpy('isTeleportDisabled').and.returnValue(false),
            getAvailableTeleportChannels: jasmine.createSpy('getAvailableTeleportChannels').and.returnValue([]),
        };

        await TestBed.configureTestingModule({
            imports: [GameEditorToolbarComponent],
            providers: [
                { provide: GameEditorInteractionsService, useValue: mockGameEditorInteractionsService },
                { provide: GameEditorTeleportService, useValue: mockGameEditorTeleportService },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(GameEditorToolbarComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    describe('tileLabel', () => {
        it('should expose TileLabel enum', () => {
            expect(component.tileLabel).toBe(TileLabel);
        });
    });

    describe('tileKind', () => {
        it('should expose TileKind enum', () => {
            expect(component.tileKind).toBe(TileKind);
        });
    });

    describe('brushes', () => {
        beforeEach(() => {
            mockGameEditorInteractionsService.getToolbarBrushes.calls.reset();
        });

        it('should return brushes from gameEditorInteractionsService', () => {
            const result = component.brushes;

            const expectedBrushesCount = 3;
            expect(mockGameEditorInteractionsService.getToolbarBrushes).toHaveBeenCalled();
            expect(result.length).toBe(expectedBrushesCount);
            expect(result[0].tileKind).toBe(TileKind.WATER);
            expect(result[1].tileKind).toBe(TileKind.WALL);
            expect(result[2].tileKind).toBe(TileKind.TELEPORT);
        });

        it('should return empty array when gameEditorInteractionsService returns empty array', () => {
            mockGameEditorInteractionsService.getToolbarBrushes.and.returnValue([]);

            const result = component.brushes;

            expect(mockGameEditorInteractionsService.getToolbarBrushes).toHaveBeenCalled();
            expect(result).toEqual([]);
            expect(result.length).toBe(TEST_CHANNELS_COUNT_ZERO);
        });
    });

    describe('selectTileBrush', () => {
        beforeEach(() => {
            mockGameEditorInteractionsService.selectTeleportTool.calls.reset();
        });

        it('should call selectTeleportTool when tileKind is TELEPORT', () => {
            component.selectTileBrush(TileKind.TELEPORT);

            expect(mockGameEditorInteractionsService.selectTeleportTool).toHaveBeenCalledTimes(1);
            expect(mockGameEditorInteractionsService.activeTool).toBeNull();
        });

        it('should set activeTool to TileBrushTool when tileKind is WATER', () => {
            component.selectTileBrush(TileKind.WATER);

            expect(mockGameEditorInteractionsService.selectTeleportTool).not.toHaveBeenCalled();
            const expectedTool: ActiveTool = {
                type: ToolType.TileBrushTool,
                tileKind: TileKind.WATER,
                leftDrag: TEST_LEFT_DRAG_FALSE,
                rightDrag: TEST_RIGHT_DRAG_FALSE,
            };
            expect(mockGameEditorInteractionsService.activeTool).toEqual(expectedTool);
        });

        it('should set activeTool to TileBrushTool when tileKind is WALL', () => {
            component.selectTileBrush(TileKind.WALL);

            expect(mockGameEditorInteractionsService.selectTeleportTool).not.toHaveBeenCalled();
            const expectedTool: ActiveTool = {
                type: ToolType.TileBrushTool,
                tileKind: TileKind.WALL,
                leftDrag: TEST_LEFT_DRAG_FALSE,
                rightDrag: TEST_RIGHT_DRAG_FALSE,
            };
            expect(mockGameEditorInteractionsService.activeTool).toEqual(expectedTool);
        });

        it('should set activeTool to TileBrushTool when tileKind is ICE', () => {
            component.selectTileBrush(TileKind.ICE);

            expect(mockGameEditorInteractionsService.selectTeleportTool).not.toHaveBeenCalled();
            const expectedTool: ActiveTool = {
                type: ToolType.TileBrushTool,
                tileKind: TileKind.ICE,
                leftDrag: TEST_LEFT_DRAG_FALSE,
                rightDrag: TEST_RIGHT_DRAG_FALSE,
            };
            expect(mockGameEditorInteractionsService.activeTool).toEqual(expectedTool);
        });

        it('should set activeTool to TileBrushTool when tileKind is DOOR', () => {
            component.selectTileBrush(TileKind.DOOR);

            expect(mockGameEditorInteractionsService.selectTeleportTool).not.toHaveBeenCalled();
            const expectedTool: ActiveTool = {
                type: ToolType.TileBrushTool,
                tileKind: TileKind.DOOR,
                leftDrag: TEST_LEFT_DRAG_FALSE,
                rightDrag: TEST_RIGHT_DRAG_FALSE,
            };
            expect(mockGameEditorInteractionsService.activeTool).toEqual(expectedTool);
        });
    });

    describe('isTeleportDisabled', () => {
        beforeEach(() => {
            mockGameEditorTeleportService.isTeleportDisabled.calls.reset();
        });

        it('should return true when teleportService.isTeleportDisabled returns true', () => {
            mockGameEditorTeleportService.isTeleportDisabled.and.returnValue(true);

            const result = component.isTeleportDisabled();

            expect(mockGameEditorTeleportService.isTeleportDisabled).toHaveBeenCalledTimes(1);
            expect(result).toBe(true);
        });

        it('should return false when teleportService.isTeleportDisabled returns false', () => {
            mockGameEditorTeleportService.isTeleportDisabled.and.returnValue(false);

            const result = component.isTeleportDisabled();

            expect(mockGameEditorTeleportService.isTeleportDisabled).toHaveBeenCalledTimes(1);
            expect(result).toBe(false);
        });
    });

    describe('isTeleportSelected', () => {
        it('should return true when activeTool is TeleportTileTool', () => {
            const teleportChannel = CREATE_MOCK_TELEPORT_CHANNEL(TEST_CHANNEL_NUMBER_1);
            const teleportTool: ActiveTool = {
                type: ToolType.TeleportTileTool,
                channelNumber: TEST_CHANNEL_NUMBER_1,
                teleportChannel,
            };
            mockGameEditorInteractionsService.activeTool = teleportTool;

            const result = component.isTeleportSelected();

            expect(result).toBe(true);
        });

        it('should return false when activeTool is TileBrushTool', () => {
            const brushTool: ActiveTool = {
                type: ToolType.TileBrushTool,
                tileKind: TileKind.WATER,
                leftDrag: TEST_LEFT_DRAG_FALSE,
                rightDrag: TEST_RIGHT_DRAG_FALSE,
            };
            mockGameEditorInteractionsService.activeTool = brushTool;

            const result = component.isTeleportSelected();

            expect(result).toBe(false);
        });

        it('should return false when activeTool is null', () => {
            mockGameEditorInteractionsService.activeTool = null;

            const result = component.isTeleportSelected();

            expect(result).toBe(false);
        });

        it('should return false when activeTool is PlaceableTool', () => {
            const placeableTool: ActiveTool = {
                type: ToolType.PlaceableTool,
                placeableKind: 'HEAL' as never,
            } as ActiveTool;
            mockGameEditorInteractionsService.activeTool = placeableTool;

            const result = component.isTeleportSelected();

            expect(result).toBe(false);
        });
    });

    describe('isBrushSelected', () => {
        const brush: ToolbarItem = CREATE_MOCK_TOOLBAR_ITEM(TileKind.WATER, TEST_TILE_IMAGE_WATER, TEST_TILE_CLASS_WATER);

        it('should return true when activeTool is TileBrushTool with matching tileKind', () => {
            const brushTool: ActiveTool = {
                type: ToolType.TileBrushTool,
                tileKind: TileKind.WATER,
                leftDrag: TEST_LEFT_DRAG_FALSE,
                rightDrag: TEST_RIGHT_DRAG_FALSE,
            };
            mockGameEditorInteractionsService.activeTool = brushTool;

            const result = component.isBrushSelected(brush);

            expect(result).toBe(true);
        });

        it('should return false when activeTool is TileBrushTool with different tileKind', () => {
            const brushTool: ActiveTool = {
                type: ToolType.TileBrushTool,
                tileKind: TileKind.WALL,
                leftDrag: TEST_LEFT_DRAG_FALSE,
                rightDrag: TEST_RIGHT_DRAG_FALSE,
            };
            mockGameEditorInteractionsService.activeTool = brushTool;

            const result = component.isBrushSelected(brush);

            expect(result).toBe(false);
        });

        it('should return false when activeTool is null', () => {
            mockGameEditorInteractionsService.activeTool = null;

            const result = component.isBrushSelected(brush);

            expect(result).toBe(false);
        });

        it('should return false when activeTool is TeleportTileTool', () => {
            const teleportChannel = CREATE_MOCK_TELEPORT_CHANNEL(TEST_CHANNEL_NUMBER_1);
            const teleportTool: ActiveTool = {
                type: ToolType.TeleportTileTool,
                channelNumber: TEST_CHANNEL_NUMBER_1,
                teleportChannel,
            };
            mockGameEditorInteractionsService.activeTool = teleportTool;

            const result = component.isBrushSelected(brush);

            expect(result).toBe(false);
        });

        it('should return false when activeTool is PlaceableTool', () => {
            const placeableTool: ActiveTool = {
                type: ToolType.PlaceableTool,
                placeableKind: 'HEAL' as never,
            } as ActiveTool;
            mockGameEditorInteractionsService.activeTool = placeableTool;

            const result = component.isBrushSelected(brush);

            expect(result).toBe(false);
        });

        it('should return false when activeTool does not have tileKind property', () => {
            const eraserTool: ActiveTool = {
                type: ToolType.PlaceableEraserTool,
            };
            mockGameEditorInteractionsService.activeTool = eraserTool;

            const result = component.isBrushSelected(brush);

            expect(result).toBe(false);
        });

        it('should return false when activeTool is TileBrushTool but does not have tileKind property', () => {
            const brushToolWithoutTileKind = {
                type: ToolType.TileBrushTool,
                leftDrag: TEST_LEFT_DRAG_FALSE,
                rightDrag: TEST_RIGHT_DRAG_FALSE,
            } as ActiveTool;
            mockGameEditorInteractionsService.activeTool = brushToolWithoutTileKind;

            const result = component.isBrushSelected(brush);

            expect(result).toBe(false);
        });
    });

    describe('getActiveTeleportChannelNumber', () => {
        it('should return channelNumber when activeTool is TeleportTileTool', () => {
            const teleportChannel = CREATE_MOCK_TELEPORT_CHANNEL(TEST_CHANNEL_NUMBER_1);
            const teleportTool: ActiveTool = {
                type: ToolType.TeleportTileTool,
                channelNumber: TEST_CHANNEL_NUMBER_1,
                teleportChannel,
            };
            mockGameEditorInteractionsService.activeTool = teleportTool;

            const result = component.getActiveTeleportChannelNumber();

            expect(result).toBe(TEST_CHANNEL_NUMBER_1);
        });

        it('should return different channelNumber when activeTool is TeleportTileTool with different channel', () => {
            const teleportChannel = CREATE_MOCK_TELEPORT_CHANNEL(TEST_CHANNEL_NUMBER_2);
            const teleportTool: ActiveTool = {
                type: ToolType.TeleportTileTool,
                channelNumber: TEST_CHANNEL_NUMBER_2,
                teleportChannel,
            };
            mockGameEditorInteractionsService.activeTool = teleportTool;

            const result = component.getActiveTeleportChannelNumber();

            expect(result).toBe(TEST_CHANNEL_NUMBER_2);
        });

        it('should return null when activeTool is null', () => {
            mockGameEditorInteractionsService.activeTool = null;

            const result = component.getActiveTeleportChannelNumber();

            expect(result).toBeNull();
        });

        it('should return null when activeTool is TileBrushTool', () => {
            const brushTool: ActiveTool = {
                type: ToolType.TileBrushTool,
                tileKind: TileKind.WATER,
                leftDrag: TEST_LEFT_DRAG_FALSE,
                rightDrag: TEST_RIGHT_DRAG_FALSE,
            };
            mockGameEditorInteractionsService.activeTool = brushTool;

            const result = component.getActiveTeleportChannelNumber();

            expect(result).toBeNull();
        });

        it('should return null when activeTool is PlaceableTool', () => {
            const placeableTool: ActiveTool = {
                type: ToolType.PlaceableTool,
                placeableKind: 'HEAL' as never,
            } as ActiveTool;
            mockGameEditorInteractionsService.activeTool = placeableTool;

            const result = component.getActiveTeleportChannelNumber();

            expect(result).toBeNull();
        });
    });

    describe('getAvailableTeleportCount', () => {
        beforeEach(() => {
            mockGameEditorTeleportService.getAvailableTeleportChannels.calls.reset();
        });

        it('should return zero when no available teleport channels', () => {
            mockGameEditorTeleportService.getAvailableTeleportChannels.and.returnValue([]);

            const result = component.getAvailableTeleportCount();

            expect(mockGameEditorTeleportService.getAvailableTeleportChannels).toHaveBeenCalled();
            expect(result).toBe(TEST_CHANNELS_COUNT_ZERO);
        });

        it('should return one when one available teleport channel', () => {
            const channel1 = CREATE_MOCK_TELEPORT_CHANNEL(TEST_CHANNEL_NUMBER_1);
            mockGameEditorTeleportService.getAvailableTeleportChannels.and.returnValue([channel1]);

            const result = component.getAvailableTeleportCount();

            expect(mockGameEditorTeleportService.getAvailableTeleportChannels).toHaveBeenCalled();
            expect(result).toBe(TEST_CHANNELS_COUNT_ONE);
        });

        it('should return two when two available teleport channels', () => {
            const channel1 = CREATE_MOCK_TELEPORT_CHANNEL(TEST_CHANNEL_NUMBER_1);
            const channel2 = CREATE_MOCK_TELEPORT_CHANNEL(TEST_CHANNEL_NUMBER_2);
            mockGameEditorTeleportService.getAvailableTeleportChannels.and.returnValue([channel1, channel2]);

            const result = component.getAvailableTeleportCount();

            expect(mockGameEditorTeleportService.getAvailableTeleportChannels).toHaveBeenCalled();
            expect(result).toBe(TEST_CHANNELS_COUNT_TWO);
        });
    });
});
