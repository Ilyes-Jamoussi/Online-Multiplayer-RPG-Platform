import { InGameSessionRepository } from '@app/modules/in-game/services/in-game-session/in-game-session.repository';
import { GameLogEventType } from '@common/enums/game-log-event-type.enum';
import { Injectable } from '@nestjs/common';

@Injectable()
export class GameLogService {
    constructor(private readonly inGameSessionRepository: InGameSessionRepository) {}

    createTurnStartEntry(sessionId: string, playerId: string): {
        type: GameLogEventType;
        message: string;
        involvedPlayerIds: string[];
        involvedPlayerNames: string[];
        icon: string;
    } {
        const session = this.inGameSessionRepository.findById(sessionId);
        const player = session.inGamePlayers[playerId];

        return {
            type: GameLogEventType.TurnStart,
            message: `Début de tour : ${player.name}`,
            involvedPlayerIds: [playerId],
            involvedPlayerNames: [player.name],
            icon: 'HourglassStart',
        };
    }

    createCombatStartEntry(sessionId: string, attackerId: string, targetId: string): {
        type: GameLogEventType;
        message: string;
        involvedPlayerIds: string[];
        involvedPlayerNames: string[];
        icon: string;
    } {
        const session = this.inGameSessionRepository.findById(sessionId);
        const attacker = session.inGamePlayers[attackerId];
        const target = session.inGamePlayers[targetId];

        return {
            type: GameLogEventType.CombatStart,
            message: `Combat : ${attacker.name} contre ${target.name}`,
            involvedPlayerIds: [attackerId, targetId],
            involvedPlayerNames: [attacker.name, target.name],
            icon: 'ShieldHalved',
        };
    }

    createCombatEndEntry(sessionId: string, playerAId: string, playerBId: string, winnerId: string | null): {
        type: GameLogEventType;
        message: string;
        involvedPlayerIds: string[];
        involvedPlayerNames: string[];
        icon: string;
    } {
        const session = this.inGameSessionRepository.findById(sessionId);
        const playerA = session.inGamePlayers[playerAId];
        const playerB = session.inGamePlayers[playerBId];

        let message: string;
        if (winnerId === null) {
            message = `Combat : ${playerA.name} et ${playerB.name} ont fait match nul`;
        } else {
            const winner = session.inGamePlayers[winnerId];
            const loser = winnerId === playerAId ? playerB : playerA;
            message = `Combat : ${winner.name} vainqueur contre ${loser.name}`;
        }

        return {
            type: GameLogEventType.CombatEnd,
            message,
            involvedPlayerIds: [playerAId, playerBId],
            involvedPlayerNames: [playerA.name, playerB.name],
            icon: 'ShieldHalved',
        };
    }

    createCombatResultEntry(
        sessionId: string,
        attackerId: string,
        targetId: string,
        attackerAttack: { diceRoll: number; baseAttack: number; attackBonus: number; totalAttack: number },
        targetDefense: { diceRoll: number; baseDefense: number; defenseBonus: number; totalDefense: number },
        damage: number,
    ): {
        type: GameLogEventType;
        message: string;
        involvedPlayerIds: string[];
        involvedPlayerNames: string[];
        icon: string;
        metadata: Record<string, unknown>;
    } {
        const session = this.inGameSessionRepository.findById(sessionId);
        const attacker = session.inGamePlayers[attackerId];
        const target = session.inGamePlayers[targetId];

        const attackTotal = attackerAttack.totalAttack;
        const defenseTotal = targetDefense.totalDefense;
        const damageValue = damage;

        const message = `Attaque ${attacker.name} vs ${target.name} (A:${attackerAttack.diceRoll}+${attackerAttack.baseAttack}+${attackerAttack.attackBonus} - D:${targetDefense.diceRoll}+${targetDefense.baseDefense}+${targetDefense.defenseBonus} = ${damageValue > 0 ? '+' : ''}${damageValue})`;

        return {
            type: GameLogEventType.CombatResult,
            message,
            involvedPlayerIds: [attackerId, targetId],
            involvedPlayerNames: [attacker.name, target.name],
            icon: 'Bolt',
            metadata: {
                attackerId,
                targetId,
                attackTotal,
                defenseTotal,
                damage: damageValue,
            },
        };
    }

    createDoorToggleEntry(sessionId: string, playerId: string, x: number, y: number, isOpen: boolean): {
        type: GameLogEventType;
        message: string;
        involvedPlayerIds: string[];
        involvedPlayerNames: string[];
        icon: string;
    } {
        const session = this.inGameSessionRepository.findById(sessionId);
        const player = session.inGamePlayers[playerId];

        const action = isOpen ? 'ouverte' : 'fermée';
        return {
            type: GameLogEventType.DoorToggle,
            message: `Porte ${action} à (${x}, ${y}) par ${player.name}`,
            involvedPlayerIds: [playerId],
            involvedPlayerNames: [player.name],
            icon: 'Lock',
        };
    }

