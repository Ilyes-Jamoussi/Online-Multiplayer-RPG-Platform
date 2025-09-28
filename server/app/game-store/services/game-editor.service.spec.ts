import { GamePreviewDto } from '@app/game-store/dto/game-preview.dto';
import { GameDtoMapper } from '@app/game-store/mappers/game-dto.mappers';
import { GameMode } from '@common/enums/game-mode.enum';
import { MapSize } from '@common/enums/map-size.enum';
import { PlaceableKind } from '@common/enums/placeable-kind.enum';
import { TileKind } from '@common/enums/tile-kind.enum';
import { NotFoundException } from '@nestjs/common';
import { GameEditorService } from './game-editor.service';
import { ImageService } from './image.service';

describe('GameEditorService', () => {
    let service: GameEditorService;
    const mockModel: any = {};
    const mockImageService: Partial<ImageService> = {};
    const mockMapper: Partial<GameDtoMapper> = {};

    beforeEach(() => {
        Object.keys(mockModel).forEach((k) => delete mockModel[k]);

        mockImageService.saveImage = jest.fn().mockResolvedValue('some-url.png');
        mockMapper.toGamePreviewDto = jest.fn().mockImplementation((g: any) => ({ id: g._id.toString(), name: g.name } as GamePreviewDto));

        service = new GameEditorService(mockModel as any, mockImageService as ImageService, mockMapper as GameDtoMapper);
    });

    describe('getEditByGameId', () => {
        it('throws NotFoundException when game is not found', async () => {
            mockModel.findById = jest.fn().mockReturnValue({ lean: () => Promise.resolve(null) });

            await expect(service.getEditByGameId('missing-id')).rejects.toThrow(NotFoundException);
            expect(mockModel.findById).toHaveBeenCalledWith('missing-id');
        });

        it('returns mapped editor dto when game exists', async () => {
            const now = new Date();
            const gameDoc: any = {
                _id: { toString: () => 'abc123' } as any,
                lastModified: now,
                name: 'name',
                description: 'desc',
                size: MapSize.MEDIUM,
                mode: GameMode.CLASSIC,
                tiles: [{ x: 0, y: 0, kind: TileKind.BASE }],
                gridPreviewUrl: 'preview.png',
                objects: [{ _id: { toString: () => 'obj1' }, x: 0, y: 0, kind: PlaceableKind.START, placed: false }],
            };

            mockModel.findById = jest.fn().mockReturnValue({ lean: () => Promise.resolve(gameDoc) });

            const dto = await service.getEditByGameId('abc123');

            expect(dto.id).toBe('abc123');
            expect(dto.name).toBe(gameDoc.name);
            expect(dto.tiles).toBeDefined();
            expect(dto.objects[0].id).toBe('obj1');
            expect(mockModel.findById).toHaveBeenCalledWith('abc123');
        });
    });

    describe('patchEditByGameId', () => {
        it('returns null when update does not find a document', async () => {
            mockModel.findByIdAndUpdate = jest.fn().mockReturnValue({ lean: () => ({ exec: jest.fn().mockResolvedValue(null) }) });

            const res = await service.patchEditByGameId('nope', { name: 'x' } as any);
            expect(res).toBeNull();
            expect(mockModel.findByIdAndUpdate).toHaveBeenCalled();
        });

        it('saves image when gridPreviewUrl provided and returns mapped preview when update succeeds', async () => {
            const id = 'gameid';
            (mockImageService.saveImage as jest.Mock).mockResolvedValue('game-gameid-preview.png');

            const returnedDoc = {
                _id: { toString: () => id },
                name: 'n',
                size: MapSize.SMALL,
                mode: GameMode.CLASSIC,
                description: 'd',
                lastModified: new Date(),
                visibility: true,
                gridPreviewUrl: 'game-gameid-preview.png',
                draft: false,
            } as any;

            mockModel.findByIdAndUpdate = jest.fn().mockReturnValue({ lean: () => ({ exec: jest.fn().mockResolvedValue(returnedDoc) }) });

            const body = { gridPreviewUrl: 'data', name: 'newname' } as any;

            const preview = await service.patchEditByGameId(id, body);

            expect(mockImageService.saveImage).toHaveBeenCalled();
            expect(mockModel.findByIdAndUpdate).toHaveBeenCalled();
            expect(mockMapper.toGamePreviewDto).toHaveBeenCalledWith(returnedDoc);
            expect(preview).toBeDefined();
            if (preview) expect(preview.id).toBe(id);
        });

        it('maps tiles, objects and scalar fields into the update when provided', async () => {
            const id = 'fullid';
            const savedPreview = 'game-fullid-preview.png';
            (mockImageService.saveImage as jest.Mock).mockResolvedValue(savedPreview);

            const body = {
                name: 'brand new',
                description: 'long desc',
                size: MapSize.LARGE,
                mode: GameMode.CTF,
                gridPreviewUrl: 'data',
                tiles: [
                    { kind: TileKind.BASE, x: 1, y: 2, open: true, teleportChannel: 'chan' },
                ],
                objects: [
                    { id: 'obj1', kind: PlaceableKind.FLAG, x: 3, y: 4, placed: true, orientation: 'SOUTH' },
                ],
            } as any;

            const returnedDoc = { _id: { toString: () => id } } as any;

            let capturedSet: any = null;
            mockModel.findByIdAndUpdate = jest.fn().mockImplementation((passedId: string, setArg: any, opts: any) => {
                capturedSet = setArg;
                return { lean: () => ({ exec: jest.fn().mockResolvedValue(returnedDoc) }) };
            });

            const preview = await service.patchEditByGameId(id, body);

            expect(mockImageService.saveImage).toHaveBeenCalledWith(body.gridPreviewUrl, `game-${id}-preview.png`, 'game-previews');

            expect(mockModel.findByIdAndUpdate).toHaveBeenCalled();
            expect(capturedSet).not.toBeNull();

            const setObj = capturedSet.$set ?? capturedSet;
            expect(setObj.name).toBe(body.name);
            expect(setObj.description).toBe(body.description);
            expect(setObj.size).toBe(body.size);
            expect(setObj.mode).toBe(body.mode);

            expect(setObj.gridPreviewUrl).toBe(savedPreview);

            expect(setObj.tiles).toBeDefined();
            expect(setObj.tiles.length).toBe(body.tiles.length);
            expect(setObj.tiles[0]).toEqual({ kind: body.tiles[0].kind, x: body.tiles[0].x, y: body.tiles[0].y, open: body.tiles[0].open, teleportChannel: body.tiles[0].teleportChannel });

            expect(setObj.objects).toBeDefined();
            expect(setObj.objects.length).toBe(body.objects.length);
            expect(setObj.objects[0]).toEqual({ id: body.objects[0].id, kind: body.objects[0].kind, x: body.objects[0].x, y: body.objects[0].y, placed: body.objects[0].placed, orientation: body.objects[0].orientation });

            expect(mockMapper.toGamePreviewDto).toHaveBeenCalledWith(returnedDoc);
            expect(preview).toBeDefined();
            if (preview) expect(preview.id).toBe(id);
        });
    });
});
