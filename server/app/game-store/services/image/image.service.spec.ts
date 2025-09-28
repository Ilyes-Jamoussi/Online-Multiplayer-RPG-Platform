import { Test, TestingModule } from '@nestjs/testing';
import { ImageService } from './image.service';
import { promises as fs } from 'fs';
import { join } from 'path';

jest.mock('fs', () => ({
    promises: {
        mkdir: jest.fn(),
        writeFile: jest.fn(),
        unlink: jest.fn(),
    },
}));

describe('ImageService', () => {
    let service: ImageService;
    const mockFs = fs as jest.Mocked<typeof fs>;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [ImageService],
        }).compile();

        service = module.get<ImageService>(ImageService);
        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('saveImage', () => {
        it('should save image and return file path', async () => {
            const base64Data =
                'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJ' + 'AAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==';
            const filename = 'test-image.png';
            const folder = 'games';

            mockFs.mkdir.mockResolvedValue(undefined);
            mockFs.writeFile.mockResolvedValue(undefined);

            const result = await service.saveImage(base64Data, filename, folder);

            expect(mockFs.mkdir).toHaveBeenCalledWith(join(process.cwd(), 'assets', folder), { recursive: true });
            expect(mockFs.writeFile).toHaveBeenCalledWith(join(process.cwd(), 'assets', folder, filename), expect.any(Buffer));
            expect(result).toBe(`/assets/${folder}/${filename}`);
        });

        it('should clean filename with special characters', async () => {
            const base64Data = 'data:image/png;base64,test';
            const filename = 'test image@#$.png';
            const folder = 'games';
            const expectedCleanFilename = 'test-image---.png';

            mockFs.mkdir.mockResolvedValue(undefined);
            mockFs.writeFile.mockResolvedValue(undefined);

            const result = await service.saveImage(base64Data, filename, folder);

            expect(mockFs.writeFile).toHaveBeenCalledWith(join(process.cwd(), 'assets', folder, expectedCleanFilename), expect.any(Buffer));
            expect(result).toBe(`/assets/${folder}/${expectedCleanFilename}`);
        });
    });

    describe('deleteImage', () => {
        it('should delete image file', async () => {
            const filepath = '/assets/games/test-image.png';
            mockFs.unlink.mockResolvedValue(undefined);

            await service.deleteImage(filepath);

            expect(mockFs.unlink).toHaveBeenCalledWith(join(process.cwd(), 'assets', 'games/test-image.png'));
        });
    });

    describe('getImageUrl', () => {
        it('should return the same filepath', () => {
            const filepath = '/assets/games/test-image.png';

            const result = service.getImageUrl(filepath);

            expect(result).toBe(filepath);
        });
    });
});
