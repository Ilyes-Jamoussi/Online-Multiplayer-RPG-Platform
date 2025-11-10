import { TurnTimerStates } from '@app/enums/turn-timer-states.enum';
import { ActionService } from '@app/modules/in-game/services/action/action.service';
import { CombatService } from '@app/modules/in-game/services/combat/combat.service';
import { InGameSessionRepository } from '@app/modules/in-game/services/in-game-session/in-game-session.repository';
import { TimerService } from '@app/modules/in-game/services/timer/timer.service';
import { Game } from '@app/modules/game-store/entities/game.entity';
import { CombatPosture } from '@common/enums/combat-posture.enum';
import { Orientation } from '@common/enums/orientation.enum';
import { VirtualPlayerType } from '@common/enums/virtual-player-type.enum';
import { InGameSession } from '@common/interfaces/session.interface';
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';

@Injectable()
export class GameplayService {
    constructor(
        private readonly sessionRepository: InGameSessionRepository,
        private readonly actionService: ActionService,
        private readonly timerService: TimerService,
        private readonly combatService: CombatService,
    ) {}

    endPlayerTurn(sessionId: string, playerId: string): InGameSession {
        const session = this.sessionRepository.findById(sessionId);
        if (session.currentTurn.activePlayerId !== playerId) {
            throw new BadRequestException('Not your turn');
        }
        this.timerService.endTurnManual(session);
        return session;
    }

    toggleDoorAction(sessionId: string, playerId: string, x: number, y: number): void {
        const session = this.sessionRepository.findById(sessionId);
        const player = session.inGamePlayers[playerId];
        if (!player) throw new NotFoundException('Player not found');
        if (player.actionsRemaining === 0) throw new BadRequestException('No actions remaining');
        
        this.actionService.toggleDoor(session, playerId, x, y);
        player.actionsRemaining--;
        session.currentTurn.hasUsedAction = true;
        this.actionService.calculateReachableTiles(session, playerId);
        
        if (!player.actionsRemaining && !player.speed) {
            this.timerService.endTurnManual(session);
        }
    }

    movePlayer(sessionId: string, playerId: string, orientation: Orientation): void {
        const session = this.sessionRepository.findById(sessionId);
        if (playerId !== session.currentTurn.activePlayerId) throw new BadRequestException('Not your turn');
        if (this.timerService.getGameTimerState(sessionId) !== TurnTimerStates.PlayerTurn) throw new BadRequestException('Not your turn');

        const remainingSpeed = this.actionService.movePlayer(session, playerId, orientation);
        const availableActions = this.actionService.calculateAvailableActions(session, playerId);

        if (!remainingSpeed && !availableActions.length) {
            this.timerService.endTurnManual(session);
        }
    }

    getReachableTiles(sessionId: string, playerId: string): void {
        const session = this.sessionRepository.findById(sessionId);
        const player = session.inGamePlayers[playerId];
        const reachableTiles = this.actionService.calculateReachableTiles(session, playerId);
        if (!reachableTiles.length && !player.actionsRemaining) {
            this.timerService.endTurnManual(session);
        }
    }

    getAvailableActions(sessionId: string, playerId: string) {
        const session = this.sessionRepository.findById(sessionId);
        this.actionService.calculateAvailableActions(session, playerId);
    }

    toggleAdminMode(sessionId: string, playerId: string): InGameSession {
        const session = this.sessionRepository.findById(sessionId);
        const player = session.inGamePlayers[playerId];

        if (!player) {
            throw new NotFoundException('Player not found');
        }

        if (!player.isAdmin) {
            throw new BadRequestException('Only admin can toggle admin mode');
        }

        session.isAdminModeActive = !session.isAdminModeActive;
        this.sessionRepository.update(session);
        return session;
    }

    teleportPlayer(sessionId: string, playerId: string, x: number, y: number): void {
        const session = this.sessionRepository.findById(sessionId);

        if (!session.isAdminModeActive) {
            throw new BadRequestException('Admin mode not active');
        }

        if (session.currentTurn.activePlayerId !== playerId) {
            throw new BadRequestException('Not your turn');
        }

        if (!this.actionService.isTileFree(sessionId, x, y)) {
            throw new BadRequestException('Tile is not free');
        }

        this.sessionRepository.movePlayerPosition(sessionId, playerId, x, y, 0);
        this.actionService.calculateReachableTiles(session, playerId);
        this.actionService.calculateAvailableActions(session, playerId);
    }

    async fetchAndCacheGame(sessionId: string, gameId: string): Promise<Game> {
        return await this.actionService.fetchAndCacheGame(sessionId, gameId);
    }

    handleCombatForVirtualPlayers(sessionId: string, playerAId: string, playerBId: string): void {
        const session = this.sessionRepository.findById(sessionId);
        
        [playerAId, playerBId].forEach(playerId => {
            const player = session.inGamePlayers[playerId];
            if (player?.virtualPlayerType) {
                const posture = player.virtualPlayerType === VirtualPlayerType.Offensive 
                    ? CombatPosture.OFFENSIVE 
                    : CombatPosture.DEFENSIVE;
                
                setTimeout(() => {
                    this.combatService.combatChoice(sessionId, playerId, posture);
                }, Math.random() * 5000);
            }
        });
    }