    createDebugModeToggleEntry(sessionId: string, playerId: string, isActive: boolean): {
        type: GameLogEventType;
        message: string;
        involvedPlayerIds: string[];
        involvedPlayerNames: string[];
        icon: string;
    } {
        const session = this.inGameSessionRepository.findById(sessionId);
        const player = session.inGamePlayers[playerId];

        const action = isActive ? 'activé' : 'désactivé';
        return {
            type: GameLogEventType.DebugModeToggle,
            message: `Mode débogage: ${action}`,
            involvedPlayerIds: [playerId],
            involvedPlayerNames: [player.name],
            icon: 'Gear',
        };
    }

    createPlayerAbandonEntry(sessionId: string, playerId: string): {
        type: GameLogEventType;
        message: string;
        involvedPlayerIds: string[];
        involvedPlayerNames: string[];
        icon: string;
    } {
        const session = this.inGameSessionRepository.findById(sessionId);
        const player = session.inGamePlayers[playerId];

        return {
            type: GameLogEventType.GameAbandon,
            message: `${player.name} a abandonné la partie`,
            involvedPlayerIds: [playerId],
            involvedPlayerNames: [player.name],
            icon: 'UserMinus',
        };
    }

    createGameOverEntry(sessionId: string): {
        type: GameLogEventType;
        message: string;
        involvedPlayerIds: string[];
        involvedPlayerNames: string[];
        icon: string;
    } {
        const session = this.inGameSessionRepository.findById(sessionId);
        const activePlayers = Object.values(session.inGamePlayers).filter((p) => p.isInGame);
        const activePlayerNames = activePlayers.map((p) => p.name);
        const activePlayerIds = activePlayers.map((p) => p.id);

        const playersList = activePlayerNames.join(', ');
        return {
            type: GameLogEventType.GameOver,
            message: `Fin de partie. Joueurs actifs: ${playersList}`,
            involvedPlayerIds: activePlayerIds,
            involvedPlayerNames: activePlayerNames,
            icon: 'Check',
        };
    }

    createBoatEmbarkEntry(sessionId: string, playerId: string): {
        type: GameLogEventType;
        message: string;
        involvedPlayerIds: string[];
        involvedPlayerNames: string[];
        icon: string;
    } {
        const session = this.inGameSessionRepository.findById(sessionId);
        const player = session.inGamePlayers[playerId];

        return {
            type: GameLogEventType.BoatEmbark,
            message: `${player.name} a embarqué sur un bateau`,
            involvedPlayerIds: [playerId],
            involvedPlayerNames: [player.name],
            icon: 'Anchor',
        };
    }

    createBoatDisembarkEntry(sessionId: string, playerId: string): {
        type: GameLogEventType;
        message: string;
        involvedPlayerIds: string[];
        involvedPlayerNames: string[];
        icon: string;
    } {
        const session = this.inGameSessionRepository.findById(sessionId);
        const player = session.inGamePlayers[playerId];

        return {
            type: GameLogEventType.BoatDisembark,
            message: `${player.name} a débarqué d'un bateau`,
            involvedPlayerIds: [playerId],
            involvedPlayerNames: [player.name],
            icon: 'Anchor',
        };
    }

    createSanctuaryUseEntry(
        sessionId: string,
        playerId: string,
        kind: string,
        x: number,
        y: number,
        addedHealth?: number,
        addedDefense?: number,
        addedAttack?: number,
    ): {
        type: GameLogEventType;
        message: string;
        involvedPlayerIds: string[];
        involvedPlayerNames: string[];
        icon: string;
    } {
        const session = this.inGameSessionRepository.findById(sessionId);
        const player = session.inGamePlayers[playerId];

        let message: string;
        const kindStr = String(kind);
        if (kindStr === 'HEAL' && addedHealth) {
            message = `${player.name} a utilisé un sanctuaire de soin à (${x}, ${y}) (+${addedHealth} santé)`;
        } else if (kindStr === 'FIGHT' && (addedDefense || addedAttack)) {
            const bonus = addedDefense || addedAttack || 0;
            message = `${player.name} a utilisé un sanctuaire de combat à (${x}, ${y}) (+${bonus} attaque/défense)`;
        } else {
            message = `${player.name} a utilisé un sanctuaire à (${x}, ${y})`;
        }

        return {
            type: GameLogEventType.SanctuaryUse,
            message,
            involvedPlayerIds: [playerId],
            involvedPlayerNames: [player.name],
            icon: 'Heart',
        };
    }

    createTeleportEntry(
        sessionId: string,
        playerId: string,
        originX: number,
        originY: number,
        destinationX: number,
        destinationY: number,
    ): {
        type: GameLogEventType;
        message: string;
        involvedPlayerIds: string[];
        involvedPlayerNames: string[];
        icon: string;
    } {
        const session = this.inGameSessionRepository.findById(sessionId);
        const player = session.inGamePlayers[playerId];

        return {
            type: GameLogEventType.Teleport,
            message: `${player.name} s'est téléporté de (${originX}, ${originY}) → (${destinationX}, ${destinationY})`,
            involvedPlayerIds: [playerId],
            involvedPlayerNames: [player.name],
            icon: 'LocationDot',
        };
    }
}

