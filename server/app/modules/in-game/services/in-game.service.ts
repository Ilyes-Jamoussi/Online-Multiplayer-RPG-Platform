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

    /**
     * Initialisation complète d’une session en jeu :
     * - charge la carte
     * - assigne les start points
     * - crée la session
     */
    async initInGameSession(session: Session): Promise<InGameSession> {
        const game = await this.gameModel.findById(session.gameId);
        if (!game) throw new Error('Game not found');

        //const grid = this.gridService.createGridFromGame(game);
        const startPoints = this.gridService.getStartPoints(game);

        const { startPoints: assignedPoints, players: assignedPlayers } = this.gridService.assignStartPoints(
            startPoints,
            session.players as InGamePlayer[],
        );

        const turnOrderIndex = this.gridService.getRandomTurnOrderIndex(assignedPlayers);
        const activePlayerId = assignedPlayers[turnOrderIndex[0]].id;

        const inGameSession = this.sessionService.create({
            baseSession: session,
            mapSize: game.size,
            mode: game.mode,
            startPoints: assignedPoints,
            turnOrderIndex,
            activePlayerId,
        });

        return inGameSession;
    }

    /** Rejoint une partie déjà initialisée */
    joinInGameSession(sessionId: string, playerId: string): InGameSession {
        return this.sessionService.join(sessionId, playerId);
    }

    /** Quitte une partie (et met à jour le tour si joueur actif) */
    leaveInGameSession(sessionId: string, playerId: string): InGameSession {
        return this.sessionService.leave(sessionId, playerId);
    }

    /** Démarre le premier tour */
    startGame(sessionId: string, callbacks: TurnCallbacks): void {
        this.turnMachine.startFirstTurn(sessionId, callbacks);
    }

    /** Fin manuelle du tour par le joueur actif */
    playerEndTurn(sessionId: string, playerId: string, callbacks: TurnCallbacks): void {
        this.turnMachine.playerEndTurn(sessionId, playerId, callbacks);
    }

    /** Forçage (timeout ou admin) */
    forceEndTurn(sessionId: string, callbacks: TurnCallbacks): void {
        this.turnMachine.forceEndTurn(sessionId, callbacks);
    }

    /** Récupère la session complète actuelle */
    getInGameSession(sessionId: string): InGameSession | undefined {
        return this.sessionService.get(sessionId);
    }

    /** Récupère le joueur actif */
    getCurrentPlayer(sessionId: string): InGamePlayer | undefined {
        return this.sessionService.getCurrentPlayer(sessionId);
    }
}
