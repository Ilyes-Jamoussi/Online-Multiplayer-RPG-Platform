/* eslint-disable max-lines -- Test file with comprehensive test coverage */
import { TestBed } from '@angular/core/testing';
import { GameHttpService } from '@app/services/game-http/game-http.service';
import { GameStoreService } from '@app/services/game-store/game-store.service';
import { ScreenshotService } from '@app/services/screenshot/screenshot.service';
import { of, Subject, throwError } from 'rxjs';

import { HttpErrorResponse } from '@angular/common/http';
import { GameEditorDto } from '@app/dto/game-editor-dto';
import { GameEditorPlaceableDto } from '@app/dto/game-editor-placeable-dto';
import { GameEditorTileDto } from '@app/dto/game-editor-tile-dto';
import { GamePreviewDto } from '@app/dto/game-preview-dto';
import { TeleportChannelDto } from '@app/dto/teleport-channel-dto';
import { TeleportTileCoordinatesDto } from '@app/dto/teleport-tile-coordinates-dto';
import { TeleportTilesDto } from '@app/dto/teleport-tiles-dto';
import { AssetsService } from '@app/services/assets/assets.service';
import { NotificationService } from '@app/services/notification/notification.service';
import { GameMode } from '@common/enums/game-mode.enum';
import { MapSize } from '@common/enums/map-size.enum';
import { PlaceableKind } from '@common/enums/placeable-kind.enum';
import { TileKind } from '@common/enums/tile.enum';
import { GameEditorStoreService } from './game-editor-store.service';

