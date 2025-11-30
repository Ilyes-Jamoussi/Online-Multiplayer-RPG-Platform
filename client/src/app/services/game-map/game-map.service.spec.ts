/* eslint-disable max-lines -- Test file */
import { TestBed } from '@angular/core/testing';
import { AssetsService } from '@app/services/assets/assets.service';
import { GameHttpService } from '@app/services/game-http/game-http.service';
import { InGameSocketService } from '@app/services/in-game-socket/in-game-socket.service';
import { InGameService } from '@app/services/in-game/in-game.service';
import { NotificationService } from '@app/services/notification/notification.service';
import { AvailableActionType } from '@common/enums/available-action-type.enum';
import { Avatar } from '@common/enums/avatar.enum';
import { Dice } from '@common/enums/dice.enum';
import { GameMode } from '@common/enums/game-mode.enum';
import { MapSize } from '@common/enums/map-size.enum';
import { PlaceableKind } from '@common/enums/placeable-kind.enum';
import { TileKind } from '@common/enums/tile.enum';
import { Player } from '@common/interfaces/player.interface';
import { Position } from '@common/interfaces/position.interface';
import { GameMapService } from './game-map.service';

import { signal } from '@angular/core';
import { GameEditorTileDto } from '@app/dto/game-editor-tile-dto';
import { of, throwError } from 'rxjs';

const TEST_COORDINATE_5 = 5;
const TEST_COORDINATE_10 = 10;
const TEST_COORDINATE_10_OBJ = 10;
const TEST_COORDINATE_11_TARGET = 11;
const TEST_COORDINATE_20 = 20;

