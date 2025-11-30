import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { GameEditorTileDto } from '@app/dto/game-editor-tile-dto';
import { TeleportChannelDto } from '@app/dto/teleport-channel-dto';
import { TeleportTileCoordinatesDto } from '@app/dto/teleport-tile-coordinates-dto';
import { TeleportTilesDto } from '@app/dto/teleport-tiles-dto';
import { GameEditorStoreService } from '@app/services/game-editor-store/game-editor-store.service';
import { TileKind } from '@common/enums/tile.enum';
import { GameEditorTeleportService } from './game-editor-teleport.service';

const TEST_CHANNEL_NUMBER_1 = 1;
const TEST_CHANNEL_NUMBER_2 = 2;
const TEST_CHANNEL_NUMBER_3 = 3;
const TEST_X_COORDINATE_1 = 5;
const TEST_Y_COORDINATE_1 = 10;
const TEST_X_COORDINATE_2 = 15;
const TEST_Y_COORDINATE_2 = 20;
const TEST_CHANNELS_COUNT_ZERO = 0;
const TEST_CHANNELS_COUNT_ONE = 1;
const TEST_CHANNELS_COUNT_TWO = 2;
const TEST_IS_FIRST_TILE = true;
const TEST_IS_NOT_FIRST_TILE = false;

type MockGameEditorStoreService = {
    teleportChannelsSignal: ReturnType<typeof signal<TeleportChannelDto[]>>;
    teleportChannels: readonly TeleportChannelDto[];
    getTileAt: jasmine.Spy;
};

const createMockTeleportTileCoordinates = (x: number, y: number): TeleportTileCoordinatesDto => ({
    x,
    y,
});

const createMockTeleportTiles = (
    entryA?: TeleportTileCoordinatesDto,
    entryB?: TeleportTileCoordinatesDto,
): TeleportTilesDto => ({
    entryA,
    entryB,
});

const createMockTeleportChannel = (
    channelNumber: number,
    tiles?: TeleportTilesDto,
): TeleportChannelDto => ({
    channelNumber,
    tiles: tiles || { entryA: undefined, entryB: undefined },
});

const createMockTile = (x: number, y: number, kind: TileKind, teleportChannel?: number): GameEditorTileDto => ({
    kind,
    x,
    y,
    teleportChannel,
});

