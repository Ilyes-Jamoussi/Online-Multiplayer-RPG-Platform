import { VIRTUAL_PLAYER_ACTION_DELAY_MS, VIRTUAL_PLAYER_MOVEMENT_DELAY_MS } from '@app/constants/virtual-player.constants';
import { EvaluatedTarget, VPDecision } from '@app/interfaces/vp-gameplay.interface';
import { PathAction } from '@app/interfaces/vp-pathfinding.interface';
import { ActionService } from '@app/modules/in-game/services/action/action.service';
import { GameplayService } from '@app/modules/in-game/services/gameplay/gameplay.service';
import { InGameSessionRepository } from '@app/modules/in-game/services/in-game-session/in-game-session.repository';
import { VPGameplayService } from '@app/modules/in-game/services/vp-gameplay/vp-gameplay.service';
import { PlaceableKind } from '@common/enums/placeable-kind.enum';
import { VirtualPlayerType } from '@common/enums/virtual-player-type.enum';
import { Position } from '@common/interfaces/position.interface';
import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class VPExecutionService {
    private readonly logger = new Logger(VPExecutionService.name);

    constructor(
        private readonly gameplayService: GameplayService,
        private readonly vpGameplayService: VPGameplayService,
        private readonly sessionRepository: InGameSessionRepository,
        private readonly actionService: ActionService,
    ) {}

    executeVPTurn(sessionId: string, playerId: string, playerType: VirtualPlayerType): void {
        if (!this.isPlayerValid(sessionId, playerId)) return;
        if (this.isInCombat(sessionId)) return;

        const session = this.sessionRepository.findById(sessionId);
        const decision = this.vpGameplayService.makeDecision(session, playerId, playerType);

        this.logPath(decision);

        if (decision.target && decision.target.path.reachable) {
            this.executeDecision(sessionId, playerId, decision);
        } else {
            this.endVPTurn(sessionId, playerId);
        }
    }

    continueOrEndTurn(sessionId: string, playerId: string): void {
        if (!this.isPlayerValid(sessionId, playerId)) return;
        if (this.isInCombat(sessionId)) return;

        const session = this.sessionRepository.findById(sessionId);
        const player = session.inGamePlayers[playerId];

        const canContinue = player.health > 0 && (player.speed > 0 || player.actionsRemaining > 0);

        if (canContinue && player.virtualPlayerType) {
            const vpType = player.virtualPlayerType;
            setTimeout(() => this.executeVPTurn(sessionId, playerId, vpType), VIRTUAL_PLAYER_ACTION_DELAY_MS);
        }
    }

    private executeDecision(sessionId: string, playerId: string, decision: VPDecision): void {
        if (!decision.target) return;

        const pathActions = [...decision.target.path.actions];
        this.executeNextPathAction(sessionId, playerId, pathActions, decision.target, decision.useDoubleAction);
    }

    private executeNextPathAction(
        sessionId: string,
        playerId: string,
        remainingActions: PathAction[],
        target: EvaluatedTarget,
        useDoubleAction: boolean,
    ): void {
        if (!this.isPlayerValid(sessionId, playerId)) return;
        if (this.isInCombat(sessionId)) return;

        if (remainingActions.length === 0) {
            this.performTargetAction(sessionId, playerId, target, useDoubleAction);
            return;
        }

        const action = remainingActions.shift();
        if (!action) return;

        const success = this.executeSingleAction(sessionId, playerId, action);

        if (success) {
            const delay = action.type === 'move' ? VIRTUAL_PLAYER_MOVEMENT_DELAY_MS : VIRTUAL_PLAYER_ACTION_DELAY_MS;
            setTimeout(() => this.executeNextPathAction(sessionId, playerId, remainingActions, target, useDoubleAction), delay);
        } else {
            this.continueOrEndTurn(sessionId, playerId);
        }
    }

    private executeSingleAction(sessionId: string, playerId: string, action: PathAction): boolean {
        try {
            switch (action.type) {
                case 'move':
                    if (action.orientation) {
                        this.gameplayService.movePlayer(sessionId, playerId, action.orientation);
                    }
                    break;

                case 'openDoor':
                    this.gameplayService.toggleDoorAction(sessionId, playerId, action.position);
                    break;

                case 'boardBoat':
                    this.gameplayService.boardBoat(sessionId, playerId, action.position);
                    break;

                case 'disembarkBoat':
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

    private performTargetAction(sessionId: string, playerId: string, target: EvaluatedTarget, useDoubleAction: boolean): void {
        if (!this.isPlayerValid(sessionId, playerId)) return;
        if (this.isInCombat(sessionId)) return;

        const session = this.sessionRepository.findById(sessionId);
        const player = session.inGamePlayers[playerId];

        if (player.actionsRemaining === 0) {
            this.endVPTurn(sessionId, playerId);
            return;
        }

        try {
            switch (target.type) {
                case 'enemy': {
                    const attacked = this.attackEnemy(sessionId, playerId, target.position);
                    if (attacked) return;
                    break;
                }

                case 'healSanctuary':
                    this.useSanctuary(sessionId, playerId, target.position, PlaceableKind.HEAL, false);
                    break;

                case 'fightSanctuary':
                    this.useSanctuary(sessionId, playerId, target.position, PlaceableKind.FIGHT, useDoubleAction);
                    break;

                case 'flag':
                    this.pickUpFlag(sessionId, playerId, target.position);
                    break;
            }
        } catch {
            // Silent fail
        }

        setTimeout(() => this.endVPTurn(sessionId, playerId), VIRTUAL_PLAYER_ACTION_DELAY_MS);
    }

    private attackEnemy(sessionId: string, playerId: string, targetPosition: Position): boolean {
        const session = this.sessionRepository.findById(sessionId);
        const player = session?.inGamePlayers?.[playerId];

        if (!player || player.actionsRemaining === 0) return false;

        this.actionService.attackPlayer(sessionId, playerId, targetPosition);
        return true;
    }

    private useSanctuary(
        sessionId: string,
        playerId: string,
        position: Position,
        kind: PlaceableKind.HEAL | PlaceableKind.FIGHT,
        double: boolean,
    ): void {
        this.gameplayService.performSanctuaryAction(sessionId, playerId, position, double);
    }

    private pickUpFlag(sessionId: string, playerId: string, position: Position): void {
        this.gameplayService.pickUpFlag(sessionId, playerId, position);
    }

    private isPlayerValid(sessionId: string, playerId: string): boolean {
        try {
            const session = this.sessionRepository.findById(sessionId);
            const player = session?.inGamePlayers?.[playerId];

            if (!session || !player) return false;
            if (player.health <= 0) return false;

            return true;
        } catch {
            return false;
        }
    }

    private isInCombat(sessionId: string): boolean {
        const activeCombat = this.actionService.getActiveCombat(sessionId);
        return activeCombat !== null;
    }

    private endVPTurn(sessionId: string, playerId: string): void {
        try {
            this.gameplayService.endPlayerTurn(sessionId, playerId);
        } catch {
            // Silent fail
        }
    }

    private logPath(decision: VPDecision): void {
        if (decision.target?.path.actions.length) {
            const actionSequence = decision.target.path.actions
                .map((a) => (a.type === 'move' ? a.orientation : a.type.toUpperCase()))
                .join(' ');
            this.logger.debug(`VP Path: ${actionSequence}`);
        }
    }
}
