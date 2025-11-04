/* eslint-disable @typescript-eslint/naming-convention -- Test file uses mock objects with underscores */
import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { GameEditorPlaceableDto } from '@app/dto/game-editor-placeable-dto';
import { GameEditorTileDto } from '@app/dto/game-editor-tile-dto';
import { Inventory } from '@app/interfaces/game-editor.interface';
import { GameEditorStoreService } from '@app/services/game-editor-store/game-editor-store.service';
import { GameMode } from '@common/enums/game-mode.enum';
import { MapSize } from '@common/enums/map-size.enum';
import { PlaceableKind } from '@common/enums/placeable-kind.enum';
import { TileKind } from '@common/enums/tile-kind.enum';
import { GameEditorCheckService } from './game-editor-check.service';

export class GameEditorStoreStub implements Partial<GameEditorStoreService> {
    private _name = 'Test Game';
    private _description = 'Test Description';
    private _tileSizePx = 32;

    private readonly tilesSig = signal<GameEditorTileDto[]>([]);
    private readonly objectsSig = signal<GameEditorPlaceableDto[]>([]);
    private readonly sizeSig = signal<MapSize>(MapSize.MEDIUM);
    private readonly modeSig = signal<GameMode>(GameMode.CLASSIC);
    private readonly inventorySig = signal<Inventory>({} as Inventory);

    get name() {
        return this._name;
    }
    set name(value: string) {
        this._name = value;
    }
    get description() {
        return this._description;
    }
    set description(value: string) {
        this._description = value;
    }
    get tileSizePx() {
        return this._tileSizePx;
    }
    set tileSizePx(value: number) {
        this._tileSizePx = value;
    }

    get tiles() {
        return this.tilesSig.asReadonly();
    }
    get objects() {
        return this.objectsSig.asReadonly();
    }
    get size() {
        return this.sizeSig.asReadonly();
    }
    get mode() {
        return this.modeSig.asReadonly();
    }
    get inventory() {
        return this.inventorySig.asReadonly();
    }

    setTiles(value: GameEditorTileDto[]) {
        this.tilesSig.set(value);
    }
    setObjects(value: GameEditorPlaceableDto[]) {
        this.objectsSig.set(value);
    }
    setSize(value: MapSize) {
        this.sizeSig.set(value);
    }
    setMode(value: GameMode) {
        this.modeSig.set(value);
    }
    setInventory(value: Inventory) {
        this.inventorySig.set(value);
    }

    getTileAt(x: number, y: number) {
        const size = this.sizeSig();
        const tilesArray = this.tilesSig();
        if (x < 0 || y < 0 || x >= size || y >= size) return undefined;
        return tilesArray[y * size + x];
    }
}

