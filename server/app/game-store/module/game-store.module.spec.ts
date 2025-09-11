import { Test, TestingModule } from '@nestjs/testing';
import { MongooseModule } from '@nestjs/mongoose';
import { GameStoreModule } from './game-store.module';

describe('GameStoreModule', () => {
    let module: TestingModule;

    beforeEach(async () => {
        module = await Test.createTestingModule({
            imports: [
                MongooseModule.forRoot('mongodb://localhost/test'),
                GameStoreModule,
            ],
        }).compile();
    });

    it('should be defined', () => {
        expect(module).toBeDefined();
    });

    afterEach(async () => {
        await module.close();
    });
});