describe('GameMapService', () => {
    let service: GameMapService;
    let mockGameHttpService: jasmine.SpyObj<GameHttpService>;
    let mockNotificationService: jasmine.SpyObj<NotificationService>;
    let mockInGameService: jasmine.SpyObj<InGameService>;
    let mockAssetsService: jasmine.SpyObj<AssetsService>;
    let mockInGameSocketService: jasmine.SpyObj<InGameSocketService>;

    const mockPlayer = {
        id: 'player1',
        name: 'Test Player',
        avatar: Avatar.Avatar1,
        isAdmin: false,
        baseHealth: 4,
        healthBonus: 0,
        health: 4,
        maxHealth: 4,
        baseSpeed: 3,
        speedBonus: 0,
        speed: 3,
        baseAttack: 4,
        attackBonus: 0,
        baseDefense: 4,
        defenseBonus: 0,
        attackDice: Dice.D6,
        defenseDice: Dice.D6,
        x: TEST_COORDINATE_5,
        y: TEST_COORDINATE_10,
        isInGame: true,
        startPointId: '',
        actionsRemaining: 1,
        combatCount: 0,
        combatWins: 0,
        combatLosses: 0,
        combatDraws: 0,
        hasCombatBonus: false,
        boatSpeedBonus: 0,
        boatSpeed: 0,
    };

    const mockTile = {
        x: 1,
        y: 1,
        kind: TileKind.BASE,
        open: true,
    };

    const mockObject = {
        id: 'obj1',
        x: 2,
        y: 2,
        kind: PlaceableKind.FLAG,
        orientation: 'north',
        placed: true,
    };

    const mockGameData = {
        id: 'game1',
        name: 'Test Game',
        description: 'Test Description',
        size: MapSize.SMALL,
        mode: GameMode.CLASSIC,
        tiles: [mockTile],
        objects: [mockObject],
        gridPreviewUrl: '',
        lastModified: '',
        teleportChannels: [],
    };

    beforeEach(() => {
        mockGameHttpService = jasmine.createSpyObj('GameHttpService', ['getGameEditorById']);
        mockNotificationService = jasmine.createSpyObj('NotificationService', ['displayErrorPopup']);
        mockInGameService = jasmine.createSpyObj(
            'InGameService',
            [
                'deactivateActionMode',
                'toggleDoorAction',
                'getPlayerByPlayerId',
                'resetActions',
                'healPlayer',
                'fightPlayer',
                'boatAction',
                'requestFlagTransfer',
            ],
            {
                inGamePlayers: signal({ player1: mockPlayer }),
                startPoints: signal([{ id: 'start1', x: 0, y: 0 }]),
                reachableTiles: signal([{ x: 1, y: 1, cost: 1, remainingPoints: 2 }]),
                isMyTurn: signal(true),
                isActionModeActive: signal(false),
                availableActions: signal([]),
                currentlyPlayers: [mockPlayer],
                flagData: signal(undefined),
            },
        );
        mockAssetsService = jasmine.createSpyObj('AssetsService', ['getAvatarStaticImage']);
        mockInGameSocketService = jasmine.createSpyObj('InGameSocketService', ['onDoorToggled', 'onPlaceableUpdated', 'onPlaceableDisabledUpdated']);

        TestBed.configureTestingModule({
            providers: [
                GameMapService,
                { provide: GameHttpService, useValue: mockGameHttpService },
                { provide: NotificationService, useValue: mockNotificationService },
                { provide: InGameService, useValue: mockInGameService },
                { provide: AssetsService, useValue: mockAssetsService },
                { provide: InGameSocketService, useValue: mockInGameSocketService },
            ],
        });
        service = TestBed.inject(GameMapService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    describe('Properties', () => {
        it('should return initial state properties', () => {
            expect(service.size()).toBe(MapSize.MEDIUM);
            expect(service.tiles()).toEqual([]);
            expect(service.objects()).toEqual([]);
        });

        it('should return in-game service properties', () => {
            expect(service.isActionModeActive).toBe(false);
            expect(service.currentlyPlayers).toEqual([mockPlayer]);
        });
    });

    describe('Tile Classes', () => {
        it('should return reachable-tile class for reachable tiles', () => {
            const tileClass = service.getTileClass(1, 1);
            expect(tileClass).toBe('reachable-tile');
        });

        it('should return action class when action mode is active', () => {
            Object.defineProperty(mockInGameService, 'isActionModeActive', {
                value: signal(true),
                configurable: true,
            });
            Object.defineProperty(mockInGameService, 'availableActions', {
                value: signal([{ x: 1, y: 1, type: AvailableActionType.ATTACK }]),
                configurable: true,
            });

            const tileClass = service.getTileClass(1, 1);
            expect(tileClass).toBe('reachable-tile action-attack');
        });

        it('should return door action class', () => {
            Object.defineProperty(mockInGameService, 'isActionModeActive', {
                value: signal(true),
                configurable: true,
            });
            Object.defineProperty(mockInGameService, 'availableActions', {
                value: signal([{ x: 1, y: 1, type: AvailableActionType.DOOR }]),
                configurable: true,
            });

            const tileClass = service.getTileClass(1, 1);
            expect(tileClass).toBe('reachable-tile action-door');
        });

        it('should return empty string for non-reachable tiles', () => {
            const tileClass = service.getTileClass(TEST_COORDINATE_5, TEST_COORDINATE_5);
            expect(tileClass).toBe('');
        });
    });

    describe('Actions', () => {
        it('should get action type and deactivate action mode', () => {
            Object.defineProperty(mockInGameService, 'availableActions', {
                value: signal([{ x: 1, y: 1, type: AvailableActionType.ATTACK }]),
                configurable: true,
            });

            const actionType = service.getActionTypeAt(1, 1);
            expect(actionType).toBe(AvailableActionType.ATTACK);
            expect(mockInGameService.resetActions).toHaveBeenCalled();
        });

        it('should return null when no action at coordinates', () => {
            const actionType = service.getActionTypeAt(TEST_COORDINATE_5, TEST_COORDINATE_5);
            expect(actionType).toBeNull();
        });

        it('should toggle door', () => {
            service.toggleDoor(1, 1);
            expect(mockInGameService.toggleDoorAction).toHaveBeenCalledWith(1, 1);
        });
    });

    describe('Tile Modal', () => {
        it('should open tile modal', () => {
            service.openTileModal(mockTile);
        });

        it('should close tile modal', () => {
            service.openTileModal(mockTile);
            service.closeTileModal();
        });

        it('should check if tile modal is open', () => {
            service.openTileModal(mockTile);
            expect(service.isTileModalOpen(mockTile)).toBe(true);
            expect(service.isTileModalOpen({ ...mockTile, x: 2 } as typeof mockTile)).toBe(false);
        });

        it('should get active tile', () => {
            mockGameHttpService.getGameEditorById.and.returnValue(of(mockGameData));
            service.loadGameMap('game1');
            service.openTileModal(mockTile);

            expect(service.getActiveTile()).toBeDefined();
        });

        it('should return null when no active tile coords', () => {
            expect(service.getActiveTile()).toBeNull();
        });

        it('should get active tile with custom coords', () => {
            const customCoords = { x: 2, y: 2 };
            const result = service.getActiveTile(customCoords);
            expect(result).toBeDefined();
        });
    });

    describe('Players and Objects on Tiles', () => {
        it('should get player on tile', () => {
            service.openTileModal({ x: TEST_COORDINATE_5, y: TEST_COORDINATE_10, kind: TileKind.BASE });
            const player = service.getPlayerOnTile();
            expect(player).toEqual(mockPlayer);
        });

        it('should return undefined when no player on tile', () => {
            service.openTileModal({ x: 0, y: 0, kind: TileKind.BASE });
            const player = service.getPlayerOnTile();
            expect(player).toBeUndefined();
        });

        it('should return undefined when no active tile coords for player', () => {
            const player = service.getPlayerOnTile();
            expect(player).toBeUndefined();
        });

        it('should get player on tile with custom coords', () => {
            const player = service.getPlayerOnTile({ x: TEST_COORDINATE_5, y: TEST_COORDINATE_10 });
            expect(player).toEqual(mockPlayer);
        });

        it('should get object on tile', () => {
            service['_objects'].set([mockObject]);
            service.openTileModal({ x: 2, y: 2, kind: TileKind.BASE });
            const obj = service.getObjectOnTile();
            expect(obj).toEqual(mockObject);
        });

        it('should return undefined when no object on tile', () => {
            service.openTileModal({ x: 0, y: 0, kind: TileKind.BASE });
            const obj = service.getObjectOnTile();
            expect(obj).toBeUndefined();
        });

        it('should handle objects with footprint 2', () => {
            const largeObject = { ...mockObject, kind: PlaceableKind.HEAL, x: 1, y: 1 };
            service['_objects'].set([largeObject]);

            const obj = service.getObjectOnTile({ x: 2, y: 1 });
            expect(obj).toEqual(largeObject);
        });

        it('should handle object with footprint 2 at position (targetX - 1, targetY) - covering line 163', () => {
            const healObject = {
                id: 'heal-unique',
                x: TEST_COORDINATE_10_OBJ,
                y: TEST_COORDINATE_20,
                kind: PlaceableKind.HEAL,
                orientation: 'north',
                placed: true,
            };
            service['_objects'].set([healObject]);

            const visibleObjs = service.visibleObjects();
            expect(visibleObjs.length).toBeGreaterThan(0);
            expect(visibleObjs.some((visibleObj) => visibleObj.id === 'heal-unique')).toBe(true);

            const obj = service.getObjectOnTile({ x: TEST_COORDINATE_11_TARGET, y: TEST_COORDINATE_20 });
            expect(obj).toBeDefined();
            expect(obj?.id).toBe('heal-unique');
            expect(obj?.x).toBe(TEST_COORDINATE_10_OBJ);
            expect(obj?.y).toBe(TEST_COORDINATE_20);
        });

        it('should return undefined when object does not match and has footprint 1', () => {
            const flagObject = { ...mockObject, kind: PlaceableKind.FLAG, x: 3, y: 3 };
            service['_objects'].set([flagObject]);

            const obj = service.getObjectOnTile({ x: 2, y: 2 });
            expect(obj).toBeUndefined();
        });

        it('should return undefined when no coords provided and no active tile coords', () => {
            service['_activeTileCoords'].set(null);
            const obj = service.getObjectOnTile();
            expect(obj).toBeUndefined();
        });

        it('should handle object with footprint 2 at position (targetX, targetY - 1)', () => {
            const largeObject = { ...mockObject, kind: PlaceableKind.HEAL, x: 1, y: 0 };
            service['_objects'].set([largeObject]);

            const obj = service.getObjectOnTile({ x: 1, y: 1 });
            expect(obj).toEqual(largeObject);
        });

        it('should handle object with footprint 2 at position (targetX - 1, targetY)', () => {
            const largeObject = { ...mockObject, kind: PlaceableKind.HEAL, x: 0, y: 1 };
            service['_objects'].set([largeObject]);

            const obj = service.getObjectOnTile({ x: 1, y: 1 });
            expect(obj).toEqual(largeObject);
        });
    });

    describe('Game Map Loading', () => {
        it('should load game map successfully', () => {
            mockGameHttpService.getGameEditorById.and.returnValue(of(mockGameData));

            service.loadGameMap('game1');

            expect(mockGameHttpService.getGameEditorById).toHaveBeenCalledWith('game1');
        });

        it('should handle load game map error', () => {
            mockGameHttpService.getGameEditorById.and.returnValue(throwError('Error'));

            service.loadGameMap('game1');

            expect(mockNotificationService.displayErrorPopup).toHaveBeenCalledWith({
                title: 'Erreur',
                message: 'Erreur lors du chargement de la carte',
            });
        });

        it('should set open to false when tile.open is undefined', () => {
            const gameDataWithUndefinedOpen = {
                ...mockGameData,
                tiles: [{ x: 1, y: 1, kind: TileKind.DOOR } as GameEditorTileDto],
            };
            mockGameHttpService.getGameEditorById.and.returnValue(of(gameDataWithUndefinedOpen));

            service.loadGameMap('game1');

            const tiles = service.tiles();
            const tile = tiles.find((tileItem) => tileItem.x === 1 && tileItem.y === 1);
            expect(tile?.open).toBe(false);
        });
    });

    describe('Avatar', () => {
        it('should get avatar by player id', () => {
            mockInGameService.getPlayerByPlayerId.and.returnValue({ ...mockPlayer, avatar: Avatar.Avatar1 } as Player);
            mockAssetsService.getAvatarStaticImage.and.returnValue('/avatar1.png');

            const avatar = service.getAvatarByPlayerId('player1');

            expect(avatar).toBe('/avatar1.png');
            expect(mockInGameService.getPlayerByPlayerId).toHaveBeenCalledWith('player1');
            expect(mockAssetsService.getAvatarStaticImage).toHaveBeenCalledWith(Avatar.Avatar1);
        });

        it('should return empty string when player has no avatar', () => {
            mockInGameService.getPlayerByPlayerId.and.returnValue({ ...mockPlayer, avatar: null } as Player);

            const avatar = service.getAvatarByPlayerId('player1');

            expect(avatar).toBe('');
        });

        it('should return empty string when player not found', () => {
            mockInGameService.getPlayerByPlayerId.and.returnValue(undefined as unknown as Player);

            const avatar = service.getAvatarByPlayerId('nonexistent');

            expect(avatar).toBe('');
        });
    });

    describe('Door Listener', () => {
        it('should handle door toggled event', () => {
            const updateTileStateSpy = spyOn(
                service as unknown as { updateTileState: (x: number, y: number, isOpen: boolean) => void },
                'updateTileState',
            );
            const callback = mockInGameSocketService.onDoorToggled.calls.mostRecent().args[0];

            callback({ x: 1, y: 1, isOpen: false });

            expect(updateTileStateSpy).toHaveBeenCalledWith(1, 1, false);
        });

        it('should update tile state when door is toggled', () => {
            const tiles = [{ x: 1, y: 1, kind: TileKind.DOOR, open: true }];
            service['_tiles'].set(tiles);
            const callback = mockInGameSocketService.onDoorToggled.calls.mostRecent().args[0];

            callback({ x: 1, y: 1, isOpen: false });

            const updatedTiles = service.tiles();
            const updatedTile = updatedTiles.find((tile) => tile.x === 1 && tile.y === 1);
            expect(updatedTile?.open).toBe(false);
        });

        it('should not update other tiles when updating a specific tile', () => {
            const tiles = [
                { x: 1, y: 1, kind: TileKind.DOOR, open: true },
                { x: 2, y: 2, kind: TileKind.DOOR, open: true },
            ];
            service['_tiles'].set(tiles);
            const callback = mockInGameSocketService.onDoorToggled.calls.mostRecent().args[0];

            callback({ x: 1, y: 1, isOpen: false });

            const updatedTiles = service.tiles();
            const updatedTile1 = updatedTiles.find((tile) => tile.x === 1 && tile.y === 1);
            const updatedTile2 = updatedTiles.find((tile) => tile.x === 2 && tile.y === 2);
            expect(updatedTile1?.open).toBe(false);
            expect(updatedTile2?.open).toBe(true);
        });
    });

    describe('Visible Objects', () => {
        it('should filter visible objects correctly', () => {
            const startObject = { ...mockObject, kind: PlaceableKind.START, id: 'start1' };
            const hiddenStartObject = { ...mockObject, kind: PlaceableKind.START, id: 'start2' };

            service['_objects'].set([mockObject, startObject, hiddenStartObject]);

            const visibleObjects = service.visibleObjects();

            expect(visibleObjects).toContain(mockObject);
            expect(visibleObjects).toContain(startObject);
            expect(visibleObjects).not.toContain(hiddenStartObject);
        });
    });

    describe('getActionClass', () => {
        const MOCK_X = 1;
        const MOCK_Y = 1;

        beforeEach(() => {
            Object.defineProperty(mockInGameService, 'isActionModeActive', {
                value: signal(true),
                configurable: true,
            });
        });

        it('should return action-heal class for HEAL action', () => {
            Object.defineProperty(mockInGameService, 'availableActions', {
                value: signal([{ x: MOCK_X, y: MOCK_Y, type: AvailableActionType.HEAL }]),
                configurable: true,
            });
            const tileClass = service.getTileClass(MOCK_X, MOCK_Y);
            expect(tileClass).toContain('action-heal');
        });

        it('should return action-fight class for FIGHT action', () => {
            Object.defineProperty(mockInGameService, 'availableActions', {
                value: signal([{ x: MOCK_X, y: MOCK_Y, type: AvailableActionType.FIGHT }]),
                configurable: true,
            });
            const tileClass = service.getTileClass(MOCK_X, MOCK_Y);
            expect(tileClass).toContain('action-fight');
        });

        it('should return action-boat class for BOAT action', () => {
            Object.defineProperty(mockInGameService, 'availableActions', {
                value: signal([{ x: MOCK_X, y: MOCK_Y, type: AvailableActionType.BOAT }]),
                configurable: true,
            });
            const tileClass = service.getTileClass(MOCK_X, MOCK_Y);
            expect(tileClass).toContain('action-boat');
        });

        it('should return action-transfer-flag class for TRANSFER_FLAG action', () => {
            Object.defineProperty(mockInGameService, 'availableActions', {
                value: signal([{ x: MOCK_X, y: MOCK_Y, type: AvailableActionType.TRANSFER_FLAG }]),
                configurable: true,
            });
            const tileClass = service.getTileClass(MOCK_X, MOCK_Y);
            expect(tileClass).toContain('action-transfer-flag');
        });
    });

    describe('healPlayer', () => {
        const MOCK_X = 2;
        const MOCK_Y = 3;

        it('should call inGameService.healPlayer with coordinates', () => {
            service.healPlayer(MOCK_X, MOCK_Y);
            expect(mockInGameService.healPlayer).toHaveBeenCalledWith(MOCK_X, MOCK_Y);
        });
    });

    describe('fightPlayer', () => {
        const MOCK_X = 4;
        const MOCK_Y = 5;

        it('should call inGameService.fightPlayer with coordinates', () => {
            service.fightPlayer(MOCK_X, MOCK_Y);
            expect(mockInGameService.fightPlayer).toHaveBeenCalledWith(MOCK_X, MOCK_Y);
        });
    });

    describe('updateObjectState', () => {
        const MOCK_PLACEABLE_ID = 'placeable1';
        const MOCK_X = 3;
        const MOCK_Y = 4;

        it('should update object when _id matches', () => {
            const existingObject = { ...mockObject, id: MOCK_PLACEABLE_ID };
            service['_objects'].set([existingObject]);
            const callback = mockInGameSocketService.onPlaceableUpdated.calls.mostRecent().args[0];

            const updatedPlaceable = {
                _id: MOCK_PLACEABLE_ID,
                kind: PlaceableKind.FLAG,
                x: MOCK_X,
                y: MOCK_Y,
                placed: true,
            };

            callback(updatedPlaceable);

            const objects = service.objects();
            const updatedObject = objects.find((obj) => obj.id === MOCK_PLACEABLE_ID);
            expect(updatedObject).toBeDefined();
            expect(updatedObject?.x).toBe(MOCK_X);
            expect(updatedObject?.y).toBe(MOCK_Y);
            expect(updatedObject?.id).toBe(MOCK_PLACEABLE_ID);
        });

        it('should not update object when _id does not match', () => {
            const existingObject = { ...mockObject, id: MOCK_PLACEABLE_ID };
            service['_objects'].set([existingObject]);
            const callback = mockInGameSocketService.onPlaceableUpdated.calls.mostRecent().args[0];

            const updatedPlaceable = {
                _id: 'other-id',
                kind: PlaceableKind.FLAG,
                x: MOCK_X,
                y: MOCK_Y,
                placed: true,
            };

            callback(updatedPlaceable);

            const objects = service.objects();
            const existingObj = objects.find((obj) => obj.id === MOCK_PLACEABLE_ID);
            expect(existingObj?.x).not.toBe(MOCK_X);
        });

        it('should not update object when _id is undefined', () => {
            const existingObject = { ...mockObject, id: MOCK_PLACEABLE_ID };
            service['_objects'].set([existingObject]);
            const callback = mockInGameSocketService.onPlaceableUpdated.calls.mostRecent().args[0];

            const updatedPlaceable = {
                kind: PlaceableKind.FLAG,
                x: MOCK_X,
                y: MOCK_Y,
                placed: true,
            };

            callback(updatedPlaceable);

            const objects = service.objects();
            const existingObj = objects.find((obj) => obj.id === MOCK_PLACEABLE_ID);
            expect(existingObj?.x).not.toBe(MOCK_X);
        });
    });

    describe('buildGameMap', () => {
        const MOCK_CHANNEL_NUMBER = 1;
        const MOCK_X_A = 2;
        const MOCK_Y_A = 3;
        const MOCK_X_B = 4;
        const MOCK_Y_B = 5;
        const MOCK_MAP_SIZE = 10;

        it('should update tiles to TELEPORT when teleportChannels have entryA and entryB', () => {
            const gameDataWithTeleports = {
                ...mockGameData,
                size: MOCK_MAP_SIZE,
                tiles: Array.from({ length: MOCK_MAP_SIZE * MOCK_MAP_SIZE }, (_, i) => ({
                    x: i % MOCK_MAP_SIZE,
                    y: Math.floor(i / MOCK_MAP_SIZE),
                    kind: TileKind.BASE,
                })),
                teleportChannels: [
                    {
                        channelNumber: MOCK_CHANNEL_NUMBER,
                        tiles: {
                            entryA: { x: MOCK_X_A, y: MOCK_Y_A },
                            entryB: { x: MOCK_X_B, y: MOCK_Y_B },
                        },
                    },
                ],
            };

            mockGameHttpService.getGameEditorById.and.returnValue(of(gameDataWithTeleports));
            service.loadGameMap('game1');

            const tiles = service.tiles();
            const tileA = tiles.find((tile) => tile.x === MOCK_X_A && tile.y === MOCK_Y_A);
            const tileB = tiles.find((tile) => tile.x === MOCK_X_B && tile.y === MOCK_Y_B);

            expect(tileA?.kind).toBe(TileKind.TELEPORT);
            expect(tileA?.teleportChannel).toBe(MOCK_CHANNEL_NUMBER);
            expect(tileB?.kind).toBe(TileKind.TELEPORT);
            expect(tileB?.teleportChannel).toBe(MOCK_CHANNEL_NUMBER);
        });

        it('should update tile to TELEPORT when teleportChannel has only entryA', () => {
            const gameDataWithTeleportA = {
                ...mockGameData,
                size: MOCK_MAP_SIZE,
                tiles: Array.from({ length: MOCK_MAP_SIZE * MOCK_MAP_SIZE }, (_, i) => ({
                    x: i % MOCK_MAP_SIZE,
                    y: Math.floor(i / MOCK_MAP_SIZE),
                    kind: TileKind.BASE,
                })),
                teleportChannels: [
                    {
                        channelNumber: MOCK_CHANNEL_NUMBER,
                        tiles: {
                            entryA: { x: MOCK_X_A, y: MOCK_Y_A },
                        },
                    },
                ],
            };

            mockGameHttpService.getGameEditorById.and.returnValue(of(gameDataWithTeleportA));
            service.loadGameMap('game1');

            const tiles = service.tiles();
            const tileA = tiles.find((tile) => tile.x === MOCK_X_A && tile.y === MOCK_Y_A);

            expect(tileA?.kind).toBe(TileKind.TELEPORT);
            expect(tileA?.teleportChannel).toBe(MOCK_CHANNEL_NUMBER);
        });

        it('should update tile to TELEPORT when teleportChannel has only entryB', () => {
            const gameDataWithTeleportB = {
                ...mockGameData,
                size: MOCK_MAP_SIZE,
                tiles: Array.from({ length: MOCK_MAP_SIZE * MOCK_MAP_SIZE }, (_, i) => ({
                    x: i % MOCK_MAP_SIZE,
                    y: Math.floor(i / MOCK_MAP_SIZE),
                    kind: TileKind.BASE,
                })),
                teleportChannels: [
                    {
                        channelNumber: MOCK_CHANNEL_NUMBER,
                        tiles: {
                            entryB: { x: MOCK_X_B, y: MOCK_Y_B },
                        },
                    },
                ],
            };

            mockGameHttpService.getGameEditorById.and.returnValue(of(gameDataWithTeleportB));
            service.loadGameMap('game1');

            const tiles = service.tiles();
            const tileB = tiles.find((tile) => tile.x === MOCK_X_B && tile.y === MOCK_Y_B);

            expect(tileB?.kind).toBe(TileKind.TELEPORT);
            expect(tileB?.teleportChannel).toBe(MOCK_CHANNEL_NUMBER);
        });
    });

    describe('boatAction', () => {
        const MOCK_X = 6;
        const MOCK_Y = 7;

        it('should call inGameService.boatAction with coordinates', () => {
            service.boatAction(MOCK_X, MOCK_Y);
            expect(mockInGameService.boatAction).toHaveBeenCalledWith(MOCK_X, MOCK_Y);
        });
    });

    describe('requestFlagTransfer', () => {
        const MOCK_X = 8;
        const MOCK_Y = 9;

        it('should call inGameService.requestFlagTransfer with coordinates', () => {
            service.requestFlagTransfer(MOCK_X, MOCK_Y);
            expect(mockInGameService.requestFlagTransfer).toHaveBeenCalledWith(MOCK_X, MOCK_Y);
        });
    });

    describe('flagData', () => {
        it('should return flagData from inGameService', () => {
            const mockFlagData = {
                position: { x: 0, y: 0 },
                holderPlayerId: 'player1',
            };
            Object.defineProperty(mockInGameService, 'flagData', {
                value: signal(mockFlagData),
                configurable: true,
            });
            const result = service.flagData();
            expect(result).toBe(mockFlagData);
        });
    });

    describe('updateDisabledPlaceable', () => {
        const MOCK_PLACEABLE_ID = 'placeable1';
        const MOCK_TURN_COUNT = 3;
        const MOCK_ZERO_TURN_COUNT = 0;
        const MOCK_POSITIONS: Position[] = [{ x: 1, y: 1 }];

        it('should set disabled placeable when turnCount is greater than 0', () => {
            const callback = mockInGameSocketService.onPlaceableDisabledUpdated.calls.mostRecent().args[0];
            const data = {
                placeableId: MOCK_PLACEABLE_ID,
                turnCount: MOCK_TURN_COUNT,
                positions: MOCK_POSITIONS,
            };

            callback(data);

            const info = service.getDisabledPlaceableInfo(MOCK_PLACEABLE_ID);
            expect(info).toBeDefined();
            expect(info?.turnCount).toBe(MOCK_TURN_COUNT);
            expect(info?.positions).toEqual(MOCK_POSITIONS);
        });

        it('should delete disabled placeable when turnCount is 0', () => {
            const callback = mockInGameSocketService.onPlaceableDisabledUpdated.calls.mostRecent().args[0];
            const setData = {
                placeableId: MOCK_PLACEABLE_ID,
                turnCount: MOCK_TURN_COUNT,
                positions: MOCK_POSITIONS,
            };
            callback(setData);

            const deleteData = {
                placeableId: MOCK_PLACEABLE_ID,
                turnCount: MOCK_ZERO_TURN_COUNT,
                positions: MOCK_POSITIONS,
            };
            callback(deleteData);

            const info = service.getDisabledPlaceableInfo(MOCK_PLACEABLE_ID);
            expect(info).toBeUndefined();
        });

        it('should not update when placeableId is undefined', () => {
            const callback = mockInGameSocketService.onPlaceableDisabledUpdated.calls.mostRecent().args[0];
            const data = {
                turnCount: MOCK_TURN_COUNT,
                positions: MOCK_POSITIONS,
            };

            callback(data);

            const info = service.getDisabledPlaceableInfo(MOCK_PLACEABLE_ID);
            expect(info).toBeUndefined();
        });
    });

    describe('getDisabledPlaceableInfo', () => {
        const MOCK_PLACEABLE_ID = 'placeable1';
        const MOCK_TURN_COUNT = 2;
        const MOCK_POSITIONS: Position[] = [{ x: 2, y: 2 }];

        it('should return undefined when placeable is not disabled', () => {
            const info = service.getDisabledPlaceableInfo(MOCK_PLACEABLE_ID);
            expect(info).toBeUndefined();
        });

        it('should return disabled placeable info when placeable is disabled', () => {
            const callback = mockInGameSocketService.onPlaceableDisabledUpdated.calls.mostRecent().args[0];
            callback({
                placeableId: MOCK_PLACEABLE_ID,
                turnCount: MOCK_TURN_COUNT,
                positions: MOCK_POSITIONS,
            });

            const info = service.getDisabledPlaceableInfo(MOCK_PLACEABLE_ID);
            expect(info).toBeDefined();
            expect(info?.turnCount).toBe(MOCK_TURN_COUNT);
            expect(info?.positions).toEqual(MOCK_POSITIONS);
        });
    });

    describe('isPlaceableDisabled', () => {
        const MOCK_PLACEABLE_ID = 'placeable1';
        const MOCK_TURN_COUNT = 1;
        const MOCK_ZERO_TURN_COUNT = 0;
        const MOCK_POSITIONS: Position[] = [{ x: 3, y: 3 }];

        it('should return false when placeable is not disabled', () => {
            const result = service.isPlaceableDisabled(MOCK_PLACEABLE_ID);
            expect(result).toBe(false);
        });

        it('should return true when placeable is disabled with turnCount > 0', () => {
            const callback = mockInGameSocketService.onPlaceableDisabledUpdated.calls.mostRecent().args[0];
            callback({
                placeableId: MOCK_PLACEABLE_ID,
                turnCount: MOCK_TURN_COUNT,
                positions: MOCK_POSITIONS,
            });

            const result = service.isPlaceableDisabled(MOCK_PLACEABLE_ID);
            expect(result).toBe(true);
        });

        it('should return false when placeable has turnCount 0', () => {
            const callback = mockInGameSocketService.onPlaceableDisabledUpdated.calls.mostRecent().args[0];
            callback({
                placeableId: MOCK_PLACEABLE_ID,
                turnCount: MOCK_TURN_COUNT,
                positions: MOCK_POSITIONS,
            });
            callback({
                placeableId: MOCK_PLACEABLE_ID,
                turnCount: MOCK_ZERO_TURN_COUNT,
                positions: MOCK_POSITIONS,
            });

            const result = service.isPlaceableDisabled(MOCK_PLACEABLE_ID);
            expect(result).toBe(false);
        });
    });

    describe('getPlaceableTurnCount', () => {
        const MOCK_PLACEABLE_ID = 'placeable1';
        const MOCK_TURN_COUNT = 5;
        const MOCK_POSITIONS: Position[] = [{ x: 4, y: 4 }];

        it('should return null when placeable is not disabled', () => {
            const result = service.getPlaceableTurnCount(MOCK_PLACEABLE_ID);
            expect(result).toBeNull();
        });

        it('should return turnCount when placeable is disabled', () => {
            const callback = mockInGameSocketService.onPlaceableDisabledUpdated.calls.mostRecent().args[0];
            callback({
                placeableId: MOCK_PLACEABLE_ID,
                turnCount: MOCK_TURN_COUNT,
                positions: MOCK_POSITIONS,
            });

            const result = service.getPlaceableTurnCount(MOCK_PLACEABLE_ID);
            expect(result).toBe(MOCK_TURN_COUNT);
        });
    });
});
