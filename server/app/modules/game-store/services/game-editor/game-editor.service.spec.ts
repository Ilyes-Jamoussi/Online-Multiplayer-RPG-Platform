import { NAME_ALREADY_EXISTS } from '@app/constants/error-messages.constants';
import { GamePreviewDto } from '@app/modules/game-store/dto/game-preview.dto';
import { GameDocument } from '@app/modules/game-store/entities/game.entity';
import { GameEditorService } from '@app/modules/game-store/services/game-editor/game-editor.service';
import { ImageService } from '@app/modules/game-store/services/image/image.service';
import { GameDtoMapper } from '@app/modules/game-store/utils/game-dto-mapper/game-dto-mapper.util';
import { GameMode } from '@common/enums/game-mode.enum';
import { MapSize } from '@common/enums/map-size.enum';
import { Orientation } from '@common/enums/orientation.enum';
import { PlaceableKind } from '@common/enums/placeable-kind.enum';
import { TileKind } from '@common/enums/tile-kind.enum';
import { NotFoundException } from '@nestjs/common';
import { Model } from 'mongoose';

describe('GameEditorService', () => {
    let service: GameEditorService;
    const mockModel: Record<string, unknown> = {};
    const mockImageService: Partial<ImageService> = {};
    const mockMapper: Partial<GameDtoMapper> = {};

    type PatchSet = {
        name: string;
        description: string;
        size: MapSize;
        mode: GameMode;
        gridPreviewUrl: string;
        tiles: { kind: TileKind; x: number; y: number; open: boolean; teleportChannel: number }[];
        objects: { id: string; kind: PlaceableKind; x: number; y: number; placed: boolean; orientation: Orientation }[];
    };

    beforeEach(() => {
        Object.keys(mockModel).forEach((k) => delete mockModel[k]);

        mockImageService.saveImage = jest.fn().mockResolvedValue('some-url.png');
        mockImageService.deleteImage = jest.fn().mockResolvedValue(undefined);
        mockMapper.toGamePreviewDto = jest
            .fn()
            .mockImplementation((g: { _id: { toString: () => string }; name: string }) => ({ id: g._id.toString(), name: g.name }) as GamePreviewDto);
        mockMapper.toGameEditorDto = jest.fn().mockImplementation((g: GameDocument) => ({
            id: g._id.toString(),
            name: g.name,
            tiles: g.tiles,
            objects: g.objects.map((obj) => ({ ...obj, id: obj._id.toString() })),
        }));

        service = new GameEditorService(mockModel as unknown as Model<GameDocument>, mockImageService as ImageService, mockMapper as GameDtoMapper);
    });

    describe('getEditByGameId', () => {
        it('throws NotFoundException when game is not found', async () => {
            mockModel.findById = jest.fn().mockReturnValue({ lean: () => Promise.resolve(null) });

            await expect(service.getEditByGameId('missing-id')).rejects.toThrow(NotFoundException);
            expect(mockModel.findById).toHaveBeenCalledWith('missing-id');
        });

        it('returns mapped editor dto when game exists', async () => {
            const now = new Date();
            const gameDoc = {
                _id: { toString: () => 'abc123' },
                lastModified: now,
                name: 'name',
                description: 'desc',
                size: MapSize.MEDIUM,
                mode: GameMode.CLASSIC,
                tiles: [{ x: 0, y: 0, kind: TileKind.BASE }],
                gridPreviewUrl: 'preview.png',
                objects: [{ _id: { toString: (): string => 'obj1' }, x: 0, y: 0, kind: PlaceableKind.START, placed: false }],
            } as const;

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
            mockModel.findOne = jest.fn().mockReturnValue({ lean: () => ({ exec: jest.fn().mockResolvedValue(null) }) });
            mockModel.findByIdAndUpdate = jest.fn().mockReturnValue({ lean: () => ({ exec: jest.fn().mockResolvedValue(null) }) });

            const res = await service.patchEditByGameId('nope', { name: 'x' });
            expect(res).toBeNull();
            expect(mockModel.findByIdAndUpdate).toHaveBeenCalled();
        });

        it('saves image when gridPreviewUrl provided and returns mapped preview when update succeeds', async () => {
            const id = 'gameid';
            (mockImageService.saveImage as jest.Mock).mockResolvedValue('game-gameid-preview.png');
            mockModel.findOne = jest.fn().mockReturnValue({ lean: () => ({ exec: jest.fn().mockResolvedValue(null) }) });
            mockModel.findById = jest.fn().mockReturnValue({ lean: () => Promise.resolve({ gridPreviewUrl: 'old-image.png' }) });

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
            } as const;

            mockModel.findByIdAndUpdate = jest.fn().mockReturnValue({ lean: () => ({ exec: jest.fn().mockResolvedValue(returnedDoc) }) });

            const body = { gridPreviewUrl: 'data', name: 'newname' };

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
            mockModel.findOne = jest.fn().mockReturnValue({ lean: () => ({ exec: jest.fn().mockResolvedValue(null) }) });
            mockModel.findById = jest.fn().mockReturnValue({ lean: () => Promise.resolve({ gridPreviewUrl: 'old-image.png' }) });

            const body = {
                name: 'brand new',
                description: 'long desc',
                size: MapSize.LARGE,
                mode: GameMode.CTF,
                gridPreviewUrl: 'data',
                tiles: [{ kind: TileKind.BASE, x: 1, y: 2, open: true, teleportChannel: 1 }],
                objects: [{ id: 'obj1', kind: PlaceableKind.FLAG, x: 3, y: 4, placed: true, orientation: Orientation.S }],
            };

            const returnedDoc = { _id: { toString: () => id } } as const;

            let capturedSet: unknown = null;
            mockModel.findByIdAndUpdate = jest.fn().mockImplementation((passedId: string, setArg: unknown) => {
                capturedSet = setArg;
                return { lean: (): { exec: jest.Mock } => ({ exec: jest.fn().mockResolvedValue(returnedDoc) }) };
            });

            const preview = await service.patchEditByGameId(id, body);

            expect(mockImageService.saveImage).toHaveBeenCalledWith(
                body.gridPreviewUrl, 
                expect.stringMatching(new RegExp(`^game-${id}-\\d+-preview\\.png$`)), 
                'game-previews'
            );

            expect(mockModel.findByIdAndUpdate).toHaveBeenCalled();
            expect(capturedSet).not.toBeNull();

            const setObj = (capturedSet as { $set?: PatchSet }).$set ?? (capturedSet as PatchSet);
            expect(setObj.name).toBe(body.name);
            expect(setObj.description).toBe(body.description);
            expect(setObj.size).toBe(body.size);
            expect(setObj.mode).toBe(body.mode);

            expect(setObj.gridPreviewUrl).toBe(savedPreview);

            expect(setObj.tiles).toBeDefined();
            expect(setObj.tiles.length).toBe(body.tiles.length);
            const expectedTile = {
                kind: body.tiles[0].kind,
                x: body.tiles[0].x,
                y: body.tiles[0].y,
                open: body.tiles[0].open,
                teleportChannel: body.tiles[0].teleportChannel,
            };
            expect(setObj.tiles[0]).toEqual(expectedTile);

            expect(setObj.objects).toBeDefined();
            expect(setObj.objects.length).toBe(body.objects.length);
            const expectedObject = {
                id: body.objects[0].id,
                kind: body.objects[0].kind,
                x: body.objects[0].x,
                y: body.objects[0].y,
                placed: body.objects[0].placed,
                orientation: body.objects[0].orientation,
            };
            expect(setObj.objects[0]).toEqual(expectedObject);

            expect(mockMapper.toGamePreviewDto).toHaveBeenCalledWith(returnedDoc as unknown as GameDocument);
            expect(preview).toBeDefined();
            if (preview) expect(preview.id).toBe(id);
        });

        it('throws ConflictException when another game with same name exists', async () => {
            const id = 'someid';
            const body = { name: 'duplicate name' };

            const conflictingGame = { _id: { toString: (): string => 'otherid' }, name: body.name };
            mockModel.findOne = jest.fn().mockReturnValue({ 
                lean: (): { exec: jest.Mock } => ({ exec: jest.fn().mockResolvedValue(conflictingGame) }) 
            });

            await expect(service.patchEditByGameId(id, body)).rejects.toThrow(NAME_ALREADY_EXISTS);
            expect(mockModel.findOne).toHaveBeenCalledWith({ name: body.name, _id: { $ne: id } });
        });

        it('shouldnt throw if dto name is not provided', async () => {
            const id = 'someid';
            const body = { description: 'desc' };

            mockModel.findOne = jest.fn().mockReturnValue({ lean: () => ({ exec: jest.fn().mockResolvedValue(null) }) });
            mockModel.findByIdAndUpdate = jest.fn().mockReturnValue({
                lean: () => ({
                    exec: jest.fn().mockResolvedValue({ _id: { toString: () => id }, name: 'x' }),
                }),
            });

            await expect(service.patchEditByGameId(id, body)).resolves.toBeDefined();
            expect(mockModel.findOne).not.toHaveBeenCalled();
            expect(mockModel.findByIdAndUpdate).toHaveBeenCalled();
        });
    });
});
