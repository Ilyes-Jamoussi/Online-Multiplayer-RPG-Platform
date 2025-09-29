import { GameEditorDto } from '@app/game-store/dto/game-editor.dto';
import { GamePreviewDto } from '@app/game-store/dto/game-preview.dto';
import { PatchGameEditorDto } from '@app/game-store/dto/patch-game-editor.dto';
import { GameStoreGateway } from '@app/game-store/gateways/game-store.gateway';
import { GameEditorService } from '@app/game-store/services/game-editor/game-editor.service';
import { Test, TestingModule } from '@nestjs/testing';
import { GameEditorController } from './game-editor.controller';
import { GameStoreService } from '@app/game-store/services/game-store/game-store.service';
import { GameMode } from '@common/enums/game-mode.enum';
import { MapSize } from '@common/enums/map-size.enum';

describe('GameEditorController', () => {
    let controller: GameEditorController;
    let service: GameEditorService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [GameEditorController],
            providers: [
                {
                    provide: GameEditorService,
                    useValue: {
                        getEditByGameId: jest.fn(),
                        patchEditByGameId: jest.fn(),
                    },
                },
                {
                    provide: GameStoreGateway,
                    useValue: {
                        emitGameUpdated: jest.fn(),
                    },
                },
                {
                    provide: GameStoreService,
                    useValue: {
                        createGame: jest.fn(),
                    },
                },
            ],
        }).compile();

        controller = module.get<GameEditorController>(GameEditorController);
        service = module.get<GameEditorService>(GameEditorService);
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    it('should return game editor dto from getGameForEdit', async () => {
        const result = { id: '1', name: 'Test Game' } as GameEditorDto;
        jest.spyOn(service, 'getEditByGameId').mockResolvedValue(result);
        expect(await controller.getGameForEdit('1')).toBe(result);
    });

    it('should call service.getEditByGameId with correct id', async () => {
        jest.spyOn(service, 'getEditByGameId').mockResolvedValue({} as GameEditorDto);
        await controller.getGameForEdit('123');
        expect(service.getEditByGameId).toHaveBeenCalledWith('123');
    });

    it('should return patched game editor dto from patchGameForEdit', async () => {
        const patchDto = { name: 'Patched Game' } as PatchGameEditorDto;
        const result = { id: '1', name: 'Patched Game' } as GamePreviewDto;
        jest.spyOn(service, 'patchEditByGameId').mockResolvedValue(result);
        expect(await controller.patchGameForEdit('1', patchDto)).toBe(result);
    });

    it('should create a new game if patchGameForEdit returns null', async () => {
        const patchBody = { name: 'New Game' } as PatchGameEditorDto;

        const patchSpy = jest
            .spyOn(controller['gameEditorService'], 'patchEditByGameId')
            .mockResolvedValueOnce(null)
            .mockResolvedValueOnce({
                id: '2',
                name: 'New Game',
                description: '',
                size: MapSize.SMALL,
                mode: GameMode.CLASSIC,
                visibility: false,
                lastModified: new Date(),
                draft: true,
                gridPreviewUrl: '',
            } as GamePreviewDto);

        const createGameSpy = jest.spyOn(controller['gameStoreService'], 'createGame').mockResolvedValue({
            id: '2',
            name: 'New Game',
            description: '',
            size: MapSize.SMALL,
            mode: GameMode.CLASSIC,
            visibility: false,
            lastModified: new Date(),
            draft: true,
            gridPreviewUrl: '',
        });

        jest.spyOn(controller['gameStoreGateway'], 'emitGameUpdated').mockImplementation(() => undefined);

        const result = await controller.patchGameForEdit('1', patchBody);

        expect(createGameSpy).toHaveBeenCalledWith({
            name: patchBody.name,
            description: patchBody.description,
            size: patchBody.size,
            mode: patchBody.mode,
            visibility: false,
        });

        expect(patchSpy).toHaveBeenNthCalledWith(2, '2', patchBody);

        expect(result).toEqual(expect.objectContaining({ id: '2', name: 'New Game' }));
    });
});