describe('GameEditorTeleportService', () => {
    let service: GameEditorTeleportService;
    let mockGameEditorStoreService: MockGameEditorStoreService;
    let teleportChannelsSignal: ReturnType<typeof signal<TeleportChannelDto[]>>;

    beforeEach(() => {
        teleportChannelsSignal = signal<TeleportChannelDto[]>([]);

        mockGameEditorStoreService = {
            teleportChannelsSignal,
            get teleportChannels(): readonly TeleportChannelDto[] {
                return teleportChannelsSignal();
            },
            getTileAt: jasmine.createSpy('getTileAt'),
        };

        TestBed.configureTestingModule({
            providers: [
                GameEditorTeleportService,
                { provide: GameEditorStoreService, useValue: mockGameEditorStoreService },
            ],
        });

        service = TestBed.inject(GameEditorTeleportService);
    });

    it('should create', () => {
        expect(service).toBeTruthy();
    });

    describe('availableTeleportChannels', () => {
        it('should return empty array when no channels exist', () => {
            teleportChannelsSignal.set([]);

            expect(service.availableTeleportChannels().length).toBe(TEST_CHANNELS_COUNT_ZERO);
        });

        it('should return channels with missing entryA', () => {
            const channel1 = createMockTeleportChannel(TEST_CHANNEL_NUMBER_1, createMockTeleportTiles(undefined, createMockTeleportTileCoordinates(TEST_X_COORDINATE_2, TEST_Y_COORDINATE_2)));
            const channel2 = createMockTeleportChannel(TEST_CHANNEL_NUMBER_2, createMockTeleportTiles(createMockTeleportTileCoordinates(TEST_X_COORDINATE_1, TEST_Y_COORDINATE_1), createMockTeleportTileCoordinates(TEST_X_COORDINATE_2, TEST_Y_COORDINATE_2)));
            teleportChannelsSignal.set([channel1, channel2]);

            const available = service.availableTeleportChannels();

            expect(available.length).toBe(TEST_CHANNELS_COUNT_ONE);
            expect(available[0].channelNumber).toBe(TEST_CHANNEL_NUMBER_1);
        });

        it('should return channels with missing entryB', () => {
            const channel1 = createMockTeleportChannel(TEST_CHANNEL_NUMBER_1, createMockTeleportTiles(createMockTeleportTileCoordinates(TEST_X_COORDINATE_1, TEST_Y_COORDINATE_1), undefined));
            const channel2 = createMockTeleportChannel(TEST_CHANNEL_NUMBER_2, createMockTeleportTiles(createMockTeleportTileCoordinates(TEST_X_COORDINATE_1, TEST_Y_COORDINATE_1), createMockTeleportTileCoordinates(TEST_X_COORDINATE_2, TEST_Y_COORDINATE_2)));
            teleportChannelsSignal.set([channel1, channel2]);

            const available = service.availableTeleportChannels();

            expect(available.length).toBe(TEST_CHANNELS_COUNT_ONE);
            expect(available[0].channelNumber).toBe(TEST_CHANNEL_NUMBER_1);
        });

        it('should return channels with missing tiles', () => {
            const channel1 = createMockTeleportChannel(TEST_CHANNEL_NUMBER_1);
            const channel2 = createMockTeleportChannel(TEST_CHANNEL_NUMBER_2, createMockTeleportTiles(createMockTeleportTileCoordinates(TEST_X_COORDINATE_1, TEST_Y_COORDINATE_1), createMockTeleportTileCoordinates(TEST_X_COORDINATE_2, TEST_Y_COORDINATE_2)));
            teleportChannelsSignal.set([channel1, channel2]);

            const available = service.availableTeleportChannels();

            expect(available.length).toBe(TEST_CHANNELS_COUNT_ONE);
            expect(available[0].channelNumber).toBe(TEST_CHANNEL_NUMBER_1);
        });

        it('should not return channels with both entryA and entryB', () => {
            const channel1 = createMockTeleportChannel(TEST_CHANNEL_NUMBER_1, createMockTeleportTiles(createMockTeleportTileCoordinates(TEST_X_COORDINATE_1, TEST_Y_COORDINATE_1), createMockTeleportTileCoordinates(TEST_X_COORDINATE_2, TEST_Y_COORDINATE_2)));
            teleportChannelsSignal.set([channel1]);

            const available = service.availableTeleportChannels();

            expect(available.length).toBe(TEST_CHANNELS_COUNT_ZERO);
        });
    });

    describe('teleportChannels', () => {
        it('should return teleportChannels from gameEditorStoreService', () => {
            const channels = [
                createMockTeleportChannel(TEST_CHANNEL_NUMBER_1),
                createMockTeleportChannel(TEST_CHANNEL_NUMBER_2),
            ];
            teleportChannelsSignal.set(channels);

            const result = service.teleportChannels;

            expect(result.length).toBe(TEST_CHANNELS_COUNT_TWO);
            expect(result[0].channelNumber).toBe(TEST_CHANNEL_NUMBER_1);
            expect(result[1].channelNumber).toBe(TEST_CHANNEL_NUMBER_2);
        });
    });

    describe('getAvailableTeleportChannels', () => {
        it('should return available teleport channels', () => {
            const channel1 = createMockTeleportChannel(TEST_CHANNEL_NUMBER_1);
            const channel2 = createMockTeleportChannel(TEST_CHANNEL_NUMBER_2, createMockTeleportTiles(createMockTeleportTileCoordinates(TEST_X_COORDINATE_1, TEST_Y_COORDINATE_1), createMockTeleportTileCoordinates(TEST_X_COORDINATE_2, TEST_Y_COORDINATE_2)));
            teleportChannelsSignal.set([channel1, channel2]);

            const available = service.getAvailableTeleportChannels();

            expect(available.length).toBe(TEST_CHANNELS_COUNT_ONE);
            expect(available[0].channelNumber).toBe(TEST_CHANNEL_NUMBER_1);
        });
    });

    describe('getNextAvailableTeleportChannel', () => {
        it('should return undefined when no available channels', () => {
            teleportChannelsSignal.set([]);

            const result = service.getNextAvailableTeleportChannel();

            expect(result).toBeUndefined();
        });

        it('should return undefined when all channels are complete', () => {
            const channel1 = createMockTeleportChannel(TEST_CHANNEL_NUMBER_1, createMockTeleportTiles(createMockTeleportTileCoordinates(TEST_X_COORDINATE_1, TEST_Y_COORDINATE_1), createMockTeleportTileCoordinates(TEST_X_COORDINATE_2, TEST_Y_COORDINATE_2)));
            teleportChannelsSignal.set([channel1]);

            const result = service.getNextAvailableTeleportChannel();

            expect(result).toBeUndefined();
        });

        it('should return channel with lowest channelNumber', () => {
            const channel1 = createMockTeleportChannel(TEST_CHANNEL_NUMBER_2);
            const channel2 = createMockTeleportChannel(TEST_CHANNEL_NUMBER_1);
            teleportChannelsSignal.set([channel1, channel2]);

            const result = service.getNextAvailableTeleportChannel();

            expect(result).toBeDefined();
            expect(result?.channelNumber).toBe(TEST_CHANNEL_NUMBER_1);
        });

        it('should return sorted channel by channelNumber', () => {
            const channel1 = createMockTeleportChannel(TEST_CHANNEL_NUMBER_3);
            const channel2 = createMockTeleportChannel(TEST_CHANNEL_NUMBER_1);
            const channel3 = createMockTeleportChannel(TEST_CHANNEL_NUMBER_2);
            teleportChannelsSignal.set([channel1, channel2, channel3]);

            const result = service.getNextAvailableTeleportChannel();

            expect(result).toBeDefined();
            expect(result?.channelNumber).toBe(TEST_CHANNEL_NUMBER_1);
        });
    });

    describe('isTeleportDisabled', () => {
        it('should return true when no available channels', () => {
            teleportChannelsSignal.set([]);

            expect(service.isTeleportDisabled()).toBe(true);
        });

        it('should return true when all channels are complete', () => {
            const channel1 = createMockTeleportChannel(TEST_CHANNEL_NUMBER_1, createMockTeleportTiles(createMockTeleportTileCoordinates(TEST_X_COORDINATE_1, TEST_Y_COORDINATE_1), createMockTeleportTileCoordinates(TEST_X_COORDINATE_2, TEST_Y_COORDINATE_2)));
            teleportChannelsSignal.set([channel1]);

            expect(service.isTeleportDisabled()).toBe(true);
        });

        it('should return false when available channels exist', () => {
            const channel1 = createMockTeleportChannel(TEST_CHANNEL_NUMBER_1);
            teleportChannelsSignal.set([channel1]);

            expect(service.isTeleportDisabled()).toBe(false);
        });
    });

    describe('placeTeleportTile', () => {
        it('should create tiles object when placing first tile and tiles does not exist', () => {
            const channel = createMockTeleportChannel(TEST_CHANNEL_NUMBER_1);
            teleportChannelsSignal.set([channel]);

            service.placeTeleportTile(TEST_X_COORDINATE_1, TEST_Y_COORDINATE_1, TEST_CHANNEL_NUMBER_1, TEST_IS_FIRST_TILE);

            const updatedChannels = teleportChannelsSignal();
            expect(updatedChannels[0].tiles).toBeDefined();
            expect(updatedChannels[0].tiles?.entryA).toEqual(createMockTeleportTileCoordinates(TEST_X_COORDINATE_1, TEST_Y_COORDINATE_1));
            expect(updatedChannels[0].tiles?.entryB).toBeUndefined();
        });

        it('should update entryA when placing first tile and tiles exists', () => {
            const channel = createMockTeleportChannel(TEST_CHANNEL_NUMBER_1, createMockTeleportTiles(createMockTeleportTileCoordinates(TEST_X_COORDINATE_2, TEST_Y_COORDINATE_2), undefined));
            teleportChannelsSignal.set([channel]);

            service.placeTeleportTile(TEST_X_COORDINATE_1, TEST_Y_COORDINATE_1, TEST_CHANNEL_NUMBER_1, TEST_IS_FIRST_TILE);

            const updatedChannels = teleportChannelsSignal();
            expect(updatedChannels[0].tiles?.entryA).toEqual(createMockTeleportTileCoordinates(TEST_X_COORDINATE_1, TEST_Y_COORDINATE_1));
        });

        it('should update entryB when placing second tile', () => {
            const channel = createMockTeleportChannel(TEST_CHANNEL_NUMBER_1, createMockTeleportTiles(createMockTeleportTileCoordinates(TEST_X_COORDINATE_1, TEST_Y_COORDINATE_1), undefined));
            teleportChannelsSignal.set([channel]);

            service.placeTeleportTile(TEST_X_COORDINATE_2, TEST_Y_COORDINATE_2, TEST_CHANNEL_NUMBER_1, TEST_IS_NOT_FIRST_TILE);

            const updatedChannels = teleportChannelsSignal();
            expect(updatedChannels[0].tiles?.entryB).toEqual(createMockTeleportTileCoordinates(TEST_X_COORDINATE_2, TEST_Y_COORDINATE_2));
        });

        it('should not update when channel does not exist', () => {
            const channel: TeleportChannelDto = {
                channelNumber: TEST_CHANNEL_NUMBER_1,
                tiles: undefined as unknown as TeleportTilesDto,
            };
            teleportChannelsSignal.set([channel]);

            service.placeTeleportTile(TEST_X_COORDINATE_1, TEST_Y_COORDINATE_1, TEST_CHANNEL_NUMBER_2, TEST_IS_FIRST_TILE);

            const updatedChannels = teleportChannelsSignal();
            expect(updatedChannels[0].tiles).toBeUndefined();
        });

        it('should not update entryB when tiles does not exist for second tile', () => {
            const channel: TeleportChannelDto = {
                channelNumber: TEST_CHANNEL_NUMBER_1,
                tiles: undefined as unknown as TeleportTilesDto,
            };
            teleportChannelsSignal.set([channel]);

            service.placeTeleportTile(TEST_X_COORDINATE_2, TEST_Y_COORDINATE_2, TEST_CHANNEL_NUMBER_1, TEST_IS_NOT_FIRST_TILE);

            const updatedChannels = teleportChannelsSignal();
            expect(updatedChannels[0].tiles).toBeUndefined();
        });
    });

    describe('cancelTeleportPlacement', () => {
        it('should clear tiles when channel exists and has tiles', () => {
            const channel = createMockTeleportChannel(TEST_CHANNEL_NUMBER_1, createMockTeleportTiles(createMockTeleportTileCoordinates(TEST_X_COORDINATE_1, TEST_Y_COORDINATE_1), createMockTeleportTileCoordinates(TEST_X_COORDINATE_2, TEST_Y_COORDINATE_2)));
            teleportChannelsSignal.set([channel]);

            service.cancelTeleportPlacement(TEST_CHANNEL_NUMBER_1);

            const updatedChannels = teleportChannelsSignal();
            expect(updatedChannels[0].tiles?.entryA).toBeUndefined();
            expect(updatedChannels[0].tiles?.entryB).toBeUndefined();
        });

        it('should not update when channel does not exist', () => {
            const channel = createMockTeleportChannel(TEST_CHANNEL_NUMBER_1, createMockTeleportTiles(createMockTeleportTileCoordinates(TEST_X_COORDINATE_1, TEST_Y_COORDINATE_1), undefined));
            teleportChannelsSignal.set([channel]);

            service.cancelTeleportPlacement(TEST_CHANNEL_NUMBER_2);

            const updatedChannels = teleportChannelsSignal();
            expect(updatedChannels[0].tiles?.entryA).toBeDefined();
        });

        it('should not update when channel has no tiles', () => {
            const channel: TeleportChannelDto = {
                channelNumber: TEST_CHANNEL_NUMBER_1,
                tiles: undefined as unknown as TeleportTilesDto,
            };
            teleportChannelsSignal.set([channel]);

            service.cancelTeleportPlacement(TEST_CHANNEL_NUMBER_1);

            const updatedChannels = teleportChannelsSignal();
            expect(updatedChannels[0].tiles).toBeUndefined();
        });
    });

    describe('removeTeleportPair', () => {
        it('should clear tiles when tile exists and is teleport kind', () => {
            const channel = createMockTeleportChannel(TEST_CHANNEL_NUMBER_1, createMockTeleportTiles(createMockTeleportTileCoordinates(TEST_X_COORDINATE_1, TEST_Y_COORDINATE_1), createMockTeleportTileCoordinates(TEST_X_COORDINATE_2, TEST_Y_COORDINATE_2)));
            teleportChannelsSignal.set([channel]);
            mockGameEditorStoreService.getTileAt.and.returnValue(createMockTile(TEST_X_COORDINATE_1, TEST_Y_COORDINATE_1, TileKind.TELEPORT, TEST_CHANNEL_NUMBER_1));

            service.removeTeleportPair(TEST_X_COORDINATE_1, TEST_Y_COORDINATE_1);

            const updatedChannels = teleportChannelsSignal();
            expect(updatedChannels[0].tiles?.entryA).toBeUndefined();
            expect(updatedChannels[0].tiles?.entryB).toBeUndefined();
        });

        it('should not update when tile does not exist', () => {
            const channel = createMockTeleportChannel(TEST_CHANNEL_NUMBER_1, createMockTeleportTiles(createMockTeleportTileCoordinates(TEST_X_COORDINATE_1, TEST_Y_COORDINATE_1), undefined));
            teleportChannelsSignal.set([channel]);
            mockGameEditorStoreService.getTileAt.and.returnValue(null);

            service.removeTeleportPair(TEST_X_COORDINATE_1, TEST_Y_COORDINATE_1);

            const updatedChannels = teleportChannelsSignal();
            expect(updatedChannels[0].tiles?.entryA).toBeDefined();
        });

        it('should not update when tile is not teleport kind', () => {
            const channel = createMockTeleportChannel(TEST_CHANNEL_NUMBER_1, createMockTeleportTiles(createMockTeleportTileCoordinates(TEST_X_COORDINATE_1, TEST_Y_COORDINATE_1), undefined));
            teleportChannelsSignal.set([channel]);
            mockGameEditorStoreService.getTileAt.and.returnValue(createMockTile(TEST_X_COORDINATE_1, TEST_Y_COORDINATE_1, TileKind.BASE));

            service.removeTeleportPair(TEST_X_COORDINATE_1, TEST_Y_COORDINATE_1);

            const updatedChannels = teleportChannelsSignal();
            expect(updatedChannels[0].tiles?.entryA).toBeDefined();
        });

        it('should not update when tile has no teleportChannel', () => {
            const channel = createMockTeleportChannel(TEST_CHANNEL_NUMBER_1, createMockTeleportTiles(createMockTeleportTileCoordinates(TEST_X_COORDINATE_1, TEST_Y_COORDINATE_1), undefined));
            teleportChannelsSignal.set([channel]);
            mockGameEditorStoreService.getTileAt.and.returnValue(createMockTile(TEST_X_COORDINATE_1, TEST_Y_COORDINATE_1, TileKind.TELEPORT));

            service.removeTeleportPair(TEST_X_COORDINATE_1, TEST_Y_COORDINATE_1);

            const updatedChannels = teleportChannelsSignal();
            expect(updatedChannels[0].tiles?.entryA).toBeDefined();
        });

        it('should not update when channel does not exist', () => {
            const channel = createMockTeleportChannel(TEST_CHANNEL_NUMBER_1, createMockTeleportTiles(createMockTeleportTileCoordinates(TEST_X_COORDINATE_1, TEST_Y_COORDINATE_1), undefined));
            teleportChannelsSignal.set([channel]);
            mockGameEditorStoreService.getTileAt.and.returnValue(createMockTile(TEST_X_COORDINATE_1, TEST_Y_COORDINATE_1, TileKind.TELEPORT, TEST_CHANNEL_NUMBER_2));

            service.removeTeleportPair(TEST_X_COORDINATE_1, TEST_Y_COORDINATE_1);

            const updatedChannels = teleportChannelsSignal();
            expect(updatedChannels[0].tiles?.entryA).toBeDefined();
        });

        it('should not update when channel has no tiles', () => {
            const channel: TeleportChannelDto = {
                channelNumber: TEST_CHANNEL_NUMBER_1,
                tiles: undefined as unknown as TeleportTilesDto,
            };
            teleportChannelsSignal.set([channel]);
            mockGameEditorStoreService.getTileAt.and.returnValue(createMockTile(TEST_X_COORDINATE_1, TEST_Y_COORDINATE_1, TileKind.TELEPORT, TEST_CHANNEL_NUMBER_1));

            service.removeTeleportPair(TEST_X_COORDINATE_1, TEST_Y_COORDINATE_1);

            const updatedChannels = teleportChannelsSignal();
            expect(updatedChannels[0].tiles).toBeUndefined();
        });
    });
});

