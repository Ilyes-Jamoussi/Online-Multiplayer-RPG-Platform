import { Test, TestingModule } from '@nestjs/testing';
import { GameEditorController } from './game-editor.controller';
import { GameEditorService } from '@app/game-store/services/game-editor.service';
import { GameEditorDto } from '@app/game-store/dto/game-editor.dto';
import { PatchGameEditorDto } from '@app/game-store/dto/patch-game-editor.dto';
import { NotFoundException } from '@nestjs/common';

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
        const result = { id: '1', name: 'Patched Game' } as GameEditorDto;
        jest.spyOn(service, 'patchEditByGameId').mockResolvedValue(result);
        expect(await controller.patchGameForEdit('1', patchDto)).toBe(result);
    });

    it('should throw NotFoundException if patchGameForEdit returns null', async () => {
        jest.spyOn(service, 'patchEditByGameId').mockResolvedValue(null);
        await expect(controller.patchGameForEdit('1', {} as PatchGameEditorDto)).rejects.toThrow(NotFoundException);
    });
});
