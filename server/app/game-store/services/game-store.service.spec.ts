import { getProjection } from '@app/module-utils/mongo.utils';
import { GAME_SIZE_TO_MAX_PLAYERS } from '@app/modules/game/constants/game-size-capacity.constants';
import { Game, GameDocument } from '@app/modules/game/models/game.schema';
import { CreateGameDto, DisplayGameDto, GameDto, UpdateGameDto } from '@common/dtos/game.dto';
import { GameMode } from '@common/enums/game-mode.enum';
import { ItemType } from '@common/enums/item-type.enum';
import { MapSize } from '@common/enums/map-size.enum';
import { TileType } from '@common/enums/tile-type.enum';
import { Visibility } from '@common/enums/visibility.enum';
import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { Model, Types } from 'mongoose';
import { GameService } from './game-store.service';
import { ImageService } from './image.service';

describe('GameService', () => {
    let service: GameService;
    let gameModel: Model<GameDocument>;
    let imageService: ImageService;

    const mockGame = {
        _id: new Types.ObjectId(),
        name: 'Test Game',
        description: 'Test Description',
        size: MapSize.Small,
        tiles: [[{ type: TileType.Sand, item: null }], [{ type: TileType.Sand, item: ItemType.HealthAndDefenseBoost }]],
        items: [
            { item: ItemType.HealthAndDefenseBoost, count: 1 },
            { item: ItemType.SpeedAndAttackBoost, count: 1 },
        ],
        mapImageUrl: 'test-image.png',
        lastModified: new Date(),
        visibility: true,
    };

    const mockGameDto: GameDto = {
        id: mockGame._id.toHexString(),
        name: mockGame.name,
        description: mockGame.description,
        mode: GameMode.Classic,
        size: mockGame.size,
        tiles: mockGame.tiles,
        items: mockGame.items,
        mapImageUrl: mockGame.mapImageUrl,
        lastModified: mockGame.lastModified,
        visibility: mockGame.visibility,
    };

    const mockDisplayGameDto: DisplayGameDto = {
        id: mockGame._id.toHexString(),
        name: mockGame.name,
        description: mockGame.description,
        mode: GameMode.Classic,
        size: mockGame.size,
        mapImageUrl: 'http://localhost:3000/images/test-image.png',
        lastModified: mockGame.lastModified,
        visibility: mockGame.visibility,
        items: mockGame.items,
        tiles: mockGame.tiles,
    };

    const mockCreateGameDto: CreateGameDto = {
        name: 'New Game',
        description: 'New Description',
        size: MapSize.Small,
        tiles: mockGame.tiles,
        items: mockGame.items,
        mapPreviewImage: 'base64-encoded-image-data',
    };

    const mockUpdateGameDto: UpdateGameDto = {
        name: 'Updated Game',
        description: 'Updated Description',
        size: MapSize.Small,
        tiles: mockGame.tiles,
        items: mockGame.items,
        mapPreviewImage: 'base64-encoded-image-data',
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                GameService,
                {
                    provide: getModelToken(Game.name),
                    useValue: {
                        find: jest.fn().mockResolvedValue([]),
                        findById: jest.fn().mockResolvedValue(null),
                        create: jest.fn().mockResolvedValue({}),
                    },
                },
                {
                    provide: ImageService,
                    useValue: {
                        saveImage: jest.fn().mockResolvedValue('test.png'),
                        deleteImage: jest.fn().mockResolvedValue(undefined),
                        getImageUrl: jest.fn().mockReturnValue('http://test.com/test.png'),
                    },
                },
            ],
        }).compile();

        service = module.get<GameService>(GameService);
        gameModel = module.get<Model<GameDocument>>(getModelToken(Game.name));
        imageService = module.get<ImageService>(ImageService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    it('should have required methods', () => {
        expect(typeof service.createGame).toBe('function');
        expect(typeof service.getGames).toBe('function');
        expect(typeof service.deleteGame).toBe('function');
    });

    it('should return true', () => {
        expect(true).toBe(true);
    });

    describe('getGames', () => {
        it('should return an array', async () => {
            const result = await service.getGames();
            expect(Array.isArray(result)).toBe(true);
        });
    });

    describe('createGame', () => {
        it('should create a game successfully', async () => {
            jest.spyOn(imageService, 'saveImage').mockResolvedValue('new-image.png');
            (gameModel.create as jest.Mock).mockResolvedValue(mockGame);

            const result = await service.createGame(mockCreateGameDto);
            expect(result._id).toBeDefined();
            expect(imageService.saveImage).toHaveBeenCalledWith(mockCreateGameDto.mapPreviewImage);
            expect(gameModel.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    name: mockCreateGameDto.name,
                    description: mockCreateGameDto.description,
                    size: mockCreateGameDto.size,
                    tiles: mockCreateGameDto.tiles,
                    items: mockCreateGameDto.items,
                    mapImageUrl: 'new-image.png',
                    visibility: true,
                }),
            );
        });

        it('should handle image save failure', async () => {
            jest.spyOn(imageService, 'saveImage').mockRejectedValue(new Error('Image save failed'));
            await expect(service.createGame(mockCreateGameDto)).rejects.toThrow(BadRequestException);
        });

        it('should handle game creation failure', async () => {
            jest.spyOn(imageService, 'saveImage').mockResolvedValue('new-image.png');
            (gameModel.create as jest.Mock).mockRejectedValue(new Error('Creation failed'));
            await expect(service.createGame(mockCreateGameDto)).rejects.toThrow(BadRequestException);
        });
    });

    describe('getGame', () => {
        it('should return a game by id', async () => {
            const mockQuery = {
                lean: jest.fn().mockResolvedValue(mockGame),
            };
            (gameModel.findById as jest.Mock).mockReturnValue(mockQuery);

            const result = await service.getGame(mockGame._id.toHexString());
            expect(result).toEqual(mockGameDto);
            expect(gameModel.findById).toHaveBeenCalledWith(mockGame._id.toHexString(), getProjection('gameDto'));
        });

        it('should throw NotFoundException if game not found', async () => {
            const mockQuery = {
                lean: jest.fn().mockResolvedValue(null),
            };
            (gameModel.findById as jest.Mock).mockReturnValue(mockQuery);

            await expect(service.getGame('nonexistent-id')).rejects.toThrow(NotFoundException);
        });
    });

    describe('getGamesDisplay', () => {
        it('should return all games formatted for display', async () => {
            const mockQuery = {
                lean: jest.fn().mockResolvedValue([mockGame]),
            };
            (gameModel.find as jest.Mock).mockReturnValue(mockQuery);
            (imageService.getImageUrl as jest.Mock).mockReturnValue(mockDisplayGameDto.mapImageUrl);

            const result = await service.getGamesDisplay();
            expect(result).toEqual([
                {
                    id: mockGame._id.toHexString(),
                    name: mockGame.name,
                    description: mockGame.description,
                    mode: GameMode.Classic,
                    size: mockGame.size,
                    mapImageUrl: mockDisplayGameDto.mapImageUrl,
                    lastModified: mockGame.lastModified,
                    visibility: mockGame.visibility,
                    items: mockGame.items,
                    tiles: mockGame.tiles,
                },
            ]);
            expect(gameModel.find).toHaveBeenCalledWith({}, getProjection('displayGameDto'));
        });

        it('should return only visible games when visibility filter is "user"', async () => {
            (gameModel.find as jest.Mock).mockReturnValue({
                lean: async () => Promise.resolve([mockGame]),
            });
            (imageService.getImageUrl as jest.Mock).mockReturnValue(mockDisplayGameDto.mapImageUrl);

            const result = await service.getGamesDisplay(Visibility.User);

            expect(result).toEqual([mockDisplayGameDto]);
            expect(gameModel.find).toHaveBeenCalledWith({ visibility: true }, getProjection('displayGameDto'));
        });
    });

    describe('deleteGame', () => {
        it('should delete a game successfully', async () => {
            (gameModel.findByIdAndDelete as jest.Mock).mockResolvedValue(mockGame);
            jest.spyOn(imageService, 'deleteImage').mockResolvedValue(undefined);

            await service.deleteGame(mockGame._id.toHexString());
            expect(gameModel.findByIdAndDelete).toHaveBeenCalledWith(mockGame._id.toHexString());
            expect(imageService.deleteImage).toHaveBeenCalledWith(mockGame.mapImageUrl);
        });

        it('should handle game not found', async () => {
            (gameModel.findByIdAndDelete as jest.Mock).mockResolvedValue(null);
            await expect(service.deleteGame('nonexistent-id')).rejects.toThrow(NotFoundException);
        });

        it('should handle delete failure', async () => {
            (gameModel.findByIdAndDelete as jest.Mock).mockRejectedValue(new Error('Delete failed'));
            await expect(service.deleteGame(mockGame._id.toHexString())).rejects.toThrow(BadRequestException);
        });
    });

    describe('updateGame', () => {
        it('should update a game successfully', async () => {
            const updatedGame = { ...mockGame, ...mockUpdateGameDto };
            jest.spyOn(imageService, 'saveImage').mockResolvedValue('updated-image.png');
            (gameModel.findByIdAndUpdate as jest.Mock).mockReturnValue({
                lean: jest.fn().mockResolvedValue(updatedGame),
            });

            const result = await service.updateGame(mockGame._id.toHexString(), mockUpdateGameDto);
            expect(result.name).toBe(mockUpdateGameDto.name);
            expect(result.description).toBe(mockUpdateGameDto.description);
            expect(imageService.saveImage).toHaveBeenCalledWith(mockUpdateGameDto.mapPreviewImage);
        });

        it('should handle game not found', async () => {
            (gameModel.findByIdAndUpdate as jest.Mock).mockReturnValue({
                lean: jest.fn().mockResolvedValue(null),
            });

            await expect(service.updateGame('nonexistent-id', mockUpdateGameDto)).rejects.toThrow(NotFoundException);
        });

        it('should handle update failure', async () => {
            jest.spyOn(imageService, 'saveImage').mockResolvedValue('updated-image.png');
            (gameModel.findByIdAndUpdate as jest.Mock).mockRejectedValue(new Error('Update failed'));

            await expect(service.updateGame(mockGame._id.toHexString(), mockUpdateGameDto)).rejects.toThrow(BadRequestException);
        });
    });

    describe('getGameVisibility', () => {
        it('should return game visibility', async () => {
            const mockQuery = {
                lean: jest.fn().mockResolvedValue(mockGame),
            };
            (gameModel.findById as jest.Mock).mockReturnValue(mockQuery);

            const result = await service.getGameVisibility(mockGame._id.toHexString());
            expect(result).toEqual({ visibility: mockGame.visibility });
            expect(gameModel.findById).toHaveBeenCalledWith(mockGame._id.toHexString(), getProjection('visibilityDto'));
        });

        it('should throw NotFoundException if game not found', async () => {
            const mockQuery = {
                lean: jest.fn().mockResolvedValue(null),
            };
            (gameModel.findById as jest.Mock).mockReturnValue(mockQuery);

            await expect(service.getGameVisibility(mockGame._id.toHexString())).rejects.toThrow(NotFoundException);
        });
    });

    describe('toggleVisibility', () => {
        it('should toggle game visibility', async () => {
            const currentVisibility = true;
            const newVisibility = false;

            const mockFindByIdQuery = {
                lean: jest.fn().mockResolvedValue({ ...mockGame, visibility: currentVisibility }),
            };
            const mockUpdateQuery = {
                lean: jest.fn().mockResolvedValue({ ...mockGame, visibility: newVisibility }),
            };
            (gameModel.findById as jest.Mock).mockReturnValue(mockFindByIdQuery);
            (gameModel.findByIdAndUpdate as jest.Mock).mockReturnValue(mockUpdateQuery);

            const result = await service.toggleVisibility(mockGame._id.toHexString(), currentVisibility);
            expect(result).toEqual({ visibility: newVisibility });
        });

        it('should throw NotFoundException if game not found', async () => {
            const mockQuery = {
                lean: jest.fn().mockResolvedValue(null),
            };
            (gameModel.findById as jest.Mock).mockReturnValue(mockQuery);

            await expect(service.toggleVisibility(mockGame._id.toHexString(), true)).rejects.toThrow(NotFoundException);
        });

        it('should throw ConflictException if current visibility does not match', async () => {
            const mockQuery = {
                lean: jest.fn().mockResolvedValue({ ...mockGame, visibility: false }),
            };
            (gameModel.findById as jest.Mock).mockReturnValue(mockQuery);

            await expect(service.toggleVisibility(mockGame._id.toHexString(), true)).rejects.toThrow(ConflictException);
        });
    });

    describe('checkIfGameExists', () => {
        it('should return true if game exists', async () => {
            (gameModel.findById as jest.Mock).mockReturnValue({
                lean: jest.fn().mockReturnValue(mockGame),
            });

            const result = await service.checkIfGameExists(mockGame._id.toHexString());

            expect(gameModel.findById).toHaveBeenCalledWith(mockGame._id.toHexString(), { _id: 1 });
            expect(result).toBe(true);
        });

        it('should return false if game does not exist', async () => {
            (gameModel.findById as jest.Mock).mockReturnValue({
                lean: jest.fn().mockReturnValue(null),
            });

            const result = await service.checkIfGameExists(mockGame._id.toHexString());

            expect(result).toBe(false);
        });

        it('should handle exceptions and return false', async () => {
            (gameModel.findById as jest.Mock).mockImplementation(() => {
                throw new Error('Database error');
            });

            const result = await service.checkIfGameExists(mockGame._id.toHexString());

            expect(result).toBe(false);
        });
    });

    describe('getGameMaxPlayer', () => {
        it('should return max players based on game size', async () => {
            const mockQuery = {
                lean: jest.fn().mockResolvedValue(mockGame),
            };
            (gameModel.findById as jest.Mock).mockReturnValue(mockQuery);

            const result = await service.getGameMaxPlayer(mockGame._id.toHexString());
            expect(result).toBe(GAME_SIZE_TO_MAX_PLAYERS[mockGame.size]);
        });

        it('should throw BadRequestException for invalid game ID', async () => {
            await expect(service.getGameMaxPlayer('')).rejects.toThrow(BadRequestException);
        });

        it('should throw NotFoundException if game is not found', async () => {
            (gameModel.findById as any).mockReturnValueOnce({
                lean: jest.fn().mockReturnValue(null),
            });

            await expect(service.getGameMaxPlayer(mockGame._id.toHexString())).rejects.toThrow(NotFoundException);
        });
    });

    describe('validateGame', () => {
        it('should validate a valid game', () => {
            const result = service.validateGame(mockGame._id.toHexString());
            expect(result).toBe(true);
        });

        it('should handle invalid game data', () => {
            const invalidGame = { ...mockGame, items: [] };
            expect(() => service.validateGame(invalidGame._id.toHexString())).toThrow(BadRequestException);
        });
    });
});
