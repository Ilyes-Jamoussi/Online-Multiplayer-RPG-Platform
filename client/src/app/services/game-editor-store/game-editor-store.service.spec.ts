import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { GameEditorStoreService } from './game-editor-store.service';
import { GameHttpService } from '@app/services/game-http/game-http.service';
import { GameEditorDto } from '@app/dto/gameEditorDto';
import { PatchGameEditorDto } from '@app/dto/patchGameEditorDto';
import { GameMode } from '@common/enums/game-mode.enum';
import { MapSize } from '@common/enums/map-size.enum';
import { TileKind } from '@common/enums/tile-kind.enum';

const testConstants = {
    gridSize3: 3,
    gridSize4: 4
};
import { GameEditorTileDto } from '@app/dto/gameEditorTileDto';
import { GameEditorPlaceableDto } from '@app/dto/gameEditorPlaceableDto';

describe('GameEditorStoreService', () => {
    let service: GameEditorStoreService;
    let http: jasmine.SpyObj<GameHttpService>;

    const size = MapSize.MEDIUM;
    const mkGrid = (n: number, fill: TileKind = TileKind.BASE): GameEditorTileDto[] =>
        Array.from({ length: n * n }, (_, i) => {
            const x = i % n;
            const y = Math.floor(i / n);
            return { x, y, kind: fill };
        });

    const initialObjects: GameEditorPlaceableDto[] = [{ id: 'o1', kind: 'START', x: -1, y: -1, placed: false, orientation: 'N' }];

    const initialDto: GameEditorDto = {
        id: 'game-1',
        name: 'Nouveau Jeu...',
        description: 'Desc...',
        size,
        mode: 'classic',
        tiles: mkGrid(size, TileKind.BASE),
        objects: initialObjects,
        gridPreviewUrl: '',
        lastModified: new Date().toISOString(),
    };

    beforeEach(() => {
        http = jasmine.createSpyObj<GameHttpService>('GameHttpService', ['getGameEditorById', 'patchGameEditorById']);

        TestBed.configureTestingModule({
            providers: [GameEditorStoreService, { provide: GameHttpService, useValue: http }],
        });

        service = TestBed.inject(GameEditorStoreService);
    });

    describe('loadGameById', () => {
        it('hydrates signals with backend data and maps the mode', () => {
            http.getGameEditorById.and.returnValue(of(initialDto));

            service.loadGameById('game-1');

            expect(http.getGameEditorById).toHaveBeenCalledWith('game-1');
            expect(service.initial().id).toBe('game-1');
            expect(service.name).toBe('Nouveau Jeu...');
            expect(service.description).toBe('Desc...');
            expect(service.size()).toBe(size);
            expect(service.gridPreviewUrl()).toBe('');
            expect(service.mode()).toBe(GameMode.CLASSIC);
            expect(service.tiles().length).toBe(size * size);
            expect(service.objects().length).toBe(1);
        });
    });

    describe('saveGame', () => {
        it('if name changed, sends only the name in the body', () => {
            http.getGameEditorById.and.returnValue(of(initialDto));
            service.loadGameById(initialDto.id);
            service.name = 'new name';
            http.patchGameEditorById.and.callFake((id: string, body: PatchGameEditorDto) => {
                expect(id).toBe('game-1');
                expect(body.name).toBe('new name');
                expect(body.description).toBeUndefined();
                expect(body.size).toBeUndefined();
                expect(body.tiles).toBeUndefined();
                expect(body.objects).toBeUndefined();
                expect(body.gridPreviewUrl).toBeUndefined();
                expect(body.mode).toBeUndefined();
                return of({ ...initialDto, name: 'new name' });
            });

            service.saveGame();
            expect(http.patchGameEditorById).toHaveBeenCalledTimes(1);
            expect(service.initial().name).toBe('new name');
        });

        it('if description changed, sends only the description in the body', () => {
            service.description = 'new desc';
            http.patchGameEditorById.and.callFake((id: string, body: PatchGameEditorDto) => {
                expect(body.description).toBe('new desc');
                expect(body.name).toBeUndefined();
                return of({ ...initialDto, description: 'new desc' });
            });

            service.saveGame();
            expect(service.initial().description).toBe('new desc');
        });

        it('if tiles changed, sends only the tiles in the body', () => {
            http.getGameEditorById.and.returnValue(of(initialDto));
            service.loadGameById(initialDto.id);

            service.setTileAt(0, 0, TileKind.WALL);
            service.setTileAt(1, 1, TileKind.WALL);
            service.setTileAt(2, 2, TileKind.WALL);

            http.patchGameEditorById.and.callFake((id: string, body: PatchGameEditorDto) => {
                expect(body.tiles).toBeDefined();
                expect(body.tiles?.length).toBe(initialDto.tiles.length);
                expect(body.tiles?.some((t) => t.x === 0 && t.y === 0 && t.kind === TileKind.WALL)).toBeTrue();
                expect(body.tiles?.some((t) => t.x === 1 && t.y === 1 && t.kind === TileKind.WALL)).toBeTrue();
                expect(body.tiles?.some((t) => t.x === 2 && t.y === 2 && t.kind === TileKind.WALL)).toBeTrue();
                expect(body.name).toBeUndefined();
                expect(body.description).toBeUndefined();
                expect(body.size).toBeUndefined();
                expect(body.objects).toBeUndefined();
                expect(body.gridPreviewUrl).toBeUndefined();
                expect(body.mode).toBeUndefined();
                return of({ ...initialDto, tiles: body.tiles as GameEditorTileDto[] });
            });

            service.saveGame();
            expect(http.patchGameEditorById).toHaveBeenCalledTimes(1);
            expect(service.initial().tiles.some((t) => t.x === 0 && t.y === 0 && t.kind === TileKind.WALL)).toBeTrue();
        });

        it('if nothing changed, sends a body with all fields undefined', () => {
            http.getGameEditorById.and.returnValue(of(initialDto));
            service.loadGameById(initialDto.id);

            http.patchGameEditorById.and.callFake((_id: string, body: PatchGameEditorDto) => {
                expect(body.name).toBeUndefined();
                expect(body.description).toBeUndefined();
                expect(body.size).toBeUndefined();
                expect(body.tiles).toBeUndefined();
                expect(body.objects).toBeUndefined();
                expect(body.gridPreviewUrl).toBeUndefined();
                expect(body.mode).toBeUndefined();
                return of(initialDto);
            });

            service.saveGame();

            expect(http.patchGameEditorById).toHaveBeenCalledTimes(1);
            expect(service.initial().name).toBe(initialDto.name);
        });
    });

    describe('Tiles helpers', () => {
        beforeEach(() => {
            http.getGameEditorById.and.returnValue(of(initialDto));
            service.loadGameById(initialDto.id);
        });

        it('getTileAt returns undefined out-of-bounds and the expected tile in-bounds', () => {
            const n = service.size();
            expect(service.getTileAt(-1, 0)).toBeUndefined();
            expect(service.getTileAt(0, -1)).toBeUndefined();
            expect(service.getTileAt(n, 0)).toBeUndefined();
            expect(service.getTileAt(0, n)).toBeUndefined();

            const t = service.getTileAt(0, 0) as GameEditorTileDto;
            expect(t).toBeDefined();
            expect(t.x).toBe(0);
            expect(t.y).toBe(0);
            expect(t.kind).toBe(TileKind.BASE);
        });

        it('setTileAt ignores if same tile non-door; toggles open if DOOR', () => {
            const before = service.tiles();

            service.setTileAt(1, 1, TileKind.BASE);
            expect(service.tiles()).toBe(before);
            service.setTileAt(2, 2, TileKind.DOOR);
            service.setTileAt(2, 2, TileKind.DOOR);
            const after = service.getTileAt(2, 2) as GameEditorTileDto;
            expect(after).toBeDefined();
            expect(after.kind).toBe(TileKind.DOOR);
            expect(after.open).toBeTrue();
        });

        it('resetTileAt sets the tile back to BASE', () => {
            service.setTileAt(testConstants.gridSize3, testConstants.gridSize3, TileKind.WALL);
            const t = service.getTileAt(testConstants.gridSize3, testConstants.gridSize3) as GameEditorTileDto;
            expect(t).toBeDefined();
            expect(t.kind).toBe(TileKind.WALL);

            service.resetTileAt(testConstants.gridSize3, testConstants.gridSize3);
            const t2 = service.getTileAt(testConstants.gridSize3, testConstants.gridSize3) as GameEditorTileDto;
            expect(t2).toBeDefined();
            expect(t2.kind).toBe(TileKind.BASE);
        });

        it('setTileAt out of bounds is ignored and returns void', () => {
            const before = service.tiles();
            service.setTileAt(-1, 0, TileKind.WALL);
            service.setTileAt(0, -1, TileKind.WALL);
            service.setTileAt(size + 1, 0, TileKind.WALL);
            service.setTileAt(0, size + 1, TileKind.WALL);
            expect(service.tiles()).toEqual(before);
        });

        it('resetTileAt out of bounds is ignored and returns void', () => {
            const before = service.tiles();
            service.resetTileAt(-1, 0);
            service.resetTileAt(0, -1);
            service.resetTileAt(size + 1, 0);
            service.resetTileAt(0, size + 1);
            expect(service.tiles()).toEqual(before);
        });
    });

    describe('reset', () => {
        it('reapplies exactly _initial', () => {
            http.getGameEditorById.and.returnValue(of(initialDto));
            service.loadGameById(initialDto.id);

            service.name = 'temp';
            service.description = 'temp';
            service.setTileAt(0, 0, TileKind.WALL);
            service.setTileAt(1, 1, TileKind.WALL);
            service.setTileAt(2, 2, TileKind.WALL);
            service.setTileAt(testConstants.gridSize3, testConstants.gridSize3, TileKind.WALL);
            service.setTileAt(testConstants.gridSize4, testConstants.gridSize4, TileKind.WALL);
            service.setTileAt(0, 1, TileKind.WALL);
            service.setTileAt(1, 0, TileKind.WALL);
            service.setTileAt(1, 2, TileKind.WALL);
            service.setTileAt(2, 1, TileKind.WALL);
            service.setTileAt(2, testConstants.gridSize3, TileKind.WALL);
            service.setTileAt(testConstants.gridSize3, 2, TileKind.WALL);
            service.setTileAt(testConstants.gridSize3, testConstants.gridSize4, TileKind.WALL);
            service.reset();

            expect(service.name).toBe('temp');
            expect(service.description).toBe('temp');
            expect(service.tiles()[0].kind).toBe(TileKind.BASE);
            expect(service.size()).toBe(initialDto.size);
            expect(service.objects()).toEqual(initialDto.objects);
        });
    });
});
