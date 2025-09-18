import { CreateGameDto } from '@app/game-store/dto/create-game.dto';
import { UpdateGameDto } from '@app/game-store/dto/update-game.dto';
import { Game, GameDocument } from '@app/game-store/entities/game.entity';
import { ImageService } from '@app/game-store/services/image.service';
import { GameStoreService } from '@app/game-store/services/game-store.service';
import { getProjection } from '@app/utils/mongo.utils';
import { GameMode } from '@common/enums/game-mode.enum';
import { MapSize } from '@common/enums/map-size.enum';
import { NotFoundException } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { Model, Types, Query } from 'mongoose';

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
        tiles: [],
        objects: [],
        gridPreviewImage: 'test-preview-image',
    };

    const mockUpdateGameDto: UpdateGameDto = {
        name: 'Updated Game',
        description: 'Updated Description',
        gridPreviewImage: 'updated-preview-image',
    };

    beforeEach(async () => {
        const mockGameModel = {
            create: jest.fn(),
            find: jest.fn(),
            findById: jest.fn(),
            findByIdAndUpdate: jest.fn(),
            deleteOne: jest.fn(),
        };

        module = await Test.createTestingModule({
            providers: [
                GameStoreService,
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

    describe('createGame', () => {
        it('should create a game and return GamePreviewDto', async () => {
            const mockGameDocument = createMockGameDocument();
            (gameModel.create as jest.Mock).mockResolvedValue(mockGameDocument);

            const result = await service.createGame(mockCreateGameDto);

            expect(gameModel.create).toHaveBeenCalledWith(mockCreateGameDto);
            expect(result).toEqual({
                id: mockObjectId.toString(),
                name: mockGameDocument.name,
                description: mockGameDocument.description,
                size: mockGameDocument.size,
                mode: mockGameDocument.mode,
                lastModified: mockGameDocument.lastModified,
                visibility: mockGameDocument.visibility,
            });
        });
    });

    describe('getGames', () => {
        it('should return array of GamePreviewDto', async () => {
            const mockGameDocument = createMockGameDocument();
            const mockQuery = {
                lean: jest.fn().mockResolvedValue([mockGameDocument]),
            } as unknown as Query<GameDocument[], GameDocument>;
            gameModel.find.mockReturnValue(mockQuery);

            const result = await service.getGames();

            expect(gameModel.find).toHaveBeenCalledWith({}, getProjection('displayGameDto'));
            expect(mockQuery.lean).toHaveBeenCalled();
            expect(result).toHaveLength(1);
            expect(result[0]).toEqual({
                id: mockObjectId.toString(),
                name: mockGameDocument.name,
                description: mockGameDocument.description,
                size: mockGameDocument.size,
                mode: mockGameDocument.mode,
                lastModified: mockGameDocument.lastModified,
                visibility: mockGameDocument.visibility,
            });
        });

        it('should return empty array when no games exist', async () => {
            const mockQuery = {
                lean: jest.fn().mockResolvedValue([]),
            };
            (gameModel.find as jest.Mock).mockReturnValue(mockQuery);

            const result = await service.getGames();

            expect(result).toEqual([]);
        });
    });

    describe('getGameInit', () => {
        it('should return GameInitDto for existing game', async () => {
            const mockGameDocument = createMockGameDocument();
            const mockQuery = {
                lean: jest.fn().mockResolvedValue(mockGameDocument),
            };
            (gameModel.findById as jest.Mock).mockReturnValue(mockQuery);

            const result = await service.getGameInit(mockObjectId.toString());

            expect(gameModel.findById).toHaveBeenCalledWith(mockObjectId.toString(), { map: 1, itemContainers: 1, size: 1 });
            expect(result).toEqual({
                mapSize: mockGameDocument.size,
            });
        });

        it('should throw NotFoundException when game not found', async () => {
            const mockQuery = {
                lean: jest.fn().mockResolvedValue(null),
            } as unknown as Query<GameDocument | null, GameDocument>;
            gameModel.findById.mockReturnValue(mockQuery);

            await expect(service.getGameInit('nonexistent-id')).rejects.toThrow(new NotFoundException('Game with id nonexistent-id not found'));
        });
    });

    describe('updateGame', () => {
        it('should update game and return GamePreviewDto', async () => {
            const mockGameDocument = createMockGameDocument();
            const updatedGame = { ...mockGameDocument, ...mockUpdateGameDto, lastModified: new Date() };
            const mockImageService = module.get(ImageService);
            
            (gameModel.findById as jest.Mock).mockResolvedValue(mockGameDocument);
            (mockImageService.saveImage as jest.Mock).mockResolvedValue('updated-image-url');
            (gameModel.findByIdAndUpdate as jest.Mock).mockResolvedValue(updatedGame);

            const result = await service.updateGame(mockObjectId.toString(), mockUpdateGameDto);

            expect(gameModel.findByIdAndUpdate).toHaveBeenCalledWith(
                mockObjectId.toString(),
                expect.objectContaining({
                    name: mockUpdateGameDto.name,
                    description: mockUpdateGameDto.description,
                    gridPreviewUrl: expect.any(String),
                    lastModified: expect.any(Date),
                }),
                { new: true },
            );
            expect(result).toEqual(
                expect.objectContaining({
                    name: mockUpdateGameDto.name,
                    description: mockUpdateGameDto.description,
                }),
            );
        });

        it('should throw NotFoundException when game not found', async () => {
            (gameModel.findByIdAndUpdate as jest.Mock).mockResolvedValue(null);

            await expect(service.updateGame('nonexistent-id', mockUpdateGameDto)).rejects.toThrow(new NotFoundException('Game not found'));
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