describe('GameEditorCheckService', () => {
    let service: GameEditorCheckService;
    let store: GameEditorStoreStub;

    const SIZE = MapSize.MEDIUM;

    const DOOR_X = 8;
    const DOOR_Y = 8;
    const LEFT_X = DOOR_X - 1;
    const RIGHT_X = DOOR_X + 1;
    const ABOVE_Y = DOOR_Y - 1;
    const BELOW_Y = DOOR_Y + 1;

    const VALID_NAME = 'Valid Name';
    const VALID_DESCRIPTION = 'Valid Description';
    const EMPTY = '';

    const ONE = 1;
    const ZERO = 0;

    const makeBaseTiles = (size: number) => {
        const tiles: GameEditorTileDto[] = [];
        for (let y = 0; y < size; y++) {
            for (let x = 0; x < size; x++) {
                tiles.push({ x, y, kind: TileKind.BASE });
            }
        }
        return tiles;
    };

    const makeWallTiles = (size: number) => {
        const tiles: GameEditorTileDto[] = [];
        for (let y = 0; y < size; y++) {
            for (let x = 0; x < size; x++) {
                tiles.push({ x, y, kind: TileKind.WALL });
            }
        }
        return tiles;
    };

    const mid = (size: number) => Math.floor(size / 2);

    beforeEach(() => {
        store = new GameEditorStoreStub();
        store.setMode(GameMode.CTF);

        TestBed.configureTestingModule({
            providers: [GameEditorCheckService, { provide: GameEditorStoreService, useValue: store }],
        });

        service = TestBed.inject(GameEditorCheckService);

        store.setSize(SIZE);
        store.setTiles(makeBaseTiles(SIZE));

        const START_ID = 'start1';
        const FLAG_ID = 'flag1';
        store.setObjects([
            { id: START_ID, kind: PlaceableKind.START, x: -ONE, y: -ONE, placed: false, orientation: 'N' },
            { id: FLAG_ID, kind: PlaceableKind.FLAG, x: -ONE, y: -ONE, placed: false, orientation: 'N' },
        ]);
        store.setInventory({
            START: { total: ONE, remaining: ONE },
            FLAG: { total: ONE, remaining: ONE },
        } as Inventory);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    describe('editor checks', () => {
        it('canSave', () => {
            expect(service.canSave()).toBeFalse();

            store.name = VALID_NAME;
            store.description = VALID_DESCRIPTION;
            store.setInventory({
                START: { total: ONE, remaining: ZERO },
                FLAG: { total: ONE, remaining: ZERO },
            } as Inventory);

            expect(service.canSave()).toBeTrue();
        });

        it('should initialize with start/flag placement issues but no other issues', () => {
            const result = service.editorProblems();
            expect(result.startPlacement.hasIssue).toBeTrue();
            expect(result.flagPlacement.hasIssue).toBeTrue();
            expect(result.nameValidation.hasIssue).toBeFalse();
            expect(result.descriptionValidation.hasIssue).toBeFalse();
            expect(result.terrainCoverage.hasIssue).toBeFalse();
            expect(result.doors.hasIssue).toBeFalse();
            expect(result.terrainAccessibility.hasIssue).toBeFalse();
        });

        it('should detect missing terrain coverage', () => {
            const variability = 3;
            const tiles: GameEditorTileDto[] = [];
            for (let y = 0; y < SIZE; y++) {
                for (let x = 0; x < SIZE; x++) {
                    const isBase = (x + y) % variability === 0;
                    tiles.push({ x, y, kind: isBase ? TileKind.BASE : TileKind.WALL });
                }
            }
            store.setTiles(tiles);
            store.setSize(SIZE);

            expect(service.editorProblems().terrainCoverage.hasIssue).toBeTrue();
        });

        it('should detect missing start placement (inventory remaining > 0)', () => {
            store.setInventory({
                START: { total: ONE, remaining: ONE },
                FLAG: { total: ONE, remaining: ONE },
            } as Inventory);
            const result = service.editorProblems();
            expect(result.startPlacement.hasIssue).toBeTrue();
        });

        it('should detect missing flag placement (inventory remaining > 0)', () => {
            store.setInventory({
                START: { total: ONE, remaining: ONE },
                FLAG: { total: ONE, remaining: ONE },
            } as Inventory);
            const result = service.editorProblems();
            expect(result.flagPlacement.hasIssue).toBeTrue();
        });

        it('should detect correct start placement (remaining = 0)', () => {
            store.setInventory({
                START: { total: ONE, remaining: ZERO },
                FLAG: { total: ONE, remaining: ONE },
            } as Inventory);

            expect(service.editorProblems().startPlacement.hasIssue).toBeFalse();
        });

        it('should detect correct flag placement (remaining = 0)', () => {
            store.setInventory({
                START: { total: ONE, remaining: ZERO },
                FLAG: { total: ONE, remaining: ZERO },
            } as Inventory);

            expect(service.editorProblems().flagPlacement.hasIssue).toBeFalse();
        });

        it('should detect name too short', () => {
            store.name = EMPTY;
            expect(service.editorProblems().nameValidation.hasIssue).toBeTrue();
        });

        it('should detect description too short', () => {
            store.description = EMPTY;
            expect(service.editorProblems().descriptionValidation.hasIssue).toBeTrue();
        });

        it('should detect valid name and description', () => {
            store.name = VALID_NAME;
            store.description = VALID_DESCRIPTION;
            const result = service.editorProblems();
            expect(result.nameValidation.hasIssue).toBeFalse();
            expect(result.descriptionValidation.hasIssue).toBeFalse();
        });

        it('should detect vertical door placement issues (no surrounding walls)', () => {
            const tiles = [...store.tiles()];
            tiles[DOOR_Y * SIZE + DOOR_X] = { x: DOOR_X, y: DOOR_Y, kind: TileKind.DOOR };
            store.setTiles(tiles);

            const result = service.editorProblems();
            expect(result.doors.hasIssue).toBeTrue();
        });

        it('should detect horizontal door placement issues (no surrounding walls)', () => {
            const tiles = [...store.tiles()];
            tiles[ABOVE_Y * SIZE + DOOR_X] = { x: DOOR_X, y: ABOVE_Y, kind: TileKind.DOOR };
            store.setTiles(tiles);

            const result = service.editorProblems();
            expect(result.doors.hasIssue).toBeTrue();
        });

        it('should detect no horizontal door placement issues (with surrounding walls)', () => {
            const tiles = [...store.tiles()];
            tiles[DOOR_Y * SIZE + DOOR_X] = { x: DOOR_X, y: DOOR_Y, kind: TileKind.DOOR };
            tiles[DOOR_Y * SIZE + LEFT_X] = { x: LEFT_X, y: DOOR_Y, kind: TileKind.WALL };
            tiles[DOOR_Y * SIZE + RIGHT_X] = { x: RIGHT_X, y: DOOR_Y, kind: TileKind.WALL };
            store.setTiles(tiles);

            const result = service.editorProblems();
            expect(result.doors.hasIssue).toBeFalse();
        });

        it('should detect no vertical door placement issues (with surrounding walls)', () => {
            const tiles = [...store.tiles()];
            tiles[DOOR_Y * SIZE + DOOR_X] = { x: DOOR_X, y: DOOR_Y, kind: TileKind.DOOR };
            tiles[ABOVE_Y * SIZE + DOOR_X] = { x: DOOR_X, y: ABOVE_Y, kind: TileKind.WALL };
            tiles[BELOW_Y * SIZE + DOOR_X] = { x: DOOR_X, y: BELOW_Y, kind: TileKind.WALL };
            store.setTiles(tiles);

            const result = service.editorProblems();
            expect(result.doors.hasIssue).toBeFalse();
        });

        it('should detect terrain accessibility issues (cross wall)', () => {
            const middle = mid(SIZE);
            const tiles: GameEditorTileDto[] = [];
            for (let y = 0; y < SIZE; y++) {
                for (let x = 0; x < SIZE; x++) {
                    const isCrossWall = (x === middle && y !== middle) || (y === middle && x !== middle);
                    tiles.push({ x, y, kind: isCrossWall ? TileKind.WALL : TileKind.BASE });
                }
            }
            store.setTiles(tiles);
            store.setSize(SIZE);

            expect(service.editorProblems().terrainAccessibility.hasIssue).toBeTrue();
        });

        it('should detect no terrain accessibility issues (all BASE)', () => {
            expect(service.editorProblems().terrainAccessibility.hasIssue).toBeFalse();
        });

        it('should detect terrain accessibility issue if map is full of WALLS', () => {
            store.setTiles(makeWallTiles(SIZE));
            store.setSize(SIZE);

            const result = service.editorProblems();
            expect(result.terrainCoverage.hasIssue).toBeTrue();
            expect(result.terrainAccessibility.hasIssue).toBeTrue();
        });

        it('should be able to detect multiple terrain accessibility issues', () => {
            const middle = mid(SIZE);
            const tiles: GameEditorTileDto[] = [];
            for (let y = 0; y < SIZE; y++) {
                for (let x = 0; x < SIZE; x++) {
                    const isCrossWall = (x === middle && y !== middle) || (y === middle && x !== middle);
                    tiles.push({ x, y, kind: isCrossWall ? TileKind.WALL : TileKind.BASE });
                }
            }
            const WALL_X1 = 1;
            const WALL_Y1 = 1;
            const WALL_X2 = 2;
            const WALL_Y2 = 1;
            const WALL_X3 = 1;
            const WALL_Y3 = 2;

            tiles[WALL_Y1 * SIZE + WALL_X1] = { x: WALL_X1, y: WALL_Y1, kind: TileKind.WALL };
            tiles[WALL_Y2 * SIZE + WALL_X2] = { x: WALL_X2, y: WALL_Y2, kind: TileKind.WALL };
            tiles[WALL_Y3 * SIZE + WALL_X3] = { x: WALL_X3, y: WALL_Y3, kind: TileKind.WALL };

            store.setTiles(tiles);
            store.setSize(SIZE);

            expect(service.editorProblems().terrainAccessibility.hasIssue).toBeTrue();
        });
    });
});
