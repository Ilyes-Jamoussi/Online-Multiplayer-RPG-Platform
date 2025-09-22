/* eslint-disable @typescript-eslint/no-magic-numbers */
import { TestBed } from '@angular/core/testing';
import { GameEditorCheckService } from './game-editor-check.service';
import { GameEditorStoreService } from '@app/services/game-editor-store/game-editor-store.service';
import { TileKind } from '@common/enums/tile-kind.enum';
import { GameEditorTileDto } from '@app/api/model/gameEditorTileDto';

class MockGameEditorStoreService {
    private _size = 5; // taille par défaut (5x5) pour les tests
    private _tiles: GameEditorTileDto[] = [];

    constructor(size = 5) {
        this._size = size;
        this.fillGrid(TileKind.BASE);
    }

    tiles(): GameEditorTileDto[] {
        return this._tiles;
    }

    size(): number {
        return this._size;
    }

    getTileAt(x: number, y: number): GameEditorTileDto | undefined {
        if (x < 0 || y < 0 || x >= this._size || y >= this._size) return undefined;
        const i = this.index(x, y);
        return this._tiles[i];
    }

    setSize(n: number) {
        this._size = n;
        this.fillGrid(TileKind.BASE);
    }

    fillGrid(kind: TileKind) {
        const n = this._size * this._size;
        this._tiles = new Array(n).fill(0).map((_, i) => {
            const x = i % this._size;
            const y = Math.floor(i / this._size);
            return { x, y, kind };
        });
    }

    setTile(x: number, y: number, kind: TileKind, open?: boolean) {
        const i = this.index(x, y);
        this._tiles[i] = { x, y, kind, open };
    }

    private index(x: number, y: number) {
        return y * this._size + x;
    }
}

describe('GameEditorCheckService', () => {
    let service: GameEditorCheckService;
    let store: MockGameEditorStoreService;

    beforeEach(() => {
        store = new MockGameEditorStoreService(5);

        TestBed.configureTestingModule({
            providers: [GameEditorCheckService, { provide: GameEditorStoreService, useValue: store }],
        });

        service = TestBed.inject(GameEditorCheckService);
    });

    describe('Door rule (framed by walls + perpendicular terrain)', () => {
        it('does NOT add a problem when a horizontal door is correctly placed', () => {
            store.fillGrid(TileKind.BASE);
            store.setTile(1, 2, TileKind.WALL);
            store.setTile(2, 2, TileKind.DOOR);
            store.setTile(3, 2, TileKind.WALL);

            const problems = service.editorProblems();
            const doorProblems = problems.filter((p) => p.message.includes('Porte mal placée'));
            expect(doorProblems.length).toBe(0);
        });

        it('does NOT add a problem when a vertical door is correctly placed', () => {
            store.fillGrid(TileKind.BASE);
            store.setTile(2, 1, TileKind.WALL);
            store.setTile(2, 2, TileKind.DOOR);
            store.setTile(2, 3, TileKind.WALL);
            const problems = service.editorProblems();
            const doorProblems = problems.filter((p) => p.message.includes('Porte mal placée'));
            expect(doorProblems.length).toBe(0);
        });

        it('adds a problem when a vertical door is incorrectly placed', () => {
            store.fillGrid(TileKind.BASE);
            store.setTile(2, 2, TileKind.DOOR);
            store.setTile(1, 2, TileKind.WALL);

            const problems = service.editorProblems();
            const doorProblems = problems.filter((p) => p.message.includes('Porte mal placée'));
            expect(doorProblems.length).toBeGreaterThan(0);
            expect(doorProblems[0]).toEqual(jasmine.objectContaining({ locationX: 2, locationY: 2 }));
        });

        it('adds a problem when a horizontal door is incorrectly placed', () => {
            store.fillGrid(TileKind.BASE);
            store.setTile(1, 2, TileKind.WALL);
            store.setTile(2, 2, TileKind.DOOR);
            store.setTile(3, 2, TileKind.BASE);
            const problems = service.editorProblems();
            const doorProblems = problems.filter((p) => p.message.includes('Porte mal placée'));
            expect(doorProblems.length).toBeGreaterThan(0);
            expect(doorProblems[0]).toEqual(jasmine.objectContaining({ locationX: 2, locationY: 2 }));
        });
    });

    describe('Terrain coverage (> 50%)', () => {
        it('reports a problem if ≤ 50% terrain', () => {
            store.setSize(4);
            store.fillGrid(TileKind.WALL);
            const coords: [number, number][] = [
                [0, 0],
                [1, 0],
                [2, 0],
                [3, 0],
                [0, 1],
                [1, 1],
                [2, 1],
            ];
            coords.forEach(([x, y]) => store.setTile(x, y, TileKind.BASE));

            const problems = service.editorProblems();
            const coverage = problems.find((p) => p.message.includes('Moins de 50%'));
            expect(coverage).toBeTruthy();
        });

        it('does not report a problem if > 50% terrain', () => {
            store.setSize(4);
            store.fillGrid(TileKind.WALL);
            const coords: [number, number][] = [
                [0, 0],
                [1, 0],
                [2, 0],
                [3, 0],
                [0, 1],
                [1, 1],
                [2, 1],
                [3, 1],
                [0, 2],
            ];
            coords.forEach(([x, y]) => store.setTile(x, y, TileKind.BASE));

            const problems = service.editorProblems();
            const coverage = problems.find((p) => p.message.includes('Moins de 50%'));
            expect(coverage).toBeFalsy();
        });
    });

    describe('Terrain Accessibility (BFS)', () => {
        it('reports inaccessible walkable tiles', () => {
            store.setSize(5);
            store.fillGrid(TileKind.BASE);

            store.setTile(3, 4, TileKind.WALL);
            store.setTile(4, 3, TileKind.WALL);
            store.setTile(3, 3, TileKind.WALL);

            const probs = service.editorProblems();
            const inacc = probs.find((p) => p.message.includes('Tuile inaccessible'));
            expect(inacc).toBeTruthy();
        });

        it('does not report anything if all walkable tiles are reachable', () => {
            store.setSize(5);
            store.fillGrid(TileKind.BASE);

            const probs = service.editorProblems();
            const inacc = probs.find((p) => p.message.includes('Tuile inaccessible'));
            expect(inacc).toBeFalsy();
        });
    });

    it('canSave() is true when there are no problems', () => {
        store.setSize(3);
        store.fillGrid(TileKind.BASE);
        expect(service.canSave()).toBeTrue();
    });

    it('getNeighborKind() returns correct kinds or null for out-of-bounds', () => {
        store.setSize(3);
        store.fillGrid(TileKind.BASE);
        store.setTile(1, 1, TileKind.WALL);
        expect(service.getNeighborKind(1, 1)).toBe(TileKind.WALL);
        expect(service.getNeighborKind(3, 3)).toBeNull();
    });
});
