import { CreateGameDto } from '@app/modules/game-store/dto/create-game.dto';
import { Game, GameDocument } from '@app/modules/game-store/entities/game.entity';
import { GameStoreService } from '@app/modules/game-store/services/game-store/game-store.service';
import { ImageService } from '@app/modules/game-store/services/image/image.service';
import { GameDtoMapper } from '@app/modules/game-store/utils/game-dto-mapper/game-dto-mapper.util';
import { getProjection } from '@app/utils/mongo/mongo.util';
import { GameMode } from '@common/enums/game-mode.enum';
import { MapSize } from '@common/enums/map-size.enum';
import { NotFoundException } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { Model, Query, Types } from 'mongoose';

describe('GameStoreService', () => {
    let service: GameStoreService;
    let gameModel: jest.Mocked<Model<GameDocument>>;
    let module: TestingModule;

    const mockObjectId = new Types.ObjectId();
    const mockDate = new Date();

    const createMockGameDocument = (overrides: Partial<Game> = {}): Partial<GameDocument> => ({
        _id: mockObjectId,
        name: 'Test Game',
        description: 'Test Description',
        size: MapSize.MEDIUM,
        mode: GameMode.CLASSIC,
        lastModified: mockDate,
        visibility: true,
        ...overrides,
    });

    const mockCreateGameDto: CreateGameDto = {
        name: 'New Game',
        description: 'New Description',
        size: MapSize.SMALL,
        mode: GameMode.CLASSIC,
    };

    beforeEach(async () => {
        const mockGameModel = {
            create: jest.fn(),
            find: jest.fn(),
            findOne: jest.fn(),
            findById: jest.fn(),
            findByIdAndUpdate: jest.fn(),
            deleteOne: jest.fn(),
        };

        module = await Test.createTestingModule({
            providers: [
                GameStoreService,
                GameDtoMapper,
                {
                    provide: getModelToken(Game.name),
                    useValue: mockGameModel,
                },
                {
                    provide: ImageService,
                    useValue: {
                        saveImage: jest.fn(),
                        deleteImage: jest.fn(),
                    },
                },
            ],
        }).compile();

        service = module.get<GameStoreService>(GameStoreService);
        gameModel = module.get(getModelToken(Game.name));
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('getGames', () => {
        it('should return array of GamePreviewDto', async () => {
            const mockGameDocument = createMockGameDocument();

            const mockQuery = {
                sort: jest.fn().mockReturnThis(),
                lean: jest.fn().mockResolvedValue([mockGameDocument]),
            } as unknown as Query<GameDocument[], GameDocument>;

            gameModel.find.mockReturnValue(mockQuery);

            const result = await service.getGames();

            expect(gameModel.find).toHaveBeenCalledWith({ draft: false }, getProjection('displayGameDto'));
            expect(mockQuery.sort).toHaveBeenCalledWith({ createdAt: 1 });
            expect(mockQuery.lean).toHaveBeenCalled();

            expect(result).toHaveLength(1);
            expect(result[0]).toEqual({
                id: mockObjectId.toString(),
                name: 'Test Game',
                description: 'Test Description',
                size: MapSize.MEDIUM,
                mode: GameMode.CLASSIC,
                lastModified: mockDate,
                visibility: true,
            });
        });

        it('should return empty array when no games exist', async () => {
            const mockQuery = {
                sort: jest.fn().mockReturnThis(),
                lean: jest.fn().mockResolvedValue([]),
            };
            (gameModel.find as jest.Mock).mockReturnValue(mockQuery);

            const result = await service.getGames();

            expect(result).toEqual([]);
        });
    });

    describe('createGame', () => {
        it('should create a new draft when no existing draft', async () => {
            const mockGameDocument = createMockGameDocument();
            const mockGameDocumentWithToObject = {
                ...mockGameDocument,
                toObject: jest.fn().mockReturnValue(mockGameDocument),
            };

            (gameModel.findOne as jest.Mock).mockResolvedValue(null);
            (gameModel.create as jest.Mock).mockResolvedValue(mockGameDocumentWithToObject);

            const result = await service.createGame(mockCreateGameDto);

            expect(gameModel.findOne).toHaveBeenCalledWith({ draft: true });
            expect(gameModel.create).toHaveBeenCalled();
            expect(result).toEqual(
                expect.objectContaining({
                    id: mockObjectId.toString(),
                    name: mockGameDocument.name,
                }),
            );
        });

        it('should update existing draft when one exists', async () => {
            const existingDraft = createMockGameDocument({ draft: true });
            const updatedDraft = { ...existingDraft, name: 'Draft Updated' } as Partial<GameDocument>;

            const mockQuery = {
                lean: jest.fn().mockResolvedValue(updatedDraft),
            };

            (gameModel.findOne as jest.Mock).mockResolvedValue(existingDraft);
            (gameModel.findByIdAndUpdate as jest.Mock).mockReturnValue(mockQuery);

            const result = await service.createGame(mockCreateGameDto);

            expect(gameModel.findOne).toHaveBeenCalledWith({ draft: true });
            expect(gameModel.findByIdAndUpdate).toHaveBeenCalled();
            expect(mockQuery.lean).toHaveBeenCalled();
            expect(result).toEqual(expect.objectContaining({ id: mockObjectId.toString(), name: updatedDraft.name }));
        });

        it('should use default values when name and description are undefined', async () => {
            const dtoWithoutNameDesc = { size: MapSize.SMALL, mode: GameMode.CLASSIC } as CreateGameDto;
            const mockGameDocument = createMockGameDocument();
            const mockGameDocumentWithToObject = {
                ...mockGameDocument,
                toObject: jest.fn().mockReturnValue(mockGameDocument),
            };

            (gameModel.findOne as jest.Mock).mockResolvedValue(null);
            (gameModel.create as jest.Mock).mockResolvedValue(mockGameDocumentWithToObject);

            await service.createGame(dtoWithoutNameDesc);

            expect(gameModel.create).toHaveBeenCalled();
        });
    });

    describe('deleteGame', () => {
        it('should delete game successfully', async () => {
            const mockGameDocument = createMockGameDocument();
            const mockResult = { deletedCount: 1 };
            (gameModel.findById as jest.Mock).mockResolvedValue(mockGameDocument);
            (gameModel.deleteOne as jest.Mock).mockResolvedValue(mockResult);

            await service.deleteGame(mockObjectId.toString());

            expect(gameModel.deleteOne).toHaveBeenCalledWith({ _id: mockObjectId.toString() });
        });

        it('should delete associated image when gridPreviewUrl exists', async () => {
            const mockGameDocument = createMockGameDocument({ gridPreviewUrl: 'to-delete-url' });
            const mockImageService = module.get(ImageService);
            const mockResult = { deletedCount: 1 };

            (gameModel.findById as jest.Mock).mockResolvedValue(mockGameDocument);
            (mockImageService.deleteImage as jest.Mock).mockResolvedValue(undefined);
            (gameModel.deleteOne as jest.Mock).mockResolvedValue(mockResult);

            await service.deleteGame(mockObjectId.toString());

            expect(mockImageService.deleteImage).toHaveBeenCalledWith(mockGameDocument.gridPreviewUrl);
            expect(gameModel.deleteOne).toHaveBeenCalledWith({ _id: mockObjectId.toString() });
        });

        it('should throw NotFoundException when game not found', async () => {
            const mockResult = { deletedCount: 0 };
            (gameModel.deleteOne as jest.Mock).mockResolvedValue(mockResult);

            await expect(service.deleteGame('nonexistent-id')).rejects.toThrow(new NotFoundException('Game not found'));
        });
    });

    describe('toggleVisibility', () => {
        it('should toggle game visibility to false', async () => {
            const mockGameDocument = createMockGameDocument();
            const mockQuery = {
                lean: jest.fn().mockResolvedValue(mockGameDocument),
            };
            (gameModel.findByIdAndUpdate as jest.Mock).mockReturnValue(mockQuery);

            await service.toggleVisibility(mockObjectId.toString(), false);

            expect(gameModel.findByIdAndUpdate).toHaveBeenCalledWith(
                mockObjectId.toString(),
                { $set: { visibility: false, lastModified: expect.any(Date) } },
                { new: false },
            );
            expect(mockQuery.lean).toHaveBeenCalled();
        });

        it('should toggle game visibility to true', async () => {
            const mockGameDocument = createMockGameDocument();
            const mockQuery = {
                lean: jest.fn().mockResolvedValue(mockGameDocument),
            };
            (gameModel.findByIdAndUpdate as jest.Mock).mockReturnValue(mockQuery);

            await service.toggleVisibility(mockObjectId.toString(), true);

            expect(gameModel.findByIdAndUpdate).toHaveBeenCalledWith(
                mockObjectId.toString(),
                { $set: { visibility: true, lastModified: expect.any(Date) } },
                { new: false },
            );
        });

        it('should throw NotFoundException when game not found', async () => {
            const mockQuery = {
                lean: jest.fn().mockResolvedValue(null),
            };
            (gameModel.findByIdAndUpdate as jest.Mock).mockReturnValue(mockQuery);

            await expect(service.toggleVisibility('nonexistent-id', false)).rejects.toThrow(new NotFoundException('Game not found'));
        });
    });
});
