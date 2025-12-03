import { VIRTUAL_PLAYER_ACTION_DELAY_MS, VIRTUAL_PLAYER_MOVEMENT_DELAY_MS } from '@app/constants/virtual-player.constants';
import { PathActionType } from '@app/enums/path-action-type.enum';
import { PointOfInterestType } from '@app/enums/point-of-interest-type.enum';
import { EvaluatedTarget } from '@app/interfaces/vp-gameplay.interface';
import { PathAction } from '@app/interfaces/vp-pathfinding.interface';
import { ActionService } from '@app/modules/in-game/services/action/action.service';
import { GameCacheService } from '@app/modules/in-game/services/game-cache/game-cache.service';
import { GameplayService } from '@app/modules/in-game/services/gameplay/gameplay.service';
import { InGameSessionRepository } from '@app/modules/in-game/services/in-game-session/in-game-session.repository';
import { VPGameplayService } from '@app/modules/in-game/services/vp-gameplay/vp-gameplay.service';
import { GameMode } from '@common/enums/game-mode.enum';
import { VirtualPlayerType } from '@common/enums/virtual-player-type.enum';
import { Player } from '@common/interfaces/player.interface';
import { Position } from '@common/interfaces/position.interface';
import { Injectable } from '@nestjs/common';

@Injectable()
export class VPExecutionService {
    constructor(
        private readonly gameplayService: GameplayService,
        private readonly vpGameplayService: VPGameplayService,
        private readonly sessionRepository: InGameSessionRepository,
        private readonly actionService: ActionService,
        private readonly gameCache: GameCacheService,
    ) {}

    executeVPTurn(sessionId: string, playerId: string, playerType: VirtualPlayerType): void {
        if (!this.canAct(sessionId, playerId)) {
            this.endVPTurn(sessionId, playerId);
            return;
        }

        const session = this.sessionRepository.findById(sessionId);
        const decision = this.vpGameplayService.makeDecision(session, playerId, playerType);

        if (!decision.target || !decision.target.path.reachable) {
            this.endVPTurn(sessionId, playerId);
            return;
        }

        const pathActions = [...decision.target.path.actions];
        this.executePathActions(sessionId, playerId, pathActions, decision.target, decision.useDoubleAction);
    }

    continueOrEndTurn(sessionId: string, playerId: string): void {
        const player = this.getValidPlayer(sessionId, playerId);

        if (!player) return;
        if (!player.virtualPlayerType) return;
        if (this.isInCombat(sessionId)) return;

        const hasResources = player.speed || player.boatSpeed || player.actionsRemaining;
        if (!hasResources) {
            this.endVPTurn(sessionId, playerId);
            return;
        }

        const vpType = player.virtualPlayerType;
        setTimeout(() => this.executeVPTurn(sessionId, playerId, vpType), VIRTUAL_PLAYER_ACTION_DELAY_MS);
    }

    private executePathActions(
        sessionId: string,
        playerId: string,
        remainingActions: PathAction[],
        target: EvaluatedTarget,
        useDoubleAction: boolean,
    ): void {
        const player = this.getValidPlayer(sessionId, playerId);
        if (!player || this.isInCombat(sessionId)) return;

        if (!remainingActions.length) {
            this.performTargetAction(sessionId, playerId, target, useDoubleAction);
            return;
        }

        const nextAction = remainingActions[0];

        if (!this.canExecutePathAction(player, nextAction)) {
            this.endVPTurn(sessionId, playerId);
            return;
        }

        remainingActions.shift();
        const success = this.executeSingleAction(sessionId, playerId, nextAction);

        if (!success) {
            if (this.tryAttackBlockingEnemy(sessionId, playerId, nextAction)) {
                return;
            }
            this.endVPTurn(sessionId, playerId);
            return;
        }

        const delay =
            nextAction.type === PathActionType.MOVE || nextAction.type === PathActionType.TELEPORT
                ? VIRTUAL_PLAYER_MOVEMENT_DELAY_MS
                : VIRTUAL_PLAYER_ACTION_DELAY_MS;
        setTimeout(() => this.executePathActions(sessionId, playerId, remainingActions, target, useDoubleAction), delay);
    }

    private canExecutePathAction(player: Player, action: PathAction): boolean {
        const isMoveAction = action.type === PathActionType.MOVE || action.type === PathActionType.TELEPORT;
        const isActionAction =
            action.type === PathActionType.OPENDOOR || action.type === PathActionType.BOARDBOAT || action.type === PathActionType.DISEMBARKBOAT;

        if (isMoveAction && !player.speed && !player.boatSpeed) return false;
        if (isActionAction && !player.actionsRemaining) return false;

        return true;
    }

