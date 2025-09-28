import { computed } from '@angular/core';

import {
    DESCRIPTION_MAX_LENGTH,
    DESCRIPTION_MIN_LENGTH,
    GAME_NAME_MAX_LENGTH,
    NAME_MIN_LENGTH,
} from '@app/constants/validation.constants';
import { GameEditorTileDto } from '@app/dto/gameEditorTileDto';
import { GameMode } from '@common/enums/game-mode.enum';
import { TileKind } from '@common/enums/tile-kind.enum';

import { GameEditorStoreService } from '@app/services/game-editor-store/game-editor-store.service';
import { GameEditorCheckService } from './game-editor-check.service';

describe('GameEditorCheckService', () => {
    let service: GameEditorCheckService;

    let store: Partial<{
        tiles: jasmine.Spy;
        inventory: jasmine.Spy;
        mode: jasmine.Spy;
        name: string;
        description: string;
        getTileAt: jasmine.Spy;
        size: jasmine.Spy;
    }>;

    const getPriv = () => service as unknown as Record<string, unknown>;

    const SIZE_3 = 3;
    const SIZE_2 = 2;
    const SIZE_1 = 1;

    beforeEach(() => {
        store = {
            tiles: jasmine.createSpy(),
            inventory: jasmine.createSpy(),
            mode: jasmine.createSpy(),
            name: '',
            description: '',
            getTileAt: jasmine.createSpy(),
            size: jasmine.createSpy(),
        };

        service = new GameEditorCheckService(store as unknown as GameEditorStoreService);
    });

    it('canSave returns true if no issues', () => {
        (getPriv()['editorProblems'] as unknown) = computed(() => ({
            terrainCoverage: { hasIssue: false },
            doors: { hasIssue: false, tiles: [] },
            terrainAccessibility: { hasIssue: false, tiles: [] },
            startPlacement: { hasIssue: false },
            flagPlacement: { hasIssue: false },
            nameValidation: { hasIssue: false },
            descriptionValidation: { hasIssue: false },
        }));

        expect(service.canSave()).toBeTrue();
    });

    it('canSave returns false if any issue', () => {
        (getPriv()['editorProblems'] as unknown) = computed(() => ({
            terrainCoverage: { hasIssue: true },
            doors: { hasIssue: false, tiles: [] },
            terrainAccessibility: { hasIssue: false, tiles: [] },
            startPlacement: { hasIssue: false },
            flagPlacement: { hasIssue: false },
            nameValidation: { hasIssue: false },
            descriptionValidation: { hasIssue: false },
        }));

        expect(service.canSave()).toBeFalse();
    });

    it('getNeighborKind returns correct kind or null', () => {
        (store.getTileAt as jasmine.Spy).and.returnValue({ kind: TileKind.BASE });
        expect(service.getNeighborKind(0, 0)).toBe(TileKind.BASE);

        (store.getTileAt as jasmine.Spy).and.returnValue(undefined);
        expect(service.getNeighborKind(1, 1)).toBeNull();
    });

    it('isTerrain returns true for terrain kinds', () => {
        expect(service.isTerrain(TileKind.BASE)).toBeTrue();
        expect(service.isTerrain(TileKind.WATER)).toBeTrue();
        expect(service.isTerrain(TileKind.ICE)).toBeTrue();
        expect(service.isTerrain(TileKind.WALL)).toBeFalse();
    });

    it('isValidHorizontalDoor and isValidVerticalDoor', () => {
        expect(
            (getPriv()['isValidHorizontalDoor'] as (
                a: TileKind,
                b: TileKind,
                c: TileKind,
                d: TileKind,
            ) => boolean)(TileKind.WALL, TileKind.WALL, TileKind.BASE, TileKind.ICE),
        ).toBeTrue();

        expect(
            (getPriv()['isValidHorizontalDoor'] as (
                a: TileKind,
                b: TileKind,
                c: TileKind,
                d: TileKind,
            ) => boolean)(TileKind.WALL, TileKind.WALL, TileKind.WALL, TileKind.ICE),
        ).toBeFalse();

        expect(
            (getPriv()['isValidVerticalDoor'] as (
                a: TileKind,
                b: TileKind,
                c: TileKind,
                d: TileKind,
            ) => boolean)(TileKind.WALL, TileKind.WALL, TileKind.BASE, TileKind.ICE),
        ).toBeTrue();

        expect(
            (getPriv()['isValidVerticalDoor'] as (
                a: TileKind,
                b: TileKind,
                c: TileKind,
                d: TileKind,
            ) => boolean)(TileKind.WALL, TileKind.WALL, TileKind.WALL, TileKind.ICE),
        ).toBeFalse();
    });

    it('checkAllStartPlaced returns issue if any start unplaced', () => {
        (store.inventory as jasmine.Spy).and.returnValue([{ kind: 'START', remaining: 1 }]);
        const res = (getPriv()['checkAllStartPlaced'] as () => {
            hasIssue: boolean;
            message?: string;
        })();

        expect(res.hasIssue).toBeTrue();
        expect(res.message).toContain('départ');

        (store.inventory as jasmine.Spy).and.returnValue([{ kind: 'START', remaining: 0 }]);
        expect(
            (getPriv()['checkAllStartPlaced'] as () => { hasIssue: boolean })()
                .hasIssue,
        ).toBeFalse();
    });

    it('checkAllFlagPlaced returns issue only in CTF mode', () => {
        (store.mode as jasmine.Spy).and.returnValue(GameMode.CTF);
        (store.inventory as jasmine.Spy).and.returnValue([{ kind: 'FLAG', remaining: 1 }]);

        const resCTF = (getPriv()['checkAllFlagPlaced'] as () => {
            hasIssue: boolean;
        })();
        expect(resCTF.hasIssue).toBeTrue();

        (store.inventory as jasmine.Spy).and.returnValue([{ kind: 'FLAG', remaining: 0 }]);
        expect(
            (getPriv()['checkAllFlagPlaced'] as () => { hasIssue: boolean })()
                .hasIssue,
        ).toBeFalse();

        (store.mode as jasmine.Spy).and.returnValue(GameMode.CLASSIC);
        expect(
            (getPriv()['checkAllFlagPlaced'] as () => { hasIssue: boolean })()
                .hasIssue,
        ).toBeFalse();
    });

    it('checkDoors detects invalid doors', () => {
        (store.getTileAt as jasmine.Spy).and.callFake((x: number, y: number) => {
            if (x === 0 && y === 1) return { kind: TileKind.WALL } as GameEditorTileDto;
            if (x === 2 && y === 1) return { kind: TileKind.WALL } as GameEditorTileDto;
            if (x === 1 && y === 0) return { kind: TileKind.BASE } as GameEditorTileDto;
            if (x === 1 && y === 2) return { kind: TileKind.BASE } as GameEditorTileDto;
            return { kind: TileKind.BASE } as GameEditorTileDto;
        });

        const tiles: GameEditorTileDto[] = [{ x: 1, y: 1, kind: TileKind.DOOR }];

        expect(
            (getPriv()['checkDoors'] as (t: GameEditorTileDto[]) => { hasIssue: boolean })(
                tiles,
            ).hasIssue,
        ).toBeFalse();

        (store.getTileAt as jasmine.Spy).and.returnValue({ kind: TileKind.BASE });

        expect(
            (getPriv()['checkDoors'] as (t: GameEditorTileDto[]) => { hasIssue: boolean })([
                { x: 1, y: 1, kind: TileKind.DOOR },
            ]).hasIssue,
        ).toBeTrue();
    });

    it('checkTerrainCoverage detects low ratio', () => {
        (store.size as jasmine.Spy).and.returnValue(SIZE_2);

        const tiles: GameEditorTileDto[] = [
            { x: 0, y: 0, kind: TileKind.WALL },
            { x: 0, y: 1, kind: TileKind.WALL },
            { x: 1, y: 0, kind: TileKind.WALL },
            { x: 1, y: 1, kind: TileKind.BASE },
        ];

        const res = (getPriv()['checkTerrainCoverage'] as (
            t: GameEditorTileDto[],
        ) => { hasIssue: boolean; message?: string })(tiles);

        expect(res.hasIssue).toBeTrue();
        expect(res.message).toContain('ratio');

        (store.size as jasmine.Spy).and.returnValue(SIZE_1);
        expect(
            (getPriv()['checkTerrainCoverage'] as (
                t: GameEditorTileDto[],
            ) => { hasIssue: boolean })([{ x: 0, y: 0, kind: TileKind.BASE }]).hasIssue,
        ).toBeFalse();
    });

    it('checkTerrainAccessibility finds inaccessible tiles', () => {
        (store.size as jasmine.Spy).and.returnValue(SIZE_2);

        const tiles: GameEditorTileDto[] = [
            { x: 0, y: 0, kind: TileKind.BASE },
            { x: 1, y: 0, kind: TileKind.WALL },
            { x: 0, y: 1, kind: TileKind.WALL },
            { x: 1, y: 1, kind: TileKind.BASE },
        ];

        const res = (getPriv()['checkTerrainAccessibility'] as (
            t: GameEditorTileDto[],
        ) => { hasIssue: boolean; tiles: GameEditorTileDto[] })(tiles);

        expect(res.hasIssue).toBeTrue();
        expect(res.tiles.length).toBeGreaterThan(0);
    });

    it('checkTerrainAccessibility returns issue when there are no walkable tiles (components.length === 0)', () => {
        (store.size as jasmine.Spy).and.returnValue(SIZE_2);

        const tiles: GameEditorTileDto[] = [
            { x: 0, y: 0, kind: TileKind.WALL },
            { x: 1, y: 0, kind: TileKind.WALL },
            { x: 0, y: 1, kind: TileKind.WALL },
            { x: 1, y: 1, kind: TileKind.WALL },
        ];

        const res = (getPriv()['checkTerrainAccessibility'] as (
            t: GameEditorTileDto[],
        ) => { hasIssue: boolean; tiles: GameEditorTileDto[] })(tiles);

        expect(res.hasIssue).toBeTrue();
        expect(res.tiles.length).toBe(0);
    });

    it('checkNameValidation validates name constraints', () => {
        store.name = ' ';
        expect((getPriv()['checkNameValidation'] as () => { hasIssue: boolean })().hasIssue).toBeTrue();

        store.name = 'a'.repeat(NAME_MIN_LENGTH - 1);
        expect((getPriv()['checkNameValidation'] as () => { hasIssue: boolean })().hasIssue).toBeTrue();

        store.name = 'a'.repeat(GAME_NAME_MAX_LENGTH + 1);
        expect((getPriv()['checkNameValidation'] as () => { hasIssue: boolean })().hasIssue).toBeTrue();

        store.name = 'validName';
        expect((getPriv()['checkNameValidation'] as () => { hasIssue: boolean })().hasIssue).toBeFalse();
    });

    it('checkDescriptionValidation validates description constraints', () => {
        store.description = ' ';
        expect(
            (getPriv()['checkDescriptionValidation'] as () => { hasIssue: boolean })().hasIssue,
        ).toBeTrue();

        store.description = 'a'.repeat(DESCRIPTION_MIN_LENGTH - 1);
        expect(
            (getPriv()['checkDescriptionValidation'] as () => { hasIssue: boolean })().hasIssue,
        ).toBeTrue();

        store.description = 'a'.repeat(DESCRIPTION_MAX_LENGTH + 1);
        expect(
            (getPriv()['checkDescriptionValidation'] as () => { hasIssue: boolean })().hasIssue,
        ).toBeTrue();

        store.description = 'valid description'.padEnd(DESCRIPTION_MIN_LENGTH, 'x');
        expect(
            (getPriv()['checkDescriptionValidation'] as () => { hasIssue: boolean })().hasIssue,
        ).toBeFalse();
    });

    it('checkDoors returns tile coordinates and message for invalid door', () => {
        (store.getTileAt as jasmine.Spy).and.callFake(() => {
            return { kind: TileKind.BASE } as GameEditorTileDto;
        });

        const tiles: GameEditorTileDto[] = [{ x: 1, y: 1, kind: TileKind.DOOR }];

        const res = (getPriv()['checkDoors'] as (
            t: GameEditorTileDto[],
        ) => { hasIssue: boolean; tiles: { x: number; y: number }[]; message?: string })(tiles);

        expect(res.hasIssue).toBeTrue();
        expect(res.tiles.length).toBe(1);
        expect(res.tiles[0]).toEqual({ x: 1, y: 1 });
        expect(res.message).toContain('porte');
    });

    it('editorProblems computed calls all checks and aggregates issues', () => {
        (store.size as jasmine.Spy).and.returnValue(SIZE_3);

        const tiles: GameEditorTileDto[] = [];
        for (let y = 0; y < SIZE_3; y++) {
            for (let x = 0; x < SIZE_3; x++) {
                tiles.push({ x, y, kind: TileKind.WALL });
            }
        }

        const t00 = tiles.find((t) => t.x === 0 && t.y === 0);
        if (t00) t00.kind = TileKind.BASE;

        const t22 = tiles.find((t) => t.x === 2 && t.y === 2);
        if (t22) t22.kind = TileKind.BASE;

        const center = tiles.find((t) => t.x === 1 && t.y === 1);
        if (center) center.kind = TileKind.DOOR;

        (store.tiles as jasmine.Spy).and.returnValue(tiles);
        (store.getTileAt as jasmine.Spy).and.callFake((x: number, y: number) =>
            tiles.find((t) => t.x === x && t.y === y),
        );
        (store.inventory as jasmine.Spy).and.returnValue([
            { kind: 'START', remaining: 1 },
            { kind: 'FLAG', remaining: 1 },
        ]);
        (store.mode as jasmine.Spy).and.returnValue(GameMode.CTF);

        store.name = ' ';
        store.description = ' ';

        service = new GameEditorCheckService(store as unknown as GameEditorStoreService);

        const issues = service.editorProblems();

        expect(issues.doors.hasIssue).toBeTrue();
        expect(issues.terrainCoverage.hasIssue).toBeTrue();
        expect(issues.terrainAccessibility.hasIssue).toBeTrue();
        expect(issues.startPlacement.hasIssue).toBeTrue();
        expect(issues.flagPlacement.hasIssue).toBeTrue();
        expect(issues.nameValidation.hasIssue).toBeTrue();
        expect(issues.descriptionValidation.hasIssue).toBeTrue();

        expect(service.canSave()).toBeFalse();
    });

    it('checkTerrainAccessibility selects the largest component even if not first', () => {
        (store.size as jasmine.Spy).and.returnValue(SIZE_3);

        const tiles: GameEditorTileDto[] = [
            { x: 0, y: 0, kind: TileKind.BASE },
            { x: 1, y: 0, kind: TileKind.WALL },
            { x: 2, y: 0, kind: TileKind.WALL },
            { x: 0, y: 1, kind: TileKind.WALL },
            { x: 1, y: 1, kind: TileKind.BASE },
            { x: 2, y: 1, kind: TileKind.BASE },
            { x: 0, y: 2, kind: TileKind.WALL },
            { x: 1, y: 2, kind: TileKind.BASE },
            { x: 2, y: 2, kind: TileKind.WALL },
        ];

        const res = (getPriv()['checkTerrainAccessibility'] as (
            t: GameEditorTileDto[],
        ) => { hasIssue: boolean; tiles: GameEditorTileDto[] })(tiles);

        expect(res.hasIssue).toBeTrue();
        expect(res.tiles.some((t) => t.x === 0 && t.y === 0)).toBeTrue();
    });

    it('teleport tiles are considered walkable and appear in connectivity', () => {
        (store.size as jasmine.Spy).and.returnValue(SIZE_2);

        const tiles: GameEditorTileDto[] = [
            { x: 0, y: 0, kind: TileKind.TELEPORT },
            { x: 1, y: 0, kind: TileKind.WALL },
            { x: 0, y: 1, kind: TileKind.WALL },
            { x: 1, y: 1, kind: TileKind.BASE },
        ];

        const res = (getPriv()['checkTerrainAccessibility'] as (
            t: GameEditorTileDto[],
        ) => { hasIssue: boolean; tiles: unknown[] })(tiles);

        expect(res.hasIssue).toBeTrue();
        expect(Array.isArray(res.tiles)).toBeTrue();
    });
});
