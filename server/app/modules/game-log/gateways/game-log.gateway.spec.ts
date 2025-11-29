import { Test, TestingModule } from '@nestjs/testing';
import { GameLogGateway } from './game-log.gateway';
import { GameLogService } from '@app/modules/game-log/services/game-log.service';
import { InGameSessionRepository } from '@app/modules/in-game/services/in-game-session/in-game-session.repository';
import { InGameService } from '@app/modules/in-game/services/in-game/in-game.service';

describe('GameLogGateway', () => {
    let gateway: GameLogGateway;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                GameLogGateway,
                {
                    provide: GameLogService,
                    useValue: {},
                },
                {
                    provide: InGameSessionRepository,
                    useValue: {},
                },
                {
                    provide: InGameService,
                    useValue: {},
                },
            ],
        }).compile();

        gateway = module.get<GameLogGateway>(GameLogGateway);
    });

    it('should be defined', () => {
        expect(gateway).toBeDefined();
    });
});