    private executeSingleAction(sessionId: string, playerId: string, action: PathAction): boolean {
        try {
            switch (action.type) {
                case PathActionType.MOVE:
                case PathActionType.TELEPORT:
                    if (action.orientation) {
                        this.gameplayService.movePlayer(sessionId, playerId, action.orientation);
                    }
                    break;
                case PathActionType.OPENDOOR:
                    this.gameplayService.toggleDoorAction(sessionId, playerId, action.position);
                    break;
                case PathActionType.BOARDBOAT:
                    this.gameplayService.boardBoat(sessionId, playerId, action.position);
                    break;
                case PathActionType.DISEMBARKBOAT:
                    this.gameplayService.disembarkBoat(sessionId, playerId, action.position);
                    break;
                default:
                    return false;
            }
            return true;
        } catch {
            return false;
        }
    }

    private tryAttackBlockingEnemy(sessionId: string, playerId: string, failedAction: PathAction): boolean {
        if (failedAction.type !== PathActionType.MOVE || !failedAction.orientation) return false;

        const player = this.getValidPlayer(sessionId, playerId);
        if (!player || !player.actionsRemaining) return false;

        try {
            const playerPosition: Position = { x: player.x, y: player.y };
            const blockedPosition = this.gameCache.getNextPosition(sessionId, playerPosition, failedAction.orientation);
            const occupantId = this.gameCache.getTileOccupant(sessionId, blockedPosition);
            if (!occupantId) return false;

            const session = this.sessionRepository.findById(sessionId);
            if (!session) return false;

            const occupant = session.inGamePlayers[occupantId];
            if (!occupant || !occupant.health) return false;

            if (session.mode === GameMode.CTF && occupant.teamNumber === player.teamNumber) return false;

            this.actionService.attackPlayer(sessionId, playerId, blockedPosition);
            return true;
        } catch {
            return false;
        }
    }

    private performTargetAction(sessionId: string, playerId: string, target: EvaluatedTarget, useDoubleAction: boolean): void {
        const player = this.getValidPlayer(sessionId, playerId);
        if (!player || this.isInCombat(sessionId)) return;

        const requiresAction = [
            PointOfInterestType.ENEMY,
            PointOfInterestType.FLAGCARRIER,
            PointOfInterestType.HEALSANCTUARY,
            PointOfInterestType.FIGHTSANCTUARY,
            PointOfInterestType.FLAG,
        ].includes(target.type);
        if (requiresAction && !player.actionsRemaining) {
            this.endVPTurn(sessionId, playerId);
            return;
        }

        try {
            switch (target.type) {
                case PointOfInterestType.ENEMY:
                case PointOfInterestType.FLAGCARRIER:
                    this.actionService.attackPlayer(sessionId, playerId, target.position);
                    return;

                case PointOfInterestType.HEALSANCTUARY:
                    this.gameplayService.performSanctuaryAction(sessionId, playerId, target.position, false);
                    this.continueOrEndTurn(sessionId, playerId);
                    return;

                case PointOfInterestType.FIGHTSANCTUARY:
                    this.gameplayService.performSanctuaryAction(sessionId, playerId, target.position, useDoubleAction);
                    this.continueOrEndTurn(sessionId, playerId);
                    return;

                case PointOfInterestType.FLAG:
                case PointOfInterestType.ESCAPE:
                case PointOfInterestType.RETURNFLAG:
                    this.continueOrEndTurn(sessionId, playerId);
                    return;

                case PointOfInterestType.GUARDPOINT:
                    this.endVPTurn(sessionId, playerId);
                    return;
            }
        } catch {
            this.endVPTurn(sessionId, playerId);
        }
    }

    private getValidPlayer(sessionId: string, playerId: string): Player | null {
        try {
            const session = this.sessionRepository.findById(sessionId);
            const player = session?.inGamePlayers?.[playerId];

            if (!session || !player) return null;
            if (!player.health || !player.isInGame) return null;
            if (session.currentTurn.activePlayerId !== playerId) return null;

            return player;
        } catch {
            return null;
        }
    }

    private canAct(sessionId: string, playerId: string): boolean {
        return this.getValidPlayer(sessionId, playerId) !== null && !this.isInCombat(sessionId);
    }

    private isInCombat(sessionId: string): boolean {
        return this.actionService.getActiveCombat(sessionId) !== null;
    }

    private endVPTurn(sessionId: string, playerId: string): void {
        try {
            this.gameplayService.endPlayerTurn(sessionId, playerId);
        } catch {
            // Silent fail
        }
    }
}