    // API pour VirtualPlayerService
    getSessionData(sessionId: string): InGameSession {
        return this.sessionRepository.findById(sessionId);
    }

    getPlayerReachableTiles(sessionId: string, playerId: string): any[] {
        const session = this.sessionRepository.findById(sessionId);
        return this.actionService.calculateReachableTiles(session, playerId);
    }

    getPlayerAvailableActions(sessionId: string, playerId: string): any[] {
        const session = this.sessionRepository.findById(sessionId);
        return this.actionService.calculateAvailableActions(session, playerId);
    }

    attackPlayer(sessionId: string, playerId: string, targetX: number, targetY: number): void {
        this.combatService.attackPlayerAction(sessionId, playerId, targetX, targetY);
    }

    // IA Strategies
    playOffensiveTurn(sessionId: string, playerId: string): void {
        const session = this.sessionRepository.findById(sessionId);
        const reachableTiles = this.actionService.calculateReachableTiles(session, playerId);
        const availableActions = this.actionService.calculateAvailableActions(session, playerId);
        
        // Chercher cibles attaquables
        const attackableTargets = this.findAttackableTargets(session, playerId, reachableTiles);
        
        if (attackableTargets.length > 0) {
            const target = attackableTargets[Math.floor(Math.random() * attackableTargets.length)];
            this.executeAttackSequence(sessionId, playerId, target);
        } else {
            this.moveTowardsNearestEnemy(sessionId, playerId, session, reachableTiles);
        }
    }

    playDefensiveTurn(sessionId: string, playerId: string): void {
        const session = this.sessionRepository.findById(sessionId);
        const reachableTiles = this.actionService.calculateReachableTiles(session, playerId);
        
        const safestPosition = this.findSafestPosition(session, playerId, reachableTiles);
        if (safestPosition) {
            this.moveToPosition(sessionId, playerId, safestPosition);
        }
    }

    private findAttackableTargets(session: InGameSession, playerId: string, reachableTiles: any[]): any[] {
        const targets = [];
        const otherPlayers = Object.entries(session.inGamePlayers).filter(([id]) => id !== playerId);
        
        for (const tile of reachableTiles) {
            for (const [targetId, targetPlayer] of otherPlayers) {
                if (Math.abs(tile.x - targetPlayer.x) + Math.abs(tile.y - targetPlayer.y) === 1) {
                    targets.push({ targetId, targetPlayer, fromTile: tile });
                }
            }
        }
        return targets;
    }

    private executeAttackSequence(sessionId: string, playerId: string, target: any): void {
        this.moveToPosition(sessionId, playerId, target.fromTile);
        this.combatService.attackPlayerAction(sessionId, playerId, target.targetPlayer.x, target.targetPlayer.y);
    }

    private moveTowardsNearestEnemy(sessionId: string, playerId: string, session: InGameSession, reachableTiles: any[]): void {
        const currentPlayer = session.inGamePlayers[playerId];
        const otherPlayers = Object.values(session.inGamePlayers).filter(p => p.id !== playerId);
        
        if (otherPlayers.length === 0) return;
        
        let nearestPlayer = null;
        let minDistance = Infinity;
        
        for (const player of otherPlayers) {
            const distance = Math.abs(currentPlayer.x - player.x) + Math.abs(currentPlayer.y - player.y);
            if (distance < minDistance) {
                minDistance = distance;
                nearestPlayer = player;
            }
        }
        
        if (!nearestPlayer) return;
        
        const bestTile = reachableTiles.reduce((best, tile) => {
            const distance = Math.abs(tile.x - nearestPlayer.x) + Math.abs(tile.y - nearestPlayer.y);
            return !best || distance < best.distance ? { tile, distance } : best;
        }, null);
        
        if (bestTile) {
            this.moveToPosition(sessionId, playerId, bestTile.tile);
        }
    }

    private findSafestPosition(session: InGameSession, playerId: string, reachableTiles: any[]): any {
        const otherPlayers = Object.values(session.inGamePlayers).filter(p => p.id !== playerId);
        
        return reachableTiles.reduce((safest, tile) => {
            const avgDistance = otherPlayers.reduce((sum, player) => 
                sum + Math.abs(tile.x - player.x) + Math.abs(tile.y - player.y), 0) / otherPlayers.length;
            
            return !safest || avgDistance > safest.avgDistance ? { tile, avgDistance } : safest;
        }, null)?.tile;
    }

    private moveToPosition(sessionId: string, playerId: string, targetPosition: any): void {
        const session = this.sessionRepository.findById(sessionId);
        const currentPlayer = session.inGamePlayers[playerId];
        
        const dx = targetPosition.x - currentPlayer.x;
        const dy = targetPosition.y - currentPlayer.y;
        
        const direction = Math.abs(dx) > Math.abs(dy) 
            ? (dx > 0 ? Orientation.E : Orientation.W)
            : (dy > 0 ? Orientation.S : Orientation.N);
        
        try {
            this.movePlayer(sessionId, playerId, direction);
        } catch {
            // Mouvement impossible
        }
    }

    clearSessionResources(sessionId: string): void {
        this.actionService.clearSessionGameCache(sessionId);
        this.actionService.clearActiveCombatForSession(sessionId);
    }
}
