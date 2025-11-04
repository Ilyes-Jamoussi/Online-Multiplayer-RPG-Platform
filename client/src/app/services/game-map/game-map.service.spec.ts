import { TestBed } from '@angular/core/testing';
import { GameMapService } from './game-map.service';
import { GameHttpService } from '@app/services/game-http/game-http.service';
import { NotificationCoordinatorService } from '@app/services/notification-coordinator/notification-coordinator.service';
import { InGameService } from '@app/services/in-game/in-game.service';
import { AssetsService } from '@app/services/assets/assets.service';
import { InGameSocketService } from '@app/services/in-game-socket/in-game-socket.service';
import { GameMode } from '@common/enums/game-mode.enum';
import { MapSize } from '@common/enums/map-size.enum';
import { PlaceableKind } from '@common/enums/placeable-kind.enum';
import { TileKind } from '@common/enums/tile.enum';
import { Avatar } from '@common/enums/avatar.enum';

import { of, throwError } from 'rxjs';
import { signal } from '@angular/core';

describe('GameMapService', () => {
    let service: GameMapService;
    let mockGameHttpService: jasmine.SpyObj<GameHttpService>;
    let mockNotificationService: jasmine.SpyObj<NotificationCoordinatorService>;
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
        attack: 4,
        baseDefense: 4,
        defenseBonus: 0,
        defense: 4,
        attackDice: 'D6' as any,
        defenseDice: 'D6' as any,
        x: 5,
        y: 10,
        isInGame: true,
        startPointId: '',
        actionsRemaining: 1,
        combatCount: 0,
        combatWins: 0,
        combatLosses: 0,
        combatDraws: 0,
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
    };

    beforeEach(() => {
        mockGameHttpService = jasmine.createSpyObj('GameHttpService', ['getGameEditorById']);
        mockNotificationService = jasmine.createSpyObj('NotificationCoordinatorService', ['displayErrorPopup']);
        mockInGameService = jasmine.createSpyObj('InGameService', [
            'deactivateActionMode', 'toggleDoorAction', 'getPlayerByPlayerId'
        ], {
            inGamePlayers: signal({ player1: mockPlayer }),
            startPoints: signal([{ id: 'start1', x: 0, y: 0 }]),
            reachableTiles: signal([{ x: 1, y: 1, cost: 1, remainingPoints: 2 }]),
            isMyTurn: signal(true),
            isActionModeActive: signal(false),
            availableActions: signal([]),
            currentlyPlayers: [mockPlayer]
        });
        mockAssetsService = jasmine.createSpyObj('AssetsService', ['getAvatarStaticImage']);
        mockInGameSocketService = jasmine.createSpyObj('InGameSocketService', ['onDoorToggled']);

        TestBed.configureTestingModule({
            providers: [
                GameMapService,
                { provide: GameHttpService, useValue: mockGameHttpService },
                { provide: NotificationCoordinatorService, useValue: mockNotificationService },
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
            expect(service.name()).toBe('');
            expect(service.description()).toBe('');
            expect(service.mode()).toBe(GameMode.CLASSIC);
            expect(service.tiles()).toEqual([]);
            expect(service.objects()).toEqual([]);
        });

        it('should return in-game service properties', () => {
            expect(service.players).toEqual({ player1: mockPlayer });
            expect(service.reachableTiles).toEqual([{ x: 1, y: 1, cost: 1, remainingPoints: 2 }]);
            expect(service.isMyTurn).toBe(true);
            expect(service.isActionModeActive).toBe(false);
            expect(service.availableActions).toEqual([]);
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
                configurable: true
            });
            Object.defineProperty(mockInGameService, 'availableActions', {
                value: signal([{ x: 1, y: 1, type: 'ATTACK' }]),
                configurable: true
            });

            const tileClass = service.getTileClass(1, 1);
            expect(tileClass).toBe('reachable-tile action-attack');
        });

        it('should return door action class', () => {
            Object.defineProperty(mockInGameService, 'isActionModeActive', {
                value: signal(true),
                configurable: true
            });
            Object.defineProperty(mockInGameService, 'availableActions', {
                value: signal([{ x: 1, y: 1, type: 'DOOR' }]),
                configurable: true
            });

            const tileClass = service.getTileClass(1, 1);
            expect(tileClass).toBe('reachable-tile action-door');
        });

        it('should return empty string for non-reachable tiles', () => {
            const tileClass = service.getTileClass(5, 5);
            expect(tileClass).toBe('');
        });
    });

    describe('Actions', () => {
        it('should get action type and deactivate action mode', () => {
            Object.defineProperty(mockInGameService, 'availableActions', {
                value: signal([{ x: 1, y: 1, type: 'ATTACK' }]),
                configurable: true
            });

            const actionType = service.getActionTypeAt(1, 1);
            expect(actionType).toBe('ATTACK');
            expect(mockInGameService.deactivateActionMode).toHaveBeenCalled();
        });

        it('should return null when no action at coordinates', () => {
            const actionType = service.getActionTypeAt(5, 5);
            expect(actionType).toBeNull();
        });

        it('should deactivate action mode', () => {
            service.deactivateActionMode();
            expect(mockInGameService.deactivateActionMode).toHaveBeenCalled();
        });

        it('should toggle door', () => {
            service.toggleDoor(1, 1);
            expect(mockInGameService.toggleDoorAction).toHaveBeenCalledWith(1, 1);
        });

        it('should update tile state', () => {
            service.updateTileState(1, 1, false);
            expect(service).toBeTruthy();
        });
    });

    describe('Tile Modal', () => {
        it('should open tile modal', () => {
            service.openTileModal(mockTile);
            expect(service.activeTileCoords()).toEqual({ x: 1, y: 1 });
        });

        it('should close tile modal', () => {
            service.openTileModal(mockTile);
            service.closeTileModal();
            expect(service.activeTileCoords()).toBeNull();
        });

        it('should check if tile modal is open', () => {
            service.openTileModal(mockTile);
            expect(service.isTileModalOpen(mockTile)).toBe(true);
            expect(service.isTileModalOpen({ ...mockTile, x: 2 })).toBe(false);
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
            service.openTileModal({ x: 5, y: 10, kind: TileKind.BASE });
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
            const player = service.getPlayerOnTile({ x: 5, y: 10 });
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
                message: 'Erreur lors du chargement de la carte'
            });
        });
    });

    describe('Avatar', () => {
        it('should get avatar by player id', () => {
            mockInGameService.getPlayerByPlayerId.and.returnValue({ ...mockPlayer, avatar: Avatar.Avatar1 } as any);
            mockAssetsService.getAvatarStaticImage.and.returnValue('/avatar1.png');
            
            const avatar = service.getAvatarByPlayerId('player1');
            
            expect(avatar).toBe('/avatar1.png');
            expect(mockInGameService.getPlayerByPlayerId).toHaveBeenCalledWith('player1');
            expect(mockAssetsService.getAvatarStaticImage).toHaveBeenCalledWith(Avatar.Avatar1);
        });

        it('should return empty string when player has no avatar', () => {
            mockInGameService.getPlayerByPlayerId.and.returnValue({ ...mockPlayer, avatar: null } as any);
            
            const avatar = service.getAvatarByPlayerId('player1');
            
            expect(avatar).toBe('');
        });

        it('should return empty string when player not found', () => {
            mockInGameService.getPlayerByPlayerId.and.returnValue(null as any);
            
            const avatar = service.getAvatarByPlayerId('nonexistent');
            
            expect(avatar).toBe('');
        });
    });

    describe('Reset', () => {
        it('should reset to initial state', () => {
            service.openTileModal(mockTile);
            service.reset();
            
            expect(service.size()).toBe(MapSize.MEDIUM);
            expect(service.name()).toBe('');
            expect(service.description()).toBe('');
            expect(service.mode()).toBe(GameMode.CLASSIC);
            expect(service.tiles()).toEqual([]);
            expect(service.objects()).toEqual([]);
            expect(service.activeTileCoords()).toBeNull();
        });
    });

    describe('Door Listener', () => {
        it('should handle door toggled event', () => {
            const callback = mockInGameSocketService.onDoorToggled.calls.mostRecent().args[0];
            spyOn(service, 'updateTileState');
            
            callback({ x: 1, y: 1, isOpen: false });
            
            expect(service.updateTileState).toHaveBeenCalledWith(1, 1, false);
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
});