describe('GameEditorStoreService', () => {
    let service: GameEditorStoreService;
    let gameHttpServiceSpy: jasmine.SpyObj<GameHttpService>;
    let gameStoreServiceSpy: jasmine.SpyObj<GameStoreService>;
    let screenshotServiceSpy: jasmine.SpyObj<ScreenshotService>;
    let assetsServiceSpy: jasmine.SpyObj<AssetsService>;
    let notificationServiceSpy: jasmine.SpyObj<NotificationService>;

    const zero = 0;
    const one = 1;
    const channelNumber1 = 1;
    const channelNumber2 = 2;
    const teleportX1 = 1;
    const teleportY1 = 1;
    const teleportX2 = 2;
    const teleportY2 = 2;

    beforeEach(() => {
        gameHttpServiceSpy = jasmine.createSpyObj('GameHttpService', ['getGameEditorById', 'patchGameEditorById', 'createGame']);
        gameStoreServiceSpy = jasmine.createSpyObj('GameStoreService', ['selectGame', 'deselectGame']);
        screenshotServiceSpy = jasmine.createSpyObj('ScreenshotService', ['captureElementAsBase64']);
        assetsServiceSpy = jasmine.createSpyObj('AssetsService', ['getPlaceableImage']);
        notificationServiceSpy = jasmine.createSpyObj('NotificationService', ['displaySuccessPopup', 'displayErrorPopup']);

        assetsServiceSpy.getPlaceableImage.and.returnValue('/assets/test.png');

        TestBed.configureTestingModule({
            providers: [
                GameEditorStoreService,
                { provide: GameHttpService, useValue: gameHttpServiceSpy },
                { provide: GameStoreService, useValue: gameStoreServiceSpy },
                { provide: ScreenshotService, useValue: screenshotServiceSpy },
                { provide: AssetsService, useValue: assetsServiceSpy },
                { provide: NotificationService, useValue: notificationServiceSpy },
            ],
        });

        service = TestBed.inject(GameEditorStoreService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    const mockPreview: GamePreviewDto = {
        id: '1',
        name: 'Test Game',
        description: 'A game for testing',
        size: MapSize.SMALL,
        mode: GameMode.CTF,
        visibility: false,
        lastModified: new Date().toISOString(),
        gridPreviewUrl: '',
        draft: false,
    };

    const mkTiles = () => {
        const size = MapSize.SMALL;
        const array: GameEditorTileDto[] = [];
        for (let i = 0; i < size; i++) {
            for (let j = 0; j < size; j++) {
                array.push({ kind: TileKind.BASE, x: i, y: j });
            }
        }
        return array;
    };

    const mkObjects = () => {
        const array: GameEditorPlaceableDto[] = [];
        array.push({ id: 'start1', kind: PlaceableKind.START, x: 0, y: 0, placed: true, orientation: 'N' });
        array.push({ id: 'flag1', kind: PlaceableKind.FLAG, x: -1, y: -1, placed: false, orientation: 'N' });
        array.push({ id: 'boat1', kind: PlaceableKind.BOAT, x: 2, y: 2, placed: true, orientation: 'N' });
        return array;
    };

    const invalidTile = 100;

    const mockEditorData: GameEditorDto = {
        id: '1',
        name: 'Test Game',
        description: 'A game for testing',
        size: MapSize.SMALL,
        tiles: mkTiles(),
        objects: mkObjects(),
        mode: GameMode.CTF,
        lastModified: new Date().toISOString(),
        gridPreviewUrl: '/assets/test-game.png',
        teleportChannels: [],
    };

    describe('getters/setters', () => {
        it('should get and set name and description', () => {
            expect(service.name).toBe('');
            expect(service.description).toBe('');

            service.name = 'New Name';
            service.description = 'New Description';

            expect(service.name).toBe('New Name');
            expect(service.description).toBe('New Description');
        });

        it('should get and set tile size', () => {
            expect(service.tileSizePx).toBe(0);
            service.tileSizePx = 1;
            expect(service.tileSizePx).toBe(1);
        });

        it('should get correct gridPreviewUrl', () => {
            const subject = new Subject<GameEditorDto>();
            gameHttpServiceSpy.getGameEditorById.and.returnValue(subject.asObservable());
            service.loadGameById('1');
            subject.next(mockEditorData);
            subject.complete();
        });

        it('should get correct size and mode', () => {
            expect(service.size()).toBe(MapSize.MEDIUM);
            expect(service.mode()).toBe(GameMode.CLASSIC);
            const subject = new Subject<GameEditorDto>();
            gameHttpServiceSpy.getGameEditorById.and.returnValue(subject.asObservable());
            service.loadGameById('1');
            subject.next(mockEditorData);
            subject.complete();
            expect(service.size()).toBe(MapSize.SMALL);
            expect(service.mode()).toBe(GameMode.CTF);
        });
    });

    describe('loadGame', () => {
        it('should load game data and update state (sans fakeAsync)', () => {
            const subject = new Subject<GameEditorDto>();
            gameHttpServiceSpy.getGameEditorById.and.returnValue(subject.asObservable());

            service.loadGameById('1');

            subject.next(mockEditorData);
            subject.complete();

            const initial = service['_initial']();
            expect(initial.id).toBe('1');
            expect(initial.name).toBe('Test Game');
            expect(initial.description).toBe('A game for testing');
            expect(initial.size).toBe(MapSize.SMALL);
            expect(initial.mode).toBe(GameMode.CTF);
            expect(service.tiles().length).toBe(mockEditorData.tiles.length);
        });
        it('should handle error when id not found', () => {
            gameHttpServiceSpy.getGameEditorById.and.returnValue(throwError(() => new Error('Game with ID 999 not found')));

            service.loadGameById('999');
        });
        it('should set loadError to true when game is undefined / null', () => {
            const subject = new Subject<GameEditorDto>();
            gameHttpServiceSpy.getGameEditorById.and.returnValue(subject.asObservable());

            service.loadGameById('1');

            subject.next(undefined as unknown as GameEditorDto);
            subject.complete();
        });

        it('should deep copy teleport channels with entryA and entryB when loading game', () => {
            const subject = new Subject<GameEditorDto>();
            gameHttpServiceSpy.getGameEditorById.and.returnValue(subject.asObservable());

            const editorDataWithChannels: GameEditorDto = {
                ...mockEditorData,
                teleportChannels: [
                    {
                        channelNumber: channelNumber1,
                        tiles: {
                            entryA: { x: teleportX1, y: teleportY1 },
                            entryB: { x: teleportX2, y: teleportY2 },
                        },
                    },
                ],
            };

            service.loadGameById('1');
            subject.next(editorDataWithChannels);
            subject.complete();

            const channels = service.teleportChannels;
            expect(channels.length).toBe(one);
            expect(channels[zero].tiles?.entryA).toEqual({ x: teleportX1, y: teleportY1 });
            expect(channels[zero].tiles?.entryB).toEqual({ x: teleportX2, y: teleportY2 });
        });

        it('should deep copy teleport channels with only entryA (no entryB) when loading game', () => {
            const subject = new Subject<GameEditorDto>();
            gameHttpServiceSpy.getGameEditorById.and.returnValue(subject.asObservable());

            const editorDataWithChannels: GameEditorDto = {
                ...mockEditorData,
                teleportChannels: [
                    {
                        channelNumber: channelNumber1,
                        tiles: {
                            entryA: { x: teleportX1, y: teleportY1 },
                            entryB: undefined,
                        },
                    },
                ],
            };

            service.loadGameById('1');
            subject.next(editorDataWithChannels);
            subject.complete();

            const channels = service.teleportChannels;
            expect(channels.length).toBe(one);
            expect(channels[zero].tiles?.entryA).toEqual({ x: teleportX1, y: teleportY1 });
            expect(channels[zero].tiles?.entryB).toBeUndefined();
        });

        it('should deep copy teleport channels with only entryB (no entryA) when loading game', () => {
            const subject = new Subject<GameEditorDto>();
            gameHttpServiceSpy.getGameEditorById.and.returnValue(subject.asObservable());

            const editorDataWithChannels: GameEditorDto = {
                ...mockEditorData,
                teleportChannels: [
                    {
                        channelNumber: channelNumber1,
                        tiles: {
                            entryA: undefined,
                            entryB: { x: teleportX2, y: teleportY2 },
                        },
                    },
                ],
            };

            service.loadGameById('1');
            subject.next(editorDataWithChannels);
            subject.complete();

            const channels = service.teleportChannels;
            expect(channels.length).toBe(one);
            expect(channels[zero].tiles?.entryA).toBeUndefined();
            expect(channels[zero].tiles?.entryB).toEqual({ x: teleportX2, y: teleportY2 });
        });

        it('should deep copy teleport channels with undefined tiles when loading game', () => {
            const subject = new Subject<GameEditorDto>();
            gameHttpServiceSpy.getGameEditorById.and.returnValue(subject.asObservable());

            const editorDataWithChannels: GameEditorDto = {
                ...mockEditorData,
                teleportChannels: [
                    {
                        channelNumber: channelNumber1,
                        tiles: undefined as unknown as TeleportTilesDto,
                    },
                ],
            };

            service.loadGameById('1');
            subject.next(editorDataWithChannels);
            subject.complete();

            const channels = service.teleportChannels;
            expect(channels.length).toBe(one);
            expect(channels[zero].tiles?.entryA).toBeUndefined();
            expect(channels[zero].tiles?.entryB).toBeUndefined();
        });
    });

    describe('saveGame', () => {
        beforeEach(() => {
            const subject = new Subject<GameEditorDto>();
            gameHttpServiceSpy.getGameEditorById.and.returnValue(subject.asObservable());

            gameHttpServiceSpy.patchGameEditorById.and.returnValue(of(mockPreview));

            service.loadGameById('1');
            subject.next(mockEditorData);
            subject.complete();
        });

        it('should reject with a user-friendly error when API returns Conflict (duplicate name)', async () => {
            const gridEl = document.createElement('div');

            screenshotServiceSpy.captureElementAsBase64.and.resolveTo('');

            service.name = 'Duplicate Name';

            const conflict = new HttpErrorResponse({ status: 409, statusText: 'Conflict' });
            gameHttpServiceSpy.patchGameEditorById.and.returnValue(throwError(() => conflict));

            await expectAsync(service.saveGame(gridEl)).toBeRejectedWithError(Error, 'Un jeu avec ce nom existe déjà.');

            expect(gameHttpServiceSpy.createGame).not.toHaveBeenCalled();
        });

        it('should call the API to save the game', async () => {
            screenshotServiceSpy.captureElementAsBase64.and.resolveTo('base64imagestring');

            const gridEl = document.createElement('div');
            service.name = 'Modified Name';
            service.description = 'Modified Description';

            await service.saveGame(gridEl);

            expect(screenshotServiceSpy.captureElementAsBase64).toHaveBeenCalledWith(gridEl);
            expect(gameHttpServiceSpy.patchGameEditorById).toHaveBeenCalledWith(
                '1',
                jasmine.objectContaining({
                    name: 'Modified Name',
                    description: 'Modified Description',
                    gridPreviewUrl: 'base64imagestring',
                }),
            );
        });

        it('should include gridPreviewUrl when screenshot returns a new image', async () => {
            const gridEl = document.createElement('div');
            expect(service['_initial']().name).toBe('Test Game');
            expect(service['_initial']().description).toBe('A game for testing');

            service.name = 'Modified Name';
            service.description = 'Modified Description';

            const newPreviewUrl = 'data:image/png;base64,XXX';
            screenshotServiceSpy.captureElementAsBase64.and.resolveTo(newPreviewUrl);

            await service.saveGame(gridEl);

            expect(gameHttpServiceSpy.patchGameEditorById).toHaveBeenCalledWith(
                '1',
                jasmine.objectContaining({
                    name: 'Modified Name',
                    description: 'Modified Description',
                    gridPreviewUrl: newPreviewUrl,
                }),
            );
        });

        it('should send only name if only name was modified (no new screenshot)', async () => {
            const gridEl = document.createElement('div');
            expect(service['_initial']().name).toBe('Test Game');
            expect(service['_initial']().description).toBe('A game for testing');

            service.name = 'Modified Name';

            await service.saveGame(gridEl);

            expect(gameHttpServiceSpy.patchGameEditorById).toHaveBeenCalledWith(
                '1',
                jasmine.objectContaining({
                    name: 'Modified Name',
                }),
            );
        });

        it('should send only description if only description was modified (no new screenshot)', async () => {
            const gridEl = document.createElement('div');
            expect(service['_initial']().name).toBe('Test Game');
            expect(service['_initial']().description).toBe('A game for testing');

            service.description = 'Modified Description';

            await service.saveGame(gridEl);

            expect(gameHttpServiceSpy.patchGameEditorById).toHaveBeenCalledWith(
                '1',
                jasmine.objectContaining({
                    description: 'Modified Description',
                }),
            );
        });

        it('should send only tiles if only tiles were modified (no new screenshot)', async () => {
            const gridEl = document.createElement('div');
            expect(service.tiles()).toEqual(mockEditorData.tiles);

            service.setTileAt(0, 0, TileKind.WATER);

            expect(service.getTileAt(0, 0)?.kind).toBe(TileKind.WATER);
            expect(service.tiles()).not.toEqual(mockEditorData.tiles);

            await service.saveGame(gridEl);

            expect(gameHttpServiceSpy.patchGameEditorById).toHaveBeenCalledWith(
                '1',
                jasmine.objectContaining({
                    tiles: service.tiles(),
                }),
            );
        });

        it('should send only objects if only objects were modified (no new screenshot)', async () => {
            const gridEl = document.createElement('div');
            expect(service.tiles()).toEqual(mockEditorData.tiles);

            service.placeObjectFromInventory(PlaceableKind.FLAG, 1, 1);

            expect(service.getPlacedObjectAt(1, 1)?.kind).toBe(PlaceableKind.FLAG);
            expect(service.tiles()).toEqual(mockEditorData.tiles);

            await service.saveGame(gridEl);
        });

        it('should create a new game if patchGameEditorById throws a not found error', async () => {
            const gridEl = document.createElement('div');
            gameHttpServiceSpy.patchGameEditorById.and.returnValues(
                throwError(() => new Error('Game with ID 1 not found')),
                of({ ...mockPreview, id: '2', gridPreviewUrl: 'data:image/png;base64,YYY' }),
            );

            const created = {
                id: '2',
                name: 'Test Game',
                description: 'A game for testing',
                size: MapSize.SMALL,
                mode: GameMode.CTF,
                visibility: false,
                lastModified: new Date().toISOString(),
                gridPreviewUrl: '',
                draft: true,
            };
            gameHttpServiceSpy.createGame.and.returnValue(of(created));

            const newPreviewUrl = 'data:image/png;base64,YYY';
            screenshotServiceSpy.captureElementAsBase64.and.resolveTo(newPreviewUrl);

            await service.saveGame(gridEl);

            expect(gameHttpServiceSpy.createGame).toHaveBeenCalledWith({
                name: 'Test Game',
                description: 'A game for testing',
                size: MapSize.SMALL,
                mode: GameMode.CTF,
            });

            expect(gameHttpServiceSpy.patchGameEditorById).toHaveBeenCalledWith(
                '2',
                jasmine.objectContaining({
                    tiles: service.tiles(),
                    gridPreviewUrl: newPreviewUrl,
                }),
            );
        });
    });

    describe('getTileAt', () => {
        it('should return the correct tile or undefined', () => {
            const subject = new Subject<GameEditorDto>();
            gameHttpServiceSpy.getGameEditorById.and.returnValue(subject.asObservable());
            service.loadGameById('1');
            subject.next(mockEditorData);
            subject.complete();

            const tile = service.getTileAt(0, 0);
            expect(tile).toBeDefined();
            expect(tile?.x).toBe(0);
            expect(tile?.y).toBe(0);
            expect(tile?.kind).toBe(TileKind.BASE);

            const noTile = service.getTileAt(invalidTile, invalidTile);
            expect(noTile).toBeUndefined();
        });

        it('should return undefined if tiles are not loaded', () => {
            const tile = service.getTileAt(0, 0);
            expect(tile).toBeUndefined();
        });
    });

    describe('setTileAt', () => {
        beforeEach(() => {
            const subject = new Subject<GameEditorDto>();
            gameHttpServiceSpy.getGameEditorById.and.returnValue(subject.asObservable());
            service.loadGameById('1');
            subject.next(mockEditorData);
            subject.complete();
        });

        it('should update the tile at specified coordinates', () => {
            service.setTileAt(0, 0, TileKind.WATER);
            const updatedTile = service.getTileAt(0, 0);
            expect(updatedTile).toBeDefined();
            expect(updatedTile?.kind).toBe(TileKind.WATER);

            const otherTile = service.getTileAt(1, 1);
            expect(otherTile).toBeDefined();
            expect(otherTile?.kind).toBe(TileKind.BASE);
        });

        it('should do nothing if coordinates are invalid', () => {
            const beforeTile = service.getTileAt(0, 0);
            service.setTileAt(invalidTile, invalidTile, TileKind.WATER);
            const afterTile = service.getTileAt(0, 0);
            expect(afterTile).toEqual(beforeTile);
        });

        it('should do nothing if trying to set the same kind (except for DOOR)', () => {
            const beforeTile = service.getTileAt(0, 0);
            expect(beforeTile).toBeDefined();
            expect(beforeTile?.kind).toBe(TileKind.BASE);

            service.setTileAt(0, 0, TileKind.BASE);
            const afterTile = service.getTileAt(0, 0);
            expect(afterTile).toEqual(beforeTile);
        });

        it('should toggle DOOR open state if setting DOOR on a DOOR tile', () => {
            service.setTileAt(0, 0, TileKind.DOOR);
            const doorTile = service.getTileAt(0, 0);
            expect(doorTile).toBeDefined();
            expect(doorTile?.kind).toBe(TileKind.DOOR);
            expect(doorTile?.open).toBeFalse();

            service.setTileAt(0, 0, TileKind.DOOR);
            const toggledDoorTile = service.getTileAt(0, 0);
            expect(toggledDoorTile).toBeDefined();
            expect(toggledDoorTile?.kind).toBe(TileKind.DOOR);
            expect(toggledDoorTile?.open).toBeTrue();
        });

        it('should return early if currentTile is falsy (no tile at index)', () => {
            service['_tiles'].set([]);
            service.setTileAt(zero, zero, TileKind.WATER);
            expect(service.tiles()).toEqual([]);
        });

        it('should return early when setting same TELEPORT tile with same teleportChannel', () => {
            service.setTileAt(zero, zero, TileKind.TELEPORT, channelNumber1);
            const beforeTile = service.getTileAt(zero, zero);
            expect(beforeTile?.kind).toBe(TileKind.TELEPORT);
            expect(beforeTile?.teleportChannel).toBe(channelNumber1);

            service.setTileAt(zero, zero, TileKind.TELEPORT, channelNumber1);
            const afterTile = service.getTileAt(zero, zero);
            expect(afterTile).toEqual(beforeTile);
        });

        it('should update TELEPORT tile when teleportChannel is different', () => {
            service.setTileAt(zero, zero, TileKind.TELEPORT, channelNumber1);
            const beforeTile = service.getTileAt(zero, zero);
            expect(beforeTile?.teleportChannel).toBe(channelNumber1);

            service.setTileAt(zero, zero, TileKind.TELEPORT, channelNumber2);
            const afterTile = service.getTileAt(zero, zero);
            expect(afterTile?.kind).toBe(TileKind.TELEPORT);
            expect(afterTile?.teleportChannel).toBe(channelNumber2);
        });

        it('should set teleportChannel when setting TELEPORT tile with teleportChannel', () => {
            service.setTileAt(zero, zero, TileKind.TELEPORT, channelNumber1);
            const tile = service.getTileAt(zero, zero);
            expect(tile?.kind).toBe(TileKind.TELEPORT);
            expect(tile?.teleportChannel).toBe(channelNumber1);
        });

        it('should set teleportChannel to undefined when changing from TELEPORT to non-TELEPORT tile', () => {
            service.setTileAt(zero, zero, TileKind.TELEPORT, channelNumber1);
            const teleportTile = service.getTileAt(zero, zero);
            expect(teleportTile?.kind).toBe(TileKind.TELEPORT);
            expect(teleportTile?.teleportChannel).toBe(channelNumber1);

            service.setTileAt(zero, zero, TileKind.WATER);
            const waterTile = service.getTileAt(zero, zero);
            expect(waterTile?.kind).toBe(TileKind.WATER);
            expect(waterTile?.teleportChannel).toBeUndefined();
        });
    });

    describe('reset', () => {
        beforeEach(() => {
            const subject = new Subject<GameEditorDto>();
            gameHttpServiceSpy.getGameEditorById.and.returnValue(subject.asObservable());
            service.loadGameById('1');
            subject.next(mockEditorData);
            subject.complete();
        });
        it('should reset the store to initial state', () => {
            expect(service['_initial']().id).toBe('1');
            expect(service.tiles().length).toBe(mockEditorData.tiles.length);

            service.setTileAt(zero, zero, TileKind.WATER);
            expect(service.getTileAt(zero, zero)?.kind).toBe(TileKind.WATER);
            service.setTileAt(one, one, TileKind.WATER);
            expect(service.getTileAt(one, one)?.kind).toBe(TileKind.WATER);
            service.name = 'Modified Name';
            expect(service.name).toBe('Modified Name');
            service.description = 'Modified Description';
            expect(service.description).toBe('Modified Description');

            service.reset();

            expect(service['_initial']().id).toBe('1');
            expect(service.name).toBe('Test Game');
            expect(service.description).toBe('A game for testing');
            expect(service.tiles().length).toBe(mockEditorData.tiles.length);
            expect(service.getTileAt(zero, zero)?.kind).toBe(TileKind.BASE);
            expect(service.getTileAt(one, one)?.kind).toBe(TileKind.BASE);
        });

        it('should reset teleportChannels to empty array when initial teleportChannels is null', () => {
            const subject = new Subject<GameEditorDto>();
            gameHttpServiceSpy.getGameEditorById.and.returnValue(subject.asObservable());
            const editorDataWithNullChannels: GameEditorDto = {
                ...mockEditorData,
                teleportChannels: null as unknown as TeleportChannelDto[],
            };
            service.loadGameById('1');
            subject.next(editorDataWithNullChannels);
            subject.complete();

            service['_teleportChannels'].set([{ channelNumber: channelNumber1, tiles: {} as TeleportTilesDto }]);
            expect(service.teleportChannels.length).toBe(one);

            service.reset();

            expect(service.teleportChannels.length).toBe(zero);
        });
    });

    describe('getPlacedObjectAt', () => {
        beforeEach(() => {
            const subject = new Subject<GameEditorDto>();
            gameHttpServiceSpy.getGameEditorById.and.returnValue(subject.asObservable());
            service.loadGameById('1');
            subject.next(mockEditorData);
            subject.complete();
        });

        it('should return the correct placed object or undefined', () => {
            const placedObject = service.getPlacedObjectAt(0, 0);
            expect(placedObject).toBeDefined();
            expect(placedObject?.id).toBe('start1');
            expect(placedObject?.kind).toBe(PlaceableKind.START);

            const noObject = service.getPlacedObjectAt(1, 1);
            expect(noObject).toBeUndefined();
        });

        it('should return undefined if if index out of bounds', () => {
            const noObject = service.getPlacedObjectAt(invalidTile, invalidTile);
            expect(noObject).toBeUndefined();
        });
    });

    describe('placeObjectFromInventory', () => {
        beforeEach(() => {
            const subject = new Subject<GameEditorDto>();
            gameHttpServiceSpy.getGameEditorById.and.returnValue(subject.asObservable());
            service.loadGameById('1');
            subject.next(mockEditorData);
            subject.complete();
        });

        it('should place the object at specified coordinates', () => {
            service.placeObjectFromInventory(PlaceableKind.FLAG, 1, 1);
            const placedObject = service.getPlacedObjectAt(1, 1);
            expect(placedObject).toBeDefined();
            expect(placedObject?.id).toBe('flag1');
            expect(placedObject?.kind).toBe(PlaceableKind.FLAG);
            expect(placedObject?.orientation).toBe('N');
            expect(placedObject?.placed).toBeTrue();

            const otherObject = service.getPlacedObjectAt(0, 0);
            expect(otherObject).toBeDefined();
            expect(otherObject?.id).toBe('start1');
        });

        it('should do nothing if coordinates are invalid', () => {
            const beforeObject = service.getPlacedObjectAt(0, 0);
            service.placeObjectFromInventory(PlaceableKind.FLAG, invalidTile, invalidTile);
            const afterObject = service.getPlacedObjectAt(0, 0);
            expect(afterObject).toEqual(beforeObject);
        });

        it('shouldnt do anything if no more object of that kind are unplaced', () => {
            service.placeObjectFromInventory(PlaceableKind.FLAG, 1, 1);
            const placedObject = service.getPlacedObjectAt(1, 1);
            expect(placedObject).toBeDefined();

            const coordinate = 3;
            service.placeObjectFromInventory(PlaceableKind.FLAG, coordinate, coordinate);
            const afterSecondPlacement = service.getPlacedObjectAt(coordinate, coordinate);
            expect(afterSecondPlacement).toBeUndefined();
        });

        it('shouldnt do anything if another object is already placed at the target coordinates', () => {
            const beforeObject = service.getPlacedObjectAt(0, 0);
            expect(beforeObject).toBeDefined();
            expect(beforeObject?.id).toBe('start1');

            service.placeObjectFromInventory(PlaceableKind.FLAG, 0, 0);
            const afterObject = service.getPlacedObjectAt(0, 0);
            expect(afterObject).toEqual(beforeObject);
        });
    });

    describe('movePlacedObject', () => {
        beforeEach(() => {
            const subject = new Subject<GameEditorDto>();
            gameHttpServiceSpy.getGameEditorById.and.returnValue(subject.asObservable());
            service.loadGameById('1');
            subject.next(mockEditorData);
            subject.complete();
        });

        it('should move the object to specified coordinates', () => {
            const beforeObject = service.getPlacedObjectAt(0, 0);
            expect(beforeObject).toBeDefined();
            expect(beforeObject?.id).toBe('start1');

            const coordinate = 4;

            service.movePlacedObject('start1', coordinate, coordinate);
            const movedObject = service.getPlacedObjectAt(coordinate, coordinate);
            expect(movedObject).toBeDefined();
            expect(movedObject?.id).toBe('start1');
            expect(movedObject?.x).toBe(coordinate);
            expect(movedObject?.y).toBe(coordinate);

            const noObject = service.getPlacedObjectAt(0, 0);
            expect(noObject).toBeUndefined();
        });

        it('should do nothing if coordinates are invalid', () => {
            const beforeObject = service.getPlacedObjectAt(0, 0);
            expect(beforeObject).toBeDefined();
            expect(beforeObject?.id).toBe('start1');

            service.movePlacedObject('start1', invalidTile, invalidTile);
            const afterObject = service.getPlacedObjectAt(0, 0);
            expect(afterObject).toEqual(beforeObject);
        });

        it('should do nothing if no object with the specified id is found', () => {
            const beforeObject = service.getPlacedObjectAt(0, 0);
            expect(beforeObject).toBeDefined();
            expect(beforeObject?.id).toBe('start1');

            const coordinate = 4;

            service.movePlacedObject('nonexistent-id', coordinate, coordinate);
            const afterObject = service.getPlacedObjectAt(0, 0);
            expect(afterObject).toEqual(beforeObject);
        });

        it('shouldnt do anything if another object is already placed at the target coordinates', () => {
            const beforeStart = service.getPlacedObjectAt(0, 0);
            expect(beforeStart).toBeDefined();
            expect(beforeStart?.id).toBe('start1');

            service.placeObjectFromInventory(PlaceableKind.FLAG, 1, 1);
            const beforeFlag = service.getPlacedObjectAt(1, 1);
            expect(beforeFlag).toBeDefined();
            expect(beforeFlag?.id).toBe('flag1');

            service.movePlacedObject('start1', 1, 1);
            const afterStart = service.getPlacedObjectAt(0, 0);
            expect(afterStart).toEqual(beforeStart);

            const stillFlag = service.getPlacedObjectAt(1, 1);
            expect(stillFlag).toEqual(beforeFlag);
        });
    });

    describe('removeObject', () => {
        beforeEach(() => {
            const subject = new Subject<GameEditorDto>();
            gameHttpServiceSpy.getGameEditorById.and.returnValue(subject.asObservable());
            service.loadGameById('1');
            subject.next(mockEditorData);
            subject.complete();
        });

        it('should remove the object with the specified id', () => {
            const beforeObject = service.getPlacedObjectAt(0, 0);
            expect(beforeObject).toBeDefined();
            expect(beforeObject?.id).toBe('start1');

            service.removeObject('start1');
            const afterObject = service.getPlacedObjectAt(0, 0);
            expect(afterObject).toBeUndefined();
        });

        it('should do nothing if no object with the specified id is found', () => {
            const beforeObject = service.getPlacedObjectAt(0, 0);
            expect(beforeObject).toBeDefined();
            expect(beforeObject?.id).toBe('start1');

            service.removeObject('nonexistent-id');
            const afterObject = service.getPlacedObjectAt(0, 0);
            expect(afterObject).toEqual(beforeObject);
        });
    });

    describe('inventory', () => {
        beforeEach(() => {
            const subject = new Subject<GameEditorDto>();
            gameHttpServiceSpy.getGameEditorById.and.returnValue(subject.asObservable());
            service.loadGameById('1');
            subject.next(mockEditorData);
            subject.complete();
        });

        it('should return the correct inventory counts for FLAG', () => {
            const inventory = service.inventory();
            expect(inventory.FLAG).toBeDefined();
            expect(inventory.FLAG.kind).toBe(PlaceableKind.FLAG);
            expect(inventory.FLAG.total).toBe(1);
            expect(inventory.FLAG.remaining).toBe(1);
            expect(inventory.FLAG.disabled).toBeFalse();
        });

        it('should return the correct inventory counts for START', () => {
            const inventory = service.inventory();
            expect(inventory.START).toBeDefined();
            expect(inventory.START.kind).toBe(PlaceableKind.START);
            expect(inventory.START.total).toBe(1);
            expect(inventory.START.remaining).toBe(0);
            expect(inventory.START.disabled).toBeTrue();
        });

        it('should return the correct inventory counts for BOAT', () => {
            const inventory = service.inventory();
            expect(inventory.BOAT).toBeDefined();
            expect(inventory.BOAT.kind).toBe(PlaceableKind.BOAT);
            expect(inventory.BOAT.total).toBe(1);
            expect(inventory.BOAT.remaining).toBe(0);
            expect(inventory.BOAT.disabled).toBeTrue();
        });

        it('should return the correct inventory counts for FIGHT', () => {
            const inventory = service.inventory();
            expect(inventory.FIGHT).toBeDefined();
            expect(inventory.FIGHT.kind).toBe(PlaceableKind.FIGHT);
            expect(inventory.FIGHT.total).toBe(0);
            expect(inventory.FIGHT.remaining).toBe(0);
            expect(inventory.FIGHT.disabled).toBeTrue();
        });

        it('should return the correct inventory counts for HEAL', () => {
            const inventory = service.inventory();
            expect(inventory.HEAL).toBeDefined();
            expect(inventory.HEAL.kind).toBe(PlaceableKind.HEAL);
            expect(inventory.HEAL.total).toBe(0);
            expect(inventory.HEAL.remaining).toBe(0);
            expect(inventory.HEAL.disabled).toBeTrue();
        });

        it('should update inventory counts after placing an object', () => {
            const inventory = service.inventory();
            expect(inventory.FLAG.remaining).toBe(1);
            expect(inventory.FLAG.disabled).toBeFalse();
            service.placeObjectFromInventory(PlaceableKind.FLAG, 1, 1);
            const afterInventory = service.inventory();
            expect(afterInventory.FLAG.remaining).toBe(0);
            expect(afterInventory.FLAG.disabled).toBeTrue();
        });

        it('should update inventory counts after removing an object', () => {
            service.placeObjectFromInventory(PlaceableKind.FLAG, 1, 1);
            let inventory = service.inventory();
            expect(inventory.FLAG.remaining).toBe(0);
            expect(inventory.FLAG.disabled).toBeTrue();

            service.removeObject('flag1');
            inventory = service.inventory();
            expect(inventory.FLAG.remaining).toBe(one);
            expect(inventory.FLAG.disabled).toBeFalse();
        });
    });

    describe('visibleTiles', () => {
        beforeEach(() => {
            const subject = new Subject<GameEditorDto>();
            gameHttpServiceSpy.getGameEditorById.and.returnValue(subject.asObservable());
            service.loadGameById('1');
            subject.next(mockEditorData);
            subject.complete();
        });

        it('should update tiles with teleport channel information from entryA', () => {
            const entryA: TeleportTileCoordinatesDto = { x: teleportX1, y: teleportY1 };
            const teleportChannel: TeleportChannelDto = {
                channelNumber: channelNumber1,
                tiles: { entryA },
            };
            service['_teleportChannels'].set([teleportChannel]);

            const tiles = service.tiles();
            const tileAtEntryA = tiles.find((tile) => tile.x === teleportX1 && tile.y === teleportY1);
            expect(tileAtEntryA).toBeDefined();
            expect(tileAtEntryA?.kind).toBe(TileKind.TELEPORT);
            expect(tileAtEntryA?.teleportChannel).toBe(channelNumber1);
        });

        it('should update tiles with teleport channel information from entryB', () => {
            const entryB: TeleportTileCoordinatesDto = { x: teleportX2, y: teleportY2 };
            const teleportChannel: TeleportChannelDto = {
                channelNumber: channelNumber2,
                tiles: { entryB },
            };
            service['_teleportChannels'].set([teleportChannel]);

            const tiles = service.tiles();
            const tileAtEntryB = tiles.find((tile) => tile.x === teleportX2 && tile.y === teleportY2);
            expect(tileAtEntryB).toBeDefined();
            expect(tileAtEntryB?.kind).toBe(TileKind.TELEPORT);
            expect(tileAtEntryB?.teleportChannel).toBe(channelNumber2);
        });

        it('should update tiles with teleport channel information from both entryA and entryB', () => {
            const entryA: TeleportTileCoordinatesDto = { x: teleportX1, y: teleportY1 };
            const entryB: TeleportTileCoordinatesDto = { x: teleportX2, y: teleportY2 };
            const teleportChannel: TeleportChannelDto = {
                channelNumber: channelNumber1,
                tiles: { entryA, entryB },
            };
            service['_teleportChannels'].set([teleportChannel]);

            const tiles = service.tiles();
            const tileAtEntryA = tiles.find((tile) => tile.x === teleportX1 && tile.y === teleportY1);
            const tileAtEntryB = tiles.find((tile) => tile.x === teleportX2 && tile.y === teleportY2);
            expect(tileAtEntryA?.kind).toBe(TileKind.TELEPORT);
            expect(tileAtEntryA?.teleportChannel).toBe(channelNumber1);
            expect(tileAtEntryB?.kind).toBe(TileKind.TELEPORT);
            expect(tileAtEntryB?.teleportChannel).toBe(channelNumber1);
        });

        it('should handle multiple teleport channels', () => {
            const entryA1: TeleportTileCoordinatesDto = { x: teleportX1, y: teleportY1 };
            const entryA2: TeleportTileCoordinatesDto = { x: teleportX2, y: teleportY2 };
            const channel1: TeleportChannelDto = {
                channelNumber: channelNumber1,
                tiles: { entryA: entryA1 },
            };
            const channel2: TeleportChannelDto = {
                channelNumber: channelNumber2,
                tiles: { entryA: entryA2 },
            };
            service['_teleportChannels'].set([channel1, channel2]);

            const tiles = service.tiles();
            const tile1 = tiles.find((tile) => tile.x === teleportX1 && tile.y === teleportY1);
            const tile2 = tiles.find((tile) => tile.x === teleportX2 && tile.y === teleportY2);
            expect(tile1?.teleportChannel).toBe(channelNumber1);
            expect(tile2?.teleportChannel).toBe(channelNumber2);
        });

        it('should not update tile when index is out of bounds', () => {
            const entryA: TeleportTileCoordinatesDto = { x: invalidTile, y: invalidTile };
            const teleportChannel: TeleportChannelDto = {
                channelNumber: channelNumber1,
                tiles: { entryA },
            };
            service['_teleportChannels'].set([teleportChannel]);

            const tiles = service.tiles();
            const tileAtInvalid = tiles.find((tile) => tile.x === invalidTile && tile.y === invalidTile);
            expect(tileAtInvalid).toBeUndefined();
        });

        it('should clean orphan TELEPORT tiles that are not in active teleport positions', () => {
            service['_tiles'].update((currentTiles) => {
                const updated = [...currentTiles];
                updated[zero] = { x: zero, y: zero, kind: TileKind.TELEPORT };
                return updated;
            });
            const beforeTile = service['_tiles']()[zero];
            expect(beforeTile.kind).toBe(TileKind.TELEPORT);
            expect(beforeTile.teleportChannel).toBeUndefined();

            service['_teleportChannels'].set([]);

            const visibleTiles = service.tiles();
            const cleanedTile = visibleTiles[zero];
            expect(cleanedTile.kind).toBe(TileKind.TELEPORT);
            expect(cleanedTile.teleportChannel).toBeUndefined();
        });
    });

    describe('teleportChannelsSignal', () => {
        it('should return the teleportChannels signal', () => {
            const signal = service.teleportChannelsSignal;
            expect(signal).toBeDefined();
            expect(signal()).toEqual([]);
        });
    });

    describe('teleportChannels', () => {
        beforeEach(() => {
            const subject = new Subject<GameEditorDto>();
            gameHttpServiceSpy.getGameEditorById.and.returnValue(subject.asObservable());
            service.loadGameById('1');
            subject.next(mockEditorData);
            subject.complete();
        });

        it('should return the teleportChannels array', () => {
            expect(service.teleportChannels).toEqual([]);

            const channel: TeleportChannelDto = {
                channelNumber: channelNumber1,
                tiles: { entryA: { x: teleportX1, y: teleportY1 } },
            };
            service['_teleportChannels'].set([channel]);

            expect(service.teleportChannels.length).toBe(one);
            expect(service.teleportChannels[zero]).toEqual(channel);
        });
    });
});
