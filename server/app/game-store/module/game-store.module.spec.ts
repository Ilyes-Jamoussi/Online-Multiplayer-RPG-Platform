import { Test, TestingModule } from '@nestjs/testing';
import { MongooseModule } from '@nestjs/mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { GameStoreModule } from './game-store.module';

describe('GameStoreModule', () => {
    let module: TestingModule;
    let mongoServer: MongoMemoryServer;

    beforeEach(async () => {
        mongoServer = await MongoMemoryServer.create();
        const mongoUri = mongoServer.getUri();

        module = await Test.createTestingModule({
            imports: [MongooseModule.forRoot(mongoUri), GameStoreModule],
        }).compile();
    });

    it('should be defined', () => {
        expect(module).toBeDefined();
    });

    afterEach(async () => {
        if (module) {
            await module.close();
        }
        if (mongoServer) {
            await mongoServer.stop();
        }
    });
});
