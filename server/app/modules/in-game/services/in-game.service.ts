import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { Game, GameDocument } from '@app/modules/game-store/entities/game.entity';
import { Session, InGameSession } from '@common/models/session.interface';
import { InGamePlayer } from '@common/models/player.interface';

import { InGameGridService } from './in-game-grid.service';
import { InGameSessionService } from './in-game-session.service';
import { TurnStateMachineService, TurnCallbacks } from './turn-state-machine.service';

@Injectable()
export class InGameService {
    constructor(
        @InjectModel(Game.name) private readonly gameModel: Model<GameDocument>,
        private readonly gridService: InGameGridService,
        private readonly sessionService: InGameSessionService,
        private readonly turnMachine: TurnStateMachineService,
    ) {}

    async initInGameSession(session: Session): Promise<InGameSession> {
        const game = await this.gameModel.findById(session.gameId);
        if (!game) throw new Error('Game not found');

        const { startPoints, players: assignedPlayers } = this.gridService.initGridForSession(session, game);

        const turnOrderIndex = this.gridService.getRandomTurnOrderIndex(assignedPlayers);
        const activePlayerId = assignedPlayers[turnOrderIndex[0]].id;

        const inGameSession = this.sessionService.create({
            baseSession: session,
            mapSize: game.size,
            mode: game.mode,
            startPoints,
            turnOrderIndex,
            activePlayerId,
            players: assignedPlayers,
        });
        return inGameSession;
    }

    joinInGameSession(sessionId: string, playerId: string): InGameSession {
        return this.sessionService.join(sessionId, playerId);
    }

    leaveInGameSession(sessionId: string, playerId: string): InGameSession {
        return this.sessionService.leave(sessionId, playerId);
    }

    startGame(sessionId: string, callbacks: TurnCallbacks): void {
        this.turnMachine.startFirstTurn(sessionId, callbacks);
    }

    playerEndTurn(sessionId: string, playerId: string, callbacks: TurnCallbacks): void {
        this.turnMachine.playerEndTurn(sessionId, playerId, callbacks);
    }

    forceEndTurn(sessionId: string, callbacks: TurnCallbacks): void {
        this.turnMachine.forceEndTurn(sessionId, callbacks);
    }

    getInGameSession(sessionId: string): InGameSession | undefined {
        return this.sessionService.get(sessionId);
    }

    getCurrentPlayer(sessionId: string): InGamePlayer | undefined {
        return this.sessionService.getCurrentPlayer(sessionId);
    }
}
