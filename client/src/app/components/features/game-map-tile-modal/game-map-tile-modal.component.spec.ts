import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { GameEditorPlaceableDto } from '@app/dto/game-editor-placeable-dto';
import { GameEditorTileDto } from '@app/dto/game-editor-tile-dto';
import { AssetsService } from '@app/services/assets/assets.service';
import { GameMapService } from '@app/services/game-map/game-map.service';
import { InGameService } from '@app/services/in-game/in-game.service';
import { PlayerService } from '@app/services/player/player.service';
import { Avatar } from '@common/enums/avatar.enum';
import { Dice } from '@common/enums/dice.enum';
import { PlaceableKind } from '@common/enums/placeable-kind.enum';
import { TileKind } from '@common/enums/tile.enum';
import { Player } from '@common/interfaces/player.interface';
import { GameMapTileModalComponent } from './game-map-tile-modal.component';

const MOCK_PLAYER_ID = 'player1';
const MOCK_OTHER_PLAYER_ID = 'player2';
const MOCK_TEAM_NUMBER = 1;
const MOCK_TEAM_COLOR = '#3b82f6';

describe('GameMapTileModalComponent', () => {
    let component: GameMapTileModalComponent;
    let fixture: ComponentFixture<GameMapTileModalComponent>;
    let mockGameMapService: jasmine.SpyObj<GameMapService>;
    let mockAssetsService: jasmine.SpyObj<AssetsService>;
    let mockInGameService: jasmine.SpyObj<InGameService>;
    let mockPlayerService: jasmine.SpyObj<PlayerService>;

    const mockTile: GameEditorTileDto = {
        x: 1,
        y: 1,
        kind: TileKind.BASE,
        open: true,
    };

    const mockObject: GameEditorPlaceableDto = {
        id: '1',
        x: 1,
        y: 1,
        kind: PlaceableKind.START,
        orientation: 'north',
        placed: true,
    };

    const mockPlayer: Player = {
        id: MOCK_PLAYER_ID,
        name: 'Player 1',
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
        x: 1,
        y: 1,
        isInGame: true,
        startPointId: 'start1',
        actionsRemaining: 2,
        combatCount: 0,
        combatWins: 0,
        combatLosses: 0,
        combatDraws: 0,
        hasCombatBonus: false,
        boatSpeedBonus: 0,
        boatSpeed: 0,
        teamNumber: MOCK_TEAM_NUMBER,
    };

    beforeEach(async () => {
        mockGameMapService = jasmine.createSpyObj('GameMapService', [
            'getObjectOnTile',
            'getPlayerOnTile',
            'getActiveTile',
            'getAvatarByPlayerId',
            'closeTileModal',
        ]);

        mockAssetsService = jasmine.createSpyObj('AssetsService', ['getTileImage', 'getPlaceableImage']);

        mockInGameService = jasmine.createSpyObj('InGameService', [], {
            flagData: signal(undefined),
        });

        mockPlayerService = jasmine.createSpyObj('PlayerService', ['getTeamColor']);

        mockGameMapService.getObjectOnTile.and.returnValue(mockObject);
        mockGameMapService.getPlayerOnTile.and.returnValue(mockPlayer);
        mockGameMapService.getActiveTile.and.returnValue(mockTile);
        mockGameMapService.getAvatarByPlayerId.and.returnValue('/assets/avatar1.png');
        mockAssetsService.getTileImage.and.returnValue('/assets/tile.png');
        mockAssetsService.getPlaceableImage.and.returnValue('/assets/placeable.png');

        await TestBed.configureTestingModule({
            imports: [GameMapTileModalComponent],
            providers: [
                { provide: GameMapService, useValue: mockGameMapService },
                { provide: AssetsService, useValue: mockAssetsService },
                { provide: InGameService, useValue: mockInGameService },
                { provide: PlayerService, useValue: mockPlayerService },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(GameMapTileModalComponent);
        component = fixture.componentInstance;
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should return object on tile from service', () => {
        expect(component.objectOnTile).toBe(mockObject);
        expect(mockGameMapService.getObjectOnTile).toHaveBeenCalled();
    });

    it('should return player on tile from service', () => {
        expect(component.playerOnTile).toBe(mockPlayer);
        expect(mockGameMapService.getPlayerOnTile).toHaveBeenCalled();
    });

    it('should return active tile from service', () => {
        expect(component.activeTile).toBe(mockTile);
        expect(mockGameMapService.getActiveTile).toHaveBeenCalled();
    });

    it('should get tile image with open state', () => {
        const result = component.getTileImage(mockTile);
        expect(result).toBe('/assets/tile.png');
        expect(mockAssetsService.getTileImage).toHaveBeenCalledWith(TileKind.BASE, true);
    });

    it('should get tile image with closed state when open is false', () => {
        const closedTile = { ...mockTile, open: false };
        component.getTileImage(closedTile);
        expect(mockAssetsService.getTileImage).toHaveBeenCalledWith(TileKind.BASE, false);
    });

    it('should get tile image with closed state when open is undefined', () => {
        const tileWithoutOpen = { ...mockTile };
        delete tileWithoutOpen.open;
        component.getTileImage(tileWithoutOpen);
        expect(mockAssetsService.getTileImage).toHaveBeenCalledWith(TileKind.BASE, false);
    });

    it('should return empty string when tile is null', () => {
        const result = component.getTileImage(null as unknown as GameEditorTileDto);
        expect(result).toBe('');
        expect(mockAssetsService.getTileImage).not.toHaveBeenCalled();
    });

    it('should get object image', () => {
        const result = component.getObjectImage(PlaceableKind.START);
        expect(result).toBe('/assets/placeable.png');
        expect(mockAssetsService.getPlaceableImage).toHaveBeenCalledWith(PlaceableKind.START);
    });

    it('should get player avatar', () => {
        const result = component.getPlayerAvatar('player1');
        expect(result).toBe('/assets/avatar1.png');
        expect(mockGameMapService.getAvatarByPlayerId).toHaveBeenCalledWith('player1');
    });

    it('should close modal', () => {
        component.close();
        expect(mockGameMapService.closeTileModal).toHaveBeenCalled();
    });

    it('should return undefined when no object on tile', () => {
        mockGameMapService.getObjectOnTile.and.returnValue(undefined);
        expect(component.objectOnTile).toBeUndefined();
    });

    it('should return undefined when no player on tile', () => {
        mockGameMapService.getPlayerOnTile.and.returnValue(undefined);
        expect(component.playerOnTile).toBeUndefined();
    });

    it('should return null when no active tile', () => {
        mockGameMapService.getActiveTile.and.returnValue(null);
        expect(component.activeTile).toBeNull();
    });

    describe('hasFlag', () => {
        it('should return false when flagData is undefined', () => {
            Object.defineProperty(mockInGameService, 'flagData', {
                value: signal(undefined),
                configurable: true,
            });
            expect(component.hasFlag(mockPlayer)).toBe(false);
        });

        it('should return false when holderPlayerId is null', () => {
            Object.defineProperty(mockInGameService, 'flagData', {
                value: signal({ position: { x: 0, y: 0 }, holderPlayerId: null }),
                configurable: true,
            });
            expect(component.hasFlag(mockPlayer)).toBe(false);
        });

        it('should return false when holderPlayerId does not match player id', () => {
            Object.defineProperty(mockInGameService, 'flagData', {
                value: signal({ position: { x: 0, y: 0 }, holderPlayerId: MOCK_OTHER_PLAYER_ID }),
                configurable: true,
            });
            expect(component.hasFlag(mockPlayer)).toBe(false);
        });

        it('should return true when holderPlayerId matches player id', () => {
            Object.defineProperty(mockInGameService, 'flagData', {
                value: signal({ position: { x: 0, y: 0 }, holderPlayerId: MOCK_PLAYER_ID }),
                configurable: true,
            });
            expect(component.hasFlag(mockPlayer)).toBe(true);
        });
    });

    describe('getTeamNumber', () => {
        it('should return team number when player has one', () => {
            expect(component.getTeamNumber(mockPlayer)).toBe(MOCK_TEAM_NUMBER);
        });

        it('should return undefined when player has no team number', () => {
            const playerWithoutTeam = { ...mockPlayer, teamNumber: undefined };
            expect(component.getTeamNumber(playerWithoutTeam)).toBeUndefined();
        });
    });

    describe('getTeamColor', () => {
        it('should return team color from player service', () => {
            mockPlayerService.getTeamColor.and.returnValue(MOCK_TEAM_COLOR);
            const result = component.getTeamColor(MOCK_TEAM_NUMBER);
            expect(mockPlayerService.getTeamColor).toHaveBeenCalledWith(MOCK_TEAM_NUMBER);
            expect(result).toBe(MOCK_TEAM_COLOR);
        });

        it('should return undefined when teamNumber is undefined', () => {
            mockPlayerService.getTeamColor.and.returnValue(undefined);
            const result = component.getTeamColor(undefined);
            expect(mockPlayerService.getTeamColor).toHaveBeenCalledWith(undefined);
            expect(result).toBeUndefined();
        });
    });
});
